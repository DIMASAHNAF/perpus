import { prisma } from "@/lib/prisma";
import KatalogBukuClient from "@/components/katalog/KatalogBukuClient";
import type { TopReaderItem } from "@/components/katalog/LeaderboardPembaca";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Ambil data buku
  const buku = await prisma.buku.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      eksemplar: {
        where: { rakId: { not: null } },
        select: { rak: { select: { nama: true } } },
        take: 1,
      },
    },
  });

  const data = buku.map((b) => ({
    ...b,
    rakNama: b.eksemplar[0]?.rak?.nama ?? null,
  }));

  // 2. Ambil data Top Readers dari tabel transaksi database asli
  let topReaders: TopReaderItem[] = [];

  try {
    const transaksi = await prisma.transaksi.findMany({
      where: {
        status: { in: ["DIPINJAM", "SELESAI"] },
      },
      select: {
        anggotaId: true,
        siswaId: true,
        anggota: {
          select: {
            nama: true,
            kelasRef: { select: { nama_kelas: true } },
          },
        },
        siswa: {
          select: {
            nama: true,
            kelas: true,
          },
        },
      },
    });

    const counter: Record<string, { nama: string; kelas: string; count: number }> = {};

    for (const t of transaksi) {
      const key = t.anggotaId || t.siswaId || t.anggota?.nama || t.siswa?.nama;
      if (!key) continue;

      const nama = t.anggota?.nama || t.siswa?.nama || "Siswa";
      const kelas = t.anggota?.kelasRef?.nama_kelas || t.siswa?.kelas || "Siswa";

      if (!counter[key]) {
        counter[key] = { nama, kelas, count: 0 };
      }
      counter[key].count += 1;
    }

    const sorted = Object.values(counter).sort((a, b) => b.count - a.count);
    const badges = ["Master", "Expert", "Advanced", "Active", "Explorer"];

    if (sorted.length > 0) {
      topReaders = sorted.slice(0, 3).map((item, idx) => ({
        nama: item.nama,
        kelas: item.kelas,
        poin: item.count * 120 + 200, // 1 transaksi = 120 poin
        badge: badges[idx] || "Active",
        rank: idx + 1,
      }));
    }
  } catch (error) {
    console.error("Gagal mengambil data top readers:", error);
  }

  return <KatalogBukuClient initialBuku={data} topReaders={topReaders} />;
}
