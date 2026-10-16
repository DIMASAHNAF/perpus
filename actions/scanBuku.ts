"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findRakIdForKlasifikasi } from "@/lib/rak";
import { requireAdminSession } from "@/lib/security";

export type QuickScanBukuResult = {
  ok: boolean;
  isNew?: boolean;
  notFound?: boolean;
  isbn?: string;
  pesan: string;
  buku?: {
    id: string;
    judul: string;
    penulis: string;
    cover_url: string | null;
    kategori: string | null;
    klasifikasi: string | null;
    stok_total: number;
    stok_tersedia: number;
    isbn: string | null;
  };
  eksemplarKode?: string;
};

/**
 * Mapping kategori standar dari metadata Google Books / OpenLibrary
 */
function mapKategoriFromGoogle(cat?: string | null): { kategori: string; klasifikasi: string } {
  if (!cat) return { kategori: "Lainnya", klasifikasi: "000" };
  const lower = cat.toLowerCase();

  if (lower.includes("math") || lower.includes("matematika")) return { kategori: "Matematika", klasifikasi: "510" };
  if (lower.includes("science") || lower.includes("ipa") || lower.includes("fisika") || lower.includes("physics")) return { kategori: "Fisika", klasifikasi: "530" };
  if (lower.includes("chemistry") || lower.includes("kimia")) return { kategori: "Kimia", klasifikasi: "540" };
  if (lower.includes("biology") || lower.includes("biologi")) return { kategori: "Biologi", klasifikasi: "570" };
  if (lower.includes("computer") || lower.includes("technology") || lower.includes("informatika") || lower.includes("software")) return { kategori: "Teknologi Informasi", klasifikasi: "004" };
  if (lower.includes("history") || lower.includes("sejarah")) return { kategori: "Sejarah", klasifikasi: "900" };
  if (lower.includes("geography") || lower.includes("geografi")) return { kategori: "Geografi", klasifikasi: "910" };
  if (lower.includes("economy") || lower.includes("ekonomi") || lower.includes("business") || lower.includes("akuntansi")) return { kategori: "Ekonomi", klasifikasi: "330" };
  if (lower.includes("language") || lower.includes("bahasa") || lower.includes("indonesia") || lower.includes("fiction") || lower.includes("novel") || lower.includes("sastra")) return { kategori: "Bahasa Indonesia", klasifikasi: "899.221" };
  if (lower.includes("english") || lower.includes("inggris")) return { kategori: "Bahasa Inggris", klasifikasi: "420" };
  if (lower.includes("art") || lower.includes("seni") || lower.includes("music") || lower.includes("musik")) return { kategori: "Seni Budaya", klasifikasi: "700" };
  if (lower.includes("sports") || lower.includes("olahraga") || lower.includes("jasmani")) return { kategori: "Pendidikan Jasmani", klasifikasi: "796" };
  if (lower.includes("religion") || lower.includes("agama") || lower.includes("islam")) return { kategori: "Lainnya", klasifikasi: "200" };
  
  return { kategori: cat.slice(0, 30), klasifikasi: "000" };
}

// Local Database of Indonesian SMK / SMA textbooks for instant zero-latency ISBN detection
const INDONESIAN_TEXTBOOKS_DB: Record<string, { judul: string; penulis: string; kategori: string; klasifikasi: string; cover_url?: string }> = {
  "9786025612831": {
    judul: "Penanganan Gangguan TCP/IP Layer untuk SMK/MAK",
    penulis: "Maryuli Darmawan",
    kategori: "Teknologi Informasi",
    klasifikasi: "004.6",
  },
  "9786025612671": {
    judul: "Literasi Sains dan Materi Pembelajaran Bahasa Indonesia",
    penulis: "Dyah Werdiningsih",
    kategori: "Bahasa Indonesia",
    klasifikasi: "899.221",
  },
  "9786025612367": {
    judul: "Konfigurasi Jaringan Nirkabel",
    penulis: "Maryuli Darmawan",
    kategori: "Teknologi Informasi",
    klasifikasi: "004.65",
  },
  "9786025612350": {
    judul: "Administrasi Infrastruktur Jaringan",
    penulis: "Maryuli Darmawan",
    kategori: "Teknologi Informasi",
    klasifikasi: "004.6",
  },
  "9786025612374": {
    judul: "Teknologi Jaringan Berbasis Luas (WAN)",
    penulis: "Maryuli Darmawan",
    kategori: "Teknologi Informasi",
    klasifikasi: "004.67",
  },
  "9786024866167": {
    judul: "Pemrograman Web dan Perangkat Bergerak",
    penulis: "Patwiyanto, S.Kom.",
    kategori: "Teknologi Informasi",
    klasifikasi: "005.2",
  },
  "9786024866174": {
    judul: "Basis Data SMK/MAK Kelas XI",
    penulis: "Patwiyanto, S.Kom.",
    kategori: "Teknologi Informasi",
    klasifikasi: "005.74",
  },
  "9786024866181": {
    judul: "Sistem Komputer",
    penulis: "Patwiyanto, S.Kom.",
    kategori: "Teknologi Informasi",
    klasifikasi: "004",
  },
  "9786024866198": {
    judul: "Komputer dan Jaringan Dasar",
    penulis: "Patwiyanto, S.Kom.",
    kategori: "Teknologi Informasi",
    klasifikasi: "004.6",
  },
  "9786024346850": {
    judul: "Pemodelan Perangkat Lunak",
    penulis: "Novianto",
    kategori: "Teknologi Informasi",
    klasifikasi: "005.1",
  },
  "9786024346867": {
    judul: "Administrasi Server Jaringan",
    penulis: "Novianto",
    kategori: "Teknologi Informasi",
    klasifikasi: "004.62",
  },
  "9786020633930": {
    judul: "Atomic Habits: Perubahan Kecil yang Memberikan Hasil Luar Biasa",
    penulis: "James Clear",
    kategori: "Pengembangan Diri",
    klasifikasi: "158.1",
  },
  "9789793062792": {
    judul: "Laskar Pelangi",
    penulis: "Andrea Hirata",
    kategori: "Bahasa Indonesia",
    klasifikasi: "899.221",
  },
  "9786231941282": {
    judul: "Dasar-Dasar Pengembangan Perangkat Lunak dan Gim (PPLG) Kelas X",
    penulis: "Kementerian Pendidikan dan Kebudayaan",
    kategori: "Teknologi Informasi",
    klasifikasi: "005.1",
  },
  "9786026232458": {
    judul: "Teknik Jaringan Komputer dan Telekomunikasi (TJKT) Kelas XI",
    penulis: "Kementerian Pendidikan dan Kebudayaan",
    kategori: "Teknologi Informasi",
    klasifikasi: "004.6",
  },
  "9789791227216": {
    judul: "Filosofi Kopi: Kumpulan Cerita dan Prosa Satu Dekade",
    penulis: "Dee Lestari",
    kategori: "Bahasa Indonesia",
    klasifikasi: "899.221",
  },
};

export async function fetchIsbnMetadataAction(rawIsbn: string) {
  await requireAdminSession();
  const clean = rawIsbn.trim().replace(/[-\s]/g, "");
  if (!clean || clean.length < 9) {
    return { ok: false as const, pesan: "Nomor ISBN minimal 10 digit" };
  }

  // 1. Cek di Kamus Buku Pelajaran Indonesia / SMK
  if (INDONESIAN_TEXTBOOKS_DB[clean]) {
    const item = INDONESIAN_TEXTBOOKS_DB[clean];
    return {
      ok: true as const,
      source: "Katalog Nasional SMK",
      data: {
        judul: item.judul,
        penulis: item.penulis,
        cover_url: item.cover_url || null,
        kategori: item.kategori,
        klasifikasi: item.klasifikasi,
      },
    };
  }

  let title = "";
  let authors = "";
  let coverUrl: string | null = null;
  let category = "Lainnya";
  let ddc = "000";

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : "";

  // 2. Google Books API (isbn query)
  try {
    const gRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}${apiKey}`,
      { cache: "no-store" }
    );
    if (gRes.ok) {
      const gJson = await gRes.json();
      if (gJson.items && gJson.items.length > 0) {
        const info = gJson.items[0].volumeInfo;
        title = info.title || "";
        authors = (info.authors || []).join(", ") || "Penulis Tidak Diketahui";
        coverUrl =
          info.imageLinks?.extraLarge ||
          info.imageLinks?.large ||
          info.imageLinks?.medium ||
          info.imageLinks?.thumbnail ||
          null;
        
        const mapped = mapKategoriFromGoogle((info.categories || [])[0]);
        category = mapped.kategori;
        ddc = mapped.klasifikasi;
      }
    }
  } catch {}

  // 3. Google Books API (raw text search fallback)
  if (!title) {
    try {
      const gRes2 = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${clean}${apiKey}`,
        { cache: "no-store" }
      );
      if (gRes2.ok) {
        const gJson2 = await gRes2.json();
        if (gJson2.items && gJson2.items.length > 0) {
          const info = gJson2.items[0].volumeInfo;
          title = info.title || "";
          authors = (info.authors || []).join(", ") || "Penulis Tidak Diketahui";
          coverUrl =
            info.imageLinks?.extraLarge ||
            info.imageLinks?.large ||
            info.imageLinks?.medium ||
            info.imageLinks?.thumbnail ||
            null;
          
          const mapped = mapKategoriFromGoogle((info.categories || [])[0]);
          category = mapped.kategori;
          ddc = mapped.klasifikasi;
        }
      }
    } catch {}
  }

  // 4a. OpenLibrary Direct ISBN API
  if (!title) {
    try {
      const olDirect = await fetch(`https://openlibrary.org/isbn/${clean}.json`, { cache: "no-store" });
      if (olDirect.ok) {
        const olData = await olDirect.json();
        if (olData.title) {
          title = olData.title;
          coverUrl = `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`;

          if (Array.isArray(olData.authors) && olData.authors[0]?.key) {
            try {
              const aRes = await fetch(`https://openlibrary.org${olData.authors[0].key}.json`, { cache: "no-store" });
              if (aRes.ok) {
                const aData = await aRes.json();
                authors = aData.name || "Penulis Tidak Diketahui";
              }
            } catch {}
          }
          if (!authors && Array.isArray(olData.publishers) && olData.publishers[0]) {
            authors = olData.publishers[0];
          }
        }
      }
    } catch {}
  }

  // 4b. OpenLibrary Books API Fallback
  if (!title) {
    try {
      const olRes = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&jscmd=data&format=json`,
        { cache: "no-store" }
      );
      if (olRes.ok) {
        const olJson = await olRes.json();
        const bookData = olJson[`ISBN:${clean}`];
        if (bookData) {
          title = bookData.title || "";
          authors = (bookData.authors || []).map((a: any) => a.name).join(", ");
          coverUrl = bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small || null;
          if (bookData.subjects && bookData.subjects.length > 0) {
            const mapped = mapKategoriFromGoogle(bookData.subjects[0].name);
            category = mapped.kategori;
            ddc = mapped.klasifikasi;
          }
        }
      }
    } catch {}
  }

  if (!title) {
    return {
      ok: false as const,
      pesan: `Metadata untuk ISBN ${clean} tidak ditemukan di katalog online. Silakan isi Judul & Penulis secara manual.`,
    };
  }

  return {
    ok: true as const,
    source: "Online Katalog",
    data: {
      judul: title,
      penulis: authors,
      cover_url: coverUrl,
      kategori: category,
      klasifikasi: ddc,
    },
  };
}

/**
 * Scan cepat barcode / ISBN buku fisik:
 * 1. Cek apakah buku sudah ada di database perpustakaan (by ISBN / kode_buku - toleran terhadap strip / spasi).
 * 2. Jika ada -> tambah stok +1 & buat 1 eksemplar baru otomatis.
 * 3. Jika belum ada -> fetch otomatis dari Google Books / OpenLibrary API -> simpan buku baru & generate eksemplar.
 */
export async function quickScanAddBuku(rawCode: string): Promise<QuickScanBukuResult> {
  await requireAdminSession();
  const clean = rawCode.trim().replace(/[-\s]/g, "");
  if (!clean || clean.length < 4) {
    return { ok: false, pesan: "Kode barcode tidak valid atau terlalu pendek." };
  }

  try {
    // 1. Cek apakah buku sudah terdaftar di DB (abaikan tanda strip / spasi)
    const existingRows = await prisma.$queryRaw<Array<{
      id: string;
      judul: string;
      penulis: string;
      cover_url: string | null;
      kategori: string | null;
      klasifikasi: string | null;
      stok_total: number;
      stok_tersedia: number;
      kode_buku: string | null;
      tipe_buku: any;
    }>>`
      SELECT id, judul, penulis, cover_url, kategori, klasifikasi, stok_total, stok_tersedia, kode_buku, tipe_buku
      FROM "Buku"
      WHERE REPLACE(REPLACE(COALESCE(kode_buku, ''), '-', ''), ' ', '') = ${clean}
         OR kode_buku = ${clean}
         OR id = ${clean}
      LIMIT 1
    `;
    const existing = existingRows[0] || null;

    if (existing) {
      // Tambah stok +1 & generate eksemplar
      const rakId = await findRakIdForKlasifikasi(existing.klasifikasi);

      const resEksemplar = await prisma.$transaction(async (tx) => {
        const last = await tx.eksemplar.findFirst({
          orderBy: { kode: "desc" },
          select: { kode: true },
        });
        const kodeNum = (last ? parseInt(last.kode, 10) : 0) + 1;
        const newKode = kodeNum.toString().padStart(8, "0");

        await tx.eksemplar.create({
          data: {
            kode: newKode,
            bukuId: existing.id,
            rakId,
            tipe_koleksi: existing.tipe_buku === "MAPEL" ? "Textbook" : "Reference",
            status: "TERSEDIA",
          },
        });

        const updated = await tx.buku.update({
          where: { id: existing.id },
          data: {
            stok_total: { increment: 1 },
            stok_tersedia: { increment: 1 },
          },
        });

        return { newKode, updated };
      });

      revalidatePath("/admin/buku");
      revalidatePath(`/admin/buku/${existing.id}/eksemplar`);
      revalidatePath("/admin");

      return {
        ok: true,
        isNew: false,
        pesan: `Stok buku "${existing.judul}" berhasil ditambah (+1 eksemplar fisik: #${resEksemplar.newKode})!`,
        buku: {
          id: existing.id,
          judul: existing.judul,
          penulis: existing.penulis,
          cover_url: existing.cover_url,
          kategori: existing.kategori,
          klasifikasi: existing.klasifikasi,
          stok_total: resEksemplar.updated.stok_total,
          stok_tersedia: resEksemplar.updated.stok_tersedia,
          isbn: existing.kode_buku,
        },
        eksemplarKode: resEksemplar.newKode,
      };
    }

    // 2. Jika belum ada, coba fetch metadata menggunakan multi-source helper
    const metaRes = await fetchIsbnMetadataAction(clean);
    if (!metaRes.ok || !metaRes.data?.judul) {
      return {
        ok: false,
        notFound: true,
        isbn: clean,
        pesan: `Barcode/ISBN "${clean}" belum ada di perpustakaan dan belum terindeks online. Silakan klik Tambah Manual untuk melengkapi Judul & Penulis.`,
      };
    }

    const title = metaRes.data.judul;
    const authors = metaRes.data.penulis;
    const coverUrl = metaRes.data.cover_url;
    const category = metaRes.data.kategori || "Lainnya";
    const ddc = metaRes.data.klasifikasi || "000";

    // 3. Simpan buku baru & generate eksemplar pertama
    const rakId = await findRakIdForKlasifikasi(ddc);

    const created = await prisma.$transaction(async (tx) => {
      const newBuku = await tx.buku.create({
        data: {
          judul: title,
          penulis: authors || "Penerbit",
          cover_url: coverUrl,
          kategori: category,
          klasifikasi: ddc,
          kode_buku: clean,
          stok_total: 1,
          stok_tersedia: 1,
          tipe_buku: "BIASA",
          is_referensi: ddc.toUpperCase().startsWith("R"),
        },
      });

      const last = await tx.eksemplar.findFirst({
        orderBy: { kode: "desc" },
        select: { kode: true },
      });
      const kodeNum = (last ? parseInt(last.kode, 10) : 0) + 1;
      const newKode = kodeNum.toString().padStart(8, "0");

      await tx.eksemplar.create({
        data: {
          kode: newKode,
          bukuId: newBuku.id,
          rakId,
          tipe_koleksi: "Reference",
          status: "TERSEDIA",
        },
      });

      return { newBuku, newKode };
    });

    revalidatePath("/admin/buku");
    revalidatePath("/admin");

    return {
      ok: true,
      isNew: true,
      pesan: `Buku baru "${created.newBuku.judul}" berhasil didaftarkan ke sistem (+ Eksemplar ${created.newKode})!`,
      buku: {
        id: created.newBuku.id,
        judul: created.newBuku.judul,
        penulis: created.newBuku.penulis,
        cover_url: created.newBuku.cover_url,
        kategori: created.newBuku.kategori,
        klasifikasi: created.newBuku.klasifikasi,
        stok_total: 1,
        stok_tersedia: 1,
        isbn: clean,
      },
      eksemplarKode: created.newKode,
    };
  } catch (error: any) {
    console.error("Error quickScanAddBuku:", error);
    return {
      ok: false,
      pesan: `Gagal memproses scan barcode: ${error?.message || error}`,
    };
  }
}
