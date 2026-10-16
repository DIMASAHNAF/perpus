import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FloatingParticles } from "./FloatingParticles";

export const BackgroundGrid: React.FC<{
  accentColor?: string;
  secondaryColor?: string;
}> = ({
  accentColor = "#2563eb",
  secondaryColor = "#0284c7",
}) => {
  const frame = useCurrentFrame();
  const moveY = (frame * 0.6) % 60;
  
  const pulse1 = interpolate(
    Math.sin(frame * 0.04),
    [-1, 1],
    [0.22, 0.38]
  );
  
  const pulse2 = interpolate(
    Math.cos(frame * 0.035),
    [-1, 1],
    [0.18, 0.32]
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030712",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {/* Aurora Blob 1 - Top Left */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "15%",
          width: "1000px",
          height: "1000px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor} 0%, rgba(37, 99, 235, 0.1) 45%, transparent 70%)`,
          opacity: pulse1,
          filter: "blur(110px)",
          transform: `scale(${1 + Math.sin(frame * 0.03) * 0.1}) translate(${Math.sin(frame * 0.02) * 30}px, ${Math.cos(frame * 0.02) * 20}px)`,
        }}
      />

      {/* Aurora Blob 2 - Bottom Right */}
      <div
        style={{
          position: "absolute",
          bottom: "-25%",
          right: "10%",
          width: "950px",
          height: "950px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${secondaryColor} 0%, rgba(14, 165, 233, 0.1) 45%, transparent 70%)`,
          opacity: pulse2,
          filter: "blur(120px)",
          transform: `scale(${1 + Math.cos(frame * 0.025) * 0.08}) translate(${Math.cos(frame * 0.02) * -30}px, ${Math.sin(frame * 0.02) * -20}px)`,
        }}
      />

      {/* Aurora Blob 3 - Center Deep Indigo Accent */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "40%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #4f46e5 0%, transparent 65%)",
          opacity: 0.15,
          filter: "blur(130px)",
        }}
      />

      {/* Subtle Perspective Grid Floor */}
      <div
        style={{
          position: "absolute",
          inset: "-80px",
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: `translateY(${moveY}px)`,
        }}
      />

      {/* Micro Floating Glowing Particles */}
      <FloatingParticles />

      {/* Vignette & Cinematic Dark Edge */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(3, 7, 18, 0.75) 80%, rgba(3, 7, 18, 0.95) 100%)",
        }}
      />
    </div>
  );
};
