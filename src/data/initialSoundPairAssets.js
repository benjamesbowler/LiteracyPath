import { getChildAudioPath, getChildWordAsset } from "./childAssets.js";
import { getApprovedAudioPath } from "./audioPreferenceManifest.js";

const instructionAudioPath = "/audio/child-mode/phrases/listen-and-find.mp3";

const initialSoundPairSets = {
  a: [["apple", "ant", "dog"], ["axe", "ant", "fish"]],
  b: [["ball", "bird", "cat"], ["bat", "bag", "sun"]],
  c: [["cat", "cap", "dog"], ["cake", "corn", "fish"]],
  d: [["dog", "duck", "sun"], ["desk", "dig", "map"]],
  e: [["egg", "elephant", "cat"], ["envelope", "egg", "dog"]],
  f: [["fan", "fish", "map"], ["fork", "farm", "sun"]],
  g: [["gate", "girl", "sun"], ["gum", "gate", "fish"]],
  h: [["hat", "hand", "dog"], ["hen", "house", "map"]],
  i: [["igloo", "ink", "dog"], ["insect", "igloo", "sun"]],
  j: [["jam", "jug", "dog"], ["jet", "jam", "sun"]],
  k: [["king", "kite", "dog"], ["key", "kid", "sun"]],
  l: [["lion", "lamp", "dog"], ["leg", "lid", "sun"]],
  m: [["mud", "map", "net"], ["moon", "mop", "sun"]],
  n: [["net", "nut", "map"], ["nap", "nose", "dog"]],
  o: [["ox", "octopus", "dog"], ["orange", "octopus", "sun"]],
  p: [["pig", "pan", "sun"], ["pen", "pin", "dog"]],
  q: [["queen", "quilt", "dog"], ["quiz", "queen", "sun"]],
  r: [["red", "ram", "dog"], ["rat", "rug", "sun"]],
  s: [["sun", "sit", "map"], ["seed", "seal", "dog"]],
  t: [["tent", "ten", "dog"], ["tiger", "top", "sun"]],
  u: [["umbrella", "under", "dog"], ["uncle", "up", "cat"]],
  v: [["van", "vase", "dog"], ["vest", "vet", "sun"]],
  w: [["whale", "wig", "sun"], ["web", "worm", "dog"]],
  y: [["yak", "yarn", "dog"], ["yo-yo", "yak", "sun"]],
  z: [["zebra", "zip", "dog"], ["zoo", "zebra", "sun"]]
};

export const initialSoundPairItemKeys = Object.keys(initialSoundPairSets);

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function initialLetter(word) {
  return normalize(word)[0] || "";
}

function stableIndex(value, length) {
  if (!length) return 0;
  const text = normalize(value);
  let total = 0;
  for (const char of text) total += char.charCodeAt(0);
  return total % length;
}

function pairAnswer(words) {
  return words
    .slice(0, 2)
    .map(normalize)
    .sort()
    .join("|");
}

function wordCard(word) {
  const asset = getChildWordAsset(word);
  const audio = getApprovedAudioPath(word, asset?.audio || getChildAudioPath(word));

  return {
    word,
    image: asset?.image || asset?.fallbackImage || "",
    audio,
    alt: asset?.alt || `Picture for ${word}`,
    source: asset?.source || "existing"
  };
}

function hasCompleteCards(cards = []) {
  return cards.length >= 3 && cards.every(card => card.image && card.audio);
}

function getVariantWords(question = {}, itemKey = "") {
  const variants = initialSoundPairSets[itemKey] || [];
  if (!variants.length) return [];
  const explicitIndex = Number.isInteger(question.pairVariant)
    ? question.pairVariant
    : Number.isInteger(question.variantIndex)
      ? question.variantIndex
      : null;
  const index = explicitIndex === null
    ? stableIndex(question.id || question.answer || itemKey, variants.length)
    : explicitIndex;
  return variants[((index % variants.length) + variants.length) % variants.length];
}

export function isInitialSoundQuestion(question = {}) {
  return normalize(question.itemType) === "initial_sound" ||
    normalize(question.skill).includes("initial");
}

export function isInitialSoundPairQuestion(question = {}) {
  return question.questionType === "initial_sound_pair";
}

export function hasCompleteInitialSoundPairAssets(question = {}) {
  if (!isInitialSoundPairQuestion(question)) return false;
  return hasCompleteCards(question.imageCards || []);
}

export function normalizeInitialSoundPairAnswer(value) {
  if (Array.isArray(value)) return pairAnswer(value);
  return String(value || "")
    .split("|")
    .map(normalize)
    .filter(Boolean)
    .sort()
    .join("|");
}

export function enrichInitialSoundPairQuestion(question = {}) {
  const skill = normalize(question.skill);
  const explicitKey = normalize(question.itemType) === "initial_sound"
    ? normalize(question.itemKey)
    : "";
  const inferredKey = explicitKey || normalize(question.answer)[0] || "";

  if (!skill.includes("initial") || !initialSoundPairSets[inferredKey]) {
    return question;
  }

  const words = getVariantWords(question, inferredKey);
  const correctWords = words.slice(0, 2);
  const cards = words.map(wordCard);

  if (!hasCompleteCards(cards)) {
    return question;
  }

  return {
    ...question,
    skillId: "initial_sounds",
    question: "Listen to each word. Which two words start with the same sound?",
    prompt: "Listen to each word. Which two words start with the same sound?",
    spokenPrompt: "Listen and find.",
    audioText: "listen and find",
    audioPath: getApprovedAudioPath("listen-and-find", instructionAudioPath),
    questionType: "initial_sound_pair",
    formatType: "INITIAL_SOUND_PAIR_SELECT",
    phonicsPosition: "initial",
    itemType: "initial_sound",
    itemKey: inferredKey,
    targetSound: inferredKey,
    answer: pairAnswer(correctWords),
    correctAnswer: pairAnswer(correctWords),
    correctAnswers: correctWords,
    correctWords,
    choices: words,
    options: cards,
    imageCards: cards,
    audioKey: "listen-and-find",
    imageKey: inferredKey,
    hideWrittenLabels: true
  };
}

export function getInitialSoundPairDiagnostics(question = {}) {
  const skill = normalize(question.skill);
  const itemKey = normalize(question.itemType) === "initial_sound"
    ? normalize(question.itemKey)
    : normalize(question.answer)[0] || "";

  if (!skill.includes("initial")) return null;

  const supported = Boolean(initialSoundPairSets[itemKey]);
  const enriched = enrichInitialSoundPairQuestion(question);
  const cards = enriched.imageCards || [];
  const missingImages = cards.filter(card => !card.image).map(card => card.word);
  const missingAudio = cards.filter(card => !card.audio).map(card => card.word);
  const correctWords = enriched.correctWords || [];
  const pairMatchesKey =
    correctWords.length === 2 &&
    correctWords.every(word => initialLetter(word) === itemKey);

  return {
    question: enriched,
    itemKey,
    supported,
    missingImages,
    missingAudio,
    pairMatchesKey
  };
}
