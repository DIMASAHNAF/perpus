import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SirkulasiScanner } from "@/components/admin/SirkulasiScanner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function SirkulasiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 selection:bg-emerald-500 selection:text-white relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Background Glowing Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-600/15 blur-[120px] animate-blob" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-[130px] animate-blob [animation-delay:-6s]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[140px] animate-blob [animation-delay:-12s]" />
      </div>

      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-slate-800 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link 
                href="/admin" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-stone-300/80 dark:border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <span className="text-stone-300 dark:text-slate-700 hidden sm:inline">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo SMK Negeri 1 Beringin"
                  className="w-7 h-7 object-contain rounded-lg bg-white/60 dark:bg-white/10 border border-stone-200 dark:border-white/20 p-0.5 shrink-0 hidden xs:block"
                />
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-base font-bold text-stone-900 dark:text-white leading-tight flex items-center gap-1.5 truncate">
                    <span>Sirkulasi Scanner</span>
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      MEJA LAYANAN
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-slate-400 hidden sm:block truncate">
                    Scan kartu anggota → scan buku → pinjam/kembali otomatis
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <SirkulasiScanner />
      </div>
    </div>
  );
}
