"use client";

import { useState } from "react";
import type { AnalyticsDashboardData } from "@/lib/analytics";
import {
  TrendingUp,
  Trophy,
  BookOpen,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Flame,
  Award,
  BarChart2,
} from "lucide-react";
import Link from "next/link";

export function AdminAnalyticsDashboard({ data }: { data: AnalyticsDashboardData }) {
  const [activeMetric, setActiveMetric] = useState<"both" | "pinjam" | "kunjungan">("both");
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const { dailyTrends, topBooks, categoryStats, jurusanStats, summary } = data;

  // Cari nilai maksimum untuk normalisasi tinggi bar
  const maxVal = Math.max(
    ...dailyTrends.map((d) => {
      if (activeMetric === "pinjam") return d.pinjamCount;
      if (activeMetric === "kunjungan") return d.kunjunganCount;
      return d.pinjamCount + d.kunjunganCount;
    }),
    6 // minimum ceiling agar chart tidak gepeng jika data baru sedikit
  );

  return (
    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-stone-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6 animate-fade-up">
      {/* Header Infografis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white tracking-tight">
                Infografis &amp; Tren Perpustakaan
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <Sparkles className="w-3 h-3" /> Live
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Analisis sirkulasi buku, kunjungan siswa, dan pemetaan minat baca
            </p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl shrink-0">
            <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 block">
              Tepat Waktu
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {summary.tingkatTepatWaktuPercent}%
            </span>
          </div>

          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 px-3 py-1.5 rounded-xl shrink-0">
            <span className="text-[10px] font-medium text-sky-700 dark:text-sky-300 block">
              Pinjam Bulan Ini
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-sky-600 dark:text-sky-400">
              {summary.totalPeminjamanBulanIni} buku
            </span>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 px-3 py-1.5 rounded-xl shrink-0">
            <span className="text-[10px] font-medium text-purple-700 dark:text-purple-300 block">
              Kunjungan Bulan Ini
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-purple-600 dark:text-purple-400">
              {summary.totalKunjunganBulanIni} siswa
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Tren 7 Hari Terakhir (7 Kolom) */}
        <div className="lg:col-span-7 bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                  Aktivitas 7 Hari Terakhir
                </h3>
              </div>

              {/* Metric Filter Tabs */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-stone-200 dark:border-slate-800 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setActiveMetric("both")}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    activeMetric === "both"
                      ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-2xs"
                      : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric("pinjam")}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    activeMetric === "pinjam"
                      ? "bg-sky-600 text-white font-bold shadow-2xs"
                      : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  Pinjam
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric("kunjungan")}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    activeMetric === "kunjungan"
                      ? "bg-purple-600 text-white font-bold shadow-2xs"
                      : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  Kunjungan
                </button>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="h-44 sm:h-48 flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-3 border-b border-stone-200 dark:border-slate-800">
                {dailyTrends.map((item, idx) => {
                  let barVal = 0;
                  if (activeMetric === "pinjam") barVal = item.pinjamCount;
                  else if (activeMetric === "kunjungan") barVal = item.kunjunganCount;
                  else barVal = item.pinjamCount + item.kunjunganCount;

                  const heightPercent = Math.max(Math.round((barVal / maxVal) * 100), barVal > 0 ? 12 : 4);
                  const isHovered = hoveredDay === idx;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDay(idx)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    >
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 bg-stone-900 text-white dark:bg-slate-800 dark:text-slate-100 text-[10px] py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in duration-150 pointer-events-none">
                          <p className="font-bold">{item.dayName}, {item.dateStr}</p>
                          <p className="text-sky-300">Pinjam: {item.pinjamCount} buku</p>
                          <p className="text-purple-300">Kunjungan: {item.kunjunganCount} siswa</p>
                        </div>
                      )}

                      {/* Bar Visual */}
                      <div className="w-full max-w-[32px] flex flex-col justify-end items-center h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-300 relative ${
                            activeMetric === "pinjam"
                              ? "bg-gradient-to-t from-sky-600 to-sky-400"
                              : activeMetric === "kunjungan"
                              ? "bg-gradient-to-t from-purple-600 to-purple-400"
                              : "bg-gradient-to-t from-indigo-600 via-sky-500 to-teal-400"
                          } ${isHovered ? "brightness-110 shadow-lg scale-102" : "opacity-90"}`}
                        >
                          {barVal > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-stone-700 dark:text-slate-300 group-hover:scale-110 transition-transform">
                              {barVal}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Day Label */}
                      <div className="mt-2 text-center">
                        <span className={`text-[10px] sm:text-xs block font-bold transition-colors ${
                          isHovered ? "text-sky-600 dark:text-sky-400" : "text-stone-600 dark:text-slate-400"
                        }`}>
                          {item.dayName}
                        </span>
                        <span className="text-[9px] text-stone-400 dark:text-slate-500 block">
                          {item.dateStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Peminjaman Buku</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Kunjungan Siswa</span>
              </div>
            </div>
            <span className="text-[10px] italic hidden sm:inline">Data diperbarui otomatis</span>
          </div>
        </div>

        {/* Kolom Kanan: Top 5 Buku Terlaris & Minat Jurusan (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top 5 Buku Populer */}
          <div className="bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                  Top 5 Buku Terlaris
                </h3>
              </div>
              <Link
                href="/admin/buku"
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {topBooks.map((b, idx) => {
                const medalColors = [
                  "bg-amber-500 text-white shadow-amber-500/30",
                  "bg-slate-400 text-white shadow-slate-400/30",
                  "bg-amber-700 text-white shadow-amber-700/30",
                  "bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300",
                  "bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300",
                ];

                return (
                  <div
                    key={b.id || idx}
                    className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 hover:border-sky-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs ${
                          medalColors[idx]
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                            {b.judul}
                          </p>
                          <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 shrink-0">
                            {b.count}x pinjam
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-slate-400 mt-0.5">
                          <span className="truncate">{b.penulis}</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 shrink-0">
                            {b.kategori}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribusi Jurusan Teraktif */}
          <div className="bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                  Partisipasi per Jurusan
                </h3>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-slate-400">
                Siswa Aktif
              </span>
            </div>

            <div className="space-y-2">
              {jurusanStats.map((j, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700 dark:text-slate-200 text-[11px]">
                      {j.jurusan}
                    </span>
                    <span className="text-stone-500 dark:text-slate-400 text-[10px] font-mono">
                      {j.count} siswa ({j.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.max(j.percentage, 5)}%`,
                        backgroundColor: j.color,
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
