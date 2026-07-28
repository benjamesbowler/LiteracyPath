import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { SymbolPasswordPad, SymbolSequence } from "./SymbolPasswordPad.jsx";
import {
  assignUniqueSymbolSequences,
  symbolIconByDigit
} from "../data/symbolPasswordIcons.js";
import { printPracticePack, packStopIndex, packTargetLabel } from "../utils/worksheets/practicePack.js";
import {
  PROGRESS_MIN_RESPONSES,
  buildClassAccuracySummary
} from "../utils/teacherProgressOverview.js";
import { TEACHER_TODAY_POLICY } from "../utils/teacherTodayBriefing.js";
import { LEARNING_EVIDENCE_POLICY } from "../policy/learningPolicy.js";
import {
  deleteRosterStudent,
  describeRosterOperationError,
  findDuplicateRosterName,
  insertRosterStudents,
  normalizeRosterStudentName,
  reviewRosterImportNames,
  setRosterStudentArchived,
  transferRosterStudent
} from "../data/teacherRosterOperations.js";
import { TeacherActivitySyncHealth } from "./teacher/TeacherActivitySyncHealth.jsx";
import { LearnerDataRightsDialog } from "./teacher/LearnerDataRightsDialog.jsx";
import { TeacherRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { ActionFeedback } from "./ActionFeedback.jsx";
import { MetricDefinition, MetricFigure } from "./MetricDefinition.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import {
  TeacherDataTable,
  TeacherFilterBar,
  TeacherPageHeader,
  TeacherPageShell
} from "./teacher/ui/TeacherPrimitives.jsx";
import {
  TeacherDrawer,
  TeacherModal
} from "./teacher/ui/TeacherDialog.jsx";
import {
  LearnerAccessibilityDialog,
  QuestionTypeGuideDialog,
  RosterMetric,
  StudentInitial,
  TeacherSetupChecklist
} from "./teacher/TeacherClassParts.jsx";
import { getTeacherPaginationWindow } from "./teacher/teacherPagination.js";
import { getTeacherArchivedRosterView } from "./teacher/teacherArchivedRoster.js";
import {
  accuracyConclusion,
  activityIsAtLeastDaysOld,
  formatLastActive,
  getProgressPercent,
  latestMetricUpdate,
  needsSupportConclusion,
  useTeacherSetupState,
  useTeacherStudentRows
} from "./teacher/teacherClassModel.js";
import { supabase } from "../supabaseClient.js";
import { clearLocalElAssessmentDataForStudent } from "../utils/elAssessmentReset.js";
import { clearAndVerifyLocalProgressForStudent } from "../utils/progressSync.js";
import {
  TEACHER_COPY,
  countPhrase,
  progressPhrase
} from "../copy/teacherCopy.js";
import { getStudentRosterReadView } from "../appState/studentRosterReadState.js";
import { getClassListReadView } from "../appState/classListReadState.js";
import { getClassDashboardReadView } from "../appState/classDashboardReadState.js";
import logoUrl from "../assets/logo.svg";

const ROSTER_COLUMN_OPTIONS = [
  { id: "focus", label: "Current focus" },
  { id: "progress", label: "Progress" },
  { id: "sound-seekers", label: "Sound Seekers" },
  { id: "login", label: "Sign-in" },
  { id: "last-active", label: "Last active" }
];
// "login" (the Sign-in column) is back in the defaults: it carries the only
// per-student control that lets a class sign in at all, so hiding it behind the
// column picker made a brand-new class unusable.
// The default roster answers the four questions teachers use during a lesson:
// who, current focus, can they sign in, and when were they last active.
// Detailed progress stays in the student panel instead of widening every row.
const DEFAULT_ROSTER_COLUMNS = ["focus", "login", "last-active"];
const ROSTER_PAGE_SIZE = 10;

function loadVisibleRosterColumns(teacherId) {
  if (!teacherId || typeof localStorage === "undefined") return DEFAULT_ROSTER_COLUMNS;
  try {
    const saved = JSON.parse(localStorage.getItem(`teacherRosterColumns:${teacherId}`) || "null");
    return Array.isArray(saved)
      ? saved.filter(column => ROSTER_COLUMN_OPTIONS.some(option => option.id === column))
      : DEFAULT_ROSTER_COLUMNS;
  } catch {
    return DEFAULT_ROSTER_COLUMNS;
  }
}

// A class average can be held back for four different reasons, and the teacher
// used to be told the first one whichever one actually applied — a class of 30
// where one child has answered forty times as often as everyone else was told to
// wait for 2 students. Each branch reads the same numbers the fairness rule used,
// so the sentence and the suppression always agree. The exact rule stays in the ⓘ.
function classAverageHeldBackNote(comparability = {}) {
  const rule = LEARNING_EVIDENCE_POLICY.comparison;
  const ready = Number(comparability.policyReadyLearners) || 0;
  const total = Number(comparability.totalLearners) || 0;
  const imbalance = comparability.responseImbalanceRatio;

  if (ready < rule.minimumPolicyReadyLearners) {
    return TEACHER_COPY.metrics.fairAverage(rule.minimumPolicyReadyLearners);
  }
  if ((Number(comparability.readyProportion) || 0) < rule.minimumPolicyReadyProportion) {
    return `Only ${countPhrase(ready, "student", "students")} of ${total} have done enough assessments so far. A class average appears once most of the class has enough saved answers.`;
  }
  if (imbalance !== null && imbalance !== undefined && imbalance > rule.maximumResponseImbalanceRatio) {
    return "One student has answered far more often than the others, so a class average would mostly describe that student. It appears once the class has answered more evenly.";
  }
  return "We are still missing the number of answers for at least one student, so a class average would not be fair yet. It appears once every student's answers have saved.";
}

function formatLoginCardPassword(sequence) {
  if (!sequence) return "Not set yet";
  return sequence
    .split("")
    .map(digit => symbolIconByDigit[digit]?.label || `Picture ${digit}`)
    .join(" - ");
}

function parseCsvNames(text = "") {
  const rows = [];
  let cell = "";
  let row = [];
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");
  for (let index = 0; index <= source.length; index += 1) {
    const character = source[index] ?? "\n";
    if (character === "\"") {
      if (quoted && source[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  const names = rows.map(columns => columns[0]).filter(Boolean);
  if (/^(name|display name|learner|student)$/i.test(names[0] || "")) names.shift();
  return names;
}

const LOGIN_CARD_ROUTE_VIEW = "sign-in-cards";

function readLoginCardRouteStudentIds(hash = "") {
  const [path, query = ""] = String(hash || "").replace(/^#/, "").split("?");
  if (path !== "teacher/children") return [];
  const params = new URLSearchParams(query);
  if (params.get("view") !== LOGIN_CARD_ROUTE_VIEW) return [];
  return [...new Set(
    String(params.get("cards") || "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean)
  )];
}

function pushLoginCardRoute(rows = []) {
  if (typeof window === "undefined") return;
  const ids = rows.map(row => row?.id).filter(Boolean);
  if (!ids.length) return;
  const [path, query = ""] = String(window.location.hash || "")
    .replace(/^#/, "")
    .split("?");
  if (path !== "teacher/children") return;
  const params = new URLSearchParams(query);
  params.set("view", LOGIN_CARD_ROUTE_VIEW);
  params.set("cards", ids.join(","));
  const nextHash = `#${path}?${params.toString()}`;
  if (window.location.hash === nextHash) return;
  const previewAlreadyOpen = new URLSearchParams(query).get("view") === LOGIN_CARD_ROUTE_VIEW;
  if (previewAlreadyOpen) {
    window.history.replaceState(
      { ...window.history.state, literacyPathLoginCardPreview: true },
      "",
      nextHash
    );
    return;
  }
  window.history.pushState(
    { ...window.history.state, literacyPathLoginCardPreview: true },
    "",
    nextHash
  );
}

function clearLoginCardRoute() {
  if (typeof window === "undefined") return;
  if (window.history.state?.literacyPathLoginCardPreview) {
    window.history.back();
    return;
  }
  const [path, query = ""] = String(window.location.hash || "")
    .replace(/^#/, "")
    .split("?");
  if (path !== "teacher/children") return;
  const params = new URLSearchParams(query);
  params.delete("view");
  params.delete("cards");
  const nextHash = `#${path}${params.size ? `?${params.toString()}` : ""}`;
  window.history.replaceState(window.history.state, "", nextHash);
}

function LoginCardPrintRoute({
  rows,
  failedAssignments = [],
  retryingFailures = false,
  retryFailureMessage = "",
  schoolName,
  className,
  classCode,
  onClose,
  onRetryFailures
}) {
  const [printFeedback, setPrintFeedback] = useState({
    kind: "success",
    message: `Print preview ready with ${countPhrase(rows.length, "sign-in card")}.`
  });
  const pages = Array.from(
    { length: Math.ceil(rows.length / 4) },
    (_unused, pageIndex) => rows.slice(pageIndex * 4, pageIndex * 4 + 4)
  );

  function printCards() {
    setPrintFeedback({ kind: "pending", message: "Opening the print dialog..." });
    window.requestAnimationFrame(() => {
      try {
        window.print();
        setPrintFeedback({
          kind: "success",
          message: "Print dialog opened. Choose a printer or save as PDF."
        });
      } catch {
        setPrintFeedback({
          kind: "error",
          message: "The print dialog could not be opened. Try again."
        });
      }
    });
  }

  return (
    <main
      className="teacher-login-card-route"
      data-teacher-route="login-cards"
      aria-labelledby="teacher-login-card-route-title"
    >
      <header className="teacher-login-card-route-toolbar">
        <div>
          <p className="panel-label">Print preview</p>
          <h2 id="teacher-login-card-route-title">Sign-in cards</h2>
          <p>
            {schoolName || "School"} · {className || "Class"} · {rows.length} card{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <nav className="teacher-login-card-route-actions" aria-label="Sign-in card navigation">
          <button className="lp-button lp-button-secondary" type="button" onClick={onClose}>
            ← Back to Students
          </button>
          <button className="lp-button lp-button-primary" type="button" onClick={printCards}>
            Print cards
          </button>
        </nav>
      </header>
      <ActionFeedback className="teacher-login-card-feedback" feedback={printFeedback} />
      {failedAssignments.length > 0 && (
        <section className="teacher-login-card-partial" role="alert">
          <strong>
            {countPhrase(failedAssignments.length, "student")} still need sign-in pictures
          </strong>
          <p>
            No card was made for:{" "}
            {failedAssignments.map(item => item.student?.name || "Unnamed student").join(", ")}.
            The cards below are safe to use.
          </p>
          {retryFailureMessage && <p>{retryFailureMessage}</p>}
          <button
            className="lp-button lp-button-primary"
            type="button"
            disabled={retryingFailures}
            onClick={onRetryFailures}
          >
            {retryingFailures ? "Trying again…" : "Try saving missing pictures again"}
          </button>
        </section>
      )}
      <div className="teacher-login-card-pages" aria-label="Page-sized sign-in card preview">
        {pages.map((pageRows, pageIndex) => (
          <section
            className="teacher-login-card-page"
            aria-label={`Sign-in cards page ${pageIndex + 1} of ${pages.length}`}
            key={`page-${pageRows[0]?.id || pageIndex}`}
          >
            <header className="teacher-login-card-page-header">
              <img src={logoUrl} alt="" />
              <div>
                <p>{schoolName || "School"}</p>
                <h3>{className || "Class"} sign-in cards</h3>
                <span>Class code {classCode || "—"}</span>
              </div>
              <small>Page {pageIndex + 1} of {pages.length}</small>
            </header>
            <div className="teacher-login-card-sheet">
              {pageRows.map(row => (
                <article
                  className="teacher-print-login-card"
                  aria-label={`${row.name} sign-in card`}
                  key={row.id}
                >
                  <img src={logoUrl} alt="" />
                  <p>{schoolName || "School"}</p>
                  <h4>{row.name}</h4>
                  <span>{className || "Class"} · Code {classCode || "—"}</span>
                  <SymbolSequence sequence={row.symbol_password || ""} size={34} />
                  <small>{formatLoginCardPassword(row.symbol_password)}</small>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

// THE SOUND HEAT MAP + PRACTICE-ASSIGN.
//
// One tile per grapheme, in the order the trail teaches them, coloured by the
// honest buckets (got it / almost there / needs re-teaching / not met yet) —
// and tappable: pick up to six sounds, press Assign, and that student's Free
// Roam serves exactly those sounds next session (questReviewMode reads the
// assignment out of the phonics_quest payload). This pair of features is the
// mode's whole commercial argument made visible: evidence in, action out.
//
// A tile's colour used to be the only thing that carried its status, with the
// explanation in a `title` a tablet can never show. The status now rides in the
// tile's accessible name, and the explanation lives in the ⓘ beside the
// heading, which opens on tap.
const SOUND_STATUS_WORDS = Object.freeze({
  "got-it": "got it",
  almost: "almost there",
  reteach: "needs re-teaching",
  unseen: "not met yet"
});

function QuestHeatPanel({ report, studentName, onAssign, onClear }) {
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [packNote, setPackNote] = useState("");
  const [assignmentFeedback, setAssignmentFeedback] = useState(null);
  const tiles = report?.heat || [];
  const assignment = report?.assignment || null;

  function toggle(id) {
    setSelected(current => current.includes(id)
      ? current.filter(t => t !== id)
      : current.length >= 6 ? current : [...current, id]);
  }

  async function assign() {
    if (!selected.length || busy) return;
    setBusy(true);
    setAssignmentFeedback({ kind: "pending", message: "Saving this practice assignment…" });
    try {
      const saved = await onAssign?.(selected);
      if (saved !== true) {
        setAssignmentFeedback({
          kind: "error",
          message: "We couldn't save this practice assignment. Nothing changed. Try again."
        });
        return;
      }
      setSelected([]);
      setAssignmentFeedback({
        kind: "success",
        message: `Practice assigned to ${studentName}.`
      });
    } catch (error) {
      console.error("Could not save the student's practice assignment.", error);
      setAssignmentFeedback({
        kind: "error",
        message: "We couldn't save this practice assignment. Nothing changed. Try again."
      });
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (busy) return;
    setBusy(true);
    setAssignmentFeedback({ kind: "pending", message: "Clearing this practice assignment…" });
    try {
      const cleared = await onClear?.();
      if (cleared !== true) {
        setAssignmentFeedback({
          kind: "error",
          message: "We couldn't clear this practice assignment. The saved assignment is unchanged."
        });
        return;
      }
      setAssignmentFeedback({
        kind: "success",
        message: `Practice assignment cleared for ${studentName}.`
      });
    } catch (error) {
      console.error("Could not clear the student's practice assignment.", error);
      setAssignmentFeedback({
        kind: "error",
        message: "We couldn't clear this practice assignment. The saved assignment is unchanged."
      });
    } finally {
      setBusy(false);
    }
  }

  // Print the home practice pack straight from this student's evidence: the
  // sounds the teacher tapped, or the weakest five when nothing is tapped,
  // with every word decodable at the furthest stop the student has reached.
  function printPack() {
    const targets = selected.length ? selected : (report?.weakest || []).map(row => row.target);
    const stop = packStopIndex(report);
    if (!targets.length || !stop) {
      setPackNote("Nothing needs extra practice right now — tap sounds to build a custom pack.");
      return;
    }
    try {
      const result = printPracticePack({ name: studentName, targets, stopIndex: stop });
      if (!result) {
        setPackNote("Please allow pop-ups for this site so the pack can open.");
        return;
      }
      setPackNote(result.skipped.length
        ? `Skipped (too few decodable words yet): ${result.skipped.map(packTargetLabel).join(", ")}`
        : "");
    } catch (error) {
      console.error("Could not build the student's practice pack.", error);
      setPackNote("We couldn't build this practice pack. Nothing was printed. Try again.");
    }
  }

  if (!tiles.length) return <p className="muted-text">No sound map yet — the trail builds one from the first session.</p>;

  const counts = report?.buckets || {};
  return (
    <div className="quest-heat-panel">
      <div className="quest-heat-head">
        <strong>{studentName}&rsquo;s sounds</strong>
        <MetricDefinition
          metricId="accuracy"
          label="Sound status"
          counts="Each tile is one sound, with its status: got it, almost there, needs re-teaching, or not met yet. Status comes from correct answers out of scored answers for that sound."
          timeWindow="All saved Sound Seekers play for this student."
          excludes="Sounds this student has not met yet — those show as not met, not as a low score."
        />
        <span className="quest-heat-legend" aria-hidden="true">
          <em className="is-got-it">Got it {counts.gotIt ?? 0}</em>
          <em className="is-almost">Almost there {counts.almostThere ?? 0}</em>
          <em className="is-reteach">Needs re-teaching {counts.needsReteaching ?? 0}</em>
          <em className="is-unseen">Not met yet</em>
        </span>
      </div>
      <div className="quest-heat-grid" role="group" aria-label={`Sound learning status for ${studentName}. Tap sounds to build a practice assignment.`}>
        {tiles.map(tile => (
          <button
            key={tile.id}
            type="button"
            className={`quest-heat-tile is-${tile.bucket}${selected.includes(tile.id) ? " is-selected" : ""}`}
            aria-label={tile.bucket === "unseen"
              ? `${tile.label} — not met yet`
              : `${tile.label} — ${SOUND_STATUS_WORDS[tile.bucket] || "not met yet"}, ${countPhrase(tile.seen, "answer")}`}
            aria-pressed={selected.includes(tile.id)}
            onClick={() => toggle(tile.id)}
          >
            {tile.label}
          </button>
        ))}
      </div>
      <div className="quest-heat-actions">
        {assignment ? (
          <span className="quest-heat-assigned">
            Assigned: <strong>{assignment.targets.join(", ")}</strong>
            <button className="text-button" type="button" disabled={busy} onClick={clear}>Clear</button>
          </span>
        ) : <span className="muted-text">Tap sounds, then assign them as this student&rsquo;s next practice.</span>}
        <button
          className="lp-button lp-button-secondary"
          type="button"
          disabled={!selected.length || busy}
          onClick={assign}
        >
          {busy ? "Saving..." : selected.length ? `Assign ${selected.length} sound${selected.length === 1 ? "" : "s"}` : "Assign practice"}
        </button>
        <button className="lp-button lp-button-secondary" type="button" onClick={printPack}>
          {selected.length ? `Print pack (${selected.length} sound${selected.length === 1 ? "" : "s"})` : "Print practice pack"}
        </button>
      </div>
      <ActionFeedback className="quest-heat-feedback" feedback={assignmentFeedback} />
      {packNote && <p className="muted-text quest-heat-note" role="status">{packNote}</p>}
    </div>
  );
}

// STUDENTS. One question: is this class set up and up to date?
//
// The roster, its modals, import, sign-in cards and archiving all live here.
// Deciding what to teach next lives on Today. This page also carries the single
// Student panel: everything you can do to one student opens from the drawer.
export function TeacherStudentsPage({
  classList = [],
  classListReadState = null,
  loadingClasses = false,
  loadClasses,
  selectedClassId,
  setSelectedClassId,
  setStudentList,
  setArchivedStudentList,
  studentList = [],
  studentListReadState = null,
  archivedStudentList = [],
  loadingStudents = false,
  loadStudents,
  assignQuestPractice,
  clearQuestPractice,
  setReducedChoiceMode,
  setAccessibilitySettings,
  onLoadStudent,
  selectedStudentId,
  onClearStudent,
  selectedGroupId = "all",
  onSelectGroup,
  onStartCheck,
  onOpenReport,
  onOpenGuidedReading,
  onOpenStoryQuests,
  onOpenElFormalCheck,
  onResetCheckData,
  createClass,
  createDemoClass,
  newClassName,
  setNewClassName,
  createStudent,
  teacherId,
  classDashboard = [],
  classDashboardReadState = null,
  loadClassDashboard,
  skillTree = [],
  updateStudentName,
  updateStudentSymbolPassword,
  assignMissingSymbolPasswords,
  resetStudentSymbolPassword,
  startStudentLogin,
  schoolName = "",
  hasSchool = false,
  message,
  setupFocus = "",
  onSetupFocusHandled,
  activitySyncHealthSeedRows = null
}) {
  const [newStudentName, setNewStudentName] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [showRosterImport, setShowRosterImport] = useState(false);
  const [rosterImportText, setRosterImportText] = useState("");
  const [rosterImportPreview, setRosterImportPreview] = useState(null);
  const [importingRoster, setImportingRoster] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterSort, setRosterSort] = useState("name");
  const [rosterStatusFilter, setRosterStatusFilter] = useState("all");
  const [visibleRosterColumns, setVisibleRosterColumns] = useState(
    () => loadVisibleRosterColumns(teacherId)
  );
  const [selectedRosterIds, setSelectedRosterIds] = useState([]);
  const [loginCardRows, setLoginCardRows] = useState([]);
  const [loginCardFailures, setLoginCardFailures] = useState([]);
  const [loginCardRetryError, setLoginCardRetryError] = useState("");
  const [assigningSignIn, setAssigningSignIn] = useState(false);
  const [rosterOperation, setRosterOperation] = useState(null);
  const [operationTargetClassId, setOperationTargetClassId] = useState("");
  const [operationBusy, setOperationBusy] = useState(false);
  // The confirm dialog covers the page banner, so a failure has to be readable
  // inside the dialog itself. This is the state that used to not exist at all:
  // a rejected promise left the dialog open and said nothing.
  const [operationError, setOperationError] = useState("");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [duplicateClassConfirm, setDuplicateClassConfirm] = useState("");
  const [duplicateNameConfirm, setDuplicateNameConfirm] = useState("");
  const [rosterOperationStatus, setRosterOperationStatus] = useState("");
  const [restoringStudentIds, setRestoringStudentIds] = useState([]);
  const [rosterFilterIds, setRosterFilterIds] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [actionsStudent, setActionsStudent] = useState(null);
  const [studentActionError, setStudentActionError] = useState("");
  const [editingStudentProfile, setEditingStudentProfile] = useState(null);
  const [studentNameDraft, setStudentNameDraft] = useState("");
  const [studentProfileError, setStudentProfileError] = useState("");
  const [savingStudentProfile, setSavingStudentProfile] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingSequence, setEditingSequence] = useState("");
  const [signInPictureError, setSignInPictureError] = useState("");
  const [savingSignInPictures, setSavingSignInPictures] = useState(false);
  const [heatOpenId, setHeatOpenId] = useState(null);
  const [showQuestionGuide, setShowQuestionGuide] = useState(false);
  const [questionGuideSearch, setQuestionGuideSearch] = useState("");
  const [classToolsOpen, setClassToolsOpen] = useState(false);
  const [rosterAdminOpen, setRosterAdminOpen] = useState(false);
  const [rosterPage, setRosterPage] = useState(1);
  const [archivedRosterSearch, setArchivedRosterSearch] = useState("");
  const [archivedRosterPage, setArchivedRosterPage] = useState(1);
  const [savingChoiceModeIds, setSavingChoiceModeIds] = useState([]);
  const [savingAccessibilityIds, setSavingAccessibilityIds] = useState([]);
  const [accessibilityStudent, setAccessibilityStudent] = useState(null);
  const [dataRightsStudent, setDataRightsStudent] = useState(null);
  const loadStudentsRef = useRef(loadStudents);
  const loadClassDashboardRef = useRef(loadClassDashboard);
  const loadClassesRef = useRef(loadClasses);
  const selectedClassIdRef = useRef(selectedClassId);
  selectedClassIdRef.current = selectedClassId;
  const newClassInputRef = useRef(null);
  const newStudentInputRef = useRef(null);
  function focusNewClassInput() {
    setClassToolsOpen(true);
    window.requestAnimationFrame(() => {
      newClassInputRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      newClassInputRef.current?.focus?.();
    });
  }
  function focusNewStudentInput() {
    setRosterAdminOpen(true);
    window.requestAnimationFrame(() => {
      newStudentInputRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      newStudentInputRef.current?.focus?.();
    });
  }
  function openStudentProfile(student) {
    setActionsStudent(null);
    setEditingStudentProfile(student);
    setStudentNameDraft(student?.name || "");
    setStudentProfileError("");
  }
  function openSignInPictureEditor(student) {
    setEditingStudent(student);
    setEditingSequence("");
    setSignInPictureError("");
  }
  function closeSignInPictureEditor() {
    if (savingSignInPictures) return;
    setEditingStudent(null);
    setEditingSequence("");
    setSignInPictureError("");
  }
  async function saveSignInPictures(sequence) {
    if (!editingStudent || savingSignInPictures) return;
    setSavingSignInPictures(true);
    setSignInPictureError("");
    try {
      const saved = await updateStudentSymbolPassword?.(
        editingStudent.id,
        sequence,
        editingStudent.name
      );
      if (saved !== true) {
        setSignInPictureError(
          "We couldn't save those sign-in pictures. Nothing changed. Try again or cancel."
        );
        return;
      }
      setEditingStudent(null);
      setEditingSequence("");
    } catch {
      setSignInPictureError(
        "We couldn't save those sign-in pictures. Nothing changed. Try again or cancel."
      );
    } finally {
      setSavingSignInPictures(false);
    }
  }
  function closeStudentPanelBefore(action) {
    onClearStudent?.();
    action();
  }
  function openStudentActions(student) {
    setStudentActionError("");
    closeStudentPanelBefore(() => setActionsStudent(student));
  }
  async function saveStudentProfile(event) {
    event.preventDefault();
    const cleanName = String(studentNameDraft || "").trim().replace(/\s+/g, " ");
    if (!cleanName) {
      setStudentProfileError("Enter a display name.");
      return;
    }
    if (cleanName.length > 80) {
      setStudentProfileError("Display names must be 80 characters or fewer.");
      return;
    }
    setSavingStudentProfile(true);
    setStudentProfileError("");
    try {
      const saved = await updateStudentName?.(editingStudentProfile.id, cleanName);
      if (!saved) {
        setStudentProfileError("We couldn't save this change. Nothing was changed. Try again.");
        return;
      }
      setEditingStudentProfile(null);
      setStudentNameDraft("");
    } catch {
      setStudentProfileError("We couldn't save this change. Nothing was changed. Try again.");
    } finally {
      setSavingStudentProfile(false);
    }
  }
  function openQuestionGuide() {
    setQuestionGuideSearch("");
    setShowQuestionGuide(true);
  }
  // Deleting a student has to clear this device too, or the child's saved work
  // reappears from local storage the next time the app syncs.
  async function forgetStudentOnThisDevice(learner, { cleanup = true } = {}) {
    let cleanupResult = null;
    if (cleanup) {
      const progressCleanup = await clearAndVerifyLocalProgressForStudent(learner.id);
      const evidenceCleanup = await clearLocalElAssessmentDataForStudent({
        teacherId: learner.teacher_id || teacherId,
        studentId: learner.id,
        studentName: learner.name
      });
      cleanupResult = { progressCleanup, evidenceCleanup };
    }
    setStudentList?.(previous => previous.filter(row => row.id !== learner.id));
    if (selectedStudentId === learner.id) onClearStudent?.();
    return cleanupResult;
  }
  async function handleDataRightsDeletion(learner) {
    // The data-rights dialog has already verified both local cleanup layers
    // before it is allowed to invoke this callback.
    await forgetStudentOnThisDevice(learner, { cleanup: false });
    if (selectedClassId) {
      await loadStudentsRef.current?.(selectedClassId);
      await loadClassDashboardRef.current?.(selectedClassId);
    }
    setDataRightsStudent(null);
    setRosterOperationStatus(
      TEACHER_COPY.privacy.deleteComplete(learner.name)
    );
  }
  const classRead = getClassListReadView({
    readState: classListReadState,
    teacherId,
    legacyLoading: loadingClasses
  });
  const visibleClassList = classRead.rowsVerified ? classList : [];
  const knownSelectedClass = visibleClassList.find(row => row.id === selectedClassId) || null;
  const selectedClass = classRead.complete ? knownSelectedClass : null;
  const archivedRowsForSelectedClass = useMemo(
    () => archivedStudentList.filter(
      row => String(row?.class_id || "") === String(selectedClassId || "")
    ),
    [archivedStudentList, selectedClassId]
  );
  const archivedRosterView = useMemo(() => getTeacherArchivedRosterView({
    archivedStudents: archivedRowsForSelectedClass,
    page: archivedRosterPage,
    search: archivedRosterSearch,
    selectedClassId
  }), [
    archivedRowsForSelectedClass,
    archivedRosterPage,
    archivedRosterSearch,
    selectedClassId
  ]);
  const rosterRead = getStudentRosterReadView({
    readState: studentListReadState,
    classId: selectedClassId,
    legacyLoading: loadingStudents
  });
  const dashboardRead = getClassDashboardReadView({
    readState: classDashboardReadState,
    classId: selectedClassId
  });
  const dashboardRowsForClass = dashboardRead.rowsBelongToClass
    ? classDashboard.filter(row => (
      !classDashboardReadState?.status
      || String(row?.classId || "") === String(selectedClassId || "")
    ))
    : [];
  const studentRows = useTeacherStudentRows({
    studentList: rosterRead.rowsBelongToClass ? studentList : [],
    classDashboard: rosterRead.complete ? dashboardRowsForClass : []
  });
  const completeEvidenceRows = useMemo(
    () => studentRows.filter(row => row.evidenceReadStatus === "complete"),
    [studentRows]
  );
  const incompleteEvidenceRows = useMemo(
    () => studentRows.filter(row => row.evidenceReadStatus !== "complete"),
    [studentRows]
  );
  const hasIncompleteEvidence = incompleteEvidenceRows.length > 0;
  const rosterGroups = useMemo(() => [
    {
      id: "all",
      label: TEACHER_COPY.groups.everyone,
      studentIds: studentRows.map(row => row.id)
    },
    {
      id: "attention",
      label: TEACHER_COPY.groups.needsHelp,
      studentIds: studentRows
        .filter(needsSupportConclusion)
        .map(row => row.id)
    },
    {
      id: "not-started",
      label: TEACHER_COPY.groups.notStarted,
      studentIds: studentRows
        .filter(row => row.evidenceReadStatus === "complete" && row.answered === 0)
        .map(row => row.id)
    },
    {
      id: "active-today",
      label: TEACHER_COPY.groups.playedToday,
      studentIds: studentRows
        .filter(row =>
          row.evidenceReadStatus === "complete"
          && formatLastActive(row.lastActive) === "Today"
        )
        .map(row => row.id)
    }
  ], [studentRows]);
  const selectedRosterGroup = rosterGroups.find(group => group.id === selectedGroupId) || rosterGroups[0];
  const selectedStudentRow = studentRows.find(row => row.id === selectedStudentId) || null;
  const selectedStudentResultsAvailable =
    selectedStudentRow?.evidenceReadStatus === "complete";
  // ── Action cards: turn roster data into one-click next steps ──────────────
  const actionCards = useMemo(() => {
    const cards = [];

    // Reteach: 2+ students stuck on the same skill with low accuracy.
    const struggling = completeEvidenceRows.filter(row =>
      needsSupportConclusion(row)
      && row.currentSkill
      && row.currentSkill !== "Not started"
    );
    const bySkill = new Map();
    struggling.forEach(row => {
      bySkill.set(row.currentSkill, [...(bySkill.get(row.currentSkill) || []), row]);
    });
    const reteach = [...bySkill.entries()].filter(([, rows]) => rows.length >= 2).sort((a, b) => b[1].length - a[1].length)[0];
    if (reteach) {
      const reteachNames = `${reteach[1].map(row => row.name).slice(0, 4).join(", ")}${reteach[1].length > 4 ? ` +${reteach[1].length - 4}` : ""}`;
      cards.push({
        id: "reteach",
        tone: "warn",
        title: `Reteach ${reteach[0]}`,
        detail: `${reteachNames} need more practice with ${reteach[0]}.`,
        explanation: {
          evidence: `${reteachNames} have enough saved results to compare and are finding ${reteach[0]} difficult.`,
          dependency: `${reteach[0]} is their current recorded focus and should be secured before dependent practice advances.`,
          confidence: `Results are recent and complete enough to use for ${countPhrase(reteach[1].length, "student", "students")}; individual results remain available for review.`,
          unlock: "A focused re-teach creates a shared practice target and a clear point for the next assessment."
        },
        action: "Show group",
        studentIds: reteach[1].map(row => row.id)
      });
    }

    // Nudge: students without scored answers, or with no recent saved activity.
    const inactive = completeEvidenceRows.filter(row =>
      row.answered === 0
      || !row.lastActive
      || activityIsAtLeastDaysOld(
        row.lastActive,
        TEACHER_TODAY_POLICY.inactivityDueDays
      )
    );
    if (inactive.length >= 1 && completeEvidenceRows.length > 1) {
      const inactiveNames = `${inactive.map(row => row.name).slice(0, 4).join(", ")}${inactive.length > 4 ? ` +${inactive.length - 4}` : ""}`;
      const notStartedCount = inactive.filter(row => row.answered === 0).length;
      cards.push({
        id: "nudge",
        tone: "info",
        title: inactive.some(row => row.answered === 0)
          ? "Run first assessments"
          : "Follow up with students who have not practised recently",
        detail: `${inactiveNames} ${inactive.length === 1 ? "has" : "have"} no scored answers or no recent saved activity.`,
        explanation: {
          evidence: `${inactiveNames}: ${notStartedCount} ${notStartedCount === 1 ? "student has" : "students have"} no scored answers; the rest have no recent saved activity.`,
          dependency: "Current practice results are needed before the app can suggest a next teaching step.",
          confidence: "This only reflects recent activity. It does not judge what a student can do.",
          unlock: "New answers create enough current results to support a next-skill decision."
        },
        action: "Show students",
        studentIds: inactive.map(row => row.id)
      });
    }

    // Recognise one genuine saved milestone without ranking students.
    const star = completeEvidenceRows.find(row => row.masteredCount > 0);
    if (star) {
      cards.push({
        id: "celebrate",
        tone: "good",
        title: `Recognise ${star.name}'s progress`,
        detail: `${star.masteredCount} skill${star.masteredCount === 1 ? " is" : "s are"} recorded as secure — a useful milestone to acknowledge.`,
        explanation: {
          evidence: `${star.name} has ${star.masteredCount} recorded secure skill${star.masteredCount === 1 ? "" : "s"}.`,
          dependency: "Recognition follows a saved learning milestone and does not compare students.",
          confidence: star.learningConclusion?.ready
            ? `${star.learningConclusion.confidence.label}: ${star.learningConclusion.confidence.detail}.`
            : "This suggestion uses the recorded secure-skill total only. It does not infer current answer accuracy.",
          unlock: "A private or class-appropriate celebration reinforces secured learning and opens a positive conversation."
        },
        action: "Open profile",
        onClick: () => onLoadStudent?.(star.id, star.name)
      });
    }

    return cards.slice(0, 3);
  }, [completeEvidenceRows, onLoadStudent]);

  const groupFilterIds = selectedRosterGroup.id === "all" ? null : selectedRosterGroup.studentIds;
  const effectiveRosterFilterIds = rosterFilterIds || groupFilterIds;
  const groupedStudentRows = effectiveRosterFilterIds
    ? studentRows.filter(row => effectiveRosterFilterIds.includes(row.id))
    : studentRows;
  const normalizedRosterSearch = rosterSearch.trim().toLowerCase();
  const visibleStudentRows = groupedStudentRows
    .filter(row => !normalizedRosterSearch || row.name.toLowerCase().includes(normalizedRosterSearch))
    .filter(row => {
      if (rosterStatusFilter === "login-missing") return !row.symbol_password;
      if (rosterStatusFilter === "not-started") {
        return row.evidenceReadStatus === "complete" && row.answered === 0;
      }
      if (rosterStatusFilter === "needs-attention") {
        return needsSupportConclusion(row);
      }
      return true;
    })
    .sort((left, right) => {
      if (rosterSort === "progress") {
        return right.masteredCount - left.masteredCount || left.name.localeCompare(right.name);
      }
      if (rosterSort === "last-active") {
        return String(right.lastActive || "").localeCompare(String(left.lastActive || ""))
          || left.name.localeCompare(right.name);
      }
      if (rosterSort === "focus") {
        return left.currentSkill.localeCompare(right.currentSkill) || left.name.localeCompare(right.name);
      }
      return left.name.localeCompare(right.name);
    });
  const rosterPageCount = Math.max(1, Math.ceil(visibleStudentRows.length / ROSTER_PAGE_SIZE));
  const currentRosterPage = Math.min(rosterPage, rosterPageCount);
  const rosterPaginationItems = getTeacherPaginationWindow({
    page: currentRosterPage,
    pageCount: rosterPageCount
  });
  const rosterPageStart = (currentRosterPage - 1) * ROSTER_PAGE_SIZE;
  const rosterPageRows = visibleStudentRows.slice(
    rosterPageStart,
    rosterPageStart + ROSTER_PAGE_SIZE
  );
  const selectedPageCount = rosterPageRows.filter(row => selectedRosterIds.includes(row.id)).length;
  const enabledRosterColumns = new Set(visibleRosterColumns);
  const rosterColumnCount = 3 + visibleRosterColumns.length;

  // The roster summary is not a complete inventory of every record linked to a
  // student (for example, a formal assessment report may exist without a
  // practice answer). Permanent deletion therefore always needs typed
  // confirmation and never claims that there is "nothing to keep".
  const operationStudent = rosterOperation?.student || null;
  const operationSavedAnswers = Number(operationStudent?.answered) || 0;
  const operationQuestStops = Number(operationStudent?.soundSeekers?.stopsCompleted) || 0;
  const operationEvidenceComplete = operationStudent?.evidenceReadStatus === "complete";
  const operationSavedSummary = [
    countPhrase(operationSavedAnswers, "saved answer"),
    operationQuestStops > 0 ? countPhrase(operationQuestStops, "Sound Seekers stop") : ""
  ].filter(Boolean).join(" and ");
  const deleteConfirmReady = Boolean(operationStudent)
    && normalizeRosterStudentName(deleteConfirmName).toLowerCase()
      === normalizeRosterStudentName(operationStudent.name).toLowerCase();

  function openRosterOperation(kind, student) {
    setOperationError("");
    setDeleteConfirmName("");
    setOperationTargetClassId("");
    setRosterOperation({ kind, student });
  }

  const skillTotal = skillTree.length;
  const startedCount = completeEvidenceRows.filter(row => row.answered > 0).length;
  const loginReadyCount = studentRows.filter(row => row.symbol_password).length;
  const activeTodayCount = completeEvidenceRows.filter(
    row => formatLastActive(row.lastActive) === "Today"
  ).length;
  const classAccuracySummary = useMemo(
    () => buildClassAccuracySummary(completeEvidenceRows.map(row => ({
      ...row,
      answered: row.currentAnswered,
      correct: row.currentCorrect,
      accuracy: row.currentAccuracy,
      conclusion: row.learningConclusion
    }))),
    [completeEvidenceRows]
  );
  const classMetricUpdatedAt = latestMetricUpdate(
    completeEvidenceRows.map(row => row.currentLastActive)
  );
  const className = knownSelectedClass?.name || "No class selected";
  const {
    hasSetupClass,
    setupSteps,
    showSetupChecklist,
    studentsMissingSignIn
  } = useTeacherSetupState({
    selectedClass,
    selectedClassId,
    studentRows,
    classCount: classRead.complete ? visibleClassList.length : 0
  });

  useEffect(() => {
    loadStudentsRef.current = loadStudents;
    loadClassDashboardRef.current = loadClassDashboard;
    loadClassesRef.current = loadClasses;
  }, [loadStudents, loadClassDashboard, loadClasses]);

  const previousArchivedClassIdRef = useRef(selectedClassId);
  useEffect(() => {
    if (previousArchivedClassIdRef.current !== selectedClassId) {
      previousArchivedClassIdRef.current = selectedClassId;
      setArchivedRosterSearch("");
      setArchivedRosterPage(1);
      return;
    }
    setArchivedRosterPage(current => (
      current === archivedRosterView.page
        ? current
        : archivedRosterView.page
    ));
  }, [archivedRosterView.page, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) return;
    if (classListReadState?.status && classListReadState.status !== "complete") return;
    loadStudentsRef.current?.(selectedClassId);
    loadClassDashboardRef.current?.(selectedClassId);
  }, [classListReadState?.status, selectedClassId]);

  useEffect(() => {
    function syncLoginCardRoute() {
      const routeIds = readLoginCardRouteStudentIds(window.location.hash);
      if (!routeIds.length) {
        setLoginCardRows(current => current.length ? [] : current);
        setLoginCardFailures(current => current.length ? [] : current);
        setLoginCardRetryError("");
        return;
      }
      const requestedIds = new Set(routeIds);
      const restoredRows = studentRows.filter(
        row => requestedIds.has(row.id) && row.symbol_password
      );
      if (!restoredRows.length) return;
      // A just-created preview can include successful picture assignments that
      // have not reached the reloaded roster yet. Keep those confirmed local
      // rows; route hydration is only needed when no preview is already open.
      setLoginCardRows(current => current.length ? current : restoredRows);
    }

    syncLoginCardRoute();
    window.addEventListener("hashchange", syncLoginCardRoute);
    window.addEventListener("popstate", syncLoginCardRoute);
    return () => {
      window.removeEventListener("hashchange", syncLoginCardRoute);
      window.removeEventListener("popstate", syncLoginCardRoute);
    };
  }, [studentRows]);

  function saveVisibleRosterColumns(nextColumns) {
    setVisibleRosterColumns(nextColumns);
    if (!teacherId) return;
    try {
      localStorage.setItem(`teacherRosterColumns:${teacherId}`, JSON.stringify(nextColumns));
    } catch {
      // The current view still updates when browser storage is unavailable.
    }
  }

  function toggleRosterColumn(columnId) {
    const nextColumns = enabledRosterColumns.has(columnId)
      ? visibleRosterColumns.filter(column => column !== columnId)
      : ROSTER_COLUMN_OPTIONS
        .map(option => option.id)
        .filter(column => column === columnId || enabledRosterColumns.has(column));
    saveVisibleRosterColumns(nextColumns);
  }

  function handleClassChange(event) {
    const nextClassId = event.target.value || null;
    // Some browsers and automation can dispatch change for the option that is
    // already selected. Clearing here without changing selectedClassId leaves
    // React nothing to react to, so the current roster disappears permanently.
    if (nextClassId === selectedClassId) return;
    setSelectedClassId?.(nextClassId);
    setStudentList?.([]);
    setRosterPage(1);
    setArchivedRosterSearch("");
    setArchivedRosterPage(1);
    setSelectedRosterIds([]);
    setRosterSearch("");
    setRosterStatusFilter("all");
    setRosterFilterIds(null);
    setVisiblePasswords({});
    setHeatOpenId(null);
    setRosterOperationStatus("");
    setNewStudentName("");
    setShowRosterImport(false);
    setRosterImportText("");
    setRosterImportPreview(null);
    setActionsStudent(null);
    setEditingStudentProfile(null);
    setEditingStudent(null);
    setAccessibilityStudent(null);
    setDataRightsStudent(null);
    setRestoringStudentIds([]);
    onClearStudent?.();
    onSelectGroup?.("all");
    // A pending "press Add student again" warning belongs to the class it was
    // raised in; carrying it across classes would wave a second click through.
    setDuplicateClassConfirm("");
    setDuplicateNameConfirm("");
  }

  // A double-click on Add student used to create a second identical student in
  // silence — which is how a roster ends up with two Aarons. Two real children
  // can share a name, so this warns once and then trusts the teacher.
  async function handleCreateStudent() {
    if (addingStudent) return;
    const clean = normalizeRosterStudentName(newStudentName);
    if (!clean) return;
    if (clean.length > 80) {
      setRosterOperationStatus({
        kind: "error",
        message: "Display names must be 80 characters or fewer."
      });
      return;
    }
    const duplicate = findDuplicateRosterName(clean, [
      ...studentRows,
      ...archivedRowsForSelectedClass
    ]);
    if (duplicate && duplicateNameConfirm !== clean.toLowerCase()) {
      setDuplicateNameConfirm(clean.toLowerCase());
      const isArchived = archivedRowsForSelectedClass.some(row => row.id === duplicate.id);
      setRosterOperationStatus({
        kind: "error",
        message: isArchived
          ? `${duplicate.name} is already in this class but archived. Restore them under Archived students instead, or press Add student again to add a second ${clean}.`
          : `${clean} is already in this class. Press Add student again to add a second ${clean}, or change the name first so you can tell them apart.`
      });
      return;
    }
    setDuplicateNameConfirm("");
    setRosterOperationStatus("");
    setAddingStudent(true);
    try {
      const saved = await createStudent?.(clean);
      if (saved === true) {
        setNewStudentName("");
        return;
      }
      setRosterOperationStatus({
        kind: "error",
        message: `We couldn't add ${clean}. Nothing was changed. Try again.`
      });
    } catch (error) {
      console.error("Could not add student from the roster.", error);
      setRosterOperationStatus({
        kind: "error",
        message: `We couldn't add ${clean}. Nothing was changed. Try again.`
      });
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleReducedChoiceMode(row) {
    if (!setReducedChoiceMode || savingChoiceModeIds.includes(row.id)) return false;
    setSavingChoiceModeIds(ids => [...ids, row.id]);
    try {
      return await setReducedChoiceMode(row.id, !row.reducedChoiceMode) === true;
    } catch (error) {
      console.error("Could not change the student's navigation choices.", error);
      return false;
    } finally {
      setSavingChoiceModeIds(ids => ids.filter(id => id !== row.id));
    }
  }

  async function handleAccessibilitySettings(row, settings) {
    if (!setAccessibilitySettings || savingAccessibilityIds.includes(row.id)) return false;
    setSavingAccessibilityIds(ids => [...ids, row.id]);
    try {
      return await setAccessibilitySettings(row.id, settings);
    } finally {
      setSavingAccessibilityIds(ids => ids.filter(id => id !== row.id));
    }
  }

  async function handleCreateClass() {
    if (creatingClass || !newClassName.trim()) return;
    const cleanName = String(newClassName || "").trim().replace(/\s+/g, " ");
    if (cleanName.length > 120) {
      setRosterOperationStatus({
        kind: "error",
        message: "Class names must be 120 characters or fewer."
      });
      return;
    }
    const duplicateKey = cleanName.toLowerCase();
    const duplicateClass = visibleClassList.find(
      row => String(row?.name || "").trim().replace(/\s+/g, " ").toLowerCase() === duplicateKey
    );
    if (duplicateClass && duplicateClassConfirm !== duplicateKey) {
      setDuplicateClassConfirm(duplicateKey);
      setRosterOperationStatus({
        kind: "error",
        message: `${duplicateClass.name} already exists. Choose it above, or press Create class again if you really need another class with the same name.`
      });
      return;
    }
    setDuplicateClassConfirm("");
    setRosterAdminOpen(true);
    setCreatingClass(true);
    setRosterOperationStatus("");
    try {
      const saved = await createClass?.();
      if (saved !== true) {
        setRosterOperationStatus({
          kind: "error",
          message: "We couldn't create that class. Nothing was added. Try again."
        });
      } else {
        setDuplicateClassConfirm("");
      }
    } catch (error) {
      console.error("Could not create class from the roster.", error);
      setRosterOperationStatus({
        kind: "error",
        message: "We couldn't create that class. Nothing was added. Try again."
      });
    } finally {
      setCreatingClass(false);
    }
  }

  function reviewRosterImport(names) {
    setRosterImportPreview(reviewRosterImportNames(names, {
      activeRows: studentRows,
      archivedRows: archivedRowsForSelectedClass
    }));
  }

  async function handleCsvFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const names = parseCsvNames(await file.text());
      setRosterImportText(names.join("\n"));
      reviewRosterImport(names);
    } catch (error) {
      console.error("Could not read roster file.", error);
      setRosterOperationStatus({
        kind: "error",
        message: "We couldn't read that class-list file. Nothing was imported. Try another CSV file."
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleImportStudents() {
    const names = rosterImportPreview?.accepted || [];
    if (!names.length || importingRoster) return;
    if (names.length > 40 || !teacherId || !selectedClassId) {
      setRosterOperationStatus("Import up to 40 students into a selected class.");
      return;
    }
    setImportingRoster(true);
    let writeResult;
    try {
      writeResult = await insertRosterStudents({
        supabase,
        names,
        classId: selectedClassId,
        teacherId
      });
    } catch (error) {
      console.error("Roster import error:", error);
      setRosterOperationStatus({
        kind: "error",
        message: "We couldn't import that class list. No students were added."
      });
      setImportingRoster(false);
      return;
    }
    if (writeResult?.error) {
      console.error("Roster import error:", writeResult.error);
      setRosterOperationStatus("We couldn't import that class list. No students were added.");
      setImportingRoster(false);
      return;
    }

    // The insert is authoritative. Clear the import draft and report it before
    // attempting any read-back, so a failed refresh can never invite a teacher
    // to import the same students again.
    setRosterImportText("");
    setRosterImportPreview(null);
    setShowRosterImport(false);
    setRosterOperationStatus(
      `${countPhrase(names.length, "student", "students")} imported. Set sign-in pictures next.`
    );

    let refreshIncomplete;
    try {
      const [studentsResult, dashboardResult] = await Promise.all([
        loadStudents?.(selectedClassId),
        loadClassDashboard?.(selectedClassId)
      ]);
      refreshIncomplete = !Array.isArray(studentsResult)
        || dashboardResult?.ok !== true;
    } catch (refreshError) {
      console.error("Roster import was saved but refresh failed:", refreshError);
      refreshIncomplete = true;
    }
    if (refreshIncomplete) {
      setRosterOperationStatus({
        kind: "success",
        message: `${countPhrase(names.length, "student", "students")} imported. The latest class list could not reload, so do not import them again. Try loading the class list instead.`,
        actionLabel: "Try loading the class list",
        onAction: () => {
          loadStudentsRef.current?.(selectedClassId);
          loadClassDashboardRef.current?.(selectedClassId);
        }
      });
    }
    setImportingRoster(false);
  }

  // "Continue" on the setup checklist arrives here from Today with the step it
  // wants. The checklist stays visible on this page too, so the map never
  // disappears at the moment the teacher follows it.
  function handleSetupContinue(stepId) {
    if (stepId === "class") {
      focusNewClassInput();
      return;
    }
    if (stepId === "students") {
      setRosterAdminOpen(true);
      focusNewStudentInput();
      return;
    }
    if (stepId === "sign-in") {
      const learner = studentRows.find(row => !row.symbol_password);
      if (!learner) return;
      setRosterAdminOpen(true);
      openSignInPictureEditor(learner);
      return;
    }
    if (stepId === "sign-in-all") {
      setRosterAdminOpen(true);
      giveEveryoneSignInPictures();
      return;
    }
    if (stepId === "assessment") {
      const learner = selectedStudentRow || studentRows[0];
      if (learner) onStartCheck?.(learner);
    }
  }

  // Arriving from Today's checklist: run the same step handler the on-page
  // checklist uses, one frame later so the inputs it focuses already exist.
  useEffect(() => {
    if (!setupFocus) return undefined;
    // Every step but "create a class" needs the roster in hand. Acting before it
    // arrives is how a Continue button silently does nothing.
    if (setupFocus !== "class" && selectedClassId && !rosterRead.complete) return undefined;
    const frame = window.requestAnimationFrame(() => {
      handleSetupContinue(setupFocus);
      onSetupFocusHandled?.();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterRead.complete, setupFocus, selectedClassId, studentRows.length]);

  async function handleCreateDemo() {
    if (creatingDemo) return;
    setCreatingDemo(true);
    setRosterAdminOpen(true);
    setRosterOperationStatus("");
    try {
      const created = await createDemoClass?.();
      if (created !== true) {
        setRosterOperationStatus({
          kind: "error",
          message: "We couldn't create the sample class. Nothing was added. Try again."
        });
      }
    } catch (error) {
      console.error("Could not create sample class from the roster.", error);
      setRosterOperationStatus({
        kind: "error",
        message: "We couldn't create the sample class. Nothing was added. Try again."
      });
    } finally {
      setCreatingDemo(false);
    }
  }

  function openLoginCardPreview(rows, { failedAssignments = [] } = {}) {
    const printableRows = rows.filter(row => row.symbol_password);
    if (!printableRows.length) return;
    setLoginCardRows(printableRows);
    setLoginCardFailures(failedAssignments);
    setLoginCardRetryError("");
    pushLoginCardRoute(printableRows);
  }

  function closeLoginCardPreview() {
    setLoginCardRows([]);
    setLoginCardFailures([]);
    setLoginCardRetryError("");
    clearLoginCardRoute();
  }

  async function retryFailedSignInPictures() {
    if (assigningSignIn || !loginCardFailures.length) return;
    setAssigningSignIn(true);
    setLoginCardRetryError("");
    try {
      const result = await assignMissingSymbolPasswords?.(loginCardFailures);
      const savedIds = new Set(result?.savedIds || []);
      const newlySavedRows = loginCardFailures
        .filter(item => savedIds.has(item.student?.id))
        .map(item => ({ ...item.student, symbol_password: item.sequence }));
      const remaining = loginCardFailures.filter(
        item => !savedIds.has(item.student?.id)
      );
      const mergedRows = Array.from(new Map(
        [...loginCardRows, ...newlySavedRows].map(row => [row.id, row])
      ).values());
      setLoginCardRows(mergedRows);
      setLoginCardFailures(remaining);
      pushLoginCardRoute(mergedRows);
      if (remaining.length > 0) {
        setLoginCardRetryError(
          `We still couldn't save ${countPhrase(remaining.length, "student")}. Nothing incorrect was added to the printable cards.`
        );
      }
    } catch (error) {
      console.error("Could not retry missing class sign-in pictures.", error);
      setLoginCardRetryError(
        "We couldn't save the missing pictures. Nothing incorrect was added to the printable cards. Try again."
      );
    } finally {
      setAssigningSignIn(false);
    }
  }

  // Two clicks for a whole class: make a unique picture sequence for everyone
  // who has none, then open the printable cards. Preview rows are built from
  // the sequences we just wrote rather than waiting for the roster to reload.
  async function giveEveryoneSignInPictures() {
    if (assigningSignIn) return;
    const missing = studentRows.filter(row => !row.symbol_password);
    if (!missing.length) {
      openLoginCardPreview(studentRows);
      return;
    }
    setAssigningSignIn(true);
    try {
      const assignments = assignUniqueSymbolSequences(
        missing,
        studentRows.map(row => row.symbol_password).filter(Boolean)
      );
      const result = await assignMissingSymbolPasswords?.(assignments);
      if (!result || result.saved === 0) {
        setRosterOperationStatus({
          kind: "error",
          message: "We couldn't save any sign-in pictures. No cards were opened. Try again."
        });
        return;
      }
      // Only children whose sequence was actually written get a card. Building
      // the preview from the locally generated map printed pictures that had
      // failed to save, and a laminated card that does not work is worse than
      // no card at all.
      const savedIds = new Set(result.savedIds || []);
      const assignedById = new Map(assignments
        .filter(item => savedIds.has(item.student.id))
        .map(item => [item.student.id, item.sequence]));
      const failedAssignments = assignments.filter(
        item => !savedIds.has(item.student.id)
      );
      openLoginCardPreview(
        studentRows.map(row => (
          row.symbol_password
            ? row
            : { ...row, symbol_password: assignedById.get(row.id) || "" }
        )),
        { failedAssignments }
      );
    } catch (error) {
      console.error("Could not make class sign-in pictures.", error);
      setRosterOperationStatus({
        kind: "error",
        message: "We couldn't save the sign-in pictures. No cards were opened. Try again."
      });
    } finally {
      setAssigningSignIn(false);
    }
  }

  function reportRosterFailure(error, operation, student) {
    console.error(`Roster ${operation} failed for ${student?.id || "unknown student"}:`, error);
    const message = describeRosterOperationError(error, {
      operation,
      studentName: student?.name
    });
    setOperationError(message);
    setRosterOperationStatus({ kind: "error", message });
  }

  function closeRosterOperation() {
    setRosterOperation(null);
    setOperationTargetClassId("");
    setOperationError("");
    setDeleteConfirmName("");
  }

  // EVERY failure path here now ends in a sentence the teacher can read.
  // This function used to be try/finally with no catch: a rejected write threw
  // past the dialog, left it open and reported nothing at all, which is exactly
  // what "I clicked archive and nothing happened" looks like from the outside.
  async function confirmRosterOperation() {
    if (!rosterOperation || operationBusy) return;
    const { kind, student } = rosterOperation;
    setOperationBusy(true);
    setOperationError("");
    try {
      let failure = null;
      let saved = false;
      let successFeedback = null;
      if (kind === "archive") {
        const { error } = await setRosterStudentArchived({
          supabase,
          studentId: student.id,
          classId: selectedClassId,
          archived: true
        });
        failure = error;
        saved = !error;
        if (saved) {
          successFeedback = {
            kind: "undo",
            message: `${student.name} archived. Their saved results remain, and you can restore them at any time.`,
            actionLabel: `Undo archive for ${student.name}`,
            onAction: () => handleRestoreStudent(student)
          };
        }
      } else if (kind === "delete") {
        await deleteRosterStudent({
          supabase,
          studentId: student.id,
          studentName: student.name,
          accountId: student.teacher_id || teacherId,
          cleanup: () => forgetStudentOnThisDevice(student)
        });
        saved = true;
        successFeedback = {
          kind: "success",
          message: TEACHER_COPY.privacy.deleteComplete(student.name)
        };
      } else if (kind === "transfer") {
        const targetClass = visibleClassList.find(row => row.id === operationTargetClassId);
        if (!targetClass || targetClass.id === selectedClassId) {
          failure = {
            code: "LP_INVALID_TRANSFER_TARGET",
            message: "Choose another class from this account."
          };
          reportRosterFailure(failure, kind, student);
          return;
        }
        const { error } = await transferRosterStudent({
          supabase,
          studentId: student.id,
          sourceClassId: selectedClassId,
          targetClassId: operationTargetClassId
        });
        failure = error;
        saved = !error;
        if (saved) {
          successFeedback = {
            kind: "success",
            message: `${student.name} moved to ${targetClass.name}. Their individual progress and saved work stay with them. Earlier class records stay with the class where they were recorded. They will need to sign in again.`
          };
        }
      } else if (kind === "reset-sign-in") {
        saved = await resetStudentSymbolPassword?.(student.id, student.name) === true;
        if (!saved) {
          const resetError = "We couldn't reset these sign-in pictures. Nothing was changed. Try again.";
          setOperationError(resetError);
          setRosterOperationStatus({ kind: "error", message: resetError });
          return;
        }
        setRosterOperationStatus({
          kind: "success",
          message: `${student.name}'s sign-in pictures were reset. Set new pictures before their next sign-in.`
        });
        closeRosterOperation();
        return;
      }

      if (!saved) {
        reportRosterFailure(failure, kind, student);
        return;
      }

      // The write is now authoritative. Reflect it immediately and close the
      // dialog before refreshing: a later read failure must never tell the
      // teacher that an archive, transfer, or permanent deletion did not
      // happen.
      setStudentList?.(previous => previous.filter(row => row.id !== student.id));
      setArchivedStudentList?.(previous => {
        const withoutStudent = previous.filter(row => row.id !== student.id);
        if (kind !== "archive") return withoutStudent;
        return [
          ...withoutStudent,
          {
            ...student,
            archived_at: student.archived_at || new Date().toISOString()
          }
        ];
      });
      if (selectedStudentId === student.id) onClearStudent?.();
      setSelectedRosterIds(previous => previous.filter(id => id !== student.id));
      setRosterOperationStatus(successFeedback);
      closeRosterOperation();

      try {
        await loadStudents?.(selectedClassId);
        await loadClassDashboard?.(selectedClassId);
      } catch (refreshError) {
        console.error(`Roster ${kind} was saved but the screen could not refresh:`, refreshError);
        setRosterOperationStatus({
          kind: "success",
          message: `${successFeedback?.message || `${student.name}'s change was saved.`} The latest class list could not reload. Refresh this page before making another change.`,
          actionLabel: "Refresh page",
          onAction: () => window.location.reload()
        });
      }
    } catch (error) {
      reportRosterFailure(error, kind, student);
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleRestoreStudent(row) {
    if (restoringStudentIds.includes(row.id)) return;
    const classId = selectedClassId;
    if (!classId || String(row?.class_id || "") !== String(classId)) return;
    setRestoringStudentIds(ids => [...ids, row.id]);
    setRosterOperationStatus({
      kind: "pending",
      message: `Restoring ${row.name}…`
    });
    try {
      const { error } = await setRosterStudentArchived({
        supabase,
        studentId: row.id,
        classId,
        archived: false
      });
      if (selectedClassIdRef.current !== classId) {
        if (error) {
          console.error(`Roster restore failed for ${row?.id || "unknown student"} after the class changed:`, error);
        }
        return;
      }
      if (error) {
        reportRosterFailure(error, "restore", row);
        return;
      }
      setStudentList?.(previous => (
        previous.some(student => student.id === row.id)
          ? previous
          : [...previous, { ...row, archived_at: null }]
      ));
      setArchivedStudentList?.(previous => previous.filter(student => student.id !== row.id));
      setRosterOperationStatus({
        kind: "success",
        message: `${row.name} restored to the class roster.`
      });
      try {
        await loadStudents?.(classId);
        await loadClassDashboard?.(classId);
      } catch (refreshError) {
        console.error("Roster restore was saved but the screen could not refresh:", refreshError);
        if (selectedClassIdRef.current === classId) {
          setRosterOperationStatus({
            kind: "success",
            message: `${row.name} was restored to the class roster. The latest class list could not reload. Refresh this page before making another change.`,
            actionLabel: "Refresh page",
            onAction: () => window.location.reload()
          });
        }
      }
    } catch (error) {
      if (selectedClassIdRef.current === classId) {
        reportRosterFailure(error, "restore", row);
      } else {
        console.error(`Roster restore failed for ${row?.id || "unknown student"}:`, error);
      }
    } finally {
      setRestoringStudentIds(ids => ids.filter(id => id !== row.id));
    }
  }

  if (loginCardRows.length > 0) {
    return (
      <LoginCardPrintRoute
        rows={loginCardRows}
        failedAssignments={loginCardFailures}
        retryingFailures={assigningSignIn}
        retryFailureMessage={loginCardRetryError}
        schoolName={schoolName}
        className={selectedClass?.name}
        classCode={selectedClass?.access_code}
        onClose={closeLoginCardPreview}
        onRetryFailures={retryFailedSignInPictures}
      />
    );
  }

  return (
    <TeacherPageShell
      className="teacher-dashboard-page teacher-students-page"
      product="class-dashboard"
    >
      <TeacherPageHeader
        className="teacher-dashboard-hero"
        brand={(
          <div className="teacher-page-brand">
            <img src={logoUrl} alt="" />
            <p className="panel-label">{TEACHER_COPY.classes.label}</p>
          </div>
        )}
        title={TEACHER_COPY.classes.title}
        description={knownSelectedClass
          ? TEACHER_COPY.classes.descriptionWithClass(knownSelectedClass.name)
          : TEACHER_COPY.classes.descriptionWithoutClass}
      >
        <div
          className="teacher-dashboard-context"
          aria-label={TEACHER_COPY.classes.contextLabel}
        >
          <span>School</span>
          <strong>{hasSchool ? schoolName : "Not set"}</strong>
          <small>
            {knownSelectedClass
              ? !classRead.complete
                ? "Class list needs reloading"
                : rosterRead.complete
                ? TEACHER_COPY.classes.childCount(studentRows.length)
                : rosterRead.incomplete
                  ? "Student list needs reloading"
                  : "Loading students…"
              : className}
          </small>
        </div>
      </TeacherPageHeader>

      <ActionFeedback className="teacher-dashboard-message" message={message} />
      <ActionFeedback className="teacher-dashboard-message" feedback={rosterOperationStatus} />

      <>
      {classRead.complete
        && dashboardRead.complete
        && (!selectedClass || rosterRead.complete)
        && showSetupChecklist && (
        <TeacherSetupChecklist
          hasClass={hasSetupClass}
          steps={setupSteps}
          onContinue={handleSetupContinue}
          onCreateDemo={createDemoClass ? handleCreateDemo : null}
          creatingDemo={creatingDemo}
        />
      )}

      <section
        className="teacher-dashboard-controls"
        aria-label="Class controls"
      >
        <div className="teacher-dashboard-control-group">
          <label className="teacher-dashboard-control">
            <span>Current class</span>
            <select
              value={selectedClassId || ""}
              disabled={
                !classRead.complete
                || addingStudent
                || importingRoster
                || creatingClass
                || assigningSignIn
                || operationBusy
                || restoringStudentIds.length > 0
              }
              onChange={handleClassChange}
            >
              <option value="">Choose class</option>
              {visibleClassList.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {classRead.complete && <details
          className="teacher-class-tools"
          open={classToolsOpen}
          onToggle={event => setClassToolsOpen(event.currentTarget.open)}
        >
          <summary>{visibleClassList.length ? "Create another class" : "Create a class"}</summary>
          <div className="teacher-dashboard-create teacher-dashboard-control-group">
            <label className="teacher-dashboard-control">
              <span>Class name</span>
              <input
                ref={newClassInputRef}
                autoComplete="off"
                disabled={creatingClass}
                maxLength={120}
                value={newClassName}
                placeholder="For example, Willow Class"
                onChange={event => {
                  setNewClassName?.(event.target.value);
                  setDuplicateClassConfirm("");
                }}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.repeat) handleCreateClass();
                }}
              />
            </label>
            <button
              className="lp-button lp-button-primary"
              disabled={creatingClass || !newClassName.trim()}
              onClick={handleCreateClass}
              type="button"
            >
              {creatingClass ? "Creating…" : "Create class"}
            </button>
          </div>
        </details>}
      </section>

      {selectedClass && rosterRead.complete && dashboardRead.loading && (
        <TeacherSurfaceState
          compact
          surface="classes"
          state="loading"
        />
      )}

      {selectedClass && rosterRead.complete && dashboardRead.failed && (
        <TeacherSurfaceState
          compact
          surface="classes"
          state="partial"
          detail={dashboardRead.truncated
            ? "The full set of class results reached its safety limit. Names and sign-in remain available, but no missing result is counted as zero."
            : "Class progress could not be confirmed. Names and sign-in remain available, but no earlier class figure is being reused."}
          onPrimaryAction={() => loadClassDashboardRef.current?.(selectedClassId)}
        />
      )}

      {selectedClass && rosterRead.complete && dashboardRead.complete && hasIncompleteEvidence && (
        <TeacherSurfaceState
          compact
          surface="classes"
          state="partial"
          detail={`${countPhrase(incompleteEvidenceRows.length, "student has", "students have")} results that need loading again.`}
          onPrimaryAction={() => loadClassDashboardRef.current?.(selectedClassId)}
        />
      )}

      {selectedClass && (
        <details className="teacher-dashboard-secondary">
          <summary>{TEACHER_COPY.sync.label}</summary>
          <TeacherActivitySyncHealth
            supabase={supabase}
            classId={selectedClass.id}
            className={selectedClass.name}
            seedRows={activitySyncHealthSeedRows}
          />
        </details>
      )}

      {selectedClass && rosterRead.complete && dashboardRead.complete && (
        <details className="teacher-students-secondary teacher-students-overview">
          <summary>
            <span>Class overview</span>
            <small>Sign-in, activity and class-level results</small>
          </summary>
          <section
            className="teacher-roster-metrics"
            aria-label={TEACHER_COPY.metrics.summaryAriaLabel}
            data-teacher-priority="class-pulse"
          >
          <RosterMetric label={TEACHER_COPY.metrics.students} value={studentRows.length} />
          <RosterMetric
            label={TEACHER_COPY.metrics.readyToSignIn}
            value={progressPhrase(loginReadyCount, studentRows.length || 0)}
            tone={loginReadyCount === studentRows.length && studentRows.length ? "good" : ""}
          />
          <RosterMetric
            definitionId="started"
            definitionOptions={{
              denominator: `${countPhrase(studentRows.length, "student", "students")} in this class.`,
              updatedAt: classMetricUpdatedAt
            }}
            label={TEACHER_COPY.metrics.havePlayed}
            value={hasIncompleteEvidence
              ? "Results unavailable"
              : progressPhrase(startedCount, studentRows.length || 0)}
          />
          <div className="teacher-roster-metric teacher-roster-metric-accuracy">
            <span>{TEACHER_COPY.metrics.classAccuracy}</span>
            <strong>
              {hasIncompleteEvidence
                ? "Results unavailable"
                : classAccuracySummary.comparability.comparable
                ? `${classAccuracySummary.learnerWeightedAccuracy}%`
                : TEACHER_COPY.metrics.notEnough}
            </strong>
            {!hasIncompleteEvidence && <details>
              <summary>See both averages</summary>
              <dl>
                <div>
                  <dt>{TEACHER_COPY.metrics.equalChildren}</dt>
                  <dd>
                    <MetricFigure
                      metricId="accuracy"
                      denominator={`${countPhrase(classAccuracySummary.policyReadyLearnerCount, "student", "students")} with at least ${PROGRESS_MIN_RESPONSES} scored answers each.`}
                      dateRange={`Scored answers from the last ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`}
                      updatedAt={classMetricUpdatedAt}
                    >
                      {classAccuracySummary.learnerWeightedAccuracy === null
                        ? TEACHER_COPY.metrics.notEnough
                        : `${classAccuracySummary.learnerWeightedAccuracy}%`}
                    </MetricFigure>
                  </dd>
                </div>
                <div>
                  <dt>{TEACHER_COPY.metrics.equalAnswers}</dt>
                  <dd>
                    <MetricFigure
                      metricId="accuracy"
                      denominator={`${countPhrase(classAccuracySummary.responseCount, "scored answer")} from ${countPhrase(classAccuracySummary.policyReadyLearnerCount, "student", "students")}.`}
                      dateRange={`Scored answers from the last ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`}
                      updatedAt={classMetricUpdatedAt}
                    >
                      {classAccuracySummary.responseWeightedAccuracy === null
                        ? TEACHER_COPY.metrics.notEnough
                        : `${classAccuracySummary.responseWeightedAccuracy}%`}
                    </MetricFigure>
                  </dd>
                </div>
              </dl>
            </details>}
          </div>
          <RosterMetric
            definitionId="active"
            definitionOptions={{
              denominator: `${countPhrase(studentRows.length, "student", "students")} in this class.`,
              updatedAt: classMetricUpdatedAt
            }}
            label={TEACHER_COPY.metrics.playedToday}
            value={hasIncompleteEvidence
              ? "Results unavailable"
              : progressPhrase(activeTodayCount, studentRows.length || 0)}
          />
          <p
            className="teacher-roster-metric-note"
            role="status"
            data-class-average-suppressed={
              hasIncompleteEvidence || !classAccuracySummary.comparability.comparable
            }
          >
            {hasIncompleteEvidence
              ? "Class progress totals are paused until every saved result source loads completely."
              : classAccuracySummary.comparability.comparable
              ? TEACHER_COPY.metrics.comparable
              : classAverageHeldBackNote(classAccuracySummary.comparability)}
          </p>
          </section>
        </details>
      )}

      {selectedClass && rosterRead.complete && dashboardRead.complete && (
        <details className="teacher-students-secondary teacher-students-groups">
          <summary>
            <span>Groups and assessment guide</span>
            <small>Filter the roster or review what each assessment measures</small>
          </summary>
          <section className="teacher-roster-groups" aria-label={TEACHER_COPY.groups.ariaLabel}>
            <div>
              <p className="panel-label">{TEACHER_COPY.groups.label}</p>
              <strong>{TEACHER_COPY.groups.description}</strong>
            </div>
            <div className="teacher-roster-group-buttons">
              {rosterGroups.map(group => (
                <button
                  key={group.id}
                  className={group.id === selectedRosterGroup.id ? "is-active" : ""}
                  type="button"
                  aria-pressed={group.id === selectedRosterGroup.id}
                  onClick={() => {
                    setRosterFilterIds(null);
                    setRosterPage(1);
                    onSelectGroup?.(group.id);
                  }}
                >
                  <span>{group.label}</span>
                  <strong>{group.studentIds.length}</strong>
                </button>
              ))}
            </div>
            <button
              className="lp-button lp-button-secondary teacher-question-guide-button"
              type="button"
              onClick={openQuestionGuide}
            >
              {TEACHER_COPY.help.checkGuide}
            </button>
          </section>
        </details>
      )}

      {selectedClass && rosterRead.complete && selectedStudentRow && (
        <TeacherDrawer
          label={`Student details: ${selectedStudentRow.name}`}
          onClose={onClearStudent}
        >
          <aside
            className="teacher-learner-drawer"
            role="region"
            aria-label={`Student details: ${selectedStudentRow.name}`}
            data-teacher-learner-id={selectedStudentRow.id}
          >
            <header>
              <div>
                <p className="teacher-context-trail">
                  Students <span aria-hidden="true">/</span> {selectedClass.name}
                  <span aria-hidden="true">/</span> {selectedRosterGroup.label}
                  <span aria-hidden="true">/</span> {selectedStudentRow.name}
                </p>
                <h3>{selectedStudentRow.name}</h3>
                <p>
                  <strong>Current focus:</strong>{" "}
                  {selectedStudentResultsAvailable ? (
                    <MetricFigure
                      metricId="current-skill"
                      updatedAt={selectedStudentRow.lastActive}
                    >
                      {selectedStudentRow.currentSkill}
                    </MetricFigure>
                  ) : "Results unavailable"}
                </p>
              </div>
              <button className="text-button" data-autofocus type="button" onClick={onClearStudent}>
                Close student details
              </button>
            </header>
            <div className="teacher-learner-drawer-metrics" aria-label={`${selectedStudentRow.name} results summary`}>
              <RosterMetric
                definitionId="accuracy"
                definitionOptions={{
                  denominator: `${countPhrase(selectedStudentRow.currentAnswered, "scored answer")} from the last ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`,
                  dateRange: `The last ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`,
                  updatedAt: selectedStudentRow.currentLastActive
                }}
                label="Accuracy across skills"
                value={selectedStudentResultsAvailable
                  ? accuracyConclusion(selectedStudentRow)
                  : "Results unavailable"}
              />
              <RosterMetric
                definitionId="mastered"
                definitionOptions={{
                  denominator: `${skillTotal} curriculum skills.`,
                  updatedAt: selectedStudentRow.lastActive
                }}
                label="Skills secured"
                value={selectedStudentResultsAvailable
                  ? progressPhrase(selectedStudentRow.masteredCount, skillTotal)
                  : "Results unavailable"}
              />
              <RosterMetric
                definitionId="active"
                definitionOptions={{
                  denominator: "This student's saved answers and Sound Seekers play.",
                  dateRange: "Most recent saved activity across all time.",
                  updatedAt: selectedStudentRow.lastActive
                }}
                label="Last active"
                value={selectedStudentResultsAvailable
                  ? formatLastActive(selectedStudentRow.lastActive)
                  : "Results unavailable"}
              />
            </div>
            <dl className="teacher-learner-drawer-details">
              <div>
                <dt>Sign-in</dt>
                <dd>
                  <span>{selectedStudentRow.symbol_password ? "Pictures ready" : "Pictures need setting"}</span>
                  {selectedStudentRow.symbol_password && (
                    <>
                      <SymbolSequence
                        sequence={selectedStudentRow.symbol_password}
                        hidden={!visiblePasswords[selectedStudentRow.id]}
                        size={20}
                      />
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setVisiblePasswords(previous => ({
                          ...previous,
                          [selectedStudentRow.id]: !previous[selectedStudentRow.id]
                        }))}
                      >
                        {visiblePasswords[selectedStudentRow.id] ? "Hide pictures" : "Show pictures"}
                      </button>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt>Sound Seekers</dt>
                <dd>
                  {!selectedStudentResultsAvailable
                    ? "Results unavailable"
                    : selectedStudentRow.soundSeekers?.sessions || selectedStudentRow.soundSeekers?.stopsCompleted > 0
                    ? (
                      <MetricFigure
                        metricId="trails"
                        updatedAt={selectedStudentRow.soundSeekers.syncedAt || selectedStudentRow.lastActive}
                      >
                        {progressPhrase(selectedStudentRow.soundSeekers.stopsCompleted, 40)} trails · {selectedStudentRow.soundSeekers.stonesLit} sounds lit
                      </MetricFigure>
                    )
                    : "Not started"}
                </dd>
              </div>
            </dl>
            {/* THE STUDENT PANEL. Everything you can do to one student is here,
                including the teaching tools that used to be stranded on the
                Resources page behind a second student picker. */}
            <div className="teacher-learner-drawer-actions">
              <button
                className="lp-button lp-button-primary teacher-start-check"
                type="button"
                onClick={() => onStartCheck?.(selectedStudentRow)}
              >
                Assess {selectedStudentRow.name}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => onOpenReport?.(selectedStudentRow)}
              >
                Open report
              </button>
              <details className="teacher-student-panel-more">
                <summary>Learning tools</summary>
                <div>
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    onClick={() => onOpenGuidedReading?.(selectedStudentRow)}
                  >
                    Guided reading
                  </button>
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    onClick={() => onOpenStoryQuests?.(selectedStudentRow)}
                  >
                    Preview Story Quests
                  </button>
                </div>
              </details>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                aria-haspopup="dialog"
                onClick={() => openStudentActions(selectedStudentRow)}
              >
                Student settings
              </button>
            </div>
          </aside>
        </TeacherDrawer>
      )}

      {selectedClass && rosterRead.complete && dashboardRead.complete && actionCards.length > 0 && (
        <details className="teacher-students-secondary teacher-students-suggestions">
          <summary>
            <span>Suggested next steps</span>
            <small>{countPhrase(actionCards.length, "suggestion")}</small>
          </summary>
          <section className="teacher-action-cards" aria-label="Suggested next steps">
            {actionCards.map(card => (
              <article
                key={card.id}
                className={`teacher-action-card ${card.tone}`}
                data-teacher-recommendation={card.id}
              >
                <div className="teacher-action-card-copy">
                  <strong>{card.title}</strong>
                  <p>{card.detail}</p>
                  <TeacherRecommendationExplanation
                    explanation={card.explanation}
                    surface="teacher-dashboard-next-steps"
                  />
                </div>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => {
                    if (card.onClick) card.onClick();
                    else if (card.studentIds) {
                      setRosterFilterIds(card.studentIds);
                      setRosterPage(1);
                    }
                  }}
                >
                  {card.action}
                </button>
              </article>
            ))}
          </section>
        </details>
      )}

      {rosterRead.complete && effectiveRosterFilterIds && (
        <div className="teacher-roster-filter-chip">
          <span>
            {rosterFilterIds ? "Suggested group" : selectedRosterGroup.label}: showing {visibleStudentRows.length} of {studentRows.length} students
          </span>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setRosterFilterIds(null);
              setRosterPage(1);
              onSelectGroup?.("all");
            }}
          >
            Show all
          </button>
        </div>
      )}

      <section className="teacher-dashboard-roster" aria-label={TEACHER_COPY.roster.panelLabel}>
        {selectedClass && rosterRead.complete && (
        <details
          className="teacher-roster-admin"
          data-teacher-priority="roster-admin"
          open={rosterAdminOpen}
          onToggle={event => setRosterAdminOpen(event.currentTarget.open)}
        >
          <summary>
            <span>
              <strong>{TEACHER_COPY.roster.manageTitle}</strong>
              <small>{TEACHER_COPY.roster.manageBody}</small>
            </span>
            <span>Optional setup</span>
          </summary>
          <div className="teacher-roster-admin-content">
          <div className="teacher-roster-actionbar">
            <div className="teacher-roster-add">
              <label className="teacher-dashboard-control">
                <span>{TEACHER_COPY.roster.displayName}</span>
                <input
                  ref={newStudentInputRef}
                  autoComplete="off"
                  disabled={addingStudent}
                  maxLength={80}
                  value={newStudentName}
                  placeholder={TEACHER_COPY.roster.displayNamePlaceholder}
                  onChange={event => {
                    setNewStudentName(event.target.value);
                    setDuplicateNameConfirm("");
                  }}
                  onKeyDown={event => {
                    if (event.key === "Enter") handleCreateStudent();
                  }}
                />
              </label>
              <button
                className="lp-button lp-button-primary"
                disabled={addingStudent || !newStudentName.trim()}
                onClick={handleCreateStudent}
                type="button"
              >
                {addingStudent ? "Adding…" : TEACHER_COPY.roster.add}
              </button>
            </div>
            <div className="teacher-roster-actions">
              <button
                className="lp-button lp-button-secondary"
                onClick={() => {
                  setShowRosterImport(current => !current);
                  setRosterImportPreview(null);
                }}
                type="button"
                aria-expanded={showRosterImport}
              >
                {showRosterImport ? "Close import" : "Import class list"}
              </button>
              {studentsMissingSignIn.length > 0 && (
                <button
                  className="lp-button lp-button-primary"
                  type="button"
                  disabled={assigningSignIn}
                  onClick={giveEveryoneSignInPictures}
                >
                  {assigningSignIn
                    ? "Making pictures..."
                    : `${TEACHER_COPY.setup.signInGapAction} (${studentsMissingSignIn.length})`}
                </button>
              )}
              <details className="teacher-roster-more-tools">
                <summary>More tools</summary>
                <div>
                  <button
                    className="lp-button lp-button-secondary"
                    disabled={!selectedRosterIds.length}
                    onClick={() => openLoginCardPreview(studentRows.filter(row => selectedRosterIds.includes(row.id)))}
                    type="button"
                  >
                    Preview selected cards ({selectedRosterIds.length})
                  </button>
                  <button
                    className="lp-button lp-button-secondary"
                    disabled={!studentRows.some(row => row.symbol_password)}
                    onClick={() => openLoginCardPreview(studentRows)}
                    type="button"
                  >
                    Preview all cards
                  </button>
                  <button className="lp-button lp-button-secondary" onClick={startStudentLogin} type="button">
                    {TEACHER_COPY.roster.childPreview}
                  </button>
                </div>
              </details>
            </div>
          </div>

          {showRosterImport && (
          <section className="teacher-roster-import" aria-label="Import students&apos;s names">
            <div>
              <strong>{TEACHER_COPY.roster.importTitle}</strong>
              <p>{TEACHER_COPY.roster.importBody}</p>
              <label className="lp-button lp-button-secondary teacher-csv-file-button">
                <span>Choose CSV file</span>
                <input accept=".csv,text/csv" onChange={handleCsvFile} type="file" />
              </label>
            </div>
            <label>
              <span>{TEACHER_COPY.roster.namesLabel}</span>
              <textarea
                value={rosterImportText}
                onChange={event => {
                  setRosterImportText(event.target.value);
                  setRosterImportPreview(null);
                }}
                placeholder={"Ava\nBen\nChen"}
                rows={5}
              />
            </label>
            <div className="teacher-roster-import-actions">
              {!rosterImportPreview ? (
                <button
                  className="lp-button lp-button-primary"
                  type="button"
                  disabled={!rosterImportText.trim()}
                  onClick={() => reviewRosterImport(parseCsvNames(rosterImportText))}
                >
                  Review import
                </button>
              ) : (
                <>
                  <p role="status">
                    <strong>{rosterImportPreview.accepted.length} ready</strong>
                    {" · "}
                    {rosterImportPreview.skipped.length} skipped
                  </p>
                  {rosterImportPreview.skipped.length > 0 && (
                    <ul aria-label="Students not included in this import">
                      {rosterImportPreview.skipped.map((row, index) => (
                        <li key={`${row.name}-${index}`}>{row.name}: {row.reason}</li>
                      ))}
                    </ul>
                  )}
                  <button
                    className="lp-button lp-button-primary"
                    type="button"
                    disabled={!rosterImportPreview.accepted.length || importingRoster}
                    onClick={handleImportStudents}
                  >
                    {importingRoster
                      ? "Importing..."
                      : `Import ${countPhrase(rosterImportPreview.accepted.length, "student", "students")}`}
                  </button>
                </>
              )}
            </div>
          </section>
          )}
          <p className="teacher-roster-privacy-note">{TEACHER_COPY.roster.privacy}</p>
          </div>
        </details>
        )}

        {selectedClass && rosterRead.complete && studentRows.length > 0 && (
          <>
            <TeacherFilterBar
              className="teacher-roster-tools"
              label="Search, sort, and filter students"
            >
              <label>
                <span>Search students</span>
                <input
                  type="search"
                  value={rosterSearch}
                  onChange={event => {
                    setRosterSearch(event.target.value);
                    setRosterPage(1);
                  }}
                  placeholder="Search display names"
                />
              </label>
              <label>
                <span>Filter</span>
                <select
                  value={rosterStatusFilter}
                  onChange={event => {
                    setRosterStatusFilter(event.target.value);
                    setRosterPage(1);
                  }}
                >
                  <option value="all">{TEACHER_COPY.roster.activeFilter}</option>
                  <option value="login-missing">{TEACHER_COPY.roster.signInMissingFilter}</option>
                  <option value="not-started">No scored answers</option>
                  <option value="needs-attention">Needs attention</option>
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select
                  value={rosterSort}
                  onChange={event => {
                    setRosterSort(event.target.value);
                    setRosterPage(1);
                  }}
                >
                  <option value="name">Display name</option>
                  <option value="last-active">Last active</option>
                  <option value="focus">Current focus</option>
                  <option value="progress">Progress</option>
                </select>
              </label>
              <p role="status">
                {visibleStudentRows.length
                  ? `Showing ${rosterPageStart + 1}–${Math.min(rosterPageStart + ROSTER_PAGE_SIZE, visibleStudentRows.length)} of ${visibleStudentRows.length} matching students`
                  : `No matches in ${countPhrase(studentRows.length, "student")}`}
              </p>
            </TeacherFilterBar>
            <details className="teacher-roster-column-picker">
              <summary>Choose columns · {visibleRosterColumns.length + 2} shown</summary>
              <fieldset>
                <legend>Optional columns</legend>
                {ROSTER_COLUMN_OPTIONS.map(option => (
                  <label key={option.id}>
                    <input
                      type="checkbox"
                      checked={enabledRosterColumns.has(option.id)}
                      onChange={() => toggleRosterColumn(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
              <p>Display name and Actions always stay visible. Column choices are saved on this device.</p>
              <button
                className="text-button"
                type="button"
                onClick={() => saveVisibleRosterColumns(DEFAULT_ROSTER_COLUMNS)}
              >
                Restore scannable defaults
              </button>
            </details>
          </>
        )}

        {classRead.loading ? (
          <TeacherSurfaceState
            compact
            surface="classes"
            state="loading"
          />
        ) : classRead.failed ? (
          <TeacherSurfaceState
            compact
            surface="classes"
            state="partial"
            detail={classRead.truncated
              ? "The full class list reached its safety limit. No missing class is being treated as absent."
              : "The class list could not be confirmed. Previously verified class names remain in the chooser, but class changes are paused until retry succeeds."}
            onPrimaryAction={() => loadClassesRef.current?.()}
          />
        ) : !selectedClass ? (
          visibleClassList.length > 0 ? (
            <div className="report-empty-state teacher-onboard-empty">
              <strong>Choose a class</strong>
              <p>Select a class above to manage its students.</p>
            </div>
          ) : (
          <TeacherSurfaceState
            compact
            surface="classes"
            state="empty"
            onPrimaryAction={focusNewClassInput}
          />
          )
        ) : rosterRead.loading ? (
          <TeacherSurfaceState
            compact
            surface="classes"
            state="loading"
          />
        ) : rosterRead.incomplete ? (
          <TeacherSurfaceState
            compact
            surface="classes"
            state="partial"
            detail={rosterRead.reason === "truncated"
              ? "The complete student list could not be confirmed because the read reached its safety limit. No missing student is being counted as absent."
              : "The student list could not be confirmed. An empty class has not been assumed, and no roster changes are available until retry succeeds."}
            onPrimaryAction={() => {
              loadStudentsRef.current?.(selectedClassId);
              loadClassDashboardRef.current?.(selectedClassId);
            }}
          />
        ) : !rosterRead.complete ? (
          <TeacherSurfaceState
            compact
            surface="classes"
            state="loading"
          />
        ) : studentRows.length === 0 ? (
          <div className="report-empty-state teacher-onboard-empty">
            <strong>{TEACHER_COPY.roster.firstTitle(selectedClass.name)}</strong>
            <p>{TEACHER_COPY.roster.firstBody}</p>
            <button className="lp-button lp-button-primary" type="button" onClick={focusNewStudentInput}>
              {TEACHER_COPY.roster.firstAction}
            </button>
          </div>
        ) : visibleStudentRows.length === 0 ? (
          <div className="report-empty-state teacher-roster-empty-filter">
            <strong>No students match these filters</strong>
            <p>Clear the search and filters to return to the whole class.</p>
            <button
              className="lp-button lp-button-secondary"
              type="button"
              onClick={() => {
                setRosterSearch("");
                setRosterStatusFilter("all");
                setRosterFilterIds(null);
                setRosterPage(1);
                onSelectGroup?.("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
          <TeacherDataTable
            className="dashboard-table teacher-roster-table"
            label={`${selectedClass.name} students`}
          >
              <thead>
                <tr>
                  <th scope="col" aria-label="Select students">
                    <input
                      aria-label="Select all students on this page"
                      type="checkbox"
                      checked={rosterPageRows.length > 0 && selectedPageCount === rosterPageRows.length}
                      onChange={event => {
                        const visibleIds = rosterPageRows.map(row => row.id);
                        setSelectedRosterIds(previous => event.target.checked
                          ? [...new Set([...previous, ...visibleIds])]
                          : previous.filter(id => !visibleIds.includes(id)));
                      }}
                    />
                  </th>
                  <th scope="col">Display name</th>
                  {enabledRosterColumns.has("focus") && <th scope="col">Current focus</th>}
                  {enabledRosterColumns.has("progress") && <th scope="col">Progress</th>}
                  {enabledRosterColumns.has("sound-seekers") && <th scope="col">Sound Seekers</th>}
                  {enabledRosterColumns.has("login") && <th scope="col">Sign-in</th>}
                  {enabledRosterColumns.has("last-active") && <th scope="col">Last active</th>}
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rosterPageRows.map(row => {
                  const resultsAvailable = row.evidenceReadStatus === "complete";
                  const progressPercent = resultsAvailable
                    ? getProgressPercent(row, skillTotal)
                    : 0;
                  const loginReady = Boolean(row.symbol_password);
                  return (
                  <Fragment key={row.id}>
                  <tr
                    className={`${loginReady ? "login-ready" : "login-missing"}${resultsAvailable ? "" : " results-incomplete"}`}
                    data-results-status={resultsAvailable ? "complete" : "incomplete"}
                  >
                    <td data-label="Select">
                      <input
                        aria-label={`Select ${row.name}`}
                        type="checkbox"
                        checked={selectedRosterIds.includes(row.id)}
                        onChange={event => setSelectedRosterIds(previous => event.target.checked
                          ? [...new Set([...previous, row.id])]
                          : previous.filter(id => id !== row.id))}
                      />
                    </td>
                    <td data-label="Display name">
                      <div className="teacher-student-cell">
                        <StudentInitial name={row.name} />
                        <div>
                          <strong>{row.name}</strong>
                          <span>
                            {resultsAvailable
                              ? row.answered
                                ? `${row.answered} answer${row.answered === 1 ? "" : "s"}`
                                : "No scored answers yet"
                              : "Some results could not load"}
                          </span>
                        </div>
                      </div>
                    </td>
                    {enabledRosterColumns.has("focus") && <td data-label="Current focus">
                      {resultsAvailable ? (
                        <span className="teacher-focus-pill">
                          <MetricFigure metricId="current-skill" updatedAt={row.lastActive}>
                            {row.currentSkill}
                          </MetricFigure>
                        </span>
                      ) : <span className="muted-text">Results unavailable</span>}
                    </td>}
                    {enabledRosterColumns.has("progress") && <td data-label="Progress">
                      {resultsAvailable ? <div className="teacher-progress-cell">
                        <div className="teacher-progress-line">
                          <strong>
                            <MetricFigure
                              denominator={`${skillTotal} curriculum skills.`}
                              metricId="mastered"
                              updatedAt={row.lastActive}
                            >
                              {row.answered
                                ? `${progressPhrase(row.masteredCount, skillTotal)} secure`
                                : "No scored answers"}
                            </MetricFigure>
                          </strong>
                          {row.answered ? (
                            <MetricFigure
                              denominator={`${countPhrase(row.currentAnswered, "scored answer")} from the last ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`}
                              dateRange={`The last ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`}
                              metricId="accuracy"
                              updatedAt={row.currentLastActive}
                            >
                              {accuracyConclusion(row)}
                            </MetricFigure>
                          ) : null}
                        </div>
                        <div className="teacher-progress-track" aria-hidden="true">
                          <span style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div> : <span className="muted-text">Results unavailable</span>}
                    </td>}
                    {enabledRosterColumns.has("sound-seekers") && <td data-label="Sound Seekers">
                      {!resultsAvailable
                        ? <span className="muted-text">Results unavailable</span>
                        : row.soundSeekers?.sessions || row.soundSeekers?.stopsCompleted > 0 ? (
                        <div className="teacher-quest-cell">
                          <strong>
                            <MetricFigure
                              metricId="trails"
                              updatedAt={row.soundSeekers.syncedAt || row.lastActive}
                            >
                              {progressPhrase(row.soundSeekers.stopsCompleted, 40)} trails
                            </MetricFigure>
                          </strong>
                          <span>{row.soundSeekers.stonesLit} sounds lit · {row.soundSeekers.timeOnTask}</span>
                          <small>{row.soundSeekers.currentFocus?.length ? `Needs re-teaching: ${row.soundSeekers.currentFocus.slice(0, 3).join(", ")}` : "Building first sound profile"}</small>
                          <button
                            className="text-button"
                            type="button"
                            aria-expanded={heatOpenId === row.id}
                            aria-label={`${heatOpenId === row.id ? "Hide" : "Show"} ${row.name}'s sound map`}
                            onClick={() => setHeatOpenId(current => (current === row.id ? null : row.id))}
                          >
                            {heatOpenId === row.id ? "Hide sound map" : row.soundSeekers.assignment ? "Sound map · practice assigned" : "Sound map"}
                          </button>
                        </div>
                      ) : <span className="muted-text">Not started</span>}
                    </td>}
                    {enabledRosterColumns.has("login") && <td data-label="Sign-in">
                      <div className="teacher-login-cell">
                        <span className={loginReady ? "teacher-login-status ready" : "teacher-login-status missing"}>
                          {loginReady ? "Ready" : "Needs pictures"}
                        </span>
                        <div className="teacher-login-actions">
                          <button
                            className="text-button"
                            aria-label={`${loginReady ? "Change" : "Set"} sign-in pictures for ${row.name}`}
                            onClick={() => {
                              openSignInPictureEditor(row);
                            }}
                            type="button"
                          >
                            {loginReady ? "Change" : "Set pictures"}
                          </button>
                        </div>
                      </div>
                    </td>}
                    {enabledRosterColumns.has("last-active") && (
                      <td data-label="Last active">
                        {resultsAvailable
                          ? formatLastActive(row.lastActive)
                          : "Results unavailable"}
                      </td>
                    )}
                    <td data-label="Actions">
                      <div className="teacher-row-actions">
                        <button
                          className="lp-button lp-button-primary teacher-start-check"
                          onClick={() => onStartCheck?.(row)}
                          type="button"
                          aria-label={`Assess ${row.name}`}
                        >
                          Assess
                        </button>
                        <button
                          className="lp-button lp-button-secondary teacher-open-student"
                          aria-label={`Open ${row.name}`}
                          onClick={() => onLoadStudent?.(row.id, row.name)}
                          type="button"
                        >
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                  {resultsAvailable && heatOpenId === row.id && row.soundSeekers && (
                    <tr className="teacher-heat-row">
                      <td colSpan={rosterColumnCount}>
                        <QuestHeatPanel
                          report={row.soundSeekers}
                          studentName={row.name}
                          onAssign={targets => assignQuestPractice?.(row.id, targets)}
                          onClear={() => clearQuestPractice?.(row.id)}
                        />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                  );
                })}
              </tbody>
          </TeacherDataTable>
          {rosterPageCount > 1 && (
            <nav className="teacher-roster-pagination" aria-label="Student roster pages">
              <p>
                Page {currentRosterPage} of {rosterPageCount}
                <span aria-hidden="true"> · </span>
                {rosterPageStart + 1}–{Math.min(rosterPageStart + ROSTER_PAGE_SIZE, visibleStudentRows.length)} of {visibleStudentRows.length}
              </p>
              <div>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  disabled={currentRosterPage === 1}
                  onClick={() => setRosterPage(Math.max(1, currentRosterPage - 1))}
                >
                  Previous
                </button>
                {rosterPaginationItems.map(item => (
                  typeof item === "number" ? (
                    <button
                      className={item === currentRosterPage ? "is-current" : ""}
                      type="button"
                      aria-label={`Page ${item}`}
                      aria-current={item === currentRosterPage ? "page" : undefined}
                      onClick={() => setRosterPage(item)}
                      key={item}
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="teacher-roster-pagination-ellipsis"
                      key={item}
                    >
                      …
                    </span>
                  )
                ))}
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  disabled={currentRosterPage === rosterPageCount}
                  onClick={() => setRosterPage(Math.min(rosterPageCount, currentRosterPage + 1))}
                >
                  Next
                </button>
              </div>
            </nav>
          )}
          </>
        )}
      </section>

      {selectedClass && rosterRead.complete && archivedRowsForSelectedClass.length > 0 && (
        <section className="teacher-archived-roster" aria-label="Archived students">
          <details>
            <summary>{TEACHER_COPY.roster.archivedSummary(archivedRowsForSelectedClass.length)}</summary>
            <p>{TEACHER_COPY.roster.archivedHelp}</p>
            <TeacherFilterBar
              className="teacher-archived-roster-tools"
              label={TEACHER_COPY.roster.archivedSearchLabel}
            >
              <label>
                <span>{TEACHER_COPY.roster.archivedSearchLabel}</span>
                <input
                  type="search"
                  value={archivedRosterSearch}
                  onChange={event => {
                    setArchivedRosterSearch(event.target.value);
                    setArchivedRosterPage(1);
                  }}
                  placeholder={TEACHER_COPY.roster.archivedSearchPlaceholder}
                />
              </label>
              <p aria-live="polite" role="status">
                {archivedRosterView.matchingCount
                  ? TEACHER_COPY.roster.archivedShowing(
                      archivedRosterView.start + 1,
                      archivedRosterView.end,
                      archivedRosterView.matchingCount
                    )
                  : TEACHER_COPY.roster.archivedNoMatches}
              </p>
            </TeacherFilterBar>
            {archivedRosterView.matchingCount === 0 ? (
              <div className="teacher-archived-roster-empty">
                <strong>{TEACHER_COPY.roster.archivedNoMatchesTitle}</strong>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => {
                    setArchivedRosterSearch("");
                    setArchivedRosterPage(1);
                  }}
                >
                  {TEACHER_COPY.roster.archivedClearSearch}
                </button>
              </div>
            ) : (
            <ul aria-label="Matching archived students">
              {archivedRosterView.pageRows.map(row => (
                <li key={row.id}>
                  <span>
                    <strong>{row.name}</strong>
                    <small>Archived {formatLastActive(row.archived_at)}</small>
                  </span>
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    disabled={restoringStudentIds.includes(row.id)}
                    onClick={() => handleRestoreStudent(row)}
                  >
                    {restoringStudentIds.includes(row.id)
                      ? `Restoring ${row.name}…`
                      : `Restore ${row.name}`}
                  </button>
                </li>
              ))}
            </ul>
            )}
            {archivedRosterView.pageCount > 1 && (
              <nav
                className="teacher-roster-pagination teacher-archived-roster-pagination"
                aria-label="Archived student pages"
              >
                <p>
                  Page {archivedRosterView.page} of {archivedRosterView.pageCount}
                  <span aria-hidden="true"> · </span>
                  {archivedRosterView.start + 1}–{archivedRosterView.end} of {archivedRosterView.matchingCount}
                </p>
                <div>
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    disabled={archivedRosterView.page === 1}
                    onClick={() => setArchivedRosterPage(Math.max(
                      1,
                      archivedRosterView.page - 1
                    ))}
                  >
                    Previous
                  </button>
                  {archivedRosterView.paginationItems.map(item => (
                    typeof item === "number" ? (
                      <button
                        className={item === archivedRosterView.page ? "is-current" : ""}
                        type="button"
                        aria-label={`Archived page ${item}`}
                        aria-current={item === archivedRosterView.page ? "page" : undefined}
                        onClick={() => setArchivedRosterPage(item)}
                        key={item}
                      >
                        {item}
                      </button>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="teacher-roster-pagination-ellipsis"
                        key={item}
                      >
                        …
                      </span>
                    )
                  ))}
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    disabled={archivedRosterView.page === archivedRosterView.pageCount}
                    onClick={() => setArchivedRosterPage(Math.min(
                      archivedRosterView.pageCount,
                      archivedRosterView.page + 1
                    ))}
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </details>
        </section>
      )}

      {showQuestionGuide && (
        <QuestionTypeGuideDialog
          query={questionGuideSearch}
          onQueryChange={setQuestionGuideSearch}
          onClose={() => setShowQuestionGuide(false)}
        />
      )}

      {accessibilityStudent && (
        <LearnerAccessibilityDialog
          key={accessibilityStudent.id}
          student={accessibilityStudent}
          saving={savingAccessibilityIds.includes(accessibilityStudent.id)}
          onSave={handleAccessibilitySettings}
          onClose={() => setAccessibilityStudent(null)}
        />
      )}

      {actionsStudent && (
        <TeacherModal
          className="teacher-student-actions-modal"
          label={`Options for ${actionsStudent.name}`}
          onClose={() => setActionsStudent(null)}
        >
          <div className="symbol-password-modal-card page-stack">
            <header>
              <p className="panel-label">Student information</p>
              <h3>{actionsStudent.name}</h3>
              <p>Choose one task. Each task opens in its own focused window.</p>
            </header>
            {studentActionError && (
              <p className="teacher-inline-error" role="alert">{studentActionError}</p>
            )}
            <div className="teacher-student-action-list">
              <section className="teacher-student-action-group" aria-labelledby="student-detail-actions">
                <h4 id="student-detail-actions">Student details</h4>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => openStudentProfile(actionsStudent)}
                >
                  Edit student information
                </button>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => {
                    openSignInPictureEditor(actionsStudent);
                    setActionsStudent(null);
                  }}
                >
                  {actionsStudent.symbol_password ? "Change sign-in pictures" : "Set sign-in pictures"}
                </button>
                {actionsStudent.symbol_password && (
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => {
                      openRosterOperation("reset-sign-in", actionsStudent);
                      setActionsStudent(null);
                    }}
                  >
                    Reset sign-in pictures
                  </button>
                )}
              </section>

              <section className="teacher-student-action-group" aria-labelledby="student-support-actions">
                <h4 id="student-support-actions">Learning support</h4>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => {
                    const student = actionsStudent;
                    setActionsStudent(null);
                    onOpenElFormalCheck?.(student);
                  }}
                >
                  EL assessment
                </button>
                <button
                  className="lp-button lp-button-secondary teacher-choice-mode-toggle"
                  type="button"
                  aria-pressed={actionsStudent.reducedChoiceMode}
                  disabled={savingChoiceModeIds.includes(actionsStudent.id)}
                  onClick={async () => {
                    const student = actionsStudent;
                    setStudentActionError("");
                    const saved = await handleReducedChoiceMode(student);
                    if (saved) {
                      setActionsStudent(null);
                      return;
                    }
                    setStudentActionError(
                      "We couldn't change this student's navigation choices. Nothing changed. Try again."
                    );
                  }}
                >
                  {actionsStudent.reducedChoiceMode ? "Use all student choices" : "Reduce student choices"}
                </button>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => {
                    setAccessibilityStudent(actionsStudent);
                    setActionsStudent(null);
                  }}
                >
                  Accessibility settings
                </button>
              </section>

              <section className="teacher-student-action-group teacher-student-record-actions" aria-labelledby="student-record-actions">
                <h4 id="student-record-actions">Class and records</h4>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => {
                    setDataRightsStudent(actionsStudent);
                    setActionsStudent(null);
                  }}
                >
                  Privacy and data rights
                </button>
                {visibleClassList.length > 1 && (
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => {
                      openRosterOperation("transfer", actionsStudent);
                      setActionsStudent(null);
                    }}
                  >
                    Move to another class…
                  </button>
                )}
                <button
                  className="lp-button lp-button-danger-outline"
                  type="button"
                  onClick={() => {
                    const student = actionsStudent;
                    setActionsStudent(null);
                    onResetCheckData?.(student);
                  }}
                >
                  Reset assessment data
                </button>
                <button
                  className="lp-button lp-button-danger-outline"
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    openRosterOperation("archive", actionsStudent);
                    setActionsStudent(null);
                  }}
                >
                  Archive student…
                </button>
                {/* Archiving is the safe default and stays first. Deleting is the
                    answer to "I typed the name wrong", so it has to exist — but it
                    is last, marked permanent, and routed through the same audited
                    deletion the privacy workflow uses. */}
                <button
                  className="lp-button lp-button-danger"
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    openRosterOperation("delete", actionsStudent);
                    setActionsStudent(null);
                  }}
                >
                  Delete student…
                </button>
                <p className="muted-text">
                  Deleting is permanent. Archive instead to keep everything this student has done.
                </p>
              </section>
            </div>
            <footer className="teacher-dialog-footer">
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => setActionsStudent(null)}
              >
                Close
              </button>
            </footer>
          </div>
        </TeacherModal>
      )}

      <LearnerDataRightsDialog
        key={dataRightsStudent?.id || "closed-data-rights"}
        client={supabase}
        learner={dataRightsStudent}
        open={Boolean(dataRightsStudent)}
        onClose={() => setDataRightsStudent(null)}
        onDeleted={handleDataRightsDeletion}
      />

      {editingStudentProfile && (
        <TeacherModal
          className="teacher-student-profile-modal"
          label={`Edit ${editingStudentProfile.name}`}
          onClose={savingStudentProfile ? undefined : () => setEditingStudentProfile(null)}
        >
          <form className="page-stack" onSubmit={saveStudentProfile}>
            <header>
              <p className="panel-label">Student information</p>
              <h3>Edit display name</h3>
              <p>Use the classroom name the student and staff already recognise. Do not add a surname unless your school requires it.</p>
            </header>
            <label>
              <span>Display name</span>
              <input
                autoFocus
                maxLength={80}
                value={studentNameDraft}
                disabled={savingStudentProfile}
                onChange={event => {
                  setStudentNameDraft(event.target.value);
                  setStudentProfileError("");
                }}
              />
            </label>
            {studentProfileError && (
              <p className="teacher-inline-error" role="alert">{studentProfileError}</p>
            )}
            <footer className="teacher-dialog-footer">
              <button
                className="lp-button lp-button-primary"
                type="submit"
                disabled={savingStudentProfile}
              >
                {savingStudentProfile ? "Saving…" : "Save student information"}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={savingStudentProfile}
                onClick={() => setEditingStudentProfile(null)}
              >
                Cancel
              </button>
            </footer>
          </form>
        </TeacherModal>
      )}

      {rosterOperation && (
        <TeacherModal
          className="teacher-roster-operation-modal"
          label={rosterOperation.kind === "archive"
            ? `Archive ${operationStudent.name}`
            : rosterOperation.kind === "delete"
              ? `Delete ${operationStudent.name} permanently`
              : rosterOperation.kind === "reset-sign-in"
                ? `Reset sign-in pictures for ${operationStudent.name}`
              : `Move ${operationStudent.name} to another class`}
          onClose={() => {
            if (operationBusy) return;
            closeRosterOperation();
          }}
        >
          <div className="symbol-password-modal-card">
            <h3>
              {rosterOperation.kind === "archive"
                ? `Archive ${operationStudent.name}?`
                : rosterOperation.kind === "delete"
                  ? `Delete ${operationStudent.name} permanently?`
                  : rosterOperation.kind === "reset-sign-in"
                    ? `Reset sign-in pictures for ${operationStudent.name}?`
                  : `Move ${operationStudent.name} to another class?`}
            </h3>
            {rosterOperation.kind === "archive" && (
              <>
                <p>
                  Archiving takes {operationStudent.name} off the class roster and stops them signing in.
                </p>
                <p>
                  Nothing is deleted. Everything {operationStudent.name} has already done is kept, and
                  you can restore them at any time from Archived students at the bottom of this page.
                </p>
              </>
            )}
            {rosterOperation.kind === "delete" && (
              <>
                {operationEvidenceComplete ? (
                  <p>
                    The roster currently shows {operationSavedSummary}. Permanent deletion also
                    removes any reports, assessment records, progress, activity and sign-in pictures
                    saved for {operationStudent.name}. It cannot be undone.
                  </p>
                ) : (
                  <p>
                    Saved-result totals are still loading or unavailable. Permanent deletion removes
                    {operationStudent.name}'s student record and any saved results, reports, assessment
                    records, progress, activity and sign-in pictures. It cannot be undone.
                  </p>
                )}
                <p>
                  Archive {operationStudent.name} instead to take them off the roster and keep
                  everything they have done.
                </p>
                <p>
                  A minimal record of the deletion request is kept so the school can show that
                  the request was completed.
                </p>
                <label className="teacher-dashboard-control">
                  <span>Type {operationStudent.name} to confirm</span>
                  <input
                    autoComplete="off"
                    value={deleteConfirmName}
                    disabled={operationBusy}
                    onChange={event => setDeleteConfirmName(event.target.value)}
                  />
                </label>
              </>
            )}
            {rosterOperation.kind === "transfer" && (
              <>
                <p>
                  {operationStudent.name} moves to the new class. Their individual progress and
                  saved work stay with them.
                </p>
                <p>
                  Earlier class reports and class activity stay with the class where they were
                  recorded. Their current sign-in ends, so they must sign in again through the new
                  class.
                </p>
                <label className="teacher-dashboard-control">
                  <span>Destination class</span>
                  <select
                    value={operationTargetClassId}
                    onChange={event => setOperationTargetClassId(event.target.value)}
                  >
                    <option value="">Choose another class</option>
                    {visibleClassList.filter(row => row.id !== selectedClassId).map(row => (
                      <option key={row.id} value={row.id}>{row.name}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {rosterOperation.kind === "reset-sign-in" && (
              <>
                <p>
                  {operationStudent.name} will not be able to sign in with their current pictures.
                </p>
                <p>
                  Nothing else is changed. Set new sign-in pictures before their next sign-in.
                </p>
              </>
            )}
            {operationError && (
              <p className="teacher-inline-error" role="alert">{operationError}</p>
            )}
            <div className="teacher-roster-operation-actions">
              <button
                className={rosterOperation.kind === "delete"
                  ? "lp-button lp-button-danger"
                  : rosterOperation.kind === "archive" || rosterOperation.kind === "reset-sign-in"
                    ? "lp-button lp-button-danger-outline"
                    : "lp-button lp-button-primary"}
                type="button"
                disabled={operationBusy
                  || (rosterOperation.kind === "transfer" && !operationTargetClassId)
                  || (rosterOperation.kind === "delete" && !deleteConfirmReady)}
                onClick={confirmRosterOperation}
              >
                {operationBusy
                  ? (rosterOperation.kind === "delete"
                      ? "Deleting…"
                      : rosterOperation.kind === "reset-sign-in"
                        ? "Resetting…"
                        : "Saving…")
                  : rosterOperation.kind === "archive"
                    ? `Yes, archive ${operationStudent.name}`
                    : rosterOperation.kind === "delete"
                      ? `Yes, delete ${operationStudent.name} permanently`
                      : rosterOperation.kind === "reset-sign-in"
                        ? `Yes, reset ${operationStudent.name}'s sign-in pictures`
                      : `Yes, move ${operationStudent.name}`}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={operationBusy}
                onClick={closeRosterOperation}
              >
                Cancel
              </button>
            </div>
          </div>
        </TeacherModal>
      )}

      {editingStudent && (
        <TeacherModal
          label={`Change sign-in pictures for ${editingStudent.name}`}
          onClose={closeSignInPictureEditor}
        >
          <div className="symbol-password-modal-card">
            <h3>Change sign-in pictures for {editingStudent.name}</h3>
            <p className="muted-text">Picture sign-in only gets the right student to their own work, so you can see and change these pictures at any time. Your teacher account is what keeps class information private.</p>
            <p className="teacher-sign-in-picture-instruction">
              <strong>Choose three pictures in order.</strong> They save after you choose the third one.
            </p>
            <p className="muted-text" role="status" aria-live="polite">
              {editingSequence.length < 3
                ? `Choose picture ${editingSequence.length + 1} of 3.`
                : "All three pictures chosen. Saving…"}
            </p>
            <SymbolPasswordPad
              value={editingSequence}
              disabled={savingSignInPictures}
              label={`Choose three sign-in pictures in order for ${editingStudent.name}`}
              onChange={sequence => {
                setEditingSequence(sequence);
                setSignInPictureError("");
              }}
              onComplete={saveSignInPictures}
            />
            {savingSignInPictures && (
              <p className="muted-text" role="status">Saving sign-in pictures…</p>
            )}
            {signInPictureError && (
              <p className="teacher-inline-error" role="alert">{signInPictureError}</p>
            )}
            <button
              className="report-button"
              disabled={savingSignInPictures}
              onClick={closeSignInPictureEditor}
              type="button"
            >
              Cancel
            </button>
          </div>
        </TeacherModal>
      )}

      </>
    </TeacherPageShell>
  );
}
