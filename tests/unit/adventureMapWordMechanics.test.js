import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  createAdventureRun,
  recordAdventureOutcome
} from "../../src/components/elQuest/adventureRunState.js";
import {
  buildStationRounds,
  stationsForCycle,
  wordAudioPath
} from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import {
  buildSoundBoxesOutcome,
  buildWordMachineOutcome,
  buildWordWindowOutcome,
  commitSoundBoxPlacement,
  createSoundBoxesState,
  createWordMachineState,
  createWordWindowState,
  machinePiecesForRound,
  reduceSoundBoxes,
  reduceWordMachine,
  reduceWordWindow,
  soundBoxesStateForRound,
  wordMachineStateForRound,
  wordWindowStateForRound
} from "../../src/components/elQuest/mechanics/wordMechanicState.js";

const noop = () => {};
let SoundBoxesMechanic;
let WordMachineMechanic;
let WordWindowMechanic;
let vite;

const wordWindowRound = Object.freeze({
  mechanicId: "wordWindow",
  construct: "high_frequency_word_recognition",
  studyWord: "said",
  choices: ["said", "sad", "say"],
  answer: "said"
});

const soundBoxesRound = Object.freeze({
  mechanicId: "soundBoxes",
  construct: "phoneme_grapheme_encoding",
  word: "ship",
  graphemes: ["sh", "i", "p"]
});

const substituteRound = Object.freeze({
  mechanicId: "wordMachine",
  construct: "onset_substitution",
  operation: "substituteOnset",
  beforeWord: "cat",
  afterWord: "sat",
  beforeGraphemes: ["c", "a", "t"],
  afterGraphemes: ["s", "a", "t"],
  choiceGraphemes: [
    { word: "cat", graphemes: ["c", "a", "t"] },
    { word: "sat", graphemes: ["s", "a", "t"] },
    { word: "sit", graphemes: ["s", "i", "t"] }
  ]
});

const removeRound = Object.freeze({
  mechanicId: "wordMachine",
  construct: "onset_removal",
  operation: "removeOnset",
  beforeWord: "spin",
  afterWord: "pin",
  beforeGraphemes: ["s", "p", "i", "n"],
  afterGraphemes: ["p", "i", "n"]
});

const joinRound = Object.freeze({
  mechanicId: "wordMachine",
  construct: "compound_word_joining",
  operation: "joinCompound",
  beforeWord: "sun + set",
  afterWord: "sunset",
  beforeGraphemes: ["s", "u", "n", "+", "s", "e", "t"],
  afterGraphemes: ["s", "u", "n", "s", "e", "t"]
});

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({
    SoundBoxesMechanic,
    WordMachineMechanic,
    WordWindowMechanic
  } = await vite.ssrLoadModule(
    "/src/components/elQuest/mechanics/WordMechanics.jsx"
  ));
});

test.after(async () => {
  await vite?.close();
});

function render(Component, round, props = {}) {
  return renderToStaticMarkup(React.createElement(Component, {
    round,
    disabled: false,
    supportLevel: 0,
    onCommit: noop,
    onRequestReplay: noop,
    reducedMotion: false,
    ...props
  }));
}

function editDistance(left, right) {
  const a = String(left);
  const b = String(right);
  const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let index = 0; index <= a.length; index += 1) rows[index][0] = index;
  for (let index = 0; index <= b.length; index += 1) rows[0][index] = index;
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1)
      );
    }
  }
  return rows[a.length][b.length];
}

function withSeed(seed, callback) {
  const original = Math.random;
  let value = seed >>> 0;
  Math.random = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
  try {
    return callback();
  } finally {
    Math.random = original;
  }
}

test("Word Window blocks choices until the study shutter is closed", () => {
  const study = createWordWindowState(wordWindowRound, 0);
  const blocked = reduceWordWindow(study, { type: "SELECT", value: "said" }, wordWindowRound);
  assert.deepEqual(blocked, study);

  const choosing = reduceWordWindow(study, { type: "CLOSE" }, wordWindowRound);
  assert.equal(choosing.phase, "choose");
  const committed = reduceWordWindow(choosing, { type: "SELECT", value: "said" }, wordWindowRound);
  assert.equal(committed.phase, "committed");
  assert.equal(committed.selected, "said");
});

test("Word Window waits for Reveal before emitting a correct recognition outcome", () => {
  const study = createWordWindowState(wordWindowRound, 0);
  const choosing = reduceWordWindow(study, { type: "CLOSE" }, wordWindowRound);
  assert.deepEqual(
    reduceWordWindow(choosing, { type: "REVEAL" }, wordWindowRound),
    choosing
  );

  const committed = reduceWordWindow(choosing, { type: "SELECT", value: "said" }, wordWindowRound);
  assert.equal(buildWordWindowOutcome(wordWindowRound, committed), null);

  const revealed = reduceWordWindow(committed, { type: "REVEAL" }, wordWindowRound);
  const outcome = buildWordWindowOutcome(wordWindowRound, revealed);
  assert.deepEqual(outcome, {
    correct: true,
    selected: "said",
    feedback: "You remembered the whole word said.",
    evidence: {
      construct: "high_frequency_word_recognition",
      target: "said",
      response: "said",
      supportLevel: 0,
      independent: true
    }
  });

  assert.equal(revealed.phase, "revealed");
});

test("Word Window replay or reopening raises support and prevents an independent claim", () => {
  const replayed = reduceWordWindow(
    createWordWindowState(wordWindowRound, 0),
    { type: "REQUEST_REPLAY" },
    wordWindowRound
  );
  const choosing = reduceWordWindow(replayed, { type: "CLOSE" }, wordWindowRound);
  const reopened = reduceWordWindow(choosing, { type: "REOPEN" }, wordWindowRound);
  const closedAgain = reduceWordWindow(reopened, { type: "CLOSE" }, wordWindowRound);
  const committed = reduceWordWindow(closedAgain, { type: "SELECT", value: "said" }, wordWindowRound);
  const revealed = reduceWordWindow(committed, { type: "REVEAL" }, wordWindowRound);
  const outcome = buildWordWindowOutcome(wordWindowRound, revealed);

  assert.equal(reopened.phase, "study");
  assert.equal(outcome.evidence.supportLevel, 2);
  assert.equal(outcome.evidence.independent, false);
});

test("top-frame audio support is retained by every reducer-based word mechanic", () => {
  let windowState = wordWindowStateForRound(
    createWordWindowState(wordWindowRound, 0),
    wordWindowRound,
    1
  );
  windowState = reduceWordWindow(windowState, { type: "CLOSE" }, wordWindowRound);
  windowState = reduceWordWindow(windowState, { type: "SELECT", value: "said" }, wordWindowRound);
  windowState = reduceWordWindow(windowState, { type: "REVEAL" }, wordWindowRound);
  assert.equal(buildWordWindowOutcome(wordWindowRound, windowState).evidence.supportLevel, 1);

  let boxesState = soundBoxesStateForRound(
    createSoundBoxesState(soundBoxesRound, 0),
    soundBoxesRound,
    2
  );
  for (const grapheme of soundBoxesRound.graphemes) {
    const tile = boxesState.tiles.find(item => (
      item.grapheme === grapheme && !boxesState.usedTileIds.includes(item.id)
    ));
    boxesState = reduceSoundBoxes(boxesState, { type: "PLACE_TILE", tileId: tile.id }, soundBoxesRound);
  }
  boxesState = reduceSoundBoxes(boxesState, { type: "CHECK" }, soundBoxesRound);
  assert.equal(buildSoundBoxesOutcome(soundBoxesRound, boxesState).evidence.supportLevel, 2);

  let machineState = wordMachineStateForRound(
    createWordMachineState(substituteRound, 0),
    substituteRound,
    3
  );
  const targetPiece = machinePiecesForRound(substituteRound).find(piece => piece.matches);
  machineState = reduceWordMachine(
    machineState,
    { type: "SELECT_PIECE", pieceId: targetPiece.id },
    substituteRound
  );
  machineState = reduceWordMachine(machineState, { type: "COMMIT" }, substituteRound);
  assert.equal(buildWordMachineOutcome(substituteRound, machineState).evidence.supportLevel, 3);
});

test("Word Window supports wrong reveal, explicit retry, and later supported success", () => {
  let state = createWordWindowState(wordWindowRound, 0);
  state = reduceWordWindow(state, { type: "CLOSE" }, wordWindowRound);
  state = reduceWordWindow(state, { type: "SELECT", value: "sad" }, wordWindowRound);
  assert.equal(buildWordWindowOutcome(wordWindowRound, state), null);
  state = reduceWordWindow(state, { type: "REVEAL" }, wordWindowRound);
  const wrong = buildWordWindowOutcome(wordWindowRound, state);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.evidence.independent, false);

  state = reduceWordWindow(state, { type: "RETRY" }, wordWindowRound);
  assert.equal(state.phase, "choose");
  assert.equal(state.supportLevel, 1);
  assert.equal(state.selected, null);
  state = reduceWordWindow(state, { type: "SELECT", value: "said" }, wordWindowRound);
  state = reduceWordWindow(state, { type: "REVEAL" }, wordWindowRound);
  const recovered = buildWordWindowOutcome(wordWindowRound, state);
  assert.equal(recovered.correct, true);
  assert.equal(recovered.evidence.supportLevel, 1);
  assert.equal(recovered.evidence.independent, false);
});

test("Word Window reveal isolates the differing orthographic sequence", () => {
  let state = createWordWindowState(wordWindowRound, 0);
  state = reduceWordWindow(state, { type: "CLOSE" }, wordWindowRound);
  state = reduceWordWindow(state, { type: "SELECT", value: "sad" }, wordWindowRound);
  state = reduceWordWindow(state, { type: "REVEAL" }, wordWindowRound);
  assert.deepEqual(state.difference, {
    prefix: "sa",
    selectedDifference: "",
    targetDifference: "i",
    suffix: "d"
  });
});

test("Sound Boxes creates one slot per declared grapheme and stable duplicate tile ids", () => {
  const state = createSoundBoxesState({
    ...soundBoxesRound,
    word: "mammal",
    graphemes: ["m", "a", "m", "m", "a", "l"]
  }, 0);

  assert.equal(state.slots.length, 6);
  assert.deepEqual(state.tiles.map(tile => tile.grapheme), ["l", "a", "m", "m", "a", "m"]);
  assert.equal(new Set(state.tiles.map(tile => tile.id)).size, 6);
  assert.deepEqual(
    state.tiles.filter(tile => tile.grapheme === "m").map(tile => tile.id).sort(),
    ["grapheme-m-1", "grapheme-m-2", "grapheme-m-3"]
  );
});

test("Sound Boxes keeps a correct grapheme prefix after a wrong tile", () => {
  let state = createSoundBoxesState(soundBoxesRound, 0);
  const shTile = state.tiles.find(tile => tile.grapheme === "sh");
  const pTile = state.tiles.find(tile => tile.grapheme === "p");
  state = reduceSoundBoxes(state, { type: "PLACE_TILE", tileId: shTile.id }, soundBoxesRound);
  const afterWrong = reduceSoundBoxes(state, { type: "PLACE_TILE", tileId: pTile.id }, soundBoxesRound);

  assert.equal(afterWrong.slots[0].grapheme, "sh");
  assert.equal(afterWrong.slots[1], null);
  assert.equal(afterWrong.supportLevel, 1);
  assert.match(afterWrong.status, /p.*sound box 2.*i/i);
});

test("Sound Boxes emits a failed tile outcome and a supported recovery to Adventure run state", () => {
  let boxes = createSoundBoxesState(soundBoxesRound, 0);
  let run = createAdventureRun(1);
  const shTile = boxes.tiles.find(tile => tile.grapheme === "sh");
  const pTile = boxes.tiles.find(tile => tile.grapheme === "p");
  boxes = reduceSoundBoxes(boxes, { type: "PLACE_TILE", tileId: shTile.id }, soundBoxesRound);
  boxes = reduceSoundBoxes(boxes, { type: "PLACE_TILE", tileId: pTile.id }, soundBoxesRound);
  const wrong = buildSoundBoxesOutcome(soundBoxesRound, boxes);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.selected, "p");
  assert.equal(wrong.evidence.expectedGrapheme, "i");
  assert.equal(wrong.evidence.independent, false);
  run = recordAdventureOutcome(run, { roundIndex: 0, ...wrong });

  for (const grapheme of ["i", "p"]) {
    const tile = boxes.tiles.find(item => (
      item.grapheme === grapheme && !boxes.usedTileIds.includes(item.id)
    ));
    boxes = reduceSoundBoxes(boxes, { type: "PLACE_TILE", tileId: tile.id }, soundBoxesRound);
  }
  boxes = reduceSoundBoxes(boxes, { type: "CHECK" }, soundBoxesRound);
  const recovered = buildSoundBoxesOutcome(soundBoxesRound, boxes);
  assert.equal(recovered.correct, true);
  assert.equal(recovered.evidence.supportLevel, 1);
  assert.equal(recovered.evidence.independent, false);
  run = recordAdventureOutcome(run, { roundIndex: 0, ...recovered });

  assert.deepEqual(run.firstAttempts, [false]);
  assert.equal(run.completed, 1);
  assert.equal(run.recoveries, 1);
});

test("Sound Boxes wrong-tile event calls onCommit with semantic false evidence", () => {
  assert.equal(typeof commitSoundBoxPlacement, "function");
  const commits = [];
  let boxes = createSoundBoxesState(soundBoxesRound, 0);
  const shTile = boxes.tiles.find(tile => tile.grapheme === "sh");
  const pTile = boxes.tiles.find(tile => tile.grapheme === "p");
  boxes = commitSoundBoxPlacement(boxes, shTile.id, soundBoxesRound, outcome => commits.push(outcome));
  boxes = commitSoundBoxPlacement(boxes, pTile.id, soundBoxesRound, outcome => commits.push(outcome));

  assert.equal(commits.length, 1);
  assert.equal(commits[0].correct, false);
  assert.equal(commits[0].selected, "p");
  assert.equal(commits[0].evidence.construct, "phoneme_grapheme_encoding");
  assert.equal(commits[0].evidence.target, "ship");
  assert.equal(commits[0].evidence.expectedGrapheme, "i");
  assert.deepEqual(boxes.slots.map(slot => slot?.grapheme || null), ["sh", null, null]);
});

test("Sound Boxes never commits before a separate complete Blend and check action", () => {
  let state = createSoundBoxesState(soundBoxesRound, 0);
  state = reduceSoundBoxes(state, { type: "CHECK" }, soundBoxesRound);
  assert.equal(state.committed, false);

  for (const grapheme of soundBoxesRound.graphemes) {
    const tile = state.tiles.find(item => (
      item.grapheme === grapheme && !state.usedTileIds.includes(item.id)
    ));
    state = reduceSoundBoxes(state, { type: "PLACE_TILE", tileId: tile.id }, soundBoxesRound);
    assert.equal(state.committed, false);
  }
  state = reduceSoundBoxes(state, { type: "CHECK" }, soundBoxesRound);
  assert.equal(state.committed, true);
  assert.deepEqual(buildSoundBoxesOutcome(soundBoxesRound, state), {
    correct: true,
    selected: ["sh", "i", "p"],
    feedback: "Blend sh, i, p. You built ship.",
    evidence: {
      construct: "phoneme_grapheme_encoding",
      target: "ship",
      response: ["sh", "i", "p"],
      supportLevel: 0,
      independent: true
    }
  });
});

test("Sound Boxes removal returns the exact duplicate tile to its reusable bank", () => {
  const round = { ...soundBoxesRound, word: "mama", graphemes: ["m", "a", "m", "a"] };
  let state = createSoundBoxesState(round, 0);
  const firstM = state.tiles.find(tile => tile.id === "grapheme-m-1");
  state = reduceSoundBoxes(state, { type: "PLACE_TILE", tileId: firstM.id }, round);
  assert.deepEqual(state.usedTileIds, ["grapheme-m-1"]);

  state = reduceSoundBoxes(state, { type: "REMOVE_SLOT", slotIndex: 0 }, round);
  assert.equal(state.slots[0], null);
  assert.deepEqual(state.usedTileIds, []);
  assert.equal(state.tiles.find(tile => tile.id === "grapheme-m-1").id, "grapheme-m-1");
});

test("Word Machine derives swap, remove, and join pieces from declared grapheme arrays", () => {
  assert.deepEqual(
    machinePiecesForRound(substituteRound).map(piece => ({ action: piece.action, graphemes: piece.graphemes })),
    [
      { action: "swap", graphemes: ["c"] },
      { action: "swap", graphemes: ["s"] }
    ]
  );
  assert.deepEqual(
    machinePiecesForRound(removeRound).map(piece => ({
      action: piece.action,
      graphemes: piece.graphemes,
      position: piece.position,
      projectedWord: piece.projectedWord,
      matches: piece.matches
    })),
    [
      { action: "remove", graphemes: ["s"], position: 0, projectedWord: "pin", matches: true },
      { action: "remove", graphemes: ["p"], position: 1, projectedWord: "sin", matches: false },
      { action: "remove", graphemes: ["i"], position: 2, projectedWord: "spn", matches: false },
      { action: "remove", graphemes: ["n"], position: 3, projectedWord: "spi", matches: false }
    ]
  );
  assert.deepEqual(
    machinePiecesForRound(joinRound).map(piece => ({ action: piece.action, graphemes: piece.graphemes })),
    [
      { action: "join", graphemes: ["s", "u", "n"] },
      { action: "join", graphemes: ["s", "e", "t"] }
    ]
  );
});

test("Word Machine withholds the after form until an operation is committed", () => {
  let state = createWordMachineState(substituteRound, 0);
  assert.equal(state.resultGraphemes, null);
  assert.equal(buildWordMachineOutcome(substituteRound, state), null);

  const targetPiece = machinePiecesForRound(substituteRound)
    .find(piece => piece.graphemes[0] === "s");
  state = reduceWordMachine(state, { type: "SELECT_PIECE", pieceId: targetPiece.id }, substituteRound);
  assert.equal(state.committed, false);
  state = reduceWordMachine(state, { type: "COMMIT" }, substituteRound);
  assert.equal(state.committed, true);
  assert.deepEqual(state.resultGraphemes, ["s", "a", "t"]);
  assert.deepEqual(buildWordMachineOutcome(substituteRound, state), {
    correct: true,
    selected: ["s", "a", "t"],
    feedback: "You swapped c for s and made sat.",
    evidence: {
      construct: "onset_substitution",
      target: "sat",
      response: ["s", "a", "t"],
      supportLevel: 0,
      independent: true,
      operation: "substituteOnset"
    }
  });
});

test("Word Machine supports a failed swap, explicit retry, and later supported success", () => {
  let state = createWordMachineState(substituteRound, 0);
  const pieces = machinePiecesForRound(substituteRound);
  const wrongPiece = pieces.find(piece => piece.graphemes[0] === "c");
  const targetPiece = pieces.find(piece => piece.graphemes[0] === "s");
  state = reduceWordMachine(state, { type: "SELECT_PIECE", pieceId: wrongPiece.id }, substituteRound);
  state = reduceWordMachine(state, { type: "COMMIT" }, substituteRound);
  const wrong = buildWordMachineOutcome(substituteRound, state);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.evidence.independent, false);

  state = reduceWordMachine(state, { type: "RETRY" }, substituteRound);
  assert.equal(state.committed, false);
  assert.equal(state.resultGraphemes, null);
  assert.equal(state.supportLevel, 1);
  state = reduceWordMachine(state, { type: "SELECT_PIECE", pieceId: targetPiece.id }, substituteRound);
  state = reduceWordMachine(state, { type: "COMMIT" }, substituteRound);
  const recovered = buildWordMachineOutcome(substituteRound, state);
  assert.equal(recovered.correct, true);
  assert.equal(recovered.evidence.supportLevel, 1);
  assert.equal(recovered.evidence.independent, false);
});

test("Word Machine commits onset removal and compound joining as different operations", () => {
  let removing = createWordMachineState(removeRound, 0);
  removing = reduceWordMachine(removing, {
    type: "SELECT_PIECE",
    pieceId: machinePiecesForRound(removeRound)[0].id
  }, removeRound);
  removing = reduceWordMachine(removing, { type: "COMMIT" }, removeRound);
  assert.deepEqual(buildWordMachineOutcome(removeRound, removing).evidence, {
    construct: "onset_removal",
    target: "pin",
    response: ["p", "i", "n"],
    supportLevel: 0,
    independent: true,
    operation: "removeOnset"
  });

  let joining = createWordMachineState(joinRound, 0);
  for (const piece of machinePiecesForRound(joinRound)) {
    joining = reduceWordMachine(joining, { type: "SELECT_PIECE", pieceId: piece.id }, joinRound);
  }
  joining = reduceWordMachine(joining, { type: "COMMIT" }, joinRound);
  assert.deepEqual(buildWordMachineOutcome(joinRound, joining).evidence, {
    construct: "compound_word_joining",
    target: "sunset",
    response: ["s", "u", "n", "s", "e", "t"],
    supportLevel: 0,
    independent: true,
    operation: "joinCompound"
  });
});

test("Word Machine onset removal requires a real position choice and supports recovery", () => {
  const pieces = machinePiecesForRound(removeRound);
  assert.equal(pieces.length, removeRound.beforeGraphemes.length);
  assert.equal(pieces.filter(piece => piece.matches).length, 1);

  let state = createWordMachineState(removeRound, 0);
  state = reduceWordMachine(state, {
    type: "SELECT_PIECE",
    pieceId: pieces.find(piece => piece.position === 1).id
  }, removeRound);
  state = reduceWordMachine(state, { type: "COMMIT" }, removeRound);
  assert.deepEqual(state.resultGraphemes, ["s", "i", "n"]);
  assert.equal(buildWordMachineOutcome(removeRound, state).correct, false);

  state = reduceWordMachine(state, { type: "RETRY" }, removeRound);
  state = reduceWordMachine(state, {
    type: "SELECT_PIECE",
    pieceId: pieces.find(piece => piece.matches).id
  }, removeRound);
  state = reduceWordMachine(state, { type: "COMMIT" }, removeRound);
  const recovered = buildWordMachineOutcome(removeRound, state);
  assert.equal(recovered.correct, true);
  assert.equal(recovered.evidence.independent, false);
});

test("generated Word Window rounds use unique one-edit neighbours from authorised print", () => {
  const allHighFrequencyWords = elSkillsBlockCycles
    .flatMap(cycle => cycle.highFrequencyWords || [])
    .map(word => word.toLowerCase());
  for (let seed = 1; seed <= 32; seed += 1) {
    withSeed(seed, () => {
      const taughtWords = [];
      for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
        taughtWords.push(...(cycle.highFrequencyWords || []).map(word => word.toLowerCase()));
        if (!stationsForCycle(cycle).some(station => station.id === "quick")) continue;
        const authorisedLetters = new Set(taughtWords.flatMap(word => [...word]));
        const futureWords = new Set(allHighFrequencyWords.filter(word => !taughtWords.includes(word)));
        const rounds = buildStationRounds(cycle, "quick");
        assert.equal(new Set(rounds.map(round => round.roundKey)).size, rounds.length);
        for (const round of rounds) {
          assert.equal(new Set(round.choices).size, round.choices.length);
          assert.equal(round.choices.filter(choice => choice === round.studyWord).length, 1);
          assert.ok(round.choices.length >= 3, `${cycle.id}/${round.studyWord} needs close choices`);
          assert.doesNotMatch(round.prompt, new RegExp(`\\b${round.studyWord}\\b`, "i"));
          assert.doesNotMatch(round.instruction, new RegExp(`\\b${round.studyWord}\\b`, "i"));
          assert.ok(round.audio, `${cycle.id}/${round.studyWord} needs a recorded target cue`);
          for (const choice of round.choices.filter(choice => choice !== round.studyWord)) {
            assert.equal(editDistance(choice, round.studyWord), 1, `${cycle.id}: ${choice}/${round.studyWord}`);
            assert.ok([...choice].every(letter => authorisedLetters.has(letter)), `${cycle.id}: ${choice} runs ahead of print`);
            assert.equal(futureWords.has(choice), false, `${cycle.id}: ${choice} previews a future HFW`);
          }
        }
      }
    });
  }
});

test("generated onset substitutions cue one exact target and label defensible onset pieces", () => {
  for (let seed = 1; seed <= 64; seed += 1) {
    withSeed(seed, () => {
      for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
        if (!stationsForCycle(cycle).some(station => station.id === "play")) continue;
        for (const round of buildStationRounds(cycle, "play")
          .filter(item => item.operation === "substituteOnset")) {
          assert.match(round.prompt, new RegExp(`make [“"]?${round.afterWord}[”"]?`, "i"));
          assert.equal(round.audio, wordAudioPath(round.afterWord));
          assert.equal(round.speechFallback, round.afterWord);
          assert.ok(round.onsetPieces.length >= 2);
          assert.equal(round.onsetPieces.filter(piece => piece.matches).length, 1);
          assert.equal(new Set(round.onsetPieces.map(piece => piece.grapheme)).size, round.onsetPieces.length);
          for (const piece of round.onsetPieces) {
            assert.deepEqual(piece.resultGraphemes, [piece.grapheme, ...round.beforeGraphemes.slice(1)]);
            assert.equal(piece.projectedWord, piece.resultGraphemes.join(""));
            assert.equal(piece.matches, piece.projectedWord === round.afterWord);
          }
        }
      }
    });
  }
});

test("generated onset removals offer one position choice per grapheme", () => {
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    if (!stationsForCycle(cycle).some(station => station.id === "play")) continue;
    for (const round of buildStationRounds(cycle, "play")
      .filter(item => item.operation === "removeOnset")) {
      const pieces = machinePiecesForRound(round);
      assert.equal(pieces.length, round.beforeGraphemes.length, `${cycle.id}/${round.beforeWord}`);
      assert.ok(pieces.length >= 2, `${cycle.id}/${round.beforeWord} needs a removal decision`);
      assert.equal(pieces.filter(piece => piece.matches).length, 1);
      for (const piece of pieces) {
        assert.equal(
          piece.projectedWord,
          round.beforeGraphemes.filter((_, index) => index !== piece.position).join("")
        );
      }
    }
  }
});

test("word mechanics reset local state when a new round keeps the same mechanic", () => {
  const nextWindowRound = {
    ...wordWindowRound,
    roundKey: "word-window:second",
    studyWord: "look",
    answer: "look",
    choices: ["look", "book", "lock"]
  };
  let windowState = createWordWindowState({ ...wordWindowRound, roundKey: "word-window:first" }, 0);
  windowState = reduceWordWindow(windowState, { type: "CLOSE" }, { ...wordWindowRound, roundKey: "word-window:first" });
  windowState = reduceWordWindow(windowState, { type: "SELECT", value: "said" }, { ...wordWindowRound, roundKey: "word-window:first" });
  windowState = reduceWordWindow(windowState, { type: "REVEAL" }, { ...wordWindowRound, roundKey: "word-window:first" });
  const resetWindow = wordWindowStateForRound(windowState, nextWindowRound, 0);
  assert.equal(resetWindow.phase, "study");
  assert.equal(resetWindow.selected, null);
  assert.match(resetWindow.status, /look/);

  const nextBoxesRound = {
    ...soundBoxesRound,
    roundKey: "sound-boxes:second",
    word: "chat",
    graphemes: ["ch", "a", "t"]
  };
  const completedBoxes = { ...createSoundBoxesState({ ...soundBoxesRound, roundKey: "sound-boxes:first" }), committed: true };
  const resetBoxes = soundBoxesStateForRound(completedBoxes, nextBoxesRound, 0);
  assert.equal(resetBoxes.committed, false);
  assert.deepEqual(resetBoxes.slots, [null, null, null]);
  assert.deepEqual(resetBoxes.tiles.map(tile => tile.grapheme), ["t", "a", "ch"]);

  const nextMachineRound = {
    ...removeRound,
    roundKey: "word-machine:second",
    beforeWord: "stop",
    afterWord: "top",
    beforeGraphemes: ["s", "t", "o", "p"],
    afterGraphemes: ["t", "o", "p"]
  };
  const completedMachine = {
    ...createWordMachineState({ ...substituteRound, roundKey: "word-machine:first" }),
    selectedPieceIds: ["stale-piece"],
    committed: true,
    correct: true,
    resultGraphemes: ["s", "a", "t"]
  };
  const resetMachine = wordMachineStateForRound(completedMachine, nextMachineRound, 0);
  assert.equal(resetMachine.committed, false);
  assert.equal(resetMachine.correct, null);
  assert.equal(resetMachine.resultGraphemes, null);
  assert.deepEqual(resetMachine.selectedPieceIds, []);
});

test("consecutive generated rounds of one mechanic receive distinct reset keys", () => {
  const quickCycle = elSkillsBlockCycles.find(cycle => cycle.cycleNumber === 1);
  const quickRounds = withSeed(7, () => buildStationRounds(quickCycle, "quick"));
  assert.ok(quickRounds.length > 1);
  assert.equal(new Set(quickRounds.map(round => round.roundKey)).size, quickRounds.length);

  const playCycle = elSkillsBlockCycles.find(cycle => (
    stationsForCycle(cycle).some(station => station.id === "play")
    && buildStationRounds(cycle, "play").length > 1
  ));
  const playRounds = withSeed(11, () => buildStationRounds(playCycle, "play"));
  assert.equal(new Set(playRounds.map(round => round.roundKey)).size, playRounds.length);
});

test("rendered mechanics expose distinct stages, native controls, live status, and 56px hooks", () => {
  const wordWindow = render(WordWindowMechanic, wordWindowRound);
  assert.match(wordWindow, /data-mechanic-stage="word-window"/);
  assert.match(wordWindow, /data-window-phase="study"/);
  assert.match(wordWindow, /<button[^>]*data-action="close-window"/);
  assert.doesNotMatch(wordWindow, /data-word-choice=/);
  assert.match(wordWindow, /role="status"/);

  const soundBoxes = render(SoundBoxesMechanic, soundBoxesRound);
  assert.match(soundBoxes, /data-mechanic-stage="sound-boxes"/);
  assert.equal((soundBoxes.match(/data-sound-box=/g) || []).length, 3);
  assert.match(soundBoxes, /data-grapheme="sh"/);
  assert.match(
    soundBoxes,
    /<button(?=[^>]*data-action="blend-check")(?=[^>]*disabled="")[^>]*>/
  );

  const machine = render(WordMachineMechanic, substituteRound, { reducedMotion: true });
  assert.match(machine, /data-mechanic-stage="word-machine"/);
  assert.match(machine, /data-machine-operation="substituteOnset"/);
  assert.match(machine, /data-machine-tray="swap-onset"/);
  assert.match(machine, /data-reduced-motion="true"/);
  assert.doesNotMatch(machine, /data-machine-after=/);

  for (const html of [wordWindow, soundBoxes, machine]) {
    assert.match(html, /data-target-size="56"/);
    assert.doesNotMatch(html, /sbq-answer-grid/);
    assert.match(html, /role="group"/);
  }
});
