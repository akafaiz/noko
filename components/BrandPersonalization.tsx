"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Lock, Unlock, Palette, Image as Image2Icon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAppSettings, saveSettings } from "@/lib/settings";
import { usePin } from "@/lib/assistantData";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type LogoFrame = "circle" | "rounded" | "original";

const FRAMES: { key: LogoFrame; label: string; en: string }[] = [
  { key: "circle", label: "Lingkaran", en: "Circle" },
  { key: "rounded", label: "Persegi Sudut Lembut", en: "Rounded Square" },
  { key: "original", label: "Tanpa Bingkai (Original)", en: "Original" },
];

export default function BrandPersonalization() {
  const router = useRouter();
  const { t, lang } = useT();
  const s = useAppSettings();
  const pin = usePin();

  const [unlocked, setUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [logoInput, setLogoInput] = useState(s.brandLogo);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const tryUnlock = () => {
    if (pinInput === pin) {
      setUnlocked(true);
      setShowPin(false);
      setPinInput("");
      setPinErr(null);
    } else {
      setPinErr(t("brandPinWrong"));
    }
  };

  const onLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      setLogoInput(url);
      saveSettings({ brandLogo: url });
      sampleDominantColor(url);
    };
    reader.readAsDataURL(file);
  };

  const applyLogoUrl = () => {
    const url = logoInput.trim();
    saveSettings({ brandLogo: url });
    if (url) sampleDominantColor(url);
  };

  const removeLogo = () => {
    setLogoInput("");
    saveSettings({ brandLogo: "" });
  };

  const sampleDominantColor = (url: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 64, 64);
        const d = ctx.getImageData(0, 0, 64, 64).data;
        const counts: Record<string, number> = {};
        let best = "";
        let bestScore = -1;
        for (let i = 0; i < d.length; i += 8) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const a = d[i + 3];
          if (a < 100) continue;
          const key = `${r >> 4},${g >> 4},${b >> 4}`;
          counts[key] = (counts[key] || 0) + 1;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const sat = Math.max(r, g, b) - Math.min(r, g, b);
          const score = counts[key] * (1 + sat / 255) * (1 + Math.abs(lum - 128) / 255);
          if (score > bestScore) {
            bestScore = score;
            best = `rgb(${r},${g},${b})`;
          }
        }
        if (best) {
          const hex = best
            .match(/\d+/g)!
            .map((n) => parseInt(n, 10).toString(16).padStart(2, "0"))
            .join("");
          saveSettings({ brandDominantColor: `#${hex}`, accent: `#${hex}` });
        }
      } catch {
        /* ignore sampling errors */
      }
    };
    img.src = url;
  };

  const toggleSticker = () => {
    saveSettings({ brandLogoSticker: !s.brandLogoSticker });
  };

  const setMode = (m: "uniform" | "individual") => {
    saveSettings({ brandStickerMode: m });
  };

  const changeCount = (delta: number) => {
    const next = Math.max(1, Math.min(8, (s.brandStickerCount ?? 1) + delta));
    if (next === (s.brandStickerCount ?? 1)) return;
    const stickers = [...(s.brandStickers ?? [])];
    if (next > stickers.length) {
      for (let i = stickers.length; i < next; i++) {
        stickers.push({
          id: `sticker-${i + 1}`,
          x: 24 + i * 22,
          y: 130 + i * 22,
          size: 100,
          opacity: 100,
        });
      }
    } else {
      stickers.length = next;
    }
    saveSettings({ brandStickerCount: next, brandStickers: stickers });
  };

  const setSelectedSticker = (id: string) => {
    saveSettings({ brandSelectedStickerId: id });
  };

  const applySizeOpacity = (size?: number, opacity?: number) => {
    const stickers = [...(s.brandStickers ?? [])];
    const mode = s.brandStickerMode ?? "uniform";
    const selectedId = s.brandSelectedStickerId;
    if (mode === "uniform") {
      for (const st of stickers) {
        if (size !== undefined) st.size = size;
        if (opacity !== undefined) st.opacity = opacity;
      }
    } else {
      const st = stickers.find((s) => s.id === selectedId);
      if (st) {
        if (size !== undefined) st.size = size;
        if (opacity !== undefined) st.opacity = opacity;
      }
    }
    saveSettings({ brandStickers: stickers });
  };

  const repositionStickers = () => {
    localStorage.setItem("noko_sticker_edit_mode", "true");
    window.dispatchEvent(new Event("noko-sticker-edit-change"));
    router.push("/");
  };

  const frameItem = (f: (typeof FRAMES)[number]) => (
    <button
      key={f.key}
      onClick={() => saveSettings({ brandLogoFrame: f.key })}
      className={`noko-chip px-4 py-2 text-xs ${
        s.brandLogoFrame === f.key ? "noko-chip-active" : ""
      }`}
    >
      {lang === "en" ? f.en : f.label}
    </button>
  );

  const lockedOverlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur"
      onClick={() => setShowPin(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="noko-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="noko-fg text-sm font-semibold">{t("brandLock")}</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
          autoFocus
          className="noko-input mt-2 px-3 py-2 text-sm"
          placeholder={t("brandPinPrompt")}
        />
        {pinErr && <p className="noko-muted mt-1 text-xs">{pinErr}</p>}
        <div className="mt-4 flex gap-2">
          <motion.button
            onClick={tryUnlock}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className="noko-accent flex-1 rounded-full py-2 text-sm font-semibold"
          >
            {t("brandUnlock")}
          </motion.button>
          <button
            onClick={() => setShowPin(false)}
            className="noko-chip rounded-full px-4 py-2 text-xs"
          >
            {t("cancel")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="noko-card p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="noko-muted h-4 w-4" />
          <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
            {t("brandPersonalization")}
          </p>
        </div>
        {!unlocked && (
          <motion.button
            onClick={() => setShowPin(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="noko-chip flex items-center gap-1 px-3 py-1.5 text-xs"
          >
            <Lock className="h-3.5 w-3.5" />
            {t("brandLock")}
          </motion.button>
        )}
        {unlocked && (
          <motion.button
            onClick={() => setUnlocked(false)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="noko-chip flex items-center gap-1 px-3 py-1.5 text-xs"
          >
            <Unlock className="h-3.5 w-3.5" />
            {t("locked")}
          </motion.button>
        )}
      </div>

      {showPin && unlocked === false && lockedOverlay}

      {!unlocked && (
        <p className="noko-muted mt-3 text-sm text-center">
          {t("unlockMenu")}
        </p>
      )}

      {unlocked && (
        <>
          <div className="mt-4">
            <label className="noko-faint mb-2 block text-xs">{t("brandLogo")}</label>
            {s.brandLogo ? (
              <div className="flex items-center justify-center gap-2">
                <img
                  src={s.brandLogo}
                  alt="Brand logo"
                  className="noko-border max-h-48 w-auto rounded-xl border bg-white p-2 object-contain"
                />
                <motion.button
                  onClick={removeLogo}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="noko-chip px-3 py-2 text-xs"
                >
                  <Image2Icon className="h-3 w-3" /> {t("brandLogoRemove")}
                </motion.button>
              </div>
            ) : (
              <p className="noko-faint mt-2 text-xs">{t("brandLogoRemove")}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={logoInput.startsWith("data:") ? "" : logoInput}
                onChange={(e) => setLogoInput(e.target.value)}
                placeholder={t("brandLogoUrl")}
                className="noko-input min-w-[12rem] flex-1 px-4 py-2.5 text-sm"
              />
              <motion.button
                onClick={applyLogoUrl}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="noko-accent rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                {t("save")}
              </motion.button>
              <input
                ref={logoFileRef}
                type="file"
                accept="image/*"
                onChange={onLogoFile}
                className="hidden"
              />
              <motion.button
                onClick={() => logoFileRef.current?.click()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="noko-chip px-4 py-2.5 text-sm"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {t("brandLogoUpload")}
              </motion.button>
            </div>
          </div>

          <div className="mt-4">
            <label className="noko-faint mb-2 block text-xs">{t("brandLogoFrame")}</label>
            <div className="flex flex-wrap gap-2">{FRAMES.map(frameItem)}</div>
          </div>

          <div className="mt-4">
            <label className="noko-faint mb-2 block text-xs">{t("brandStickerMode")}</label>
            <motion.button
              onClick={toggleSticker}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className={`noko-chip rounded-full px-4 py-2 text-sm ${
                s.brandLogoSticker ? "noko-chip-active" : ""
              }`}
            >
              {s.brandLogoSticker ? t("on") : t("off")}
            </motion.button>
          </div>

          {s.brandLogoSticker && (
            <>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="noko-faint text-xs font-semibold">{t("brandStickerCount")}</label>
                  <span className="noko-fg text-xs font-mono tabular-nums">
                    {s.brandStickerCount ?? 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => changeCount(-1)}
                    disabled={(s.brandStickerCount ?? 1) <= 1}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    className={`noko-chip rounded-full px-4 py-2 text-xs ${
                      (s.brandStickerCount ?? 1) <= 1 ? "opacity-50" : ""
                    }`}
                  >
                    −
                  </motion.button>
                  <motion.button
                    onClick={() => changeCount(1)}
                    disabled={(s.brandStickerCount ?? 1) >= 8}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    className={`noko-chip rounded-full px-4 py-2 text-xs ${
                      (s.brandStickerCount ?? 1) >= 8 ? "opacity-50" : ""
                    }`}
                  >
                    +
                  </motion.button>
                </div>
              </div>

              <div className="mt-4">
                <label className="noko-faint mb-2 block text-xs">{t("brandStickerMode")}</label>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setMode("uniform")}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    className={`noko-chip rounded-full px-3 py-1.5 text-xs ${
                      s.brandStickerMode === "uniform" ? "noko-chip-active" : ""
                    }`}
                  >
                    {t("brandStickerUniform")}
                  </motion.button>
                  <motion.button
                    onClick={() => setMode("individual")}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    className={`noko-chip rounded-full px-3 py-1.5 text-xs ${
                      s.brandStickerMode === "individual" ? "noko-chip-active" : ""
                    }`}
                  >
                    {t("brandStickerIndividual")}
                  </motion.button>
                </div>
              </div>

              {s.brandStickerMode === "individual" && (
                <div className="mt-4">
                  <label className="noko-faint mb-2 block text-xs">{t("brandStickerSelect")}</label>
                  <div className="flex flex-wrap gap-2">
                    {(s.brandStickers ?? []).map((st) => {
                      const idx = (s.brandStickers ?? []).indexOf(st) + 1;
                      return (
                        <motion.button
                          key={st.id}
                          onClick={() => setSelectedSticker(st.id)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          className={`noko-chip rounded-full px-4 py-2 text-xs ${
                            s.brandSelectedStickerId === st.id ? "noko-chip-active" : ""
                          }`}
                        >
                          #{idx}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="noko-faint mb-2 block text-xs">{t("brandStickerSize")}</label>
                <input
                  type="range"
                  min={50}
                  max={400}
                  step={10}
                  value={
                    s.brandStickerMode === "individual"
                      ? (s.brandStickers ?? []).find((st) => st.id === s.brandSelectedStickerId)?.size ??
                        100
                      : (s.brandStickers?.[0]?.size ?? 100)
                  }
                  onChange={(e) => applySizeOpacity(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--noko-accent)]"
                />
                <span className="noko-faint text-xs tabular-nums">
                  {(
                    s.brandStickerMode === "individual"
                      ? (s.brandStickers ?? []).find((st) => st.id === s.brandSelectedStickerId)?.size ??
                        100
                      : (s.brandStickers?.[0]?.size ?? 100)
                  )}%
                </span>
              </div>

              <div className="mt-4">
                <label className="noko-faint mb-2 block text-xs">{t("brandStickerOpacity")}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={
                    s.brandStickerMode === "individual"
                      ? (s.brandStickers ?? []).find((st) => st.id === s.brandSelectedStickerId)?.opacity ??
                        100
                      : (s.brandStickers?.[0]?.opacity ?? 100)
                  }
                  onChange={(e) => applySizeOpacity(undefined, Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--noko-accent)]"
                />
                <span className="noko-faint text-xs tabular-nums">
                  {(
                    s.brandStickerMode === "individual"
                      ? (s.brandStickers ?? []).find((st) => st.id === s.brandSelectedStickerId)?.opacity ??
                        100
                      : (s.brandStickers?.[0]?.opacity ?? 100)
                  )}%
                </span>
              </div>

              <div className="mt-5 border-t noko-border pt-4">
                <motion.button
                  onClick={repositionStickers}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="noko-accent w-full rounded-xl px-4 py-3 text-sm font-semibold"
                >
                  {t("brandStickerEdit")}
                </motion.button>
                <div className="flex items-center gap-2 mb-3">
                  <label className="noko-faint text-xs">{t("brandColor")}</label>
                  <span
                    className="h-6 w-6 rounded-full border"
                    style={{
                      backgroundColor: s.brandDominantColor || s.accent || "#ffffff",
                      borderColor: "var(--noko-border)",
                    }}
                  />
                </div>
                <label className="noko-faint mb-2 block text-xs">{t("brandAutoMatch")}</label>
                <motion.button
                  onClick={() => {
                    if (!s.brandLogo) return;
                    sampleDominantColor(s.brandLogo);
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="noko-chip rounded-full px-3 py-1.5 text-xs"
                >
                  {t("brandAutoMatch")}
                </motion.button>
              </div>
            </>
          )}
        </>
      )}
    </motion.section>
  );
}
