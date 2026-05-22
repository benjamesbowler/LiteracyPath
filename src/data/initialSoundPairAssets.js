import { getChildAudioPath, getChildWordAsset } from "./childAssets.js";

const instructionAudioPath = "/audio/child-mode/phrases/listen-and-find.mp3";

const initialSoundPairSets = {
  b: ["bat", "bag", "sun"],
  c: ["cat", "cap", "dog"],
  d: ["dog", "dig", "sun"],
  f: ["fish", "fin", "map"],
  h: ["hat", "ham", "dog"],
  l: ["log", "leg", "sun"],
  m: ["mud", "map", "net"],
  n: ["net", "nut", "map"],
  p: ["pig", "pan", "sun"],
  r: ["red", "ram", "dog"],
  s: ["sun", "sit", "map"],
  w: ["whale", "wig", "sun"]
};

export const initialSoundPairItemKeys = Object.keys(initialSoundPairSets);

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function initialLetter(word) {
  return normalize(word)[0] || "";
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

  return {
    word,
    image: asset?.image || asset?.fallbackImage || "",
    audio: asset?.audio || getChildAudioPath(word),
    alt: asset?.alt || `Picture for ${word}`
  };
}

function hasCompleteCards(cards = []) {
  return cards.length >= 3 && cards.every(card => card.image && card.audio);
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

  const words = initialSoundPairSets[inferredKey];
  const correctWords = words.slice(0, 2);
  const cards = words.map(wordCard);

  if (!hasCompleteCards(cards)) {
    return question;
  }

  return {
    ...question,
    question: "Listen to each word. Which two words start with the same sound?",
    prompt: "Listen to each word. Which two words start with the same sound?",
    spokenPrompt: "Listen and find.",
    audioText: "listen and find",
    audioPath: instructionAudioPath,
    questionType: "initial_sound_pair",
    formatType: "IMAGE_INITIAL_SOUND",
    phonicsPosition: "initial",
    itemType: "initial_sound",
    itemKey: inferredKey,
    answer: pairAnswer(correctWords),
    correctWords,
    choices: words,
    imageCards: cards,
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
