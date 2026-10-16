"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ScanLine,
  BookOpen,
  Users,
  Grid,
  ArrowLeftRight,
  Boxes,
  BarChart3,
  BookCheck,
  Scan,
  QrCode,
  ExternalLink,
  LogOut,
  X,
  ChevronRight,
  Sparkles,
  School,
  FileSpreadsheet,
  MessageCircle,
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

export function AdminMobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const navItems = [
    {
      label: "Home",
      href: "/admin",
      icon: LayoutDashboard,
      isActive: pathname === "/admin",
    },
    {
      label: "Sirkulasi",
      href: "/admin/sirkulasi",
      icon: ScanLine,
      isActive: pathname.startsWith("/admin/sirkulasi"),
    },
    {
      label: "Buku",
      href: "/admin/buku",
      icon: BookOpen,
      isActive: pathname.startsWith("/admin/buku"),
    },
    {
      label: "Anggota",
      href: "/admin/anggota",
      icon: Users,
      isActive: pathname.startsWith("/admin/anggota") || pathname.startsWith("/admin/siswa"),
    },
  ];

  const quickLinks = [
    {
      category: "Sirkulasi & Peminjaman",
      items: [
        {
          name: "Sirkulasi Scanner",
          href: "/admin/sirkulasi",
          icon: ScanLine,
          color: "text-emerald-500 bg-emerald-500/10",
        },
        {
          name: "Transaksi Manual & Paket",
          href: "/admin/transaksi",
          icon: ArrowLeftRight,
          color: "text-sky-500 bg-sky-500/10",
        },
        {
          name: "Buku Kunjungan",
          href: "/admin/kunjungan",
          icon: BookCheck,
          color: "text-cyan-500 bg-cyan-500/10",
        },
        {
          name: "Layar Kios Presensi",
          href: "/kiosk",
          icon: QrCode,
          color: "text-blue-500 bg-blue-500/10",
          external: true,
        },
        {
          name: "Notifikasi WhatsApp",
          href: "/admin/whatsapp",
          icon: MessageCircle,
          color: "text-emerald-500 bg-emerald-500/10",
        },
      ],
    },
    {
      category: "Koleksi & Inventaris",
      items: [
        {
          name: "Kelola Koleksi Buku",
          href: "/admin/buku",
          icon: BookOpen,
          color: "text-purple-500 bg-purple-500/10",
        },
        {
          name: "Scan Masuk ISBN",
          href: "/admin/buku/scan",
          icon: Scan,
          color: "text-teal-500 bg-teal-500/10",
        },
        {
          name: "Import Data Buku",
          href: "/admin/buku/import",
          icon: FileSpreadsheet,
          color: "text-emerald-500 bg-emerald-500/10",
        },
        {
          name: "Stock Opname (Audit)",
          href: "/admin/stock-opname",
          icon: Boxes,
          color: "text-indigo-500 bg-indigo-500/10",
        },
      ],
    },
    {
      category: "Anggota & Laporan",
      items: [
        {
          name: "Data Anggota (Semua)",
          href: "/admin/anggota",
          icon: Users,
          color: "text-emerald-500 bg-emerald-500/10",
        },
        {
          name: "Cetak Kartu Siswa/Guru",
          href: "/admin/anggota/cetak-kartu",
          icon: QrCode,
          color: "text-teal-500 bg-teal-500/10",
        },
        {
          name: "Data Kelas & Siswa",
          href: "/admin/siswa",
          icon: School,
          color: "text-blue-500 bg-blue-500/10",
        },
        {
          name: "Laporan & Statistik",
          href: "/admin/laporan",
          icon: BarChart3,
          color: "text-amber-500 bg-amber-500/10",
        },
      ],
    },
  ];

  return (
    <>
      {/* Bottom Safe Spacing Provider (Prevents page content from being clipped) */}
      <div className="h-18 md:hidden pointer-events-none" aria-hidden="true" />

      {/* Floating Bottom Nav Dock */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-stone-200/90 dark:border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Navigasi Menu Mobile"
      >
        <div className="grid grid-cols-5 items-center h-14 max-w-lg mx-auto px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 ${
                  item.isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 font-medium"
                }`}
              >
                <div
                  className={`relative p-1 rounded-xl transition-all ${
                    item.isActive
                      ? "bg-emerald-500/15 dark:bg-emerald-500/20 scale-105"
                      : "hover:bg-stone-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs" />
                  )}
                </div>
                <span className="text-[10px] leading-tight mt-0.5 tracking-tight truncate max-w-[58px]">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More Menu Drawer Trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 cursor-pointer ${
              drawerOpen
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 font-medium"
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                drawerOpen
                  ? "bg-emerald-500/15 dark:bg-emerald-500/20 scale-105"
                  : "hover:bg-stone-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Grid className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5 tracking-tight">Menu</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet Drawer for All Admin Modules */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-fade-up overflow-hidden">
            {/* Grabber Bar & Header */}
            <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-stone-50/70 dark:bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white leading-tight">
                    Semua Modul &amp; Layanan
                  </h3>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400">
                    Sistem Perpustakaan SMKN 1 Beringin
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Links List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {quickLinks.map((group) => (
                <div key={group.category} className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600 dark:text-slate-400 block px-1">
                    {group.category}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all text-xs font-semibold ${
                            active
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs"
                              : "bg-stone-50 dark:bg-slate-800/60 text-stone-700 dark:text-slate-200 border-stone-200/80 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate leading-snug">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Extra External & Utility Links */}
              <div className="pt-2 border-t border-stone-200 dark:border-slate-800 grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Katalog Publik</span>
                </Link>

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
