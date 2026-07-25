import { useEffect, useMemo, useState } from "react";
import { loadTeacherGrowthHistory } from "../../data/teacherGrowthHistory.js";
import {
  GROWTH_METRICS,
  buildTeacherGrowthSeries
} from "../../utils/teacherGrowthSeries.js";
import { TeacherChart } from "./ui/TeacherPrimitives.jsx";

function changeLabel(series) {
  if (series.change === null) return "One observed point";
  const direction = series.change > 0 ? "+" : "";
  return `${direction}${series.change} ${series.unit === "response" ? "points" : series.unit} from first to latest`;
}

function chartLabel(learnerName, series, markers) {
  const points = series.points.length
    ? series.points.map(point => `${point.dateLabel}: ${point.valueLabel}`).join(". ")
    : "No saved points.";
  const versions = markers.length
    ? `Curriculum versions: ${markers.map(marker => `${marker.label} from ${marker.dateLabel}`).join("; ")}.`
    : "No curriculum version was recorded.";
  return `${learnerName} ${series.label} over time. ${points} ${versions}`;
}

function axisVersionLabel(value) {
  return `v${String(value || "").replace(/^LP-CURRICULUM-/i, "")}`;
}

function GrowthPlot({ learnerName, model, series }) {
  const pointString = series.points.map(point => `${point.x},${point.y}`).join(" ");
  return (
    <TeacherChart
      className="teacher-growth-chart"
      label={chartLabel(learnerName, series, model.markers)}
    >
      <div className="teacher-growth-y-axis" aria-hidden="true">
        <span>{series.yMax}{series.unit === "%" ? "%" : ""}</span>
        <span>0{series.unit === "%" ? "%" : ""}</span>
      </div>
      <div className="teacher-growth-plot">
        <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
          <line className="teacher-growth-grid-line" x1="0" x2="100" y1="0" y2="0" />
          <line className="teacher-growth-grid-line" x1="0" x2="100" y1="50" y2="50" />
          <line className="teacher-growth-grid-line" x1="0" x2="100" y1="100" y2="100" />
          {series.points.length > 1 && (
            <polyline className="teacher-growth-line" points={pointString} />
          )}
          {series.points.map(point => (
            <circle
              className="teacher-growth-point"
              cx={point.x}
              cy={point.y}
              key={`${point.date}-${point.value}`}
              r="2.1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="teacher-growth-version-layer" aria-label="Curriculum versions on growth axis">
          {model.markers.map((marker, index) => (
            <div
              className={`teacher-growth-version-marker is-row-${index % 2}`}
              data-curriculum-version={marker.label}
              key={marker.id}
              style={{ "--growth-version-x": `${marker.x}%` }}
            >
              <span title={marker.label}>{axisVersionLabel(marker.label)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="teacher-growth-x-axis" aria-hidden="true">
        <span>{model.domain.start}</span>
        <span>{model.domain.end}</span>
      </div>
    </TeacherChart>
  );
}

export function TeacherGrowthChart({
  supabase,
  teacherId,
  classId,
  learnerId,
  learnerName,
  history = null
}) {
  const requestKey = [teacherId, classId, learnerId].filter(Boolean).join(":");
  const [loadResult, setLoadResult] = useState({
    key: "",
    state: "idle",
    history: null
  });
  const [selectedMetricId, setSelectedMetricId] = useState(GROWTH_METRICS[0].id);

  useEffect(() => {
    let active = true;
    if (history || !supabase || !teacherId || !classId || !learnerId) {
      return () => {
        active = false;
      };
    }
    void loadTeacherGrowthHistory({
      supabase,
      teacherId,
      classId,
      studentId: learnerId
    }).then(result => {
      if (!active) return;
      setLoadResult({
        key: requestKey,
        state: "ready",
        history: result
      });
    }).catch(error => {
      if (!active) return;
      console.error("Load learner growth history error:", error);
      setLoadResult({
        key: requestKey,
        state: "error",
        history: null
      });
    });
    return () => {
      active = false;
    };
  }, [classId, history, learnerId, requestKey, supabase, teacherId]);

  const state = history
    ? "ready"
    : !requestKey || !supabase
      ? "idle"
      : loadResult.key === requestKey
        ? loadResult.state
        : "loading";
  const model = useMemo(
    () => buildTeacherGrowthSeries(
      history
      || (loadResult.key === requestKey ? loadResult.history : null)
      || {}
    ),
    [history, loadResult.history, loadResult.key, requestKey]
  );
  const selectedSeries = model.series.find(series => series.id === selectedMetricId)
    || model.series[0];

  return (
    <section
      className="teacher-growth"
      aria-label={`Child growth over time: ${learnerName}`}
      data-growth-state={state}
      data-growth-attempt-count={model.attemptCount}
    >
      <div className="teacher-growth-heading">
        <div>
          <p className="panel-label">Saved results over time</p>
          <h4>Growth over time</h4>
          <p>
            Five results views share one dated axis. Curriculum changes remain visible so unlike
            versions are never silently blended.
          </p>
        </div>
        {state === "ready" && (
          <span role="status">
            {model.attemptCount} completed attempts · {model.interventionCount} intervention reviews
          </span>
        )}
      </div>

      {state === "loading" ? (
        <div className="teacher-growth-state" role="status">
          <strong>Loading dated results…</strong>
          <p>Current child results remain available above.</p>
        </div>
      ) : state === "error" ? (
        <div className="teacher-growth-state is-error" role="alert">
          <strong>Growth history could not be loaded.</strong>
          <p>No trend is shown. Current results remain unchanged.</p>
        </div>
      ) : state === "ready" ? (
        <>
          <div className="teacher-growth-metric-picker" aria-label="Choose growth results">
            {model.series.map(series => (
              <button
                aria-pressed={series.id === selectedSeries.id}
                className="teacher-growth-metric-button"
                key={series.id}
                onClick={() => setSelectedMetricId(series.id)}
                type="button"
              >
                <span>{series.shortLabel}</span>
                <strong>{series.current}</strong>
              </button>
            ))}
          </div>

          <article
            className="teacher-growth-view"
            data-growth-metric={selectedSeries.id}
            data-growth-point-count={selectedSeries.points.length}
          >
            <div className="teacher-growth-view-heading">
              <div>
                <h5>{selectedSeries.label}</h5>
                <p>{selectedSeries.description}</p>
              </div>
              <strong>{changeLabel(selectedSeries)}</strong>
            </div>
            {selectedSeries.points.length ? (
              <>
                <GrowthPlot learnerName={learnerName} model={model} series={selectedSeries} />
                <details className="teacher-growth-data">
                  <summary>Review {selectedSeries.points.length} dated data points</summary>
                  <table>
                    <caption>{learnerName} · {selectedSeries.label}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Value</th>
                        <th scope="col">Result records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSeries.points.map(point => (
                        <tr key={`${point.date}-${point.value}`}>
                          <td>{point.dateLabel}</td>
                          <td>{point.valueLabel}</td>
                          <td>{point.evidenceCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </>
            ) : (
              <div className="teacher-growth-state">
                <strong>No saved {selectedSeries.label.toLowerCase()} history.</strong>
                <p>This view stays empty until dated results are saved.</p>
              </div>
            )}
          </article>
        </>
      ) : (
        <div className="teacher-growth-state">
          <strong>Choose a child to inspect growth.</strong>
        </div>
      )}
    </section>
  );
}
