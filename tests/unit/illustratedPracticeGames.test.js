import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  ILLUSTRATED_GAME_IDS,
  ILLUSTRATED_GAME_SCENES
} from "../../src/components/learn/games/shared/illustratedGameScenes.js";

const ROOT = process.cwd();

const EXPECTED_SCENES = {
  build: "cvc-word-builder",
  memory: "sight-word-memory",
  family: "blend-and-build",
  target: "pop-the-word",
  sentence: "word-hopscotch",
  quiz: "reading-race",
  rescue: "word-rescue",
  sort: "sound-sort-factory",
  garden: "letter-garden"
};

test("the compact practice roster has one owned illustrated scene per game", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(ILLUSTRATED_GAME_SCENES).map(([mode, scene]) => [mode, scene.id])),
    EXPECTED_SCENES
  );
  assert.deepEqual([...ILLUSTRATED_GAME_IDS].sort(), Object.values(EXPECTED_SCENES).sort());

  for (const scene of Object.values(ILLUSTRATED_GAME_SCENES)) {
    const assetPath = path.join(ROOT, "public", scene.src.replace(/^\//, ""));
    assert.equal(existsSync(assetPath), true, `${scene.id} scene art exists`);
    assert.ok(statSync(assetPath).size > 20_000, `${scene.id} scene art is a real authored asset`);
    assert.ok(scene.width >= 640 && scene.height >= 640, `${scene.id} exposes useful intrinsic dimensions`);
  }
});

test("both shared engines use the scene shell and the obsolete PS2 hook is gone", () => {
  const practiceSource = readFileSync(
    path.join(ROOT, "src/components/learn/games/games/ArcadePracticeGame.jsx"),
    "utf8"
  );
  const adventureSource = readFileSync(
    path.join(ROOT, "src/components/learn/games/games/AdventureGame.jsx"),
    "utf8"
  );
  const styles = readFileSync(path.join(ROOT, "src/styles/learn-games.css"), "utf8");

  for (const mode of ["build", "memory", "family", "target", "sentence", "quiz"]) {
    assert.match(practiceSource, new RegExp(`IllustratedGameScene mode="${mode}"`));
  }
  for (const mode of ["rescue", "sort", "garden"]) {
    assert.match(adventureSource, new RegExp(`IllustratedGameScene mode="${mode}"`));
  }

  assert.doesNotMatch(practiceSource, /lg-ps2-practice/);
  assert.doesNotMatch(styles, /lg-ps2-practice|lg-ps2-/);
  assert.match(practiceSource, /width="240"[\s\S]*height="240"/);
  assert.match(styles, /\.lg-game-picture \{[\s\S]*clamp\(190px, 27vh, 250px\)/);
  assert.match(styles, /min-height: 56px/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
