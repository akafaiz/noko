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
      <div className="mb-4 flex items-center gap-2">
        <Globe className="noko-muted h-4 w-4" />
        <h2 className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
          Quick Search / Pencarian Web
        </h2>
      </div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Ketik pencarian..."
          className="noko-input flex-1 px-4 py-2.5 text-sm"
        />
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          className="noko-input w-auto shrink-0 px-3 py-2.5 text-sm"
        >
          {ENGINES.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="noko-accent flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Search className="h-4 w-4" />
          Cari
        </button>
      </div>
    </div>
  );
}
