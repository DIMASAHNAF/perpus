import { createBuku } from "@/actions/buku";
import { BukuFormClient } from "@/components/admin/BukuFormClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

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

export default async function CreateBukuPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/admin/buku"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Buku
            </Link>
            <div className="text-xs text-slate-500 font-medium">
              Formulir Data Buku Baru
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tambah Buku Baru</h1>
              <p className="text-xs text-slate-500">
                Isi ISBN untuk auto-fetch metadata, atau gunakan suara untuk
                judul/penulis
              </p>
            </div>
          </div>

          <BukuFormClient
            createBuku={createBuku}
            mataPelajaran={MATA_PELAJARAN}
            today={new Date().toLocaleDateString("id-ID")}
          />
        </div>
      </div>
    </div>
  );
}
