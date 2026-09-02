import assert from "node:assert/strict";
import test from "node:test";

import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import { CONTENT_DECK_PLACEMENTS } from "../../src/features/soundSeekers/content/contentDeckBindings.js";
import { createSoundSeekersState, mergeSoundSeekersStates } from "../../src/features/soundSeekers/engine/stateV2.js";
import { recordContentDeckUse, serveContentDeck } from "../../src/features/soundSeekers/engine/contentDeckScheduler.js";
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

function completeCanonicalState() {
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

test("canonical public reducers reach exact whole-state coverage totals", () => {
  const state = completeCanonicalState();
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

test("immutable visit, use, evidence, and receipt conflicts are absorbing", () => {
  const complete = completeCanonicalState();
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
  const state = completeCanonicalState();
  const use = validContentDeckUses(state, "alternatives")
    .find(item => item.visitOwnerId === "s16-alternative");
  const [firstAttemptId, finalAttemptId] = use.attemptReceiptIds;
  const forged = structuredClone(state);
  forged.attemptReceipts[firstAttemptId].completed = true;
  forged.attemptReceipts[firstAttemptId].useIds = [use.useId];
  forged.contentDecks.alternatives.uses[use.useId].attemptReceiptIds = [firstAttemptId];
  delete forged.attemptReceipts[finalAttemptId];
  assert.equal(validAttemptReceipts(forged).length > 0, true,
    "the generic receipt projection can retain the structurally contiguous prefix");
  assert.equal(validContentDeckUses(forged, "alternatives")
    .some(item => item.useId === use.useId), false);
});

test("duplicate receipt dependencies and duplicate visit/action claims fail closed", () => {
  const state = completeCanonicalState();
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
});
