import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Clock,
  BarChart3,
  ArrowLeft,
  FileSpreadsheet,
  Printer,
  QrCode,
  Search,
  ExternalLink,
} from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { HeaderBar } from "../components/HeaderBar";

export const SceneStatistikPengunjung: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const containerAnim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 90 },
  });

  const cardStagger = (idx: number) =>
    spring({
      frame: frame - 12 - idx * 3,
      fps,
      config: { damping: 12, mass: 0.75, stiffness: 100 },
    });

  const bannerAnim = spring({
    frame: frame - 35,
    fps,
    config: { damping: 13, mass: 0.85, stiffness: 90 },
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        color: "#ffffff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "108px 44px 20px 44px",
        boxSizing: "border-box",
      }}
    >
      <BackgroundGrid accentColor="#38bdf8" />
      <HeaderBar categoryTitle="Rekapitulasi Otomatis" badgeText="Statistik Live Presensi" />

      {/* Top Navbar */}
      <div
        style={{
          width: "100%",
          maxWidth: "1440px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 22px",
          borderRadius: "18px",
          backgroundColor: "rgba(10, 16, 30, 0.85)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          backdropFilter: "blur(20px)",
          marginBottom: "14px",
          transform: `translateY(${interpolate(containerAnim, [0, 1], [-20, 0])}px)`,
          opacity: containerAnim,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "12px",
              fontWeight: 700,
              color: "#cbd5e1",
            }}
          >
            <ArrowLeft size={14} color="#38bdf8" />
            <span>Dashboard</span>
          </div>

          <span style={{ color: "#475569" }}>/</span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Img
              src={staticFile("assets/logo.png")}
              style={{ width: "28px", height: "28px", objectFit: "contain" }}
            />
            <Img
              src={staticFile("assets/logo-kolaborasi.png")}
              style={{ height: "24px", objectFit: "contain" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "4px" }}>
              <h1 style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff", margin: 0 }}>
                Statistik Pengunjung
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(14, 165, 233, 0.2)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#38bdf8",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "#38bdf8",
                  }}
                />
                LIVE
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              fontSize: "12px",
              fontWeight: 800,
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
            }}
          >
            <QrCode size={14} />
            <span>Buka Kios Scanner</span>
            <ExternalLink size={12} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "10px",
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#cbd5e1",
            }}
          >
            <FileSpreadsheet size={14} color="#34d399" />
            <span>Ekspor CSV</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "10px",
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#cbd5e1",
            }}
          >
            <Printer size={14} color="#60a5fa" />
            <span>Cetak PDF</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "1440px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          transform: `scale(${interpolate(containerAnim, [0, 1], [0.95, 1])})`,
          opacity: containerAnim,
        }}
      >
        {/* Filters and Date Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "10px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>Periode:</span>
            {["Semua Waktu", "Bulan Ini", "Minggu Ini", "Hari Ini"].map((tab, idx) => (
              <span
                key={idx}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  backgroundColor: tab === "Bulan Ini" ? "#0284c7" : "rgba(255, 255, 255, 0.05)",
                  color: tab === "Bulan Ini" ? "#ffffff" : "#94a3b8",
                  fontSize: "12px",
                  fontWeight: 700,
                  boxShadow: tab === "Bulan Ini" ? "0 4px 12px rgba(2, 132, 199, 0.4)" : "none",
                }}
              >
                {tab}
              </span>
            ))}
          </div>

          <div
            style={{
              width: "320px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: "8px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            <Search size={14} />
            <span>Cari nama, kelas, atau keperluan...</span>
          </div>
        </div>

        {/* Highlight Blue Banner */}
        <div
          style={{
            background: "linear-gradient(90deg, #1d4ed8 0%, #2563eb 60%, #0284c7 100%)",
            borderRadius: "16px",
            padding: "14px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QrCode size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
                Layar Presensi Kios Mandiri (Scan QR &amp; Barcode)
              </div>
              <div style={{ fontSize: "12px", color: "#bfdbfe" }}>
                Pengunjung dapat memindai kartu fisik / QR Code langsung di mesin scanner meja secara mandiri.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "8px 18px",
              backgroundColor: "#ffffff",
              color: "#1e3a8a",
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Buka Layar Kios Fullscreen</span>
            <ExternalLink size={14} />
          </div>
        </div>

        {/* 6 Analytics Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
          {[
            {
              title: "Total Kunjungan",
              val: "21",
              sub: "Rekap realtime",
              icon: <Users size={18} color="#38bdf8" />,
              accent: "#38bdf8",
            },
            {
              title: "Pengunjung Unik",
              val: "2",
              sub: "10% dari total",
              icon: <UserCheck size={18} color="#818cf8" />,
              accent: "#818cf8",
            },
            {
              title: "Rata-rata / Hari",
              val: "2",
              sub: "Siswa per hari",
              icon: <Calendar size={18} color="#38bdf8" />,
              accent: "#38bdf8",
            },
            {
              title: "Hari Teramai",
              val: "20",
              sub: "5 Okt 2026",
              icon: <TrendingUp size={18} color="#f59e0b" />,
              accent: "#f59e0b",
            },
            {
              title: "Jam Teramai",
              val: "09:00",
              sub: "16 kunjungan",
              icon: <Clock size={18} color="#f472b6" />,
              accent: "#f472b6",
            },
            {
              title: "Jenis Keperluan",
              val: "1",
              sub: "Membaca Buku",
              icon: <BarChart3 size={18} color="#34d399" />,
              accent: "#34d399",
            },
          ].map((card, i) => {
            const anim = cardStagger(i);
            return (
              <div
                key={i}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "16px 18px",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
                  transform: `translateY(${interpolate(anim, [0, 1], [20, 0])}px)`,
                  opacity: anim,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
                    {card.title}
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: 900, color: card.accent, margin: "4px 0 2px 0" }}>
                  {card.val}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Growth Banner */}
        <div
          style={{
            backgroundColor: "rgba(10, 16, 30, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "14px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            transform: `translateY(${interpolate(bannerAnim, [0, 1], [20, 0])}px)`,
            opacity: bannerAnim,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                Pertumbuhan Kunjungan Bulan Ini
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                21 kunjungan terekam otomatis di bulan ini
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "6px 16px",
              borderRadius: "999px",
              backgroundColor: "rgba(14, 165, 233, 0.2)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              color: "#38bdf8",
              fontSize: "13px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <TrendingUp size={16} />
            <span>+600% dari bulan lalu</span>
          </div>
        </div>
      </div>
    </div>
  );
};
