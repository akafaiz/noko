"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const pad = (n: number) => String(n).padStart(2, "0");

export default function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    queueMicrotask(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? `${pad(now.getHours())}:${pad(now.getMinutes())}`
    : "--:--";
  const seconds = now ? pad(now.getSeconds()) : "--";
  const date = now
    ? `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`
    : "Memuat…";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-primary">
        <Clock className="h-4 w-4" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Waktu
        </h2>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-5xl font-bold tabular-nums leading-none tracking-tight">
          {time}
        </p>
        <span className="text-lg font-semibold tabular-nums text-muted-foreground">
          {seconds}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{date}</p>
    </div>
  );
}