import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CheckCheck,
  ShieldCheck,
  Barcode,
  Layers,
  Clock,
  BookMarked,
  UserCheck,
} from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { HeaderBar } from "../components/HeaderBar";

export const Scene5SirkulasiValidasi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerAnim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 90 },
  });

  // Stamp animation when validation passes
  const stampAnim = spring({
    frame: frame - 65,
    fps,
    config: { damping: 10, mass: 0.7, stiffness: 140 },
  });

  const scanLineY = interpolate(
    frame % 40,
    [0, 40],
    [10, 120]
  );

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
      <BackgroundGrid accentColor="#10b981" />
      <HeaderBar categoryTitle="Alur Petugas & Validasi" badgeText="Sirkulasi & Stok" />

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
            color: "#34d399",
            textTransform: "uppercase",
          }}
        >
          Alur Petugas Perpustakaan & Kaprodi
        </span>
        <h2
          style={{
            fontSize: "40px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "6px 0 0 0",
          }}
        >
          Validasi Eksemplar, Sirkulasi & Status Peminjaman
        </h2>
      </div>

      {/* Main Container */}
      <div
        style={{
          width: "1380px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: "28px",
          transform: `scale(${interpolate(containerAnim, [0, 1], [0.93, 1])})`,
          opacity: containerAnim,
        }}
      >
        {/* Left: Live Book Scan & Metadata Card */}
        <div
          style={{
            backgroundColor: "rgba(10, 17, 30, 0.9)",
            borderRadius: "24px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(24px)",
            position: "relative",
          }}
        >
          {/* Top scan trigger bar */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "14px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Barcode size={24} color="#34d399" />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#34d399" }}>
                  SCANNER FISIK AKTIF (AUTO-FETCH ISBN)
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Barcode Tembak: 978-602-434-882-1
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: "#059669",
                color: "#ffffff",
              }}
            >
              TERHUBUNG
            </span>
          </div>

          {/* Book Info Panel */}
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            {/* Book Spine Graphic */}
            <div
              style={{
                width: "110px",
                height: "160px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
                border: "2px solid rgba(59, 130, 246, 0.4)",
                boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "12px",
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8" }}>SMKN 1</div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}>
                MANAJEMEN PERPUS
              </div>
              <div style={{ fontSize: "9px", color: "#94a3b8" }}>EDISI 2026</div>

              {/* Barcode scanner laser beam */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${scanLineY}px`,
                  height: "2px",
                  backgroundColor: "#22c55e",
                  boxShadow: "0 0 10px #22c55e",
                }}
              />
            </div>

            {/* Book Details */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
                Pengantar Teknologi Rekayasa & Kejuruan
              </div>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                Penulis: Tim Kurikulum SMK • Kategori: Teknik & Vokasi
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "18px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>STATUS EKSEMPLAR</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#34d399", marginTop: "2px" }}>
                    26 Tersedia / 26 Total
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>LOKASI RAK FISIK</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#38bdf8", marginTop: "2px" }}>
                    Rak A-02 (Katalog Utama)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Validation & Verification Flow */}
        <div
          style={{
            backgroundColor: "rgba(10, 17, 30, 0.9)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} color="#34d399" /> Checklist Validasi Otomatis
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                {
                  title: "Kesesuaian Eksemplar Fisik & Katalog",
                  desc: "Nomor barcode, judul, dan nomor rak terdaftar sinkron.",
                },
                {
                  title: "Status Anggota & Kuota Pinjam",
                  desc: "Siswa aktif, tidak ada denda outstanding, kuota tersedia.",
                },
                {
                  title: "Rekap Log Kunjungan & Validasi Kaprodi",
                  desc: "Presensi dan pencatatan sirkulasi diverifikasi instan.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  <CheckCheck size={18} color="#34d399" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Result Stamp / Banner */}
          <div
            style={{
              marginTop: "20px",
              padding: "16px 20px",
              borderRadius: "16px",
              backgroundColor: "rgba(5, 150, 105, 0.15)",
              border: "2px solid #10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transform: `scale(${frame > 65 ? stampAnim : 0.8})`,
              opacity: frame > 65 ? stampAnim : 0,
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCheck size={26} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#34d399" }}>
                  STATUS: TERVERIFIKASI & SESUAI
                </div>
                <div style={{ fontSize: "12px", color: "#e2e8f0" }}>
                  Data tersinkron otomatis ke Laporan Sirkulasi & Presensi
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#10b981",
                padding: "6px 12px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.2)",
              }}
            >
              100% VALID
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
