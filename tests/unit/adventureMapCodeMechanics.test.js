import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { getChildWordAsset } from "../../src/data/childAssets.js";
import { VERIFIED_PICTURE_WORDS } from "../../src/data/generated/questStoryQuestions.generated.js";

let LetterPressMechanic;
let SoundChoiceMechanic;
let state;
let vite;

test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ LetterPressMechanic, SoundChoiceMechanic } = await vite.ssrLoadModule(
    "/src/components/elQuest/mechanics/CodeMechanics.jsx"
  ));
  state = await import("../../src/components/elQuest/mechanics/codeMechanicState.js");
});

test.after(async () => { await vite?.close(); });

function render(Component, round, extra = {}) {
  return renderToStaticMarkup(React.createElement(Component, {
    round, disabled: false, supportLevel: 0, onCommit: () => {}, reducedMotion: true, ...extra
  }));
}

const letterRound = {
  mechanicId: "letterPair", construct: "visual_letter_identity", targetGrapheme: "a",
  modelForm: "A", partnerForm: "a", choices: ["a", "m", "s"], answer: "a"
};
const soundRound = {
  mechanicId: "soundChoice", construct: "heard_phoneme_grapheme_mapping", targetGrapheme: "f",
  choices: ["f", "ff", "m"], acceptedAnswers: ["f", "ff"], answer: "f"
};

test("letter and sound matching expose immediately usable answer buttons", () => {
  const letter = render(LetterPressMechanic, letterRound);
  const sound = render(SoundChoiceMechanic, soundRound);
  assert.match(letter, /data-mechanic-stage="letter-press"/);
  assert.equal((letter.match(/class="am-code-sign-slot/g) || []).length, 2);
  assert.match(letter, />a<\/button>/);
  assert.match(sound, /data-mechanic-stage="sound-choice"/);
  assert.match(sound, />ff<\/button>/);
  assert.doesNotMatch(letter + sound, /disabled=""|Open sound gate|Check|Choose a magnet/);
});

test("letter matching records the response and accepts the correct retry", () => {
  const wrong = state.pressLetter(state.createLetterPressState(), letterRound, "m", 1);
  assert.equal(wrong.state.paired, false);
  assert.equal(wrong.outcome.correct, false);
  assert.deepEqual(wrong.outcome.evidence, {
    construct: "visual_letter_identity", target: "a", response: "m", supportLevel: 1
  });
  const correct = state.pressLetter(wrong.state, letterRound, "a", 1);
  assert.equal(correct.state.paired, true);
  assert.equal(correct.outcome.correct, true);
  assert.equal(correct.outcome.selected, "a");
});

test("sound matching records one direct choice and accepts every valid spelling", () => {
  for (const selected of soundRound.acceptedAnswers) {
    const result = state.commitSoundChoice(
      state.selectSoundChoice(state.createSoundChoiceState(), selected), soundRound, 2
    );
    assert.equal(result.outcome.correct, true, selected);
    assert.equal(result.outcome.selected, selected);
    assert.deepEqual(result.outcome.evidence, {
      construct: "heard_phoneme_grapheme_mapping", target: "f", response: selected, supportLevel: 2
    });
    assert.doesNotMatch(result.outcome.feedback, /gate|magnet/i);
  }
});

test("a wrong sound response leaves the next correct response available", () => {
  const wrong = state.commitSoundChoice(
    state.selectSoundChoice(state.createSoundChoiceState(), "m"), soundRound, 0
  );
  assert.equal(wrong.outcome.correct, false);
  assert.equal(wrong.state.committed, false);
  const corrected = state.commitSoundChoice(state.selectSoundChoice(wrong.state, "ff"), soundRound, 1);
  assert.equal(corrected.outcome.correct, true);
  assert.equal(corrected.outcome.evidence.supportLevel, 1);
});

test("eligible picture vocabulary resolves child pictures without bypassing blocks", () => {
  const inventory = [...new Set(VERIFIED_PICTURE_WORDS.map(word => String(word || "").toLowerCase()))];
  assert.ok(inventory.length > 0);
  assert.deepEqual(inventory.filter(word => {
    const asset = getChildWordAsset(word);
    return !asset?.image && !asset?.fallbackImage;
  }), []);
  assert.equal(state.resolveScenePicture("bud"), "");
  assert.ok(state.resolveScenePicture("map"));
});
