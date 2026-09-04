import test from "node:test";
import assert from "node:assert/strict";
import {
  correctionModelForOutcome,
  createAdventureRun,
  recordAdventureOutcome,
  feedbackForCommittedOutcome,
  feedbackForOutcome,
  cycleQuestResult
} from "../../src/components/elQuest/adventureRunState.js";
import {
  buildStationRounds,
  stationsForCycle
} from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import {
  commitSoundBoxPlacement,
  createSoundBoxesState
} from "../../src/components/elQuest/mechanics/wordMechanicState.js";
import {
  createWordChainState,
  replaceChainGrapheme,
  selectChainPosition
} from "../../src/components/elQuest/mechanics/fluencyMechanicState.js";

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
  const feedback = feedbackForOutcome(round, { correct: false, selected: "m" }, 1);
  assert.match(feedback, /remove moon/i);
  assert.match(feedback, /tag sun/i);
  assert.match(feedback, /\/s\//i);
});

test("feedback remains construct-specific on later coaching attempts", () => {
  const round = {
    construct: "ending_grapheme_pattern_discrimination",
    targetGrapheme: "ng",
    answer: "ring",
    objects: [
      { word: "ball", matches: false },
      { word: "ring", matches: true }
    ]
  };
  const feedback = feedbackForOutcome(round, { correct: false, selected: "ball" }, 2);
  assert.match(feedback, /ring/);
  assert.match(feedback, /ng/);
  assert.match(feedback, /end/);
  assert.doesNotMatch(feedback, /Almost! Try again\./);
});

test("committed misses use three escalating controller tiers before a child repeats the action", () => {
  const round = {
    construct: "heard_phoneme_grapheme_mapping",
    targetGrapheme: "s",
    answer: "s"
  };
  const outcome = {
    correct: false,
    selected: "m",
    feedback: "A fixed mechanic message that must not mask coaching."
  };
  const messages = [1, 2, 3].map(attempt => (
    feedbackForCommittedOutcome(round, outcome, attempt)
  ));

  assert.equal(new Set(messages).size, 3);
  assert.match(messages[0], /you chose m/i);
  assert.match(messages[1], /say the sound slowly/i);
  assert.match(messages[2], /watch the correct model/i);
  assert.ok(messages.every(message => /s/.test(message)));
  assert.equal(
    feedbackForCommittedOutcome(round, { ...outcome, correct: true, feedback: "The gate opened." }, 4),
    "The gate opened."
  );
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
    "Compare map with “start with sh”; the pattern is missing, so choose “do not start with sh”."
  );
});

test("Code Spot uses the truthful bin relationship for both kinds of miss", () => {
  const round = {
    mechanicId: "patternSort",
    construct: "visual_grapheme_identity",
    targetGrapheme: "sh",
    patternLabel: "has sh",
    bins: [
      { id: "fits", label: "has sh" },
      { id: "not", label: "does not have sh" }
    ],
    items: [
      { word: "ship", fits: true },
      { word: "map", fits: false }
    ]
  };

  assert.equal(
    feedbackForOutcome(round, { correct: false, selected: ["ship", "not"] }, 1),
    "ship fits “has sh”. Put it in “has sh”."
  );
  assert.equal(
    feedbackForOutcome(round, { correct: false, selected: ["map", "fits"] }, 1),
    "map does not fit “has sh”. Put it in “does not have sh”."
  );
});

test("Scene Hunt correction names extra and missing tags without inventing a choice", () => {
  const initialRound = {
    construct: "initial_phoneme_discrimination",
    targetGrapheme: "a",
    objects: [
      { word: "apple", matches: true },
      { word: "sink", matches: false }
    ]
  };
  const mixed = feedbackForOutcome(initialRound, {
    correct: false,
    selected: ["apple", "sink"]
  }, 1);
  assert.match(mixed, /remove sink/i);
  assert.doesNotMatch(mixed, /remove apple/i);

  const empty = feedbackForOutcome(initialRound, { correct: false, selected: [] }, 1);
  assert.match(empty, /tagged no pictures/i);
  assert.match(empty, /tag apple/i);
  assert.doesNotMatch(empty, /the word you chose/i);

  const endingRound = {
    construct: "ending_grapheme_pattern_discrimination",
    targetGrapheme: "nk",
    objects: [
      { word: "pink", matches: true },
      { word: "bank", matches: true },
      { word: "moon", matches: false }
    ]
  };
  const missing = feedbackForOutcome(endingRound, {
    correct: false,
    selected: ["pink"]
  }, 1);
  assert.match(missing, /tag bank/i);
  assert.doesNotMatch(missing, /pink does not/i);
});

test("Sound Boxes correction names the tile, exact box, and expected grapheme", () => {
  const round = {
    construct: "phoneme_grapheme_encoding",
    word: "sat",
    graphemes: ["s", "a", "t"]
  };
  let outcome;
  const state = createSoundBoxesState(round);
  const wrongTile = state.tiles.find(tile => tile.grapheme === "t");
  commitSoundBoxPlacement(state, wrongTile.id, round, value => { outcome = value; });
  const feedback = feedbackForCommittedOutcome(round, outcome, 1);
  assert.match(feedback, /t does not fit sound box 1/i);
  assert.match(feedback, /put s in that box/i);
  assert.doesNotMatch(feedback, /t is not the word/i);
});

test("Word Chain correction distinguishes a wrong position from a wrong replacement", () => {
  const round = {
    construct: "grapheme_substitution_chain",
    fromWord: "man",
    toWord: "mat",
    fromGraphemes: ["m", "a", "n"],
    toGraphemes: ["m", "a", "t"],
    changeIndex: 2,
    answer: "t",
    choices: ["t", "s"]
  };
  const initial = createWordChainState(round);
  const wrongPosition = selectChainPosition(initial, round, 0).outcome;
  const positionFeedback = feedbackForCommittedOutcome(round, wrongPosition, 1);
  assert.match(positionFeedback, /m at position 1/i);
  assert.match(positionFeedback, /position 3 changes/i);

  const replacementStage = selectChainPosition(initial, round, 2).state;
  const wrongReplacement = replaceChainGrapheme(replacementStage, round, "s").outcome;
  const replacementFeedback = feedbackForCommittedOutcome(round, wrongReplacement, 1);
  assert.match(replacementFeedback, /s at position 3/i);
  assert.match(replacementFeedback, /use t/i);
});

test("third-tier models carry the actual cover, compound chunks, and native formation route", () => {
  const coverModel = correctionModelForOutcome({
    mechanicId: "coverClue",
    construct: "supported_cover_title_association",
    strip: { text: "Tiny and Brave" },
    targetCover: { title: "Tiny and Brave", cover: "/tiny.webp" }
  }, { correct: false, selected: "Moon Picnic" });
  assert.equal(coverModel.image.src, "/tiny.webp");
  assert.equal(coverModel.image.alt, "Cover for Tiny and Brave");
  assert.deepEqual(coverModel.units, ["Tiny and Brave", "→"]);

  const compoundModel = correctionModelForOutcome({
    mechanicId: "wordMachine",
    construct: "compound_word_joining",
    beforeWord: "sun + set",
    afterWord: "sunset",
    beforeGraphemes: ["s", "u", "n", "+", "s", "e", "t"]
  }, { correct: false, selected: "sun" });
  assert.deepEqual(compoundModel.units, ["sun + set", "→", "sunset"]);

  const traceModel = correctionModelForOutcome({
    mechanicId: "letterTrace",
    construct: "letter_formation_practice",
    letter: "A"
  }, { correct: false, selected: "A", errorDimension: "direction" });
  assert.equal(traceModel.mode, "native-formation");
  assert.match(traceModel.instruction, /each stroke.*in order/i);
});

test("Phrase Flow coaching names the continuous word trail and authored poetry-line boundary", () => {
  const round = {
    construct: "supported_phrase_reading",
    trailWords: ["Fern", "flies", "high,", "and", "waves", "goodbye."],
    correctBoundary: 3,
    boundaryChoices: [
      { position: 3, afterWord: "high," },
      { position: 4, afterWord: "and" }
    ]
  };

  for (const attempt of [1, 2]) {
    const feedback = feedbackForOutcome(round, { correct: false, selected: 4 }, attempt);
    assert.match(feedback, /continuous word trail/i);
    assert.match(feedback, /first poetry line/i);
    assert.match(feedback, /after “and”/i);
    assert.doesNotMatch(feedback, /after word 4/i);
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

test("every generated mechanic can provide a structured visible correction model", () => {
  const seenMechanics = new Set();
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    for (const station of stationsForCycle(cycle).filter(item => item.id !== "check")) {
      for (const round of buildStationRounds(cycle, station.id)) {
        seenMechanics.add(round.mechanicId);
        const firstItem = round.items?.[0]?.word || round.objects?.[0]?.word || "wrong";
        const model = correctionModelForOutcome(round, {
          correct: false,
          selected: [firstItem, "not"]
        });
        assert.ok(model, `${cycle.id}/${station.id}/${round.mechanicId}`);
        assert.equal(model.label, "Correct model");
        assert.ok(model.instruction.length > 0);
        assert.ok(model.units.length > 0);
        assert.ok(model.units.every(Boolean));
      }
    }
  }
  assert.deepEqual([...seenMechanics].sort(), [
    "heartWord",
    "letterPair",
    "letterTrace",
    "patternSort",
    "phraseFlow",
    "poemSpotlight",
    "sceneHunt",
    "soundBoxes",
    "soundGate",
    "wordChain",
    "wordMachine",
    "wordWindow"
  ]);
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
