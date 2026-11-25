"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Plus, Trash2, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAppSettings } from "@/lib/settings";
import { nowMinutesInTz } from "@/lib/usePrayerTimes";
import { useReminders, setReminders, uid, todayKey, pad2 } from "@/lib/assistantData";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function SpiritualReminders() {
  const { t } = useT();
  const { timezone } = useAppSettings();
  const reminders = useReminders();
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("05:00");
  const [notify, setNotify] = useState(true);
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const mins = nowMinutesInTz(timezone, now);
      const hhmm = `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
      for (const r of reminders) {
        if (!r.enabled || !r.notify || r.time !== hhmm) continue;
        const key = `${todayKey()}-${r.id}-${r.time}`;
        if (fired.current.has(key)) continue;
        fired.current.add(key);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(r.label, { body: r.time });
          } catch {
            /* ignore notification errors */
          }
        }
      }
    };
    const id = setInterval(check, 20000);
    return () => clearInterval(id);
  }, [reminders, timezone]);

  const add = () => {
    const text = label.trim();
    if (!text) return;
    setReminders([...reminders, { id: uid(), label: text, time, enabled: true, notify }]);
    setLabel("");
  };

  const toggleEnabled = (id: string) => {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const toggleNotify = async (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;
    if (!target.notify && typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }
    setReminders(reminders.map((r) => (r.id === id ? { ...r, notify: !r.notify } : r)));
  };

  const remove = (id: string) => setReminders(reminders.filter((r) => r.id !== id));

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="noko-card p-6"
    >
      <p className="noko-faint flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em]">
        <Sparkles className="h-4 w-4" />
        {t("reminders")}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("reminderPlaceholder")}
          className="noko-input min-w-[8rem] flex-1 px-3 py-2 text-sm"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="noko-input w-28 px-3 py-2 text-sm"
        />
        <motion.button
          onClick={add}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="noko-accent flex h-9 w-9 items-center justify-center rounded-xl"
          aria-label={t("addReminder")}
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>

      <label className="noko-muted mt-2 flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="accent-[var(--noko-accent)]"
        />
        {t("notifyMe")}
      </label>

      <div className="mt-3 space-y-1">
        {reminders.length === 0 && <p className="noko-faint text-xs">{t("noReminders")}</p>}
        {reminders.map((r) => (
          <div
            key={r.id}
            className="noko-card-hover noko-border flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <button
              onClick={() => toggleEnabled(r.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                r.enabled ? "noko-accent noko-accent-border" : "noko-border noko-faint"
              }`}
              aria-label={t("toggleTask")}
            >
              {r.enabled ? "✓" : ""}
            </button>
            <span className={`noko-fg flex-1 text-sm ${r.enabled ? "" : "opacity-50"}`}>
              {r.label}
            </span>
            <span className="noko-muted text-xs tabular-nums">{r.time}</span>
            <button
              onClick={() => toggleNotify(r.id)}
              className={r.notify ? "noko-accent-text" : "noko-faint"}
              aria-label={t("notifyMe")}
            >
              {r.notify ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => remove(r.id)}
              className="noko-faint hover:opacity-70"
              aria-label={t("delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </motion.section>
  );
}