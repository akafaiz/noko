"use client";

import { Music, Play, Pause, SkipForward, SkipBack, Upload, ListMusic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAppSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";

type Embed = { src: string; kind: "youtube" | "other" };

function toEmbed(raw: string): Embed | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname;

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

type LocalTrack = { name: string; url: string };

export default function MusicPlayer() {
  const { playlistUrl } = useAppSettings();
  const { t } = useT();
  const [tab, setTab] = useState<"youtube" | "local">("youtube");
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const embed = toEmbed(playlistUrl || "https://www.youtube.com/watch?v=jfKfPfyJRdk");
  const src = embed?.src || "https://www.youtube.com/embed/lTRiuFIWV54";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setDuration(audio.duration);
      }
    };
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", () => {
      if (tracks.length > 0 && currentIndex < tracks.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setPlaying(false);
      }
    });
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, [tracks, currentIndex]);

  useEffect(() => {
    if (audioRef.current && tracks.length > 0) {
      audioRef.current.src = tracks[currentIndex]?.url || "";
      if (playing) audioRef.current.play().catch(() => {});
    }
  }, [currentIndex, tracks]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newTracks: LocalTrack[] = [];
    for (let i = 0; i < files.length; i++) {
      newTracks.push({ name: files[i].name, url: URL.createObjectURL(files[i]) });
    }
    setTracks((prev) => [...prev, ...newTracks]);
    if (tracks.length === 0 && newTracks.length > 0) {
      setCurrentIndex(0);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    setCurrentIndex((i) => (i + 1) % tracks.length);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !duration) return;
    const val = Number(e.target.value);
    audioRef.current.currentTime = (val / 100) * duration;
    setProgress(val);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="noko-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Music className="noko-muted h-4 w-4" />
        <h2 className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
          {t("music")}
        </h2>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("youtube")}
          className={`noko-chip px-3 py-1.5 text-xs ${tab === "youtube" ? "noko-chip-active" : ""}`}
        >
          YouTube
        </button>
        <button
          onClick={() => setTab("local")}
          className={`noko-chip px-3 py-1.5 text-xs ${tab === "local" ? "noko-chip-active" : ""}`}
        >
          Lagu Lokal
        </button>
      </div>

      {tab === "youtube" && (
        <>
          <iframe
            key={src}
            src={src}
            title="Noko Music Player"
            width="100%"
            height={200}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="noko-border rounded-xl border"
          />
          <p className="noko-faint mt-3 text-xs">{t("musicHint")}</p>
        </>
      )}

      {tab === "local" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="noko-chip flex items-center gap-2 px-4 py-2 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Pilih File Audio
          </button>

          {tracks.length > 0 && (
            <>
              <div className="noko-card p-3">
                <p className="noko-fg text-sm font-medium truncate">
                  {tracks[currentIndex]?.name || "—"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={prevTrack} className="noko-chip flex h-8 w-8 items-center justify-center rounded-full">
                    <SkipBack className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={togglePlay} className="noko-accent flex h-8 w-8 items-center justify-center rounded-full">
                    {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={nextTrack} className="noko-chip flex h-8 w-8 items-center justify-center rounded-full">
                    <SkipForward className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={progress}
                      onChange={seek}
                      className="w-full accent-[var(--noko-accent)]"
                    />
                  </div>
                  <span className="noko-faint text-xs tabular-nums">
                    {formatTime(duration * (progress / 100))} / {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {tracks.map((track, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentIndex(i); setPlaying(true); }}
                    className={`noko-card-hover noko-border flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs ${
                      i === currentIndex ? "noko-chip-active" : ""
                    }`}
                  >
                    <ListMusic className="h-3 w-3 shrink-0" />
                    <span className="truncate">{track.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <audio ref={audioRef} />
        </div>
      )}
    </div>
  );
}
