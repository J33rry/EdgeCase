"use client";

import type { ReactNode } from "react";
import { navigateTo } from "./Navbar";
import type { NavAnchor } from "./ScrollExperience";

/** In-page link that also works inside the pinned tour (anchors there are timeline points). */
export default function SectionLink({ anchor, className, children }: { anchor: NavAnchor; className?: string; children: ReactNode }) {
  return (
    <a href={`/#${anchor}`} onClick={(e) => navigateTo(anchor, e)} className={className}>
      {children}
    </a>
  );
}
