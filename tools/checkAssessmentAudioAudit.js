#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(new URL("..", import.meta.url).pathname);

const requiredFiles = [
  "docs/assets/assessment_audio_voice_baseline.md",
  "docs/assets/assessment_audio_inventory.md",
  "docs/assets/replacement_assessment_audio_request.md",
  "docs/assets/assessment_audio_audit_method.md",
  "src/content/assessments/assessmentAudioInventory.generated.json",
  "src/content/assessments/assessmentAudioCoverageSummary.generated.json",
  "src/content/assessments/assessmentAudioManifest.js",
  "src/utils/audio/assessmentAudioClassifier.js"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(rootDir, file))) failures.push(`Missing required assessment audio audit file: ${file}`);
}

const inventoryPath = path.join(rootDir, "src/content/assessments/assessmentAudioInventory.generated.json");
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

if (!inventory.standardVoice?.description?.includes("Neutral soft American female")) {
  failures.push("Generated inventory is missing the standard voice description.");
}
if (!Array.isArray(inventory.standardVoice?.baselineFiles) || inventory.standardVoice.baselineFiles.length === 0) {
  failures.push("Generated inventory has no baseline files.");
}
if (!inventory.summary || inventory.summary.totalReferences <= 0) {
  failures.push("Generated inventory has no assessment audio references.");
}
if (!Array.isArray(inventory.items) || inventory.items.length === 0) {
  failures.push("Generated inventory has no items.");
}

const validStatuses = new Set([
  "KEEP_STANDARD_VOICE",
  "REPLACE_WRONG_VOICE",
  "REPLACE_LOW_QUALITY",
  "REPLACE_OLD_ORIGINAL",
  "REPLACE_SCRIPT_MISMATCH",
  "MISSING_AUDIO",
  "BROKEN_REFERENCE",
  "NEEDS_HUMAN_REVIEW"
]);

for (const item of inventory.items) {
  if (!validStatuses.has(item.status)) failures.push(`Invalid status "${item.status}" for ${item.audioId}`);
  if (item.status === "KEEP_STANDARD_VOICE" && item.issues?.length) {
    failures.push(`Baseline/keep item has issues: ${item.audioId}`);
  }
  if (!item.path && item.status !== "MISSING_AUDIO") failures.push(`Item has no path: ${item.audioId}`);
}

const request = fs.readFileSync(path.join(rootDir, "docs/assets/replacement_assessment_audio_request.md"), "utf8");
if (!request.includes("Neutral soft American female voice")) {
  failures.push("Replacement request is missing the voice standard.");
}
if (request.includes("KEEP_STANDARD_VOICE")) {
  failures.push("Replacement request should not include KEEP_STANDARD_VOICE rows.");
}

const appPages = fs.readFileSync(path.join(rootDir, "src/components/AppPages.jsx"), "utf8");
if (!appPages.includes("showDisabled")) failures.push("AssessmentAudioButton does not expose disabled missing-audio behavior.");
if (!appPages.includes("Audio is not available yet.")) failures.push("Missing-audio disabled button message is absent.");

console.log("Assessment Audio Audit Contract");
console.table({
  totalReferences: inventory.summary.totalReferences,
  totalFiles: inventory.summary.totalFiles,
  standardVoiceCount: inventory.summary.standardVoiceCount,
  replacementNeededCount: inventory.summary.replacementNeededCount,
  missingCount: inventory.summary.missingCount,
  brokenReferenceCount: inventory.summary.brokenReferenceCount,
  needsHumanReviewCount: inventory.summary.needsHumanReviewCount
});

if (failures.length) {
  console.error(failures.map(failure => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Assessment audio audit contract passed.");
