import multiavatar from "@multiavatar/multiavatar/esm";
import { useMemo, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

type AvatarProps = { seed: string; className?: string; style?: CSSProperties };

// Rendered as an <img> data URL instead of injecting raw SVG markup:
// images can't run scripts, so there's no XSS surface and no dangerouslySetInnerHTML.
export function Avatar({ seed, className, style }: Readonly<AvatarProps>) {
  const src = useMemo(() => `data:image/svg+xml;utf8,${encodeURIComponent(multiavatar(seed))}`, [seed]);
  return <img src={src} alt="" className={cn("rounded-full", className)} style={style} />;
}
