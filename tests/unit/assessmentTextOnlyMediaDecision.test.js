import assert from "node:assert/strict";
import test from "node:test";

import * as rebuild from "../../tools/assessmentRebuild/lib.mjs";
import { ASSESSMENT_ITEM_MEDIA_DECISIONS } from "../../src/content/assessments/v3/assessmentItemMediaDecisions.generated.js";

const TEXT_ONLY_ITEM_ID = "lp3.adjectives.l1.A.adj_size.v1";

function withTextOnlyDecision(run) {
  const decision = ASSESSMENT_ITEM_MEDIA_DECISIONS[TEXT_ONLY_ITEM_ID];
  const previous = { ...decision, paths: [...decision.paths] };
  Object.assign(decision, { role: "text-only", paths: [] });
  try {
    return run(decision);
  } finally {
    Object.keys(decision).forEach(key => delete decision[key]);
    Object.assign(decision, previous);
  }
}

function rawItem(overrides = {}) {
  return {
    u: "adj_size",
    lvl: 1,
    ph: 1,
    v: 1,
    fmt: "GRAMMAR_WORD_CHOICE",
    prompt: "Which word is a describing word?",
    choices: [
      { t: "large", r: "KEY", k: true },
      { t: "run", r: "D-FUNCTION-SWAP" }
    ],
    ...overrides
  };
}

function decisionContractIssues(item, decision, actualPaths) {
  assert.equal(
    typeof rebuild.mediaDecisionContractIssues,
    "function",
    "the release gate must expose one role-aware media-decision contract"
  );
  return rebuild.mediaDecisionContractIssues(item, decision, actualPaths);
}

function syncItemDecision(input) {
  assert.equal(
    typeof rebuild.syncItemMediaDecision,
    "function",
    "the sync command must use one tested item-decision transition"
  );
  return rebuild.syncItemMediaDecision(input);
}

test("expandItem keeps a text-only decision free of injected visual support", () => {
  withTextOnlyDecision(decision => {
    const item = rebuild.expandItem(
      rawItem(),
      { skillId: "adjectives", skillName: "Adjectives", itemType: "multiple_choice" },
      () => "/images/assessment/should-not-be-used.webp"
    );

    assert.equal(item.assessmentMediaDecision, decision);
    assert.equal(item.mediaTier, "text");
    assert.deepEqual(item.v3AuthoredMedia, { target: false, cards: false });
    [
      "imagePath", "imageUrl", "targetImage", "targetImagePath",
      "requiredImageAssetKey", "stimulusMediaId", "imageAlt"
    ].forEach(field => assert.equal(item[field], undefined, field));
  });
});

test("expandItem preserves audio-required media without adding a text-only image", () => {
  withTextOnlyDecision(() => {
    const item = rebuild.expandItem(
      rawItem({ media: "audio-required" }),
      { skillId: "adjectives", skillName: "Adjectives", itemType: "multiple_choice" },
      () => "/images/assessment/should-not-be-used.webp"
    );

    assert.equal(item.mediaTier, "audio-required");
    assert.equal(item.v3AuthoredMedia.target, false);
    assert.equal(item.imagePath, undefined);
  });
});

test("the gate accepts an approved text-only decision only when both path sets are empty", () => {
  const item = { id: "lp3.test.l1.A.unit.v1" };
  const decision = {
    itemId: item.id,
    role: "text-only",
    paths: [],
    constructReview: "approved",
    answerNeutral: "not-applicable-text-only"
  };

  assert.deepEqual(decisionContractIssues(item, decision, []), []);
});

test("the gate rejects paths declared or expanded for a text-only decision", () => {
  const item = { id: "lp3.test.l1.A.unit.v1", imagePath: "/images/assessment/stale.webp" };
  const decision = {
    itemId: item.id,
    role: "text-only",
    paths: ["/images/assessment/stale.webp"],
    constructReview: "approved",
    answerNeutral: "approved"
  };

  assert.deepEqual(decisionContractIssues(item, decision, decision.paths), [
    "text-only decision must declare zero image paths",
    "text-only item expands with visual media"
  ]);
});

test("the gate keeps non-text visual roles strict about explicit reviewed paths and expanded media", () => {
  const item = { id: "lp3.test.l1.A.unit.v1" };
  const decision = {
    itemId: item.id,
    role: "construct-support",
    paths: null,
    constructReview: "approved",
    answerNeutral: "approved"
  };

  assert.deepEqual(decisionContractIssues(item, decision, []), [
    "media decision paths must be an array",
    "visual media decision has no reviewed image paths",
    "item has no meaningful target, scene, answer-card, or sequence image",
    "target or scene image is missing non-answer-revealing alt text"
  ]);
});

test("the gate requires text-only decisions to declare an explicit empty paths array", () => {
  const item = { id: "lp3.test.l1.A.unit.v1" };
  const decision = {
    itemId: item.id,
    role: "text-only",
    constructReview: "approved",
    answerNeutral: "not-applicable-text-only"
  };

  assert.deepEqual(decisionContractIssues(item, decision, []), [
    "media decision paths must be an array"
  ]);
});

test("the gate rejects placeholder entries instead of treating them as paths: []", () => {
  const item = { id: "lp3.test.l1.A.unit.v1" };
  const decision = {
    itemId: item.id,
    role: "text-only",
    paths: [null],
    constructReview: "approved",
    answerNeutral: "not-applicable-text-only"
  };

  assert.deepEqual(decisionContractIssues(item, decision, []), [
    "text-only decision must declare zero image paths"
  ]);
});

test("the gate rejects stale visual alt text on a text-only decision", () => {
  const item = { id: "lp3.test.l1.A.unit.v1" };
  const decision = {
    itemId: item.id,
    role: "text-only",
    paths: [],
    alt: "Picture support for this question",
    constructReview: "approved",
    answerNeutral: "not-applicable-text-only"
  };

  assert.deepEqual(decisionContractIssues(item, decision, []), [
    "text-only decision must not retain visual alt text"
  ]);
});

test("the gate still accepts an exactly matched approved visual decision", () => {
  const assetPath = "/images/assessment/example.webp";
  const item = {
    id: "lp3.test.l1.A.unit.v1",
    imageCards: [{ image: assetPath }]
  };
  const decision = {
    itemId: item.id,
    role: "answer-cards",
    paths: [assetPath],
    constructReview: "approved",
    answerNeutral: "approved"
  };

  assert.deepEqual(decisionContractIssues(item, decision, [assetPath]), []);
});

test("sync converts explicitly non-visual authoring to text-only despite stale injected support", () => {
  const stalePath = "/images/assessment/stale-support.webp";
  const decision = {
    itemId: "lp3.test.l1.A.unit.v1",
    role: "construct-support",
    paths: [stalePath],
    alt: "Stale picture support",
    constructReview: "approved",
    answerNeutral: "approved"
  };

  assert.deepEqual(syncItemDecision({
    item: { id: decision.itemId, imagePath: stalePath },
    authoredItem: { media: "text" },
    decision,
    actualPaths: [stalePath],
    styleDecisions: {}
  }), {
    itemId: decision.itemId,
    role: "text-only",
    paths: [],
    constructReview: "approved",
    answerNeutral: "approved"
  });
});

test("sync converts authored audio-only items to text-only and clears stale visual metadata", () => {
  const stalePath = "/images/assessment/stale-audio-item-support.webp";
  const decision = {
    itemId: "lp3.test.l1.A.audio.v1",
    role: "construct-support",
    paths: [stalePath],
    alt: "Stale picture support",
    constructReview: "approved",
    answerNeutral: "approved"
  };

  assert.deepEqual(syncItemDecision({
    item: { id: decision.itemId, mediaTier: "audio-required", imagePath: stalePath },
    authoredItem: { media: "audio-required" },
    decision,
    actualPaths: [stalePath],
    styleDecisions: {}
  }), {
    itemId: decision.itemId,
    role: "text-only",
    paths: [],
    constructReview: "approved",
    answerNeutral: "approved"
  });
});

test("sync safely retains an existing text-only decision with explicit empty paths", () => {
  const decision = {
    itemId: "lp3.test.l1.A.unit.v1",
    role: "text-only",
    paths: [],
    constructReview: "approved",
    answerNeutral: "not-applicable-text-only"
  };

  assert.deepEqual(syncItemDecision({
    item: { id: decision.itemId, mediaTier: "audio-required" },
    authoredItem: { media: "audio-required" },
    decision,
    actualPaths: [],
    styleDecisions: {}
  }), decision);
});

test("sync promotes a stale text-only decision when authoring now supplies reviewed visual media", () => {
  const assetPath = "/images/assessment/reviewed-upgrade.webp";
  const decision = {
    itemId: "lp3.test.l1.A.unit.v1",
    role: "text-only",
    paths: [],
    constructReview: "approved",
    answerNeutral: "not-applicable-text-only"
  };

  assert.deepEqual(syncItemDecision({
    item: { id: decision.itemId, imageAlt: "a clear object" },
    authoredItem: { media: "image-required", img: "reviewed-upgrade" },
    decision,
    actualPaths: [assetPath],
    styleDecisions: { [assetPath]: { path: assetPath } }
  }), {
    itemId: decision.itemId,
    role: "target-or-scene",
    paths: [assetPath],
    alt: "a clear object",
    constructReview: "approved",
    answerNeutral: "approved"
  });
});

test("sync retains strict direct-review checks for visual decisions", () => {
  const assetPath = "/images/assessment/reviewed.webp";
  const decision = {
    itemId: "lp3.test.l1.A.unit.v1",
    role: "target-or-scene",
    paths: ["/images/assessment/old.webp"],
    constructReview: "approved",
    answerNeutral: "approved"
  };

  assert.deepEqual(syncItemDecision({
    item: { id: decision.itemId, imagePath: assetPath },
    authoredItem: { media: "image-required", img: "reviewed" },
    decision,
    actualPaths: [assetPath],
    styleDecisions: { [assetPath]: { path: assetPath } }
  }), {
    ...decision,
    paths: [assetPath]
  });

  assert.throws(() => syncItemDecision({
    item: { id: decision.itemId, imagePath: assetPath },
    authoredItem: { media: "image-required", img: "reviewed" },
    decision,
    actualPaths: [assetPath],
    styleDecisions: {}
  }), /uses art without direct visual approval/);
});

test("sync fails closed when text-only authoring still declares visual fields", () => {
  const decision = {
    itemId: "lp3.test.l1.A.unit.v1",
    role: "text-only",
    paths: [],
    constructReview: "approved",
    answerNeutral: "approved"
  };

  assert.throws(() => syncItemDecision({
    item: { id: decision.itemId, imagePath: "/images/assessment/conflict.webp" },
    authoredItem: { media: "text", img: "conflict" },
    decision,
    actualPaths: ["/images/assessment/conflict.webp"],
    styleDecisions: {}
  }), /declares text-only media and visual fields together/);
});
