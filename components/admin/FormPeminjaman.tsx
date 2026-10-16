"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { User, BookOpen, Calendar, Clock, Sparkles, AlertCircle, Check, BookMarked, Package, X, Barcode, Camera, CameraOff, Loader2, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createTransaksi, lookupBarcodeTransaksiAction } from "@/actions/transaksi";
import { formatDate } from "@/lib/utils";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type SiswaItem = {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
};

type BukuBiasaItem = {
  id: string;
  judul: string;
  penulis: string;
  stok_tersedia: number;
  kode_buku: string | null;
};

type BukuMapelItem = {
  id: string;
  judul: string;
  penulis: string;
  stok_tersedia: number;
  kode_buku: string | null;
  kategori: string | null;
  tahun_ajaran: string | null;
};

interface FormPeminjamanProps {
  siswaList: SiswaItem[];
  bukuBiasaList: BukuBiasaItem[];
  bukuMapelList: BukuMapelItem[];
}

type TabType = "BIASA" | "MAPEL";

function playBeep(isSuccess = true) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
}

export default function FormPeminjaman({ siswaList, bukuBiasaList, bukuMapelList }: FormPeminjamanProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>("BIASA");

  // Scanner state
  const [scanCode, setScanCode] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Search Filter state
  const [searchBukuBiasa, setSearchBukuBiasa] = useState("");
  const [searchBukuMapel, setSearchBukuMapel] = useState("");
  const [searchSiswa, setSearchSiswa] = useState("");

  // BIASA state
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [selectedBukuIds, setSelectedBukuIds] = useState<string[]>([]);
  const [durasiPreset, setDurasiPreset] = useState<"3" | "7" | "14" | "30" | "custom_days" | "custom_date">("7");
  const [customDays, setCustomDays] = useState<number>(7);
  const [customDate, setCustomDate] = useState<string>("");

  // MAPEL state
  const [selectedSiswaMapel, setSelectedSiswaMapel] = useState("");
  const [selectedBukuMapelIds, setSelectedBukuMapelIds] = useState<string[]>([]);
  const [batasKembaliMapel, setBatasKembaliMapel] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleProcessBarcode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || scanLoading) return;

    setScanLoading(true);
    setScanFeedback(null);
    setScanCode("");

    try {
      const res = await lookupBarcodeTransaksiAction(code);
      if (res.ok) {
        playBeep(true);
        if (res.type === "SISWA" && res.siswa) {
          if (activeTab === "BIASA") setSelectedSiswa(res.siswa.id);
          else setSelectedSiswaMapel(res.siswa.id);
          setScanFeedback({ ok: true, message: `✓ Siswa "${res.siswa.nama}" (${res.siswa.kelas}) terpilih!` });
        } else if (res.type === "BUKU" && res.buku) {
          const buku = res.buku;
          if (buku.tipe_buku === "MAPEL") {
            setActiveTab("MAPEL");
            setSelectedBukuMapelIds((prev) => (prev.includes(buku.id) ? prev : [...prev, buku.id]));
            setScanFeedback({ ok: true, message: `✓ Buku Mapel "${buku.judul}" ditambahkan ke pinjaman!` });
          } else {
            setActiveTab("BIASA");
            setSelectedBukuIds((prev) => (prev.includes(buku.id) ? prev : [...prev, buku.id]));
            setScanFeedback({ ok: true, message: `✓ Buku "${buku.judul}" ditambahkan ke pinjaman!` });
          }
        }
      } else {
        playBeep(false);
        setScanFeedback({ ok: false, message: res.message });
      }
    } catch (err: any) {
      playBeep(false);
      setScanFeedback({ ok: false, message: err?.message || "Gagal memproses barcode" });
    } finally {
      setScanLoading(false);
      setTimeout(() => scanInputRef.current?.focus(), 80);
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }
      setCameraActive(false);
    } else {
      setCameraActive(true);
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode("transaksi-camera-scanner-view", {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ],
            verbose: false,
          });
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 12, qrbox: { width: 280, height: 160 }, aspectRatio: 1.333 },
            (decodedText) => {
              if (decodedText) {
                handleProcessBarcode(decodedText);
              }
            },
            () => {}
          );
        } catch (err) {
          alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
          setCameraActive(false);
        }
      }, 100);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, []);

  // Filtered Siswa
  const filteredSiswa = useMemo(() => {
    if (!searchSiswa.trim()) return siswaList;
    const q = searchSiswa.toLowerCase();
    return siswaList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        s.kelas.toLowerCase().includes(q)
    );
  }, [siswaList, searchSiswa]);

  // Filtered Buku Biasa
  const filteredBukuBiasa = useMemo(() => {
    if (!searchBukuBiasa.trim()) return bukuBiasaList;
    const q = searchBukuBiasa.toLowerCase();
    return bukuBiasaList.filter(
      (b) =>
        b.judul.toLowerCase().includes(q) ||
        b.penulis.toLowerCase().includes(q) ||
        (b.kode_buku && b.kode_buku.toLowerCase().includes(q))
    );
  }, [bukuBiasaList, searchBukuBiasa]);

  // Filtered Buku Mapel
  const filteredBukuMapel = useMemo(() => {
    if (!searchBukuMapel.trim()) return bukuMapelList;
    const q = searchBukuMapel.toLowerCase();
    return bukuMapelList.filter(
      (b) =>
        b.judul.toLowerCase().includes(q) ||
        b.penulis.toLowerCase().includes(q) ||
        (b.kode_buku && b.kode_buku.toLowerCase().includes(q)) ||
        (b.kategori && b.kategori.toLowerCase().includes(q))
    );
  }, [bukuMapelList, searchBukuMapel]);

  // --- Kalkulasi tanggal kembali Buku Biasa ---
  const today = new Date();
  const calculatedDueDate = (() => {
    if (durasiPreset === "custom_date" && customDate) {
      const d = new Date(customDate);
      return isNaN(d.getTime()) ? today : d;
    }
    const d = new Date();
    const days = durasiPreset === "custom_days" ? (customDays || 1) : parseInt(durasiPreset, 10);
    d.setDate(d.getDate() + (days || 7));
    return d;
  })();

  const totalHari = (() => {
    if (durasiPreset === "custom_date" && customDate) {
      const d = new Date(customDate);
      const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    }
    return durasiPreset === "custom_days" ? (customDays || 1) : parseInt(durasiPreset, 10);
  })();

  // --- Default batas kembali mapel = akhir tahun ajaran (30 Juni) ---
  const defaultBatasMapel = (() => {
    const now = new Date();
    const tahunDepan = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    return `${tahunDepan}-06-30`;
  })();

  const resetBiasa = () => {
    setSelectedSiswa("");
    setSelectedBukuIds([]);
    setDurasiPreset("7");
    setCustomDays(7);
    setCustomDate("");
  };

  const resetMapel = () => {
    setSelectedSiswaMapel("");
    setSelectedBukuMapelIds([]);
    setBatasKembaliMapel("");
  };

  const toggleBuku = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSubmitBiasa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedSiswa) { setErrorMessage("Silakan pilih siswa peminjam."); return; }
    if (selectedBukuIds.length === 0) { setErrorMessage("Silakan pilih minimal 1 buku yang tersedia."); return; }

    const formData = new FormData();
    formData.append("siswaId", selectedSiswa);
    formData.append("gaya", "BIASA");
    selectedBukuIds.forEach((id) => formData.append("bukuIds", id));

    if (durasiPreset === "custom_date" && customDate) {
      formData.append("batasKembali", customDate);
    } else {
      const days = durasiPreset === "custom_days" ? customDays : parseInt(durasiPreset, 10);
      formData.append("durasiHari", String(days || 7));
    }

    startTransition(async () => {
      try {
        await createTransaksi(formData);
        setSuccessMessage(`Peminjaman buku biasa berhasil dicatat (${totalHari} hari)!`);
        resetBiasa();
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Gagal mencatat peminjaman");
      }
    });
  };

  const handleSubmitMapel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedSiswaMapel) { setErrorMessage("Silakan pilih siswa peminjam."); return; }
    if (selectedBukuMapelIds.length === 0) { setErrorMessage("Silakan pilih minimal 1 buku mapel/LKS."); return; }

    const formData = new FormData();
    formData.append("siswaId", selectedSiswaMapel);
    formData.append("gaya", "MAPEL");
    selectedBukuMapelIds.forEach((id) => formData.append("bukuIds", id));
    formData.append("batasKembali", batasKembaliMapel || defaultBatasMapel);

    startTransition(async () => {
      try {
        await createTransaksi(formData);
        const selectedCount = selectedBukuMapelIds.length;
        setSuccessMessage(`Peminjaman ${selectedCount} buku mapel berhasil dicatat!`);
        resetMapel();
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Gagal mencatat peminjaman");
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/90">
        <button
          type="button"
          onClick={() => { setActiveTab("BIASA"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all cursor-pointer ${
            activeTab === "BIASA"
              ? "bg-emerald-600 text-white shadow-inner"
              : "bg-transparent text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Buku Biasa
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            activeTab === "BIASA" ? "bg-emerald-500 text-slate-950" : "bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-400"
          }`}>
            Individual
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("MAPEL"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all cursor-pointer ${
            activeTab === "MAPEL"
              ? "bg-violet-600 text-white shadow-inner"
              : "bg-transparent text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Buku Mapel / LKS
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            activeTab === "MAPEL" ? "bg-violet-400 text-slate-950" : "bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-400"
          }`}>
            Paket
          </span>
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {/* Alert / Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ========================================= */}
        {/* BARCODE SCANNER STATION (LASER & CAMERA) */}
        {/* ========================================= */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/50 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950 border-2 border-blue-200/90 dark:border-blue-900/50 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Stasiun Scan Peminjaman (Laser Barcode / QR)</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SIAP SCAN
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tembak barcode <strong>Kartu Siswa</strong> untuk pilih siswa, lalu tembak barcode <strong>Buku</strong> untuk memilih buku
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCamera}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                cameraActive
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25"
                  : "bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              {cameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5 text-rose-500" />
                  <span>Tutup Kamera</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Gunakan Kamera HP</span>
                </>
              )}
            </button>
          </div>

          {/* Camera Viewport */}
          {cameraActive && (
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-blue-500/40 shadow-xl p-2 animate-in fade-in duration-200">
              <div id="transaksi-camera-scanner-view" className="w-full max-h-[260px] rounded-xl overflow-hidden" />
              <div className="p-2 text-center text-xs text-slate-200 bg-slate-950/90 rounded-b-xl border-t border-slate-800 mt-2 flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Arahkan kamera ke Barcode Kartu Siswa atau Barcode Buku Fisik...</span>
              </div>
            </div>
          )}

          {/* Laser Scanner Gun Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Barcode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <input
                ref={scanInputRef}
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleProcessBarcode(scanCode);
                  }
                }}
                placeholder="Tembak barcode Kartu Siswa / Barcode Buku (cth: 9786025612671 / 1846-5YLPAH)…"
                className="w-full h-11 pl-11 pr-4 font-mono font-bold tracking-wide border-2 border-blue-300 dark:border-blue-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/80 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              onClick={() => handleProcessBarcode(scanCode)}
              disabled={scanLoading || !scanCode.trim()}
              className="shrink-0 h-11 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
            >
              {scanLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{scanLoading ? "Memproses…" : "Scan In"}</span>
            </button>
          </div>

          {/* Feedback message */}
          {scanFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 font-semibold border animate-in fade-in duration-200 ${
                scanFeedback.ok
                  ? "bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-rose-100/80 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              }`}
            >
              {scanFeedback.ok ? <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />}
              <span>{scanFeedback.message}</span>
            </div>
          )}
        </div>

        {/* ============================== */}
        {/* TAB BUKU BIASA (INDIVIDUAL)   */}
        {/* ============================== */}
        {activeTab === "BIASA" && (
          <form onSubmit={handleSubmitBiasa} className="space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="p-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">Peminjaman Buku Biasa</h2>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Peminjaman individual dengan durasi hari kustom
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Siswa Peminjam *
                  </label>
                  {siswaList.length > 5 && (
                    <span className="text-[10px] text-stone-400 dark:text-slate-500">
                      Total {siswaList.length} siswa
                    </span>
                  )}
                </div>

                {/* Filter Siswa Input */}
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchSiswa}
                    onChange={(e) => setSearchSiswa(e.target.value)}
                    placeholder="Ketik untuk cari nama / NISN / kelas…"
                    className="w-full h-8 pl-8 pr-7 text-xs border border-stone-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {searchSiswa && (
                    <button
                      type="button"
                      onClick={() => setSearchSiswa("")}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedSiswa}
                  onChange={(e) => setSelectedSiswa(e.target.value)}
                  className="w-full h-10 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-white bg-stone-50 dark:bg-slate-800/90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer shadow-xs"
                  required
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-stone-500 dark:text-slate-400">
                    -- Pilih Nama Siswa ({filteredSiswa.length} ditemukan) --
                  </option>
                  {filteredSiswa.map((s) => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-stone-900 dark:text-white">
                      {s.nama} ({s.nisn}) - {s.kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Buku Tersedia * (boleh lebih dari satu)
                  </label>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {selectedBukuIds.length > 0 ? `${selectedBukuIds.length} Terpilih` : `${bukuBiasaList.length} Buku`}
                  </span>
                </div>

                {/* Live Search Buku Input */}
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchBukuBiasa}
                    onChange={(e) => setSearchBukuBiasa(e.target.value)}
                    placeholder="Cari judul buku, pengarang, atau ISBN..."
                    className="w-full h-8 pl-8 pr-7 text-xs border border-emerald-300/80 dark:border-emerald-700/60 rounded-lg bg-emerald-50/40 dark:bg-slate-900/90 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                  />
                  {searchBukuBiasa && (
                    <button
                      type="button"
                      onClick={() => setSearchBukuBiasa("")}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="border border-stone-300 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-stone-200 dark:divide-slate-800 bg-white dark:bg-slate-900/90 shadow-inner">
                  {filteredBukuBiasa.length === 0 && (
                    <p className="p-3 text-xs text-stone-400 dark:text-slate-500 text-center">
                      {searchBukuBiasa ? `Tidak ada buku yang cocok dengan "${searchBukuBiasa}"` : "Tidak ada buku biasa tersedia."}
                    </p>
                  )}
                  {filteredBukuBiasa.map((b) => (
                    <label
                      key={b.id}
                      className={`flex items-center gap-2.5 px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                        selectedBukuIds.includes(b.id)
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-medium"
                          : "hover:bg-stone-100 dark:hover:bg-slate-800/80 text-stone-800 dark:text-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBukuIds.includes(b.id)}
                        onChange={() => toggleBuku(b.id, selectedBukuIds, setSelectedBukuIds)}
                        className="w-4 h-4 rounded border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="flex-1 truncate">
                        {b.judul}
                        {b.penulis ? <span className="text-stone-500 dark:text-slate-400 text-[11px]"> · {b.penulis}</span> : ""}
                        {b.kode_buku ? <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]"> [{b.kode_buku}]</span> : ""}
                      </span>
                      <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${
                        b.stok_tersedia > 0 
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" 
                          : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                      }`}>
                        Sisa {b.stok_tersedia}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
                  {selectedBukuIds.length > 0
                    ? `Terpilih: ${selectedBukuIds.length} buku`
                    : "Centang 1 atau lebih buku untuk dipinjam."}
                </p>
              </div>
            </div>

            {/* Custom Duration */}
            <div className="bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-white">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Durasi Peminjaman (Custom Hari)
                </label>
                <span className="text-[11px] text-stone-500 dark:text-slate-400">
                  Saat ini: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{totalHari} Hari</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "3", label: "3 Hari", desc: "Singkat" },
                  { id: "7", label: "7 Hari", desc: "Standar" },
                  { id: "14", label: "14 Hari", desc: "2 Minggu" },
                  { id: "30", label: "30 Hari", desc: "1 Bulan" },
                  { id: "custom_days", label: "Kustom Hari", desc: "Input Angka" },
                  { id: "custom_date", label: "Pilih Tanggal", desc: "Kalender" },
                ].map((preset) => {
                  const isActive = durasiPreset === preset.id;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setDurasiPreset(preset.id as typeof durasiPreset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border shadow-xs ${
                        isActive
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                          : "bg-white dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="font-bold">{preset.label}</span>
                      <span className={`text-[10px] ml-1.5 opacity-80 ${isActive ? "text-emerald-100" : "text-stone-500 dark:text-slate-400"}`}>
                        ({preset.desc})
                      </span>
                    </button>
                  );
                })}
              </div>

              {durasiPreset === "custom_days" && (
                <div className="pt-2 flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1 block">
                      Jumlah Hari Peminjaman:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={customDays}
                        onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full h-9 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                        placeholder="Contoh: 5, 10, 21 hari..."
                      />
                      <span className="absolute right-3 top-2 text-xs text-stone-400 dark:text-slate-400 font-medium">Hari</span>
                    </div>
                  </div>
                </div>
              )}

              {durasiPreset === "custom_date" && (
                <div className="pt-2 flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1 block">
                      Pilih Tanggal Batas Pengembalian:
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-9 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-stone-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tanggal Pinjam: <strong className="text-stone-900 dark:text-white">{formatDate(today)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/60 shadow-xs">
                  <span>Jatuh Tempo: <strong className="text-emerald-900 dark:text-emerald-400">{formatDate(calculatedDueDate)}</strong> ({totalHari} Hari)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} className="h-10 px-6 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20">
                <Sparkles className="w-4 h-4 mr-1.5" />
                {isPending ? "Menyimpan..." : "Catat Peminjaman Buku Biasa"}
              </Button>
            </div>
          </form>
        )}

        {/* ============================== */}
        {/* TAB BUKU MAPEL / LKS (PAKET)  */}
        {/* ============================== */}
        {activeTab === "MAPEL" && (
          <form onSubmit={handleSubmitMapel} className="space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="p-2 bg-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-500/30 rounded-xl">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">Peminjaman Buku Mapel / LKS</h2>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Buku paket per kelas — berganti setiap tahun ajaran baru
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-2.5 p-3.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 rounded-2xl text-xs text-violet-900 dark:text-violet-200 shadow-xs">
              <Package className="w-4 h-4 shrink-0 mt-0.5 text-violet-600 dark:text-violet-400" />
              <div>
                <p className="font-bold text-violet-900 dark:text-violet-300 mb-0.5">Peminjaman Paket Tahun Ajaran</p>
                <p className="text-violet-800/90 dark:text-violet-300/90 leading-relaxed">
                  Buku mapel/LKS dipinjam untuk 1 tahun ajaran penuh. Batas pengembalian default adalah akhir tahun ajaran (30 Juni). Buku dikembalikan dan diganti saat naik kelas / tahun ajaran baru.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    Siswa Peminjam *
                  </label>
                  {siswaList.length > 5 && (
                    <span className="text-[10px] text-stone-400 dark:text-slate-500">
                      Total {siswaList.length} siswa
                    </span>
                  )}
                </div>

                {/* Filter Siswa Input for Mapel */}
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchSiswa}
                    onChange={(e) => setSearchSiswa(e.target.value)}
                    placeholder="Ketik untuk cari nama / NISN / kelas…"
                    className="w-full h-8 pl-8 pr-7 text-xs border border-stone-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  {searchSiswa && (
                    <button
                      type="button"
                      onClick={() => setSearchSiswa("")}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedSiswaMapel}
                  onChange={(e) => setSelectedSiswaMapel(e.target.value)}
                  className="w-full h-10 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-white bg-stone-50 dark:bg-slate-800/90 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all cursor-pointer shadow-xs"
                  required
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-stone-500 dark:text-slate-400">
                    -- Pilih Nama Siswa ({filteredSiswa.length} ditemukan) --
                  </option>
                  {filteredSiswa.map((s) => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-stone-900 dark:text-white">
                      {s.nama} ({s.nisn}) - {s.kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
                    <BookMarked className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    Buku Mapel / LKS * (boleh lebih dari satu)
                  </label>
                  <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-semibold">
                    {selectedBukuMapelIds.length > 0 ? `${selectedBukuMapelIds.length} Terpilih` : `${bukuMapelList.length} Mapel`}
                  </span>
                </div>

                {/* Live Search Buku Mapel Input */}
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchBukuMapel}
                    onChange={(e) => setSearchBukuMapel(e.target.value)}
                    placeholder="Cari judul mapel, mata pelajaran, atau ISBN..."
                    className="w-full h-8 pl-8 pr-7 text-xs border border-violet-300/80 dark:border-violet-700/60 rounded-lg bg-violet-50/40 dark:bg-slate-900/90 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 shadow-inner"
                  />
                  {searchBukuMapel && (
                    <button
                      type="button"
                      onClick={() => setSearchBukuMapel("")}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="border border-stone-300 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-stone-200 dark:divide-slate-800 bg-white dark:bg-slate-900/90 shadow-inner">
                  {filteredBukuMapel.length === 0 && (
                    <p className="p-3 text-xs text-stone-400 dark:text-slate-500 text-center">
                      {searchBukuMapel ? `Tidak ada buku yang cocok dengan "${searchBukuMapel}"` : "Belum ada buku mapel/LKS terdaftar."}
                    </p>
                  )}
                  {filteredBukuMapel.map((b) => (
                    <label
                      key={b.id}
                      className={`flex items-center gap-2.5 px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                        selectedBukuMapelIds.includes(b.id)
                          ? "bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-300 font-medium"
                          : "hover:bg-stone-100 dark:hover:bg-slate-800/80 text-stone-800 dark:text-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBukuMapelIds.includes(b.id)}
                        onChange={() => toggleBuku(b.id, selectedBukuMapelIds, setSelectedBukuMapelIds)}
                        className="w-4 h-4 rounded border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                      <span className="flex-1 truncate">
                        {b.judul}
                        {b.tahun_ajaran ? <span className="text-stone-500 dark:text-slate-400 text-[10px]"> ({b.tahun_ajaran})</span> : ""}
                        {b.kategori ? <span className="text-violet-600 dark:text-violet-400 text-[10px] font-semibold"> — {b.kategori}</span> : ""}
                        {b.kode_buku ? <span className="text-stone-400 dark:text-slate-500 font-mono text-[10px]"> [{b.kode_buku}]</span> : ""}
                      </span>
                      <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${
                        b.stok_tersedia > 0 
                          ? "bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800" 
                          : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                      }`}>
                        Sisa {b.stok_tersedia}
                      </span>
                    </label>
                  ))}
                </div>
                {bukuMapelList.length === 0 ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
                    Belum ada buku mapel/LKS terdaftar. Tambah dulu di menu Koleksi Buku.
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
                    {selectedBukuMapelIds.length > 0
                      ? `Terpilih: ${selectedBukuMapelIds.length} buku mapel`
                      : "Centang 1 atau lebih buku mapel untuk dipinjam."}
                  </p>
                )}
              </div>
            </div>

            {/* Batas Kembali Mapel */}
            <div className="bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-white">
                <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Batas Pengembalian (Akhir Tahun Ajaran)
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-xs">
                  <input
                    type="date"
                    value={batasKembaliMapel || defaultBatasMapel}
                    onChange={(e) => setBatasKembaliMapel(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-9 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Default: 30 Juni (akhir tahun ajaran)
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 pt-2 border-t border-stone-200 dark:border-slate-700/80">
                <span>Tanggal Pinjam: <strong className="text-stone-900 dark:text-white">{formatDate(today)}</strong></span>
                <div className="font-medium text-violet-800 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/40 px-3 py-1 rounded-lg border border-violet-300 dark:border-violet-800/60 shadow-xs">
                  Batas: <strong className="text-violet-900 dark:text-violet-400">{formatDate(new Date(batasKembaliMapel || defaultBatasMapel))}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 px-6 cursor-pointer bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-md shadow-violet-600/20"
              >
                <Package className="w-4 h-4 mr-1.5" />
                {isPending ? "Menyimpan..." : "Catat Peminjaman Mapel/LKS"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
