"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  ExternalLink,
  Phone,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  Search,
  Filter,
  Users,
  ShieldCheck,
  RefreshCw,
  Plus,
} from "lucide-react";
import { WhatsAppModal } from "@/components/admin/WhatsAppModal";
import { broadcastPengingatTerlambatAction } from "@/actions/whatsapp";
import { formatRupiah, getRemainingDays } from "@/lib/utils";

export type WhatsAppPinjamanItem = {
  id: string;
  nama: string;
  kelas: string | null;
  nisn: string | null;
  telepon: string | null;
  no_anggota: string | null;
  judul_buku: string;
  kode_eksemplar: string | null;
  tgl_pinjam: string;
  batas_kembali: string;
  status: "DIPINJAM" | "SELESAI";
  denda: number;
};

export function WhatsAppCenterClient({
  pinjamanList,
}: {
  pinjamanList: WhatsAppPinjamanItem[];
}) {
  const [activeTab, setActiveTab] = useState<"ALL" | "DUE_SOON" | "LATE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Manual Quick Send State
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualBook, setManualBook] = useState("");

  const processedList = useMemo(() => {
    return pinjamanList.map((item) => {
      const remainingDays = getRemainingDays(item.batas_kembali);
      const isLate = item.status === "DIPINJAM" && remainingDays < 0;
      const isDueSoon = item.status === "DIPINJAM" && remainingDays >= 0 && remainingDays <= 1;
      const hariTerlambat = isLate ? Math.abs(remainingDays) : 0;

      return {
        ...item,
        remainingDays,
        isLate,
        isDueSoon,
        hariTerlambat,
      };
    });
  }, [pinjamanList]);

  // Statistics
  const totalAktif = processedList.filter((i) => i.status === "DIPINJAM").length;
  const totalTerlambat = processedList.filter((i) => i.isLate).length;
  const totalJatuhTempo = processedList.filter((i) => i.isDueSoon).length;
  const totalPunyaTelepon = processedList.filter((i) => !!i.telepon).length;

  // Filtered List
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return processedList.filter((item) => {
      if (activeTab === "LATE" && !item.isLate) return false;
      if (activeTab === "DUE_SOON" && !item.isDueSoon) return false;

      if (q) {
        const matchNama = (item.nama || "").toLowerCase().includes(q);
        const matchKelas = (item.kelas || "").toLowerCase().includes(q);
        const matchBuku = (item.judul_buku || "").toLowerCase().includes(q);
        const matchPhone = (item.telepon || "").includes(q);
        return matchNama || matchKelas || matchBuku || matchPhone;
      }
      return true;
    });
  }, [processedList, activeTab, searchQuery]);

  const handleOpenItemWA = (item: any) => {
    setSelectedItem({
      nama: item.nama,
      kelas: item.kelas,
      no_anggota: item.no_anggota,
      nisn: item.nisn,
      telepon: item.telepon,
      judul_buku: item.judul_buku,
      kode_eksemplar: item.kode_eksemplar,
      tgl_pinjam: item.tgl_pinjam,
      batas_kembali: item.batas_kembali,
      hari_terlambat: item.hariTerlambat,
      denda: item.denda,
      defaultType: item.isLate ? "TERLAMBAT" : item.isDueSoon ? "PENGINGAT" : "PINJAM",
    });
    setIsModalOpen(true);
  };

  const handleOpenManualWA = () => {
    setSelectedItem({
      nama: manualName || "Peminjam",
      telepon: manualPhone || "",
      judul_buku: manualBook || "Buku Perpustakaan",
      defaultType: "PENGINGAT",
    });
    setIsModalOpen(true);
  };

  const handleBroadcastAll = async () => {
    setIsBroadcasting(true);
    setBroadcastResult(null);
    try {
      const lateIds = processedList.filter((i) => i.isLate).map((i) => i.id);
      const res = await broadcastPengingatTerlambatAction(lateIds);
      setBroadcastResult(res);
    } catch (err: any) {
      setBroadcastResult({ ok: false, message: err?.message || "Gagal melakukan broadcast." });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-fade-up">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pinjaman Aktif
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalAktif}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Buku sedang dipinjam</p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Jatuh Tempo (H-1 / H)
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {totalJatuhTempo}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Perlu diingatkan</p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Peminjam Terlambat
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {totalTerlambat}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Melewati jatuh tempo</p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            WhatsApp Terdaftar
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalPunyaTelepon}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Siap dikirim pesan</p>
        </div>
      </div>

      {/* Manual Quick Message Sender Box */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                Kirim Pesan WhatsApp Bebas / Uji Coba
              </h3>
              <p className="text-xs text-emerald-100">
                Ketik nama &amp; nomor telepon untuk langsung membuka template WhatsApp resmi
              </p>
            </div>
          </div>

          {totalTerlambat > 0 && (
            <button
              type="button"
              onClick={handleBroadcastAll}
              disabled={isBroadcasting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-extrabold shadow-md transition-all cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isBroadcasting ? "Memproses Broadcast..." : `Broadcast ke ${totalTerlambat} Terlambat`}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          <input
            type="text"
            placeholder="Nama Siswa / Guru..."
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="px-3.5 py-2.5 bg-white/15 border border-white/30 rounded-xl text-xs text-white placeholder:text-emerald-200 focus:outline-none focus:bg-white/25"
          />
          <input
            type="text"
            placeholder="No WhatsApp (08...)"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            className="px-3.5 py-2.5 bg-white/15 border border-white/30 rounded-xl text-xs text-white placeholder:text-emerald-200 focus:outline-none focus:bg-white/25"
          />
          <input
            type="text"
            placeholder="Judul Buku..."
            value={manualBook}
            onChange={(e) => setManualBook(e.target.value)}
            className="px-3.5 py-2.5 bg-white/15 border border-white/30 rounded-xl text-xs text-white placeholder:text-emerald-200 focus:outline-none focus:bg-white/25"
          />
          <button
            type="button"
            onClick={handleOpenManualWA}
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buka Template Pesan</span>
          </button>
        </div>
      </div>

      {/* Broadcast Result Feedback */}
      {broadcastResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            broadcastResult.ok
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-semibold">{broadcastResult.message}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Semua ({processedList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DUE_SOON")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "DUE_SOON"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Jatuh Tempo ({totalJatuhTempo})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("LATE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "LATE"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Terlambat ({totalTerlambat})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari peminjam, buku, nomor WA..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Table / List View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Peminjam</th>
                <th className="py-3 px-3">Judul Buku</th>
                <th className="py-3 px-3">Jatuh Tempo</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Nomor WhatsApp</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada data peminjaman yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {item.nama}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.kelas || item.no_anggota || "-"}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[220px] truncate">
                      {item.judul_buku}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {new Date(item.batas_kembali).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.isLate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-900">
                          <Clock className="w-3 h-3" />
                          <span>Lewat {item.hariTerlambat} Hari</span>
                        </span>
                      ) : item.isDueSoon ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-900">
                          <Clock className="w-3 h-3" />
                          <span>H-{item.remainingDays} Jatuh Tempo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                          Dipinjam (Aktif)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]">
                      {item.telepon ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          +{item.telepon}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum terdaftar</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenItemWA(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
