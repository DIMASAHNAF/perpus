import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Boxes } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { prisma } from "@/lib/prisma";
import { getStockOpnameList } from "@/actions/stock-opname";
import { StockOpnameListClient } from "@/components/admin/stock-opname/StockOpnameListClient";

export const dynamic = "force-dynamic";

export default async function StockOpnameListPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [sessions, raks] = await Promise.all([
    getStockOpnameList(),
    prisma.rak.findMany({
      orderBy: { nomor: "asc" },
      select: { id: true, nama: true, nomor: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-sky-500 selection:text-white relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Background Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full bg-blue-400/15 dark:bg-blue-600/15 blur-[130px] animate-aurora-1" />
        <div className="absolute top-1/3 -right-24 w-[40rem] h-[40rem] rounded-full bg-sky-300/20 dark:bg-sky-600/15 blur-[140px] animate-aurora-2" />
      </div>

      {/* Top Navbar */}
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
                    <span>Stock Opname Koleksi</span>
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 shrink-0">
                      <Boxes className="w-3 h-3" />
                      AUDIT FISIK
                    </span>
                  </h1>
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
        <StockOpnameListClient initialSessions={sessions as any} rakList={raks} />
      </div>
    </div>
  );
}
