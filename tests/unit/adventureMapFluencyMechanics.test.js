import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const componentUrl = new URL(
  "../../src/components/elQuest/mechanics/FluencyMechanics.jsx",
  import.meta.url
);
const stylesUrl = new URL(
  "../../src/styles/skills-block-quest.css",
  import.meta.url
);

async function loadState() {
  return import("../../src/components/elQuest/mechanics/fluencyMechanicState.js");
}

test("fluency components expose four distinct button-operated stages and live statuses", async () => {
  const source = await readFile(componentUrl, "utf8");

  for (const exportName of [
    "PatternSortMechanic",
    "WordChainMechanic",
    "PhraseFlowMechanic",
    "HeartWordMechanic"
  ]) {
    assert.match(source, new RegExp(`export function ${exportName}\\(`));
  }

  assert.deepEqual(
    [...source.matchAll(/data-mechanic-stage="([^"]+)"/g)].map(match => match[1]),
    ["pattern-sort", "word-chain", "phrase-flow", "heart-word-studio"]
  );
  assert.ok((source.match(/type="button"/g) || []).length >= 12);
  assert.ok((source.match(/role="status"/g) || []).length >= 4);
  assert.match(source, /aria-live="polite"/);
  assert.doesNotMatch(source, /<(?:div|span)[^>]+onClick=/);
});

test("Pattern Sort scores the declared transfer bin and retains every committed tile", async () => {
  const {
    createPatternSortState,
    selectPatternTile,
    placePatternTile,
    choosePatternTransfer
  } = await loadState();
  const round = {
    construct: "orthographic_pattern_sort",
    patternLabel: "start with sh",
    bins: [
      { id: "fits", label: "start with sh" },
      { id: "not", label: "do not start with sh" }
    ],
    items: [
      { word: "ship", fits: true },
      { word: "map", fits: false }
    ],
    transferWord: "map",
    transferFits: false,
    transferBinId: "not"
  };

  let state = createPatternSortState(round);
  assert.equal(placePatternTile(state, round, "fits").outcome, null);
  state = selectPatternTile(state, round).state;
  state = placePatternTile(state, round, "fits").state;
  assert.deepEqual(state.placements, [{ word: "ship", binId: "fits" }]);

  state = selectPatternTile(state, round).state;
  const wrong = placePatternTile(state, round, "fits");
  assert.equal(wrong.outcome.correct, false);
  assert.deepEqual(wrong.state.placements, [{ word: "ship", binId: "fits" }]);

  const sorted = placePatternTile(wrong.state, round, "not");
  assert.equal(sorted.state.stage, "transfer");
  assert.equal(
    sorted.state.feedback,
    "Every tile is sorted. Sort one new word using the same labelled bins."
  );
  assert.deepEqual(sorted.state.placements, [
    { word: "ship", binId: "fits" },
    { word: "map", binId: "not" }
  ]);

  const transferMiss = choosePatternTransfer(sorted.state, round, "fits", 1);
  assert.equal(transferMiss.outcome.correct, false);
  assert.equal(transferMiss.state.stage, "transfer");
  const transfer = choosePatternTransfer(transferMiss.state, round, "not", 1);
  assert.equal(transfer.state.stage, "complete");
  assert.deepEqual(transfer.state.transferPlacement, { word: "map", binId: "not" });
  assert.equal(
    transfer.state.feedback,
    "map does not fit “start with sh”, so it belongs in “do not start with sh”."
  );
  assert.deepEqual(transfer.outcome.evidence, {
    construct: "orthographic_pattern_sort",
    target: "start with sh",
    response: ["map", "not"],
    supportLevel: 1
  });
});

test("Pattern Sort reveals pattern marking only after a placement is committed", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /const visiblePlacements = state\.transferPlacement/);
  assert.match(source, /visiblePlacements[\s\S]*<MarkedWord word=\{placement\.word\}/);
  assert.match(source, /sbq-pattern-active-tile[\s\S]*\{activeItem\.word\}/);
  assert.match(source, /Put the new word <strong>\{round\.transferWord\}<\/strong>/);
  assert.doesNotMatch(source, /sbq-pattern-active-tile[\s\S]{0,300}<MarkedWord/);
  assert.doesNotMatch(source, /Put the new word <strong><MarkedWord/);
});

test("Word Chain commits the position before the grapheme and preserves the chain on misses", async () => {
  const {
    createWordChainState,
    selectChainPosition,
    replaceChainGrapheme
  } = await loadState();
  const round = {
    construct: "grapheme_substitution_chain",
    fromWord: "sat",
    toWord: "sit",
    fromGraphemes: ["s", "a", "t"],
    toGraphemes: ["s", "i", "t"],
    changeIndex: 1
  };

  let state = createWordChainState(round);
  const wrongPosition = selectChainPosition(state, round, 0);
  assert.equal(wrongPosition.outcome.correct, false);
  assert.deepEqual(wrongPosition.state.chain, ["sat"]);
  assert.equal(wrongPosition.state.stage, "position");
  assert.equal(wrongPosition.outcome.evidence.target, "sit");
  assert.deepEqual(wrongPosition.outcome.evidence.response, {
    grapheme: "s",
    position: 1
  });

  state = selectChainPosition(wrongPosition.state, round, 1).state;
  assert.equal(state.stage, "replacement");
  const wrongGrapheme = replaceChainGrapheme(state, round, "o");
  assert.equal(wrongGrapheme.outcome.correct, false);
  assert.deepEqual(wrongGrapheme.state.chain, ["sat"]);
  assert.deepEqual(wrongGrapheme.state.currentGraphemes, ["s", "a", "t"]);
  assert.equal(wrongGrapheme.outcome.evidence.target, "sit");
  assert.deepEqual(wrongGrapheme.outcome.evidence.response, {
    grapheme: "o",
    position: 2
  });

  const correct = replaceChainGrapheme(wrongGrapheme.state, round, "i", 2);
  assert.deepEqual(correct.state.chain, ["sat", "sit"]);
  assert.deepEqual(correct.state.currentGraphemes, ["s", "i", "t"]);
  assert.equal(correct.outcome.correct, true);
  assert.equal(correct.outcome.evidence.supportLevel, 2);
  assert.equal(correct.outcome.evidence.target, "sit");
  assert.deepEqual(correct.outcome.selected, { grapheme: "i", position: 2 });
  assert.deepEqual(correct.outcome.evidence.response, { grapheme: "i", position: 2 });
});

test("Phrase Flow uses one neutral word trail and records mandatory model support", async () => {
  const {
    createPhraseFlowState,
    choosePhraseBoundary,
    completePhraseModel,
    completePhraseEcho
  } = await loadState();
  const round = {
    construct: "supported_phrase_reading",
    phraseChunks: ["In the tree", "the small owl", "waits for dawn."],
    trailWords: ["In", "the", "tree", "the", "small", "owl", "waits", "for", "dawn."],
    correctBoundary: 4,
    boundaryChoices: [
      { position: 2, afterWord: "the" },
      { position: 4, afterWord: "tree" },
      { position: 7, afterWord: "owl" }
    ]
  };

  let state = createPhraseFlowState(round);
  assert.equal(state.stage, "boundary");
  assert.equal("revealedCount" in state, false);

  const wrongBoundary = choosePhraseBoundary(state, round, 2);
  assert.equal(wrongBoundary.outcome.correct, false);
  assert.equal(wrongBoundary.state.stage, "boundary");
  assert.match(wrongBoundary.state.feedback, /continuous word trail/i);
  assert.match(wrongBoundary.state.feedback, /first poetry line/i);
  state = choosePhraseBoundary(wrongBoundary.state, round, 4).state;
  assert.equal(state.stage, "model");
  assert.match(state.feedback, /first poetry line ends/i);
  state = completePhraseModel(state).state;
  assert.equal(state.stage, "echo");
  const completed = completePhraseEcho(state, round, 0);
  assert.equal(completed.state.stage, "complete");
  assert.equal(completed.outcome.correct, true);
  assert.deepEqual(completed.outcome.evidence, {
    construct: "supported_phrase_reading",
    target: "In the tree the small owl waits for dawn.",
    response: "model_echo_completed",
    supportLevel: 0,
    supportUsed: ["model", "echo"],
    measure: "support_only",
    independent: false
  });
  assert.equal("score" in completed.outcome.evidence, false);
  assert.equal("duration" in completed.outcome.evidence, false);
});

test("fluency accessibility labels expose graphemes and positions through a real screen-reader-only helper", async () => {
  const { heartSlotLabel, wordChainPositionLabel } = await loadState();

  assert.equal(wordChainPositionLabel("a", 1), "a, position 2");
  assert.equal(heartSlotLabel("g", 1, false), "g, position 2");
  assert.equal(
    heartSlotLabel("a", 2, true),
    "a, position 3, first differing position"
  );
  assert.equal(heartSlotLabel("", 3, false), "Empty grapheme slot, position 4");

  const source = await readFile(componentUrl, "utf8");
  const styles = await readFile(stylesUrl, "utf8");
  assert.match(source, /className="sbq-sr-only"/);
  assert.match(source, /\{wordChainPositionLabel\(grapheme, index\)\}/);
  assert.match(source, /\{heartSlotLabel\(shown, index, isDifference\)\}/);
  assert.match(styles, /\.sbq-sr-only\s*\{[^}]*position:\s*absolute;/s);
  assert.match(styles, /\.sbq-sr-only\s*\{[^}]*clip-path:\s*inset\(50%\);/s);
});

test("Heart Word hides its model, keeps the correct grapheme prefix, and repairs the first difference", async () => {
  const {
    createHeartWordState,
    hideHeartWord,
    addHeartGrapheme,
    revealHeartAttempt,
    repairHeartWord
  } = await loadState();
  const round = {
    construct: "orthographic_memory",
    word: "again",
    graphemes: ["a", "g", "a", "i", "n"]
  };

  let state = createHeartWordState(round);
  assert.equal(state.phase, "study");
  assert.equal(state.modelVisible, true);
  state = hideHeartWord(state).state;
  assert.equal(state.phase, "spell");
  assert.equal(state.modelVisible, false);

  for (const grapheme of ["a", "g", "i", "a", "n"]) {
    state = addHeartGrapheme(state, round, grapheme).state;
  }
  const reveal = revealHeartAttempt(state, round, 1);
  assert.equal(reveal.outcome.correct, false);
  assert.equal(reveal.state.phase, "repair");
  assert.equal(reveal.state.differingIndex, 2);
  assert.deepEqual(reveal.state.attempt, ["a", "g"]);
  assert.deepEqual(reveal.state.revealedDifference, { expected: "a", actual: "i" });
  assert.equal(reveal.state.modelVisible, false);

  const repairMiss = repairHeartWord(reveal.state, round, "i", 2);
  assert.equal(repairMiss.outcome.correct, false);
  assert.deepEqual(repairMiss.state.attempt, ["a", "g"]);
  state = repairHeartWord(repairMiss.state, round, "a", 2).state;
  assert.deepEqual(state.attempt, ["a", "g", "a"]);
  assert.equal(state.phase, "spell");
  for (const grapheme of ["i", "n"]) {
    state = addHeartGrapheme(state, round, grapheme).state;
  }
  const complete = revealHeartAttempt(state, round, 2);
  assert.equal(complete.outcome.correct, true);
  assert.equal(complete.state.phase, "complete");
  assert.equal("speed" in complete.outcome.evidence, false);
  assert.equal("duration" in complete.outcome.evidence, false);
});

test("fluency mechanics contain no timer, countdown, or automatic rate scoring", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.doesNotMatch(source, /setTimeout|setInterval|countdown|wordsPerMinute|wcpm/i);
});
