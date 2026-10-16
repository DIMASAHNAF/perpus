import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Barcode,
  MapPin,
} from "lucide-react";
import GenerateEksemplarForm from "@/components/admin/GenerateEksemplarForm";
import PrintLabelDialog from "@/components/admin/PrintLabelDialog";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function EksemplarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const buku = await prisma.buku.findUnique({
    where: { id },
    include: {
      eksemplar: {
        include: { rak: true },
        orderBy: { kode: "asc" },
      },
    },
  });

  if (!buku) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buku Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Data buku ini tidak ditemukan di dalam database.</p>
          <Link
            href="/admin/buku"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md"
          >
            Kembali ke Koleksi Buku
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Barcode className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-[450px]">
                    {buku.judul}
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
                    Kelola Eksemplar Fisik &amp; Cetak Barcode / Label
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/admin/buku/${buku.id}/edit`}
                className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-xs font-semibold transition-all shadow-xs"
              >
                Edit Info Buku
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6 relative z-10">
        {/* Generate Eksemplar Form */}
        <GenerateEksemplarForm bukuId={buku.id} />

        {/* Daftar Eksemplar */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/90 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Daftar Eksemplar ({buku.eksemplar.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total stok: <strong className="text-slate-800 dark:text-slate-200">{buku.stok_total}</strong> | Tersedia:{" "}
                <strong className="text-blue-600 dark:text-blue-400">{buku.stok_tersedia}</strong>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kode Barcode
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Lokasi Rak
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Aksi &amp; Cetak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {buku.eksemplar.map((eks) => (
                  <tr key={eks.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                      {eks.kode}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          eks.status === "TERSEDIA"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                            : eks.status === "DIPINJAM"
                              ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {eks.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{eks.rak?.nama ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PrintLabelDialog
                          kode={eks.kode}
                          judul={buku.judul}
                          rakNama={eks.rak?.nama}
                          klasifikasi={buku.klasifikasi}
                          penulis={buku.penulis}
                          isReferensi={buku.is_referensi}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {buku.eksemplar.length === 0 && (
            <div className="px-6 py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Belum ada data eksemplar</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Generate eksemplar baru menggunakan formulir di atas.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
