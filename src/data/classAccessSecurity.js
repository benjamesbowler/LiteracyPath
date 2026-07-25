const EVENT_COPY = Object.freeze({
  code_accepted: "Class code accepted",
  code_rejected: "Class code rejected",
  code_expired: "Expired class code tried",
  rate_limited: "Abusive burst blocked",
  login_succeeded: "Learner sign-in accepted",
  login_failed: "Learner sign-in rejected",
  login_locked: "Learner sign-in lockout",
  code_regenerated: "Class code changed",
  expiry_changed: "Code expiry changed"
});

export function describeClassAccessEvent(eventType) {
  return EVENT_COPY[eventType] || "Class access event";
}

export function normalizeClassAccessSummary(payload) {
  if (!payload?.ok) return null;
  return {
    allowed: Math.max(0, Number(payload.allowed) || 0),
    denied: Math.max(0, Number(payload.denied) || 0),
    blocked: Math.max(0, Number(payload.blocked) || 0),
    anomaly: Boolean(payload.anomaly),
    latestAt: payload.latest_at || ""
  };
}

export async function loadClassAccessSummary({ client, classId }) {
  const { data, error } = await client.rpc("teacher_class_access_summary", {
    p_class_id: classId
  });
  return {
    data: error ? null : normalizeClassAccessSummary(data),
    error: error || (!data?.ok ? data?.error || "summary-unavailable" : null)
  };
}

export async function loadClassAccessLog({ client, classId, limit = 20 }) {
  const { data, error } = await client.rpc("teacher_class_access_log", {
    p_class_id: classId,
    p_limit: limit
  });
  if (error) return { data: [], error };
  return {
    data: (Array.isArray(data) ? data : []).map(row => ({
      eventType: row.event_type,
      label: describeClassAccessEvent(row.event_type),
      outcome: row.outcome,
      occurredAt: row.occurred_at,
      deviceLabel: row.device_label || "Device"
    })),
    error: null
  };
}

export async function saveClassCodeExpiry({ client, classId, expiresAt }) {
  const { data, error } = await client.rpc("teacher_set_class_code_expiry", {
    p_class_id: classId,
    p_expires_at: expiresAt || null
  });
  return {
    data: error || !data?.ok ? null : data,
    error: error || (!data?.ok ? data?.error || "expiry-save-failed" : null)
  };
}
