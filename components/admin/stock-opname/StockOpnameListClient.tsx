"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Plus,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Layers,
  ChevronRight,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Check,
  Building2,
  FileSpreadsheet,
  FileCheck
} from "lucide-react";
import {
  createStockOpnameSession,
  deleteStockOpnameSession,
  batalkanStockOpname,
} from "@/actions/stock-opname";

type RakOption = {
  id: string;
  nama: string;
  nomor: number;
};

type SessionItem = {
  id: string;
  nama_sesi: string;
  petugas: string | null;
  tanggal_mulai: Date | string;
  tanggal_selesai: Date | string | null;
  status: "DRAFT" | "BERJALAN" | "SELESAI" | "DIBATALKAN";
  rakId: string | null;
  catatan: string | null;
  rakRef: { id: string; nama: string; nomor: number } | null;
  summary: {
    total: number;
    terpindai: number;
    belumTerpindai: number;
    sesuai: number;
    salahRak: number;
    rusak: number;
    anomaliDipinjam: number;
    persentase: number;
  };
};

export function StockOpnameListClient({
  initialSessions,
  rakList,
}: {
  initialSessions: SessionItem[];
  rakList: RakOption[];
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form state
  const [namaSesi, setNamaSesi] = useState("");
  const [petugas, setPetugas] = useState("Petugas Perpustakaan");
  const [rakId, setRakId] = useState<string>("");
  const [catatan, setCatatan] = useState("");

  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      s.nama_sesi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.petugas && s.petugas.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.rakRef && s.rakRef.nama.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === "ALL") return matchSearch;
    return matchSearch && s.status === statusFilter;
  });

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSesi.trim()) {
      setErrorMessage("Nama sesi audit wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await createStockOpnameSession({
        nama_sesi: namaSesi,
        petugas,
        rakId: rakId || null,
        catatan,
      });

      if (res.ok && res.id) {
        setIsModalOpen(false);
        setNamaSesi("");
        setCatatan("");
        router.push(`/admin/stock-opname/${res.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal membuat sesi stock opname");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus sesi Stock Opname ini? Semua data audit pada sesi ini akan dihapus.")) {
      return;
    }

    try {
      await deleteStockOpnameSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus sesi");
    }
  };

  const getStatusBadge = (status: SessionItem["status"]) => {
    switch (status) {
      case "BERJALAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Sedang Audit
          </span>
        );
      case "SELESAI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesai
          </span>
        );
      case "DIBATALKAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-500/15 text-stone-600 dark:text-slate-400 border border-stone-300 dark:border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            Draf
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800/60 mb-2">
            <Boxes className="w-3.5 h-3.5" />
            INVENTARISASI KOLEKSI FISIK
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
            Stock Opname Perpustakaan
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
            Audit fisik buku di rak, verifikasi barcode eksemplar, temukan buku salah rak, dan rekonsiliasi stok.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Mulai Audit Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari sesi audit, petugas, atau rak..."
            className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Semua Sesi" },
            { id: "BERJALAN", label: "Sedang Berjalan" },
            { id: "SELESAI", label: "Selesai" },
            { id: "DIBATALKAN", label: "Dibatalkan" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-white/80 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session Cards List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4 border border-sky-200 dark:border-sky-800/60">
            <Boxes className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-white">
            Belum ada sesi Stock Opname
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Mulai sesi audit baru untuk mencocokkan kondisi fisik buku di rak dengan data sistem perpustakaan.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Buat Sesi Audit Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((sesi) => {
            const { summary } = sesi;
            return (
              <Link
                key={sesi.id}
                href={`/admin/stock-opname/${sesi.id}`}
                className="group relative bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-sky-500/60 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getStatusBadge(sesi.status)}
                        <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-sky-500" />
                          {sesi.rakRef ? sesi.rakRef.nama : "Semua Rak (Global)"}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-stone-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                        {sesi.nama_sesi}
                      </h2>
                    </div>

                    <button
                      onClick={(e) => handleDelete(sesi.id, e)}
                      title="Hapus Sesi"
                      className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {sesi.catatan && (
                    <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-1 mb-4 italic">
                      "{sesi.catatan}"
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-stone-600 dark:text-slate-300">
                        Progres Audit Fisik
                      </span>
                      <span className="text-sky-600 dark:text-sky-400 font-bold">
                        {summary.terpindai} / {summary.total} Eksemplar ({summary.persentase}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sesi.status === "SELESAI"
                            ? "bg-emerald-500"
                            : "bg-gradient-to-r from-blue-500 to-sky-400"
                        }`}
                        style={{ width: `${summary.persentase}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Pills */}
                  <div className="grid grid-cols-4 gap-2 text-center py-2.5 px-3 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-stone-200/60 dark:border-slate-800 mb-4">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-400">Sesuai</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{summary.sesuai}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-400">Salah Rak</div>
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400">{summary.salahRak}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-400">Rusak</div>
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{summary.rusak}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-400">Belum Scan</div>
                      <div className="text-sm font-bold text-stone-600 dark:text-slate-300">{summary.belumTerpindai}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-slate-800 text-xs text-stone-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>{sesi.petugas || "Petugas"}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{new Date(sesi.tanggal_mulai).toLocaleDateString("id-ID")}</span>
                  </div>

                  <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Buka Sesi <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal: Mulai Sesi Stock Opname Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-5 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-white">
                    Mulai Sesi Stock Opname Baru
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Ambil snapshot eksemplar untuk mulai verifikasi fisik
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  Nama Sesi Audit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaSesi}
                  onChange={(e) => setNamaSesi(e.target.value)}
                  placeholder="Contoh: Audit Semester Ganjil 2026 atau Audit Rak 1 - 3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                    Petugas Pemeriksa
                  </label>
                  <input
                    type="text"
                    value={petugas}
                    onChange={(e) => setPetugas(e.target.value)}
                    placeholder="Nama Petugas / Tim"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                    Cakupan Rak
                  </label>
                  <select
                    value={rakId}
                    onChange={(e) => setRakId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  >
                    <option value="">Semua Rak (Audit Global)</option>
                    {rakList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nama} (DDC {r.nomor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misal: Fokus audit koleksi baru dan perbaikan penataan rak DDC"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? "Membuat Snapshot..." : "Mulai Sesi Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
