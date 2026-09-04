import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import { CONTENT_DECK_PLACEMENTS } from "../../src/features/soundSeekers/content/contentDeckBindings.js";
import { getContentDeckCatalogRecord } from "../../src/features/soundSeekers/content/contentDeckCatalogs.js";
import { createSoundSeekersState, normalizeSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";
import { serveContentDeck } from "../../src/features/soundSeekers/engine/contentDeckScheduler.js";
import { evidenceIsIndependent } from "../../src/features/soundSeekers/engine/evidence.js";
import { getInstructionContract } from "../../src/features/soundSeekers/content/instructionContracts.js";
import { createSoundSeekersAudioController } from "../../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import { installSoundSeekersProductionAudioDouble } from "../helpers/soundSeekersProductionAudioDouble.js";
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
installSoundSeekersProductionAudioDouble();

function authorizedAudio(challenge) {
  if (challenge.requiresAudio === false) return { audio, audioAuthority: undefined };
  const contract = getInstructionContract(challenge.instructionId);
  const audioAuthority = {
    scopeKey: "content-transaction-test",
    missionId: `content:${challenge.attemptId}`,
    phaseId: challenge.challengeId,
    attemptId: challenge.attemptId
  };
  const controller = createSoundSeekersAudioController({
    scopeKey: audioAuthority.scopeKey,
    clock: () => 0
  });
  controller.request({
    cueId: `instruction:${contract.instructionId}`,
    audioKey: contract.childAudio,
    visibleText: contract.childText,
    spokenText: contract.childText,
    kind: "instruction",
    requiresAudio: true
  }, audioAuthority);
  return { audio: controller.getSnapshot().delivery, audioAuthority };
}

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
  const authority = authorizedAudio(challenge);
  return {
    placementId, visitId, challenge,
    response: { kind: "literacy-answer", token }, ...authority, at, sessionDay: at.slice(0, 10)
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
      assert.equal(Object.hasOwn(challenge, "targetId"), false);
      assert.equal(Object.hasOwn(challenge, "wordId"), true);
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
    assert.equal(Object.hasOwn(first, "wordId"), false);
    assert.equal(Object.hasOwn(first, "targetId"), true);
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

test("a repeated placement replays only receipts from its exact canonical visit", () => {
  const first = startPlacement("s16-alternative");
  let state = first.nextState;
  let result;
  while (!result?.completed) {
    const challenge = materializeContentPlacementChallenge(state, {
      placementId: first.placement.placementId, visitId: first.served.visitId
    });
    result = commitContentPlacementResponse(state, placementInput(
      state, first.placement.placementId, first.served.visitId, challenge,
      challenge.expectedToken, `2026-09-02T01:1${challenge.targetOrdinal}:00.000Z`
    ));
    state = result.nextState;
  }
  const secondVisitId = "visit:56:s16-alternative";
  const secondServed = serveContentDeck(state.contentDecks, {
    binding: first.placement.contentBinding,
    visitId: secondVisitId,
    stopId: "s16",
    journeyStep: 56,
    seed: 56
  });
  const begun = beginContentPlacementAttempt({ ...state, contentDecks: secondServed.nextState }, {
    placementId: first.placement.placementId,
    visitId: secondVisitId
  });
  const second = materializeContentPlacementChallenge(begun.nextState, {
    placementId: first.placement.placementId,
    visitId: secondVisitId
  });
  assert.equal(second.attemptId,
    `content-placement-attempt:${secondVisitId}:s16-alternative:0:0`);

  const forged = structuredClone(begun.nextState);
  const priorReceipt = validAttemptReceipts(state)[0];
  const forgedAttemptId = forged.checkpoint.contentPlacement.attemptId;
  forged.attemptReceipts[forgedAttemptId] = {
    ...structuredClone(priorReceipt),
    attemptId: forgedAttemptId
  };
  assert.throws(() => resumeContentPlacementAttempt(forged, {
    placementId: first.placement.placementId,
    visitId: secondVisitId
  }), /history|canonical|fingerprint|receipt/i);
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
    if (expedition.stopId === "s1" || expedition.stopId === "s5") {
      const wrongTokenState = structuredClone(state);
      wrongTokenState.checkpoint.storyTransfer.narrativeChoiceToken = expedition.transfer.boss
        ? null
        : "forbidden-non-boss-token";
      const normalizedWrongToken = normalizeSoundSeekersState(wrongTokenState);
      assert.equal(normalizedWrongToken.checkpoint?.storyTransfer, undefined,
        `${expedition.stopId}: transfer shape must own narrative token nullability`);
      assert.throws(() => resumeStoryTransferTransaction(normalizedWrongToken, { transactionId }),
        /identity|checkpoint|resume/i);
    }
    const challenge = materializeStoryTransferChallenge(state, { transactionId });
    assert.equal(challenge.challengeId,
      `${challenge.attemptId}:${expedition.transfer.boss ? "boss" : "transfer"}`);
    assert.equal(challenge.requiresAudio, false);
    if (expedition.transfer.boss) {
      boss += 1;
      assert.equal(challenge.connectedTextId, null);
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

test("story transactions reject unsafe journey ordinals before deck mutation", () => {
  const state = createSoundSeekersState();
  const snapshot = structuredClone(state);
  assert.throws(() => beginStoryTransferTransaction(state, {
    stopId: "s1",
    journeyStep: Number.MAX_SAFE_INTEGER + 1,
    seed: 1
  }), /journey|invalid/i);
  assert.deepEqual(state, snapshot);
});

test("story correction replay rejects impossible history and consumes the third-miss model once", () => {
  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const transactionId = begun.transaction.transactionId;
  let state = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId, narrativeChoiceToken: null
  });
  const resumeKeys = [
    "attempt", "correction", "storyServed", "transaction", "transferServed"
  ];
  assert.deepEqual(Object.keys(resumeStoryTransferTransaction(state, { transactionId })).sort(),
    resumeKeys);
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
    if (miss < 2) {
      assert.deepEqual(Object.keys(resumeStoryTransferTransaction(state, { transactionId })).sort(),
        resumeKeys, "retry resume must not materialize a challenge");
    }
  }
  assert.equal(state.checkpoint.storyTransfer.stage, "model_pending");
  const modeled = completeStoryTransferCorrectionModel(state, { transactionId });
  assert.equal(modeled.attempt.supportLevel, 3);
  const modeledResume = resumeStoryTransferTransaction(modeled.nextState, { transactionId });
  assert.deepEqual(Object.keys(modeledResume).sort(), resumeKeys);
  assert.equal(modeledResume.attempt.revealed, true);
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
  const placementCanonical = {
    schemaVersion: 1,
    operation: "content_placement",
    subject: { placementId: "s16-alternative", visitId: placementRun.served.visitId },
    attempt: { attemptId: challenge.attemptId, decisionOrdinal: 0, attemptOrdinal: 0 },
    correction: { supportLevel: 0, revealed: false, modelStep: "not_required" },
    challenge,
    response: input.response,
    audio: { status: input.audio.status },
    at: input.at,
    sessionDay: input.sessionDay
  };
  assert.equal(placementReceipt.inputSha256, independentSha(placementCanonical));
  const changedCorrectionState = structuredClone(placementResult.nextState);
  changedCorrectionState.attemptReceipts[challenge.attemptId].inputSha256 = independentSha({
    ...placementCanonical,
    correction: { ...placementCanonical.correction, supportLevel: 2 }
  });
  assert.throws(() => commitContentPlacementResponse(changedCorrectionState, input),
    /receipt|divergent|fingerprint|canonical/i);

  const supportedChallenge = materializeContentPlacementChallenge(placementResult.nextState, {
    placementId: "s16-alternative",
    visitId: placementRun.served.visitId
  });
  const supportedInput = placementInput(
    placementResult.nextState,
    "s16-alternative",
    placementRun.served.visitId,
    supportedChallenge,
    supportedChallenge.expectedToken,
    "2026-09-02T06:00:01.000Z"
  );
  const supportedResult = commitContentPlacementResponse(
    placementResult.nextState, supportedInput);
  const supportedReceipt = supportedResult.nextState.attemptReceipts[supportedChallenge.attemptId];
  assert.equal(supportedReceipt.inputSha256, independentSha({
    schemaVersion: 1,
    operation: "content_placement",
    subject: { placementId: "s16-alternative", visitId: placementRun.served.visitId },
    attempt: {
      attemptId: supportedChallenge.attemptId,
      decisionOrdinal: 0,
      attemptOrdinal: 1
    },
    correction: { supportLevel: 1, revealed: false, modelStep: "not_required" },
    challenge: supportedChallenge,
    response: supportedInput.response,
    audio: { status: supportedInput.audio.status },
    at: supportedInput.at,
    sessionDay: supportedInput.sessionDay
  }));

  const modeledRun = startPlacement("s28-alternative");
  const modeledIdentity = {
    placementId: modeledRun.placement.placementId,
    visitId: modeledRun.served.visitId
  };
  let modeledState = modeledRun.nextState;
  for (let miss = 0; miss < 3; miss += 1) {
    const missChallenge = materializeContentPlacementChallenge(modeledState, modeledIdentity);
    modeledState = commitContentPlacementResponse(modeledState,
      placementInput(
        modeledState,
        modeledIdentity.placementId,
        modeledIdentity.visitId,
        missChallenge,
        missChallenge.optionTokens.find(token => token !== missChallenge.expectedToken),
        `2026-09-02T06:10:0${miss}.000Z`
      )).nextState;
  }
  const modeled = completeContentPlacementCorrectionModel(modeledState, modeledIdentity);
  const modeledInput = placementInput(
    modeled.nextState,
    modeledIdentity.placementId,
    modeledIdentity.visitId,
    modeled.challenge,
    modeled.challenge.expectedToken,
    "2026-09-02T06:10:04.000Z"
  );
  const modeledResult = commitContentPlacementResponse(modeled.nextState, modeledInput);
  const modeledReceipt = modeledResult.nextState.attemptReceipts[modeled.challenge.attemptId];
  assert.equal(modeledReceipt.inputSha256, independentSha({
    schemaVersion: 1,
    operation: "content_placement",
    subject: {
      placementId: modeledIdentity.placementId,
      visitId: modeledIdentity.visitId
    },
    attempt: {
      attemptId: modeled.challenge.attemptId,
      decisionOrdinal: 0,
      attemptOrdinal: 3
    },
    correction: { supportLevel: 3, revealed: true, modelStep: "consumed" },
    challenge: modeled.challenge,
    response: modeledInput.response,
    audio: { status: modeledInput.audio.status },
    at: modeledInput.at,
    sessionDay: modeledInput.sessionDay
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
  const storyCanonical = {
    schemaVersion: 1,
    operation: "story_transfer",
    subject: { transactionId },
    attempt: { attemptId: storyChallenge.attemptId, decisionOrdinal: 0, attemptOrdinal: 0 },
    correction: { supportLevel: 0, revealed: false, modelStep: "not_required" },
    challenge: storyChallenge,
    response: storyInput.response,
    audio: { status: storyInput.audio.status },
    at: storyInput.at,
    sessionDay: storyInput.sessionDay
  };
  assert.equal(storyReceipt.inputSha256, independentSha(storyCanonical));
  const changedPrivateKeyState = structuredClone(storyResult.nextState);
  changedPrivateKeyState.attemptReceipts[storyChallenge.attemptId].inputSha256 = independentSha({
    ...storyCanonical,
    challenge: {
      ...storyCanonical.challenge,
      expectedToken: storyCanonical.challenge.optionTokens.find(
        token => token !== storyCanonical.challenge.expectedToken)
    }
  });
  assert.throws(() => completeStoryTransferTransaction(changedPrivateKeyState, storyInput),
    /receipt|divergent|fingerprint|canonical/i);
  assert.deepEqual({
    word: storyResult.event.word,
    position: storyResult.event.position,
    connectedTextId: storyResult.event.connectedTextId,
    bossTransferId: storyResult.event.bossTransferId
  }, { word: null, position: null, connectedTextId: "scene-s1", bossTransferId: null });

  const morphologyRun = startPlacement("s38-morphology");
  const morphologyChallenge = morphologyRun.challenge;
  const morphologyInput = {
    placementId: morphologyRun.placement.placementId,
    visitId: morphologyRun.served.visitId,
    challenge: morphologyChallenge,
    response: {
      challengeId: morphologyChallenge.challengeId,
      kind: "non-recording-complete",
      action: "introduce_word_ending"
    },
    audio: { status: "unavailable" },
    at: "2026-09-02T06:01:30.000Z",
    sessionDay: "2026-09-02"
  };
  const morphologyResult = commitContentPlacementResponse(
    morphologyRun.nextState, morphologyInput);
  const morphologyCanonical = {
    schemaVersion: 1,
    operation: "content_placement",
    subject: {
      placementId: morphologyRun.placement.placementId,
      visitId: morphologyRun.served.visitId
    },
    attempt: {
      attemptId: morphologyChallenge.attemptId,
      decisionOrdinal: 0,
      attemptOrdinal: 0
    },
    correction: { supportLevel: 0, revealed: false, modelStep: "not_required" },
    challenge: morphologyChallenge,
    response: morphologyInput.response,
    audio: { status: morphologyInput.audio.status },
    at: morphologyInput.at,
    sessionDay: morphologyInput.sessionDay
  };
  assert.equal(
    morphologyResult.nextState.attemptReceipts[morphologyChallenge.attemptId].inputSha256,
    independentSha(morphologyCanonical));
  const changedTimeState = structuredClone(morphologyResult.nextState);
  changedTimeState.attemptReceipts[morphologyChallenge.attemptId].inputSha256 = independentSha({
    ...morphologyCanonical,
    at: "2026-09-02T06:01:31.000Z"
  });
  assert.throws(() => commitContentPlacementResponse(changedTimeState, morphologyInput),
    /receipt|divergent|fingerprint|canonical/i);

  const bossBegun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s5", journeyStep: 5, seed: 5
  });
  const bossTransactionId = bossBegun.transaction.transactionId;
  const bossState = checkpointStoryTransferTransaction(bossBegun.nextState, {
    transactionId: bossTransactionId,
    narrativeChoiceToken: "narrative-s5"
  });
  const bossChallenge = materializeStoryTransferChallenge(bossState, {
    transactionId: bossTransactionId
  });
  const bossInput = {
    transactionId: bossTransactionId,
    challenge: bossChallenge,
    response: { kind: "literacy-answer", token: bossChallenge.expectedToken },
    audio: { status: "completed" },
    at: "2026-09-02T06:01:45.000Z",
    sessionDay: "2026-09-02"
  };
  const bossResult = completeStoryTransferTransaction(bossState, bossInput);
  const bossCanonical = {
    schemaVersion: 1,
    operation: "story_transfer",
    subject: { transactionId: bossTransactionId },
    attempt: {
      attemptId: bossChallenge.attemptId,
      decisionOrdinal: 0,
      attemptOrdinal: 0
    },
    correction: { supportLevel: 0, revealed: false, modelStep: "not_required" },
    challenge: bossChallenge,
    response: bossInput.response,
    audio: { status: bossInput.audio.status },
    at: bossInput.at,
    sessionDay: bossInput.sessionDay
  };
  assert.equal(
    bossResult.nextState.attemptReceipts[bossChallenge.attemptId].inputSha256,
    independentSha(bossCanonical));
  const changedAudioState = structuredClone(bossResult.nextState);
  changedAudioState.attemptReceipts[bossChallenge.attemptId].inputSha256 = independentSha({
    ...bossCanonical,
    audio: { status: "blocked" }
  });
  assert.throws(() => completeStoryTransferTransaction(changedAudioState, bossInput),
    /receipt|divergent|fingerprint|canonical/i);
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
  assert.throws(() => commitContentPlacementResponse(completed.nextState, {
    ...input,
    challenge: { ...input.challenge, challengeId: `${input.challenge.challengeId}:tampered` }
  }), /receipt|identity|checkpoint|challenge/i);
  assert.throws(() => commitContentPlacementResponse(completed.nextState, {
    ...input,
    placementId: "s16-alternative"
  }), /subject|identity|placement/i);
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
  assert.throws(() => completeStoryTransferTransaction(storyCompleted.nextState, {
    ...storyInput,
    transactionId: "story-transfer:40:s40"
  }), /subject|identity|transaction/i);
  const corruptedStory = structuredClone(storyCompleted.nextState);
  corruptedStory.contentDecks.transfer.uses = {};
  assert.equal(validAttemptReceipts(corruptedStory).length, 0);
  assert.throws(() => completeStoryTransferTransaction(corruptedStory, storyInput),
    /receipt|dependency|valid|chain/i);
});

test("fresh transactions never overwrite occupied immutable receipt or use identities", () => {
  const placement = startPlacement("s38-morphology");
  const placementInputValue = {
    placementId: placement.placement.placementId,
    visitId: placement.served.visitId,
    challenge: placement.challenge,
    response: {
      challengeId: placement.challenge.challengeId,
      kind: "non-recording-complete",
      action: "introduce_word_ending"
    },
    audio: { status: "unavailable" },
    at: "2026-09-02T06:04:00.000Z",
    sessionDay: "2026-09-02"
  };
  const receiptOccupied = structuredClone(placement.nextState);
  receiptOccupied.attemptReceipts[placement.challenge.attemptId] = {
    kind: "attempt_receipt_conflict",
    attemptId: placement.challenge.attemptId
  };
  const receiptSnapshot = structuredClone(receiptOccupied);
  assert.throws(() => commitContentPlacementResponse(receiptOccupied, placementInputValue),
    /immutable|receipt|occupied|conflict/i);
  assert.deepEqual(receiptOccupied, receiptSnapshot);

  const placementUseId = `${placement.served.visitId}:${placement.placement.contentBinding.actionUseId}`;
  const useOccupied = structuredClone(placement.nextState);
  useOccupied.contentDecks.morphology.uses[placementUseId] = {
    kind: "use_conflict",
    useId: placementUseId
  };
  const useSnapshot = structuredClone(useOccupied);
  assert.throws(() => commitContentPlacementResponse(useOccupied, placementInputValue),
    /immutable|use|occupied|conflict/i);
  assert.deepEqual(useOccupied, useSnapshot);

  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const transactionId = begun.transaction.transactionId;
  const pending = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId,
    narrativeChoiceToken: null
  });
  const storyChallenge = materializeStoryTransferChallenge(pending, { transactionId });
  const storyInput = {
    transactionId,
    challenge: storyChallenge,
    response: { kind: "literacy-answer", token: storyChallenge.expectedToken },
    audio: { status: "unavailable" },
    at: "2026-09-02T06:05:00.000Z",
    sessionDay: "2026-09-02"
  };
  const storyReceiptOccupied = structuredClone(pending);
  storyReceiptOccupied.attemptReceipts[storyChallenge.attemptId] = {
    kind: "attempt_receipt_conflict",
    attemptId: storyChallenge.attemptId
  };
  const storyReceiptSnapshot = structuredClone(storyReceiptOccupied);
  assert.throws(() => completeStoryTransferTransaction(storyReceiptOccupied, storyInput),
    /immutable|receipt|occupied|conflict/i);
  assert.deepEqual(storyReceiptOccupied, storyReceiptSnapshot);

  const storyUseOccupied = structuredClone(pending);
  storyUseOccupied.contentDecks.stories.uses[begun.transaction.storyUseId] = {
    kind: "use",
    useId: begun.transaction.storyUseId
  };
  const storyUseSnapshot = structuredClone(storyUseOccupied);
  assert.throws(() => completeStoryTransferTransaction(storyUseOccupied, storyInput),
    /immutable|use|occupied|conflict/i);
  assert.deepEqual(storyUseOccupied, storyUseSnapshot);
});

test("cached challenges are revalidated against current deck authority before mutation", () => {
  const placement = startPlacement("s16-alternative");
  const placementState = {
    ...placement.nextState,
    contentDecks: structuredClone(placement.nextState.contentDecks)
  };
  const placementIdentity = {
    placementId: placement.placement.placementId,
    visitId: placement.served.visitId
  };
  const placementChallenge = materializeContentPlacementChallenge(
    placementState, placementIdentity);
  placementState.contentDecks.alternatives.visits[placement.served.visitId].recordId =
    "alternative:forged";
  assert.throws(() => materializeContentPlacementChallenge(placementState, placementIdentity),
    /authority|canonical|rehydrate|record/i);
  assert.throws(() => commitContentPlacementResponse(placementState,
    placementInput(
      placementState,
      placementIdentity.placementId,
      placementIdentity.visitId,
      placementChallenge,
      placementChallenge.optionTokens.find(token => token !== placementChallenge.expectedToken),
      "2026-09-02T06:06:00.000Z"
    )), /authority|canonical|rehydrate|record/i);
  assert.deepEqual(placementState.contentDecks.alternatives.visits[placement.served.visitId].recordId,
    "alternative:forged");

  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const transactionId = begun.transaction.transactionId;
  const pending = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId,
    narrativeChoiceToken: null
  });
  const storyState = {
    ...pending,
    contentDecks: structuredClone(pending.contentDecks)
  };
  const storyChallenge = materializeStoryTransferChallenge(storyState, { transactionId });
  storyState.contentDecks.transfer.visits[begun.transaction.transferVisitId].recordId =
    "transfer:forged";
  assert.throws(() => materializeStoryTransferChallenge(storyState, { transactionId }),
    /authority|canonical|rehydrate|record/i);
  assert.throws(() => completeStoryTransferTransaction(storyState, {
    transactionId,
    challenge: storyChallenge,
    response: { kind: "literacy-answer", token: storyChallenge.expectedToken },
    audio: { status: "unavailable" },
    at: "2026-09-02T06:07:00.000Z",
    sessionDay: "2026-09-02"
  }), /authority|canonical|rehydrate|record/i);
  assert.equal(
    storyState.contentDecks.transfer.visits[begun.transaction.transferVisitId].recordId,
    "transfer:forged");
});

function assertPlacementHistoryTamperRejected({ state, identity, challenge }, mutate, label) {
  const tampered = structuredClone(state);
  mutate(tampered);
  const snapshot = structuredClone(tampered);
  const currentInput = placementInput(
    tampered,
    identity.placementId,
    identity.visitId,
    challenge,
    challenge.expectedToken,
    "2026-09-02T07:00:03.000Z"
  );
  const boundaries = [
    ["resume", () => resumeContentPlacementAttempt(tampered, identity)],
    ["materialize", () => materializeContentPlacementChallenge(tampered, identity)],
    ["commit", () => commitContentPlacementResponse(tampered, currentInput)]
  ];
  for (const [boundary, invoke] of boundaries) {
    assert.throws(invoke, /canonical|event|fingerprint|history|receipt/i,
      `${label}: ${boundary} accepted tampered placement history`);
    assert.deepEqual(tampered, snapshot, `${label}: ${boundary} mutated rejected input`);
  }
}

function assertStoryHistoryTamperRejected({ state, identity, challenge }, mutate, label) {
  const tampered = structuredClone(state);
  mutate(tampered);
  const snapshot = structuredClone(tampered);
  const currentInput = {
    transactionId: identity.transactionId,
    challenge,
    response: { kind: "literacy-answer", token: challenge.expectedToken },
    audio: { status: "completed" },
    at: "2026-09-02T07:01:03.000Z",
    sessionDay: "2026-09-02"
  };
  const boundaries = [
    ["resume", () => resumeStoryTransferTransaction(tampered, identity)],
    ["materialize", () => materializeStoryTransferChallenge(tampered, identity)],
    ["commit", () => completeStoryTransferTransaction(tampered, currentInput)]
  ];
  for (const [boundary, invoke] of boundaries) {
    assert.throws(invoke, /canonical|event|fingerprint|history|receipt/i,
      `${label}: ${boundary} accepted tampered story history`);
    assert.deepEqual(tampered, snapshot, `${label}: ${boundary} mutated rejected input`);
  }
}

test("placement pending history revalidates every canonical event and v1 input digest", () => {
  const run = startPlacement("s16-alternative");
  const identity = { placementId: run.placement.placementId, visitId: run.served.visitId };
  const firstChallenge = materializeContentPlacementChallenge(run.nextState, identity);
  const firstWrong = commitContentPlacementResponse(run.nextState,
    placementInput(
      run.nextState,
      identity.placementId,
      identity.visitId,
      firstChallenge,
      firstChallenge.optionTokens.find(token => token !== firstChallenge.expectedToken),
      "2026-09-02T07:00:00.000Z"
    ));
  const retryChallenge = materializeContentPlacementChallenge(firstWrong.nextState, identity);
  const firstCorrect = commitContentPlacementResponse(firstWrong.nextState,
    placementInput(
      firstWrong.nextState,
      identity.placementId,
      identity.visitId,
      retryChallenge,
      retryChallenge.expectedToken,
      "2026-09-02T07:00:01.000Z"
    ));
  const fixture = {
    state: firstCorrect.nextState,
    identity,
    challenge: materializeContentPlacementChallenge(firstCorrect.nextState, identity)
  };
  const wrongEventId = firstWrong.event.id;
  const correctEventId = firstCorrect.event.id;
  const wrongReceiptId = firstChallenge.attemptId;
  const correctReceiptId = retryChallenge.attemptId;
  const mutations = [
    ["target", state => { state.evidence.find(event => event.id === wrongEventId).target += ":forged"; }],
    ["domain", state => { state.evidence.find(event => event.id === wrongEventId).domain = "word_reading"; }],
    ["confusion", state => { state.evidence.find(event => event.id === wrongEventId).confusion = "forged-choice"; }],
    ["mechanic", state => { state.evidence.find(event => event.id === wrongEventId).mechanic = "word_forge"; }],
    ["journey", state => { state.evidence.find(event => event.id === wrongEventId).journeyStep += 1; }],
    ["audio", state => { state.evidence.find(event => event.id === wrongEventId).cueDelivery = "blocked"; }],
    ["time", state => { state.evidence.find(event => event.id === wrongEventId).at = "2026-09-02T07:00:09.000Z"; }],
    ["day", state => { state.evidence.find(event => event.id === wrongEventId).sessionDay = "2026-09-03"; }],
    ["wrong relation", state => {
      state.evidence.find(event => event.id === wrongEventId).confusion = firstChallenge.expectedToken;
    }],
    ["correct relation", state => {
      state.evidence.find(event => event.id === correctEventId).confusion = "forged-choice";
    }],
    ["wrong receipt SHA", state => {
      state.attemptReceipts[wrongReceiptId].inputSha256 = "0".repeat(64);
    }],
    ["correct receipt SHA", state => {
      state.attemptReceipts[correctReceiptId].inputSha256 = "f".repeat(64);
    }]
  ];
  for (const [label, mutate] of mutations) {
    assertPlacementHistoryTamperRejected(fixture, mutate, label);
  }
});

test("story pending history revalidates every canonical event and v1 input digest", () => {
  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s5", journeyStep: 5, seed: 5
  });
  const identity = { transactionId: begun.transaction.transactionId };
  const pending = checkpointStoryTransferTransaction(begun.nextState, {
    ...identity,
    narrativeChoiceToken: "narrative-s5"
  });
  const firstChallenge = materializeStoryTransferChallenge(pending, identity);
  const firstWrong = completeStoryTransferTransaction(pending, {
    ...identity,
    challenge: firstChallenge,
    response: {
      kind: "literacy-answer",
      token: firstChallenge.optionTokens.find(token => token !== firstChallenge.expectedToken)
    },
    audio: { status: "completed" },
    at: "2026-09-02T07:01:00.000Z",
    sessionDay: "2026-09-02"
  });
  const fixture = {
    state: firstWrong.nextState,
    identity,
    challenge: materializeStoryTransferChallenge(firstWrong.nextState, identity)
  };
  const eventId = firstWrong.event.id;
  const receiptId = firstChallenge.attemptId;
  const mutations = [
    ["target", state => { state.evidence.find(event => event.id === eventId).target += ":forged"; }],
    ["domain", state => { state.evidence.find(event => event.id === eventId).domain = "connected_text"; }],
    ["confusion", state => { state.evidence.find(event => event.id === eventId).confusion = "forged-choice"; }],
    ["mechanic", state => { state.evidence.find(event => event.id === eventId).mechanic = "contrast_sort"; }],
    ["journey", state => { state.evidence.find(event => event.id === eventId).journeyStep += 1; }],
    ["audio", state => { state.evidence.find(event => event.id === eventId).cueDelivery = "blocked"; }],
    ["time", state => { state.evidence.find(event => event.id === eventId).at = "2026-09-02T07:01:09.000Z"; }],
    ["day", state => { state.evidence.find(event => event.id === eventId).sessionDay = "2026-09-03"; }],
    ["word", state => { state.evidence.find(event => event.id === eventId).word = "forged-word"; }],
    ["position", state => { state.evidence.find(event => event.id === eventId).position = "initial"; }],
    ["connected text", state => {
      state.evidence.find(event => event.id === eventId).connectedTextId = "scene-forged";
    }],
    ["boss identity", state => {
      state.evidence.find(event => event.id === eventId).bossTransferId = "boss-forged";
    }],
    ["wrong relation", state => {
      state.evidence.find(event => event.id === eventId).confusion = firstChallenge.expectedToken;
    }],
    ["receipt SHA", state => {
      state.attemptReceipts[receiptId].inputSha256 = "0".repeat(64);
    }]
  ];
  for (const [label, mutate] of mutations) {
    assertStoryHistoryTamperRejected(fixture, mutate, label);
  }
});

test("eleven misses survive reload and canonical numeric replay before a correct finish", () => {
  const placement = startPlacement("s28-alternative");
  const placementIdentity = {
    placementId: placement.placement.placementId,
    visitId: placement.served.visitId
  };
  let placementState = placement.nextState;
  let placementModels = 0;
  for (let miss = 0; miss < 11; miss += 1) {
    const challenge = materializeContentPlacementChallenge(placementState, placementIdentity);
    const result = commitContentPlacementResponse(placementState,
      placementInput(
        placementState,
        placementIdentity.placementId,
        placementIdentity.visitId,
        challenge,
        challenge.optionTokens.find(token => token !== challenge.expectedToken),
        `2026-09-02T08:00:${String(miss).padStart(2, "0")}.000Z`
      ));
    placementState = result.nextState;
    if (result.outcome === "model_required") {
      placementModels += 1;
      placementState = completeContentPlacementCorrectionModel(
        placementState, placementIdentity).nextState;
    }
    placementState = normalizeSoundSeekersState(
      JSON.parse(JSON.stringify(placementState)));
  }
  assert.equal(placementModels, 1);
  assert.equal(placementState.checkpoint.contentPlacement.attemptOrdinal, 11);
  const placementChallenge = materializeContentPlacementChallenge(
    placementState, placementIdentity);
  const placementCompleted = commitContentPlacementResponse(placementState,
    placementInput(
      placementState,
      placementIdentity.placementId,
      placementIdentity.visitId,
      placementChallenge,
      placementChallenge.expectedToken,
      "2026-09-02T08:00:11.000Z"
    ));
  assert.equal(placementCompleted.completed, true);
  assert.equal(validAttemptReceipts(placementCompleted.nextState).length, 12);
  assert.equal(validContentDeckUses(placementCompleted.nextState, "alternatives").length, 1);

  const story = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const storyIdentity = { transactionId: story.transaction.transactionId };
  let storyState = checkpointStoryTransferTransaction(story.nextState, {
    ...storyIdentity,
    narrativeChoiceToken: null
  });
  let storyModels = 0;
  for (let miss = 0; miss < 11; miss += 1) {
    const challenge = materializeStoryTransferChallenge(storyState, storyIdentity);
    const result = completeStoryTransferTransaction(storyState, {
      ...storyIdentity,
      challenge,
      response: {
        kind: "literacy-answer",
        token: challenge.optionTokens.find(token => token !== challenge.expectedToken)
      },
      audio: { status: "unavailable" },
      at: `2026-09-02T08:01:${String(miss).padStart(2, "0")}.000Z`,
      sessionDay: "2026-09-02"
    });
    storyState = result.nextState;
    if (result.outcome === "model_required") {
      storyModels += 1;
      storyState = completeStoryTransferCorrectionModel(storyState, storyIdentity).nextState;
    }
    storyState = normalizeSoundSeekersState(JSON.parse(JSON.stringify(storyState)));
  }
  assert.equal(storyModels, 1);
  assert.equal(storyState.checkpoint.storyTransfer.attemptOrdinal, 11);
  const storyChallenge = materializeStoryTransferChallenge(storyState, storyIdentity);
  const storyCompleted = completeStoryTransferTransaction(storyState, {
    ...storyIdentity,
    challenge: storyChallenge,
    response: { kind: "literacy-answer", token: storyChallenge.expectedToken },
    audio: { status: "unavailable" },
    at: "2026-09-02T08:01:11.000Z",
    sessionDay: "2026-09-02"
  });
  assert.equal(storyCompleted.completed, true);
  assert.equal(validAttemptReceipts(storyCompleted.nextState).length, 12);
  assert.equal(validContentDeckUses(storyCompleted.nextState, "stories").length, 1);
  assert.equal(validContentDeckUses(storyCompleted.nextState, "transfer").length, 1);
});

test("transaction boundaries strip private checkpoint fields and reject forged identity", () => {
  const placement = startPlacement("s16-alternative");
  const identity = {
    placementId: placement.placement.placementId,
    visitId: placement.served.visitId
  };
  const leakedPlacement = structuredClone(placement.nextState);
  leakedPlacement.checkpoint.contentPlacement.privateAnswer = "must-not-persist";
  const challenge = materializeContentPlacementChallenge(leakedPlacement, identity);
  assert.equal(Object.hasOwn(challenge, "privateAnswer"), false);
  const miss = commitContentPlacementResponse(leakedPlacement,
    placementInput(
      leakedPlacement,
      identity.placementId,
      identity.visitId,
      challenge,
      challenge.optionTokens.find(token => token !== challenge.expectedToken),
      "2026-09-02T06:08:00.000Z"
    ));
  assert.equal(Object.hasOwn(miss.nextState.checkpoint.contentPlacement, "privateAnswer"), false);
  assert.deepEqual(Object.keys(miss.nextState.checkpoint.contentPlacement).sort(), [
    "attemptId", "attemptOrdinal", "category", "journeyStep", "kind", "placementId",
    "stage", "stopId", "targetOrdinal", "visitId"
  ]);

  const forgedPlacement = structuredClone(placement.nextState);
  forgedPlacement.checkpoint.contentPlacement.stopId = "forged-stop";
  forgedPlacement.checkpoint.contentPlacement.privateAnswer = "must-not-persist";
  const placementSnapshot = structuredClone(forgedPlacement);
  assert.throws(() => materializeContentPlacementChallenge(forgedPlacement, identity),
    /checkpoint|identity|resume|placement/i);
  assert.throws(() => commitContentPlacementResponse(forgedPlacement,
    placementInput(
      forgedPlacement,
      identity.placementId,
      identity.visitId,
      placement.challenge,
      placement.challenge.optionTokens.find(token => token !== placement.challenge.expectedToken),
      "2026-09-02T06:08:01.000Z"
    )), /checkpoint|identity|resume|placement/i);
  assert.deepEqual(forgedPlacement, placementSnapshot);

  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const transactionId = begun.transaction.transactionId;
  const pending = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId,
    narrativeChoiceToken: null
  });
  const leakedStory = structuredClone(pending);
  leakedStory.checkpoint.storyTransfer.privateAnswer = "must-not-persist";
  const storyChallenge = materializeStoryTransferChallenge(leakedStory, { transactionId });
  const storyMiss = completeStoryTransferTransaction(leakedStory, {
    transactionId,
    challenge: storyChallenge,
    response: {
      kind: "literacy-answer",
      token: storyChallenge.optionTokens.find(token => token !== storyChallenge.expectedToken)
    },
    audio: { status: "unavailable" },
    at: "2026-09-02T06:08:02.000Z",
    sessionDay: "2026-09-02"
  });
  assert.equal(Object.hasOwn(storyMiss.nextState.checkpoint.storyTransfer, "privateAnswer"), false);
  assert.deepEqual(Object.keys(storyMiss.nextState.checkpoint.storyTransfer).sort(), [
    "attemptId", "attemptOrdinal", "journeyStep", "kind", "narrativeChoiceToken",
    "stage", "stopId", "storyVisitId", "transactionId", "transferVisitId"
  ]);

  const forgedStory = structuredClone(pending);
  forgedStory.checkpoint.storyTransfer.stopId = "forged-stop";
  forgedStory.checkpoint.storyTransfer.privateAnswer = "must-not-persist";
  const storySnapshot = structuredClone(forgedStory);
  assert.throws(() => materializeStoryTransferChallenge(forgedStory, { transactionId }),
    /checkpoint|identity|resume|story|transaction/i);
  assert.throws(() => completeStoryTransferTransaction(forgedStory, {
    transactionId,
    challenge: storyChallenge,
    response: {
      kind: "literacy-answer",
      token: storyChallenge.optionTokens.find(token => token !== storyChallenge.expectedToken)
    },
    audio: { status: "unavailable" },
    at: "2026-09-02T06:08:03.000Z",
    sessionDay: "2026-09-02"
  }), /checkpoint|identity|resume|story|transaction/i);
  assert.deepEqual(forgedStory, storySnapshot);
});
