import multiavatar from "@multiavatar/multiavatar/esm";
import React, { useMemo, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

type AvatarProps = { seed: string; className?: string; style?: CSSProperties; alt?: string };

// In-memory global SVG URI cache with bounded capacity to eliminate repeated multiavatar()
// calculations and reduce CPU/garbage collection overhead.
const MAX_CACHE_SIZE = 120;
const avatarCache = new Map<string, string>();

function getCachedAvatarSrc(seed: string): string {
  if (!seed) return "";
  const cached = avatarCache.get(seed);
  if (cached) return cached;

  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(multiavatar(seed))}`;
  if (avatarCache.size >= MAX_CACHE_SIZE) {
    const firstKey = avatarCache.keys().next().value;
    if (firstKey) avatarCache.delete(firstKey);
  }
  avatarCache.set(seed, svgDataUrl);
  return svgDataUrl;
}

// Rendered as an <img> data URL instead of injecting raw SVG markup:
// images can't run scripts, so there's no XSS surface and no dangerouslySetInnerHTML.
export const Avatar = React.memo(function Avatar({ seed, className, style, alt = "User avatar" }: Readonly<AvatarProps>) {
  const src = useMemo(() => getCachedAvatarSrc(seed), [seed]);
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("rounded-full select-none object-cover", className)}
      style={style}
    />
  );
});
