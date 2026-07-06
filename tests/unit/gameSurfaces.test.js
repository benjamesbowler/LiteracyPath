import test from "node:test";
import assert from "node:assert/strict";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { LEARN_GAMES } from "../../src/components/learn/games/games/index.js";

const isArcade = game => (game.surfaces || []).includes("arcade");

test("the arcade shows exactly the two flagship playable games", () => {
  const arcade = GAME_LIST.filter(isArcade).map(g => g.id).sort();
  assert.deepEqual(arcade, ["letter-leap", "rocket-run"], `arcade set changed: ${JSON.stringify(arcade)}`);
});

test("Word Climb is hidden (kept, not deleted) and shows nowhere", () => {
  const wc = GAME_LIST.find(g => g.id === "word-climb");
  assert.ok(wc, "word-climb should still exist in GAME_LIST");
  assert.equal(wc.hidden, true, "word-climb should be hidden");
  assert.ok(!isArcade(wc), "hidden word-climb should not be in the arcade");
  // No arcade game is accidentally flagged hidden.
  for (const g of GAME_LIST.filter(isArcade)) assert.ok(!g.hidden, `${g.id} arcade game marked hidden`);
});

test("worksheet games are Daily Challenge games, never arcade; every game is accounted for", () => {
  const daily = GAME_LIST.filter(g => !isArcade(g) && !g.hidden).map(g => g.id);
  assert.ok(daily.includes("cvc-word-builder"), "expected worksheet games in the daily pool");
  for (const g of GAME_LIST.filter(isArcade)) assert.ok(!daily.includes(g.id), `${g.id} is both arcade and daily`);
  const arcade = GAME_LIST.filter(isArcade).length;
  const hidden = GAME_LIST.filter(g => g.hidden && !isArcade(g)).length;
  assert.equal(daily.length + arcade + hidden, GAME_LIST.length, "a game fell through the surface cracks");
});

test("every arcade game has a registered component", () => {
  for (const game of GAME_LIST.filter(isArcade)) {
    assert.ok(LEARN_GAMES[game.id], `arcade game "${game.id}" has no component in LEARN_GAMES`);
  }
});
