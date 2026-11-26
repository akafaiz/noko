import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import ThemeApplier from "../components/ThemeApplier";
import SmoothScroll from "../components/SmoothScroll";
import { AlarmProvider } from "../components/Alarms";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "noko - Smart Living",
  description:
    "Noko - smart display dengan Asisten AI, cuaca real-time, kasir QRIS, dan study mode bergaya Google Nest.",
};

import { LayoutEditProvider } from "../lib/layoutEdit";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-[100dvh] antialiased">
        <ThemeApplier />
        <AuthProvider>
          <AlarmProvider>
            <LayoutEditProvider>
              <SmoothScroll>{children}</SmoothScroll>
            </LayoutEditProvider>
          </AlarmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}