import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import test from "node:test";
import * as espree from "espree";

import {
  CONTENT_DECK_SLOT_IDS,
  SOUND_SEEKERS_EXPEDITIONS
} from "../../src/features/soundSeekers/content/expeditions.js";
import {
  CONTENT_DECK_BINDINGS,
  CONTENT_DECK_PLACEMENTS,
  getContentDeckActionBindings,
  getContentDeckOwnerBinding,
  getContentDeckPlacements
} from "../../src/features/soundSeekers/content/contentDeckBindings.js";
import {
  CONTENT_DECK_CATEGORIES,
  getContentDeckCatalog,
  getContentDeckCatalogRecord
} from "../../src/features/soundSeekers/content/contentDeckCatalogs.js";
import { bossNovelTargetId } from "../../src/features/soundSeekers/engine/evidenceEligibility.js";
import {
  createContentDeckState,
  mergeAttemptReceipts,
  mergeContentDeckState,
  normalizeAttemptReceipt,
  normalizeAttemptReceipts,
  normalizeContentDeckUse,
  normalizeContentDeckVisit,
  validContentDeckVisits
} from "../../src/features/soundSeekers/engine/contentDeckState.js";
import {
  projectBoundContentResolverInputs,
  rankContentDeckCandidates,
  recordContentDeckUse,
  rehydrateServedContentInstance,
  serveContentDeck
} from "../../src/features/soundSeekers/engine/contentDeckScheduler.js";

test("the five catalogs and structural owners are exact", () => {
  assert.deepEqual(CONTENT_DECK_CATEGORIES, [
    "heartWords", "stories", "alternatives", "morphology", "transfer"
  ]);
  assert.deepEqual(Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [
    category, getContentDeckCatalog(category).length
  ])), { heartWords: 60, stories: 40, alternatives: 4, morphology: 1, transfer: 40 });
  for (const category of ["stories", "alternatives", "morphology", "transfer"]) {
    const slots = getContentDeckCatalog(category).flatMap(record => record.slotIds);
    assert.deepEqual(new Set(slots), new Set(CONTENT_DECK_SLOT_IDS[category]), category);
  }
  const owners = CONTENT_DECK_BINDINGS.filter(binding => binding.isVisitOwner);
  assert.deepEqual(Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [
    category, owners.filter(binding => binding.category === category).length
  ])), { heartWords: 80, stories: 40, alternatives: 4, morphology: 1, transfer: 40 });
  assert.equal(CONTENT_DECK_BINDINGS.filter(binding => binding.category === "heartWords").length, 81);
  assert.deepEqual(CONTENT_DECK_PLACEMENTS.map(item => item.placementId), [
    "s16-alternative", "s28-alternative", "s29-alternative", "s37-alternative", "s38-morphology"
  ]);
  for (const placement of CONTENT_DECK_PLACEMENTS) {
    assert.strictEqual(placement.contentBinding,
      getContentDeckOwnerBinding(placement.category, placement.slotId));
    assert.deepEqual(getContentDeckPlacements(placement.stopId), [placement]);
  }
});

test("story, transfer, alternative, and morphology identities are canonical", () => {
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const stopId = expedition.stopId;
    assert.deepEqual(getContentDeckCatalogRecord("stories", `story:scene-${stopId}`), {
      recordId: `story:scene-${stopId}`,
      category: "stories",
      contentId: `scene-${stopId}`,
      targetId: `text:scene-${stopId}`,
      wordId: null,
      connectedTextId: `scene-${stopId}`,
      slotIds: [`story-slot-${stopId}`]
    });
    const transfer = expedition.phases.find(phase => phase.id === `${stopId}-transfer`);
    const record = getContentDeckCatalogRecord("transfer", `transfer:${stopId}`);
    assert.deepEqual({
      instructionId: record.instructionId,
      powerId: record.powerId,
      expectedAction: record.expectedAction,
      recordsDomain: record.recordsDomain,
      connectedTextId: record.connectedTextId,
      wordId: record.wordId,
      bossTransferId: record.bossTransferId,
      targetId: record.targetId
    }, {
      instructionId: transfer.instructionId,
      powerId: transfer.powerId,
      expectedAction: transfer.expectedAction,
      recordsDomain: transfer.recordsDomain,
      connectedTextId: expedition.connectedTextId,
      wordId: transfer.wordId ?? null,
      bossTransferId: expedition.transfer.boss ? transfer.contextId : null,
      targetId: expedition.transfer.boss
        ? bossNovelTargetId({ wordId: transfer.wordId, bossTransferId: transfer.contextId })
        : `text:${expedition.connectedTextId}`
    });
  }
  assert.deepEqual(getContentDeckCatalogRecord("morphology", "morphology:s38:suffix_s"), {
    recordId: "morphology:s38:suffix_s", category: "morphology",
    contentId: "morphology:suffix_s:cats", targetId: null, wordId: "cats",
    morphologyId: "suffix_s", assessed: false, baseWord: "cat", ending: "s",
    meaning: "more than one", childText: "Add s to cat.", slotIds: ["morphology-slot-s38"]
  });
});

test("all transfer records own literal private three-choice decision contracts", () => {
  const bossStops = new Set(["s5", "s10", "s15", "s20", "s25", "s30", "s35", "s40"]);
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const record = getContentDeckCatalogRecord("transfer", `transfer:${expedition.stopId}`);
    assert.equal(record.decisionContract.optionTokens.length, 3);
    assert.equal(new Set(record.decisionContract.optionTokens).size, 3);
    assert.ok(record.decisionContract.optionTokens.includes(record.decisionContract.expectedToken));
    assert.equal(Object.isFrozen(record.decisionContract.optionTokens), true);
    assert.equal(Boolean(record.bossDecision), bossStops.has(expedition.stopId));
    if (record.bossDecision) {
      assert.deepEqual(record.decisionContract.optionTokens,
        record.bossDecision.options.map(option => option.token));
      assert.equal(record.bossDecision.options.every(Object.isFrozen), true);
    }
  }
});

test("one thousand fresh routes preserve introductions, eligibility, and input-order-stable ranking", () => {
  const stopById = new Map(SOUND_SEEKERS_EXPEDITIONS.map(item => [item.stopId, item.stopIndex]));
  const records = getContentDeckCatalog("heartWords");
  for (let seed = 0; seed < 1_000; seed += 1) {
    let decks = createContentDeckState();
    const first = new Map();
    const activities = new Set();
    for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
      for (const opportunity of expedition.heartWordOpportunities) {
        const binding = opportunity.contentBinding;
        const requiredActivityTypes = [...new Set(getContentDeckActionBindings(
          "heartWords", binding.contentInstanceId
        ).map(item => item.requiredActivityType))].sort();
        const candidates = records.filter(record =>
          stopById.get(record.introductionStopId) <= expedition.stopIndex
          && requiredActivityTypes.every(activity => record.eligibleActivityTypes.includes(activity)));
        const context = { category: "heartWords", slotId: binding.slotId,
          journeyStep: expedition.stopIndex, requiredActivityTypes, seed };
        assert.deepEqual(
          rankContentDeckCandidates(candidates, decks, context).map(item => item.recordId),
          rankContentDeckCandidates([...candidates].reverse(), decks, context).map(item => item.recordId)
        );
        const served = serveContentDeck(decks, {
          binding, visitId: `seed-${seed}:${binding.visitOwnerId}`,
          stopId: expedition.stopId, journeyStep: expedition.stopIndex, seed
        });
        const record = getContentDeckCatalogRecord("heartWords", served.recordId);
        if (!first.has(record.recordId)) {
          first.set(record.recordId, [expedition.stopId, binding.slotId]);
          assert.deepEqual(first.get(record.recordId), [record.introductionStopId, record.introductionSlotId]);
        }
        if (binding.requiredActivityType === "heart_part_mapping") assert.ok(record.heartParts.length);
        activities.add(binding.requiredActivityType);
        decks = recordContentDeckUse(served.nextState, served, binding);
      }
    }
    assert.equal(validContentDeckVisits(decks, "heartWords").length, 80);
    assert.equal(first.size, 60);
    assert.deepEqual(activities, new Set(["recognition", "heart_part_mapping", "encoding", "sentence_use"]));
  }
});

test("served objects rehydrate and heart resolver inputs retain canonical identity", () => {
  const binding = SOUND_SEEKERS_EXPEDITIONS[0].heartWordOpportunities[0].contentBinding;
  const served = serveContentDeck(createContentDeckState(), {
    binding, visitId: "visit:s1-heart-1", stopId: "s1", journeyStep: 1, seed: 1
  });
  const resumed = rehydrateServedContentInstance(served.nextState, {
    category: "heartWords", visitId: served.visitId
  });
  const inputs = projectBoundContentResolverInputs(resumed);
  assert.strictEqual(inputs.servedInstance, resumed);
  assert.strictEqual(inputs.catalogRecord, getContentDeckCatalogRecord("heartWords", resumed.recordId));
  assert.deepEqual(Object.keys(inputs), ["servedInstance", "catalogRecord"]);
});

test("serve and rehydrate reject a visit whose registered stop identity is forged", () => {
  const placement = CONTENT_DECK_PLACEMENTS.find(item => item.placementId === "s16-alternative");
  assert.throws(() => serveContentDeck(createContentDeckState(), {
    binding: placement.contentBinding,
    visitId: "visit:forged-stop",
    stopId: "s1",
    journeyStep: 16,
    seed: 16
  }), /stop|identity|binding/i);

  const served = serveContentDeck(createContentDeckState(), {
    binding: placement.contentBinding,
    visitId: "visit:canonical-stop",
    stopId: "s16",
    journeyStep: 16,
    seed: 16
  });
  const forged = structuredClone(served.nextState);
  forged.alternatives.visits[served.visitId].stopId = "s1";
  assert.equal(rehydrateServedContentInstance(forged, {
    category: "alternatives",
    visitId: served.visitId
  }), null);

  const duplicateVisits = structuredClone(served.nextState);
  const duplicateVisitId = `${served.visitId}:duplicate`;
  duplicateVisits.alternatives.visits[duplicateVisitId] = {
    ...duplicateVisits.alternatives.visits[served.visitId],
    visitId: duplicateVisitId
  };
  assert.throws(() => serveContentDeck(duplicateVisits, {
    binding: placement.contentBinding,
    visitId: "visit:third-claim",
    stopId: "s16",
    journeyStep: 16,
    seed: 16
  }), /already|claim|visit/i,
  "a conflicting raw tuple cannot be bypassed by the uniqueness projection");
});

test("serve rejects unsafe journey ordinals before authoring a visit", () => {
  const expedition = SOUND_SEEKERS_EXPEDITIONS[0];
  assert.throws(() => serveContentDeck(createContentDeckState(), {
    binding: expedition.heartWordOpportunities[0].contentBinding,
    visitId: "visit:unsafe-journey",
    stopId: expedition.stopId,
    journeyStep: Number.MAX_SAFE_INTEGER + 1,
    seed: 1
  }), /journey|identity|invalid/i);
});

test("same-stop heart bindings cannot reuse or record another content instance", () => {
  const expedition = SOUND_SEEKERS_EXPEDITIONS[0];
  const first = expedition.heartWordOpportunities[0].contentBinding;
  const second = expedition.heartWordOpportunities[1].contentBinding;
  const served = serveContentDeck(createContentDeckState(), {
    binding: first,
    visitId: "visit:same-stop-binding",
    stopId: expedition.stopId,
    journeyStep: expedition.stopIndex,
    seed: 1
  });
  assert.notEqual(first.contentInstanceId, second.contentInstanceId);
  assert.throws(() => serveContentDeck(served.nextState, {
    binding: second,
    visitId: served.visitId,
    stopId: expedition.stopId,
    journeyStep: expedition.stopIndex,
    seed: 1
  }), /existing|divergent|binding/i);
  assert.throws(() => recordContentDeckUse(served.nextState, served, second),
    /binding|own|visit|instance/i);
  assert.deepEqual(served.nextState.heartWords.uses, {});
});

test("rehydration and shared recording require the record's complete fixed activity keys", () => {
  const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === "s6");
  const owner = expedition.heartWordOpportunities.find(item => item.id === "s6-heart-1")
    .contentBinding;
  const shared = expedition.phases.find(phase => phase.id === "s6-primary").contentBinding;
  const served = serveContentDeck(createContentDeckState(), {
    binding: owner,
    visitId: "visit:s6-forged-and",
    stopId: "s6",
    journeyStep: 6,
    seed: 6
  });
  const andRecord = getContentDeckCatalogRecord("heartWords", "hw:and");
  const forged = structuredClone(served.nextState);
  Object.assign(forged.heartWords.visits[served.visitId], {
    recordId: andRecord.recordId,
    contentId: andRecord.contentId,
    targetId: andRecord.targetId,
    wordId: andRecord.wordId
  });
  assert.equal(rehydrateServedContentInstance(forged, {
    category: "heartWords",
    visitId: served.visitId
  }), null);
  assert.throws(() => recordContentDeckUse(forged, {
    ...served,
    recordId: andRecord.recordId,
    contentId: andRecord.contentId,
    targetId: andRecord.targetId,
    wordId: andRecord.wordId
  }, shared), /rehydrate|activity|canonical/i);

  const ownerRecorded = recordContentDeckUse(served.nextState, served, owner);
  const ownerUseId = `${served.visitId}:${owner.actionUseId}`;
  const wrongOwner = structuredClone(ownerRecorded);
  wrongOwner.heartWords.uses[ownerUseId].activityType = "recognition";
  assert.throws(() => recordContentDeckUse(wrongOwner, served, shared),
    /owner|first|canonical/i,
  "a shared action needs the exact canonical owner use, not merely its key");

  const duplicateOwnerClaim = structuredClone(ownerRecorded);
  duplicateOwnerClaim.heartWords.uses[`${ownerUseId}:duplicate`] = {
    ...duplicateOwnerClaim.heartWords.uses[ownerUseId],
    useId: `${ownerUseId}:duplicate`
  };
  assert.throws(() => recordContentDeckUse(duplicateOwnerClaim, served, owner),
    /claim|divergent|immutable/i,
  "a different entry claiming the action prevents canonical use creation or retry");
  assert.throws(() => recordContentDeckUse(duplicateOwnerClaim, served, shared),
    /owner|first|claim/i,
  "a shared action cannot bypass a duplicate-conflicted owner claim");
});

test("deck and receipt identity fields reject non-string JSON scalars", () => {
  const expedition = SOUND_SEEKERS_EXPEDITIONS[0];
  const binding = expedition.heartWordOpportunities[0].contentBinding;
  const served = serveContentDeck(createContentDeckState(), {
    binding,
    visitId: "visit:typed-identity",
    stopId: expedition.stopId,
    journeyStep: expedition.stopIndex,
    seed: 1
  });
  const usedState = recordContentDeckUse(served.nextState, served, binding);
  const visit = usedState.heartWords.visits[served.visitId];
  const use = Object.values(usedState.heartWords.uses)[0];

  for (const field of [
    "visitId", "contentInstanceId", "visitOwnerId", "ownerActionUseId",
    "slotId", "recordId", "contentId", "stopId"
  ]) {
    assert.equal(normalizeContentDeckVisit("heartWords", visit.visitId, {
      ...visit,
      [field]: 123
    }).kind, "visit_conflict", field);
  }
  for (const field of [
    "useId", "visitId", "contentInstanceId", "visitOwnerId", "actionUseId",
    "slotId", "recordId"
  ]) {
    assert.equal(normalizeContentDeckUse("heartWords", use.useId, {
      ...use,
      [field]: 123
    }).kind, "use_conflict", field);
  }

  const attemptId = "content-placement-attempt:visit:typed:s16-alternative:0:0";
  const receipt = {
    kind: "attempt_receipt",
    attemptId,
    operation: "content_placement",
    subjectId: "s16-alternative",
    decisionOrdinal: 0,
    attemptOrdinal: 0,
    inputSha256: "a".repeat(64),
    completed: false,
    correctionRecordIds: [],
    eventIds: [],
    useIds: []
  };
  for (const field of ["attemptId", "subjectId", "inputSha256"]) {
    assert.equal(normalizeAttemptReceipt(attemptId, {
      ...receipt,
      [field]: 123
    }).kind, "attempt_receipt_conflict", field);
  }

  const alternativePlacement = CONTENT_DECK_PLACEMENTS.find(
    item => item.placementId === "s16-alternative");
  const alternativeServed = serveContentDeck(createContentDeckState(), {
    binding: alternativePlacement.contentBinding,
    visitId: "visit:nullable-identity",
    stopId: "s16",
    journeyStep: 16,
    seed: 16
  });
  const alternativeVisit = alternativeServed.nextState.alternatives.visits[
    alternativeServed.visitId];
  for (const field of ["targetId", "wordId"]) {
    const missing = { ...alternativeVisit };
    delete missing[field];
    assert.equal(normalizeContentDeckVisit("alternatives", alternativeVisit.visitId, missing).kind,
      "visit_conflict", `${field}:missing`);
    for (const forged of [7, true, { id: "forged" }]) {
      assert.equal(normalizeContentDeckVisit("alternatives", alternativeVisit.visitId, {
        ...alternativeVisit,
        [field]: forged
      }).kind, "visit_conflict", `${field}:${typeof forged}`);
    }
  }
});

test("ledger outer keys must already be canonical before normalization or merge", () => {
  const expedition = SOUND_SEEKERS_EXPEDITIONS[0];
  const binding = expedition.heartWordOpportunities[0].contentBinding;
  const served = serveContentDeck(createContentDeckState(), {
    binding,
    visitId: "visit:canonical-outer-key",
    stopId: expedition.stopId,
    journeyStep: expedition.stopIndex,
    seed: 1
  });
  const used = recordContentDeckUse(served.nextState, served, binding);
  const visit = used.heartWords.visits[served.visitId];
  const use = Object.values(used.heartWords.uses)[0];
  const receiptId = "content-placement-attempt:visit:outer-key:s16-alternative:0:0";
  const receipt = {
    kind: "attempt_receipt",
    attemptId: receiptId,
    operation: "content_placement",
    subjectId: "s16-alternative",
    decisionOrdinal: 0,
    attemptOrdinal: 0,
    inputSha256: "a".repeat(64),
    completed: false,
    correctionRecordIds: [],
    eventIds: [],
    useIds: []
  };

  for (const surrounding of [" ", "\t", "\n", "\v"]) {
    const visitKey = `${surrounding}${visit.visitId}${surrounding}`;
    const useKey = `${surrounding}${use.useId}${surrounding}`;
    const receiptKey = `${surrounding}${receiptId}${surrounding}`;
    assert.equal(normalizeContentDeckVisit("heartWords", visitKey, visit), null);
    assert.equal(normalizeContentDeckUse("heartWords", useKey, use), null);
    assert.equal(normalizeAttemptReceipt(receiptKey, receipt), null);

    const dirtyDecks = {
      heartWords: { visits: { [visitKey]: visit }, uses: { [useKey]: use } }
    };
    assert.deepEqual(createContentDeckState(dirtyDecks).heartWords, { visits: {}, uses: {} });
    assert.deepEqual(mergeContentDeckState(dirtyDecks, dirtyDecks).heartWords,
      { visits: {}, uses: {} });
    assert.deepEqual(mergeAttemptReceipts(
      { [receiptKey]: receipt }, { [receiptKey]: receipt }
    ), {});
  }
});

test("deck payload whitespace and identifier ordering match the SQL canonical policy", () => {
  const visitId = "visit:whitespace-policy";
  const normalizedVisit = normalizeContentDeckVisit("alternatives", visitId, {
    kind: "visit",
    visitId,
    contentInstanceId: "\talternative-instance\n",
    visitOwnerId: " owner ",
    ownerActionUseId: "action",
    category: "alternatives",
    slotId: "slot",
    recordId: "record",
    contentId: "content",
    targetId: null,
    wordId: null,
    stopId: "s16",
    journeyStep: 16
  });
  assert.equal(normalizedVisit.contentInstanceId, "alternative-instance");
  assert.equal(normalizedVisit.visitOwnerId, "owner");

  const useId = "use:canonical-order";
  const malformed = "content-placement-attempt:b";
  const ordinalOne = "content-placement-attempt:a:subject:1:0";
  const ordinalZero = "content-placement-attempt:c:subject:0:0";
  const nonAscii = "content-placement-attempt:ä:subject:0:0";
  const normalizedUse = normalizeContentDeckUse("alternatives", useId, {
    kind: "use",
    useId,
    visitId,
    contentInstanceId: "alternative-instance",
    visitOwnerId: "owner",
    actionUseId: "action",
    category: "alternatives",
    slotId: "slot",
    recordId: "record",
    journeyStep: 16,
    attemptReceiptIds: [nonAscii, ordinalZero, malformed, ordinalOne]
  });
  assert.deepEqual(normalizedUse.attemptReceiptIds,
    [ordinalZero, nonAscii, ordinalOne, malformed],
  "every string uses one total UTF-8/C-collation order, even when malformed");
  for (const permutation of [
    [ordinalOne, malformed, ordinalZero],
    [malformed, ordinalZero, ordinalOne],
    [ordinalZero, ordinalOne, malformed]
  ]) {
    assert.deepEqual(normalizeContentDeckUse("alternatives", useId, {
      ...normalizedUse,
      attemptReceiptIds: permutation
    }).attemptReceiptIds, [ordinalZero, ordinalOne, malformed]);
  }

  const numberedAttempts = Array.from({ length: 12 }, (_, attemptOrdinal) =>
    `story-transfer-attempt:story:${attemptOrdinal}`);
  assert.deepEqual(normalizeContentDeckUse("stories", "use:numbered-attempts", {
    kind: "use",
    useId: "use:numbered-attempts",
    visitId: "visit:numbered-attempts",
    contentInstanceId: "story-instance",
    visitOwnerId: "story-owner",
    actionUseId: "story-action",
    category: "stories",
    slotId: "story-slot",
    recordId: "story-record",
    journeyStep: 1,
    attemptReceiptIds: [...numberedAttempts].reverse(),
    transactionId: "story",
    pairedUseId: "pair",
    evidenceEventId: "event",
    narrativeChoiceToken: null
  }).attemptReceiptIds, numberedAttempts,
  "attempt 10 must follow attempt 9 instead of sorting between attempts 1 and 2");

  const baseReceipt = {
    kind: "attempt_receipt",
    operation: "content_placement",
    subjectId: "subject",
    decisionOrdinal: 0,
    attemptOrdinal: 0,
    inputSha256: "a".repeat(64),
    completed: false,
    correctionRecordIds: ["ä", "z"],
    eventIds: [],
    useIds: []
  };
  const receipts = normalizeAttemptReceipts(Object.fromEntries([nonAscii, ordinalZero].map(id => [id, {
    ...baseReceipt,
    attemptId: id
  }])));
  assert.deepEqual(Object.keys(receipts), [ordinalZero, nonAscii]);
  assert.deepEqual(receipts[ordinalZero].correctionRecordIds, ["z", "ä"]);

  const blankNarrativeUse = normalizeContentDeckUse("stories", "use:blank-token", {
    kind: "use",
    useId: "use:blank-token",
    visitId: "visit:blank-token",
    contentInstanceId: "story-instance",
    visitOwnerId: "story-owner",
    actionUseId: "story-action",
    category: "stories",
    slotId: "story-slot",
    recordId: "story-record",
    journeyStep: 1,
    attemptReceiptIds: ["story-transfer-attempt:story:0"],
    transactionId: "story",
    pairedUseId: "pair",
    evidenceEventId: "event",
    narrativeChoiceToken: "\t\n"
  });
  assert.equal(blankNarrativeUse.kind, "use_conflict");
});

test("scheduler calls revalidate a mutable raw state after cache-like reuse", () => {
  const expedition = SOUND_SEEKERS_EXPEDITIONS[0];
  const binding = expedition.heartWordOpportunities[0].contentBinding;
  const served = serveContentDeck(createContentDeckState(), {
    binding,
    visitId: "visit:post-normalization-tamper",
    stopId: expedition.stopId,
    journeyStep: expedition.stopIndex,
    seed: 1
  });
  const raw = structuredClone(served.nextState);
  assert.ok(rehydrateServedContentInstance(raw, {
    category: "heartWords",
    visitId: served.visitId
  }));

  raw.heartWords.visits[served.visitId].recordId = "forged";
  const snapshot = structuredClone(raw);
  assert.equal(rehydrateServedContentInstance(raw, {
    category: "heartWords",
    visitId: served.visitId
  }), null);
  assert.throws(() => serveContentDeck(raw, {
    binding,
    visitId: served.visitId,
    stopId: expedition.stopId,
    journeyStep: expedition.stopIndex,
    seed: 1
  }), /existing|divergent|canonical/i);
  assert.throws(() => recordContentDeckUse(raw, served, binding),
    /rehydrate|canonical|visit/i);
  assert.deepEqual(raw, snapshot, "authority rejection must not heal or mutate caller state");
});

const TASK2_RUNTIME_MODULES = Object.freeze({
  heartWordRecords: "src/features/soundSeekers/content/heartWordRecords.js",
  heartWords: "src/features/soundSeekers/content/heartWords.js",
  contentDeckRecords: "src/features/soundSeekers/content/contentDeckRecords.js",
  contentDeckBindings: "src/features/soundSeekers/content/contentDeckBindings.js",
  contentDeckCatalogs: "src/features/soundSeekers/content/contentDeckCatalogs.js",
  contentDeckState: "src/features/soundSeekers/engine/contentDeckState.js",
  contentDeckScheduler: "src/features/soundSeekers/engine/contentDeckScheduler.js",
  contentDeckTransactions: "src/features/soundSeekers/engine/contentDeckTransactions.js",
  contentCoverage: "src/features/soundSeekers/engine/contentCoverage.js",
  challengeContract: "src/features/soundSeekers/engine/challengeContract.js",
  evidence: "src/features/soundSeekers/engine/evidence.js",
  evidenceEligibility: "src/features/soundSeekers/engine/evidenceEligibility.js",
  stateV2: "src/features/soundSeekers/engine/stateV2.js"
});

const TASK2_ALLOWED_IMPORT_EDGES = Object.freeze([
  "challengeContract->evidenceEligibility", "contentCoverage->contentDeckBindings",
  "contentCoverage->contentDeckCatalogs", "contentCoverage->contentDeckScheduler",
  "contentCoverage->contentDeckState", "contentDeckBindings->contentDeckRecords",
  "contentDeckBindings->expeditions", "contentDeckBindings->heartWordRecords",
  "contentDeckCatalogs->contentDeckRecords", "contentDeckCatalogs->heartWords",
  "contentDeckScheduler->contentDeckBindings", "contentDeckScheduler->contentDeckCatalogs",
  "contentDeckScheduler->contentDeckState", "contentDeckState->evidenceEligibility",
  "contentDeckTransactions->challengeContract", "contentDeckTransactions->contentDeckBindings",
  "contentDeckTransactions->contentDeckCatalogs", "contentDeckTransactions->contentCoverage",
  "contentDeckTransactions->contentDeckScheduler", "contentDeckTransactions->contentDeckState",
  "contentDeckTransactions->evidence", "contentDeckTransactions->evidenceEligibility",
  "contentDeckTransactions->expeditions", "contentDeckTransactions->instructionContracts",
  "contentDeckTransactions->questCorrection", "evidence->challengeContract",
  "evidence->audioControllerAuthority", "evidence->evidenceEligibility",
  "evidence->instructionContracts", "heartWords->evidenceEligibility",
  "heartWords->heartWordRecords", "heartWords->pronunciationLexicon",
  "stateV2->audioPreferences", "stateV2->characterCustomization", "stateV2->contentCoverage",
  "stateV2->contentDeckState", "stateV2->evidenceEligibility",
  "stateV2->sceneVisualSemantics"
]);

assert.equal(TASK2_ALLOWED_IMPORT_EDGES.length, 38);

const TASK2_EXTERNAL_IMPORT_TARGETS = Object.freeze({
  audioPreferences: "src/utils/audio/audioPreferences.js",
  audioControllerAuthority: "src/features/soundSeekers/engine/audioControllerAuthority.js",
  characterCustomization: "src/features/soundSeekers/visual/characterCustomization.js",
  expeditions: "src/features/soundSeekers/content/expeditions.js",
  instructionContracts: "src/features/soundSeekers/content/instructionContracts.js",
  pronunciationLexicon: "src/features/soundSeekers/content/pronunciationLexicon.js",
  sceneVisualSemantics: "src/features/soundSeekers/content/sceneVisualSemantics.js",
  questCorrection: "src/utils/questCorrection.js"
});

function task2ImportEdges() {
  const repositoryRoot = realpathSync(resolve("."));
  const namedPaths = new Map(Object.entries({ ...TASK2_RUNTIME_MODULES, ...TASK2_EXTERNAL_IMPORT_TARGETS })
    .map(([name, path]) => [realpathSync(resolve(path)), name]));
  const edges = new Set();
  for (const [sourceName, file] of Object.entries(TASK2_RUNTIME_MODULES)) {
    const sourcePath = realpathSync(resolve(file));
    const ast = espree.parse(readFileSync(sourcePath, "utf8"), {
      ecmaVersion: "latest", sourceType: "module", allowHashBang: true
    });
    const visit = node => {
      if (!node || typeof node !== "object") return;
      if (node.type === "ImportExpression") throw new Error("dynamic import");
      if (node.type === "CallExpression" && node.callee?.name === "require") throw new Error("CommonJS require");
      if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type)
        && node.source) {
        const specifier = node.source.value;
        assert.equal(typeof specifier === "string" && specifier.startsWith("."), true, "aliases");
        const candidate = resolve(dirname(sourcePath), specifier);
        assert.equal(extname(candidate), ".js", "explicit .js");
        assert.equal(candidate.startsWith(`${repositoryRoot}/`), true, "escape");
        assert.notEqual(basename(candidate), "index.js", "barrels");
        const targetName = namedPaths.get(realpathSync(candidate));
        assert.ok(targetName, `unknown local import ${specifier}`);
        edges.add(`${sourceName}->${targetName}`);
      }
      for (const key of espree.VisitorKeys[node.type] || []) {
        const child = node[key];
        if (Array.isArray(child)) child.forEach(visit); else visit(child);
      }
    };
    visit(ast);
  }
  return [...edges].sort();
}

test("every Task 2 runtime module obeys the exact canonical import graph", () => {
  assert.deepEqual(task2ImportEdges(), [...TASK2_ALLOWED_IMPORT_EDGES].sort());
});
