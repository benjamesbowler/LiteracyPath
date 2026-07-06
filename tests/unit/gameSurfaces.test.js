import test from "node:test";
import assert from "node:assert/strict";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { LEARN_GAMES } from "../../src/components/learn/games/games/index.js";

const isArcade = game => (game.surfaces || []).includes("arcade");

test("arcade games are the new playable games and nothing else", () => {
  const arcade = GAME_LIST.filter(isArcade).map(g => g.id).sort();
  assert.deepEqual(arcade, ["rocket-run", "word-climb"], `arcade set changed: ${JSON.stringify(arcade)}`);
});

test("the old worksheet games are NOT in the arcade (they belong to Daily Challenge / EL maps)", () => {
  const daily = GAME_LIST.filter(g => !isArcade(g)).map(g => g.id);
  assert.ok(daily.includes("cvc-word-builder"), "expected worksheet games in the daily pool");
  for (const g of GAME_LIST.filter(isArcade)) {
    assert.ok(!daily.includes(g.id), `${g.id} is both arcade and daily`);
  }
  // Every game lands on at least one surface.
  assert.equal(daily.length + GAME_LIST.filter(isArcade).length, GAME_LIST.length);
});

test("every arcade game has a registered component", () => {
  for (const game of GAME_LIST.filter(isArcade)) {
    assert.ok(LEARN_GAMES[game.id], `arcade game "${game.id}" has no component in LEARN_GAMES`);
  }
});
