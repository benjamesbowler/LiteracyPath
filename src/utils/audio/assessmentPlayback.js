import { playCueAudio } from "./cuePlayer.js";

// Report actual media delivery, including errors after playback has started.
// Cancellation by another cue is not a literacy failure.
export function playAssessmentCue(src, { onUnavailable, onDelivery, player = playCueAudio } = {}) {
  return new Promise(resolve => {
    let settled = false;
    let failed = false;
    const settle = result => { if (!settled) { settled = true; resolve(result); } };
    const unavailable = () => {
      if (failed) return;
      failed = true;
      onUnavailable?.();
      settle({ ok: false, reason: "unavailable" });
    };
    if (!src) { unavailable(); return; }
    try {
      player(src, {
        onUnavailable: unavailable,
        onDelivery: event => {
          onDelivery?.(event);
          if (event.type === "started" || event.type === "completed") settle({ ok: true });
          if (event.type === "failed" || event.type === "unavailable") unavailable();
          if (event.type === "interrupted") settle({ ok: false, reason: "interrupted" });
        }
      });
    } catch { unavailable(); }
  });
}
