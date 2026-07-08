// The Hollow ledger - the ONLY stored part of Rewards V2 (see hollowEconomy.js
// for the philosophy). Append-only records so cross-device merges are a simple
// union by id; the layout (what's equipped/placed where) is last-write-wins on
// its `at` timestamp. Persists locally and syncs through the existing
// progressSync pipeline as the "hollow" area.

import { localProgressStorageKey } from "./progressKeys.js";
import { queueProgressSave, logStudentActivity } from "./progressSync.js";

const EMPTY = { purchases: [], feeds: [], chests: [], layout: { at: "", equipped: {}, slots: {} } };

export function loadHollowLedger(scope) {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = JSON.parse(window.localStorage.getItem(localProgressStorageKey("hollow", scope)) || "null");
    if (!raw || typeof raw !== "object") return { ...EMPTY };
    return {
      purchases: Array.isArray(raw.purchases) ? raw.purchases : [],
      feeds: Array.isArray(raw.feeds) ? raw.feeds : [],
      chests: Array.isArray(raw.chests) ? raw.chests : [],
      layout: raw.layout && typeof raw.layout === "object"
        ? { at: raw.layout.at || "", equipped: raw.layout.equipped || {}, slots: raw.layout.slots || {} }
        : { ...EMPTY.layout }
    };
  } catch {
    return { ...EMPTY };
  }
}

function persist(scope, ledger) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localProgressStorageKey("hollow", scope), JSON.stringify(ledger));
  } catch { /* best effort */ }
  queueProgressSave("hollow", "__all__", ledger, { scopeKey: scope });
}

function recordId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Buying: the caller validates with hollowEconomy.canBuy first; this records
// cost at time of purchase so later price changes never rewrite history.
export function recordPurchase(scope, item) {
  const ledger = loadHollowLedger(scope);
  const record = { id: recordId("buy"), item: item.id, cost: item.price, at: new Date().toISOString() };
  ledger.purchases = [...ledger.purchases, record];
  persist(scope, ledger);
  logStudentActivity("hollow", item.id, "purchase", { cost: item.price });
  return record;
}

export function recordFeed(scope, speciesId) {
  const ledger = loadHollowLedger(scope);
  const record = { id: recordId("feed"), species: speciesId, at: new Date().toISOString() };
  ledger.feeds = [...ledger.feeds, record];
  persist(scope, ledger);
  return record;
}

// One chest per calendar day, recorded when the daily mission completes.
export function recordDailyChest(scope, dayKey) {
  const ledger = loadHollowLedger(scope);
  if (ledger.chests.some(c => c?.day === dayKey)) return null;
  const record = { id: `chest-${dayKey}`, day: dayKey };
  ledger.chests = [...ledger.chests, record];
  persist(scope, ledger);
  logStudentActivity("hollow", "chest", "daily_chest", { day: dayKey });
  return record;
}

export function saveLayout(scope, { equipped, slots }) {
  const ledger = loadHollowLedger(scope);
  ledger.layout = {
    at: new Date().toISOString(),
    equipped: equipped || ledger.layout.equipped || {},
    slots: slots || ledger.layout.slots || {}
  };
  persist(scope, ledger);
  return ledger.layout;
}

// Home-page "since last visit" coin pop-up (UI nicety, local only - the same
// pattern the old den used for its reward toast).
const SEEN_KEY_PREFIX = "lp-hollow-seen:";

export function coinsSinceLastVisit(scope, currentCoinsEarnedTotal) {
  if (typeof window === "undefined") return 0;
  try {
    const seen = Number(window.localStorage.getItem(`${SEEN_KEY_PREFIX}${scope || "default"}`) || "NaN");
    if (!Number.isFinite(seen)) return 0;
    return Math.max(0, currentCoinsEarnedTotal - seen);
  } catch {
    return 0;
  }
}

export function markCoinsSeen(scope, currentCoinsEarnedTotal) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${SEEN_KEY_PREFIX}${scope || "default"}`, String(currentCoinsEarnedTotal));
  } catch { /* best effort */ }
}
