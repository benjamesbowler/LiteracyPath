import {
  EL_BENCHMARK_FORM_DEFINITIONS,
  EL_BENCHMARK_FORM_IDS,
  EL_BENCHMARK_IDS,
  getElBenchmarkPlan
} from "./elBenchmarkAssessments.js";

export const EL_BENCHMARK_QUICK_ADMINISTRATION_VERSION = "2026.07.22-quick-v1";
export const EL_BENCHMARK_RESPONSE_SCHEMA_VERSION = 2;

function recordGrade(record = {}) {
  return String(
    record.grade ?? record.gradePath?.grade ?? record.gradePath ?? record.metadata?.grade ?? ""
  ).toUpperCase();
}

function recordWindow(record = {}) {
  return String(
    record.benchmarkWindow || record.window || record.metadata?.benchmarkWindow || record.metadata?.window || ""
  ).toUpperCase();
}

export function findLatestElBenchmarkAttempt({
  assessmentHistory = [],
  studentId = "",
  assessmentId = "",
  grade = "",
  window: windowName = ""
} = {}) {
  const normalizedGrade = String(grade || "").toUpperCase();
  const normalizedWindow = String(windowName || "").toUpperCase();
  return (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .filter(record => record.studentId === studentId)
    .filter(record => record.assessmentType === assessmentId || record.skillId === assessmentId)
    .filter(record => {
      const savedGrade = recordGrade(record);
      const savedWindow = recordWindow(record);
      return (!normalizedGrade || savedGrade === normalizedGrade) &&
        (!normalizedWindow || savedWindow === normalizedWindow);
    })
    .sort((a, b) => new Date(b.updatedAt || b.completedAt || 0) - new Date(a.updatedAt || a.completedAt || 0))[0] || null;
}

export function isCompletedElBenchmarkAttempt(record = {}) {
  return String(record.administrationStatus || record.status || "").toLowerCase() === "completed";
}

export function isCompletedElBenchmarkRouteEvidence(record = {}) {
  if (!isCompletedElBenchmarkAttempt(record)) return false;
  const scoreStatus = String(record.scoreStatus || record.benchmark?.scoreStatus || "").toLowerCase();
  if ([
    "partial",
    "not_scorable",
    "not_administered",
    "not_started",
    "discontinued",
    "in_progress"
  ].includes(scoreStatus)) return false;
  if (Array.isArray(record.validationIssues) && record.validationIssues.length > 0) return false;
  if ((Array.isArray(record.questionRecords) ? record.questionRecords : []).some(
    item => Array.isArray(item?.validationIssues) && item.validationIssues.length > 0
  )) return false;
  return true;
}

const FORM_IDS = Object.freeze(EL_BENCHMARK_FORM_DEFINITIONS.map(form => form.id));
const MAX_RECORDED_FORM_EXPOSURES = 12;
const FORM_ID_ALIASES = Object.freeze({
  a: EL_BENCHMARK_FORM_IDS.A,
  "form-a": EL_BENCHMARK_FORM_IDS.A,
  "form-a-v2": EL_BENCHMARK_FORM_IDS.A,
  b: EL_BENCHMARK_FORM_IDS.B,
  "form-b": EL_BENCHMARK_FORM_IDS.B,
  "form-b-v1": EL_BENCHMARK_FORM_IDS.B,
  c: EL_BENCHMARK_FORM_IDS.C,
  "form-c": EL_BENCHMARK_FORM_IDS.C,
  "form-c-v1": EL_BENCHMARK_FORM_IDS.C
});

function recordAssessmentId(record = {}) {
  return String(record.assessmentType || record.assessmentId || record.skillId || "");
}

function recordFormId(record = {}) {
  const raw = record.formId || record.formVersion || record.metadata?.formId ||
    record.metadata?.formVersion || record.benchmark?.formId || "";
  const normalized = FORM_ID_ALIASES[String(raw).trim().toLowerCase()];
  if (normalized) return normalized;

  // This selector is already scoped to Assessments 3-6. Records created before
  // parallel forms existed were necessarily Form A even if old persistence did
  // not retain an explicit form field.
  return raw ? "" : EL_BENCHMARK_FORM_IDS.A;
}

function recordTimestamp(record = {}) {
  const value = record.updatedAt || record.updated_at || record.completedAt ||
    record.startedAt || record.createdAt || record.created_at || "";
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function dedupeAttempts(records = []) {
  const byId = new Map();
  records.forEach((record, index) => {
    const key = record.attemptId || record.id || `legacy-${index}-${recordTimestamp(record)}`;
    const existing = byId.get(key);
    const isNewer = !existing || recordTimestamp(record) > recordTimestamp(existing);
    const winsEqualTimestamp = existing && recordTimestamp(record) === recordTimestamp(existing) &&
      isCompletedElBenchmarkAttempt(record) && !isCompletedElBenchmarkAttempt(existing);
    if (isNewer || winsEqualTimestamp) byId.set(key, record);
  });
  return Array.from(byId.values());
}

function isIncompleteAttempt(record = {}) {
  return ["in_progress", "partial"].includes(
    String(record.administrationStatus || record.status || "").toLowerCase()
  );
}

/**
 * Select a controlled parallel form for one student/domain/grade/window.
 * Completed, valid administrations consume A, then B, then C. An unfinished
 * administration keeps its form and consumes nothing. After all three forms
 * have been exposed, selection records that exhaustion; after three
 * valid completions it cycles A/B/C deterministically so reuse is explicit.
 */
export function selectElBenchmarkForm({
  assessmentHistory = [],
  studentId = "",
  assessmentId = "",
  grade = "K",
  window: windowName = "BOY"
} = {}) {
  const normalizedGrade = String(grade || "K").toUpperCase();
  const normalizedWindow = String(windowName || "BOY").toUpperCase();
  const scoped = dedupeAttempts((Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .filter(record => record.studentId === studentId)
    .filter(record => recordAssessmentId(record) === assessmentId)
    .filter(record => recordGrade(record) === normalizedGrade)
    .filter(record => recordWindow(record) === normalizedWindow));
  const completed = scoped
    .filter(isCompletedElBenchmarkRouteEvidence)
    .sort((a, b) => recordTimestamp(a) - recordTimestamp(b));
  const latestCompletedAt = completed.length ? recordTimestamp(completed.at(-1)) : -1;
  const resumable = scoped
    .filter(isIncompleteAttempt)
    .filter(record => FORM_IDS.includes(recordFormId(record)))
    .filter(record => recordTimestamp(record) > latestCompletedAt)
    .sort((a, b) => recordTimestamp(b) - recordTimestamp(a))[0] || null;
  const completedCount = completed.length;
  const formId = resumable
    ? recordFormId(resumable)
    : FORM_IDS[completedCount % FORM_IDS.length];
  const priorExposures = scoped
    .filter(record => FORM_IDS.includes(recordFormId(record)))
    .sort((a, b) => recordTimestamp(a) - recordTimestamp(b))
    .map(record => ({
      attemptId: record.attemptId || record.id || "",
      formId: recordFormId(record),
      status: String(record.administrationStatus || record.status || "unknown").toLowerCase(),
      occurredAt: record.updatedAt || record.completedAt || record.startedAt || ""
    }));
  const exposedFormIds = Array.from(new Set(priorExposures.map(exposure => exposure.formId)));
  const exposureCountByForm = Object.fromEntries(FORM_IDS.map(candidate => [
    candidate,
    priorExposures.filter(exposure => exposure.formId === candidate).length
  ]));
  const allParallelFormsExposed = FORM_IDS.every(candidate => exposedFormIds.includes(candidate));
  const fallbackAfterExhaustion = !resumable && (
    completedCount >= FORM_IDS.length || allParallelFormsExposed
  );
  const formPurpose = resumable
    ? "resume_incomplete"
    : fallbackAfterExhaustion
      ? "same_window_retest_after_parallel_forms"
      : completedCount === 0
        ? "initial_benchmark"
        : "same_window_retest";
  const formSelectionReason = resumable
    ? "latest_incomplete_same_window_attempt"
    : fallbackAfterExhaustion
      ? "parallel_forms_exhausted_deterministic_cycle"
      : completedCount === 0
        ? "no_valid_completed_same_window_attempt"
        : `${completedCount}_valid_completed_same_window_attempt${completedCount === 1 ? "" : "s"}`;

  return {
    formId,
    formPurpose,
    formSelectionReason,
    resumeAttemptId: resumable?.attemptId || resumable?.id || "",
    formExposure: {
      schemaVersion: 1,
      studentId,
      assessmentId,
      grade: normalizedGrade,
      window: normalizedWindow,
      validCompletedCount: completedCount,
      administrationOrdinal: completedCount + 1,
      exposedFormIds,
      priorExposureCount: priorExposures.length,
      exposureCountByForm,
      selectedFormPriorExposureCount: exposureCountByForm[formId] || 0,
      allParallelFormsExposed,
      parallelFormsExhausted: allParallelFormsExposed,
      fallbackAfterExhaustion,
      deterministicCycleNumber: Math.floor(completedCount / FORM_IDS.length) + 1,
      priorExposuresTruncated: priorExposures.length > MAX_RECORDED_FORM_EXPOSURES,
      priorExposures: priorExposures.slice(-MAX_RECORDED_FORM_EXPOSURES)
    }
  };
}

function placementMicrophase(record = {}) {
  const placement = record.confirmedPlacement;
  return String(
    placement?.candidateMicrophase || placement?.microphase || placement?.id || ""
  ).trim();
}

function fluencyHandoffMicrophase(record = {}) {
  const handoff = record.metrics?.fluencyStartMicrophase ||
    record.fluencyStartMicrophase ||
    record.confirmedPlacement?.fluencyStartMicrophase ||
    null;
  return String(typeof handoff === "string" ? handoff : handoff?.microphase || handoff?.id || "").trim();
}

export function getElBenchmarkPrerequisiteStatus({
  assessmentHistory = [],
  studentId = "",
  assessmentId = "",
  grade = "K",
  window: windowName = "BOY"
} = {}) {
  const normalizedGrade = String(grade || "K").toUpperCase();
  const normalizedWindow = String(windowName || "BOY").toUpperCase();
  const completedHistory = (Array.isArray(assessmentHistory) ? assessmentHistory : []).filter(isCompletedElBenchmarkAttempt);
  const completedRouteEvidence = completedHistory.filter(isCompletedElBenchmarkRouteEvidence);
  const ready = {
    state: "ready",
    code: "route_ready",
    message: "The supplied sequence prerequisite is recorded.",
    evidenceAttemptId: ""
  };

  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) return ready;

  if (assessmentId === EL_BENCHMARK_IDS.ENCODING) {
    if (normalizedGrade !== "K") return ready;
    const letterAttempt = completedHistory
      .filter(record => record.studentId === studentId)
      .filter(record => record.assessmentType === "el_letter_assessment" || record.skillId === "el_letter_assessment")
      .sort((a, b) => new Date(b.updatedAt || b.completedAt || 0) - new Date(a.updatedAt || a.completedAt || 0))[0] || null;
    if (normalizedWindow === "BOY") {
      return {
        state: "override",
        code: "kindergarten_boy_encoding_not_routine",
        message: "Encoding is not routine in the Kindergarten beginning-of-year route. Record why it is appropriate now.",
        evidenceAttemptId: letterAttempt?.attemptId || ""
      };
    }
    if (!letterAttempt) {
      return {
        state: "override",
        code: "letter_sound_evidence_missing",
        message: "Complete Assessment 1 or record the external letter-sound evidence that supports starting Encoding.",
        evidenceAttemptId: ""
      };
    }
    return {
      state: "confirmation",
      code: "confirm_kindergarten_letter_sounds",
      message: "Confirm that Assessment 1 and classroom evidence show the taught letter sounds are accurate enough to begin Encoding.",
      evidenceAttemptId: letterAttempt.attemptId || ""
    };
  }

  if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
    const encoding = findLatestElBenchmarkAttempt({
      assessmentHistory: completedRouteEvidence,
      studentId,
      assessmentId: EL_BENCHMARK_IDS.ENCODING,
      grade: normalizedGrade,
      window: windowName
    });
    if (!encoding || !placementMicrophase(encoding)) {
      return {
        state: "override",
        code: "confirmed_encoding_start_missing",
        message: "Complete Assessment 4 and confirm its Decoding start band, or record why other evidence should be used.",
        evidenceAttemptId: encoding?.attemptId || ""
      };
    }
    if (normalizedGrade === "K" && normalizedWindow === "BOY") {
      return {
        state: "confirmation",
        code: "confirm_kindergarten_boy_decoding_exception",
        message: "Decoding is not routine at Kindergarten beginning of year. Confirm this exception before starting.",
        evidenceAttemptId: encoding.attemptId || ""
      };
    }
    return { ...ready, evidenceAttemptId: encoding.attemptId || "" };
  }

  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    const decoding = findLatestElBenchmarkAttempt({
      assessmentHistory: completedRouteEvidence,
      studentId,
      assessmentId: EL_BENCHMARK_IDS.DECODING,
      grade: normalizedGrade,
      window: windowName
    });
    if (!decoding || !fluencyHandoffMicrophase(decoding)) {
      return {
        state: "override",
        code: "decoding_fluency_handoff_missing",
        message: "Complete Assessment 5 with an accurate-and-automatic Fluency handoff, or record why another starting point is appropriate.",
        evidenceAttemptId: decoding?.attemptId || ""
      };
    }
    if (normalizedGrade === "K") {
      return {
        state: "confirmation",
        code: "confirm_optional_kindergarten_fluency",
        message: "Fluency is optional rather than routine in Kindergarten. Confirm why it is useful now.",
        evidenceAttemptId: decoding.attemptId || ""
      };
    }
    return { ...ready, evidenceAttemptId: decoding.attemptId || "" };
  }

  return ready;
}

export function resolveElBenchmarkStartMicrophase({
  assessmentHistory = [],
  studentId = "",
  assessmentId = "",
  grade = "K",
  window: windowName = "BOY",
  requestedStart = ""
} = {}) {
  if (requestedStart) {
    return { startMicrophase: requestedStart, routeSource: "teacher_selected", sourceAttemptId: "" };
  }

  // A saved partial is useful evidence, but it cannot silently replace the
  // completed attempt that satisfied the ordered assessment prerequisite.
  // Route provenance and prerequisite provenance must point at the same class
  // of durable, completed evidence.
  const completedHistory = (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .filter(isCompletedElBenchmarkRouteEvidence);

  if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
    const encoding = findLatestElBenchmarkAttempt({
      assessmentHistory: completedHistory,
      studentId,
      assessmentId: EL_BENCHMARK_IDS.ENCODING,
      grade,
      window: windowName
    });
    const confirmed = encoding?.confirmedPlacement || null;
    const provisional = encoding?.candidatePlacement || null;
    // The overview does not provide an encoding conversion table. Never route
    // from an unconfirmed provisional suggestion unless its own evidence
    // explicitly says teacher confirmation is not required.
    const placement = confirmed || (provisional?.requiresTeacherConfirmation === false ? provisional : null);
    const startMicrophase = placement?.candidateMicrophase || placement?.microphase || "";
    if (startMicrophase) {
      return {
        startMicrophase,
        routeSource: confirmed ? "confirmed_encoding_placement" : "provisional_encoding_indication",
        sourceAttemptId: encoding.attemptId || ""
      };
    }
  }

  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    const decoding = findLatestElBenchmarkAttempt({
      assessmentHistory: completedHistory,
      studentId,
      assessmentId: EL_BENCHMARK_IDS.DECODING,
      grade,
      window: windowName
    });
    const handoff = decoding?.metrics?.fluencyStartMicrophase ||
      decoding?.fluencyStartMicrophase ||
      decoding?.confirmedPlacement?.fluencyStartMicrophase || "";
    const startMicrophase = typeof handoff === "string"
      ? handoff
      : handoff?.microphase || handoff?.id || "";
    if (startMicrophase) {
      return {
        startMicrophase,
        routeSource: "decoding_fluency_handoff",
        sourceAttemptId: decoding.attemptId || ""
      };
    }
  }

  return { startMicrophase: "", routeSource: "grade_window_expected_anchor", sourceAttemptId: "" };
}

export function createElBenchmarkSession({
  assessmentHistory = [],
  assessmentId,
  grade = "K",
  window: windowName = "BOY",
  requestedStart = "",
  ownership = {},
  startedAt,
  sessionToken
} = {}) {
  if (!ownership.studentId) throw new TypeError("A selected student is required to start an EL benchmark.");
  if (!startedAt) throw new TypeError("A stable start timestamp is required.");
  if (!sessionToken) throw new TypeError("A stable session token is required.");

  const normalizedGrade = String(grade || "K").toUpperCase();
  const normalizedWindow = String(windowName || "BOY").toUpperCase();
  const route = resolveElBenchmarkStartMicrophase({
    assessmentHistory,
    studentId: ownership.studentId,
    assessmentId,
    grade: normalizedGrade,
    window: normalizedWindow,
    requestedStart
  });
  const formSelection = selectElBenchmarkForm({
    assessmentHistory,
    studentId: ownership.studentId,
    assessmentId,
    grade: normalizedGrade,
    window: normalizedWindow
  });
  const plan = getElBenchmarkPlan({
    assessmentId,
    grade: normalizedGrade,
    window: normalizedWindow,
    startMicrophase: route.startMicrophase || undefined,
    formId: formSelection.formId
  });

  return {
    sessionId: `el_benchmark_session_${sessionToken}`,
    attemptId: `el_benchmark_attempt_${ownership.studentId}_${sessionToken}`,
    studentId: ownership.studentId,
    studentName: ownership.studentName || "Student",
    classId: ownership.classId || "",
    teacherId: ownership.teacherId || "",
    assessmentId,
    grade: normalizedGrade,
    window: normalizedWindow,
    formId: plan.formId,
    formParallelSetId: plan.form?.parallelSetId || "",
    formEquatingStatus: plan.form?.equatingStatus || "",
    formPurpose: formSelection.formPurpose,
    formSelectionReason: formSelection.formSelectionReason,
    formExposure: formSelection.formExposure,
    formSelection: {
      formId: plan.formId,
      purpose: formSelection.formPurpose,
      selectionReason: formSelection.formSelectionReason,
      resumeAttemptId: formSelection.resumeAttemptId,
      exposure: formSelection.formExposure
    },
    planId: plan.planId,
    contentVersion: plan.contentVersion,
    administrationVersion: EL_BENCHMARK_QUICK_ADMINISTRATION_VERSION,
    responseSchemaVersion: EL_BENCHMARK_RESPONSE_SCHEMA_VERSION,
    startMicrophase: plan.route?.selectedStartMicrophase || route.startMicrophase || "",
    startCycle: plan.route?.selectedStartCycle ?? null,
    routeSource: route.routeSource,
    sourceAttemptId: route.sourceAttemptId,
    currentItemIndex: 0,
    itemIndex: 0,
    status: "in_progress",
    administrationStatus: "in_progress",
    responses: {},
    startedAt,
    updatedAt: startedAt
  };
}
