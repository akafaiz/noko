"use client";

import { useEffect, useState } from "react";
import type { AppSettings } from "./settings";

export function useWallpaperBrightness(wallpaper: string): "light" | "dark" | null {
  const [bright, setBright] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!wallpaper) {
      queueMicrotask(() => {
        if (!cancelled) setBright(null);
      });
      return () => {
        cancelled = true;
      };
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);
        const d = ctx.getImageData(0, 0, 32, 32).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) {
          sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        }
        const avg = sum / (d.length / 4);
        if (!cancelled) setBright(avg > 140 ? "light" : "dark");
      } catch {
        /* cross-origin canvas blocked: keep current */
      }
    };
    img.src = wallpaper;

    return () => {
      cancelled = true;
    };
  }, [wallpaper]);

  return bright;
}

export function useEffectiveContrast(s: AppSettings): "dark" | "light" {
  const bright = useWallpaperBrightness(s.wallpaper);
  if (s.contrast !== "auto") return s.contrast;
  if (s.wallpaper) return bright ?? s.theme;
  return s.theme;
}