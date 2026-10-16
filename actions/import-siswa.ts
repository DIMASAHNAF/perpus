"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/security";

export type ImportRow = {
  nisn: string;
  nama: string;
  kelas: string;
  telepon?: string;
};

export type ImportResult = {
  ok: boolean;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  message: string;
};

/**
 * Normalisasi nama kelas:
 * contoh "x pplg 1" -> "X PPLG 1"
 */
function normalizeKelasName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Cari atau buat Kelas secara dinamis jika belum ada
 */
async function resolveKelasId(rawKelas: string, kelasCache: Map<string, string>): Promise<string | null> {
  const cleanName = normalizeKelasName(rawKelas);
  if (!cleanName || cleanName === "-" || cleanName === "--" || cleanName.toLowerCase() === "null") {
    return null;
  }

  const key = cleanName.toLowerCase();
  if (kelasCache.has(key)) {
    return kelasCache.get(key)!;
  }

  // Cari di database (case-insensitive)
  const existing = await prisma.kelas.findFirst({
    where: {
      nama_kelas: { equals: cleanName, mode: "insensitive" },
    },
  });

  if (existing) {
    kelasCache.set(key, existing.id);
    return existing.id;
  }

  // Jika belum ada, buat kelas baru secara otomatis
  // Parse komponen kelas: misal "X PPLG 1" -> tingkat: "X", jurusan: "PPLG", nomor: 1
  const parts = cleanName.split(" ");
  const tingkat = parts[0] || "X";
  const nomorStr = parts.length > 2 ? parts[parts.length - 1] : "1";
  const nomor = parseInt(nomorStr, 10) || 1;
  const jurusan = parts.slice(1, parts.length > 2 ? parts.length - 1 : undefined).join(" ") || "UMUM";

  try {
    const created = await prisma.kelas.create({
      data: {
        nama_kelas: cleanName.toUpperCase(),
        tingkat: tingkat.toUpperCase(),
        jurusan: jurusan.toUpperCase(),
        nomor,
      },
    });
    kelasCache.set(key, created.id);
    return created.id;
  } catch {
    // Jika race condition
    const retry = await prisma.kelas.findFirst({
      where: { nama_kelas: { equals: cleanName, mode: "insensitive" } },
    });
    if (retry) {
      kelasCache.set(key, retry.id);
      return retry.id;
    }
    return null;
  }
}

/**
 * Batch import siswa & anggota dari data Excel yang sudah diparsing
 */
export async function importSiswaBatch(rows: ImportRow[]): Promise<ImportResult> {
  await requireAdminSession();
  if (!rows || rows.length === 0) {
    return {
      ok: false,
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: ["Tidak ada data yang diproses. Pastikan file Excel tidak kosong."],
      message: "File kosong",
    };
  }

  // Pre-load all existing classes into cache
  const allKelas = await prisma.kelas.findMany({ select: { id: true, nama_kelas: true } });
  const kelasCache = new Map<string, string>();
  for (const k of allKelas) {
    kelasCache.set(k.nama_kelas.toLowerCase(), k.id);
    kelasCache.set(normalizeKelasName(k.nama_kelas).toLowerCase(), k.id);
  }

  // Kumpulkan semua NISN yang tidak kosong
  const nisnList = rows
    .map((r) => String(r.nisn || "").trim())
    .filter(Boolean);

  // Ambil data Anggota dan Siswa yang sudah ada secara batch
  const existingAnggotaList = await prisma.anggota.findMany({
    where: { nisn: { in: nisnList } },
    select: { id: true, nisn: true, kelasId: true, telepon: true },
  });
  const existingAnggotaMap = new Map<string, (typeof existingAnggotaList)[0]>();
  for (const a of existingAnggotaList) {
    if (a.nisn) existingAnggotaMap.set(a.nisn, a);
  }

  const existingSiswaList = await prisma.siswa.findMany({
    where: { nisn: { in: nisnList } },
    select: { id: true, nisn: true, kelas: true, kelasId: true },
  });
  const existingSiswaMap = new Map<string, (typeof existingSiswaList)[0]>();
  for (const s of existingSiswaList) {
    existingSiswaMap.set(s.nisn, s);
  }

  // Cari nomor anggota tertinggi saat ini untuk sequential generator
  const lastAnggota = await prisma.anggota.findFirst({
    where: { no_anggota: { startsWith: "A" } },
    select: { no_anggota: true },
    orderBy: { no_anggota: "desc" },
  });

  let maxNumber = 0;
  if (lastAnggota) {
    const numPart = parseInt(lastAnggota.no_anggota.replace(/^A/, ""), 10);
    if (!isNaN(numPart)) {
      maxNumber = numPart;
    }
  }

  let nextNo = maxNumber + 1;
  const getNextNoAnggota = () => {
    const no = `A${String(nextNo).padStart(4, "0")}`;
    nextNo++;
    return no;
  };

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const rawNisn = String(row.nisn || "").trim();
    const rawNama = String(row.nama || "").trim();
    const rawKelas = String(row.kelas || "").trim();
    const rawTelepon =
      row.telepon && String(row.telepon).trim() !== "-" && String(row.telepon).trim() !== ""
        ? String(row.telepon).trim()
        : null;

    if (!rawNisn || !rawNama) {
      skipped++;
      if (rawNisn || rawNama) {
        errors.push(`Baris ${rowNum}: NISN atau Nama kosong.`);
      }
      continue;
    }

    try {
      const kelasId = rawKelas && rawKelas !== "-" ? await resolveKelasId(rawKelas, kelasCache) : null;
      const existingAnggota = existingAnggotaMap.get(rawNisn);

      if (existingAnggota) {
        await prisma.anggota.update({
          where: { id: existingAnggota.id },
          data: {
            nama: rawNama,
            kelasId: kelasId ?? existingAnggota.kelasId,
            telepon: rawTelepon ?? existingAnggota.telepon,
            status_aktif: true,
          },
        });
        updated++;
      } else {
        const no_anggota = getNextNoAnggota();
        const createdAnggota = await prisma.anggota.create({
          data: {
            no_anggota,
            nama: rawNama,
            jenis: "SISWA",
            nisn: rawNisn,
            kelasId,
            telepon: rawTelepon,
            status_aktif: true,
          },
        });
        existingAnggotaMap.set(rawNisn, createdAnggota);
        imported++;
      }

      // Siswa
      const existingSiswa = existingSiswaMap.get(rawNisn);
      if (existingSiswa) {
        await prisma.siswa.update({
          where: { nisn: rawNisn },
          data: {
            nama: rawNama,
            kelas: rawKelas && rawKelas !== "-" ? rawKelas : existingSiswa.kelas,
            kelasId: kelasId ?? existingSiswa.kelasId,
          },
        });
      } else {
        const createdSiswa = await prisma.siswa.create({
          data: {
            nisn: rawNisn,
            nama: rawNama,
            kelas: rawKelas || "-",
            kelasId,
          },
        });
        existingSiswaMap.set(rawNisn, createdSiswa);
      }
    } catch (err: any) {
      console.error(`Error importing row ${rowNum} (${rawNama}):`, err);
      errors.push(`Baris ${rowNum} (${rawNama}): ${err.message || "Gagal menyimpan"}`);
      skipped++;
    }
  }

  return {
    ok: true,
    total: rows.length,
    imported,
    updated,
    skipped,
    errors: errors.slice(0, 10),
    message: `Berhasil memproses ${imported + updated} siswa (${imported} siswa baru, ${updated} diperbarui).`,
  };
}

/**
 * Revalidasi path setelah seluruh batch import selesai
 */
export async function revalidateSiswaPaths() {
  try {
    revalidatePath("/admin/anggota");
    revalidatePath("/admin/siswa");
    revalidatePath("/admin/anggota/cetak-kartu");
  } catch (err) {
    console.error("Error revalidating siswa paths:", err);
  }
}

/**
 * Mengambil daftar kelas yang tersedia untuk pilihan Kelas Default
 */
export async function getDaftarKelas(): Promise<{ id: string; nama_kelas: string }[]> {
  try {
    return await prisma.kelas.findMany({
      select: { id: true, nama_kelas: true },
      orderBy: { nama_kelas: "asc" },
    });
  } catch (err) {
    console.error("Error fetching daftar kelas:", err);
    return [];
  }
}

