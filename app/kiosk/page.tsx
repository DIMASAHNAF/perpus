import { prisma } from "@/lib/prisma";
import KioskScannerClient from "@/components/kiosk/KioskScannerClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Presensi Kunjungan Mandiri (Scan QR / Kartu) - Perpustakaan SMKN 1 Beringin",
  description: "Pindai QR Code atau Barcode kartu anggota untuk mencatat presensi pengunjung secara otomatis.",
};

export default async function KioskPage() {
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

  const initialStats = {
    totalHariIni,
    recentList: recentList.map((k) => ({
      id: k.id,
      nama: k.nama,
      kelas: k.kelas,
      keperluan: k.keperluan,
      tanggal: k.tanggal.toISOString(),
    })),
  };

  return <KioskScannerClient initialStats={initialStats} />;
}
