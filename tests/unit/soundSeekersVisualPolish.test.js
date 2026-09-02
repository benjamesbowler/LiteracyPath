import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import { SOUND_SEEKERS_CONNECTED_TEXT } from "../../src/features/soundSeekers/content/connectedText.js";
import {
  SOUND_SEEKERS_CHARACTER_ART_PROFILES,
  SOUND_SEEKERS_CHARACTER_VISUALS,
  SOUND_SEEKERS_PLAYER_VISUAL
} from "../../src/features/soundSeekers/visual/characterCatalog.js";
import {
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  SOUND_SEEKERS_ROUTE_SPECS
} from "../../src/features/soundSeekers/visual/sceneVisualCatalog.js";
import {
  createCharacterAppearance,
  deserializeCharacterAppearance,
  serializeCharacterAppearance
} from "../../src/features/soundSeekers/visual/characterCustomization.js";
import {
  SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX,
  assertSoundSeekersV2GalleryManifest,
  buildSoundSeekersV2GalleryManifest
} from "../../tools/lib/soundSeekersV2GalleryManifest.mjs";

let SoundSeekersCharacter;
let SoundSeekersCharacterCreator;
let SceneVisual;
let replaySoundSeekersGalleryFixture;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ SoundSeekersCharacter } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/CharacterSystem.jsx"
  ));
  ({ SoundSeekersCharacterCreator } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/CharacterCreator.jsx"
  ));
  ({ SceneVisual } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/SceneVisual.jsx"
  ));
  ({ replaySoundSeekersGalleryFixture } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/preview/galleryReplayRecipes.js"
  ));
});

test.after(async () => {
  await vite?.close();
});

function renderWorld({ chapter, compositionMode, fixtureId, optionId = null, motion = "reduced" }) {
  const stopId = chapter.stopIds.at(-1);
  const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.stopId === stopId);
  const replay = replaySoundSeekersGalleryFixture({
    recipeId: fixtureId,
    sceneId: scene.id,
    seed: 11,
    optionId
  });
  return renderToStaticMarkup(React.createElement(SceneVisual, {
    childScene: replay.childScene,
    activeAttemptId: replay.context?.attemptId || null,
    reducerRevision: replay.context?.reducerRevision ?? null,
    sceneAccess: replay.sceneAccess,
    cropProfile: "landscape",
    densityProfile: "full",
    motionProfile: motion,
    compositionMode,
    onChoose: () => {}
  }));
}

function compositionSignature(html) {
  return html.match(/data-world-composition-signature="([^"]+)"/u)?.[1] || null;
}

function transformationId(html) {
  return html.match(/data-world-transformation="([^"]+)"/u)?.[1] || null;
}

function sourceHashes() {
  return {
    contentCatalogSha256: "1".repeat(64),
    visualCatalogSha256: "2".repeat(64),
    creatorOptionsSha256: "3".repeat(64),
    assetManifestSha256: "4".repeat(64),
    browserName: "chromium",
    browserVersion: "test",
    gallerySourceGraphSha256: "5".repeat(64)
  };
}

function rectangle(x, y) {
  return { x, y, width: 56, height: 56, right: x + 56, bottom: y + 56 };
}

const CONSTRAINED_PROFILE_IDS = new Set([
  "portrait-320x568", "landscape-568x320", "tablet-1194x834",
  "zoom-200-effective-320x568"
]);

function completeShots() {
  return SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.map(matrix => ({
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
      byteLength: 1000 + matrix.ordinal,
      sha256: matrix.ordinal.toString(16).padStart(64, "0")
    },
    checks: {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: matrix.kind === "background-failure"
        ? [{ url: matrix.asset.path, method: "GET", reason: "route_abort" }]
        : [],
      visibleControlIds: matrix.expectedVisibleControlIds,
      focusTargetId: matrix.expectedFocusTargetId,
      noAnswerLeak: true,
      layout: matrix.kind === "profile-viewport-zoom"
        && CONSTRAINED_PROFILE_IDS.has(matrix.subjectId) ? {
        viewport: {
          width: matrix.viewport.width / matrix.browserZoom,
          height: matrix.viewport.height / matrix.browserZoom
        },
        horizontalOverflow: 0,
        verticalOverflow: 0,
        goal: rectangle(4, 4),
        target: rectangle(4, 72),
        actors: rectangle(72, 72),
        landmark: rectangle(140, 72),
        controls: matrix.expectedVisibleControlIds.map((_, index) => rectangle(4 + (index * 64), 150))
      } : null
    },
    status: "passed"
  }));
}

test("eight biome route materials and landmark silhouettes are canonical families", () => {
  const routeFamilies = new Set();
  const landmarkFamilies = new Set();
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const routes = SOUND_SEEKERS_ROUTE_SPECS.filter(route => route.chapterId === chapter.id);
    const landmarks = SOUND_SEEKERS_LANDMARK_BINDINGS.filter(item => item.chapterId === chapter.id);
    assert.equal(routes.length, 5);
    assert.equal(landmarks.length, 5);
    assert.equal(new Set(routes.map(route => route.routeFamilyId)).size, 1);
    assert.equal(new Set(routes.map(route => route.edgeTreatmentId)).size, 1);
    assert.equal(new Set(landmarks.map(item => item.landmarkFamilyId)).size, 1);
    routeFamilies.add(routes[0].routeFamilyId);
    landmarkFamilies.add(landmarks[0].landmarkFamilyId);
    for (const landmark of landmarks) {
      assert.equal(landmark.stateVisuals[landmark.initialStateId].stateRole, "problem");
      assert.equal(landmark.stateVisuals[landmark.initialStateId].landmarkFamilyId, landmark.landmarkFamilyId);
    }
  }
  assert.equal(routeFamilies.size, 8);
  assert.equal(landmarkFamilies.size, 8);
});

test("cast metadata and renderer create authored monochrome silhouettes with shaped limbs", () => {
  const cast = [...SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_PLAYER_VISUAL];
  const profileById = new Map(SOUND_SEEKERS_CHARACTER_ART_PROFILES.map(profile => [
    profile.characterId, profile
  ]));
  assert.ok(new Set(SOUND_SEEKERS_CHARACTER_ART_PROFILES
    .map(profile => profile.silhouetteFamilyId)).size >= 12);
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const present = cast.filter(visual => visual.chapterId === chapter.id);
    assert.equal(new Set(present.map(visual => (
      profileById.get(visual.characterId).silhouetteFamilyId
    ))).size, present.length);
  }
  for (const visual of cast) {
    const profile = profileById.get(visual.characterId);
    assert.match(profile.silhouetteFamilyId, /^silhouette-/u);
    assert.match(profile.proportionId, /^proportion-/u);
    assert.match(profile.materialId, /^material-/u);
    const html = renderToStaticMarkup(React.createElement(SoundSeekersCharacter, {
      characterId: visual.characterId,
      pose: "idle"
    }));
    assert.match(html, new RegExp(`data-silhouette-family="${profile.silhouetteFamilyId}"`, "u"));
    assert.ok((html.match(/data-shaped-limb=/gu) ?? []).length >= 4);
    assert.match(html, /data-character-part="contact-shadow"/u);
    assert.doesNotMatch(html, /class="sound-seekers-character__limb"/u);
  }
});

test("Wonder and resolved boss compositions are visibly structural and reduced-motion stable", () => {
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const stopId = chapter.stopIds.at(-1);
    const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.stopId === stopId);
    const optionId = scene.choice.options[0].visualSemanticId;
    const ordinary = renderWorld({ chapter, compositionMode: "ordinary", fixtureId: "pre-choice" });
    const wonder = renderWorld({ chapter, compositionMode: "wonder", fixtureId: "boss-resolved", optionId });
    const boss = renderWorld({ chapter, compositionMode: "boss-resolved", fixtureId: "boss-resolved", optionId });
    const bossFullMotion = renderWorld({
      chapter, compositionMode: "boss-resolved", fixtureId: "boss-resolved", optionId, motion: "full"
    });
    assert.notEqual(compositionSignature(wonder), compositionSignature(ordinary));
    assert.notEqual(compositionSignature(boss), compositionSignature(ordinary));
    assert.notEqual(transformationId(wonder), null);
    assert.notEqual(transformationId(boss), null);
    assert.equal(transformationId(bossFullMotion), transformationId(boss));
    assert.match(wonder, /data-actor-reaction="wonder"/u);
    assert.match(boss, /data-actor-reaction="resolved"/u);
  }
});

test("gallery manifest rejects identical payoff pixels and requires constrained layout facts", () => {
  const shots = completeShots();
  const valid = buildSoundSeekersV2GalleryManifest({ sourceHashes: sourceHashes(), shots });
  assert.equal(assertSoundSeekersV2GalleryManifest(valid), true);

  const duplicatePayoff = structuredClone(shots);
  const wonder = duplicatePayoff.find(shot => shot.kind === "wonder");
  const ordinary = duplicatePayoff.find(shot => shot.kind === "scene-options" && shot.sceneId === wonder.sceneId);
  wonder.png.sha256 = ordinary.png.sha256;
  assert.throws(
    () => assertSoundSeekersV2GalleryManifest(buildSoundSeekersV2GalleryManifest({
      sourceHashes: sourceHashes(), shots: duplicatePayoff
    })),
    /payoff|identical/u
  );

  const missingLayout = structuredClone(shots);
  delete missingLayout.find(shot => shot.id === "profile-portrait-320x568").checks.layout;
  assert.throws(
    () => assertSoundSeekersV2GalleryManifest(buildSoundSeekersV2GalleryManifest({
      sourceHashes: sourceHashes(), shots: missingLayout
    })),
    /layout/u
  );
});

test("creator presents visual swatches without changing serialized appearance authority", () => {
  const appearance = createCharacterAppearance({
    schemaVersion: 1,
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "player-palette-sunrise",
    accessories: { back: null, head: null, neck: null, held: null }
  });
  const serialized = serializeCharacterAppearance(appearance);
  const html = renderToStaticMarkup(React.createElement(SoundSeekersCharacterCreator, {
    value: deserializeCharacterAppearance(serialized),
    onChange: () => {}
  }));
  assert.ok((html.match(/data-creator-swatch=/gu) ?? []).length >= 22);
  assert.match(html, /data-character-context="creator-preview"/u);
  assert.equal(serializeCharacterAppearance(deserializeCharacterAppearance(serialized)), serialized);
  assert.doesNotMatch(html, /data-correct|data-answer|data-expected-token|data-private-answer/u);
});
