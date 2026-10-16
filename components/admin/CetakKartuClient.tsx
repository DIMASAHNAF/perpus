"use client";

import { useState, useRef, useEffect } from "react";
import { getAnggotaForKartu } from "@/actions/anggota";
import { scanAnggota } from "@/actions/eksemplar";
import { LABEL_SIZES, printWithPageSize } from "@/lib/label";
import {
  Search,
  Printer,
  Download,
  User,
  CheckCircle2,
  Loader2,
  CreditCard,
  BookOpen,
} from "lucide-react";
import bwipjs from "bwip-js";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

type AnggotaInfo = {
  id: string;
  no_anggota: string;
  nama: string;
  jenis: string;
  nisn: string | null;
  kelas: string | null;
};

type ModePrint = "KEDUA" | "DEPAN" | "BELAKANG";

export function CetakKartuClient() {
  const [query, setQuery] = useState("");
  const [anggota, setAnggota] = useState<AnggotaInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [barcodeUrl, setBarcodeUrl] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [modeCetak, setModeCetak] = useState<ModePrint>("KEDUA");

  const inputRef = useRef<HTMLInputElement>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Generate barcode dan QR code image data URL ketika anggota berubah
  useEffect(() => {
    if (!anggota?.no_anggota) {
      setBarcodeUrl("");
      setQrCodeUrl("");
      return;
    }

    try {
      // 1. Generate Barcode Code128 (Jelas & Lebih Besar)
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
      setBarcodeUrl(canvasBarcode.toDataURL("image/png"));

      // 2. Generate QR Code
      const canvasQR = document.createElement("canvas");
      bwipjs.toCanvas(canvasQR, {
        bcid: "qrcode",
        text: anggota.no_anggota,
        scale: 4,
        paddingleft: 0,
        paddingright: 0,
        backgroundcolor: "ffffff",
      });
      setQrCodeUrl(canvasQR.toDataURL("image/png"));
    } catch (e) {
      console.error("Gagal generate barcode/QR:", e);
    }
  }, [anggota?.no_anggota]);

  const cari = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || busy) return;

    setBusy(true);
    setErr(null);
    try {
      const data = await getAnggotaForKartu(q);
      if (data) {
        setAnggota(data);
      } else {
        const res = await scanAnggota(q);
        if (res.ok && (res as any).anggota) {
          setAnggota((res as any).anggota);
        } else {
          setAnggota(null);
          setErr(res.pesan || `Anggota "${q}" tidak ditemukan`);
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal mencari anggota");
    } finally {
      setBusy(false);
    }
  };

  // Cetak via browser print dialog dengan page size KTP
  const cetak = (mode: ModePrint = "KEDUA") => {
    setModeCetak(mode);
    setTimeout(() => {
      printWithPageSize(LABEL_SIZES.kartu.width, LABEL_SIZES.kartu.height);
    }, 50);
  };

  // Unduh file PDF presisi ukuran KTP (85.6 × 54 mm)
  const unduhPdf = async (mode: ModePrint = "KEDUA") => {
    if (!anggota) return;

    setDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54],
        compress: true,
      });

      if (mode === "DEPAN" || mode === "KEDUA") {
        if (!frontCardRef.current) throw new Error("Elemen kartu depan tidak ditemukan");
        const frontDataUrl = await toPng(frontCardRef.current, {
          pixelRatio: 4,
          cacheBust: true,
          backgroundColor: "#ffffff",
        });
        pdf.addImage(frontDataUrl, "PNG", 0, 0, 85.6, 54, undefined, "FAST");
      }

      if (mode === "BELAKANG" || mode === "KEDUA") {
        if (!backCardRef.current) throw new Error("Elemen kartu belakang tidak ditemukan");
        const backDataUrl = await toPng(backCardRef.current, {
          pixelRatio: 4,
          cacheBust: true,
          backgroundColor: "#ffffff",
        });

        if (mode === "KEDUA") {
          // Tambah halaman kedua untuk sisi belakang
          pdf.addPage([85.6, 54], "landscape");
          pdf.addImage(backDataUrl, "PNG", 0, 0, 85.6, 54, undefined, "FAST");
        } else {
          pdf.addImage(backDataUrl, "PNG", 0, 0, 85.6, 54, undefined, "FAST");
        }
      }

      const suffix =
        mode === "KEDUA" ? "Depan-Belakang" : mode === "DEPAN" ? "Depan" : "Belakang";
      pdf.save(`Kartu-Anggota-${anggota.no_anggota}-${suffix}.pdf`);
    } catch (e: any) {
      console.error("Gagal membuat file PDF:", e);
      alert(
        `Gagal membuat file PDF: ${e?.message || e}. Anda juga dapat menggunakan opsi 'Cetak via Browser'.`
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* UI normal — disembunyikan saat print */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-6 print-hidden items-start">
        {/* Panel pencarian & tombol aksi */}
        <div className="space-y-5">
          <form onSubmit={cari} className="relative">
            <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/80 p-3 shadow-xl focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={busy}
                placeholder="No anggota (A0005) / NISN / Nama…"
                className="flex-1 h-10 font-mono tracking-wider bg-transparent focus:outline-none disabled:opacity-50 text-white placeholder:text-slate-500 text-sm"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={busy || !query}
                className="shrink-0 h-9 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              >
                {busy ? "…" : "Cari"}
              </button>
            </div>
          </form>

          {err && (
            <div className="flex items-start gap-2 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm">
              <span className="font-medium">{err}</span>
            </div>
          )}

          {anggota && (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                  {anggota.nama.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white truncate">{anggota.nama}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    <span className="text-emerald-400 font-bold">{anggota.no_anggota}</span> · {anggota.jenis}
                    {anggota.kelas ? ` · ${anggota.kelas}` : ""}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>

              {/* Tombol Unduh PDF */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Download File PDF (Ukuran Standar KTP)
                </p>

                {/* 1. Unduh PDF Lengkap (Depan & Belakang) */}
                <button
                  type="button"
                  onClick={() => unduhPdf("KEDUA")}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membuat PDF KTP…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Unduh PDF (Depan &amp; Belakang)
                    </>
                  )}
                </button>

                {/* 2. Unduh per sisi */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => unduhPdf("DEPAN")}
                    disabled={downloading}
                    className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Unduh Depan
                  </button>
                  <button
                    type="button"
                    onClick={() => unduhPdf("BELAKANG")}
                    disabled={downloading}
                    className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    Unduh Belakang
                  </button>
                </div>
              </div>

              {/* Tombol Cetak Browser */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Cetak via Browser / Printer PVC Fisik
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => cetak("KEDUA")}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    Bolak-Balik
                  </button>
                  <button
                    type="button"
                    onClick={() => cetak("DEPAN")}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-400" />
                    Depan
                  </button>
                  <button
                    type="button"
                    onClick={() => cetak("BELAKANG")}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-400" />
                    Belakang
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 space-y-1">
                <p className="font-semibold text-slate-200">Dimensi Standar KTP (ISO/IEC 7810 ID-1):</p>
                <p className="text-slate-300">
                  Ukuran: <strong className="text-white">85.6 mm × 54.0 mm</strong> (Rasio 1.585)
                </p>
                <p className="text-slate-500">
                  Dilengkapi Watermark Logo Sekolah &amp; format presisi siap cetak di kartu PVC / printer kartu ID.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview kartu di layar: MENAMPILKAN SISI DEPAN DAN SISI BELAKANG BERDAMPINGAN SECARA LANGSUNG */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[460px] shadow-xl">
          {anggota ? (
            <div className="space-y-6 flex flex-col items-center w-full">
              {/* Header Info Preview */}
              <div className="flex items-center justify-between w-full px-2 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Preview Kartu Anggota (Ukuran Presisi KTP 85.6 × 54 mm)
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Watermark Logo Sekolah Aktif
                </span>
              </div>

              {/* TAMPILAN SISI DEPAN DAN SISI BELAKANG BERSANDINGAN LANGSUNG */}
              <div className="flex flex-wrap xl:flex-nowrap items-center justify-center gap-6 w-full">
                {/* 1. SISI DEPAN */}
                <div className="flex flex-col items-center gap-2.5">
                  <div ref={frontCardRef}>
                    <KartuDepan
                      a={anggota}
                      barcodeUrl={barcodeUrl}
                      qrCodeUrl={qrCodeUrl}
                      isPreview={true}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-slate-700 shadow-md">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Sisi Depan (Identitas, QR &amp; Barcode)
                  </span>
                </div>

                {/* 2. SISI BELAKANG */}
                <div className="flex flex-col items-center gap-2.5">
                  <div ref={backCardRef}>
                    <KartuBelakang isPreview={true} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-slate-700 shadow-md">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                    Sisi Belakang (Tata Tertib Perpustakaan)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 shadow-md flex items-center justify-center mx-auto mb-3 text-slate-400">
                <User className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white">
                Cari anggota untuk menampilkan preview kartu
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ketik nomor anggota (mis. <strong className="text-emerald-400">A0005</strong>), NISN, atau nama lengkap
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print-only area — dicetak di browser */}
      {anggota && (
        <div className="print-area">
          {(modeCetak === "DEPAN" || modeCetak === "KEDUA") && (
            <div
              style={
                modeCetak === "KEDUA"
                  ? { pageBreakAfter: "always", breakAfter: "page" }
                  : undefined
              }
            >
              <KartuDepan
                a={anggota}
                barcodeUrl={barcodeUrl}
                qrCodeUrl={qrCodeUrl}
                isPreview={false}
              />
            </div>
          )}

          {(modeCetak === "BELAKANG" || modeCetak === "KEDUA") && (
            <div>
              <KartuBelakang isPreview={false} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

/**
 * 1. SISI DEPAN:
 * Kartu Anggota Fisik Standar KTP (ISO/IEC 7810 ID-1 = 85.6 × 54 mm).
 * - Header Biru-Navy Elegan dengan Logo Sekolah & Kolaborasi
 * - Background Watermark Logo Sekolah Transparan
 * - Body: Nama, No Anggota, Status/Kelas, QR Code Kios & Barcode Code128
 * - Footer: Identitas Perpustakaan & Himbauan
 */
function KartuDepan({
  a,
  barcodeUrl,
  qrCodeUrl,
  isPreview = false,
}: {
  a: AnggotaInfo;
  barcodeUrl: string;
  qrCodeUrl?: string;
  isPreview?: boolean;
}) {
  return (
    <div
      className={`${
        isPreview
          ? "w-[340px] h-[214.5px] rounded-2xl shadow-2xl border border-slate-300"
          : "w-[85.6mm] h-[54mm] rounded-xl border border-slate-300"
      } bg-white overflow-hidden flex flex-col justify-between text-slate-900 select-none box-border relative`}
      style={{
        boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Background Watermark Logo Sekolah (Tegak Lurus & Simetris) */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0"
        aria-hidden="true"
      >
        <img
          src="/assets/logo.png"
          alt="Watermark Logo Sekolah"
          className="w-32 h-32 object-contain opacity-[0.09]"
          style={{
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        />
      </div>

      {/* Header Elegan dengan Gradien Biru-Emerald */}
      <div
        className="px-3 py-1.5 flex items-center justify-between shrink-0 relative z-10"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0d9488 100%)",
          backgroundColor: "#1e3a8a",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/15 ring-1 ring-white/30 flex items-center justify-center p-0.5 shrink-0 backdrop-blur-xs">
            <img
              src="/assets/logo.png"
              alt="Logo SMKN 1 Beringin"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="leading-none">
            <p className="font-extrabold text-[9px] sm:text-[9.5px] tracking-wide text-white uppercase drop-shadow-xs">
              SMK NEGERI 1 BERINGIN
            </p>
            <p className="text-emerald-300 font-bold text-[6.5px] sm:text-[7px] tracking-wider uppercase mt-0.5">
              PERPUSTAKAAN DIGITAL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src="/assets/logo-kolaborasi.png"
            alt="Logo Kolaborasi Sumut Berkah"
            className="h-4.5 w-auto object-contain brightness-0 invert opacity-90 shrink-0"
          />
          <span 
            className="px-1.5 py-0.5 rounded text-[6.5px] font-black tracking-wider text-slate-950 uppercase"
            style={{
              backgroundColor: "#34d399",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            KARTU ANGGOTA
          </span>
        </div>
      </div>

      {/* Body Kartu (Tata Letak Rapih: Data Anggota + Barcode + QR Code) */}
      <div className="flex-1 flex items-center justify-between px-3.5 py-1.5 gap-2 relative z-10">
        {/* Kolom Kiri: Detail Anggota */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
          <div className="space-y-0.5">
            <span className="text-[6.5px] uppercase font-bold text-slate-400 tracking-wider block">
              Nama Anggota
            </span>
            <h2 className="font-extrabold text-[12px] sm:text-[13px] text-slate-900 leading-tight truncate">
              {a.nama}
            </h2>

            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span 
                className="font-mono font-black text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded leading-none"
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#0369a1",
                  border: "1px solid #bae6fd",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                {a.no_anggota}
              </span>
              <span 
                className="text-[7.5px] font-bold px-1.5 py-0.5 rounded leading-none"
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                {a.jenis}
              </span>
              {a.kelas && (
                <span 
                  className="text-[7.5px] font-bold px-1.5 py-0.5 rounded leading-none"
                  style={{
                    backgroundColor: "#ecfdf5",
                    color: "#047857",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  {a.kelas}
                </span>
              )}
            </div>

            {a.nisn && (
              <p className="font-mono text-[7px] text-slate-500 pt-0.5 leading-tight">
                NISN: <strong className="text-slate-700">{a.nisn}</strong>
              </p>
            )}
          </div>

          {/* Barcode Frame yang Jelas & Lebih Besar */}
          <div 
            className="mt-1 inline-flex flex-col items-center justify-center p-1.5 px-3 rounded-xl shadow-xs w-fit"
            style={{
              backgroundColor: "#ffffff",
              border: "1.5px solid #64748b",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            {barcodeUrl ? (
              <img
                src={barcodeUrl}
                alt={`Barcode ${a.no_anggota}`}
                className="h-8 sm:h-9.5 w-auto max-w-[165px] object-contain"
              />
            ) : (
              <div className="h-8 w-32 bg-slate-100 animate-pulse rounded" />
            )}
            <span className="text-[7px] sm:text-[8px] font-mono font-black text-slate-900 tracking-widest leading-none mt-1">
              {a.no_anggota}
            </span>
          </div>
        </div>

        {/* Kolom Kanan: QR Code untuk Scan Cepat Kiosk */}
        <div 
          className="shrink-0 flex flex-col items-center justify-center p-1.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR Code ${a.no_anggota}`}
              className="w-13 h-13 sm:w-15 sm:h-15 object-contain"
            />
          ) : (
            <div className="w-14 h-14 bg-slate-100 animate-pulse rounded" />
          )}
          <span className="text-[6px] font-mono font-extrabold text-slate-600 mt-0.5 uppercase tracking-wide">
            SCAN KIOSK
          </span>
        </div>
      </div>

      {/* Footer Bawah */}
      <div
        className="px-3 py-1 border-t border-slate-200 shrink-0 relative z-10 flex items-center justify-between"
        style={{
          backgroundColor: "#f8fafc",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <p className="text-[6px] sm:text-[6.5px] text-slate-500 leading-tight">
          Kartu sah anggota perpustakaan. Wajib dibawa saat berkunjung / meminjam.
        </p>
        <p className="text-[6px] font-mono text-emerald-700 font-bold">
          STATUS: AKTIF
        </p>
      </div>
    </div>
  );
}

/**
 * 2. SISI BELAKANG:
 * Tata Tertib & Ketentuan Penggunaan Kartu Perpustakaan SMK Negeri 1 Beringin.
 * Berukuran sama presisi KTP (85.6 × 54 mm).
 */
function KartuBelakang({ isPreview = false }: { isPreview?: boolean }) {
  const tahunIni = new Date().getFullYear();

  return (
    <div
      className={`${
        isPreview
          ? "w-[340px] h-[214.5px] rounded-2xl shadow-2xl border border-slate-300"
          : "w-[85.6mm] h-[54mm] rounded-xl border border-slate-300"
      } bg-white overflow-hidden flex flex-col justify-between text-slate-900 select-none box-border relative`}
      style={{
        boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Background Watermark Logo Sekolah (Tegak Lurus & Simetris) */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0"
        aria-hidden="true"
      >
        <img
          src="/assets/logo.png"
          alt="Watermark Logo Sekolah"
          className="w-32 h-32 object-contain opacity-[0.09]"
          style={{
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        />
      </div>

      {/* Header Sisi Belakang */}
      <div
        className="px-3 py-1.5 flex items-center justify-between shrink-0 relative z-10"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0d9488 100%)",
          backgroundColor: "#1e3a8a",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div className="flex items-center gap-1.5">
          <img
            src="/assets/logo.png"
            alt="Logo SMKN 1 Beringin"
            className="w-4 h-4 object-contain rounded bg-white/20 p-0.5 shrink-0"
          />
          <p className="font-extrabold text-[9px] sm:text-[9.5px] tracking-wide leading-tight text-white uppercase">
            TATA TERTIB PERPUSTAKAAN
          </p>
        </div>
        <p className="text-emerald-300 font-bold text-[7px] sm:text-[7.5px] uppercase tracking-wider">
          SMKN 1 BERINGIN
        </p>
      </div>

      {/* Body: 5 Poin Tata Tertib & Ketentuan */}
      <div className="flex-1 px-3.5 py-1.5 flex flex-col justify-around text-slate-800 relative z-10">
        <ol className="space-y-1 text-[7px] sm:text-[7.5px] leading-tight list-none">
          <li className="flex items-start gap-1.5">
            <span 
              className="font-bold text-[6.5px] px-1 rounded shrink-0 leading-tight"
              style={{
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              1
            </span>
            <span>Kartu ini adalah bukti keanggotaan sah dan wajib dibawa setiap berkunjung/meminjam.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span 
              className="font-bold text-[6.5px] px-1 rounded shrink-0 leading-tight"
              style={{
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              2
            </span>
            <span>Kartu tidak boleh dipindahtangankan atau digunakan oleh orang lain.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span 
              className="font-bold text-[6.5px] px-1 rounded shrink-0 leading-tight"
              style={{
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              3
            </span>
            <span>Peminjam bertanggung jawab penuh atas keutuhan dan kebersihan koleksi buku.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span 
              className="font-bold text-[6.5px] px-1 rounded shrink-0 leading-tight"
              style={{
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              4
            </span>
            <span>Keterlambatan pengembalian buku dikenakan sanksi/denda sesuai peraturan sekolah.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span 
              className="font-bold text-[6.5px] px-1 rounded shrink-0 leading-tight"
              style={{
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              5
            </span>
            <span>Apabila kartu hilang atau rusak, segera melapor kepada staf perpustakaan.</span>
          </li>
        </ol>
      </div>

      {/* Footer Sisi Belakang: Kontak & Kolom Pengesahan */}
      <div
        className="px-3.5 py-1 border-t border-slate-200 flex items-center justify-between shrink-0 relative z-10"
        style={{
          backgroundColor: "#f8fafc",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div className="text-[6px] sm:text-[6.5px] text-slate-500 leading-tight">
          <p className="font-bold text-slate-700">Perpustakaan SMK Negeri 1 Beringin</p>
          <p>Kec. Beringin, Kab. Deli Serdang, Sumut</p>
          <p className="text-teal-700 font-mono">perpustakaan.smknegeri1beringin.sch.id</p>
        </div>

        <div className="text-right text-[6px] sm:text-[6.5px] text-slate-600 leading-tight">
          <p>Beringin, {tahunIni}</p>
          <p className="font-bold text-slate-800 mt-0.5">Kepala Perpustakaan,</p>
          <p className="text-slate-400 font-mono mt-0.5">( Tanda Tangan / Stempel )</p>
        </div>
      </div>
    </div>
  );
}
