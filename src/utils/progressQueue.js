import { mergePracticeProgressRecords } from "./practiceCompletionRecords.js";
import {
  computeHydratedValue,
  mergeMonotonic,
  sanitizeCloudProgressPayload
} from "./progressMerge.js";

// V1 stored every pending cloud write inside one JSON array. Two tabs could
// both read that array, append independently, and let the last setItem erase
// the other tab. V2 gives every revision its own atomic localStorage key.
// Concurrent tabs may temporarily create two records for one identity, but a
// flush merges both and removes only the exact revisions it uploaded.
export const LEGACY_PROGRESS_QUEUE_KEY = "lp-progress-sync-queue-v1";
export const PROGRESS_QUEUE_ENTRY_PREFIX = "lp-progress-sync-entry-v2:";

let revisionSequence = 0;

export function progressEntryIdentity(entry) {
  return `${entry?.studentId || ""}:${entry?.area || ""}:${entry?.key || ""}`;
}

function safeParse(raw, fallback = null) {
  try {
    return JSON.parse(raw || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function storageKeys(storage) {
  const keys = [];
  if (!storage) return keys;
  try {
    for (let index = 0; index < Number(storage.length || 0); index += 1) {
      const key = storage.key(index);
      if (key) keys.push(key);
    }
  } catch { /* private-mode storage may reject reads too */ }
  return keys;
}

function readStorage(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}

function entrySignature(entry) {
  try { return JSON.stringify(entry); } catch { return ""; }
}

export function readProgressQueueRecords(storage) {
  if (!storage) return [];
  const records = [];
  for (const storageKey of storageKeys(storage)) {
    if (!storageKey.startsWith(PROGRESS_QUEUE_ENTRY_PREFIX)) continue;
    const raw = readStorage(storage, storageKey);
    const entry = safeParse(raw);
    if (!entry?.studentId || !entry.area || !entry.key) continue;
    records.push({ storageKey, legacy: false, entry, raw });
  }
  const legacy = safeParse(readStorage(storage, LEGACY_PROGRESS_QUEUE_KEY), []);
  if (Array.isArray(legacy)) {
    for (const entry of legacy) {
      if (!entry?.studentId || !entry.area || !entry.key) continue;
      records.push({
        storageKey: LEGACY_PROGRESS_QUEUE_KEY,
        legacy: true,
        signature: entrySignature(entry),
        entry
      });
    }
  }
  return records;
}

export function mergeProgressQueueEntries(existing, incoming) {
  if (!existing) {
    return {
      ...incoming,
      payload: sanitizeCloudProgressPayload(incoming.area, incoming.payload)
    };
  }
  let payload;
  if (incoming.area === "phonics_quest") {
    // Queue coalescing is chronological, unlike cloud hydration: the newest
    // local write owns routeCursor/checkpoint while achievements from the older
    // revision still union forward.
    payload = computeHydratedValue(incoming.area, incoming.key, incoming.payload, existing.payload);
  } else if (incoming.area === "learn_games") {
    payload = computeHydratedValue(incoming.area, incoming.key, existing.payload, incoming.payload);
    const latestGames = incoming.payload?.games || {};
    for (const [gameId, latest] of Object.entries(latestGames)) {
      if (!payload.games?.[gameId]) continue;
      if (latest?.checkpoints) payload.games[gameId].checkpoints = latest.checkpoints;
      else delete payload.games[gameId].checkpoints;
    }
  } else if (["el_quest", "daily_mission", "hollow"].includes(incoming.area)) {
    payload = computeHydratedValue(incoming.area, incoming.key, existing.payload, incoming.payload);
  } else if (["story_quests", "guided_reading"].includes(incoming.area)) {
    payload = mergeMonotonic(existing.payload, incoming.payload);
  } else if (["phonics_letters", "cvc"].includes(incoming.area)) {
    payload = mergePracticeProgressRecords(existing.payload, incoming.payload);
  } else {
    payload = { ...(existing.payload || {}), ...(incoming.payload || {}) };
  }
  return {
    ...existing,
    ...incoming,
    payload: sanitizeCloudProgressPayload(incoming.area, payload),
    queuedAt: existing.queuedAt || incoming.queuedAt,
    needsRecovery: Boolean(existing.needsRecovery || incoming.needsRecovery)
  };
}

export function mergeProgressQueueRecords(records = []) {
  let merged = null;
  const oldestFirst = [...records].sort((left, right) => {
    const a = String(left.entry.updatedAt || left.entry.queuedAt || "");
    const b = String(right.entry.updatedAt || right.entry.queuedAt || "");
    if (a !== b) return a < b ? -1 : 1;
    const leftRevision = String(left.entry.revision || "");
    const rightRevision = String(right.entry.revision || "");
    return leftRevision === rightRevision ? 0 : leftRevision < rightRevision ? -1 : 1;
  });
  for (const record of oldestFirst) merged = mergeProgressQueueEntries(merged, record.entry);
  return merged;
}

function newRevision() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  revisionSequence += 1;
  return `${Date.now()}-${revisionSequence}-${Math.random().toString(36).slice(2)}`;
}

export function enqueueProgressQueueEntry(storage, incoming, {
  deferred = false,
  revision = newRevision()
} = {}) {
  const identity = progressEntryIdentity(incoming);
  const previous = readProgressQueueRecords(storage)
    .filter(record => progressEntryIdentity(record.entry) === identity);
  const existing = mergeProgressQueueRecords(previous);
  const entry = {
    ...mergeProgressQueueEntries(existing, incoming),
    queuedAt: existing?.queuedAt || incoming.queuedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revision,
    needsRecovery: Boolean(
      incoming.needsRecovery
      || existing?.needsRecovery
      || deferred
      || (typeof navigator !== "undefined" && navigator.onLine === false)
    )
  };
  // Credentials are supplied by the current session only, never a retry row.
  delete entry.token;
  const storageKey = `${PROGRESS_QUEUE_ENTRY_PREFIX}${encodeURIComponent(revision)}`;
  try {
    // Write the replacement before deleting older records. A quota failure
    // therefore leaves the previous durable queue intact.
    storage.setItem(storageKey, JSON.stringify(entry));
  } catch {
    return { entry, storageKey: null, stored: false };
  }

  // Exact per-revision deletes are race-safe. Do not rewrite the shared legacy
  // array here; it is removed after a successful upload by signature.
  for (const record of previous) {
    if (!record.legacy && record.storageKey !== storageKey) {
      try { storage.removeItem(record.storageKey); } catch { /* best effort */ }
    }
  }
  return { entry, storageKey, stored: true };
}

export function removeProgressQueueRecords(storage, records = []) {
  if (!storage || !records.length) return;
  for (const record of records) {
    if (record.legacy) continue;
    try { storage.removeItem(record.storageKey); } catch { /* best effort */ }
  }

  const legacySignatures = new Set(records.filter(record => record.legacy).map(record => record.signature));
  if (!legacySignatures.size) return;
  const latestLegacy = safeParse(readStorage(storage, LEGACY_PROGRESS_QUEUE_KEY), []);
  if (!Array.isArray(latestLegacy)) return;
  const remaining = latestLegacy.filter(entry => !legacySignatures.has(entrySignature(entry)));
  try {
    if (remaining.length) storage.setItem(LEGACY_PROGRESS_QUEUE_KEY, JSON.stringify(remaining));
    else storage.removeItem(LEGACY_PROGRESS_QUEUE_KEY);
  } catch { /* best effort */ }
}

export function clearProgressQueueForStudent(storage, studentId) {
  const records = readProgressQueueRecords(storage).filter(record => record.entry.studentId === studentId);
  removeProgressQueueRecords(storage, records);
}

// Transfer old rows before removing their credential-bearing representation.
// A failed write leaves pending evidence recoverable; it never discards it.
export function migrateProgressQueueCredentials(storage) {
  if (!storage) return false;
  let migrated = true;
  const legacyRaw = readStorage(storage, LEGACY_PROGRESS_QUEUE_KEY);
  const legacy = safeParse(legacyRaw);
  if (legacyRaw && (!Array.isArray(legacy) || legacy.some(entry => !entry?.studentId || !entry.area || !entry.key))) migrated = false;
  const records = readProgressQueueRecords(storage);
  for (const record of records) {
    if (!record.legacy && !Object.hasOwn(record.entry, "token")) continue;
    const clean = { ...record.entry, revision: newRevision() };
    delete clean.token;
    const target = `${PROGRESS_QUEUE_ENTRY_PREFIX}${encodeURIComponent(clean.revision)}`;
    const encoded = JSON.stringify(clean);
    try {
      storage.setItem(target, encoded);
      if (storage.getItem(target) !== encoded) throw new Error("Queue transfer failed");
      if (!record.legacy && readStorage(storage, record.storageKey) === record.raw) {
        storage.removeItem(record.storageKey);
      }
    } catch { migrated = false; }
  }
  if (migrated && legacyRaw && readStorage(storage, LEGACY_PROGRESS_QUEUE_KEY) === legacyRaw) {
    try { storage.removeItem(LEGACY_PROGRESS_QUEUE_KEY); } catch { migrated = false; }
  }
  return migrated;
}
