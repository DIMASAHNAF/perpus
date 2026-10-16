import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Sequence,
  Img,
  staticFile,
} from "remotion";
import {
  Sparkles,
  Search,
  Bot,
  Trophy,
  CheckCircle2,
  Star,
  MapPin,
  QrCode,
  Smartphone,
  Zap,
} from "lucide-react";

export const TikTokWebsiteShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Total 900 frames @ 30 fps = 30 seconds
  // Scene 1: 0 - 180 (0-6s)   -> Hook & 3D MacBook Pro Reveal
  // Scene 2: 180 - 360 (6-12s) -> Real-time Search & 3D Book Pop-out Card
  // Scene 3: 360 - 540 (12-18s) -> AI Pustakawan Glassmorphic Chatbot Pop-out
  // Scene 4: 540 - 720 (18-24s) -> Gamification & Gold Trophy Leaderboard
  // Scene 5: 720 - 900 (24-30s) -> Dual Device (MacBook + iPhone 16 Pro PWA) & Grand Outro

  // Spring Transitions
  const s1Spring = spring({ frame: frame - 4, fps, config: { damping: 14, mass: 0.9, stiffness: 75 } });
  const s2Spring = spring({ frame: frame - 180, fps, config: { damping: 14, mass: 0.85, stiffness: 85 } });
  const s3Spring = spring({ frame: frame - 360, fps, config: { damping: 14, mass: 0.85, stiffness: 85 } });
  const s4Spring = spring({ frame: frame - 540, fps, config: { damping: 14, mass: 0.85, stiffness: 85 } });
  const s5Spring = spring({ frame: frame - 720, fps, config: { damping: 14, mass: 0.9, stiffness: 80 } });

  // Floating continuous bobbing
  const bobY = Math.sin(frame * 0.055) * 10;
  const bobRotZ = Math.cos(frame * 0.04) * 1.8;

  // Camera & Laptop 3D Transformations (Larger, Closer, Cinematic)
  let rotX = 14;
  let rotY = -18;
  let rotZ = -1.5;
  let laptopScale = 1.15;
  let transX = 0;
  let transY = 0;
  let scrollY = 0;

  if (frame < 180) {
    // Scene 1: Grand 3D Swoop Reveal
    rotX = interpolate(s1Spring, [0, 1], [24, 12]);
    rotY = interpolate(s1Spring, [0, 1], [-32, -14]);
    rotZ = interpolate(s1Spring, [0, 1], [-5, -1]);
    laptopScale = interpolate(s1Spring, [0, 1], [0.95, 1.18]);
    transY = interpolate(s1Spring, [0, 1], [120, 0]);
    scrollY = 0;
  } else if (frame < 360) {
    // Scene 2: Tilt Right & Zoom into Catalog
    const t = interpolate(s2Spring, [0, 1], [0, 1]);
    rotX = interpolate(t, [0, 1], [12, 10]);
    rotY = interpolate(t, [0, 1], [-14, 15]);
    rotZ = interpolate(t, [0, 1], [-1, 2]);
    laptopScale = interpolate(t, [0, 1], [1.18, 1.24]);
    transX = interpolate(t, [0, 1], [0, -60]);
    transY = interpolate(t, [0, 1], [0, -20]);
    scrollY = interpolate(t, [0, 1], [0, -200]);
  } else if (frame < 540) {
    // Scene 3: Shift Left & Close-up for AI Pustakawan
    const t = interpolate(s3Spring, [0, 1], [0, 1]);
    rotX = interpolate(t, [0, 1], [10, 8]);
    rotY = interpolate(t, [0, 1], [15, -18]);
    rotZ = interpolate(t, [0, 1], [2, -2]);
    laptopScale = interpolate(t, [0, 1], [1.24, 1.22]);
    transX = interpolate(t, [0, 1], [-60, -90]);
    transY = interpolate(t, [0, 1], [-20, -30]);
    scrollY = -160;
  } else if (frame < 720) {
    // Scene 4: Center-Up Tilt for Leaderboard
    const t = interpolate(s4Spring, [0, 1], [0, 1]);
    rotX = interpolate(t, [0, 1], [8, 14]);
    rotY = interpolate(t, [0, 1], [-18, 8]);
    rotZ = interpolate(t, [0, 1], [-2, 1]);
    laptopScale = interpolate(t, [0, 1], [1.22, 1.2]);
    transX = interpolate(t, [0, 1], [-90, -30]);
    transY = interpolate(t, [0, 1], [-30, 0]);
    scrollY = interpolate(t, [0, 1], [-160, -360]);
  } else {
    // Scene 5: Dual Device Outro (Shift Laptop Left to spotlight iPhone)
    const t = interpolate(s5Spring, [0, 1], [0, 1]);
    rotX = interpolate(t, [0, 1], [14, 10]);
    rotY = interpolate(t, [0, 1], [8, -16]);
    rotZ = interpolate(t, [0, 1], [1, -2]);
    laptopScale = interpolate(t, [0, 1], [1.2, 0.95]);
    transX = interpolate(t, [0, 1], [-30, -210]);
    transY = interpolate(t, [0, 1], [0, 20]);
    scrollY = -80;
  }

  // Pop-Out Cards Springs
  const card2Spring = spring({ frame: frame - 195, fps, config: { damping: 11, mass: 0.75, stiffness: 110 } });
  const card3Spring = spring({ frame: frame - 375, fps, config: { damping: 11, mass: 0.75, stiffness: 110 } });
  const card4Spring = spring({ frame: frame - 555, fps, config: { damping: 11, mass: 0.75, stiffness: 110 } });
  const phoneSpring = spring({ frame: frame - 725, fps, config: { damping: 12, mass: 0.8, stiffness: 100 } });

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: "#030712",
        position: "relative",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Background Energetic Tech Beat Audio */}
      <Audio src={staticFile("audio/energetic_tech.mp3")} volume={0.65} />

      {/* Synchronized Sound Effects */}
      <Sequence from={0} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={180} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={200} durationInFrames={30}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.85} />
      </Sequence>
      <Sequence from={360} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={390} durationInFrames={40}>
        <Audio src={staticFile("audio/success_chime.wav")} volume={0.8} />
      </Sequence>
      <Sequence from={540} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={560} durationInFrames={30}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.85} />
      </Sequence>
      <Sequence from={720} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={745} durationInFrames={40}>
        <Audio src={staticFile("audio/success_chime.wav")} volume={0.85} />
      </Sequence>

      {/* ================= STUDIO LIGHTING & AMBIENT AESTHETICS ================= */}
      {/* Top Emerald-Cyan Aurora Glow */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(6, 182, 212, 0.18) 45%, transparent 75%)",
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />
      {/* Bottom Indigo-Violet Ambient Backlight */}
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "-10%",
          width: 850,
          height: 850,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.26) 0%, rgba(139, 92, 246, 0.16) 40%, transparent 75%)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      {/* Luminous Floor Grid Lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(circle at 50% 45%, black 45%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 45%, black 45%, transparent 85%)",
          pointerEvents: "none",
        }}
      />

      {/* ================= TOP HEADER BRANDING (Opening4 Style) ================= */}
      <div
        style={{
          position: "absolute",
          top: 65,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 40,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 28px",
            borderRadius: 999,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1.5px solid rgba(16, 185, 129, 0.45)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 35px rgba(16, 185, 129, 0.25)",
          }}
        >
          <Img
            src={staticFile("assets/logo.png")}
            style={{ width: 32, height: 32, objectFit: "contain" }}
          />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "1px", color: "#34d399" }}>
            SMK NEGERI 1 BERINGIN
          </span>
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>•</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.5px" }}>
            PERPUSTAKAAN DIGITAL
          </span>
        </div>
      </div>

      {/* ================= 3D MACBOOK PRO STAGE CENTER ================= */}
      <div
        style={{
          position: "absolute",
          top: "43%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${transY + bobY}px) translateX(${transX}px)`,
          perspective: 1600,
          transformStyle: "preserve-3d",
          zIndex: 20,
        }}
      >
        {/* 3D ROTATED CONTAINER */}
        <div
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ + bobRotZ}deg) scale(${laptopScale})`,
            transformStyle: "preserve-3d",
            transition: "transform 0.1s ease-out",
          }}
        >
          {/* LAPTOP DISPLAY LID (1020px x 640px - Large & Crisp) */}
          <div
            style={{
              width: 1020,
              height: 640,
              backgroundColor: "#080c14",
              borderRadius: 24,
              border: "3px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 45px 95px rgba(0, 0, 0, 0.85), 0 0 50px rgba(16, 185, 129, 0.25)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top Bezel Webcam Notch & Browser Header */}
            <div
              style={{
                height: 32,
                backgroundColor: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div style={{ display: "flex", gap: 7 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#ef4444" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#10b981" }} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "3px 18px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  fontSize: 12,
                  color: "#e2e8f0",
                  fontFamily: "monospace",
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                <span>https://perpus.smkn1beringin.sch.id</span>
              </div>
              <div style={{ width: 36 }} />
            </div>

            {/* SCREEN VIEW (Authentic Digital Library UI with Live Smooth Scroll) */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#020617",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  transform: `translateY(${scrollY}px)`,
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  padding: "20px 30px",
                }}
              >
                {/* Header Navbar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 16,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        boxShadow: "0 0 16px rgba(16, 185, 129, 0.4)",
                      }}
                    >
                      📚
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#ffffff" }}>
                        Perpustakaan Digital
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        SMK Negeri 1 Beringin • Kab. Deli Serdang
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>
                    <span style={{ color: "#34d399" }}>Katalog Buku</span>
                    <span>AI Pustakawan</span>
                    <span>Top Readers</span>
                    <span>Kios Mandiri</span>
                  </div>
                </div>

                {/* Hero Search Section */}
                <div style={{ marginTop: 22, textAlign: "center" }}>
                  <div
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#34d399",
                      padding: "4px 14px",
                      borderRadius: 999,
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      marginBottom: 10,
                    }}
                  >
                    ✨ Ribuan Judul Buku Pelajaran & E-Book Siap Baca
                  </div>
                  <h1
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      lineHeight: 1.2,
                      margin: "0 0 12px 0",
                      background: "linear-gradient(to right, #ffffff, #93c5fd)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Temukan Inspirasi & Pengetahuan Tanpa Batas
                  </h1>

                  {/* Search Bar with Glow */}
                  <div
                    style={{
                      margin: "16px auto",
                      maxWidth: 560,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: "rgba(30, 41, 59, 0.9)",
                      border: "1.5px solid rgba(52, 211, 153, 0.6)",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 16px",
                      gap: 12,
                      boxShadow: "0 0 25px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    <Search size={18} color="#34d399" />
                    <span style={{ fontSize: 14, color: "#ffffff", fontWeight: 600 }}>
                      {frame > 180 ? "Pemrograman Web & Jaringan TCP/IP" : "Cari judul buku, penulis, kategori, rak..."}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        padding: "4px 12px",
                        borderRadius: 6,
                        backgroundColor: "#10b981",
                        color: "#022c22",
                        fontWeight: 800,
                      }}
                    >
                      CARI
                    </span>
                  </div>
                </div>

                {/* Books Grid Preview (with Real Covers!) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16 }}>
                  {[
                    {
                      title: "Penanganan Gangguan TCP/IP",
                      author: "Maryuli Darmawan",
                      cat: "TKJ / Jaringan",
                      stok: 14,
                      rak: "TKJ-01",
                      cover: "uploads/covers/1791818081196_96fdb7b8ba39c38cf45744cf.jpeg",
                    },
                    {
                      title: "Pemrograman Web Modern",
                      author: "Tim Guru Produktif",
                      cat: "RPL / Informatika",
                      stok: 18,
                      rak: "TI-02",
                      cover: "uploads/covers/1791817190528_63e929555cb2412309e14838.png",
                    },
                    {
                      title: "Desain Komunikasi Visual",
                      author: "Dra. Nurhayati",
                      cat: "DKV / Multimedia",
                      stok: 12,
                      rak: "DKV-03",
                      cover: "uploads/covers/1791817202442_dd88bc9e901a44df132bb169.jpeg",
                    },
                  ].map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        borderRadius: 14,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: 12,
                        display: "flex",
                        gap: 12,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                      }}
                    >
                      <Img
                        src={staticFile(b.cover)}
                        style={{
                          width: 58,
                          height: 80,
                          borderRadius: 8,
                          objectFit: "cover",
                          boxShadow: "0 6px 14px rgba(0,0,0,0.6)",
                        }}
                      />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", lineHeight: 1.3 }}>
                            {b.title}
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                            {b.author}
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10 }}>
                          <span style={{ color: "#34d399", fontWeight: 800 }}>Stok: {b.stok}</span>
                          <span style={{ color: "#38bdf8", fontWeight: 700 }}>Rak {b.rak}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Leaderboard Section Preview */}
                <div
                  style={{
                    marginTop: 26,
                    padding: "16px 20px",
                    borderRadius: 16,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 900, color: "#fbbf24" }}>
                      <Trophy size={18} color="#f59e0b" />
                      Leaderboard Top Readers Mingguan
                    </div>
                    <span style={{ fontSize: 11, color: "#34d399", fontWeight: 800, backgroundColor: "rgba(16, 185, 129, 0.15)", padding: "3px 10px", borderRadius: 999 }}>
                      Live Sync Kios
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    {[
                      { rank: "1", name: "Muhammad Fikri", pts: "1.480 Poin", badge: "Master Literasi" },
                      { rank: "2", name: "Amanda Putri", pts: "1.250 Poin", badge: "Bookworm" },
                      { rank: "3", name: "Bima Sakti", pts: "980 Poin", badge: "Penjelajah" },
                    ].map((u, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: 10,
                          backgroundColor: i === 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(30, 41, 59, 0.7)",
                          border: i === 0 ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 900, color: "#f59e0b", fontSize: 13 }}>#{u.rank}</span>
                          <span style={{ color: "#34d399", fontWeight: 800, fontSize: 12 }}>{u.pts}</span>
                        </div>
                        <div style={{ fontWeight: 700, color: "#ffffff", marginTop: 4, fontSize: 12 }}>{u.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Glossy Diagonal Glare Sweep */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 45%)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* LAPTOP KEYBOARD BASE DECK (1100px wide - Solid Aluminum) */}
          <div
            style={{
              width: 1100,
              height: 28,
              backgroundColor: "#1e293b",
              borderRadius: "0 0 20px 20px",
              marginLeft: -40,
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.85)",
              border: "2px solid #334155",
              borderTop: "none",
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 160,
                height: 10,
                backgroundColor: "#0f172a",
                borderRadius: "0 0 10px 10px",
              }}
            />
          </div>

          {/* Realistic Stage Floor Contact Shadow */}
          <div
            style={{
              width: 1020,
              height: 50,
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              filter: "blur(28px)",
              margin: "12px auto 0 auto",
            }}
          />
        </div>
      </div>

      {/* ================= DYNAMIC 3D FLOATING CARDS (Opening4 Style) ================= */}

      {/* CARD SCENE 2: GRAND BOOK DETAIL & REAL-TIME STOCK */}
      {frame >= 180 && frame < 360 && (
        <div
          style={{
            position: "absolute",
            top: "39%",
            right: 50,
            transform: `translateY(-50%) translateZ(180px) scale(${interpolate(card2Spring, [0, 1], [0.65, 1])})`,
            opacity: interpolate(card2Spring, [0, 1], [0, 1]),
            zIndex: 50,
            width: 480,
            padding: 26,
            borderRadius: 24,
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            border: "2.5px solid rgba(52, 211, 153, 0.65)",
            boxShadow: "0 35px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(16, 185, 129, 0.4)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: "#10b981",
                padding: "4px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(16, 185, 129, 0.18)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
              }}
            >
              ⭐ BUKU TERPOPULER
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 18 }}>
            <Img
              src={staticFile("uploads/covers/1791818081196_96fdb7b8ba39c38cf45744cf.jpeg")}
              style={{
                width: 95,
                height: 135,
                borderRadius: 12,
                objectFit: "cover",
                boxShadow: "0 10px 25px rgba(0,0,0,0.7)",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 21, fontWeight: 900, color: "#ffffff", lineHeight: 1.25 }}>
                  Penanganan Gangguan TCP/IP Layer
                </div>
                <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
                  Penulis: Maryuli Darmawan • TKJ
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontWeight: 700 }}>
                  Jaringan Komputer
                </span>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", fontWeight: 700 }}>
                  Edisi 2024
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: "14px 18px",
              borderRadius: 14,
              backgroundColor: "rgba(2, 6, 23, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>
                Status Stok Real-Time
              </div>
              <div style={{ color: "#34d399", fontWeight: 900, fontSize: 16, marginTop: 2 }}>
                🟢 14 Eksemplar Siap Pinjam
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>
                Lokasi Fisik
              </div>
              <div style={{ color: "#38bdf8", fontWeight: 900, fontSize: 16, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={16} /> Rak TKJ-01
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARD SCENE 3: GRAND AI PUSTAKAWAN CHATBOT CARD */}
      {frame >= 360 && frame < 540 && (
        <div
          style={{
            position: "absolute",
            top: "37%",
            right: 45,
            transform: `translateY(-50%) translateZ(190px) scale(${interpolate(card3Spring, [0, 1], [0.65, 1])})`,
            opacity: interpolate(card3Spring, [0, 1], [0, 1]),
            zIndex: 50,
            width: 500,
            padding: 28,
            borderRadius: 24,
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            border: "2.5px solid rgba(56, 189, 248, 0.65)",
            boxShadow: "0 35px 85px rgba(0, 0, 0, 0.85), 0 0 55px rgba(56, 189, 248, 0.4)",
            backdropFilter: "blur(26px)",
          }}
        >
          {/* Header AI */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: "1px solid rgba(255, 255, 255, 0.12)" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #06b6d4, #10b981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.6)",
              }}
            >
              <Bot size={26} color="#022c22" />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                AI Pustakawan <Sparkles size={16} color="#38bdf8" />
              </div>
              <div style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>● Online & Siap Menjawab 24/7</div>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
            <div
              style={{
                alignSelf: "flex-end",
                backgroundColor: "rgba(56, 189, 248, 0.2)",
                border: "1.5px solid rgba(56, 189, 248, 0.45)",
                padding: "12px 18px",
                borderRadius: "16px 16px 2px 16px",
                fontSize: 15,
                fontWeight: 600,
                color: "#e0f2fe",
                maxWidth: "85%",
              }}
            >
              &quot;Rekomendasi buku teknologi untuk pemula dong?&quot;
            </div>

            <div
              style={{
                alignSelf: "flex-start",
                backgroundColor: "rgba(30, 41, 59, 0.9)",
                border: "1.5px solid rgba(255, 255, 255, 0.12)",
                padding: "14px 20px",
                borderRadius: "16px 16px 16px 2px",
                fontSize: 15,
                color: "#f1f5f9",
                lineHeight: 1.5,
              }}
            >
              Halo! Saya sarankan membaca <strong>&apos;Dasar Algoritma & Pemrograman&apos;</strong>. Tersedia 12 eksemplar fisik di <strong>Rak TI-02</strong> & E-Book langsung baca! 💡📚
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontWeight: 700 }}>
              📍 Lihat Posisi Rak
            </span>
            <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", fontWeight: 700 }}>
              📖 Baca E-Book Online
            </span>
          </div>
        </div>
      )}

      {/* CARD SCENE 4: GRAND LEADERBOARD TROPHY CARD */}
      {frame >= 540 && frame < 720 && (
        <div
          style={{
            position: "absolute",
            top: "37%",
            left: 50,
            transform: `translateY(-50%) translateZ(190px) scale(${interpolate(card4Spring, [0, 1], [0.65, 1])})`,
            opacity: interpolate(card4Spring, [0, 1], [0, 1]),
            zIndex: 50,
            width: 490,
            padding: 28,
            borderRadius: 24,
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            border: "2.5px solid rgba(245, 158, 11, 0.65)",
            boxShadow: "0 35px 85px rgba(0, 0, 0, 0.85), 0 0 55px rgba(245, 158, 11, 0.4)",
            backdropFilter: "blur(26px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: "rgba(245, 158, 11, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy size={26} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#ffffff" }}>
                Top Readers Literasi
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Poin Kunjungan Kios & Peminjaman</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { rank: "🥇 #1", name: "Muhammad Fikri", kelas: "XII RPL 1", pts: "1.480 Poin", badge: "Master Literasi" },
              { rank: "🥈 #2", name: "Amanda Putri", kelas: "XI TKJ 2", pts: "1.250 Poin", badge: "Bookworm" },
              { rank: "🥉 #3", name: "Bima Sakti", kelas: "X DKV", pts: "980 Poin", badge: "Penjelajah" },
            ].map((u, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  borderRadius: 14,
                  backgroundColor: i === 0 ? "rgba(245, 158, 11, 0.18)" : "rgba(30, 41, 59, 0.7)",
                  border: i === 0 ? "1.5px solid rgba(245, 158, 11, 0.5)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#f59e0b" }}>{u.rank}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#ffffff" }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.kelas}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#34d399" }}>{u.pts}</div>
                  <div style={{ fontSize: 10, color: "#cbd5e1" }}>{u.badge}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DUAL DEVICE SCENE 5: PHOTOREALISTIC 3D IPHONE 16 PRO PWA */}
      {frame >= 720 && (
        <div
          style={{
            position: "absolute",
            top: "42%",
            right: 60,
            transform: `translateY(-50%) translateZ(160px) rotateY(-18deg) rotateX(8deg) scale(${interpolate(phoneSpring, [0, 1], [0.65, 1])})`,
            opacity: interpolate(phoneSpring, [0, 1], [0, 1]),
            zIndex: 50,
            width: 320,
            height: 640,
            backgroundColor: "#05070a",
            borderRadius: 48,
            border: "5px solid #334155",
            boxShadow: "0 35px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(56, 189, 248, 0.35)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Dynamic Island */}
          <div style={{ height: 32, display: "flex", justifyContent: "center", alignItems: "center", paddingTop: 8 }}>
            <div style={{ width: 95, height: 22, backgroundColor: "#0f172a", borderRadius: 20 }} />
          </div>

          {/* Smartphone Screen View (Digital Card PWA) */}
          <div style={{ flex: 1, padding: "16px 18px", backgroundColor: "#020617", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#34d399" }}>
                📱 KARTU ANGGOTA DIGITAL
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                PWA Siap Pasang di Smartphone Siswa
              </div>
            </div>

            {/* Simulated Digital Card */}
            <div
              style={{
                backgroundColor: "linear-gradient(135deg, #065f46, #064e3b)",
                background: "linear-gradient(135deg, #047857 0%, #064e3b 100%)",
                borderRadius: 16,
                padding: 16,
                border: "1.5px solid rgba(52, 211, 153, 0.4)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                color: "#ffffff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#a7f3d0" }}>SMKN 1 BERINGIN</span>
                <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#10b981", color: "#022c22", padding: "2px 6px", borderRadius: 4 }}>AKTIF</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, marginTop: 12 }}>
                MUHAMMAD FIKRI
              </div>
              <div style={{ fontSize: 11, color: "#cbd5e1" }}>
                NISN: 0072819201 • XII RPL
              </div>

              {/* QR Code Graphic */}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.3)", padding: 8, borderRadius: 8 }}>
                <QrCode size={38} color="#ffffff" />
                <span style={{ fontSize: 10, color: "#a7f3d0", fontWeight: 700 }}>Scan di Kios Presensi</span>
              </div>
            </div>

            <div
              style={{
                marginTop: "auto",
                padding: "14px",
                borderRadius: 14,
                backgroundColor: "rgba(16, 185, 129, 0.16)",
                border: "1.5px solid rgba(16, 185, 129, 0.45)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: "#34d399" }}>
                ✓ Ringan, Cepat & Paperless
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                Bisa dibuka offline di HP tanpa kuota!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM KINETIC CAPTIONS & HEADLINES (Opening4 Style) ================= */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 50,
          right: 50,
          textAlign: "center",
          zIndex: 40,
        }}
      >
        {/* SCENE 1 CAPTION */}
        {frame < 180 && (
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 24px",
                borderRadius: 999,
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                border: "1.5px solid rgba(16, 185, 129, 0.5)",
                fontSize: 16,
                fontWeight: 800,
                color: "#34d399",
                letterSpacing: "1.2px",
                marginBottom: 14,
              }}
            >
              🚀 INOVASI DIGITAL PERPUSTAKAAN
            </div>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.15,
                margin: "0 0 12px 0",
                background: "linear-gradient(to right, #ffffff, #a7f3d0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Akses Perpustakaan Zaman Now!
            </h2>
            <p style={{ fontSize: 22, color: "#94a3b8", margin: 0, fontWeight: 700 }}>
              Katalog Lengkap, Cepat, & Terintegrasi Digital
            </p>
          </div>
        )}

        {/* SCENE 2 CAPTION */}
        {frame >= 180 && frame < 360 && (
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 24px",
                borderRadius: 999,
                backgroundColor: "rgba(56, 189, 248, 0.2)",
                border: "1.5px solid rgba(56, 189, 248, 0.5)",
                fontSize: 16,
                fontWeight: 800,
                color: "#38bdf8",
                letterSpacing: "1.2px",
                marginBottom: 14,
              }}
            >
              ⚡ PENCARIAN REAL-TIME
            </div>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.15,
                margin: "0 0 12px 0",
                background: "linear-gradient(to right, #ffffff, #7dd3fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Cari Judul & Pantau Stok Instan
            </h2>
            <p style={{ fontSize: 22, color: "#94a3b8", margin: 0, fontWeight: 700 }}>
              Cek ketersediaan buku & nomor rak dalam 1 detik!
            </p>
          </div>
        )}

        {/* SCENE 3 CAPTION */}
        {frame >= 360 && frame < 540 && (
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 24px",
                borderRadius: 999,
                backgroundColor: "rgba(168, 85, 247, 0.2)",
                border: "1.5px solid rgba(168, 85, 247, 0.5)",
                fontSize: 16,
                fontWeight: 800,
                color: "#c084fc",
                letterSpacing: "1.2px",
                marginBottom: 14,
              }}
            >
              🤖 ASISTEN KECERDASAN BUATAN
            </div>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.15,
                margin: "0 0 12px 0",
                background: "linear-gradient(to right, #ffffff, #d8b4fe)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Bingung Baca Apa? Tanya AI!
            </h2>
            <p style={{ fontSize: 22, color: "#94a3b8", margin: 0, fontWeight: 700 }}>
              Rekomendasi buku otomatis sesuai minat & jurusan siswa
            </p>
          </div>
        )}

        {/* SCENE 4 CAPTION */}
        {frame >= 540 && frame < 720 && (
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 24px",
                borderRadius: 999,
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                border: "1.5px solid rgba(245, 158, 11, 0.5)",
                fontSize: 16,
                fontWeight: 800,
                color: "#fbbf24",
                letterSpacing: "1.2px",
                marginBottom: 14,
              }}
            >
              🏆 GAMIFIKASI & LEADERBOARD
            </div>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.15,
                margin: "0 0 12px 0",
                background: "linear-gradient(to right, #ffffff, #fde68a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Kumpulkan Poin & Jadi Juara
            </h2>
            <p style={{ fontSize: 22, color: "#94a3b8", margin: 0, fontWeight: 700 }}>
              Tingkatkan budaya literasi dengan ranking & badge seru!
            </p>
          </div>
        )}

        {/* SCENE 5 CAPTION */}
        {frame >= 720 && (
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 24px",
                borderRadius: 999,
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                border: "1.5px solid rgba(16, 185, 129, 0.5)",
                fontSize: 16,
                fontWeight: 800,
                color: "#34d399",
                letterSpacing: "1.2px",
                marginBottom: 14,
              }}
            >
              🌐 KUNJUNGI WEBSITE SEKARANG
            </div>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.15,
                margin: "0 0 12px 0",
                background: "linear-gradient(to right, #34d399, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              perpus.smkn1beringin.sch.id
            </h2>
            <p style={{ fontSize: 22, color: "#cbd5e1", margin: 0, fontWeight: 700 }}>
              Tersedia di Laptop, Tablet, & Smartphone (PWA) 📱💻
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
