export function triggerTactileFeedback(patternMs = 12) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(patternMs);
  } catch {
    // Vibration is a nice-to-have only.
  }
}
