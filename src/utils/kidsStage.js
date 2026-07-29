// THE FIXED CHILD CANVAS AND ITS SCALE-TO-FIT.
//
// The kids-side redesign is a FIXED-CANVAS design: 1194 x 834 CSS px (iPad
// landscape, the primary classroom device). Other viewports scale the whole
// stage to fit rather than reflowing (spec: "Responsive"). Present mode already
// solved exactly this problem — public/present/deck.js fitStage() — and this is
// the same solution at a different size.
//
// THE TRAP, recorded in docs/PRESENT_REDESIGN_2026-07-28.md and worth repeating
// because it is invisible in tests: do NOT centre the stage with grid
// `place-items: center`. Chromium START-aligns a grid item that overflows its
// track, so the stage hangs down-right and its top-left is clipped on every
// window smaller than the canvas. Centring must be an explicit translate INSIDE
// the same transform the scale is written to — which is why this module writes
// only the scale and kids-glass.css owns `translate(-50%, -50%) scale(...)`.

export const KIDS_STAGE_WIDTH = 1194;
export const KIDS_STAGE_HEIGHT = 834;

// Everything below the header and above the tab bar. Exported so a screen can
// reason about its own height without re-deriving the chrome.
export const KIDS_HEADER_HEIGHT = 78;
export const KIDS_TABBAR_HEIGHT = 92;
export const KIDS_CONTENT_HEIGHT =
  KIDS_STAGE_HEIGHT - KIDS_HEADER_HEIGHT - KIDS_TABBAR_HEIGHT;

// A scale below this is unusable for a five-year-old's fingers, so the stage
// stops shrinking and the viewport clips instead of producing 20px text.
const MIN_SCALE = 0.4;

/**
 * The uniform scale that fits the canvas inside `width` x `height`.
 * Both axes are considered, so the stage never overflows either one.
 * Non-finite or non-positive input returns 1 — a stage at natural size is a
 * safe failure, a stage at scale 0 or NaN is an invisible one.
 */
export function computeKidsStageScale(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 1;
  const scale = Math.min(w / KIDS_STAGE_WIDTH, h / KIDS_STAGE_HEIGHT);
  if (!Number.isFinite(scale) || scale <= 0) return 1;
  return Math.max(MIN_SCALE, scale);
}

/**
 * Write the scale onto the element as the --kg-scale custom property.
 *
 * Deliberately a DOM write rather than React state: the shell would otherwise
 * have to set state from inside an effect on first paint, which
 * react-hooks/set-state-in-effect forbids, and a resize would re-render the
 * whole child area to change one number. Returns the scale it wrote.
 */
export function applyKidsStageScale(element, view = globalThis) {
  if (!element?.style) return 1;
  const scale = computeKidsStageScale(view?.innerWidth, view?.innerHeight);
  element.style.setProperty("--kg-scale", String(scale));
  return scale;
}
