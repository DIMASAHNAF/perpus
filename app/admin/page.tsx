import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  LogOut, 
  AlertTriangle, 
  ExternalLink,
  Clock,
  BookCheck,
  ChevronRight,
  ShieldCheck,
  ScanLine
} from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Stats
  const totalBuku = await prisma.buku.count();
  const totalSiswa = await prisma.siswa.count();
  const totalAnggota = await prisma.anggota.count();
  const totalEksemplar = await prisma.eksemplar.count();
  const bukuDipinjam = await prisma.transaksi.count({
    where: { status: "DIPINJAM" },
  });

  // Denda outstanding: transaksi selesai dengan denda belum dibayar
  const dendaAgg = await prisma.transaksi.aggregate({
    where: { denda: { gt: 0 }, status: "SELESAI" },
    _sum: { denda: true },
  });
  const totalDenda = dendaAgg._sum.denda ?? 0;
  
  const siswaTerlambat = await prisma.transaksi.findMany({
    where: {
      status: "DIPINJAM",
      batas_kembali: { lt: new Date() },
    },
    include: {
      siswa: true,
      buku: true,
    },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="Logo SMK Negeri 1 Beringin"
                className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
              />
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">Admin Perpustakaan</h1>
                <p className="text-xs text-slate-500">Sistem Manajemen Buku & Peminjaman</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Lihat Katalog Publik
              </Link>
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  {session.user?.name?.charAt(0) || "A"}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900">{session.user?.name}</div>
                  <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Pustakawan
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Total Koleksi
            </p>
            <p className="text-3xl font-extrabold text-slate-900">{totalBuku}</p>
            <p className="text-[11px] text-slate-500 mt-1">Judul terdaftar</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Total Eksemplar
            </p>
            <p className="text-3xl font-extrabold text-teal-700">
              {totalEksemplar}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Copy fisik</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Sedang Dipinjam
            </p>
            <p className="text-3xl font-extrabold text-sky-700">{bukuDipinjam}</p>
            <p className="text-[11px] text-sky-600 mt-1">Buku aktif</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Total Anggota
            </p>
            <p className="text-3xl font-extrabold text-emerald-800">
              {totalAnggota}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Siswa: {totalSiswa} terdaftar
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Denda Belum Bayar
            </p>
            <p className="text-3xl font-extrabold text-rose-700">
              {totalDenda.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Rupiah outstanding</p>
          </div>
        </div>

        {/* Scanner CTA - paling mencolok */}
        <Link
          href="/admin/sirkulasi"
          className="group block relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-xl shadow-emerald-200/50 transition-all hover:shadow-2xl hover:shadow-emerald-300/50 hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <ScanLine className="w-9 h-9 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Mulai Scan Sirkulasi
                </h2>
                <p className="text-emerald-50 text-sm mt-1 max-w-lg">
                  Scan kartu anggota → scan buku → pinjam/kembali otomatis dengan
                  hitung denda. Tempat kerja utama pustakawan.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl shadow-md group-hover:gap-3 transition-all">
              Buka Scanner
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Quick Menu */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Menu Manajemen Utama</h2>
              <p className="text-xs text-slate-500">Pilih menu navigasi untuk mengelola data perpustakaan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/buku"
              className="group p-5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all shadow-xs hover:shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">Kelola Buku</h3>
                <p className="text-xs text-slate-500 mt-1">Tambah, edit, hapus, dan atur stok ketersediaan buku</p>
              </div>
            </Link>

            <Link
              href="/admin/anggota"
              className="group p-5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all shadow-xs hover:shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">Kelola Anggota</h3>
                <p className="text-xs text-slate-500 mt-1">CRUD siswa/guru/staf, tanggal bergabung, & cetak kartu</p>
              </div>
            </Link>

            <Link
              href="/admin/transaksi"
              className="group p-5 rounded-xl border border-slate-200 hover:border-sky-500 bg-white hover:bg-sky-50/40 transition-all shadow-xs hover:shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">Transaksi Pinjam/Kembali</h3>
                <p className="text-xs text-slate-500 mt-1">Input peminjaman custom durasi & catat denda pengembalian</p>
              </div>
            </Link>

            <Link
              href="/admin/laporan"
              className="group p-5 rounded-xl border border-slate-200 hover:border-teal-500 bg-white hover:bg-teal-50/40 transition-all shadow-xs hover:shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <BookCheck className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">Laporan & Ekspor Data</h3>
                <p className="text-xs text-slate-500 mt-1">Rekap sirkulasi, unduh Excel CSV, dan cetak laporan PDF</p>
              </div>
            </Link>

            <Link
              href="/admin/sirkulasi"
              className="group p-5 rounded-xl border-2 border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <ScanLine className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  UTAMA
                </span>
              </div>
              <div>
                <h3 className="font-bold text-emerald-700 text-sm">Sirkulasi Scanner</h3>
                <p className="text-xs text-slate-600 mt-1">Scan kartu anggota lalu scan buku — pinjam/kembali otomatis</p>
              </div>
            </Link>

            <Link
              href="/api/auth/signout"
              className="group p-5 rounded-xl border border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50/50 transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-rose-700 text-sm">Keluar Akun</h3>
                <p className="text-xs text-slate-500 mt-1">Akhiri sesi login pengelola perpustakaan</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Siswa Terlambat */}
        {siswaTerlambat.length > 0 && (
          <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-4 text-rose-700">
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Perhatian: Siswa Terlambat Mengembalikan</h2>
                <p className="text-xs text-slate-500">Daftar buku yang telah melewati batas tanggal jatuh tempo peminjaman</p>
              </div>
            </div>

            <div className="space-y-3">
              {siswaTerlambat.map((t) => (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-rose-50/60 border border-rose-100 rounded-xl gap-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.siswa?.nama || 'N/A'} <span className="text-xs font-normal text-slate-600">({t.siswa?.kelas || 'N/A'} - NISN: {t.siswa?.nisn || 'N/A'})</span></p>
                    <p className="text-xs text-slate-700 mt-0.5">Judul Buku: <strong>{t.buku?.judul || 'N/A'}</strong></p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs text-rose-700 font-semibold bg-white px-2.5 py-1 rounded-md border border-rose-200 inline-block">
                      Jatuh Tempo: {new Date(t.batas_kembali).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

