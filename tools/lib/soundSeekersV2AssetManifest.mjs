import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  SOUND_SEEKERS_BIOME_KITS,
  computeBackgroundCrop,
  validateSoundSeekersBiomeKits
} from "../../src/features/soundSeekers/content/biomeKits.js";

export const SOUND_SEEKERS_V2_BACKGROUND_ORDER = Object.freeze([
  "seedwake-meadow",
  "river-gardens",
  "fossil-canyon",
  "forge-settlement",
  "glass-marsh",
  "storm-coast",
  "lantern-forest",
  "star-reach"
]);

export const SOUND_SEEKERS_V2_PROFILE_ORDER = Object.freeze([
  "landscape",
  "tablet",
  "portrait"
]);

export const SOUND_SEEKERS_V2_ACTION_LANE = deepFreeze({
  x: 0.2,
  y: 0.58,
  width: 0.6,
  height: 0.3
});

export const SOUND_SEEKERS_V2_PUBLIC_ROOT =
  "public/game-assets/sound-seekers/v2";
export const SOUND_SEEKERS_V2_SOURCE_PATH =
  `${SOUND_SEEKERS_V2_PUBLIC_ROOT}/SOURCE.md`;

const PROHIBITIONS = Object.freeze([
  "characters",
  "residents",
  "route",
  "landmark",
  "state",
  "reward",
  "meaning",
  "option",
  "choice",
  "interactable",
  "interactive objects",
  "collectible",
  "grapheme plate",
  "focus",
  "feedback",
  "interface",
  "interface object",
  "foreground action",
  "isolated or highlighted choice",
  "correctness cue",
  "answer cue",
  "text",
  "letters",
  "words",
  "glyphs",
  "numerals",
  "signs",
  "labels",
  "alphabet-like marks",
  "runes",
  "logos",
  "watermarks",
  "borders",
  "third-party characters",
  "unsafe imagery",
  "high-contrast clutter in the play lane"
]);

export const SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY = deepFreeze({
  styleId: "sound-seekers-painted-shape-v2",
  useCase: "stylized-concept",
  assetType: "decorative early-literacy 2D game background",
  primaryRequest:
    "Create one answer-neutral Sound Seekers biome backdrop from the immutable scene description and required backdrop elements only.",
  styleMedium:
    "Shape-led hand-painted storybook environment; restrained paper and gouache texture; rounded readable environmental silhouettes; no extra objects.",
  compositionFraming:
    "Wide landscape source with one full-bleed 16:9 crop of at least 1536x864 usable pixels; clear lower-middle play lane; quiet depth; subdued play-space contrast.",
  lightingMood:
    "Consistent upper-left lighting; welcoming, calm, adventurous.",
  prohibitions: PROHIBITIONS,
  avoid:
    "Do not add, translate, embellish, label, or restate any biome-specific object beyond the exact scene description and ordered required backdrop elements."
});

const EXPECTED_SHARED_PROMPT_LINES = deepFreeze({
  beforeScene: [
    "Use case: stylized-concept",
    "Asset type: decorative early-literacy 2D game background",
    "Primary request: Create one answer-neutral Sound Seekers biome backdrop from the immutable scene description and required backdrop elements only."
  ],
  afterScene: [
    "Style/medium: Shape-led hand-painted storybook environment; restrained paper and gouache texture; rounded readable environmental silhouettes; no extra objects.",
    "Composition/framing: Wide landscape source with one full-bleed 16:9 crop of at least 1536x864 usable pixels; clear lower-middle play lane; quiet depth; subdued play-space contrast.",
    "Lighting/mood: Consistent upper-left lighting; welcoming, calm, adventurous.",
    "Constraints: Decorative backdrop only; include exactly the required backdrop elements; preserve a clear lower-middle lane; no characters, residents, route, landmark, state, reward, meaning, option, choice, interactable, interactive objects, collectible, grapheme plate, focus, feedback, interface, interface object, foreground action, isolated or highlighted choice, correctness cue, answer cue, text, letters, words, glyphs, numerals, signs, labels, alphabet-like marks, runes, logos, watermarks, borders, third-party characters, unsafe imagery, or high-contrast clutter in the play lane.",
    "Avoid: Do not add, translate, embellish, label, or restate any biome-specific object beyond the exact scene description and ordered required backdrop elements."
  ]
});

export const SOUND_SEEKERS_V2_BACKGROUND_PROMPT_SNAPSHOTS = deepFreeze([
  {
    chapterId: "seedwake-meadow",
    sceneLine: "Scene/backdrop: Dawn pasture, living hedges, warm wood, distant seed-lantern glow, pale gold and fresh green; quiet lower-middle lane. Required backdrop elements, in this exact order: dawn pasture; living hedges; distant windmill lantern silhouette.",
    sha256: "566773a2c3683bad5f99af4f98b7838526737a4563dcacb1e6c5d0fd779a7cc7"
  },
  {
    chapterId: "river-gardens",
    sceneLine: "Scene/backdrop: Terraced water channels, reeds, ceramic garden markers, turquoise and terracotta; quiet lower-middle lane. Required backdrop elements, in this exact order: terraced water channels; reed banks; distant ceramic terrace markers.",
    sha256: "c391e87edf00f683e5b8cecc5b2511b33821239503ebe933e102954c60a99c90"
  },
  {
    chapterId: "fossil-canyon",
    sceneLine: "Scene/backdrop: Layered sandstone shelves, ancient tracks, bone arches and amber afternoon depth; quiet lower-middle lane. Required backdrop elements, in this exact order: layered sandstone shelves; ancient track bed; distant bone arch.",
    sha256: "abfb8de7cbb3c5331357cf5090243c004761942cfa188d67c462f8168d7f5298"
  },
  {
    chapterId: "forge-settlement",
    sceneLine: "Scene/backdrop: Dark-stone workshops, distant furnace architecture, copper-and-iron depth and controlled ember light; quiet lower-middle lane. Required backdrop elements, in this exact order: distant furnace architecture; dark-stone workshops; copper rail depth.",
    sha256: "9c3f062a07998fc6dc458c32684fd763e11fbba8708aaccae2c5df4c03f3ad8d"
  },
  {
    chapterId: "glass-marsh",
    sceneLine: "Scene/backdrop: Reflective jade pools, glass-reed depth, mist and refracted distant paths; quiet lower-middle lane. Required backdrop elements, in this exact order: reflective jade pools; distant glass reeds; mist path depth.",
    sha256: "7ef99218166110aa666a4c6ce53b4a161ae3498853a72fcf4b70801b285e57ab"
  },
  {
    chapterId: "storm-coast",
    sceneLine: "Scene/backdrop: Sea cliffs, spray, distant timber shelters and a storm clearing toward warm light; quiet lower-middle lane. Required backdrop elements, in this exact order: sea cliffs; distant timber shelters; storm clearing toward warm light.",
    sha256: "5bea204b8f6933d2c293be6b5d26d910b885875c24078aa50d14b5ccf4688fb6"
  },
  {
    chapterId: "lantern-forest",
    sceneLine: "Scene/backdrop: Deep layered woods, root-bridge depth, distant hanging lantern path, moss and muted gold; quiet lower-middle lane. Required backdrop elements, in this exact order: deep layered woods; distant root bridges; distant hanging lantern path.",
    sha256: "7055cee9cb3bc4bd0b978dad5d4170036b117944efa7efc5958ead23a021bedb"
  },
  {
    chapterId: "star-reach",
    sceneLine: "Scene/backdrop: High observatory terraces, distant comet stairs, night sky, indigo and warm starlight; quiet lower-middle lane. Required backdrop elements, in this exact order: high observatory terraces; distant comet stairs; night sky.",
    sha256: "bb66a888724708abff0be3c38a16ff89b30a8eb117acef437de882a3d746e85a"
  }
]);

const TARGET_SIZES = deepFreeze({
  landscape: [568, 320],
  tablet: [1194, 834],
  portrait: [320, 568]
});

const AGENT_CHECKS = deepFreeze({
  textGlyphNumberSign: "none_observed",
  logoWatermarkBorder: "none_observed",
  unsafeImagery: "none_observed",
  codeNativeObjectLeak: "none_observed",
  answerOrChoiceCue: "none_observed",
  styleLighting: "matches_contract",
  backdropSemantics: "recognizable",
  crossBiomeDistinctness: "distinct",
  lowerMiddleLane: "clear",
  profileQuietZones: "retained"
});

const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const UTC_INSTANT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u;

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && Object.hasOwn(descriptor, "value")) {
      deepFreeze(descriptor.value);
    }
  }
  return Object.freeze(value);
}

function isPlainObject(value) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function assertDataShape(value, label) {
  if (Array.isArray(value)) {
    const expectedKeys = [
      ...Array.from({ length: value.length }, (_, index) => String(index)),
      "length"
    ];
    const actualKeys = Reflect.ownKeys(value);
    if (actualKeys.length !== expectedKeys.length
      || actualKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new TypeError(`${label} must be a dense data array`);
    }
    return;
  }
  if (!isPlainObject(value)) {
    throw new TypeError(`${label} must be a plain data object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") {
      throw new TypeError(`${label} may not contain symbol keys`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable
      || !Object.hasOwn(descriptor, "value")) {
      throw new TypeError(`${label} must contain ordinary data properties`);
    }
  }
}

function canonicalize(value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON rejects non-finite numbers");
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") {
    throw new TypeError("canonical JSON accepts JSON data only");
  }
  if (seen.has(value)) throw new TypeError("canonical JSON rejects cycles");
  seen.add(value);
  assertDataShape(value, "canonical JSON value");
  let output;
  if (Array.isArray(value)) {
    output = value.map(item => canonicalize(item, seen));
  } else {
    output = {};
    for (const key of Object.keys(value).sort()) {
      output[key] = canonicalize(value[key], seen);
    }
  }
  seen.delete(value);
  return output;
}

export function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value, new Set()));
}

export function sha256Bytes(value) {
  if (!(Buffer.isBuffer(value) || value instanceof Uint8Array)) {
    throw new TypeError("sha256Bytes expects bytes");
  }
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Text(value) {
  if (typeof value !== "string") throw new TypeError("sha256Text expects text");
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function sha256Canonical(value) {
  return sha256Text(canonicalStringify(value));
}

function same(left, right) {
  return canonicalStringify(left) === canonicalStringify(right);
}

function assertExactKeys(value, expected, label) {
  if (!isPlainObject(value)) throw new TypeError(`${label} must be an object`);
  assertDataShape(value, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (!same(actual, wanted)) {
    throw new TypeError(`${label} has missing or extra keys`);
  }
}

function assertExactArray(value, length, label) {
  if (!Array.isArray(value) || value.length !== length) {
    throw new TypeError(`${label} must contain exactly ${length} items`);
  }
  assertDataShape(value, label);
}

function assertHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 hash`);
  }
}

function assertUtcInstant(value, label) {
  if (typeof value !== "string" || !UTC_INSTANT_PATTERN.test(value)
    || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${label} must be an RFC 3339 UTC instant`);
  }
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/u
  );
  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  ));
  if (Number(month) < 1 || Number(month) > 12
    || Number(day) < 1 || Number(hour) > 23 || Number(minute) > 59
    || Number(second) > 59
    || date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)) {
    throw new TypeError(`${label} must be an RFC 3339 UTC instant`);
  }
}

function assertSafePositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
}

function canonicalKit(chapterId) {
  return SOUND_SEEKERS_BIOME_KITS.find(kit => kit.id === chapterId) || null;
}

function assertTask4Kit(kit) {
  validateSoundSeekersBiomeKits();
  if (!kit || typeof kit !== "object" || !Object.isFrozen(kit)) {
    throw new TypeError("background prompt requires a frozen Task 4 biome kit");
  }
  const expected = canonicalKit(kit.id);
  if (!expected || !same(kit, expected)) {
    throw new TypeError("background prompt kit drifted from the frozen Task 4 catalog");
  }
  if (!same(kit.background.expectedAspect, [16, 9])
    || !same(kit.background.minSize, [1536, 864])) {
    throw new TypeError(`${kit.id}: background dimensions drifted`);
  }
  if (kit.backgroundGenerationBrief.styleId
    !== SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY.styleId) {
    throw new TypeError(`${kit.id}: background style drifted`);
  }
  for (const profileId of SOUND_SEEKERS_V2_PROFILE_ORDER) {
    const profile = kit.background.cropProfiles[profileId];
    if (!profile || !same(profile.targetSize, TARGET_SIZES[profileId])) {
      throw new TypeError(`${kit.id}: ${profileId} target size drifted`);
    }
  }
  return expected;
}

export function task4BriefSha256(kit) {
  const canonical = assertTask4Kit(kit);
  return sha256Canonical(canonical.backgroundGenerationBrief);
}

export function task4BriefSetSha256(kits = SOUND_SEEKERS_BIOME_KITS) {
  validateSoundSeekersBiomeKits(kits);
  assertExactArray(kits, SOUND_SEEKERS_V2_BACKGROUND_ORDER.length,
    "Task 4 brief set");
  return sha256Canonical(kits.map((kit, index) => {
    const canonical = assertTask4Kit(kit);
    if (canonical.id !== SOUND_SEEKERS_V2_BACKGROUND_ORDER[index]) {
      throw new TypeError("Task 4 brief set is out of canonical order");
    }
    return canonical.backgroundGenerationBrief;
  }));
}

export function buildSoundSeekersV2BackgroundPrompt(kit) {
  const canonical = assertTask4Kit(kit);
  const policy = SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY;
  const brief = canonical.backgroundGenerationBrief;
  const scene = `${brief.environmentDescription} Required backdrop elements, in this exact order: ${brief.requiredBackdropElements.join("; ")}.`;
  const constraints = `Decorative backdrop only; include exactly the required backdrop elements; preserve a clear lower-middle lane; no ${policy.prohibitions.slice(0, -1).join(", ")}, or ${policy.prohibitions.at(-1)}.`;
  const prompt = [
    `Use case: ${policy.useCase}`,
    `Asset type: ${policy.assetType}`,
    `Primary request: ${policy.primaryRequest}`,
    `Scene/backdrop: ${scene}`,
    `Style/medium: ${policy.styleMedium}`,
    `Composition/framing: ${policy.compositionFraming}`,
    `Lighting/mood: ${policy.lightingMood}`,
    `Constraints: ${constraints}`,
    `Avoid: ${policy.avoid}`
  ].join("\n");
  for (const semanticId of canonical.codeNativeSemanticIds) {
    if (prompt.includes(semanticId)) {
      throw new TypeError(`${canonical.id}: prompt leaked a code-native semantic ID`);
    }
  }
  for (const semanticId of brief.forbiddenSemanticIds) {
    if (prompt.includes(semanticId)) {
      throw new TypeError(`${canonical.id}: prompt leaked a forbidden semantic ID`);
    }
  }
  return prompt;
}

export function assertSoundSeekersV2BackgroundPromptSnapshots(
  kits = SOUND_SEEKERS_BIOME_KITS
) {
  validateSoundSeekersBiomeKits(kits);
  assertExactArray(kits, SOUND_SEEKERS_V2_BACKGROUND_ORDER.length,
    "Task 4 prompt kit set");
  if (!same(
    SOUND_SEEKERS_V2_BACKGROUND_PROMPT_SNAPSHOTS.map(item => item.chapterId),
    SOUND_SEEKERS_V2_BACKGROUND_ORDER
  )) {
    throw new TypeError("background prompt snapshots are out of canonical order");
  }
  for (const [index, kit] of kits.entries()) {
    const snapshot = SOUND_SEEKERS_V2_BACKGROUND_PROMPT_SNAPSHOTS[index];
    if (kit.id !== snapshot.chapterId) {
      throw new TypeError("Task 4 prompt kits are out of canonical order");
    }
    const expectedPrompt = [
      ...EXPECTED_SHARED_PROMPT_LINES.beforeScene,
      snapshot.sceneLine,
      ...EXPECTED_SHARED_PROMPT_LINES.afterScene
    ].join("\n");
    const prompt = buildSoundSeekersV2BackgroundPrompt(kit);
    if (prompt !== expectedPrompt
      || sha256Text(expectedPrompt) !== snapshot.sha256
      || sha256Text(prompt) !== snapshot.sha256) {
      throw new TypeError(`${kit.id}: background prompt snapshot drifted`);
    }
    for (const semanticId of kit.codeNativeSemanticIds) {
      if (prompt.includes(semanticId)) {
        throw new TypeError(`${kit.id}: background prompt leaked a code-native semantic ID`);
      }
    }
    for (const prohibition of PROHIBITIONS) {
      if (!prompt.includes(prohibition)) {
        throw new TypeError(`${kit.id}: background prompt omitted a prohibition`);
      }
    }
  }
  return true;
}

assertSoundSeekersV2BackgroundPromptSnapshots();

export function parseSoundSeekersV2AssetManifestText(sourceText) {
  if (typeof sourceText !== "string") {
    throw new TypeError("SOURCE manifest must be text");
  }
  const matches = [...sourceText.matchAll(/```json[\t ]*\r?\n([\s\S]*?)\r?\n```/gu)];
  const anyJsonFenceCount = [...sourceText.matchAll(/```(?:json|JSON)\b/gu)].length;
  if (matches.length !== 1 || anyJsonFenceCount !== 1) {
    throw new TypeError("SOURCE.md must contain exactly one fenced JSON object");
  }
  let manifest;
  try {
    manifest = JSON.parse(matches[0][1]);
  } catch {
    throw new TypeError("SOURCE.md contains malformed JSON");
  }
  if (!isPlainObject(manifest)) {
    throw new TypeError("SOURCE.md JSON fence must contain one object");
  }
  return manifest;
}

export function readSoundSeekersV2AssetManifest({ root = process.cwd() } = {}) {
  if (typeof root !== "string" || root.length === 0 || !path.isAbsolute(root)) {
    throw new TypeError("manifest root must be an absolute path");
  }
  const sourcePath = path.join(root, SOUND_SEEKERS_V2_SOURCE_PATH);
  return parseSoundSeekersV2AssetManifestText(readFileSync(sourcePath, "utf8"));
}

function largestIntegerSixteenNine(width, height) {
  const scale = Math.floor(Math.min(width / 16, height / 9));
  return { width: 16 * scale, height: 9 * scale };
}

function expectedSourceCrop(source, kit) {
  const size = largestIntegerSixteenNine(source.width, source.height);
  const [fx, fy] = kit.background.cropProfiles.landscape.focalPoint;
  const left = Math.max(0, Math.min(
    Math.round(fx * source.width - size.width / 2),
    source.width - size.width
  ));
  const top = Math.max(0, Math.min(
    Math.round(fy * source.height - size.height / 2),
    source.height - size.height
  ));
  return { left, top, ...size, anchorProfile: "landscape" };
}

function assertResultMetadata(value, label) {
  assertExactKeys(value, ["returnedModel", "outputHintSha256"], label);
  if (!(value.returnedModel === null
    || (typeof value.returnedModel === "string"
      && value.returnedModel.length > 0
      && value.returnedModel === value.returnedModel.trim()))) {
    throw new TypeError(`${label}.returnedModel is invalid`);
  }
  if (value.outputHintSha256 !== null) {
    assertHash(value.outputHintSha256, `${label}.outputHintSha256`);
  }
}

function assertHumanReview(review, kind, asset, kit) {
  if (review === null) return;
  const tailKey = kind === "crop" ? "cropProfiles" : "backdropReviewSemanticIds";
  assertExactKeys(review, [
    "finalSha256",
    "reviewedAt",
    "reviewerRole",
    "environment",
    "decision",
    "evidenceRefs",
    tailKey
  ], `${asset.chapterId} ${kind} human review`);
  if (review.finalSha256 !== asset.final.sha256) {
    throw new TypeError(`${asset.chapterId} ${kind} human review is stale`);
  }
  assertUtcInstant(review.reviewedAt, `${asset.chapterId} ${kind} reviewedAt`);
  for (const field of ["reviewerRole", "environment"]) {
    if (typeof review[field] !== "string" || review[field].trim().length === 0
      || review[field] !== review[field].trim()) {
      throw new TypeError(`${asset.chapterId} ${kind} ${field} is invalid`);
    }
  }
  if (/\b(?:agent|automation|automated|model|bot|artificial intelligence|ai)\b/iu
    .test(review.reviewerRole)) {
    throw new TypeError(`${asset.chapterId} ${kind} review must come from a direct person`);
  }
  if (!["approved", "rejected"].includes(review.decision)) {
    throw new TypeError(`${asset.chapterId} ${kind} decision is invalid`);
  }
  if (!Array.isArray(review.evidenceRefs) || review.evidenceRefs.length === 0
    || new Set(review.evidenceRefs).size !== review.evidenceRefs.length
    || review.evidenceRefs.some(item => typeof item !== "string"
      || item.trim().length === 0 || item !== item.trim())) {
    throw new TypeError(`${asset.chapterId} ${kind} evidenceRefs are invalid`);
  }
  const expected = kind === "crop"
    ? SOUND_SEEKERS_V2_PROFILE_ORDER
    : kit.backdropReviewSemanticIds;
  if (!same(review[tailKey], expected)) {
    throw new TypeError(`${asset.chapterId} ${kind} review crosses evidence categories`);
  }
}

function assertAgentInspection(value, asset) {
  assertExactKeys(value, [
    "sourceSha256",
    "finalSha256",
    "inspectedAt",
    "methods",
    "decision",
    "checks"
  ], `${asset.chapterId} agentInspection`);
  if (value.sourceSha256 !== asset.source.sha256
    || value.finalSha256 !== asset.final.sha256) {
    throw new TypeError(`${asset.chapterId} agent inspection is stale`);
  }
  assertExactKeys(value.inspectedAt, ["source", "final", "crops"],
    `${asset.chapterId} agent inspection dates`);
  for (const scope of ["source", "final", "crops"]) {
    assertUtcInstant(value.inspectedAt[scope],
      `${asset.chapterId} ${scope} inspection date`);
  }
  if (!same(value.methods, [
    "view_image:original-source",
    "view_image:original-final",
    "view_image:original-crops"
  ]) || value.decision !== "accepted") {
    throw new TypeError(`${asset.chapterId} agent inspection is not accepted evidence`);
  }
  assertExactKeys(value.checks, Object.keys(AGENT_CHECKS),
    `${asset.chapterId} agent inspection checks`);
  if (!same(value.checks, AGENT_CHECKS)) {
    throw new TypeError(`${asset.chapterId} agent inspection checks are invalid`);
  }
}

function assertTask4Projection(value, kit) {
  assertExactKeys(value, [
    "briefSha256",
    "styleId",
    "requiredBackdropElements",
    "backdropReviewSemanticIds",
    "forbiddenSemanticIds"
  ], `${kit.id} task4 provenance`);
  if (value.briefSha256 !== task4BriefSha256(kit)
    || value.styleId !== kit.backgroundGenerationBrief.styleId
    || !same(value.requiredBackdropElements,
      kit.backgroundGenerationBrief.requiredBackdropElements)
    || !same(value.backdropReviewSemanticIds, kit.backdropReviewSemanticIds)
    || !same(value.forbiddenSemanticIds,
      kit.backgroundGenerationBrief.forbiddenSemanticIds)) {
    throw new TypeError(`${kit.id} Task 4 provenance drifted`);
  }
}

function assertGeneration(value, kit, ordinal) {
  assertExactKeys(value, [
    "mode",
    "tool",
    "callOrdinal",
    "requestedAt",
    "completedAt",
    "prompt",
    "promptSha256",
    "resultMetadata",
    "resultMetadataSha256"
  ], `${kit.id} generation`);
  const prompt = buildSoundSeekersV2BackgroundPrompt(kit);
  if (value.mode !== "builtin_image_gen" || value.tool !== "image_gen.imagegen"
    || value.callOrdinal !== ordinal || value.prompt !== prompt
    || value.promptSha256 !== sha256Text(prompt)) {
    throw new TypeError(`${kit.id} generation contract drifted`);
  }
  assertUtcInstant(value.requestedAt, `${kit.id} requestedAt`);
  assertUtcInstant(value.completedAt, `${kit.id} completedAt`);
  if (Date.parse(value.completedAt) < Date.parse(value.requestedAt)) {
    throw new TypeError(`${kit.id} generation completed before it was requested`);
  }
  assertResultMetadata(value.resultMetadata, `${kit.id} resultMetadata`);
  assertHash(value.resultMetadataSha256, `${kit.id} resultMetadataSha256`);
  if (value.resultMetadataSha256 !== sha256Canonical(value.resultMetadata)) {
    throw new TypeError(`${kit.id} result metadata hash drifted`);
  }
}

function assertSource(value, kit) {
  assertExactKeys(value, ["format", "width", "height", "sha256"],
    `${kit.id} source`);
  if (!["png", "jpeg", "webp"].includes(value.format)) {
    throw new TypeError(`${kit.id} source format is invalid`);
  }
  assertSafePositiveInteger(value.width, `${kit.id} source width`);
  assertSafePositiveInteger(value.height, `${kit.id} source height`);
  assertHash(value.sha256, `${kit.id} source sha256`);
  const largest = largestIntegerSixteenNine(value.width, value.height);
  if (largest.width < 1536 || largest.height < 864) {
    throw new TypeError(`${kit.id} source cannot supply the required crop`);
  }
}

function assertTransform(value, asset, kit) {
  assertExactKeys(value, ["orientation", "crop", "resize", "encode"],
    `${kit.id} transform`);
  if (value.orientation !== "auto") {
    throw new TypeError(`${kit.id} orientation contract drifted`);
  }
  assertExactKeys(value.crop, ["left", "top", "width", "height", "anchorProfile"],
    `${kit.id} source crop`);
  const expectedCrop = expectedSourceCrop(asset.source, kit);
  if (!same(value.crop, expectedCrop)) {
    throw new TypeError(`${kit.id} source crop is not the largest anchored 16:9 crop`);
  }
  assertExactKeys(value.resize, ["width", "height", "kernel", "withoutEnlargement"],
    `${kit.id} resize`);
  if (!same(value.resize, {
    width: 1536,
    height: 864,
    kernel: "lanczos3",
    withoutEnlargement: true
  })) {
    throw new TypeError(`${kit.id} resize contract drifted`);
  }
  assertExactKeys(value.encode, [
    "format",
    "quality",
    "effort",
    "smartSubsample",
    "metadata",
    "colourspace",
    "sharpVersion",
    "libvipsVersion",
    "doubleEncodeSha256"
  ], `${kit.id} encode`);
  const encode = value.encode;
  if (encode.format !== "webp" || encode.quality !== 82 || encode.effort !== 6
    || encode.smartSubsample !== true || encode.metadata !== "stripped"
    || encode.colourspace !== "srgb"
    || typeof encode.sharpVersion !== "string" || encode.sharpVersion.length === 0
    || typeof encode.libvipsVersion !== "string" || encode.libvipsVersion.length === 0) {
    throw new TypeError(`${kit.id} encode contract drifted`);
  }
  assertHash(encode.doubleEncodeSha256, `${kit.id} double encode hash`);
  if (encode.doubleEncodeSha256 !== asset.final.sha256) {
    throw new TypeError(`${kit.id} double encode does not bind the final bytes`);
  }
}

function assertFinal(value, kit) {
  assertExactKeys(value, [
    "format", "width", "height", "byteLength", "sha256", "opaque", "pages"
  ], `${kit.id} final`);
  if (value.format !== "webp" || value.width !== 1536 || value.height !== 864
    || value.opaque !== true || value.pages !== 1) {
    throw new TypeError(`${kit.id} final raster contract drifted`);
  }
  assertSafePositiveInteger(value.byteLength, `${kit.id} final byteLength`);
  assertHash(value.sha256, `${kit.id} final sha256`);
}

function assertCropReview(value, asset, kit) {
  assertExactKeys(value, ["manifestSha256", "profiles"],
    `${kit.id} cropReview`);
  assertHash(value.manifestSha256, `${kit.id} crop manifest hash`);
  assertExactArray(value.profiles, 3, `${kit.id} crop profiles`);
  for (const [profileIndex, profileId] of SOUND_SEEKERS_V2_PROFILE_ORDER.entries()) {
    const profile = value.profiles[profileIndex];
    assertExactKeys(profile, [
      "id",
      "targetSize",
      "focalPoint",
      "quietZone",
      "retainedRect",
      "panelSha256",
      "quietZoneRetained"
    ], `${kit.id} ${profileId} crop profile`);
    const task4Profile = kit.background.cropProfiles[profileId];
    const retainedRect = computeBackgroundCrop({
      sourceSize: [1536, 864],
      targetSize: task4Profile.targetSize,
      focalPoint: task4Profile.focalPoint
    });
    if (profile.id !== profileId
      || !same(profile.targetSize, task4Profile.targetSize)
      || !same(profile.focalPoint, task4Profile.focalPoint)
      || !same(profile.quietZone, task4Profile.quietZone)
      || !same(profile.retainedRect, retainedRect)
      || profile.quietZoneRetained !== true) {
      throw new TypeError(`${kit.id} ${profileId} crop evidence drifted`);
    }
    assertHash(profile.panelSha256, `${kit.id} ${profileId} panel hash`);
  }
}

export function assertSoundSeekersV2AssetManifest(
  manifest,
  kits = SOUND_SEEKERS_BIOME_KITS
) {
  validateSoundSeekersBiomeKits(kits);
  assertExactKeys(manifest, ["schemaVersion", "project", "generatorContract", "assets"],
    "Sound Seekers v2 manifest");
  if (manifest.schemaVersion !== 2
    || manifest.project !== "LiteracyPath Sound Seekers v2"
    || manifest.generatorContract !== "task4-immutable-background-brief-v1") {
    throw new TypeError("Sound Seekers v2 manifest header drifted");
  }
  assertExactArray(manifest.assets, SOUND_SEEKERS_V2_BACKGROUND_ORDER.length,
    "Sound Seekers v2 assets");
  const ids = new Set();
  const paths = new Set();
  const sourceHashes = new Set();
  const finalHashes = new Set();
  const cropManifestHashes = new Set();
  for (const [index, kit] of kits.entries()) {
    assertTask4Kit(kit);
    if (kit.id !== SOUND_SEEKERS_V2_BACKGROUND_ORDER[index]) {
      throw new TypeError("Task 4 kits are out of canonical order");
    }
    const asset = manifest.assets[index];
    assertExactKeys(asset, [
      "id",
      "chapterId",
      "path",
      "task4",
      "generation",
      "source",
      "transform",
      "final",
      "agentInspection",
      "cropReview",
      "humanReviews"
    ], `${kit.id} asset`);
    if (asset.id !== kit.background.provenanceId || asset.chapterId !== kit.id
      || asset.path !== kit.background.src) {
      throw new TypeError(`${kit.id} asset identity drifted`);
    }
    if (ids.has(asset.id) || paths.has(asset.path)) {
      throw new TypeError("Sound Seekers v2 assets contain duplicate identities or paths");
    }
    ids.add(asset.id);
    paths.add(asset.path);
    assertTask4Projection(asset.task4, kit);
    assertGeneration(asset.generation, kit, index + 1);
    assertSource(asset.source, kit);
    assertFinal(asset.final, kit);
    assertTransform(asset.transform, asset, kit);
    if (sourceHashes.has(asset.source.sha256) || finalHashes.has(asset.final.sha256)) {
      throw new TypeError("Sound Seekers v2 source/final images must be unique");
    }
    sourceHashes.add(asset.source.sha256);
    finalHashes.add(asset.final.sha256);
    assertAgentInspection(asset.agentInspection, asset);
    assertCropReview(asset.cropReview, asset, kit);
    cropManifestHashes.add(asset.cropReview.manifestSha256);
    assertExactKeys(asset.humanReviews, ["crop", "semantic"],
      `${kit.id} humanReviews`);
    assertHumanReview(asset.humanReviews.crop, "crop", asset, kit);
    assertHumanReview(asset.humanReviews.semantic, "semantic", asset, kit);
  }
  if (cropManifestHashes.size !== 1) {
    throw new TypeError("Sound Seekers v2 assets must share one crop-review manifest");
  }
  return true;
}

export async function assertSoundSeekersV2Assets({
  root = process.cwd(),
  kits = SOUND_SEEKERS_BIOME_KITS
} = {}) {
  const checker = await import("../checkSoundSeekersV2Assets.mjs");
  return checker.assertSoundSeekersV2Assets({ root, kits });
}

export const SOUND_SEEKERS_V2_AGENT_CHECKS = AGENT_CHECKS;
export const SOUND_SEEKERS_V2_TARGET_SIZES = TARGET_SIZES;
