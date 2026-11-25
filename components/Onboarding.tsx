"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useAppSettings } from "@/lib/settings";
import { useEffectiveContrast } from "@/lib/useContrast";
import NokoEyes from "./NokoEyes";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  { title: "step1Title", desc: "step1Desc" },
  { title: "step2Title", desc: "step2Desc" },
  { title: "step3Title", desc: "step3Desc" },
];

export default function Onboarding({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const s = useAppSettings();
  const effective = useEffectiveContrast(s);
  const eyeColor = effective === "dark" ? "#ffffff" : "#111111";
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const step = STEPS[i];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6 backdrop-blur"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="noko-card w-full max-w-md p-8 text-center"
      >
        <div className="flex justify-center">
          <div className="ai-breathe">
            <NokoEyes
              shape={s.eyeShape}
              color={eyeColor}
              width={64}
              height={140}
              gap={14}
              glow={effective === "dark"}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mt-6"
          >
            <p className="noko-faint text-[10px] uppercase tracking-[0.3em]">{t("welcome")}</p>
            <h2 className="noko-fg mt-2 text-xl font-semibold">{t(step.title)}</h2>
            <p className="noko-muted mt-2 text-sm leading-relaxed">{t(step.desc)}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex justify-center gap-1.5">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: idx === i ? 20 : 6,
                backgroundColor:
                  idx === i ? "var(--noko-accent)" : "var(--noko-border)",
              }}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="noko-chip flex-1 rounded-full py-2.5 text-sm"
          >
            {t("skip")}
          </motion.button>
          {i > 0 && (
            <motion.button
              onClick={() => setI(i - 1)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="noko-chip rounded-full px-4 py-2.5 text-sm"
            >
              {t("back")}
            </motion.button>
          )}
          <motion.button
            onClick={() => (last ? onClose() : setI(i + 1))}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="noko-accent flex-1 rounded-full py-2.5 text-sm font-semibold"
          >
            {last ? t("start") : t("next")}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}