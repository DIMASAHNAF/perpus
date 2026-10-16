import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

const PARTICLES: Particle[] = Array.from({ length: 35 }).map((_, i) => {
  const colors = ["#38bdf8", "#60a5fa", "#818cf8", "#c084fc", "#34d399"];
  return {
    x: ((i * 57) % 1920),
    y: ((i * 83) % 1080),
    size: 2 + (i % 4) * 1.5,
    speed: 0.3 + (i % 5) * 0.25,
    opacity: 0.2 + ((i * 13) % 50) / 100,
    color: colors[i % colors.length],
  };
});

export const FloatingParticles: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {PARTICLES.map((p, idx) => {
        const currentY = (p.y - frame * p.speed * 2) % 1150;
        const normalizedY = currentY < -50 ? currentY + 1150 : currentY;
        const driftX = Math.sin((frame + idx * 20) * 0.03) * 25;
        const pulse = interpolate(
          Math.sin((frame + idx * 15) * 0.08),
          [-1, 1],
          [p.opacity * 0.6, p.opacity * 1.2]
        );

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${p.x + driftX}px`,
              top: `${normalizedY}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              backgroundColor: p.color,
              opacity: pulse,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 6}px ${p.color}`,
            }}
          />
        );
      })}
    </div>
  );
};
