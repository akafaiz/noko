"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useAppSettings } from "@/lib/settings";
import { useEffectiveContrast } from "@/lib/useContrast";
import { useT } from "@/lib/i18n";
import NokoEyes from "./NokoEyes";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

const MODES = [
  { label: "home", sub: "assistant", href: "/hub" },
  { label: "cashier", sub: "cashier", href: "/kasir" },
  { label: "study", sub: "study", href: "/study" },
];

const TITLES: Record<string, string> = {
  "/hub": "assistant",
  "/kasir": "cashier",
  "/study": "study",
  "/settings": "settings",
};

export default function ModeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useT();
  const settings = useAppSettings();
  const effective = useEffectiveContrast(settings);
  const eyeColor = effective === "dark" ? "#ffffff" : "#111111";

  const title = t(TITLES[pathname] ?? "appName");

  return (
    <div className="noko-app flex h-screen w-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
            <Link
              href="/"
              className="noko-chip flex shrink-0 items-center gap-2 px-3 py-1.5 text-xs backdrop-blur"
            >
              <NokoEyes
                shape={settings.eyeShape}
                color={eyeColor}
                width={6}
                height={10}
                gap={4}
                glow={false}
              />
              {t("home")}
            </Link>
          </motion.div>
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="noko-fg h-5 w-5 shrink-0" />
            <p className="noko-fg truncate text-sm font-semibold tracking-[0.2em]">
              NOKO <span className="noko-faint">/</span> {title} {t("mode")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
            <Link href="/settings" className="noko-chip px-3 py-1.5 text-xs backdrop-blur">
              {t("settings")}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
            <Link
              href="/"
              aria-label={t("backHome")}
              className="noko-chip flex h-9 w-9 items-center justify-center"
            >
              <X className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </header>

      <div className="shrink-0 px-6">
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => {
            const active = pathname === m.href;
            return (
              <motion.div
                key={m.href}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="relative"
              >
                <Link
                  href={m.href}
                  className={`noko-card relative block p-4 transition-colors ${
                    active ? "noko-accent-border" : "hover:border-white/30"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="activeModePill"
                      className="absolute inset-0 rounded-2xl"
                      style={{ backgroundColor: "var(--noko-accent)" }}
                      transition={SPRING}
                    />
                  )}
                  <div className="relative">
                    <p
                      className={`text-[10px] uppercase tracking-[0.25em] ${
                        active ? "" : "noko-faint"
                      }`}
                      style={active ? { color: "var(--noko-accent-fg)", opacity: 0.6 } : undefined}
                    >
                      {t(m.label)}
                    </p>
                    <p
                      className={`mt-1 text-lg font-semibold ${active ? "" : "noko-fg"}`}
                      style={active ? { color: "var(--noko-accent-fg)" } : undefined}
                    >
                      {t(m.sub)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, scale: 0.985, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: -18 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="min-h-0 flex-1 overflow-auto px-6 py-6"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}