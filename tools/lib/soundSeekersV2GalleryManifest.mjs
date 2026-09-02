import { createHash } from "node:crypto";

import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import {
  SOUND_SEEKERS_CONNECTED_TEXT,
  toChildConnectedTextScene
} from "../../src/features/soundSeekers/content/connectedText.js";
import {
  SOUND_SEEKERS_MEANING_VISUAL_OWNERS,
  SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES,
  SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY
} from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import {
  SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS,
  appearanceSignature,
  createCharacterAppearance,
  serializeCharacterAppearance
} from "../../src/features/soundSeekers/visual/characterCustomization.js";
import {
  SOUND_SEEKERS_CHARACTER_VISUALS,
  SOUND_SEEKERS_PLAYER_VISUAL,
  SOUND_SEEKERS_POSE_IDS,
  characterVisualSignature,
  poseCompositionSignature,
  resolvePoseRenderer
} from "../../src/features/soundSeekers/visual/characterCatalog.js";
import {
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  SOUND_SEEKERS_MEANING_VISUALS,
  SOUND_SEEKERS_ROUTE_SPECS,
  SOUND_SEEKERS_SCENE_RENDER_SPECS
} from "../../src/features/soundSeekers/visual/sceneVisualCatalog.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../../src/features/soundSeekers/visual/visualTokens.js";
import { readSoundSeekersV2AssetManifest } from "./soundSeekersV2AssetManifest.mjs";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]));
}

export function canonicalJson(value) {
  return JSON.stringify(sorted(value));
}

export function sha256Canonical(value) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

const slug = value => String(value).toLocaleLowerCase("en-US")
  .replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").replace(/-{2,}/gu, "-");
const url = params => `/preview/sound-seekers-v2-content.html?${new URLSearchParams(params)}`;
const sceneForStop = stopId => SOUND_SEEKERS_CONNECTED_TEXT.find(scene => scene.stopId === stopId);
const desktop = Object.freeze({ width: 1280, height: 800 });
const characterPartIds = Object.freeze([
  "back-accessory", "contact-shadow", "left-leg", "right-leg", "torso",
  "left-arm", "right-arm", "head", "face", "features", "role-prop",
  "neck-accessory", "head-accessory", "held-accessory"
]);

function stableGlyphSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function expectedWorldCompositionSignature({ chapterId, sceneId, visualStateId, scenePhase, compositionMode }) {
  const seed = stableGlyphSeed([chapterId, sceneId, visualStateId, scenePhase, compositionMode].join(":"));
  return `world-composition:${seed.toString(16).padStart(8, "0")}`;
}

function shot(id, kind, fields = {}) {
  return {
    id: slug(id),
    kind,
    url: fields.url,
    seed: 11,
    fixtureId: fields.fixtureId || "pre-choice",
    chapterId: fields.chapterId ?? null,
    stopId: fields.stopId ?? null,
    sceneId: fields.sceneId ?? null,
    subjectId: fields.subjectId ?? null,
    cropProfileId: fields.cropProfileId ?? null,
    densityProfile: fields.densityProfile || "full",
    motionProfile: fields.motionProfile || "reduced",
    viewport: fields.viewport || desktop,
    browserZoom: fields.browserZoom || 1,
    expectedCodeNativeSemanticIds: fields.expectedCodeNativeSemanticIds || [],
    reviewBackdropSemanticIds: fields.reviewBackdropSemanticIds || [],
    optionIds: fields.optionIds || [],
    asset: fields.asset || null,
    inputKind: fields.inputKind ?? null,
    expectedVisibleControlIds: [],
    expectedFocusTargetId: null
  };
}

function creatorAppearance(optionId) {
  const defaultAccessories = Object.fromEntries(["back", "head", "neck", "held"].map(slot => [
    slot,
    SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot[slot].find(value => value !== null)
  ]));
  const raw = {
    schemaVersion: 1,
    bodyShapeId: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes[0],
    paletteTokenId: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes[0],
    accessories: defaultAccessories
  };
  if (SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes.includes(optionId)) raw.bodyShapeId = optionId;
  if (SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes.includes(optionId)) raw.paletteTokenId = optionId;
  for (const slot of ["back", "head", "neck", "held"]) {
    if (SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot[slot].includes(optionId)) {
      raw.accessories[slot] = optionId;
    }
  }
  return createCharacterAppearance(raw);
}

function expectedRenderedFacts(record) {
  if (record.kind === "character-pose") {
    const [characterId, poseId] = record.subjectId.split(":");
    const visual = [...SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_PLAYER_VISUAL]
      .find(candidate => candidate.characterId === characterId);
    const pose = resolvePoseRenderer(poseId);
    return {
      kind: "character-pose",
      characterId,
      poseId,
      poseRendererId: visual.poseRendererIds[poseId],
      poseCompositionSignature: poseCompositionSignature(pose),
      characterVisualSignature: characterVisualSignature(visual),
      renderedPartIds: [...characterPartIds]
    };
  }
  if (record.kind === "creator-option") {
    const appearance = creatorAppearance(record.subjectId);
    const serializedAppearance = serializeCharacterAppearance(appearance);
    const signature = appearanceSignature(appearance);
    return {
      kind: "creator-option",
      selectedOptionId: record.subjectId,
      serializedAppearance,
      appearanceSignature: signature,
      previewSerializedAppearance: serializedAppearance,
      worldSerializedAppearance: serializedAppearance,
      previewAppearanceSignature: signature,
      worldAppearanceSignature: signature,
      previewBodyShapeId: appearance.bodyShapeId,
      worldBodyShapeId: appearance.bodyShapeId,
      previewComputedPaletteValue: SOUND_SEEKERS_VISUAL_TOKENS[appearance.paletteTokenId],
      worldComputedPaletteValue: SOUND_SEEKERS_VISUAL_TOKENS[appearance.paletteTokenId],
      previewAccessoryIds: Object.values(appearance.accessories).sort(),
      worldAccessoryIds: Object.values(appearance.accessories).sort(),
      previewRenderedPartIds: [...characterPartIds],
      worldRenderedPartIds: [...characterPartIds]
    };
  }
  if (record.kind === "boss-branch") {
    const scene = SCENE_BY_ID.get(record.sceneId);
    const option = scene?.choice.options.find(candidate => candidate.visualSemanticId === record.subjectId);
    const branch = SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.find(candidate => (
      candidate.sceneId === record.sceneId && candidate.token === option?.token
    ));
    const postDecision = semanticById.get(branch?.postDecisionSemanticId);
    if (!scene || !option || !branch || !postDecision) {
      throw new TypeError(`boss gallery record ${record.id} has no exact selected-branch authority`);
    }
    return {
      kind: "boss-branch",
      selectedOptionVisualId: option.visualSemanticId,
      postDecisionSemanticId: branch.postDecisionSemanticId,
      resolvedVisualStateId: postDecision.resolvedStateId,
      landmarkStateId: postDecision.resolvedStateId,
      ordinaryCompositionSignature: expectedWorldCompositionSignature({
        chapterId: scene.chapterId, sceneId: scene.id, visualStateId: postDecision.resolvedStateId,
        scenePhase: "resolved", compositionMode: "ordinary"
      }),
      wonderCompositionSignature: expectedWorldCompositionSignature({
        chapterId: scene.chapterId, sceneId: scene.id, visualStateId: postDecision.resolvedStateId,
        scenePhase: "resolved", compositionMode: "wonder"
      }),
      bossCompositionSignature: expectedWorldCompositionSignature({
        chapterId: scene.chapterId, sceneId: scene.id, visualStateId: postDecision.resolvedStateId,
        scenePhase: "resolved", compositionMode: "boss-resolved"
      })
    };
  }
  return null;
}

const semanticById = new Map(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.map(record => [record.id, record]));
const renderBySceneId = new Map(SOUND_SEEKERS_SCENE_RENDER_SPECS.map(record => [record.sceneId, record]));
const routeByStopId = new Map(SOUND_SEEKERS_ROUTE_SPECS.map(record => [record.stopId, record]));
const landmarkBySceneId = new Map(SOUND_SEEKERS_LANDMARK_BINDINGS.map(record => [record.sceneId, record]));
const creatorControlIds = Object.freeze([
  ...SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes,
  ...SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes,
  ...["back", "head", "neck", "held"].flatMap(slot =>
    SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot[slot].map(value => value ?? "none"))
]);

function postDecisionFor(record, scene, renderSpec) {
  if (!record.fixtureId || record.fixtureId === "pre-choice" || record.fixtureId.includes("correction")) return null;
  if (scene.choice.kind !== "narrative_bridge") {
    return semanticById.get(renderSpec.postDecisionSemanticIds[0]);
  }
  const optionId = new URL(record.url, "http://gallery.invalid").searchParams.get("option");
  const childScene = toChildConnectedTextScene(scene.id, `gallery:${record.seed}`);
  const option = childScene.choice.options.find(candidate => candidate.visualSemanticId === optionId)
    || childScene.choice.options[0];
  const branch = SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.find(candidate =>
    candidate.sceneId === scene.id && candidate.token === option.token);
  return semanticById.get(branch.postDecisionSemanticId);
}

function expectedRenderedSemanticIds(record) {
  if (record.kind === "character-pose") {
    return [`character:${slug(record.subjectId.split(":")[0])}`];
  }
  if (record.kind === "creator-option") return ["character:player"];
  const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(candidate => candidate.id === record.sceneId);
  const renderSpec = renderBySceneId.get(record.sceneId);
  const route = routeByStopId.get(record.stopId);
  const landmark = landmarkBySceneId.get(record.sceneId);
  const preChoice = semanticById.get(renderSpec.preChoiceSemanticId);
  const post = postDecisionFor(record, scene, renderSpec);
  const currentState = post
    ? (record.fixtureId.endsWith("action") ? post.actionStateId : post.resolvedStateId)
    : preChoice.neutralStateId;
  const optionSemantics = scene.choice.options.flatMap(option => {
    const semantic = semanticById.get(option.visualSemanticId);
    return [semantic.id, semantic.frameSemanticId, ...semantic.propSemanticIds, semantic.actionSemanticId];
  });
  return [...new Set([
    preChoice.settingId,
    route.id,
    landmark.id,
    currentState,
    ...(post ? [post.id, landmark.id] : preChoice.neutralPropIds),
    ...renderSpec.characterBindings.map(binding => `character:${slug(binding.characterId)}`),
    ...optionSemantics,
    `prop-family:${scene.chapterId}`,
    ...(record.fixtureId.includes("direct-meaning") ? [record.subjectId] : [])
  ])].sort();
}

function finalizeMatrixRecord(record, index) {
  const scene = record.sceneId
    ? SOUND_SEEKERS_CONNECTED_TEXT.find(candidate => candidate.id === record.sceneId)
    : null;
  const childScene = scene ? toChildConnectedTextScene(scene.id, `gallery:${record.seed}`) : null;
  const expectedVisibleControlIds = record.kind === "creator-option"
    ? [...creatorControlIds]
    : record.kind === "character-pose" || !scene
      ? []
      : childScene.choice.options.map(option => option.visualSemanticId);
  return deepFreeze({
    ordinal: index + 1,
    ...record,
    expectedCodeNativeSemanticIds: expectedRenderedSemanticIds(record),
    expectedVisibleControlIds,
    expectedFocusTargetId: record.kind === "input-focus" ? expectedVisibleControlIds[0] : null,
    expectedRenderedFacts: expectedRenderedFacts(record)
  });
}

function buildMatrix() {
  const manifest = readSoundSeekersV2AssetManifest();
  const matrix = [];
  for (const asset of manifest.assets) {
    for (const profile of asset.cropReview.profiles) {
      matrix.push(shot(`background-crop-${asset.chapterId}-${profile.id}`, "background-crop", {
        chapterId: asset.chapterId,
        stopId: SOUND_SEEKERS_CHAPTERS.find(chapter => chapter.id === asset.chapterId).stopIds[0],
        sceneId: sceneForStop(SOUND_SEEKERS_CHAPTERS.find(chapter => chapter.id === asset.chapterId).stopIds[0]).id,
        cropProfileId: profile.id,
        viewport: { width: profile.targetSize[0], height: profile.targetSize[1] },
        reviewBackdropSemanticIds: asset.task4.backdropReviewSemanticIds,
        asset: { path: asset.path, sha256: asset.final.sha256, cropRecordSha256: profile.panelSha256 },
        url: url({ mode: "background-crop", stop: SOUND_SEEKERS_CHAPTERS.find(chapter => chapter.id === asset.chapterId).stopIds[0], fixture: "pre-choice", density: "full", motion: "reduced", labels: "hidden", seed: "11" })
      }));
    }
  }
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    matrix.push(shot(`chapter-map-${chapter.id}`, "chapter-map", {
      chapterId: chapter.id, stopId: chapter.stopIds[0], sceneId: sceneForStop(chapter.stopIds[0]).id,
      subjectId: chapter.id,
      url: url({ mode: "chapter-map", stop: chapter.stopIds[0], fixture: "pre-choice", density: "full", motion: "reduced", labels: "shown", seed: "11" })
    }));
  }
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    matrix.push(shot(`scene-options-${scene.id}`, "scene-options", {
      chapterId: scene.chapterId, stopId: scene.stopId, sceneId: scene.id, subjectId: scene.id,
      optionIds: scene.choice.options.map(option => option.visualSemanticId),
      url: url({ scene: scene.id, fixture: "pre-choice", density: "full", motion: "reduced", labels: "shown", seed: "11" })
    }));
  }
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const routeScene = sceneForStop(expedition.stopId);
    const routeFixture = routeScene.choice.kind === "narrative_bridge" ? "boss-resolved" : "assessed-correct-resolved";
    const routeOptionId = routeScene.choice.kind === "narrative_bridge"
      ? routeScene.choice.options[0].visualSemanticId : null;
    matrix.push(shot(`route-landmark-${expedition.stopId}`, "route-landmark", {
      chapterId: expedition.chapterId, stopId: expedition.stopId, sceneId: expedition.connectedTextId,
      subjectId: expedition.stopId, fixtureId: routeFixture,
      optionIds: routeOptionId ? [routeOptionId] : [],
      url: url({ mode: "route-landmark", stop: expedition.stopId, fixture: routeFixture, density: "full", motion: "reduced", labels: "shown", seed: "11", ...(routeOptionId ? { option: routeOptionId } : {}) })
    }));
  }
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const stopId = chapter.stopIds.at(-1);
    const scene = sceneForStop(stopId);
    const optionId = scene.choice.options[0].visualSemanticId;
    matrix.push(shot(`wonder-${chapter.id}`, "wonder", {
      chapterId: chapter.id, stopId, sceneId: scene.id, subjectId: chapter.wonderId,
      optionIds: [optionId], fixtureId: "boss-resolved",
      url: url({ mode: "wonder", stop: stopId, fixture: "boss-resolved", density: "full", motion: "reduced", labels: "shown", seed: "11", option: optionId })
    }));
  }
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const stopId = chapter.stopIds.at(-1);
    const scene = sceneForStop(stopId);
    for (const option of scene.choice.options) {
      matrix.push(shot(`boss-branch-${scene.id}-${option.visualSemanticId}`, "boss-branch", {
        chapterId: chapter.id, stopId, sceneId: scene.id, subjectId: option.visualSemanticId,
        optionIds: [option.visualSemanticId], fixtureId: "boss-resolved",
        url: url({ scene: scene.id, fixture: "boss-resolved", density: "full", motion: "reduced", labels: "shown", seed: "11", option: option.visualSemanticId })
      }));
    }
  }
  for (const character of [...SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_PLAYER_VISUAL]) {
    for (const poseId of SOUND_SEEKERS_POSE_IDS) {
      matrix.push(shot(`character-pose-${character.characterId}-${poseId}`, "character-pose", {
        chapterId: character.chapterId, subjectId: `${character.characterId}:${poseId}`,
        url: url({ mode: `character-${slug(character.characterId)}`, stop: character.chapterId
          ? SOUND_SEEKERS_CHAPTERS.find(chapter => chapter.id === character.chapterId).stopIds[0] : "s1",
        fixture: "pre-choice", density: "full", motion: "reduced", labels: "shown", seed: "11",
        option: poseId })
      }));
    }
  }
  const meaningVisualById = new Map(SOUND_SEEKERS_MEANING_VISUALS.map(visual => [visual.semanticId, visual]));
  for (const owner of [...SOUND_SEEKERS_MEANING_VISUAL_OWNERS]
    .sort((left, right) => left.meaningSemanticId.localeCompare(right.meaningSemanticId))) {
    const visual = meaningVisualById.get(owner.meaningSemanticId);
    const scene = SCENE_BY_ID.get(owner.sceneId);
    matrix.push(shot(`meaning-${owner.meaningSemanticId}`, "meaning", {
      chapterId: scene.chapterId, stopId: scene.stopId, sceneId: scene.id,
      subjectId: visual.semanticId, fixtureId: scene.choice.kind === "narrative_bridge" ? "boss-direct-meaning" : "assessed-direct-meaning",
      url: url({ mode: `meaning-${slug(owner.meaningSemanticId)}`, scene: scene.id,
        fixture: scene.choice.kind === "narrative_bridge" ? "boss-direct-meaning" : "assessed-direct-meaning",
        density: "full", motion: "reduced", labels: "shown", seed: "11",
        ...(scene.choice.kind === "narrative_bridge" ? { option: scene.choice.options.find(option => {
          const branch = scene.narrativeBranches.find(item => item.postDecisionSemanticId === owner.postDecisionSemanticId);
          return branch?.token === option.token;
        }).visualSemanticId } : {}) })
    }));
  }
  for (const asset of manifest.assets) {
    const chapter = SOUND_SEEKERS_CHAPTERS.find(item => item.id === asset.chapterId);
    const stopId = chapter.stopIds[0];
    matrix.push(shot(`background-failure-${asset.chapterId}`, "background-failure", {
      chapterId: asset.chapterId, stopId, sceneId: sceneForStop(stopId).id, subjectId: asset.id,
      asset: { path: asset.path, sha256: asset.final.sha256, cropRecordSha256: null },
      url: url({ mode: "background-failure", stop: stopId, fixture: "pre-choice", density: "full", motion: "reduced", labels: "shown", seed: "11" })
    }));
  }
  for (const optionId of SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes) {
    matrix.push(creatorShot(optionId));
  }
  for (const optionId of SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes) {
    matrix.push(creatorShot(optionId));
  }
  for (const slotId of ["back", "head", "neck", "held"]) {
    for (const optionId of SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot[slotId].filter(Boolean)) {
      matrix.push(creatorShot(optionId));
    }
  }
  const profiles = [
    ["desktop-full-full", 1280, 800, "full", "full", 1, "s11", "assessed-correct-resolved", null],
    ["desktop-simplified-full", 1280, 800, "simplified", "full", 1, "s36", "assessed-correct-resolved", null],
    ["desktop-full-reduced", 1280, 800, "full", "reduced", 1, "s40", "boss-resolved", "scene-s40-option-action-path"],
    ["desktop-simplified-reduced", 1280, 800, "simplified", "reduced", 1, "s11", "assessed-correct-resolved", null],
    ["portrait-320x568", 320, 568, "full", "reduced", 1, "s11", "assessed-correct-resolved", null],
    ["landscape-568x320", 568, 320, "full", "reduced", 1, "s36", "assessed-correct-resolved", null],
    ["tablet-1194x834", 1194, 834, "full", "reduced", 1, "s40", "boss-resolved", "scene-s40-option-fiction-path"],
    ["zoom-200-effective-320x568", 640, 1136, "full", "reduced", 2, "s36", "assessed-correct-resolved", null]
  ];
  for (const [
    profileId, width, height, densityProfile, motionProfile, browserZoom,
    stopId, fixtureId, selectedOptionId
  ] of profiles) {
    const scene = sceneForStop(stopId);
    const optionIds = selectedOptionId
      ? [selectedOptionId]
      : toChildConnectedTextScene(scene.id, "gallery:11").choice.options.map(option => option.visualSemanticId);
    matrix.push(shot(`profile-${profileId}`, "profile-viewport-zoom", {
      chapterId: scene.chapterId, stopId, sceneId: scene.id, subjectId: profileId,
      fixtureId, optionIds,
      densityProfile, motionProfile, viewport: { width, height }, browserZoom,
      url: url({
        stop: stopId, fixture: fixtureId, density: densityProfile, motion: motionProfile,
        labels: "shown", seed: "11", ...(selectedOptionId ? { option: selectedOptionId } : {})
      })
    }));
  }
  for (const inputKind of ["pointer", "touch", "Enter", "Space"]) {
    matrix.push(shot(`input-focus-${inputKind}`, "input-focus", {
      stopId: "s1", sceneId: "scene-s1", subjectId: inputKind, inputKind,
      url: url({ stop: "s1", fixture: "pre-choice", density: "full", motion: "reduced", labels: "shown", seed: "11" })
    }));
  }
  return matrix.map(finalizeMatrixRecord);
}

function creatorShot(optionId) {
  return shot(`creator-option-${optionId}`, "creator-option", {
    stopId: "s1", sceneId: "scene-s1", subjectId: optionId,
    url: url({ mode: "creator", stop: "s1", fixture: "pre-choice", density: "full", motion: "reduced", labels: "shown", seed: "11", option: optionId })
  });
}

const SCENE_BY_ID = new Map(SOUND_SEEKERS_CONNECTED_TEXT.map(scene => [scene.id, scene]));

export const SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX = deepFreeze(buildMatrix());
export const SOUND_SEEKERS_V2_GALLERY_MATRIX_SHA256 = sha256Canonical(SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX);

export function soundSeekersV2GalleryRunId({ sourceHashes, matrixSha256 = SOUND_SEEKERS_V2_GALLERY_MATRIX_SHA256 } = {}) {
  return sha256Canonical({ schemaVersion: 1, sourceHashes, matrixSha256 }).slice(0, 24);
}

export function buildSoundSeekersV2GalleryManifest({ sourceHashes, shots } = {}) {
  const matrixSha256 = SOUND_SEEKERS_V2_GALLERY_MATRIX_SHA256;
  return deepFreeze({
    schemaVersion: 1,
    status: "complete",
    runId: soundSeekersV2GalleryRunId({ sourceHashes, matrixSha256 }),
    sourceHashes,
    matrixSha256,
    shotCount: SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.length,
    shots: Array.isArray(shots) ? shots : []
  });
}

const SOURCE_HASH_KEYS = [
  "contentCatalogSha256", "visualCatalogSha256", "creatorOptionsSha256",
  "assetManifestSha256", "browserName", "browserVersion", "gallerySourceGraphSha256"
];

const MANIFEST_KEYS = ["schemaVersion", "status", "runId", "sourceHashes", "matrixSha256", "shotCount", "shots"];
const SHOT_KEYS = [
  "ordinal", "id", "kind", "relativePngPath", "url", "seed", "fixtureId",
  "chapterId", "stopId", "sceneId", "subjectId", "cropProfileId",
  "densityProfile", "motionProfile", "viewport", "browserZoom",
  "expectedCodeNativeSemanticIds", "reviewBackdropSemanticIds", "optionIds",
  "asset", "expectedRenderedFacts", "png", "checks", "status"
];
const VIEWPORT_KEYS = ["width", "height"];
const ASSET_KEYS = ["path", "sha256", "cropRecordSha256"];
const PNG_KEYS = ["width", "height", "byteLength", "sha256"];
const BASE_CHECK_KEYS = [
  "consoleErrors", "pageErrors", "failedRequests", "visibleControlIds",
  "focusTargetId", "noAnswerLeak", "payoffComparison"
];
const CHECK_KEYS = [...BASE_CHECK_KEYS, "layout"];
const CHARACTER_RENDER_KEYS = [
  "kind", "characterId", "poseId", "poseRendererId", "poseCompositionSignature",
  "characterVisualSignature", "renderedPartIds"
];
const CREATOR_RENDER_KEYS = [
  "kind", "selectedOptionId", "serializedAppearance", "appearanceSignature",
  "previewSerializedAppearance", "worldSerializedAppearance",
  "previewAppearanceSignature", "worldAppearanceSignature",
  "previewBodyShapeId", "worldBodyShapeId",
  "previewComputedPaletteValue", "worldComputedPaletteValue",
  "previewAccessoryIds", "worldAccessoryIds",
  "previewRenderedPartIds", "worldRenderedPartIds"
];
const BOSS_RENDER_KEYS = [
  "kind", "selectedOptionVisualId", "postDecisionSemanticId", "resolvedVisualStateId",
  "landmarkStateId", "ordinaryCompositionSignature",
  "wonderCompositionSignature", "bossCompositionSignature"
];
const PAYOFF_COMPARISON_KEYS = ["selectedOptionVisualId", "resolvedVisualStateId", "variants"];
const PAYOFF_VARIANT_KEYS = ["mode", "compositionSignature", "pngSha256"];
const PAYOFF_MODES = ["ordinary", "wonder", "boss-resolved"];
const FAILURE_KEYS = ["url", "method", "reason"];
const LAYOUT_KEYS = [
  "viewport", "horizontalOverflow", "verticalOverflow", "goal", "actors",
  "landmark", "targets", "controls"
];
const RECT_KEYS = ["x", "y", "width", "height", "right", "bottom"];
const LAYOUT_ITEM_KEYS = ["id", ...RECT_KEYS];

function hasExactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && Object.keys(value).every(key => keys.includes(key)));
}

function canonicalAsset(matrix) {
  return matrix.asset || { path: null, sha256: null, cropRecordSha256: null };
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validRectCoordinates(rect) {
  return RECT_KEYS.every(key => finiteNumber(rect?.[key]))
    && rect.width > 0 && rect.height > 0
    && Math.abs(rect.right - rect.x - rect.width) <= 0.1
    && Math.abs(rect.bottom - rect.y - rect.height) <= 0.1;
}

function validRect(rect) {
  return hasExactKeys(rect, RECT_KEYS) && validRectCoordinates(rect);
}

function validLayoutItem(item) {
  return hasExactKeys(item, LAYOUT_ITEM_KEYS)
    && typeof item.id === "string" && item.id.length > 0
    && validRectCoordinates(item);
}

function separatedBy(left, right, minimum = 8) {
  const horizontalGap = Math.max(right.x - left.right, left.x - right.right);
  const verticalGap = Math.max(right.y - left.bottom, left.y - right.bottom);
  return Math.max(horizontalGap, verticalGap) >= minimum;
}

function crossGroupSeparated(left, right) {
  return left.every(leftItem => right.every(rightItem => separatedBy(leftItem, rightItem)));
}

function withinGroupSeparated(items) {
  return items.every((item, index) => items.slice(index + 1).every(other => separatedBy(item, other)));
}

function expectedLayoutIdentities(matrix) {
  const scene = SCENE_BY_ID.get(matrix.sceneId);
  const renderSpec = renderBySceneId.get(matrix.sceneId);
  const landmark = landmarkBySceneId.get(matrix.sceneId);
  const preChoice = semanticById.get(renderSpec?.preChoiceSemanticId);
  const postDecision = scene && renderSpec ? postDecisionFor(matrix, scene, renderSpec) : null;
  if (!scene || !renderSpec || !landmark || !preChoice) return null;
  const visualStateId = postDecision
    ? (matrix.fixtureId.endsWith("action") ? postDecision.actionStateId : postDecision.resolvedStateId)
    : preChoice.neutralStateId;
  return {
    actors: renderSpec.characterBindings.map(binding => binding.characterId),
    landmark: landmark.id,
    targets: postDecision
      ? [postDecision.id, visualStateId, landmark.id]
      : [...preChoice.neutralPropIds],
    controls: toChildConnectedTextScene(scene.id, `gallery:${matrix.seed}`).choice.options
      .map(option => option.visualSemanticId)
  };
}

function validConstrainedLayout(layout, matrix) {
  const identities = expectedLayoutIdentities(matrix);
  if (!hasExactKeys(layout, LAYOUT_KEYS)
    || !hasExactKeys(layout.viewport, VIEWPORT_KEYS)
    || !finiteNumber(layout.viewport.width) || !finiteNumber(layout.viewport.height)
    || !finiteNumber(layout.horizontalOverflow) || layout.horizontalOverflow < 0
    || !finiteNumber(layout.verticalOverflow) || layout.verticalOverflow < 0
    || !validRect(layout.goal)
    || !Array.isArray(layout.actors) || layout.actors.some(actor => !validLayoutItem(actor))
    || !validLayoutItem(layout.landmark)
    || !Array.isArray(layout.targets)
    || layout.targets.some(target => !validLayoutItem(target) || target.width < 56 || target.height < 56)
    || !Array.isArray(layout.controls)
    || layout.controls.some(control => !validLayoutItem(control) || control.width < 56 || control.height < 56)
    || !identities
    || canonicalJson(layout.actors.map(actor => actor.id)) !== canonicalJson(identities.actors)
    || layout.landmark.id !== identities.landmark
    || canonicalJson(layout.targets.map(target => target.id)) !== canonicalJson(identities.targets)
    || canonicalJson(layout.controls.map(control => control.id)) !== canonicalJson(identities.controls)) {
    return false;
  }
  const expectedWidth = matrix.viewport.width / matrix.browserZoom;
  const expectedHeight = matrix.viewport.height / matrix.browserZoom;
  if (Math.abs(layout.viewport.width - expectedWidth) > 1
    || Math.abs(layout.viewport.height - expectedHeight) > 1
    || layout.horizontalOverflow > 1
    || layout.verticalOverflow > 1) {
    return false;
  }
  const bounded = [layout.goal, ...layout.actors, layout.landmark, ...layout.targets, ...layout.controls]
    .every(rect => rect.x >= -1 && rect.y >= -1
      && rect.right <= layout.viewport.width + 1 && rect.bottom <= layout.viewport.height + 1);
  return bounded
    && crossGroupSeparated(layout.actors, layout.targets)
    && crossGroupSeparated(layout.actors, [layout.landmark])
    && crossGroupSeparated(layout.actors, layout.controls)
    && crossGroupSeparated([layout.landmark], layout.targets)
    && crossGroupSeparated([layout.landmark], layout.controls)
    && withinGroupSeparated(layout.targets)
    && crossGroupSeparated(layout.targets, layout.controls)
    && withinGroupSeparated(layout.controls);
}

export function assertSoundSeekersV2GalleryLayout(layout, matrix) {
  if (!matrix || matrix.kind !== "profile-viewport-zoom" || !validConstrainedLayout(layout, matrix)) {
    throw new TypeError("Sound Seekers gallery constrained layout evidence is invalid");
  }
  return true;
}

function renderedFactKeys(kind) {
  if (kind === "character-pose") return CHARACTER_RENDER_KEYS;
  if (kind === "creator-option") return CREATOR_RENDER_KEYS;
  if (kind === "boss-branch") return BOSS_RENDER_KEYS;
  return null;
}

function validPayoffComparison(comparison, matrix, record) {
  if (matrix.kind !== "boss-branch") return comparison === null;
  if (!hasExactKeys(comparison, PAYOFF_COMPARISON_KEYS)
    || comparison.selectedOptionVisualId !== matrix.subjectId
    || comparison.selectedOptionVisualId !== matrix.expectedRenderedFacts.selectedOptionVisualId
    || comparison.resolvedVisualStateId !== matrix.expectedRenderedFacts.resolvedVisualStateId
    || !Array.isArray(comparison.variants) || comparison.variants.length !== PAYOFF_MODES.length) {
    return false;
  }
  for (let index = 0; index < PAYOFF_MODES.length; index += 1) {
    const variant = comparison.variants[index];
    const expectedSignature = matrix.expectedRenderedFacts[
      index === 0 ? "ordinaryCompositionSignature"
        : index === 1 ? "wonderCompositionSignature" : "bossCompositionSignature"
    ];
    if (!hasExactKeys(variant, PAYOFF_VARIANT_KEYS)
      || variant.mode !== PAYOFF_MODES[index]
      || variant.compositionSignature !== expectedSignature
      || !/^[a-f0-9]{64}$/u.test(variant.pngSha256 || "")) {
      return false;
    }
  }
  return new Set(comparison.variants.map(variant => variant.compositionSignature)).size === PAYOFF_MODES.length
    && new Set(comparison.variants.map(variant => variant.pngSha256)).size === PAYOFF_MODES.length
    && comparison.variants[2].pngSha256 === record.png.sha256;
}

export function assertSoundSeekersV2GalleryManifest(manifest) {
  if (!hasExactKeys(manifest, MANIFEST_KEYS)
    || manifest.schemaVersion !== 1 || manifest.status !== "complete"
    || !/^[a-f0-9]{24}$/u.test(manifest.runId || "")
    || manifest.matrixSha256 !== SOUND_SEEKERS_V2_GALLERY_MATRIX_SHA256
    || manifest.shotCount !== SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.length
    || !hasExactKeys(manifest.sourceHashes, SOURCE_HASH_KEYS)
    || manifest.sourceHashes.browserName !== "chromium"
    || !String(manifest.sourceHashes.browserVersion || "").trim()
    || SOURCE_HASH_KEYS.filter(key => key.endsWith("Sha256")).some(key => !/^[a-f0-9]{64}$/u.test(manifest.sourceHashes[key] || ""))
    || manifest.runId !== soundSeekersV2GalleryRunId({ sourceHashes: manifest.sourceHashes })
    || !Array.isArray(manifest.shots) || manifest.shots.length !== manifest.shotCount) {
    throw new TypeError("Sound Seekers gallery manifest header is invalid");
  }
  for (let index = 0; index < manifest.shots.length; index += 1) {
    const record = manifest.shots[index];
    const matrix = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX[index];
    const expectedPath = `shots/${String(index + 1).padStart(4, "0")}-${matrix.id}.png`;
    const matrixProjection = {
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
      viewport: matrix.viewport,
      browserZoom: matrix.browserZoom,
      expectedCodeNativeSemanticIds: matrix.expectedCodeNativeSemanticIds,
      reviewBackdropSemanticIds: matrix.reviewBackdropSemanticIds,
      optionIds: matrix.optionIds,
      asset: canonicalAsset(matrix),
      expectedRenderedFacts: matrix.expectedRenderedFacts
    };
    const recordProjection = Object.fromEntries(Object.keys(matrixProjection).map(key => [key, record?.[key]]));
    const layoutRequired = matrix.kind === "profile-viewport-zoom";
    const layoutInvalid = layoutRequired
      ? !validConstrainedLayout(record?.checks?.layout, matrix)
      : record?.checks?.layout !== null;
    if (!hasExactKeys(record, SHOT_KEYS)
      || record.ordinal !== index + 1 || record.id !== matrix.id || record.kind !== matrix.kind
      || record.relativePngPath !== expectedPath || record.status !== "passed"
      || canonicalJson(recordProjection) !== canonicalJson(matrixProjection)
      || !hasExactKeys(record.viewport, VIEWPORT_KEYS)
      || !hasExactKeys(record.asset, ASSET_KEYS)
      || (renderedFactKeys(record.kind) === null
        ? record.expectedRenderedFacts !== null
        : !hasExactKeys(record.expectedRenderedFacts, renderedFactKeys(record.kind)))
      || !hasExactKeys(record.png, PNG_KEYS)
      || record.png.width !== matrix.viewport.width || record.png.height !== matrix.viewport.height
      || !Number.isInteger(record.png.byteLength) || record.png.byteLength <= 0
      || !/^[a-f0-9]{64}$/u.test(record.png.sha256 || "")
      || !hasExactKeys(record.checks, CHECK_KEYS)
      || record.checks.noAnswerLeak !== true
      || !Array.isArray(record.checks.consoleErrors) || record.checks.consoleErrors.length
      || !Array.isArray(record.checks.pageErrors) || record.checks.pageErrors.length
      || canonicalJson(record.checks.visibleControlIds) !== canonicalJson(matrix.expectedVisibleControlIds)
      || record.checks.focusTargetId !== matrix.expectedFocusTargetId
      || !validPayoffComparison(record.checks.payoffComparison, matrix, record)
      || layoutInvalid) {
      throw new TypeError(layoutInvalid
        ? `Sound Seekers gallery shot ${index + 1} layout evidence is invalid`
        : `Sound Seekers gallery shot ${index + 1} is invalid`);
    }
    const expectedFailures = matrix.kind === "background-failure"
      ? [{ url: matrix.asset.path, method: "GET", reason: "route_abort" }] : [];
    if (!Array.isArray(record.checks.failedRequests)
      || record.checks.failedRequests.some(failure => !hasExactKeys(failure, FAILURE_KEYS))
      || canonicalJson(record.checks.failedRequests) !== canonicalJson(expectedFailures)) {
      throw new TypeError(`Sound Seekers gallery shot ${index + 1} has untruthful request evidence`);
    }
  }
  const ordinaryByStop = new Map(manifest.shots
    .filter(record => record.kind === "route-landmark")
    .map(record => [record.stopId, record]));
  for (const payoff of manifest.shots.filter(record => record.kind === "wonder" || record.kind === "boss-branch")) {
    const ordinary = ordinaryByStop.get(payoff.stopId);
    const sameResolvedContent = ordinary
      && canonicalJson(ordinary.optionIds) === canonicalJson(payoff.optionIds);
    if (sameResolvedContent && payoff.png.sha256 === ordinary.png.sha256) {
      throw new TypeError(`Sound Seekers gallery payoff ${payoff.id} is identical to its ordinary resolved scene`);
    }
  }
  for (const records of Map.groupBy(
    manifest.shots.filter(record => record.kind === "boss-branch"),
    record => record.sceneId
  ).values()) {
    if (records.length !== 2) throw new TypeError("Sound Seekers boss comparison requires both selected options");
    for (let variantIndex = 0; variantIndex < PAYOFF_MODES.length; variantIndex += 1) {
      const left = records[0].checks.payoffComparison.variants[variantIndex];
      const right = records[1].checks.payoffComparison.variants[variantIndex];
      if (left.compositionSignature === right.compositionSignature || left.pngSha256 === right.pngSha256) {
        throw new TypeError(`Sound Seekers boss comparison ${records[0].sceneId} reused ${PAYOFF_MODES[variantIndex]} evidence across options`);
      }
    }
  }
  for (const [characterId, records] of Map.groupBy(
    manifest.shots.filter(record => record.kind === "character-pose"),
    record => record.expectedRenderedFacts.characterId
  )) {
    if (records.length !== SOUND_SEEKERS_POSE_IDS.length
      || new Set(records.map(record => record.png.sha256)).size !== SOUND_SEEKERS_POSE_IDS.length) {
      throw new TypeError(`Sound Seekers ${characterId} pose pixels are not independently rendered`);
    }
  }
  return true;
}
