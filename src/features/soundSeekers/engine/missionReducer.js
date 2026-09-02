import { QUEST_STOPS } from "../../../data/questSequence.js";
import { SOUND_SEEKERS_INTERACTION_CONTEXTS, getExpedition } from "../content/expeditions.js";
import { getContentDeckCatalogRecord } from "../content/contentDeckCatalogs.js";
import {
  beginContentPlacementAttempt,
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  completeContentPlacementCorrectionModel,
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
import {
  consumeMissionCommitCandidate,
  commitMissionResponse,
  markMissionCommitApplied
} from "./missionResponseCommit.js";
import { SOUND_POWER_REGISTRY } from "./powers/index.js";
import { normalizeSoundSeekersState } from "./stateV2.js";
import { createTeachSequence, reduceTeachSequence } from "./teachSequence.js";
import { registerCurrentWorkbenchMissionState } from "./workbenchAccess.js";

const missionBrands = new WeakSet();
const currentByMissionId = new Map();
const completionBrands = new WeakSet();
const completionMetadata = new WeakMap();

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function brandState(value) {
  const state = deepFreeze(value);
  missionBrands.add(state);
  currentByMissionId.set(state.plan.id, state);
  registerCurrentWorkbenchMissionState(state);
  return state;
}

function assertCurrent(state) {
  if (!missionBrands.has(state) || currentByMissionId.get(state?.plan?.id) !== state) {
    throw new Error("mission state is not the exact current revision");
  }
}

function passiveActivity(phase) {
  return deepFreeze({ kind: phase.kind, actionId: phase.id, status: "active" });
}

function interactionFor(action) {
  return deepFreeze({ action, context: SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId] });
}

function heartChallenge(phase, plan, served, attemptOrdinal = 0) {
  const instruction = phase.instructionId;
  const expectedToken = served.answerTokensByActivity[phase.activityFocus];
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
    optionTokens: [expectedToken, `${expectedToken}:contrast`],
    childText: "Carry the whole word to its matching place.",
    cue: "whole_word",
    requiresAudio: false,
    presentation: {
      recipients: [expectedToken, `${expectedToken}:contrast`].map((token, index) => ({
        id: `${contextId}:${plan.id}:${phase.id}:recipient:${index}`,
        label: index === 0 ? served.wordId : "another word",
        token
      }))
    }
  });
}

function contentState(base, context) {
  return context.gameState || base.gameState;
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
    return {
      ...base, gameState: gameState || null,
      phaseIndex, phaseId: phase.id, challenge, interaction,
      attemptId: challenge.attemptId,
      activeContent: sharedHeart
        ? deepFreeze({ kind: "heart", served, binding: phase.contentBinding })
        : base.activeContent || null,
      activity: power.createState(challenge, {
        seed: base.plan.seed, resume: resume?.activity?.powerCheckpoint || null, interaction
      })
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
      activity = deepFreeze({
        kind: "content_placement_activity", powerId: phase.powerId,
        challengeId: challenge?.challengeId || null,
        status: challenge ? "active" : "model_pending", correction: begun.correction
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
    const narrativeChoiceToken = getExpedition(base.plan.stopId).transfer.boss
      ? child.choice.options[Math.abs(base.plan.seed) % child.choice.options.length].token : null;
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
      challenge, interaction: null,
      attemptId: begun.attempt?.attemptId || challenge?.attemptId || base.attemptId,
      activity: deepFreeze({
        kind: "story_transfer_activity", powerId: phase.powerId,
        challengeId: challenge?.challengeId || null,
        status: challenge ? "active" : "model_pending", childScene: child,
        correction: null, presentation
      }),
      activeContent: deepFreeze({ kind: "story_transfer", transactionId: begun.transaction.transactionId })
    };
  }
  return {
    ...base, gameState: contentState(base, context) || null, phaseIndex, phaseId: phase.id, challenge: null, interaction: null,
    activity: passiveActivity(phase)
  };
}

export function createMissionState(plan, resume = null) {
  if (!plan || plan.kind !== "sound_seekers_mission_plan" || !Object.isFrozen(plan)) {
    throw new Error("mission state requires an exact frozen plan");
  }
  if (resume !== null) {
    if (resume.kind !== "sound_seekers_mission" || resume.missionId !== plan.id
      || resume.contentVersion !== plan.contentVersion || resume.stopId !== plan.stopId
      || resume.journeyStep !== plan.journeyStep) throw new Error("mission resume does not match its plan");
    const phaseIndex = plan.phases.findIndex(phase => phase.id === resume.phaseId);
    if (phaseIndex < 0) throw new Error("mission resume phase is not canonical");
    return brandState(enteredState({
      kind: "sound_seekers_mission_state", plan, phaseIndex,
      completedPhaseIds: [...resume.completedPhaseIds], missionRevision: resume.missionRevision,
      attemptOrdinal: resume.attemptOrdinal, attemptId: resume.attemptId,
      nextDecisionOrdinal: resume.nextDecisionOrdinal,
      presentationTransition: null,
      modelPending: resume.activity?.powerCheckpoint?.correction?.modelOnce === true,
      correctionState: resume.activity?.powerCheckpoint?.correction || null,
      gameState: currentGameStateForMissionPlan(plan)
    }, phaseIndex, {
      gameState: currentGameStateForMissionPlan(plan),
      resume: resume.activity ? resume : null
    }));
  }
  return brandState(enteredState({
    kind: "sound_seekers_mission_state", plan, phaseIndex: 0,
    completedPhaseIds: [], missionRevision: 0,
    attemptOrdinal: 0, attemptId: `${plan.id}:${plan.phases[0].id}:attempt:0`,
    nextDecisionOrdinal: 0, presentationTransition: null, modelPending: false,
    correctionState: null,
    gameState: currentGameStateForMissionPlan(plan)
  }, 0, { gameState: currentGameStateForMissionPlan(plan) }));
}

function emptyResult(state) {
  return deepFreeze({ state, responseIntents: [], transition: null, completion: null });
}

function completionFor(state, gameState) {
  const completion = deepFreeze({
    kind: "sound_seekers_mission_completion",
    missionId: state.plan.id,
    stopId: state.plan.stopId,
    journeyStep: state.plan.journeyStep,
    completedPhaseIds: state.plan.phases.map(phase => phase.id)
  });
  completionBrands.add(completion);
  completionMetadata.set(completion, { gameState, result: null });
  return completion;
}

function advance(state, context) {
  const phase = state.plan.phases[state.phaseIndex];
  const completedPhaseIds = [...state.completedPhaseIds, phase.id];
  const revision = state.missionRevision + 1;
  if (state.phaseIndex === state.plan.phases.length - 1) {
    const final = brandState({ ...state, completedPhaseIds, missionRevision: revision });
    return { state: final, completion: completionFor(final, context.gameState) };
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
  const phase = state.plan.phases[state.phaseIndex];
  if (!phase) return emptyResult(state);
  if (state.modelPending === true) {
    if (input.type !== "complete_correction_model") return emptyResult(state);
    return emptyResult(brandState({
      ...state,
      modelPending: false,
      activity: deepFreeze({ ...state.activity, correction: null }),
      correctionState: null,
      missionRevision: state.missionRevision + 1
    }));
  }
  if (phase.kind === "teach") {
    if (input.type !== "complete-teach") return emptyResult(state);
    const sequence = reduceTeachSequence(state.activity.sequence, input);
    if (sequence.currentItem) {
      const next = brandState({ ...state, missionRevision: state.missionRevision + 1,
        activity: deepFreeze({ ...state.activity, sequence }) });
      return emptyResult(next);
    }
    const moved = advance(state, context);
    return deepFreeze({ state: moved.state, responseIntents: [], transition: null, completion: moved.completion });
  }
  if (["arrival", "wonder", "power_onboarding", "payoff"].includes(phase.kind)) {
    const expected = phase.kind === "power_onboarding" ? "complete_onboarding" : `complete_${phase.kind}`;
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
    const next = brandState({
      ...state,
      gameState: modeled.nextState,
      challenge,
      attemptId: challenge.attemptId,
      missionRevision: state.missionRevision + 1,
      activity: deepFreeze({ ...state.activity, challengeId: challenge.challengeId,
        status: "active", correction: modeled.correction })
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
  let reduced;
  if (phase.kind === "content_placement" && phase.category !== "morphology") {
    if (state.activity.status !== "active" || input.type !== "content_response"
      || input.response?.kind !== "literacy-answer") return emptyResult(state);
    reduced = deepFreeze({
      state: { ...state.activity, status: "awaiting_mission_commit" },
      responseIntents: [{ kind: "challenge_response", challengeId: state.challenge.challengeId,
        response: input.response }]
    });
  } else if (phase.kind === "story_transfer") {
    if (state.activity.status !== "active" || input.type !== "story_response"
      || input.response?.kind !== "literacy-answer") return emptyResult(state);
    reduced = deepFreeze({
      state: { ...state.activity, status: "awaiting_mission_commit" },
      responseIntents: [{ kind: "challenge_response", challengeId: state.challenge.challengeId,
        response: input.response }]
    });
  } else {
    reduced = power.reduce(state.activity, input, { challenge: state.challenge, assists: context.assists });
  }
  if (!reduced.responseIntents.length) {
    if (reduced.state === state.activity) return emptyResult(state);
    return emptyResult(brandState({ ...state, activity: reduced.state, missionRevision: state.missionRevision + 1 }));
  }
  const pending = brandState({ ...state, activity: reduced.state, missionRevision: state.missionRevision + 1 });
  const result = commitMissionResponse(pending, reduced.responseIntents, {
    challenge: pending.challenge,
    gameState: context.gameState,
    at: context.at,
    sessionDay: context.sessionDay,
    audio: context.audio
  });
  const metadata = consumeMissionCommitCandidate(result, pending);
  if (phase.kind === "story_transfer") {
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
        ...pending.activity,
        challengeId: challenge.challengeId,
        status: result.outcome === "model_required" ? "model_pending"
          : result.outcome === "advance" ? "resolved_response" : "active",
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
    markMissionCommitApplied(result, next);
    return deepFreeze({ state: next, responseIntents: [], transition: result, completion: null });
  }
  if (phase.kind === "content_placement" && phase.category === "morphology"
    && result.outcome === "advance") {
    const next = brandState({
      ...pending,
      gameState: metadata.candidateState,
      nextDecisionOrdinal: pending.nextDecisionOrdinal + 1,
      missionRevision: pending.missionRevision + 1
    });
    markMissionCommitApplied(result, next);
    return deepFreeze({ state: next, responseIntents: [], transition: result, completion: null });
  }
  if (result.outcome === "advance") {
    const moved = advance({
      ...pending,
      nextDecisionOrdinal: pending.nextDecisionOrdinal + 1,
      correctionState: null
    }, { ...context, gameState: metadata.candidateState });
    markMissionCommitApplied(result, moved.state);
    return deepFreeze({ state: moved.state, responseIntents: [], transition: result, completion: moved.completion });
  }
  const attemptOrdinal = pending.attemptOrdinal + 1;
  let nextChallenge;
  let activity;
  if (phase.kind === "content_placement") {
    const descriptor = metadata.candidateState.checkpoint?.contentPlacement;
    nextChallenge = descriptor?.stage === "response_pending"
      ? materializeContentPlacementChallenge(metadata.candidateState, pending.activeContent) : pending.challenge;
    activity = deepFreeze({
      ...pending.activity,
      challengeId: nextChallenge.challengeId,
      status: result.outcome === "model_required" ? "model_pending" : "active",
      correction: metadata.correction
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
  markMissionCommitApplied(result, next);
  return deepFreeze({ state: next, responseIntents: [], transition: result, completion: null });
}

export function checkpointMission(state) {
  assertCurrent(state);
  const phase = state.plan.phases[state.phaseIndex];
  const power = phase?.kind === "challenge" || phase?.kind === "content_opportunity"
    || (phase?.kind === "content_placement" && phase.category === "morphology")
    ? SOUND_POWER_REGISTRY[phase.powerId] : null;
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
    teach: {
      teachIndex: state.activity?.sequence?.teachIndex || 0,
      teachTargetId: state.activity?.sequence?.teachTargetId || null
    },
    nextDecisionOrdinal: state.nextDecisionOrdinal,
    activity: {
      kind: phase.kind,
      actionId: phase.id,
      challengeId: state.challenge?.challengeId || null,
      powerCheckpoint: power ? power.checkpoint(state.activity) : null
    },
    activeContent,
    connectedTextPresentation: phase?.kind === "story_transfer"
      ? checkpointConnectedTextPresentation(state.activity.presentation) : null
  });
}

export function completeMission(gameState, completion) {
  const metadata = completionMetadata.get(completion);
  if (!completionBrands.has(completion) || !metadata) throw new Error("mission completion is forged or stale");
  if (metadata.result) {
    if (gameState !== metadata.result.nextState) throw new Error("mission completion state has diverged");
    return metadata.result;
  }
  if (gameState !== metadata.gameState) throw new Error("mission completion is bound to another game state");
  const expedition = getExpedition(completion.stopId);
  const nextState = deepFreeze(normalizeSoundSeekersState({
    ...gameState,
    trail: {
      ...gameState.trail,
      journeyStep: Math.max(gameState.trail.journeyStep, completion.journeyStep + 1),
      routeCursor: Math.min(40, Number(expedition.stopId.slice(1)) + 1),
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

export function isCurrentMissionState(state) {
  return missionBrands.has(state) && currentByMissionId.get(state?.plan?.id) === state;
}
