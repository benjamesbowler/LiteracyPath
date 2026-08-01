const ROOT = "/game-assets/quest-pixel";
const SEEDWAKE_PREMIUM_ROOT = `${ROOT}/seedwake/characters-premium`;
const RIVER_PREMIUM_ROOT = `${ROOT}/river-gardens/characters-premium`;
const FOSSIL_PREMIUM_ROOT = `${ROOT}/fossil-canyon/characters-premium`;
const FORGE_PREMIUM_ROOT = `${ROOT}/forge-settlement/characters-premium`;
const GLASS_PREMIUM_ROOT = `${ROOT}/glass-marsh/characters-premium`;
const STORM_PREMIUM_ROOT = `${ROOT}/storm-coast/characters-premium`;
const LANTERN_PREMIUM_ROOT = `${ROOT}/lantern-forest/characters-premium`;
const STAR_PREMIUM_ROOT = `${ROOT}/star-reach/characters-premium`;

const QUEST_PIXEL_PREMIUM_RESIDENTS = Object.freeze(new Set([
  "seedwake-mask-frog",
  "seedwake-green-pig",
  "seedwake-shaman-lion",
  "seedwake-egg-boy",
  "river-nori",
  "river-fizz",
  "river-quill",
  "river-rill",
  "fossil-fen",
  "fossil-rook",
  "fossil-amber",
  "fossil-claw",
  "forge-cinder",
  "forge-bolt",
  "forge-soot",
  "forge-bellows",
  "glass-vale",
  "glass-ripple",
  "glass-mica",
  "glass-glint",
  "storm-skiff",
  "storm-kelp",
  "storm-boom",
  "storm-prism",
  "lantern-echo",
  "lantern-luma",
  "lantern-wisp",
  "lantern-orbit",
  "star-nova",
  "star-comet",
  "star-aster",
  "star-dawn"
]));

export const QUEST_PIXEL_RESIDENT_PATHS = Object.freeze({
  "seedwake-mask-frog": `${SEEDWAKE_PREMIUM_ROOT}/moss/walk.png`,
  "seedwake-spirit": `${ROOT}/seedwake/characters/spirit/walk.png`,
  "seedwake-green-pig": `${SEEDWAKE_PREMIUM_ROOT}/tumble/walk.png`,
  "seedwake-shaman-lion": `${SEEDWAKE_PREMIUM_ROOT}/bramble/walk.png`,
  "seedwake-egg-boy": `${SEEDWAKE_PREMIUM_ROOT}/pip/walk.png`,
  "seedwake-ninja-blue": `${ROOT}/seedwake/characters/ninja-blue/walk.png`,
  "seedwake-samurai-blue": `${ROOT}/seedwake/characters/samurai-blue/walk.png`,
  "seedwake-samurai-green": `${ROOT}/seedwake/characters/samurai-green/walk.png`,
  "river-nori": `${RIVER_PREMIUM_ROOT}/nori/walk.png`,
  "river-fizz": `${RIVER_PREMIUM_ROOT}/fizz/walk.png`,
  "river-quill": `${RIVER_PREMIUM_ROOT}/quill/walk.png`,
  "river-rill": `${RIVER_PREMIUM_ROOT}/rill/walk.png`,
  "fossil-fen": `${FOSSIL_PREMIUM_ROOT}/fen/walk.png`,
  "fossil-rook": `${FOSSIL_PREMIUM_ROOT}/rook/walk.png`,
  "fossil-amber": `${FOSSIL_PREMIUM_ROOT}/amber/walk.png`,
  "fossil-claw": `${FOSSIL_PREMIUM_ROOT}/claw/walk.png`,
  "forge-cinder": `${FORGE_PREMIUM_ROOT}/cinder/walk.png`,
  "forge-bolt": `${FORGE_PREMIUM_ROOT}/bolt/walk.png`,
  "forge-soot": `${FORGE_PREMIUM_ROOT}/soot/walk.png`,
  "forge-bellows": `${FORGE_PREMIUM_ROOT}/bellows/walk.png`,
  "glass-vale": `${GLASS_PREMIUM_ROOT}/vale/walk.png`,
  "glass-ripple": `${GLASS_PREMIUM_ROOT}/ripple/walk.png`,
  "glass-mica": `${GLASS_PREMIUM_ROOT}/mica/walk.png`,
  "glass-glint": `${GLASS_PREMIUM_ROOT}/glint/walk.png`,
  "storm-skiff": `${STORM_PREMIUM_ROOT}/skiff/walk.png`,
  "storm-kelp": `${STORM_PREMIUM_ROOT}/kelp/walk.png`,
  "storm-boom": `${STORM_PREMIUM_ROOT}/boom/walk.png`,
  "storm-prism": `${STORM_PREMIUM_ROOT}/prism/walk.png`,
  "lantern-echo": `${LANTERN_PREMIUM_ROOT}/echo/walk.png`,
  "lantern-luma": `${LANTERN_PREMIUM_ROOT}/luma/walk.png`,
  "lantern-wisp": `${LANTERN_PREMIUM_ROOT}/wisp/walk.png`,
  "lantern-orbit": `${LANTERN_PREMIUM_ROOT}/orbit/walk.png`,
  "star-nova": `${STAR_PREMIUM_ROOT}/nova/walk.png`,
  "star-comet": `${STAR_PREMIUM_ROOT}/comet/walk.png`,
  "star-aster": `${STAR_PREMIUM_ROOT}/aster/walk.png`,
  "star-dawn": `${STAR_PREMIUM_ROOT}/dawn/walk.png`,
  "dino-cave-lion": `${ROOT}/dino/characters/cave-lion/walk.png`,
  "dino-cavegirl": `${ROOT}/dino/characters/cavegirl/walk.png`,
  "dino-caveman": `${ROOT}/dino/characters/caveman/walk.png`,
  "dino-cave-lion-2": `${ROOT}/dino/characters/cave-lion-2/walk.png`,
  "dino-cavegirl-2": `${ROOT}/dino/characters/cavegirl-2/walk.png`,
  "dino-caveman-2": `${ROOT}/dino/characters/caveman-2/walk.png`,
  "moonwood-sorcerer": `${ROOT}/moonwood/characters/sorcerer/walk.png`,
  "moonwood-vampire": `${ROOT}/moonwood/characters/vampire/walk.png`,
  "moonwood-robot": `${ROOT}/moonwood/characters/robot/walk.png`,
  "moonwood-sorcerer-orange": `${ROOT}/moonwood/characters/sorcerer-orange/walk.png`,
  "moonwood-robot-green": `${ROOT}/moonwood/characters/robot-green/walk.png`,
  "moonwood-skeleton": `${ROOT}/moonwood/characters/skeleton/walk.png`
});

export const QUEST_PIXEL_RESIDENT_IDLE_PATHS = Object.freeze({
  "seedwake-mask-frog": `${SEEDWAKE_PREMIUM_ROOT}/moss/idle.png`,
  "seedwake-spirit": `${ROOT}/seedwake/characters/spirit/idle.png`,
  "seedwake-green-pig": `${SEEDWAKE_PREMIUM_ROOT}/tumble/idle.png`,
  "seedwake-shaman-lion": `${SEEDWAKE_PREMIUM_ROOT}/bramble/idle.png`,
  "seedwake-egg-boy": `${SEEDWAKE_PREMIUM_ROOT}/pip/idle.png`,
  "seedwake-ninja-blue": `${ROOT}/seedwake/characters/ninja-blue/idle.png`,
  "seedwake-samurai-blue": `${ROOT}/seedwake/characters/samurai-blue/idle.png`,
  "seedwake-samurai-green": `${ROOT}/seedwake/characters/samurai-green/idle.png`,
  "river-nori": `${RIVER_PREMIUM_ROOT}/nori/idle.png`,
  "river-fizz": `${RIVER_PREMIUM_ROOT}/fizz/idle.png`,
  "river-quill": `${RIVER_PREMIUM_ROOT}/quill/idle.png`,
  "river-rill": `${RIVER_PREMIUM_ROOT}/rill/idle.png`,
  "fossil-fen": `${FOSSIL_PREMIUM_ROOT}/fen/idle.png`,
  "fossil-rook": `${FOSSIL_PREMIUM_ROOT}/rook/idle.png`,
  "fossil-amber": `${FOSSIL_PREMIUM_ROOT}/amber/idle.png`,
  "fossil-claw": `${FOSSIL_PREMIUM_ROOT}/claw/idle.png`,
  "forge-cinder": `${FORGE_PREMIUM_ROOT}/cinder/idle.png`,
  "forge-bolt": `${FORGE_PREMIUM_ROOT}/bolt/idle.png`,
  "forge-soot": `${FORGE_PREMIUM_ROOT}/soot/idle.png`,
  "forge-bellows": `${FORGE_PREMIUM_ROOT}/bellows/idle.png`,
  "glass-vale": `${GLASS_PREMIUM_ROOT}/vale/idle.png`,
  "glass-ripple": `${GLASS_PREMIUM_ROOT}/ripple/idle.png`,
  "glass-mica": `${GLASS_PREMIUM_ROOT}/mica/idle.png`,
  "glass-glint": `${GLASS_PREMIUM_ROOT}/glint/idle.png`,
  "storm-skiff": `${STORM_PREMIUM_ROOT}/skiff/idle.png`,
  "storm-kelp": `${STORM_PREMIUM_ROOT}/kelp/idle.png`,
  "storm-boom": `${STORM_PREMIUM_ROOT}/boom/idle.png`,
  "storm-prism": `${STORM_PREMIUM_ROOT}/prism/idle.png`,
  "lantern-echo": `${LANTERN_PREMIUM_ROOT}/echo/idle.png`,
  "lantern-luma": `${LANTERN_PREMIUM_ROOT}/luma/idle.png`,
  "lantern-wisp": `${LANTERN_PREMIUM_ROOT}/wisp/idle.png`,
  "lantern-orbit": `${LANTERN_PREMIUM_ROOT}/orbit/idle.png`,
  "star-nova": `${STAR_PREMIUM_ROOT}/nova/idle.png`,
  "star-comet": `${STAR_PREMIUM_ROOT}/comet/idle.png`,
  "star-aster": `${STAR_PREMIUM_ROOT}/aster/idle.png`,
  "star-dawn": `${STAR_PREMIUM_ROOT}/dawn/idle.png`,
  "dino-cave-lion": `${ROOT}/dino/characters/cave-lion/idle.png`,
  "dino-cavegirl": `${ROOT}/dino/characters/cavegirl/idle.png`,
  "dino-caveman": `${ROOT}/dino/characters/caveman/idle.png`,
  "dino-cave-lion-2": `${ROOT}/dino/characters/cave-lion-2/idle.png`,
  "dino-cavegirl-2": `${ROOT}/dino/characters/cavegirl-2/idle.png`,
  "dino-caveman-2": `${ROOT}/dino/characters/caveman-2/idle.png`,
  "moonwood-sorcerer": `${ROOT}/moonwood/characters/sorcerer/idle.png`,
  "moonwood-vampire": `${ROOT}/moonwood/characters/vampire/idle.png`,
  "moonwood-robot": `${ROOT}/moonwood/characters/robot/idle.png`,
  "moonwood-sorcerer-orange": `${ROOT}/moonwood/characters/sorcerer-orange/idle.png`,
  "moonwood-robot-green": `${ROOT}/moonwood/characters/robot-green/idle.png`,
  "moonwood-skeleton": `${ROOT}/moonwood/characters/skeleton/idle.png`
});

function residentVariantPaths(filename) {
  return Object.freeze(Object.fromEntries(
    Object.entries(QUEST_PIXEL_RESIDENT_PATHS).map(([key, residentPath]) => [
      key,
      residentPath.replace(/\/walk\.png$/, `/${filename}`)
    ])
  ));
}

export const QUEST_PIXEL_RESIDENT_ITEM_PATHS = residentVariantPaths("item.png");
export const QUEST_PIXEL_RESIDENT_JUMP_PATHS = residentVariantPaths("jump.png");

export function questPixelResidentFrameSize(key) {
  return QUEST_PIXEL_PREMIUM_RESIDENTS.has(key) ? 64 : 16;
}

export function questPixelResidentWorldScale(key, emphasis = 1) {
  const scale = QUEST_PIXEL_PREMIUM_RESIDENTS.has(key)
    ? key.startsWith("glass-") ? 0.94 : key.startsWith("storm-") ? 0.9 : key.startsWith("lantern-") || key.startsWith("star-") ? 0.88 : 0.86
    : 1.62;
  return scale * Math.max(0.1, Number(emphasis) || 1);
}

export const QUEST_PIXEL_CHAPTER_CASTS = Object.freeze({
  "seedwake-meadow": Object.freeze([
    "seedwake-mask-frog", "seedwake-spirit", "seedwake-green-pig", "seedwake-shaman-lion", "seedwake-egg-boy"
  ]),
  "river-gardens": Object.freeze([
    "river-nori", "river-fizz", "river-quill", "river-rill"
  ]),
  "fossil-canyon": Object.freeze([
    "fossil-fen", "fossil-rook", "fossil-amber", "fossil-claw"
  ]),
  "forge-settlement": Object.freeze([
    "forge-cinder", "forge-bolt", "forge-soot", "forge-bellows"
  ]),
  "glass-marsh": Object.freeze([
    "glass-vale", "glass-ripple", "glass-mica", "glass-glint"
  ]),
  "storm-coast": Object.freeze([
    "storm-skiff", "storm-kelp", "storm-boom", "storm-prism"
  ]),
  "lantern-forest": Object.freeze([
    "lantern-echo", "lantern-luma", "lantern-wisp", "lantern-orbit"
  ]),
  "star-reach": Object.freeze([
    "star-nova", "star-comet", "star-aster", "star-dawn"
  ])
});

// A resident's name is part of the child's story memory. Keep that identity
// stable across encounters, discoveries, accessible play and ceremonies.
export const QUEST_PIXEL_NAMED_CASTS = Object.freeze({
  "seedwake-meadow": Object.freeze({
    Bouncy: "seedwake-egg-boy",
    Moss: "seedwake-mask-frog",
    Tumble: "seedwake-green-pig",
    Bramble: "seedwake-shaman-lion"
  }),
  "river-gardens": Object.freeze({
    Nori: "river-nori",
    Fizz: "river-fizz",
    Quill: "river-quill",
    Rill: "river-rill"
  }),
  "fossil-canyon": Object.freeze({
    Fen: "fossil-fen",
    Rook: "fossil-rook",
    Amber: "fossil-amber",
    Claw: "fossil-claw"
  }),
  "forge-settlement": Object.freeze({
    Cinder: "forge-cinder",
    Bolt: "forge-bolt",
    Soot: "forge-soot",
    Bellows: "forge-bellows"
  }),
  "glass-marsh": Object.freeze({
    Vale: "glass-vale",
    Ripple: "glass-ripple",
    Mica: "glass-mica",
    Glint: "glass-glint"
  }),
  "storm-coast": Object.freeze({
    Skiff: "storm-skiff",
    Kelp: "storm-kelp",
    Boom: "storm-boom",
    Prism: "storm-prism"
  }),
  "lantern-forest": Object.freeze({
    Echo: "lantern-echo",
    Luma: "lantern-luma",
    Wisp: "lantern-wisp",
    Orbit: "lantern-orbit"
  }),
  "star-reach": Object.freeze({
    Nova: "star-nova",
    Comet: "star-comet",
    Aster: "star-aster",
    Dawn: "star-dawn"
  })
});

function normalizedResidentName(name) {
  return String(name || "").trim().toLocaleLowerCase("en");
}

export function questPixelChapterCast(chapterId, world = "meadow") {
  if (QUEST_PIXEL_CHAPTER_CASTS[chapterId]) return QUEST_PIXEL_CHAPTER_CASTS[chapterId];
  if (world === "dino") return QUEST_PIXEL_CHAPTER_CASTS["fossil-canyon"];
  if (world === "moonwood") return QUEST_PIXEL_CHAPTER_CASTS["glass-marsh"];
  return QUEST_PIXEL_CHAPTER_CASTS["seedwake-meadow"];
}

export function questPixelResidentKey(chapterId, name, world = "meadow") {
  const namedCast = QUEST_PIXEL_NAMED_CASTS[chapterId];
  const requestedName = normalizedResidentName(name);
  const match = namedCast && Object.entries(namedCast).find(
    ([castName]) => normalizedResidentName(castName) === requestedName
  );
  return match?.[1] || questPixelChapterCast(chapterId, world)[0];
}

export function questPixelNamedChapterCast(chapterId, world = "meadow") {
  const namedCast = QUEST_PIXEL_NAMED_CASTS[chapterId];
  return namedCast
    ? Object.freeze(Object.values(namedCast))
    : questPixelCeremonyCast(chapterId, world);
}

export function questPixelMemoryResidentKey(chapterId, stopId, world = "meadow") {
  const namedCast = questPixelNamedChapterCast(chapterId, world);
  const residents = namedCast.slice(1);
  if (!residents.length) return namedCast[0] || questPixelChapterCast(chapterId, world)[0];
  const stopNumber = Math.max(1, Number.parseInt(String(stopId || "").replace(/^s/, ""), 10) || 1);
  const chapterStopIndex = (stopNumber - 1) % 5;
  return residents[chapterStopIndex % residents.length];
}

export function questPixelCeremonyCast(chapterId, world = "meadow", limit = 4, preferred = []) {
  const maximum = Math.max(1, Math.floor(Number(limit) || 4));
  const chapterCast = questPixelChapterCast(chapterId, world);
  const allowed = new Set(chapterCast);
  const present = Array.isArray(preferred) ? preferred.filter(key => allowed.has(key)) : [];
  return Object.freeze([...new Set([...present, ...chapterCast])].slice(0, maximum));
}

export function questPixelResidentPath(key) {
  return QUEST_PIXEL_RESIDENT_PATHS[key] || QUEST_PIXEL_RESIDENT_PATHS["seedwake-spirit"];
}

export function questPixelResidentIdlePath(key) {
  return QUEST_PIXEL_RESIDENT_IDLE_PATHS[key] || null;
}

export function questPixelResidentItemPath(key) {
  return QUEST_PIXEL_RESIDENT_ITEM_PATHS[key] || null;
}

export function questPixelResidentJumpPath(key) {
  return QUEST_PIXEL_RESIDENT_JUMP_PATHS[key] || null;
}
