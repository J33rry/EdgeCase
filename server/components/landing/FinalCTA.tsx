"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import AnimatedTitle from "./AnimatedTitle";
import { AddToBrowser, GithubButton } from "./Hero";
import { Composite } from "./MobileExperience";

/** Glass code chips drifting around the headline: the kind of thing the tutor tells you. */
const FRAGMENTS = [
  { l: "7%", t: "20%", r: -8, d: 10, c: "orange", text: "nums = [ ]" },
  { l: "78%", t: "14%", r: 6, d: 12, c: "green", text: "O(n²) → O(n)" },
  { l: "12%", t: "72%", r: 5, d: 9, c: "green", text: "[3, 3] ✓" },
  { l: "76%", t: "70%", r: -5, d: 11, c: "orange", text: "no pair → undefined" },
  { l: "44%", t: "6%", r: 3, d: 8, c: "green", text: "hint 1 / 3" },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.5 },
};

export default function FinalCTA() {
  return (
    <>
      <section className="relative isolate overflow-hidden px-4 py-32 sm:px-8 md:py-44" aria-labelledby="cta-heading">
        {/* Ambient light */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            // Fade in from the section above instead of starting at a hard edge.
            maskImage: "linear-gradient(to bottom, transparent, #000 35%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 35%)",
            background:
              "radial-gradient(45% 55% at 18% 85%, rgba(255,150,0,0.16), transparent 70%), radial-gradient(45% 55% at 85% 20%, rgba(0,229,160,0.14), transparent 70%)",
          }}
        />
        {/* Both objects together, small and quiet, behind the copy */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 opacity-[0.3] blur-[1px] [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent)]">
          <Composite className="mx-auto w-[min(680px,110vw)]" />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(40%_45%_at_50%_50%,rgba(8,10,9,0.85),transparent)]" />

        {FRAGMENTS.map((f, i) => (
          <span
            key={i}
            aria-hidden
            className={`fragment glass glass-edge absolute hidden whitespace-nowrap rounded-[10px] px-3 py-1.5 font-mono text-[13px] lg:block ${
              f.c === "orange" ? "text-ec-orange" : "text-ec-green"
            }`}
            style={
              {
                left: f.l,
                top: f.t,
                "--r": `${f.r}deg`,
                "--d": `${f.d}s`,
                "--delay": `${-i * 1.7}s`,
                "--edge":
                  f.c === "orange"
                    ? "linear-gradient(140deg, rgba(255,174,0,0.8), rgba(255,174,0,0.05))"
                    : "linear-gradient(140deg, rgba(0,229,160,0.8), rgba(0,229,160,0.05))",
                boxShadow: f.c === "orange" ? "0 0 24px rgba(255,174,0,0.18)" : "0 0 24px rgba(0,229,160,0.18)",
              } as CSSProperties
            }
          >
            {f.text}
          </span>
        ))}

        <div className="relative mx-auto max-w-4xl text-center">
          <AnimatedTitle
            id="cta-heading"
            lines={["Ready to ship", "better code?"]}
            className="font-display text-[clamp(2.75rem,8vw,6.25rem)] font-bold leading-[0.96] tracking-[-0.045em] text-white"
          />
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-xl text-[clamp(1.05rem,2.2vw,1.4rem)] leading-[1.5] text-white/70"
          >
            Get ahead of every edge case. Start improving the way you code.
          </motion.p>
          <motion.div {...fadeUp} transition={{ duration: 0.9, delay: 0.24, ease: [0.22, 1, 0.36, 1] }} className="mt-11 flex flex-wrap items-center justify-center gap-3">
            <AddToBrowser className="h-16 rounded-2xl px-9 text-xl md:h-[72px] md:text-2xl" iconSize={26} />
            <GithubButton className="h-16 rounded-2xl px-7 text-lg md:h-[72px] md:text-xl" iconSize={22} />
          </motion.div>
        </div>
      </section>

    </>
  );
}
