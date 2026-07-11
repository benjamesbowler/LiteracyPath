// THE WORLD PALETTES — the only file allowed to hold a literal colour for the
// world (creatureParts.js is the equivalent for the creature).
//
// Every 2.5D band, the road, and the markers are painted from these. That is why
// a new land costs a palette and not an art order: the hills, the road and the
// horizon are all procedural SVG, generated from six colours.
//
// tools/checkQuestIntegrity.js FAILS the build if a hex colour appears in any
// other quest file. That rule is not pedantry — a literal colour in a component
// is a colour that cannot be re-themed, and it is how a world ends up half
// Meadow and half Moonwood.

export const QUEST_WORLDS = {
  meadow: {
    skyTop: "#bfe8f4",
    skyBottom: "#e8f6e2",
    far: "#9fc98a",
    mid: "#6ea84f",
    near: "#3f6f33",
    accent: "#f0c04a",
    deep: "#2c4d24",
    road: "#f4e7c9"
  },
  dino: {
    skyTop: "#f6d9a8",
    skyBottom: "#f0e5cf",
    far: "#d3a86f",
    mid: "#b57c47",
    near: "#7d4f2b",
    accent: "#e0762f",
    deep: "#54321a",
    road: "#f7ecd6"
  },
  moonwood: {
    skyTop: "#2b2c58",
    skyBottom: "#4a3f78",
    far: "#4b4a86",
    mid: "#3a3768",
    near: "#232145",
    accent: "#8fd3e8",
    deep: "#14122c",
    road: "#cfd6f2"
  }
};

export function worldPalette(worldId) {
  return QUEST_WORLDS[worldId] || QUEST_WORLDS.meadow;
}

// The signpost colours a child has to READ ("Tap the red rock"). They are not
// world colours and they are not dye colours — they mean the word. They live
// here because this is one of the two files allowed to hold a literal colour.
export const SIGN_COLOURS = {
  red: "#d9534f",
  green: "#5aa469",
  black: "#3a3a44"
};

// A highlight that is just light. Not a dye.
export const HIGHLIGHT = "#ffffff";

// The materials the world is built of. Wood is wood in every land — a plank that
// changed colour with the palette would stop reading as a plank.
export const MATERIALS = {
  wood: "#d2a36a",
  woodDark: "#7a5528",
  woodPale: "#e8cfa4",
  stone: "#8e879f",
  stoneDark: "#6b6479",
  rope: "#a97a44",
  dull: "#8a7a63",
  good: "#3f8b52"
};
