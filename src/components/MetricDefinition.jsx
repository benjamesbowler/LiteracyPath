import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getMetricDefinition } from "../utils/metricDefinitions.js";
import { computeTooltipPlacement } from "../utils/tooltipPlacement.js";

/**
 * Is this tooltip currently shown? Opening is CSS-driven, so the DOM is the
 * source of truth. `:hover` is not supported by every `matches()`
 * implementation (jsdom and friends), so failure means "assume open" rather
 * than throwing out of a key handler.
 */
function isOpenNow(wrapper) {
  if (!wrapper) return false;
  try {
    return wrapper.matches(":hover, :focus-within");
  } catch {
    return true;
  }
}

/**
 * Metric definition tooltip.
 *
 * Opening is CSS-driven (`:hover` / `:focus-within` in App.css) so the tooltip
 * still works if this effect never runs. This component only does collision
 * handling: on open it measures the tooltip and writes a horizontal correction
 * into the `--lp-tooltip-shift` custom property, plus `data-flip="up"` when
 * there is no room below. That replaces the five hand-written per-container
 * position overrides that used to live in App.css and only covered the
 * containers somebody happened to hit.
 *
 * Do not switch the open state to `display` - see the METRIC DEFINITION
 * TOOLTIP comment block in App.css for why.
 */
export function MetricDefinition({ metricId, ...overrides }) {
  const tooltipId = useId();
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  const reposition = useCallback(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip || typeof window === "undefined") return;

    // Measure from the neutral position, otherwise each pass compounds the
    // previous correction.
    tooltip.style.setProperty("--lp-tooltip-shift", "0px");
    tooltip.removeAttribute("data-flip");

    const box = tooltip.getBoundingClientRect();
    if (!box.width && !box.height) return;

    const { shift, flip } = computeTooltipPlacement({
      tooltip: box,
      anchor: wrapperRef.current?.getBoundingClientRect(),
      viewportWidth: document.documentElement.clientWidth || window.innerWidth,
      viewportHeight: document.documentElement.clientHeight || window.innerHeight
    });
    if (shift) tooltip.style.setProperty("--lp-tooltip-shift", `${shift}px`);
    if (flip) tooltip.setAttribute("data-flip", flip);
  }, []);

  const handleOpen = useCallback(() => {
    setDismissed(false);
    setOpen(true);
    reposition();
  }, [reposition]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setDismissed(false);
  }, []);

  const handleKeyDown = useCallback(event => {
    if (event.key !== "Escape") return;
    // Only swallow Escape when this tooltip is the thing being dismissed, so
    // it never steals the key from a surrounding dialog or drawer.
    if (!isOpenNow(wrapperRef.current)) return;
    event.stopPropagation();
    setDismissed(true);
    setOpen(false);
    if (wrapperRef.current.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }, []);

  // Keep the tooltip inside the viewport while it is open and the page moves.
  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;
    const onChange = () => reposition();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [open, reposition]);

  const definition = getMetricDefinition(metricId, overrides);
  if (!definition) return null;

  return (
    <span
      className="lp-metric-definition"
      data-metric-definition={metricId}
      onBlur={handleClose}
      onFocus={handleOpen}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      ref={wrapperRef}
    >
      <button
        aria-describedby={tooltipId}
        aria-label={`How ${definition.label.toLowerCase()} is worked out`}
        className="lp-metric-definition-trigger"
        type="button"
      >
        i
      </button>
      <span
        className="lp-metric-definition-tooltip"
        data-dismissed={dismissed ? "true" : undefined}
        id={tooltipId}
        ref={tooltipRef}
        role="tooltip"
      >
        <strong>{definition.label}</strong>
        <span><b>Counts:</b> {definition.counts}</span>
        <span><b>Time:</b> {definition.timeWindow}</span>
        <span><b>Excludes:</b> {definition.excludes}</span>
      </span>
    </span>
  );
}

export function MetricFigure({ children, metricId, ...overrides }) {
  return (
    <span className="lp-defined-metric" data-metric-figure={metricId}>
      <span className="lp-defined-metric-value">{children}</span>
      <MetricDefinition metricId={metricId} {...overrides} />
    </span>
  );
}
