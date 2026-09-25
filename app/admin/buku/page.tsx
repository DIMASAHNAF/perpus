import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { deleteBuku } from "@/actions/buku";
import { Button } from "@/components/ui/Button";
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  User, 
  Layers, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";

export default async function BukuPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const buku = await prisma.buku.findMany({
    orderBy: { createdAt: "desc" },
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
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h1 className="text-lg font-bold text-slate-900">Koleksi Buku Perpustakaan</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/buku/import">
                <Button size="sm" variant="outline">
                  <FileSpreadsheet className="w-4 h-4" />
                  Import Massal
                </Button>
              </Link>
              <Link href="/admin/buku/create">
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                  Tambah Buku Baru
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Daftar Buku Tersedia</h2>
            <p className="text-xs text-slate-500">Total {buku.length} judul buku terdaftar di sistem</p>
          </div>

          <Link href="/admin/buku/create">
            <Button size="default">
              <Plus className="w-4 h-4" />
              Tambah Buku Baru
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Buku
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Penulis
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status Stok
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {buku.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-14 bg-slate-100 rounded border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {b.cover_url ? (
                          <img src={b.cover_url} alt={b.judul} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{b.judul}</div>
                        <div className="text-xs text-slate-500">ID: {b.id.slice(0, 10)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {b.penulis}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          b.stok_tersedia > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {b.stok_tersedia} Tersedia
                        </span>
                        <span className="text-xs text-slate-400">/ Total {b.stok_total}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/buku/${b.id}/edit`}>
                          <Button size="sm" variant="outline" className="text-xs text-slate-700">
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <form action={deleteBuku.bind(null, b.id)}>
                          <Button size="sm" variant="destructive" type="submit" className="text-xs">
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

          {buku.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>Belum ada data buku yang terdaftar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

