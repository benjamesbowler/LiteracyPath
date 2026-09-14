// Learn Letters has five complete rounds per letter. These are practice
// completions, not assessments or claims of independent mastery.
export const LETTER_PRACTICE_VERSION = "letter-practice-five-rounds-v1";
export const LETTER_PRACTICE_ROUNDS = Object.freeze([
  { name: "Meet the letter", traceCase: "upper", activities: ["listen", "match"] },
  { name: "Little letters", traceCase: "lower", activities: ["picture-word", "letter-pair"] },
  { name: "Sound detective", traceCase: "upper", activities: ["letter-sound", "word-letter"] },
  { name: "Letter explorer", traceCase: "lower", activities: ["picture-word", "mixed"] },
  { name: "Letter champion", traceCase: "upper", activities: ["mixed", "mixed"] }
]);
export const LETTER_PRACTICE_ROUND_COUNT = LETTER_PRACTICE_ROUNDS.length;
export const LETTER_PRACTICE_STEPS_PER_ROUND = 3;

export function letterPracticeQuestionCount(round) {
  return round === LETTER_PRACTICE_ROUND_COUNT ? 12 : 8;
}
