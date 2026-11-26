"use client";

import { useState } from "react";
import { Search, Globe } from "lucide-react";
import { useT } from "@/lib/i18n";

const ENGINES = [
  { key: "google", label: "Google", url: "https://www.google.com/search?q=" },
  { key: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  { key: "youtube", label: "YouTube", url: "https://www.youtube.com/results?search_query=" },
];

export default function QuickSearch() {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState("google");

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    const eng = ENGINES.find((e) => e.key === engine) || ENGINES[0];
    window.open(eng.url + encodeURIComponent(q), "_blank");
  };

  return (
    <div className="noko-card p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="noko-muted h-4 w-4" />
          <h2 className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
            Quick Search / Pencarian Web
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {ENGINES.map((e) => (
            <button
              key={e.key}
              onClick={() => setEngine(e.key)}
              className={`w-auto shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                engine === e.key
                  ? "bg-white text-black"
                  : "noko-chip"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full flex items-center gap-2 mt-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Ketik kata kunci pencarian..."
          className="flex-1 min-w-0 w-full px-4 py-3 rounded-full bg-zinc-900 border border-zinc-800 text-white"
        />
        <button
          onClick={handleSearch}
          className="w-auto shrink-0 px-6 py-3 rounded-full bg-white text-black font-medium"
        >
          Cari
        </button>
      </div>
    </div>
  );
}
