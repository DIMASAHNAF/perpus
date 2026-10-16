"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ScanLine,
  BookOpen,
  BookMarked,
  ShieldCheck,
  MessageCircle,
  Phone,
  Check,
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import bwipjs from "bwip-js";
import { getKartuDigitalSiswa, updateWhatsAppMandiriAction } from "@/actions/anggota";

interface AnggotaKartuData {
  id: string;
  nama: string;
  no_anggota: string;
  nisn: string | null;
  telepon?: string | null;
  kelas: string | null;
  totalBukuDipinjam: number;
  bukuDipinjam: string[];
}

interface KartuDigitalClientProps {
  initialQuery?: string;
  initialData?: any;
}

export default function KartuDigitalClient({
  initialQuery = "",
  initialData = null,
}: KartuDigitalClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnggotaKartuData | null>(initialData);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Self-Service Phone Registration State
  const [phoneInput, setPhoneInput] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaveMessage, setPhoneSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // 3D Tilt & Hologram State
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, glareOpacity: 0 });
  const [logoDataUrl, setLogoDataUrl] = useState<string>("/assets/logo.png");

  // Pre-convert logo ke Base64 dataURL agar aman dari canvas tainting saat diekspor
  useEffect(() => {
    fetch("/assets/logo.png")
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setLogoDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch((e) => console.warn("Logo prefetch warning:", e));
  }, []);

  const handleMouseMoveCard = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 12;
    const rotY = ((x - centerX) / centerX) * 12;

    setTilt({
      x: rotX,
      y: rotY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      glareOpacity: 0.85,
    });
  };

  const handleMouseLeaveCard = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, glareOpacity: 0 });
  };

  const handleTouchMoveCard = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 14;
    const rotY = ((x - centerX) / centerX) * 14;

    setTilt({
      x: rotX,
      y: rotY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      glareOpacity: 0.85,
    });
  };

  const cardRef = useRef<HTMLDivElement>(null);

  // Generate QR & Barcode when data is found
  const generateCodes = (anggota: AnggotaKartuData) => {
    try {
      // 1. Generate QR Code
      const canvasQR = document.createElement("canvas");
      bwipjs.toCanvas(canvasQR, {
        bcid: "qrcode",
        text: anggota.no_anggota,
        scale: 4,
        paddingleft: 0,
        paddingright: 0,
        backgroundcolor: "ffffff",
      });
      setQrDataUrl(canvasQR.toDataURL("image/png"));

      // 2. Generate Barcode Code128 (Jelas & Presisi)
      const canvasBarcode = document.createElement("canvas");
      bwipjs.toCanvas(canvasBarcode, {
        bcid: "code128",
        text: anggota.no_anggota,
        scale: 5,
        height: 18,
        includetext: false,
        paddingleft: 0,
        paddingright: 0,
        backgroundcolor: "ffffff",
      });
      setBarcodeDataUrl(canvasBarcode.toDataURL("image/png"));
    } catch (e) {
      console.error("Gagal generate barcode/QR:", e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setData(null);
    setQrDataUrl(null);
    setBarcodeDataUrl(null);
    setPhoneSaveMessage(null);
    setEditingPhone(false);

    try {
      const resData = await getKartuDigitalSiswa(trimmed);
      if (!resData) {
        throw new Error("Anggota dengan NISN / Nomor tersebut tidak ditemukan.");
      }

      setData(resData as any);
      setPhoneInput(resData.telepon || "");
      generateCodes(resData as any);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data kartu siswa.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !phoneInput.trim()) return;

    setSavingPhone(true);
    setPhoneSaveMessage(null);

    try {
      const res = await updateWhatsAppMandiriAction(data.no_anggota, phoneInput.trim());
      setPhoneSaveMessage({ ok: res.ok, text: res.message });
      if (res.ok && res.telepon) {
        setData((prev) => (prev ? { ...prev, telepon: res.telepon } : null));
        setEditingPhone(false);
      }
    } catch (err: any) {
      setPhoneSaveMessage({ ok: false, text: err?.message || "Gagal menyimpan nomor WhatsApp." });
    } finally {
      setSavingPhone(false);
    }
  };

  const downloadCardImage = async () => {
    if (!cardRef.current || !data) return;
    setDownloading(true);

    const cardEl = cardRef.current;
    const oldTransform = cardEl.style.transform;
    const oldTransition = cardEl.style.transition;
    const oldBoxShadow = cardEl.style.boxShadow;

    // Ratakan posisi kartu (2D datar) agar hasil ekspor gambar rapi & tidak miring
    cardEl.style.transform = "none";
    cardEl.style.transition = "none";
    cardEl.style.boxShadow = "none";

    try {
      let image = "";

      // 1. Metode utama: html-to-image (mendukung CSS modern, SVG, dan resolusi tinggi tanpa error canvas)
      try {
        const { toPng } = await import("html-to-image");
        image = await toPng(cardEl, {
          pixelRatio: 3,
          cacheBust: true,
          backgroundColor: "#020617",
          filter: (node) => {
            // Sembunyikan layer glare dinamis agar hasil kartu bersih & tajam
            if (node instanceof HTMLElement && node.classList.contains("hologram-glare")) {
              return false;
            }
            return true;
          },
        });
      } catch (errHtmlToImage) {
        console.warn("toPng html-to-image gagal, mencoba fallback html2canvas:", errHtmlToImage);
        
        // 2. Fallback: html2canvas
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(cardEl, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#020617",
          logging: false,
          ignoreElements: (element) => {
            return element.classList.contains("hologram-glare");
          },
        });
        image = canvas.toDataURL("image/png");
      }

      if (!image) {
        throw new Error("Gagal merender gambar kartu");
      }

      const filename = `Kartu-Perpustakaan-${data.no_anggota}-${data.nama.replace(/\s+/g, "_")}.png`;

      // Konversi dataURL ke Blob agar kompatibel di semua browser HP & Desktop
      const res = await fetch(image);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Unduh file langsung tanpa memunculkan dialog Share bawaan sistem operasi
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error("Gagal download gambar kartu:", err);
      alert("Gagal mengunduh gambar kartu secara otomatis. Silakan ambil screenshot kartu Anda.");
    } finally {
      // Kembalikan style 3D kartu semula
      cardEl.style.transform = oldTransform;
      cardEl.style.transition = oldTransition;
      cardEl.style.boxShadow = oldBoxShadow;
      setDownloading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 dark:bg-[#020617] dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-20 overflow-x-hidden transition-colors duration-300">
      {/* Background Soft Blue Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/20 via-sky-400/15 to-transparent blur-[120px] animate-aurora-mesh-1" />
        <div className="absolute top-[30%] -right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-blue-600/15 to-transparent blur-[130px] animate-aurora-mesh-2" />
        <div className="absolute -bottom-[15%] left-[20%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-sky-500/10 to-transparent blur-[140px] animate-aurora-mesh-3" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 px-3.5 py-1.5 rounded-xl shadow-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog Buku</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">SMK Negeri 1 Beringin</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-8 relative z-10 space-y-8">
        {/* Title Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kartu Perpustakaan Digital Siswa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Cek &amp; Simpan Kartu Anggota
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Masukkan NISN untuk memunculkan Kartu Digital dan QR Code yang dapat discan saat presensi di perpustakaan.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="relative group max-w-lg mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan NISN atau Nama Siswa..."
              className="w-full h-13 pl-11 pr-32 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-slate-200 group-hover:border-slate-300 dark:border-slate-800 dark:group-hover:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-lg transition-all"
              autoFocus
            />
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cari...</span>
                </>
              ) : (
                <span>Lihat Kartu</span>
              )}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm max-w-lg mx-auto animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
            <div>
              <p className="font-semibold text-rose-800 dark:text-rose-200">Data Tidak Ditemukan</p>
              <p className="mt-0.5 text-rose-700/90 dark:text-rose-300/90">{error}</p>
            </div>
          </div>
        )}

        {/* Digital Card Preview Container */}
        {data && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* The Actual Digital Card with 3D Holographic Perspective */}
            <div className="flex flex-col items-center">
              <div
                className="w-full max-w-[460px] cursor-pointer"
                style={{ perspective: "1000px" }}
                onMouseMove={handleMouseMoveCard}
                onMouseLeave={handleMouseLeaveCard}
                onTouchMove={handleTouchMoveCard}
                onTouchEnd={handleMouseLeaveCard}
              >
                <div
                  ref={cardRef}
                  className="relative w-full aspect-[1.586/1] rounded-[20px] sm:rounded-[22px] p-3.5 sm:p-5 md:p-6 overflow-hidden shadow-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white flex flex-col justify-between select-none"
                  style={{
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${tilt.glareOpacity > 0 ? 1.02 : 1}, ${tilt.glareOpacity > 0 ? 1.02 : 1}, 1)`,
                    transition: tilt.glareOpacity === 0 ? "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)" : "transform 0.08s ease-out",
                    transformStyle: "preserve-3d",
                    boxShadow: tilt.glareOpacity > 0 
                      ? "0 35px 65px -15px rgba(37, 99, 235, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)"
                      : "0 20px 50px -10px rgba(37, 99, 235, 0.25), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {/* Holographic Rainbow Foil Layer */}
                  <div
                    className="hologram-glare pointer-events-none absolute inset-0 z-30 rounded-[20px] sm:rounded-[22px] transition-opacity duration-300"
                    style={{
                      opacity: tilt.glareOpacity,
                      background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,215,0,0.25) 25%, rgba(0,255,255,0.3) 45%, rgba(255,0,128,0.25) 65%, transparent 80%)`,
                      mixBlendMode: "color-dodge",
                    }}
                  />
                  {/* Hologram Diagonal Spectrum */}
                  <div
                    className="hologram-glare pointer-events-none absolute inset-0 z-30 rounded-[20px] sm:rounded-[22px] opacity-30 mix-blend-overlay"
                    style={{
                      background: `linear-gradient(${115 + tilt.y * 2}deg, transparent 15%, rgba(255,0,128,0.35) 35%, rgba(0,255,255,0.45) 50%, rgba(255,215,0,0.4) 65%, transparent 85%)`,
                    }}
                  />

                  {/* Decorative Hologram / Mesh Accents */}
                  <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

                  {/* Card Top Header */}
                  <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2 sm:pb-3">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/95 border border-white/40 p-0.5 sm:p-1 flex items-center justify-center shadow-md shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoDataUrl}
                          crossOrigin="anonymous"
                          alt="Logo SMK Negeri 1 Beringin"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest text-blue-400">
                          SMK NEGERI 1 BERINGIN
                        </p>
                        <h2 className="text-[11px] sm:text-xs md:text-sm font-black text-white tracking-tight -mt-0.5">
                          KARTU PERPUSTAKAAN DIGITAL
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[8px] sm:text-[9px] font-bold text-blue-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span>AKTIF</span>
                    </div>
                  </div>

                  {/* Card Middle Body */}
                  <div className="relative z-10 grid grid-cols-12 gap-2 sm:gap-3 my-auto items-center">
                    {/* Left Column: Student Details */}
                    <div className="col-span-7 sm:col-span-8 space-y-1 sm:space-y-1.5">
                      <div>
                        <span className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Nama Anggota
                        </span>
                        <p className="text-xs sm:text-sm md:text-base font-extrabold text-white leading-tight line-clamp-1 sm:line-clamp-2">
                          {data.nama}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-0.5 sm:pt-1 text-[10px] sm:text-[11px]">
                        <div>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 block font-medium">NISN</span>
                          <span className="font-mono font-bold text-blue-300 text-[10px] sm:text-[11px]">{data.nisn || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 block font-medium">Kelas</span>
                          <span className="font-bold text-white text-[10px] sm:text-[11px] line-clamp-1">{data.kelas || "-"}</span>
                        </div>
                      </div>

                      <div className="pt-0.5 sm:pt-1">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 block font-medium">No. Anggota</span>
                        <span className="font-mono font-extrabold text-[11px] sm:text-xs text-white tracking-wider">
                          {data.no_anggota}
                        </span>
                      </div>

                      {/* Barcode Kode Batang */}
                      <div className="pt-0.5 sm:pt-1">
                        <div className="inline-flex flex-col items-center justify-center p-1 sm:p-1.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-white border border-slate-300 shadow-md">
                          {barcodeDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={barcodeDataUrl}
                              alt={`Barcode ${data.no_anggota}`}
                              className="h-5 sm:h-8 md:h-9 w-auto max-w-[110px] sm:max-w-[155px] object-contain"
                            />
                          ) : (
                            <div className="h-5 sm:h-8 w-24 sm:w-28 bg-slate-100 animate-pulse rounded" />
                          )}
                          <span className="text-[6.5px] sm:text-[7.5px] font-mono font-black text-slate-800 tracking-widest leading-none mt-0.5">
                            {data.no_anggota}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: QR Code Box */}
                    <div className="col-span-5 sm:col-span-4 flex flex-col items-center justify-center">
                      <div className="p-1 sm:p-1.5 bg-white rounded-lg sm:rounded-xl shadow-lg border border-white/20">
                        {qrDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrDataUrl}
                            alt={`QR Code ${data.no_anggota}`}
                            className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain"
                          />
                        ) : (
                          <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center text-slate-400">
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          </div>
                        )}
                      </div>
                      <span className="text-[7px] sm:text-[8px] font-bold text-blue-300/90 tracking-wider uppercase mt-0.5 sm:mt-1 text-center">
                        Scan Presensi
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Footer */}
                  <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-1.5 sm:pt-2 text-[8px] sm:text-[9px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                      <span>Terdaftar Resmi Perpustakaan</span>
                    </div>
                    <span className="font-mono text-[8px] sm:text-[9px] text-slate-500">
                      {data.no_anggota}
                    </span>
                  </div>
                </div>
            </div>

              {/* Holographic Tip Badge */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-[11px] font-semibold animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Geser kursor atau miringkan layar untuk efek kilau hologram 3D</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={downloadCardImage}
                disabled={downloading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Galeri...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Simpan Kartu ke Galeri HP</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(data.no_anggota);
                    alert(`Nomor Anggota "${data.no_anggota}" berhasil disalin!`);
                  }
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Salin No. Anggota</span>
              </button>
            </div>

            {/* Self-Service WhatsApp Registration Card */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Notifikasi &amp; Pengingat Buku via WhatsApp
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dapatkan pengingat gratis H-1 sebelum buku jatuh tempo &amp; bukti peminjaman langsung di WhatsApp Anda
                    </p>
                  </div>
                </div>
              </div>

              {data.telepon && !editingPhone ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-600 dark:text-slate-300">Nomor WhatsApp Anda:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">+{data.telepon}</strong>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                      Terhubung
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneInput(data.telepon || "");
                      setEditingPhone(true);
                      setPhoneSaveMessage(null);
                    }}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer text-left"
                  >
                    Ubah Nomor WhatsApp
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSavePhone} className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="tel"
                      placeholder="Masukkan No. WhatsApp Anda (Contoh: 081234567890)..."
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={savingPhone || !phoneInput.trim()}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {savingPhone ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Phone className="w-3.5 h-3.5" />
                          <span>Simpan Nomor WhatsApp</span>
                        </>
                      )}
                    </button>
                    {editingPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPhone(false);
                          setPhoneSaveMessage(null);
                        }}
                        className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Feedback toast */}
              {phoneSaveMessage && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    phoneSaveMessage.ok
                      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {phoneSaveMessage.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{phoneSaveMessage.text}</span>
                </div>
              )}
            </div>

            {/* Instructions Guide */}
            <div className="p-4 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Cara Menggunakan Kartu Ini untuk Presensi:</span>
              </h3>
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
                <li>Klik tombol <strong>&quot;Simpan Kartu ke Galeri HP&quot;</strong> atau screenshot layar kartu di atas.</li>
                <li>Saat berkunjung ke perpustakaan, buka foto kartu di galeri HP Anda.</li>
                <li>Arahkan layar HP Anda ke kamera pemindai di meja depan perpustakaan.</li>
                <li>Sistem akan berbunyi dan kehadiran Anda langsung tercatat otomatis!</li>
              </ol>
            </div>

            {/* Borrowed Books info if any */}
            {data.totalBukuDipinjam > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                  <BookMarked className="w-4 h-4" />
                  <span>Sedang Meminjam {data.totalBukuDipinjam} Buku:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-800 dark:text-amber-200/90">
                  {data.bukuDipinjam.map((judul, i) => (
                    <li key={i} className="line-clamp-1">{judul}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
