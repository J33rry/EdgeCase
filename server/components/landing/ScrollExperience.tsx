"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import FeatureContent from "./FeatureContent";
import Hero from "./Hero";
import VisualStage from "./VisualStage";
import { CINE_QUERY, FEATURES, POSES, type Pose, type StageState } from "./config";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Timeline durations (abstract units; scroll distance is derived from the total). */
const T = {
  heroHold: 0.35,
  toDashboard: 1.3,
  textIn: 0.55,
  hold: 1.1,
  textOut: 0.45,
  exchange: 1.7,
  endHold: 0.7,
};
/** Viewport heights of scroll per timeline unit. */
const VH_PER_UNIT = 0.62;

const pose = (p: Pose) => ({
  x: p.x,
  y: p.y,
  z: p.z,
  scale: p.scale,
  rotationY: p.rotationY,
  rotationX: p.rotationX,
  filter: `brightness(${1 - 0.5 * p.recede}) saturate(${1 - 0.65 * p.recede})`,
});

export type NavAnchor = "features" | "leaderboard" | "how-it-works";
export const NAV_EVENT = "ec:navigate";

/**
 * Pinned, scroll-scrubbed experience: hero → dashboard showcase (3 features)
 * → cinematic object exchange → AI Tutor showcase (3 features) → release.
 */
export default function ScrollExperience() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dash = useRef<HTMLDivElement>(null);
  const tutor = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(CINE_QUERY, () => {
        const q = gsap.utils.selector(root);
        const D = dash.current!;
        const Tu = tutor.current!;
        const stageEl = stage.current!;

        gsap.set([D, Tu], { xPercent: -50, yPercent: -50, transformPerspective: 1800, force3D: true, willChange: "transform, filter" });
        gsap.set(D, { ...pose(POSES.hero.dash), zIndex: 3 });
        gsap.set(Tu, { ...pose(POSES.hero.tutor), zIndex: 2 });
        gsap.set(q("[data-ambient=green]"), { opacity: 0.75 });
        gsap.set(q("[data-feature]"), { autoAlpha: 0 });
        // Zentry-style title reveal: words start pushed back and swung open.
        gsap.set(q("[data-feature] .word"), { transformPerspective: 800, transformOrigin: "50% 50% -20px", opacity: 0, x: 10, y: 51, z: -60, rotationY: 60, rotationX: -40 });

        const tl = gsap.timeline({ defaults: { ease: "none" } });
        /** Start time of each highlight state, in timeline seconds. */
        const stateStarts: { state: StageState; at: number }[] = [{ state: "hero", at: 0 }];
        const anchorTimes: Partial<Record<NavAnchor, number>> = {};

        // ── Hero → dashboard showcase ─────────────────────────────────────
        let t = T.heroHold;
        tl.to(q("[data-hero]"), { x: -140, autoAlpha: 0, duration: T.toDashboard * 0.55, ease: "power2.in" }, t)
          .to(q("[data-scroll-cue]"), { autoAlpha: 0, duration: 0.2 }, t)
          .to(D, { ...pose(POSES.dashboard.dash), duration: T.toDashboard, ease: "power2.inOut" }, t)
          .to(Tu, { ...pose(POSES.dashboard.tutor), duration: T.toDashboard, ease: "power2.inOut" }, t)
          .to(q("[data-part=baseplate]"), { autoAlpha: 0, duration: T.toDashboard * 0.6 }, t)
          .to(q("[data-glow=dash]"), { opacity: 0.55, duration: T.toDashboard }, t)
          .to(q("[data-ambient=green]"), { opacity: 0.35, duration: T.toDashboard }, t)
          .to(q("[data-streak=green]"), { opacity: 0.3, duration: T.toDashboard }, t);
        t += T.toDashboard - 0.25;

        const showFeature = (id: StageState, isLastOfPhase: boolean) => {
          const block = q(`[data-feature=${id}]`);
          const words = q(`[data-feature=${id}] .word`);
          const side = FEATURES.find((f) => f.id === id)!.object === "dashboard" ? 1 : -1;

          stateStarts.push({ state: id, at: t });
          const anchor = FEATURES.find((f) => f.id === id)!.anchor;
          if (anchor) anchorTimes[anchor] = t + T.textIn;

          tl.fromTo(block, { autoAlpha: 0, x: 40 * side }, { autoAlpha: 1, x: 0, duration: T.textIn, ease: "power2.out" }, t)
            .to(words, { opacity: 1, x: 0, y: 0, z: 0, rotationY: 0, rotationX: 0, duration: T.textIn, stagger: 0.06, ease: "power2.out" }, t)
            .fromTo(q(`[data-feature=${id}] [data-part=desc]`), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: T.textIn, ease: "power2.out" }, t + 0.15);
          t += T.textIn + T.hold;

          // The very last feature stays on screen and scrolls away with the stage.
          if (id !== FEATURES[FEATURES.length - 1].id) {
            tl.to(block, { autoAlpha: 0, y: -50, duration: T.textOut, ease: "power2.in" }, t);
          }
          if (!isLastOfPhase) t += T.textOut;
        };

        const dashFeatures = FEATURES.filter((f) => f.object === "dashboard");
        const tutorFeatures = FEATURES.filter((f) => f.object === "tutor");
        dashFeatures.forEach((f, i) => showFeature(f.id, i === dashFeatures.length - 1));

        // ── Cinematic exchange: dashboard recedes, Tutor comes forward ────
        const ex = T.exchange;
        tl.to(D, { ...pose(POSES.tutor.dash), duration: ex, ease: "power2.inOut" }, t)
          .to(Tu, { ...pose(POSES.tutor.tutor), duration: ex, ease: "power2.inOut" }, t)
          // The Tutor arcs slightly upward as it passes in front.
          .to(Tu, { yPercent: -56, duration: ex / 2, ease: "sine.out" }, t)
          .to(Tu, { yPercent: -50, duration: ex / 2, ease: "sine.in" }, t + ex / 2)
          .set(D, { zIndex: 2 }, t + ex * 0.38)
          .set(Tu, { zIndex: 3 }, t + ex * 0.38)
          .to(q("[data-glow=dash]"), { opacity: 0, duration: ex * 0.6 }, t)
          .to(q("[data-glow=tutor]"), { opacity: 0.85, duration: ex }, t + ex * 0.2)
          .to(q("[data-ambient=orange]"), { opacity: 0.35, duration: ex }, t)
          .to(q("[data-ambient=green]"), { opacity: 1, duration: ex }, t)
          .to(q("[data-streak=green]"), { opacity: 1, duration: ex }, t)
          .to(q("[data-streak=orange]"), { opacity: 0.4, duration: ex }, t);
        t += ex - 0.35;

        tutorFeatures.forEach((f, i) => showFeature(f.id, i === tutorFeatures.length - 1));
        t += T.endHold;
        tl.to({}, { duration: Math.max(0, t - tl.duration()) }); // pad to the final hold

        // ── Highlight state: flip a data attribute only when it changes ──
        // Compared against the DOM (not a cached value) so it self-corrects after
        // ScrollTrigger.refresh(), which briefly rewinds the timeline to measure.
        const syncState = () => {
          const time = tl.time();
          let next: StageState = "hero";
          for (const s of stateStarts) if (time >= s.at - 0.05) next = s.state;
          if (stageEl.dataset.state !== next) stageEl.dataset.state = next;
        };
        tl.eventCallback("onUpdate", syncState);

        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * tl.duration() * VH_PER_UNIT)}`,
          pin: true,
          scrub: 0.9,
          animation: tl,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: syncState,
        });

        // Measure once layout and web fonts have settled (also covers reloads mid-page,
        // where scroll restoration happens before the trigger exists).
        const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
        let alive = true;
        document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
        // ── Navbar anchors scroll to a point on the timeline ─────────────
        const onNav = (e: Event) => {
          const anchor = (e as CustomEvent<NavAnchor>).detail;
          const time = anchorTimes[anchor];
          if (time == null) return;
          const y = st.start + (time / tl.duration()) * (st.end - st.start);
          window.scrollTo({ top: y, behavior: "smooth" });
        };
        window.addEventListener(NAV_EVENT, onNav);

        return () => {
          alive = false;
          cancelAnimationFrame(raf);
          window.removeEventListener(NAV_EVENT, onNav);
          stageEl.dataset.state = "hero";
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="experience" aria-label="Product tour" className="relative">
      <VisualStage ref={stage} refs={{ dash, tutor }}>
        <div data-hero className="relative z-10">
          <Hero variant="stage" />
        </div>
        {FEATURES.map((f) => (
          <FeatureContent key={f.id} feature={f} variant="stage" />
        ))}
        <div data-scroll-cue className="absolute bottom-[38px] left-[66px] flex items-center gap-3 text-[13px] uppercase tracking-[0.2em] text-white/35">
          <span className="relative h-9 w-px overflow-hidden bg-white/10">
            <span className="scroll-cue-bar absolute inset-x-0 top-0 h-1/2 bg-ec-orange" />
          </span>
          Scroll to explore
        </div>
      </VisualStage>
    </section>
  );
}
