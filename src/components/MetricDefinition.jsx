import { useId } from "react";
import { getMetricDefinition } from "../utils/metricDefinitions.js";

export function MetricDefinition({ metricId, ...overrides }) {
  const tooltipId = useId();
  const definition = getMetricDefinition(metricId, overrides);
  if (!definition) return null;

  return (
    <span className="lp-metric-definition" data-metric-definition={metricId}>
      <button
        aria-describedby={tooltipId}
        aria-label={`How ${definition.label.toLowerCase()} is worked out`}
        className="lp-metric-definition-trigger"
        type="button"
      >
        i
      </button>
      <span className="lp-metric-definition-tooltip" id={tooltipId} role="tooltip">
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
