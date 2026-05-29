import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { questions } from "../src/questions.js";
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
import { generatedEarlySkillQuestions } from "../src/data/generated/earlySkillQuestions.generated.js";
import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { skillLevelGapQuestions } from "../src/data/generated/skillLevelGapQuestions.generated.js";
import { hfwLevel2Questions } from "../src/data/generated/hfwLevel2Questions.generated.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";
import { skillTree } from "../src/skillTree.js";
import {
  getAllowedQuestionFormatValues,
  getQuestionFormatMetadata,
  hasPatternTrap,
  isCrossPatternQuestion,
  isVisualRecognitionOnly,
  requiresAudioSupport
} from "../src/questionFormatFramework.js";
import {
  getApprovedAudioPath,
  getAudioPreference,
  getAudioPreferenceForPath,
  isDeprecatedAudioPath,
  isReviewNeededAudioPath
} from "../src/data/audioPreferenceManifest.js";
import { getAssessmentContentIssues } from "../src/assessmentContentValidation.js";
import {
  blendAnchors,
  digraphAnchors,
  finalSoundAnchors,
  initialSoundAnchors,
  shortVowelAnchors
} from "../src/data/phonicsAnchors.js";
import { getRhymeGroup, getRhymeOptionMatches } from "../src/data/rhymeGroups.js";
import {
  getAudioPronunciationIssues,
  getEarlyPhonicsValidityIssues,
  isValidFinalSoundWordForEarlyLevel,
  isValidFinalSoundWordForLevelTwo,
  isValidInitialSoundWordForEarlyLevel
} from "../src/data/earlyPhonicsValidation.js";
import {
  getQuestionPromptAnswerSignature,
  getQuestionSignature,
  getRepeatOptionSetSignature,
  getRepeatTargetWord
} from "../src/questionRepeatGuards.js";
import { getAnswerOptionLabel } from "../src/utils/answerOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const blockedAssessmentImagePaths = new Set([
  "/media/initial-sounds/images/a/acorn.webp",
  "/media/initial-sounds/images/n/nut.webp",
  "/images/child-mode/short-u/nut.png"
]);
const excludedAssessmentWords = new Set([
  "zinnia",
  "zinnia flower",
  "zannia",
  "zone",
  "observer",
  "opera",
  "quartz",
  "quiver",
  "quickstep",
  "upbeat",
  "uplift",
  "urban garden",
  "velvet",
  "yodeler",
  "yucca plant"
]);

function publicAssetExists(assetPath) {
  return Boolean(
    assetPath &&
    String(assetPath).startsWith("/") &&
    fs.existsSync(path.join(rootDir, "public", assetPath))
  );
}

function questionImagePaths(question = {}) {
  return [
    question.imageUrl,
    question.imagePath,
    question.image,
    ...(Array.isArray(question.imageCards) ? question.imageCards.flatMap(card => [card.image, card.imageUrl, card.imagePath]) : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.flatMap(option => [option.image, option.imageUrl, option.imagePath]) : []),
    ...(Array.isArray(question.promptImageCards) ? question.promptImageCards.flatMap(card => [card.image, card.imageUrl, card.imagePath]) : [])
  ].filter(Boolean);
}

const questionBanks = [
  ["src/questions.js", questions],
  ["src/data/masteryCoreQuestions.js", masteryCoreQuestions],
  ["src/data/masteryExtraQuestions.js", masteryExtraQuestions],
  ["src/data/initialSoundCoverageQuestions.js", initialSoundCoverageQuestions],
  ["src/data/finalSoundCoverageQuestions.js", finalSoundCoverageQuestions],
  ["src/data/rhymingCoverageQuestions.js", rhymingCoverageQuestions],
  ["src/data/cvcShortVowelExpansionQuestions.js", cvcShortVowelExpansionQuestions],
  ["src/data/contentExpansionPass3Questions.js", contentExpansionPass3Questions],
  ["src/data/targetedContentRecoveryQuestions.js", targetedContentRecoveryQuestions],
  ["src/data/kimiDataset7RuntimeQuestions.js", kimiDataset7RuntimeQuestions],
  ["src/data/safeContentExpansionQuestions.js", safeContentExpansionQuestions],
  ["src/data/ixlStyleSeedQuestions.js", ixlStyleSeedQuestions],
  ["src/data/templateQuestions.js", templateQuestions],
  ["src/data/templateExpansion.js", templateExpansion],
  ["src/data/templateExpansion2.js", templateExpansion2],
  ["src/data/templateExpansion3.js", templateExpansion3],
  ["src/data/templateExpansion4.js", templateExpansion4],
  ["src/data/templateExpansion5.js", templateExpansion5],
  ["src/data/templateExpansion6.js", templateExpansion6],
  ["src/data/templateExpansion7.js", templateExpansion7],
  ["src/data/questionBankExpansion8.js", questionBankExpansion8],
  ["src/data/generated/earlySkillQuestions.generated.js", generatedEarlySkillQuestions],
  ["src/data/generated/hfwAssessmentQuestions.generated.js", hfwAssessmentQuestions],
  ["src/data/generated/skillLevelGapQuestions.generated.js", skillLevelGapQuestions],
  ["src/data/generated/hfwLevel2Questions.generated.js", hfwLevel2Questions],
  ["src/data/generatedQuestions.js", generatedQuestions],
  ["src/data/fixSentenceQuestions.js", fixSentenceQuestions],
  ["src/data/templateComprehensionAdvanced.js", templateComprehensionAdvanced]
];

const allQuestions =
  questionBanks.flatMap(([file, bank]) =>
    bank.map((question, index) => ({
      file,
      index,
      question: enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion(question))
    }))
  );

const questionFormatValues = getAllowedQuestionFormatValues();

const knownPluralNouns = new Set([
  "children",
  "feet",
  "glasses",
  "pants",
  "people",
  "scissors",
  "shoes"
]);

const singularSExceptions = new Set([
  "bus",
  "class",
  "dress",
  "grass"
]);

const obviousQuestionStems = [
  "answer the question",
  "choose the correct answer",
  "choose the right answer",
  "what is the answer",
  "which one is correct"
];

const metaPhonicsPatterns = [
  /\bwhich (word|choice) is a cvc word\b/i,
  /\bwhich choice is a cvc word\b/i
];

const unsafeShortVowelAudioPattern =
  /\bshort [aeiou] sound\b/i;

const phonemeSlashPattern =
  /\/[a-zăĕĭŏŭ]{1,3}\//i;

const visiblePhonemeNotationPattern =
  /\/[a-zăĕĭŏŭ]{1,3}\//i;

const isolatedSpokenPhonemePattern =
  /^(\/[a-zăĕĭŏŭ]{1,3}\/|[a-zăĕĭŏŭ]{1,3}|short [aeiou]|long [aeiou])$/i;

const vagueVowelWordingPattern =
  /\b(vowel sound|short [aeiou] sound|sound in (apple|egg|itch|octopus|up))\b/i;

const naturalSentencePattern =
  /^[A-Z].*[.?!]$/;

const earlyPhonicsStages = new Set([
  "CVC and Short Vowels",
  "Short Vowel Discrimination"
]);

const ixlTemplateTypes = new Set([
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

const ixlWordAudioTemplateTypes = new Set([
  "FIRST_SOUND",
  "ENDING_SOUND",
  "BLEND_SOUNDS",
  "PUT_SOUNDS_IN_ORDER",
  "RHYMING_PICTURE",
  "SHORT_VOWEL_WORD",
  "COMPLETE_WORD"
]);

function isIxlTemplate(question) {
  return question?.questionType === "ixl_template" || ixlTemplateTypes.has(String(question?.templateType || question?.formatType || "").toUpperCase());
}

function isAllowedInitialSoundRuntimeFormat(question) {
  const formatType = String(question?.templateType || question?.formatType || "").toUpperCase();
  return isInitialSoundPairQuestion(question) || formatType === "FIRST_SOUND";
}

const earlyBoundaryPromptPattern =
  /\b(blend|blends|digraph|digraphs|two consonants?|consonants together|long vowel|silent e|magic e|vowel team|r-controlled)\b/i;

const cvcVowels = new Set(["a", "e", "i", "o", "u"]);

const approvedHomophonePairs = [
  ["road", "rode"],
  ["eight", "ate"],
  ["sea", "see"],
  ["right", "write"],
  ["stair", "stare"],
  ["steak", "stake"],
  ["one", "won"],
  ["two", "too"],
  ["blue", "blew"],
  ["hear", "here"],
  ["no", "know"],
  ["by", "buy"],
  ["pair", "pear"],
  ["flower", "flour"],
  ["mail", "male"],
  ["night", "knight"],
  ["week", "weak"],
  ["tail", "tale"],
  ["hole", "whole"],
  ["meet", "meat"],
  ["peace", "piece"],
  ["bear", "bare"],
  ["dear", "deer"],
  ["sail", "sale"],
  ["wait", "weight"]
];

const approvedHomophoneWords =
  new Set(approvedHomophonePairs.flat());

const grammarMetaPattern =
  /^Which word is an? (noun|verb|adjective)\?$/i;

const finalKsPattern =
  /(^|[^a-z])(fox|box|wax|fix|six|mix)([^a-z]|$)/i;

const unsafeIsolatedPhonemePromptPattern =
  /\b(what sound does|which letter makes|what letter makes|what is the (first|beginning|ending|last|middle) sound|which vowel makes|what sound do these letters|which two letters make|what two letters together)\b/i;

const verifiedPhonemeAudioPattern =
  /^\/audio\/phonemes\/[a-z]{1,3}\.mp3$/i;

const answerVisibleStopwords = new Set([
  "a",
  "an",
  "the"
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedChoices(choices) {
  return choices.map(choice => normalize(getAnswerOptionLabel(choice)));
}

function isFixSentenceQuestion(question) {
  return question?.questionType === "fix_sentence";
}

function isWordRecognitionQuestion(question) {
  const typeText = normalize([question.questionType, question.formatType].join(" "));
  return typeText.includes("word recognition") || typeText.includes("print match");
}

function getAnchorPromptInfo(question) {
  const text = normalize([question.question, question.prompt, question.spokenPrompt].join(" "));
  const match =
    text.match(/\b(starts the same as|ends the same as|starts like|ends like|has the same middle sound as|same sound in the middle as) ([a-z]+)\b/);

  if (!match) return null;

  return {
    phrase: match[1],
    anchor: match[2]
  };
}

function anchorChoiceLeakageIssue(question) {
  if (isWordRecognitionQuestion(question)) return null;

  const anchorInfo = getAnchorPromptInfo(question);
  if (!anchorInfo || !Array.isArray(question.choices)) return null;

  const choices = normalizedChoices(question.choices);

  return choices.includes(anchorInfo.anchor)
    ? `Anchor word "${anchorInfo.anchor}" appears in choices for "${question.question}".`
    : null;
}

function sentenceCompletionContextIssue(question) {
  const promptText = String([question.question, question.prompt, question.spokenPrompt].join(" "));
  if (!/\b(complete(?:s)? the sentence|best completes the sentence)\b/i.test(promptText)) return null;

  const visibleContext = question.passage || question.sentence || question.context || question.brokenSentence;

  return visibleContext
    ? null
    : `Sentence-completion prompt has no visible sentence/context: "${question.question || question.prompt}".`;
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

  if (skill.includes("initial") && /\b(which word starts the same as|starts the same as|starts like)\b/.test(promptText)) return "legacy text-only Initial Sounds anchor prompt";
  if (skill.includes("final") && /\b(which word ends|ends the same|ends like)\b/.test(promptText)) return "legacy text-only Final Sounds prompt";
  if (/\b(which word rhymes|choose the word that rhymes)\b/.test(promptText) && !hasVisualOrAudio) return "legacy text-only Rhyming prompt";
  if ((skill.includes("short vowel") || skill.includes("cvc")) && /\b(same middle sound|same sound in the middle)\b/.test(promptText)) return "legacy text-only short-vowel/CVC sound prompt";
  if ((skill.includes("blend") || skill.includes("digraph")) && /\bwhich word starts with\b/.test(promptText) && !hasVisualOrAudio) return "legacy text-only blend/digraph visual pattern prompt";
  if (/\bwhich word has the [a-z]{2} (?:blend|digraph)\b/.test(promptText) && !hasVisualOrAudio) return "legacy text-only blend/digraph visual pattern prompt";

  return "";
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

const auditVowelTeams = ["ai", "ay", "ee", "ea", "oa", "ow", "igh", "ie", "oo", "ue", "ew", "oi", "oy", "ou", "aw"];
const auditRControlled = ["ar", "er", "ir", "or", "ur"];
const auditBlends = ["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw"];
const auditDigraphs = ["sh", "ch", "th", "wh", "ph"];

function findPattern(patterns, text) {
  const normalized = normalize(text);
  return patterns.find(pattern => normalized.includes(pattern));
}

function inferCoverageMetadata(question, stage) {
  if (question.itemType && question.itemKey) {
    return { itemType: question.itemType, itemKey: normalize(question.itemKey) };
  }

  const answer = normalize(question.answer);
  const text = normalize([question.question, question.prompt, question.spokenPrompt, question.audioText, question.passage, answer].join(" "));
  if (!answer) return null;

  if (stage.startsWith("High-Frequency Words")) return { itemType: "sight_word", itemKey: answer };
  if (stage === "Initial Sounds") return { itemType: "initial_sound", itemKey: answer[0] };
  if (stage === "Final Sounds") return { itemType: "final_sound", itemKey: answer.at(-1) };
  if (stage === "Rhyming") {
    const anchor = text.match(/rhymes? with ([a-z]+)/)?.[1];
    const group = question.itemKey || getRhymeGroup(anchor) || getRhymeGroup(question.targetWord) || getRhymeGroup(answer);
    return group ? { itemType: "rhyming_family", itemKey: group } : null;
  }
  if (stage === "CVC and Short Vowels") return { itemType: "cvc_word", itemKey: answer };
  if (stage === "Short Vowel Discrimination") {
    const vowel = answer.split("").find(letter => "aeiou".includes(letter));
    return vowel ? { itemType: "short_vowel", itemKey: `short_${vowel}` } : null;
  }
  if (stage === "Blends") {
    const pattern = findPattern(auditBlends, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stage === "Digraphs") {
    const pattern = findPattern(auditDigraphs, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stage === "Long Vowels and Silent E") {
    const pattern = text.match(/long ([aeiou])/)?.[1] || answer.match(/([aeiou])[^aeiou]?e$/)?.[1];
    return pattern ? { itemType: "phonics_pattern", itemKey: `${pattern}_e` } : null;
  }
  if (stage === "Vowel Teams") {
    const pattern = findPattern(auditVowelTeams, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stage === "R-Controlled Vowels") {
    const pattern = findPattern(auditRControlled, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }

  return null;
}

function coverageMetadataIssue(question, stage) {
  if (!coverageEnabledStages.has(stage)) return null;
  return inferCoverageMetadata(question, stage)
    ? null
    : `Coverage-enabled question lacks inferable itemType/itemKey: "${question.question}".`;
}

function isSingleLetter(text) {
  return /^[a-z]$/i.test(String(text || "").trim());
}

function isSimpleCvcWord(text) {
  const word = normalize(text);

  if (!/^[a-z]{3}$/.test(word)) return false;

  return (
    !cvcVowels.has(word[0]) &&
    cvcVowels.has(word[1]) &&
    !cvcVowels.has(word[2])
  );
}

function extractEarlyPhonicsTarget(questionText) {
  const text = String(questionText || "");
  const sameSoundMatch =
    text.match(/same (?:middle |vowel )?sound as ['"]?([a-z]+)['"]?/i);

  if (sameSoundMatch) return sameSoundMatch[1];

  const soundInWordMatch =
    text.match(/sound in .*?word ['"]?([a-z]+)['"]?/i);

  return soundInWordMatch?.[1] || null;
}

function homophoneValidityIssue(question) {
  const skill = normalize(question.skill);
  if (!skill.includes("homophone") && !skill.includes("homonym")) return null;

  const answer = normalize(question.answer);
  const choices = normalizedChoices(question.choices || []);

  if (!approvedHomophoneWords.has(answer)) {
    return `Answer "${question.answer}" is not in the approved true-homophone set.`;
  }

  const hasApprovedPair = approvedHomophonePairs.some(pair =>
    pair.includes(answer) && pair.every(word => choices.includes(word))
  );

  return hasApprovedPair
    ? null
    : `Question does not include the approved homophone pair for "${question.answer}".`;
}

function getFirstVowel(word) {
  return normalize(word).split("").find(letter => cvcVowels.has(letter));
}

function getInitialPattern(word) {
  return normalize(word)[0] || "";
}

function getBlendPattern(question) {
  const answer = normalize(question.answer);
  const text = normalize([question.question, question.spokenPrompt, question.answer, ...(question.choices || [])].join(" "));

  return Object.keys(blendAnchors).find(pattern =>
    answer.startsWith(pattern) || new RegExp("(^| )" + pattern + "( |$)").test(text)
  );
}

function getDigraphPattern(question) {
  const answer = normalize(question.answer);
  const text = normalize([question.question, question.spokenPrompt, question.answer, ...(question.choices || [])].join(" "));

  return Object.keys(digraphAnchors).find(pattern =>
    answer.startsWith(pattern) || new RegExp("(^| )" + pattern + "( |$)").test(text)
  );
}

function phonicsWordingIssue(question, stage) {
  const prompt = String(question.question || "");
  const spoken = String(question.spokenPrompt || question.audioText || "");
  const formatType = String(question.formatType || "").toUpperCase();
  const isIxlWordAudio = isIxlTemplate(question) && ixlWordAudioTemplateTypes.has(formatType);
  const permitsStaticWordAudio = new Set([
    "LISTEN_FIND_RHYME",
    "LISTEN_CHOOSE_VOWEL",
    "MISSING_VOWEL_CVC",
    "PICTURE_AUDIO_TO_PATTERN",
    "LISTEN_FIND_WORD",
    "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    "PICTURE_TO_PRINT_MATCH"
  ]).has(formatType);
  const usesNewVisualPatternFormat = new Set([
    "PICTURE_AUDIO_TO_PATTERN",
    "IMAGE_WORD_PATTERN_MATCH",
    "HEARD_WORD_TO_PRINT_MINIMAL_PAIR"
  ]).has(formatType);
  const usesNewShortVowelFormat = new Set([
    "LISTEN_CHOOSE_VOWEL",
    "PICTURE_TO_PRINT_MATCH",
    "MISSING_VOWEL_CVC"
  ]).has(formatType);

  if (visiblePhonemeNotationPattern.test(prompt)) {
    return 'Visible prompt contains phoneme slash notation: "' + prompt + '".';
  }

  if (isIxlTemplate(question)) return null;

  const isListenAndFindWord = question.questionType === "listen_and_find_word";
  const isPairSelect = isPairSelectionQuestion(question);

  if (!isIxlWordAudio && !permitsStaticWordAudio && !isListenAndFindWord && !isPairSelect && spoken && isolatedSpokenPhonemePattern.test(spoken.trim())) {
    return 'spokenPrompt/audioText uses an isolated phoneme or letter sound: "' + spoken + '".';
  }

  if (!isIxlWordAudio && !permitsStaticWordAudio && !isListenAndFindWord && !isPairSelect && spoken && !naturalSentencePattern.test(spoken.trim())) {
    return 'spokenPrompt/audioText should be a full natural sentence: "' + spoken + '".';
  }

  if (!usesNewShortVowelFormat && (stage === "Short Vowel Discrimination" || stage === "CVC and Short Vowels") && (vagueVowelWordingPattern.test(prompt) || vagueVowelWordingPattern.test(spoken))) {
    return 'Use anchor-word middle-sound wording instead of vague vowel wording: "' + prompt + '" / "' + spoken + '".';
  }

  if (stage === "Initial Sounds" && !isPairSelect) {
    const anchor = initialSoundAnchors[getInitialPattern(question.answer)];
    if (anchor) {
      const expectedPrompt = "Which word starts the same as " + anchor + "?";
      const expectedSpoken = "Which word starts like " + anchor + "?";
      if (prompt !== expectedPrompt || spoken !== expectedSpoken) {
        return 'Initial-sound wording should use ' + anchor + ': "' + expectedPrompt + '" / "' + expectedSpoken + '".';
      }
    }
  }

  if (stage === "Final Sounds" && !isPairSelect) {
    const answer = normalize(question.answer);
    const finalPattern = normalize(question.itemKey || question.targetFinalSound || question.targetSound || question.phonicsPattern || answer.at(-1));
    const anchor = finalPattern.length === 1 ? finalSoundAnchors[finalPattern] : null;
    if (anchor) {
      const expectedPrompt = "Which word ends the same as " + anchor + "?";
      const expectedSpoken = "Which word ends like " + anchor + "?";
      if (prompt !== expectedPrompt || spoken !== expectedSpoken) {
        return 'Final-sound wording should use ' + anchor + ': "' + expectedPrompt + '" / "' + expectedSpoken + '".';
      }
    }
  }

  if (stage === "Short Vowel Discrimination" && !usesNewShortVowelFormat) {
    const anchor = shortVowelAnchors[getFirstVowel(question.answer)];
    if (anchor) {
      const expectedPrompt = "Which word has the same middle sound as " + anchor + "?";
      const expectedSpoken = "Which word has the same sound in the middle as " + anchor + "?";
      if (prompt !== expectedPrompt || spoken !== expectedSpoken) {
        return 'Short-vowel wording should use ' + anchor + ': "' + expectedPrompt + '" / "' + expectedSpoken + '".';
      }
    }
  }

  if (stage === "CVC and Short Vowels" && isListenAndFindWord) {
    const expectedSpoken = normalize(question.answer);
    if (spoken !== expectedSpoken) {
      return 'Listen & Find audio text should be the single target word "' + expectedSpoken + '".';
    }
  }

  if (stage === "Digraphs" && !usesNewVisualPatternFormat) {
    const pattern = getDigraphPattern(question);
    const anchor = digraphAnchors[pattern];
    if (pattern && anchor) {
      const expectedPrompt = "Which word starts with " + pattern + "?";
      const expectedSpoken = "Which word starts like " + anchor + "?";
      if (prompt !== expectedPrompt || spoken !== expectedSpoken) {
        return 'Digraph wording should use ' + pattern + '/' + anchor + ': "' + expectedPrompt + '" / "' + expectedSpoken + '".';
      }
    }
  }

  if (stage === "Blends" && !usesNewVisualPatternFormat) {
    const pattern = getBlendPattern(question);
    const anchor = blendAnchors[pattern];
    if (pattern && anchor) {
      const expectedPrompt = "Which word starts with " + pattern + "?";
      const expectedSpoken = "Which word starts like " + anchor + "?";
      if (prompt !== expectedPrompt || spoken !== expectedSpoken) {
        return 'Blend wording should use ' + pattern + '/' + anchor + ': "' + expectedPrompt + '" / "' + expectedSpoken + '".';
      }
    }
  }

  return null;
}

function meaningTaskNonwordIssue(question, stage) {
  const meaningStages = new Set([
    "High-Frequency Words 1-25",
    "High-Frequency Words 26-50",
    "High-Frequency Words 51-100",
    "Nouns",
    "Verbs",
    "Adjectives",
    "Prepositions of Place",
    "Plurals",
    "Prefixes and Suffixes",
    "Antonyms and Synonyms",
    "Homophones and Homonyms",
    "Sentence Comprehension",
    "Key Details",
    "Sequencing",
    "Main Idea",
    "Inference",
    "Cause and Effect",
    "Context Clues",
    "Theme and Higher Comprehension"
  ]);

  if (!meaningStages.has(stage)) return null;

  const suspicious = (question.choices || []).find(choice => {
    const normalized = normalize(choice);
    if (!normalized || normalized.length <= 1) return false;
    if (/^[a-z]+(?: [a-z]+)*$/.test(normalized)) return false;
    return true;
  });

  return suspicious
    ? 'Meaning-based task has a suspicious nonword or artifact choice: "' + suspicious + '".'
    : null;
}

function hasCompletedSequenceMarkers(passage) {
  const text = normalize(passage);
  const markerGroups = [
    ["first", "next", "last"],
    ["first", "then", "last"],
    ["first", "then", "finally"],
    ["first", "next", "finally"],
    ["then", "later"],
    ["last", "finally"]
  ];

  return markerGroups.some(group =>
    group.every(marker => new RegExp("(^| )" + marker + "( |$)").test(text))
  );
}

function ambiguousSequencingNextIssue(question, stage) {
  if (stage !== "Sequencing") return null;

  const prompt = String(question.question || "");
  if (!/\b(what happened next|what did .+ do next|what did they do next|what did .+ pack next)\?/i.test(prompt)) {
    return null;
  }

  if (!hasCompletedSequenceMarkers(question.passage || "")) return null;

  return 'Completed sequence should use explicit ordinal wording instead of ambiguous "next": "' + prompt + '".';
}

function finalKsCvcIssue(question, stage) {
  if (isIxlTemplate(question)) return null;
  if (!earlyPhonicsStages.has(stage)) return null;

  const target = extractEarlyPhonicsTarget(question.question);
  const values = [target, question.answer, ...(question.choices || [])]
    .filter(Boolean);

  const flagged = values.find(value => finalKsPattern.test(String(value)));

  return flagged
    ? `Final /ks/ word "${flagged}" is not allowed in beginner CVC/short-vowel stages.`
    : null;
}

function isolatedPhonemeAudioIssue(question) {
  if (isIxlTemplate(question)) return null;
  if (!unsafeIsolatedPhonemePromptPattern.test(question.question || "")) return null;

  const choices = question.choices || [];
  const hasOnlyIsolatedLetterChoices =
    choices.length > 0 && choices.every(choice => /^[a-z]{1,3}$/i.test(String(choice).trim()));

  if (!hasOnlyIsolatedLetterChoices) return null;

  const audioPath = question.audioPath || question.phonemeAudioPath || question.audioFile || "";

  return verifiedPhonemeAudioPattern.test(audioPath)
    ? null
    : `Prompt asks for isolated phoneme/letter sound with isolated letter choices but no verified phoneme MP3: "${question.question}".`;
}

function cvcListenAudioIssue(question, stage) {
  if (stage !== "CVC and Short Vowels") return null;
  if (question.questionType !== "listen_and_find_word") return null;

  const expected = normalize(question.answer);
  const spokenPrompt = question.spokenPrompt ? normalize(question.spokenPrompt) : "";
  const audioText = question.audioText ? normalize(question.audioText) : "";

  if (!spokenPrompt && !audioText) {
    return "Listen & Find Word question needs one-word spokenPrompt/audioText.";
  }

  if (spokenPrompt && spokenPrompt !== expected) {
    return 'spokenPrompt must be the single target word "' + question.answer + '", not "' + question.spokenPrompt + '".';
  }

  if (audioText && audioText !== expected) {
    return 'audioText must be the single target word "' + question.answer + '", not "' + question.audioText + '".';
  }

  const diagnostics = getListenAndFindAssetDiagnostics(question);
  if (!diagnostics) return null;
  if (diagnostics.missingAudio) {
    return `Listen & Find Word target needs a static word mp3: "${question.answer}".`;
  }
  if (diagnostics.missingImages.length > 0 || diagnostics.missingChoiceAssets.length > 0) {
    return `Listen & Find Word choices need image assets: ${[...new Set([...diagnostics.missingImages, ...diagnostics.missingChoiceAssets])].join(", ")}.`;
  }

  return null;
}

function earlyPhonicsBoundaryIssue(question, stage) {
  if (isIxlTemplate(question) && ["COMPLETE_WORD", "PUT_SOUNDS_IN_ORDER", "SHORT_VOWEL_WORD"].includes(String(question.templateType || question.formatType || "").toUpperCase())) {
    return null;
  }

  if (!earlyPhonicsStages.has(stage)) return null;

  if (earlyBoundaryPromptPattern.test(question.question || "")) {
    return `Prompt uses a later phonics concept in ${stage}: "${question.question}".`;
  }

  const target = extractEarlyPhonicsTarget(question.question);

  if (target && !isSimpleCvcWord(target)) {
    return `Target word "${target}" is not a simple CVC word for ${stage}.`;
  }

  const responseWords = [question.answer, ...(question.choices || [])]
    .map(value => normalize(value))
    .filter(Boolean);

  for (const word of responseWords) {
    if (isSingleLetter(word)) continue;
    if (!isSimpleCvcWord(word)) {
      return `Choice/answer "${word}" is not a simple CVC word for ${stage}.`;
    }
  }

  return null;
}


function questionFormatMetadataIssue(question) {
  if (question.formatType && !questionFormatValues.formatTypes.includes(String(question.formatType).toUpperCase())) {
    return `Unknown formatType "${question.formatType}".`;
  }

  if (question.phonicsPosition && !questionFormatValues.phonicsPositions.includes(normalize(question.phonicsPosition))) {
    return `Unknown phonicsPosition "${question.phonicsPosition}".`;
  }

  if (question.hadPTD !== undefined && typeof question.hadPTD !== "boolean") {
    return "hadPTD must be a boolean when supplied.";
  }

  if (question.crossPatternGroup && !question.targetPattern) {
    return "crossPatternGroup is set but targetPattern is missing.";
  }

  return null;
}

function createQuestionFormatStats() {
  return {
    tagged: 0,
    inferred: 0,
    formatTypes: {},
    visualRecognitionOnly: 0,
    requiresAudio: 0,
    patternTrap: 0,
    crossPattern: 0,
    missingExplicitMigration: 0
  };
}

function updateQuestionFormatStats(stats, question) {
  const metadata = getQuestionFormatMetadata(question);
  const explicit = Boolean(question.formatType && question.masteryStage);
  if (explicit) stats.tagged += 1;
  else {
    stats.inferred += 1;
    stats.missingExplicitMigration += 1;
  }

  stats.formatTypes[metadata.formatType] = (stats.formatTypes[metadata.formatType] || 0) + 1;
  if (isVisualRecognitionOnly(question)) stats.visualRecognitionOnly += 1;
  if (requiresAudioSupport(question)) stats.requiresAudio += 1;
  if (hasPatternTrap(question)) stats.patternTrap += 1;
  if (isCrossPatternQuestion(question)) stats.crossPattern += 1;
}

function getStage(question) {
  const skill = normalize(question.skill);

  if (skill.includes("r controlled")) {
    return "R-Controlled Vowels";
  }

  const exactSkillMatch = skillTree.find(stage =>
    stage.match.some(term => skill === normalize(term))
  );

  if (exactSkillMatch) return exactSkillMatch.label;

  if (skill.includes("short vowel discrimination")) {
    return "Short Vowel Discrimination";
  }

  const text = [
    question.skill,
    question.question,
    question.passage,
    ...(question.choices || [])
  ].join(" ").toLowerCase();

  const index = skillTree.findIndex(stage =>
    stage.match.some(term => text.includes(term.toLowerCase()))
  );

  return index === -1 ? "UNMATCHED" : skillTree[index].label;
}

function isActiveRuntimeQuestion(question) {
  if (question?.active === false) return false;
  if (!question?.id || !question.skill || !(question.question || question.prompt) || !question.answer) return false;
  if (getStage(question) === "UNMATCHED") return false;
  if (!Array.isArray(question.choices) || question.choices.length < 2) return false;
  if (!isPairSelectionQuestion(question) && !question.choices.includes(question.answer)) return false;
  if (isPairSelectionQuestion(question) && !hasCompletePairSelectionAssets(question)) return false;
  if (isVisualCardChoiceQuestion(question) && !hasCompleteVisualQuestionAssets(question)) return false;
  if (question.questionType === "initial_sound_pair" && isInitialSoundQuestion(question) && !hasCompleteInitialSoundPairAssets(question)) return false;
  if (question.questionType === "listen_and_find_word") {
    const diagnostics = getListenAndFindAssetDiagnostics(question);
    if (
      diagnostics?.missingAudio ||
      diagnostics?.missingImages.length > 0 ||
      diagnostics?.missingChoiceAssets.length > 0 ||
      !diagnostics?.usesSingleWordAudioText
    ) return false;
  }
  if (anchorChoiceLeakageIssue(question)) return false;
  if (sentenceCompletionContextIssue(question)) return false;
  if (questionContainsWord(question, "pun")) return false;
  if (weakLegacyPhonicsReason(question)) return false;
  if (lowQualityPluralDistractorReason(question)) return false;
  if (getAssessmentContentIssues(question, { assetExists: publicAssetExists }).length > 0) return false;

  const choices = normalizedChoices(question.choices);
  return new Set(choices).size === choices.length;
}

function getRuntimeQuestionSignature(question) {
  return getQuestionSignature(question, inferCoverageMetadata(question, getStage(question)));
}

function getCanonicalRuntimeItems() {
  const canonical = [];
  const duplicates = [];
  const seen = new Map();

  for (const item of allQuestions) {
    if (!isActiveRuntimeQuestion(item.question)) continue;

    const signature = getRuntimeQuestionSignature(item.question);
    const key = signature || item.question.id;
    if (!key) continue;

    if (seen.has(key)) {
      duplicates.push({
        signature: key,
        kept: seen.get(key),
        duplicate: item
      });
      continue;
    }

    seen.set(key, item);
    canonical.push(item);
  }

  return { canonical, duplicates };
}

function addProblem(problems, type, item, detail) {
  problems.push({
    type,
    file: item.file,
    id: item.question?.id || `index ${item.index}`,
    detail
  });
}

function isImageQuestion(question) {
  const questionType = normalize(question.questionType);
  const skill = normalize(question.skill);
  const text = normalize(question.question);

  return (
    questionType.includes("image") ||
    questionType.includes("picture") ||
    skill.includes("picture comprehension") ||
    text.includes("picture") ||
    text.includes("image") ||
    text.includes("matches the picture")
  );
}

function isPictureToPrintQuestion(question) {
  return String(question.formatType || "").toUpperCase() === "PICTURE_TO_PRINT_MATCH" ||
    normalize(question.question || question.prompt).includes("matches the picture");
}

function pictureToPrintLayoutIssue(question) {
  if (!isPictureToPrintQuestion(question)) return "";
  if (!question.imagePath) return "Picture-to-print question needs exactly one main target image.";
  if ((question.imageCards || []).length > 0 || Object.keys(question.choiceImages || {}).length > 0) {
    return "Picture-to-print answer choices must be text-only, not image cards.";
  }
  return "";
}

function requiresStaticAssessmentAudio(question) {
  const formatType = String(question.formatType || "").toUpperCase();
  return new Set([
    "INITIAL_SOUND_PAIR_SELECT",
    "FINAL_SOUND_PAIR_SELECT",
    "RHYME_PAIR_SELECT",
    "LISTEN_FIND_RHYME",
    "LISTEN_CHOOSE_VOWEL",
    "PICTURE_TO_PRINT_MATCH",
    "PICTURE_AUDIO_TO_PATTERN",
    "LISTEN_FIND_WORD",
    "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    "PLURAL_LISTEN_SELECT"
  ]).has(formatType) || question.questionType === "listen_and_find_word";
}

function audioPathsForQuestion(question) {
  const audioPaths = [];
  if (question.audioPath) {
    audioPaths.push({
      key: question.audioText || question.answer || question.id,
      path: question.audioPath,
      role: "prompt audio"
    });
  }

  for (const card of question.imageCards || []) {
    audioPaths.push({
      key: card.word,
      path: card.audio,
      role: "card audio"
    });
  }

  return audioPaths;
}

function audioPreferenceIssue(question) {
  const issues = [];
  const requiresStatic = requiresStaticAssessmentAudio(question);

  if (requiresStatic && question.audioText && !question.audioPath && !question.imageCards?.length) {
    issues.push(`Asset-required audio prompt has no static MP3 for "${question.audioText}".`);
  }

  for (const asset of audioPathsForQuestion(question)) {
    if (!asset.path && requiresStatic) {
      issues.push(`${asset.role} for "${asset.key}" is missing a static MP3.`);
      continue;
    }

    if (asset.path && isDeprecatedAudioPath(asset.path)) {
      issues.push(`${asset.role} uses deprecated/quarantined audio: ${asset.path}`);
    } else if (asset.path && isReviewNeededAudioPath(asset.path)) {
      issues.push(`${asset.role} uses review-needed audio: ${asset.path}`);
    }

    if (requiresStatic && !getAudioPreference(asset.key) && !getAudioPreferenceForPath(asset.path)) {
      issues.push(`${asset.role} key "${asset.key}" is missing from audioPreferenceManifest.`);
    }

    if (requiresStatic && !getApprovedAudioPath(asset.key, asset.path)) {
      issues.push(`${asset.role} has no approved static MP3: ${asset.key}.`);
    }

    if (
      requiresStatic &&
      String(question.formatType || "").toUpperCase() === "LISTEN_FIND_WORD" &&
      asset.path &&
      !asset.path.startsWith("/audio/child-mode/")
    ) {
      issues.push(`Listen & Find Word must use static child-mode audio, not ${asset.path}.`);
    }
  }

  return issues.join(" ");
}

function imagePathExists(imagePath) {
  if (!imagePath || !imagePath.startsWith("/")) return false;

  const localPath = path.join(rootDir, "public", imagePath);
  return fs.existsSync(localPath);
}

function nounPhraseIsPlural(nounPhrase) {
  const lastWord = normalize(nounPhrase)
    .split(/\s+/)
    .filter(Boolean)
    .at(-1);

  if (!lastWord) return false;
  if (knownPluralNouns.has(lastWord)) return true;
  if (singularSExceptions.has(lastWord)) return false;

  return lastWord.endsWith("s");
}

function expectedWhereVerb(questionText) {
  const match =
    String(questionText || "").match(/^Where (is|are) the ([a-z][a-z -]*?)\?$/i);

  if (!match) return null;

  return nounPhraseIsPlural(match[2]) ? "are" : "is";
}

function answerIsVisible(question) {
  if (isIxlTemplate(question)) return false;

  const answer = normalize(question.answer);
  const questionText = normalize(question.question);

  if (!answer || answer.length < 3) return false;
  if (answerVisibleStopwords.has(answer)) return false;
  if (normalize(question.skill).includes("rhym")) return false;
  if (["LISTEN_FIND_WORD", "READ_FIND_WORD"].includes(String(question.formatType || "").toUpperCase())) return false;

  const skill = normalize(question.skill);
  const prompt = normalize(question.question);
  if (
    (skill.includes("initial") || skill.includes("final") || skill.includes("short vowel") || skill.includes("cvc")) &&
    /^(which word starts the same as|which word ends the same as|which word has the same middle sound as)/.test(prompt)
  ) {
    return false;
  }

  return new RegExp(`(^| )${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`)
    .test(questionText);
}

function hasMultipleLikelyCorrectAnswers(question) {
  if (isPairSelectionQuestion(question)) return false;
  if (isIxlTemplate(question)) return false;

  const skill = normalize(question.skill);
  const answer = normalize(question.answer);
  const choices = normalizedChoices(question.choices || []);

  if (!choices.includes(answer)) return false;

  if (skill.includes("initial")) {
    const first = answer[0];
    return choices.filter(choice => choice[0] === first).length > 1;
  }

  if (skill.includes("final")) {
    const last = answer.at(-1);
    return choices.filter(choice => choice.at(-1) === last).length > 1;
  }

  if (skill.includes("rhym")) {
    const answerGroup = getRhymeGroup(answer);
    if (!answerGroup) return true;
    return choices.filter(choice => getRhymeGroup(choice) === answerGroup).length > 1;
  }

  return false;
}

function isTooAdvancedForEarlySkill(question) {
  const skill = normalize(question.skill);
  const earlySkill =
    skill.includes("initial") ||
    skill.includes("final") ||
    skill.includes("rhym") ||
    skill.includes("cvc") ||
    skill.includes("short vowel");

  if (!earlySkill) return false;

  const passageLength = normalize(question.passage).split(/\s+/).filter(Boolean).length;
  const questionLength = normalize(question.question).split(/\s+/).filter(Boolean).length;

  return passageLength > 18 || questionLength > 18;
}

function auditQuestions() {
  const problems = [];
  const counts = {};
  const formatStats = createQuestionFormatStats();
  const idLocations = new Map();

  for (const item of allQuestions) {
    const question = item.question;
    const stage = getStage(question);
    counts[stage] = (counts[stage] || 0) + 1;
    updateQuestionFormatStats(formatStats, question);

    if (question.active === false) continue;

    const targetWordsForQuality = [
      question.targetWord,
      question.anchorWord,
      question.audioText,
      question.diagnosticTarget,
      question.correctAnswer,
      question.answer
    ].map(value => String(value || "").toLowerCase().trim()).filter(Boolean);
    const blockedWord = targetWordsForQuality.find(value => excludedAssessmentWords.has(value));
    if (blockedWord) {
      addProblem(problems, "excluded target word active", item, `"${blockedWord}" is not suitable for active K-2 assessment use.`);
    }

    const blockedImagePath = questionImagePaths(question).find(imagePath => blockedAssessmentImagePaths.has(imagePath));
    if (blockedImagePath) {
      addProblem(problems, "blocked image active", item, `Active question uses blocked assessment image ${blockedImagePath}.`);
    }

    const formatMetadataProblem = questionFormatMetadataIssue(question);

    if (formatMetadataProblem) {
      addProblem(problems, "question format metadata", item, formatMetadataProblem);
    }

    if (!question.id) addProblem(problems, "missing id", item, "Question has no id.");
    if (!question.question) addProblem(problems, "missing question", item, "Question text is empty.");
    if (!question.skill) addProblem(problems, "missing skill", item, "Skill label is empty.");
    if (!question.answer) addProblem(problems, "missing answer", item, "Answer is empty.");

    if (question.id) {
      if (idLocations.has(question.id)) {
        addProblem(
          problems,
          "duplicate id",
          item,
          `Already used in ${idLocations.get(question.id)}.`
        );
      } else {
        idLocations.set(question.id, item.file);
      }
    }

    if (isFixSentenceQuestion(question)) {
      const tiles = question.tiles || question.choices;

      if (!question.brokenSentence) {
        addProblem(problems, "fix sentence missing broken sentence", item, "Fix-sentence question has no brokenSentence.");
      }

      if (!question.correctSentence) {
        addProblem(problems, "fix sentence missing correct sentence", item, "Fix-sentence question has no correctSentence.");
      }

      if (!Array.isArray(tiles) || tiles.length < 2) {
        addProblem(problems, "fix sentence missing tiles", item, "Fix-sentence question needs at least two tiles.");
      }

      continue;
    }

    if (isIxlTemplate(question) && String(question.templateType || question.formatType || "").toUpperCase() === "PUT_SOUNDS_IN_ORDER") {
      const contentIssues = getAssessmentContentIssues(question, { assetExists: publicAssetExists });
      if (!Array.isArray(question.soundTiles) || question.soundTiles.length < 2) {
        addProblem(problems, "sound-order missing tiles", item, "Sound-order template needs at least two sound tiles.");
      }
      for (const issue of contentIssues) {
        addProblem(problems, "template validation", item, issue);
      }
      continue;
    }

    if (isIxlTemplate(question) && Array.isArray(question.answerOptions) && question.answerOptions.length > 0) {
      const optionLabels = question.answerOptions.map(getAnswerOptionLabel);
      const missingOptionLabels = optionLabels
        .map((label, index) => ({ label, index }))
        .filter(option => !option.label);
      if (missingOptionLabels.length) {
        addProblem(
          problems,
          "answer option label missing",
          item,
          `IXL-style answer options need visible labels. Missing at indexes: ${missingOptionLabels.map(option => option.index).join(", ")}.`
        );
      }
      const normalizedLabels = optionLabels.map(label => String(label || "").trim());
      const answer = String(question.correctAnswer || question.answer || "").trim();
      const answerCount = normalizedLabels.filter(label => label === answer).length;
      if (answer && answerCount !== 1) {
        addProblem(
          problems,
          "answer label mismatch",
          item,
          `Correct answer "${question.correctAnswer || question.answer}" must appear exactly once as a visible answer label; found ${answerCount}.`
        );
      }
      for (const issue of getAssessmentContentIssues(question, { assetExists: publicAssetExists })) {
        addProblem(problems, "template validation", item, issue);
      }
      continue;
    }

    if (!Array.isArray(question.choices)) {
      addProblem(problems, "choices not array", item, "Choices must be an array.");
      continue;
    }

    if (question.choices.length < 2) {
      addProblem(problems, "too few choices", item, "Question has fewer than two choices.");
    }

    const choices = normalizedChoices(question.choices);
    const uniqueChoices = new Set(choices);

    if (uniqueChoices.size !== choices.length && !(isIxlTemplate(question) && String(question.templateType || question.formatType || "").toUpperCase() === "GRAMMAR_BASICS")) {
      addProblem(problems, "duplicate answer choices", item, question.choices.join(" | "));
    }

    const missingVisibleChoices = question.choices
      .map((choice, index) => ({ label: getAnswerOptionLabel(choice), index }))
      .filter(choice => !choice.label);
    if (missingVisibleChoices.length) {
      addProblem(
        problems,
        "answer option label missing",
        item,
        `Choices need visible labels. Missing at indexes: ${missingVisibleChoices.map(choice => choice.index).join(", ")}.`
      );
    }

    if (!isPairSelectionQuestion(question) && !choices.includes(normalize(question.answer))) {
      addProblem(
        problems,
        "answer not present in choices",
        item,
        `Answer "${question.answer}" is not one of: ${question.choices.join(" | ")}`
      );
    }

    if (hasMultipleLikelyCorrectAnswers(question)) {
      addProblem(
        problems,
        "multiple likely correct answers",
        item,
        `Choices may include more than one correct response for "${question.answer}".`
      );
    }

    if (answerIsVisible(question)) {
      addProblem(
        problems,
        "answer visible in question",
        item,
        `Answer "${question.answer}" appears in the question text.`
      );
    }

    const anchorLeakageProblem =
      anchorChoiceLeakageIssue(question);

    if (anchorLeakageProblem) {
      addProblem(
        problems,
        "anchor word leaked into choices",
        item,
        anchorLeakageProblem
      );
    }

    const sentenceCompletionProblem =
      sentenceCompletionContextIssue(question);

    if (sentenceCompletionProblem) {
      addProblem(
        problems,
        "sentence completion missing context",
        item,
        sentenceCompletionProblem
      );
    }

    const pictureToPrintProblem =
      pictureToPrintLayoutIssue(question);

    if (pictureToPrintProblem) {
      addProblem(
        problems,
        "picture-to-print layout",
        item,
        pictureToPrintProblem
      );
    }

    const audioPreferenceProblem =
      audioPreferenceIssue(question);

    if (audioPreferenceProblem) {
      addProblem(
        problems,
        "assessment audio preference",
        item,
        audioPreferenceProblem
      );
    }

    const coverageProblem =
      coverageMetadataIssue(question, stage);

    if (coverageProblem) {
      addProblem(
        problems,
        "coverage metadata missing",
        item,
        coverageProblem
      );
    }

    if (obviousQuestionStems.includes(normalize(question.question))) {
      addProblem(
        problems,
        "unclear wording",
        item,
        `Question wording is too vague: "${question.question}".`
      );
    }

    if (metaPhonicsPatterns.some(pattern => pattern.test(question.question || ""))) {
      addProblem(
        problems,
        "meta phonics wording",
        item,
        `Student-facing prompt uses CVC jargon: "${question.question}".`
      );
    }

    const homophoneProblem =
      homophoneValidityIssue(question);

    if (homophoneProblem) {
      addProblem(
        problems,
        "fake homophone",
        item,
        homophoneProblem
      );
    }

    const ambiguousSequencingProblem =
      ambiguousSequencingNextIssue(question, stage);

    if (ambiguousSequencingProblem) {
      addProblem(
        problems,
        "ambiguous sequencing next wording",
        item,
        ambiguousSequencingProblem
      );
    }

    if (grammarMetaPattern.test(question.question || "")) {
      addProblem(
        problems,
        "grammar meta phrasing",
        item,
        `Use child-facing grammar wording instead of: "${question.question}".`
      );
    }

    const isolatedPhonemeProblem =
      isolatedPhonemeAudioIssue(question);

    if (isolatedPhonemeProblem) {
      addProblem(
        problems,
        "unsafe isolated phoneme audio",
        item,
        isolatedPhonemeProblem
      );
    }

    const phonicsWordingProblem =
      phonicsWordingIssue(question, stage);

    if (phonicsWordingProblem) {
      addProblem(
        problems,
        "instructional phonics wording",
        item,
        phonicsWordingProblem
      );
    }

    const meaningNonwordProblem =
      meaningTaskNonwordIssue(question, stage);

    if (meaningNonwordProblem) {
      addProblem(
        problems,
        "nonword meaning distractor",
        item,
        meaningNonwordProblem
      );
    }

    if (stage === "Short Vowel Discrimination" && !question.spokenPrompt && !question.audioText) {
      addProblem(
        problems,
        "short vowel missing spokenPrompt",
        item,
        `Short vowel discrimination question needs spokenPrompt/audioText: "${question.question}".`
      );
    }

    const finalKsProblem =
      finalKsCvcIssue(question, stage);

    if (finalKsProblem) {
      addProblem(
        problems,
        "final ks in beginner cvc",
        item,
        finalKsProblem
      );
    }

    const cvcListenProblem =
      cvcListenAudioIssue(question, stage);

    if (cvcListenProblem) {
      addProblem(
        problems,
        "cvc listen audio text",
        item,
        cvcListenProblem
      );
    }

    if (unsafeShortVowelAudioPattern.test(question.question || "") && !question.spokenPrompt && !question.audioText) {
      addProblem(
        problems,
        "unsafe phonics audio wording",
        item,
        `Short-vowel prompt needs spokenPrompt/audioText so TTS does not read letter names: "${question.question}".`
      );
    }

    if (phonemeSlashPattern.test(question.question || "") && !question.spokenPrompt && !question.audioText) {
      addProblem(
        problems,
        "phoneme prompt missing safe audio",
        item,
        `Prompt contains slash phoneme notation but no spokenPrompt/audioText: "${question.question}".`
      );
    }

    const earlyBoundaryProblem =
      earlyPhonicsBoundaryIssue(question, stage);

    if (earlyBoundaryProblem) {
      addProblem(
        problems,
        "early phonics boundary",
        item,
        earlyBoundaryProblem
      );
    }
    if (isImageQuestion(question)) {
      if (!question.imagePath) {
        addProblem(
          problems,
          "missing imagePath",
          item,
          `Image/picture question has no imagePath.`
        );
      } else if (!imagePathExists(question.imagePath)) {
        addProblem(
          problems,
          "broken imagePath",
          item,
          `Image file does not exist: ${question.imagePath}`
        );
      }
    } else if (question.imagePath && !imagePathExists(question.imagePath)) {
      addProblem(
        problems,
        "broken imagePath",
        item,
        `Image file does not exist: ${question.imagePath}`
      );
    }

    const expectedVerb = expectedWhereVerb(question.question);

    if (expectedVerb) {
      const actualVerb =
        question.question.match(/^Where (is|are) /i)?.[1].toLowerCase();

      if (actualVerb !== expectedVerb) {
        addProblem(
          problems,
          "mismatched singular/plural wording",
          item,
          `Expected "Where ${expectedVerb}..." for "${question.question}".`
        );
      }
    }

    if (isTooAdvancedForEarlySkill(question)) {
      addProblem(
        problems,
        "too advanced for early skill",
        item,
        "Early phonics question has an unusually long passage or prompt."
      );
    }
  }

  const activeOldInitialSounds = allQuestions.filter(item =>
    isActiveRuntimeQuestion(item.question) &&
    getStage(item.question) === "Initial Sounds" &&
    !isAllowedInitialSoundRuntimeFormat(item.question)
  );

  for (const item of activeOldInitialSounds) {
    addProblem(
      problems,
      "initial sounds old live format",
      item,
      `Active Initial Sounds question must use image/audio pair format: "${item.question.question || item.question.prompt}".`
    );
  }

  const appPagesSource = fs.readFileSync(path.join(rootDir, "src", "components", "AppPages.jsx"), "utf8");
  if (/allowBrowserFallback:\s*true|allowBrowserFallback:\s*!/.test(appPagesSource)) {
    problems.push({
      type: "assessment browser tts",
      file: "src/components/AppPages.jsx",
      id: "AssessmentPage",
      detail: "Teacher Assessment Mode must not enable browser TTS fallback."
    });
  }

  return { counts, problems, formatStats };
}

function printCounts(counts) {
  console.log("TOTAL QUESTIONS:", allQuestions.length);
  console.log("");

  for (const stage of skillTree) {
    const count = counts[stage.label] || 0;
    const status =
      count >= 40 ? "GOOD" :
      count >= 20 ? "OK" :
      count >= 10 ? "LOW" :
      "TOO LOW";

    console.log(`${status.padEnd(8)} ${String(count).padStart(3)}  ${stage.label}`);
  }

  console.log("");
  console.log("UNMATCHED:", counts.UNMATCHED || 0);
}

function printQuestionFormatStats(stats) {
  console.log("");
  console.log("QUESTION FORMAT FRAMEWORK:");
  console.log(`Explicitly tagged: ${stats.tagged}`);
  console.log(`Inferred for compatibility: ${stats.inferred}`);
  console.log(`Needs future explicit metadata migration: ${stats.missingExplicitMigration}`);
  console.log(`Visual-recognition-only: ${stats.visualRecognitionOnly}`);
  console.log(`Requires audio support: ${stats.requiresAudio}`);
  console.log(`Pattern-trap discrimination: ${stats.patternTrap}`);
  console.log(`Cross-pattern questions: ${stats.crossPattern}`);
  console.log("Format counts:");
  Object.entries(stats.formatTypes)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => console.log(`- ${type}: ${count}`));
}

function printActiveRuntimeQualityWarnings() {
  const removedLegacy = [];
  const removedPun = [];
  const removedPlural = [];
  const templateValidationRemoved = [];
  const activeTextOnlyBySkill = new Map();

  for (const item of allQuestions) {
    const question = item.question;
    const stage = getStage(question);
    const legacyReason = weakLegacyPhonicsReason(question);

    if (legacyReason) {
      removedLegacy.push({ stage, id: question.id, file: item.file, reason: legacyReason });
    }

    if (questionContainsWord(question, "pun")) {
      removedPun.push({ stage, id: question.id, file: item.file });
    }

    const pluralReason = lowQualityPluralDistractorReason(question);
    if (pluralReason) {
      removedPlural.push({ stage, id: question.id, file: item.file, reason: pluralReason });
    }

    const templateIssues = getAssessmentContentIssues(question, { assetExists: publicAssetExists })
      .filter(issue => /template|find-the-word|listen|answer options|correct answer|card audio|card images|target word|prompt/i.test(issue));
    if (templateIssues.length > 0) {
      templateValidationRemoved.push({ stage, id: question.id, file: item.file, reason: templateIssues.join("; ") });
    }

    if (isActiveRuntimeQuestion(question) && !question.imagePath && !question.audioPath && !question.imageCards?.length) {
      activeTextOnlyBySkill.set(stage, (activeTextOnlyBySkill.get(stage) || 0) + 1);
    }
  }

  console.log("");
  console.log("ACTIVE RUNTIME QUALITY WARNINGS:");
  console.log(`Removed legacy text-only phonics questions: ${removedLegacy.length}`);
  console.log(`Removed questions containing pun: ${removedPun.length}`);
  console.log(`Removed weak plural questions: ${removedPlural.length}`);
  console.log(`Malformed template questions excluded: ${templateValidationRemoved.length}`);
  console.log(`Remaining text-only active questions by skill: ${[...activeTextOnlyBySkill.entries()].map(([stage, count]) => `${stage}:${count}`).join(", ") || "none"}`);

  for (const item of removedLegacy.slice(0, 20)) {
    console.log(`- Removed ${item.id} (${item.stage}, ${item.file}): ${item.reason}`);
  }

  for (const item of templateValidationRemoved.slice(0, 20)) {
    console.log(`- Template excluded ${item.id} (${item.stage}, ${item.file}): ${item.reason}`);
  }
}

function printCoverageDiagnostics() {
  console.log("");
  console.log("COVERAGE DIAGNOSTICS:");

  for (const stage of skillTree.filter(item => coverageEnabledStages.has(item.label))) {
    const byKey = new Map();

    for (const item of allQuestions) {
      const question = item.question;
      if (!isActiveRuntimeQuestion(question)) continue;
      if (getStage(question) !== stage.label) continue;

      const metadata = inferCoverageMetadata(question, stage.label);
      if (!metadata?.itemKey || !metadata?.itemType) continue;

      byKey.set(metadata.itemKey, (byKey.get(metadata.itemKey) || 0) + 1);
    }

    const runtimeKeys = [...byKey.keys()].sort();
    const configured = coverageExpectations[stage.id];
    const expectedKeys = configured?.itemKeys || runtimeKeys;
    const missingKeys = expectedKeys.filter(key => !byKey.has(key));
    const expectedTotal = configured?.total || expectedKeys.length;

    console.log(`- ${stage.label}: expected ${expectedTotal} ${configured?.unit || "items"}, runtime unique ${runtimeKeys.length}`);
    console.log(`  itemKeys: ${runtimeKeys.join(", ") || "none"}`);
    console.log(`  missing: ${missingKeys.join(", ") || "none"}`);
    console.log(`  per itemKey: ${runtimeKeys.map(key => `${key}:${byKey.get(key)}`).join(", ") || "none"}`);

    if (configured?.note) {
      console.log(`  note: ${configured.note}`);
    }
  }
}

function printListenAndFindDiagnostics() {
  const diagnostics = allQuestions
    .map(item => getListenAndFindAssetDiagnostics(item.question))
    .filter(Boolean);
  const missingImages = diagnostics.filter(item => item.missingImages.length > 0 || item.missingChoiceAssets.length > 0);
  const missingAudio = diagnostics.filter(item => item.missingAudio);
  const badAudioText = diagnostics.filter(item => !item.usesSingleWordAudioText);

  console.log("");
  console.log("LISTEN & FIND WORD DIAGNOSTICS:");
  console.log(`Questions: ${diagnostics.length}`);
  console.log(`Missing option images: ${missingImages.length}`);
  console.log(`Missing static target mp3: ${missingAudio.length}`);
  console.log(`Not one-word audio text: ${badAudioText.length}`);

  for (const item of missingImages.slice(0, 20)) {
    console.log(`- Missing images ${item.question.id}: ${[...new Set([...item.missingImages, ...item.missingChoiceAssets])].join(", ")}`);
  }

  for (const item of missingAudio.slice(0, 20)) {
    console.log(`- Missing mp3 ${item.question.id}: ${item.question.answer}`);
  }
}

function printInitialSoundPairDiagnostics() {
  const diagnostics = allQuestions
    .map(item => getInitialSoundPairDiagnostics(item.question))
    .filter(Boolean);
  const activeInitialSoundQuestions = allQuestions
    .filter(item => isActiveRuntimeQuestion(item.question) && getStage(item.question) === "Initial Sounds");
  const activeOldFormat = activeInitialSoundQuestions
    .filter(item => !isAllowedInitialSoundRuntimeFormat(item.question));
  const supported = diagnostics.filter(item => item.supported);
  const unsupportedKeys = [...new Set(
    diagnostics
      .filter(item => !item.supported)
      .map(item => item.itemKey)
  )].sort();
  const missingImages = supported.filter(item => item.missingImages.length > 0);
  const missingAudio = supported.filter(item => item.missingAudio.length > 0);

  console.log("");
  console.log("INITIAL SOUNDS IMAGE/AUDIO PAIR DIAGNOSTICS:");
  console.log(`Initial sound questions: ${diagnostics.length}`);
  console.log(`Active live Initial Sounds questions: ${activeInitialSoundQuestions.length}`);
  console.log(`Active old text-choice Initial Sounds questions: ${activeOldFormat.length}`);
  console.log(`Image/audio pair format questions: ${supported.length}`);
  console.log(`Unsupported itemKeys without paired static assets: ${unsupportedKeys.join(", ") || "none"}`);
  console.log(`Pair questions missing images: ${missingImages.length}`);
  console.log(`Pair questions missing word mp3: ${missingAudio.length}`);

  for (const item of missingImages.slice(0, 20)) {
    console.log(`- Missing initial-pair images ${item.question.id}: ${item.missingImages.join(", ")}`);
  }

  for (const item of missingAudio.slice(0, 20)) {
    console.log(`- Missing initial-pair mp3 ${item.question.id}: ${item.missingAudio.join(", ")}`);
  }
}

function printProblems(problems) {
  const byType = new Map();

  for (const problem of problems) {
    byType.set(problem.type, (byType.get(problem.type) || 0) + 1);
  }

  console.log("");
  console.log("PROBLEMS FOUND:", problems.length);

  for (const [type, count] of byType) {
    console.log(`- ${type}: ${count}`);
  }

  console.log("");

  for (const problem of problems.slice(0, 200)) {
    console.log(
      `[${problem.type}] ${problem.file} ${problem.id}: ${problem.detail}`
    );
  }

  if (problems.length > 200) {
    console.log(`...and ${problems.length - 200} more`);
  }
}

function getStartEndSoundStrictIssues(question, stage) {
  const issues = [
    ...getEarlyPhonicsValidityIssues(question),
    ...getAudioPronunciationIssues(question)
  ];
  const format = String(question.templateType || question.formatType || "").toUpperCase();
  const choices = normalizedChoices(question.choices || []);
  const uniqueChoices = new Set(choices);
  const level = Number(question.level || question.difficulty || 1);
  const isValidFinalSoundWord =
    level >= 2 ? isValidFinalSoundWordForLevelTwo : isValidFinalSoundWordForEarlyLevel;

  if (uniqueChoices.size !== choices.length) {
    issues.push("answer options are not unique");
  }

  if (isPairSelectionQuestion(question)) {
    if ((question.correctAnswers || []).length !== 2) {
      issues.push("pair-select sound question must have exactly two correct answers");
    }
    if ((question.choices || []).length < 3) {
      issues.push("pair-select sound question needs at least three card choices");
    }
    if (!(question.imageCards || []).every(card => card.image && imagePathExists(card.image))) {
      issues.push("pair-select sound question has a missing card image");
    }
    if (!(question.imageCards || []).every(card => card.audio)) {
      issues.push("pair-select sound question has a missing card audio");
    }
    const key = normalize(question.itemKey || question.targetSound || "");
    const correctWords = (question.correctAnswers || []).map(normalize).filter(Boolean);
    const distractorWords = (question.choices || [])
      .map(normalize)
      .filter(word => word && !correctWords.includes(word));

    if (stage === "Initial Sounds") {
      const badCorrect = correctWords.filter(word => !isValidInitialSoundWordForEarlyLevel(word, key));
      const badDistractors = distractorWords.filter(word => isValidInitialSoundWordForEarlyLevel(word, key));
      if (badCorrect.length > 0) issues.push(`correct words do not match initial sound "${key}": ${badCorrect.join(", ")}`);
      if (badDistractors.length > 0) issues.push(`distractors also match initial sound "${key}": ${badDistractors.join(", ")}`);
    }

    if (stage === "Final Sounds") {
      const badCorrect = correctWords.filter(word => !isValidFinalSoundWord(word, key));
      const badDistractors = distractorWords.filter(word => isValidFinalSoundWord(word, key));
      if (badCorrect.length > 0) issues.push(`correct words do not match final sound "${key}": ${badCorrect.join(", ")}`);
      if (badDistractors.length > 0) issues.push(`distractors also match final sound "${key}": ${badDistractors.join(", ")}`);
    }
  } else {
    const answer = normalize(question.answer);
    const answerCount = choices.filter(choice => choice === answer).length;
    const targetWord = normalize(question.targetWord || question.audioText || question.imageKey || "");

    if (answerCount !== 1) {
      issues.push(`correct answer must appear exactly once, found ${answerCount}`);
    }
    if (!question.imagePath || !imagePathExists(question.imagePath)) {
      issues.push("single-target sound question has a missing target image");
    }
    if (/listen/i.test(question.question || question.prompt || "") && !question.audioPath) {
      issues.push("listen sound question has a missing target audio");
    }

    if (stage === "Initial Sounds") {
      if (!isValidInitialSoundWordForEarlyLevel(targetWord, answer)) {
        issues.push(`target word "${targetWord || "(missing)"}" does not match initial sound "${answer}"`);
      }
      const accidentalCorrectDistractors = choices.filter(choice => choice !== answer && choice === answer);
      if (accidentalCorrectDistractors.length > 0) {
        issues.push("distractors include another correct initial-sound answer");
      }
    }

    if (stage === "Final Sounds") {
      if (!isValidFinalSoundWord(targetWord, answer)) {
        issues.push(`target word "${targetWord || "(missing)"}" does not match final sound "${answer}"`);
      }
      const accidentalCorrectDistractors = choices.filter(choice => choice !== answer && choice === answer);
      if (accidentalCorrectDistractors.length > 0) {
        issues.push("distractors include another correct final-sound answer");
      }
    }
  }

  if (!["INITIAL_SOUND_PAIR_SELECT", "FINAL_SOUND_PAIR_SELECT", "FIRST_SOUND", "ENDING_SOUND"].includes(format)) {
    issues.push(`unsupported Start/Ending Sound runtime format: ${format || "(missing)"}`);
  }

  return [...new Set(issues)];
}

function buildStartEndSoundAudit() {
  const { canonical, duplicates } = getCanonicalRuntimeItems();
  const stages = ["Initial Sounds", "Final Sounds"];
  const problems = [];
  const reportRows = [];
  const disabledRows = [];
  const duplicateRows = duplicates
    .filter(row => stages.includes(getStage(row.duplicate.question)))
    .map(row => [
      getStage(row.duplicate.question),
      row.duplicate.question.id,
      row.duplicate.file,
      row.kept.question.id,
      row.kept.file,
      row.signature
    ]);

  for (const stage of stages) {
    const checked = allQuestions.filter(item => getStage(item.question) === stage);
    const rawActive = checked.filter(item => isActiveRuntimeQuestion(item.question));
    const active = canonical.filter(item => getStage(item.question) === stage);
    const uniqueTargets = new Set(active.map(item => getRepeatTargetWord(item.question)).filter(Boolean));
    const uniqueSignatures = new Set(active.map(item => getRuntimeQuestionSignature(item.question)).filter(Boolean));
    const uniqueIds = new Set(active.map(item => item.question.id).filter(Boolean));

    if (active.length < 25) {
      problems.push({
        type: `${stage.toLowerCase()} below 25 active questions`,
        file: "runtime canonical question pool",
        id: stage,
        detail: `${stage} has ${active.length} active canonical questions; at least 25 are required.`
      });
    }

    if (uniqueIds.size !== active.length) {
      problems.push({
        type: `${stage.toLowerCase()} duplicate active ids`,
        file: "runtime canonical question pool",
        id: stage,
        detail: `${stage} canonical active pool has duplicate IDs.`
      });
    }

    if (uniqueSignatures.size !== active.length) {
      problems.push({
        type: `${stage.toLowerCase()} duplicate active signatures`,
        file: "runtime canonical question pool",
        id: stage,
        detail: `${stage} canonical active pool has duplicate signatures.`
      });
    }

    for (const item of active) {
      const strictIssues = getStartEndSoundStrictIssues(item.question, stage);
      if (strictIssues.length > 0) {
        problems.push({
          type: `${stage.toLowerCase()} strict validation`,
          file: item.file,
          id: item.question.id,
          detail: strictIssues.join("; ")
        });
      }
    }

    for (const item of checked) {
      if (isActiveRuntimeQuestion(item.question)) continue;
      const contentIssues = [
        ...getAssessmentContentIssues(item.question, { assetExists: publicAssetExists }),
        weakLegacyPhonicsReason(item.question),
        questionContainsWord(item.question, "pun") ? "contains banned word pun" : ""
      ].filter(Boolean);
      if (contentIssues.length > 0) {
        disabledRows.push([
          stage,
          item.question.id || `index ${item.index}`,
          item.file,
          contentIssues.join("; ")
        ]);
      }
    }

    reportRows.push([
      stage,
      checked.length,
      rawActive.length,
      active.length,
      uniqueTargets.size,
      uniqueIds.size,
      uniqueSignatures.size,
      active.length >= 25 && uniqueIds.size === active.length && uniqueSignatures.size === active.length ? "PASS" : "FAIL"
    ]);
  }

  return { problems, reportRows, disabledRows, duplicateRows };
}

function writeStartEndSoundAudit(audit) {
  const markdownTable = (headers, rows) => {
    if (!rows.length) return "_None._";
    return [
      `| ${headers.join(" | ")} |`,
      `| ${headers.map(() => "---").join(" | ")} |`,
      ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
    ].join("\n");
  };
  const status = audit.problems.length === 0 ? "PASS" : "FAIL";
  const doc = [
    "# Start / Ending Sound Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Final status: **${status}**`,
    "",
    "This report is generated by `tools/auditQuestionBank.js`. Active counts use the same canonical repeat-signature dedupe rule as runtime selection, so duplicate-equivalent raw questions are not eligible to be served twice.",
    "",
    "## Coverage Summary",
    "",
    markdownTable(
      ["skill", "total checked", "raw active valid", "canonical active valid", "unique target words", "unique ids", "unique signatures", "status"],
      audit.reportRows
    ),
    "",
    "## Duplicate Raw Questions Disabled By Canonicalization",
    "",
    markdownTable(
      ["skill", "disabled duplicate id", "duplicate source", "kept id", "kept source", "signature"],
      audit.duplicateRows
    ),
    "",
    "## Disabled / Excluded Start And Ending Sound Questions",
    "",
    markdownTable(
      ["skill", "question id", "source", "reason"],
      audit.disabledRows.slice(0, 200)
    ),
    "",
    "## Strict Validation Problems",
    "",
    markdownTable(
      ["type", "question id", "source", "detail"],
      audit.problems.map(problem => [problem.type, problem.id, problem.file, problem.detail])
    ),
    "",
    "## Asset Request Notes",
    "",
    "No active Start/Ending Sound question is allowed to serve without its required target image and approved static audio. Missing media stays disabled and should be requested through `docs/assets/kimi_question_asset_request.md`.",
    ""
  ].join("\n");
  const docPath = path.join(rootDir, "docs", "validation", "start_end_sound_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, doc);
  return docPath;
}

function writeQuestionBankQualityAudit(problems) {
  const { canonical: active, duplicates: duplicateRuntimeItems } = getCanonicalRuntimeItems();
  const activeBySkill = new Map();
  const missingAssetRows = [];
  const rhymingRows = [];
  const invalidRows = [];

  for (const item of allQuestions) {
    const question = item.question;
    const stage = getStage(question);
    const contentIssues = getAssessmentContentIssues(question, { assetExists: publicAssetExists });

    if (!isActiveRuntimeQuestion(question) && contentIssues.length > 0) {
      invalidRows.push([
        question.id || `index ${item.index}`,
        stage,
        item.file,
        contentIssues.join("; ")
      ]);
    }

    if (contentIssues.some(issue => /image|audio|asset/i.test(issue))) {
      missingAssetRows.push([
        question.id || `index ${item.index}`,
        stage,
        question.targetWord || question.answer || "",
        contentIssues.filter(issue => /image|audio|asset/i.test(issue)).join("; ")
      ]);
    }

    if (normalize(question.skill).includes("rhym") || stage === "Rhyming") {
      const target = question.targetWord || String(question.question || "").match(/rhymes? with ([a-z]+)/i)?.[1] || "";
      const targetGroup = question.questionType === "rhyme_pair"
        ? question.itemKey || ""
        : getRhymeOptionMatches(target || question.answer, question.choices || []).targetGroup;
      const matches = question.questionType === "rhyme_pair"
        ? (question.choices || []).filter(choice => getRhymeGroup(choice) === targetGroup)
        : getRhymeOptionMatches(target || question.answer, question.choices || []).matches;
      rhymingRows.push([
        question.id || `index ${item.index}`,
        item.file,
        target || question.answer || "",
        targetGroup || "(unknown)",
        matches.join(", ") || "(none)",
        isActiveRuntimeQuestion(question) ? "active" : "excluded"
      ]);
    }

    if (!isActiveRuntimeQuestion(question)) continue;
    const row = activeBySkill.get(stage) || {
      total: 0,
      targetWords: new Set(),
      ids: new Set()
    };
    row.total += 1;
    row.ids.add(question.id);
    [
      question.targetWord,
      question.answer,
      ...(question.correctWords || []),
      ...(question.correctAnswers || [])
    ].filter(Boolean).forEach(word => row.targetWords.add(normalize(word)));
    activeBySkill.set(stage, row);
  }

  const markdownTable = (headers, rows) => {
    if (!rows.length) return "_None._";
    return [
      `| ${headers.join(" | ")} |`,
      `| ${headers.map(() => "---").join(" | ")} |`,
      ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
    ].join("\n");
  };

  const skillRows = [...activeBySkill.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([skill, row]) => [
      skill,
      row.total,
      row.targetWords.size,
      row.ids.size,
      row.total < 52 ? "below 52" : ""
    ]);

  const doc = [
    "# Question Bank Quality Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This report is generated by `tools/auditQuestionBank.js` and focuses on runtime-safe question quality: true answers, asset availability, duplicate risk, and rhyme validity.",
    "",
    "## Summary",
    "",
    `- Active valid runtime questions checked: ${active.length}`,
    `- Audit problems: ${problems.length}`,
    `- Invalid/excluded questions with content issues: ${invalidRows.length}`,
    `- Questions with missing asset-related issues: ${missingAssetRows.length}`,
    `- Duplicate-equivalent raw active candidates disabled by canonicalization: ${duplicateRuntimeItems.length}`,
    "",
    "## Active Runtime Counts",
    "",
    markdownTable(["skill", "active questions", "unique target words", "unique ids", "warning"], skillRows),
    "",
    "## Rhyming Validation Sample",
    "",
    "Rhyming uses explicit rhyme-group metadata, so pairs such as `sock`/`duck`, `seed`/`bed`, and `rain`/`pan` are rejected.",
    "",
    markdownTable(["question id", "source", "target", "rhyme group", "true rhyme options", "runtime status"], rhymingRows.slice(0, 80)),
    "",
    "## Invalid / Disabled Content",
    "",
    markdownTable(["question id", "skill", "source", "reason"], invalidRows.slice(0, 160)),
    "",
    "## Missing Assets",
    "",
    markdownTable(["question id", "skill", "word/answer", "missing asset issue"], missingAssetRows.slice(0, 160)),
    "",
    "## Remaining Kimi Asset Priorities",
    "",
    "- Mouse image and clean word audio if any active image/audio question should use `mouse`.",
    "- `ee` rhyme-family assets if `seed/feed/bead/weed/need` are promoted into active rhyming questions.",
    "- `ain` rhyme-family assets if `rain/train/chain/pain/gain` are promoted into active rhyming questions.",
    "- `ock` and `uck` rhyme-family assets should stay separate: `sock/rock/lock/dock` and `duck/truck/luck/muck`.",
    ""
  ].join("\n");

  const docPath = path.join(rootDir, "docs", "validation", "question_bank_quality_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, doc);
  return docPath;
}

const { counts, problems, formatStats } = auditQuestions();
const startEndAudit = buildStartEndSoundAudit();
problems.push(...startEndAudit.problems);

printCounts(counts);
printQuestionFormatStats(formatStats);
printActiveRuntimeQualityWarnings();
printCoverageDiagnostics();
printListenAndFindDiagnostics();
printInitialSoundPairDiagnostics();
printProblems(problems);
const startEndAuditPath = writeStartEndSoundAudit(startEndAudit);
const qualityAuditPath = writeQuestionBankQualityAudit(problems);
console.log(`Wrote start/end sound audit: ${path.relative(rootDir, startEndAuditPath)}`);
console.log(`Wrote question bank quality audit: ${path.relative(rootDir, qualityAuditPath)}`);

if (problems.length > 0) {
  process.exit(1);
}

console.log("Question bank audit passed.");
