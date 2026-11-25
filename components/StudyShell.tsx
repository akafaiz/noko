"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CalendarPlus,
  Upload,
  AlignLeft,
  ListChecks,
  Lightbulb,
  Search,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { addAgendaItem, todayKey } from "@/lib/assistantData";

type Action = "ringkas" | "kuis" | "brainstorm" | "sumber";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ACTIONS: { key: Action; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "ringkas", icon: AlignLeft },
  { key: "kuis", icon: ListChecks },
  { key: "brainstorm", icon: Lightbulb },
  { key: "sumber", icon: Search },
];

function splitSentences(t: string) {
  return t
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function process(action: Action, material: string, topic: string) {
  const text = material.trim();
  const sents = splitSentences(text);
  const base = topic.trim() || sents[0] || "materi";

  if (action === "ringkas") {
    const top = sents.slice(0, 4);
    return top.length ? top.map((s, i) => `${i + 1}. ${s}`) : [text.slice(0, 240)];
  }

  if (action === "kuis") {
    const lines = sents.slice(0, 3).map((s, i) => {
      const words = s.split(/\s+/);
      const idx = Math.min(words.length - 1, Math.floor(words.length / 2));
      const answer = words[idx];
      words[idx] = "____";
      return `${i + 1}. ${words.join(" ")}\n   (jawaban: ${answer})`;
    });
    return lines.length ? lines : [text.slice(0, 240)];
  }

  if (action === "brainstorm") {
    return [
      `Apa 3 konsep kunci dari "${base}"?`,
      `Bagaimana menerapkan "${base}" dalam kehidupan sehari-hari?`,
      `Buat analogi sederhana untuk menjelaskan "${base}".`,
      `Sumber/alat apa yang bisa memperdalam "${base}"?`,
    ];
  }

  const queries = [base, `${base} penjelasan`, `${base} latihan soal`, `${base} pdf`];
  return queries.map((q) => `${q} → https://www.google.com/search?q=${encodeURIComponent(q)}`);
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function StudyShell() {
  const { t, lang } = useT();
  const [material, setMaterial] = useState("");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<{ title: string; lines: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMaterial(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const run = async (a: Action) => {
    if (a !== "sumber" && !material.trim()) {
      setResult({ title: t("resultNoko"), lines: [t("materialFirst")] });
      return;
    }
    if (a === "sumber") {
      setResult({ title: t("resultNoko"), lines: process(a, material, topic) });
      return;
    }
    const langName = lang === "en" ? "English" : "Indonesia";
    const prompts: Record<string, string> = {
      ringkas: `Ringkas materi berikut menjadi poin-poin singkat berbahasa ${langName}:\n\n${material}`,
      kuis: `Buat 3 soal kuis beserta kunci jawaban dari materi berikut, berbahasa ${langName}:\n\n${material}`,
      brainstorm: `Lakukan brainstorm 4 ide/poin seputar topik "${
        topic.trim() || material.slice(0, 60)
      }", berbahasa ${langName}.`,
    };
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompts[a] }),
      });
      const data = await res.json();
      const lines = String(data?.reply ?? t("aiUnavailable"))
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      setResult({ title: `${t("resultNoko")} · ${t(a)}`, lines });
    } catch {
      setResult({ title: t("resultNoko"), lines: [t("chatError")] });
    } finally {
      setBusy(false);
    }
  };

  const gcalHref = () => {
    const start = new Date();
    const end = new Date(start.getTime() + minutes * 60000);
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: topic.trim() || t("studySession"),
      dates: `${stamp(start)}/${stamp(end)}`,
      details: t("studyDetails"),
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const mm = pad(Math.floor(seconds / 60));
  const ss = pad(seconds % 60);

  return (
    <div className="grid gap-4 lg:grid-cols-2 min-h-[100dvh] overflow-y-auto md:overflow-hidden p-4 md:p-0">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="noko-card p-6"
      >
        <p className="noko-fg text-lg font-semibold leading-snug">{t("studyTitle")}</p>

        <div className="mt-4">
          <label className="noko-faint mb-1 block text-xs">{t("topic")}</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("topicPlaceholder")}
            className="noko-input px-4 py-2.5 text-sm"
          />
        </div>

        <div className="mt-3">
          <label className="noko-faint mb-1 block text-xs">{t("material")}</label>
          <textarea
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            rows={6}
            placeholder={t("materialPlaceholder")}
            className="noko-input resize-none px-4 py-3 text-sm"
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={onFile}
            className="hidden"
          />
          <motion.button
            onClick={() => fileRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="noko-chip flex items-center gap-2 px-4 py-2 text-xs"
          >
            <Upload className="h-4 w-4" />
            {t("uploadTxt")}
          </motion.button>
        </div>

        <div className="mt-5">
          <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
            {t("processAi")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.key}
                  onClick={() => run(a.key)}
                  disabled={busy}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  className="noko-chip flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                >
                  <Icon className="h-4 w-4" />
                  {t(a.key)}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
        className="flex flex-col gap-4"
      >
        <section className="noko-accent rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-60">
              {result?.title ?? t("resultNoko")}
            </p>
          </div>
          <AnimatePresence mode="wait">
            {busy ? (
              <motion.p
                key="busy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm opacity-60"
              >
                {t("thinking")}
              </motion.p>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mt-3 space-y-1.5 text-sm leading-relaxed"
              >
                {result.lines.map((l, i) => (
                  <p key={i} className="whitespace-pre-line break-words">
                    {l}
                  </p>
                ))}
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm opacity-60"
              >
                {t("resultEmpty")}
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        <section className="noko-card p-6">
          <div className="flex items-center justify-between">
            <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
              {t("timer")}
            </p>
            <motion.a
              href={gcalHref()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                addAgendaItem(
                  todayKey(),
                  `${topic.trim() || t("study")} · ${minutes} ${t("minutes")}`
                )
              }
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="noko-chip flex items-center gap-1 px-3 py-1.5 text-xs"
            >
              <CalendarPlus className="h-4 w-4" />
              {t("addToCalendar")}
            </motion.a>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="noko-fg text-6xl font-extralight tabular-nums leading-none tracking-tight">
              {mm}:{ss}
            </p>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => {
                  if (seconds === 0) setSeconds(minutes * 60);
                  setRunning((r) => !r);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="noko-accent flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? t("pause") : t("start")}
              </motion.button>
              <motion.button
                onClick={() => {
                  setSeconds(minutes * 60);
                  setRunning(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="noko-chip flex h-10 w-10 items-center justify-center rounded-full"
                aria-label={t("reset")}
              >
                <RotateCcw className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {[25, 5, 15].map((m) => (
              <motion.button
                key={m}
                onClick={() => {
                  setMinutes(m);
                  setSeconds(m * 60);
                  setRunning(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className={`noko-chip px-3 py-1.5 text-xs ${
                  minutes === m ? "noko-chip-active" : ""
                }`}
              >
                {m} {t("minutes")}
              </motion.button>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
