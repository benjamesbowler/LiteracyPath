export const QUESTION_FLAG_STORAGE_KEY = "lpAssessmentQuestionFlags";
export const RETIRED_MEDIA_QA_STORAGE_KEY = "lpUnifiedMediaQaReviewDecisions";
export const QUESTION_REPORT_RPC = "report_assessment_question";
export const QUESTION_REPORT_REVIEW_RPC = "admin_review_assessment_question_report";
export const QUESTION_REPORT_TABLE = "assessment_question_reports";
const QUESTION_REPORT_PAGE_SIZE = 500;
const QUESTION_REPORT_MAX_PAGES = 200;

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeText(value = "") {
  return String(value || "").trim();
}

function boundedText(value, maximumLength) {
  return normalizeText(value).slice(0, maximumLength);
}

function safeLocalImagePath(value = "") {
  const path = normalizeText(value);
  if (
    !/^\/[A-Za-z0-9][A-Za-z0-9_./-]*$/.test(path)
    || path.includes("..")
  ) {
    return "";
  }
  return path.slice(0, 500);
}

function optionValue(option) {
  if (option && typeof option === "object") {
    return option.value || option.word || option.label || option.text || option.answer || "";
  }
  return option || "";
}

function optionLabel(option) {
  if (option && typeof option === "object") {
    return option.label || option.text || option.word || option.value || option.answer || "";
  }
  return option || "";
}

function optionImage(option) {
  if (!option || typeof option !== "object") return "";
  return option.image || option.imagePath || option.imageUrl || option.targetImage || option.targetImagePath || "";
}

function uniqueByPath(items = []) {
  const seen = new Set();
  return items.filter(item => {
    const path = safeLocalImagePath(item.path);
    if (!path || seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}

function sanitizeAnswerChoices(items = []) {
  return (Array.isArray(items) ? items : [])
    .slice(0, 12)
    .filter(item => item && typeof item === "object")
    .map(item => ({
      label: boundedText(optionLabel(item), 200),
      value: boundedText(optionValue(item), 200),
      image: safeLocalImagePath(optionImage(item))
    }));
}

function sanitizeImageContexts(items = []) {
  return uniqueByPath(
    (Array.isArray(items) ? items : [])
      .slice(0, 12)
      .filter(item => item && typeof item === "object")
      .map(item => ({
        label: boundedText(item.label, 200),
        path: safeLocalImagePath(item.path)
      }))
  );
}

function questionReportError(message, code = "LP_QUESTION_REPORT_FAILED", cause = null) {
  const error = new Error(message);
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

function cloudReportRow(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data && typeof data === "object" ? data : null;
}

export function createQuestionReportId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  throw questionReportError(
    "This browser cannot create a secure report reference.",
    "LP_QUESTION_REPORT_ID_UNAVAILABLE"
  );
}

export function getQuestionImageContexts(question = {}) {
  const directImages = [
    ["Question image", question.imagePath || question.imageUrl || question.image],
    ["Target image", question.targetImage || question.targetImagePath || question.targetImageUrl]
  ].map(([label, path]) => ({ label, path: safeLocalImagePath(path) }));

  const cardImages = [
    ...(Array.isArray(question.imageCards) ? question.imageCards : []),
    ...(Array.isArray(question.promptImageCards) ? question.promptImageCards : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ].map(option => ({
    label: boundedText(optionLabel(option) || optionValue(option) || "Answer image", 200),
    path: safeLocalImagePath(optionImage(option))
  }));

  const choiceImageMap = question.choiceImages && typeof question.choiceImages === "object"
      ? Object.entries(question.choiceImages).map(([label, image]) => ({
        label: boundedText(label, 200),
        path: safeLocalImagePath(image?.image || image?.imagePath || image?.imageUrl || "")
      }))
    : [];

  return uniqueByPath([...directImages, ...cardImages, ...choiceImageMap]).slice(0, 12);
}

export function getQuestionAnswerChoices(question = {}) {
  const choices = Array.isArray(question.answerOptions) && question.answerOptions.length
    ? question.answerOptions
    : Array.isArray(question.options) && question.options.length
    ? question.options
    : Array.isArray(question.choices)
    ? question.choices
    : [];

  return sanitizeAnswerChoices(choices);
}

export function buildQuestionReportSnapshot({
  question = {},
  stage = {},
  visiblePrompt = ""
} = {}) {
  return {
    schemaVersion: 1,
    skillId: boundedText(question.skillId || question.assessmentSkillId || stage.id, 240),
    skillName: boundedText(question.skillName || question.skill || stage.label, 240),
    questionId: boundedText(question.id || question.questionId || question.approvedQuestionId, 240),
    prompt: boundedText(visiblePrompt || question.prompt || question.question, 2000),
    questionText: boundedText(question.question || question.prompt, 2000),
    sentence: boundedText(
      question.visibleSentenceWithBlank
      || question.sentence
      || question.passage
      || question.context,
      4000
    ),
    targetWord: boundedText(question.targetWord || question.itemKey || question.audioText, 500),
    correctAnswer: boundedText(question.correctAnswer || question.answer, 1000),
    answerChoices: getQuestionAnswerChoices(question),
    images: getQuestionImageContexts(question)
  };
}

export function normalizeQuestionReport(row = {}) {
  const snapshot = row.question_snapshot && typeof row.question_snapshot === "object"
    ? row.question_snapshot
    : {};
  return {
    id: normalizeText(row.id || row.report_id),
    flagType: (row.flag_type || row.report_type) === "question" ? "question" : "image",
    status: normalizeText(row.status || row.report_status || "open"),
    decision: normalizeText(row.decision),
    decisionNotes: normalizeText(row.decision_notes),
    createdAt: normalizeText(row.created_at || row.reported_at),
    updatedAt: normalizeText(row.updated_at),
    reviewedAt: normalizeText(row.reviewed_at),
    schoolId: normalizeText(row.school_id),
    classId: normalizeText(row.class_id),
    studentId: normalizeText(row.student_id),
    teacherId: normalizeText(row.teacher_id),
    reporterKind: normalizeText(row.reporter_kind),
    skillId: normalizeText(row.skill_id || snapshot.skillId),
    skillName: normalizeText(row.skill_name || snapshot.skillName),
    questionId: normalizeText(row.question_id || snapshot.questionId),
    prompt: normalizeText(row.prompt || snapshot.prompt),
    questionText: normalizeText(row.question_text || snapshot.questionText),
    sentence: normalizeText(row.sentence || snapshot.sentence),
    targetWord: normalizeText(row.target_word || snapshot.targetWord),
    correctAnswer: normalizeText(row.correct_answer || snapshot.correctAnswer),
    answerChoices: sanitizeAnswerChoices(Array.isArray(row.answer_choices)
      ? row.answer_choices
      : Array.isArray(snapshot.answerChoices) ? snapshot.answerChoices : []),
    images: sanitizeImageContexts(Array.isArray(row.images)
      ? row.images
      : Array.isArray(snapshot.images) ? snapshot.images : [])
  };
}

export async function submitQuestionReport({
  supabase,
  studentSessionToken = "",
  studentId = "",
  flagType,
  question = {},
  stage = {},
  visiblePrompt = "",
  reportId = ""
} = {}) {
  let stableReportId = reportId;
  if (!stableReportId) {
    try {
      stableReportId = createQuestionReportId();
    } catch (error) {
      return {
        ok: false,
        report: null,
        reportId: "",
        error
      };
    }
  }
  if (!supabase?.call) {
    return {
      ok: false,
      report: null,
      reportId: stableReportId,
      error: questionReportError(
        "The report was not sent because the school database is unavailable.",
        "LP_QUESTION_REPORT_OFFLINE"
      )
    };
  }
  if (!studentId) {
    return {
      ok: false,
      report: null,
      reportId: stableReportId,
      error: questionReportError(
        "Choose a student before reporting this question.",
        "LP_QUESTION_REPORT_STUDENT_REQUIRED"
      )
    };
  }

  try {
    const result = await supabase.call(QUESTION_REPORT_RPC, {
      p_student_token: normalizeText(studentSessionToken) || null,
      p_student_id: studentId,
      p_flag_type: flagType === "question" ? "question" : "image",
      p_report_id: stableReportId,
      p_question_snapshot: buildQuestionReportSnapshot({
        question,
        stage,
        visiblePrompt
      })
    });
    const row = cloudReportRow(result?.data);
    if (result?.error || !row?.report_id) {
      return {
        ok: false,
        report: null,
        reportId: stableReportId,
        error: questionReportError(
          "The report was not sent. Check the connection and try again.",
          "LP_QUESTION_REPORT_NOT_SAVED",
          result?.error || null
        )
      };
    }
    return {
      ok: true,
      report: normalizeQuestionReport(row),
      reportId: stableReportId,
      error: null
    };
  } catch (cause) {
    return {
      ok: false,
      report: null,
      reportId: stableReportId,
      error: questionReportError(
        "The report was not sent. Check the connection and try again.",
        "LP_QUESTION_REPORT_NOT_SAVED",
        cause
      )
    };
  }
}

export async function loadQuestionReports({ supabase } = {}) {
  if (!supabase?.table) {
    throw questionReportError(
      "Reported questions cannot be loaded because the school database is unavailable.",
      "LP_QUESTION_REPORTS_OFFLINE"
    );
  }
  const reports = [];
  for (let page = 0; page < QUESTION_REPORT_MAX_PAGES; page += 1) {
    const start = page * QUESTION_REPORT_PAGE_SIZE;
    const result = await supabase
      .table(QUESTION_REPORT_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(start, start + QUESTION_REPORT_PAGE_SIZE - 1);
    if (result?.error) {
      throw questionReportError(
        "Reported questions could not be loaded. Nothing has been treated as missing.",
        "LP_QUESTION_REPORTS_LOAD_FAILED",
        result.error
      );
    }
    const pageRows = Array.isArray(result?.data) ? result.data : [];
    reports.push(...pageRows.map(normalizeQuestionReport));
    if (pageRows.length < QUESTION_REPORT_PAGE_SIZE) return reports;
  }
  throw questionReportError(
    "There are too many reports to load safely in one review. Nothing has been treated as missing.",
    "LP_QUESTION_REPORTS_TOO_MANY"
  );
}

export async function recordQuestionReportDecision({
  supabase,
  reportId,
  decision,
  notes = ""
} = {}) {
  if (!supabase?.call) {
    throw questionReportError(
      "The review decision was not saved because the school database is unavailable.",
      "LP_QUESTION_REPORT_DECISION_OFFLINE"
    );
  }
  const allowed = new Set([
    "image_needs_checking",
    "question_needs_checking",
    "no_change_needed"
  ]);
  if (!allowed.has(decision)) {
    throw questionReportError(
      "Choose a valid review decision.",
      "LP_QUESTION_REPORT_DECISION_INVALID"
    );
  }
  const result = await supabase.call(QUESTION_REPORT_REVIEW_RPC, {
    p_report_id: reportId,
    p_decision: decision,
    p_notes: normalizeText(notes)
  });
  const row = cloudReportRow(result?.data);
  if (result?.error || !row?.id) {
    throw questionReportError(
      "The review decision was not saved. The report is still open.",
      "LP_QUESTION_REPORT_DECISION_FAILED",
      result?.error || null
    );
  }
  return normalizeQuestionReport(row);
}

export async function deleteQuestionReport({ supabase, reportId } = {}) {
  if (!supabase?.table) {
    throw questionReportError(
      "The report was not deleted because the school database is unavailable.",
      "LP_QUESTION_REPORT_DELETE_OFFLINE"
    );
  }
  const result = await supabase
    .table(QUESTION_REPORT_TABLE)
    .delete()
    .eq("id", reportId)
    .select("id");
  if (result?.error || !Array.isArray(result?.data) || result.data.length !== 1) {
    throw questionReportError(
      "The report was not deleted.",
      "LP_QUESTION_REPORT_DELETE_FAILED",
      result?.error || null
    );
  }
  return reportId;
}

export function readLegacyDeviceOnlyQuestionReportCount() {
  if (!canUseLocalStorage()) return 0;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_FLAG_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function resetRetiredMediaQaReviewStorage() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(RETIRED_MEDIA_QA_STORAGE_KEY);
}
