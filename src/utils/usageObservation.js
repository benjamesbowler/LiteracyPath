// Observed interaction only. Timing and extra presses never establish guessing,
// attention, proficiency or an independent learning outcome.
export const USAGE_COLLECTION_VERSION = 2;
const pressReasons = new Set(["answer_locked", "answer_pending", "images_pending", "images_loading", "pictures_loading", "media_unavailable", "media_pending", "feedback_pending", "paused"]);
const readyTimes = new Map();
const now = () => globalThis.performance?.now?.() ?? Date.now();
const keyFor = (scope, item) => `${scope || ""}:${item || ""}`;

export function markUsageItemReady(scope, item, ready = true) {
  const key = keyFor(scope, item);
  if (!scope || !item) return;
  if (!ready) { readyTimes.delete(key); return; }
  const started = !readyTimes.has(key);
  if (started) readyTimes.set(key, now());
  // This is an in-memory timer, never a retained learner record.
  if (readyTimes.size > 100) readyTimes.delete(readyTimes.keys().next().value);
  return started;
}
export function usageResponseTime(scope, item) {
  const start = readyTimes.get(keyFor(scope, item));
  return Number.isFinite(start) ? Math.max(0, Math.round(now() - start)) : null;
}
export function clearUsageItem(scope, item) { readyTimes.delete(keyFor(scope, item)); }

export function versionUsagePayload(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const interactionReason = payload.interactionReason || payload.interactionState || payload.reason;
    return { ...payload, collectionVersion: payload.collectionVersion ?? USAGE_COLLECTION_VERSION,
      ...(pressReasons.has(interactionReason) ? { interactionReason } : {}) };
  }
  // Preserve existing primitive payloads: wrapping them would change legacy
  // readers. Only an object with actual new observations receives v2 fields.
  return payload;
}
