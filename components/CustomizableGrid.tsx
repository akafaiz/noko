"use client";

import { useState, useEffect, ReactNode } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";

export type LayoutItem = {
  id: string;
  title: string;
  defaultSpan: "half" | "full";
  element: ReactNode;
};

type StoredItem = {
  id: string;
  span: "half" | "full";
  hidden: boolean;
};

type Props = {
  items: LayoutItem[];
  storageKey: string;
  editMode: boolean;
  onReset?: () => void;
};

export default function CustomizableGrid({ items, storageKey, editMode }: Props) {
  const [layout, setLayout] = useState<StoredItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredItem[];
        const ids = items.map((i) => i.id);
        const valid = parsed.filter((p) => ids.includes(p.id));
        const missing = ids.filter((id) => !valid.find((v) => v.id === id));
        const defaults = missing.map((id) => {
          const item = items.find((i) => i.id === id)!;
          return { id, span: item.defaultSpan, hidden: false };
        });
        setLayout([...valid, ...defaults]);
        return;
      }
    } catch {
      /* ignore */
    }
    setLayout(items.map((i) => ({ id: i.id, span: i.defaultSpan, hidden: false })));
  }, [items, storageKey]);

  const save = (next: StoredItem[]) => {
    setLayout(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...layout];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    save(next);
  };

  const moveDown = (index: number) => {
    if (index === layout.length - 1) return;
    const next = [...layout];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    save(next);
  };

  const toggleSpan = (id: string) => {
    save(layout.map((l) => (l.id === id ? { ...l, span: l.span === "half" ? "full" : "half" } : l)));
  };

  const toggleHidden = (id: string) => {
    save(layout.map((l) => (l.id === id ? { ...l, hidden: !l.hidden } : l)));
  };

  const reset = () => {
    const defaults = items.map((i) => ({ id: i.id, span: i.defaultSpan, hidden: false }));
    save(defaults);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {layout.map((l, index) => {
        const item = items.find((i) => i.id === l.id);
        if (!item || l.hidden) return null;
        return (
          <div
            key={l.id}
            className={l.span === "full" ? "md:col-span-2" : "md:col-span-1"}
          >
            {editMode && (
              <div className="mb-2 flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-xs">
                <span className="noko-faint mr-2 truncate text-[10px] uppercase tracking-wider">
                  {item.title}
                </span>
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="noko-chip flex h-6 w-6 items-center justify-center rounded-full disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === layout.length - 1}
                  className="noko-chip flex h-6 w-6 items-center justify-center rounded-full disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => toggleSpan(l.id)}
                  className="noko-chip flex items-center gap-1 px-2 py-0.5 text-[10px]"
                >
                  {l.span === "full" ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                  {l.span === "full" ? "1/2" : "Full"}
                </button>
                <button
                  onClick={() => toggleHidden(l.id)}
                  className="noko-chip flex h-6 w-6 items-center justify-center rounded-full"
                  aria-label="Hide"
                >
                  <EyeOff className="h-3 w-3" />
                </button>
              </div>
            )}
            {item.element}
          </div>
        );
      })}
      {editMode && layout.some((l) => l.hidden) && (
        <div className="md:col-span-2 flex flex-wrap gap-2">
          {layout
            .filter((l) => l.hidden)
            .map((l) => {
              const item = items.find((i) => i.id === l.id);
              if (!item) return null;
              return (
                <button
                  key={l.id}
                  onClick={() => toggleHidden(l.id)}
                  className="noko-chip flex items-center gap-1 px-3 py-1.5 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  Tampilkan {item.title}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

