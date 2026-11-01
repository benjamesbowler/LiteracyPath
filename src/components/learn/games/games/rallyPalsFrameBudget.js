// The original 36-frame window is 600ms at 60Hz. Keep its mean threshold,
// but do not require a slow renderer to spend several seconds gathering it.
export function createRallyPalsFrameWindow() { return { frames: 0, elapsed: 0 }; }
export function sampleRallyPalsFrameWindow(window, milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0 || milliseconds > 1000) return null;
  window.frames++;
  window.elapsed += milliseconds;
  if (window.frames < 36 && (window.elapsed < 600 || window.frames < 8)) return null;
  const average = window.elapsed / window.frames;
  window.frames = 0;
  window.elapsed = 0;
  return average;
}
