import { createKunjungan } from "@/actions/kunjungan";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Users, GraduationCap, ClipboardList } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function CreateKunjunganPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const kelas = await prisma.kelas.findMany({
    orderBy: [{ tingkat: "asc" }, { jurusan: "asc" }, { nomor: "asc" }],
  });

  const keperluanOptions = [
    "Membaca Buku",
    "Pinjam / Kembali Buku",
    "Mengerjakan Tugas & Belajar",
    "Literasi Digital / Komputer",
    "Kunjungan Bebas",
    "Lainnya",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Background Soft Blue Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/20 via-sky-400/15 to-transparent blur-[120px] animate-aurora-mesh-1" />
        <div className="absolute top-[30%] -right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-blue-600/15 to-transparent blur-[130px] animate-aurora-mesh-2" />
        <div className="absolute -bottom-[15%] left-[20%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-sky-500/10 to-transparent blur-[140px] animate-aurora-mesh-3" />
      </div>

      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-xs mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/admin/kunjungan"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Kembali ke Statistik Pengunjung
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Formulir Kunjungan
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-12 w-full">
        <div className="bg-white/90 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-xl p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-200 dark:border-slate-800">
            <img
              src="/assets/logo.png"
              alt="Logo Perpustakaan"
              className="w-10 h-10 object-contain rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-slate-700 p-1 shrink-0 shadow-xs"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Catat Kunjungan Pengunjung
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Input manual oleh petugas. Waktu kunjungan tercatat otomatis.
              </p>
            </div>
          </div>

          <form action={createKunjungan} className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Nama Pengunjung
              </label>
              <Input
                name="nama"
                required
                placeholder="Contoh: Siti Nurhaliza"
                className="bg-white dark:bg-slate-950/80 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 rounded-xl shadow-xs"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Kelas (opsional)
              </label>
              <select
                name="kelas"
                className="w-full h-10 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-950/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-400">-- Bukan siswa / guru / staf --</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.nama_kelas} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Pilih kelas jika pengunjung adalah siswa.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Keperluan (opsional)
              </label>
              <select
                name="keperluan"
                className="w-full h-10 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-950/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-400">-- Pilih Keperluan --</option>
                {keperluanOptions.map((k) => (
                  <option key={k} value={k} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Tanggal &amp; Waktu Kunjungan
              </label>
              <Input
                type="datetime-local"
                name="tanggal"
                defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
                className="bg-white dark:bg-slate-950/80 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 rounded-xl shadow-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Default waktu sekarang. Bisa diubah untuk input kunjungan hari sebelumnya.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button type="submit" className="h-10 px-6 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-600/20 active:scale-95">
                <UserPlus className="w-4 h-4 text-white" />
                Simpan Kunjungan
              </Button>
              <Link href="/admin/kunjungan">
                <Button variant="outline" type="button" className="h-10 rounded-xl border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
                  Batal
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
