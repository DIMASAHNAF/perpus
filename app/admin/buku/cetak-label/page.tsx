import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Barcode as BarcodeIcon } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { getEksemplarForLabels, getLabelFilterOptions } from "@/actions/label-buku";
import { CetakLabelBukuClient } from "@/components/admin/buku/CetakLabelBukuClient";

export default async function CetakLabelBukuPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [items, filters] = await Promise.all([
    getEksemplarForLabels({ limit: 400 }),
    getLabelFilterOptions(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 print:bg-white print:text-slate-900 print:min-h-0 relative overflow-x-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Background glowing aurora blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 print-hidden">
        <div className="absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full bg-emerald-400/20 dark:bg-emerald-600/15 blur-[130px] animate-aurora-1" />
        <div className="absolute top-1/3 -right-24 w-[40rem] h-[40rem] rounded-full bg-teal-300/25 dark:bg-teal-600/15 blur-[140px] animate-aurora-2" />
        <div className="absolute -bottom-32 left-1/3 w-[44rem] h-[44rem] rounded-full bg-cyan-300/20 dark:bg-cyan-600/12 blur-[140px] animate-aurora-3" />
      </div>

      {/* Top Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-slate-800 sticky top-0 z-20 shadow-xs print-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href="/admin/buku"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-stone-300/80 dark:border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Koleksi Buku</span>
              </Link>
              <span className="text-stone-300 dark:text-slate-700 hidden sm:inline">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo Perpustakaan"
                  className="w-7 h-7 object-contain rounded-lg bg-white/60 dark:bg-white/10 border border-stone-200 dark:border-white/20 p-0.5 shrink-0 hidden xs:block"
                />
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-base font-bold text-stone-900 dark:text-white tracking-tight truncate flex items-center gap-1.5">
                    <span>Cetak Label &amp; Barcode Buku</span>
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                      MASSAL
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-slate-400 hidden sm:block truncate">
                    SMK Negeri 1 Beringin · Tom &amp; Jerry 103/121 &amp; A4
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <div className="text-xs text-stone-500 dark:text-slate-400 font-medium hidden md:block">
                Total Eksemplar: <strong>{filters.totalEksemplar}</strong>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 print:p-0 print:m-0 print:max-w-none">
        <CetakLabelBukuClient
          initialItems={items}
          categories={filters.categories}
          raks={filters.raks}
        />
      </div>
    </div>
  );
}
