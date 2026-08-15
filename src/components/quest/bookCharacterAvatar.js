import { BOOK_CHARACTER_PRESETS, CREATURE_BODIES } from "../../data/creatureParts.js";

const CHARACTER_BY_BODY = Object.freeze({
  tuft: Object.freeze({
    id: "muddy",
    name: "Muddy",
    series: "Meadow Pals",
    assetRoot: "/game-assets/sound-seekers/characters/muddy"
  }),
  pebble: Object.freeze({
    id: "chompy",
    name: "Chompy",
    series: "Dino Pals",
    assetRoot: "/game-assets/sound-seekers/characters/chompy"
  }),
  moth: Object.freeze({
    id: "pip",
    name: "Pip",
    series: "Moonwood Tales",
    assetRoot: "/game-assets/sound-seekers/characters/pip"
  })
});

export const BOOK_CHARACTER_BODY_IDS = Object.freeze(Object.keys(CHARACTER_BY_BODY));

// Older saves can still contain one of the retired procedural body ids. Keep
// those saves playable, but show a real book character instead of resurrecting
// the old monster art.
const LEGACY_BODY_CHARACTER = Object.freeze({
  spike: "tuft",
  stalk: "pebble",
  boulder: "moth"
});

export const BOOK_CHARACTER_LOOKS = Object.freeze({
  tuft: Object.freeze([
    Object.freeze({ id: "coral", label: "Story pink", variant: "original" }),
    Object.freeze({ id: "sand", label: "Honey gold", variant: "honey" }),
    Object.freeze({ id: "plum", label: "Moon lavender", variant: "moon" }),
    Object.freeze({ id: "clay", label: "Woodland brown", variant: "woodland" })
  ]),
  pebble: Object.freeze([
    Object.freeze({ id: "ember", label: "Story orange", variant: "original" }),
    Object.freeze({ id: "moss", label: "Leaf green", variant: "honey" }),
    Object.freeze({ id: "slate", label: "Moon blue", variant: "moon" }),
    Object.freeze({ id: "coral", label: "Berry red", variant: "woodland" })
  ]),
  moth: Object.freeze([
    Object.freeze({ id: "fern", label: "Story green", variant: "original" }),
    Object.freeze({ id: "sand", label: "Honey gold", variant: "honey" }),
    Object.freeze({ id: "plum", label: "Moon violet", variant: "moon" }),
    Object.freeze({ id: "teal", label: "Woodland teal", variant: "woodland" })
  ])
});

const LOOK_BY_BODY_AND_DYE = Object.freeze(Object.fromEntries(
  Object.entries(BOOK_CHARACTER_LOOKS).map(([bodyId, looks]) => [
    bodyId,
    Object.freeze(Object.fromEntries(looks.map(look => [look.id, look.variant])))
  ])
));

const POSE_ASSET = Object.freeze({
  idle: "pose-ready",
  walk: "pose-walking",
  cheer: "pose-cheering",
  think: "pose-thinking"
});

const MOOD_ASSET = Object.freeze({
  happy: "mood-happy",
  excited: "mood-excited",
  thinking: "mood-thoughtful",
  brave: "mood-brave"
});

// These are complete, character-specific paintings. Accessories are never
// positioned as independent DOM/Phaser layers: a scarf must wrap behind the
// neck, a wand must be held by the hand, and wings must sit behind the body.
// The old generic overlays could not provide that occlusion and looked pasted
// on. Until the characters have a real skinned 2D rig, one curated illustrated
// outfit is the quality-preserving limit.
const OUTFIT_ASSET_BY_ID = Object.freeze({
  "leaf-cap": "outfit-leaf-cloak",
  "acorn-hat": "outfit-acorn-hat",
  "moth-wings": "outfit-moth-wings",
  "vine-scarf": "outfit-vine-scarf",
  "stone-staff": "outfit-willow-wand"
});

export const BOOK_CHARACTER_OUTFIT_IDS = Object.freeze(Object.keys(OUTFIT_ASSET_BY_ID));
export const BOOK_CHARACTER_OUTFIT_LABELS = Object.freeze({
  "leaf-cap": "Leaf cloak",
  "acorn-hat": "Acorn cap",
  "moth-wings": "Moth wings",
  "vine-scarf": "Vine scarf",
  "stone-staff": "Willow wand"
});

const OUTFIT_PRIORITY = Object.freeze(["held", "neck", "back", "head"]);

export function bookCharacterForCreature(creature = {}) {
  const bodyId = CHARACTER_BY_BODY[creature.body]
    ? creature.body
    : LEGACY_BODY_CHARACTER[creature.body] || "tuft";
  const character = CHARACTER_BY_BODY[bodyId];
  const body = CREATURE_BODIES.find(entry => entry.id === bodyId);
  const assetRoot = character.assetRoot;
  return {
    ...character,
    bodyId,
    name: body?.label || character.name,
    series: body?.series || character.series,
    originalDye: BOOK_CHARACTER_PRESETS[bodyId]?.dye || null,
    asset: `${assetRoot}/pose-ready.webp`
  };
}

export function bookCharacterMood(creature = {}) {
  if (creature.eyes === "eyes-wide" || creature.mouth === "mouth-grin") return "excited";
  if (creature.eyes === "eyes-sleepy" || creature.mouth === "mouth-round") return "thinking";
  if (creature.eyes === "eyes-fierce") return "brave";
  return "happy";
}

export function bookCharacterAsset(creature = {}, { pose } = {}) {
  const character = bookCharacterForCreature(creature);
  const outfit = bookCharacterOutfit(creature);
  if (outfit) return `${character.assetRoot}/${outfit.assetName}.webp`;

  const explicitVariant = String(creature.visualVariant || "");
  if (/^(look|mood|pose)-(original|honey|moon|woodland|happy|excited|thoughtful|brave|ready|walking|cheering|thinking)$/.test(explicitVariant)) {
    return `${character.assetRoot}/${explicitVariant}.webp`;
  }

  const selectedPose = pose || creature.pose || "idle";
  if (selectedPose !== "idle" && POSE_ASSET[selectedPose]) {
    return `${character.assetRoot}/${POSE_ASSET[selectedPose]}.webp`;
  }

  const look = LOOK_BY_BODY_AND_DYE[character.bodyId]?.[creature.dye];
  if (look && creature.dye !== character.originalDye) {
    return `${character.assetRoot}/look-${look}.webp`;
  }

  const mood = bookCharacterMood(creature);
  if (mood !== "happy") return `${character.assetRoot}/${MOOD_ASSET[mood]}.webp`;
  return `${character.assetRoot}/${POSE_ASSET.idle}.webp`;
}

export function bookCharacterOutfit(creature = {}) {
  const equipped = creature.equipped || {};
  for (const slot of OUTFIT_PRIORITY) {
    const id = equipped[slot];
    if (OUTFIT_ASSET_BY_ID[id]) return { id, slot, assetName: OUTFIT_ASSET_BY_ID[id] };
  }
  return null;
}

// Kept as a compatibility export for the runtime. Character colour is now
// painted artwork, never a Phaser/CSS tint.
export function bookCharacterTint() {
  return null;
}
