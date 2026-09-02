import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import {
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS
} from "../../src/features/soundSeekers/content/expeditions.js";
import { getInstructionContract } from "../../src/features/soundSeekers/content/instructionContracts.js";
import { wordForge } from "../../src/features/soundSeekers/engine/powers/index.js";
import { normalizeMotorAssists } from "../../src/features/soundSeekers/engine/motorAssists.js";

let WordWorkbench;
let MeaningPayoff;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ default: WordWorkbench } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/ui/WordWorkbench.jsx"
  ));
  ({ default: MeaningPayoff } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/ui/MeaningPayoff.jsx"
  ));
});

test.after(async () => {
  await vite?.close();
});

const WORD_FIXTURES = Object.freeze({
  hot: Object.freeze({ units: ["h", "o", "t"], rack: ["h", "o", "t", "m"] }),
  ship: Object.freeze({ units: ["sh", "i", "p"], rack: ["sh", "i", "p", "ch"] }),
  moon: Object.freeze({ units: ["m", "oo", "n"], rack: ["m", "oo", "n", "oa"] }),
  cake: Object.freeze({ units: ["c", "a", "ke"], rack: ["c", "a", "ke", "ck"] }),
  pop: Object.freeze({ units: ["p", "o", "p"], rack: ["p", "o", "p", "b"] })
});

function fixture(word, { placedCount = 1, status = "active", sweep = "not_ready" } = {}) {
  const source = WORD_FIXTURES[word];
  const rack = source.rack.map((label, index) => ({
    id: `fixture:${word}:tile:${index}`,
    label
  }));
  return Object.freeze({
    challengeId: `fixture:${word}:challenge`,
    powerId: "word_forge",
    instructionLabel: "Choose the letter or letter team for this sound.",
    visualCue: Object.freeze({ kind: "whole_word" }),
    status,
    correction: null,
    slots: Object.freeze(source.units.map((unused, index) => Object.freeze({
      id: `fixture:${word}:slot:${index}`,
      tileId: index < placedCount ? rack[index].id : null
    }))),
    rack: Object.freeze(rack.map(Object.freeze)),
    sweep,
    morphology: null
  });
}

function render(model, extras = {}) {
  return renderToStaticMarkup(React.createElement(WordWorkbench, {
    model,
    onInput: () => {},
    onReplayWholeWord: () => {},
    onReplayMeaning: () => {},
    ...extras
  }));
}

function occurrences(value, pattern) {
  return value.match(pattern)?.length || 0;
}

test("hot, ship, moon, cake, and pop retain authored sound boxes and physical rack tiles", () => {
  for (const [word, source] of Object.entries(WORD_FIXTURES)) {
    const html = render(fixture(word));
    assert.equal(occurrences(html, /class="ss-workbench__sound-box /gu), source.units.length, word);
    assert.equal(occurrences(html, /class="ss-workbench__tile/gu), source.rack.length, word);
    for (const label of source.rack) {
      assert.match(html, new RegExp(`>${label}<`, "u"), `${word}:${label}`);
    }
    assert.equal(occurrences(html, /role="img" aria-label="Sound box /gu), source.units.length, word);
    assert.match(html, /aria-current="step"/u, word);
    assert.match(html, /aria-label="Sound boxes"/u, word);
    assert.match(html, /aria-label="Grapheme tiles"/u, word);
  }
});

test("the component consumes the committed Task 1 child view without a raw challenge prop", () => {
  const action = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases)
    .find(phase => phase.instructionId === "word-forge-place-tile");
  const contract = getInstructionContract(action.instructionId);
  const id = suffix => `${action.contextId}:${suffix}`;
  const challenge = Object.freeze({
    challengeId: `${action.id}:task-2-integration-challenge`,
    attemptId: `${action.id}:task-2-integration-attempt`,
    instructionId: contract.instructionId,
    powerId: contract.powerId,
    expectedAction: contract.expectedAction,
    recordsDomain: contract.recordsDomain,
    expectedToken: "private-answer-token",
    optionTokens: Object.freeze(["private-answer-token", "private-decoy-token"]),
    childText: contract.childText,
    cue: contract.cue,
    requiresAudio: false,
    targetId: `word:${action.wordId}`,
    wordId: action.wordId,
    position: 0,
    presentation: Object.freeze({
      rack: Object.freeze([
        Object.freeze({ id: id("tile:sh"), label: "sh", token: "private-answer-token" }),
        Object.freeze({ id: id("tile:ch"), label: "ch", token: "private-decoy-token" })
      ]),
      slots: Object.freeze([
        Object.freeze({ id: id("slot:0") }),
        Object.freeze({ id: id("slot:1") }),
        Object.freeze({ id: id("slot:2") })
      ])
    })
  });
  const state = wordForge.createState(challenge, {
    seed: 2,
    interaction: Object.freeze({
      action,
      context: SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId]
    })
  });
  const model = wordForge.view(state, challenge, normalizeMotorAssists());
  const html = render(model);
  assert.match(html, /Choose the letter or letter team for this sound\./u);
  assert.match(html, /aria-label="sh grapheme tile"/u);
  assert.doesNotMatch(html, /private-answer-token|task-2-integration/u);
  assert.equal(html.includes(`word:${action.wordId}`), false);
});

test("duplicate graphemes remain separate physical controls without exposing their identities", () => {
  const html = render(fixture("pop", { placedCount: 0 }));
  assert.equal(occurrences(html, />p<\/span>/gu), 2);
  assert.equal(occurrences(html, /aria-label="p grapheme tile"/gu), 2);
  assert.doesNotMatch(html, /fixture:pop:tile/u);
});

test("the controlled workbench renders only the supplied next slots and never owns placement", () => {
  const before = render(fixture("ship", { placedCount: 0 }));
  const after = render(fixture("ship", { placedCount: 1, status: "awaiting_mission_commit" }));
  assert.equal(occurrences(before, /data-slot-state="filled"/gu), 0);
  assert.equal(occurrences(after, /data-slot-state="filled"/gu), 1);
  assert.match(after, />sh<\/span>/u);
  assert.doesNotMatch(before, />sh<\/span>[\s\S]*class="ss-workbench__sound-box-mark"/u);
});

test("answer-bearing caller fields never reach visible, hidden, ARIA, title, or data content", () => {
  const model = {
    ...fixture("ship", { placedCount: 0 }),
    word: "PRIVATE-SHIP-WORD",
    wordId: "PRIVATE-SHIP-ID",
    expectedToken: "PRIVATE-EXPECTED",
    correct: true,
    evidence: { answer: "PRIVATE-ANSWER" }
  };
  const html = render(model);
  for (const secret of ["PRIVATE-SHIP-WORD", "PRIVATE-SHIP-ID", "PRIVATE-EXPECTED", "PRIVATE-ANSWER"]) {
    assert.equal(html.includes(secret), false, secret);
  }
  assert.doesNotMatch(html, /data-(?:correct|answer|expected|evidence)/iu);
});

test("meaning remains absent until the parent supplies the post-commit payoff", () => {
  const model = fixture("moon", { placedCount: 3, status: "awaiting_mission_commit" });
  assert.doesNotMatch(render(model), /The moon is the round object/u);
  const html = render(model, {
    meaningPayoff: {
      support: {
        wordId: "moon",
        childDefinition: "The moon is the round object seen in the sky at night.",
        actionPrompt: "Make a round moon shape above your head."
      },
      visual: { accessibleLabel: "A round moon glowing above hills", glyph: "moon" },
      reducedMotion: true
    }
  });
  assert.match(html, /<h3[^>]*>moon<\/h3>/u);
  assert.match(html, /The moon is the round object seen in the sky at night\./u);
  assert.match(html, /Make a round moon shape above your head\./u);
  assert.match(html, /aria-label="Hear the meaning again"/u);
});

test("MeaningPayoff uses one child-readable visual and no audio or authority metadata", () => {
  const html = renderToStaticMarkup(React.createElement(MeaningPayoff, {
    support: {
      wordId: "ship",
      childDefinition: "A ship is a large boat made to travel on water.",
      actionPrompt: "Move both hands forward like a ship at sea.",
      audioKey: "PRIVATE-AUDIO-KEY",
      answerLeakPolicy: "PRIVATE-POLICY"
    },
    visual: {
      semanticId: "PRIVATE-SEMANTIC-ID",
      accessibleLabel: "A ship travelling across blue water",
      glyph: "ship"
    },
    reducedMotion: false,
    onReplay: () => {}
  }));
  assert.match(html, /aria-label="A ship travelling across blue water"/u);
  assert.match(html, /A ship is a large boat made to travel on water\./u);
  assert.doesNotMatch(html, /PRIVATE-(?:AUDIO|POLICY|SEMANTIC)/u);
});

test("morphology is explicitly unscored and reveals the derived word only from advanced power state", () => {
  const baseModel = Object.freeze({
    challengeId: "fixture:morphology:challenge",
    powerId: "word_forge",
    instructionLabel: "Endings can change or extend a word.",
    visualCue: Object.freeze({ kind: "morphology" }),
    status: "active",
    correction: null,
    slots: Object.freeze([
      Object.freeze({ id: "morphology-base-slot", tileId: "morphology-base-fixed" }),
      Object.freeze({ id: "morphology-ending-slot", tileId: null })
    ]),
    rack: Object.freeze([Object.freeze({ id: "morphology-ending-tile", label: "s" })]),
    sweep: "not_ready",
    morphology: Object.freeze({
      kind: "morphology_introduction",
      baseWord: "cat",
      ending: "s",
      derivedWord: "cats",
      meaning: "more than one"
    })
  });
  const before = render(baseModel);
  assert.match(before, /Try a word ending/u);
  assert.match(before, /Practice only — no score/u);
  assert.match(before, />cat<\/span>/u);
  assert.match(before, />s<\/span>/u);
  assert.doesNotMatch(before, />cats<\/strong>/u);

  const ready = render({
    ...baseModel,
    status: "awaiting_mission_commit",
    slots: [baseModel.slots[0], { ...baseModel.slots[1], tileId: "morphology-ending-tile" }],
    sweep: "meaning_ready"
  });
  assert.match(ready, />cats<\/strong>/u);
  assert.match(ready, /more than one/u);
});

test("safe correction copy is the same visible polite status and never names an answer", () => {
  const html = render({
    ...fixture("hot", { placedCount: 0 }),
    correction: { supportLevel: 2, isolatePosition: "initial", reduceIrrelevantLoad: true }
  });
  assert.match(html, /role="status" aria-live="polite"[^>]*>Look at the highlighted sound box\. Try again\.<\/p>/u);
  assert.equal(occurrences(html, /Look at the highlighted sound box\. Try again\./gu), 1);
  const childText = html.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ");
  assert.doesNotMatch(childText, /The answer|correct|wrong/iu);
});

test("the final blend control appears only when the power-owned sweep state requests it", () => {
  assert.doesNotMatch(render(fixture("cake")), /Sweep and read/u);
  const html = render(fixture("cake", { placedCount: 3, sweep: "ready" }));
  assert.match(html, /aria-label="Sweep and read the whole word"/u);
  assert.match(html, /Sweep and read/u);
});
