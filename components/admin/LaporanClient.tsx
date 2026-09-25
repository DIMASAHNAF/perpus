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
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs print:hidden">
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
                <FileText className="w-5 h-5 text-emerald-600" />
                <h1 className="text-lg font-bold text-slate-900">Laporan & Rekapitulasi Sirkulasi</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="cursor-pointer text-xs flex items-center gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel (.csv)</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="cursor-pointer text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Laporan PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6 print:p-0 print:m-0">
        {/* Kop Laporan Khusus Cetak */}
        <div className="hidden print:block text-center pb-4 mb-6 border-b-2 border-slate-800">
          <h2 className="text-xl font-extrabold uppercase tracking-wide">Perpustakaan Digital Sekolah</h2>
          <p className="text-xs text-slate-600">Laporan Sirkulasi Peminjaman & Rekapitulasi Denda Buku</p>
          <p className="text-[11px] text-slate-500 mt-1">Dicetak pada: {formatDate(new Date())}</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Periode Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 mr-1" />
              <span className="text-xs font-semibold text-slate-700 mr-1">Periode:</span>
              {[
                { id: "ALL", label: "Semua Waktu" },
                { id: "MONTH", label: "Bulan Ini" },
                { id: "WEEK", label: "Minggu Ini" },
                { id: "TODAY", label: "Hari Ini" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriode(p.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    periode === p.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau buku..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-700 mr-1">Status:</span>
            {[
              { id: "ALL", label: "Semua Status" },
              { id: "DIPINJAM", label: "Masih Dipinjam" },
              { id: "SELESAI", label: "Sudah Dikembalikan" },
              { id: "DENDA", label: "Ada Denda Terbayar" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === s.id
                    ? "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ringkasan Statistik Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Sirkulasi</p>
              <p className="text-xl font-extrabold text-slate-900">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Buku Sedang Dipinjam</p>
              <p className="text-xl font-extrabold text-sky-700">{stats.dipinjam}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Buku Dikembalikan</p>
              <p className="text-xl font-extrabold text-teal-700">{stats.selesai}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Denda Masuk</p>
              <p className="text-xl font-extrabold text-rose-700">{formatRupiah(stats.totalDenda)}</p>
            </div>
          </div>
        </div>

        {/* Tabel Data Rekap Laporan */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Data Rekap Sirkulasi Peminjaman</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
              Total {filteredData.length} baris
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Siswa (NISN)</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Buku</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Tgl Pinjam</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Batas Kembali</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Durasi</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Tgl Kembali</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Denda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredData.map((item, index) => {
                  const durasi = getDurationDays(item.tgl_pinjam, item.batas_kembali);
                  const remaining = getRemainingDays(item.batas_kembali);
                  const isLate = item.status === "DIPINJAM" && remaining < 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.siswa?.nama}</div>
                        <div className="text-[11px] text-slate-500 font-mono">NISN: {item.siswa?.nisn} ({item.siswa?.kelas})</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.buku?.judul}</div>
                        <div className="text-[10px] text-slate-500">{item.buku?.penulis}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.tgl_pinjam)}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.batas_kembali)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                          {durasi} Hari
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.status === "DIPINJAM" ? (
                          isLate ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Terlambat
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              Dipinjam
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Selesai
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {item.tgl_dikembalikan ? formatDate(item.tgl_dikembalikan) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                        {item.denda > 0 ? (
                          <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {formatRupiah(item.denda)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada data sirkulasi yang sesuai dengan kriteria filter.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
