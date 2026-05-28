import { getChildAudioPath, getChildWordAsset } from "./childAssets.js";
import { getApprovedAudioPath } from "./audioPreferenceManifest.js";

const instructionAudioPath = "/audio/child-mode/phrases/listen-and-find.mp3";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
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

const finalSoundPairFillers = [
  "cat",
  "dog",
  "sun",
  "fish",
  "map",
  "pen",
  "cup",
  "hat",
  "pig",
  "bed"
];

function ensureFourFinalSoundWords(words = []) {
  const normalized = new Set(words.map(normalize));
  const output = [...words];
  for (const filler of finalSoundPairFillers) {
    if (output.length >= 4) break;
    if (normalized.has(normalize(filler))) continue;
    output.push(filler);
    normalized.add(normalize(filler));
  }
  return output;
}

export function isPairSelectionQuestion(question = {}) {
  return [
    "initial_sound_pair",
    "final_sound_pair",
    "rhyme_pair"
  ].includes(question.questionType);
}

export function normalizePairSelectionAnswer(value) {
  if (Array.isArray(value)) return pairAnswer(value);
  return String(value || "")
    .split("|")
    .map(normalize)
    .filter(Boolean)
    .sort()
    .join("|");
}

export function hasCompletePairSelectionAssets(question = {}) {
  const requiredCardCount = question.skillId === "final_sounds" || question.itemType === "final_sound" ? 4 : 3;
  return isPairSelectionQuestion(question) &&
    (question.imageCards || []).length >= requiredCardCount &&
    (question.imageCards || []).every(card => card.image && card.audio);
}

export function makePairSelectionQuestion({
  id,
  skill,
  skillId,
  itemType,
  itemKey,
  targetSound = itemKey,
  formatType,
  questionType,
  prompt,
  words,
  pairVariant = 0,
  level = 1,
  difficulty = level,
  finalSoundType = "",
  targetFinalSound = targetSound,
  phase = null,
  phaseTarget = ""
}) {
  const correctWords = words.slice(0, 2);
  const displayWords = itemType === "final_sound" || skillId === "final_sounds"
    ? ensureFourFinalSoundWords(words)
    : words;
  const cards = displayWords.map(wordCard);

  return {
    id,
    grade: "K",
    skill,
    skillId,
    level,
    ...(phase ? { phase } : {}),
    ...(phaseTarget ? { phaseTarget } : {}),
    difficulty,
    passage: "",
    question: prompt,
    prompt,
    spokenPrompt: "Listen and find.",
    audioText: "listen and find",
    audioPath: getApprovedAudioPath("listen-and-find", instructionAudioPath),
    questionType,
    formatType,
    phonicsPosition: itemType === "final_sound" ? "final" : "mixed",
    itemType,
    itemKey,
    targetWord: correctWords[0],
    anchorWord: correctWords[0],
    targetSound,
    targetFinalSound,
    finalSoundType,
    answer: pairAnswer(correctWords),
    correctAnswer: pairAnswer(correctWords),
    correctAnswers: correctWords,
    correctWords,
    choices: displayWords,
    options: cards,
    imageCards: cards,
    audioKey: "listen-and-find",
    imageKey: itemKey,
    pairVariant,
    hideWrittenLabels: true
  };
}
