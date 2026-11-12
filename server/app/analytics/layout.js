import { Inter, JetBrains_Mono } from "next/font/google";
import "./analytics.css";

const sans = Inter({ subsets: ["latin"], variable: "--a-font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--a-font-mono", display: "swap" });

export default function AnalyticsLayout({ children }) {
  return <div className={`${sans.variable} ${mono.variable} a-root`}>{children}</div>;
}
