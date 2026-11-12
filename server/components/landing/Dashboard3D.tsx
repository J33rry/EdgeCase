import { forwardRef, useId, type CSSProperties } from "react";
import { DASH_SIZE } from "./config";
import { KebabIcon, LogoMark, PuzzleIcon } from "./icons";

const RINGS = [
  { label: "Problems", value: 84, sub: "268 / 320", delta: "+6%", color: "#FFAE00", color2: "#FFD15C" },
  { label: "Edge Cases", value: 76, sub: "152 caught", delta: "+11%", color: "#00E5A0", color2: "#7DFFD4" },
  { label: "Test Coverage", value: 92, sub: "avg / run", delta: "+3%", color: "#FFAE00", color2: "#FFD15C" },
] as const;

const LEADERS = [
  { rank: 1, name: "You", score: "2,840", you: true },
  { rank: 2, name: "DevAtlas", score: "2,690" },
  { rank: 3, name: "NullSafe", score: "2,410" },
] as const;

const R = 29;
const CIRC = 2 * Math.PI * R;

function Ring({ ring, i }: { ring: (typeof RINGS)[number]; i: number }) {
  const off = CIRC * (1 - ring.value / 100);
  const gid = `ring-g-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-[78px] w-[78px]">
        <div
          className="ring-halo absolute -inset-3 rounded-full"
          style={{ background: `radial-gradient(circle, ${ring.color}40 0%, ${ring.color}14 45%, transparent 70%)` }}
        />
        <svg viewBox="0 0 78 78" className="relative h-full w-full -rotate-90">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={ring.color2} />
              <stop offset="1" stopColor={ring.color} />
            </linearGradient>
          </defs>
          <circle cx="39" cy="39" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
          <circle
            className="ring-arc"
            cx="39"
            cy="39"
            r={R}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={off}
            style={{ "--ring-len": `${CIRC}`, "--ring-off": `${off}`, "--ring-c": ring.color } as CSSProperties}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold tracking-[-0.02em] text-white">
          {ring.value}%
        </span>
        <span
          className="ring-delta absolute -right-2 -top-1 rounded-full px-1.5 py-[1px] text-[9.5px] font-semibold"
          style={
            {
              "--i": i,
              color: ring.color,
              background: `${ring.color}1f`,
              border: `1px solid ${ring.color}66`,
            } as CSSProperties
          }
        >
          {ring.delta}
        </span>
      </div>
      <span className="ring-label zone mt-1.5 text-[11.5px] font-medium text-white/80">{ring.label}</span>
      <span className="ring-sub mt-0.5 font-mono text-[9.5px] text-white/45">{ring.sub}</span>
    </div>
  );
}

/**
 * Object A — the developer dashboard. Rendered once and moved by the scroll
 * stage; its zones respond to the `.ec-scope[data-state]` highlight system.
 */
const Dashboard3D = forwardRef<HTMLDivElement, { className?: string; style?: CSSProperties }>(
  function Dashboard3D({ className = "", style }, ref) {
    return (
      <div
        ref={ref}
        className={`relative select-none ${className}`}
        style={{ width: DASH_SIZE.w, height: DASH_SIZE.h, ...style }}
        aria-label="EdgeCase dashboard preview"
        role="img"
      >
        {/* Floor reflection */}
        <div
          className="pointer-events-none absolute -bottom-24 left-1/2 h-40 w-[130%] -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(255,160,0,0.28), transparent 65%)" }}
        />
        {/* Back glass layer (depth) */}
        <div
          className="glass glass-edge absolute -top-[22px] left-[118px] h-24 w-[205px] rounded-[18px] opacity-70"
          style={{ "--edge": "linear-gradient(180deg, rgba(255,174,0,0.6), rgba(255,174,0,0.05))" } as CSSProperties}
        />

        <div className="glass glass-edge glass-sheen edge-orange absolute inset-0 flex flex-col rounded-[22px] p-[14px]">
          <div data-glow="dash" className="glow-layer" style={{ boxShadow: "0 0 40px rgba(255,174,0,0.55), 0 0 110px rgba(255,150,0,0.3)" }} />

          <header className="dz-head zone flex h-10 items-center justify-between px-1">
            <span className="flex items-center gap-2">
              <LogoMark size={24} />
              <span className="text-[19px] font-bold tracking-[-0.02em] text-white">EdgeCase</span>
            </span>
            <span className="flex items-center gap-2 text-white/80">
              <span className="subpanel flex h-[30px] w-[30px] items-center justify-center rounded-[9px]">
                <PuzzleIcon size={16} />
              </span>
              <KebabIcon size={16} />
            </span>
          </header>

          <section className="dz-progress zone subpanel mt-3 rounded-[16px] px-3 pb-2.5 pt-3">
            <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-white/90">Coding Progress</h3>
            <div className="mt-2.5 grid grid-cols-3 gap-1">
              {RINGS.map((r, i) => (
                <Ring key={r.label} ring={r} i={i} />
              ))}
            </div>
          </section>

          <section className="dz-leader zone subpanel mt-3 flex-1 rounded-[16px] p-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[16.5px] font-semibold tracking-[-0.01em] text-white">Leaderboard</h3>
              <span className="lb-rank-change rounded-full border border-ec-green/40 bg-ec-green/10 px-2 py-[1px] text-[10px] font-semibold text-ec-green">
                ▲ 2 this week
              </span>
            </div>
            <ul className="mt-2 space-y-[5px]">
              {LEADERS.map((l, i) => (
                <li
                  key={l.name}
                  style={{ "--i": i } as CSSProperties}
                  className={`lb-row flex h-[34px] items-center gap-3 rounded-[10px] border px-2.5 text-[14px] ${
                    "you" in l
                      ? "lb-you border-ec-orange/50 bg-ec-orange/10"
                      : "border-transparent bg-white/[0.025]"
                  }`}
                >
                  <span
                    className={`flex h-[20px] w-[20px] items-center justify-center rounded-full text-[11px] font-bold ${
                      "you" in l ? "bg-ec-orange text-black" : "bg-white/15 text-white/80"
                    }`}
                  >
                    {l.rank}
                  </span>
                  <span className="flex-1 font-medium text-white/90">{l.name}</span>
                  <span className={`font-semibold tabular-nums ${"you" in l ? "text-ec-orange" : "text-white/75"}`}>
                    {l.score}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  },
);

export default Dashboard3D;
