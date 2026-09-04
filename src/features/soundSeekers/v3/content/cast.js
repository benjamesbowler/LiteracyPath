// Sound Seekers v3 — the cast. Every character here is a character from the
// Little Literacy Guides books (canon: docs/content/STORY_BIBLE_PART_2_CANON.md §3).
// Sprites: the Meadow Pals are cut from the production cast bank
// (tools/soundSeekersV3/cut_cast.py); the Dino Pals and Moonwood casts from the
// painted line-ups of 4 Sep 2026 (tools/soundSeekersV3/cut_lineup.py). The three
// playable heroes also have a side-view walking drawing (`heroSprite`) used
// wherever the child's own character moves. `scale` is the character's height
// relative to the hero (1 = same height as the hero on screen).

const ROOT = "/game-assets/sound-seekers/v3/cast";

const c = (id, name, species, land, scale = 1, extra = {}) => Object.freeze({
  id,
  name,
  species,
  land,
  sprite: `${ROOT}/${land}/${id}.webp`,
  scale,
  ...extra,
  ...(extra.hero ? { heroSprite: `${ROOT}/${land}/${id}-hero.webp` } : {})
});

export const CAST = Object.freeze({
  // ── Meadow Pals (Sunny Meadow Farm) ───────────────────────────────────────
  muddy: c("muddy", "Muddy", "pig", "meadow", 1.05),
  woolly: c("woolly", "Woolly", "lamb", "meadow", 1.0),
  clucky: c("clucky", "Clucky", "hen", "meadow", 0.95),
  splashy: c("splashy", "Splashy", "duckling", "meadow", 0.8),
  bouncy: c("bouncy", "Bouncy", "spring-legged lamb", "meadow", 1.1),
  brave: c("brave", "Brave", "chick", "meadow", 0.75),
  giggly: c("giggly", "Giggly", "goose", "meadow", 1.0),
  hungry: c("hungry", "Hungry", "young cow", "meadow", 1.1),
  cuddly: c("cuddly", "Cuddly", "orange cat", "meadow", 0.95),
  noisy: c("noisy", "Noisy", "rooster", "meadow", 1.05),
  grumpy: c("grumpy", "Grumpy", "goat", "meadow", 1.05),
  sleepy: c("sleepy", "Sleepy", "donkey", "meadow", 1.15),
  shy: c("shy", "Shy", "mouse", "meadow", 0.8),
  tiny: c("tiny", "Tiny", "field mouse", "meadow", 0.65),
  speedy: c("speedy", "Speedy", "border collie", "meadow", 1.0, { hero: true }),

  // ── Dino Pals (Sunny Hollow) ──────────────────────────────────────────────
  chompy: c("chompy", "Chompy", "young T-rex", "dino", 1.1, { hero: true }),
  sunny: c("sunny", "Sunny", "triceratops", "dino", 1.0),
  dozy: c("dozy", "Dozy", "stegosaur", "dino", 1.0),
  "dino-grumpy": c("grumpy", "Grumpy", "ankylosaur", "dino", 0.9),
  bossy: c("bossy", "Bossy", "pterodactyl", "dino", 0.95),
  wiggly: c("wiggly", "Wiggly", "diplodocus", "dino", 1.15),
  zippy: c("zippy", "Zippy", "velociraptor", "dino", 1.0),
  honky: c("honky", "Honky", "parasaurolophus", "dino", 1.05),
  cheeky: c("cheeky", "Cheeky", "oviraptor", "dino", 1.0),
  "dino-shy": c("shy", "Shy", "long-necked dinosaur", "dino", 0.9),
  fancy: c("fancy", "Fancy", "stegosaur", "dino", 0.95),
  clumsy: c("clumsy", "Clumsy", "tall long-necked dinosaur", "dino", 1.25),
  flappy: c("flappy", "Flappy", "feathered dinosaur", "dino", 0.9),
  sneezy: c("sneezy", "Sneezy", "parasaurolophus", "dino", 1.0),
  "dino-bouncy": c("bouncy", "Bouncy", "dome-headed dinosaur on springs", "dino", 1.05),

  // ── Moonwood Tales ────────────────────────────────────────────────────────
  pip: c("pip", "Pip", "woodland boy", "moonwood", 1.0, { hero: true }),
  wren: c("wren", "Wren", "child witch", "moonwood", 1.0),
  flint: c("flint", "Flint", "explorer boy", "moonwood", 1.0),
  spark: c("spark", "Spark", "junior wizard", "moonwood", 1.0),
  burrow: c("burrow", "Burrow", "mole", "moonwood", 0.9),
  luna: c("luna", "Luna", "owl", "moonwood", 0.9),
  fern: c("fern", "Fern", "fern sprite", "moonwood", 1.1),
  glimmer: c("glimmer", "Glimmer", "young dragon", "moonwood", 1.0),
  stone: c("stone", "Stone", "stone giant", "moonwood", 1.6)
});

export const HEROES = Object.freeze([
  Object.freeze({ id: "speedy", name: "Speedy", blurb: "Fast paws, sharp ears.", land: "meadow" }),
  Object.freeze({ id: "chompy", name: "Chompy", blurb: "Big smile, bigger stomps.", land: "dino" }),
  Object.freeze({ id: "pip", name: "Pip", blurb: "Small, brave, always curious.", land: "moonwood" })
]);

export function getCharacter(id) {
  return CAST[id] || null;
}
