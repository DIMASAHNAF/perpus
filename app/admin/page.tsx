import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { AdminProfileDropdown } from "@/components/admin/AdminProfileDropdown";
import { AdminDashboardMenuClient } from "@/components/admin/AdminDashboardMenuClient";
import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";
import { getDashboardAnalytics } from "@/lib/analytics";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Stats
  const totalBuku = await prisma.buku.count();
  const totalEksemplar = await prisma.eksemplar.count();
  const bukuDipinjam = await prisma.transaksi.count({
    where: { status: "DIPINJAM" },
  });

  const [totalAnggota, totalAnggotaSiswa, totalAnggotaGuruStaf] = await Promise.all([
    prisma.anggota.count(),
    prisma.anggota.count({ where: { jenis: "SISWA" } }),
    prisma.anggota.count({ where: { jenis: { in: ["GURU", "STAF"] } } }),
  ]);

  // Denda outstanding: transaksi selesai dengan denda belum dibayar
  const dendaAgg = await prisma.transaksi.aggregate({
    where: { denda: { gt: 0 }, status: "SELESAI" },
    _sum: { denda: true },
  });
  const totalDenda = dendaAgg._sum.denda ?? 0;

  // Real-time Analytics & Infografis
  const analyticsData = await getDashboardAnalytics();
  


  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-hidden font-sans selection:bg-sky-500 selection:text-white transition-colors duration-300">
      {/* Aurora glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full bg-sky-400/20 dark:bg-sky-600/15 blur-[130px] animate-aurora-1" />
        <div className="absolute top-1/3 -right-24 w-[40rem] h-[40rem] rounded-full bg-blue-300/25 dark:bg-blue-600/15 blur-[140px] animate-aurora-2" />
        <div className="absolute -bottom-32 left-1/3 w-[44rem] h-[44rem] rounded-full bg-cyan-300/20 dark:bg-indigo-600/12 blur-[140px] animate-aurora-3" />
      </div>

      {/* Top Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-slate-800 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo SMK Negeri 1 Beringin"
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl object-contain bg-white/60 dark:bg-white/10 border border-stone-200 dark:border-white/20 p-1 shrink-0"
                />
                <img
                  src="/assets/logo-kolaborasi.png"
                  alt="Logo Kolaborasi Sumut Berkah"
                  className="h-6 sm:h-8 w-auto object-contain shrink-0 hidden xs:block"
                />
              </div>
              <div className="min-w-0 border-l border-stone-200 dark:border-slate-800 pl-2 sm:pl-3">
                <h1 className="text-xs sm:text-base font-bold text-stone-900 dark:text-white leading-tight truncate flex items-center gap-1.5 sm:gap-2">
                  <span>Admin Perpustakaan</span>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    Command Center
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs text-stone-500 dark:text-slate-400 hidden sm:block truncate">Sistem Manajemen Buku &amp; Peminjaman</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <ThemeToggle />
              <Link 
                href="/" 
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-stone-300/80 dark:border-slate-700/80 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all shadow-xs shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Katalog Publik</span>
              </Link>
              <Link
                href="/"
                className="sm:hidden inline-flex items-center justify-center w-8.5 h-8.5 text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white bg-stone-100 dark:bg-slate-800 border border-stone-300/80 dark:border-slate-700/80 rounded-xl transition-colors shrink-0"
                title="Katalog Publik"
              >
                <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </Link>
              
              <div className="pl-1 sm:pl-2 border-l border-stone-200 dark:border-slate-800 shrink-0">
                <AdminProfileDropdown userName={session.user?.name || "Administrator"} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 animate-fade-up stats-compact">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 transition-all shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1 stat-label">
              Total Koleksi
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white stat-number">{totalBuku}</p>
            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-slate-400 mt-1">Judul terdaftar</p>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 transition-all shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1 stat-label">
              Total Eksemplar
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 stat-number">
              {totalEksemplar}
            </p>
            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-slate-400 mt-1">Copy fisik</p>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 transition-all shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1 stat-label">
              Sedang Dipinjam
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 stat-number">{bukuDipinjam}</p>
            <p className="text-[10px] sm:text-[11px] text-sky-600/90 dark:text-sky-400/80 mt-1">Buku aktif</p>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 transition-all shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1 stat-label">
              Total Anggota
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 stat-number">
              {totalAnggota}
            </p>
            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-slate-400 mt-1 truncate">
              Siswa: {totalAnggotaSiswa} • Guru/Staf: {totalAnggotaGuruStaf}
            </p>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 transition-all shadow-sm col-span-2 sm:col-span-1">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1 stat-label">
              Denda Belum Bayar
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 stat-number flex items-baseline">
              <span className="text-base sm:text-lg font-bold opacity-80 mr-1">Rp</span>
              <span>{totalDenda.toLocaleString("id-ID")}</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium mt-1">Total tertunggak</p>
          </div>
        </div>

        {/* Categorized Menu Dashboard */}
        <AdminDashboardMenuClient />

        {/* Visual Infografis & Interactive Trends */}
        <AdminAnalyticsDashboard data={analyticsData} />


      </div>
    </div>
  );
}

