import { preloadImage } from "./preloadMedia.js";

export function warmStudentAssets(world) {
  if (typeof window === "undefined" || !world?.backdrop) return () => {};
  let cancelled = false;

  const run = () => {
    if (cancelled) return;
    // The Home already requests its displayed cards and chosen companion.
    // Keep only its active backdrop warm for returning Home, in the same
    // bounded cache as activity pictures. Other routes warm their own media.
    void preloadImage(world.backdrop, { priority: "low" });
  };

  const useIdle = typeof window.requestIdleCallback === "function";
  const handle = useIdle
    ? window.requestIdleCallback(run, { timeout: 4000 })
    : window.setTimeout(run, 1200);

  return () => {
    cancelled = true;
    if (useIdle) window.cancelIdleCallback?.(handle);
    else window.clearTimeout(handle);
  };
}
