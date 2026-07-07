import test from "node:test";
import assert from "node:assert/strict";
import {
  soundRacerLadder,
  buildTrack,
  worldObstacles
} from "../../src/utils/soundRacerTracks.js";
import { rocketRunTargets } from "../../src/utils/rocketRunRounds.js";
import { onsetGrapheme, sharesSound } from "../../src/components/elQuest/elQuestEngine.js";

const isDigraph = g => /^(sh|ch|th|ng|ck|qu)$/.test(g);

// Cover every target Sound Racer can inherit from the sound ladder.
const TEST_TARGETS = rocketRunTargets();

const BASE_SPEEDS = {
  easy: 5.4,
  medium: 6.1,
  hard: 6.8
};

function idealClearSeconds(track, difficulty) {
  const correctZs = track.gates.filter(gate => gate.correct).map(gate => gate.z).sort((a, b) => a - b);
  let nextCorrect = 0;
  let wordsCorrect = 0;
  let boostT = 0;
  let playerZ = -4;
  let seconds = 0;
  const dt = 0.05;

  while (seconds < 180 && (playerZ < track.totalLength || wordsCorrect < track.needed)) {
    const boost = boostT > 0 ? 2.4 : 0;
    const speed = BASE_SPEEDS[difficulty] + boost + wordsCorrect * 0.07;
    playerZ += speed * dt;
    seconds += dt;
    boostT = Math.max(0, boostT - dt);

    while (nextCorrect < correctZs.length && playerZ >= correctZs[nextCorrect] - 0.58) {
      wordsCorrect += 1;
      boostT = 1.25;
      nextCorrect += 1;
    }
  }

  return seconds;
}

// 1. Every track has ≥ needed correct gates and is winnable
//    (winnable = distinct z positions, player can switch lanes between gates)
test("every track has ≥ needed correct gates and is winnable", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      for (const seed of [1, 42, 99]) {
        const track = buildTrack(g, { difficulty: d, seed });
        assert.ok(track.gates.length > 0, `${g}/${d}: track is empty`);
        const correctGates = track.gates.filter(gate => gate.correct);
        assert.ok(
          correctGates.length >= track.needed,
          `${g}/${d}: expected >= ${track.needed} correct gates, got ${correctGates.length}`
        );

        // Winnable: no duplicate z positions means the player can always
        // be in the right lane before arriving at each gate.
        const zs = track.gates.map(gate => gate.z);
        assert.equal(
          new Set(zs).size,
          zs.length,
          `${g}/${d}: duplicate z positions found`
        );
      }
    }
  }
});

// 2. Every starting track asks for 10 unique correct words with no repeated word gates
test("every track starts with 10 unique correct words and no repeated word gates", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      const track = buildTrack(g, { difficulty: d, seed: 7 });
      const correctWords = track.gates.filter(gate => gate.correct).map(gate => gate.word);
      const wordGates = track.gates.filter(gate => gate.kind === "word").map(gate => gate.word);

      assert.equal(track.needed, 10, `${g}/${d}: expected 10 needed words`);
      assert.equal(correctWords.length, 10, `${g}/${d}: expected 10 correct word gates`);
      assert.equal(new Set(correctWords).size, 10, `${g}/${d}: correct word repeated`);
      assert.equal(new Set(wordGates).size, wordGates.length, `${g}/${d}: starting track reused a word`);
    }
  }
});

// 3. Every "word" gate marked correct:false is sound-distinct from the target
test("every distractor is sound-distinct from the target", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      const track = buildTrack(g, { difficulty: d, seed: 1 });
      for (const gate of track.gates) {
        if (gate.kind === "word" && !gate.correct) {
          assert.ok(
            !sharesSound(onsetGrapheme(gate.word), g),
            `${g}: distractor "${gate.word}" shares sound with target`
          );
        }
      }
    }
  }
});

// 4. Same seed -> identical track (determinism)
test("same seed produces an identical track", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      const t1 = buildTrack(g, { difficulty: d, seed: 42 });
      const t2 = buildTrack(g, { difficulty: d, seed: 42 });
      assert.equal(t1.totalLength, t2.totalLength, `${g}/${d}: totalLength mismatch`);
      assert.equal(t1.needed, t2.needed, `${g}/${d}: needed mismatch`);
      assert.equal(t1.gates.length, t2.gates.length, `${g}/${d}: gate count mismatch`);
      for (let i = 0; i < t1.gates.length; i += 1) {
        assert.deepStrictEqual(
          t1.gates[i],
          t2.gates[i],
          `${g}/${d}: gate ${i} differs between identical-seed runs`
        );
      }
    }
  }
});

// 5. Hard ladder includes blends, easy doesn't
test("hard ladder includes digraphs, easy ladder does not", () => {
  const hard = soundRacerLadder("hard");
  const easy = soundRacerLadder("easy");
  assert.ok(hard.some(isDigraph), "hard ladder should include a digraph");
  assert.ok(!easy.some(isDigraph), "easy ladder should avoid digraphs");
});

// 6. Every correct word truly begins with the target
test("every correct word truly begins with the target", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      const track = buildTrack(g, { difficulty: d, seed: 1 });
      for (const gate of track.gates) {
        if (gate.correct) {
          assert.equal(
            onsetGrapheme(gate.word),
            g,
            `${g}: correct word "${gate.word}" does not begin with ${g}`
          );
        }
      }
    }
  }
});

// 7. Obstacles never have a `word` property
test("obstacles never have a word property", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      const track = buildTrack(g, { difficulty: d, seed: 1 });
      for (const gate of track.gates) {
        if (gate.kind === "obstacle") {
          assert.ok(
            !("word" in gate),
            `${g}/${d}: obstacle has unexpected word property`
          );
        }
      }
    }
  }
});

// 8. No two gates occupy the same z position
test("no two gates occupy the same z position", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      for (const seed of [1, 7, 13]) {
        const track = buildTrack(g, { difficulty: d, seed });
        const zs = track.gates.map(gate => gate.z);
        const uniqueZs = new Set(zs);
        assert.equal(
          uniqueZs.size,
          zs.length,
          `${g}/${d}: ${zs.length - uniqueZs.size} duplicate z positions`
        );
      }
    }
  }
});

// 9. Tracks are long enough for a full lap and keep gates readable
test("tracks are paced as full 90-second laps with readable gate spacing", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      const track = buildTrack(g, { difficulty: d, seed: 7 });
      const sorted = track.gates.map(gate => gate.z).sort((a, b) => a - b);
      const gaps = sorted.slice(1).map((z, i) => z - sorted[i]);
      const minGap = Math.min(...gaps);
      const clearSeconds = idealClearSeconds(track, d);

      assert.ok(
        minGap >= 14,
        `${g}/${d}: expected gates at least 14 track units apart, got ${minGap}`
      );
      assert.ok(
        clearSeconds >= 90,
        `${g}/${d}: expected ideal clear time >= 90s, got ${clearSeconds.toFixed(1)}s`
      );
    }
  }
});

// 10. worldObstacles returns the expected obstacle type per world
test("worldObstacles maps worlds correctly", () => {
  assert.equal(worldObstacles("meadow"), "haybale");
  assert.equal(worldObstacles("dino"), "rock");
  assert.equal(worldObstacles("moonwood"), "cloudbank");
  assert.equal(worldObstacles("unknown"), "rock");
  assert.equal(worldObstacles("MEADOW"), "haybale");
});
