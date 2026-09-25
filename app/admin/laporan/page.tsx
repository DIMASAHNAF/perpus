import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LaporanClient from "@/components/admin/LaporanClient";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const transaksiList = await prisma.transaksi.findMany({
    include: {
      siswa: { select: { id: true, nama: true, nisn: true, kelas: true } },
      buku: { select: { id: true, judul: true, penulis: true } },
    },
    orderBy: { tgl_pinjam: "desc" },
  });

  return <LaporanClient initialTransaksi={transaksiList} />;
}
