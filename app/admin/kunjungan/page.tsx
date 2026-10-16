import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KunjunganClient from "@/components/admin/KunjunganClient";

export const dynamic = "force-dynamic";

export default async function KunjunganPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const kunjungan = await prisma.kunjungan.findMany({
    orderBy: { tanggal: "desc" },
  });

  const initialData = kunjungan.map((k) => ({
    id: k.id,
    nama: k.nama,
    kelas: k.kelas,
    keperluan: k.keperluan,
    tanggal: k.tanggal.toISOString(),
  }));

  return <KunjunganClient initialData={initialData} />;
}
