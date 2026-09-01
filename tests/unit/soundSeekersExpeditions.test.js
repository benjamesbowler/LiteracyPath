import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { QUEST_CHAPTERS } from "../../src/data/questChapters.js";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  SOUND_POWER_IDS,
  SOUND_SEEKERS_INSTRUCTIONS,
  getInstructionContract
} from "../../src/features/soundSeekers/content/instructionContracts.js";
import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import * as expeditionContent from "../../src/features/soundSeekers/content/expeditions.js";
import {
  CONNECTED_TEXT_IDS,
  CONTENT_DECK_SLOT_IDS,
  HEART_WORD_OPPORTUNITY_IDS,
  HEART_WORD_SLOT_IDS,
  MAX_DUPLICATE_COGNITIVE_SIGNATURES,
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS,
  assertSoundSeekersInteractionContexts,
  canonicalCognitiveSignature,
  resolveBoundContentDecision,
  getExpedition
} from "../../src/features/soundSeekers/content/expeditions.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { SOUND_SEEKERS_REVIEW_SOURCE_ID } from "../../src/features/soundSeekers/content/reviewSequences.js";

const PHASE_KINDS = ["arrival", "teach", "challenge", "challenge", "wonder", "transfer", "payoff"];
const V2_BOSS_STOPS = ["s5", "s10", "s15", "s20", "s25", "s30", "s35", "s40"];
const ALTERNATIVE_STOPS = new Set(["s16", "s28", "s29", "s37"]);
const MORPHOLOGY_STOPS = new Set(["s38"]);
const tuple = record => [record.instructionId, record.powerId, record.expectedAction, record.recordsDomain];
const tupleKey = record => tuple(record).join("|");

test("campaign preserves the exact 40-stop and 103-target curriculum", () => {
  assert.equal(SOUND_SEEKERS_EXPEDITIONS.length, 40);
  assert.deepEqual(SOUND_SEEKERS_EXPEDITIONS.map(item => item.stopId), QUEST_STOPS.map(item => item.id));
  assert.equal(new Set(QUEST_STOPS.flatMap(stop => stop.teach.map(item => item.id))).size, 103);

  for (const [index, expedition] of SOUND_SEEKERS_EXPEDITIONS.entries()) {
    assert.deepEqual(expedition.teach.targetIds, QUEST_STOPS[index].teach.map(item => item.id));
  }

  for (const stopId of ["s8", "s17"]) {
    const teach = getExpedition(stopId).teach;
    assert.equal(teach.mode, "review");
    assert.deepEqual(teach.targetIds, []);
    assert.equal(teach.reviewSourceId, SOUND_SEEKERS_REVIEW_SOURCE_ID);
    assert.equal(Object.hasOwn(teach, "reviewTargetIds"), false, `${stopId}: no fixed review focus`);
    for (const phase of getExpedition(stopId).phases.filter(item => item.kind === "challenge")) {
      assert.equal(Object.hasOwn(phase, "targetIds"), false, `${phase.id}: mission resolves adaptive target`);
    }
  }
});

test("the eight feature-local chapter deltas enrich each legacy identity exactly once", () => {
  assert.equal(SOUND_SEEKERS_CHAPTERS.length, 8);
  assert.deepEqual(SOUND_SEEKERS_CHAPTERS.map(chapter => chapter.id), QUEST_CHAPTERS.map(chapter => chapter.id));

  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const legacy = QUEST_CHAPTERS.find(item => item.id === chapter.id);
    assert.strictEqual(chapter.cast, legacy.cast);
    assert.strictEqual(chapter.chapterReward, legacy.chapterReward);
    assert.equal(chapter.title, legacy.title);
    assert.deepEqual(chapter.stopIds, legacy.stopIds);
    assert.equal(chapter.repairBeatIds.length, 5);
    assert.equal(new Set(chapter.repairBeatIds).size, 5);
    assert.ok(chapter.wonderId);
    assert.ok(chapter.bossTransferId);
    assert.equal(chapter.biomeKitId, chapter.id);
    assert.equal(Object.isFrozen(chapter), true);
  }
});

test("every expedition publishes five-category slots and two standalone resume-safe heart-word opportunities", () => {
  assert.equal(HEART_WORD_SLOT_IDS.length, 80);
  assert.equal(HEART_WORD_OPPORTUNITY_IDS.length, 80);
  assert.equal(CONNECTED_TEXT_IDS.length, 40);
  assert.equal(new Set(HEART_WORD_SLOT_IDS).size, 80);
  assert.equal(new Set(HEART_WORD_OPPORTUNITY_IDS).size, 80);
  assert.equal(new Set(CONNECTED_TEXT_IDS).size, 40);
  assert.deepEqual(Object.keys(CONTENT_DECK_SLOT_IDS), ["heartWords", "stories", "alternatives", "morphology", "transfer"]);

  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    assert.deepEqual(expedition.phases.map(phase => phase.kind), PHASE_KINDS);
    assert.deepEqual(expedition.heartWordSlotIds, [
      `heart-slot-${expedition.stopId}-1`,
      `heart-slot-${expedition.stopId}-2`
    ]);
    assert.deepEqual(expedition.contentDeckSlotIds.heartWords, expedition.heartWordSlotIds);
    assert.deepEqual(expedition.contentDeckSlotIds.stories, [`story-slot-${expedition.stopId}`]);
    assert.deepEqual(expedition.contentDeckSlotIds.transfer, [`transfer-slot-${expedition.stopId}`]);
    assert.deepEqual(
      expedition.contentDeckSlotIds.alternatives,
      ALTERNATIVE_STOPS.has(expedition.stopId) ? [`alternative-slot-${expedition.stopId}`] : []
    );
    assert.deepEqual(
      expedition.contentDeckSlotIds.morphology,
      MORPHOLOGY_STOPS.has(expedition.stopId) ? [`morphology-slot-${expedition.stopId}`] : []
    );
    assert.equal(expedition.connectedTextId, `scene-${expedition.stopId}`);
    assert.equal(expedition.heartWordOpportunities.length, 2);
    assert.deepEqual(expedition.heartWordOpportunities.map(item => item.slotId), expedition.heartWordSlotIds);
    assert.deepEqual(expedition.heartWordOpportunities.map(item => item.afterPhaseId), expedition.stopId === "s6"
      ? ["s6-teach", "s6-secondary"]
      : [`${expedition.stopId}-primary`, `${expedition.stopId}-secondary`]);
    assert.deepEqual(expedition.resume.safeContentOpportunityIds, expedition.heartWordOpportunities.map(item => item.id));

    for (const [index, opportunity] of expedition.heartWordOpportunities.entries()) {
      assert.equal(opportunity.id, `${expedition.stopId}-heart-${index + 1}`);
      assert.equal(opportunity.kind, "content_opportunity");
      assert.equal(opportunity.category, "heartWords");
      assert.equal(expedition.phases.some(phase => phase.id === opportunity.afterPhaseId), true);
      assert.deepEqual(tuple(opportunity), [
        "memory-delivery-deliver-heart-word",
        "memory_delivery",
        "deliver_heart_word_cue",
        "heart_word_mapping"
      ]);
      assert.deepEqual(opportunity.allowedActivityTypes, [
        "recognition", "heart_part_mapping", "encoding", "sentence_use"
      ]);
    }

    for (const challenge of expedition.phases.filter(phase => phase.kind === "challenge")) {
      assert.equal((challenge.contentSlotIds || []).some(id => expedition.heartWordSlotIds.includes(id)), false);
    }
    assert.equal(expedition.phases.find(phase => phase.kind === "transfer").connectedTextId, expedition.connectedTextId);
    assert.equal(expedition.resume.safePhaseIds.includes(`${expedition.stopId}-wonder`), false);
    assert.equal(expedition.naturalStop, true);
    assert.equal(Object.isFrozen(expedition), true);
  }

  assert.deepEqual(CONTENT_DECK_SLOT_IDS.heartWords, HEART_WORD_SLOT_IDS);
  assert.deepEqual(CONTENT_DECK_SLOT_IDS.stories, SOUND_SEEKERS_EXPEDITIONS.flatMap(item => item.contentDeckSlotIds.stories));
  assert.deepEqual(CONTENT_DECK_SLOT_IDS.transfer, SOUND_SEEKERS_EXPEDITIONS.flatMap(item => item.contentDeckSlotIds.transfer));
});

test("all twelve foundation decision tuples are authored and copied exactly at every use", () => {
  const required = Object.values(SOUND_SEEKERS_INSTRUCTIONS)
    .filter(contract => contract.phase === "decision")
    .map(tupleKey)
    .sort();
  const authoredActions = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => [
    ...expedition.phases,
    ...expedition.heartWordOpportunities
  ]).filter(item => item.powerId);
  const authored = [...new Set(authoredActions.map(tupleKey))].sort();
  assert.deepEqual(authored, required);

  for (const action of authoredActions) {
    const contract = getInstructionContract(action.instructionId);
    assert.ok(contract, action.instructionId);
    assert.deepEqual(tuple(action), tuple(contract), action.id);
  }

  const contrastVariants = authoredActions.filter(item => item.powerId === SOUND_POWER_IDS.CONTRAST_SORT);
  const memoryVariants = authoredActions.filter(item => item.powerId === SOUND_POWER_IDS.MEMORY_DELIVERY);
  assert.equal(new Set(contrastVariants.map(tupleKey)).size, 3);
  assert.equal(new Set(memoryVariants.map(tupleKey)).size, 4);
});

test("heart-word decision tuples resolve the canonical full served and catalog objects", () => {
  const expedition = getExpedition("s6");
  const heartSort = expedition.phases.find(action => action.instructionId === "contrast-sort-place-heart-word");
  const sharedOpportunity = expedition.heartWordOpportunities.find(opportunity => opportunity.id === "s6-heart-1");

  assert.ok(heartSort);
  assert.deepEqual(heartSort.contentBinding, {
    category: "heartWords",
    slotId: "heart-slot-s6-1",
    contentInstanceId: "heart-content-instance:heart-slot-s6-1",
    visitOwnerId: "s6-heart-1",
    actionUseId: "s6-primary:content-use",
    requiredActivityType: "heart_part_mapping",
    isVisitOwner: false
  });
  assert.ok(expedition.contentDeckSlotIds.heartWords.includes(heartSort.contentBinding.slotId));
  assert.ok(sharedOpportunity, "shared slot must name one coherent mission content instance");
  assert.equal(sharedOpportunity.afterPhaseId, "s6-teach");
  assert.equal(sharedOpportunity.contentBinding.visitOwnerId, sharedOpportunity.id);
  assert.equal(sharedOpportunity.contentBinding.actionUseId, "s6-heart-1:content-use");
  assert.equal(sharedOpportunity.contentBinding.isVisitOwner, true);
  assert.notEqual(sharedOpportunity.contentBinding.actionUseId, heartSort.contentBinding.actionUseId);
  assert.notEqual(sharedOpportunity.contentBinding.requiredActivityType, heartSort.contentBinding.requiredActivityType);
  assert.doesNotThrow(() => expeditionContent.assertExpeditionContentOwnership(expedition));

  const answerTokensByActivity = {
    recognition: "the",
    heart_part_mapping: "heart-unit-1",
    encoding: "t-h-e",
    sentence_use: "the bee rests"
  };
  const servedInstance = {
    category: "heartWords",
    slotId: heartSort.contentBinding.slotId,
    contentInstanceId: heartSort.contentBinding.contentInstanceId,
    visitId: "visit:s6-heart-1:attempt-1",
    visitOwnerId: "s6-heart-1",
    ownerActionUseId: "s6-heart-1:content-use",
    recordId: "hw:the",
    contentId: "heart-word:the",
    targetId: "hw:the",
    wordId: "the",
    stopId: "s6",
    journeyStep: 6,
    eligibleActivityTypes: ["recognition", "heart_part_mapping", "encoding", "sentence_use"],
    answerTokensByActivity,
    ownerActivityType: "encoding",
    nextState: {
      heartWords: {
        visits: {
          "visit:s6-heart-1:attempt-1": {
            visitId: "visit:s6-heart-1:attempt-1",
            recordId: "hw:the"
          }
        },
        uses: {}
      }
    }
  };
  const catalogRecord = {
    category: "heartWords",
    recordId: "hw:the",
    contentId: "heart-word:the",
    targetId: "hw:the",
    wordId: "the",
    display: "the",
    pronunciationId: "the",
    meaningId: "the-meaning",
    regularParts: [],
    heartParts: [0, 1],
    introductionStopId: "s3",
    introductionSlotId: "heart-slot-s3-2",
    slotIds: ["heart-slot-s3-2"],
    eligibleActivityTypes: ["recognition", "heart_part_mapping", "encoding", "sentence_use"],
    answerTokensByActivity
  };
  const ownerUse = resolveBoundContentDecision(sharedOpportunity, { servedInstance, catalogRecord });
  const contrastUse = resolveBoundContentDecision(heartSort, { servedInstance, catalogRecord });
  assert.equal(ownerUse.visitId, "visit:s6-heart-1:attempt-1");
  assert.equal(contrastUse.visitId, ownerUse.visitId);
  assert.equal(contrastUse.contentInstanceId, ownerUse.contentInstanceId);
  assert.equal(ownerUse.actionUseId, "s6-heart-1:content-use");
  assert.equal(contrastUse.actionUseId, "s6-primary:content-use");
  assert.equal(ownerUse.activityType, sharedOpportunity.activityFocus);
  assert.equal(contrastUse.activityType, "heart_part_mapping");
  assert.equal(contrastUse.expectedToken, "heart-unit-1");

  const unbound = { ...heartSort };
  delete unbound.contentBinding;
  assert.throws(
    () => resolveBoundContentDecision(unbound, { servedInstance, catalogRecord }),
    /content binding/i,
    "a tuple-only shell must never resolve as a heart-word decision"
  );
  assert.throws(
    () => resolveBoundContentDecision(heartSort, {
      servedInstance: { ...servedInstance, slotId: "heart-slot-s7-1" },
      catalogRecord
    }),
    /slot/i
  );
  assert.throws(
    () => resolveBoundContentDecision(heartSort, {
      servedInstance,
      catalogRecord: { ...catalogRecord, contentId: "heart-word:they" }
    }),
    /contentId/i
  );
  assert.throws(
    () => resolveBoundContentDecision(heartSort, {
      servedInstance: { ...servedInstance, unsafeAnswerOverride: "second-serve" },
      catalogRecord
    }),
    /canonical served instance shape/i
  );
  assert.throws(
    () => resolveBoundContentDecision(heartSort, {
      servedInstance,
      catalogRecord: { ...catalogRecord, unreviewedTeacherAnswer: "the" }
    }),
    /canonical catalog record shape/i
  );
  assert.throws(
    () => resolveBoundContentDecision(sharedOpportunity, {
      servedInstance: { ...servedInstance, ownerActivityType: "heart_part_mapping" },
      catalogRecord
    }),
    /owner activity/i,
    "the scheduled owner subtype remains distinct from the shared action subtype"
  );
  assert.throws(
    () => resolveBoundContentDecision(heartSort, {
      servedInstance: { ...servedInstance, ownerActivityType: "recognition" },
      catalogRecord
    }),
    /canonical owner activity/i,
    "a shared use must validate the served subtype against its named visit owner"
  );
  assert.throws(
    () => resolveBoundContentDecision(heartSort, {
      servedInstance: { ...servedInstance, ownerActionUseId: "s6-heart-2:content-use" },
      catalogRecord
    }),
    /owner action/i,
    "a shared use must validate the served owner-use id against its named visit owner"
  );

  const wrongNamedOwnerAction = {
    ...heartSort,
    contentBinding: {
      ...heartSort.contentBinding,
      visitOwnerId: "s6-heart-2"
    }
  };
  assert.throws(
    () => resolveBoundContentDecision(wrongNamedOwnerAction, {
      servedInstance: {
        ...servedInstance,
        visitOwnerId: "s6-heart-2",
        ownerActionUseId: "s6-heart-2:content-use",
        ownerActivityType: "heart_part_mapping"
      },
      catalogRecord
    }),
    /canonical visit owner/i,
    "a self-consistent fabricated owner ID must not replace the expedition owner binding"
  );

  const doubleOwner = {
    ...expedition,
    phases: expedition.phases.map(phase => phase.id === heartSort.id
      ? { ...phase, contentBinding: { ...phase.contentBinding, isVisitOwner: true } }
      : phase)
  };
  assert.throws(
    () => expeditionContent.assertExpeditionContentOwnership(doubleOwner),
    /one visit owner/i,
    "one shared instance must schedule one visit, never two serves"
  );
});

test("heart-word opportunities author an audited twenty-by-four compatibility matrix", () => {
  const opportunities = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.heartWordOpportunities);
  const contexts = opportunities.map(opportunity => SOUND_SEEKERS_INTERACTION_CONTEXTS[opportunity.contextId]);
  const activityCounts = opportunities.reduce((counts, opportunity) => {
    counts[opportunity.activityFocus] = (counts[opportunity.activityFocus] || 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(activityCounts, {
    recognition: 20,
    heart_part_mapping: 20,
    encoding: 20,
    sentence_use: 20
  });
  assert.equal(new Set(contexts.map(canonicalCognitiveSignature)).size, 80);
  assert.equal(new Set(contexts.map(context => [
    context.activityFocus,
    context.decisionModel,
    context.inputPattern,
    context.failureOrCorrectionModel,
    context.learningConsequenceModel
  ].join("|"))).size, 80);
  assert.equal(new Set(contexts.map(context => context.semanticRule)).size, 80);
  assert.equal(new Set(contexts.map(context => context.consequence)).size, 80);
  const mechanicActivities = new Map();

  for (const opportunity of opportunities) {
    const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[opportunity.contextId];
    for (const field of [
      "activityFocus",
      "decisionModel",
      "inputPattern",
      "failureOrCorrectionModel",
      "learningConsequenceModel"
    ]) assert.ok(context[field], `${opportunity.id}: ${field}`);
    assert.equal(opportunity.contentBinding.category, "heartWords");
    assert.equal(opportunity.contentBinding.slotId, opportunity.slotId);
    assert.equal(opportunity.contentBinding.requiredActivityType, opportunity.activityFocus);
    assert.equal(opportunity.contentBinding.contentInstanceId, `heart-content-instance:${opportunity.slotId}`);
    assert.ok(context.childDecision.trim().split(/\s+/u).length <= 6, opportunity.id);
    assert.doesNotMatch(context.childDecision, /,|\b(?:and|then)\b/iu, opportunity.id);
    assert.doesNotThrow(() => expeditionContent.assertHeartWordInteractionCompatibility(context), opportunity.id);
    const activities = mechanicActivities.get(context.mechanicFamilyId) || new Set();
    activities.add(context.activityFocus);
    mechanicActivities.set(context.mechanicFamilyId, activities);
  }
  assert.equal(mechanicActivities.size, 20);
  for (const activities of mechanicActivities.values()) {
    assert.deepEqual([...activities].sort(), [
      "encoding", "heart_part_mapping", "recognition", "sentence_use"
    ]);
  }

  const expectedConstructs = {
    recognition: "whole_word_identity",
    heart_part_mapping: "irregular_unit_location",
    encoding: "ordered_word_spelling",
    sentence_use: "connected_sentence_completion"
  };
  for (const context of contexts) {
    const expected = expectedConstructs[context.activityFocus];
    assert.equal(context.contentCategory, "heartWords", context.id);
    assert.equal(context.evidenceConstruct, expected, context.id);
    assert.deepEqual([
      context.decisionConstruct,
      context.inputConstruct,
      context.correctionConstruct,
      context.physicalActionConstruct
    ], [expected, expected, expected, expected], context.id);
  }

  for (const opportunityId of ["s9-heart-1", "s25-heart-1", "s37-heart-1"]) {
    const opportunity = opportunities.find(item => item.id === opportunityId);
    const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[opportunity.contextId];
    assert.equal(context.activityFocus, "recognition", opportunityId);
    assert.equal(context.physicalActionConstruct, "whole_word_identity", opportunityId);
    assert.equal(context.evidenceConstruct, "whole_word_identity", opportunityId);
    assert.equal(context.childDecision, "Find the same word.", opportunityId);
  }

  for (const [opportunityId, oldIncoherentPhysicalAction] of [
    ["s9-heart-1", "turn two memory cards"],
    ["s25-heart-1", "fit one part into the frame"],
    ["s37-heart-1", "replace one incorrect part"]
  ]) {
    const originalContext = SOUND_SEEKERS_INTERACTION_CONTEXTS[
      opportunities.find(item => item.id === opportunityId).contextId
    ];
    const incoherent = {
      ...originalContext,
      physicalExpression: oldIncoherentPhysicalAction,
      physicalActionRoles: [oldIncoherentPhysicalAction]
    };
    incoherent.cognitiveSignature = canonicalCognitiveSignature(incoherent);
    assert.throws(
      () => expeditionContent.assertHeartWordInteractionCompatibility(incoherent),
      /one recognition action/i,
      `${opportunityId}: the former reskinned action must not pass as whole-word recognition`
    );
  }

  const s25Recognition = SOUND_SEEKERS_INTERACTION_CONTEXTS[
    opportunities.find(item => item.id === "s25-heart-1").contextId
  ];
  const contaminated = {
    ...s25Recognition,
    inputConstruct: "ordered_word_spelling"
  };
  contaminated.cognitiveSignature = canonicalCognitiveSignature(contaminated);
  assert.throws(
    () => expeditionContent.assertHeartWordInteractionCompatibility(contaminated),
    /single recognition construct/i
  );
  const wrongCategory = {
    ...s25Recognition,
    contentCategory: "stories"
  };
  wrongCategory.cognitiveSignature = canonicalCognitiveSignature(wrongCategory);
  assert.throws(
    () => expeditionContent.assertHeartWordInteractionCompatibility(wrongCategory),
    /cannot cross content categories/i
  );

  const visibleReference = SOUND_SEEKERS_INTERACTION_CONTEXTS[
    opportunities.find(item => item.id === "s1-heart-1").contextId
  ];
  const coveredDelay = SOUND_SEEKERS_INTERACTION_CONTEXTS[
    opportunities.find(item => item.id === "s3-heart-1").contextId
  ];
  const relabelledFamily = {
    ...visibleReference,
    mechanicFamilyId: "covered-delay"
  };
  relabelledFamily.cognitiveSignature = canonicalCognitiveSignature(relabelledFamily);
  assert.equal(
    relabelledFamily.cognitiveSignature,
    visibleReference.cognitiveSignature,
    "nominal mechanic-family labels must not make semantic clones look different"
  );
  assert.throws(
    () => expeditionContent.assertHeartWordInteractionCompatibility(relabelledFamily),
    /authored matrix row/i,
    "a valid family name may not relabel another family's mechanics"
  );

  const swappedMatrixRow = {
    ...visibleReference,
    decisionModel: coveredDelay.decisionModel,
    inputPattern: coveredDelay.inputPattern,
    failureOrCorrectionModel: coveredDelay.failureOrCorrectionModel,
    learningConsequenceModel: coveredDelay.learningConsequenceModel,
    mechanicRoles: coveredDelay.mechanicRoles,
    physicalActionRoles: coveredDelay.physicalActionRoles,
    physicalExpression: coveredDelay.physicalExpression
  };
  swappedMatrixRow.cognitiveSignature = canonicalCognitiveSignature(swappedMatrixRow);
  assert.throws(
    () => expeditionContent.assertHeartWordInteractionCompatibility(swappedMatrixRow),
    /authored matrix row/i,
    "a context may not borrow the semantic row of another mechanic family"
  );

  for (const wrongRecognitionAction of [
    "build the heart word",
    "place the word in the sentence"
  ]) {
    const physicalCrossConstruct = {
      ...visibleReference,
      physicalExpression: wrongRecognitionAction,
      physicalActionRoles: [wrongRecognitionAction]
    };
    physicalCrossConstruct.cognitiveSignature = canonicalCognitiveSignature(physicalCrossConstruct);
    assert.throws(
      () => expeditionContent.assertHeartWordInteractionCompatibility(physicalCrossConstruct),
      /authored matrix row/i,
      `recognition may not masquerade as ${wrongRecognitionAction}`
    );
  }

  for (const [field, suffix] of [
    ["physicalExpression", " while spell the word"],
    ["semanticRule", " Spell the word before accepting the match."],
    ["consequence", " The child also builds the spelling."]
  ]) {
    const appendedCrossConstruct = {
      ...visibleReference,
      [field]: `${visibleReference[field]}${suffix}`
    };
    appendedCrossConstruct.cognitiveSignature = canonicalCognitiveSignature(appendedCrossConstruct);
    assert.equal(appendedCrossConstruct.cognitiveSignature, visibleReference.cognitiveSignature);
    assert.throws(
      () => expeditionContent.assertHeartWordInteractionCompatibility(appendedCrossConstruct),
      /authored matrix row/i,
      `${field} may not append a second construct outside the authored matrix row`
    );
  }

  const original = contexts[0];
  const reskinned = {
    ...original,
    id: "renamed-across-another-chapter",
    objectIds: ["moon-trolley", "silver-label"],
    objectRoles: ["moon trolley", "silver label"],
    recipientId: "Nova",
    recipientRole: "star porter",
    consequenceId: "moon-trolley-glows"
  };
  reskinned.cognitiveSignature = canonicalCognitiveSignature(reskinned);
  assert.equal(reskinned.cognitiveSignature, original.cognitiveSignature);
  assert.throws(
    () => assertSoundSeekersInteractionContexts([
      original,
      reskinned,
      { ...reskinned, id: "renamed-across-a-third-chapter" }
    ]),
    /cognitive signature/i
  );
});

test("each authored action resolves a meaningful interaction record and cognitive recipes cannot hide behind renamed contexts", () => {
  assert.doesNotThrow(() => assertSoundSeekersInteractionContexts(SOUND_SEEKERS_INTERACTION_CONTEXTS));
  const actionContexts = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => [
    ...expedition.phases.filter(phase => ["challenge", "transfer"].includes(phase.kind)),
    ...expedition.heartWordOpportunities
  ]);

  for (const action of actionContexts) {
    const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId];
    assert.ok(context, action.contextId);
    assert.equal(context.id, action.contextId);
    assert.ok(context.semanticRule);
    assert.ok(context.childDecision);
    assert.ok(context.objectRoles.length > 0 || context.recipientRole);
    assert.ok(context.physicalExpression);
    assert.ok(context.consequence);
    assert.ok(context.cognitiveSignature);
    assert.equal(context.cognitiveSignature, canonicalCognitiveSignature(context));
    assert.equal(action.configurationId, `${action.id}-configuration`);
  }

  const signatureCounts = Object.values(SOUND_SEEKERS_INTERACTION_CONTEXTS).reduce((counts, context) => {
    counts.set(context.cognitiveSignature, (counts.get(context.cognitiveSignature) || 0) + 1);
    return counts;
  }, new Map());
  assert.equal(MAX_DUPLICATE_COGNITIVE_SIGNATURES, 2);
  assert.ok(Math.max(...signatureCounts.values()) <= MAX_DUPLICATE_COGNITIVE_SIGNATURES);

  const original = Object.values(SOUND_SEEKERS_INTERACTION_CONTEXTS)[0];
  const opaqueCopies = ["another-chapter-a", "another-chapter-b", "another-chapter-c"].map((id, index) => {
    const renamed = { ...original, id, chapterId: `chapter-${index}`, stopId: `s${index + 1}` };
    return { ...renamed, cognitiveSignature: canonicalCognitiveSignature(renamed) };
  });
  assert.throws(
    () => assertSoundSeekersInteractionContexts(opaqueCopies),
    /cognitive signature/i
  );
});

test("all 200 child decisions are visible one-imperative steps", () => {
  const immediateActionStart = /^(?:hear|listen|find|choose|place|build|blend|read|carry|deliver|sort|match|tap|finish|set|follow|remember|put|inspect|perform|move|select|write|spell|complete|mark|cover|reveal|trace|drag|turn|point|say|uncover|step|send|guide|make|fill)\b/iu;
  assert.equal(Object.values(SOUND_SEEKERS_INTERACTION_CONTEXTS).length, 200);
  for (const context of Object.values(SOUND_SEEKERS_INTERACTION_CONTEXTS)) {
    const words = context.childDecision.trim().split(/\s+/u);
    assert.ok(words.length <= 12, `${context.id}: ${words.length} words`);
    assert.ok(Array.isArray(context.decisionSteps) && context.decisionSteps.length > 0, `${context.id}: visible steps`);
    assert.equal(context.childDecision, context.decisionSteps[0], `${context.id}: current step`);
    for (const step of context.decisionSteps) {
      assert.doesNotMatch(step, /,|;|\b(?:and|then)\b/iu, `${context.id}: ${step}`);
      assert.doesNotMatch(step, /^(?:move|find|choose|place|carry|deliver|sort|match|build|blend|read|perform|turn)\.$/iu, `${context.id}: ${step}`);
      assert.match(step, immediateActionStart, `${context.id}: ${step}`);
      assert.equal(step.match(/[.!?]/gu)?.length || 0, 1, `${context.id}: ${step}`);
      assert.ok(step.trim().split(/\s+/u).length <= 12, `${context.id}: ${step}`);
    }
  }

  const original = Object.values(SOUND_SEEKERS_INTERACTION_CONTEXTS)[0];
  for (const compoundDecision of [
    "Blend the word and choose its picture.",
    "Blend the word. Choose its picture."
  ]) {
    const compound = {
      ...original,
      id: `compound-${compoundDecision.length}`,
      childDecision: compoundDecision,
      decisionSteps: [compoundDecision]
    };
    compound.cognitiveSignature = canonicalCognitiveSignature(compound);
    assert.throws(
      () => assertSoundSeekersInteractionContexts([compound]),
      /one immediate action/i
    );
  }
});

test("expedition authoring uses concrete configurations instead of modulo recipes", () => {
  const source = readFileSync(
    new URL("../../src/features/soundSeekers/content/expeditions.js", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /POWER_ROTATION|blueprintIndex\s*%|stop\.index\s*%/u);
  assert.doesNotMatch(source, /segmentWord|evidenceTargetFor/u);
});

test("authored challenge and boss units never outrun the curriculum", () => {
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const taughtThroughStop = new Set(QUEST_STOPS
      .filter(stop => stop.index <= expedition.stopIndex)
      .flatMap(stop => stop.teach.map(item => item.id)));
    const claimed = expedition.phases.flatMap(phase => [
      ...(phase.targetIds || []),
      ...(phase.unitTargetIds || [])
    ]);
    for (const targetId of claimed) assert.ok(taughtThroughStop.has(targetId), `${expedition.stopId}:${targetId}`);

    for (const phase of expedition.phases.filter(item => item.wordId)) {
      const pronunciation = getPronunciation(phase.wordId);
      assert.ok(pronunciation, `${expedition.stopId}:${phase.wordId}`);
      const authoredEvidenceTargets = pronunciation.units.map(unit => unit.evidenceTargetId);
      assert.ok(authoredEvidenceTargets.every(Boolean), `${phase.wordId}: explicit evidenceTargetId`);
      assert.deepEqual(phase.unitTargetIds, authoredEvidenceTargets);
      assert.equal(
        new Set(pronunciation.units.flatMap(unit => unit.letterIndices)).size,
        pronunciation.word.length,
        `${phase.wordId}: printed-letter coverage`
      );
    }
  }

  assert.equal(getExpedition("s39").phases.find(phase => phase.id === "s39-secondary").wordId, "little");
  assert.equal(getExpedition("s40").phases.find(phase => phase.id === "s40-secondary").wordId, "fiction");
  const assessed = new Set(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases.map(phase => phase.wordId).filter(Boolean)));
  assert.equal(assessed.has("table"), false);
  assert.equal(assessed.has("station"), false);
});

test("each biome gives its literacy Wonder one concrete visual representation", () => {
  const representations = SOUND_SEEKERS_CHAPTERS.map(chapter => {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.chapterId === chapter.id);
    assert.equal(expedition.wonder.id, chapter.wonderId);
    assert.doesNotMatch(expedition.wonder.representation, /generic|literacy-transformation/u);
    return expedition.wonder.representation;
  });
  assert.equal(new Set(representations).size, 8);
});

test("each fifth stop is the v2 transfer boss without changing legacy boss flags", () => {
  assert.deepEqual(SOUND_SEEKERS_EXPEDITIONS.filter(item => item.transfer.boss).map(item => item.stopId), V2_BOSS_STOPS);
  assert.deepEqual(QUEST_STOPS.filter(item => item.boss).map(item => item.id), ["s8", "s17", "s40"]);

  for (const stopId of V2_BOSS_STOPS) {
    const expedition = getExpedition(stopId);
    const curriculumStop = QUEST_STOPS.find(stop => stop.id === stopId);
    const transfer = expedition.phases.find(phase => phase.kind === "transfer");
    const secondary = expedition.phases.find(phase => phase.id === `${stopId}-secondary`);
    const chapter = SOUND_SEEKERS_CHAPTERS.find(item => item.id === expedition.chapterId);
    assert.equal(transfer.recordsDomain, "novel_decoding");
    assert.equal(transfer.contextId, chapter.bossTransferId);
    assert.ok(transfer.wordId);
    assert.ok(curriculumStop.words.includes(transfer.wordId), `${stopId}:${transfer.wordId}`);
    assert.notEqual(transfer.wordId, secondary.wordId);
    assert.deepEqual(transfer.unitTargetIds, getPronunciation(transfer.wordId).units.map(unit => unit.evidenceTargetId));
    assert.equal(expedition.transfer.imaginary, false);
  }
});
