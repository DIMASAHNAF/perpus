import { prisma } from "@/lib/prisma";

export type DailyData = {
  dayName: string;
  dateStr: string;
  pinjamCount: number;
  kunjunganCount: number;
};

export type TopBookItem = {
  id: string;
  judul: string;
  penulis: string;
  kategori: string;
  cover_url: string | null;
  count: number;
  percentage: number;
};

export type CategoryStat = {
  kategori: string;
  totalBuku: number;
  totalDipinjam: number;
  percentage: number;
  color: string;
};

export type JurusanStat = {
  jurusan: string;
  count: number;
  percentage: number;
  color: string;
};

export type AnalyticsDashboardData = {
  dailyTrends: DailyData[];
  topBooks: TopBookItem[];
  categoryStats: CategoryStat[];
  jurusanStats: JurusanStat[];
  summary: {
    totalPeminjamanBulanIni: number;
    totalKunjunganBulanIni: number;
    tingkatTepatWaktuPercent: number;
    rataRataHarian: number;
  };
};

const PALETTE = [
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-500",
  "from-purple-500 to-indigo-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-teal-500",
];

const COLORS = [
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#06b6d4", // cyan
];

export async function getDashboardAnalytics(): Promise<AnalyticsDashboardData> {
  const now = new Date();
  
  // 1. Data 7 Hari Terakhir (H-6 sampai Hari Ini)
  const days: DailyData[] = [];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const [pinjamCount, kunjunganCount] = await Promise.all([
      prisma.transaksi.count({
        where: {
          tgl_pinjam: {
            gte: d,
            lt: nextD,
          },
        },
      }),
      prisma.kunjungan.count({
        where: {
          tanggal: {
            gte: d,
            lt: nextD,
          },
        },
      }),
    ]);

    days.push({
      dayName: dayNames[d.getDay()],
      dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
      pinjamCount,
      kunjunganCount,
    });
  }

  // 2. Top 5 Buku Paling Sering Dipinjam
  const txGroup = await prisma.transaksi.groupBy({
    by: ["bukuId"],
    where: {
      bukuId: { not: null },
    },
    _count: { bukuId: true },
    orderBy: { _count: { bukuId: "desc" } },
    take: 5,
  });

  const totalAllLoans = await prisma.transaksi.count();

  let topBooks: TopBookItem[] = [];
  if (txGroup.length > 0) {
    const bookIds = txGroup.map((g) => g.bukuId!).filter(Boolean);
    const books = await prisma.buku.findMany({
      where: { id: { in: bookIds } },
      select: { id: true, judul: true, penulis: true, kategori: true, cover_url: true },
    });

    const bookMap = new Map(books.map((b) => [b.id, b]));

    topBooks = txGroup.map((g) => {
      const book = bookMap.get(g.bukuId!);
      const count = g._count.bukuId;
      return {
        id: g.bukuId!,
        judul: book?.judul || "Buku Perpustakaan",
        penulis: book?.penulis || "Pustakawan",
        kategori: book?.kategori || "Umum",
        cover_url: book?.cover_url || null,
        count,
        percentage: totalAllLoans > 0 ? Math.round((count / totalAllLoans) * 100) : 0,
      };
    });
  } else {
    // Fallback jika belum ada transaksi peminjaman: ambil 5 buku dari katalog
    const sampleBooks = await prisma.buku.findMany({
      take: 5,
      select: { id: true, judul: true, penulis: true, kategori: true, cover_url: true },
    });
    topBooks = sampleBooks.map((b, idx) => ({
      id: b.id,
      judul: b.judul,
      penulis: b.penulis,
      kategori: b.kategori || "Umum",
      cover_url: b.cover_url,
      count: 0,
      percentage: 0,
    }));
  }

  // 3. Distribusi Buku per Kategori
  const allBooksWithCategory = await prisma.buku.findMany({
    select: { kategori: true, id: true },
  });

  const catMap = new Map<string, number>();
  for (const b of allBooksWithCategory) {
    const cat = (b.kategori || "Umum").trim();
    catMap.set(cat, (catMap.get(cat) || 0) + 1);
  }

  const sortedCats = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalBooksCount = allBooksWithCategory.length || 1;
  const categoryStats: CategoryStat[] = sortedCats.map(([cat, total], idx) => ({
    kategori: cat,
    totalBuku: total,
    totalDipinjam: 0,
    percentage: Math.round((total / totalBooksCount) * 100),
    color: COLORS[idx % COLORS.length],
  }));

  // 4. Distribusi Peminjaman per Jurusan Siswa
  const kelasList = await prisma.kelas.findMany({
    select: { jurusan: true, id: true },
  });
  const jurusanMap = new Map<string, number>();

  // Hitung anggota/siswa yang terdaftar per jurusan
  const allAnggota = await prisma.anggota.findMany({
    select: {
      kelasRef: {
        select: { jurusan: true },
      },
    },
  });

  for (const a of allAnggota) {
    const jur = a.kelasRef?.jurusan || "UMUM";
    jurusanMap.set(jur, (jurusanMap.get(jur) || 0) + 1);
  }

  const sortedJurusan = Array.from(jurusanMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalAnggotaCount = allAnggota.length || 1;
  const jurusanStats: JurusanStat[] = sortedJurusan.map(([jur, count], idx) => ({
    jurusan: jur,
    count,
    percentage: Math.round((count / totalAnggotaCount) * 100),
    color: COLORS[idx % COLORS.length],
  }));

  // 5. Summary Bulan Ini
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalPeminjamanBulanIni, totalKunjunganBulanIni, selesaiTx, tepatWaktuTx] = await Promise.all([
    prisma.transaksi.count({
      where: { tgl_pinjam: { gte: startOfMonth } },
    }),
    prisma.kunjungan.count({
      where: { tanggal: { gte: startOfMonth } },
    }),
    prisma.transaksi.count({
      where: { status: "SELESAI" },
    }),
    prisma.transaksi.count({
      where: { status: "SELESAI", denda: 0 },
    }),
  ]);

  const tingkatTepatWaktuPercent = selesaiTx > 0 ? Math.round((tepatWaktuTx / selesaiTx) * 100) : 98;
  const daysInMonthSoFar = now.getDate() || 1;
  const rataRataHarian = Math.round((totalPeminjamanBulanIni + totalKunjunganBulanIni) / daysInMonthSoFar);

  return {
    dailyTrends: days,
    topBooks,
    categoryStats,
    jurusanStats,
    summary: {
      totalPeminjamanBulanIni,
      totalKunjunganBulanIni,
      tingkatTepatWaktuPercent,
      rataRataHarian,
    },
  };
}
