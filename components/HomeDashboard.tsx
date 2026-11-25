"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Cloud, X, Sparkles } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useWeather, describeWeather } from "@/lib/useWeather";
import { useAppSettings } from "@/lib/settings";
import { useEffectiveContrast } from "@/lib/useContrast";
import { useT, type Lang } from "@/lib/i18n";
import { iconFor } from "./WeatherWidget";
import WeatherWidget from "./WeatherWidget";
import MusicPlayer from "./MusicPlayer";
import NokoEyes from "./NokoEyes";
import Onboarding from "./Onboarding";
import { useAlarmUI } from "./Alarms";
import { isOnboardingPending, setOnboardingPending } from "@/lib/assistantData";
import BrandLogoSticker from "./BrandLogoSticker";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PILLS = [
  { key: "assistant", href: "/hub" },
  { key: "cashier", href: "/kasir" },
  { key: "study", href: "/study" },
  { key: "settings", href: "/settings" },
];

const SHORTCUTS = [
  { key: "shortcutAsk", href: "/hub" },
  { key: "shortcutHub", href: "/hub" },
  { key: "shortcutKasir", href: "/kasir" },
  { key: "shortcutStudy", href: "/study" },
];

const QUESTIONS = ["qWeather", "qProfit", "qAssistant"];

function fmtTime(now: Date, tz: string, lang: Lang): string {
  try {
    return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "id-ID", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
  } catch {
    return "--.--";
  }
}

function fmtDate(now: Date, tz: string, lang: Lang): string {
  try {
    return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "id-ID", {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now);
  } catch {
    return "";
  }
}

export default function HomeDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, lang } = useT();
  const settings = useAppSettings();
  const weather = useWeather();
  const { openAdd } = useAlarmUI();
  const effective = useEffectiveContrast(settings);
  const eyeColor = effective === "dark" ? "#ffffff" : "#111111";

  const [now, setNow] = useState<Date | null>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [happy, setHappy] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [showQuick, setShowQuick] = useState(false);
  const [detail, setDetail] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const happyTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isOnboardingPending()) {
      queueMicrotask(() => setShowOnboarding(true));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = Math.max(-14, Math.min(14, (e.clientX - cx) / 40));
      const y = Math.max(-10, Math.min(10, (e.clientY - cy) / 40));
      setGaze({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    if (!bubble) return;
    const id = setTimeout(() => setBubble(null), 4000);
    return () => clearTimeout(id);
  }, [bubble]);

  useEffect(
    () => () => {
      if (happyTimer.current) window.clearTimeout(happyTimer.current);
    },
    []
  );

  const smile = () => {
    setHappy(true);
    if (happyTimer.current) window.clearTimeout(happyTimer.current);
    happyTimer.current = window.setTimeout(() => setHappy(false), 1600);
  };

  const openMenu = () => {
    setBubble(t("greetingBubble"));
    setShowQuick(true);
    smile();
  };

  const answer = (text: string) => {
    setBubble(text);
    smile();
  };

  const askQuestion = (key: string) => {
    if (key === "qAssistant") {
      router.push("/hub");
      return;
    }
    if (key === "qWeather") {
      if (weather.temp == null || weather.loading) {
        answer(t("weatherNoData", { city: settings.city }));
        return;
      }
      const info =
        weather.code != null ? describeWeather(weather.code, weather.isDay, lang).label : "";
      const infoPart = info
        ? lang === "en"
          ? ` and ${info.toLowerCase()}`
          : ` dan ${info.toLowerCase()}`
        : "";
      answer(t("weatherHere", { city: settings.city, temp: weather.temp, info: infoPart }));
      return;
    }
    answer(t("kasirAnswer"));
  };

  const time = now ? fmtTime(now, settings.timezone, lang) : "--.--";
  const date = now ? fmtDate(now, settings.timezone, lang) : "";
  const wIcon =
    weather.code != null ? iconFor(weather.code, weather.isDay) : { Icon: Cloud };
  const weatherText = weather.loading
    ? "…"
    : weather.temp != null
      ? `${weather.temp}° ${weather.code != null ? describeWeather(weather.code, weather.isDay, lang).label : ""}`
      : "—";

  return (
    <div className="noko-app relative min-h-[100dvh] w-full overflow-y-auto md:overflow-hidden">
      <div className="absolute left-6 top-6">
        <p className="noko-faint text-[11px] uppercase tracking-[0.35em]">{t("appName")} HOME</p>
        <p className="noko-muted mt-1 text-sm">{date}</p>
      </div>

      <motion.button
        onClick={() => setDetail(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className="noko-chip absolute right-6 top-6 flex items-center gap-2 px-3.5 py-1.5 text-sm backdrop-blur"
      >
        <wIcon.Icon className="h-4 w-4" />
        {weatherText}
      </motion.button>

      {!user && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="absolute right-6 top-20"
        >
          <Link
            href="/login"
            className="noko-accent block rounded-full px-4 py-2 text-xs font-semibold shadow-lg"
          >
            {t("loginRegister")}
          </Link>
        </motion.div>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="noko-border pointer-events-none absolute h-[340px] w-[340px] rounded-full border" />

          <AnimatePresence>
            {bubble && (
              <motion.div
                key="bubble"
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="noko-accent absolute -top-20 z-10 max-w-xs rounded-full px-5 py-2.5 text-center text-sm font-medium shadow-lg"
              >
                {bubble}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={openMenu}
            aria-label="Noko"
            whileTap={{ scale: 0.96 }}
            className="relative"
          >
            <div
              style={{
                transform: `translate(${gaze.x}px, ${gaze.y}px)`,
                transition: "transform .2s ease-out",
              }}
            >
              <div className="ai-breathe">
                <div className="ai-glancer">
                  <NokoEyes
                    shape={settings.eyeShape}
                    color={eyeColor}
                    width={100}
                    height={happy ? 128 : 212}
                    gap={18}
                    glow={effective === "dark"}
                  />
                </div>
              </div>
            </div>
          </motion.button>
        </div>

        <motion.button
          onClick={openMenu}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="noko-faint mt-14 text-xs uppercase tracking-[0.35em] transition-opacity hover:opacity-70"
        >
          {t("hiThere")}
        </motion.button>

        <AnimatePresence>
          {showQuick && (
            <motion.div
              key="quick"
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 10 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mt-6 flex max-w-md flex-col items-center gap-3">
                <div className="flex flex-wrap justify-center gap-2">
                  {SHORTCUTS.map((s) => (
                    <motion.div
                      key={s.key + s.href}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      <Link
                        href={s.href}
                        className="noko-chip block px-3.5 py-1.5 text-xs backdrop-blur"
                      >
                        {t(s.key)}
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUESTIONS.map((q) => (
                    <motion.button
                      key={q}
                      onClick={() => askQuestion(q)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.94 }}
                      className="noko-chip flex items-center gap-1 px-3.5 py-1.5 text-xs backdrop-blur"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t(q)}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-6">
        <button
          onClick={openAdd}
          aria-label={t("alarms")}
          className="noko-fg text-6xl font-extralight leading-none tabular-nums tracking-tight transition-opacity hover:opacity-70"
        >
          {time}
        </button>
        <p className="noko-faint mt-2 text-xs uppercase tracking-[0.25em]">
          {settings.city} • {t("jakartaWib")}
        </p>
      </div>

      <div className="absolute bottom-6 right-6 flex flex-wrap items-center justify-end gap-2">
        {PILLS.map((p) => (
          <motion.div key={p.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
            <Link href={p.href} className="noko-chip block px-3.5 py-1.5 text-xs backdrop-blur">
              {t(p.key)}
            </Link>
          </motion.div>
        ))}
      </div>

      {detail && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur"
          onClick={() => setDetail(false)}
        >
          <div className="w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button
                onClick={() => setDetail(false)}
                className="noko-chip p-2"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <WeatherWidget />
            <MusicPlayer />
          </div>
        </div>
      )}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding
            onClose={() => {
              setOnboardingPending(false);
              setShowOnboarding(false);
            }}
          />
        )}
      </AnimatePresence>
      <BrandLogoSticker />
    </div>
  );
}