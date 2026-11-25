"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useAppSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";

type Msg = { role: "user" | "bot"; text: string };

export default function AssistantChat() {
  const { t, lang } = useT();
  const settings = useAppSettings();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: t("chatInitial") }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);

    const now = new Date();
    const context = {
      time: now.toLocaleTimeString(lang === "en" ? "en-GB" : "id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      date: now.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      day: now.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { weekday: "long" }),
      timezone: settings.timezone,
      city: settings.city,
      latitude: settings.latitude,
      longitude: settings.longitude,
      lang,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        { role: "bot", text: data?.reply ?? t("chatError") },
      ]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: t("chatError") }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="noko-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="noko-muted h-4 w-4" />
        <h2 className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
          {t("nokoAi")}
        </h2>
        <span className="noko-faint ml-auto text-[10px] uppercase tracking-wider">
          {settings.city}
        </span>
      </div>

      <div ref={scrollRef} className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "noko-accent"
                  : "noko-card-hover noko-border noko-fg border"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="noko-card-hover noko-border noko-muted rounded-2xl border px-4 py-2.5 text-sm">
              {t("chatTyping")}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("chatPlaceholder")}
          className="noko-input flex-1 px-4 py-2.5 text-sm"
        />
        <button
          onClick={send}
          disabled={busy}
          className="noko-accent flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-50"
          aria-label={t("send")}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}