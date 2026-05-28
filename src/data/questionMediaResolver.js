import { getApprovedAudioPath } from "./audioPreferenceManifest.js";
import { getChildAudioPath, getChildWordAsset } from "./childAssets.js";
import { getImportedVocabularyMedia } from "./importedVocabularyMediaManifest.js";
import { getLexiconEntry } from "../content/lexicon/masterWordLexicon.js";
import { isGraphemeChoiceQuestion } from "../utils/assessmentChoiceIntent.js";

const MEDIA_SKILLS = new Set([
  "initial_sounds",
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination",
  "blends",
  "digraphs",
  "long_vowels_silent_e",
  "vowel_teams",
  "r_controlled_vowels"
]);

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9'-]+/g, " ")
    .trim();
}

function normalizeSkillId(value = "") {
  const text = String(value || "").toLowerCase().replace(/&/g, "and");
  if (text.includes("initial")) return "initial_sounds";
  if (text.includes("final") || text.includes("ending")) return "final_sounds";
  if (text.includes("rhym")) return "rhyming";
  if (text.includes("short_vowel_discrimination")) return "short_vowel_discrimination";
  if (text.includes("cvc") || text.includes("short vowel")) return "cvc_short_vowels";
  if (text.includes("blend")) return "blends";
  if (text.includes("digraph")) return "digraphs";
  if (text.includes("long") || text.includes("silent")) return "long_vowels_silent_e";
  if (text.includes("vowel_team")) return "vowel_teams";
  if (text.includes("r_controlled")) return "r_controlled_vowels";
  return text.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function firstPath(...paths) {
  return paths.find(Boolean) || "";
}

function resolveWordAsset(word) {
  const normalized = normalizeWord(word);
  if (!normalized) return null;
  const childAsset = getChildWordAsset(normalized);
  const lexiconEntry = getLexiconEntry(normalized);
  const importedMedia = getImportedVocabularyMedia(normalized);
  const image = firstPath(
    childAsset?.image,
    childAsset?.fallbackImage,
    lexiconEntry?.imageUrl,
    lexiconEntry?.imagePath,
    importedMedia?.image
  );
  const audio = getApprovedAudioPath(
    normalized,
    firstPath(childAsset?.audio, getChildAudioPath(normalized), lexiconEntry?.audioUrl, lexiconEntry?.audioPath, importedMedia?.audio)
  );
  if (!image && !audio) return null;
  return {
    word: normalized,
    image,
    audio,
    alt: childAsset?.alt || `Picture for ${normalized}`,
    source: childAsset?.source || lexiconEntry?.source || "existing-media"
  };
}

function answerValue(value) {
  if (Array.isArray(value)) return value[0] || "";
  if (value && typeof value === "object") return value.word || value.value || value.label || value.text || value.answer || "";
  return value || "";
}

function inferTargetWord(question = {}) {
  return normalizeWord(
    question.targetWord ||
    question.word ||
    question.audioText ||
    question.spokenWord ||
    question.anchorWord ||
    question.representedWord ||
    question.depthTargetWord ||
    (MEDIA_SKILLS.has(normalizeSkillId(question.skillId || question.skill || question.skillName)) ? answerValue(question.correctAnswer || question.answer) : "")
  );
}

function optionWord(option) {
  return normalizeWord(answerValue(option));
}

function enrichOption(option) {
  const word = optionWord(option);
  if (!word) return option;
  const asset = resolveWordAsset(word);
  if (!asset) return option;
  if (option && typeof option === "object") {
    return {
      ...option,
      word: option.word || word,
      label: option.label || word,
      value: option.value || word,
      image: option.image || option.imageUrl || option.imagePath || asset.image,
      imageUrl: option.imageUrl || option.image || option.imagePath || asset.image,
      alt: option.alt || asset.alt
    };
  }
  return {
    word,
    label: word,
    value: word,
    image: asset.image,
    imageUrl: asset.image,
    alt: asset.alt
  };
}

function shouldBuildImageCards(question = {}, skillId = "") {
  if (question.imageCards?.length) return false;
  if (!["rhyming", "initial_sounds"].includes(skillId)) return false;
  const choices = question.choices || question.answerOptions || [];
  return Array.isArray(choices) && choices.length > 0;
}

export function enrichQuestionWithExistingMedia(question = {}) {
  const skillId = normalizeSkillId(question.skillId || question.skill || question.skillName || "");
  const inferredTargetWord = inferTargetWord(question);
  const answerWord = normalizeWord(answerValue(question.correctAnswer || question.answer));
  const importedMediaWord = [inferredTargetWord, answerWord]
    .find(word => word && getImportedVocabularyMedia(word));
  if (!MEDIA_SKILLS.has(skillId) && !importedMediaWord) return question;

  const targetWord = inferredTargetWord || importedMediaWord;
  const targetAsset = resolveWordAsset(targetWord);
  const enriched = {
    ...question,
    skillId: question.skillId || skillId
  };

  if (targetAsset) {
    enriched.targetWord = enriched.targetWord || targetWord;
    enriched.imageUrl = enriched.imageUrl || enriched.imagePath || enriched.image || targetAsset.image;
    enriched.imagePath = enriched.imagePath || enriched.imageUrl || enriched.image || targetAsset.image;
    enriched.audioUrl = enriched.audioUrl || enriched.audioPath || enriched.audio || targetAsset.audio;
    enriched.audioPath = enriched.audioPath || enriched.audioUrl || enriched.audio || targetAsset.audio;
  }

  if (Array.isArray(enriched.answerOptions) && !isGraphemeChoiceQuestion(enriched)) {
    enriched.answerOptions = enriched.answerOptions.map(enrichOption);
  }
  if (Array.isArray(enriched.options) && !isGraphemeChoiceQuestion(enriched)) {
    enriched.options = enriched.options.map(enrichOption);
  }

  if (shouldBuildImageCards(enriched, skillId)) {
    const choices = enriched.choices || enriched.answerOptions || [];
    const cards = choices.map(enrichOption).filter(card => card?.image || card?.imageUrl);
    if (cards.length === choices.length) {
      enriched.imageCards = cards;
    }
  }

  return enriched;
}
