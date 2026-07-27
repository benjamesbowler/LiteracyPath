export const SKILL_PROGRESSION_EXCEPTIONS_VERSION = "2026.07.24";

export const skillProgressionExceptions = Object.freeze([
  Object.freeze({
    id: "SPR-001",
    skillId: "blends",
    levels: Object.freeze([1]),
    issueTypes: Object.freeze(["recent-question-id-repeat", "recent-target-word-repeat"]),
    exceptionType: "spaced-retrieval",
    constraint: "fewer-than-two-rounds-of-unique-words",
    rationale: "The approved Level 1 blend pool cannot fill two 15-item rounds without retrieval of a previously taught word. Repetition is allowed only after all non-recent words have been preferred.",
    reviewedBy: "LiteracyPath curriculum release review",
    reviewedAt: "2026-07-24",
    reviewDue: "2026-10-24"
  }),
  Object.freeze({
    id: "SPR-002",
    skillId: "digraphs",
    levels: Object.freeze([1]),
    issueTypes: Object.freeze(["recent-question-id-repeat", "recent-target-word-repeat"]),
    exceptionType: "spaced-retrieval",
    constraint: "fewer-than-two-rounds-of-unique-words",
    rationale: "The approved Level 1 digraph pool is intentionally narrow. A later round may retrieve a recent word only after every non-recent word has been preferred.",
    reviewedBy: "LiteracyPath curriculum release review",
    reviewedAt: "2026-07-24",
    reviewDue: "2026-10-24"
  }),
  Object.freeze({
    id: "SPR-003",
    skillId: "digraphs",
    levels: Object.freeze([1]),
    issueTypes: Object.freeze(["safe-underfill"]),
    exceptionType: "safe-underfill",
    constraint: "all-unique-words-selected",
    rationale: "A short round containing every unique approved word is safer than padding the round with duplicate answer content.",
    reviewedBy: "LiteracyPath curriculum release review",
    reviewedAt: "2026-07-24",
    reviewDue: "2026-10-24"
  }),
  Object.freeze({
    id: "SPR-004",
    skillId: "long_vowels",
    levels: Object.freeze([1]),
    issueTypes: Object.freeze(["recent-question-id-repeat", "recent-target-word-repeat"]),
    exceptionType: "spaced-retrieval",
    constraint: "fewer-than-two-rounds-of-unique-words",
    rationale: "Level 1 deliberately revisits a small set of canonical silent-e exemplars. Repetition is allowed only after the selector exhausts non-recent alternatives.",
    reviewedBy: "LiteracyPath curriculum release review",
    reviewedAt: "2026-07-24",
    reviewDue: "2026-10-24"
  }),
  Object.freeze({
    id: "SPR-005",
    skillId: "vocabulary_categories",
    levels: Object.freeze([1, 2]),
    issueTypes: Object.freeze(["safe-underfill"]),
    exceptionType: "safe-underfill",
    constraint: "all-unique-words-selected",
    rationale: "The release pool contains 14 unique category targets per level. The selector must return all 14 rather than fabricate or duplicate a fifteenth item.",
    reviewedBy: "LiteracyPath curriculum release review",
    reviewedAt: "2026-07-24",
    reviewDue: "2026-10-24"
  })
]);
