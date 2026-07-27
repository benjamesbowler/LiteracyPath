// Pure geometry for the metric definition tooltip (src/components/MetricDefinition.jsx).
// Kept out of the component so it can be unit tested without a DOM.

// Gap kept between the tooltip and the viewport edge. Must stay <= the 16px
// that App.css reserves in `width: min(340px, calc(100vw - 32px))`, otherwise a
// full-width tooltip could never satisfy the constraint and would jitter.
export const VIEWPORT_GUTTER = 16;

/**
 * Work out how far to nudge a centred tooltip so it stays on screen, and
 * whether it should flip above its trigger.
 *
 * This replaces the per-container `left: 0 / right: 0` overrides that used to
 * be hand written in App.css for the few places somebody noticed the overflow.
 *
 * @param {{left:number,right:number,top:number,bottom:number}} tooltip
 *   Rect of the tooltip measured at its neutral (centred, below) position.
 * @param {{top:number,bottom:number}} anchor Rect of the trigger wrapper.
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} [gutter]
 * @returns {{shift:number, flip:("up"|null)}} `shift` in CSS px, added to the
 *   existing `translateX(-50%)`.
 */
export function computeTooltipPlacement({
  tooltip,
  anchor,
  viewportWidth,
  viewportHeight,
  gutter = VIEWPORT_GUTTER
}) {
  let shift = 0;
  if (tooltip.left < gutter) {
    shift = gutter - tooltip.left;
  } else if (tooltip.right > viewportWidth - gutter) {
    shift = viewportWidth - gutter - tooltip.right;
  }
  // A tooltip wider than the viewport cannot satisfy both edges; pin the left
  // edge rather than oscillating.
  const width = tooltip.right - tooltip.left;
  if (width > viewportWidth - gutter * 2) shift = gutter - tooltip.left;

  let flip = null;
  if (anchor && tooltip.bottom > viewportHeight - gutter) {
    const roomAbove = anchor.top - gutter;
    const roomBelow = viewportHeight - gutter - anchor.bottom;
    const height = tooltip.bottom - tooltip.top;
    // Only flip when it actually helps: there must be more room above, and
    // enough of it to be worth the move.
    if (roomAbove > roomBelow && roomAbove >= Math.min(height, roomBelow + 1)) flip = "up";
  }

  return { shift: Math.round(shift), flip };
}
