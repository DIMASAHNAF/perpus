"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Download,
  Printer,
  Calendar,
  Search,
  Trash2,
  UserPlus,
  BarChart3,
  TrendingUp,
  Clock,
  GraduationCap,
  CalendarDays,
  Award,
  ScanLine,
  CheckCircle2,
  XCircle,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { formatDate } from "@/lib/utils";
import { deleteKunjungan, getAllKunjunganLive } from "@/actions/kunjungan";

export type KunjunganItem = {
  id: string;
  nama: string;
  kelas: string | null;
  keperluan: string | null;
  tanggal: Date | string;
};

export default function KunjunganClient({
  initialData,
}: {
  initialData: KunjunganItem[];
}) {
  const [periode, setPeriode] = useState<"ALL" | "MONTH" | "WEEK" | "TODAY">(
    "MONTH"
  );
  const [search, setSearch] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const [allData, setAllData] = useState<KunjunganItem[]>(initialData);

  // Sync initialData apabila SSR props diperbarui
  useEffect(() => {
    setAllData(initialData);
  }, [initialData]);

  // Real-time live update: BroadcastChannel (<1ms) + Polling (3s) tanpa refresh halaman
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("perpus_kiosk_scan");
      bc.onmessage = (event) => {
        if (event.data?.type === "NEW_SCAN" && event.data?.visitor) {
          const v = event.data.visitor;
          setAllData((prev) => {
            if (prev.some((item) => item.id === v.id)) return prev;
            return [
              {
                id: v.id || String(Date.now()),
                nama: v.nama,
                kelas: v.kelas ?? null,
                keperluan: v.keperluan ?? "Presensi",
                tanggal: v.tanggal || new Date().toISOString(),
              },
              ...prev,
            ];
          });
        }
      };
    } catch {}

    const fetchLive = async () => {
      try {
        const live = await getAllKunjunganLive();
        if (live && Array.isArray(live) && live.length > 0) {
          setAllData(live);
        }
      } catch {}
    };

    const interval = setInterval(fetchLive, 3000);

    return () => {
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dariMs = dari ? new Date(dari + "T00:00:00").getTime() : null;
    const sampaiMs = sampai ? new Date(sampai + "T23:59:59").getTime() : null;

    return allData.filter((item) => {
      const d = new Date(item.tanggal);
      const t = d.getTime();

      if (periode === "TODAY" && d < startOfToday) return false;
      if (periode === "WEEK" && d < startOfWeek) return false;
      if (periode === "MONTH" && d < startOfMonth) return false;

      if (dariMs !== null && t < dariMs) return false;
      if (sampaiMs !== null && t > sampaiMs) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !item.nama?.toLowerCase().includes(q) &&
          !item.kelas?.toLowerCase().includes(q) &&
          !item.keperluan?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allData, periode, search, dari, sampai]);

  // Statistik
  const stats = useMemo(() => {
    const total = filteredData.length;

    // Distribusi per keperluan
    const byKeperluan = filteredData.reduce<Record<string, number>>((acc, t) => {
      const k = t.keperluan?.trim() || "Lainnya";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const keperluanList = Object.entries(byKeperluan).sort((a, b) => b[1] - a[1]);

    // Hari tersibuk (per tanggal) - dengan timeline continuous min 14 hari
    const byTanggal = filteredData.reduce<Record<string, number>>((acc, t) => {
      const key = new Date(t.tanggal).toISOString().split("T")[0];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const fullTanggalMap: Record<string, number> = { ...byTanggal };
    const nowRef = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(nowRef);
      d.setDate(nowRef.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (fullTanggalMap[key] === undefined) {
        fullTanggalMap[key] = 0;
      }
    }
    const tanggalList = Object.entries(fullTanggalMap).sort((a, b) => a[0].localeCompare(b[0]));

    // Rata-rata harian
    const jumlahHari = tanggalList.length || 1;
    const rataHarian = Math.round(total / jumlahHari);

    // Hari paling ramai
    const teramai = tanggalList.length
      ? tanggalList.reduce((a, b) => (b[1] > a[1] ? b : a))
      : null;

    // Pengunjung unik (distinct nama)
    const uniqueNama = new Set(
      filteredData.map((t) => t.nama.trim().toLowerCase())
    ).size;

    // Distribusi per kelas (top 8)
    const byKelas = filteredData.reduce<Record<string, number>>((acc, t) => {
      const k = t.kelas?.trim() || "Bukan Siswa";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const kelasList = Object.entries(byKelas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Distribusi per hari (Senin–Minggu)
    const namaHari = [
      "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
    ];
    const byHari: [string, number][] = namaHari.map((n) => [n, 0]);
    filteredData.forEach((t) => {
      byHari[new Date(t.tanggal).getDay()][1]++;
    });
    const hariList = [...byHari.slice(1), byHari[0]];

    // Distribusi per jam operasional (07:00 s.d 17:00)
    const jamMap = new Map<number, number>();
    for (let h = 7; h <= 17; h++) {
      jamMap.set(h, 0);
    }
    filteredData.forEach((t) => {
      const h = new Date(t.tanggal).getHours();
      jamMap.set(h, (jamMap.get(h) ?? 0) + 1);
    });
    const jamList: [string, number][] = [...jamMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([h, c]) => [`${String(h).padStart(2, "0")}:00`, c]);

    // Top 5 pengunjung teraktif
    const byNama = filteredData.reduce<Record<string, number>>((acc, t) => {
      const k = t.nama.trim();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const topNama = Object.entries(byNama)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Pertumbuhan bulan ini vs bulan lalu (dari seluruh data)
    const now = new Date();
    const countBulan = (y: number, m: number) =>
      initialData.filter((t) => {
        const d = new Date(t.tanggal);
        return d.getFullYear() === y && d.getMonth() === m;
      }).length;
    const bulanIni = countBulan(now.getFullYear(), now.getMonth());
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const bulanLalu = countBulan(prevMonth.getFullYear(), prevMonth.getMonth());
    const growth =
      bulanLalu > 0 ? Math.round(((bulanIni - bulanLalu) / bulanLalu) * 100) : null;

    // Tren mingguan bila rentang terlalu panjang (>45 hari berbeda)
    const trenMingguan =
      tanggalList.length > 45
        ? (() => {
            const map = new Map<string, number>();
            filteredData.forEach((t) => {
              const d = new Date(t.tanggal);
              const awal = new Date(d);
              awal.setDate(d.getDate() - d.getDay());
              const key = awal.toISOString().split("T")[0];
              map.set(key, (map.get(key) ?? 0) + 1);
            });
            return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
          })()
        : null;

    return {
      total,
      keperluanList,
      tanggalList,
      rataHarian,
      teramai,
      uniqueNama,
      kelasList,
      hariList,
      jamList,
      topNama,
      growth,
      bulanIni,
      trenMingguan,
    };
  }, [filteredData, initialData]);

  // Max untuk bar chart scaling
  const maxKeperluan = Math.max(1, ...stats.keperluanList.map((k) => k[1]));
  const maxTanggal = Math.max(1, ...stats.tanggalList.map((t) => t[1]));
  const maxKelas = Math.max(1, ...stats.kelasList.map((k) => k[1]));
  const maxJam = Math.max(1, ...stats.jamList.map((j) => j[1]));
  const maxHari = Math.max(1, ...stats.hariList.map((h) => h[1]));
  const maxMingguan = Math.max(
    1,
    ...(stats.trenMingguan ?? []).map((m) => m[1])
  );

  // Peak hour
  const peakJam = useMemo(() => {
    if (!stats.jamList || stats.jamList.length === 0) return null;
    return stats.jamList.reduce((max, curr) => (curr[1] > max[1] ? curr : max), stats.jamList[0]);
  }, [stats.jamList]);

  const exportToCSV = () => {
    const headers = [
      "No",
      "Nama Pengunjung",
      "Kelas",
      "Keperluan",
      "Tanggal Kunjungan",
    ];

    const rows = filteredData.map((item, idx) => [
      idx + 1,
      `"${item.nama?.replace(/"/g, '""') || "-"}"`,
      `"${item.kelas || "-"}"`,
      `"${item.keperluan || "-"}"`,
      `"${new Date(item.tanggal).toLocaleDateString("id-ID")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Statistik_Kunjungan_Perpustakaan_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Background glowing aurora blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-teal-500/10 dark:bg-teal-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Top Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-slate-800 sticky top-0 z-20 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-stone-300/80 dark:border-slate-700/60 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shrink-0 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <span className="text-stone-300 dark:text-slate-700 hidden sm:inline">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo SMK Negeri 1 Beringin"
                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded-lg bg-white/60 dark:bg-white/10 border border-stone-200 dark:border-white/10 p-0.5 shrink-0"
                />
                <img
                  src="/assets/logo-kolaborasi.png"
                  alt="Logo Kolaborasi Sumut Berkah"
                  className="h-5 sm:h-6 w-auto object-contain shrink-0"
                />
                <h1 className="text-sm sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight truncate flex items-center gap-2">
                  <span>Statistik Pengunjung</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold" title="Update otomatis real-time tanpa refresh halaman">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <ThemeToggle />
              <Link href="/kiosk" target="kiosk_presensi">
                <Button
                  size="sm"
                  className="cursor-pointer text-xs flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 border border-emerald-400/30"
                >
                  <QrCode className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">Buka Kios Scanner</span>
                  <span className="sm:hidden">Kios QR</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </Button>
              </Link>
              <Link href="/admin/kunjungan/create">
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer text-xs flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/80 dark:hover:bg-slate-750 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:text-stone-900 dark:hover:text-white shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Input Manual</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="cursor-pointer text-xs flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/80 dark:hover:bg-slate-750 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:text-stone-900 dark:hover:text-white shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">Ekspor CSV</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="cursor-pointer text-xs flex items-center gap-1.5 bg-stone-800 hover:bg-stone-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-stone-700 dark:border-slate-700 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Cetak PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full space-y-4 sm:space-y-6 print:p-0 print:m-0">
        {/* Kop Laporan Cetak */}
        <div className="hidden print:block text-center pb-4 mb-6 border-b-2 border-slate-800">
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
          <h2 className="text-xl font-extrabold uppercase tracking-wide text-black">
            Perpustakaan SMK Negeri 1 Beringin
          </h2>
          <p className="text-xs text-slate-600">
            Laporan Statistik Kunjungan Pengunjung Perpustakaan
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Dicetak pada: {formatDate(new Date())}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 p-5 space-y-4 shadow-sm dark:shadow-xl print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
              <span className="text-xs font-semibold text-stone-700 dark:text-slate-300 mr-1">
                Periode:
              </span>
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
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white border border-stone-300/80 dark:border-slate-700/60 shadow-xs"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-stone-400 dark:text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama, kelas, atau keperluan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs border border-stone-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Rentang tanggal kustom */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-stone-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                Rentang Kustom:
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={dari}
                onChange={(e) => setDari(e.target.value)}
                className="h-9 px-3 text-xs border border-stone-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white transition-all cursor-pointer shadow-xs"
              />
              <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">s/d</span>
              <input
                type="date"
                value={sampai}
                onChange={(e) => setSampai(e.target.value)}
                className="h-9 px-3 text-xs border border-stone-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white transition-all cursor-pointer shadow-xs"
              />
              {(dari || sampai) && (
                <button
                  onClick={() => {
                    setDari("");
                    setSampai("");
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            {(dari || sampai) && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium sm:ml-auto">
                Filter rentang tanggal aktif
              </p>
            )}
          </div>
        </div>

        {/* Kiosk Banner Shortcut */}
        <div className="bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-emerald-700/90 border border-emerald-500/30 backdrop-blur-xl rounded-2xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-950/40 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Layar Presensi Kios Mandiri (Scan QR &amp; Barcode)
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Pengunjung dapat memindai kartu fisik / QR Code langsung di mesin scanner meja secara mandiri.
              </p>
            </div>
          </div>
          <Link
            href="/kiosk"
            target="kiosk_presensi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-extrabold shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <span>Buka Layar Kios Fullscreen</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">Total Kunjungan</p>
              <p className="text-xl font-extrabold text-stone-900 dark:text-white">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">Pengunjung Unik</p>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {stats.uniqueNama}
              </p>
              <p className="text-[10px] text-stone-400 dark:text-slate-500">
                {stats.total > 0
                  ? `${Math.round((stats.uniqueNama / stats.total) * 100)}% dari total`
                  : "-"}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">Rata-rata / Hari</p>
              <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400">
                {stats.rataHarian}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">Hari Teramai</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {stats.teramai ? stats.teramai[1] : 0}
              </p>
              {stats.teramai && (
                <p className="text-[10px] text-stone-400 dark:text-slate-500 truncate max-w-[90px]">
                  {formatDate(stats.teramai[0])}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">Jam Teramai</p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                {stats.jamList.length
                  ? stats.jamList.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
                  : "-"}
              </p>
              {stats.jamList.length > 0 && (
                <p className="text-[10px] text-stone-400 dark:text-slate-500">
                  {stats.jamList.reduce((a, b) => (b[1] > a[1] ? b : a))[1]} kunjungan
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">Jenis Keperluan</p>
              <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
                {stats.keperluanList.length}
              </p>
            </div>
          </div>
        </div>

        {/* Pertumbuhan bulan ini vs bulan lalu */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                Pertumbuhan Kunjungan Bulan Ini
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {stats.bulanIni} kunjungan di bulan ini
              </p>
            </div>
          </div>
          {stats.growth === null ? (
            <span className="text-xs font-semibold text-stone-600 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 px-3 py-1.5 rounded-full">
              Data bulan lalu tidak tersedia
            </span>
          ) : (
            <span
              className={`text-sm font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border ${
                stats.growth >= 0
                  ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                  : "bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30"
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 ${stats.growth < 0 ? "rotate-180" : ""}`}
              />
              {stats.growth >= 0 ? "+" : ""}
              {stats.growth}% dari bulan lalu
            </span>
          )}
        </div>

        {/* Grafik: Keperluan Kunjungan */}
        {stats.keperluanList.length > 0 && (
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl p-6">
            <h3 className="font-bold text-stone-900 dark:text-white text-sm mb-4">
              Kunjungan Berdasarkan Keperluan
            </h3>
            <div className="space-y-3">
              {stats.keperluanList.map(([keperluan, jumlah]) => (
                <div key={keperluan} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 text-xs font-medium text-stone-700 dark:text-slate-300 text-right truncate">
                    {keperluan}
                  </div>
                  <div className="flex-1 bg-stone-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden border border-stone-200 dark:border-slate-700/50">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-xs shadow-emerald-500/50"
                      style={{ width: `${(jumlah / maxKeperluan) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 shrink-0 text-xs font-bold text-stone-900 dark:text-white">
                    {jumlah}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grafik: Tren Harian */}
        {stats.tanggalList.length > 0 && (
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-stone-900 dark:text-white text-base">
                    Tren Kunjungan Harian
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Grafik perkembangan aktivitas presensi pengunjung per hari
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/60 text-stone-700 dark:text-slate-300">
                  Rata-rata: <strong className="text-emerald-600 dark:text-emerald-400">{stats.rataHarian}</strong> /hari
                </span>
                {stats.teramai && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hidden md:inline-block">
                    Puncak: <strong className="text-stone-900 dark:text-white">{formatDate(stats.teramai[0])}</strong> ({stats.teramai[1]} orang)
                  </span>
                )}
              </div>
            </div>

            {/* Container Grafik SVG + Bars */}
            <div className="relative h-48 w-full flex flex-col justify-end pt-6 pb-2">
              {/* Grid Lines Background */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 opacity-30">
                <div className="border-b border-dashed border-stone-300 dark:border-slate-700 flex justify-between text-[10px] text-stone-400 dark:text-slate-500 font-mono">
                  <span>{maxTanggal} max</span>
                </div>
                <div className="border-b border-dashed border-stone-200 dark:border-slate-700/50" />
                <div className="border-b border-stone-300 dark:border-slate-800 text-[10px] text-stone-400 dark:text-slate-600 font-mono">
                  <span>0</span>
                </div>
              </div>

              {/* Bar Columns Container */}
              <div className="flex items-end gap-1.5 h-full relative z-10">
                {stats.tanggalList.slice(-30).map(([tanggal, jumlah]) => {
                  const heightPercent = maxTanggal > 0 ? (jumlah / maxTanggal) * 80 : 0;
                  const isPositive = jumlah > 0;
                  const formattedD = new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

                  return (
                    <div
                      key={tanggal}
                      className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end cursor-pointer"
                    >
                      {/* Tooltip Hover Bubble */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-stone-900 dark:bg-slate-950 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-stone-700 dark:border-slate-700 shadow-xl whitespace-nowrap">
                          <div>{formattedD}</div>
                          <div className="text-emerald-400 font-bold">{jumlah} Kunjungan</div>
                        </div>
                        <div className="w-2 h-2 bg-stone-900 dark:bg-slate-950 border-r border-b border-stone-700 dark:border-slate-700 rotate-45 -mt-1" />
                      </div>

                      {/* Number tag above bar if active */}
                      {isPositive && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 transition-transform group-hover:scale-125">
                          {jumlah}
                        </span>
                      )}

                      {/* Bar Fill */}
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isPositive
                              ? "bg-gradient-to-t from-emerald-600 via-teal-400 to-cyan-300 shadow-lg shadow-emerald-500/30 group-hover:brightness-125"
                              : "h-1.5 bg-stone-200 dark:bg-slate-800/80 border-t border-stone-300 dark:border-slate-700/60 rounded-full group-hover:bg-stone-300 dark:group-hover:bg-slate-700"
                          }`}
                          style={{ height: isPositive ? `${Math.max(10, heightPercent)}%` : undefined }}
                        />
                      </div>

                      {/* X-Axis Date Label */}
                      <span className="text-[9px] text-stone-500 dark:text-slate-400 whitespace-nowrap group-hover:text-emerald-600 dark:group-hover:text-emerald-300 font-medium">
                        {new Date(tanggal).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Grafik: Tren Mingguan (hanya jika rentang > 45 hari) */}
        {stats.trenMingguan && stats.trenMingguan.length > 0 && (
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl p-6">
            <h3 className="font-bold text-stone-900 dark:text-white text-sm mb-1">
              Tren Kunjungan Mingguan
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mb-4">
              Dirangkum per minggu karena rentang data terlalu panjang
            </p>
            <div className="flex items-end gap-2 h-40">
              {stats.trenMingguan.slice(-26).map(([minggu, jumlah]) => (
                <div
                  key={minggu}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                  title={`Minggu ${formatDate(minggu)}: ${jumlah} kunjungan`}
                >
                  <div className="w-full bg-stone-100 dark:bg-slate-800/80 rounded-t-md flex-1 flex items-end overflow-hidden border border-stone-200 dark:border-slate-700/30">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-sky-400 rounded-t-md transition-all duration-500 shadow-xs shadow-indigo-500/20"
                      style={{ height: `${(jumlah / maxMingguan) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-stone-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(minggu).getDate()}/{new Date(minggu).getMonth() + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid dua kolom: Jam & Hari */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafik: Distribusi per Jam (Jam Tersibuk) */}
          {stats.jamList.length > 0 && (
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-stone-900 dark:text-white text-base">
                      Jam Tersibuk
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Jam operasional sekolah dengan aktivitas tertinggi
                  </p>
                </div>

                {peakJam && peakJam[1] > 0 && (
                  <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs font-semibold shrink-0">
                    Puncak: <strong className="text-stone-900 dark:text-white">{peakJam[0]}</strong> ({peakJam[1]} orang)
                  </span>
                )}
              </div>

              {/* Chart Body */}
              <div className="relative h-44 w-full flex flex-col justify-end pt-4">
                <div className="flex items-end gap-1.5 h-full relative z-10">
                  {stats.jamList.map(([jam, jumlah]) => {
                    const isPeak = peakJam && peakJam[0] === jam && jumlah > 0;
                    const isPositive = jumlah > 0;
                    const heightPercent = maxJam > 0 ? (jumlah / maxJam) * 80 : 0;

                    return (
                      <div
                        key={jam}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end cursor-pointer"
                      >
                        {/* Tooltip Hover Bubble */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                          <div className="bg-stone-900 dark:bg-slate-950 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-stone-700 dark:border-slate-700 shadow-xl whitespace-nowrap">
                            <div>Jam {jam}</div>
                            <div className="text-rose-400 font-bold">{jumlah} Kunjungan</div>
                          </div>
                          <div className="w-2 h-2 bg-stone-900 dark:bg-slate-950 border-r border-b border-stone-700 dark:border-slate-700 rotate-45 -mt-1" />
                        </div>

                        {/* Top count or Puncak badge */}
                        {isPeak ? (
                          <span className="text-[9px] font-black px-1 rounded bg-rose-500 text-white animate-pulse shadow-md">
                            {jumlah}
                          </span>
                        ) : isPositive ? (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 group-hover:scale-125 transition-transform">
                            {jumlah}
                          </span>
                        ) : null}

                        {/* Bar */}
                        <div className="w-full flex-1 flex items-end justify-center">
                          <div
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              isPeak
                                ? "bg-gradient-to-t from-rose-600 via-pink-500 to-amber-400 ring-2 ring-rose-400/60 shadow-lg shadow-rose-500/40"
                                : isPositive
                                ? "bg-gradient-to-t from-rose-700 via-rose-500 to-orange-400 group-hover:brightness-125 shadow-md shadow-rose-950"
                                : "h-1.5 bg-stone-200 dark:bg-slate-800/80 border-t border-stone-300 dark:border-slate-700/60 rounded-full group-hover:bg-stone-300 dark:group-hover:bg-slate-700"
                            }`}
                            style={{ height: isPositive ? `${Math.max(12, heightPercent)}%` : undefined }}
                          />
                        </div>

                        {/* Hour Label */}
                        <span className={`text-[8px] sm:text-[9px] whitespace-nowrap font-medium ${isPeak ? "text-rose-700 dark:text-rose-300 font-bold" : "text-stone-500 dark:text-slate-400 group-hover:text-stone-900 dark:group-hover:text-white"}`}>
                          {jam}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Grafik: Distribusi per Hari */}
          {stats.hariList.length > 0 && (
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                  Kunjungan per Hari
                </h3>
              </div>
              <div className="space-y-3">
                {stats.hariList.map(([hari, jumlah]) => (
                  <div key={hari} className="flex items-center gap-3">
                    <div className="w-16 shrink-0 text-xs font-medium text-stone-700 dark:text-slate-300">
                      {hari}
                    </div>
                    <div className="flex-1 bg-stone-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden border border-stone-200 dark:border-slate-700/50">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-xs shadow-sky-500/30"
                        style={{ width: `${(jumlah / maxHari) * 100}%` }}
                      />
                    </div>
                    <div className="w-10 shrink-0 text-xs font-bold text-stone-900 dark:text-white">
                      {jumlah}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grid dua kolom: Kelas & Top Pengunjung */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafik: Distribusi per Kelas */}
          {stats.kelasList.length > 0 && (
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                  Kunjungan per Kelas
                </h3>
              </div>
              <div className="space-y-3">
                {stats.kelasList.map(([kelas, jumlah]) => (
                  <div key={kelas} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 text-xs font-medium text-stone-700 dark:text-slate-300 text-right truncate">
                      {kelas}
                    </div>
                    <div className="flex-1 bg-stone-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden border border-stone-200 dark:border-slate-700/50">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full transition-all duration-500 shadow-xs shadow-indigo-500/30"
                        style={{ width: `${(jumlah / maxKelas) * 100}%` }}
                      />
                    </div>
                    <div className="w-10 shrink-0 text-xs font-bold text-stone-900 dark:text-white">
                      {jumlah}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 Pengunjung */}
          {stats.topNama.length > 0 && (
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                  Pengunjung Teraktif
                </h3>
              </div>
              <div className="space-y-2">
                {stats.topNama.map(([nama, jumlah], idx) => (
                  <div
                    key={nama}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700/60 shadow-xs"
                  >
                    <div
                      className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        idx === 0
                          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                          : idx === 1
                          ? "bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-300 dark:border-slate-600"
                          : idx === 2
                          ? "bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30"
                          : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 border border-stone-300 dark:border-slate-700"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {nama}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                      {jumlah}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabel Data Kunjungan */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center bg-stone-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-stone-900 dark:text-white text-sm">
              Daftar Kunjungan Pengunjung
            </h3>
            <span className="text-xs bg-stone-100 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
              Total {filteredData.length} baris
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 dark:divide-slate-800 text-xs">
              <thead className="bg-stone-100 dark:bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600 dark:text-slate-400">
                    No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600 dark:text-slate-400">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600 dark:text-slate-400">
                    Kelas
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600 dark:text-slate-400">
                    Keperluan
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600 dark:text-slate-400">
                    Waktu Kunjungan
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600 dark:text-slate-400 print:hidden">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-slate-800/70 bg-transparent">
                {filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-stone-100/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-stone-500 dark:text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3 font-bold text-stone-900 dark:text-white">
                      {item.nama}
                    </td>
                    <td className="px-4 py-3 text-stone-700 dark:text-slate-300">
                      {item.kelas || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.keperluan ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                          {item.keperluan}
                        </span>
                      ) : (
                        <span className="text-stone-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(item.tanggal)}
                      <span className="text-[10px] text-stone-500 dark:text-slate-400 ml-1.5 font-mono">
                        {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <form action={deleteKunjungan.bind(null, item.id)}>
                        <Button
                          size="sm"
                          variant="destructive"
                          type="submit"
                          className="h-7 px-2 text-[11px] bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-stone-200 dark:divide-slate-800">
            {filteredData.map((item, index) => (
              <div key={item.id} className="p-3.5 space-y-2 hover:bg-stone-50/70 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm">
                        {item.nama}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">
                        {item.kelas ? `Kelas: ${item.kelas}` : "Pengunjung Umum"}
                      </p>
                    </div>
                  </div>

                  <form action={deleteKunjungan.bind(null, item.id)}>
                    <Button
                      size="sm"
                      variant="destructive"
                      type="submit"
                      className="h-7 w-7 p-0 flex items-center justify-center text-[11px] bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 shadow-xs cursor-pointer rounded-lg"
                      title="Hapus Kunjungan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
                  <div>
                    {item.keperluan ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                        {item.keperluan}
                      </span>
                    ) : (
                      <span className="text-stone-400 dark:text-slate-500 text-[10px]">Tanpa Keterangan</span>
                    )}
                  </div>
                  <div className="text-stone-500 dark:text-slate-400 text-[10px] font-mono">
                    {formatDate(item.tanggal)} {new Date(item.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="py-12 text-center text-stone-400 dark:text-slate-500 text-xs">
              Tidak ada data kunjungan pada periode ini.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
