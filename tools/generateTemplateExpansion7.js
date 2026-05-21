import fs from "fs";

import { questions } from "../src/questions.js";
import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { templateQuestions } from "../src/data/templateQuestions.js";
import { templateExpansion } from "../src/data/templateExpansion.js";
import { templateExpansion2 } from "../src/data/templateExpansion2.js";
import { templateExpansion3 } from "../src/data/templateExpansion3.js";
import { templateExpansion4 } from "../src/data/templateExpansion4.js";
import { templateExpansion5 } from "../src/data/templateExpansion5.js";
import { templateExpansion6 } from "../src/data/templateExpansion6.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

const existingQuestions = [
  ...questions,
  ...masteryCoreQuestions,
  ...masteryExtraQuestions,
  ...templateQuestions,
  ...templateExpansion,
  ...templateExpansion2,
  ...templateExpansion3,
  ...templateExpansion4,
  ...templateExpansion5,
  ...templateExpansion6,
  ...generatedQuestions
];

const usedQuestionText = new Set(
  existingQuestions.map(q => normalize(q.question))
);

const generatedIds = new Set();
const templateExpansion7 = [];

const initialSoundAudioExamples = {
  b: "ball",
  f: "fish",
  h: "hat",
  j: "jam",
  m: "moon",
  r: "rabbit",
  s: "sun",
  t: "top"
};

const finalSoundAudioExamples = {
  d: "road",
  g: "frog",
  k: "bike",
  m: "home",
  n: "green",
  p: "hop",
  s: "mouse",
  t: "light"
};

const cvcImagePaths = {
  cat: "/images/general/cat_sleeping.png",
  cup: "/images/prepositions/cup_between_books.png",
  dog: "/images/general/dog_running.png"
};

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function choices(answer, wrongs) {
  return [...new Set([answer, ...wrongs])].slice(0, 4);
}

function add(q) {
  const cleanQuestion = normalize(q.question);

  if (usedQuestionText.has(cleanQuestion)) {
    throw new Error(`Duplicate question text: ${q.question}`);
  }

  if (generatedIds.has(q.id)) {
    throw new Error(`Duplicate generated id: ${q.id}`);
  }

  if (!q.choices.includes(q.answer)) {
    throw new Error(`Answer missing from choices for ${q.id}`);
  }

  if (new Set(q.choices.map(choice => normalize(choice))).size !== q.choices.length) {
    throw new Error(`Duplicate choices for ${q.id}`);
  }

  usedQuestionText.add(cleanQuestion);
  generatedIds.add(q.id);

  templateExpansion7.push({
    id: q.id,
    grade: q.grade,
    skill: q.skill,
    difficulty: q.difficulty,
    passage: q.passage || "",
    question: q.question,
    ...(q.spokenPrompt ? { spokenPrompt: q.spokenPrompt } : {}),
    image: q.image || "",
    imagePath: q.imagePath || "",
    questionType: q.questionType || "multiple_choice",
    choices: q.choices,
    answer: q.answer
  });
}

function addRows(prefix, rows, build) {
  rows.forEach((row, index) => add(build(row, index + 1, `${prefix}_${index + 1}`)));
}

addRows("exp7_initial", [
  ["b", "bat", ["cat", "sun", "dog"]],
  ["m", "map", ["tap", "cap", "nap"]],
  ["s", "sock", ["rock", "lock", "dock"]],
  ["t", "tent", ["sent", "went", "bent"]],
  ["f", "fish", ["dish", "wish", "ship"]],
  ["r", "rain", ["pain", "main", "chain"]],
  ["h", "hat", ["mat", "sat", "pat"]],
  ["j", "jam", ["ham", "ram", "yam"]]
], ([sound, answer, wrongs], index, id) => ({
  id,
  grade: "K",
  skill: "initial sounds",
  difficulty: 1,
  question: `Which word starts the same as ${initialSoundAudioExamples[sound]}?`,
  spokenPrompt: `Which word starts like ${initialSoundAudioExamples[sound]}?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_final", [
  ["t", "boat", ["soap", "foam", "road"]],
  ["p", "cup", ["cut", "cub", "gum"]],
  ["n", "moon", ["mood", "mop", "move"]],
  ["g", "bag", ["bat", "ban", "bad"]],
  ["m", "drum", ["duck", "drop", "dress"]],
  ["d", "bed", ["bet", "beg", "bell"]],
  ["k", "duck", ["dun", "dub", "dug"]],
  ["s", "bus", ["bug", "bun", "bud"]]
], ([sound, answer, wrongs], index, id) => ({
  id,
  grade: "K",
  skill: "final sounds",
  difficulty: 1,
  question: `Which word ends the same as ${finalSoundAudioExamples[sound]}?`,
  spokenPrompt: `Which word ends like ${finalSoundAudioExamples[sound]}?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_rhyme", [
  ["lake", "cake", ["cap", "cup", "kite"]],
  ["bell", "shell", ["ship", "sock", "sun"]],
  ["nose", "rose", ["rain", "rat", "rug"]],
  ["king", "ring", ["road", "rock", "rack"]],
  ["mouse", "house", ["hat", "hen", "hill"]],
  ["go", "snow", ["snack", "snap", "snip"]],
  ["star", "car", ["cat", "cup", "can"]],
  ["tree", "bee", ["bed", "bat", "bag"]]
], ([target, answer, wrongs], index, id) => ({
  id,
  grade: "K",
  skill: "rhyming",
  difficulty: 1,
  question: `Which word rhymes with ${target}?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_short_vowel", [
  ["pan", "bag", ["bed", "big", "bug"]],
  ["jam", "cap", ["cup", "cop", "dip"]],
  ["web", "hen", ["hat", "hit", "hot"]],
  ["ten", "leg", ["log", "lag", "lug"]],
  ["pin", "dig", ["dog", "dug", "dag"]],
  ["sit", "lip", ["lap", "lop", "cup"]],
  ["fox", "top", ["tip", "tap", "tub"]],
  ["mop", "log", ["leg", "lag", "lug"]],
  ["mud", "sun", ["son", "sin", "sat"]],
  ["tub", "cup", ["cap", "cop", "tip"]],
  ["rag", "ham", ["hem", "him", "hum"]],
  ["pen", "net", ["nut", "not", "nat"]],
  ["fin", "win", ["wan", "wen", "won"]],
  ["hop", "rod", ["red", "rid", "rug"]],
  ["gum", "hut", ["hit", "hot", "hat"]],
  ["cab", "map", ["mop", "mug", "men"]],
  ["jet", "pet", ["pat", "pit", "pot"]],
  ["rib", "kid", ["cad", "cod", "cud"]],
  ["box", "cot", ["cat", "cut", "kit"]],
  ["bun", "rug", ["rag", "rig", "rog"]]
], ([target, answer, wrongs], index, id) => ({
  id,
  grade: "K",
  skill: "short vowel discrimination",
  difficulty: 2,
  question: `Which word has the same middle sound as ${target}?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_cvc", [
  ["cat", ["cap", "cot", "cut"]],
  ["bed", ["bad", "bid", "bud"]],
  ["hop", ["hip", "hap", "hup"]],
  ["mud", ["mad", "mid", "mop"]],
  ["fin", ["fan", "fun", "fog"]],
  ["log", ["lag", "leg", "lug"]],
  ["cup", ["cap", "cop", "cab"]],
  ["map", ["mop", "mug", "men"]],
  ["rug", ["rag", "rig", "rot"]],
  ["pet", ["pat", "pit", "pot"]],
  ["jam", ["jet", "jig", "jog"]],
  ["sit", ["sat", "set", "sod"]],
  ["pot", ["pat", "pet", "pit"]],
  ["hen", ["hat", "hit", "hot"]],
  ["bag", ["bug", "big", "bog"]],
  ["red", ["rid", "rod", "rug"]],
  ["fox", ["fix", "fax", "fun"]],
  ["sun", ["sad", "sit", "sop"]],
  ["pin", ["pan", "pen", "pun"]],
  ["top", ["tap", "tip", "tub"]],
  ["web", ["wed", "wet", "wag"]],
  ["cab", ["cub", "cob", "cat"]],
  ["zip", ["zap", "zig", "zen"]],
  ["gum", ["gap", "got", "gas"]],
  ["van", ["vet", "vat", "vex"]],
  ["bat", ["bet", "bit", "but"]],
  ["dog", ["dig", "dug", "dag"]],
  ["man", ["men", "map", "mop"]]
], ([answer, wrongs], index, id) => ({
  id,
  grade: "K",
  skill: "cvc",
  difficulty: 1,
  question: "Listen and find the word.",
  spokenPrompt: `Find the word ${answer}.`,
  imagePath: cvcImagePaths[answer] || "",
  choices: choices(answer, wrongs),
  answer
}));

const hfw125 = [
  ["Complete the sentence about one pet.", "___ cat is small.", "My", ["Can", "Jump", "Blue"]],
  ["Complete the sentence about a place.", "I go ___ school.", "to", ["red", "jump", "little"]],
  ["Complete the sentence about a friend.", "We ___ at the park.", "play", ["said", "brown", "under"]],
  ["Complete the sentence about looking.", "I ___ a bird.", "see", ["run", "big", "not"]],
  ["Complete the sentence about wanting.", "I ___ a snack.", "want", ["down", "pretty", "after"]],
  ["Complete the sentence about ability.", "She ___ read.", "can", ["red", "this", "jump"]],
  ["Complete the sentence about location.", "The cup is ___ the table.", "on", ["go", "my", "said"]],
  ["Complete the sentence about a group.", "___ like books.", "We", ["Blue", "Run", "Away"]],
  ["Complete the sentence about possession.", "This is ___ bag.", "my", ["go", "at", "jump"]],
  ["Complete the sentence about direction.", "Come ___ me.", "with", ["yellow", "funny", "little"]],
  ["Complete the sentence about action.", "I ___ to the door.", "go", ["the", "brown", "said"]],
  ["Complete the sentence about feeling.", "I ___ happy.", "am", ["see", "blue", "run"]],
  ["Complete the sentence about a choice.", "Do you ___ milk?", "like", ["went", "small", "under"]],
  ["Complete the sentence about one thing.", "This is ___ ball.", "a", ["can", "play", "see"]],
  ["Complete the sentence about pointing.", "___ dog is big.", "That", ["Jump", "Funny", "Go"]]
];

addRows("exp7_hfw_1_25", hfw125, ([question, passage, answer, wrongs], index, id) => ({
  id,
  grade: "K",
  skill: "high-frequency words 1-25",
  difficulty: 1,
  passage,
  question,
  questionType: "cloze_choice",
  choices: choices(answer, wrongs),
  answer
}));

const hfw2650 = [
  ["Complete the sentence about yesterday.", "I ___ to class.", "went", ["made", "open", "round"]],
  ["Complete the sentence about making.", "She ___ a card.", "made", ["went", "sleep", "green"]],
  ["Complete the sentence about asking.", "He ___ a question.", "asked", ["jumped", "little", "over"]],
  ["Complete the shelf sentence.", "The book is ___ the shelf.", "under", ["made", "said", "funny"]],
  ["Complete the sentence about time.", "We eat lunch ___ recess.", "after", ["green", "make", "sleep"]],
  ["Complete the sentence about size.", "The mouse is ___ small.", "very", ["went", "around", "cold"]],
  ["Complete the sentence about color.", "The leaf is ___ green.", "very", ["asked", "sleep", "over"]],
  ["Complete the sentence about opening.", "Please ___ the box.", "open", ["under", "round", "made"]],
  ["Complete the sentence about resting.", "The baby will ___ now.", "sleep", ["made", "green", "asked"]],
  ["Complete the sentence about movement.", "The dog ran ___ the tree.", "around", ["sleep", "yellow", "made"]],
  ["Complete the sentence about a shape.", "The ball is ___ .", "round", ["went", "after", "asked"]],
  ["Complete the sentence about a color.", "The sun looks ___ .", "yellow", ["open", "sleep", "under"]],
  ["Complete the sentence about weather.", "The snow is ___ .", "cold", ["made", "round", "asked"]],
  ["Complete the sentence about number.", "I have ___ pencils.", "two", ["went", "open", "under"]],
  ["Complete the sentence about a helper.", "The teacher ___ us.", "helps", ["yellow", "round", "after"]]
];

addRows("exp7_hfw_26_50", hfw2650, ([question, passage, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "high-frequency words 26-50",
  difficulty: 2,
  passage,
  question,
  questionType: "cloze_choice",
  choices: choices(answer, wrongs),
  answer
}));

const hfw51100 = [
  ["Complete the sentence about reading.", "I ___ the story again.", "read", ["green", "under", "round"]],
  ["Complete the lunch-time sentence.", "We line up ___ lunch.", "before", ["happy", "carry", "blue"]],
  ["Complete the sentence about finding.", "She ___ her pencil.", "found", ["under", "pretty", "small"]],
  ["Complete the sentence about giving.", "He will ___ me a turn.", "give", ["after", "yellow", "sleep"]],
  ["Complete the sentence about thinking.", "I ___ the answer.", "know", ["went", "cold", "round"]]
];

addRows("exp7_hfw_51_100", hfw51100, ([question, passage, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "high-frequency words 51-100",
  difficulty: 2,
  passage,
  question,
  questionType: "cloze_choice",
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_blends", [
  ["bl", "black", ["back", "lack", "pack"]],
  ["br", "brush", ["rush", "mush", "hush"]],
  ["cl", "clap", ["cap", "lap", "tap"]],
  ["cr", "crab", ["cab", "grab", "tab"]],
  ["dr", "drum", ["rum", "gum", "sum"]],
  ["fl", "flag", ["lag", "bag", "tag"]],
  ["fr", "frog", ["fog", "log", "hog"]],
  ["gl", "glove", ["love", "dove", "move"]],
  ["gr", "grass", ["glass", "mass", "pass"]],
  ["pl", "plant", ["pant", "ant", "tent"]],
  ["pr", "prize", ["rise", "size", "wise"]],
  ["sk", "skate", ["gate", "late", "plate"]],
  ["sl", "slide", ["side", "hide", "wide"]],
  ["sn", "snail", ["nail", "mail", "tail"]],
  ["sp", "spoon", ["soon", "moon", "noon"]],
  ["st", "stone", ["tone", "cone", "bone"]],
  ["sw", "swing", ["sing", "ring", "wing"]],
  ["tr", "train", ["rain", "main", "chain"]],
  ["tw", "twist", ["wrist", "list", "mist"]]
], ([blend, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "blends",
  difficulty: 2,
  question: `Which word begins with the ${blend} blend?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_digraphs", [
  ["sh", "shell", ["sell", "bell", "fell"]],
  ["ch", "chair", ["hair", "fair", "pair"]],
  ["th", "thumb", ["gum", "drum", "plum"]],
  ["wh", "whale", ["tail", "mail", "sail"]],
  ["sh", "shadow", ["ladder", "window", "basket"]],
  ["ch", "cheese", ["freeze", "please", "trees"]],
  ["th", "three", ["tree", "free", "green"]],
  ["wh", "wheel", ["feel", "peel", "seal"]],
  ["sh", "ship", ["sip", "tip", "dip"]],
  ["ch", "chop", ["shop", "mop", "top"]],
  ["th", "thin", ["fin", "pin", "tin"]],
  ["wh", "white", ["kite", "bite", "site"]],
  ["sh", "shine", ["fine", "line", "nine"]],
  ["ch", "chain", ["rain", "train", "plain"]],
  ["th", "thorn", ["corn", "born", "horn"]],
  ["wh", "whisk", ["risk", "disk", "mask"]],
  ["sh", "shark", ["park", "dark", "mark"]],
  ["ch", "chick", ["kick", "pick", "lick"]]
], ([digraph, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "digraphs",
  difficulty: 3,
  question: `Which word begins with the ${digraph} digraph?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_long_vowels", [
  ["long a", "cake", ["cat", "cap", "cab"]],
  ["long e", "seed", ["set", "said", "sad"]],
  ["long i", "kite", ["kit", "cat", "cut"]],
  ["long o", "rope", ["hop", "hot", "hat"]],
  ["long u", "cube", ["cub", "cab", "cob"]],
  ["long a", "rain", ["ran", "pin", "pen"]],
  ["long e", "team", ["ten", "tan", "tin"]],
  ["long i", "light", ["lid", "log", "let"]],
  ["long o", "boat", ["bat", "bit", "but"]],
  ["long u", "flute", ["flat", "flip", "flop"]],
  ["long a", "plate", ["plant", "plot", "plum"]],
  ["long e", "theme", ["them", "then", "thin"]],
  ["long i", "smile", ["smell", "small", "spill"]],
  ["long o", "stone", ["stop", "stem", "stamp"]],
  ["long u", "mule", ["mud", "mad", "mid"]],
  ["long a", "day", ["dad", "did", "dot"]],
  ["long e", "green", ["grin", "gran", "grow"]],
  ["long o", "snow", ["snap", "snip", "snug"]]
], ([sound, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "long vowels",
  difficulty: 3,
  question: `Which word has the ${sound} sound?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_vowel_teams", [
  ["ai", "rain", ["ran", "run", "ring"]],
  ["ay", "play", ["plan", "plum", "plug"]],
  ["ee", "feet", ["fit", "fat", "fog"]],
  ["ea", "leaf", ["left", "loft", "lift"]],
  ["oa", "goat", ["got", "gut", "gate"]],
  ["ow", "snow", ["snug", "snap", "snip"]],
  ["igh", "night", ["net", "not", "nut"]],
  ["ie", "pie", ["pin", "pan", "pen"]],
  ["ue", "blue", ["bug", "bag", "beg"]],
  ["ew", "chew", ["chin", "chat", "chip"]],
  ["ai", "paint", ["pant", "pint", "punt"]],
  ["ay", "tray", ["try", "tree", "true"]],
  ["ee", "sheep", ["ship", "shop", "shape"]],
  ["ea", "beach", ["bench", "batch", "bunch"]],
  ["oa", "soap", ["sip", "sap", "sop"]],
  ["ow", "grow", ["grin", "gran", "grub"]],
  ["igh", "bright", ["brought", "brush", "brick"]],
  ["ew", "new", ["net", "nut", "nap"]]
], ([team, answer, wrongs], index, id) => ({
  id,
  grade: "2",
  skill: "vowel teams",
  difficulty: 4,
  question: `Which word has the ${team} vowel team?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_r_controlled", [
  ["ar", "barn", ["bin", "ben", "bun"]],
  ["ar", "sharp", ["ship", "shop", "sheep"]],
  ["er", "herd", ["hide", "had", "head"]],
  ["er", "clerk", ["click", "clock", "clack"]],
  ["ir", "bird", ["bad", "bed", "bud"]],
  ["ir", "shirt", ["shot", "shut", "sheet"]],
  ["or", "corn", ["can", "cot", "cut"]],
  ["or", "fork", ["fish", "fan", "fun"]],
  ["ur", "turn", ["tan", "tin", "ten"]],
  ["ur", "nurse", ["nose", "nice", "near"]],
  ["ar", "card", ["cod", "kid", "cup"]],
  ["er", "fern", ["fan", "fin", "fun"]],
  ["ir", "stir", ["star", "store", "step"]],
  ["or", "storm", ["stem", "stamp", "steam"]],
  ["ur", "curl", ["car", "care", "cool"]]
], ([pattern, answer, wrongs], index, id) => ({
  id,
  grade: "2",
  skill: "r controlled vowels",
  difficulty: 4,
  question: `Which word has the ${pattern} r-controlled vowel?`,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_nouns", [
  ["Which word names a person?", "teacher", ["run", "blue", "under"]],
  ["Which word names a place?", "school", ["jump", "tiny", "quickly"]],
  ["Which word names a thing?", "pencil", ["write", "happy", "beside"]],
  ["Which word is a noun?", "garden", ["grow", "green", "slowly"]],
  ["Which word names an animal?", "rabbit", ["hop", "soft", "near"]],
  ["Which word names a thing?", "basket", ["carry", "round", "behind"]],
  ["Which word names a place?", "library", ["read", "quiet", "inside"]],
  ["Which word is a noun?", "window", ["open", "bright", "above"]],
  ["Which word names a person?", "doctor", ["help", "kind", "after"]],
  ["Which word names a thing?", "blanket", ["sleep", "warm", "under"]],
  ["Which word names a place?", "farm", ["plant", "muddy", "outside"]],
  ["Which word names an animal?", "duck", ["swim", "wet", "around"]],
  ["Which word names a thing?", "spoon", ["stir", "shiny", "under"]],
  ["Which word names a place?", "market", ["buy", "busy", "beside"]],
  ["Which word names a person?", "pilot", ["fly", "fast", "above"]],
  ["Which word is a noun?", "river", ["flow", "wide", "near"]],
  ["Which word names a thing?", "helmet", ["wear", "safe", "on"]],
  ["Which word names an animal?", "turtle", ["crawl", "slow", "under"]],
  ["Which word names a place?", "museum", ["look", "quiet", "inside"]],
  ["Which word names a person?", "artist", ["paint", "bright", "with"]],
  ["Which word is a noun?", "ladder", ["climb", "tall", "against"]],
  ["Which word names a thing?", "button", ["push", "round", "near"]],
  ["Which word names a place?", "kitchen", ["cook", "warm", "inside"]],
  ["Which word names an animal?", "horse", ["gallop", "brown", "behind"]],
  ["Which word names a person?", "nurse", ["help", "kind", "beside"]],
  ["Which word is a noun?", "candle", ["glow", "small", "on"]],
  ["Which word names a thing?", "ticket", ["hold", "paper", "inside"]],
  ["Which word names a place?", "station", ["wait", "loud", "near"]],
  ["Which word names an animal?", "goose", ["waddle", "white", "outside"]],
  ["Which word names a person?", "coach", ["teach", "loud", "after"]],
  ["Which word is a noun?", "pocket", ["carry", "small", "inside"]],
  ["Which word names a thing?", "ladle", ["scoop", "deep", "beside"]],
  ["Which word names a place?", "garden", ["plant", "green", "behind"]],
  ["Which word names an animal?", "kitten", ["meow", "soft", "under"]]
], ([question, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "nouns",
  difficulty: 2,
  question,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_verbs", [
  ["Which word tells an action?", "clap", ["hands", "loud", "near"]],
  ["Which word is a verb?", "build", ["blocks", "tall", "under"]],
  ["Which word tells what someone can do?", "paint", ["brush", "red", "inside"]],
  ["Which word shows action?", "carry", ["bag", "heavy", "beside"]],
  ["Which word is a verb?", "listen", ["ears", "quiet", "behind"]],
  ["Which word tells an action?", "wash", ["hands", "clean", "above"]],
  ["Which word shows something you can do?", "crawl", ["baby", "small", "outside"]],
  ["Which word is a verb?", "drive", ["car", "fast", "around"]],
  ["Which word tells an action?", "plant", ["seed", "green", "under"]],
  ["Which word shows action?", "share", ["toy", "kind", "with"]],
  ["Which word is a verb?", "count", ["numbers", "many", "near"]],
  ["Which word tells what someone can do?", "laugh", ["joke", "funny", "after"]],
  ["Which word shows action?", "clean", ["room", "messy", "inside"]],
  ["Which word is a verb?", "pull", ["rope", "long", "behind"]],
  ["Which word tells an action?", "push", ["cart", "heavy", "beside"]],
  ["Which word shows something you can do?", "write", ["paper", "white", "on"]]
], ([question, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "verbs",
  difficulty: 2,
  question,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_adjectives", [
  ["Which word describes size?", "tiny", ["mouse", "crawl", "under"]],
  ["Which word describes color?", "purple", ["grape", "eat", "beside"]],
  ["Which word describes how something feels?", "smooth", ["stone", "roll", "near"]],
  ["Which word is an adjective?", "noisy", ["bell", "ring", "above"]],
  ["Which word describes taste?", "sour", ["lemon", "cut", "inside"]],
  ["Which word describes temperature?", "warm", ["blanket", "sleep", "under"]],
  ["Which word describes shape?", "square", ["box", "open", "behind"]],
  ["Which word is a describing word?", "gentle", ["touch", "hand", "with"]],
  ["Which word describes speed?", "slow", ["turtle", "walk", "around"]],
  ["Which word describes sound?", "silent", ["room", "read", "inside"]],
  ["Which word describes feeling?", "proud", ["child", "smile", "after"]],
  ["Which word is an adjective?", "dusty", ["shelf", "wipe", "near"]],
  ["Which word describes height?", "short", ["tree", "grow", "outside"]],
  ["Which word describes weight?", "light", ["feather", "float", "above"]],
  ["Which word describes age?", "young", ["puppy", "play", "under"]],
  ["Which word is a describing word?", "brave", ["helper", "help", "with"]]
], ([question, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "adjectives",
  difficulty: 2,
  question,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_prepositions", [
  ["cat", "in the box", "/images/prepositions/cat_in_box.png", ["under the box", "beside the box", "behind the box"]],
  ["dog", "under the table", "/images/prepositions/dog_under_table.png", ["on the table", "beside the table", "behind the table"]],
  ["ball", "on the chair", "/images/prepositions/ball_on_chair.png", ["under the chair", "behind the chair", "beside the chair"]],
  ["rabbit", "beside the basket", "/images/prepositions/rabbit_beside_basket.png", ["inside the basket", "under the basket", "behind the basket"]],
  ["bear", "behind the tree", "/images/prepositions/bear_behind_tree.png", ["in front of the tree", "under the tree", "beside the tree"]],
  ["cup", "between the books", "/images/prepositions/cup_between_books.png", ["under the books", "behind the books", "above the books"]],
  ["bird", "above the tree", "/images/prepositions/bird_above_tree.png", ["under the tree", "inside the tree", "beside the tree"]],
  ["shoes", "near the door", "/images/prepositions/shoes_near_door.png", ["inside the door", "above the door", "under the door"]],
  ["goat", "inside the barn", "/images/prepositions/goat_inside_barn.png", ["outside the barn", "above the barn", "under the barn"]],
  ["duck", "outside the pond", "/images/prepositions/duck_outside_pond.png", ["inside the pond", "under the pond", "behind the pond"]],
  ["cat", "in the box", "/images/prepositions/cat_in_box.png", ["on the box", "near the door", "above the tree"]],
  ["dog", "under the table", "/images/prepositions/dog_under_table.png", ["inside the barn", "on the chair", "above the tree"]],
  ["ball", "on the chair", "/images/prepositions/ball_on_chair.png", ["between the books", "under the table", "outside the pond"]],
  ["rabbit", "beside the basket", "/images/prepositions/rabbit_beside_basket.png", ["behind the tree", "inside the barn", "above the tree"]],
  ["bear", "behind the tree", "/images/prepositions/bear_behind_tree.png", ["between the books", "near the door", "inside the pond"]],
  ["cup", "between the books", "/images/prepositions/cup_between_books.png", ["beside the basket", "on the chair", "outside the pond"]],
  ["bird", "above the tree", "/images/prepositions/bird_above_tree.png", ["under the table", "inside the box", "near the door"]],
  ["shoes", "near the door", "/images/prepositions/shoes_near_door.png", ["above the tree", "inside the barn", "between the books"]]
], ([thing, answer, imagePath, wrongs], index, id) => {
  const verb = thing === "shoes" ? "are" : "is";

  return {
    id,
    grade: "K",
    skill: "prepositions",
    difficulty: 1,
    questionType: "image_choice",
    imagePath,
    question: `Look at the picture. Where ${verb} the ${thing}?`,
    choices: choices(answer, wrongs),
    answer
  };
});

addRows("exp7_morphology", [
  ["What does redo mean?", "do again", ["not do", "full of doing", "do quickly"]],
  ["What does preheat mean?", "heat before", ["heat again", "not heat", "full of heat"]],
  ["What does unkind mean?", "not kind", ["kind again", "very kind", "full of kind"]],
  ["What does hopeful mean?", "full of hope", ["without hope", "hope again", "not hope"]],
  ["What does fearless mean?", "without fear", ["full of fear", "fear again", "not afraid again"]],
  ["What does painter mean?", "a person who paints", ["paint again", "not paint", "full of paint"]],
  ["What does slowly mean?", "in a slow way", ["not slow", "slow again", "full of slow"]],
  ["What does preview mean?", "see before", ["see again", "not see", "full of seeing"]],
  ["What does unlock mean?", "make not locked", ["lock again", "very locked", "full of locks"]],
  ["What does playful mean?", "full of play", ["without play", "play again", "not play"]],
  ["What does washable mean?", "able to be washed", ["washed before", "not washed", "full of washing"]],
  ["What does reread mean?", "read again", ["not read", "read before", "full of reading"]],
  ["What does unsafe mean?", "not safe", ["safe again", "very safe", "full of safe"]],
  ["What does helper mean?", "a person who helps", ["help again", "not help", "full of help"]],
  ["What does carefully mean?", "in a careful way", ["without care", "care again", "not careful"]],
  ["What does rewrite mean?", "write again", ["not write", "write before", "full of writing"]]
], ([question, answer, wrongs], index, id) => ({
  id,
  grade: "2",
  skill: "prefixes and suffixes",
  difficulty: 3,
  question,
  choices: choices(answer, wrongs),
  answer
}));

addRows("exp7_homophones", [
  ["Which word means a piece of mail?", "letter", ["lettuce", "later", "ladder"]],
  ["Which word means an animal with a mane?", "horse", ["hoarse", "house", "hose"]],
  ["Which word means a path for cars?", "road", ["rode", "rowed", "read"]],
  ["Which word means moved on a bike?", "rode", ["road", "rowed", "read"]],
  ["Which word means a place where food is sold?", "store", ["story", "stair", "stare"]],
  ["Which word means a tale?", "story", ["store", "stair", "stare"]],
  ["Which word means a number after seven?", "eight", ["ate", "eat", "each"]],
  ["Which word means had food?", "ate", ["eight", "eat", "each"]],
  ["Which word means ocean water?", "sea", ["see", "say", "seed"]],
  ["Which word means use your eyes?", "see", ["sea", "say", "seed"]],
  ["Which word means not left?", "right", ["write", "rite", "bright"]],
  ["Which word means put words on paper?", "write", ["right", "rite", "bright"]],
  ["Which word means a place with stairs?", "stair", ["stare", "store", "story"]],
  ["Which word means look for a long time?", "stare", ["stair", "store", "story"]],
  ["Which word means a type of meat?", "steak", ["stake", "stack", "stick"]],
  ["Which word means a pointed post?", "stake", ["steak", "stack", "stick"]]
], ([question, answer, wrongs], index, id) => ({
  id,
  grade: "2",
  skill: "homophones",
  difficulty: 4,
  question: `${question}`,
  choices: choices(answer, wrongs),
  answer
}));

const keyDetails = [
  ["Nora packed a red scarf in her bag.", "What color was Nora's scarf?", "red", ["blue", "green", "yellow"]],
  ["The class planted beans in paper cups.", "What did the class plant?", "beans", ["rocks", "flowers", "shells"]],
  ["Eli found a feather near the fence.", "What did Eli find?", "a feather", ["a shell", "a coin", "a leaf"]],
  ["Maya read three pages before lunch.", "How many pages did Maya read?", "three", ["one", "five", "ten"]],
  ["The puppy slept under the desk.", "Where did the puppy sleep?", "under the desk", ["on the bed", "in the yard", "beside the door"]],
  ["A blue kite flew above the hill.", "What color was the kite?", "blue", ["red", "black", "white"]],
  ["Dad made rice for dinner.", "What did Dad make?", "rice", ["soup", "cake", "bread"]],
  ["The bird sat on a thin branch.", "Where did the bird sit?", "on a branch", ["under a chair", "near a pond", "inside a box"]],
  ["Lena carried a small drum to music class.", "What did Lena carry?", "a drum", ["a bell", "a book", "a ball"]],
  ["The children painted stars on paper.", "What did the children paint?", "stars", ["trees", "cars", "boats"]],
  ["Omar wore boots on the rainy day.", "What did Omar wear?", "boots", ["sandals", "mittens", "a cap"]],
  ["The rabbit ate a crisp carrot.", "What did the rabbit eat?", "a carrot", ["an apple", "a cookie", "a seed"]],
  ["Grace put the key in her pocket.", "Where did Grace put the key?", "in her pocket", ["on the shelf", "under the bed", "by the sink"]],
  ["The team used tape to fix the poster.", "What did the team use?", "tape", ["glue", "paint", "string"]],
  ["A frog jumped into the pond.", "What jumped into the pond?", "a frog", ["a duck", "a fish", "a turtle"]],
  ["The bus stopped beside the school.", "Where did the bus stop?", "beside the school", ["near the farm", "under the bridge", "inside the park"]],
  ["June picked a ripe peach.", "What fruit did June pick?", "a peach", ["a pear", "a plum", "a grape"]],
  ["The baby held a soft bear.", "What did the baby hold?", "a soft bear", ["a red cup", "a hard block", "a green spoon"]],
  ["The class sang a song after snack.", "What did the class do after snack?", "sang a song", ["took a nap", "painted a wall", "closed the door"]]
];

addRows("exp7_key_details", keyDetails, ([passage, question, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "key details",
  difficulty: 3,
  passage,
  question: `${question}`,
  choices: choices(answer, wrongs),
  answer
}));

const sequencing = [
  ["First, Mia zipped her coat. Next, she put on mittens. Last, she went outside.", "What did Mia do next?", "put on mittens", ["zipped her coat", "went outside", "ate lunch"]],
  ["Tom mixed the batter. Then he poured it in a pan. Last, he baked it.", "What happened after mixing?", "poured it in a pan", ["baked it", "washed the pan", "ate a sandwich"]],
  ["The girl found a seed. She planted it. Later, a sprout came up.", "What happened after she found a seed?", "she planted it", ["a sprout came up", "she picked a flower", "she bought a book"]],
  ["Ben opened the notebook. Then he wrote his name. Last, he drew a star.", "What did Ben do last?", "drew a star", ["opened the notebook", "wrote his name", "closed the door"]],
  ["First, the dog barked. Then the door opened. Finally, Dad came in.", "What happened before Dad came in?", "the door opened", ["the dog slept", "Dad cooked", "the cat jumped"]],
  ["The class lined up. They walked to art. Then they painted.", "What did the class do before painting?", "walked to art", ["ate dinner", "read at home", "played outside"]],
  ["Sara washed the apple. Then she sliced it. Last, she ate it.", "What did Sara do after washing the apple?", "sliced it", ["ate it", "threw it away", "put on shoes"]],
  ["The boy filled the cup. He drank the water. Then he rinsed the cup.", "What did he do after filling the cup?", "drank the water", ["rinsed the cup", "painted the cup", "dropped the cup"]],
  ["First, the bird picked up grass. Next, it made a nest. Later, it rested.", "What did the bird do next?", "made a nest", ["picked up grass", "rested", "flew to the moon"]],
  ["Nina took out paper. She folded it. Then she made a card.", "What happened before she made a card?", "she folded paper", ["she mailed it", "she ate paper", "she found a shoe"]],
  ["The children cleaned the table. Then they set out plates. Last, they ate.", "What did they do after cleaning?", "set out plates", ["ate first", "went swimming", "closed the table"]],
  ["Max got a book. He read a page. Then he put the book away.", "What did Max do before putting the book away?", "read a page", ["got a snack", "rode a bike", "washed a cup"]],
  ["The teacher rang the bell. The students stopped talking. Then they listened.", "What happened after the bell rang?", "students stopped talking", ["students ran home", "teacher slept", "books flew away"]],
  ["Amy tied her shoes. She picked up her backpack. Then she left.", "What did Amy do first?", "tied her shoes", ["left", "picked up her backpack", "ate breakfast"]],
  ["The puppy found the ball. It pushed the ball. Then it chased the ball.", "What did the puppy do after finding the ball?", "pushed the ball", ["chased it first", "hid under a bed", "read a book"]],
  ["Liam drew a tree. Then he colored the leaves. Last, he wrote his name.", "What happened last?", "wrote his name", ["drew a tree", "colored the leaves", "cut the paper"]],
  ["Mom opened the oven. She took out bread. Then the bread cooled.", "What happened after the oven opened?", "bread came out", ["bread cooled first", "Mom planted seeds", "the oven sang"]],
  ["The team built a tower. The tower leaned. Then it fell.", "What happened before it fell?", "the tower leaned", ["the team ate", "the tower flew", "the blocks melted"]],
  ["First, Rosa packed crayons. Next, she packed paper. Last, she closed the bag.", "What did Rosa pack next?", "paper", ["crayons", "a sandwich", "a blanket"]]
];

addRows("exp7_sequencing", sequencing, ([passage, question, answer, wrongs], index, id) => ({
  id,
  grade: "1",
  skill: "sequencing",
  difficulty: 3,
  passage,
  question: `${question}`,
  choices: choices(answer, wrongs),
  answer
}));

const mainIdea = [
  ["Cats sleep, play, and clean their fur.", "What is this mostly about?", "cats", ["buses", "rain", "books"]],
  ["A bakery has bread, cakes, and cookies.", "What is this mostly about?", "a bakery", ["a library", "a farm", "a playground"]],
  ["Seeds need soil, water, and sunlight to grow.", "What is this mostly about?", "growing plants", ["fixing bikes", "cooking soup", "washing clothes"]],
  ["A bus driver stops safely and takes people places.", "What is this mostly about?", "what a bus driver does", ["why birds fly", "how fish swim", "where shoes go"]],
  ["At recess, children run, jump, and play games.", "What is this mostly about?", "recess play", ["bedtime", "dinner", "snow days"]],
  ["Libraries have shelves of books and quiet places to read.", "What is this mostly about?", "libraries", ["gardens", "kitchens", "barns"]],
  ["A dentist checks teeth and helps keep them clean.", "What is this mostly about?", "dentists", ["farmers", "painters", "drivers"]],
  ["Rain falls from clouds and makes puddles.", "What is this mostly about?", "rain", ["sunshine", "music", "trains"]],
  ["A map shows roads, rivers, and towns.", "What is this mostly about?", "maps", ["snacks", "pets", "coats"]],
  ["Firefighters use hoses and trucks to help people.", "What is this mostly about?", "firefighters", ["teachers", "birds", "flowers"]],
  ["A beach has sand, waves, and shells.", "What is this mostly about?", "the beach", ["the forest", "the classroom", "the kitchen"]],
  ["Gardeners dig, plant, water, and pull weeds.", "What is this mostly about?", "gardeners", ["mail carriers", "dentists", "pilots"]],
  ["Owls sleep in the day and hunt at night.", "What is this mostly about?", "owls", ["dogs", "bees", "frogs"]],
  ["A picnic can have sandwiches, fruit, and a blanket.", "What is this mostly about?", "a picnic", ["a storm", "a bus ride", "a bath"]],
  ["Trains move on tracks and carry people or things.", "What is this mostly about?", "trains", ["boats", "kites", "chairs"]],
  ["A classroom has desks, books, pencils, and students.", "What is this mostly about?", "a classroom", ["a pond", "a road", "a cave"]],
  ["Doctors listen, check, and help people feel better.", "What is this mostly about?", "doctors", ["bakers", "farmers", "swimmers"]],
  ["A pond can have frogs, fish, ducks, and plants.", "What is this mostly about?", "a pond", ["a mountain", "a bedroom", "a store"]],
  ["Winter can bring snow, cold wind, coats, and mittens.", "What is this mostly about?", "winter", ["summer", "spring", "lunch"]]
];

addRows("exp7_main_idea", mainIdea, ([passage, question, answer, wrongs], index, id) => ({
  id,
  grade: "2",
  skill: "main idea",
  difficulty: 4,
  passage,
  question: `${question}`,
  choices: choices(answer, wrongs),
  answer
}));

const causeEffect = [
  ["The ice cream sat in the sun. It melted.", "Why did it melt?", "it sat in the sun", ["it was in the freezer", "it was blue", "it was in a cup"]],
  ["Jada forgot her umbrella. Her hair got wet.", "Why did her hair get wet?", "she forgot her umbrella", ["she wore boots", "the sun came out", "she brushed it"]],
  ["The boy practiced reading every night. He read more smoothly.", "Why did he improve?", "he practiced every night", ["he closed the book", "he lost the book", "he ate lunch"]],
  ["The glass fell off the table. It broke.", "Why did the glass break?", "it fell off the table", ["it was clean", "it was full", "it was clear"]],
  ["The puppy was hungry. It barked by the bowl.", "Why did the puppy bark?", "it was hungry", ["it was asleep", "it had a toy", "it was outside"]],
  ["Mila watered the dry soil. The flower stood tall.", "Why did the flower stand tall?", "Mila watered it", ["Mila hid it", "the soil was dry forever", "the flower was paper"]],
  ["The bell rang. The students lined up.", "Why did students line up?", "the bell rang", ["the room was dark", "the pencils broke", "the window opened"]],
  ["Dad left the gate open. The dog ran out.", "Why did the dog run out?", "the gate was open", ["Dad cooked dinner", "the dog was sleeping", "the bowl was full"]],
  ["A storm came. The game moved inside.", "Why did the game move inside?", "a storm came", ["the sun was bright", "the ball was new", "the grass was green"]],
  ["The backpack zipper broke. The books fell out.", "Why did books fall out?", "the zipper broke", ["the books were heavy", "the pencil was sharp", "the bag was blue"]],
  ["Lena studied the spelling words. She got them right.", "Why did Lena get them right?", "she studied", ["she slept late", "she forgot them", "she closed her eyes"]],
  ["The road was icy. Cars moved slowly.", "Why did cars move slowly?", "the road was icy", ["the road was wide", "cars were red", "drivers sang"]],
  ["The baby was sleepy. He rubbed his eyes.", "Why did the baby rub his eyes?", "he was sleepy", ["he was hungry", "he wanted a ball", "he heard music"]],
  ["The plant got no water. Its leaves drooped.", "Why did leaves droop?", "the plant got no water", ["the pot was red", "the sun was warm", "the room was quiet"]],
  ["The cake stayed in too long. The edges burned.", "Why did the edges burn?", "the cake stayed in too long", ["the cake was round", "the plate was white", "the spoon was clean"]],
  ["The child shared crayons. Everyone could color.", "Why could everyone color?", "crayons were shared", ["the paper was lost", "the room was cold", "the crayons were hidden"]],
  ["The wind blew hard. The kite went higher.", "Why did the kite go higher?", "the wind blew hard", ["the string broke", "the sky was dark", "the kite was on a shelf"]],
  ["The class whispered. The baby kept sleeping.", "Why did the baby keep sleeping?", "the class whispered", ["the class shouted", "the bell rang", "the door slammed"]],
  ["The shoes were muddy. Mom put them by the door.", "Why were the shoes by the door?", "they were muddy", ["they were new", "they were tiny", "they were blue"]],
  ["The team listened to each idea. They solved the puzzle.", "Why did the team solve the puzzle?", "they listened to each idea", ["they ignored each other", "they left the room", "they hid the pieces"]]
];

addRows("exp7_cause_effect", causeEffect, ([passage, question, answer, wrongs], index, id) => ({
  id,
  grade: "2",
  skill: "cause and effect",
  difficulty: 4,
  passage,
  question: `${question}`,
  choices: choices(answer, wrongs),
  answer
}));

const contextClues = [
  ["The pillow was plush, so Ana rested her head on the soft cushion.", "What does plush mean?", "soft", ["rough", "loud", "tiny"]],
  ["The hallway was narrow, so only one child walked through at a time.", "What does narrow mean?", "not wide", ["very bright", "full of food", "easy to hear"]],
  ["The soup was steaming, and Dad warned that it was scorching.", "What does scorching mean?", "very hot", ["very cold", "very quiet", "very small"]],
  ["The kitten was cautious and stepped slowly toward the new dog.", "What does cautious mean?", "careful", ["angry", "sleepy", "messy"]],
  ["The old leaf was brittle and broke when Sam touched it.", "What does brittle mean?", "easy to break", ["very wet", "full of light", "hard to see"]],
  ["The room was spotless after everyone cleaned the desks.", "What does spotless mean?", "very clean", ["very loud", "full of spots", "hard to lift"]],
  ["The child was eager and could not wait to open the gift.", "What does eager mean?", "excited to begin", ["too tired", "not kind", "very cold"]],
  ["The turtle moved at a sluggish pace across the grass.", "What does sluggish mean?", "slow", ["fast", "bright", "sharp"]],
  ["The puppy was drenched after playing in the rain.", "What does drenched mean?", "very wet", ["very dry", "very tall", "very loud"]],
  ["The path was steep, and we had to climb up carefully.", "What does steep mean?", "rising sharply", ["flat and smooth", "full of food", "easy to fold"]],
  ["The child was courteous and said please and thank you.", "What does courteous mean?", "polite", ["noisy", "hungry", "round"]],
  ["The box was vacant after all the toys were removed.", "What does vacant mean?", "empty", ["full", "heavy", "sticky"]],
  ["The tiny candle gave a faint glow in the dark room.", "What does faint mean?", "not strong", ["very bright", "very loud", "full of water"]],
  ["The rabbit was alert and lifted its ears at each sound.", "What does alert mean?", "watchful", ["sleepy", "careless", "broken"]],
  ["The scarf was frayed, with loose threads at the ends.", "What does frayed mean?", "worn at the edges", ["brand new", "made of glass", "full of food"]],
  ["The dog was obedient and sat when Lee gave the command.", "What does obedient mean?", "follows directions", ["runs away", "very sleepy", "hard to see"]],
  ["The water was murky, so we could not see the bottom.", "What does murky mean?", "not clear", ["bright blue", "very dry", "easy to count"]],
  ["The baby gave a brief smile before looking away.", "What does brief mean?", "short", ["very long", "very loud", "made of wood"]],
  ["The child was timid and hid behind the chair.", "What does timid mean?", "shy", ["brave and loud", "very hungry", "full of paint"]]
];

addRows("exp7_context_clues", contextClues, ([passage, question, answer, wrongs], index, id) => ({
  id,
  grade: "2",
  skill: "context clues",
  difficulty: 4,
  passage,
  question: `${question}`,
  choices: choices(answer, wrongs),
  answer
}));

const themes = [
  ["Ava helped a new student find the lunch line.", "What lesson does this teach?", "kindness helps others", ["lines are always long", "lunch is never good", "new students should find the way alone"]],
  ["Noah kept trying the puzzle until the last piece fit.", "What lesson does this teach?", "keep trying", ["give up quickly", "puzzles are food", "never think"]],
  ["Maya told the truth about spilling the paint.", "What lesson does this teach?", "honesty matters", ["hide mistakes", "paint is always blue", "never clean"]],
  ["The team shared ideas and built a strong bridge.", "What lesson does this teach?", "teamwork helps", ["only one person matters", "bridges are soft", "working alone is always better"]],
  ["Leo was nervous but read his poem to the class.", "What lesson does this teach?", "being brave can help", ["never read", "poems are scary forever", "classes are quiet"]],
  ["Emma gave half her snack to a friend who forgot one.", "What lesson does this teach?", "sharing is kind", ["snacks are heavy", "friends never help", "forgetting is best"]],
  ["Sam cleaned the park even though he did not make the mess.", "What lesson does this teach?", "helping the community is good", ["parks should be cleaned only by workers", "never pick up trash", "messes should be left alone"]],
  ["Ivy practiced the song each day before the concert.", "What lesson does this teach?", "practice helps you improve", ["never practice", "songs are only paper", "concerts are always easy"]],
  ["Jamal listened when his partner had a different idea.", "What lesson does this teach?", "listen to others", ["ignore partners", "only one idea should be used", "talking is always bad"]],
  ["Rosa waited patiently for her turn on the swing.", "What lesson does this teach?", "patience matters", ["always push ahead", "swings are books", "waiting is impossible"]],
  ["Kai fixed the block tower after it fell.", "What lesson does this teach?", "try again after mistakes", ["mistakes mean stop", "building is always easy", "falling is winning"]],
  ["Nina invited a quiet child to join the game.", "What lesson does this teach?", "include others", ["only fast players should join", "quiet children should not play", "games are better with fewer people"]],
  ["Owen returned the lost mitten to its owner.", "What lesson does this teach?", "do the right thing", ["keep lost things", "lost things are not important", "found items can be kept"]],
  ["The class saved water by turning off the sink.", "What lesson does this teach?", "care for resources", ["leave water running", "saving water does not matter", "water can be left running"]],
  ["Tara apologized after bumping into her friend.", "What lesson does this teach?", "apologize when needed", ["never say sorry", "friends are chairs", "bumping is best"]],
  ["Ben chose a fair rule so everyone could play.", "What lesson does this teach?", "fairness matters", ["fair rules slow everyone down", "the best player should go first every time", "taking turns is not important"]],
  ["Lily picked up books that fell from the shelf.", "What lesson does this teach?", "help without being asked", ["someone else should clean up", "fallen books can be ignored", "never help"]],
  ["Mateo stayed calm and solved the problem step by step.", "What lesson does this teach?", "stay calm when solving problems", ["panic first", "steps are never useful", "solving problems should be rushed"]],
  ["Zoe thanked her friend for helping with the poster.", "What lesson does this teach?", "show gratitude", ["never thank helpers", "helpers do not need thanks", "work is better alone"]]
];

addRows("exp7_theme", themes, ([passage, question, answer, wrongs], index, id) => ({
  id,
  grade: "2",
  skill: "theme",
  difficulty: 5,
  passage,
  question: `${question}`,
  choices: choices(answer, wrongs),
  answer
}));

fs.writeFileSync(
  "src/data/templateExpansion7.js",
  `export const templateExpansion7 = ${JSON.stringify(templateExpansion7, null, 2)};\n`
);

console.log(`Generated ${templateExpansion7.length} controlled questions.`);
