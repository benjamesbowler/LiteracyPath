import {
  hasCompletePairSelectionAssets,
  makePairSelectionQuestion
} from "./soundPairAssets.js";
import {
  hasCompleteVisualQuestionAssets,
  makeVisualCardChoiceQuestion,
  makeWordChoiceQuestion
} from "./visualQuestionAssets.js";

const vowels = ["a", "e", "i", "o", "u"];

function unique(items) {
  return [...new Set(items)];
}

function firstVowel(word) {
  return word.match(/[aeiou]/)?.[0] || "";
}

function valid(question) {
  if (!question) return false;
  if (question.questionType === "visual_card_choice") {
    return hasCompleteVisualQuestionAssets(question);
  }
  if (["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(question.questionType)) {
    return hasCompletePairSelectionAssets(question);
  }
  if (question.audioText && !question.audioPath) return false;
  if (question.formatType?.includes("PICTURE") && !question.imagePath) return false;
  return true;
}

const finalSoundRecoverySets = [
  ["f", ["leaf", "roof", "cat"], ["roof", "leaf", "dog", "sun"]],
  ["sh", ["fish", "dish", "cat"], ["dish", "brush", "map"], ["fish", "brush", "sun", "dog"]],
  ["t", ["cat", "hat", "dog"], ["bat", "rat", "sun"], ["mat", "hat", "fish", "cup"]],
  ["p", ["map", "cap", "dog"], ["nap", "clap", "sun"], ["cap", "clap", "fish", "bed"]],
  ["d", ["bed", "red", "cat"], ["mud", "red", "fish"]],
  ["n", ["pen", "hen", "dog"], ["ten", "hen", "cup"], ["sun", "fin", "map"]],
  ["g", ["dog", "log", "cat"], ["mug", "leg", "sun"], ["pig", "egg", "map"]],
  ["m", ["drum", "jam", "cat"]],
  ["k", ["duck", "rock", "sun"], ["book", "duck", "fish"]]
];

export const finalSoundRecoveryQuestions = finalSoundRecoverySets.flatMap(([itemKey, ...wordSets]) =>
  wordSets.map((words, index) =>
    makePairSelectionQuestion({
      id: `recovery_final_${itemKey}_${index + 1}`,
      skill: "final sounds",
      skillId: "final_sounds",
      itemType: "final_sound",
      itemKey,
      targetSound: itemKey,
      formatType: "FINAL_SOUND_PAIR_SELECT",
      questionType: "final_sound_pair",
      prompt: "Listen to each word. Which two words end with the same sound?",
      words,
      pairVariant: index + 1
    })
  )
).filter(valid);

const shortVowelTargets = [
  ["short_a", "cat", ["cat", "cot", "cut", "kit"]],
  ["short_a", "hat", ["hat", "hit", "hot", "hut"]],
  ["short_a", "map", ["map", "mop", "mug", "mat"]],
  ["short_a", "cap", ["cap", "cup", "cop", "cat"]],
  ["short_a", "pan", ["pan", "pen", "pin", "pot"]],
  ["short_e", "bed", ["bed", "bad", "bid", "bud"]],
  ["short_e", "red", ["red", "rat", "rug", "bed"]],
  ["short_e", "pen", ["pen", "pan", "pin", "bed"]],
  ["short_e", "net", ["net", "nut", "not", "nap"]],
  ["short_e", "jet", ["jet", "jut", "jot", "net"]],
  ["short_i", "pig", ["pig", "peg", "pug", "pot"]],
  ["short_i", "wig", ["wig", "wag", "web", "mug"]],
  ["short_i", "fin", ["fin", "fan", "fun", "pen"]],
  ["short_i", "pin", ["pin", "pan", "pen", "pot"]],
  ["short_i", "sit", ["sit", "sat", "sun", "set"]],
  ["short_o", "dog", ["dog", "dig", "dug", "dot"]],
  ["short_o", "log", ["log", "leg", "lid", "mug"]],
  ["short_o", "pot", ["pot", "pat", "pit", "pet"]],
  ["short_o", "cot", ["cot", "cat", "cut", "kit"]],
  ["short_o", "mop", ["mop", "map", "mug", "mat"]],
  ["short_u", "cup", ["cup", "cap", "cop", "cat"]],
  ["short_u", "mud", ["mud", "mad", "mid", "mop"]],
  ["short_u", "mug", ["mug", "mag", "mig", "mop"]],
  ["short_u", "sun", ["sun", "sit", "sat", "set"]],
  ["short_u", "nut", ["nut", "net", "not", "nap"]]
];

export const shortVowelRecoveryQuestions = shortVowelTargets.flatMap(([itemKey, word, choices], index) => {
  const vowel = firstVowel(word);
  return [
    makeWordChoiceQuestion({
      id: `recovery_short_vowel_listen_${index + 1}`,
      skill: "short vowel discrimination",
      skillId: "short_vowel_discrimination",
      itemType: "short_vowel",
      itemKey,
      formatType: "LISTEN_CHOOSE_VOWEL",
      prompt: "Listen to the word. Which vowel sound do you hear?",
      choices: vowels,
      answer: vowel,
      targetWord: word,
      audioWord: word,
      extra: { targetVowel: vowel }
    }),
    makeWordChoiceQuestion({
      id: `recovery_short_vowel_picture_${index + 1}`,
      skill: "short vowel discrimination",
      skillId: "short_vowel_discrimination",
      itemType: "short_vowel",
      itemKey,
      formatType: "PICTURE_TO_PRINT_MATCH",
      prompt: "Which word matches the picture?",
      choices: unique(choices),
      answer: word,
      targetWord: word,
      imageWord: word,
      audioWord: word,
      extra: {
        targetVowel: vowel,
        textOnlyChoices: true
      }
    })
  ];
}).filter(valid);

const blendTargets = [
  ["bl", "black", ["black", "clap", "flag", "slide"]],
  ["bl", "blue", ["blue", "crab", "drum", "frog"]],
  ["cl", "clap", ["clap", "crab", "flag", "blue"]],
  ["fl", "flag", ["flag", "frog", "dog", "log"]],
  ["sl", "slide", ["slide", "blue", "frog", "flag"]],
  ["br", "brush", ["brush", "blue", "frog", "crab"]],
  ["cr", "crab", ["crab", "clap", "brush", "drum"]],
  ["dr", "drum", ["drum", "duck", "frog", "train"]],
  ["fr", "frog", ["frog", "flag", "dog", "log"]],
  ["tr", "tree", ["tree", "frog", "blue", "crab"]],
  ["tr", "train", ["train", "drum", "frog", "crab"]]
];

const blendPatterns = ["bl", "cl", "fl", "sl", "br", "cr", "dr", "fr", "tr"];

function patternChoices(pattern, index, patterns = blendPatterns) {
  const others = patterns.filter(item => item !== pattern);
  return [pattern, ...others.slice(index % others.length).concat(others).slice(0, 3)];
}

export const blendRecoveryQuestions = blendTargets.flatMap(([pattern, word, words], index) => [
  makeWordChoiceQuestion({
    id: `recovery_blend_sound_${pattern}_${word}`,
    skill: "blends",
    skillId: "blends",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "PICTURE_AUDIO_TO_PATTERN",
    prompt: "Which blend starts this word?",
    choices: patternChoices(pattern, index),
    answer: pattern,
    targetWord: word,
    imageWord: word,
    audioWord: word,
    extra: { targetPattern: pattern }
  }),
  makeVisualCardChoiceQuestion({
    id: `recovery_blend_card_${pattern}_${word}`,
    skill: "blends",
    skillId: "blends",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "IMAGE_WORD_PATTERN_MATCH",
    prompt: `Which word starts with ${pattern}?`,
    choices: unique(words),
    answer: word,
    targetWord: word,
    requireOptionImages: true,
    requireOptionAudio: false,
    extra: { targetPattern: pattern }
  }),
  makeWordChoiceQuestion({
    id: `recovery_blend_listen_${pattern}_${word}`,
    skill: "blends",
    skillId: "blends",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    prompt: "Listen and choose the word.",
    choices: unique(words),
    answer: word,
    targetWord: word,
    audioWord: word,
    extra: { targetPattern: pattern }
  })
]).filter(question => question.choices.length >= 2).filter(valid);

const digraphTargets = [
  ["sh", "shell", ["shell", "chair", "thin", "whale"]],
  ["sh", "ship", ["ship", "chick", "thin", "wheel"]],
  ["sh", "shop", ["shop", "chair", "thumb", "whale"]],
  ["ch", "chair", ["chair", "ship", "thin", "whale"]],
  ["ch", "chick", ["chick", "shell", "thumb", "wheel"]],
  ["th", "thin", ["thin", "ship", "chair", "whale"]],
  ["th", "thumb", ["thumb", "shop", "chick", "wheel"]],
  ["wh", "whale", ["whale", "ship", "chair", "thin"]],
  ["wh", "wheel", ["wheel", "shell", "chick", "thumb"]]
];

const digraphPatterns = ["sh", "ch", "th", "wh"];

const digraphReviewChoices = [
  ["sh", "shell", ["shell", "chair", "thin", "whale"]],
  ["sh", "ship", ["ship", "chick", "thin", "wheel"]],
  ["sh", "shop", ["shop", "chair", "thumb", "whale"]],
  ["ch", "chair", ["chair", "ship", "thin", "whale"]],
  ["ch", "chick", ["chick", "shell", "thumb", "wheel"]],
  ["th", "thin", ["thin", "shop", "chair", "wheel"]],
  ["th", "thumb", ["thumb", "shop", "chick", "whale"]],
  ["wh", "whale", ["whale", "ship", "chair", "thin"]],
  ["wh", "wheel", ["wheel", "shell", "chick", "thumb"]]
];

export const digraphRecoveryQuestions = digraphTargets.flatMap(([pattern, word, words], index) => [
  makeWordChoiceQuestion({
    id: `recovery_digraph_sound_${pattern}_${word}`,
    skill: "digraphs",
    skillId: "digraphs",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "PICTURE_AUDIO_TO_PATTERN",
    prompt: "Which letters start this word?",
    choices: patternChoices(pattern, index, digraphPatterns),
    answer: pattern,
    targetWord: word,
    imageWord: word,
    audioWord: word,
    extra: { targetPattern: pattern }
  }),
  makeVisualCardChoiceQuestion({
    id: `recovery_digraph_card_${pattern}_${word}`,
    skill: "digraphs",
    skillId: "digraphs",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "IMAGE_WORD_PATTERN_MATCH",
    prompt: `Which word starts with ${pattern}?`,
    choices: unique(words),
    answer: word,
    targetWord: word,
    requireOptionImages: true,
    requireOptionAudio: false,
    extra: { targetPattern: pattern }
  }),
  makeWordChoiceQuestion({
    id: `recovery_digraph_listen_${pattern}_${word}`,
    skill: "digraphs",
    skillId: "digraphs",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    prompt: "Listen and choose the word.",
    choices: unique(words),
    answer: word,
    targetWord: word,
    audioWord: word,
    extra: { targetPattern: pattern }
  })
]).filter(question => question.choices.length >= 2).filter(valid);

export const digraphReviewRecoveryQuestions = digraphReviewChoices.flatMap(([pattern, word, words], index) => [
  makeVisualCardChoiceQuestion({
    id: `recovery_digraph_review_card_${pattern}_${word}`,
    skill: "digraphs",
    skillId: "digraphs",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "IMAGE_WORD_PATTERN_MATCH",
    prompt: `Which word starts with ${pattern}?`,
    choices: unique(words),
    answer: word,
    targetWord: word,
    requireOptionImages: true,
    requireOptionAudio: false,
    extra: { targetPattern: pattern }
  }),
  makeWordChoiceQuestion({
    id: `recovery_digraph_review_listen_${pattern}_${word}`,
    skill: "digraphs",
    skillId: "digraphs",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    prompt: "Listen and choose the word.",
    choices: unique(words),
    answer: word,
    targetWord: word,
    audioWord: word,
    extra: { targetPattern: pattern }
  })
]).filter(question => question.choices.length >= 2).filter(valid);

export const cvcPenRecoveryQuestions = [
  makeWordChoiceQuestion({
    id: "recovery_cvc_pen_picture_2",
    skill: "cvc words",
    skillId: "cvc_short_vowels",
    itemType: "cvc_word",
    itemKey: "pen",
    formatType: "PICTURE_TO_PRINT_MATCH",
    prompt: "Which word matches the picture?",
    choices: ["pen", "pan", "pin", "bed"],
    answer: "pen",
    targetWord: "pen",
    imageWord: "pen",
    audioWord: "pen",
    extra: {
      targetVowel: "e",
      textOnlyChoices: true
    }
  })
].filter(valid);

export const targetedContentRecoveryQuestions = [
  ...finalSoundRecoveryQuestions,
  ...shortVowelRecoveryQuestions,
  ...blendRecoveryQuestions,
  ...digraphRecoveryQuestions,
  ...digraphReviewRecoveryQuestions,
  ...cvcPenRecoveryQuestions
];
