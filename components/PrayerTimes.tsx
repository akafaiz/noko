"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Clock } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAppSettings } from "@/lib/settings";
import {
  usePrayerTimes,
  nowMinutesInTz,
  parseTime,
  PRAYER_ORDER,
  type PrayerKey,
} from "@/lib/usePrayerTimes";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const pad2 = (n: number) => String(n).padStart(2, "0");

export default function PrayerTimes() {
  const { t, lang } = useT();
  const { timezone, city } = useAppSettings();
  const { timings, loading, error } = usePrayerTimes();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    queueMicrotask(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowMin = now ? nowMinutesInTz(timezone, now) : 0;
  const nowSec = nowMin * 60 + (now?.getSeconds() ?? 0);

  let nextKey: PrayerKey | null = null;
  let nextDiff = 24 * 3600;
  for (const k of PRAYER_ORDER) {
    const raw = timings[k];
    if (!raw) continue;
    const diff = (parseTime(raw) * 60 - nowSec + 86400) % 86400 || 86400;
    if (diff < nextDiff) {
      nextDiff = diff;
      nextKey = k;
    }
  }

  const countdown = `${pad2(Math.floor(nextDiff / 3600))}:${pad2(
    Math.floor((nextDiff % 3600) / 60)
  )}:${pad2(nextDiff % 60)}`;

  const label = (k: PrayerKey) => {
    if (lang === "en") return k;
    const map: Record<PrayerKey, string> = {
      Fajr: "Subuh",
      Dhuhr: "Dzuhur",
      Asr: "Ashar",
      Maghrib: "Maghrib",
      Isha: "Isya",
    };
    return map[k];
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="noko-card p-6"
    >
      <div className="flex items-center justify-between">
        <p className="noko-faint flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em]">
          <Moon className="h-4 w-4" />
          {t("prayerTimes")}
        </p>
        <span className="noko-faint text-[10px] uppercase tracking-wider">{city}</span>
      </div>

      {loading && <p className="noko-muted mt-3 text-sm">{t("loading")}</p>}
      {!loading && error && <p className="noko-muted mt-3 text-sm">{t("prayerError")}</p>}

      {!loading && !error && (
        <>
          <div className="mt-3 flex items-center gap-2">
            <Clock className="noko-accent-text h-4 w-4" />
            <span className="noko-fg text-sm">
              {nextKey ? `${t("nextPrayer")}: ${label(nextKey)}` : t("prayerTimes")}
            </span>
            <span className="noko-accent-text ml-auto text-lg font-semibold tabular-nums">
              {countdown}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-1">
            {PRAYER_ORDER.map((k) => {
              const active = k === nextKey;
              return (
                <div
                  key={k}
                  className={`rounded-xl border px-1 py-2 text-center ${
                    active ? "noko-accent noko-accent-border" : "noko-border"
                  }`}
                >
                  <p className="text-[10px] uppercase noko-fg">{label(k)}</p>
                  <p className="mt-0.5 text-xs font-semibold tabular-nums">
                    {timings[k] ?? "--:--"}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.section>
  );
}