// Durable, account-scoped retry queue for one-shot Supabase evidence writes.
//
// Every entry is written to its own localStorage key before the network request
// starts. That gives the caller an honest durability result, avoids the
// read/append/rewrite race between browser tabs, and lets deletion remove only
// one learner's pending evidence. Entries never move to a lossy dead-letter
// bucket: a failed row remains queued until it succeeds or an authorised
// learner-lifecycle operation explicitly clears it.
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";

export const INSERT_QUEUE_ENTRY_PREFIX = "lp-insert-retry-entry-v2:";
export const LEGACY_INSERT_QUEUE_KEY = "lp-insert-retry-queue-v1";
export const LEGACY_INSERT_DEAD_LETTER_KEY = "lp-insert-dead-letter-v1";

const MAX_QUEUED_PER_ACCOUNT = 1000;
const MAX_RECORDED_ATTEMPTS = 1000;
const activeFlushes = new Map();
const activeDeliveries = new Map();
const blockedLearnerWrites = new Set();
let activeAccountId = "";
let listenersInstalled = false;

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeId(value) {
  return String(value || "").trim();
}

function storageKeys(storage) {
  const keys = [];
  if (!storage) return keys;
  try {
    for (let index = 0; index < Number(storage.length || 0); index += 1) {
      const key = storage.key(index);
      if (key) keys.push(key);
    }
  } catch {
    // Private browsing can reject reads as well as writes.
  }
  return keys;
}

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw || "") ?? fallback;
  } catch {
    return fallback;
  }
}

function getStorage(storage) {
  if (storage !== undefined) return storage;
  if (!isBrowser()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function makeEntryId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `insert-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function entryPrefix(accountId) {
  return `${INSERT_QUEUE_ENTRY_PREFIX}${encodeURIComponent(accountId)}:`;
}

function entryKey(accountId, id) {
  return `${entryPrefix(accountId)}${encodeURIComponent(id)}`;
}

function entrySignature(entry) {
  try {
    return [
      entry.table,
      entry.onConflict || "",
      JSON.stringify(entry.row)
    ].join("|");
  } catch {
    return "";
  }
}

function learnerScope(accountId, studentId) {
  const scopedAccountId = normalizeId(accountId);
  const scopedStudentId = normalizeId(studentId);
  return scopedAccountId && scopedStudentId
    ? `${scopedAccountId}:${scopedStudentId}`
    : "";
}

function learnerWritesBlocked(accountId, studentId) {
  const scope = learnerScope(accountId, studentId);
  return Boolean(scope && blockedLearnerWrites.has(scope));
}

function trackDelivery(entry, operation) {
  const token = makeEntryId();
  const tracked = Promise.resolve(operation).finally(() => {
    activeDeliveries.delete(token);
  });
  activeDeliveries.set(token, {
    accountId: entry.accountId,
    studentId: normalizeId(entry.row?.student_id),
    promise: tracked
  });
  return tracked;
}

function normalizeEntry(entry, accountId) {
  return {
    id: normalizeId(entry?.id) || makeEntryId(),
    accountId,
    table: normalizeId(entry?.table),
    row: entry?.row && typeof entry.row === "object" ? entry.row : {},
    onConflict: normalizeId(entry?.onConflict),
    queuedAt: entry?.queuedAt || entry?.at || new Date().toISOString(),
    attempts: Math.max(0, Number(entry?.attempts || 0)),
    lastError: normalizeId(entry?.lastError).slice(0, 240)
  };
}

export function readInsertQueue({ accountId, storage } = {}) {
  const scopedAccountId = normalizeId(accountId);
  const queueStorage = getStorage(storage);
  if (!scopedAccountId || !queueStorage) return [];
  const prefix = entryPrefix(scopedAccountId);
  return storageKeys(queueStorage)
    .filter(key => key.startsWith(prefix))
    .map(key => {
      const entry = safeParse(queueStorage.getItem(key), null);
      if (!entry?.table || !entry?.row) return null;
      return { key, entry: normalizeEntry(entry, scopedAccountId) };
    })
    .filter(Boolean)
    .sort((left, right) => (
      String(left.entry.queuedAt).localeCompare(String(right.entry.queuedAt))
      || left.entry.id.localeCompare(right.entry.id)
    ));
}

function removeEntry(storage, key) {
  try {
    storage?.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function writeEntry(storage, entry) {
  if (!storage) return { stored: false, key: "" };
  const key = entryKey(entry.accountId, entry.id);
  try {
    storage.setItem(key, JSON.stringify(entry));
    return { stored: true, key };
  } catch {
    return { stored: false, key: "" };
  }
}

function removeMatchingEntries(storage, accountId, signature) {
  let removed = 0;
  for (const record of readInsertQueue({ accountId, storage })) {
    if (entrySignature(record.entry) !== signature) continue;
    if (removeEntry(storage, record.key)) removed += 1;
  }
  return removed;
}

function migrateLegacyQueue(accountId, storage) {
  if (!accountId || !storage) return;
  const legacySources = [
    LEGACY_INSERT_QUEUE_KEY,
    LEGACY_INSERT_DEAD_LETTER_KEY
  ];
  for (const sourceKey of legacySources) {
    const legacy = safeParse(storage.getItem(sourceKey), []);
    if (!Array.isArray(legacy) || !legacy.length) continue;
    const remaining = [];
    for (const item of legacy) {
      const rowAccountId = normalizeId(item?.row?.teacher_id || item?.accountId);
      if (rowAccountId !== accountId) {
        remaining.push(item);
        continue;
      }
      const entry = normalizeEntry(item, accountId);
      const duplicate = readInsertQueue({ accountId, storage })
        .some(record => entrySignature(record.entry) === entrySignature(entry));
      if (!duplicate && !writeEntry(storage, entry).stored) {
        remaining.push(item);
      }
    }
    try {
      if (remaining.length) storage.setItem(sourceKey, JSON.stringify(remaining));
      else storage.removeItem(sourceKey);
    } catch {
      // Keep the old store when migration cannot be confirmed.
    }
  }
}

function accountForWrite(row, requestedAccountId) {
  return normalizeId(requestedAccountId || row?.teacher_id || activeAccountId);
}

async function tryInsert(entry, client = supabase) {
  const table = client.table(entry.table);
  const result = entry.onConflict && typeof table?.upsert === "function"
    ? await table.upsert(entry.row, { onConflict: entry.onConflict })
    : await table.insert(entry.row);
  if (result?.error) throw result.error;
}

/**
 * Save an evidence row with a write-ahead retry entry.
 *
 * `durable` means either the cloud confirmed the row or this browser confirmed
 * a scoped retry entry. Callers must not describe the evidence as saved when it
 * is false.
 */
export async function insertWithRetry(table, row, {
  accountId,
  client = supabase,
  onConflict = "",
  storage
} = {}) {
  const scopedAccountId = accountForWrite(row, accountId);
  const queueStorage = getStorage(storage);
  if (!scopedAccountId) {
    return {
      durable: false,
      cloudSaved: false,
      queued: false,
      error: new Error("An authenticated account is required before evidence can be queued.")
    };
  }
  if (learnerWritesBlocked(scopedAccountId, row?.student_id)) {
    const error = new Error("Evidence writes are blocked because this learner is being deleted.");
    error.code = "LP_LEARNER_WRITE_BLOCKED";
    return {
      durable: false,
      cloudSaved: false,
      queued: false,
      error
    };
  }

  migrateLegacyQueue(scopedAccountId, queueStorage);
  const candidate = normalizeEntry({
    table,
    row,
    onConflict,
    queuedAt: new Date().toISOString()
  }, scopedAccountId);
  const signature = entrySignature(candidate);
  const existing = readInsertQueue({ accountId: scopedAccountId, storage: queueStorage })
    .find(record => entrySignature(record.entry) === signature);

  let queueRecord = existing || null;
  if (!queueRecord) {
    const current = readInsertQueue({ accountId: scopedAccountId, storage: queueStorage });
    if (current.length < MAX_QUEUED_PER_ACCOUNT) {
      const write = writeEntry(queueStorage, candidate);
      if (write.stored) queueRecord = { key: write.key, entry: candidate };
    }
  }

  if (queueRecord) {
    // The write-ahead entry is already durable. Deliver in the background so
    // classroom interactions do not wait for a network round trip.
    void trackDelivery(candidate, tryInsert(candidate, client))
      .then(() => {
        if (queueStorage) removeMatchingEntries(queueStorage, scopedAccountId, signature);
        void flushInsertQueue({
          accountId: scopedAccountId,
          client,
          storage: queueStorage
        });
      })
      .catch(error => {
        if (
          !queueStorage
          || learnerWritesBlocked(scopedAccountId, candidate.row?.student_id)
        ) {
          return;
        }
        writeEntry(queueStorage, {
          ...queueRecord.entry,
          attempts: Math.min(
            MAX_RECORDED_ATTEMPTS,
            Number(queueRecord.entry.attempts || 0) + 1
          ),
          lastError: String(error?.message || "delivery failed").slice(0, 240)
        });
      });
    return {
      durable: true,
      cloudSaved: false,
      queued: true,
      error: null
    };
  }

  // Storage can be unavailable or full. The direct cloud write is the final
  // durability route; its result must be awaited and reported honestly.
  try {
    await trackDelivery(candidate, tryInsert(candidate, client));
    return {
      durable: true,
      cloudSaved: true,
      queued: false,
      error: null
    };
  } catch (error) {
    return {
      durable: false,
      cloudSaved: false,
      queued: false,
      error
    };
  }
}

async function flushAccountQueue(accountId, storage, client = supabase) {
  if (!isSupabaseConfigured && client === supabase) {
    return {
      flushed: 0,
      remaining: readInsertQueue({ accountId, storage }).length
    };
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { flushed: 0, remaining: readInsertQueue({ accountId, storage }).length };
  }
  let flushed = 0;
  for (const record of readInsertQueue({ accountId, storage })) {
    // Authentication can change while a long queue is draining. Stop before
    // the next row rather than presenting the previous account's evidence to
    // a newly signed-in account (RLS remains the final backstop).
    if (client === supabase && accountId !== activeAccountId) break;
    if (learnerWritesBlocked(accountId, record.entry.row?.student_id)) {
      removeEntry(storage, record.key);
      continue;
    }
    try {
      await trackDelivery(record.entry, tryInsert(record.entry, client));
      removeEntry(storage, record.key);
      flushed += 1;
    } catch (error) {
      if (learnerWritesBlocked(accountId, record.entry.row?.student_id)) {
        removeEntry(storage, record.key);
      } else {
        writeEntry(storage, {
          ...record.entry,
          attempts: Math.min(
            MAX_RECORDED_ATTEMPTS,
            Number(record.entry.attempts || 0) + 1
          ),
          lastError: String(error?.message || "delivery failed").slice(0, 240)
        });
      }
    }
  }
  return {
    flushed,
    remaining: readInsertQueue({ accountId, storage }).length
  };
}

export function flushInsertQueue({
  accountId = activeAccountId,
  client = supabase,
  storage
} = {}) {
  const scopedAccountId = normalizeId(accountId);
  const queueStorage = getStorage(storage);
  if (!scopedAccountId || !queueStorage) {
    return Promise.resolve({ flushed: 0, remaining: 0 });
  }
  migrateLegacyQueue(scopedAccountId, queueStorage);
  const active = activeFlushes.get(scopedAccountId);
  if (active) return active;
  const task = (async () => {
    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      return navigator.locks.request(
        `lp-insert-queue-flush:${scopedAccountId}`,
        { ifAvailable: true },
        async lock => (
          lock
            ? flushAccountQueue(scopedAccountId, queueStorage, client)
            : { flushed: 0, remaining: readInsertQueue({ accountId: scopedAccountId, storage: queueStorage }).length }
        )
      );
    }
    return flushAccountQueue(scopedAccountId, queueStorage, client);
  })().finally(() => {
    if (activeFlushes.get(scopedAccountId) === task) activeFlushes.delete(scopedAccountId);
  });
  activeFlushes.set(scopedAccountId, task);
  return task;
}

export function configureInsertQueueAccount(accountId) {
  activeAccountId = normalizeId(accountId);
  if (activeAccountId) void flushInsertQueue({ accountId: activeAccountId });
}

export function clearInsertQueueAccount(accountId, { storage } = {}) {
  const scopedAccountId = normalizeId(accountId);
  const queueStorage = getStorage(storage);
  if (!scopedAccountId || !queueStorage) return 0;
  let removed = 0;
  for (const record of readInsertQueue({ accountId: scopedAccountId, storage: queueStorage })) {
    if (removeEntry(queueStorage, record.key)) removed += 1;
  }
  if (activeAccountId === scopedAccountId) activeAccountId = "";
  return removed;
}

export function clearInsertQueueForStudent({
  accountId,
  blockFutureWrites = true,
  studentId,
  storage
} = {}) {
  const scopedAccountId = normalizeId(accountId);
  const scopedStudentId = normalizeId(studentId);
  const queueStorage = getStorage(storage);
  if (!scopedAccountId || !scopedStudentId || !queueStorage) return 0;
  if (blockFutureWrites) {
    blockedLearnerWrites.add(learnerScope(scopedAccountId, scopedStudentId));
  }
  migrateLegacyQueue(scopedAccountId, queueStorage);
  let removed = 0;
  for (const record of readInsertQueue({ accountId: scopedAccountId, storage: queueStorage })) {
    if (normalizeId(record.entry.row?.student_id) !== scopedStudentId) continue;
    if (removeEntry(queueStorage, record.key)) removed += 1;
  }
  return removed;
}

export async function clearAndVerifyInsertQueueForStudent({
  accountId,
  studentId,
  storage
} = {}) {
  const scopedAccountId = normalizeId(accountId);
  const scopedStudentId = normalizeId(studentId);
  const queueStorage = getStorage(storage);
  if (!scopedAccountId || !scopedStudentId || !queueStorage) {
    const error = new Error("The queued evidence store is unavailable for privacy cleanup.");
    error.code = "LP_INSERT_QUEUE_CLEANUP_INCOMPLETE";
    throw error;
  }

  let removed = clearInsertQueueForStudent({
    accountId: scopedAccountId,
    studentId: scopedStudentId,
    storage: queueStorage
  });
  const deliveries = [...activeDeliveries.values()]
    .filter(delivery => (
      delivery.accountId === scopedAccountId
      && delivery.studentId === scopedStudentId
    ))
    .map(delivery => delivery.promise);
  if (deliveries.length) await Promise.allSettled(deliveries);

  removed += clearInsertQueueForStudent({
    accountId: scopedAccountId,
    studentId: scopedStudentId,
    storage: queueStorage
  });
  const residual = readInsertQueue({
    accountId: scopedAccountId,
    storage: queueStorage
  }).filter(record => (
    normalizeId(record.entry.row?.student_id) === scopedStudentId
  ));
  if (residual.length) {
    const error = new Error("Queued learner evidence could not be cleared and verified.");
    error.code = "LP_INSERT_QUEUE_CLEANUP_INCOMPLETE";
    error.residualCount = residual.length;
    throw error;
  }
  return { removed, residualCount: 0 };
}

function flushActiveAccount() {
  if (activeAccountId) void flushInsertQueue({ accountId: activeAccountId });
}

// Wire up automatic draining once. Only the currently authenticated account is
// ever flushed; a different account's rows remain isolated until that account
// signs in again.
export function startInsertQueueFlusher() {
  if (!isBrowser() || listenersInstalled) return;
  listenersInstalled = true;
  window.addEventListener("online", flushActiveAccount);
  window.addEventListener("focus", flushActiveAccount);
  flushActiveAccount();
}
