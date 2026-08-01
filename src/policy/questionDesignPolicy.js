export const QUESTION_DESIGN_POLICY_VERSION = "2026-08-01.1";

export const QUESTION_DESIGN_AGE_BANDS = Object.freeze({
  A: Object.freeze({ ages: "4–6", promptWords: 12 }),
  B: Object.freeze({ ages: "6–8", promptWords: 16 }),
  C: Object.freeze({ ages: "8–10", promptWords: 24 }),
  D: Object.freeze({ ages: "10–12", promptWords: 30 })
});

const BANNED_OPTIONS = new Set([
  "all of the above",
  "none of the above",
  "both a and b",
  "both b and c"
]);

function optionText(option) {
  if (option == null) return "";
  if (typeof option === "string" || typeof option === "number") return String(option);
  return String(option.value ?? option.answer ?? option.label ?? option.text ?? option.word ?? "");
}

export function normalizeQuestionText(value = "") {
  const raw = String(value).normalize("NFKC").trim();
  const normalized = raw
    .toLocaleLowerCase("en")
    .replace(/[\s\p{P}]+/gu, " ")
    .trim();
  return normalized || raw.toLocaleLowerCase("en");
}

export function questionPrompt(question = {}) {
  return String(question.prompt ?? question.question ?? question.instruction ?? "").trim();
}

export function questionChoices(question = {}) {
  const choices = question.choices ?? question.options ?? question.answerOptions ?? [];
  return Array.isArray(choices) ? choices.map(optionText).filter(Boolean) : [];
}

export function questionAnswer(question = {}) {
  return optionText(question.answer ?? question.correctAnswer ?? question.correct ?? "");
}

export function questionVisualPaths(question = {}) {
  const direct = [
    question.image,
    question.imageUrl,
    question.imagePath,
    question.targetImage,
    question.targetImagePath,
    question.cover
  ];
  const groups = [question.imageCards, question.sequenceCards, question.answerOptions];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const item of group) {
      if (!item || typeof item !== "object") continue;
      direct.push(item.image, item.imageUrl, item.imagePath, item.cover);
    }
  }
  return [...new Set(direct.filter(Boolean).map(String))];
}

export function hasQuestionSpokenAccess(question = {}, context = {}) {
  return Boolean(
    context.hasSurfaceSpeaker
    || question.spokenPrompt
    || question.audioText
    || question.speechFallback
    || question.say
    || question.audio
    || question.audioUrl
  );
}

export function hasMeaningfulQuestionVisual(question = {}, context = {}) {
  return Boolean(context.hasContextVisual || questionVisualPaths(question).length);
}

function wordCount(value = "") {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function hasNegativeStem(prompt = "") {
  return /\b(?:which|what|who|choose|tap|find|select)\b[^?.!]*\b(?:does|do|did|is|are|was|were|can|could|should|would)\s+not\b/i.test(prompt)
    || /\b(?:which|what|who|choose|tap|find|select)\b[^?.!]*\b(?:except|never|least)\b/i.test(prompt);
}

function hasEmphasizedNegative(prompt = "") {
  return /\b(?:NOT|EXCEPT|NEVER|LEAST)\b/.test(prompt);
}

function rationaleKeys(question = {}) {
  const rationales = question.distractorRationales;
  if (!rationales || typeof rationales !== "object") return new Set();
  if (Array.isArray(rationales)) {
    return new Set(rationales.map(item => normalizeQuestionText(item?.choice ?? item?.option ?? item?.value)));
  }
  return new Set(Object.keys(rationales).map(normalizeQuestionText));
}

function issue(code, message) {
  return { code, message };
}

export function auditQuestionAgainstPolicy(question = {}, context = {}) {
  const issues = [];
  const prompt = questionPrompt(question);
  const choices = questionChoices(question);
  const answer = questionAnswer(question);
  const normalizeOption = context.caseSensitiveOptions
    ? value => String(value).normalize("NFKC").trim()
    : context.orthographySensitiveOptions
      ? value => String(value).normalize("NFKC").trim().toLocaleLowerCase("en")
    : normalizeQuestionText;
  const normalizedChoices = choices.map(normalizeOption);
  const normalizedAnswer = normalizeOption(answer);
  const band = QUESTION_DESIGN_AGE_BANDS[context.ageBand] || QUESTION_DESIGN_AGE_BANDS.B;

  if (context.requireId && !String(question.id || context.id || "").trim()) {
    issues.push(issue("Q-ID", "A stable question ID is required."));
  }
  if (!prompt) issues.push(issue("Q-PROMPT", "The question has no visible prompt."));
  if (!context.skipPromptLimit && wordCount(prompt) > band.promptWords) {
    issues.push(issue("Q-READING-LOAD", `Prompt has ${wordCount(prompt)} words; Band ${context.ageBand || "B"} allows ${band.promptWords}.`));
  }
  if (!context.constructedResponse) {
    if (!answer) issues.push(issue("Q-ANSWER", "The question has no keyed answer."));
    if (choices.length < 2 || choices.length > 4) {
      issues.push(issue("Q-OPTION-COUNT", `Expected 2–4 options; found ${choices.length}.`));
    }
    if (new Set(normalizedChoices).size !== normalizedChoices.length) {
      issues.push(issue("Q-DUPLICATE-OPTION", "Two or more options are equivalent after normalization."));
    }
    if (answer && choices.length && !normalizedChoices.includes(normalizedAnswer)) {
      issues.push(issue("Q-KEY-MISSING", "The keyed answer is not present in the options."));
    }
    if (normalizedChoices.some(value => BANNED_OPTIONS.has(value))) {
      issues.push(issue("Q-BANNED-OPTION", "All/none/both-of-the-above options are not allowed."));
    }
  }
  if (hasNegativeStem(prompt)) {
    if (!context.allowNegativeStem) {
      issues.push(issue("Q-NEGATIVE-STEM", "Negative stems are not permitted for this question."));
    } else if (!hasEmphasizedNegative(prompt)) {
      issues.push(issue("Q-NEGATIVE-EMPHASIS", "The negative word must be visibly emphasized in uppercase."));
    }
  }
  if (context.requireVisual && !hasMeaningfulQuestionVisual(question, context)) {
    issues.push(issue("Q-VISUAL", "A meaningful question visual is required."));
  }
  if (context.requireSpoken && !hasQuestionSpokenAccess(question, context)) {
    issues.push(issue("Q-SPEAKER", "A spoken/replay path is required."));
  }
  if (context.requireDistractorRationales && choices.length) {
    const keys = rationaleKeys(question);
    const missing = normalizedChoices.filter(value => value !== normalizedAnswer && !keys.has(value));
    if (missing.length) {
      issues.push(issue("Q-DISTRACTOR-RATIONALE", `${missing.length} distractor(s) have no misconception rationale.`));
    }
  }
  return issues;
}
