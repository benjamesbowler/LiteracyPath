import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import {
  toChildConnectedTextScene
} from "../../src/features/soundSeekers/content/connectedText.js";
import {
  SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS,
  SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS,
  SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS,
  SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS,
  SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY
} from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import {
  SOUND_SEEKERS_SCENE_RENDER_SPECS,
  SOUND_SEEKERS_OPTION_VISUALS,
  SOUND_SEEKERS_MEANING_VISUALS,
  SOUND_SEEKERS_SEMANTIC_VISUALS,
  SOUND_SEEKERS_ROUTE_SPECS,
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  computeBackgroundCrop,
  resolveMeaningVisual,
  resolveSceneVisual,
  resolveSceneVisualPresentation,
  resolveSemanticVisual,
  validateSoundSeekersVisualCatalogs
} from "../../src/features/soundSeekers/visual/sceneVisualCatalog.js";

function assertRecursivelyFrozen(value) {
  if (value === null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) assertRecursivelyFrozen(child);
}

function deepFrozenClone(value) {
  const clone = structuredClone(value);
  const freeze = target => {
    if (target === null || typeof target !== "object" || Object.isFrozen(target)) return target;
    for (const child of Object.values(target)) freeze(child);
    return Object.freeze(target);
  };
  return freeze(clone);
}

const bundle = () => ({
  scenes: SOUND_SEEKERS_SCENE_RENDER_SPECS,
  options: SOUND_SEEKERS_OPTION_VISUALS,
  meanings: SOUND_SEEKERS_MEANING_VISUALS,
  semantics: SOUND_SEEKERS_SEMANTIC_VISUALS,
  routes: SOUND_SEEKERS_ROUTE_SPECS,
  landmarks: SOUND_SEEKERS_LANDMARK_BINDINGS
});

const PURE_IMPORT_GRAPH = Object.freeze({
  "visual/visualTokens.js": Object.freeze([]),
  "visual/backgroundImageState.js": Object.freeze([]),
  "visual/characterCustomization.js": Object.freeze([
    "visual/visualTokens.js"
  ]),
  "visual/characterCatalog.js": Object.freeze([
    "content/chapters/index.js",
    "content/castArcs.js",
    "visual/visualTokens.js"
  ]),
  "engine/sceneVisualAccess.js": Object.freeze([
    "engine/connectedTextPresentation.js"
  ]),
  "visual/sceneVisualCatalog.js": Object.freeze([
    "content/chapters/index.js",
    "content/expeditions.js",
    "content/connectedText.js",
    "content/sceneVisualSemantics.js",
    "content/meaningSupport.js",
    "engine/sceneVisualAccess.js",
    "visual/characterCatalog.js",
    "visual/visualTokens.js"
  ]),
  "content/biomeKits.js": Object.freeze([
    "content/chapters/index.js",
    "visual/sceneVisualCatalog.js",
    "visual/visualTokens.js"
  ])
});

const SOUND_SEEKERS_SOURCE_ROOT = new URL(
  "../../src/features/soundSeekers/",
  import.meta.url
);

function pureModuleSource(modulePath) {
  return readFileSync(new URL(modulePath, SOUND_SEEKERS_SOURCE_ROOT), "utf8");
}

function canonicalLocalImport(importerPath, specifier) {
  const absolute = new URL(specifier, new URL(importerPath, SOUND_SEEKERS_SOURCE_ROOT));
  assert.equal(
    absolute.href.startsWith(SOUND_SEEKERS_SOURCE_ROOT.href),
    true,
    `${importerPath} import must stay inside Sound Seekers: ${specifier}`
  );
  return decodeURIComponent(absolute.href.slice(SOUND_SEEKERS_SOURCE_ROOT.href.length));
}

function parsedLocalImports(modulePath) {
  const source = pureModuleSource(modulePath);
  const dynamicImports = [...source.matchAll(/\bimport\s*\(([^)]*)\)/gu)];
  assert.deepEqual(
    dynamicImports,
    [],
    `${modulePath} must not contain a dynamic import`
  );
  return [...source.matchAll(
    /\b(?:import|export)\s+(?:[^;"']*?\s+from\s+)?["']([^"']+)["']/gu
  )]
    .map(match => match[1])
    .filter(specifier => specifier.startsWith("."))
    .map(specifier => canonicalLocalImport(modulePath, specifier));
}

test("scene catalogs join every authored scene, option, branch, route, and landmark", () => {
  assert.equal(SOUND_SEEKERS_SCENE_RENDER_SPECS.length, 40);
  assert.equal(SOUND_SEEKERS_OPTION_VISUALS.length, 112);
  assert.equal(SOUND_SEEKERS_ROUTE_SPECS.length, 40);
  assert.equal(SOUND_SEEKERS_LANDMARK_BINDINGS.length, 40);
  assert.equal(SOUND_SEEKERS_MEANING_VISUALS.length, SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.length);
  assert.equal(new Set(SOUND_SEEKERS_SEMANTIC_VISUALS.map(item => item.id)).size,
    SOUND_SEEKERS_SEMANTIC_VISUALS.length);
  for (const value of Object.values(bundle())) assertRecursivelyFrozen(value);

  assert.deepEqual(
    SOUND_SEEKERS_SCENE_RENDER_SPECS.map(item => ({
      id: item.id,
      sceneId: item.sceneId,
      chapterId: item.chapterId,
      preChoiceSemanticId: item.preChoiceSemanticId,
      optionSemanticIds: item.optionSemanticIds,
      postDecisionSemanticIds: item.postDecisionSemanticIds
    })),
    SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.map(item => ({
      id: item.id,
      sceneId: item.sceneId,
      chapterId: item.chapterId,
      preChoiceSemanticId: item.preChoiceSemanticId,
      optionSemanticIds: item.optionSemanticIds,
      postDecisionSemanticIds: item.postDecisionSemanticIds
    }))
  );
  assert.deepEqual(
    SOUND_SEEKERS_OPTION_VISUALS.map(item => item.semanticId),
    SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS.map(item => item.id)
  );
  assert.equal(SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS.length, 48);
  assert.equal(SOUND_SEEKERS_LANDMARK_BINDINGS
    .flatMap(item => item.postDecisionBindings).length, 48);

  for (const [index, expedition] of SOUND_SEEKERS_EXPEDITIONS.entries()) {
    const route = SOUND_SEEKERS_ROUTE_SPECS[index];
    const landmark = SOUND_SEEKERS_LANDMARK_BINDINGS[index];
    const chapter = SOUND_SEEKERS_CHAPTERS.find(item => item.id === expedition.chapterId);
    assert.equal(route.stopId, expedition.stopId);
    assert.equal(route.chapterId, expedition.chapterId);
    assert.equal(route.topologyId, chapter.routeTopologies[chapter.stopIds.indexOf(expedition.stopId)]);
    assert.equal(route.pathGeometryId, `route-geometry:${expedition.stopId}`);
    assert.equal(landmark.stopId, expedition.stopId);
    assert.equal(landmark.repairId, expedition.payoff.repairId);
    assert.equal(landmark.sceneId, expedition.connectedTextId);
    assert.ok(Object.hasOwn(landmark.stateVisuals, landmark.initialStateId));
  }
});

test("every semantic reference resolves once without a meaning alias", () => {
  for (const semantic of SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY) {
    assert.ok(resolveSemanticVisual(semantic.id), `${semantic.id} needs one renderer`);
  }
  for (const scene of SOUND_SEEKERS_SCENE_RENDER_SPECS) {
    assert.strictEqual(resolveSceneVisual(scene.sceneId), scene);
  }
  for (const option of SOUND_SEEKERS_OPTION_VISUALS) {
    assert.ok(resolveSemanticVisual(option.semanticId));
    assert.ok(resolveSemanticVisual(option.frameSemanticId));
    assert.ok(resolveSemanticVisual(option.actionSemanticId));
    option.propSemanticIds.forEach(id => assert.ok(resolveSemanticVisual(id)));
    assert.deepEqual(option.affordance, {
      minCssPx: 56,
      frameTokenId: "choice-neutral",
      emphasisRank: 0,
      motionCueId: null
    });
  }
  for (const meaning of SOUND_SEEKERS_MEANING_VISUALS) {
    assert.strictEqual(resolveMeaningVisual(meaning.semanticId), meaning);
    assert.equal(Object.hasOwn(meaning, "anchorId"), false);
    assert.equal(Object.hasOwn(meaning, "meaningVisualSemanticId"), false);
  }
  assert.equal(resolveMeaningVisual("meaning-does-not-exist"), null);
  assert.equal(resolveSemanticVisual("semantic-does-not-exist"), null);
  assert.equal(resolveSceneVisual("scene-s99"), null);
});

test("genuine child scenes render answer-neutral choices in their randomized order", () => {
  for (const scene of SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS) {
    const first = toChildConnectedTextScene(scene.sceneId, `visual-route-a:${scene.sceneId}`);
    const second = toChildConnectedTextScene(scene.sceneId, `visual-route-b:${scene.sceneId}`);
    for (const child of [first, second]) {
      const presentation = resolveSceneVisualPresentation(child);
      assert.deepEqual(Object.keys(presentation), [
        "sceneId", "chapterId", "scenePhase", "visualStateId", "kitId", "setting",
        "characters", "focalProps", "options", "meaningVisual"
      ]);
      assert.equal(presentation.scenePhase, "pre_choice");
      assert.equal(presentation.meaningVisual, null);
      assert.deepEqual(presentation.options.map(option => option.token),
        child.choice.options.map(option => option.token));
      assert.deepEqual(presentation.options.map(option => option.childLabel),
        child.choice.options.map(option => option.childLabel));
      assert.equal(JSON.stringify(presentation).includes("expectedToken"), false);
      assert.equal(JSON.stringify(presentation).includes("correct"), false);
      assert.equal(JSON.stringify(presentation).includes("rationale"), false);
    }
    assert.throws(() => resolveSceneVisualPresentation({ ...first }), /genuine child scene/u);
    assert.throws(() => resolveSceneVisualPresentation(structuredClone(first)), /genuine child scene/u);
  }
});

test("the one crop solver retains focal points and rejects invented profiles", () => {
  const sourceSize = [1536, 864];
  for (const targetSize of [[568, 320], [1194, 834], [320, 568]]) {
    const focalPoint = [0.5, 0.55];
    const crop = computeBackgroundCrop({ sourceSize, targetSize, focalPoint });
    assert.deepEqual(Object.keys(crop), ["x", "y", "width", "height", "objectPosition"]);
    assert.ok(focalPoint[0] >= crop.x && focalPoint[0] <= crop.x + crop.width);
    assert.ok(focalPoint[1] >= crop.y && focalPoint[1] <= crop.y + crop.height);
    assertRecursivelyFrozen(crop);
  }
  assert.throws(() => computeBackgroundCrop({
    sourceSize,
    targetSize: [800, 600],
    focalPoint: [0.5, 0.5]
  }), /crop contract/u);
  assert.throws(() => computeBackgroundCrop({
    sourceSize,
    targetSize: [568, 320],
    focalPoint: [0.5, 0.5],
    targetAspect: 16 / 9
  }), /crop contract|invalid/u);
});

test("catalog validation fails closed on frozen semantic drift", () => {
  assert.equal(validateSoundSeekersVisualCatalogs(bundle()), true);
  const routeMutation = structuredClone(bundle());
  routeMutation.routes[0].chapterId = "star-reach";
  assert.throws(() => validateSoundSeekersVisualCatalogs(deepFrozenClone(routeMutation)), /drifted/u);

  const optionMutation = structuredClone(bundle());
  optionMutation.options[0].affordance.minCssPx = 24;
  assert.throws(() => validateSoundSeekersVisualCatalogs(deepFrozenClone(optionMutation)), /drifted/u);

  assert.throws(() => validateSoundSeekersVisualCatalogs({
    ...bundle(),
    extra: []
  }), /invalid shape/u);
});

test("scene catalog keeps the locked pure imports and no answer authority", () => {
  const source = readFileSync(new URL(
    "../../src/features/soundSeekers/visual/sceneVisualCatalog.js",
    import.meta.url
  ), "utf8");
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/gu)].map(match => match[1]);
  assert.deepEqual(imports, [
    "../content/chapters/index.js",
    "../content/expeditions.js",
    "../content/connectedText.js",
    "../content/sceneVisualSemantics.js",
    "../content/meaningSupport.js",
    "../engine/sceneVisualAccess.js",
    "./characterCatalog.js",
    "./visualTokens.js"
  ]);
  const childImport = source.match(/import\s*\{([^}]+)\}\s*from\s*["']\.\.\/content\/connectedText\.js["']/u);
  const accessImport = source.match(/import\s*\{([^}]+)\}\s*from\s*["']\.\.\/engine\/sceneVisualAccess\.js["']/u);
  assert.deepEqual(childImport[1].split(",").map(value => value.trim()), [
    "isConnectedTextChildScene"
  ]);
  assert.deepEqual(accessImport[1].split(",").map(value => value.trim()), [
    "validateSceneVisualAccess"
  ]);
  assert.doesNotMatch(source,
    /(?:connectedTextRecords|connectedTextAnswerKeys|expectedToken|distractorRationale|QuestPixel|quest-pixel|Phaser|Three|React)/u);
  assert.doesNotMatch(source, /#[0-9A-F]{3,8}\b/iu);
});

test("all seven pure modules keep the exact acyclic dependency graph", () => {
  const actualGraph = Object.fromEntries(
    Object.keys(PURE_IMPORT_GRAPH).map(modulePath => [
      modulePath,
      parsedLocalImports(modulePath)
    ])
  );
  assert.deepEqual(actualGraph, PURE_IMPORT_GRAPH);

  const accessSource = pureModuleSource("engine/sceneVisualAccess.js");
  const presentationImport = accessSource.match(
    /import\s*\{([^}]+)\}\s*from\s*["']\.\/connectedTextPresentation\.js["']/u
  );
  assert.ok(presentationImport, "scene access needs its one named Task 3 import");
  assert.deepEqual(
    presentationImport[1].split(",").map(value => value.trim()),
    [
      "isConnectedTextPresentationTransition",
      "projectConnectedTextPresentationTransition"
    ]
  );

  const pureNodes = new Set(Object.keys(PURE_IMPORT_GRAPH));
  const visiting = new Set();
  const visited = new Set();
  const visit = modulePath => {
    assert.equal(visiting.has(modulePath), false, `pure import cycle reaches ${modulePath}`);
    if (visited.has(modulePath)) return;
    visiting.add(modulePath);
    for (const dependency of PURE_IMPORT_GRAPH[modulePath]) {
      if (pureNodes.has(dependency)) visit(dependency);
    }
    visiting.delete(modulePath);
    visited.add(modulePath);
  };
  for (const modulePath of pureNodes) visit(modulePath);
  assert.equal(visited.size, pureNodes.size);
});
