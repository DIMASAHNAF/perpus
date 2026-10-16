"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateNoAnggota } from "@/lib/generators";
import { requireAdminSession, checkRateLimit } from "@/lib/security";

/**
 * CRUD Anggota (SISWA / GURU / STAF). no_anggota auto-generate sequential.
 * createdAt dipakai sebagai "tanggal menjadi anggota" — realtime tampil di UI.
 */

export async function createAnggota(formData: FormData) {
  await requireAdminSession();
  const nama = (formData.get("nama") as string)?.trim();
  const jenis = (formData.get("jenis") as string) || "SISWA";
  const nisn = (formData.get("nisn") as string)?.trim() || null;
  const telepon = (formData.get("telepon") as string)?.trim() || null;
  const alamat = (formData.get("alamat") as string)?.trim() || null;
  const kelasId = (formData.get("kelasId") as string) || null;

  if (!nama) throw new Error("Nama wajib diisi");

  // SISWA wajib NISN & unik
  if (jenis === "SISWA") {
    if (!nisn) throw new Error("NISN wajib untuk anggota siswa");
    const dup = await prisma.anggota.findFirst({ where: { nisn } });
    if (dup) throw new Error(`NISN ${nisn} sudah terdaftar sebagai ${dup.nama}`);
  }

  const no_anggota = await generateNoAnggota();

  await prisma.anggota.create({
    data: {
      no_anggota,
      nama,
      jenis: jenis as any,
      nisn: jenis === "SISWA" ? nisn : null,
      kelasId: jenis === "SISWA" ? kelasId : null,
      telepon: telepon || null,
      alamat: alamat || null,
      status_aktif: true,
    },
  });

  revalidatePath("/admin/anggota");
  redirect("/admin/anggota");
}

export async function updateAnggota(id: string, formData: FormData) {
  await requireAdminSession();
  const nama = (formData.get("nama") as string)?.trim();
  const jenis = (formData.get("jenis") as string) || "SISWA";
  const nisn = (formData.get("nisn") as string)?.trim() || null;
  const telepon = (formData.get("telepon") as string)?.trim() || null;
  const alamat = (formData.get("alamat") as string)?.trim() || null;
  const kelasId = (formData.get("kelasId") as string) || null;
  const status_aktif = formData.get("status_aktif") === "on";

  if (!nama) throw new Error("Nama wajib diisi");

  const existing = await prisma.anggota.findUnique({ where: { id } });
  if (!existing) throw new Error("Anggota tidak ditemukan");

  if (jenis === "SISWA" && nisn) {
    const dup = await prisma.anggota.findFirst({
      where: { nisn, NOT: { id } },
    });
    if (dup) throw new Error(`NISN ${nisn} dipakai oleh ${dup.nama}`);
  }

  await prisma.anggota.update({
    where: { id },
    data: {
      nama,
      jenis: jenis as any,
      nisn: jenis === "SISWA" ? nisn : null,
      kelasId: jenis === "SISWA" ? kelasId : null,
      telepon: telepon || null,
      alamat: alamat || null,
      status_aktif,
    },
  });

  revalidatePath("/admin/anggota");
  redirect("/admin/anggota");
}

export async function deleteAnggota(id: string) {
  await requireAdminSession();
  const aktif = await prisma.transaksi.findFirst({
    where: { anggotaId: id, status: "DIPINJAM" },
  });
  if (aktif) {
    throw new Error("Tidak bisa hapus: masih ada buku dipinjam");
  }

  await prisma.anggota.delete({ where: { id } });
  revalidatePath("/admin/anggota");
}

export async function toggleStatusAnggota(id: string, aktif: boolean) {
  await requireAdminSession();
  await prisma.anggota.update({
    where: { id },
    data: { status_aktif: aktif },
  });
  revalidatePath("/admin/anggota");
}

export async function getAnggotaForKartu(query: string) {
  await requireAdminSession();
  const value = query.trim();
  if (!value) return null;

  const anggota = await prisma.anggota.findFirst({
    where: {
      OR: [
        { no_anggota: { equals: value, mode: "insensitive" } },
        { nisn: value },
        { nama: { contains: value, mode: "insensitive" } },
        { id: value },
      ],
      status_aktif: true,
    },
    include: {
      kelasRef: true,
    },
  });

  if (!anggota) return null;

  return {
    id: anggota.id,
    no_anggota: anggota.no_anggota,
    nama: anggota.nama,
    jenis: anggota.jenis,
    nisn: anggota.nisn,
    kelas: anggota.kelasRef?.nama_kelas ?? null,
  };
}

export async function getKartuDigitalSiswa(query: string) {
  const value = query.trim();
  if (!value || value.length < 3) return null;

  // 1. Cari di Anggota
  let anggota = await prisma.anggota.findFirst({
    where: {
      OR: [
        { nisn: { equals: value, mode: "insensitive" } },
        { no_anggota: { equals: value, mode: "insensitive" } },
        { nama: { equals: value, mode: "insensitive" } },
      ],
      status_aktif: true,
    },
    include: {
      kelasRef: true,
      transaksi: {
        where: { status: "DIPINJAM" },
        include: { buku: { select: { judul: true } } },
      },
    },
  });

  // 2. Jika belum ada di Anggota tapi ada di Siswa, daftarkan otomatis agar punya no_anggota & QR
  if (!anggota) {
    const siswa = await prisma.siswa.findFirst({
      where: {
        OR: [
          { nisn: { equals: value, mode: "insensitive" } },
          { nama: { equals: value, mode: "insensitive" } },
        ],
      },
      include: { kelasRef: true },
    });

    if (siswa) {
      const { generateNoAnggota } = await import("@/lib/generators");
      const no_anggota = await generateNoAnggota();

      anggota = await prisma.anggota.create({
        data: {
          no_anggota,
          nama: siswa.nama,
          jenis: "SISWA",
          nisn: siswa.nisn,
          kelasId: siswa.kelasId,
          status_aktif: true,
        },
        include: {
          kelasRef: true,
          transaksi: {
            where: { status: "DIPINJAM" },
            include: { buku: { select: { judul: true } } },
          },
        },
      });
    }
  }

  if (!anggota) return null;

  return {
    id: anggota.id,
    no_anggota: anggota.no_anggota,
    nama: anggota.nama,
    jenis: anggota.jenis,
    nisn: anggota.nisn,
    telepon: anggota.telepon
      ? anggota.telepon.slice(0, 4) + "••••" + anggota.telepon.slice(-3)
      : null,
    kelas: anggota.kelasRef?.nama_kelas ?? null,
    totalBukuDipinjam: anggota.transaksi.length,
    bukuDipinjam: anggota.transaksi.map((t) => t.buku?.judul).filter(Boolean) as string[],
    bergabungSejak: anggota.createdAt.toISOString(),
  };
}

/**
 * Update Nomor WhatsApp secara mandiri oleh siswa / anggota
 */
export async function updateWhatsAppMandiriAction(
  identifier: string,
  teleponInput: string
): Promise<{ ok: boolean; message: string; telepon?: string }> {
  try {
    const { formatNomorWhatsApp } = await import("@/lib/whatsapp");
    const cleanPhone = formatNomorWhatsApp(teleponInput);

    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        ok: false,
        message: "Nomor WhatsApp tidak valid. Masukkan minimal 10 digit (contoh: 08123456789).",
      };
    }

    const rateCheck = checkRateLimit(`wa_update:${cleanPhone}`, 3, 60 * 1000);
    if (!rateCheck.allowed) {
      return {
        ok: false,
        message: `Terlalu banyak permintaan update. Silakan tunggu ${rateCheck.retryAfterSeconds} detik.`,
      };
    }

    const value = identifier.trim();
    if (!value) {
      return { ok: false, message: "Identitas anggota tidak valid." };
    }

    const anggota = await prisma.anggota.findFirst({
      where: {
        OR: [
          { id: value },
          { no_anggota: { equals: value, mode: "insensitive" } },
          { nisn: { equals: value, mode: "insensitive" } },
        ],
      },
    });

    if (!anggota) {
      return { ok: false, message: "Data anggota siswa tidak ditemukan di sistem." };
    }

    await prisma.anggota.update({
      where: { id: anggota.id },
      data: { telepon: cleanPhone },
    });

    revalidatePath("/kartu");
    revalidatePath("/admin/anggota");
    revalidatePath("/admin/whatsapp");
    revalidatePath("/admin/transaksi");

    return {
      ok: true,
      message: "Nomor WhatsApp berhasil didaftarkan dan tersimpan!",
      telepon: cleanPhone,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || "Gagal menyimpan nomor WhatsApp.",
    };
  }
}

/**
 * Mengambil ringkasan data siswa kelas 12 untuk keperluan kelulusan
 */
export async function getInfoKelas12() {
  await requireAdminSession();

  // Cari semua kelas 12
  const kelas12List = await prisma.kelas.findMany({
    where: {
      OR: [
        { tingkat: { in: ["XII", "12"] } },
        { nama_kelas: { startsWith: "12" } },
        { nama_kelas: { startsWith: "XII" } },
      ],
    },
    select: { id: true, nama_kelas: true },
  });

  const kelas12Ids = kelas12List.map((k) => k.id);

  // Cari total anggota di kelas-kelas tersebut
  const totalSiswaKelas12 = await prisma.anggota.count({
    where: {
      jenis: "SISWA",
      kelasId: { in: kelas12Ids },
    },
  });

  // Cari apakah ada yang masih meminjam buku
  const peminjamAktif = await prisma.transaksi.findMany({
    where: {
      status: "DIPINJAM",
      anggota: {
        jenis: "SISWA",
        kelasId: { in: kelas12Ids },
      },
    },
    include: {
      anggota: { select: { nama: true, no_anggota: true } },
      buku: { select: { judul: true } },
    },
    take: 20,
  });

  return {
    totalSiswa: totalSiswaKelas12,
    totalKelas: kelas12List.length,
    namaKelas: kelas12List.map((k) => k.nama_kelas).sort(),
    totalPeminjamAktif: peminjamAktif.length,
    peminjamAktif: peminjamAktif.map((t) => ({
      nama: t.anggota?.nama || "Siswa",
      no_anggota: t.anggota?.no_anggota || "-",
      judulBuku: t.buku?.judul || "Buku",
    })),
  };
}

/**
 * Hapus permanen data siswa kelas 12 yang sudah tamat
 */
export async function hapusSiswaKelas12Permanen() {
  await requireAdminSession();

  // Ambil semua kelas 12
  const kelas12List = await prisma.kelas.findMany({
    where: {
      OR: [
        { tingkat: { in: ["XII", "12"] } },
        { nama_kelas: { startsWith: "12" } },
        { nama_kelas: { startsWith: "XII" } },
      ],
    },
    select: { id: true },
  });

  const kelas12Ids = kelas12List.map((k) => k.id);
  if (kelas12Ids.length === 0) {
    return { ok: false, message: "Tidak ditemukan kelas 12 di database." };
  }

  // Cek apakah ada yang masih meminjam buku
  const masihPinjamCount = await prisma.transaksi.count({
    where: {
      status: "DIPINJAM",
      anggota: {
        jenis: "SISWA",
        kelasId: { in: kelas12Ids },
      },
    },
  });

  if (masihPinjamCount > 0) {
    return {
      ok: false,
      message: `Gagal: Ada ${masihPinjamCount} peminjaman buku oleh siswa kelas 12 yang belum dikembalikan. Harap selesaikan pengembalian buku terlebih dahulu!`,
    };
  }

  // Ambil semua ID anggota siswa kelas 12
  const anggotaToDelete = await prisma.anggota.findMany({
    where: {
      jenis: "SISWA",
      kelasId: { in: kelas12Ids },
    },
    select: { id: true, nisn: true },
  });

  const anggotaIds = anggotaToDelete.map((a) => a.id);
  const nisnList = anggotaToDelete.map((a) => a.nisn).filter(Boolean) as string[];

  if (anggotaIds.length === 0) {
    return { ok: false, message: "Tidak ada siswa kelas 12 yang perlu dihapus." };
  }

  // Unlink relasi transaksi lama yang sudah dikembalikan agar foreign key constraint tidak gagal
  await prisma.transaksi.updateMany({
    where: { anggotaId: { in: anggotaIds } },
    data: { anggotaId: null },
  });

  // Hapus dari tabel Anggota
  const deletedAnggota = await prisma.anggota.deleteMany({
    where: { id: { in: anggotaIds } },
  });

  // Bersihkan juga dari tabel Siswa jika ada
  if (nisnList.length > 0) {
    await prisma.siswa.deleteMany({
      where: { nisn: { in: nisnList } },
    });
  }

  revalidatePath("/admin/anggota");
  revalidatePath("/admin/siswa");
  revalidatePath("/admin");

  return {
    ok: true,
    deletedCount: deletedAnggota.count,
    message: `Berhasil menghapus permanen ${deletedAnggota.count} data siswa kelas 12 yang telah tamat!`,
  };
}


