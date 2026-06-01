// Generated-quality no-audio HFW assessment bank. Keep audio fields out of this file.

import {
  HFW_WORDS_1_25,
  HFW_WORDS_26_50,
  HFW_WORDS_51_75,
  HFW_WORDS_76_100
} from "../highFrequencyWordBands.js";

const HFW_BAND_CONFIGS = [
  { skillId: "hfw_1_25", skillName: "High-Frequency Words 1-25", words: HFW_WORDS_1_25 },
  { skillId: "hfw_26_50", skillName: "High-Frequency Words 26-50", words: HFW_WORDS_26_50 },
  { skillId: "hfw_51_75", skillName: "High-Frequency Words 51-75", words: HFW_WORDS_51_75 },
  { skillId: "hfw_76_100", skillName: "High-Frequency Words 76-100", words: HFW_WORDS_76_100 }
];

const HFW_EXTRA_VARIANT_COUNT = 5;

const HFW_SCENES = {
  "the": {
    "sentence": "I see ___ dog.",
    "visual": "one friendly dog sitting beside a child in a sunny park"
  },
  "to": {
    "sentence": "We go ___ school.",
    "visual": "two children walking toward a small school building with backpacks"
  },
  "and": {
    "sentence": "Mom ___ I read.",
    "visual": "a parent and child reading one picture book together on a sofa"
  },
  "a": {
    "sentence": "I see ___ cat.",
    "visual": "one cat curled on a soft rug beside a child"
  },
  "i": {
    "sentence": "___ can read.",
    "visual": "one smiling child holding an open picture book"
  },
  "you": {
    "sentence": "Can ___ jump?",
    "visual": "one child jumping over a chalk line on a playground"
  },
  "it": {
    "sentence": "I found ___.",
    "visual": "a child pointing to a small toy on the floor"
  },
  "in": {
    "sentence": "The toy is ___ the box.",
    "visual": "a toy bear sitting inside an open box"
  },
  "said": {
    "sentence": "Dad ___ yes.",
    "visual": "a dad smiling and giving a thumbs-up to a child"
  },
  "for": {
    "sentence": "This book is ___ you.",
    "visual": "a child handing a book to a friend"
  },
  "up": {
    "sentence": "Look ___ at the kite.",
    "visual": "a child looking up at a bright kite in the sky"
  },
  "look": {
    "sentence": "___ at the bird.",
    "visual": "a child pointing at a bird on a fence"
  },
  "is": {
    "sentence": "The sun ___ hot.",
    "visual": "a bright sun shining over a child wearing a hat"
  },
  "go": {
    "sentence": "We ___ home.",
    "visual": "two children walking along a path toward a house"
  },
  "we": {
    "sentence": "___ can help.",
    "visual": "two children carrying classroom supplies together"
  },
  "little": {
    "sentence": "The bug is ___.",
    "visual": "a tiny ladybug on a large green leaf"
  },
  "can": {
    "sentence": "We ___ swim.",
    "visual": "children swimming safely in a clear pool"
  },
  "see": {
    "sentence": "I ___ a red ball.",
    "visual": "a child looking at a red ball on the grass"
  },
  "me": {
    "sentence": "Come with ___.",
    "visual": "one child inviting another child to walk together"
  },
  "my": {
    "sentence": "This is ___ hat.",
    "visual": "a child holding their own bright hat"
  },
  "on": {
    "sentence": "The cup is ___ the table.",
    "visual": "a cup sitting on a kitchen table"
  },
  "one": {
    "sentence": "I have ___ apple.",
    "visual": "a child holding one red apple"
  },
  "big": {
    "sentence": "The box is ___.",
    "visual": "a large cardboard box next to a small chair"
  },
  "come": {
    "sentence": "Please ___ here.",
    "visual": "a teacher gently waving a child toward the reading rug"
  },
  "like": {
    "sentence": "I ___ this book.",
    "visual": "a child smiling while holding a favorite book"
  },
  "down": {
    "sentence": "Sit ___ here.",
    "visual": "a child sitting down on a classroom rug"
  },
  "not": {
    "sentence": "I am ___ done.",
    "visual": "a child still coloring a picture at a desk"
  },
  "play": {
    "sentence": "We ___ outside.",
    "visual": "children playing with a ball outside"
  },
  "all": {
    "sentence": "___ the kids read.",
    "visual": "a group of children reading books together"
  },
  "are": {
    "sentence": "They ___ here.",
    "visual": "several children standing together at the classroom door"
  },
  "as": {
    "sentence": "Run ___ fast as you can.",
    "visual": "a child running quickly on a playground track"
  },
  "be": {
    "sentence": "I will ___ kind.",
    "visual": "a child sharing crayons with a classmate"
  },
  "but": {
    "sentence": "I ran, ___ I stopped.",
    "visual": "a child stopping at the end of a running game"
  },
  "came": {
    "sentence": "He ___ home.",
    "visual": "a boy arriving at the front door of a house"
  },
  "from": {
    "sentence": "This note is ___ Mom.",
    "visual": "a child receiving a note from a parent"
  },
  "have": {
    "sentence": "I ___ a book.",
    "visual": "a child holding a book at a desk"
  },
  "he": {
    "sentence": "___ has a hat.",
    "visual": "a boy wearing a blue hat"
  },
  "she": {
    "sentence": "___ can read.",
    "visual": "a girl reading a picture book"
  },
  "they": {
    "sentence": "___ are ready.",
    "visual": "three children with backpacks ready to leave"
  },
  "was": {
    "sentence": "It ___ fun.",
    "visual": "children smiling after a game with blocks"
  },
  "with": {
    "sentence": "Read ___ me.",
    "visual": "two children reading the same book together"
  },
  "that": {
    "sentence": "I like ___ book.",
    "visual": "a child pointing to a book on a shelf"
  },
  "then": {
    "sentence": "We read, ___ we write.",
    "visual": "children reading first and then writing in notebooks"
  },
  "this": {
    "sentence": "___ is my bag.",
    "visual": "a child pointing to a backpack beside a chair"
  },
  "what": {
    "sentence": "___ is that?",
    "visual": "a child wondering about a wrapped object on a table"
  },
  "when": {
    "sentence": "___ do we go?",
    "visual": "a child looking at a clock near the classroom door"
  },
  "where": {
    "sentence": "___ is my hat?",
    "visual": "a child searching for a hat near cubbies"
  },
  "will": {
    "sentence": "I ___ read.",
    "visual": "a child choosing a book to read next"
  },
  "help": {
    "sentence": "I can ___ you.",
    "visual": "one child helping another pick up pencils"
  },
  "make": {
    "sentence": "I can ___ lunch.",
    "visual": "a child helping prepare a simple sandwich"
  },
  "after": {
    "sentence": "We eat ___ class.",
    "visual": "children eating a snack after a lesson"
  },
  "again": {
    "sentence": "Read it ___.",
    "visual": "a child asking for a story to be read another time"
  },
  "an": {
    "sentence": "I see ___ egg.",
    "visual": "a child looking at one egg in a nest"
  },
  "any": {
    "sentence": "Do you have ___ crayons?",
    "visual": "a child looking into an almost empty crayon box"
  },
  "around": {
    "sentence": "We walk ___ the tree.",
    "visual": "children walking in a circle around a tree"
  },
  "ask": {
    "sentence": "I will ___ Mom.",
    "visual": "a child talking to a parent in the kitchen"
  },
  "away": {
    "sentence": "The bird flew ___.",
    "visual": "a bird flying away from a branch"
  },
  "before": {
    "sentence": "Wash hands ___ lunch.",
    "visual": "a child washing hands before eating lunch"
  },
  "by": {
    "sentence": "Sit ___ me.",
    "visual": "two children sitting side by side on a rug"
  },
  "could": {
    "sentence": "I ___ help.",
    "visual": "a child offering to help carry books"
  },
  "every": {
    "sentence": "Read ___ day.",
    "visual": "a child reading on a calendar-marked day"
  },
  "find": {
    "sentence": "Can you ___ it?",
    "visual": "a child searching under a table for a toy"
  },
  "fly": {
    "sentence": "Birds can ___.",
    "visual": "birds flying above a garden"
  },
  "found": {
    "sentence": "I ___ my hat.",
    "visual": "a child finding a hat under a bench"
  },
  "funny": {
    "sentence": "That joke is ___.",
    "visual": "children laughing together at a silly puppet"
  },
  "give": {
    "sentence": "Please ___ me one.",
    "visual": "a child handing one block to a friend"
  },
  "going": {
    "sentence": "We are ___ home.",
    "visual": "children leaving school with backpacks"
  },
  "had": {
    "sentence": "I ___ fun.",
    "visual": "a child smiling after a playground game"
  },
  "has": {
    "sentence": "She ___ a book.",
    "visual": "a girl holding a book in both hands"
  },
  "her": {
    "sentence": "This is ___ bag.",
    "visual": "a girl standing beside her backpack"
  },
  "here": {
    "sentence": "Come ___ now.",
    "visual": "a teacher pointing to a spot on the rug"
  },
  "him": {
    "sentence": "I can help ___.",
    "visual": "a child helping a boy tie a shoe"
  },
  "his": {
    "sentence": "That is ___ cap.",
    "visual": "a boy picking up his cap"
  },
  "how": {
    "sentence": "___ did you do it?",
    "visual": "a curious child watching a friend build a tall block tower"
  },
  "into": {
    "sentence": "Put it ___ the bag.",
    "visual": "a child putting a lunchbox into a backpack"
  },
  "just": {
    "sentence": "I ___ saw it.",
    "visual": "a child spotting a butterfly nearby"
  },
  "know": {
    "sentence": "I ___ that word.",
    "visual": "a child recognizing a word card"
  },
  "let": {
    "sentence": "___ me try.",
    "visual": "a child asking for a turn with a puzzle"
  },
  "live": {
    "sentence": "We ___ here.",
    "visual": "a family standing outside their home"
  },
  "made": {
    "sentence": "We ___ a fort.",
    "visual": "children proud of a blanket fort"
  },
  "may": {
    "sentence": "You ___ go.",
    "visual": "a teacher nodding as a child lines up"
  },
  "must": {
    "sentence": "We ___ stop.",
    "visual": "children stopping at a red crosswalk sign"
  },
  "new": {
    "sentence": "I have a ___ book.",
    "visual": "a child opening a brand-new book"
  },
  "now": {
    "sentence": "Read it ___.",
    "visual": "a child ready to read right away"
  },
  "of": {
    "sentence": "One ___ them ran.",
    "visual": "one child running from a small group"
  },
  "old": {
    "sentence": "This book is ___.",
    "visual": "a child holding an old worn book carefully"
  },
  "once": {
    "sentence": "Read it ___.",
    "visual": "a child listening to a story one time"
  },
  "open": {
    "sentence": "Please ___ the door.",
    "visual": "a child opening a classroom door"
  },
  "our": {
    "sentence": "This is ___ class.",
    "visual": "children standing proudly in their classroom"
  },
  "out": {
    "sentence": "Go ___ to play.",
    "visual": "children going outside to play"
  },
  "over": {
    "sentence": "Jump ___ the line.",
    "visual": "a child jumping over a line on the ground"
  },
  "please": {
    "sentence": "___ help me.",
    "visual": "a child politely asking for help with a zipper"
  },
  "pretty": {
    "sentence": "The flower is ___.",
    "visual": "a child looking at a colorful flower"
  },
  "put": {
    "sentence": "___ it here.",
    "visual": "a child placing a toy on a shelf"
  },
  "read": {
    "sentence": "We ___ books.",
    "visual": "children reading books at a table"
  },
  "round": {
    "sentence": "The coin is ___.",
    "visual": "a round coin on a table beside square blocks"
  },
  "some": {
    "sentence": "I want ___ water.",
    "visual": "a child asking for a cup of water"
  },
  "take": {
    "sentence": "___ one card.",
    "visual": "a child taking one card from a stack"
  },
  "thank": {
    "sentence": "___ you for helping.",
    "visual": "a child thanking a friend who helped clean up"
  },
  "yes": {
    "sentence": "I said ___.",
    "visual": "a child happily answering yes to a teacher"
  }
};

const LETTER_FILLERS = "etaoinshrdlucmfwypvbgkjqxz".split("");

const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function rotate(values, offset) {
  return values.map((_, index) => values[(index + offset) % values.length]);
}

function wordOptions(word, bandWords, bandIndex, wordIndex) {
  const pool = rotate(bandWords.filter(item => item !== word), wordIndex * 3 + bandIndex);
  return [word, ...pool.slice(0, 3)];
}

function letterTiles(word, index) {
  const tiles = word.split("");
  for (const letter of rotate(LETTER_FILLERS, index * 5)) {
    if (tiles.length >= 12) break;
    tiles.push(letter);
  }
  return tiles.slice(0, 12);
}

function phaseForSequence(sequenceIndex) {
  return sequenceIndex < 15 ? 1 : 2;
}

function phaseTarget(level, phase) {
  return `level_${level}_phase_${phase}`;
}

function makeLevelOneQuestion(config, bandIndex, word, wordIndex, sequenceIndex, variantIndex = 0) {
  const scene = HFW_SCENES[word];
  const imagePath = `/images/assessment/hfw/${slug(word)}.webp`;
  const base = {
    grade: "K-2",
    skillId: config.skillId,
    skillName: config.skillName,
    skill: config.skillName,
    targetWord: word,
    itemType: "sight_word",
    itemKey: word,
    imagePath,
    imageUrl: imagePath,
    targetImage: imagePath,
    targetImagePath: imagePath,
    imageAlt: scene.visual,
    sentence: scene.sentence,
    passage: scene.sentence,
    active: true,
    source: "hfw_no_audio_2026_06",
    disableAudio: true,
    tags: ["hfw", config.skillId, word]
  };
  const phase = phaseForSequence(sequenceIndex);
  const options = wordOptions(word, config.words, bandIndex + variantIndex, wordIndex + variantIndex * 7);

  return {
    ...base,
    id: `hfw_${slug(config.skillId)}_${String(sequenceIndex + 1).padStart(2, "0")}_${slug(word)}_l1_cloze${variantIndex ? `_v${variantIndex + 1}` : ""}`,
    level: 1,
    difficulty: 1,
    phase,
    assessmentPhase: phase,
    phaseTarget: phaseTarget(1, phase),
    templateType: "HFW_IMAGE_CONTEXT_CLOZE",
    formatType: "HFW_IMAGE_CONTEXT_CLOZE",
    questionType: "multiple_choice",
    prompt: "Choose the word that completes the sentence.",
    question: "Choose the word that completes the sentence.",
    answerOptions: options,
    choices: options,
    correctAnswer: word,
    answer: word,
    explanation: `The word "${word}" completes the sentence.`
  };
}

function makeLevelTwoQuestion(config, bandIndex, word, wordIndex, sequenceIndex, variantIndex = 0) {
  const scene = HFW_SCENES[word];
  const imagePath = `/images/assessment/hfw/${slug(word)}.webp`;
  const phase = phaseForSequence(sequenceIndex);
  const tileSeed = wordIndex + bandIndex * 25 + variantIndex * 31;
  const tiles = letterTiles(word, wordIndex + bandIndex * 25);

  return {
    grade: "K-2",
    skillId: config.skillId,
    skillName: config.skillName,
    skill: config.skillName,
    targetWord: word,
    itemType: "sight_word",
    itemKey: word,
    imagePath,
    imageUrl: imagePath,
    targetImage: imagePath,
    targetImagePath: imagePath,
    imageAlt: scene.visual,
    sentence: scene.sentence,
    passage: scene.sentence,
    active: true,
    source: "hfw_no_audio_2026_06",
    disableAudio: true,
    tags: ["hfw", config.skillId, word],
    id: `hfw_${slug(config.skillId)}_${String(sequenceIndex + 1).padStart(2, "0")}_${slug(word)}_l2_build${variantIndex ? `_v${variantIndex + 1}` : ""}`,
    level: 2,
    difficulty: 2,
    phase,
    assessmentPhase: phase,
    phaseTarget: phaseTarget(2, phase),
    templateType: "HFW_LETTER_BUILD",
    formatType: "HFW_LETTER_BUILD",
    questionType: "ixl_template",
    prompt: "Build the missing word.",
    question: "Build the missing word.",
    answerOptions: [],
    choices: [],
    letterTiles: letterTiles(word, tileSeed),
    soundTiles: letterTiles(word, tileSeed),
    correctAnswer: word,
    answer: word,
    blankSlots: word.length,
    explanation: `The letters spell "${word}".`
  };
}

function makeQuestionsForBand(config, bandIndex) {
  const extraWords = config.words.slice(0, HFW_EXTRA_VARIANT_COUNT);
  const levelOneWords = [
    ...config.words.map((word, wordIndex) => ({ word, wordIndex, variantIndex: 0 })),
    ...extraWords.map((word, extraIndex) => ({
      word,
      wordIndex: extraIndex,
      variantIndex: 1
    }))
  ];
  const levelTwoWords = [
    ...config.words.map((word, wordIndex) => ({ word, wordIndex, variantIndex: 0 })),
    ...extraWords.map((word, extraIndex) => ({
      word,
      wordIndex: extraIndex,
      variantIndex: 1
    }))
  ];

  return [
    ...levelOneWords.map((item, sequenceIndex) =>
      makeLevelOneQuestion(config, bandIndex, item.word, item.wordIndex, sequenceIndex, item.variantIndex)
    ),
    ...levelTwoWords.map((item, sequenceIndex) =>
      makeLevelTwoQuestion(config, bandIndex, item.word, item.wordIndex, sequenceIndex, item.variantIndex)
    )
  ];
}

export const HFW_IMAGE_REQUESTS = HFW_BAND_CONFIGS.flatMap(config =>
  config.words.map(word => {
    const scene = HFW_SCENES[word];
    return {
      id: `hfw_${slug(word)}`,
      targetWord: word,
      skillId: config.skillId,
      skillName: config.skillName,
      outputPath: `/images/assessment/hfw/${slug(word)}.webp`,
      sentence: scene.sentence,
      visualDescription: scene.visual,
      prompt: `Create a bright, child-safe literacy assessment illustration for the sentence "${scene.sentence}". Show ${scene.visual}. Do not include printed words, letters, captions, signs, labels, speech bubbles, or UI elements. Use a clean classroom-reader style, simple background, warm natural colors, clear action, and a 4:3 landscape composition. The image should help a K-2 child understand the sentence context without revealing the missing high-frequency word.`
    };
  })
);

export const hfwAssessmentQuestions = HFW_BAND_CONFIGS.flatMap((config, bandIndex) =>
  makeQuestionsForBand(config, bandIndex)
);
