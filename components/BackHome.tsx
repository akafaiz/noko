import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Kembali ke Beranda
    </Link>
  );
}