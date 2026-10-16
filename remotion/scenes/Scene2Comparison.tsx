import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  XCircle,
  CheckCircle2,
  FileSpreadsheet,
  Zap,
  History,
  ShieldAlert,
  Sparkles,
  QrCode,
  TrendingUp,
} from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { HeaderBar } from "../components/HeaderBar";
import { LightSweep } from "../components/LightSweep";

export const Scene2Comparison: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleAnim = spring({
    frame,
    fps,
    config: { damping: 13, mass: 0.85, stiffness: 95 },
  });

  const cardManualAnim = spring({
    frame: frame - 12,
    fps,
    config: { damping: 13, mass: 0.9, stiffness: 90 },
  });

  const cardDigitalAnim = spring({
    frame: frame - 22,
    fps,
    config: { damping: 13, mass: 0.9, stiffness: 90 },
  });

  const vsAnim = spring({
    frame: frame - 18,
    fps,
    config: { damping: 10, mass: 0.7, stiffness: 140 },
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
        perspective: "1200px",
      }}
    >
      <BackgroundGrid accentColor="#2563eb" secondaryColor="#3b82f6" />
      <HeaderBar categoryTitle="Komparasi Efisiensi Sistem" badgeText="Transformasi Digital" />

      {/* Header text */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "36px",
          transform: `translateY(${interpolate(titleAnim, [0, 1], [30, 0])}px)`,
          opacity: titleAnim,
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.2em",
            color: "#38bdf8",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "9999px",
            backgroundColor: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            marginBottom: "8px",
          }}
        >
          <Sparkles size={14} /> Solusi Masa Kini
        </div>
        <h2
          style={{
            fontSize: "52px",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: "4px 0 0 0",
          }}
        >
          Metode Konvensional <span style={{ color: "#64748b", fontWeight: 400 }}>vs</span> Sistem Mandiri Pintar
        </h2>
      </div>

      {/* Cards comparison container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          width: "1380px",
          justifyContent: "center",
        }}
      >
        {/* Left: Manual / Fisik (Muted Red) */}
        <div
          style={{
            flex: 1,
            padding: "36px 36px",
            borderRadius: "28px",
            backgroundColor: "rgba(23, 14, 18, 0.8)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            backdropFilter: "blur(18px)",
            transform: `translateY(${interpolate(cardManualAnim, [0, 1], [40, 0])}px) rotateY(6deg)`,
            opacity: cardManualAnim,
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldAlert size={26} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fca5a5" }}>
                  Buku Kunjungan Fisik
                </h3>
                <span style={{ fontSize: "12px", color: "#f87171", fontWeight: 600 }}>Pencatatan Manual Tulis Tangan</span>
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                padding: "6px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              TIDAK EFISIEN
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { title: "Antrean Panjang di Meja", desc: "Siswa harus mengantre untuk menulis nama satu per satu" },
              { title: "Buku Tamu Cepat Rusak & Hilang", desc: "Kertas tercecer, tulisan sulit dibaca, dan tidak rapi" },
              { title: "Rekap Laporan Bulanan Lambat", desc: "Petugas harus menghitung dan mengetik ulang ratusan lembar" },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "14px 18px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                }}
              >
                <XCircle size={20} color="#ef4444" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#fecaca" }}>{item.title}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center VS Element */}
        <div
          style={{
            transform: `scale(${vsAnim})`,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "2px solid #38bdf8",
              boxShadow: "0 0 30px rgba(56, 189, 248, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            VS
          </div>
        </div>

        {/* Right: Digital Modern (Glowing Blue/Cyan) */}
        <div
          style={{
            flex: 1,
            padding: "36px 36px",
            borderRadius: "28px",
            backgroundColor: "rgba(12, 24, 48, 0.85)",
            border: "2px solid rgba(56, 189, 248, 0.6)",
            backdropFilter: "blur(20px)",
            transform: `translateY(${interpolate(cardDigitalAnim, [0, 1], [40, 0])}px) rotateY(-6deg)`,
            opacity: cardDigitalAnim,
            boxShadow: "0 20px 60px rgba(37, 99, 235, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(56, 189, 248, 0.2)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={26} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Presensi Kiosk Digital
                </h3>
                <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>Scan QR Code / Barcode Otomatis</span>
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#38bdf8",
                backgroundColor: "rgba(56, 189, 248, 0.2)",
                padding: "6px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(56, 189, 248, 0.4)",
              }}
            >
              10X LEBIH CEPAT
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { title: "Scan Cepat 1 Detik", desc: "Cukup dekatkan kartu anggota langsung tercatat seketika" },
              { title: "Akumulasi Statistik Live", desc: "Data pengunjung otomatis tersimpan & terekap grafiknya" },
              { title: "Paperless & Ramah Lingkungan", desc: "Tanpa kertas, hemat biaya, dan data aman selamanya di cloud" },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "14px 18px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                }}
              >
                <CheckCircle2 size={20} color="#34d399" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>{item.title}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
