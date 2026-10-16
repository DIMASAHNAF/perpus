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
  Lock,
  User,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { HeaderBar } from "../components/HeaderBar";

export const SceneLoginPetugas: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const cardAnim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 95 },
  });

  // Typing username "admin" (frames 20 to 45)
  const userFull = "admin";
  const userIndex = Math.min(
    userFull.length,
    Math.floor(
      interpolate(frame, [20, 42], [0, userFull.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );
  const typedUser = userFull.slice(0, userIndex);

  // Typing password "••••••••" (frames 48 to 72)
  const passFull = "••••••••";
  const passIndex = Math.min(
    passFull.length,
    Math.floor(
      interpolate(frame, [48, 70], [0, passFull.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );
  const typedPass = passFull.slice(0, passIndex);

  // Button click (frame 78+)
  const isClicked = frame >= 78;
  const clickSpring = isClicked
    ? spring({
        frame: frame - 78,
        fps,
        config: { damping: 10, mass: 0.5, stiffness: 220 },
      })
    : 1;

  // Success verified overlay (frame 95+)
  const successAnim = spring({
    frame: frame - 95,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 120 },
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
      <HeaderBar categoryTitle="Alur Petugas & Admin" badgeText="Keamanan & Akses Terpusat" />

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "16px",
          transform: `translateY(${interpolate(cardAnim, [0, 1], [25, 0])}px)`,
          opacity: cardAnim,
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
          Autentikasi Petugas Perpustakaan
        </span>
        <h2
          style={{
            fontSize: "38px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "4px 0 0 0",
          }}
        >
          Login Akses Panel Manajemen Sekolah
        </h2>
      </div>

      {/* Main Container Mockup */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          transform: `scale(${interpolate(cardAnim, [0, 1], [0.92, 1])})`,
          opacity: cardAnim,
          position: "relative",
        }}
      >
        {/* Top Back Link Button */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            borderRadius: "999px",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: "13px",
            fontWeight: 600,
            color: "#cbd5e1",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <ArrowLeft size={16} color="#60a5fa" />
          <span>Kembali ke Katalog Publik</span>
        </div>

        {/* Login Glassmorphic Card */}
        <div
          style={{
            width: "520px",
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            borderRadius: "26px",
            border: "1px solid rgba(59, 130, 246, 0.35)",
            padding: "36px 42px",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.15)",
            backdropFilter: "blur(24px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle top border glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
            }}
          />

          {/* Logo & Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                  boxSizing: "border-box",
                }}
              >
                <Img
                  src={staticFile("assets/logo.png")}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              <Img
                src={staticFile("assets/logo-kolaborasi.png")}
                style={{ height: "36px", objectFit: "contain" }}
              />
            </div>

            <h3
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Login Petugas
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0 0" }}>
              Masuk ke panel admin sistem perpustakaan sekolah
            </p>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Username Field */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#cbd5e1",
                  marginBottom: "8px",
                }}
              >
                <User size={14} color="#60a5fa" />
                <span>Username</span>
              </div>
              <div
                style={{
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  border: frame >= 20 && frame < 48 ? "2px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "15px",
                  color: typedUser ? "#ffffff" : "#64748b",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
              >
                {typedUser || "Masukkan username admin"}
                {frame >= 20 && frame < 48 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "2px",
                      height: "18px",
                      backgroundColor: "#3b82f6",
                      marginLeft: "4px",
                      opacity: Math.sin(frame * 0.5) > 0 ? 1 : 0,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#cbd5e1",
                  marginBottom: "8px",
                }}
              >
                <Lock size={14} color="#60a5fa" />
                <span>Password</span>
              </div>
              <div
                style={{
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  border: frame >= 48 && frame < 78 ? "2px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "18px",
                  letterSpacing: typedPass ? "3px" : "normal",
                  color: typedPass ? "#ffffff" : "#64748b",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
              >
                {typedPass || <span style={{ fontSize: "15px", letterSpacing: "normal" }}>Masukkan password</span>}
                {frame >= 48 && frame < 78 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "2px",
                      height: "18px",
                      backgroundColor: "#3b82f6",
                      marginLeft: "4px",
                      opacity: Math.sin(frame * 0.5) > 0 ? 1 : 0,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div
              style={{
                height: "50px",
                borderRadius: "14px",
                background: isClicked
                  ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 800,
                boxShadow: isClicked
                  ? "0 0 30px rgba(59, 130, 246, 0.8)"
                  : "0 10px 25px rgba(59, 130, 246, 0.4)",
                transform: `scale(${isClicked ? clickSpring : 1})`,
                marginTop: "6px",
                transition: "all 0.2s ease",
              }}
            >
              <span>Login</span>
            </div>

            {/* Default Credentials Note */}
            <div style={{ textAlign: "center", marginTop: "6px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "inline-block",
                }}
              >
                Akun default: <strong style={{ color: "#60a5fa" }}>admin</strong> | <strong style={{ color: "#60a5fa" }}>admin123</strong>
              </span>
            </div>
          </div>

          {/* Verification Success Overlay (Frame 95+) */}
          {frame >= 95 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(10, 16, 30, 0.92)",
                backdropFilter: "blur(10px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                transform: `scale(${successAnim})`,
                opacity: successAnim,
                zIndex: 50,
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(34, 197, 94, 0.2)",
                  border: "2px solid #22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 25px rgba(34, 197, 94, 0.4)",
                }}
              >
                <CheckCircle2 size={34} color="#22c55e" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#22c55e" }}>
                  AUTENTIKASI BERHASIL!
                </div>
                <div style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "4px" }}>
                  Mengarahkan ke Admin Command Center...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
