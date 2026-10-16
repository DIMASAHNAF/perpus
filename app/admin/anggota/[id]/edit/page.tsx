import { updateAnggota } from "@/actions/anggota";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Edit3,
  Users,
  GraduationCap,
  CalendarDays,
  Hash,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function EditAnggotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const anggota = await prisma.anggota.findUnique({
    where: { id },
    include: { kelasRef: true },
  });

  if (!anggota) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-xl">
          <p className="text-slate-800 dark:text-slate-300 font-bold mb-4">Anggota tidak ditemukan</p>
          <Link href="/admin/anggota">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">
              Kembali ke Daftar Anggota
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const kelas = await prisma.kelas.findMany({
    orderBy: [{ tingkat: "asc" }, { jurusan: "asc" }, { nomor: "asc" }],
  });

  const updateWithId = updateAnggota.bind(null, anggota.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Background Soft Blue Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/20 via-sky-400/15 to-transparent blur-[120px] animate-aurora-mesh-1" />
        <div className="absolute top-[30%] -right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-blue-600/15 to-transparent blur-[130px] animate-aurora-mesh-2" />
        <div className="absolute -bottom-[15%] left-[20%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-sky-500/10 to-transparent blur-[140px] animate-aurora-mesh-3" />
      </div>

      {/* Top Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-xs mb-6 sm:mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link
              href="/admin/anggota"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Kembali ke Daftar Anggota
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{anggota.no_anggota}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-12 w-full">
        <div className="bg-white/90 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-xl p-5 sm:p-8">
          <div className="flex items-center gap-3.5 pb-5 mb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center p-1 shrink-0 shadow-xs">
              <img
                src="/assets/logo.png"
                alt="Logo Perpustakaan"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Edit Anggota: {anggota.nama}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Terdaftar sejak {formatDate(anggota.createdAt)}
              </p>
            </div>
          </div>

          <form action={updateWithId} className="space-y-5">
            {/* Jenis anggota */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Jenis Anggota
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["SISWA", "GURU", "STAF"] as const).map((j) => (
                  <label
                    key={j}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all has-[:checked]:bg-blue-500/10 has-[:checked]:border-blue-500/60 has-[:checked]:text-blue-600 dark:has-[:checked]:text-blue-400 shadow-xs"
                  >
                    <input
                      type="radio"
                      name="jenis"
                      value={j}
                      defaultChecked={anggota.jenis === j}
                      className="cursor-pointer accent-blue-600"
                    />
                    <span>
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
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Nama Lengkap
              </label>
              <Input
                name="nama"
                required
                defaultValue={anggota.nama}
                className="bg-white dark:bg-slate-950/80 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 rounded-xl shadow-xs"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                NISN / NIP (Identitas Barcode)
              </label>
              <Input
                name="nisn"
                defaultValue={anggota.nisn ?? ""}
                placeholder="10 digit NISN atau NIP"
                className="font-mono bg-white dark:bg-slate-950/80 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 rounded-xl shadow-xs"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Kelas
              </label>
              <select
                name="kelasId"
                defaultValue={anggota.kelasId ?? ""}
                className="w-full h-10 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-950/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-400">-- Pilih Kelas (Opsional untuk Guru/Staf) --</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                No. WhatsApp / Telepon
              </label>
              <Input
                name="telepon"
                defaultValue={anggota.telepon ?? ""}
                placeholder="08xxxxxxxxxx"
                className="font-mono bg-white dark:bg-slate-950/80 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 rounded-xl shadow-xs"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Alamat (opsional)
              </label>
              <Input 
                name="alamat" 
                defaultValue={anggota.alamat ?? ""} 
                className="bg-white dark:bg-slate-950/80 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 rounded-xl shadow-xs"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
              <input
                type="checkbox"
                name="status_aktif"
                defaultChecked={anggota.status_aktif}
                className="cursor-pointer w-4 h-4 accent-blue-600 rounded"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Status Keanggotaan Aktif (Dapat Meminjam Buku)
              </span>
            </label>

            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
              <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Bergabung:{" "}
                <strong className="text-blue-600 dark:text-blue-300">
                  {formatDate(anggota.createdAt)}{" "}
                  {new Date(anggota.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  WIB
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button type="submit" className="h-10 px-6 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-600/20 active:scale-95">
                <Edit3 className="w-4 h-4 text-white" />
                Simpan Perubahan
              </Button>
              <Link href="/admin/anggota">
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
