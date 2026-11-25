import { Suspense } from "react";
import HubShell from "@/components/HubShell";

export default function HubPage() {
  return (
    <Suspense fallback={null}>
      <HubShell />
    </Suspense>
  );
}
