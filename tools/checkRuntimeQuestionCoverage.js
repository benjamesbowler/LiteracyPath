import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { skillTree } from "../src/skillTree.js";
import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { initialSoundCoverageQuestions } from "../src/data/initialSoundCoverageQuestions.js";
import { finalSoundCoverageQuestions } from "../src/data/finalSoundCoverageQuestions.js";
import { rhymingCoverageQuestions } from "../src/data/rhymingCoverageQuestions.js";
import { cvcShortVowelExpansionQuestions } from "../src/data/cvcShortVowelExpansionQuestions.js";
import { contentExpansionPass3Questions } from "../src/data/contentExpansionPass3Questions.js";
import { targetedContentRecoveryQuestions } from "../src/data/targetedContentRecoveryQuestions.js";
import { kimiDataset7RuntimeQuestions } from "../src/data/kimiDataset7RuntimeQuestions.js";
import { safeContentExpansionQuestions } from "../src/data/safeContentExpansionQuestions.js";
import { ixlStyleSeedQuestions } from "../src/data/ixlStyleSeedQuestions.js";
import { kimiDataset7Candidates } from "../src/data/imported/kimiDataset7Candidates.js";
import { kimiDataset7Summary } from "../src/data/imported/kimiDataset7Summary.js";
import { coverageExpectations } from "../src/data/coverageExpectations.js";
import { enrichListenAndFindWordQuestion, getListenAndFindAssetDiagnostics } from "../src/data/listenAndFindAssets.js";
import {
  enrichInitialSoundPairQuestion,
  getInitialSoundPairDiagnostics,
  hasCompleteInitialSoundPairAssets,
  isInitialSoundQuestion,
  isInitialSoundPairQuestion
} from "../src/data/initialSoundPairAssets.js";
import {
  hasCompletePairSelectionAssets,
  isPairSelectionQuestion
} from "../src/data/soundPairAssets.js";
import {
  hasCompleteVisualQuestionAssets,
  isVisualCardChoiceQuestion
} from "../src/data/visualQuestionAssets.js";
import { templateQuestions } from "../src/data/templateQuestions.js";
import { templateExpansion } from "../src/data/templateExpansion.js";
import { templateExpansion2 } from "../src/data/templateExpansion2.js";
import { templateExpansion3 } from "../src/data/templateExpansion3.js";
import { templateExpansion4 } from "../src/data/templateExpansion4.js";
import { templateExpansion5 } from "../src/data/templateExpansion5.js";
import { templateExpansion6 } from "../src/data/templateExpansion6.js";
import { templateExpansion7 } from "../src/data/templateExpansion7.js";
import { questionBankExpansion8 } from "../src/data/questionBankExpansion8.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { getQuestionFormatMetadata } from "../src/questionFormatFramework.js";
import { getChildWordAsset } from "../src/data/childAssets.js";
import {
  audioPreferenceManifest,
  getApprovedAudioPath,
  getAudioPreferenceForPath,
  getAudioReviewNote,
  getAudioPreference,
  isDeprecatedAudioPath,
  isReviewNeededAudioPath
} from "../src/data/audioPreferenceManifest.js";
import { getAssessmentContentIssues } from "../src/assessmentContentValidation.js";
import { getQuestionSignature } from "../src/questionRepeatGuards.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const minimumRuntimeQuestions = 52;

const runtimeQuestionBanks = [
  ["masteryCoreQuestions", masteryCoreQuestions],
  ["masteryExtraQuestions", masteryExtraQuestions],
  ["initialSoundCoverageQuestions", initialSoundCoverageQuestions],
  ["finalSoundCoverageQuestions", finalSoundCoverageQuestions],
  ["rhymingCoverageQuestions", rhymingCoverageQuestions],
  ["cvcShortVowelExpansionQuestions", cvcShortVowelExpansionQuestions],
  ["contentExpansionPass3Questions", contentExpansionPass3Questions],
  ["targetedContentRecoveryQuestions", targetedContentRecoveryQuestions],
  ["kimiDataset7RuntimeQuestions", kimiDataset7RuntimeQuestions],
  ["safeContentExpansionQuestions", safeContentExpansionQuestions],
  ["ixlStyleSeedQuestions", ixlStyleSeedQuestions],
  ["templateQuestions", templateQuestions],
  ["templateExpansion", templateExpansion],
  ["templateExpansion2", templateExpansion2],
  ["templateExpansion3", templateExpansion3],
  ["templateExpansion4", templateExpansion4],
  ["templateExpansion5", templateExpansion5],
  ["templateExpansion6", templateExpansion6],
  ["templateExpansion7", templateExpansion7],
  ["questionBankExpansion8", questionBankExpansion8],
  ["generatedQuestions", generatedQuestions],
  ["fixSentenceQuestions", fixSentenceQuestions],
  ["templateComprehensionAdvanced", templateComprehensionAdvanced]
];

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

const coverageEnabledStages = new Set([
  "Initial Sounds",
  "Final Sounds",
  "Rhyming",
  "CVC and Short Vowels",
  "Short Vowel Discrimination",
  "High-Frequency Words 1-25",
  "High-Frequency Words 26-50",
  "High-Frequency Words 51-100",
  "Blends",
  "Digraphs",
  "Long Vowels and Silent E",
  "Vowel Teams",
  "R-Controlled Vowels"
]);

const vowelTeamPatterns = ["ai", "ay", "ee", "ea", "oa", "ow", "igh", "ie", "oo", "ue", "ew", "oi", "oy", "ou", "aw"];
const rControlledPatterns = ["ar", "er", "ir", "or", "ur"];
const blendPatterns = ["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw"];
const digraphPatterns = ["sh", "ch", "th", "wh", "ph"];

function findPattern(patterns, text) {
  const normalized = normalize(text);
  return patterns.find(pattern => normalized.includes(pattern));
}

function inferCoverageMetadata(question, stageLabel) {
  if (question.itemType && question.itemKey) {
    return { itemType: question.itemType, itemKey: normalize(question.itemKey) };
  }

  const answer = normalize(question.answer);
  const text = normalize([question.question, question.prompt, question.spokenPrompt, question.audioText, question.passage, answer].join(" "));
  if (question.questionType === "fix_sentence") {
    return { itemType: "sentence_order", itemKey: question.id };
  }
  if (!answer) return null;

  if (stageLabel.startsWith("High-Frequency Words")) return { itemType: "sight_word", itemKey: answer };
  if (stageLabel === "Initial Sounds") return { itemType: "initial_sound", itemKey: answer[0] };
  if (stageLabel === "Final Sounds") return { itemType: "final_sound", itemKey: answer.at(-1) };
  if (stageLabel === "Rhyming") {
    const anchor = text.match(/rhymes? with ([a-z]+)/)?.[1];
    return { itemType: "rhyming_family", itemKey: (anchor || answer).slice(-2) };
  }
  if (stageLabel === "CVC and Short Vowels") return { itemType: "cvc_word", itemKey: answer };
  if (stageLabel === "Short Vowel Discrimination") {
    const vowel = answer.split("").find(letter => "aeiou".includes(letter));
    return vowel ? { itemType: "short_vowel", itemKey: `short_${vowel}` } : null;
  }
  if (stageLabel === "Blends") {
    const pattern = findPattern(blendPatterns, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stageLabel === "Digraphs") {
    const pattern = findPattern(digraphPatterns, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stageLabel === "Long Vowels and Silent E") {
    const pattern = text.match(/long ([aeiou])/)?.[1] || answer.match(/([aeiou])[^aeiou]?e$/)?.[1];
    return pattern ? { itemType: "phonics_pattern", itemKey: `${pattern}_e` } : null;
  }
  if (stageLabel === "Vowel Teams") {
    const pattern = findPattern(vowelTeamPatterns, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stageLabel === "R-Controlled Vowels") {
    const pattern = findPattern(rControlledPatterns, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }

  if (stageLabel === "Nouns") return { itemType: "grammar_noun", itemKey: answer };
  if (stageLabel === "Verbs") return { itemType: "grammar_verb", itemKey: answer };
  if (stageLabel === "Adjectives") return { itemType: "grammar_adjective", itemKey: answer };
  if (stageLabel === "Prepositions of Place") return { itemType: "preposition", itemKey: answer };
  if (stageLabel === "Plurals") return { itemType: "plural_form", itemKey: answer };
  if (stageLabel === "Prefixes and Suffixes") return { itemType: "morphology", itemKey: answer };
  if (stageLabel === "Antonyms and Synonyms") return { itemType: "semantic_relation", itemKey: answer };
  if (stageLabel === "Homophones and Homonyms") return { itemType: "homophone", itemKey: answer };
  if (stageLabel === "Sentence Comprehension") return { itemType: "sentence_comprehension", itemKey: question.id };

  if ([
    "Key Details",
    "Sequencing",
    "Main Idea",
    "Inference",
    "Cause and Effect",
    "Context Clues",
    "Theme and Higher Comprehension"
  ].includes(stageLabel)) {
    return { itemType: "reading_comprehension", itemKey: question.id };
  }

  return null;
}

function getStageIndex(question) {
  const skill = normalize(question.skill);

  const exactIndex = skillTree.findIndex(stage =>
    stage.match.some(term => skill === normalize(term))
  );

  if (exactIndex !== -1) return exactIndex;

  return skillTree.findIndex(stage =>
    stage.match.some(term =>
      skill.includes(normalize(term)) ||
      normalize(term).includes(skill)
    )
  );
}

function isFixSentenceQuestion(question) {
  return question?.questionType === "fix_sentence";
}

function isWordRecognitionQuestion(question) {
  const typeText = normalize([question.questionType, question.formatType].join(" "));
  return typeText.includes("word recognition") || typeText.includes("print match");
}

function getAnchorWord(question) {
  const text = normalize([question.question, question.prompt, question.spokenPrompt].join(" "));
  const match =
    text.match(/\b(?:starts the same as|ends the same as|starts like|ends like|has the same middle sound as|same sound in the middle as) ([a-z]+)\b/);

  return match?.[1] || "";
}

function hasAnchorChoiceLeakage(question) {
  if (isWordRecognitionQuestion(question)) return false;

  const anchor = getAnchorWord(question);
  if (!anchor || !Array.isArray(question.choices)) return false;

  return question.choices.map(choice => normalize(choice)).includes(anchor);
}

function sentenceCompletionMissingContext(question) {
  const promptText = String([question.question, question.prompt, question.spokenPrompt].join(" "));
  if (!/\b(complete(?:s)? the sentence|best completes the sentence)\b/i.test(promptText)) return false;

  return !(question.passage || question.sentence || question.context || question.brokenSentence);
}

function questionContainsWord(question, word) {
  const target = normalize(word);
  const values = [
    question.answer,
    question.correctAnswer,
    question.targetWord,
    question.audioText,
    ...(question.choices || []),
    ...(question.correctWords || []),
    ...(question.correctAnswers || []),
    ...(question.imageCards || []).map(card => card.word)
  ];

  return values.some(value => normalize(value) === target);
}

function weakLegacyPhonicsReason(question) {
  const skill = normalize(question.skill);
  const promptText = normalize([question.question, question.prompt, question.spokenPrompt].join(" "));
  const formatType = String(question.formatType || "").toUpperCase();
  const questionType = normalize(question.questionType);
  const hasVisualOrAudio =
    Boolean(
      question.imagePath ||
      question.audioPath ||
      question.imageCards?.length ||
      question.promptImageCards?.length ||
      question.answerOptions?.some(option => option?.image || option?.audio)
    );
  const assetBackedFormats = new Set([
    "INITIAL_SOUND_PAIR_SELECT",
    "FINAL_SOUND_PAIR_SELECT",
    "RHYME_PAIR_SELECT",
    "LISTEN_FIND_RHYME",
    "READ_FIND_RHYME",
    "LISTEN_CHOOSE_VOWEL",
    "PICTURE_TO_PRINT_MATCH",
    "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    "MISSING_VOWEL_CVC",
    "PICTURE_AUDIO_TO_PATTERN",
    "IMAGE_WORD_PATTERN_MATCH",
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
  ]);

  if (assetBackedFormats.has(formatType) || questionType === "listen_and_find_word") return "";

  if (skill.includes("initial") && /\b(which word starts the same as|starts the same as|starts like)\b/.test(promptText)) {
    return "legacy text-only Initial Sounds anchor prompt";
  }
  if (skill.includes("final") && /\b(which word ends|ends the same|ends like)\b/.test(promptText)) {
    return "legacy text-only Final Sounds prompt";
  }
  if (/\b(which word rhymes|choose the word that rhymes)\b/.test(promptText) && !hasVisualOrAudio) {
    return "legacy text-only Rhyming prompt";
  }
  if ((skill.includes("short vowel") || skill.includes("cvc")) && /\b(same middle sound|same sound in the middle)\b/.test(promptText)) {
    return "legacy text-only short-vowel/CVC sound prompt";
  }
  if ((skill.includes("blend") || skill.includes("digraph")) && /\bwhich word starts with\b/.test(promptText) && !hasVisualOrAudio) {
    return "legacy text-only blend/digraph visual pattern prompt";
  }
  if (/\bwhich word has the [a-z]{2} (?:blend|digraph)\b/.test(promptText) && !hasVisualOrAudio) {
    return "legacy text-only blend/digraph visual pattern prompt";
  }

  return "";
}

function isAllowedInitialSoundRuntimeFormat(question) {
  const formatType = String(question?.templateType || question?.formatType || "").toUpperCase();
  return isInitialSoundPairQuestion(question) || formatType === "FIRST_SOUND";
}

function lowQualityPluralDistractorReason(question) {
  const skill = normalize(question.skill);
  if (!skill.includes("plural")) return "";

  const zDistractors = (question.choices || [])
    .map(choice => normalize(choice))
    .filter(choice => choice.endsWith("z"));

  return zDistractors.length
    ? `low-quality plural z distractors: ${zDistractors.join(", ")}`
    : "";
}

function isQuestionValid(question) {
  if (!question) return false;
  if (!question.id || !question.skill || !(question.prompt || question.question)) return false;

  if (isFixSentenceQuestion(question)) {
    const tiles = question.tiles || question.choices;

    return Boolean(
      question.correctSentence &&
      question.brokenSentence &&
      Array.isArray(tiles) &&
      tiles.length >= 2 &&
      getStageIndex(question) !== -1
    );
  }

  if (!question.answer) return false;
  if (question.questionType === "ixl_template" && String(question.templateType || question.formatType || "").toUpperCase() === "PUT_SOUNDS_IN_ORDER") {
    return Array.isArray(question.soundTiles) &&
      question.soundTiles.length >= 2 &&
      getStageIndex(question) !== -1 &&
      getAssessmentContentIssues(question, { assetExists: publicAssetExists }).length === 0;
  }
  if (!Array.isArray(question.choices) || question.choices.length < 2) return false;
  if (!isPairSelectionQuestion(question) && !question.choices.includes(question.answer)) return false;
  if (getStageIndex(question) === -1) return false;
  if (question.questionType === "initial_sound_pair" && isInitialSoundQuestion(question) && !hasCompleteInitialSoundPairAssets(question)) return false;
  if (isPairSelectionQuestion(question) && !hasCompletePairSelectionAssets(question)) return false;
  if (isVisualCardChoiceQuestion(question) && !hasCompleteVisualQuestionAssets(question)) return false;
  if (isPictureToPrintQuestion(question) && ((question.imageCards || []).length > 0 || Object.keys(question.choiceImages || {}).length > 0)) return false;
  if (question.questionType === "listen_and_find_word") {
    const diagnostics = getListenAndFindAssetDiagnostics(question);
    if (
      diagnostics?.missingAudio ||
      diagnostics?.missingImages.length > 0 ||
      diagnostics?.missingChoiceAssets.length > 0 ||
      !diagnostics?.usesSingleWordAudioText
    ) return false;
  }
  if (hasAnchorChoiceLeakage(question)) return false;
  if (sentenceCompletionMissingContext(question)) return false;
  if (questionContainsWord(question, "pun")) return false;
  if (weakLegacyPhonicsReason(question)) return false;
  if (lowQualityPluralDistractorReason(question)) return false;
  if (getAssessmentContentIssues(question, { assetExists: publicAssetExists }).length > 0) return false;

  const choices = question.choices.map(choice => normalize(choice));
  if (new Set(choices).size !== choices.length && !(question.questionType === "ixl_template" && String(question.templateType || question.formatType || "").toUpperCase() === "GRAMMAR_BASICS")) return false;

  const questionText = normalize(question.question);
  const allText = [
    question.question,
    question.skill,
    question.passage,
    ...question.choices
  ].join(" ").toLowerCase();

  if (questionText.includes("silent letter")) return false;
  if (allText.includes("sun") && allText.includes("son") && allText.includes("middle")) return false;
  if (questionText.includes("which word spells")) return false;
  if (questionText.includes("matches the picture") && !question.imagePath) return false;

  return true;
}

function publicAssetExists(assetPath) {
  return Boolean(
    assetPath &&
    String(assetPath).startsWith("/") &&
    fs.existsSync(path.join(rootDir, "public", assetPath))
  );
}

function questionImageAssets(question) {
  const assets = [];

  if (question.imagePath) {
    assets.push({
      key: question.answer || question.id,
      path: question.imagePath,
      role: "question image"
    });
  }

  for (const card of question.promptImageCards || []) {
    assets.push({
      key: card.word,
      path: card.image,
      role: "prompt image"
    });
  }

  for (const card of question.imageCards || []) {
    assets.push({
      key: card.word,
      path: card.image,
      role: "image card"
    });
  }

  for (const [key, value] of Object.entries(question.choiceImages || {})) {
    assets.push({
      key,
      path: value?.image,
      role: "choice image"
    });
  }

  return assets;
}

function questionAudioAssets(question) {
  const assets = [];

  if (question.audioPath) {
    assets.push({
      key: question.audioText || question.spokenPrompt || question.answer || question.id,
      path: question.audioPath,
      role: "prompt audio"
    });
  }

  for (const card of question.imageCards || []) {
    assets.push({
      key: card.word,
      path: card.audio,
      role: "word audio"
    });
  }

  return assets;
}

function sourcePackForAudioPath(audioPath) {
  if (!audioPath) return "";
  if (audioPath.includes("-kimi4")) return "kimi_assets4 review variant";
  if (audioPath.includes("-kimi3")) return "kimi_assets3 review variant";
  if (audioPath.includes("/audio/child-mode/hfw/")) return "child-mode hfw";
  if (audioPath.includes("/audio/child-mode/words/")) return "child-mode words";
  if (audioPath.includes("/audio/child-mode/phrases/")) return "child-mode phrases";
  if (audioPath.startsWith("/audio/")) return "legacy audio manifest";
  return "unknown";
}

function browserTtsFallbackPossible(question) {
  return "no in Teacher Assessment Mode";
}

function formatName(question) {
  return getQuestionFormatMetadata(question).formatType;
}

function isPictureToPrintQuestion(question) {
  return formatName(question) === "PICTURE_TO_PRINT_MATCH" ||
    normalize(question.question || question.prompt).includes("matches the picture");
}

function requiresStaticAssessmentAudio(question) {
  return new Set([
    "INITIAL_SOUND_PAIR_SELECT",
    "FINAL_SOUND_PAIR_SELECT",
    "RHYME_PAIR_SELECT",
    "LISTEN_FIND_RHYME",
    "LISTEN_CHOOSE_VOWEL",
    "PICTURE_TO_PRINT_MATCH",
    "PICTURE_AUDIO_TO_PATTERN",
    "LISTEN_FIND_WORD",
    "HEARD_WORD_TO_PRINT_MINIMAL_PAIR"
  ]).has(formatName(question)) || question.questionType === "listen_and_find_word";
}

function isAssetRequiredQuestion(question) {
  return question.questionType === "listen_and_find_word" ||
    isPairSelectionQuestion(question) ||
    isVisualCardChoiceQuestion(question) ||
    isPictureToPrintQuestion(question);
}

function assetGapsForQuestion(question) {
  const gaps = [];

  if (!isAssetRequiredQuestion(question)) return gaps;

  const images = questionImageAssets(question);
  const audio = questionAudioAssets(question);

  if (isPictureToPrintQuestion(question)) {
    if (!question.imagePath) {
      gaps.push({
        type: "missing main target image",
        key: question.targetWord || question.answer,
        path: "",
        priority: "high"
      });
    }

    if ((question.imageCards || []).length > 0 || Object.keys(question.choiceImages || {}).length > 0) {
      gaps.push({
        type: "picture-to-print option images should be text-only",
        key: question.id,
        path: "",
        priority: "high"
      });
    }
  }

  if (question.questionType === "listen_and_find_word") {
    const diagnostics = getListenAndFindAssetDiagnostics(question);
    if (diagnostics?.missingAudio) {
      gaps.push({
        type: "missing audio",
        key: question.answer,
        path: question.audioPath || "",
        priority: "high"
      });
    }

    for (const key of new Set([...(diagnostics?.missingImages || []), ...(diagnostics?.missingChoiceAssets || [])])) {
      gaps.push({
        type: "missing image",
        key,
        path: question.choiceImages?.[key]?.image || "",
        priority: "high"
      });
    }
  }

  if (isPairSelectionQuestion(question)) {
    const diagnostics = getInitialSoundPairDiagnostics(question);
    const missingImages = diagnostics?.missingImages ||
      (question.imageCards || []).filter(card => !card.image).map(card => card.word);
    const missingAudio = diagnostics?.missingAudio ||
      (question.imageCards || []).filter(card => !card.audio).map(card => card.word);

    for (const key of missingImages) {
      gaps.push({
        type: "missing image",
        key,
        path: question.imageCards?.find(card => card.word === key)?.image || "",
        priority: "high"
      });
    }

    for (const key of missingAudio) {
      gaps.push({
        type: "missing audio",
        key,
        path: question.imageCards?.find(card => card.word === key)?.audio || "",
        priority: "high"
      });
    }
  }

  for (const asset of images) {
    if (asset.path && !publicAssetExists(asset.path)) {
      gaps.push({
        type: "missing image",
        key: asset.key,
        path: asset.path,
        priority: "high"
      });
    }
  }

  for (const asset of audio) {
    if (asset.path && !publicAssetExists(asset.path)) {
      gaps.push({
        type: "missing audio",
        key: asset.key,
        path: asset.path,
        priority: "high"
      });
    }

    if (asset.path && isDeprecatedAudioPath(asset.path)) {
      gaps.push({
        type: "deprecated/review-needed audio active",
        key: asset.key,
        path: asset.path,
        priority: "high"
      });
    } else if (asset.path && isReviewNeededAudioPath(asset.path)) {
      gaps.push({
        type: "review-needed audio active",
        key: asset.key,
        path: asset.path,
        priority: "medium"
      });
    }

    if (requiresStaticAssessmentAudio(question)) {
      if (!getAudioPreference(asset.key) && !getAudioPreferenceForPath(asset.path)) {
        gaps.push({
          type: "audio key missing from preference manifest",
          key: asset.key,
          path: asset.path || "",
          priority: "high"
        });
      }

      if (!getApprovedAudioPath(asset.key, asset.path)) {
        gaps.push({
          type: "missing approved audio",
          key: asset.key,
          path: asset.path || "",
          priority: "high"
        });
      }
    }
  }

  if (requiresStaticAssessmentAudio(question) && question.audioText && !question.audioPath) {
    gaps.push({
      type: "missing static audio",
      key: question.audioText,
      path: "",
      priority: "high"
    });
  }

  return gaps;
}

function missingApprovedAudioForQuestion(question) {
  if (!isAssetRequiredQuestion(question) && !requiresStaticAssessmentAudio(question)) return [];

  const missing = [];
  for (const asset of questionAudioAssets(question)) {
    if (!getApprovedAudioPath(asset.key, asset.path)) {
      missing.push(`${asset.key}${asset.path ? ` (${asset.path})` : ""}`);
    }
  }

  if (requiresStaticAssessmentAudio(question) && question.audioText && !question.audioPath) {
    missing.push(`${question.audioText} (no static path)`);
  }

  return missing;
}

function expectedKeysForStage(stage, runtimeKeys) {
  const configured = coverageExpectations[stage.id];
  return configured?.itemKeys || runtimeKeys;
}

const runtimeQuestions =
  runtimeQuestionBanks.flatMap(([source, questions]) =>
    questions.map(question => ({
      ...enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion(question)),
      source
    }))
  );

function runtimeSignature(question) {
  const stage = skillTree[getStageIndex(question)];
  return getQuestionSignature(question, stage ? inferCoverageMetadata(question, stage.label) : null);
}

function dedupeRuntimeQuestionsBySignature(questions) {
  const seen = new Set();
  const canonical = [];

  for (const question of questions) {
    const key = runtimeSignature(question) || question.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    canonical.push(question);
  }

  return canonical;
}

const rawMatchedQuestions = runtimeQuestions.filter(isQuestionValid);
const matchedQuestions = dedupeRuntimeQuestionsBySignature(rawMatchedQuestions);
const duplicateCanonicalizedQuestions = rawMatchedQuestions.length - matchedQuestions.length;
const kimiDataset7SourceQuestions = runtimeQuestions.filter(question => question.source === "kimiDataset7RuntimeQuestions");
const validKimiDataset7RuntimeQuestions = matchedQuestions.filter(question => question.source === "kimiDataset7RuntimeQuestions");
const approvedAudioExcludedQuestions = runtimeQuestions
  .filter(question => !isQuestionValid(question) && missingApprovedAudioForQuestion(question).length > 0)
  .map(question => ({
    id: question.id,
    skill: question.skill,
    format: formatName(question),
    missing: missingApprovedAudioForQuestion(question)
  }));
const contentValidationExcludedQuestions = runtimeQuestions
  .map(question => ({
    id: question.id,
    source: question.source,
    skill: question.skill,
    format: formatName(question),
    prompt: question.question || question.prompt || "",
    issues: getAssessmentContentIssues(question, { assetExists: publicAssetExists })
  }))
  .filter(item => item.issues.length > 0);
const templateValidationExcludedQuestions = contentValidationExcludedQuestions
  .filter(item => item.issues.some(issue =>
    /template|find-the-word|listen|answer options|correct answer|card audio|card images|target word|prompt/i.test(issue)
  ));
const runtimeQualityWarnings = runtimeQuestions.reduce((warnings, question) => {
  const stage = skillTree[getStageIndex(question)]?.label || question.skill || "Unknown";
  const weakReason = weakLegacyPhonicsReason(question);

  if (weakReason) {
    warnings.removedLegacy.push({
      id: question.id,
      source: question.source,
      skill: stage,
      reason: weakReason
    });
  }

  if (questionContainsWord(question, "pun")) {
    warnings.removedPun.push({
      id: question.id,
      source: question.source,
      skill: stage
    });
  }

  const pluralReason = lowQualityPluralDistractorReason(question);
  if (pluralReason) {
    warnings.pluralFixes.push({
      id: question.id,
      source: question.source,
      issue: pluralReason
    });
  }

  if (stage === "Plurals" && isQuestionValid(question)) {
    if (question.imagePath && !question.imagePath.includes("/plurals/")) {
      warnings.pluralFixes.push({
        id: question.id,
        source: question.source,
        issue: "plural question does not use a plural image path"
      });
    }
  }

  return warnings;
}, {
  removedLegacy: [],
  removedPun: [],
  pluralFixes: []
});
const activeOldInitialSoundQuestions = matchedQuestions.filter(question =>
  skillTree[getStageIndex(question)]?.label === "Initial Sounds" &&
  !isAllowedInitialSoundRuntimeFormat(question)
);
const counts = skillTree.map((stage, index) => ({
  stage,
  count: matchedQuestions.filter(question => getStageIndex(question) === index).length
}));

function buildStageAudit(stage, index) {
  const questions = matchedQuestions.filter(question => getStageIndex(question) === index);
  const byKey = new Map();
  const itemTypes = new Set();
  const formats = new Map();
  const assetGaps = [];
  const correctPositions = new Map();

  for (const question of questions) {
    const metadata = inferCoverageMetadata(question, stage.label);
    if (metadata?.itemType) itemTypes.add(metadata.itemType);
    if (metadata?.itemKey) {
      byKey.set(metadata.itemKey, (byKey.get(metadata.itemKey) || 0) + 1);
    }

    const format = formatName(question);
    formats.set(format, (formats.get(format) || 0) + 1);

    if (!isPairSelectionQuestion(question) && Array.isArray(question.choices)) {
      const index = question.choices.indexOf(question.answer);
      if (index >= 0) {
        const label = String(index + 1);
        correctPositions.set(label, (correctPositions.get(label) || 0) + 1);
      }
    }

    for (const gap of assetGapsForQuestion(question)) {
      assetGaps.push({
        ...gap,
        skill: stage.label,
        questionId: question.id,
        format
      });
    }
  }

  const runtimeKeys = [...byKey.keys()].sort();
  const configured = coverageExpectations[stage.id];
  const expectedKeys = expectedKeysForStage(stage, runtimeKeys);
  const missingKeys = expectedKeys.filter(key => !byKey.has(key));
  const expectedTotal = configured?.total || expectedKeys.length;
  const averagePerKey = runtimeKeys.length ? questions.length / runtimeKeys.length : 0;
  const overusedKeys = runtimeKeys.filter(key =>
    byKey.get(key) >= Math.max(5, Math.ceil(averagePerKey * 2))
  );
  const underVariantKeys = expectedKeys.filter(key =>
    (byKey.get(key) || 0) > 0 && (byKey.get(key) || 0) < 2
  );
  const pedagogicalNotes = [];

  if (questions.length < minimumRuntimeQuestions) {
    pedagogicalNotes.push(`Below ${minimumRuntimeQuestions} runtime-question target.`);
  }

  if (missingKeys.length > 0) {
    pedagogicalNotes.push(`Missing expected itemKeys: ${missingKeys.join(", ")}.`);
  }

  if (expectedTotal > runtimeKeys.length && stage.id !== "hfw_51_100") {
    pedagogicalNotes.push(`Configured expected total is ${expectedTotal}, but runtime has ${runtimeKeys.length} unique itemKeys.`);
  }

  if (underVariantKeys.length > 0) {
    pedagogicalNotes.push(`Fewer than 2 variants for: ${underVariantKeys.join(", ")}.`);
  }

  if (stage.id === "initial_sounds") {
    pedagogicalNotes.push("Live Initial Sounds is intentionally restricted to static image/audio pair-select items. Other alphabet sounds need real assets before activation.");
  }

  if (stage.id === "hfw_51_100") {
    pedagogicalNotes.push("The app currently models HFW 51-100 as one combined band; 51-75 and 76-100 are not separate runtime stages yet.");
  }

  return {
    stage,
    questions,
    itemTypes: [...itemTypes].sort(),
    runtimeKeys,
    expectedKeys,
    missingKeys,
    byKey,
    overusedKeys,
    underVariantKeys,
    formats,
    correctPositions,
    assetGaps,
    expectedTotal,
    configured,
    pedagogicalNotes
  };
}

const stageAudits = skillTree.map((stage, index) => buildStageAudit(stage, index));

console.log(`Runtime questions scanned: ${runtimeQuestions.length}`);
console.log(`Runtime questions matched and valid: ${matchedQuestions.length}`);
console.log(`Duplicate-equivalent valid questions canonicalized out of runtime: ${duplicateCanonicalizedQuestions}`);
console.log(`Questions excluded due to missing approved audio: ${approvedAudioExcludedQuestions.length}`);
console.log(`Questions excluded by content validation: ${contentValidationExcludedQuestions.length}`);
console.log(`Legacy text-only phonics questions excluded: ${runtimeQualityWarnings.removedLegacy.length}`);
console.log(`Questions containing pun excluded: ${runtimeQualityWarnings.removedPun.length}`);
console.log(`Pack 7 candidate sample count: ${kimiDataset7Candidates.length}`);
console.log(`Pack 7 active runtime questions: ${kimiDataset7RuntimeQuestions.length}`);
console.log("");

for (const { stage, count } of counts) {
  console.log(`${String(count).padStart(3)}  ${stage.label}`);
}

console.log("");
console.log("Coverage-enabled skill diagnostics:");

for (const stage of skillTree.filter(item => coverageEnabledStages.has(item.label))) {
  const audit = stageAudits.find(item => item.stage.id === stage.id);
  const impossibleKeys = audit.expectedKeys.filter(key => !audit.runtimeKeys.includes(key));

  console.log(`- ${stage.label}`);
  console.log(`  expected total: ${audit.expectedTotal} ${audit.configured?.unit || "items"}${audit.configured?.note ? ` (${audit.configured.note})` : ""}`);
  console.log(`  available questions: ${audit.questions.length}${audit.questions.length < minimumRuntimeQuestions ? ` (warning: below ${minimumRuntimeQuestions})` : ""}`);
  console.log(`  unique itemTypes: ${audit.itemTypes.join(", ") || "none"}`);
  console.log(`  runtime unique itemKeys: ${audit.runtimeKeys.length}${audit.runtimeKeys.length ? ` [${audit.runtimeKeys.join(", ")}]` : ""}`);
  console.log(`  missing itemKeys: ${audit.missingKeys.length ? audit.missingKeys.join(", ") : "none"}`);
  console.log(`  questions per itemKey: ${audit.runtimeKeys.map(key => `${key}:${audit.byKey.get(key)}`).join(", ") || "none"}`);
  console.log(`  formats: ${[...audit.formats.entries()].map(([key, count]) => `${key}:${count}`).join(", ") || "none"}`);
  console.log(`  asset gaps: ${audit.assetGaps.length}`);

  if (audit.configured?.itemKeys && impossibleKeys.length > 0) {
    console.log(`  warning: configured total is impossible with current runtime pool; missing ${impossibleKeys.join(", ")}`);
  }

  if (!audit.configured?.itemKeys && audit.configured?.total && audit.runtimeKeys.length < audit.configured.total) {
    console.log(`  warning: configured expected total is ${audit.configured.total}, but runtime has ${audit.runtimeKeys.length} unique itemKeys`);
  }

  if (audit.overusedKeys.length > 0) {
    console.log(`  warning: overused itemKeys: ${audit.overusedKeys.join(", ")}`);
  }

  if (audit.underVariantKeys.length > 0) {
    console.log(`  warning: fewer than 2 variants: ${audit.underVariantKeys.join(", ")}`);
  }
}

const listenAndFindDiagnostics = matchedQuestions
  .map(question => getListenAndFindAssetDiagnostics(question))
  .filter(Boolean);
const listenAndFindMissingImages = listenAndFindDiagnostics
  .filter(item => item.missingImages.length > 0 || item.missingChoiceAssets.length > 0);
const listenAndFindMissingAudio = listenAndFindDiagnostics
  .filter(item => item.missingAudio);
const listenAndFindBadAudioText = listenAndFindDiagnostics
  .filter(item => !item.usesSingleWordAudioText);

console.log("");
console.log("Listen & Find Word diagnostics:");
console.log(`  questions: ${listenAndFindDiagnostics.length}`);
console.log(`  questions missing option images: ${listenAndFindMissingImages.length}`);
console.log(`  questions missing static target mp3: ${listenAndFindMissingAudio.length}`);
console.log(`  questions not using one-word audio text: ${listenAndFindBadAudioText.length}`);

for (const item of listenAndFindMissingImages.slice(0, 20)) {
  console.log(`  missing images: ${item.question.id} -> ${[...new Set([...item.missingImages, ...item.missingChoiceAssets])].join(", ")}`);
}

for (const item of listenAndFindMissingAudio.slice(0, 20)) {
  console.log(`  missing mp3: ${item.question.id} -> ${item.question.answer}`);
}

const initialSoundPairDiagnostics = matchedQuestions
  .map(question => getInitialSoundPairDiagnostics(question))
  .filter(Boolean);
const initialSoundPairSupported = initialSoundPairDiagnostics.filter(item => item.supported);
const initialSoundPairUnsupportedKeys = [...new Set(
  initialSoundPairDiagnostics
    .filter(item => !item.supported)
    .map(item => item.itemKey)
)].sort();
const initialSoundPairMissingImages = initialSoundPairSupported.filter(item => item.missingImages.length > 0);
const initialSoundPairMissingAudio = initialSoundPairSupported.filter(item => item.missingAudio.length > 0);

console.log("");
console.log("Initial Sounds image/audio pair diagnostics:");
console.log(`  initial sound questions: ${initialSoundPairDiagnostics.length}`);
console.log(`  image/audio pair format questions: ${initialSoundPairSupported.length}`);
console.log(`  unsupported itemKeys without paired static assets: ${initialSoundPairUnsupportedKeys.join(", ") || "none"}`);
console.log(`  pair questions missing images: ${initialSoundPairMissingImages.length}`);
console.log(`  pair questions missing word mp3: ${initialSoundPairMissingAudio.length}`);

for (const item of initialSoundPairMissingImages.slice(0, 20)) {
  console.log(`  missing initial-pair images: ${item.question.id} -> ${item.missingImages.join(", ")}`);
}

for (const item of initialSoundPairMissingAudio.slice(0, 20)) {
  console.log(`  missing initial-pair mp3: ${item.question.id} -> ${item.missingAudio.join(", ")}`);
}

function markdownTable(headers, rows) {
  const escapeCell = value => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(escapeCell).join(" | ")} |`)
  ].join("\n");
}

function duplicateAuditTarget(question) {
  if (Array.isArray(question.correctWords) && question.correctWords.length > 0) {
    return question.correctWords.map(normalize).sort().join("+");
  }

  return normalize(
    question.targetWord ||
    question.audioText ||
    question.imageKey ||
    question.answer ||
    question.correctAnswer ||
    ""
  );
}

function duplicateAuditSignature(question) {
  return runtimeSignature(question);
}

function duplicateAuditOptionSet(question) {
  return (question.choices || [])
    .map(normalize)
    .filter(Boolean)
    .sort()
    .join(" | ");
}

function duplicateAuditDistractorSet(question) {
  const correct = new Set(
    [
      question.answer,
      question.correctAnswer,
      ...(question.correctWords || []),
      ...(question.correctAnswers || [])
    ]
      .map(normalize)
      .filter(Boolean)
  );

  return (question.choices || [])
    .map(normalize)
    .filter(choice => choice && !correct.has(choice))
    .sort()
    .join(" | ");
}

function addGroupedValue(map, key, question) {
  if (!key) return;
  map.set(key, [...(map.get(key) || []), question]);
}

function topEntries(map, limit = 8) {
  return [...map.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

function buildDuplicateAudit(stage, index) {
  const questions = matchedQuestions.filter(question => getStageIndex(question) === index);
  const ids = new Map();
  const targets = new Map();
  const signatures = new Map();
  const optionSets = new Map();
  const distractorSets = new Map();
  const itemKeys = new Map();

  for (const question of questions) {
    addGroupedValue(ids, question.id, question);
    addGroupedValue(targets, duplicateAuditTarget(question), question);
    addGroupedValue(signatures, duplicateAuditSignature(question), question);
    addGroupedValue(optionSets, duplicateAuditOptionSet(question), question);
    addGroupedValue(distractorSets, duplicateAuditDistractorSet(question), question);

    const metadata = inferCoverageMetadata(question, stage.label);
    addGroupedValue(itemKeys, metadata?.itemKey || "", question);
  }

  const duplicateIds = [...ids.entries()].filter(([, items]) => items.length > 1);
  const duplicateSignatures = [...signatures.entries()].filter(([, items]) => items.length > 1);
  const duplicateOptionSets = [...optionSets.entries()].filter(([key, items]) => key && items.length > 1);
  const repeatedDistractorSets = [...distractorSets.entries()].filter(([key, items]) => key && items.length > 2);
  const overusedWords = topEntries(targets, 10).filter(([, items]) => items.length >= 5);
  const averagePerKey = itemKeys.size ? questions.length / itemKeys.size : 0;
  const overusedItemKeys = [...itemKeys.entries()]
    .filter(([, items]) => items.length >= Math.max(6, Math.ceil(averagePerKey * 2)))
    .sort((a, b) => b[1].length - a[1].length);

  return {
    stage,
    questions,
    uniqueTargetWords: targets.size,
    duplicateIds,
    duplicateSignatures,
    duplicateOptionSets,
    repeatedDistractorSets,
    overusedWords,
    overusedItemKeys,
    itemKeys
  };
}

const duplicateAudits = skillTree.map((stage, index) => buildDuplicateAudit(stage, index));

function duplicateMapCount(map) {
  return [...map.entries()].filter(([key, items]) => key && items.length > 1).length;
}

function uniqueQuestionSignatureCount(audit) {
  const signatures = new Set(
    audit.questions.map(question => duplicateAuditSignature(question)).filter(Boolean)
  );
  return signatures.size;
}

function uniqueOptionSetCount(audit) {
  const optionSets = new Set(
    audit.questions.map(question => duplicateAuditOptionSet(question)).filter(Boolean)
  );
  return optionSets.size;
}

function sourceFilesForAudit(audit) {
  return [...new Set(audit.questions.map(question => question.source).filter(Boolean))].sort();
}

function stageCompleteness(audit) {
  const notes = [...audit.pedagogicalNotes];
  if (audit.assetGaps.length > 0) notes.push(`${audit.assetGaps.length} asset gaps.`);
  if (audit.overusedKeys.length > 0) notes.push(`Overused itemKeys: ${audit.overusedKeys.join(", ")}.`);
  return notes.length ? notes.join(" ") : "No major runtime coverage warnings.";
}

function writeCoverageAuditDoc() {
  const docPath = path.join(rootDir, "docs", "implementation", "content_coverage_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const summaryRows = stageAudits.map(audit => [
    audit.stage.label,
    audit.questions.length,
    audit.questions.length >= minimumRuntimeQuestions ? "yes" : "no",
    audit.itemTypes.join(", ") || "none",
    audit.runtimeKeys.length,
    audit.expectedKeys.length,
    audit.missingKeys.join(", ") || "none",
    [...audit.formats.entries()].map(([key, count]) => `${key}:${count}`).join(", ") || "none",
    audit.assetGaps.length,
    stageCompleteness(audit)
  ]);
  const qualityRows = [
    ["Removed legacy text-only phonics questions", runtimeQualityWarnings.removedLegacy.length],
    ["Removed questions containing `pun`", runtimeQualityWarnings.removedPun.length],
    ["Plural questions removed/review-flagged", runtimeQualityWarnings.pluralFixes.length],
    ["Systemic content validation exclusions", contentValidationExcludedQuestions.length],
    ["Template/schema validation exclusions", templateValidationExcludedQuestions.length],
    ["Pack 7 parsed items", kimiDataset7Summary.totalItems],
    ["Pack 7 approved candidates", kimiDataset7Summary.approvedCandidates],
    ["Pack 7 blocked candidates", kimiDataset7Summary.blockedCandidates],
    ["Pack 7 curated source entries", kimiDataset7RuntimeQuestions.length],
    ["Pack 7 valid after runtime gates", validKimiDataset7RuntimeQuestions.length],
    ["Pack 7 exported candidate sample", kimiDataset7Candidates.length],
    ["Final Sounds active itemKeys", (stageAudits.find(audit => audit.stage.label === "Final Sounds")?.runtimeKeys || []).join(", ") || "none"],
    ["Digraph balance", [...(stageAudits.find(audit => audit.stage.label === "Digraphs")?.byKey || new Map()).entries()].map(([key, count]) => `${key}:${count}`).join(", ") || "none"]
  ];
  const removedLegacyRows = runtimeQualityWarnings.removedLegacy.slice(0, 80).map(item => [
    item.skill,
    item.id,
    item.source,
    item.reason
  ]);

  const detailSections = stageAudits.map(audit => {
    const rows = audit.runtimeKeys.map(key => [
      key,
      audit.byKey.get(key),
      audit.expectedKeys.includes(key) ? "yes" : "extra"
    ]);

    return [
      `## ${audit.stage.label}`,
      "",
      `- Runtime questions: ${audit.questions.length}`,
      `- Unique itemTypes: ${audit.itemTypes.join(", ") || "none"}`,
      `- Expected itemKeys: ${audit.expectedKeys.join(", ") || "runtime-derived"}`,
      `- Missing itemKeys: ${audit.missingKeys.join(", ") || "none"}`,
      `- Duplicate/overused itemKeys: ${audit.overusedKeys.join(", ") || "none"}`,
      `- Formats: ${[...audit.formats.entries()].map(([key, count]) => `${key}:${count}`).join(", ") || "none"}`,
      `- Correct-position distribution before runtime randomization: ${[...audit.correctPositions.entries()].map(([position, count]) => `${position}:${count}`).join(", ") || "not applicable"}`,
      `- Meets ${minimumRuntimeQuestions}-question target: ${audit.questions.length >= minimumRuntimeQuestions ? "yes" : "no"}`,
      `- Pedagogical completeness: ${stageCompleteness(audit)}`,
      audit.configured?.note ? `- Coverage note: ${audit.configured.note}` : "",
      "",
      rows.length ? markdownTable(["itemKey", "questions", "expected"], rows) : "_No itemKey metadata found._"
    ].filter(Boolean).join("\n");
  });

  const body = [
    "# Runtime Content Coverage Audit",
    "",
    `Generated by \`node tools/checkRuntimeQuestionCoverage.js\`. Minimum target: ${minimumRuntimeQuestions} valid runtime questions per skill where pedagogically appropriate.`,
    "",
    "## Standards",
    "",
    "- Minimum 52 valid runtime questions per skill where appropriate.",
    "- Minimum 2 variants per expected itemKey where possible.",
    "- Explicit itemType/itemKey metadata for mastery-tracked skills.",
    "- Asset-required formats are excluded from runtime if required static image/audio is missing.",
    "- Initial Sounds must not use old anchor-word text-choice prompts in live assessment.",
    "- Listen & Find Word must use one-word static MP3 audio and visual option cards.",
    "- Sentence completion prompts must include visible sentence/context.",
    "",
    "## Summary",
    "",
    markdownTable(
      ["Skill", "Runtime questions", "52+", "ItemTypes", "Unique itemKeys", "Expected itemKeys", "Missing itemKeys", "Formats", "Asset gaps", "Notes"],
      summaryRows
    ),
    "",
    "## Active Runtime Quality Warnings",
    "",
    markdownTable(["Check", "Result"], qualityRows),
    "",
    removedLegacyRows.length
      ? markdownTable(["Skill", "Question id", "Source", "Reason removed from runtime"], removedLegacyRows)
      : "No legacy text-only phonics questions were excluded.",
    "",
    runtimeQualityWarnings.pluralFixes.length
      ? markdownTable(["Question id", "Source", "Plural issue"], runtimeQualityWarnings.pluralFixes.map(item => [item.id, item.source || "", item.issue]))
      : "No plural quality warnings remain.",
    "",
    contentValidationExcludedQuestions.length
      ? markdownTable(
          ["Skill", "Question id", "Source", "Format", "Validation issue"],
          contentValidationExcludedQuestions
            .slice(0, 80)
            .map(item => [item.skill || "", item.id || "", item.source || "", item.format || "", item.issues.join("; ")])
        )
      : "No systemic content validation exclusions.",
    "",
    "## Structural Notes",
    "",
    "- High-Frequency Words 51-75 and 76-100 are requested audit bands, but the current app has one combined `High-Frequency Words 51-100` runtime stage. This audit reports the active combined stage and flags the split as a content architecture follow-up rather than inventing stages in the audit.",
    "- Final Sounds still uses mostly legacy text/decoding formats in the active pool. The audit marks it below standard and under-covered; converting it to asset-backed pair selection needs real final-sound image/audio sets.",
    "- Initial Sounds uses the asset-backed pair-select format in live runtime only; old text-choice anchor prompts are excluded from live eligibility.",
    "- Assessment choices and visual cards are randomized once when a question is prepared, then remain stable for that attempt; answer checking uses words/IDs rather than card position.",
    "",
    "## EL Alignment Note",
    "",
    "EL Skills Block benchmark assessment includes Letter Name and Sound Identification for all 26 uppercase/lowercase letters and sounds, and EL phonological awareness assessment includes isolating initial phonemes. LiteracyPath's Initial Sounds assessment is a digital, image/audio-supported adaptation of phonological awareness practice, not a replacement for the formal EL benchmark export. Because of that alignment, the intended Initial Sounds coverage should not collapse to only the asset-backed targets currently available at runtime; missing targets are reported as coverage gaps.",
    "",
    "## Detailed Skill Audits",
    "",
    detailSections.join("\n\n")
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeRuntimeTemplateFailuresDoc() {
  const docPath = path.join(rootDir, "docs", "validation", "runtime_template_failures.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const rows = templateValidationExcludedQuestions.map(item => [
    item.id || "",
    item.skill || "",
    item.format || "",
    item.source || "",
    item.prompt || "",
    item.issues.join("; ")
  ]);

  const body = [
    "# Runtime Template Failures",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "Questions listed here are excluded from active runtime. They should not render partial fallback UI.",
    "",
    `Malformed template questions excluded: ${templateValidationExcludedQuestions.length}`,
    "",
    rows.length
      ? markdownTable(["Question ID", "Skill", "Template/format", "Source", "Prompt", "Why excluded"], rows)
      : "No malformed runtime templates were found."
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeDuplicateQuestionAuditDoc() {
  const docPath = path.join(rootDir, "docs", "validation", "duplicate_question_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const summaryRows = duplicateAudits.map(audit => [
    audit.stage.label,
    audit.questions.length,
    audit.uniqueTargetWords,
    audit.duplicateIds.length,
    audit.duplicateSignatures.length,
    audit.duplicateOptionSets.length,
    audit.repeatedDistractorSets.length,
    audit.overusedWords.map(([word, items]) => `${word}:${items.length}`).join(", ") || "none",
    audit.overusedItemKeys.map(([key, items]) => `${key}:${items.length}`).join(", ") || "none"
  ]);

  const detailSections = duplicateAudits.map(audit => {
    const duplicateSignatureRows = audit.duplicateSignatures.slice(0, 12).map(([signature, items]) => [
      signature,
      items.length,
      items.map(item => item.id).join(", "),
      "Replace or retire repeated prompt+answer variants if they appear in the same skill round."
    ]);
    const optionRows = audit.duplicateOptionSets.slice(0, 8).map(([optionSet, items]) => [
      optionSet,
      items.length,
      items.map(item => item.id).join(", ")
    ]);
    const itemKeyRows = [...audit.itemKeys.entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .map(([key, items]) => [key, items.length]);

    return [
      `## ${audit.stage.label}`,
      "",
      `- Active questions: ${audit.questions.length}`,
      `- Unique target words / answer targets: ${audit.uniqueTargetWords}`,
      `- Duplicate IDs: ${audit.duplicateIds.length}`,
      `- Duplicate prompt + correct-answer signatures: ${audit.duplicateSignatures.length}`,
      `- Repeated answer option sets: ${audit.duplicateOptionSets.length}`,
      `- Repeated distractor sets: ${audit.repeatedDistractorSets.length}`,
      `- Overused words: ${audit.overusedWords.map(([word, items]) => `${word}:${items.length}`).join(", ") || "none"}`,
      `- Overused itemKeys: ${audit.overusedItemKeys.map(([key, items]) => `${key}:${items.length}`).join(", ") || "none"}`,
      "",
      "### ItemKey Distribution",
      "",
      itemKeyRows.length ? markdownTable(["itemKey", "active questions"], itemKeyRows) : "_No itemKey metadata._",
      "",
      "### Duplicate Signatures",
      "",
      duplicateSignatureRows.length
        ? markdownTable(["prompt + answer signature", "count", "question IDs", "recommendation"], duplicateSignatureRows)
        : "No duplicate prompt+answer signatures.",
      "",
      "### Repeated Answer Option Sets",
      "",
      optionRows.length
        ? markdownTable(["answer option set", "count", "question IDs"], optionRows)
        : "No repeated answer option sets."
    ].join("\n");
  });

  const body = [
    "# Duplicate Question Audit",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "This report audits active runtime questions after validation gates are applied. Runtime selection also guards against duplicate question IDs, target words, itemKeys, correct answers, and prompt+answer signatures inside a 15-question round whenever alternatives exist.",
    "",
    "## Summary",
    "",
    markdownTable(
      ["Skill", "Active questions", "Unique targets", "Duplicate IDs", "Duplicate signatures", "Repeated option sets", "Repeated distractor sets", "Overused words", "Overused itemKeys"],
      summaryRows
    ),
    "",
    "## Details By Skill",
    "",
    detailSections.join("\n\n")
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeKimiDataset7ActivationReportDoc() {
  const docPath = path.join(rootDir, "docs", "imports", "kimi_dataset7_activation_report.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const activeRows = kimiDataset7SourceQuestions.map(question => {
    const valid = isQuestionValid(question);
    const issues = getAssessmentContentIssues(question, { assetExists: publicAssetExists });
    return [
      question.id,
      question.skill,
      question.itemKey || "",
      question.formatType || question.questionType || "",
      question.activationStatus || "active",
      valid ? "valid active" : "excluded by current gates",
      valid ? "Passes current runtime validation." : issues.join("; ") || "Does not meet current runtime selection rules."
    ];
  });
  const blockedRows = kimiDataset7Candidates
    .filter(candidate => candidate.activationStatus !== "active")
    .slice(0, 120)
    .map(candidate => [
      candidate.word || candidate.id || "",
      candidate.mappedSkillId || candidate.skill || "",
      candidate.pattern || candidate.itemKey || "",
      candidate.activationStatus || "candidate",
      candidate.blockedReason || candidate.validationStatus || "awaiting assets/review"
    ]);

  const body = [
    "# Kimi Dataset 7 Activation Report",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "The full Kimi Dataset 7 source remains source/candidate data and is not imported wholesale into the frontend runtime. This pass did not blindly activate raw Kimi items; it only kept the already curated runtime sample that passes LiteracyPath gates and added separate hand-curated safe expansion content.",
    "",
    "## Counts",
    "",
    markdownTable(
      ["Metric", "Count"],
      [
        ["Kimi claimed/parsed source items", kimiDataset7Summary.totalItems],
        ["Validated candidate sample exported", kimiDataset7Candidates.length],
        ["Kimi approved candidates", kimiDataset7Summary.approvedCandidates],
        ["Kimi blocked candidates", kimiDataset7Summary.blockedCandidates],
        ["Curated Kimi runtime source entries", kimiDataset7RuntimeQuestions.length],
        ["Valid active Kimi questions after current gates", validKimiDataset7RuntimeQuestions.length],
        ["New raw Kimi activations in this pass", 0]
      ]
    ),
    "",
    "## Active Kimi Runtime Items",
    "",
    activeRows.length
      ? markdownTable(["Question ID", "Skill", "ItemKey", "Format", "Source status", "Runtime gate", "Note"], activeRows)
      : "No Kimi Dataset 7 items are active.",
    "",
    "## Candidate / Blocked Sample",
    "",
    blockedRows.length
      ? markdownTable(["Word/ID", "Mapped skill", "Pattern", "Status", "Reason"], blockedRows)
      : "No blocked candidate sample available."
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeFullQuestionBankAuditDoc() {
  const docPath = path.join(rootDir, "docs", "validation", "full_question_bank_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const summaryRows = stageAudits.map((stageAudit, index) => {
    const duplicateAudit = duplicateAudits[index];
    const uniqueSignatures = uniqueQuestionSignatureCount(duplicateAudit);
    const uniqueOptionSets = uniqueOptionSetCount(duplicateAudit);
    return [
      stageAudit.stage.label,
      stageAudit.questions.length,
      uniqueSignatures,
      duplicateAudit.uniqueTargetWords,
      stageAudit.runtimeKeys.length,
      duplicateAudit.duplicateIds.length,
      duplicateAudit.duplicateSignatures.length,
      duplicateAudit.repeatedDistractorSets.length,
      stageAudit.assetGaps.length,
      uniqueSignatures < 50 ? "yes" : "no",
      stageAudit.questions.length < minimumRuntimeQuestions ? "yes" : "no",
      uniqueOptionSets,
      sourceFilesForAudit(stageAudit).join(", ") || "none"
    ];
  });

  const underTargetRows = stageAudits
    .map((stageAudit, index) => {
      const duplicateAudit = duplicateAudits[index];
      return {
        stageAudit,
        duplicateAudit,
        uniqueSignatures: uniqueQuestionSignatureCount(duplicateAudit)
      };
    })
    .filter(item => item.uniqueSignatures < 50 || item.stageAudit.questions.length < minimumRuntimeQuestions)
    .map(item => [
      item.stageAudit.stage.label,
      item.stageAudit.questions.length,
      item.uniqueSignatures,
      item.stageAudit.runtimeKeys.length,
      item.stageAudit.missingKeys.join(", ") || "none",
      item.stageAudit.pedagogicalNotes.join(" ") || "Needs more variety."
    ]);

  const detailSections = stageAudits.map((stageAudit, index) => {
    const duplicateAudit = duplicateAudits[index];
    return [
      `## ${stageAudit.stage.label}`,
      "",
      `- Active valid runtime questions: ${stageAudit.questions.length}`,
      `- Unique question signatures: ${uniqueQuestionSignatureCount(duplicateAudit)}`,
      `- Unique target words / answer targets: ${duplicateAudit.uniqueTargetWords}`,
      `- Unique itemKeys/patterns: ${stageAudit.runtimeKeys.length} (${stageAudit.runtimeKeys.join(", ") || "none"})`,
      `- Duplicate signatures: ${duplicateAudit.duplicateSignatures.length}`,
      `- Repeated distractor sets: ${duplicateAudit.repeatedDistractorSets.length}`,
      `- Missing image/audio needs in active runtime: ${stageAudit.assetGaps.length}`,
      `- Below-50 unique question warning: ${uniqueQuestionSignatureCount(duplicateAudit) < 50 ? "yes" : "no"}`,
      `- Below-${minimumRuntimeQuestions} runtime question warning: ${stageAudit.questions.length < minimumRuntimeQuestions ? "yes" : "no"}`,
      `- Formats: ${[...stageAudit.formats.entries()].map(([format, count]) => `${format}:${count}`).join(", ") || "none"}`,
      `- Overused targets: ${duplicateAudit.overusedWords.map(([word, items]) => `${word}:${items.length}`).join(", ") || "none"}`,
      `- Overused itemKeys: ${stageAudit.overusedKeys.join(", ") || "none"}`,
      "",
      duplicateAudit.duplicateSignatures.length
        ? markdownTable(
            ["Duplicate signature", "Count", "Question IDs"],
            duplicateAudit.duplicateSignatures.slice(0, 10).map(([signature, items]) => [
              signature,
              items.length,
              items.map(item => item.id).join(", ")
            ])
          )
        : "No duplicate prompt+answer signatures detected."
    ].join("\n");
  });

  const body = [
    "# Full Question Bank Audit",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js` after active runtime validation gates are applied.",
    "",
    "This audit is intentionally stricter than a raw file count. It counts only questions that pass the current runtime content, asset, template, audio, and early-phonics validation rules.",
    "",
    "## Summary",
    "",
    markdownTable(
      [
        "Skill",
        "Active valid runtime questions",
        "Unique question signatures",
        "Unique targets",
        "Unique itemKeys/patterns",
        "Duplicate IDs",
        "Duplicate signatures",
        "Repeated distractor sets",
        "Missing image/audio needs",
        "Below 50 unique?",
        `Below ${minimumRuntimeQuestions} runtime?`,
        "Unique option sets",
        "Runtime sources"
      ],
      summaryRows
    ),
    "",
    "## Skills Under Target",
    "",
    underTargetRows.length
      ? markdownTable(["Skill", "Runtime questions", "Unique signatures", "Unique itemKeys", "Missing itemKeys", "Notes"], underTargetRows)
      : `No active skill is below 50 unique question signatures or below ${minimumRuntimeQuestions} valid runtime questions.`,
    "",
    "## Expansion Pass Notes",
    "",
    "- Early phonics expansion remains constrained by strict simple-sound validation and approved word audio/image requirements.",
    "- Asset-backed questions are not activated when required image or audio assets are missing.",
    "- Higher-level comprehension expansion should use paragraph-length Grade 2-3 passages with plausible distractors and answer explanations.",
    "- Kimi Dataset 7 remains a candidate source only; raw imported items are not activated wholesale.",
    "",
    "## Detail By Skill",
    "",
    detailSections.join("\n\n")
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

const guidedReadingPackRequests = [
  ["gr-a-01", "The Red Hat Plan", "fiction", "A", "solving a small classroom problem", "short a CVC, simple HFW"],
  ["gr-a-02", "Sam Can Help", "fiction", "A", "kindness during cleanup", "CVC, can, help"],
  ["gr-a-03", "The Map in the Bag", "fiction", "A", "using a map to find a lost item", "short a, map, bag"],
  ["gr-a-04", "Kit and the Big Box", "fiction", "A", "sharing space and taking turns", "short i/o, big, box"],
  ["gr-a-05", "Nan and the Seed", "fiction", "A", "patience as a seed sprouts", "short e, seed vocabulary in context"],
  ["gr-b-06", "Mina Fixes the Gate", "fiction", "B", "persistence and teamwork", "silent e preview, short vowels"],
  ["gr-b-07", "The Quiet Bell", "fiction", "B", "noticing needs in a community", "short vowels, -ell family"],
  ["gr-b-08", "A Lunch for Two", "fiction", "B", "generosity and friendship", "HFW, simple dialogue"],
  ["gr-b-09", "The Kite That Waited", "fiction", "B", "waiting for the right conditions", "long i preview, weather words"],
  ["gr-b-10", "Omar's Bright Idea", "fiction", "B", "creative problem solving", "CVC and HFW mix"],
  ["gr-c-11", "The Bridge of Sticks", "fiction", "C", "cooperation to cross a small stream", "blends, digraphs"],
  ["gr-c-12", "The Lost Paintbrush", "fiction", "C", "honesty and responsibility", "vowel teams in context"],
  ["gr-c-13", "A Garden for Everyone", "fiction", "C", "inclusion and shared work", "r-controlled preview"],
  ["gr-c-14", "The Rain Jar", "fiction", "C", "curiosity about weather", "ai, ar, cause/effect"],
  ["gr-c-15", "The Lantern Path", "fiction", "C", "helping a neighbor", "long vowels, sequencing"],
  ["gr-d-16", "Maya and the Broken Bridge", "fiction", "D", "planning before acting", "paragraph fluency, inference"],
  ["gr-d-17", "The Honest Choice", "fiction", "D", "choosing honesty over a reward", "theme, dialogue"],
  ["gr-d-18", "The Smallest Seed", "fiction", "D", "small actions can matter", "plant vocabulary, theme"],
  ["gr-d-19", "The Team With No Captain", "fiction", "D", "shared leadership", "Grade 2 comprehension"],
  ["gr-d-20", "The Window Garden", "fiction", "D", "careful observation", "science vocabulary"],
  ["gr-e-21", "The Long Way Home", "fiction", "E", "using clues and maps wisely", "multi-paragraph inference"],
  ["gr-e-22", "The Debate at Table Four", "fiction", "E", "respectful disagreement", "dialogue, opinion words"],
  ["gr-e-23", "The Day the Lights Went Out", "fiction", "E", "staying calm and helping others", "cause/effect"],
  ["gr-e-24", "The Community Mural", "fiction", "E", "many voices making one project", "main idea/theme"],
  ["gr-e-25", "A Promise to the Pond", "fiction", "E", "protecting a shared natural place", "environment vocabulary"],
  ["gr-a-26", "What Is a Map?", "nonfiction", "A", "maps show places", "map, road, park"],
  ["gr-a-27", "Day and Night", "nonfiction", "A", "basic day/night cycle", "sun, moon, sky"],
  ["gr-a-28", "How Rain Helps", "nonfiction", "A", "rain supports plants", "rain, plant, grow"],
  ["gr-a-29", "Animal Homes", "nonfiction", "A", "animals need safe homes", "nest, den, pond"],
  ["gr-a-30", "We Take Care of Books", "nonfiction", "A", "book care routines", "book, page, shelf"],
  ["gr-b-31", "How Seeds Become Plants", "nonfiction", "B", "seed life cycle", "seed, root, stem"],
  ["gr-b-32", "Why Bees Visit Flowers", "nonfiction", "B", "pollination basics", "bee, flower, pollen"],
  ["gr-b-33", "What Makes Shadows?", "nonfiction", "B", "light and shadows", "light, block, shadow"],
  ["gr-b-34", "How Bread Is Made", "nonfiction", "B", "farm-to-food sequence", "grain, flour, bake"],
  ["gr-b-35", "Big Machines at Work", "nonfiction", "B", "community construction machines", "truck, crane, dig"],
  ["gr-c-36", "Weather Tools", "nonfiction", "C", "measuring weather", "thermometer, rain gauge"],
  ["gr-c-37", "How We Use Water", "nonfiction", "C", "water in daily life", "water cycle vocabulary"],
  ["gr-c-38", "Birds Build Nests", "nonfiction", "C", "nest-building behaviors", "twigs, eggs, protect"],
  ["gr-c-39", "From Caterpillar to Butterfly", "nonfiction", "C", "life cycle stages", "sequence words"],
  ["gr-c-40", "Healthy Hands", "nonfiction", "C", "hygiene and germs", "wash, soap, clean"],
  ["gr-d-41", "How Bridges Hold Weight", "nonfiction", "D", "basic engineering ideas", "support, beam, arch"],
  ["gr-d-42", "Why Leaves Change", "nonfiction", "D", "seasonal plant changes", "chlorophyll-free wording"],
  ["gr-d-43", "The Work of Pollinators", "nonfiction", "D", "expanded pollinator role", "bees, butterflies, crops"],
  ["gr-d-44", "How Communities Share Spaces", "nonfiction", "D", "parks, libraries, transit", "civics vocabulary"],
  ["gr-d-45", "What Soil Is Made Of", "nonfiction", "D", "soil components", "sand, clay, humus"],
  ["gr-e-46", "How Water Changes the Land", "nonfiction", "E", "erosion and deposition basics", "river, shore, sediment"],
  ["gr-e-47", "Planning a Safe Route", "nonfiction", "E", "maps and safety decisions", "route, landmark, crossing"],
  ["gr-e-48", "Why Animals Migrate", "nonfiction", "E", "migration reasons", "season, food, shelter"],
  ["gr-e-49", "How Simple Machines Help", "nonfiction", "E", "levers, ramps, pulleys", "machine vocabulary"],
  ["gr-e-50", "Reading Like a Researcher", "nonfiction", "E", "asking questions and checking sources", "research vocabulary"]
];

function guidedReadingBookRows() {
  return guidedReadingPackRequests.map(([id, title, type, level, goal, skills]) => [
    "Guided Reading",
    id,
    title,
    type,
    level,
    goal,
    skills,
    "high",
    "Needed to replace the current tiny guided-reading sample with a complete K-3 progression."
  ]);
}

function activeAssetGapRows() {
  return stageAudits.flatMap(audit =>
    audit.assetGaps.map(gap => [
      audit.stage.label,
      gap.questionId,
      gap.key || "",
      gap.role || gap.format || "",
      gap.path || "",
      "high",
      "Active/candidate question requires this asset before activation."
    ])
  );
}

function disabledAssessmentCandidateRows() {
  return [
    [
      "high",
      "Rhyming",
      "`ixl_rhyming_picture_30` (`house`/`mouse`)",
      "Mouse image",
      "`mouse.png`",
      "Image: clear child-friendly mouse, no text, neutral background. Audio: `mouse` if not already approved.",
      "`mouse` currently has no reliable image, so the image-choice rhyme candidate is disabled."
    ],
    [
      "high",
      "Rhyming",
      "future `ee` / `eed` group",
      "Images + clean word audio",
      "`seed.png`, `feed.png`, `bead.png`, `weed.png`, `need.png`; matching `.mp3` files",
      "Audio must speak each whole word naturally: seed, feed, bead, weed, need.",
      "Prevents wrong `seed`/`bed` substitutions. Only true `eed` rhymes should be activated."
    ],
    [
      "high",
      "Rhyming",
      "future `ain` group",
      "Images + clean word audio",
      "`rain.png`, `train.png`, `chain.png`, `pain.png`, `gain.png`; matching `.mp3` files",
      "Audio must speak each whole word naturally: rain, train, chain, pain, gain.",
      "Prevents wrong `rain`/`pan` substitutions. Only true `ain` rhymes should be activated."
    ],
    [
      "medium",
      "Rhyming",
      "future `ock` group",
      "Images + clean word audio",
      "`sock.png`, `rock.png`, `lock.png`, `dock.png`; matching `.mp3` files",
      "Audio must speak each whole word naturally: sock, rock, lock, dock.",
      "Keeps `sock` separate from `duck`; these are not rhymes."
    ],
    [
      "medium",
      "Rhyming",
      "future `uck` group",
      "Images + clean word audio",
      "`duck.png`, `truck.png`, `luck.png`, `muck.png`; matching `.mp3` files",
      "Audio must speak each whole word naturally: duck, truck, luck, muck.",
      "Keeps `duck` separate from `sock`; these are not rhymes."
    ],
    [
      "medium",
      "Rhyming",
      "`coverage_rhyme_an_003`",
      "Can image",
      "`can.png`",
      "Image: a plain food/drink can or metal can, no text/brand. Audio: `can` if not already approved.",
      "Pair-select candidate is disabled because one card image is missing."
    ]
  ];
}

function writeKimiQuestionAssetRequestDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "kimi_question_asset_request.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const underTarget = stageAudits
    .map((audit, index) => ({
      audit,
      uniqueSignatures: uniqueQuestionSignatureCount(duplicateAudits[index])
    }))
    .filter(item => item.uniqueSignatures < 50 || item.audit.questions.length < minimumRuntimeQuestions)
    .map(item => [
      item.audit.stage.label,
      item.audit.questions.length,
      item.uniqueSignatures,
      item.audit.assetGaps.length,
      item.audit.missingKeys.join(", ") || "none",
      item.audit.stage.id === "initial_sounds" || item.audit.stage.id === "final_sounds"
        ? "Only provide simple, unambiguous early phonics assets."
        : "Provide assets only when needed by image/audio-backed formats."
    ]);
  const currentGuidedRows = guidedReadingBooks.map(book => [
    "Guided Reading MVP sample",
    book.id,
    book.title,
    book.type,
    book.level,
    `${book.pages?.length || 0} pages`,
    "Replace with full pack-quality image/audio coverage",
    "medium",
    "Current MVP books are useful for workflow testing but are intentionally not the final 50-book leveled library."
  ]);

  const body = [
    "# Kimi Question Asset Request",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "Use this with the separate Guided Reading book-pack prompt. Do not create placeholder assets, browser-TTS audio, or unreviewed bulk question banks.",
    "",
    "## Assessment Image Style Rule",
    "",
    "Cute cartoon educational images are good. Rainbow-colored ordinary objects are not acceptable. Use realistic/natural colors unless the target word itself requires color. Non-living objects, foods, body parts, tools, vehicles, and nature objects must not have faces, eyes, smiles, character expressions, sparkles, confetti, magical glow, or baby/kawaii styling. Examples: apple should be red or green, cat should use natural cat colors, egg should be a plain egg with no face, nut should be a walnut/peanut/hazelnut-style nut and not an acorn, and rainbow should only be used when the target word is `rainbow`.",
    "",
    "## Current Assessment Bank Gaps",
    "",
    underTarget.length
      ? markdownTable(["Skill", "Runtime questions", "Unique question signatures", "Asset gaps", "Missing itemKeys", "Request note"], underTarget)
      : "No active assessment skill is currently below the 50-unique / 52-runtime threshold after this expansion pass.",
    "",
    "## Active Runtime Asset Gaps",
    "",
    activeAssetGapRows().length
      ? markdownTable(["Skill", "Question ID", "Target", "Asset role", "Current path", "Priority", "Reason needed"], activeAssetGapRows())
      : "No active validated runtime questions are currently blocked by missing required image/audio assets. Future asset work should focus on Guided Reading and richer optional visual/audio coverage.",
    "",
    "## Disabled Assessment Candidates Needing Assets Before Activation",
    "",
    "These requests are **not active runtime content**. The app now blocks these questions rather than showing wrong or missing assets. Generate these only if we want to promote the listed candidates back into the active bank.",
    "",
    markdownTable(["Priority", "Skill", "Blocked question ID / pattern", "Needed asset", "Exact filename requested", "Prompt / audio text", "Reason"], disabledAssessmentCandidateRows()),
    "",
    "## Guided Reading Pack Requests",
    "",
    "### Current MVP Samples To Supersede",
    "",
    currentGuidedRows.length
      ? markdownTable(["Skill", "Book ID", "Title", "Type", "Level", "Current scope", "Request", "Priority", "Reason needed"], currentGuidedRows)
      : "No Guided Reading MVP samples found.",
    "",
    "### New 50-Book Pack",
    "",
    markdownTable(
      ["Skill", "Question/Book ID", "Target title", "Type", "Level", "Target passage/purpose", "Target skills", "Priority", "Reason needed"],
      guidedReadingBookRows()
    ),
    "",
    "## Required Manifest Fields For Kimi",
    "",
    "- `guided_reading_books_manifest.json` with book/page/word-level references.",
    "- 50 original books: 25 fiction and 25 nonfiction.",
    "- Levels A-E with kindergarten through Grade 3 progression.",
    "- For each book: cover image, page images, page narration MP3s, and word-level MP3s.",
    "- Filenames must exactly match the generated manifest.",
    "- Audio must speak words naturally, never letter-by-letter unless the text explicitly asks for spelling."
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeKimiImageRequestDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "kimi_image_request.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const rows = guidedReadingPackRequests.flatMap(([id, title, type, level, goal]) => {
    const slug = id;
    const pageRows = Array.from({ length: 6 }, (_, index) => [
      "Guided Reading",
      `${id}_page_${index + 1}`,
      title,
      `Original ${type} Level ${level} page ${index + 1}. Image must match the page text, support ${goal}, and use the same warm modern style as the rest of the pack.`,
      `guided-reading-pack-01/images/pages/${slug}-page-${index + 1}.png`,
      "high",
      "Required page illustration for teacher-guided reading."
    ]);
    return [
      [
        "Guided Reading",
        `${id}_cover`,
        title,
        `Original cover image for ${title}. Show the central setting/problem without copyrighted characters or brand references.`,
        `guided-reading-pack-01/images/covers/${slug}-cover.png`,
        "high",
        "Required book cover for library browsing."
      ],
      ...pageRows
    ];
  });

  const body = [
    "# Kimi Image Request",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "Images should be warm, modern, consistent, culturally neutral, and not babyish. Do not imitate copyrighted books, brands, characters, or famous illustration styles.",
    "",
    "## Assessment Image Style Rule",
    "",
    "Cute cartoon educational images are good. Rainbow-colored ordinary objects are not acceptable. Use realistic/natural colors unless the target word itself requires color. Non-living objects, foods, body parts, tools, vehicles, and nature objects must not have faces, eyes, smiles, character expressions, sparkles, confetti, magical glow, or baby/kawaii styling. Examples: apple should be red or green, cat should use natural cat colors, egg should be a plain egg with no face, nut should be a walnut/peanut/hazelnut-style nut and not an acorn, and rainbow should only be used when the target word is `rainbow`.",
    "",
    markdownTable(
      ["Skill", "Question/Page ID", "Target title", "Required image description", "Filename required", "Priority", "Reason needed"],
      rows
    )
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeKimiAudioRequestDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "kimi_audio_request.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const rows = guidedReadingPackRequests.flatMap(([id, title, type, level, goal, skills]) => {
    const pageRows = Array.from({ length: 6 }, (_, index) => [
      "Guided Reading",
      `${id}_page_audio_${index + 1}`,
      title,
      `Narrate the exact original page ${index + 1} text from the manifest for ${title}.`,
      `guided-reading-pack-01/audio/page-narration/${id}-page-${index + 1}.mp3`,
      "Neutral natural human teacher voice; child-friendly pacing; no robotic intonation.",
      "high",
      `Required page narration for Level ${level} ${type}; supports ${goal}.`
    ]);
    return [
      [
        "Guided Reading",
        `${id}_word_audio_manifest`,
        title,
        `Provide individual word audio for every unique word in ${title}. Spoken text must be each whole word from the manifest, not spelled letter by letter.`,
        `guided-reading-pack-01/audio/words/${id}-<word>.mp3`,
        `Natural pronunciation; include notes for irregular/high-frequency words. Target skills: ${skills}.`,
        "high",
        "Required for tap-word support in teacher-guided reading."
      ],
      ...pageRows
    ];
  });

  const body = [
    "# Kimi Audio Request",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "All audio must be clean neutral human voice. Browser TTS, robotic delivery, odd intonation, clipped endings, and spelling-style word audio are not acceptable for active assessment or Guided Reading.",
    "",
    markdownTable(
      ["Skill", "Question/Audio ID", "Target title", "Required audio text", "Filename required", "Pronunciation notes", "Priority", "Reason needed"],
      rows
    )
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeAssetCoverageDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "assessment_asset_coverage.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  function sourcePackForKey(key) {
    const asset = getChildWordAsset(key);
    return asset?.source || "existing";
  }

  function duplicateCandidateForAsset(assetPath = "") {
    if (!assetPath) return "";
    if (assetPath.includes("-kimi3")) return "preserved kimi_assets3 conflict";
    const parsed = path.parse(assetPath);
    const candidate = path.join(rootDir, "public", parsed.dir, `${parsed.name}-kimi3${parsed.ext}`);
    return fs.existsSync(candidate) ? "kimi_assets3 alternate available" : "";
  }

  const rows = [];

  for (const audit of stageAudits) {
    for (const question of audit.questions) {
      const format = formatName(question);
      const images = questionImageAssets(question);
      const audio = questionAudioAssets(question);
      const keys = new Set([
        ...images.map(asset => asset.key),
        ...audio.map(asset => asset.key)
      ]);

      for (const key of keys) {
        const image = images.find(asset => asset.key === key);
        const sound = audio.find(asset => asset.key === key);
        const hasImage = image ? publicAssetExists(image.path) : "";
        const hasAudio = sound ? publicAssetExists(sound.path) : "";
        const required = isAssetRequiredQuestion(question);
        const missingRequired =
          required &&
          ((image && !hasImage) || (sound && !hasAudio));

        rows.push([
          key,
          audit.stage.label,
          format,
          image ? (hasImage ? "yes" : "no") : "",
          sound ? (hasAudio ? "yes" : "no") : "",
          sourcePackForKey(key),
          image?.path || "",
          sound?.path || "",
          missingRequired ? "missing required asset" : "",
          missingRequired ? "high" : "",
          duplicateCandidateForAsset(image?.path || sound?.path || "")
        ]);
      }
    }
  }

  const initialAudit = stageAudits.find(audit => audit.stage.label === "Initial Sounds");
  const knownBlockingGaps = [];
  if (initialAudit?.missingKeys?.includes("u")) {
    knownBlockingGaps.push("- Initial Sounds `/u/`: still blocked because fewer than two clean image/audio-backed short-/u/ words are available.");
  } else {
    knownBlockingGaps.push("- Initial Sounds `/u/`: complete after Kimi asset pack 3 import. `unicorn` remains excluded from `/u/` activation because its common onset is /yoo/.");
  }

  const body = [
    "# Assessment Asset Coverage",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`. This document lists runtime assessment assets discovered from image/audio-backed formats. Blank image/audio cells mean the active question format does not declare that asset role.",
    "",
    "## Known Blocking Gaps",
    "",
    knownBlockingGaps.join("\n"),
    "",
    markdownTable(
      ["word", "skill", "format", "has image", "has audio", "source pack", "image path", "audio path", "missing/weak asset flag", "priority", "duplicate candidates"],
      rows
    )
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeAudioQualityAuditDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "audio_quality_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const byPath = new Map();
  for (const audit of stageAudits) {
    for (const question of audit.questions) {
      for (const asset of questionAudioAssets(question)) {
        if (!asset.path && !requiresStaticAssessmentAudio(question)) continue;
        const key = asset.path || `${question.id}:${asset.key}`;
        const existing = byPath.get(key) || {
          word: asset.key,
          path: asset.path || "",
          source: sourcePackForAudioPath(asset.path) || sourcePackForAuditKey(asset.key),
          skills: new Set(),
          required: requiresStaticAssessmentAudio(question),
          browserFallback: browserTtsFallbackPossible(question),
          flags: new Set()
        };

        existing.skills.add(audit.stage.label);
        existing.required = existing.required || requiresStaticAssessmentAudio(question);
        if (existing.browserFallback !== "no") existing.browserFallback = browserTtsFallbackPossible(question);
        if (!asset.path) existing.flags.add("missing human/static MP3");
        if (asset.path && !publicAssetExists(asset.path)) existing.flags.add("missing file");
        if (asset.path?.startsWith("/audio/") && !asset.path.includes("/audio/child-mode/")) {
          existing.flags.add("legacy generated audio; review voice consistency");
        }
        if (asset.path?.includes("-kimi3") || asset.path?.includes("-kimi4")) {
          existing.flags.add("Kimi alternate voice; quarantined until human review");
        }
        if (asset.path && isReviewNeededAudioPath(asset.path)) existing.flags.add("review-needed audio path is active");
        if (asset.path && isDeprecatedAudioPath(asset.path)) existing.flags.add("deprecated audio path is active");
        byPath.set(key, existing);
      }
    }
  }

  for (const preference of Object.values(audioPreferenceManifest)) {
    for (const reviewPath of preference.reviewNeededPaths || []) {
      const existing = byPath.get(reviewPath) || {
        word: preference.word,
        path: reviewPath,
        source: sourcePackForAudioPath(reviewPath),
        skills: new Set(["not active"]),
        required: false,
        browserFallback: "no",
        flags: new Set()
      };
      existing.flags.add("quarantined review variant; not preferred");
      byPath.set(reviewPath, existing);
    }
  }

  const rows = [...byPath.values()]
    .sort((a, b) => a.word.localeCompare(b.word) || a.path.localeCompare(b.path))
    .map(item => {
      const preference = getAudioPreferenceForPath(item.path);
      const isPreferred = preference?.preferredAudioPath === item.path;
      const preferenceLabel =
        isDeprecatedAudioPath(item.path) ? "deprecated/quarantined" :
          isReviewNeededAudioPath(item.path) ? "review needed" :
            isPreferred ? "preferred" :
              item.path ? "active static path" : "missing";

      return [
        item.word,
        item.path,
        item.source,
        [...item.skills].sort().join(", "),
        item.required ? "yes" : "no",
        item.browserFallback,
        item.path ? (publicAssetExists(item.path) ? "no" : "yes") : "yes",
        preferenceLabel,
        [...item.flags].sort().join("; ") || "static asset present",
        getAudioReviewNote(item.path)
      ];
    });

  const body = [
    "# Audio Quality Audit",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "Audio policy: early phonics and HFW assessment formats use static asset audio only. Browser TTS is reserved for legacy non-critical prompts and is not an allowed fallback for asset-required assessment formats.",
    "",
    "## Summary",
    "",
    `- Approved active runtime audio keys: ${collectActiveAudioInventory().filter(item => getApprovedAudioPath(item.key, item.path)).length}`,
    `- Review-needed/quarantined audio files: ${Object.values(audioPreferenceManifest).reduce((sum, item) => sum + (item.reviewNeededPaths?.length || 0), 0)}`,
    `- Deprecated audio files: ${Object.values(audioPreferenceManifest).reduce((sum, item) => sum + (item.deprecatedAudioPaths?.length || 0), 0)}`,
    `- Missing approved active runtime audio: ${collectActiveAudioInventory().filter(item => !getApprovedAudioPath(item.key, item.path)).length}`,
    `- Runtime questions blocked by missing approved audio: ${approvedAudioExcludedQuestions.length}`,
    "",
    "## Runtime Audio Inventory",
    "",
    markdownTable(["word/phrase", "audio path", "source pack", "used in skills", "audio required", "browser TTS fallback", "file missing", "preference", "quality flag", "notes"], rows)
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeCleanAudioReplacementRequestDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "clean_audio_replacement_request.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const activeAudioByWord = new Map();
  const missingAudio = new Map();

  for (const audit of stageAudits) {
    for (const question of audit.questions) {
      for (const asset of questionAudioAssets(question)) {
        const key = String(asset.key || "").toLowerCase();
        if (!key) continue;
        if (!asset.path && requiresStaticAssessmentAudio(question)) {
          missingAudio.set(key, {
            word: key,
            skills: new Set([audit.stage.label]),
            reason: "Missing static MP3 in an asset-required assessment format."
          });
          continue;
        }

        const existing = activeAudioByWord.get(key) || {
          word: key,
          paths: new Set(),
          skills: new Set(),
          reasons: new Set()
        };
        if (asset.path) existing.paths.add(asset.path);
        existing.skills.add(audit.stage.label);
        if (asset.path && isReviewNeededAudioPath(asset.path)) existing.reasons.add("Active path is marked review-needed.");
        if (asset.path?.includes("-kimi")) existing.reasons.add("Kimi-suffixed voice needs human review.");
        if (asset.path && !publicAssetExists(asset.path)) existing.reasons.add("Referenced MP3 is missing.");
        activeAudioByWord.set(key, existing);
      }
    }
  }

  const suspectRows = [...activeAudioByWord.values()]
    .filter(item => item.reasons.size > 0)
    .sort((a, b) => a.word.localeCompare(b.word))
    .map(item => [
      item.word,
      `public/audio/child-mode/words/${item.word}.mp3`,
      [...item.skills].sort().join(", "),
      [...item.paths].sort().join(", "),
      [...item.reasons].sort().join("; ")
    ]);

  const missingRows = [...missingAudio.values()]
    .sort((a, b) => a.word.localeCompare(b.word))
    .map(item => [
      item.word,
      `public/audio/child-mode/words/${item.word}.mp3`,
      [...item.skills].sort().join(", "),
      item.reason
    ]);

  const quarantinedRows = Object.values(audioPreferenceManifest)
    .sort((a, b) => a.word.localeCompare(b.word))
    .map(item => [
      item.word,
      item.preferredAudioPath.replace(/^\//, "public/"),
      item.reviewNeededPaths.map(audioPath => audioPath.replace(/^\//, "public/")).join(", "),
      item.notes
    ]);

  const body = [
    "# Clean Audio Replacement Request",
    "",
    "Please provide clean, child-friendly, human-recorded MP3 files. Each file should contain only the target word or phrase, with no sentence framing, odd ending sound, long silence, robotic voice, or strong synthetic intonation.",
    "",
    "## Priority 1: Active Runtime Audio Needing Review",
    "",
    suspectRows.length
      ? markdownTable(["word/phrase", "requested filename", "used in skills", "current active path", "reason"], suspectRows)
      : "No active runtime question currently points at a quarantined `-kimi` audio path.",
    "",
    "## Priority 2: Missing Static Audio",
    "",
    missingRows.length
      ? markdownTable(["word/phrase", "requested filename", "used in skills", "reason"], missingRows)
      : "No missing required static MP3 files were found in active asset-backed runtime questions.",
    "",
    "## Priority 3: Quarantined Alternates To Replace Or Review",
    "",
    markdownTable(["word/phrase", "preferred filename", "review-needed variants", "notes"], quarantinedRows)
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function collectActiveAudioInventory() {
  const byKey = new Map();

  for (const audit of stageAudits) {
    for (const question of audit.questions) {
      for (const asset of questionAudioAssets(question)) {
        const normalizedKey = String(asset.key || "").toLowerCase().trim();
        if (!normalizedKey) continue;

        const existing = byKey.get(normalizedKey) || {
          key: normalizedKey,
          path: asset.path || "",
          skills: new Set(),
          formats: new Set(),
          required: false,
          missing: false,
          suspect: false
        };

        if (!existing.path && asset.path) existing.path = asset.path;
        existing.skills.add(audit.stage.label);
        existing.formats.add(formatName(question));
        existing.required = existing.required || requiresStaticAssessmentAudio(question);
        existing.missing = existing.missing || !asset.path || (asset.path && !publicAssetExists(asset.path));
        existing.suspect = existing.suspect || Boolean(asset.path && (isReviewNeededAudioPath(asset.path) || isDeprecatedAudioPath(asset.path) || asset.path.includes("-kimi")));
        byKey.set(normalizedKey, existing);
      }
    }
  }

  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function writeSuspectAudioQuarantineDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "suspect_audio_quarantine.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const rows = [];
  for (const item of Object.values(audioPreferenceManifest)) {
    for (const audioPath of item.reviewNeededPaths || []) {
      rows.push([
        item.word,
        audioPath,
        sourcePackForAudioPath(audioPath),
        "not approved for active assessment runtime",
        item.preferredAudioPath,
        item.notes
      ]);
    }
  }

  const body = [
    "# Suspect Audio Quarantine",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "These files are not deleted, but they are blocked from active Teacher Assessment playback. A file can be restored only after human review and an explicit `approved` entry in `src/data/audioPreferenceManifest.js`.",
    "",
    markdownTable(["word/phrase", "quarantined path", "source pack", "runtime status", "preferred path", "notes"], rows)
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeCompleteAudioReplacementRequestDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "complete_audio_replacement_request.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const remainingItems = collectActiveAudioInventory().filter(item => {
    const approvedPath = getApprovedAudioPath(item.key, item.path);
    return !approvedPath || !approvedPath.includes("/audio/child-mode/clean-human/");
  });

  const activeRows = remainingItems.map(item => {
    const approvedPath = getApprovedAudioPath(item.key, item.path);
    const category =
      (approvedPath || item.path).includes("/hfw/") ? "hfw" :
        (approvedPath || item.path).includes("/phrases/") ? "phrase" :
          "word";
    const requestedPath =
      approvedPath ||
      (category === "hfw"
        ? `/audio/child-mode/clean-human/hfw/${item.key}.mp3`
        : category === "phrase"
          ? `/audio/child-mode/clean-human/phrases/${item.key}.mp3`
          : `/audio/child-mode/clean-human/words/${item.key}.mp3`);

    return [
      item.key,
      requestedPath.replace(/^\//, "public/"),
      item.key.replace(/-/g, " "),
      category,
      item.required ? "required" : "optional",
      item.suspect ? "high" : item.missing ? "high" : "standard",
      item.path && !item.suspect ? "yes" : "suspect or missing",
      item.missing ? "yes" : "no",
      [...item.skills].sort().join(", "),
      [...item.formats].sort().join(", ")
    ];
  });

  const body = [
    "# Complete Audio Replacement Request",
    "",
    "Please create clean, neutral, child-friendly human voice MP3 files for every row. Each recording should contain only the expected spoken text. No sentence framing, no synthetic voice, no odd intonation, no long silence, no background noise.",
    "",
    "Rows that already use approved Pack 6 clean-human audio are intentionally omitted. This request lists only active runtime audio still using older approved audio, missing audio, or review-needed audio.",
    "",
    "## Active Assessment Runtime Audio",
    "",
    activeRows.length
      ? markdownTable(["key", "exact filename needed", "expected spoken text", "category", "runtime priority", "replacement priority", "current clean file exists", "current missing", "skills using it", "formats using it"], activeRows)
      : "All active runtime audio keys currently have approved Pack 6 clean-human replacements.",
    "",
    "## Import Target",
    "",
    "- Preferred clean replacement root: `public/audio/child-mode/clean-human/`.",
    "- Use `words/`, `hfw/`, and `phrases/` subfolders.",
    "- After import, update `src/data/audioPreferenceManifest.js` so each replacement has `status: \"approved\"` and becomes the `preferredAudioPath`."
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeCleanAudioPackImportGuideDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "clean_audio_pack_import.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const body = [
    "# Clean Audio Pack Import Guide",
    "",
    "Expected clean-human audio root:",
    "",
    "```text",
    "public/audio/child-mode/clean-human/",
    "  words/",
    "  hfw/",
    "  phrases/",
    "```",
    "",
    "Naming convention:",
    "- Lowercase filenames.",
    "- Hyphenate multiword phrases, for example `listen-and-find.mp3`.",
    "- Each MP3 should contain only the exact word or phrase represented by the filename.",
    "- No browser TTS, generated sentence audio, long silence, clipped endings, background noise, or strong synthetic intonation.",
    "",
    "Manifest process:",
    "1. Import files without deleting older audio.",
    "2. Compare filenames against `docs/assets/complete_audio_replacement_request.md`.",
    "3. Update `src/data/audioPreferenceManifest.js` with `preferredAudioPath` pointing to the clean-human file.",
    "4. Set `status: \"approved\"` only after human review.",
    "5. Move any replaced Pack/Kimi/legacy variants into `deprecatedAudioPaths` or `reviewNeededPaths`.",
    "6. Run `npm run build`, `node tools/auditQuestionBank.js`, and `node tools/checkRuntimeQuestionCoverage.js`."
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function sourcePackForAuditKey(key) {
  const asset = getChildWordAsset(key);
  return asset?.source || "existing";
}

function writeImageQualityAuditDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "image_quality_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const rows = [];
  for (const audit of stageAudits) {
    for (const question of audit.questions) {
      const format = formatName(question);
      const images = questionImageAssets(question);
      const pathToKeys = new Map();

      for (const asset of images) {
        if (asset.path) {
          const keys = pathToKeys.get(asset.path) || new Set();
          keys.add(asset.key);
          pathToKeys.set(asset.path, keys);
        }

        const flags = [];
        if (!asset.path) flags.push("missing image");
        else if (!publicAssetExists(asset.path)) flags.push("missing file");
        if (asset.path?.includes("fallback")) flags.push("fallback/placeholder candidate");
        if (asset.path?.includes("-kimi4")) flags.push("Pack 4 review candidate; existing stable image remains preferred");
        if (isPictureToPrintQuestion(question) && asset.role !== "question image") {
          flags.push("picture-to-print choices should not use option images");
        }
        if (format === "PLURAL_IMAGE_SPELLING" && !asset.path?.includes("/plurals/")) {
          flags.push("plural question should use a true plural image");
        }

        rows.push([
          asset.key,
          audit.stage.label,
          format,
          asset.role,
          publicAssetExists(asset.path) ? "yes" : "no",
          asset.path || "",
          asset.path?.includes("/plurals/") || asset.path?.includes("/vowel-teams/") || asset.path?.includes("/r-controlled/")
            ? "preferred Pack 4 organized asset"
            : asset.path?.includes("-kimi4")
              ? "review candidate"
              : "active asset",
          asset.path?.includes("-kimi4") ? "yes" : "",
          flags.join("; ")
        ]);
      }

      for (const [assetPath, keys] of pathToKeys.entries()) {
        if (keys.size > 1) {
          rows.push([
            [...keys].sort().join(", "),
            audit.stage.label,
            format,
            "duplicate path check",
            publicAssetExists(assetPath) ? "yes" : "no",
            assetPath,
            "review",
            "",
            "same image path reused for multiple answer words; review match quality"
          ]);
        }
      }

      if (format === "PICTURE_TO_PRINT_MATCH" && (question.imageCards || []).length > 0) {
        rows.push([
          question.id,
          audit.stage.label,
          format,
          "layout guard",
          "no",
          "",
          "answer cards include images; should be one target image with text-only choices"
        ]);
      }
    }
  }

  const body = [
    "# Image Quality Audit",
    "",
    "Generated by `node tools/checkRuntimeQuestionCoverage.js`.",
    "",
    "This audit reports missing/broken assets and flags image uses that need human visual review. It does not mark placeholders or repeated singular images as complete plural assets.",
    "",
    markdownTable(["word", "skill", "format", "role", "file exists", "image path", "preference", "deprecated", "quality flag"], rows)
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeKimiNextAssetRequestDoc() {
  const docPath = path.join(rootDir, "docs", "assets", "kimi_next_asset_request.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const gapLines = [];
  const weakPluralLines = [];
  const audioLines = [];
  const imageLines = [];

  for (const audit of stageAudits) {
    for (const gap of audit.assetGaps) {
      const line = `- ${gap.key} (${gap.skill}, ${gap.format}): ${gap.type}${gap.path ? ` at ${gap.path}` : ""}`;
      gapLines.push(line);
      if (gap.type.includes("audio")) audioLines.push(line);
      if (gap.type.includes("image")) imageLines.push(line);
    }

    for (const question of audit.questions) {
      if (formatName(question) === "PLURAL_IMAGE_SPELLING") {
        const pluralImage = question.imagePath || "";
        if (!pluralImage.includes("/plurals/")) {
          weakPluralLines.push(`- ${question.targetPlural || question.answer}: create a clear plural image showing more than one ${question.targetWord || "object"}.`);
        }
      }
    }
  }

  const body = [
    "# Kimi Next Asset Request",
    "",
    "Please create or replace only real, child-friendly assets. Do not create placeholders.",
    "",
    "## Urgent UI Consistency Assets",
    "",
    "- A simple consistent listening/speaker illustration for assessment stimulus panels, exported as `listen-icon.png` if possible.",
    "",
    "## Short Vowels / CVC",
    "",
    imageLines.filter(line => /Short Vowel|CVC/.test(line)).join("\n") || "- No missing required runtime image files found; review visual clarity for minimal-pair words.",
    "",
    "## Blends / Digraphs",
    "",
    imageLines.filter(line => /Blend|Digraph/.test(line)).join("\n") || "- No missing required runtime image files found; add more images/audio for underrepresented blends and `wh` variants.",
    "",
    "## Plurals",
    "",
    weakPluralLines.join("\n") || "- No plural image requests found.",
    "",
    "## HFW",
    "",
    audioLines.filter(line => /High-Frequency/.test(line)).join("\n") || "- No missing required runtime HFW MP3s found.",
    "",
    "## Remaining Phonics",
    "",
    gapLines.filter(line => !/Short Vowel|CVC|Blend|Digraph|High-Frequency/.test(line)).join("\n") || "- No missing required runtime files found in currently active asset-backed formats.",
    "",
    "## Priority Order",
    "",
    "1. More real images/audio for underrepresented blend and digraph patterns.",
    "2. Additional long vowel, vowel team, r-controlled, and homophone assets to unlock honest coverage expansion.",
    "3. Extra plural image variants only if expanding plural coverage beyond the current Pack 4 set.",
    "4. Voice-consistency review for `-kimi3` and `-kimi4` alternate MP3s."
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

const coverageDocPath = writeCoverageAuditDoc();
const assetDocPath = writeAssetCoverageDoc();
const audioQualityDocPath = writeAudioQualityAuditDoc();
const imageQualityDocPath = writeImageQualityAuditDoc();
const kimiRequestDocPath = writeKimiNextAssetRequestDoc();
const cleanAudioRequestDocPath = writeCleanAudioReplacementRequestDoc();
const suspectAudioDocPath = writeSuspectAudioQuarantineDoc();
const completeAudioRequestDocPath = writeCompleteAudioReplacementRequestDoc();
const cleanAudioImportGuideDocPath = writeCleanAudioPackImportGuideDoc();
const runtimeTemplateFailuresDocPath = writeRuntimeTemplateFailuresDoc();
const duplicateQuestionAuditDocPath = writeDuplicateQuestionAuditDoc();
const kimiDataset7ActivationReportDocPath = writeKimiDataset7ActivationReportDoc();
const fullQuestionBankAuditDocPath = writeFullQuestionBankAuditDoc();
const kimiQuestionAssetRequestDocPath = writeKimiQuestionAssetRequestDoc();
const kimiImageRequestDocPath = writeKimiImageRequestDoc();
const kimiAudioRequestDocPath = writeKimiAudioRequestDoc();
console.log("");
console.log(`Wrote coverage audit: ${path.relative(rootDir, coverageDocPath)}`);
console.log(`Wrote asset coverage: ${path.relative(rootDir, assetDocPath)}`);
console.log(`Wrote audio quality audit: ${path.relative(rootDir, audioQualityDocPath)}`);
console.log(`Wrote image quality audit: ${path.relative(rootDir, imageQualityDocPath)}`);
console.log(`Wrote Kimi asset request: ${path.relative(rootDir, kimiRequestDocPath)}`);
console.log(`Wrote clean audio request: ${path.relative(rootDir, cleanAudioRequestDocPath)}`);
console.log(`Wrote suspect audio quarantine: ${path.relative(rootDir, suspectAudioDocPath)}`);
console.log(`Wrote complete audio replacement request: ${path.relative(rootDir, completeAudioRequestDocPath)}`);
console.log(`Wrote clean audio import guide: ${path.relative(rootDir, cleanAudioImportGuideDocPath)}`);
console.log(`Wrote runtime template failures: ${path.relative(rootDir, runtimeTemplateFailuresDocPath)}`);
console.log(`Wrote duplicate question audit: ${path.relative(rootDir, duplicateQuestionAuditDocPath)}`);
console.log(`Wrote Kimi Dataset 7 activation report: ${path.relative(rootDir, kimiDataset7ActivationReportDocPath)}`);
console.log(`Wrote full question bank audit: ${path.relative(rootDir, fullQuestionBankAuditDocPath)}`);
console.log(`Wrote Kimi question asset request: ${path.relative(rootDir, kimiQuestionAssetRequestDocPath)}`);
console.log(`Wrote Kimi image request: ${path.relative(rootDir, kimiImageRequestDocPath)}`);
console.log(`Wrote Kimi audio request: ${path.relative(rootDir, kimiAudioRequestDocPath)}`);

const emptyStages = counts.filter(({ count }) => count === 0);
const startEndMinimumFailures = stageAudits
  .filter(audit => ["initial_sounds", "final_sounds"].includes(audit.stage.id))
  .filter(audit => audit.questions.length < 25);
const missingCoverageMetadata = matchedQuestions
  .map(question => {
    const stage = skillTree[getStageIndex(question)];
    return { question, stage };
  })
  .filter(({ question, stage }) =>
    stage &&
    coverageEnabledStages.has(stage.label) &&
    !inferCoverageMetadata(question, stage.label)
  );

if (emptyStages.length > 0) {
  console.log("");
  console.error("Missing runtime questions for:");
  for (const { stage } of emptyStages) {
    console.error(`- ${stage.label}`);
  }

  process.exit(1);
}

if (missingCoverageMetadata.length > 0) {
  console.log("");
  console.error("Coverage-enabled runtime questions missing item metadata:");
  for (const { question, stage } of missingCoverageMetadata.slice(0, 25)) {
    console.error(`- ${stage.label}: ${question.id} "${question.question || question.prompt}"`);
  }

  process.exit(1);
}

if (activeOldInitialSoundQuestions.length > 0) {
  console.log("");
  console.error("Initial Sounds runtime guard failed: old text-choice format is still active.");
  for (const question of activeOldInitialSoundQuestions.slice(0, 25)) {
    console.error(`- ${question.id}: "${question.question || question.prompt}"`);
  }

  process.exit(1);
}

if (startEndMinimumFailures.length > 0) {
  console.log("");
  console.error("Start/Ending Sound minimum guard failed:");
  for (const audit of startEndMinimumFailures) {
    console.error(`- ${audit.stage.label}: ${audit.questions.length} valid canonical runtime questions; expected at least 25.`);
  }

  process.exit(1);
}

console.log("");
console.log("Runtime question coverage passed.");
