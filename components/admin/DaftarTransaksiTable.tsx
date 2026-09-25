"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  Trash2,
  Search,
  X,
  PlusCircle,
  FileText,
  AlertTriangle,
  BookOpen,
  BookMarked,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRupiah, getRemainingDays, getDurationDays } from "@/lib/utils";
import { selesaikanTransaksi, perpanjangTransaksi, updateTransaksi, deleteTransaksi } from "@/actions/transaksi";

type TransaksiItem = {
  id: string;
  siswaId: string | null;
  bukuId: string | null;
  tgl_pinjam: Date | string;
  batas_kembali: Date | string;
  tgl_dikembalikan: Date | string | null;
  status: "DIPINJAM" | "SELESAI";
  denda: number;
  groupId: string | null;
  siswa: {
    id: string;
    nama: string;
    nisn: string;
    kelas: string;
  } | null;
  buku: {
    id: string;
    judul: string;
    penulis: string;
    tipe_buku: "BIASA" | "MAPEL";
  } | null;
};

// Satu baris = satu grup peminjaman (bisa berisi banyak buku)
type Group = {
  key: string;
  items: TransaksiItem[];
  siswa: TransaksiItem["siswa"];
  tgl_pinjam: Date | string;
  batas_kembali: Date | string;
  tgl_dikembalikan: Date | string | null;
  status: "DIPINJAM" | "SELESAI";
  denda: number;
  tipe: "BIASA" | "MAPEL";
};

type FilterTab = "ALL" | "ACTIVE" | "LATE" | "DONE";

const buildGroups = (list: TransaksiItem[]): Group[] => {
  const map = new Map<string, TransaksiItem[]>();
  for (const t of list) {
    const key = t.groupId ?? `single:${t.id}`;
    const arr = map.get(key);
    if (arr) arr.push(t);
    else map.set(key, [t]);
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const head = items[0];
    return {
      key,
      items,
      siswa: head.siswa,
      tgl_pinjam: head.tgl_pinjam,
      batas_kembali: head.batas_kembali,
      tgl_dikembalikan: head.tgl_dikembalikan,
      status: head.status,
      denda: items.reduce((sum, t) => sum + t.denda, 0),
      tipe: head.buku?.tipe_buku ?? "BIASA",
    };
  });
};

export default function DaftarTransaksiTable({
  transaksiList,
}: {
  transaksiList: TransaksiItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal States
  const [selectedSlip, setSelectedSlip] = useState<Group | null>(null);
  const [editModalItem, setEditModalItem] = useState<Group | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<Group | null>(null);
  const [customNewDate, setCustomNewDate] = useState("");

  const groups = useMemo(() => buildGroups(transaksiList), [transaksiList]);

  const kelasOptions = useMemo(() => {
    const set = new Set<string>();
    transaksiList.forEach((t) => {
      if (t.siswa?.kelas) set.add(t.siswa.kelas);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [transaksiList]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

    return groups.filter((g) => {
      const isLate = g.status === "DIPINJAM" && getRemainingDays(g.batas_kembali) < 0;

      if (filterTab === "ACTIVE" && g.status !== "DIPINJAM") return false;
      if (filterTab === "LATE" && !isLate) return false;
      if (filterTab === "DONE" && g.status !== "SELESAI") return false;

      if (kelasFilter && g.siswa?.kelas !== kelasFilter) return false;

      if (from !== null || to !== null) {
        const tgl = new Date(g.tgl_pinjam).getTime();
        if (from !== null && tgl < from) return false;
        if (to !== null && tgl > to) return false;
      }

      if (q) {
        const matchSiswa =
          g.siswa?.nama.toLowerCase().includes(q) || g.siswa?.nisn.toLowerCase().includes(q);
        const matchBuku = g.items.some((t) => t.buku?.judul.toLowerCase().includes(q));
        return matchSiswa || matchBuku;
      }
      return true;
    });
  }, [groups, filterTab, searchQuery, kelasFilter, dateFrom, dateTo]);

  const biasaGroups = filteredGroups.filter((g) => g.tipe === "BIASA");
  const mapelGroups = filteredGroups.filter((g) => g.tipe === "MAPEL");

  const resetFilters = () => {
    setFilterTab("ALL");
    setSearchQuery("");
    setKelasFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const handleSelesaikan = (id: string) => {
    startTransition(async () => {
      await selesaikanTransaksi(id);
    });
  };

  const handlePerpanjangHari = (id: string, hari: number) => {
    startTransition(async () => {
      await perpanjangTransaksi(id, hari);
      setEditModalItem(null);
    });
  };

  const handleUpdateTanggal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalItem || !customNewDate) return;

    const formData = new FormData();
    formData.append("batasKembali", customNewDate);

    startTransition(async () => {
      await updateTransaksi(editModalItem.items[0].id, formData);
      setEditModalItem(null);
      setCustomNewDate("");
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTransaksi(id);
      setDeleteModalItem(null);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTable = (list: Group[], accent: "emerald" | "violet") => {
    const empty = list.length === 0;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className={accent === "emerald" ? "bg-emerald-50/60" : "bg-violet-50/60"}>
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Siswa
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Buku Dipinjam
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Tgl Pinjam
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Batas Kembali &amp; Durasi
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status Waktu
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Denda
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Aksi &amp; Opsi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200 text-sm">
            {empty && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs">
                  Tidak ada transaksi pada kategori ini.
                </td>
              </tr>
            )}
            {list.map((g) => {
              const remainingDays = getRemainingDays(g.batas_kembali);
              const durasiHari = getDurationDays(g.tgl_pinjam, g.batas_kembali);
              const isLate = g.status === "DIPINJAM" && remainingDays < 0;
              const isToday = g.status === "DIPINJAM" && remainingDays === 0;
              const multi = g.items.length > 1;

              return (
                <tr key={g.key} className="hover:bg-slate-50/80 transition-colors align-top">
                  {/* Siswa */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{g.siswa?.nama}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      NISN: {g.siswa?.nisn} | {g.siswa?.kelas}
                    </div>
                  </td>

                  {/* Buku (bisa banyak) */}
                  <td className="px-5 py-3.5">
                    <div className="space-y-1">
                      {g.items.map((t) => (
                        <div key={t.id} className="flex items-start gap-1.5">
                          <span className="text-slate-400 mt-0.5">•</span>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 line-clamp-1">{t.buku?.judul}</div>
                            <div className="text-[10px] text-slate-500">{t.buku?.penulis}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {multi && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase">
                        <Layers className="w-2.5 h-2.5" />
                        {g.items.length} Buku
                      </span>
                    )}
                  </td>

                  {/* Tgl Pinjam */}
                  <td className="px-5 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                    {formatDate(g.tgl_pinjam)}
                  </td>

                  {/* Batas Kembali & Durasi */}
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                    <div className={`font-medium ${isLate ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                      {formatDate(g.batas_kembali)}
                    </div>
                    <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-0.5 font-medium">
                      Durasi: {durasiHari} Hari
                    </span>
                  </td>

                  {/* Status Waktu */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {g.status === "DIPINJAM" ? (
                      isLate ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Terlambat {Math.abs(remainingDays)} hari
                        </span>
                      ) : isToday ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Jatuh tempo hari ini
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          Sisa {remainingDays} hari
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Selesai
                      </span>
                    )}
                  </td>

                  {/* Denda */}
                  <td className="px-5 py-3.5 text-xs font-medium whitespace-nowrap">
                    {g.denda > 0 ? (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {formatRupiah(g.denda)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Aksi & Opsi */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="Cetak Slip Peminjaman / Struk"
                        onClick={() => setSelectedSlip(g)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {g.status === "DIPINJAM" && (
                        <>
                          <button
                            title="Perpanjang / Edit Durasi"
                            onClick={() => {
                              setEditModalItem(g);
                              setCustomNewDate(new Date(g.batas_kembali).toISOString().split("T")[0]);
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelesaikan(g.items[0].id)}
                            disabled={isPending}
                            className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer h-7 px-2.5"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Kembalikan
                          </Button>
                        </>
                      )}

                      <button
                        title="Hapus / Batalkan Transaksi"
                        onClick={() => setDeleteModalItem(g)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Riwayat &amp; Daftar Transaksi Peminjaman</h2>
            <p className="text-xs text-slate-500">Kelola durasi, perpanjangan, cetak slip, dan pengembalian</p>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari siswa, NISN, atau judul buku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Tabs Filter Status */}
      <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTab === "ALL"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Semua ({groups.length})
          </button>
          <button
            onClick={() => setFilterTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTab === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Sedang Dipinjam ({groups.filter((t) => t.status === "DIPINJAM").length})
          </button>
          <button
            onClick={() => setFilterTab("LATE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTab === "LATE"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Terlambat (
            {groups.filter((t) => t.status === "DIPINJAM" && getRemainingDays(t.batas_kembali) < 0).length})
          </button>
          <button
            onClick={() => setFilterTab("DONE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTab === "DONE"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Selesai ({groups.filter((t) => t.status === "SELESAI").length})
          </button>
        </div>
      </div>

      {/* Filter Lanjutan: Kelas + Rentang Tanggal */}
      <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Kelas</label>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="h-9 border border-slate-200 rounded-lg px-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[140px]"
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Pinjam Dari</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 border border-slate-200 rounded-lg px-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Sampai</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 border border-slate-200 rounded-lg px-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        <button
          onClick={resetFilters}
          className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Reset Filter
        </button>

        <span className="text-[11px] text-slate-500 ml-auto">
          Menampilkan {filteredGroups.length} grup peminjaman
        </span>
      </div>

      {/* Tabel 1: Peminjaman Buku Biasa */}
      <div className="border-b-4 border-slate-100">
        <div className="px-5 py-2.5 bg-emerald-50 flex items-center gap-2 border-y border-emerald-100">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-emerald-800">Peminjaman Buku Biasa</h3>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            {biasaGroups.length} grup
          </span>
        </div>
        {renderTable(biasaGroups, "emerald")}
      </div>

      {/* Tabel 2: Peminjaman Buku Mapel / LKS */}
      <div>
        <div className="px-5 py-2.5 bg-violet-50 flex items-center gap-2 border-y border-violet-100">
          <BookMarked className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-bold text-violet-800">Peminjaman Buku Mapel / LKS</h3>
          <span className="text-[11px] font-semibold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
            {mapelGroups.length} grup
          </span>
        </div>
        {renderTable(mapelGroups, "violet")}
      </div>

      {filteredGroups.length === 0 && !biasaGroups.length && !mapelGroups.length && (
        <div className="px-6 py-8 text-center text-slate-500 border-t border-slate-100">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm">Tidak ada transaksi yang cocok dengan filter atau pencarian.</p>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL CETAK SLIP PEMINJAMAN                                */}
      {/* ========================================================== */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>Pratinjau Slip Peminjaman Perpustakaan</span>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-slip" className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-slate-800">
              <div className="text-center pb-3 border-b-2 border-slate-800">
                <h3 className="font-extrabold text-base tracking-wide text-slate-900 uppercase">
                  Perpustakaan Digital Sekolah
                </h3>
                <p className="text-[11px] text-slate-600">
                  Jl. Pendidikan No. 123 • Telp: (021) 555-0199 • Email: perpus@sekolah.sch.id
                </p>
                <div className="inline-block mt-1 px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-sm uppercase tracking-wider">
                  Bukti Transaksi Peminjaman Buku
                </div>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500">ID Grup:</span>
                  <span className="font-mono font-bold ml-1">{selectedSlip.key.substring(0, 12).toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Waktu Cetak:</span>
                  <span className="font-medium ml-1">{formatDate(new Date())}</span>
                </div>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Nama Peminjam</span>
                  <span className="col-span-2 font-bold text-slate-900">: {selectedSlip.siswa?.nama}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">NISN / Kelas</span>
                  <span className="col-span-2 font-medium text-slate-800">
                    : {selectedSlip.siswa?.nisn} / Kelas {selectedSlip.siswa?.kelas}
                  </span>
                </div>

                {/* Daftar Buku */}
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Buku Dipinjam</span>
                  <span className="col-span-2 font-bold text-slate-900">: ({selectedSlip.items.length} buku)</span>
                </div>
                <div className="col-span-3 space-y-1 pl-2">
                  {selectedSlip.items.map((t, i) => (
                    <div key={t.id} className="text-[11px] text-slate-700 flex gap-1.5">
                      <span className="text-slate-400">{i + 1}.</span>
                      <span>
                        <strong>{t.buku?.judul}</strong>
                        <span className="text-slate-500"> — {t.buku?.penulis}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Tanggal Pinjam</span>
                  <span className="col-span-2 font-medium text-slate-800">: {formatDate(selectedSlip.tgl_pinjam)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="font-semibold text-emerald-900">Batas Pengembalian</span>
                  <span className="col-span-2 font-extrabold text-emerald-800">
                    : {formatDate(selectedSlip.batas_kembali)} (
                    {getDurationDays(selectedSlip.tgl_pinjam, selectedSlip.batas_kembali)} Hari)
                  </span>
                </div>
                {selectedSlip.status === "SELESAI" && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2 rounded">
                    <span className="text-slate-600">Status</span>
                    <span className="col-span-2 font-bold text-emerald-700">
                      : Sudah Dikembalikan pada{" "}
                      {selectedSlip.tgl_dikembalikan ? formatDate(selectedSlip.tgl_dikembalikan) : "-"}
                    </span>
                  </div>
                )}
                {selectedSlip.denda > 0 && (
                  <div className="grid grid-cols-3 gap-2 bg-rose-50 p-2 rounded border border-rose-200">
                    <span className="font-semibold text-rose-900">Total Denda</span>
                    <span className="col-span-2 font-extrabold text-rose-700">: {formatRupiah(selectedSlip.denda)}</span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 space-y-0.5">
                <p>1. Harap menjaga kondisi buku agar tetap baik dan tidak rusak/hilang.</p>
                <p>2. Keterlambatan dikenakan denda sesuai dengan peraturan perpustakaan.</p>
                <p>3. Tunjukkan slip ini saat mengembalikan buku ke petugas.</p>
              </div>

              <div className="pt-6 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="text-slate-500">Peminjam,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline text-slate-800">{selectedSlip.siswa?.nama}</p>
                </div>
                <div>
                  <p className="text-slate-500">Petugas Perpustakaan,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline text-slate-800">( Petugas Perpus )</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5 print:hidden">
              <Button variant="outline" size="sm" onClick={() => setSelectedSlip(null)} className="cursor-pointer">
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak / Simpan PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL PERPANJANG / EDIT DURASI HARI                        */}
      {/* ========================================================== */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditModalItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Perpanjang / Edit Durasi Pinjam</h3>
                <p className="text-xs text-slate-500">Berlaku untuk seluruh buku dalam grup ini</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 text-xs space-y-1.5">
              <div>
                <span className="text-slate-500">Peminjam:</span>{" "}
                 <strong className="text-slate-800">{editModalItem.siswa?.nama}</strong> ({editModalItem.siswa?.kelas})
              </div>
              <div>
                <span className="text-slate-500">Jumlah Buku:</span>{" "}
                <strong className="text-slate-800">{editModalItem.items.length} buku</strong>
              </div>
              <div>
                <span className="text-slate-500">Batas Kembali Sekarang:</span>{" "}
                <strong className="text-emerald-700">{formatDate(editModalItem.batas_kembali)}</strong>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-700 block">Pilihan Perpanjangan Cepat:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 3, label: "+3 Hari" },
                  { days: 7, label: "+7 Hari" },
                  { days: 14, label: "+14 Hari" },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    disabled={isPending}
                    onClick={() => handlePerpanjangHari(editModalItem.items[0].id, item.days)}
                    className="py-2 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleUpdateTanggal} className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block">
                Atau Tentukan Tanggal Batas Kembali Baru:
              </label>
              <input
                type="date"
                value={customNewDate}
                onChange={(e) => setCustomNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-9 border border-slate-300 rounded-lg px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalItem(null)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL HAPUS / BATALKAN TRANSAKSI                           */}
      {/* ========================================================== */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-slate-900 text-base">Hapus Transaksi Peminjaman?</h3>
            <p className="text-xs text-slate-600 mt-1">
              Apakah Anda yakin ingin membatalkan transaksi untuk <strong>{deleteModalItem?.siswa?.nama}</strong>
              {deleteModalItem.items.length > 1 && (
                <>
                  {" "}
                  (<strong>{deleteModalItem.items.length} buku</strong>)
                </>
              )}
              ?
            </p>

            {deleteModalItem.status === "DIPINJAM" && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ️ Transaksi ini masih <strong>DIPINJAM</strong>. Menghapusnya akan otomatis{" "}
                <strong>mengembalikan stok buku</strong> ke perpustakaan.
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalItem(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleDelete(deleteModalItem.items[0].id)}
                className="cursor-pointer bg-rose-600 hover:bg-rose-700"
              >
                Ya, Hapus Transaksi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
