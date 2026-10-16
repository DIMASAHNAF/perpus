import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus, FileSpreadsheet, Barcode, Scan } from "lucide-react";
import { BukuListClient, type BukuListItem } from "@/components/admin/BukuListClient";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function BukuPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const buku = await prisma.buku.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      judul: true,
      penulis: true,
      cover_url: true,
      file_url: true,
      is_ebook: true,
      kategori: true,
      klasifikasi: true,
      stok_total: true,
      stok_tersedia: true,
      tipe_buku: true,
      tahun_ajaran: true,
      kode_buku: true,
    },
  });

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-hidden font-sans selection:bg-sky-500 selection:text-white transition-colors duration-300">
      {/* Aurora glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full bg-sky-400/20 dark:bg-sky-600/15 blur-[130px] animate-aurora-1" />
        <div className="absolute top-1/3 -right-24 w-[40rem] h-[40rem] rounded-full bg-blue-300/25 dark:bg-blue-600/15 blur-[140px] animate-aurora-2" />
        <div className="absolute -bottom-32 left-1/3 w-[44rem] h-[44rem] rounded-full bg-cyan-300/20 dark:bg-indigo-600/12 blur-[140px] animate-aurora-3" />
      </div>

      {/* Header Sticky Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-950/70 border-b border-stone-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-18 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-stone-300/80 dark:border-slate-800 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <span className="text-stone-300 dark:text-slate-700 hidden sm:inline">/</span>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/60 dark:bg-white/10 ring-1 ring-stone-200 dark:ring-white/20 p-1 flex items-center justify-center shrink-0 hidden xs:flex">
                  <img
                    src="/assets/logo.png"
                    alt="Logo SMKN 1 Beringin"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xs sm:text-base font-black tracking-tight text-stone-900 dark:text-white truncate">
                      Koleksi Buku
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hidden md:inline-block shrink-0">
                      Katalog Utama
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-slate-400 hidden sm:block truncate">
                    SMK Negeri 1 Beringin · Inventaris &amp; Eksemplar
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <ThemeToggle />
              <Link
                href="/admin/buku/scan"
                className="inline-flex items-center justify-center gap-1.5 h-8.5 sm:h-10 px-2.5 sm:px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white border border-stone-300/80 dark:border-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                title="Scan Barcode Masuk Buku"
              >
                <Scan className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="hidden lg:inline">Scan ISBN</span>
              </Link>
              <Link
                href="/admin/buku/import"
                className="hidden lg:inline-flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white border border-stone-300/80 dark:border-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Import Massal</span>
              </Link>
              <Link
                href="/admin/buku/create"
                className="inline-flex items-center justify-center gap-1.5 h-8.5 sm:h-10 px-2.5 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="hidden xs:inline">Tambah Buku</span>
                <span className="xs:hidden">Tambah</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <BukuListClient initialBuku={buku as BukuListItem[]} />
      </main>
    </div>
  );
}


