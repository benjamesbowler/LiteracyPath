import assert from "node:assert/strict";
import test from "node:test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";
import {
  QUEST_FULLSCREEN_VIEWS,
  closeFullscreenSurfaceName,
  gameFullscreenSurfaceName,
  questFullscreenSurfaceName,
  quitFullscreenSurfaceName,
  resumeFullscreenSurfaceName
} from "../../src/utils/fullscreenOverlayNames.js";

test("every Sound Seekers fullscreen view has one specific active-surface name", () => {
  const expected = {
    creator: "Choose your book character",
    map: "Trail map",
    world: "Meadow Gate trail",
    ceremony: "Meadow Gate reward",
    post: "Trading Post"
  };

  assert.deepEqual(QUEST_FULLSCREEN_VIEWS, Object.keys(expected));
  for (const view of QUEST_FULLSCREEN_VIEWS) {
    assert.equal(
      questFullscreenSurfaceName({ view, activeStopName: "Meadow Gate" }),
      expected[view]
    );
  }
  assert.equal(
    questFullscreenSurfaceName({ view: "creator", hatched: true }),
    "Change your book character"
  );
});

test("every registered fullscreen game derives its dialog and control names from its title", () => {
  assert.ok(GAME_LIST.length > 0);
  assert.equal(new Set(GAME_LIST.map(game => game.id)).size, GAME_LIST.length);

  for (const game of GAME_LIST) {
    const surfaceName = gameFullscreenSurfaceName(game);
    assert.equal(surfaceName, game.title);
    assert.equal(closeFullscreenSurfaceName(surfaceName), `Close ${game.title}`);
    assert.equal(resumeFullscreenSurfaceName(surfaceName), `Resume ${game.title}`);
    assert.equal(quitFullscreenSurfaceName(surfaceName), `Quit ${game.title}`);
  }
});

test("fullscreen names fail closed instead of exposing empty or unknown dialogs", () => {
  assert.throws(() => questFullscreenSurfaceName({ view: "unknown" }), /Unknown fullscreen quest view/);
  assert.throws(() => gameFullscreenSurfaceName({ title: " " }), /non-empty accessible surface name/);
  assert.throws(() => closeFullscreenSurfaceName(""), /non-empty accessible surface name/);
});
