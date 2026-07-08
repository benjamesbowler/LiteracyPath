// Rewards V2 economy - the maths a child's wallet depends on.
import test from "node:test";
import assert from "node:assert/strict";
import {
  WELCOME_GIFT, COIN_RATES, earnedCoins, earnedBerries,
  seasonForDate, marketCatalog, stageForFeeds, hatchSpecies,
  computeHollow, canBuy, GEAR, EGGS, BEASTIES, CARAVANS
} from "../../src/utils/hollowEconomy.js";
import { computeHydratedValue } from "../../src/utils/progressMerge.js";
import { PROGRESS_AREAS, localProgressStorageKey } from "../../src/utils/progressKeys.js";

const BREAKDOWN = { questStars: 7, gameStars: 25, storiesDone: 0, booksRead: 5 };

test("earnedCoins pays welcome gift + rates per derived progress unit", () => {
  assert.equal(earnedCoins({}, 0), WELCOME_GIFT);
  assert.equal(
    earnedCoins(BREAKDOWN, 3),
    WELCOME_GIFT + 7 * COIN_RATES.questStar + 25 * COIN_RATES.gameStar + 5 * COIN_RATES.bookRead + 3 * COIN_RATES.dailyChest
  );
});

test("earnedCoins is monotonic - more progress never pays less", () => {
  const less = earnedCoins({ questStars: 3, booksRead: 1 }, 0);
  const more = earnedCoins({ questStars: 4, booksRead: 1 }, 0);
  assert.ok(more > less);
});

test("earnedBerries comes from reading only", () => {
  assert.equal(earnedBerries({ booksRead: 3, storiesDone: 2, gameStars: 99 }), 3 + 4);
});

test("seasons cycle caravans forever with a live countdown", () => {
  const a = seasonForDate(new Date("2026-01-06T12:00:00Z"));
  assert.equal(a.name, CARAVANS[0]);
  const b = seasonForDate(new Date("2026-02-20T12:00:00Z"));
  assert.equal(b.name, CARAVANS[1]);
  const later = seasonForDate(new Date("2031-06-01T12:00:00Z"));
  assert.ok(CARAVANS.includes(later.name));
  assert.ok(a.daysLeft >= 1 && a.daysLeft <= 42);
});

test("market shows always-on items plus only the current caravan's shelf", () => {
  const market = marketCatalog(new Date("2026-01-06T12:00:00Z")); // Moonwood window
  assert.ok(market.gear.some(g => g.id === "gear-wizard-hat"));
  assert.ok(!market.gear.some(g => g.id === "gear-dino-helm"));
  assert.ok(market.gear.some(g => g.id === "gear-explorer-pack"));
  assert.ok(market.eggs.length === EGGS.length);
});

test("growth stages: 0 feeds = Baby, 3 = Young, 8 = Grand", () => {
  assert.equal(stageForFeeds(0).name, "Baby");
  assert.equal(stageForFeeds(2).name, "Baby");
  assert.equal(stageForFeeds(3).name, "Young");
  assert.equal(stageForFeeds(8).name, "Grand");
  assert.equal(stageForFeeds(8).next, null);
  assert.equal(stageForFeeds(5).feedsToNext, 3);
});

test("hatching is deterministic and prefers a species you don't own", () => {
  const first = hatchSpecies("bronze", "buy-abc123", []);
  const again = hatchSpecies("bronze", "buy-abc123", []);
  assert.equal(first.id, again.id);
  const owned = [first.id];
  const second = hatchSpecies("bronze", "buy-abc123", owned);
  assert.notEqual(second.id, first.id);
});

test("bronze eggs hatch commons; gold eggs never hatch a common", () => {
  for (let i = 0; i < 40; i += 1) {
    const bronze = hatchSpecies("bronze", `seed-${i}`, []);
    assert.equal(bronze.rarity, "common");
    const gold = hatchSpecies("gold", `seed-${i}`, []);
    assert.ok(gold.rarity === "rare" || gold.rarity === "epic");
  }
});

test("computeHollow: wallet = earned - spent, never negative", () => {
  const ledger = { purchases: [{ id: "b1", item: "gear-trail-boots", cost: 60 }] };
  const hollow = computeHollow(ledger, BREAKDOWN);
  assert.equal(hollow.coins, hollow.coinsEarnedTotal - 60);
  const broke = computeHollow(
    { purchases: [{ id: "b2", item: "hollow-waterfall", cost: 999999 }] },
    { questStars: 1 }
  );
  assert.equal(broke.coins, 0);
});

test("computeHollow hatches eggs from the ledger and counts feeds", () => {
  const ledger = {
    purchases: [{ id: "egg1", item: "egg-bronze", cost: 100 }],
    feeds: []
  };
  const hollow = computeHollow(ledger, BREAKDOWN);
  assert.equal(hollow.beasties.length, 1);
  const species = hollow.beasties[0].id;
  const fed = computeHollow(
    { ...ledger, feeds: [{ id: "f1", species }, { id: "f2", species }, { id: "f3", species }] },
    BREAKDOWN
  );
  assert.equal(fed.beasties[0].growth.name, "Young");
  assert.equal(fed.berries, earnedBerries(BREAKDOWN) - 3);
});

test("equipped gear and placed items must be owned (merge-proof)", () => {
  const ledger = {
    purchases: [{ id: "b1", item: "gear-wizard-hat", cost: 110 }],
    layout: { at: "2026-07-08", equipped: { head: "gear-wizard-hat", back: "gear-moth-wings" }, slots: { s1: "hollow-moon-lantern" } }
  };
  const hollow = computeHollow(ledger, BREAKDOWN);
  assert.equal(hollow.equipped.head, "gear-wizard-hat");
  assert.equal(hollow.equipped.back, undefined);
  assert.equal(hollow.slots.s1, undefined);
});

test("canBuy: blocks unknown/owned/too-expensive, allows repeat eggs", () => {
  const rich = computeHollow({ purchases: [{ id: "b1", item: "gear-trail-boots", cost: 60 }] }, { gameStars: 100 });
  assert.equal(canBuy(rich, "not-a-thing").ok, false);
  assert.equal(canBuy(rich, "gear-trail-boots").reason, "owned");
  assert.equal(canBuy(rich, "egg-bronze").ok, true);
  const poor = computeHollow({}, {});
  const verdict = canBuy(poor, "gear-moth-wings");
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "coins");
  assert.ok(verdict.short > 0);
});

test("hollow progress area exists and has a storage key", () => {
  assert.ok(PROGRESS_AREAS.includes("hollow"));
  assert.ok(localProgressStorageKey("hollow", "aaron").includes("aaron"));
});

test("hollow merge: ledgers union by id, layout is last-write-wins", () => {
  const local = {
    purchases: [{ id: "a", item: "gear-trail-boots", cost: 60 }],
    feeds: [{ id: "f1", species: "beastie-ember-fox" }],
    chests: [{ id: "chest-2026-07-07", day: "2026-07-07" }],
    layout: { at: "2026-07-08T10:00:00Z", equipped: { head: "x" }, slots: {} }
  };
  const cloud = {
    purchases: [
      { id: "a", item: "gear-trail-boots", cost: 60 },
      { id: "b", item: "egg-bronze", cost: 100 }
    ],
    feeds: [],
    chests: [{ id: "chest-2026-07-08", day: "2026-07-08" }],
    layout: { at: "2026-07-08T09:00:00Z", equipped: { head: "y" }, slots: {} }
  };
  const merged = computeHydratedValue("hollow", "__all__", local, cloud);
  assert.equal(merged.purchases.length, 2);
  assert.equal(merged.feeds.length, 1);
  assert.equal(merged.chests.length, 2);
  assert.equal(merged.layout.equipped.head, "x"); // local is newer
});

test("the free welcome egg resolves, costs nothing, and hatches a common", async () => {
  const { WELCOME_EGG, findCatalogItem: find } = await import("../../src/utils/hollowEconomy.js");
  assert.equal(find(WELCOME_EGG.id).price, 0);
  const hollow = computeHollow(
    { purchases: [{ id: "gift1", item: "egg-welcome", cost: 0 }] },
    {}
  );
  assert.equal(hollow.coins, earnedCoins({}, 0)); // free - wallet untouched
  assert.equal(hollow.beasties.length, 1);
  assert.equal(hollow.beasties[0].rarity, "common");
});

test("every catalog id is unique across gear, hollow items, expansions and eggs", async () => {
  const { HOLLOW_ITEMS, EXPANSIONS } = await import("../../src/utils/hollowEconomy.js");
  const ids = [...GEAR, ...HOLLOW_ITEMS, ...EXPANSIONS, ...EGGS, ...BEASTIES].map(i => i.id);
  assert.equal(new Set(ids).size, ids.length);
});
