import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getStockOpnameDetail } from "@/actions/stock-opname";
import { StockOpnameDetailClient } from "@/components/admin/stock-opname/StockOpnameDetailClient";

export const dynamic = "force-dynamic";

export default async function StockOpnameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const data = await getStockOpnameDetail(id);

  if (!data || !data.sesi) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-sky-500 selection:text-white relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Background Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full bg-blue-400/15 dark:bg-blue-600/15 blur-[130px] animate-aurora-1" />
        <div className="absolute top-1/3 -right-24 w-[40rem] h-[40rem] rounded-full bg-cyan-300/20 dark:bg-cyan-600/15 blur-[140px] animate-aurora-2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <StockOpnameDetailClient
          sesi={data.sesi as any}
          summary={data.summary}
          allRaks={data.allRaks}
        />
      </div>
    </div>
  );
}
