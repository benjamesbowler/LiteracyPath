import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  SOUND_SEEKERS_INSTRUCTIONS,
  getInstructionContract
} from "../../src/features/soundSeekers/content/instructionContracts.js";
import {
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS
} from "../../src/features/soundSeekers/content/expeditions.js";
import {
  SOUND_POWER_REGISTRY,
  canonicalResponseIntent,
  createInteractionRuntimeModel
} from "../../src/features/soundSeekers/engine/powers/index.js";
import { normalizeMotorAssists } from "../../src/features/soundSeekers/engine/motorAssists.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const actions = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => [
  ...expedition.phases.filter(phase => phase.powerId),
  ...expedition.heartWordOpportunities
]);
const decisionContracts = Object.values(SOUND_SEEKERS_INSTRUCTIONS).filter(item => item.phase === "decision");

function recursivelyFrozen(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every(item => recursivelyFrozen(item, seen));
}

function allObjectKeys(value, found = new Set()) {
  if (!value || typeof value !== "object") return found;
  for (const [key, item] of Object.entries(value)) {
    found.add(key);
    allObjectKeys(item, found);
  }
  return found;
}

function actionForInstruction(instructionId) {
  const action = actions.find(item => item.instructionId === instructionId);
  assert.ok(action, `missing authored action for ${instructionId}`);
  return action;
}

function identityFor(contract, action) {
  if (["phoneme_to_grapheme", "grapheme_to_phoneme"].includes(contract.recordsDomain)) {
    return { targetId: action.targetIds?.[0] || "sh", position: null };
  }
  if (["word_decoding", "word_segmentation_encoding"].includes(contract.recordsDomain)) {
    const wordId = action.wordId || "ship";
    return {
      targetId: `word:${wordId}`,
      wordId,
      position: contract.recordsDomain === "word_decoding" ? "whole" : 0
    };
  }
  if (contract.recordsDomain === "heart_word_mapping") {
    return { targetId: "hw:the", wordId: "the", activityType: action.activityFocus || "recognition" };
  }
  if (contract.recordsDomain === "connected_text_transfer") {
    const connectedTextId = action.connectedTextId || "scene-s1";
    return { targetId: `text:${connectedTextId}`, connectedTextId };
  }
  const wordId = action.wordId || "stone";
  const bossTransferId = "forge-settlement-boss";
  return {
    targetId: `novel:${bossTransferId}:${wordId}`,
    wordId,
    position: "whole",
    bossTransferId
  };
}

function challengeFor(action) {
  const contract = getInstructionContract(action.instructionId);
  const answer = `${action.instructionId}:answer`;
  const challenge = {
    challengeId: `${action.id}:challenge`,
    attemptId: `${action.id}:attempt:0`,
    instructionId: contract.instructionId,
    powerId: contract.powerId,
    expectedAction: contract.expectedAction,
    recordsDomain: contract.recordsDomain,
    expectedToken: answer,
    optionTokens: [answer, `${action.instructionId}:decoy`],
    childText: contract.childText,
    cue: contract.cue,
    requiresAudio: false,
    ...identityFor(contract, action),
    presentation: {
      candidates: [{ id: "answer", label: "first" }, { id: "decoy", label: "second" }],
      items: [
        { id: "item-1", label: "item one" },
        { id: "item-2", label: "item two" },
        { id: "item-3", label: "item three" },
        { id: "item-4", label: "item four" }
      ],
      bins: [{ id: "bin-1", label: "first bin" }, { id: "bin-2", label: "second bin" }],
      rack: [
        { id: "tile-answer", label: "sh", token: answer },
        { id: "tile-decoy", label: "ch", token: `${action.instructionId}:decoy` }
      ],
      slots: [{ id: "slot-0" }, { id: "slot-1" }, { id: "slot-2" }],
      segments: [{ id: "segment-0", label: "s" }, { id: "segment-1", label: "h" }],
      recipients: [{ id: "recipient-1", label: "first place" }],
      choices: [{ id: "choice-1", label: "first picture", token: answer }]
    }
  };
  return Object.freeze(challenge);
}

function interactionFor(action) {
  return Object.freeze({
    action,
    context: SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId]
  });
}

function transcriptFor(action, challenge) {
  const answer = challenge.expectedToken;
  switch (action.powerId) {
    case "echo_search":
      return [{ type: "probe", candidateId: "answer" }, { type: "confirm_candidate", candidateId: "answer", token: answer }];
    case "contrast_sort":
      return [{ type: action.expectedAction, itemId: "item-1", binId: "bin-1", token: answer }];
    case "word_forge":
      return [{ type: "place_tile", tileId: "tile-answer" }];
    case "blend_bridge":
      return [
        { type: "activate_segment", segmentId: "segment-0" },
        { type: "activate_segment", segmentId: "segment-1" },
        { type: "sweep_blend" },
        { type: action.expectedAction, token: answer }
      ];
    case "memory_delivery":
      return [{ type: "receive_cue" }, { type: "move", dx: 1, dy: 0 }, { type: "arrive" }, { type: action.expectedAction, token: answer }];
    case "story_power":
      return [{ type: "read_text" }, { type: action.expectedAction, token: answer }];
    default:
      throw new Error(`unknown power ${action.powerId}`);
  }
}

function play(action, transcript, assists = normalizeMotorAssists()) {
  const challenge = challengeFor(action);
  const power = SOUND_POWER_REGISTRY[action.powerId];
  let state = power.createState(challenge, {
    seed: 3,
    resume: null,
    interaction: interactionFor(action)
  });
  let responseIntents = [];
  for (const input of transcript) {
    const result = power.reduce(state, input, { challenge, assists });
    state = result.state;
    responseIntents.push(...result.responseIntents);
  }
  return { challenge, power, state, responseIntents };
}

test("all twelve exact decision variants emit only their own pending response intent", () => {
  assert.equal(decisionContracts.length, 12);
  for (const contract of decisionContracts) {
    const action = actionForInstruction(contract.instructionId);
    const challenge = challengeFor(action);
    const positive = play(action, transcriptFor(action, challenge));
    assert.equal(positive.state.status, "awaiting_mission_commit", contract.instructionId);
    assert.deepEqual(positive.responseIntents, [{
      kind: "challenge_response",
      challengeId: challenge.challengeId,
      response: { kind: "literacy-answer", token: challenge.expectedToken }
    }]);
    for (const foreign of decisionContracts.filter(item => item.powerId === contract.powerId && item.instructionId !== contract.instructionId)) {
      const foreignAction = actionForInstruction(foreign.instructionId);
      const foreignChallenge = challengeFor(foreignAction);
      const result = play(action, transcriptFor(foreignAction, foreignChallenge));
      assert.notEqual(result.state.status, "awaiting_mission_commit", `${contract.instructionId} accepted ${foreign.instructionId}`);
    }
  }
});

test("movement, exploration, caller outcomes, and second answers never emit response intents", () => {
  for (const powerId of Object.keys(SOUND_POWER_REGISTRY)) {
    const action = actions.find(item => item.powerId === powerId);
    const challenge = challengeFor(action);
    const power = SOUND_POWER_REGISTRY[powerId];
    const initial = power.createState(challenge, { seed: 3, resume: null, interaction: interactionFor(action) });
    for (const input of [
      { type: "move", dx: 1, dy: 0 }, { type: "probe", candidateId: "decoy" },
      { type: "collect", id: "leaf" }, { type: "complete" }, { type: "correct", correct: true },
      { type: "support", level: 3 }, { type: "event", event: {} }
    ]) assert.deepEqual(power.reduce(initial, input, { challenge }).responseIntents, []);

    const completed = play(action, transcriptFor(action, challenge));
    const second = power.reduce(completed.state, transcriptFor(action, challenge).at(-1), { challenge });
    assert.deepEqual(second.responseIntents, []);
    assert.strictEqual(second.state, completed.state);
  }
});

test("every power checkpoint restores the exact safe pending learning step without a fresh intent", () => {
  for (const powerId of Object.keys(SOUND_POWER_REGISTRY)) {
    const action = actions.find(item => item.powerId === powerId);
    const challenge = challengeFor(action);
    const played = play(action, transcriptFor(action, challenge));
    const checkpoint = played.power.checkpoint(played.state);
    const restored = played.power.createState(challenge, {
      seed: 3,
      resume: checkpoint,
      interaction: interactionFor(action)
    });
    assert.deepEqual(played.power.checkpoint(restored), checkpoint, powerId);
    assert.deepEqual(played.power.reduce(restored, transcriptFor(action, challenge).at(-1), { challenge }).responseIntents, []);
  }
});

test("all two hundred authored contexts retain exact semantics and reach one pending intent", () => {
  assert.equal(actions.length, 200);
  assert.equal(Object.keys(SOUND_SEEKERS_INTERACTION_CONTEXTS).length, 200);
  for (const action of actions) {
    const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId];
    const runtime = createInteractionRuntimeModel(action, context);
    assert.equal(runtime.contextId, context.id);
    for (const field of [
      "semanticRule", "childDecision", "decisionSteps", "objectIds", "objectRoles",
      "recipientId", "recipientRole", "physicalExpression", "consequenceId", "consequence",
      "activityFocus", "decisionModel", "inputPattern", "failureOrCorrectionModel",
      "learningConsequenceModel", "mechanicRoles", "physicalActionRoles", "contentCategory",
      "mechanicFamilyId", "constructId", "decisionConstruct", "inputConstruct",
      "correctionConstruct", "physicalActionConstruct", "evidenceConstruct", "cognitiveSignature"
    ]) assert.deepEqual(runtime[field], context[field], `${context.id}:${field}`);
    assert.equal(runtime.validInputs.includes("approach_and_complete"), false);
    assert.ok(runtime.semanticInputAllowlist.every(item => item.contextId === context.id));
    assert.equal(recursivelyFrozen(runtime), true);

    const challenge = challengeFor(action);
    const played = play(action, transcriptFor(action, challenge));
    assert.equal(played.state.status, "awaiting_mission_commit", action.id);
    assert.equal(played.responseIntents.length, 1, action.id);
  }
});

test("interaction runtime rejects altered contexts, missing references, and mismatched actions", () => {
  const action = actions[0];
  const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId];
  assert.throws(() => createInteractionRuntimeModel(action, { ...context, hiddenAction: "complete" }), /unknown interaction field/i);
  assert.throws(() => createInteractionRuntimeModel(action, { ...context, objectIds: [], objectRoles: [], recipientId: null, recipientRole: null }), /object or recipient/i);
  assert.throws(() => createInteractionRuntimeModel({ ...action, contextId: "other" }, context), /context/i);
  assert.throws(() => createInteractionRuntimeModel(action, { ...context, decisionSteps: ["Choose this and then finish."] }), /one immediate action/i);
});

test("motor presentations preserve one semantic transcript and one exact response intent", () => {
  for (const action of actions) {
    const challenge = challengeFor(action);
    const baseline = play(action, transcriptFor(action, challenge));
    for (const key of ["autoTravel", "slowerMovement", "noDamageTravel", "largerTargets", "simplifiedScene", "extendedResponse"]) {
      const assisted = play(action, transcriptFor(action, challenge), normalizeMotorAssists({ [key]: true }));
      assert.deepEqual(assisted.responseIntents, baseline.responseIntents, `${action.id}:${key}`);
      assert.deepEqual(assisted.state.semanticSteps, baseline.state.semanticSteps, `${action.id}:${key}`);
      assert.equal(assisted.state.status, "awaiting_mission_commit");
    }
  }
});

test("canonical intents are exact, recursively frozen, and recordable only", () => {
  const action = actionForInstruction("echo-search-find-source");
  const challenge = challengeFor(action);
  const intent = canonicalResponseIntent(challenge, { kind: "literacy-answer", token: "sh" });
  assert.deepEqual(intent, {
    kind: "challenge_response",
    challengeId: challenge.challengeId,
    response: { kind: "literacy-answer", token: "sh" }
  });
  assert.equal(recursivelyFrozen(intent), true);
  assert.throws(() => canonicalResponseIntent({ ...challenge, recordsDomain: null }, { kind: "literacy-answer", token: "sh" }), /recordable/i);
  assert.throws(() => canonicalResponseIntent(challenge, { kind: "reward", token: "sh" }), /literacy-answer/i);
});

test("Word Forge exposes only a frozen answer-neutral workbench and checkpoints stable placement", () => {
  const action = actionForInstruction("word-forge-place-tile");
  const challenge = challengeFor(action);
  const initial = play(action, []);
  const initialView = initial.power.view(initial.state, challenge, normalizeMotorAssists({ largerTargets: true }));
  assert.deepEqual(Object.keys(initialView).sort(), [
    "challengeId", "correction", "instructionLabel", "morphology", "powerId", "rack",
    "slots", "status", "sweep", "visualCue"
  ]);
  assert.equal(recursivelyFrozen(initialView), true);
  assert.deepEqual(initialView.rack, [
    { id: "tile-answer", label: "sh" }, { id: "tile-decoy", label: "ch" }
  ]);
  for (const forbidden of ["word", "wordId", "expectedToken", "optionTokens", "candidateTokens", "correct", "selected", "intended"]) {
    assert.equal(JSON.stringify(initialView).includes(`"${forbidden}"`), false, forbidden);
  }

  const placed = play(action, [{ type: "place_tile", tileId: "tile-answer" }]);
  const checkpoint = placed.power.checkpoint(placed.state);
  assert.equal(recursivelyFrozen(checkpoint), true);
  assert.equal(checkpoint.slots[0].tileId, "tile-answer");
  assert.equal(checkpoint.rack.find(tile => tile.id === "tile-answer").placed, true);
  assert.equal(JSON.stringify(checkpoint).includes(challenge.expectedToken), false);
});

test("views redact private correction authority and never mutate source challenge arrays", () => {
  const action = actionForInstruction("contrast-sort-place-sound");
  const expectedToken = challengeFor(action).expectedToken;
  const mutableOptions = [expectedToken, "no"];
  const challenge = { ...challengeFor(action), optionTokens: mutableOptions };
  const power = SOUND_POWER_REGISTRY[action.powerId];
  const state = power.createState(challenge, {
    seed: 1,
    interaction: interactionFor(action),
    resume: {
      correction: {
        supportLevel: 2,
        isolatePosition: "initial",
        selected: "no",
        intended: "yes",
        correct: false,
        privateRecordId: "secret"
      }
    }
  });
  const view = power.view(state, challenge, normalizeMotorAssists());
  mutableOptions.push("later");
  assert.equal(recursivelyFrozen(view), true);
  assert.deepEqual(view.correction, { supportLevel: 2, isolatePosition: "initial" });
  const publicKeys = allObjectKeys(view);
  for (const forbidden of ["privateRecordId", "selected", "intended", "correct"]) {
    assert.equal(publicKeys.has(forbidden), false, forbidden);
  }
});

test("Contrast Sort rejects a partial item set instead of collapsing to one choice", () => {
  const action = actionForInstruction("contrast-sort-place-sound");
  const challenge = challengeFor(action);
  const partial = {
    ...challenge,
    presentation: { ...challenge.presentation, items: challenge.presentation.items.slice(0, 3) }
  };
  assert.throws(() => SOUND_POWER_REGISTRY.contrast_sort.createState(partial, {
    seed: 2,
    interaction: interactionFor(action)
  }), /four-to-six item set/i);
});

test("the exact s38 morphology application emits its sole zero-evidence content response", () => {
  const attemptId = "content-placement-attempt:visit:morphology:s38-morphology:0:0";
  const challenge = Object.freeze({
    challengeId: `${attemptId}:challenge:0:morphology`,
    attemptId,
    targetOrdinal: 0,
    recordsDomain: null,
    powerId: "word_forge",
    expectedAction: "introduce_word_ending",
    instructionId: "morphology-teach",
    wordId: "cats",
    position: null,
    optionTokens: Object.freeze([]),
    childText: "Add s to cat to make cats.",
    requiresAudio: false
  });
  const interaction = Object.freeze({
    kind: "morphology_introduction",
    baseWord: "cat",
    ending: "s",
    derivedWord: "cats",
    meaning: "more than one"
  });
  const power = SOUND_POWER_REGISTRY.word_forge;
  const state = power.createState(challenge, { seed: 38, resume: null, interaction });
  const view = power.view(state, challenge, normalizeMotorAssists());
  assert.deepEqual(view.morphology, interaction);
  assert.deepEqual(view.rack, [{ id: "morphology-ending-tile", label: "s" }]);
  assert.equal(recursivelyFrozen(view), true);
  const result = power.reduce(state, { type: "place_tile", tileId: "morphology-ending-tile" }, { challenge });
  assert.deepEqual(result.responseIntents, [{
    kind: "content_response",
    challengeId: challenge.challengeId,
    response: {
      challengeId: challenge.challengeId,
      kind: "non-recording-complete",
      action: "introduce_word_ending"
    }
  }]);
  assert.equal(result.state.status, "awaiting_mission_commit");
  assert.equal(recursivelyFrozen(result), true);
  assert.deepEqual(power.reduce(state, {
    type: "place_tile",
    tileId: "morphology-ending-tile",
    baseWord: "caller-supplied"
  }, { challenge }).responseIntents, []);

  assert.throws(() => power.createState({ ...challenge, attemptId: "other", challengeId: "other" }, { seed: 38, interaction }), /s38 morphology/i);
  assert.throws(() => power.createState(challenge, { seed: 38, interaction: { ...interaction } }), /recursively frozen/i);
  const genericUnscored = { ...challenge, instructionId: "word-forge-teach", expectedAction: "place_grapheme_tile" };
  assert.throws(() => power.createState(genericUnscored, { seed: 1, interaction }), /s38 morphology|decision/i);
});

test("power modules import neither evidence, persistence, nor deck mutators", () => {
  const powerDirectory = path.join(repositoryRoot, "src/features/soundSeekers/engine/powers");
  for (const filename of ["contracts.js", "echoSearch.js", "contrastSort.js", "wordForge.js", "blendBridge.js", "memoryDelivery.js", "storyPower.js", "index.js"]) {
    const source = readFileSync(path.join(powerDirectory, filename), "utf8");
    assert.doesNotMatch(source, /(?:evidence\.js|contentDeckTransactions|recordContentDeckUse|stateV2|persistence)/u, filename);
  }
});
