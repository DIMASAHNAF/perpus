import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import { Search, Tablet, Smartphone, Laptop, BookOpen, Sparkles } from "lucide-react";
import { HeaderBar } from "../components/HeaderBar";

export const Scene6EbookCatalog: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerAnim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 90 },
  });

  const floatY = Math.sin(frame * 0.06) * 10;

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
      {/* Background School Hero Image with Dark Gradient Tint */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        <Img
          src={staticFile("assets/perpustakaan-hero.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.25) saturate(1.2)",
            transform: `scale(${1 + frame * 0.0008})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7, 11, 20, 0.9) 0%, rgba(10, 20, 45, 0.75) 50%, rgba(7, 11, 20, 0.95) 100%)",
          }}
        />
      </div>

      <HeaderBar categoryTitle="Katalog Digital Terbuka" badgeText="Akses Kapan Saja" />

      {/* Main Content Card */}
      <div
        style={{
          zIndex: 10,
          textAlign: "center",
          maxWidth: "1100px",
          transform: `translateY(${interpolate(containerAnim, [0, 1], [40, 0]) + floatY}px)`,
          opacity: containerAnim,
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            borderRadius: "9999px",
            backgroundColor: "rgba(37, 99, 235, 0.3)",
            border: "1px solid rgba(59, 130, 246, 0.5)",
            color: "#60a5fa",
            fontSize: "14px",
            fontWeight: 700,
            marginBottom: "20px",
            backdropFilter: "blur(12px)",
          }}
        >
          <Sparkles size={16} /> Katalog Resmi & E-Book SMKN 1 Beringin
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            margin: "0 0 16px 0",
          }}
        >
          Baca E-Book Online & Koleksi Perpustakaan
        </h1>

        <p
          style={{
            fontSize: "22px",
            color: "#cbd5e1",
            maxWidth: "800px",
            margin: "0 auto 36px auto",
            lineHeight: 1.5,
          }}
        >
          Buka dan baca buku pelajaran atau novel digital langsung dari HP atau Komputer Anda kapan saja.
        </p>

        {/* Search Bar Mockup */}
        <div
          style={{
            width: "740px",
            margin: "0 auto 40px auto",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            borderRadius: "16px",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "#94a3b8" }}>
            <Search size={22} color="#38bdf8" />
            <span style={{ fontSize: "16px", color: "#cbd5e1" }}>
              Cari judul buku, pengarang, mata pelajaran vokasi...
            </span>
          </div>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              color: "#60a5fa",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Enter ↵
          </span>
        </div>

        {/* Multi-Device Support Pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          {[
            { icon: <Smartphone size={18} />, label: "Smartphone Android & iOS" },
            { icon: <Laptop size={18} />, label: "Laptop & PC Perpustakaan" },
            { icon: <Tablet size={18} />, label: "Tablet Pembaca E-Book" },
          ].map((dev, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e2e8f0",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {dev.icon}
              {dev.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
