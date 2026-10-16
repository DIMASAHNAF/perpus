"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, BookOpen, CheckCircle2, Camera, CameraOff, Sparkles, Scan, Volume2, Barcode, Zap } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { fetchIsbnMetadataAction } from "@/actions/scanBuku";

interface IsbnFetcherProps {
  onFetch: (data: {
    judul: string;
    penulis: string;
    cover_url: string | null;
    kategori?: string | null;
    klasifikasi?: string | null;
  }) => void;
}

// Audio Beep
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
  } catch (e) {
    // ignore
  }
}

/**
 * Fetch metadata dari Multi-Source (Katalog Nasional SMK, Google Books, OpenLibrary).
 * Dioptimalkan khusus untuk ALAT SCANNER TEMBAK KODE BATANG (1D Barcode Gun) & Kamera.
 */
export function IsbnFetcher({ onFetch }: IsbnFetcherProps) {
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isFetchingRef = useRef(false);

  const executeFetch = useCallback(
    async (rawCode: string) => {
      const clean = rawCode.trim().replace(/[-\s]/g, "");
      if (!clean || clean.length < 8) {
        setOk(false);
        setMsg("Kode batang / ISBN minimal 8-10 digit");
        return;
      }

      setIsbn(clean);
      setLoading(true);
      setMsg(null);
      isFetchingRef.current = true;

      try {
        const res = await fetchIsbnMetadataAction(clean);

        // Selalu sinkronkan nomor ISBN ke input form name=isbn dan name=kode_buku
        const formIsbn = document.querySelector<HTMLInputElement>('input[name="isbn"]');
        if (formIsbn) {
          formIsbn.value = clean;
          formIsbn.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const formKode = document.querySelector<HTMLInputElement>('input[name="kode_buku"]');
        if (formKode && !formKode.value) {
          formKode.value = clean;
          formKode.dispatchEvent(new Event("input", { bubbles: true }));
        }

        if (!res.ok || !res.data) {
          setOk(true);
          setMsg(`Nomor ISBN ${clean} berhasil ditempel ke formulir. Metadata online belum ditemukan, silakan ketik Judul & Penulis manual.`);
          playBeep(true);
          return;
        }

        playBeep(true);
        onFetch({
          judul: res.data.judul,
          penulis: res.data.penulis,
          cover_url: res.data.cover_url,
          kategori: res.data.kategori,
          klasifikasi: res.data.klasifikasi,
        });

        setOk(true);
        setMsg(
          res.data.judul
            ? `[${res.source}] Ditemukan: ${res.data.judul} - ${res.data.penulis}`
            : "Metadata buku berhasil ditemukan!"
        );
      } catch {
        // Fallback: tetap isi ISBN ke input form
        const formIsbn = document.querySelector<HTMLInputElement>('input[name="isbn"]');
        if (formIsbn) formIsbn.value = clean;
        const formKode = document.querySelector<HTMLInputElement>('input[name="kode_buku"]');
        if (formKode && !formKode.value) formKode.value = clean;

        setOk(true);
        setMsg(`Nomor ISBN ${clean} ditempel ke formulir. Koneksi katalog online bermasalah, silakan isi manual.`);
        playBeep(true);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
        // Kembalikan fokus ke input setelah scan
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    },
    [onFetch]
  );

  // Auto-focus input on mount for physical scanner guns
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
          const html5QrCode = new Html5Qrcode("isbn-camera-scanner-box", {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          });
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 12,
              qrbox: { width: 280, height: 140 }, // Wide box for horizontal 1D barcode
              aspectRatio: 1.333,
            },
            (decodedText) => {
              if (decodedText && !isFetchingRef.current) {
                executeFetch(decodedText);
                if (scannerRef.current) {
                  scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                    scannerRef.current = null;
                    setCameraActive(false);
                  }).catch(() => {});
                }
              }
            },
            () => {}
          );
        } catch (err) {
          console.error("Kamera gagal diaktifkan:", err);
          alert("Gagal mengakses kamera. Pastikan izin akses kamera telah diizinkan.");
          setCameraActive(false);
        }
      }, 100);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/40 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950 border-2 border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header Info with Ready Indicator for Scanner Gun */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-blue-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Barcode className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Scan Kode Batang / ISBN (Mesin Scanner Laser)
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Alat Scanner Siap: Tinggal tembak garis kode batang di belakang buku
            </span>
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

      {/* Camera Live Scanner Box (Optional Alternative) */}
      {cameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-blue-500/40 shadow-xl p-2 animate-in fade-in duration-200">
          <div id="isbn-camera-scanner-box" className="w-full max-h-[260px] rounded-xl overflow-hidden" />
          <div className="p-2 text-center text-xs text-slate-200 bg-slate-950/90 rounded-b-xl border-t border-slate-800 mt-2 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>Arahkan kamera horizontal ke Garis Kode Batang (Barcode ISBN) di buku...</span>
          </div>
        </div>
      )}

      {/* Main Barcode Scanner Input */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Barcode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <input
              ref={inputRef}
              value={isbn}
              onChange={(e) => {
                const val = e.target.value;
                setIsbn(val);
                // Jika scanner mesin menembakkan barcode lengkap (13 digit ISBN), auto fetch langsung
                const clean = val.trim().replace(/[-\s]/g, "");
                if (clean.length === 13 && !isFetchingRef.current) {
                  executeFetch(clean);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  executeFetch(isbn);
                }
              }}
              placeholder="Arahkan scanner tembak ke sini / ketik nomor ISBN (cth: 9786025612367)…"
              className="w-full h-12 pl-11 pr-4 font-mono font-bold tracking-wide border-2 border-blue-300 dark:border-blue-700/80 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/80 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
              autoComplete="off"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={() => executeFetch(isbn)}
            disabled={loading || !isbn.trim()}
            className="shrink-0 h-12 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{loading ? "Mencari…" : "Ambil Data"}</span>
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span>Mesin scanner laser akan langsung mengisi &amp; mengambil judul/penulis otomatis saat pelatuk ditekan.</span>
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            Klik di sini jika scanner tidak merespons
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 font-semibold border ${
            ok
              ? "bg-blue-100/70 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200"
              : "bg-rose-100/70 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
          }`}
        >
          {ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" /> : <Loader2 className="w-4 h-4 shrink-0 text-rose-500" />}
          <span>{msg}</span>
        </div>
      )}
    </div>
  );
}
