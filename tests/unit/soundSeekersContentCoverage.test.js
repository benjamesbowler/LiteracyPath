import assert from "node:assert/strict";
import test from "node:test";

import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import { CONTENT_DECK_PLACEMENTS } from "../../src/features/soundSeekers/content/contentDeckBindings.js";
import { CONTENT_DECK_CATEGORIES } from "../../src/features/soundSeekers/content/contentDeckCatalogs.js";
import { createSoundSeekersState, mergeSoundSeekersStates } from "../../src/features/soundSeekers/engine/stateV2.js";
import {
  createContentDeckState,
  validContentDeckVisits
} from "../../src/features/soundSeekers/engine/contentDeckState.js";
import {
  recordContentDeckUse,
  rehydrateServedContentInstance,
  serveContentDeck
} from "../../src/features/soundSeekers/engine/contentDeckScheduler.js";
import {
  beginContentPlacementAttempt,
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  commitContentPlacementResponse,
  completeStoryTransferTransaction,
  materializeContentPlacementChallenge,
  materializeStoryTransferChallenge
} from "../../src/features/soundSeekers/engine/contentDeckTransactions.js";
import {
  coverageStatus,
  deriveContentDeckRecordStats,
  validAttemptReceipts,
  validContentDeckUses
} from "../../src/features/soundSeekers/engine/contentCoverage.js";

export function completeCanonicalContentCoverageState() {
  let state = createSoundSeekersState();
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    for (const opportunity of expedition.heartWordOpportunities) {
      const binding = opportunity.contentBinding;
      const served = serveContentDeck(state.contentDecks, {
        binding, visitId: `coverage:${binding.visitOwnerId}`,
        stopId: expedition.stopId, journeyStep: expedition.stopIndex, seed: expedition.stopIndex
      });
      state = { ...state, contentDecks: recordContentDeckUse(served.nextState, served, binding) };
      if (opportunity.id === "s6-heart-1") {
        const shared = expedition.phases.find(phase => phase.id === "s6-primary").contentBinding;
        state = { ...state, contentDecks: recordContentDeckUse(state.contentDecks, served, shared) };
      }
    }
    const begun = beginStoryTransferTransaction(state, {
      stopId: expedition.stopId, journeyStep: expedition.stopIndex, seed: expedition.stopIndex
    });
    const transactionId = begun.transaction.transactionId;
    state = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId, narrativeChoiceToken: expedition.transfer.boss ? `narrative-${expedition.stopId}` : null
    });
    const challenge = materializeStoryTransferChallenge(state, { transactionId });
    state = completeStoryTransferTransaction(state, {
      transactionId, challenge, response: { kind: "literacy-answer", token: challenge.expectedToken },
      audio: { status: "unavailable" }, at: `2026-09-02T04:${String(expedition.stopIndex).padStart(2, "0")}:00.000Z`,
      sessionDay: "2026-09-02"
    }).nextState;
  }
  for (const placement of CONTENT_DECK_PLACEMENTS) {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === placement.stopId);
    const served = serveContentDeck(state.contentDecks, {
      binding: placement.contentBinding, visitId: `coverage:${placement.placementId}`,
      stopId: placement.stopId, journeyStep: expedition.stopIndex, seed: expedition.stopIndex
    });
    state = { ...state, contentDecks: served.nextState };
    state = beginContentPlacementAttempt(state, {
      placementId: placement.placementId, visitId: served.visitId
    }).nextState;
    let completed = false;
    while (!completed) {
      const challenge = materializeContentPlacementChallenge(state, {
        placementId: placement.placementId, visitId: served.visitId
      });
      const response = placement.category === "morphology"
        ? { challengeId: challenge.challengeId, kind: "non-recording-complete",
          action: "introduce_word_ending" }
        : { kind: "literacy-answer", token: challenge.expectedToken };
      const result = commitContentPlacementResponse(state, {
        placementId: placement.placementId, visitId: served.visitId, challenge, response,
        audio: { status: "unavailable" },
        at: `2026-09-02T05:${String(challenge.targetOrdinal || 0).padStart(2, "0")}:00.000Z`,
        sessionDay: "2026-09-02"
      });
      state = result.nextState;
      completed = result.completed;
    }
  }
  return state;
}

export function structurallyValidUnauthorisedContentDeckFixture() {
  const contentDecks = createContentDeckState();
  const evidence = [];
  const attemptReceipts = {};
  const entryIds = {};
  const recordIds = {};
  const makeVisit = (category, overrides = {}) => {
    const visitId = `unauthorised:${category}:visit`;
    const visitOwnerId = `unauthorised:${category}:owner`;
    const actionUseId = `unauthorised:${category}:action`;
    const recordId = `unauthorised:${category}:record`;
    entryIds[category] = { visitId, useId: `unauthorised:${category}:use` };
    recordIds[category] = recordId;
    return {
      kind: "visit",
      visitId,
      contentInstanceId: `unauthorised:${category}:instance`,
      visitOwnerId,
      ownerActionUseId: actionUseId,
      category,
      slotId: `unauthorised:${category}:slot`,
      recordId,
      contentId: `unauthorised:${category}:content`,
      targetId: null,
      wordId: null,
      stopId: "s1",
      journeyStep: 1,
      ...overrides
    };
  };
  const makeUse = (category, visit, overrides = {}) => ({
    kind: "use",
    useId: entryIds[category].useId,
    visitId: visit.visitId,
    contentInstanceId: visit.contentInstanceId,
    visitOwnerId: visit.visitOwnerId,
    actionUseId: visit.ownerActionUseId,
    category,
    slotId: visit.slotId,
    recordId: visit.recordId,
    journeyStep: visit.journeyStep,
    ...overrides
  });
  const makeEvent = attemptId => {
    const event = {
      id: `${attemptId}:0`,
      at: "2026-09-02T00:00:00.000Z",
      evidenceKind: "practice",
      correct: true,
      supportLevel: 0,
      revealed: false
    };
    evidence.push(event);
    return event;
  };
  const makeReceipt = ({ attemptId, operation, subjectId, useIds, eventIds }) => {
    attemptReceipts[attemptId] = {
      kind: "attempt_receipt",
      attemptId,
      operation,
      subjectId,
      decisionOrdinal: 0,
      attemptOrdinal: 0,
      inputSha256: "a".repeat(64),
      completed: true,
      correctionRecordIds: [],
      eventIds,
      useIds
    };
  };

  const heartVisit = makeVisit("heartWords", {
    targetId: "unauthorised:heartWords:target",
    wordId: "unauthorised-heart-word",
    ownerActivityType: "recognition"
  });
  const heartUse = makeUse("heartWords", heartVisit, { activityType: "recognition" });
  contentDecks.heartWords.visits[heartVisit.visitId] = heartVisit;
  contentDecks.heartWords.uses[heartUse.useId] = heartUse;

  for (const category of ["alternatives", "morphology"]) {
    const visit = makeVisit(category, category === "morphology"
      ? { wordId: "unauthorised-morphology-word" }
      : {});
    const subjectId = visit.visitOwnerId;
    const attemptId = `content-placement-attempt:${visit.visitId}:${subjectId}:0:0`;
    const use = makeUse(category, visit, { attemptReceiptIds: [attemptId] });
    const eventIds = category === "alternatives" ? [makeEvent(attemptId).id] : [];
    makeReceipt({
      attemptId,
      operation: "content_placement",
      subjectId,
      useIds: [use.useId],
      eventIds
    });
    contentDecks[category].visits[visit.visitId] = visit;
    contentDecks[category].uses[use.useId] = use;
  }

  const transactionId = "unauthorised:story-transfer:transaction";
  const storyVisit = makeVisit("stories", {
    targetId: "unauthorised:story:target"
  });
  const transferVisit = makeVisit("transfer", {
    targetId: "unauthorised:transfer:target"
  });
  const attemptId = `story-transfer-attempt:${transactionId}:0`;
  const event = makeEvent(attemptId);
  const common = {
    attemptReceiptIds: [attemptId],
    transactionId,
    evidenceEventId: event.id,
    narrativeChoiceToken: null
  };
  const storyUse = makeUse("stories", storyVisit, {
    ...common,
    pairedUseId: entryIds.transfer.useId
  });
  const transferUse = makeUse("transfer", transferVisit, {
    ...common,
    pairedUseId: entryIds.stories.useId
  });
  contentDecks.stories.visits[storyVisit.visitId] = storyVisit;
  contentDecks.stories.uses[storyUse.useId] = storyUse;
  contentDecks.transfer.visits[transferVisit.visitId] = transferVisit;
  contentDecks.transfer.uses[transferUse.useId] = transferUse;
  makeReceipt({
    attemptId,
    operation: "story_transfer",
    subjectId: transactionId,
    useIds: [storyUse.useId, transferUse.useId],
    eventIds: [event.id]
  });

  return { contentDecks, evidence, attemptReceipts, entryIds, recordIds };
}

test("canonical public reducers reach exact whole-state coverage totals", () => {
  const state = completeCanonicalContentCoverageState();
  assert.deepEqual(coverageStatus(state), {
    complete: true,
    categories: {
      heartWords: { coveredRecordCount: 60, totalRecordCount: 60 },
      stories: { coveredRecordCount: 40, totalRecordCount: 40 },
      alternatives: { coveredRecordCount: 4, totalRecordCount: 4 },
      morphology: { coveredRecordCount: 1, totalRecordCount: 1 },
      transfer: { coveredRecordCount: 40, totalRecordCount: 40 }
    }
  });
  assert.equal(validContentDeckUses(state, "heartWords").length, 81);
  assert.deepEqual(deriveContentDeckRecordStats(state, "heartWords", "hw:a"), {
    firstServedStep: 1, lastServedStep: 2, useCount: 4,
    activityCounts: {
      recognition: 1, heart_part_mapping: 1, encoding: 1, sentence_use: 1
    },
    activityLastServed: {
      recognition: 1, heart_part_mapping: 1, encoding: 2, sentence_use: 2
    }
  });
});

test("structurally valid unauthorised records survive sync without earning product coverage", () => {
  const unauthorised = structurallyValidUnauthorisedContentDeckFixture();
  assert.deepEqual(Object.keys(unauthorised), [
    "contentDecks", "evidence", "attemptReceipts", "entryIds", "recordIds"
  ]);
  for (const category of CONTENT_DECK_CATEGORIES) {
    const { visitId } = unauthorised.entryIds[category];
    assert.equal(validContentDeckVisits(unauthorised.contentDecks, category).length, 1, category);
    assert.equal(validContentDeckUses(unauthorised, category).length, 1, category);
    assert.equal(deriveContentDeckRecordStats(
      unauthorised, category, unauthorised.recordIds[category]
    ).useCount, 1, category);
    assert.equal(rehydrateServedContentInstance(unauthorised.contentDecks, {
      category,
      visitId
    }), null, `${category}: invented identity must not rehydrate`);
  }
  assert.deepEqual(coverageStatus(unauthorised), {
    complete: false,
    categories: {
      heartWords: { coveredRecordCount: 0, totalRecordCount: 60 },
      stories: { coveredRecordCount: 0, totalRecordCount: 40 },
      alternatives: { coveredRecordCount: 0, totalRecordCount: 4 },
      morphology: { coveredRecordCount: 0, totalRecordCount: 1 },
      transfer: { coveredRecordCount: 0, totalRecordCount: 40 }
    }
  });

  const alternativeReceipt = Object.values(unauthorised.attemptReceipts)
    .find(receipt => receipt.subjectId === "unauthorised:alternatives:owner");
  const alternativeEvent = unauthorised.evidence
    .find(event => event.id === alternativeReceipt.eventIds[0]);
  const missingDependency = {
    ...unauthorised,
    evidence: unauthorised.evidence.filter(event => event.id !== alternativeEvent.id)
  };
  assert.equal(validContentDeckUses(missingDependency, "alternatives").length, 0);
  const repaired = mergeSoundSeekersStates(
    createSoundSeekersState(missingDependency),
    createSoundSeekersState({ evidence: [alternativeEvent] })
  );
  assert.equal(validContentDeckUses(repaired, "alternatives").length, 1,
    "an exact later dependency repairs raw structural statistics");
  assert.equal(coverageStatus(repaired).categories.alternatives.coveredRecordCount, 0);

  const canonical = completeCanonicalContentCoverageState();
  const merged = mergeSoundSeekersStates(canonical, createSoundSeekersState(unauthorised));
  for (const category of CONTENT_DECK_CATEGORIES) {
    const { visitId, useId } = unauthorised.entryIds[category];
    assert.deepEqual(merged.contentDecks[category].visits[visitId],
      createSoundSeekersState(unauthorised).contentDecks[category].visits[visitId]);
    assert.deepEqual(merged.contentDecks[category].uses[useId],
      createSoundSeekersState(unauthorised).contentDecks[category].uses[useId]);
    assert.equal(deriveContentDeckRecordStats(
      merged, category, unauthorised.recordIds[category]
    ).useCount, 1);
  }
  assert.equal(coverageStatus(merged).complete, true,
    "invented structural records cannot inflate or break canonical product coverage");
});

test("receipt evidence deduplicates only after shared activity normalization", () => {
  const fixture = structurallyValidUnauthorisedContentDeckFixture();
  const receipt = Object.values(fixture.attemptReceipts)
    .find(item => item.subjectId === "unauthorised:alternatives:owner");
  const eventIndex = fixture.evidence.findIndex(event => event.id === receipt.eventIds[0]);
  const baseEvent = fixture.evidence[eventIndex];

  const nonHeart = structuredClone(fixture);
  nonHeart.evidence[eventIndex] = {
    ...baseEvent,
    domain: "connected_text_transfer"
  };
  nonHeart.evidence.push({
    ...baseEvent,
    domain: "connected_text_transfer",
    activityType: "encoding"
  });
  assert.equal(validAttemptReceipts(nonHeart)
    .some(item => item.attemptId === receipt.attemptId), true,
  "illegal non-heart activity is removed before duplicate comparison");

  const heartAlias = structuredClone(fixture);
  heartAlias.evidence[eventIndex] = {
    ...baseEvent,
    domain: "heart_word_mapping",
    activityType: "recognition"
  };
  heartAlias.evidence.push({
    ...baseEvent,
    domain: "heart_word_mapping",
    activityType: "\trecognition\n"
  });
  assert.equal(validAttemptReceipts(heartAlias)
    .some(item => item.attemptId === receipt.attemptId), true,
  "heart activity whitespace aliases normalize before duplicate comparison");
});

test("same ordinals are isolated by canonical visit and cannot poison another visit", () => {
  const state = completeCanonicalContentCoverageState();
  const original = validAttemptReceipts(state).find(receipt =>
    receipt.subjectId === "s16-alternative"
    && receipt.decisionOrdinal === 0
    && receipt.attemptOrdinal === 0);
  const duplicateAttemptId =
    "content-placement-attempt:duplicate:s16-alternative:s16-alternative:0:0";
  const duplicateEvent = {
    ...state.evidence.find(event => event.id === original.eventIds[0]),
    id: `${duplicateAttemptId}:0`
  };
  const forged = structuredClone(state);
  forged.evidence.push(duplicateEvent);
  forged.attemptReceipts[duplicateAttemptId] = {
    ...original,
    attemptId: duplicateAttemptId,
    eventIds: [duplicateEvent.id]
  };
  const isolated = validAttemptReceipts(forged)
    .filter(receipt => receipt.subjectId === "s16-alternative");
  assert.equal(isolated.length, validAttemptReceipts(state)
    .filter(receipt => receipt.subjectId === "s16-alternative").length + 1,
  "the separate visit retains its own ordinal-zero chain without joining the real visit");
  assert.equal(validContentDeckUses(forged, "alternatives")
    .some(use => use.visitOwnerId === "s16-alternative"), true);
});

test("two route placement uses bind receipt chains to their exact visit", () => {
  let state = completeCanonicalContentCoverageState();
  const placement = CONTENT_DECK_PLACEMENTS.find(item => item.placementId === "s16-alternative");
  const visitId = "coverage:route-2:s16-alternative";
  const served = serveContentDeck(state.contentDecks, {
    binding: placement.contentBinding,
    visitId,
    stopId: "s16",
    journeyStep: 56,
    seed: 56
  });
  state = beginContentPlacementAttempt({ ...state, contentDecks: served.nextState }, {
    placementId: placement.placementId,
    visitId
  }).nextState;
  let completed = false;
  while (!completed) {
    const challenge = materializeContentPlacementChallenge(state, {
      placementId: placement.placementId, visitId
    });
    const result = commitContentPlacementResponse(state, {
      placementId: placement.placementId,
      visitId,
      challenge,
      response: { kind: "literacy-answer", token: challenge.expectedToken },
      audio: { status: "completed" },
      at: `2026-09-02T09:0${challenge.targetOrdinal}:00.000Z`,
      sessionDay: "2026-09-02"
    });
    state = result.nextState;
    completed = result.completed;
  }
  const uses = validContentDeckUses(state, "alternatives")
    .filter(use => use.visitOwnerId === placement.placementId);
  assert.equal(uses.length, 2);
  assert.deepEqual(uses.map(use => use.visitId), [
    "coverage:s16-alternative", visitId
  ]);

  const crossed = structuredClone(state);
  crossed.contentDecks.alternatives.uses[uses[1].useId].attemptReceiptIds =
    [...uses[0].attemptReceiptIds];
  assert.equal(validContentDeckUses(crossed, "alternatives")
    .filter(use => use.visitOwnerId === placement.placementId).length, 1);

  const malformed = structuredClone(state);
  const secondAttemptId = uses[1].attemptReceiptIds[0];
  const malformedId = secondAttemptId.replace("content-placement-attempt:", "bad-placement-attempt:");
  malformed.attemptReceipts[malformedId] = {
    ...malformed.attemptReceipts[secondAttemptId], attemptId: malformedId
  };
  delete malformed.attemptReceipts[secondAttemptId];
  assert.equal(validContentDeckUses(malformed, "alternatives")
    .filter(use => use.visitOwnerId === placement.placementId).length, 1);
});

test("immutable visit, use, evidence, and receipt conflicts are absorbing", () => {
  const complete = completeCanonicalContentCoverageState();
  const visitId = Object.keys(complete.contentDecks.alternatives.visits)[0];
  const visit = complete.contentDecks.alternatives.visits[visitId];
  const conflicting = structuredClone(complete);
  conflicting.contentDecks.alternatives.visits[visitId] = { ...visit, recordId: "alternative:forged" };
  const forward = mergeSoundSeekersStates(complete, conflicting);
  const reverse = mergeSoundSeekersStates(conflicting, complete);
  assert.deepEqual(forward, reverse);
  assert.deepEqual(forward.contentDecks.alternatives.visits[visitId], {
    kind: "visit_conflict", visitId
  });
  assert.equal(validContentDeckUses(forward, "alternatives").length, 3);
  assert.equal(mergeSoundSeekersStates(forward, complete).contentDecks.alternatives.visits[visitId].kind,
    "visit_conflict");
});

test("older v2 saves gain all five empty deck branches and the answer-safe receipt ledger", () => {
  const old = createSoundSeekersState();
  delete old.contentDecks.morphology;
  delete old.contentDecks.transfer;
  delete old.attemptReceipts;
  const normalized = mergeSoundSeekersStates(old, old);
  assert.deepEqual(Object.keys(normalized.contentDecks), [
    "heartWords", "stories", "alternatives", "morphology", "transfer"
  ]);
  assert.deepEqual(normalized.contentDecks.morphology, { visits: {}, uses: {} });
  assert.deepEqual(normalized.attemptReceipts, {});
});

test("a canonical alternative use requires every authored target receipt", () => {
  const state = completeCanonicalContentCoverageState();
  const use = validContentDeckUses(state, "alternatives")
    .find(item => item.visitOwnerId === "s16-alternative");
  const [firstAttemptId, finalAttemptId] = use.attemptReceiptIds;
  const forged = structuredClone(state);
  forged.attemptReceipts[firstAttemptId].completed = true;
  forged.attemptReceipts[firstAttemptId].useIds = [use.useId];
  forged.contentDecks.alternatives.uses[use.useId].attemptReceiptIds = [firstAttemptId];
  delete forged.attemptReceipts[finalAttemptId];
  assert.equal(validAttemptReceipts(forged)
    .some(receipt => receipt.attemptId === firstAttemptId), false,
  "a known non-final alternative target cannot claim completion or own the final use");
  assert.equal(validContentDeckUses(forged, "alternatives")
    .some(item => item.useId === use.useId), false);
});

test("duplicate receipt dependencies and duplicate visit/action claims fail closed", () => {
  const state = completeCanonicalContentCoverageState();
  const alternativeUse = validContentDeckUses(state, "alternatives")[0];
  const finalReceiptId = alternativeUse.attemptReceiptIds.at(-1);
  const duplicateDependencies = structuredClone(state);
  duplicateDependencies.attemptReceipts[finalReceiptId].useIds = [
    alternativeUse.useId, alternativeUse.useId
  ];
  assert.equal(duplicateDependencies.attemptReceipts[finalReceiptId].kind, "attempt_receipt");
  const normalized = mergeSoundSeekersStates(duplicateDependencies, duplicateDependencies);
  assert.equal(normalized.attemptReceipts[finalReceiptId].kind, "attempt_receipt_conflict");
  assert.equal(validContentDeckUses(normalized, "alternatives").length, 3);

  const heartUse = validContentDeckUses(state, "heartWords")[0];
  const duplicateClaim = structuredClone(state);
  const duplicateUseId = `${heartUse.useId}:duplicate`;
  duplicateClaim.contentDecks.heartWords.uses[duplicateUseId] = {
    ...heartUse,
    useId: duplicateUseId
  };
  assert.equal(validContentDeckUses(duplicateClaim, "heartWords")
    .filter(item => item.visitId === heartUse.visitId
      && item.actionUseId === heartUse.actionUseId).length, 0);

  const heartUsesByVisit = Map.groupBy(
    validContentDeckUses(state, "heartWords"), use => use.visitId);
  const [sharedVisitId, sharedVisitUses] = [...heartUsesByVisit]
    .find(([, uses]) => uses.length === 2);
  const sharedVisit = state.contentDecks.heartWords.visits[sharedVisitId];
  const ownerUseId = `${sharedVisitId}:${sharedVisit.ownerActionUseId}`;
  const ownerUse = state.contentDecks.heartWords.uses[ownerUseId];
  const duplicatedOwner = structuredClone(state);
  duplicatedOwner.contentDecks.heartWords.uses[`${ownerUseId}:duplicate`] = {
    ...ownerUse,
    useId: `${ownerUseId}:duplicate`
  };
  assert.equal(validContentDeckUses(duplicatedOwner, "heartWords")
    .filter(use => use.visitId === sharedVisitId).length, 0,
  "a shared activity cannot outlive a duplicate-conflicted owner claim");
  assert.equal(sharedVisitUses.some(use => use.actionUseId !== sharedVisit.ownerActionUseId), true);

  const wrongOwnerActivity = structuredClone(state);
  wrongOwnerActivity.contentDecks.heartWords.uses[ownerUseId].activityType =
    ownerUse.activityType === "recognition" ? "encoding" : "recognition";
  assert.equal(validContentDeckUses(wrongOwnerActivity, "heartWords")
    .filter(use => use.visitId === sharedVisitId).length, 0,
  "an owner activity mismatch invalidates both owner and dependent shared use");
  assert.equal(coverageStatus(wrongOwnerActivity).categories.heartWords.coveredRecordCount < 60, true);

  const invalidParentClaim = structuredClone(state);
  invalidParentClaim.contentDecks.alternatives.uses[`${alternativeUse.useId}:orphan-claim`] = {
    ...alternativeUse,
    useId: `${alternativeUse.useId}:orphan-claim`,
    slotId: "tampered-slot"
  };
  assert.equal(validContentDeckUses(invalidParentClaim, "alternatives")
    .some(use => use.useId === alternativeUse.useId), false,
  "an invalid-parent duplicate action claim must poison the canonical claim");

  const storyUse = validContentDeckUses(state, "stories")[0];
  const transferPair = state.contentDecks.transfer.uses[storyUse.pairedUseId];
  const duplicatedPair = structuredClone(state);
  duplicatedPair.contentDecks.transfer.uses[`${transferPair.useId}:duplicate`] = {
    ...transferPair,
    useId: `${transferPair.useId}:duplicate`
  };
  assert.equal(validContentDeckUses(duplicatedPair, "stories")
    .some(use => use.useId === storyUse.useId), false,
  "a composite half cannot survive a duplicate-conflicted reciprocal claim");
  assert.equal(validContentDeckUses(duplicatedPair, "transfer")
    .some(use => use.useId === transferPair.useId), false);

  const mismatchedPairStop = structuredClone(state);
  mismatchedPairStop.contentDecks.transfer.visits[transferPair.visitId].stopId = "s2";
  assert.equal(validContentDeckUses(mismatchedPairStop, "stories")
    .some(use => use.useId === storyUse.useId), false,
  "reciprocal parent visits must belong to the same stop");

  const mismatchedPairJourney = structuredClone(state);
  mismatchedPairJourney.contentDecks.transfer.uses[transferPair.useId].journeyStep += 1;
  assert.equal(validContentDeckUses(mismatchedPairJourney, "stories")
    .some(use => use.useId === storyUse.useId), false,
  "the reciprocal use must match its own parent journey");

  const s16Use = validContentDeckUses(state, "alternatives")
    .find(item => item.visitOwnerId === "s16-alternative");
  const s16Receipt = state.attemptReceipts[s16Use.attemptReceiptIds.at(-1)];
  const s16Event = state.evidence.find(event => event.id === s16Receipt.eventIds[0]);
  const s28Use = validContentDeckUses(state, "alternatives")
    .find(item => item.visitOwnerId === "s28-alternative");
  const poisonedOwnership = structuredClone(state);
  const s28ReceiptId = s28Use.attemptReceiptIds.at(-1);
  poisonedOwnership.attemptReceipts[s28ReceiptId].useIds = [s16Use.useId];
  const validReceiptIds = new Set(validAttemptReceipts(poisonedOwnership)
    .map(receipt => receipt.attemptId));
  assert.equal(validReceiptIds.has(s16Use.attemptReceiptIds.at(-1)), false,
    "every receipt sharing a use claim must fail closed");
  assert.equal(validReceiptIds.has(s28ReceiptId), false,
    "the competing receipt must also fail closed");
  assert.equal(validContentDeckUses(poisonedOwnership, "alternatives")
    .some(item => item.useId === s16Use.useId), false);

  const closedIntermediate = structuredClone(state);
  const intermediateReceiptId = s16Use.attemptReceiptIds[0];
  closedIntermediate.attemptReceipts[intermediateReceiptId].completed = true;
  assert.equal(validAttemptReceipts(closedIntermediate)
    .some(receipt => receipt.attemptId === intermediateReceiptId), false,
  "a correct zero-use intermediate receipt cannot claim completion");

  const eventBearingMorphology = structuredClone(state);
  const morphologyUseForShape = validContentDeckUses(state, "morphology")[0];
  const morphologyReceiptId = morphologyUseForShape.attemptReceiptIds[0];
  const forgedMorphologyEvent = {
    ...s16Event,
    id: `${morphologyReceiptId}:0`,
    correct: true,
    supportLevel: 0,
    revealed: false
  };
  eventBearingMorphology.evidence.push(forgedMorphologyEvent);
  eventBearingMorphology.attemptReceipts[morphologyReceiptId].eventIds = [
    forgedMorphologyEvent.id
  ];
  assert.equal(validAttemptReceipts(eventBearingMorphology)
    .some(receipt => receipt.attemptId === morphologyReceiptId), false,
  "a morphology completion must remain the exact zero-event exposure shape");

  const morphologyUse = validContentDeckUses(state, "morphology")[0];
  const crossCategoryDuplicate = structuredClone(state);
  crossCategoryDuplicate.contentDecks.alternatives.uses[morphologyUse.useId] = {
    ...morphologyUse,
    category: "alternatives"
  };
  assert.equal(validAttemptReceipts(crossCategoryDuplicate)
    .some(receipt => receipt.useIds.includes(morphologyUse.useId)), false,
  "a duplicate use id in another category must invalidate every receipt claimant");
  assert.equal(validContentDeckUses(crossCategoryDuplicate, "morphology").length, 0);

  const duplicateEvidence = structuredClone(state);
  duplicateEvidence.evidence.push(structuredClone(s16Event));
  assert.equal(validAttemptReceipts(duplicateEvidence)
    .some(receipt => receipt.attemptId === s16Receipt.attemptId), true,
  "byte-identical duplicate evidence is idempotent like the SQL evidence union");

  const divergentEvidence = structuredClone(duplicateEvidence);
  divergentEvidence.evidence.at(-1).correct = !s16Event.correct;
  assert.equal(validAttemptReceipts(divergentEvidence)
    .some(receipt => receipt.attemptId === s16Receipt.attemptId), false,
  "divergent evidence with one identity is an absorbing conflict");

  const conflictEvidence = structuredClone(state);
  conflictEvidence.evidence.push({
    id: s16Event.id,
    at: s16Event.at,
    evidenceKind: "conflict",
    conflicted: true
  });
  assert.equal(validAttemptReceipts(conflictEvidence)
    .some(receipt => receipt.attemptId === s16Receipt.attemptId), false,
  "an existing evidence conflict marker remains absorbing");
});
