"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/security";

export async function createKunjunganByScan(kode: string, keperluanCustom?: string) {
  const raw = kode.trim();
  if (!raw) return { ok: false as const, pesan: "Kode kartu kosong" };

  // Parse QR code jika berisi JSON atau URL
  let cleanValue = raw;
  if (cleanValue.startsWith("{") && cleanValue.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleanValue);
      cleanValue = parsed.no_anggota || parsed.nisn || parsed.nis || parsed.id || cleanValue;
    } catch {}
  } else if (cleanValue.includes("?id=")) {
    try {
      const url = new URL(cleanValue);
      cleanValue = url.searchParams.get("id") || cleanValue;
    } catch {}
  }

  // Validasi: Tolak barcode buku / ISBN agar tidak salah tercatat sebagai presensi anggota
  const cleanDigits = raw.replace(/[-\s]/g, "");
  if (/^(978|979)\d{7,10}$/.test(cleanDigits) || cleanDigits.length === 13 && (cleanDigits.startsWith("978") || cleanDigits.startsWith("979"))) {
    return {
      ok: false as const,
      pesan: "Kode yang di-scan adalah barcode/ISBN buku, bukan kartu anggota perpustakaan.",
    };
  }

  // Cek apakah kode ini adalah kode eksemplar atau barcode buku yang terdaftar
  const isBuku = await prisma.eksemplar.findFirst({
    where: {
      OR: [
        { kode: { equals: cleanValue, mode: "insensitive" } },
        { buku: { kode_buku: { equals: cleanValue, mode: "insensitive" } } },
      ],
    },
    select: { id: true },
  });
  if (isBuku) {
    return {
      ok: false as const,
      pesan: "Kode yang di-scan adalah buku/eksemplar perpustakaan, bukan kartu anggota.",
    };
  }

  // 1. Cari di tabel Anggota (SISWA, GURU, STAF)
  const anggota = await prisma.anggota.findFirst({
    where: {
      OR: [
        { no_anggota: { equals: cleanValue, mode: "insensitive" } },
        { nisn: { equals: cleanValue, mode: "insensitive" } },
        { id: { equals: cleanValue, mode: "insensitive" } },
        { nama: { contains: cleanValue, mode: "insensitive" } },
      ],
      status_aktif: true,
    },
    include: { kelasRef: true },
  });

  let nama = "";
  let kelas: string | null = null;
  let jenis = "SISWA";
  let no_anggota = "";
  let nisn: string | null = null;

  if (anggota) {
    nama = anggota.nama;
    kelas = anggota.kelasRef?.nama_kelas ?? null;
    jenis = anggota.jenis;
    no_anggota = anggota.no_anggota;
    nisn = anggota.nisn;
  } else {
    // 2. Fallback ke tabel Siswa
    const siswa = await prisma.siswa.findFirst({
      where: {
        OR: [
          { nisn: { equals: cleanValue, mode: "insensitive" } },
          { id: { equals: cleanValue, mode: "insensitive" } },
          { nama: { contains: cleanValue, mode: "insensitive" } },
        ],
      },
      include: { kelasRef: true },
    });

    if (siswa) {
      nama = siswa.nama;
      kelas = siswa.kelasRef?.nama_kelas || siswa.kelas || null;
      nisn = siswa.nisn;
      no_anggota = siswa.nisn;
    } else {
      // 3. Fail-safe: Catat sebagai Pengunjung/Tamu jika kartu belum terdaftar agar presensi tetap berhasil
      nama = cleanValue;
      kelas = "Pengunjung / Tamu";
      jenis = "UMUM";
      no_anggota = cleanValue;
    }
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // Cek duplikasi presensi dalam 30 detik terakhir untuk mencegah double-scan tidak sengaja
  const recentVisit = await prisma.kunjungan.findFirst({
    where: {
      nama,
      tanggal: { gte: new Date(now.getTime() - 30 * 1000) },
    },
    orderBy: { tanggal: "desc" },
  });

  if (recentVisit) {
    return {
      ok: false as const,
      isDuplicate: true,
      pesan: `${nama} baru saja tercatat berkunjung pada ${new Date(recentVisit.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB.`,
      pengunjung: {
        nama,
        kelas,
        jenis,
        no_anggota,
        nisn,
      },
    };
  }

  const keperluan = keperluanCustom || "Membaca & Meminjam Buku";

  const kunjungan = await prisma.kunjungan.create({
    data: {
      nama,
      kelas,
      keperluan,
      tanggal: now,
    },
  });

  // Hitung total pengunjung hari ini
  const totalHariIni = await prisma.kunjungan.count({
    where: {
      tanggal: { gte: startOfToday },
    },
  });

  revalidatePath("/admin/kunjungan");
  revalidatePath("/admin");
  revalidatePath("/kiosk");

  return {
    ok: true as const,
    pesan: `Presensi berhasil dicatat! Selamat datang di perpustakaan, ${nama}.`,
    kunjungan: {
      id: kunjungan.id,
      nama: kunjungan.nama,
      kelas: kunjungan.kelas,
      keperluan: kunjungan.keperluan,
      tanggal: kunjungan.tanggal.toISOString(),
      jenis,
      no_anggota,
      nisn,
      antreanKe: totalHariIni,
    },
  };
}

export async function getKioskStats() {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const [totalHariIni, recentList] = await Promise.all([
    prisma.kunjungan.count({
      where: { tanggal: { gte: startOfToday } },
    }),
    prisma.kunjungan.findMany({
      where: { tanggal: { gte: startOfToday } },
      orderBy: { tanggal: "desc" },
      take: 8,
    }),
  ]);

  return {
    totalHariIni,
    recentList: recentList.map((k) => ({
      id: k.id,
      nama: k.nama,
      kelas: k.kelas,
      keperluan: k.keperluan,
      tanggal: k.tanggal.toISOString(),
    })),
  };
}

export async function createKunjungan(formData: FormData) {
  await requireAdminSession();
  const nama = (formData.get("nama") as string)?.trim();
  if (!nama) throw new Error("Nama pengunjung wajib diisi");

  const kelas = (formData.get("kelas") as string)?.trim() || null;
  const keperluan = (formData.get("keperluan") as string)?.trim() || null;
  const tanggalRaw = formData.get("tanggal") as string;

  // Default: waktu sekarang (bisa di-backdate petugas)
  const tanggal = tanggalRaw ? new Date(tanggalRaw) : new Date();
  if (isNaN(tanggal.getTime())) throw new Error("Tanggal tidak valid");

  await prisma.kunjungan.create({
    data: { nama, kelas, keperluan, tanggal },
  });

  revalidatePath("/admin/kunjungan");
  revalidatePath("/admin");
  redirect("/admin/kunjungan");
}

export async function deleteKunjungan(id: string) {
  await requireAdminSession();
  await prisma.kunjungan.delete({ where: { id } });
  revalidatePath("/admin/kunjungan");
  revalidatePath("/admin");
}

export async function getAllKunjunganLive() {
  await requireAdminSession();
  const list = await prisma.kunjungan.findMany({
    orderBy: { tanggal: "desc" },
    take: 1000,
  });
  return list.map((k) => ({
    id: k.id,
    nama: k.nama,
    kelas: k.kelas,
    keperluan: k.keperluan,
    tanggal: k.tanggal.toISOString(),
  }));
}
