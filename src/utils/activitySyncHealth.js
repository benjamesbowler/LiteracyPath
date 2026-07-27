export const ACTIVITY_SYNC_HEALTH_POLICY = Object.freeze({
  id: "activity-sync-health",
  version: "2026.07.24-a4.7",
  lossRateAlertThreshold: 0.01,
  stalePendingHours: 1,
  activeSnapshotDays: 7
});

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function validTime(value) {
  const time = new Date(value || "").getTime();
  return Number.isFinite(time) ? time : null;
}

export function buildClassActivitySyncHealth(
  rows = [],
  { now = new Date(), policy = ACTIVITY_SYNC_HEALTH_POLICY } = {}
) {
  const nowMs = validTime(now) ?? Date.now();
  const activeRows = rows.filter(row => {
    const observedAt = validTime(row.observed_at || row.observedAt);
    return observedAt !== null
      && nowMs - observedAt <= policy.activeSnapshotDays * DAY_MS;
  });
  const totals = activeRows.reduce((result, row) => ({
    attempted: result.attempted + safeNumber(row.attempted),
    delivered: result.delivered + safeNumber(row.delivered),
    recovered: result.recovered + safeNumber(row.recovered),
    storageFailures: result.storageFailures + safeNumber(row.storage_failures ?? row.storageFailures),
    pending: result.pending + safeNumber(row.pending),
    lost: result.lost + safeNumber(row.lost)
  }), {
    attempted: 0,
    delivered: 0,
    recovered: 0,
    storageFailures: 0,
    pending: 0,
    lost: 0
  });
  const oldestPendingAt = activeRows
    .map(row => row.oldest_pending_at || row.oldestPendingAt)
    .filter(Boolean)
    .sort()[0] || "";
  const oldestPendingMs = validTime(oldestPendingAt);
  const pendingAgeHours = oldestPendingMs === null
    ? 0
    : Math.max(0, (nowMs - oldestPendingMs) / HOUR_MS);
  const lossRate = totals.attempted > 0 ? totals.lost / totals.attempted : 0;
  const alert = lossRate > policy.lossRateAlertThreshold;
  const delayed = totals.pending > 0 && pendingAgeHours >= policy.stalePendingHours;

  return {
    policyId: policy.id,
    policyVersion: policy.version,
    ...totals,
    lossRate,
    lossRatePercent: Math.round(lossRate * 10_000) / 100,
    oldestPendingAt,
    pendingAgeHours,
    snapshotCount: activeRows.length,
    excludedStaleSnapshotCount: rows.length - activeRows.length,
    status: alert
      ? "alert"
      : delayed
        ? "delayed"
        : totals.attempted > 0
          ? "healthy"
          : "no-data",
    statusLabel: alert
      ? "Sync loss alert"
      : delayed
        ? "Sync delayed"
        : totals.attempted > 0
          ? "Sync healthy"
          : "No sync telemetry"
  };
}

export async function loadClassActivitySyncHealth(supabase, classId) {
  if (!supabase || !classId) return [];
  const { data, error } = await supabase
    .table("activity_sync_health")
    .select(
      "student_id,device_id,attempted,delivered,recovered,storage_failures,"
      + "pending,lost,oldest_pending_at,observed_at"
    )
    .eq("class_id", classId);
  if (error) throw error;
  return data || [];
}
