// Record exact hashes for the directly reviewed objective-word image manifest.
//
// Usage:
//   node tools/assessmentRebuild/recordObjectiveAssessmentImageReviews.mjs
//   node tools/assessmentRebuild/recordObjectiveAssessmentImageReviews.mjs --check
//
// The visual-review source records both approvals and rejections. Only approved
// files receive style decisions; rejected files stay visible in the generated
// rejection map so current or future authoring references fail closed.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

import {
  OBJECTIVE_ASSESSMENT_IMAGE_EXPECTED_SHA256_BY_WORD,
  OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS,
  OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION
} from "../../src/content/assessments/v3/objectiveAssessmentImageReviews.js";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const IMAGE_ROOT = path.join(ROOT, "public", "images", "assessment", "objective-words");
const DESTINATION = path.join(
  ROOT,
  "src",
  "content",
  "assessments",
  "v3",
  "objectiveAssessmentImageStyleDecisions.generated.js"
);
const checkOnly = process.argv.includes("--check");

const expectedApprovedFields = Object.freeze({
  cropReview: "approved-referent-complete-with-padding",
  nameabilityReview: "approved-direct-child-label",
  objectivityReview: "approved-directly-observable",
  complexityReview: "approved-single-focus",
  styleReview: "approved-clear-professional-2d-raster",
  textReview: "approved-no-text-or-symbol-cue"
});
const acceptedReviewDates = new Set(["2026-08-31", "2026-09-01"]);

const fail = message => {
  throw new Error(`Objective assessment image review: ${message}`);
};

const diskPaths = fs.readdirSync(IMAGE_ROOT, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith(".webp"))
  .map(entry => `/images/assessment/objective-words/${entry.name}`)
  .sort();
const reviewPaths = Object.keys(OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS).sort();

const missingReviews = diskPaths.filter(assetPath => !reviewPaths.includes(assetPath));
const missingFiles = reviewPaths.filter(assetPath => !diskPaths.includes(assetPath));
if (missingReviews.length || missingFiles.length) {
  fail([
    missingReviews.length ? `unreviewed files: ${missingReviews.join(", ")}` : "",
    missingFiles.length ? `review entries without files: ${missingFiles.join(", ")}` : ""
  ].filter(Boolean).join("; "));
}

const approved = {};
const rejected = {};

for (const assetPath of reviewPaths) {
  const review = OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS[assetPath];
  if (review.path !== assetPath) fail(`${assetPath} records the wrong path`);
  if (!review.targetWord || assetPath !== `/images/assessment/objective-words/${review.targetWord}.webp`) {
    fail(`${assetPath} records the wrong target word`);
  }
  if (!acceptedReviewDates.has(review.reviewedAt)) {
    fail(`${assetPath} has no current direct-review date`);
  }
  if (review.reviewMode !== "direct-contact-sheet-and-individual-pixel-review") {
    fail(`${assetPath} has no direct-pixel review mode`);
  }

  const absolutePath = path.join(ROOT, "public", assetPath.replace(/^\//, ""));
  const bytes = fs.readFileSync(absolutePath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const expectedSha256 = OBJECTIVE_ASSESSMENT_IMAGE_EXPECTED_SHA256_BY_WORD[review.targetWord];
  if (!expectedSha256) fail(`${assetPath} has no human-reviewed expected pixel hash`);
  if (sha256 !== expectedSha256) {
    fail(`${assetPath} pixels changed after review; update the source hash and review version only after direct visual re-review`);
  }
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== "webp" || metadata.width !== 768 || metadata.height !== 768) {
    fail(`${assetPath} must be an exact 768x768 WebP`);
  }
  if (metadata.pages && metadata.pages !== 1) fail(`${assetPath} must be a still image`);

  if (review.status === "rejected") {
    if (!review.rejectionReason) fail(`${assetPath} has no rejection reason`);
    if (![review.cropReview, review.nameabilityReview, review.objectivityReview, review.complexityReview]
      .includes("rejected")) {
      fail(`${assetPath} is rejected without a failed validity criterion`);
    }
    rejected[assetPath] = {
      ...review,
      sha256,
      width: metadata.width,
      height: metadata.height,
      reviewVersion: OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION
    };
    continue;
  }

  if (review.status !== "approved") fail(`${assetPath} has unknown status ${review.status}`);
  for (const [field, expected] of Object.entries(expectedApprovedFields)) {
    if (review[field] !== expected) fail(`${assetPath} lacks ${field}: ${expected}`);
  }
  if (!review.sourceSheet) fail(`${assetPath} has no direct-review source sheet`);

  approved[assetPath] = {
    path: assetPath,
    targetWord: review.targetWord,
    sha256,
    width: metadata.width,
    height: metadata.height,
    visualReview: "approved",
    reviewedAt: review.reviewedAt,
    reviewVersion: OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION,
    reviewMode: review.reviewMode,
    cropReview: review.cropReview,
    nameabilityReview: review.nameabilityReview,
    objectivityReview: review.objectivityReview,
    complexityReview: review.complexityReview,
    styleReview: review.styleReview,
    textReview: review.textReview,
    reviewNote: review.reviewNote,
    brightness: "bright",
    saturation: "bold",
    medium: review.styleProfile,
    contours: "crisp",
    surfaces: review.styleProfile === "professionally-rendered-storybook-raster"
      ? "smooth-richly-rendered"
      : "smooth-solid",
    grain: false,
    paperOrCanvasTexture: false,
    embossed: false,
    bevelled: false,
    faux3d: false,
    photoreal: false,
    painterly: false,
    sourceSheet: review.sourceSheet,
    sourceCell: null,
    repairedFrom: null
  };
}

const banner = `// GENERATED by tools/assessmentRebuild/recordObjectiveAssessmentImageReviews.mjs\n`;
const output = `${banner}`
  + `export const OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION = ${JSON.stringify(OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION)};\n`
  + `export const OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS = Object.freeze(${JSON.stringify(approved, null, 2)});\n`
  + `export const OBJECTIVE_ASSESSMENT_IMAGE_REJECTIONS = Object.freeze(${JSON.stringify(rejected, null, 2)});\n`;

if (checkOnly) {
  if (!fs.existsSync(DESTINATION) || fs.readFileSync(DESTINATION, "utf8") !== output) {
    fail("generated decision file is stale; run the recorder without --check");
  }
  console.log(`Verified ${Object.keys(approved).length} approved and ${Object.keys(rejected).length} rejected objective images.`);
} else {
  fs.writeFileSync(DESTINATION, output);
  console.log(`Recorded ${Object.keys(approved).length} approved and ${Object.keys(rejected).length} rejected objective images.`);
}
