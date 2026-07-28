export const ENGAGEMENT_QUEUE_ENTRY_PREFIX = "lp-engagement-event:v1:";
export const ENGAGEMENT_HEALTH_PREFIX = "lp-engagement-health:v1:";
export const ENGAGEMENT_DEVICE_ID_KEY = "lp-engagement-device:v1";

export const ENGAGEMENT_RETRY_POLICY = Object.freeze({
  baseDelayMs: 2_000,
  maximumDelayMs: 5 * 60_000
});

let volatileDeviceId = "";

function isoNow(now) {
  const value = typeof now === "function" ? now() : now;
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function timestamp(value) {
  const result = new Date(value || "").getTime();
  return Number.isFinite(result) ? result : 0;
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function storageKeys(storage) {
  try {
    const keys = [];
    for (let index = 0; index < Number(storage?.length || 0); index += 1) {
      const key = storage.key(index);
      if (key) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}

function safeWrite(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function engagementRetryDelay(attempts) {
  const exponent = Math.max(0, Number(attempts || 1) - 1);
  return Math.min(
    ENGAGEMENT_RETRY_POLICY.maximumDelayMs,
    ENGAGEMENT_RETRY_POLICY.baseDelayMs * (2 ** exponent)
  );
}

export function readEngagementQueue(storage, studentId = "") {
  return storageKeys(storage)
    .filter(key => key.startsWith(ENGAGEMENT_QUEUE_ENTRY_PREFIX))
    .map(key => {
      try {
        const event = JSON.parse(storage.getItem(key) || "null");
        return event?.id && event?.studentId ? { key, event } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter(record => !studentId || record.event.studentId === studentId)
    .sort((left, right) => (
      timestamp(left.event.queuedAt) - timestamp(right.event.queuedAt)
      || left.event.id.localeCompare(right.event.id)
    ));
}

export function clearEngagementDataForStudent(storage, studentId) {
  const scopedStudentId = String(studentId || "").trim();
  if (!storage || !scopedStudentId) return { events: 0, health: false };
  let events = 0;
  for (const record of readEngagementQueue(storage, scopedStudentId)) {
    try {
      storage.removeItem(record.key);
      events += 1;
    } catch {
      // The caller verifies residual local data separately.
    }
  }
  let health = false;
  try {
    storage.removeItem(`${ENGAGEMENT_HEALTH_PREFIX}${scopedStudentId}`);
    health = true;
  } catch {
    // Best effort; the caller can report a local-cleanup failure.
  }
  return { events, health };
}

export function enqueueEngagementEvent(
  storage,
  {
    id = randomId(),
    studentId,
    area,
    itemId = null,
    event = "done",
    payload = null,
    occurredAt = ""
  },
  { now = Date.now } = {}
) {
  const queuedAt = isoNow(now);
  const entry = {
    id: String(id),
    studentId: String(studentId || ""),
    area: String(area || ""),
    itemId: itemId === null || itemId === undefined ? null : String(itemId),
    event: String(event || "done"),
    payload,
    occurredAt: occurredAt || queuedAt,
    queuedAt,
    attempts: 0,
    nextAttemptAt: queuedAt,
    lastError: ""
  };
  if (!entry.studentId || !entry.area || !entry.event) {
    throw new TypeError("Engagement events require studentId, area, and event.");
  }
  return {
    event: entry,
    stored: safeWrite(storage, `${ENGAGEMENT_QUEUE_ENTRY_PREFIX}${entry.id}`, entry)
  };
}

export async function flushEngagementQueue({
  storage,
  studentId,
  send,
  now = Date.now,
  force = false
}) {
  const nowIso = isoNow(now);
  const nowMs = timestamp(nowIso);
  let delivered = 0;
  let recovered = 0;
  let failed = 0;
  let storageFailures = 0;
  let storageFailureRetryAt = "";

  for (const record of readEngagementQueue(storage, studentId)) {
    if (!force && timestamp(record.event.nextAttemptAt) > nowMs) continue;
    try {
      await send(record.event);
      storage.removeItem(record.key);
      delivered += 1;
      if (record.event.attempts > 0) recovered += 1;
    } catch (error) {
      failed += 1;
      const attempts = Number(record.event.attempts || 0) + 1;
      const retry = {
        ...record.event,
        attempts,
        nextAttemptAt: new Date(nowMs + engagementRetryDelay(attempts)).toISOString(),
        lastError: String(error?.message || "delivery failed").slice(0, 160)
      };
      if (!safeWrite(storage, record.key, retry)) {
        storageFailures += 1;
        storageFailureRetryAt = !storageFailureRetryAt
          || retry.nextAttemptAt < storageFailureRetryAt
          ? retry.nextAttemptAt
          : storageFailureRetryAt;
      }
    }
  }

  const pendingRecords = readEngagementQueue(storage, studentId);
  return {
    attemptedDelivery: delivered + failed,
    delivered,
    recovered,
    failed,
    storageFailures,
    pending: pendingRecords.length,
    oldestPendingAt: pendingRecords[0]?.event.queuedAt || "",
    nextAttemptAt: storageFailureRetryAt || pendingRecords
      .map(record => record.event.nextAttemptAt)
      .filter(Boolean)
      .sort()[0] || ""
  };
}

function readHealth(storage, studentId) {
  try {
    return JSON.parse(
      storage.getItem(`${ENGAGEMENT_HEALTH_PREFIX}${studentId}`) || "null"
    ) || {};
  } catch {
    return {};
  }
}

export function engagementDeviceId(storage) {
  if (volatileDeviceId) return volatileDeviceId;
  try {
    const existing = storage.getItem(ENGAGEMENT_DEVICE_ID_KEY);
    if (existing) return existing;
    const id = randomId();
    storage.setItem(ENGAGEMENT_DEVICE_ID_KEY, id);
    return id;
  } catch {
    volatileDeviceId = randomId();
    return volatileDeviceId;
  }
}

export function updateEngagementHealth(
  storage,
  studentId,
  {
    attempted = 0,
    delivered = 0,
    recovered = 0,
    storageFailures = 0
  } = {},
  { now = Date.now } = {}
) {
  const current = readHealth(storage, studentId);
  const next = {
    attempted: Number(current.attempted || 0) + attempted,
    delivered: Number(current.delivered || 0) + delivered,
    recovered: Number(current.recovered || 0) + recovered,
    storageFailures: Number(current.storageFailures || 0) + storageFailures,
    updatedAt: isoNow(now)
  };
  const stored = safeWrite(storage, `${ENGAGEMENT_HEALTH_PREFIX}${studentId}`, next);
  return { ...next, stored };
}

export function buildEngagementHealthSnapshot(
  storage,
  studentId,
  {
    volatileAttempted = 0,
    volatileDelivered = 0,
    volatileRecovered = 0,
    volatileStorageFailures = 0,
    volatilePending = 0,
    volatileOldestPendingAt = ""
  } = {}
) {
  const health = readHealth(storage, studentId);
  const pendingRecords = readEngagementQueue(storage, studentId);
  const attempted = Math.max(
    0,
    Number(health.attempted || 0) + Number(volatileAttempted || 0)
  );
  const delivered = Math.max(
    0,
    Number(health.delivered || 0) + Number(volatileDelivered || 0)
  );
  const pending = pendingRecords.length + Math.max(0, Number(volatilePending || 0));
  const lost = Math.max(0, attempted - delivered - pending);
  return {
    deviceId: engagementDeviceId(storage),
    attempted,
    delivered,
    recovered: Math.max(
      0,
      Number(health.recovered || 0) + Number(volatileRecovered || 0)
    ),
    storageFailures: Math.max(
      0,
      Number(health.storageFailures || 0) + Number(volatileStorageFailures || 0)
    ),
    pending,
    lost,
    lossRate: attempted > 0 ? lost / attempted : 0,
    oldestPendingAt: [
      pendingRecords[0]?.event.queuedAt,
      volatileOldestPendingAt
    ].filter(Boolean).sort()[0] || "",
    updatedAt: health.updatedAt || ""
  };
}
