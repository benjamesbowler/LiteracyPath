import { nextCorrection } from "../../../utils/questCorrection.js";
import { appendEvidence, createLiteracyDecision, deriveConfusions } from "./evidence.js";
import { normalizeSoundSeekersState } from "./stateV2.js";
import { recordContentDeckUse } from "./contentDeckScheduler.js";
import {
  commitContentPlacementResponse,
  completeStoryTransferTransaction
} from "./contentDeckTransactions.js";

const issuedResults = new WeakSet();
const resultMetadata = new WeakMap();
const cachedByIntentSet = new WeakMap();

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function exactKeys(value, keys) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function assertCommitContext(state, intents, context) {
  if (!Object.isFrozen(state) || !Object.isFrozen(intents) || intents.length !== 1
    || !Object.isFrozen(intents[0]) || !context?.challenge || !context?.gameState
    || !exactKeys(intents[0], ["kind", "challengeId", "response"])
    || !["challenge_response", "content_response"].includes(intents[0].kind)
    || intents[0].challengeId !== context.challenge.challengeId
    || state.challenge !== context.challenge
    || state.activity?.status !== "awaiting_mission_commit"
    || state.attemptId !== context.challenge.attemptId
    || (intents[0].kind === "challenge_response"
      && (!exactKeys(intents[0].response, ["kind", "token"])
        || intents[0].response.kind !== "literacy-answer"))) {
    throw new Error("mission response commit requires the exact current response intent");
  }
}

export function commitMissionResponse(state, responseIntents, context = {}) {
  assertCommitContext(state, responseIntents, context);
  const cached = cachedByIntentSet.get(responseIntents);
  if (cached && resultMetadata.get(cached)?.missionState === state) return cached;
  if (!["at", "sessionDay", "audio"].every(key => Object.hasOwn(context, key))) {
    throw new Error("mission response commit needs canonical time, session, and audio inputs");
  }
  const attemptSupportLevel = Math.min(state.attemptOrdinal, 3);
  const phase = state.plan.phases[state.phaseIndex];
  const baseGameState = state.gameState || context.gameState;
  let transaction = null;
  if (phase.kind === "content_placement") {
    transaction = commitContentPlacementResponse(baseGameState, {
      placementId: state.activeContent.placementId,
      visitId: state.activeContent.visitId,
      challenge: context.challenge,
      response: responseIntents[0].response,
      audio: context.audio,
      at: context.at,
      sessionDay: context.sessionDay
    });
  } else if (phase.kind === "story_transfer") {
    transaction = completeStoryTransferTransaction(baseGameState, {
      transactionId: state.activeContent.transactionId,
      challenge: context.challenge,
      response: responseIntents[0].response,
      audio: context.audio,
      at: context.at,
      sessionDay: context.sessionDay
    });
  }
  const event = transaction?.event || (responseIntents[0].kind === "challenge_response" ? createLiteracyDecision({
    challenge: context.challenge,
    response: responseIntents[0].response,
    support: { level: attemptSupportLevel, revealed: attemptSupportLevel >= 3 },
    audio: context.audio,
    journeyStep: state.plan.journeyStep,
    ordinal: state.nextDecisionOrdinal,
    at: context.at,
    sessionDay: context.sessionDay
  }) : null);
  if (!event && phase.category !== "morphology") throw new Error("mission response did not produce canonical evidence");
  let candidateState = transaction ? normalizeSoundSeekersState(transaction.nextState) : normalizeSoundSeekersState({
    ...baseGameState,
    evidence: appendEvidence(baseGameState.evidence, event),
    confusions: deriveConfusions(appendEvidence(baseGameState.evidence, event))
  });
  if ((phase.kind === "content_opportunity" || phase.contentBinding?.category === "heartWords")
    && event?.correct) {
    candidateState = normalizeSoundSeekersState({
      ...candidateState,
      contentDecks: recordContentDeckUse(
        candidateState.contentDecks,
        state.activeContent.served,
        state.activeContent.binding
      )
    });
  }
  const correction = transaction?.correction || (event && !event.correct ? nextCorrection(state.correctionState || {}, {
    selected: event.confusion,
    intended: context.challenge.expectedToken,
    targetId: context.challenge.targetId,
    domain: context.challenge.recordsDomain,
    wordId: context.challenge.wordId || null,
    position: context.challenge.position ?? null,
    evidenceKind: "practice"
  }) : null);
  const transactionOutcome = transaction?.outcome;
  const outcome = transactionOutcome === "completed" ? "advance"
    : transactionOutcome === "next_challenge" ? "continue"
      : transactionOutcome || (event.correct ? "advance" : state.attemptOrdinal >= 2 ? "model_required" : "retry");
  const supportLevel = ["retry", "model_required"].includes(outcome)
    ? Math.min(state.attemptOrdinal + 1, 3)
    : outcome === "continue" ? 0 : attemptSupportLevel;
  const checkpoint = phase.kind === "content_placement"
    ? candidateState.checkpoint?.contentPlacement : phase.kind === "story_transfer"
      ? candidateState.checkpoint?.storyTransfer : null;
  const nextAttemptId = outcome === "advance"
    ? null : checkpoint?.attemptId || `${state.plan.id}:${state.phaseId}:attempt:${state.attemptOrdinal + 1}`;
  const correctionRecordIds = transaction?.correction?.correctionRecordId
    ? [transaction.correction.correctionRecordId]
    : correction ? [`mission-correction:${context.challenge.attemptId}`] : [];
  const result = deepFreeze({
    kind: "sound_seekers_mission_commit_result",
    missionId: state.plan.id,
    phaseId: state.phaseId,
    attemptId: state.attemptId,
    attemptOrdinal: state.attemptOrdinal,
    outcome,
    supportLevel,
    correctionRecordIds,
    nextAttemptId
  });
  issuedResults.add(result);
  resultMetadata.set(result, {
    status: "issued",
    missionState: state,
    missionRevision: state.missionRevision,
    responseIntents,
    candidateState,
    event,
    correction,
    finalizedRevision: null
  });
  cachedByIntentSet.set(responseIntents, result);
  return result;
}

export function assertCurrentMissionCommitResult(result, expected = {}) {
  const metadata = resultMetadata.get(result);
  if (!issuedResults.has(result) || !metadata || metadata.status !== "issued") {
    throw new Error("mission commit result is forged, stale, or consumed");
  }
  const checks = {
    missionId: result.missionId,
    phaseId: result.phaseId,
    attemptId: result.attemptId,
    attemptOrdinal: result.attemptOrdinal,
    revision: metadata.missionRevision
  };
  for (const [key, value] of Object.entries(expected)) {
    if (Object.hasOwn(checks, key) && checks[key] !== value) {
      throw new Error("mission commit result does not match the current mission revision");
    }
  }
  return true;
}

export function validateCurrentMissionTransition(result, expected = {}) {
  const metadata = resultMetadata.get(result);
  if (!issuedResults.has(result) || !metadata || metadata.status !== "applied") return false;
  if (expected.missionId !== undefined && result.missionId !== expected.missionId) return false;
  if (expected.phaseId !== undefined && result.phaseId !== expected.phaseId) return false;
  if (expected.revision !== undefined && metadata.finalizedRevision !== expected.revision) return false;
  return true;
}

export function projectMissionWorkbenchAuthority(result, expected = {}, binding = {}) {
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
      ?.find(source => source.id === tile.id)?.token === correction.selected)?.label || String(correction.selected);
    const mode = correction.modelOnce ? "teach" : correction.isolatePosition !== null ? "narrow" : "retry";
    const visibleText = correction.modelOnce
      ? `Watch once. Then try ${selectedContrast} again.`
      : correction.isolatePosition !== null
        ? `Listen at the important sound. Then try ${selectedContrast} again.`
        : `Listen again. Compare ${selectedContrast} with the target sound.`;
    correctionPresentation = deepFreeze({
      mode,
      replayContrast: correction.replayContrast === true,
      selectedContrast,
      visibleText,
      spokenText: visibleText
    });
  }
  return deepFreeze({
    outcome: result.outcome,
    correctionPresentation,
    morphology: missionState.plan.phases[missionState.phaseIndex]?.placementId === "s38-morphology"
      ? missionState.interaction : null
  });
}

export function consumeMissionCommitCandidate(result, state) {
  const metadata = resultMetadata.get(result);
  if (!metadata || metadata.status !== "issued" || metadata.missionState !== state) {
    throw new Error("mission commit candidate is not current");
  }
  return metadata;
}

export function markMissionCommitApplied(result, finalizedState) {
  const metadata = resultMetadata.get(result);
  if (!metadata || metadata.status !== "issued" || !Number.isInteger(finalizedState?.missionRevision)) {
    throw new Error("mission commit result cannot be finalized");
  }
  metadata.status = "applied";
  metadata.finalizedRevision = finalizedState.missionRevision;
  metadata.finalMissionState = finalizedState;
  return result;
}
