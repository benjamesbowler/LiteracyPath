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
  if (text.includes("short_vowel_discrimination") || text.includes("short vowel discrimination")) return "short_vowel_discrimination";
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

function shouldReplaceExistingTargetImage(targetWord, existingImagePath = "") {
  return targetWord === "lip" && existingImagePath === "/media/rhyming/images/lip.webp";
}

function answerValue(value) {
  if (Array.isArray(value)) return value[0] || "";
  if (value && typeof value === "object") return value.word || value.value || value.label || value.text || value.answer || "";
  return value || "";
}

function inferTargetWord(question = {}) {
  const skillId = normalizeSkillId(question.skillId || question.skill || question.skillName);
  const shouldUseAnswerAsWord =
    MEDIA_SKILLS.has(skillId) &&
    !isGraphemeChoiceQuestion(question);

  return normalizeWord(
    question.targetWord ||
    question.word ||
    question.audioText ||
    question.spokenWord ||
    question.anchorWord ||
    question.representedWord ||
    question.depthTargetWord ||
    (shouldUseAnswerAsWord ? answerValue(question.correctAnswer || question.answer) : "")
  );
}

function optionWord(option) {
  return normalizeWord(answerValue(option));
}

const SHORT_VOWEL_WORDS = {
  a: [
    "bag", "bat", "cap", "cat", "fan", "had", "hat", "jam", "mad", "man",
    "map", "mat", "nap", "pad", "pan", "ram", "rag", "sad", "sap", "tap"
  ],
  e: [
    "bed", "beg", "den", "hen", "jet", "leg", "men", "net", "peg", "pen",
    "pet", "red", "ten", "web", "wet"
  ],
  i: [
    "big", "bin", "fin", "fish", "hit", "kit", "lid", "lip", "mix", "pig",
    "pin", "rib", "sip", "sit", "wig"
  ],
  o: [
    "box", "cot", "dog", "dot", "fox", "hop", "log", "mop", "nod", "not",
    "pot", "rod", "sock", "top"
  ],
  u: [
    "bug", "cup", "cut", "duck", "fun", "hut", "mud", "mug", "nut", "pup",
    "rug", "sub", "sun", "tub"
  ]
};

const SHORT_VOWEL_VALUES = Object.keys(SHORT_VOWEL_WORDS);

function shortVowelInWord(word = "") {
  return String(word || "").match(/[aeiou]/)?.[0] || "";
}

function shortVowelTargetFromQuestion(question = {}, answerWord = "") {
  const text = String([
    question.itemKey,
    question.targetSound,
    question.phonicsPattern,
    question.question,
    question.prompt,
    question.spokenPrompt
  ].join(" ")).toLowerCase();
  const explicit = text.match(/short[_ -]?([aeiou])/);
  if (explicit) return explicit[1];
  const anchor = text.match(/(?:same middle sound as|same sound in the middle as|middle sound as|sound as)\s+['"]?([a-z]+)['"]?/);
  if (anchor) return shortVowelInWord(anchor[1]);
  return shortVowelInWord(answerWord);
}

function deterministicHash(value = "") {
  return Array.from(String(value)).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function rotate(values = [], seed = 0) {
  if (!values.length) return [];
  const offset = Math.abs(seed) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function optionHasUsableMedia(word) {
  return Boolean(resolveWordAsset(word)?.image);
}

function candidateWordsForVowel(vowel, exclude = new Set()) {
  return (SHORT_VOWEL_WORDS[vowel] || [])
    .filter(word => !exclude.has(word))
    .filter(optionHasUsableMedia);
}

function addDiverseWords(selected, candidates, limit) {
  for (const word of candidates) {
    if (selected.length >= limit) break;
    if (selected.includes(word)) continue;
    const initials = selected.map(item => item[0]);
    if (initials.includes(word[0])) continue;
    selected.push(word);
  }
  for (const word of candidates) {
    if (selected.length >= limit) break;
    if (!selected.includes(word)) selected.push(word);
  }
  return selected;
}

function buildBalancedShortVowelChoices(question = {}, answerWord = "") {
  const promptText = String([question.question, question.prompt, question.spokenPrompt].join(" ")).toLowerCase();
  const seed = deterministicHash(question.id || `${promptText}-${answerWord}`);
  const answerVowel = shortVowelInWord(answerWord);
  const targetVowel = shortVowelTargetFromQuestion(question, answerWord) || answerVowel;
  const exclude = new Set([answerWord]);
  const selected = [answerWord];

  if (/\bdoes\s+not\b/.test(promptText) && targetVowel) {
    const sameVowelCandidates = rotate(candidateWordsForVowel(targetVowel, exclude), seed)
      .filter(word => shortVowelInWord(word) === targetVowel);
    return addDiverseWords(selected, sameVowelCandidates, 4);
  }

  const distractorVowels = rotate(
    SHORT_VOWEL_VALUES.filter(vowel => vowel !== targetVowel),
    seed
  );

  for (const vowel of distractorVowels) {
    const candidates = rotate(candidateWordsForVowel(vowel, exclude), seed + vowel.charCodeAt(0));
    addDiverseWords(selected, candidates, Math.min(4, selected.length + 1));
  }

  if (selected.length < 4) {
    const fallback = rotate(
      SHORT_VOWEL_VALUES.flatMap(vowel => candidateWordsForVowel(vowel, exclude)),
      seed
    );
    addDiverseWords(selected, fallback, 4);
  }

  return selected.slice(0, 4);
}

function shouldBalanceShortVowelChoices(question = {}, skillId = "") {
  if (skillId !== "short_vowel_discrimination") return false;
  if (isGraphemeChoiceQuestion(question)) return false;
  const choices = question.choices || question.answerOptions || [];
  if (!Array.isArray(choices) || choices.length !== 4) return false;
  const answerWord = optionWord(question.correctAnswer || question.answer);
  if (!answerWord || !shortVowelInWord(answerWord)) return false;
  return choices.every(choice => {
    const word = optionWord(choice);
    return word && /^[a-z]+$/.test(word) && shortVowelInWord(word);
  });
}

function hasShortVowelShortcutPattern(choices = []) {
  const words = choices.map(optionWord).filter(Boolean);
  if (words.length !== 4) return false;
  const initialCounts = words.reduce((counts, word) => {
    counts[word[0]] = (counts[word[0]] || 0) + 1;
    return counts;
  }, {});
  const maxInitialCount = Math.max(...Object.values(initialCounts));
  return maxInitialCount >= 3;
}

export function balanceShortVowelDiscriminationChoices(question = {}) {
  const skillId = normalizeSkillId(question.skillId || question.skill || question.skillName || "");
  if (!shouldBalanceShortVowelChoices(question, skillId)) return question;

  const answerWord = optionWord(question.correctAnswer || question.answer);
  const currentChoices = question.choices || question.answerOptions || [];
  if (!hasShortVowelShortcutPattern(currentChoices)) return question;

  const choices = buildBalancedShortVowelChoices(question, answerWord);
  if (choices.length !== 4 || !choices.includes(answerWord)) return question;

  return {
    ...question,
    choices,
    answerOptions: choices,
    options: Array.isArray(question.options) ? choices : question.options,
    shortVowelDistractorsBalanced: true
  };
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

function optionImagePath(option = {}) {
  if (!option || typeof option !== "object") return "";
  return option.image || option.imageUrl || option.imagePath || option.media?.image || option.media?.imageUrl || option.media?.imagePath || "";
}

function stripOptionImage(option = {}) {
  if (!option || typeof option !== "object") return option;
  const { image, imageUrl, imagePath, media, ...rest } = option;
  if (media && typeof media === "object") {
    const {
      image: mediaImage,
      imageUrl: mediaImageUrl,
      imagePath: mediaImagePath,
      ...restMedia
    } = media;
    return Object.keys(restMedia).length ? { ...rest, media: restMedia } : rest;
  }
  return rest;
}

function normalizeOptionImageGroup(options = [], field = "answerOptions") {
  const enrichedOptions = options.map(enrichOption);
  const imageCount = enrichedOptions.filter(option => optionImagePath(option)).length;
  if (imageCount === 0 || imageCount === enrichedOptions.length) {
    return {
      options: enrichedOptions,
      mediaGap: null
    };
  }

  return {
    options: enrichedOptions.map(stripOptionImage),
    mediaGap: {
      field,
      optionCount: enrichedOptions.length,
      imageCount,
      missingOptions: enrichedOptions
        .filter(option => !optionImagePath(option))
        .map(option => optionWord(option))
        .filter(Boolean),
      normalizedToTextOnly: true
    }
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
  const suppressAudio = question.disableAudio === true || question.noAudio === true;

  if (targetAsset) {
    enriched.targetWord = enriched.targetWord || targetWord;
    const existingImage = firstPath(enriched.imagePath, enriched.imageUrl, enriched.image);
    const targetImage = shouldReplaceExistingTargetImage(targetWord, existingImage)
      ? targetAsset.image
      : existingImage || targetAsset.image;
    enriched.imageUrl = targetImage;
    enriched.imagePath = targetImage;
    if (!suppressAudio) {
      const existingAudio = firstPath(enriched.audioPath, enriched.audioUrl, enriched.audio);
      const approvedAudio = getApprovedAudioPath(targetWord, existingAudio) || targetAsset.audio;
      enriched.audioUrl = approvedAudio || existingAudio;
      enriched.audioPath = approvedAudio || existingAudio;
    }
  }

  const balanced = balanceShortVowelDiscriminationChoices(enriched);
  if (balanced !== enriched) {
    Object.assign(enriched, balanced);
  }

  const optionImageMediaGaps = [];
  if (Array.isArray(enriched.answerOptions) && !isGraphemeChoiceQuestion(enriched)) {
    const normalized = normalizeOptionImageGroup(enriched.answerOptions, "answerOptions");
    enriched.answerOptions = normalized.options;
    if (normalized.mediaGap) optionImageMediaGaps.push(normalized.mediaGap);
  }
  if (Array.isArray(enriched.options) && !isGraphemeChoiceQuestion(enriched)) {
    const normalized = normalizeOptionImageGroup(enriched.options, "options");
    enriched.options = normalized.options;
    if (normalized.mediaGap) optionImageMediaGaps.push(normalized.mediaGap);
  }
  if (optionImageMediaGaps.length) {
    enriched.optionImageMediaGaps = optionImageMediaGaps;
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
