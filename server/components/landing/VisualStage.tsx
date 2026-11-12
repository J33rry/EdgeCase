"use client";

import { forwardRef, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import AITutor3D from "./AITutor3D";
import AmbientBackground from "./AmbientBackground";
import Dashboard3D from "./Dashboard3D";
import TiltCard from "./TiltCard";
import { useIntroReady } from "./introReady";
import { CONNECTORS, FEATURES, NAV_EVENT, POSES, WORLD_H, WORLD_W, type Pose, type StageState } from "./config";

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
  const ready = useIntroReady();
  const enter = (delay: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 60 },
          animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 },
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

        {/* Leader lines from each feature's copy to the part of the object it describes. */}
        <svg className="pointer-events-none absolute inset-0 z-[5] overflow-visible" width={WORLD_W} height={WORLD_H} aria-hidden>
          {CONNECTORS.map((c) => {
            const midX = (c.from[0] + c.to[0]) / 2;
            return (
              <g key={c.id} data-connector={c.id} className="ec-connector" style={{ color: c.color }}>
                <path
                  d={`M${c.from[0]} ${c.from[1]} C ${midX} ${c.from[1]}, ${midX} ${c.to[1]}, ${c.to[0]} ${c.to[1]}`}
                  pathLength={1}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="ec-connector-line"
                />
                <circle cx={c.from[0]} cy={c.from[1]} r={3} fill="currentColor" className="ec-connector-start" />
                <circle cx={c.to[0]} cy={c.to[1]} r={5} fill="currentColor" className="ec-connector-end" />
                <circle cx={c.to[0]} cy={c.to[1]} r={5} fill="none" stroke="currentColor" className="ec-connector-pulse" />
              </g>
            );
          })}
        </svg>

        {/* Tour progress rail: shows where you are and jumps to any feature. */}
        <nav className="ec-rail glass glass-edge absolute bottom-[30px] left-1/2 z-20 flex items-center gap-1 rounded-full p-1.5" aria-label="Product tour sections">
          {FEATURES.map((f, i) => (
            <span key={f.id} className="flex items-center gap-1">
              {i > 0 && f.object !== FEATURES[i - 1].object && <span className="mx-1.5 h-5 w-px bg-white/12" aria-hidden />}
              <button
                type="button"
                data-step={f.id}
                data-obj={f.object}
                onClick={() => window.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: f.id }))}
                className="ec-rail-item flex h-[38px] items-center gap-2 rounded-full px-4 text-[14px] font-medium text-white/45"
              >
                <span className="ec-rail-index font-mono text-[11.5px] tabular-nums text-white/30">{f.index}</span>
                {f.short}
              </button>
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
});

export default VisualStage;
