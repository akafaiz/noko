"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlarmClock, Plus, Trash2, Volume2, BellRing } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAppSettings } from "@/lib/settings";
import { nowMinutesInTz } from "@/lib/usePrayerTimes";
import {
  useAlarms,
  setAlarms,
  uid,
  todayKey,
  pad2,
  type Alarm,
  type RingtoneKey,
} from "@/lib/assistantData";
import { startRingtone, previewRingtone, primeAudio } from "@/lib/ringtones";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const RINGTONES: { key: RingtoneKey; label: string; en: string }[] = [
  { key: "chime", label: "Gentle Chime", en: "Gentle Chime" },
  { key: "beep", label: "Digital Beep", en: "Digital Beep" },
  { key: "bell", label: "Zen Bell", en: "Zen Bell" },
  { key: "radar", label: "Radar Pulse", en: "Radar Pulse" },
];

type Ctx = { openAdd: () => void };
const AlarmCtx = createContext<Ctx>({ openAdd: () => {} });

export function useAlarmUI() {
  return useContext(AlarmCtx);
}

export function AlarmProvider({ children }: { children: ReactNode }) {
  const alarms = useAlarms();
  const { timezone } = useAppSettings();
  const [adding, setAdding] = useState(false);
  const [ringing, setRinging] = useState<Alarm | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const snoozeRef = useRef<number | null>(null);
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    const h = () => primeAudio();
    window.addEventListener("pointerdown", h, { once: true });
    return () => window.removeEventListener("pointerdown", h);
  }, []);

  useEffect(
    () => () => {
      stopRef.current?.();
      if (snoozeRef.current) window.clearTimeout(snoozeRef.current);
    },
    []
  );

  const ring = (a: Alarm) => {
    stopRef.current?.();
    setRinging(a);
    stopRef.current = startRingtone(a.ringtone);
  };

  const dismiss = () => {
    stopRef.current?.();
    stopRef.current = null;
    setRinging(null);
    if (snoozeRef.current) {
      window.clearTimeout(snoozeRef.current);
      snoozeRef.current = null;
    }
  };

  const snooze = () => {
    const a = ringing;
    stopRef.current?.();
    stopRef.current = null;
    setRinging(null);
    if (!a) return;
    if (snoozeRef.current) window.clearTimeout(snoozeRef.current);
    snoozeRef.current = window.setTimeout(() => ring(a), 5 * 60 * 1000);
  };

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const mins = nowMinutesInTz(timezone, now);
      const hhmm = `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
      for (const a of alarms) {
        if (!a.enabled || a.time !== hhmm) continue;
        const key = `${todayKey()}-${a.id}-${a.time}`;
        if (fired.current.has(key)) continue;
        fired.current.add(key);
        ring(a);
        break;
      }
    };
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  });

  return (
    <AlarmCtx.Provider value={{ openAdd: () => setAdding(true) }}>
      {children}
      <AnimatePresence>
        {adding && <AddAlarmModal onClose={() => setAdding(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {ringing && (
          <RingingModal alarm={ringing} onSnooze={snooze} onDismiss={dismiss} />
        )}
      </AnimatePresence>
    </AlarmCtx.Provider>
  );
}

function AddAlarmModal({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const alarms = useAlarms();
  const [time, setTime] = useState("07:00");
  const [label, setLabel] = useState("");
  const [ringtone, setRingtone] = useState<RingtoneKey>("chime");

  const add = () => {
    setAlarms([
      ...alarms,
      { id: uid(), time, label: label.trim() || t("alarm"), enabled: true, ringtone },
    ]);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="noko-card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="noko-fg flex items-center gap-2 text-sm font-semibold">
          <AlarmClock className="h-4 w-4" />
          {t("addAlarm")}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="noko-faint mb-1 block text-xs">{t("alarmTime")}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="noko-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="noko-faint mb-1 block text-xs">{t("alarmLabel")}</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("alarmLabelPlaceholder")}
              className="noko-input px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="noko-faint mb-2 block text-xs">{t("ringtone")}</label>
          <div className="grid grid-cols-2 gap-2">
            {RINGTONES.map((r) => (
              <div key={r.key} className="flex items-center gap-1">
                <button
                  onClick={() => setRingtone(r.key)}
                  className={`noko-chip flex-1 px-2 py-1.5 text-xs ${
                    ringtone === r.key ? "noko-chip-active" : ""
                  }`}
                >
                  {r.label}
                </button>
                <button
                  onClick={() => previewRingtone(r.key)}
                  className="noko-chip flex h-7 w-7 items-center justify-center rounded-full"
                  aria-label={t("preview")}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <motion.button
            onClick={add}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className="noko-accent flex-1 rounded-full py-2.5 text-sm font-semibold"
          >
            {t("addAlarm")}
          </motion.button>
          <button onClick={onClose} className="noko-chip rounded-full px-4 py-2.5 text-sm">
            {t("cancel")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RingingModal({
  alarm,
  onSnooze,
  onDismiss,
}: {
  alarm: Alarm;
  onSnooze: () => void;
  onDismiss: () => void;
}) {
  const { t } = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-6 backdrop-blur"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="noko-card w-full max-w-sm p-8 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="noko-accent mx-auto flex h-16 w-16 items-center justify-center rounded-full"
        >
          <BellRing className="h-8 w-8" />
        </motion.div>
        <p className="noko-fg mt-4 text-3xl font-bold tabular-nums">{alarm.time}</p>
        <p className="noko-muted mt-1 text-sm">{alarm.label}</p>
        <div className="mt-6 flex gap-2">
          <motion.button
            onClick={onSnooze}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="noko-chip flex-1 rounded-full py-2.5 text-sm"
          >
            {t("snooze")}
          </motion.button>
          <motion.button
            onClick={onDismiss}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="noko-accent flex-1 rounded-full py-2.5 text-sm font-semibold"
          >
            {t("dismiss")}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AlarmPanel() {
  const { t } = useT();
  const alarms = useAlarms();
  const { openAdd } = useAlarmUI();

  const toggle = (id: string) => {
    setAlarms(alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };
  const remove = (id: string) => setAlarms(alarms.filter((a) => a.id !== id));

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="noko-card p-6"
    >
      <div className="flex items-center justify-between">
        <p className="noko-faint flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em]">
          <AlarmClock className="h-4 w-4" />
          {t("alarms")}
        </p>
        <motion.button
          onClick={openAdd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="noko-chip flex items-center gap-1 px-3 py-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addAlarm")}
        </motion.button>
      </div>

      <div className="mt-3 space-y-1">
        {alarms.length === 0 && <p className="noko-faint text-xs">{t("noAlarms")}</p>}
        {alarms.map((a) => (
          <div
            key={a.id}
            className="noko-card-hover noko-border flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <button
              onClick={() => toggle(a.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                a.enabled ? "noko-accent noko-accent-border" : "noko-border noko-faint"
              }`}
              aria-label={t("toggleTask")}
            >
              {a.enabled ? "✓" : ""}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`noko-fg text-sm ${a.enabled ? "" : "opacity-50"}`}>{a.label}</p>
              <p className="noko-faint text-[10px] uppercase tracking-wider">
                {RINGTONES.find((r) => r.key === a.ringtone)?.label ?? a.ringtone}
              </p>
            </div>
            <span className="noko-muted text-sm tabular-nums">{a.time}</span>
            <button
              onClick={() => previewRingtone(a.ringtone)}
              className="noko-faint hover:opacity-70"
              aria-label={t("preview")}
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => remove(a.id)}
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