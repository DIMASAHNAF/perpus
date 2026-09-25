import { createSiswa } from "@/actions/siswa";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus, User, Hash, GraduationCap, Sparkles } from "lucide-react";

export default async function CreateSiswaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const kelasList = await prisma.kelas.findMany({
    orderBy: [{ tingkat: "asc" }, { jurusan: "asc" }, { nomor: "asc" }],
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/admin/siswa" 
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Siswa
            </Link>
            <div className="text-xs text-slate-500 font-medium">
              Formulir Pendaftaran Siswa
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tambah Siswa Baru</h1>
              <p className="text-xs text-slate-500">Daftarkan siswa baru dengan memilih kelas dari roster SMK</p>
            </div>
          </div>

          <form action={createSiswa} className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                Nomor Induk Siswa Nasional (NISN)
              </label>
              <input 
                name="nisn" 
                required 
                type="text"
                placeholder="Contoh: 0081234567 (10 digit)" 
                maxLength={10}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">NISN harus unik dan terdiri dari 10 digit angka</p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Nama Lengkap Siswa
              </label>
              <input 
                name="nama" 
                required 
                type="text"
                placeholder="Contoh: Ahmad Fauzan"
                className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                Kelas (Roster SMK)
              </label>
              <select 
                name="kelas" 
                required
                className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama_kelas}>
                    {k.nama_kelas} {k.wali_kelas ? `(${k.wali_kelas})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Pilih kelas dari roster yang tersedia sesuai tingkat & jurusan</p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" className="h-10 px-5">
                <Sparkles className="w-4 h-4" />
                Simpan Data Siswa
              </Button>
              <Link href="/admin/siswa">
                <Button variant="outline" type="button" className="h-10">
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

