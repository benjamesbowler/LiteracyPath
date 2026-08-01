export const GUIDED_READING_NARRATION_RATE = 0.88;
export const GUIDED_READING_PAGE_LEAD_IN_MS = 1500;
export const GUIDED_READING_PAGE_LEAD_OUT_MS = 1500;

/**
 * Wait between a visible page turn and narration, or between narration and the
 * next page. Resolving false on cancellation keeps callers from advancing a
 * book after the child has stopped reading or turned a page manually.
 */
export function waitForGuidedReadingPause(durationMs, { signal } = {}) {
  if (signal?.aborted) return Promise.resolve(false);

  return new Promise(resolve => {
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);
      signal?.removeEventListener("abort", handleAbort);
      resolve(result);
    };
    const handleAbort = () => finish(false);
    const timerId = setTimeout(() => finish(true), Math.max(0, Number(durationMs) || 0));
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}
