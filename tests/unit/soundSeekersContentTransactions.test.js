import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import { CONTENT_DECK_PLACEMENTS } from "../../src/features/soundSeekers/content/contentDeckBindings.js";
import { getContentDeckCatalogRecord } from "../../src/features/soundSeekers/content/contentDeckCatalogs.js";
import { createSoundSeekersState, normalizeSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";
import { serveContentDeck } from "../../src/features/soundSeekers/engine/contentDeckScheduler.js";
import { evidenceIsIndependent } from "../../src/features/soundSeekers/engine/evidence.js";
import { validAttemptReceipts, validContentDeckUses } from "../../src/features/soundSeekers/engine/contentCoverage.js";
import {
  beginContentPlacementAttempt,
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  commitContentPlacementResponse,
  completeContentPlacementCorrectionModel,
  completeStoryTransferCorrectionModel,
  completeStoryTransferTransaction,
  materializeBossTransferChallenge,
  materializeContentPlacementChallenge,
  materializeStoryTransferChallenge,
  projectBossTransferOptionsForChild,
  resumeContentPlacementAttempt,
  resumeStoryTransferTransaction
} from "../../src/features/soundSeekers/engine/contentDeckTransactions.js";

const audio = { status: "completed" };

function startPlacement(placementId) {
  const placement = CONTENT_DECK_PLACEMENTS.find(item => item.placementId === placementId);
  const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === placement.stopId);
  const served = serveContentDeck(createSoundSeekersState().contentDecks, {
    binding: placement.contentBinding, visitId: `visit:${placementId}`,
    stopId: placement.stopId, journeyStep: expedition.stopIndex, seed: expedition.stopIndex
  });
  const state = { ...createSoundSeekersState(), contentDecks: served.nextState };
  return { placement, served, ...beginContentPlacementAttempt(state, {
    placementId, visitId: served.visitId
  }) };
}

function placementInput(state, placementId, visitId, challenge, token, at) {
  return {
    placementId, visitId, challenge,
    response: { kind: "literacy-answer", token }, audio, at, sessionDay: at.slice(0, 10)
  };
}

test("placement actions commit one response at a time and only the final target creates a use", () => {
  for (const placement of CONTENT_DECK_PLACEMENTS) {
    const run = startPlacement(placement.placementId);
    let state = run.nextState;
    assert.deepEqual(Object.keys(state.checkpoint.contentPlacement).sort(), [
      "attemptId", "attemptOrdinal", "category", "journeyStep", "kind", "placementId",
      "stage", "stopId", "targetOrdinal", "visitId"
    ]);
    if (placement.category === "morphology") {
      const challenge = materializeContentPlacementChallenge(state, {
        placementId: placement.placementId, visitId: run.served.visitId
      });
      const result = commitContentPlacementResponse(state, {
        placementId: placement.placementId, visitId: run.served.visitId, challenge,
        response: { challengeId: challenge.challengeId, kind: "non-recording-complete",
          action: "introduce_word_ending" }, audio: { status: "unavailable" },
        at: "2026-09-02T00:00:00.000Z", sessionDay: "2026-09-02"
      });
      assert.equal(result.event, null);
      assert.equal(validContentDeckUses(result.nextState, "morphology").length, 1);
      assert.equal(validAttemptReceipts(result.nextState).length, 1);
      continue;
    }
    const first = materializeContentPlacementChallenge(state, {
      placementId: placement.placementId, visitId: run.served.visitId
    });
    const wrongToken = first.optionTokens.find(token => token !== first.expectedToken);
    const wrong = commitContentPlacementResponse(state,
      placementInput(state, placement.placementId, run.served.visitId, first, wrongToken,
        "2026-09-02T00:00:00.000Z"));
    assert.equal(wrong.event.correct, false);
    assert.equal(wrong.outcome, "retry");
    assert.equal(typeof wrong.correction.correctionRecordId, "string");
    assert.equal(Object.hasOwn(wrong.correction, "id"), false);
    assert.equal(validContentDeckUses(wrong.nextState, "alternatives").length, 0);
    state = normalizeSoundSeekersState(JSON.parse(JSON.stringify(wrong.nextState)));
    let result;
    while (!result?.completed) {
      const challenge = materializeContentPlacementChallenge(state, {
        placementId: placement.placementId, visitId: run.served.visitId
      });
      result = commitContentPlacementResponse(state,
        placementInput(state, placement.placementId, run.served.visitId, challenge,
          challenge.expectedToken, `2026-09-02T00:0${challenge.targetOrdinal + 1}:00.000Z`));
      state = result.nextState;
    }
    assert.equal(validContentDeckUses(state, "alternatives").length, 1);
    assert.equal(validAttemptReceipts(state).length, placement.challengeTargetIds.length + 1);
  }
});

test("a third placement miss requires one model transition and later success is revealed", () => {
  const run = startPlacement("s16-alternative");
  const identity = { placementId: run.placement.placementId, visitId: run.served.visitId };
  let state = run.nextState;
  for (let miss = 0; miss < 3; miss += 1) {
    const challenge = materializeContentPlacementChallenge(state, identity);
    const result = commitContentPlacementResponse(state,
      placementInput(state, identity.placementId, identity.visitId, challenge,
        challenge.optionTokens.find(token => token !== challenge.expectedToken),
        `2026-09-02T01:00:0${miss}.000Z`));
    state = normalizeSoundSeekersState(JSON.parse(JSON.stringify(result.nextState)));
  }
  assert.equal(state.checkpoint.contentPlacement.stage, "model_pending");
  assert.throws(() => materializeContentPlacementChallenge(state, identity), /model/i);
  const modeled = completeContentPlacementCorrectionModel(state, identity);
  assert.equal(modeled.attempt.supportLevel, 3);
  assert.equal(modeled.attempt.revealed, true);
  assert.throws(() => completeContentPlacementCorrectionModel(modeled.nextState, identity), /model|stage/i);
  const success = commitContentPlacementResponse(modeled.nextState,
    placementInput(modeled.nextState, identity.placementId, identity.visitId, modeled.challenge,
      modeled.challenge.expectedToken, "2026-09-02T01:00:04.000Z"));
  assert.equal(success.event.supportLevel, 3);
  assert.equal(success.event.revealed, true);
  assert.equal(evidenceIsIndependent(success.event), false);
});

test("all forty story transfers create truthful reciprocal pairs with private boss choices", () => {
  let state = createSoundSeekersState();
  let connected = 0;
  let boss = 0;
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const begun = beginStoryTransferTransaction(state, {
      stopId: expedition.stopId, journeyStep: expedition.stopIndex, seed: expedition.stopIndex
    });
    const transactionId = begun.transaction.transactionId;
    state = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId,
      narrativeChoiceToken: expedition.transfer.boss ? `narrative-${expedition.stopId}` : null
    });
    const challenge = materializeStoryTransferChallenge(state, { transactionId });
    if (expedition.transfer.boss) {
      boss += 1;
      assert.strictEqual(materializeBossTransferChallenge(state, { transactionId }), challenge);
      const record = getContentDeckCatalogRecord("transfer", `transfer:${expedition.stopId}`);
      assert.deepEqual(projectBossTransferOptionsForChild(state, { transactionId }),
        record.bossDecision.options);
    } else {
      connected += 1;
      assert.equal(Object.hasOwn(challenge, "wordId"), false);
      assert.equal(Object.hasOwn(challenge, "position"), false);
      assert.equal(Object.hasOwn(challenge, "bossTransferId"), false);
      assert.equal(challenge.connectedTextId, expedition.connectedTextId);
    }
    const result = completeStoryTransferTransaction(state, {
      transactionId, challenge, response: { kind: "literacy-answer", token: challenge.expectedToken },
      audio: { status: "unavailable" }, at: `2026-09-02T02:${String(expedition.stopIndex).padStart(2, "0")}:00.000Z`,
      sessionDay: "2026-09-02"
    });
    assert.equal(result.completed, true);
    state = result.nextState;
  }
  assert.deepEqual([connected, boss], [32, 8]);
  assert.equal(validContentDeckUses(state, "stories").length, 40);
  assert.equal(validContentDeckUses(state, "transfer").length, 40);
  assert.equal(validAttemptReceipts(state).length, 40);
});

test("story correction replay rejects impossible history and consumes the third-miss model once", () => {
  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const transactionId = begun.transaction.transactionId;
  let state = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId, narrativeChoiceToken: null
  });
  assert.throws(() => completeStoryTransferCorrectionModel(state, { transactionId }), /model|third|stage/i);
  for (let miss = 0; miss < 3; miss += 1) {
    const challenge = materializeStoryTransferChallenge(state, { transactionId });
    const result = completeStoryTransferTransaction(state, {
      transactionId, challenge,
      response: { kind: "literacy-answer",
        token: challenge.optionTokens.find(token => token !== challenge.expectedToken) },
      audio: { status: "unavailable" }, at: `2026-09-02T03:00:0${miss}.000Z`,
      sessionDay: "2026-09-02"
    });
    state = result.nextState;
  }
  assert.equal(state.checkpoint.storyTransfer.stage, "model_pending");
  const modeled = completeStoryTransferCorrectionModel(state, { transactionId });
  assert.equal(modeled.attempt.supportLevel, 3);
  assert.equal(resumeStoryTransferTransaction(modeled.nextState, { transactionId }).attempt.revealed, true);
});

function testCanonicalJson(value) {
  if (Array.isArray(value)) return value.map(testCanonicalJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, testCanonicalJson(value[key])]));
}

function independentSha(value) {
  return createHash("sha256")
    .update(Buffer.from(JSON.stringify(testCanonicalJson(value)), "utf8"))
    .digest("hex");
}

test("placement and story receipts use the exact v1 canonical input schema", () => {
  assert.equal(independentSha({ b: 1, a: "é" }),
    "aa58fba8483623bed37c1b02edfccbdd9a53123837c20bfa4cb4049993a2872e");

  const placementRun = startPlacement("s16-alternative");
  const challenge = placementRun.challenge;
  const input = placementInput(placementRun.nextState, "s16-alternative",
    placementRun.served.visitId, challenge,
    challenge.optionTokens.find(token => token !== challenge.expectedToken),
    "2026-09-02T06:00:00.000Z");
  const placementResult = commitContentPlacementResponse(placementRun.nextState, input);
  const placementReceipt = placementResult.nextState.attemptReceipts[challenge.attemptId];
  assert.equal(placementReceipt.inputSha256, independentSha({
    schemaVersion: 1,
    operation: "content_placement",
    subject: { placementId: "s16-alternative", visitId: placementRun.served.visitId },
    attempt: { attemptId: challenge.attemptId, decisionOrdinal: 0, attemptOrdinal: 0 },
    correction: { supportLevel: 0, revealed: false, modelStep: "not_required" },
    challenge,
    response: input.response,
    audio: input.audio,
    at: input.at,
    sessionDay: input.sessionDay
  }));

  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const transactionId = begun.transaction.transactionId;
  const storyState = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId, narrativeChoiceToken: null
  });
  const storyChallenge = materializeStoryTransferChallenge(storyState, { transactionId });
  const storyInput = {
    transactionId, challenge: storyChallenge,
    response: { kind: "literacy-answer", token: storyChallenge.expectedToken },
    audio: { status: "unavailable" }, at: "2026-09-02T06:01:00.000Z",
    sessionDay: "2026-09-02"
  };
  const storyResult = completeStoryTransferTransaction(storyState, storyInput);
  const storyReceipt = storyResult.nextState.attemptReceipts[storyChallenge.attemptId];
  assert.equal(storyReceipt.inputSha256, independentSha({
    schemaVersion: 1,
    operation: "story_transfer",
    subject: { transactionId },
    attempt: { attemptId: storyChallenge.attemptId, decisionOrdinal: 0, attemptOrdinal: 0 },
    correction: { supportLevel: 0, revealed: false, modelStep: "not_required" },
    challenge: storyChallenge,
    response: storyInput.response,
    audio: storyInput.audio,
    at: storyInput.at,
    sessionDay: storyInput.sessionDay
  }));
  assert.deepEqual({
    word: storyResult.event.word,
    position: storyResult.event.position,
    connectedTextId: storyResult.event.connectedTextId,
    bossTransferId: storyResult.event.bossTransferId
  }, { word: null, position: null, connectedTextId: "scene-s1", bossTransferId: null });
});

test("idempotent retries require a complete valid receipt dependency chain", () => {
  const run = startPlacement("s38-morphology");
  const challenge = run.challenge;
  const input = {
    placementId: run.placement.placementId,
    visitId: run.served.visitId,
    challenge,
    response: { challengeId: challenge.challengeId, kind: "non-recording-complete",
      action: "introduce_word_ending" },
    audio: { status: "unavailable" },
    at: "2026-09-02T06:02:00.000Z", sessionDay: "2026-09-02"
  };
  const completed = commitContentPlacementResponse(run.nextState, input);
  const corruptedPlacement = structuredClone(completed.nextState);
  corruptedPlacement.contentDecks.morphology.uses = {};
  assert.equal(validAttemptReceipts(corruptedPlacement).length, 0);
  assert.equal(validContentDeckUses(corruptedPlacement, "morphology").length, 0);
  assert.throws(() => commitContentPlacementResponse(corruptedPlacement, input),
    /receipt|dependency|valid|chain/i);

  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const transactionId = begun.transaction.transactionId;
  const pending = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId, narrativeChoiceToken: null
  });
  const storyChallenge = materializeStoryTransferChallenge(pending, { transactionId });
  const storyInput = {
    transactionId, challenge: storyChallenge,
    response: { kind: "literacy-answer", token: storyChallenge.expectedToken },
    audio: { status: "unavailable" }, at: "2026-09-02T06:03:00.000Z",
    sessionDay: "2026-09-02"
  };
  const storyCompleted = completeStoryTransferTransaction(pending, storyInput);
  const corruptedStory = structuredClone(storyCompleted.nextState);
  corruptedStory.contentDecks.transfer.uses = {};
  assert.equal(validAttemptReceipts(corruptedStory).length, 0);
  assert.throws(() => completeStoryTransferTransaction(corruptedStory, storyInput),
    /receipt|dependency|valid|chain/i);
});
