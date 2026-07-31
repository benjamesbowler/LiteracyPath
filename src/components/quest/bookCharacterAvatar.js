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

const WEARABLES = Object.freeze({
  "leaf-cap": Object.freeze({ slot: "head", asset: "/game-assets/sound-seekers/characters/wearables/leaf-cap.webp" }),
  "acorn-hat": Object.freeze({ slot: "head", asset: "/game-assets/sound-seekers/characters/wearables/acorn-hat.webp" }),
  "moth-wings": Object.freeze({ slot: "back", asset: "/game-assets/sound-seekers/characters/wearables/moth-wings.webp" }),
  "vine-scarf": Object.freeze({ slot: "neck", asset: "/game-assets/sound-seekers/characters/wearables/vine-scarf.webp" }),
  "stone-staff": Object.freeze({ slot: "held", asset: "/game-assets/sound-seekers/characters/wearables/stone-staff.webp" })
});

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

export function bookCharacterWearables(creature = {}) {
  const equipped = creature.equipped || {};
  return ["back", "head", "neck", "held"]
    .map(slot => {
      const id = equipped[slot];
      const wearable = WEARABLES[id];
      return wearable ? { id, ...wearable } : null;
    })
    .filter(Boolean);
}

// Kept as a compatibility export for the runtime. Character colour is now
// painted artwork, never a Phaser/CSS tint.
export function bookCharacterTint() {
  return null;
}
