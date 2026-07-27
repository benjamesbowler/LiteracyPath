import { useEffect, useState } from "react";

import {
  ACTIVITY_SYNC_HEALTH_POLICY,
  buildClassActivitySyncHealth,
  loadClassActivitySyncHealth
} from "../../utils/activitySyncHealth.js";
import { TEACHER_COPY, countPhrase, progressPhrase } from "../../copy/teacherCopy.js";

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
      aria-label={TEACHER_COPY.sync.ariaLabel}
      data-sync-health-status={health.status}
      data-sync-health-policy={health.policyId}
      data-sync-health-version={health.policyVersion}
    >
      <header>
        <div>
          <p className="panel-label">{TEACHER_COPY.sync.label}</p>
          <h3>{TEACHER_COPY.sync.title}</h3>
          <p>
            {className || "Selected class"} · {TEACHER_COPY.sync.range(ACTIVITY_SYNC_HEALTH_POLICY.activeSnapshotDays)}
          </p>
        </div>
        <strong role={health.status === "alert" ? "alert" : "status"}>
          {state === "loading"
            ? TEACHER_COPY.sync.checking
            : state === "error"
              ? TEACHER_COPY.sync.unavailable
              : health.statusLabel}
        </strong>
      </header>

      {/* Nothing has been counted yet while the check is running, and "Saved 0 of 0"
          under a "Checking" header reads as a confirmed zero - the one thing the
          state matrix says this panel must never do. The counts wait for real
          numbers. */}
      {state === "loading" ? (
        <p>Checking whether results are reaching your dashboard.</p>
      ) : state === "error" ? (
        <p>{TEACHER_COPY.sync.error}</p>
      ) : (
        <>
          <dl>
            <div>
              <dt>{TEACHER_COPY.sync.delivered}</dt>
              <dd>{progressPhrase(health.delivered, health.attempted)}</dd>
            </div>
            <div>
              <dt>{TEACHER_COPY.sync.pending}</dt>
              <dd>{health.pending}</dd>
            </div>
            <div>
              <dt>{TEACHER_COPY.sync.recovered}</dt>
              <dd>{health.recovered}</dd>
            </div>
            <div>
              <dt>{TEACHER_COPY.sync.possibleLoss}</dt>
              <dd>{health.lost}</dd>
            </div>
          </dl>
          <p className="teacher-sync-health-explanation">
            {health.status === "alert"
              ? TEACHER_COPY.sync.alert
              : health.status === "delayed"
                ? TEACHER_COPY.sync.delayed(Math.floor(health.pendingAgeHours))
                : health.status === "healthy"
                  ? TEACHER_COPY.sync.healthy
                  : TEACHER_COPY.sync.noRecentData}
          </p>
          {health.storageFailures > 0 && (
            <p className="teacher-sync-health-storage" role="alert">
              {countPhrase(health.storageFailures, "result may", "results may")} not be saved yet.
              Check the shared device and its internet connection.
            </p>
          )}
        </>
      )}
    </section>
  );
}
