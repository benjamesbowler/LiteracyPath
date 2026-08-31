import {
  ASSESSMENT_ADMINISTRATION_STATUSES,
  ASSESSMENT_RESPONSE_STATUSES,
  mergeAssessmentAttemptRecords
} from "./assessmentHistoryStore.js";
import {
  buildIndividualElFormalAssessmentReport,
  EL_BENCHMARK_ASSESSMENT_IDS
} from "./elFormalAssessmentReportBuilder.js";
import {
  createReportingConcept,
  createReportingEvidence,
  dedupeReportingEvidence,
  normalizeReportingKey,
  reportingStatus,
  REPORTING_DOMAIN_LABELS,
  REPORTING_EVIDENCE_KINDS,
  REPORTING_STATUS_IDS,
  REPORTING_STATUS_LABELS,
  resolveWholeChildConcepts
} from "./reportingEvidenceModel.js";
import {
  finalSoundExpectedItemKeys,
  initialSoundExpectedItemKeys
} from "./coverageExpectations.js";
import { normalizeDecodingSupportEvent } from "../utils/guidedReading/decodingSupport.js";
import {
  LEARNING_CONCLUSION_SCOPES,
  LEARNING_EVIDENCE_POLICY,
  LEARNING_STATUS_IDS,
  evaluateLearningConclusion,
  isLearningEvidenceRecent,
  rawLearningStatus
} from "../policy/learningPolicy.js";
import {
  isHfwClozeFormat,
  isHfwSentenceSpellFormat
} from "./hfwAssessmentFormatConfig.js";
import { isHfwSpellingQuestionCandidate } from "./isHfwSpellingQuestion.js";
import { benchmarkWindowLabel } from "./elBenchmarkReportScope.js";
import {
  assessmentAttemptsToSkillLedger,
  computeSkillStatus,
  SKILL_STATUS_IDS
} from "../policy/skillStatusPolicy.js";
import { buildEvidenceHealth } from "./evidenceHealth.js";

export const STUDENT_REPORTING_WORKSPACE_SCHEMA_VERSION = 1;

export const EL_ASSESSMENT_DEFINITIONS = Object.freeze([
  Object.freeze({
    number: 1,
    assessmentId: "el_letter_assessment",
    title: "Letter Name and Sound Recognition",
    shortTitle: "Letters and sounds",
    reportingMode: "scored"
  }),
  Object.freeze({
    number: 2,
    assessmentId: "advanced_phonics_patterns",
    title: "Advanced Phoneme and Pattern Recognition",
    shortTitle: "Advanced sounds",
    reportingMode: "scored"
  }),
  Object.freeze({
    number: 3,
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    title: "Phonological and Phonemic Awareness",
    shortTitle: "Phonological awareness",
    reportingMode: "descriptive"
  }),
  Object.freeze({
    number: 4,
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
    title: "Encoding and Spelling",
    shortTitle: "Encoding",
    reportingMode: "descriptive"
  }),
  Object.freeze({
    number: 5,
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.DECODING,
    title: "Decoding and Automaticity",
    shortTitle: "Decoding",
    reportingMode: "descriptive"
  }),
  Object.freeze({
    number: 6,
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY,
    title: "Oral Reading Fluency",
    shortTitle: "Reading fluency",
    reportingMode: "descriptive"
  })
]);

const EL_ASSESSMENT_IDS = new Set(EL_ASSESSMENT_DEFINITIONS.map(row => row.assessmentId));
const DESCRIPTIVE_EL_IDS = new Set(
  EL_ASSESSMENT_DEFINITIONS
    .filter(row => row.reportingMode === "descriptive")
    .map(row => row.assessmentId)
);
const UNSCORED_RESPONSE_STATUSES = new Set([
  ASSESSMENT_RESPONSE_STATUSES.RECORDED,
  ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED,
  ASSESSMENT_RESPONSE_STATUSES.DISCONTINUED,
  ASSESSMENT_RESPONSE_STATUSES.NOT_SCORABLE
]);

function cloneValue(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function finiteNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function finiteTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isTerminalAdministrationStatus(value = "") {
  return ![
    ASSESSMENT_ADMINISTRATION_STATUSES.IN_PROGRESS,
    ASSESSMENT_ADMINISTRATION_STATUSES.PARTIAL
  ].includes(normalizeReportingKey(value));
}

function latestCompletedOrSavedPartialAttempt(attempts = []) {
  const rows = asArray(attempts);
  return rows.find(attempt => isTerminalAdministrationStatus(attempt.administrationStatus))
    || rows.find(attempt => (
      normalizeReportingKey(attempt.administrationStatus)
      === ASSESSMENT_ADMINISTRATION_STATUSES.PARTIAL
    ))
    || null;
}

function latestDate(values = []) {
  return values.filter(Boolean).sort().at(-1) || "";
}

function getStudentId(student = {}, explicitStudentId = "") {
  return String(explicitStudentId || student.id || student.studentId || "");
}

function getStudentName(student = {}) {
  return student.name || student.studentName || "Student";
}

function getClassId(student = {}) {
  return student.classId || student.class_id || "";
}

function assessmentIdForAttempt(attempt = {}) {
  return normalizeReportingKey(attempt.assessmentType || attempt.assessmentId || attempt.skillId);
}

function flattenRecordCount(value) {
  return asArray(value).flat(Infinity).filter(Boolean).length;
}

/**
 * Canonicalizes local/cloud attempt copies by attemptId before any report is
 * built. A student id is required so an empty selection can never absorb the
 * whole class's history.
 */
export function getCanonicalStudentAssessmentAttempts({
  student = {},
  studentId = "",
  assessmentHistory = [],
  localAssessmentHistory = [],
  cloudAssessmentHistory = []
} = {}) {
  const resolvedStudentId = getStudentId(student, studentId);
  if (!resolvedStudentId) return [];
  return mergeAssessmentAttemptRecords(
    assessmentHistory,
    localAssessmentHistory,
    cloudAssessmentHistory
  ).filter(attempt => attempt.studentId === resolvedStudentId);
}

function dedupeAttemptQuestions(attempt = {}) {
  const byIdentity = new Map();
  asArray(attempt.questionRecords).forEach((question, index) => {
    const identity = question.questionId || [
      question.itemType,
      question.itemKey,
      question.templateType,
      question.order || index + 1
    ].map(normalizeReportingKey).join("::");
    const current = byIdentity.get(identity);
    const currentSize = current ? JSON.stringify(current).length : -1;
    const candidateSize = JSON.stringify(question).length;
    const currentTimestamp = finiteTimestamp(current?.outcomeRecordedAt || current?.timestamp);
    const candidateTimestamp = finiteTimestamp(question.outcomeRecordedAt || question.timestamp);
    if (
      !current ||
      candidateTimestamp > currentTimestamp ||
      (candidateTimestamp === currentTimestamp && candidateSize >= currentSize)
    ) byIdentity.set(identity, question);
  });
  return Array.from(byIdentity.entries()).map(([identity, question]) => ({ identity, question }));
}

function responseStatusCandidate(question = {}) {
  const status = normalizeReportingKey(question.responseStatus);
  if (status === ASSESSMENT_RESPONSE_STATUSES.CORRECT) return REPORTING_STATUS_IDS.SECURE;
  if (status === ASSESSMENT_RESPONSE_STATUSES.SELF_CORRECTED) return REPORTING_STATUS_IDS.DEVELOPING;
  if ([
    ASSESSMENT_RESPONSE_STATUSES.INCORRECT,
    ASSESSMENT_RESPONSE_STATUSES.NO_RESPONSE,
    ASSESSMENT_RESPONSE_STATUSES.SKIPPED
  ].includes(status)) return REPORTING_STATUS_IDS.NEEDS_TEACHING;
  return null;
}

function isQuestionScorable(question = {}, attempt = {}) {
  if ([
    ASSESSMENT_ADMINISTRATION_STATUSES.NOT_ADMINISTERED,
    ASSESSMENT_ADMINISTRATION_STATUSES.NOT_SCORABLE
  ].includes(attempt.administrationStatus)) return false;
  return !UNSCORED_RESPONSE_STATUSES.has(normalizeReportingKey(question.responseStatus));
}

function cleanWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z']/g, "");
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function letterVariant(question = {}) {
  const target = String(question.targetLetter || question.correctAnswer || "").trim();
  if (!target) return "";
  return target === target.toUpperCase() && target !== target.toLowerCase()
    ? "uppercase"
    : "lowercase";
}

function readablePattern(value = "") {
  return String(value || "").replace(/_/g, " ").trim();
}

function canonicalPhonemeKey(value = "") {
  const normalized = normalizeReportingKey(value);
  if (["c", "k"].includes(normalized)) return "k";
  if (["q", "qu"].includes(normalized)) return "kw";
  if (normalized === "x") return "ks";
  return normalized;
}

/** Keep constructs separate: a letter name is not its sound, and reading a
 * word in a book is not isolated decoding or spelling. */
export function getReportingConceptForAssessmentQuestion(question = {}, attempt = {}) {
  const assessmentId = assessmentIdForAttempt(attempt);
  const skillId = normalizeReportingKey(question.skillId || attempt.skillId);
  const itemType = normalizeReportingKey(question.itemType);
  const templateType = normalizeReportingKey(question.templateType);
  const itemKey = normalizeReportingKey(question.itemKey);

  if (assessmentId === "el_letter_assessment" || ["letter_name", "letter_sound"].includes(itemType)) {
    const letter = cleanWord(question.targetLetter || question.itemKey || question.correctAnswer).slice(0, 1);
    const construct = itemType === "letter_sound" || templateType.includes("sound")
      ? "letter_sound"
      : "letter_name";
    const variant = letterVariant(question);
    return createReportingConcept({
      domain: "alphabet_knowledge",
      construct,
      key: letter,
      variant,
      label: `${variant ? titleCase(variant) + " " : ""}${letter.toUpperCase()}: ${construct === "letter_sound" ? "letter sound" : "letter name"}`
    });
  }

  if (assessmentId === "advanced_phonics_patterns") {
    const pattern = normalizeReportingKey(question.targetPattern || question.pattern || question.itemKey);
    if (templateType.includes("word") || (!templateType.includes("sound") && question.targetWord)) {
      const word = cleanWord(question.targetWord || question.correctAnswer) || pattern;
      return createReportingConcept({
        domain: "decoding",
        construct: "isolated_word_reading",
        key: word,
        variant: pattern,
        label: `Read “${word}”${pattern ? ` (${readablePattern(pattern)})` : ""}`
      });
    }
    return createReportingConcept({
      domain: "phonics",
      construct: "grapheme_sound",
      key: pattern,
      label: `Sound for ${readablePattern(pattern)}`
    });
  }

  if (itemType === "initial_sound" || skillId === "initial_sounds") {
    const key = canonicalPhonemeKey(
      question.targetSound || question.targetLetter || question.itemKey || cleanWord(question.targetWord).slice(0, 1)
    );
    return createReportingConcept({
      domain: "phonological_awareness",
      construct: "initial_sound",
      key,
      label: `Initial sound /${readablePattern(key)}/`
    });
  }

  if (itemType === "final_sound" || skillId === "final_sounds") {
    const targetWord = cleanWord(question.targetWord);
    const key = canonicalPhonemeKey(
      question.targetSound || question.targetPattern || question.itemKey || targetWord.slice(-1)
    );
    return createReportingConcept({
      domain: "phonological_awareness",
      construct: "final_sound",
      key,
      label: `Final sound /${readablePattern(key)}/`
    });
  }

  if (itemType === "rhyming_family" || skillId === "rhyming") {
    const key = itemKey || normalizeReportingKey(question.targetPattern || question.targetWord);
    return createReportingConcept({
      domain: "phonological_awareness",
      construct: "rhyme_recognition",
      key,
      label: `Rhyming family ${readablePattern(key)}`
    });
  }

  if (itemType === "short_vowel" || ["cvc_short_vowels", "short_vowel_discrimination"].includes(skillId)) {
    const key = (
      itemKey || normalizeReportingKey(
        question.diagnosticTarget || question.targetPattern || question.targetSound
      )
    ).replace(/^short_/, "");
    return createReportingConcept({
      domain: "phonics",
      construct: "short_vowel",
      key,
      label: key ? `Short vowel “${key}”` : "Short vowel"
    });
  }

  if (itemType === "sight_word" || skillId.startsWith("hfw")) {
    const word = cleanWord(question.targetWord || question.itemKey || question.correctAnswer);
    const format = [
      question.formatType,
      question.templateType,
      question.templateKey,
      question.runtimeTemplateKey,
      question.questionType
    ].find(Boolean) || "";
    const normalizedFormat = normalizeReportingKey(format);
    const spelling = isHfwSentenceSpellFormat(format)
      || normalizedFormat === "hfw_sentence_spell"
      || normalizedFormat.startsWith("hfw_sentence_spell_")
      || normalizedFormat.startsWith("hfw_listen_spell")
      || isHfwSpellingQuestionCandidate({ ...question, skillId });
    if (spelling) {
      return createReportingConcept({
        domain: "encoding",
        construct: "word_spelling",
        key: word,
        label: `Spell “${word}” in a sentence`
      });
    }
    if (
      isHfwClozeFormat(format)
      || normalizedFormat === "hfw_sentence_cloze"
      || normalizedFormat.startsWith("hfw_sentence_cloze_")
    ) {
      return createReportingConcept({
        domain: "literacy_skill",
        construct: "word_in_context",
        key: word,
        label: `Choose “${word}” in a sentence`
      });
    }
    return createReportingConcept({
      domain: "decoding",
      construct: "isolated_word_reading",
      key: word,
      label: `Read “${word}” in isolation`
    });
  }

  if (itemType.includes("phonics_pattern")) {
    const pattern = normalizeReportingKey(question.targetPattern || question.itemKey || question.correctAnswer);
    return createReportingConcept({
      domain: "phonics",
      construct: "grapheme_sound",
      key: pattern,
      label: `Sound for ${readablePattern(pattern)}`
    });
  }

  const key = itemKey || normalizeReportingKey(
    question.targetPattern || question.targetWord || question.correctAnswer || question.questionId
  );
  return createReportingConcept({
    domain: "literacy_skill",
    construct: itemType || skillId || "skill_item",
    key,
    label: titleCase(key || question.prompt || attempt.skillName || "Literacy skill")
  });
}

function rawAssessmentQuestionEvidence({
  question,
  identity,
  attempt,
  sourceArea,
  sourceLabel,
  evidenceKind = REPORTING_EVIDENCE_KINDS.FORMAL,
  descriptive = false
}) {
  const concept = getReportingConceptForAssessmentQuestion(question, attempt);
  const scorable = !descriptive && isQuestionScorable(question, attempt);
  const statusCandidate = scorable ? responseStatusCandidate(question) : null;
  const exactCorrect = scorable && statusCandidate === REPORTING_STATUS_IDS.SECURE;
  const partialAccuracy = scorable && statusCandidate === REPORTING_STATUS_IDS.DEVELOPING
    ? 50
    : null;
  return createReportingEvidence({
    evidenceId: `${sourceArea}:${attempt.attemptId}:${identity}`,
    studentId: attempt.studentId,
    sourceArea,
    sourceLabel,
    sourceRecordId: attempt.attemptId,
    sourceRecordType: assessmentIdForAttempt(attempt),
    evidenceKind: descriptive ? REPORTING_EVIDENCE_KINDS.DESCRIPTIVE : evidenceKind,
    concept,
    outcome: question.responseStatus || (question.isCorrect ? "correct" : "incorrect"),
    statusCandidate,
    observedAt: question.timestamp || attempt.completedAt,
    administrationStatus: attempt.administrationStatus,
    scorable,
    knowledgeEligible: !descriptive,
    descriptive,
    details: {
      prompt: question.prompt,
      targetLetter: question.targetLetter,
      targetSound: question.targetSound,
      targetPattern: question.targetPattern,
      targetWord: question.targetWord,
      correctAnswer: question.correctAnswer,
      selectedAnswer: question.selectedAnswer,
      responseText: question.responseText,
      responseStatus: question.responseStatus,
      isCorrect: question.isCorrect,
      pointsEarned: question.pointsEarned,
      pointsPossible: question.pointsPossible,
      formatType: question.formatType || question.templateType || question.questionType || "",
      metadata: question.metadata,
      observations: scorable ? 1 : 0,
      correct: scorable ? Number(exactCorrect) : null,
      accuracy: scorable ? partialAccuracy ?? Number(exactCorrect) * 100 : null,
      independentAttempts: scorable ? 1 : 0
    },
    provenance: {
      attemptId: attempt.attemptId,
      questionId: question.questionId,
      answerEventId: question.answerEventId || question.metadata?.answerEventId || "",
      questionIdentity: identity,
      assessmentType: assessmentIdForAttempt(attempt),
      formatType: question.formatType || question.templateType || question.questionType || "",
      formVersion: attempt.formVersion,
      contentVersion: attempt.contentVersion,
      scoringVersion: attempt.scoringVersion || attempt.scoringRuleVersion,
      schemaVersion: attempt.schemaVersion
    }
  });
}

function aggregateDirectEvidence(events = [], {
  sourceArea,
  sourceLabel,
  sourceRecordType,
  evidenceKind = REPORTING_EVIDENCE_KINDS.FORMAL,
  aggregateId = "current"
} = {}) {
  const byConcept = new Map();
  events.filter(row => row.statusCandidate && row.knowledgeEligible).forEach(row => {
    const group = byConcept.get(row.concept.conceptId) || [];
    group.push(row);
    byConcept.set(row.concept.conceptId, group);
  });

  return Array.from(byConcept.values()).map(rows => {
    const statuses = new Set(rows.map(row => row.statusCandidate));
    const statusCandidate = statuses.size === 1
      ? rows[0].statusCandidate
      : statuses.has(REPORTING_STATUS_IDS.SECURE)
        ? REPORTING_STATUS_IDS.DEVELOPING
        : REPORTING_STATUS_IDS.NEEDS_TEACHING;
    const correct = rows.filter(row => row.statusCandidate === REPORTING_STATUS_IDS.SECURE).length;
    return createReportingEvidence({
      evidenceId: `${sourceArea}:${aggregateId}:${rows[0].concept.conceptId}`,
      studentId: rows[0].studentId,
      sourceArea,
      sourceLabel,
      sourceRecordId: rows[0].sourceRecordId,
      sourceRecordType,
      evidenceKind,
      concept: rows[0].concept,
      outcome: statusCandidate,
      statusCandidate,
      observedAt: latestDate(rows.map(row => row.observedAt)),
      administrationStatus: rows[0].administrationStatus,
      scorable: true,
      knowledgeEligible: true,
      details: {
        observations: rows.length,
        correct,
        accuracy: rows.length ? Math.round((correct / rows.length) * 100) : null,
        contributingEvidenceIds: rows.map(row => row.evidenceId)
      },
      provenance: {
        derivedFromEvidenceIds: rows.map(row => row.evidenceId),
        sourceRecordIds: [...new Set(rows.map(row => row.sourceRecordId))]
      }
    });
  });
}

function attemptDisplayRow(attempt = {}) {
  return {
    attemptId: attempt.attemptId,
    completedAt: attempt.completedAt,
    updatedAt: attempt.updatedAt,
    administrationStatus: attempt.administrationStatus,
    scoreStatus: attempt.scoreStatus,
    correctCount: attempt.correctCount,
    totalQuestions: attempt.totalQuestions,
    accuracy: attempt.accuracy,
    passed: attempt.passed,
    status: attempt.status,
    formVersion: attempt.formVersion,
    contentVersion: attempt.contentVersion,
    scoringVersion: attempt.scoringVersion || attempt.scoringRuleVersion,
    grade: attempt.grade || attempt.gradePath,
    benchmarkWindow: attempt.benchmarkWindow,
    note: attempt.note,
    raw: attempt
  };
}

function attemptHasScorableResult(attempt = null, evidence = []) {
  if (!attempt) return asArray(evidence).some(row => row?.statusCandidate);
  if ([
    ASSESSMENT_ADMINISTRATION_STATUSES.NOT_ADMINISTERED,
    ASSESSMENT_ADMINISTRATION_STATUSES.NOT_SCORABLE
  ].includes(attempt.administrationStatus)) return false;
  if (asArray(evidence).some(row => row?.statusCandidate)) return true;
  return Number(attempt.totalQuestions || 0) > 0 && finiteNumber(attempt.correctCount) !== null;
}

function scoredAssessmentStatus(attempt = null, fallbackEvidence = [], now = new Date()) {
  if (attempt) {
    if ([
      ASSESSMENT_ADMINISTRATION_STATUSES.NOT_ADMINISTERED,
      ASSESSMENT_ADMINISTRATION_STATUSES.NOT_SCORABLE
    ].includes(attempt.administrationStatus)) return reportingStatus(REPORTING_STATUS_IDS.NOT_CHECKED);
    if ([
      ASSESSMENT_ADMINISTRATION_STATUSES.PARTIAL,
      ASSESSMENT_ADMINISTRATION_STATUSES.IN_PROGRESS
    ].includes(attempt.administrationStatus)) return reportingStatus(REPORTING_STATUS_IDS.DEVELOPING);
    if (!attemptHasScorableResult(attempt, fallbackEvidence)) {
      return reportingStatus(REPORTING_STATUS_IDS.NOT_CHECKED);
    }
    if (attempt.administrationStatus === ASSESSMENT_ADMINISTRATION_STATUSES.DISCONTINUED) {
      return reportingStatus(REPORTING_STATUS_IDS.DEVELOPING);
    }
    const conclusion = evaluateLearningConclusion({
      scope: LEARNING_CONCLUSION_SCOPES.SKILL,
      accuracy: attempt.accuracy,
      attempts: attempt.scoredCount || attempt.totalQuestions,
      skillDiversity: 1,
      observedAt: attempt.completedAt,
      now
    });
    if (!conclusion.ready) {
      return reportingStatus(REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
    }
    return reportingStatus(
      conclusion.status.id === LEARNING_STATUS_IDS.SECURE
        ? REPORTING_STATUS_IDS.SECURE
        : conclusion.status.id === LEARNING_STATUS_IDS.DEVELOPING
          ? REPORTING_STATUS_IDS.DEVELOPING
          : REPORTING_STATUS_IDS.NEEDS_TEACHING
    );
  }
  const scored = fallbackEvidence.filter(row => row.statusCandidate);
  if (!scored.length) return reportingStatus(REPORTING_STATUS_IDS.NOT_CHECKED);
  const correct = scored.filter(row => row.statusCandidate === REPORTING_STATUS_IDS.SECURE).length;
  const accuracy = Math.round((correct / scored.length) * 100);
  const conclusion = evaluateLearningConclusion({
    scope: LEARNING_CONCLUSION_SCOPES.SKILL,
    accuracy,
    attempts: scored.length,
    skillDiversity: 1,
    observedAt: scored.map(row => row.observedAt).filter(Boolean).sort().at(-1) || "",
    now
  });
  if (!conclusion.ready) {
    return reportingStatus(REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  }
  return reportingStatus(
    conclusion.status.id === LEARNING_STATUS_IDS.SECURE
      ? REPORTING_STATUS_IDS.SECURE
      : conclusion.status.id === LEARNING_STATUS_IDS.DEVELOPING
        ? REPORTING_STATUS_IDS.DEVELOPING
        : REPORTING_STATUS_IDS.NEEDS_TEACHING
  );
}

function administrationLabel(status = "") {
  const normalized = normalizeReportingKey(status);
  const labels = {
    completed: "Completed",
    partial: "Partially completed",
    in_progress: "In progress",
    discontinued: "Discontinued; results kept",
    not_administered: "Not administered",
    not_scorable: "Not scorable"
  };
  return labels[normalized] || "Not checked";
}

function buildLegacyLetterEvidence({ letterAssessment = [], studentId = "" } = {}) {
  return asArray(letterAssessment).flatMap((row, index) => {
    const letter = String(row.letter || "");
    const base = {
      studentId,
      sourceArea: "el_assessments",
      sourceLabel: "EL Assessments",
      sourceRecordId: "legacy_letter_assessment",
      sourceRecordType: "el_letter_assessment",
      evidenceKind: REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
      observedAt: row.updatedAt || row.completedAt || "",
      administrationStatus: "legacy_fallback",
      scorable: true,
      knowledgeEligible: true,
      provenance: { legacyFallback: true, legacyIndex: index }
    };
    const variant = normalizeReportingKey(row.type) || (
      letter === letter.toUpperCase() ? "uppercase" : "lowercase"
    );
    const letterKey = cleanWord(letter).slice(0, 1);
    return [
      createReportingEvidence({
        ...base,
        evidenceId: `el_assessments:legacy_letter:${index}:name`,
        concept: {
          domain: "alphabet_knowledge",
          construct: "letter_name",
          key: letterKey,
          variant,
          label: `${titleCase(variant)} ${letterKey.toUpperCase()}: letter name`
        },
        outcome: row.knowsName ? "correct" : "incorrect",
        statusCandidate: row.knowsName ? REPORTING_STATUS_IDS.SECURE : REPORTING_STATUS_IDS.NEEDS_TEACHING,
        details: {
          rawLegacyResult: row,
          check: "name",
          observations: 1,
          correct: row.knowsName ? 1 : 0,
          accuracy: row.knowsName ? 100 : 0,
          independentAttempts: 1
        }
      }),
      createReportingEvidence({
        ...base,
        evidenceId: `el_assessments:legacy_letter:${index}:sound`,
        concept: {
          domain: "alphabet_knowledge",
          construct: "letter_sound",
          key: letterKey,
          variant,
          label: `${titleCase(variant)} ${letterKey.toUpperCase()}: letter sound`
        },
        outcome: row.knowsSound ? "correct" : "incorrect",
        statusCandidate: row.knowsSound ? REPORTING_STATUS_IDS.SECURE : REPORTING_STATUS_IDS.NEEDS_TEACHING,
        details: {
          rawLegacyResult: row,
          check: "sound",
          observations: 1,
          correct: row.knowsSound ? 1 : 0,
          accuracy: row.knowsSound ? 100 : 0,
          independentAttempts: 1
        }
      })
    ];
  });
}

function buildLegacyPatternEvidence({ patternAssessment = [], studentId = "" } = {}) {
  return asArray(patternAssessment).flatMap((row, index) => {
    const pattern = normalizeReportingKey(row.pattern);
    const word = cleanWord(row.exampleWord);
    const base = {
      studentId,
      sourceArea: "el_assessments",
      sourceLabel: "EL Assessments",
      sourceRecordId: "legacy_advanced_phonics_patterns",
      sourceRecordType: "advanced_phonics_patterns",
      evidenceKind: REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
      observedAt: row.updatedAt || row.completedAt || "",
      administrationStatus: "legacy_fallback",
      scorable: true,
      knowledgeEligible: true,
      provenance: { legacyFallback: true, legacyIndex: index }
    };
    return [
      createReportingEvidence({
        ...base,
        evidenceId: `el_assessments:legacy_pattern:${index}:sound`,
        concept: {
          domain: "phonics",
          construct: "grapheme_sound",
          key: pattern,
          label: `Sound for ${readablePattern(pattern)}`
        },
        outcome: row.soundCorrect ? "correct" : "incorrect",
        statusCandidate: row.soundCorrect ? REPORTING_STATUS_IDS.SECURE : REPORTING_STATUS_IDS.NEEDS_TEACHING,
        details: {
          rawLegacyResult: row,
          check: "sound",
          observations: 1,
          correct: row.soundCorrect ? 1 : 0,
          accuracy: row.soundCorrect ? 100 : 0,
          independentAttempts: 1
        }
      }),
      createReportingEvidence({
        ...base,
        evidenceId: `el_assessments:legacy_pattern:${index}:word`,
        concept: {
          domain: "decoding",
          construct: "isolated_word_reading",
          key: word || pattern,
          variant: pattern,
          label: `Read “${word || readablePattern(pattern)}”${pattern ? ` (${readablePattern(pattern)})` : ""}`
        },
        outcome: row.wordCorrect ? "correct" : "incorrect",
        statusCandidate: row.wordCorrect ? REPORTING_STATUS_IDS.SECURE : REPORTING_STATUS_IDS.NEEDS_TEACHING,
        details: {
          rawLegacyResult: row,
          check: "word",
          observations: 1,
          correct: row.wordCorrect ? 1 : 0,
          accuracy: row.wordCorrect ? 100 : 0,
          independentAttempts: 1
        }
      })
    ];
  });
}

/** Build the strict EL report. Assessments 1/2 use completed attempts whenever
 * they exist; legacy state is used only when that assessment has no history.
 * Assessments 3-6 retain the descriptive scorer's output and never emit a
 * generic Whole Child mastery status. */
export function buildElAssessmentReportModel({
  student = {},
  studentId = "",
  assessmentHistory = [],
  localAssessmentHistory = [],
  cloudAssessmentHistory = [],
  letterAssessment = [],
  patternAssessment = [],
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = "",
  now = new Date()
} = {}) {
  const resolvedStudentId = getStudentId(student, studentId);
  const resolvedStudent = { ...student, id: resolvedStudentId };
  const allAttempts = getCanonicalStudentAssessmentAttempts({
    student: resolvedStudent,
    assessmentHistory,
    localAssessmentHistory,
    cloudAssessmentHistory
  });
  const attempts = allAttempts.filter(attempt => EL_ASSESSMENT_IDS.has(assessmentIdForAttempt(attempt)));
  const attemptsByType = new Map();
  attempts.forEach(attempt => {
    const type = assessmentIdForAttempt(attempt);
    const rows = attemptsByType.get(type) || [];
    rows.push(attempt);
    attemptsByType.set(type, rows);
  });
  attemptsByType.forEach(rows => rows.sort((a, b) => finiteTimestamp(b.completedAt) - finiteTimestamp(a.completedAt)));

  const formalReport = buildIndividualElFormalAssessmentReport({
    student: resolvedStudent,
    assessmentHistory: attempts,
    benchmarkScope,
    benchmarkGrade,
    benchmarkWindow
  });
  const scopedDescriptiveAttemptIds = new Set(
    asArray(formalReport.individualBenchmarkDetails).map(row => row.attemptId).filter(Boolean)
  );
  const rawEvidence = [];
  attempts.forEach(attempt => {
    const descriptive = DESCRIPTIVE_EL_IDS.has(assessmentIdForAttempt(attempt));
    dedupeAttemptQuestions(attempt).forEach(({ identity, question }) => {
      rawEvidence.push(rawAssessmentQuestionEvidence({
        question,
        identity,
        attempt,
        sourceArea: "el_assessments",
        sourceLabel: "EL Assessments",
        descriptive
      }));
    });
  });

  const legacyByType = new Map([
    ["el_letter_assessment", buildLegacyLetterEvidence({ letterAssessment, studentId: resolvedStudentId })],
    ["advanced_phonics_patterns", buildLegacyPatternEvidence({ patternAssessment, studentId: resolvedStudentId })]
  ]);
  const legacyEvidenceUsed = [];
  ["el_letter_assessment", "advanced_phonics_patterns"].forEach(type => {
    if (!(attemptsByType.get(type) || []).length) legacyEvidenceUsed.push(...(legacyByType.get(type) || []));
  });
  rawEvidence.push(...legacyEvidenceUsed);

  const knowledgeEvidence = [];
  ["el_letter_assessment", "advanced_phonics_patterns"].forEach(type => {
    // A completed administration remains the baseline when one exists. If the
    // only saved run is partial, keep its administered answers visible as
    // provisional evidence after reload instead of falling back to empty
    // legacy React state and making those observations disappear.
    const latestAttempt = latestCompletedOrSavedPartialAttempt(
      attemptsByType.get(type) || []
    );
    const currentRaw = latestAttempt
      ? rawEvidence.filter(row => row.sourceRecordId === latestAttempt.attemptId)
      : legacyByType.get(type) || [];
    knowledgeEvidence.push(...aggregateDirectEvidence(currentRaw, {
      sourceArea: "el_assessments",
      sourceLabel: "EL Assessments",
      sourceRecordType: type,
      evidenceKind: latestAttempt
        ? REPORTING_EVIDENCE_KINDS.FORMAL
        : REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
      aggregateId: latestAttempt?.attemptId || `legacy_${type}`
    }));
  });

  const assessments = EL_ASSESSMENT_DEFINITIONS.map(definition => {
    const allTypeAttempts = attemptsByType.get(definition.assessmentId) || [];
    const typeAttempts = definition.reportingMode === "descriptive"
      ? allTypeAttempts.filter(attempt => scopedDescriptiveAttemptIds.has(attempt.attemptId))
      : allTypeAttempts;
    const profile = formalReport.individualBenchmarkProfile?.find(row => row.assessmentId === definition.assessmentId) || null;
    const latestAttempt = definition.reportingMode === "descriptive" && profile?.latestAttemptId
      ? typeAttempts.find(attempt => attempt.attemptId === profile.latestAttemptId) || null
      : latestCompletedOrSavedPartialAttempt(typeAttempts);
    const fallbackEvidence = !latestAttempt ? legacyByType.get(definition.assessmentId) || [] : [];
    const source = latestAttempt
      ? normalizeReportingKey(latestAttempt.administrationStatus) === ASSESSMENT_ADMINISTRATION_STATUSES.PARTIAL
        ? "partial_history"
        : "completed_history"
      : fallbackEvidence.length
        ? "legacy_fallback"
        : "none";
    const detail = formalReport.individualBenchmarkDetails?.find(row => row.attemptId === latestAttempt?.attemptId) || null;
    const currentEvidence = latestAttempt
      ? rawEvidence.filter(row => row.sourceRecordId === latestAttempt.attemptId)
      : fallbackEvidence;
    const latestAt = latestAttempt?.completedAt || latestDate(currentEvidence.map(row => row.observedAt));
    const scorable = definition.reportingMode === "descriptive"
      ? Boolean(latestAttempt)
      : attemptHasScorableResult(latestAttempt, currentEvidence) || fallbackEvidence.some(row => row.statusCandidate);
    const checked = definition.reportingMode === "descriptive"
      ? Boolean(latestAttempt)
      : scorable;

    if (definition.reportingMode === "descriptive") {
      return {
        ...definition,
        checked,
        source,
        resultLabel: checked
          ? administrationLabel(latestAttempt?.administrationStatus)
          : REPORTING_STATUS_LABELS[REPORTING_STATUS_IDS.NOT_CHECKED],
        wholeChildStatus: null,
        descriptive: true,
        scorable: false,
        interpretation: profile?.interpretation || "These results are descriptive and do not use the general Secure cut-off.",
        latestAt,
        attemptCount: typeAttempts.length,
        latestAttempt: latestAttempt ? attemptDisplayRow(latestAttempt) : null,
        attempts: typeAttempts.map(attemptDisplayRow),
        profile,
        detail,
        evidence: currentEvidence
      };
    }

    const status = scoredAssessmentStatus(
      latestAttempt,
      currentEvidence.length ? currentEvidence : fallbackEvidence,
      now
    );
    return {
      ...definition,
      checked,
      source,
      resultLabel: checked ? status.label : REPORTING_STATUS_LABELS[REPORTING_STATUS_IDS.NOT_CHECKED],
      wholeChildStatus: status,
      descriptive: false,
      scorable,
      latestAt,
      attemptCount: typeAttempts.length,
      administrationStatus: latestAttempt?.administrationStatus || "",
      administrationStatusLabel: latestAttempt
        ? administrationLabel(latestAttempt.administrationStatus)
        : "",
      latestAttempt: latestAttempt ? attemptDisplayRow(latestAttempt) : null,
      attempts: typeAttempts.map(attemptDisplayRow),
      evidence: currentEvidence,
      items: knowledgeEvidence.filter(row => row.sourceRecordType === definition.assessmentId)
    };
  });

  const reportEvidence = rawEvidence.filter(row => (
    !DESCRIPTIVE_EL_IDS.has(row.sourceRecordType) || scopedDescriptiveAttemptIds.has(row.sourceRecordId)
  ));

  return {
    reportKey: "el_assessments",
    title: "EL Assessments",
    studentId: resolvedStudentId,
    summary: {
      assessmentsChecked: assessments.filter(row => row.checked).length,
      assessmentsTotal: EL_ASSESSMENT_DEFINITIONS.length,
      completedHistoryAttempts: attempts.length,
      legacyFallbackAssessments: assessments.filter(row => row.source === "legacy_fallback").length,
      latestAt: latestDate(assessments.map(row => row.latestAt))
    },
    assessments,
    letterMatrix: formalReport.individualLetterMatrix || [],
    advancedPhonicsMatrix: formalReport.individualAdvancedPhonicsMatrix || [],
    benchmarkScope: formalReport.benchmarkScope || null,
    evidence: dedupeReportingEvidence(reportEvidence),
    knowledgeEvidence: dedupeReportingEvidence(knowledgeEvidence),
    descriptiveEvidence: dedupeReportingEvidence(reportEvidence.filter(row => row.descriptive)),
    provenance: {
      canonicalAttemptIds: attempts.map(row => row.attemptId),
      canonicalAttemptCount: attempts.length,
      descriptiveScopeAttemptIds: [...scopedDescriptiveAttemptIds],
      legacyFallbackUsed: assessments.some(row => row.source === "legacy_fallback"),
      completedHistoryIsCanonical: true
    }
  };
}

function normalizedNoteRows(record = {}) {
  const pageNotes = Object.entries(record.pages || {}).flatMap(([pageKey, page = {}]) => (
    String(page.note || "").trim()
      ? [{
          page: Number(pageKey) + 1,
          label: `Page ${Number(pageKey) + 1}`,
          note: String(page.note).trim(),
          date: page.noteUpdatedAt || page.noteAt || page.updatedAt || ""
        }]
      : []
  ));
  return [
    String(record.wholeBookNote || "").trim()
      ? {
          page: null,
          label: "Whole book",
          note: String(record.wholeBookNote).trim(),
          date: record.wholeBookNoteUpdatedAt || record.wholeBookNoteAt || record.noteUpdatedAt || ""
        }
      : null,
    ...pageNotes
  ].filter(Boolean);
}

function guidedWordEvidence({
  studentId,
  bookId,
  title,
  level,
  page,
  wordIndex,
  word,
  mark,
  observedAt,
  raw
}) {
  const normalizedWord = cleanWord(word);
  return createReportingEvidence({
    evidenceId: `guided_reading:${bookId}:page:${page}:word:${wordIndex}`,
    studentId,
    sourceArea: "guided_reading",
    sourceLabel: "Guided Reading",
    sourceRecordId: `${bookId}:page:${page}:word:${wordIndex}`,
    sourceRecordType: "teacher_word_mark",
    evidenceKind: REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
    concept: {
      domain: "connected_text_reading",
      construct: "connected_text_word_reading",
      key: normalizedWord,
      label: `Read “${normalizedWord}” in connected text`
    },
    outcome: mark === "correct" ? "read_correctly" : "needs_support",
    statusCandidate: mark === "correct"
      ? REPORTING_STATUS_IDS.SECURE
      : REPORTING_STATUS_IDS.NEEDS_TEACHING,
    observedAt,
    administrationStatus: "teacher_observation",
    scorable: Boolean(normalizedWord),
    knowledgeEligible: Boolean(normalizedWord),
    details: {
      bookId,
      title,
      level,
      page,
      wordIndex,
      word: normalizedWord,
      mark,
      rawMark: raw,
      observations: normalizedWord ? 1 : 0,
      correct: normalizedWord ? Number(mark === "correct") : null,
      accuracy: normalizedWord ? Number(mark === "correct") * 100 : null,
      independentAttempts: normalizedWord ? 1 : 0
    },
    provenance: { bookId, page, wordIndex, recordKind: "current_word_mark" }
  });
}

function guidedQuizEvidence({ studentId, bookId, title, score, total, observedAt, raw }) {
  const percent = total > 0 ? Math.round((score / total) * 100) : null;
  const learningStatus = percent === null ? null : rawLearningStatus(percent);
  const candidate = learningStatus === LEARNING_STATUS_IDS.SECURE
    ? REPORTING_STATUS_IDS.SECURE
    : learningStatus === LEARNING_STATUS_IDS.DEVELOPING
      ? REPORTING_STATUS_IDS.DEVELOPING
      : learningStatus === LEARNING_STATUS_IDS.NEEDS_SUPPORT
        ? REPORTING_STATUS_IDS.NEEDS_TEACHING
        : null;
  return createReportingEvidence({
    evidenceId: `guided_reading:${bookId}:quiz`,
    studentId,
    sourceArea: "guided_reading",
    sourceLabel: "Guided Reading",
    sourceRecordId: bookId,
    sourceRecordType: "book_quiz",
    evidenceKind: REPORTING_EVIDENCE_KINDS.PRACTICE,
    concept: {
      domain: "comprehension",
      construct: "book_comprehension_quiz",
      key: bookId,
      label: `Comprehension of “${title}”`
    },
    outcome: candidate || "not_scored",
    statusCandidate: candidate,
    observedAt,
    administrationStatus: "completed",
    scorable: percent !== null,
    knowledgeEligible: percent !== null,
    details: {
      bookId,
      title,
      score,
      total,
      percent,
      observations: total > 0 ? total : 0,
      correct: total > 0 ? score : null,
      accuracy: percent,
      independentAttempts: total > 0 ? 1 : 0,
      rawQuiz: raw
    },
    provenance: { bookId, recordKind: "book_quiz" }
  });
}

function guidedRowsFromRecords({ guidedReadingRecords = {}, studentId = "" } = {}) {
  const books = [];
  const evidence = [];
  Object.entries(guidedReadingRecords || {}).forEach(([recordKey, rawRecord = {}]) => {
    const bookId = rawRecord.bookId || recordKey;
    const title = rawRecord.title || bookId;
    const level = rawRecord.level || "";
    const wordMarks = [];
    const supportUseEvents = [];
    Object.entries(rawRecord.pages || {}).forEach(([pageKey, rawPage = {}]) => {
      const page = Number(pageKey) + 1;
      asArray(rawPage.supportUseEvents).forEach(rawEvent => {
        const event = normalizeDecodingSupportEvent({
          ...rawEvent,
          pageNumber: rawEvent?.pageNumber || page
        });
        if (event) supportUseEvents.push(event);
      });
      Object.entries(rawPage.wordMarks || {}).forEach(([wordIndex, mark]) => {
        if (!["correct", "support"].includes(mark)) return;
        const word = rawPage.wordTexts?.[wordIndex] || rawPage.words?.[wordIndex] || "";
        if (!word) return;
        const observedAt = rawPage.updatedAt || rawRecord.lastReadAt || rawRecord.updatedAt || rawRecord.completedAt || "";
        const row = {
          bookId,
          title,
          level,
          page,
          wordIndex: Number(wordIndex),
          word: cleanWord(word),
          mark,
          statusLabel: mark === "correct" ? "Read correctly in this book" : "Needs support in this book",
          observedAt
        };
        wordMarks.push(row);
        evidence.push(guidedWordEvidence({ ...row, studentId, raw: { mark, page: rawPage } }));
      });
    });
    const quizScore = finiteNumber(rawRecord.quizScore);
    const quizTotal = finiteNumber(rawRecord.quizTotal);
    if (quizScore !== null && quizTotal !== null && quizTotal > 0) {
      evidence.push(guidedQuizEvidence({
        studentId,
        bookId,
        title,
        score: Math.max(0, quizScore),
        total: quizTotal,
        observedAt: rawRecord.quizAt || rawRecord.lastReadAt || rawRecord.updatedAt || "",
        raw: rawRecord
      }));
    }
    const completed = Boolean(rawRecord.completed || rawRecord.completedAt);
    const readCount = Math.max(Number(rawRecord.readCount || 0), completed ? 1 : 0);
    const notes = normalizedNoteRows(rawRecord);
    supportUseEvents.sort((a, b) => (
      finiteTimestamp(b.occurredAt) - finiteTimestamp(a.occurredAt) ||
      a.pageNumber - b.pageNumber ||
      a.wordIndex - b.wordIndex
    ));
    const hasActivity = completed || readCount > 0 || Number(rawRecord.completedPages || 0) > 0 || wordMarks.length || notes.length || supportUseEvents.length;
    if (!hasActivity) return;
    books.push({
      bookId,
      title,
      type: rawRecord.type || "",
      level,
      completed,
      completedAt: rawRecord.completedAt || "",
      lastReadAt: rawRecord.lastReadAt || rawRecord.updatedAt || rawRecord.completedAt || "",
      readCount,
      rereadCount: Math.max(0, readCount - 1),
      pagesRead: Number(rawRecord.completedPages || 0),
      totalPages: Number(rawRecord.totalPages || 0),
      quizScore: quizScore !== null && quizTotal > 0 ? Math.max(0, quizScore) : null,
      quizTotal: quizScore !== null && quizTotal > 0 ? quizTotal : null,
      attempted: wordMarks.length,
      correct: wordMarks.filter(row => row.mark === "correct").length,
      latestAccuracy: wordMarks.length
        ? Math.round((wordMarks.filter(row => row.mark === "correct").length / wordMarks.length) * 100)
        : null,
      wordMarks,
      correctWords: [...new Set(wordMarks.filter(row => row.mark === "correct").map(row => row.word))],
      supportWords: [...new Set(wordMarks.filter(row => row.mark === "support").map(row => row.word))],
      supportUseEvents,
      notes,
      provenance: { bookId, rawRecord }
    });
  });
  return { books, evidence };
}

function guidedRowsFromPreparedRows({ guidedReadingRows = [], guidedReadingWordRows = [], studentId = "" } = {}) {
  const books = asArray(guidedReadingRows).map((row, index) => ({
    bookId: row.bookId || `prepared_book_${index + 1}`,
    title: row.title || row.bookId || `Book ${index + 1}`,
    type: row.type || "",
    level: row.level || "",
    completed: Boolean(row.completed),
    completedAt: row.completedAt || "",
    lastReadAt: row.lastReadAt || "",
    readCount: Number(row.readCount || 0),
    rereadCount: Math.max(0, Number(row.readCount || 0) - 1),
    pagesRead: Number(row.pagesRead || row.completedPages || 0),
    totalPages: Number(row.totalPages || 0),
    quizScore: finiteNumber(row.quizScore),
    quizTotal: finiteNumber(row.quizTotal),
    attempted: Number(row.attempted || 0),
    correct: Number(row.correct || 0),
    latestAccuracy: finiteNumber(row.latestAccuracy ?? row.accuracy),
    wordMarks: [],
    correctWords: asArray(row.correctWords).map(cleanWord).filter(Boolean),
    supportWords: asArray(row.supportWords).map(cleanWord).filter(Boolean),
    supportUseEvents: asArray(row.supportUseEvents).map(normalizeDecodingSupportEvent).filter(Boolean),
    notes: asArray(row.notes).map(note => {
      if (typeof note === "string") {
        return {
          page: null,
          label: "Book note",
          note: note.trim(),
          date: row.notesUpdatedAt || row.noteUpdatedAt || ""
        };
      }
      return {
        ...note,
        page: note?.page ?? null,
        label: note?.label || (note?.page ? `Page ${note.page}` : "Book note"),
        note: String(note?.note || note?.text || "").trim(),
        date: note?.date || note?.updatedAt || row.notesUpdatedAt || row.noteUpdatedAt || ""
      };
    }).filter(note => note.note),
    provenance: { bookId: row.bookId, preparedRow: row }
  }));
  const evidence = [];
  const preparedWordRows = asArray(guidedReadingWordRows);
  if (preparedWordRows.length) {
    preparedWordRows.forEach((row, index) => {
      const normalizedMark = normalizeReportingKey(row.mark || row.status);
      const mark = ["correct", "read_correctly", "secure", "mastered"].includes(normalizedMark)
        ? "correct"
        : ["support", "needs_support", "needs_teaching", "incorrect"].includes(normalizedMark)
          ? "support"
          : null;
      // Unknown prepared labels are not teacher observations. Retain the raw
      // row in its source store, but do not invent a correct word mark here.
      if (!mark) return;
      evidence.push(guidedWordEvidence({
        studentId,
        bookId: row.bookId || "prepared_book",
        title: row.title || row.bookId || "Guided reading book",
        level: row.level || "",
        page: Number(row.page || 0),
        wordIndex: row.wordIndex ?? index,
        word: row.word,
        mark,
        observedAt: row.observedAt || row.date || "",
        raw: row
      }));
    });
  } else {
    books.forEach((book, bookIndex) => {
      [
        ...book.correctWords.map((word, index) => ({ word, mark: "correct", index })),
        ...book.supportWords.map((word, index) => ({ word, mark: "support", index: book.correctWords.length + index }))
      ].forEach(row => {
        evidence.push(guidedWordEvidence({
          studentId,
          bookId: book.bookId,
          title: book.title,
          level: book.level,
          page: 0,
          wordIndex: `${bookIndex}_${row.index}`,
          word: row.word,
          mark: row.mark,
          observedAt: book.lastReadAt,
          raw: book.provenance.preparedRow
        }));
      });
    });
  }
  books.forEach(book => {
    if (book.quizScore !== null && book.quizTotal !== null && book.quizTotal > 0) {
      evidence.push(guidedQuizEvidence({
        studentId,
        bookId: book.bookId,
        title: book.title,
        score: book.quizScore,
        total: book.quizTotal,
        observedAt: book.lastReadAt,
        raw: book.provenance.preparedRow
      }));
    }
  });
  return { books, evidence };
}

function resolveCurrentGuidedWordEvidence(evidence = []) {
  const byConcept = new Map();
  evidence.forEach(row => {
    const key = row.concept?.conceptId;
    if (!key) return;
    const current = byConcept.get(key);
    if (!current) {
      byConcept.set(key, row);
      return;
    }
    const rowTimestamp = finiteTimestamp(row.observedAt);
    const currentTimestamp = finiteTimestamp(current.observedAt);
    const rowNeedsSupport = row.outcome === "needs_support";
    const currentNeedsSupport = current.outcome === "needs_support";
    if (
      rowTimestamp > currentTimestamp ||
      (rowTimestamp === currentTimestamp && rowNeedsSupport && !currentNeedsSupport) ||
      (
        rowTimestamp === currentTimestamp &&
        rowNeedsSupport === currentNeedsSupport &&
        row.evidenceId.localeCompare(current.evidenceId) < 0
      )
    ) byConcept.set(key, row);
  });
  return Array.from(byConcept.values()).sort((a, b) => (
    finiteTimestamp(b.observedAt) - finiteTimestamp(a.observedAt) ||
    a.concept.label.localeCompare(b.concept.label) ||
    a.evidenceId.localeCompare(b.evidenceId)
  ));
}

export function buildGuidedReadingReportModel({
  student = {},
  studentId = "",
  guidedReadingRecords = {},
  guidedReadingRows = [],
  guidedReadingWordRows = []
} = {}) {
  const resolvedStudentId = getStudentId(student, studentId);
  const hasRawRecords = Object.keys(guidedReadingRecords || {}).length > 0;
  const prepared = hasRawRecords
    ? guidedRowsFromRecords({ guidedReadingRecords, studentId: resolvedStudentId })
    : guidedRowsFromPreparedRows({ guidedReadingRows, guidedReadingWordRows, studentId: resolvedStudentId });
  // Raw records remain authoritative for marks, notes, quiz results and
  // timestamps. Prepared rows may safely fill catalogue metadata that older
  // raw records did not persist (for example a title or level).
  const preparedMetadataByBook = new Map(asArray(guidedReadingRows).map(row => [row.bookId, row]));
  const books = prepared.books.map(book => {
    if (!hasRawRecords) return book;
    const metadata = preparedMetadataByBook.get(book.bookId);
    if (!metadata) return book;
    const rawRecord = book.provenance?.rawRecord || {};
    return {
      ...book,
      title: rawRecord.title || metadata.title || book.title,
      type: rawRecord.type || metadata.type || book.type,
      level: rawRecord.level || metadata.level || book.level,
      totalPages: Number(rawRecord.totalPages || metadata.totalPages || book.totalPages || 0),
      provenance: {
        ...book.provenance,
        preparedMetadata: {
          bookId: metadata.bookId,
          title: metadata.title || "",
          type: metadata.type || "",
          level: metadata.level || "",
          totalPages: Number(metadata.totalPages || 0)
        }
      }
    };
  }).sort((a, b) => (
    finiteTimestamp(b.lastReadAt) - finiteTimestamp(a.lastReadAt) || a.title.localeCompare(b.title)
  ));
  const evidenceWithMetadata = prepared.evidence.map(row => {
    if (!hasRawRecords) return row;
    const metadata = preparedMetadataByBook.get(row.details?.bookId);
    if (!metadata) return row;
    const rawRecord = guidedReadingRecords?.[row.details.bookId] ||
      Object.values(guidedReadingRecords || {}).find(record => record?.bookId === row.details.bookId) ||
      {};
    const title = rawRecord.title || metadata.title || row.details.title;
    const level = rawRecord.level || metadata.level || row.details.level;
    return {
      ...row,
      concept: row.sourceRecordType === "book_quiz" && title
        ? { ...row.concept, label: `Comprehension of “${title}”` }
        : row.concept,
      details: { ...row.details, title, level },
      provenance: {
        ...row.provenance,
        metadataSource: rawRecord.title || rawRecord.level ? "raw_record" : "prepared_row"
      }
    };
  });
  const rawEvidence = dedupeReportingEvidence(evidenceWithMetadata);
  const allWordEvidence = rawEvidence.filter(row => row.sourceRecordType === "teacher_word_mark");
  const wordEvidence = resolveCurrentGuidedWordEvidence(allWordEvidence);
  const wordKnowledge = aggregateDirectEvidence(wordEvidence, {
    sourceArea: "guided_reading",
    sourceLabel: "Guided Reading",
    sourceRecordType: "teacher_word_mark",
    evidenceKind: REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
    aggregateId: "current_word_marks"
  });
  const quizKnowledge = rawEvidence.filter(row => row.sourceRecordType === "book_quiz" && row.statusCandidate);
  const knowledgeEvidence = dedupeReportingEvidence([...wordKnowledge, ...quizKnowledge]);
  const correctWordRows = wordEvidence.filter(row => row.outcome === "read_correctly");
  const supportWordRows = wordEvidence.filter(row => row.outcome === "needs_support");

  return {
    reportKey: "guided_reading",
    title: "Guided Reading",
    studentId: resolvedStudentId,
    summary: {
      booksStarted: books.length,
      booksCompleted: books.filter(row => row.completed).length,
      booksInProgress: books.filter(row => !row.completed && (row.pagesRead > 0 || row.readCount > 0)).length,
      rereads: books.reduce((sum, row) => sum + row.rereadCount, 0),
      wordsReadCorrectlyInText: correctWordRows.length,
      wordsNeedingSupportInText: supportWordRows.length,
      teacherNotes: books.reduce((sum, row) => sum + row.notes.length, 0),
      decodingSupportUses: books.reduce((sum, row) => sum + row.supportUseEvents.length, 0),
      latestAt: latestDate(books.map(row => row.lastReadAt))
    },
    books,
    wordRows: wordEvidence.map(row => ({
      evidenceId: row.evidenceId,
      word: row.details.word,
      statusLabel: row.details.mark === "correct" ? "Read correctly in this book" : "Needs support in this book",
      bookId: row.details.bookId,
      title: row.details.title,
      level: row.details.level,
      page: row.details.page,
      observedAt: row.observedAt,
      provenance: row.provenance
    })),
    notes: books.flatMap(book => book.notes.map(note => ({
      ...note,
      bookId: book.bookId,
      title: book.title,
      date: note.date || ""
    }))).sort((a, b) => (
      finiteTimestamp(b.date) - finiteTimestamp(a.date) ||
      a.title.localeCompare(b.title) ||
      Number(a.page ?? -1) - Number(b.page ?? -1)
    )),
    supportUseEvents: books.flatMap(book => book.supportUseEvents.map(event => ({
      ...event,
      bookId: book.bookId,
      title: book.title,
      level: book.level
    }))).sort((a, b) => (
      finiteTimestamp(b.occurredAt) - finiteTimestamp(a.occurredAt) ||
      a.title.localeCompare(b.title) ||
      a.pageNumber - b.pageNumber ||
      a.wordIndex - b.wordIndex
    )),
    evidence: rawEvidence,
    knowledgeEvidence,
    provenance: {
      source: hasRawRecords ? "guided_reading_records" : "prepared_report_rows",
      currentMarkSemantics: "The latest observation for each word wins across Guided Reading records; support wins exact timestamp ties.",
      connectedTextWordsAreNotRelabelledAsLearned: true
    }
  };
}

function aggregateSkillEvidence(rawEvidence = [], {
  now = new Date(),
  aggregateId = "canonical"
} = {}) {
  const byConcept = new Map();
  rawEvidence.filter(row => isTerminalAdministrationStatus(row.administrationStatus)).forEach(row => {
    const group = byConcept.get(row.concept.conceptId) || [];
    group.push(row);
    byConcept.set(row.concept.conceptId, group);
  });
  return Array.from(byConcept.values()).map(rows => {
    const byAttempt = new Map();
    rows.forEach(row => {
      const attemptId = row.provenance?.attemptId || row.sourceRecordId || row.evidenceId;
      const attemptRows = byAttempt.get(attemptId) || [];
      attemptRows.push(row);
      byAttempt.set(attemptId, attemptRows);
    });
    const recentRows = rows.filter(row => isLearningEvidenceRecent(row.observedAt, {
      now,
      allowUndated: false
    }));
    // Old observations remain available in the lifetime fields below, but they
    // cannot become a current teaching conclusion.
    const decisionRows = recentRows;
    const currentScored = decisionRows.filter(row => row.statusCandidate);
    const lifetimeScored = rows.filter(row => row.statusCandidate);
    // Current and lifetime are separate ledgers. Falling back to lifetime rows
    // here made old evidence appear in `currentEvidenceCount` even though the
    // eventual status was downgraded for recency.
    const scored = currentScored;
    const displayRows = decisionRows.length ? decisionRows : rows;
    const correct = scored.filter(
      row => row.statusCandidate === REPORTING_STATUS_IDS.SECURE
    ).length;
    const selfCorrected = scored.filter(
      row => row.statusCandidate === REPORTING_STATUS_IDS.DEVELOPING
    ).length;
    const score = correct + selfCorrected * 0.5;
    const accuracy = scored.length ? Math.round((score / scored.length) * 100) : null;
    const learningStatus = accuracy === null ? null : rawLearningStatus(accuracy);
    const statusCandidate = learningStatus === LEARNING_STATUS_IDS.SECURE
      ? REPORTING_STATUS_IDS.SECURE
      : learningStatus === LEARNING_STATUS_IDS.DEVELOPING
        ? REPORTING_STATUS_IDS.DEVELOPING
        : learningStatus === LEARNING_STATUS_IDS.NEEDS_SUPPORT
          ? REPORTING_STATUS_IDS.NEEDS_TEACHING
          : null;
    const hasIncompleteAttemptIdentity = decisionRows.some(
      row => row.provenance?.incompleteAttemptIdentity === true
    );
    const hasLifetimeIncompleteAttemptIdentity = rows.some(
      row => row.provenance?.incompleteAttemptIdentity === true
    );
    // Older `answers` rows prove each response and its timestamp, but they do
    // not identify the assessment sitting that produced it. Preserve the
    // counts and accuracy while refusing to turn one unknown sitting into a
    // Secure/Needs-support learning judgement.
    const reportedStatusCandidate = !currentScored.length
      ? null
      : hasIncompleteAttemptIdentity
        ? REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
        : statusCandidate;
    const attemptIds = [...new Set(
      decisionRows.map(row => row.provenance?.attemptId || row.sourceRecordId).filter(Boolean)
    )];
    const verifiedAttemptIds = [...new Set(
      decisionRows
        .filter(row => row.provenance?.incompleteAttemptIdentity !== true)
        .map(row => row.provenance?.attemptId || row.sourceRecordId)
        .filter(Boolean)
    )];
    const independentAttempts = !decisionRows.length
      ? 0
      : hasIncompleteAttemptIdentity
        ? Math.max(1, verifiedAttemptIds.length)
        : attemptIds.length;
    const latestAttemptId = Array.from(byAttempt.entries())
      .filter(([, attemptRows]) => decisionRows.some(row => attemptRows.includes(row)))
      .sort(([, left], [, right]) => (
        finiteTimestamp(latestDate(right.map(row => row.observedAt)))
          - finiteTimestamp(latestDate(left.map(row => row.observedAt)))
      ))[0]?.[0] || "";
    const lifetimeCorrect = lifetimeScored.filter(row => row.statusCandidate === REPORTING_STATUS_IDS.SECURE).length;
    const lifetimeSelfCorrected = lifetimeScored.filter(row => row.statusCandidate === REPORTING_STATUS_IDS.DEVELOPING).length;
    const lifetimeAccuracy = lifetimeScored.length
      ? Math.round(((lifetimeCorrect + lifetimeSelfCorrected * 0.5) / lifetimeScored.length) * 100)
      : null;
    const lifetimeAttemptIds = [...new Set(
      rows.map(row => row.provenance?.attemptId || row.sourceRecordId).filter(Boolean)
    )];
    const lifetimeVerifiedAttemptIds = [...new Set(
      rows
        .filter(row => row.provenance?.incompleteAttemptIdentity !== true)
        .map(row => row.provenance?.attemptId || row.sourceRecordId)
        .filter(Boolean)
    )];
    const lifetimeIndependentAttempts = hasLifetimeIncompleteAttemptIdentity
      ? Math.max(1, lifetimeVerifiedAttemptIds.length)
      : lifetimeAttemptIds.length;
    const evidenceKinds = new Set(rows.map(row => row.evidenceKind).filter(Boolean));
    const aggregateEvidenceKind = hasLifetimeIncompleteAttemptIdentity
      ? REPORTING_EVIDENCE_KINDS.LEGACY_PROJECTION
      : evidenceKinds.size === 1
      ? rows[0].evidenceKind
      : REPORTING_EVIDENCE_KINDS.FORMAL;
    const decisionDates = decisionRows.map(row => row.observedAt).filter(Boolean).sort();
    const lifetimeDates = rows.map(row => row.observedAt).filter(Boolean).sort();
    return createReportingEvidence({
      evidenceId: `skills_check:aggregate:${aggregateId}:${rows[0].concept.conceptId}`,
      studentId: rows[0].studentId,
      sourceArea: "skills_check",
      sourceLabel: rows[0].sourceLabel || "Skills assessment",
      sourceRecordId: latestAttemptId,
      sourceRecordType: hasLifetimeIncompleteAttemptIdentity
        ? "legacy_answer_history"
        : "skill_checkpoint",
      evidenceKind: aggregateEvidenceKind,
      concept: rows[0].concept,
      outcome: reportedStatusCandidate || "not_checked",
      statusCandidate: reportedStatusCandidate,
      observedAt: decisionDates.at(-1) || lifetimeDates.at(-1) || "",
      administrationStatus: displayRows[0]?.administrationStatus || "completed",
      scorable: Boolean(reportedStatusCandidate),
      knowledgeEligible: Boolean(reportedStatusCandidate),
      details: {
        observations: scored.length,
        correct,
        selfCorrected,
        accuracy,
        independentAttempts,
        contributingEvidenceIds: decisionRows.map(row => row.evidenceId),
        currentAttemptId: latestAttemptId,
        attemptIds,
        windowStart: decisionDates[0] || "",
        windowEnd: decisionDates.at(-1) || "",
        incompleteAttemptIdentity: hasIncompleteAttemptIdentity,
        lifetimeObservations: lifetimeScored.length,
        lifetimeCorrect,
        lifetimeSelfCorrected,
        lifetimeAccuracy,
        lifetimeIndependentAttempts,
        lifetimeWindowStart: lifetimeDates[0] || "",
        lifetimeWindowEnd: lifetimeDates.at(-1) || "",
        lifetimeContributingEvidenceIds: lifetimeScored.map(row => row.evidenceId)
      },
      provenance: {
        derivedFromEvidenceIds: decisionRows.map(row => row.evidenceId),
        currentAttemptId: latestAttemptId,
        attemptIds,
        incompleteAttemptIdentity: hasIncompleteAttemptIdentity,
        lifetimeIncompleteAttemptIdentity: hasLifetimeIncompleteAttemptIdentity,
        lifetimeAttemptIds
      }
    });
  });
}

function answerHistorySkillId(row = {}) {
  return normalizeReportingKey(row.skillId || row.skill || row.stage);
}

function answerHistoryObservedAt(row = {}) {
  return row.timestamp
    || row.answeredAt
    || row.answered_at
    || row.date
    || row.updatedAt
    || row.updated_at
    || "";
}

function answerHistoryCorrectness(row = {}) {
  if (typeof row.isCorrect === "boolean") return row.isCorrect;
  if (typeof row.is_correct === "boolean") return row.is_correct;
  return null;
}

function answerHistoryConceptQuestion(row = {}, skillId = "") {
  const diagnosticKey = normalizeReportingKey(row.diagnosticTarget || row.diagnostic_target);
  let itemType = normalizeReportingKey(row.itemType || row.item_type);
  let itemKey = normalizeReportingKey(row.itemKey || row.item_key);

  if (skillId === "initial_sounds") {
    itemType = "initial_sound";
    itemKey = diagnosticKey || itemKey;
  } else if (skillId === "final_sounds") {
    itemType = "final_sound";
    itemKey = diagnosticKey || itemKey;
  } else if (["cvc_short_vowels", "short_vowel_discrimination"].includes(skillId)) {
    itemType = "short_vowel";
    itemKey = (diagnosticKey || itemKey).replace(/^short_/, "");
  }

  return {
    ...row,
    skillId,
    itemType,
    itemKey,
    diagnosticTarget: row.diagnosticTarget || row.diagnostic_target || "",
    targetSound: ["initial_sound", "final_sound"].includes(itemType)
      ? diagnosticKey || itemKey
      : row.targetSound || row.target_sound || "",
    correctAnswer: row.correctAnswer ?? row.correct,
    selectedAnswer: row.selectedAnswer ?? row.chosen,
    responseStatus: answerHistoryCorrectness(row) ? "correct" : "incorrect"
  };
}

const TRUSTWORTHY_LEGACY_ANSWER_ITEM_TYPES = new Set([
  "cvc_word",
  "final_sound",
  "initial_sound",
  "letter_name",
  "letter_sound",
  "phonics_pattern",
  "rhyming_family",
  "short_vowel",
  "sight_word"
]);

/**
 * The oldest Skills Check persistence boundary stored one durable row per
 * answer, before immutable assessment-attempt archives existed. Those rows
 * still contain truthful response counts, accuracy, skill and time, but no
 * attempt/session id. Keep them as conservative fallback evidence: visible in
 * reports, never silently upgraded into multiple independent sittings.
 */
function legacyAnswerHistoryEvidence({
  answerHistory = [],
  studentId = ""
} = {}) {
  if (!studentId) return [];
  const seen = new Set();

  return asArray(answerHistory).flatMap((row, index) => {
    const rowStudentId = String(row?.studentId || row?.student_id || "");
    if (rowStudentId && rowStudentId !== studentId) return [];
    const isCorrect = answerHistoryCorrectness(row);
    if (isCorrect === null) return [];

    const skillId = answerHistorySkillId(row);
    const question = answerHistoryConceptQuestion(row, skillId);
    const hasTrustworthyItemClassification = TRUSTWORTHY_LEGACY_ANSWER_ITEM_TYPES.has(question.itemType)
      && (
        question.itemType !== "sight_word"
        || Boolean(
          question.formatType
          || question.templateType
          || question.templateKey
          || question.runtimeTemplateKey
          || question.questionType
        )
      );
    const concept = hasTrustworthyItemClassification
      ? getReportingConceptForAssessmentQuestion(question, {
        assessmentType: "skill_checkpoint",
        skillId,
        skillName: row.skill || row.stage || titleCase(skillId)
      })
      : createReportingConcept({
        domain: "literacy_skill",
        construct: "skill_overview",
        key: skillId || "unclassified_skill",
        label: row.skill || row.stage || titleCase(skillId || "Literacy skill")
      });
    if (!concept.conceptId || !concept.key) return [];

    const observedAt = answerHistoryObservedAt(row);
    const explicitId = row.answerEventId
      || row.clientEventId
      || row.client_event_id
      || row.answerId
      || row.id
      || "";
    const fallbackIdentity = [
      observedAt,
      skillId,
      row.diagnosticTarget || row.diagnostic_target,
      row.question,
      row.chosen,
      row.correct,
      index
    ].map(value => normalizeReportingKey(value)).join("::");
    const identity = String(explicitId || fallbackIdentity || index);
    if (seen.has(identity)) return [];
    seen.add(identity);

    const unknownAttemptId = `legacy_answer_history:${skillId || concept.conceptId}`;
    return [createReportingEvidence({
      evidenceId: `skills_check:legacy_answer:${identity}`,
      studentId,
      sourceArea: "skills_check",
      sourceLabel: "Saved assessment answers",
      sourceRecordId: unknownAttemptId,
      sourceRecordType: "legacy_answer_history",
      evidenceKind: REPORTING_EVIDENCE_KINDS.LEGACY_PROJECTION,
      concept,
      outcome: isCorrect ? "correct" : "incorrect",
      statusCandidate: isCorrect
        ? REPORTING_STATUS_IDS.SECURE
        : REPORTING_STATUS_IDS.NEEDS_TEACHING,
      observedAt,
      administrationStatus: "legacy_projection",
      scorable: true,
      knowledgeEligible: true,
      details: {
        observations: 1,
        correct: Number(isCorrect),
        accuracy: Number(isCorrect) * 100,
        prompt: row.question || row.prompt || "",
        selectedAnswer: row.chosen ?? row.selectedAnswer ?? "",
        correctAnswer: row.correct ?? row.correctAnswer ?? "",
        incompleteAttemptIdentity: true
      },
      provenance: {
        legacyFallback: true,
        incompleteAttemptIdentity: true,
        attemptId: unknownAttemptId,
        answerId: row.answerId || row.id || "",
        answerEventId: row.answerEventId || row.clientEventId || row.client_event_id || "",
        skillId,
        skillLabel: row.skill || row.stage || titleCase(skillId)
      }
    })];
  });
}

function crossStoreAnswerFingerprint(row = {}) {
  if (!row.concept?.conceptId) return "";
  const responseParts = [
    normalizeReportingKey(row.details?.prompt),
    normalizeReportingKey(row.details?.selectedAnswer),
    normalizeReportingKey(row.details?.correctAnswer)
  ];
  if (!responseParts.some(Boolean)) return "";
  return [
    conceptSpineKey(row.concept),
    normalizeReportingKey(row.outcome),
    ...responseParts
  ].join("::");
}

function suppressArchivedAnswerCopies(canonicalEvidence = [], legacyEvidence = []) {
  const candidates = canonicalEvidence.map((row, index) => ({
    index,
    eventId: String(row.provenance?.answerEventId || ""),
    fingerprint: crossStoreAnswerFingerprint(row),
    observedAt: finiteTimestamp(row.observedAt)
  }));
  const byEventId = new Map();
  const byFingerprint = new Map();
  candidates.forEach(candidate => {
    if (candidate.eventId) {
      const queue = byEventId.get(candidate.eventId) || [];
      queue.push(candidate.index);
      byEventId.set(candidate.eventId, queue);
    }
    if (candidate.fingerprint) {
      const queue = byFingerprint.get(candidate.fingerprint) || [];
      queue.push(candidate.index);
      byFingerprint.set(candidate.fingerprint, queue);
    }
  });

  const consumedCanonicalIndexes = new Set();
  function takeUnconsumed(queue = []) {
    while (queue.length && consumedCanonicalIndexes.has(queue[0])) queue.shift();
    const next = queue.shift();
    if (next === undefined) return false;
    consumedCanonicalIndexes.add(next);
    return true;
  }
  function takeNearestFingerprint(queue = [], observedAt = 0) {
    if (!observedAt) return false;
    const maximumClockDriftMs = 5 * 60 * 1000;
    let bestQueueIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    queue.forEach((candidateIndex, queueIndex) => {
      if (consumedCanonicalIndexes.has(candidateIndex)) return;
      const candidateTime = candidates[candidateIndex]?.observedAt || 0;
      if (!candidateTime) return;
      const distance = Math.abs(candidateTime - observedAt);
      if (distance <= maximumClockDriftMs && distance < bestDistance) {
        bestQueueIndex = queueIndex;
        bestDistance = distance;
      }
    });
    if (bestQueueIndex < 0) return false;
    const [candidateIndex] = queue.splice(bestQueueIndex, 1);
    consumedCanonicalIndexes.add(candidateIndex);
    return true;
  }

  const used = [];
  const suppressed = [];
  legacyEvidence.forEach(row => {
    const eventId = String(row.provenance?.answerEventId || "");
    const fingerprint = crossStoreAnswerFingerprint(row);
    const observedAt = finiteTimestamp(row.observedAt);
    const exactEventMatch = eventId
      ? takeUnconsumed(byEventId.get(eventId))
      : false;
    const exactFingerprintMatch = !exactEventMatch && fingerprint
      ? takeNearestFingerprint(byFingerprint.get(fingerprint), observedAt)
      : false;
    if (exactEventMatch || exactFingerprintMatch) {
      suppressed.push(row);
    } else {
      used.push(row);
    }
  });

  return { used, suppressed };
}

function legacyAnswerSkillRows(answerEvidence = []) {
  const bySkill = new Map();
  answerEvidence.forEach(row => {
    const skillId = normalizeReportingKey(row.provenance?.skillId);
    if (!skillId) return;
    const rows = bySkill.get(skillId) || [];
    rows.push(row);
    bySkill.set(skillId, rows);
  });

  return Array.from(bySkill.entries()).map(([skillId, rows]) => {
    const correct = rows.filter(row => row.statusCandidate === REPORTING_STATUS_IDS.SECURE).length;
    const total = rows.length;
    const accuracy = total ? Math.round((correct / total) * 100) : null;
    const latestAt = latestDate(rows.map(row => row.observedAt));
    const currentStatus = reportingStatus(REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
    return {
      skillId,
      skillName: rows[0]?.provenance?.skillLabel || titleCase(skillId),
      attempts: [],
      history: [],
      latestAt,
      latestDate: latestAt,
      correctCount: correct,
      totalQuestions: total,
      attemptCount: 1,
      accuracy,
      latestCorrectCount: correct,
      latestTotalQuestions: total,
      latestAccuracy: accuracy,
      latestPassed: null,
      currentAccuracy: accuracy,
      currentScore: {
        correct,
        total,
        accuracy,
        scorable: true
      },
      lifetimeAttemptCount: 1,
      lifetimeAccuracy: accuracy,
      lifetime: {
        attempts: 1,
        correct,
        total,
        accuracy,
        latestAt
      },
      currentStatus,
      status: currentStatus,
      statusLabel: currentStatus.label,
      latestAttempt: null,
      source: "legacy_answer_history",
      legacy: true,
      provenance: {
        incompleteAttemptIdentity: true,
        evidenceIds: rows.map(row => row.evidenceId)
      }
    };
  });
}

function itemMasteryRows(itemMastery = {}) {
  if (Array.isArray(itemMastery)) return itemMastery;
  return Object.entries(itemMastery || {}).map(([stateKey, row = {}]) => {
    const [itemType = "", itemKey = ""] = stateKey.split("::");
    return { stateKey, itemType: row.itemType || itemType, itemKey: row.itemKey || itemKey, ...row };
  });
}

function conceptSpineKey(concept = {}) {
  return [concept.domain, concept.construct, concept.key]
    .map(normalizeReportingKey)
    .join("::");
}

function legacyItemMasteryEvidence({
  itemMastery = {},
  studentId = "",
  coveredConceptIds = new Set(),
  coveredConceptSpineKeys = new Set(),
  now = new Date()
} = {}) {
  return itemMasteryRows(itemMastery).flatMap((row, index) => {
    const skillId = normalizeReportingKey(row.skillId);
    if (EL_ASSESSMENT_IDS.has(skillId) || DESCRIPTIVE_EL_IDS.has(skillId)) return [];
    const attempts = Number(row.attempts || 0);
    if (attempts <= 0 && !row.lastAssessed && !row.updatedAt) return [];
    const concept = getReportingConceptForAssessmentQuestion(row, {
      assessmentType: "skill_checkpoint",
      skillId: row.skillId,
      skillName: row.skillName
    });
    if (
      !concept.conceptId ||
      coveredConceptIds.has(concept.conceptId) ||
      coveredConceptSpineKeys.has(conceptSpineKey(concept))
    ) return [];
    const correct = finiteNumber(row.correct);
    const accuracy = finiteNumber(row.accuracy) ?? (
      attempts > 0 && correct !== null ? Math.round((correct / attempts) * 100) : null
    );
    const hasSessionEvidence = Object.prototype.hasOwnProperty.call(row, "sessionsSeen")
      || Object.prototype.hasOwnProperty.call(row, "sessions_seen");
    const independentAttempts = hasSessionEvidence
      ? Math.min(
          attempts,
          Math.max(0, Number(row.sessionsSeen ?? row.sessions_seen) || 0)
        )
      : 0;
    const observedAt = row.lastAssessed || row.updatedAt || "";
    const conclusion = evaluateLearningConclusion({
      scope: LEARNING_CONCLUSION_SCOPES.ITEM,
      accuracy,
      attempts: independentAttempts,
      observedAt,
      now,
      minimumAttempts: LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts,
      skillDiversity: 1
    });
    const statusCandidate = !hasSessionEvidence && attempts > 0
      ? REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
      : conclusion.status.id === LEARNING_STATUS_IDS.SECURE
        ? REPORTING_STATUS_IDS.SECURE
        : conclusion.status.id === LEARNING_STATUS_IDS.DEVELOPING
          ? REPORTING_STATUS_IDS.DEVELOPING
          : conclusion.status.id === LEARNING_STATUS_IDS.NEEDS_SUPPORT
            ? REPORTING_STATUS_IDS.NEEDS_TEACHING
            : conclusion.status.id === LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
              ? REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
              : null;
    return [createReportingEvidence({
      evidenceId: `skills_check:legacy_item_mastery:${row.stateKey || index}`,
      studentId,
      sourceArea: "skills_check",
      sourceLabel: "Skills assessment",
      sourceRecordId: row.stateKey || `legacy_item_${index}`,
      sourceRecordType: "legacy_item_mastery",
      evidenceKind: REPORTING_EVIDENCE_KINDS.LEGACY_PROJECTION,
      concept,
      outcome: statusCandidate,
      statusCandidate,
      observedAt,
      administrationStatus: "legacy_projection",
      scorable: true,
      knowledgeEligible: true,
      details: {
        attempts,
        independentAttempts,
        correct,
        accuracy,
        incompleteAttemptIdentity: !hasSessionEvidence,
        rawProjection: row
      },
      provenance: {
        legacyFallback: true,
        generatedProjection: true,
        incompleteAttemptIdentity: !hasSessionEvidence,
        stateKey: row.stateKey || ""
      }
    })];
  });
}

function countSuppressedItemMasteryRows(
  itemMastery = {},
  coveredConceptIds = new Set(),
  coveredConceptSpineKeys = new Set()
) {
  return itemMasteryRows(itemMastery).filter(row => {
    const skillId = normalizeReportingKey(row.skillId);
    if (EL_ASSESSMENT_IDS.has(skillId) || DESCRIPTIVE_EL_IDS.has(skillId)) return false;
    const attempts = Number(row.attempts || 0);
    if (attempts <= 0 && !row.lastAssessed && !row.updatedAt) return false;
    const concept = getReportingConceptForAssessmentQuestion(row, {
      assessmentType: "skill_checkpoint",
      skillId: row.skillId,
      skillName: row.skillName
    });
    return Boolean(
      concept.conceptId && (
        coveredConceptIds.has(concept.conceptId) ||
        coveredConceptSpineKeys.has(conceptSpineKey(concept))
      )
    );
  }).length;
}

function skillSummaryRows(skillMasterySummary = {}) {
  if (Array.isArray(skillMasterySummary)) return skillMasterySummary;
  return Object.entries(skillMasterySummary || {}).map(([skillId, row = {}]) => ({ skillId, ...row }));
}

function legacySkillSummaryEvidence({
  skillMasterySummary = {},
  studentId = "",
  coveredSkillIds = new Set(),
  now = new Date()
} = {}) {
  return skillSummaryRows(skillMasterySummary).flatMap((row, index) => {
    const skillId = normalizeReportingKey(row.skillId || row.id);
    if (!skillId || coveredSkillIds.has(skillId) || EL_ASSESSMENT_IDS.has(skillId)) return [];
    const attempts = Number(row.attempts || 0);
    if (attempts <= 0 && !row.mastered && !row.lastAssessed && !row.updatedAt) return [];
    const accuracy = finiteNumber(row.accuracy) ?? (
      Number(row.total || 0) > 0 ? Math.round((Number(row.score || 0) / Number(row.total)) * 100) : null
    );
    const observedAt = row.lastAssessed || row.updatedAt || row.lastRetakeFailedAt || "";
    const scoredResponses = Number(row.total || row.attempts || 0);
    const conclusion = evaluateLearningConclusion({
      scope: LEARNING_CONCLUSION_SCOPES.SKILL,
      accuracy,
      attempts: scoredResponses,
      skillDiversity: 1,
      observedAt,
      now
    });
    const statusCandidate = conclusion.status.id === LEARNING_STATUS_IDS.SECURE
      ? REPORTING_STATUS_IDS.SECURE
      : conclusion.status.id === LEARNING_STATUS_IDS.DEVELOPING
        ? REPORTING_STATUS_IDS.DEVELOPING
        : conclusion.status.id === LEARNING_STATUS_IDS.NEEDS_SUPPORT
          ? REPORTING_STATUS_IDS.NEEDS_TEACHING
          : conclusion.status.id === LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
            ? REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
            : null;
    const concept = createReportingConcept({
      domain: "literacy_skill",
      construct: "skill_overview",
      key: skillId,
      label: row.skillName || row.label || titleCase(skillId)
    });
    return [createReportingEvidence({
      evidenceId: `skills_check:legacy_skill_summary:${skillId || index}`,
      studentId,
      sourceArea: "skills_check",
      sourceLabel: "Skills assessment",
      sourceRecordId: skillId,
      sourceRecordType: "legacy_skill_mastery",
      evidenceKind: REPORTING_EVIDENCE_KINDS.LEGACY_PROJECTION,
      concept,
      outcome: statusCandidate,
      statusCandidate,
      observedAt,
      administrationStatus: "legacy_projection",
      scorable: true,
      knowledgeEligible: true,
      details: {
        attempts: scoredResponses,
        independentAttempts: attempts,
        correct: finiteNumber(row.score),
        accuracy,
        rawProjection: row
      },
      provenance: { legacyFallback: true, generatedProjection: true, skillId }
    })];
  });
}

export function buildSkillsCheckReportModel({
  student = {},
  studentId = "",
  assessmentHistory = [],
  localAssessmentHistory = [],
  cloudAssessmentHistory = [],
  answerHistory = [],
  itemMastery = {},
  skillMasterySummary = {},
  now = new Date()
} = {}) {
  const resolvedStudentId = getStudentId(student, studentId);
  const attempts = getCanonicalStudentAssessmentAttempts({
    student: { ...student, id: resolvedStudentId },
    assessmentHistory,
    localAssessmentHistory,
    cloudAssessmentHistory
  }).filter(attempt => assessmentIdForAttempt(attempt) === "skill_checkpoint");
  const canonicalRawEvidence = [];
  attempts.forEach(attempt => {
    dedupeAttemptQuestions(attempt).forEach(({ identity, question }) => {
      canonicalRawEvidence.push(rawAssessmentQuestionEvidence({
        question,
        identity,
        attempt,
        sourceArea: "skills_check",
        sourceLabel: "Skills assessment"
      }));
    });
  });
  const allLegacyAnswerEvidence = legacyAnswerHistoryEvidence({
    answerHistory,
    studentId: resolvedStudentId
  });
  // Immutable assessment attempts are richer and already contain their
  // question rows. Suppress only an exact one-to-one copy of a question, not
  // every older answer for the same concept; concept-wide suppression erased
  // legitimate history whenever even one archived question existed.
  const answerReconciliation = suppressArchivedAnswerCopies(
    canonicalRawEvidence,
    allLegacyAnswerEvidence
  );
  const legacyAnswerEvidence = answerReconciliation.used;
  const rawEvidence = [...canonicalRawEvidence, ...legacyAnswerEvidence];
  // Keep verified attempt evidence and unknown-session answer history as
  // separate aggregates. The formal aggregate decides the current status when
  // it exists; the reconciled answer aggregate remains visible in lifetime
  // counts without promoting or erasing that verified conclusion.
  const canonicalKnowledge = aggregateSkillEvidence(canonicalRawEvidence, {
    now,
    aggregateId: "canonical"
  });
  const answerHistoryKnowledge = aggregateSkillEvidence(legacyAnswerEvidence, {
    now,
    aggregateId: "answer_history"
  });
  const primaryKnowledge = [...canonicalKnowledge, ...answerHistoryKnowledge];
  const canonicalKnowledgeConceptIds = new Set(
    canonicalKnowledge.map(row => row.concept.conceptId).filter(Boolean)
  );
  const displayPrimaryKnowledge = [
    ...canonicalKnowledge,
    ...answerHistoryKnowledge.filter(row => !canonicalKnowledgeConceptIds.has(row.concept.conceptId))
  ];
  const coveredConceptIds = new Set(rawEvidence.map(row => row.concept.conceptId).filter(Boolean));
  const coveredConceptSpineKeys = new Set(rawEvidence.map(row => conceptSpineKey(row.concept)).filter(Boolean));
  const coveredSkillIds = new Set([
    ...attempts.map(row => normalizeReportingKey(row.skillId)),
    ...legacyAnswerEvidence.map(row => normalizeReportingKey(row.provenance?.skillId))
  ].filter(Boolean));
  const legacyItems = legacyItemMasteryEvidence({
    itemMastery,
    studentId: resolvedStudentId,
    coveredConceptIds,
    coveredConceptSpineKeys,
    now
  });
  const legacySkills = legacySkillSummaryEvidence({
    skillMasterySummary,
    studentId: resolvedStudentId,
    coveredSkillIds,
    now
  });
  const knowledgeEvidence = dedupeReportingEvidence([
    ...primaryKnowledge,
    ...legacyItems,
    ...legacySkills
  ]);
  const displayItems = dedupeReportingEvidence([
    ...displayPrimaryKnowledge,
    ...legacyItems,
    ...legacySkills
  ]);
  const bySkill = new Map();
  attempts.forEach(attempt => {
    const skillId = normalizeReportingKey(attempt.skillId) || "unclassified_skill";
    const row = bySkill.get(skillId) || {
      skillId,
      skillName: attempt.skillName || titleCase(skillId),
      attempts: [],
      historyLatestAt: "",
      lifetimeLatestAt: "",
      lifetimeAttemptCount: 0,
      lifetimeCorrectCount: 0,
      lifetimeTotalQuestions: 0
    };
    row.attempts.push(attemptDisplayRow(attempt));
    row.historyLatestAt = latestDate([row.historyLatestAt, attempt.completedAt]);
    const attemptEvidence = rawEvidence.filter(evidence => evidence.sourceRecordId === attempt.attemptId);
    if (isTerminalAdministrationStatus(attempt.administrationStatus) && attemptHasScorableResult(attempt, attemptEvidence)) {
      row.lifetimeAttemptCount += 1;
      row.lifetimeLatestAt = latestDate([row.lifetimeLatestAt, attempt.completedAt]);
      row.lifetimeCorrectCount += Number(attempt.correctCount || 0);
      row.lifetimeTotalQuestions += Number(attempt.totalQuestions || 0);
    }
    bySkill.set(skillId, row);
  });
  const primarySkills = Array.from(bySkill.values()).map(row => {
    const sortedAttempts = row.attempts.slice().sort((a, b) => (
      finiteTimestamp(b.completedAt) - finiteTimestamp(a.completedAt) ||
      String(b.attemptId || "").localeCompare(String(a.attemptId || ""))
    ));
    const latestAttempt = sortedAttempts.find(attemptRow => (
      isTerminalAdministrationStatus(attemptRow.administrationStatus)
    )) || null;
    const currentEvidence = latestAttempt
      ? rawEvidence.filter(evidence => evidence.sourceRecordId === latestAttempt.attemptId)
      : [];
    const currentScorable = attemptHasScorableResult(latestAttempt?.raw || null, currentEvidence);
    const skillAttempts = attempts.filter(attempt => (
      normalizeReportingKey(attempt.skillId) === row.skillId
    ));
    const policyStatus = computeSkillStatus(
      assessmentAttemptsToSkillLedger(skillAttempts, row.skillId),
      row.skillId,
      { now }
    );
    const evidenceStatus = scoredAssessmentStatus(
      latestAttempt?.raw || null,
      currentEvidence,
      now
    );
    const currentStatus = policyStatus
      ? reportingStatus(
          policyStatus.status === SKILL_STATUS_IDS.SECURE && !policyStatus.needsReview
            ? REPORTING_STATUS_IDS.SECURE
            : policyStatus.status === SKILL_STATUS_IDS.NOT_STARTED
              ? REPORTING_STATUS_IDS.NOT_CHECKED
              : policyStatus.needsReview || policyStatus.status === SKILL_STATUS_IDS.IN_PROGRESS
                  ? evidenceStatus.id === REPORTING_STATUS_IDS.NEEDS_TEACHING
                    ? REPORTING_STATUS_IDS.NEEDS_TEACHING
                    : REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
                  : REPORTING_STATUS_IDS.DEVELOPING
        )
      : evidenceStatus;
    const currentAccuracy = currentScorable ? finiteNumber(latestAttempt?.accuracy) : null;
    const lifetimeAccuracy = row.lifetimeTotalQuestions
      ? Math.round((row.lifetimeCorrectCount / row.lifetimeTotalQuestions) * 100)
      : null;
    return {
      ...row,
      attempts: sortedAttempts,
      history: sortedAttempts,
      attemptCount: row.attempts.length,
      latestAt: latestAttempt?.completedAt || "",
      latestDate: latestAttempt?.completedAt || "",
      latestCorrectCount: currentScorable ? finiteNumber(latestAttempt?.correctCount) : null,
      latestTotalQuestions: currentScorable ? finiteNumber(latestAttempt?.totalQuestions) : null,
      latestAccuracy: currentAccuracy,
      latestPassed: currentScorable ? Boolean(latestAttempt?.passed) : null,
      correctCount: currentScorable ? finiteNumber(latestAttempt?.correctCount) : null,
      totalQuestions: currentScorable ? finiteNumber(latestAttempt?.totalQuestions) : null,
      accuracy: currentAccuracy,
      currentAccuracy,
      currentScore: {
        correct: currentScorable ? finiteNumber(latestAttempt?.correctCount) : null,
        total: currentScorable ? finiteNumber(latestAttempt?.totalQuestions) : null,
        accuracy: currentAccuracy,
        scorable: currentScorable
      },
      lifetimeAttemptCount: row.lifetimeAttemptCount,
      lifetimeAccuracy,
      lifetime: {
        attempts: row.lifetimeAttemptCount,
        correct: row.lifetimeCorrectCount,
        total: row.lifetimeTotalQuestions,
        accuracy: lifetimeAccuracy,
        latestAt: row.lifetimeLatestAt
      },
      currentStatus,
      status: currentStatus,
      statusLabel: currentStatus.label,
      skillStatus: policyStatus,
      latestAttempt
    };
  });
  const legacySkillRows = skillSummaryRows(skillMasterySummary).flatMap(row => {
    const skillId = normalizeReportingKey(row.skillId || row.id);
    if (!skillId || coveredSkillIds.has(skillId)) return [];
    const matchingEvidence = legacySkills.find(item => item.sourceRecordId === skillId);
    if (!matchingEvidence) return [];
    const attemptsCount = Number(row.attempts || 0);
    const accuracy = finiteNumber(row.accuracy) ?? (
      Number(row.total || 0) > 0 ? Math.round((Number(row.score || 0) / Number(row.total)) * 100) : null
    );
    return [{
      skillId,
      skillName: row.skillName || row.label || titleCase(skillId),
      attempts: [],
      history: [],
      latestAt: matchingEvidence.observedAt,
      correctCount: finiteNumber(row.score),
      totalQuestions: finiteNumber(row.total),
      attemptCount: attemptsCount,
      accuracy,
      latestCorrectCount: finiteNumber(row.score),
      latestTotalQuestions: finiteNumber(row.total),
      latestAccuracy: accuracy,
      latestPassed: matchingEvidence.statusCandidate === REPORTING_STATUS_IDS.SECURE,
      currentAccuracy: accuracy,
      currentScore: {
        correct: finiteNumber(row.score),
        total: finiteNumber(row.total),
        accuracy,
        scorable: Boolean(matchingEvidence.statusCandidate)
      },
      lifetimeAttemptCount: attemptsCount,
      lifetimeAccuracy: accuracy,
      lifetime: {
        attempts: attemptsCount,
        correct: finiteNumber(row.score),
        total: finiteNumber(row.total),
        accuracy,
        latestAt: matchingEvidence.observedAt
      },
      currentStatus: matchingEvidence.status,
      status: matchingEvidence.status,
      statusLabel: matchingEvidence.status?.label || REPORTING_STATUS_LABELS[REPORTING_STATUS_IDS.NOT_CHECKED],
      latestDate: matchingEvidence.observedAt,
      latestAttempt: null,
      source: "legacy_projection",
      legacy: true,
      provenance: {
        evidenceId: matchingEvidence.evidenceId,
        rawProjection: row
      }
    }];
  });
  const answerSkillRows = legacyAnswerSkillRows(legacyAnswerEvidence)
    .filter(row => !primarySkills.some(primary => primary.skillId === row.skillId));
  const skills = [...primarySkills, ...answerSkillRows, ...legacySkillRows]
    .sort((a, b) => finiteTimestamp(b.latestAt) - finiteTimestamp(a.latestAt) || a.skillName.localeCompare(b.skillName));
  const activeSkillIds = new Set(skills.map(row => normalizeReportingKey(row.skillId)));
  const expectedConcepts = [
    ...(activeSkillIds.has("initial_sounds") ? initialSoundExpectedItemKeys.map(key => ({
      domain: "phonological_awareness",
      construct: "initial_sound",
      key: canonicalPhonemeKey(key),
      label: `Initial sound /${readablePattern(canonicalPhonemeKey(key))}/`
    })) : []),
    ...(activeSkillIds.has("final_sounds") ? finalSoundExpectedItemKeys.map(key => ({
      domain: "phonological_awareness",
      construct: "final_sound",
      key: canonicalPhonemeKey(key),
      label: `Final sound /${readablePattern(canonicalPhonemeKey(key))}/`
    })) : [])
  ].map(createReportingConcept);

  return {
    reportKey: "skills_check",
    title: "Skills assessment",
    subtitle: "Saved assessments",
    studentId: resolvedStudentId,
    summary: {
      attempts: attempts.length,
      lifetimeAttempts: skills.reduce((total, row) => total + Number(row.lifetimeAttemptCount || 0), 0),
      skillsChecked: skills.length,
      currentItems: displayItems.length,
      secureItems: displayItems.filter(row => row.statusCandidate === REPORTING_STATUS_IDS.SECURE).length,
      developingItems: displayItems.filter(row => row.statusCandidate === REPORTING_STATUS_IDS.DEVELOPING).length,
      needsTeachingItems: displayItems.filter(row => row.statusCandidate === REPORTING_STATUS_IDS.NEEDS_TEACHING).length,
      legacyFallbackItems: [
        ...primaryKnowledge.filter(row => row.sourceRecordType === "legacy_answer_history"),
        ...legacyItems,
        ...legacySkills
      ].length,
      latestAt: latestDate(skills.map(row => row.latestAt)),
      historyLatestAt: latestDate(attempts.map(row => row.completedAt))
    },
    skills,
    attempts: attempts.map(attemptDisplayRow),
    items: displayItems,
    evidence: dedupeReportingEvidence([...rawEvidence, ...legacyItems, ...legacySkills]),
    knowledgeEvidence,
    expectedConcepts,
    provenance: {
      canonicalAttemptIds: attempts.map(row => row.attemptId),
      attemptQuestionsAreCanonical: true,
      answerHistoryIsFallbackOnly: true,
      answerHistoryRowsRead: asArray(answerHistory).length,
      answerHistoryRowsUsed: legacyAnswerEvidence.length,
      answerHistoryRowsSuppressedByCanonicalAttempts:
        answerReconciliation.suppressed.length,
      answerHistoryAttemptIdentityComplete: false,
      itemMasteryIsFallbackOnly: true,
      suppressedItemMasteryConceptCount: countSuppressedItemMasteryRows(
        itemMastery,
        coveredConceptIds,
        coveredConceptSpineKeys
      )
    }
  };
}

function latestSourceTimestamp(rows = []) {
  return latestDate(rows.flatMap(row => [
    row?.updatedAt,
    row?.updated_at,
    row?.lastAssessed,
    row?.completedAt,
    row?.completed_at,
    row?.answeredAt,
    row?.answered_at,
    row?.observedAt,
    row?.timestamp,
    row?.date
  ]).filter(Boolean));
}

function evidenceReadSourceState(evidenceReadState = {}, key = "") {
  const source = evidenceReadState?.sources?.[key];
  return source && typeof source === "object" ? source : {};
}

/**
 * One read model for every student assessment report. Both the focused EL
 * workbook and the Whole Child/Skills Check views consume this result so a
 * store cannot silently exist in one export and disappear from the other.
 */
export function buildStudentAssessmentEvidenceReadModel({
  student = {},
  studentId = "",
  assessmentHistory = [],
  localAssessmentHistory = [],
  cloudAssessmentHistory = [],
  answerHistory = [],
  itemMastery = {},
  skillMasterySummary = {},
  evidenceReadState = {},
  now = new Date()
} = {}) {
  const resolvedStudentId = getStudentId(student, studentId);
  const canonicalAttempts = getCanonicalStudentAssessmentAttempts({
    student: { ...student, id: resolvedStudentId },
    assessmentHistory,
    localAssessmentHistory,
    cloudAssessmentHistory
  });
  const itemRows = itemMasteryRows(itemMastery);
  const skillRows = skillSummaryRows(skillMasterySummary);
  const completedAt = evidenceReadState.completedAt || "";
  const sourceDefinitions = [
    {
      key: "answers",
      store: "answers",
      purpose: "Saved question answers used when an assessment attempt archive is unavailable",
      rows: asArray(answerHistory)
    },
    {
      key: "assessmentAttempts",
      store: "assessment_attempts",
      purpose: "Canonical completed and in-progress assessment attempts",
      rows: canonicalAttempts
    },
    {
      key: "itemMastery",
      store: "item_mastery",
      purpose: "Older item results used when question-level results are unavailable",
      rows: itemRows
    },
    {
      key: "skillMastery",
      store: "mastery",
      purpose: "Older skill results used when assessment-level results are unavailable",
      rows: skillRows
    }
  ];
  const sourceReads = sourceDefinitions.map(definition => {
    const state = evidenceReadSourceState(evidenceReadState, definition.key);
    return {
      store: definition.store,
      purpose: definition.purpose,
      recordCount: definition.rows.length,
      latestRecordAt: latestSourceTimestamp(definition.rows),
      lastSyncedAt: state.lastSyncedAt || completedAt,
      syncStatus: state.syncStatus || evidenceReadState.syncStatus || (
        completedAt ? "complete" : "not_recorded"
      )
    };
  });
  const skillsCheck = buildSkillsCheckReportModel({
    student: { ...student, id: resolvedStudentId },
    assessmentHistory: canonicalAttempts,
    answerHistory,
    itemMastery,
    skillMasterySummary,
    now
  });

  return {
    studentId: resolvedStudentId,
    canonicalAttempts,
    skillsCheck,
    sourceReads,
    completedAt,
    latestSyncedAt: latestDate(sourceReads.map(row => row.lastSyncedAt))
  };
}

function storyRowsFromInput(storyQuestSummary = {}) {
  if (Array.isArray(storyQuestSummary)) return storyQuestSummary;
  if (Array.isArray(storyQuestSummary?.rows)) return storyQuestSummary.rows;
  return Object.entries(storyQuestSummary || {})
    .filter(([, value]) => value && typeof value === "object" && !Array.isArray(value))
    .map(([questId, row]) => ({ questId, ...row }));
}

function arcadeRowsFromInput(arcade = {}) {
  if (Array.isArray(arcade)) return arcade;
  if (Array.isArray(arcade?.rows)) return arcade.rows;
  const games = arcade?.games && typeof arcade.games === "object" ? arcade.games : {};
  const catalog = new Map(asArray(arcade?.gameCatalog).map(row => [row.id, row]));
  return Object.entries(games).map(([gameId, progress = {}]) => ({
    gameId,
    title: catalog.get(gameId)?.title || progress.title || titleCase(gameId),
    skill: catalog.get(gameId)?.skill || progress.skill || "",
    category: catalog.get(gameId)?.category || progress.category || "",
    ...progress
  }));
}

export function buildOtherLearningReportModel({
  student = {},
  studentId = "",
  soundSeekersReport = {},
  storyQuestSummary = {},
  arcade = {},
  engagement = {}
} = {}) {
  const resolvedStudentId = getStudentId(student, studentId);
  const heat = asArray(soundSeekersReport?.heat || soundSeekersReport?.report?.heat);
  const soundEvidence = [];
  const expectedConcepts = [];
  const sounds = heat.map(tile => {
    const concept = createReportingConcept({
      domain: "phonics",
      construct: "grapheme_sound",
      key: tile.id,
      label: `Sound for ${tile.label || readablePattern(tile.id)}`
    });
    expectedConcepts.push(concept);
    const bucket = normalizeReportingKey(tile.bucket);
    const seen = Number(tile.seen || tile.independentSeen || 0) > 0 && bucket !== "unseen";
    const sourceResult = bucket === "got_it"
      ? "Got it in Sound Seekers"
      : bucket === "reteach"
        ? "Needs re-teaching in Sound Seekers"
        : bucket === "almost"
          ? "Almost there in Sound Seekers"
          : "Not checked";
    const candidate = bucket === "got_it"
      ? REPORTING_STATUS_IDS.SECURE
      : bucket === "reteach"
        ? REPORTING_STATUS_IDS.NEEDS_TEACHING
        : bucket === "almost"
          ? REPORTING_STATUS_IDS.DEVELOPING
          : null;
    if (seen && candidate) {
      soundEvidence.push(createReportingEvidence({
        evidenceId: `sound_seekers:${tile.id}:current`,
        studentId: resolvedStudentId,
        sourceArea: "sound_seekers",
        sourceLabel: "Sound Seekers",
        sourceRecordId: tile.id,
        sourceRecordType: "sound_mastery_state",
        evidenceKind: REPORTING_EVIDENCE_KINDS.PRACTICE,
        concept,
        outcome: bucket,
        statusCandidate: candidate,
        observedAt: tile.lastActiveAt || "",
        administrationStatus: "practice",
        scorable: true,
        knowledgeEligible: true,
        details: { sourceResult, bucket, seen: tile.seen, independentSeen: tile.independentSeen, accuracy: tile.accuracy, rawTile: tile },
        provenance: {
          masteryGateResult: bucket,
          sourceRecordKind: "current_sound_seekers_heat_tile",
          timestampBasis: tile.lastActiveAt ? "per_sound_last_evidence" : "undated_snapshot"
        }
      }));
    }
    const sharedStatus = soundEvidence.at(-1)?.sourceRecordId === tile.id
      ? soundEvidence.at(-1).status
      : reportingStatus(REPORTING_STATUS_IDS.NOT_CHECKED);
    return {
      id: tile.id,
      label: tile.label || readablePattern(tile.id),
      sourceResult,
      wholeChildStatus: sharedStatus,
      practiceOnly: true,
      seen: Number(tile.seen || 0),
      accuracy: finiteNumber(tile.accuracy),
      lastActiveAt: tile.lastActiveAt || "",
      raw: tile
    };
  });

  const storyEvidence = [];
  const stories = storyRowsFromInput(storyQuestSummary).map((row, index) => {
    const questId = row.questId || row.id || `story_${index + 1}`;
    const title = row.title || questId;
    const words = [...new Set(asArray(
      row.words || row.wordsFound || row.wordsEncountered
    ).map(cleanWord).filter(Boolean))];
    words.forEach(word => storyEvidence.push(createReportingEvidence({
      evidenceId: `story_quests:${questId}:encountered:${word}`,
      studentId: resolvedStudentId,
      sourceArea: "story_quests",
      sourceLabel: "Story Quests",
      sourceRecordId: questId,
      sourceRecordType: "vocabulary_exposure",
      evidenceKind: REPORTING_EVIDENCE_KINDS.EXPOSURE,
      concept: {
        domain: "vocabulary",
        construct: "word_exposure",
        key: word,
        label: `Encountered “${word}” in Story Quests`
      },
      outcome: "encountered",
      statusCandidate: null,
      observedAt: row.lastActivityAt || row.updatedAt || row.completedAt || "",
      administrationStatus: "exposure",
      scorable: false,
      knowledgeEligible: false,
      details: { questId, title, word, rawStory: row },
      provenance: { questId, claimBoundary: "encountered_not_learned" }
    })));
    return {
      questId,
      title,
      completed: Boolean(row.completed || normalizeReportingKey(row.status) === "completed"),
      completedAt: row.completedAt || "",
      lastActivityAt: row.lastActivityAt || row.updatedAt || row.completedAt || "",
      vocabularyEncountered: words,
      wordsEncountered: words,
      words,
      vocabularyLabel: "Vocabulary encountered",
      raw: row
    };
  });

  const arcadeEvidence = [];
  const games = arcadeRowsFromInput(arcade).filter(row => Number(row.plays || 0) > 0 || row.lastPlayedAt).map((row, index) => {
    const gameId = row.gameId || row.id || `game_${index + 1}`;
    arcadeEvidence.push(createReportingEvidence({
      evidenceId: `arcade:${gameId}:practice`,
      studentId: resolvedStudentId,
      sourceArea: "arcade",
      sourceLabel: "Arcade",
      sourceRecordId: gameId,
      sourceRecordType: "game_practice_summary",
      evidenceKind: REPORTING_EVIDENCE_KINDS.PRACTICE,
      concept: {
        domain: "literacy_skill",
        construct: "broad_skill_practice",
        key: normalizeReportingKey(row.skill || gameId),
        label: row.skill ? `Practised: ${row.skill}` : `Practised ${row.title || titleCase(gameId)}`
      },
      outcome: "practised",
      statusCandidate: null,
      observedAt: row.lastPlayedAt || "",
      administrationStatus: "practice",
      scorable: false,
      knowledgeEligible: false,
      details: { gameId, title: row.title, skill: row.skill, plays: Number(row.plays || 0), rawGame: row },
      provenance: { gameId, claimBoundary: "practice_not_mastery" }
    }));
    return {
      gameId,
      title: row.title || titleCase(gameId),
      skillPractised: row.skill || "",
      skill: row.skill || "",
      category: row.category || "",
      plays: Number(row.plays || 0),
      stars: Number(row.stars || 0),
      highScore: Number(row.highScore || 0),
      wordsCompleted: Number(row.wordsCompleted || 0),
      lastPlayedAt: row.lastPlayedAt || "",
      claimLabel: "Practised",
      raw: row
    };
  });

  const evidence = dedupeReportingEvidence([...soundEvidence, ...storyEvidence, ...arcadeEvidence]);
  return {
    reportKey: "other_learning",
    title: "Other learning",
    studentId: resolvedStudentId,
    summary: {
      soundSeekersSoundsSeen: sounds.filter(row => row.seen > 0).length,
      soundSeekersSoundsGotIt: sounds.filter(row => row.sourceResult === "Got it in Sound Seekers").length,
      arcadeGamesPlayed: games.length,
      storyQuestsCompleted: stories.filter(row => row.completed).length,
      vocabularyEncountered: [...new Set(stories.flatMap(row => row.vocabularyEncountered))].length,
      latestAt: latestDate([
        soundSeekersReport.lastActiveAt,
        ...games.map(row => row.lastPlayedAt),
        ...stories.map(row => row.lastActivityAt)
      ])
    },
    soundSeekers: {
      title: "Sound Seekers",
      sounds,
      note: "Sound Seekers is practice. A passed game result cannot make the student overview Secure by itself."
    },
    arcade: {
      title: "Arcade practice",
      games,
      note: "Arcade data records activity and broad practice, not item-level mastery."
    },
    storyQuests: {
      title: "Story Quests",
      stories,
      vocabularyLabel: "Vocabulary encountered",
      note: "Words a student has encountered are not reported as learned without scored results."
    },
    engagement: cloneValue(engagement, {}),
    evidence,
    knowledgeEvidence: dedupeReportingEvidence(soundEvidence),
    expectedConcepts,
    provenance: {
      practiceCannotCreateSecure: true,
      storyQuestExposureIsNotMastery: true,
      arcadeHasNoItemAccuracyLedger: true
    }
  };
}

function wholeChildOverallStatus(concepts = []) {
  if (!concepts.length || concepts.every(row => row.status.id === REPORTING_STATUS_IDS.NOT_CHECKED)) {
    return reportingStatus(REPORTING_STATUS_IDS.NOT_CHECKED);
  }
  if (concepts.some(row => row.status.id === REPORTING_STATUS_IDS.MIXED_EVIDENCE)) {
    return reportingStatus(REPORTING_STATUS_IDS.MIXED_EVIDENCE);
  }
  if (concepts.some(row => row.status.id === REPORTING_STATUS_IDS.NEEDS_TEACHING)) {
    return reportingStatus(REPORTING_STATUS_IDS.NEEDS_TEACHING);
  }
  if (concepts.some(row => row.status.id === REPORTING_STATUS_IDS.DEVELOPING)) {
    return reportingStatus(REPORTING_STATUS_IDS.DEVELOPING);
  }
  if (concepts.some(row => row.status.id === REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE)) {
    return reportingStatus(REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  }
  return reportingStatus(REPORTING_STATUS_IDS.SECURE);
}

function wholeChildPriorityRows(concepts = []) {
  const statusRank = {
    [REPORTING_STATUS_IDS.NEEDS_TEACHING]: 0,
    [REPORTING_STATUS_IDS.MIXED_EVIDENCE]: 1,
    [REPORTING_STATUS_IDS.DEVELOPING]: 2,
    [REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE]: 3
  };
  return concepts
    .filter(row => Object.prototype.hasOwnProperty.call(statusRank, row.status.id))
    .sort((left, right) => (
      statusRank[left.status.id] - statusRank[right.status.id] ||
      Number(right.decisiveStrength || 0) - Number(left.decisiveStrength || 0) ||
      finiteTimestamp(right.decisiveLatestAt || right.latestAt) -
        finiteTimestamp(left.decisiveLatestAt || left.latestAt) ||
      left.domainLabel.localeCompare(right.domainLabel) ||
      left.label.localeCompare(right.label) ||
      left.conceptId.localeCompare(right.conceptId)
    ))
    .map(row => ({
      id: row.conceptId,
      conceptId: row.conceptId,
      label: row.label,
      detail: row.explanation,
      reason: row.explanation,
      status: row.status,
      statusLabel: row.status.label,
      domain: row.domain,
      domainLabel: row.domainLabel,
      latestAt: row.decisiveLatestAt || row.latestAt,
      confidence: row.confidence,
      sourceChips: row.sourceChips
    }));
}

function wholeChildDescriptiveAssessment(row = {}) {
  const latestAttempt = row.latestAttempt || {};
  const profile = row.profile || {};
  const detail = row.detail || {};
  const grade = profile.grade || latestAttempt.grade || detail.grade || "";
  const benchmarkWindow = profile.benchmarkWindow || latestAttempt.benchmarkWindow || detail.benchmarkWindow || "";
  const formVersion = profile.formVersion || latestAttempt.formVersion || detail.formVersion || "";
  const contentVersion = profile.contentVersion || latestAttempt.contentVersion || detail.contentVersion || "";
  const scoringVersion = profile.scoringVersion || latestAttempt.scoringVersion || detail.scoringVersion || "";
  const scoringRuleVersion = profile.scoringRuleVersion || detail.scoringRuleVersion || "";
  const administrationVersion = profile.administrationVersion || detail.administrationVersion || "";
  const routeLabel = grade && benchmarkWindow
    ? `Grade ${grade} · ${benchmarkWindowLabel(benchmarkWindow)}`
    : grade
      ? `Grade ${grade}`
      : benchmarkWindow
        ? benchmarkWindowLabel(benchmarkWindow)
        : "";
  return {
    assessmentId: row.assessmentId || "",
    number: row.number ?? null,
    title: row.title || row.shortTitle || "EL assessment",
    label: row.shortTitle || row.title || "EL assessment",
    shortTitle: row.shortTitle || row.title || "EL assessment",
    resultLabel: row.resultLabel || "Recorded",
    interpretation: row.interpretation || profile.interpretation || "These results are descriptive and do not use the general Secure cut-off.",
    latestAt: row.latestAt || profile.latestDate || latestAttempt.completedAt || "",
    attemptCount: Number(row.attemptCount || profile.attemptCount || 0),
    latestAttemptId: latestAttempt.attemptId || profile.latestAttemptId || detail.attemptId || "",
    administrationStatus: profile.administrationStatus || latestAttempt.administrationStatus || detail.administrationStatus || "",
    grade,
    benchmarkWindow,
    routeLabel,
    formVersion,
    contentVersion,
    scoringVersion,
    scoringRuleVersion,
    administrationVersion,
    route: {
      grade,
      benchmarkWindow,
      label: routeLabel
    },
    form: {
      formVersion,
      contentVersion,
      scoringVersion,
      scoringRuleVersion,
      administrationVersion
    },
    metrics: cloneValue(profile.metrics || detail.metrics, {}),
    recommendations: cloneValue(profile.recommendations || detail.recommendations, []),
    observations: cloneValue(profile.observations || detail.observations, []),
    validationIssues: cloneValue(profile.validationIssues || detail.validationIssues, []),
    descriptive: true,
    masteryStatus: null
  };
}

export function buildWholeChildKnowledgeModel({
  student = {},
  studentId = "",
  evidence = [],
  expectedConcepts = [],
  descriptiveAssessments = [],
  sourceReads = [],
  conflictWindowDays = LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
  now = new Date()
} = {}) {
  const resolvedStudentId = getStudentId(student, studentId);
  const filteredEvidence = dedupeReportingEvidence(evidence).filter(row => (
    !resolvedStudentId || !row.studentId || row.studentId === resolvedStudentId
  ));
  const concepts = resolveWholeChildConcepts({
    evidence: filteredEvidence,
    expectedConcepts,
    conflictWindowDays,
    now
  });
  const byDomainMap = new Map();
  concepts.forEach(concept => {
    const domain = byDomainMap.get(concept.domain) || {
      id: concept.domain,
      domain: concept.domain,
      label: concept.domainLabel,
      domainLabel: concept.domainLabel,
      concepts: [],
      items: []
    };
    domain.concepts.push(concept);
    domain.items.push(concept);
    byDomainMap.set(concept.domain, domain);
  });
  Object.entries(REPORTING_DOMAIN_LABELS).forEach(([domainId, domainLabel]) => {
    if (byDomainMap.has(domainId)) return;
    byDomainMap.set(domainId, {
      id: domainId,
      domain: domainId,
      label: domainLabel,
      domainLabel,
      concepts: [],
      items: [],
      noData: true
    });
  });
  const statusCounts = Object.values(REPORTING_STATUS_IDS).reduce((counts, statusId) => {
    counts[statusId] = concepts.filter(row => row.status.id === statusId).length;
    return counts;
  }, {});
  const checkedDescriptiveAssessments = asArray(descriptiveAssessments)
    .filter(row => row?.checked !== false && (row?.latestAttempt || row?.attemptCount || row?.latestAt))
    .map(wholeChildDescriptiveAssessment)
    .sort((a, b) => a.number - b.number || a.title.localeCompare(b.title));
  const nextSteps = wholeChildPriorityRows(concepts);
  const latestKnowledgeAt = latestDate(concepts.map(row => row.latestAt));
  const latestDescriptiveAt = latestDate(checkedDescriptiveAssessments.map(row => row.latestAt));
  const evidenceHealth = buildEvidenceHealth({
    concepts,
    evidence: filteredEvidence,
    sourceReads,
    now
  });

  return {
    reportKey: "whole_child",
    title: "What this student knows",
    studentId: resolvedStudentId,
    overallStatus: wholeChildOverallStatus(concepts),
    summary: {
      concepts: concepts.length,
      ...statusCounts,
      descriptiveAssessmentsChecked: checkedDescriptiveAssessments.length,
      descriptiveAssessmentsTotal: asArray(descriptiveAssessments).length,
      latestKnowledgeAt,
      latestDescriptiveAt,
      latestAt: latestDate([latestKnowledgeAt, latestDescriptiveAt])
    },
    groups: {
      secure: concepts.filter(row => row.status.id === REPORTING_STATUS_IDS.SECURE),
      developing: concepts.filter(row => row.status.id === REPORTING_STATUS_IDS.DEVELOPING),
      needsTeaching: concepts.filter(row => row.status.id === REPORTING_STATUS_IDS.NEEDS_TEACHING),
      mixedEvidence: concepts.filter(row => row.status.id === REPORTING_STATUS_IDS.MIXED_EVIDENCE),
      notEnoughEvidence: concepts.filter(
        row => row.status.id === REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
      ),
      notChecked: concepts.filter(row => row.status.id === REPORTING_STATUS_IDS.NOT_CHECKED)
    },
    byDomain: Array.from(byDomainMap.values()).sort((a, b) => (
      Number(Boolean(a.noData)) - Number(Boolean(b.noData))
      || a.domainLabel.localeCompare(b.domainLabel)
    )),
    nextSteps,
    evidenceHealth,
    descriptiveAssessments: checkedDescriptiveAssessments,
    concepts,
    evidence: filteredEvidence,
    provenance: {
      statusLabels: REPORTING_STATUS_LABELS,
      evidencePrecedence: "Formal and teacher observations > legacy projections > practice > exposure.",
      conflictWindowDays,
      practiceCannotCreateSecure: true,
      missingMeansNotChecked: true,
      conflictsAreNotAveraged: true,
      evidenceHealthIsDiagnosticOnly: true,
      descriptiveAssessmentsDoNotAffectMasteryCounts: true,
      priorityOrder: "Needs support, then Results differ, then Developing; newer teacher-led assessments first."
    }
  };
}

/**
 * Main report API. Hydrate the existing stores, pass them once, and receive
 * five independently renderable, display-ready report models.
 */
export function buildStudentReportingWorkspaceModel({
  student = {},
  studentId = "",
  assessmentHistory = [],
  localAssessmentHistory = [],
  cloudAssessmentHistory = [],
  answerHistory = [],
  letterAssessment = [],
  patternAssessment = [],
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = "",
  guidedReadingRecords = {},
  guidedReadingRows = [],
  guidedReadingWordRows = [],
  itemMastery = {},
  skillMasterySummary = {},
  storyQuestSummary = {},
  soundSeekersReport = {},
  arcade = {},
  engagement = {},
  expectedConcepts = [],
  wholeChildConflictWindowDays = 90,
  evidenceReadState = {},
  now = new Date()
} = {}) {
  const resolvedStudentId = getStudentId(student, studentId);
  const suppliedStudentId = String(student.id || student.studentId || "");
  const hasConflictingStudentIdentity = Boolean(
    studentId && suppliedStudentId && suppliedStudentId !== resolvedStudentId
  );
  const requestedStudent = {
    ...student,
    id: resolvedStudentId,
    name: hasConflictingStudentIdentity ? "Student" : getStudentName(student),
    classId: hasConflictingStudentIdentity ? "" : getClassId(student)
  };
  const evidenceRead = buildStudentAssessmentEvidenceReadModel({
    student: requestedStudent,
    assessmentHistory,
    localAssessmentHistory,
    cloudAssessmentHistory,
    answerHistory,
    itemMastery,
    skillMasterySummary,
    evidenceReadState,
    now
  });
  const canonicalAttempts = evidenceRead.canonicalAttempts;
  const identityHistory = canonicalAttempts.slice().sort((a, b) => (
    finiteTimestamp(b.completedAt || b.updatedAt) - finiteTimestamp(a.completedAt || a.updatedAt)
  ));
  const latestNameRecord = identityHistory.find(attempt => (
    attempt.studentName && attempt.studentName !== "Student"
  ));
  const latestClassRecord = identityHistory.find(attempt => attempt.classId);
  const resolvedStudent = {
    ...requestedStudent,
    name: hasConflictingStudentIdentity
      ? latestNameRecord?.studentName || "Student"
      : getStudentName(requestedStudent),
    classId: hasConflictingStudentIdentity
      ? latestClassRecord?.classId || ""
      : getClassId(requestedStudent)
  };
  const elAssessments = buildElAssessmentReportModel({
    student: resolvedStudent,
    assessmentHistory: canonicalAttempts,
    letterAssessment,
    patternAssessment,
    benchmarkScope,
    benchmarkGrade,
    benchmarkWindow,
    now
  });
  const guidedReading = buildGuidedReadingReportModel({
    student: resolvedStudent,
    guidedReadingRecords,
    guidedReadingRows,
    guidedReadingWordRows
  });
  const skillsCheck = evidenceRead.skillsCheck;
  const otherLearning = buildOtherLearningReportModel({
    student: resolvedStudent,
    soundSeekersReport,
    storyQuestSummary,
    arcade,
    engagement
  });
  const wholeChildEvidence = dedupeReportingEvidence([
    ...elAssessments.knowledgeEvidence,
    ...guidedReading.knowledgeEvidence,
    ...skillsCheck.knowledgeEvidence,
    ...otherLearning.knowledgeEvidence
  ]);
  const wholeChild = buildWholeChildKnowledgeModel({
    student: resolvedStudent,
    evidence: wholeChildEvidence,
    // Once an area has been used, include its curriculum coverage as
    // Not checked rows make omissions visible rather than silent.
    expectedConcepts: [
      ...asArray(expectedConcepts),
      ...asArray(skillsCheck.expectedConcepts),
      ...asArray(otherLearning.expectedConcepts)
    ],
    descriptiveAssessments: elAssessments.assessments.filter(row => row.descriptive),
    sourceReads: evidenceRead.sourceReads,
    conflictWindowDays: wholeChildConflictWindowDays,
    now
  });

  return {
    schemaVersion: STUDENT_REPORTING_WORKSPACE_SCHEMA_VERSION,
    student: {
      id: resolvedStudentId,
      name: getStudentName(resolvedStudent),
      classId: getClassId(resolvedStudent)
    },
    generatedAt: new Date(now).toISOString(),
    wholeChild,
    elAssessments,
    guidedReading,
    skillsCheck,
    otherLearning,
    provenance: {
      inputAssessmentRecordCount: flattenRecordCount(assessmentHistory) +
        flattenRecordCount(localAssessmentHistory) +
        flattenRecordCount(cloudAssessmentHistory),
      inputAnswerRecordCount: flattenRecordCount(answerHistory),
      canonicalAssessmentAttemptCount: canonicalAttempts.length,
      wholeChildEvidenceCount: wholeChildEvidence.length,
      evidenceReadCompletedAt: evidenceRead.completedAt,
      evidenceLatestSyncedAt: evidenceRead.latestSyncedAt,
      sourceReads: evidenceRead.sourceReads,
      sourceReportKeys: [
        elAssessments.reportKey,
        guidedReading.reportKey,
        skillsCheck.reportKey,
        otherLearning.reportKey
      ]
    }
  };
}
