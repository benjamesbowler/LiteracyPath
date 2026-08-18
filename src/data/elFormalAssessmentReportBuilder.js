import { normalizeAssessmentAttempt } from "./assessmentHistoryStore.js";
import {
  benchmarkDomainForRecord,
  benchmarkRecordMatchesScope,
  benchmarkScopeLabel,
  EL_BENCHMARK_ASSESSMENT_IDS,
  EL_BENCHMARK_DOMAIN_DEFINITIONS,
  isElBenchmarkAssessmentRecord,
  resolveElBenchmarkReportScope
} from "./elBenchmarkReportScope.js";
import {
  LEARNING_EVIDENCE_POLICY,
  LEARNING_POLICY_VERSION,
  isLearningEvidenceRecent
} from "../policy/learningPolicy.js";

export {
  EL_BENCHMARK_ASSESSMENT_IDS,
  EL_BENCHMARK_DOMAIN_DEFINITIONS,
  filterAssessmentHistoryForElBenchmarkScope,
  getElBenchmarkAssessmentId,
  isElBenchmarkAssessmentRecord,
  resolveElBenchmarkReportScope
} from "./elBenchmarkReportScope.js";

export const EL_FORMAL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export const ADVANCED_PHONICS_PATTERNS = [
  "ai",
  "ay",
  "ee",
  "ea",
  "oa",
  "ow",
  "ar",
  "or",
  "er",
  "ir",
  "ur",
  "sh",
  "ch",
  "th",
  "wh",
  "ck",
  "ng",
  "nk",
  "silent e",
  "long a",
  "long e",
  "long i",
  "long o",
  "long u",
  "blends",
  "digraphs",
  "r-controlled vowels",
  "vowel teams"
];

export const EL_FORMAL_CLASS_EVIDENCE_SCHEMA = Object.freeze([
  "studentId",
  "studentName",
  "attemptId",
  "questionId",
  "itemKey",
  "itemType",
  "responseStatus",
  "isCorrect",
  "administrationStatus",
  "formVersion",
  "contentVersion",
  "scoringVersion",
  "scoringRuleVersion",
  "administrationVersion",
  "responseSchemaVersion",
  "date",
  "targetWord",
  "correctAnswer",
  "selectedAnswer",
  "resultType"
]);

const STATUS_LABELS = {
  mastered: "Secure",
  developing: "Developing",
  needs_support: "Needs support",
  not_enough_evidence: "Not enough results",
  unscored_evidence: "Unscored results",
  not_assessed: "Not checked"
};

const UNSCORED_RESPONSE_STATUSES = new Set([
  "not_administered",
  "discontinued",
  "not_scorable"
]);

const ADMINISTRATION_STATUS_LABELS = {
  completed: "Assessment completed",
  partial: "Partly completed",
  discontinued: "Discontinued — results kept",
  in_progress: "In progress",
  not_administered: "Not administered",
  not_scorable: "Not scorable"
};

function normalizeKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeCompact(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function cloneValue(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function finiteNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function percentage(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : null;
}

function averageMetric(values = [], precision = 0) {
  const numeric = values.map(finiteNumber).filter(value => value !== null);
  if (!numeric.length) return null;
  const mean = numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
  return Number(mean.toFixed(precision));
}

function evidenceValue(source = {}, ...keys) {
  const buckets = [source, source.metadata, source.features].filter(Boolean);
  for (const bucket of buckets) {
    for (const key of keys) {
      const value = bucket[key];
      if (value === undefined || value === null) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      ) continue;
      return value;
    }
  }
  return undefined;
}

function normalizedResponseStatus(question = {}) {
  return normalizeCompact(evidenceValue(question, "responseStatus", "response_status", "status", "resultStatus") || "");
}

function isScoredBenchmarkQuestion(question = {}) {
  const status = normalizedResponseStatus(question);
  if (UNSCORED_RESPONSE_STATUSES.has(status)) return false;
  if (["correct", "incorrect", "skipped", "no_response", "self_corrected", "recorded"].includes(status)) return true;
  return typeof question.isCorrect === "boolean";
}

function isCorrectBenchmarkQuestion(question = {}) {
  const status = normalizedResponseStatus(question);
  return question.isCorrect === true || status === "correct" || status === "self_corrected";
}

export function isReportableElBenchmarkCandidatePlacement(placement = null) {
  if (!placement || typeof placement !== "object") return false;
  const status = normalizeCompact(placement.status || "");
  if (["not_available", "unavailable", "not_applicable", "descriptive"].includes(status)) return false;
  const microphase = placement.candidateMicrophase ?? placement.microphase;
  return microphase !== undefined && microphase !== null && String(microphase).trim() !== "";
}

function administrationStatusForRecord(record = {}) {
  const status = normalizeCompact(record.administrationStatus || record.status || "completed");
  return ADMINISTRATION_STATUS_LABELS[status] ? status : "completed";
}

function administrationLabel(status = "") {
  return ADMINISTRATION_STATUS_LABELS[status] || "Result recorded";
}

function performanceSuppressedForRecord(record = {}) {
  return ["not_scorable", "not_administered"].includes(administrationStatusForRecord(record));
}

function questionEvidenceDetail(question = {}) {
  const featureTags = [
    ...toArray(evidenceValue(question, "featureTags")),
    ...toArray(question.tags)
  ].filter(Boolean);
  const errorTags = [
    ...toArray(evidenceValue(question, "errorTags")),
    ...toArray(question.errorType),
    ...toArray(question.errors).flatMap(error => typeof error === "string" ? error : error?.type || error?.code)
  ].filter(Boolean);
  const responseText = question.responseText;
  const exactResponse = responseText !== undefined && responseText !== null && String(responseText).trim() !== ""
    ? responseText
    : question.selectedAnswer ?? "";
  return {
    questionId: question.questionId || "",
    itemKey: question.itemKey || "",
    itemType: question.itemType || "",
    prompt: question.prompt || "",
    targetWord: question.targetWord || "",
    targetPattern: question.targetPattern || question.pattern || "",
    correctAnswer: cloneValue(question.correctAnswer, ""),
    exactResponse: cloneValue(exactResponse, ""),
    responseCaptureMode: evidenceValue(question, "responseCaptureMode") || "legacy_unspecified",
    responseDetailCaptured: evidenceValue(question, "responseDetailCaptured") ?? Boolean(String(exactResponse || "").trim()),
    outcomeRecordedAt: evidenceValue(question, "outcomeRecordedAt") || "",
    responseStatus: normalizedResponseStatus(question),
    notScorableReason: evidenceValue(question, "notScorableReason") || "",
    notScorableNote: evidenceValue(question, "notScorableNote") || "",
    isCorrect: typeof question.isCorrect === "boolean" ? question.isCorrect : null,
    scoringCode: evidenceValue(question, "scoringCode", "evaluation", "responseCode") || "",
    exact: evidenceValue(question, "exact") ?? null,
    plausible: evidenceValue(question, "plausible", "phonologicallyPlausible") ?? null,
    automatic: evidenceValue(question, "automatic", "automaticity") ?? null,
    selfCorrected: evidenceValue(question, "selfCorrected") ?? null,
    strand: evidenceValue(question, "strand") || featureTags[0] || "",
    task: evidenceValue(question, "task") || featureTags[1] || "",
    bandId: evidenceValue(question, "bandId") || "",
    microphase: evidenceValue(question, "microphase") || "",
    passageId: evidenceValue(question, "passageId") || question.itemKey || question.questionId || "",
    passageTitle: evidenceValue(question, "passageTitle", "title") || question.title || "",
    passageAccurate: evidenceValue(question, "passageAccurate", "teacherAccuracyJudgment", "accurate") ?? null,
    evidenceStatus: evidenceValue(question, "evidenceStatus") || "",
    wordsAttempted: finiteNumber(evidenceValue(question, "wordsAttempted")),
    errors: finiteNumber(evidenceValue(question, "errors", "errorCount")),
    selfCorrections: finiteNumber(evidenceValue(question, "selfCorrections")),
    elapsedSeconds: finiteNumber(evidenceValue(question, "elapsedSeconds")),
    timerStatus: evidenceValue(question, "timerStatus") || "",
    timerInterrupted: evidenceValue(question, "timerInterrupted") === true,
    interruptionReason: evidenceValue(question, "interruptionReason") || "",
    zeroWordsReached: evidenceValue(question, "zeroWordsReached") ?? null,
    correctWords: finiteNumber(evidenceValue(question, "correctWords")),
    wcpm: finiteNumber(evidenceValue(question, "wcpm")),
    wordAccuracy: finiteNumber(evidenceValue(question, "accuracy", "wordAccuracy")),
    routeJudgmentUsable: evidenceValue(question, "routeJudgmentUsable") ?? null,
    routeDecision: cloneValue(evidenceValue(question, "routeDecision"), null),
    accuracyJudgmentSource: evidenceValue(question, "accuracyJudgmentSource") || "",
    accuracyJudgedAt: evidenceValue(question, "accuracyJudgedAt") || "",
    informationalNotes: Array.from(new Set(toArray(evidenceValue(question, "informationalNotes")).filter(Boolean))),
    prosody: cloneValue(evidenceValue(question, "prosody"), {}),
    errorTags: Array.from(new Set(errorTags)),
    validationIssues: Array.from(new Set(toArray(evidenceValue(question, "validationIssues")).filter(Boolean))),
    featureTags: Array.from(new Set(featureTags)),
    pointsEarned: finiteNumber(question.pointsEarned),
    pointsPossible: finiteNumber(question.pointsPossible),
    timestamp: question.timestamp || ""
  };
}

function benchmarkAttemptBase(record = {}, definition = {}) {
  const administrationStatus = administrationStatusForRecord(record);
  const metadata = record.metadata || {};
  return {
    attemptId: record.attemptId,
    assessmentId: definition.assessmentId,
    domainKey: definition.domainKey,
    domainLabel: definition.domainLabel,
    administrationStatus,
    administrationStatusLabel: administrationLabel(administrationStatus),
    performanceSuppressed: performanceSuppressedForRecord(record),
    completedAt: record.completedAt || "",
    startedAt: record.startedAt || "",
    grade: cloneValue(record.grade || record.gradePath?.grade || record.gradePath || metadata.grade || "", ""),
    benchmarkWindow: record.benchmarkWindow || metadata.benchmarkWindow || metadata.window || "",
    formVersion: record.formVersion || metadata.formVersion || metadata.formId || "",
    contentVersion: record.contentVersion || metadata.contentVersion || "",
    scoringVersion: record.scoringVersion || metadata.scoringVersion || "",
    scoringRuleVersion: record.scoringRuleVersion || metadata.scoringRuleVersion || "",
    administrationVersion: record.administrationVersion || metadata.administrationVersion || "legacy_unspecified",
    responseSchemaVersion: Number(record.responseSchemaVersion || metadata.responseSchemaVersion || 1),
    framework: cloneValue(record.framework, record.framework || "Literacy Guide provisional"),
    plannedQuestionCount: Number(record.plannedQuestionCount || record.questionRecords?.length || 0),
    scoredCount: Number(record.scoredCount ?? record.totalQuestions ?? 0),
    notAdministeredCount: Number(record.notAdministeredCount || 0),
    notScorableCount: Number(record.notScorableCount || 0),
    discontinuedItemCount: Number(record.discontinuedItemCount || 0),
    discontinueReason: record.discontinueReason || "",
    accommodations: cloneValue(record.accommodations, []),
    candidatePlacement: cloneValue(record.candidatePlacement, null),
    confirmedPlacement: cloneValue(record.confirmedPlacement, null),
    placementSource: record.placementSource || "",
    routeSource: record.routeSource || metadata.routeSource || "",
    sourceAttemptId: record.sourceAttemptId || metadata.sourceAttemptId || "",
    prerequisiteReview: cloneValue(record.prerequisiteReview || metadata.prerequisiteReview, null),
    teacherOverrideReason: record.teacherOverrideReason || "",
    validationIssues: cloneValue(record.validationIssues, []),
    recommendations: cloneValue(record.recommendations, []),
    observations: cloneValue(record.observations, []),
    provisional: true,
    interpretation: "This records what the student did; it does not apply a pass mark."
  };
}

function buildPhonologicalAwarenessDetail(record, definition) {
  const questions = record.questionRecords || [];
  const performanceSuppressed = performanceSuppressedForRecord(record);
  const strands = new Map();
  questions.forEach(question => {
    const detail = questionEvidenceDetail(question);
    const strandKey = normalizeCompact(detail.strand || detail.itemType || detail.itemKey || "unclassified") || "unclassified";
    const row = strands.get(strandKey) || {
      strand: strandKey,
      strandLabel: normalizeKey(strandKey),
      administeredCount: 0,
      correctCount: 0,
      notScorableCount: 0,
      notAdministeredCount: 0,
      accuracyRate: null,
      items: []
    };
    if (!performanceSuppressed && isScoredBenchmarkQuestion(question)) {
      row.administeredCount += 1;
      if (isCorrectBenchmarkQuestion(question)) row.correctCount += 1;
    } else if (performanceSuppressed ? administrationStatusForRecord(record) === "not_scorable" : detail.responseStatus === "not_scorable") {
      row.notScorableCount += 1;
    } else {
      row.notAdministeredCount += 1;
    }
    row.items.push(detail);
    strands.set(strandKey, row);
  });
  const strandRows = Array.from(strands.values()).map(row => ({
    ...row,
    accuracyRate: percentage(row.correctCount, row.administeredCount)
  }));
  const administeredCount = strandRows.reduce((sum, row) => sum + row.administeredCount, 0);
  const correctCount = strandRows.reduce((sum, row) => sum + row.correctCount, 0);
  return {
    ...benchmarkAttemptBase(record, definition),
    administeredCount,
    correctCount,
    accuracyRate: percentage(correctCount, administeredCount),
    strandRows,
    itemDetails: strandRows.flatMap(row => row.items)
  };
}

function buildEncodingDetail(record, definition) {
  const performanceSuppressed = performanceSuppressedForRecord(record);
  const itemDetails = (record.questionRecords || []).map(question => {
    const detail = questionEvidenceDetail(question);
    const scoringCode = normalizeCompact(detail.scoringCode);
    const exact = detail.exact === true || scoringCode === "exact" || scoringCode === "full_credit" || (
      isCorrectBenchmarkQuestion(question) && detail.plausible !== true
    );
    const plausible = !exact && (detail.plausible === true || scoringCode === "plausible");
    const noResponse = detail.responseStatus === "no_response";
    return {
      ...detail,
      targetSpelling: question.targetWord || question.correctAnswer || "",
      studentSpelling: detail.exactResponse,
      exact,
      plausible,
      noResponse,
      notYet: isScoredBenchmarkQuestion(question) && !noResponse && !exact && !plausible
    };
  });
  const scoredItems = performanceSuppressed
    ? []
    : itemDetails.filter(item => !UNSCORED_RESPONSE_STATUSES.has(item.responseStatus));
  const exactSpellingCount = scoredItems.filter(item => item.exact).length;
  const plausibleSpellingCount = scoredItems.filter(item => item.plausible).length;
  const notYetCount = scoredItems.filter(item => item.notYet).length;
  const noResponseCount = scoredItems.filter(item => item.noResponse).length;
  const errorTagCounts = {};
  itemDetails.flatMap(item => item.errorTags).forEach(tag => {
    errorTagCounts[tag] = Number(errorTagCounts[tag] || 0) + 1;
  });
  return {
    ...benchmarkAttemptBase(record, definition),
    administeredCount: scoredItems.length,
    exactSpellingCount,
    plausibleSpellingCount,
    notYetCount,
    noResponseCount,
    exactSpellingRate: percentage(exactSpellingCount, scoredItems.length),
    phonologicallyRepresentedCount: exactSpellingCount + plausibleSpellingCount,
    phonologicallyRepresentedRate: percentage(exactSpellingCount + plausibleSpellingCount, scoredItems.length),
    errorTagCounts,
    itemDetails
  };
}

function isAutomaticDecoding(question = {}, detail = questionEvidenceDetail(question)) {
  const automaticity = evidenceValue(question, "automatic", "automaticity");
  const scoringCode = normalizeCompact(detail.scoringCode);
  return automaticity === true || automaticity === "automatic" || scoringCode === "automatic_accurate";
}

function buildDecodingDetail(record, definition) {
  const performanceSuppressed = performanceSuppressedForRecord(record);
  const itemDetails = (record.questionRecords || []).map(question => {
    const detail = questionEvidenceDetail(question);
    const accurate = isCorrectBenchmarkQuestion(question);
    // A self-correction is valuable accurate-reading evidence, but the
    // administration directions explicitly say it is not automatic reading.
    const automatic = accurate && detail.selfCorrected !== true && isAutomaticDecoding(question, detail);
    return { ...detail, accurate, automatic };
  });
  const scoredItems = performanceSuppressed
    ? []
    : itemDetails.filter(item => !UNSCORED_RESPONSE_STATUSES.has(item.responseStatus));
  const accurateCount = scoredItems.filter(item => item.accurate).length;
  const automaticCount = scoredItems.filter(item => item.automatic).length;
  const selfCorrectedCount = scoredItems.filter(item => item.accurate && item.selfCorrected === true).length;
  const accurateAfterSoundingCount = scoredItems.filter(item => (
    item.accurate && !item.automatic && item.selfCorrected !== true
  )).length;
  const bandMap = new Map();
  scoredItems.forEach(item => {
    const bandKey = String(item.bandId || (item.microphase ? `microphase-${item.microphase}` : "unbanded"));
    const band = bandMap.get(bandKey) || {
      bandId: bandKey,
      microphase: item.microphase || "",
      administeredCount: 0,
      accurateCount: 0,
      automaticCount: 0,
      accuracyRate: null,
      automaticityRate: null,
      items: []
    };
    band.administeredCount += 1;
    if (item.accurate) band.accurateCount += 1;
    if (item.automatic) band.automaticCount += 1;
    band.items.push(item);
    bandMap.set(bandKey, band);
  });
  const bandRows = Array.from(bandMap.values()).map(row => ({
    ...row,
    accuracyRate: percentage(row.accurateCount, row.administeredCount),
    automaticityRate: percentage(row.automaticCount, row.administeredCount)
  }));
  const metadata = record.metadata || {};
  const stopCycleAnchor = record.stopCycleAnchor ?? metadata.stopCycleAnchor ?? record.stopCycle ?? "";
  const stopCycleAnchorLabel = record.stopCycleAnchorLabel || metadata.stopCycleAnchorLabel || (
    stopCycleAnchor !== "" && stopCycleAnchor !== null
      ? Number.isFinite(Number(stopCycleAnchor))
        ? `Cycle ${stopCycleAnchor} anchor`
        : `${stopCycleAnchor} anchor`
      : ""
  );
  return {
    ...benchmarkAttemptBase(record, definition),
    administeredCount: scoredItems.length,
    accurateCount,
    automaticCount,
    accurateAfterSoundingCount,
    selfCorrectedCount,
    accuracyRate: percentage(accurateCount, scoredItems.length),
    automaticityRate: percentage(automaticCount, scoredItems.length),
    automaticAmongAccurateRate: percentage(automaticCount, accurateCount),
    bandRows,
    stopEvidence: {
      // Keep `stopCycle` for compatible report consumers, but label and
      // interpret it truthfully as the overview's comparison anchor. This
      // original bank does not contain cycle-specific forms.
      stopCycle: stopCycleAnchor,
      stopCycleAnchor,
      stopCycleAnchorLabel,
      stopCycleInterpretation: record.stopCycleInterpretation || metadata.stopCycleInterpretation || (
        stopCycleAnchor !== "" && stopCycleAnchor !== null
          ? "comparison_anchor_not_assessed_exact_cycle"
          : "not_available"
      ),
      stopBand: record.stopBand || metadata.stopBand || metadata.stopMicrophase || bandRows.at(-1)?.bandId || "",
      stopRule: cloneValue(record.stopEvidence || metadata.stopRule || record.contentCoverage?.stopRule || (
        record.subtestScores?.bands || []
      ).find(band => band.bandId === record.stopBand)?.stopEvidence, null),
      triggered: Boolean(record.stopBand || record.stopEvidence || record.discontinued || metadata.stopRuleTriggered),
      reason: record.reason || record.discontinueReason || metadata.stopReason || "",
      unadministeredItems: Number(record.notAdministeredCount || 0)
    },
    itemDetails
  };
}

function buildFluencyDetail(record, definition) {
  const metrics = record.metrics || {};
  const performanceSuppressed = performanceSuppressedForRecord(record);
  const questions = record.questionRecords || [];
  const fallbackQuestion = questions[0] || {};
  const passageRows = (questions.length ? questions : [fallbackQuestion]).map((question, index) => {
    const detail = questionEvidenceDetail(question);
    const useAttemptMetrics = questions.length <= 1 || index === questions.length - 1;
    const metricValue = (...keys) => {
      for (const key of keys) {
        const questionValue = finiteNumber(evidenceValue(question, key));
        if (questionValue !== null) return questionValue;
        if (useAttemptMetrics) {
          const attemptValue = finiteNumber(metrics[key]);
          if (attemptValue !== null) return attemptValue;
        }
      }
      return null;
    };
    const wordsAttempted = metricValue("wordsAttempted", "totalWordsRead");
    const errors = metricValue("errors", "errorCount");
    const selfCorrections = metricValue("selfCorrections", "selfCorrectionCount");
    const elapsedSeconds = metricValue("elapsedSeconds", "durationSeconds") ?? (
      questions.length <= 1 && finiteNumber(record.durationMs) !== null ? record.durationMs / 1000 : null
    );
    const timerInterrupted = detail.timerInterrupted === true;
    const wordsCorrect = timerInterrupted ? null : metricValue("correctWords") ?? (
      wordsAttempted !== null && errors !== null ? Math.max(0, wordsAttempted - errors) : null
    );
    const suppliedWcpm = metricValue("wcpm", "wordsCorrectPerMinute");
    // The supplied overview defines a one-minute measure. Never manufacture a
    // rate from interrupted, 30, 59, 90, or finish-early evidence.
    const wcpm = timerInterrupted
      ? null
      : suppliedWcpm ?? (wordsCorrect !== null && elapsedSeconds === 60 ? wordsCorrect : null);
    const suppliedAccuracy = metricValue("accuracy", "accuracyRate", "wordAccuracy", "wordAccuracyRate");
    const accuracyRate = timerInterrupted ? null : suppliedAccuracy ?? (
      wordsAttempted > 0 && wordsCorrect !== null ? Math.round((wordsCorrect / wordsAttempted) * 100) : null
    );
    const rawProsody = cloneValue(
      evidenceValue(question, "prosody") || (useAttemptMetrics ? metrics.prosody : null),
      {}
    );
    const prosody = cloneValue(rawProsody?.dimensions || rawProsody, {});
    const prosodyAverage = finiteNumber(rawProsody?.average) ?? (
      useAttemptMetrics ? finiteNumber(metrics.prosodyAverage ?? metrics.prosodyRating) : null
    ) ?? averageMetric(Object.values(prosody || {}), 2);
    return {
      ...detail,
      passageId: detail.passageId || metrics.passageId || "",
      passageTitle: detail.passageTitle || (useAttemptMetrics ? metrics.passageTitle : "") || "",
      wordsAttempted,
      wordsCorrect,
      errors,
      selfCorrections,
      elapsedSeconds,
      timerInterrupted,
      interruptionReason: detail.interruptionReason,
      wcpm,
      accuracyRate,
      prosody,
      prosodyAverage
    };
  });
  const administeredRows = performanceSuppressed
    ? []
    : passageRows.filter(row => !UNSCORED_RESPONSE_STATUSES.has(row.responseStatus));
  const terminal = administeredRows.at(-1) || passageRows[0] || {};
  const terminalWcpm = administeredRows.filter(row => row.wcpm !== null).at(-1) || null;
  const interruptedRows = administeredRows.filter(row => row.timerInterrupted === true);
  const highestAccuratePassage = performanceSuppressed
    ? null
    : administeredRows.filter(row => row.passageAccurate === true).at(-1) || null;
  const fluencySequence = cloneValue(
    metrics.fluencySequence || record.fluencySequence || record.benchmark?.fluencySequence,
    null
  );
  const firstInaccurate = administeredRows.find(row => row.passageAccurate === false && row.elapsedSeconds === 60) || null;
  const stopEvidence = cloneValue(fluencySequence?.stop, firstInaccurate ? {
    passageId: firstInaccurate.passageId,
    microphase: firstInaccurate.microphase,
    reason: record.reason || "teacher_judged_not_accurate_after_60_seconds"
  } : null);
  return {
    ...benchmarkAttemptBase(record, definition),
    passageId: terminal.passageId || metrics.passageId || "",
    passageTitle: terminal.passageTitle || metrics.passageTitle || "",
    elapsedSeconds: performanceSuppressed ? null : terminal.elapsedSeconds ?? null,
    timerInterrupted: terminal.timerInterrupted === true,
    interruptionReason: terminal.interruptionReason || "",
    interruptedPassageCount: interruptedRows.length,
    wordsAttempted: performanceSuppressed ? null : terminal.wordsAttempted ?? null,
    wordsCorrect: performanceSuppressed ? null : terminal.wordsCorrect ?? null,
    errors: performanceSuppressed ? null : terminal.errors ?? null,
    selfCorrections: performanceSuppressed ? null : terminal.selfCorrections ?? null,
    wcpm: performanceSuppressed ? null : terminalWcpm?.wcpm ?? finiteNumber(metrics.wcpm),
    accuracyRate: performanceSuppressed ? null : terminal.accuracyRate ?? finiteNumber(metrics.aggregateAccuracy ?? metrics.accuracy ?? metrics.accuracyRate),
    prosody: performanceSuppressed ? {} : cloneValue(terminal.prosody, {}),
    prosodyAverage: performanceSuppressed ? null : terminal.prosodyAverage ?? null,
    passageRows,
    highestAccuratePassage,
    stopEvidence,
    fluencySequence,
    itemDetails: passageRows
  };
}

function buildBenchmarkAttemptDetail(record = {}) {
  const definition = benchmarkDomainForRecord(record);
  if (!definition) return null;
  if (definition.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS) {
    return buildPhonologicalAwarenessDetail(record, definition);
  }
  if (definition.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING) {
    return buildEncodingDetail(record, definition);
  }
  if (definition.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.DECODING) {
    return buildDecodingDetail(record, definition);
  }
  return buildFluencyDetail(record, definition);
}

function profileMetrics(detail = {}) {
  if (detail.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS) {
    return {
      accuracyRate: detail.accuracyRate,
      strandsObserved: detail.strandRows?.filter(row => Number(row.administeredCount || 0) > 0).length || 0
    };
  }
  if (detail.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING) {
    return {
      exactSpellingRate: detail.exactSpellingRate,
      phonologicallyRepresentedRate: detail.phonologicallyRepresentedRate,
      noResponseCount: detail.noResponseCount
    };
  }
  if (detail.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.DECODING) {
    return { accuracyRate: detail.accuracyRate, automaticityRate: detail.automaticityRate };
  }
  return { wcpm: detail.wcpm, accuracyRate: detail.accuracyRate, prosodyAverage: detail.prosodyAverage };
}

function buildIndividualBenchmarkEvidence(records = [], benchmarkScope = {}) {
  const details = records
    .filter(record => benchmarkRecordMatchesScope(record, benchmarkScope))
    .map(buildBenchmarkAttemptDetail)
    .filter(Boolean)
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
  const profile = EL_BENCHMARK_DOMAIN_DEFINITIONS.map(definition => {
    const domainDetails = details.filter(detail => detail.assessmentId === definition.assessmentId);
    const latest = domainDetails[0];
    if (!latest) {
      return {
        ...definition,
        attemptCount: 0,
        hasSavedEvidence: false,
        administrationStatus: "no_record",
        administrationStatusLabel: "No saved results",
        latestAttemptId: "",
        latestDate: "",
        grade: benchmarkScope.grade || "",
        benchmarkWindow: benchmarkScope.benchmarkWindow || "",
        formVersion: "",
        contentVersion: "",
        scoringVersion: "",
        scoringRuleVersion: "",
        administrationVersion: "",
        responseSchemaVersion: 1,
        metrics: {},
        candidatePlacement: null,
        confirmedPlacement: null,
        validationIssues: [],
        recommendations: [],
        observations: [],
        provisional: true,
        interpretation: "No saved results; no learning judgement is made."
      };
    }
    return {
      ...definition,
      attemptCount: domainDetails.length,
      hasSavedEvidence: true,
      administrationStatus: latest.administrationStatus,
      administrationStatusLabel: latest.administrationStatusLabel,
      latestAttemptId: latest.attemptId,
      latestDate: latest.completedAt,
      grade: cloneValue(latest.grade, ""),
      benchmarkWindow: latest.benchmarkWindow,
      formVersion: latest.formVersion,
      contentVersion: latest.contentVersion,
      scoringVersion: latest.scoringVersion,
      scoringRuleVersion: latest.scoringRuleVersion,
      administrationVersion: latest.administrationVersion,
      responseSchemaVersion: latest.responseSchemaVersion,
      metrics: profileMetrics(latest),
      candidatePlacement: cloneValue(latest.candidatePlacement, null),
      confirmedPlacement: cloneValue(latest.confirmedPlacement, null),
      validationIssues: cloneValue(latest.validationIssues, []),
      recommendations: cloneValue(latest.recommendations, []),
      observations: cloneValue(latest.observations, []),
      provisional: true,
      interpretation: !isReportableElBenchmarkCandidatePlacement(latest.candidatePlacement)
        ? latest.candidatePlacement?.reason || latest.candidatePlacement?.interpretation || latest.interpretation
        : latest.interpretation
    };
  });
  return {
    benchmarkScope: cloneValue(benchmarkScope, {}),
    individualBenchmarkProfile: profile,
    individualBenchmarkDetails: details,
    individualBenchmarkByDomain: Object.fromEntries(profile.map(row => [row.domainKey, row]))
  };
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function getStudentId(student = {}) {
  return student.id || student.studentId || "";
}

function getStudentName(student = {}) {
  return student.name || student.studentName || "Unknown Student";
}

function getClassId(student = {}) {
  return student.classId || student.class_id || "";
}

function makeCell() {
  return {
    status: "not_assessed",
    statusLabel: STATUS_LABELS.not_assessed,
    policyVersion: LEARNING_POLICY_VERSION,
    evidenceCount: 0,
    currentEvidenceCount: 0,
    staleEvidenceCount: 0,
    unscoredCount: 0,
    selectedPeriodUnscoredCount: 0,
    attempts: 0,
    selectedPeriodAttempts: 0,
    correct: 0,
    selectedPeriodCorrect: 0,
    incorrect: 0,
    accuracy: null,
    lastAssessed: "",
    lastCurrentAssessed: "",
    details: []
  };
}

// Letter names, letter sounds and taught phonics patterns are teacher
// observations, not longitudinal mastery estimates. One independent check is
// enough to report the latest literal outcome: Yes, No, or blank.
function finalizeBinaryObservationCell(cell) {
  const latest = [...(cell.details || [])]
    .filter(detail => detail.scored)
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    .at(-1);
  const status = !latest
    ? "not_assessed"
    : latest.isCorrect
      ? "mastered"
      : "needs_support";
  return {
    ...cell,
    attempts: latest ? 1 : 0,
    correct: latest?.isCorrect ? 1 : 0,
    incorrect: latest && !latest.isCorrect ? 1 : 0,
    accuracy: latest ? (latest.isCorrect ? 100 : 0) : null,
    status,
    statusLabel: latest ? (latest.isCorrect ? "Yes" : "No") : ""
  };
}

const FORMAL_UNSCORED_RESPONSE_STATUSES = new Set([
  "recorded",
  "unscored",
  "not_recorded",
  "not_administered",
  "discontinued",
  "not_scorable",
  "in_progress"
]);

const FORMAL_CORRECT_RESPONSE_STATUSES = new Set(["correct", "self_corrected"]);
const FORMAL_INCORRECT_RESPONSE_STATUSES = new Set(["incorrect", "skipped", "no_response"]);

function getRawQuestionRecords(record = {}) {
  if (Array.isArray(record.questionRecords) && record.questionRecords.length) return record.questionRecords;
  return Array.isArray(record.answers) ? record.answers : [];
}

function getAuthoritativeAssessmentType(record = {}) {
  const candidates = [record.assessmentType, record.assessmentId, record.skillId];
  for (const candidate of candidates) {
    const normalized = normalizeCompact(candidate);
    if (normalized) return normalized;
  }
  return "";
}

function getExplicitQuestionResponseStatus(question = {}, record = {}) {
  const explicit = normalizeCompact(
    question.responseStatus ||
    question.response_status ||
    question.resultStatus ||
    question.administrationStatus ||
    question.administration_status ||
    ""
  );
  if (explicit) return explicit;
  const attemptStatus = normalizeCompact(record.administrationStatus || record.status || "");
  return FORMAL_UNSCORED_RESPONSE_STATUSES.has(attemptStatus) ? attemptStatus : "";
}

function getExplicitQuestionScore(question = {}, responseStatus = "") {
  if (FORMAL_UNSCORED_RESPONSE_STATUSES.has(responseStatus)) return null;
  if (FORMAL_CORRECT_RESPONSE_STATUSES.has(responseStatus)) return true;
  if (FORMAL_INCORRECT_RESPONSE_STATUSES.has(responseStatus)) return false;
  return typeof question.isCorrect === "boolean" ? question.isCorrect : null;
}

function normalizeFormalAssessmentRecord(record = {}) {
  const rawQuestions = getRawQuestionRecords(record);
  const normalized = normalizeAssessmentAttempt({
    ...record,
    questionRecords: rawQuestions
  });
  normalized.formalEvidenceNormalized = true;
  normalized.formalAssessmentType = getAuthoritativeAssessmentType(record);
  normalized.questionRecords = normalized.questionRecords.map((question, index) => {
    const rawQuestion = rawQuestions[index] || {};
    const responseStatus = getExplicitQuestionResponseStatus(rawQuestion, record);
    return {
      ...question,
      formalResponseStatus: responseStatus || "unrecorded",
      formalIsCorrect: getExplicitQuestionScore(rawQuestion, responseStatus)
    };
  });
  return normalized;
}

function isLetterAssessment(record = {}) {
  const assessmentType = record.formalAssessmentType || getAuthoritativeAssessmentType(record);
  const skillName = String(record.skillName || "").toLowerCase();
  if (assessmentType) return assessmentType === "el_letter_assessment";
  return skillName.includes("letter name") || skillName.includes("letter sound");
}

function inferLetterCase(question = {}) {
  const target = String(question.targetLetter || question.letter || "").trim();
  if (target && /^[A-Z]$/.test(target)) return "uppercase";
  if (target && /^[a-z]$/.test(target)) return "lowercase";
  const text = [
    question.questionId,
    question.templateType,
    question.itemType,
    question.prompt
  ].join(" ").toLowerCase();
  if (text.includes("uppercase")) return "uppercase";
  if (text.includes("lowercase")) return "lowercase";
  return target && target === target.toUpperCase() ? "uppercase" : "lowercase";
}

function inferLetterMode(question = {}) {
  const text = [
    question.itemType,
    question.templateType,
    question.questionId,
    question.prompt
  ].join(" ").toLowerCase();
  return text.includes("sound") ? "sound" : "name";
}

function inferLetter(question = {}) {
  const target = String(question.targetLetter || question.letter || question.itemKey || "").trim();
  const direct = target.match(/[a-z]/i)?.[0];
  if (direct) return direct.toLowerCase();
  const answer = String(question.correctAnswer || "").trim();
  return answer.match(/[a-z]/i)?.[0]?.toLowerCase() || "";
}

function isAdvancedPhonicsAssessment(record = {}) {
  if (isElBenchmarkAssessmentRecord(record)) return false;
  const assessmentType = record.formalAssessmentType || getAuthoritativeAssessmentType(record);
  const skillName = String(record.skillName || "").toLowerCase();
  if (assessmentType) return assessmentType === "advanced_phonics_patterns";
  return skillName.includes("advanced phonics") ||
    skillName.includes("blends") ||
    skillName.includes("digraphs") ||
    skillName.includes("vowel teams") ||
    skillName.includes("r-controlled");
}

function inferAdvancedPattern(question = {}) {
  const explicit = normalizeKey(question.targetPattern || question.pattern || question.itemKey || "");
  if (!explicit || explicit === "phonics pattern") {
    return normalizeKey(question.correctAnswer || question.targetWord || "");
  }
  return explicit;
}

export function inferAdvancedPhonicsResultType(question = {}) {
  const text = [
    question.resultType,
    question.itemType,
    question.templateType,
    question.questionId,
    question.prompt
  ].join(" ").toLowerCase();
  if (text.includes("sound")) return "sound";
  if (text.includes("read") || text.includes("word")) return "reading";
  return "recognition";
}

export function combineAdvancedPhonicsStatus(readingResult = {}, soundResult = {}) {
  const readingStatus = readingResult.status || "not_assessed";
  const soundStatus = soundResult.status || "not_assessed";
  const readyStatuses = new Set(["mastered", "developing", "needs_support"]);

  if (readyStatuses.has(readingStatus) && readyStatuses.has(soundStatus)) {
    if (readingStatus === "needs_support" || soundStatus === "needs_support") return "needs_support";
    if (readingStatus === "developing" || soundStatus === "developing") return "developing";
    return "mastered";
  }
  if (readingStatus === "not_assessed" && soundStatus === "not_assessed") return "not_assessed";
  if (
    [readingStatus, soundStatus].every(status => (
      status === "not_assessed" || status === "unscored_evidence"
    ))
    && [readingStatus, soundStatus].includes("unscored_evidence")
  ) {
    return "unscored_evidence";
  }
  return "not_assessed";
}

function addDetail(cell, question = {}, record = {}, now = new Date()) {
  const isCorrect = question.formalIsCorrect ?? null;
  const scored = typeof isCorrect === "boolean";
  const date = question.timestamp || record.completedAt || "";
  const withinCurrentWindow = isLearningEvidenceRecent(date, { now });
  cell.evidenceCount += 1;
  cell.selectedPeriodAttempts += scored ? 1 : 0;
  cell.selectedPeriodCorrect += scored && isCorrect ? 1 : 0;
  cell.selectedPeriodUnscoredCount += scored ? 0 : 1;
  if (withinCurrentWindow) cell.currentEvidenceCount += 1;
  else cell.staleEvidenceCount += 1;
  if (scored) {
    if (withinCurrentWindow) {
      cell.attempts += 1;
      if (isCorrect) cell.correct += 1;
    }
  } else if (withinCurrentWindow) {
    cell.unscoredCount += 1;
  }
  cell.lastAssessed = [cell.lastAssessed, date].filter(Boolean).sort().at(-1) || "";
  if (withinCurrentWindow) {
    cell.lastCurrentAssessed = [cell.lastCurrentAssessed, date].filter(Boolean).sort().at(-1) || "";
  }
  const detail = {
    attemptId: record.attemptId || record.id || "",
    questionId: question.questionId || "",
    itemKey: question.itemKey || question.targetLetter || question.targetPattern || question.targetWord || "",
    itemType: question.itemType || question.templateType || "",
    prompt: question.prompt || question.question || "",
    targetLetter: question.targetLetter || "",
    targetWord: question.targetWord || "",
    targetPattern: question.targetPattern || question.pattern || "",
    correctAnswer: question.correctAnswer,
    selectedAnswer: question.selectedAnswer,
    responseStatus: question.formalResponseStatus || "unrecorded",
    isCorrect,
    scored,
    administrationStatus: record.administrationStatus || "",
    formVersion: record.formVersion || "",
    contentVersion: record.contentVersion || "",
    scoringVersion: record.scoringVersion || "",
    scoringRuleVersion: record.scoringRuleVersion || "",
    administrationVersion: record.administrationVersion || "",
    responseSchemaVersion: record.responseSchemaVersion ?? "",
    date,
    withinCurrentWindow
  };
  cell.details.push(detail);
  return detail;
}

function compactClassEvidenceDetail(student = {}, detail = {}) {
  const row = {
    studentId: getStudentId(student),
    studentName: getStudentName(student),
    ...detail
  };
  return EL_FORMAL_CLASS_EVIDENCE_SCHEMA.map(key => row[key] ?? "");
}

export function buildIndividualElFormalAssessmentReport({
  student = {},
  assessmentHistory = [],
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = "",
  now = new Date()
} = {}) {
  const studentId = getStudentId(student);
  // A student without an id must match NO attempts, not all of them —
  // otherwise their individual report absorbs the entire class's history.
  const records = (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .map(record => record?.formalEvidenceNormalized ? record : normalizeFormalAssessmentRecord(record))
    .filter(record => Boolean(studentId) && record.studentId === studentId);

  const letterMap = new Map(EL_FORMAL_LETTERS.map(letter => [
    letter,
    {
      letter,
      letterPair: `${letter.toUpperCase()}/${letter}`,
      uppercaseName: makeCell(),
      uppercaseSound: makeCell(),
      lowercaseName: makeCell(),
      lowercaseSound: makeCell(),
      lastAssessed: ""
    }
  ]));

  records.filter(isLetterAssessment).forEach(record => {
    (record.questionRecords || record.answers || []).forEach(question => {
      const letter = inferLetter(question);
      if (!letterMap.has(letter)) return;
      const letterCase = inferLetterCase(question);
      const mode = inferLetterMode(question);
      const cellKey = `${letterCase}${mode === "sound" ? "Sound" : "Name"}`;
      const row = letterMap.get(letter);
      addDetail(row[cellKey], question, record, now);
      row.lastAssessed = [row.lastAssessed, question.timestamp || record.completedAt].filter(Boolean).sort().at(-1) || "";
    });
  });

  const individualLetterMatrix = Array.from(letterMap.values()).map(row => ({
    ...row,
    uppercaseName: finalizeBinaryObservationCell(row.uppercaseName),
    uppercaseSound: finalizeBinaryObservationCell(row.uppercaseSound),
    lowercaseName: finalizeBinaryObservationCell(row.lowercaseName),
    lowercaseSound: finalizeBinaryObservationCell(row.lowercaseSound),
    lastAssessed: formatDate(row.lastAssessed)
  }));

  const patternUniverse = new Set(ADVANCED_PHONICS_PATTERNS);
  const patternMap = new Map();
  const ensurePattern = pattern => {
    const key = normalizeKey(pattern);
    if (!key) return null;
    patternUniverse.add(key);
    if (!patternMap.has(key)) {
      patternMap.set(key, {
        pattern: key,
        readingResult: makeCell(),
        soundResult: makeCell(),
        evidenceCount: 0,
        unscoredCount: 0,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        accuracy: null,
        status: "not_assessed",
        statusLabel: STATUS_LABELS.not_assessed,
        exampleWords: new Set(),
        lastAssessed: "",
        details: []
      });
    }
    return patternMap.get(key);
  };

  ADVANCED_PHONICS_PATTERNS.forEach(ensurePattern);
  records.filter(isAdvancedPhonicsAssessment).forEach(record => {
    (record.questionRecords || record.answers || []).forEach(question => {
      const pattern = inferAdvancedPattern(question);
      const row = ensurePattern(pattern);
      if (!row) return;
      const type = inferAdvancedPhonicsResultType(question);
      const targetCell = type === "sound" ? row.soundResult : row.readingResult;
      const detail = addDetail(targetCell, question, record, now);
      row.evidenceCount += 1;
      const example = normalizeKey(question.targetWord || question.correctAnswer || "");
      if (example && example !== pattern) row.exampleWords.add(example);
      const date = question.timestamp || record.completedAt || "";
      row.lastAssessed = [row.lastAssessed, date].filter(Boolean).sort().at(-1) || "";
      row.details.push({ ...detail, resultType: type });
    });
  });

  const individualAdvancedPhonicsMatrix = Array.from(patternMap.values()).map(row => {
    const readingResult = finalizeBinaryObservationCell(row.readingResult);
    const soundResult = finalizeBinaryObservationCell(row.soundResult);
    const attempts = readingResult.attempts + soundResult.attempts;
    const correct = readingResult.correct + soundResult.correct;
    const currentEvidenceCount = readingResult.currentEvidenceCount + soundResult.currentEvidenceCount;
    const staleEvidenceCount = readingResult.staleEvidenceCount + soundResult.staleEvidenceCount;
    const unscoredCount = readingResult.unscoredCount + soundResult.unscoredCount;
    const selectedPeriodAttempts = (
      readingResult.selectedPeriodAttempts + soundResult.selectedPeriodAttempts
    );
    const selectedPeriodCorrect = (
      readingResult.selectedPeriodCorrect + soundResult.selectedPeriodCorrect
    );
    const selectedPeriodUnscoredCount = (
      readingResult.selectedPeriodUnscoredCount + soundResult.selectedPeriodUnscoredCount
    );
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : null;
    const status = combineAdvancedPhonicsStatus(readingResult, soundResult);
    return {
      ...row,
      readingResult,
      soundResult,
      currentEvidenceCount,
      staleEvidenceCount,
      unscoredCount,
      attempts,
      selectedPeriodAttempts,
      correct,
      selectedPeriodCorrect,
      selectedPeriodUnscoredCount,
      incorrect: attempts - correct,
      accuracy,
      status,
      statusLabel: status === "mastered"
        ? "Yes"
        : status === "needs_support"
          ? "No"
          : "",
      exampleWords: Array.from(row.exampleWords).slice(0, 10),
      lastAssessed: formatDate(row.lastAssessed)
    };
  }).sort((a, b) => {
    const ai = ADVANCED_PHONICS_PATTERNS.indexOf(a.pattern);
    const bi = ADVANCED_PHONICS_PATTERNS.indexOf(b.pattern);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.pattern.localeCompare(b.pattern);
  });

  const resolvedBenchmarkScope = resolveElBenchmarkReportScope({
    records,
    benchmarkScope,
    benchmarkGrade,
    benchmarkWindow
  });
  const benchmarkEvidence = buildIndividualBenchmarkEvidence(records, resolvedBenchmarkScope);

  return {
    studentId,
    studentName: getStudentName(student),
    currentStatusWindowDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
    individualLetterMatrix,
    individualAdvancedPhonicsMatrix,
    ...benchmarkEvidence
  };
}

function countCellByStudent(rows = [], cellKey, students = []) {
  const counts = {
    mastered: 0,
    developing: 0,
    needs_support: 0,
    not_enough_evidence: 0,
    unscored_evidence: 0,
    not_assessed: 0,
    supportStudents: [],
    notEnoughResultsStudents: [],
    unscoredEvidenceStudents: [],
    evidenceRows: []
  };
  rows.forEach(({ student, matrixRow }) => {
    const cell = matrixRow?.[cellKey] || makeCell();
    const status = cell.status === "not_assessed" && cell.unscoredCount > 0
      ? "unscored_evidence"
      : cell.status || "not_assessed";
    counts[status] += 1;
    if (status === "needs_support") counts.supportStudents.push(getStudentName(student));
    if (status === "not_enough_evidence") {
      counts.notEnoughResultsStudents.push(getStudentName(student));
    }
    if (status === "unscored_evidence") counts.unscoredEvidenceStudents.push(getStudentName(student));
    (cell.details || []).forEach(detail => {
      counts.evidenceRows.push(compactClassEvidenceDetail(student, detail));
    });
  });
  counts.not_assessed += Math.max(0, students.length - rows.length);
  return counts;
}

function buildClassBenchmarkEvidence(individualReports = [], classStudents = [], benchmarkScope = {}) {
  const classBenchmarkMatrix = individualReports.map(({ student, report }) => {
    const cells = Object.fromEntries((report.individualBenchmarkProfile || []).map(profile => [
      profile.domainKey,
      cloneValue(profile, {})
    ]));
    return {
      studentId: getStudentId(student),
      studentName: getStudentName(student),
      cells,
      phonologicalAwareness: cells.phonologicalAwareness,
      encoding: cells.encoding,
      decoding: cells.decoding,
      oralReadingFluency: cells.oralReadingFluency
    };
  });

  const classBenchmarkDomainSummaries = EL_BENCHMARK_DOMAIN_DEFINITIONS.map(definition => {
    const studentEvidence = individualReports.map(({ student, report }) => {
      const profile = (report.individualBenchmarkProfile || []).find(row => row.assessmentId === definition.assessmentId);
      const detail = (report.individualBenchmarkDetails || []).find(row => row.attemptId === profile?.latestAttemptId);
      return { student, profile, detail };
    });
    const withSavedEvidence = studentEvidence.filter(row => row.profile?.hasSavedEvidence);
    const withScoredEvidence = withSavedEvidence.filter(row => {
      if (row.detail?.performanceSuppressed) return false;
      if (definition.assessmentId !== EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY) {
        return Number(row.detail?.administeredCount || 0) > 0;
      }
      return (row.detail?.passageRows || []).some(passage => {
        if (UNSCORED_RESPONSE_STATUSES.has(normalizeCompact(passage.responseStatus))) return false;
        return [passage.wcpm, passage.wordsAttempted, passage.wordsCorrect, passage.accuracyRate]
          .some(value => finiteNumber(value) !== null);
      });
    });
    const administrationCounts = {
      completed: 0,
      partial: 0,
      discontinued: 0,
      in_progress: 0,
      not_administered: 0,
      not_scorable: 0,
      no_record: 0
    };
    studentEvidence.forEach(({ profile }) => {
      const status = profile?.administrationStatus || "no_record";
      administrationCounts[status] = Number(administrationCounts[status] || 0) + 1;
    });

    const summary = {
      ...definition,
      grade: benchmarkScope.grade || "",
      benchmarkWindow: benchmarkScope.benchmarkWindow || "",
      benchmarkScopeLabel: benchmarkScope.label || benchmarkScopeLabel(benchmarkScope),
      totalStudents: classStudents.length,
      studentsWithSavedEvidence: withSavedEvidence.length,
      studentsWithScoredEvidence: withScoredEvidence.length,
      studentsWithoutSavedEvidence: Math.max(0, classStudents.length - withSavedEvidence.length),
      administrationCounts,
      candidatePlacements: withSavedEvidence
        .filter(row => isReportableElBenchmarkCandidatePlacement(row.profile.candidatePlacement))
        .map(row => ({ studentId: getStudentId(row.student), studentName: getStudentName(row.student), placement: row.profile.candidatePlacement })),
      confirmedPlacements: withSavedEvidence
        .filter(row => row.profile.confirmedPlacement)
        .map(row => ({ studentId: getStudentId(row.student), studentName: getStudentName(row.student), placement: row.profile.confirmedPlacement })),
      provisional: true,
      interpretation: "These are descriptive class results; no pass mark is applied."
    };

    if (definition.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS) {
      const strandMap = new Map();
      withSavedEvidence.forEach(({ detail }) => {
        (detail?.strandRows || []).forEach(strand => {
          const row = strandMap.get(strand.strand) || {
            strand: strand.strand,
            strandLabel: strand.strandLabel,
            studentsObserved: 0,
            administeredCount: 0,
            correctCount: 0,
            accuracyRate: null
          };
          if (strand.administeredCount > 0) row.studentsObserved += 1;
          row.administeredCount += Number(strand.administeredCount || 0);
          row.correctCount += Number(strand.correctCount || 0);
          strandMap.set(strand.strand, row);
        });
      });
      summary.metrics = {
        averageAccuracyRate: averageMetric(withScoredEvidence.map(row => row.detail.accuracyRate)),
        strandSummaries: Array.from(strandMap.values()).map(row => ({
          ...row,
          accuracyRate: percentage(row.correctCount, row.administeredCount)
        }))
      };
    } else if (definition.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING) {
      summary.metrics = {
        averageExactSpellingRate: averageMetric(withScoredEvidence.map(row => row.detail.exactSpellingRate)),
        averagePhonologicallyRepresentedRate: averageMetric(withScoredEvidence.map(row => row.detail.phonologicallyRepresentedRate)),
        exactSpellingCount: withSavedEvidence.reduce((sum, row) => sum + Number(row.detail?.exactSpellingCount || 0), 0),
        plausibleSpellingCount: withSavedEvidence.reduce((sum, row) => sum + Number(row.detail?.plausibleSpellingCount || 0), 0),
        notYetCount: withSavedEvidence.reduce((sum, row) => sum + Number(row.detail?.notYetCount || 0), 0),
        noResponseCount: withSavedEvidence.reduce((sum, row) => sum + Number(row.detail?.noResponseCount || 0), 0)
      };
    } else if (definition.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.DECODING) {
      summary.metrics = {
        averageAccuracyRate: averageMetric(withScoredEvidence.map(row => row.detail.accuracyRate)),
        averageAutomaticityRate: averageMetric(withScoredEvidence.map(row => row.detail.automaticityRate)),
        accurateCount: withSavedEvidence.reduce((sum, row) => sum + Number(row.detail?.accurateCount || 0), 0),
        automaticCount: withSavedEvidence.reduce((sum, row) => sum + Number(row.detail?.automaticCount || 0), 0),
        stoppedOrDiscontinuedStudents: withSavedEvidence
          .filter(row => row.detail?.stopEvidence?.triggered || row.profile.administrationStatus === "discontinued")
          .map(row => getStudentName(row.student))
      };
    } else {
      summary.metrics = {
        averageWcpm: averageMetric(withScoredEvidence.map(row => row.detail.wcpm), 1),
        averageAccuracyRate: averageMetric(withScoredEvidence.map(row => row.detail.accuracyRate)),
        averageProsody: averageMetric(withScoredEvidence.map(row => row.detail.prosodyAverage), 2)
      };
    }
    return summary;
  });

  const classBenchmarkDetails = individualReports.flatMap(({ student, report }) => (
    (report.individualBenchmarkDetails || []).map(detail => ({
      studentId: getStudentId(student),
      studentName: getStudentName(student),
      ...cloneValue(detail, {})
    }))
  ));

  return {
    classBenchmarkMatrix,
    classBenchmarkDomainSummaries,
    classBenchmarkDetails
  };
}

export function buildClassElFormalAssessmentReport({
  students = [],
  assessmentHistory = [],
  classId = "",
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = "",
  now = new Date()
} = {}) {
  const classStudents = (Array.isArray(students) ? students : [])
    .filter(student => !classId || getClassId(student) === classId);
  const classStudentIds = new Set(classStudents.map(getStudentId).filter(Boolean));
  const classRecords = (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .map(record => record?.formalEvidenceNormalized ? record : normalizeFormalAssessmentRecord(record))
    .filter(record => (
      (!classId || !record.classId || record.classId === classId) &&
      (!classStudentIds.size || !record.studentId || classStudentIds.has(record.studentId))
    ));
  const resolvedBenchmarkScope = resolveElBenchmarkReportScope({
    records: classRecords,
    benchmarkScope,
    benchmarkGrade,
    benchmarkWindow
  });

  const individualReports = classStudents.map(student => ({
    student,
    report: buildIndividualElFormalAssessmentReport({
      student,
      assessmentHistory: classRecords,
      benchmarkScope: resolvedBenchmarkScope,
      now
    })
  }));

  const classLetterMatrix = EL_FORMAL_LETTERS.map(letter => {
    const letterRows = individualReports.map(({ student, report }) => ({
      student,
      matrixRow: report.individualLetterMatrix.find(row => row.letter === letter)
    }));
    return {
      letter,
      letterPair: `${letter.toUpperCase()}/${letter}`,
      uppercaseName: countCellByStudent(letterRows, "uppercaseName", classStudents),
      uppercaseSound: countCellByStudent(letterRows, "uppercaseSound", classStudents),
      lowercaseName: countCellByStudent(letterRows, "lowercaseName", classStudents),
      lowercaseSound: countCellByStudent(letterRows, "lowercaseSound", classStudents)
    };
  });

  const patternSet = new Set(ADVANCED_PHONICS_PATTERNS);
  individualReports.forEach(({ report }) => {
    report.individualAdvancedPhonicsMatrix.forEach(row => patternSet.add(row.pattern));
  });

  const classAdvancedPhonicsMatrix = Array.from(patternSet).map(pattern => {
    const rows = individualReports.map(({ student, report }) => ({
      student,
      row: report.individualAdvancedPhonicsMatrix.find(item => item.pattern === pattern)
    }));
    const withEvidence = rows.filter(item => item.row?.evidenceCount > 0);
    const attempted = withEvidence.filter(item => item.row?.attempts > 0);
    const unscored = withEvidence.filter(item => (
      item.row.status === "unscored_evidence" ||
      (item.row.status === "not_assessed" && item.row.unscoredCount > 0)
    ));
    const notEnough = withEvidence.filter(item => item.row.status === "not_enough_evidence");
    const mastered = withEvidence.filter(item => item.row.status === "mastered");
    const developing = withEvidence.filter(item => item.row.status === "developing");
    const support = withEvidence.filter(item => item.row.status === "needs_support");
    const ready = [...mastered, ...developing, ...support];
    return {
      pattern,
      evidenceStudents: withEvidence.length,
      attemptedStudents: attempted.length,
      unscoredEvidenceStudents: unscored.length,
      notEnoughResultsStudents: notEnough.length,
      masteredStudents: mastered.length,
      developingStudents: developing.length,
      needsSupportStudents: support.length,
      notAssessedStudents: Math.max(0, classStudents.length - withEvidence.length),
      masteryPercentage: ready.length ? Math.round((mastered.length / ready.length) * 100) : null,
      studentsNeedingSupport: support.map(item => getStudentName(item.student)),
      studentsWithNotEnoughResults: notEnough.map(item => getStudentName(item.student)),
      studentsWithUnscoredEvidence: unscored.map(item => getStudentName(item.student)),
      evidenceRows: withEvidence.flatMap(item => (
        (item.row.details || []).map(detail => compactClassEvidenceDetail(item.student, detail))
      ))
    };
  }).sort((a, b) => {
    const ai = ADVANCED_PHONICS_PATTERNS.indexOf(a.pattern);
    const bi = ADVANCED_PHONICS_PATTERNS.indexOf(b.pattern);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.pattern.localeCompare(b.pattern);
  });

  const benchmarkEvidence = buildClassBenchmarkEvidence(
    individualReports,
    classStudents,
    resolvedBenchmarkScope
  );

  return {
    benchmarkScope: resolvedBenchmarkScope,
    currentStatusWindowDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
    classEvidenceSchema: [...EL_FORMAL_CLASS_EVIDENCE_SCHEMA],
    classLetterMatrix,
    classAdvancedPhonicsMatrix,
    ...benchmarkEvidence
  };
}

export const EL_FORMAL_STATUS_LABELS = STATUS_LABELS;
