import { prisma } from "@/lib/prisma";
import { updateSiswa } from "@/actions/siswa";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowLeft, User, Hash, GraduationCap, Save, Edit3 } from "lucide-react";

export default async function EditSiswaPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const siswa = await prisma.siswa.findUnique({ where: { id } });
  if (!siswa) notFound();

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
              Formulir Perubahan Data Siswa
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Edit Data Siswa</h1>
              <p className="text-xs text-slate-500">Perbarui informasi NISN, nama lengkap, atau kelas siswa</p>
            </div>
          </div>

          <form action={updateSiswa.bind(null, siswa.id)} className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                Nomor Induk Siswa Nasional (NISN)
              </label>
              <Input 
                name="nisn" 
                defaultValue={siswa.nisn} 
                required 
                maxLength={10} 
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Nama Lengkap Siswa
              </label>
              <Input name="nama" defaultValue={siswa.nama} required />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                Kelas / Rombel
              </label>
              <Input name="kelas" defaultValue={siswa.kelas} required />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" className="h-10 px-5">
                <Save className="w-4 h-4" />
                Simpan Perubahan
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
