"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createKunjunganByScan, getKioskStats } from "@/actions/kunjungan";
import { speak } from "@/lib/voice";
import {
  QrCode,
  ScanLine,
  UserCheck,
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  ArrowLeft,
  BookOpen,
  BookMarked,
  GraduationCap,
  Laptop,
  Compass,
  Keyboard,
  RefreshCw,
  Award,
  Calendar,
  CreditCard,
  Send
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

type VisitorResult = {
  id: string;
  nama: string;
  kelas: string | null;
  keperluan: string | null;
  tanggal: string;
  jenis: string;
  no_anggota: string;
  nisn: string | null;
  antreanKe?: number;
};

type RecentVisitor = {
  id: string;
  nama: string;
  kelas: string | null;
  keperluan: string | null;
  tanggal: string;
};

const KEPERLUAN_OPTIONS = [
  { id: "Membaca Buku", label: "Membaca Buku", icon: BookOpen, color: "from-sky-600 to-blue-600" },
  { id: "Meminjam / Kembali Buku", label: "Pinjam / Kembali", icon: BookMarked, color: "from-blue-600 to-indigo-600" },
  { id: "Mengerjakan Tugas & Belajar", label: "Tugas & Belajar", icon: GraduationCap, color: "from-amber-500 to-orange-600" },
  { id: "Literasi Digital / Komputer", label: "Komputer & Digital", icon: Laptop, color: "from-indigo-600 to-purple-600" },
  { id: "Kunjungan Bebas", label: "Kunjungan Bebas", icon: Compass, color: "from-slate-600 to-slate-700" },
];

function playSuccessChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

function playErrorChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(160, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export default function KioskScannerClient({
  initialStats,
}: {
  initialStats: { totalHariIni: number; recentList: RecentVisitor[] };
}) {
  const [selectedKeperluan, setSelectedKeperluan] = useState("Membaca Buku");
  const [busy, setBusy] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Stats & Visitor state
  const [stats, setStats] = useState(initialStats);
  const [currentVisitor, setCurrentVisitor] = useState<VisitorResult | null>(null);
  const [bannerStatus, setBannerStatus] = useState<{
    type: "SUCCESS" | "DUPLICATE" | "ERROR";
    message: string;
  } | null>(null);

  // Auto countdown for reset
  const [countdown, setCountdown] = useState<number>(0);

  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const lastScannedCodeRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Clock ticker
  useEffect(() => {
    setCurrentTime(new Date());
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fullscreen state sync
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Process Scanned Code
  const processCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed || isProcessingRef.current) return;

      // Debounce scanner 2.5 detik untuk barcode yang sama
      const now = Date.now();
      if (
        lastScannedCodeRef.current.code === trimmed &&
        now - lastScannedCodeRef.current.time < 2500
      ) {
        return;
      }

      lastScannedCodeRef.current = { code: trimmed, time: now };
      isProcessingRef.current = true;
      setBusy(true);

      try {
        const res = await createKunjunganByScan(trimmed, selectedKeperluan);

        if (res.ok && res.kunjungan) {
          playSuccessChime();
          const visitor = res.kunjungan;
          setCurrentVisitor(visitor);
          setBannerStatus({
            type: "SUCCESS",
            message: res.pesan,
          });

          // Broadcast ke tab admin secara instan tanpa delay
          try {
            const bc = new BroadcastChannel("perpus_kiosk_scan");
            bc.postMessage({ type: "NEW_SCAN", visitor });
            bc.close();
          } catch {}

          if (!muted) {
            const salam = `Selamat datang ${visitor.nama}${visitor.kelas ? " dari kelas " + visitor.kelas : ""}. Presensi kunjungan berhasil dicatat.`;
            speak(salam);
          }

          // Update stats live
          const updatedStats = await getKioskStats();
          setStats(updatedStats);

          // Start 4-second auto countdown
          setCountdown(4);
        } else {
          playErrorChime();
          if ((res as any).isDuplicate) {
            setBannerStatus({
              type: "DUPLICATE",
              message: res.pesan,
            });
            if (!muted) speak(`${(res as any).pengunjung?.nama || "Pengunjung"} sudah tercatat berkunjung.`);
          } else {
            setBannerStatus({
              type: "ERROR",
              message: res.pesan,
            });
            if (!muted) speak("Kartu tidak terdaftar.");
          }
          setCountdown(4);
        }
      } catch (err: any) {
        playErrorChime();
        setBannerStatus({
          type: "ERROR",
          message: err?.message || "Terjadi kesalahan saat mencatat kunjungan.",
        });
        setCountdown(4);
      } finally {
        setBusy(false);
        isProcessingRef.current = false;
        setManualInput("");
      }
    },
    [selectedKeperluan, muted]
  );

  // Countdown auto-dismiss handler
  useEffect(() => {
    if (countdown <= 0) {
      if (currentVisitor || bannerStatus) {
        setCurrentVisitor(null);
        setBannerStatus(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, currentVisitor, bannerStatus]);

  // Listen for scans processed in background tabs (e.g. Tab 1 Admin)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("perpus_kiosk_scan");
      bc.onmessage = async (e) => {
        if (e.data?.type === "NEW_SCAN" && e.data?.visitor) {
          const visitor = e.data.visitor;
          setCurrentVisitor(visitor);
          setBannerStatus({
            type: "SUCCESS",
            message: `Presensi berhasil dicatat! Selamat datang di perpustakaan, ${visitor.nama}.`,
          });
          playSuccessChime();
          if (!muted) {
            const salam = `Selamat datang ${visitor.nama}${visitor.kelas ? " dari kelas " + visitor.kelas : ""}. Presensi kunjungan berhasil dicatat.`;
            speak(salam);
          }
          try {
            const updatedStats = await getKioskStats();
            setStats(updatedStats);
          } catch {}
          setCountdown(4);
        }
      };
    } catch {}

    return () => {
      try {
        bc?.close();
      } catch {}
    };
  }, [muted]);

  // USB Barcode Scanner / HID Keyboard listener (Global Keystrokes)
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika user sedang mengetik di input manual yang aktif
      if (document.activeElement === manualInputRef.current) return;

      const now = Date.now();
      // Reset buffer jika delay antar tombol > 300ms (artinya ketik manual lambat)
      if (now - lastKeyTime > 300) {
        buffer = "";
      }
      lastKeyTime = now;

      if (e.key === "Enter") {
        // SELALU cegah aksi default tombol Enter agar tidak mengklik link/tombol yang sedang terfokus
        e.preventDefault();
        e.stopPropagation();
        if (buffer.length >= 3) {
          processCode(buffer);
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processCode]);

  // Initialize html5-qrcode Camera Scanner
  useEffect(() => {
    let html5QrCode: any = null;
    let isMounted = true;

    if (cameraActive) {
      setCameraError(null);
      import("html5-qrcode")
        .then(({ Html5Qrcode }) => {
          if (!isMounted) return;

          const readerElem = document.getElementById("kiosk-qr-reader");
          if (!readerElem) return;

          html5QrCode = new Html5Qrcode("kiosk-qr-reader");
          scannerRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          };

          html5QrCode
            .start(
              { facingMode: "environment" },
              config,
              (decodedText: string) => {
                processCode(decodedText);
              },
              () => {
                // Ignore frame parse error
              }
            )
            .catch((err: any) => {
              console.warn("Camera init error:", err);
              if (isMounted) {
                setCameraError(
                  "Kamera tidak dapat diakses atau izin belum diberikan. Anda tetap bisa menggunakan Barcode Scanner USB / Ketik Manual."
                );
              }
            });
        })
        .catch((e) => {
          console.error("Failed to load html5-qrcode:", e);
        });
    }

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [cameraActive, processCode]);

  // Handle Manual Form Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processCode(manualInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Background Glowing Soft Blue Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/20 via-sky-400/15 to-transparent blur-[120px] animate-aurora-mesh-1" />
        <div className="absolute top-[30%] -right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-blue-600/15 to-transparent blur-[130px] animate-aurora-mesh-2" />
        <div className="absolute -bottom-[15%] left-[20%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-sky-500/10 to-transparent blur-[140px] animate-aurora-mesh-3" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            tabIndex={-1}
            onFocus={(e) => e.currentTarget.blur()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700/60 flex items-center gap-1.5 text-xs font-semibold"
            title="Kembali ke Katalog"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Katalog</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <img
              src="/assets/logo.png"
              alt="Logo SMK Negeri 1 Beringin"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-contain bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 p-1 shrink-0"
            />
            <img
              src="/assets/logo-kolaborasi.png"
              alt="Logo Kolaborasi Sumut Berkah"
              className="h-8 sm:h-10 w-auto object-contain shrink-0"
            />
            <div className="border-l border-slate-200 dark:border-slate-700 pl-3 ml-1">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Presensi Pengunjung Mandiri
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  KIOSK LIVE
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block">
                Perpustakaan SMK Negeri 1 Beringin
              </p>
            </div>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {currentTime && (
            <div className="hidden md:flex flex-col items-end pr-3 border-r border-slate-200 dark:border-slate-800">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-widest font-mono">
                {currentTime.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                WIB
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          <Link
            href="/kartu"
            target="_blank"
            tabIndex={-1}
            onFocus={(e) => e.currentTarget.blur()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all cursor-pointer"
            title="Cek atau download QR Code kartu anggota di HP"
          >
            <CreditCard className="w-4 h-4" />
            <span>Kartu Siswa</span>
          </Link>

          <button
            onClick={() => setMuted(!muted)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              muted
                ? "bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
            title={muted ? "Nyalakan Suara" : "Matikan Suara"}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (Kiosk Mode)"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Kiosk Viewport */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left Column: Scanner Box & Purpose Selection */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Keperluan / Tujuan Kunjungan Selector */}
          <div className="bg-white/80 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm dark:shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Pilih Keperluan Kunjungan Sebelum Scan:
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Ketuk salah satu tombol di bawah
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {KEPERLUAN_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedKeperluan === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedKeperluan(item.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer flex flex-col justify-between gap-1.5 active:scale-95 ${
                      isSelected
                        ? `bg-gradient-to-br ${item.color} text-white border-white/30 shadow-md ring-2 ring-blue-500/40`
                        : "bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-white/90">
                        ✓ Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scanner Interactive Box */}
          <div className="bg-white/80 dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm dark:shadow-2xl backdrop-blur-md flex-1 flex flex-col relative overflow-hidden">
            {/* Header Box */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center">
                  <ScanLine className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Area Pemindaian QR Code &amp; Barcode
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Arahkan QR Code kartu atau gunakan Barcode Scanner fisik
                  </p>
                </div>
              </div>

              {/* Toggle Camera Button */}
              <button
                type="button"
                onClick={() => setCameraActive(!cameraActive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  cameraActive
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-300 hover:bg-blue-500/25"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {cameraActive ? (
                  <>
                    <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Kamera Aktif</span>
                  </>
                ) : (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Aktifkan Kamera</span>
                  </>
                )}
              </button>
            </div>

            {/* Camera / Visual Viewport */}
            <div className="relative flex-1 min-h-[300px] bg-slate-100 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center overflow-hidden">
              {cameraActive ? (
                <>
                  <div id="kiosk-qr-reader" className="w-full h-full object-cover" />
                  
                  {/* Glowing Target Crosshair Overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-sky-400/40 dark:border-sky-400/30 rounded-3xl relative shadow-[0_0_35px_rgba(2,132,199,0.35)] overflow-hidden">
                      {/* Corner Accents */}
                      <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sky-500 dark:border-sky-400 rounded-tl-2xl" />
                      <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sky-500 dark:border-sky-400 rounded-tr-2xl" />
                      <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sky-500 dark:border-sky-400 rounded-bl-2xl" />
                      <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sky-500 dark:border-sky-400 rounded-br-2xl" />
                      
                      {/* Laser Scanner animation line */}
                      <div className="animate-laser" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    {/* Glowing pulse rings */}
                    <div className="absolute inset-0 rounded-3xl bg-blue-500/20 animate-ping opacity-50" />
                    <div className="absolute -inset-2 rounded-3xl bg-blue-500/10 animate-pulse" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 border border-blue-400/40">
                      <ScanLine className="w-10 h-10 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                      Mesin Scanner Meja Siap
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Silakan dekatkan kartu anggota (<strong className="text-blue-600 dark:text-blue-400">Kode Batang / Barcode</strong> atau <strong className="text-sky-600 dark:text-sky-400">QR Code</strong>) ke arah sensor mesin scanner di meja.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Sensor USB HID Aktif · Tanpa Perlu Klik
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-2 z-10 backdrop-blur-xs">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                  <p className="text-xs text-amber-700 dark:text-amber-200 max-w-md">{cameraError}</p>
                  <button
                    onClick={() => setCameraActive(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white mt-2 cursor-pointer"
                  >
                    Coba Hubungkan Ulang Kamera
                  </button>
                </div>
              )}

              {/* Processing Overlay */}
              {busy && (
                <div className="absolute inset-0 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
                  <RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                    Memverifikasi &amp; Mencatat Presensi...
                  </span>
                </div>
              )}
            </div>

            {/* Manual Input Bar */}
            <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Ketik No. Anggota / NISN lalu tekan Enter..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono shadow-xs"
                />
                <Keyboard className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim() || busy}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 active:scale-95 disabled:bg-none disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border border-transparent disabled:border-slate-300 dark:disabled:border-slate-700"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Kirim Presensi</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Result Banner & Recent Visitors List */}
        <div className="w-full lg:w-96 flex flex-col gap-5">
          {/* Welcome Card / Result Popup */}
          {currentVisitor ? (
            <div className="bg-gradient-to-br from-blue-900/90 via-slate-900 to-cyan-950/90 rounded-3xl border-2 border-blue-500/80 p-6 shadow-2xl relative overflow-hidden animate-fade-up text-white">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Presensi Berhasil
                </span>
                {countdown > 0 && (
                  <span className="text-[11px] font-mono text-blue-300/90 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800">
                    Reset dlm {countdown}s
                  </span>
                )}
              </div>

              <div className="text-center space-y-3 py-2">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-sky-400 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-xl ring-4 ring-blue-400/30">
                  {currentVisitor.nama.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    {currentVisitor.nama}
                  </h3>
                  <p className="text-sm font-semibold text-blue-300 mt-0.5">
                    {currentVisitor.kelas || "Umum / Guru / Staf"}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-left space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. Anggota / NISN:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {currentVisitor.no_anggota || currentVisitor.nisn || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Keperluan:</span>
                    <span className="font-semibold text-sky-300">
                      {currentVisitor.keperluan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Waktu Presensi:</span>
                    <span className="font-mono text-slate-300">
                      {new Date(currentVisitor.tanggal).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </span>
                  </div>
                  {currentVisitor.antreanKe && (
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span className="text-blue-400 font-medium">Pengunjung Hari Ini:</span>
                      <span className="font-bold text-blue-300">
                        Ke-{currentVisitor.antreanKe}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Progress Countdown bar */}
              <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden mt-4">
                <div
                  className="bg-blue-400 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 4) * 100}%` }}
                />
              </div>
            </div>
          ) : bannerStatus ? (
            <div
              className={`rounded-3xl border-2 p-5 shadow-xl animate-fade-up ${
                bannerStatus.type === "DUPLICATE"
                  ? "bg-amber-950/70 border-amber-500/60 text-amber-200"
                  : "bg-rose-950/70 border-rose-500/60 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {bannerStatus.type === "DUPLICATE"
                      ? "Sudah Melakukan Presensi"
                      : "Kartu Tidak Terdaftar"}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">{bannerStatus.message}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Idle Ready Card */
            <div className="bg-white/80 dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm dark:shadow-xl backdrop-blur-md text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <QrCode className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Siap Memindai Kartu</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tunjukkan QR Code atau Barcode pada kartu anggota perpustakaan Anda ke arah kamera.
              </p>
            </div>
          )}

          {/* Today Stats Widget */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm dark:shadow-md backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-xs font-semibold">Total Hari Ini</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats.totalHariIni}
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Orang Berkunjung</span>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm dark:shadow-md backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-xs font-semibold">Keperluan Aktif</span>
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="text-xs font-bold text-blue-700 dark:text-sky-300 line-clamp-1 mt-1">
                {selectedKeperluan}
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Siap Dicatat</span>
            </div>
          </div>

          {/* Live Recent Visitors Stream */}
          <div className="bg-white/80 dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl backdrop-blur-md flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Pengunjung Terakhir
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {stats.recentList.length} tercatat
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-72">
              {stats.recentList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {item.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.nama}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.kelas || "Umum"} · {item.keperluan || "Kunjungan"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}

              {stats.recentList.length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs italic">
                  Belum ada pengunjung tercatat hari ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/90 py-3 px-4 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <span>© {new Date().getFullYear()} Sistem Perpustakaan SMK Negeri 1 Beringin</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Scanner QR &amp; Barcode Kunjungan Aktif</span>
        </div>
      </footer>
    </div>
  );
}
