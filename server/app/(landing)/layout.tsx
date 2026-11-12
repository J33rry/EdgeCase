import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./landing.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "EdgeCase — Ship better code",
  description:
    "EdgeCase is a browser extension for programmers: coding analytics, edge-case detection, leaderboards and an AI tutor that teaches instead of solving.",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${mono.variable} ec-root`}>{children}</div>;
}
