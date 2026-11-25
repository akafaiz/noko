"use client";

import type { RingtoneKey } from "./assistantData";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  peak: number
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function playOnce(c: AudioContext, kind: RingtoneKey) {
  const t = c.currentTime + 0.02;
  if (kind === "chime") {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(c, f, t + i * 0.18, 0.9, "sine", 0.25));
  } else if (kind === "beep") {
    [0, 0.25, 0.5].forEach((d) => tone(c, 880, t + d, 0.12, "square", 0.16));
  } else if (kind === "bell") {
    tone(c, 440, t, 2.2, "sine", 0.3);
    tone(c, 660, t, 1.6, "sine", 0.12);
    tone(c, 880, t, 1.0, "sine", 0.06);
  } else {
    [0, 0.18, 0.36].forEach((d) => tone(c, 1200, t + d, 0.07, "sawtooth", 0.14));
  }
}

export function startRingtone(kind: RingtoneKey): () => void {
  const c = getCtx();
  if (!c) return () => {};
  let stopped = false;
  const tick = () => {
    if (!stopped) playOnce(c, kind);
  };
  tick();
  const id = window.setInterval(tick, kind === "bell" ? 3200 : 2000);
  return () => {
    stopped = true;
    window.clearInterval(id);
  };
}

export function previewRingtone(kind: RingtoneKey) {
  const stop = startRingtone(kind);
  window.setTimeout(stop, 2600);
}

export function primeAudio() {
  getCtx();
}