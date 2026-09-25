import { prisma } from "./prisma";

/**
 * Cari rak yang cocok untuk nomor klasifikasi DDC (mis. "808.81" -> 808 -> Lemari Referensi 2).
 * Klasifikasi 000-099 ke Rak 1, 100-199 Rak 2, ... 800-899 & 900-999 ke Lemari Referensi 2.
 * Cache rak di memory karena tabel rak stabil (9 baris).
 */
let rakCache: { id: string; min: number; max: number }[] | null = null;

async function getRakRanges() {
  if (rakCache) return rakCache;
  const rakList = await prisma.rak.findMany({ orderBy: { nomor: "asc" } });
  rakCache = rakList.map((r) => ({
    id: r.id,
    min: r.klasifikasi_min,
    max: r.klasifikasi_max,
  }));
  return rakCache;
}

/**
 * Ambil 3 digit pertama dari nomor DDC: "808.81" -> 808, "278.250" -> 278.
 */
export function parseKlasifikasi(klasifikasi?: string | null): number | null {
  if (!klasifikasi) return null;
  const cleaned = klasifikasi.trim().split(".")[0];
  const num = parseInt(cleaned, 10);
  return Number.isNaN(num) ? null : num;
}

export async function findRakIdForKlasifikasi(
  klasifikasi?: string | null
): Promise<string | null> {
  const num = parseKlasifikasi(klasifikasi);
  if (num === null) return null;
  const ranges = await getRakRanges();
  const found = ranges.find((r) => num >= r.min && num <= r.max);
  return found?.id ?? null;
}
