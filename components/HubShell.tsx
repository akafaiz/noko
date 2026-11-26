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
import CustomizableGrid, { LayoutItem } from "@/components/CustomizableGrid";
import { useLayoutEdit } from "@/lib/layoutEdit";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function HubShell() {
  const router = useRouter();
  const { user, isDemo, demoLogin, signOut } = useAuth();
  const { t } = useT();
  const { editMode } = useLayoutEdit();

  const name =
    (user && (user as { name?: string }).name) ||
    (user?.email ? user.email.split("@")[0] : t("notLoggedIn"));

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const items: LayoutItem[] = [
    { id: "assistant-chat", title: "Noko AI", defaultSpan: "half", element: <AssistantChat /> },
    { id: "quick-search", title: "Quick Search", defaultSpan: "half", element: <QuickSearch /> },
    { id: "weather", title: "Weather", defaultSpan: "half", element: <WeatherWidget /> },
    { id: "music", title: "Music", defaultSpan: "half", element: <MusicPlayer /> },
    { id: "account", title: "Account", defaultSpan: "full", element: (
      <div className="noko-card p-6">
        <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">{t("account")}</p>
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
              <button
                onClick={demoLogin}
                className="noko-accent flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              >
                <Zap className="h-4 w-4" />
                {t("demoLogin")}
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="noko-chip flex items-center gap-2 px-4 py-2 text-xs"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        </div>
      </div>
    ) },
    { id: "planner", title: "Planner", defaultSpan: "full", element: <Planner /> },
    { id: "prayer", title: "Prayer Times", defaultSpan: "half", element: <PrayerTimes /> },
    { id: "reminders", title: "Reminders", defaultSpan: "half", element: <SpiritualReminders /> },
    { id: "alarms", title: "Alarms", defaultSpan: "full", element: <AlarmPanel /> },
  ];

  return (
    <div className="min-h-[100dvh] overflow-x-hidden overflow-y-auto md:overflow-hidden p-4 md:p-0 max-w-full">
      <CustomizableGrid items={items} storageKey="noko_layout_assistant" editMode={editMode} />
    </div>
  );
}
