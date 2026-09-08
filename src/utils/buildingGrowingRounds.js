import { CVC_WORDS, WORD_FAMILIES } from "../data/learnGamesData.js";
import { hasKnownBadWordAudio } from "../data/knownBadWordAudio.js";
import { getChildWordAsset } from "../data/childAssets.js";

const MULTI_GRAPHEMES = [
  "igh", "tch", "air", "ear", "ure", "ai", "ay", "ee", "ea", "oa", "oo", "ow", "oi", "oy", "ou",
  "ar", "or", "er", "ir", "ur", "sh", "ch", "th", "ck", "ng", "wh", "ph", "qu"
];

// These are spelling exceptions, not a second segmentation authority. The
// grapheme remains "ea" on the tile, while this word-specific entry selects
// the reviewed short-e recording for bread/head-style words.
const WORD_SPECIFIC_PHONEME_KEYS = Object.freeze({
  bread: Object.freeze({ ea: "ea_e" })
});

const OBJECT_ACTION_DESTINATIONS = Object.freeze({
  cat: "mat", dog: "ball", hat: "peg", bat: "night sky", bed: "cozy room",
  bus: "bus stop", cup: "tray", bug: "garden", fox: "den", map: "path",
  pen: "paper", pig: "mud", fan: "paper", fig: "basket", mop: "floor",
  sun: "garden", hen: "nest", net: "ball", pot: "seed", pin: "paper",
  ship: "water trough", fish: "pond", frog: "lily pad", crab: "sand",
  tree: "meadow", star: "night sky", flag: "flagpole", sock: "foot",
  lamp: "workbench", ring: "box", chin: "scarf", shed: "garden",
  moth: "lamp", bath: "bathroom", duck: "pond", rock: "bucket",
  king: "castle", hand: "hello sign", tent: "campsite", milk: "cup",
  nest: "tree", drum: "music stand", brush: "paint pot", clock: "workbench",
  train: "track", plant: "window", shirt: "peg", bread: "plate",
  dress: "dance floor", glass: "water tray", stamp: "paper", string: "parcel",
  spring: "toy box", branch: "nest", shrimp: "pond", lunch: "basket",
  bench: "park path"
});

// The game needs spelling-bearing tiles, while the audio/evidence loop needs
// one tile per spoken sound. A doubled consonant is therefore one tile with
// two letters (dress -> d/r/e/ss), never a lossy phoneme-only split.
function authoredSpellingUnits(word) {
  const clean = String(word || "").toLowerCase();
  const wordOverrides = WORD_SPECIFIC_PHONEME_KEYS[clean] || {};
  const units = [];
  let index = 0;
  while (index < clean.length) {
    const multi = MULTI_GRAPHEMES.find(grapheme => clean.startsWith(grapheme, index));
    if (multi) {
      units.push({ grapheme: multi, phoneme: wordOverrides[multi] || multi });
      index += multi.length;
      continue;
    }
    const next = clean[index + 1];
    if (next === clean[index] && !"aeiou".includes(clean[index])) {
      const grapheme = clean.slice(index, index + 2);
      units.push({ grapheme, phoneme: wordOverrides[grapheme] || clean[index] });
      index += 2;
      continue;
    }
    units.push({ grapheme: clean[index], phoneme: clean[index] });
    index += 1;
  }
  return units;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

const OBJECT_LABELS = {
  cat: "A cat", dog: "A dog", hat: "A hat", bat: "A bat", bed: "A bed",
  bus: "A bus", cup: "A cup", bug: "A bug", fox: "A fox", map: "A map",
  pen: "A pen", pig: "A pig", fan: "A fan", fig: "A fig", mop: "A mop",
  sun: "The sun", hen: "A hen", net: "A net", pot: "A pot", pin: "A pin",
  ship: "A ship", fish: "A fish", frog: "A frog", crab: "A crab", tree: "A tree",
  star: "A star", flag: "A flag", sock: "A sock", lamp: "A lamp", ring: "A ring",
  chin: "A chin", shed: "A shed", moth: "A moth", bath: "A bath", duck: "A duck",
  rock: "A rock", king: "A king", hand: "A hand", tent: "A tent", milk: "Milk",
  nest: "A nest", drum: "A drum", brush: "A brush", clock: "A clock", train: "A train",
  plant: "A plant", shirt: "A shirt", bread: "Bread", dress: "A dress", glass: "A glass",
  stamp: "A stamp", string: "A string", spring: "A spring", branch: "A branch",
  shrimp: "A shrimp", lunch: "Lunch", bench: "A bench"
};

const OBJECT_USE_RESULTS = {
  cat: "The cat curls up on the mat.", dog: "The dog rolls the ball.", hat: "The hat lands on the peg.", bat: "The bat flies into the night.",
  bed: "The bed is ready for a cozy rest.", bus: "The bus rolls to the stop.", cup: "The cup fills with a drink.", bug: "The bug crawls into the garden.",
  fox: "The fox trots past the den.", map: "The map points to the path.", pen: "The pen draws a line.", pig: "The pig splashes in the mud.",
  fan: "The fan clears the paper!", fig: "The fig drops into the basket.", mop: "The mop swishes across the floor.", sun: "The sun warms the garden.",
  hen: "The hen settles in the nest.", net: "The net catches the ball.", pot: "The pot holds the seed.", pin: "The pin holds the paper.",
  ship: "The ship floats along the trough.", fish: "The fish splashes in the pond.", frog: "The frog hops to the pond.", crab: "The crab scuttles sideways.",
  tree: "The tree grows new leaves.", star: "The star lights the sky.", flag: "The flag waves in the breeze.", sock: "The sock slides onto the foot.",
  lamp: "The lamp lights the workbench!", ring: "The ring rolls into the box.", chin: "The chin rests on the scarf.", chop: "The chop lands on the plate.",
  shut: "The door clicks shut.", shed: "The shed door opens.", thin: "The ribbon stretches thin.", moth: "The moth flutters to the light.",
  bath: "The bath fills with bubbles.", duck: "The duck paddles across the pond.", rock: "The rock drops into the bucket.", kick: "The kick sends the ball away.",
  sing: "The song rings out.", king: "The king waves from the tower.", long: "The ribbon stretches long.", hand: "The hand waves hello.", tent: "The tent pops open.",
  milk: "The milk pours into the cup.", jump: "The frog jumps over the log.", nest: "The nest holds a chick.", fast: "The runner zooms fast.", soft: "The pillow feels soft.",
  drum: "The drum makes a beat.", grin: "The grin shines bright.", spot: "The spot marks the page.", stop: "The cart comes to a stop.", swim: "The fish swims across the pond.",
  clap: "The clap starts the music.", plan: "The plan shows the next step.", slip: "The slip slides down the chute.", snap: "The snap clicks in place.", trip: "The trip follows the map.",
  brush: "The brush sweeps the bench.", clock: "The clock starts ticking.", train: "The train rolls along the track.", plant: "The plant lifts its leaves.", shirt: "The shirt hangs on the peg.",
  bread: "The bread lands on the plate.", dress: "The dress twirls around.", glass: "The glass holds the water.", stamp: "The stamp marks the page.", crunch: "The crunch breaks the cracker.",
  splash: "The splash fills the pond.", string: "The string ties the parcel.", spring: "The spring bounces up.", branch: "The branch holds a nest.", shrimp: "The shrimp swims away.",
  thrill: "The ride gives a thrill.", stretch: "The band stretches wide.", blink: "The light begins to blink.", drink: "The cup is ready to drink.", thank: "The card says thank you.",
  munch: "The rabbit starts to munch.", lunch: "The lunch goes in the basket.", bench: "The bench is ready to sit on.", crisp: "The crisp snaps in two.", twist: "The lid twists open.",
  blend: "The colors blend together.", frost: "The frost sparkles in the light.", grump: "The grump softens into a smile.", slept: "The sleepy pup wakes up.", swift: "The swift bird flies away."
};

const BLEND_TARGETS = [
  ["-AT", "cat"],
  ["-AN", "fan"],
  ["-IG", "pig"],
  ["-OP", "mop"],
  ["-UN", "sun"],
  ["-EN", "hen"],
  ["-ET", "net"],
  ["-OT", "pot"],
  ["-UG", "bug"],
  ["-IN", "pin"]
];

const GARDEN_TRANSFORMS = [
  { sourceWord: "cat", word: "bat", flower: "sunflower", plantName: "Sunflower" },
  { sourceWord: "pig", word: "fig", flower: "fig tree", plantName: "fig tree" },
  { sourceWord: "sun", word: "bun", flower: "daisy", plantName: "Daisy" },
  { sourceWord: "map", word: "mat", flower: "berry bush", plantName: "Berry bush" },
  { sourceWord: "bug", word: "jug", flower: "bluebell", plantName: "Bluebell" },
  { sourceWord: "pen", word: "hen", flower: "rose", plantName: "Rose" },
  { sourceWord: "fox", word: "box", flower: "poppy", plantName: "Poppy" }
];

function cleanCvcPool(difficulty = "easy") {
  const tier = difficulty === "hard" ? "hard" : difficulty === "medium" ? "medium" : "easy";
  const source = CVC_WORDS[tier] || CVC_WORDS.easy;
  return [...new Set(source)].filter(word => {
    const asset = getChildWordAsset(word);
    return /^[a-z]+$/.test(word) && authoredSpellingUnits(word).length >= 3 &&
      Boolean(OBJECT_ACTION_DESTINATIONS[word]) &&
      Boolean(asset?.image || asset?.fallbackImage) && !hasKnownBadWordAudio(word);
  });
}

export function buildCvcWorkshopRounds(difficulty = "easy", count = 6) {
  const pool = cleanCvcPool(difficulty);
  return shuffle(pool).slice(0, count).map((word, roundIndex) => ({
    id: `cvc-${roundIndex}-${word}`,
    word,
    label: OBJECT_LABELS[word] || getChildWordAsset(word)?.alt || word,
    destination: OBJECT_ACTION_DESTINATIONS[word],
    useResult: OBJECT_USE_RESULTS[word] || `The ${word} is ready to use.`,
    units: authoredSpellingUnits(word).map((unit, tileIndex) => ({
      id: `${word}-${roundIndex}-${tileIndex}`,
      grapheme: unit.grapheme,
      phoneme: unit.phoneme,
      index: tileIndex
    }))
  }));
}

export function buildBlendMissions(difficulty = "easy") {
  const count = difficulty === "hard" ? 6 : difficulty === "medium" ? 5 : 4;
  return shuffle(BLEND_TARGETS).slice(0, count).map(([familyId, word], index) => {
    const familyWords = WORD_FAMILIES[familyId] || [];
    const onset = word.slice(0, word.length - (familyId.length - 1));
    return {
      id: `blend-${index}-${word}`,
      familyId,
      word,
      onset,
      rime: familyId.slice(1).toLowerCase(),
      familyWords,
      label: OBJECT_LABELS[word] || getChildWordAsset(word)?.alt || word,
      units: authoredSpellingUnits(word).map((unit, unitIndex) => ({ id: `${word}-${index}-${unitIndex}`, grapheme: unit.grapheme, phoneme: unit.phoneme, index: unitIndex }))
    };
  });
}

export const GARDEN_FLOWERS = Object.freeze(GARDEN_TRANSFORMS.map(round => round.flower));

export function buildGrowingGardenRounds() {
  const count = 5;
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  return shuffle(GARDEN_TRANSFORMS).slice(0, count).map((round, index) => {
    const decoys = shuffle([...alphabet].filter(letter => !round.word.includes(letter))).slice(0, 3);
    return {
      ...round,
      id: `garden-${index}-${round.sourceWord}-${round.word}`,
      targetLabel: OBJECT_LABELS[round.word] || `A ${round.word}`,
      changeIndex: [...round.sourceWord].findIndex((letter, letterIndex) => letter !== round.word[letterIndex]),
      bank: shuffle([...new Set([...round.word, ...decoys])])
    };
  });
}
