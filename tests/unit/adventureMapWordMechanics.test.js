import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  buildSoundBoxesOutcome,
  buildWordMachineOutcome,
  buildWordWindowOutcome,
  createSoundBoxesState,
  createWordMachineState,
  createWordWindowState,
  machinePiecesForRound,
  reduceSoundBoxes,
  reduceWordMachine,
  reduceWordWindow
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

test("Word Window reveals only after commitment and reports independent recognition", () => {
  const study = createWordWindowState(wordWindowRound, 0);
  const choosing = reduceWordWindow(study, { type: "CLOSE" }, wordWindowRound);
  assert.deepEqual(
    reduceWordWindow(choosing, { type: "REVEAL" }, wordWindowRound),
    choosing
  );

  const committed = reduceWordWindow(choosing, { type: "SELECT", value: "said" }, wordWindowRound);
  const outcome = buildWordWindowOutcome(wordWindowRound, committed);
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

  const revealed = reduceWordWindow(committed, { type: "REVEAL" }, wordWindowRound);
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
  const outcome = buildWordWindowOutcome(wordWindowRound, committed);

  assert.equal(reopened.phase, "study");
  assert.equal(outcome.evidence.supportLevel, 2);
  assert.equal(outcome.evidence.independent, false);
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
    machinePiecesForRound(removeRound).map(piece => ({ action: piece.action, graphemes: piece.graphemes })),
    [{ action: "remove", graphemes: ["s"] }]
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

test("rendered mechanics expose distinct stages, native controls, live status, and 56px hooks", () => {
  const wordWindow = render(WordWindowMechanic, wordWindowRound);
  assert.match(wordWindow, /data-mechanic-stage="word-window"/);
  assert.match(wordWindow, /data-window-phase="study"/);
  assert.match(wordWindow, /<button[^>]*data-action="close-window"/);
  assert.match(
    wordWindow,
    /<button(?=[^>]*data-word-choice="said")(?=[^>]*disabled="")[^>]*>/
  );
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
  }
});
