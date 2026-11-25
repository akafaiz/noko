"use client";

import type { CSSProperties } from "react";
import type { EyeShape } from "@/lib/settings";

export function eyeStyle(shape: EyeShape): CSSProperties {
  if (shape === "rectangle") return { borderRadius: 14 };
  if (shape === "prism")
    return { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", borderRadius: 0 };
  return { borderRadius: 9999 };
}

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16) || 255;
  const g = parseInt(n.slice(2, 4), 16) || 255;
  const b = parseInt(n.slice(4, 6), 16) || 255;
  return `rgba(${r},${g},${b},${a})`;
}

type Props = {
  shape?: EyeShape;
  width?: number;
  height?: number;
  color?: string;
  gap?: number;
  glow?: boolean;
  className?: string;
};

export default function NokoEyes({
  shape = "pill",
  width = 92,
  height = 196,
  color = "#ffffff",
  gap = 16,
  glow = true,
  className,
}: Props) {
  const base = eyeStyle(shape);
  const isPrism = shape === "prism";
  const bg = `radial-gradient(120% 120% at 50% 20%, ${color} 0%, ${color} 55%, ${hexA(color, 0.72)} 100%)`;
  const shadow = glow
    ? `0 0 40px ${hexA(color, 0.85)}, 0 0 100px ${hexA(color, 0.45)}`
    : undefined;
  const prismGlow = glow
    ? `drop-shadow(0 0 10px ${hexA(color, 0.95)}) drop-shadow(0 0 26px ${hexA(color, 0.55)})`
    : undefined;

  const eye = () => (
    <span
      className="ai-eye"
      style={{
        display: "inline-block",
        width,
        height,
        opacity: 1,
        background: bg,
        boxShadow: isPrism ? undefined : shadow,
        ...base,
      }}
    />
  );

  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap }}>
      {[0, 1].map((i) =>
        isPrism && glow ? (
          <span key={i} style={{ display: "inline-block", filter: prismGlow }}>
            {eye()}
          </span>
        ) : (
          <span key={i} style={{ display: "inline-block" }}>
            {eye()}
          </span>
        )
      )}
    </span>
  );
}