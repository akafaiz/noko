"use client";

import { Music } from "lucide-react";
import { useAppSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";

type Embed = { src: string; kind: "spotify" | "youtube" | "other" };

function toEmbed(raw: string): Embed | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname;

    if (host.includes("spotify.com")) {
      const path = u.pathname.replace(/^\/embed/, "");
      return { src: `https://open.spotify.com/embed${path}`, kind: "spotify" };
    }

    if (host === "youtu.be" || host.endsWith("youtu.be")) {
      const id = u.pathname.slice(1);
      return { src: `https://www.youtube.com/embed/${id}`, kind: "youtube" };
    }

    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      const list = u.searchParams.get("list");
      if (v) return { src: `https://www.youtube.com/embed/${v}`, kind: "youtube" };
      if (list)
        return {
          src: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}`,
          kind: "youtube",
        };
      if (u.pathname.startsWith("/embed/"))
        return { src: `https://www.youtube.com${u.pathname}${u.search}`, kind: "youtube" };
    }

    if (u.pathname.includes("/embed")) return { src: raw, kind: "other" };
  } catch {
    /* fall through */
  }
  return null;
}

export default function MusicPlayer() {
  const { playlistUrl } = useAppSettings();
  const { t } = useT();
  const embed = toEmbed(playlistUrl);
  const height = embed?.kind === "spotify" ? 152 : 200;

  return (
    <div className="noko-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Music className="noko-muted h-4 w-4" />
        <h2 className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
          {t("music")}
        </h2>
      </div>

      {embed ? (
        <iframe
          key={embed.src}
          src={embed.src}
          title="Noko Music Player"
          width="100%"
          height={height}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="noko-border rounded-xl border"
        />
      ) : (
        <p className="noko-muted text-sm">{t("musicEmpty")}</p>
      )}

      <p className="noko-faint mt-3 text-xs">{t("musicHint")}</p>
    </div>
  );
}