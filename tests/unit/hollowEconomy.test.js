// Rewards V2 economy - the calculation a child's wallet depends on.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  WELCOME_GIFT, COIN_RATES, earnedCoins, earnedBerries, freshSpendableCoinCount,
  seasonForDate, marketCatalog, stageForFeeds, hatchSpecies,
  computeHollow, canBuy, tryHollowFeed, tryHollowPurchase,
  GEAR, EGGS, BEASTIES, CARAVANS
} from "../../src/utils/hollowEconomy.js";
import {
  MAX_HOLLOW_PURCHASE_RECORDS,
  MAX_HOLLOW_FEEDS_PER_SPECIES
} from "../../src/utils/hollowLedgerPolicy.js";
import { DEN_THEMES, isDenThemeUnlocked } from "../../src/utils/denRewards.js";
import { computeHydratedValue } from "../../src/utils/progressMerge.js";
import { PROGRESS_AREAS, localProgressStorageKey } from "../../src/utils/progressKeys.js";

const BREAKDOWN = { questStars: 7, gameStars: 25, soundSeekerStars: 9, storiesDone: 0, booksRead: 5 };

test("reward notices never promise more coins than the live wallet can spend", () => {
  assert.equal(freshSpendableCoinCount(0, 10), 0);
  assert.equal(freshSpendableCoinCount(6, 10), 6);
  assert.equal(freshSpendableCoinCount(52, 10), 10);
});

test("earnedCoins pays welcome gift + rates per derived progress unit", () => {
  assert.equal(earnedCoins({}, 0), WELCOME_GIFT);
  assert.equal(
    earnedCoins(BREAKDOWN, 3),
    WELCOME_GIFT + 7 * COIN_RATES.questStar + 25 * COIN_RATES.gameStar + 9 * COIN_RATES.soundSeekerStar + 5 * COIN_RATES.bookRead + 3 * COIN_RATES.dailyChest
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

test("silver and gold eggs fall through an exhausted rolled rarity instead of charging for a duplicate", () => {
  const rares = BEASTIES.filter(species => species.rarity === "rare");
  const epics = BEASTIES.filter(species => species.rarity === "epic");
  const missingEpic = epics.at(-1);
  const goldOwned = [...rares, ...epics.slice(0, -1)].map(species => species.id);
  for (let index = 0; index < 40; index += 1) {
    assert.equal(hatchSpecies("gold", `gold-fallback-${index}`, goldOwned).id, missingEpic.id);
  }

  const commons = BEASTIES.filter(species => species.rarity === "common");
  const missingRare = rares.at(-1);
  const silverOwned = [...commons, ...rares.slice(0, -1)].map(species => species.id);
  for (let index = 0; index < 40; index += 1) {
    assert.equal(hatchSpecies("silver", `silver-fallback-${index}`, silverOwned).id, missingRare.id);
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

test("legacy multi-item equipment is normalized into composable wearable slots", () => {
  const ledger = {
    purchases: [
      { id: "pack", item: "gear-explorer-pack", cost: 80 },
      { id: "boots", item: "gear-trail-boots", cost: 60 },
      { id: "crown", item: "gear-meadow-crown", cost: 120 },
      { id: "hat", item: "gear-wizard-hat", cost: 110 }
    ],
    layout: {
      at: "2026-07-14",
      equipped: {
        "gear-explorer-pack": "gear-explorer-pack",
        "gear-trail-boots": "gear-trail-boots",
        oldHead: "gear-meadow-crown",
        newestHead: "gear-wizard-hat"
      },
      slots: {}
    }
  };
  const hollow = computeHollow(ledger, BREAKDOWN, new Date("2026-01-06T12:00:00Z"));
  assert.equal(hollow.equipped.back, "gear-explorer-pack");
  assert.equal(hollow.equipped.feet, "gear-trail-boots");
  assert.equal(hollow.equipped.head, "gear-wizard-hat");
  assert.deepEqual(Object.keys(hollow.equipped).sort(), ["back", "feet", "head"]);
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

test("the Hollow mutation gate re-checks the fresh ledger before a second fast purchase", () => {
  const first = tryHollowPurchase({}, {}, "gear-explorer-pack", {
    id: "buy-first",
    at: "2026-07-20T10:00:00.000Z"
  });
  assert.ok(first);
  assert.equal(first.record.cost, 80);
  assert.equal(
    tryHollowPurchase(first.ledger, {}, "gear-trail-boots", {
      id: "buy-second",
      at: "2026-07-20T10:00:00.001Z"
    }),
    null,
    "the stale UI's second individually-affordable tap must not overspend the fresh wallet"
  );
});

test("feeding stops at Grand and append-only Hollow history stays bounded after merge", () => {
  const egg = tryHollowPurchase({}, { booksRead: 20 }, "egg-welcome", {
    id: "welcome",
    at: "2026-07-20T09:00:00.000Z"
  });
  const species = computeHollow(egg.ledger, { booksRead: 20 }).beasties[0].id;
  let ledger = egg.ledger;
  for (let index = 0; index < MAX_HOLLOW_FEEDS_PER_SPECIES; index += 1) {
    const fed = tryHollowFeed(ledger, { booksRead: 20 }, species, {
      id: `feed-${index}`,
      at: `2026-07-20T10:00:${String(index).padStart(2, "0")}.000Z`
    });
    assert.ok(fed);
    ledger = fed.ledger;
  }
  assert.equal(tryHollowFeed(ledger, { booksRead: 20 }, species, { id: "feed-extra" }), null);

  const local = {
    purchases: Array.from({ length: 90 }, (_, index) => ({ id: `local-buy-${index}`, at: `a-${String(index).padStart(3, "0")}` })),
    feeds: Array.from({ length: 60 }, (_, index) => ({ id: `local-feed-${index}`, species, at: `a-${String(index).padStart(3, "0")}` }))
  };
  const cloud = {
    purchases: Array.from({ length: 90 }, (_, index) => ({ id: `cloud-buy-${index}`, at: `b-${String(index).padStart(3, "0")}` })),
    feeds: Array.from({ length: 60 }, (_, index) => ({ id: `cloud-feed-${index}`, species, at: `b-${String(index).padStart(3, "0")}` }))
  };
  const merged = computeHydratedValue("hollow", "__all__", local, cloud);
  assert.equal(merged.purchases.length, MAX_HOLLOW_PURCHASE_RECORDS);
  assert.equal(merged.feeds.length, MAX_HOLLOW_FEEDS_PER_SPECIES);
});

test("Den themes enforce their lifetime-gem unlock thresholds", () => {
  const meadow = DEN_THEMES.find(theme => theme.id === "meadow");
  const dino = DEN_THEMES.find(theme => theme.id === "dino");
  const moonwood = DEN_THEMES.find(theme => theme.id === "moonwood");
  assert.equal(isDenThemeUnlocked(meadow, 0), true);
  assert.equal(isDenThemeUnlocked(dino, 19), false);
  assert.equal(isDenThemeUnlocked(dino, 20), true);
  assert.equal(isDenThemeUnlocked(moonwood, 44), false);
  assert.equal(isDenThemeUnlocked(moonwood, 45), true);

  const page = fs.readFileSync("src/components/HollowPage.jsx", "utf8");
  assert.match(page, /if \(!isDenThemeUnlocked\(next, treasury\.gems\)\) return/, "direct selection bypasses the threshold");
  assert.match(page, /disabled=\{!unlocked\}/, "locked backdrops remain selectable");
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

test("duplicate or corrupt synced purchases cannot drain a child's wallet", () => {
  const local = {
    purchases: [{ id: "local-lamp", item: "hollow-glow-jar", cost: 20, at: "2026-08-01T10:00:00Z" }]
  };
  const cloud = {
    purchases: [
      { id: "cloud-lamp", item: "hollow-glow-jar", cost: 20, at: "2026-08-01T10:00:01Z" },
      { id: "unknown", item: "retired-phantom-item", cost: 999999, at: "2026-08-01T10:00:02Z" },
      { id: "bad-price", item: "hollow-mushroom-stool", cost: 999999, at: "2026-08-01T10:00:03Z" }
    ]
  };

  const merged = computeHydratedValue("hollow", "__all__", local, cloud);
  const beforeBook = computeHollow(merged, {});
  const afterBook = computeHollow(merged, { booksRead: 1 });

  assert.equal(merged.purchases.filter(row => row.item === "hollow-glow-jar").length, 1);
  assert.equal(beforeBook.coinsSpent, 55, "one glow jar and one real mushroom stool are charged once at catalogue prices");
  assert.equal(beforeBook.coins, 45);
  assert.equal(afterBook.coins, 55, "a completed book immediately adds its ten coins to the same wallet");
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
