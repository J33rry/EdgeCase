import { useId } from "react";

/**
 * Atmospheric lighting behind the glass objects: two colour washes whose
 * opacity the scroll timeline drives (`data-ambient`), light streaks, a faint
 * horizon arc and a vignette. Static paint; only opacity/transform animate.
 */
export default function AmbientBackground({ className = "" }: { className?: string }) {
  const u = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${name}-${u}`;
  const url = (name: string) => `url(#${id(name)})`;
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        data-ambient="orange"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 8% 100%, rgba(255,150,0,0.16), transparent 70%), radial-gradient(40% 40% at 42% 62%, rgba(255,174,0,0.07), transparent 70%)",
        }}
      />
      <div
        data-ambient="green"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 60% at 96% 4%, rgba(0,229,160,0.14), transparent 70%), radial-gradient(45% 40% at 76% 92%, rgba(0,229,160,0.1), transparent 70%)",
        }}
      />

      <div className="ec-grid absolute inset-0" />

      <svg
        data-streaks
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={id("ec-streak-o")} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FF9500" stopOpacity="0" />
            <stop offset="0.25" stopColor="#FFAE00" stopOpacity="0.95" />
            <stop offset="0.6" stopColor="#FFAE00" stopOpacity="0.35" />
            <stop offset="1" stopColor="#FFAE00" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("ec-streak-g")} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#00E5A0" stopOpacity="0" />
            <stop offset="0.55" stopColor="#00E5A0" stopOpacity="0.8" />
            <stop offset="1" stopColor="#7DFFD4" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={id("ec-horizon")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.07" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id={id("ec-glow")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/* Horizon arc */}
        <path d="M-50 520 C 300 260, 900 120, 1700 140" fill="none" stroke={url("ec-horizon")} strokeWidth="1.5" />
        <path d="M-50 560 C 380 330, 950 200, 1700 210" fill="none" stroke={url("ec-horizon")} strokeWidth="1" opacity="0.6" />

        {/* Orange streak, bottom left */}
        <g data-streak="orange">
          <path d="M-40 700 C 200 760, 420 860, 560 960" fill="none" stroke={url("ec-streak-o")} strokeWidth="10" filter={url("ec-glow")} opacity="0.8" />
          <path d="M-40 700 C 200 760, 420 860, 560 960" fill="none" stroke={url("ec-streak-o")} strokeWidth="2" />
        </g>

        {/* Green streak, top right */}
        <g data-streak="green">
          <path d="M1180 210 C 1350 170, 1480 120, 1640 60" fill="none" stroke={url("ec-streak-g")} strokeWidth="10" filter={url("ec-glow")} opacity="0.8" />
          <path d="M1180 210 C 1350 170, 1480 120, 1640 60" fill="none" stroke={url("ec-streak-g")} strokeWidth="2" />
        </g>
      </svg>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)" }}
      />
      {/* Fade the washes into the page colour so the next section continues seamlessly. */}
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-b from-transparent to-[#080a09]" />
    </div>
  );
}
