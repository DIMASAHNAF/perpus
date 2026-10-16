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
  Layers,
  Copy,
  ArrowUpDown,
  Search,
  Barcode,
  FileSpreadsheet,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { HeaderBar } from "../components/HeaderBar";

export const SceneKoleksiBuku: React.FC = () => {
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
      frame: frame - 10 - idx * 4,
      fps,
      config: { damping: 12, mass: 0.75, stiffness: 100 },
    });

  const tableAnim = spring({
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
        padding: "108px 48px 20px 48px",
        boxSizing: "border-box",
      }}
    >
      <BackgroundGrid accentColor="#0ea5e9" />
      <HeaderBar categoryTitle="Alur Petugas & Admin" badgeText="Katalog & Inventaris Buku" />

      {/* Top Header Mockup Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: "1440px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderRadius: "18px",
          backgroundColor: "rgba(10, 16, 30, 0.85)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          backdropFilter: "blur(20px)",
          marginBottom: "16px",
          transform: `translateY(${interpolate(containerAnim, [0, 1], [-20, 0])}px)`,
          opacity: containerAnim,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "13px",
              fontWeight: 700,
              color: "#cbd5e1",
            }}
          >
            <ArrowLeft size={16} color="#38bdf8" />
            <span>Dashboard</span>
          </div>

          <span style={{ color: "#475569", fontSize: "16px" }}>/</span>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "4px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Img
                src={staticFile("assets/logo.png")}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff", margin: 0 }}>
                  Koleksi Buku Perpustakaan
                </h1>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(14, 165, 233, 0.2)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#38bdf8",
                    letterSpacing: "0.08em",
                  }}
                >
                  KATALOG UTAMA
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
                SMK Negeri 1 Beringin · Inventaris &amp; Eksemplar
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              fontSize: "13px",
              fontWeight: 700,
              color: "#38bdf8",
            }}
          >
            <Barcode size={16} />
            <span>Scan Barcode</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "13px",
              fontWeight: 600,
              color: "#cbd5e1",
            }}
          >
            <FileSpreadsheet size={16} color="#34d399" />
            <span>Import Massal</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              fontSize: "13px",
              fontWeight: 800,
              color: "#ffffff",
              boxShadow: "0 4px 15px rgba(2, 132, 199, 0.4)",
            }}
          >
            <Plus size={16} />
            <span>Tambah Buku</span>
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
          gap: "14px",
          transform: `scale(${interpolate(containerAnim, [0, 1], [0.95, 1])})`,
          opacity: containerAnim,
        }}
      >
        {/* 4 Stat Cards Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            {
              title: "JUDUL BUKU",
              count: "7",
              sub: "Koleksi Terdaftar",
              icon: <BookOpen size={20} color="#38bdf8" />,
              accent: "#38bdf8",
            },
            {
              title: "STOK FISIK",
              count: "26",
              sub: "Total Eksemplar",
              icon: <Layers size={20} color="#60a5fa" />,
              accent: "#60a5fa",
            },
            {
              title: "TERSEDIA",
              count: "26",
              sub: "Siap Dipinjam",
              icon: <Copy size={20} color="#34d399" />,
              accent: "#34d399",
            },
            {
              title: "DIPINJAM",
              count: "0",
              sub: "Sedang Dipinjam",
              icon: <ArrowUpDown size={20} color="#f59e0b" />,
              accent: "#f59e0b",
            },
          ].map((card, i) => {
            const anim = cardStagger(i);
            return (
              <div
                key={i}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "20px 24px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                  transform: `translateY(${interpolate(anim, [0, 1], [25, 0])}px)`,
                  opacity: anim,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em" }}>
                    {card.title}
                  </span>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
                <div style={{ fontSize: "40px", fontWeight: 900, color: card.accent, margin: "6px 0 2px 0" }}>
                  {card.count}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Search and Action Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "18px",
            padding: "14px 20px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "46px",
              borderRadius: "14px",
              backgroundColor: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: "12px",
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            <Search size={18} />
            <span>Cari judul buku, penulis, kode, DDC, atau ID...</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                boxShadow: "0 6px 20px rgba(2, 132, 199, 0.4)",
              }}
            >
              <Barcode size={16} />
              <span>Scan Cepat Barcode</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "12px",
                fontWeight: 700,
                color: "#cbd5e1",
              }}
            >
              <span>Semua Kategori (6)</span>
            </div>
          </div>
        </div>

        {/* Books Table Container Mockup */}
        <div
          style={{
            backgroundColor: "rgba(10, 16, 30, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px",
            padding: "20px 24px",
            boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
            transform: `translateY(${interpolate(tableAnim, [0, 1], [30, 0])}px)`,
            opacity: tableAnim,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                Koleksi Buku Terdaftar
              </h2>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Menampilkan 7 dari 7 judul</span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(56, 189, 248, 0.2)",
                  color: "#38bdf8",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                Semua (7)
              </span>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "#94a3b8",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                Tersedia (7)
              </span>
            </div>
          </div>

          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr",
              padding: "10px 16px",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#94a3b8",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            <span>BUKU &amp; IDENTITAS</span>
            <span>PENULIS &amp; KATEGORI</span>
            <span>STATUS STOK</span>
            <span style={{ textAlign: "right" }}>AKSI</span>
          </div>

          {/* Table Rows */}
          {[
            {
              code: "BSN-001",
              title: "Dasar-Dasar Kejuruan Tata Busana SMK",
              penulis: "Tim Kemdikbudristek",
              kat: "Kejuruan Busana",
              stok: "8 / 8 Eksemplar",
            },
            {
              code: "MTK-012",
              title: "Matematika Tingkat Lanjut Kelas XII",
              penulis: "Dr. Ir. Wahyudi, M.Pd",
              kat: "Pelajaran Wajib",
              stok: "10 / 10 Eksemplar",
            },
            {
              code: "TIK-005",
              title: "Teknologi Jaringan Komputer & Telekomunikasi",
              penulis: "Ahmad Fajar, S.Kom",
              kat: "Informatika",
              stok: "8 / 8 Eksemplar",
            },
          ].map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "46px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(30, 41, 59, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#38bdf8",
                  }}
                >
                  <BookOpen size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#ffffff" }}>{row.title}</div>
                  <div style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace" }}>
                    {row.code} • DDC: 646.4
                  </div>
                </div>
              </div>

              <div>
                <div style={{ color: "#cbd5e1", fontWeight: 600 }}>{row.penulis}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>{row.kat}</div>
              </div>

              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 8px", borderRadius: "6px", backgroundColor: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#22c55e", fontSize: "11px", fontWeight: 800 }}>
                  <CheckCircle2 size={12} />
                  <span>{row.stok}</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 700 }}>
                  Detail &amp; Barcode &gt;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
