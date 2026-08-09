export const SHORT_VOWEL_LISTEN_PROMPT = "Listen to the word. What vowel sound can you hear?";

const VOWEL_CHOICES = ["a", "e", "i", "o", "u"];

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
