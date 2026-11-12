"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny shared flag: has the loading screen started lifting? Intro animations
 * (hero copy, stage objects, navbar) wait for it so they play as the page is
 * revealed instead of finishing unseen behind the loader.
 */
let ready = false;
const listeners = new Set<() => void>();

export function markIntroReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
}

export const isIntroReady = () => ready;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useIntroReady() {
  return useSyncExternalStore(subscribe, isIntroReady, () => false);
}
