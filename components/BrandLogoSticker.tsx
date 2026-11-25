"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAppSettings, saveSettings } from "@/lib/settings";
import { useEffectiveContrast } from "@/lib/useContrast";
import { usePin } from "@/lib/assistantData";
import { useT } from "@/lib/i18n";
import { useSmoothScroll } from "@/components/SmoothScroll";

const EDIT_KEY = "noko_sticker_edit_mode";
const MIN_SIZE = 50;
const MAX_SIZE = 400;

export default function BrandLogoSticker() {
  const { t } = useT();
  const s = useAppSettings();
  const pin = usePin();
  const effective = useEffectiveContrast(s);

  const { pause, resume } = useSmoothScroll();
  const [editMode, setEditMode] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(EDIT_KEY) === "true" : false
  );
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);

  const locked = Boolean(pin);
  const frame = s.brandLogoFrame ?? "original";
  const mode = s.brandStickerMode ?? "uniform";
  const selectedId = s.brandSelectedStickerId;
  const stickers = useMemo(() => s.brandStickers ?? [], [s.brandStickers]);
  const activeStickers = stickers.slice(0, s.brandStickerCount ?? 1);
  const selectedSticker = activeStickers.find((st) => st.id === selectedId);

  // Edit mode detection across pages (localStorage + custom event).
  useEffect(() => {
    const onChange = () => setEditMode(localStorage.getItem(EDIT_KEY) === "true");
    window.addEventListener("storage", onChange);
    window.addEventListener("noko-sticker-edit-change", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("noko-sticker-edit-change", onChange);
    };
  }, []);

  const disableEditMode = useCallback(() => {
    localStorage.setItem(EDIT_KEY, "false");
    window.dispatchEvent(new Event("noko-sticker-edit-change"));
    setEditMode(false);
  }, []);

  const onStickerPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (locked || !editMode || !s.brandLogo) return;
      pause();
      e.stopPropagation();
      e.preventDefault();
      const sticker = activeStickers.find((s) => s.id === id);
      if (!sticker) return;
      startRef.current = { clientX: e.clientX, clientY: e.clientY };
      setDrag({ id, x: sticker.x, y: sticker.y });
      if (mode === "individual" && selectedId !== id) {
        saveSettings({ brandSelectedStickerId: id });
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [locked, editMode, s.brandLogo, activeStickers, mode, selectedId, pause]
  );

  const onPointerUp = useCallback(() => {
    if (!drag) return;
    const sticker = activeStickers.find((s) => s.id === drag.id);
    if (!sticker) { setDrag(null); return; }
    saveSettings({
      brandStickers: stickers.map((s) =>
        s.id === drag.id ? { ...s, x: drag.x, y: drag.y } : s
      ),
    });
    setDrag(null);
    resume();
  }, [drag, stickers, activeStickers, resume]);

  const startRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const onPointerMoveFinal = useCallback(
    (e: PointerEvent) => {
      if (!drag || !startRef.current) return;
      const sticker = activeStickers.find((s) => s.id === drag.id);
      if (!sticker) return;
      const dx = e.clientX - startRef.current.clientX;
      const dy = e.clientY - startRef.current.clientY;
      setDrag({ id: drag.id, x: sticker.x + dx, y: sticker.y + dy });
    },
    [drag, activeStickers]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => onPointerMoveFinal(e);
    const onUp = () => onPointerUp();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onPointerMoveFinal, onPointerUp]);

  if (!s.brandLogo || !s.brandLogoSticker) return null;

  const tint = effective === "dark" ? "brightness(1.1) contrast(1.1)" : "brightness(0.85) contrast(1.05)";
  const frameStyle =
    frame === "circle"
      ? { borderRadius: "50%", overflow: "hidden" }
      : frame === "rounded"
        ? { borderRadius: 18, overflow: "hidden" }
        : { borderRadius: 12 };

  const stickerEls = activeStickers.map((st) => {
    const isSelected = st.id === selectedId;
    const isDragging = drag && drag.id === st.id;
    const pos = isDragging ? { x: drag.x, y: drag.y } : { x: st.x, y: st.y };
    const size = st.size;
    return (
      <div
        key={st.id}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: size,
          height: size,
          zIndex: 46,
          cursor: editMode ? "grab" : "default",
          touchAction: editMode ? "none" : "auto",
          pointerEvents: editMode ? "auto" : "none",
          filter: tint,
          opacity: st.opacity / 100,
          transition: editMode || isDragging ? "none" : "opacity 0.2s ease",
        }}
        onPointerDown={(e) => onStickerPointerDown(e, st.id)}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: effective === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)",
            ...frameStyle,
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow:
              effective === "dark"
                ? "0 0 24px rgba(0,0,0,0.55)"
                : "0 0 18px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {isSelected && (
            <div
              style={{
                position: "absolute",
                top: -10,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                borderRadius: 6,
                padding: "2px 6px",
                fontSize: 10,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              #{activeStickers.indexOf(st) + 1}
            </div>
          )}
          <img
            src={s.brandLogo}
            alt="Brand logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              opacity: 0.92,
            }}
            draggable={false}
          />
        </div>
      </div>
    );
  });

  const editBar = (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="fixed top-0 left-0 right-0 z-50 p-4 flex flex-col md:flex-row items-center justify-between gap-3 bg-black/85 backdrop-blur-md border-b noko-border"
    >
      <div className="flex items-center gap-3">
        <span className="noko-fg text-sm font-semibold">{t("brandStickerEdit")}</span>
        <motion.button
          onClick={disableEditMode}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          className="noko-accent rounded-full px-4 py-2 text-xs font-semibold"
        >
          {t("brandStickerDone")}
        </motion.button>
      </div>
      {mode === "individual" && selectedSticker && (
        <div className="flex items-center gap-4 min-w-[220px]">
          <label className="noko-fg text-xs whitespace-nowrap">{t("brandStickerSelect")}</label>
          <select
            value={selectedId ?? ""}
            onChange={(e) => saveSettings({ brandSelectedStickerId: e.target.value })}
            className="noko-input bg-white/10 border noko-border text-xs rounded px-2 py-1.5 text-[10px]"
          >
            {activeStickers.map((st) => (
              <option key={st.id} value={st.id}>
                #{activeStickers.indexOf(st) + 1}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-1">
            <label className="noko-fg text-xs">{t("brandStickerSize")}</label>
            <input
              type="range"
              min={MIN_SIZE}
              max={MAX_SIZE}
              step={10}
              value={selectedSticker.size}
              onChange={(e) => {
                const v = Number(e.target.value);
                saveSettings({
                  brandStickers: stickers.map((s) =>
                    s.id === selectedSticker.id ? { ...s, size: v } : s
                  ),
                });
              }}
              className="w-24 accent-[var(--noko-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="noko-fg text-xs">{t("brandStickerOpacity")}</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={selectedSticker.opacity}
              onChange={(e) => {
                const v = Number(e.target.value);
                saveSettings({
                  brandStickers: stickers.map((s) =>
                    s.id === selectedSticker.id ? { ...s, opacity: v } : s
                  ),
                });
              }}
              className="w-24 accent-[var(--noko-accent)]"
            />
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <>
      {editMode && editBar}
      {stickerEls}
    </>
  );
}
