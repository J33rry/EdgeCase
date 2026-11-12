import type { CSSProperties, ReactNode } from "react";

/**
 * Renders fixed-size content (w × h design px) scaled to the container width,
 * with pure CSS (container query units), so there is no layout shift or JS.
 */
export default function ScaledFrame({
  w,
  h,
  maxScale = 1,
  className = "",
  children,
}: {
  w: number;
  h: number;
  maxScale?: number;
  className?: string;
  children: ReactNode;
}) {
  const s = `min(${maxScale}, tan(atan2(100cqw, ${w}px)))`;
  return (
    <div className={className} style={{ containerType: "inline-size" }}>
      <div style={{ height: `calc(${h}px * ${s})`, ["--fs" as string]: s } as CSSProperties} className="relative">
        <div
          className="absolute left-1/2 top-0"
          style={{ width: w, height: h, transform: `translateX(-50%) scale(var(--fs))`, transformOrigin: "50% 0" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
