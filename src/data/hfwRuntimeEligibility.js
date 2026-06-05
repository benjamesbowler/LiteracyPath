import {
  getApprovedAudioPath,
  getAudioPreferenceStatus
} from "./audioPreferenceManifest.js";
import {
  ALL_HFW_WORD_SET,
  getHfwBandSet,
  isHighFrequencyWordSkill,
  normalizeHfwSkillId
} from "./highFrequencyWordBands.js";
import {
  HFW_ALLOWED_FORMATS as HFW_ALLOWED_FORMAT_LIST,
  getHfwDirectAnswerLeakageIssues,
  isHfwClozeFormat,
  isHfwDirectRecognitionFormat,
  isHfwSentenceSpellFormat
} from "./hfwAssessmentFormatConfig.js";
import {
  getHfwFillerPhraseHits,
  getMultiplePlausibleHfwAnswerIssues,
  getWeakGenericHfwPromptIssues
} from "./hfwQualityRules.js";
import {
  hfwQuestionReviewBlockedIds
} from "./generated/hfwQuestionReviewBlocklist.generated.js";
import {
  hfwCuratedSentenceContentKeys,
  hfwCuratedSentenceIds,
  hfwCuratedSentenceTextKeys
} from "./generated/hfwCuratedSentences.generated.js";

const HFW_ALLOWED_FORMATS = new Set(HFW_ALLOWED_FORMAT_LIST);

const HFW_BLOCKED_FORMATS = new Set([
  "SHORT_VOWEL_WORD",
  "LISTEN_CHOOSE_VOWEL",
  "PICTURE_TO_PRINT_MATCH",
  "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
  "MISSING_VOWEL_CVC",
  "COMPLETE_WORD",
  "FIRST_SOUND",
  "ENDING_SOUND",
  "INITIAL_SOUND_PAIR_SELECT",
  "FINAL_SOUND_PAIR_SELECT",
  "RHYMING_PICTURE",
  "READ_FIND_RHYME",
  "LISTEN_FIND_RHYME",
  "PICTURE_AUDIO_TO_PATTERN",
  "IMAGE_WORD_PATTERN_MATCH",
  "BLEND_SOUNDS",
  "DECODING",
  "VOCABULARY_CATEGORY",
  "PLURAL_IMAGE_SPELLING"
]);

const PHONICS_PROMPT_PATTERN =
  /\b(short [aeiou]|short vowel|cvc|rhym|rime|beginning sound|initial sound|first sound|starts? with|ending sound|final sound|ends? with|blend|digraph|silent e|vowel team|r-controlled|matches the picture|which word has the short)\b/i;
const WEAK_HFW_PROMPT_PATTERN =
  /\b(find the word|tap the word|which word says|which word is|find word)\s*:?\s*["“”']?[a-z]+\b/i;
const AMBIGUOUS_ARTICLE_CHOICE_PAIRS = [
  ["the", "a"],
  ["the", "an"],
  ["a", "an"]
];

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getFormat(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function getPromptText(question = {}) {
  return [question.prompt, question.question, question.spokenPrompt, question.passage, question.sentence, question.context]
    .filter(Boolean)
    .join(" ");
}

function getVisibleQuestionPromptText(question = {}) {
  return [question.prompt, question.question, question.spokenPrompt]
    .filter(Boolean)
    .join(" ");
}

function getQuestionWords(question = {}) {
  return [
    question.itemKey,
    question.targetWord,
    question.audioText,
    question.answer,
    question.correctAnswer,
    ...(Array.isArray(question.correctAnswers) ? question.correctAnswers : [])
  ].map(normalizeWord).filter(Boolean);
}

function getRawOptions(question = {}) {
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  if (Array.isArray(question.options) && question.options.length) return question.options;
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  return [];
}

function getOptionWords(question = {}) {
  return getRawOptions(question)
    .map(option => {
      if (option && typeof option === "object") {
        return option.value || option.word || option.label || option.text || option.answer || "";
      }
      return option;
    })
    .map(normalizeWord)
    .filter(Boolean);
}

function getOptionValues(question = {}) {
  return getRawOptions(question)
    .map(option => {
      if (option && typeof option === "object") {
        return option.value || option.word || option.label || option.text || option.answer || "";
      }
      return option;
    })
    .map(value => String(value || "").trim())
    .filter(Boolean);
}

function curatedTextKey(question = {}, primaryWord = "") {
  const visibleSentence = String(question.visibleSentenceWithBlank || question.sentence || question.passage || question.context || "");
  const fullSentence = String(question.sentenceText || question.fullSentence || question.spokenPrompt || question.audioText || "");
  return [normalizeHfwSkillId(getQuestionSkillText(question)), primaryWord, visibleSentence, fullSentence].join("::").toLowerCase();
}

function getCuratedSourceIssues(question = {}, primaryWord = "") {
  const issues = [];
  const source = String(question.source || question.approvedSource || "").toLowerCase();
  if (!/(workbook|curated)/.test(source)) issues.push("HFW sentence question source is not workbook/curated");
  if (!question.sentenceId) issues.push("HFW sentence question missing sentenceId");
  if (question.sentenceId && !hfwCuratedSentenceIds.has(question.sentenceId)) {
    issues.push(`sentenceId ${question.sentenceId} is not in curated workbook sentence bank`);
  }
  if (question.curatedContentKey && !hfwCuratedSentenceContentKeys.has(question.curatedContentKey)) {
    issues.push("curatedContentKey is not in curated workbook sentence bank");
  }
  if (!hfwCuratedSentenceTextKeys.has(curatedTextKey(question, primaryWord))) {
    issues.push("sentence text does not match curated workbook sentence bank");
  }
  return issues;
}

function getQuestionSkillText(question = {}) {
  return [question.skillId, question.skillName, question.skill, question.stage].filter(Boolean).join(" ");
}

export function getHfwRuntimeEligibilityIssues(question = {}, skillId = "") {
  const options = typeof arguments[2] === "object" ? arguments[2] : {};
  const bandId = normalizeHfwSkillId(skillId || getQuestionSkillText(question));
  if (!bandId) return ["not an HFW skill band"];

  const issues = [];
  const bandSet = getHfwBandSet(bandId);
  const format = getFormat(question);
  const itemType = String(question.itemType || question.type || "").toLowerCase();
  const promptText = getPromptText(question);
  const visiblePromptText = getVisibleQuestionPromptText(question);
  const questionWords = getQuestionWords(question);
  const optionWords = getOptionWords(question);
  const optionValues = getOptionValues(question);
  const primaryWord = questionWords.find(word => bandSet?.has(word)) || questionWords[0] || "";
  const declaredQuestionBand = normalizeHfwSkillId(getQuestionSkillText(question));
  const promptWords = normalizeWord(visiblePromptText).split(/\s+/).filter(Boolean);
  const answer = normalizeWord(question.correctAnswer || question.answer || "");
  const sentence = String(question.sentence || question.passage || question.context || "");
  const pathExists = typeof options.pathExists === "function" ? options.pathExists : null;
  const audioPath = question.audioPath || question.audioUrl || question.audio || "";
  const imagePath = question.imagePath || question.imageUrl || question.image || "";
  const letterTiles = Array.isArray(question.letterTiles) && question.letterTiles.length
    ? question.letterTiles
    : question.soundTiles;

  if (declaredQuestionBand && declaredQuestionBand !== bandId) {
    issues.push(`belongs to ${declaredQuestionBand}, not ${bandId}`);
  }
  if (hfwQuestionReviewBlockedIds.has(String(question.id || ""))) {
    issues.push("blocked by HFW teacher review");
  }
  if (HFW_BLOCKED_FORMATS.has(format)) issues.push(`${format} is not an HFW-safe template`);
  if (!HFW_ALLOWED_FORMATS.has(format)) issues.push(`${format} is not in the HFW allowlist`);
  if (PHONICS_PROMPT_PATTERN.test(promptText)) issues.push("prompt is phonics/picture-matching, not HFW recognition");
  if (WEAK_HFW_PROMPT_PATTERN.test(visiblePromptText)) issues.push("direct answer-leaking HFW prompt is blocked");
  for (const leakageIssue of getHfwDirectAnswerLeakageIssues(question)) issues.push(leakageIssue);
  if (itemType && itemType !== "sight_word") issues.push(`itemType is ${itemType}, not sight_word`);
  if (!primaryWord) {
    issues.push("missing target HFW word");
  } else if (!bandSet?.has(primaryWord)) {
    issues.push(`target word "${primaryWord}" is outside ${bandId}`);
  }
  if (!isHfwSentenceSpellFormat(format) && format !== "HFW_LETTER_BUILD" && optionValues.length !== 4) {
    issues.push(`HFW live questions require exactly 4 answer options, found ${optionValues.length}`);
  }
  if (isHfwDirectRecognitionFormat(format) || isHfwClozeFormat(format)) {
    const nonHfwOptions = optionWords.filter(word => !ALL_HFW_WORD_SET.has(word));
    if (nonHfwOptions.length) {
      issues.push(`non-HFW answer options: ${[...new Set(nonHfwOptions)].join(", ")}`);
    }
  }

  if (isHfwDirectRecognitionFormat(format)) {
    if (answer && answer !== primaryWord) issues.push(`correct answer "${answer}" does not match target word "${primaryWord}"`);
    if (audioPath) issues.push("direct-recognition HFW questions must not include audio");
    if (!imagePath) {
      issues.push("direct-recognition HFW question needs a context image");
    } else if (pathExists && !pathExists(imagePath)) {
      issues.push(`image file does not exist: ${imagePath}`);
    }
  }

  if (["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD"].includes(format)) {
    const approvedAudioPath = getApprovedAudioPath(primaryWord, audioPath);
    if (!audioPath) {
      issues.push("audio-led HFW recognition needs target audio");
    } else if (!approvedAudioPath) {
      issues.push(`audio-led HFW recognition needs approved exact-word audio; status is ${getAudioPreferenceStatus(primaryWord, audioPath)}`);
    } else if (pathExists && !pathExists(approvedAudioPath)) {
      issues.push(`audio file does not exist: ${approvedAudioPath}`);
    }
    if (primaryWord && promptWords.includes(primaryWord)) {
      issues.push("audio-led HFW recognition prints the target word in the prompt");
    }
  }

  if (isHfwClozeFormat(format)) {
    for (const issue of getCuratedSourceIssues(question, primaryWord)) issues.push(issue);
    const blankCount = (sentence.match(/___/g) || []).length;
    if (blankCount !== 1) issues.push(`sentence cloze needs exactly one blank, found ${blankCount}`);
    if (answer && answer !== primaryWord) issues.push(`correct answer "${answer}" does not match target word "${primaryWord}"`);
    for (const issue of getWeakGenericHfwPromptIssues(question)) issues.push(issue);
    for (const issue of getMultiplePlausibleHfwAnswerIssues(question)) issues.push(issue);
    const optionSet = new Set(optionWords);
    for (const [first, second] of AMBIGUOUS_ARTICLE_CHOICE_PAIRS) {
      if (optionSet.has(first) && optionSet.has(second)) {
        issues.push(`ambiguous article choices include both "${first}" and "${second}"`);
      }
    }
  }

  if (isHfwSentenceSpellFormat(format)) {
    const targetLetters = primaryWord.split("");
    const tileLetters = (letterTiles || []).map(value => String(value || "").toLowerCase());
    const correctLetterSequence = Array.isArray(question.correctLetterSequence)
      ? question.correctLetterSequence.map(value => String(value || "").toLowerCase())
      : [];
    const visibleSentence = String(question.visibleSentenceWithBlank || question.sentence || question.passage || question.context || "");
    const fullSentence = String(question.sentenceText || question.fullSentence || question.spokenPrompt || question.audioText || "");
    for (const issue of getCuratedSourceIssues(question, primaryWord)) issues.push(issue);
    const blankCount = (visibleSentence.match(/___/g) || []).length;
    if (blankCount !== 1) issues.push(`sentence-spell needs exactly one visible blank, found ${blankCount}`);
    for (const phrase of getHfwFillerPhraseHits(visibleSentence)) {
      issues.push(`filler_phrase_reuse:${phrase}`);
    }
    if (!fullSentence || !normalizeWord(fullSentence).split(/\s+/).includes(primaryWord)) {
      issues.push(`sentence-spell audio text must include target word "${primaryWord}"`);
    }
    if (correctLetterSequence.join("") !== primaryWord) {
      issues.push(`correctLetterSequence does not spell "${primaryWord}"`);
    }
    if (!Array.isArray(letterTiles) || letterTiles.length !== 12) {
      issues.push(`sentence-spell HFW questions need exactly 12 letter tiles, found ${letterTiles?.length || 0}`);
    }
    const available = tileLetters.reduce((counts, letter) => ({
      ...counts,
      [letter]: (counts[letter] || 0) + 1
    }), {});
    for (const letter of targetLetters) {
      if (!available[letter]) {
        issues.push(`sentence-spell tiles are missing "${letter}" for "${primaryWord}"`);
        break;
      }
      available[letter] -= 1;
    }
    if (!question.sentenceAudio && !question.spokenPrompt && !question.audioText) {
      issues.push("sentence-spell needs sentence audio text");
    }
    if (!imagePath) {
      issues.push("sentence-spell HFW question needs a context image");
    } else if (pathExists && !pathExists(imagePath)) {
      issues.push(`image file does not exist: ${imagePath}`);
    }
  }

  if (format === "HFW_SENTENCE_PLACEMENT") {
    if (!answer) issues.push("sentence placement missing correct sentence");
    const correctMatches = optionValues.filter(option => normalizeWord(option) === answer).length;
    if (correctMatches !== 1) issues.push(`sentence placement needs exactly one correct sentence option, found ${correctMatches}`);
    if (primaryWord && !normalizeWord(answer).split(/\s+/).includes(primaryWord)) {
      issues.push(`sentence placement correct sentence does not use target word "${primaryWord}"`);
    }
  }

  if (isHfwClozeFormat(format)) {
    if (!imagePath) {
      issues.push("image-context HFW question needs a context image");
    } else if (pathExists && !pathExists(imagePath)) {
      issues.push(`image file does not exist: ${imagePath}`);
    }
  }
  if (format === "HFW_LETTER_BUILD") {
    const targetLetters = primaryWord.split("");
    const tileLetters = (letterTiles || []).map(value => String(value || "").toLowerCase());
    if (!Array.isArray(letterTiles) || letterTiles.length !== 12) {
      issues.push(`letter-build HFW questions need exactly 12 letter tiles, found ${letterTiles?.length || 0}`);
    }
    const available = tileLetters.reduce((counts, letter) => ({
      ...counts,
      [letter]: (counts[letter] || 0) + 1
    }), {});
    for (const letter of targetLetters) {
      if (!available[letter]) {
        issues.push(`letter-build tiles are missing "${letter}" for "${primaryWord}"`);
        break;
      }
      available[letter] -= 1;
    }
    if (audioPath) issues.push("letter-build HFW questions must not include audio");
    if (!imagePath) {
      issues.push("letter-build HFW question needs a context image");
    } else if (pathExists && !pathExists(imagePath)) {
      issues.push(`image file does not exist: ${imagePath}`);
    }
  }
  if (format === "PICTURE_TO_PRINT_MATCH" && !question.hfwRecognition) {
    issues.push("picture-match format is not allowed for HFW unless explicitly marked hfwRecognition");
  }

  return [...new Set(issues)];
}

export function isRuntimeEligibleHfwQuestion(question = {}, skillId = "") {
  return isHighFrequencyWordSkill(skillId || getQuestionSkillText(question)) &&
    getHfwRuntimeEligibilityIssues(question, skillId).length === 0;
}

export { HFW_ALLOWED_FORMATS, HFW_BLOCKED_FORMATS };
