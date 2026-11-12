"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { motion } from "motion/react";
import { LogoMark } from "./icons";
import { CINE_QUERY } from "./config";
import { useIntroReady } from "./introReady";
import { NAV_EVENT, type NavAnchor } from "./ScrollExperience";

import { DOCS_URL } from "./config";
export { DOCS_URL };

/** In the pinned experience, anchors are points on the scroll timeline rather than elements. */
export function navigateTo(anchor: NavAnchor, e: MouseEvent<HTMLAnchorElement>) {
  if (window.matchMedia(CINE_QUERY).matches) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: anchor }));
  }
}

/** `intro`: hold the entrance until the landing page's loading screen lifts. */
export default function Navbar({ intro = false }: { intro?: boolean }) {
  // Zentry-style floating nav: hidden while scrolling down, back (as a glass pill) on scroll up.
  const [floating, setFloating] = useState(false);
  const [hidden, setHidden] = useState(false);
  const introReady = useIntroReady();
  const ready = !intro || introReady;

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < 6) return; // ignore jitter; React also bails out on unchanged state
      setFloating(y > 24);
      setHidden(y > 120 && delta > 0);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={!ready ? { opacity: 0, y: -12 } : { opacity: hidden ? 0 : 1, y: hidden ? -110 : 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        aria-hidden
        className={`glass glass-edge pointer-events-none absolute inset-x-3 top-3 bottom-0 rounded-2xl transition-opacity duration-500 sm:inset-x-6 ${
          floating ? "opacity-100" : "opacity-0"
        }`}
        style={{ "--edge": "linear-gradient(100deg, rgba(255,174,0,0.35), rgba(255,255,255,0.06) 40%, rgba(0,229,160,0.35))" } as CSSProperties}
      />
      <nav className={`relative mx-auto flex max-w-[1720px] items-center justify-between px-4 transition-[height,padding] duration-500 sm:px-8 lg:px-[4.2vw] ${floating ? "mt-3 h-[clamp(56px,7vh,72px)] lg:px-[calc(4.2vw+12px)]" : "h-[clamp(64px,8.5vh,96px)]"}`}>
        <a href="/#top" className="flex items-center gap-[0.55em] text-[clamp(20px,1.95vw,34px)] font-bold tracking-[-0.02em] text-white" aria-label="EdgeCase home">
          <LogoMark className="h-[1.25em] w-[1.25em]" />
          EdgeCase
        </a>
        <a
          href={DOCS_URL}
          className="text-[clamp(15px,1.35vw,23px)] tracking-[-0.01em] text-white/85 transition-colors hover:text-white"
        >
          Docs
        </a>
      </nav>
    </motion.header>
  );
}
