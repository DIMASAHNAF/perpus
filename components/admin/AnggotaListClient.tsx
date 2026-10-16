"use client";

import React, { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Search,
  CreditCard,
  CalendarDays,
  BookCheck,
  AlertCircle,
  Filter,
  CheckCircle2,
  XCircle,
  Hash,
  Phone,
  GraduationCap,
  Wifi,
  Code2,
  UtensilsCrossed,
  Scissors,
  Building2,
  Sparkles,
  Compass,
  ArrowUpDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteAnggota } from "@/actions/anggota";

export type AnggotaListItem = {
  id: string;
  no_anggota: string;
  nama: string;
  jenis: "SISWA" | "GURU" | "STAF";
  nisn: string | null;
  telepon: string | null;
  status_aktif: boolean;
  createdAt: Date | string;
  kelasRef?: {
    nama_kelas: string;
  } | null;
  _count: {
    transaksi: number;
  };
};

export type JurusanKey =
  | "ALL"
  | "TJKT"
  | "PPLG"
  | "PERHOTELAN"
  | "KULINER"
  | "BUSANA"
  | "KECANTIKAN"
  | "ULW"
  | "OTHER";

export type SortKey =
  | "NAMA_ASC"
  | "NAMA_DESC"
  | "KELAS_ASC"
  | "NO_ANGGOTA_ASC"
  | "TERBARU";

export function getJurusanFromMember(a?: AnggotaListItem | null): JurusanKey {
  if (!a || a.jenis !== "SISWA") return "OTHER";
  const namaKelas = a.kelasRef?.nama_kelas;
  if (!namaKelas || typeof namaKelas !== "string") return "OTHER";
  const s = namaKelas.toUpperCase();
  if (s.includes("TKJ") || s.includes("TJKT")) return "TJKT";
  if (s.includes("RPL") || s.includes("PPLG")) return "PPLG";
  if (s.includes("KULINER") || s.includes("BOGA")) return "KULINER";
  if (s.includes("BUSANA")) return "BUSANA";
  if (s.includes("PH") || s.includes("HOTEL") || s.includes("PERHOTELAN")) return "PERHOTELAN";
  if (s.includes("KC") || s.includes("CANTIK") || s.includes("KECANTIKAN")) return "KECANTIKAN";
  if (s.includes("ULW") || s.includes("ULP") || s.includes("WISATA")) return "ULW";
  return "OTHER";
}

export function getJurusanBadgeStyle(jurusan?: JurusanKey | null) {
  switch (jurusan) {
    case "TJKT":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
    case "PPLG":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
    case "PERHOTELAN":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "KULINER":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    case "BUSANA":
      return "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30";
    case "KECANTIKAN":
      return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
    case "ULW":
      return "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30";
    default:
      return "bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-500/30";
  }
}

const JURUSAN_TABS: {
  key: JurusanKey;
  label: string;
  shortLabel: string;
  icon: any;
  activeColor: string;
}[] = [
  {
    key: "ALL",
    label: "Semua Jurusan",
    shortLabel: "Semua",
    icon: Users,
    activeColor: "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md",
  },
  {
    key: "TJKT",
    label: "TJKT / TKJ",
    shortLabel: "TJKT",
    icon: Wifi,
    activeColor: "bg-sky-500 text-white shadow-md shadow-sky-500/30",
  },
  {
    key: "PPLG",
    label: "PPLG / RPL",
    shortLabel: "PPLG",
    icon: Code2,
    activeColor: "bg-blue-600 text-white shadow-md shadow-blue-500/30",
  },
  {
    key: "PERHOTELAN",
    label: "Perhotelan (PH)",
    shortLabel: "Perhotelan",
    icon: Building2,
    activeColor: "bg-emerald-600 text-white shadow-md shadow-emerald-500/30",
  },
  {
    key: "KULINER",
    label: "Kuliner",
    shortLabel: "Kuliner",
    icon: UtensilsCrossed,
    activeColor: "bg-amber-500 text-white shadow-md shadow-amber-500/30",
  },
  {
    key: "BUSANA",
    label: "Busana",
    shortLabel: "Busana",
    icon: Scissors,
    activeColor: "bg-pink-500 text-white shadow-md shadow-pink-500/30",
  },
  {
    key: "KECANTIKAN",
    label: "Kecantikan (KC)",
    shortLabel: "Kecantikan",
    icon: Sparkles,
    activeColor: "bg-purple-600 text-white shadow-md shadow-purple-500/30",
  },
  {
    key: "ULW",
    label: "ULW (Wisata)",
    shortLabel: "ULW",
    icon: Compass,
    activeColor: "bg-teal-600 text-white shadow-md shadow-teal-500/30",
  },
  {
    key: "OTHER",
    label: "Guru / Staf / Lainnya",
    shortLabel: "Lainnya",
    icon: GraduationCap,
    activeColor: "bg-stone-700 text-white shadow-md",
  },
];

export function AnggotaListClient({ initialAnggota = [] }: { initialAnggota?: AnggotaListItem[] }) {
  const [query, setQuery] = useState("");
  const [jenisFilter, setJenisFilter] = useState<"ALL" | "SISWA" | "GURU" | "STAF">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTIF" | "NONAKTIF">("ALL");
  const [jurusanFilter, setJurusanFilter] = useState<JurusanKey>("ALL");
  const [kelasFilter, setKelasFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("NAMA_ASC");
  const [groupByKelas, setGroupByKelas] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const [anggotaToDelete, setAnggotaToDelete] = useState<AnggotaListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hitung jumlah anggota per Jurusan
  const jurusanCounts = useMemo(() => {
    const counts: Record<JurusanKey, number> = {
      ALL: (initialAnggota || []).length,
      TJKT: 0,
      PPLG: 0,
      PERHOTELAN: 0,
      KULINER: 0,
      BUSANA: 0,
      KECANTIKAN: 0,
      ULW: 0,
      OTHER: 0,
    };
    for (const a of initialAnggota || []) {
      const j = getJurusanFromMember(a);
      counts[j] = (counts[j] || 0) + 1;
    }
    return counts;
  }, [initialAnggota]);

  // Daftar kelas yang relevan dengan Jurusan yang sedang dipilih
  const availableClassesForJurusan = useMemo(() => {
    const classMap = new Map<string, number>();
    for (const a of initialAnggota || []) {
      if (a?.jenis !== "SISWA") continue;
      const j = getJurusanFromMember(a);
      if (jurusanFilter === "ALL" || j === jurusanFilter) {
        const k = a.kelasRef?.nama_kelas || "Tanpa Kelas";
        classMap.set(k, (classMap.get(k) || 0) + 1);
      }
    }

    return Array.from(classMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [initialAnggota, jurusanFilter]);

  // Reset kelas & halaman jika jurusan filter berubah
  const handleSelectJurusan = (key: JurusanKey) => {
    setJurusanFilter(key);
    setKelasFilter("ALL");
    setCurrentPage(1);
  };

  // Filter & Urutkan
  const filteredAndSortedAnggota = useMemo(() => {
    const list = (initialAnggota || []).filter((a) => {
      if (!a) return false;
      const q = query.toLowerCase().trim();
      const matchQuery =
        !q ||
        (a.nama && a.nama.toLowerCase().includes(q)) ||
        (a.no_anggota && a.no_anggota.toLowerCase().includes(q)) ||
        (a.nisn && a.nisn.toLowerCase().includes(q)) ||
        (a.telepon && a.telepon.toLowerCase().includes(q)) ||
        (a.kelasRef?.nama_kelas && a.kelasRef.nama_kelas.toLowerCase().includes(q));

      const matchJenis = jenisFilter === "ALL" || a.jenis === jenisFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "AKTIF" && a.status_aktif) ||
        (statusFilter === "NONAKTIF" && !a.status_aktif);

      const memberJurusan = getJurusanFromMember(a);
      const matchJurusan = jurusanFilter === "ALL" || memberJurusan === jurusanFilter;

      const memberKelas = a.kelasRef?.nama_kelas || "Tanpa Kelas";
      const matchKelas = kelasFilter === "ALL" || memberKelas === kelasFilter;

      return matchQuery && matchJenis && matchStatus && matchJurusan && matchKelas;
    });

    // Urutkan data
    list.sort((a, b) => {
      if (sortBy === "NAMA_ASC") {
        return (a.nama || "").localeCompare(b.nama || "");
      }
      if (sortBy === "NAMA_DESC") {
        return (b.nama || "").localeCompare(a.nama || "");
      }
      if (sortBy === "KELAS_ASC") {
        const kA = a.kelasRef?.nama_kelas || "ZZZ";
        const kB = b.kelasRef?.nama_kelas || "ZZZ";
        const cmpKelas = kA.localeCompare(kB, undefined, { numeric: true });
        return cmpKelas !== 0 ? cmpKelas : (a.nama || "").localeCompare(b.nama || "");
      }
      if (sortBy === "NO_ANGGOTA_ASC") {
        return (a.no_anggota || "").localeCompare(b.no_anggota || "", undefined, { numeric: true });
      }
      // Default: TERBARU
      const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return list;
  }, [initialAnggota, query, jenisFilter, statusFilter, jurusanFilter, kelasFilter, sortBy]);

  // Kelompokkan per kelas jika toggle diaktifkan
  const groupedData = useMemo(() => {
    if (!groupByKelas) return null;
    const map = new Map<string, AnggotaListItem[]>();
    for (const a of filteredAndSortedAnggota) {
      const k = a?.kelasRef?.nama_kelas || "Tanpa Kelas";
      if (!map.has(k)) {
        map.set(k, []);
      }
      map.get(k)!.push(a);
    }
    return map;
  }, [filteredAndSortedAnggota, groupByKelas]);

  // Pagination
  const totalItems = filteredAndSortedAnggota.length;
  const isPagingEnabled = !groupByKelas && pageSize > 0 && totalItems > pageSize;
  const totalPages = isPagingEnabled ? Math.ceil(totalItems / pageSize) : 1;
  const activePage = Math.min(Math.max(currentPage, 1), totalPages);

  const displayedList = useMemo(() => {
    if (!isPagingEnabled) return filteredAndSortedAnggota;
    const start = (activePage - 1) * pageSize;
    return filteredAndSortedAnggota.slice(start, start + pageSize);
  }, [filteredAndSortedAnggota, isPagingEnabled, activePage, pageSize]);

  const totalAktif = useMemo(() => {
    return (initialAnggota || []).filter((a) => a?.status_aktif).length;
  }, [initialAnggota]);

  const totalPinjam = useMemo(() => {
    return (initialAnggota || []).reduce((acc, a) => acc + (a?._count?.transaksi ?? 0), 0);
  }, [initialAnggota]);

  const handleDelete = async () => {
    if (!anggotaToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAnggota(anggotaToDelete.id);
      setAnggotaToDelete(null);
    } catch (e: any) {
      alert(`Gagal menghapus anggota: ${e?.message || e}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Total Anggota
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mt-2 tracking-tight">
            {initialAnggota.length}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-slate-500 mt-1 block">Semua civitas terdaftar</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Anggota Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
            {totalAktif}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-slate-500 mt-1 block">Status kartu valid</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-teal-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Pinjaman Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <BookCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-300 mt-2 tracking-tight">
            {totalPinjam}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-slate-500 mt-1 block">Buku sedang dipinjam</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-stone-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Siswa Terdaftar
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-300 mt-2 tracking-tight">
            {initialAnggota.filter((a) => a.jenis === "SISWA").length}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-slate-500 mt-1 block">Peserta didik SMK</span>
        </div>
      </div>

      {/* Barisan Jurusan (Tabs Jurusan SMKN 1 Beringin) */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-stone-200 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                Pilih Barisan Jurusan
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Klik salah satu jurusan untuk menyaring dan melihat barisan kelasnya secara rapi
              </p>
            </div>
          </div>

          {jurusanFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => handleSelectJurusan("ALL")}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 cursor-pointer transition-colors"
            >
              Reset ke Semua Jurusan
            </button>
          )}
        </div>

        {/* Tab Bar Jurusan */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {JURUSAN_TABS.map((tab) => {
            const count = jurusanCounts[tab.key] || 0;
            const isSelected = jurusanFilter === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSelectJurusan(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  isSelected
                    ? tab.activeColor
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 dark:bg-slate-950/60 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-barisan Kelas yang ada di Jurusan terpilih */}
        {availableClassesForJurusan.length > 0 && (
          <div className="pt-3 border-t border-stone-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-600 dark:text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                Barisan Kelas ({availableClassesForJurusan.length} Kelas):
              </span>
              {kelasFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setKelasFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Lihat Semua Kelas
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  setKelasFilter("ALL");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  kelasFilter === "ALL"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-stone-100 hover:bg-stone-200 dark:bg-slate-950/70 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800"
                }`}
              >
                Semua Kelas
              </button>
              {availableClassesForJurusan.map((c) => {
                const isSelected = kelasFilter === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setKelasFilter(c.name);
                      setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                        : "bg-white hover:bg-stone-100 dark:bg-slate-950/60 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-800"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? "bg-white/20 text-white font-bold"
                          : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400"
                      }`}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter, Search & Group Controls */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-stone-200 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        {/* Row 1: Role Tabs & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Role Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setJenisFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                jenisFilter === "ALL"
                  ? "bg-white text-stone-900 dark:bg-slate-800 dark:text-emerald-400 shadow-xs border border-stone-300 dark:border-slate-700 font-bold"
                  : "text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Semua ({initialAnggota.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setJenisFilter("SISWA");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                jenisFilter === "SISWA"
                  ? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Siswa ({initialAnggota.filter((a) => a.jenis === "SISWA").length})
            </button>
            <button
              type="button"
              onClick={() => {
                setJenisFilter("GURU");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                jenisFilter === "GURU"
                  ? "bg-indigo-500/15 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-500/30 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Guru ({initialAnggota.filter((a) => a.jenis === "GURU").length})
            </button>
            <button
              type="button"
              onClick={() => {
                setJenisFilter("STAF");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                jenisFilter === "STAF"
                  ? "bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Staf ({initialAnggota.filter((a) => a.jenis === "STAF").length})
            </button>
          </div>

          {/* Quick Actions (Cetak & Tambah) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/anggota/cetak-kartu"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-stone-700 hover:text-stone-900 dark:text-slate-200 text-xs font-semibold border border-stone-300/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cetak Kartu</span>
            </Link>

            <Link
              href="/admin/anggota/create"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-white" />
              <span>Tambah Anggota</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Pencarian tepat di sini, berdampingan dengan Kelompokkan per Kelas, Sort, & Status */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-3 border-t border-stone-200 dark:border-slate-800/80">
          {/* Kotak Pencarian */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                jurusanFilter !== "ALL"
                  ? `Cari nama/NISN di jurusan ${jurusanFilter}...`
                  : "Cari nama anggota, no. anggota (A0001), NISN, atau kelas..."
              }
              className="w-full h-10 pl-10 pr-14 bg-stone-50 dark:bg-slate-950/70 border border-stone-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white px-2 py-0.5 rounded-md bg-stone-200 dark:bg-slate-800 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Controls: Kelompokkan per Kelas + Sort + Status */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Toggle Kelompokkan per Kelas */}
            <button
              type="button"
              onClick={() => setGroupByKelas(!groupByKelas)}
              className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                groupByKelas
                  ? "bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-sky-500/25"
                  : "bg-stone-50 hover:bg-stone-100 text-stone-700 dark:bg-slate-950/70 dark:hover:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-800"
              }`}
              title="Kelompokkan tampilan berdasarkan sekat barisan kelas"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kelompokkan per Kelas</span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-10 px-3 bg-stone-50 dark:bg-slate-950/70 border border-stone-300 dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer shadow-xs"
              >
                <option value="NAMA_ASC">Nama (A - Z)</option>
                <option value="NAMA_DESC">Nama (Z - A)</option>
                <option value="KELAS_ASC">Urutkan Kelas</option>
                <option value="NO_ANGGOTA_ASC">No. Anggota (A0001)</option>
                <option value="TERBARU">Paling Baru Terdaftar</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-10 px-3 bg-stone-50 dark:bg-slate-950/70 border border-stone-300 dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer shadow-xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Status Aktif</option>
              <option value="NONAKTIF">Status Non-aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-stone-200 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-stone-200 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-stone-900 dark:text-white text-base">
                Daftar Anggota Perpustakaan
              </h2>
              {jurusanFilter !== "ALL" && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  {jurusanFilter}
                </span>
              )}
              {kelasFilter !== "ALL" && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {kelasFilter}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              Menampilkan{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {filteredAndSortedAnggota.length}
              </span>{" "}
              dari {initialAnggota.length} anggota
              {sortBy === "NAMA_ASC" && " · Terurut Nama A-Z"}
            </p>
          </div>

          {/* Quick Page Size Selector */}
          {!groupByKelas && (
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
              <span>Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 bg-stone-50 dark:bg-slate-950/70 border border-stone-300 dark:border-slate-800 rounded-lg text-xs text-stone-900 dark:text-slate-200 cursor-pointer"
              >
                <option value={50}>50 siswa</option>
                <option value={100}>100 siswa</option>
                <option value={250}>250 siswa</option>
                <option value={9999}>Semua ({totalItems})</option>
              </select>
            </div>
          )}
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 dark:divide-slate-800/80 text-sm">
            <thead className="bg-stone-50 dark:bg-slate-950/60 border-b border-stone-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Nama Anggota &amp; Kontak
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  No. Anggota
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Jenis &amp; Barisan Kelas
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Bergabung
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-slate-800/60">
              {groupByKelas && groupedData ? (
                // Tampilan Berkelompok per Kelas
                Array.from(groupedData.entries()).map(([kelasTitle, members]) => {
                  if (!members || members.length === 0) return null;
                  const jKey = getJurusanFromMember(members[0]);
                  const badgeStyle = getJurusanBadgeStyle(jKey);

                  return (
                    <Fragment key={kelasTitle}>
                      {/* Section Header Baris Kelas */}
                      <tr className="bg-stone-100/90 dark:bg-slate-800/80 border-y border-stone-300 dark:border-slate-700">
                        <td colSpan={6} className="px-5 py-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white uppercase tracking-wider">
                                Barisan Kelas: {kelasTitle}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
                            >
                              {members.length} Siswa
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Baris Siswa dalam Kelas ini */}
                      {members.map((a, idx) => (
                        <tr
                          key={a.id}
                          className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Nama & Kontak */}
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-stone-400 dark:text-slate-500 w-5 text-right">
                                {idx + 1}.
                              </span>
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${
                                  a.jenis === "GURU"
                                    ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                                    : a.jenis === "STAF"
                                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                }`}
                              >
                                {a.nama.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-stone-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                  {a.nama}
                                </div>
                                <div className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5 font-mono mt-0.5">
                                  {a.nisn ? (
                                    <>
                                      <span className="text-[11px] text-stone-500 font-sans">NISN:</span>
                                      <span className="text-stone-700 dark:text-slate-300">{a.nisn}</span>
                                    </>
                                  ) : a.telepon ? (
                                    <>
                                      <Phone className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                                      <span className="text-stone-700 dark:text-slate-300">{a.telepon}</span>
                                    </>
                                  ) : (
                                    <span className="text-stone-400 dark:text-slate-500 italic text-[11px]">—</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* No Anggota */}
                          <td className="px-5 py-3">
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              {a.no_anggota}
                            </span>
                          </td>

                          {/* Jenis & Kelas */}
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                                {a.kelasRef?.nama_kelas || "Tanpa Kelas"}
                              </span>
                            </div>
                          </td>

                          {/* Bergabung */}
                          <td className="px-5 py-3 text-stone-700 dark:text-slate-300 text-xs">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 shrink-0" />
                              <span>{formatDate(a.createdAt)}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3">
                            {(a._count?.transaksi ?? 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                <BookCheck className="w-3.5 h-3.5" />
                                {a._count?.transaksi} dipinjam
                              </span>
                            ) : a.status_aktif ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400 border border-stone-200 dark:border-slate-700">
                                Non-aktif
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/admin/anggota/cetak-kartu?q=${a.no_anggota}`}
                                title="Cetak Kartu Anggota"
                                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 border border-stone-200 dark:border-slate-700 text-xs font-semibold transition-colors"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Kartu</span>
                              </Link>

                              <Link
                                href={`/admin/anggota/${a.id}/edit`}
                                title="Edit Anggota"
                                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 text-xs font-semibold transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
                                <span>Edit</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => setAnggotaToDelete(a)}
                                title="Hapus Anggota"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              ) : (
                // Tampilan Standar (Flat List)
                displayedList.map((a) => {
                  const jKey = getJurusanFromMember(a);
                  const badgeStyle = getJurusanBadgeStyle(jKey);

                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Nama & Kontak */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
                              a.jenis === "GURU"
                                ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                                : a.jenis === "STAF"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {a.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-stone-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                              {a.nama}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5 font-mono mt-0.5">
                              {a.nisn ? (
                                <>
                                  <span className="text-[11px] text-stone-500 font-sans">NISN:</span>
                                  <span className="text-stone-700 dark:text-slate-300">{a.nisn}</span>
                                </>
                              ) : a.telepon ? (
                                <>
                                  <Phone className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                                  <span className="text-stone-700 dark:text-slate-300">{a.telepon}</span>
                                </>
                              ) : (
                                <span className="text-stone-400 dark:text-slate-500 italic text-[11px]">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* No Anggota */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          {a.no_anggota}
                        </span>
                      </td>

                      {/* Jenis & Kelas dengan Badge Warna Jurusan */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                              a.jenis === "GURU"
                                ? "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30"
                                : a.jenis === "STAF"
                                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {a.jenis}
                          </span>
                          {a.kelasRef ? (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md border ${badgeStyle}`}
                            >
                              {a.kelasRef.nama_kelas}
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400 dark:text-slate-500 italic">
                              Tanpa Kelas
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bergabung */}
                      <td className="px-5 py-3.5 text-stone-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 text-xs">
                          <CalendarDays className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 shrink-0" />
                          <span>{formatDate(a.createdAt)}</span>
                        </div>
                      </td>

                      {/* Status Pinjaman / Aktif */}
                      <td className="px-5 py-3.5">
                        {(a._count?.transaksi ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            <BookCheck className="w-3.5 h-3.5" />
                            {a._count?.transaksi} dipinjam
                          </span>
                        ) : a.status_aktif ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400 border border-stone-200 dark:border-slate-700">
                            Non-aktif
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/anggota/cetak-kartu?q=${a.no_anggota}`}
                            title="Cetak Kartu Anggota"
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 border border-stone-200 dark:border-slate-700 text-xs font-semibold transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Kartu</span>
                          </Link>

                          <Link
                            href={`/admin/anggota/${a.id}/edit`}
                            title="Edit Anggota"
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 text-xs font-semibold transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
                            <span>Edit</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setAnggotaToDelete(a)}
                            title="Hapus Anggota"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Card List) */}
        <div className="md:hidden divide-y divide-stone-200 dark:divide-slate-800/80">
          {groupByKelas && groupedData ? (
            Array.from(groupedData.entries()).map(([kelasTitle, members]) => {
              if (!members || members.length === 0) return null;
              const jKey = getJurusanFromMember(members[0]);
              const badgeStyle = getJurusanBadgeStyle(jKey);

              return (
                <Fragment key={kelasTitle}>
                  <div className="bg-stone-100/90 dark:bg-slate-800/90 px-4 py-2 flex items-center justify-between border-y border-stone-300 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-extrabold text-xs text-stone-900 dark:text-white uppercase truncate">
                        {kelasTitle}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeStyle}`}>
                      {members.length} Siswa
                    </span>
                  </div>

                  {members.map((a, idx) => (
                    <div
                      key={a.id}
                      className="p-4 space-y-3 hover:bg-stone-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-mono text-stone-400 dark:text-slate-500 w-4 shrink-0 text-right">
                            {idx + 1}.
                          </span>
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${
                              a.jenis === "GURU"
                                ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                                : a.jenis === "STAF"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {a.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-stone-900 dark:text-white text-sm truncate">{a.nama}</h3>
                            <p className="text-xs text-stone-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                              {a.nisn ? `NISN: ${a.nisn}` : a.telepon ? a.telepon : "—"}
                            </p>
                          </div>
                        </div>

                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                          {a.no_anggota}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.jenis === "GURU"
                              ? "bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30"
                              : a.jenis === "STAF"
                                ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {a.jenis}
                        </span>
                        {a.kelasRef && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
                            {a.kelasRef.nama_kelas}
                          </span>
                        )}
                        {(a._count?.transaksi ?? 0) > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            {a._count?.transaksi} dipinjam
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                            {a.status_aktif ? "Aktif" : "Non-aktif"}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons for Mobile */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200 dark:border-slate-800/60">
                        <Link
                          href={`/admin/anggota/cetak-kartu?q=${a.no_anggota}`}
                          className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/90 text-emerald-700 dark:text-emerald-400 border border-stone-200 dark:border-slate-700/80 text-xs font-semibold"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Kartu</span>
                        </Link>

                        <Link
                          href={`/admin/anggota/${a.id}/edit`}
                          className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/90 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700/80 text-xs font-semibold"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
                          <span>Edit</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setAnggotaToDelete(a)}
                          className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </Fragment>
              );
            })
          ) : (
            displayedList.map((a) => {
              const jKey = getJurusanFromMember(a);
              const badgeStyle = getJurusanBadgeStyle(jKey);

              return (
                <div
                  key={a.id}
                  className="p-4 space-y-3 hover:bg-stone-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
                          a.jenis === "GURU"
                            ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                            : a.jenis === "STAF"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {a.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-stone-900 dark:text-white text-sm">{a.nama}</h3>
                        <p className="text-xs text-stone-500 dark:text-slate-400 font-mono mt-0.5">
                          {a.nisn ? `NISN: ${a.nisn}` : a.telepon ? a.telepon : "—"}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {a.no_anggota}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.jenis === "GURU"
                          ? "bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30"
                          : a.jenis === "STAF"
                            ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {a.jenis}
                    </span>
                    {a.kelasRef && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
                        {a.kelasRef.nama_kelas}
                      </span>
                    )}
                    {(a._count?.transaksi ?? 0) > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        {a._count?.transaksi} dipinjam
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                        {a.status_aktif ? "Aktif" : "Non-aktif"}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons for Mobile */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200 dark:border-slate-800/60">
                    <Link
                      href={`/admin/anggota/cetak-kartu?q=${a.no_anggota}`}
                      className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/90 text-emerald-700 dark:text-emerald-400 border border-stone-200 dark:border-slate-700/80 text-xs font-semibold"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Kartu</span>
                    </Link>

                    <Link
                      href={`/admin/anggota/${a.id}/edit`}
                      className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/90 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700/80 text-xs font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setAnggotaToDelete(a)}
                      className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Empty State */}
        {filteredAndSortedAnggota.length === 0 && (
          <div className="px-6 py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-stone-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-stone-800 dark:text-slate-300 text-base">
                Tidak ada anggota ditemukan
              </p>
              <p className="text-xs text-stone-500 dark:text-slate-500 mt-0.5">
                {query || jurusanFilter !== "ALL" || kelasFilter !== "ALL"
                  ? "Coba ubah kata kunci pencarian, filter jurusan, atau barisan kelas yang aktif."
                  : "Belum ada anggota perpustakaan yang terdaftar."}
              </p>
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        {isPagingEnabled && (
          <div className="px-5 py-4 border-t border-stone-200 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-stone-500 dark:text-slate-400">
              Menampilkan baris {(activePage - 1) * pageSize + 1} -{" "}
              {Math.min(activePage * pageSize, totalItems)} dari {totalItems} siswa
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-stone-300 dark:border-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 text-xs font-bold text-stone-800 dark:text-slate-200">
                {activePage} / {totalPages}
              </div>

              <button
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-stone-300 dark:border-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete */}
      {anggotaToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setAnggotaToDelete(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">Hapus Anggota Ini?</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                Anda akan menghapus data anggota:{" "}
                <strong className="text-stone-800 dark:text-slate-200">{anggotaToDelete.nama}</strong> ({anggotaToDelete.no_anggota}).
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Anggota"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAnggotaToDelete(null)}
                className="px-5 h-11 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer border border-stone-300 dark:border-slate-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
