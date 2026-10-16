"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  User, 
  Search, 
  FileSpreadsheet, 
  Barcode, 
  Filter, 
  Sparkles, 
  Layers, 
  AlertCircle,
  Tag,
  ArrowUpDown,
  BookCopy,
  AlertTriangle,
  Loader2,
  Check,
  X
} from "lucide-react";
import { deleteBuku, deleteMultipleBuku, deleteAllBuku } from "@/actions/buku";

export type BukuListItem = {
  id: string;
  judul: string;
  penulis: string;
  cover_url: string | null;
  file_url?: string | null;
  is_ebook?: boolean;
  kategori: string | null;
  klasifikasi: string | null;
  stok_total: number;
  stok_tersedia: number;
  tipe_buku: string;
  tahun_ajaran: string | null;
  kode_buku: string | null;
  _count?: {
    eksemplar: number;
  };
};

export function BukuListClient({ initialBuku }: { initialBuku: BukuListItem[] }) {
  const router = useRouter();
  const [bukuList, setBukuList] = useState<BukuListItem[]>(initialBuku);
  const [query, setQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "TERSEDIA" | "HABIS" | "EBOOK">("ALL");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [bukuToDelete, setBukuToDelete] = useState<BukuListItem | null>(null);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [forceDelete, setForceDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setBukuList(initialBuku);
  }, [initialBuku]);

  // List of unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    bukuList.forEach((b) => {
      if (b.kategori) set.add(b.kategori);
    });
    return Array.from(set).sort();
  }, [bukuList]);

  // Filtered books
  const filteredBuku = useMemo(() => {
    return bukuList.filter((b) => {
      const q = query.toLowerCase().trim();
      const matchQuery =
        !q ||
        b.judul.toLowerCase().includes(q) ||
        b.penulis.toLowerCase().includes(q) ||
        (b.kode_buku && b.kode_buku.toLowerCase().includes(q)) ||
        (b.klasifikasi && b.klasifikasi.toLowerCase().includes(q)) ||
        b.id.toLowerCase().includes(q);

      const matchKategori =
        kategoriFilter === "ALL" || b.kategori === kategoriFilter;

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "TERSEDIA" && b.stok_tersedia > 0) ||
        (statusFilter === "HABIS" && b.stok_tersedia <= 0) ||
        (statusFilter === "EBOOK" && (b.file_url || b.is_ebook));

      return matchQuery && matchKategori && matchStatus;
    });
  }, [bukuList, query, kategoriFilter, statusFilter]);

  const totalStokSemua = useMemo(() => {
    return bukuList.reduce((acc, curr) => acc + curr.stok_total, 0);
  }, [bukuList]);

  const totalTersediaSemua = useMemo(() => {
    return bukuList.reduce((acc, curr) => acc + curr.stok_tersedia, 0);
  }, [bukuList]);

  // Checkbox helpers
  const isAllFilteredSelected = useMemo(() => {
    if (filteredBuku.length === 0) return false;
    return filteredBuku.every((b) => selectedIds.has(b.id));
  }, [filteredBuku, selectedIds]);

  const isIndeterminate = useMemo(() => {
    if (filteredBuku.length === 0) return false;
    const count = filteredBuku.filter((b) => selectedIds.has(b.id)).length;
    return count > 0 && count < filteredBuku.length;
  }, [filteredBuku, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        filteredBuku.forEach((b) => next.delete(b.id));
      } else {
        filteredBuku.forEach((b) => next.add(b.id));
      }
      return next;
    });
  };

  const selectAllBooks = () => {
    setSelectedIds(new Set(bukuList.map((b) => b.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Actions
  const handleDeleteSingle = async () => {
    if (!bukuToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBuku(bukuToDelete.id);
      setBukuList((prev) => prev.filter((b) => b.id !== bukuToDelete.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(bukuToDelete.id);
        return next;
      });
      toast.success(`Buku "${bukuToDelete.judul}" berhasil dihapus.`);
      setBukuToDelete(null);
      router.refresh();
    } catch (e: any) {
      toast.error(`Gagal menghapus: ${e?.message || e}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await deleteMultipleBuku(ids, forceDelete);
      setBukuList((prev) => prev.filter((b) => !selectedIds.has(b.id)));
      setSelectedIds(new Set());
      setIsDeleteSelectedModalOpen(false);
      setForceDelete(false);
      toast.success(`${res.count} buku terpilih berhasil dihapus.`);
      router.refresh();
    } catch (e: any) {
      toast.error(`Gagal menghapus buku terpilih: ${e?.message || e}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteAllConfirmText.trim().toUpperCase() !== "HAPUS") {
      toast.error('Ketik "HAPUS" untuk konfirmasi.');
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteAllBuku(forceDelete);
      setBukuList([]);
      setSelectedIds(new Set());
      setIsDeleteAllModalOpen(false);
      setDeleteAllConfirmText("");
      setForceDelete(false);
      toast.success(`Seluruh koleksi (${res.count} buku) berhasil dihapus.`);
      router.refresh();
    } catch (e: any) {
      toast.error(`Gagal menghapus seluruh buku: ${e?.message || e}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-stone-300 dark:hover:border-slate-700 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">Judul Buku</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mt-2 tracking-tight">
            {bukuList.length}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">Koleksi Terdaftar</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">Stok Fisik</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
            {totalStokSemua}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">Total Eksemplar</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-teal-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">Tersedia</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <BookCopy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-300 mt-2 tracking-tight">
            {totalTersediaSemua}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">Siap Dipinjam</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">Dipinjam</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-300 mt-2 tracking-tight">
            {Math.max(0, totalStokSemua - totalTersediaSemua)}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">Sedang Dipinjam</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-stone-200 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul buku, penulis, kode, DDC, atau ID..."
              className="w-full h-11 pl-10 pr-4 bg-stone-50 dark:bg-slate-950/60 border border-stone-300 dark:border-slate-800 rounded-xl text-sm text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white px-1.5 py-0.5 rounded bg-stone-200 dark:bg-slate-800 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              href="/admin/buku/scan"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-stone-700 hover:text-stone-900 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-stone-300/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs"
            >
              <Tag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Scan ISBN</span>
            </Link>

            <Link
              href="/admin/buku/import"
              className="hidden sm:inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-stone-700 hover:text-stone-900 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-stone-300/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import Massal</span>
            </Link>

            <Link
              href="/admin/buku/create"
              className="inline-flex items-center gap-2 h-11 px-4.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Tambah Buku</span>
            </Link>

            {/* Tombol Hapus Semua */}
            <button
              type="button"
              onClick={() => {
                setDeleteAllConfirmText("");
                setForceDelete(false);
                setIsDeleteAllModalOpen(true);
              }}
              disabled={bukuList.length === 0}
              title="Hapus Seluruh Koleksi Buku"
              className="inline-flex items-center gap-2 h-11 px-3.5 sm:px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold border border-rose-500/25 hover:border-rose-500/40 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Hapus Semua</span>
            </button>
          </div>
        </div>

        {/* Status & Category Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-200 dark:border-slate-800/80">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-white text-stone-900 dark:bg-slate-800 dark:text-emerald-400 shadow-xs border border-stone-300 dark:border-slate-700 font-bold"
                  : "text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Semua ({bukuList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("TERSEDIA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "TERSEDIA"
                  ? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Tersedia ({bukuList.filter((b) => b.stok_tersedia > 0).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("HABIS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "HABIS"
                  ? "bg-rose-500/15 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/30 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Habis ({bukuList.filter((b) => b.stok_tersedia <= 0).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("EBOOK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "EBOOK"
                  ? "bg-purple-500/20 text-purple-800 dark:bg-purple-500/25 dark:text-purple-300 border border-purple-500/40 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>E-Book Digital ({bukuList.filter((b) => b.file_url || b.is_ebook).length})</span>
            </button>
          </div>

          {/* Category Dropdown/Selector */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400 shrink-0" />
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="h-9 px-3 bg-stone-50 dark:bg-slate-950/70 border border-stone-300 dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer shadow-xs"
              >
                <option value="ALL">Semua Kategori ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main List Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-stone-200 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs relative">
        {/* Header Table Info */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-stone-900 dark:text-white text-base">Koleksi Buku Terdaftar</h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              Menampilkan <span className="text-emerald-600 dark:text-emerald-400 font-bold">{filteredBuku.length}</span> dari {bukuList.length} judul
              {selectedIds.size > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
                  {selectedIds.size} dipilih
                </span>
              )}
            </p>
          </div>

          {/* Quick Select Buttons */}
          {filteredBuku.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-colors cursor-pointer border border-stone-200 dark:border-slate-700"
              >
                {isAllFilteredSelected ? "Batal Pilih Semua" : "Pilih Semua di Tabel"}
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 transition-colors cursor-pointer"
                >
                  Reset Pilihan
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop View Table (hidden on small screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 dark:divide-slate-800/80 text-sm">
            <thead className="bg-stone-50 dark:bg-slate-950/60 border-b border-stone-200 dark:border-slate-800">
              <tr>
                {/* Select All Checkbox */}
                <th className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={toggleSelectAllVisible}
                    aria-label="Pilih semua buku"
                    className="w-4 h-4 rounded border-stone-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500/30 cursor-pointer accent-emerald-600"
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Buku &amp; Identitas
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Penulis &amp; Kategori
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Status Stok
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-slate-800/60">
              {filteredBuku.map((b) => {
                const isSelected = selectedIds.has(b.id);
                return (
                  <tr 
                    key={b.id} 
                    className={`transition-colors group ${
                      isSelected
                        ? "bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/10 dark:hover:bg-rose-500/15"
                        : "hover:bg-stone-50/80 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="w-12 px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(b.id)}
                        aria-label={`Pilih buku ${b.judul}`}
                        className="w-4 h-4 rounded border-stone-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500/30 cursor-pointer accent-rose-600"
                      />
                    </td>

                    {/* Judul & Cover */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5">
                        {/* Cover Image / Thumbnail with Fallback */}
                        <div className="w-11 h-15 rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 shrink-0 overflow-hidden flex items-center justify-center shadow-xs relative group-hover:border-emerald-500/40 transition-all">
                          {b.cover_url ? (
                            <img
                              src={b.cover_url}
                              alt={b.judul}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-1 text-stone-400 dark:text-slate-600">
                              <BookOpen className="w-4 h-4 text-stone-400 dark:text-slate-500 mb-0.5" />
                              <span className="text-[7px] font-bold text-stone-400 dark:text-slate-600 uppercase">Cover</span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-stone-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                            {b.judul}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 dark:text-slate-400 font-mono flex-wrap">
                            {b.kode_buku && (
                              <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-stone-200 dark:border-slate-700">
                                {b.kode_buku}
                              </span>
                            )}
                            {b.klasifikasi && (
                              <span className="text-[11px] text-stone-500 dark:text-slate-400 font-sans">
                                DDC: <strong className="text-stone-700 dark:text-slate-300">{b.klasifikasi}</strong>
                              </span>
                            )}
                            <span className="text-[10px] text-stone-400 dark:text-slate-500">ID: {b.id.slice(0, 8)}…</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Penulis & Kategori */}
                    <td className="px-5 py-3.5 text-stone-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-stone-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{b.penulis}</span>
                      </div>
                      {b.kategori && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 dark:bg-slate-800/80 dark:text-teal-300 dark:border-slate-700/80 font-medium">
                            <Tag className="w-2.5 h-2.5" />
                            {b.kategori}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status Stok & Eksemplar */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              b.stok_tersedia > 0
                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {b.stok_tersedia > 0 ? `${b.stok_tersedia} Tersedia` : "Stok Habis"}
                          </span>
                          <span className="text-xs text-stone-500 dark:text-slate-400 font-mono">/ Total {b.stok_total}</span>
                        </div>
                        <Link
                          href={`/admin/buku/${b.id}/eksemplar`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                        >
                          <Barcode className="w-3 h-3" />
                          Kelola Barcode &amp; Eksemplar →
                        </Link>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {(b.file_url || b.is_ebook) && (
                          <Link
                            href={`/buku/${b.id}/baca`}
                            target="_blank"
                            title="Buka 3D E-Book Reader"
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300 dark:border-purple-800 text-xs font-bold transition-all shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>Baca E-Book</span>
                          </Link>
                        )}

                        <Link
                          href={`/admin/buku/${b.id}/eksemplar`}
                          title="Barcode &amp; Eksemplar"
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-emerald-700 border border-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-emerald-400 dark:border-slate-700 text-xs font-semibold transition-colors"
                        >
                          <Barcode className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Eksemplar</span>
                        </Link>

                        <Link
                          href={`/admin/buku/${b.id}/edit`}
                          title="Edit Buku & E-Book"
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400" />
                          <span>Edit</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setBukuToDelete(b)}
                          title="Hapus Buku"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Card List) */}
        <div className="md:hidden divide-y divide-stone-200 dark:divide-slate-800/80">
          {filteredBuku.map((b) => {
            const isSelected = selectedIds.has(b.id);
            return (
              <div 
                key={b.id} 
                className={`p-4 space-y-3 transition-colors ${
                  isSelected 
                    ? "bg-rose-500/5 dark:bg-rose-500/10" 
                    : "hover:bg-stone-50/70 dark:hover:bg-slate-800/30"
                }`}
              >
                {/* Mobile Checkbox Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-slate-800/60">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(b.id)}
                      className="w-4 h-4 rounded border-stone-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500/30 cursor-pointer accent-rose-600"
                    />
                    <span>Pilih Buku</span>
                  </label>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Terpilih
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  {/* Cover Thumbnail */}
                  <div className="w-16 h-22 rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                    {b.cover_url ? (
                      <img
                        src={b.cover_url}
                        alt={b.judul}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-1 text-stone-400 dark:text-slate-600">
                        <BookOpen className="w-5 h-5 text-stone-400 dark:text-slate-500 mb-0.5" />
                        <span className="text-[8px] font-bold uppercase">No Cover</span>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 dark:text-white text-sm line-clamp-2 leading-snug">
                        {b.judul}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-stone-400 dark:text-slate-500 shrink-0" />
                        {b.penulis}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          b.stok_tersedia > 0
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {b.stok_tersedia > 0 ? `${b.stok_tersedia} Tersedia` : "Habis"}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono">Total: {b.stok_total}</span>
                      {b.kategori && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-stone-200 dark:border-slate-700">
                          {b.kategori}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Mobile */}
                <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-slate-800/60">
                  {(b.file_url || b.is_ebook) && (
                    <Link
                      href={`/buku/${b.id}/baca`}
                      target="_blank"
                      className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40 text-xs font-bold transition-all shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>Buka 3D E-Book Reader</span>
                    </Link>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href={`/admin/buku/${b.id}/eksemplar`}
                      className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-emerald-700 dark:text-emerald-400 border border-stone-200 dark:border-slate-700/80 text-xs font-semibold shadow-xs"
                    >
                      <Barcode className="w-3.5 h-3.5" />
                      <span>Barcode</span>
                    </Link>

                    <Link
                      href={`/admin/buku/${b.id}/edit`}
                      className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700/80 text-xs font-semibold shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400" />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setBukuToDelete(b)}
                      className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBuku.length === 0 && (
          <div className="px-6 py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-slate-300 text-base">Tidak ada buku ditemukan</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {query || kategoriFilter !== "ALL" || statusFilter !== "ALL"
                  ? "Coba ubah kata kunci pencarian atau filter yang aktif."
                  : "Belum ada buku terdaftar di sistem perpustakaan."}
              </p>
            </div>
            {(query || kategoriFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setKategoriFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold mt-2 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar when books are selected */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 text-white animate-in slide-in-from-bottom-5 duration-200 flex-wrap max-w-[95vw]">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{selectedIds.size} buku terpilih</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={selectAllBooks}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Pilih Semua ({bukuList.length})
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setForceDelete(false);
              setIsDeleteSelectedModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition cursor-pointer ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Terpilih ({selectedIds.size})</span>
          </button>
        </div>
      )}

      {/* 1. Modal Hapus 1 Buku */}
      {bukuToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setBukuToDelete(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Hapus Buku Ini?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Anda akan menghapus judul buku:{" "}
                <strong className="text-slate-200">{bukuToDelete.judul}</strong> ({bukuToDelete.penulis}).
                Semua data eksemplar terkait juga akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSingle}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  "Ya, Hapus Buku"
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBukuToDelete(null)}
                className="px-5 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer border border-slate-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Hapus Buku Terpilih (Bulk Delete Selected) */}
      {isDeleteSelectedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setIsDeleteSelectedModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Hapus {selectedIds.size} Buku Terpilih?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Anda akan menghapus sekaligus <strong className="text-slate-200">{selectedIds.size} judul buku</strong> beserta seluruh data eksemplarnya. Tindakan ini bersifat permanen.
              </p>
            </div>

            {/* Opsi Force Delete */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500/30 accent-rose-600 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white">Paksa Hapus Semua Terpilih</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tetap hapus dan bersihkan riwayat transaksi/peminjaman terkait jika ada.
                </p>
              </div>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSelected}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus {selectedIds.size} Buku...</span>
                  </>
                ) : (
                  `Ya, Hapus ${selectedIds.size} Buku`
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteSelectedModalOpen(false)}
                className="px-5 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer border border-slate-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Hapus SEMUA Koleksi Buku (Delete All) */}
      {isDeleteAllModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setIsDeleteAllModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  Tindakan Berbahaya
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Hapus SEMUA Buku Perpustakaan?
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
              <strong>PERINGATAN:</strong> Anda akan menghapus seluruh data katalog buku (<strong className="text-white">{bukuList.length} judul</strong>) dan seluruh eksemplar fisik yang ada di sistem database perpustakaan.
            </div>

            {/* Input Konfirmasi Keamanan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Ketik <strong className="text-rose-400 font-mono">HAPUS</strong> untuk mengonfirmasi:
              </label>
              <input
                type="text"
                value={deleteAllConfirmText}
                onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                placeholder='Ketik "HAPUS"'
                className="w-full h-11 px-3.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 font-mono"
              />
            </div>

            {/* Opsi Force Delete */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500/30 accent-rose-600 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white">Paksa Hapus Semua</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bersihkan juga seluruh transaksi peminjaman &amp; data audit stock opname yang terkait.
                </p>
              </div>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting || deleteAllConfirmText.trim().toUpperCase() !== "HAPUS"}
                onClick={handleDeleteAll}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus Semua Koleksi...</span>
                  </>
                ) : (
                  `Hapus Semua (${bukuList.length} Judul)`
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmText("");
                }}
                className="px-5 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer border border-slate-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
