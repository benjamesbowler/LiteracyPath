// The Hollow ledger - the ONLY stored part of Rewards V2 (see hollowEconomy.js
// for the philosophy). Append-only records so cross-device merges are a simple
// union by id; the layout (what's equipped/placed where) is last-write-wins on
// its `at` timestamp. Persists locally and syncs through the existing
// progressSync pipeline as the "hollow" area.

import { localProgressStorageKey } from "./progressKeys.js";
import { queueProgressSave, logStudentActivity } from "./progressSync.js";
import { tryHollowFeed, tryHollowPurchase } from "./hollowEconomy.js";
import { boundedHollowFeeds, boundedHollowPurchases, uniqueHollowRecords } from "./hollowLedgerPolicy.js";

const EMPTY = { purchases: [], feeds: [], chests: [], layout: { at: "", equipped: {}, slots: {} } };

export function loadHollowLedger(scope) {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = JSON.parse(window.localStorage.getItem(localProgressStorageKey("hollow", scope)) || "null");
    if (!raw || typeof raw !== "object") return { ...EMPTY };
    return {
      purchases: boundedHollowPurchases(raw.purchases),
      feeds: boundedHollowFeeds(raw.feeds),
      chests: uniqueHollowRecords(raw.chests),
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
  const bounded = {
    ...ledger,
    purchases: boundedHollowPurchases(ledger.purchases),
    feeds: boundedHollowFeeds(ledger.feeds),
    chests: uniqueHollowRecords(ledger.chests)
  };
  try {
    window.localStorage.setItem(localProgressStorageKey("hollow", scope), JSON.stringify(bounded));
  } catch { /* best effort */ }
  queueProgressSave("hollow", "__all__", bounded, { scopeKey: scope });
}

function recordId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Re-check against the freshly loaded ledger at the mutation boundary. React's
// rendered wallet is only a snapshot and two fast taps can otherwise both pass
// the caller's stale affordability check.
export function recordPurchase(scope, item, breakdown = {}) {
  const ledger = loadHollowLedger(scope);
  const applied = tryHollowPurchase(ledger, breakdown, item?.id, {
    id: recordId("buy"),
    at: new Date().toISOString()
  });
  if (!applied) return null;
  persist(scope, applied.ledger);
  logStudentActivity("hollow", applied.record.item, "purchase", { cost: applied.record.cost });
  return applied.record;
}

export function recordFeed(scope, speciesId, breakdown = {}) {
  const ledger = loadHollowLedger(scope);
  const applied = tryHollowFeed(ledger, breakdown, speciesId, {
    id: recordId("feed"),
    at: new Date().toISOString()
  });
  if (!applied) return null;
  persist(scope, applied.ledger);
  return applied.record;
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
