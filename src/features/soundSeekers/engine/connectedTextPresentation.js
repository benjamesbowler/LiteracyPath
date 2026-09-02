import {
  CONTENT_DECK_CATEGORIES,
  getContentDeckCatalogRecord
} from "../content/contentDeckCatalogs.js";
import {
  evaluateConnectedTextDecision,
  getConnectedText
} from "../content/connectedText.js";
import { getMeaningSupport } from "../content/meaningSupport.js";
import {
  getSceneVisualSemantics,
  resolveNarrativeBranchOutcome,
  resolveSceneVisualSemantic
} from "../content/sceneVisualSemantics.js";
import {
  validAttemptReceipts,
  validContentDeckUses
} from "./contentCoverage.js";
import { rehydrateServedContentInstance } from "./contentDeckScheduler.js";
import { completeStoryTransferTransaction } from "./contentDeckTransactions.js";
import { isSoundSeekersV2 } from "./stateV2.js";

const stateBrands = new WeakSet();
const transitionBrands = new WeakSet();
const stateGenerations = new WeakMap();
const transitionGenerations = new WeakMap();
let activePresentation = null;

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function plainObject(value) {
  return value !== null && typeof value === "object"
    && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value, keys) {
  return plainObject(value)
    && Object.keys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key));
}

function stringId(value) {
  return typeof value === "string" && value.trim() === value && value.length > 0 ? value : null;
}

function invalidateActive() {
  activePresentation = null;
}

function brandedState(fields, generation) {
  const value = { ...fields };
  stateBrands.add(value);
  stateGenerations.set(value, generation);
  return deepFreeze(value);
}

function brandedTransition(fields, generation) {
  const value = { ...fields };
  transitionBrands.add(value);
  transitionGenerations.set(value, generation);
  return deepFreeze(value);
}

function assertCurrentState(presentation) {
  if (!stateBrands.has(presentation)
    || !activePresentation
    || presentation !== activePresentation.currentState
    || stateGenerations.get(presentation) !== activePresentation.generation
    || presentation.sceneId !== activePresentation.sceneId
    || presentation.transactionId !== activePresentation.transactionId
    || presentation.reducerRevision !== activePresentation.reducerRevision) {
    throw new Error("connected-text presentation is not the exact active revision");
  }
}

function freezeEvent(event) {
  return deepFreeze({ ...event });
}

function eventShape(event) {
  if (!plainObject(event)) return null;
  if (event.type === "decision_committed"
    && exactKeys(event, ["type", "reducerRevision", "evidenceEventId"])
    && Number.isInteger(event.reducerRevision) && stringId(event.evidenceEventId)) return "decision_committed";
  if (event.type === "action_completed"
    && exactKeys(event, ["type", "reducerRevision"])
    && Number.isInteger(event.reducerRevision)) return "action_completed";
  if (event.type === "meaning_requested"
    && exactKeys(event, ["type", "reducerRevision", "meaningSemanticId"])
    && Number.isInteger(event.reducerRevision) && stringId(event.meaningSemanticId)) return "meaning_requested";
  return null;
}

const STATE_KEYS = [
  "v", "contentVersion", "reset", "trail", "evidence", "confusions", "contentDecks",
  "attemptReceipts", "journal", "rewards", "checkpoint", "assignment", "settings"
];

function assertCompleteStateShape(state) {
  if (!plainObject(state) || !isSoundSeekersV2(state)
    || !exactKeys(state, STATE_KEYS)
    || !plainObject(state.contentDecks)
    || JSON.stringify(Object.keys(state.contentDecks)) !== JSON.stringify(CONTENT_DECK_CATEGORIES)
    || !plainObject(state.attemptReceipts)
    || (state.checkpoint !== null && (!plainObject(state.checkpoint)
      || state.checkpoint.contentVersion !== state.contentVersion))) {
    throw new Error("presentation requires one complete canonical Sound Seekers state");
  }
  for (const category of CONTENT_DECK_CATEGORIES) {
    const deck = state.contentDecks[category];
    if (!exactKeys(deck, ["visits", "uses"])
      || !plainObject(deck.visits) || !plainObject(deck.uses)) {
      throw new Error("presentation requires all five canonical content decks");
    }
  }
}

function challengeForReceipt(scene, receipt) {
  const record = getContentDeckCatalogRecord("transfer", scene.transferRef.recordId);
  const boss = scene.choice.kind === "narrative_bridge";
  return deepFreeze({
    challengeId: `${receipt.attemptId}:${boss ? "boss" : "transfer"}`,
    attemptId: receipt.attemptId,
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
    childText: boss
      ? "Blend the new word. Choose its picture."
      : "Choose the action that matches the story.",
    requiresAudio: false
  });
}

function assertReceiptInputHash(state, scene, receipt, event) {
  const challenge = challengeForReceipt(scene, receipt);
  completeStoryTransferTransaction(state, {
    transactionId: receipt.subjectId,
    challenge,
    response: {
      kind: "literacy-answer",
      token: event.correct ? challenge.expectedToken : event.confusion
    },
    audio: { status: event.cueDelivery },
    at: event.at,
    sessionDay: event.sessionDay
  });
}

function verifyCanonicalVisits(state, scene, transactionId, journeyStep) {
  if (state.trail.journeyStep !== journeyStep) {
    throw new Error("connected-text presentation is not bound to the current journey visit");
  }
  const storyVisitId = `visit:${transactionId}:story`;
  const transferVisitId = `visit:${transactionId}:transfer`;
  const story = rehydrateServedContentInstance(state.contentDecks, {
    category: "stories", visitId: storyVisitId
  });
  const transfer = rehydrateServedContentInstance(state.contentDecks, {
    category: "transfer", visitId: transferVisitId
  });
  if (!story || !transfer || story.recordId !== scene.storyRef.recordId
    || transfer.recordId !== scene.transferRef.recordId
    || story.stopId !== scene.stopId || transfer.stopId !== scene.stopId
    || story.journeyStep !== journeyStep || transfer.journeyStep !== journeyStep) {
    throw new Error("connected-text presentation visits are not canonical");
  }
  const transferRecord = getContentDeckCatalogRecord("transfer", scene.transferRef.recordId);
  if (!transferRecord || transferRecord.instructionId !== scene.transferRef.instructionId
    || transferRecord.powerId !== scene.transferRef.powerId
    || transferRecord.expectedAction !== scene.transferRef.expectedAction
    || transferRecord.recordsDomain !== scene.transferRef.recordsDomain) {
    throw new Error("connected-text presentation transfer tuple is invalid");
  }
}

function verifyEventForScene(scene, event) {
  if (scene.choice.kind === "assessed_connected_text") {
    if (event.target !== `text:${scene.id}` || event.domain !== "connected_text_transfer"
      || event.connectedTextId !== scene.id || event.word !== null || event.position !== null
      || event.bossTransferId !== null || Object.hasOwn(event, "activityType")) {
      throw new Error("connected-text evidence identity is invalid");
    }
    const selected = event.correct
      ? getContentDeckCatalogRecord("transfer", scene.transferRef.recordId).decisionContract.expectedToken
      : event.confusion;
    const result = evaluateConnectedTextDecision(scene.id, selected);
    if (result.correct !== event.correct || (event.correct ? event.confusion !== null : event.confusion !== selected)) {
      throw new Error("connected-text evidence decision is inconsistent");
    }
  } else {
    const record = getContentDeckCatalogRecord("transfer", scene.transferRef.recordId);
    if (event.domain !== "novel_decoding"
    || event.target !== record.targetId
    || event.word !== scene.transferRef.wordId || event.position !== "whole"
    || event.connectedTextId !== null || event.bossTransferId !== scene.transferRef.bossTransferId
    || Object.hasOwn(event, "activityType")
    || (event.correct
      ? event.confusion !== null
      : !record.decisionContract.optionTokens.includes(event.confusion)
        || event.confusion === record.decisionContract.expectedToken)) {
      throw new Error("boss presentation evidence identity is invalid");
    }
  }
}

function verifyConnectedTextHistoryAgainstTask2(state, { sceneId, transactionId, history }) {
  assertCompleteStateShape(state);
  const scene = getConnectedText(sceneId);
  if (!scene) throw new Error("presentation scene is unknown");
  const match = /^story-transfer:(\d+):(s(?:[1-9]|[1-3][0-9]|40))$/u.exec(transactionId);
  if (!match || match[2] !== scene.stopId) {
    throw new Error("presentation transaction identity is invalid");
  }
  const journeyStep = Number(match[1]);
  verifyCanonicalVisits(state, scene, transactionId, journeyStep);
  const decisions = history.filter(event => event.type === "decision_committed");
  const receipts = validAttemptReceipts(state)
    .filter(receipt => receipt.operation === "story_transfer" && receipt.subjectId === transactionId)
    .sort((left, right) => left.attemptOrdinal - right.attemptOrdinal);
  const rawReceipts = Object.values(state.attemptReceipts)
    .filter(receipt => plainObject(receipt) && receipt.subjectId === transactionId);
  if (decisions.length !== receipts.length || rawReceipts.length !== receipts.length) {
    throw new Error("presentation decision history does not match canonical receipts");
  }
  const evidenceIds = new Set();
  const verified = decisions.map((decision, ordinal) => {
    const receipt = receipts[ordinal];
    const rawReceipt = state.attemptReceipts[receipt?.attemptId];
    if (receipt.attemptOrdinal !== ordinal || receipt.decisionOrdinal !== 0
      || receipt.completed !== (ordinal === receipts.length - 1 && receipt.useIds.length === 2)
      || receipt.eventIds.length !== 1 || receipt.eventIds[0] !== decision.evidenceEventId) {
      throw new Error("presentation attempt receipts are not contiguous and canonical");
    }
    if (!rawReceipt || !exactKeys(rawReceipt, [
      "kind", "attemptId", "operation", "subjectId", "decisionOrdinal", "attemptOrdinal",
      "inputSha256", "completed", "correctionRecordIds", "eventIds", "useIds"
    ]) || JSON.stringify(rawReceipt) !== JSON.stringify(receipt)) {
      throw new Error("presentation receipt differs from canonical Task 2 history");
    }
    const matches = state.evidence.filter(event => event.id === decision.evidenceEventId);
    if (matches.length !== 1 || evidenceIds.has(decision.evidenceEventId)) {
      throw new Error("presentation evidence identity is missing, duplicated, or conflicted");
    }
    evidenceIds.add(decision.evidenceEventId);
    const event = matches[0];
    verifyEventForScene(scene, event);
    if (event.correct !== receipt.completed) {
      throw new Error("presentation receipt completion disagrees with evidence");
    }
    if (!event.correct && (receipt.correctionRecordIds.length !== 1 || receipt.useIds.length !== 0)) {
      throw new Error("presentation correction receipt is invalid");
    }
    assertReceiptInputHash(state, scene, receipt, event);
    return { decision, receipt, event };
  });
  const newest = verified.at(-1);
  const storyUses = validContentDeckUses(state, "stories")
    .filter(use => use.transactionId === transactionId);
  const transferUses = validContentDeckUses(state, "transfer")
    .filter(use => use.transactionId === transactionId);
  const descriptor = state.checkpoint?.storyTransfer;
  let narrativeChoiceToken;
  if (!newest) {
    if (!descriptor || !exactKeys(descriptor, [
      "kind", "transactionId", "stopId", "journeyStep", "stage", "storyVisitId",
      "transferVisitId", "narrativeChoiceToken", "attemptOrdinal", "attemptId"
    ]) || descriptor.kind !== "story_transfer"
      || descriptor.transactionId !== transactionId || descriptor.stopId !== scene.stopId
      || descriptor.journeyStep !== journeyStep || descriptor.stage !== "response_pending"
      || descriptor.storyVisitId !== `visit:${transactionId}:story`
      || descriptor.transferVisitId !== `visit:${transactionId}:transfer`
      || descriptor.attemptOrdinal !== 0
      || descriptor.attemptId !== `story-transfer-attempt:${transactionId}:0`
      || storyUses.length || transferUses.length) {
      throw new Error("revision-zero presentation checkpoint is inconsistent");
    }
    narrativeChoiceToken = descriptor.narrativeChoiceToken;
  } else if (newest.event.correct) {
    if (descriptor || storyUses.length !== 1 || transferUses.length !== 1) {
      throw new Error("completed presentation lacks one reciprocal final use pair");
    }
    const storyUse = storyUses[0];
    const transferUse = transferUses[0];
    if (storyUse.pairedUseId !== transferUse.useId || transferUse.pairedUseId !== storyUse.useId
      || storyUse.evidenceEventId !== newest.event.id || transferUse.evidenceEventId !== newest.event.id
      || JSON.stringify(storyUse.attemptReceiptIds) !== JSON.stringify(receipts.map(receipt => receipt.attemptId))
      || JSON.stringify(transferUse.attemptReceiptIds) !== JSON.stringify(receipts.map(receipt => receipt.attemptId))
      || storyUse.narrativeChoiceToken !== transferUse.narrativeChoiceToken) {
      throw new Error("completed presentation reciprocal uses are inconsistent");
    }
    narrativeChoiceToken = storyUse.narrativeChoiceToken;
  } else {
    if (!descriptor || !exactKeys(descriptor, [
      "kind", "transactionId", "stopId", "journeyStep", "stage", "storyVisitId",
      "transferVisitId", "narrativeChoiceToken", "attemptOrdinal", "attemptId"
    ]) || descriptor.kind !== "story_transfer"
      || descriptor.transactionId !== transactionId || descriptor.stopId !== scene.stopId
      || descriptor.journeyStep !== journeyStep
      || descriptor.storyVisitId !== `visit:${transactionId}:story`
      || descriptor.transferVisitId !== `visit:${transactionId}:transfer`
      || descriptor.attemptId !== `story-transfer-attempt:${transactionId}:${receipts.length}`
      || storyUses.length || transferUses.length
      || descriptor.attemptOrdinal !== receipts.length
      || !["response_pending", "model_pending"].includes(descriptor.stage)
      || (descriptor.stage === "model_pending" && descriptor.attemptOrdinal !== 3)) {
      throw new Error("pending presentation checkpoint is inconsistent");
    }
    narrativeChoiceToken = descriptor.narrativeChoiceToken;
  }
  if (scene.choice.kind === "narrative_bridge") {
    const branch = resolveNarrativeBranchOutcome(scene.id, narrativeChoiceToken);
    if (!branch) throw new Error("boss story outcome cannot be derived from persisted choice");
  } else if (narrativeChoiceToken !== null) {
    throw new Error("assessed connected text cannot retain a narrative token");
  }
  return { scene, verified, newest, completed: Boolean(newest?.event.correct), narrativeChoiceToken };
}

function payoffFor(verification) {
  if (!verification.completed) {
    return { postDecisionSemanticId: null, storyOutcomeId: null };
  }
  if (verification.scene.choice.kind === "narrative_bridge") {
    const branch = resolveNarrativeBranchOutcome(
      verification.scene.id, verification.narrativeChoiceToken
    );
    return {
      postDecisionSemanticId: branch.postDecisionSemanticId,
      storyOutcomeId: branch.storyOutcomeId
    };
  }
  return {
    postDecisionSemanticId: getSceneVisualSemantics(verification.scene.id).postDecisionSemanticIds[0],
    storyOutcomeId: null
  };
}

function transitionFields({ sceneId, transactionId, verification, revision, phase,
  evidenceEventId = null, correctionRecordId = null, meaningSemanticId = null }) {
  const payoff = payoffFor(verification);
  return {
    kind: "connected_text_presentation_transition",
    sceneId,
    transactionId,
    attemptId: verification.newest.receipt.attemptId,
    evidenceEventId: evidenceEventId || verification.newest.event.id,
    reducerRevision: revision,
    phase,
    correctionRecordId,
    postDecisionSemanticId: phase === "correction" ? null : payoff.postDecisionSemanticId,
    storyOutcomeId: phase === "correction" ? null : payoff.storyOutcomeId,
    meaningSemanticId
  };
}

function installNext(presentation, event, verification, phase, extras = {}) {
  const generation = activePresentation.generation;
  const revision = presentation.reducerRevision + 1;
  const history = deepFreeze([...presentation.history, freezeEvent(event)]);
  const transition = brandedTransition(transitionFields({
    sceneId: presentation.sceneId,
    transactionId: presentation.transactionId,
    verification,
    revision,
    phase,
    ...extras
  }), generation);
  const nextPresentation = brandedState({
    kind: "connected_text_presentation",
    sceneId: presentation.sceneId,
    transactionId: presentation.transactionId,
    attemptId: transition.attemptId,
    phase,
    reducerRevision: revision,
    history
  }, generation);
  activePresentation = {
    generation,
    currentState: nextPresentation,
    currentTransition: transition,
    sceneId: presentation.sceneId,
    transactionId: presentation.transactionId,
    reducerRevision: revision
  };
  return deepFreeze({ nextPresentation, transition });
}

export function beginConnectedTextPresentation({ sceneId, transactionId, state: gameState } = {}) {
  const scene = getConnectedText(sceneId);
  const match = /^story-transfer:(\d+):(s(?:[1-9]|[1-3][0-9]|40))$/u.exec(transactionId || "");
  if (!stringId(sceneId) || !stringId(transactionId) || !scene || !match
    || match[2] !== scene.stopId) {
    throw new Error("connected-text presentation identity is invalid");
  }
  assertCompleteStateShape(gameState);
  verifyCanonicalVisits(gameState, scene, transactionId, Number(match[1]));
  invalidateActive();
  const generation = Object.freeze({});
  const state = brandedState({
    kind: "connected_text_presentation",
    sceneId,
    transactionId,
    attemptId: null,
    phase: "pre_choice",
    reducerRevision: 0,
    history: deepFreeze([])
  }, generation);
  activePresentation = {
    generation,
    currentState: state,
    currentTransition: null,
    sceneId,
    transactionId,
    reducerRevision: 0
  };
  return state;
}

export function reduceConnectedTextPresentation(presentation, event, { state } = {}) {
  assertCurrentState(presentation);
  const shape = eventShape(event);
  if (!shape || event.reducerRevision !== presentation.reducerRevision) {
    throw new Error("connected-text presentation event is invalid");
  }
  const candidateHistory = [...presentation.history, event];
  if (shape === "decision_committed") {
    if (!["pre_choice", "correction"].includes(presentation.phase)) {
      throw new Error("a decision cannot occur in the current presentation phase");
    }
    const verification = verifyConnectedTextHistoryAgainstTask2(state, {
      sceneId: presentation.sceneId,
      transactionId: presentation.transactionId,
      history: candidateHistory
    });
    const phase = verification.completed ? "action" : "correction";
    return installNext(presentation, event, verification, phase, {
      evidenceEventId: event.evidenceEventId,
      correctionRecordId: phase === "correction"
        ? verification.newest.receipt.correctionRecordIds[0] : null
    });
  }
  const verification = verifyConnectedTextHistoryAgainstTask2(state, {
    sceneId: presentation.sceneId,
    transactionId: presentation.transactionId,
    history: presentation.history
  });
  if (!verification.completed) throw new Error("presentation payoff needs a completed Task 2 pair");
  if (shape === "action_completed") {
    if (presentation.phase !== "action") throw new Error("only action may resolve");
    return installNext(presentation, event, verification, "resolved");
  }
  if (presentation.phase !== "resolved") throw new Error("meaning support requires a resolved scene");
  const payoff = payoffFor(verification);
  const post = resolveSceneVisualSemantic(payoff.postDecisionSemanticId);
  const meaning = resolveSceneVisualSemantic(event.meaningSemanticId);
  const support = meaning?.kind === "meaning" ? getMeaningSupport(meaning.wordId) : null;
  if (!post?.meaningSemanticIds.includes(event.meaningSemanticId)
    || !support || support.visualSemanticId !== meaning.id
    || support.answerLeakPolicy !== "post_decision_or_non_assessed_help") {
    throw new Error("requested meaning support is not authorized by the resolved scene");
  }
  return installNext(presentation, event, verification, "meaning_support", {
    meaningSemanticId: event.meaningSemanticId
  });
}

export function checkpointConnectedTextPresentation(presentation) {
  assertCurrentState(presentation);
  return deepFreeze({
    schemaVersion: 1,
    kind: "connected_text_presentation_checkpoint",
    sceneId: presentation.sceneId,
    transactionId: presentation.transactionId,
    history: presentation.history.map(freezeEvent)
  });
}

function assertSerializable(value, seen = new Set()) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (!value || typeof value !== "object" || seen.has(value)
    || ![Object.prototype, Array.prototype].includes(Object.getPrototypeOf(value))
    || Reflect.ownKeys(value).some(key => typeof key === "symbol")
    || Object.getOwnPropertyDescriptors(value)
      && Object.values(Object.getOwnPropertyDescriptors(value)).some(descriptor => descriptor.get || descriptor.set)) {
    throw new Error("presentation checkpoint is not strict serializable data");
  }
  seen.add(value);
  for (const child of Object.values(value)) assertSerializable(child, seen);
  seen.delete(value);
}

function replayPhase(checkpoint, verification) {
  let phase = "pre_choice";
  let meaningSemanticId = null;
  for (const event of checkpoint.history) {
    if (event.type === "decision_committed") {
      const evidence = verification.verified.find(item => item.event.id === event.evidenceEventId);
      phase = evidence.event.correct ? "action" : "correction";
    } else if (event.type === "action_completed" && phase === "action") {
      phase = "resolved";
    } else if (event.type === "meaning_requested" && phase === "resolved") {
      const payoff = payoffFor(verification);
      const post = resolveSceneVisualSemantic(payoff.postDecisionSemanticId);
      if (!post?.meaningSemanticIds.includes(event.meaningSemanticId)) {
        throw new Error("checkpoint meaning request is not authorized");
      }
      phase = "meaning_support";
      meaningSemanticId = event.meaningSemanticId;
    } else {
      throw new Error("presentation checkpoint event order is impossible");
    }
  }
  return { phase, meaningSemanticId };
}

export function rehydrateConnectedTextPresentation(state, checkpoint) {
  assertSerializable(checkpoint);
  if (!exactKeys(checkpoint, ["schemaVersion", "kind", "sceneId", "transactionId", "history"])
    || checkpoint.schemaVersion !== 1
    || checkpoint.kind !== "connected_text_presentation_checkpoint"
    || !stringId(checkpoint.sceneId) || !stringId(checkpoint.transactionId)
    || !Array.isArray(checkpoint.history)) {
    throw new Error("presentation checkpoint shape is invalid");
  }
  checkpoint.history.forEach((event, index) => {
    if (!eventShape(event) || event.reducerRevision !== index) {
      throw new Error("presentation checkpoint revisions are not contiguous");
    }
  });
  const verification = verifyConnectedTextHistoryAgainstTask2(state, {
    sceneId: checkpoint.sceneId,
    transactionId: checkpoint.transactionId,
    history: checkpoint.history
  });
  const replay = replayPhase(checkpoint, verification);
  invalidateActive();
  const generation = Object.freeze({});
  const history = deepFreeze(checkpoint.history.map(freezeEvent));
  let transition = null;
  if (history.length) {
    const newestDecision = [...history].reverse().find(event => event.type === "decision_committed");
    const newest = verification.verified.find(item => item.event.id === newestDecision.evidenceEventId);
    const correctionRecordId = replay.phase === "correction"
      ? newest.receipt.correctionRecordIds[0] : null;
    transition = brandedTransition(transitionFields({
      sceneId: checkpoint.sceneId,
      transactionId: checkpoint.transactionId,
      verification,
      revision: history.length,
      phase: replay.phase,
      evidenceEventId: newestDecision.evidenceEventId,
      correctionRecordId,
      meaningSemanticId: replay.meaningSemanticId
    }), generation);
  }
  const presentation = brandedState({
    kind: "connected_text_presentation",
    sceneId: checkpoint.sceneId,
    transactionId: checkpoint.transactionId,
    attemptId: transition?.attemptId || null,
    phase: replay.phase,
    reducerRevision: history.length,
    history
  }, generation);
  activePresentation = {
    generation,
    currentState: presentation,
    currentTransition: transition,
    sceneId: checkpoint.sceneId,
    transactionId: checkpoint.transactionId,
    reducerRevision: history.length
  };
  return deepFreeze({ presentation, transition });
}

export function closeConnectedTextPresentation(presentation) {
  assertCurrentState(presentation);
  invalidateActive();
  return true;
}

export function isConnectedTextPresentationTransition(value) {
  return Boolean(transitionBrands.has(value)
    && activePresentation
    && value === activePresentation.currentTransition
    && transitionGenerations.get(value) === activePresentation.generation
    && value.sceneId === activePresentation.sceneId
    && value.transactionId === activePresentation.transactionId
    && value.reducerRevision === activePresentation.reducerRevision);
}

export function projectConnectedTextPresentationTransition(value) {
  if (!isConnectedTextPresentationTransition(value)) {
    throw new Error("connected-text transition is not the exact active capability");
  }
  return deepFreeze({
    sceneId: value.sceneId,
    transactionId: value.transactionId,
    attemptId: value.attemptId,
    decisionId: value.evidenceEventId,
    reducerRevision: value.reducerRevision,
    phase: value.phase,
    correctionRecordId: value.correctionRecordId,
    postDecisionSemanticId: value.postDecisionSemanticId,
    storyOutcomeId: value.storyOutcomeId,
    meaningSemanticId: value.meaningSemanticId
  });
}
