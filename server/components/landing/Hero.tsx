"use client";

import { motion, useReducedMotion } from "motion/react";
import { GithubIcon, PuzzleIcon } from "./icons";

import { REPO_URL, STORE_URL } from "./config";

/** Secondary action next to the primary CTA. */
export function GithubButton({ className = "", iconSize = 20 }: { className?: string; iconSize?: number }) {
  return (
    <motion.a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`btn-ghost gap-2.5 font-medium ${className}`}
    >
      <GithubIcon size={iconSize} />
      GitHub
    </motion.a>
  );
}

/** Factual trust line under the hero CTA. */
function TrustLine({ className = "" }: { className?: string }) {
  const items = ["Free & open source", "Built for LeetCode", "Never writes your solution"];
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-white/45 sm:gap-x-3 ${className}`}>
      {items.map((t, i) => (
        <li key={t} className="flex items-center gap-3">
          {i > 0 && <span className="hidden h-1 w-1 rounded-full bg-white/25 sm:block" aria-hidden />}
          {t}
        </li>
      ))}
    </ul>
  );
}

/** "Your edge in every edge case." with the first "edge" lit. */
function Tagline() {
  return (
    <>
      Your <span className="text-ec-orange">edge</span> in every edge case.
    </>
  );
}

export function AddToBrowser({ className = "", iconSize = 24 }: { className?: string; iconSize?: number }) {
  return (
    <motion.a
      href={STORE_URL}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`btn-primary gap-3 ${className}`}
    >
      <PuzzleIcon size={iconSize} strokeWidth={2} />
      Add to browser
    </motion.a>
  );
}

const rise = (delay: number, still: boolean) => ({
  initial: still ? false : ({ opacity: 0, y: 28, filter: "blur(6px)" } as const),
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/**
 * Hero copy. `stage` renders at fixed world-pixel sizes inside the scaled
 * cinematic stage; `flow` is the responsive version for the stacked layout.
 */
export default function Hero({ variant }: { variant: "stage" | "flow" }) {
  const still = !!useReducedMotion();

  if (variant === "stage") {
    return (
      <div className="pointer-events-none absolute left-[66px] top-[230px] w-[600px]">
        <motion.h1 {...rise(0.1, still)} className="font-display text-[100px] font-bold leading-[0.92] tracking-[-0.045em] text-white">
          Ship better
          <br />
          code.
        </motion.h1>
        <motion.p {...rise(0.25, still)} className="mt-6 text-[31px] tracking-[-0.015em] text-white/65">
          <Tagline />
        </motion.p>
        <motion.div {...rise(0.4, still)} className="pointer-events-auto mt-11 flex w-fit items-center gap-4">
          <AddToBrowser className="h-[78px] rounded-[18px] px-9 text-[28px] tracking-[-0.02em]" iconSize={32} />
          <GithubButton className="h-[78px] rounded-[18px] px-7 text-[22px]" iconSize={24} />
        </motion.div>
        <motion.div {...rise(0.55, still)}>
          <TrustLine className="mt-7 w-fit text-[15px]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-10 text-center sm:text-left">
      <motion.h1
        {...rise(0.1, still)}
        className="font-display text-[clamp(3rem,13vw,5.75rem)] font-bold leading-[0.92] tracking-[-0.045em] text-white"
      >
        Ship better
        <br />
        code.
      </motion.h1>
      <motion.p {...rise(0.25, still)} className="mt-4 text-[clamp(1.15rem,4.6vw,1.75rem)] tracking-[-0.015em] text-white/65">
        <Tagline />
      </motion.p>
      <motion.div {...rise(0.4, still)} className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
        <AddToBrowser className="h-14 rounded-2xl px-7 text-lg sm:h-16 sm:text-xl" iconSize={22} />
        <GithubButton className="h-14 rounded-2xl px-6 text-base sm:h-16 sm:text-lg" />
      </motion.div>
      <motion.div {...rise(0.55, still)}>
        <TrustLine className="mt-5 justify-center text-sm sm:justify-start" />
      </motion.div>
    </div>
  );
}
