import assert from "node:assert/strict";
import test from "node:test";

import {
  SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX,
  assertSoundSeekersV2GalleryManifest,
  buildSoundSeekersV2GalleryManifest,
  soundSeekersV2GalleryRunId
} from "../../tools/lib/soundSeekersV2GalleryManifest.mjs";
import {
  galleryBrowserProfile,
  gallerySourceGraphFromSources
} from "../../tools/shootSoundSeekersV2Content.mjs";
import { SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS } from "../../src/features/soundSeekers/visual/characterCustomization.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../../src/features/soundSeekers/visual/visualTokens.js";

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

const fakeHash = value => value.toString(16).padStart(64, "0");
const LAYOUT_SOURCE_FACTS = Object.freeze({
  "scene-s1": Object.freeze({
    actors: Object.freeze(["Bouncy", "Moss"]),
    landmark: "landmark:s1",
    targets: Object.freeze(["scene-s1-path-marker", "scene-s1-story-sign"]),
    controls: Object.freeze([
      "scene-s1-option-lift-mat", "scene-s1-option-lift-mats", "scene-s1-option-lift-light"
    ])
  }),
  "scene-s11": Object.freeze({
    actors: Object.freeze(["Fen", "Rook"]),
    landmark: "landmark:s11",
    targets: Object.freeze(["scene-s11-post-decision", "amber-trail-visible", "landmark:s11"]),
    controls: Object.freeze([
      "scene-s11-option-sit-on-path-rock", "scene-s11-option-pick-rock-off-path",
      "scene-s11-option-kick-rock-on-path"
    ])
  }),
  "scene-s36": Object.freeze({
    actors: Object.freeze(["Nova", "Comet"]),
    landmark: "landmark:s36",
    targets: Object.freeze(["scene-s36-post-decision", "comet-stair-raised", "landmark:s36"]),
    controls: Object.freeze([
      "scene-s36-option-follow-creature", "scene-s36-option-stair-still-dark",
      "scene-s36-option-make-stair-bright"
    ])
  }),
  "scene-s40-action": Object.freeze({
    actors: Object.freeze(["Nova", "Dawn"]),
    landmark: "landmark:s40",
    targets: Object.freeze([
      "scene-s40-post-decision-b", "first-reading-star-awake-branch-2-resolved", "landmark:s40"
    ]),
    controls: Object.freeze(["scene-s40-option-action-path", "scene-s40-option-fiction-path"])
  }),
  "scene-s40-fiction": Object.freeze({
    actors: Object.freeze(["Nova", "Dawn"]),
    landmark: "landmark:s40",
    targets: Object.freeze([
      "scene-s40-post-decision-a", "first-reading-star-awake-branch-1-resolved", "landmark:s40"
    ]),
    controls: Object.freeze(["scene-s40-option-action-path", "scene-s40-option-fiction-path"])
  })
});

function rectangle(x, y, width = 56, height = 56) {
  return { x, y, width, height, right: x + width, bottom: y + height };
}

function layoutItem(id, index) {
  return { id, ...rectangle((index % 4) * 64, 64 + (Math.floor(index / 4) * 64)) };
}

function layoutFor(matrix) {
  if (matrix.kind !== "profile-viewport-zoom") return null;
  const suffix = matrix.sceneId === "scene-s40"
    ? matrix.optionIds.includes("scene-s40-option-action-path") ? "-action" : "-fiction"
    : "";
  const facts = LAYOUT_SOURCE_FACTS[`${matrix.sceneId}${suffix}`];
  if (!facts) throw new TypeError(`missing literal layout fixture for ${matrix.id}`);
  let index = 0;
  const actors = facts.actors.map(id => layoutItem(id, index++));
  const landmark = layoutItem(facts.landmark, index++);
  const targets = facts.targets.map(id => layoutItem(id, index++));
  const controls = facts.controls.map(id => layoutItem(id, index++));
  return {
    viewport: {
      width: matrix.viewport.width / matrix.browserZoom,
      height: matrix.viewport.height / matrix.browserZoom
    },
    horizontalOverflow: 0,
    verticalOverflow: 0,
    goal: rectangle(0, 0, 120, 40),
    actors,
    landmark,
    targets,
    controls
  };
}

function payoffComparison(matrix) {
  if (matrix.kind !== "boss-branch") return null;
  return {
    selectedOptionVisualId: matrix.subjectId,
    resolvedVisualStateId: matrix.expectedRenderedFacts.resolvedVisualStateId,
    variants: [
      { mode: "ordinary", compositionSignature: matrix.expectedRenderedFacts.ordinaryCompositionSignature, pngSha256: fakeHash(10_000 + matrix.ordinal) },
      { mode: "wonder", compositionSignature: matrix.expectedRenderedFacts.wonderCompositionSignature, pngSha256: fakeHash(20_000 + matrix.ordinal) },
      { mode: "boss-resolved", compositionSignature: matrix.expectedRenderedFacts.bossCompositionSignature, pngSha256: fakeHash(matrix.ordinal) }
    ]
  };
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
    expectedRenderedFacts: matrix.expectedRenderedFacts
      ? structuredClone(matrix.expectedRenderedFacts) : null,
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
      noAnswerLeak: true,
      payoffComparison: payoffComparison(matrix),
      layout: layoutFor(matrix)
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

test("the fixed eight profile records bind exact later and longest source scenes", () => {
  const profiles = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.filter(record => record.kind === "profile-viewport-zoom");
  assert.deepEqual(profiles.map(record => ({
    id: record.subjectId,
    chapterId: record.chapterId,
    stopId: record.stopId,
    sceneId: record.sceneId,
    fixtureId: record.fixtureId,
    optionIds: record.optionIds,
    option: new URL(record.url, "http://gallery.invalid").searchParams.get("option")
  })), [
    { id: "desktop-full-full", chapterId: "fossil-canyon", stopId: "s11", sceneId: "scene-s11", fixtureId: "assessed-correct-resolved", optionIds: [...LAYOUT_SOURCE_FACTS["scene-s11"].controls], option: null },
    { id: "desktop-simplified-full", chapterId: "star-reach", stopId: "s36", sceneId: "scene-s36", fixtureId: "assessed-correct-resolved", optionIds: [...LAYOUT_SOURCE_FACTS["scene-s36"].controls], option: null },
    { id: "desktop-full-reduced", chapterId: "star-reach", stopId: "s40", sceneId: "scene-s40", fixtureId: "boss-resolved", optionIds: ["scene-s40-option-action-path"], option: "scene-s40-option-action-path" },
    { id: "desktop-simplified-reduced", chapterId: "fossil-canyon", stopId: "s11", sceneId: "scene-s11", fixtureId: "assessed-correct-resolved", optionIds: [...LAYOUT_SOURCE_FACTS["scene-s11"].controls], option: null },
    { id: "portrait-320x568", chapterId: "fossil-canyon", stopId: "s11", sceneId: "scene-s11", fixtureId: "assessed-correct-resolved", optionIds: [...LAYOUT_SOURCE_FACTS["scene-s11"].controls], option: null },
    { id: "landscape-568x320", chapterId: "star-reach", stopId: "s36", sceneId: "scene-s36", fixtureId: "assessed-correct-resolved", optionIds: [...LAYOUT_SOURCE_FACTS["scene-s36"].controls], option: null },
    { id: "tablet-1194x834", chapterId: "star-reach", stopId: "s40", sceneId: "scene-s40", fixtureId: "boss-resolved", optionIds: ["scene-s40-option-fiction-path"], option: "scene-s40-option-fiction-path" },
    { id: "zoom-200-effective-320x568", chapterId: "star-reach", stopId: "s36", sceneId: "scene-s36", fixtureId: "assessed-correct-resolved", optionIds: [...LAYOUT_SOURCE_FACTS["scene-s36"].controls], option: null }
  ]);
});

test("character and creator records bind exact renderer, pose, appearance, and rendered-part facts", () => {
  const character = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.find(record => record.kind === "character-pose");
  const creator = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.find(record => record.kind === "creator-option");
  assert.deepEqual(character.expectedCodeNativeSemanticIds, ["character:bouncy"]);
  assert.deepEqual(creator.expectedCodeNativeSemanticIds, ["character:player"]);
  assert.deepEqual(Object.keys(character.expectedRenderedFacts), [
    "kind", "characterId", "poseId", "poseRendererId", "poseCompositionSignature",
    "characterVisualSignature", "renderedPartIds"
  ]);
  assert.equal(character.expectedRenderedFacts.characterId, "Bouncy");
  assert.equal(character.expectedRenderedFacts.poseId, "idle");
  assert.equal(character.expectedRenderedFacts.poseRendererId, "pose:idle");
  assert.match(character.expectedRenderedFacts.poseCompositionSignature, /^pose-composition:/u);
  assert.match(character.expectedRenderedFacts.characterVisualSignature, /^character-visual:/u);
  assert.equal(character.expectedRenderedFacts.renderedPartIds.length, 14);
  const creatorFacts = creator.expectedRenderedFacts;
  assert.deepEqual(Object.keys(creatorFacts), [
    "kind", "selectedOptionId", "serializedAppearance", "appearanceSignature",
    "previewSerializedAppearance", "worldSerializedAppearance",
    "previewAppearanceSignature", "worldAppearanceSignature",
    "previewBodyShapeId", "worldBodyShapeId",
    "previewComputedPaletteValue", "worldComputedPaletteValue",
    "previewAccessoryIds", "worldAccessoryIds",
    "previewRenderedPartIds", "worldRenderedPartIds"
  ]);
  assert.equal(creatorFacts.selectedOptionId, creator.subjectId);
  assert.equal(JSON.stringify(JSON.parse(creatorFacts.serializedAppearance)), creatorFacts.serializedAppearance);
  assert.equal(creatorFacts.appearanceSignature, `sound-seekers-appearance:${creatorFacts.serializedAppearance}`);
  assert.equal(creatorFacts.previewSerializedAppearance, creatorFacts.serializedAppearance);
  assert.equal(creatorFacts.worldSerializedAppearance, creatorFacts.serializedAppearance);
  assert.equal(creatorFacts.previewAppearanceSignature, creatorFacts.appearanceSignature);
  assert.equal(creatorFacts.worldAppearanceSignature, creatorFacts.appearanceSignature);
  assert.equal(creatorFacts.previewBodyShapeId, JSON.parse(creatorFacts.serializedAppearance).bodyShapeId);
  assert.equal(creatorFacts.worldBodyShapeId, creatorFacts.previewBodyShapeId);
  assert.match(creatorFacts.previewComputedPaletteValue, /^#[a-f0-9]{6}$/iu);
  assert.equal(creatorFacts.worldComputedPaletteValue, creatorFacts.previewComputedPaletteValue);
  assert.equal(creatorFacts.previewAccessoryIds.length, 4);
  assert.deepEqual(creatorFacts.worldAccessoryIds, creatorFacts.previewAccessoryIds);
  assert.deepEqual(creatorFacts.previewRenderedPartIds, creatorFacts.worldRenderedPartIds);
});

test("each creator option is bound to the specific rendered appearance dimension it selects", () => {
  for (const record of SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.filter(item => item.kind === "creator-option")) {
    const facts = record.expectedRenderedFacts;
    const appearance = JSON.parse(facts.serializedAppearance);
    if (SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes.includes(record.subjectId)) {
      assert.equal(appearance.bodyShapeId, record.subjectId, record.id);
      assert.equal(facts.previewBodyShapeId, record.subjectId, record.id);
    } else if (SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes.includes(record.subjectId)) {
      assert.equal(appearance.paletteTokenId, record.subjectId, record.id);
      assert.equal(facts.previewComputedPaletteValue, SOUND_SEEKERS_VISUAL_TOKENS[record.subjectId], record.id);
    } else {
      assert.equal(Object.values(appearance.accessories).includes(record.subjectId), true, record.id);
      assert.equal(facts.previewAccessoryIds.includes(record.subjectId), true, record.id);
    }
  }
});

test("the true 200 percent gallery profile uses CSS zoom rather than device density", () => {
  const matrix = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.find(record =>
    record.subjectId === "zoom-200-effective-320x568");
  assert.deepEqual(galleryBrowserProfile(matrix), {
    viewport: { width: 640, height: 1136 },
    deviceScaleFactor: 1,
    pageScaleFactor: 2,
    effectiveViewport: { width: 320, height: 568 }
  });
});

test("all sixteen boss branches bind selected-option rendered facts for ordinary, Wonder, and boss pixels", () => {
  const bosses = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.filter(record => record.kind === "boss-branch");
  assert.equal(bosses.length, 16);
  for (const [sceneId, records] of Map.groupBy(bosses, record => record.sceneId)) {
    assert.equal(records.length, 2, sceneId);
    assert.equal(new Set(records.map(record => record.expectedRenderedFacts.selectedOptionVisualId)).size, 2, sceneId);
    assert.equal(new Set(records.map(record => record.expectedRenderedFacts.resolvedVisualStateId)).size, 2, sceneId);
    for (const record of records) {
      assert.deepEqual(Object.keys(record.expectedRenderedFacts), [
        "kind", "selectedOptionVisualId", "postDecisionSemanticId", "resolvedVisualStateId",
        "landmarkStateId", "ordinaryCompositionSignature",
        "wonderCompositionSignature", "bossCompositionSignature"
      ]);
      assert.equal(record.expectedRenderedFacts.kind, "boss-branch");
      assert.equal(record.expectedRenderedFacts.selectedOptionVisualId, record.subjectId);
      assert.equal(record.expectedRenderedFacts.resolvedVisualStateId, record.expectedRenderedFacts.landmarkStateId);
    }
  }
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
    ["expectedRenderedFacts", shot => { shot.expectedRenderedFacts.poseId = "fabricated"; }],
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
      if (label === "expectedRenderedFacts") return matrix.kind === "character-pose";
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
    ["rendered facts", manifest => {
      manifest.shots.find(shot => shot.expectedRenderedFacts).expectedRenderedFacts.extra = true;
    }],
    ["payoff comparison", manifest => {
      manifest.shots.find(shot => shot.kind === "boss-branch").checks.payoffComparison.extra = true;
    }],
    ["payoff variant", manifest => {
      manifest.shots.find(shot => shot.kind === "boss-branch").checks.payoffComparison.variants[0].extra = true;
    }],
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

test("all ten pose pixels per character must be independently rendered", () => {
  const manifest = mutableManifest();
  const pair = manifest.shots.filter(shot => shot.kind === "character-pose"
    && shot.expectedRenderedFacts.characterId === "Bouncy").slice(0, 2);
  assert.equal(pair.length, 2);
  pair[1].png.sha256 = pair[0].png.sha256;
  assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest), /pose pixels/u);
});

test("creator render evidence rejects every missing or wrapper-only appearance fact", () => {
  const creatorIndex = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.findIndex(record =>
    record.kind === "creator-option");
  const fields = [
    "selectedOptionId", "serializedAppearance", "appearanceSignature",
    "previewSerializedAppearance", "worldSerializedAppearance",
    "previewAppearanceSignature", "worldAppearanceSignature",
    "previewBodyShapeId", "worldBodyShapeId",
    "previewComputedPaletteValue", "worldComputedPaletteValue",
    "previewAccessoryIds", "worldAccessoryIds",
    "previewRenderedPartIds", "worldRenderedPartIds"
  ];
  for (const field of fields) {
    const manifest = mutableManifest();
    delete manifest.shots[creatorIndex].expectedRenderedFacts[field];
    assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest), undefined, field);
  }
  for (const field of ["previewAccessoryIds", "worldAccessoryIds"]) {
    const manifest = mutableManifest();
    manifest.shots[creatorIndex].expectedRenderedFacts[field] = ["back-accessory", "head-accessory"];
    assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest), undefined, `${field} wrappers`);
  }
});

test("every boss option requires its own exact three-mode pixel and composition comparison", () => {
  const bosses = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.filter(record => record.kind === "boss-branch");
  for (const matrix of bosses) {
    const shotIndex = matrix.ordinal - 1;
    const reciprocal = bosses.find(record => record.sceneId === matrix.sceneId && record.id !== matrix.id);
    for (const [label, mutate] of [
      ["missing comparison", shot => { delete shot.checks.payoffComparison; }],
      ["wrong selected option", shot => { shot.checks.payoffComparison.selectedOptionVisualId = reciprocal.subjectId; }],
      ["wrong resolved state", shot => { shot.checks.payoffComparison.resolvedVisualStateId = "fabricated"; }],
      ["reciprocal option comparison", (shot, manifest) => {
        shot.checks.payoffComparison = structuredClone(manifest.shots[reciprocal.ordinal - 1].checks.payoffComparison);
      }],
      ["wrong mode", shot => { shot.checks.payoffComparison.variants[0].mode = "boss-resolved"; }],
      ["wrong signature", shot => { shot.checks.payoffComparison.variants[0].compositionSignature = "world-composition:00000000"; }],
      ["wrong boss pixel", shot => { shot.checks.payoffComparison.variants[2].pngSha256 = "f".repeat(64); }],
      ["duplicate mode pixels", shot => { shot.checks.payoffComparison.variants[1].pngSha256 = shot.checks.payoffComparison.variants[0].pngSha256; }],
      ["duplicate mode signatures", shot => { shot.checks.payoffComparison.variants[1].compositionSignature = shot.checks.payoffComparison.variants[0].compositionSignature; }]
    ]) {
      const manifest = mutableManifest();
      mutate(manifest.shots[shotIndex], manifest);
      assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest), undefined, `${matrix.id}: ${label}`);
    }
  }
});

function placeWithGap(item, anchor, gap = 4) {
  item.x = anchor.right + gap;
  item.y = anchor.y;
  item.right = item.x + item.width;
  item.bottom = item.y + item.height;
}

function moveOutside(item) {
  item.x = -2;
  item.right = item.x + item.width;
}

test("layout evidence is mandatory and every identity, size, bound, spacing, and collision pair fails closed", () => {
  const withoutLayout = mutableManifest();
  for (const shot of withoutLayout.shots) delete shot.checks.layout;
  assert.throws(() => assertSoundSeekersV2GalleryManifest(withoutLayout), undefined, "all layout keys removed");

  const profileIndex = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.find(record => record.subjectId === "portrait-320x568").ordinal - 1;
  const cases = [
    ["null profile", () => null],
    ["missing key", layout => { delete layout.targets; return layout; }],
    ["unknown key", layout => ({ ...layout, extra: true })],
    ["wrong viewport", layout => { layout.viewport.width += 2; return layout; }],
    ["horizontal overflow", layout => { layout.horizontalOverflow = 2; return layout; }],
    ["vertical overflow", layout => { layout.verticalOverflow = 2; return layout; }],
    ["goal outside", layout => { moveOutside(layout.goal); return layout; }],
    ["small target", layout => { layout.targets[0].width = 55; layout.targets[0].right = layout.targets[0].x + 55; return layout; }],
    ["small control", layout => { layout.controls[0].height = 55; layout.controls[0].bottom = layout.controls[0].y + 55; return layout; }],
    ["wrong actor", layout => { layout.actors[0].id = "forged"; return layout; }],
    ["wrong landmark", layout => { layout.landmark.id = "forged"; return layout; }],
    ["wrong target", layout => { layout.targets[0].id = "forged"; return layout; }],
    ["wrong control", layout => { layout.controls[0].id = "forged"; return layout; }],
    ["actor-target spacing", layout => { placeWithGap(layout.targets[0], layout.actors[0]); return layout; }],
    ["actor-landmark spacing", layout => { placeWithGap(layout.landmark, layout.actors[0]); return layout; }],
    ["actor-control spacing", layout => { placeWithGap(layout.controls[0], layout.actors[0]); return layout; }],
    ["landmark-target spacing", layout => { placeWithGap(layout.targets[0], layout.landmark); return layout; }],
    ["landmark-control spacing", layout => { placeWithGap(layout.controls[0], layout.landmark); return layout; }],
    ["target-target spacing", layout => { placeWithGap(layout.targets[1], layout.targets[0]); return layout; }],
    ["target-control spacing", layout => { placeWithGap(layout.controls[0], layout.targets[0]); return layout; }],
    ["control-control spacing", layout => { placeWithGap(layout.controls[1], layout.controls[0]); return layout; }],
    ["actor outside", layout => { moveOutside(layout.actors[0]); return layout; }],
    ["landmark outside", layout => { moveOutside(layout.landmark); return layout; }],
    ["target outside", layout => { moveOutside(layout.targets[0]); return layout; }],
    ["control outside", layout => { moveOutside(layout.controls[0]); return layout; }]
  ];
  for (const [label, mutate] of cases) {
    const manifest = mutableManifest();
    manifest.shots[profileIndex].checks.layout = mutate(manifest.shots[profileIndex].checks.layout);
    assert.throws(() => assertSoundSeekersV2GalleryManifest(manifest), undefined, label);
  }

  const nonProfile = mutableManifest();
  nonProfile.shots[0].checks.layout = layoutFor(SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX[profileIndex]);
  assert.throws(() => assertSoundSeekersV2GalleryManifest(nonProfile), undefined, "layout on non-profile");
});

test("gallery source graph hashes exact JS, TS, TSX, HTML, and CSS import closure", () => {
  const rootPaths = ["preview/root.html"];
  const sources = {
    "preview/root.html": "<script type=\"module\" src=\"./entry.tsx\"></script><link rel=\"stylesheet\" href=\"./style.css\">",
    "preview/entry.tsx": "export { value } from './value.ts'; export const App = () => import('./view.tsx');",
    "preview/value.ts": "export const value: string = 'one';",
    "preview/view.tsx": "export const View = () => <div />;",
    "preview/style.css": "@import './tokens.css';",
    "preview/tokens.css": ":root { --token: green; }"
  };
  const baseline = gallerySourceGraphFromSources({ rootPaths, sources });
  assert.deepEqual(baseline.map(record => record.path), Object.keys(sources).sort());

  const unquotedHtmlSources = structuredClone(sources);
  unquotedHtmlSources["preview/root.html"] = "<script type=module src=./entry.tsx></script><link rel=stylesheet href=./style.css>";
  assert.deepEqual(
    gallerySourceGraphFromSources({ rootPaths, sources: unquotedHtmlSources }).map(record => record.path),
    Object.keys(sources).sort()
  );

  const changedSources = structuredClone(sources);
  changedSources["preview/value.ts"] = "export const value: string = 'two';";
  assert.notDeepEqual(gallerySourceGraphFromSources({ rootPaths, sources: changedSources }), baseline);

  const addedEdgeSources = structuredClone(sources);
  addedEdgeSources["preview/entry.tsx"] += " export { extra } from './extra.mjs';";
  addedEdgeSources["preview/extra.mjs"] = "export const extra = true;";
  assert.deepEqual(
    gallerySourceGraphFromSources({ rootPaths, sources: addedEdgeSources }).map(record => record.path),
    [...Object.keys(sources), "preview/extra.mjs"].sort()
  );

  const removedTargetSources = structuredClone(sources);
  delete removedTargetSources["preview/view.tsx"];
  assert.throws(
    () => gallerySourceGraphFromSources({ rootPaths, sources: removedTargetSources }),
    /unresolved gallery source edge/u
  );

  const nonliteralSources = structuredClone(sources);
  nonliteralSources["preview/entry.tsx"] = "const target = './view.tsx'; export const App = () => import(target);";
  assert.throws(
    () => gallerySourceGraphFromSources({ rootPaths, sources: nonliteralSources }),
    /non-literal dynamic import/u
  );

  const dynamicHtmlSources = structuredClone(sources);
  dynamicHtmlSources["preview/root.html"] = "<script type=module src=${entry}></script>";
  assert.throws(
    () => gallerySourceGraphFromSources({ rootPaths, sources: dynamicHtmlSources }),
    /non-literal HTML/u
  );

  for (const [label, css] of [
    ["quoted import", "@import './tokens.css';"],
    ["quoted import with media", "@import './tokens.css' screen and (min-width: 20rem);"],
    ["quoted import with layer", "@import \"./tokens.css\" layer(gallery);"],
    ["quoted url import", "@import url(\"./tokens.css\");"],
    ["quoted url import with supports", "@import url(\"./tokens.css\") supports(display: grid);"],
    ["unquoted url import", "@import url(./tokens.css);"],
    ["quoted url", ".card { background: url('./tokens.css'); }"],
    ["unquoted url", ".card { background: url(./tokens.css); }"]
  ]) {
    const cssSources = {
      "preview/style.css": css,
      "preview/tokens.css": ":root { --token: green; }"
    };
    assert.deepEqual(
      gallerySourceGraphFromSources({ rootPaths: ["preview/style.css"], sources: cssSources })
        .map(record => record.path),
      Object.keys(cssSources).sort(),
      label
    );
  }
  for (const [label, css] of [
    ["variable URL", ".card { background: url(var(--asset)); }"],
    ["interpolated URL", ".card { background: url(${asset}); }"],
    ["dynamic import URL", "@import url(var(--theme));"]
  ]) {
    assert.throws(() => gallerySourceGraphFromSources({
      rootPaths: ["preview/style.css"], sources: { "preview/style.css": css }
    }), /non-literal CSS/u, label);
  }
});
