// The Treasure Trail - the student reward system.
//
// Everything here is DERIVED from progress the app already stores and syncs
// (quest stars, game stars, story quests, books read), so it needs no new
// storage area, merges perfectly across devices, and resets with a teacher
// reset. More effort can never mean fewer rewards.
//
//   * GEMS   - one gem per star earned anywhere; books and stories pay too.
//   * BADGES - a gold world medallion for every quest cycle completed.
//   * CHEST TREASURES - milestone prizes on the gem trail, so the "next
//     reward" is always visible and always reachable.

import { localProgressStorageKey } from "./progressKeys.js";
import { worldForCycle } from "./palWorlds.js";

function readArea(area, scope) {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(localProgressStorageKey(area, scope)) || "null");
  } catch {
    return null;
  }
}

// The milestone trail. Spaced so the first prize lands in the first session
// and the next one always feels close. Icons are drawn in-app (no new art).
export const TRAIL_TREASURES = [
  { at: 3, id: "spark", name: "Spark Gem", icon: "💎" },
  { at: 8, id: "map", name: "Explorer Map", icon: "🗺️" },
  { at: 15, id: "torch", name: "Glow Torch", icon: "🔦" },
  { at: 24, id: "crown", name: "Meadow Crown", icon: "👑" },
  { at: 35, id: "egg", name: "Dino Egg", icon: "🥚" },
  { at: 48, id: "scope", name: "Star Scope", icon: "🔭" },
  { at: 64, id: "harp", name: "Moon Harp", icon: "🎵" },
  { at: 82, id: "shield", name: "Reader Shield", icon: "🛡️" },
  { at: 105, id: "dragon", name: "Dragon Horn", icon: "🐲" },
  { at: 130, id: "trophy", name: "Grand Trophy", icon: "🏆" }
];

function sumQuestStars(quest) {
  return Object.values(quest?.cycles || {}).reduce((total, cycle) => total + (Number(cycle?.stars) || 0), 0);
}

function sumGameStars(games) {
  return Object.values(games?.games || {}).reduce((total, game) => total + (Number(game?.stars) || 0), 0);
}

function countCompletedStories(stories) {
  return Object.values(stories || {}).filter(row => row && typeof row === "object" && row.completed).length;
}

function countBooksRead(reading) {
  const rows = reading && typeof reading === "object" ? Object.values(reading) : [];
  return rows.filter(row => row && typeof row === "object"
    && (Number(row.readCount) > 0 || row.completed || row.completedAt)).length;
}

export function completedCycleBadges(quest) {
  return Object.entries(quest?.cycles || {})
    .map(([id, data]) => {
      const number = Number(String(id).replace(/[^0-9]/g, ""));
      return { id, cycleNumber: number, stars: Number(data?.stars) || 0 };
    })
    .filter(badge => badge.cycleNumber > 0 && badge.stars > 0)
    .sort((a, b) => a.cycleNumber - b.cycleNumber)
    .map(badge => ({
      ...badge,
      world: worldForCycle(badge.cycleNumber),
      name: `Cycle ${badge.cycleNumber}`
    }));
}

export function computeTreasury(scope) {
  return computeTreasuryFromAreas({
    quest: readArea("el_quest", scope),
    games: readArea("learn_games", scope),
    stories: readArea("story_quests", scope),
    reading: readArea("guided_reading", scope)
  });
}

// Pure core (unit-testable without a browser).
export function computeTreasuryFromAreas({ quest, games, stories, reading } = {}) {
  const questStars = sumQuestStars(quest);
  const gameStars = sumGameStars(games);
  const storiesDone = countCompletedStories(stories);
  const booksRead = countBooksRead(reading);

  // Every star is a gem; finishing a story quest pays two; every book read pays one.
  const gems = questStars + gameStars + storiesDone * 2 + booksRead;

  const badges = completedCycleBadges(quest);
  const earnedTreasures = TRAIL_TREASURES.filter(t => gems >= t.at);
  const nextTreasure = TRAIL_TREASURES.find(t => gems < t.at) || null;
  const previousAt = earnedTreasures.length ? earnedTreasures[earnedTreasures.length - 1].at : 0;
  const nextProgress = nextTreasure
    ? Math.max(0, Math.min(1, (gems - previousAt) / (nextTreasure.at - previousAt)))
    : 1;

  return {
    gems,
    breakdown: { questStars, gameStars, storiesDone, booksRead },
    badges,
    treasures: earnedTreasures,
    nextTreasure,
    nextProgress,
    gemsToNext: nextTreasure ? nextTreasure.at - gems : 0
  };
}
