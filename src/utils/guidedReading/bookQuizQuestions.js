const REQUIRED_QUESTION_COUNT = 3;
const REQUIRED_CHOICE_COUNT = 3;

export const PROHIBITED_GUIDED_READING_PROMPT_PATTERNS = [
  /\bwhich word was in (?:this|your|the) book\b/i,
  /\bfinish the sentence from (?:this|your|the) book\b/i,
  /\bwho (?:is|was) (?:this|the) story about\b/i,
  /\bwho was in (?:this|your|the) book\b/i,
  /\bwhat (?:is|was) (?:this|your|the) book about\b/i
];

const NONFICTION_GENRE_MISMATCH_PATTERNS = [
  /\bcharacters?\b/i,
  /\b(?:this|the) story\b/i,
  /\b(?:story|plot) (?:begins?|ends?|events?)\b/i,
  /\b(?:hero|heroine|villain)\b/i
];

const CORE_CONCEPT_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "both", "but", "by", "can", "could", "did",
  "do", "does", "each", "for", "from", "had", "has", "have", "he", "her", "hers", "him", "his", "how",
  "i", "in", "is", "it", "its", "may", "might", "of", "on", "or", "our", "she", "should", "that", "the",
  "their", "them", "they", "this", "to", "us", "was", "we", "were", "what", "when", "where", "which",
  "who", "why", "will", "with", "would", "you", "your"
]);

function normalizedValue(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

function coreConceptTokens(value = "") {
  return [...new Set(
    normalizedValue(value)
      .split(" ")
      .filter(token => token.length > 2 && !CORE_CONCEPT_STOP_WORDS.has(token))
      .map(token => {
        if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
        if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
        if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
        if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
        return token;
      })
  )];
}

function shuffled(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function isProhibitedGuidedReadingPrompt(prompt = "") {
  return PROHIBITED_GUIDED_READING_PROMPT_PATTERNS.some(pattern => pattern.test(String(prompt)));
}

export function isGuidedReadingQuestionStructurallyValid(question = {}) {
  if (!String(question.prompt || "").trim().endsWith("?")) return false;
  if (!Array.isArray(question.choices) || question.choices.length !== REQUIRED_CHOICE_COUNT) return false;
  if (question.choices.some(choice => !String(choice || "").trim())) return false;

  const normalizedChoices = question.choices.map(normalizedValue);
  if (new Set(normalizedChoices).size !== REQUIRED_CHOICE_COUNT) return false;

  const normalizedAnswer = normalizedValue(question.answer);
  if (!normalizedAnswer) return false;
  if (normalizedChoices.filter(choice => choice === normalizedAnswer).length !== 1) return false;

  return ["word", "text", "picture"].includes(question.kind || "word");
}

export function isGuidedReadingQuestionGenreAppropriate(question = {}, book = {}) {
  if (String(book.type || "").toLowerCase() !== "nonfiction") return true;
  const assessedText = [
    question.prompt,
    ...(Array.isArray(question.choices) ? question.choices : []),
    question.answer
  ].join(" ");
  return !NONFICTION_GENRE_MISMATCH_PATTERNS.some(pattern => pattern.test(assessedText));
}

// Two questions may have different wording and different final answers while
// still checking the same underlying fact. This deliberately conservative
// guard only reports a collision when the answers share both a title-linked
// subject and another distinctive concept. It catches repetitions such as
// "Clumsy could see over the ferns" / "Clumsy could see it ..." without
// treating a detail and its broader lesson as duplicates merely because both
// mention a generic word such as "spell" or "water".
export function guidedReadingQuestionsShareCoreConcept(first = {}, second = {}, book = {}) {
  const firstTokens = coreConceptTokens(first.answer);
  const secondTokens = coreConceptTokens(second.answer);
  if (firstTokens.length < 2 || secondTokens.length < 2) return false;

  const secondSet = new Set(secondTokens);
  const sharedTokens = firstTokens.filter(token => secondSet.has(token));
  if (sharedTokens.length < 2) return false;

  const overlapCoefficient = sharedTokens.length / Math.min(firstTokens.length, secondTokens.length);
  if (overlapCoefficient < 0.5) return false;

  const titleTokens = new Set(coreConceptTokens(book.title));
  const sharedSubject = firstTokens[0] === secondTokens[0] ? firstTokens[0] : "";
  const sharesTitleLinkedSubject = Boolean(sharedSubject && titleTokens.has(sharedSubject));
  const sharesDistinctiveConcept = sharedTokens.some(token => token !== sharedSubject);
  return sharesTitleLinkedSubject && sharesDistinctiveConcept;
}

// Every three-question quiz deliberately uses each answer position once. The
// position order changes on each load, but it never leaves a child with an
// accidental "always tap the first button" shortcut.
export function randomizeGuidedReadingAnswerPositions(questions = [], random = Math.random) {
  const answerPositions = shuffled([0, 1, 2], random);
  return questions.map((question, index) => {
    const distractors = shuffled(
      question.choices.filter(choice => normalizedValue(choice) !== normalizedValue(question.answer)),
      random
    );
    const choices = [...distractors];
    choices.splice(answerPositions[index % answerPositions.length], 0, question.answer);
    return { ...question, choices };
  });
}

export function prepareGuidedReadingQuiz(data = {}, book = {}, { random = Math.random } = {}) {
  if (String(data.bookId || "") !== String(book.id || "")) return null;
  if (!Array.isArray(data.questions) || data.questions.length !== REQUIRED_QUESTION_COUNT) return null;

  const questions = data.questions.map(question => ({
    ...question,
    kind: question.kind || "word"
  }));

  if (questions.some(question => !isGuidedReadingQuestionStructurallyValid(question))) return null;
  if (questions.some(question => isProhibitedGuidedReadingPrompt(question.prompt))) return null;
  if (questions.some(question => !isGuidedReadingQuestionGenreAppropriate(question, book))) return null;

  const distinctAnswers = new Set(questions.map(question => normalizedValue(question.answer)));
  if (distinctAnswers.size !== REQUIRED_QUESTION_COUNT) return null;

  for (let firstIndex = 0; firstIndex < questions.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < questions.length; secondIndex += 1) {
      if (guidedReadingQuestionsShareCoreConcept(questions[firstIndex], questions[secondIndex], book)) return null;
    }
  }

  return randomizeGuidedReadingAnswerPositions(questions, random);
}
