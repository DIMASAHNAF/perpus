import React from "react";
import { Img, staticFile } from "remotion";

interface HeaderBarProps {
  categoryTitle?: string;
  badgeText?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  categoryTitle = "Perpustakaan Digital",
  badgeText = "SMKN 1 Beringin",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "28px",
        left: "54px",
        right: "54px",
        height: "54px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 50,
      }}
    >
      {/* Logos */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Img
            src={staticFile("assets/logo.png")}
            style={{ width: "38px", height: "38px", objectFit: "contain" }}
          />
        </div>

        <Img
          src={staticFile("assets/logo-kolaborasi.png")}
          style={{ height: "32px", objectFit: "contain", filter: "brightness(1.1)" }}
        />
      </div>

      {/* Center / Right Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            padding: "8px 18px",
            borderRadius: "9999px",
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            color: "#60a5fa",
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 10px #22c55e",
            }}
          />
          {badgeText}
        </div>

        <div
          style={{
            color: "#94a3b8",
            fontSize: "16px",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          {categoryTitle}
        </div>
      </div>
    </div>
  );
};
