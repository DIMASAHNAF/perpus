import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import { Sparkles, BookOpen, QrCode, ShieldCheck, Zap } from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { LightSweep } from "../components/LightSweep";

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animations
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 11, mass: 0.8, stiffness: 110 },
  });

  const titleProgress = spring({
    frame: frame - 12,
    fps,
    config: { damping: 13, mass: 0.85, stiffness: 95 },
  });

  const cardsProgress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 90 },
  });

  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  const cardsY = interpolate(cardsProgress, [0, 1], [50, 0]);
  const cardsOpacity = interpolate(cardsProgress, [0, 1], [0, 1]);

  // Subtle 3D floating animation
  const floatY = Math.sin(frame * 0.05) * 6;
  const floatRotate = Math.sin(frame * 0.03) * 1.5;

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
      <BackgroundGrid accentColor="#2563eb" secondaryColor="#0284c7" />

      {/* Top Floating Badge */}
      <div
        style={{
          transform: `scale(${logoScale}) translateY(${floatY}px) rotate(${floatRotate}deg)`,
          opacity: interpolate(frame, [0, 12], [0, 1]),
          display: "flex",
          alignItems: "center",
          gap: "18px",
          padding: "12px 28px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          backdropFilter: "blur(20px)",
          borderRadius: "9999px",
          marginBottom: "36px",
          boxShadow: "0 15px 40px rgba(37, 99, 235, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
        }}
      >
        <Img
          src={staticFile("assets/logo.png")}
          style={{ width: "42px", height: "42px", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" }}
        />
        <div style={{ height: "24px", width: "1px", backgroundColor: "rgba(255,255,255,0.25)" }} />
        <Img
          src={staticFile("assets/logo-kolaborasi.png")}
          style={{ height: "28px", objectFit: "contain" }}
        />
        <span
          style={{
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "#38bdf8",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Sparkles size={16} className="animate-spin" /> Inovasi Literasi Digital
        </span>
      </div>

      {/* Main Big Hero Title */}
      <div
        style={{
          textAlign: "center",
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          maxWidth: "1350px",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            fontWeight: 800,
            letterSpacing: "0.25em",
            color: "#60a5fa",
            textTransform: "uppercase",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <Zap size={20} color="#38bdf8" /> Sistem Manajemen Perpustakaan Pintar
        </div>

        <h1
          style={{
            fontSize: "76px",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: 0,
            background: "linear-gradient(135deg, #ffffff 30%, #93c5fd 75%, #38bdf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 20px 60px rgba(37, 99, 235, 0.4)",
          }}
        >
          SMK NEGERI 1 BERINGIN
        </h1>

        <p
          style={{
            fontSize: "22px",
            fontWeight: 500,
            color: "#94a3b8",
            marginTop: "16px",
            letterSpacing: "0.01em",
          }}
        >
          Ekosistem Presensi Mandiri, Sirkulasi Barcode, &amp; E-Book Terintegrasi
        </p>
      </div>

      {/* 3 Floating Feature Badges */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginTop: "44px",
          transform: `translateY(${cardsY}px)`,
          opacity: cardsOpacity,
        }}
      >
        {[
          { icon: <QrCode size={22} color="#38bdf8" />, title: "Presensi Mandiri 1 Detik", subtitle: "Scan QR & Barcode Fisik" },
          { icon: <BookOpen size={22} color="#60a5fa" />, title: "Katalog & E-Book", subtitle: "Akses Online Siswa" },
          { icon: <ShieldCheck size={22} color="#34d399" />, title: "Sirkulasi Real-Time", subtitle: "Validasi Cepat Petugas" },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px 26px",
              borderRadius: "20px",
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
              transform: `translateY(${Math.sin((frame + idx * 30) * 0.06) * 5}px)`,
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                backgroundColor: "rgba(37, 99, 235, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.icon}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#f8fafc" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
                {item.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
