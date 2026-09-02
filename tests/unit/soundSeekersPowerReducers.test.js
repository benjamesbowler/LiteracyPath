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
  const id = suffix => `${action.contextId}:${suffix}`;
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
      candidates: [
        { id: id("candidate:answer"), label: "first", token: answer },
        { id: id("candidate:decoy"), label: "second", token: `${action.instructionId}:decoy` }
      ],
      items: [
        { id: id("item:1"), label: "item one" },
        { id: id("item:2"), label: "item two" },
        { id: id("item:3"), label: "item three" },
        { id: id("item:4"), label: "item four" }
      ],
      bins: [
        { id: id("bin:1"), label: "first bin", token: answer },
        { id: id("bin:2"), label: "second bin", token: `${action.instructionId}:decoy` }
      ],
      rack: [
        { id: id("tile:answer"), label: "sh", token: answer },
        { id: id("tile:decoy"), label: "ch", token: `${action.instructionId}:decoy` }
      ],
      slots: [{ id: id("slot:0") }, { id: id("slot:1") }, { id: id("slot:2") }],
      segments: [{ id: id("segment:0"), label: "s" }, { id: id("segment:1"), label: "h" }],
      recipients: [
        { id: id("recipient:1"), label: "first place", token: answer },
        { id: id("recipient:2"), label: "second place", token: `${action.instructionId}:decoy` }
      ],
      choices: [
        { id: id("choice:1"), label: "first picture", token: answer },
        { id: id("choice:2"), label: "second picture", token: `${action.instructionId}:decoy` }
      ]
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
  const presentation = challenge.presentation;
  switch (action.powerId) {
    case "echo_search":
      return [
        { type: "probe", candidateId: presentation.candidates[0].id },
        { type: "confirm_candidate", candidateId: presentation.candidates[0].id }
      ];
    case "contrast_sort":
      return [{ type: action.expectedAction, itemId: presentation.items[0].id, binId: presentation.bins[0].id }];
    case "word_forge":
      return [{ type: "place_tile", tileId: presentation.rack[0].id }];
    case "blend_bridge":
      return [
        ...presentation.segments.map(segment => ({ type: "activate_segment", segmentId: segment.id })),
        { type: "sweep_blend" },
        { type: action.expectedAction, choiceId: presentation.choices[0].id, token: answer }
      ];
    case "memory_delivery":
      return [
        { type: "receive_cue" }, { type: "move", dx: 1, dy: 0 }, { type: "arrive" },
        { type: action.expectedAction, recipientId: presentation.recipients[0].id }
      ];
    case "story_power":
      return [{ type: "read_text" }, { type: action.expectedAction, choiceId: presentation.choices[0].id, token: answer }];
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

test("all two hundred authored contexts retain executable semantics and reach one pending intent", () => {
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
    assert.ok(runtime.semanticInputAllowlist.every(item => typeof item.semanticRequirement === "string"));
    assert.equal(recursivelyFrozen(runtime), true);

    const challenge = challengeFor(action);
    const played = play(action, transcriptFor(action, challenge));
    assert.equal(played.state.status, "awaiting_mission_commit", action.id);
    assert.equal(played.responseIntents.length, 1, action.id);
    assert.ok(played.state.semanticSteps.every(step => !step.includes(action.contextId)), action.id);
  }
});

test("distinct authored mechanics produce distinct normalized semantic transcripts without narrative IDs", () => {
  const lantern = actions.find(action => action.contextId === "s1-seed-lantern-search");
  const ford = actions.find(action => action.contextId === "s4-ford-sound-search");
  const lanternRuntime = createInteractionRuntimeModel(lantern, SOUND_SEEKERS_INTERACTION_CONTEXTS[lantern.contextId]);
  const fordRuntime = createInteractionRuntimeModel(ford, SOUND_SEEKERS_INTERACTION_CONTEXTS[ford.contextId]);
  assert.deepEqual(lanternRuntime.semanticRequirement, {
    decisionActions: ["choose"],
    decisionModel: "locate the printed source of a heard phoneme",
    inputPattern: "one heard phoneme with controlled grapheme bearing choices",
    physicalActionRoles: ["walk", "to", "reveal"]
  });
  assert.deepEqual(fordRuntime.semanticRequirement, {
    decisionActions: ["find"],
    decisionModel: "locate the printed source of a heard phoneme",
    inputPattern: "one heard phoneme with controlled grapheme bearing choices",
    physicalActionRoles: ["wade", "to", "pull"]
  });
  const probeRequirement = lanternRuntime.semanticInputAllowlist.find(item => item.type === "probe").semanticRequirement;
  const confirmRequirement = lanternRuntime.semanticInputAllowlist
    .find(item => item.type === "confirm_candidate").semanticRequirement;
  assert.match(probeRequirement, /^transition:probe\|decision:choose\|/u);
  assert.match(confirmRequirement, /^transition:confirm candidate\|decision:choose\|/u);
  assert.notEqual(probeRequirement, confirmRequirement);

  const lanternChallenge = challengeFor(lantern);
  const fordChallenge = challengeFor(ford);
  assert.deepEqual(
    transcriptFor(lantern, lanternChallenge).map(input => input.type),
    transcriptFor(ford, fordChallenge).map(input => input.type)
  );
  const lanternPlayed = play(lantern, transcriptFor(lantern, lanternChallenge));
  const fordPlayed = play(ford, transcriptFor(ford, fordChallenge));
  assert.notDeepEqual(lanternPlayed.state.semanticSteps, fordPlayed.state.semanticSteps);
  for (const [action, played] of [[lantern, lanternPlayed], [ford, fordPlayed]]) {
    assert.ok(played.state.semanticSteps.every(step => !step.includes(action.contextId)));
  }

  const crossedSemanticResume = {
    ...fordPlayed.power.checkpoint(fordPlayed.state),
    semanticSteps: lanternPlayed.state.semanticSteps
  };
  assert.throws(() => fordPlayed.power.createState(fordChallenge, {
    seed: 3,
    resume: crossedSemanticResume,
    interaction: interactionFor(ford)
  }), /semantic|resume|checkpoint/i);
});

test("narrative reskins with equivalent mechanics share one normalized semantic transcript", () => {
  const jam = actions.find(action => action.contextId === "s7-jam-crate-delivery");
  const tree = actions.find(action => action.contextId === "s24-tree-tone-delivery");
  const jamContext = SOUND_SEEKERS_INTERACTION_CONTEXTS[jam.contextId];
  const treeContext = SOUND_SEEKERS_INTERACTION_CONTEXTS[tree.contextId];
  assert.notEqual(jamContext.semanticRule, treeContext.semanticRule);
  assert.deepEqual(
    createInteractionRuntimeModel(jam, jamContext).semanticRequirement,
    createInteractionRuntimeModel(tree, treeContext).semanticRequirement
  );
  assert.deepEqual(
    play(jam, transcriptFor(jam, challengeFor(jam))).state.semanticSteps,
    play(tree, transcriptFor(tree, challengeFor(tree))).state.semanticSteps
  );
});

test("interaction runtime rejects altered contexts, missing references, and mismatched actions", () => {
  const action = actions[0];
  const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId];
  assert.throws(() => createInteractionRuntimeModel(action, { ...context, hiddenAction: "complete" }), /unknown interaction field/i);
  assert.throws(() => createInteractionRuntimeModel(action, { ...context, objectIds: [], objectRoles: [], recipientId: null, recipientRole: null }), /object or recipient/i);
  assert.throws(() => createInteractionRuntimeModel({ ...action, contextId: "other" }, context), /context/i);
  assert.throws(() => createInteractionRuntimeModel(action, { ...context, decisionSteps: ["Choose this and then finish."] }), /one immediate action/i);
  assert.throws(() => createInteractionRuntimeModel({ ...action, id: "caller-fabricated-action" }, context), /canonical action/i);
  assert.throws(() => createInteractionRuntimeModel({ ...action, activityFocus: "caller_override" }, context), /canonical action/i);
});

test("power creation binds fixed target, word, text, and heart subtype identities to the canonical action", () => {
  const fixedTarget = actions.find(action => Array.isArray(action.targetIds) && action.targetIds.length === 1);
  const fixedWord = actions.find(action => action.wordId && action.recordsDomain === "word_decoding");
  const fixedText = actions.find(action => action.connectedTextId && action.recordsDomain === "connected_text_transfer");
  const heart = actions.find(action => action.recordsDomain === "heart_word_mapping" && action.activityFocus);
  for (const [action, challengePatch] of [
    [fixedTarget, { targetId: "caller-target" }],
    [fixedWord, { targetId: "word:caller", wordId: "caller" }],
    [fixedText, { targetId: "text:caller", connectedTextId: "caller" }],
    [heart, { activityType: heart.activityFocus === "recognition" ? "encoding" : "recognition" }]
  ]) {
    const challenge = { ...challengeFor(action), ...challengePatch };
    assert.throws(() => SOUND_POWER_REGISTRY[action.powerId].createState(challenge, {
      seed: 4,
      interaction: interactionFor(action)
    }), /canonical action|challenge identity/i, action.id);
  }
});

test("every scored action rejects extra caller authority fields", () => {
  for (const contract of decisionContracts) {
    const action = actionForInstruction(contract.instructionId);
    const challenge = challengeFor(action);
    const transcript = transcriptFor(action, challenge);
    const prelude = transcript.slice(0, -1);
    const prepared = play(action, prelude);
    const answer = transcript.at(-1);
    for (const injected of [
      { correct: true }, { support: { level: 3 } }, { event: { correct: true } },
      { privateRecordId: "forged" }, { completion: true }
    ]) {
      const result = prepared.power.reduce(prepared.state, { ...answer, ...injected }, { challenge });
      assert.strictEqual(result.state, prepared.state, `${contract.instructionId}:${Object.keys(injected)[0]}`);
      assert.deepEqual(result.responseIntents, []);
    }
  }
});

test("physical selection IDs derive Echo, Contrast, and Memory response tokens", () => {
  const cases = [
    {
      instructionId: "echo-search-find-source",
      prelude(challenge) {
        return challenge.presentation.candidates.map(candidate => ({ type: "probe", candidateId: candidate.id }));
      },
      answer(action, challenge, index) {
        return { type: "confirm_candidate", candidateId: challenge.presentation.candidates[index].id };
      },
      token(challenge, index) {
        return challenge.presentation.candidates[index].token;
      }
    },
    {
      instructionId: "contrast-sort-place-sound",
      prelude() {
        return [];
      },
      answer(action, challenge, index) {
        return {
          type: action.expectedAction,
          itemId: challenge.presentation.items[0].id,
          binId: challenge.presentation.bins[index].id
        };
      },
      token(challenge, index) {
        return challenge.presentation.bins[index].token;
      }
    },
    {
      instructionId: "memory-delivery-deliver-sound",
      prelude() {
        return [{ type: "receive_cue" }, { type: "move", dx: 1, dy: 0 }, { type: "arrive" }];
      },
      answer(action, challenge, index) {
        return { type: action.expectedAction, recipientId: challenge.presentation.recipients[index].id };
      },
      token(challenge, index) {
        return challenge.presentation.recipients[index].token;
      }
    }
  ];
  for (const fixture of cases) {
    const action = actionForInstruction(fixture.instructionId);
    const challenge = challengeFor(action);
    for (const selectedIndex of [0, 1]) {
      const prepared = play(action, fixture.prelude(challenge));
      const answer = fixture.answer(action, challenge, selectedIndex);
      const result = prepared.power.reduce(prepared.state, answer, { challenge });
      assert.deepEqual(result.responseIntents, [{
        kind: "challenge_response",
        challengeId: challenge.challengeId,
        response: { kind: "literacy-answer", token: fixture.token(challenge, selectedIndex) }
      }]);
      assert.deepEqual(prepared.power.reduce(prepared.state, {
        ...answer,
        token: fixture.token(challenge, selectedIndex === 0 ? 1 : 0)
      }, { challenge }).responseIntents, [], `${fixture.instructionId}:caller token`);
    }
  }
});

test("Story Power narrative choice requires read_text and derives its private choice token", () => {
  const action = actionForInstruction("story-power-choose-story-action");
  const challenge = challengeFor(action);
  const power = SOUND_POWER_REGISTRY.story_power;
  const initial = power.createState(challenge, { seed: 9, interaction: interactionFor(action) });
  const choiceId = challenge.presentation.choices[1].id;
  assert.strictEqual(
    power.reduce(initial, { type: "narrative_choice", choiceId }, { challenge }).state,
    initial
  );
  const read = power.reduce(initial, { type: "read_text" }, { challenge }).state;
  assert.strictEqual(
    power.reduce(read, { type: "narrative_choice", choiceId, token: challenge.expectedToken }, { challenge }).state,
    read
  );
  const chosen = power.reduce(read, { type: "narrative_choice", choiceId }, { challenge }).state;
  assert.equal(chosen.narrativeChoiceToken, challenge.presentation.choices[1].token);
  assert.deepEqual(power.reduce(read, { type: "narrative_choice", choiceId }, { challenge }).responseIntents, []);
  const checkpoint = power.checkpoint(chosen);
  assert.deepEqual(power.checkpoint(power.createState(challenge, {
    seed: 9,
    interaction: interactionFor(action),
    resume: checkpoint
  })), checkpoint);
  assert.throws(() => power.createState(challenge, {
    seed: 9,
    interaction: interactionFor(action),
    resume: { ...checkpoint, narrativeChoiceToken: challenge.presentation.choices[0].token }
  }), /semantic|resume|checkpoint/i);
});

test("motor presentations preserve one semantic transcript and one exact response intent", () => {
  for (const action of actions) {
    const challenge = challengeFor(action);
    const baseline = play(action, transcriptFor(action, challenge));
    const baselineView = baseline.power.view(baseline.state, challenge, normalizeMotorAssists());
    const baselineCheckpoint = baseline.power.checkpoint(baseline.state);
    for (const key of ["autoTravel", "slowerMovement", "noDamageTravel", "largerTargets", "simplifiedScene", "extendedResponse"]) {
      const assisted = play(action, transcriptFor(action, challenge), normalizeMotorAssists({ [key]: true }));
      assert.deepEqual(assisted.responseIntents, baseline.responseIntents, `${action.id}:${key}`);
      assert.deepEqual(assisted.power.checkpoint(assisted.state), baselineCheckpoint, `${action.id}:${key}:state`);
      const assistedView = assisted.power.view(
        assisted.state, challenge, normalizeMotorAssists({ [key]: true })
      );
      assert.notDeepEqual(assistedView.motor, baselineView.motor, `${action.id}:${key}:motor`);
      assert.deepEqual(
        Object.fromEntries(Object.entries(assistedView).filter(([field]) => field !== "motor")),
        Object.fromEntries(Object.entries(baselineView).filter(([field]) => field !== "motor")),
        `${action.id}:${key}:semantic-view`
      );
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
    "challengeId", "correction", "instructionLabel", "morphology", "motor", "powerId", "rack",
    "slots", "status", "sweep", "visualCue"
  ]);
  assert.equal(recursivelyFrozen(initialView), true);
  assert.deepEqual(initialView.rack, challenge.presentation.rack.map(({ id, label }) => ({ id, label })));
  for (const forbidden of ["word", "wordId", "expectedToken", "optionTokens", "candidateTokens", "correct", "selected", "intended"]) {
    assert.equal(JSON.stringify(initialView).includes(`"${forbidden}"`), false, forbidden);
  }

  const placed = play(action, [{ type: "place_tile", tileId: challenge.presentation.rack[0].id }]);
  const checkpoint = placed.power.checkpoint(placed.state);
  assert.equal(recursivelyFrozen(checkpoint), true);
  assert.equal(checkpoint.slots[0].tileId, challenge.presentation.rack[0].id);
  assert.equal(checkpoint.rack.find(tile => tile.id === challenge.presentation.rack[0].id).placed, true);
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
      ...power.checkpoint(power.createState(challenge, { seed: 1, interaction: interactionFor(action) })),
      correction: {
        supportLevel: 2,
        isolatePosition: "initial"
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
  const checkpoint = power.checkpoint(state);
  assert.throws(() => power.createState(challenge, {
    seed: 1,
    interaction: interactionFor(action),
    resume: { ...checkpoint, correction: { ...checkpoint.correction, privateRecordId: "secret" } }
  }), /unknown correction|resume/i);
});

test("every power rejects partial, unknown, malformed, and impossible resume checkpoints", () => {
  for (const powerId of Object.keys(SOUND_POWER_REGISTRY)) {
    const action = actions.find(item => item.powerId === powerId);
    const challenge = challengeFor(action);
    const played = play(action, transcriptFor(action, challenge));
    const checkpoint = played.power.checkpoint(played.state);
    const initialCheckpoint = played.power.checkpoint(played.power.createState(challenge, {
      seed: 3,
      interaction: interactionFor(action)
    }));
    const cases = [
      {},
      Object.fromEntries(Object.entries(checkpoint).filter(([key]) => key !== "powerId")),
      { ...checkpoint, unknown: true },
      { ...checkpoint, status: "finished" },
      { ...checkpoint, revision: -1 },
      { ...checkpoint, semanticSteps: [7] },
      { ...checkpoint, correction: { supportLevel: Number.NaN } },
      {
        ...checkpoint,
        revision: checkpoint.revision + 1,
        semanticSteps: ["caller-authored-step", ...checkpoint.semanticSteps]
      }
    ];
    if (powerId === "echo_search") cases.push(
      { ...checkpoint, foundCandidateId: "unknown" },
      {
        ...initialCheckpoint,
        candidates: initialCheckpoint.candidates.map((candidate, index) => ({
          ...candidate,
          revealed: index === 0
        }))
      }
    );
    if (powerId === "contrast_sort") cases.push(
      { ...checkpoint, placements: { unknown: checkpoint.bins[0].id } },
      {
        ...initialCheckpoint,
        placements: { [initialCheckpoint.items[0].id]: initialCheckpoint.bins[0].id }
      }
    );
    if (powerId === "word_forge") cases.push(
      { ...checkpoint, rack: [checkpoint.rack[0], checkpoint.rack[0]] },
      {
        ...initialCheckpoint,
        rack: initialCheckpoint.rack.map((tile, index) => ({ ...tile, placed: index === 0 })),
        slots: initialCheckpoint.slots.map((slot, index) => ({
          ...slot,
          tileId: index === 0 ? initialCheckpoint.rack[0].id : null
        }))
      }
    );
    if (powerId === "blend_bridge") cases.push(
      { ...checkpoint, nextSegmentIndex: 0, sweepComplete: true },
      {
        ...initialCheckpoint,
        segments: initialCheckpoint.segments.map((segment, index) => ({ ...segment, active: index === 0 })),
        nextSegmentIndex: 1
      }
    );
    if (powerId === "memory_delivery") cases.push(
      { ...checkpoint, cueReceived: false, routeProgress: 0, arrived: true },
      { ...initialCheckpoint, cueReceived: true, cueVisible: false }
    );
    if (powerId === "story_power") cases.push(
      { ...checkpoint, textRead: false, status: "awaiting_mission_commit" },
      { ...initialCheckpoint, textRead: true }
    );
    for (const resume of cases) {
      assert.throws(() => played.power.createState(challenge, {
        seed: 3,
        resume,
        interaction: interactionFor(action)
      }), /resume|checkpoint/i, `${powerId}:${JSON.stringify(resume)}`);
    }
  }
});

test("power presentation and resume collections require unique nonempty context-bound IDs", () => {
  const mutations = [
    ["echo_search", "candidates"],
    ["contrast_sort", "items"],
    ["contrast_sort", "bins"],
    ["word_forge", "rack"],
    ["word_forge", "slots"],
    ["blend_bridge", "segments"],
    ["blend_bridge", "choices"],
    ["memory_delivery", "recipients"],
    ["story_power", "choices"]
  ];
  for (const [powerId, collection] of mutations) {
    const action = actions.find(item => item.powerId === powerId);
    const challenge = challengeFor(action);
    const ids = [
      challenge.presentation[collection][0].id,
      "",
      "foreign-context:item"
    ];
    for (const invalidId of ids) {
      const invalid = {
        ...challenge,
        presentation: {
          ...challenge.presentation,
          [collection]: challenge.presentation[collection].map((item, index) => index === 1
            ? { ...item, id: invalidId }
            : item)
        }
      };
      assert.throws(() => SOUND_POWER_REGISTRY[powerId].createState(invalid, {
        seed: 2,
        interaction: interactionFor(action)
      }), /unique nonempty|context-bound/i, `${powerId}:${collection}:${invalidId}`);
    }
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
  }), /expected 4-6 records/i);
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
  const checkpoint = power.checkpoint(result.state);
  assert.throws(() => power.createState(challenge, {
    seed: 38,
    interaction,
    resume: {
      ...checkpoint,
      revision: checkpoint.revision + 1,
      semanticSteps: ["caller-authored-step", ...checkpoint.semanticSteps]
    }
  }), /semantic|resume|checkpoint/i);
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
