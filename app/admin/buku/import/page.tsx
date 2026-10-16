import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ImportBukuClient } from "@/components/admin/ImportBukuClient";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function ImportBukuPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100 overflow-hidden font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Background Soft Blue Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/20 via-sky-400/15 to-transparent blur-[120px] animate-aurora-mesh-1" />
        <div className="absolute top-[30%] -right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-blue-600/15 to-transparent blur-[130px] animate-aurora-mesh-2" />
        <div className="absolute -bottom-[15%] left-[20%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-sky-500/10 to-transparent blur-[140px] animate-aurora-mesh-3" />
      </div>

      {/* Header Sticky Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 mb-8 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/buku"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Koleksi Buku</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Import Buku Massal (CSV)
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
                    Unggah data koleksi perpustakaan sekaligus
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
        <ImportBukuClient />
      </div>
    </div>
  );
}
