import {
  hasCompleteVisualQuestionAssets,
  makeRepeatedPromptCards,
  makeVisualCardChoiceQuestion,
  makeWordChoiceQuestion
} from "./visualQuestionAssets.js";
import { getChildAudioPath, getChildWordAsset } from "./childAssets.js";

const vowels = ["a", "e", "i", "o", "u"];

function unique(items) {
  return [...new Set(items)];
}

function hasWordAssets(word) {
  const asset = getChildWordAsset(word);
  return Boolean(asset?.image && asset?.audio);
}

function hasImage(word) {
  const asset = getChildWordAsset(word);
  return Boolean(asset?.image || asset?.fallbackImage);
}

function hasAudio(word) {
  return Boolean(getChildAudioPath(word));
}

function firstVowel(word) {
  return word.match(/[aeiou]/)?.[0] || "";
}

function valid(question) {
  if (question.questionType === "visual_card_choice") {
    return hasCompleteVisualQuestionAssets(question);
  }
  if (question.audioText && !question.audioPath) return false;
  if (question.imagePath === "" && question.formatType?.includes("PICTURE")) return false;
  return true;
}

const rhymeTargets = [
  ["at", "cat", "hat", ["hat", "dog", "sun", "cup"]],
  ["ap", "cap", "nap", ["nap", "dog", "sun", "fish"]],
  ["an", "fan", "pan", ["pan", "dog", "sun", "map"]],
  ["ed", "bed", "red", ["red", "dog", "sun", "map"]],
  ["en", "pen", "hen", ["hen", "dog", "sun", "map"]],
  ["ig", "pig", "wig", ["wig", "dog", "sun", "map"]],
  ["in", "fin", "pin", ["pin", "dog", "sun", "map"]],
  ["it", "sit", "hit", ["hit", "dog", "sun", "map"]],
  ["og", "dog", "log", ["log", "cat", "sun", "map"]],
  ["op", "mop", "top", ["top", "dog", "sun", "fish"]],
  ["ot", "pot", "cot", ["cot", "dog", "sun", "map"]],
  ["ug", "bug", "rug", ["rug", "dog", "sun", "fish"]],
  ["un", "sun", "pun", ["pun", "dog", "map", "fish"]]
];

export const rhymingFormatExpansionQuestions = rhymeTargets.flatMap(([family, target, answer, choices], index) => [
  makeVisualCardChoiceQuestion({
    id: `p3_rhyme_listen_${family}_${index + 1}`,
    skill: "rhyming",
    skillId: "rhyming",
    itemType: "rhyming_family",
    itemKey: family,
    formatType: "LISTEN_FIND_RHYME",
    prompt: `Listen. Which word rhymes with ${target}?`,
    choices: unique(choices),
    answer,
    targetWord: target,
    audioWord: target,
    requireOptionImages: true,
    requireOptionAudio: false
  }),
  makeVisualCardChoiceQuestion({
    id: `p3_rhyme_read_${family}_${index + 1}`,
    skill: "rhyming",
    skillId: "rhyming",
    itemType: "rhyming_family",
    itemKey: family,
    formatType: "READ_FIND_RHYME",
    prompt: `Which word rhymes with ${target}?`,
    choices: unique(choices),
    answer,
    targetWord: target,
    requireOptionImages: true,
    requireOptionAudio: false
  })
]).filter(valid);

const cvcWords = [
  ["short_a", "cat", ["cat", "cot", "cut", "kit"]],
  ["short_a", "bag", ["bag", "bug", "big", "bed"]],
  ["short_a", "map", ["map", "mop", "mug", "man"]],
  ["short_e", "bed", ["bed", "bad", "bid", "bud"]],
  ["short_e", "pen", ["pen", "pan", "pin", "pun"]],
  ["short_e", "red", ["red", "ram", "rug", "bed"]],
  ["short_i", "pig", ["pig", "pan", "pen", "pot"]],
  ["short_i", "fin", ["fin", "fan", "pin", "pen"]],
  ["short_i", "sit", ["sit", "sun", "hit", "hot"]],
  ["short_o", "dog", ["dog", "dig", "dug", "dot"]],
  ["short_o", "pot", ["pot", "pan", "pen", "pig"]],
  ["short_o", "log", ["log", "leg", "lid", "mug"]],
  ["short_u", "cup", ["cup", "cap", "cot", "cut"]],
  ["short_u", "mud", ["mud", "mug", "map", "bed"]],
  ["short_u", "sun", ["sun", "sit", "nut", "cup"]]
];

export const shortVowelFormatExpansionQuestions = cvcWords.flatMap(([itemKey, word, choices], index) => {
  const vowel = firstVowel(word);
  const masked = word.replace(vowel, "_");

  return [
    makeWordChoiceQuestion({
      id: `p3_short_vowel_listen_${index + 1}`,
      skill: "short vowel discrimination",
      skillId: "short_vowel_discrimination",
      itemType: "short_vowel",
      itemKey,
      formatType: "LISTEN_CHOOSE_VOWEL",
      prompt: "Listen to the word. Which vowel sound do you hear?",
      choices: vowels,
      answer: vowel,
      targetWord: word,
      audioWord: word
    }),
    makeWordChoiceQuestion({
      id: `p3_short_vowel_picture_${index + 1}`,
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
      audioWord: hasAudio(word) ? word : "",
      extra: {
        targetVowel: vowel,
        textOnlyChoices: true
      }
    }),
    makeWordChoiceQuestion({
      id: `p3_cvc_missing_vowel_${index + 1}`,
      skill: "cvc words",
      skillId: "cvc_short_vowels",
      itemType: "short_vowel",
      itemKey,
      formatType: "MISSING_VOWEL_CVC",
      prompt: `Which vowel is missing? ${masked}`,
      choices: vowels,
      answer: vowel,
      targetWord: word,
      imageWord: word,
      audioWord: hasAudio(word) ? word : "",
      extra: { targetVowel: vowel }
    })
  ];
}).filter(valid);

const blendTargets = [
  ["bl", "blue", ["blue", "green", "slide", "frog"]],
  ["cl", "clap", ["clap", "crab", "flag", "blue"]],
  ["fl", "flag", ["flag", "frog", "fog", "log"]],
  ["fr", "frog", ["frog", "flag", "dog", "log"]],
  ["gr", "green", ["green", "blue", "slide", "frog"]],
  ["sl", "slide", ["slide", "blue", "frog", "flag"]],
  ["sn", "snake", ["snake", "slide", "cake", "shop"]],
  ["sp", "spin", ["spin", "stop", "sun", "pin"]],
  ["st", "stop", ["stop", "top", "spin", "snake"]],
  ["tr", "tree", ["tree", "train", "frog", "green"]],
  ["dr", "drum", ["drum", "duck", "frog", "train"]],
  ["br", "brush", ["brush", "blue", "frog", "crab"]]
];

export const blendsFormatExpansionQuestions = blendTargets.flatMap(([pattern, word, words], index) => [
  makeWordChoiceQuestion({
    id: `p3_blend_sound_${pattern}_${index + 1}`,
    skill: "blends",
    skillId: "blends",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "PICTURE_AUDIO_TO_PATTERN",
    prompt: "Which blend starts this word?",
    choices: ["bl", "cl", "fl", "fr", "gr", "sl", "sn", "sp", "st", "tr", "dr", "br"].filter((choice, choiceIndex) => choice === pattern || choiceIndex % 4 === index % 4).slice(0, 4),
    answer: pattern,
    targetWord: word,
    imageWord: word,
    audioWord: word,
    extra: { targetPattern: pattern }
  }),
  makeVisualCardChoiceQuestion({
    id: `p3_blend_word_${pattern}_${index + 1}`,
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
  })
]).filter(q => q.choices.length >= 2).filter(valid);

const digraphTargets = [
  ["sh", "ship", ["ship", "chip", "sip", "shop"]],
  ["sh", "shop", ["shop", "ship", "chip", "thin"]],
  ["ch", "chip", ["chip", "ship", "sip", "shop"]],
  ["ch", "chair", ["chair", "ship", "thin", "whale"]],
  ["th", "thin", ["thin", "fin", "chin", "win"]],
  ["th", "thumb", ["thumb", "thin", "ship", "chair"]],
  ["wh", "whale", ["whale", "wheel", "ship", "chair"]]
];

export const digraphFormatExpansionQuestions = digraphTargets.flatMap(([pattern, word, words], index) => [
  makeWordChoiceQuestion({
    id: `p3_digraph_sound_${pattern}_${index + 1}`,
    skill: "digraphs",
    skillId: "digraphs",
    itemType: "phonics_pattern",
    itemKey: pattern,
    formatType: "PICTURE_AUDIO_TO_PATTERN",
    prompt: "Which letters start this word?",
    choices: ["sh", "ch", "th", "wh"],
    answer: pattern,
    targetWord: word,
    imageWord: word,
    audioWord: word,
    extra: { targetPattern: pattern }
  }),
  makeVisualCardChoiceQuestion({
    id: `p3_digraph_word_${pattern}_${index + 1}`,
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
  })
]).filter(q => q.choices.length >= 2).filter(valid);

const pluralTargets = [
  ["s", "cat", "cats", ["cats", "cates", "catz", "cat"]],
  ["s", "dog", "dogs", ["dogs", "doges", "dogz", "dog"]],
  ["s", "book", "books", ["books", "bookes", "bookz", "book"]],
  ["es", "box", "boxes", ["boxes", "boxs", "boxz", "box"]],
  ["es", "dish", "dishes", ["dishes", "dishs", "dishz", "dish"]],
  ["es", "brush", "brushes", ["brushes", "brushs", "brushz", "brush"]],
  ["s", "cup", "cups", ["cups", "cupes", "cupz", "cup"]],
  ["s", "hat", "hats", ["hats", "hates", "hatz", "hat"]]
];

export const pluralsFormatExpansionQuestions = pluralTargets.map(([pattern, singular, plural, choices], index) =>
  makeWordChoiceQuestion({
    id: `p3_plural_visual_${pattern}_${index + 1}`,
    skill: "plurals",
    skillId: "plurals",
    itemType: "grammar_plural",
    itemKey: pattern,
    formatType: "PLURAL_IMAGE_SPELLING",
    prompt: "What is the correct plural?",
    choices,
    answer: plural,
    targetWord: singular,
    imageWord: singular,
    promptImageWords: hasImage(singular) ? [singular, singular, singular] : [],
    extra: {
      targetPlural: plural,
      pluralImageCount: 3,
      promptImageCards: hasImage(singular) ? makeRepeatedPromptCards(singular, 3) : []
    }
  })
).filter(q => q.promptImageCards.length >= 2);

const hfwBands = [
  ["hfw_1_25", "high-frequency words 1-25", ["the", "and", "to", "a", "I", "you", "my", "we", "see", "go", "up", "can"]],
  ["hfw_26_50", "high-frequency words 26-50", ["he", "she", "they", "was", "with", "for", "all", "are", "but", "under", "then", "that"]]
];

export const hfwFormatExpansionQuestions = hfwBands.flatMap(([skillId, skill, words]) =>
  words.flatMap((word, index) => {
    const normalizedWord = word.toLowerCase();
    const choices = unique([normalizedWord, ...words.filter(other => other.toLowerCase() !== normalizedWord).slice(index % 4, index % 4 + 3).map(other => other.toLowerCase())]);
    return [
      makeWordChoiceQuestion({
        id: `p3_${skillId}_listen_${normalizedWord}`,
        skill,
        skillId,
        itemType: "sight_word",
        itemKey: normalizedWord,
        formatType: "LISTEN_FIND_WORD",
        prompt: "Listen and choose the word.",
        choices,
        answer: normalizedWord,
        targetWord: normalizedWord,
        audioWord: normalizedWord
      }),
      makeWordChoiceQuestion({
        id: `p3_${skillId}_read_${normalizedWord}`,
        skill,
        skillId,
        itemType: "sight_word",
        itemKey: normalizedWord,
        formatType: "READ_FIND_WORD",
        prompt: "Find the word.",
        choices,
        answer: normalizedWord,
        targetWord: normalizedWord
      })
    ];
  })
).filter(q => q.choices.length >= 2 && (!q.audioText || q.audioPath));

export const morphologyFormatExpansionQuestions = [
  ["un", "unhappy", "not happy", ["not happy", "very happy", "happy again", "happy before"], "What does unhappy mean?"],
  ["un", "unkind", "not kind", ["not kind", "kind again", "full of kind", "before kind"], "What does unkind mean?"],
  ["re", "reread", "read again", ["read again", "not read", "read before", "full of read"], "What does reread mean?"],
  ["pre", "preview", "look before", ["look before", "not look", "look again", "full of looking"], "What does preview mean?"],
  ["ful", "playful", "full of play", ["full of play", "without play", "play again", "before play"], "What does playful mean?"],
  ["less", "careless", "without care", ["without care", "full of care", "care again", "before care"], "What does careless mean?"],
  ["er", "teacher", "a person who teaches", ["a person who teaches", "teach again", "not teach", "full of teach"], "What does teacher mean?"],
  ["ing", "jumping", "jumping now", ["jumping now", "jumped before", "not jump", "jump again"], "What does jumping mean?"],
  ["ed", "played", "played before", ["played before", "playing now", "not play", "full of play"], "What does played mean?"],
  ["un", "unlock", "make not locked", ["make not locked", "lock again", "full of lock", "before lock"], "What does unlock mean?"],
  ["re", "rebuild", "build again", ["build again", "not build", "build before", "without build"], "What does rebuild mean?"],
  ["ful", "helpful", "full of help", ["full of help", "without help", "help again", "before help"], "What does helpful mean?"],
  ["less", "painless", "without pain", ["without pain", "full of pain", "pain again", "before pain"], "What does painless mean?"],
  ["er", "runner", "a person who runs", ["a person who runs", "run again", "not run", "full of run"], "What does runner mean?"]
].map(([itemKey, targetWord, answer, choices, prompt], index) =>
  makeWordChoiceQuestion({
    id: `p3_morphology_${itemKey}_${index + 1}`,
    skill: "prefixes and suffixes",
    skillId: "prefix_suffix",
    itemType: "morphology",
    itemKey,
    formatType: "MORPHEME_MEANING_CONTEXT",
    prompt,
    choices,
    answer,
    targetWord,
    extra: { targetMorpheme: itemKey }
  })
);

export const comprehensionParagraphExpansionQuestions = [
  {
    id: "p3_sentence_comp_paragraph_001",
    grade: "1",
    skill: "sentence comprehension",
    skillId: "sentence_comprehension",
    difficulty: 1,
    passage: "Mia packed a red bag for the park. She put in a ball, a snack, and a small book. At the park, she shared the ball with Sam. Then they sat under a tree and read the book together.",
    question: "What did Mia and Sam do after playing with the ball?",
    prompt: "What did Mia and Sam do after playing with the ball?",
    choices: ["read a book", "packed a lunch", "went to school", "washed the ball"],
    answer: "read a book",
    itemType: "sentence_comprehension",
    itemKey: "p3_sentence_comp_paragraph_001",
    formatType: "COMPREHENSION"
  },
  {
    id: "p3_inference_paragraph_001",
    grade: "1",
    skill: "inference",
    skillId: "inference",
    difficulty: 1,
    passage: "The sky turned gray before recess. Ben looked at the window and saw rain on the glass. He zipped his coat and picked up his umbrella. His teacher smiled and said he was ready for the walk home.",
    question: "What can you infer about the weather?",
    prompt: "What can you infer about the weather?",
    choices: ["It is raining.", "It is very hot.", "It is snowing.", "It is nighttime."],
    answer: "It is raining.",
    itemType: "reading_comprehension",
    itemKey: "p3_inference_paragraph_001",
    formatType: "COMPREHENSION"
  },
  {
    id: "p3_context_clues_paragraph_001",
    grade: "1",
    skill: "context clues",
    skillId: "context_clues",
    difficulty: 1,
    passage: "Nora found a tiny seed in a cup. She put it in soil and gave it water each day. After a week, a small sprout came up. Nora was delighted, so she smiled and called her family to see it.",
    question: "What does delighted mean in the passage?",
    prompt: "What does delighted mean in the passage?",
    choices: ["very happy", "very sleepy", "a little angry", "hard to find"],
    answer: "very happy",
    itemType: "reading_comprehension",
    itemKey: "p3_context_clues_paragraph_001",
    formatType: "COMPREHENSION"
  }
];

export const contentExpansionPass3Questions = [
  ...rhymingFormatExpansionQuestions,
  ...shortVowelFormatExpansionQuestions,
  ...blendsFormatExpansionQuestions,
  ...digraphFormatExpansionQuestions,
  ...pluralsFormatExpansionQuestions,
  ...hfwFormatExpansionQuestions,
  ...morphologyFormatExpansionQuestions,
  ...comprehensionParagraphExpansionQuestions
];
