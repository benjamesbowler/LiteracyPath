import { BOOK_CHARACTER_PRESETS, CREATURE_BODIES } from "../../data/creatureParts.js";

const CHARACTER_BY_BODY = Object.freeze({
  tuft: Object.freeze({
    id: "muddy",
    name: "Muddy",
    series: "Meadow Pals",
    asset: "/game-assets/sound-seekers/avatars-v3/muddy.webp"
  }),
  pebble: Object.freeze({
    id: "chompy",
    name: "Chompy",
    series: "Dino Pals",
    asset: "/game-assets/sound-seekers/avatars-v3/chompy.webp"
  }),
  moth: Object.freeze({
    id: "pip",
    name: "Pip",
    series: "Moonwood Tales",
    asset: "/game-assets/sound-seekers/avatars-v3/pip.webp"
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

const DYE_TINTS = Object.freeze({
  moss: "91c96f",
  slate: "83a6b9",
  plum: "b485ce",
  sand: "d9bd7a",
  coral: "f28b77",
  teal: "61c4b8",
  ember: "d9654d",
  fern: "72a85e",
  dusk: "7677aa",
  bone: "d8d3c4",
  midnight: "59627f"
});

export function bookCharacterForCreature(creature = {}) {
  const bodyId = CHARACTER_BY_BODY[creature.body]
    ? creature.body
    : LEGACY_BODY_CHARACTER[creature.body] || "tuft";
  const character = CHARACTER_BY_BODY[bodyId];
  const body = CREATURE_BODIES.find(entry => entry.id === bodyId);
  return {
    ...character,
    bodyId,
    name: body?.label || character.name,
    series: body?.series || character.series,
    originalDye: BOOK_CHARACTER_PRESETS[bodyId]?.dye || null
  };
}

export function bookCharacterTint(creature = {}) {
  const character = bookCharacterForCreature(creature);
  if (!creature.dye || creature.dye === character.originalDye) return null;
  const tint = DYE_TINTS[creature.dye];
  return tint ? Number.parseInt(tint, 16) : null;
}
