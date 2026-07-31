// THE CHILD STAGE AND HOW IT MEETS A REAL VIEWPORT.
//
// WHAT CHANGED, AND WHY (2026-07-29, foundation pass). The first build took the
// spec's "fixed canvas, scale the whole stage to fit" literally: a 1194 x 834
// box scaled by min(w/1194, h/834). That preserves the canvas aspect ratio
// exactly — and therefore letterboxes every viewport that is not 1.43:1. The
// owner reviews in a desktop browser at roughly 1300 x 760 of page area, where
// height binds at ~0.86 and about 125px of bare page background sits down each
// side; at 1920 x 1080 it is 187px a side, ~19% of the screen thrown away. He
// is right that it looks wasteful, and every screen phases C-F add would
// inherit it.
//
// THE NEW POLICY: PIN THE HEIGHT, LET THE WIDTH BREATHE.
//
//   scale       = min(viewportHeight / 834, viewportWidth / 1024)
//   stageWidth  = clamp(1024, viewportWidth / scale, 3200)   [design px]
//   stageHeight = 834                                        [design px]
//
// The stage is still AUTHORED in design pixels — 44px is still 44px, the header
// is still 78, and a screen still lays itself out against a definite height —
// but the canvas is now 834 design px tall and as many design px wide as the
// viewport actually offers. Multiply stageWidth by scale and the viewport width
// comes back, so the transform fills the screen edge to edge and the dead
// margin is gone by construction rather than by tuning.
//
// This is why a scale-transform still beats a clamp()-per-value rewrite here:
// every screen keeps ONE coordinate system to author in, phases C-F inherit the
// fix without learning a new unit, and the horizontal reflow is ordinary CSS
// (1fr columns simply get wider) instead of ninety hand-tuned clamps.
//
// The three numbers that make it safe:
//
//   834  is the authoring height and never varies. Every screen can keep
//        reasoning about a fixed content height (see KIDS_CONTENT_HEIGHT), which
//        is what makes the no-scroll rule checkable rather than hopeful.
//   1024 is the narrowest width the child screens are authored to survive (six
//        doorways, five tabs). Below it the scale drops instead, so a tall
//        narrow window letterboxes top-and-bottom rather than breaking the row.
//   3200 is a defensive ceiling for display walls. Ordinary classroom laptops,
//        16:9 desktops and 21:9 review monitors all continue to fill edge to
//        edge instead of returning to a narrow mid-band.
//
// 1194 x 834 — iPad landscape, the primary classroom device — is the exact
// fixed point of all of this: scale 1, stageWidth 1194. The guaranteed-correct
// case the spec asks for is preserved bit for bit; everything else grows into
// the space it has instead of being framed by it.
//
// THE TRAP, recorded in docs/PRESENT_REDESIGN_2026-07-28.md and worth repeating
// because it is invisible in tests: do NOT centre the stage with grid
// `place-items: center`. Chromium START-aligns a grid item that overflows its
// track, so the stage hangs down-right and its top-left is clipped on every
// window smaller than the canvas. Centring must be an explicit translate INSIDE
// the same transform the scale is written to — which is why this module writes
// only numbers and kids-glass.css owns `translate(-50%, -50%) scale(...)`.

// The authoring reference: the spec's canvas, and still the exact render on an
// iPad in landscape.
export const KIDS_STAGE_WIDTH = 1194;
export const KIDS_STAGE_HEIGHT = 834;

// How far the canvas may stretch sideways before it stops helping. 3200 design
// pixels covers classroom laptops, 16:9 displays and 21:9 review monitors
// without returning to the narrow centre band the fluid-stage work removed.
export const KIDS_STAGE_MIN_WIDTH = 1024;
export const KIDS_STAGE_MAX_WIDTH = 3200;

// Everything below the header and above the tab bar. Exported so a screen can
// reason about its own height without re-deriving the chrome. The height is
// pinned, so this stays a constant: a screen that overflows it is a bug in the
// screen, never a property of the viewport.
export const KIDS_HEADER_HEIGHT = 78;
export const KIDS_TABBAR_HEIGHT = 92;
export const KIDS_CONTENT_HEIGHT =
  KIDS_STAGE_HEIGHT - KIDS_HEADER_HEIGHT - KIDS_TABBAR_HEIGHT;

// A scale below this is unusable for a five-year-old's fingers, so the stage
// stops shrinking and the viewport clips instead of producing 20px text.
const MIN_SCALE = 0.4;

function clampNumber(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

/**
 * The uniform scale the stage is drawn at.
 *
 * Height binds normally, because the canvas height is what is fixed. Width binds
 * only when the window is narrower than 1024 design px would need — the point at
 * which shrinking everything is better than breaking the six-doorway row.
 *
 * Non-finite or non-positive input returns 1 — a stage at natural size is a safe
 * failure, a stage at scale 0 or NaN is an invisible one.
 */
export function computeKidsStageScale(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 1;
  const scale = Math.min(h / KIDS_STAGE_HEIGHT, w / KIDS_STAGE_MIN_WIDTH);
  if (!Number.isFinite(scale) || scale <= 0) return 1;
  return Math.max(MIN_SCALE, scale);
}

/**
 * The canvas width, in design px, for a viewport. Multiply it by the scale above
 * and the viewport width comes back — except where the clamp deliberately stops
 * the stage growing and hands the remainder to the page gutter.
 */
export function computeKidsStageWidth(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return KIDS_STAGE_WIDTH;
  }
  return clampNumber(
    w / computeKidsStageScale(w, h),
    KIDS_STAGE_MIN_WIDTH,
    KIDS_STAGE_MAX_WIDTH
  );
}

/**
 * Both numbers at once, which is how the shell wants them.
 */
export function computeKidsStageMetrics(width, height) {
  return {
    scale: computeKidsStageScale(width, height),
    stageWidth: computeKidsStageWidth(width, height)
  };
}

/**
 * Write the metrics onto the element as --kg-scale and --kg-stage-width.
 *
 * Deliberately a DOM write rather than React state: the shell would otherwise
 * have to set state from inside an effect on first paint, which
 * react-hooks/set-state-in-effect forbids, and a resize would re-render the
 * whole child area to change two numbers. Returns what it wrote.
 */
export function applyKidsStageMetrics(element, view = globalThis) {
  const metrics = computeKidsStageMetrics(view?.innerWidth, view?.innerHeight);
  if (!element?.style) return { scale: 1, stageWidth: KIDS_STAGE_WIDTH };
  element.style.setProperty("--kg-scale", String(metrics.scale));
  element.style.setProperty("--kg-stage-width", `${metrics.stageWidth}px`);
  return metrics;
}
