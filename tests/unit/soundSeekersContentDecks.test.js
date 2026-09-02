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
  "evidence->evidenceEligibility", "heartWords->evidenceEligibility",
  "heartWords->heartWordRecords", "heartWords->pronunciationLexicon",
  "stateV2->contentDeckState", "stateV2->evidenceEligibility"
]);

const TASK2_EXTERNAL_IMPORT_TARGETS = Object.freeze({
  expeditions: "src/features/soundSeekers/content/expeditions.js",
  instructionContracts: "src/features/soundSeekers/content/instructionContracts.js",
  pronunciationLexicon: "src/features/soundSeekers/content/pronunciationLexicon.js",
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
