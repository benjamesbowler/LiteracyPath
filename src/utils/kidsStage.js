// Bounded learning canvases retain an authored coordinate system. Catalogues
// opt into native metrics: scale 1, actual visual viewport width and height.
// Home, Books, Arcade, Hollow and Words own a single vertical collection
// scroller; their chrome and controls must never upscale with display height.

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

// ui-quality-pass.css switches the child stage to an unscaled native phone
// layout at this exact breakpoint. Above it the canvas transform is active, so
// a 56 design-px button can become a 42 physical-px target on a portrait iPad.
const NATIVE_PHONE_MAX_WIDTH = 700;
const NATIVE_PORTRAIT_TABLET_MAX_WIDTH = 900;
const PHYSICAL_TARGET_PX = 56;
const PHYSICAL_ANSWER_WIDTH_PX = 80;
const PHYSICAL_ANSWER_HEIGHT_PX = 64;

function usesNativeViewportLayout(width, height) {
  return width <= NATIVE_PHONE_MAX_WIDTH
    || (width <= NATIVE_PORTRAIT_TABLET_MAX_WIDTH && height >= width);
}

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
 * Safari keeps two viewport sizes on iPad: the layout viewport can continue
 * behind its address/tab bars, while visualViewport is the part the child can
 * actually see. Child screens must fit the latter or their bottom controls sit
 * underneath browser chrome even though ordinary desktop checks pass.
 */
export function readKidsVisibleViewport(view = globalThis) {
  const visualViewport = view?.visualViewport;
  const visualWidth = Number(visualViewport?.width);
  const visualHeight = Number(visualViewport?.height);
  const fallbackWidth = Number(view?.innerWidth);
  const fallbackHeight = Number(view?.innerHeight);
  const width = Number.isFinite(visualWidth) && visualWidth > 0
    ? visualWidth
    : fallbackWidth;
  const height = Number.isFinite(visualHeight) && visualHeight > 0
    ? visualHeight
    : fallbackHeight;

  return {
    width: Number.isFinite(width) && width > 0 ? width : KIDS_STAGE_WIDTH,
    height: Number.isFinite(height) && height > 0 ? height : KIDS_STAGE_HEIGHT,
    offsetLeft: Number.isFinite(Number(visualViewport?.offsetLeft))
      ? Number(visualViewport.offsetLeft)
      : 0,
    offsetTop: Number.isFinite(Number(visualViewport?.offsetTop))
      ? Number(visualViewport.offsetTop)
      : 0
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
export function applyKidsStageMetrics(element, view = globalThis, { native = false } = {}) {
  const viewport = readKidsVisibleViewport(view);
  const metrics = native
    ? { scale: 1, stageWidth: viewport.width }
    : computeKidsStageMetrics(viewport.width, viewport.height);
  if (!element?.style) return { scale: 1, stageWidth: KIDS_STAGE_WIDTH };
  const effectiveScale = native || usesNativeViewportLayout(viewport.width, viewport.height)
    ? 1
    : metrics.scale;
  element.style.setProperty("--kg-scale", String(metrics.scale));
  element.style.setProperty("--kg-stage-width", `${metrics.stageWidth}px`);
  element.style.setProperty("--kg-visible-stage-height", `${viewport.height}px`);
  // Compensate in design pixels so scaling never turns the child-facing 56px
  // floor or readable answer-card floor into smaller physical controls.
  element.style.setProperty("--kg-physical-hit", `${PHYSICAL_TARGET_PX / effectiveScale}px`);
  element.style.setProperty(
    "--kg-physical-answer-width",
    `${PHYSICAL_ANSWER_WIDTH_PX / effectiveScale}px`
  );
  element.style.setProperty(
    "--kg-physical-answer-height",
    `${PHYSICAL_ANSWER_HEIGHT_PX / effectiveScale}px`
  );
  return metrics;
}
