"use client";

import { forwardRef, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import AITutor3D from "./AITutor3D";
import AmbientBackground from "./AmbientBackground";
import Dashboard3D from "./Dashboard3D";
import TiltCard from "./TiltCard";
import { FEATURES, POSES, WORLD_H, WORLD_W, type Pose, type StageState } from "./config";

/** CSS transform equivalent to the GSAP pose, so the first paint (before JS) is already correct. */
export const poseTransform = (p: Pose) =>
  `perspective(1800px) translate(-50%, -50%) translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${p.rotationY}deg) rotateX(${p.rotationX}deg) scale(${p.scale})`;

export interface StageRefs {
  dash: RefObject<HTMLDivElement | null>;
  tutor: RefObject<HTMLDivElement | null>;
}

/**
 * The persistent visual stage: ambient lighting plus a fixed-size "world"
 * (WORLD_W × WORLD_H) scaled to fit the viewport with pure CSS. Both glass
 * objects live here exactly once; the scroll timeline only moves them.
 */
const VisualStage = forwardRef<
  HTMLDivElement,
  { refs: StageRefs; initialState?: StageState; children?: ReactNode }
>(function VisualStage({ refs, initialState = "hero", children }, ref) {
  const still = !!useReducedMotion();
  const enter = (delay: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 60 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1.3, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div ref={ref} className="ec-scope relative h-screen w-full overflow-hidden" data-state={initialState}>
      <AmbientBackground />

      <div
        data-world
        className="absolute left-1/2 top-1/2"
        style={{
          width: WORLD_W,
          height: WORLD_H,
          // Fit the world to the viewport without JS: tan(atan2(a, b)) === a / b as a unitless number.
          ["--s" as string]: `min(tan(atan2(100vw, ${WORLD_W}px)), tan(atan2(100vh, ${WORLD_H}px)))`,
          transform: "translate(-50%, -50%) scale(var(--s, 0.9))",
        }}
      >
        {/* Tutor first so the dashboard paints above it in the hero; GSAP swaps zIndex later. */}
        <div ref={refs.tutor} data-obj="tutor" className="absolute left-0 top-0 z-[2]" style={{ transform: poseTransform(POSES.hero.tutor) }}>
          <motion.div {...enter(0.35)}>
            <TiltCard radius={26} max={6}>
              <AITutor3D />
            </TiltCard>
          </motion.div>
        </div>
        <div ref={refs.dash} data-obj="dash" className="absolute left-0 top-0 z-[3]" style={{ transform: poseTransform(POSES.hero.dash) }}>
          <motion.div {...enter(0.2)}>
            <TiltCard radius={22} max={9}>
              <Dashboard3D />
            </TiltCard>
          </motion.div>
        </div>

        {children}

        {/* Feature progress indicator, driven purely by data-state CSS. */}
        <ol className="ec-steps absolute bottom-[42px] left-1/2 flex -translate-x-1/2 items-center gap-2" aria-hidden>
          {FEATURES.map((f) => (
            <li key={f.id} data-step={f.id} data-obj={f.object} className="h-[3px] w-5 rounded-full bg-white/15" />
          ))}
        </ol>
      </div>
    </div>
  );
});

export default VisualStage;
