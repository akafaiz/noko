"use client";

import { useEffect } from "react";
import { useAppSettings } from "@/lib/settings";
import { useEffectiveContrast } from "@/lib/useContrast";

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const FONTS: Record<string, string> = {
  sans: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
  mono: 'var(--font-geist-mono), ui-monospace, monospace',
  editorial: 'Georgia, "Times New Roman", serif',
};

export default function ThemeApplier() {
  const s = useAppSettings();
  const effective = useEffectiveContrast(s);
  const dark = effective === "dark";

  useEffect(() => {
    const root = document.documentElement;
    const bg = s.background || (dark ? "#000000" : "#f4f4f5");
    const fg = dark ? "#f5f5f5" : "#0a0a0a";
    const card = s.wallpaper
      ? dark
        ? "rgba(10,10,10,0.55)"
        : "rgba(255,255,255,0.62)"
      : dark
        ? "#0a0a0a"
        : "#ffffff";
    const cardHover = dark ? "#141414" : "#efefef";
    const border = dark ? "#232323" : "#e4e4e7";
    const muted = dark ? "#a3a3a3" : "#52525b";
    const faint = dark ? "#6b6b6b" : "#71717a";
    const accent = s.accent || "#ffffff";
    const accentFg = luminance(accent) > 0.62 ? "#000000" : "#ffffff";

    root.style.setProperty("--noko-bg", bg);
    root.style.setProperty("--noko-fg", fg);
    root.style.setProperty("--noko-card", card);
    root.style.setProperty("--noko-card-hover", cardHover);
    root.style.setProperty("--noko-border", border);
    root.style.setProperty("--noko-muted", muted);
    root.style.setProperty("--noko-faint", faint);
    root.style.setProperty("--noko-accent", accent);
    root.style.setProperty("--noko-accent-fg", accentFg);
    root.style.setProperty("--noko-font", FONTS[s.font] ?? FONTS.sans);
    root.style.colorScheme = dark ? "dark" : "light";
    root.dataset.wallpaper = s.wallpaper ? "on" : "off";
    root.dataset.contrast = effective;
    root.lang = s.lang;
    document.body.style.backgroundColor = s.wallpaper ? "transparent" : bg;
  }, [s, dark, effective]);

  return (
    <>
      {s.wallpaper && (
        <div
          aria-hidden
          className="noko-wallpaper"
          style={{
            backgroundImage: `url("${s.wallpaper}")`,
            filter: s.wallpaperBlur > 0 ? `blur(${s.wallpaperBlur}px)` : undefined,
            transform: s.wallpaperBlur > 0 ? "scale(1.05)" : undefined,
          }}
        />
      )}
      {s.wallpaper && (
        <div
          aria-hidden
          className="noko-wallpaper-overlay"
          style={{ background: dark ? "rgba(0,0,0,0.38)" : "rgba(255,255,255,0.38)" }}
        />
      )}
    </>
  );
}