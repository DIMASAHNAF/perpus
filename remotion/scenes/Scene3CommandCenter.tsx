import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ScanLine,
  ArrowLeftRight,
  Barcode,
  BookMarked,
  Users2,
  FileBarChart,
  MonitorCheck,
  ChevronRight,
} from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { HeaderBar } from "../components/HeaderBar";

export const Scene3CommandCenter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerAnim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 90 },
  });

  const cardsStagger = (index: number) =>
    spring({
      frame: frame - 15 - index * 4,
      fps,
      config: { damping: 13, mass: 0.8, stiffness: 100 },
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
        justifyContent: "center",
      }}
    >
      <BackgroundGrid accentColor="#3b82f6" />
      <HeaderBar categoryTitle="Command Center Pengelola" badgeText="Admin Dashboard" />

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
          transform: `translateY(${interpolate(containerAnim, [0, 1], [30, 0])}px)`,
          opacity: containerAnim,
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#60a5fa",
            textTransform: "uppercase",
          }}
        >
          Pusat Kontrol Perpustakaan
        </span>
        <h2
          style={{
            fontSize: "42px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "6px 0 0 0",
          }}
        >
          Command Center & Modul Sirkulasi Lengkap
        </h2>
      </div>

      {/* Main Dashboard UI Mockup Frame */}
      <div
        style={{
          width: "1400px",
          backgroundColor: "rgba(10, 15, 29, 0.88)",
          borderRadius: "24px",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          padding: "28px 36px",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(24px)",
          transform: `scale(${interpolate(containerAnim, [0, 1], [0.93, 1])})`,
          opacity: containerAnim,
        }}
      >
        {/* Top 5 Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "22px" }}>
          {[
            { label: "TOTAL KOLEKSI", val: "7", sub: "Judul terdaftar", color: "#ffffff" },
            { label: "TOTAL EKSEMPLAR", val: "24", sub: "Copy fisik", color: "#38bdf8" },
            { label: "SEDANG DIPINJAM", val: "0", sub: "Buku aktif", color: "#60a5fa" },
            { label: "TOTAL ANGGOTA", val: "5", sub: "Siswa & Staf", color: "#38bdf8" },
            { label: "DENDA BELUM BAYAR", val: "Rp 0", sub: "Total tertunggak", color: "#f87171" },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "rgba(18, 25, 44, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: stat.color, margin: "4px 0" }}>
                {stat.val}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Featured Kiosk Blue Banner */}
        <div
          style={{
            background: "linear-gradient(90deg, #1d4ed8 0%, #2563eb 60%, #0284c7 100%)",
            borderRadius: "18px",
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            boxShadow: "0 12px 30px rgba(37, 99, 235, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                backgroundColor: "rgba(255, 255, 255, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MonitorCheck size={28} color="#ffffff" />
            </div>
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                KIOSK MEJA DEPAN
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff" }}>
                Layar Kios Presensi Mandiri
              </div>
              <div style={{ fontSize: "13px", color: "#bfdbfe" }}>
                Buka layar penuh di monitor meja depan untuk scan QR & Barcode pengunjung otomatis.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#ffffff",
              color: "#1e3a8a",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Buka Layar Kios <ChevronRight size={18} />
          </div>
        </div>

        {/* 6 Grid Navigation Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            {
              icon: <ScanLine size={22} color="#38bdf8" />,
              badge: "SCANNER CEPAT",
              title: "Sirkulasi Scanner",
              desc: "Scan kartu anggota & buku untuk pinjam/kembali instan.",
            },
            {
              icon: <ArrowLeftRight size={22} color="#60a5fa" />,
              title: "Transaksi Pinjam/Kembali",
              desc: "Input peminjaman custom durasi & catat denda keterlambatan.",
            },
            {
              icon: <Barcode size={22} color="#34d399" />,
              badge: "AUTO-FETCH ISBN",
              title: "Scan Cepat Masuk Buku",
              desc: "Tembak barcode buku fisik -> otomatis isi metadata & stok.",
            },
            {
              icon: <BookMarked size={22} color="#38bdf8" />,
              title: "Kelola Koleksi Buku",
              desc: "Daftar buku, edit, import massal Excel, & cetak label.",
            },
            {
              icon: <Users2 size={22} color="#818cf8" />,
              title: "Kelola Anggota",
              desc: "Database siswa, guru, staf, & cetak kartu perpustakaan.",
            },
            {
              icon: <FileBarChart size={22} color="#f472b6" />,
              title: "Laporan & Ekspor Data",
              desc: "Rekap sirkulasi, unduh Excel CSV, dan cetak PDF resmi.",
            },
          ].map((item, idx) => {
            const anim = cardsStagger(idx);
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: "rgba(18, 25, 44, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  transform: `translateY(${interpolate(anim, [0, 1], [20, 0])}px)`,
                  opacity: anim,
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>
                      {item.title}
                    </div>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          backgroundColor: "rgba(56, 189, 248, 0.15)",
                          color: "#38bdf8",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
