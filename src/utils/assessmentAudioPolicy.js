import { V3_QUESTION_SOURCE } from "../data/v3/v3Registry.js";

export const SHORT_VOWEL_LISTEN_PROMPT = "Listen to the word. What vowel sound can you hear?";

const VOWEL_CHOICES = ["a", "e", "i", "o", "u"];

/** Only authored stimuli may be replayed. The scoring key is never a stimulus. */
export function getAssessmentStimulusAudioText(question = {}) {
  if (question?.suppressStimulusAudio) return "";
  return String(question?.audioText || question?.targetWord || "").trim();
}

export function hasAudioOnlyChoices(question = {}) {
  return question?.hideWrittenLabels === true && question?.evidenceModality === "audio";
}

const PRINT_RESPONSE_FORMATS = new Set([
  "HFW_SENTENCE_CLOZE", "HFW_AUDIO_FIND_WORD", "HFW_READ_FIND_WORD",
  "FIRST_SOUND", "ENDING_SOUND", "MISSING_VOWEL_CVC", "LISTEN_CHOOSE_VOWEL",
  "PICTURE_TO_PRINT_MATCH", "SHORT_VOWEL_WORD", "LISTEN_FIND_WORD",
  "HEARD_WORD_TO_PRINT_MINIMAL_PAIR", "BLEND_COMPLETE_WORD", "MPD",
  "DIGRAPH_COMPLETE_WORD", "LONG_VOWEL_SILENT_E_PATTERN", "SILENT_E_TRANSFORM",
  "LONG_VOWEL_TEAM_COMPLETE", "R_CONTROLLED_PATTERN", "PICTURE_AUDIO_TO_PATTERN"
]);
const PRINT_PHONICS_SKILLS = new Set([
  "cvc_short_vowels", "blends", "digraphs", "long_vowels", "long_vowels_silent_e",
  "vowel_teams", "r_controlled", "r_controlled_vowels"
]);

/** Spoken options must not perform the letter/word reading being assessed. */
export function allowsAssessmentChoiceAudio(question = {}) {
  if (hasAudioOnlyChoices(question)) return true;
  const skill = String(question.assessmentSkillId || question.skillId || "").toLowerCase();
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  if (skill.startsWith("hfw_")) return false;
  if (PRINT_RESPONSE_FORMATS.has(format)) return false;
  if (PRINT_PHONICS_SKILLS.has(skill) && ["CPS", "PTD"].includes(format)) return false;
  // Spoken comparisons (including Final Sounds), vocabulary, grammar and
  // comprehension retain their intended oral access. They do not claim that
  // hearing an option proves independent word reading.
  return true;
}

export function isGenericInstructionAudioPath(audioPath = "") {
  const value = String(audioPath || "").toLowerCase();
  return Boolean(value) && (
    value.includes("/phrases/listen-and-find")
    || value.includes("/phrases/")
    || value.includes("instruction")
    || value.includes("prompt")
  );
}

export function isListenChooseVowelQuestion(question = {}) {
  const skillId = String(question?.skillId || question?.skill || question?.skillName || "").toLowerCase();
  const format = String(question?.formatType || question?.templateType || "").toUpperCase();
  return (
    (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination" || skillId.includes("short vowel"))
    && format === "LISTEN_CHOOSE_VOWEL"
  );
}

export function inferShortVowelFromWord(word = "") {
  return String(word || "").toLowerCase().match(/[aeiou]/)?.[0] || "";
}

export function normalizeVowelAnswer(value = "", targetWord = "") {
  const normalized = String(value || "").toLowerCase().trim();
  const explicit = normalized.match(/(?:short[_ -]?)?([aeiou])/)?.[1] || "";
  return explicit || inferShortVowelFromWord(targetWord);
}

/**
 * Normalize semantic audio roles without loading the full production-audio
 * lookup. The assessment route resolves an exact LEDA clip when it renders;
 * a known non-generic target-word fallback can safely travel with the item.
 */
export function normalizeAssessmentAudioRoles(question = {}) {
  if (!question) return question;

  if (question.source === V3_QUESTION_SOURCE) {
    // Current authored contrasts are already validated. Legacy vowel helpers
    // must not rewrite their choices, prompts, images, or scoring key.
    const target = getAssessmentStimulusAudioText(question);
    const path = question.audioPath || question.audioUrl || "";
    return !target || isGenericInstructionAudioPath(path)
      ? { ...question, audioPath: "", audioUrl: "", audio: "" }
      : question;
  }

  if (isListenChooseVowelQuestion(question)) {
    const targetWord = question.targetWord || question.audioText || question.word || "";
    const correctAnswer = normalizeVowelAnswer(
      question.correctAnswer || question.answer || question.shortVowel || question.targetSound || question.coverageTarget,
      targetWord
    );
    const fallback = question.audioPath || question.audioUrl || "";
    const audioPath = isGenericInstructionAudioPath(fallback) ? "" : fallback;
    return {
      ...question,
      prompt: SHORT_VOWEL_LISTEN_PROMPT,
      question: SHORT_VOWEL_LISTEN_PROMPT,
      spokenPrompt: SHORT_VOWEL_LISTEN_PROMPT,
      audioText: targetWord,
      targetWord,
      correctAnswer,
      answer: correctAnswer,
      choices: VOWEL_CHOICES,
      answerOptions: VOWEL_CHOICES,
      imageKey: "",
      imageUrl: "",
      imagePath: "",
      image: "",
      targetImage: "",
      targetImagePath: "",
      targetImageUrl: "",
      audioUrl: audioPath,
      audioPath,
      audioRole: "target_word"
    };
  }

  const targetWord = question.targetWord || question.audioText || "";
  const rawAudioPath = question.audioPath || question.audioUrl || "";
  if (targetWord && isGenericInstructionAudioPath(rawAudioPath)) {
    return {
      ...question,
      audioUrl: "",
      audioPath: "",
      audioRole: question.audioRole || "target_word"
    };
  }

  return question;
}
