import { getChildWordAsset } from "./childAssets.js";
import { getApprovedAudioPath } from "./audioPreferenceManifest.js";

function assetFor(word) {
  const asset = getChildWordAsset(word);
  return {
    word,
    label: word,
    value: word,
    image: asset?.image || asset?.fallbackImage || "",
    audio: getApprovedAudioPath(word, asset?.audio || ""),
    alt: asset?.alt || `Picture for ${word}`
  };
}

function simpleHash(text) {
  return String(text || "")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
}

function pickDistractors(pool, correct, count, offset = 0) {
  return pool
    .filter(item => item !== correct)
    .slice(offset)
    .concat(pool.filter(item => item !== correct).slice(0, offset))
    .slice(0, count);
}

const blockedAssessmentImageWords = new Set(["acorn", "nut"]);

function makeTemplateQuestion({
  id,
  skillId,
  skillName,
  level = 1,
  templateType,
  prompt,
  targetWord = "",
  phonicsPattern = "",
  correctAnswer,
  answerOptions,
  imageWord = targetWord,
  audioWord = targetWord,
  itemType,
  itemKey,
  explanation = "",
  difficulty = "easy",
  distractorType = "contrast",
  tags = [],
  partialWord = "",
  soundTiles = []
}) {
  const targetAsset = imageWord ? assetFor(imageWord) : null;
  const audioAsset = audioWord ? assetFor(audioWord) : null;
  const normalizedOptions = answerOptions.map(option =>
    typeof option === "string"
      ? { label: option, value: option }
      : option
  );
  const targetAudioTemplates = new Set([
    "FIRST_SOUND",
    "ENDING_SOUND",
    "BLEND_SOUNDS",
    "PUT_SOUNDS_IN_ORDER",
    "RHYMING_PICTURE",
    "SHORT_VOWEL_WORD"
  ]);
  const imageOptionTemplates = new Set([
    "BLEND_SOUNDS",
    "RHYMING_PICTURE",
    "SHORT_VOWEL_WORD",
    "VOCABULARY_CATEGORY"
  ]);
  const missingRequiredTargetAudio = targetAudioTemplates.has(templateType) && !audioAsset?.audio;
  const missingRequiredOptionImage = imageOptionTemplates.has(templateType) &&
    normalizedOptions.some(option => typeof option === "object" && !option.image);
  const blockedAssessmentImage = blockedAssessmentImageWords.has(String(targetWord || "").toLowerCase());

  return {
    id,
    skillId,
    skill: skillName,
    skillName,
    level,
    questionType: "ixl_template",
    templateType,
    formatType: templateType,
    prompt,
    question: prompt,
    targetWord,
    phonicsPattern,
    targetPattern: phonicsPattern,
    correctAnswer,
    answer: correctAnswer,
    choices: normalizedOptions.map(option => option.value),
    answerOptions: normalizedOptions,
    imageKey: imageWord,
    imageUrl: targetAsset?.image || "",
    imagePath: targetAsset?.image || "",
    audioKey: audioWord,
    audioUrl: audioAsset?.audio || "",
    audioPath: audioAsset?.audio || "",
    audioText: audioWord,
    targetImageAlt: targetAsset?.alt || "",
    explanation,
    hint: explanation,
    difficulty,
    distractorType,
    tags,
    partialWord,
    soundTiles,
    itemType,
    itemKey,
    active: !(missingRequiredTargetAudio || missingRequiredOptionImage || blockedAssessmentImage),
    qaStatus: blockedAssessmentImage ? "needs_image_regeneration" : undefined,
    qaNotes: blockedAssessmentImage
      ? "Current image is visually unsuitable/confusable for assessment use and is blocked until regenerated."
      : undefined
  };
}

const firstSoundWords = [
  ["cat", "c"], ["dog", "d"], ["bed", "b"], ["map", "m"], ["pan", "p"],
  ["pin", "p"], ["bat", "b"], ["bag", "b"], ["cup", "c"], ["web", "w"],
  ["jet", "j"], ["jam", "j"], ["fish", "f"], ["fan", "f"], ["farm", "f"],
  ["sock", "s"], ["duck", "d"], ["ring", "r"], ["hand", "h"], ["milk", "m"],
  ["sun", "s"], ["hat", "h"], ["log", "l"], ["mug", "m"], ["nut", "n"],
  ["fox", "f"], ["bug", "b"], ["wig", "w"], ["zebra", "z"], ["van", "v"]
];
const firstSoundChoices = ["b", "c", "d", "f", "h", "j", "l", "m", "n", "p", "r", "s", "t", "v", "w", "z"];

const endingSoundWords = [
  ["cat", "t"], ["dog", "g"], ["bed", "d"], ["map", "p"], ["pan", "n"],
  ["pin", "n"], ["bat", "t"], ["bag", "g"], ["cup", "p"], ["web", "b"],
  ["jet", "t"], ["jam", "m"], ["ship", "p"], ["shop", "p"],
  ["sun", "n"], ["hat", "t"], ["log", "g"], ["mug", "g"], ["nut", "t"],
  ["bug", "g"], ["wig", "g"], ["red", "d"], ["bell", "l"], ["ham", "m"]
];
const endingChoices = ["b", "d", "g", "l", "m", "n", "p", "s", "t"];

const cvcWords = [
  "cat", "dog", "bed", "map", "pan", "pin", "bat", "bag", "cup", "web",
  "jet", "jam", "fish", "sock", "duck", "sun", "hat", "log", "mug", "nut",
  "fox", "bug", "wig", "lid", "fin", "sit", "pot", "cap", "man", "ram"
];

const completeWordItems = [
  ["cat", "ca__", "t", ["p", "n", "g"]], ["dog", "do__", "g", ["t", "p", "n"]],
  ["bed", "be__", "d", ["t", "p", "g"]], ["map", "ma__", "p", ["t", "n", "g"]],
  ["pan", "pa__", "n", ["t", "p", "g"]], ["pin", "pi__", "n", ["t", "p", "g"]],
  ["bat", "ba__", "t", ["p", "n", "g"]], ["bag", "ba__", "g", ["t", "n", "p"]],
  ["cup", "cu__", "p", ["t", "n", "g"]], ["web", "we__", "b", ["t", "n", "p"]],
  ["jet", "je__", "t", ["b", "n", "p"]], ["jam", "ja__", "m", ["t", "n", "p"]],
  ["sun", "su__", "n", ["t", "p", "g"]], ["hat", "ha__", "t", ["p", "n", "g"]],
  ["log", "lo__", "g", ["t", "p", "n"]]
];

const rhymePairs = [
  ["fed", "bed", "crab", "ed"], ["cat", "bat", "dog", "at"], ["map", "cap", "fish", "ap"],
  ["pan", "man", "cup", "an"], ["pin", "fin", "dog", "in"], ["log", "dog", "cup", "og"],
  ["bug", "mug", "cat", "ug"], ["sun", "bun", "fish", "un"], ["jet", "net", "dog", "et"],
  ["sock", "rock", "bed", "ock"], ["hat", "bat", "fish", "at"], ["nut", "cut", "map", "ut"],
  ["wig", "pig", "sun", "ig"], ["hop", "mop", "bed", "op"], ["ten", "hen", "cup", "en"],
  ["ram", "jam", "fish", "am"], ["cap", "map", "dog", "ap"], ["fin", "pin", "cat", "in"],
  ["mug", "bug", "dog", "ug"], ["fox", "box", "pan", "ox"], ["rock", "sock", "bed", "ock"],
  ["ring", "king", "cat", "ing"], ["bell", "shell", "mop", "ell"], ["chair", "bear", "sun", "air"],
  ["boat", "coat", "cat", "oat"], ["goat", "coat", "fish", "oat"], ["bee", "tree", "cat", "ee"],
  ["rain", "train", "dog", "ain"], ["tree", "bee", "cup", "ee"], ["house", "mouse", "cat", "ouse"]
];

const shortVowelItems = [
  ["short_a", "short a", "cat", "dog"], ["short_a", "short a", "map", "cup"], ["short_a", "short a", "pan", "pin"],
  ["short_a", "short a", "bag", "bed"], ["short_a", "short a", "bat", "bug"], ["short_a", "short a", "hat", "hot"],
  ["short_e", "short e", "bed", "bad"], ["short_e", "short e", "web", "wig"], ["short_e", "short e", "jet", "jam"],
  ["short_e", "short e", "red", "ram"], ["short_e", "short e", "hen", "hat"], ["short_e", "short e", "net", "nut"],
  ["short_i", "short i", "pin", "pan"], ["short_i", "short i", "fish", "fox"], ["short_i", "short i", "ship", "shop"],
  ["short_i", "short i", "wig", "web"], ["short_i", "short i", "lid", "cup"], ["short_i", "short i", "fin", "fan"],
  ["short_o", "short o", "dog", "duck"], ["short_o", "short o", "sock", "sun"], ["short_o", "short o", "shop", "ship"],
  ["short_o", "short o", "log", "leg"], ["short_o", "short o", "mop", "map"], ["short_o", "short o", "fox", "fin"],
  ["short_u", "short u", "cup", "cap"], ["short_u", "short u", "duck", "dog"], ["short_u", "short u", "sun", "sock"],
  ["short_u", "short u", "mug", "map"], ["short_u", "short u", "nut", "net"], ["short_u", "short u", "bug", "bag"]
];

const blendItems = [
  ["flag", "fl"], ["frog", "fr"], ["blue", "bl"], ["black", "bl"], ["clap", "cl"],
  ["cloud", "cl"], ["drum", "dr"], ["tree", "tr"], ["train", "tr"], ["slide", "sl"],
  ["snake", "sn"], ["star", "st"], ["spin", "sp"], ["brush", "br"], ["crab", "cr"],
  ["flag", "fl"], ["frog", "fr"], ["blue", "bl"], ["clap", "cl"], ["drum", "dr"],
  ["tree", "tr"], ["slide", "sl"], ["snake", "sn"], ["star", "st"], ["spin", "sp"],
  ["brush", "br"], ["crab", "cr"], ["black", "bl"], ["cloud", "cl"], ["train", "tr"]
];
const blendPatterns = ["bl", "br", "cl", "cr", "dr", "fl", "fr", "sl", "sn", "sp", "st", "tr"];

const sentencePictureItems = [
  ["cats", "Max has two cats.", "Max has two dogs."],
  ["dogs", "Sam sees two dogs.", "Sam sees two boxes."],
  ["cups", "The cups are on the mat.", "The cats are on the mat."],
  ["hats", "The hats are red.", "The bags are red."],
  ["books", "I see two books.", "I see two ducks."],
  ["boxes", "The boxes are big.", "The dogs are big."],
  ["fish", "The fish can swim.", "The dog can swim."],
  ["ship", "The ship is big.", "The shop is big."],
  ["duck", "The duck is in the pond.", "The cat is in the pond."],
  ["bed", "The cat is on the bed.", "The cat is on the bus."],
  ["map", "Dad has a map.", "Dad has a mop."],
  ["bag", "The bag is on the bed.", "The bug is on the bed."],
  ["cup", "The cup is blue.", "The cap is blue."],
  ["sock", "The sock is wet.", "The rock is wet."],
  ["ring", "The ring is small.", "The rug is small."]
];

const nounCategoryItems = [
  ["Which one is an animal?", "cat", ["cat", "cup", "map"]],
  ["Which one is an animal?", "dog", ["dog", "bed", "hat"]],
  ["Which one is an animal?", "fish", ["fish", "bag", "cup"]],
  ["Which one is something you wear?", "hat", ["hat", "dog", "map"]],
  ["Which one is something you wear?", "sock", ["sock", "cat", "cup"]],
  ["Which one is a thing you can read?", "book", ["book", "dog", "hat"]],
  ["Which one is food?", "ham", ["ham", "map", "sock"]],
  ["Which one is a place?", "farm", ["farm", "cup", "hat"]],
  ["Which one is a vehicle?", "ship", ["ship", "bed", "cup"]],
  ["Which one is not like the others?", "cup", ["cat", "dog", "cup"]],
  ["Which one is not like the others?", "map", ["hat", "sock", "map"]],
  ["Which one is not like the others?", "dog", ["cup", "mug", "dog"]],
  ["Which one is an animal?", "frog", ["frog", "flag", "bed"]],
  ["Which one is an animal?", "bug", ["bug", "bag", "cup"]],
  ["Which one is a thing?", "lamp", ["lamp", "dog", "fish"]]
];

const verbItems = [
  ["Find the action verb.", "run", ["run", "red", "cat"]],
  ["Find the action verb.", "jump", ["jump", "blue", "dog"]],
  ["Find the action verb.", "hop", ["hop", "hat", "big"]],
  ["Find the action verb.", "dig", ["dig", "cup", "yellow"]],
  ["Find the action verb.", "play", ["play", "red", "fish"]],
  ["Find the action verb.", "sleep", ["sleep", "bag", "little"]],
  ["Find the action verb.", "look", ["look", "map", "green"]],
  ["Find the action verb.", "stop", ["stop", "cat", "small"]],
  ["Find the action verb.", "read", ["read", "bed", "funny"]],
  ["Find the action verb.", "swim", ["swim", "hat", "big"]],
  ["Is this a telling sentence or an asking sentence?", "asking sentence", ["asking sentence", "telling sentence"], "Can Sam jump?"],
  ["Is this a telling sentence or an asking sentence?", "telling sentence", ["telling sentence", "asking sentence"], "Sam can jump."],
  ["Choose the sentence with the correct capital letter.", "The dog can run.", ["The dog can run.", "the dog can run."], ""],
  ["Choose the sentence with the correct capital letter.", "I see a cat.", ["I see a cat.", "i see a cat."], ""],
  ["Choose the sentence with the correct capital letter.", "Max has a map.", ["Max has a map.", "max has a map."], ""]
];

const firstSoundQuestions = firstSoundWords.map(([word, sound], index) => {
  const offset = simpleHash(word) % firstSoundChoices.length;
  return makeTemplateQuestion({
    id: `ixl_first_sound_${index + 1}`,
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    templateType: "FIRST_SOUND",
    prompt: "Listen to the word. What is the first sound?",
    targetWord: word,
    phonicsPattern: sound,
    correctAnswer: sound,
    answerOptions: [sound, ...pickDistractors(firstSoundChoices, sound, 3, offset)],
    itemType: "initial_sound",
    itemKey: sound,
    explanation: `${word} starts with ${sound}.`,
    tags: ["ixl_style", "first_sound"]
  });
});

const endingSoundQuestions = endingSoundWords.map(([word, sound], index) => {
  const offset = simpleHash(word) % endingChoices.length;
  return makeTemplateQuestion({
    id: `ixl_ending_sound_${index + 1}`,
    skillId: "final_sounds",
    skillName: "Final Sounds",
    templateType: "ENDING_SOUND",
    prompt: "Listen to the word. Which sound does it end with?",
    targetWord: word,
    phonicsPattern: sound,
    correctAnswer: sound,
    answerOptions: [sound, ...pickDistractors(endingChoices, sound, 3, offset)],
    itemType: "final_sound",
    itemKey: sound,
    explanation: `${word} ends with ${sound}.`,
    tags: ["ixl_style", "ending_sound"]
  });
});

const blendQuestions = blendItems.map(([word, blend], index) => {
  const offset = simpleHash(word) % blendPatterns.length;
  const optionWords = [word, ...pickDistractors(blendItems.map(item => item[0]), word, 3, offset + 1)];
  return makeTemplateQuestion({
    id: `ixl_blend_sound_${index + 1}`,
    skillId: "blends",
    skillName: "Blends",
    templateType: "BLEND_SOUNDS",
    prompt: "Click the button. Blend the sounds together. What word do they make?",
    targetWord: word,
    phonicsPattern: blend,
    correctAnswer: word,
    answerOptions: optionWords.map(assetFor),
    imageWord: "",
    audioWord: word,
    itemType: "phonics_pattern",
    itemKey: blend,
    explanation: `${word} starts with the ${blend} blend.`,
    tags: ["ixl_style", "blend_sounds"]
  });
});

const soundOrderQuestions = cvcWords.map((word, index) => makeTemplateQuestion({
  id: `ixl_sound_order_${index + 1}`,
  skillId: "cvc_short_vowels",
  skillName: "CVC and Short Vowels",
  templateType: "PUT_SOUNDS_IN_ORDER",
  prompt: "Listen to the word. Put the sounds in order to make the word.",
  targetWord: word,
  correctAnswer: word,
  answerOptions: [word],
  soundTiles: word.split(""),
  itemType: "cvc_word",
  itemKey: word,
  explanation: `The sounds make ${word}.`,
  tags: ["ixl_style", "sound_order", "cvc"]
}));

const completeWordQuestions = completeWordItems.map(([word, partial, correct, distractors], index) => makeTemplateQuestion({
  id: `ixl_complete_word_${index + 1}`,
  skillId: "cvc_short_vowels",
  skillName: "CVC and Short Vowels",
  templateType: "COMPLETE_WORD",
  prompt: "Complete the word to match the picture.",
  targetWord: word,
  correctAnswer: correct,
  answerOptions: [correct, ...distractors],
  partialWord: partial,
  itemType: "cvc_word",
  itemKey: word,
  explanation: `${partial.replace("__", correct)} spells ${word}.`,
  tags: ["ixl_style", "complete_word"]
}));

const rhymingPictureQuestions = rhymePairs.map(([target, correct, distractor, family], index) => makeTemplateQuestion({
  id: `ixl_rhyming_picture_${index + 1}`,
  skillId: "rhyming",
  skillName: "Rhyming",
  templateType: "RHYMING_PICTURE",
  prompt: `Which word rhymes with ${target}?`,
  targetWord: target,
  correctAnswer: correct,
  answerOptions: [assetFor(correct), assetFor(distractor)],
  imageWord: "",
  audioWord: target,
  itemType: "rhyming_family",
  itemKey: family,
  explanation: `${target} and ${correct} rhyme.`,
  tags: ["ixl_style", "rhyming_picture"]
}));

const shortVowelQuestions = shortVowelItems.map(([itemKey, label, correct, distractor], index) => makeTemplateQuestion({
  id: `ixl_short_vowel_${index + 1}`,
  skillId: "short_vowel_discrimination",
  skillName: "Short Vowel Discrimination",
  templateType: "SHORT_VOWEL_WORD",
  prompt: `Which word has the ${label} sound?`,
  targetWord: correct,
  phonicsPattern: itemKey,
  correctAnswer: correct,
  answerOptions: [assetFor(correct), assetFor(distractor)],
  imageWord: "",
  audioWord: correct,
  itemType: "short_vowel",
  itemKey,
  explanation: `${correct} has the ${label} sound.`,
  tags: ["ixl_style", "short_vowel"]
}));

const sentencePictureQuestions = sentencePictureItems.flatMap(([imageWord, correct, distractor], index) => {
  const question = makeTemplateQuestion({
    id: `ixl_sentence_picture_${index + 1}`,
    skillId: "sentence_comprehension",
    skillName: "Sentence Comprehension",
    templateType: "SENTENCE_MATCHES_PICTURE",
    prompt: "Which sentence matches the picture?",
    targetWord: imageWord,
    correctAnswer: correct,
    answerOptions: [correct, distractor],
    itemType: "sentence_comprehension",
    itemKey: imageWord,
    explanation: `The picture matches: ${correct}`,
    tags: ["ixl_style", "sentence_picture"]
  });
  return [question, { ...question, id: `ixl_sentence_picture_b_${index + 1}`, level: 2 }];
});

const nounCategoryQuestions = nounCategoryItems.flatMap(([prompt, correct, options], index) => {
  const question = makeTemplateQuestion({
    id: `ixl_category_${index + 1}`,
    skillId: "nouns",
    skillName: "Nouns",
    templateType: "VOCABULARY_CATEGORY",
    prompt,
    targetWord: correct,
    correctAnswer: correct,
    answerOptions: options.map(assetFor),
    imageWord: "",
    audioWord: "",
    itemType: "vocabulary_category",
    itemKey: correct,
    explanation: `${correct} is the best answer.`,
    tags: ["ixl_style", "category", "noun"]
  });
  return [question, { ...question, id: `ixl_category_b_${index + 1}`, level: 2 }];
});

const grammarQuestions = verbItems.flatMap(([prompt, correct, options, sentence = ""], index) => {
  const question = makeTemplateQuestion({
    id: `ixl_grammar_${index + 1}`,
    skillId: "verbs",
    skillName: "Verbs",
    templateType: "GRAMMAR_BASICS",
    prompt,
    targetWord: correct,
    correctAnswer: correct,
    answerOptions: options,
    imageWord: "",
    audioWord: "",
    itemType: "grammar_basic",
    itemKey: correct,
    explanation: `${correct} is the correct choice.`,
    tags: ["ixl_style", "grammar", "verb"]
  });
  return [
    { ...question, sentence },
    { ...question, id: `ixl_grammar_b_${index + 1}`, level: 2, sentence }
  ];
});

export const ixlStyleSeedQuestions = [
  ...firstSoundQuestions,
  ...endingSoundQuestions,
  ...blendQuestions,
  ...soundOrderQuestions,
  ...completeWordQuestions,
  ...rhymingPictureQuestions,
  ...shortVowelQuestions,
  ...sentencePictureQuestions,
  ...nounCategoryQuestions,
  ...grammarQuestions
];

export const ixlStyleTemplateTypes = [
  "FIRST_SOUND",
  "ENDING_SOUND",
  "BLEND_SOUNDS",
  "PUT_SOUNDS_IN_ORDER",
  "RHYMING_PICTURE",
  "SHORT_VOWEL_WORD",
  "COMPLETE_WORD",
  "SENTENCE_MATCHES_PICTURE",
  "VOCABULARY_CATEGORY",
  "GRAMMAR_BASICS"
];
