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
  BookOpen,
  BookMarked,
  GraduationCap,
  Laptop,
  Compass,
  QrCode,
  CheckCircle2,
  Scan,
  Users,
  Sparkles,
} from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { HeaderBar } from "../components/HeaderBar";
import { LightSweep } from "../components/LightSweep";

export const Scene4KioskPresensi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const containerAnim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 90 },
  });

  // Card sliding in
  const cardSlide = spring({
    frame: frame - 18,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 90 },
  });

  // Laser scanning effect (frame 40 to 85)
  const laserProgress = interpolate(frame, [40, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const laserY = interpolate(laserProgress, [0, 1], [0, 220]);

  // Success modal popup (frame 85+)
  const successAnim = spring({
    frame: frame - 85,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 120 },
  });

  const visitorCount = frame > 88 ? 21 : 20;

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
      <BackgroundGrid accentColor="#0284c7" secondaryColor="#2563eb" />
      <HeaderBar categoryTitle="Alur Pengunjung & Siswa" badgeText="Kiosk Live Presensi" />

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "18px",
          transform: `translateY(${interpolate(containerAnim, [0, 1], [30, 0])}px)`,
          opacity: containerAnim,
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 800,
            letterSpacing: "0.2em",
            color: "#38bdf8",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
          }}
        >
          <Sparkles size={14} /> Kios Presensi Mandiri
        </span>
        <h2
          style={{
            fontSize: "44px",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: "4px 0 0 0",
          }}
        >
          Scan Cepat 1 Detik di Mesin Kios Meja Depan
        </h2>
      </div>

      {/* Kiosk Interface Mockup */}
      <div
        style={{
          width: "1380px",
          backgroundColor: "rgba(10, 18, 38, 0.9)",
          borderRadius: "26px",
          border: "1.5px solid rgba(56, 189, 248, 0.35)",
          padding: "26px 34px",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(24px)",
          transform: `scale(${interpolate(containerAnim, [0, 1], [0.92, 1])})`,
          opacity: containerAnim,
          position: "relative",
        }}
      >
        {/* Step 1: Keperluan Kunjungan Bar */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#94a3b8", marginBottom: "10px" }}>
            Pilih Keperluan Kunjungan Sebelum Scan:
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { label: "Membaca Buku", active: true, icon: <BookOpen size={16} /> },
              { label: "Pinjam / Kembali", active: false, icon: <BookMarked size={16} /> },
              { label: "Tugas & Belajar", active: false, icon: <GraduationCap size={16} /> },
              { label: "Komputer & Digital", active: false, icon: <Laptop size={16} /> },
              { label: "Kunjungan Bebas", active: false, icon: <Compass size={16} /> },
            ].map((btn, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  backgroundColor: btn.active ? "#2563eb" : "rgba(255, 255, 255, 0.04)",
                  border: btn.active ? "1px solid #60a5fa" : "1px solid rgba(255, 255, 255, 0.08)",
                  color: btn.active ? "#ffffff" : "#94a3b8",
                  fontWeight: 700,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: btn.active ? "0 8px 20px rgba(37, 99, 235, 0.4)" : "none",
                }}
              >
                {btn.icon}
                {btn.label}
                {btn.active && (
                  <span style={{ fontSize: "10px", backgroundColor: "rgba(255,255,255,0.25)", padding: "2px 6px", borderRadius: "4px" }}>
                    ✓ AKTIF
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main 2-column layout: Scanner Area vs Live Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
          {/* Scanner Box */}
          <div
            style={{
              height: "340px",
              borderRadius: "20px",
              backgroundColor: "rgba(7, 12, 26, 0.85)",
              border: "2px dashed rgba(56, 189, 248, 0.4)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Target Reticle */}
            <div
              style={{
                width: "280px",
                height: "190px",
                position: "relative",
                border: "2px solid rgba(56, 189, 248, 0.3)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Corner markers */}
              <div style={{ position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTop: "4px solid #38bdf8", borderLeft: "4px solid #38bdf8" }} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTop: "4px solid #38bdf8", borderRight: "4px solid #38bdf8" }} />
              <div style={{ position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottom: "4px solid #38bdf8", borderLeft: "4px solid #38bdf8" }} />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottom: "4px solid #38bdf8", borderRight: "4px solid #38bdf8" }} />

              {/* Simulated Student Card Slide-In */}
              <div
                style={{
                  width: "240px",
                  height: "145px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0f1c3f 0%, #071329 100%)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  padding: "10px 14px",
                  boxShadow: "0 15px 30px rgba(0,0,0,0.6)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transform: `translateY(${interpolate(cardSlide, [0, 1], [150, 0])}px) scale(${interpolate(cardSlide, [0, 1], [0.85, 1])})`,
                  opacity: cardSlide,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8" }}>
                    KARTU SISWA SMKN 1 BERINGIN
                  </div>
                  <Img src={staticFile("assets/logo.png")} style={{ width: "18px", height: "18px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
                    BUDI SANTOSO WIBOWO
                  </div>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                    NISN: 0068491823 • XII BUSANA 1
                  </div>
                </div>
                {/* Barcode line mock */}
                <div
                  style={{
                    height: "20px",
                    backgroundColor: "#ffffff",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#000000", fontWeight: 700 }}>
                    |||| ||| ||||| || ||||
                  </div>
                  <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#000000", fontWeight: 700 }}>
                    2026-0042
                  </div>
                </div>
              </div>

              {/* Animated Laser Scan Bar */}
              {frame >= 40 && frame <= 85 && (
                <div
                  style={{
                    position: "absolute",
                    top: `${laserY - 20}px`,
                    left: "10px",
                    right: "10px",
                    height: "3px",
                    background: "linear-gradient(90deg, transparent 0%, #38bdf8 50%, transparent 100%)",
                    boxShadow: "0 0 15px #38bdf8, 0 0 30px #0284c7",
                  }}
                />
              )}
            </div>

            <div style={{ marginTop: "14px", fontSize: "13px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
              <Scan size={16} color="#38bdf8" /> Sensor USB HID &amp; QR Aktif · Scan Otomatis
            </div>
          </div>

          {/* Right: Live Counter & Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "18px",
                padding: "18px 22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>TOTAL HARI INI</span>
                <Users size={18} color="#38bdf8" />
              </div>
              <div style={{ fontSize: "44px", fontWeight: 900, color: "#ffffff", margin: "2px 0" }}>
                {visitorCount}
              </div>
              <div style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 700 }}>
                • Siswa berkunjung tercatat langsung
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "18px",
                padding: "18px 22px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>KEPERLUAN TERPILIH</span>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#60a5fa", marginTop: "4px" }}>
                Membaca Buku
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                Terekam otomatis ke rekapitulasi perpustakaan
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal Overlay */}
        {frame > 85 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(3, 7, 18, 0.85)",
              backdropFilter: "blur(14px)",
              borderRadius: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
          >
            <div
              style={{
                transform: `scale(${successAnim})`,
                opacity: successAnim,
                backgroundColor: "rgba(12, 24, 48, 0.98)",
                border: "2px solid #38bdf8",
                borderRadius: "24px",
                padding: "32px 48px",
                boxShadow: "0 25px 70px rgba(56, 189, 248, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(56, 189, 248, 0.2)",
                  border: "2px solid #38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={36} color="#38bdf8" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 800, color: "#38bdf8" }}>
                    PRESENSI BERHASIL DICATAT!
                  </span>
                  <Sparkles size={16} color="#38bdf8" />
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                  Budi Santoso Wibowo
                </div>
                <div style={{ fontSize: "15px", color: "#94a3b8", marginTop: "4px" }}>
                  Kelas: XII BUSANA 1 • Keperluan: Membaca Buku • Waktu: 15:02 WIB
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
