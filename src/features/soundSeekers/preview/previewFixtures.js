import { getContentDeckOwnerBinding } from "../content/contentDeckBindings.js";
import { getContentDeckCatalogRecord } from "../content/contentDeckCatalogs.js";
import {
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS
} from "../content/expeditions.js";
import { SOUND_SEEKERS_HEART_WORDS } from "../content/heartWords.js";
import { getInstructionContract } from "../content/instructionContracts.js";
import { getPronunciation } from "../content/pronunciationLexicon.js";
import { toChildChallengeView } from "../engine/challengeContract.js";
import {
  createChallenge,
  createStoryChildScene
} from "../engine/createChallenge.js";
import { createContentDeckState } from "../engine/contentDeckState.js";
import {
  projectBoundContentResolverInputs,
  serveContentDeck
} from "../engine/contentDeckScheduler.js";
import { createInteractionRuntimeModel } from "../engine/powers/contracts.js";
import { SOUND_POWER_REGISTRY } from "../engine/powers/index.js";
import { createHeartWordChoices } from "../content/childChoiceContent.js";

const PREVIEW_SEED = 11;
const REQUEST_KEYS = new Set(["fixtureId", "stop", "phase", "power"]);
const FIXTURE_SPECS = Object.freeze([
  Object.freeze({ id: "s1-primary-echo-search", stopId: "s1", actionId: "s1-primary", contentId: "a", slotId: null }),
  Object.freeze({ id: "s2-primary-contrast-sort", stopId: "s2", actionId: "s2-primary", contentId: "n", slotId: null }),
  Object.freeze({ id: "s11-primary-contrast-sort", stopId: "s11", actionId: "s11-primary", contentId: "rock", slotId: null }),
  Object.freeze({ id: "s6-primary-contrast-sort", stopId: "s6", actionId: "s6-primary", contentId: "heart-word:my", slotId: "heart-slot-s6-1" }),
  Object.freeze({ id: "s1-secondary-word-forge", stopId: "s1", actionId: "s1-secondary", contentId: "mat", slotId: null }),
  Object.freeze({ id: "s2-secondary-blend-bridge", stopId: "s2", actionId: "s2-secondary", contentId: "sit", slotId: null }),
  Object.freeze({ id: "s5-transfer-blend-bridge", stopId: "s5", actionId: "s5-transfer", contentId: "cat", slotId: "transfer-slot-s5" }),
  Object.freeze({ id: "s3-primary-memory-delivery", stopId: "s3", actionId: "s3-primary", contentId: "o", slotId: null }),
  Object.freeze({ id: "s7-primary-memory-delivery", stopId: "s7", actionId: "s7-primary", contentId: "jam", slotId: null }),
  Object.freeze({ id: "s1-heart-1-memory-delivery", stopId: "s1", actionId: "s1-heart-1", contentId: "heart-word:a", slotId: "heart-slot-s1-1" }),
  Object.freeze({ id: "s3-transfer-memory-delivery", stopId: "s3", actionId: "s3-transfer", contentId: "scene-s3", slotId: "transfer-slot-s3" }),
  Object.freeze({ id: "s1-transfer-story-power", stopId: "s1", actionId: "s1-transfer", contentId: "scene-s1", slotId: "transfer-slot-s1" })
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function canonicalAction(spec) {
  const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === spec.stopId);
  const action = [...(expedition?.phases || []), ...(expedition?.heartWordOpportunities || [])]
    .find(item => item.id === spec.actionId);
  if (!expedition || !action || !action.contextId) {
    throw new Error(`${spec.id}: preview fixture does not point to an authored action`);
  }
  return { expedition, action };
}

function heartRecord(spec) {
  return SOUND_SEEKERS_HEART_WORDS.find(record => record.contentId === spec.contentId
    && record.slotIds.includes(spec.slotId)) || null;
}

function assertContentIdentity(spec, expedition, action) {
  if (action.contentBinding?.category === "heartWords") {
    const record = heartRecord(spec);
    if (!record || spec.slotId !== action.contentBinding.slotId) {
      throw new Error(`${spec.id}: preview heart-word content is not authored for its action`);
    }
    return;
  }
  if (action.connectedTextId) {
    const record = getContentDeckCatalogRecord("transfer", `transfer:${spec.stopId}`);
    if (!record || spec.slotId !== expedition.contentDeckSlotIds.transfer[0]
      || !record.slotIds.includes(spec.slotId)
      || record.instructionId !== action.instructionId
      || spec.contentId !== (action.wordId || action.connectedTextId)) {
      throw new Error(`${spec.id}: preview transfer content is not authored for its action`);
    }
    return;
  }
  if (spec.slotId !== null || spec.contentId !== (action.wordId || action.targetIds?.[0])) {
    throw new Error(`${spec.id}: preview learning content is not authored for its action`);
  }
}

function interactionFor(action) {
  return Object.freeze({
    action,
    context: SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId]
  });
}

function ordinaryPublicSurface(spec, action) {
  let contentSource = null;
  if (action.contentBinding?.category === "heartWords") {
    const binding = getContentDeckOwnerBinding("heartWords", spec.slotId);
    const served = serveContentDeck(createContentDeckState(), {
      binding,
      visitId: `preview-visit:${spec.id}`,
      stopId: spec.stopId,
      journeyStep: Number(spec.stopId.slice(1)),
      seed: PREVIEW_SEED
    });
    contentSource = projectBoundContentResolverInputs(served);
  }
  const challenge = createChallenge({
    action,
    missionId: `preview:${spec.id}`,
    attemptOrdinal: 0,
    seed: PREVIEW_SEED,
    selectedTargetId: action.targetIds?.[0] || null,
    contentSource
  });
  const child = toChildChallengeView(challenge);
  const power = SOUND_POWER_REGISTRY[action.powerId];
  if (!child || !power) throw new Error(`${spec.id}: preview challenge has no public model`);
  const state = power.createState(challenge, {
    seed: PREVIEW_SEED,
    resume: null,
    interaction: interactionFor(action)
  });
  return Object.freeze({ child, model: power.view(state, challenge) });
}

function safeChallengeView(value, fixtureId) {
  const challenge = deepFreeze(value);
  const child = toChildChallengeView(challenge);
  if (!child) throw new Error(`${fixtureId}: preview challenge cannot produce a child view`);
  return child;
}

function heartMemorySurface(spec, action) {
  const record = heartRecord(spec);
  const choiceToken = record?.answerTokensByActivity[action.activityFocus];
  if (!record || !choiceToken) throw new Error(`${spec.id}: preview heart-word choice is unavailable`);
  const options = createHeartWordChoices({
    record,
    activityType: action.activityFocus,
    stopId: spec.stopId,
    seed: PREVIEW_SEED
  });
  const optionTokens = options.map(option => option.token);
  const challenge = deepFreeze({
    challengeId: `preview:${spec.id}:challenge`,
    attemptId: `preview:${spec.id}:attempt:0`,
    targetId: record.targetId,
    recordsDomain: action.recordsDomain,
    powerId: action.powerId,
    wordId: record.wordId,
    activityType: action.activityFocus,
    expectedAction: action.expectedAction,
    instructionId: action.instructionId,
    expectedToken: choiceToken,
    optionTokens,
    childText: "Carry the whole word to its matching place.",
    cue: "whole_word",
    requiresAudio: false,
    presentation: {
      recipients: options.map((option, index) => ({
        id: `${action.contextId}:preview:${spec.id}:recipient:${index}`,
        label: option.label,
        token: option.token
      }))
    }
  });
  const child = safeChallengeView(challenge, spec.id);
  const power = SOUND_POWER_REGISTRY[action.powerId];
  const state = power.createState(challenge, {
    seed: PREVIEW_SEED,
    resume: null,
    interaction: interactionFor(action)
  });
  return Object.freeze({
    child,
    model: power.view(state, challenge)
  });
}

function connectedTextSurface(spec, action) {
  const record = getContentDeckCatalogRecord("transfer", `transfer:${spec.stopId}`);
  const boss = action.powerId === "blend_bridge";
  if (!record || Boolean(record.bossDecision) !== boss) {
    throw new Error(`${spec.id}: preview transfer decision is unavailable`);
  }
  const scene = createStoryChildScene(action.connectedTextId, spec.id);
  const pronunciation = boss ? getPronunciation(action.wordId) : null;
  if (boss && !pronunciation) {
    throw new Error(`${spec.id}: preview boss pronunciation is unavailable`);
  }
  const id = suffix => `${action.contextId}:preview:${spec.id}:${suffix}`;
  const presentation = boss ? {
    segments: pronunciation.units.map((unit, index) => ({
      id: id(`segment:${index}`), label: unit.grapheme
    })),
    choices: record.bossDecision.options.map((option, index) => ({
      id: id(`choice:${index}`), label: option.childText, token: option.token
    }))
  } : action.powerId === "memory_delivery" ? {
    recipients: scene.choice.options.map((option, index) => ({
      id: id(`recipient:${index}`), label: option.childLabel, token: option.token
    }))
  } : {
    choices: scene.choice.options.map((option, index) => ({
      id: id(`choice:${index}`), label: option.childLabel, token: option.token
    }))
  };
  const challenge = deepFreeze({
    challengeId: `preview:${spec.id}:challenge`,
    attemptId: `preview:${spec.id}:attempt:0`,
    targetId: record.targetId,
    recordsDomain: record.recordsDomain,
    powerId: record.powerId,
    expectedAction: record.expectedAction,
    instructionId: record.instructionId,
    ...(boss ? {
      wordId: record.wordId,
      position: "whole",
      bossTransferId: record.bossTransferId,
      connectedTextId: null
    } : { connectedTextId: record.connectedTextId }),
    optionTokens: record.decisionContract.optionTokens,
    expectedToken: record.decisionContract.expectedToken,
    childText: getInstructionContract(record.instructionId).childText,
    requiresAudio: false,
    presentation
  });
  const child = safeChallengeView(challenge, spec.id);
  const power = SOUND_POWER_REGISTRY[action.powerId];
  const state = power.createState(challenge, {
    seed: PREVIEW_SEED,
    resume: null,
    interaction: interactionFor(action)
  });
  const model = power.view(state, challenge);
  if (boss) {
    return Object.freeze({
      child,
      model: deepFreeze({
        ...model,
        narrativeOptions: scene.choice.options,
      }),
      optionTokens: child.optionTokens
    });
  }
  return Object.freeze({
    child,
    model,
    optionTokens: scene.choice.options.map(option => option.token)
  });
}

function actorStep(controlId, optionToken = null, sourceToken = null) {
  return { controlId, optionToken, sourceToken };
}

function deriveActorTranscripts(spec, action, runtime) {
  const surface = action.connectedTextId
    ? connectedTextSurface(spec, action)
    : action.kind === "content_opportunity"
      ? heartMemorySurface(spec, action)
      : ordinaryPublicSurface(spec, action);
  const { child, model } = surface;
  const optionTokens = surface.optionTokens || child.optionTokens;
  let transcripts;
  if (action.powerId === "echo_search") {
    transcripts = model.candidates.map(candidate => [
      actorStep("probe", candidate.label),
      actorStep("confirm_candidate", candidate.label)
    ]);
  } else if (action.powerId === "contrast_sort") {
    transcripts = model.items.flatMap(item => model.bins.map(bin => [
      actorStep(action.expectedAction, bin.label, item.label)
    ]));
  } else if (action.powerId === "word_forge") {
    transcripts = model.rack.map(tile => [actorStep("place_tile", tile.label)]);
  } else if (action.powerId === "blend_bridge") {
    const blendChoices = model.choices.map((unused, index) => ({
      transcript: [
        ...model.segments.map(segment => actorStep("activate_segment", null, segment.label)),
        actorStep("sweep_blend"),
        actorStep(action.expectedAction, optionTokens[index])
      ]
    }));
    transcripts = model.narrativeOptions
      ? model.narrativeOptions.flatMap(narrativeOption => blendChoices.map(choice => [
        actorStep("choose_narrative_route", narrativeOption.token),
        ...choice.transcript
      ]))
      : blendChoices.map(choice => choice.transcript);
  } else if (action.powerId === "memory_delivery") {
    const recipients = model.recipients || model.choices;
    transcripts = recipients.map((recipient, index) => [
      actorStep("receive_cue"),
      actorStep("move"),
      actorStep("arrive"),
      actorStep(action.expectedAction, recipient.token ?? optionTokens[index])
    ]);
  } else if (action.powerId === "story_power") {
    transcripts = model.choices.map((choice, index) => [
      actorStep("read_text"),
      actorStep(action.expectedAction, choice.token ?? optionTokens[index])
    ]);
  } else {
    throw new Error(`${spec.id}: preview power is unsupported`);
  }
  if (transcripts.length < 2 || transcripts.some(transcript => transcript.length === 0)) {
    throw new Error(`${spec.id}: preview has incomplete public actor paths`);
  }
  for (const transcript of transcripts) {
    for (const entry of transcript) {
      if (!runtime.validInputs.includes(entry.controlId)
        && !(action.powerId === "blend_bridge"
          && entry.controlId === "choose_narrative_route")) {
        throw new Error(`${spec.id}: preview actor control is not public`);
      }
    }
  }
  return deepFreeze(transcripts);
}

function createFixture(spec) {
  const { expedition, action } = canonicalAction(spec);
  const contract = getInstructionContract(action.instructionId);
  const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId];
  if (!contract || !context
    || contract.phase !== "decision"
    || contract.powerId !== action.powerId
    || contract.expectedAction !== action.expectedAction
    || contract.recordsDomain !== action.recordsDomain) {
    throw new Error(`${spec.id}: preview decision contract is not canonical`);
  }
  assertContentIdentity(spec, expedition, action);
  const runtime = createInteractionRuntimeModel(action, context);
  return deepFreeze({
    id: spec.id,
    stopId: spec.stopId,
    phaseId: action.id,
    actionId: action.id,
    contextId: action.contextId,
    contentId: spec.contentId,
    slotId: spec.slotId,
    instructionId: contract.instructionId,
    powerId: contract.powerId,
    expectedAction: contract.expectedAction,
    recordsDomain: contract.recordsDomain,
    legalActorTranscripts: deriveActorTranscripts(spec, action, runtime)
  });
}

export const SOUND_SEEKERS_PREVIEW_FIXTURES = deepFreeze(FIXTURE_SPECS.map(createFixture));

const fixtureById = new Map(SOUND_SEEKERS_PREVIEW_FIXTURES.map(fixture => [fixture.id, fixture]));

function readPreviewRequest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)
    || Object.getPrototypeOf(raw) !== Object.prototype) {
    throw new Error("preview fixture request shape is invalid");
  }
  const descriptors = Object.getOwnPropertyDescriptors(raw);
  const fixtureDescriptor = descriptors.fixtureId;
  if (!fixtureDescriptor) {
    throw new Error("preview fixture identity is required");
  }
  if (!Object.hasOwn(fixtureDescriptor, "value")) {
    throw new Error("preview fixture request shape is invalid");
  }
  if (typeof fixtureDescriptor.value !== "string" || !fixtureDescriptor.value.trim()) {
    throw new Error("preview fixture identity is required");
  }
  const keys = Reflect.ownKeys(descriptors);
  if (keys.some(key => typeof key !== "string" || !REQUEST_KEYS.has(key))) {
    throw new Error("preview fixture request shape is invalid");
  }
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (!Object.hasOwn(descriptor, "value") || descriptor.enumerable !== true
      || typeof descriptor.value !== "string" || !descriptor.value.trim()) {
      throw new Error("preview fixture request shape is invalid");
    }
  }
  return Object.fromEntries(keys.map(key => [key, descriptors[key].value]));
}

export function resolveSoundSeekersPreviewFixture(request) {
  const raw = readPreviewRequest(request);
  const fixture = fixtureById.get(raw.fixtureId);
  if (!fixture) throw new Error("preview fixture is unknown");
  for (const [requestKey, fixtureKey] of [
    ["stop", "stopId"], ["phase", "phaseId"], ["power", "powerId"]
  ]) {
    if (Object.hasOwn(raw, requestKey) && raw[requestKey] !== fixture[fixtureKey]) {
      throw new Error("preview fixture does not match authored content");
    }
  }
  return fixture;
}
