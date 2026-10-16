import { prisma } from "@/lib/prisma";
import { updateBuku } from "@/actions/buku";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowLeft, BookOpen, User, Layers, Save, AlertCircle, Barcode } from "lucide-react";
import { EbookUploadField } from "@/components/admin/EbookUploadField";
import { CoverUploadField } from "@/components/admin/CoverUploadField";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function EditBukuPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const buku = await prisma.buku.findUnique({ where: { id } });
  if (!buku) notFound();

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link 
              href="/admin/buku" 
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Koleksi Buku</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                Formulir Perubahan Data Buku
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-16 relative z-10">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/90 shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Edit Data Buku</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Perbarui judul, penulis, cover, dan penyesuaian stok buku
                </p>
              </div>
            </div>

            <Link
              href={`/admin/buku/${buku.id}/eksemplar`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Kelola Eksemplar</span>
            </Link>
          </div>

          <form action={updateBuku.bind(null, buku.id)} className="space-y-6">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Judul Buku
              </label>
              <input
                name="judul"
                defaultValue={buku.judul}
                required
                className="w-full h-11 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium shadow-xs"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Nama Penulis / Pengarang
              </label>
              <input
                name="penulis"
                defaultValue={buku.penulis}
                required
                className="w-full h-11 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-xs"
              />
            </div>

            {/* Foto Sampul / Cover Upload */}
            <CoverUploadField initialCoverUrl={buku.cover_url} />

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Total Stok Keseluruhan
              </label>
              <input
                name="stok_total"
                type="number"
                min="1"
                defaultValue={buku.stok_total}
                required
                className="w-full h-11 font-mono border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-xs"
              />
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2.5 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  Stok saat ini tersedia untuk dipinjam: <strong className="text-blue-600 dark:text-blue-400 font-bold">{buku.stok_tersedia}</strong> eksemplar.
                </span>
              </div>
            </div>

            {/* E-Book Digital PDF Upload & Linking */}
            <EbookUploadField 
              initialFileUrl={buku.file_url} 
              initialIsEbook={buku.is_ebook} 
            />

            <div className="flex items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
              <Link
                href="/admin/buku"
                className="h-11 px-5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-sm font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 flex items-center transition-all cursor-pointer shadow-xs"
              >
                Batal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
