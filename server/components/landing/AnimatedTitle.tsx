"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

/** Hidden pose for a word: pushed back and swung open, as in Zentry's animated titles. */
export const WORD_FROM = { opacity: 0, x: 10, y: 51, z: -60, rotateY: 60, rotateX: -40 } as const;

const container: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.06 } } };
const word: Variants = {
  hidden: { ...WORD_FROM },
  shown: { opacity: 1, x: 0, y: 0, z: 0, rotateY: 0, rotateX: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Heading whose words rotate into place when scrolled into view.
 * Pass `lines` to force line breaks.
 */
export default function AnimatedTitle({
  lines,
  as = "h2",
  className = "",
  id,
}: {
  lines: string[];
  as?: "h1" | "h2";
  className?: string;
  id?: string;
}) {
  const still = !!useReducedMotion();
  const Tag = as === "h1" ? motion.h1 : motion.h2;
  return (
    <Tag
      id={id}
      className={className}
      variants={container}
      initial={still ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.5 }}
    >
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((w, i, arr) => (
            <motion.span key={i} variants={word} className="inline-block" style={{ transformPerspective: 800 }}>
              {w}
              {i < arr.length - 1 ? " " : null}
            </motion.span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
