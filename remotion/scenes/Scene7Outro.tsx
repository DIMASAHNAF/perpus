import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";

export const Scene7Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animations
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 11, mass: 0.8, stiffness: 100 },
  });

  const textAnim = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 90 },
  });

  const badgeAnim = spring({
    frame: frame - 32,
    fps,
    config: { damping: 15, mass: 1, stiffness: 85 },
  });

  const pulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.85, 1.15]);

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

      {/* Center Branding Group */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        {/* Animated Logo Shield with Glowing Ring */}
        <div
          style={{
            position: "relative",
            width: "160px",
            height: "160px",
            marginBottom: "36px",
            transform: `scale(${logoScale})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Outer Pulsing Glow */}
          <div
            style={{
              position: "absolute",
              inset: "-20px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)",
              transform: `scale(${pulse})`,
              filter: "blur(20px)",
            }}
          />

          {/* Glass Card Container */}
          <div
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "32px",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "2px solid rgba(56, 189, 248, 0.4)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(56, 189, 248, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(20px)",
            }}
          >
            <Img
              src={staticFile("assets/logo.png")}
              style={{
                width: "95px",
                height: "95px",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* Kolaborasi Sumut Berkah Logo Banner */}
        <div
          style={{
            marginBottom: "24px",
            transform: `translateY(${interpolate(textAnim, [0, 1], [30, 0])}px)`,
            opacity: textAnim,
          }}
        >
          <Img
            src={staticFile("assets/logo-kolaborasi.png")}
            style={{
              height: "38px",
              objectFit: "contain",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
            }}
          />
        </div>

        {/* Main Title */}
        <div
          style={{
            transform: `translateY(${interpolate(textAnim, [0, 1], [30, 0])}px)`,
            opacity: textAnim,
          }}
        >
          <h1
            style={{
              fontSize: "62px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
              background: "linear-gradient(135deg, #ffffff 30%, #93c5fd 75%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            PERPUSTAKAAN DIGITAL
          </h1>

          <div
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.15em",
              marginTop: "8px",
              textTransform: "uppercase",
            }}
          >
            SMK NEGERI 1 BERINGIN
          </div>
        </div>

        {/* Minimalist Slogan & Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginTop: "36px",
            transform: `translateY(${interpolate(badgeAnim, [0, 1], [30, 0])}px)`,
            opacity: badgeAnim,
          }}
        >
          {["Modern", "Cepat", "Akurat", "Terintegrasi"].map((tag, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                  letterSpacing: "0.05em",
                }}
              >
                {tag}
              </span>
              {i < 3 && (
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "#38bdf8",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Web Access Badge */}
        <div
          style={{
            marginTop: "40px",
            padding: "14px 32px",
            borderRadius: "9999px",
            background: "linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 15px 35px rgba(37, 99, 235, 0.4)",
            transform: `translateY(${interpolate(badgeAnim, [0, 1], [30, 0])}px)`,
            opacity: badgeAnim,
          }}
        >
          <ShieldCheck size={20} /> Siap Digunakan di Monitor Kios & Web Sekolah
        </div>
      </div>
    </div>
  );
};
