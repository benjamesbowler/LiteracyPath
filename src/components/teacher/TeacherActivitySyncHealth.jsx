import { useEffect, useState } from "react";

import {
  ACTIVITY_SYNC_HEALTH_POLICY,
  buildClassActivitySyncHealth,
  loadClassActivitySyncHealth
} from "../../utils/activitySyncHealth.js";

export function TeacherActivitySyncHealth({
  supabase,
  classId,
  className = "",
  seedRows = null,
  now
}) {
  const [loadResult, setLoadResult] = useState({
    classId: "",
    state: "idle",
    rows: []
  });

  useEffect(() => {
    let active = true;
    if (seedRows !== null || !supabase || !classId) {
      return () => {
        active = false;
      };
    }
    void loadClassActivitySyncHealth(supabase, classId).then(rows => {
      if (!active) return;
      setLoadResult({ classId, state: "ready", rows });
    }).catch(error => {
      if (!active) return;
      console.error("Load activity sync health error:", error);
      setLoadResult({ classId, state: "error", rows: [] });
    });
    return () => {
      active = false;
    };
  }, [classId, seedRows, supabase]);

  const rows = seedRows !== null
    ? seedRows
    : loadResult.classId === classId
      ? loadResult.rows
      : [];
  const health = buildClassActivitySyncHealth(rows, { now: now || new Date() });
  const state = seedRows !== null
    ? "ready"
    : !supabase
      ? "error"
      : loadResult.classId === classId
        ? loadResult.state
        : "loading";

  return (
    <section
      className={`teacher-sync-health is-${health.status}`}
      aria-label="Learning event sync health"
      data-sync-health-status={health.status}
      data-sync-health-policy={health.policyId}
      data-sync-health-version={health.policyVersion}
    >
      <header>
        <div>
          <p className="panel-label">Evidence delivery</p>
          <h3>Learning event sync health</h3>
          <p>
            {className || "Selected class"} · cumulative delivery from devices seen in the last
            {" "}{ACTIVITY_SYNC_HEALTH_POLICY.activeSnapshotDays} days
          </p>
        </div>
        <strong role={health.status === "alert" ? "alert" : "status"}>
          {state === "loading"
            ? "Checking sync"
            : state === "error"
              ? "Sync health unavailable"
              : health.statusLabel}
        </strong>
      </header>

      {state === "error" ? (
        <p>
          Health telemetry could not be loaded. Learner evidence is unchanged; retry when the
          connection returns.
        </p>
      ) : (
        <>
          <dl>
            <div>
              <dt>Delivered</dt>
              <dd>{health.delivered} of {health.attempted}</dd>
            </div>
            <div>
              <dt>Waiting to retry</dt>
              <dd>{health.pending}</dd>
            </div>
            <div>
              <dt>Recovered after retry</dt>
              <dd>{health.recovered}</dd>
            </div>
            <div>
              <dt>Potentially lost</dt>
              <dd>{health.lost} · {health.lossRatePercent}%</dd>
            </div>
          </dl>
          <p className="teacher-sync-health-explanation">
            {health.status === "alert"
              ? `Potential loss exceeds the ${ACTIVITY_SYNC_HEALTH_POLICY.lossRateAlertThreshold * 100}% alert threshold. Check shared-device storage and connectivity.`
              : health.status === "delayed"
                ? `Queued events are still durable, but the oldest has waited ${Math.floor(health.pendingAgeHours)} hours.`
                : health.status === "healthy"
                  ? "Queued failures retry automatically; pending events are not counted as lost."
                  : "No recent device telemetry is available yet. This is not evidence of zero activity."}
          </p>
          {health.storageFailures > 0 && (
            <p className="teacher-sync-health-storage" role="alert">
              {health.storageFailures} local storage failure
              {health.storageFailures === 1 ? "" : "s"} recorded. These events are treated as
              potentially lost until delivery is confirmed.
            </p>
          )}
        </>
      )}
    </section>
  );
}
