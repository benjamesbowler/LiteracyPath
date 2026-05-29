import { getApprovedAudioPath } from "../data/audioPreferenceManifest.js";

export const SHORT_VOWEL_LISTEN_PROMPT = "Listen to the word. What vowel sound can you hear?";

const VOWEL_CHOICES = ["a", "e", "i", "o", "u"];

export function isGenericInstructionAudioPath(audioPath = "") {
  const value = String(audioPath || "").toLowerCase();
  return Boolean(value) && (
    value.includes("/phrases/listen-and-find") ||
    value.includes("/phrases/") ||
    value.includes("instruction") ||
    value.includes("prompt")
  );
}

export function isListenChooseVowelQuestion(question = {}) {
  const skillId = String(question?.skillId || question?.skill || question?.skillName || "").toLowerCase();
  const format = String(question?.formatType || question?.templateType || "").toUpperCase();
  return (
    (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination" || skillId.includes("short vowel")) &&
    format === "LISTEN_CHOOSE_VOWEL"
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

export function getTargetWordAudioPath(targetWord = "", fallbackPath = "") {
  const cleanTarget = String(targetWord || "").trim();
  if (!cleanTarget) return "";

  const approvedTargetPath = getApprovedAudioPath(cleanTarget, "");
  if (approvedTargetPath) return approvedTargetPath;

  if (!isGenericInstructionAudioPath(fallbackPath)) {
    return getApprovedAudioPath(cleanTarget, fallbackPath);
  }

  return "";
}

export function normalizeAssessmentAudioRoles(question = {}) {
  if (!question) return question;

  if (isListenChooseVowelQuestion(question)) {
    const targetWord = question.targetWord || question.audioText || question.word || "";
    const correctAnswer = normalizeVowelAnswer(
      question.correctAnswer || question.answer || question.shortVowel || question.targetSound || question.coverageTarget,
      targetWord
    );
    const audioPath = getTargetWordAudioPath(targetWord, question.audioPath || question.audioUrl || "");
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
    const targetAudioPath = getTargetWordAudioPath(targetWord, rawAudioPath);
    if (targetAudioPath) {
      return {
        ...question,
        audioUrl: targetAudioPath,
        audioPath: targetAudioPath,
        audioRole: question.audioRole || "target_word"
      };
    }
  }

  return question;
}
