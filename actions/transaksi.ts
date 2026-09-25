"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DURASI_PINJAM_HARI, DENDA_PER_HARI } from "@/lib/constants";
import { hitungDenda } from "@/lib/utils";

export async function createTransaksi(formData: FormData) {
  const siswaId = formData.get("siswaId") as string;
  const gaya = formData.get("gaya") as string;
  const bukuIds = formData.getAll("bukuIds") as string[];
  const durasiHariRaw = formData.get("durasiHari") as string;
  const batasKembaliRaw = formData.get("batasKembali") as string;
  const jenisPeminjaman = gaya === "MAPEL" ? "PAKET" : "INDIVIDUAL";

  if (!siswaId || bukuIds.length === 0) {
    throw new Error("Siswa dan minimal 1 Buku wajib dipilih");
  }

  // Validasi stok semua buku
  const bukus = await prisma.buku.findMany({ where: { id: { in: bukuIds } } });
  if (bukus.length !== bukuIds.length) {
    throw new Error("Terdapat buku yang tidak ditemukan");
  }
  const stokKurang = bukus.find((b) => b.stok_tersedia < 1);
  if (stokKurang) {
    throw new Error(`Stok buku "${stokKurang.judul}" habis`);
  }

  const tgl_pinjam = new Date();
  const batas_kembali = new Date(tgl_pinjam);

  if (jenisPeminjaman === "PAKET") {
    // Buku Mapel/LKS: durasi 1 tahun ajaran (365 hari) atau sampai akhir tahun ajaran
    if (batasKembaliRaw) {
      const customDate = new Date(batasKembaliRaw);
      if (!isNaN(customDate.getTime())) {
        batas_kembali.setTime(customDate.getTime());
      } else {
        batas_kembali.setFullYear(batas_kembali.getFullYear() + 1);
      }
    } else {
      // Default: sampai akhir tahun ajaran (Juni tahun depan)
      const tahunDepan = tgl_pinjam.getMonth() >= 6
        ? tgl_pinjam.getFullYear() + 1
        : tgl_pinjam.getFullYear();
      batas_kembali.setFullYear(tahunDepan);
      batas_kembali.setMonth(5); // Juni
      batas_kembali.setDate(30);
    }
  } else {
    // Buku Biasa: custom hari
    if (batasKembaliRaw) {
      const customDate = new Date(batasKembaliRaw);
      if (!isNaN(customDate.getTime())) {
        batas_kembali.setTime(customDate.getTime());
      } else {
        batas_kembali.setDate(batas_kembali.getDate() + DURASI_PINJAM_HARI);
      }
    } else if (durasiHariRaw) {
      const hari = parseInt(durasiHariRaw, 10);
      batas_kembali.setDate(batas_kembali.getDate() + (isNaN(hari) || hari < 1 ? DURASI_PINJAM_HARI : hari));
    } else {
      batas_kembali.setDate(batas_kembali.getDate() + DURASI_PINJAM_HARI);
    }
  }

  // Satu transaksi per buku, berbagi groupId agar tampil sebagai 1 grup peminjaman
  const groupId = [...bukuIds].sort().join("|");

  await prisma.$transaction([
    ...bukus.map((buku) =>
      prisma.transaksi.create({
        data: {
          siswaId,
          bukuId: buku.id,
          tgl_pinjam,
          batas_kembali,
          status: "DIPINJAM",
          jenis_peminjaman: jenisPeminjaman,
          tipe_buku: buku.tipe_buku,
          groupId,
        },
      })
    ),
    ...bukus.map((buku) =>
      prisma.buku.update({
        where: { id: buku.id },
        data: { stok_tersedia: { decrement: 1 } },
      })
    ),
  ]);

  revalidatePath("/admin/transaksi");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin");
}

export async function updateTransaksi(id: string, formData: FormData) {
  const batasKembaliRaw = formData.get("batasKembali") as string;
  const tambahanHariRaw = formData.get("tambahanHari") as string;

  const transaksi = await prisma.transaksi.findUnique({ where: { id } });
  if (!transaksi) {
    throw new Error("Transaksi tidak ditemukan");
  }

  let batas_kembali = new Date(transaksi.batas_kembali);

  if (batasKembaliRaw) {
    const customDate = new Date(batasKembaliRaw);
    if (!isNaN(customDate.getTime())) {
      batas_kembali = customDate;
    }
  } else if (tambahanHariRaw) {
    const hari = parseInt(tambahanHariRaw, 10);
    if (!isNaN(hari) && hari > 0) {
      batas_kembali.setDate(batas_kembali.getDate() + hari);
    }
  }

  const q = transaksi.groupId ? { groupId: transaksi.groupId } : { id: transaksi.id };
  const grup = await prisma.transaksi.findMany({ where: q });

  await prisma.transaksi.updateMany({
    where: { id: { in: grup.map((t) => t.id) } },
    data: { batas_kembali },
  });

  revalidatePath("/admin/transaksi");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin");
}

export async function perpanjangTransaksi(id: string, tambahanHari: number) {
  const transaksi = await prisma.transaksi.findUnique({ where: { id } });
  if (!transaksi || transaksi.status !== "DIPINJAM") {
    throw new Error("Hanya transaksi aktif yang dapat diperpanjang");
  }

  const q = transaksi.groupId ? { groupId: transaksi.groupId } : { id: transaksi.id };
  const grup = await prisma.transaksi.findMany({ where: { ...q, status: "DIPINJAM" } });

  const batas_kembali = new Date(transaksi.batas_kembali);
  batas_kembali.setDate(batas_kembali.getDate() + Math.max(1, tambahanHari));

  await prisma.transaksi.updateMany({
    where: { id: { in: grup.map((t) => t.id) } },
    data: { batas_kembali },
  });

  revalidatePath("/admin/transaksi");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin");
}

export async function selesaikanTransaksi(id: string) {
  const transaksi = await prisma.transaksi.findUnique({ where: { id } });
  if (!transaksi) {
    throw new Error("Transaksi tidak ditemukan");
  }

  const q = transaksi.groupId ? { groupId: transaksi.groupId } : { id: transaksi.id };
  const grup = await prisma.transaksi.findMany({
    where: { ...q, status: "DIPINJAM" },
    include: { buku: true },
  });

  if (grup.length === 0) {
    throw new Error("Transaksi tidak valid atau sudah selesai");
  }

  const tgl_dikembalikan = new Date();

  await prisma.$transaction([
    ...grup.map((tr) => {
      const denda = hitungDenda(tr.batas_kembali, tgl_dikembalikan, DENDA_PER_HARI);
      return prisma.transaksi.update({
        where: { id: tr.id },
        data: { tgl_dikembalikan, denda, status: "SELESAI" },
      });
    }),
    ...grup
      .filter((tr) => tr.bukuId !== null)
      .map((tr) =>
        prisma.buku.update({
          where: { id: tr.bukuId! },
          data: { stok_tersedia: { increment: 1 } },
        })
      ),
  ]);

  revalidatePath("/admin/transaksi");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin");
}

export async function deleteTransaksi(id: string) {
  const transaksi = await prisma.transaksi.findUnique({ where: { id } });

  if (!transaksi) {
    throw new Error("Transaksi tidak ditemukan");
  }

  // Hapus seluruh grup bila ada, pulihkan stok semua buku untuk transaksi DIPINJAM
  const q = transaksi.groupId ? { groupId: transaksi.groupId } : { id: transaksi.id };
  const grup = await prisma.transaksi.findMany({ where: q });
  const targetIds = grup.map((t) => t.id);

  const restoreStock =
    grup.length > 0
      ? grup
          .filter((t) => t.status === "DIPINJAM" && t.bukuId !== null)
          .map((t) =>
            prisma.buku.update({
              where: { id: t.bukuId! },
              data: { stok_tersedia: { increment: 1 } },
            })
          )
      : [];

  await prisma.$transaction([
    ...restoreStock,
    prisma.transaksi.deleteMany({ where: { id: { in: targetIds } } }),
  ]);

  revalidatePath("/admin/transaksi");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin");
}
