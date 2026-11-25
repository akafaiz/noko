import type { ReactNode } from "react";
import ModeShell from "@/components/ModeShell";

export const instant = false;

export default function MainLayout({ children }: { children: ReactNode }) {
  return <ModeShell>{children}</ModeShell>;
}