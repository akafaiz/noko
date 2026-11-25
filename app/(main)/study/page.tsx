import { Suspense } from "react";
import StudyShell from "@/components/StudyShell";

export default function StudyPage() {
  return (
    <Suspense fallback={null}>
      <StudyShell />
    </Suspense>
  );
}
