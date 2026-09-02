import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import {
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS
} from "../../src/features/soundSeekers/content/expeditions.js";
import { getInstructionContract } from "../../src/features/soundSeekers/content/instructionContracts.js";
import { SOUND_SEEKERS_MEANING_SUPPORT } from "../../src/features/soundSeekers/content/meaningSupport.js";
import {
  getPronunciation,
  getWordMeaning
} from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { wordForge } from "../../src/features/soundSeekers/engine/powers/index.js";
import { normalizeMotorAssists } from "../../src/features/soundSeekers/engine/motorAssists.js";
import { SOUND_SEEKERS_MEANING_VISUALS } from "../../src/features/soundSeekers/visual/sceneVisualCatalog.js";

let WordWorkbench;
let MeaningPayoff;
let getRuntimeMeaningSupport;
let getRuntimePronunciation;
let resolveRuntimeMeaningVisual;
let createRuntimeMissionPlan;
let createRuntimeMissionState;
let createRuntimeState;
let issueRuntimeWorkbenchAccess;
let runtimeWordForge;
let vite;

function deepFreeze(value) {
  if (Array.isArray(value)) {
    value.forEach(deepFreeze);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
  }
  return value && typeof value === "object" ? Object.freeze(value) : value;
}

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
  ({ getMeaningSupport: getRuntimeMeaningSupport } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/meaningSupport.js"
  ));
  ({ getPronunciation: getRuntimePronunciation } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/pronunciationLexicon.js"
  ));
  ({ resolveMeaningVisual: resolveRuntimeMeaningVisual } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/sceneVisualCatalog.js"
  ));
  ({ createMissionPlan: createRuntimeMissionPlan } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/createMissionPlan.js"
  ));
  ({ createMissionState: createRuntimeMissionState } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/missionReducer.js"
  ));
  ({ createSoundSeekersState: createRuntimeState } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/stateV2.js"
  ));
  ({ issueWordWorkbenchAccess: issueRuntimeWorkbenchAccess } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/workbenchAccess.js"
  ));
  ({ wordForge: runtimeWordForge } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/powers/index.js"
  ));
});

test.after(async () => {
  await vite?.close();
});

const DECOYS = Object.freeze({ hot: "m", ship: "ch", moon: "oa", cake: "ck", pop: "b" });

function canonicalWordFixture(word) {
  const pronunciation = getPronunciation(word);
  assert.ok(pronunciation, `${word}: missing foundation pronunciation`);
  const meaning = getWordMeaning(pronunciation.meaningId);
  assert.ok(meaning, `${word}: missing foundation meaning`);
  return Object.freeze({
    pronunciation,
    units: Object.freeze(pronunciation.units.map(unit => unit.grapheme)),
    rack: Object.freeze([...pronunciation.units.map(unit => unit.grapheme), DECOYS[word]]),
    cueLabel: meaning.sense
  });
}

const WORD_FIXTURES = Object.freeze(Object.fromEntries(
  ["hot", "ship", "moon", "cake", "pop"].map(word => [word, canonicalWordFixture(word)])
));

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
  const fixtureWord = /^fixture:([^:]+):challenge$/u.exec(model?.challengeId || "")?.[1];
  return renderToStaticMarkup(React.createElement(WordWorkbench, {
    model,
    pronunciation: fixtureWord ? getRuntimePronunciation(fixtureWord) : undefined,
    onInput: () => {},
    onReplayWholeWord: () => {},
    onReplayMeaning: () => {},
    ...extras
  }));
}

function authorizedWord(word) {
  const action = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases)
    .find(phase => phase.powerId === "word_forge" && phase.wordId === word);
  assert.ok(action, `${word}: no canonical Word Forge action`);
  const gameState = createRuntimeState();
  const plan = createRuntimeMissionPlan({
    stopId: action.id.split("-")[0], state: gameState, seed: 7, replayOrdinal: 0
  });
  const mission = createRuntimeMissionState(plan, {
    kind: "sound_seekers_mission",
    missionId: plan.id,
    contentVersion: plan.contentVersion,
    stopId: plan.stopId,
    journeyStep: plan.journeyStep,
    phaseId: action.id,
    completedPhaseIds: [],
    missionRevision: 3,
    attemptOrdinal: 0,
    attemptId: `${plan.id}:${action.id}:attempt:0`,
    nextDecisionOrdinal: 0
  });
  const model = runtimeWordForge.view(mission.activity, mission.challenge);
  const access = issueRuntimeWorkbenchAccess({
    missionState: mission,
    model,
    pronunciation: getRuntimePronunciation(word)
  });
  return { mission, model, access };
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
      const printed = label === "a_e" ? "a…e" : label;
      assert.match(html, new RegExp(`>${printed}<`, "u"), `${word}:${label}`);
    }
    assert.equal(occurrences(html, /role="img" aria-label="Sound box /gu), source.units.length, word);
    assert.match(html, /aria-current="step"/u, word);
    assert.match(html, /aria-label="Sound boxes"/u, word);
    assert.match(html, /aria-label="Grapheme tiles"/u, word);
  }
  assert.deepEqual(WORD_FIXTURES.cake.units, ["c", "a_e", "k"]);
  assert.doesNotMatch(render(fixture("cake")), /a_e/u);
});

test("the target cue consumes the exact child-safe meaning reference and fails closed without it", () => {
  const hotFixture = authorizedWord("hot");
  const shipFixture = authorizedWord("ship");
  const hot = render(hotFixture.model, { access: hotFixture.access });
  const ship = render(shipFixture.model, { access: shipFixture.access });
  assert.match(hot, /role="img" aria-label="having a high temperature"/u);
  assert.match(ship, /role="img" aria-label="A large boat that carries people or things across water\."/u);
  assert.notEqual(hot.match(/data-cue-geometry="([^"]+)"/u)?.[1], ship.match(/data-cue-geometry="([^"]+)"/u)?.[1]);
  assert.doesNotMatch(render(hotFixture.model, { access: { ...hotFixture.access } }), /ss-workbench__target/u);
  assert.doesNotMatch(render(shipFixture.model, { access: hotFixture.access }), /ss-workbench__target/u);

  const absent = render({ ...fixture("hot"), visualCue: null }, { pronunciation: getRuntimePronunciation("hot") });
  const forged = render(fixture("hot"), {
    pronunciation: { ...getRuntimePronunciation("hot"), meaningId: "forged" }
  });
  const cloned = render(fixture("hot"), { pronunciation: { ...getRuntimePronunciation("hot") } });
  const crossWord = render(fixture("hot"), { pronunciation: getRuntimePronunciation("ship") });
  assert.doesNotMatch(absent, /ss-workbench__target/u);
  assert.doesNotMatch(forged, /ss-workbench__target/u);
  assert.doesNotMatch(cloned, /ss-workbench__target/u);
  assert.doesNotMatch(crossWord, /ss-workbench__target/u);
});

test("the component consumes the committed Task 1 child view without a raw challenge prop", () => {
  const action = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases)
    .find(phase => phase.instructionId === "word-forge-place-tile");
  const contract = getInstructionContract(action.instructionId);
  const id = suffix => `${action.contextId}:${suffix}`;
  const actionPronunciation = getPronunciation(action.wordId);
  const rackLabels = [...actionPronunciation.units.map(unit => unit.grapheme), "zz"];
  const rackTokens = rackLabels.map((unused, index) => `private-token-${index}`);
  const challenge = Object.freeze({
    challengeId: `${action.id}:task-2-integration-challenge`,
    attemptId: `${action.id}:task-2-integration-attempt`,
    instructionId: contract.instructionId,
    powerId: contract.powerId,
    expectedAction: contract.expectedAction,
    recordsDomain: contract.recordsDomain,
    expectedToken: rackTokens[0],
    optionTokens: Object.freeze(rackTokens),
    childText: contract.childText,
    cue: contract.cue,
    requiresAudio: false,
    targetId: `word:${action.wordId}`,
    wordId: action.wordId,
    position: 0,
    presentation: Object.freeze({
      rack: Object.freeze(rackLabels.map((label, index) => Object.freeze({
        id: id(`tile:${index}`), label, token: rackTokens[index]
      }))),
      slots: Object.freeze(actionPronunciation.units.map((unused, index) => Object.freeze({
        id: id(`slot:${index}`)
      })))
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
  const html = render(model, { pronunciation: getRuntimePronunciation(action.wordId) });
  assert.match(html, /Choose the letter or letter team for this sound\./u);
  assert.match(html, new RegExp(`aria-label="${actionPronunciation.units[0].grapheme} grapheme tile"`, "u"));
  assert.doesNotMatch(html, /private-token|task-2-integration/u);
  assert.equal(html.includes(`word:${action.wordId}`), false);
  assert.doesNotMatch(html, /ss-workbench__target/u);
  const otherWord = action.wordId === "ship" ? "hot" : "ship";
  assert.doesNotMatch(render(model, { pronunciation: getRuntimePronunciation(otherWord) }), /ss-workbench__target/u);
});

test("invalid, unfrozen, wrong-power, and schema-expanded models fail closed", () => {
  const valid = fixture("ship", { placedCount: 0 });
  const invalidModels = [
    null,
    {},
    { ...valid },
    deepFreeze({ ...valid, powerId: "echo_search" }),
    deepFreeze({ ...valid, callerAnswer: "ship" }),
    deepFreeze({ ...valid, rack: [...valid.rack, valid.rack[0]] }),
    deepFreeze({ ...valid, slots: [{ ...valid.slots[0], unknown: true }, ...valid.slots.slice(1)] }),
    deepFreeze({ ...valid, status: "complete" }),
    deepFreeze({ ...valid, sweep: "caller_ready" }),
    deepFreeze({ ...valid, sweep: "ready" }),
    deepFreeze({
      ...valid,
      instructionLabel: "Endings can change or extend a word.",
      visualCue: { kind: "morphology" },
      morphology: { kind: "morphology_introduction", baseWord: "dog", ending: "s", derivedWord: "dogs", meaning: "many" }
    })
  ];
  for (const model of invalidModels) {
    assert.equal(render(model, { pronunciation: getRuntimePronunciation("ship") }), "");
  }
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
  assert.match(after, /aria-label="Sound box 1, sh, placed"/u);
  assert.match(after, /aria-label="sh grapheme tile, placed"[^>]*aria-disabled="true"/u);
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
      support: getRuntimeMeaningSupport("moon"),
      visual: resolveRuntimeMeaningVisual(getRuntimeMeaningSupport("moon").visualSemanticId),
      reducedMotion: true
    }
  });
  assert.doesNotMatch(html, /<h3[^>]*>moon<\/h3>/u);
  assert.doesNotMatch(html, /The moon is the round object seen in the sky at night\./u);
});

test("MeaningPayoff uses one child-readable visual and no audio or authority metadata", () => {
  const support = getRuntimeMeaningSupport("ship");
  const visual = resolveRuntimeMeaningVisual(support.visualSemanticId);
  const html = renderToStaticMarkup(React.createElement(MeaningPayoff, {
    support,
    visual,
    reducedMotion: false,
    onReplay: () => {}
  }));
  assert.match(html, new RegExp(`aria-label="${visual.accessibleLabel}"`, "u"));
  assert.match(html, /A ship is a large boat made to travel on water\./u);
  assert.match(html, /data-meaning-geometry="water-vessel"/u);
  assert.match(html, /data-meaning-action="move"/u);
  assert.doesNotMatch(html, new RegExp(visual.semanticId, "u"));

  const forged = renderToStaticMarkup(React.createElement(MeaningPayoff, {
    support,
    visual: { ...visual, shapeFamilyId: "forged-generic-shape" },
    onReplay: () => {}
  }));
  assert.equal(forged, "");
  assert.equal(renderToStaticMarkup(React.createElement(MeaningPayoff, {
    support: { ...support }, visual, onReplay: () => {}
  })), "");
  assert.equal(renderToStaticMarkup(React.createElement(MeaningPayoff, {
    support, visual: { ...visual }, onReplay: () => {}
  })), "");
});

test("every authored Task 3 support and Task 4 visual has a specific code-native payoff", () => {
  assert.equal(SOUND_SEEKERS_MEANING_VISUALS.length, SOUND_SEEKERS_MEANING_SUPPORT.length);
  for (const support of SOUND_SEEKERS_MEANING_SUPPORT) {
    const runtimeSupport = getRuntimeMeaningSupport(support.wordId);
    const visual = resolveRuntimeMeaningVisual(runtimeSupport.visualSemanticId);
    const html = renderToStaticMarkup(React.createElement(MeaningPayoff, { support: runtimeSupport, visual }));
    assert.match(html, /data-meaning-geometry="[^"]+"/u, runtimeSupport.wordId);
    assert.match(html, /data-meaning-action="[^"]+"/u, runtimeSupport.wordId);
    assert.doesNotMatch(html, /data-meaning-(?:geometry|action)="(?:generic|fallback|discovery)"/u, runtimeSupport.wordId);
  }
});

test("morphology is explicitly unscored and never reveals the derived word before authenticated commit", () => {
  const baseModel = Object.freeze({
    challengeId: "content-placement-attempt:visit:morphology:s38-morphology:0:0:challenge:0:morphology",
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

  const awaitingCommit = render(deepFreeze({
    ...baseModel,
    status: "awaiting_mission_commit",
    slots: [baseModel.slots[0], { ...baseModel.slots[1], tileId: "morphology-ending-tile" }],
    sweep: "meaning_ready"
  }));
  assert.match(awaitingCommit, /Try a word ending/u);
  assert.doesNotMatch(awaitingCommit, />cats<\/strong>|more than one/u);

  assert.doesNotMatch(render({
    ...baseModel,
    challengeId: "fixture:assessed:challenge"
  }), /Try a word ending|Practice only|cats|more than one/u);
  assert.doesNotMatch(render({
    ...baseModel,
    instructionLabel: "Choose the letter or letter team for this sound."
  }), /Try a word ending|Practice only|cats|more than one/u);
});

test("correction renders only the exact controller transcript with selected contrast and no inferred copy", () => {
  const transcript = "You chose m. Listen to m and h, then try again.";
  const correctionModel = deepFreeze({
    ...fixture("hot", { placedCount: 0 }),
    correction: {
      supportLevel: 1,
      mode: "retry",
      replayContrast: true,
      isolatePosition: null,
      reduceIrrelevantLoad: false,
      modelOnce: false,
      requiresFreshAttempt: false,
      queueIsomorphicReview: false
    }
  });
  const presentation = deepFreeze({
    mode: "retry",
    replayContrast: true,
    selectedContrast: "m",
    visibleText: transcript,
    spokenText: transcript
  });
  const html = render(correctionModel, {
    correctionPresentation: presentation
  });
  assert.doesNotMatch(html, /ss-workbench__correction/u);
  assert.equal(occurrences(html, new RegExp(transcript, "gu")), 0);
  const childText = html.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ");
  assert.doesNotMatch(childText, /The answer|correct|wrong/iu);

  assert.doesNotMatch(render({
    ...fixture("hot", { placedCount: 0 }),
    correction: { supportLevel: 2, mode: "narrow", isolatePosition: "initial" }
  }), /Listen to the whole word|highlighted sound box|Watch one example/u);
  assert.doesNotMatch(render(fixture("hot", { placedCount: 0 }), {
    correctionPresentation: presentation
  }), /ss-workbench__correction/u);
  assert.doesNotMatch(render(correctionModel, {
    correctionPresentation: { ...presentation, mode: "narrow" }
  }), /ss-workbench__correction/u);
  assert.doesNotMatch(render(correctionModel, {
    correctionPresentation: { ...presentation, replayContrast: false }
  }), /ss-workbench__correction/u);
  assert.doesNotMatch(render(fixture("hot", { placedCount: 0 }), {
    correctionPresentation: {
      mode: "retry", replayContrast: true, selectedContrast: "m",
      visibleText: transcript, spokenText: "Different hidden speech"
    }
  }), /ss-workbench__correction/u);
});

test("the final blend control appears only when the power-owned sweep state requests it", () => {
  assert.doesNotMatch(render(fixture("cake")), /Sweep and read/u);
  const html = render(fixture("cake", { placedCount: 3, sweep: "ready" }));
  assert.match(html, /aria-label="Sweep and read the whole word"/u);
  assert.match(html, /Sweep and read/u);
});

test("the scoped stylesheet consumes canonical visual tokens and contains no raw color literals", () => {
  const css = readFileSync(new URL(
    "../../src/features/soundSeekers/ui/WordWorkbench.css",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/iu);
  assert.match(css, /var\(--ss-token-ink-deep\)/u);
  assert.match(css, /var\(--ss-token-focus-gold\)/u);
});
