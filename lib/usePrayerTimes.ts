"use client";

import { useEffect, useState } from "react";
import { useAppSettings } from "./settings";

export type PrayerKey = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export const PRAYER_ORDER: PrayerKey[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export type PrayerState = {
  timings: Partial<Record<PrayerKey, string>>;
  loading: boolean;
  error: boolean;
};

export function parseTime(t?: string): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function nowMinutesInTz(tz: string, date: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return h * 60 + m;
  } catch {
    return date.getHours() * 60 + date.getMinutes();
  }
}

export function nextPrayer(
  timings: Partial<Record<PrayerKey, string>>,
  nowMin: number
): { key: PrayerKey; inMin: number } | null {
  let best: { key: PrayerKey; inMin: number } | null = null;
  for (const k of PRAYER_ORDER) {
    const raw = timings[k];
    if (!raw) continue;
    const m = parseTime(raw);
    let diff = m - nowMin;
    if (diff <= 0) diff += 1440;
    if (!best || diff < best.inMin) best = { key: k, inMin: diff };
  }
  return best;
}

export function usePrayerTimes(): PrayerState {
  const { latitude, longitude } = useAppSettings();
  const [state, setState] = useState<PrayerState>({
    timings: {},
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setState((s) => ({ ...s, loading: true, error: false }));
    });

    const run = async () => {
      try {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=20`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        const t = data?.data?.timings;
        if (!t) throw new Error("no timings");
        if (cancelled) return;
        setState({
          timings: {
            Fajr: t.Fajr,
            Dhuhr: t.Dhuhr,
            Asr: t.Asr,
            Maghrib: t.Maghrib,
            Isha: t.Isha,
          },
          loading: false,
          error: false,
        });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: true }));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  return state;
}