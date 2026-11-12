"use client";

import { useEffect, useState } from "react";

export interface TocGroup {
  title: string;
  items: { id: string; label: string }[];
}

/** Sticky sidebar that highlights the section currently in view. */
export default function DocsToc({ groups }: { groups: TocGroup[] }) {
  const ids = groups.flatMap((g) => g.items.map((i) => i.id));
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      // The last heading above 30% of the viewport is the one being read.
      const line = window.innerHeight * 0.3;
      let current = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = els[els.length - 1]?.id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav aria-label="On this page" className="space-y-7">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/30">{g.title}</p>
          <ul className="mt-3 space-y-0.5 border-l border-white/[0.07]">
            {g.items.map((i) => {
              const on = i.id === active;
              return (
                <li key={i.id}>
                  <a
                    href={`#${i.id}`}
                    aria-current={on ? "location" : undefined}
                    className={`-ml-px block border-l py-1.5 pl-4 text-[14px] transition-colors ${
                      on ? "border-ec-orange text-white" : "border-transparent text-white/50 hover:text-white/85"
                    }`}
                  >
                    {i.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
