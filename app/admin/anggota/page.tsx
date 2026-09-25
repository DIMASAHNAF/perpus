import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { deleteAnggota } from "@/actions/anggota";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Hash,
  AlertCircle,
  CreditCard,
  CalendarDays,
  BookCheck,
} from "lucide-react";

export default async function AnggotaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const anggota = await prisma.anggota.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      kelasRef: true,
      _count: {
        select: {
          transaksi: { where: { status: "DIPINJAM" } },
        },
      },
    },
  });

  const totalAktif = anggota.filter((a) => a.status_aktif).length;
  const totalPinjam = anggota.reduce((n, a) => n + a._count.transaksi, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
                <h1 className="text-lg font-bold text-slate-900">Data Anggota</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/anggota/cetak-kartu">
                <Button size="sm" variant="outline" className="h-8">
                  <CreditCard className="w-4 h-4" />
                  Cetak Kartu
                </Button>
              </Link>
              <Link href="/admin/anggota/create">
                <Button size="sm">
                  <UserPlus className="w-4 h-4" />
                  Tambah Anggota
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Anggota
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {anggota.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aktif
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {totalAktif}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Buku Dipinjam
            </p>
            <p className="text-2xl font-extrabold text-sky-700 mt-1">
              {totalPinjam}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Anggota
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    No. Anggota
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Jenis
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Bergabung
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {anggota.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 ${
                            a.jenis === "GURU"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : a.jenis === "STAF"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {a.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {a.nama}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                            {a.nisn ? (
                              <>
                                <Hash className="w-3 h-3 text-slate-400" />
                                {a.nisn}
                              </>
                            ) : a.telepon ? (
                              <>{a.telepon}</>
                            ) : (
                              <span className="italic">tanpa kontak</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-emerald-700">
                        {a.no_anggota}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          a.jenis === "GURU"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : a.jenis === "STAF"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {a.jenis}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <div className="text-xs font-medium">
                            {formatDate(a.createdAt)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(a.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {a._count.transaksi > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <BookCheck className="w-3.5 h-3.5" />
                          {a._count.transaksi} dipinjam
                        </span>
                      ) : a.status_aktif ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Non-aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <Link href={`/admin/anggota/${a.id}/edit`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            Edit
                          </Button>
                        </Link>
                        <form action={deleteAnggota.bind(null, a.id)}>
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

          {anggota.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Belum ada anggota terdaftar.</p>
              <Link href="/admin/anggota/create" className="mt-3 inline-block">
                <Button size="sm">
                  <UserPlus className="w-4 h-4" />
                  Tambah Anggota Pertama
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
