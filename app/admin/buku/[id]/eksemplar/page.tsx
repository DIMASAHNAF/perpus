import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  Printer,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import GenerateEksemplarForm from "@/components/admin/GenerateEksemplarForm";
import PrintLabelDialog from "@/components/admin/PrintLabelDialog";

export default async function EksemplarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const buku = await prisma.buku.findUnique({
    where: { id },
    include: {
      eksemplar: {
        include: { rak: true },
        orderBy: { kode: "asc" },
      },
    },
  });

  if (!buku) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">Buku tidak ditemukan</p>
          <Link href="/admin/buku">
            <Button className="mt-4">Kembali ke Daftar Buku</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/buku"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Daftar Buku
              </Link>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h1 className="text-lg font-bold text-slate-900 line-clamp-1">
                  {buku.judul}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Generate Eksemplar Form */}
        <GenerateEksemplarForm bukuId={buku.id} />

        {/* Daftar Eksemplar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Eksemplar ({buku.eksemplar.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Total stok: {buku.stok_total} | Tersedia: {buku.stok_tersedia}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Kode
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Rak
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {buku.eksemplar.map((eks) => (
                  <tr key={eks.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                      {eks.kode}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          eks.status === "TERSEDIA"
                            ? "bg-emerald-100 text-emerald-800"
                            : eks.status === "DIPINJAM"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {eks.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {eks.rak?.nama ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PrintLabelDialog
                          kode={eks.kode}
                          judul={buku.judul}
                          rakNama={eks.rak?.nama}
                          klasifikasi={buku.klasifikasi}
                          penulis={buku.penulis}
                          isReferensi={buku.is_referensi}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {buku.eksemplar.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>Belum ada eksemplar. Generate eksemplar baru di atas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
