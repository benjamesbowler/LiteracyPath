// The Hollow economy - Rewards V2 (replaces the Treasure Den trail/badges).
//
// PHILOSOPHY (unchanged from treasureTrail.js): everything a child EARNS is
// DERIVED from progress the app already stores and syncs (quest stars, game
// stars, story quests, books read, daily-mission chests). More effort can
// never mean fewer rewards, and earnings merge perfectly across devices.
// Only SPENDING is stored - as an append-only ledger (see hollowState.js)
// that merges as a union, so a purchase made on any device is kept.
//
//   COINS   - spendable. earned (derived) minus spent (ledger), never < 0.
//   BERRIES - beastie food. earned from reading, spent by feeding.
//   MARKET  - pal gear, hollow decorations, expansions, mystery eggs.
//   SEASONS - a rotating "caravan" shelf so the catalogue never runs out.
//
// Pure and import-free so it can be unit-tested with node:test.

export const WELCOME_GIFT = 100;

// Coin value of each derived progress unit. Stars pay more than completion
// alone ever could, so racing through carelessly is the slow way to earn.
export const COIN_RATES = {
  questStar: 7,
  soundSeekerStar: 7,
  gameStar: 7,
  storyQuest: 16,
  bookRead: 10,
  dailyChest: 20
};

export function earnedCoins(breakdown = {}, chestCount = 0) {
  const b = breakdown || {};
  return WELCOME_GIFT
    + (Number(b.questStars) || 0) * COIN_RATES.questStar
    + (Number(b.soundSeekerStars) || 0) * COIN_RATES.soundSeekerStar
    + (Number(b.gameStars) || 0) * COIN_RATES.gameStar
    + (Number(b.storiesDone) || 0) * COIN_RATES.storyQuest
    + (Number(b.booksRead) || 0) * COIN_RATES.bookRead
    + (Math.max(0, Number(chestCount) || 0)) * COIN_RATES.dailyChest;
}

// Berries feed beasties. Reading is the only source - books and stories.
export function earnedBerries(breakdown = {}) {
  const b = breakdown || {};
  return (Number(b.booksRead) || 0) + (Number(b.storiesDone) || 0) * 2;
}

// A reward notice must never promise money the wallet cannot spend. This can
// differ after a purchase, a cross-device merge, or recovery of older ledger
// data even though the child genuinely earned coins since their last visit.
export function freshSpendableCoinCount(balance, earnedSinceLastVisit) {
  return Math.max(0, Math.min(
    Number(balance) || 0,
    Number(earnedSinceLastVisit) || 0
  ));
}

// ── Seasons (the caravan shelf) ──────────────────────────────────────────────
// 42-day windows anchored on a fixed Monday. Season index cycles the caravans
// forever - the shelf always has a name, a countdown, and a return date.
const SEASON_ANCHOR_MS = Date.UTC(2026, 0, 5); // Mon 5 Jan 2026
const SEASON_LENGTH_DAYS = 42;
export const CARAVANS = ["Moonwood Caravan", "Dinosaur Caravan", "Meadow Caravan"];

export function seasonForDate(date = new Date()) {
  const days = Math.floor((date.getTime() - SEASON_ANCHOR_MS) / 86400000);
  const index = Math.floor(days / SEASON_LENGTH_DAYS);
  const caravan = ((index % CARAVANS.length) + CARAVANS.length) % CARAVANS.length;
  const daysLeft = SEASON_LENGTH_DAYS - (((days % SEASON_LENGTH_DAYS) + SEASON_LENGTH_DAYS) % SEASON_LENGTH_DAYS);
  return { index, caravan, name: CARAVANS[caravan], daysLeft };
}

// ── Catalog ──────────────────────────────────────────────────────────────────
// `caravan` marks a seasonal item (0=Moonwood, 1=Dino, 2=Meadow shelf);
// omitted = always available. Item ids double as art filenames:
// /images/hollow/<id>.webp - keep them in step with the Seedream request doc.

export const GEAR = [
  { id: "gear-meadow-crown", name: "Meadow crown", slot: "head", price: 120 },
  { id: "gear-explorer-pack", name: "Explorer pack", slot: "back", price: 80 },
  { id: "gear-acorn-shield", name: "Acorn shield", slot: "held", price: 95 },
  { id: "gear-willow-wand", name: "Willow wand", slot: "held", price: 150 },
  { id: "gear-trail-boots", name: "Trail boots", slot: "feet", price: 60 },
  { id: "gear-wizard-hat", name: "Wizard hat", slot: "head", price: 110, caravan: 0 },
  { id: "gear-starweave-scarf", name: "Starweave scarf", slot: "neck", price: 120, caravan: 0 },
  { id: "gear-moth-wings", name: "Moth wings", slot: "back", price: 1050, caravan: 0 },
  { id: "gear-dino-helm", name: "Dino helm", slot: "head", price: 110, caravan: 1 },
  { id: "gear-bone-charm", name: "Bone charm", slot: "neck", price: 120, caravan: 1 },
  { id: "gear-raptor-wings", name: "Raptor wings", slot: "back", price: 1050, caravan: 1 },
  { id: "gear-petal-hood", name: "Petal hood", slot: "head", price: 110, caravan: 2 },
  { id: "gear-leaf-cloak", name: "Leaf cloak", slot: "neck", price: 120, caravan: 2 },
  { id: "gear-falcon-wings", name: "Falcon wings", slot: "back", price: 1050, caravan: 2 }
];

export const HOLLOW_ITEMS = [
  { id: "hollow-glow-jar", name: "Glow jar", price: 20 },
  { id: "hollow-mushroom-stool", name: "Mushroom stool", price: 35 },
  { id: "hollow-moon-lantern", name: "Moon lantern", price: 40 },
  { id: "hollow-moss-rug", name: "Moss rug", price: 45 },
  { id: "hollow-star-banner", name: "Star banner", price: 50 },
  { id: "hollow-root-table", name: "Root table", price: 55 },
  { id: "hollow-owl-perch", name: "Owl perch", price: 70 },
  { id: "hollow-story-shelf", name: "Story shelf", price: 80 },
  { id: "hollow-ember-pit", name: "Ember pit", price: 90 },
  { id: "hollow-crystal-cluster", name: "Crystal cluster", price: 120 },
  { id: "hollow-dino-skull", name: "Old dino skull", price: 140, caravan: 1 },
  { id: "hollow-fern-fountain", name: "Fern fountain", price: 140, caravan: 2 },
  { id: "hollow-moonwell", name: "Moonwell", price: 140, caravan: 0 },
  { id: "hollow-waterfall", name: "Whisper waterfall", price: 1500 }
];

// Expansions open new scene areas with more placement slots. Rising prices
// make them the long-term sink that can absorb any balance.
export const EXPANSIONS = [
  { id: "exp-garden", name: "The Garden", price: 300, slots: 4 },
  { id: "exp-pond", name: "The Pond", price: 600, slots: 4 },
  { id: "exp-cave", name: "The Crystal Cave", price: 1000, slots: 4 },
  { id: "exp-treetop", name: "The Treetop", price: 1500, slots: 4 }
];

export const EGGS = [
  { id: "egg-bronze", name: "Bronze egg", price: 100, tier: "bronze" },
  { id: "egg-silver", name: "Silver egg", price: 250, tier: "silver" },
  { id: "egg-gold", name: "Gold egg", price: 500, tier: "gold" }
];

// One free egg per child (granted from the Beasties tab, never sold in the
// Market) so the collection never cold-starts as a wall of silhouettes.
export const WELCOME_EGG = { id: "egg-welcome", name: "Welcome egg", price: 0, tier: "bronze" };

// Banner/tag icon per caravan, same order as CARAVANS.
export const CARAVAN_ICONS = ["🌙", "🦕", "🌼"];

// Beastie species. `set` groups them for the collection book; new sets can be
// appended per season without touching old ones.
export const BEASTIES = [
  { id: "beastie-moss-sprite", name: "Moss Sprite", rarity: "common", set: "moonwood" },
  { id: "beastie-ember-fox", name: "Ember Fox", rarity: "common", set: "moonwood" },
  { id: "beastie-pebble-toad", name: "Pebble Toad", rarity: "common", set: "moonwood" },
  { id: "beastie-sun-moth", name: "Sun Moth", rarity: "common", set: "moonwood" },
  { id: "beastie-fern-snail", name: "Fern Snail", rarity: "common", set: "moonwood" },
  { id: "beastie-star-owl", name: "Star Owl", rarity: "rare", set: "moonwood" },
  { id: "beastie-thorn-stag", name: "Thorn Stag", rarity: "rare", set: "moonwood" },
  { id: "beastie-glow-lynx", name: "Glow Lynx", rarity: "rare", set: "moonwood" },
  { id: "beastie-river-dragon", name: "River Dragon", rarity: "epic", set: "moonwood" },
  { id: "beastie-moon-wyrm", name: "Moon Wyrm", rarity: "epic", set: "moonwood" }
];

// Growth: feeding berries moves a beastie Baby -> Young -> Grand.
export const GROWTH_STAGES = [
  { stage: 1, name: "Baby", atFeeds: 0 },
  { stage: 2, name: "Young", atFeeds: 3 },
  { stage: 3, name: "Grand", atFeeds: 8 }
];

export function stageForFeeds(feeds) {
  const n = Math.max(0, Number(feeds) || 0);
  let current = GROWTH_STAGES[0];
  for (const s of GROWTH_STAGES) if (n >= s.atFeeds) current = s;
  const next = GROWTH_STAGES.find(s => s.atFeeds > n) || null;
  return { ...current, feeds: n, next, feedsToNext: next ? next.atFeeds - n : 0 };
}

// ── Market availability ──────────────────────────────────────────────────────
export function marketCatalog(date = new Date()) {
  const season = seasonForDate(date);
  const onShelf = item => item.caravan === undefined || item.caravan === season.caravan;
  return {
    season,
    gear: GEAR.filter(onShelf),
    hollow: HOLLOW_ITEMS.filter(onShelf),
    expansions: EXPANSIONS,
    eggs: EGGS
  };
}

export function findCatalogItem(itemId) {
  if (itemId === WELCOME_EGG.id) return WELCOME_EGG;
  return GEAR.find(i => i.id === itemId)
    || HOLLOW_ITEMS.find(i => i.id === itemId)
    || EXPANSIONS.find(i => i.id === itemId)
    || EGGS.find(i => i.id === itemId)
    || null;
}

// ── Deterministic egg hatching ───────────────────────────────────────────────
// The species comes from a hash of the purchase record id, so the SAME
// purchase hatches the SAME beastie on every device (merge-safe, no stored
// randomness). Prefers a species the child doesn't own yet.
function hashString(value) {
  let hash = 0;
  const s = String(value);
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) % 1000000007;
  return Math.abs(hash);
}

function tierPool(tier, roll) {
  const commons = BEASTIES.filter(b => b.rarity === "common");
  const rares = BEASTIES.filter(b => b.rarity === "rare");
  const epics = BEASTIES.filter(b => b.rarity === "epic");
  if (tier === "bronze") return commons;
  if (tier === "silver") return roll % 10 < 7 ? commons : rares;
  return roll % 10 < 6 ? rares : epics; // gold: rare or better, always
}

function tierFallbackPool(tier, primaryPool) {
  const allowed = tier === "bronze"
    ? ["common"]
    : tier === "silver"
      ? ["common", "rare"]
      : ["rare", "epic"];
  const primaryIds = new Set(primaryPool.map(species => species.id));
  return BEASTIES.filter(species => allowed.includes(species.rarity) && !primaryIds.has(species.id));
}

export function hatchSpecies(tier, purchaseId, ownedSpeciesIds = []) {
  const roll = hashString(purchaseId);
  const pool = tierPool(tier, roll);
  const owned = new Set(ownedSpeciesIds);
  const pools = [pool, tierFallbackPool(tier, pool)];
  for (const candidatePool of pools) {
    if (!candidatePool.length) continue;
    const start = roll % candidatePool.length;
    for (let i = 0; i < candidatePool.length; i += 1) {
      const candidate = candidatePool[(start + i) % candidatePool.length];
      if (!owned.has(candidate.id)) return candidate;
    }
  }
  const start = roll % pool.length;
  return pool[start]; // everything owned - duplicates allowed, collection complete
}

// ── The single source of truth for the page ─────────────────────────────────
// ledger: { purchases:[{id,item,cost}], feeds:[{id,species}], chests:[{id,day}],
//           layout:{ at, equipped:{slot:gearId}, slots:{slotId:itemId} } }
// breakdown: treasury breakdown from treasureTrail.computeTreasuryFromAreas.
export function computeHollow(ledger = {}, breakdown = {}, date = new Date()) {
  // Deterministic order regardless of which device's ledger arrived first:
  // hatching prefers unowned species, so purchase ORDER decides which
  // beasties exist. Sorted by (at, id), every device hatches the same
  // collection from the same history — merge-order can no longer fork it.
  const purchases = (Array.isArray(ledger.purchases) ? [...ledger.purchases] : []).sort((a, b) => {
    const at = String(a?.at || ""); const bt = String(b?.at || "");
    if (at !== bt) return at < bt ? -1 : 1;
    const ai = String(a?.id || ""); const bi = String(b?.id || "");
    return ai < bi ? -1 : ai > bi ? 1 : 0;
  });
  const feeds = Array.isArray(ledger.feeds) ? ledger.feeds : [];
  const chests = Array.isArray(ledger.chests) ? ledger.chests : [];
  const layout = ledger.layout && typeof ledger.layout === "object" ? ledger.layout : {};

  // Treat the catalogue as the authority, not an old or corrupt stored row.
  // Unknown items buy nothing and therefore cost nothing. A stored charge can
  // preserve a genuine lower historical price, but it can never exceed the
  // item's current real price. Non-repeatable items are charged once even if
  // two offline devices produced different purchase ids for the same item.
  const seenOwnedOnce = new Set();
  const acceptedPurchases = purchases.flatMap(purchase => {
    const item = findCatalogItem(purchase?.item);
    if (!item) return [];
    const repeatable = item.id.startsWith("egg-") && item.id !== WELCOME_EGG.id;
    if (!repeatable && seenOwnedOnce.has(item.id)) return [];
    if (!repeatable) seenOwnedOnce.add(item.id);
    const storedCost = Number(purchase?.cost);
    const cost = Number.isFinite(storedCost)
      ? Math.max(0, Math.min(item.price, storedCost))
      : item.price;
    return [{ ...purchase, item: item.id, cost }];
  });

  const coinsEarnedTotal = earnedCoins(breakdown, chests.length);
  const coinsSpent = acceptedPurchases.reduce((total, p) => total + p.cost, 0);
  const coins = Math.max(0, coinsEarnedTotal - coinsSpent);
  // Cross-device double-spends are resolved GENEROUSLY (never un-buy from a
  // child) but no longer silently: the flag reaches the teacher report.
  const overspent = coinsSpent > coinsEarnedTotal;

  // Hatch eggs in purchase order so "prefer unowned" is stable.
  const beastieMap = new Map();
  const eggTiers = { "egg-bronze": "bronze", "egg-silver": "silver", "egg-gold": "gold", "egg-welcome": "bronze" };
  for (const p of acceptedPurchases) {
    const tier = eggTiers[p?.item];
    if (!tier) continue;
    const species = hatchSpecies(tier, p.id, [...beastieMap.keys()]);
    if (!beastieMap.has(species.id)) beastieMap.set(species.id, { ...species, feeds: 0 });
  }
  for (const f of feeds) {
    const b = beastieMap.get(f?.species);
    if (b) b.feeds += 1;
  }
  const beasties = [...beastieMap.values()].map(b => ({ ...b, growth: stageForFeeds(b.feeds) }));

  const berriesEarnedTotal = earnedBerries(breakdown);
  const berries = Math.max(0, berriesEarnedTotal - feeds.length);

  const ownedIds = new Set(acceptedPurchases.map(p => p.item));
  const ownedGear = GEAR.filter(g => ownedIds.has(g.id));
  const ownedHollowItems = HOLLOW_ITEMS.filter(i => ownedIds.has(i.id));
  const ownedExpansions = EXPANSIONS.filter(e => ownedIds.has(e.id));

  // Equipped gear / placed items must actually be owned (merged ledgers win).
  const equipped = {};
  for (const gearId of Object.values(layout.equipped || {})) {
    const gear = findCatalogItem(gearId);
    if (gear?.slot && ownedIds.has(gearId)) equipped[gear.slot] = gearId;
  }
  const slots = {};
  for (const [slotId, itemId] of Object.entries(layout.slots || {})) {
    if (ownedIds.has(itemId)) slots[slotId] = itemId;
  }

  return {
    coins, coinsEarnedTotal, coinsSpent, overspent,
    berries, berriesEarnedTotal,
    chestCount: chests.length,
    beasties,
    ownedGear, ownedHollowItems, ownedExpansions, ownedIds,
    equipped, slots,
    market: marketCatalog(date)
  };
}

// Which rarities each priced egg can ever hatch (mirrors tierPool). Used to
// stop a child paying coins for an egg that can only hatch duplicates.
const EGG_REACHABLE_RARITIES = {
  "egg-bronze": ["common"],
  "egg-silver": ["common", "rare"],
  "egg-gold": ["rare", "epic"]
};

// A purchase is allowed when the item is real, not already owned (eggs CAN
// repeat while unhatched species remain), and the wallet covers it.
export function canBuy(hollow, itemId) {
  const item = findCatalogItem(itemId);
  if (!item) return { ok: false, reason: "unknown" };
  const isEgg = itemId.startsWith("egg-");
  if (!isEgg && hollow.ownedIds.has(itemId)) return { ok: false, reason: "owned" };
  if (isEgg && EGG_REACHABLE_RARITIES[itemId]) {
    // Every species this egg could hatch is already owned -> paying coins
    // would celebrate a duplicate that silently vanishes. Block it honestly.
    const rarities = EGG_REACHABLE_RARITIES[itemId];
    const ownedSpecies = new Set((hollow.beasties || []).map(b => b.id));
    const remaining = BEASTIES.some(b => rarities.includes(b.rarity) && !ownedSpecies.has(b.id));
    if (!remaining) return { ok: false, reason: "complete" };
  }
  if (hollow.coins < item.price) return { ok: false, reason: "coins", short: item.price - hollow.coins };
  return { ok: true, item };
}

// Pure mutation gates used by hollowState. Keeping the decision here makes the
// stale-render race testable without importing browser storage or Supabase.
export function tryHollowPurchase(ledger = {}, breakdown = {}, itemId, { id, at, date = new Date() } = {}) {
  const purchases = Array.isArray(ledger.purchases) ? ledger.purchases : [];
  if (itemId === WELCOME_EGG.id && purchases.some(purchase => purchase?.item === WELCOME_EGG.id)) return null;
  const verdict = canBuy(computeHollow(ledger, breakdown, date), itemId);
  if (!verdict.ok || !id) return null;
  const record = { id, item: verdict.item.id, cost: verdict.item.price, at: at || new Date().toISOString() };
  return { ledger: { ...ledger, purchases: [...purchases, record] }, record };
}

export function tryHollowFeed(ledger = {}, breakdown = {}, speciesId, { id, at, date = new Date() } = {}) {
  const feeds = Array.isArray(ledger.feeds) ? ledger.feeds : [];
  const hollow = computeHollow(ledger, breakdown, date);
  const beastie = hollow.beasties.find(candidate => candidate.id === speciesId);
  if (!id || hollow.berries < 1 || !beastie?.growth?.next) return null;
  const record = { id, species: speciesId, at: at || new Date().toISOString() };
  return { ledger: { ...ledger, feeds: [...feeds, record] }, record };
}
