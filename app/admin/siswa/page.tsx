import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { deleteSiswa } from "@/actions/siswa";
import { Button } from "@/components/ui/Button";
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  GraduationCap, 
  Hash,
  AlertCircle 
} from "lucide-react";

export default async function SiswaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const siswa = await prisma.siswa.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          transaksi: {
            where: { status: "DIPINJAM" }
          }
        }
      }
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link 
                href="/admin" 
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h1 className="text-lg font-bold text-slate-900">Data Anggota Siswa</h1>
              </div>
            </div>

            <Link href="/admin/siswa/create">
              <Button size="sm">
                <UserPlus className="w-4 h-4" />
                Tambah Siswa
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Daftar Anggota Perpustakaan</h2>
            <p className="text-xs text-slate-500">Total {siswa.length} siswa terdaftar sebagai anggota peminjam</p>
          </div>

          <Link href="/admin/siswa/create">
            <Button size="default">
              <UserPlus className="w-4 h-4" />
              Tambah Siswa Baru
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    NISN & Siswa
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status Pinjam
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {siswa.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200 shrink-0">
                          {s.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{s.nama}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                            <Hash className="w-3 h-3 text-slate-400" />
                            {s.nisn}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                        {s.kelas}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s._count.transaksi > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {s._count.transaksi} buku aktif dipinjam
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Tidak ada pinjaman
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <Link href={`/admin/siswa/${s.id}/edit`}>
                          <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs">
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            Edit
                          </Button>
                        </Link>
                        <form action={deleteSiswa.bind(null, s.id)}>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            type="submit"
                            className="h-8 px-2.5 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {siswa.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Belum ada data siswa terdaftar.</p>
              <Link href="/admin/siswa/create" className="mt-3 inline-block">
                <Button size="sm">
                  <UserPlus className="w-4 h-4" />
                  Tambah Siswa Pertama
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
