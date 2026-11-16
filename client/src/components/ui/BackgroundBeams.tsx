import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

// Pre-compute 32 deterministic, elegant flowing paths spanning across the 1200x900 canvas.
// Designed so that both wide monitors and tall portrait mobile screens have beams passing
// through top, middle, and bottom.
const BEAM_PATHS = Array.from({ length: 32 }, (_, i) => {
  const startX = -200 + i * 50;
  const startY = -150 + Math.sin(i * 0.4) * 60;

  const ctrl1X = startX + 120 + Math.sin(i * 0.3) * 70;
  const ctrl1Y = startY + 260 + Math.cos(i * 0.4) * 50;

  const ctrl2X = ctrl1X + 140 + Math.sin(i * 0.5) * 80;
  const ctrl2Y = ctrl1Y + 280 + Math.cos(i * 0.6) * 50;

  const ctrl3X = ctrl2X + 150 + Math.sin(i * 0.7) * 80;
  const ctrl3Y = ctrl2Y + 280 + Math.cos(i * 0.8) * 50;

  const endX = ctrl3X + 160 + Math.sin(i * 0.9) * 80;
  const endY = ctrl3Y + 300 + Math.cos(i * 1.0) * 60;

  return `M${startX.toFixed(1)} ${startY.toFixed(1)} C${ctrl1X.toFixed(1)} ${ctrl1Y.toFixed(1)}, ${ctrl2X.toFixed(1)} ${ctrl2Y.toFixed(1)}, ${ctrl3X.toFixed(1)} ${ctrl3Y.toFixed(1)} S${(ctrl3X + 100).toFixed(1)} ${(ctrl3Y + 150).toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
});

// A curated set of smoothly looping gradients with varied speeds and phases
const GRADIENTS = [
  { id: "beam-grad-0", duration: 11, delay: 0 },
  { id: "beam-grad-1", duration: 14, delay: 2 },
  { id: "beam-grad-2", duration: 12, delay: 4 },
  { id: "beam-grad-3", duration: 16, delay: 1 },
  { id: "beam-grad-4", duration: 13, delay: 3 },
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
          viewBox="0 0 1200 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ambient vignette background */}
          <rect width="1200" height="900" fill="url(#ambientGlow)" />

          {/* Faint static guide paths so curves are visible even between pulses */}
          {BEAM_PATHS.map((path, index) => (
            <path
              key={`base-path-${index}`}
              d={path}
              stroke="#ffffff"
              strokeOpacity="0.04"
              strokeWidth="0.8"
              fill="none"
            />
          ))}

          {/* Render animated beam pulses mapped to looping motion gradients */}
          {BEAM_PATHS.map((path, index) => {
            const gradientId = GRADIENTS[index % GRADIENTS.length].id;
            return (
              <path
                key={`beam-path-${index}`}
                d={path}
                stroke={`url(#${gradientId})`}
                strokeOpacity={0.6 + (index % 4) * 0.12}
                strokeWidth="1.25"
                strokeLinecap="round"
                fill="none"
              />
            );
          })}

          <defs>
            {/* Animated linear gradients sweeping across the canvas */}
            {GRADIENTS.map(({ id, duration, delay }) => (
              <motion.linearGradient
                key={id}
                id={id}
                gradientUnits="userSpaceOnUse"
                initial={{
                  x1: -300,
                  y1: -200,
                  x2: 300,
                  y2: 300,
                }}
                animate={{
                  x1: [-300, 1100, -300],
                  y1: [-200, 850, -200],
                  x2: [300, 1600, 300],
                  y2: [300, 1350, 300],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
                <stop offset="70%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="85%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </motion.linearGradient>
            ))}

            {/* Soft radial glow */}
            <radialGradient
              id="ambientGlow"
              cx="50%"
              cy="50%"
              r="60%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.008" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }
);

BackgroundBeams.displayName = "BackgroundBeams";
