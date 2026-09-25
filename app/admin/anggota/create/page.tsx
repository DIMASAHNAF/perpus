import { createAnggota } from "@/actions/anggota";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Users,
  GraduationCap,
  CalendarDays,
} from "lucide-react";

export default async function CreateAnggotaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const kelas = await prisma.kelas.findMany({
    orderBy: [{ tingkat: "asc" }, { jurusan: "asc" }, { nomor: "asc" }],
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/admin/anggota"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Anggota
            </Link>
            <div className="text-xs text-slate-500 font-medium">
              Formulir Anggota Baru
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
              <h1 className="text-xl font-bold text-slate-900">
                Tambah Anggota Baru
              </h1>
              <p className="text-xs text-slate-500">
                No. anggota dibuat otomatis (A0001, A0002, …). Tanggal bergabung
                tercatat realtime.
              </p>
            </div>
          </div>

          <form action={createAnggota} className="space-y-5">
            {/* Jenis anggota */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-800">
                Jenis Anggota
              </label>
              <div className="flex gap-4">
                {(["SISWA", "GURU", "STAF"] as const).map((j, i) => (
                  <label
                    key={j}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="jenis"
                      value={j}
                      defaultChecked={i === 0}
                      className="cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {j === "SISWA"
                        ? "Siswa"
                        : j === "GURU"
                          ? "Guru"
                          : "Staf"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Nama Lengkap
              </label>
              <Input
                name="nama"
                required
                placeholder="Contoh: Ahmad Fauzi"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                NISN (khusus siswa)
              </label>
              <Input
                name="nisn"
                placeholder="10 digit NISN"
                className="font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Wajib untuk siswa. Dipakai untuk scan kartu.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                Kelas
              </label>
              <select
                name="kelasId"
                className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                No. Telepon (khusus guru/staf)
              </label>
              <Input
                name="telepon"
                placeholder="08xxxxxxxxxx"
                className="font-mono"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Alamat (opsional)
              </label>
              <Input name="alamat" placeholder="Alamat lengkap" />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-emerald-50/50 border border-emerald-100 rounded-lg px-4 py-3">
              <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Tanggal bergabung: <strong>{new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}</strong> — dicatat otomatis saat disimpan.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" className="h-10 px-5">
                <UserPlus className="w-4 h-4" />
                Simpan Anggota
              </Button>
              <Link href="/admin/anggota">
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
