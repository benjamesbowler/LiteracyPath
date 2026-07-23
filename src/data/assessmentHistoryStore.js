const STORAGE_PREFIX = "lpAssessmentHistory:v1";
const SYNC_QUEUE_PREFIX = "lpAssessmentSyncQueue:v1";
const activeSyncQueueFlushes = new Map();

export const CURRENT_ASSESSMENT_ATTEMPT_SCHEMA_VERSION = 2;

export const ASSESSMENT_RESPONSE_STATUSES = Object.freeze({
  CORRECT: "correct",
  INCORRECT: "incorrect",
  SELF_CORRECTED: "self_corrected",
  NO_RESPONSE: "no_response",
  RECORDED: "recorded",
  SKIPPED: "skipped",
  NOT_ADMINISTERED: "not_administered",
  DISCONTINUED: "discontinued",
  NOT_SCORABLE: "not_scorable"
});

export const ASSESSMENT_ADMINISTRATION_STATUSES = Object.freeze({
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PARTIAL: "partial",
  DISCONTINUED: "discontinued",
  NOT_ADMINISTERED: "not_administered",
  NOT_SCORABLE: "not_scorable"
});

const VALID_RESPONSE_STATUSES = new Set(Object.values(ASSESSMENT_RESPONSE_STATUSES));
const VALID_ADMINISTRATION_STATUSES = new Set(Object.values(ASSESSMENT_ADMINISTRATION_STATUSES));
const SCORED_RESPONSE_STATUSES = new Set([
  ASSESSMENT_RESPONSE_STATUSES.CORRECT,
  ASSESSMENT_RESPONSE_STATUSES.INCORRECT,
  ASSESSMENT_RESPONSE_STATUSES.SELF_CORRECTED,
  ASSESSMENT_RESPONSE_STATUSES.NO_RESPONSE,
  ASSESSMENT_RESPONSE_STATUSES.SKIPPED
]);

const DESCRIPTIVE_EL_BENCHMARK_TYPES = new Set([
  "el_phonological_awareness",
  "el_encoding",
  "el_decoding",
  "el_oral_reading_fluency"
]);

const REQUIRED_ATTEMPT_FIELDS = [
  "attemptId",
  "studentId",
  "studentName",
  "assessmentType",
  "skillId",
  "skillName",
  "skillLevel",
  "startedAt",
  "completedAt",
  "totalQuestions",
  "correctCount",
  "accuracy",
  "status",
  "questionRecords",
  "schemaVersion"
];

function nowIso() {
  return new Date().toISOString();
}

function getStorageKey(teacherId = "local") {
  return `${STORAGE_PREFIX}:${teacherId || "local"}`;
}

function getSyncQueueKey(teacherId = "local") {
  return `${SYNC_QUEUE_PREFIX}:${teacherId || "local"}`;
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function normalizeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function normalizeOptionalNumber(value, { minimum = -Infinity, maximum = Infinity } = {}) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(maximum, Math.max(minimum, number));
}

function normalizeCount(value, fallback = 0) {
  const number = normalizeOptionalNumber(value, { minimum: 0 });
  return number === null ? fallback : Math.round(number);
}

function cloneJsonValue(value, fallback) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function normalizeResponseStatus(item = {}) {
  const explicit = normalizeKey(
    item.responseStatus ||
    item.response_status ||
    item.resultStatus ||
    item.administrationStatus ||
    item.administration_status ||
    ""
  );
  const aliases = {
    right: ASSESSMENT_RESPONSE_STATUSES.CORRECT,
    passed: ASSESSMENT_RESPONSE_STATUSES.CORRECT,
    wrong: ASSESSMENT_RESPONSE_STATUSES.INCORRECT,
    failed: ASSESSMENT_RESPONSE_STATUSES.INCORRECT,
    omitted: ASSESSMENT_RESPONSE_STATUSES.SKIPPED,
    blank: ASSESSMENT_RESPONSE_STATUSES.SKIPPED,
    no_response: ASSESSMENT_RESPONSE_STATUSES.NO_RESPONSE,
    not_attempted: ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED,
    not_presented: ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED,
    unadministered: ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED,
    stopped: ASSESSMENT_RESPONSE_STATUSES.DISCONTINUED,
    unscorable: ASSESSMENT_RESPONSE_STATUSES.NOT_SCORABLE,
    invalid: ASSESSMENT_RESPONSE_STATUSES.NOT_SCORABLE
  };
  const resolved = aliases[explicit] || explicit;
  if (VALID_RESPONSE_STATUSES.has(resolved)) return resolved;
  if (item.notAdministered) return ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED;
  if (item.discontinued) return ASSESSMENT_RESPONSE_STATUSES.DISCONTINUED;
  if (item.notScorable) return ASSESSMENT_RESPONSE_STATUSES.NOT_SCORABLE;
  if (item.skipped) return ASSESSMENT_RESPONSE_STATUSES.SKIPPED;
  // Historical records only supplied isCorrect. Treat a missing value as the
  // old normalizer did (incorrect), while all new non-administered states must
  // be explicit so they are never silently counted as misses.
  return item.isCorrect === true
    ? ASSESSMENT_RESPONSE_STATUSES.CORRECT
    : ASSESSMENT_RESPONSE_STATUSES.INCORRECT;
}

function normalizeAdministrationStatus(value, fallback) {
  const explicit = normalizeKey(value);
  const aliases = {
    complete: ASSESSMENT_ADMINISTRATION_STATUSES.COMPLETED,
    stopped: ASSESSMENT_ADMINISTRATION_STATUSES.DISCONTINUED,
    unadministered: ASSESSMENT_ADMINISTRATION_STATUSES.NOT_ADMINISTERED,
    unscorable: ASSESSMENT_ADMINISTRATION_STATUSES.NOT_SCORABLE
  };
  const resolved = aliases[explicit] || explicit;
  return VALID_ADMINISTRATION_STATUSES.has(resolved) ? resolved : fallback;
}

function isScoredQuestion(question = {}) {
  return SCORED_RESPONSE_STATUSES.has(question.responseStatus);
}

function normalizeQuestionRecord(item = {}, index, record, completedAt) {
  const responseStatus = normalizeResponseStatus(item);
  const pointsPossible = normalizeOptionalNumber(item.pointsPossible ?? item.maxPoints, { minimum: 0 });
  const defaultPointsEarned = pointsPossible === null
    ? null
    : responseStatus === ASSESSMENT_RESPONSE_STATUSES.CORRECT
      ? pointsPossible
      : 0;
  const rawPointsEarned = normalizeOptionalNumber(item.pointsEarned ?? item.score, { minimum: 0 });
  const pointsEarned = pointsPossible === null
    ? rawPointsEarned
    : Math.min(pointsPossible, rawPointsEarned ?? defaultPointsEarned);

  const featureTags = Array.isArray(item.featureTags) ? cloneJsonValue(item.featureTags, []) : [];
  const errorTags = Array.isArray(item.errorTags) ? cloneJsonValue(item.errorTags, []) : [];
  const existingFeatures = cloneJsonValue(item.features, {});
  const existingMetadata = cloneJsonValue(item.metadata, {});

  return {
    questionId: item.questionId || item.id || "",
    title: item.title || item.passageTitle || "",
    passageId: item.passageId || "",
    passageTitle: item.passageTitle || item.title || "",
    passageWordCount: normalizeOptionalNumber(item.passageWordCount, { minimum: 0 }),
    subtestId: item.subtestId || "",
    subtestName: item.subtestName || "",
    prompt: item.prompt || item.question || "",
    stimulus: cloneJsonValue(item.stimulus, item.stimulus ?? ""),
    pattern: item.pattern || item.targetPattern || "",
    targetWord: item.targetWord || item.diagnosticTarget || item.itemKey || "",
    targetLetter: item.targetLetter || "",
    targetSound: item.targetSound || "",
    targetPattern: item.targetPattern || "",
    itemKey: item.itemKey || "",
    itemType: item.itemType || "",
    correctAnswer: cloneJsonValue(item.correctAnswer ?? item.correct ?? "", ""),
    expectedResponse: cloneJsonValue(item.expectedResponse, item.expectedResponse ?? ""),
    selectedAnswer: cloneJsonValue(item.selectedAnswer ?? item.chosen ?? "", ""),
    responseText: item.responseText ?? item.exactResponse ?? "",
    responseCode: item.responseCode || "",
    scoringCode: item.scoringCode || "",
    responseCaptureMode: item.responseCaptureMode || existingMetadata.responseCaptureMode || "legacy_unspecified",
    responseDetailCaptured: item.responseDetailCaptured ?? existingMetadata.responseDetailCaptured ?? Boolean(
      String(item.responseText ?? item.exactResponse ?? item.transcription ?? item.studentSpelling ?? item.selectedAnswer ?? "").trim()
    ),
    outcomeRecordedAt: item.outcomeRecordedAt || existingMetadata.outcomeRecordedAt || "",
    responseStatus,
    administrationStatus: item.administrationStatus || item.administration_status || "",
    isCorrect: responseStatus === ASSESSMENT_RESPONSE_STATUSES.CORRECT || responseStatus === ASSESSMENT_RESPONSE_STATUSES.SELF_CORRECTED
      ? true
      : responseStatus === ASSESSMENT_RESPONSE_STATUSES.INCORRECT ||
          responseStatus === ASSESSMENT_RESPONSE_STATUSES.SKIPPED ||
          responseStatus === ASSESSMENT_RESPONSE_STATUSES.NO_RESPONSE
        ? false
        : null,
    pointsEarned,
    pointsPossible,
    skillId: item.skillId || record.skillId || "",
    templateType: item.templateType || item.formatType || "",
    tags: Array.isArray(item.tags) ? cloneJsonValue(item.tags, []) : [],
    level: Number(item.level ?? item.itemLevel ?? record.skillLevel ?? 1),
    phase: Number(item.phase || item.itemPhase || record.skillPhase || 1),
    durationMs: normalizeOptionalNumber(item.durationMs, { minimum: 0 }),
    latencyMs: normalizeOptionalNumber(item.latencyMs, { minimum: 0 }),
    automaticity: item.automaticity ?? item.automatic ?? null,
    automatic: item.automatic ?? item.automaticity ?? null,
    selfCorrected: item.selfCorrected ?? null,
    transcription: item.transcription ?? item.responseText ?? "",
    exact: item.exact ?? null,
    plausible: item.plausible ?? null,
    evaluation: item.evaluation || "",
    featureTags,
    errorTags,
    strand: item.strand || "",
    task: item.task || "",
    microphase: item.microphase || "",
    bandId: item.bandId || "",
    anchorCycle: item.anchorCycle ?? null,
    wordsAttempted: normalizeOptionalNumber(item.wordsAttempted, { minimum: 0 }),
    errorCount: normalizeOptionalNumber(
      Array.isArray(item.errors) ? item.errorCount : item.errors ?? item.errorCount,
      { minimum: 0 }
    ),
    selfCorrections: normalizeOptionalNumber(item.selfCorrections, { minimum: 0 }),
    elapsedSeconds: normalizeOptionalNumber(item.elapsedSeconds, { minimum: 0 }),
    correctWords: normalizeOptionalNumber(item.correctWords, { minimum: 0 }),
    wcpm: normalizeOptionalNumber(item.wcpm, { minimum: 0 }),
    wordAccuracy: normalizeOptionalNumber(item.accuracy ?? item.wordAccuracy, { minimum: 0, maximum: 100 }),
    prosody: cloneJsonValue(item.prosody, {}),
    passageAccurate: item.passageAccurate ?? null,
    lastWordIndex: normalizeOptionalNumber(item.lastWordIndex, { minimum: -1 }),
    lastWord: item.lastWord || "",
    timerStatus: item.timerStatus || "",
    timerInterrupted: item.timerInterrupted ?? existingMetadata.timerInterrupted ?? null,
    interruptionReason: item.interruptionReason || existingMetadata.interruptionReason || "",
    timingRequiredSeconds: normalizeOptionalNumber(item.timingRequiredSeconds, { minimum: 0 }),
    exactMinute: item.exactMinute ?? null,
    finishedEarly: item.finishedEarly ?? null,
    validFinishedEarly: item.validFinishedEarly ?? null,
    zeroWordsReached: item.zeroWordsReached ?? existingMetadata.zeroWordsReached ?? null,
    teacherAccuracyJudgment: item.teacherAccuracyJudgment ?? item.passageAccurate ?? null,
    judgmentSource: item.judgmentSource || "",
    accuracyJudgmentSource: item.accuracyJudgmentSource || existingMetadata.accuracyJudgmentSource || "",
    accuracyJudgedAt: item.accuracyJudgedAt || existingMetadata.accuracyJudgedAt || "",
    routeJudgmentUsable: item.routeJudgmentUsable ?? null,
    routeDecision: cloneJsonValue(item.routeDecision, existingMetadata.routeDecision ?? null),
    evidenceStatus: item.evidenceStatus || "",
    informationalNotes: cloneJsonValue(item.informationalNotes, existingMetadata.informationalNotes ?? []),
    routeSkipReason: item.routeSkipReason || "",
    notAdministeredReason: item.notAdministeredReason || "",
    retainedObservationAfterStop: cloneJsonValue(item.retainedObservationAfterStop, null),
    validationIssues: Array.isArray(item.validationIssues) ? cloneJsonValue(item.validationIssues, []) : [],
    errorType: cloneJsonValue(item.errorType, item.errorType ?? ""),
    errors: Array.isArray(item.errors) ? cloneJsonValue(item.errors, []) : errorTags,
    promptLevel: cloneJsonValue(item.promptLevel, item.promptLevel ?? ""),
    prompted: item.prompted ?? null,
    independent: item.independent ?? null,
    notScorableReason: item.notScorableReason || "",
    notScorableNote: item.notScorableNote || "",
    notes: item.notes || "",
    features: {
      ...existingFeatures,
      featureTags,
      errorTags,
      strand: item.strand || existingFeatures.strand || "",
      task: item.task || existingFeatures.task || "",
      microphase: item.microphase || existingFeatures.microphase || "",
      bandId: item.bandId || existingFeatures.bandId || "",
      anchorCycle: item.anchorCycle ?? existingFeatures.anchorCycle ?? null,
      automatic: item.automatic ?? item.automaticity ?? existingFeatures.automatic ?? null,
      plausible: item.plausible ?? existingFeatures.plausible ?? null,
      exact: item.exact ?? existingFeatures.exact ?? null,
      evaluation: item.evaluation || existingFeatures.evaluation || "",
      responseCaptureMode: item.responseCaptureMode || existingFeatures.responseCaptureMode || "legacy_unspecified",
      plausibilitySource: item.plausibilitySource || existingFeatures.plausibilitySource || "",
      notAdministeredReason: item.notAdministeredReason || existingFeatures.notAdministeredReason || ""
    },
    metadata: {
      ...existingMetadata,
      featureTags,
      errorTags,
      strand: item.strand || existingMetadata.strand || "",
      task: item.task || existingMetadata.task || "",
      microphase: item.microphase || existingMetadata.microphase || "",
      bandId: item.bandId || existingMetadata.bandId || "",
      anchorCycle: item.anchorCycle ?? existingMetadata.anchorCycle ?? null,
      automatic: item.automatic ?? item.automaticity ?? existingMetadata.automatic ?? null,
      plausible: item.plausible ?? existingMetadata.plausible ?? null,
      exact: item.exact ?? existingMetadata.exact ?? null,
      evaluation: item.evaluation || existingMetadata.evaluation || "",
      responseCaptureMode: item.responseCaptureMode || existingMetadata.responseCaptureMode || "legacy_unspecified",
      responseDetailCaptured: item.responseDetailCaptured ?? existingMetadata.responseDetailCaptured ?? Boolean(
        String(item.responseText ?? item.exactResponse ?? item.transcription ?? item.studentSpelling ?? item.selectedAnswer ?? "").trim()
      ),
      outcomeRecordedAt: item.outcomeRecordedAt || existingMetadata.outcomeRecordedAt || "",
      evaluationSource: item.evaluationSource || existingMetadata.evaluationSource || "",
      teacherOverride: cloneJsonValue(item.teacherOverride, existingMetadata.teacherOverride ?? null),
      overrideReason: item.overrideReason || existingMetadata.overrideReason || "",
      wordsAttempted: item.wordsAttempted ?? existingMetadata.wordsAttempted ?? null,
      errors: Array.isArray(item.errors) ? existingMetadata.errors ?? null : item.errors ?? existingMetadata.errors ?? null,
      selfCorrections: item.selfCorrections ?? existingMetadata.selfCorrections ?? null,
      elapsedSeconds: item.elapsedSeconds ?? existingMetadata.elapsedSeconds ?? null,
      correctWords: item.correctWords ?? existingMetadata.correctWords ?? null,
      wcpm: item.wcpm ?? existingMetadata.wcpm ?? null,
      accuracy: item.accuracy ?? existingMetadata.accuracy ?? null,
      prosody: cloneJsonValue(item.prosody, existingMetadata.prosody ?? {}),
      passageAccurate: item.passageAccurate ?? existingMetadata.passageAccurate ?? null,
      lastWordIndex: item.lastWordIndex ?? existingMetadata.lastWordIndex ?? null,
      lastWord: item.lastWord || existingMetadata.lastWord || "",
      timerStatus: item.timerStatus || existingMetadata.timerStatus || "",
      timerInterrupted: item.timerInterrupted ?? existingMetadata.timerInterrupted ?? null,
      interruptionReason: item.interruptionReason || existingMetadata.interruptionReason || "",
      passageId: item.passageId || existingMetadata.passageId || "",
      passageTitle: item.passageTitle || item.title || existingMetadata.passageTitle || "",
      passageWordCount: item.passageWordCount ?? existingMetadata.passageWordCount ?? null,
      timingRequiredSeconds: item.timingRequiredSeconds ?? existingMetadata.timingRequiredSeconds ?? null,
      exactMinute: item.exactMinute ?? existingMetadata.exactMinute ?? null,
      finishedEarly: item.finishedEarly ?? existingMetadata.finishedEarly ?? null,
      validFinishedEarly: item.validFinishedEarly ?? existingMetadata.validFinishedEarly ?? null,
      zeroWordsReached: item.zeroWordsReached ?? existingMetadata.zeroWordsReached ?? null,
      teacherAccuracyJudgment: item.teacherAccuracyJudgment ?? item.passageAccurate ?? existingMetadata.teacherAccuracyJudgment ?? null,
      judgmentSource: item.judgmentSource || existingMetadata.judgmentSource || "",
      accuracyJudgmentSource: item.accuracyJudgmentSource || existingMetadata.accuracyJudgmentSource || "",
      accuracyJudgedAt: item.accuracyJudgedAt || existingMetadata.accuracyJudgedAt || "",
      routeJudgmentUsable: item.routeJudgmentUsable ?? existingMetadata.routeJudgmentUsable ?? null,
      routeDecision: cloneJsonValue(item.routeDecision, existingMetadata.routeDecision ?? null),
      evidenceStatus: item.evidenceStatus || existingMetadata.evidenceStatus || "",
      informationalNotes: cloneJsonValue(item.informationalNotes, existingMetadata.informationalNotes ?? []),
      routeSkipReason: item.routeSkipReason || existingMetadata.routeSkipReason || "",
      retainedObservationAfterStop: cloneJsonValue(
        item.retainedObservationAfterStop,
        existingMetadata.retainedObservationAfterStop ?? null
      ),
      validationIssues: cloneJsonValue(item.validationIssues, existingMetadata.validationIssues ?? [])
    },
    timestamp: normalizeDate(item.timestamp) || completedAt,
    order: normalizeCount(item.order, index + 1)
  };
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildWeeklyAccuracySummary(records = []) {
  const weeks = new Map();
  records.forEach(record => {
    if (!record.completedAt) return;
    const date = new Date(record.completedAt);
    if (!Number.isFinite(date.getTime())) return;
    // Bucket by the teacher's local week, not UTC: a Monday-morning attempt in
    // AEST must not land in the previous week's row.
    const day = date.getDay() || 7;
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - day + 1);
    const key = [
      monday.getFullYear(),
      String(monday.getMonth() + 1).padStart(2, "0"),
      String(monday.getDate()).padStart(2, "0")
    ].join("-");
    const row = weeks.get(key) || {
      weekStart: key,
      attempts: 0,
      correct: 0,
      total: 0
    };
    row.attempts += 1;
    row.correct += record.correctCount;
    row.total += record.totalQuestions;
    weeks.set(key, row);
  });

  return Array.from(weeks.values())
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map(row => ({
      ...row,
      accuracy: row.total ? Math.round((row.correct / row.total) * 100) : 0
    }));
}

function cleanWord(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z']/g, "");
}

function inferShortVowelKey(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || record.targetSound || "");
  if (/^short_[aeiou]$/.test(explicit)) return explicit;
  const answer = cleanWord(record.correctAnswer || record.correct || "");
  if (/^[aeiou]$/.test(answer)) return `short_${answer}`;
  const word = cleanWord(record.targetWord || record.diagnosticTarget || "");
  const simpleCvc = word.match(/^[bcdfghjklmnpqrstvwxyz]?([aeiou])[bcdfghjklmnpqrstvwxyz]+$/);
  return simpleCvc ? `short_${simpleCvc[1]}` : "";
}

function inferRimeFamily(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || "");
  if (explicit && !["rhyming", "rhyme"].includes(explicit)) return explicit;
  const word = cleanWord(record.targetWord || record.diagnosticTarget || record.correctAnswer || record.correct || "");
  const match = word.match(/[aeiou][a-z']*$/);
  return match ? match[0] : word;
}

function inferQuestionMasteryKey(record = {}, attempt = {}) {
  const skillId = normalizeKey(record.skillId || attempt.skillId);
  const skillName = String(attempt.skillName || record.skillName || "").toLowerCase();
  const templateType = normalizeKey(record.templateType || record.formatType || "");
  const correct = normalizeKey(record.correctAnswer || record.correct || "");
  const targetWord = cleanWord(record.targetWord || record.diagnosticTarget || "");
  const itemType = normalizeKey(record.itemType || "");
  const itemKey = normalizeKey(record.itemKey || "");

  const shouldPreferSkillSpecificKey = [
    "initial_sounds",
    "final_sounds",
    "rhyming",
    "cvc_short_vowels",
    "short_vowel_discrimination"
  ].includes(skillId) || skillName.includes("initial") || skillName.includes("final") || skillName.includes("rhym") || skillName.includes("short vowel");

  if (itemKey && itemType && !shouldPreferSkillSpecificKey) return { itemKey, itemType };

  if (skillId === "initial_sounds" || skillName.includes("initial")) {
    const key = normalizeKey(record.targetLetter || record.targetSound || record.targetPattern || correct || targetWord[0]);
    return key ? { itemKey: key[0], itemType: "initial_sound" } : null;
  }

  if (skillId === "final_sounds" || skillName.includes("final") || skillName.includes("ending")) {
    const key = normalizeKey(record.targetSound || record.targetPattern || correct || targetWord.at(-1));
    return key ? { itemKey: key, itemType: "final_sound" } : null;
  }

  if (skillId === "rhyming" || skillName.includes("rhym")) {
    const key = inferRimeFamily(record);
    return key ? { itemKey: key, itemType: "rhyming_family" } : null;
  }

  if (
    skillId === "cvc_short_vowels" ||
    skillId === "short_vowel_discrimination" ||
    skillName.includes("short vowel") ||
    templateType.includes("short_vowel")
  ) {
    const key = inferShortVowelKey(record);
    return key ? { itemKey: key, itemType: "short_vowel" } : null;
  }

  if (skillId.startsWith("hfw") || skillName.includes("high-frequency") || skillName.includes("sight")) {
    const key = normalizeKey(record.targetWord || record.itemKey || record.correctAnswer || record.correct);
    return key ? { itemKey: key, itemType: "sight_word" } : null;
  }

  if (skillId === "el_letter_assessment") {
    if (itemType && itemKey) return { itemKey, itemType };
    const key = normalizeKey(record.targetLetter || record.itemKey || record.correctAnswer || record.correct);
    return key ? { itemKey: key, itemType: record.templateType === "letter_sound" ? "letter_sound" : "letter_name" } : null;
  }

  if (skillId === "advanced_phonics_patterns" || itemType.includes("phonics")) {
    const key = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer || record.correct);
    return key ? { itemKey: key, itemType: itemType || "phonics_pattern" } : null;
  }

  const fallback = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer || record.correct);
  return fallback ? { itemKey: fallback, itemType: itemType || "skill_item" } : null;
}

function makeAttemptId(record = {}) {
  const base = [
    record.teacherId || "teacher",
    record.studentId || "student",
    record.skillId || "skill",
    record.startedAt || record.completedAt || nowIso(),
    record.questionRecords?.map(item => item.questionId).filter(Boolean).join("-") || record.totalQuestions || 0
  ].join(":");

  return `attempt_${base.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

export function normalizeAssessmentAttempt(record = {}) {
  const rawQuestionRecords = Array.isArray(record.questionRecords) ? record.questionRecords : [];
  const isDescriptiveElBenchmark = DESCRIPTIVE_EL_BENCHMARK_TYPES.has(normalizeKey(
    record.assessmentType || record.assessmentId || record.skillId
  ));
  const completedAt = normalizeDate(record.completedAt) || nowIso();
  const startedAt = normalizeDate(record.startedAt) || normalizeDate(rawQuestionRecords[0]?.timestamp) || completedAt;
  const explicitAdministrationStatus = normalizeAdministrationStatus(record.administrationStatus, "");
  const attemptIsUnscored = [
    ASSESSMENT_ADMINISTRATION_STATUSES.NOT_ADMINISTERED,
    ASSESSMENT_ADMINISTRATION_STATUSES.NOT_SCORABLE
  ].includes(explicitAdministrationStatus);
  const questionRecords = rawQuestionRecords.map((item, index) => {
    const hasItemStatus = (
      item.responseStatus !== undefined ||
      item.response_status !== undefined ||
      item.resultStatus !== undefined ||
      item.administrationStatus !== undefined ||
      item.administration_status !== undefined
    );
    const itemWithAttemptDefault = attemptIsUnscored && !hasItemStatus
      ? { ...item, responseStatus: explicitAdministrationStatus }
      : item;
    return normalizeQuestionRecord(itemWithAttemptDefault, index, record, completedAt);
  });
  const hasExplicitResponseStates = rawQuestionRecords.some(item => (
    item.responseStatus !== undefined ||
    item.response_status !== undefined ||
    item.administrationStatus !== undefined ||
    item.administration_status !== undefined ||
    item.notAdministered ||
    item.discontinued ||
    item.notScorable ||
    item.skipped
  ));
  const scoredQuestions = questionRecords.filter(isScoredQuestion);
  const inferredTotal = scoredQuestions.length;
  const legacyTotal = normalizeCount(record.totalQuestions, inferredTotal);
  const totalQuestions = attemptIsUnscored
    ? 0
    : isDescriptiveElBenchmark && record.totalQuestions !== undefined
      ? normalizeCount(record.totalQuestions, inferredTotal)
    : hasExplicitResponseStates
      ? inferredTotal
      : legacyTotal > 0 || inferredTotal === 0
        ? legacyTotal
        : inferredTotal;
  const inferredCorrect = scoredQuestions.filter(item => item.responseStatus === ASSESSMENT_RESPONSE_STATUSES.CORRECT).length;
  const correctCount = attemptIsUnscored
    ? 0
    : isDescriptiveElBenchmark && record.correctCount !== undefined
      ? normalizeCount(record.correctCount, inferredCorrect)
    : hasExplicitResponseStates
      ? inferredCorrect
      : normalizeCount(record.correctCount, inferredCorrect);
  const skippedCount = questionRecords.filter(item => item.responseStatus === ASSESSMENT_RESPONSE_STATUSES.SKIPPED).length;
  const notAdministeredCount = questionRecords.filter(item => item.responseStatus === ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED).length;
  const discontinuedItemCount = questionRecords.filter(item => item.responseStatus === ASSESSMENT_RESPONSE_STATUSES.DISCONTINUED).length;
  const notScorableCount = questionRecords.filter(item => item.responseStatus === ASSESSMENT_RESPONSE_STATUSES.NOT_SCORABLE).length;
  const plannedQuestionCount = normalizeCount(
    record.plannedQuestionCount,
    Math.max(rawQuestionRecords.length, legacyTotal, totalQuestions)
  );
  const questionsUsePointScoring = scoredQuestions.some(item => item.pointsPossible !== null);
  const questionPointsPossible = scoredQuestions.reduce((sum, item) => sum + (item.pointsPossible ?? 0), 0);
  const questionPointsEarned = scoredQuestions.reduce((sum, item) => sum + (item.pointsEarned ?? 0), 0);
  const pointsPossible = attemptIsUnscored
    ? 0
    : questionsUsePointScoring
      ? questionPointsPossible
      : normalizeOptionalNumber(record.pointsPossible, { minimum: 0 }) ?? 0;
  const pointsEarned = Math.min(
    pointsPossible,
    questionsUsePointScoring
      ? questionPointsEarned
      : normalizeOptionalNumber(record.pointsEarned, { minimum: 0 }) ?? 0
  );
  const usesPointScoring = pointsPossible > 0 && (
    record.pointsPossible !== undefined ||
    questionsUsePointScoring
  );
  const normalizedRecordedAccuracy = normalizeOptionalNumber(record.accuracy, { minimum: 0, maximum: 100 });
  const explicitNullDescriptiveAccuracy = isDescriptiveElBenchmark &&
    Object.prototype.hasOwnProperty.call(record, "accuracy") &&
    (record.accuracy === null || record.accuracy === "");
  const accuracy = isDescriptiveElBenchmark && (attemptIsUnscored || explicitNullDescriptiveAccuracy)
    ? null
    : isDescriptiveElBenchmark && normalizedRecordedAccuracy !== null
      ? normalizedRecordedAccuracy
      : usesPointScoring
        ? Math.round((pointsEarned / pointsPossible) * 100)
        : totalQuestions
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;
  const inferredAdministrationStatus = record.discontinued || discontinuedItemCount > 0
    ? ASSESSMENT_ADMINISTRATION_STATUSES.DISCONTINUED
    : notAdministeredCount > 0 || notScorableCount > 0
      ? ASSESSMENT_ADMINISTRATION_STATUSES.PARTIAL
      : ASSESSMENT_ADMINISTRATION_STATUSES.COMPLETED;
  const administrationStatus = explicitAdministrationStatus || inferredAdministrationStatus;
  const discontinued = Boolean(record.discontinued || administrationStatus === ASSESSMENT_ADMINISTRATION_STATUSES.DISCONTINUED);
  const passed = isDescriptiveElBenchmark
    ? Boolean(record.passed ?? false)
    : Boolean(record.passed ?? record.mastered ?? (!discontinued && accuracy >= 80));
  const hasRichFields = hasExplicitResponseStates || [
    "framework",
    "formVersion",
    "scoringRuleVersion",
    "subtestScores",
    "metrics",
    "candidatePlacement",
    "confirmedPlacement"
  ].some(field => record[field] !== undefined);

  return {
    id: record.id || record.attemptId || "",
    attemptId: record.attemptId || makeAttemptId({ ...record, startedAt, completedAt, questionRecords, totalQuestions }),
    studentId: record.studentId || "",
    studentName: record.studentName || "Student",
    classId: record.classId || "",
    teacherId: record.teacherId || "",
    assessmentType: record.assessmentType || "skill_checkpoint",
    skillId: record.skillId || "",
    skillName: record.skillName || record.stage || "Assessment",
    skillLevel: Number(record.skillLevel ?? 1),
    skillPhase: Number(record.skillPhase || 1),
    startedAt,
    completedAt,
    updatedAt: normalizeDate(record.updatedAt || record.updated_at) || completedAt,
    administrationStatus,
    scoreStatus: record.scoreStatus || "",
    discontinued,
    discontinueReason: record.discontinueReason || "",
    totalQuestions,
    plannedQuestionCount,
    administeredCount: attemptIsUnscored
      ? 0
      : normalizeCount(
          record.administeredCount,
          rawQuestionRecords.length
            ? questionRecords.filter(item => item.responseStatus !== ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED).length
            : totalQuestions
        ),
    scoredCount: attemptIsUnscored
      ? 0
      : normalizeCount(record.scoredCount, rawQuestionRecords.length ? scoredQuestions.length : totalQuestions),
    correctCount,
    accuracy,
    pointsEarned,
    pointsPossible,
    passed,
    status: record.status || (
      [
        ASSESSMENT_ADMINISTRATION_STATUSES.DISCONTINUED,
        ASSESSMENT_ADMINISTRATION_STATUSES.NOT_ADMINISTERED,
        ASSESSMENT_ADMINISTRATION_STATUSES.NOT_SCORABLE
      ].includes(administrationStatus)
        ? administrationStatus
        : passed
          ? "mastered"
          : "needs_retry"
    ),
    masteredItems: record.masteredItems || [],
    developingItems: record.developingItems || [],
    needsSupportItems: record.needsSupportItems || [],
    incorrectCount: attemptIsUnscored
      ? 0
      : isDescriptiveElBenchmark && record.incorrectCount !== undefined
        ? normalizeCount(record.incorrectCount, Math.max(0, totalQuestions - correctCount))
      : hasExplicitResponseStates
        ? Math.max(0, totalQuestions - correctCount)
        : normalizeCount(record.incorrectCount, Math.max(0, totalQuestions - correctCount)),
    skippedCount,
    notAdministeredCount,
    discontinuedItemCount,
    notScorableCount,
    missedItems: record.missedItems || [],
    itemKeysCovered: record.itemKeysCovered || [],
    contentCoverage: cloneJsonValue(record.contentCoverage, {}),
    levelUnlocked: record.levelUnlocked || "",
    patternStats: Array.isArray(record.patternStats) ? cloneJsonValue(record.patternStats, []) : [],
    answers: Array.isArray(record.answers) ? cloneJsonValue(record.answers, []) : [],
    questionRecords,
    framework: record.framework || "",
    formVersion: record.formVersion || "",
    scoringRuleVersion: record.scoringRuleVersion || "",
    contentVersion: record.contentVersion || record.metadata?.contentVersion || "",
    scoringVersion: record.scoringVersion || record.metadata?.scoringVersion || "",
    administrationVersion: record.administrationVersion || record.metadata?.administrationVersion || "legacy_unspecified",
    responseSchemaVersion: normalizeCount(
      record.responseSchemaVersion ?? record.metadata?.responseSchemaVersion,
      1
    ) || 1,
    grade: cloneJsonValue(record.grade, record.grade ?? ""),
    gradePath: cloneJsonValue(record.gradePath, record.gradePath ?? ""),
    benchmarkWindow: record.benchmarkWindow || "",
    routeReason: record.routeReason || "",
    routeSource: record.routeSource || record.metadata?.routeSource || "",
    sourceAttemptId: record.sourceAttemptId || record.metadata?.sourceAttemptId || "",
    prerequisiteReview: cloneJsonValue(
      record.prerequisiteReview || record.metadata?.prerequisiteReview,
      null
    ),
    startMicrophase: record.startMicrophase || "",
    startCycle: record.startCycle || "",
    cyclesAdministered: Array.isArray(record.cyclesAdministered) ? cloneJsonValue(record.cyclesAdministered, []) : [],
    stopBand: record.stopBand || "",
    stopCycle: record.stopCycle || "",
    stopEvidence: cloneJsonValue(record.stopEvidence, record.stopEvidence ?? null),
    reason: record.reason || "",
    accommodations: Array.isArray(record.accommodations) ? cloneJsonValue(record.accommodations, []) : [],
    candidatePlacement: cloneJsonValue(record.candidatePlacement, record.candidatePlacement ?? null),
    confirmedPlacement: cloneJsonValue(record.confirmedPlacement, record.confirmedPlacement ?? null),
    placementSource: record.placementSource || "",
    teacherOverrideReason: record.teacherOverrideReason || "",
    subtestScores: cloneJsonValue(record.subtestScores, {}),
    metrics: cloneJsonValue(record.metrics, {}),
    validationIssues: cloneJsonValue(record.validationIssues, []),
    fluencyStartMicrophase: cloneJsonValue(record.fluencyStartMicrophase, record.fluencyStartMicrophase ?? null),
    fluencySequence: cloneJsonValue(record.fluencySequence, record.fluencySequence ?? null),
    recommendations: cloneJsonValue(record.recommendations, []),
    observations: cloneJsonValue(record.observations, []),
    note: record.note || record.notes || record.discontinueNote || "",
    notes: record.notes || record.note || record.discontinueNote || "",
    discontinueNote: record.discontinueNote || record.note || record.notes || "",
    metadata: cloneJsonValue(record.metadata, {}),
    completion: cloneJsonValue(record.completion, {}),
    benchmark: cloneJsonValue(record.benchmark, record.benchmark ?? null),
    durationMs: normalizeOptionalNumber(record.durationMs, { minimum: 0 }),
    appVersion: record.appVersion || "local",
    schemaVersion: normalizeCount(record.schemaVersion, hasRichFields ? CURRENT_ASSESSMENT_ATTEMPT_SCHEMA_VERSION : 1) || 1
  };
}

export function extractMasteryFromAssessmentAttempt(record = {}) {
  const attempt = normalizeAssessmentAttempt(record);
  const groups = new Map();
  const attemptIsUnscored = [
    ASSESSMENT_ADMINISTRATION_STATUSES.NOT_ADMINISTERED,
    ASSESSMENT_ADMINISTRATION_STATUSES.NOT_SCORABLE
  ].includes(attempt.administrationStatus);

  attempt.questionRecords.forEach(question => {
    // A discontinued, not-administered, or otherwise unscorable item is not a
    // wrong answer. Excluding it here prevents routing/mastery reports from
    // manufacturing weaknesses the learner was never actually tested on.
    if (attemptIsUnscored || !isScoredQuestion(question)) return;
    const masteryKey = inferQuestionMasteryKey(question, attempt);
    if (!masteryKey?.itemKey || !masteryKey?.itemType) return;
    const groupKey = `${masteryKey.itemType}::${masteryKey.itemKey}`;
    const group = groups.get(groupKey) || {
      itemKey: masteryKey.itemKey,
      itemType: masteryKey.itemType,
      skillId: question.skillId || attempt.skillId,
      skillName: attempt.skillName,
      attempts: 0,
      correct: 0,
      examples: new Set(),
      missedExamples: new Set(),
      lastAssessed: question.timestamp || attempt.completedAt
    };

    group.attempts += 1;
    if (question.isCorrect) group.correct += 1;
    const example = cleanWord(question.targetWord) || normalizeKey(question.correctAnswer || question.itemKey);
    if (example) {
      if (question.isCorrect) group.examples.add(example);
      else group.missedExamples.add(example);
    }
    group.lastAssessed = question.timestamp || group.lastAssessed;
    groups.set(groupKey, group);
  });

  const rows = Array.from(groups.values()).map(group => {
    const accuracy = group.attempts ? Math.round((group.correct / group.attempts) * 100) : 0;
    // Mastery requires BOTH enough correct answers AND a real accuracy floor — a
    // bare `correct >= 2` marked a child mastered even at 2-of-8 (25%) accuracy.
    const mastered = group.correct >= 2 && accuracy >= 80;
    const needsSupport = group.attempts > 0 && (group.correct === 0 || accuracy < 60);
    return {
      itemKey: group.itemKey,
      itemType: group.itemType,
      skillId: group.skillId,
      skillName: group.skillName,
      attempts: group.attempts,
      correct: group.correct,
      accuracy,
      mastered,
      status: mastered ? "mastered" : needsSupport ? "needs_support" : "developing",
      examples: Array.from(group.examples).slice(0, 6),
      missedExamples: Array.from(group.missedExamples).slice(0, 6),
      lastAssessed: group.lastAssessed
    };
  });

  return {
    skillId: attempt.skillId,
    skillName: attempt.skillName,
    masteredItems: rows.filter(row => row.status === "mastered"),
    developingItems: rows.filter(row => row.status === "developing"),
    needsSupportItems: rows.filter(row => row.status === "needs_support"),
    examplesByItem: rows.reduce((acc, row) => {
      acc[`${row.itemType}::${row.itemKey}`] = row.examples;
      return acc;
    }, {}),
    accuracyByItem: rows.reduce((acc, row) => {
      acc[`${row.itemType}::${row.itemKey}`] = row.accuracy;
      return acc;
    }, {}),
    rows
  };
}

export function mergeAssessmentAttemptIntoItemMastery(itemMastery = {}, record = {}) {
  const attempt = normalizeAssessmentAttempt(record);
  const mastery = extractMasteryFromAssessmentAttempt(attempt);
  const next = { ...(itemMastery || {}) };

  mastery.rows.forEach(row => {
    const key = `${normalizeKey(row.itemType)}::${normalizeKey(row.itemKey)}`;
    const previous = next[key] || {};
    const attempts = Number(previous.attempts || 0) + row.attempts;
    const correct = Number(previous.correct || 0) + row.correct;
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    next[key] = {
      ...previous,
      itemKey: row.itemKey,
      itemType: row.itemType,
      skillId: row.skillId || previous.skillId || attempt.skillId,
      targetSkill: row.skillName || previous.targetSkill || attempt.skillName,
      targetWord: row.itemType === "sight_word" || row.itemType === "cvc_word" ? row.itemKey : previous.targetWord || "",
      targetSound: row.itemType.includes("sound") || row.itemType === "short_vowel" ? row.itemKey : previous.targetSound || "",
      targetPattern: row.itemType.includes("pattern") || row.itemType === "rhyming_family" ? row.itemKey : previous.targetPattern || "",
      source: previous.source || "assessment",
      attempts,
      correct,
      lastSeen: row.lastAssessed || attempt.completedAt,
      // "Last result correct" only when every instance in the latest attempt
      // was correct — 1-of-6 right must not read as a correct last answer.
      lastResult: row.attempts > 0 && row.correct >= row.attempts,
      sessionsSeen: Number(previous.sessionsSeen || 0) + 1,
      // Recompute each merge instead of carrying previous.mastered forward:
      // a child who later fails an item repeatedly must drop out of "mastered"
      // so remediation can re-teach it.
      mastered: Boolean(row.mastered || accuracy >= 80),
      examples: Array.from(new Set([...(previous.examples || []), ...row.examples])).slice(0, 8),
      missedExamples: Array.from(new Set([...(previous.missedExamples || []), ...row.missedExamples])).slice(0, 8),
      updatedAt: attempt.completedAt
    };
  });

  return next;
}

export function loadAssessmentAttempts({ teacherId = "local", studentId = "", classId = "" } = {}) {
  if (typeof localStorage === "undefined") return [];
  const stored = safeParse(localStorage.getItem(getStorageKey(teacherId)), []);
  return (Array.isArray(stored) ? stored : [])
    .map(normalizeAssessmentAttempt)
    .filter(record => (!studentId || record.studentId === studentId) && (!classId || record.classId === classId))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

// Cap the locally retained history so months of attempts (each with full
// question records) cannot exhaust the ~5MB localStorage quota.
const MAX_LOCAL_ATTEMPTS = 400;
const CLOUD_HYDRATION_PAGE_SIZE = 500;

function sortAttemptsNewestFirst(records = []) {
  return [...records].sort((a, b) => (
    new Date(b.completedAt || b.updatedAt || 0).getTime() - new Date(a.completedAt || a.updatedAt || 0).getTime()
  ));
}

function pruneEmptyStorageValue(value) {
  if (Array.isArray(value)) {
    const rows = value.map(pruneEmptyStorageValue).filter(item => item !== undefined);
    return rows.length ? rows : undefined;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, pruneEmptyStorageValue(item)])
      .filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  if (value === undefined || value === null || value === "") return undefined;
  return value;
}

function sameStorageValue(left, right) {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function compactQuestionEvidenceForStorage(question = {}) {
  const compact = pruneEmptyStorageValue(question) || {};
  for (const bucketName of ["features", "metadata"]) {
    const bucket = compact[bucketName];
    if (!bucket || typeof bucket !== "object") continue;
    for (const key of Object.keys(bucket)) {
      if (Object.prototype.hasOwnProperty.call(compact, key) && sameStorageValue(bucket[key], compact[key])) {
        delete bucket[key];
      }
    }
    if (Object.keys(bucket).length === 0) delete compact[bucketName];
  }
  return compact;
}

export function compactAssessmentAttemptForStorage(record = {}) {
  const normalized = normalizeAssessmentAttempt(record);
  const compact = pruneEmptyStorageValue(normalized) || {};
  compact.questionRecords = normalized.questionRecords.map(compactQuestionEvidenceForStorage);
  if (!compact.questionRecords.length) delete compact.questionRecords;
  if (compact.metadata && typeof compact.metadata === "object") {
    for (const key of Object.keys(compact.metadata)) {
      if (Object.prototype.hasOwnProperty.call(compact, key) && sameStorageValue(compact.metadata[key], compact[key])) {
        delete compact.metadata[key];
      }
    }
    if (Object.keys(compact.metadata).length === 0) delete compact.metadata;
  }
  return compact;
}

function saveAssessmentAttemptListLocal(records, { teacherId = "local", returnStatus = false } = {}) {
  const normalized = sortAttemptsNewestFirst(mergeAssessmentAttemptRecords(records)).slice(0, MAX_LOCAL_ATTEMPTS);
  if (typeof localStorage === "undefined") {
    return returnStatus ? { records: normalized, saved: false, error: null } : normalized;
  }
  const compact = normalized.map(compactAssessmentAttemptForStorage);
  let saved = false;
  let saveError = null;
  try {
    localStorage.setItem(getStorageKey(teacherId), JSON.stringify(compact));
    saved = true;
  } catch (error) {
    // Quota exceeded: retry with a much smaller window rather than throwing —
    // a failed local write must never take the cloud operation down with it.
    try {
      localStorage.setItem(getStorageKey(teacherId), JSON.stringify(compact.slice(0, 50)));
      saved = true;
    } catch (fallbackError) {
      saveError = fallbackError || error;
      console.warn("Assessment attempts could not be saved to localStorage (quota).", error);
    }
  }
  return returnStatus ? { records: normalized, saved, error: saveError } : normalized;
}

function attemptRichness(record = {}) {
  try {
    return JSON.stringify(record).length;
  } catch {
    return 0;
  }
}

function isTerminalAssessmentAttempt(record = {}) {
  const administrationStatus = normalizeAdministrationStatus(
    record.administrationStatus || record.status,
    ""
  );
  return [
    ASSESSMENT_ADMINISTRATION_STATUSES.COMPLETED,
    ASSESSMENT_ADMINISTRATION_STATUSES.DISCONTINUED
  ].includes(administrationStatus);
}

function shouldReplaceMergedAttempt(current, candidate) {
  const currentIsTerminal = isTerminalAssessmentAttempt(current);
  const candidateIsTerminal = isTerminalAssessmentAttempt(candidate);
  // A retry, stale draft, or late device sync must never turn a completed or
  // discontinued administration back into partial/in-progress evidence.
  if (currentIsTerminal !== candidateIsTerminal) return candidateIsTerminal;
  const currentUpdatedAt = new Date(current.updatedAt || current.completedAt || 0).getTime() || 0;
  const candidateUpdatedAt = new Date(candidate.updatedAt || candidate.completedAt || 0).getTime() || 0;
  if (candidateUpdatedAt !== currentUpdatedAt) return candidateUpdatedAt > currentUpdatedAt;
  if (candidate.schemaVersion !== current.schemaVersion) return candidate.schemaVersion > current.schemaVersion;
  return attemptRichness(candidate) >= attemptRichness(current);
}

export function mergeAssessmentAttemptRecords(...sources) {
  const flattened = sources.flat(Infinity).filter(Boolean);
  const byAttemptId = new Map();
  flattened.map(normalizeAssessmentAttempt).forEach(candidate => {
    const current = byAttemptId.get(candidate.attemptId);
    if (!current || shouldReplaceMergedAttempt(current, candidate)) {
      byAttemptId.set(candidate.attemptId, candidate);
    }
  });
  return sortAttemptsNewestFirst(Array.from(byAttemptId.values()));
}

function getQueueStorage(storage) {
  if (storage !== undefined) return storage;
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function loadAssessmentAttemptSyncQueue({
  teacherId = "local",
  storage
} = {}) {
  const queueStorage = getQueueStorage(storage);
  if (!queueStorage || !teacherId || teacherId === "local") return [];
  try {
    const parsed = safeParse(queueStorage.getItem(getSyncQueueKey(teacherId)), []);
    if (!Array.isArray(parsed)) return [];
    return mergeAssessmentAttemptRecords(parsed)
      .filter(record => record.attemptId && record.teacherId === teacherId);
  } catch {
    return [];
  }
}

function writeAssessmentAttemptSyncQueue(records, { teacherId = "local", storage } = {}) {
  const queueStorage = getQueueStorage(storage);
  if (!queueStorage || !teacherId || teacherId === "local") return false;
  const scopedRecords = mergeAssessmentAttemptRecords(records)
    .filter(record => record.attemptId && record.teacherId === teacherId);
  try {
    if (!scopedRecords.length && typeof queueStorage.removeItem === "function") {
      queueStorage.removeItem(getSyncQueueKey(teacherId));
    } else {
      queueStorage.setItem(
        getSyncQueueKey(teacherId),
        JSON.stringify(scopedRecords.map(compactAssessmentAttemptForStorage))
      );
    }
    return true;
  } catch (error) {
    console.warn("Assessment cloud retry queue could not be saved on this device.", error);
    return false;
  }
}

function enqueueAssessmentAttemptSync(record, { teacherId = record?.teacherId || "local", storage } = {}) {
  const normalized = normalizeAssessmentAttempt({
    ...record,
    teacherId: record?.teacherId || teacherId
  });
  if (!normalized.attemptId || normalized.teacherId !== teacherId || teacherId === "local") return false;
  const queued = loadAssessmentAttemptSyncQueue({ teacherId, storage });
  return writeAssessmentAttemptSyncQueue([normalized, ...queued], { teacherId, storage });
}

function cloudRowForAssessmentAttempt(record = {}) {
  const normalized = normalizeAssessmentAttempt(record);
  return {
    attempt_id: normalized.attemptId,
    student_id: normalized.studentId,
    class_id: normalized.classId || null,
    teacher_id: normalized.teacherId || null,
    skill_id: normalized.skillId,
    skill_name: normalized.skillName,
    skill_level: normalized.skillLevel,
    skill_phase: normalized.skillPhase,
    assessment_type: normalized.assessmentType,
    started_at: normalized.startedAt,
    completed_at: normalized.completedAt,
    total_questions: normalized.totalQuestions,
    correct_count: normalized.correctCount,
    accuracy: normalized.accuracy,
    status: normalized.status,
    administration_status: normalized.administrationStatus,
    schema_version: normalized.schemaVersion,
    updated_at: normalized.updatedAt,
    payload: compactAssessmentAttemptForStorage(normalized)
  };
}

async function upsertAssessmentAttemptCloud(record, supabase) {
  let recordToPersist = normalizeAssessmentAttempt(record);
  const readTable = supabase.from("assessment_attempts");
  if (typeof readTable?.select === "function") {
    try {
      const selected = readTable.select("*");
      const filtered = typeof selected?.eq === "function"
        ? selected.eq("attempt_id", recordToPersist.attemptId)
        : null;
      if (typeof filtered?.maybeSingle === "function") {
        const { data, error } = await filtered.maybeSingle();
        if (error) throw error;
        if (data) {
          const remoteRecord = normalizeCloudAssessmentAttempt(data);
          recordToPersist = mergeAssessmentAttemptRecords(recordToPersist, remoteRecord)
            .find(candidate => candidate.attemptId === recordToPersist.attemptId) || recordToPersist;
        }
      }
    } catch (error) {
      // A non-terminal write must not proceed blindly: it could overwrite a
      // completed attempt saved by another device. Terminal evidence is safe
      // to attempt even when the protective read is temporarily unavailable.
      if (!isTerminalAssessmentAttempt(recordToPersist)) {
        return { error, record: recordToPersist };
      }
    }
  }
  const writeTable = supabase.from("assessment_attempts");
  const cloudRow = cloudRowForAssessmentAttempt(recordToPersist);
  // A partial/in-progress row uses insert-only semantics. If another device
  // completed the same attempt between our protective read and write, the
  // unique attempt_id conflict preserves that terminal row. A later retry will
  // read and merge the terminal evidence, then clear the queued partial safely.
  const result = !isTerminalAssessmentAttempt(recordToPersist) && typeof writeTable?.insert === "function"
    ? await writeTable.insert(cloudRow)
    : await writeTable.upsert(cloudRow, { onConflict: "attempt_id" });
  return { ...result, record: recordToPersist };
}

function sameAttemptPayload(left, right) {
  try {
    return JSON.stringify(compactAssessmentAttemptForStorage(left)) ===
      JSON.stringify(compactAssessmentAttemptForStorage(right));
  } catch {
    return false;
  }
}

function removeSyncedAssessmentAttemptFromQueue(record, { teacherId = record?.teacherId || "local", storage } = {}) {
  const synced = normalizeAssessmentAttempt(record);
  const queued = loadAssessmentAttemptSyncQueue({ teacherId, storage });
  if (!queued.length) return true;
  const next = queued.filter(current => {
    if (current.attemptId !== synced.attemptId) return true;
    const winner = mergeAssessmentAttemptRecords(current, synced)
      .find(candidate => candidate.attemptId === synced.attemptId);
    // If a newer/richer payload was queued while this request was in flight,
    // retain it. Only remove evidence fully covered by the successful upsert.
    return !sameAttemptPayload(winner, synced);
  });
  return writeAssessmentAttemptSyncQueue(next, { teacherId, storage });
}

async function flushAssessmentAttemptSyncQueueUncoordinated({
  teacherId,
  supabase,
  storage
}) {
  const queued = loadAssessmentAttemptSyncQueue({ teacherId, storage });
  if (!queued.length || !supabase || !teacherId || teacherId === "local") {
    return { flushed: 0, remaining: queued.length, errors: [] };
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { flushed: 0, remaining: queued.length, errors: [] };
  }

  const localByAttemptId = new Map(
    loadAssessmentAttempts({ teacherId }).map(record => [record.attemptId, record])
  );
  let flushed = 0;
  const errors = [];
  for (const queuedRecord of queued) {
    const localRecord = localByAttemptId.get(queuedRecord.attemptId);
    const recordToSync = mergeAssessmentAttemptRecords(queuedRecord, localRecord)
      .find(record => record.attemptId === queuedRecord.attemptId) || queuedRecord;
    try {
      const { error, record: syncedRecord = recordToSync } = await upsertAssessmentAttemptCloud(recordToSync, supabase);
      if (error) {
        errors.push(error);
        continue;
      }
      flushed += 1;
      if (!localRecord || !sameAttemptPayload(localRecord, syncedRecord)) {
        saveAssessmentAttemptLocal(syncedRecord, { teacherId });
      }
      removeSyncedAssessmentAttemptFromQueue(syncedRecord, { teacherId, storage });
    } catch (error) {
      errors.push(error);
    }
  }

  return {
    flushed,
    remaining: loadAssessmentAttemptSyncQueue({ teacherId, storage }).length,
    errors
  };
}

export function flushAssessmentAttemptSyncQueue({
  teacherId = "local",
  supabase = null,
  storage
} = {}) {
  if (!supabase || !teacherId || teacherId === "local") {
    return Promise.resolve({
      flushed: 0,
      remaining: loadAssessmentAttemptSyncQueue({ teacherId, storage }).length,
      errors: []
    });
  }
  const active = activeSyncQueueFlushes.get(teacherId);
  if (active) return active;
  const flush = flushAssessmentAttemptSyncQueueUncoordinated({ teacherId, supabase, storage })
    .finally(() => {
      if (activeSyncQueueFlushes.get(teacherId) === flush) activeSyncQueueFlushes.delete(teacherId);
    });
  activeSyncQueueFlushes.set(teacherId, flush);
  return flush;
}

export function normalizeCloudAssessmentAttempt(row = {}) {
  const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
    ? row.payload
    : {};
  return normalizeAssessmentAttempt({
    ...payload,
    // Relational ownership, identity, and summary columns are authoritative;
    // a stale or malformed JSON payload must never move evidence to another
    // teacher/student or win over a newer cloud update.
    attemptId: row.attempt_id || row.attemptId || payload.attemptId || "",
    studentId: row.student_id || row.studentId || payload.studentId || "",
    classId: row.class_id ?? row.classId ?? payload.classId ?? "",
    teacherId: row.teacher_id || row.teacherId || payload.teacherId || "",
    assessmentType: row.assessment_type || row.assessmentType || payload.assessmentType || "",
    skillId: row.skill_id || row.skillId || payload.skillId || "",
    skillName: row.skill_name || row.skillName || payload.skillName || "",
    skillLevel: row.skill_level ?? row.skillLevel ?? payload.skillLevel,
    skillPhase: row.skill_phase ?? row.skillPhase ?? payload.skillPhase,
    startedAt: row.started_at || row.startedAt || payload.startedAt || "",
    completedAt: row.completed_at || row.completedAt || payload.completedAt || "",
    totalQuestions: row.total_questions ?? row.totalQuestions ?? payload.totalQuestions,
    correctCount: row.correct_count ?? row.correctCount ?? payload.correctCount,
    accuracy: row.accuracy ?? payload.accuracy,
    status: row.status || payload.status,
    administrationStatus: row.administration_status || row.administrationStatus || payload.administrationStatus || "",
    updatedAt: row.updated_at || row.updatedAt || payload.updatedAt || payload.completedAt || row.completed_at || "",
    schemaVersion: payload.schemaVersion ?? row.schema_version ?? row.schemaVersion
  });
}

function cloudAssessmentAttemptRowIdentity(row = {}) {
  const attemptId = row.attempt_id || row.attemptId || row.payload?.attemptId;
  if (attemptId) return `attempt:${attemptId}`;
  try {
    return `row:${JSON.stringify(row)}`;
  } catch {
    return `row:${String(row)}`;
  }
}

export async function hydrateAssessmentAttempts({
  teacherId = "local",
  studentId = "",
  classId = "",
  supabase = null
} = {}) {
  if (supabase && teacherId && teacherId !== "local") {
    await flushAssessmentAttemptSyncQueue({ teacherId, supabase });
  }
  const localRecords = loadAssessmentAttempts({ teacherId });
  const filterRequestedRows = records => records.filter(record => (
    (!studentId || record.studentId === studentId) &&
    (!classId || record.classId === classId)
  ));

  if (!supabase || !teacherId || teacherId === "local") {
    return sortAttemptsNewestFirst(filterRequestedRows(localRecords));
  }

  try {
    const buildOrderedQuery = () => {
      let query = supabase
        .from("assessment_attempts")
        .select("*")
        .eq("teacher_id", teacherId);
      if (studentId) query = query.eq("student_id", studentId);
      if (classId) query = query.eq("class_id", classId);
      const ordered = query.order("completed_at", { ascending: false });
      return typeof ordered?.order === "function"
        ? ordered.order("attempt_id", { ascending: true })
        : ordered;
    };

    const firstQuery = buildOrderedQuery();
    let cloudRows = [];
    if (typeof firstQuery?.range !== "function") {
      // Keep compatibility with lightweight/offline Supabase adapters while
      // real hosted clients use pagination below.
      const { data, error } = await firstQuery;
      if (error) throw error;
      cloudRows = Array.isArray(data) ? data : [];
    } else {
      const seenCloudRows = new Set();
      for (let from = 0; ; from += CLOUD_HYDRATION_PAGE_SIZE) {
        const pageQuery = from === 0 ? firstQuery : buildOrderedQuery();
        const { data, error } = await pageQuery.range(from, from + CLOUD_HYDRATION_PAGE_SIZE - 1);
        if (error) throw error;
        const page = Array.isArray(data) ? data : [];
        if (!page.length) break;
        const advancingRows = page.filter(row => {
          const identity = cloudAssessmentAttemptRowIdentity(row);
          if (seenCloudRows.has(identity)) return false;
          seenCloudRows.add(identity);
          return true;
        });
        // Some lightweight adapters ignore range offsets and return the same
        // full page forever. Stop safely once a page contributes no new rows.
        if (!advancingRows.length) break;
        cloudRows.push(...advancingRows);
        if (page.length < CLOUD_HYDRATION_PAGE_SIZE) break;
      }
    }

    const cloudRecords = cloudRows.map(normalizeCloudAssessmentAttempt);
    // Merge the requested cloud slice into the complete local teacher history;
    // never overwrite unrelated student/class records during a filtered load.
    const merged = mergeAssessmentAttemptRecords(localRecords, cloudRecords);
    saveAssessmentAttemptListLocal(merged, { teacherId });
    return sortAttemptsNewestFirst(filterRequestedRows(merged));
  } catch (error) {
    console.warn("Assessment attempt cloud hydration is unavailable; using local history.", error);
    return sortAttemptsNewestFirst(filterRequestedRows(localRecords));
  }
}

export function saveAssessmentAttemptLocal(record, {
  teacherId = record.teacherId || "local",
  returnStatus = false
} = {}) {
  const normalized = normalizeAssessmentAttempt({
    ...record,
    teacherId: record.teacherId || teacherId,
    updatedAt: record.updatedAt || nowIso()
  });
  if (typeof localStorage === "undefined") {
    return returnStatus ? { records: [normalized], saved: false, error: null } : [normalized];
  }
  const existing = loadAssessmentAttempts({ teacherId });
  return saveAssessmentAttemptListLocal([normalized, ...existing], { teacherId, returnStatus });
}

export function deleteAssessmentAttemptsForStudent({
  teacherId = "local",
  studentId = "",
  studentName = "",
  resetAtOrBefore = ""
} = {}) {
  if (typeof localStorage === "undefined") return [];
  const existing = loadAssessmentAttempts({ teacherId });
  const normalizedStudentId = String(studentId || "").trim();
  const normalizedStudentName = String(studentName || "").trim().toLowerCase();
  const resetCutoff = resetAtOrBefore ? new Date(resetAtOrBefore).getTime() : Number.NaN;
  const keepRecord = record => {
    const recordStudentId = String(record.studentId || "").trim();
    const belongsToStudent = (
      Boolean(normalizedStudentId && recordStudentId === normalizedStudentId) ||
      Boolean(
        normalizedStudentName &&
        !recordStudentId &&
        String(record.studentName || "").trim().toLowerCase() === normalizedStudentName
      )
    );
    if (!belongsToStudent) return true;
    if (!Number.isFinite(resetCutoff)) return false;
    const recordTime = new Date(
      record.updatedAt || record.completedAt || record.startedAt || ""
    ).getTime();
    // Undated legacy evidence necessarily predates the synced tombstone.
    return Number.isFinite(recordTime) && recordTime > resetCutoff;
  };
  const next = existing.filter(keepRecord);
  saveAssessmentAttemptListLocal(next, { teacherId });
  // An explicit reset is authoritative: clear matching queued uploads too so
  // offline evidence cannot reappear in the cloud after the student is reset.
  const queued = loadAssessmentAttemptSyncQueue({ teacherId });
  writeAssessmentAttemptSyncQueue(queued.filter(keepRecord), { teacherId });
  return next;
}

export async function saveAssessmentAttempt(record, { teacherId = record.teacherId || "local", supabase = null } = {}) {
  const normalized = normalizeAssessmentAttempt({
    ...record,
    teacherId: record.teacherId || teacherId,
    updatedAt: record.updatedAt || nowIso()
  });
  let localResult;
  try {
    localResult = saveAssessmentAttemptLocal(normalized, { teacherId, returnStatus: true });
  } catch (error) {
    localResult = { records: [normalized], saved: false, error };
    console.warn("Local assessment attempt save failed; still attempting the cloud write.", error);
  }

  // saveAssessmentAttemptLocal applies the terminal-status guard. Persist the
  // winning record to the cloud too, otherwise a newer partial retry could
  // still downgrade a completed cloud row even though local storage stayed safe.
  const recordToPersist = localResult.records.find(item => item.attemptId === normalized.attemptId) || normalized;

  let cloudSaved = false;
  let cloudError = null;
  let syncQueued = false;
  if (supabase) {
    try {
      const { error, record: cloudRecord = recordToPersist } = await upsertAssessmentAttemptCloud(recordToPersist, supabase);
      if (error) {
        // Supabase resolves with an error object (e.g. RLS rejection) instead
        // of throwing — surface it or the failure is invisible.
        console.warn("Supabase assessment_attempts write rejected; attempt only exists locally.", error);
        cloudError = error;
      } else {
        cloudSaved = true;
        if (!sameAttemptPayload(cloudRecord, recordToPersist)) {
          const refreshedLocal = saveAssessmentAttemptLocal(cloudRecord, { teacherId, returnStatus: true });
          localResult = {
            records: refreshedLocal.records,
            saved: localResult.saved || refreshedLocal.saved,
            error: localResult.error || refreshedLocal.error
          };
        }
        removeSyncedAssessmentAttemptFromQueue(cloudRecord, { teacherId });
      }
    } catch (error) {
      cloudError = error;
      console.warn("Assessment attempt saved locally; Supabase assessment_attempts write is unavailable.", error);
    }
  }

  if (supabase && !cloudSaved && localResult.saved) {
    syncQueued = enqueueAssessmentAttemptSync(recordToPersist, { teacherId });
  }
  if (supabase && cloudSaved) {
    await flushAssessmentAttemptSyncQueue({ teacherId, supabase });
  }

  return {
    records: localResult.records,
    localSaved: localResult.saved,
    cloudSaved,
    durable: localResult.saved || cloudSaved,
    syncQueued,
    pendingSyncCount: loadAssessmentAttemptSyncQueue({ teacherId }).length,
    localError: localResult.error,
    cloudError
  };
}

export function buildAssessmentAttemptRecord({
  studentId,
  studentName,
  classId,
  teacherId,
  stage,
  checkpoint,
  questionRecords = [],
  assessmentType = "skill_checkpoint"
}) {
  const normalizedQuestions = questionRecords.map(record => ({
    questionId: record.questionId,
    prompt: record.question,
    targetWord: record.targetWord,
    targetLetter: record.targetLetter,
    targetSound: record.targetSound,
    targetPattern: record.targetPattern,
    itemKey: record.itemKey,
    itemType: record.itemType,
    correctAnswer: record.correct,
    selectedAnswer: record.chosen,
    isCorrect: record.isCorrect,
    skillId: record.skillId || stage?.id,
    templateType: record.templateType || record.formatType,
    tags: record.tags || [],
    level: record.itemLevel || checkpoint?.pathStatus?.level || 1,
    phase: record.itemPhase || checkpoint?.pathStatus?.phase || 1,
    timestamp: record.timestamp || new Date().toISOString()
  }));
  const missedItems = normalizedQuestions
    .filter(record => !record.isCorrect)
    .map(record => record.targetWord || record.itemKey || record.correctAnswer)
    .filter(Boolean);

  const normalized = normalizeAssessmentAttempt({
    studentId,
    studentName,
    classId,
    teacherId,
    assessmentType,
    skillId: checkpoint?.skillId || stage?.id || normalizedQuestions[0]?.skillId || "",
    skillName: stage?.label || checkpoint?.skillLabel || "Assessment",
    skillLevel: checkpoint?.pathStatus?.level ?? normalizedQuestions[0]?.level ?? 1,
    skillPhase: checkpoint?.pathStatus?.phase || normalizedQuestions[0]?.phase || 1,
    completedAt: new Date().toISOString(),
    totalQuestions: normalizedQuestions.length,
    correctCount: normalizedQuestions.filter(record => record.isCorrect).length,
    passed: checkpoint?.passed,
    status: checkpoint?.passed ? "mastered" : "needs_retry",
    masteredItems: checkpoint?.totalCoveredItems || [],
    missedItems,
    itemKeysCovered: checkpoint?.coveredThisRound || [],
    contentCoverage: checkpoint?.coverage || {},
    levelUnlocked: checkpoint?.pathStatus?.nextStep ? checkpoint.pathStatus.nextActionLabel : checkpoint?.nextSkillLabel || "",
    questionRecords: normalizedQuestions
  });
  const mastery = extractMasteryFromAssessmentAttempt(normalized);

  return normalizeAssessmentAttempt({
    ...normalized,
    masteredItems: normalized.masteredItems?.length ? normalized.masteredItems : mastery.masteredItems.map(row => row.itemKey),
    developingItems: mastery.developingItems.map(row => row.itemKey),
    needsSupportItems: mastery.needsSupportItems.map(row => row.itemKey)
  });
}

export function summarizeAssessmentHistory(records = [], { students = [], classes = [] } = {}) {
  const normalized = records
    .map(normalizeAssessmentAttempt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const studentById = new Map(students.map(student => [student.id, student]));
  const classById = new Map(classes.map(row => [row.id, row]));
  const skillMap = new Map();
  const studentMap = new Map();
  let correct = 0;
  let total = 0;
  let descriptiveBenchmarkAttempts = 0;

  normalized.forEach(record => {
    const isDescriptiveBenchmark = DESCRIPTIVE_EL_BENCHMARK_TYPES.has(normalizeKey(
      record.assessmentType || record.skillId
    ));
    if (isDescriptiveBenchmark) descriptiveBenchmarkAttempts += 1;
    else {
      correct += record.correctCount;
      total += record.totalQuestions;
    }
    const skill = skillMap.get(record.skillId) || {
      skillId: record.skillId,
      skillName: record.skillName,
      attempts: 0,
      correct: 0,
      total: 0,
      mastered: 0,
      descriptiveEvidence: 0,
      isDescriptiveBenchmark
    };
    skill.attempts += 1;
    if (isDescriptiveBenchmark) skill.descriptiveEvidence += 1;
    else {
      skill.correct += record.correctCount;
      skill.total += record.totalQuestions;
      if (record.passed) skill.mastered += 1;
    }
    skillMap.set(record.skillId, skill);

    const student = studentMap.get(record.studentId) || {
      studentId: record.studentId,
      studentName: record.studentName || studentById.get(record.studentId)?.name || "Student",
      className: classById.get(record.classId)?.name || studentById.get(record.studentId)?.className || "",
      attempts: 0,
      correct: 0,
      total: 0,
      descriptiveBenchmarkAttempts: 0,
      latest: null,
      latestScored: null,
      masteredSkills: new Set(),
      supportSkills: new Set()
    };
    student.attempts += 1;
    student.latest = !student.latest || new Date(record.completedAt) > new Date(student.latest.completedAt) ? record : student.latest;
    if (isDescriptiveBenchmark) {
      student.descriptiveBenchmarkAttempts += 1;
    } else {
      student.correct += record.correctCount;
      student.total += record.totalQuestions;
      student.latestScored = !student.latestScored || new Date(record.completedAt) > new Date(student.latestScored.completedAt)
        ? record
        : student.latestScored;
      if (record.passed) student.masteredSkills.add(record.skillName);
      else student.supportSkills.add(record.skillName);
    }
    studentMap.set(record.studentId, student);
  });

  const skills = Array.from(skillMap.values()).map(skill => ({
    ...skill,
    accuracy: skill.total ? Math.round((skill.correct / skill.total) * 100) : 0,
    status: skill.isDescriptiveBenchmark
      ? skill.descriptiveEvidence > 0 ? "evidence recorded" : "not assessed"
      : skill.total === 0
        ? "not assessed"
        : skill.correct / skill.total >= 0.85
          ? "on track"
          : skill.correct / skill.total >= 0.65
            ? "developing"
            : "needs support"
  }));
  const studentsSummary = Array.from(studentMap.values()).map(student => ({
    ...student,
    accuracy: student.total ? Math.round((student.correct / student.total) * 100) : 0,
    masteredSkills: Array.from(student.masteredSkills),
    supportSkills: Array.from(student.supportSkills)
  }));

  return {
    attempts: normalized.length,
    descriptiveBenchmarkAttempts,
    totalQuestions: total,
    correctCount: correct,
    averageAccuracy: total ? Math.round((correct / total) * 100) : 0,
    latestAttempt: normalized[0] || null,
    skills,
    students: studentsSummary,
    weeklyAccuracy: buildWeeklyAccuracySummary(normalized.filter(record => !DESCRIPTIVE_EL_BENCHMARK_TYPES.has(normalizeKey(
      record.assessmentType || record.skillId
    )))),
    strongestSkills: [...skills]
      .filter(skill => !skill.isDescriptiveBenchmark && skill.total > 0)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3),
    weakestSkills: [...skills]
      .filter(skill => !skill.isDescriptiveBenchmark && skill.total > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5),
    studentsNeedingSupport: studentsSummary.filter(student => (
      (student.total > 0 && student.accuracy < 70) || student.supportSkills.length > 0
    )).slice(0, 8),
    studentsReadyToLevelUp: studentsSummary.filter(student => student.latestScored?.passed).slice(0, 8)
  };
}

export function exportAssessmentAttemptsCsv(records = []) {
  const rows = [
    ["attemptId", "studentName", "studentId", "classId", "skillName", "skillLevel", "skillPhase", "completedAt", "totalQuestions", "correctCount", "accuracy", "status"]
  ];
  records.map(normalizeAssessmentAttempt).forEach(record => {
    rows.push([
      record.attemptId,
      record.studentName,
      record.studentId,
      record.classId,
      record.skillName,
      record.skillLevel,
      record.skillPhase,
      record.completedAt,
      record.totalQuestions,
      record.correctCount,
      record.accuracy,
      record.status
    ]);
  });

  return rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, "\"\"")}"`).join(",")).join("\n");
}

export function getAssessmentAttemptContractIssues(record = {}) {
  const normalized = normalizeAssessmentAttempt(record);
  return REQUIRED_ATTEMPT_FIELDS.filter(field => {
    if (field === "questionRecords") return !Array.isArray(normalized.questionRecords);
    return normalized[field] === undefined || normalized[field] === null || normalized[field] === "";
  });
}
