"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { formatDate, formatRupiah, getRemainingDays, getDurationDays } from "@/lib/utils";

type LaporanItem = {
  id: string;
  siswaId: string | null;
  bukuId: string | null;
  tgl_pinjam: Date | string;
  batas_kembali: Date | string;
  tgl_dikembalikan: Date | string | null;
  status: "DIPINJAM" | "SELESAI";
  denda: number;
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
  } | null;
};

export default function LaporanClient({ initialTransaksi }: { initialTransaksi: LaporanItem[] }) {
  const [periode, setPeriode] = useState<"ALL" | "MONTH" | "WEEK" | "TODAY">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DIPINJAM" | "SELESAI" | "DENDA">("ALL");
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return initialTransaksi.filter((item) => {
      const pinjamDate = new Date(item.tgl_pinjam);

      // Filter periode
      if (periode === "TODAY" && pinjamDate < startOfToday) return false;
      if (periode === "WEEK" && pinjamDate < startOfWeek) return false;
      if (periode === "MONTH" && pinjamDate < startOfMonth) return false;

      // Filter status
      if (statusFilter === "DIPINJAM" && item.status !== "DIPINJAM") return false;
      if (statusFilter === "SELESAI" && item.status !== "SELESAI") return false;
      if (statusFilter === "DENDA" && item.denda <= 0) return false;

      // Filter search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchSiswa = item.siswa?.nama?.toLowerCase().includes(q) || item.siswa?.nisn?.toLowerCase().includes(q);
        const matchBuku = item.buku?.judul?.toLowerCase().includes(q);
        return matchSiswa || matchBuku;
      }

      return true;
    });
  }, [initialTransaksi, periode, statusFilter, search]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const total = filteredData.length;
    const dipinjam = filteredData.filter((t) => t.status === "DIPINJAM").length;
    const selesai = filteredData.filter((t) => t.status === "SELESAI").length;
    const totalDenda = filteredData.reduce((acc, t) => acc + (t.denda || 0), 0);
    const terlambat = filteredData.filter(
      (t) => t.status === "DIPINJAM" && getRemainingDays(t.batas_kembali) < 0
    ).length;

    return { total, dipinjam, selesai, totalDenda, terlambat };
  }, [filteredData]);

  // Ekspor Data ke CSV (Format Excel)
  const exportToCSV = () => {
    const headers = [
      "No",
      "ID Transaksi",
      "Nama Siswa",
      "NISN",
      "Kelas",
      "Judul Buku",
      "Penulis",
      "Tgl Pinjam",
      "Batas Kembali",
      "Durasi Hari",
      "Tgl Dikembalikan",
      "Status",
      "Denda (Rp)",
    ];

    const rows = filteredData.map((item, idx) => {
      const durasi = getDurationDays(item.tgl_pinjam, item.batas_kembali);
      return [
        idx + 1,
        `"${item.id}"`,
        `"${item.siswa?.nama?.replace(/"/g, '""') || "-"}"`,
        `"${item.siswa?.nisn || "-"}"`,
        `"${item.siswa?.kelas || "-"}"`,
        `"${item.buku?.judul?.replace(/"/g, '""') || "-"}"`,
        `"${item.buku?.penulis || "-"}"`,
        `"${new Date(item.tgl_pinjam).toISOString().split("T")[0]}"`,
        `"${new Date(item.batas_kembali).toISOString().split("T")[0]}"`,
        durasi,
        item.tgl_dikembalikan ? `"${new Date(item.tgl_dikembalikan).toISOString().split("T")[0]}"` : `"-"`,
        `"${item.status}"`,
        item.denda || 0,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Laporan_Sirkulasi_Perpustakaan_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white print:bg-white print:text-black transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-slate-800/80 sticky top-0 z-20 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link 
                href="/admin" 
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-emerald-400 bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-300/80 dark:border-slate-700/80 transition-colors shrink-0 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xs:inline">Dashboard</span>
              </Link>
              <span className="text-stone-300 dark:text-slate-700 hidden xs:inline">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo SMK Negeri 1 Beringin"
                  className="w-7 h-7 object-contain rounded-xl bg-white/60 dark:bg-white/10 border border-stone-200 dark:border-emerald-500/30 p-1 shrink-0"
                />
                <img
                  src="/assets/logo-kolaborasi.png"
                  alt="Logo Kolaborasi Sumut Berkah"
                  className="h-5 sm:h-6 w-auto object-contain shrink-0"
                />
                <h1 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white truncate">Laporan Sirkulasi</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="cursor-pointer text-xs flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border-stone-300 dark:border-emerald-500/40 text-stone-700 dark:text-emerald-300 hover:text-stone-900 dark:hover:bg-emerald-500/10 rounded-xl shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Ekspor Excel (.csv)</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="cursor-pointer text-xs flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
              >
                <Printer className="w-3.5 h-3.5 text-slate-950" />
                <span className="hidden sm:inline">Cetak Laporan PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-5 sm:space-y-6 print:p-0 print:m-0">
        {/* Kop Laporan Khusus Cetak */}
        <div className="hidden print:block text-center pb-4 mb-6 border-b-2 border-slate-800 text-black">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/assets/logo.png"
              alt="Logo SMK Negeri 1 Beringin"
              className="w-14 h-14 object-contain"
            />
            <img
              src="/assets/logo-kolaborasi.png"
              alt="Logo Kolaborasi Sumut Berkah"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h2 className="text-xl font-extrabold uppercase tracking-wide">Perpustakaan SMK Negeri 1 Beringin</h2>
          <p className="text-xs text-slate-600">Laporan Sirkulasi Peminjaman &amp; Rekapitulasi Denda Buku</p>
          <p className="text-[11px] text-slate-500 mt-1">Dicetak pada: {formatDate(new Date())}</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900/70 rounded-3xl border border-stone-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-2xl backdrop-blur-xl p-4 sm:p-5 space-y-3.5 print:hidden">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau judul buku..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs bg-stone-50 dark:bg-slate-950/80 border border-stone-300 dark:border-slate-800 rounded-xl text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-inner"
              />
            </div>

            {/* Periode Filter - scrollable */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {[
                { id: "ALL", label: "Semua Waktu" },
                { id: "MONTH", label: "Bulan Ini" },
                { id: "WEEK", label: "Minggu Ini" },
                { id: "TODAY", label: "Hari Ini" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriode(p.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                    periode === p.id
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-white border border-stone-300/80 dark:border-slate-700/80 shadow-xs"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 pt-3 border-t border-stone-200 dark:border-slate-800/80 text-xs overflow-x-auto no-scrollbar">
            <span className="font-bold text-stone-500 dark:text-slate-400 shrink-0 mr-1">Status:</span>
            {[
              { id: "ALL", label: "Semua" },
              { id: "DIPINJAM", label: "Sedang Dipinjam" },
              { id: "SELESAI", label: "Selesai Kembali" },
              { id: "DENDA", label: "Ada Denda" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                  statusFilter === s.id
                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ringkasan Statistik Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 print:hidden">
          <div className="bg-white dark:bg-slate-900/70 p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-lg backdrop-blur-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Total Sirkulasi</p>
              <p className="text-xl font-black text-stone-900 dark:text-white">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-lg backdrop-blur-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Buku Dipinjam</p>
              <p className="text-xl font-black text-cyan-600 dark:text-cyan-400">{stats.dipinjam}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-lg backdrop-blur-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Dikembalikan</p>
              <p className="text-xl font-black text-teal-600 dark:text-teal-400">{stats.selesai}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-lg backdrop-blur-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Total Denda</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400">{formatRupiah(stats.totalDenda)}</p>
            </div>
          </div>
        </div>

        {/* Tabel Data Rekap Laporan */}
        <div className="bg-white dark:bg-slate-900/70 rounded-3xl border border-stone-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-2xl backdrop-blur-xl overflow-hidden print:bg-white print:border-black print:rounded-none">
          <div className="px-5 py-4 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center print:hidden">
            <h3 className="font-bold text-stone-900 dark:text-white text-sm">Data Rekap Transaksi Sirkulasi</h3>
            <span className="text-xs bg-emerald-50 dark:bg-slate-800/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1 rounded-full font-bold">
              {filteredData.length} baris
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 dark:divide-slate-800 text-xs print:divide-slate-300">
              <thead className="bg-stone-100 dark:bg-slate-950/60 print:bg-slate-100">
                <tr>
                  <th className="px-4 py-3.5 text-left font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">No</th>
                  <th className="px-4 py-3.5 text-left font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">Siswa (NISN)</th>
                  <th className="px-4 py-3.5 text-left font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">Buku</th>
                  <th className="px-4 py-3.5 text-left font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">Tgl Pinjam</th>
                  <th className="px-4 py-3.5 text-left font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">Batas Kembali</th>
                  <th className="px-4 py-3.5 text-left font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">Durasi</th>
                  <th className="px-4 py-3.5 text-left font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">Status</th>
                  <th className="px-4 py-3.5 text-left font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">Tgl Kembali</th>
                  <th className="px-4 py-3.5 text-right font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider print:text-black">Denda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-slate-800/60 bg-transparent print:divide-slate-200">
                {filteredData.map((item, index) => {
                  const durasi = getDurationDays(item.tgl_pinjam, item.batas_kembali);
                  const remaining = getRemainingDays(item.batas_kembali);
                  const isLate = item.status === "DIPINJAM" && remaining < 0;

                  return (
                    <tr key={item.id} className="hover:bg-stone-100/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 text-stone-500 dark:text-slate-500 font-mono">{index + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-stone-900 dark:text-white print:text-black">{item.siswa?.nama ?? "-"}</div>
                        <div className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">NISN: {item.siswa?.nisn} ({item.siswa?.kelas})</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-stone-800 dark:text-slate-200 print:text-black">{item.buku?.judul ?? "-"}</div>
                        <div className="text-[10px] text-stone-500 dark:text-slate-400">{item.buku?.penulis}</div>
                      </td>
                      <td className="px-4 py-3.5 text-stone-700 dark:text-slate-300 whitespace-nowrap">{formatDate(item.tgl_pinjam)}</td>
                      <td className="px-4 py-3.5 text-stone-700 dark:text-slate-300 whitespace-nowrap">{formatDate(item.batas_kembali)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="bg-stone-100 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 px-2 py-0.5 rounded-md font-mono text-[11px] text-stone-700 dark:text-slate-300 print:bg-slate-100 print:text-black">
                          {durasi} Hari
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {item.status === "DIPINJAM" ? (
                          isLate ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                              Terlambat
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                              Dipinjam
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                            Selesai
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-stone-700 dark:text-slate-300 whitespace-nowrap">
                        {item.tgl_dikembalikan ? formatDate(item.tgl_dikembalikan) : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold whitespace-nowrap">
                        {item.denda > 0 ? (
                          <span className="text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-500/30">
                            {formatRupiah(item.denda)}
                          </span>
                        ) : (
                          <span className="text-stone-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-stone-200 dark:divide-slate-800 print:hidden">
            {filteredData.map((item, index) => {
              const durasi = getDurationDays(item.tgl_pinjam, item.batas_kembali);
              const remaining = getRemainingDays(item.batas_kembali);
              const isLate = item.status === "DIPINJAM" && remaining < 0;

              return (
                <div key={item.id} className="p-4 space-y-2.5 hover:bg-stone-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm">
                        {item.siswa?.nama ?? "-"}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">
                        {item.siswa?.kelas} · NISN: {item.siswa?.nisn}
                      </p>
                    </div>

                    {item.status === "DIPINJAM" ? (
                      isLate ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 shrink-0">
                          Telat
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 shrink-0">
                          Dipinjam
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                        Selesai
                      </span>
                    )}
                  </div>

                  <div className="bg-stone-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-stone-200 dark:border-slate-800/80">
                    <p className="font-semibold text-stone-900 dark:text-white text-xs line-clamp-1">{item.buku?.judul ?? "-"}</p>
                    <p className="text-[10px] text-stone-500 dark:text-slate-400">{item.buku?.penulis}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-stone-100/70 dark:bg-slate-800/60 p-1.5 rounded-lg border border-stone-200/80 dark:border-slate-700/60">
                      <span className="text-stone-400 dark:text-slate-500 block text-[9px] uppercase font-bold">Pinjam</span>
                      <span className="font-semibold text-stone-800 dark:text-slate-200">{formatDate(item.tgl_pinjam)}</span>
                    </div>
                    <div className="bg-stone-100/70 dark:bg-slate-800/60 p-1.5 rounded-lg border border-stone-200/80 dark:border-slate-700/60">
                      <span className="text-stone-400 dark:text-slate-500 block text-[9px] uppercase font-bold">Batas ({durasi}h)</span>
                      <span className={`font-semibold ${isLate ? "text-rose-600 dark:text-rose-400 font-bold" : "text-stone-800 dark:text-slate-200"}`}>
                        {formatDate(item.batas_kembali)}
                      </span>
                    </div>
                  </div>

                  {item.denda > 0 && (
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                      <span className="text-rose-700 dark:text-rose-400 font-bold">Denda:</span>
                      <span className="font-black text-rose-700 dark:text-rose-400">{formatRupiah(item.denda)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredData.length === 0 && (
            <div className="py-12 text-center text-stone-400 dark:text-slate-500 text-xs">
              Tidak ada data transaksi yang cocok dengan filter.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
