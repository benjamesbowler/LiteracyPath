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
        aria-label={`${definition.label} definition`}
        className="lp-metric-definition-trigger"
        type="button"
      >
        i
      </button>
      <span className="lp-metric-definition-tooltip" id={tooltipId} role="tooltip">
        <strong>{definition.label}</strong>
        <span>{definition.definition}</span>
        <span><b>Denominator:</b> {definition.denominator}</span>
        <span><b>Date range:</b> {definition.dateRange}</span>
        <span><b>Minimum evidence:</b> {definition.minimumEvidence}</span>
        <span><b>Updated:</b> {definition.updateTime}</span>
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
