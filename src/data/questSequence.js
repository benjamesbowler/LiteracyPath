// THE SOUND TRAIL — the scope & sequence for Sound Seekers.
//
// 40 stops, a -> tion. This one file is the spine of the whole mode: the map,
// the mini-games, the mastery targets, the review pool and the content checks
// all read from it. Everything else is code; this is content.
//
// Acts I and II deliberately follow the SAME order as the school-facing
// EL Skills Block (src/data/elSkillsBlockCycles.js), so a child playing at home
// meets sounds in the order their class teaches them. Act III is new — the app
// has no ladder past cycle 27 today.
//
// RULES ENFORCED BY tools/checkQuestIntegrity.js (npm run check:quest):
//   1. Every `word` at a stop must be decodable using ONLY the graphemes taught
//      at or before that stop. Heart words are exempt — that is what makes them
//      heart words.
//   2. Every stop must offer at least `minWords` words.
//   3. Every taught grapheme must resolve to a real audio file, or be listed in
//      NEEDS_AUDIO below. Silence is allowed; a wrong or missing clip is not.
//   4. Stop ids, names and grapheme ids are unique across the trail.
//
// KINDS
//   letter | vowel | double | digraph | split | team | r-controlled | suffix
//        -> a real grapheme. Adds to the decodable set.
//   blend  -> two already-taught letters said quickly (bl, st). Adds NOTHING to
//             the decodable set (the letters are already in it) and needs no
//             audio of its own — the shell plays the two component phonemes.
//   alt    -> a NEW pronunciation of an already-taught grapheme (y as /ie/,
//             oo as in `book`). Adds nothing to the decodable set. `base` names
//             the grapheme it re-teaches.
//   morph  -> MORPHOLOGY, not a sound: -s, -ing, -ed. A child decodes "jumping"
//             as j-u-m-p-i-ng; there is no /ing/ grapheme. Adds nothing to the
//             decodable set and needs no clip. (Getting this wrong is what made
//             the first draft segment "thing" as th|ing — a syllable, not a
//             sound, and two planks on the Stone Bridge for three phonemes.)
import { SOUND_SEEKERS_TRAIL_COUNT } from "./soundSeekersContract.js";

export const QUEST_ACTS = [
  { n: 1, id: "meadow", title: "Meadow Pals Farm", world: "meadow", blurb: "Ten playful stops around the farm." },
  { n: 2, id: "dino", title: "Dino Land: Sunny Hollow", world: "dino", blurb: "Ten rocky stops with the Dino Pals." },
  { n: 3, id: "moonwood", title: "Moonwood Tales", world: "moonwood", blurb: "Twenty enchanted stops through Moonwood." }
];

// Graphemes with no release-approved recording. The app stays SILENT for any
// entry here (never a browser voice — see docs/IMPROVEMENT_LOOPS.md rule #3),
// and the Listen button hides itself. The product-owner-approved exact-sound
// reuse decisions, including the reviewed Leda /ʊ/ and /aʊ/ cues, live in
// questAudio.js. There are currently no unresolved Sound Seekers teaching cues.
export const NEEDS_AUDIO = [];

// ── SORT DATA — the one thing that CANNOT be derived ────────────────────────
//
// Sound Sort asks a child to put words in the pen for the sound they contain.
// For most stops that is derivable: "which words have `sh` and which have `ch`"
// falls straight out of the spelling.
//
// It does NOT work for ALTERNATIVE PRONUNCIATIONS, which is exactly where the
// shell matters most. `snow` and `cow` are both spelled `ow`; `book` and `moon`
// are both `oo`. No amount of looking at the letters tells you which sound they
// make — that is the entire lesson. So those pairs are curated, by hand, here.
//
// `sortPairs` names the two pens; `sortWords` fills them.
const SORT = {
  s16: {
    sortPairs: [["y_ie", "y_ee"]],
    sortWords: {
      y_ie: ["by", "my", "try", "why", "fly", "cry", "sky"],
      y_ee: ["happy", "funny", "sunny", "muddy", "silly"]
    }
  },
  s28: {
    sortPairs: [["oo_short", "oo"]],
    sortWords: {
      oo_short: ["book", "look", "cook", "foot", "good", "wood", "hook", "took"],
      oo: ["moon", "spoon", "food", "room", "soon"]
    }
  },
  s29: {
    sortPairs: [["ow_ou", "ow"]],
    sortWords: {
      ow_ou: ["cow", "now", "brown", "down", "town", "how"],
      ow: ["snow", "grow", "slow", "show", "blow"]
    }
  },
  s37: {
    sortPairs: [["c_s", "c"], ["g_j", "g"], ["ch_k", "ch"], ["ea_e", "ea"]],
    sortWords: {
      c_s: ["city", "cell", "race", "ice"],
      c: ["cat", "can", "cup", "cot"],
      g_j: ["gem", "magic", "giant"],
      g: ["got", "gas", "gap", "bag"],
      ch_k: ["school", "echo"],
      ch: ["chip", "chop", "chin", "rich"],
      ea_e: ["bread", "head", "ready"],
      ea: ["team", "beach", "eat", "seat"]
    }
  }
};

// ── STORY PAGES — decodable, and checked ────────────────────────────────────
// Story Stones is the payoff: a real page, read for meaning, with a choice at
// the end. Every word is either decodable by that stop or a heart word already
// taught — tools/checkQuestIntegrity.js fails the build otherwise, which is the
// only thing standing between "a page" and "a page a child cannot read".
const PAGES = {
  s17: [
    // NOTE the choices are as constrained as the text — "Look" needs `oo` (stop
    // 27) and "Say" needs `ay` (stop 23). The check caught both.
    { text: "The frog sat on a big rock. It was not a rock. It was a shell!", choices: ["Run", "Jump"] },
    { text: "A crab ran out. \"Do not jump on my shell,\" said the crab.", choices: ["Stop", "Run off"] }
  ],
  s36: [
    { text: "The creature was not sure. The path was dark and the air was still.", choices: ["Go on", "Turn back"] },
    { text: "A pure white light lit the way. It was a picture of a star.", choices: ["Follow it", "Wait here"] }
  ],
  s37: [
    { text: "In the city, a giant tree grew. Its bark was hard as a shell.", choices: ["Climb it", "Rest"] },
    { text: "You read the words on the bark. They said: the last stone is near.", choices: ["Go on", "Read again"] }
  ],
  s38: [
    { text: "The birds were singing. The stars were waking up.", choices: ["Keep going", "Look up"] },
    { text: "You jumped and landed on the last step. You had walked a long way.", choices: ["Go on", "Rest"] }
  ],
  s39: [
    { text: "A little candle sat on a table. It made the room bright.", choices: ["Take it", "Leave it"] },
    { text: "You could see a simple bridge. It went over a puzzle of rocks.", choices: ["Cross it", "Go round"] }
  ],
  s40: [
    { text: "The Star Reach. Every stone you found is singing back at you.", choices: ["Listen", "Shout"] },
    { text: "You can read. That was the whole quest. Go and read it all.", choices: ["Yes!", "Again!"] }
  ]
};

const worldActForStop = index => index <= 10 ? 1 : index <= 20 ? 2 : 3;

const S = (id, _legacyAct, index, name, teach, words, heartWords, shells, extra = {}) => {
  const act = worldActForStop(index);
  return ({
  id,
  act,
  index,
  name,
  world: QUEST_ACTS[act - 1].world,
  teach,
  words,
  heartWords,
  shells,
  boss: false,
  minWords: 6,
  ...(SORT[id] || {}),
  ...(PAGES[id] ? { pages: PAGES[id] } : {}),
  ...extra
  });
};

const L = id => ({ id, kind: "letter" });
const V = id => ({ id, kind: "vowel" });
const D = id => ({ id, kind: "digraph" });
const DBL = id => ({ id, kind: "double" });
const BL = id => ({ id, kind: "blend" });
const SP = id => ({ id, kind: "split" });
const TM = id => ({ id, kind: "team" });
const RC = id => ({ id, kind: "r-controlled" });
const SUF = id => ({ id, kind: "suffix" });
const MORPH = id => ({ id, kind: "morph" });
const ALT = (id, base) => ({ id, kind: "alt", base });

// ── ACT I — SUNLIT MEADOW ────────────────────────────────────────────────────
const ACT_I = [
  S("s1", 1, 1, "Hollow Tree",
    [V("a"), L("m"), L("t"), L("s")],
    ["am", "at", "mat", "sat", "mats"],
    [],
    ["knowledge-tree", "sound-stones", "beast-feed", "stone-bridge"],
    { minWords: 4 }),

  S("s2", 1, 2, "Fern Steps",
    [L("n"), V("i"), L("f"), L("d")],
    ["in", "it", "if", "an", "sit", "fit", "fin", "tin", "man", "fan", "sad", "mad", "dad", "did"],
    [],
    ["knowledge-tree", "sound-stones", "beast-feed", "stone-bridge"]),

  S("s3", 1, 3, "Rook Stones",
    [V("o"), L("l"), L("r"), L("h")],
    ["on", "hot", "lot", "not", "rat", "hat", "ham", "him", "hid", "lid", "rim", "hit"],
    ["I", "the", "is", "a"],
    ["knowledge-tree", "sound-stones", "beast-feed", "word-beast", "stone-bridge"]),

  S("s4", 1, 4, "Otter Ford",
    [L("b"), L("w"), D("qu"), V("u")],
    // NOTE: no "up" — p isn't taught until s5. The content check caught it.
    ["us", "but", "bun", "bud", "bat", "bad", "bit", "bin", "bus", "wit", "win", "quit"],
    [],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave"]),

  S("s5", 1, 5, "Bramble Gate",
    [L("c"), L("g"), L("p"), L("y")],
    ["cat", "can", "cap", "cup", "cut", "cub", "got", "gas", "gap", "pig", "pin", "pit", "pot", "pup", "pat", "yum"],
    ["to", "and", "go", "my"],
    ["knowledge-tree", "sound-stones", "trail-run", "word-beast", "stone-bridge"]),

  S("s6", 1, 6, "Beehive Bluff",
    [L("x"), V("e"), L("v"), L("k")],
    ["box", "fox", "six", "mix", "fix", "wax", "get", "bed", "red", "leg", "pen", "ten", "net", "vet", "van", "kit", "kid"],
    [],
    ["knowledge-tree", "sound-stones", "beast-feed", "stone-bridge", "echo-cave"]),

  S("s7", 1, 7, "Lily Ferry",
    [L("j"), L("z"), DBL("ff"), DBL("ll"), DBL("ss"), DBL("zz")],
    ["jam", "jet", "job", "jug", "zip", "zap", "buzz", "fizz", "hiss", "miss", "less", "bell", "tell", "doll", "off", "puff", "huff", "fell", "kiss"],
    ["he", "she", "we", "me", "be"],
    ["knowledge-tree", "sound-stones", "trail-run", "word-beast", "echo-cave"]),

  S("s8", 1, 8, "Fishpool Reach",
    [],
    ["mat", "sit", "hot", "bun", "cup", "pig", "box", "jet", "buzz", "fell", "hat", "win", "red", "kid", "zip"],
    [],
    ["sound-stones", "trail-run", "stone-bridge", "echo-cave", "trail-signs"],
    { boss: true })
];

// ── ACT II — FOSSIL RIDGE ───────────────────────────────────────────────────
const ACT_II = [
  S("s9", 2, 9, "Wheelhouse Bend",
    [D("sh"), D("ch")],
    ["ship", "shop", "shed", "fish", "dish", "wish", "chip", "chop", "chin", "chat", "rich", "much", "such", "shell", "chess"],
    ["was", "no"],
    ["knowledge-tree", "sound-stones", "beast-feed", "word-beast", "stone-bridge"]),

  S("s10", 2, 10, "The Singing Weir",
    [D("th"), D("ng")],
    ["this", "that", "then", "them", "with", "bath", "path", "thin", "king", "ring", "sing", "long", "song", "bang", "thing"],
    ["you", "they", "her"],
    ["knowledge-tree", "sound-stones", "sound-sort", "word-beast", "stone-bridge"]),

  S("s11", 2, 11, "Amber Ridge",
    [D("nk"), D("ck"), D("wh")],
    ["sock", "rock", "lock", "duck", "back", "pick", "kick", "sick", "pink", "bank", "sink", "thank", "wink", "when", "whip", "which"],
    ["all", "are", "said"],
    ["knowledge-tree", "sound-stones", "trail-run", "word-beast", "echo-cave"]),

  S("s12", 2, 12, "Rattlebones",
    [BL("nd"), BL("st"), BL("mp"), BL("ft")],
    ["and", "hand", "land", "sand", "best", "fast", "last", "must", "jump", "lamp", "camp", "lift", "gift", "soft"],
    ["so", "have", "like"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave", "word-beast"]),

  S("s13", 2, 13, "Ash Flats",
    [BL("sp"), BL("sn"), BL("sk"), BL("sm"), BL("sw")],
    ["spin", "spot", "spun", "snap", "snip", "skip", "skin", "smell", "swim", "swing"],
    ["some", "come", "were"],
    ["knowledge-tree", "trail-run", "stone-bridge", "echo-cave", "word-beast"]),

  S("s14", 2, 14, "Fern Canyon",
    [BL("bl"), BL("cl"), BL("fl"), BL("gl"), BL("pl"), BL("sl")],
    ["black", "block", "clap", "click", "flag", "flip", "glad", "glass", "plan", "plum", "slip", "slug"],
    ["there", "little", "one"],
    ["knowledge-tree", "trail-run", "stone-bridge", "echo-cave", "word-beast"]),

  S("s15", 2, 15, "Claw Pass",
    [BL("br"), BL("cr"), BL("dr"), BL("fr"), BL("gr"), BL("pr"), BL("tr")],
    // NOTE "prop"/"press": the first draft taught the `pr` blend and then gave
    // the child not one single word containing it. Nothing could credit it, so
    // it could never be mastered. The shell-credit test caught it.
    ["brick", "bring", "crab", "crash", "drip", "drum", "frog", "from", "grab", "grin", "prop", "press", "trip", "truck", "trash"],
    ["do", "when", "out"],
    ["knowledge-tree", "trail-run", "stone-bridge", "echo-cave", "trail-signs"]),

  S("s16", 2, 16, "Gearworks Gate",
    [ALT("y_ie", "y"), ALT("y_ee", "y")],
    ["by", "my", "try", "why", "fly", "cry", "sky", "happy", "funny", "sunny", "muddy", "silly"],
    ["what"],
    ["knowledge-tree", "sound-sort", "sound-stones", "stone-bridge", "trail-signs"]),

  S("s17", 2, 17, "Ore Hopper",
    [],
    ["ship", "chop", "thing", "duck", "hand", "swim", "flag", "grin", "happy", "black", "sing", "whip"],
    [],
    ["echo-cave", "stone-bridge", "trail-run", "trail-signs", "story-stones"],
    { boss: true })
];

// ── ACT III — MOONWOOD & THE STAR REACH ─────────────────────────────────────
const ACT_III = [
  S("s18", 3, 18, "Plate Foundry",
    [SP("a_e")],
    ["cake", "make", "gate", "name", "game", "late", "tape", "snake", "whale", "plate", "shape", "flame"],
    ["oh", "their"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave", "word-beast"]),

  S("s19", 3, 19, "Night Train Yard",
    [SP("i_e")],
    ["bike", "time", "like", "ride", "side", "hide", "mile", "smile", "slide", "shine", "white", "kite"],
    ["people"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave", "word-beast"]),

  S("s20", 3, 20, "The Word Forge",
    [SP("o_e")],
    ["home", "rope", "note", "bone", "hole", "stone", "joke", "smoke", "globe", "close"],
    ["looked", "called"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "trail-run", "word-beast"]),

  S("s21", 3, 21, "Reedlight Landing",
    [SP("u_e")],
    // Pronunciation-honest: u_e here is /yoo/ (cube, mute). flute/rude/June
    // say /oo/ and taught a different sound under the same spelling lesson.
    ["cube", "tube", "cute", "huge", "mule", "mute", "use", "amuse", "fuse"],
    ["asked", "your"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave", "word-beast"]),

  S("s22", 3, 22, "Ripple Pool",
    [SP("e_e")],
    ["these", "theme", "delete", "complete", "extreme", "athlete"],
    ["water", "where"],
    ["knowledge-tree", "sound-stones", "echo-cave", "stone-bridge", "word-beast"]),

  S("s23", 3, 23, "Mica Steps",
    [TM("ai"), TM("ay")],
    ["rain", "train", "mail", "sail", "paint", "play", "day", "tray", "stay", "way", "may", "say"],
    ["who", "again"],
    ["knowledge-tree", "sound-stones", "sound-sort", "stone-bridge", "trail-run"]),

  S("s24", 3, 24, "Glint Causeway",
    [TM("ee"), TM("ea")],
    ["tree", "green", "sheep", "feet", "seed", "read", "team", "beach", "eat", "seat", "dream", "leaf"],
    ["thought", "through"],
    ["knowledge-tree", "sound-stones", "sound-sort", "stone-bridge", "echo-cave"]),

  S("s25", 3, 25, "Mirror Fen",
    [TM("igh"), TM("ie")],
    ["light", "night", "right", "high", "sight", "pie", "tie", "lie", "fight", "bright"],
    ["work", "any"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave", "trail-run"]),

  S("s26", 3, 26, "Galecliff Path",
    [TM("oa"), TM("ow"), TM("oe")],
    ["boat", "coat", "road", "goat", "toast", "snow", "grow", "slow", "show", "blow", "toe", "goes"],
    ["many", "laughed"],
    ["knowledge-tree", "sound-stones", "sound-sort", "stone-bridge", "trail-run"]),

  S("s27", 3, 27, "Shellhaven",
    [TM("oo"), TM("ue"), TM("ew")],
    ["moon", "spoon", "food", "room", "soon", "blue", "glue", "true", "new", "few", "chew", "grew"],
    ["because"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave", "word-beast"]),

  S("s28", 3, 28, "Signal Harbour",
    [ALT("oo_short", "oo")],
    ["book", "look", "cook", "foot", "good", "wood", "hook", "took"],
    ["different"],
    ["knowledge-tree", "sound-sort", "sound-stones", "stone-bridge", "trail-signs"]),

  S("s29", 3, 29, "Stormglass Cove",
    [TM("ou"), ALT("ow_ou", "ow")],
    ["out", "loud", "cloud", "mouth", "round", "sound", "cow", "now", "brown", "down", "town", "how"],
    ["eyes", "friends"],
    ["knowledge-tree", "sound-sort", "sound-stones", "stone-bridge", "trail-run"]),

  S("s30", 3, 30, "Thunder Lighthouse",
    [TM("oi"), TM("oy")],
    ["coin", "join", "oil", "soil", "point", "boy", "toy", "joy", "enjoy"],
    ["once", "please"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave", "word-beast"]),

  S("s31", 3, 31, "Mothlight Gate",
    [RC("ar")],
    ["car", "farm", "star", "park", "dark", "hard", "arm", "card", "sharp", "start"],
    ["could"],
    ["knowledge-tree", "sound-stones", "stone-bridge", "trail-run", "echo-cave"]),

  S("s32", 3, 32, "Echo Roots",
    [RC("or"), TM("aw"), RC("ore")],
    ["fork", "storm", "corn", "born", "short", "saw", "paw", "claw", "draw", "more", "store", "before"],
    ["would", "should"],
    ["knowledge-tree", "sound-stones", "sound-sort", "stone-bridge", "echo-cave"]),

  S("s33", 3, 33, "Wispwood Turn",
    [RC("er"), RC("ir"), RC("ur")],
    ["her", "fern", "term", "bird", "shirt", "girl", "third", "turn", "hurt", "burn", "curl", "surf"],
    [],
    ["knowledge-tree", "sound-stones", "sound-sort", "stone-bridge", "trail-run"]),

  S("s34", 3, 34, "Orbit Hollow",
    [TM("air"), RC("are")],
    ["chair", "hair", "fair", "pair", "stair", "care", "share", "spare", "scare", "stare"],
    [],
    ["knowledge-tree", "sound-stones", "sound-sort", "stone-bridge", "echo-cave"]),

  S("s35", 3, 35, "The Sleeping Observatory",
    [TM("ear")],
    ["hear", "near", "year", "ear", "clear", "dear", "fear"],
    [],
    ["knowledge-tree", "sound-stones", "stone-bridge", "trail-signs", "echo-cave"]),

  S("s36", 3, 36, "Comet Stair",
    [TM("ure")],
    // Pronunciation-honest: every word here says /yoor/ (or near it) - the
    // -ture words say /cher/ and "sure" starts /sh/, so three pronunciations
    // was not one lesson. secure carries the recorded word cue.
    ["pure", "cure", "secure", "endure", "obscure", "manure"],
    [],
    ["knowledge-tree", "sound-stones", "stone-bridge", "story-stones", "echo-cave"]),

  S("s37", 3, 37, "Aster Archive",
    [ALT("c_s", "c"), ALT("g_j", "g"), ALT("ch_k", "ch"), ALT("ea_e", "ea")],
    ["city", "cell", "race", "ice", "gem", "magic", "giant", "school", "echo", "bread", "head", "ready"],
    [],
    ["knowledge-tree", "sound-sort", "sound-stones", "stone-bridge", "story-stones"]),

  S("s38", 3, 38, "Dawn Causeway",
    [MORPH("suffix_s"), MORPH("suffix_ing"), MORPH("suffix_ed")],
    ["cats", "dogs", "jumping", "singing", "reading", "jumped", "landed", "wanted"],
    [],
    ["knowledge-tree", "sound-stones", "stone-bridge", "trail-signs", "story-stones"]),

  S("s39", 3, 39, "Reading Skybridge",
    [SUF("le")],
    ["little", "table", "apple", "bottle", "middle", "puzzle", "candle", "simple"],
    [],
    ["knowledge-tree", "sound-stones", "stone-bridge", "echo-cave", "story-stones"]),

  S("s40", 3, 40, "The First Reading Star",
    [SUF("tion")],
    // Pronunciation-honest: -tion says /shun/ in every word here. "question"
    // says /chun/ and taught the exception before the rule.
    ["station", "action", "fiction", "motion", "nation", "lotion"],
    [],
    ["knowledge-tree", "sound-stones", "stone-bridge", "story-stones", "trail-signs"],
    { boss: true })
];

export const QUEST_STOPS = [...ACT_I, ...ACT_II, ...ACT_III];
if (QUEST_STOPS.length !== SOUND_SEEKERS_TRAIL_COUNT) {
  throw new Error(
    `Sound Seekers contract expects ${SOUND_SEEKERS_TRAIL_COUNT} trails; found ${QUEST_STOPS.length}.`
  );
}

// A world map is a hub, never a single level. Each junction owns a full
// phonics stop and exposes several replay verbs so a weak sound can return in
// a different physical game instead of repeating an identical quiz.
export const QUEST_WORLD_HUBS = Object.freeze(QUEST_ACTS.map(act => {
  const levels = QUEST_STOPS.filter(stop => stop.act === act.n);
  return Object.freeze({
    ...act,
    levelCount: levels.length,
    stopIds: Object.freeze(levels.map(stop => stop.id)),
    levels: Object.freeze(levels.map(stop => Object.freeze({
      id: stop.id,
      index: stop.index,
      name: stop.name,
      primaryMiniGame: stop.shells[0],
      replayMiniGames: Object.freeze([...stop.shells])
    })))
  });
}));

export const QUEST_SHELL_IDS = [
  "knowledge-tree",
  "sound-stones",
  "beast-feed",
  "trail-run",
  "stone-bridge",
  "echo-cave",
  "sound-sort",
  "word-beast",
  "trail-signs",
  "story-stones"
];

export function getStop(stopId) {
  return QUEST_STOPS.find(stop => stop.id === stopId) || null;
}

export function stopsForAct(act) {
  return QUEST_STOPS.filter(stop => stop.act === act);
}

export function stopAtIndex(index) {
  return QUEST_STOPS.find(stop => stop.index === index) || null;
}

// Targets that go into the MASTERY track at a stop: every grapheme, blend and
// alternative pronunciation the stop teaches.
export function targetsAtStop(stopId) {
  return (getStop(stopId)?.teach || []).map(entry => entry.id);
}

// Graphemes that add to the DECODABLE set. Blends are two letters the child
// already has; alts are a second sound for a grapheme they already have.
// Neither unlocks a new spelling, so neither belongs here.
const NON_GRAPHEME_KINDS = new Set(["blend", "alt", "morph"]);

function decodableFrom(stop) {
  return (stop.teach || [])
    .filter(entry => !NON_GRAPHEME_KINDS.has(entry.kind))
    .map(entry => entry.id);
}

// Every grapheme a child can decode with by the END of `stopIndex` (1-based).
// This is the set the content check and the shells use to guarantee nothing
// runs ahead of the curriculum.
export function taughtThrough(stopIndex, stops = QUEST_STOPS) {
  const known = new Set();
  for (const stop of stops) {
    if (stop.index > stopIndex) continue;
    for (const g of decodableFrom(stop)) known.add(g);
  }
  return known;
}

// Every BLEND taught by the end of `stopIndex`.
//
// A blend is not a grapheme — `st` is just s and t said quickly — so it never
// enters the decodable set. But it IS a mastery target, and the evidence for it
// is a child reading or spelling a word that contains it. Stone Bridge and Echo
// Cave use this set to credit blends they see in the words they serve.
export function blendsThrough(stopIndex, stops = QUEST_STOPS) {
  const blends = new Set();
  for (const stop of stops) {
    if (stop.index > stopIndex) continue;
    for (const entry of stop.teach || []) {
      if (entry.kind === "blend") blends.add(entry.id);
    }
  }
  return blends;
}

// Every heart word taught by the end of `stopIndex`. Heart words are not
// decodable by design — they are the exception list, learnt whole.
export function heartWordsThrough(stopIndex, stops = QUEST_STOPS) {
  const words = [];
  for (const stop of stops) {
    if (stop.index > stopIndex) continue;
    for (const word of stop.heartWords || []) {
      if (!words.includes(word)) words.push(word);
    }
  }
  return words;
}

// Every word a child can read by the end of `stopIndex` — the pool the review
// shells and the Story Stones pages draw from.
export function wordsThrough(stopIndex, stops = QUEST_STOPS) {
  const words = [];
  for (const stop of stops) {
    if (stop.index > stopIndex) continue;
    for (const word of stop.words || []) {
      if (!words.includes(word)) words.push(word);
    }
  }
  return words;
}

export const TOTAL_STOPS = SOUND_SEEKERS_TRAIL_COUNT;
export const ALL_TARGETS = QUEST_STOPS.flatMap(stop => (stop.teach || []).map(entry => entry.id));
