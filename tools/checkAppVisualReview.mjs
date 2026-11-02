#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { appVisualAssetReview } from "../src/content/appVisualAssetReviews.generated.js";
import { collectAppVisualReviewInventory } from "./appVisualReviewInventory.mjs";
import {collectAppVisualHeldSourceProof,validateAppVisualHeldSources} from './lib/appVisualHeldSources.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const current = collectAppVisualReviewInventory(root, { includeSourceLiterals: true });
const failures = [];
const reviewed = new Map();
const heldRegistry=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/app-visual-held-sources.json'),'utf8'));
const currentHeldProof=heldRegistry.assets?.length?await collectAppVisualHeldSourceProof(root,heldRegistry.assets,current):null;
const heldResult=validateAppVisualHeldSources({registry:heldRegistry,currentProof:currentHeldProof,records:appVisualAssetReview.assets||[],inventory:current});
failures.push(...heldResult.failures);

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
  if (record.status !== "approved" && !heldResult.held.has(item.path)) failures.push(`${item.path}: visual status is ${record.status || "missing"}`);
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
if(heldResult.held.size&&(appVisualAssetReview.scope?.heldSourceCount!==heldResult.held.size||appVisualAssetReview.scope?.directlyReviewedImageCount!==current.length-heldResult.held.size))failures.push('reviewed/held-source counts do not match current distinct dispositions');

console.log(`App visual review gate: ${current.length} inventory images; ${current.length-heldResult.held.size} require direct visual approval; ${heldResult.held.size} retained held sources; ${failures.length} failures.`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Current displayed artwork is hash-locked to direct visual review; retained held sources have separately verified current source dispositions and no pixel approval.");
