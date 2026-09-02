#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SOUND_SEEKERS_BIOME_KITS, validateSoundSeekersBiomeKits } from "../src/features/soundSeekers/content/biomeKits.js";
import { SOUND_SEEKERS_MEANING_VISUAL_OWNERS } from "../src/features/soundSeekers/content/sceneVisualSemantics.js";
import {
  SOUND_SEEKERS_MEANING_VISUALS,
  validateSoundSeekersVisualCatalogs
} from "../src/features/soundSeekers/visual/sceneVisualCatalog.js";
import { buildSoundSeekersV2AuthoritySnapshot } from "./checkSoundSeekersV2Content.mjs";
import { readSoundSeekersV2AssetManifest } from "./lib/soundSeekersV2AssetManifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256File(publicPath) {
  return createHash("sha256")
    .update(readFileSync(path.join(ROOT, "public", publicPath.replace(/^\//u, ""))))
    .digest("hex");
}

export function validateSoundSeekersVisualAuthorities(authorities) {
  if (!authorities || typeof authorities !== "object") throw new TypeError("complete visual authorities are required");
  const canonical = buildSoundSeekersV2AuthoritySnapshot();
  const keys = [
    "biomeKits", "sceneRenderSpecs", "optionVisuals", "meaningVisuals", "routeSpecs",
    "landmarkBindings", "characterVisuals", "playerVisual", "creatorOptions", "poseIds", "assetManifest"
  ];
  const actual = Object.fromEntries(keys.map(key => [key, authorities[key]]));
  const expected = Object.fromEntries(keys.map(key => [key, canonical[key]]));
  if (!isDeepStrictEqual(actual, expected)) throw new Error("Sound Seekers v2 visual authority drift");
  return true;
}

export function assertSoundSeekersVisualSemantics() {
  validateSoundSeekersBiomeKits(SOUND_SEEKERS_BIOME_KITS);
  validateSoundSeekersVisualCatalogs();
  const manifest = readSoundSeekersV2AssetManifest();
  if (manifest.assets.length !== 8 || manifest.assets.flatMap(asset => asset.cropReview.profiles).length !== 24) {
    throw new Error("Sound Seekers v2 raster inventory must contain eight assets and 24 crops");
  }
  if (SOUND_SEEKERS_MEANING_VISUAL_OWNERS.length !== SOUND_SEEKERS_MEANING_VISUALS.length
    || new Set(SOUND_SEEKERS_MEANING_VISUAL_OWNERS.map(record => record.meaningSemanticId)).size
      !== SOUND_SEEKERS_MEANING_VISUALS.length) {
    throw new Error("direct meaning visuals and their canonical owners are not bijective");
  }
  for (let index = 0; index < SOUND_SEEKERS_BIOME_KITS.length; index += 1) {
    const kit = SOUND_SEEKERS_BIOME_KITS[index];
    const asset = manifest.assets[index];
    if (!asset || asset.chapterId !== kit.id || asset.path !== kit.background.src
      || asset.final.sha256 !== sha256File(asset.path)
      || !isDeepStrictEqual(asset.task4.backdropReviewSemanticIds, kit.backdropReviewSemanticIds)
      || !isDeepStrictEqual(asset.cropReview.profiles.map(profile => profile.targetSize), [
        [568, 320], [1194, 834], [320, 568]
      ])) {
      throw new Error(`${kit.id}: raster asset identity or crop provenance drift`);
    }
    const overlap = kit.backdropReviewSemanticIds.filter(id => kit.codeNativeSemanticIds.includes(id));
    if (overlap.length) throw new Error(`${kit.id}: raster review IDs leaked into code-native semantics`);
  }
  validateSoundSeekersVisualAuthorities(buildSoundSeekersV2AuthoritySnapshot());
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertSoundSeekersVisualSemantics();
    console.log("Sound Seekers v2 visual semantics PASS (8 assets, 24 crops)");
  } catch (error) {
    console.error(`Sound Seekers v2 visual semantics FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
