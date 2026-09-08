import test from "node:test";
import assert from "node:assert/strict";
import {
  soundRacerLadder,
  buildTrack,
  buildSoundRacerEvidenceResult
} from "../../src/utils/soundRacerTracks.js";
import { buildRacerMission, createRacerState } from "../../src/utils/soundRacerMission.js";
import { createRacerSimulation, advanceRacerFrame } from "../../src/utils/soundRacerSimulation.js";
import { getChildAudioPath } from "../../src/data/childAssets.js";
import { AUDIO_FILE_PATHS } from "../../src/data/generated/audioFilePaths.generated.js";
import { getPreferredPhonemeAudioPath } from "../../src/data/phonemeAudioBank.js";
import {
  rocketRunTargets,
  wordStartsWithTargetSound
} from "../../src/utils/rocketRunRounds.js";
import { onsetGrapheme, sharesSound } from "../../src/components/elQuest/elQuestEngine.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";

const isDigraph = g => /^(sh|ch|th|ng|ck|qu)$/.test(g);
const hasRecordedWordAudio = word => [
  getLedaWordAudioPath(word),
  `/audio/child-mode/clean-human/words/${word}.mp3`,
  `/audio/child-mode/words/${word}.mp3`,
  `/audio/child-mode/clean-human/hfw/${word}.mp3`,
  `/audio/child-mode/hfw/${word}.mp3`,
  `/guided-reading/audio/words/${word}.mp3`,
  `/audio/vocabulary/${word}.mp3`
].some(path => AUDIO_FILE_PATHS.has(path));

// Cover every target Sound Racer can inherit from the sound ladder.
const TEST_TARGETS = rocketRunTargets();

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

test("every correct word stays inside its difficulty length band", () => {
  const ranges = { easy: [2, 4], medium: [3, 5], hard: [4, 6] };
  for (const [difficulty, [min, max]] of Object.entries(ranges)) {
    for (const g of soundRacerLadder(difficulty)) {
      for (const seed of [0, 7, 42]) {
        const correctWords = buildTrack(g, { difficulty, seed }).gates
          .filter(gate => gate.correct)
          .map(gate => gate.word);
        assert.equal(correctWords.length, 10, `${g}/${difficulty}/${seed} must have ten targets`);
        assert.ok(
          correctWords.every(word => word.length >= min && word.length <= max),
          `${g}/${difficulty}/${seed} left the ${min}-${max} letter band: ${correctWords.join(", ")}`
        );
      }
    }
  }
});

// 3. Every "word" gate marked correct:false is sound-distinct from the target
test("every distractor is sound-distinct from the target", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      for (const seed of [1, 2, 3, 9, 27, 57]) {
        const track = buildTrack(g, { difficulty: d, seed });
        for (const gate of track.gates) {
          if (gate.kind === "word" && !gate.correct) {
            assert.ok(
              !sharesSound(onsetGrapheme(gate.word), g),
              `${g}/${d}/${seed}: distractor "${gate.word}" shares sound with target`
            );
          }
        }
      }
    }
  }
});

test("alternate onset spellings never become false-negative gates", () => {
  for (const [target, difficulty, seed, forbidden] of [
    ["n", "medium", 2, "known"],
    ["r", "medium", 1, "wrote"],
    ["s", "medium", 9, "city"],
    ["y", "hard", 3, "europe"],
    ["y", "hard", 27, "unit"],
    ["wh", "hard", 57, "once"]
  ]) {
    const distractors = buildTrack(target, { difficulty, seed }).gates
      .filter(gate => gate.kind === "word" && !gate.correct)
      .map(gate => gate.word);
    assert.ok(!distractors.includes(forbidden), `${forbidden} must not be a /${target}/ distractor`);
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

test("the runtime mission tutorial example matches its current sound and has recorded audio", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (let trackIndex = 0; trackIndex < soundRacerLadder(difficulty).length; trackIndex += 1) {
      for (const seed of [0, 7, 42]) {
        const mission = buildRacerMission({ difficulty, trackIndex, seed });
        const exampleWord = mission.exampleWord;
        assert.equal(wordStartsWithTargetSound(exampleWord, mission.target), true);
        assert.ok(AUDIO_FILE_PATHS.has(getChildAudioPath(exampleWord)), `${difficulty}/${trackIndex}/${seed}: ${exampleWord} has no runtime example audio`);
        assert.equal(hasRecordedWordAudio(exampleWord), true, exampleWord);
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
test("every correct word begins with the exact target sound, not only its spelling", () => {
  for (const g of TEST_TARGETS) {
    for (const d of ["easy", "medium", "hard"]) {
      const track = buildTrack(g, { difficulty: d, seed: 1 });
      for (const gate of track.gates) {
        if (gate.correct) {
          assert.equal(wordStartsWithTargetSound(gate.word, g), true,
            `${g}: correct word "${gate.word}" does not begin with the production cue`);
        }
      }
    }
  }
});

test("ambiguous spellings never earn target-sound credit", () => {
  for (const [target, rejected] of Object.entries({
    c: ["city", "cent"],
    g: ["gem", "giant"],
    a: ["apron", "angle"],
    e: ["each", "even", "europe"],
    i: ["iron", "item", "invite"],
    o: ["only", "over", "ocean"],
    th: ["the", "them", "though", "that"]
  })) {
    for (const word of rejected) {
      assert.equal(wordStartsWithTargetSound(word, target), false, `${word} must not model ${target}`);
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

test("actual simulation holds a readable fork indefinitely without scoring movement", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const mission = buildRacerMission({ difficulty, trackIndex: 0, seed: 7 });
    let state = createRacerState(mission), sim = createRacerSimulation();
    for (let frame = 0; frame < 1200; frame += 1) {
      const next = advanceRacerFrame(sim, state, 250);
      sim = next.sim; state = next.state;
    }
    assert.equal(state.phase, "decision");
    assert.equal(sim.distance, mission.rounds[0].distance);
    assert.equal(state.index, 0);
    assert.deepEqual(state.evidence, []);
  }
});

test("every Sound Racer target has an exact approved replay phoneme", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const target of soundRacerLadder(difficulty)) {
      assert.ok(
        getPreferredPhonemeAudioPath(target),
        `${difficulty} target ${target} has no approved phoneme replay`
      );
    }
  }
});

test("race pressure never lowers Sound Racer literacy evidence", () => {
  const cleanRun = buildSoundRacerEvidenceResult({
    wordsCorrect: 10,
    wordsWrong: 0,
    missedCorrect: 0,
    obstaclesHit: 0,
    score: 1000,
    timeMs: 95_000
  });
  const recoveredRun = buildSoundRacerEvidenceResult({
    wordsCorrect: 10,
    wordsWrong: 0,
    missedCorrect: 7,
    obstaclesHit: 12,
    score: 740,
    timeMs: 130_000
  });

  assert.equal(cleanRun.accuracy, 100);
  assert.equal(recoveredRun.accuracy, cleanRun.accuracy);
  assert.equal(recoveredRun.stars, cleanRun.stars);
  assert.equal(recoveredRun.mistakes, 0);
  assert.deepEqual(recoveredRun.raceEvents, {
    missedTargetEvents: 7,
    obstacleHits: 12
  });
});

test("only a caught wrong word lowers Sound Racer literacy evidence", () => {
  const result = buildSoundRacerEvidenceResult({
    wordsCorrect: 9,
    wordsWrong: 1,
    missedCorrect: 4,
    obstaclesHit: 3
  });

  assert.equal(result.correct, 9);
  assert.equal(result.total, 10);
  assert.equal(result.mistakes, 1);
  assert.equal(result.accuracy, 90);
  assert.equal(result.stars, 2);
});
