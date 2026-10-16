"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  LayoutList,
  ScanLine,
  ArrowLeftRight,
  QrCode,
  BookOpen,
  Scan,
  Boxes,
  Users,
  BarChart3,
  BookCheck,
  ChevronRight,
  MessageCircle,
  Search,
  X,
} from "lucide-react";

type CategoryTab = "ALL" | "SIRKULASI" | "KOLEKSI" | "ANGGOTA" | "LAPORAN";
type ViewMode = "list" | "grid";

export function AdminDashboardMenuClient() {
  const [activeTab, setActiveTab] = useState<CategoryTab>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const menuSections = [
    {
      id: "SIRKULASI",
      title: "Layanan & Sirkulasi Meja Depan",
      badge: "Operasional Harian",
      badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-500 shadow-emerald-500/50",
      items: [
        {
          title: "Sirkulasi Scanner",
          desc: "Scan kartu anggota ➔ scan buku: pinjam & kembali instan",
          href: "/admin/sirkulasi",
          tag: "SCANNER CEPAT",
          tagColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          icon: ScanLine,
          iconColor: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
          borderHover: "hover:border-emerald-500/70 dark:hover:border-emerald-500/70",
          bgHighlight: "bg-emerald-50/40 dark:bg-slate-900/90",
        },
        {
          title: "Transaksi Pinjam / Kembali",
          desc: "Input durasi custom, pengembalian buku, dan kelola denda",
          href: "/admin/transaksi",
          tag: "MANUAL / PAKET",
          tagColor: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
          icon: ArrowLeftRight,
          iconColor: "bg-sky-500/20 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white",
          borderHover: "hover:border-sky-500/70 dark:hover:border-sky-500/70",
          bgHighlight: "bg-white/90 dark:bg-slate-900/90",
        },
        {
          title: "Layar Kios Presensi",
          desc: "Buka layar monitor depan untuk scan QR & barcode mandiri",
          href: "/kiosk",
          target: "kiosk_presensi",
          tag: "MONITOR DEPAN",
          tagColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
          icon: QrCode,
          iconColor: "bg-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white",
          borderHover: "hover:border-blue-500/70 dark:hover:border-blue-500/70",
          bgHighlight: "bg-white/90 dark:bg-slate-900/90",
        },
        {
          title: "Notifikasi & Pengingat WhatsApp",
          desc: "Kirim pengingat jatuh tempo, tagihan denda, & broadcast pesan ke siswa",
          href: "/admin/whatsapp",
          tag: "WHATSAPP & BROADCAST",
          tagColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          icon: MessageCircle,
          iconColor: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
          borderHover: "hover:border-emerald-500/70 dark:hover:border-emerald-500/70",
          bgHighlight: "bg-emerald-50/40 dark:bg-slate-900/90",
        },
      ],
    },
    {
      id: "KOLEKSI",
      title: "Manajemen Koleksi & Audit Fisik",
      badge: "Katalog & Inventaris",
      badgeColor: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
      dotColor: "bg-indigo-500 shadow-indigo-500/50",
      items: [
        {
          title: "Kelola Koleksi Buku",
          desc: "Katalog judul, edit, import massal, dan baca 3D E-Book",
          href: "/admin/buku",
          tag: "KATALOG & E-BOOK",
          tagColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
          icon: BookOpen,
          iconColor: "bg-purple-500/20 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white",
          borderHover: "hover:border-purple-500/70 dark:hover:border-purple-500/70",
          bgHighlight: "bg-white/90 dark:bg-slate-900/90",
        },
        {
          title: "Scan Cepat Masuk Buku",
          desc: "Tembak barcode ISBN fisik ➔ auto input metadata & stok",
          href: "/admin/buku/scan",
          tag: "AUTO-FETCH ISBN",
          tagColor: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
          icon: Scan,
          iconColor: "bg-teal-500/20 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white",
          borderHover: "hover:border-teal-500/70 dark:hover:border-teal-500/70",
          bgHighlight: "bg-teal-50/40 dark:bg-slate-900/90",
        },
        {
          title: "Stock Opname Koleksi",
          desc: "Audit buku fisik per rak, temukan salah rak & rekonsiliasi",
          href: "/admin/stock-opname",
          tag: "AUDIT FISIK RAK",
          tagColor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
          icon: Boxes,
          iconColor: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white",
          borderHover: "hover:border-indigo-500/70 dark:hover:border-indigo-500/70",
          bgHighlight: "bg-indigo-50/40 dark:bg-slate-900/90",
        },
      ],
    },
    {
      id: "ANGGOTA",
      title: "Data Anggota Perpustakaan",
      badge: "Siswa, Guru & Staf",
      badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      dotColor: "bg-amber-500 shadow-amber-500/50",
      items: [
        {
          title: "Kelola Anggota",
          desc: "Data Siswa/Guru/Staf, tanggal bergabung, & cetak kartu barcode",
          href: "/admin/anggota",
          tag: "KARTU DIGITAL",
          tagColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
          icon: Users,
          iconColor: "bg-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white",
          borderHover: "hover:border-amber-500/70 dark:hover:border-amber-500/70",
          bgHighlight: "bg-white/90 dark:bg-slate-900/90",
        },
      ],
    },
    {
      id: "LAPORAN",
      title: "Laporan & Rekapitulasi",
      badge: "Analitik Data",
      badgeColor: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
      dotColor: "bg-rose-500 shadow-rose-500/50",
      items: [
        {
          title: "Statistik Pengunjung",
          desc: "Grafik traffic harian & analisis aktivitas pengunjung",
          href: "/admin/kunjungan",
          tag: "TRAFFIC HARIAN",
          tagColor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
          icon: BarChart3,
          iconColor: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white",
          borderHover: "hover:border-cyan-500/70 dark:hover:border-cyan-500/70",
          bgHighlight: "bg-white/90 dark:bg-slate-900/90",
        },
        {
          title: "Laporan & Ekspor Data",
          desc: "Rekap sirkulasi, unduh Excel CSV, dan cetak PDF resmi",
          href: "/admin/laporan",
          tag: "EXCEL & PDF",
          tagColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          icon: BookCheck,
          iconColor: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
          borderHover: "hover:border-emerald-500/70 dark:hover:border-emerald-500/70",
          bgHighlight: "bg-white/90 dark:bg-slate-900/90",
        },
      ],
    },
  ];

  const q = searchQuery.toLowerCase().trim();

  const filteredSections = menuSections
    .map((sec) => {
      const items = sec.items.filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.tag.toLowerCase().includes(q)
        );
      });
      return { ...sec, items };
    })
    .filter((sec) => {
      if (activeTab !== "ALL" && sec.id !== activeTab) return false;
      return sec.items.length > 0;
    });

  const totalMatchingItems = filteredSections.reduce((acc, sec) => acc + sec.items.length, 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Quick Search Command Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu, layanan, buku, anggota... (Tekan Ctrl + K)"
            className="w-full h-10 sm:h-11 pl-10 pr-24 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-stone-200/90 dark:border-slate-800 text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
          <div className="absolute right-3 flex items-center gap-1.5 pointer-events-auto">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-slate-700/80 font-mono text-[10px] font-semibold select-none">
              <span className="text-[11px]">Ctrl</span>K
            </kbd>
          </div>
        </div>

        {/* Quick Jump Links when typing search */}
        {q.length >= 2 && (
          <div className="mt-2 p-2 rounded-xl bg-stone-100/90 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700/80 flex flex-wrap items-center gap-2 text-xs animate-fade-in">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
              Lompat ke pencarian data:
            </span>
            <Link
              href={`/admin/buku?q=${encodeURIComponent(q)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-stone-200 dark:border-slate-700 shadow-2xs font-medium transition-colors"
            >
              <BookOpen className="w-3 h-3 text-purple-500" />
              <span>Buku: &quot;{q}&quot;</span>
            </Link>
            <Link
              href={`/admin/anggota?q=${encodeURIComponent(q)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-stone-200 dark:border-slate-700 shadow-2xs font-medium transition-colors"
            >
              <Users className="w-3 h-3 text-amber-500" />
              <span>Anggota: &quot;{q}&quot;</span>
            </Link>
            <Link
              href={`/admin/transaksi?q=${encodeURIComponent(q)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-stone-200 dark:border-slate-700 shadow-2xs font-medium transition-colors"
            >
              <ArrowLeftRight className="w-3 h-3 text-sky-500" />
              <span>Transaksi: &quot;{q}&quot;</span>
            </Link>
          </div>
        )}
      </div>

      {/* Category Pills & View Switcher Bar */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0 pr-3">
          {[
            { id: "ALL", label: "Semua Menu", icon: LayoutGrid, iconColor: "text-amber-500" },
            { id: "SIRKULASI", label: "Sirkulasi & Meja Depan", icon: ScanLine, iconColor: "text-emerald-500" },
            { id: "KOLEKSI", label: "Koleksi & Audit", icon: BookOpen, iconColor: "text-indigo-500" },
            { id: "ANGGOTA", label: "Anggota", icon: Users, iconColor: "text-amber-500" },
            { id: "LAPORAN", label: "Laporan", icon: BarChart3, iconColor: "text-cyan-500" },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CategoryTab)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  isSelected
                    ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900 shadow-md shadow-black/10 scale-102"
                    : "bg-white/80 dark:bg-slate-900/80 text-stone-600 dark:text-slate-300 border border-stone-200/90 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800"
                }`}
              >
                <TabIcon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? "text-emerald-400 dark:text-emerald-600" : tab.iconColor
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Switcher (List vs Grid) */}
        <div className="flex items-center bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl border border-stone-200/90 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
            }`}
            title="Tampilan List Panel"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
            }`}
            title="Tampilan Grid Card"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Opsi 3: Grouped Panel Horizontal List View */}
      {viewMode === "list" ? (
        <div className="space-y-6">
          {filteredSections.map((sec) => (
            <div
              key={sec.id}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:border-stone-300 dark:hover:border-slate-700/80"
            >
              {/* Panel Header */}
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-stone-50/70 dark:bg-slate-900/90 border-b border-stone-200/80 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${sec.dotColor || "bg-emerald-500"}`} />
                  <h2 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white tracking-tight">
                    {sec.title}
                  </h2>
                  <span
                    className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${sec.badgeColor}`}
                  >
                    {sec.badge}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
                  {sec.items.length} Menu
                </span>
              </div>

              {/* Rows List */}
              <div className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {sec.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      target={item.target}
                      className="group px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3 sm:gap-4 hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      {/* Icon Container */}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-stone-200 dark:border-slate-700/60 flex items-center justify-center shrink-0 transition-colors shadow-2xs ${item.iconColor}`}
                      >
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      {/* Title & Desc */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {item.title}
                          </span>
                          <span
                            className={`sm:hidden text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider ${item.tagColor}`}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>

                      {/* Tag & Action */}
                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                        <span
                          className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider ${item.tagColor}`}
                        >
                          {item.tag}
                        </span>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-100 dark:bg-slate-800/80 group-hover:bg-emerald-600 text-stone-400 dark:text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs">
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Legacy Grid View */
        <div className="space-y-6 sm:space-y-8">
          {filteredSections.map((sec) => (
            <div key={sec.id} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${sec.dotColor || "bg-emerald-500"}`} />
                  <h2 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white">
                    {sec.title}
                  </h2>
                  <span
                    className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sec.badgeColor}`}
                  >
                    {sec.badge}
                  </span>
                </div>
              </div>

              {/* Section Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {sec.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      target={item.target}
                      className={`group p-4 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${item.bgHighlight} ${item.borderHover}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl border border-stone-200 dark:border-slate-700/60 flex items-center justify-center transition-colors shadow-xs ${item.iconColor}`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider ${item.tagColor}`}
                          >
                            {item.tag}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-stone-900 dark:text-white text-sm sm:text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-stone-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <span>Buka Fitur</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State when Search Matches No Menus */}
      {totalMatchingItems === 0 && (
        <div className="py-12 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-stone-200/90 dark:border-slate-800 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-stone-400 dark:text-slate-500">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">
              Tidak ada menu yang cocok
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
              Tidak ditemukan menu dengan kata kunci &quot;{searchQuery}&quot;. Coba gunakan kata kunci lain.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveTab("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Reset Pencarian</span>
          </button>
        </div>
      )}
    </div>
  );
}
