export const CUE_DELIVERY_STATUSES = Object.freeze([
  "unavailable", "loading", "started", "completed", "interrupted", "failed"
]);

const STATUS_SET = new Set(CUE_DELIVERY_STATUSES);
const LEGAL_TRANSITIONS = Object.freeze({
  unavailable: new Set(["loading"]),
  loading: new Set(["started", "interrupted", "failed"]),
  started: new Set(["started", "completed", "interrupted", "failed"]),
  completed: new Set(),
  interrupted: new Set(),
  failed: new Set()
});

function timestamp(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function createAudioDelivery(id) {
  return Object.freeze({
    id: String(id || ""),
    status: "unavailable",
    session: null,
    startedAt: null,
    completedAt: null
  });
}

export function reduceAudioDelivery(state, event = {}) {
  const current = state && typeof state === "object" ? state : createAudioDelivery(event.id);
  if (String(event.id || "") !== current.id || !STATUS_SET.has(event.type)) return current;
  const session = Number(event.session);
  if (!Number.isInteger(session) || session < 1) return current;
  if (event.type === "loading") {
    if (!LEGAL_TRANSITIONS[current.status].has(event.type)) return current;
  } else if (current.session !== session || !LEGAL_TRANSITIONS[current.status].has(event.type)) return current;
  const at = timestamp(event.at);
  const startedAt = event.type === "started" ? at ?? current.startedAt : current.startedAt;
  const completedAt = event.type === "completed" ? at ?? current.completedAt : current.completedAt;
  return Object.freeze({
    id: current.id,
    status: event.type,
    session,
    startedAt,
    completedAt
  });
}
