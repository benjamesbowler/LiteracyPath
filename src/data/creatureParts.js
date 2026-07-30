// THE CREATURE — parts manifest, anchors, dyes.
//
// The child builds their own creature before they meet a single letter. Teach
// Your Monster's own stated rationale, and they are right: it "creates an
// emotional engagement with their character". It is the motivational spine of
// the whole mode.
//
// WHY VECTOR, AND WHY THE ART LIVES IN JS:
//
//   The existing pal avatars are whole-image WebP swaps — one file per pal PER
//   OUTFIT (90 files for 6 pals). Layering was TRIED on that pipeline and
//   ABANDONED: the image model regenerates every pixel, so a diff mask covers
//   the whole canvas (see the header of tools/generate-pal-avatars.mjs). A
//   parts-based creature therefore cannot come from the image generator — it
//   must be vector.
//
//   And the vector art must be INLINE (src/data/creatureArt.js), not external
//   .svg files referenced by <use href="parts.svg#body">. External <use> content
//   sits behind a shadow boundary: CSS custom properties from the host document
//   do NOT reach it, which would kill the entire dye system. Inline paths keep
//   var(--cr-skin) working, need no network round-trip, and can be unit-tested.
//
// COMBINATORICS (v1): 6 bodies x 12 dyes x 5 patterns x 10 eyes x 8 mouths
//                     x 10 crests x 8 tails x 6 feet  =  13,824,000 creatures
//                     from ~55 hand-authored shapes.
//
// ANCHORS: every part attaches to a NAMED point on the body, in the body's own
// coordinates — never to an absolute position. That is what stops a hat floating
// off a differently-shaped head. A unit test asserts every body declares every
// anchor and every part names a real one.

export const CREATURE_VIEWBOX = { w: 200, h: 200 };

export const ANCHOR_IDS = [
  "headTop",   // crests, hats
  "eyeL",      // eyes (pair)
  "eyeR",
  "eyeC",      // eyes (single / cyclops)
  "mouthMid",
  "neck",      // scarves, collars
  "backMid",   // wings, packs
  "tailBase",
  "footL",     // feet (pair)
  "footR",
  "handR"      // held items
];

// Painted in this order, back to front.
export const CREATURE_SLOTS = [
  { id: "tail",    z: 10,  kind: "part", label: "Tail",    anchor: "tailBase", mode: "single" },
  { id: "back",    z: 20,  kind: "gear", label: "Back",    anchor: "backMid",  mode: "single" },
  { id: "body",    z: 30,  kind: "part", label: "Body",    anchor: null,       mode: "absolute", required: true },
  { id: "pattern", z: 40,  kind: "part", label: "Pattern", anchor: null,       mode: "absolute" },
  { id: "feet",    z: 50,  kind: "part", label: "Feet",    anchor: "footL",    mode: "pair" },
  { id: "mouth",   z: 60,  kind: "part", label: "Mouth",   anchor: "mouthMid", mode: "single", required: true },
  { id: "eyes",    z: 70,  kind: "part", label: "Eyes",    anchor: "eyeL",     mode: "pair",   required: true },
  { id: "crest",   z: 80,  kind: "part", label: "Crest",   anchor: "headTop",  mode: "single" },
  { id: "neck",    z: 85,  kind: "gear", label: "Neck",    anchor: "neck",     mode: "single" },
  { id: "head",    z: 90,  kind: "gear", label: "Hat",     anchor: "headTop",  mode: "single" },
  { id: "held",    z: 100, kind: "gear", label: "Held",    anchor: "handR",    mode: "single" }
];

export const PART_SLOTS = CREATURE_SLOTS.filter(s => s.kind === "part").map(s => s.id);
export const GEAR_SLOTS = CREATURE_SLOTS.filter(s => s.kind === "gear").map(s => s.id);

// ── Dyes ────────────────────────────────────────────────────────────────────
// The two colours a dye does NOT change: ink (pupils, mouths) and paper (eye
// whites, teeth). They live here, with the dye table, because this is the ONE
// file allowed to hold a literal colour — everything else paints with tokens.
export const CREATURE_INK = "#221f2e";
export const CREATURE_PAPER = "#ffffff";

// Every shape is painted with tokens, never literal colours, so one dye
// recolours the whole creature. Art direction: no rainbow, natural/fantasy
// palettes only.
export const CREATURE_DYES = [
  { id: "moss",    label: "Moss",    skin: "#6ea84f", skinDark: "#4d7d36", belly: "#cfe4b0", accent: "#f0c04a", cost: 0 },
  { id: "clay",    label: "Clay",    skin: "#d3814f", skinDark: "#a35c34", belly: "#f3d5b8", accent: "#5c8fb0", cost: 0 },
  { id: "slate",   label: "Slate",   skin: "#6b7c92", skinDark: "#4a5871", belly: "#cdd8e4", accent: "#e0a33c", cost: 20 },
  { id: "plum",    label: "Plum",    skin: "#8b5f9e", skinDark: "#624075", belly: "#dfc6ea", accent: "#7fc4a8", cost: 0 },
  { id: "sand",    label: "Sand",    skin: "#dcc07a", skinDark: "#ab9152", belly: "#f6ecd0", accent: "#7796b8", cost: 20 },
  { id: "coral",   label: "Coral",   skin: "#d96a72", skinDark: "#a64650", belly: "#f7cfd0", accent: "#6fb0a6", cost: 40 },
  { id: "teal",    label: "Teal",    skin: "#3f9c9b", skinDark: "#2b7071", belly: "#bfe6e3", accent: "#e8b04b", cost: 40 },
  { id: "ember",   label: "Ember",   skin: "#c9573a", skinDark: "#943a26", belly: "#f4c39f", accent: "#efd06a", cost: 60 },
  { id: "fern",    label: "Fern",    skin: "#4f8f6a", skinDark: "#356449", belly: "#c4e0cb", accent: "#e6c25c", cost: 60 },
  { id: "dusk",    label: "Dusk",    skin: "#5a5fa0", skinDark: "#3c4076", belly: "#c8caea", accent: "#f0b656", cost: 90 },
  { id: "bone",    label: "Bone",    skin: "#e2ddcf", skinDark: "#b3aa96", belly: "#f7f4ea", accent: "#8f7f6a", cost: 90 },
  { id: "midnight", label: "Midnight", skin: "#39406b", skinDark: "#242949", belly: "#8d95c6", accent: "#8fd3e8", cost: 140 }
];

// ── Bodies ──────────────────────────────────────────────────────────────────
// Each body carries its OWN anchor table. Everything else hangs off these.
export const CREATURE_BODIES = [
  {
    id: "tuft", label: "Muddy", series: "Meadow Pals", cost: 0, portrait: "/images/companions/muddy.webp",
    anchors: {
      headTop: [100, 32], eyeL: [80, 90], eyeR: [120, 90], eyeC: [100, 90],
      mouthMid: [100, 126], neck: [100, 66], backMid: [100, 108],
      tailBase: [160, 150], footL: [76, 174], footR: [124, 174], handR: [162, 122]
    }
  },
  {
    id: "spike", label: "Bouncy", series: "Meadow Pals", cost: 0,
    anchors: {
      headTop: [100, 24], eyeL: [80, 94], eyeR: [120, 94], eyeC: [100, 94],
      mouthMid: [100, 130], neck: [100, 70], backMid: [100, 114],
      tailBase: [156, 152], footL: [76, 174], footR: [124, 174], handR: [158, 126]
    }
  },
  {
    id: "pebble", label: "Chompy", series: "Dino Pals", cost: 20, portrait: "/images/companions/chompy.webp",
    anchors: {
      headTop: [100, 56], eyeL: [80, 104], eyeR: [120, 104], eyeC: [100, 104],
      mouthMid: [100, 138], neck: [100, 84], backMid: [100, 120],
      tailBase: [166, 154], footL: [72, 178], footR: [128, 178], handR: [168, 130]
    }
  },
  {
    id: "stalk", label: "Sunny", series: "Dino Pals", cost: 60,
    anchors: {
      headTop: [100, 26], eyeL: [84, 76], eyeR: [116, 76], eyeC: [100, 76],
      mouthMid: [100, 106], neck: [100, 60], backMid: [100, 112],
      tailBase: [142, 156], footL: [82, 176], footR: [118, 176], handR: [144, 124]
    }
  },
  {
    id: "moth", label: "Pip", series: "Moonwood Tales", cost: 90, portrait: "/images/companions/pip.webp",
    anchors: {
      headTop: [100, 34], eyeL: [80, 92], eyeR: [120, 92], eyeC: [100, 92],
      mouthMid: [100, 128], neck: [100, 68], backMid: [100, 110],
      tailBase: [168, 150], footL: [74, 176], footR: [126, 176], handR: [170, 124]
    }
  },
  {
    id: "boulder", label: "Luna", series: "Moonwood Tales", cost: 140,
    anchors: {
      headTop: [100, 42], eyeL: [78, 96], eyeR: [122, 96], eyeC: [100, 96],
      mouthMid: [100, 134], neck: [100, 76], backMid: [100, 118],
      tailBase: [168, 152], footL: [70, 178], footR: [130, 178], handR: [170, 128]
    }
  }
];

// ── Everything that hangs off an anchor ─────────────────────────────────────
export const CREATURE_PARTS = [
  // eyes (pair, mirrored across the body's centre line)
  { id: "eyes-round",  slot: "eyes",  label: "Round",  cost: 0 },
  { id: "eyes-big",    slot: "eyes",  label: "Big",    cost: 0 },
  { id: "eyes-sleepy", slot: "eyes",  label: "Sleepy", cost: 20 },
  { id: "eyes-wide",   slot: "eyes",  label: "Wide",   cost: 30 },
  { id: "eyes-tiny",   slot: "eyes",  label: "Tiny",   cost: 20 },
  { id: "eyes-fierce", slot: "eyes",  label: "Fierce", cost: 40 },
  { id: "eyes-goggle", slot: "eyes",  label: "Goggle", cost: 40 },
  { id: "eyes-stalks", slot: "eyes",  label: "Stalks", cost: 90 },
  { id: "eyes-one",    slot: "eyes",  label: "One Eye", cost: 90, mode: "single" },
  { id: "eyes-three",  slot: "eyes",  label: "Three",  cost: 140, mode: "single" },

  // mouths
  { id: "mouth-smile",  slot: "mouth", label: "Smile",  cost: 0 },
  { id: "mouth-grin",   slot: "mouth", label: "Grin",   cost: 0 },
  { id: "mouth-tusks",  slot: "mouth", label: "Tusks",  cost: 30 },
  { id: "mouth-beak",   slot: "mouth", label: "Beak",   cost: 30 },
  { id: "mouth-round",  slot: "mouth", label: "Round",  cost: 20 },
  { id: "mouth-fangs",  slot: "mouth", label: "Fangs",  cost: 40 },
  { id: "mouth-whisker", slot: "mouth", label: "Whiskers", cost: 60 },
  { id: "mouth-snout",  slot: "mouth", label: "Snout",  cost: 90 },

  // crests
  { id: "crest-none",   slot: "crest", label: "None",   cost: 0 },
  { id: "crest-horns",  slot: "crest", label: "Horns",  cost: 0 },
  { id: "crest-antenna", slot: "crest", label: "Antennae", cost: 20 },
  { id: "crest-fin",    slot: "crest", label: "Fin",    cost: 30 },
  { id: "crest-ears",   slot: "crest", label: "Ears",   cost: 30 },
  { id: "crest-spikes", slot: "crest", label: "Spikes", cost: 40 },
  { id: "crest-frond",  slot: "crest", label: "Frond",  cost: 60 },
  { id: "crest-crown",  slot: "crest", label: "Crown",  cost: 90 },
  { id: "crest-shell",  slot: "crest", label: "Shell",  cost: 90 },
  { id: "crest-flame",  slot: "crest", label: "Flame",  cost: 140 },

  // tails
  { id: "tail-none",   slot: "tail", label: "None",   cost: 0 },
  { id: "tail-curl",   slot: "tail", label: "Curl",   cost: 0 },
  { id: "tail-fan",    slot: "tail", label: "Fan",    cost: 30 },
  { id: "tail-spade",  slot: "tail", label: "Spade",  cost: 30 },
  { id: "tail-tuft",   slot: "tail", label: "Tuft",   cost: 30 },
  { id: "tail-spike",  slot: "tail", label: "Spike",  cost: 40 },
  { id: "tail-fern",   slot: "tail", label: "Fern",   cost: 60 },
  { id: "tail-moon",   slot: "tail", label: "Moon",   cost: 140 },

  // feet (pair)
  { id: "feet-paws",   slot: "feet", label: "Paws",   cost: 0 },
  { id: "feet-claws",  slot: "feet", label: "Claws",  cost: 0 },
  { id: "feet-hoofs",  slot: "feet", label: "Hoofs",  cost: 20 },
  { id: "feet-round",  slot: "feet", label: "Round",  cost: 30 },
  { id: "feet-webbed", slot: "feet", label: "Webbed", cost: 40 },
  { id: "feet-tall",   slot: "feet", label: "Tall",   cost: 90 },

  // patterns (absolute, clipped to the body silhouette)
  { id: "pattern-none",   slot: "pattern", label: "Plain",   cost: 0 },
  { id: "pattern-spots",  slot: "pattern", label: "Spots",   cost: 0 },
  { id: "pattern-stripes", slot: "pattern", label: "Stripes", cost: 30 },
  { id: "pattern-scales", slot: "pattern", label: "Scales",  cost: 40 },
  { id: "pattern-stars",  slot: "pattern", label: "Stars",   cost: 90 }
];

// ── Gear — the reward drops ─────────────────────────────────────────────────
// `unlock` is the stop that drops it. Cost 0 = it is GIVEN, not sold.
export const CREATURE_GEAR = [
  { id: "leaf-cap",   slot: "head", label: "Leaf Cap",   cost: 0, unlock: "s1" },
  { id: "acorn-hat",  slot: "head", label: "Acorn Hat",  cost: 0, unlock: "s2" },
  { id: "moth-wings", slot: "back", label: "Moth Wings", cost: 0, unlock: "s3" },
  { id: "vine-scarf", slot: "neck", label: "Vine Scarf", cost: 0, unlock: "s4" },
  { id: "stone-staff", slot: "held", label: "Stone Staff", cost: 0, unlock: "s5" }
];

export const ALL_PIECES = [
  ...CREATURE_BODIES.map(b => ({ ...b, slot: "body" })),
  ...CREATURE_PARTS,
  ...CREATURE_GEAR
];

export function piecesForSlot(slot) {
  return ALL_PIECES.filter(p => p.slot === slot);
}

export function getPiece(id) {
  return ALL_PIECES.find(p => p.id === id) || null;
}

export function getBody(id) {
  return CREATURE_BODIES.find(b => b.id === id) || CREATURE_BODIES[0];
}

export function getDye(id) {
  return CREATURE_DYES.find(d => d.id === id) || CREATURE_DYES[0];
}

// What a brand-new child starts with: every zero-cost piece. The starter set is
// intentionally broad enough to make hundreds of distinct creatures, but no
// longer gives away most of the catalogue before the first trail is walked.
export function startingPieces() {
  return ALL_PIECES.filter(p => (p.cost || 0) === 0 && !p.unlock).map(p => p.id)
    .concat(CREATURE_DYES.filter(d => (d.cost || 0) === 0).map(d => d.id));
}

export function defaultCreature() {
  return {
    body: "tuft",
    dye: "coral",
    pattern: "pattern-spots",
    eyes: "eyes-big",
    mouth: "mouth-snout",
    crest: "crest-ears",
    tail: "tail-curl",
    feet: "feet-hoofs",
    equipped: { head: null, back: null, neck: null, held: null },
    pose: "idle"
  };
}

// Stable body ids preserve every existing save while the visible choices are
// now the children from the three guided-reading worlds.
export const BOOK_CHARACTER_PRESETS = Object.freeze({
  tuft: Object.freeze({ body: "tuft", dye: "coral", eyes: "eyes-big", mouth: "mouth-snout", crest: "crest-ears", tail: "tail-curl", feet: "feet-hoofs", pattern: "pattern-spots" }),
  spike: Object.freeze({ body: "spike", dye: "sand", eyes: "eyes-big", mouth: "mouth-smile", crest: "crest-ears", tail: "tail-tuft", feet: "feet-hoofs", pattern: "pattern-none" }),
  pebble: Object.freeze({ body: "pebble", dye: "ember", eyes: "eyes-big", mouth: "mouth-grin", crest: "crest-spikes", tail: "tail-spike", feet: "feet-claws", pattern: "pattern-scales" }),
  stalk: Object.freeze({ body: "stalk", dye: "teal", eyes: "eyes-round", mouth: "mouth-smile", crest: "crest-frond", tail: "tail-spike", feet: "feet-claws", pattern: "pattern-spots" }),
  moth: Object.freeze({ body: "moth", dye: "fern", eyes: "eyes-wide", mouth: "mouth-smile", crest: "crest-ears", tail: "tail-none", feet: "feet-tall", pattern: "pattern-none" }),
  boulder: Object.freeze({ body: "boulder", dye: "dusk", eyes: "eyes-big", mouth: "mouth-beak", crest: "crest-frond", tail: "tail-fan", feet: "feet-claws", pattern: "pattern-stars" })
});

// A creature is valid if every REQUIRED slot names a piece that exists in that
// slot. Anything unknown falls back rather than crashing — a child must never
// lose their creature because we renamed a part.
export function isValidCreature(creature) {
  if (!creature || typeof creature !== "object") return false;
  if (!getBody(creature.body) || creature.body !== getBody(creature.body).id) return false;
  if (!CREATURE_DYES.some(d => d.id === creature.dye)) return false;
  for (const slot of CREATURE_SLOTS) {
    if (!slot.required || slot.id === "body") continue;
    const piece = getPiece(creature[slot.id]);
    if (!piece || piece.slot !== slot.id) return false;
  }
  return true;
}

export function normalizeCreature(creature) {
  const base = defaultCreature();
  const next = { ...base, ...(creature && typeof creature === "object" ? creature : {}) };
  next.body = getBody(next.body).id;
  next.dye = CREATURE_DYES.find(dye => dye.id === next.dye)?.id || base.dye;
  for (const slot of CREATURE_SLOTS) {
    if (slot.kind !== "part" || slot.id === "body") continue;
    const piece = getPiece(next[slot.id]);
    if (!piece || piece.slot !== slot.id) next[slot.id] = base[slot.id];
  }
  const equipped = { ...base.equipped, ...(next.equipped || {}) };
  for (const slot of GEAR_SLOTS) {
    const piece = getPiece(equipped[slot]);
    if (!piece || piece.slot !== slot) equipped[slot] = null;
  }
  next.equipped = equipped;
  return next;
}
