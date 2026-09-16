import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const preference = () => typeof window === "undefined" ? null : window.matchMedia?.(query);
const getSnapshot = () => preference()?.matches ?? false;
const getServerSnapshot = () => false;

function subscribe(onChange) {
  const media = preference();
  if (!media) return () => {};
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// Keep OS preference changes live without pulling an animation engine into boot.
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
