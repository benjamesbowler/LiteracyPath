import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { SOUND_SEEKERS_BIOME_KITS } from "../../src/features/soundSeekers/content/biomeKits.js";
import { readSoundSeekersV2AssetManifest } from "../../tools/lib/soundSeekersV2AssetManifest.mjs";
import {
  assertSoundSeekersVisualSemantics,
  validateSoundSeekersVisualAuthorities
} from "../../tools/checkSoundSeekersVisualSemantic.mjs";
import { buildSoundSeekersV2AuthoritySnapshot } from "../../tools/checkSoundSeekersV2Content.mjs";

test("raster review truth stays byte-bound and disjoint from code-native DOM truth", () => {
  const manifest = readSoundSeekersV2AssetManifest();
  assert.equal(manifest.assets.length, 8);
  assert.equal(manifest.assets.flatMap(asset => asset.cropReview.profiles).length, 24);
  assert.equal(assertSoundSeekersVisualSemantics(), true);
  for (let index = 0; index < SOUND_SEEKERS_BIOME_KITS.length; index += 1) {
    const kit = SOUND_SEEKERS_BIOME_KITS[index];
    const asset = manifest.assets[index];
    assert.equal(asset.path, kit.background.src);
    const bytes = readFileSync(path.join(process.cwd(), "public", asset.path.slice(1)));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.final.sha256);
    assert.deepEqual(asset.task4.backdropReviewSemanticIds, kit.backdropReviewSemanticIds);
    assert.deepEqual(asset.cropReview.profiles.map(profile => profile.targetSize), [
      [568, 320], [1194, 834], [320, 568]
    ]);
    assert.deepEqual(kit.backdropReviewSemanticIds.filter(id => kit.codeNativeSemanticIds.includes(id)), []);
  }
});

test("a cloned visual authority with semantic drift is rejected", () => {
  const snapshot = structuredClone(buildSoundSeekersV2AuthoritySnapshot());
  assert.equal(validateSoundSeekersVisualAuthorities(snapshot), true);
  snapshot.biomeKits[0].codeNativeSemanticIds.pop();
  assert.throws(() => validateSoundSeekersVisualAuthorities(snapshot));
});
