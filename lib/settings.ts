"use client";

import { useSyncExternalStore } from "react";

export type EyeShape = "pill" | "rectangle" | "prism";
export type ThemeMode = "dark" | "light";
export type FontKey = "sans" | "mono" | "editorial";
export type Lang = "id" | "en";
export type ContrastMode = "auto" | "dark" | "light";
export type LogoFrame = "circle" | "rounded" | "original";
export type LogoPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type Sticker = {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
};

export type StickerMode = "uniform" | "individual";

export type AppSettings = {
  calendarEmbedUrl: string;
  playlistUrl: string;
  theme: ThemeMode;
  accent: string;
  background: string;
  wallpaper: string;
  wallpaperBlur: number;
  qrisImage: string;
  brandLogo: string;
  brandLogoFrame: LogoFrame;
  brandStickers: Sticker[];
  brandStickerCount: number;
  brandStickerMode: StickerMode;
  brandSelectedStickerId: string | null;
  brandLogoSticker: boolean;
  brandDominantColor: string;
  contrast: ContrastMode;
  eyeShape: EyeShape;
  font: FontKey;
  lang: Lang;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  calendarEmbedUrl: "",
  playlistUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
  theme: "dark",
  accent: "#ffffff",
  background: "",
  wallpaper: "",
  wallpaperBlur: 0,
  qrisImage: "",
  brandLogo: "",
  brandLogoFrame: "original",
  brandStickers: [{ id: "sticker-1", x: 24, y: 130, size: 100, opacity: 100 }],
  brandStickerCount: 1,
  brandStickerMode: "uniform",
  brandSelectedStickerId: "sticker-1",
  brandLogoSticker: false,
  brandDominantColor: "",
  contrast: "auto",
  eyeShape: "pill",
  font: "sans",
  lang: "id",
  city: "Bekasi, Indonesia",
  latitude: -6.2383,
  longitude: 106.9756,
  timezone: "Asia/Jakarta",
};

const KEY = "noko_settings";
const EVENT = "noko-settings-change";

let cache: AppSettings = DEFAULT_SETTINGS;
let loaded = false;

function load(): AppSettings {
  if (loaded || typeof window === "undefined") return cache;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) cache = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return cache;
}

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("storage", handler);
  window.addEventListener(EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(EVENT, handler);
  };
}

function getSnapshot(): AppSettings {
  return load();
}

function getServerSnapshot(): AppSettings {
  return DEFAULT_SETTINGS;
}

export function useAppSettings(): AppSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function getSettings(): AppSettings {
  return load();
}

export function saveSettings(patch: Partial<AppSettings>) {
  const next = { ...load(), ...patch };
  cache = next;
  loaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  window.dispatchEvent(new Event(EVENT));
}