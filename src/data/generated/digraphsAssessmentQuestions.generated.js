// Generated replacement Digraphs assessment bank. Old digraph banks stay archived only.

import { ALL_DIGRAPH_PATTERNS } from "../digraphPatternData.js";

const DIGRAPH_WORDS = {
  ch: [
    ["chair", "a chair beside a small table"],
    ["cheese", "a piece of cheese on a plate"],
    ["chick", "a fluffy chick standing in soft grass"],
    ["chip", "a single snack chip in a small bowl"],
    ["cherry", "two cherries with stems"],
    ["chain", "a short chain on a table"],
    ["bench", "a park bench under a tree"],
    ["beach", "a clean beach with sand and water"],
    ["lunch", "a lunch box with healthy food"],
    ["watch", "a wristwatch on a table"]
  ],
  sh: [
    ["ship", "a toy ship floating in water"],
    ["sheep", "a sheep standing in a field"],
    ["shell", "a seashell on sand"],
    ["shark", "a friendly cartoon shark swimming in blue water"],
    ["shoe", "one shoe on a mat"],
    ["shirt", "a plain shirt hanging on a hook"],
    ["brush", "a hairbrush on a dresser"],
    ["dish", "a clean dish on a table"],
    ["fish", "a fish swimming in a bowl"],
    ["wish", "a child blowing out birthday candles with no writing"]
  ],
  th: [
    ["thumb", "a child giving a thumbs-up"],
    ["three", "three toy blocks grouped together"],
    ["thorn", "a thorn on a rose stem, shown safely"],
    ["thread", "a spool of thread beside a needle, shown safely"],
    ["thimble", "a thimble on a sewing table"],
    ["thunder", "storm clouds with lightning far away"],
    ["bath", "a bathtub with bubbles"],
    ["moth", "a moth resting on a leaf"],
    ["tooth", "a clean tooth model beside a toothbrush"],
    ["cloth", "a folded cleaning cloth on a table"]
  ],
  wh: [
    ["whale", "a whale swimming in the ocean"],
    ["wheel", "a wheel leaning against a wall"],
    ["whistle", "a whistle on a lanyard"],
    ["whisk", "a kitchen whisk in a mixing bowl"],
    ["wheat", "stalks of wheat in a field"],
    ["whisker", "a close view of a cat's whiskers"],
    ["wheelbarrow", "a wheelbarrow in a garden"],
    ["white", "a white crayon beside white paper"],
    ["whirlpool", "a safe swirling water pattern in a sink"],
    ["wharf", "a wooden wharf by calm water"]
  ],
  ph: [
    ["phone", "a simple phone on a table"],
    ["photo", "a blank photo frame on a shelf"],
    ["dolphin", "a dolphin jumping out of water"],
    ["elephant", "an elephant standing in grass"],
    ["trophy", "a trophy cup with no writing"],
    ["graph", "a simple bar graph with no numbers or letters"],
    ["sphere", "a smooth ball-shaped sphere on a table"],
    ["headphones", "headphones on a desk"],
    ["microphone", "a microphone on a stand"],
    ["pheasant", "a pheasant standing in grass"]
  ],
  ck: [
    ["duck", "a duck swimming in a pond"],
    ["clock", "a round classroom clock with no numbers"],
    ["sock", "one sock on a laundry basket"],
    ["rock", "a smooth rock on the ground"],
    ["truck", "a toy truck on a rug"],
    ["block", "a toy block on a rug"],
    ["brick", "a single brick on the ground"],
    ["stick", "a stick lying on grass"],
    ["lock", "a padlock on a table"],
    ["neck", "a child wearing a scarf around the neck"]
  ]
};

function slug(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function wordPath(word, extension) {
  return `/${extension === "mp3" ? "audio" : "images"}/assessment/digraphs/${slug(word)}.${extension}`;
}

function rotate(values, index) {
  const offset = index % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function wordForPattern(pattern, index) {
  const [word, visualDescription] = DIGRAPH_WORDS[pattern][index % DIGRAPH_WORDS[pattern].length];
  return { pattern, word, visualDescription };
}

function distractorWords(targetPattern, index) {
  return rotate(ALL_DIGRAPH_PATTERNS.filter(pattern => pattern !== targetPattern), index)
    .slice(0, 3)
    .map((pattern, optionIndex) => wordForPattern(pattern, index + optionIndex + 1));
}

function patternOptions(targetPattern, index) {
  return [targetPattern, ...rotate(ALL_DIGRAPH_PATTERNS.filter(pattern => pattern !== targetPattern), index).slice(0, 3)];
}

function partialWord(word, pattern) {
  return word.replace(pattern, "__");
}

function imageCard(item) {
  const image = wordPath(item.word, "webp");
  return {
    id: `digraph_card_${slug(item.word)}`,
    word: item.word,
    value: item.word,
    label: item.word,
    image,
    imagePath: image,
    imageUrl: image,
    alt: `Picture for ${item.word}`
  };
}

function baseQuestion(pattern, word, visualDescription, index, level) {
  const imagePath = wordPath(word, "webp");
  return {
    grade: "K-2",
    skillId: "digraphs",
    skillName: "Digraphs",
    skill: "Digraphs",
    level,
    difficulty: level,
    phase: level,
    assessmentPhase: level,
    phaseTarget: `level_${level}_phase_${level}`,
    targetPattern: pattern,
    phonicsPattern: pattern,
    targetWord: word,
    itemType: "phonics_pattern",
    itemKey: pattern,
    imagePath,
    imageUrl: imagePath,
    targetImage: imagePath,
    targetImagePath: imagePath,
    imageAlt: visualDescription,
    active: true,
    qaStatus: "approved",
    source: "digraphs_replacement_2026_06",
    tags: ["digraphs", pattern, word, `level_${level}`],
    sortIndex: index
  };
}

function makeLevelOneQuestion(pattern, word, visualDescription, patternIndex, wordIndex) {
  const target = { pattern, word, visualDescription };
  const options = [target, ...distractorWords(pattern, wordIndex + patternIndex)].map(imageCard);
  const index = patternIndex * 10 + wordIndex + 1;
  return {
    ...baseQuestion(pattern, word, visualDescription, index, 1),
    id: `digraphs_l1_${String(index).padStart(2, "0")}_${pattern}_${slug(word)}`,
    questionType: "visual_card_choice",
    templateType: "DIGRAPH_IMAGE_CHOICE",
    formatType: "DIGRAPH_IMAGE_CHOICE",
    prompt: `Choose the word that uses the "${pattern}" digraph.`,
    question: `Choose the word that uses the "${pattern}" digraph.`,
    choices: options.map(option => option.word),
    answerOptions: options.map(option => ({ value: option.word, label: option.word })),
    imageCards: options,
    correctAnswer: word,
    answer: word,
    requireOptionImages: true,
    requireOptionAudio: false,
    hideWrittenLabels: false,
    explanation: `The word "${word}" uses the "${pattern}" digraph.`
  };
}

function makeLevelTwoQuestion(pattern, word, visualDescription, patternIndex, wordIndex) {
  const index = patternIndex * 10 + wordIndex + 1;
  const options = patternOptions(pattern, wordIndex + patternIndex);
  return {
    ...baseQuestion(pattern, word, visualDescription, index, 2),
    id: `digraphs_l2_${String(index).padStart(2, "0")}_${pattern}_${slug(word)}`,
    questionType: "ixl_template",
    templateType: "DIGRAPH_COMPLETE_WORD",
    formatType: "DIGRAPH_COMPLETE_WORD",
    prompt: "Choose the correct digraph to complete the word.",
    question: "Choose the correct digraph to complete the word.",
    partialWord: partialWord(word, pattern),
    choices: options,
    answerOptions: options.map(option => ({ value: option, label: option })),
    correctAnswer: pattern,
    answer: pattern,
    explanation: `The digraph "${pattern}" completes "${word}".`
  };
}

export const DIGRAPHS_IMAGE_REQUESTS = ALL_DIGRAPH_PATTERNS.flatMap(pattern =>
  DIGRAPH_WORDS[pattern].map(([word, visualDescription]) => ({
    id: `digraph_image_${slug(word)}`,
    word,
    digraph: pattern,
    outputPath: wordPath(word, "webp"),
    visualDescription,
    prompt: `Create a bright, child-safe literacy assessment illustration showing ${visualDescription}. Do not include printed words, letters, captions, signs, labels, speech bubbles, or UI elements. Use a clean classroom-reader style, simple background, warm natural colors, clear object/action focus, and a 4:3 landscape composition.`
  }))
);

export const DIGRAPHS_AUDIO_REQUESTS = ALL_DIGRAPH_PATTERNS.flatMap(pattern =>
  DIGRAPH_WORDS[pattern].map(([word]) => ({
    id: `digraph_audio_${slug(word)}`,
    word,
    digraph: pattern,
    outputPath: wordPath(word, "mp3"),
    script: word,
    prompt: `Record a clear child-friendly adult voice saying only the word "${word}". Use natural pronunciation, no article, no sentence, no sound effects, and no extra silence.`
  }))
);

export const digraphsAssessmentQuestions = ALL_DIGRAPH_PATTERNS.flatMap((pattern, patternIndex) =>
  DIGRAPH_WORDS[pattern].flatMap(([word, visualDescription], wordIndex) => [
    makeLevelOneQuestion(pattern, word, visualDescription, patternIndex, wordIndex),
    makeLevelTwoQuestion(pattern, word, visualDescription, patternIndex, wordIndex)
  ])
);
