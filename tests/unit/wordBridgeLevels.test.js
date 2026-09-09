import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLevel,
  wordBridgeLadder
} from "../../src/utils/wordBridgeLevels.js";
import { sharesSound } from "../../src/components/elQuest/elQuestEngine.js";

test("wordBridgeLadder returns 10 levels for every difficulty", () => {
  for (const d of ["easy", "medium", "hard"]) {
    const ladder = wordBridgeLadder(d);
    assert.equal(ladder.length, 10, `${d} should have 10 levels`);
  }
});

test("every level has enough correct tiles to complete the target", () => {
  for (const d of ["easy", "medium", "hard"]) {
    const ladder = wordBridgeLadder(d);
    for (const level of ladder) {
      const needed = {};
      const correct = level.tiles.filter((t) => t.correct);

      for (const t of correct) {
        needed[t.order] = (needed[t.order] || 0) + 1;
      }

      for (let i = 0; i < level.slots; i += 1) {
        assert.ok(
          needed[i] >= 1,
          `${d}: level target "${Array.isArray(level.target) ? level.target.join(" ") : level.target}" missing tile for slot ${i}`
        );
      }
    }
  }
});

test("repeated graphemes retain distinct occurrence identities", () => {
  const level = buildLevel({ world: "meadow", cycle: 0, mode: "bridge", target: "tent" });
  const repeated = level.tiles.filter(tile => tile.correct && tile.glyph === "T");
  assert.equal(repeated.length, 2);
  assert.notEqual(repeated[0].occurrenceId, repeated[1].occurrenceId);
  assert.match(level.levelId, /^word-bridge-meadow-/);
});

test("decoy letters are never a needed glyph of the target", () => {
  for (const d of ["easy", "medium", "hard"]) {
    const ladder = wordBridgeLadder(d);
    for (const level of ladder) {
      if (Array.isArray(level.target)) continue; // sentence mode checked separately
      const needed = new Set(String(level.target).toUpperCase().split(""));
      for (const decoy of level.decoys) {
        const dc = String(decoy).toUpperCase();
        assert.ok(
          !needed.has(dc),
          `${d}: decoy "${dc}" is a needed letter of "${level.target}"`
        );
      }
    }
  }
});

test("letter decoys are sound-distinct from every needed letter", () => {
  for (const d of ["easy", "medium", "hard"]) {
    const ladder = wordBridgeLadder(d);
    for (const level of ladder) {
      if (Array.isArray(level.target)) continue;
      const needed = [...new Set(String(level.target).toUpperCase().split(""))];
      for (const decoy of level.decoys) {
        for (const n of needed) {
          assert.ok(
            !sharesSound(decoy, n),
            `${d}: decoy "${decoy}" shares sound with needed "${n}" in "${level.target}"`
          );
        }
      }
    }
  }
});

test("no repeated targets across a difficulty", () => {
  for (const d of ["easy", "medium", "hard"]) {
    const ladder = wordBridgeLadder(d);
    const targets = ladder.map((l) =>
      Array.isArray(l.target) ? l.target.join(" ") : l.target
    );
    assert.equal(
      new Set(targets).size,
      targets.length,
      `${d} repeated a target`
    );
  }
});

test("sentence mode gives orderable word tiles", () => {
  const ladder = wordBridgeLadder("hard");
  const sentenceLevels = ladder.filter((l) => Array.isArray(l.target));
  assert.ok(sentenceLevels.length > 0, "hard should have sentence levels");
  for (const level of sentenceLevels) {
    for (let i = 0; i < level.slots; i += 1) {
      const count = level.tiles.filter((t) => t.correct && t.order === i).length;
      assert.ok(
        count >= 1,
        `sentence level missing tile for order ${i}`
      );
    }
  }
});

test("word decoys are never in the target sentence", () => {
  const ladder = wordBridgeLadder("hard");
  const sentenceLevels = ladder.filter((l) => Array.isArray(l.target));
  for (const level of sentenceLevels) {
    const targetSet = new Set(level.target.map((w) => String(w).toLowerCase()));
    for (const decoy of level.decoys) {
      assert.ok(
        !targetSet.has(String(decoy).toLowerCase()),
        `decoy "${decoy}" appears in target sentence "${level.target.join(" ")}"`
      );
    }
  }
});

test("buildLevel is deterministic for the same inputs", () => {
  const a = buildLevel({ world: "meadow", cycle: 0, mode: "bridge", target: "cat" });
  const b = buildLevel({ world: "meadow", cycle: 0, mode: "bridge", target: "cat" });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("world parameters map correctly", () => {
  const meadow = buildLevel({ world: "meadow", cycle: 0, mode: "bridge", target: "cat" });
  const dino = buildLevel({ world: "dino", cycle: 0, mode: "bridge", target: "ship" });
  const moonwood = buildLevel({ world: "moonwood", cycle: 0, mode: "bridge", target: "brush" });

  assert.equal(meadow.hazard, "river");
  assert.equal(dino.hazard, "lava");
  assert.equal(moonwood.hazard, "chasm");

  assert.ok(meadow.pals >= 3);
  assert.ok(dino.pals >= meadow.pals);
  assert.ok(moonwood.pals >= dino.pals);

  assert.ok(meadow.patience >= 20);
  assert.ok(dino.patience <= meadow.patience);
  assert.ok(moonwood.patience <= dino.patience);
});

test("written grapheme construction keeps joined sounds together without losing letters", async () => {
  const { wordBridgeParts } = await import("../../src/utils/wordBridgeLevels.js");
  const { segmentWord, segmentWrittenWord } = await import("../../src/utils/graphemeSegments.js");
  for (const [word, parts] of [["chin", ["CH", "I", "N"]], ["shirt", ["SH", "IR", "T"]], ["ring", ["R", "I", "NG"]], ["kick", ["K", "I", "CK"]], ["splash", ["S", "P", "L", "A", "SH"]]]) {
    assert.deepEqual(wordBridgeParts(word), parts);
    const level = buildLevel({ world: "moonwood", cycle: 0, target: word });
    assert.equal(level.slots, parts.length);
    assert.deepEqual(level.tiles.filter(tile => tile.correct).sort((a, b) => a.order - b.order).map(tile => tile.glyph), parts);
  }
  for (const word of ["tent", "glimmer", "stone", "cheese"]) assert.equal(segmentWrittenWord(word).join(""), word);
  assert.deepEqual(segmentWord("stone"), ["s", "t", "o_e", "n"]);
});
