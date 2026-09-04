import { QUEST_STOPS } from "../../../data/questSequence.js";
import { nextCorrection } from "../../../utils/questCorrection.js";
import { SOUND_SEEKERS_INTERACTION_CONTEXTS, getExpedition } from "../content/expeditions.js";
import { getContentDeckCatalogRecord } from "../content/contentDeckCatalogs.js";
import { getContentDeckPlacements } from "../content/contentDeckBindings.js";
import { getPronunciation } from "../content/pronunciationLexicon.js";
import {
  beginContentPlacementAttempt,
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  commitContentPlacementResponse,
  completeContentPlacementCorrectionModel,
  completeStoryTransferTransaction,
  completeStoryTransferCorrectionModel,
  materializeBossTransferChallenge,
  materializeContentPlacementChallenge,
  materializeStoryTransferChallenge,
  projectBossTransferOptionsForChild,
  resumeContentPlacementAttempt,
  resumeStoryTransferTransaction
} from "./contentDeckTransactions.js";
import {
  projectBoundContentResolverInputs,
  recordContentDeckUse,
  rehydrateServedContentInstance,
  serveContentDeck
} from "./contentDeckScheduler.js";
import {
  beginConnectedTextPresentation,
  checkpointConnectedTextPresentation,
  closeConnectedTextPresentation,
  rehydrateConnectedTextPresentation,
  reduceConnectedTextPresentation
} from "./connectedTextPresentation.js";
import {
  createChallenge,
  createStoryChildScene,
  createStoryTransferChallenge
} from "./createChallenge.js";
import { currentGameStateForMissionPlan } from "./createMissionPlan.js";
import { advanceJourney } from "./journeyClock.js";
import { validContentDeckUses } from "./contentCoverage.js";
import { appendEvidence, createLiteracyDecision, deriveConfusions } from "./evidence.js";
import { SOUND_POWER_REGISTRY } from "./powers/index.js";
import { normalizeSoundSeekersState } from "./stateV2.js";
import { createTeachSequence, reduceTeachSequence } from "./teachSequence.js";
import { parseSemanticHistory } from "./powers/contracts.js";
import { normalizeMotorAssists, projectMotorPresentation } from "./motorAssists.js";
import { createSoundSeekersCorrectionAudioRequest } from "./audioControllerAuthority.js";
import { createHeartWordChoices } from "../content/childChoiceContent.js";

const missionByPowerState = new WeakMap();
const completionBrands = new WeakSet();
const completionMetadata = new WeakMap();
const workbenchModels = new WeakMap();
const workbenchAccesses = new WeakMap();
const closedMissionPresentations = new WeakSet();
const MISSION_COMMIT_CAPABILITY = Object.freeze({});
const MISSION_CONTEXT_KEYS = new Set([
  "gameState", "at", "sessionDay", "audio", "audioAuthority", "assists"
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function exactKeys(value, keys) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function sameValue(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((item, index) => sameValue(item, right[index]));
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length
      && leftKeys.every(key => Object.hasOwn(right, key) && sameValue(left[key], right[key]));
  }
  return false;
}

function exactAudioAuthority(state, raw) {
  if (!exactKeys(raw, ["scopeKey", "missionId", "phaseId", "attemptId"])
    || typeof raw.scopeKey !== "string" || !raw.scopeKey.trim()
    || raw.missionId !== state.plan.id
    || raw.phaseId !== state.phaseId
    || raw.attemptId !== state.attemptId) return null;
  return raw;
}

function createPrivateMissionAuthority() {
  const missionBrands = new WeakSet();
  const currentByMissionId = new Map();
  const issuedResults = new WeakSet();
  const resultMetadata = new WeakMap();
  const cachedByIntentSet = new WeakMap();

  function brandState(value) {
    const state = deepFreeze(value);
    missionBrands.add(state);
    currentByMissionId.set(state.plan.id, state);
    return state;
  }

  function isCurrentMissionState(state) {
    return missionBrands.has(state) && currentByMissionId.get(state?.plan?.id) === state;
  }

  function assertCurrentMissionState(state) {
    if (!isCurrentMissionState(state)) throw new Error("mission state is not the exact current revision");
  }

  function assertCommitContext(state, intents, context) {
    if (!isCurrentMissionState(state)
      || !Object.isFrozen(state) || !Object.isFrozen(intents) || intents.length !== 1
      || !Object.isFrozen(intents[0]) || !context?.challenge || !context?.gameState
      || !exactKeys(context, [
        "challenge", "gameState", "at", "sessionDay", "audio", "audioAuthority"
      ])
      || !exactKeys(intents[0], ["kind", "challengeId", "response"])
      || !["challenge_response", "content_response"].includes(intents[0].kind)
      || intents[0].challengeId !== context.challenge.challengeId
      || state.challenge !== context.challenge || state.gameState !== context.gameState
      || state.activity?.status !== "awaiting_mission_commit"
      || state.attemptId !== context.challenge.attemptId
      || (intents[0].kind === "challenge_response"
        && (!exactKeys(intents[0].response, ["kind", "token"])
          || intents[0].response.kind !== "literacy-answer"))) {
      throw new Error("mission response commit requires the exact current response intent");
    }
  }

  function commitMissionResponse(state, responseIntents, context = {}, reducerCapability = null) {
    assertCommitContext(state, responseIntents, context);
    if (!["at", "sessionDay", "audio", "audioAuthority"].every(key => Object.hasOwn(context, key))) {
      throw new Error("mission response commit needs canonical time, session, and audio inputs");
    }
    const cached = cachedByIntentSet.get(responseIntents);
    if (cached) {
      const metadata = resultMetadata.get(cached);
      if (!metadata || metadata.missionState !== state || metadata.reducerCapability !== reducerCapability
        || metadata.at !== context.at || metadata.sessionDay !== context.sessionDay
        || !sameValue(metadata.audio, context.audio)
        || !sameValue(metadata.audioAuthority, context.audioAuthority)) {
        throw new Error("cached mission response context is stale or changed");
      }
      return cached;
    }
    const attemptSupportLevel = Math.min(state.attemptOrdinal, 3);
    const phase = state.plan.phases[state.phaseIndex];
    const baseGameState = state.gameState;
    let transaction = null;
    if (phase.kind === "content_placement") {
      transaction = commitContentPlacementResponse(baseGameState, {
        placementId: state.activeContent.placementId, visitId: state.activeContent.visitId,
        challenge: context.challenge, response: responseIntents[0].response,
        audio: context.audio, audioAuthority: context.audioAuthority,
        at: context.at, sessionDay: context.sessionDay
      });
    } else if (phase.kind === "story_transfer") {
      transaction = completeStoryTransferTransaction(baseGameState, {
        transactionId: state.activeContent.transactionId, challenge: context.challenge,
        response: responseIntents[0].response, audio: context.audio,
        audioAuthority: context.audioAuthority,
        at: context.at, sessionDay: context.sessionDay
      });
    }
    const event = transaction?.event || (responseIntents[0].kind === "challenge_response"
      ? createLiteracyDecision({
        challenge: context.challenge, response: responseIntents[0].response,
        support: { level: attemptSupportLevel, revealed: attemptSupportLevel >= 3 },
        audio: context.audio, audioAuthority: context.audioAuthority,
        journeyStep: state.plan.journeyStep,
        ordinal: state.nextDecisionOrdinal, at: context.at, sessionDay: context.sessionDay
      }) : null);
    if (!event && phase.category !== "morphology") {
      throw new Error("mission response did not produce canonical evidence");
    }
    let candidateState = transaction ? normalizeSoundSeekersState(transaction.nextState)
      : normalizeSoundSeekersState({
        ...baseGameState,
        evidence: appendEvidence(baseGameState.evidence, event),
        confusions: deriveConfusions(appendEvidence(baseGameState.evidence, event))
      });
    if ((phase.kind === "content_opportunity" || phase.contentBinding?.category === "heartWords")
      && event?.correct) {
      candidateState = normalizeSoundSeekersState({
        ...candidateState,
        contentDecks: recordContentDeckUse(candidateState.contentDecks,
          state.activeContent.served, state.activeContent.binding)
      });
    }
    const correction = transaction?.correction || (event && !event.correct
      ? nextCorrection(state.correctionState || {}, {
        selected: event.confusion, intended: context.challenge.expectedToken,
        targetId: context.challenge.targetId, domain: context.challenge.recordsDomain,
        wordId: context.challenge.wordId || null, position: context.challenge.position ?? null,
        evidenceKind: "practice"
      }) : null);
    const transactionOutcome = transaction?.outcome;
    const outcome = transactionOutcome === "completed" ? "advance"
      : transactionOutcome === "next_challenge" ? "continue"
        : transactionOutcome || (event.correct ? "advance"
          : state.attemptOrdinal >= 2 ? "model_required" : "retry");
    const supportLevel = ["retry", "model_required"].includes(outcome)
      ? Math.min(state.attemptOrdinal + 1, 3)
      : outcome === "continue" ? 0 : attemptSupportLevel;
    const checkpoint = phase.kind === "content_placement"
      ? candidateState.checkpoint?.contentPlacement
      : phase.kind === "story_transfer" ? candidateState.checkpoint?.storyTransfer : null;
    const nextAttemptId = outcome === "advance" ? null
      : checkpoint?.attemptId || `${state.plan.id}:${state.phaseId}:attempt:${state.attemptOrdinal + 1}`;
    const correctionRecordIds = transaction?.correction?.correctionRecordId
      ? [transaction.correction.correctionRecordId]
      : correction ? [`mission-correction:${context.challenge.attemptId}`] : [];
    const result = deepFreeze({
      kind: "sound_seekers_mission_commit_result", missionId: state.plan.id,
      phaseId: state.phaseId, attemptId: state.attemptId,
      attemptOrdinal: state.attemptOrdinal, outcome, supportLevel,
      correctionRecordIds, nextAttemptId
    });
    issuedResults.add(result);
    resultMetadata.set(result, {
      status: "issued", missionState: state, missionRevision: state.missionRevision,
      responseIntents, candidateState, event, correction,
      finalizedRevision: null,
      reducerCapability, at: context.at, sessionDay: context.sessionDay,
      audio: context.audio,
      audioAuthority: context.audioAuthority
    });
    cachedByIntentSet.set(responseIntents, result);
    return result;
  }

  function assertCurrentMissionCommitResult(result, expected = {}) {
    const metadata = resultMetadata.get(result);
    if (!issuedResults.has(result) || !metadata || metadata.status !== "issued") {
      throw new Error("mission commit result is forged, stale, or consumed");
    }
    const checks = { missionId: result.missionId, phaseId: result.phaseId,
      attemptId: result.attemptId, attemptOrdinal: result.attemptOrdinal,
      revision: metadata.missionRevision };
    for (const [key, value] of Object.entries(expected)) {
      if (Object.hasOwn(checks, key) && checks[key] !== value) {
        throw new Error("mission commit result does not match the current mission revision");
      }
    }
    return true;
  }

  function validateCurrentMissionTransition(result, expected = {}) {
    const metadata = resultMetadata.get(result);
    if (!issuedResults.has(result) || !metadata || metadata.status !== "applied"
      || !metadata.finalMissionState
      || !isCurrentMissionState(metadata.finalMissionState)
      || metadata.finalMissionState.missionRevision !== metadata.finalizedRevision) return false;
    if (expected.missionId !== undefined && result.missionId !== expected.missionId) return false;
    if (expected.phaseId !== undefined && result.phaseId !== expected.phaseId) return false;
    if (expected.revision !== undefined && metadata.finalizedRevision !== expected.revision) return false;
    return true;
  }

  function projectContactTarget(result, finalMissionState) {
    if (!validateCurrentMissionTransition(result)
      || resultMetadata.get(result)?.finalMissionState !== finalMissionState) return null;
    const metadata = resultMetadata.get(result);
    const preFinalState = metadata.missionState;
    const response = metadata.responseIntents[0]?.response;
    const activity = preFinalState.activity;
    if (response?.kind === "non-recording-complete"
      && activity?.powerId === "word_forge"
      && activity.morphology
      && activity.slots?.[1]?.id === "morphology-ending-slot"
      && activity.slots[1].tileId === "morphology-ending-tile") {
      return activity.slots[1].id;
    }
    if (response?.kind !== "literacy-answer" || !activity?.powerId) return null;
    const step = parseSemanticHistory(activity).at(-1);
    const terminalAction = activity.powerId === "echo_search"
      ? "confirm_candidate" : activity.powerId === "word_forge" ? "place_tile" : activity.expectedAction;
    if (!step || step.type !== terminalAction) return null;
    const token = response.token;
    if (activity.powerId === "echo_search") {
      const candidate = activity.candidates?.[step.indexes[0]];
      return candidate && activity.candidateTokens?.[candidate.id] === token ? candidate.id : null;
    }
    if (activity.powerId === "contrast_sort") {
      const bin = activity.bins?.[step.indexes[1]];
      return bin && activity.binTokens?.[bin.id] === token ? bin.id : null;
    }
    if (activity.powerId === "word_forge") {
      const tile = activity.rack?.[step.indexes[0]];
      const slot = activity.slots?.[step.indexes[1]];
      return tile && slot && tile.token === token && slot.tileId === tile.id ? slot.id : null;
    }
    if (activity.powerId === "blend_bridge" || activity.powerId === "story_power") {
      const choice = activity.choices?.[step.indexes[0]];
      return choice && activity.choiceTokens?.[choice.id] === token ? choice.id : null;
    }
    if (activity.powerId === "memory_delivery") {
      const recipient = activity.recipients?.[step.indexes[0]];
      return recipient && activity.recipientTokens?.[recipient.id] === token ? recipient.id : null;
    }
    return null;
  }

  function projectWorkbench(result, expected = {}, binding = {}) {
    if (!validateCurrentMissionTransition(result, expected)) return null;
    const metadata = resultMetadata.get(result);
    const missionState = metadata.missionState;
    const finalMissionState = metadata.finalMissionState;
    if (!finalMissionState
      || ![missionState.activity, finalMissionState.activity].includes(binding.powerState)
      || ![missionState.challenge, finalMissionState.challenge].includes(binding.challenge)) return null;
    const correction = metadata.correction;
    let correctionPresentation = null;
    if (["retry", "model_required"].includes(result.outcome) && correction) {
      const rack = missionState.activity?.rack || [];
      const selectedContrast = rack.find(tile => missionState.challenge.presentation?.rack
        ?.find(source => source.id === tile.id)?.token === correction.selected)?.label
        || String(correction.selected);
      const mode = correction.modelOnce ? "teach"
        : correction.isolatePosition !== null ? "narrow" : "retry";
      const correctionAudio = createSoundSeekersCorrectionAudioRequest(mode);
      const visibleText = correctionAudio.visibleText;
      correctionPresentation = deepFreeze({ mode,
        replayContrast: correction.replayContrast === true,
        selectedContrast, visibleText, spokenText: visibleText });
    }
    return deepFreeze({
      outcome: result.outcome, correctionPresentation,
      morphology: missionState.plan.phases[missionState.phaseIndex]?.placementId === "s38-morphology"
        ? missionState.interaction : null
    });
  }

  function finalizeMissionCommit(result, state, reducerCapability, finalize) {
    const metadata = resultMetadata.get(result);
    if (!metadata || metadata.status !== "issued" || metadata.missionState !== state
      || !reducerCapability || metadata.reducerCapability !== reducerCapability
      || typeof finalize !== "function") {
      throw new Error("mission commit finalization capability is forged or stale");
    }
    const finalizedState = finalize(Object.freeze({
      candidateState: metadata.candidateState, event: metadata.event,
      correction: metadata.correction
    }));
    if (!isCurrentMissionState(finalizedState) || !Number.isInteger(finalizedState.missionRevision)) {
      throw new Error("mission commit result cannot be finalized");
    }
    metadata.status = "applied";
    metadata.finalizedRevision = finalizedState.missionRevision;
    metadata.finalMissionState = finalizedState;
    return finalizedState;
  }

  return Object.freeze({
    brandState, assertCurrentMissionState, isCurrentMissionState, commitMissionResponse,
    finalizeMissionCommit, assertCurrentMissionCommitResult,
    validateCurrentMissionTransition, projectContactTarget, projectWorkbench
  });
}

const missionAuthority = createPrivateMissionAuthority();
const {
  assertCurrentMissionState: assertCurrent,
  brandState: brandMissionState,
  commitMissionResponse,
  finalizeMissionCommit
} = missionAuthority;

function brandState(value) {
  const state = brandMissionState(deepFreeze(value));
  if (state.activity && typeof state.activity === "object") missionByPowerState.set(state.activity, state);
  return state;
}

function passiveActivity(phase) {
  return deepFreeze({ kind: phase.kind, actionId: phase.id, status: "active" });
}

function interactionFor(action) {
  return deepFreeze({ action, context: SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId] });
}

function storyInteraction(phase, stopId) {
  const action = getExpedition(stopId).phases.find(item => item.id === phase.id);
  if (!action) throw new Error("story transfer action is not canonical");
  return interactionFor(action);
}

function storyPowerChallenge(challenge, phase, child, gameState, activeContent) {
  if (!challenge) return null;
  const id = suffix => `${phase.contextId}:${challenge.challengeId}:${suffix}`;
  let presentation;
  if (phase.powerId === "blend_bridge") {
    const pronunciation = getPronunciation(challenge.wordId);
    const options = projectBossTransferOptionsForChild(gameState, activeContent);
    if (!pronunciation || !options.length) throw new Error("boss transfer power presentation is incomplete");
    presentation = {
      segments: pronunciation.units.map((unit, index) => ({
        id: id(`segment:${index}`), label: unit.grapheme
      })),
      choices: options.map((option, index) => ({
        id: id(`choice:${index}`), label: option.childText, token: option.token
      }))
    };
  } else {
    const choices = child.choice.options.map((option, index) => ({
      id: id(`${phase.powerId === "memory_delivery" ? "recipient" : "choice"}:${index}`),
      label: option.childLabel, token: option.token
    }));
    presentation = phase.powerId === "memory_delivery" ? { recipients: choices } : { choices };
  }
  return deepFreeze({ ...challenge, presentation });
}

function storyPowerActivity({ phase, stopId, challenge, child, gameState, activeContent, seed, resume, presentation }) {
  if (!challenge) return deepFreeze({
    kind: "story_transfer_activity", powerId: phase.powerId,
    challengeId: null,
    status: child.choice.kind === "narrative_bridge" ? "narrative_choice_pending" : "model_pending",
    childScene: child,
    correction: null, presentation
  });
  const powerChallenge = storyPowerChallenge(challenge, phase, child, gameState, activeContent);
  const powerState = SOUND_POWER_REGISTRY[phase.powerId].createState(powerChallenge, {
    seed, resume, interaction: storyInteraction(phase, stopId)
  });
  return deepFreeze({ ...powerState, childScene: child, presentation, powerChallenge });
}

function heartChallenge(phase, plan, served, attemptOrdinal = 0) {
  const instruction = phase.instructionId;
  const expectedToken = served.answerTokensByActivity[phase.activityFocus];
  const record = getContentDeckCatalogRecord("heartWords", served.recordId);
  if (!record) throw new Error(`${served.recordId}: heart-word catalog record is missing`);
  const options = createHeartWordChoices({
    record,
    activityType: phase.activityFocus,
    stopId: plan.stopId,
    seed: plan.seed + attemptOrdinal
  });
  const contextId = phase.contextId;
  return deepFreeze({
    challengeId: `${plan.id}:${phase.id}:attempt:${attemptOrdinal}:challenge`,
    attemptId: `${plan.id}:${phase.id}:attempt:${attemptOrdinal}`,
    targetId: served.targetId,
    recordsDomain: phase.recordsDomain,
    powerId: phase.powerId,
    wordId: served.wordId,
    activityType: phase.activityFocus,
    expectedAction: phase.expectedAction,
    instructionId: instruction,
    expectedToken,
    optionTokens: options.map(option => option.token),
    childText: "Carry the whole word to its matching place.",
    cue: "whole_word",
    requiresAudio: false,
    presentation: {
      recipients: options.map((option, index) => ({
        id: `${contextId}:${plan.id}:${phase.id}:recipient:${index}`,
        label: option.label,
        token: option.token
      }))
    }
  });
}

function contentState(base, context) {
  return context.gameState || base.gameState;
}

function canonicalChallengeForCompletedPhase(plan, gameState, phase, attemptOrdinal) {
  if (phase.kind === "content_opportunity") {
    const served = rehydrateServedContentInstance(gameState.contentDecks, {
      category: "heartWords",
      visitId: `visit:${plan.journeyStep}:${phase.id}`
    });
    return served ? heartChallenge(phase, plan, served, attemptOrdinal) : null;
  }
  const sharedHeart = phase.contentBinding?.category === "heartWords"
    && phase.contentBinding.isVisitOwner === false;
  const served = sharedHeart ? rehydrateServedContentInstance(gameState.contentDecks, {
    category: "heartWords",
    visitId: `visit:${plan.journeyStep}:${phase.contentBinding.visitOwnerId}`
  }) : null;
  if (sharedHeart && !served) return null;
  return createChallenge({
    action: phase,
    missionId: plan.id,
    attemptOrdinal,
    seed: plan.seed,
    contentSource: served ? projectBoundContentResolverInputs(served) : null
  });
}

function completedDecisionIsCanonical(plan, gameState, phase) {
  const prefix = `${plan.id}:${phase.id}:attempt:`;
  const events = gameState.evidence.filter(event => event.id.startsWith(prefix));
  if (!events.length) return false;
  const attempts = events.map(event => {
    const [attemptText, decisionText, ...rest] = event.id.slice(prefix.length).split(":");
    return rest.length || !/^(?:0|[1-9][0-9]*)$/u.test(attemptText)
      || !/^(?:0|[1-9][0-9]*)$/u.test(decisionText)
      ? null : { event, attemptOrdinal: Number(attemptText), decisionOrdinal: Number(decisionText) };
  }).filter(Boolean).sort((left, right) => left.attemptOrdinal - right.attemptOrdinal);
  if (attempts.length !== events.length
    || attempts.some((entry, index) => entry.attemptOrdinal !== index)) return false;
  return attempts.every((entry, index) => {
    const challenge = canonicalChallengeForCompletedPhase(plan, gameState, phase, index);
    const event = entry.event;
    const correct = index === attempts.length - 1;
    const valid = challenge
      && event.id === `${challenge.attemptId}:${entry.decisionOrdinal}`
      && event.target === challenge.targetId
      && event.domain === challenge.recordsDomain
      && event.correct === correct
      && event.supportLevel === Math.min(index, 3)
      && event.revealed === (index >= 3)
      && event.audioRequired === (challenge.requiresAudio !== false)
      && event.word === (challenge.wordId || null)
      && event.position === (challenge.position ?? null)
      && event.connectedTextId === (challenge.connectedTextId || null)
      && event.bossTransferId === (challenge.bossTransferId || null)
      && event.mechanic === challenge.powerId
      && event.journeyStep === plan.journeyStep
      && event.evidenceKind === "practice"
      && (correct ? event.confusion === null : challenge.optionTokens.includes(event.confusion));
    return valid;
  });
}

function completedContentUseIsCanonical(plan, gameState, phase) {
  if (phase.kind === "story_transfer") {
    const transactionId = `story-transfer:${plan.journeyStep}:${plan.stopId}`;
    return ["stories", "transfer"].every(category => validContentDeckUses(gameState, category)
      .some(use => use.transactionId === transactionId && use.journeyStep === plan.journeyStep));
  }
  const category = phase.kind === "content_opportunity"
    ? "heartWords" : phase.category || phase.contentBinding?.category;
  return validContentDeckUses(gameState, category).some(use =>
    use.actionUseId === phase.contentBinding?.actionUseId
    && use.journeyStep === plan.journeyStep);
}

function assertCanonicalCompletedPrefix(plan, gameState, phaseIndex, completedPhaseIds, teach) {
  const expected = plan.phases.slice(0, phaseIndex);
  if (completedPhaseIds.length !== expected.length
    || completedPhaseIds.some((id, index) => id !== expected[index].id)) {
    throw new Error("mission completed phases are not the contiguous canonical prefix");
  }
  const teachPhaseIndex = plan.phases.findIndex(phase => phase.kind === "teach");
  if (phaseIndex > teachPhaseIndex) {
    const teachCount = getExpedition(plan.stopId).teach.targetIds.length;
    if (teach?.teachIndex !== teachCount || teach?.teachTargetId !== null) {
      throw new Error("mission completed teach history is not canonical");
    }
  }
  for (const phase of expected) {
    if (["challenge", "content_opportunity"].includes(phase.kind)) {
      const decisionValid = completedDecisionIsCanonical(plan, gameState, phase);
      const useValid = phase.contentBinding?.category !== "heartWords"
        || completedContentUseIsCanonical(plan, gameState, phase);
      if (!decisionValid || !useValid) {
        throw new Error(`mission completed phase ${phase.id} lacks canonical evidence history`);
      }
    }
    if (phase.kind === "content_placement" && !completedContentUseIsCanonical(plan, gameState, phase)) {
      throw new Error(`mission completed phase ${phase.id} lacks its canonical content use`);
    }
    if (phase.kind === "story_transfer" && !completedContentUseIsCanonical(plan, gameState, phase)) {
      throw new Error(`mission completed phase ${phase.id} lacks reciprocal story history`);
    }
  }
  return true;
}

function enteredState(base, phaseIndex, context = {}) {
  const phase = base.plan.phases[phaseIndex] || null;
  const resume = context.resume || null;
  if (!phase) return { ...base, phaseIndex, phaseId: null, activity: null, challenge: null, interaction: null };
  if (phase.kind === "teach") {
    const stop = QUEST_STOPS.find(item => item.id === base.plan.stopId);
    const taught = context.gameState?.trail?.completedStopIds?.includes(base.plan.stopId)
      ? getExpedition(base.plan.stopId).teach.targetIds : [];
    return {
      ...base, gameState: contentState(base, context) || null,
      phaseIndex, phaseId: phase.id, challenge: null, interaction: null,
      activity: deepFreeze({ kind: "teach", actionId: phase.id,
        sequence: createTeachSequence(stop, taught, resume?.teach) })
    };
  }
  if (phase.kind === "power_onboarding") {
    const owner = base.plan.phases[phaseIndex + 1];
    if (!owner || owner.id !== phase.ownerActionId || owner.powerId !== phase.powerId) {
      throw new Error("power onboarding must immediately precede its owning action");
    }
    const rehearsal = enteredState({
      ...base,
      gameState: contentState(base, context),
      attemptOrdinal: 0,
      attemptId: `${base.plan.id}:${owner.id}:onboarding:attempt:0`
    }, phaseIndex + 1, { gameState: contentState(base, context) });
    if (!rehearsal.challenge || rehearsal.activity?.powerId !== phase.powerId) {
      throw new Error("power onboarding could not instantiate its owning power");
    }
    return {
      ...base,
      gameState: contentState(base, context),
      phaseIndex,
      phaseId: phase.id,
      challenge: rehearsal.challenge,
      interaction: rehearsal.interaction,
      activity: deepFreeze({
        ...rehearsal.activity,
        onboardingOwnerActionId: owner.id,
        onboarding: true
      }),
      activeContent: null
    };
  }
  if (phase.kind === "challenge") {
    const sharedHeart = phase.contentBinding?.category === "heartWords"
      && phase.contentBinding.isVisitOwner === false;
    const gameState = contentState(base, context);
    const sharedVisitId = sharedHeart
      ? `visit:${base.plan.journeyStep}:${phase.contentBinding.visitOwnerId}` : null;
    const served = sharedHeart ? rehydrateServedContentInstance(gameState?.contentDecks, {
      category: "heartWords", visitId: sharedVisitId
    }) : null;
    const contentSource = sharedHeart ? projectBoundContentResolverInputs(served) : null;
    const challenge = createChallenge({
      action: phase,
      missionId: base.plan.id,
      attemptOrdinal: base.attemptOrdinal,
      seed: base.plan.seed,
      contentSource
    });
    const interaction = interactionFor(phase);
    const power = SOUND_POWER_REGISTRY[phase.powerId];
    const powerState = power.createState(challenge, {
      seed: base.plan.seed,
      resume: resume?.activity?.powerCheckpoint?.status === "model_pending"
        ? null : resume?.activity?.powerCheckpoint || null,
      interaction
    });
    return {
      ...base, gameState: gameState || null,
      phaseIndex, phaseId: phase.id, challenge, interaction,
      attemptId: challenge.attemptId,
      activeContent: sharedHeart
        ? deepFreeze({ kind: "heart", served, binding: phase.contentBinding })
        : base.activeContent || null,
      activity: resume?.activity?.powerCheckpoint?.status === "model_pending"
        ? deepFreeze({ ...powerState, status: "model_pending" }) : powerState
    };
  }
  if (phase.kind === "content_opportunity") {
    const gameState = contentState(base, context);
    if (!gameState) throw new Error("heart-word phase needs current campaign state");
    const visitId = `visit:${base.plan.journeyStep}:${phase.id}`;
    const served = resume
      ? rehydrateServedContentInstance(gameState.contentDecks, { category: "heartWords", visitId })
      : serveContentDeck(gameState.contentDecks, {
        binding: phase.contentBinding,
        visitId,
        stopId: base.plan.stopId,
        journeyStep: base.plan.journeyStep,
        seed: base.plan.seed
      });
    if (!served || served.visitOwnerId !== phase.contentBinding.visitOwnerId
      || served.journeyStep !== base.plan.journeyStep) {
      throw new Error("heart-word resume cannot rehydrate its canonical owner visit");
    }
    projectBoundContentResolverInputs(served);
    const nextGameState = resume ? gameState : { ...gameState, contentDecks: served.nextState };
    const challenge = heartChallenge(phase, base.plan, served, base.attemptOrdinal);
    const interaction = interactionFor(phase);
    return {
      ...base, gameState: nextGameState, phaseIndex, phaseId: phase.id, challenge, interaction,
      attemptId: challenge.attemptId,
      activeContent: deepFreeze({ kind: "heart", served, binding: phase.contentBinding }),
      activity: SOUND_POWER_REGISTRY.memory_delivery.createState(challenge, {
        seed: base.plan.seed, resume: resume?.activity?.powerCheckpoint || null, interaction
      })
    };
  }
  if (phase.kind === "content_placement") {
    const gameState = contentState(base, context);
    if (!gameState) throw new Error("content placement needs current campaign state");
    const visitId = `visit:${base.plan.journeyStep}:${phase.placementId}`;
    const served = resume
      ? rehydrateServedContentInstance(gameState.contentDecks, { category: phase.category, visitId })
      : serveContentDeck(gameState.contentDecks, {
        binding: phase.contentBinding, visitId, stopId: base.plan.stopId,
        journeyStep: base.plan.journeyStep, seed: base.plan.seed
      });
    if (!served) throw new Error("content placement resume cannot rehydrate its owner visit");
    const begun = resume
      ? { nextState: gameState, ...resumeContentPlacementAttempt(gameState, {
        placementId: phase.placementId, visitId
      }) }
      : beginContentPlacementAttempt({ ...gameState, contentDecks: served.nextState }, {
        placementId: phase.placementId, visitId
      });
    const challenge = begun.challenge || null;
    let activity;
    let interaction = null;
    if (phase.category === "morphology") {
      const record = getContentDeckCatalogRecord("morphology", served.recordId);
      interaction = deepFreeze({
        kind: "morphology_introduction",
        baseWord: record.baseWord,
        ending: record.ending,
        derivedWord: `${record.baseWord}${record.ending}`,
        meaning: record.meaning
      });
      activity = SOUND_POWER_REGISTRY.word_forge.createState(challenge, {
        seed: base.plan.seed, resume: resume?.activity?.powerCheckpoint || null, interaction
      });
    } else {
      activity = challenge
        ? SOUND_POWER_REGISTRY[phase.powerId].createState(challenge, {
          seed: base.plan.seed, resume: resume?.activity?.powerCheckpoint || null, interaction: null
        })
        : deepFreeze({
          kind: "content_placement_activity", powerId: phase.powerId,
          challengeId: null, status: "model_pending", correction: begun.correction
        });
    }
    return {
      ...base, gameState: begun.nextState, phaseIndex, phaseId: phase.id,
      challenge, interaction, attemptId: begun.attempt.attemptId, activity,
      activeContent: deepFreeze({ kind: "placement", placementId: phase.placementId, visitId })
    };
  }
  if (phase.kind === "story_transfer") {
    const gameState = contentState(base, context);
    if (!gameState) throw new Error("story transfer needs current campaign state");
    const existingTransactionId = resume?.activeContent?.transactionId;
    const begun = resume
      ? { nextState: gameState, ...resumeStoryTransferTransaction(gameState, {
        transactionId: existingTransactionId
      }) }
      : beginStoryTransferTransaction(gameState, {
        stopId: base.plan.stopId, journeyStep: base.plan.journeyStep, seed: base.plan.seed
      });
    const child = createStoryChildScene(phase.connectedTextId, `${base.plan.id}:route`);
    const narrativeChoiceToken = null;
    const pending = resume ? begun.nextState : checkpointStoryTransferTransaction(begun.nextState, {
      transactionId: begun.transaction.transactionId, narrativeChoiceToken
    });
    const boss = getExpedition(base.plan.stopId).transfer.boss;
    const challenge = begun.challenge || (pending.checkpoint?.storyTransfer?.stage === "response_pending"
      ? boss
        ? materializeBossTransferChallenge(pending, { transactionId: begun.transaction.transactionId })
        : createStoryTransferChallenge(pending, {
          transactionId: begun.transaction.transactionId,
          routeSeed: `${base.plan.id}:route`
        })
      : null);
    if (boss && challenge) projectBossTransferOptionsForChild(pending, {
      transactionId: begun.transaction.transactionId
    });
    const rehydrated = resume
      ? rehydrateConnectedTextPresentation(pending, resume.connectedTextPresentation)
      : null;
    const presentation = rehydrated?.presentation || beginConnectedTextPresentation({
      sceneId: phase.connectedTextId, transactionId: begun.transaction.transactionId, state: pending
    });
    return {
      ...base, gameState: pending, phaseIndex, phaseId: phase.id,
      challenge, interaction: storyInteraction(phase, base.plan.stopId),
      attemptId: begun.attempt?.attemptId || challenge?.attemptId || base.attemptId,
      activity: storyPowerActivity({
        phase, stopId: base.plan.stopId, challenge, child, gameState: pending,
        activeContent: { transactionId: begun.transaction.transactionId },
        seed: base.plan.seed, resume: resume?.activity?.powerCheckpoint || null, presentation
      }),
      activeContent: deepFreeze({ kind: "story_transfer", transactionId: begun.transaction.transactionId })
    };
  }
  return {
    ...base, gameState: contentState(base, context) || null, phaseIndex, phaseId: phase.id, challenge: null, interaction: null,
    activity: passiveActivity(phase)
  };
}

function scoredPhase(phase) {
  return Boolean(phase && phase.recordsDomain !== null && phase.recordsDomain !== undefined);
}

function withoutUnverifiableJourneyProgress(rawState, plan) {
  const removedVisitIds = new Set();
  const removedUseIds = new Set();
  const contentDecks = Object.fromEntries(Object.entries(rawState.contentDecks || {}).map(
    ([category, deck]) => {
      const visits = Object.fromEntries(Object.entries(deck?.visits || {}).filter(([, visit]) => {
        const remove = visit?.journeyStep === plan.journeyStep;
        if (remove) removedVisitIds.add(visit.visitId);
        return !remove;
      }));
      const uses = Object.fromEntries(Object.entries(deck?.uses || {}).filter(([, use]) => {
        const remove = use?.journeyStep === plan.journeyStep;
        if (remove) removedUseIds.add(use.useId);
        return !remove;
      }));
      return [category, { visits, uses }];
    }
  ));
  const removedEventIds = new Set((rawState.evidence || [])
    .filter(event => event?.journeyStep === plan.journeyStep)
    .map(event => event.id));
  const evidence = (rawState.evidence || [])
    .filter(event => !removedEventIds.has(event?.id));
  const attemptReceipts = Object.fromEntries(Object.entries(rawState.attemptReceipts || {})
    .filter(([, receipt]) => {
      const referencesRemoved = (receipt?.eventIds || []).some(id => removedEventIds.has(id))
        || (receipt?.useIds || []).some(id => removedUseIds.has(id))
        || [...removedVisitIds].some(id => String(receipt?.attemptId || "").includes(id));
      return !referencesRemoved;
    }));
  return normalizeSoundSeekersState({
    ...rawState,
    evidence,
    confusions: deriveConfusions(evidence),
    contentDecks,
    attemptReceipts,
    checkpoint: {
      contentVersion: rawState.contentVersion,
      ...(typeof rawState.checkpoint?.stopId === "string"
        ? { stopId: rawState.checkpoint.stopId } : {})
    }
  });
}

export function createMissionState(plan, resume = null) {
  if (!plan || plan.kind !== "sound_seekers_mission_plan" || !Object.isFrozen(plan)) {
    throw new Error("mission state requires an exact frozen plan");
  }
  if (resume !== null) {
    const savedState = currentGameStateForMissionPlan(plan);
    if (savedState?.checkpoint?.mission !== resume) {
      throw new Error("mission resume must be the exact normalized current checkpoint");
    }
    if (resume.kind !== "sound_seekers_mission" || resume.missionId !== plan.id
      || resume.contentVersion !== plan.contentVersion || resume.stopId !== plan.stopId
      || resume.journeyStep !== plan.journeyStep) throw new Error("mission resume does not match its plan");
    const phaseIndex = plan.phases.findIndex(phase => phase.id === resume.phaseId);
    if (phaseIndex < 0) throw new Error("mission resume phase is not canonical");
    const firstScoredIndex = plan.phases.findIndex(scoredPhase);
    if (firstScoredIndex >= 0 && phaseIndex >= firstScoredIndex) {
      const replayState = withoutUnverifiableJourneyProgress(savedState, plan);
      return brandState(enteredState({
        kind: "sound_seekers_mission_state",
        plan,
        phaseIndex: firstScoredIndex,
        completedPhaseIds: plan.phases.slice(0, firstScoredIndex).map(phase => phase.id),
        missionRevision: resume.missionRevision + 1,
        attemptOrdinal: 0,
        attemptId: `${plan.id}:${plan.phases[firstScoredIndex].id}:attempt:0`,
        nextDecisionOrdinal: 0,
        presentationTransition: null,
        teachProgress: resume.teach,
        modelPending: false,
        correctionState: null,
        gameState: replayState
      }, firstScoredIndex, { gameState: replayState }));
    }
    assertCanonicalCompletedPrefix(plan, savedState, phaseIndex, resume.completedPhaseIds,
      resume.teach);
    const entered = enteredState({
      kind: "sound_seekers_mission_state", plan, phaseIndex,
      completedPhaseIds: [...resume.completedPhaseIds], missionRevision: resume.missionRevision,
      attemptOrdinal: resume.attemptOrdinal, attemptId: resume.attemptId,
      nextDecisionOrdinal: resume.nextDecisionOrdinal,
      presentationTransition: null,
      teachProgress: resume.teach,
      modelPending: false,
      correctionState: null,
      gameState: currentGameStateForMissionPlan(plan)
    }, phaseIndex, {
      gameState: currentGameStateForMissionPlan(plan),
      resume: resume.activity ? resume : null
    });
    return brandState(entered);
  }
  return brandState(enteredState({
    kind: "sound_seekers_mission_state", plan, phaseIndex: 0,
    completedPhaseIds: [], missionRevision: 0,
    attemptOrdinal: 0, attemptId: `${plan.id}:${plan.phases[0].id}:attempt:0`,
    nextDecisionOrdinal: 0, presentationTransition: null, modelPending: false,
    teachProgress: { teachIndex: 0, teachTargetId: null },
    correctionState: null,
    gameState: currentGameStateForMissionPlan(plan)
  }, 0, { gameState: currentGameStateForMissionPlan(plan) }));
}

function emptyResult(state) {
  return deepFreeze({ state, responseIntents: [], transition: null, completion: null });
}

function finalizeResponseCommit(result, pending, buildOutput) {
  let output = null;
  finalizeMissionCommit(result, pending, MISSION_COMMIT_CAPABILITY, metadata => {
    output = buildOutput(metadata);
    return output.state;
  });
  return deepFreeze(output);
}

function completionFor(state, gameState) {
  assertCanonicalCompletedPrefix(
    state.plan, gameState, state.plan.phases.length, state.completedPhaseIds,
    state.teachProgress
  );
  const completion = deepFreeze({
    kind: "sound_seekers_mission_completion",
    missionId: state.plan.id,
    stopId: state.plan.stopId,
    journeyStep: state.plan.journeyStep,
    completedPhaseIds: state.plan.phases.map(phase => phase.id)
  });
  completionBrands.add(completion);
  completionMetadata.set(completion, {
    gameState,
    missionState: state,
    missionRevision: state.missionRevision,
    result: null
  });
  return completion;
}

function advance(state, context) {
  const phase = state.plan.phases[state.phaseIndex];
  const completedPhaseIds = [...state.completedPhaseIds, phase.id];
  const revision = state.missionRevision + 1;
  if (state.phaseIndex === state.plan.phases.length - 1) {
    const final = brandState({ ...state, completedPhaseIds, missionRevision: revision });
    return { state: final, completion: completionFor(final, final.gameState) };
  }
  return {
    state: brandState(enteredState({
      ...state,
      completedPhaseIds,
      missionRevision: revision,
      attemptOrdinal: 0,
      attemptId: `${state.plan.id}:${state.plan.phases[state.phaseIndex + 1].id}:attempt:0`,
      presentationTransition: null,
      modelPending: false,
      correctionState: null
    }, state.phaseIndex + 1, context)),
    completion: null
  };
}

export function reduceMission(state, input = {}, context = {}) {
  assertCurrent(state);
  if (!context || typeof context !== "object" || Array.isArray(context)
    || Object.keys(context).some(key => !MISSION_CONTEXT_KEYS.has(key))) {
    throw new Error("mission context contains unknown caller authority");
  }
  const assists = normalizeMotorAssists(context.assists);
  const phase = state.plan.phases[state.phaseIndex];
  if (!phase) return emptyResult(state);
  if (state.modelPending === true) {
    if (input.type !== "complete_correction_model") return emptyResult(state);
    return emptyResult(brandState({
      ...state,
      modelPending: false,
      activity: deepFreeze({ ...state.activity, status: "active", correction: null }),
      correctionState: null,
      missionRevision: state.missionRevision + 1
    }));
  }
  if (state.activity?.status === "model_pending"
    && input.type !== "complete_correction_model") return emptyResult(state);
  if (phase.kind === "teach") {
    if (input.type !== "complete-teach") return emptyResult(state);
    const audioBinding = exactAudioAuthority(state, context.audioAuthority);
    const sequence = reduceTeachSequence(state.activity.sequence, input, { audioBinding });
    if (sequence.currentItem) {
      const next = brandState({ ...state, missionRevision: state.missionRevision + 1,
        activity: deepFreeze({ ...state.activity, sequence }) });
      return emptyResult(next);
    }
    const taughtState = {
      ...state,
      activity: deepFreeze({ ...state.activity, sequence }),
      teachProgress: { teachIndex: sequence.teachIndex, teachTargetId: sequence.teachTargetId }
    };
    const moved = advance(taughtState, context);
    return deepFreeze({ state: moved.state, responseIntents: [], transition: null, completion: moved.completion });
  }
  if (phase.kind === "power_onboarding") {
    const power = SOUND_POWER_REGISTRY[phase.powerId];
    const reduced = power.reduce(state.activity, input, {
      challenge: state.activity.powerChallenge || state.challenge,
      assists
    });
    if (!reduced.responseIntents.length) {
      if (reduced.state === state.activity) return emptyResult(state);
      return emptyResult(brandState({
        ...state,
        activity: deepFreeze({ ...reduced.state, onboardingOwnerActionId: phase.ownerActionId, onboarding: true }),
        missionRevision: state.missionRevision + 1
      }));
    }
    const moved = advance(state, { ...context, gameState: state.gameState });
    return deepFreeze({ state: moved.state, responseIntents: [], transition: null, completion: moved.completion });
  }
  if (["arrival", "wonder", "payoff"].includes(phase.kind)) {
    const expected = `complete_${phase.kind}`;
    if (input.type !== expected) return emptyResult(state);
    const moved = advance(state, context);
    return deepFreeze({ state: moved.state, responseIntents: [], transition: null, completion: moved.completion });
  }
  if (phase.kind === "story_transfer" && ["action_completed", "meaning_requested"].includes(input.type)) {
    const presented = reduceConnectedTextPresentation(state.activity.presentation, {
      ...input,
      reducerRevision: state.activity.presentation.reducerRevision
    }, { state: state.gameState });
    const next = brandState({
      ...state,
      missionRevision: state.missionRevision + 1,
      presentationTransition: presented.transition,
      activity: deepFreeze({ ...state.activity, presentation: presented.nextPresentation })
    });
    return emptyResult(next);
  }
  if (phase.kind === "story_transfer" && state.activity.status === "narrative_choice_pending") {
    if (!input || typeof input !== "object" || Array.isArray(input)
      || Object.keys(input).length !== 2
      || input.type !== "choose_narrative_route" || typeof input.choiceId !== "string") {
      return emptyResult(state);
    }
    const choice = state.activity.childScene.choice.options
      .find(option => option.visualSemanticId === input.choiceId);
    if (!choice) return emptyResult(state);
    const gameState = checkpointStoryTransferTransaction(state.gameState, {
      transactionId: state.activeContent.transactionId,
      narrativeChoiceToken: choice.token
    });
    const challenge = materializeBossTransferChallenge(gameState, state.activeContent);
    const activity = storyPowerActivity({
      phase,
      stopId: state.plan.stopId,
      challenge,
      child: state.activity.childScene,
      gameState,
      activeContent: state.activeContent,
      seed: state.plan.seed,
      resume: null,
      presentation: state.activity.presentation
    });
    return emptyResult(brandState({
      ...state, gameState, challenge, activity, attemptId: challenge.attemptId,
      missionRevision: state.missionRevision + 1
    }));
  }
  if (phase.kind === "story_transfer" && input.type === "complete_story_transfer"
    && state.activity.presentation.phase === "meaning_support") {
    closeConnectedTextPresentation(state.activity.presentation);
    const moved = advance(state, { ...context, gameState: state.gameState });
    return deepFreeze({ state: moved.state, responseIntents: [], transition: null, completion: moved.completion });
  }
  if (["content_placement", "story_transfer"].includes(phase.kind)
    && input.type === "complete_correction_model") {
    const modeled = phase.kind === "content_placement"
      ? completeContentPlacementCorrectionModel(state.gameState, state.activeContent)
      : completeStoryTransferCorrectionModel(state.gameState, state.activeContent);
    const challenge = phase.kind === "content_placement"
      ? materializeContentPlacementChallenge(modeled.nextState, state.activeContent)
      : materializeStoryTransferChallenge(modeled.nextState, state.activeContent);
    const freshActivity = phase.kind === "story_transfer"
      ? storyPowerActivity({
        phase, stopId: state.plan.stopId, challenge,
        child: state.activity.childScene, gameState: modeled.nextState,
        activeContent: state.activeContent, seed: state.plan.seed, resume: null,
        presentation: state.activity.presentation
      })
      : SOUND_POWER_REGISTRY[phase.powerId].createState(challenge, {
        seed: state.plan.seed, resume: null, interaction: state.interaction
      });
    const next = brandState({
      ...state,
      gameState: modeled.nextState,
      challenge,
      attemptId: challenge.attemptId,
      missionRevision: state.missionRevision + 1,
      activity: deepFreeze({ ...freshActivity, correction: modeled.correction })
    });
    return emptyResult(next);
  }
  if (phase.kind === "content_placement" && phase.category === "morphology"
    && input.type === "complete_morphology_payoff"
    && state.activity.status === "awaiting_mission_commit"
    && state.gameState?.checkpoint?.contentPlacement === undefined) {
    const moved = advance(state, { ...context, gameState: state.gameState });
    return deepFreeze({ state: moved.state, responseIntents: [], transition: null, completion: moved.completion });
  }
  if (!["challenge", "content_opportunity", "content_placement", "story_transfer"].includes(phase.kind)) {
    return emptyResult(state);
  }
  const power = SOUND_POWER_REGISTRY[phase.powerId];
  const reduced = power.reduce(state.activity, input, {
    challenge: state.activity.powerChallenge || state.challenge,
    assists
  });
  const reducedActivity = phase.kind === "story_transfer"
    ? deepFreeze({
      ...reduced.state,
      childScene: state.activity.childScene,
      presentation: state.activity.presentation,
      powerChallenge: state.activity.powerChallenge
    })
    : reduced.state;
  if (!reduced.responseIntents.length) {
    if (reduced.state === state.activity) return emptyResult(state);
    return emptyResult(brandState({ ...state, activity: reducedActivity, missionRevision: state.missionRevision + 1 }));
  }
  const pending = brandState({ ...state, activity: reducedActivity, missionRevision: state.missionRevision + 1 });
  const audioAuthority = pending.challenge?.requiresAudio === false
    ? (context.audioAuthority ? exactAudioAuthority(pending, context.audioAuthority) : undefined)
    : exactAudioAuthority(pending, context.audioAuthority);
  const result = commitMissionResponse(pending, reduced.responseIntents, {
    challenge: pending.challenge,
    gameState: context.gameState,
    at: context.at,
    sessionDay: context.sessionDay,
    audio: context.audio,
    audioAuthority
  }, MISSION_COMMIT_CAPABILITY);
  return finalizeResponseCommit(result, pending, metadata => {
    if (phase.kind === "story_transfer") {
    const transactionCheckpoint = metadata.candidateState.checkpoint?.storyTransfer;
    const nextPowerChallenge = transactionCheckpoint?.stage === "response_pending"
      ? storyPowerChallenge(
        materializeStoryTransferChallenge(metadata.candidateState, pending.activeContent),
        phase, pending.activity.childScene, metadata.candidateState, pending.activeContent
      ) : null;
    const appliedPower = power.applyMissionCommitResult(pending.activity, result, {
      assertCommitResult: missionAuthority.assertCurrentMissionCommitResult,
      missionId: pending.plan.id, phaseId: pending.phaseId,
      attemptId: pending.attemptId, attemptOrdinal: pending.attemptOrdinal,
      revision: pending.missionRevision, nextChallenge: nextPowerChallenge,
      interaction: pending.interaction, seed: pending.plan.seed, correction: metadata.correction
    });
    const presented = reduceConnectedTextPresentation(pending.activity.presentation, {
      type: "decision_committed",
      reducerRevision: pending.activity.presentation.reducerRevision,
      evidenceEventId: metadata.event.id
    }, { state: metadata.candidateState });
    const checkpoint = metadata.candidateState.checkpoint?.storyTransfer;
    const challenge = checkpoint?.stage === "response_pending"
      ? materializeStoryTransferChallenge(metadata.candidateState, pending.activeContent) : pending.challenge;
    const next = brandState({
      ...pending,
      gameState: metadata.candidateState,
      activity: deepFreeze({
        ...appliedPower,
        powerChallenge: nextPowerChallenge,
        childScene: pending.activity.childScene,
        challengeId: challenge.challengeId,
        status: result.outcome === "model_required" ? "model_pending"
          : result.outcome === "advance" ? appliedPower.status : "active",
        correction: metadata.correction,
        presentation: presented.nextPresentation
      }),
      challenge,
      attemptOrdinal: checkpoint?.attemptOrdinal || pending.attemptOrdinal,
      attemptId: checkpoint?.attemptId || pending.attemptId,
      nextDecisionOrdinal: pending.nextDecisionOrdinal + 1,
      missionRevision: pending.missionRevision + 1,
      presentationTransition: presented.transition
    });
      return { state: next, responseIntents: [], transition: result, completion: null };
    }
    if (phase.kind === "content_placement" && phase.category === "morphology"
      && result.outcome === "advance") {
    power.applyMissionCommitResult(pending.activity, result, {
      assertCommitResult: missionAuthority.assertCurrentMissionCommitResult,
      missionId: pending.plan.id, phaseId: pending.phaseId,
      attemptId: pending.attemptId, attemptOrdinal: pending.attemptOrdinal,
      revision: pending.missionRevision
    });
    const next = brandState({
      ...pending,
      gameState: metadata.candidateState,
      nextDecisionOrdinal: pending.nextDecisionOrdinal + 1,
      missionRevision: pending.missionRevision + 1
    });
      return { state: next, responseIntents: [], transition: result, completion: null };
    }
    if (result.outcome === "advance") {
    power.applyMissionCommitResult(pending.activity, result, {
      assertCommitResult: missionAuthority.assertCurrentMissionCommitResult,
      missionId: pending.plan.id, phaseId: pending.phaseId,
      attemptId: pending.attemptId, attemptOrdinal: pending.attemptOrdinal,
      revision: pending.missionRevision
    });
    const moved = advance({
      ...pending,
      nextDecisionOrdinal: pending.nextDecisionOrdinal + 1,
      correctionState: null
    }, { ...context, gameState: metadata.candidateState });
      return { state: moved.state, responseIntents: [], transition: result, completion: moved.completion };
    }
    const attemptOrdinal = pending.attemptOrdinal + 1;
    let nextChallenge;
    let activity;
    if (phase.kind === "content_placement") {
    const descriptor = metadata.candidateState.checkpoint?.contentPlacement;
    nextChallenge = descriptor?.stage === "response_pending"
      ? materializeContentPlacementChallenge(metadata.candidateState, pending.activeContent) : pending.challenge;
    activity = power.applyMissionCommitResult(pending.activity, result, {
      assertCommitResult: missionAuthority.assertCurrentMissionCommitResult,
      missionId: pending.plan.id, phaseId: pending.phaseId,
      attemptId: pending.attemptId, attemptOrdinal: pending.attemptOrdinal,
      revision: pending.missionRevision, nextChallenge,
      interaction: null, seed: pending.plan.seed, correction: metadata.correction
    });
    } else {
    nextChallenge = phase.kind === "content_opportunity"
      ? heartChallenge(phase, pending.plan, pending.activeContent.served, attemptOrdinal)
      : createChallenge({
        action: phase, missionId: pending.plan.id, attemptOrdinal, seed: pending.plan.seed,
        contentSource: phase.contentBinding?.category === "heartWords"
          ? projectBoundContentResolverInputs(pending.activeContent.served) : null
      });
    activity = power.applyMissionCommitResult(pending.activity, result, {
      assertCommitResult: missionAuthority.assertCurrentMissionCommitResult,
      missionId: pending.plan.id,
      phaseId: pending.phaseId,
      attemptId: pending.attemptId,
      attemptOrdinal: pending.attemptOrdinal,
      revision: pending.missionRevision,
      nextChallenge,
      interaction: pending.interaction,
      seed: pending.plan.seed,
      correction: metadata.correction
    });
    }
    if (result.outcome === "model_required") activity = deepFreeze({ ...activity, status: "model_pending" });
    const next = brandState({
    ...pending, activity, challenge: nextChallenge,
    attemptOrdinal: phase.kind === "content_placement"
      ? metadata.candidateState.checkpoint?.contentPlacement?.attemptOrdinal ?? attemptOrdinal : attemptOrdinal,
    attemptId: nextChallenge.attemptId,
    nextDecisionOrdinal: pending.nextDecisionOrdinal + 1,
    missionRevision: pending.missionRevision + 1,
    gameState: metadata.candidateState,
    correctionState: metadata.correction,
    modelPending: result.outcome === "model_required"
      && !["content_placement", "story_transfer"].includes(phase.kind)
  });
    return { state: next, responseIntents: [], transition: result, completion: null };
  });
}

export function checkpointMission(state) {
  assertCurrent(state);
  const phase = state.plan.phases[state.phaseIndex];
  const power = phase?.powerId && state.activity?.powerId === phase.powerId
    && state.activity.kind === `${phase.powerId}_state`
    ? SOUND_POWER_REGISTRY[phase.powerId] : null;
  const rawPowerCheckpoint = power ? power.checkpoint(state.activity) : null;
  const powerCheckpoint = rawPowerCheckpoint ? deepFreeze({
    ...rawPowerCheckpoint,
    correction: null,
    ...(rawPowerCheckpoint.powerId === "story_power" ? { narrativeChoiceToken: null } : {})
  }) : null;
  const activeContent = state.activeContent?.kind === "heart"
    ? { kind: "heart", category: "heartWords", visitId: state.activeContent.served.visitId,
      actionUseId: state.activeContent.binding.actionUseId }
    : state.activeContent?.kind === "placement"
      ? { kind: "placement", placementId: state.activeContent.placementId,
        visitId: state.activeContent.visitId }
      : state.activeContent?.kind === "story_transfer"
        ? { kind: "story_transfer", transactionId: state.activeContent.transactionId } : null;
  return deepFreeze({
    schemaVersion: 1,
    kind: "sound_seekers_mission",
    contentVersion: state.plan.contentVersion,
    missionId: state.plan.id,
    stopId: state.plan.stopId,
    journeyStep: state.plan.journeyStep,
    attemptId: state.attemptId,
    attemptOrdinal: state.attemptOrdinal,
    missionRevision: state.missionRevision,
    seed: state.plan.seed,
    replayOrdinal: state.plan.replayOrdinal,
    phaseId: state.phaseId,
    completedPhaseIds: state.completedPhaseIds,
    teach: state.activity?.sequence ? {
      teachIndex: state.activity.sequence.teachIndex,
      teachTargetId: state.activity.sequence.teachTargetId
    } : state.teachProgress,
    nextDecisionOrdinal: state.nextDecisionOrdinal,
    activity: {
      kind: phase.kind,
      actionId: phase.id,
      challengeId: state.challenge?.challengeId || null,
      powerCheckpoint
    },
    activeContent,
    connectedTextPresentation: phase?.kind === "story_transfer"
      ? checkpointConnectedTextPresentation(state.activity.presentation) : null
  });
}

export function closeCurrentMissionPresentation(state) {
  assertCurrent(state);
  const phase = state.plan.phases[state.phaseIndex];
  if (phase?.kind !== "story_transfer" || !state.activity?.presentation
    || closedMissionPresentations.has(state)) return false;
  try {
    closeConnectedTextPresentation(state.activity.presentation);
  } catch {
    closedMissionPresentations.add(state);
    return false;
  }
  closedMissionPresentations.add(state);
  return true;
}

export function completeMission(gameState, completion) {
  const metadata = completionMetadata.get(completion);
  if (!completionBrands.has(completion) || !metadata) throw new Error("mission completion is forged or stale");
  if (!missionAuthority.isCurrentMissionState(metadata.missionState)
    || metadata.missionState.missionRevision !== metadata.missionRevision) {
    throw new Error("mission completion is not bound to the exact current final mission revision");
  }
  if (metadata.result) {
    if (gameState !== metadata.result.nextState) throw new Error("mission completion state has diverged");
    return metadata.result;
  }
  if (metadata.missionState.gameState !== gameState) {
    throw new Error("mission completion is not bound to the exact current final mission revision");
  }
  assertCanonicalCompletedPrefix(
    metadata.missionState.plan,
    gameState,
    metadata.missionState.plan.phases.length,
    metadata.missionState.completedPhaseIds,
    metadata.missionState.teachProgress
  );
  if (gameState !== metadata.gameState) throw new Error("mission completion is bound to another game state");
  const expedition = getExpedition(completion.stopId);
  const placementCategories = new Set(getContentDeckPlacements(expedition.stopId).map(item => item.category));
  for (const category of placementCategories) {
    const required = getContentDeckPlacements(expedition.stopId).filter(item => item.category === category);
    const uses = validContentDeckUses(gameState, category);
    if (required.some(placement => !uses.some(use => use.actionUseId === placement.contentBinding.actionUseId
      && use.journeyStep === completion.journeyStep))) {
      throw new Error("mission completion is missing a required canonical content placement use");
    }
  }
  for (const category of ["stories", "transfer"]) {
    if (!validContentDeckUses(gameState, category).some(use => use.journeyStep === completion.journeyStep)) {
      throw new Error("mission completion is missing its canonical story transaction use");
    }
  }
  const advancedTrail = advanceJourney(gameState.trail, expedition.stopId);
  const nextState = deepFreeze(normalizeSoundSeekersState({
    ...gameState,
    trail: {
      ...advancedTrail,
      completedStopIds: [...new Set([...gameState.trail.completedStopIds, expedition.stopId])].sort(),
      repairs: { ...gameState.trail.repairs, [expedition.payoff.repairId]: true },
      chapterCoverage: {
        ...gameState.trail.chapterCoverage,
        [expedition.chapterId]: Math.max(gameState.trail.chapterCoverage[expedition.chapterId] || 0,
          Number(expedition.stopId.slice(1)))
      }
    },
    checkpoint: null,
    journal: {
      ...gameState.journal,
      scenes: [...new Set([...gameState.journal.scenes, expedition.connectedTextId])].sort()
    },
    rewards: {
      claimedIds: [...new Set([...gameState.rewards.claimedIds, expedition.payoff.consequenceId])].sort()
    }
  }));
  const summary = deepFreeze({
    kind: "sound_seekers_mission_committed",
    stopId: expedition.stopId,
    journeyStep: completion.journeyStep,
    repairId: expedition.payoff.repairId,
    relationshipBeatId: expedition.payoff.relationshipBeatId,
    consequenceId: expedition.payoff.consequenceId
  });
  metadata.result = deepFreeze({ nextState, summary });
  return metadata.result;
}

export function currentMissionOwnsPowerPair(powerState, challenge) {
  const mission = missionByPowerState.get(powerState);
  return Boolean(mission && missionAuthority.isCurrentMissionState(mission)
    && mission.activity === powerState && mission.challenge === challenge);
}

export function exactCurrentMissionPowerBinding(missionState, powerState, challenge) {
  return missionAuthority.isCurrentMissionState(missionState)
    && missionState.activity === powerState && missionState.challenge === challenge;
}

export function validateCurrentMissionTransition(result, expected = {}) {
  return missionAuthority.validateCurrentMissionTransition(result, expected);
}

export function projectCurrentMissionSceneModel(missionState, rawAssists = {}, transition = null) {
  assertCurrent(missionState);
  const assists = normalizeMotorAssists(rawAssists);
  const phase = missionState.plan.phases[missionState.phaseIndex];
  const context = missionState.interaction?.context || null;
  const power = phase?.powerId && missionState.challenge
    ? SOUND_POWER_REGISTRY[phase.powerId] : null;
  const activity = power
    ? power.view(missionState.activity, missionState.activity.powerChallenge || missionState.challenge, assists)
    : deepFreeze({
      kind: missionState.activity?.kind || phase?.kind || null,
      powerId: missionState.activity?.powerId || phase?.powerId || null,
      status: missionState.activity?.status || null,
      motor: projectMotorPresentation(assists)
    });
  const contactTargetId = transition
    ? missionAuthority.projectContactTarget(transition, missionState) : null;
  return deepFreeze({
    kind: "sound_seekers_mission_scene_model",
    missionId: missionState.plan.id,
    stopId: missionState.plan.stopId,
    phaseId: missionState.phaseId,
    revision: missionState.missionRevision,
    contactTargetId,
    activity,
    interaction: context ? {
      contextId: context.id,
      childDecision: context.childDecision,
      decisionSteps: context.decisionSteps,
      objectIds: context.objectIds,
      objectRoles: context.objectRoles,
      recipientId: context.recipientId,
      recipientRole: context.recipientRole,
      physicalExpression: context.physicalExpression,
      consequenceId: context.consequenceId,
      consequence: context.consequence
    } : null,
    childScene: missionState.activity?.childScene || null,
    presentation: missionState.activity?.presentation || null,
    transition: missionState.presentationTransition || null
  });
}

export function projectCurrentWordWorkbenchModel(missionState, rawAssists = {}) {
  assertCurrent(missionState);
  const assists = normalizeMotorAssists(rawAssists);
  const phase = missionState.plan.phases[missionState.phaseIndex];
  if (phase?.powerId !== "word_forge" || missionState.activity?.powerId !== "word_forge"
    || missionState.challenge?.powerId !== "word_forge") {
    throw new Error("workbench model requires the exact current Word Forge mission state");
  }
  const model = SOUND_POWER_REGISTRY.word_forge.view(
    missionState.activity, missionState.challenge, assists
  );
  workbenchModels.set(model, {
    missionState, powerState: missionState.activity, challenge: missionState.challenge
  });
  return model;
}

export function issueWordWorkbenchAccess({
  missionState, model, pronunciation = null, transition = null, meaningPayoff = null
} = {}) {
  assertCurrent(missionState);
  const binding = workbenchModels.get(model);
  if (!binding || binding.missionState !== missionState
    || binding.powerState !== missionState.activity || binding.challenge !== missionState.challenge) {
    throw new Error("workbench access requires the exact final current mission child view");
  }
  let cue = null;
  if (pronunciation !== null) {
    const canonical = getPronunciation(pronunciation.id || pronunciation.word);
    if (canonical !== pronunciation || binding.challenge.wordId !== canonical?.id) {
      throw new Error("workbench pronunciation is not bound to the current word challenge");
    }
    cue = canonical;
  }
  let correctionPresentation = null;
  let morphology = null;
  if (transition !== null) {
    const expected = {
      missionId: missionState.plan.id,
      phaseId: transition.phaseId,
      revision: missionState.missionRevision
    };
    if (!missionAuthority.validateCurrentMissionTransition(transition, expected)) {
      throw new Error("workbench transition is stale or cross-mission");
    }
    const authority = missionAuthority.projectWorkbench(transition, expected, binding);
    if (!authority) throw new Error("workbench transition does not own this final child view");
    correctionPresentation = authority.correctionPresentation;
    if (authority.outcome === "advance" && authority.morphology) morphology = authority.morphology;
  }
  if (meaningPayoff !== null) throw new Error("workbench meaning payoff awaits authenticated visual access");
  const access = deepFreeze({ kind: "sound_seekers_workbench_access" });
  workbenchAccesses.set(access, {
    missionState, model, cue, correctionPresentation, morphology, meaningPayoff: null
  });
  return access;
}

export function projectWordWorkbenchAccess(access, model) {
  const authority = workbenchAccesses.get(access);
  if (!authority || authority.model !== model
    || !missionAuthority.isCurrentMissionState(authority.missionState)) return null;
  return deepFreeze({
    pronunciation: authority.cue,
    correctionPresentation: authority.correctionPresentation,
    morphology: authority.morphology,
    meaningPayoff: authority.meaningPayoff
  });
}
