import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { TUTOR_SIZE } from "./config";
import { BugIcon, CheckIcon, CloseIcon, CodeIcon, DocIcon, ListIcon, PlayIcon, SendIcon, SparkleIcon } from "./icons";

/* ─────────────────────────── Code sample ─────────────────────────── */

type Tok = [string, string?];
const C = {
  kw: "text-[#8fa8ff]",
  fn: "text-[#ffd166]",
  ty: "text-[#5eead4]",
  pr: "text-[#ff9e64]",
  pu: "text-white/60",
};

const CODE: Tok[][] = [
  [["function", C.kw], [" "], ["twoSum", C.fn], ["(nums, "], ["target", C.kw], [") {", C.pu]],
  [["  "], ["const", C.kw], [" map = "], ["new", C.kw], [" "], ["Map", C.ty], ["();", C.pu]],
  [],
  [["  "], ["for", C.kw], [" ("], ["let", C.kw], [" i = "], ["0", C.pr], ["; i < nums.length; i++) {", C.pu]],
  [["    "], ["const", C.kw], [" complement = target - nums[i];"]],
  [["    "], ["if", C.kw], [" (map."], ["has", C.fn], ["(complement)) {"]],
  [["      "], ["return", C.kw], [" [map."], ["get", C.fn], ["(complement), i];"]],
  [["    }", C.pu]],
  [["    map."], ["set", C.fn], ["(nums[i], i);"]],
  [["  }", C.pu]],
  [["}", C.pu]],
];

/** Small annotations shown at the end of a code line for a given feature. */
const TAGS: Record<number, { for: string; text: string; tone: "green" | "orange" | "red" }[]> = {
  6: [
    { for: "explain", text: "seen?", tone: "green" },
    { for: "edge", text: "[3,3] ✓", tone: "orange" },
    { for: "efficiency", text: "2 lookups", tone: "red" },
  ],
  9: [
    { for: "explain", text: "remember", tone: "green" },
    { for: "edge", text: "after check", tone: "orange" },
  ],
  11: [{ for: "edge", text: "no pair → undefined", tone: "orange" }],
};

const TONE = {
  green: "border-ec-green/50 bg-ec-green/15 text-ec-green",
  orange: "border-ec-orange/50 bg-ec-orange/15 text-ec-orange",
  red: "border-[#ff7a59]/50 bg-[#ff7a59]/15 text-[#ff9b80]",
};

function CodeBlock() {
  return (
    <div className="relative mt-3 flex-1 overflow-hidden rounded-[12px] border border-white/[0.06] bg-black/40 py-2.5 pl-2 pr-3 font-mono text-[11px] leading-[19px]">
      {CODE.map((line, idx) => {
        const n = idx + 1;
        return (
          <div key={n} className="code-line flex" data-l={n}>
            <span className="relative w-[26px] shrink-0 pr-3 text-right text-white/25">{n}</span>
            <span className="relative whitespace-pre text-white/90">
              {line.map(([t, cls], j) => (
                <span key={j} className={cls}>
                  {t}
                </span>
              ))}
            </span>
            {TAGS[n]?.map((tag) => (
              <span
                key={tag.for}
                data-for={tag.for}
                className={`code-tag absolute right-0 top-[2px] rounded-[5px] border px-1.5 font-sans text-[9px] font-semibold leading-[14px] ${TONE[tag.tone]}`}
              >
                {tag.text}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Tutor replies ─────────────────────────── */

function Reply({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div data-for={id} className="tz-reply absolute inset-0 flex flex-col gap-2 text-[11.5px] leading-[1.5] text-white/85">
      <div style={{ "--i": 0 } as CSSProperties} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ec-green">
        <SparkleIcon size={11} />
        {title}
      </div>
      {children}
    </div>
  );
}

const Code = ({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "orange" }) => (
  <code
    className={`rounded-[4px] px-1 font-mono text-[10.5px] ${
      tone === "green" ? "bg-ec-green/15 text-ec-green" : "bg-ec-orange/15 text-ec-orange"
    }`}
  >
    {children}
  </code>
);

function Replies() {
  return (
    <div className="relative mt-3 flex-1">
      <div className="tz-typing absolute left-1 top-1 flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-ec-green/30" />
        ))}
      </div>

      <Reply id="explain" title="Explanation">
        <p style={{ "--i": 1 } as CSSProperties}>
          For each number, work out the <Code>complement</Code> it still needs to reach the target.
        </p>
        <p style={{ "--i": 2 } as CSSProperties}>
          If the map has already <Code>seen</Code> that complement, its index is stored. Return both.
        </p>
        <p style={{ "--i": 3 } as CSSProperties}>Otherwise remember this number and keep going. One pass.</p>
        <p style={{ "--i": 4 } as CSSProperties} className="mt-auto text-[10.5px] text-white/50">
          Time <span className="text-ec-green">O(n)</span> · Space <span className="text-ec-green">O(n)</span>
          <span className="tz-caret" />
        </p>
      </Reply>

      <Reply id="edge" title="3 edge cases found">
        {[
          ["[3, 3], target 6", "Duplicates work: you check before you set (line 9).", "green"],
          ["no valid pair", "Falls through and returns undefined (line 11).", "orange"],
          ["[ ]", "Empty input skips the loop entirely. Return [ ] explicitly.", "orange"],
        ].map(([code, text, tone], i) => (
          <div key={code} style={{ "--i": i + 1 } as CSSProperties} className="flex gap-2">
            <span className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${tone === "green" ? "bg-ec-green" : "bg-ec-orange"}`} />
            <p>
              <Code tone={tone as "green" | "orange"}>{code}</Code> {text}
              {i === 2 && <span className="tz-caret" />}
            </p>
          </div>
        ))}
      </Reply>

      <Reply id="efficiency" title="Optimization">
        <p style={{ "--i": 1 } as CSSProperties}>
          Each hit does two hash lookups: <Code>has</Code> then <Code>get</Code>. One is enough.
        </p>
        <div
          style={{ "--i": 2 } as CSSProperties}
          className="overflow-hidden rounded-[8px] border border-white/[0.07] bg-black/40 font-mono text-[10px] leading-[16px]"
        >
          <div className="whitespace-pre bg-[#ff7a59]/10 px-2 text-[#ff9b80]">{"- if (map.has(c))\n-   return [map.get(c), i];"}</div>
          <div className="whitespace-pre bg-ec-green/10 px-2 text-ec-green">{"+ const j = map.get(c);\n+ if (j !== undefined)\n+   return [j, i];"}</div>
        </div>
        <p style={{ "--i": 3 } as CSSProperties} className="mt-auto text-[10.5px] text-white/50">
          Map operations per hit <span className="text-ec-green">2 → 1</span> · still O(n)
          <span className="tz-caret" />
        </p>
      </Reply>
    </div>
  );
}

/* ─────────────────────────── Component ─────────────────────────── */

const ACTIONS = [
  { id: "explain", label: "Explain this solution", Icon: CodeIcon },
  { id: "edge", label: "Find edge cases", Icon: BugIcon },
  { id: "efficiency", label: "Improve efficiency", Icon: ListIcon },
] as const;

/**
 * Object B — the AI Tutor workspace (question, editor and tutor panel).
 * Rendered once and moved by the scroll stage.
 */
const AITutor3D = forwardRef<HTMLDivElement, { className?: string; style?: CSSProperties; showBaseplate?: boolean }>(
  function AITutor3D({ className = "", style, showBaseplate = true }, ref) {
    return (
      <div
        ref={ref}
        className={`relative select-none ${className}`}
        style={{ width: TUTOR_SIZE.w, height: TUTOR_SIZE.h, ...style }}
        aria-label="EdgeCase AI Tutor preview"
        role="img"
      >
        {/* Floor reflection */}
        <div
          className="pointer-events-none absolute -bottom-28 left-[10%] h-44 w-[95%]"
          style={{ background: "radial-gradient(ellipse at 60% 25%, rgba(0,229,160,0.3), transparent 65%)" }}
        />
        {/* Long base plate that sits under the dashboard in the hero composition */}
        {showBaseplate && (
          <div
            data-part="baseplate"
            className="glass glass-edge absolute -left-[275px] bottom-[-16px] right-[14px] top-[44px] rounded-[28px] opacity-80"
            style={
              {
                "--edge": "linear-gradient(90deg, rgba(255,174,0,0.9), rgba(255,174,0,0.25) 30%, rgba(0,229,160,0.3) 70%, rgba(0,229,160,0.9))",
                boxShadow: "0 18px 40px -12px rgba(255,160,0,0.25), 30px 20px 50px -20px rgba(0,229,160,0.35)",
              } as CSSProperties
            }
          />
        )}
        {/* Back glass layer (depth) */}
        <div
          className="glass glass-edge absolute -top-[18px] left-[28px] right-[40px] h-24 rounded-[24px] opacity-60"
          style={{ "--edge": "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(0,229,160,0.55))" } as CSSProperties}
        />

        <div className="glass glass-edge glass-sheen edge-green absolute inset-0 flex gap-[10px] rounded-[26px] p-[14px]">
          <div
            data-glow="tutor"
            className="glow-layer"
            style={{ boxShadow: "0 0 50px rgba(0,229,160,0.5), 0 0 140px rgba(0,229,160,0.28)" }}
          />

          {/* Question + editor */}
          <section className="cz-panel subpanel mb-[18px] mt-[30px] flex w-[352px] shrink-0 flex-col rounded-[16px] p-3">
            <header className="flex items-center gap-2.5 border-b border-white/[0.06] pb-2.5 text-white">
              <DocIcon size={17} className="text-white/80" />
              <span className="text-[16px] font-semibold tracking-[-0.01em]">Question</span>
            </header>
            <p className="mt-2.5 font-mono text-[12px] leading-[1.55] text-white/85">
              Given an array of integers, return the two numbers that add up to a target.
            </p>
            <CodeBlock />
            <footer className="mt-3 flex items-center justify-between">
              <span className="subpanel flex h-[32px] items-center gap-2 rounded-[9px] px-3 text-[12.5px] text-white/85">
                <PlayIcon size={13} /> Run
              </span>
              <span className="flex h-[32px] items-center gap-1.5 rounded-[9px] border border-ec-green/35 bg-ec-green/12 px-3 text-[12.5px] font-medium text-ec-green">
                <CheckIcon size={14} /> Submit
              </span>
            </footer>
          </section>

          {/* Tutor panel */}
          <section
            className="tz-panel glass-edge edge-green-solid relative flex flex-1 flex-col rounded-[20px] p-3.5"
            style={{ background: "linear-gradient(170deg, rgba(0,229,160,0.12), rgba(0,229,160,0.035) 40%, rgba(10,20,16,0.6))" }}
          >
            <header className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-white">
                <SparkleIcon size={22} className="text-ec-green" />
                <span className="text-[19px] font-bold tracking-[-0.02em]">AI Tutor</span>
              </span>
              <CloseIcon size={17} className="text-white/70" />
            </header>
            <div className="tz-greet mt-3 rounded-[14px] border border-ec-green/20 bg-ec-green/[0.09] px-3 py-2.5 text-[13.5px] leading-[1.4] text-white/90">
              How can I help you with this question?
            </div>
            <div className="mt-3 space-y-[7px]">
              {ACTIONS.map(({ id, label, Icon }) => (
                <div
                  key={id}
                  data-act={id}
                  className="tz-act flex h-[38px] items-center gap-2.5 rounded-[12px] border border-white/[0.08] bg-white/[0.035] px-3 text-[13px] text-white/90"
                >
                  <Icon size={16} className="text-ec-green" />
                  {label}
                </div>
              ))}
            </div>
            <Replies />
            <div className="subpanel mt-3 flex h-[42px] items-center justify-between rounded-[12px] pl-3 pr-1.5">
              <span className="font-mono text-[11.5px] text-white/45">Ask the tutor...</span>
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-ec-green text-[#04281c] shadow-[0_0_14px_rgba(0,229,160,0.6)]">
                <SendIcon size={15} />
              </span>
            </div>
          </section>
        </div>
      </div>
    );
  },
);

export default AITutor3D;
