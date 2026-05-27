import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getApprovedAudioPath, getAudioPreference, getAudioPreferenceForPath } from "../src/data/audioPreferenceManifest.js";
import { childWordAssets } from "../src/data/childAssets.js";
import { loadCoreQuestionPool, selectableRuntimeQuestionsForSkill } from "./phonicsRuntimeUtils.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "public");
const docsDir = path.join(rootDir, "docs", "assets");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".aac"]);
const ABSTRACT_HFW = new Set([
  "the", "of", "and", "to", "in", "was", "because", "should", "could", "would", "however",
  "a", "an", "is", "it", "as", "be", "been", "but", "by", "do", "did", "for", "from",
  "had", "has", "have", "he", "her", "his", "if", "into", "just", "me", "more", "my",
  "not", "of", "or", "other", "over", "she", "so", "than", "that", "their", "them",
  "then", "there", "they", "this", "very", "we", "were", "which", "who", "will", "with",
  "you", "your"
]);
const NON_VOCAB_PATH_PARTS = [
  "/guided-reading/",
  "/ui/",
  "/rumble/",
  "/echo-caves/",
  "/covers/",
  "/pages/",
  "/phrases/",
  "/phonemes/",
  "/_replaced/",
  "/_rejected/",
  "/_deleted/",
  "/admin/",
  "/icons/"
];
const BAD_VISUAL_HINTS = [
  "sparkle", "sparkles", "glow", "burst", "magic", "magical", "rainbow", "particle",
  "particles", "badge", "reward", "button", "panel", "background", "logo", "mascot",
  "character", "rumble", "cave", "crystal"
];
const WRONG_OBJECT_NOTES = new Map([
  ["submarine", "Reject for word sub: image/audio target is submarine, not the sandwich word sub."],
  ["laboratory", "Reject for word lab: image/audio target is laboratory, not a simple lab scene."],
  ["thumb", "Reject for Final Sounds /b/: thumb ends with spoken /m/, not /b/."],
  ["zip", "Audio is blocked by the approved-audio manifest after live review."]
]);

const finalSoundsBGapWords = [
  "cub", "cab", "bib", "rub", "knob", "lab", "sub", "crib", "grab", "club", "blob",
  "cob", "dab", "tube", "cube", "robe", "bulb", "curb", "orb"
];

const expansionSeeds = {
  "Final Sounds coverage reserve": [
    "cub", "cab", "bib", "rub", "knob", "lab", "sub", "crib", "grab", "club", "blob", "cob", "dab", "tube", "cube", "robe", "bulb", "curb", "orb",
    "leaf", "loaf", "calf", "puff", "cliff", "cuff", "hoof", "roof", "beef", "chef", "muffin", "scarf",
    "dish", "brush", "trash", "cash", "fish", "shell", "bell", "hill", "doll", "tail", "pail", "seal",
    "sock", "rock", "duck", "lock", "neck", "back", "truck", "clock", "ring", "king", "wing", "swing",
    "hand", "sand", "pond", "tent", "plant", "lamp", "stamp", "desk", "mask", "fork", "park", "shark"
  ],
  "Initial Sounds reserve": [
    "alligator", "anchor", "apron", "basket", "beaver", "button", "camera", "candle", "carrot", "daisy",
    "dolphin", "dragonfly", "eagle", "ear", "elbow", "feather", "fence", "firefly", "giraffe", "glove",
    "grapes", "hammer", "helmet", "igloo", "island", "jacket", "jellyfish", "kangaroo", "kettle", "ladder",
    "lantern", "lemon", "mitten", "nest", "otter", "panda", "pumpkin", "rabbit", "robot", "sailboat",
    "turtle", "violin", "wagon", "xylophone", "yogurt", "zucchini"
  ],
  "CVC short vowels": [
    "cab", "dab", "tab", "rag", "wag", "yam", "van", "wax", "yak", "lap", "tap", "sap", "den", "gem",
    "peg", "pet", "vet", "web", "yen", "bib", "dip", "fig", "hip", "kit", "lid", "lip", "rib", "wig",
    "zip", "cob", "hop", "job", "rod", "sob", "log", "box", "fox", "hut", "jug", "rug", "sub", "tug"
  ],
  "Rhyming/rime families": [
    "bag", "tag", "rag", "wag", "sad", "mad", "dad", "pad", "leg", "peg", "egg", "lip", "sip", "dip",
    "ship", "chip", "clip", "grip", "fan", "can", "van", "man", "pan", "cap", "map", "tap", "lap",
    "hen", "pen", "den", "ten", "jet", "net", "pet", "vet", "bug", "rug", "mug", "jug", "bun", "sun",
    "run", "fun", "cup", "pup", "tub", "cub", "duck", "truck", "clock", "sock"
  ],
  "Blends/digraphs": [
    "flag", "flame", "flower", "frog", "fruit", "glass", "globe", "glove", "grapes", "grass", "green",
    "plane", "plant", "plate", "plug", "sled", "slide", "sloth", "smile", "snake", "snow", "spoon",
    "star", "stool", "train", "tree", "truck", "chair", "cheese", "cherry", "chick", "shell", "shoe",
    "shop", "shark", "whale", "wheel", "whisk", "thumb", "thimble", "three"
  ],
  "Long vowels/silent-e": [
    "cake", "cane", "cape", "gate", "grape", "lake", "plane", "skate", "snake", "tape", "bike", "dime",
    "fire", "kite", "lime", "pine", "slide", "smile", "cube", "mule", "tube", "robe", "bone", "cone",
    "hose", "nose", "rose", "rope"
  ],
  "Vowel teams": [
    "boat", "coat", "goat", "soap", "road", "toad", "rain", "chain", "paint", "snail", "train", "beach",
    "leaf", "seat", "team", "bee", "feet", "seed", "tree", "pie", "tie", "field", "shield", "moon",
    "spoon", "boot", "book", "hook", "cloud", "house", "mouse", "coin", "soil"
  ],
  "R-controlled vowels": [
    "barn", "car", "card", "cart", "farm", "jar", "scarf", "shark", "star", "fork", "horn", "horse",
    "storm", "corn", "bird", "girl", "shirt", "skirt", "turnip", "fern", "herd", "tiger", "spider",
    "ladder", "flower"
  ],
  "High-frequency concrete nouns": [
    "apple", "ball", "bed", "bike", "book", "box", "bus", "cake", "cap", "car", "chair", "cup", "door",
    "fish", "flag", "flower", "fork", "hat", "house", "key", "kite", "lamp", "leaf", "moon", "nest",
    "pencil", "phone", "ring", "shoe", "sock", "spoon", "star", "sun", "table", "tree", "window"
  ],
  "Verbs/actions": [
    "bend", "clap", "climb", "crawl", "dig", "draw", "drink", "drop", "hop", "jump", "kick", "laugh",
    "lift", "mix", "paint", "pick", "pull", "push", "read", "ride", "roll", "run", "sit", "skip", "sleep",
    "smell", "spin", "stand", "swim", "throw", "wash", "wave"
  ],
  "Adjectives": [
    "big", "small", "tall", "short", "long", "round", "flat", "wet", "dry", "hot", "cold", "clean",
    "dirty", "full", "empty", "open", "closed", "heavy", "light", "fast", "slow", "soft", "hard", "bright",
    "dark", "happy", "sad"
  ],
  "Prepositions/spatial concepts": [
    "above", "below", "behind", "beside", "between", "inside", "outside", "over", "under", "near", "far",
    "around", "through"
  ],
  "Categories/vocabulary": [
    "airplane", "ant", "apron", "backpack", "banana", "barn", "beach", "bear", "bee", "bench", "boat",
    "bowl", "brush", "bucket", "butterfly", "camel", "candle", "carrot", "castle", "caterpillar", "cheese",
    "cloud", "coat", "cookie", "cow", "crayon", "crown", "deer", "dinosaur", "doctor", "drum", "duck",
    "easel", "elephant", "envelope", "feather", "firetruck", "football", "fox", "garden", "goose", "grapes",
    "guitar", "hammer", "helicopter", "horse", "jelly", "ladle", "ladybug", "lemon", "lion", "mailbox",
    "monkey", "mushroom", "orange", "owl", "paintbrush", "peach", "pear", "penguin", "piano", "pillow",
    "pizza", "pumpkin", "queen", "quilt", "ribbon", "robot", "rocket", "sail", "scissors", "seal", "sheep",
    "snail", "snowman", "soccer", "squirrel", "strawberry", "swing", "teapot", "tent", "tiger", "toothbrush",
    "towel", "tractor", "umbrella", "vase", "violin", "wagon", "watermelon", "whistle", "yarn", "zebra"
  ]
};

const extraImageableWords = [
  "acorn", "almond", "anteater", "arm", "arrow", "avocado", "baby", "badge", "bagel", "balcony", "barrel",
  "basketball", "bathtub", "beak", "beetle", "belt", "berry", "bicycle", "blanket", "block", "blueberry",
  "board", "boot", "bottle", "branch", "bread", "bridge", "broom", "bubble", "cabinet", "cactus", "camp",
  "canoe", "card", "cart", "cave", "celery", "chalk", "chicken", "chimney", "circle", "clay", "clock",
  "closet", "clown", "coconut", "comb", "corn", "couch", "cradle", "crane", "cucumber", "desk", "diamond",
  "dice", "doll", "donkey", "donut", "dragon", "drawer", "dress", "elevator", "eraser", "eye", "face",
  "factory", "fan", "faucet", "field", "finger", "flashlight", "floor", "flute", "forest", "frame",
  "french-fry", "fridge", "gate", "gift", "gingerbread", "glasses", "goldfish", "golf", "granola",
  "grill", "hairbrush", "hanger", "harp", "hay", "head", "heart", "hill", "honey", "hose", "ice",
  "jewel", "jug", "kettle", "ladder", "lake", "lawn", "letter", "lizard", "lock", "magnet", "marble",
  "marker", "melon", "mittens", "motorcycle", "mountain", "necklace", "noodle", "ocean", "octagon",
  "paint", "pajamas", "pancake", "paper", "parrot", "path", "peanut", "peas", "pepper", "pickle", "pipe",
  "pocket", "pond", "popsicle", "purse", "radio", "raisin", "rake", "refrigerator", "river", "rocking-chair",
  "roof", "rug", "ruler", "sack", "saddle", "salad", "sandwich", "saw", "scale", "scarf", "screen",
  "seed", "shelf", "shorts", "skate", "skirt", "soap", "sofa", "spider", "sponge", "stairs", "sticker",
  "stone", "stove", "suitcase", "sweater", "taco", "tape", "teeth", "thermometer", "thread", "ticket",
  "toaster", "tomato", "toolbox", "tooth", "tower", "tray", "triangle", "trumpet", "tub", "tunnel",
  "turkey", "van", "vest", "volcano", "wall", "watch", "water", "wheelbarrow", "wrench", "yo-yo", "zipper",
  "accordion", "alligator", "anchor", "ankle", "apple", "armchair", "ash", "asparagus", "ax", "badger",
  "bag", "ball", "balloon", "bamboo", "bandage", "bar", "bark", "basket", "bat", "bead", "bean", "bed",
  "bell", "bib", "bin", "bird", "bison", "blackberry", "blade", "blender", "blimp", "blossom", "bluejay",
  "booth", "box", "bracelet", "brick", "broccoli", "bucket", "buffalo", "bug", "bulb", "bun", "bus",
  "butter", "button", "cabbage", "cab", "cage", "calf", "camera", "cap", "cape", "car", "cash", "cat",
  "chain", "chair", "cheetah", "cherry", "chest", "chick", "chime", "chip", "clam", "clip", "cloud",
  "club", "coal", "cob", "cone", "cord", "cork", "cot", "crab", "crib", "cube", "cub", "cup", "dab",
  "daisy", "deer", "dish", "dock", "dolphin", "door", "dot", "drain", "drill", "drop", "eagle", "ear",
  "eel", "eggplant", "elbow", "elk", "emu", "fern", "fig", "file", "fin", "fire", "fish", "flag",
  "flamingo", "flowerpot", "foam", "fork", "fountain", "frog", "frost", "garlic", "gazelle", "goat",
  "goggles", "gorilla", "grass", "greenbean", "gum", "ham", "hat", "heron", "hippo", "hook", "igloo",
  "inchworm", "jacket", "jar", "jellyfish", "kangaroo", "kayak", "key", "kiwi", "kite", "kitten", "knee",
  "knob", "koala", "lab", "lamp", "leaf", "leash", "lime", "lobster", "log", "map", "mat", "mop",
  "muffin", "mug", "nest", "net", "nut", "olive", "otter", "pan", "pants", "peacock", "pin", "plant",
  "plate", "plum", "pot", "pretzel", "quail", "raincoat", "ring", "robe", "robin", "rod", "shell",
  "ship", "shoe", "sock", "spoon", "spring", "star", "stem", "sub", "tube", "turtle", "twig", "window",
  "applesauce", "arch", "artichoke", "basil", "beachball", "beehive", "beet", "birdhouse", "bluebird",
  "bookcase", "bookend", "bow", "buckle", "bull", "bunny", "butternut", "can", "canary", "canteen",
  "cardigan", "carnation", "cashbox", "cauliflower", "chessboard", "chestnut", "claw", "clipboard",
  "clothespin", "cocoa", "collar", "conch", "cornbread", "cougar", "cowbell", "cricket", "crocodile",
  "crow", "cuff", "cupcake", "curtain", "cushion", "dandelion", "dewdrop", "dime", "doily", "dove",
  "dragonfly", "driftwood", "dustpan", "earring", "earthworm", "eggshell", "fernleaf", "firefly",
  "fishbowl", "flannel", "flipper", "flower", "fluff", "footprint", "foxglove", "gallon", "gecko",
  "gerbil", "giraffe", "gourd", "grapefruit", "grasshopper", "gravy", "guava", "gull", "hairpin",
  "hamster", "handbag", "handprint", "hazelnut", "hedgehog", "hen", "hive", "hockey", "hoof", "hula-hoop",
  "hummingbird", "iris", "jaguar", "jeans", "jingle-bell", "joey", "juniper", "kerchief", "ladybird",
  "lanyard", "lavender", "lettuce", "lighthouse", "lilac", "lily", "locket", "lunchbox", "macaroni",
  "mango", "maple", "marigold", "meadow", "meerkat", "mole", "moose", "moss", "moth", "mousepad",
  "nectarine", "newt", "nightstand", "oak", "oatmeal", "orchid", "ostrich", "paintbox", "palm",
  "papaya", "pawprint", "pencilbox", "peppermint", "perch", "pinecone", "pineapple", "pint", "placemat",
  "planter", "porch", "porcupine", "potato", "puddle", "puffin", "radish", "raindrop", "ram", "rattle",
  "rhinoceros", "rooster", "rosebud", "rowboat", "salamander", "sandcastle", "saucer", "seal", "seashell",
  "seesaw", "shamrock", "shovel", "skunk", "sled", "sleeve", "sloth", "snowsuit", "soapdish", "sparrow",
  "spatula", "spinach", "sprinkler", "starfish", "stool", "sunflower", "tangerine", "teacup", "thimble",
  "toad", "tongs", "toucan", "turnip", "walnut", "washboard", "weasel", "willow", "woodpecker", "yolk"
];

function normalizeWord(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-kimi\d(?:-\d)?$/i, "")
    .replace(/[^a-z0-9']+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function displayWord(value = "") {
  return normalizeWord(value).replace(/-/g, " ");
}

function fileStem(filePath = "") {
  return normalizeWord(path.basename(filePath).replace(/\.[^.]+$/, ""));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(fullPath));
    else results.push(fullPath);
  }
  return results;
}

function publicPath(fullPath) {
  return `/${path.relative(publicDir, fullPath).split(path.sep).join("/")}`;
}

function shouldExcludePath(assetPath) {
  const value = assetPath.toLowerCase();
  return NON_VOCAB_PATH_PARTS.some(part => value.includes(part));
}

function qualityIssuesForImage(word, imagePath) {
  const lower = imagePath.toLowerCase();
  const issues = [];
  if (shouldExcludePath(imagePath)) issues.push("not reusable vocabulary media path");
  if (BAD_VISUAL_HINTS.some(hint => lower.includes(hint))) issues.push("decorative/fantasy/UI visual style");
  if (WRONG_OBJECT_NOTES.has(fileStem(imagePath))) issues.push(WRONG_OBJECT_NOTES.get(fileStem(imagePath)));
  if (ABSTRACT_HFW.has(word)) issues.push("abstract word is not reliably pictureable");
  if (fileStem(imagePath) !== word) issues.push(`filename stem "${fileStem(imagePath)}" does not exactly match word`);
  if (lower.endsWith(".svg")) issues.push("vector fallback requires visual review before K-2 vocabulary approval");
  return issues;
}

function qualityIssuesForAudio(word, audioPath) {
  const lower = audioPath.toLowerCase();
  const issues = [];
  if (shouldExcludePath(audioPath)) issues.push("not reusable vocabulary audio path");
  if (lower.includes("/phrases/")) issues.push("phrase audio, not exact-word audio");
  if (lower.includes("/phonemes/")) issues.push("phoneme audio, not exact-word audio");
  if (WRONG_OBJECT_NOTES.has(fileStem(audioPath))) issues.push(WRONG_OBJECT_NOTES.get(fileStem(audioPath)));
  if (fileStem(audioPath) !== word) issues.push(`filename stem "${fileStem(audioPath)}" does not exactly match word`);
  const approvedPath = getApprovedAudioPath(word, audioPath);
  if (!approvedPath) issues.push("not approved as exact whole-word audio");
  return issues;
}

function likelySkillsForWord(word) {
  const skills = new Set();
  const clean = word.replace(/-/g, "");
  if (/^[a-z]{3}$/.test(clean) && /[aeiou]/.test(clean[1])) skills.add("CVC short vowels");
  if (word.length > 0) skills.add("Initial Sounds");
  if (word.length > 1) skills.add("Final Sounds");
  if (/^(ch|sh|th|wh)/.test(clean) || /(ch|sh|th|ng|ck)$/.test(clean)) skills.add("Digraphs");
  if (/^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr)/.test(clean)) skills.add("Blends");
  if (/(ai|ay|ee|ea|oa|ow|oi|oy|oo|ue)/.test(clean)) skills.add("Vowel teams");
  if (/(ar|er|ir|or|ur)/.test(clean)) skills.add("R-controlled vowels");
  if (/[aeiou][bcdfghjklmnpqrstvwxyz]e$/.test(clean)) skills.add("Long vowels/silent-e");
  if (!ABSTRACT_HFW.has(word)) skills.add("Vocabulary");
  return [...skills];
}

function phonicsTagsForWord(word) {
  const clean = word.replace(/-/g, "");
  const vowelMatch = clean.match(/[aeiou]/);
  const medialVowel = clean.length === 3 && vowelMatch ? `short_${vowelMatch[0]}` : "";
  return {
    initialSound: clean[0] || "",
    finalSound: clean.at(-1) || "",
    medialVowel,
    cvc: /^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(clean),
    blend: (clean.match(/^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr)/) || [""])[0],
    digraph: (clean.match(/^(ch|sh|th|wh)|(?:ch|sh|th|ng|ck)$/) || [""])[0],
    rimeFamily: clean.length >= 2 ? clean.slice(clean.match(/[aeiou]/)?.index ?? Math.max(clean.length - 2, 0)) : "",
    vowelTeam: (clean.match(/ai|ay|ee|ea|oa|ow|oi|oy|oo|ue/) || [""])[0],
    rControlled: (clean.match(/ar|er|ir|or|ur/) || [""])[0],
    sightWord: ABSTRACT_HFW.has(word),
    nounVerbAdjectiveCategory: inferCategory(word)
  };
}

function inferCategory(word) {
  const verbs = new Set(expansionSeeds["Verbs/actions"]);
  const adjectives = new Set(expansionSeeds.Adjectives);
  const spatial = new Set(expansionSeeds["Prepositions/spatial concepts"]);
  if (verbs.has(word)) return "verb/action";
  if (adjectives.has(word)) return "adjective";
  if (spatial.has(word)) return "preposition/spatial concept";
  if (ABSTRACT_HFW.has(word)) return "abstract sight word";
  return "concrete noun/vocabulary";
}

function wordsFromQuestion(question = {}) {
  const values = [
    question.targetWord,
    question.word,
    question.audioText,
    question.correctAnswer,
    question.answer,
    ...(question.words || []),
    ...(question.answerOptions || []).flatMap(option => typeof option === "string" ? [option] : [option?.word, option?.value, option?.label]),
    ...(question.imageCards || []).flatMap(card => [card?.word, card?.value, card?.label])
  ];
  return values
    .filter(value => typeof value === "string")
    .map(normalizeWord)
    .filter(value => value && /^[a-z][a-z'-]*$/.test(value));
}

function addPath(map, word, type, assetPath) {
  if (!word || !assetPath) return;
  if (!map.has(word)) map.set(word, { word, imagePaths: new Set(), audioPaths: new Set() });
  map.get(word)[type].add(assetPath);
}

function createImagePrompt(word, category = "") {
  const display = displayWord(word);
  if (word === "sub") return "A simple submarine sandwich/sub roll, centered on a white background. No text, no wrapper labels, not a submarine vehicle.";
  if (word === "lab") return "A simple school science lab table with a beaker and test tube, centered on a white background. No people, no text, not a laboratory building.";
  if (["rub", "grab", "clap", "dig", "hop", "jump", "push", "pull", "run", "sit", "sleep"].includes(word)) {
    return `A clear K-2 friendly action illustration showing ${display}. Simple natural colors, no text, no labels, no sound effects, no object faces.`;
  }
  if (category.includes("Adjectives")) {
    return `A clear K-2 friendly visual example of ${display}, using simple objects and natural colors. No text, no labels, no object faces.`;
  }
  if (category.includes("Prepositions")) {
    return `A clear K-2 friendly spatial concept image showing ${display} with two simple objects. No text, no arrows, no labels.`;
  }
  return `A single clear K-2 friendly illustration of ${display}, centered on a white or very pale background. Natural colors, no text, no labels, no watermark, no object face.`;
}

function createAudioInstruction(word) {
  return `Say exactly "${displayWord(word)}" once in clear American English. Spoken word only; no spelling, sentence, music, sound effects, or extra words.`;
}

const allFiles = walk(publicDir);
const inventoryMap = new Map();

for (const fullPath of allFiles) {
  const ext = path.extname(fullPath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext) && !AUDIO_EXTENSIONS.has(ext)) continue;
  const assetPath = publicPath(fullPath);
  const stem = fileStem(assetPath);
  if (!stem || stem.length < 2 || /\d/.test(stem)) continue;
  if (IMAGE_EXTENSIONS.has(ext)) addPath(inventoryMap, stem, "imagePaths", assetPath);
  if (AUDIO_EXTENSIONS.has(ext)) addPath(inventoryMap, stem, "audioPaths", assetPath);
}

for (const [word, asset] of Object.entries(childWordAssets)) {
  const key = normalizeWord(word);
  addPath(inventoryMap, key, "imagePaths", asset.image);
  addPath(inventoryMap, key, "imagePaths", asset.fallbackImage);
  addPath(inventoryMap, key, "audioPaths", asset.audio);
}

const currentUsage = new Map();
for (const question of loadCoreQuestionPool()) {
  for (const word of new Set(wordsFromQuestion(question))) {
    currentUsage.set(word, (currentUsage.get(word) || 0) + 1);
  }
}

const liveUsage = new Map();
for (const skillId of ["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination"]) {
  for (const question of selectableRuntimeQuestionsForSkill(skillId)) {
    for (const word of new Set(wordsFromQuestion(question))) {
      liveUsage.set(word, (liveUsage.get(word) || 0) + 1);
    }
  }
}

for (const word of new Set([...currentUsage.keys(), ...liveUsage.keys(), ...Object.keys(childWordAssets), ...Object.keys(expansionSeeds).flatMap(key => expansionSeeds[key])])) {
  if (!inventoryMap.has(word)) inventoryMap.set(word, { word, imagePaths: new Set(), audioPaths: new Set() });
}

const inventory = [...inventoryMap.values()]
  .map(item => {
    const word = item.word;
    const imagePaths = [...item.imagePaths].filter(Boolean).sort();
    const audioPaths = [...item.audioPaths].filter(Boolean).sort();
    const imageNotes = imagePaths.map(imagePath => qualityIssuesForImage(word, imagePath)).flat();
    const audioNotes = audioPaths.map(audioPath => qualityIssuesForAudio(word, audioPath)).flat();
    const usableImages = imagePaths.filter(imagePath => qualityIssuesForImage(word, imagePath).length === 0);
    const usableAudios = audioPaths.filter(audioPath => qualityIssuesForAudio(word, audioPath).length === 0);
    const usableImage = usableImages.length > 0;
    const usableAudio = usableAudios.length > 0;
    const usablePair = usableImage && usableAudio;
    const recommendedStatus = usablePair
      ? "approved"
      : usableImage
        ? "missing_audio"
        : usableAudio
          ? "missing_image"
          : imagePaths.length || audioPaths.length
            ? "needs_review"
            : "reject";

    return {
      word,
      imagePaths,
      audioPaths,
      usableImage,
      usableAudio,
      usablePair,
      imageQualityNotes: [...new Set(imageNotes)].join("; ") || (usableImage ? "Exact-word image path with no automated rejection flags." : "No exact approved vocabulary image found."),
      audioQualityNotes: [...new Set(audioNotes)].join("; ") || (usableAudio ? "Approved exact whole-word audio path." : "No approved exact whole-word audio found."),
      likelySkills: likelySkillsForWord(word),
      phonicsTags: phonicsTagsForWord(word),
      currentQuestionUsageCount: currentUsage.get(word) || 0,
      liveRuntimeUsageCount: liveUsage.get(word) || 0,
      duplicateMediaCount: Math.max(0, imagePaths.length + audioPaths.length - (imagePaths.length ? 1 : 0) - (audioPaths.length ? 1 : 0)),
      recommendedStatus
    };
  })
  .sort((a, b) => a.word.localeCompare(b.word));

const usablePairs = inventory.filter(item => item.usablePair);
const needsImage = inventory.filter(item => item.recommendedStatus === "missing_image");
const needsAudio = inventory.filter(item => item.recommendedStatus === "missing_audio");
const needsReview = inventory.filter(item => item.recommendedStatus === "needs_review");
const rejected = inventory.filter(item => item.recommendedStatus === "reject");
const bySkill = new Map();
for (const item of usablePairs) {
  for (const skill of item.likelySkills) bySkill.set(skill, (bySkill.get(skill) || 0) + 1);
}

const approvedWords = new Set(usablePairs.map(item => item.word));
const expansionCandidates = [];
for (const [category, words] of Object.entries(expansionSeeds)) {
  for (const word of words) {
    const normalized = normalizeWord(word);
    if (!normalized || approvedWords.has(normalized)) continue;
    if (!expansionCandidates.some(item => item.word === normalized)) {
      expansionCandidates.push({
        word: normalized,
        reason: category,
        targetSkills: likelySkillsForWord(normalized),
        imagePrompt: createImagePrompt(normalized, category),
        audioInstruction: createAudioInstruction(normalized),
        preferredPath: {
          image: `/media/vocabulary/images/${normalized}.webp`,
          audio: `/media/vocabulary/audio/${normalized}.mp3`
        },
        priority: finalSoundsBGapWords.includes(normalized) ? "high" : expansionCandidates.length < 160 ? "high" : expansionCandidates.length < 360 ? "medium" : "reserve"
      });
    }
  }
}
for (const word of extraImageableWords) {
  const normalized = normalizeWord(word);
  if (!normalized || approvedWords.has(normalized) || expansionCandidates.some(item => item.word === normalized)) continue;
  expansionCandidates.push({
    word: normalized,
    reason: "Categories/vocabulary",
    targetSkills: likelySkillsForWord(normalized),
    imagePrompt: createImagePrompt(normalized, "Categories/vocabulary"),
    audioInstruction: createAudioInstruction(normalized),
    preferredPath: {
      image: `/media/vocabulary/images/${normalized}.webp`,
      audio: `/media/vocabulary/audio/${normalized}.mp3`
    },
    priority: expansionCandidates.length < 160 ? "high" : expansionCandidates.length < 360 ? "medium" : "reserve"
  });
}

const finalSoundsBGap = finalSoundsBGapWords.map(word => ({
  word,
  reason: word === "sub"
    ? "Final /b/ reserve; must be sandwich/sub roll, not submarine."
    : word === "lab"
      ? "Final /b/ reserve; must show lab scene, not laboratory building."
      : "Final /b/ Level 1/reserve coverage gap.",
  targetSkills: likelySkillsForWord(word),
  imagePrompt: createImagePrompt(word, "Final Sounds coverage reserve"),
  audioInstruction: createAudioInstruction(word),
  preferredPath: {
    image: `/media/final-sounds/images/b/${word}.webp`,
    audio: `/media/final-sounds/audio/b/${word}.mp3`
  },
  priority: ["cub", "cab", "bib", "rub", "knob", "lab", "sub"].includes(word) ? "high" : "reserve"
}));

function mdTable(rows, columns) {
  return [
    `| ${columns.map(column => column.label).join(" |")} |`,
    `| ${columns.map(() => "---").join(" |")} |`,
    ...rows.map(row => `| ${columns.map(column => String(column.value(row) ?? "").replace(/\|/g, "/")).join(" |")} |`)
  ].join("\n");
}

function writeJson(fileName, data) {
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function writeMd(fileName, lines) {
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, fileName), `${lines.join("\n")}\n`);
}

writeJson("usable_vocab_media_inventory.json", {
  generatedAt: new Date().toISOString(),
  methodology: {
    usable: "Exact-word image plus approved exact whole-word audio. Guided-reading story pages and UI/decorative assets are excluded from approval.",
    limitation: "This is an automated conservative audit. It does not replace human visual/listening QA for every file."
  },
  totals: {
    wordsFound: inventory.length,
    usableImageAudioPairs: usablePairs.length,
    missingImage: needsImage.length,
    missingAudio: needsAudio.length,
    needsReview: needsReview.length,
    reject: rejected.length
  },
  usablePairsBySkillCategory: Object.fromEntries([...bySkill.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
  inventory
});

writeMd("usable_vocab_media_inventory.md", [
  "# Usable Vocabulary Media Inventory",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Method",
  "",
  "This automated audit scans public images/audio, child asset manifests, approved audio preferences, and current/runtime question usage. A word is marked `approved` only when it has at least one exact-word image path with no automated rejection flags and at least one approved exact whole-word audio path. Guided-reading story illustrations are excluded from reusable vocabulary counts.",
  "",
  "This is intentionally conservative. Items marked `needs_review` may contain useful media, but they need human visual/listening QA before reuse.",
  "",
  "## Summary",
  "",
  `- Total words found: ${inventory.length}`,
  `- Usable exact image/audio pairs: ${usablePairs.length}`,
  `- Missing image but has approved audio: ${needsImage.length}`,
  `- Has image but missing approved audio: ${needsAudio.length}`,
  `- Needs review: ${needsReview.length}`,
  `- Rejected/no usable vocabulary media: ${rejected.length}`,
  "",
  "## Usable Pairs By Skill Category",
  "",
  mdTable([...bySkill.entries()].sort((a, b) => b[1] - a[1]).map(([skill, count]) => ({ skill, count })), [
    { label: "Skill category", value: row => row.skill },
    { label: "Usable pairs", value: row => row.count }
  ]),
  "",
  "## Most Reusable Words",
  "",
  mdTable(usablePairs.sort((a, b) => b.liveRuntimeUsageCount - a.liveRuntimeUsageCount || b.currentQuestionUsageCount - a.currentQuestionUsageCount).slice(0, 40), [
    { label: "Word", value: row => row.word },
    { label: "Skills", value: row => row.likelySkills.join(", ") },
    { label: "Runtime uses", value: row => row.liveRuntimeUsageCount },
    { label: "Question uses", value: row => row.currentQuestionUsageCount },
    { label: "Images", value: row => row.imagePaths.length },
    { label: "Audio", value: row => row.audioPaths.length }
  ]),
  "",
  "## Rejected / Problem Image Examples",
  "",
  mdTable(inventory.filter(item => item.imagePaths.length && !item.usableImage).slice(0, 60), [
    { label: "Word", value: row => row.word },
    { label: "Image note", value: row => row.imageQualityNotes },
    { label: "Image paths", value: row => row.imagePaths.slice(0, 3).join("<br>") }
  ]),
  "",
  "## Rejected / Problem Audio Examples",
  "",
  mdTable(inventory.filter(item => item.audioPaths.length && !item.usableAudio).slice(0, 60), [
    { label: "Word", value: row => row.word },
    { label: "Audio note", value: row => row.audioQualityNotes },
    { label: "Audio paths", value: row => row.audioPaths.slice(0, 3).join("<br>") }
  ]),
  "",
  "## Under-Covered Phonics Targets",
  "",
  "- Final Sounds Level 1 `/b/`: current usable words remain `tub`, `web`, `crab`; request new exact media before expanding runtime.",
  "- Initial/final sounds with only abstract HFW audio should not be counted as imageable vocabulary.",
  "- Blend, vowel-team, and r-controlled targets have many audio files but fewer exact isolated vocabulary images.",
  "",
  "## Inventory File",
  "",
  "Machine-readable detail is in `docs/assets/usable_vocab_media_inventory.json`."
]);

const missingRows = [
  ...finalSoundsBGap,
  ...expansionCandidates.filter(item => !finalSoundsBGapWords.includes(item.word)).slice(0, 180)
];
writeMd("vocab_media_gaps_for_kimi.md", [
  "# Kimi Vocabulary Media Gaps",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Rules For All Requested Media",
  "",
  "- Create one exact-word WebP image and one exact-word MP3 audio file per row.",
  "- Images: clean K-2 educational illustration, natural colors, no text, no labels, no object faces, no sparkle/rainbow/fantasy style unless the target word requires it.",
  "- Audio: say the target word only, clear American English, no spelling, no sentence, no music, no sound effects.",
  "- Do not create placeholders or map a word to a different object.",
  "",
  "## Final Sounds Level 1 /b/ Gap",
  "",
  "Current usable: `tub`, `web`, `crab`.",
  "",
  mdTable(finalSoundsBGap, [
    { label: "Word", value: row => row.word },
    { label: "Reason", value: row => row.reason },
    { label: "Image prompt", value: row => row.imagePrompt },
    { label: "Audio instruction", value: row => row.audioInstruction },
    { label: "Preferred image path", value: row => row.preferredPath.image },
    { label: "Preferred audio path", value: row => row.preferredPath.audio },
    { label: "Priority", value: row => row.priority }
  ]),
  "",
  "## Additional High-Value Gaps",
  "",
  mdTable(missingRows.filter(row => !finalSoundsBGapWords.includes(row.word)), [
    { label: "Word", value: row => row.word },
    { label: "Reason", value: row => row.reason },
    { label: "Target skills", value: row => row.targetSkills.join(", ") },
    { label: "Image prompt", value: row => row.imagePrompt },
    { label: "Audio instruction", value: row => row.audioInstruction },
    { label: "Preferred paths", value: row => `${row.preferredPath.image}<br>${row.preferredPath.audio}` },
    { label: "Priority", value: row => row.priority }
  ])
]);

const expansionPlanRows = expansionCandidates.slice(0, 500);
writeMd("vocab_media_expansion_plan.md", [
  "# Vocabulary Media Expansion Plan",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Strategy",
  "",
  "Add new media only for words that do not already have an approved exact image/audio pair. Prioritize imageable, K-2 appropriate words that can support multiple skills. Avoid abstract HFWs, brand names, weapons, frightening/gory concepts, alcohol/drugs, culturally obscure objects, and words that require text inside the image.",
  "",
  `Planned candidate rows in this pass: ${expansionPlanRows.length}`,
  "",
  "## Grouping",
  "",
  ...Object.keys(expansionSeeds).flatMap(category => {
    const rows = expansionPlanRows.filter(item => item.reason === category);
    if (!rows.length) return [];
    return [
      `### ${category}`,
      "",
      mdTable(rows, [
        { label: "Word", value: row => row.word },
        { label: "Reason", value: row => row.reason },
        { label: "Target skills", value: row => row.targetSkills.join(", ") },
        { label: "Image prompt", value: row => row.imagePrompt },
        { label: "Audio instruction", value: row => row.audioInstruction },
        { label: "Preferred image", value: row => row.preferredPath.image },
        { label: "Preferred audio", value: row => row.preferredPath.audio },
        { label: "Priority", value: row => row.priority }
      ]),
      ""
    ];
  }),
  "## Remaining Reserve Candidates",
  "",
  mdTable(expansionPlanRows.filter(item => item.reason === "Categories/vocabulary").slice(80), [
    { label: "Word", value: row => row.word },
    { label: "Target skills", value: row => row.targetSkills.join(", ") },
    { label: "Priority", value: row => row.priority }
  ])
]);

console.log(`Vocabulary/media words found: ${inventory.length}`);
console.log(`Usable exact image/audio pairs: ${usablePairs.length}`);
console.log(`Missing image: ${needsImage.length}`);
console.log(`Missing approved audio: ${needsAudio.length}`);
console.log(`Needs review: ${needsReview.length}`);
console.log(`Expansion candidates written: ${expansionPlanRows.length}`);
console.log("Wrote docs/assets/usable_vocab_media_inventory.json");
console.log("Wrote docs/assets/usable_vocab_media_inventory.md");
console.log("Wrote docs/assets/vocab_media_gaps_for_kimi.md");
console.log("Wrote docs/assets/vocab_media_expansion_plan.md");
