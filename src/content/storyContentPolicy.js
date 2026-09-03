export const STORY_CONTENT_POLICY_VERSION = "2026-08-03.2";

export const STORY_CONTENT_FORMATS = Object.freeze([
  "guided-reading-book",
  "story-quest",
  "animation",
  "poem",
  "song",
  "audio-story",
  "comic",
  "play"
]);

export const STORY_CONTENT_REVIEW_STATUSES = Object.freeze([
  "legacy-requires-review",
  "draft",
  "audited-fail",
  "approved"
]);

export const STORY_CONTENT_SCORE_CATEGORIES = Object.freeze([
  Object.freeze({ id: "character", label: "Character truth", part: 1 }),
  Object.freeze({ id: "goal", label: "Concrete story goal", part: 1 }),
  Object.freeze({ id: "causality", label: "Causal progression", part: 1 }),
  Object.freeze({ id: "obstacle", label: "Escalation and genuine failure", part: 1 }),
  Object.freeze({ id: "agency", label: "Meaningful child agency", part: 1 }),
  Object.freeze({ id: "ending", label: "Earned ending", part: 1 }),
  Object.freeze({ id: "language", label: "Declared reading level", part: 1 }),
  Object.freeze({ id: "voice", label: "Human read-aloud voice", part: 1 }),
  Object.freeze({ id: "delight", label: "Specificity and delight", part: 1 }),
  Object.freeze({ id: "canon", label: "World and character canon", part: 2 }),
  Object.freeze({ id: "illustration", label: "Illustration continuity and text match", part: 2 }),
  Object.freeze({ id: "audio", label: "Exact, approved audio", part: 2 })
]);

export const STORY_CONTENT_LEVELS = Object.freeze({
  Early: Object.freeze({
    audience: "Beginning decoders on a declared phonics scope",
    maximumTextLines: 2,
    maximumWordsPerPage: 8,
    requirement: "Every content word must be decodable from the declared scope, with only declared high-frequency words as exceptions."
  }),
  A: Object.freeze({
    audience: "Beginning readers in highly controlled connected text; interest age is declared separately",
    maximumTextLines: 1,
    maximumWordsPerPage: 6,
    requirement: "One concrete action or observation per page, strong picture support, and no hidden inference needed to understand the goal."
  }),
  B: Object.freeze({
    audience: "Early readers ready for more print, variation and causal or concept connection; interest age is declared separately",
    maximumTextLines: 2,
    maximumWordsPerPage: 14,
    requirement: "A short causal chain, controlled dialogue, visible consequences, and repeated language that supports rather than replaces meaning."
  }),
  C_STANDARD: Object.freeze({
    audience: "Early readers ready for more varied syntax, vocabulary, punctuation and supported inference; interest age is declared separately",
    maximumTextLines: 3,
    maximumWordsPerPage: 22,
    requirement: "A sustained causal plot, character-motivated choices, richer inference and vocabulary that remain clear from context."
  }),
  C_EXTENDED: Object.freeze({
    audience: "Readers sharing longer, language-richer Level C texts with adult support; interest age is declared separately",
    maximumTextLines: 5,
    maximumWordsPerPage: 42,
    requirement: "A longer read-together layout may carry richer syntax and vocabulary, but must make adult support explicit rather than claim compact Level C print rules."
  })
});

export const STORY_CONTENT_MANDATORY_RULES = Object.freeze([
  Object.freeze({
    id: "registered",
    label: "Registered before publication",
    evidence: "A policy review record identifies the item, format, policy version, source fingerprint and accountable reviewer."
  }),
  Object.freeze({
    id: "one-spine",
    label: "One concrete narrative or concept spine",
    evidence: "Fiction establishes who wants or needs what and what changes; nonfiction establishes one inquiry or organising relationship."
  }),
  Object.freeze({
    id: "causal-beats",
    label: "Causal beats or concept progression",
    evidence: "Each page changes the problem, knowledge, relationship or available action, or adds a connected fact that earns the next page."
  }),
  Object.freeze({
    id: "genuine-failure",
    label: "Meaningful development",
    evidence: "Fiction includes an obstacle, mistake, surprise, social effect or failed attempt that informs the turn; nonfiction develops its concept through sequence, cause, comparison, classification, change or close observation."
  }),
  Object.freeze({
    id: "social-resolution",
    label: "Legible social consequence and repair",
    evidence: "When behavior affects another character, the text makes the impact and reaction legible, then shows recognition, a boundary, proportionate repair or a changed attempt."
  }),
  Object.freeze({
    id: "meaningful-choice",
    label: "Meaningful choices in interactive formats",
    evidence: "Each choice produces a visible consequence and is remembered until a later beat or ending."
  }),
  Object.freeze({
    id: "earned-ending",
    label: "An earned ending",
    evidence: "Fiction resolves or changes its opening state through payoff, repair, changed action, callback or a prepared landing; nonfiction answers, synthesises, compares or meaningfully returns to its opening."
  }),
  Object.freeze({
    id: "level-truth",
    label: "Reading-level truth",
    evidence: "Every page, prompt and choice label uses U.S. English spelling and passes the declared language and decoding constraints."
  }),
  Object.freeze({
    id: "canon-truth",
    label: "Character and world truth",
    evidence: "Named characters, relative sizes, colors, abilities, relationships and world rules match the active canon."
  }),
  Object.freeze({
    id: "image-truth",
    label: "Illustration truth",
    evidence: "Every stated character, object, action and state appears correctly; no contradictory extra story information is introduced."
  }),
  Object.freeze({
    id: "audio-truth",
    label: "Audio truth",
    evidence: "Published narration is approved, intelligible and word-for-word identical to the published text."
  }),
  Object.freeze({
    id: "editorial-evidence",
    label: "Recorded editorial evidence",
    evidence: "The review record contains route coverage, rubric scores, open issues and the evidence used. A named human sign-off is not required."
  })
]);

export const STORY_CONTENT_APPROVAL_RULE = Object.freeze({
  minimumScorePerCategory: 3,
  minimumTotalScore: 38,
  maximumTotalScore: 48,
  requiresNoMandatoryViolations: true,
  requiresExactSourceFingerprint: true,
  requiresReviewerRecord: true,
  requiresRouteEvidenceForInteractiveFormats: true,
  requiresPageEvidence: true,
  note: "The numerical threshold is necessary but not sufficient. An item with any open mandatory-rule violation is not approved."
});

export const STORY_CONTENT_ADMISSION_RULE = Object.freeze({
  baselineDate: "2026-08-03",
  rule: "Any new or changed narrative item must have a complete review record. Legacy fingerprints may remain visible while remediation is in progress, but any change invalidates the fingerprint and blocks the policy gate until the record is updated.",
  legacyDoesNotMeanApproved: true
});

export const storyContentPolicy = Object.freeze({
  version: STORY_CONTENT_POLICY_VERSION,
  formats: STORY_CONTENT_FORMATS,
  statuses: STORY_CONTENT_REVIEW_STATUSES,
  scoreCategories: STORY_CONTENT_SCORE_CATEGORIES,
  levels: STORY_CONTENT_LEVELS,
  mandatoryRules: STORY_CONTENT_MANDATORY_RULES,
  approval: STORY_CONTENT_APPROVAL_RULE,
  admission: STORY_CONTENT_ADMISSION_RULE
});
