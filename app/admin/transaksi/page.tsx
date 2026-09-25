import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowLeftRight, 
  FileText
} from "lucide-react";
import FormPeminjaman from "@/components/admin/FormPeminjaman";
import DaftarTransaksiTable from "@/components/admin/DaftarTransaksiTable";

export default async function TransaksiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [siswaList, bukuBiasaList, bukuMapelList, transaksiList] = await Promise.all([
    prisma.siswa.findMany({
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, nisn: true, kelas: true },
    }),
    prisma.buku.findMany({
      where: { stok_tersedia: { gt: 0 }, tipe_buku: "BIASA" },
      orderBy: { judul: "asc" },
      select: { id: true, judul: true, penulis: true, stok_tersedia: true, kode_buku: true },
    }),
    prisma.buku.findMany({
      where: { stok_tersedia: { gt: 0 }, tipe_buku: "MAPEL" },
      orderBy: { judul: "asc" },
      select: { id: true, judul: true, penulis: true, stok_tersedia: true, kode_buku: true, kategori: true, tahun_ajaran: true },
    }),
    prisma.transaksi.findMany({
      include: { 
        siswa: { select: { id: true, nama: true, nisn: true, kelas: true } }, 
        buku: { select: { id: true, judul: true, penulis: true, kode_buku: true, tipe_buku: true } } 
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link 
                href="/admin" 
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
                <h1 className="text-lg font-bold text-slate-900">Sistem Transaksi Peminjaman</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/laporan"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Laporan & Rekap</span>
              </Link>
              <div className="text-xs text-slate-500 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 font-medium">
                Admin
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:m-0">
        {/* Form Peminjaman Baru dengan Custom Hari */}
        <div className="print:hidden">
          <FormPeminjaman siswaList={siswaList} bukuBiasaList={bukuBiasaList} bukuMapelList={bukuMapelList} />
        </div>

        {/* Tabel Daftar & Riwayat Transaksi */}
        <div>
          <DaftarTransaksiTable transaksiList={transaksiList} />
        </div>
      </div>
    </div>
  );
}
