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

// Older saves can still contain one of the retired procedural body ids. Keep
// those saves playable, but show a real book character instead of resurrecting
// the old monster art.
const LEGACY_BODY_CHARACTER = Object.freeze({
  spike: "tuft",
  stalk: "pebble",
  boulder: "moth"
});

const LOOK_BY_BODY_AND_DYE = Object.freeze({
  tuft: Object.freeze({
    coral: "original",
    sand: "honey",
    plum: "moon",
    clay: "woodland"
  }),
  pebble: Object.freeze({
    ember: "original",
    moss: "honey",
    slate: "moon",
    coral: "woodland"
  }),
  moth: Object.freeze({
    fern: "original",
    sand: "honey",
    plum: "moon",
    teal: "woodland"
  })
});

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
