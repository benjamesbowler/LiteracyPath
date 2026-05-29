// Generated-quality HFW assessment bank. Keep target words out of recognition prompts.

import {
  HFW_WORDS_1_25,
  HFW_WORDS_26_50,
  HFW_WORDS_51_75,
  HFW_WORDS_76_100,
  HFW_WORDS_51_100
} from "../highFrequencyWordBands.js";

export const HFW_FUTURE_SPLIT_BANDS = {
  hfw_51_75: HFW_WORDS_51_75,
  hfw_76_100: HFW_WORDS_76_100
};

const BAND_CONFIGS = [
  {
    skillId: "hfw_1_25",
    skillName: "High-Frequency Words 1-25",
    words: HFW_WORDS_1_25,
    reviewWords: []
  },
  {
    skillId: "hfw_26_50",
    skillName: "High-Frequency Words 26-50",
    words: HFW_WORDS_26_50,
    reviewWords: HFW_WORDS_1_25
  },
  {
    skillId: "hfw_51_100",
    skillName: "High-Frequency Words 51-100",
    words: HFW_WORDS_51_100,
    reviewWords: [...HFW_WORDS_1_25, ...HFW_WORDS_26_50],
    futureSplit: ["hfw_51_75", "hfw_76_100"]
  }
];

const BLOCKED_HFW_AUDIO_WORDS = new Set(["for"]);

const normalizeWord = value =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slug = value => normalizeWord(value).replace(/\s+/g, "-");

const WORD_SENTENCES = {
  a: "I see ___ cat.",
  am: "I ___ ready.",
  and: "Mom ___ I read.",
  big: "The box is ___.",
  can: "We ___ jump.",
  come: "Please ___ here.",
  down: "Sit ___ here.",
  for: "This book is ___ you.",
  go: "We ___ home.",
  i: "___ can read.",
  in: "The toy is ___ the box.",
  is: "The sun ___ hot.",
  it: "I see ___.",
  like: "I ___ this book.",
  little: "The bug is ___.",
  look: "___ at the cat.",
  me: "Come with ___.",
  my: "I put on ___ hat.",
  not: "I am ___ done.",
  on: "The cup is ___ the table.",
  one: "I have ___ apple.",
  play: "We ___ outside.",
  said: "Dad ___ yes.",
  see: "I ___ a red ball.",
  that: "I like ___ book.",
  the: "I see ___ dog.",
  to: "We go ___ school.",
  up: "Look ___ now.",
  want: "I ___ a turn.",
  we: "___ can help.",
  with: "Read ___ me.",
  you: "I see ___.",
  after: "We eat ___ class.",
  all: "___ the kids read.",
  are: "They ___ here.",
  around: "We walk ___ the tree.",
  asked: "She ___ for help.",
  away: "The bird flew ___.",
  blue: "The sky is ___.",
  but: "I ran, ___ I stopped.",
  came: "He ___ home.",
  cold: "The ice is ___.",
  find: "Can you ___ it?",
  from: "This note is ___ Mom.",
  funny: "That joke is ___.",
  have: "I ___ a book.",
  he: "___ has a hat.",
  help: "I can ___ you.",
  helps: "She ___ me.",
  here: "Come ___ now.",
  into: "Put it ___ the bag.",
  jump: "I can ___.",
  just: "I ___ saw it.",
  made: "We ___ a fort.",
  make: "I can ___ lunch.",
  now: "Read it ___.",
  open: "Please ___ the door.",
  red: "The ball is ___.",
  round: "The coin is ___.",
  run: "We ___ fast.",
  she: "___ can read.",
  sleep: "I will ___ soon.",
  then: "We read, ___ we write.",
  they: "___ are ready.",
  this: "___ is my book.",
  three: "I see ___ birds.",
  two: "I have ___ shoes.",
  under: "The toy is ___ the bed.",
  very: "It is ___ hot.",
  was: "It ___ fun.",
  went: "We ___ home.",
  were: "They ___ happy.",
  what: "___ is that?",
  when: "___ do we go?",
  where: "___ is my hat?",
  will: "I ___ read.",
  yellow: "The sun is ___.",
  again: "Read it ___.",
  an: "I see ___ egg.",
  any: "Do you have ___?",
  as: "Run ___ fast as you can.",
  ask: "I will ___ Mom.",
  be: "I will ___ kind.",
  before: "Wash hands ___ lunch.",
  by: "Sit ___ me.",
  could: "I ___ help.",
  every: "Read ___ day.",
  fly: "Birds can ___.",
  found: "I ___ my hat.",
  give: "Please ___ me one.",
  going: "We are ___ home.",
  had: "I ___ fun.",
  has: "She ___ a book.",
  her: "This is ___ bag.",
  him: "I can help ___.",
  his: "That is ___ cap.",
  how: "___ did you do it?",
  know: "I ___ that word.",
  let: "___ me try.",
  live: "We ___ here.",
  may: "You ___ go.",
  must: "We ___ stop.",
  new: "I have a ___ book.",
  of: "One ___ them ran.",
  old: "This book is ___.",
  once: "Read it ___.",
  our: "This is ___ class.",
  out: "Go ___ to play.",
  over: "Jump ___ the line.",
  please: "___ help me.",
  pretty: "The flower is ___.",
  put: "___ it here.",
  read: "We ___ books.",
  saw: "I ___ a bird.",
  say: "What did you ___?",
  some: "I want ___ water.",
  soon: "We will go ___.",
  stop: "Please ___ now.",
  take: "___ one card.",
  thank: "___ you for helping.",
  them: "Give it to ___.",
  think: "I ___ it is fun.",
  walk: "We ___ to class.",
  well: "You did ___.",
  white: "The snow is ___.",
  who: "___ is here?",
  yes: "I said ___."
};

function sentenceFor(word) {
  return WORD_SENTENCES[word] || `I can read the word ___.`;
}

function correctSentenceFor(word) {
  return sentenceFor(word).replace("___", word);
}

function rotate(values, offset) {
  if (!values.length) return [];
  return values.map((_, index) => values[(index + offset) % values.length]);
}

function wordDistractors(word, bandWords, reviewWords, index) {
  const pool = [...new Set([...bandWords, ...reviewWords])]
    .map(normalizeWord)
    .filter(item => item && item !== word);
  return rotate(pool, index * 5).slice(0, 3);
}

function wordOptions(word, bandWords, reviewWords, index) {
  return [word, ...wordDistractors(word, bandWords, reviewWords, index)].slice(0, 4);
}

function sentencePlacementOptions(word) {
  const sentence = correctSentenceFor(word);
  const sentenceNoPunct = sentence.replace(/[.?!]$/, "").replace(/\s+/g, " ").trim();
  const candidates = [
    sentence,
    `${sentenceNoPunct} ${word}.`,
    `${word} ${sentenceNoPunct}.`,
    `${sentenceNoPunct} ${word} ${word}.`,
    `${word} ${word} ${sentenceNoPunct}.`
  ].map(text => text.replace(/\s+([.?!])/g, "$1"));
  const seen = new Set();
  return candidates.filter(text => {
    const normalized = normalizeWord(text);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).slice(0, 4);
}

function hfwAudioPath(word) {
  return `/audio/child-mode/clean-human/hfw/${slug(word)}.mp3`;
}

function baseQuestion({ config, word, index, variant, level, phase, templateType, prompt, answerOptions, correctAnswer, extra = {} }) {
  return {
    id: `hfw_quality_${slug(config.skillId)}_${slug(word)}_${variant}`,
    grade: "K-2",
    skillId: config.skillId,
    skillName: config.skillName,
    skill: config.skillName,
    level,
    difficulty: level,
    phase,
    assessmentPhase: phase,
    phaseTarget: `level_${level}_phase_${phase}`,
    templateType,
    formatType: templateType,
    questionType: "multiple_choice",
    prompt,
    question: prompt,
    targetWord: word,
    itemType: "sight_word",
    itemKey: word,
    correctAnswer,
    answer: correctAnswer,
    answerOptions,
    choices: answerOptions,
    audioText: templateType === "HFW_AUDIO_FIND_WORD" ? word : "",
    audioPath: templateType === "HFW_AUDIO_FIND_WORD" ? hfwAudioPath(word) : "",
    audioUrl: templateType === "HFW_AUDIO_FIND_WORD" ? hfwAudioPath(word) : "",
    active: !(templateType === "HFW_AUDIO_FIND_WORD" && BLOCKED_HFW_AUDIO_WORDS.has(word)),
    source: "hfw_quality_generated",
    tags: ["hfw", "quality-format", config.skillId, `level-${level}`, `phase-${phase}`, ...(config.futureSplit || [])],
    ...extra
  };
}

function makeQuestionsForWord(config, word, index) {
  const cleanWord = normalizeWord(word);
  const options = wordOptions(cleanWord, config.words, config.reviewWords, index);
  const clozeSentence = sentenceFor(cleanWord);
  const placementOptions = sentencePlacementOptions(cleanWord);
  const correctSentence = placementOptions[0];

  return [
    baseQuestion({
      config,
      word: cleanWord,
      index,
      variant: "audio_l1_p1",
      level: 1,
      phase: 1,
      templateType: "HFW_AUDIO_FIND_WORD",
      prompt: "Listen to the word. Which word did you hear?",
      answerOptions: options,
      correctAnswer: cleanWord
    }),
    baseQuestion({
      config,
      word: cleanWord,
      index,
      variant: "cloze_l1_p2",
      level: 1,
      phase: 2,
      templateType: "HFW_SENTENCE_CLOZE",
      prompt: "Choose the word that completes the sentence.",
      answerOptions: options,
      correctAnswer: cleanWord,
      extra: {
        sentence: clozeSentence,
        passage: clozeSentence
      }
    }),
    baseQuestion({
      config,
      word: cleanWord,
      index,
      variant: "placement_l2_p1",
      level: 2,
      phase: 1,
      templateType: "HFW_SENTENCE_PLACEMENT",
      prompt: "Choose the sentence that uses the word correctly.",
      answerOptions: placementOptions,
      correctAnswer: correctSentence,
      extra: {
        context: `Word: ${cleanWord}`,
        sentence: `Word: ${cleanWord}`
      }
    }),
    baseQuestion({
      config,
      word: cleanWord,
      index,
      variant: "cloze_l2_p2",
      level: 2,
      phase: 2,
      templateType: "HFW_SENTENCE_CLOZE",
      prompt: "Choose the word that completes the sentence.",
      answerOptions: rotate(options, 2),
      correctAnswer: cleanWord,
      extra: {
        sentence: clozeSentence,
        passage: clozeSentence
      }
    })
  ];
}

export const hfwAssessmentQuestions = BAND_CONFIGS.flatMap(config =>
  config.words.flatMap((word, index) => makeQuestionsForWord(config, word, index))
);
