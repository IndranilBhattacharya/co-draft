import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

// Pre-compute 28 deterministic, elegant flowing paths across the 1200x600 viewBox
const BEAM_PATHS = Array.from({ length: 28 }, (_, i) => {
  const startX = -180 + i * 50;
  const startY = -150 + Math.sin(i * 0.5) * 50;

  const ctrl1X = startX + 120 + Math.sin(i * 0.4) * 80;
  const ctrl1Y = startY + 90 + Math.cos(i * 0.5) * 70;

  const ctrl2X = ctrl1X + 130 + Math.sin(i * 0.6) * 80;
  const ctrl2Y = ctrl1Y + 90 + Math.cos(i * 0.7) * 70;

  const ctrl3X = ctrl2X + 130 + Math.sin(i * 0.8) * 80;
  const ctrl3Y = ctrl2Y + 90 + Math.cos(i * 0.9) * 70;

  const ctrl4X = ctrl3X + 130 + Math.sin(i * 1.0) * 80;
  const ctrl4Y = ctrl3Y + 90 + Math.cos(i * 1.1) * 70;

  const endX = ctrl4X + 140 + Math.sin(i * 1.2) * 80;
  const endY = ctrl4Y + 100 + Math.cos(i * 1.3) * 70;

  return `M${startX.toFixed(1)} ${startY.toFixed(1)} C${ctrl1X.toFixed(1)} ${ctrl1Y.toFixed(1)}, ${ctrl2X.toFixed(1)} ${ctrl2Y.toFixed(1)}, ${ctrl3X.toFixed(1)} ${ctrl3Y.toFixed(1)} S${ctrl4X.toFixed(1)} ${ctrl4Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
});

// A curated set of smoothly looping gradients that never collapse to a zero-length vector
const GRADIENTS = [
  { id: "beam-gradient-0", duration: 10, delay: 0 },
  { id: "beam-gradient-1", duration: 14, delay: 2 },
  { id: "beam-gradient-2", duration: 12, delay: 4 },
  { id: "beam-gradient-3", duration: 16, delay: 1 },
];

export const BackgroundBeams = React.memo(
  ({ className }: { className?: string }) => {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden select-none",
          className
        )}
        aria-hidden="true"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          width="100%"
          height="100%"
          viewBox="0 0 1200 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle background glow along base paths */}
          <path
            d={BEAM_PATHS[0]}
            stroke="url(#backgroundGlow)"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
          <path
            d={BEAM_PATHS[Math.floor(BEAM_PATHS.length / 2)]}
            stroke="url(#backgroundGlow)"
            strokeOpacity="0.08"
            strokeWidth="1"
          />

          {/* Render deterministic paths mapped to the shared motion gradients */}
          {BEAM_PATHS.map((path, index) => {
            const gradientId = GRADIENTS[index % GRADIENTS.length].id;
            return (
              <path
                key={`beam-path-${index}`}
                d={path}
                stroke={`url(#${gradientId})`}
                strokeOpacity={0.35 + (index % 4) * 0.1}
                strokeWidth="0.75"
                strokeLinecap="round"
              />
            );
          })}

          <defs>
            {/* Smoothly animated shared linear gradients */}
            {GRADIENTS.map(({ id, duration, delay }) => (
              <motion.linearGradient
                key={id}
                id={id}
                gradientUnits="userSpaceOnUse"
                initial={{
                  x1: "-20%",
                  y1: "-20%",
                  x2: "20%",
                  y2: "20%",
                }}
                animate={{
                  x1: ["-20%", "100%", "-20%"],
                  y1: ["-20%", "100%", "-20%"],
                  x2: ["20%", "140%", "20%"],
                  y2: ["20%", "140%", "20%"],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <stop offset="0%" stopColor="#000" stopOpacity="0" />
                <stop offset="25%" stopColor="#666" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#aaa" stopOpacity="0.7" />
                <stop offset="75%" stopColor="#fff" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </motion.linearGradient>
            ))}

            {/* Background radial glow */}
            <radialGradient
              id="backgroundGlow"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(600 300) rotate(90) scale(555 1560.62)"
            >
              <stop offset="0.1" stopColor="#888" stopOpacity="0.2" />
              <stop offset="0.4" stopColor="#aaa" stopOpacity="0.06" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }
);

BackgroundBeams.displayName = "BackgroundBeams";
