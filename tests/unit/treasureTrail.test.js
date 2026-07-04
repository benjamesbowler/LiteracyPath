import test from "node:test";
import assert from "node:assert/strict";
import { computeTreasuryFromAreas, TRAIL_TREASURES } from "../../src/utils/treasureTrail.js";

const richProgress = {
  quest: { cycles: { "cycle-1": { stars: 3 }, "cycle-2": { stars: 2 }, "cycle-10": { stars: 1 } } },
  games: { games: { popTheWord: { stars: 3 }, sightWordMemory: { stars: 2 } } },
  stories: { "quest-a": { completed: true }, "quest-b": { completed: false } },
  reading: { "gr-a-1": { readCount: 2 }, "gr-a-2": { completed: true }, "gr-a-3": {} }
};

test("gems add up from every kind of effort", () => {
  const t = computeTreasuryFromAreas(richProgress);
  // 6 quest stars + 5 game stars + 1 story x2 + 2 books = 15
  assert.equal(t.gems, 15);
  assert.deepEqual(t.breakdown, { questStars: 6, gameStars: 5, storiesDone: 1, booksRead: 2 });
});

test("badges: one medallion per completed cycle, in order, with its world", () => {
  const t = computeTreasuryFromAreas(richProgress);
  assert.deepEqual(t.badges.map(b => b.cycleNumber), [1, 2, 10]);
  assert.equal(t.badges[0].world.id, "meadow");
  assert.equal(t.badges[2].world.id, "dino");
});

test("the next treasure is always visible and progress is sane", () => {
  const t = computeTreasuryFromAreas(richProgress);
  assert.ok(t.nextTreasure, "next treasure exists");
  assert.ok(t.gemsToNext > 0);
  assert.ok(t.nextProgress >= 0 && t.nextProgress < 1);
  // 15 gems earns the first three prizes on the trail (3, 8, 15).
  assert.deepEqual(t.treasures.map(item => item.at), [3, 8, 15]);
});

test("more effort never means fewer rewards (monotonic)", () => {
  const before = computeTreasuryFromAreas(richProgress);
  const after = computeTreasuryFromAreas({
    ...richProgress,
    quest: { cycles: { ...richProgress.quest.cycles, "cycle-3": { stars: 3 } } }
  });
  assert.ok(after.gems > before.gems);
  assert.ok(after.badges.length > before.badges.length);
  assert.ok(after.treasures.length >= before.treasures.length);
});

test("empty progress is a calm zero state, not a crash", () => {
  const t = computeTreasuryFromAreas({});
  assert.equal(t.gems, 0);
  assert.equal(t.badges.length, 0);
  assert.equal(t.nextTreasure.at, TRAIL_TREASURES[0].at);
});
