import assert from "node:assert/strict";
import test from "node:test";

import {
  SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX,
  assertSoundSeekersV2GalleryManifest,
  buildSoundSeekersV2GalleryManifest,
  soundSeekersV2GalleryRunId
} from "../../tools/lib/soundSeekersV2GalleryManifest.mjs";

const SOURCE_HASHES = {
  contentCatalogSha256: "1".repeat(64), visualCatalogSha256: "2".repeat(64),
  creatorOptionsSha256: "3".repeat(64), assetManifestSha256: "4".repeat(64),
  browserName: "chromium", browserVersion: "test", gallerySourceGraphSha256: "5".repeat(64)
};

function expectedFailures(matrix) {
  return matrix.kind === "background-failure"
    ? [{ url: matrix.asset.path, method: "GET", reason: "route_abort" }]
    : [];
}

function validShot(matrix) {
  return {
    ordinal: matrix.ordinal,
    id: matrix.id,
    kind: matrix.kind,
    relativePngPath: `shots/${String(matrix.ordinal).padStart(4, "0")}-${matrix.id}.png`,
    url: matrix.url,
    seed: matrix.seed,
    fixtureId: matrix.fixtureId,
    chapterId: matrix.chapterId,
    stopId: matrix.stopId,
    sceneId: matrix.sceneId,
    subjectId: matrix.subjectId,
    cropProfileId: matrix.cropProfileId,
    densityProfile: matrix.densityProfile,
    motionProfile: matrix.motionProfile,
    viewport: structuredClone(matrix.viewport),
    browserZoom: matrix.browserZoom,
    expectedCodeNativeSemanticIds: [...matrix.expectedCodeNativeSemanticIds],
    reviewBackdropSemanticIds: [...matrix.reviewBackdropSemanticIds],
    optionIds: [...matrix.optionIds],
    asset: matrix.asset ? structuredClone(matrix.asset) : {
      path: null, sha256: null, cropRecordSha256: null
    },
    png: {
      width: matrix.viewport.width,
      height: matrix.viewport.height,
      byteLength: 100 + matrix.ordinal,
      sha256: matrix.ordinal.toString(16).padStart(64, "0")
    },
    checks: {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: expectedFailures(matrix),
      visibleControlIds: [...(matrix.expectedVisibleControlIds || [])],
      focusTargetId: matrix.expectedFocusTargetId ?? null,
      noAnswerLeak: true
    },
    status: "passed"
  };
}

function validManifest() {
  return buildSoundSeekersV2GalleryManifest({
    sourceHashes: structuredClone(SOURCE_HASHES),
    shots: SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.map(validShot)
  });
}

function mutableManifest() {
  return structuredClone(validManifest());
}

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

test("every matrix URL names the exact replay and presentation axes stored on its record", () => {
  for (const record of SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX) {
    const params = new URL(record.url, "http://gallery.invalid").searchParams;
    assert.equal(params.get("fixture") || "pre-choice", record.fixtureId, record.id);
    assert.equal(Number(params.get("seed") || 11), record.seed, record.id);
    assert.equal(params.get("density") || "full", record.densityProfile, record.id);
    assert.equal(params.get("motion") || "reduced", record.motionProfile, record.id);
  }
});

test("character and creator records require semantics observed from their real Task 4 subtrees", () => {
  const character = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.find(record => record.kind === "character-pose");
  const creator = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.find(record => record.kind === "creator-option");
  assert.deepEqual(character.expectedCodeNativeSemanticIds, ["character:bouncy"]);
  assert.deepEqual(creator.expectedCodeNativeSemanticIds, ["character:player"]);
});

test("run IDs are canonical and manifests reject shot-count or completion drift", () => {
  const runId = soundSeekersV2GalleryRunId({ sourceHashes: SOURCE_HASHES });
  assert.match(runId, /^[a-f0-9]{24}$/u);
  assert.equal(runId, soundSeekersV2GalleryRunId({ sourceHashes: structuredClone(SOURCE_HASHES) }));
  const manifest = buildSoundSeekersV2GalleryManifest({ sourceHashes: SOURCE_HASHES, shots: [] });
  assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest));
  assert.throws(() => assertSoundSeekersV2GalleryManifest({ ...manifest, status: "partial" }));
});

test("the complete manifest is recursively exact and every matrix-bound field fails closed", () => {
  assert.equal(assertSoundSeekersV2GalleryManifest(validManifest()), true);

  const cases = [
    ["url", shot => { shot.url += "&fabricated=true"; }],
    ["seed", shot => { shot.seed += 1; }],
    ["fixtureId", shot => { shot.fixtureId = "fabricated"; }],
    ["chapterId", shot => { shot.chapterId = "fabricated"; }],
    ["stopId", shot => { shot.stopId = "s40"; }],
    ["sceneId", shot => { shot.sceneId = "scene-s40"; }],
    ["subjectId", shot => { shot.subjectId = "fabricated"; }],
    ["cropProfileId", shot => { shot.cropProfileId = "fabricated"; }],
    ["densityProfile", shot => { shot.densityProfile = "simplified"; }],
    ["motionProfile", shot => { shot.motionProfile = "full"; }],
    ["viewport.width", shot => { shot.viewport.width += 1; shot.png.width += 1; }],
    ["browserZoom", shot => { shot.browserZoom = 1.5; }],
    ["expectedCodeNativeSemanticIds", shot => { shot.expectedCodeNativeSemanticIds.push("fabricated"); }],
    ["reviewBackdropSemanticIds", shot => { shot.reviewBackdropSemanticIds.push("fabricated"); }],
    ["optionIds", shot => { shot.optionIds.push("fabricated"); }],
    ["asset.path", shot => { shot.asset.path = "/fabricated.webp"; }],
    ["asset.sha256", shot => { shot.asset.sha256 = "f".repeat(64); }],
    ["asset.cropRecordSha256", shot => { shot.asset.cropRecordSha256 = "f".repeat(64); }],
    ["visibleControlIds", shot => { shot.checks.visibleControlIds.push("fabricated"); }],
    ["focusTargetId", shot => { shot.checks.focusTargetId = "fabricated"; }],
    ["noAnswerLeak", shot => { shot.checks.noAnswerLeak = false; }]
  ];
  for (const [label, mutate] of cases) {
    const manifest = mutableManifest();
    const index = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.findIndex(matrix => {
      if (label === "cropProfileId") return matrix.cropProfileId !== null;
      if (label.startsWith("asset.")) return matrix.asset !== null;
      if (label === "chapterId") return matrix.chapterId !== null;
      if (["stopId", "sceneId", "subjectId"].includes(label)) return matrix[label] !== null;
      if (label === "reviewBackdropSemanticIds") return matrix.reviewBackdropSemanticIds.length > 0;
      if (label === "optionIds") return matrix.optionIds.length > 0;
      if (label === "expectedCodeNativeSemanticIds") return matrix.expectedCodeNativeSemanticIds.length > 0;
      if (label === "visibleControlIds") return (matrix.expectedVisibleControlIds || []).length > 0;
      if (label === "focusTargetId") return matrix.expectedFocusTargetId !== null && matrix.expectedFocusTargetId !== undefined;
      if (label === "densityProfile") return matrix.densityProfile === "full";
      if (label === "motionProfile") return matrix.motionProfile === "reduced";
      return true;
    });
    assert.notEqual(index, -1, `${label} needs a canonical mutation target`);
    mutate(manifest.shots[index]);
    assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest), undefined, label);
  }
});

test("unknown keys at every manifest depth and reordered/added/removed shots are rejected", () => {
  for (const [label, mutate] of [
    ["root", manifest => { manifest.extra = true; }],
    ["sourceHashes", manifest => { manifest.sourceHashes.extra = true; }],
    ["shot", manifest => { manifest.shots[0].extra = true; }],
    ["viewport", manifest => { manifest.shots[0].viewport.extra = true; }],
    ["asset", manifest => { manifest.shots[0].asset.extra = true; }],
    ["png", manifest => { manifest.shots[0].png.extra = true; }],
    ["checks", manifest => { manifest.shots[0].checks.extra = true; }],
    ["failed request", manifest => {
      manifest.shots.find(shot => shot.kind === "background-failure").checks.failedRequests[0].extra = true;
    }],
    ["removed", manifest => { manifest.shots.pop(); }],
    ["added", manifest => { manifest.shots.push(structuredClone(manifest.shots[0])); }],
    ["reordered", manifest => { [manifest.shots[0], manifest.shots[1]] = [manifest.shots[1], manifest.shots[0]]; }]
  ]) {
    const manifest = mutableManifest();
    mutate(manifest);
    assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest), undefined, label);
  }
});

test("every source-hash/header mutation, failure cardinality, path traversal, and PNG fact is rejected", () => {
  for (const [label, mutate] of [
    ["content hash", manifest => { manifest.sourceHashes.contentCatalogSha256 = "a".repeat(64); }],
    ["browser", manifest => { manifest.sourceHashes.browserName = "firefox"; }],
    ["run ID", manifest => { manifest.runId = "a".repeat(24); }],
    ["matrix hash", manifest => { manifest.matrixSha256 = "a".repeat(64); }],
    ["shot count", manifest => { manifest.shotCount -= 1; }],
    ["traversal", manifest => { manifest.shots[0].relativePngPath = "shots/../escape.png"; }],
    ["zero byte", manifest => { manifest.shots[0].png.byteLength = 0; }],
    ["wrong png hash", manifest => { manifest.shots[0].png.sha256 = "invalid"; }],
    ["normal failure", manifest => { manifest.shots[0].checks.failedRequests.push({ url: "/x", method: "GET", reason: "route_abort" }); }],
    ["missing abort", manifest => { manifest.shots.find(shot => shot.kind === "background-failure").checks.failedRequests = []; }],
    ["second abort", manifest => { const shot = manifest.shots.find(item => item.kind === "background-failure"); shot.checks.failedRequests.push(structuredClone(shot.checks.failedRequests[0])); }]
  ]) {
    const manifest = mutableManifest();
    mutate(manifest);
    assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest), undefined, label);
  }
});
