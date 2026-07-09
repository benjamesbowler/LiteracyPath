// Sentence Express - the level engine a flagship game stands on.
import test from "node:test";
import assert from "node:assert/strict";
import {
  DIFFICULTIES, LEVELS_PER_LINE, TRAINS_PER_LEVEL,
  buildTrain, buildLine, faultsForLevel, allBankWords
} from "../../src/utils/sentenceExpressLevels.js";
import { AUDIO_FILE_PATHS } from "../../src/data/generated/audioFilePaths.generated.js";
import { wordAudioPath } from "../../src/components/elQuest/elQuestEngine.js";

test("every line has 10 levels of 3 trains and every train is winnable", () => {
  for (const diff of DIFFICULTIES) {
    const line = buildLine(diff);
    assert.equal(line.length, LEVELS_PER_LINE);
    for (const level of line) {
      assert.equal(level.trains.length, TRAINS_PER_LEVEL);
      for (const train of level.trains) {
        assert.ok(train.words.length >= 3, `${train.id} too short`);
        // The solution is always recoverable: sidings contain every word index once.
        assert.deepEqual([...train.sidingOrder].sort((a, b) => a - b), train.words.map((_w, i) => i));
        if (train.engine) assert.ok(train.engine.options.includes(train.engine.correct));
        if (train.caboose) assert.ok(train.caboose.options.includes(train.endMark));
        if (train.rusty) assert.ok(train.rusty.options.includes(train.rusty.correct));
        if (train.gap) assert.ok(train.gap.options.includes(train.gap.correct));
      }
    }
  }
});

test("fault choices have exactly one correct option", () => {
  for (const diff of DIFFICULTIES) {
    for (const level of buildLine(diff)) {
      for (const train of level.trains) {
        if (train.engine) {
          const matches = train.engine.options.filter(o => o === train.engine.correct);
          assert.equal(matches.length, 1, `${train.id} engine`);
          assert.equal(new Set(train.engine.options.map(o => o.toLowerCase())).size, 1, "engine options differ only by case");
        }
        if (train.caboose) assert.equal(new Set(train.caboose.options).size, train.caboose.options.length);
        for (const fault of [train.rusty, train.gap].filter(Boolean)) {
          assert.equal(fault.options.filter(o => o === fault.correct).length, 1, `${train.id} unique fix`);
          // Distractors are real different words, never elsewhere in the sentence.
          const lower = train.words.map(w => w.toLowerCase());
          for (const o of fault.options) {
            if (o !== fault.correct) assert.ok(!lower.includes(o.toLowerCase()), `${train.id} distractor '${o}' appears in sentence`);
          }
        }
      }
    }
  }
});

test("order fault always scrambles (never hands over a solved train)", () => {
  for (const diff of DIFFICULTIES) {
    for (const level of buildLine(diff)) {
      for (const train of level.trains) {
        if (train.faults.includes("order")) {
          assert.ok(train.sidingOrder.some((v, i) => v !== i), `${train.id} arrived pre-solved`);
        }
      }
    }
  }
});

test("no sentence repeats within a line; builders are deterministic", () => {
  for (const diff of DIFFICULTIES) {
    const seen = new Set();
    for (const level of buildLine(diff)) {
      for (const train of level.trains) {
        const key = train.words.join(" ");
        assert.ok(!seen.has(key), `${diff}: '${key}' repeats`);
        seen.add(key);
      }
    }
    assert.deepEqual(buildTrain(diff, 4, 1), buildTrain(diff, 4, 1));
  }
});

test("ramp matches the design table (rusty/gap arrive on schedule)", () => {
  assert.deepEqual(faultsForLevel("easy", 0), ["order"]);
  assert.ok(!buildLine("easy").flatMap(l => l.trains).some(t => t.rusty), "easy line never uses rusty swaps");
  assert.ok(faultsForLevel("medium", 4).includes("rusty"));
  assert.ok(faultsForLevel("hard", 9).length >= 4, "hard finale stacks faults");
  for (const diff of DIFFICULTIES) {
    const line = buildLine(diff);
    assert.ok(line[9].isGoldRun);
    assert.ok(line[9].totalTargets >= line[0].totalTargets, "finale is not easier than level 1");
  }
});

test("hard mode uses question and exclamation cabooses, easy sticks to full stops", () => {
  const easyMarks = new Set(buildLine("easy").flatMap(l => l.trains).map(t => t.endMark));
  assert.deepEqual([...easyMarks], ["."]);
  const hardMarks = new Set(buildLine("hard").flatMap(l => l.trains).map(t => t.endMark));
  assert.ok(hardMarks.has("?") && hardMarks.has("!"));
});

test("every word the game can show has gold-voice audio", () => {
  const missing = allBankWords().filter(word => {
    const path = wordAudioPath(word);
    return !path || !AUDIO_FILE_PATHS.has(path);
  });
  assert.deepEqual(missing, [], `missing audio for: ${missing.join(", ")}`);
});
