"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  Trash2,
  Search,
  X,
  PlusCircle,
  FileText,
  AlertTriangle,
  BookOpen,
  BookMarked,
  Layers,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRupiah, getRemainingDays, getDurationDays } from "@/lib/utils";
import { selesaikanTransaksi, perpanjangTransaksi, updateTransaksi, deleteTransaksi } from "@/actions/transaksi";
import { WhatsAppModal } from "@/components/admin/WhatsAppModal";

type TransaksiItem = {
  id: string;
  siswaId: string | null;
  bukuId: string | null;
  tgl_pinjam: Date | string;
  batas_kembali: Date | string;
  tgl_dikembalikan: Date | string | null;
  status: "DIPINJAM" | "SELESAI";
  denda: number;
  groupId: string | null;
  siswa: {
    id: string;
    nama: string;
    nisn: string;
    kelas: string;
  } | null;
  buku: {
    id: string;
    judul: string;
    penulis: string;
    tipe_buku: "BIASA" | "MAPEL";
  } | null;
};

// Satu baris = satu grup peminjaman (bisa berisi banyak buku)
type Group = {
  key: string;
  items: TransaksiItem[];
  siswa: TransaksiItem["siswa"];
  tgl_pinjam: Date | string;
  batas_kembali: Date | string;
  tgl_dikembalikan: Date | string | null;
  status: "DIPINJAM" | "SELESAI";
  denda: number;
  tipe: "BIASA" | "MAPEL";
};

type FilterTab = "ALL" | "ACTIVE" | "LATE" | "DONE";

const buildGroups = (list: TransaksiItem[]): Group[] => {
  const map = new Map<string, TransaksiItem[]>();
  for (const t of list) {
    const key = t.groupId ?? `single:${t.id}`;
    const arr = map.get(key);
    if (arr) arr.push(t);
    else map.set(key, [t]);
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const head = items[0];
    return {
      key,
      items,
      siswa: head.siswa,
      tgl_pinjam: head.tgl_pinjam,
      batas_kembali: head.batas_kembali,
      tgl_dikembalikan: head.tgl_dikembalikan,
      status: head.status,
      denda: items.reduce((sum, t) => sum + t.denda, 0),
      tipe: head.buku?.tipe_buku ?? "BIASA",
    };
  });
};

export default function DaftarTransaksiTable({
  transaksiList,
}: {
  transaksiList: TransaksiItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal States
  const [selectedSlip, setSelectedSlip] = useState<Group | null>(null);
  const [editModalItem, setEditModalItem] = useState<Group | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<Group | null>(null);
  const [customNewDate, setCustomNewDate] = useState("");
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waModalData, setWaModalData] = useState<any>(null);

  const handleOpenWA = (g: Group) => {
    const remainingDays = getRemainingDays(g.batas_kembali);
    const isLate = g.status === "DIPINJAM" && remainingDays < 0;
    const hariTerlambat = isLate ? Math.abs(remainingDays) : 0;
    const judulGabung = g.items.map((i) => i.buku?.judul || "Buku Perpustakaan").join(", ");

    setWaModalData({
      nama: g.siswa?.nama || "Peminjam",
      kelas: g.siswa?.kelas || null,
      nisn: g.siswa?.nisn || null,
      telepon: (g.siswa as any)?.telepon || null,
      judul_buku: judulGabung,
      tgl_pinjam: typeof g.tgl_pinjam === "string" ? g.tgl_pinjam : g.tgl_pinjam.toISOString(),
      batas_kembali: typeof g.batas_kembali === "string" ? g.batas_kembali : g.batas_kembali.toISOString(),
      hari_terlambat: hariTerlambat,
      denda: g.denda,
      defaultType: g.status === "SELESAI" ? "KEMBALI" : isLate ? "TERLAMBAT" : "PINJAM",
    });
    setWaModalOpen(true);
  };

  const groups = useMemo(() => buildGroups(transaksiList), [transaksiList]);

  const kelasOptions = useMemo(() => {
    const set = new Set<string>();
    transaksiList.forEach((t) => {
      if (t.siswa?.kelas) set.add(t.siswa.kelas);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [transaksiList]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

    return groups.filter((g) => {
      const isLate = g.status === "DIPINJAM" && getRemainingDays(g.batas_kembali) < 0;

      if (filterTab === "ACTIVE" && g.status !== "DIPINJAM") return false;
      if (filterTab === "LATE" && !isLate) return false;
      if (filterTab === "DONE" && g.status !== "SELESAI") return false;

      if (kelasFilter && g.siswa?.kelas !== kelasFilter) return false;

      if (from !== null || to !== null) {
        const tgl = new Date(g.tgl_pinjam).getTime();
        if (from !== null && tgl < from) return false;
        if (to !== null && tgl > to) return false;
      }

      if (q) {
        const namaSiswa = g.siswa?.nama?.toLowerCase() || "";
        const nisnSiswa = g.siswa?.nisn?.toLowerCase() || "";
        const matchSiswa = namaSiswa.includes(q) || nisnSiswa.includes(q);
        const matchBuku = g.items.some((t) => (t.buku?.judul?.toLowerCase() || "").includes(q));
        return matchSiswa || matchBuku;
      }
      return true;
    });
  }, [groups, filterTab, searchQuery, kelasFilter, dateFrom, dateTo]);

  const biasaGroups = filteredGroups.filter((g) => g.tipe === "BIASA");
  const mapelGroups = filteredGroups.filter((g) => g.tipe === "MAPEL");

  const resetFilters = () => {
    setFilterTab("ALL");
    setSearchQuery("");
    setKelasFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const handleSelesaikan = (id: string) => {
    startTransition(async () => {
      await selesaikanTransaksi(id);
    });
  };

  const handlePerpanjangHari = (id: string, hari: number) => {
    startTransition(async () => {
      await perpanjangTransaksi(id, hari);
      setEditModalItem(null);
    });
  };

  const handleUpdateTanggal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalItem || !customNewDate) return;

    const formData = new FormData();
    formData.append("batasKembali", customNewDate);

    startTransition(async () => {
      await updateTransaksi(editModalItem.items[0].id, formData);
      setEditModalItem(null);
      setCustomNewDate("");
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTransaksi(id);
      setDeleteModalItem(null);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTable = (list: Group[], accent: "emerald" | "violet") => {
    const empty = list.length === 0;
    return (
      <div>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 dark:divide-slate-800 text-sm">
            <thead className={accent === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/30 border-b border-stone-200 dark:border-slate-800" : "bg-violet-50 dark:bg-violet-950/30 border-b border-stone-200 dark:border-slate-800"}>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 dark:text-slate-400 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 dark:text-slate-400 uppercase tracking-wider">
                  Buku Dipinjam
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 dark:text-slate-400 uppercase tracking-wider">
                  Tgl Pinjam
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 dark:text-slate-400 uppercase tracking-wider">
                  Batas Kembali &amp; Durasi
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 dark:text-slate-400 uppercase tracking-wider">
                  Status Waktu
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 dark:text-slate-400 uppercase tracking-wider">
                  Denda
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold text-stone-700 dark:text-slate-400 uppercase tracking-wider">
                  Aksi &amp; Opsi
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-stone-200 dark:divide-slate-800/80 text-sm">
              {empty && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-stone-400 dark:text-slate-500 text-xs">
                    Tidak ada transaksi pada kategori ini.
                  </td>
                </tr>
              )}
              {list.map((g) => {
                const remainingDays = getRemainingDays(g.batas_kembali);
                const durasiHari = getDurationDays(g.tgl_pinjam, g.batas_kembali);
                const isLate = g.status === "DIPINJAM" && remainingDays < 0;
                const isToday = g.status === "DIPINJAM" && remainingDays === 0;
                const multi = g.items.length > 1;

                return (
                  <tr key={g.key} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors align-top">
                    {/* Siswa */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-stone-900 dark:text-white">{g.siswa?.nama}</div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">
                        NISN: {g.siswa?.nisn} | {g.siswa?.kelas}
                      </div>
                    </td>

                    {/* Buku (bisa banyak) */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        {g.items.map((t) => (
                          <div key={t.id} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-500 mt-0.5">•</span>
                            <div className="min-w-0">
                              <div className="font-medium text-stone-800 dark:text-slate-200 line-clamp-1">{t.buku?.judul}</div>
                              <div className="text-[10px] text-stone-500 dark:text-slate-400">{t.buku?.penulis}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {multi && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 px-2 py-0.5 rounded font-semibold uppercase">
                          <Layers className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                          {g.items.length} Buku
                        </span>
                      )}
                    </td>

                    {/* Tgl Pinjam */}
                    <td className="px-5 py-3.5 text-stone-700 dark:text-slate-300 text-xs whitespace-nowrap">
                      {formatDate(g.tgl_pinjam)}
                    </td>

                    {/* Batas Kembali & Durasi */}
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      <div className={`font-medium ${isLate ? "text-rose-600 dark:text-rose-400 font-bold" : "text-stone-900 dark:text-white font-bold"}`}>
                        {formatDate(g.batas_kembali)}
                      </div>
                      <span className="inline-block text-[10px] bg-stone-100 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 px-2 py-0.5 rounded mt-0.5 font-medium">
                        Durasi: {durasiHari} Hari
                      </span>
                    </td>

                    {/* Status Waktu */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {g.status === "DIPINJAM" ? (
                        isLate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60 shadow-xs">
                            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            Terlambat {Math.abs(remainingDays)} hari
                          </span>
                        ) : isToday ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 shadow-xs">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Jatuh tempo hari ini
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 shadow-xs">
                            <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Sisa {remainingDays} hari
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Selesai
                        </span>
                      )}
                    </td>

                    {/* Denda */}
                    <td className="px-5 py-3.5 text-xs font-medium whitespace-nowrap">
                      {g.denda > 0 ? (
                        <span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800/60">
                          {formatRupiah(g.denda)}
                        </span>
                      ) : (
                        <span className="text-stone-400 dark:text-slate-500">-</span>
                      )}
                    </td>

                    {/* Aksi & Opsi */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Kirim Notifikasi WhatsApp"
                          onClick={() => handleOpenWA(g)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          title="Cetak Slip Peminjaman / Struk"
                          onClick={() => setSelectedSlip(g)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-slate-700"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {g.status === "DIPINJAM" && (
                          <>
                            <button
                              title="Perpanjang / Edit Durasi"
                              onClick={() => {
                                setEditModalItem(g);
                                setCustomNewDate(new Date(g.batas_kembali).toISOString().split("T")[0]);
                              }}
                              className="p-1.5 text-stone-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-slate-700"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelesaikan(g.items[0].id)}
                              disabled={isPending}
                              className="text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 dark:bg-transparent dark:hover:bg-emerald-500/20 hover:text-emerald-900 dark:hover:text-white cursor-pointer h-7 px-2.5 rounded-lg"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Kembalikan
                            </Button>
                          </>
                        )}

                        <button
                          title="Hapus / Batalkan Transaksi"
                          onClick={() => setDeleteModalItem(g)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-stone-200 dark:divide-slate-800/80">
          {empty && (
            <div className="p-8 text-center text-stone-400 dark:text-slate-500 text-xs">
              Tidak ada transaksi pada kategori ini.
            </div>
          )}
          {list.map((g) => {
            const remainingDays = getRemainingDays(g.batas_kembali);
            const durasiHari = getDurationDays(g.tgl_pinjam, g.batas_kembali);
            const isLate = g.status === "DIPINJAM" && remainingDays < 0;
            const isToday = g.status === "DIPINJAM" && remainingDays === 0;

            return (
              <div key={g.key} className="p-4 space-y-3 hover:bg-stone-50/70 dark:hover:bg-slate-800/30 transition-colors">
                {/* Siswa & Status Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                      {g.siswa?.nama}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">
                      {g.siswa?.kelas} · NISN: {g.siswa?.nisn}
                    </p>
                  </div>

                  {g.status === "DIPINJAM" ? (
                    isLate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60 shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        Telat {Math.abs(remainingDays)}h
                      </span>
                    ) : isToday ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 shrink-0">
                        <Clock className="w-3 h-3" />
                        Hari ini
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 shrink-0">
                        <Clock className="w-3 h-3" />
                        {remainingDays}h lagi
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Selesai
                    </span>
                  )}
                </div>

                {/* Buku Dipinjam */}
                <div className="bg-stone-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-stone-200 dark:border-slate-800/80 space-y-1.5 text-xs">
                  {g.items.map((t) => (
                    <div key={t.id} className="flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 dark:text-white line-clamp-1">{t.buku?.judul}</p>
                        <p className="text-[10px] text-stone-500 dark:text-slate-400">{t.buku?.penulis}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dates & Denda Info */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 dark:text-slate-300">
                  <div className="bg-stone-100/70 dark:bg-slate-800/60 rounded-lg p-2 border border-stone-200/80 dark:border-slate-700/60">
                    <span className="text-[9px] uppercase font-bold text-stone-400 dark:text-slate-500 block">Tgl Pinjam</span>
                    <span className="font-semibold text-stone-800 dark:text-slate-200">{formatDate(g.tgl_pinjam)}</span>
                  </div>
                  <div className="bg-stone-100/70 dark:bg-slate-800/60 rounded-lg p-2 border border-stone-200/80 dark:border-slate-700/60">
                    <span className="text-[9px] uppercase font-bold text-stone-400 dark:text-slate-500 block">Batas Kembali</span>
                    <span className={`font-semibold ${isLate ? "text-rose-600 dark:text-rose-400 font-bold" : "text-stone-800 dark:text-slate-200"}`}>
                      {formatDate(g.batas_kembali)} ({durasiHari}h)
                    </span>
                  </div>
                </div>

                {g.denda > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs">
                    <span className="text-rose-700 dark:text-rose-400 font-bold">Denda Keterlambatan:</span>
                    <span className="font-black text-rose-700 dark:text-rose-400">{formatRupiah(g.denda)}</span>
                  </div>
                )}

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenWA(g)}
                    className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/80 shadow-xs cursor-pointer"
                    title="Kirim WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedSlip(g)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Slip</span>
                  </button>

                  {g.status === "DIPINJAM" && (
                    <>
                      <button
                        onClick={() => {
                          setEditModalItem(g);
                          setCustomNewDate(new Date(g.batas_kembali).toISOString().split("T")[0]);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Perpanjang</span>
                      </button>

                      <Button
                        size="sm"
                        onClick={() => handleSelesaikan(g.items[0].id)}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Kembalikan</span>
                      </Button>
                    </>
                  )}

                  <button
                    onClick={() => setDeleteModalItem(g)}
                    className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-xs cursor-pointer"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white">Riwayat &amp; Daftar Transaksi Peminjaman</h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">Kelola durasi, perpanjangan, cetak slip, dan pengembalian</p>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari siswa, NISN, atau judul buku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-xs border border-stone-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50 dark:bg-slate-800/90 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder-slate-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Tabs Filter Status */}
      <div className="px-5 py-3 bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              filterTab === "ALL"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                : "bg-white dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Semua ({groups.length})
          </button>
          <button
            onClick={() => setFilterTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              filterTab === "ACTIVE"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                : "bg-white dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Sedang Dipinjam ({groups.filter((t) => t.status === "DIPINJAM").length})
          </button>
          <button
            onClick={() => setFilterTab("LATE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              filterTab === "LATE"
                ? "bg-rose-600 text-white border-rose-600 shadow-md"
                : "bg-white dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Terlambat (
            {groups.filter((t) => t.status === "DIPINJAM" && getRemainingDays(t.batas_kembali) < 0).length})
          </button>
          <button
            onClick={() => setFilterTab("DONE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              filterTab === "DONE"
                ? "bg-teal-600 text-white border-teal-600 shadow-md"
                : "bg-white dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Selesai ({groups.filter((t) => t.status === "SELESAI").length})
          </button>
        </div>
      </div>

      {/* Filter Lanjutan: Kelas + Rentang Tanggal */}
      <div className="px-5 py-3 bg-stone-50/70 dark:bg-slate-900/30 border-b border-stone-200 dark:border-slate-800 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wide">Kelas</label>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="h-9 border border-stone-300 dark:border-slate-700 rounded-xl px-3 text-xs bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[140px] shadow-xs"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-stone-500 dark:text-slate-400">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k} className="bg-white dark:bg-slate-900 text-stone-900 dark:text-white">
                {k}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wide">Pinjam Dari</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 border border-stone-300 dark:border-slate-700 rounded-xl px-3 text-xs bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wide">Sampai</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 border border-stone-300 dark:border-slate-700 rounded-xl px-3 text-xs bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
          />
        </div>

        <button
          onClick={resetFilters}
          className="h-9 px-3 rounded-xl text-xs font-semibold text-stone-700 dark:text-slate-300 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
        >
          <X className="w-3.5 h-3.5" />
          Reset Filter
        </button>

        <span className="text-[11px] text-stone-500 dark:text-slate-400 ml-auto">
          Menampilkan {filteredGroups.length} grup peminjaman
        </span>
      </div>

      {/* Tabel 1: Peminjaman Buku Biasa */}
      <div className="border-b-4 border-stone-200 dark:border-slate-950">
        <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/40 flex items-center gap-2 border-y border-emerald-200 dark:border-emerald-900/60">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Peminjaman Buku Biasa</h3>
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-full shadow-xs">
            {biasaGroups.length} grup
          </span>
        </div>
        {renderTable(biasaGroups, "emerald")}
      </div>

      {/* Tabel 2: Peminjaman Buku Mapel / LKS */}
      <div>
        <div className="px-5 py-3 bg-violet-50 dark:bg-violet-950/40 flex items-center gap-2 border-y border-violet-200 dark:border-violet-900/60">
          <BookMarked className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-sm font-bold text-violet-800 dark:text-violet-400">Peminjaman Buku Mapel / LKS</h3>
          <span className="text-[11px] font-bold text-violet-800 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/20 border border-violet-300 dark:border-violet-500/30 px-2 py-0.5 rounded-full shadow-xs">
            {mapelGroups.length} grup
          </span>
        </div>
        {renderTable(mapelGroups, "violet")}
      </div>

      {filteredGroups.length === 0 && !biasaGroups.length && !mapelGroups.length && (
        <div className="px-6 py-8 text-center text-slate-500 border-t border-slate-100">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm">Tidak ada transaksi yang cocok dengan filter atau pencarian.</p>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL CETAK SLIP PEMINJAMAN                                */}
      {/* ========================================================== */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>Pratinjau Slip Peminjaman Perpustakaan</span>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-slip" className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-slate-800">
              <div className="text-center pb-3 border-b-2 border-slate-800">
                <div className="flex items-center justify-center gap-2.5 mb-1.5">
                  <img
                    src="/assets/logo.png"
                    alt="Logo SMK Negeri 1 Beringin"
                    className="w-10 h-10 object-contain"
                  />
                  <img
                    src="/assets/logo-kolaborasi.png"
                    alt="Logo Kolaborasi Sumut Berkah"
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <h3 className="font-extrabold text-base tracking-wide text-slate-900 uppercase">
                  Perpustakaan SMK Negeri 1 Beringin
                </h3>
                <p className="text-[11px] text-slate-600">
                  Sistem Informasi & Manajemen Perpustakaan Sekolah
                </p>
                <div className="inline-block mt-1 px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-sm uppercase tracking-wider">
                  Bukti Transaksi Peminjaman Buku
                </div>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500">ID Grup:</span>
                  <span className="font-mono font-bold ml-1">{selectedSlip.key.substring(0, 12).toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Waktu Cetak:</span>
                  <span className="font-medium ml-1">{formatDate(new Date())}</span>
                </div>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Nama Peminjam</span>
                  <span className="col-span-2 font-bold text-slate-900">: {selectedSlip.siswa?.nama}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">NISN / Kelas</span>
                  <span className="col-span-2 font-medium text-slate-800">
                    : {selectedSlip.siswa?.nisn} / Kelas {selectedSlip.siswa?.kelas}
                  </span>
                </div>

                {/* Daftar Buku */}
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Buku Dipinjam</span>
                  <span className="col-span-2 font-bold text-slate-900">: ({selectedSlip.items.length} buku)</span>
                </div>
                <div className="col-span-3 space-y-1 pl-2">
                  {selectedSlip.items.map((t, i) => (
                    <div key={t.id} className="text-[11px] text-slate-700 flex gap-1.5">
                      <span className="text-slate-400">{i + 1}.</span>
                      <span>
                        <strong>{t.buku?.judul}</strong>
                        <span className="text-slate-500"> — {t.buku?.penulis}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Tanggal Pinjam</span>
                  <span className="col-span-2 font-medium text-slate-800">: {formatDate(selectedSlip.tgl_pinjam)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="font-semibold text-emerald-900">Batas Pengembalian</span>
                  <span className="col-span-2 font-extrabold text-emerald-800">
                    : {formatDate(selectedSlip.batas_kembali)} (
                    {getDurationDays(selectedSlip.tgl_pinjam, selectedSlip.batas_kembali)} Hari)
                  </span>
                </div>
                {selectedSlip.status === "SELESAI" && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2 rounded">
                    <span className="text-slate-600">Status</span>
                    <span className="col-span-2 font-bold text-emerald-700">
                      : Sudah Dikembalikan pada{" "}
                      {selectedSlip.tgl_dikembalikan ? formatDate(selectedSlip.tgl_dikembalikan) : "-"}
                    </span>
                  </div>
                )}
                {selectedSlip.denda > 0 && (
                  <div className="grid grid-cols-3 gap-2 bg-rose-50 p-2 rounded border border-rose-200">
                    <span className="font-semibold text-rose-900">Total Denda</span>
                    <span className="col-span-2 font-extrabold text-rose-700">: {formatRupiah(selectedSlip.denda)}</span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 space-y-0.5">
                <p>1. Harap menjaga kondisi buku agar tetap baik dan tidak rusak/hilang.</p>
                <p>2. Keterlambatan dikenakan denda sesuai dengan peraturan perpustakaan.</p>
                <p>3. Tunjukkan slip ini saat mengembalikan buku ke petugas.</p>
              </div>

              <div className="pt-6 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="text-slate-500">Peminjam,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline text-slate-800">{selectedSlip.siswa?.nama}</p>
                </div>
                <div>
                  <p className="text-slate-500">Petugas Perpustakaan,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline text-slate-800">( Petugas Perpus )</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5 print:hidden">
              <Button variant="outline" size="sm" onClick={() => setSelectedSlip(null)} className="cursor-pointer">
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak / Simpan PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL PERPANJANG / EDIT DURASI HARI                        */}
      {/* ========================================================== */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditModalItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Perpanjang / Edit Durasi Pinjam</h3>
                <p className="text-xs text-slate-500">Berlaku untuk seluruh buku dalam grup ini</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 text-xs space-y-1.5">
              <div>
                <span className="text-slate-500">Peminjam:</span>{" "}
                 <strong className="text-slate-800">{editModalItem.siswa?.nama}</strong> ({editModalItem.siswa?.kelas})
              </div>
              <div>
                <span className="text-slate-500">Jumlah Buku:</span>{" "}
                <strong className="text-slate-800">{editModalItem.items.length} buku</strong>
              </div>
              <div>
                <span className="text-slate-500">Batas Kembali Sekarang:</span>{" "}
                <strong className="text-emerald-700">{formatDate(editModalItem.batas_kembali)}</strong>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-700 block">Pilihan Perpanjangan Cepat:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 3, label: "+3 Hari" },
                  { days: 7, label: "+7 Hari" },
                  { days: 14, label: "+14 Hari" },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    disabled={isPending}
                    onClick={() => handlePerpanjangHari(editModalItem.items[0].id, item.days)}
                    className="py-2 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleUpdateTanggal} className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block">
                Atau Tentukan Tanggal Batas Kembali Baru:
              </label>
              <input
                type="date"
                value={customNewDate}
                onChange={(e) => setCustomNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-9 border border-slate-300 rounded-lg px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalItem(null)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL HAPUS / BATALKAN TRANSAKSI                           */}
      {/* ========================================================== */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-slate-900 text-base">Hapus Transaksi Peminjaman?</h3>
            <p className="text-xs text-slate-600 mt-1">
              Apakah Anda yakin ingin membatalkan transaksi untuk <strong>{deleteModalItem?.siswa?.nama}</strong>
              {deleteModalItem.items.length > 1 && (
                <>
                  {" "}
                  (<strong>{deleteModalItem.items.length} buku</strong>)
                </>
              )}
              ?
            </p>

            {deleteModalItem.status === "DIPINJAM" && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ️ Transaksi ini masih <strong>DIPINJAM</strong>. Menghapusnya akan otomatis{" "}
                <strong>mengembalikan stok buku</strong> ke perpustakaan.
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalItem(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleDelete(deleteModalItem.items[0].id)}
                className="cursor-pointer bg-rose-600 hover:bg-rose-700"
              >
                Ya, Hapus Transaksi
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        data={waModalData}
      />
    </div>
  );
}
