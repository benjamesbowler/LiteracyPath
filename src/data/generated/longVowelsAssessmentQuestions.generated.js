// Generated replacement Long Vowels and Silent E assessment bank.

import {
  LONG_VOWEL_TEAM_PATTERNS,
  SILENT_E_PATTERNS
} from "../longVowelPatternData.js";

const LEVEL_ONE_WORDS = [
  ["cake", "a birthday cake with candles but no writing", "a_e"],
  ["lake", "a calm lake with trees in the background", "a_e"],
  ["gate", "a garden gate standing open", "a_e"],
  ["plane", "a toy airplane on a table", "a_e"],
  ["snake", "a friendly green snake on grass", "a_e"],
  ["grape", "a bunch of grapes on a plate", "a_e"],
  ["theme", "a space-themed party table with no words or letters", "e_e"],
  ["these", "a child pointing to a small group of nearby apples", "e_e"],
  ["scene", "a simple theater stage scene with curtains and no text", "e_e"],
  ["concrete", "a clean concrete sidewalk", "e_e"],
  ["complete", "a completed jigsaw puzzle with no picture text", "e_e"],
  ["Pete", "a smiling child named Pete standing by a backpack with no name label", "e_e"],
  ["bike", "a child's bike beside a path", "i_e"],
  ["kite", "a colorful kite flying in the sky", "i_e"],
  ["five", "five toy blocks grouped together with no printed numbers", "i_e"],
  ["slide", "a playground slide", "i_e"],
  ["prize", "a wrapped prize box with a bow and no tag", "i_e"],
  ["smile", "a child smiling", "i_e"],
  ["home", "a small house with a front door", "o_e"],
  ["rope", "a coiled rope on the ground", "o_e"],
  ["cone", "an ice cream cone with no writing", "o_e"],
  ["rose", "a rose flower in a vase", "o_e"],
  ["bone", "a clean dog bone on a mat", "o_e"],
  ["note", "a blank sticky note on a desk", "o_e"],
  ["cube", "a toy cube on a rug", "u_e"],
  ["flute", "a flute on a music stand with no sheet music text", "u_e"],
  ["mule", "a mule standing in a field", "u_e"],
  ["tube", "a cardboard tube on a craft table", "u_e"],
  ["huge", "a huge beach ball beside a small beach ball", "u_e"],
  ["cute", "a cute stuffed toy on a bed", "u_e"]
];

const LEVEL_TWO_WORDS = [
  ["tray", "a serving tray on a table", "ay"],
  ["play", "children playing with a ball", "ay"],
  ["rain", "rain falling outside a window", "ai"],
  ["train", "a toy train on a track", "ai"],
  ["sky", "a bright blue sky with clouds", "y"],
  ["fly", "a fly resting on a leaf", "y"],
  ["pie", "a slice of pie on a plate", "ie"],
  ["tie", "a necktie on a chair", "ie"],
  ["dew", "dew drops on grass", "ew"],
  ["chew", "a child chewing a snack safely", "ew"],
  ["moon", "the moon in a night sky", "oo"],
  ["spoon", "a spoon beside a bowl", "oo"],
  ["tree", "a tree in a park", "ee"],
  ["sheep", "a sheep standing in a field", "ee"],
  ["light", "a lamp giving off light", "igh"],
  ["night", "a night sky with stars", "igh"],
  ["boat", "a small boat on calm water", "oa"],
  ["goat", "a goat standing on grass", "oa"],
  ["toe", "a child's toe sticking out of a sandal", "oe"],
  ["doe", "a doe standing in a meadow", "oe"],
  ["leaf", "a green leaf on a branch", "ea"],
  ["beach", "a clean beach with sand and water", "ea"],
  ["snow", "snow falling on a yard", "ow"],
  ["bowl", "a bowl on a table", "ow"],
  ["blue", "a blue crayon beside plain paper", "ue"],
  ["glue", "a glue bottle on a craft table with no label", "ue"],
  ["fruit", "a bowl of fruit", "ui"],
  ["suit", "a suit jacket hanging neatly", "ui"],
  ["eight", "eight small stones grouped together with no printed numbers", "eigh"],
  ["sleigh", "a sleigh on snow with no writing", "eigh"]
];

function slug(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function wordPath(word, extension) {
  return `/${extension === "mp3" ? "audio" : "images"}/assessment/long-vowels/${slug(word)}.${extension}`;
}

function rotate(values, index) {
  const offset = index % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function patternOptions(targetPattern, allPatterns, index) {
  return [targetPattern, ...rotate(allPatterns.filter(pattern => pattern !== targetPattern), index).slice(0, 3)];
}

function partialWord(word, pattern) {
  return word.replace(pattern, "_".repeat(pattern.length));
}

function baseQuestion(word, visualDescription, pattern, index, level) {
  const imagePath = wordPath(word, "webp");
  const audioPath = wordPath(word, "mp3");
  return {
    grade: "K-2",
    skillId: "long_vowels",
    skillName: "Long Vowels and Silent E",
    skill: "Long Vowels and Silent E",
    level,
    difficulty: level,
    phase: Math.ceil(index / 15),
    assessmentPhase: Math.ceil(index / 15),
    phaseTarget: `level_${level}_phase_${Math.ceil(index / 15)}`,
    targetPattern: pattern,
    phonicsPattern: pattern,
    targetWord: word,
    audioText: word,
    itemType: "phonics_pattern",
    itemKey: pattern,
    imagePath,
    imageUrl: imagePath,
    targetImage: imagePath,
    targetImagePath: imagePath,
    audioPath,
    audioUrl: audioPath,
    pendingAudio: true,
    imageAlt: visualDescription,
    active: true,
    qaStatus: "approved",
    source: "long_vowels_replacement_2026_06",
    tags: ["long_vowels", pattern, word, `level_${level}`],
    sortIndex: index
  };
}

function makeLevelOneQuestion([word, visualDescription, pattern], index) {
  const options = patternOptions(pattern, SILENT_E_PATTERNS, index - 1);
  return {
    ...baseQuestion(word, visualDescription, pattern, index, 1),
    id: `long_vowels_l1_${String(index).padStart(2, "0")}_${pattern}_${slug(word)}`,
    questionType: "multiple_choice",
    templateType: "LONG_VOWEL_SILENT_E_PATTERN",
    formatType: "LONG_VOWEL_SILENT_E_PATTERN",
    prompt: "Choose the silent-e spelling pattern for the word.",
    question: "Choose the silent-e spelling pattern for the word.",
    choices: options,
    answerOptions: options.map(option => ({ value: option, label: option })),
    correctAnswer: pattern,
    answer: pattern,
    explanation: `The word "${word}" uses the "${pattern}" silent-e pattern.`
  };
}

function makeLevelTwoQuestion([word, visualDescription, pattern], index) {
  const options = patternOptions(pattern, LONG_VOWEL_TEAM_PATTERNS, index - 1);
  return {
    ...baseQuestion(word, visualDescription, pattern, index, 2),
    id: `long_vowels_l2_${String(index).padStart(2, "0")}_${pattern}_${slug(word)}`,
    questionType: "ixl_template",
    templateType: "LONG_VOWEL_TEAM_COMPLETE",
    formatType: "LONG_VOWEL_TEAM_COMPLETE",
    prompt: "Choose the spelling pattern that completes the word.",
    question: "Choose the spelling pattern that completes the word.",
    partialWord: partialWord(word, pattern),
    choices: options,
    answerOptions: options.map(option => ({ value: option, label: option })),
    correctAnswer: pattern,
    answer: pattern,
    explanation: `The spelling pattern "${pattern}" completes "${word}".`
  };
}

export const LONG_VOWELS_IMAGE_REQUESTS = [...LEVEL_ONE_WORDS, ...LEVEL_TWO_WORDS].map(([word, visualDescription, pattern]) => ({
  id: `long_vowel_image_${slug(word)}`,
  word,
  pattern,
  outputPath: wordPath(word, "webp"),
  visualDescription,
  prompt: `Create a bright, child-safe K-2 literacy assessment illustration showing ${visualDescription}. Do not include printed words, letters, captions, signs, labels, speech bubbles, UI elements, or readable text. Use a clean classroom-reader style, simple background, warm natural colors, clear object/action focus, and a 4:3 landscape composition.`
}));

export const LONG_VOWELS_AUDIO_REQUESTS = [...LEVEL_ONE_WORDS, ...LEVEL_TWO_WORDS].map(([word, , pattern]) => ({
  id: `long_vowel_audio_${slug(word)}`,
  word,
  pattern,
  outputPath: wordPath(word, "mp3"),
  script: word,
  prompt: `Record a clear child-friendly adult voice saying only the word "${word}". Use natural pronunciation, no article, no sentence, no sound effects, and no extra silence.`
}));

export const longVowelsAssessmentQuestions = [
  ...LEVEL_ONE_WORDS.map((item, index) => makeLevelOneQuestion(item, index + 1)),
  ...LEVEL_TWO_WORDS.map((item, index) => makeLevelTwoQuestion(item, index + 1))
];
