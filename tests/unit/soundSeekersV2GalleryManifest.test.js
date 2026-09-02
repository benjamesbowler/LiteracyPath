import assert from "node:assert/strict";
import test from "node:test";

import {
  SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX,
  assertSoundSeekersV2GalleryManifest,
  buildSoundSeekersV2GalleryManifest,
  soundSeekersV2GalleryRunId
} from "../../tools/lib/soundSeekersV2GalleryManifest.mjs";

test("the recursively frozen gallery matrix has exactly 565 canonical shots", () => {
  assert.equal(Object.isFrozen(SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX), true);
  assert.equal(SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.length, 565);
  assert.equal(new Set(SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.map(shot => shot.id)).size, 565);
  assert.deepEqual(Object.fromEntries(Map.groupBy(
    SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX, shot => shot.kind
  ).entries().map(([kind, shots]) => [kind, shots.length])), {
    "background-crop": 24,
    "chapter-map": 8,
    "scene-options": 40,
    "route-landmark": 40,
    wonder: 8,
    "boss-branch": 16,
    "character-pose": 330,
    meaning: 57,
    "background-failure": 8,
    "creator-option": 22,
    "profile-viewport-zoom": 8,
    "input-focus": 4
  });
});

test("run IDs are canonical and manifests reject shot-count or completion drift", () => {
  const sourceHashes = {
    contentCatalogSha256: "1".repeat(64), visualCatalogSha256: "2".repeat(64),
    creatorOptionsSha256: "3".repeat(64), assetManifestSha256: "4".repeat(64),
    browserName: "chromium", browserVersion: "test", gallerySourceGraphSha256: "5".repeat(64)
  };
  const runId = soundSeekersV2GalleryRunId({ sourceHashes });
  assert.match(runId, /^[a-f0-9]{24}$/u);
  assert.equal(runId, soundSeekersV2GalleryRunId({ sourceHashes: structuredClone(sourceHashes) }));
  const manifest = buildSoundSeekersV2GalleryManifest({ sourceHashes, shots: [] });
  assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest));
  assert.throws(() => assertSoundSeekersV2GalleryManifest({ ...manifest, status: "partial" }));
});
