import { getChildWordAsset } from "../data/childAssets.js";
import { starRubric } from "./starRubric.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };
const SPEED_BONUS = { easy: 0, medium: 0.08, hard: 0.16 };

const EASY_LEVELS = [
  [
    ["capital-cat", "Choose the sentence starter", "__ cat sat on the mat.", "The", ["The", "the", "They"], "capital"],
    ["punct-run", "Finish this question", "Can Sam run__", "?", [".", "?", "!"], "punctuation"],
    ["sound-ship", "Choose the missing sound", "sh__p", "i", ["i", "a", "o"], "short vowel"],
    ["word-see", "Fix the tricky word", "I can __ the sun", "see", ["sea", "see", "she"], "sight word"]
  ],
  [
    ["capital-dog", "Choose the sentence starter", "__ dog had a nap.", "A", ["A", "a", "An"], "capital"],
    ["punct-stop", "Show strong feeling at the end of this exclamation", "Stop__", "!", [".", "?", "!"], "punctuation"],
    ["sound-fish", "Choose the missing sound", "f__sh", "i", ["i", "e", "a"], "short vowel"],
    ["word-the", "Fix the tricky word", "__ cat is big", "The", ["She", "The", "They"], "sight word"]
  ],
  [
    ["capital-sun", "Choose the sentence starter", "__ sun is hot.", "The", ["The", "the", "They"], "capital"],
    ["punct-like", "Finish this calm telling sentence", "I like jam__", ".", [".", "?", "!"], "punctuation"],
    ["sound-hen", "Choose the missing sound", "h__n", "e", ["a", "e", "i"], "short vowel"],
    ["word-said", "Fix the tricky word", "Mum __ yes", "said", ["said", "sad", "seed"], "sight word"]
  ],
  [
    ["capital-mum", "Choose the sentence starter", "__ ran fast.", "Mum", ["mum", "Mum", "Mud"], "capital"],
    ["punct-where", "Finish this question", "Where is Pip__", "?", [".", "?", "!"], "punctuation"],
    ["sound-log", "Choose the missing sound", "l__g", "o", ["o", "a", "u"], "short vowel"],
    ["word-was", "Fix the tricky word", "It __ red", "was", ["saw", "was", "wiz"], "sight word"]
  ],
  [
    ["capital-pig", "Choose the sentence starter", "__ pig can dig.", "My", ["My", "my", "May"], "capital"],
    ["punct-wow", "Show strong feeling at the end of this exclamation", "Wow__", "!", [".", "?", "!"], "punctuation"],
    ["sound-cup", "Choose the missing sound", "c__p", "u", ["u", "a", "e"], "short vowel"],
    ["word-have", "Fix the tricky word", "I __ a hat", "have", ["have", "has", "hive"], "sight word"]
  ],
  [
    ["capital-bug", "Choose the sentence starter", "__ bug is small.", "This", ["This", "this", "These"], "capital"],
    ["punct-can", "Finish this question", "Can we play__", "?", [".", "?", "!"], "punctuation"],
    ["sound-map", "Choose the missing sound", "m__p", "a", ["a", "e", "o"], "short vowel"],
    ["word-come", "Fix the tricky word", "__ here", "Come", ["home", "Come", "came"], "sight word"]
  ],
  [
    ["capital-red", "Choose the sentence starter", "__ red fox ran.", "A", ["A", "a", "An"], "capital"],
    ["punct-read", "Finish this calm command", "Read the book__", ".", [".", "?", "!"], "punctuation"],
    ["sound-zip", "Choose the missing sound", "z__p", "i", ["i", "a", "u"], "short vowel"],
    ["word-here", "Fix the tricky word", "Look __", "here", ["hear", "here", "her"], "sight word"]
  ],
  [
    ["capital-hat", "Choose the sentence starter", "__ hat is red.", "My", ["My", "my", "May"], "capital"],
    ["punct-help", "Show strong feeling at the end of this exclamation", "Help__", "!", [".", "?", "!"], "punctuation"],
    ["sound-wet", "Choose the missing sound", "w__t", "e", ["e", "i", "a"], "short vowel"],
    ["word-they", "Fix the tricky word", "__ can hop", "They", ["They", "the", "Them"], "sight word"]
  ],
  [
    ["capital-fox", "Choose the sentence starter", "__ fox hid.", "A", ["A", "a", "An"], "capital"],
    ["punct-like2", "Finish this question", "Do you like it__", "?", [".", "?", "!"], "punctuation"],
    ["sound-van", "Choose the missing sound", "v__n", "a", ["a", "e", "i"], "short vowel"],
    ["word-go", "Fix the tricky word", "We can __", "go", ["go", "got", "to"], "sight word"]
  ],
  [
    ["capital-jam", "Choose the sentence starter", "__ jam is sweet.", "My", ["My", "my", "May"], "capital"],
    ["punct-home", "Finish this calm command", "Go home__", ".", [".", "?", "!"], "punctuation"],
    ["sound-duck", "Choose the missing sound", "d__ck", "u", ["u", "a", "o"], "short vowel"],
    ["word-want", "Fix the tricky word", "I __ a turn", "want", ["want", "went", "was"], "sight word"]
  ]
];

const MEDIUM_LEVELS = [
  [
    ["blend-frog", "Pick the blend", "__og on a log", "fr", ["f", "fr", "tr"], "blend"],
    ["team-rain", "Choose the vowel team", "r__n cloud", "ai", ["a", "ai", "ay"], "vowel team"],
    ["digraph-ship", "Pick the digraph", "__ip has a sail", "sh", ["s", "sh", "ch"], "digraph"],
    ["punct-quote", "Choose the speech mark", "__Hello!__", "\"", ["\"", "'", ","], "punctuation", ["\"", "'"]]
  ],
  [
    ["blend-brush", "Pick the blend", "__ush the dust", "br", ["b", "br", "bl"], "blend"],
    ["team-boat", "Choose the vowel team", "b__t floats", "oa", ["o", "oa", "ow"], "vowel team"],
    ["digraph-chair", "Pick the digraph", "__air is soft", "ch", ["c", "ch", "sh"], "digraph"],
    ["word-their", "Fix the tricky word", "__ books are here", "Their", ["There", "Their", "They"], "sight word"]
  ],
  [
    ["blend-plant", "Pick the blend", "__ant in a pot", "pl", ["p", "pl", "pr"], "blend"],
    ["team-green", "Choose the vowel team", "gr__n leaf", "ee", ["e", "ee", "ea"], "vowel team"],
    ["digraph-thin", "Pick the digraph", "__in ice", "th", ["t", "th", "f"], "digraph"],
    ["comma-list", "Choose the comma", "red__ blue and green", ",", [",", ".", "?"], "punctuation"]
  ],
  [
    ["blend-track", "Pick the blend", "__ack in mud", "tr", ["t", "tr", "dr"], "blend"],
    ["team-moon", "Choose the vowel team", "m__n light", "oo", ["u", "oo", "ou"], "vowel team"],
    ["digraph-whale", "Pick the digraph", "__ale swims", "wh", ["w", "wh", "sh"], "digraph"],
    ["word-were", "Fix the tricky word", "They __ late", "were", ["where", "were", "wear"], "sight word"]
  ],
  [
    ["blend-glide", "Pick the blend", "__ide on ice", "gl", ["g", "gl", "gr"], "blend"],
    ["team-light", "Choose the vowel team", "l__ght star", "igh", ["i", "igh", "ie"], "vowel team"],
    ["digraph-phone", "Pick the digraph", "__one rings", "ph", ["f", "ph", "th"], "digraph"],
    ["apostrophe-pos", "Choose the apostrophe", "Sam__s hat", "'", ["'", ",", "."], "punctuation"]
  ],
  [
    ["blend-storm", "Pick the blend", "__orm cloud", "st", ["s", "st", "sk"], "blend"],
    ["team-snow", "Choose the vowel team", "sn__ falls", "ow", ["o", "ow", "oa"], "vowel team"],
    ["digraph-ring", "Pick the digraph", "ri__ bell", "ng", ["n", "ng", "nk"], "digraph"],
    ["word-which", "Fix the tricky word", "__ path is safe?", "Which", ["Witch", "Which", "With"], "sight word"]
  ],
  [
    ["blend-splash", "Pick the blend", "__ash of water", "spl", ["sl", "spl", "sp"], "blend"],
    ["team-play", "Choose the vowel team", "pl__ all day", "ay", ["a", "ai", "ay"], "vowel team"],
    ["digraph-duck", "Pick the digraph", "du__ pond", "ck", ["k", "ck", "ch"], "digraph"],
    ["comma-name", "Choose the comma", "Yes__ Sam can come", ",", [",", ".", "!"], "punctuation"]
  ],
  [
    ["blend-crisp", "Pick the blend", "__isp snack", "cr", ["c", "cr", "cl"], "blend"],
    ["team-beach", "Choose the vowel team", "b__ch sand", "ea", ["e", "ea", "ee"], "vowel team"],
    ["digraph-queen", "Pick the digraph", "__een has a crown", "qu", ["q", "qu", "kw"], "digraph"],
    ["word-because", "Fix the tricky word", "I ran __ it rained", "because", ["becos", "because", "became"], "sight word"]
  ],
  [
    ["blend-string", "Pick the blend", "__ing on a kite", "str", ["st", "str", "spr"], "blend"],
    ["team-suit", "Choose the vowel team", "s__t fits", "ui", ["u", "ue", "ui"], "vowel team"],
    ["digraph-chick", "Pick the digraph", "__ick peeps", "ch", ["c", "sh", "ch"], "digraph"],
    ["colon-time", "Choose the colon", "3__15", ":", [":", ";", ","], "punctuation"]
  ],
  [
    ["blend-spring", "Pick the blend", "__ing flower", "spr", ["sp", "spr", "str"], "blend"],
    ["team-blue", "Choose the vowel team", "bl__ sky", "ue", ["u", "ue", "ew"], "vowel team"],
    ["digraph-thread", "Pick the digraph", "__read carefully", "th", ["t", "th", "f"], "digraph"],
    ["word-through", "Fix the tricky word", "Go __ the gate", "through", ["throw", "through", "though"], "sight word"]
  ]
];

const HARD_LEVELS = [
  [
    ["contract-cant", "Fix the contraction", "can not = __", "can't", ["cant", "can't", "can,t"], "contraction"],
    ["suffix-happy", "Choose the suffix", "happy + er = __", "happier", ["happyer", "happier", "happiest"], "suffix"],
    ["their-there", "Choose the right word", "__ are two moons", "There", ["Their", "There", "They're"], "usage"],
    ["sentence-starter", "Choose the sentence starter", "__ went to the lake.", "We", ["we", "We", "wee"], "capital"]
  ],
  [
    ["contract-dont", "Fix the contraction", "do not = __", "don't", ["dont", "don't", "do'nt"], "contraction"],
    ["suffix-make", "Choose the suffix", "make + ing = __", "making", ["makeing", "making", "makking"], "suffix"],
    ["two-too", "Choose the right word", "I have __ stars", "two", ["to", "too", "two"], "usage"],
    ["quote-end", "Show strong feeling at the end of this exclamation", "\"Look at that star__\"", "!", [".", "?", "!"], "punctuation"]
  ],
  [
    ["contract-wont", "Fix the contraction", "will not = __", "won't", ["willn't", "wont", "won't"], "contraction"],
    ["suffix-swim", "Choose the suffix", "swim + ing = __", "swimming", ["swiming", "swimming", "swimning"], "suffix"],
    ["its-it's", "Choose the right word", "__ glowing brightly", "It's", ["Its", "It's", "Its'"], "usage"],
    ["comma-clause", "Choose the comma", "After lunch__ we played", ",", [",", ".", ";"], "punctuation"]
  ],
  [
    ["contract-isnt", "Fix the contraction", "is not = __", "isn't", ["isnt", "isn't", "is'nt"], "contraction"],
    ["suffix-run", "Choose the suffix", "run + ing = __", "running", ["runing", "running", "runnning"], "suffix"],
    ["your-youre", "Choose the right word", "__ turn is next", "Your", ["You're", "Your", "Yore"], "usage"],
    ["apostrophe-own", "Choose the apostrophe", "the witch__s broom", "'", ["'", ",", "."], "punctuation"]
  ],
  [
    ["contract-theyre", "Fix the contraction", "they are = __", "they're", ["there", "their", "they're"], "contraction"],
    ["suffix-drop", "Choose the suffix", "drop + ed = __", "dropped", ["droped", "dropped", "dropt"], "suffix"],
    ["which-witch", "Choose the right word", "__ broom is yours?", "Which", ["Witch", "Which", "With"], "usage"],
    ["semicolon", "Join the statements with a semicolon", "It was late__ we went home", ";", [",", ";", ":"], "punctuation"]
  ],
  [
    ["contract-couldnt", "Fix the contraction", "could not = __", "couldn't", ["couldnt", "couldn't", "could'nt"], "contraction"],
    ["suffix-try", "Choose the suffix", "try + ed = __", "tried", ["tryed", "tried", "tryied"], "suffix"],
    ["hear-here", "Choose the right word", "Come __ now", "here", ["hear", "here", "her"], "usage"],
    ["quote-open", "Match the closing speech mark", "__I found it!\"", "\"", ["\"", "'", ","], "punctuation"]
  ],
  [
    ["contract-shes", "Fix the contraction", "she is = __", "she's", ["shes", "she's", "sh'es"], "contraction"],
    ["suffix-bright", "Choose the suffix", "bright + est = __", "brightest", ["brightest", "brightist", "brighttest"], "suffix"],
    ["weather-whether", "Choose the right word", "__ we go depends on rain", "Whether", ["Weather", "Whether", "Wether"], "usage"],
    ["dash-break", "Choose the dash", "Wait __ don't go", "-", ["-", ",", ":"], "punctuation"]
  ],
  [
    ["contract-ive", "Fix the contraction", "I have = __", "I've", ["Ive", "I've", "I'v"], "contraction"],
    ["suffix-noisy", "Choose the suffix", "noisy + er = __", "noisier", ["noisyer", "noisier", "noisyest"], "suffix"],
    ["passed-past", "Choose the right word", "We walked __ the tree", "past", ["passed", "past", "paste"], "usage"],
    ["colon-list", "Choose the colon", "Bring three things__ hat, map, lamp", ":", [":", ";", ","], "punctuation"]
  ],
  [
    ["contract-weve", "Fix the contraction", "we have = __", "we've", ["weve", "we've", "we'v"], "contraction"],
    ["suffix-shine", "Choose the suffix", "shine + y = __", "shiny", ["shiney", "shiny", "shinie"], "suffix"],
    ["peace-piece", "Choose the right word", "One __ is missing", "piece", ["peace", "piece", "peas"], "usage"],
    ["comma-direct", "Choose the comma", "Yes__ I can help", ",", [",", ".", "!"], "punctuation"]
  ],
  [
    ["contract-id", "Fix the contraction", "I would = __", "I'd", ["Id", "I'd", "I,d"], "contraction"],
    ["suffix-magic", "Choose the suffix", "magic + al = __", "magical", ["magicly", "magical", "magickal"], "suffix"],
    ["to-too", "Choose the right word", "It is __ bright", "too", ["to", "two", "too"], "usage"],
    ["sentence-fix", "Choose the capital", "__ moon is bright.", "The", ["the", "The", "They"], "capital"]
  ]
];

const LEVELS = { easy: EASY_LEVELS, medium: MEDIUM_LEVELS, hard: HARD_LEVELS };
const WORLD_TITLES = {
  meadow: ["Meadow Grove", "Lantern Copse", "Oak Sentence Woods", "Wildflower Clearing"],
  dino: ["Volcano Grove", "Fossil Fernwood", "Fern Swamp", "Amber Clearing"],
  moonwood: ["Moonwood Grove", "Lantern Hollow", "Mushroom Walk", "Crescent Woods"]
};

// Content identity for the committed word illustration; never child-facing metadata.
function cueForId(id) {
  return String(id || "")
    .replace(/^[^-]+-/, "")
    .replace(/[-_]+/g, " ");
}

const REPAIR_BLANK = "__";

export function completedSentenceForRepair(repair, answer = repair?.answer) {
  return String(repair?.display || "").split(REPAIR_BLANK).join(String(answer || ""));
}

export function acceptedRepairAnswers(repair) {
  return Array.isArray(repair?.acceptedAnswers) && repair.acceptedAnswers.length
    ? repair.acceptedAnswers
    : [repair?.answer];
}

export function isAcceptedRepairAnswer(repair, answer) {
  return acceptedRepairAnswers(repair).includes(answer);
}

function validateRepair(repair) {
  const blankCount = (repair.display.match(/__/g) || []).length;
  if (blankCount < 1 || blankCount > 2) {
    throw new Error(`${repair.id} must have one repair blank, or two paired blanks`);
  }
  if (!repair.answer || !repair.options.includes(repair.answer)) {
    throw new Error(`${repair.id} must include its canonical answer in options`);
  }
  if (new Set(repair.options).size !== repair.options.length) {
    throw new Error(`${repair.id} options must be unique`);
  }
  const acceptedAnswers = acceptedRepairAnswers(repair);
  if (!acceptedAnswers.every(answer => repair.options.includes(answer))) {
    throw new Error(`${repair.id} accepted answers must be presented options`);
  }
  const completedSentence = completedSentenceForRepair(repair);
  if (completedSentence.includes(REPAIR_BLANK)) {
    throw new Error(`${repair.id} completed output still contains a blank`);
  }
  return Object.freeze({
    ...repair,
    acceptedAnswers: Object.freeze([...new Set(acceptedAnswers)]),
    completedSentence
  });
}

function rotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

export function starGalleryPicture(repair) {
  const asset = getChildWordAsset(repair?.cue);
  return asset?.image ? { src: asset.image, alt: asset.alt || repair.cue } : null;
}

function repairFromTuple(tuple, level, index) {
  const [id, prompt, display, answer, options, category, acceptedAnswers] = tuple;
  return validateRepair({
    id,
    prompt,
    display,
    cue: cueForId(id),
    answer,
    options: rotate(options, level + index),
    category,
    acceptedAnswers
  });
}

export function starGalleryLevel(difficulty = "easy", levelIndex = 0) {
  const safeDifficulty = WORLDS[difficulty] ? difficulty : "easy";
  const level = Math.max(0, Math.min(9, Number(levelIndex) || 0));
  const repairs = LEVELS[safeDifficulty][level].map((tuple, index) => repairFromTuple(tuple, level, index));
  const world = WORLDS[safeDifficulty];
  const categories = [...new Set(repairs.map(repair => repair.category))];
  return {
    difficulty: safeDifficulty,
    level,
    world,
    title: `${WORLD_TITLES[world][level % WORLD_TITLES[world].length]} ${Math.floor(level / WORLD_TITLES[world].length) + 1}`,
    objective: `Fix ${repairs.length} ${categories.join(" + ")} sentences`,
    focusSkill: categories.join(" + "),
    driftSpeed: 0.38 + level * 0.038 + SPEED_BONUS[safeDifficulty],
    cardCount: safeDifficulty === "easy" ? 3 : safeDifficulty === "medium" ? 4 : 5,
    items: repairs.map((repair, index) => ({
      id: `${safeDifficulty}-${level}-${repair.id}`,
      repairs: [repair],
      galleryTitle: `Sentence ${level + 1}.${index + 1}`
    }))
  };
}

export function starGalleryLadder(difficulty = "easy") {
  return Array.from({ length: 10 }, (_, index) => starGalleryLevel(difficulty, index));
}

export function starGalleryStars({ correct, total, mistakes } = {}) {
  return starRubric({ correct, total, mistakes, deaths: 0 });
}
