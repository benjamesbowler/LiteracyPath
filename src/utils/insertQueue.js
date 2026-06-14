// Durable retry queue for one-shot Supabase inserts (assessment answers and
// mastery rows). Previously these were fire-and-forget: a flaky network silently
// lost a teacher's record. Now a failed insert is queued in localStorage and
// retried when connectivity returns (on reconnect, focus, or the next save).
import { supabase } from "../supabaseClient.js";

const QUEUE_KEY = "lp-insert-retry-queue-v1";
const MAX_QUEUED = 300;
let flushing = false;

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

async function tryInsert(table, row) {
  const { error } = await supabase.from(table).insert(row);
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
    queue.push({ table, row, at: new Date().toISOString() });
    writeQueue(queue);
    return false;
  }
}

// Retry everything queued; keep whatever still fails.
export async function flushInsertQueue() {
  if (flushing) return;
  const queue = readQueue();
  if (!queue.length) return;
  flushing = true;
  try {
    const remaining = [];
    for (const item of queue) {
      try { await tryInsert(item.table, item.row); }
      catch { remaining.push(item); }
    }
    writeQueue(remaining);
  } finally {
    flushing = false;
  }
}

// Wire up automatic draining (call once on app start).
export function startInsertQueueFlusher() {
  if (!isBrowser()) return;
  void flushInsertQueue();
  window.addEventListener("online", () => { void flushInsertQueue(); });
  window.addEventListener("focus", () => { void flushInsertQueue(); });
}
