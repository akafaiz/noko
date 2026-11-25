import { NextResponse } from "next/server";

type Ctx = {
  time?: string;
  date?: string;
  day?: string;
  timezone?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  lang?: string;
};

function fallback(text: string, lang: "id" | "en"): string {
  const t = text.toLowerCase();
  const id = lang === "id";
  if (t.includes("cuaca") || t.includes("suhu") || t.includes("weather") || t.includes("temperature"))
    return id
      ? "Buka Asisten untuk melihat cuaca real-time kota aktifmu, atau atur kota di Pengaturan."
      : "Open Assistant to see real-time weather for your active city, or set the city in Settings.";
  if (t.includes("kasir") || t.includes("bayar") || t.includes("qris") || t.includes("laba") || t.includes("cashier"))
    return id
      ? "Buka Kasir untuk melihat total belanja, margin laba otomatis, membuat QRIS, dan export CSV."
      : "Open Cashier to see totals, automatic profit margin, create QRIS, and export CSV.";
  if (t.includes("belajar") || t.includes("fokus") || t.includes("kuis") || t.includes("ringkas") || t.includes("study"))
    return id
      ? "Di Ruang Belajar kamu bisa menempel materi lalu memilih Ringkas, Buat kuis, atau Brainstorm yang diproses AI, plus timer fokus."
      : "In the Study Room you can paste material then choose Summarize, Make quiz, or Brainstorm powered by AI, plus a focus timer.";
  if (t.includes("jam") || t.includes("waktu") || t.includes("time"))
    return id
      ? "Jam digital di beranda mengikuti zona waktu kota aktifmu. Atur kota di Pengaturan."
      : "The home digital clock follows your active city's timezone. Set the city in Settings.";
  if (t.includes("halo") || t.includes("hai") || t.includes("hello") || t.includes("hi"))
    return id
      ? "Halo! Aku Noko AI. Tanyakan soal waktu, cuaca, kasir, atau belajar."
      : "Hi! I'm Noko AI. Ask about time, weather, cashier, or study.";
  if (!text.trim())
    return id
      ? "Aku siap membantu. Coba tanyakan sesuatu tentang Noko Home."
      : "I'm ready to help. Try asking something about Noko Home.";
  return id
    ? "Aku Noko AI. Coba tanyakan tentang waktu, cuaca, kasir, atau belajar."
    : "I'm Noko AI. Try asking about time, weather, cashier, or study.";
}

async function weatherSummary(lat?: number, lon?: number): Promise<string> {
  if (typeof lat !== "number" || typeof lon !== "number") return "";
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=auto`;
    const r = await fetch(url, { next: { revalidate: 0 } });
    if (!r.ok) return "";
    const d = await r.json();
    const c = d?.current;
    if (!c) return "";
    return `Cuaca terkini di lokasi pengguna: suhu ${Math.round(c.temperature_2m)}°C, kelembapan ${Math.round(
      c.relative_humidity_2m
    )}%, kode cuaca ${c.weather_code}, ${c.is_day === 1 ? "siang" : "malam"}.`;
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  let message = "";
  let context: Ctx = {};
  try {
    const body = await req.json();
    message = String(body?.message ?? "").slice(0, 4000);
    context = (body?.context ?? {}) as Ctx;
  } catch {
    message = "";
  }

  const lang: "id" | "en" = context.lang === "en" ? "en" : "id";
  const now = new Date();
  const time =
    context.time ||
    now.toLocaleTimeString(lang === "en" ? "en-GB" : "id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  const date =
    context.date ||
    now.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const day = context.day || date;
  const tz = context.timezone || "Asia/Jakarta";
  const city = context.city || "lokasi pengguna";

  const wantsWeather = /cuaca|suhu|weather|temperature|hujan|rain/i.test(message);
  const wx = wantsWeather ? await weatherSummary(context.latitude, context.longitude) : "";

  const system = [
    `Kamu adalah Noko AI, asisten rumah pintar, kasir, dan belajar. Jawab ringkas, ramah, dan akurat.`,
    `Waktu saat ini: ${time}.`,
    `Tanggal: ${date}.`,
    `Hari: ${day}.`,
    `Zona waktu pengguna: ${tz}.`,
    `Kota pengguna: ${city}.`,
    wx ? wx : "",
    `Jawab dalam bahasa ${lang === "en" ? "Inggris" : "Indonesia"}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const key = process.env.OPENROUTER_API_KEY;
  if (key) {
    const models = [
      process.env.OPENROUTER_MODEL,
      "openrouter/free",
      "google/gemini-2.0-flash-exp:free",
    ].filter(Boolean) as string[];

    let lastError = "";
    for (const model of models) {
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Noko Home",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: message },
            ],
          }),
        });
        if (r.ok) {
          const data = await r.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ reply, source: "openrouter", model });
          }
          lastError = `HTTP ${r.status}`;
        } else {
          lastError = `HTTP ${r.status}`;
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "network error";
      }
    }
    return NextResponse.json({
      reply: fallback(message, lang),
      source: "fallback",
      error: lastError || "AI unavailable",
    });
  }

  return NextResponse.json({
    reply: fallback(message, lang),
    source: "fallback",
    error: "OPENROUTER_API_KEY missing",
  });
}