/**
 * Shared configuration for the landing page experience.
 *
 * The cinematic stage is laid out in a fixed "world" of WORLD_W × WORLD_H
 * design pixels (the mockups' coordinate space) and scaled to fit the
 * viewport, so every keyframe below is expressed in world pixels.
 */

export const WORLD_W = 1600;
export const WORLD_H = 900;

/** Media query for the pinned, scrubbed experience. Mirrors the `cine` variant in landing.css. */
export const CINE_QUERY =
  "(min-width: 1024px) and (min-aspect-ratio: 5/4) and (prefers-reduced-motion: no-preference)";

/** Highlight states understood by the `.ec-scope[data-state]` CSS. */
export type StageState = "hero" | "stats" | "progress" | "leaderboard" | "explain" | "edge" | "efficiency";

export type FeatureObject = "dashboard" | "tutor";

export interface Feature {
  id: StageState;
  object: FeatureObject;
  index: string;
  eyebrow: string;
  heading: string;
  description: string;
  /** Human-readable name of the component this feature lights up. */
  highlight: string;
  /** Anchor names the navbar can jump to. */
  anchor?: "features" | "leaderboard" | "how-it-works";
}

export const FEATURES: Feature[] = [
  {
    id: "stats",
    object: "dashboard",
    index: "01",
    eyebrow: "User statistics",
    heading: "Know where you stand.",
    description:
      "Track your coding journey with detailed insights into your performance, consistency, and problem-solving abilities.",
    highlight: "Coding progress panel",
    anchor: "features",
  },
  {
    id: "progress",
    object: "dashboard",
    index: "02",
    eyebrow: "Coding progress",
    heading: "Your progress, visualized.",
    description:
      "Go beyond counting solved problems. Understand how consistently you're improving across different aspects of problem-solving.",
    highlight: "Progress rings",
  },
  {
    id: "leaderboard",
    object: "dashboard",
    index: "03",
    eyebrow: "Leaderboard",
    heading: "Compete. Climb. Conquer.",
    description:
      "See how you stack up against other developers. Track your ranking, challenge your peers, and stay motivated to improve.",
    highlight: "Leaderboard",
    anchor: "leaderboard",
  },
  {
    id: "explain",
    object: "tutor",
    index: "04",
    eyebrow: "Explain this solution",
    heading: "Understand, don't memorize.",
    description:
      "Get clear explanations of coding solutions, understand the logic behind every step, and learn why an approach works.",
    highlight: "Explain this solution",
    anchor: "how-it-works",
  },
  {
    id: "edge",
    object: "tutor",
    index: "05",
    eyebrow: "Find edge cases",
    heading: "Think beyond the obvious.",
    description:
      "Discover hidden edge cases, uncover potential failures, and make your solutions more robust before submitting.",
    highlight: "Find edge cases",
  },
  {
    id: "efficiency",
    object: "tutor",
    index: "06",
    eyebrow: "Improve efficiency",
    heading: "Write smarter. Run faster.",
    description:
      "Identify inefficient logic, discover better approaches, and optimize your code with AI-powered guidance.",
    highlight: "Improve efficiency",
  },
];

/** Native (unscaled) sizes of the two glass objects, in world pixels. */
export const DASH_SIZE = { w: 340, h: 446 };
export const TUTOR_SIZE = { w: 652, h: 560 };

export interface Pose {
  x: number; // centre x in world px
  y: number; // centre y in world px
  scale: number;
  rotationY: number;
  rotationX: number;
  z: number;
  /** 0 = full colour, 1 = fully receded (dimmed + desaturated). */
  recede: number;
}

/** Keyframe poses for each object at each phase of the scroll experience. */
export const POSES: Record<"hero" | "dashboard" | "tutor", { dash: Pose; tutor: Pose }> = {
  hero: {
    dash: { x: 735, y: 432, scale: 1, rotationY: -7, rotationX: 2, z: 40, recede: 0 },
    tutor: { x: 1190, y: 440, scale: 1, rotationY: -7, rotationX: 2, z: 0, recede: 0 },
  },
  dashboard: {
    dash: { x: 400, y: 470, scale: 1.34, rotationY: 6, rotationX: 1, z: 60, recede: 0 },
    tutor: { x: 790, y: 460, scale: 0.9, rotationY: 8, rotationX: 1, z: -160, recede: 0.55 },
  },
  tutor: {
    dash: { x: 655, y: 440, scale: 0.76, rotationY: 10, rotationX: 1, z: -220, recede: 0.6 },
    tutor: { x: 1075, y: 482, scale: 1.24, rotationY: -6, rotationX: 1, z: 60, recede: 0 },
  },
};
