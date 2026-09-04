// Sound Seekers v3 — THE STORY TRAIL.
//
// One long world, four painted panels stitched left → right, forty stops that
// are exactly the forty stops of src/data/questSequence.js (the curriculum is
// the spine; this file is the scenery, the cast and the story around it).
//
// Map coordinates are in panel pixels (each panel is PANEL_W × PANEL_H, the
// painting's own size) and were read off the painted panels by hand. When a
// panel image is replaced, only the `map` numbers here change.
//
// Every stop has:
//   character — CAST id of the book character waiting there
//   problem   — the Meet line (one idea, ≤ 12 words, spoken and shown)
//   fix       — what the world does when the last puzzle is solved
//   token     — the story token the child collects (picture id drawn in code)
//   backdrop  — biome painting behind the platform area
//   story     — optional decodable Story Bridge line + two actions

import { QUEST_STOPS, getStop } from "../../../../data/questSequence.js";
import { SOUND_SEEKERS_V3_PALETTE } from "../../visual/visualTokens.js";

export const PANEL_W = 1168;
export const PANEL_H = 784;

const WORLD_ROOT = "/game-assets/sound-seekers/v3/world";
const BACKDROP_ROOT = "/game-assets/sound-seekers/v3/backdrops";

// Four painted panels (storybook map view, one winding path each, entering
// mid-left and leaving mid-right). Painted 4 Sep 2026 from the prompts in
// SOUND-SEEKERS-IMAGE-PROMPTS.md; stop coordinates below were read off them.
export const PANELS = Object.freeze([
  Object.freeze({ id: "meadow", land: "meadow", title: "Sunny Meadow Farm", image: `${WORLD_ROOT}/map-meadow.webp`, tint: null, flip: false, stops: ["s1", "s10"] }),
  Object.freeze({ id: "dino", land: "dino", title: "Sunny Hollow", image: `${WORLD_ROOT}/map-dino.webp`, tint: null, flip: false, stops: ["s11", "s20"] }),
  Object.freeze({ id: "moonwood-dusk", land: "moonwood", title: "Moonwood", image: `${WORLD_ROOT}/map-moonwood-dusk.webp`, tint: null, flip: false, stops: ["s21", "s30"] }),
  Object.freeze({ id: "moonwood-night", land: "moonwood", title: "Deep Moonwood", image: `${WORLD_ROOT}/map-moonwood-night.webp`, tint: null, flip: false, stops: ["s31", "s40"] })
]);

export const LANDS = Object.freeze({
  meadow: Object.freeze({ id: "meadow", title: "Sunny Meadow Farm", series: "Meadow Pals", ...SOUND_SEEKERS_V3_PALETTE.lands.meadow }),
  dino: Object.freeze({ id: "dino", title: "Sunny Hollow", series: "Dino Pals", ...SOUND_SEEKERS_V3_PALETTE.lands.dino }),
  moonwood: Object.freeze({ id: "moonwood", title: "Moonwood", series: "Moonwood Tales", ...SOUND_SEEKERS_V3_PALETTE.lands.moonwood })
});

// Side-view paintings behind the platform rooms (horizon in the lower third,
// plain ground band at the bottom that the code-drawn ground sits on). Six
// from ChatGPT, the coast and Star Reach from Grok Imagine, all 4 Sep 2026.
export const BACKDROPS = Object.freeze({
  "seedwake-meadow": `${BACKDROP_ROOT}/bg-meadow-farm.webp`,
  "river-gardens": `${BACKDROP_ROOT}/bg-meadow-pond.webp`,
  "fossil-canyon": `${BACKDROP_ROOT}/bg-dino-valley.webp`,
  "forge-settlement": `${BACKDROP_ROOT}/bg-dino-forge.webp`,
  "glass-marsh": `${BACKDROP_ROOT}/bg-moonwood-dusk.webp`,
  "storm-coast": `${BACKDROP_ROOT}/bg-moonwood-coast.webp`,
  "lantern-forest": `${BACKDROP_ROOT}/bg-moonwood-night.webp`,
  "star-reach": `${BACKDROP_ROOT}/bg-star-reach.webp`
});

// Ground / platform palette per backdrop so code-drawn ground matches the
// painting (defined once in visual/visualTokens.js).
export const GROUND_PALETTES = SOUND_SEEKERS_V3_PALETTE.ground;

const backdropForIndex = index => (
  index <= 5 ? "seedwake-meadow"
    : index <= 10 ? "river-gardens"
      : index <= 15 ? "fossil-canyon"
        : index <= 20 ? "forge-settlement"
          : index <= 25 ? "glass-marsh"
            : index <= 30 ? "storm-coast"
              : index <= 35 ? "lantern-forest"
                : "star-reach"
);

const st = (id, panel, x, y, character, problem, fix, token, extra = {}) => ({
  id, panel, map: { x, y }, character, problem, fix, token, ...extra
});

// ── The forty stops ─────────────────────────────────────────────────────────
const STOP_STORY = [
  // Sunny Meadow Farm (panel 0)
  st("s1", 0, 125, 290, "muddy",
    "My bath things fell into the Hollow Tree!",
    "The Hollow Tree gives Muddy's bath things back.", "tub"),
  st("s2", 0, 235, 338, "woolly",
    "I can't sleep. The Fern Steps are all jumbled.",
    "The Fern Steps line up and Woolly yawns.", "pillow"),
  st("s3", 0, 400, 178, "clucky",
    "My egg rolled onto the Rook Stones!",
    "The stones tilt and the egg rolls home.", "egg",
    { story: { text: "The hat is on the mat.", choices: [{ id: "hat", label: "Get the hat", icon: "mat", correct: true }, { id: "run", label: "Run off", icon: "run", correct: false }] } }),
  st("s4", 0, 500, 345, "splashy",
    "The puddle bridge at Otter Ford is broken.",
    "The bridge planks land and Splashy splashes across.", "bridge"),
  st("s5", 0, 640, 245, "bouncy",
    "I bounced right through the Bramble Gate. Oops!",
    "The Bramble Gate rebuilds and the meadow lantern lights.", "lantern",
    { boss: true, story: { text: "Bouncy can hop. Hop up to the top!", choices: [{ id: "hop", label: "Hop", icon: "hop", correct: true }, { id: "nap", label: "Nap", icon: "sleep", correct: false }] } }),
  st("s6", 0, 850, 125, "brave",
    "I want to climb to the beehive, but the ladder is gone.",
    "Ladder rungs appear and Brave climbs up.", "ladder",
    { story: { text: "Brave can get up. Go up, Brave!", choices: [{ id: "up", label: "Climb up", icon: "up", correct: true }, { id: "down", label: "Sit down", icon: "sit", correct: false }] } }),
  st("s7", 0, 790, 300, "giggly",
    "My hiccups rocked the Lily Ferry off its rope!",
    "The rope re-ties and the ferry floats home.", "ferry",
    { story: { text: "He is wet. Get a mat for him.", choices: [{ id: "mat", label: "Get a mat", icon: "mat", correct: true }, { id: "jam", label: "Get jam", icon: "jam", correct: false }] } }),
  st("s8", 0, 740, 480, "hungry",
    "I can't find my lunch anywhere.",
    "Lunch appears on the jetty and Hungry munches.", "lunch",
    { story: { text: "The bun is in the box. Get the bun.", choices: [{ id: "box", label: "Open the box", icon: "box", correct: true }, { id: "bed", label: "Go to bed", icon: "sleep", correct: false }] } }),
  st("s9", 0, 1020, 410, "cuddly",
    "The wheelhouse wheel spun right off!",
    "The wheel turns and the mill hums again.", "wheel",
    { story: { text: "Cuddly has a wish. Hug the cat!", choices: [{ id: "hug", label: "Hug", icon: "hug", correct: true }, { id: "shush", label: "Shush", icon: "shush", correct: false }] } }),
  st("s10", 0, 1030, 600, "noisy",
    "My crow is stuck and the weir won't sing.",
    "The weir sings and Noisy crows to the sky.", "note",
    { boss: true, story: { text: "Sing with them! Bang the big gong.", choices: [{ id: "sing", label: "Sing", icon: "sing", correct: true }, { id: "hide", label: "Hide", icon: "hide", correct: false }] } }),

  // Sunny Hollow (panel 1)
  st("s11", 1, 110, 250, "sunny",
    "The amber on Amber Ridge has gone dull.",
    "The amber glows warm again.", "amber",
    { story: { text: "Sunny will get the pink shell. Pick it up!", choices: [{ id: "pick", label: "Pick it up", icon: "pick", correct: true }, { id: "kick", label: "Kick it", icon: "kick", correct: false }] } }),
  st("s12", 1, 330, 430, "dino-grumpy",
    "The old bones at Rattlebones fell in a heap.",
    "The bones stand up into a grand arch.", "bones",
    { story: { text: "Grumpy has lost his hat. Hunt for it!", choices: [{ id: "hunt", label: "Hunt", icon: "look", correct: true }, { id: "rest", label: "Rest", icon: "sleep", correct: false }] } }),
  st("s13", 1, 500, 440, "wiggly",
    "The Ash Flats are too smooth to cross.",
    "Footprints appear across the ash.", "footprint",
    { story: { text: "Wiggly must skip past the wet spot.", choices: [{ id: "skip", label: "Skip past", icon: "hop", correct: true }, { id: "swim", label: "Swim in it", icon: "swim", correct: false }] } }),
  st("s14", 1, 655, 440, "zippy",
    "I ran too fast and lost my scarf in Fern Canyon!",
    "The scarf floats down from the ferns.", "scarf",
    { story: { text: "Zippy will clap and flap. Clap with him!", choices: [{ id: "clap", label: "Clap", icon: "clap", correct: true }, { id: "sob", label: "Sob", icon: "sad", correct: false }] } }),
  st("s15", 1, 760, 270, "honky",
    "Claw Pass is blocked by a big rock!",
    "The rock cracks open and the pass is clear.", "rock",
    { boss: true, story: { text: "The crab is stuck. Drag the rock and free it!", choices: [{ id: "drag", label: "Drag the rock", icon: "pull", correct: true }, { id: "grin", label: "Grin", icon: "smile", correct: false }] } }),
  st("s16", 1, 905, 430, "bossy",
    "The Gearworks Gate has a cog missing.",
    "The cog clicks in and the gate turns.", "cog",
    { story: { text: "Why is the sky so sunny? Try to fly!", choices: [{ id: "fly", label: "Fly", icon: "fly", correct: true }, { id: "cry", label: "Cry", icon: "sad", correct: false }] } }),
  st("s17", 1, 955, 560, "dozy",
    "I dozed off and the Ore Hopper tipped over.",
    "The hopper rights itself and the ore rolls in.", "ore"),
  st("s18", 1, 1045, 290, "fancy",
    "The Plate Foundry made a plate with a crack in it.",
    "A shiny new plate slides out of the foundry.", "plate",
    { story: { text: "Fancy made a cake. Take a slice!", choices: [{ id: "take", label: "Take a slice", icon: "cake", correct: true }, { id: "hide", label: "Hide it", icon: "hide", correct: false }] } }),
  st("s19", 1, 830, 640, "cheeky",
    "The night train has no light to ride by.",
    "The train lamp shines and the train rolls on.", "lamp",
    { story: { text: "It is time to ride. Hop on the bike!", choices: [{ id: "ride", label: "Ride", icon: "bike", correct: true }, { id: "hide", label: "Hide", icon: "hide", correct: false }] } }),
  st("s20", 1, 1090, 600, "dino-shy",
    "The Word Forge has gone cold.",
    "The forge glows and a golden word is cast.", "forge",
    { boss: true, story: { text: "Shy has a note. Go home and open it.", choices: [{ id: "open", label: "Open it", icon: "note", correct: true }, { id: "poke", label: "Poke it", icon: "poke", correct: false }] } }),

  // Moonwood at dusk (panel 2)
  st("s21", 2, 95, 415, "wren",
    "My broom fell in the reeds at Reedlight Landing.",
    "The reeds light up and hand back the broom.", "broom",
    { story: { text: "Wren has a tune. Use the flute!", choices: [{ id: "flute", label: "Play the flute", icon: "music", correct: true }, { id: "mute", label: "Stay mute", icon: "shush", correct: false }] } }),
  st("s22", 2, 270, 400, "burrow",
    "The Ripple Pool has stopped rippling.",
    "Rings spread across the pool again.", "ripple",
    { story: { text: "Pete can see a theme. Eve will complete it.", choices: [{ id: "complete", label: "Complete it", icon: "puzzle", correct: true }, { id: "delete", label: "Delete it", icon: "bin", correct: false }] } }),
  st("s23", 2, 445, 340, "flint",
    "The Mica Steps have lost their sparkle.",
    "The steps sparkle all the way up.", "sparkle",
    { story: { text: "Flint has a map. Wait for the rain to stop.", choices: [{ id: "wait", label: "Wait", icon: "wait", correct: true }, { id: "sail", label: "Sail", icon: "boat", correct: false }] } }),
  st("s24", 2, 470, 520, "luna",
    "The Glint Causeway is dark and I can't see to fly.",
    "The causeway glints and Luna glides across.", "glint",
    { story: { text: "Luna needs a seat. Keep her tea near.", choices: [{ id: "seat", label: "Get a seat", icon: "chair", correct: true }, { id: "leap", label: "Leap", icon: "hop", correct: false }] } }),
  st("s25", 2, 640, 405, "glimmer",
    "The Mirror Fen shows me a fright!",
    "The fen shows a bright, kind dragon.", "mirror",
    { boss: true, story: { text: "Glimmer might fly high. Tie the light on tight!", choices: [{ id: "tie", label: "Tie it", icon: "knot", correct: true }, { id: "lie", label: "Lie down", icon: "sleep", correct: false }] } }),
  st("s26", 2, 735, 290, "stone",
    "The wind on Galecliff Path blew my hat away.",
    "The wind drops the hat back on Stone's head.", "hat",
    { story: { text: "Stone will row the boat. Show him the road!", choices: [{ id: "show", label: "Show him", icon: "point", correct: true }, { id: "moan", label: "Moan", icon: "sad", correct: false }] } }),
  st("s27", 2, 850, 445, "spark",
    "My wand fell in the shells at Shellhaven!",
    "The shells open and the wand floats up.", "wand",
    { story: { text: "Spark has a new tool. Blow the blue bubbles!", choices: [{ id: "blow", label: "Blow", icon: "bubble", correct: true }, { id: "chew", label: "Chew", icon: "chew", correct: false }] } }),
  st("s28", 2, 800, 240, "wren",
    "The signal lamp at Signal Harbour won't light.",
    "The lamp lights and boats come home.", "signal",
    { story: { text: "Look at the book. It is a good book.", choices: [{ id: "look", label: "Look", icon: "book", correct: true }, { id: "hook", label: "Hook it", icon: "hook", correct: false }] } }),
  st("s29", 2, 900, 555, "burrow",
    "The Stormglass Cove is full of loud thunder.",
    "The storm blows out to sea.", "cloud",
    { story: { text: "The cow is out in the town. Round her up now!", choices: [{ id: "round", label: "Round her up", icon: "rope", correct: true }, { id: "shout", label: "Shout", icon: "shout", correct: false }] } }),
  st("s30", 2, 1070, 255, "luna",
    "The Thunder Lighthouse lens is cracked.",
    "The lens shines and the beam sweeps the sea.", "beam",
    { boss: true, story: { text: "Roy has a coin. Join him and enjoy the toys!", choices: [{ id: "join", label: "Join in", icon: "toy", correct: true }, { id: "avoid", label: "Avoid", icon: "hide", correct: false }] } }),

  // Deep Moonwood at night (panel 3, mirrored)
  st("s31", 3, 75, 455, "flint",
    "The moths at Mothlight Gate have flown away.",
    "Moths return and the gate glows.", "moth",
    { story: { text: "The star is far. Park the cart by the barn.", choices: [{ id: "park", label: "Park it", icon: "cart", correct: true }, { id: "bark", label: "Bark", icon: "shout", correct: false }] } }),
  st("s32", 3, 250, 455, "glimmer",
    "The Echo Roots only echo silence.",
    "The roots echo a happy song.", "echo",
    { story: { text: "Draw the door for the fort. Draw it more!", choices: [{ id: "draw", label: "Draw", icon: "pencil", correct: true }, { id: "snore", label: "Snore", icon: "sleep", correct: false }] } }),
  st("s33", 3, 420, 360, "stone",
    "The lights at Wispwood Turn keep blowing out.",
    "The lights glow steady all along the turn.", "wisp",
    { story: { text: "Her bird can turn and twirl. Stir the pot first!", choices: [{ id: "stir", label: "Stir", icon: "pot", correct: true }, { id: "hurt", label: "Hurt it", icon: "no", correct: false }] } }),
  st("s34", 3, 490, 520, "spark",
    "The rings of Orbit Hollow have stopped turning.",
    "The rings spin like planets.", "orbit",
    { story: { text: "Take care on the stairs. Share the chair!", choices: [{ id: "share", label: "Share", icon: "chair", correct: true }, { id: "scare", label: "Scare", icon: "no", correct: false }] } }),
  st("s35", 3, 650, 300, "luna",
    "The Sleeping Observatory can't wake up.",
    "The dome opens and the stars pour in.", "dome",
    { boss: true, story: { text: "Hear the deer near the clear pool. Come near!", choices: [{ id: "near", label: "Come near", icon: "point", correct: true }, { id: "fear", label: "Fear", icon: "hide", correct: false }] } }),
  st("s36", 3, 790, 300, "wren",
    "The Comet Stair has a step missing.",
    "The step glows back into place.", "comet"),
  st("s37", 3, 760, 520, "burrow",
    "The Aster Archive has lost its key.",
    "The key turns and the archive opens.", "key"),
  st("s38", 3, 940, 560, "flint",
    "Dawn won't come to the Dawn Causeway.",
    "Pink light spreads along the causeway.", "dawn"),
  st("s39", 3, 975, 420, "glimmer",
    "The Reading Skybridge has faded.",
    "The bridge of light shines across the sky.", "skybridge"),
  st("s40", 3, 1115, 385, "stone",
    "The First Reading Star has gone out.",
    "The star lights, and every stop sings.", "star",
    { boss: true })
];

// Join the story layer onto the curriculum so nothing can drift.
export const TRAIL = Object.freeze(STOP_STORY.map(entry => {
  const stop = getStop(entry.id);
  if (!stop) throw new Error(`Story Trail: unknown stop ${entry.id}`);
  const panel = PANELS[entry.panel];
  // map x/y are given in the panel as drawn
  return Object.freeze({
    ...entry,
    index: stop.index,
    name: stop.name,
    land: panel.land,
    world: Object.freeze({ x: entry.panel * PANEL_W + entry.map.x, y: entry.map.y }),
    backdrop: entry.backdrop || backdropForIndex(stop.index),
    boss: Boolean(entry.boss),
    teach: stop.teach,
    words: stop.words,
    heartWords: stop.heartWords || [],
    pages: stop.pages || null,
    sortPairs: stop.sortPairs || null,
    sortWords: stop.sortWords || null
  });
}));

if (TRAIL.length !== QUEST_STOPS.length) {
  throw new Error(`Story Trail has ${TRAIL.length} stops; the curriculum has ${QUEST_STOPS.length}.`);
}

export const WORLD_W = PANEL_W * PANELS.length;
export const WORLD_H = PANEL_H;

export function getTrailStop(stopId) {
  return TRAIL.find(stop => stop.id === stopId) || null;
}

export function trailIndex(stopId) {
  return TRAIL.findIndex(stop => stop.id === stopId);
}

export function nextStopId(stopId) {
  const i = trailIndex(stopId);
  return i >= 0 && i + 1 < TRAIL.length ? TRAIL[i + 1].id : null;
}

export function panelForStop(stop) {
  return PANELS[stop.panel];
}
