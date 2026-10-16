"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Scan,
  Barcode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Check,
  Building2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Edit3,
  HelpCircle,
  FileCheck,
  ShieldCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  scanEksemplarOpname,
  manualUpdateOpnameItem,
  quickFixRakEksemplar,
  selesaikanStockOpname,
  batalkanStockOpname,
  type StockOpnameSummary,
} from "@/actions/stock-opname";

type RakOption = {
  id: string;
  nama: string;
  nomor: number;
};

type StockOpnameDetailProps = {
  sesi: {
    id: string;
    nama_sesi: string;
    petugas: string | null;
    tanggal_mulai: Date | string;
    tanggal_selesai: Date | string | null;
    status: "DRAFT" | "BERJALAN" | "SELESAI" | "DIBATALKAN";
    rakId: string | null;
    catatan: string | null;
    rakRef: { id: string; nama: string; nomor: number } | null;
    items: any[];
  };
  summary: StockOpnameSummary;
  allRaks: RakOption[];
};

// Web Audio synthesizer for crisp audible feedback
function playOpnameBeep(type: "success" | "warning" | "error") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // Pleasant high double beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "warning") {
      // Chime warning
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1); // A4
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Low buzz error
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Ignore audio restriction
  }
}

export function StockOpnameDetailClient({
  sesi,
  summary: initialSummary,
  allRaks,
}: StockOpnameDetailProps) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>(sesi.items);
  const [summary, setSummary] = useState<StockOpnameSummary>(initialSummary);

  // Scanner states
  const [inputCode, setInputCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeRakId, setActiveRakId] = useState<string>(sesi.rakId || "");
  const [activeKondisiFisik, setActiveKondisiFisik] = useState<"BAIK" | "RUSAK">("BAIK");
  const [lastScanResult, setLastScanResult] = useState<any | null>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: "success" | "warning" | "error" } | null>(null);

  // Table filtering & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "ALL" | "TERPINDAI" | "BELUM" | "SALAH_RAK" | "RUSAK" | "DIPINJAM"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  // Modals
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [syncDatabase, setSyncDatabase] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  // Print view state
  const [isPrintMode, setIsPrintMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const isAuditActive = sesi.status === "BERJALAN";

  // Keep input focused
  useEffect(() => {
    if (isAuditActive) {
      inputRef.current?.focus();
    }
  }, [isAuditActive]);

  // Recalculate summary from state
  const refreshSummary = useCallback((currentItems: any[]) => {
    const total = currentItems.length;
    const terpindai = currentItems.filter((i) => i.is_terpindai).length;
    const belumTerpindai = total - terpindai;
    const rusak = currentItems.filter((i) => i.status_fisik === "RUSAK").length;
    const salahRak = currentItems.filter(
      (i) =>
        i.is_terpindai &&
        i.rakId_fisik &&
        i.rakId_sistem &&
        i.rakId_fisik !== i.rakId_sistem
    ).length;
    const anomaliDipinjam = currentItems.filter(
      (i) => i.is_terpindai && i.status_sistem === "DIPINJAM"
    ).length;
    const sesuai = currentItems.filter(
      (i) =>
        i.is_terpindai &&
        i.status_sistem === "TERSEDIA" &&
        (!i.rakId_fisik || i.rakId_fisik === i.rakId_sistem) &&
        (i.status_fisik === "BAIK" || !i.status_fisik)
    ).length;
    const persentase = total > 0 ? Math.round((terpindai / total) * 100) : 0;

    setSummary({
      total,
      terpindai,
      belumTerpindai,
      sesuai,
      salahRak,
      rusak,
      anomaliDipinjam,
      persentase,
    });
  }, []);

  // Handle Scan barcode (Physical Scanner or Camera)
  const handleProcessScan = useCallback(
    async (codeToScan: string) => {
      const code = codeToScan.trim().replace(/[-\s]/g, "");
      if (!code || isScanning || !isAuditActive) return;

      setIsScanning(true);
      setScanMessage(null);

      try {
        const res = await scanEksemplarOpname({
          stockOpnameId: sesi.id,
          barcode: code,
          status_fisik: activeKondisiFisik,
          rakId_fisik: activeRakId || null,
        });

        if (res.ok && res.item) {
          if (soundEnabled) playOpnameBeep(res.sound);
          setLastScanResult(res);
          setScanMessage({ text: res.pesan, type: res.sound });

          // Update local state list
          setItems((prev) => {
            const index = prev.findIndex((i) => i.eksemplar.kode === res.item?.kode);
            let updatedList = [...prev];
            if (index >= 0) {
              updatedList[index] = {
                ...updatedList[index],
                is_terpindai: true,
                status_fisik: activeKondisiFisik,
                rakId_fisik: activeRakId || updatedList[index].rakId_sistem,
                waktu_scan: new Date().toISOString(),
              };
            } else {
              // Item baru di luar scope
              router.refresh();
            }
            refreshSummary(updatedList);
            return updatedList;
          });
        } else {
          if (soundEnabled) playOpnameBeep("error");
          setScanMessage({ text: res.pesan, type: "error" });
        }
      } catch (err: any) {
        if (soundEnabled) playOpnameBeep("error");
        setScanMessage({ text: err.message || "Gagal memindai barcode", type: "error" });
      } finally {
        setIsScanning(false);
        setInputCode("");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [
      sesi.id,
      isScanning,
      isAuditActive,
      activeKondisiFisik,
      activeRakId,
      soundEnabled,
      refreshSummary,
      router,
    ]
  );

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      handleProcessScan(inputCode);
    }
  };

  // Camera scanner handling
  useEffect(() => {
    if (cameraActive && isAuditActive) {
      const qrCode = new Html5Qrcode("stock-opname-camera-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = qrCode;

      qrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 180 },
          },
          (decodedText) => {
            handleProcessScan(decodedText);
          },
          () => {}
        )
        .catch((err) => {
          console.error("Camera error:", err);
          setCameraActive(false);
        });

      return () => {
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      };
    }
  }, [cameraActive, isAuditActive, handleProcessScan]);

  // Quick fix rak location in master DB
  const handleQuickFixRak = async (eksemplarId: string, itemId: string, targetRakId: string) => {
    try {
      const res = await quickFixRakEksemplar({
        eksemplarId,
        newRakId: targetRakId,
        stockOpnameId: sesi.id,
        itemId,
      });

      if (!res?.ok) {
        alert(res?.error || "Gagal memperbarui rak");
        return;
      }

      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                rakId_sistem: targetRakId,
                rakId_fisik: targetRakId,
                eksemplar: {
                  ...item.eksemplar,
                  rakId: targetRakId,
                  rak: allRaks.find((r) => r.id === targetRakId) || item.eksemplar.rak,
                },
              }
            : item
        );
        refreshSummary(next);
        return next;
      });

      if (lastScanResult && lastScanResult.item.id === itemId) {
        setLastScanResult((prev: any) => ({
          ...prev,
          item: { ...prev.item, isSalahRak: false },
        }));
      }

      alert("Lokasi rak di master database telah disinkronkan!");
    } catch (err: any) {
      console.error("handleQuickFixRak error:", err);
      const msg = err?.message?.includes("Minified React error")
        ? "Terjadi kendala pada server saat menyimpan. Silakan coba beberapa saat lagi."
        : (err?.message || "Gagal memperbarui rak");
      alert(msg);
    }
  };

  // Toggle item status fisik / terpindai manual
  const handleToggleTerpindai = async (item: any) => {
    if (!isAuditActive) return;
    const nextVal = !item.is_terpindai;
    try {
      await manualUpdateOpnameItem({
        itemId: item.id,
        is_terpindai: nextVal,
        status_fisik: nextVal ? "BAIK" : null,
        rakId_fisik: nextVal ? (activeRakId || item.rakId_sistem) : null,
      });

      setItems((prev) => {
        const next = prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                is_terpindai: nextVal,
                status_fisik: nextVal ? "BAIK" : null,
                rakId_fisik: nextVal ? (activeRakId || item.rakId_sistem) : null,
                waktu_scan: nextVal ? new Date().toISOString() : null,
              }
            : i
        );
        refreshSummary(next);
        return next;
      });
    } catch (err: any) {
      console.error("handleToggleTerpindai error:", err);
      alert(err?.message?.includes("Minified React error") ? "Gagal memperbarui item ke server." : (err?.message || "Gagal memperbarui item"));
    }
  };

  // Selesaikan Sesi Audit
  const handleFinishSession = async () => {
    setIsFinishing(true);
    try {
      const res = await selesaikanStockOpname({
        stockOpnameId: sesi.id,
        sinkronDatabase: syncDatabase,
      });
      alert(res.pesan);
      setShowFinishModal(false);
      router.refresh();
    } catch (err: any) {
      console.error("handleFinishSession error:", err);
      alert(err?.message?.includes("Minified React error") ? "Gagal menyelesaikan audit ke server." : (err?.message || "Gagal menyelesaikan audit"));
    } finally {
      setIsFinishing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Kode Eksemplar",
      "Judul Buku",
      "Penulis",
      "Klasifikasi DDC",
      "Rak Sistem",
      "Rak Fisik Ditemukan",
      "Status Sistem",
      "Status Fisik Audit",
      "Terverifikasi",
      "Waktu Scan",
      "Catatan",
    ];

    const rows = items.map((i) => [
      `"${i.eksemplar.kode}"`,
      `"${(i.eksemplar.buku?.judul || "").replace(/"/g, '""')}"`,
      `"${(i.eksemplar.buku?.penulis || "").replace(/"/g, '""')}"`,
      `"${i.eksemplar.buku?.klasifikasi || ""}"`,
      `"${i.eksemplar.rak?.nama || "Tidak Ada"}"`,
      `"${allRaks.find((r) => r.id === i.rakId_fisik)?.nama || "-"}"`,
      `"${i.status_sistem}"`,
      `"${i.status_fisik || (i.is_terpindai ? "BAIK" : "BELUM SCAN")}"`,
      `"${i.is_terpindai ? "YA" : "TIDAK"}"`,
      `"${i.waktu_scan ? new Date(i.waktu_scan).toLocaleString("id-ID") : "-"}"`,
      `"${(i.catatan || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stock_Opname_${sesi.nama_sesi.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Table Items
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.eksemplar.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.eksemplar.buku?.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.eksemplar.buku?.penulis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.eksemplar.buku?.kode_buku &&
        item.eksemplar.buku.kode_buku.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (activeTab === "TERPINDAI") return item.is_terpindai;
    if (activeTab === "BELUM") return !item.is_terpindai;
    if (activeTab === "SALAH_RAK")
      return (
        item.is_terpindai &&
        item.rakId_fisik &&
        item.rakId_sistem &&
        item.rakId_fisik !== item.rakId_sistem
      );
    if (activeTab === "RUSAK") return item.status_fisik === "RUSAK";
    if (activeTab === "DIPINJAM") return item.is_terpindai && item.status_sistem === "DIPINJAM";

    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/stock-opname"
            className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  sesi.status === "BERJALAN"
                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30"
                    : sesi.status === "SELESAI"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-stone-500/15 text-stone-600 dark:text-slate-400 border border-stone-300 dark:border-slate-700"
                }`}
              >
                {sesi.status === "BERJALAN" && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />}
                {sesi.status === "BERJALAN" ? "Audit Sedang Berjalan" : sesi.status}
              </span>

              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                {sesi.rakRef ? sesi.rakRef.nama : "Cakupan Semua Rak"}
              </span>

              <span className="text-xs text-stone-400 dark:text-slate-500">•</span>
              <span className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(sesi.tanggal_mulai).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-extrabold text-stone-900 dark:text-white">
              {sesi.nama_sesi}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 text-xs font-bold border border-stone-300 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            Cetak Berita Acara
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel
          </button>

          {isAuditActive && (
            <button
              onClick={() => setShowFinishModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selesaikan Audit
            </button>
          )}
        </div>
      </div>

      {/* Progress & Live Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Item</p>
          <p className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white mt-0.5">{summary.total}</p>
          <p className="text-[10px] text-stone-500 dark:text-slate-400">Database</p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider">Terpindai</p>
          <p className="text-xl sm:text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">
            {summary.terpindai} <span className="text-xs font-bold text-sky-500">({summary.persentase}%)</span>
          </p>
          <p className="text-[10px] text-stone-500 dark:text-slate-400">Verifikasi fisik</p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Sesuai</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{summary.sesuai}</p>
          <p className="text-[10px] text-stone-500 dark:text-slate-400">Di rak yang tepat</p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Salah Rak</p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{summary.salahRak}</p>
          <p className="text-[10px] text-stone-500 dark:text-slate-400">Perlu dipindahkan</p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">Rusak</p>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{summary.rusak}</p>
          <p className="text-[10px] text-stone-500 dark:text-slate-400">Fisik cacat</p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Belum Scan</p>
          <p className="text-xl sm:text-2xl font-extrabold text-stone-600 dark:text-slate-300 mt-0.5">{summary.belumTerpindai}</p>
          <p className="text-[10px] text-stone-500 dark:text-slate-400">Potensi hilang</p>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-3 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner print:hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${summary.persentase}%` }}
        />
      </div>

      {/* QUICK SCAN HUB (Only shown when session is active) */}
      {isAuditActive && (
        <div className="bg-gradient-to-br from-white via-sky-50/30 to-blue-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 rounded-2xl border border-sky-200/80 dark:border-slate-800 shadow-lg p-5 sm:p-6 print:hidden">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/30">
                <Scan className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  Pindai Cepat Barcode Eksemplar
                  <span className="text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                    AUTOFOCUS READY
                  </span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Gunakan Barcode Scanner USB/Bluetooth atau Kamera Web untuk audit berjalan di rak
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  soundEnabled
                    ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800"
                    : "bg-stone-100 dark:bg-slate-800 text-stone-400 border-stone-200 dark:border-slate-700"
                }`}
                title={soundEnabled ? "Suara Aktif" : "Suara Senyap"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{soundEnabled ? "Audio ON" : "Audio OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setCameraActive(!cameraActive)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  cameraActive
                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                    : "bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-200 border-stone-300 dark:border-slate-700 hover:bg-stone-50"
                }`}
              >
                {cameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                <span>{cameraActive ? "Tutup Kamera" : "Scan Kamera"}</span>
              </button>
            </div>
          </div>

          {/* Scanner Settings (Target Rak & Kondisi Fisik) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-white/70 dark:bg-slate-800/60 rounded-xl border border-stone-200/70 dark:border-slate-700/60">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                📍 Posisi Rak Saat Ini:
              </label>
              <select
                value={activeRakId}
                onChange={(e) => setActiveRakId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Deteksi Otomatis dari Database</option>
                {allRaks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                🏷️ Kondisi Fisik yang Ditemukan:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveKondisiFisik("BAIK")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    activeKondisiFisik === "BAIK"
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                      : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 border-stone-300 dark:border-slate-700"
                  }`}
                >
                  ✓ Kondisi Baik
                </button>
                <button
                  type="button"
                  onClick={() => setActiveKondisiFisik("RUSAK")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    activeKondisiFisik === "RUSAK"
                      ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                      : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 border-stone-300 dark:border-slate-700"
                  }`}
                >
                  ⚠ Rusak / Cacat
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-tight">
                💡 <em>Tip: Kunci rak posisi Anda sekarang agar sistem langsung memvalidasi apakah buku yang discan salah tempat rak.</em>
              </p>
            </div>
          </div>

          {/* Camera Viewport */}
          {cameraActive && (
            <div className="mb-4 rounded-xl overflow-hidden border-2 border-sky-500 bg-black aspect-video max-w-md mx-auto relative">
              <div id="stock-opname-camera-reader" className="w-full h-full" />
            </div>
          )}

          {/* Barcode Input Form */}
          <form onSubmit={handleInputSubmit} className="relative">
            <div className="relative">
              <Barcode className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-sky-600 dark:text-sky-400" />
              <input
                ref={inputRef}
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                disabled={isScanning}
                placeholder="Scan kode 8-digit eksemplar (mis. 00000001) atau ketik lalu tekan Enter..."
                className="w-full pl-13 pr-28 py-3.5 rounded-xl border-2 border-sky-300 dark:border-sky-800/80 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-base font-mono font-bold shadow-inner focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-stone-400 placeholder:font-sans placeholder:font-normal"
              />
              <button
                type="submit"
                disabled={isScanning || !inputCode.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isScanning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Pindai</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Scan Feedback Banner */}
          {scanMessage && (
            <div
              className={`mt-3 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-fade-in ${
                scanMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : scanMessage.type === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                  : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
              }`}
            >
              {scanMessage.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              {scanMessage.type === "warning" && <AlertTriangle className="w-5 h-5 shrink-0" />}
              {scanMessage.type === "error" && <AlertCircle className="w-5 h-5 shrink-0" />}
              <span className="flex-1">{scanMessage.text}</span>
            </div>
          )}

          {/* Last Scanned Item Card */}
          {lastScanResult && lastScanResult.item && (
            <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-scale-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-14 bg-stone-100 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0 border border-stone-200 dark:border-slate-600 flex items-center justify-center">
                  {lastScanResult.item.cover_url ? (
                    <img
                      src={lastScanResult.item.cover_url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-5 h-5 text-stone-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                      {lastScanResult.item.kode}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Pukul {lastScanResult.item.waktuScan}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white line-clamp-1">
                    {lastScanResult.item.judul}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Penulis: {lastScanResult.item.penulis || "Tidak ada"} • Rak Database:{" "}
                    <strong>{lastScanResult.item.rakSistem}</strong>
                  </p>
                </div>
              </div>

              {lastScanResult.item.isSalahRak && activeRakId && (
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFixRak(
                      lastScanResult.item.eksemplarId || lastScanResult.item.id,
                      lastScanResult.item.id,
                      activeRakId
                    )
                  }
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Perbarui Lokasi ke Rak Ini Sekarang
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* FILTER TABS & SEARCH BAR */}
      <div className="space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: `Semua (${summary.total})` },
              { id: "TERPINDAI", label: `Terpindai (${summary.terpindai})` },
              { id: "BELUM", label: `Belum Scan (${summary.belumTerpindai})` },
              { id: "SALAH_RAK", label: `Salah Rak (${summary.salahRak})` },
              { id: "RUSAK", label: `Rusak (${summary.rusak})` },
              { id: "DIPINJAM", label: `Anomali Dipinjam (${summary.anomaliDipinjam})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode eksemplar, judul..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* AUDIT ITEMS TABLE */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-800/60 text-stone-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4">Kode Eksemplar</th>
                <th className="py-3 px-4">Koleksi Buku</th>
                <th className="py-3 px-4">Rak Database</th>
                <th className="py-3 px-4">Rak Fisik Ditemukan</th>
                <th className="py-3 px-4">Kondisi Fisik</th>
                <th className="py-3 px-4 text-right print:hidden">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400">
                    Tidak ada data eksemplar yang cocok dengan filter
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isSalahRak =
                    item.is_terpindai &&
                    item.rakId_fisik &&
                    item.rakId_sistem &&
                    item.rakId_fisik !== item.rakId_sistem;

                  const rakFisikNama =
                    allRaks.find((r) => r.id === item.rakId_fisik)?.nama ||
                    item.eksemplar.rak?.nama ||
                    "-";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-sky-50/30 dark:hover:bg-slate-800/40 transition-colors ${
                        item.is_terpindai
                          ? isSalahRak
                            ? "bg-amber-50/30 dark:bg-amber-950/20"
                            : item.status_fisik === "RUSAK"
                            ? "bg-rose-50/30 dark:bg-rose-950/20"
                            : ""
                          : ""
                      }`}
                    >
                      {/* Status Verifikasi */}
                      <td className="py-3 px-4">
                        {item.is_terpindai ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-slate-700">
                            Belum Scan
                          </span>
                        )}
                      </td>

                      {/* Kode Eksemplar */}
                      <td className="py-3 px-4 font-mono font-bold text-stone-900 dark:text-white">
                        {item.eksemplar.kode}
                      </td>

                      {/* Buku Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 dark:text-white line-clamp-1 max-w-xs">
                          {item.eksemplar.buku?.judul || "Tanpa Judul"}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-2">
                          <span>{item.eksemplar.buku?.penulis || "-"}</span>
                          {item.eksemplar.buku?.klasifikasi && (
                            <span className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 font-mono text-[10px]">
                              DDC {item.eksemplar.buku.klasifikasi}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rak Database */}
                      <td className="py-3 px-4 text-stone-600 dark:text-slate-300">
                        {item.eksemplar.rak?.nama || (
                          <span className="text-stone-400 italic">Belum diset</span>
                        )}
                      </td>

                      {/* Rak Fisik Ditemukan */}
                      <td className="py-3 px-4">
                        {item.is_terpindai ? (
                          isSalahRak ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {rakFisikNama} (Salah Rak)
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              {rakFisikNama}
                            </span>
                          )
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>

                      {/* Kondisi Fisik */}
                      <td className="py-3 px-4">
                        {item.status_fisik === "RUSAK" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                            RUSAK
                          </span>
                        ) : item.is_terpindai ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            BAIK
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>

                      {/* Aksi Cepat */}
                      <td className="py-3 px-4 text-right print:hidden">
                        {isAuditActive ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleTerpindai(item)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                                item.is_terpindai
                                  ? "bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300"
                                  : "bg-sky-600 hover:bg-sky-700 text-white"
                              }`}
                            >
                              {item.is_terpindai ? "Batal Scan" : "Set Terpindai"}
                            </button>

                            {isSalahRak && item.rakId_fisik && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickFixRak(
                                    item.eksemplar.id,
                                    item.id,
                                    item.rakId_fisik
                                  )
                                }
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                title="Sinkronkan database ke rak fisik saat ini"
                              >
                                Fix Rak
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[10px]">Terkunci</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 print:hidden">
          <span>
            Menampilkan{" "}
            <strong>
              {filteredItems.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
            </strong>{" "}
            dari <strong>{filteredItems.length}</strong> temuan
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-slate-700 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold px-2">
              Hal {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-slate-700 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BERITA ACARA PRINT SECTION (Shown strictly when printing) */}
      <div className="hidden print:block space-y-6 text-black bg-white p-6">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider">
            BERITA ACARA STOCK OPNAME PERPUSTAKAAN
          </h2>
          <h3 className="text-base font-semibold">SMK NEGERI 1 BERINGIN</h3>
          <p className="text-xs text-stone-600">
            Sesi: {sesi.nama_sesi} • Tanggal Pelaksanaan:{" "}
            {new Date(sesi.tanggal_mulai).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mb-6">
          <div>
            <p><strong>Nama Sesi:</strong> {sesi.nama_sesi}</p>
            <p><strong>Cakupan Rak:</strong> {sesi.rakRef ? sesi.rakRef.nama : "Semua Rak (Global)"}</p>
            <p><strong>Petugas Audit:</strong> {sesi.petugas || "Petugas Perpustakaan"}</p>
          </div>
          <div>
            <p><strong>Total Item Sistem:</strong> {summary.total} Eksemplar</p>
            <p><strong>Item Ditemukan (Fisik):</strong> {summary.terpindai} Eksemplar ({summary.persentase}%)</p>
            <p><strong>Buku Sesuai Rak:</strong> {summary.sesuai} Eksemplar</p>
            <p><strong>Buku Salah Rak:</strong> {summary.salahRak} Eksemplar</p>
            <p><strong>Buku Rusak:</strong> {summary.rusak} Eksemplar</p>
            <p><strong>Buku Tidak Ditemukan (Hilang):</strong> {summary.belumTerpindai} Eksemplar</p>
          </div>
        </div>

        {sesi.catatan && (
          <div className="text-xs mb-6 border p-2 rounded">
            <strong>Catatan Audit:</strong> {sesi.catatan}
          </div>
        )}

        <div className="flex justify-between items-start pt-12 text-xs text-center">
          <div className="w-56">
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala Perpustakaan</p>
            <div className="h-20" />
            <p className="font-bold underline">___________________________</p>
            <p>NIP. </p>
          </div>

          <div className="w-56">
            <p>Beringin, {new Date().toLocaleDateString("id-ID")}</p>
            <p className="font-semibold">Petugas Pemeriksa</p>
            <div className="h-20" />
            <p className="font-bold underline">
              {sesi.petugas || "___________________________"}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL SELESAIKAN & REKONSILIASI DATABASE */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-white">
                    Selesaikan &amp; Tutup Audit
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Konfirmasi hasil stock opname koleksi fisik perpustakaan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFinishModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-stone-50 dark:bg-slate-800/60 p-4 rounded-xl border border-stone-200/70 dark:border-slate-700/60 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Koleksi Diperiksa:</span>
                  <span className="font-bold text-stone-900 dark:text-white">{summary.total} Eksemplar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Berhasil Ditemukan Fisik:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {summary.terpindai} Eksemplar ({summary.persentase}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Tidak Ditemukan (Potensi Hilang):</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{summary.belumTerpindai} Eksemplar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Buku Rusak:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{summary.rusak} Eksemplar</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncDatabase}
                    onChange={(e) => setSyncDatabase(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-white block">
                      Rekonsiliasi Master Database Otomatis (Direkomendasikan)
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                      Sistem akan otomatis memperbarui status buku yang tidak ditemukan menjadi <strong>HILANG</strong>, menandai buku rusak menjadi <strong>RUSAK</strong>, dan menyinkronkan lokasi rak fisik terbaru.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-slate-800"
                >
                  Kembali Memeriksa
                </button>
                <button
                  type="button"
                  onClick={handleFinishSession}
                  disabled={isFinishing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isFinishing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isFinishing ? "Memproses..." : "Ya, Finalisasi Sesi Audit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
