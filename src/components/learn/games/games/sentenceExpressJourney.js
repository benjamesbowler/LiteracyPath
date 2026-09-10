// Presentation time is elapsed unpaused time, never a count of rendered frames.
export function createJourneyClock(startedAt) {
  let pausedAt = null;
  let pausedDuration = 0;
  return {
    pause(now) { if (pausedAt === null) pausedAt = now; },
    resume(now) { if (pausedAt !== null) { pausedDuration += Math.max(0, now - pausedAt); pausedAt = null; } },
    elapsed(now) { return Math.max(0, (pausedAt ?? now) - startedAt - pausedDuration); }
  };
}
