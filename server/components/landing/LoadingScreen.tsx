"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { isIntroReady, markIntroReady } from "./introReady";

const STATUS = ["Parsing constraints", "Hunting edge cases", "Ranking your friends", "Warming up the tutor"];

/** Shortest time the loader stays up, so it never just flickers. */
const MIN_MS = 1500;
/** Give up waiting for slow assets after this long. */
const MAX_MS = 6000;
/** Final sprint to 100% once everything is ready. */
const FINISH_MS = 380;
/** Length of the exit (curtain lift) animation, in sync with landing.css. */
const EXIT_MS = 1000;

type Phase = "loading" | "exit" | "done";

/**
 * Full-screen intro shown on the first hard load of the landing page. It is
 * server-rendered, so it covers the page from the very first paint, and it
 * lifts once fonts and the window `load` event are in (or after MAX_MS).
 * Client-side navigations back to the page skip it.
 */
export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>(() => (isIntroReady() ? "done" : "loading"));
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(0);

  useEffect(() => {
    if (phase !== "loading") return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let ready = false;
    let shown = 0;
    let finishFrom = -1;
    let finishStart = 0;
    let raf = 0;
    let alive = true;

    const loaded = new Promise<void>((res) =>
      document.readyState === "complete" ? res() : window.addEventListener("load", () => res(), { once: true }),
    );
    Promise.all([loaded, document.fonts?.ready ?? Promise.resolve()]).then(() => (ready = true));

    // Keep the page underneath from scrolling while the loader is up.
    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) e.preventDefault();
    };
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys);

    const statusTimer = window.setInterval(() => setStatus((s) => (s + 1) % STATUS.length), 520);

    // Progress is a pure function of elapsed time, so ticking it from both rAF
    // (smooth) and a timer (keeps going when rAF is paused, e.g. a background
    // tab) is safe.
    const tick = () => {
      if (!alive) return;
      const now = performance.now();
      const t = now - start;
      const minMs = still ? 350 : MIN_MS;
      const canFinish = (ready && t >= minMs) || t >= MAX_MS;

      if (!canFinish) {
        // Ease towards 90% while we wait; real readiness takes it the rest of the way.
        shown = 90 * (1 - Math.exp(-t / 900));
        setProgress(shown);
      } else {
        if (finishFrom < 0) {
          finishFrom = shown;
          finishStart = now;
        }
        const k = Math.min(1, (now - finishStart) / FINISH_MS);
        const eased = 1 - Math.pow(1 - k, 3);
        setProgress(finishFrom + (100 - finishFrom) * eased);
        if (k >= 1) {
          alive = false;
          setPhase("exit");
          markIntroReady();
        }
      }
    };
    const frame = () => {
      tick();
      if (alive) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const fallback = window.setInterval(tick, 100);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearInterval(fallback);
      clearInterval(statusTimer);
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "exit") return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setPhase("done"), still ? 250 : EXIT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  const pct = Math.round(progress);

  return (
    <div
      className="ec-loader"
      data-phase={phase}
      role="progressbar"
      aria-label="Loading EdgeCase"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      style={{ "--p": progress } as CSSProperties}
    >
      <div aria-hidden className="ec-loader-bg">
        <div className="ec-loader-wash ec-loader-wash-o" />
        <div className="ec-loader-wash ec-loader-wash-g" />
        <div className="ec-grid absolute inset-0 opacity-60" />
      </div>

      <div className="ec-loader-core">
        <div className="ec-loader-tile glass glass-edge glass-sheen">
          <span aria-hidden className="ec-loader-halo" />
          <div className="ec-loader-mark" aria-hidden>
            {/* Faint track of the full logo… */}
            <svg viewBox="0 0 40 40" className="ec-loader-track-mark">
              <g stroke="#fff">
                <path d="M20 3.5 34.3 11.75v16.5L20 36.5 5.7 28.25v-16.5L20 3.5Z" fill="none" strokeWidth="6" strokeLinejoin="round" strokeDasharray="78 12" strokeDashoffset="-34" />
                <path d="M12.5 20h15" strokeWidth="5.5" strokeLinecap="round" />
              </g>
            </svg>
            {/* …and the lit logo, revealed clockwise by progress (CSS conic mask). */}
            <svg viewBox="0 0 40 40" className="ec-loader-lit">
              <defs>
                <linearGradient id="ec-loader-grad" gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="36" y2="36">
                  <stop offset="0" stopColor="#FFC533" />
                  <stop offset="1" stopColor="#FF9500" />
                </linearGradient>
              </defs>
              <g stroke="url(#ec-loader-grad)">
                <path d="M20 3.5 34.3 11.75v16.5L20 36.5 5.7 28.25v-16.5L20 3.5Z" fill="none" strokeWidth="6" strokeLinejoin="round" strokeDasharray="78 12" strokeDashoffset="-34" />
                <path d="M12.5 20h15" strokeWidth="5.5" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>

        <div className="ec-loader-word font-display">EdgeCase</div>

        <div className="ec-loader-meter">
          <div className="ec-loader-track">
            <div className="ec-loader-fill" />
          </div>
          <div className="ec-loader-meta font-mono">
            <span key={status} className="ec-loader-status">
              {STATUS[status]}
              <span className="ec-loader-caret" />
            </span>
            <span className="ec-loader-pct">{String(pct).padStart(3, "0")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
