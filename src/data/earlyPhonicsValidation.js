import { getApprovedAudioPath } from "./audioPreferenceManifest.js";
import { initialSoundExpectedItemKeys, finalSoundExpectedItemKeys } from "./coverageExpectations.js";

const INITIAL_DIGRAPHS = ["sh", "ch", "th", "wh", "ph", "ck"];
const INITIAL_CLUSTERS = [
  "bl", "cl", "fl", "gl", "pl", "sl",
  "br", "cr", "dr", "fr", "gr", "pr", "tr",
  "sc", "sk", "sm", "sn", "sp", "st", "sw", "tw"
];
const AMBIGUOUS_INITIAL_WORDS = new Set([
  "city",
  "cello",
  "cent",
  "giraffe",
  "giant",
  "xylophone",
  "xray",
  "x-ray",
  "unicorn"
]);
const ALLOWED_Q_WORDS = new Set(["queen", "quilt", "quiz", "quick"]);

const INVALID_FINAL_ENDINGS = [
  "ck", "sh", "ch", "th", "ng",
  "nd", "st", "mp", "sk", "nt", "lk", "rk", "rn", "rm", "rd", "ft", "pt", "lt", "ld"
];
const AMBIGUOUS_FINAL_WORDS = new Set([
  "thumb",
  "lamb",
  "comb",
  "knife",
  "kite",
  "gate",
  "cake",
  "snake",
  "vase"
]);
const VOWEL_TEAM_FINAL_WORDS = new Set(["book", "feet", "seed", "seal", "boat", "coat", "rain", "leaf"]);
const R_CONTROLLED_FINAL_WORDS = new Set(["car", "fork", "park", "star", "farm", "worm", "bird", "corn"]);
const LEVEL_TWO_FINAL_PATTERNS = [
  "sh", "ch", "th", "ck", "ng",
  "nd", "nt", "st", "mp", "nk", "lt", "ft", "sk", "rk",
  "b", "d", "f", "g", "l", "m", "n", "p", "r", "s", "t"
];
const LEVEL_TWO_FINAL_OVERRIDES = new Map([
  ["whale", "l"],
  ["thumb", "m"]
]);

const WORD_LISTENING_FORMATS = new Set([
  "FIRST_SOUND",
  "ENDING_SOUND",
  "LISTEN_FIND_WORD",
  "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
  "PICTURE_AUDIO_TO_PATTERN",
  "BLEND_SOUNDS",
  "SHORT_VOWEL_WORD",
  "PUT_SOUNDS_IN_ORDER",
  "COMPLETE_WORD"
]);

const WORD_AUDIO_QUESTION_TYPES = new Set([
  "listen_and_find_word"
]);

const LETTER_OR_SPELLING_AUDIO_PATH_PATTERN =
  /\/(?:letters?|letter-sounds?|sounds?|phonemes?|spelling|choices)\//i;
const SEGMENTED_SPEECH_PATTERN =
  /^(?:[a-z]|sh|ch|th|wh|ck|ng)(?:[\s-]+(?:[a-z]|sh|ch|th|wh|ck|ng)){1,}$/i;

export function normalizePhonicsText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedWord(value) {
  return normalizePhonicsText(value).replace(/[^a-z]/g, "");
}

function formatType(question = {}) {
  return String(question.templateType || question.formatType || "").toUpperCase();
}

function targetWord(question = {}) {
  return normalizedWord(
    question.targetWord ||
    question.audioText ||
    question.imageKey ||
    question.answer ||
    question.correctAnswer ||
    ""
  );
}

function itemKey(question = {}) {
  return normalizedWord(question.itemKey || question.targetSound || question.phonicsPattern || question.targetPattern || question.answer);
}

function startsWithAny(word, patterns) {
  return patterns.some(pattern => word.startsWith(pattern));
}

function endsWithAny(word, patterns) {
  return patterns.some(pattern => word.endsWith(pattern));
}

function simpleInitialLetter(word) {
  return word[0] || "";
}

function simpleFinalLetter(word) {
  return word.at(-1) || "";
}

function isInitialSoundQuestion(question = {}) {
  const stage = normalizePhonicsText(question.skill || question.skillName);
  return question.itemType === "initial_sound" ||
    question.skillId === "initial_sounds" ||
    stage.includes("initial sounds") ||
    formatType(question) === "FIRST_SOUND";
}

function isFinalSoundQuestion(question = {}) {
  const stage = normalizePhonicsText(question.skill || question.skillName);
  return question.itemType === "final_sound" ||
    question.skillId === "final_sounds" ||
    stage.includes("final sounds") ||
    formatType(question) === "ENDING_SOUND";
}

function cardWords(question = {}) {
  if (Array.isArray(question.correctWords) && question.correctWords.length > 0) {
    return question.correctWords.map(normalizedWord).filter(Boolean);
  }
  if (Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0) {
    return question.correctAnswers.map(normalizedWord).filter(Boolean);
  }
  if (Array.isArray(question.imageCards) && question.imageCards.length > 0) {
    return question.imageCards.map(card => normalizedWord(card.word || card.value || card.id)).filter(Boolean);
  }
  return [targetWord(question)].filter(Boolean);
}

export function isValidInitialSoundWordForEarlyLevel(wordValue, keyValue) {
  const word = normalizedWord(wordValue);
  const key = normalizedWord(keyValue);

  if (!word || !key) return false;
  if (!initialSoundExpectedItemKeys.includes(key)) return false;
  if (key === "x") return false;
  if (key === "q") return ALLOWED_Q_WORDS.has(word);
  if (AMBIGUOUS_INITIAL_WORDS.has(word)) return false;
  if (startsWithAny(word, INITIAL_DIGRAPHS)) return false;
  if (startsWithAny(word, INITIAL_CLUSTERS)) return false;
  return simpleInitialLetter(word) === key;
}

export function isValidFinalSoundWordForEarlyLevel(wordValue, keyValue) {
  const word = normalizedWord(wordValue);
  const key = normalizedWord(keyValue);

  if (!word || !key) return false;
  if (!finalSoundExpectedItemKeys.includes(key)) return false;
  if (key.length !== 1 || key === "x") return false;
  if (AMBIGUOUS_FINAL_WORDS.has(word)) return false;
  if (VOWEL_TEAM_FINAL_WORDS.has(word) || R_CONTROLLED_FINAL_WORDS.has(word)) return false;
  if (word.length > 2 && word.endsWith("e")) return false;
  if (endsWithAny(word, INVALID_FINAL_ENDINGS)) return false;
  if (word.endsWith("s") && word.length > 3) return false;
  return simpleFinalLetter(word) === key;
}

export function isValidFinalSoundWordForLevelTwo(wordValue, keyValue) {
  const word = normalizedWord(wordValue);
  const key = normalizedWord(keyValue);

  if (!word || !key) return false;
  if (!LEVEL_TWO_FINAL_PATTERNS.includes(key)) return false;
  if (LEVEL_TWO_FINAL_OVERRIDES.get(word) === key) return true;
  if (key.length > 1) return word.endsWith(key);
  if (key === "f" && word.endsWith("ph")) return true;
  if (word.endsWith("e") && !["l", "r"].includes(key)) return false;
  return simpleFinalLetter(word) === key;
}

export function isSegmentedAudioText(value) {
  const text = normalizePhonicsText(value);
  return Boolean(text && SEGMENTED_SPEECH_PATTERN.test(text));
}

export function getAudioPronunciationIssues(question = {}) {
  const issues = [];
  const type = formatType(question);
  const listensToWord =
    WORD_LISTENING_FORMATS.has(type) ||
    WORD_AUDIO_QUESTION_TYPES.has(String(question.questionType || "")) ||
    /\blisten to the word\b/i.test(String(question.prompt || question.question || ""));

  if (!listensToWord) return issues;

  const word = targetWord(question);
  const audioText = normalizePhonicsText(question.audioText || "");
  const audioKey = normalizePhonicsText(question.audioKey || "");
  const audioPath = String(question.audioPath || question.audioUrl || "");
  const approvedAudio = getApprovedAudioPath(word || audioText, audioPath);

  if (!word) {
    issues.push("word-listening format is missing targetWord");
  }
  if (audioText && word && normalizedWord(audioText) !== word) {
    issues.push(`audioText must speak the whole target word "${word}", not "${question.audioText}"`);
  }
  if (audioText && isSegmentedAudioText(audioText)) {
    issues.push(`audioText appears segmented/spelling-style: "${question.audioText}"`);
  }
  if (audioKey && word && normalizedWord(audioKey) !== word && audioKey !== "listen-and-find") {
    issues.push(`audioKey must point to whole-word audio for "${word}", not "${question.audioKey}"`);
  }
  if (LETTER_OR_SPELLING_AUDIO_PATH_PATTERN.test(audioPath)) {
    issues.push(`audioPath appears to point to letter/sound/spelling audio: ${audioPath}`);
  }
  if (word && !approvedAudio) {
    issues.push(`missing approved whole-word audio for "${word}"`);
  }

  return issues;
}

export function getEarlyPhonicsValidityIssues(question = {}) {
  const issues = [];

  if (isInitialSoundQuestion(question)) {
    const key = itemKey(question);
    if (!initialSoundExpectedItemKeys.includes(key)) {
      issues.push(`Initial Sounds itemKey "${key || "(missing)"}" is outside configured 25-target early set`);
    }

    for (const word of cardWords(question)) {
      if (word && !isValidInitialSoundWordForEarlyLevel(word, key)) {
        issues.push(`Initial Sounds word "${word}" is not valid for early itemKey "${key}"`);
      }
    }
  }

  if (isFinalSoundQuestion(question)) {
    const key = itemKey(question);
    const level = Number(question.level || question.difficulty || 1) || 1;
    const validKey = level >= 2
      ? LEVEL_TWO_FINAL_PATTERNS.includes(key)
      : finalSoundExpectedItemKeys.includes(key);
    if (!validKey) {
      issues.push(`Final Sounds itemKey "${key || "(missing)"}" is outside configured Level ${level} final-sound set`);
    }

    for (const word of cardWords(question)) {
      const validWord = level >= 2
        ? isValidFinalSoundWordForLevelTwo(word, key)
        : isValidFinalSoundWordForEarlyLevel(word, key);
      if (word && !validWord) {
        issues.push(`Final Sounds word "${word}" is not valid for Level ${level} itemKey "${key}"`);
      }
    }
  }

  return issues;
}

export function getEarlyPhonicsAndAudioIssues(question = {}) {
  return [
    ...getAudioPronunciationIssues(question),
    ...getEarlyPhonicsValidityIssues(question)
  ];
}
