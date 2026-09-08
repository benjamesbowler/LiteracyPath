// Record scoped, directly inspected repairs to the existing assessment library.
// Usage: node tools/assessmentRebuild/recordAssessmentImageRepairs.mjs --receipts <json>
// Each receipt requires path, sha256, reviewedAt, and reviewNotes. This command
// preserves every unselected decision; it does not perform a visual review.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ASSESSMENT_IMAGE_STYLE_DECISIONS } from "../../src/content/assessments/v3/assessmentImageStyleDecisions.generated.js";
import { ASSESSMENT_REJECTED_IMAGE_HASHES } from "../../src/content/assessments/v3/assessmentImageReviewPolicy.js";

const root = path.resolve(import.meta.dirname, "../..");
const receiptIndex = process.argv.indexOf("--receipts");
if (receiptIndex < 0 || !process.argv[receiptIndex + 1]) throw new Error("Expected --receipts <json>.");
const receipts = JSON.parse(fs.readFileSync(process.argv[receiptIndex + 1], "utf8"));
if (!Array.isArray(receipts) || !receipts.length) throw new Error("Expected non-empty review receipts.");
const decisions = { ...ASSESSMENT_IMAGE_STYLE_DECISIONS };
const selected = new Set();
for (const receipt of receipts) {
  const existing = decisions[receipt.path];
  if (!existing || selected.has(receipt.path)) throw new Error("Unknown or duplicate image: " + receipt.path);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receipt.reviewedAt || "") || !receipt.reviewNotes?.trim()) {
    throw new Error("A dated direct-review note is required: " + receipt.path);
  }
  const sha256 = createHash("sha256").update(fs.readFileSync(path.join(root, "public", receipt.path))).digest("hex");
  if (sha256 !== receipt.sha256 || ASSESSMENT_REJECTED_IMAGE_HASHES[sha256]) {
    throw new Error("Image changed after review or contains rejected pixels: " + receipt.path);
  }
  selected.add(receipt.path);
  decisions[receipt.path] = {
    ...existing, sha256, reviewedAt: receipt.reviewedAt,
    sourceSheet: null, sourceCell: null, repairedFrom: existing.sha256,
    reviewNotes: receipt.reviewNotes
  };
}
fs.writeFileSync(path.join(root, "src/content/assessments/v3/assessmentImageStyleDecisions.generated.js"),
  "// GENERATED; scoped repairs recorded by tools/assessmentRebuild/recordAssessmentImageRepairs.mjs\n"
  + "export const ASSESSMENT_IMAGE_STYLE_DECISIONS = Object.freeze(" + JSON.stringify(decisions, null, 2) + ");\n");
console.log("Recorded " + selected.size + " directly reviewed repairs; all unrelated decisions preserved.");

