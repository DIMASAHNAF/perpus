import KartuDigitalClient from "@/components/kartu/KartuDigitalClient";
import { getKartuDigitalSiswa } from "@/actions/anggota";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kartu Perpustakaan Digital Siswa - SMK Negeri 1 Beringin",
  description: "Cek dan simpan kartu perpustakaan digital serta QR Code presensi siswa SMK Negeri 1 Beringin.",
};

export default async function KartuDigitalPage({
  searchParams,
}: {
  searchParams: Promise<{ nisn?: string; q?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = (params?.nisn || params?.q || "").trim();

  let initialData = null;
  if (initialQuery) {
    try {
      initialData = await getKartuDigitalSiswa(initialQuery);
    } catch (e) {
      console.error("Gagal prefetch kartu siswa:", e);
    }
  }

  return <KartuDigitalClient initialQuery={initialQuery} initialData={initialData} />;
}

