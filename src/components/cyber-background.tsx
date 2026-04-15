"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface CyberBackgroundProps {
  /** "hero" = intense (login/register). "subtle" = softer (dashboard pages). "minimal" = just glows. */
  intensity?: "hero" | "subtle" | "minimal";
  className?: string;
}

export function CyberBackground({
  intensity = "subtle",
  className = "",
}: CyberBackgroundProps) {
  const particleCount = intensity === "hero" ? 40 : intensity === "subtle" ? 20 : 0;
  const gridOpacity = intensity === "hero" ? "opacity-60" : "opacity-30";
  const glowOpacity = intensity === "hero" ? 0.22 : intensity === "subtle" ? 0.12 : 0.08;

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: `${(i * 2.37) % 100}%`,
      size: [3, 4, 5, 6, 7][i % 5],
      duration: 9 + (i % 7),
      delay: (i * 0.31) % 6,
    }));
  }, [particleCount]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Glows */}
      <motion.div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[160px]"
        style={{
          width: intensity === "hero" ? 1100 : 700,
          height: intensity === "hero" ? 750 : 500,
          background: `radial-gradient(circle, rgba(232,123,30,${glowOpacity}) 0%, transparent 65%)`,
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 rounded-full blur-[120px]"
        style={{
          width: intensity === "hero" ? 800 : 500,
          height: intensity === "hero" ? 550 : 350,
          background: `radial-gradient(circle, rgba(244,168,52,${glowOpacity * 0.7}) 0%, transparent 65%)`,
        }}
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {intensity !== "minimal" && (
        <motion.div
          className="absolute right-[10%] top-[35%] rounded-full blur-[120px]"
          style={{
            width: intensity === "hero" ? 700 : 400,
            height: intensity === "hero" ? 700 : 400,
            background: `radial-gradient(circle, rgba(139,46,26,${glowOpacity * 0.8}) 0%, transparent 65%)`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Cyber grid */}
      {intensity !== "minimal" && (
        <div
          className={`absolute inset-0 ${gridOpacity}`}
          style={{
            backgroundImage: `linear-gradient(rgba(232,123,30,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(232,123,30,0.14) 1px, transparent 1px)`,
            backgroundSize: intensity === "hero" ? "50px 50px" : "70px 70px",
            maskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 60%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 60%)",
            animation: "gridMove 10s linear infinite",
          }}
        />
      )}

      {/* Particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block rounded-full"
          style={{
            left: p.left,
            top: "100%",
            width: p.size,
            height: p.size,
            background: "rgba(232, 123, 30, 0.55)",
            boxShadow: "0 0 8px rgba(232, 123, 30, 0.4)",
          }}
          animate={{
            y: [0, -(typeof window !== "undefined" ? window.innerHeight * 1.3 : 800)],
            opacity: [0, 1, 0.7, 0],
            scale: [1, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
