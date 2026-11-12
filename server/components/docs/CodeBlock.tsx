"use client";

import { useState } from "react";

/** Terminal-style code block with a copy button. */
export default function CodeBlock({ code, label = "bash" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: leave the text selectable */
    }
  };
  return (
    <div className="group relative my-5 overflow-hidden rounded-[14px] border border-white/[0.08] bg-black/50">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/35">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md px-2 py-0.5 font-mono text-[11.5px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13.5px] leading-[1.7] text-white/85">
        <code>{code}</code>
      </pre>
    </div>
  );
}
