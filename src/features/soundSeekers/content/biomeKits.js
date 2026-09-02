import { SOUND_SEEKERS_CHAPTERS } from "./chapters/index.js";
import {
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  SOUND_SEEKERS_ROUTE_SPECS,
  SOUND_SEEKERS_SEMANTIC_VISUALS,
  computeBackgroundCrop
} from "../visual/sceneVisualCatalog.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../visual/visualTokens.js";

export { computeBackgroundCrop };

const STYLE_ID = "sound-seekers-painted-shape-v2";
const PLANES = Object.freeze([
  "background", "midground", "route", "foreground", "interaction", "effects"
]);
const Z_INDEXES = Object.freeze([0, 10, 20, 30, 40, 50]);
const DENSITY_PROFILES = Object.freeze(["full", "simplified"]);
const MOTION_PROFILES = Object.freeze(["full", "reduced"]);
const FORBIDDEN_CONTENT = Object.freeze([
  "characters", "interactive objects", "interface", "letters", "words",
  "logos", "watermarks", "borders"
]);
const TARGET_SIZES = Object.freeze({
  landscape: Object.freeze([568, 320]),
  tablet: Object.freeze([1194, 834]),
  portrait: Object.freeze([320, 568])
});
const PROFILE_IDS = Object.freeze(Object.keys(TARGET_SIZES));
const KIT_KEYS = Object.freeze([
  "id", "paletteTokenId", "lightingTokenId", "background",
  "backgroundGenerationBrief", "backdropReviewSemanticIds",
  "codeNativeSemanticIds", "layers", "routeSpecIds", "landmarkIds",
  "propFamilyId", "rewardFamilyId", "wonderEffectId"
]);
const LAYER_KEYS = Object.freeze([
  "id", "plane", "zIndex", "rendererKind", "semanticIds",
  "essentialSemanticIds", "densityProfiles", "motionProfiles"
]);

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (Object.hasOwn(descriptor, "value")) deepFreeze(descriptor.value);
  }
  return Object.freeze(value);
}

const HANDOFFS = deepFreeze([
  {
    id: "seedwake-meadow",
    src: "/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp",
    provenanceId: "ssv2-seedwake-meadow-bg",
    environmentDescription: "Dawn pasture, living hedges, warm wood, distant seed-lantern glow, pale gold and fresh green; quiet lower-middle lane.",
    requiredBackdropElements: ["dawn pasture", "living hedges", "distant windmill lantern silhouette"],
    backdropReviewSemanticIds: ["dawn-pasture", "living-hedge-depth", "windmill-lantern-silhouette"],
    paletteTokenId: "biome-seedwake",
    lightingTokenId: "light-seedwake",
    focalPoint: [0.5, 0.54],
    quietZone: { x: 0.42, y: 0.57, width: 0.16, height: 0.27 }
  },
  {
    id: "river-gardens",
    src: "/game-assets/sound-seekers/v2/biomes/river-gardens/background.webp",
    provenanceId: "ssv2-river-gardens-bg",
    environmentDescription: "Terraced water channels, reeds, ceramic garden markers, turquoise and terracotta; quiet lower-middle lane.",
    requiredBackdropElements: ["terraced water channels", "reed banks", "distant ceramic terrace markers"],
    backdropReviewSemanticIds: ["terraced-water-channels", "reed-bank-depth", "ceramic-terrace-markers"],
    paletteTokenId: "biome-river",
    lightingTokenId: "light-river",
    focalPoint: [0.48, 0.54],
    quietZone: { x: 0.4, y: 0.57, width: 0.16, height: 0.27 }
  },
  {
    id: "fossil-canyon",
    src: "/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp",
    provenanceId: "ssv2-fossil-canyon-bg",
    environmentDescription: "Layered sandstone shelves, ancient tracks, bone arches and amber afternoon depth; quiet lower-middle lane.",
    requiredBackdropElements: ["layered sandstone shelves", "ancient track bed", "distant bone arch"],
    backdropReviewSemanticIds: ["layered-sandstone-shelves", "ancient-track-bed", "bone-arch"],
    paletteTokenId: "biome-fossil",
    lightingTokenId: "light-fossil",
    focalPoint: [0.52, 0.55],
    quietZone: { x: 0.44, y: 0.58, width: 0.16, height: 0.27 }
  },
  {
    id: "forge-settlement",
    src: "/game-assets/sound-seekers/v2/biomes/forge-settlement/background.webp",
    provenanceId: "ssv2-forge-settlement-bg",
    environmentDescription: "Dark-stone workshops, distant furnace architecture, copper-and-iron depth and controlled ember light; quiet lower-middle lane.",
    requiredBackdropElements: ["distant furnace architecture", "dark-stone workshops", "copper rail depth"],
    backdropReviewSemanticIds: ["furnace", "dark-stone-workshops", "copper-rail-depth"],
    paletteTokenId: "biome-forge",
    lightingTokenId: "light-forge",
    focalPoint: [0.5, 0.55],
    quietZone: { x: 0.42, y: 0.58, width: 0.16, height: 0.27 }
  },
  {
    id: "glass-marsh",
    src: "/game-assets/sound-seekers/v2/biomes/glass-marsh/background.webp",
    provenanceId: "ssv2-glass-marsh-bg",
    environmentDescription: "Reflective jade pools, glass-reed depth, mist and refracted distant paths; quiet lower-middle lane.",
    requiredBackdropElements: ["reflective jade pools", "distant glass reeds", "mist path depth"],
    backdropReviewSemanticIds: ["reflective-jade-pools", "glass-reed-depth", "mist-path-depth"],
    paletteTokenId: "biome-glass",
    lightingTokenId: "light-glass",
    focalPoint: [0.47, 0.54],
    quietZone: { x: 0.39, y: 0.57, width: 0.16, height: 0.27 }
  },
  {
    id: "storm-coast",
    src: "/game-assets/sound-seekers/v2/biomes/storm-coast/background.webp",
    provenanceId: "ssv2-storm-coast-bg",
    environmentDescription: "Sea cliffs, spray, distant timber shelters and a storm clearing toward warm light; quiet lower-middle lane.",
    requiredBackdropElements: ["sea cliffs", "distant timber shelters", "storm clearing toward warm light"],
    backdropReviewSemanticIds: ["sea-cliff", "timber-shelter-depth", "clearing-storm"],
    paletteTokenId: "biome-storm",
    lightingTokenId: "light-storm",
    focalPoint: [0.53, 0.53],
    quietZone: { x: 0.45, y: 0.56, width: 0.16, height: 0.27 }
  },
  {
    id: "lantern-forest",
    src: "/game-assets/sound-seekers/v2/biomes/lantern-forest/background.webp",
    provenanceId: "ssv2-lantern-forest-bg",
    environmentDescription: "Deep layered woods, root-bridge depth, distant hanging lantern path, moss and muted gold; quiet lower-middle lane.",
    requiredBackdropElements: ["deep layered woods", "distant root bridges", "distant hanging lantern path"],
    backdropReviewSemanticIds: ["deep-wood-layers", "root-bridge-depth", "hanging-lantern-path"],
    paletteTokenId: "biome-lantern",
    lightingTokenId: "light-lantern",
    focalPoint: [0.49, 0.54],
    quietZone: { x: 0.41, y: 0.57, width: 0.16, height: 0.27 }
  },
  {
    id: "star-reach",
    src: "/game-assets/sound-seekers/v2/biomes/star-reach/background.webp",
    provenanceId: "ssv2-star-reach-bg",
    environmentDescription: "High observatory terraces, distant comet stairs, night sky, indigo and warm starlight; quiet lower-middle lane.",
    requiredBackdropElements: ["high observatory terraces", "distant comet stairs", "night sky"],
    backdropReviewSemanticIds: ["observatory", "comet-stair-depth", "night-sky"],
    paletteTokenId: "biome-star",
    lightingTokenId: "light-star",
    focalPoint: [0.51, 0.52],
    quietZone: { x: 0.43, y: 0.55, width: 0.16, height: 0.27 }
  }
]);

const ROUTE_MATERIAL_SHAPES = deepFreeze({
  "route-material-warm-wood": { surface: "rounded-timber-slats", edge: "woven-low-rail" },
  "route-material-ceramic-waterline": { surface: "stepped-ceramic-insets", edge: "water-channel-lip" },
  "route-material-sandstone-track": { surface: "layered-stone-plates", edge: "fossil-track-groove" },
  "route-material-copper-rail": { surface: "riveted-metal-panels", edge: "paired-copper-rail" },
  "route-material-glass-reed": { surface: "faceted-reed-causeway", edge: "reflective-pool-rim" },
  "route-material-rope-and-timber": { surface: "lashed-timber-boards", edge: "braided-rope-rail" },
  "route-material-root-and-moss": { surface: "interlocking-root-ribs", edge: "moss-cushion-rim" },
  "route-material-starlight-stone": { surface: "floating-stone-segments", edge: "light-line-rail" }
});

const PROP_SHAPES = deepFreeze({
  "prop-family:seedwake-meadow": { primary: "seed-pod-rounds", support: ["woven-fence", "reed-clump"], arrangement: "low-scatter" },
  "prop-family:river-gardens": { primary: "lily-disc-clusters", support: ["sluice-arch", "boat-bowl"], arrangement: "terraced-bands" },
  "prop-family:fossil-canyon": { primary: "fossil-spiral-insets", support: ["survey-tripod", "rope-span"], arrangement: "shelf-cascade" },
  "prop-family:forge-settlement": { primary: "interlocking-gear-rings", support: ["crane-angle", "furnace-drum"], arrangement: "workshop-grid" },
  "prop-family:glass-marsh": { primary: "faceted-reed-fans", support: ["mirror-disc", "lily-ferry"], arrangement: "pool-islands" },
  "prop-family:storm-coast": { primary: "lens-frame-radials", support: ["buoy-oval", "sailcloth-triangle"], arrangement: "cliff-terraces" },
  "prop-family:lantern-forest": { primary: "lantern-pod-drops", support: ["root-stair", "telescope-tripod"], arrangement: "canopy-spiral" },
  "prop-family:star-reach": { primary: "constellation-node-web", support: ["floating-ruin", "light-bridge"], arrangement: "orbital-arcs" }
});

const REWARD_SHAPES = deepFreeze({
  "reward-family:seedwake-lantern": { silhouette: "petal-lantern", parts: 5, pattern: "radiating-seed" },
  "reward-family:river-whistle": { silhouette: "curved-river-whistle", parts: 3, pattern: "flowing-wave" },
  "reward-family:fossil-compass": { silhouette: "ribbed-fossil-compass", parts: 6, pattern: "spiral-track" },
  "reward-family:forge-tool": { silhouette: "forked-wordsmith-tool", parts: 7, pattern: "riveted-chevron" },
  "reward-family:mirror-reed": { silhouette: "faceted-mirror-reed", parts: 4, pattern: "split-reflection" },
  "reward-family:storm-lens": { silhouette: "ringed-storm-lens", parts: 8, pattern: "radial-bolt" },
  "reward-family:lantern-map": { silhouette: "folding-lantern-map", parts: 5, pattern: "branch-network" },
  "reward-family:first-reading-star": { silhouette: "layered-reading-star", parts: 9, pattern: "constellation-lines" }
});

const WONDER_COMPOSITIONS = deepFreeze({
  "wonder-effect:sound-ripples-wake-the-meadow": { motion: "concentric-ground-ripples", reveal: "petal-rise", final: "lantern-pulse" },
  "wonder-effect:sound-cargo-refills-the-river": { motion: "channel-flow-bands", reveal: "terrace-fill", final: "waterwheel-turn" },
  "wonder-effect:blended-trail-marks-wake-the-fossils": { motion: "track-link-chain", reveal: "shelf-imprint", final: "rib-arch-glow" },
  "wonder-effect:built-words-turn-the-forge-rings": { motion: "meshing-ring-turn", reveal: "rivet-sequence", final: "furnace-halo" },
  "wonder-effect:sound-contrasts-reveal-the-marsh-path": { motion: "paired-reflection-sweep", reveal: "causeway-facets", final: "beacon-refraction" },
  "wonder-effect:remembered-cues-assemble-the-storm-lens": { motion: "radial-lens-assembly", reveal: "cloud-split", final: "lighthouse-beam" },
  "wonder-effect:read-phrases-grow-the-living-map": { motion: "branch-line-growth", reveal: "map-fold-open", final: "observatory-orbit" },
  "wonder-effect:all-six-powers-reconnect-the-sky-road": { motion: "six-arc-convergence", reveal: "bridge-segment-rise", final: "reading-star-burst" }
});

const handoffById = new Map(HANDOFFS.map(handoff => [handoff.id, handoff]));
const routeById = new Map(SOUND_SEEKERS_ROUTE_SPECS.map(route => [route.id, route]));
const landmarkById = new Map(SOUND_SEEKERS_LANDMARK_BINDINGS
  .map(landmark => [landmark.id, landmark]));
const semanticById = new Map(SOUND_SEEKERS_SEMANTIC_VISUALS
  .map(semantic => [semantic.id, semantic]));

function unique(values) {
  return [...new Set(values)];
}

function semanticLayer(semantic, references) {
  if (semantic.id === references.wonderEffectId) return "effects";
  if (semantic.kind === "route") return "route";
  if (["option", "choice_frame", "option_prop", "option_action", "meaning",
    "meaning_action", "prop_family", "reward_family"].includes(semantic.kind)) {
    return "interaction";
  }
  if (["landmark", "landmark_state", "character", "post_decision"].includes(semantic.kind)) {
    return "foreground";
  }
  return "midground";
}

function buildLayers(chapterId, backdropReviewSemanticIds, codeNativeSemanticIds, references) {
  const byPlane = new Map(PLANES.map(plane => [plane, []]));
  byPlane.set("background", [...backdropReviewSemanticIds]);
  for (const semanticId of codeNativeSemanticIds) {
    const semantic = semanticById.get(semanticId);
    if (!semantic) throw new TypeError(`${chapterId}: unresolved code-native semantic ${semanticId}`);
    byPlane.get(semanticLayer(semantic, references)).push(semanticId);
  }
  return PLANES.map((plane, index) => {
    const semanticIds = byPlane.get(plane);
    return {
      id: `layer:${chapterId}:${plane}`,
      plane,
      zIndex: Z_INDEXES[index],
      rendererKind: plane === "background"
        ? "background-raster"
        : plane === "interaction" ? "code-native-dom" : "code-native-svg",
      semanticIds,
      essentialSemanticIds: plane === "background" || plane === "effects"
        ? [] : [...semanticIds],
      densityProfiles: [...DENSITY_PROFILES],
      motionProfiles: [...MOTION_PROFILES]
    };
  });
}

function cropProfiles(handoff) {
  return Object.fromEntries(PROFILE_IDS.map(profileId => [profileId, {
    targetSize: [...TARGET_SIZES[profileId]],
    focalPoint: [...handoff.focalPoint],
    quietZone: { ...handoff.quietZone }
  }]));
}

function buildKit(chapter) {
  const handoff = handoffById.get(chapter.id);
  if (!handoff || chapter.biomeKitId !== chapter.id) {
    throw new TypeError(`${chapter.id}: missing exact biome handoff`);
  }
  const propFamilyId = `prop-family:${chapter.id}`;
  const rewardFamilyId = `reward-family:${chapter.chapterReward.id}`;
  const wonderEffectId = `wonder-effect:${chapter.wonderId}`;
  const references = { propFamilyId, rewardFamilyId, wonderEffectId };
  const codeNativeSemanticIds = unique([
    ...SOUND_SEEKERS_SEMANTIC_VISUALS
      .filter(semantic => semantic.chapterId === chapter.id
        || semantic.chapterIds?.includes(chapter.id))
      .map(semantic => semantic.id),
    propFamilyId,
    rewardFamilyId,
    wonderEffectId
  ]);
  const routeSpecIds = SOUND_SEEKERS_ROUTE_SPECS
    .filter(route => route.chapterId === chapter.id).map(route => route.id);
  const landmarkIds = SOUND_SEEKERS_LANDMARK_BINDINGS
    .filter(landmark => landmark.chapterId === chapter.id).map(landmark => landmark.id);
  const backdropReviewSemanticIds = [...handoff.backdropReviewSemanticIds];
  return {
    id: chapter.id,
    paletteTokenId: handoff.paletteTokenId,
    lightingTokenId: handoff.lightingTokenId,
    background: {
      src: handoff.src,
      provenanceId: handoff.provenanceId,
      expectedAspect: [16, 9],
      minSize: [1536, 864],
      cropProfiles: cropProfiles(handoff)
    },
    backgroundGenerationBrief: {
      styleId: STYLE_ID,
      environmentDescription: handoff.environmentDescription,
      requiredBackdropElements: [...handoff.requiredBackdropElements],
      backdropReviewSemanticIds: [...backdropReviewSemanticIds],
      forbiddenSemanticIds: [...codeNativeSemanticIds],
      forbiddenContent: [...FORBIDDEN_CONTENT]
    },
    backdropReviewSemanticIds,
    codeNativeSemanticIds,
    layers: buildLayers(chapter.id, backdropReviewSemanticIds, codeNativeSemanticIds, references),
    routeSpecIds,
    landmarkIds,
    propFamilyId,
    rewardFamilyId,
    wonderEffectId
  };
}

function structuralDimensions(kit) {
  const routes = kit.routeSpecIds.map(routeId => {
    const route = routeById.get(routeId);
    const materialShape = route && ROUTE_MATERIAL_SHAPES[route.materialTokenId];
    if (!route || !materialShape) throw new TypeError("biome route structure is unresolved");
    return { topologyFamily: route.topologyId, materialShape };
  });
  const landmarks = kit.landmarkIds.map(landmarkId => {
    const landmark = landmarkById.get(landmarkId);
    if (!landmark) throw new TypeError("biome landmark structure is unresolved");
    return Object.values(landmark.stateVisuals).map(state => ({
      shapeFamily: state.shapeId,
      partCount: state.partCount,
      patternFamily: state.patternId
    }));
  });
  const prop = PROP_SHAPES[kit.propFamilyId];
  const reward = REWARD_SHAPES[kit.rewardFamilyId];
  const wonder = WONDER_COMPOSITIONS[kit.wonderEffectId];
  if (!prop || !reward || !wonder) throw new TypeError("biome structural family is unresolved");
  return { routes, landmarks, propReward: { prop, reward }, wonder };
}

function structuralHash(value) {
  const serialized = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `biome:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function codeNativeBiomeSignature(kit) {
  if (!kit || typeof kit !== "object") throw new TypeError("biome signature needs a kit");
  return structuralHash(structuralDimensions(kit));
}

function assertFrozen(value, label) {
  if (value === null || typeof value !== "object") return;
  if (!Object.isFrozen(value)) throw new TypeError(`${label} must be recursively frozen`);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!Object.hasOwn(descriptor, "value")) throw new TypeError(`${label} has an invalid shape`);
    assertFrozen(descriptor.value, label);
  }
}

function assertExactObject(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} has an invalid shape`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length
    || ownKeys.some((key, index) => typeof key !== "string" || key !== keys[index])) {
    throw new TypeError(`${label} has an invalid shape`);
  }
  for (const key of ownKeys) {
    if (!Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), "value")) {
      throw new TypeError(`${label} has an invalid shape`);
    }
  }
}

function assertExactArray(value, expectedLength, label) {
  if (!Array.isArray(value) || value.length !== expectedLength) {
    throw new TypeError(`${label} has an invalid shape`);
  }
  const expectedKeys = [...Array.from({ length: expectedLength }, (_, index) => String(index)), "length"];
  if (Reflect.ownKeys(value).some((key, index) => key !== expectedKeys[index])
    || Reflect.ownKeys(value).length !== expectedKeys.length) {
    throw new TypeError(`${label} has an invalid shape`);
  }
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertNormalizedRectangle(rectangle, label) {
  assertExactObject(rectangle, ["x", "y", "width", "height"], label);
  if (![rectangle.x, rectangle.y, rectangle.width, rectangle.height].every(Number.isFinite)
    || rectangle.x < 0 || rectangle.y < 0 || rectangle.width <= 0 || rectangle.height <= 0
    || rectangle.x + rectangle.width > 1 || rectangle.y + rectangle.height > 1) {
    throw new TypeError(`${label} is outside normalized bounds`);
  }
}

function pointInside(crop, x, y) {
  const epsilon = Number.EPSILON * 8;
  return x >= crop.x - epsilon && x <= crop.x + crop.width + epsilon
    && y >= crop.y - epsilon && y <= crop.y + crop.height + epsilon;
}

function assertCropProfile(profile, profileId, handoff) {
  assertExactObject(profile, ["targetSize", "focalPoint", "quietZone"], `${profileId} crop`);
  assertExactArray(profile.targetSize, 2, `${profileId} target size`);
  assertExactArray(profile.focalPoint, 2, `${profileId} focal point`);
  assertNormalizedRectangle(profile.quietZone, `${profileId} quiet zone`);
  if (!same(profile.targetSize, TARGET_SIZES[profileId])
    || !same(profile.focalPoint, handoff.focalPoint)
    || !same(profile.quietZone, handoff.quietZone)
    || profile.focalPoint.some(value => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new TypeError(`${profileId} crop drifted from its contract`);
  }
  const crop = computeBackgroundCrop({
    sourceSize: [1536, 864],
    targetSize: profile.targetSize,
    focalPoint: profile.focalPoint
  });
  const corners = [
    [profile.quietZone.x, profile.quietZone.y],
    [profile.quietZone.x + profile.quietZone.width, profile.quietZone.y],
    [profile.quietZone.x, profile.quietZone.y + profile.quietZone.height],
    [profile.quietZone.x + profile.quietZone.width,
      profile.quietZone.y + profile.quietZone.height]
  ];
  if (!pointInside(crop, profile.focalPoint[0], profile.focalPoint[1])
    || corners.some(([x, y]) => !pointInside(crop, x, y))) {
    throw new TypeError(`${profileId} crop clips its focal point or quiet zone`);
  }
}

function assertLayer(layer, index, kit) {
  assertExactObject(layer, LAYER_KEYS, `${kit.id} layer`);
  const plane = PLANES[index];
  const expectedRenderer = plane === "background"
    ? "background-raster"
    : plane === "interaction" ? "code-native-dom" : "code-native-svg";
  if (layer.id !== `layer:${kit.id}:${plane}` || layer.plane !== plane
    || layer.zIndex !== Z_INDEXES[index] || layer.rendererKind !== expectedRenderer
    || !same(layer.densityProfiles, DENSITY_PROFILES)
    || !same(layer.motionProfiles, MOTION_PROFILES)) {
    throw new TypeError(`${kit.id}: typed layer contract drifted`);
  }
  assertExactArray(layer.semanticIds, layer.semanticIds.length, `${kit.id} layer semantics`);
  assertExactArray(layer.essentialSemanticIds, layer.essentialSemanticIds.length,
    `${kit.id} essential layer semantics`);
  if (new Set(layer.semanticIds).size !== layer.semanticIds.length
    || layer.essentialSemanticIds.some(id => !layer.semanticIds.includes(id))) {
    throw new TypeError(`${kit.id}: layer semantics are invalid`);
  }
  if (plane === "background") {
    if (!same(layer.semanticIds, kit.backdropReviewSemanticIds)
      || layer.essentialSemanticIds.length !== 0) {
      throw new TypeError(`${kit.id}: raster layer is not decorative-only`);
    }
  } else if (layer.semanticIds.some(id => !kit.codeNativeSemanticIds.includes(id))) {
    throw new TypeError(`${kit.id}: layer contains a non-code-native semantic`);
  }
  if (plane === "effects" && layer.essentialSemanticIds.length !== 0) {
    throw new TypeError(`${kit.id}: effects must be nonessential`);
  }
}

function assertKit(kit, chapter, handoff) {
  assertExactObject(kit, KIT_KEYS, `${chapter.id} kit`);
  if (kit.id !== chapter.id || chapter.biomeKitId !== kit.id
    || kit.paletteTokenId !== handoff.paletteTokenId
    || kit.lightingTokenId !== handoff.lightingTokenId
    || !Object.hasOwn(SOUND_SEEKERS_VISUAL_TOKENS, kit.paletteTokenId)
    || !Object.hasOwn(SOUND_SEEKERS_VISUAL_TOKENS, kit.lightingTokenId)) {
    throw new TypeError(`${chapter.id}: biome identity or token join drifted`);
  }

  assertExactObject(kit.background,
    ["src", "provenanceId", "expectedAspect", "minSize", "cropProfiles"],
    `${kit.id} background`);
  assertExactArray(kit.background.expectedAspect, 2, `${kit.id} expected aspect`);
  assertExactArray(kit.background.minSize, 2, `${kit.id} minimum size`);
  assertExactObject(kit.background.cropProfiles, PROFILE_IDS, `${kit.id} crop profiles`);
  if (kit.background.src !== handoff.src || kit.background.provenanceId !== handoff.provenanceId
    || !same(kit.background.expectedAspect, [16, 9])
    || !same(kit.background.minSize, [1536, 864])) {
    throw new TypeError(`${kit.id}: Task 5 background handoff drifted`);
  }
  for (const profileId of PROFILE_IDS) {
    assertCropProfile(kit.background.cropProfiles[profileId], profileId, handoff);
  }

  assertExactObject(kit.backgroundGenerationBrief, [
    "styleId", "environmentDescription", "requiredBackdropElements",
    "backdropReviewSemanticIds", "forbiddenSemanticIds", "forbiddenContent"
  ], `${kit.id} generation brief`);
  const brief = kit.backgroundGenerationBrief;
  assertExactArray(brief.requiredBackdropElements, 3,
    `${kit.id} required backdrop elements`);
  assertExactArray(brief.backdropReviewSemanticIds, 3,
    `${kit.id} brief backdrop semantics`);
  assertExactArray(brief.forbiddenSemanticIds, brief.forbiddenSemanticIds.length,
    `${kit.id} forbidden semantics`);
  assertExactArray(brief.forbiddenContent, FORBIDDEN_CONTENT.length,
    `${kit.id} forbidden content`);
  if (brief.styleId !== STYLE_ID
    || brief.environmentDescription !== handoff.environmentDescription
    || !same(brief.requiredBackdropElements, handoff.requiredBackdropElements)
    || !same(brief.backdropReviewSemanticIds, handoff.backdropReviewSemanticIds)
    || !same(brief.backdropReviewSemanticIds, kit.backdropReviewSemanticIds)
    || !same(brief.forbiddenSemanticIds, kit.codeNativeSemanticIds)
    || !same(brief.forbiddenContent, FORBIDDEN_CONTENT)) {
    throw new TypeError(`${kit.id}: immutable generation brief drifted`);
  }

  for (const array of [kit.backdropReviewSemanticIds, kit.codeNativeSemanticIds,
    kit.routeSpecIds, kit.landmarkIds]) {
    assertExactArray(array, array.length, `${kit.id} catalog array`);
    if (new Set(array).size !== array.length) throw new TypeError(`${kit.id}: duplicate identity`);
  }
  if (kit.backdropReviewSemanticIds.some(id => kit.codeNativeSemanticIds.includes(id))) {
    throw new TypeError(`${kit.id}: raster and code-native semantics overlap`);
  }

  const propFamilyId = `prop-family:${chapter.id}`;
  const rewardFamilyId = `reward-family:${chapter.chapterReward.id}`;
  const wonderEffectId = `wonder-effect:${chapter.wonderId}`;
  if (kit.propFamilyId !== propFamilyId || kit.rewardFamilyId !== rewardFamilyId
    || kit.wonderEffectId !== wonderEffectId) {
    throw new TypeError(`${kit.id}: structural family join drifted`);
  }
  const expectedCodeNative = unique([
    ...SOUND_SEEKERS_SEMANTIC_VISUALS
      .filter(semantic => semantic.chapterId === chapter.id
        || semantic.chapterIds?.includes(chapter.id))
      .map(semantic => semantic.id),
    propFamilyId,
    rewardFamilyId,
    wonderEffectId
  ]);
  if (!same(kit.codeNativeSemanticIds, expectedCodeNative)
    || kit.codeNativeSemanticIds.some(id => !semanticById.has(id))) {
    throw new TypeError(`${kit.id}: code-native semantic join drifted`);
  }
  const expectedRoutes = SOUND_SEEKERS_ROUTE_SPECS
    .filter(route => route.chapterId === chapter.id).map(route => route.id);
  const expectedLandmarks = SOUND_SEEKERS_LANDMARK_BINDINGS
    .filter(landmark => landmark.chapterId === chapter.id).map(landmark => landmark.id);
  if (!same(kit.routeSpecIds, expectedRoutes) || !same(kit.landmarkIds, expectedLandmarks)
    || kit.routeSpecIds.length !== 5 || kit.landmarkIds.length !== 5) {
    throw new TypeError(`${kit.id}: route or landmark join drifted`);
  }

  assertExactArray(kit.layers, PLANES.length, `${kit.id} layers`);
  kit.layers.forEach((layer, index) => assertLayer(layer, index, kit));
  const expectedLayers = buildLayers(kit.id, kit.backdropReviewSemanticIds,
    kit.codeNativeSemanticIds, { propFamilyId, rewardFamilyId, wonderEffectId });
  if (!same(kit.layers, expectedLayers)) {
    throw new TypeError(`${kit.id}: semantic layer ownership drifted`);
  }
  const assigned = kit.layers.slice(1).flatMap(layer => layer.semanticIds);
  if (!same([...assigned].sort(), [...kit.codeNativeSemanticIds].sort())
    || new Set(assigned).size !== assigned.length) {
    throw new TypeError(`${kit.id}: code-native layer assignment is not bijective`);
  }
}

export const SOUND_SEEKERS_BIOME_KITS = deepFreeze(
  SOUND_SEEKERS_CHAPTERS.map(buildKit)
);

const biomeById = new Map(SOUND_SEEKERS_BIOME_KITS.map(kit => [kit.id, kit]));

export function getBiomeKit(chapterId) {
  return typeof chapterId === "string" ? biomeById.get(chapterId) || null : null;
}

export function validateSoundSeekersBiomeKits(kits = SOUND_SEEKERS_BIOME_KITS) {
  assertFrozen(kits, "biome catalog");
  assertExactArray(kits, SOUND_SEEKERS_CHAPTERS.length, "biome catalog");
  if (kits.length !== 8) throw new TypeError("biome catalog must contain eight kits");
  for (const [index, chapter] of SOUND_SEEKERS_CHAPTERS.entries()) {
    assertKit(kits[index], chapter, HANDOFFS[index]);
  }
  if (new Set(kits.map(kit => kit.id)).size !== kits.length) {
    throw new TypeError("biome catalog contains duplicate identities");
  }

  const dimensions = kits.map(structuralDimensions);
  const signatures = dimensions.map(structuralHash);
  if (new Set(signatures).size !== kits.length) {
    throw new TypeError("code-native biome structures must be unique");
  }
  for (let left = 0; left < dimensions.length; left += 1) {
    for (let right = left + 1; right < dimensions.length; right += 1) {
      const differenceCount = ["routes", "landmarks", "propReward", "wonder"]
        .filter(key => !same(dimensions[left][key], dimensions[right][key])).length;
      if (differenceCount < 2) {
        throw new TypeError("every biome pair needs two structural differences");
      }
    }
  }
  return true;
}

validateSoundSeekersBiomeKits();
