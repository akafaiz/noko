"use client";

import { useCallback, useContext, useEffect, useRef, createContext } from "react";
import Lenis from "lenis";

interface SmoothScrollContextValue {
  pause: () => void;
  resume: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  pause: () => {},
  resume: () => {},
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

const LENIS_OPTIONS = {
  lerp: 0.1,
  duration: 1.2,
  smoothWheel: true,
  smoothTouch: false,
  touchMultiplier: 1,
} as const;

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  const pause = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const resume = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lenisRef.current = new Lenis(LENIS_OPTIONS);

    function raf(time: number) {
      lenisRef.current?.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={{ pause, resume }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
