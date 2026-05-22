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
  blendAnchors,
  digraphAnchors,
  finalSoundAnchors,
  initialSoundAnchors,
  shortVowelAnchors
} from "../src/data/phonicsAnchors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const questionBanks = [
  ["src/questions.js", questions],
  ["src/data/masteryCoreQuestions.js", masteryCoreQuestions],
  ["src/data/masteryExtraQuestions.js", masteryExtraQuestions],
  ["src/data/initialSoundCoverageQuestions.js", initialSoundCoverageQuestions],
  ["src/data/finalSoundCoverageQuestions.js", finalSoundCoverageQuestions],
  ["src/data/rhymingCoverageQuestions.js", rhymingCoverageQuestions],
  ["src/data/cvcShortVowelExpansionQuestions.js", cvcShortVowelExpansionQuestions],
  ["src/data/contentExpansionPass3Questions.js", contentExpansionPass3Questions],
  ["src/data/templateQuestions.js", templateQuestions],
  ["src/data/templateExpansion.js", templateExpansion],
  ["src/data/templateExpansion2.js", templateExpansion2],
  ["src/data/templateExpansion3.js", templateExpansion3],
  ["src/data/templateExpansion4.js", templateExpansion4],
  ["src/data/templateExpansion5.js", templateExpansion5],
  ["src/data/templateExpansion6.js", templateExpansion6],
  ["src/data/templateExpansion7.js", templateExpansion7],
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

const earlyBoundaryPromptPattern =
  /\b(blend|blends|digraph|digraphs|two consonants?|consonants together|long vowel|silent e|magic e|vowel team|r-controlled)\b/i;

const cvcVowels = new Set(["a", "e", "i", "o", "u"]);

const approvedHomophonePairs = [
  ["road", "rode"],
  ["eight", "ate"],
  ["sea", "see"],
  ["right", "write"],
  ["stair", "stare"],
  ["steak", "stake"]
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
  return choices.map(choice => normalize(choice));
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
    return { itemType: "rhyming_family", itemKey: (anchor || answer).slice(-2) };
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
    "IMAGE_WORD_PATTERN_MATCH"
  ]).has(formatType);
  const usesNewShortVowelFormat = new Set([
    "LISTEN_CHOOSE_VOWEL",
    "PICTURE_TO_PRINT_MATCH",
    "MISSING_VOWEL_CVC"
  ]).has(formatType);

  if (visiblePhonemeNotationPattern.test(prompt)) {
    return 'Visible prompt contains phoneme slash notation: "' + prompt + '".';
  }

  const isListenAndFindWord = question.questionType === "listen_and_find_word";
  const isPairSelect = isPairSelectionQuestion(question);

  if (!permitsStaticWordAudio && !isListenAndFindWord && !isPairSelect && spoken && isolatedSpokenPhonemePattern.test(spoken.trim())) {
    return 'spokenPrompt/audioText uses an isolated phoneme or letter sound: "' + spoken + '".';
  }

  if (!permitsStaticWordAudio && !isListenAndFindWord && !isPairSelect && spoken && !naturalSentencePattern.test(spoken.trim())) {
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
    const anchor = finalSoundAnchors[answer.at(-1)];
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
  if (!question?.id || !question.skill || !(question.question || question.prompt) || !question.answer) return false;
  if (getStage(question) === "UNMATCHED") return false;
  if (!Array.isArray(question.choices) || question.choices.length < 2) return false;
  if (!isPairSelectionQuestion(question) && !question.choices.includes(question.answer)) return false;
  if (isPairSelectionQuestion(question) && !hasCompletePairSelectionAssets(question)) return false;
  if (isVisualCardChoiceQuestion(question) && !hasCompleteVisualQuestionAssets(question)) return false;
  if (isInitialSoundQuestion(question) && !hasCompleteInitialSoundPairAssets(question)) return false;
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

  const choices = normalizedChoices(question.choices);
  return new Set(choices).size === choices.length;
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
  const answer = normalize(question.answer);
  const questionText = normalize(question.question);

  if (!answer || answer.length < 3) return false;
  if (answerVisibleStopwords.has(answer)) return false;
  if (normalize(question.skill).includes("rhym")) return false;
  if (String(question.formatType || "").toUpperCase() === "LISTEN_FIND_WORD") return false;

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
    const ending = answer.slice(-2);
    return choices.filter(choice => choice.slice(-2) === ending).length > 1;
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

    if (!Array.isArray(question.choices)) {
      addProblem(problems, "choices not array", item, "Choices must be an array.");
      continue;
    }

    if (question.choices.length < 2) {
      addProblem(problems, "too few choices", item, "Question has fewer than two choices.");
    }

    const choices = normalizedChoices(question.choices);
    const uniqueChoices = new Set(choices);

    if (uniqueChoices.size !== choices.length) {
      addProblem(problems, "duplicate answer choices", item, question.choices.join(" | "));
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
    !isInitialSoundPairQuestion(item.question)
  );

  for (const item of activeOldInitialSounds) {
    addProblem(
      problems,
      "initial sounds old live format",
      item,
      `Active Initial Sounds question must use image/audio pair format: "${item.question.question || item.question.prompt}".`
    );
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
    .filter(item => !isInitialSoundPairQuestion(item.question));
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

const { counts, problems, formatStats } = auditQuestions();

printCounts(counts);
printQuestionFormatStats(formatStats);
printCoverageDiagnostics();
printListenAndFindDiagnostics();
printInitialSoundPairDiagnostics();
printProblems(problems);

if (problems.length > 0) {
  process.exit(1);
}

console.log("Question bank audit passed.");
