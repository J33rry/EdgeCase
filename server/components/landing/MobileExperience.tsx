"use client";

import { useState } from "react";
import { motion } from "motion/react";
import AITutor3D from "./AITutor3D";
import AmbientBackground from "./AmbientBackground";
import Dashboard3D from "./Dashboard3D";
import FeatureContent from "./FeatureContent";
import Hero from "./Hero";
import ScaledFrame from "./ScaledFrame";
import TiltCard from "./TiltCard";
import { DASH_SIZE, FEATURES, TUTOR_SIZE, type Feature, type StageState } from "./config";

const ANCHOR_IDS: Partial<Record<StageState, string>> = {
  stats: "features",
  leaderboard: "leaderboard",
  explain: "how-it-works",
};

/** Hero composite: both objects overlapping, as in the reference design. */
export function Composite({ className = "", state = "hero" }: { className?: string; state?: StageState }) {
  const W = 960;
  const H = 600;
  return (
    <ScaledFrame w={W} h={H} className={className}>
      <div className="ec-scope relative h-full w-full" data-state={state}>
        <div className="absolute right-0 top-0">
          <AITutor3D showBaseplate={false} />
        </div>
        <div className="absolute left-0 top-[96px]">
          <Dashboard3D />
        </div>
      </div>
    </ScaledFrame>
  );
}

function FeatureBlock({ feature, flip }: { feature: Feature; flip: boolean }) {
  // Becomes the feature's highlight state once in view, so the transition is seen.
  const [state, setState] = useState<StageState>("hero");
  const isDash = feature.object === "dashboard";

  return (
    <motion.section
      id={ANCHOR_IDS[feature.id]}
      onViewportEnter={() => setState(feature.id)}
      viewport={{ amount: 0.45, once: false }}
      className="relative mx-auto grid max-w-6xl scroll-mt-20 items-center gap-10 px-4 py-16 sm:px-8 md:grid-cols-2 md:gap-12 md:py-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={flip ? "md:order-2" : ""}
      >
        <FeatureContent feature={feature} variant="flow" />
      </motion.div>
      <div className={`ec-scope relative ${flip ? "md:order-1" : ""}`} data-state={state}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-10%] -z-10"
          style={{
            background: isDash
              ? "radial-gradient(closest-side, rgba(255,174,0,0.16), transparent)"
              : "radial-gradient(closest-side, rgba(0,229,160,0.16), transparent)",
          }}
        />
        {isDash ? (
          <ScaledFrame w={DASH_SIZE.w + 40} h={DASH_SIZE.h + 40} maxScale={1.05} className="mx-auto max-w-[400px]">
            <div className="p-5">
              <TiltCard radius={22} max={9}>
                <Dashboard3D />
              </TiltCard>
            </div>
          </ScaledFrame>
        ) : (
          <ScaledFrame w={TUTOR_SIZE.w + 40} h={TUTOR_SIZE.h + 40}>
            <div className="p-5">
              <TiltCard radius={26} max={6}>
                <AITutor3D showBaseplate={false} />
              </TiltCard>
            </div>
          </ScaledFrame>
        )}
      </div>
    </motion.section>
  );
}

/** Stacked layout for phones, portrait tablets and reduced-motion users. */
export default function MobileExperience() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-8 sm:pt-36">
        <AmbientBackground className="[mask-image:linear-gradient(#000_65%,transparent)]" />
        <div className="relative mx-auto max-w-6xl">
          <Hero variant="flow" />
          <Composite className="mx-auto mt-14 max-w-[880px]" />
        </div>
      </section>
      {FEATURES.map((f, i) => (
        <FeatureBlock key={f.id} feature={f} flip={i % 2 === 1} />
      ))}
    </div>
  );
}
