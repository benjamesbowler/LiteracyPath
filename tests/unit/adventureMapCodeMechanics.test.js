import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { getChildWordAsset } from "../../src/data/childAssets.js";
import { VERIFIED_PICTURE_WORDS } from "../../src/data/generated/questStoryQuestions.generated.js";

let LetterPressMechanic;
let SoundGateMechanic;
let SceneHuntMechanic;
let state;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({
    LetterPressMechanic,
    SoundGateMechanic,
    SceneHuntMechanic
  } = await vite.ssrLoadModule(
    "/src/components/elQuest/mechanics/CodeMechanics.jsx"
  ));
  state = await import(
    "../../src/components/elQuest/mechanics/codeMechanicState.js"
  );
});

test.after(async () => {
  await vite?.close();
});

function render(Component, round, extra = {}) {
  return renderToStaticMarkup(React.createElement(Component, {
    round,
    disabled: false,
    supportLevel: 0,
    onCommit: () => {},
    onRequestReplay: () => {},
    onRequestObjectAudio: () => {},
    reducedMotion: true,
    ...extra
  }));
}

const letterRound = {
  mechanicId: "letterPair",
  construct: "visual_letter_identity",
  targetGrapheme: "a",
  modelForm: "A",
  partnerForm: "a",
  choices: ["a", "m", "s"],
  answer: "a"
};

const soundRound = {
  mechanicId: "soundGate",
  construct: "heard_phoneme_grapheme_mapping",
  targetGrapheme: "f",
  choices: ["f", "ff", "m"],
  acceptedAnswers: ["f", "ff"],
  answer: "f"
};

const huntRound = {
  mechanicId: "sceneHunt",
  construct: "initial_phoneme_discrimination",
  targetGrapheme: "m",
  objects: [
    { word: "map", matches: true },
    { word: "moon", matches: true },
    { word: "sun", matches: false }
  ]
};

test("the three mechanics render distinct button-operated stages", () => {
  const letter = render(LetterPressMechanic, letterRound);
  const sound = render(SoundGateMechanic, soundRound);
  const hunt = render(SceneHuntMechanic, huntRound);

  assert.match(letter, /data-mechanic-stage="letter-press"/);
  assert.equal((letter.match(/class="am-code-sign-slot/g) || []).length, 2);
  assert.match(letter, /<button[^>]*min-height:56px[^>]*>a<\/button>/);

  assert.match(sound, /data-mechanic-stage="sound-gate"/);
  assert.match(sound, /aria-pressed="false"/);
  assert.match(sound, /<button[^>]*disabled=""[^>]*>Open sound gate<\/button>/);

  assert.match(hunt, /data-mechanic-stage="scene-hunt"/);
  assert.equal((hunt.match(/class="am-scene-object/g) || []).length, 3);
  assert.match(hunt, />Labels<\/button>/);
  assert.match(hunt, />Check tags<\/button>/);
  assert.doesNotMatch(hunt, /class="am-scene-object-label"/);
});

test("Letter Press commits the selected form with visual-letter evidence", () => {
  const wrong = state.pressLetter(state.createLetterPressState(), letterRound, "m", 1);
  assert.deepEqual(wrong, {
    state: { selected: "m", paired: false },
    outcome: {
      correct: false,
      selected: "m",
      feedback: "m does not pair with A. Look for its matching letter form.",
      evidence: {
        construct: "visual_letter_identity",
        target: "a",
        response: "m",
        supportLevel: 1
      }
    }
  });

  const correct = state.pressLetter(wrong.state, letterRound, "a", 1);
  assert.equal(correct.state.paired, true);
  assert.equal(correct.outcome.correct, true);
  assert.equal(correct.outcome.feedback, "A and a are the same letter pair.");
});

test("Sound Gate selection previews a magnet and only the gate commits it", () => {
  const initial = state.createSoundGateState();
  const preview = state.selectSoundMagnet(initial, "ff");
  assert.deepEqual(preview, { selected: "ff", committed: false, gateOpen: false });
  assert.equal("outcome" in preview, false);

  const commit = state.commitSoundGate(preview, soundRound, 2);
  assert.equal(commit.state.gateOpen, true);
  assert.deepEqual(commit.outcome, {
    correct: true,
    selected: "ff",
    feedback: "ff spells the sound you heard. The sound gate opens.",
    evidence: {
      construct: "heard_phoneme_grapheme_mapping",
      target: "f",
      response: "ff",
      supportLevel: 2
    }
  });

  for (const accepted of soundRound.acceptedAnswers) {
    const acceptedCommit = state.commitSoundGate(
      state.selectSoundMagnet(initial, accepted),
      soundRound,
      0
    );
    assert.equal(acceptedCommit.outcome.correct, true, accepted);
  }
  const rejected = state.commitSoundGate(
    state.selectSoundMagnet(initial, "m"),
    soundRound,
    0
  );
  assert.equal(rejected.outcome.correct, false);
});

test("Scene Hunt toggles a complete tag set and compares all true objects", () => {
  let hunt = state.createSceneHuntState();
  hunt = state.toggleSceneHuntItem(hunt, "moon");
  hunt = state.toggleSceneHuntItem(hunt, "map");
  assert.deepEqual(hunt.selectedItems, ["moon", "map"]);

  const complete = state.commitSceneHunt(hunt, huntRound, 0);
  assert.equal(complete.outcome.correct, true);
  assert.deepEqual(complete.outcome.selected, ["moon", "map"]);
  assert.deepEqual(complete.outcome.selectedItems, ["moon", "map"]);
  assert.deepEqual(complete.outcome.evidence.response, ["moon", "map"]);

  hunt = state.toggleSceneHuntItem(hunt, "map");
  const incomplete = state.commitSceneHunt(hunt, huntRound, 0);
  assert.equal(incomplete.outcome.correct, false);
  assert.equal(
    incomplete.outcome.feedback,
    "You tagged moon. Listen again and tag every word that starts with the target sound."
  );
});

test("showing Scene Hunt labels records one level of support", () => {
  const once = state.showSceneHuntLabels(state.createSceneHuntState());
  const twice = state.showSceneHuntLabels(once);
  assert.equal(state.sceneHuntSupportLevel(2, once), 3);
  assert.equal(state.sceneHuntSupportLevel(2, twice), 3);

  const commit = state.commitSceneHunt(twice, huntRound, 2);
  assert.equal(commit.outcome.evidence.supportLevel, 3);
});

test("the complete eligible Scene Hunt inventory resolves default child pictures", () => {
  const inventory = [...new Set(
    VERIFIED_PICTURE_WORDS.map(word => String(word || "").toLowerCase())
  )].sort();
  assert.ok(inventory.length > 0);
  const missing = inventory.filter(word => {
    const asset = getChildWordAsset(word);
    return !asset?.image && !asset?.fallbackImage;
  });
  assert.deepEqual(missing, []);
});

test("Scene Hunt picture resolution never bypasses blocked-image policy", () => {
  assert.equal(state.resolveScenePicture("bud"), "");
  assert.ok(state.resolveScenePicture("map"));
});
