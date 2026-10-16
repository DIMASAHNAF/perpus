import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Scan, BookOpen, Plus, FileSpreadsheet } from "lucide-react";
import { QuickScanBukuClient } from "@/components/admin/QuickScanBukuClient";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function ScanBukuPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Aurora glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-32 w-[42rem] h-[42rem] rounded-full bg-emerald-500/10 dark:bg-emerald-600/15 blur-[120px] animate-blob" />
        <div className="absolute top-1/3 -right-32 w-[38rem] h-[38rem] rounded-full bg-teal-500/10 dark:bg-teal-600/15 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Header Sticky Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-950/70 border-b border-stone-200/80 dark:border-slate-800/80 mb-6 sm:mb-8 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/buku"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-emerald-400 bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-stone-300/80 dark:border-slate-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Koleksi Buku</span>
              </Link>
              <span className="text-stone-300 dark:text-slate-700 hidden sm:inline">/</span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                      Scan Cepat Masuk Buku
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hidden sm:inline-block">
                      Instant Auto-Fetch
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 -mt-0.5">
                    Tembak barcode ISBN belakang buku untuk auto-input &amp; tambah stok
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Link
                href="/admin/buku/create"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white border border-stone-300/80 dark:border-slate-800 text-xs font-semibold transition-all shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Form Manual</span>
              </Link>
              <Link
                href="/admin/buku/import"
                className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white border border-stone-300/80 dark:border-slate-800 text-xs font-semibold transition-all shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Import CSV</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
        <QuickScanBukuClient />
      </main>
    </div>
  );
}
