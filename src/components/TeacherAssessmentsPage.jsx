import { useEffect, useMemo, useRef, useState } from "react";

import {
  ASSESSMENT_GRADE_OPTIONS,
  ASSESSMENT_STARTERS,
  ASSESSMENT_START_POINT_KINDS,
  ASSESSMENT_TIME_OF_YEAR_OPTIONS,
  defaultStartPointSelection,
  describeStartPointSelection,
  formatEstimatedMinutes,
  getAssessmentCatalogEntry,
  isStartPointSatisfied,
  listAssessmentCatalog,
  listSkillStartPoints
} from "../data/assessmentCatalog.js";
import { LEARNING_EVIDENCE_POLICY } from "../policy/learningPolicy.js";
import {
  readTeacherFunnelParams,
  writeTeacherFunnelParams
} from "../appState/appViewHelpers.js";
import { useElBenchmarkStartPoint } from "./assessment/elBenchmarkStartPoint.js";
import { ElPrerequisiteReview } from "./assessment/ELAssessmentsPage.jsx";
import { ConfirmActionDialog } from "./teacher/TeacherAdminDialogs.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import { TeacherDataTable } from "./teacher/ui/TeacherPrimitives.jsx";
import { getClassListReadView } from "../appState/classListReadState.js";
import { getStudentRosterReadView } from "../appState/studentRosterReadState.js";
import { getClassDashboardReadView } from "../appState/classDashboardReadState.js";

// ── ONE PAGE, THREE STEPS ───────────────────────────────────────────────────
//
// Student, assessment, run it. The class is not asked for here: the shared
// teacher context bar above this page already says which class every tool is
// scoped to, so a second class picker only invited the two to disagree.
//
// The step number is DERIVED on every render (`assessmentStep` below) and never
// stored. A stored step is a second source of truth for something the answers
// already say, and it goes stale the moment a student is chosen from another
// screen.
//
// Changing the student here does NOT navigate. That is the whole point of the
// screen: `onSelectStudent` loads the newly chosen student in place, the panels
// re-scope around them, and the teacher stays put. Anything below the student -
// the chosen assessment, its starting point - is cleared, because a starting
// point picked for one student means nothing for the next.
//
// Every answer also lives in the URL, so a reload lands exactly here rather
// than back on the student list.

const CATALOG = listAssessmentCatalog();
const SKILL_START_POINTS = listSkillStartPoints();
const EVIDENCE_WINDOW_DAYS = LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays;
const HISTORY_PAGE_SIZE = 25;

const ASSESSMENT_HISTORY_TYPE_LABELS = Object.freeze({
  skill_checkpoint: "Skills assessment",
  el_letter_assessment: "Letter names and sounds",
  advanced_phonics_patterns: "Phonics patterns"
});

const ASSESSMENT_HISTORY_STATUS = Object.freeze({
  completed: Object.freeze({ id: "completed", label: "Completed" }),
  discontinued: Object.freeze({ id: "discontinued", label: "Stopped early" }),
  not_scorable: Object.freeze({ id: "not_scorable", label: "Could not score" })
});

// The one assessment the app can aim at a named student's own next skill is the
// one it can suggest. Found by its start point rather than by id, so the
// suggestion follows the catalog instead of a copy of it.
const SUGGESTED_ENTRY = CATALOG.find(
  row => row.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL
) || null;

const ASSESSMENT_KIND_LABELS = Object.freeze({
  suggested: "Suggested",
  curriculum: "Curriculum",
  phonics: "Phonics",
  benchmark: "Benchmark"
});

function assessmentKind(entry, suggested = false) {
  if (suggested) return "suggested";
  if (entry.starter === ASSESSMENT_STARTERS.EL_BENCHMARK) return "benchmark";
  if (entry.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL) return "curriculum";
  return "phonics";
}

/** The short "what it costs you" line under each card. Never a score. */
function assessmentMeta(entry) {
  const minutes = formatEstimatedMinutes(entry);
  switch (entry.startPoint.kind) {
    case ASSESSMENT_START_POINT_KINDS.SKILL:
      return `${minutes} · Starts on the next skill`;
    case ASSESSMENT_START_POINT_KINDS.NONE:
      return `${minutes} · ${entry.startPoint.summary || "Full set"}`;
    default:
      return `${minutes} · Grade and time of year needed`;
  }
}

function comparableSkillName(value = "") {
  return String(value || "").trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}

function studentDisplayRows(rows = [], fallback = []) {
  const source = rows.length ? rows : fallback;
  return [...source]
    .filter(row => row?.id)
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

function historyStatus(record = {}) {
  const value = String(record.administrationStatus || "").trim().toLowerCase();
  if (ASSESSMENT_HISTORY_STATUS[value]) return ASSESSMENT_HISTORY_STATUS[value];
  if (record.discontinued === true) return ASSESSMENT_HISTORY_STATUS.discontinued;
  // Fully normalised archive rows always carry administrationStatus. This
  // fallback keeps older completed rows visible without mistaking partial,
  // in-progress or explicitly unadministered records for finished work.
  if (
    record.completedAt
    && !["partial", "in_progress", "not_administered"].includes(value)
  ) {
    return ASSESSMENT_HISTORY_STATUS.completed;
  }
  return null;
}

function historyTimestamp(record = {}) {
  const value = record.completedAt || record.updatedAt || record.startedAt || "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatHistoryDate(record = {}) {
  const timestamp = historyTimestamp(record);
  if (!timestamp) return "Date unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function historyCatalogEntry(record = {}) {
  const assessmentType = String(record.assessmentType || "");
  return CATALOG.find(row => (
    row.id === assessmentType || row.benchmarkId === assessmentType
  )) || null;
}

function historyAssessmentLabel(record = {}) {
  return ASSESSMENT_HISTORY_TYPE_LABELS[record.assessmentType]
    || historyCatalogEntry(record)?.label
    || record.skillName
    || "Assessment";
}

function historyAssessmentDetail(record = {}) {
  if (record.assessmentType === "skill_checkpoint") {
    return record.skillName && record.skillName !== "Assessment" ? record.skillName : "";
  }
  const catalogEntry = historyCatalogEntry(record);
  if (catalogEntry?.starter !== ASSESSMENT_STARTERS.EL_BENCHMARK) return "";
  const grade = ASSESSMENT_GRADE_OPTIONS.find(option => option.value === record.gradePath)?.label || "";
  const timeOfYear = ASSESSMENT_TIME_OF_YEAR_OPTIONS.find(
    option => option.value === record.benchmarkWindow
  )?.label || "";
  return [grade, timeOfYear].filter(Boolean).join(" · ");
}

function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function TeacherAssessmentsPage({
  classList = [],
  classListReadState = null,
  teacherId,
  selectedClassId = "",
  className = "",
  onOpenClasses,
  studentRows = [],
  classDashboardReadState = null,
  studentList = [],
  studentListReadState = null,
  loadingClasses = false,
  loadingStudents = false,
  onRetryClasses,
  onRetryStudents,
  onRetryClassDashboard,
  selectedStudentId = "",
  selectedStudentName = "",
  onSelectStudent,
  studentEvidenceReady = true,
  studentEvidenceReadState = { syncStatus: "complete" },
  onRetryStudentEvidence,
  firstUnsecuredSkillIndex = 0,
  assessmentHistory = [],
  assessmentHistoryReadState = null,
  onRetryAssessmentHistory,
  elBenchmarkDraft = null,
  letterAssessmentDraft = null,
  phonicsPatternAssessmentDraft = null,
  onResumeDraft,
  onDiscardDraft,
  onStartSkillCheck,
  onStartLetterCheck,
  onStartPhonicsPatternCheck,
  onStartBenchmark,
  // The hash this page was opened with. Left undefined the page reads the live
  // URL; tests and previews pass one in so a mid-flow state can be set up the
  // same way a reload would produce it.
  routeHash = undefined
}) {
  const params = readTeacherFunnelParams(routeHash);
  const [checkId, setCheckId] = useState(() => (
    getAssessmentCatalogEntry(params.get("check") || "") ? params.get("check") : ""
  ));
  const [grade, setGrade] = useState(() => params.get("grade") || elBenchmarkDraft?.grade || "K");
  const [timeOfYear, setTimeOfYear] = useState(() => params.get("time") || elBenchmarkDraft?.window || "BOY");
  const [band, setBand] = useState(() => params.get("band") || "");
  const [bandChosenByTeacher, setBandChosenByTeacher] = useState(() => Boolean(params.get("band")));
  // null means "not answered yet", which is not the same as skill 0. Reading a
  // missing parameter as a number gives 0, and that silently started every
  // skills check on Initial Sounds instead of on the student's next skill.
  const [skillIndex, setSkillIndex] = useState(() => {
    if (!params.has("skill")) return null;
    const fromUrl = Number(params.get("skill"));
    return Number.isInteger(fromUrl) && fromUrl >= 0 && fromUrl < SKILL_START_POINTS.length
      ? fromUrl
      : null;
  });
  const [awaitingReason, setAwaitingReason] = useState(false);
  const [discardDraftConfirmOpen, setDiscardDraftConfirmOpen] = useState(false);
  const [discardDraftBusy, setDiscardDraftBusy] = useState(false);
  const [discardDraftError, setDiscardDraftError] = useState("");
  const [assessmentChoicesOpen, setAssessmentChoicesOpen] = useState(() => !checkId);
  const [previousAssessmentsOpen, setPreviousAssessmentsOpen] = useState(
    () => params.get("view") === "previous"
  );
  const [historyPage, setHistoryPage] = useState(() => ({
    classId: selectedClassId,
    count: HISTORY_PAGE_SIZE
  }));

  const assessmentHeadingRef = useRef(null);
  const assessmentPanelRef = useRef(null);
  const startHeadingRef = useRef(null);
  const startPanelRef = useRef(null);
  const reachedStepRef = useRef(0);

  const classRead = getClassListReadView({
    readState: classListReadState,
    teacherId,
    legacyLoading: loadingClasses
  });
  const visibleClassList = classRead.rowsVerified ? classList : [];
  const rosterRead = getStudentRosterReadView({
    readState: studentListReadState,
    classId: selectedClassId,
    legacyLoading: loadingStudents
  });
  const dashboardRead = getClassDashboardReadView({
    readState: classDashboardReadState,
    classId: selectedClassId
  });
  const rows = useMemo(
    () => {
      const verifiedRosterRows = rosterRead.rowsBelongToClass ? studentList : [];
      const verifiedDashboardRows = dashboardRead.rowsBelongToClass
        ? studentRows.filter(row => (
          !classDashboardReadState?.status
          || String(row?.classId || "") === String(selectedClassId || "")
        ))
        : [];
      return studentDisplayRows(
        dashboardRead.complete ? verifiedDashboardRows : [],
        verifiedRosterRows
      );
    },
    [
      classDashboardReadState?.status,
      dashboardRead.complete,
      dashboardRead.rowsBelongToClass,
      rosterRead.rowsBelongToClass,
      selectedClassId,
      studentList,
      studentRows
    ]
  );
  const selectedStudentAssessmentHistory = useMemo(
    () => assessmentHistory.filter(record => record?.studentId === selectedStudentId),
    [assessmentHistory, selectedStudentId]
  );
  const previousAssessments = useMemo(() => {
    const currentNames = new Map(rows.map(row => [String(row.id), row.name]));
    const seenAttemptIds = new Set();
    return assessmentHistory
      .filter(record => String(record?.classId || "") === String(selectedClassId || ""))
      .map(record => ({ record, status: historyStatus(record) }))
      .filter(item => item.status)
      .filter(({ record }) => {
        const stableId = String(record.attemptId || record.id || "").trim();
        if (!stableId) return true;
        if (seenAttemptIds.has(stableId)) return false;
        seenAttemptIds.add(stableId);
        return true;
      })
      .sort((left, right) => historyTimestamp(right.record) - historyTimestamp(left.record))
      .map(({ record, status }) => ({
        attemptId: record.attemptId || record.id || "",
        studentId: record.studentId || "",
        studentName: currentNames.get(String(record.studentId || ""))
          || record.studentName
          || "Student",
        assessmentLabel: historyAssessmentLabel(record),
        assessmentDetail: historyAssessmentDetail(record),
        completedAt: record.completedAt || record.updatedAt || record.startedAt || "",
        dateLabel: formatHistoryDate(record),
        status
      }));
  }, [assessmentHistory, rows, selectedClassId]);
  const entry = getAssessmentCatalogEntry(checkId);
  const hasClass = Boolean(
    classRead.complete
    && selectedClassId
    && visibleClassList.some(row => row.id === selectedClassId)
  );
  const hasStudent = Boolean(
    rosterRead.complete
    && selectedStudentId
    && rows.some(row => row.id === selectedStudentId)
  );
  const evidenceSyncStatus = String(studentEvidenceReadState?.syncStatus || "not_recorded");
  const evidenceLoading = hasStudent && evidenceSyncStatus === "loading";
  const studentEvidenceAvailable = hasStudent
    && studentEvidenceReady === true
    && evidenceSyncStatus === "complete";
  // "No classes" is a conclusion, not a starting assumption. On a fresh sign-in
  // the class fetch is still running and no class is selected yet, so the old
  // "empty list plus a selected class" guess left an established teacher reading
  // "Make your class first". The real loading flag settles it.
  const classesLoading = classRead.loading;
  const historyReadComplete = !assessmentHistoryReadState || Boolean(
    assessmentHistoryReadState.complete === true
    && assessmentHistoryReadState.truncated !== true
    && !assessmentHistoryReadState.error
  );
  const historyLoading = Boolean(
    assessmentHistoryReadState
    && !historyReadComplete
    && ["idle", "loading"].includes(assessmentHistoryReadState.status)
  );
  const historyIncomplete = Boolean(
    assessmentHistoryReadState
    && !historyReadComplete
    && !historyLoading
  );

  const elStartPoint = useElBenchmarkStartPoint({
    assessmentHistory: selectedStudentAssessmentHistory,
    studentId: selectedStudentId,
    assessmentId: entry?.starter === ASSESSMENT_STARTERS.EL_BENCHMARK ? entry.benchmarkId : "",
    grade,
    timeOfYear,
    band,
    bandChosenByTeacher
  });

  // The skills check opens on the skill this student is actually working on. That
  // number arrives with the student, so it cannot be read until step 1 is done.
  const effectiveSkillIndex = skillIndex ?? Math.min(
    Math.max(0, Number(firstUnsecuredSkillIndex) || 0),
    SKILL_START_POINTS.length - 1
  );
  const needsBand = entry?.startPoint.kind === ASSESSMENT_START_POINT_KINDS.GRADE_TIME_AND_BAND;
  const effectiveBand = needsBand ? (band || elStartPoint.suggestedBand) : "";
  const selection = entry
    ? {
      ...defaultStartPointSelection(entry, {
        firstUnsecuredSkillIndex: effectiveSkillIndex,
        grade,
        timeOfYear,
        suggestedBand: effectiveBand
      }),
      ...(entry.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL
        ? { skillIndex: effectiveSkillIndex }
        : {}),
      ...(needsBand ? { band: effectiveBand } : {})
    }
    : {};
  const startPointReady = entry ? isStartPointSatisfied(entry, selection) : false;
  const draftBlocksStart = Boolean(elBenchmarkDraft)
    && entry?.starter === ASSESSMENT_STARTERS.EL_BENCHMARK;
  const manualDrafts = [
    letterAssessmentDraft
      ? {
          ...letterAssessmentDraft,
          starter: ASSESSMENT_STARTERS.LETTER_CHECK,
          label: "letter name and sound assessment",
          itemLabel: "letters",
          onResume: onStartLetterCheck
        }
      : null,
    phonicsPatternAssessmentDraft
      ? {
          ...phonicsPatternAssessmentDraft,
          starter: ASSESSMENT_STARTERS.PHONICS_PATTERN_CHECK,
          label: "phonics pattern assessment",
          itemLabel: "patterns",
          onResume: onStartPhonicsPatternCheck
        }
      : null
  ].filter(Boolean);
  const selectedManualDraft = manualDrafts.find(
    draft => draft.starter === entry?.starter
  ) || null;

  // ── THE SUGGESTION ────────────────────────────────────────────────────────
  // Not a new recommendation engine: the skills check already opens on the
  // student's first skill that is not yet secure, and that is the suggestion.
  // The evidence line is the class dashboard's own count for that same skill,
  // shown only when it was read in full and it really is the same skill. When
  // it was not, the block says what the suggestion is based on instead of
  // printing a number nothing proves.
  const suggestedSkill = SKILL_START_POINTS[effectiveSkillIndex] || null;
  const selectedRow = rows.find(row => row.id === selectedStudentId) || null;
  const focusEvidence = selectedRow?.focusEvidence || null;
  const suggestionEvidenceVerified = Boolean(
    dashboardRead.complete
    && selectedRow
    && selectedRow.evidenceReadStatus !== "incomplete"
    && focusEvidence
    && suggestedSkill
    && comparableSkillName(focusEvidence.skill) === comparableSkillName(suggestedSkill.label)
    && Number(focusEvidence.answered) > 0
  );
  const suggestionEvidence = suggestionEvidenceVerified
    ? `${focusEvidence.correct} of ${focusEvidence.answered} answers correct in the last ${EVIDENCE_WINDOW_DAYS} days.`
    : "This is the first skill this student has not secured yet.";
  const suggestedFirstName = String(selectedStudentName || "").trim().split(/\s+/)[0] || "";

  // `assessmentStep` is derived on every render and never stored: step 2 once a
  // student exists, step 3 once an assessment is chosen.
  const assessmentStep = !hasStudent ? 1 : !entry ? 2 : 3;
  const steps = [
    {
      number: 1,
      title: "Choose the student",
      detail: className ? `Scoped to ${className}` : "Scoped to this class"
    },
    { number: 2, title: "Choose the assessment", detail: "Suggested one is first" },
    { number: 3, title: "Run it and save", detail: "Result lands in Reports" }
  ];

  // Keep the URL honest on every answer, so a refresh lands exactly here.
  useEffect(() => {
    writeTeacherFunnelParams({
      view: previousAssessmentsOpen ? "previous" : "",
      check: checkId,
      skill: entry?.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL && skillIndex !== null
        ? String(skillIndex)
        : "",
      grade: entry && entry.startPoint.fields.includes("grade") ? grade : "",
      time: entry && entry.startPoint.fields.includes("timeOfYear") ? timeOfYear : "",
      band: needsBand && bandChosenByTeacher ? band : ""
    });
  }, [
    band,
    bandChosenByTeacher,
    checkId,
    entry,
    grade,
    needsBand,
    previousAssessmentsOpen,
    skillIndex,
    timeOfYear
  ]);

  // Move both focus and the viewport to the panel that just became live.
  // Focusing with `preventScroll` used to leave step 3 below a tall assessment
  // card grid, so a teacher could complete step 2 without ever seeing the
  // starting-point controls or Begin button.
  useEffect(() => {
    if (reachedStepRef.current === assessmentStep) return;
    const previous = reachedStepRef.current;
    reachedStepRef.current = assessmentStep;
    if (!previous) return;
    const heading = [null, null, assessmentHeadingRef, startHeadingRef][assessmentStep];
    const panel = [null, null, assessmentPanelRef, startPanelRef][assessmentStep];
    const frameId = window.requestAnimationFrame(() => {
      heading?.current?.focus({ preventScroll: true });
      (panel?.current || heading?.current)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start"
      });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [assessmentStep]);

  function chooseStudent(nextStudentId) {
    const row = rows.find(item => item.id === nextStudentId);
    // A value that names nobody changes nothing at all. Clearing the answers
    // below without changing the student would leave the select showing one
    // thing and the page scoped to another.
    if (!row) return;
    setCheckId("");
    setSkillIndex(null);
    setBand("");
    setBandChosenByTeacher(false);
    setAwaitingReason(false);
    setAssessmentChoicesOpen(true);
    // No navigation, on purpose. The selected student is shared across the
    // teacher area, and loading them here re-scopes this page in place.
    onSelectStudent?.(row.id, row.name);
  }

  function chooseCheck(nextCheckId) {
    setCheckId(nextCheckId);
    setSkillIndex(null);
    setBand("");
    setBandChosenByTeacher(false);
    setAwaitingReason(false);
    setAssessmentChoicesOpen(false);
  }

  function begin(reasonText = "") {
    if (!entry || !startPointReady || !studentEvidenceAvailable) return;
    setAwaitingReason(false);
    switch (entry.starter) {
      case ASSESSMENT_STARTERS.SKILL_CHECK:
        onStartSkillCheck?.(selection.skillIndex);
        return;
      case ASSESSMENT_STARTERS.LETTER_CHECK:
        onStartLetterCheck?.();
        return;
      case ASSESSMENT_STARTERS.PHONICS_PATTERN_CHECK:
        onStartPhonicsPatternCheck?.();
        return;
      case ASSESSMENT_STARTERS.EL_BENCHMARK:
        onStartBenchmark?.(entry.benchmarkId, elStartPoint.buildStartOptions(reasonText));
        return;
      default:
    }
  }

  function requestBegin() {
    if (entry?.starter === ASSESSMENT_STARTERS.EL_BENCHMARK && elStartPoint.needsRecordedReason) {
      setAwaitingReason(true);
      return;
    }
    begin();
  }

  async function confirmDiscardDraft() {
    if (discardDraftBusy) return;
    setDiscardDraftBusy(true);
    setDiscardDraftError("");
    try {
      const discarded = await onDiscardDraft?.();
      if (discarded === true) {
        setDiscardDraftConfirmOpen(false);
        return;
      }
      setDiscardDraftError(
        "We couldn't clear the unfinished assessment. It is still available, so no work was lost. Try again."
      );
    } catch (error) {
      console.error("Could not clear unfinished EL assessment.", error);
      setDiscardDraftError(
        "We couldn't clear the unfinished assessment. It is still available, so no work was lost. Try again."
      );
    } finally {
      setDiscardDraftBusy(false);
    }
  }

  const checkAnswer = entry && studentEvidenceAvailable
    ? selectedManualDraft
      ? `${entry.label} · ${selectedManualDraft.completedItems} of ${selectedManualDraft.plannedItems} saved`
      : entry.label
    : "";
  const startPointAnswer = entry && startPointReady && studentEvidenceAvailable
    ? describeStartPointSelection(entry, selection)
    : "";
  const orderedCatalog = SUGGESTED_ENTRY
    ? [SUGGESTED_ENTRY, ...CATALOG.filter(row => row.id !== SUGGESTED_ENTRY.id)]
    : CATALOG;
  const assessedStudentCount = new Set(previousAssessments.map(row => (
    row.studentId || row.studentName
  ))).size;
  const visibleHistoryCount = historyPage.classId === selectedClassId
    ? historyPage.count
    : HISTORY_PAGE_SIZE;
  const visiblePreviousAssessments = previousAssessments.slice(0, visibleHistoryCount);
  const historySummary = `${countLabel(previousAssessments.length, "assessment")} for ${countLabel(
    assessedStudentCount,
    "student"
  )}.`;

  return (
    <>
    <main className="teacher-product-page teacher-assess-page" data-teacher-funnel="checks">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Assessments</p>
          <h2>{previousAssessmentsOpen ? "Previous assessments" : "Assess a student"}</h2>
          <p>
            {previousAssessmentsOpen
              ? "See who was assessed, what they completed, and when it was saved."
              : "Three steps, always in the same order. The student stays selected from wherever you came in."}
          </p>
        </div>
        <button
          className="lp-button lp-button-secondary teacher-assess-history-toggle"
          onClick={() => {
            if (!previousAssessmentsOpen) {
              setHistoryPage({ classId: selectedClassId, count: HISTORY_PAGE_SIZE });
            }
            setPreviousAssessmentsOpen(open => !open);
          }}
          type="button"
        >
          {previousAssessmentsOpen ? "Start an assessment" : "Previous assessments"}
        </button>
      </section>

      {classesLoading ? (
        <TeacherSurfaceState surface="assess" state="loading" />
      ) : classRead.failed ? (
        <TeacherSurfaceState
          surface="assess"
          state="partial"
          detail={classRead.truncated
            ? "The full class list reached its safety limit. No missing class is being treated as absent."
            : "The class list could not be confirmed. No class or student has been treated as missing."}
          onPrimaryAction={onRetryClasses}
        />
      ) : visibleClassList.length === 0 ? (
        <TeacherSurfaceState
          surface="assess"
          state="empty"
          detail="Make a class and add your students, then come back to start an assessment."
          onPrimaryAction={onOpenClasses}
        />
      ) : !hasClass ? (
        <div className="teacher-assess-no-class" role="status">
          <p>
            An assessment is saved against one class. Choose the class in the bar at the
            top of this page, then come back to start an assessment.
          </p>
          {onOpenClasses && (
            <button className="lp-button lp-button-secondary" onClick={onOpenClasses} type="button">
              Go to your classes
            </button>
          )}
        </div>
      ) : previousAssessmentsOpen ? (
        <section
          aria-labelledby="teacher-assess-history-title"
          className="teacher-assess-history"
        >
          <header className="teacher-assess-history-head">
            <div>
              <p className="panel-label">{className || "Selected class"}</p>
              <h3 id="teacher-assess-history-title">Assessment record</h3>
              {historyReadComplete && previousAssessments.length > 0 && <p>{historySummary}</p>}
            </div>
          </header>

          {historyLoading ? (
            <div className="teacher-assess-history-state" role="status" aria-busy="true">
              <span className="spinner" aria-hidden="true" />
              <h3>Loading previous assessments</h3>
              <p>Checking every saved assessment for this class.</p>
            </div>
          ) : historyIncomplete ? (
            <div className="teacher-assess-history-state is-warning" role="alert">
              <h3>Previous assessments could not be confirmed</h3>
              <p>
                The complete saved record is not available yet. Missing assessments are not being
                treated as absent.
              </p>
              {onRetryAssessmentHistory && (
                <button
                  className="lp-button lp-button-primary"
                  onClick={onRetryAssessmentHistory}
                  type="button"
                >
                  Try loading again
                </button>
              )}
            </div>
          ) : previousAssessments.length === 0 ? (
            <div className="teacher-assess-history-state" role="status">
              <h3>No previous assessments yet</h3>
              <p>
                Completed or stopped assessments for this class will appear here with the student,
                assessment, date and status.
              </p>
              <button
                className="lp-button lp-button-primary"
                onClick={() => setPreviousAssessmentsOpen(false)}
                type="button"
              >
                Start the first assessment
              </button>
            </div>
          ) : (
            <>
              <TeacherDataTable label={`Previous assessments for ${className || "selected class"}`}>
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Assessment</th>
                    <th scope="col">When</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePreviousAssessments.map((row, index) => (
                    <tr key={row.attemptId || `${row.studentId}-${row.completedAt}-${index}`}>
                      <th scope="row">{row.studentName}</th>
                      <td>
                        <span className="teacher-assess-history-assessment">
                          <strong>{row.assessmentLabel}</strong>
                          {row.assessmentDetail && <small>{row.assessmentDetail}</small>}
                        </span>
                      </td>
                      <td>
                        {row.completedAt ? (
                          <time dateTime={row.completedAt}>{row.dateLabel}</time>
                        ) : row.dateLabel}
                      </td>
                      <td>
                        <span
                          className="teacher-assess-history-status"
                          data-status={row.status.id}
                        >
                          {row.status.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TeacherDataTable>
              {previousAssessments.length > visiblePreviousAssessments.length && (
                <footer className="teacher-assess-history-more">
                  <p>
                    Showing {visiblePreviousAssessments.length} of {previousAssessments.length} assessments
                  </p>
                  <button
                    className="lp-button lp-button-secondary"
                    onClick={() => setHistoryPage(current => ({
                      classId: selectedClassId,
                      count: (
                        current.classId === selectedClassId
                          ? current.count
                          : HISTORY_PAGE_SIZE
                      ) + HISTORY_PAGE_SIZE
                    }))}
                    type="button"
                  >
                    Show more
                  </button>
                </footer>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          <ol className="teacher-assess-steps" aria-label="How an assessment is started">
            {steps.map(step => {
              const state = step.number < assessmentStep
                ? "done"
                : step.number === assessmentStep ? "active" : "waiting";
              return (
                <li
                  aria-current={state === "active" ? "step" : undefined}
                  className="teacher-assess-step"
                  data-assess-step={step.number}
                  data-state={state}
                  data-waiting-far={state === "waiting" && step.number > assessmentStep + 1
                    ? "true"
                    : undefined}
                  key={step.number}
                >
                  <span aria-hidden="true" className="teacher-assess-step-dot">{step.number}</span>
                  <span className="teacher-assess-step-text">
                    <span className="teacher-assess-step-title">{step.title}</span>
                    <span className="teacher-assess-step-detail">{step.detail}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="teacher-assess-panels">
            <section className="teacher-assess-panel teacher-assess-panel-student">
              <h3 className="teacher-assess-panel-head">1 · Student</h3>
              <div className="teacher-assess-panel-body">
                {rosterRead.loading ? (
                  <p className="teacher-assess-note">Getting the class list…</p>
                ) : rosterRead.incomplete ? (
                  <div className="teacher-assess-recovery" role="alert">
                    <p>
                      {rosterRead.truncated
                        ? "The full student list reached its safety limit. No student is being treated as absent."
                        : "The student list could not be confirmed. No empty-class conclusion is being shown."}
                    </p>
                    {onRetryStudents && (
                      <button
                        className="lp-button lp-button-secondary"
                        onClick={() => onRetryStudents(selectedClassId)}
                        type="button"
                      >
                        Try loading students again
                      </button>
                    )}
                  </div>
                ) : rows.length === 0 ? (
                  <p className="teacher-assess-note">
                    No students in this class yet. Add them under Students, then come back.
                  </p>
                ) : (
                  <>
                    <label className="teacher-assess-field">
                      <span>{className ? `Student in ${className}` : "Student in this class"}</span>
                      <select
                        onChange={event => chooseStudent(event.target.value)}
                        value={hasStudent ? selectedStudentId : ""}
                      >
                        {/* Once a student is chosen they stay chosen; the
                            placeholder stops being an answer so the select can
                            never show one thing while the page is scoped to
                            another. */}
                        <option disabled={hasStudent} value="">Choose a student</option>
                        {rows.map(row => (
                          <option key={row.id} value={row.id}>{row.name}</option>
                        ))}
                      </select>
                    </label>
                    <p className="teacher-assess-note">
                      Changing student here does not leave the page.
                      {className ? ` You stay in ${className}.` : ""}
                    </p>
                    {studentEvidenceAvailable && SUGGESTED_ENTRY && suggestedSkill && (
                      <div className="teacher-assess-suggestion">
                        <p className="teacher-assess-suggestion-label">
                          {suggestedFirstName
                            ? `Suggested for ${suggestedFirstName}`
                            : "Suggested next"}
                        </p>
                        <p className="teacher-assess-suggestion-title">
                          {suggestedSkill.label} — {SUGGESTED_ENTRY.label}
                        </p>
                        <p className="teacher-assess-suggestion-evidence">{suggestionEvidence}</p>
                      </div>
                    )}
                  </>
                )}
                {rosterRead.complete && dashboardRead.failed && (
                  <div className="teacher-assess-recovery" role="alert">
                    <p>
                      Class progress summaries could not be confirmed. Student names are current,
                      but no earlier class figure is being reused.
                    </p>
                    {onRetryClassDashboard && (
                      <button
                        className="lp-button lp-button-secondary"
                        onClick={() => onRetryClassDashboard(selectedClassId)}
                        type="button"
                      >
                        Try loading class progress again
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section
              className="teacher-assess-panel teacher-assess-panel-checks"
              ref={assessmentPanelRef}
            >
              <h3
                className="teacher-assess-panel-head"
                ref={assessmentHeadingRef}
                tabIndex={-1}
              >
                2 · Assessment
              </h3>
              <div className="teacher-assess-panel-body">
                {!hasStudent ? (
                  <p className="teacher-assess-note">Choose a student first.</p>
                ) : !studentEvidenceAvailable ? (
                  <div
                    aria-busy={evidenceLoading ? "true" : "false"}
                    className="teacher-funnel-evidence-state teacher-assess-recovery"
                    role={evidenceLoading ? "status" : "alert"}
                  >
                    <p>
                      {evidenceLoading
                        ? `Getting ${selectedStudentName || "this student"}’s saved results…`
                        : `We couldn't load all of ${selectedStudentName || "this student"}’s saved results. Nothing is being counted as zero. Try again before starting an assessment.`}
                    </p>
                    {!evidenceLoading && (
                      <button
                        className="lp-button lp-button-secondary"
                        onClick={onRetryStudentEvidence}
                        type="button"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {elBenchmarkDraft && (
                      <div className="teacher-assess-draft" role="status">
                        <div>
                          <strong>{selectedStudentName} has an unfinished assessment saved on this device.</strong>
                          <small>Finish or clear it before starting one of the four spoken-sound, spelling, word reading or reading fluency assessments.</small>
                        </div>
                        <div className="teacher-action-list">
                          <button className="lp-button lp-button-primary" onClick={onResumeDraft} type="button">
                            Carry on with it
                          </button>
                          <button
                            className="lp-button lp-button-secondary"
                            onClick={() => {
                              setDiscardDraftError("");
                              setDiscardDraftConfirmOpen(true);
                            }}
                            type="button"
                          >
                            Clear saved draft…
                          </button>
                        </div>
                      </div>
                    )}
                    {manualDrafts.map(draft => (
                      <div className="teacher-assess-draft" key={draft.starter} role="status">
                        <div>
                          <strong>
                            {selectedStudentName} has an unfinished {draft.label}.
                          </strong>
                          <small>
                            {draft.completedItems} of {draft.plannedItems} {draft.itemLabel} saved.
                            {" "}
                            Carrying on uses the same assessment record.
                          </small>
                        </div>
                        <div className="teacher-action-list">
                          <button
                            className="lp-button lp-button-primary"
                            onClick={draft.onResume}
                            type="button"
                          >
                            Resume {draft.label}
                          </button>
                        </div>
                      </div>
                    ))}
                    {entry && !assessmentChoicesOpen ? (
                      <div className="teacher-assess-selection-summary" role="status">
                        <div>
                          <span className="teacher-assess-card-kind">Selected assessment</span>
                          <strong>{entry.label}</strong>
                          <p>{entry.description}</p>
                          <small>{assessmentMeta(entry)}</small>
                        </div>
                        <button
                          className="lp-button lp-button-secondary"
                          onClick={() => setAssessmentChoicesOpen(true)}
                          type="button"
                        >
                          Change assessment
                        </button>
                      </div>
                    ) : (
                      <ul className="teacher-assess-cards" aria-label="Assessments you can start">
                        {orderedCatalog.map(row => {
                          const suggested = row.id === SUGGESTED_ENTRY?.id;
                          const kind = assessmentKind(row, suggested);
                          return (
                            <li key={row.id}>
                              <article
                                className="teacher-assess-card"
                                data-chosen={row.id === checkId ? "true" : undefined}
                                data-kind={kind}
                              >
                                <span className="teacher-assess-card-kind">
                                  {ASSESSMENT_KIND_LABELS[kind]}
                                </span>
                                <h4>{row.label}</h4>
                                <p>{row.description}</p>
                                <div className="teacher-assess-card-foot">
                                  <small>{assessmentMeta(row)}</small>
                                  <button
                                    aria-label={`Start ${row.label}`}
                                    aria-pressed={row.id === checkId}
                                    className="lp-button lp-button-secondary teacher-assess-card-start"
                                    onClick={() => chooseCheck(row.id)}
                                    type="button"
                                  >
                                    Start
                                  </button>
                                </div>
                              </article>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </div>
              <p className="teacher-assess-panel-foot">
                Answer accuracy and learning status are saved separately. A high percentage
                alone does not prove that learning is secure.
              </p>
            </section>
          </div>

          {entry && studentEvidenceAvailable && (
            <section
              className="teacher-assess-panel teacher-assess-panel-start"
              ref={startPanelRef}
            >
              <h3
                className="teacher-assess-panel-head"
                ref={startHeadingRef}
                tabIndex={-1}
              >
                3 · {entry.startPoint.label}
              </h3>
              <div className="teacher-assess-panel-body">
                <p className="teacher-assess-chosen">{checkAnswer}</p>
                <p className="teacher-assess-note">{entry.administration}</p>
                {entry.startPoint.help && (
                  <p className="teacher-assess-note">{entry.startPoint.help}</p>
                )}

                {entry.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL && (
                  <label className="teacher-assess-field">
                    <span>Skill this assessment starts on</span>
                    <select
                      onChange={event => setSkillIndex(Number(event.target.value))}
                      value={String(effectiveSkillIndex)}
                    >
                      {SKILL_START_POINTS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {entry.startPoint.fields.includes("grade") && (
                  <div className="teacher-assess-field-row">
                    <label className="teacher-assess-field">
                      <span>Grade</span>
                      <select onChange={event => setGrade(event.target.value)} value={grade}>
                        {ASSESSMENT_GRADE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="teacher-assess-field">
                      <span>Time of year</span>
                      <select onChange={event => setTimeOfYear(event.target.value)} value={timeOfYear}>
                        {ASSESSMENT_TIME_OF_YEAR_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    {needsBand && (
                      <label className="teacher-assess-field">
                        <span>Word group it starts on</span>
                        <select
                          onChange={event => {
                            setBand(event.target.value);
                            setBandChosenByTeacher(true);
                          }}
                          value={effectiveBand}
                        >
                          {elStartPoint.bandOptions.map(option => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                          ))}
                        </select>
                        <small>{elStartPoint.bandNote}</small>
                      </label>
                    )}
                  </div>
                )}

                {entry.starter === ASSESSMENT_STARTERS.EL_BENCHMARK && (
                  <p className="teacher-assess-note">
                    The completed result is saved to this student&apos;s standalone EL report.
                  </p>
                )}

                {awaitingReason ? (
                  <ElPrerequisiteReview
                    message={elStartPoint.prerequisite.message}
                    onCancel={() => setAwaitingReason(false)}
                    onConfirm={begin}
                    startLabel={`Begin ${entry.label}`}
                  />
                ) : (
                  <div className="teacher-assess-begin">
                    {startPointAnswer && (
                      <p className="teacher-assess-chosen">
                        {entry.startPoint.kind === ASSESSMENT_START_POINT_KINDS.NONE
                          ? startPointAnswer
                          : `Starting at: ${startPointAnswer}`}
                      </p>
                    )}
                    {draftBlocksStart && (
                      <p className="teacher-assess-blocked">
                        Finish or clear the saved unfinished assessment in step 2 first.
                      </p>
                    )}
                    {elStartPoint.needsRecordedReason && !draftBlocksStart && (
                      <p className="teacher-assess-blocked">
                        This start is not the one this student&apos;s saved results point at, so you will be
                        asked to say why.
                      </p>
                    )}
                    <button
                      className="lp-button lp-button-primary"
                      disabled={!studentEvidenceAvailable || !startPointReady || draftBlocksStart}
                      onClick={requestBegin}
                      type="button"
                    >
                      {selectedManualDraft ? "Resume" : "Begin"} {entry.label}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          <p className="el-assessment-validity-note">
            The four spoken-sound, spelling, word reading and reading fluency assessments are original
            Literacy Guide assessments written against the supplied EL Skills Block overview. They are
            not official EL Education forms, nationally normed scores, or diagnostic tests for a
            disability.
          </p>
        </>
      )}
    </main>
    <ConfirmActionDialog
      body={`This removes the unfinished assessment saved on this device for ${selectedStudentName || "this student"}. Completed assessments and reports are not changed. You cannot recover this draft.`}
      busy={discardDraftBusy}
      confirmLabel="Clear unfinished assessment"
      error={discardDraftError}
      onCancel={() => {
        setDiscardDraftConfirmOpen(false);
        setDiscardDraftError("");
      }}
      onConfirm={confirmDiscardDraft}
      open={discardDraftConfirmOpen}
      title="Clear this unfinished assessment?"
    />
    </>
  );
}
