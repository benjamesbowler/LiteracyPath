export const WORKSHEET_MARK_STATES = Object.freeze([
  "independent", "supported", "incorrect", "not_checked", "not_completed"
]);

const CORRECTNESS_TASKS = new Set([
  "initial-sound-pictures", "letter-hunt", "capital-lowercase-match", "opening-letter-picture",
  "letter-retrieval", "missing-letter", "word-build", "word-spell", "picture-word-match",
  "picture-word-choice", "sight-word-hunt", "sight-word-cloze", "sight-word-cover-write",
  "sight-word-in-sentence", "sight-word-dictation", "pattern-sort", "word-chain",
  "pattern-compare", "pattern-detective", "word-search", "word-search-review",
  "letter-colour-code", "sight-word-colour-code", "cut-sort-cards", "cut-sort-mats",
  "matching-card-set", "matching-card-review", "roll-read-board"
]);

const PARTICIPATION_TASKS = new Set([
  "letter-trace", "word-copy", "sight-word-trace", "sentence-copy", "poem-fluency",
  "letter-colour-model", "sight-word-colour-model", "mini-book-fold", "mini-book-panels",
  "roll-read-tracker"
]);

export function worksheetEvidenceDescriptor(taskKind) {
  const kind = String(taskKind || "");
  if (CORRECTNESS_TASKS.has(kind)) return Object.freeze({
    taskKind: kind,
    tracked: true,
    purpose: "practice",
    observation: "correctness_with_support",
    teacherInstruction: "Mark only an item you directly checked. Leave every other item as Not checked.",
    disallowedClaims: Object.freeze(["mastery", "reading_level", "independent_transfer"])
  });
  if (PARTICIPATION_TASKS.has(kind)) return Object.freeze({
    taskKind: kind,
    tracked: true,
    purpose: "engagement",
    observation: "participation_only",
    teacherInstruction: "Record completion or support only. This activity does not establish correctness or handwriting mastery.",
    disallowedClaims: Object.freeze(["mastery", "handwriting_mastery", "reading_level"])
  });
  return Object.freeze({
    taskKind: kind || "unknown",
    tracked: false,
    purpose: null,
    observation: "untracked",
    teacherInstruction: "This activity remains untracked until an evidence descriptor is reviewed.",
    disallowedClaims: Object.freeze(["mastery", "correctness", "completion"])
  });
}
