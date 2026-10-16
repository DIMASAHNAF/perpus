"use client";

import { useState, useEffect } from "react";
import {
  X,
  MessageCircle,
  Send,
  ExternalLink,
  Copy,
  Check,
  Phone,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  Bell,
} from "lucide-react";
import {
  formatNomorWhatsApp,
  generatePinjamMessage,
  generatePengingatMessage,
  generateTerlambatMessage,
  generateKembaliMessage,
  createWhatsAppWebUrl,
} from "@/lib/whatsapp";
import { kirimWhatsAppAction } from "@/actions/whatsapp";

export type WhatsAppModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: {
    nama: string;
    kelas?: string | null;
    no_anggota?: string | null;
    nisn?: string | null;
    telepon?: string | null;
    judul_buku: string;
    kode_eksemplar?: string | null;
    tgl_pinjam?: string;
    batas_kembali?: string;
    hari_terlambat?: number;
    denda?: number;
    defaultType?: "TERLAMBAT" | "PENGINGAT" | "PINJAM" | "KEMBALI";
  } | null;
};

export function WhatsAppModal({ isOpen, onClose, data }: WhatsAppModalProps) {
  if (!isOpen || !data) return null;

  const [activeType, setActiveType] = useState<"TERLAMBAT" | "PENGINGAT" | "PINJAM" | "KEMBALI">(
    data.defaultType || (data.hari_terlambat && data.hari_terlambat > 0 ? "TERLAMBAT" : "PENGINGAT")
  );
  const [phoneNumber, setPhoneNumber] = useState(data.telepon || "");
  const [customMessage, setCustomMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Generate initial message based on active template
  useEffect(() => {
    let msg = "";
    const tglPinjamFormatted = data.tgl_pinjam
      ? new Date(data.tgl_pinjam).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const batasKembaliFormatted = data.batas_kembali
      ? new Date(data.batas_kembali).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    if (activeType === "TERLAMBAT") {
      msg = generateTerlambatMessage({
        nama: data.nama,
        kelas: data.kelas,
        judul_buku: data.judul_buku,
        batas_kembali: batasKembaliFormatted,
        hari_terlambat: data.hari_terlambat || 1,
        denda: data.denda || 0,
      });
    } else if (activeType === "PENGINGAT") {
      msg = generatePengingatMessage({
        nama: data.nama,
        kelas: data.kelas,
        judul_buku: data.judul_buku,
        batas_kembali: batasKembaliFormatted,
      });
    } else if (activeType === "PINJAM") {
      msg = generatePinjamMessage({
        nama: data.nama,
        kelas: data.kelas,
        no_anggota: data.no_anggota || undefined,
        judul_buku: data.judul_buku,
        kode_eksemplar: data.kode_eksemplar || undefined,
        tgl_pinjam: tglPinjamFormatted,
        batas_kembali: batasKembaliFormatted,
      });
    } else if (activeType === "KEMBALI") {
      msg = generateKembaliMessage({
        nama: data.nama,
        judul_buku: data.judul_buku,
        tgl_kembali: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        denda: data.denda || 0,
        status_denda: (data.denda || 0) > 0 ? "Lunas" : "Tidak Ada Denda",
      });
    }
    setCustomMessage(msg);
  }, [activeType, data]);

  const cleanPhone = formatNomorWhatsApp(phoneNumber);
  const waWebUrl = createWhatsAppWebUrl(phoneNumber, customMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsAppWeb = () => {
    window.open(waWebUrl, "_blank", "noopener,noreferrer");
  };

  const handleSendViaGateway = async () => {
    if (!cleanPhone) {
      setSendResult({ ok: false, message: "Harap isi nomor WhatsApp yang valid terlebih dahulu." });
      return;
    }

    setIsSending(true);
    setSendResult(null);
    try {
      const res = await kirimWhatsAppAction(cleanPhone, customMessage);
      setSendResult(res);
    } catch (err: any) {
      setSendResult({ ok: false, message: err?.message || "Gagal menghubungi server WhatsApp Gateway." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-fade-up">
        {/* Header with WhatsApp Theme Styling */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold leading-tight truncate flex items-center gap-2">
                <span>Kirim Notifikasi WhatsApp</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/40 border border-emerald-300/30 uppercase font-mono">
                  RESMI
                </span>
              </h3>
              <p className="text-xs text-emerald-100/90 truncate">
                Perpustakaan SMK Negeri 1 Beringin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Recipient & Book Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penerima</span>
              <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{data.nama}</span>
                {data.kelas && <span className="text-slate-500 font-normal">({data.kelas})</span>}
              </p>
              {data.nisn && <p className="text-[11px] text-slate-500 font-mono">NISN: {data.nisn}</p>}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buku Dipinjam</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">{data.judul_buku}</span>
              </p>
              {data.kode_eksemplar && (
                <p className="text-[11px] text-slate-500 font-mono">Kode: {data.kode_eksemplar}</p>
              )}
            </div>
          </div>

          {/* Template Selection Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Pilih Format Pesan Template:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  type: "TERLAMBAT",
                  label: "Terlambat & Denda",
                  icon: AlertTriangle,
                  iconColor: "text-rose-500 dark:text-rose-400",
                  hoverBorder: "hover:border-rose-500/60",
                },
                {
                  type: "PENGINGAT",
                  label: "Pengingat Jatuh Tempo",
                  icon: Bell,
                  iconColor: "text-amber-500 dark:text-amber-400",
                  hoverBorder: "hover:border-amber-500/60",
                },
                {
                  type: "PINJAM",
                  label: "Bukti Peminjaman",
                  icon: BookOpen,
                  iconColor: "text-blue-500 dark:text-blue-400",
                  hoverBorder: "hover:border-blue-500/60",
                },
                {
                  type: "KEMBALI",
                  label: "Konfirmasi Kembali",
                  icon: CheckCircle2,
                  iconColor: "text-emerald-500 dark:text-emerald-400",
                  hoverBorder: "hover:border-emerald-500/60",
                },
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = activeType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setActiveType(item.type as any)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer min-w-0 ${
                      isActive
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                        : `bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 ${item.hoverBorder}`
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-emerald-600 dark:text-emerald-400" : item.iconColor
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Phone Number Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Nomor WhatsApp Tujuan:
              </span>
              {cleanPhone && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  Format: +{cleanPhone}
                </span>
              )}
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Contoh: 08123456789 atau 628123456789"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {!phoneNumber && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Nomor belum tercatat di data anggota. Masukkan nomor WhatsApp di atas untuk langsung mengirim pesan.
              </p>
            )}
          </div>

          {/* Real-time WhatsApp Preview Mockup & Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Isi Pesan (Bisa diedit):
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Tersalin!" : "Salin Teks"}</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
            />
          </div>

          {/* Feedback message banner if sent */}
          {sendResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                sendResult.ok
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
              }`}
            >
              {sendResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              )}
              <span>{sendResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Direct WhatsApp Web Button */}
            <button
              type="button"
              onClick={handleOpenWhatsAppWeb}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka WhatsApp Web / App</span>
            </button>

            {/* Automated Gateway Button */}
            <button
              type="button"
              onClick={handleSendViaGateway}
              disabled={isSending}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-700/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim via API Gateway</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
