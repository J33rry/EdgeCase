"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Only devices with a real hover pointer get the effect; touch and reduced motion stay still. */
const TILT_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * Hover tilt with a cursor-following glare, in the spirit of Zentry's bento cards:
 * the card leans away from the pointer and eases back flat when it leaves.
 *
 * It tilts its own element only, so it composes with the scroll timeline that
 * moves the outer wrapper. Rotation is driven with gsap.quickTo (no React state).
 */
export default function TiltCard({
  children,
  max = 7,
  radius = 22,
  glare = true,
  className = "",
}: {
  children: ReactNode;
  /** Total tilt range in degrees (±max/2 at the edges). */
  max?: number;
  /** Corner radius of the glare, matching the glass surface underneath. */
  radius?: number;
  glare?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(TILT_QUERY, () => {
        gsap.set(el, { transformPerspective: 900, transformOrigin: "50% 50%" });
        const ease = { duration: 0.7, ease: "power3.out" };
        const rx = gsap.quickTo(el, "rotationX", ease);
        const ry = gsap.quickTo(el, "rotationY", ease);
        const lift = gsap.quickTo(el, "z", ease);
        const g = glareRef.current;

        const move = (e: PointerEvent) => {
          // Measure the untilted parent so the tilt does not feed back into itself.
          const r = (el.parentElement ?? el).getBoundingClientRect();
          const px = gsap.utils.clamp(0, 1, (e.clientX - r.left) / r.width);
          const py = gsap.utils.clamp(0, 1, (e.clientY - r.top) / r.height);
          rx((py - 0.5) * max);
          ry((px - 0.5) * -max);
          lift(18);
          if (g) {
            g.style.setProperty("--gx", `${px * 100}%`);
            g.style.setProperty("--gy", `${py * 100}%`);
            g.style.opacity = "1";
          }
        };
        const leave = () => {
          rx(0);
          ry(0);
          lift(0);
          if (g) g.style.opacity = "0";
        };

        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
          gsap.set(el, { clearProps: "transform" });
        };
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [max] },
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}
      {glare && (
        <div
          ref={glareRef}
          aria-hidden
          className="tilt-glare pointer-events-none absolute inset-0 z-10"
          style={{ borderRadius: radius }}
        />
      )}
    </div>
  );
}
