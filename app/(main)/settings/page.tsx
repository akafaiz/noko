"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  CalendarDays,
  Music,
  Save,
  LogOut,
  Zap,
  ShieldCheck,
  MapPin,
  Search,
  Navigation,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  useAppSettings,
  saveSettings,
  getSettings,
  type EyeShape,
  type ThemeMode,
  type FontKey,
  type ContrastMode,
  type Lang,
} from "@/lib/settings";
import { useT } from "@/lib/i18n";
import { usePin, setPin, setOnboardingPending } from "@/lib/assistantData";
import BrandPersonalization from "@/components/BrandPersonalization";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ACCENTS = [
  { name: "Putih", en: "White", value: "#ffffff" },
  { name: "Emerald", en: "Emerald", value: "#10b981" },
  { name: "Amber", en: "Amber", value: "#f59e0b" },
  { name: "Cyan", en: "Cyan", value: "#06b6d4" },
  { name: "Rose", en: "Rose", value: "#f43f5e" },
];

const EYES: { key: EyeShape; label: string; en: string }[] = [
  { key: "pill", label: "Pill", en: "Pill" },
  { key: "rectangle", label: "Rectangle", en: "Rectangle" },
  { key: "prism", label: "Prism", en: "Prism" },
];

const FONTS: { key: FontKey; label: string; en: string }[] = [
  { key: "sans", label: "Modern Sans", en: "Modern Sans" },
  { key: "mono", label: "Tech Mono", en: "Tech Mono" },
  { key: "editorial", label: "Classic Editorial", en: "Classic Editorial" },
];

type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  country?: string;
  admin1?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, isDemo, signOut, demoLogin } = useAuth();
  const { t, lang } = useT();
  const s = useAppSettings();

  const [calendarEmbedUrl, setCalendarEmbedUrl] = useState(s.calendarEmbedUrl);
  const [playlistUrl, setPlaylistUrl] = useState(s.playlistUrl);
  const [saved, setSaved] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [wallpaperInput, setWallpaperInput] = useState(s.wallpaper);
  const [qrisInput, setQrisInput] = useState(s.qrisImage);
  const qrisFileRef = useRef<HTMLInputElement>(null);
  const pin = usePin();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const st = getSettings();
      setCalendarEmbedUrl(st.calendarEmbedUrl);
      setPlaylistUrl(st.playlistUrl);
      setWallpaperInput(st.wallpaper);
      setQrisInput(st.qrisImage);
    });
  }, []);

  const name =
    (user && (user as { name?: string }).name) ||
    (user?.email ? user.email.split("@")[0] : t("notLoggedIn"));

  const handleSave = () => {
    saveSettings({
      calendarEmbedUrl: calendarEmbedUrl.trim(),
      playlistUrl: playlistUrl.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const searchCity = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setLocError(null);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          q
        )}&count=6&language=${lang}&format=json`
      );
      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch {
      setLocError(t("locationError"));
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const pickCity = (r: GeoResult) => {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
    saveSettings({
      city: label || r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone || s.timezone,
    });
    setResults([]);
    setQuery("");
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setLocError(t("locationError"));
      return;
    }
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || s.timezone;
        saveSettings({
          city: t("locationCurrent"),
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timezone: tz,
        });
      },
      () => setLocError(t("locationError")),
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  const onWallpaperFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      setWallpaperInput(url);
      saveSettings({ wallpaper: url });
    };
    reader.readAsDataURL(file);
  };

  const applyWallpaperUrl = () => {
    saveSettings({ wallpaper: wallpaperInput.trim() });
  };

  const onQrisFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      setQrisInput(url);
      saveSettings({ qrisImage: url });
    };
    reader.readAsDataURL(file);
  };

  const applyQrisUrl = () => {
    saveSettings({ qrisImage: qrisInput.trim() });
  };

  const savePin = () => {
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinMsg(t("pinLength"));
      return;
    }
    if (newPin !== confirmPin) {
      setPinMsg(t("pinWrong"));
      return;
    }
    setPin(newPin);
    setNewPin("");
    setConfirmPin("");
    setPinMsg(t("pinSaved"));
  };

  const section = "noko-card p-6";
  const label = "noko-faint text-xs font-semibold uppercase tracking-[0.25em]";

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 min-h-[100dvh] overflow-y-auto md:overflow-hidden p-4 md:p-0">
      {/* Akun */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className={section}
      >
        <p className={label}>{t("account")}</p>
        <div className="mt-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="noko-border noko-fg flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="noko-fg text-sm font-medium">{name}</p>
              <p className="noko-muted text-xs">
                {isDemo ? t("demoMode") : user?.email ?? t("notLoggedIn")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!user && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
                <Link
                  href="/login"
                  className="noko-accent flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                >
                  {t("loginRegister")}
                </Link>
              </motion.div>
            )}
            <motion.button
              onClick={() => {
                setOnboardingPending(true);
                router.push("/");
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="noko-chip rounded-full px-4 py-2 text-xs"
            >
              {t("seeIntro")}
            </motion.button>
            {!isDemo && (
              <motion.button
                onClick={demoLogin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="noko-accent flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              >
                <Zap className="h-4 w-4" />
                {t("demoLogin")}
              </motion.button>
            )}
            {isDemo && (
              <span className="noko-accent flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("demoMode")}
              </span>
            )}
            <motion.button
              onClick={handleSignOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="noko-chip flex items-center gap-2 px-4 py-2 text-xs"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Lokasi */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.05 }}
        className={section}
      >
        <p className={label}>{t("location")}</p>
        <p className="noko-muted mt-2 text-xs">
          {t("locationCurrent")}: <span className="noko-fg">{s.city}</span> · {s.timezone}
        </p>

        <div className="mt-4 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchCity()}
            placeholder={t("locationSearch")}
            className="noko-input flex-1 px-4 py-2.5 text-sm"
          />
          <motion.button
            onClick={searchCity}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="noko-accent flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Search className="h-4 w-4" />
            {searching ? t("locationSearching") : t("locationSearchBtn")}
          </motion.button>
        </div>

        <motion.button
          onClick={useGps}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="noko-chip mt-3 flex items-center gap-2 px-4 py-2 text-xs"
        >
          <Navigation className="h-4 w-4" />
          {t("locationUseGps")}
        </motion.button>

        {locError && <p className="noko-muted mt-2 text-xs">{locError}</p>}

        {results.length > 0 && (
          <div className="mt-3 space-y-1">
            {results.map((r, i) => (
              <button
                key={`${r.latitude}-${r.longitude}-${i}`}
                onClick={() => pickCity(r)}
                className="noko-card-hover noko-border flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm"
              >
                <MapPin className="noko-muted h-3.5 w-3.5" />
                <span className="noko-fg">{r.name}</span>
                <span className="noko-faint truncate text-xs">
                  {[r.admin1, r.country].filter(Boolean).join(", ")}
                </span>
              </button>
            ))}
          </div>
        )}
        {!searching && query.trim() && results.length === 0 && !locError && (
          <p className="noko-faint mt-2 text-xs">{t("locationEmpty")}</p>
        )}
      </motion.section>

      {/* Penampilan */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
        className={section}
      >
        <p className={label}>{t("appearance")}</p>

        {/* Tema */}
        <div className="mt-4">
          <p className="noko-muted mb-2 text-xs">{t("theme")}</p>
          <div className="flex gap-2">
            {(["dark", "light"] as ThemeMode[]).map((m) => (
              <button
                key={m}
                onClick={() => saveSettings({ theme: m })}
                className={`noko-chip px-4 py-2 text-sm ${s.theme === m ? "noko-chip-active" : ""}`}
              >
                {m === "dark" ? t("dark") : t("light")}
              </button>
            ))}
          </div>
        </div>

        {/* Aksen */}
        <div className="mt-4">
          <p className="noko-muted mb-2 text-xs">{t("accent")}</p>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                onClick={() => saveSettings({ accent: a.value })}
                aria-label={lang === "en" ? a.en : a.name}
                className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: a.value,
                  borderColor: s.accent === a.value ? "var(--noko-accent)" : "transparent",
                }}
              />
            ))}
            <label className="noko-chip flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs">
              <input
                type="color"
                value={s.accent}
                onChange={(e) => saveSettings({ accent: e.target.value })}
                className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
              />
              {s.accent}
            </label>
          </div>
        </div>

        {/* Latar */}
        <div className="mt-4">
          <p className="noko-muted mb-2 text-xs">{t("background")}</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={s.background || (s.theme === "dark" ? "#000000" : "#f4f4f5")}
              onChange={(e) => saveSettings({ background: e.target.value })}
              className="h-8 w-10 cursor-pointer rounded border noko-border bg-transparent p-0"
            />
            <button
              onClick={() => saveSettings({ background: "" })}
              className="noko-chip px-3 py-1.5 text-xs"
            >
              {t("autoColor")}
            </button>
          </div>
        </div>

        {/* Kontras */}
        <div className="mt-4">
          <p className="noko-muted mb-2 text-xs">{t("contrast")}</p>
          <div className="flex flex-wrap gap-2">
            {(["auto", "dark", "light"] as ContrastMode[]).map((c) => (
              <button
                key={c}
                onClick={() => saveSettings({ contrast: c })}
                className={`noko-chip px-4 py-2 text-xs ${s.contrast === c ? "noko-chip-active" : ""}`}
              >
                {c === "auto"
                  ? t("contrastAuto")
                  : c === "dark"
                    ? t("contrastDark")
                    : t("contrastLight")}
              </button>
            ))}
          </div>
        </div>

        {/* Wallpaper */}
        <div className="mt-4">
          <p className="noko-muted mb-2 flex items-center gap-2 text-xs">
            <ImageIcon className="h-3.5 w-3.5" />
            {t("wallpaper")}
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={wallpaperInput.startsWith("data:") ? "" : wallpaperInput}
              onChange={(e) => setWallpaperInput(e.target.value)}
              placeholder={t("wallpaperUrl")}
              className="noko-input min-w-[12rem] flex-1 px-4 py-2.5 text-sm"
            />
            <motion.button
              onClick={applyWallpaperUrl}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="noko-accent rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              {t("save")}
            </motion.button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onWallpaperFile}
              className="hidden"
            />
            <motion.button
              onClick={() => fileRef.current?.click()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="noko-chip px-4 py-2.5 text-sm"
            >
              {t("wallpaperUpload")}
            </motion.button>
            {s.wallpaper && (
              <motion.button
                onClick={() => {
                  setWallpaperInput("");
                  saveSettings({ wallpaper: "" });
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="noko-chip flex items-center gap-1 px-4 py-2.5 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                {t("wallpaperRemove")}
              </motion.button>
            )}
          </div>
          <p className="noko-faint mt-2 text-xs">{t("wallpaperHint")}</p>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <p className="noko-muted text-xs">{t("wallpaperBlur")}</p>
              <span className="noko-faint text-xs tabular-nums">{s.wallpaperBlur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              step={1}
              value={s.wallpaperBlur}
              onChange={(e) => saveSettings({ wallpaperBlur: Number(e.target.value) })}
              className="mt-1 w-full accent-[var(--noko-accent)]"
            />
          </div>
        </div>

        {/* Bentuk mata */}
        <div className="mt-5">
          <p className="noko-muted mb-2 text-xs">{t("eyeShape")}</p>
          <div className="flex gap-2">
            {EYES.map((e) => (
              <button
                key={e.key}
                onClick={() => saveSettings({ eyeShape: e.key })}
                className={`noko-chip px-4 py-2 text-xs ${s.eyeShape === e.key ? "noko-chip-active" : ""}`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div className="mt-5">
          <p className="noko-muted mb-2 text-xs">{t("font")}</p>
          <div className="flex flex-wrap gap-2">
            {FONTS.map((f) => (
              <button
                key={f.key}
                onClick={() => saveSettings({ font: f.key })}
                className={`noko-chip px-4 py-2 text-xs ${s.font === f.key ? "noko-chip-active" : ""}`}
                style={{ fontFamily: f.key === "mono" ? "var(--font-geist-mono)" : undefined }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bahasa */}
        <div className="mt-5">
          <p className="noko-muted mb-2 text-xs">{t("language")}</p>
          <div className="flex gap-2">
            {(["id", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => saveSettings({ lang: l })}
                className={`noko-chip px-4 py-2 text-xs ${s.lang === l ? "noko-chip-active" : ""}`}
              >
                {l === "id" ? t("langId") : t("langEn")}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* QRIS */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
        className={section}
      >
        <p className={label}>{t("qrisUpload")}</p>
        {s.qrisImage ? (
          <div className="mt-3 flex justify-center">
            <img
              src={s.qrisImage}
              alt="QRIS"
              className="noko-border max-h-56 w-auto rounded-xl border bg-white p-2 object-contain"
            />
          </div>
        ) : (
          <p className="noko-faint mt-2 text-xs">{t("qrisEmpty")}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={qrisInput.startsWith("data:") ? "" : qrisInput}
            onChange={(e) => setQrisInput(e.target.value)}
            placeholder={t("qrisUrl")}
            className="noko-input min-w-[12rem] flex-1 px-4 py-2.5 text-sm"
          />
          <motion.button
            onClick={applyQrisUrl}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="noko-accent rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            {t("save")}
          </motion.button>
          <input
            ref={qrisFileRef}
            type="file"
            accept="image/*"
            onChange={onQrisFile}
            className="hidden"
          />
          <motion.button
            onClick={() => qrisFileRef.current?.click()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="noko-chip px-4 py-2.5 text-sm"
          >
            {t("qrisUpload")}
          </motion.button>
          {s.qrisImage && (
            <motion.button
              onClick={() => {
                setQrisInput("");
                saveSettings({ qrisImage: "" });
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="noko-chip px-4 py-2.5 text-sm"
            >
              {t("qrisRemove")}
            </motion.button>
          )}
        </div>
        <p className="noko-faint mt-2 text-xs">{t("qrisHint")}</p>
      </motion.section>

      {/* PIN Kasir */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.14 }}
        className={section}
      >
        <p className={label}>{t("pin")}</p>
        <p className="noko-muted mt-2 text-xs">
          {t("pin")}: {"•".repeat(pin.length)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="noko-faint mb-1 block text-xs">{t("newPin")}</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              className="noko-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="noko-faint mb-1 block text-xs">{t("confirmPin")}</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              className="noko-input px-3 py-2 text-sm"
            />
          </div>
        </div>
        <motion.button
          onClick={savePin}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="noko-accent mt-3 rounded-full px-4 py-2 text-xs font-semibold"
        >
          {t("pinChange")}
        </motion.button>
        {pinMsg && <p className="noko-muted mt-2 text-xs">{pinMsg}</p>}
      </motion.section>

      {/* Brand & Personalisasi */}
      <BrandPersonalization />

      {/* Integrasi */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.15 }}
        className={section}
      >
        <p className={label}>{t("integrations")}</p>

        <div className="mt-4">
          <label className="noko-faint mb-1 flex items-center gap-1 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            {t("calendarUrl")}
          </label>
          <input
            value={calendarEmbedUrl}
            onChange={(e) => setCalendarEmbedUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/embed?src=..."
            className="noko-input px-4 py-2.5 text-sm"
          />
        </div>

        <div className="mt-4">
          <label className="noko-faint mb-1 flex items-center gap-1 text-xs">
            <Music className="h-3.5 w-3.5" />
            {t("playlistUrl")}
          </label>
          <input
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="noko-input px-4 py-2.5 text-sm"
          />
          <p className="noko-faint mt-1 text-xs">{t("playlistHint")}</p>
        </div>

        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="noko-accent mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
        >
          <Save className="h-4 w-4" />
          {saved ? t("saved") : t("save")}
        </motion.button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.2 }}
        className={`${section} flex items-center gap-2`}
      >
        <UserIcon className="noko-faint h-4 w-4" />
        <p className="noko-faint text-xs">{t("footerNote")}</p>
      </motion.section>
    </div>
  );
}