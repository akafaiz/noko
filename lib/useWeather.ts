"use client";

import { useEffect, useState } from "react";
import { useAppSettings } from "./settings";
import type { Lang } from "./i18n";

export type WeatherState = {
  temp: number | null;
  humidity: number | null;
  code: number | null;
  isDay: boolean;
  place: string;
  loading: boolean;
  error: boolean;
};

const ID_LABELS: Record<string, string> = {
  clear: "Cerah",
  mainlyClear: "Cerah Berawan",
  partlyCloudy: "Berawan",
  overcast: "Mendung",
  fog: "Berkabut",
  drizzle: "Gerimis",
  rain: "Hujan",
  snow: "Salju",
  thunder: "Badai Petir",
};

const EN_LABELS: Record<string, string> = {
  clear: "Clear",
  mainlyClear: "Mainly clear",
  partlyCloudy: "Partly cloudy",
  overcast: "Overcast",
  fog: "Foggy",
  drizzle: "Drizzle",
  rain: "Rain",
  snow: "Snow",
  thunder: "Thunderstorm",
};

function codeKey(code: number): string {
  if (code === 0) return "clear";
  if (code === 1) return "mainlyClear";
  if (code === 2) return "partlyCloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "partlyCloudy";
}

export function describeWeather(code: number, isDay: boolean, lang: Lang = "id") {
  const key = codeKey(code);
  const label = (lang === "en" ? EN_LABELS : ID_LABELS)[key];
  return { label, isDay };
}

export function useWeather(): WeatherState {
  const { latitude, longitude, city } = useAppSettings();
  const [state, setState] = useState<WeatherState>({
    temp: null,
    humidity: null,
    code: null,
    isDay: true,
    place: city,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setState((s) => ({ ...s, loading: true, error: false, place: city }));
    });

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        if (cancelled) return;
        setState({
          temp: Math.round(data.current.temperature_2m),
          humidity: Math.round(data.current.relative_humidity_2m),
          code: data.current.weather_code,
          isDay: data.current.is_day === 1,
          place: city,
          loading: false,
          error: false,
        });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: true }));
      }
    };

    void fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, city]);

  return state;
}