"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Parse CSV sederhana (RFC4180-lite): kutip ganda, koma di dalam kutip,
 * baris baru di dalam kutip. Tanpa dependency eksternal.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\r") {
      // ignore, handled by \n
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }

  // sisa terakhir
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Ambil angka utama DDC dari klasifikasi, mis. "899.221" -> 899 */
function ddcUtama(klasifikasi: string): number | null {
  const m = /^R?\s*(\d{1,3})/.exec(klasifikasi.trim());
  return m ? parseInt(m[1], 10) : null;
}

/** Cari rak berdasarkan rentang DDC (klasifikasi_min/max di model Rak). */
async function cariRak(klasifikasi: string): Promise<string | null> {
  const utama = ddcUtama(klasifikasi);
  if (utama === null) return null;

  // Ambil rak khusus referensi dulu bila ada (mis. "Lemari Referensi 2")
  // cek dengan flag klasifikasi R di tingkat pemanggil; di sini cukup
  // cari rak yang range-nya memuat angka DDC utama.
  const rakList = await prisma.rak.findMany({
    orderBy: { klasifikasi_min: "asc" },
  });
  for (const rak of rakList) {
    if (utama >= rak.klasifikasi_min && utama <= rak.klasifikasi_max) {
      return rak.id;
    }
  }
  // Fallback: rak dengan max terbesar (umumnya Lemari Referensi / rak 800+)
  const last = rakList[rakList.length - 1];
  return last ? last.id : null;
}

export type ImportRow = {
  judul: string;
  penulis: string;
  kategori: string;
  klasifikasi: string;
  jumlah: number;
  isbn?: string;
  tahun_ajaran?: string;
  kode_buku?: string;
};

export type ImportResult = {
  ok: boolean;
  pesan: string;
  total?: number;
  berhasil?: number;
  gagal?: number;
  errors?: string[];
  preview?: ImportRow[];
};

/**
 * Validasi CSV + ambil preview (juga fetch DDC dari ISBN bila klasifikasi kosong).
 */
export async function previewImportBuku(csvText: string): Promise<ImportResult> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { ok: false, pesan: "CSV kosong atau tidak terbaca" };
  }

  // Header wajib
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx: Record<string, number> = {};
  const known = [
    "judul",
    "penulis",
    "kategori",
    "klasifikasi",
    "jumlah",
    "isbn",
    "tahun_ajaran",
    "kode_buku",
  ];
  header.forEach((h, i) => {
    if (known.includes(h)) idx[h] = i;
  });

  if (idx.judul === undefined) {
    return {
      ok: false,
      pesan: "Kolom wajib 'judul' tidak ditemukan. Lihat contoh format.",
    };
  }

  const data = rows.slice(1).map((r) => {
    const get = (k: string) =>
      idx[k] !== undefined ? (r[idx[k]] ?? "").trim() : "";
    const jumlah = parseInt(get("jumlah"), 10);
    return {
      judul: get("judul"),
      penulis: get("penulis") || "Tanpa Pengarang",
      kategori: get("kategori") || "Umum",
      klasifikasi: get("klasifikasi"),
      jumlah: isNaN(jumlah) || jumlah < 1 ? 1 : Math.min(jumlah, 999),
      isbn: get("isbn") || undefined,
      tahun_ajaran: get("tahun_ajaran") || undefined,
      kode_buku: get("kode_buku") || undefined,
    };
  });

  const valid = data.filter((d) => d.judul);
  if (valid.length === 0) {
    return { ok: false, pesan: "Tidak ada baris dengan judul valid" };
  }

  // Auto-DDC: isi klasifikasi kosong dari ISBN via Google Books
  const perluDdc = valid.filter((d) => !d.klasifikasi && d.isbn);
  if (perluDdc.length > 0) {
    await Promise.all(
      perluDdc.map(async (d) => {
        const clean = (d.isbn ?? "").replace(/[-\s]/g, "");
        if (clean.length < 10) return;
        try {
          const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`
          );
          const json = await res.json();
          const info = json.items?.[0]?.volumeInfo;
          if (info) {
            if (!d.klasifikasi) {
              // Google Books tidak kasih DDC persis; pakai kategori
              // umum → petak ke DDC dasar sebagai fallback
              const kat = (info.categories?.[0] ?? "").toLowerCase();
              d.klasifikasi = ddcDariKategori(kat);
            }
            if (d.penulis === "Tanpa Pengarang" && info.authors?.length) {
              d.penulis = info.authors.join(", ");
            }
          }
        } catch {
          // offline/blocked: biarkan kosong, pustakawan isi manual nanti
        }
      })
    );
  }

  return {
    ok: true,
    pesan: `${valid.length} barus siap diimpor`,
    total: valid.length,
    preview: valid,
  };
}

/**
 * Peta kategori Google Books → DDC dasar (kasus terburuk tanpa klasifikasi).
 */
function ddcDariKategori(kat: string): string {
  const map: [string, string][] = [
    ["fict", "899.2"],
    ["novel", "899.2"],
    ["comput", "004"],
    ["mathemat", "510"],
    ["science", "500"],
    ["physic", "530"],
    ["chem", "540"],
    ["biolog", "570"],
    ["history", "900"],
    ["relig", "200"],
    ["social", "300"],
    ["econom", "330"],
    ["law", "340"],
    ["educat", "370"],
    ["psycholog", "150"],
    ["literary", "800"],
    ["poetry", "811"],
    ["drama", "812"],
    ["health", "610"],
    ["medical", "610"],
    ["engineer", "620"],
    ["agricultur", "630"],
    ["econom", "330"],
    ["art", "700"],
    ["music", "780"],
    ["geograph", "910"],
    ["biograph", "920"],
    ["philosoph", "100"],
    ["children", "899.2"],
    ["comic", "741.5"],
  ];
  for (const [k, v] of map) {
    if (kat.includes(k)) return v;
  }
  return "000"; // General works
}

/**
 * Import massal: upsert buku per (judul+penulis), tambah stok bila ada,
 * lalu generate eksemplar 8-digit + assign rak dari DDC.
 */
export async function importBuku(rows: ImportRow[]): Promise<ImportResult> {
  if (!rows.length) return { ok: false, pesan: "Tidak ada data" };

  const errors: string[] = [];
  let berhasil = 0;
  let kodeCounter = parseInt(
    (await prisma.eksemplar.findFirst({
      orderBy: { kode: "desc" },
      select: { kode: true },
    }))?.kode ?? "0",
    10
  );

  for (const r of rows) {
    if (!r.judul) continue;
    try {
      const klasifikasiRaw = (r.klasifikasi ?? "").trim();
      const is_referensi = /^R\s/i.test(klasifikasiRaw);
      const klasifikasi = klasifikasiRaw.replace(/^R\s+/i, "");

      // Cari buku existing (judul+penulis case-insensitive)
      const existing = await prisma.buku.findFirst({
        where: {
          judul: { equals: r.judul, mode: "insensitive" },
          penulis: { equals: r.penulis, mode: "insensitive" },
        },
      });

      let bukuId: string;
      let jumlahBaru = r.jumlah;

      if (existing) {
        // Tambah stok
        await prisma.buku.update({
          where: { id: existing.id },
          data: {
            stok_total: { increment: r.jumlah },
            stok_tersedia: { increment: r.jumlah },
            ...(klasifikasi && !existing.klasifikasi
              ? { klasifikasi }
              : {}),
          },
        });
        bukuId = existing.id;
      } else {
        const created = await prisma.buku.create({
          data: {
            judul: r.judul,
            penulis: r.penulis,
            kategori: r.kategori || null,
            klasifikasi: klasifikasi || null,
            tahun_ajaran: r.tahun_ajaran || null,
            kode_buku: r.kode_buku || null,
            stok_total: r.jumlah,
            stok_tersedia: r.jumlah,
            is_referensi,
          },
        });
        bukuId = created.id;
      }

      // Generate eksemplar + assign rak
      const rakId = klasifikasi ? await cariRak(klasifikasiRaw) : null;
      const referensi = is_referensi || !klasifikasi;

      for (let i = 0; i < jumlahBaru; i++) {
        kodeCounter += 1;
        await prisma.eksemplar.create({
          data: {
            kode: kodeCounter.toString().padStart(8, "0"),
            bukuId,
            rakId,
            tipe_koleksi: referensi ? "Reference" : "Fiction",
          },
        });
      }

      berhasil += 1;
    } catch (e) {
      errors.push(
        `${r.judul}: ${e instanceof Error ? e.message : "gagal disimpan"}`
      );
    }
  }

  revalidatePath("/admin/buku");
  revalidatePath("/");

  return {
    ok: errors.length === 0,
    pesan: `${berhasil} judul diproses${errors.length ? `, ${errors.length} gagal` : ""}`,
    berhasil,
    gagal: errors.length,
    errors: errors.slice(0, 10),
  };
}
