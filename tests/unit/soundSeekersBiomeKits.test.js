import test from "node:test";
import assert from "node:assert/strict";
import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import {
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  SOUND_SEEKERS_ROUTE_SPECS,
  SOUND_SEEKERS_SEMANTIC_VISUALS,
  resolveSemanticVisual
} from "../../src/features/soundSeekers/visual/sceneVisualCatalog.js";
import {
  SOUND_SEEKERS_BIOME_KITS,
  codeNativeBiomeSignature,
  computeBackgroundCrop,
  getBiomeKit,
  validateSoundSeekersBiomeKits
} from "../../src/features/soundSeekers/content/biomeKits.js";

const EXPECTED_TASK5_HANDOFFS = Object.freeze([
  Object.freeze({
    id: "seedwake-meadow",
    src: "/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp",
    provenanceId: "ssv2-seedwake-meadow-bg",
    environmentDescription: "Dawn pasture, living hedges, warm wood, distant seed-lantern glow, pale gold and fresh green; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["dawn pasture", "living hedges", "distant windmill lantern silhouette"]),
    backdropReviewSemanticIds: Object.freeze(["dawn-pasture", "living-hedge-depth", "windmill-lantern-silhouette"])
  }),
  Object.freeze({
    id: "river-gardens",
    src: "/game-assets/sound-seekers/v2/biomes/river-gardens/background.webp",
    provenanceId: "ssv2-river-gardens-bg",
    environmentDescription: "Terraced water channels, reeds, ceramic garden markers, turquoise and terracotta; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["terraced water channels", "reed banks", "distant ceramic terrace markers"]),
    backdropReviewSemanticIds: Object.freeze(["terraced-water-channels", "reed-bank-depth", "ceramic-terrace-markers"])
  }),
  Object.freeze({
    id: "fossil-canyon",
    src: "/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp",
    provenanceId: "ssv2-fossil-canyon-bg",
    environmentDescription: "Layered sandstone shelves, ancient tracks, bone arches and amber afternoon depth; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["layered sandstone shelves", "ancient track bed", "distant bone arch"]),
    backdropReviewSemanticIds: Object.freeze(["layered-sandstone-shelves", "ancient-track-bed", "bone-arch"])
  }),
  Object.freeze({
    id: "forge-settlement",
    src: "/game-assets/sound-seekers/v2/biomes/forge-settlement/background.webp",
    provenanceId: "ssv2-forge-settlement-bg",
    environmentDescription: "Dark-stone workshops, distant furnace architecture, copper-and-iron depth and controlled ember light; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["distant furnace architecture", "dark-stone workshops", "copper rail depth"]),
    backdropReviewSemanticIds: Object.freeze(["furnace", "dark-stone-workshops", "copper-rail-depth"])
  }),
  Object.freeze({
    id: "glass-marsh",
    src: "/game-assets/sound-seekers/v2/biomes/glass-marsh/background.webp",
    provenanceId: "ssv2-glass-marsh-bg",
    environmentDescription: "Reflective jade pools, glass-reed depth, mist and refracted distant paths; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["reflective jade pools", "distant glass reeds", "mist path depth"]),
    backdropReviewSemanticIds: Object.freeze(["reflective-jade-pools", "glass-reed-depth", "mist-path-depth"])
  }),
  Object.freeze({
    id: "storm-coast",
    src: "/game-assets/sound-seekers/v2/biomes/storm-coast/background.webp",
    provenanceId: "ssv2-storm-coast-bg",
    environmentDescription: "Sea cliffs, spray, distant timber shelters and a storm clearing toward warm light; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["sea cliffs", "distant timber shelters", "storm clearing toward warm light"]),
    backdropReviewSemanticIds: Object.freeze(["sea-cliff", "timber-shelter-depth", "clearing-storm"])
  }),
  Object.freeze({
    id: "lantern-forest",
    src: "/game-assets/sound-seekers/v2/biomes/lantern-forest/background.webp",
    provenanceId: "ssv2-lantern-forest-bg",
    environmentDescription: "Deep layered woods, root-bridge depth, distant hanging lantern path, moss and muted gold; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["deep layered woods", "distant root bridges", "distant hanging lantern path"]),
    backdropReviewSemanticIds: Object.freeze(["deep-wood-layers", "root-bridge-depth", "hanging-lantern-path"])
  }),
  Object.freeze({
    id: "star-reach",
    src: "/game-assets/sound-seekers/v2/biomes/star-reach/background.webp",
    provenanceId: "ssv2-star-reach-bg",
    environmentDescription: "High observatory terraces, distant comet stairs, night sky, indigo and warm starlight; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["high observatory terraces", "distant comet stairs", "night sky"]),
    backdropReviewSemanticIds: Object.freeze(["observatory", "comet-stair-depth", "night-sky"])
  })
]);

const PLANES = Object.freeze([
  "background", "midground", "route", "foreground", "interaction", "effects"
]);
const TARGETS = Object.freeze({
  landscape: Object.freeze([568, 320]),
  tablet: Object.freeze([1194, 834]),
  portrait: Object.freeze([320, 568])
});

function assertRecursivelyFrozen(value) {
  if (value === null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (Object.hasOwn(descriptor, "value")) assertRecursivelyFrozen(descriptor.value);
  }
}

function deepFrozenClone(value) {
  const clone = structuredClone(value);
  return freezeInPlace(clone);
}

function freezeInPlace(item) {
  if (item === null || typeof item !== "object" || Object.isFrozen(item)) return item;
  for (const key of Reflect.ownKeys(item)) {
    const descriptor = Object.getOwnPropertyDescriptor(item, key);
    if (Object.hasOwn(descriptor, "value")) freezeInPlace(descriptor.value);
  }
  return Object.freeze(item);
}

function mutableClone(value) {
  return structuredClone(value);
}

function retained(crop, point) {
  const epsilon = Number.EPSILON * 8;
  return point[0] >= crop.x - epsilon
    && point[0] <= crop.x + crop.width + epsilon
    && point[1] >= crop.y - epsilon
    && point[1] <= crop.y + crop.height + epsilon;
}

function assertQuietZoneRetained(crop, quietZone) {
  for (const point of [
    [quietZone.x, quietZone.y],
    [quietZone.x + quietZone.width, quietZone.y],
    [quietZone.x, quietZone.y + quietZone.height],
    [quietZone.x + quietZone.width, quietZone.y + quietZone.height]
  ]) assert.equal(retained(crop, point), true);
}

function task5Projection(kit) {
  return {
    id: kit.id,
    src: kit.background.src,
    provenanceId: kit.background.provenanceId,
    environmentDescription: kit.backgroundGenerationBrief.environmentDescription,
    requiredBackdropElements: kit.backgroundGenerationBrief.requiredBackdropElements,
    backdropReviewSemanticIds: kit.backdropReviewSemanticIds
  };
}

test("eight recursively frozen kits hand Task 5 its exact literal background contract", () => {
  assert.equal(SOUND_SEEKERS_BIOME_KITS.length, 8);
  assertRecursivelyFrozen(SOUND_SEEKERS_BIOME_KITS);
  assert.deepEqual(SOUND_SEEKERS_BIOME_KITS.map(task5Projection), EXPECTED_TASK5_HANDOFFS);
  assert.deepEqual(
    SOUND_SEEKERS_BIOME_KITS.map(kit => kit.id),
    SOUND_SEEKERS_CHAPTERS.map(chapter => chapter.id)
  );

  for (const kit of SOUND_SEEKERS_BIOME_KITS) {
    assert.deepEqual(kit.background.expectedAspect, [16, 9]);
    assert.deepEqual(kit.background.minSize, [1536, 864]);
    assert.equal(kit.backgroundGenerationBrief.styleId, "sound-seekers-painted-shape-v2");
    assert.deepEqual(kit.backgroundGenerationBrief.forbiddenContent, [
      "characters", "interactive objects", "interface", "letters", "words",
      "logos", "watermarks", "borders"
    ]);
    assert.deepEqual(
      kit.backgroundGenerationBrief.backdropReviewSemanticIds,
      kit.backdropReviewSemanticIds
    );
    assert.deepEqual(
      kit.backgroundGenerationBrief.forbiddenSemanticIds,
      kit.codeNativeSemanticIds
    );
    assert.equal(
      kit.backdropReviewSemanticIds.some(id => kit.codeNativeSemanticIds.includes(id)),
      false
    );
  }
});

test("the shared crop solver retains focal points and every quiet-zone corner", () => {
  for (const kit of SOUND_SEEKERS_BIOME_KITS) {
    assert.deepEqual(Object.keys(kit.background.cropProfiles), Object.keys(TARGETS));
    for (const [profileId, profile] of Object.entries(kit.background.cropProfiles)) {
      assert.deepEqual(profile.targetSize, TARGETS[profileId]);
      assert.equal(Object.hasOwn(profile, "targetAspect"), false);
      const crop = computeBackgroundCrop({
        sourceSize: kit.background.minSize,
        targetSize: profile.targetSize,
        focalPoint: profile.focalPoint
      });
      assert.deepEqual(Object.keys(crop), ["x", "y", "width", "height", "objectPosition"]);
      assert.equal(retained(crop, profile.focalPoint), true);
      assertQuietZoneRetained(crop, profile.quietZone);
      assertRecursivelyFrozen(crop);
    }
  }

  for (const bad of [
    { sourceSize: [0, 864], targetSize: [568, 320], focalPoint: [0.5, 0.5] },
    { sourceSize: [1536, 864], targetSize: [800, 600], focalPoint: [0.5, 0.5] },
    { sourceSize: [1536, 864], targetSize: [568, 320], focalPoint: [-0.1, 0.5] }
  ]) assert.throws(() => computeBackgroundCrop(bad), /crop contract/u);
});

test("every kit has six typed planes and assigns every code-native semantic once", () => {
  for (const kit of SOUND_SEEKERS_BIOME_KITS) {
    assert.deepEqual(kit.layers.map(layer => layer.plane), PLANES);
    assert.deepEqual(kit.layers.map(layer => layer.zIndex), [0, 10, 20, 30, 40, 50]);
    assert.equal(kit.layers[0].rendererKind, "background-raster");
    assert.deepEqual(kit.layers[0].semanticIds, kit.backdropReviewSemanticIds);
    assert.deepEqual(kit.layers[0].essentialSemanticIds, []);

    const codeNativeLayers = kit.layers.slice(1);
    assert.deepEqual(codeNativeLayers.map(layer => layer.rendererKind), [
      "code-native-svg", "code-native-svg", "code-native-svg",
      "code-native-dom", "code-native-svg"
    ]);
    for (const layer of kit.layers) {
      assert.deepEqual(layer.densityProfiles, ["full", "simplified"]);
      assert.deepEqual(layer.motionProfiles, ["full", "reduced"]);
      assert.equal(layer.essentialSemanticIds.every(id => layer.semanticIds.includes(id)), true);
    }
    assert.deepEqual(kit.layers.at(-1).essentialSemanticIds, []);
    const assigned = codeNativeLayers.flatMap(layer => layer.semanticIds);
    assert.deepEqual([...assigned].sort(), [...kit.codeNativeSemanticIds].sort());
    assert.equal(new Set(assigned).size, assigned.length);

    assert.deepEqual(
      kit.routeSpecIds,
      SOUND_SEEKERS_ROUTE_SPECS.filter(route => route.chapterId === kit.id).map(route => route.id)
    );
    assert.deepEqual(
      kit.landmarkIds,
      SOUND_SEEKERS_LANDMARK_BINDINGS
        .filter(landmark => landmark.chapterId === kit.id).map(landmark => landmark.id)
    );
    for (const semanticId of kit.codeNativeSemanticIds) {
      assert.ok(resolveSemanticVisual(semanticId), `${kit.id}: unresolved ${semanticId}`);
    }
    const expectedMeaningIds = SOUND_SEEKERS_SEMANTIC_VISUALS
      .filter(record => ["meaning", "meaning_action"].includes(record.kind)
        && record.chapterIds.includes(kit.id))
      .map(record => record.id);
    assert.deepEqual(
      kit.codeNativeSemanticIds.filter(id => ["meaning", "meaning_action"].includes(
        resolveSemanticVisual(id)?.kind
      )),
      expectedMeaningIds
    );
  }
});

test("code-native signatures ignore cosmetics while all eight structures remain unique", () => {
  const signatures = SOUND_SEEKERS_BIOME_KITS.map(codeNativeBiomeSignature);
  assert.equal(new Set(signatures).size, 8);

  const source = SOUND_SEEKERS_BIOME_KITS[0];
  const cosmeticClone = mutableClone(source);
  cosmeticClone.id = "cosmetic-rename";
  cosmeticClone.paletteTokenId = SOUND_SEEKERS_BIOME_KITS[1].paletteTokenId;
  cosmeticClone.lightingTokenId = SOUND_SEEKERS_BIOME_KITS[1].lightingTokenId;
  cosmeticClone.background.src = "/ignored-by-code-native-signature.webp";
  cosmeticClone.background.provenanceId = "ignored-provenance";
  cosmeticClone.backgroundGenerationBrief.environmentDescription = "Cosmetic words only.";
  assert.equal(codeNativeBiomeSignature(deepFrozenClone(cosmeticClone)), signatures[0]);

  for (let left = 0; left < SOUND_SEEKERS_BIOME_KITS.length; left += 1) {
    for (let right = left + 1; right < SOUND_SEEKERS_BIOME_KITS.length; right += 1) {
      const a = SOUND_SEEKERS_BIOME_KITS[left];
      const b = SOUND_SEEKERS_BIOME_KITS[right];
      const dimensions = [
        JSON.stringify(a.routeSpecIds.map(id => SOUND_SEEKERS_ROUTE_SPECS.find(route => route.id === id).topologyId))
          !== JSON.stringify(b.routeSpecIds.map(id => SOUND_SEEKERS_ROUTE_SPECS.find(route => route.id === id).topologyId)),
        JSON.stringify(a.landmarkIds.map(id => SOUND_SEEKERS_LANDMARK_BINDINGS.find(item => item.id === id).stateVisuals))
          !== JSON.stringify(b.landmarkIds.map(id => SOUND_SEEKERS_LANDMARK_BINDINGS.find(item => item.id === id).stateVisuals)),
        `${a.propFamilyId}|${a.rewardFamilyId}` !== `${b.propFamilyId}|${b.rewardFamilyId}`,
        a.wonderEffectId !== b.wonderEffectId
      ];
      assert.ok(dimensions.filter(Boolean).length >= 2, `${a.id}/${b.id}: fewer than two structural differences`);
    }
  }
});

test("the biome validator rejects independent frozen mutations and hidden schema drift", () => {
  assert.equal(validateSoundSeekersBiomeKits(SOUND_SEEKERS_BIOME_KITS), true);
  assert.equal(validateSoundSeekersBiomeKits(deepFrozenClone(SOUND_SEEKERS_BIOME_KITS)), true);
  assert.throws(() => validateSoundSeekersBiomeKits(mutableClone(SOUND_SEEKERS_BIOME_KITS)), /frozen/u);

  const mutations = [
    kits => { kits[0].backgroundGenerationBrief.requiredBackdropElements.reverse(); },
    kits => { delete kits[0].backgroundGenerationBrief.environmentDescription; },
    kits => { kits[0].background.cropProfiles.portrait.quietZone.x = 0; },
    kits => { kits[0].layers[1].plane = "route"; },
    kits => { kits[0].layers[2].rendererKind = "background-raster"; },
    kits => { kits[0].layers[3].semanticIds.push(kits[0].backdropReviewSemanticIds[0]); },
    kits => {
      const moved = kits[0].layers[1].semanticIds.pop();
      kits[0].layers[1].essentialSemanticIds.pop();
      kits[0].layers[2].semanticIds.push(moved);
      kits[0].layers[2].essentialSemanticIds.push(moved);
    },
    kits => { kits[0].routeSpecIds[0] = kits[1].routeSpecIds[0]; },
    kits => { kits[0].propFamilyId = kits[1].propFamilyId; },
    kits => { kits[0].codeNativeSemanticIds.push(kits[0].codeNativeSemanticIds[0]); }
  ];
  for (const mutate of mutations) {
    const candidate = mutableClone(SOUND_SEEKERS_BIOME_KITS);
    mutate(candidate);
    assert.throws(() => validateSoundSeekersBiomeKits(deepFrozenClone(candidate)));
  }

  const hidden = mutableClone(SOUND_SEEKERS_BIOME_KITS);
  Object.defineProperty(hidden[0].background, "answer", { value: "secret" });
  assert.throws(() => validateSoundSeekersBiomeKits(freezeInPlace(hidden)), /shape/u);

  const hiddenArray = mutableClone(SOUND_SEEKERS_BIOME_KITS);
  Object.defineProperty(hiddenArray[0].background.expectedAspect, "answer", {
    value: "secret"
  });
  assert.throws(() => validateSoundSeekersBiomeKits(freezeInPlace(hiddenArray)), /shape/u);
});

test("biome lookup is exact and returns only canonical frozen identities", () => {
  for (const kit of SOUND_SEEKERS_BIOME_KITS) assert.strictEqual(getBiomeKit(kit.id), kit);
  for (const unknown of [null, undefined, "", "Seedwake-Meadow", "missing", {}]) {
    assert.equal(getBiomeKit(unknown), null);
  }
  assert.equal(
    SOUND_SEEKERS_SEMANTIC_VISUALS.some(record => record.id === "dawn-pasture"),
    false,
    "backdrop-review IDs must never become code-native renderer records"
  );
});
