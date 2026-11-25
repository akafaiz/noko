"use client";

import {
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  MapPin,
  Droplets,
  Thermometer,
  Loader2,
} from "lucide-react";
import { useWeather, describeWeather } from "@/lib/useWeather";
import { useT } from "@/lib/i18n";

export function iconFor(code: number, isDay: boolean) {
  if (code === 0) return { Icon: isDay ? Sun : Moon };
  if (code === 1 || code === 2) return { Icon: CloudSun };
  if (code === 3) return { Icon: Cloud };
  if (code === 45 || code === 48) return { Icon: CloudFog };
  if (code >= 51 && code <= 57) return { Icon: CloudDrizzle };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { Icon: CloudRain };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { Icon: CloudSnow };
  if (code >= 95) return { Icon: CloudLightning };
  return { Icon: Cloud };
}

export default function WeatherWidget() {
  const { temp, humidity, code, isDay, place, loading, error } = useWeather();
  const { t, lang } = useT();
  const info = code != null ? describeWeather(code, isDay, lang) : null;
  const icon = code != null ? iconFor(code, isDay) : { Icon: Cloud };

  return (
    <div className="noko-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="noko-muted h-4 w-4" />
        <h2 className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
          {t("weatherRealtime")}
        </h2>
      </div>

      {loading && (
        <div className="noko-muted flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("weatherLoading")}
        </div>
      )}

      {!loading && error && <p className="noko-muted text-sm">{t("weatherError")}</p>}

      {!loading && !error && temp != null && info && (
        <div className="flex items-center gap-4">
          <icon.Icon className="noko-fg h-12 w-12" />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <p className="noko-fg text-4xl font-bold tracking-tight">{temp}°C</p>
              <span className="noko-muted text-sm">{info.label}</span>
            </div>
            <p className="noko-faint mt-1 flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              {place}
            </p>
            <div className="noko-muted mt-3 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5" />
                {t("humidity")} {humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5" />
                {t("temperature")} {temp}°C
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}