#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUEST_STOPS } from "../src/data/questSequence.js";
import {
  SEEDWAKE_STOP_IDS,
  seedwakeSatchel,
  seedwakeStopSpec,
  validateSeedwakeChapter
} from "../src/data/questChapterOne.js";
import {
  FIELD_OBJECT_MODELS,
  QUEST_STOP_ASSET_KITS,
  SEEDWAKE_ASSET_ALLOWLIST,
  seedwakeAssetManifest
} from "../src/data/threeAssetLibrary.js";
import { buildTrailSection } from "../src/utils/questHub.js";
import { buildPhysicalTask } from "../src/utils/questPhysicalMechanics.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = message => errors.push(message);
const expectedShapes = Object.freeze({
  s1: ["seed-lantern", "awakened-lantern"],
  s2: ["jump-flower", "flower-step"],
  s3: ["sound-parcel", "delivery-marker", "delivered-parcel"],
  s4: ["river-plank", "placed-plank"],
  s5: ["chorus-lantern", "lit-chorus-lantern"]
});
const seedwakeAssets = seedwakeAssetManifest();
const seedwakeAllowlist = new Set(SEEDWAKE_ASSET_ALLOWLIST);

function localAssetExists(url) {
  return typeof url === "string" && url.startsWith("/") && fs.existsSync(path.join(ROOT, "public", url.slice(1)));
}

if (SEEDWAKE_STOP_IDS.length !== 5) fail(`expected 5 Seedwake trails, found ${SEEDWAKE_STOP_IDS.length}`);
for (const error of validateSeedwakeChapter()) fail(error);

const firstChapterIds = QUEST_STOPS.slice(0, 5).map(stop => stop.id);
if (firstChapterIds.join(",") !== SEEDWAKE_STOP_IDS.join(",")) {
  fail(`the opening chapter is ${firstChapterIds.join(", ")}, expected ${SEEDWAKE_STOP_IDS.join(", ")}`);
}

const kitSignatures = new Set();
const residentNames = new Set();
let tasksChecked = 0;

for (const stopId of SEEDWAKE_STOP_IDS) {
  const stop = QUEST_STOPS.find(entry => entry.id === stopId);
  const spec = seedwakeStopSpec(stopId);
  const section = buildTrailSection(stopId, { seed: stop?.index || Number(stopId.slice(1)) });
  if (!stop || !spec || !section) {
    fail(`${stopId}: missing stop, production specification, or trail section`);
    continue;
  }

  if (!section.encounters?.length) fail(`${stopId}: no in-world encounters`);
  const firstResident = section.encounters?.[0]?.friend;
  if (firstResident) residentNames.add(firstResident);

  for (const [encounterIndex, encounter] of (section.encounters || []).entries()) {
    for (const [beatIndex, beat] of (encounter.beats || []).entries()) {
      const task = buildPhysicalTask(section, encounter, beat, beatIndex);
      tasksChecked += 1;
      if (!task) {
        fail(`${stopId}: encounter ${encounterIndex + 1}, beat ${beatIndex + 1} falls back to a popup`);
        continue;
      }
      if (task.mechanic !== spec.mechanic) fail(`${stopId}: uses ${task.mechanic}, expected ${spec.mechanic}`);
      if (task.mission !== spec.mission) fail(`${stopId}: task mission drifted from the chapter story`);
      if (!task.stages?.length) fail(`${stopId}: task has no physical stages`);
      if (task.stages?.some(stage => !stage.playerAction || !stage.prompt || !stage.items?.length)) {
        fail(`${stopId}: every stage must have an action, readable prompt, and physical items`);
      }
      if (!task.stages?.some(stage => stage.completion)) fail(`${stopId}: task leaves no persistent physical result`);
    }
  }

  const kit = QUEST_STOP_ASSET_KITS[stopId];
  if (!Array.isArray(kit) || kit.length < 3) fail(`${stopId}: needs at least three authored landmark groups`);
  const signature = JSON.stringify((kit || []).map(asset => asset.url));
  if (kitSignatures.has(signature)) fail(`${stopId}: repeats another trail's authored landmark kit`);
  kitSignatures.add(signature);
  for (const asset of kit || []) {
    if (!localAssetExists(asset.url)) fail(`${stopId}: landmark model is missing (${asset.url})`);
  }

  for (const shape of expectedShapes[stopId]) {
    if (shape === "river-plank" || shape === "placed-plank") continue;
    const model = FIELD_OBJECT_MODELS[shape];
    if (!model) fail(`${stopId}: ${shape} has no authored field model`);
    else if (!localAssetExists(model.url)) fail(`${stopId}: ${shape} model is missing (${model.url})`);
  }
}

for (const url of seedwakeAssets.urls) {
  if (!seedwakeAllowlist.has(url)) fail(`Seedwake asset is outside the allowlist (${url})`);
  if (!url.startsWith("/models/library/kaykit/medieval/")) fail(`Seedwake mixes a non-meadow model (${url})`);
  if (!localAssetExists(url)) fail(`Seedwake allowlist model is missing (${url})`);
}

if (residentNames.size < 3) fail(`the five opening trails only rotate ${residentNames.size} distinct residents`);

const chapterComplete = seedwakeSatchel({
  trail: {
    drops: Object.fromEntries(SEEDWAKE_STOP_IDS.map(stopId => [stopId, 12])),
    stopsDone: [...SEEDWAKE_STOP_IDS]
  }
});
if (chapterComplete.total !== 60) fail(`chapter ceremony banks ${chapterComplete.total} finds, expected 60`);
if (chapterComplete.sparksBanked !== 120) fail(`chapter ceremony banks ${chapterComplete.sparksBanked} Sparks, expected 120`);
if (chapterComplete.repairs.length !== 5) fail(`chapter ceremony shows ${chapterComplete.repairs.length} repairs, expected 5`);
if (chapterComplete.cacheCount !== 3 || !chapterComplete.collectionComplete) {
  fail("the completed chapter must open all three caches and complete the collection");
}

if (errors.length) {
  console.error(`check:quest-chapter-one found ${errors.length} problem${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors) console.error(`  FAIL  ${error}`);
  process.exit(1);
}

console.log(
  `check:quest-chapter-one OK - 5 distinct trails, ${tasksChecked} physical tasks, ` +
  `${residentNames.size} residents, 15 landmark groups, 60 finds, 120 Sparks`
);
