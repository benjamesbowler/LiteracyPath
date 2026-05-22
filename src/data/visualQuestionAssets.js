import { getChildAudioPath, getChildWordAsset } from "./childAssets.js";

const instructionAudioPath = "/audio/child-mode/phrases/listen-and-find.mp3";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

export function wordCard(word, overrides = {}) {
  const asset = getChildWordAsset(word);

  return {
    id: overrides.id || normalize(word),
    word,
    value: overrides.value || word,
    image: overrides.image || asset?.image || asset?.fallbackImage || "",
    audio: overrides.audio || asset?.audio || getChildAudioPath(word),
    alt: overrides.alt || asset?.alt || `Picture for ${word}`,
    source: overrides.source || asset?.source || "existing"
  };
}

export function hasCompleteVisualCards(cards = [], { requireImages = true, requireAudio = false } = {}) {
  return cards.length >= 2 && cards.every(card =>
    (!requireImages || card.image) &&
    (!requireAudio || card.audio)
  );
}

export function makeVisualCardChoiceQuestion({
  id,
  skill,
  skillId,
  itemType,
  itemKey,
  formatType,
  prompt,
  choices,
  answer,
  targetWord = answer,
  audioWord = "",
  imageWord = "",
  promptImageWords = [],
  requireOptionImages = true,
  requireOptionAudio = false,
  hideWrittenLabels = false,
  extra = {}
}) {
  const imageCards = choices.map(choice => wordCard(choice));
  const targetAsset = audioWord ? getChildWordAsset(audioWord) : null;
  const promptCards = promptImageWords.map(word => wordCard(word));
  const imageAsset = imageWord ? getChildWordAsset(imageWord) : null;

  return {
    id,
    grade: "K",
    skill,
    skillId,
    difficulty: 1,
    passage: "",
    question: prompt,
    prompt,
    questionType: "visual_card_choice",
    formatType,
    itemType,
    itemKey,
    targetWord,
    choices,
    answer,
    imageCards,
    promptImageCards: promptCards,
    imagePath: imageAsset?.image || imageAsset?.fallbackImage || "",
    audioText: audioWord || "",
    spokenPrompt: audioWord || prompt,
    audioPath: targetAsset?.audio || "",
    audioKey: audioWord || "",
    imageKey: imageWord || itemKey,
    requireOptionImages,
    requireOptionAudio,
    hideWrittenLabels,
    ...extra
  };
}

export function makeWordChoiceQuestion({
  id,
  skill,
  skillId,
  itemType,
  itemKey,
  formatType,
  prompt,
  choices,
  answer,
  targetWord = answer,
  audioWord = "",
  imageWord = "",
  promptImageWords = [],
  extra = {}
}) {
  const targetAsset = audioWord ? getChildWordAsset(audioWord) : null;
  const imageAsset = imageWord ? getChildWordAsset(imageWord) : null;

  return {
    id,
    grade: "K",
    skill,
    skillId,
    difficulty: 1,
    passage: "",
    question: prompt,
    prompt,
    questionType: "word_choice",
    formatType,
    itemType,
    itemKey,
    targetWord,
    choices,
    answer,
    promptImageCards: promptImageWords.map(word => wordCard(word)),
    imagePath: imageAsset?.image || imageAsset?.fallbackImage || "",
    audioText: audioWord || "",
    spokenPrompt: audioWord || prompt,
    audioPath: targetAsset?.audio || "",
    audioKey: audioWord || "",
    imageKey: imageWord || itemKey,
    ...extra
  };
}

export function makeRepeatedPromptCards(word, count = 3) {
  return Array.from({ length: count }, (_, index) => wordCard(word, {
    id: `${normalize(word)}-${index + 1}`
  }));
}

export function isVisualCardChoiceQuestion(question = {}) {
  return question.questionType === "visual_card_choice";
}

export function hasCompleteVisualQuestionAssets(question = {}) {
  if (!isVisualCardChoiceQuestion(question)) return true;
  const cardsOk = hasCompleteVisualCards(question.imageCards || [], {
    requireImages: question.requireOptionImages !== false,
    requireAudio: question.requireOptionAudio === true
  });
  const promptCardsOk = (question.promptImageCards || []).every(card => card.image);
  const targetAudioOk = !question.audioText || Boolean(question.audioPath);
  return cardsOk && promptCardsOk && targetAudioOk;
}

export function instructionAudio() {
  return instructionAudioPath;
}
