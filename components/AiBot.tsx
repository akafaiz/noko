"use client";

import { useT } from "@/lib/i18n";

export type Mood = "idle" | "hub" | "kasir" | "study" | "settings";

const LOOK: Record<Mood, { x: number; y: number; scale: number; glow: string }> = {
  idle: { x: 0, y: 0, scale: 1, glow: "rgba(66,133,244,0.55)" },
  hub: { x: 0, y: -8, scale: 1.1, glow: "rgba(66,133,244,0.75)" },
  kasir: { x: 10, y: 0, scale: 1.02, glow: "rgba(52,168,83,0.75)" },
  study: { x: 0, y: 8, scale: 0.9, glow: "rgba(251,188,4,0.75)" },
  settings: { x: -10, y: 0, scale: 1.02, glow: "rgba(154,163,178,0.8)" },
};

function Eye({ glow }: { glow: string }) {
  return (
    <div
      className="ai-eye"
      style={{
        width: 60,
        height: 120,
        borderRadius: 9999,
        background:
          "radial-gradient(120% 120% at 50% 18%, #eaf2ff 0%, #4285f4 46%, #16357f 100%)",
        boxShadow: `0 0 28px ${glow}, 0 0 64px ${glow}, inset 0 0 18px rgba(255,255,255,0.7)`,
      }}
    />
  );
}

function SpeechBubble({ text, lang }: { text: string; lang: string }) {
  return (
    <div
      className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-max max-w-[180px] md:max-w-[220px] rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-xl animate-pulse whitespace-nowrap overflow-hidden text-ellipsis hidden md:block"
      style={{
        background: "linear-gradient(135deg, var(--noko-accent) 0%, color-mix(in srgb, var(--noko-accent) 70%, black) 100%)",
        color: "var(--noko-accent-fg)",
      }}
    >
      {text}
      <div
        className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[8px] border-l-[12px] border-transparent"
        style={{ borderLeftColor: "var(--noko-accent)" }}
      />
    </div>
  );
}

function SpeechBubbleMobile({ text, lang }: { text: string; lang: string }) {
  return (
    <div
      className="mb-4 w-max max-w-[180px] rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-xl animate-pulse whitespace-nowrap overflow-hidden text-ellipsis md:hidden"
      style={{
        background: "linear-gradient(135deg, var(--noko-accent) 0%, color-mix(in srgb, var(--noko-accent) 70%, black) 100%)",
        color: "var(--noko-accent-fg)",
      }}
    >
      {text}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-0 h-0 border-x-[8px] border-t-[12px] border-transparent"
        style={{ borderTopColor: "var(--noko-accent)" }}
      />
    </div>
  );
}

export default function AiBot({ mood = "idle" }: { mood?: Mood }) {
  const look = LOOK[mood];
  const { t, lang } = useT();
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="pointer-events-none absolute h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
      <div className="flex flex-col items-center md:flex-row md:items-center md:justify-center gap-4 relative">
        <SpeechBubbleMobile text={lang === "en" ? "Hi! I'm Nobo" : "Hi! Aku Nobo"} lang={lang} />
        <SpeechBubble text={lang === "en" ? "Hi! I'm Nobo" : "Hi! Aku Nobo"} lang={lang} />
        <div
          className="relative transition-transform duration-500 ease-out"
          style={{
            transform: `translate(${look.x}px, ${look.y}px) scale(${look.scale})`,
          }}
        >
          <div className="ai-glancer flex items-center gap-7">
            <Eye glow={look.glow} />
            <Eye glow={look.glow} />
          </div>
        </div>
      </div>
      <p className="relative mt-7 text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
        Noko Assistant
      </p>
    </div>
  );
}