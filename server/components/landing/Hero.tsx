"use client";

import { motion, useReducedMotion } from "motion/react";
import { PuzzleIcon } from "./icons";

export const STORE_URL = "https://github.com/J33rry/EdgeCase#2-load-the-extension";

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
      <div className="pointer-events-none absolute left-[66px] top-[250px] w-[560px]">
        <motion.h1 {...rise(0.1, still)} className="text-[94px] font-bold leading-[0.94] tracking-[-0.05em] text-white">
          Ship better
          <br />
          code.
        </motion.h1>
        <motion.p {...rise(0.25, still)} className="mt-6 text-[31px] tracking-[-0.015em] text-white/50">
          Your edge in every edge case.
        </motion.p>
        <motion.div {...rise(0.4, still)} className="pointer-events-auto mt-11 w-fit">
          <AddToBrowser className="h-[86px] w-[386px] rounded-[18px] text-[33px] tracking-[-0.02em]" iconSize={36} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-10 text-center sm:text-left">
      <motion.h1
        {...rise(0.1, still)}
        className="text-[clamp(3rem,13vw,5.75rem)] font-bold leading-[0.94] tracking-[-0.05em] text-white"
      >
        Ship better
        <br />
        code.
      </motion.h1>
      <motion.p {...rise(0.25, still)} className="mt-4 text-[clamp(1.15rem,4.6vw,1.75rem)] tracking-[-0.015em] text-white/50">
        Your edge in every edge case.
      </motion.p>
      <motion.div {...rise(0.4, still)} className="mt-8">
        <AddToBrowser className="h-14 rounded-2xl px-7 text-lg sm:h-16 sm:text-xl" iconSize={22} />
      </motion.div>
    </div>
  );
}
