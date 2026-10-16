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
  Sparkles,
  Search,
  Download,
  CreditCard,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  ScanLine,
} from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { LightSweep } from "../components/LightSweep";

export const Scene4KartuDigital: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const heroAnim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 90 },
  });

  // Typing effect for NISN search (frames 20 to 55)
  const fullText = "0068491823";
  const charIndex = Math.min(
    fullText.length,
    Math.floor(
      interpolate(frame, [20, 50], [0, fullText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );
  const typedText = fullText.slice(0, charIndex);

  // Button click state
  const isButtonClicked = frame >= 55;
  const buttonScale = isButtonClicked
    ? spring({
        frame: frame - 55,
        fps,
        config: { damping: 10, mass: 0.5, stiffness: 200 },
      })
    : 1;

  // Card reveal animation (starts frame 65)
  const cardAnim = spring({
    frame: frame - 65,
    fps,
    config: { damping: 13, mass: 0.85, stiffness: 90 },
  });

  const cardTiltY = interpolate(cardAnim, [0, 1], [-15, 0]);
  const cardTiltX = interpolate(cardAnim, [0, 1], [10, 0]);

  // Download button clicked state (frame 105+)
  const isDownloaded = frame >= 105;

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
        padding: "36px 60px",
        boxSizing: "border-box",
        perspective: "1200px",
      }}
    >
      <BackgroundGrid accentColor="#0284c7" secondaryColor="#3b82f6" />

      {/* Top Navigation Header Mockup */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderRadius: "16px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          backdropFilter: "blur(16px)",
          marginBottom: "16px",
          transform: `translateY(${interpolate(heroAnim, [0, 1], [-30, 0])}px)`,
          opacity: heroAnim,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#cbd5e1",
            }}
          >
            <ArrowLeft size={14} />
            <span>Katalog Buku</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Img
              src={staticFile("assets/logo.png")}
              style={{ width: "26px", height: "26px", objectFit: "contain" }}
            />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>
              Perpustakaan SMK Negeri 1 Beringin
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 14px",
            borderRadius: "999px",
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            fontSize: "11px",
            fontWeight: 800,
            color: "#38bdf8",
            letterSpacing: "0.05em",
          }}
        >
          <Sparkles size={12} />
          <span>PORTAL SISWA</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${interpolate(heroAnim, [0, 1], [30, 0])}px)`,
          opacity: heroAnim,
        }}
      >
        {/* Title Header */}
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              color: "#38bdf8",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "6px",
            }}
          >
            <CreditCard size={15} /> Identitas Siswa Digital
          </div>
          <h2
            style={{
              fontSize: "44px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Cek &amp; Simpan Kartu Anggota Digital
          </h2>
          <p style={{ fontSize: "15px", color: "#94a3b8", marginTop: "4px" }}>
            Tersimpan langsung di galeri smartphone untuk kemudahan akses presensi mandiri
          </p>
        </div>

        {/* Search Bar Input Mockup */}
        <div
          style={{
            width: "680px",
            height: "56px",
            borderRadius: "18px",
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: `2px solid ${frame >= 20 && frame < 55 ? "#38bdf8" : "rgba(56, 189, 248, 0.3)"}`,
            boxShadow:
              frame >= 20 && frame < 55
                ? "0 0 25px rgba(56, 189, 248, 0.4)"
                : "0 10px 30px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            padding: "0 8px 0 18px",
            gap: "12px",
            position: "relative",
            marginBottom: "20px",
          }}
        >
          <Search size={20} color="#64748b" />
          <div
            style={{
              flex: 1,
              fontSize: "16px",
              color: typedText ? "#ffffff" : "#64748b",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
            }}
          >
            {typedText || "Masukkan NISN atau Nama Siswa..."}
            {frame >= 20 && frame < 55 && (
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "20px",
                  backgroundColor: "#38bdf8",
                  marginLeft: "4px",
                  opacity: Math.sin(frame * 0.4) > 0 ? 1 : 0,
                }}
              />
            )}
          </div>

          <div
            style={{
              padding: "10px 22px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 6px 15px rgba(37, 99, 235, 0.35)",
              transform: `scale(${isButtonClicked ? buttonScale : 1})`,
            }}
          >
            <span>Lihat Kartu</span>
          </div>
        </div>

        {/* Digital Card + Features Row */}
        {frame >= 60 && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "40px",
              transform: `translateY(${interpolate(cardAnim, [0, 1], [50, 0])}px) scale(${interpolate(cardAnim, [0, 1], [0.88, 1])}) rotateX(${cardTiltX}deg) rotateY(${cardTiltY}deg)`,
              opacity: cardAnim,
            }}
          >
            {/* The High-Fidelity Student Card */}
            <div
              style={{
                width: "560px",
                height: "340px",
                borderRadius: "26px",
                padding: "24px 28px",
                background:
                  "linear-gradient(135deg, #091224 0%, #0c2044 50%, #082d62 100%)",
                border: "2px solid rgba(56, 189, 248, 0.5)",
                boxShadow:
                  "0 25px 60px rgba(37, 99, 235, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Card Ambient Glows */}
              <div
                style={{
                  position: "absolute",
                  top: "-50px",
                  right: "-50px",
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(56, 189, 248, 0.2)",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                }}
              />

              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                  paddingBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(37, 99, 235, 0.25)",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BookOpen size={22} color="#38bdf8" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        letterSpacing: "0.15em",
                        color: "#38bdf8",
                        textTransform: "uppercase",
                      }}
                    >
                      SMK NEGERI 1 BERINGIN
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 900,
                        color: "#ffffff",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      KARTU PERPUSTAKAAN DIGITAL
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(56, 189, 248, 0.2)",
                    border: "1px solid rgba(56, 189, 248, 0.5)",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#38bdf8",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      backgroundColor: "#38bdf8",
                    }}
                  />
                  <span>AKTIF</span>
                </div>
              </div>

              {/* Card Body Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {/* Left Info Column */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                    NAMA LENGKAP SISWA
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff", margin: "2px 0 8px 0" }}>
                    BUDI SANTOSO WIBOWO
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#94a3b8" }}>NISN</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#38bdf8", fontFamily: "monospace" }}>
                        0068491823
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#94a3b8" }}>KELAS</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
                        XII BUSANA 1
                      </div>
                    </div>
                  </div>

                  {/* High contrast Barcode */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      padding: "5px 14px",
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "center",
                      boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        letterSpacing: "3px",
                        fontFamily: "monospace",
                        color: "#000000",
                        fontWeight: 900,
                        lineHeight: 1,
                      }}
                    >
                      ||| |||| || ||||| ||| ||
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        color: "#0f172a",
                        marginTop: "2px",
                      }}
                    >
                      2026-0042
                    </div>
                  </div>
                </div>

                {/* Right QR Code Column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      padding: "8px",
                      backgroundColor: "#ffffff",
                      borderRadius: "16px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {/* Stylized QR Code Mock */}
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        backgroundColor: "#000000",
                        borderRadius: "8px",
                        padding: "6px",
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gridTemplateRows: "repeat(5, 1fr)",
                        gap: "3px",
                      }}
                    >
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#000000" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />

                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#000000" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#000000" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />

                      <div style={{ backgroundColor: "#000000" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#000000" }} />

                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#000000" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#000000" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />

                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#000000" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                      <div style={{ backgroundColor: "#ffffff", borderRadius: "2px" }} />
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "#38bdf8",
                      marginTop: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    SCAN MANDIRI
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  paddingTop: "8px",
                  fontSize: "10px",
                  color: "#94a3b8",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={14} color="#38bdf8" />
                  <span>Terdaftar Resmi Perpustakaan</span>
                </div>
                <div style={{ fontFamily: "monospace", color: "#64748b" }}>ID: 2026-0042</div>
              </div>
            </div>

            {/* Right Side: Action Callouts */}
            <div
              style={{
                width: "360px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Download Action Card */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  border: isDownloaded
                    ? "2px solid #38bdf8"
                    : "1px solid rgba(56, 189, 248, 0.25)",
                  boxShadow: isDownloaded
                    ? "0 0 30px rgba(56, 189, 248, 0.4)"
                    : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: isDownloaded ? "rgba(56, 189, 248, 0.2)" : "rgba(30, 41, 59, 0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isDownloaded ? <CheckCircle2 size={20} color="#38bdf8" /> : <Download size={20} color="#94a3b8" />}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
                      {isDownloaded ? "Kartu Tersimpan di HP!" : "Simpan Kartu ke Galeri"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      Format PNG resolusi tinggi siap pakai
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Guide */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "18px",
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <ScanLine size={20} color="#38bdf8" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5 }}>
                  Buka foto kartu di smartphone, lalu scan langsung ke mesin pemindai perpustakaan.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
