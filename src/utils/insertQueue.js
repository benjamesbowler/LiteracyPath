// Durable retry queue for one-shot Supabase inserts (assessment answers and
// mastery rows). Previously these were fire-and-forget: a flaky network silently
// lost a teacher's record. Now a failed insert is queued in localStorage and
// retried when connectivity returns (on reconnect, focus, or the next save).
//
// The flush is deliberately incremental: every mutation re-reads the queue and
// touches only the item being processed. A stale full-array rewrite here used
// to (a) clobber rows queued while a slow flush was mid-loop and (b) replay
// already-succeeded inserts if the tab closed before the final write.
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";

const QUEUE_KEY = "lp-insert-retry-queue-v1";
const DEAD_LETTER_KEY = "lp-insert-dead-letter-v1";
const MAX_QUEUED = 300;
const MAX_ATTEMPTS = 6; // after this, park the row in the dead-letter store instead of retrying forever
let flushing = false;

// Signature for dedup: identical table+row shouldn't be queued twice (double-taps).
function sig(item) { return item.table + "|" + JSON.stringify(item.row); }

function isBrowser() { return typeof window !== "undefined"; }

function readQueue() {
  if (!isBrowser()) return [];
  try { return JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]"); }
  catch { return []; }
}

function writeQueue(queue) {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUED))); }
  catch { /* storage full / unavailable - best effort */ }
}

function removeFromQueue(itemSig) {
  writeQueue(readQueue().filter(q => sig(q) !== itemSig));
}

// A row that exhausted its retries is parked, not deleted: it stays inspectable
// in localStorage and the failure is loud in the console.
function moveToDeadLetter(item) {
  console.error(
    `[LiteracyPath] insert into "${item.table}" permanently failed after ${item.attempts} attempts; ` +
    `parked in ${DEAD_LETTER_KEY} instead of being silently dropped.`,
    item
  );
  if (!isBrowser()) return;
  try {
    const dead = JSON.parse(window.localStorage.getItem(DEAD_LETTER_KEY) || "[]");
    dead.push(item);
    window.localStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(dead.slice(-MAX_QUEUED)));
  } catch { /* best effort */ }
}

function bumpAttempts(itemSig) {
  const next = [];
  for (const q of readQueue()) {
    if (sig(q) !== itemSig) { next.push(q); continue; }
    const attempts = (q.attempts || 0) + 1;
    if (attempts < MAX_ATTEMPTS) next.push({ ...q, attempts });
    else moveToDeadLetter({ ...q, attempts });
  }
  writeQueue(next);
}

async function tryInsert(table, row) {
  const { error } = await supabase.table(table).insert(row);
  if (error) throw error;
}

// Insert now; if it fails, queue it for later. Never throws.
export async function insertWithRetry(table, row) {
  try {
    await tryInsert(table, row);
    void flushInsertQueue();
    return true;
  } catch {
    const queue = readQueue();
    const item = { table, row, at: new Date().toISOString(), attempts: 0 };
    if (!queue.some(q => sig(q) === sig(item))) queue.push(item); // dedup identical rows
    writeQueue(queue);
    return false;
  }
}

async function flushInsertQueueUncoordinated() {
  if (flushing) return;
  // Don't burn retry attempts when they cannot possibly succeed: the
  // unconfigured mock client rejects every write, and offline focus events
  // used to exhaust MAX_ATTEMPTS before anyone fixed the network/env.
  if (!isSupabaseConfigured) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  flushing = true;
  try {
    for (const item of readQueue()) {
      const itemSig = sig(item);
      // Re-check membership: another tab may have flushed this row already.
      if (!readQueue().some(q => sig(q) === itemSig)) continue;
      try {
        await tryInsert(item.table, item.row);
        removeFromQueue(itemSig); // remove immediately so a mid-flush crash can't replay it
      } catch {
        bumpAttempts(itemSig);
      }
    }
  } finally {
    flushing = false;
  }
}

// Retry everything queued; keep whatever still fails. Cross-tab coordination
// via Web Locks where available so two tabs don't double-insert the same rows.
export async function flushInsertQueue() {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("lp-insert-queue-flush", { ifAvailable: true }, async lock => {
      if (!lock) return; // another tab is flushing
      await flushInsertQueueUncoordinated();
    });
  }
  return flushInsertQueueUncoordinated();
}

// Wire up automatic draining (call once on app start).
export function startInsertQueueFlusher() {
  if (!isBrowser()) return;
  void flushInsertQueue();
  window.addEventListener("online", () => { void flushInsertQueue(); });
  window.addEventListener("focus", () => { void flushInsertQueue(); });
}
