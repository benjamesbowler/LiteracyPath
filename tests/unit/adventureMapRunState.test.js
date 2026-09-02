import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdventureRun,
  recordAdventureOutcome,
  feedbackForOutcome,
  cycleQuestResult
} from "../../src/components/elQuest/adventureRunState.js";
import {
  buildStationRounds,
  stationsForCycle
} from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";

const GENERATED_CONSTRUCT_CASES = [
  ["visual_letter_identity", /big|small/],
  ["visual_grapheme_identity", /grapheme|pattern/],
  ["heard_phoneme_grapheme_mapping", /sound|choose/],
  ["heard_ending_sound_family_mapping", /ending|sound/],
  ["initial_phoneme_discrimination", /start/],
  ["ending_grapheme_pattern_discrimination", /end/],
  ["high_frequency_word_recognition", /whole word/],
  ["phoneme_grapheme_encoding", /build|sound/],
  ["onset_substitution", /change|word parts/],
  ["onset_removal", /remove|word parts/],
  ["compound_word_joining", /join|word parts/],
  ["connected_print_tracking", /printed|line/],
  ["supported_cover_title_association", /title|cover/],
  ["letter_formation_practice", /trace/],
  ["grapheme_pattern_formation_practice", /trace/],
  ["orthographic_pattern_sort", /ending|pattern|target/],
  ["grapheme_substitution_chain", /change|grapheme|word/],
  ["supported_phrase_reading", /phrase|line/],
  ["orthographic_memory", /whole heart word|memory|spell/]
];

test("a recovered item keeps its failed first attempt", () => {
  let state = createAdventureRun(2);
  state = recordAdventureOutcome(state, { roundIndex: 0, correct: false, selected: "m" });
  state = recordAdventureOutcome(state, { roundIndex: 0, correct: true, selected: "s" });
  assert.equal(state.firstAttempts[0], false);
  assert.equal(state.completed, 1);
  assert.equal(cycleQuestResult(state).stars, 1);
});

test("a supported correct completion never becomes an independent first attempt", () => {
  let state = createAdventureRun(1);
  state = recordAdventureOutcome(state, {
    roundIndex: 0,
    correct: true,
    selected: "model_echo_completed",
    evidence: {
      independent: false,
      supportLevel: 0,
      supportUsed: ["model", "echo"],
      measure: "support_only"
    }
  });

  assert.deepEqual(state.firstAttempts, [false]);
  assert.deepEqual(state.completedRounds, [true]);
  assert.equal(state.completed, 1);
  assert.equal(state.recoveries, 0);
  assert.deepEqual(cycleQuestResult(state), { stars: 1, independentPercent: 0 });
});

test("seven of ten independent first attempts earn two stars", () => {
  const result = cycleQuestResult({ total: 10, completed: 10, firstAttempts: [true, true, true, true, true, true, true, false, false, false] });
  assert.deepEqual(result, { stars: 2, independentPercent: 70 });
});

test("recording an outcome does not mutate the prior run", () => {
  const state = createAdventureRun(1);
  const next = recordAdventureOutcome(state, { roundIndex: 0, correct: true, selected: "s" });
  assert.notEqual(next, state);
  assert.deepEqual(state.firstAttempts, [null]);
  assert.equal(state.completed, 0);
  assert.deepEqual(next.firstAttempts, [true]);
  assert.equal(next.completed, 1);
});

test("feedback names the selected onset and the target contrast", () => {
  const round = {
    construct: "initial_phoneme_discrimination",
    targetGrapheme: "s",
    answer: "sun",
    objects: [
      { word: "moon", matches: false },
      { word: "sun", matches: true }
    ]
  };
  assert.equal(
    feedbackForOutcome(round, { correct: false, selected: "m" }, 1),
    "m starts moon. Listen for /s/ at the start of sun."
  );
});

test("feedback remains construct-specific on later coaching attempts", () => {
  const round = {
    construct: "ending_grapheme_pattern_discrimination",
    targetGrapheme: "ng",
    answer: "ring"
  };
  const feedback = feedbackForOutcome(round, { correct: false, selected: "ball" }, 2);
  assert.match(feedback, /ball/);
  assert.match(feedback, /ng/);
  assert.match(feedback, /end/);
  assert.doesNotMatch(feedback, /Almost! Try again\./);
});

test("Pattern Sort feedback truthfully names fit and non-fit relationships", () => {
  const round = {
    construct: "orthographic_pattern_sort",
    patternLabel: "start with sh",
    bins: [
      { id: "not", label: "do not start with sh" },
      { id: "fits", label: "start with sh" }
    ],
    items: [
      { word: "ship", fits: true },
      { word: "map", fits: false }
    ],
    transferWord: "sun",
    transferFits: false,
    transferBinId: "not"
  };

  assert.equal(
    feedbackForOutcome(round, { correct: true, selected: ["ship", "fits"] }, 1),
    "Yes — ship fits “start with sh” and belongs in “start with sh”."
  );
  assert.equal(
    feedbackForOutcome(round, { correct: true, selected: ["sun", "not"] }, 1),
    "Yes — sun does not fit “start with sh” and belongs in “do not start with sh”."
  );
  assert.equal(
    feedbackForOutcome(round, { correct: false, selected: ["ship", "not"] }, 1),
    "ship fits “start with sh”. Put it in “start with sh”."
  );
  assert.equal(
    feedbackForOutcome(round, { correct: false, selected: ["map", "fits"] }, 2),
    "map does not fit “start with sh”. Put it in “do not start with sh”."
  );
});

test("Phrase Flow coaching names the continuous word trail and authored poetry-line boundary", () => {
  const round = {
    construct: "supported_phrase_reading",
    trailWords: ["Fern", "flies", "high,", "and", "waves", "goodbye."],
    correctBoundary: 3
  };

  for (const attempt of [1, 2]) {
    const feedback = feedbackForOutcome(round, { correct: false, selected: 4 }, attempt);
    assert.match(feedback, /continuous word trail/i);
    assert.match(feedback, /first poetry line/i);
    assert.doesNotMatch(feedback, /phrase chunk|phrase line/i);
  }
});

test("a failed item without supported recovery earns no star", () => {
  const result = cycleQuestResult({
    total: 2,
    completed: 1,
    recoveries: 0,
    firstAttempts: [false, null]
  });
  assert.equal(result.stars, 0);
});

test("feedback coverage matches every construct currently generated by Adventure Map", () => {
  const generatedConstructs = new Set();
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    for (const station of stationsForCycle(cycle)) {
      for (const round of buildStationRounds(cycle, station.id)) {
        generatedConstructs.add(round.construct);
      }
    }
  }

  assert.deepEqual(
    [...generatedConstructs].sort(),
    GENERATED_CONSTRUCT_CASES.map(([construct]) => construct).sort()
  );
});

function failedOutcomeForRound(round) {
  if (round.construct === "orthographic_pattern_sort") {
    const wrong = round.items.find(item => !item.fits);
    return { correct: false, selected: [wrong?.word || "wrong word"] };
  }
  if (round.construct === "supported_cover_title_association") {
    const wrong = round.covers.find(cover => !cover.matches);
    return { correct: false, selected: wrong || { title: "wrong cover" } };
  }
  if (round.construct === "letter_formation_practice"
    || round.construct === "grapheme_pattern_formation_practice") {
    return { correct: false, selected: "outside the guide", dimension: "direction" };
  }
  throw new Error(`No failed outcome fixture for ${round.construct}`);
}

test("real pattern, cover-title, and trace rounds name the selected response and exact target across all 27 cycles", () => {
  const relevantConstructs = new Set([
    "orthographic_pattern_sort",
    "supported_cover_title_association",
    "letter_formation_practice",
    "grapheme_pattern_formation_practice"
  ]);
  const visitedCycles = new Set();
  const seenConstructs = new Set();
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    visitedCycles.add(cycle.cycleNumber);
    for (const station of stationsForCycle(cycle).filter(item => item.id !== "check")) {
      for (const round of buildStationRounds(cycle, station.id)) {
        if (!relevantConstructs.has(round.construct)) continue;
        seenConstructs.add(round.construct);
        const outcome = failedOutcomeForRound(round);
        const feedback = feedbackForOutcome(round, outcome, 1);
        assert.doesNotMatch(feedback, /the target word|target sound/i);
        if (round.construct === "orthographic_pattern_sort") {
          assert.match(feedback, new RegExp(round.patternLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
          assert.match(feedback, new RegExp(String(outcome.selected[0]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
        }
        if (round.construct === "supported_cover_title_association") {
          assert.match(feedback, new RegExp(round.strip.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
          assert.match(feedback, new RegExp(round.targetCover.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
          assert.match(feedback, new RegExp(outcome.selected.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
        }
        if (round.construct === "letter_formation_practice"
          || round.construct === "grapheme_pattern_formation_practice") {
          assert.match(feedback, new RegExp(round.letter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
          assert.match(feedback, /outside the guide/i);
        }
      }
    }
  }
  assert.deepEqual(
    [...visitedCycles],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]
  );
  assert.deepEqual([...seenConstructs].sort(), [...relevantConstructs].sort());
});
