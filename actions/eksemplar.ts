"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findRakIdForKlasifikasi } from "@/lib/rak";
import {
  DURASI_PINJAM_HARI,
  DENDA_PER_HARI,
  MAX_JUDUL_PINJAM,
} from "@/lib/constants";
import { hitungDenda } from "@/lib/utils";
import { requireAdminSession } from "@/lib/security";

/**
 * Generate N eksemplar untuk 1 buku. Kode 8-digit sequential, rak auto-assign
 * dari klasifikasi DDC buku. Sinkron stok_total/stok_tersedia.
 */
export async function generateEksemplar(bukuId: string, jumlah: number) {
  await requireAdminSession();
  if (!bukuId || jumlah < 1 || jumlah > 500) {
    throw new Error("Jumlah eksemplar tidak valid (1-500)");
  }

  const buku = await prisma.buku.findUnique({ where: { id: bukuId } });
  if (!buku) throw new Error("Buku tidak ditemukan");

  const rakId = await findRakIdForKlasifikasi(buku.klasifikasi);

  // Ambil counter sekali di dalam transaction, hemat query
  const data = await prisma.$transaction(async (tx) => {
    const last = await tx.eksemplar.findFirst({
      orderBy: { kode: "desc" },
      select: { kode: true },
    });
    let kodeNum = last ? parseInt(last.kode, 10) : 0;

    const rows = [];
    for (let i = 0; i < jumlah; i++) {
      kodeNum += 1;
      rows.push({
        kode: kodeNum.toString().padStart(8, "0"),
        bukuId,
        rakId,
        tipe_koleksi: buku.tipe_buku === "MAPEL" ? "Textbook" : "Reference",
        status: "TERSEDIA" as const,
      });
    }

    await tx.eksemplar.createMany({ data: rows });

    const tersediaSekarang = rows.filter((r) => r.status === "TERSEDIA").length;
    await tx.buku.update({
      where: { id: bukuId },
      data: {
        stok_total: { increment: jumlah },
        stok_tersedia: { increment: tersediaSekarang },
      },
    });

    return rows;
  });

  revalidatePath(`/admin/buku/${bukuId}/eksemplar`);
  revalidatePath("/admin/buku");
  revalidatePath("/admin");

  return data.map((d) => d.kode);
}

/**
 * Update status eksemplar (RUSAK / HILANG / TERSEDIA). Sinkron stok_tersedia.
 */
export async function updateStatusEksemplar(
  id: string,
  status: "TERSEDIA" | "DIPINJAM" | "RUSAK" | "HILANG"
) {
  await requireAdminSession();
  const eks = await prisma.eksemplar.findUnique({
    where: { id },
    include: { buku: true },
  });
  if (!eks) throw new Error("Eksemplar tidak ditemukan");

  await prisma.$transaction([
    prisma.eksemplar.update({ where: { id }, data: { status } }),
    // stok_tersedia hanya ikut hitung untuk status yang benar-benar dipakai
    ...(eks.status !== status
      ? [
          prisma.buku.update({
            where: { id: eks.bukuId },
            data: {
              stok_tersedia: {
                increment:
                  (status === "TERSEDIA" ? 1 : 0) -
                  (eks.status === "TERSEDIA" ? 1 : 0),
              },
            },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/admin/buku/${eks.bukuId}/eksemplar`);
  revalidatePath("/admin/buku");
  revalidatePath("/admin");
}

// ============================================================
// MODE SIRKULASI SCANNER
// ============================================================

export type ScanResult = {
  ok: boolean;
  pesan: string;
  aksi?: "PINJAM" | "KEMBALI";
  transaksi?: {
    id: string;
    judul: string;
    batas_kembali: string;
    denda: number;
  };
};

/**
 * Cari anggota dari scan kartu (no_anggota A0001 atau NISN 10 digit).
 */
export async function scanAnggota(kode: string) {
  await requireAdminSession();
  const value = kode.trim();
  if (!value) {
    return { ok: false, pesan: "Kode kartu kosong" } as ScanResult;
  }

  const anggota = await prisma.anggota.findFirst({
    where: {
      OR: [{ no_anggota: value }, { nisn: value }],
      status_aktif: true,
    },
    include: {
      kelasRef: true,
      transaksi: {
        where: { status: "DIPINJAM" },
        include: { buku: true },
        take: 20,
      },
    },
  });

  if (!anggota) {
    return {
      ok: false,
      pesan: `Anggota dengan kode "${value}" tidak ditemukan atau non-aktif`,
    } as ScanResult;
  }

  return {
    ok: true,
    pesan: "Anggota ditemukan",
    anggota: {
      id: anggota.id,
      no_anggota: anggota.no_anggota,
      nama: anggota.nama,
      jenis: anggota.jenis,
      nisn: anggota.nisn,
      kelas: anggota.kelasRef?.nama_kelas ?? null,
      telepon: anggota.telepon,
      sedangDipinjam: anggota.transaksi.length,
      pinjaman: anggota.transaksi.map((t) => ({
        id: t.id,
        judul: t.buku?.judul ?? "N/A",
        batas_kembali: t.batas_kembali.toISOString(),
        perpanjangan_count: t.perpanjangan_count,
        denda: t.denda,
      })),
    },
  };
}

/**
 * Scan eksemplar di mode sirkulasi:
 * - TERSEDIA -> PINJAM ke anggota
 * - DIPINJAM oleh anggota ini -> KEMBALI + denda
 * - DIPINJAM orang lain -> tolak
 */
export async function scanEksemplar(
  anggotaId: string,
  kode: string
): Promise<ScanResult> {
  await requireAdminSession();
  const value = kode.trim();
  if (!anggotaId || !value) {
    return { ok: false, pesan: "Data scan tidak lengkap" };
  }

  const anggota = await prisma.anggota.findUnique({
    where: { id: anggotaId },
  });
  if (!anggota || !anggota.status_aktif) {
    return { ok: false, pesan: "Anggota tidak valid" };
  }

  const eks = await prisma.eksemplar.findUnique({
    where: { kode: value },
    include: { buku: true },
  });
  if (!eks) {
    return { ok: false, pesan: `Kode eksemplar "${value}" tidak ditemukan` };
  }

  // Sedang dipinjam? cek kepemilikan
  const aktif = await prisma.transaksi.findFirst({
    where: { eksemplarId: eks.id, status: "DIPINJAM" },
    include: { anggota: true },
  });

  if (aktif) {
    if (aktif.anggotaId !== anggotaId) {
      return {
        ok: false,
        pesan: `"${eks.buku.judul}" dipinjam ${aktif.anggota?.nama ?? "anggota lain"}`,
      };
    }

    // KEMBALI
    const sekarang = new Date();
    const denda = hitungDenda(aktif.batas_kembali, sekarang, DENDA_PER_HARI);

    await prisma.$transaction([
      prisma.transaksi.update({
        where: { id: aktif.id },
        data: { tgl_dikembalikan: sekarang, denda, status: "SELESAI" },
      }),
      prisma.eksemplar.update({
        where: { id: eks.id },
        data: { status: "TERSEDIA" },
      }),
      prisma.buku.update({
        where: { id: eks.bukuId },
        data: { stok_tersedia: { increment: 1 } },
      }),
    ]);

    revalidatePath("/admin/sirkulasi");
    revalidatePath("/admin/transaksi");
    revalidatePath("/admin");

    return {
      ok: true,
      aksi: "KEMBALI",
      pesan: `Dikembalikan: ${eks.buku.judul}${denda > 0 ? ` — denda Rp${denda.toLocaleString("id-ID")}` : ""}`,
      transaksi: {
        id: aktif.id,
        judul: eks.buku.judul,
        batas_kembali: aktif.batas_kembali.toISOString(),
        denda,
      },
    };
  }

  // PINJAM
  if (eks.status !== "TERSEDIA") {
    return {
      ok: false,
      pesan: `"${eks.buku.judul}" berstatus ${eks.status}, tidak bisa dipinjam`,
    };
  }

  // Koleksi Referensi (awalan R di call number) — hanya baca di tempat
  if (eks.buku.is_referensi) {
    return {
      ok: false,
      pesan: `"${eks.buku.judul}" koleksi referensi — hanya bisa dibaca di tempat`,
    };
  }

  // Kuota: maksimal MAX_JUDUL_PINJAM judul dalam 7 hari
  const sedangDipinjam = await prisma.transaksi.count({
    where: { anggotaId, status: "DIPINJAM" },
  });
  if (sedangDipinjam >= MAX_JUDUL_PINJAM) {
    return {
      ok: false,
      pesan: `Kuota penuh: ${sedangDipinjam} dari ${MAX_JUDUL_PINJAM} judul. Kembalikan dulu.`,
    };
  }

  // Blokir denda aktif: buku terlambat yang belum dikembalikan
  const terlambat = await prisma.transaksi.count({
    where: {
      anggotaId,
      status: "DIPINJAM",
      batas_kembali: { lt: new Date() },
    },
  });
  if (terlambat > 0) {
    return {
      ok: false,
      pesan: `Gagal: ${terlambat} buku sudah lewat batas. Kembalikan & lunasi denda dulu.`,
    };
  }

  // Blokir denda belum dibayar dari transaksi selesai
  const dendaOutstanding = await prisma.transaksi.aggregate({
    where: { anggotaId, denda: { gt: 0 }, status: "SELESAI" },
    _sum: { denda: true },
  });
  const totalDenda = dendaOutstanding._sum.denda ?? 0;
  if (totalDenda > 0) {
    return {
      ok: false,
      pesan: `Gagal: ada denda belum dibayar Rp${totalDenda.toLocaleString("id-ID")}`,
    };
  }

  const tgl_pinjam = new Date();
  const batas_kembali = new Date(tgl_pinjam);
  const isMapel = eks.buku.tipe_buku === "MAPEL";
  if (isMapel) {
    // Sampai akhir tahun ajaran (Juni)
    const tahun =
      tgl_pinjam.getMonth() >= 6
        ? tgl_pinjam.getFullYear() + 1
        : tgl_pinjam.getFullYear();
    batas_kembali.setFullYear(tahun);
    batas_kembali.setMonth(5);
    batas_kembali.setDate(30);
  } else {
    batas_kembali.setDate(batas_kembali.getDate() + DURASI_PINJAM_HARI);
  }

  await prisma.$transaction([
    prisma.transaksi.create({
      data: {
        anggotaId,
        bukuId: eks.bukuId,
        eksemplarId: eks.id,
        tgl_pinjam,
        batas_kembali,
        status: "DIPINJAM",
        jenis_peminjaman: isMapel ? "PAKET" : "INDIVIDUAL",
        tipe_buku: eks.buku.tipe_buku,
      },
    }),
    prisma.eksemplar.update({
      where: { id: eks.id },
      data: { status: "DIPINJAM" },
    }),
    prisma.buku.update({
      where: { id: eks.bukuId },
      data: { stok_tersedia: { decrement: 1 } },
    }),
  ]);

  revalidatePath("/admin/sirkulasi");
  revalidatePath("/admin/transaksi");
  revalidatePath("/admin");

  return {
    ok: true,
    aksi: "PINJAM",
    pesan: `Dipinjam: ${eks.buku.judul} — kembali ${batas_kembali.toLocaleDateString("id-ID")}`,
    transaksi: {
      id: eks.id,
      judul: eks.buku.judul,
      batas_kembali: batas_kembali.toISOString(),
      denda: 0,
    },
  };
}

/**
 * Perpanjang masa pinjam (maksimal 1x periode).
 */
export async function perpanjangPinjaman(transaksiId: string): Promise<ScanResult> {
  await requireAdminSession();
  if (!transaksiId) return { ok: false, pesan: "ID transaksi kosong" };

  const t = await prisma.transaksi.findUnique({
    where: { id: transaksiId },
    include: { anggota: true },
  });
  if (!t || t.status !== "DIPINJAM") {
    return { ok: false, pesan: "Transaksi tidak aktif" };
  }
  if (t.perpanjangan_count >= 1) {
    return { ok: false, pesan: "Sudah perpanjang 1x. Wajib kembalikan." };
  }

  const baru = new Date(t.batas_kembali);
  baru.setDate(baru.getDate() + DURASI_PINJAM_HARI);

  await prisma.transaksi.update({
    where: { id: transaksiId },
    data: { batas_kembali: baru, perpanjangan_count: { increment: 1 } },
  });

  revalidatePath("/admin/sirkulasi");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    aksi: "PINJAM",
    pesan: `Diperpanjang: ${t.bukuId} — kembali ${baru.toLocaleDateString("id-ID")}`,
  };
}
