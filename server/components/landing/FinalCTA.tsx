"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import AnimatedTitle from "./AnimatedTitle";
import { AddToBrowser } from "./Hero";
import { Composite } from "./MobileExperience";
import { DOCS_URL, navigateTo } from "./Navbar";
import { GithubIcon, Logo } from "./icons";

const REPO_URL = "https://github.com/J33rry/EdgeCase";

/** Small glass shards drifting around the headline. */
const FRAGMENTS = [
  { l: "8%", t: "18%", w: 64, h: 44, r: -14, d: 10, c: "orange" },
  { l: "86%", t: "14%", w: 52, h: 70, r: 12, d: 12, c: "green" },
  { l: "14%", t: "70%", w: 38, h: 38, r: 24, d: 9, c: "green" },
  { l: "80%", t: "66%", w: 72, h: 46, r: -8, d: 11, c: "orange" },
  { l: "50%", t: "8%", w: 28, h: 28, r: 40, d: 8, c: "orange" },
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
            background:
              "radial-gradient(45% 55% at 18% 85%, rgba(255,150,0,0.16), transparent 70%), radial-gradient(45% 55% at 85% 20%, rgba(0,229,160,0.14), transparent 70%)",
          }}
        />
        {/* Both objects together, small and quiet, behind the copy */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 opacity-[0.16] blur-[1.5px] [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent)]">
          <Composite className="mx-auto w-[min(680px,110vw)]" />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(40%_45%_at_50%_50%,rgba(8,10,9,0.85),transparent)]" />

        {FRAGMENTS.map((f, i) => (
          <span
            key={i}
            aria-hidden
            className="fragment glass glass-edge absolute hidden rounded-[12px] sm:block"
            style={
              {
                left: f.l,
                top: f.t,
                width: f.w,
                height: f.h,
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
          />
        ))}

        <div className="relative mx-auto max-w-4xl text-center">
          <AnimatedTitle
            id="cta-heading"
            lines={["Ready to ship", "better code?"]}
            className="text-[clamp(2.75rem,8vw,6.25rem)] font-bold leading-[0.96] tracking-[-0.05em] text-white"
          />
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-xl text-[clamp(1.05rem,2.2vw,1.4rem)] leading-[1.5] text-white/55"
          >
            Get ahead of every edge case. Start improving the way you code.
          </motion.p>
          <motion.div {...fadeUp} transition={{ duration: 0.9, delay: 0.24, ease: [0.22, 1, 0.36, 1] }} className="mt-11">
            <AddToBrowser className="h-16 rounded-2xl px-9 text-xl md:h-[72px] md:text-2xl" iconSize={26} />
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <Logo size={26} className="text-xl" />
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[15px] text-white/55">
              <li>
                <a href="#features" onClick={(e) => navigateTo("features", e)} className="transition-colors hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href={DOCS_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                  Documentation
                </a>
              </li>
              <li>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-white">
                  <GithubIcon size={16} /> GitHub
                </a>
              </li>
              <li>
                <a href="/privacy" className="transition-colors hover:text-white">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </nav>
          <p className="text-[13px] text-white/30">© {new Date().getFullYear()} EdgeCase</p>
        </div>
      </footer>
    </>
  );
}
