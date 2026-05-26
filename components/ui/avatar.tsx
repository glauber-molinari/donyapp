"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  const single = parts[0] ?? "?";
  return single.slice(0, 2).toUpperCase();
}

/** Paleta determinística: 5 pares bg/text baseados no hash do nome */
const PALETTES = [
  "bg-ds-accent-soft  text-ds-accent",
  "bg-ds-info-soft    text-ds-info",
  "bg-ds-success-soft text-ds-success",
  "bg-ds-warn-soft    text-ds-warn",
  "bg-ds-cream        text-ds-ink",
] as const;

function paletteForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length]!;
}

const sizeClass = {
  xs: "h-5 w-5 text-[10px] leading-none",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export type AvatarSize = keyof typeof sizeClass;

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium ring-1 ring-ds-hairline",
        sizeClass[size],
        showImg ? "bg-ds-cream" : paletteForName(name),
        className
      )}
      title={name}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar dinâmico de terceiros
        <img
          key={src ?? ""}
          src={src!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initialsFromName(name)
      )}
    </div>
  );
}
