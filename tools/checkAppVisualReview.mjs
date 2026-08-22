#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { appVisualAssetReview } from "../src/content/appVisualAssetReviews.generated.js";
import { collectAppVisualReviewInventory } from "./appVisualReviewInventory.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const current = collectAppVisualReviewInventory(root, { includeSourceLiterals: true });
const failures = [];
const reviewed = new Map();

for (const record of appVisualAssetReview.assets || []) {
  if (reviewed.has(record.path)) failures.push(`${record.path}: duplicate visual review record`);
  reviewed.set(record.path, record);
}

for (const item of current) {
  const record = reviewed.get(item.path);
  if (!record) {
    failures.push(`${item.path}: missing fail-closed visual review record`);
    continue;
  }
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(item.absolutePath)).digest("hex");
  if (record.sha256 !== sha256) failures.push(`${item.path}: image bytes changed after visual review`);
  if (record.status !== "approved") failures.push(`${item.path}: visual status is ${record.status || "missing"}`);
}

const currentPaths = new Set(current.map(item => item.path));
for (const record of appVisualAssetReview.assets || []) {
  if (!currentPaths.has(record.path)) failures.push(`${record.path}: stale visual review record`);
}

if (appVisualAssetReview.status !== "complete") {
  failures.push(`review status is ${appVisualAssetReview.status || "missing"}, not complete`);
}
if (appVisualAssetReview.scope?.imageCount !== current.length) {
  failures.push("review image count does not match the current inventory");
}

console.log(`App visual review gate: ${current.length} current images; ${failures.length} failures.`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Every current runtime/source image is hash-locked to the completed direct visual review.");
