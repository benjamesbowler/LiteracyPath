import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  ASSESSMENT_IMAGE_STYLE_DECISIONS,
  BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS,
  OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS
} from "../../src/content/assessments/v3/assessmentImageStyleDecisions.js";
import { ASSESSMENT_REJECTED_IMAGE_HASHES }
  from "../../src/content/assessments/v3/assessmentImageReviewPolicy.js";
import {
  OBJECTIVE_ASSESSMENT_IMAGE_REJECTIONS,
  OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION
} from "../../src/content/assessments/v3/objectiveAssessmentImageStyleDecisions.generated.js";
import {
  OBJECTIVE_ASSESSMENT_IMAGE_EXPECTED_SHA256_BY_WORD,
  OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS,
  OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION as SOURCE_REVIEW_VERSION
} from "../../src/content/assessments/v3/objectiveAssessmentImageReviews.js";
import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import {
  AUTHORING_DIR,
  expandBank,
  makeImageResolver
} from "../../tools/assessmentRebuild/lib.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..", "..");
const objectiveRoot = path.join(projectRoot, "public", "images", "assessment", "objective-words");
const objectivePrefix = "/images/assessment/objective-words/";

const imagePaths = item => [...new Set([
  item.imagePath,
  item.imageUrl,
  item.targetImage,
  item.targetImagePath,
  ...(item.imageCards || []).flatMap(card => [card.image, card.imagePath]),
  ...(item.sequenceCards || []).flatMap(card => [card.image, card.imagePath])
].filter(Boolean))];

test("the generated objective review decisions are current", () => {
  const output = execFileSync(
    process.execPath,
    ["tools/assessmentRebuild/recordObjectiveAssessmentImageReviews.mjs", "--check"],
    { cwd: projectRoot, encoding: "utf8" }
  );
  assert.match(output, /^Verified \d+ approved and \d+ rejected objective images\./);
});

test("the objective-word review manifest covers every file and records every rejection", () => {
  const diskPaths = fs.readdirSync(objectiveRoot, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".webp"))
    .map(entry => `${objectivePrefix}${entry.name}`)
    .sort();
  const reviewPaths = Object.keys(OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS).sort();

  assert.deepEqual(reviewPaths, diskPaths);
  assert.equal(OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION, SOURCE_REVIEW_VERSION);
  assert.equal(
    Object.keys(OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS).length
      + Object.keys(OBJECTIVE_ASSESSMENT_IMAGE_REJECTIONS).length,
    diskPaths.length
  );
  assert.deepEqual(
    Object.keys(OBJECTIVE_ASSESSMENT_IMAGE_EXPECTED_SHA256_BY_WORD).sort(),
    reviewPaths.map(assetPath => path.basename(assetPath, ".webp")).sort()
  );

  Object.entries(OBJECTIVE_ASSESSMENT_IMAGE_REJECTIONS).forEach(([assetPath, rejection]) => {
    assert.equal(OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS[assetPath]?.status, "rejected", assetPath);
    assert.ok(rejection.rejectionReason, assetPath);
    assert.equal(
      OBJECTIVE_ASSESSMENT_IMAGE_EXPECTED_SHA256_BY_WORD[rejection.targetWord],
      rejection.sha256,
      `${assetPath} source review hash`
    );
    assert.equal(OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath], undefined, assetPath);
    assert.equal(ASSESSMENT_REJECTED_IMAGE_HASHES[rejection.sha256]?.path, assetPath, assetPath);
    assert.equal(
      ASSESSMENT_REJECTED_IMAGE_HASHES[rejection.sha256]?.reason,
      rejection.rejectionReason,
      assetPath
    );
  });
});

test("every approved objective image retains the exact reviewed pixels and strict validity fields", () => {
  Object.entries(OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS).forEach(([assetPath, decision]) => {
    const absolutePath = path.join(projectRoot, "public", assetPath.replace(/^\//, ""));
    const hash = createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
    assert.equal(
      OBJECTIVE_ASSESSMENT_IMAGE_EXPECTED_SHA256_BY_WORD[decision.targetWord],
      hash,
      `${assetPath} source review hash`
    );
    assert.equal(decision.sha256, hash, assetPath);
    assert.equal(decision.width, 768, assetPath);
    assert.equal(decision.height, 768, assetPath);
    assert.equal(decision.visualReview, "approved", assetPath);
    assert.equal(decision.cropReview, "approved-referent-complete-with-padding", assetPath);
    assert.equal(decision.nameabilityReview, "approved-direct-child-label", assetPath);
    assert.equal(decision.objectivityReview, "approved-directly-observable", assetPath);
    assert.equal(decision.complexityReview, "approved-single-focus", assetPath);
    assert.equal(decision.styleReview, "approved-clear-professional-2d-raster", assetPath);
    assert.equal(decision.textReview, "approved-no-text-or-symbol-cue", assetPath);
    assert.equal(decision.reviewVersion, SOURCE_REVIEW_VERSION, assetPath);
    assert.equal(decision.grain, false, assetPath);
    assert.equal(decision.paperOrCanvasTexture, false, assetPath);
    assert.equal(decision.embossed, false, assetPath);
    assert.equal(decision.bevelled, false, assetPath);
    assert.equal(decision.faux3d, false, assetPath);
    assert.equal(decision.photoreal, false, assetPath);
    assert.equal(decision.painterly, false, assetPath);
  });
});

test("the composite style authority contains the base and objective decisions without replacement", () => {
  assert.equal(
    Object.keys(ASSESSMENT_IMAGE_STYLE_DECISIONS).length,
    Object.keys(BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS).length
      + Object.keys(OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS).length
  );
  Object.entries(BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS).forEach(([assetPath, decision]) => {
    assert.equal(ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath], decision, assetPath);
  });
  Object.entries(OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS).forEach(([assetPath, decision]) => {
    assert.equal(ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath], decision, assetPath);
  });
});

test("no active authored v3 item can resolve a rejected or unreviewed objective image", async () => {
  const activeUses = new Map();
  const files = fs.readdirSync(AUTHORING_DIR).filter(file => file.endsWith(".mjs")).sort();

  for (const file of files) {
    const skillId = file.replace(/\.mjs$/, "");
    if (!skillBlueprints[skillId]) continue;
    const sourcePath = path.join(AUTHORING_DIR, file);
    const { default: source } = await import(pathToFileURL(sourcePath));
    const items = expandBank(
      source,
      skillBlueprints[skillId],
      source.imageResolver || makeImageResolver()
    );
    items.forEach(item => {
      imagePaths(item).filter(assetPath => assetPath.startsWith(objectivePrefix)).forEach(assetPath => {
        const uses = activeUses.get(assetPath) || [];
        uses.push(item.id);
        activeUses.set(assetPath, uses);
      });
    });
  }

  const invalid = [...activeUses.entries()]
    .filter(([assetPath]) => !OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath])
    .map(([assetPath, itemIds]) => ({
      assetPath,
      reason: OBJECTIVE_ASSESSMENT_IMAGE_REJECTIONS[assetPath]?.rejectionReason || "no direct review",
      itemIds
    }));

  assert.deepEqual(invalid, []);
});
