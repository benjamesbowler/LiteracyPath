import { SOUND_SEEKERS_VISUAL_TOKENS } from "./visualTokens.js";

const APPEARANCE_KEYS = ["schemaVersion", "bodyShapeId", "paletteTokenId", "accessories"];
const ACCESSORY_SLOTS = ["back", "head", "neck", "held"];

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value, expectedKeys) {
  const keys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return keys.length === expectedKeys.length
    && keys.every(key => typeof key === "string" && expectedKeys.includes(key))
    && expectedKeys.every(key => Object.hasOwn(descriptors[key], "value")
      && descriptors[key].enumerable);
}

const BODY_SHAPE_IDS = deepFreeze([
  "body-shape-sprout",
  "body-shape-pebble",
  "body-shape-kite",
  "body-shape-bell"
]);

const PALETTE_TOKEN_IDS = deepFreeze([
  "player-palette-sunrise",
  "player-palette-moss",
  "player-palette-river",
  "player-palette-sky",
  "player-palette-plum",
  "player-palette-berry"
]);

const ACCESSORIES_BY_SLOT = deepFreeze({
  back: [null, "gear-back-field-pack", "gear-back-leaf-cape", "gear-back-map-roll"],
  head: [null, "gear-head-leaf-cap", "gear-head-sun-visor", "gear-head-star-band"],
  neck: [null, "gear-neck-scout-scarf", "gear-neck-seed-charm", "gear-neck-river-knot"],
  held: [null, "gear-held-listening-shell", "gear-held-seed-lantern", "gear-held-field-journal"]
});

for (const paletteTokenId of PALETTE_TOKEN_IDS) {
  if (!Object.hasOwn(SOUND_SEEKERS_VISUAL_TOKENS, paletteTokenId)) {
    throw new Error(`Unknown player palette token: ${paletteTokenId}`);
  }
}

export const SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS = deepFreeze({
  bodyShapes: BODY_SHAPE_IDS,
  palettes: PALETTE_TOKEN_IDS,
  accessoriesBySlot: ACCESSORIES_BY_SLOT
});

export function createCharacterAppearance(raw) {
  if (!isPlainRecord(raw) || !hasExactKeys(raw, APPEARANCE_KEYS)) {
    throw new TypeError("Character appearance must contain exactly the canonical keys");
  }
  if (raw.schemaVersion !== 1) {
    throw new TypeError("Character appearance schemaVersion must be 1");
  }
  if (typeof raw.bodyShapeId !== "string" || !BODY_SHAPE_IDS.includes(raw.bodyShapeId)) {
    throw new TypeError(`Unknown character body shape: ${String(raw.bodyShapeId)}`);
  }
  if (
    typeof raw.paletteTokenId !== "string"
    || !PALETTE_TOKEN_IDS.includes(raw.paletteTokenId)
    || !Object.hasOwn(SOUND_SEEKERS_VISUAL_TOKENS, raw.paletteTokenId)
  ) {
    throw new TypeError(`Unknown character palette: ${String(raw.paletteTokenId)}`);
  }
  if (!isPlainRecord(raw.accessories) || !hasExactKeys(raw.accessories, ACCESSORY_SLOTS)) {
    throw new TypeError("Character accessories must contain exactly back, head, neck, and held");
  }

  const normalizedAccessories = {};
  const usedAccessoryIds = new Set();
  for (const slot of ACCESSORY_SLOTS) {
    const accessoryId = raw.accessories[slot];
    if (accessoryId !== null && typeof accessoryId !== "string") {
      throw new TypeError(`Character accessory in ${slot} must be a string or null`);
    }
    if (accessoryId !== null && usedAccessoryIds.has(accessoryId)) {
      throw new TypeError(`Duplicate character accessory: ${accessoryId}`);
    }
    if (!ACCESSORIES_BY_SLOT[slot].includes(accessoryId)) {
      throw new TypeError(`Character accessory ${String(accessoryId)} is not allowed in ${slot}`);
    }
    if (accessoryId !== null) usedAccessoryIds.add(accessoryId);
    normalizedAccessories[slot] = accessoryId;
  }

  return deepFreeze({
    schemaVersion: 1,
    bodyShapeId: raw.bodyShapeId,
    paletteTokenId: raw.paletteTokenId,
    accessories: normalizedAccessories
  });
}

export function serializeCharacterAppearance(appearance) {
  return JSON.stringify(createCharacterAppearance(appearance));
}

export function deserializeCharacterAppearance(serialized) {
  if (typeof serialized !== "string") {
    throw new TypeError("Serialized character appearance must be a canonical JSON string");
  }

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new TypeError("Serialized character appearance must be canonical JSON");
  }
  const normalized = createCharacterAppearance(parsed);
  if (JSON.stringify(normalized) !== serialized) {
    throw new TypeError("Serialized character appearance is not canonical JSON");
  }
  return normalized;
}

export function appearanceSignature(appearance) {
  return `sound-seekers-appearance:${serializeCharacterAppearance(appearance)}`;
}
