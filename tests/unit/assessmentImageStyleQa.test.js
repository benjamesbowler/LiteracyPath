import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import {
  assessmentImageStyleBlocklist,
  assessmentImageStyleBlockedPaths
} from "../../src/data/assessmentImageStyleBlocklist.js";
import {
  INITIAL_SOUND_LETTERS,
  initialSoundWordBank
} from "../../src/content/initialSounds/initialSoundWordBank.js";
import { isInitialSoundRuntimeEligible } from "../../src/content/initialSounds/initialSoundMediaEligibility.js";
import { findAssessmentMediaCandidates } from "../../src/data/assessmentMediaRegistry.js";
import {
  buildMediaQaRecords,
  isMediaQaRuntimeAllowed
} from "../../src/data/mediaQaManifest.js";
import { SENTENCE_COMPREHENSION_SCORING_SCENES } from "../../src/content/assessments/v3/assessmentSceneMediaDecisions.js";
import {
  ASSESSMENT_IMAGE_STYLE_DECISIONS,
  BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS,
  OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS
} from "../../src/content/assessments/v3/assessmentImageStyleDecisions.js";
import { ASSESSMENT_ITEM_MEDIA_DECISIONS } from "../../src/content/assessments/v3/assessmentItemMediaDecisions.generated.js";
import {
  ASSESSMENT_IMAGE_REVIEW_EVIDENCE_VERSION,
  ASSESSMENT_REJECTED_IMAGE_HASHES,
  ASSESSMENT_REVIEWED_REPLACEMENT_HASHES
} from "../../src/content/assessments/v3/assessmentImageReviewPolicy.js";

const projectRoot = path.resolve(import.meta.dirname, "..", "..");

const knownRegressions = [
  "/media/initial-sounds/images/c/cake.webp",
  "/media/initial-sounds/images/b/bus.webp",
  "/images/child-mode/initial-sounds/bag.png",
  "/images/child-mode/initial-sounds/wig.png"
];

test("known anthropomorphic and rainbow-styled assessment images stay quarantined", () => {
  assert.equal(assessmentImageStyleBlockedPaths.size, assessmentImageStyleBlocklist.length);
  knownRegressions.forEach(assetPath => {
    assert.equal(assessmentImageStyleBlockedPaths.has(assetPath), true, assetPath);
    assert.equal(isMediaQaRuntimeAllowed(assetPath, "image"), false, assetPath);
  });
});

test("the media QA review surface exposes the human rejection reason", () => {
  const records = buildMediaQaRecords();
  const cake = records.find(record => record.filePath === "/media/initial-sounds/images/c/cake.webp");
  assert.equal(cake?.status, "rejected");
  assert.equal(cake?.rejectionReason, "face_on_inanimate_object");
  assert.equal(cake?.reviewedAt, "2026-07-18");
});

test("clean Initial Sounds replacements remain runtime eligible", () => {
  const expected = {
    bus: "/images/child-mode/initial-sounds/bus.png",
    cake: "/images/child-mode/initial-sounds/cake.png",
    car: "/images/child-mode/initial-sounds/car.png",
    sock: "/images/child-mode/initial-sounds/sock.png",
    star: "/images/child-mode/initial-sounds/star.png"
  };

  Object.entries(expected).forEach(([targetWord, imageUrl]) => {
    const item = initialSoundWordBank.find(row => row.targetWord === targetWord);
    assert.ok(item, targetWord);
    assert.equal(item.imageUrl, imageUrl, targetWord);
    assert.equal(isInitialSoundRuntimeEligible(item), true, targetWord);
  });
});

test("runtime Initial Sounds selection retains every assessed letter without blocked art", () => {
  const eligible = initialSoundWordBank.filter(item => isInitialSoundRuntimeEligible(item));
  eligible.forEach(item => {
    assert.equal(assessmentImageStyleBlockedPaths.has(item.imageUrl), false, item.imageUrl);
  });

  [1, 2].forEach(level => {
    const letters = new Set(eligible.filter(item => item.level === level).map(item => item.letter));
    assert.deepEqual([...letters].sort(), [...INITIAL_SOUND_LETTERS].sort());
  });
});

test("assessment media candidates never include the reviewed style blocklist", () => {
  ["bag", "bus", "cake", "car", "sock", "star"].forEach(word => {
    const candidates = findAssessmentMediaCandidates({
      word,
      skillId: "initial_sounds",
      mediaType: "image"
    });
    assert.ok(candidates.length > 0, word);
    candidates.forEach(candidate => {
      assert.equal(assessmentImageStyleBlockedPaths.has(candidate.path), false, candidate.path);
    });
  });
});

test("every scoring scene records the complete bright, bold, clean-cartoon approval", () => {
  assert.equal(Object.keys(SENTENCE_COMPREHENSION_SCORING_SCENES).length, 10);
  Object.entries(SENTENCE_COMPREHENSION_SCORING_SCENES).forEach(([fileName, decision]) => {
    assert.equal(decision.visualReview, "approved-clean-cartoon", fileName);
    assert.equal(decision.alignmentReview, "approved-exact-scoring-evidence", fileName);
    assert.deepEqual(decision.styleProfile, {
      bright: true,
      bold: true,
      flat2d: true,
      crispOutlines: true,
      smoothSurfaces: true,
      canvasOrPaperGrain: false,
      embossedOrBevelledEdges: false,
      grittyOrFauxPaintTexture: false,
      photorealOrCinematicFinish: false
    }, fileName);
  });
});

test("every eligible reviewed assessment image matches its exact approved hash", () => {
  const rows = Object.values(ASSESSMENT_IMAGE_STYLE_DECISIONS);
  assert.equal(Object.keys(BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS).length, 1010);
  assert.equal(Object.keys(OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS).length, 90);
  assert.equal(rows.length, 1100);
  rows.forEach(decision => {
    const absolutePath = path.join(projectRoot, "public", decision.path.replace(/^\//, ""));
    assert.equal(fs.existsSync(absolutePath), true, decision.path);
    const hash = createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
    assert.equal(decision.sha256, hash, decision.path);
    assert.equal(decision.visualReview, "approved", decision.path);
    assert.equal(decision.brightness, "bright", decision.path);
    assert.equal(decision.saturation, "bold", decision.path);
    const approvedRasterFinish = (
      decision.medium === "classic-flat-2d-cartoon"
      && decision.surfaces === "smooth-solid"
    ) || (
      decision.medium === "classic-flat-2d-raster"
      && decision.surfaces === "smooth-solid"
    ) || (
      decision.medium === "professionally-rendered-storybook-raster"
      && decision.surfaces === "smooth-richly-rendered"
    );
    assert.equal(approvedRasterFinish, true, decision.path);
    assert.equal(decision.contours, "crisp", decision.path);
    [
      "grain", "paperOrCanvasTexture", "embossed", "bevelled",
      "faux3d", "photoreal", "painterly"
    ].forEach(field => assert.equal(decision[field], false, `${decision.path}:${field}`));
  });
});

test("directly rejected pixels cannot return behind regenerated approval metadata", () => {
  assert.equal(ASSESSMENT_IMAGE_REVIEW_EVIDENCE_VERSION, "direct-pixel-review-2026-09-01-v9");
  const activeHashes = new Set(Object.values(ASSESSMENT_IMAGE_STYLE_DECISIONS).map(row => row.sha256));
  Object.entries(ASSESSMENT_REJECTED_IMAGE_HASHES).forEach(([hash, rejection]) => {
    assert.equal(activeHashes.has(hash), false, `${rejection.path}: ${rejection.reason}`);
  });
  Object.entries(ASSESSMENT_REVIEWED_REPLACEMENT_HASHES).forEach(([assetPath, hash]) => {
    if (ASSESSMENT_REJECTED_IMAGE_HASHES[hash]) {
      assert.equal(ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath], undefined, assetPath);
    } else {
      assert.equal(ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath]?.sha256, hash, assetPath);
    }
  });
});

test("every published v3 item has exactly one approved role-appropriate media decision", async () => {
  const banksDirectory = path.join(projectRoot, "src", "data", "v3", "banks");
  const activeItemIds = new Set();
  for (const fileName of fs.readdirSync(banksDirectory).filter(file => file.endsWith(".v3.generated.js"))) {
    const { questions = [] } = await import(pathToFileURL(path.join(banksDirectory, fileName)).href);
    questions.forEach(question => activeItemIds.add(question.id));
  }

  const rows = Object.values(ASSESSMENT_ITEM_MEDIA_DECISIONS);
  assert.equal(rows.length, activeItemIds.size);
  assert.deepEqual(new Set(rows.map(decision => decision.itemId)), activeItemIds);
  rows.forEach(decision => {
    assert.ok(decision.itemId.startsWith("lp3."), decision.itemId);
    assert.ok([
      "answer-cards", "sequence", "target-or-scene", "neutral-support", "construct-support", "text-only"
    ].includes(decision.role), decision.itemId);
    assert.equal(decision.constructReview, "approved", decision.itemId);
    assert.equal(Array.isArray(decision.paths), true, decision.itemId);
    if (decision.role === "text-only") {
      assert.deepEqual(decision.paths, [], decision.itemId);
      assert.equal(decision.alt, undefined, decision.itemId);
      return;
    }
    assert.ok(decision.paths.length > 0, decision.itemId);
    assert.ok(decision.alt, decision.itemId);
    decision.paths.forEach(assetPath => {
      assert.ok(assetPath.startsWith("/images/assessment/"), `${decision.itemId}:${assetPath}`);
      assert.ok(ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath], `${decision.itemId}:${assetPath}`);
    });
  });
});
