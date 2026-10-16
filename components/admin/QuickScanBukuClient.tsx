"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Scan,
  Barcode,
  Camera,
  CameraOff,
  Sparkles,
  BookOpen,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  Edit3,
  Layers,
  History,
  Tag
} from "lucide-react";
import { quickScanAddBuku, type QuickScanBukuResult } from "@/actions/scanBuku";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type ScannedItem = {
  id: string;
  waktu: string;
  result: QuickScanBukuResult;
};

// Synth Audio Beep generator
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
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.08); // A6
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

export function QuickScanBukuClient() {
  const [inputCode, setInputCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [history, setHistory] = useState<ScannedItem[]>([]);
  const [lastResult, setLastResult] = useState<QuickScanBukuResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Auto focus input on mount and keep focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleProcessScan = useCallback(
    async (codeToScan: string) => {
      const code = codeToScan.trim().replace(/[-\s]/g, "");
      if (!code || isScanningRef.current || processing) return;

      isScanningRef.current = true;
      setProcessing(true);
      setInputCode("");

      try {
        const res = await quickScanAddBuku(code);
        setLastResult(res);

        if (res.ok) {
          if (soundEnabled) playBeep(true);
          const newItem: ScannedItem = {
            id: `${Date.now()}-${Math.random()}`,
            waktu: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            result: res,
          };
          setHistory((prev) => [newItem, ...prev]);
        } else {
          if (soundEnabled) playBeep(false);
        }
      } catch (err: any) {
        if (soundEnabled) playBeep(false);
        setLastResult({
          ok: false,
          pesan: `Terjadi kesalahan saat memproses: ${err?.message || err}`,
        });
      } finally {
        setProcessing(false);
        isScanningRef.current = false;
        // Keep focus on input for next barcode scan
        setTimeout(() => {
          inputRef.current?.focus();
        }, 80);
      }
    },
    [processing, soundEnabled]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      handleProcessScan(inputCode);
    }
  };

  // Camera Barcode Scanner using Html5Qrcode
  const toggleCamera = async () => {
    if (cameraActive) {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          console.error("Gagal stop kamera:", e);
        }
        scannerRef.current = null;
      }
      setCameraActive(false);
    } else {
      setCameraActive(true);
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode("camera-scanner-view", {
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
            {
              fps: 10,
              qrbox: { width: 260, height: 180 },
              aspectRatio: 1.333,
            },
            (decodedText) => {
              if (decodedText && !isScanningRef.current) {
                handleProcessScan(decodedText);
              }
            },
            () => {}
          );
        } catch (err) {
          console.error("Kamera gagal diaktifkan:", err);
          alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
          setCameraActive(false);
        }
      }, 100);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Compute session stats
  const totalBukuBaru = history.filter((h) => h.result.isNew).length;
  const totalStokTambah = history.filter((h) => h.result.ok).length;

  return (
    <div className="space-y-6">
      {/* Top Session Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-slate-800/80 rounded-2xl p-4 relative overflow-hidden group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Total Di-scan
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mt-1 font-mono">
            {history.length}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-slate-500 block">Sesi scanner saat ini</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-slate-800/80 rounded-2xl p-4 relative overflow-hidden group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Judul Baru
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-300 mt-1 font-mono">
            {totalBukuBaru}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-slate-500 block">Otomatis dari Google Books</span>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-slate-800/80 rounded-2xl p-4 relative overflow-hidden group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Stok Masuk
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-300 mt-1 font-mono">
            +{totalStokTambah}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-slate-500 block">Eksemplar fisik bertambah</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Column: Scanner Station */}
        <div className="space-y-5">
          {/* Main Scan Terminal Card */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-slate-800/90 shadow-lg dark:shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <Scan className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight">
                    Stasiun Scan Barcode Buku
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Arahkan scanner laser ke barcode belakang buku atau gunakan kamera HP
                  </p>
                </div>
              </div>

              {/* Sound & Camera Toggles */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Matikan Suara Beep" : "Nyalakan Suara Beep"}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                    soundEnabled
                      ? "bg-emerald-100/70 hover:bg-emerald-200/70 dark:bg-slate-800 border-emerald-300 dark:border-slate-700 text-emerald-800 dark:text-emerald-400"
                      : "bg-stone-100 dark:bg-slate-900 border-stone-200 dark:border-slate-800 text-stone-400 dark:text-slate-500"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    cameraActive
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30"
                      : "bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200"
                  }`}
                >
                  {cameraActive ? (
                    <>
                      <CameraOff className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>Tutup Kamera</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Scan Kamera HP</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Camera Viewport (Active when camera toggled) */}
            {cameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-2xl p-2 animate-in fade-in duration-200">
                <div id="camera-scanner-view" className="w-full max-h-[320px] rounded-xl overflow-hidden" />
                <div className="p-2 text-center text-xs text-stone-200 bg-slate-900/90 rounded-b-xl border-t border-slate-800 mt-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>Arahkan kamera ke garis barcode ISBN di belakang buku fisik...</span>
                </div>
              </div>
            )}

            {/* Barcode Input Form for Laser Gun & Manual */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <div className="flex items-center gap-3 bg-stone-50 dark:bg-slate-950/80 rounded-2xl border-2 border-stone-300 dark:border-slate-700/80 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 p-2 sm:p-3 shadow-inner transition-all">
                  <Barcode className="w-6 h-6 text-emerald-600 dark:text-emerald-400 ml-2 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    disabled={processing}
                    placeholder="Tembak barcode buku fisik / ketik ISBN (misal: 9786022415123)…"
                    className="flex-1 h-11 bg-transparent font-mono text-sm sm:text-base text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={processing || !inputCode.trim()}
                    className="shrink-0 h-11 px-5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed disabled:bg-stone-200/80 disabled:text-stone-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses…</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        <span>Scan In</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 px-1">
                <span>Scanner laser USB/Bluetooth akan memicu scan otomatis saat ditembakkan.</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Ready to Scan ●</span>
              </div>
            </form>

            {/* Last Result Alert Feedback */}
            {lastResult && (
              <div
                className={`rounded-2xl p-4 sm:p-5 border transition-all animate-in fade-in duration-200 ${
                  lastResult.ok
                    ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastResult.ok ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm sm:text-base leading-snug">
                      {lastResult.pesan}
                    </p>

                    {lastResult.buku && (
                      <div className="mt-3 pt-3 border-t border-emerald-300/50 dark:border-emerald-500/20 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {lastResult.buku.isbn && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-mono font-bold">
                              ISBN: {lastResult.buku.isbn}
                            </span>
                          )}
                          <span className="text-stone-700 dark:text-slate-300">
                            Judul: <strong className="text-stone-900 dark:text-white">{lastResult.buku.judul}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <span className="text-stone-700 dark:text-slate-300 font-mono">
                            Total Stok: <strong className="text-emerald-700 dark:text-emerald-400">{lastResult.buku.stok_total} buku</strong>
                          </span>
                          {lastResult.eksemplarKode && (
                            <>
                              <span className="text-stone-400 dark:text-slate-400">·</span>
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 border border-stone-300 dark:border-slate-700 font-mono font-bold">
                                Barcode Fisik Eksemplar: #{lastResult.eksemplarKode}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {lastResult.notFound && lastResult.isbn && (
                      <div className="mt-3 pt-2">
                        <Link
                          href={`/admin/buku/create?isbn=${lastResult.isbn}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Buka Form Input Manual dengan ISBN "{lastResult.isbn}" →</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-slate-800/80 p-5 space-y-2 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Petunjuk Penggunaan Cepat
            </h3>
            <ul className="text-xs text-stone-600 dark:text-slate-300 space-y-1.5 leading-relaxed list-disc list-inside">
              <li>
                <strong>Buku Baru:</strong> Begitu di-scan ISBN-nya, sistem otomatis menarik Judul, Penulis, Cover, dan Nomor Rak DDC dari database/Google Books.
              </li>
              <li>
                <strong>Buku yang Sudah Ada:</strong> Scan barcode ISBN buku yang sama akan otomatis menambah jumlah stok fisik (+1 eksemplar).
              </li>
              <li>
                <strong>ISBN vs Nomor Eksemplar:</strong> <em>ISBN</em> (misal: 9786025612671) adalah nomor identitas internasional judul buku. Sedangkan <em>Nomor Eksemplar</em> (misal: #6954301171421) adalah nomor barcode fisik per buku untuk ditempel di sampul.
              </li>
              <li>
                <strong>Scanner Fisik:</strong> Pastikan kursor berada di kotak input, lalu tekan pelatuk scanner pada barcode buku.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Live Feed of Scanned Books in Current Session */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-slate-800/90 shadow-lg dark:shadow-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-stone-900 dark:text-white text-sm">Riwayat Scan Sesi Ini</h3>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="text-[11px] text-stone-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                Bersihkan
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-slate-500 space-y-2">
              <Scan className="w-8 h-8 text-stone-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs">Belum ada buku yang di-scan pada sesi ini.</p>
              <p className="text-[11px] text-stone-400 dark:text-slate-600">Scan barcode pertama Anda sekarang!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800/80 hover:border-stone-300 dark:hover:border-slate-700 space-y-2.5 transition-all shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    {/* Cover Thumbnail */}
                    <div className="w-12 h-16 rounded-lg bg-stone-200 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                      {item.result.buku?.cover_url ? (
                        <img
                          src={item.result.buku.cover_url}
                          alt={item.result.buku.judul}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-4 h-4 text-stone-400 dark:text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
                            item.result.isNew
                              ? "bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/30"
                              : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                          }`}
                        >
                          {item.result.isNew ? "Buku Baru" : "+1 Stok"}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 dark:text-slate-500">
                          {item.waktu}
                        </span>
                      </div>

                      <h4 className="font-bold text-stone-900 dark:text-white text-xs mt-1 line-clamp-1">
                        {item.result.buku?.judul}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                        {item.result.buku?.penulis}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {item.result.buku?.isbn && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            ISBN: {item.result.buku.isbn}
                          </span>
                        )}
                        {item.result.eksemplarKode && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Eksemplar #{item.result.eksemplarKode}
                          </span>
                        )}
                        {item.result.buku?.kategori && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-400 border border-stone-200 dark:border-slate-800">
                            {item.result.buku.kategori}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.result.buku && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-slate-800/60">
                      <Link
                        href={`/admin/buku/${item.result.buku.id}/eksemplar`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        <Barcode className="w-3 h-3" />
                        <span>Lihat Eksemplar</span>
                      </Link>
                      <span className="text-stone-300 dark:text-slate-600">·</span>
                      <Link
                        href={`/admin/buku/${item.result.buku.id}/edit`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
