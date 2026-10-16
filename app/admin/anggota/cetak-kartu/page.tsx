import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CetakKartuClient } from "@/components/admin/CetakKartuClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function CetakKartuPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100 print:bg-white print:text-slate-900 print:min-h-0 relative overflow-x-hidden selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Background glowing aurora blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 print-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/20 via-sky-400/15 to-transparent blur-[120px] animate-aurora-mesh-1" />
        <div className="absolute top-[30%] -right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-blue-600/15 to-transparent blur-[130px] animate-aurora-mesh-2" />
        <div className="absolute -bottom-[15%] left-[20%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-sky-500/10 to-transparent blur-[140px] animate-aurora-mesh-3" />
      </div>

      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-xs print-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/anggota"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Daftar Anggota
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <div className="flex items-center gap-2">
                <img
                  src="/assets/logo.png"
                  alt="Logo Perpustakaan"
                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded-lg bg-white/10 border border-slate-200 dark:border-white/10 p-0.5 shrink-0"
                />
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Cetak Kartu Anggota</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Ukuran Standar KTP (85.6 × 54 mm)
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0 print:m-0 print:max-w-none">
        <CetakKartuClient />
      </div>
    </div>
  );
}
