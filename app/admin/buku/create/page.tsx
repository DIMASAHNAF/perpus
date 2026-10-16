import { createBuku } from "@/actions/buku";
import { BukuFormClient } from "@/components/admin/BukuFormClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const MATA_PELAJARAN = [
  "IPA",
  "IPS",
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Seni Budaya",
  "Pendidikan Jasmani",
  "Teknologi Informasi",
  "Sejarah",
  "Geografi",
  "Biologi",
  "Kimia",
  "Fisika",
  "Akuntansi",
  "Ekonomi",
  "Hukum Dagang",
  "Lainnya",
];

export default async function CreateBukuPage({
  searchParams,
}: {
  searchParams?: Promise<{ isbn?: string }> | { isbn?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedParams = await Promise.resolve(searchParams);
  const initialIsbn = resolvedParams?.isbn || "";

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
                Formulir Koleksi Buku Baru
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 pb-16 relative z-10">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/90 shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-3.5 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Tambah Buku Baru</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Isi ISBN untuk auto-fetch metadata, atau gunakan suara (voice note) untuk judul/penulis
              </p>
            </div>
          </div>

          <BukuFormClient
            createBuku={createBuku}
            mataPelajaran={MATA_PELAJARAN}
            today={new Date().toLocaleDateString("id-ID")}
            initialIsbn={initialIsbn}
          />
        </div>
      </div>
    </div>
  );
}
