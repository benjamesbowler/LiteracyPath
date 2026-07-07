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

// We test a representative subset of targets so the suite runs quickly,
// but we still cover every difficulty and multiple seeds.
const TEST_TARGETS = rocketRunTargets().slice(0, 8);

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

// 2. Every "word" gate marked correct:false is sound-distinct from the target
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

// 3. Same seed → identical track (determinism)
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

// 4. Hard ladder includes blends, easy doesn't
test("hard ladder includes digraphs, easy ladder does not", () => {
  const hard = soundRacerLadder("hard");
  const easy = soundRacerLadder("easy");
  assert.ok(hard.some(isDigraph), "hard ladder should include a digraph");
  assert.ok(!easy.some(isDigraph), "easy ladder should avoid digraphs");
});

// 5. Every correct word truly begins with the target
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

// 6. Obstacles never have a `word` property
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

// 7. No two gates occupy the same z position
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

// 8. worldObstacles returns the expected obstacle type per world
test("worldObstacles maps worlds correctly", () => {
  assert.equal(worldObstacles("meadow"), "haybale");
  assert.equal(worldObstacles("dino"), "rock");
  assert.equal(worldObstacles("moonwood"), "cloudbank");
  assert.equal(worldObstacles("unknown"), "rock");
  assert.equal(worldObstacles("MEADOW"), "haybale");
});
