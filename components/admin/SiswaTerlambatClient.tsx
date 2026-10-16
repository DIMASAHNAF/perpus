"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  MessageCircle,
  Clock,
  BookOpen,
  User,
  Send,
  Sparkles,
  Phone,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { WhatsAppModal } from "@/components/admin/WhatsAppModal";
import { broadcastPengingatTerlambatAction } from "@/actions/whatsapp";
import { hitungDenda } from "@/lib/utils";

type SiswaTerlambatItem = {
  id: string;
  siswaNama: string;
  siswaKelas: string | null;
  nisn: string | null;
  telepon: string | null;
  no_anggota: string | null;
  bukuJudul: string;
  kodeEksemplar: string | null;
  tglPinjam: string;
  batasKembali: string;
};

export function SiswaTerlambatClient({
  items,
}: {
  items: SiswaTerlambatItem[];
}) {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="bg-emerald-50/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-emerald-950 dark:text-white leading-tight">
              Status Sirkulasi: Tidak Ada Peminjam Terlambat
            </h3>
            <p className="text-xs text-emerald-700/80 dark:text-slate-400">
              Semua buku yang sedang dipinjam masih dalam batas waktu aman.
            </p>
          </div>
        </div>

        <Link
          href="/admin/whatsapp"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Buka Pusat Notifikasi WA</span>
        </Link>
      </div>
    );
  }

  const handleOpenWA = (item: SiswaTerlambatItem) => {
    const now = new Date();
    const batas = new Date(item.batasKembali);
    const hariTerlambat = Math.max(1, Math.floor((now.getTime() - batas.getTime()) / (1000 * 60 * 60 * 24)));
    const denda = hitungDenda(batas, now);

    setSelectedItem({
      nama: item.siswaNama,
      kelas: item.siswaKelas,
      nisn: item.nisn,
      telepon: item.telepon,
      no_anggota: item.no_anggota,
      judul_buku: item.bukuJudul,
      kode_eksemplar: item.kodeEksemplar,
      tgl_pinjam: item.tglPinjam,
      batas_kembali: item.batasKembali,
      hari_terlambat: hariTerlambat,
      denda: denda,
      defaultType: "TERLAMBAT",
    });
    setIsModalOpen(true);
  };

  const handleBroadcastAll = async () => {
    setIsBroadcasting(true);
    setBroadcastResult(null);
    try {
      const res = await broadcastPengingatTerlambatAction(items.map((i) => i.id));
      setBroadcastResult(res);
    } catch (err: any) {
      setBroadcastResult({ ok: false, message: err?.message || "Gagal broadcast pesan WhatsApp." });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="bg-rose-50/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-md p-4 sm:p-6 space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-600 dark:text-rose-400 pb-3 border-b border-rose-200/60 dark:border-rose-900/50">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-rose-900 dark:text-white flex items-center gap-2">
              <span>Perhatian: Peminjam Terlambat</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs">
                {items.length} Transaksi
              </span>
            </h2>
            <p className="text-xs text-rose-700/80 dark:text-slate-400">
              Buku yang telah melewati batas tanggal jatuh tempo pengembalian
            </p>
          </div>
        </div>

        {/* Batch Action Button */}
        <button
          type="button"
          onClick={handleBroadcastAll}
          disabled={isBroadcasting}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{isBroadcasting ? "Memproses Broadcast..." : "Kirim Pengingat WA ke Semua"}</span>
        </button>
      </div>

      {/* Broadcast Result Toast */}
      {broadcastResult && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            broadcastResult.ok
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{broadcastResult.message}</span>
        </div>
      )}

      {/* List of Late Students */}
      <div className="space-y-2.5 sm:space-y-3">
        {items.map((t) => {
          const now = new Date();
          const batas = new Date(t.batasKembali);
          const hariTerlambat = Math.max(1, Math.floor((now.getTime() - batas.getTime()) / (1000 * 60 * 60 * 24)));
          const denda = hitungDenda(batas, now);

          return (
            <div
              key={t.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white/90 dark:bg-slate-900/90 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-all"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {t.siswaNama}
                  </p>
                  {t.siswaKelas && (
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                      {t.siswaKelas}
                    </span>
                  )}
                  {t.nisn && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      NISN: {t.nisn}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <strong className="truncate">{t.bukuJudul}</strong>
                  {t.kodeEksemplar && (
                    <span className="text-[10px] text-slate-500 font-mono">({t.kodeEksemplar})</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                <div className="text-right space-y-0.5">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-bold">
                    <Clock className="w-3 h-3" />
                    <span>Lewat {hariTerlambat} Hari</span>
                  </div>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                    Denda: Rp {denda.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* WhatsApp Quick Trigger Button */}
                <button
                  type="button"
                  onClick={() => handleOpenWA(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs shadow-emerald-500/20 transition-all cursor-pointer"
                  title="Kirim Notifikasi WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedItem}
      />
    </div>
  );
}
