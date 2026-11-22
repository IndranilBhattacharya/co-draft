import React from "react";
import { cn } from "../../lib/utils";

// Pre-computed 24 deterministic, elegant flowing paths spanning across the 1200x900 canvas.
// Optimized count (reduced from 32 to 24) reduces DOM node footprint while maintaining full visual density.
const BEAM_PATHS = Array.from({ length: 24 }, (_, i) => {
  const startX = -180 + i * 65;
  const startY = -120 + Math.sin(i * 0.4) * 60;

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

const GRADIENTS = [
  { id: "beam-grad-0", dur: "11s", begin: "0s" },
  { id: "beam-grad-1", dur: "14s", begin: "2s" },
  { id: "beam-grad-2", dur: "12s", begin: "4s" },
  { id: "beam-grad-3", dur: "16s", begin: "1s" },
];

export const BackgroundBeams = React.memo(
  ({ className }: { className?: string }) => {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden select-none [contain:paint] [transform:translateZ(0)]",
          className
        )}
        aria-hidden="true"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
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
              strokeOpacity="0.03"
              strokeWidth="0.8"
              fill="none"
            />
          ))}

          {/* Render animated beam pulses mapped to native declarative SVG animations */}
          {BEAM_PATHS.map((path, index) => {
            const gradientId = GRADIENTS[index % GRADIENTS.length].id;
            return (
              <path
                key={`beam-path-${index}`}
                d={path}
                stroke={`url(#${gradientId})`}
                strokeOpacity={0.55 + (index % 3) * 0.15}
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
            );
          })}

          <defs>
            {/* Native SVG declarative animations - executes natively in browser compositor with 0% JS overhead */}
            {GRADIENTS.map(({ id, dur, begin }) => (
              <linearGradient
                key={id}
                id={id}
                gradientUnits="userSpaceOnUse"
                x1="-300"
                y1="-200"
                x2="300"
                y2="300"
              >
                <animate
                  attributeName="x1"
                  values="-300; 1100; -300"
                  dur={dur}
                  begin={begin}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="y1"
                  values="-200; 850; -200"
                  dur={dur}
                  begin={begin}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="x2"
                  values="300; 1600; 300"
                  dur={dur}
                  begin={begin}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="y2"
                  values="300; 1350; 300"
                  dur={dur}
                  begin={begin}
                  repeatCount="indefinite"
                />
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
                <stop offset="70%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="85%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
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
