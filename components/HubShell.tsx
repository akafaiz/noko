"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Zap } from "lucide-react";
import WeatherWidget from "@/components/WeatherWidget";
import MusicPlayer from "@/components/MusicPlayer";
import AssistantChat from "@/components/AssistantChat";
import QuickSearch from "@/components/QuickSearch";
import Planner from "@/components/Planner";
import PrayerTimes from "@/components/PrayerTimes";
import SpiritualReminders from "@/components/SpiritualReminders";
import { AlarmPanel } from "@/components/Alarms";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/lib/i18n";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

export default function HubShell() {
  const router = useRouter();
  const { user, isDemo, demoLogin, signOut } = useAuth();
  const { t } = useT();

  const name =
    (user && (user as { name?: string }).name) ||
    (user?.email ? user.email.split("@")[0] : t("notLoggedIn"));

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 lg:grid-cols-2 min-h-[100dvh] overflow-x-hidden overflow-y-auto md:overflow-hidden p-4 md:p-0 max-w-full"
    >
      <motion.div variants={item}>
        <AssistantChat />
      </motion.div>
      <motion.div variants={item}>
        <QuickSearch />
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4">
        <WeatherWidget />
        <MusicPlayer />
      </motion.div>

      <motion.section variants={item} className="noko-card p-6 lg:col-span-2">
        <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
          {t("account")}
        </p>
        <div className="mt-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="noko-border noko-fg flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="noko-fg text-sm font-medium">{name}</p>
              <p className="noko-muted text-xs">
                {isDemo ? t("demoMode") : user?.email ?? t("notLoggedIn")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isDemo && (
              <motion.button
                onClick={demoLogin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="noko-accent flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              >
                <Zap className="h-4 w-4" />
                {t("demoLogin")}
              </motion.button>
            )}
            <motion.button
              onClick={handleSignOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="noko-chip flex items-center gap-2 px-4 py-2 text-xs"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </motion.button>
          </div>
        </div>
      </motion.section>

      <motion.div variants={item} className="lg:col-span-2">
        <Planner />
      </motion.div>

      <motion.div variants={item} className="grid gap-4 lg:col-span-2 lg:grid-cols-2">
        <PrayerTimes />
        <SpiritualReminders />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-2">
        <AlarmPanel />
      </motion.div>
    </motion.div>
  );
}
