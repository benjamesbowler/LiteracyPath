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
import { LEARNING_EVIDENCE_POLICY } from "../policy/learningPolicy.js";
import {
  deleteRosterStudent,
  describeRosterOperationError,
  findDuplicateRosterName,
  insertRosterStudents,
  normalizeRosterStudentName,
  setRosterStudentArchived,
  transferRosterStudent
} from "../data/teacherRosterOperations.js";
import { TeacherActivitySyncHealth } from "./teacher/TeacherActivitySyncHealth.jsx";
import { LearnerDataRightsDialog } from "./teacher/LearnerDataRightsDialog.jsx";
import { TeacherRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { ActionFeedback } from "./ActionFeedback.jsx";
import { MetricFigure } from "./MetricDefinition.jsx";
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
import { metricDefinitionText } from "../utils/metricDefinitions.js";
import {
  LearnerAccessibilityDialog,
  QuestionTypeGuideDialog,
  RosterMetric,
  StudentInitial,
  TeacherSetupChecklist
} from "./teacher/TeacherClassParts.jsx";
import {
  accuracyConclusion,
  formatLastActive,
  getProgressPercent,
  latestMetricUpdate,
  needsSupportConclusion,
  useTeacherSetupState,
  useTeacherStudentRows
} from "./teacher/teacherClassModel.js";
import { supabase } from "../supabaseClient.js";
import { clearLocalElAssessmentDataForStudent } from "../utils/elAssessmentReset.js";
import { clearLocalProgressForStudent } from "../utils/progressSync.js";
import {
  TEACHER_COPY,
  countPhrase,
  progressPhrase
} from "../copy/teacherCopy.js";
import logoUrl from "../assets/logo.svg";

const ROSTER_COLUMN_OPTIONS = [
  { id: "focus", label: "Focus" },
  { id: "progress", label: "Progress" },
  { id: "sound-seekers", label: "Sound Seekers" },
  { id: "login", label: "Sign-in" },
  { id: "last-active", label: "Last active" }
];
// "login" (the Sign-in column) is back in the defaults: it carries the only
// per-student control that lets a class sign in at all, so hiding it behind the
// column picker made a brand-new class unusable.
const DEFAULT_ROSTER_COLUMNS = ["focus", "progress", "login", "last-active"];

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

function LoginCardPrintRoute({
  rows,
  schoolName,
  className,
  classCode,
  onClose
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
    <section
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
        <div className="teacher-login-card-route-actions">
          <button className="lp-button lp-button-secondary" type="button" onClick={onClose}>
            Return to roster
          </button>
          <button className="lp-button lp-button-primary" type="button" onClick={printCards}>
            Print cards
          </button>
        </div>
      </header>
      <ActionFeedback className="teacher-login-card-feedback" feedback={printFeedback} />
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
    </section>
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
function QuestHeatPanel({ report, studentName, onAssign, onClear }) {
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [packNote, setPackNote] = useState("");
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
    const saved = await onAssign?.(selected);
    setBusy(false);
    if (saved) setSelected([]);
  }

  async function clear() {
    if (busy) return;
    setBusy(true);
    await onClear?.();
    setBusy(false);
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
      setPackNote(error.message || "Could not build that pack.");
    }
  }

  if (!tiles.length) return <p className="muted-text">No sound map yet — the trail builds one from the first session.</p>;

  const counts = report?.buckets || {};
  return (
    <div className="quest-heat-panel">
      <div className="quest-heat-head">
        <strong>{studentName}&rsquo;s sounds</strong>
        <span className="quest-heat-legend" aria-hidden="true">
          <em className="is-got-it">Got it {counts.gotIt ?? 0}</em>
          <em className="is-almost">Almost there {counts.almostThere ?? 0}</em>
          <em className="is-reteach">Needs re-teaching {counts.needsReteaching ?? 0}</em>
          <em className="is-unseen">Not met yet</em>
        </span>
      </div>
      <div className="quest-heat-grid" role="group" aria-label={`Sound mastery for ${studentName}. Tap sounds to build a practice assignment.`}>
        {tiles.map(tile => (
          <button
            key={tile.id}
            type="button"
            className={`quest-heat-tile is-${tile.bucket}${selected.includes(tile.id) ? " is-selected" : ""}`}
            title={tile.bucket === "unseen"
              ? `${tile.label} · ${tile.stopName} · not met yet`
              : metricDefinitionText("accuracy", {
                  label: `${tile.label} · ${tile.stopName} accuracy`,
                  denominator: `${tile.seen} scored Sound Seekers response${tile.seen === 1 ? "" : "s"} for this sound.`,
                  dateRange: "All saved Sound Seekers play for this student.",
                  minimumEvidence: "At least one scored answer for this sound.",
                  updatedAt: tile.lastActiveAt || report?.lastActiveAt
                })}
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
  selectedClassId,
  setSelectedClassId,
  setStudentList,
  studentList = [],
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
  surfaceState = "",
  surfaceStateDetail = "",
  onSurfaceStatePrimary,
  onSurfaceStateSecondary,
  activitySyncHealthSeedRows = null
}) {
  const [newStudentName, setNewStudentName] = useState("");
  const [showRosterImport, setShowRosterImport] = useState(false);
  const [rosterImportText, setRosterImportText] = useState("");
  const [rosterImportPreview, setRosterImportPreview] = useState(null);
  const [importingRoster, setImportingRoster] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterSort, setRosterSort] = useState("name");
  const [rosterStatusFilter, setRosterStatusFilter] = useState("all");
  const [visibleRosterColumns, setVisibleRosterColumns] = useState(
    () => loadVisibleRosterColumns(teacherId)
  );
  const [selectedRosterIds, setSelectedRosterIds] = useState([]);
  const [loginCardRows, setLoginCardRows] = useState([]);
  const [assigningSignIn, setAssigningSignIn] = useState(false);
  const [rosterOperation, setRosterOperation] = useState(null);
  const [operationTargetClassId, setOperationTargetClassId] = useState("");
  const [operationBusy, setOperationBusy] = useState(false);
  // The confirm dialog covers the page banner, so a failure has to be readable
  // inside the dialog itself. This is the state that used to not exist at all:
  // a rejected promise left the dialog open and said nothing.
  const [operationError, setOperationError] = useState("");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [duplicateNameConfirm, setDuplicateNameConfirm] = useState("");
  const [rosterOperationStatus, setRosterOperationStatus] = useState("");
  const [rosterFilterIds, setRosterFilterIds] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [actionsStudent, setActionsStudent] = useState(null);
  const [editingStudentProfile, setEditingStudentProfile] = useState(null);
  const [studentNameDraft, setStudentNameDraft] = useState("");
  const [studentProfileError, setStudentProfileError] = useState("");
  const [savingStudentProfile, setSavingStudentProfile] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingSequence, setEditingSequence] = useState("");
  const [heatOpenId, setHeatOpenId] = useState(null);
  const [showQuestionGuide, setShowQuestionGuide] = useState(false);
  const [questionGuideSearch, setQuestionGuideSearch] = useState("");
  const [rosterAdminOpen, setRosterAdminOpen] = useState(true);
  const [savingChoiceModeIds, setSavingChoiceModeIds] = useState([]);
  const [savingAccessibilityIds, setSavingAccessibilityIds] = useState([]);
  const [accessibilityStudent, setAccessibilityStudent] = useState(null);
  const [dataRightsStudent, setDataRightsStudent] = useState(null);
  const loadStudentsRef = useRef(loadStudents);
  const loadClassDashboardRef = useRef(loadClassDashboard);
  const newClassInputRef = useRef(null);
  const newStudentInputRef = useRef(null);
  function focusNewClassInput() {
    newClassInputRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    newClassInputRef.current?.focus?.();
  }
  function focusNewStudentInput() {
    newStudentInputRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    newStudentInputRef.current?.focus?.();
  }
  function openStudentProfile(student) {
    setActionsStudent(null);
    setEditingStudentProfile(student);
    setStudentNameDraft(student?.name || "");
    setStudentProfileError("");
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
    const saved = await updateStudentName?.(editingStudentProfile.id, cleanName);
    setSavingStudentProfile(false);
    if (!saved) {
      setStudentProfileError("We couldn't save this change. Check the message above and try again.");
      return;
    }
    setEditingStudentProfile(null);
    setStudentNameDraft("");
  }
  function openQuestionGuide() {
    setQuestionGuideSearch("");
    setShowQuestionGuide(true);
  }
  // Deleting a student has to clear this device too, or the child's saved work
  // reappears from local storage the next time the app syncs.
  async function forgetStudentOnThisDevice(learner) {
    clearLocalProgressForStudent(learner.id);
    await clearLocalElAssessmentDataForStudent({
      teacherId: learner.teacher_id || teacherId,
      studentId: learner.id,
      studentName: learner.name
    });
    setStudentList?.(previous => previous.filter(row => row.id !== learner.id));
    if (selectedStudentId === learner.id) onClearStudent?.();
  }
  async function handleDataRightsDeletion(learner) {
    await forgetStudentOnThisDevice(learner);
    setDataRightsStudent(null);
    setRosterOperationStatus(
      `${learner.name}'s data was deleted. The privacy-safe request reference remains in the audit log.`
    );
    if (selectedClassId) {
      await loadStudentsRef.current?.(selectedClassId);
      await loadClassDashboardRef.current?.(selectedClassId);
    }
  }
  const selectedClass = classList.find(row => row.id === selectedClassId) || null;
  const studentRows = useTeacherStudentRows({ studentList, classDashboard });
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
      studentIds: studentRows.filter(row => row.answered === 0).map(row => row.id)
    },
    {
      id: "active-today",
      label: TEACHER_COPY.groups.playedToday,
      studentIds: studentRows
        .filter(row => formatLastActive(row.lastActive) === "Today")
        .map(row => row.id)
    }
  ], [studentRows]);
  const selectedRosterGroup = rosterGroups.find(group => group.id === selectedGroupId) || rosterGroups[0];
  const selectedStudentRow = studentRows.find(row => row.id === selectedStudentId) || null;
  // ── Action cards: turn roster data into one-click next steps ──────────────
  const actionCards = useMemo(() => {
    const cards = [];

    // Reteach: 2+ students stuck on the same skill with low accuracy.
    const struggling = studentRows.filter(row =>
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
          evidence: `${reteachNames} have enough saved results to compare, with accuracy below ${LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum}% on ${reteach[0]}.`,
          dependency: `${reteach[0]} is their current recorded focus and should be secured before dependent practice advances.`,
          confidence: `${countPhrase(reteach[1].length, "student", "students")} meet the minimum-results and recency rules; individual results remain available for review.`,
          unlock: "A focused re-teach creates a shared practice target and a clear point for the next check."
        },
        action: "Show group",
        studentIds: reteach[1].map(row => row.id)
      });
    }

    // Nudge: students who haven't started or have gone quiet.
    const inactive = studentRows.filter(row => row.answered === 0 || !row.lastActive || formatLastActive(row.lastActive).includes("days ago"));
    if (inactive.length >= 1 && studentRows.length > 1) {
      const inactiveNames = `${inactive.map(row => row.name).slice(0, 4).join(", ")}${inactive.length > 4 ? ` +${inactive.length - 4}` : ""}`;
      const notStartedCount = inactive.filter(row => row.answered === 0).length;
      cards.push({
        id: "nudge",
        tone: "info",
        title: inactive.some(row => row.answered === 0) ? "Get everyone started" : "Re-engage quiet readers",
        detail: `${inactiveNames} ${inactive.length === 1 ? "has" : "have"} little or no recent practice.`,
        explanation: {
          evidence: `${inactiveNames}: ${notStartedCount} ${notStartedCount === 1 ? "student has" : "students have"} no scored answers; the rest have no recent saved activity.`,
          dependency: "Current practice results are needed before the app can suggest a next teaching step.",
          confidence: "This is an activity-coverage signal only; it does not infer low attainment.",
          unlock: "New answers create enough current results to support a next-skill decision."
        },
        action: "Show students",
        studentIds: inactive.map(row => row.id)
      });
    }

    // Celebrate: the strongest mastery in the class.
    const star = [...studentRows].filter(row => row.masteredCount > 0).sort((a, b) => b.masteredCount - a.masteredCount)[0];
    if (star) {
      cards.push({
        id: "celebrate",
        tone: "good",
        title: `Celebrate ${star.name}`,
        detail: `${star.masteredCount} skill${star.masteredCount === 1 ? "" : "s"} mastered - worth a shout-out today.`,
        explanation: {
          evidence: `${star.name} has ${star.masteredCount} recorded mastered skill${star.masteredCount === 1 ? "" : "s"}, the highest current total in this class.`,
          dependency: "Recognition follows a saved milestone; the private comparison never labels or ranks students publicly.",
          confidence: star.learningConclusion?.ready
            ? `${star.learningConclusion.confidence.label}: ${star.learningConclusion.confidence.detail}.`
            : "The recommendation relies on the mastery record only; no current accuracy conclusion is inferred.",
          unlock: "A private or class-appropriate celebration reinforces secured learning and opens a positive check-in."
        },
        action: "Open profile",
        onClick: () => onLoadStudent?.(star.id, star.name)
      });
    }

    return cards.slice(0, 3);
  }, [studentRows, onLoadStudent]);

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
      if (rosterStatusFilter === "not-started") return row.answered === 0;
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
  const selectedVisibleCount = visibleStudentRows.filter(row => selectedRosterIds.includes(row.id)).length;
  const enabledRosterColumns = new Set(visibleRosterColumns);
  const rosterColumnCount = 3 + visibleRosterColumns.length;

  // Scale the friction to what is actually being destroyed. A student with
  // nothing saved needs one clear confirmation; a student with a term of saved
  // work needs to be named before the button will work.
  const operationStudent = rosterOperation?.student || null;
  const operationSavedAnswers = Number(operationStudent?.answered) || 0;
  const operationQuestStops = Number(operationStudent?.soundSeekers?.stopsCompleted) || 0;
  const operationHasSavedResults = operationSavedAnswers > 0 || operationQuestStops > 0;
  const operationSavedSummary = [
    operationSavedAnswers > 0 ? countPhrase(operationSavedAnswers, "saved answer") : "",
    operationQuestStops > 0 ? countPhrase(operationQuestStops, "Sound Seekers stop") : ""
  ].filter(Boolean).join(" and ");
  const deleteConfirmReady = !operationHasSavedResults
    || (Boolean(operationStudent) && normalizeRosterStudentName(deleteConfirmName).toLowerCase()
      === normalizeRosterStudentName(operationStudent.name).toLowerCase());

  function openRosterOperation(kind, student) {
    setOperationError("");
    setDeleteConfirmName("");
    setOperationTargetClassId("");
    setRosterOperation({ kind, student });
  }

  const skillTotal = skillTree.length;
  const startedCount = studentRows.filter(row => row.answered > 0).length;
  const loginReadyCount = studentRows.filter(row => row.symbol_password).length;
  const activeTodayCount = studentRows.filter(row => formatLastActive(row.lastActive) === "Today").length;
  const classAccuracySummary = useMemo(
    () => buildClassAccuracySummary(studentRows.map(row => ({
      ...row,
      conclusion: row.learningConclusion
    }))),
    [studentRows]
  );
  const classMetricUpdatedAt = latestMetricUpdate(studentRows.map(row => row.lastActive));
  const className = selectedClass?.name || "No class selected";
  const {
    hasSetupClass,
    setupSteps,
    showSetupChecklist,
    studentsMissingSignIn
  } = useTeacherSetupState({ selectedClass, selectedClassId, studentRows });

  useEffect(() => {
    loadStudentsRef.current = loadStudents;
    loadClassDashboardRef.current = loadClassDashboard;
  }, [loadStudents, loadClassDashboard]);

  useEffect(() => {
    if (!selectedClassId) return;
    loadStudentsRef.current?.(selectedClassId);
    loadClassDashboardRef.current?.(selectedClassId);
  }, [selectedClassId]);

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
    setSelectedClassId?.(nextClassId);
    setStudentList?.([]);
    // A pending "press Add student again" warning belongs to the class it was
    // raised in; carrying it across classes would wave a second click through.
    setDuplicateNameConfirm("");
  }

  // A double-click on Add student used to create a second identical student in
  // silence — which is how a roster ends up with two Aarons. Two real children
  // can share a name, so this warns once and then trusts the teacher.
  async function handleCreateStudent() {
    const clean = normalizeRosterStudentName(newStudentName);
    if (!clean) return;
    const duplicate = findDuplicateRosterName(clean, [...studentRows, ...archivedStudentList]);
    if (duplicate && duplicateNameConfirm !== clean.toLowerCase()) {
      setDuplicateNameConfirm(clean.toLowerCase());
      const isArchived = archivedStudentList.some(row => row.id === duplicate.id);
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
    await createStudent?.(clean);
    setNewStudentName("");
  }

  async function handleReducedChoiceMode(row) {
    if (!setReducedChoiceMode || savingChoiceModeIds.includes(row.id)) return;
    setSavingChoiceModeIds(ids => [...ids, row.id]);
    try {
      await setReducedChoiceMode(row.id, !row.reducedChoiceMode);
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
    setRosterAdminOpen(true);
    await createClass?.();
  }

  function reviewRosterImport(names) {
    const existingNames = new Set(studentRows.map(row => row.name.trim().toLowerCase()));
    const seenNames = new Set();
    const accepted = [];
    const duplicates = [];
    for (const rawName of names) {
      const name = String(rawName || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (existingNames.has(key)) {
        duplicates.push({ name, reason: "Already in this class" });
      } else if (seenNames.has(key)) {
        duplicates.push({ name, reason: "Repeated in this import" });
      } else {
        seenNames.add(key);
        accepted.push(name);
      }
    }
    setRosterImportPreview({ total: accepted.length + duplicates.length, accepted, duplicates });
  }

  async function handleCsvFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const names = parseCsvNames(await file.text());
    setRosterImportText(names.join("\n"));
    reviewRosterImport(names);
    event.target.value = "";
  }

  async function handleImportStudents() {
    const names = rosterImportPreview?.accepted || [];
    if (!names.length || importingRoster) return;
    if (names.length > 40 || !teacherId || !selectedClassId) {
      setRosterOperationStatus("Import up to 40 students into a selected class.");
      return;
    }
    setImportingRoster(true);
    try {
      const { error } = await insertRosterStudents({
        supabase,
        names,
        classId: selectedClassId,
        teacherId
      });
      if (error) {
        console.error("Roster import error:", error);
        setRosterOperationStatus("We couldn't import that class list. No students were added.");
        return;
      }
      await loadStudents?.(selectedClassId);
      await loadClassDashboard?.(selectedClassId);
      setRosterOperationStatus(`${countPhrase(names.length, "student", "students")} imported. Set sign-in pictures next.`);
      setRosterImportText("");
      setRosterImportPreview(null);
      setShowRosterImport(false);
    } finally {
      setImportingRoster(false);
    }
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
      setEditingStudent(learner);
      setEditingSequence("");
      return;
    }
    if (stepId === "sign-in-all") {
      setRosterAdminOpen(true);
      giveEveryoneSignInPictures();
      return;
    }
    if (stepId === "check") {
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
    if (setupFocus !== "class" && selectedClassId && studentRows.length === 0) return undefined;
    const frame = window.requestAnimationFrame(() => {
      handleSetupContinue(setupFocus);
      onSetupFocusHandled?.();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupFocus, selectedClassId, studentRows.length]);

  async function handleCreateDemo() {
    if (creatingDemo) return;
    setCreatingDemo(true);
    setRosterAdminOpen(true);
    try {
      await createDemoClass?.();
    } finally {
      setCreatingDemo(false);
    }
  }

  function openLoginCardPreview(rows) {
    setLoginCardRows(rows.filter(row => row.symbol_password));
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
      if (result && result.saved === 0) return;
      const assignedById = new Map(assignments.map(item => [item.student.id, item.sequence]));
      openLoginCardPreview(studentRows.map(row => (
        row.symbol_password
          ? row
          : { ...row, symbol_password: assignedById.get(row.id) || "" }
      )));
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
          setRosterOperationStatus({
            kind: "undo",
            message: `${student.name} archived. Their saved results remain, and you can restore them at any time.`,
            actionLabel: `Undo archive for ${student.name}`,
            onAction: () => handleRestoreStudent(student)
          });
        }
      } else if (kind === "delete") {
        await deleteRosterStudent({ supabase, studentId: student.id });
        await forgetStudentOnThisDevice(student);
        saved = true;
        setRosterOperationStatus({
          kind: "success",
          message: `${student.name} was deleted permanently. Nothing of theirs is kept.`
        });
      } else if (kind === "transfer") {
        const targetClass = classList.find(row => row.id === operationTargetClassId);
        const { error } = await transferRosterStudent({
          supabase,
          studentId: student.id,
          sourceClassId: selectedClassId,
          targetClassId: operationTargetClassId
        });
        failure = error;
        saved = !error;
        if (saved) {
          setRosterOperationStatus(
            `${student.name} moved to ${targetClass?.name || "the chosen class"}. Their saved results moved too.`
          );
        }
      }

      if (!saved) {
        reportRosterFailure(failure, kind, student);
        return;
      }
      if (selectedStudentId === student.id) onClearStudent?.();
      await loadStudents?.(selectedClassId);
      await loadClassDashboard?.(selectedClassId);
      setSelectedRosterIds(previous => previous.filter(id => id !== student.id));
      closeRosterOperation();
    } catch (error) {
      reportRosterFailure(error, kind, student);
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleRestoreStudent(row) {
    try {
      const { error } = await setRosterStudentArchived({
        supabase,
        studentId: row.id,
        classId: selectedClassId,
        archived: false
      });
      if (error) {
        reportRosterFailure(error, "restore", row);
        return;
      }
      await loadStudents?.(selectedClassId);
      await loadClassDashboard?.(selectedClassId);
      setRosterOperationStatus(`${row.name} restored to the class roster.`);
    } catch (error) {
      reportRosterFailure(error, "restore", row);
    }
  }

  if (loginCardRows.length > 0) {
    return (
      <LoginCardPrintRoute
        rows={loginCardRows}
        schoolName={schoolName}
        className={selectedClass?.name}
        classCode={selectedClass?.access_code}
        onClose={() => setLoginCardRows([])}
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
        description={selectedClass
          ? TEACHER_COPY.classes.descriptionWithClass(selectedClass.name)
          : TEACHER_COPY.classes.descriptionWithoutClass}
      >
        <div
          className="teacher-dashboard-context"
          aria-label={TEACHER_COPY.classes.contextLabel}
        >
          <span>School</span>
          <strong>{hasSchool ? schoolName : "Not set"}</strong>
          <small>
            {selectedClass
              ? TEACHER_COPY.classes.childCount(studentRows.length)
              : className}
          </small>
        </div>
      </TeacherPageHeader>

      <ActionFeedback className="teacher-dashboard-message" message={message} />
      <ActionFeedback className="teacher-dashboard-message" feedback={rosterOperationStatus} />

      {surfaceState ? (
        <TeacherSurfaceState
          surface="classes"
          state={surfaceState}
          detail={surfaceStateDetail}
          onPrimaryAction={onSurfaceStatePrimary}
          onSecondaryAction={onSurfaceStateSecondary}
        />
      ) : (
      <>
      {showSetupChecklist && (
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
            <select value={selectedClassId || ""} onChange={handleClassChange}>
              <option value="">Choose class</option>
              {classList.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="teacher-dashboard-create teacher-dashboard-control-group">
          <label className="teacher-dashboard-control">
            <span>New class</span>
            <input
              ref={newClassInputRef}
              autoComplete="off"
              value={newClassName}
              placeholder="Enter class name"
              onChange={event => setNewClassName?.(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") handleCreateClass();
              }}
            />
          </label>
          <button className="lp-button lp-button-primary" onClick={handleCreateClass} type="button">
            Create class
          </button>
        </div>
      </section>

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

      {selectedClass && (
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
            value={progressPhrase(startedCount, studentRows.length || 0)}
          />
          <div className="teacher-roster-metric teacher-roster-metric-accuracy">
            <span>{TEACHER_COPY.metrics.classAccuracy}</span>
            <strong>
              {classAccuracySummary.comparability.comparable
                ? `${classAccuracySummary.learnerWeightedAccuracy}%`
                : TEACHER_COPY.metrics.notEnough}
            </strong>
            <details>
              <summary>See both averages</summary>
              <dl>
                <div>
                  <dt>{TEACHER_COPY.metrics.equalChildren}</dt>
                  <dd>
                    <MetricFigure
                      metricId="accuracy"
                      denominator={`${countPhrase(classAccuracySummary.policyReadyLearnerCount, "student", "students")} with at least ${PROGRESS_MIN_RESPONSES} scored answers each.`}
                      dateRange="All saved scored answers for this class."
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
                      dateRange="All saved scored answers for this class."
                      updatedAt={classMetricUpdatedAt}
                    >
                      {classAccuracySummary.responseWeightedAccuracy === null
                        ? TEACHER_COPY.metrics.notEnough
                        : `${classAccuracySummary.responseWeightedAccuracy}%`}
                    </MetricFigure>
                  </dd>
                </div>
              </dl>
            </details>
          </div>
          <RosterMetric
            definitionId="active"
            definitionOptions={{
              denominator: `${countPhrase(studentRows.length, "student", "students")} in this class.`,
              updatedAt: classMetricUpdatedAt
            }}
            label={TEACHER_COPY.metrics.playedToday}
            value={progressPhrase(activeTodayCount, studentRows.length || 0)}
          />
          <p
            className="teacher-roster-metric-note"
            role="status"
            data-class-average-suppressed={!classAccuracySummary.comparability.comparable}
          >
            {classAccuracySummary.comparability.comparable
              ? TEACHER_COPY.metrics.comparable
              : TEACHER_COPY.metrics.fairAverage(2)}
          </p>
        </section>
      )}

      {selectedClass && (
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
      )}

      {selectedClass && selectedStudentRow && (
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
                  <MetricFigure
                    metricId="current-skill"
                    updatedAt={selectedStudentRow.lastActive}
                  >
                    {selectedStudentRow.currentSkill}
                  </MetricFigure>
                </p>
              </div>
              <button className="text-button" data-autofocus type="button" onClick={onClearStudent}>
                Close student details
              </button>
            </header>
            <div className="teacher-learner-drawer-metrics" aria-label={`${selectedStudentRow.name} results summary`}>
              <RosterMetric label="Answers" value={selectedStudentRow.answered} />
              <RosterMetric
                definitionId="accuracy"
                definitionOptions={{
                  denominator: `${countPhrase(selectedStudentRow.answered, "scored answer")} for this student.`,
                  updatedAt: selectedStudentRow.lastActive
                }}
                label="Accuracy"
                value={accuracyConclusion(selectedStudentRow)}
              />
              <RosterMetric
                definitionId="mastered"
                definitionOptions={{
                  denominator: `${skillTotal} curriculum skills.`,
                  updatedAt: selectedStudentRow.lastActive
                }}
                label="Skills secured"
                value={progressPhrase(selectedStudentRow.masteredCount, skillTotal)}
              />
              <RosterMetric
                definitionId="active"
                definitionOptions={{
                  denominator: "This student's saved answers and Sound Seekers play.",
                  dateRange: "Most recent saved activity across all time.",
                  updatedAt: selectedStudentRow.lastActive
                }}
                label="Last active"
                value={formatLastActive(selectedStudentRow.lastActive)}
              />
            </div>
            <dl className="teacher-learner-drawer-details">
              <div>
                <dt>Sign-in</dt>
                <dd>{selectedStudentRow.symbol_password ? "Pictures ready" : "Pictures need setting"}</dd>
              </div>
              <div>
                <dt>Sound Seekers</dt>
                <dd>
                  {selectedStudentRow.soundSeekers?.sessions || selectedStudentRow.soundSeekers?.stopsCompleted > 0
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
                Check {selectedStudentRow.name}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => onOpenReport?.(selectedStudentRow)}
              >
                Report
              </button>
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
                Story Quests
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => {
                  setEditingStudent(selectedStudentRow);
                  setEditingSequence("");
                }}
              >
                {selectedStudentRow.symbol_password ? "Change sign-in pictures" : "Set sign-in pictures"}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => setAccessibilityStudent(selectedStudentRow)}
              >
                Accessibility settings
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => setDataRightsStudent(selectedStudentRow)}
              >
                Privacy and data rights
              </button>
              <button
                className="lp-button lp-button-danger-outline"
                type="button"
                aria-haspopup="dialog"
                onClick={() => openRosterOperation("archive", selectedStudentRow)}
              >
                Archive student…
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                aria-haspopup="dialog"
                onClick={() => setActionsStudent(selectedStudentRow)}
              >
                More options
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={openQuestionGuide}
              >
                {TEACHER_COPY.help.checkGuide}
              </button>
            </div>
          </aside>
        </TeacherDrawer>
      )}

      {selectedClass && actionCards.length > 0 && (
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
                  else if (card.studentIds) setRosterFilterIds(card.studentIds);
                }}
              >
                {card.action}
              </button>
            </article>
          ))}
        </section>
      )}

      {effectiveRosterFilterIds && (
        <div className="teacher-roster-filter-chip">
          <span>
            {rosterFilterIds ? "Suggested group" : selectedRosterGroup.label}: showing {visibleStudentRows.length} of {studentRows.length} students
          </span>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setRosterFilterIds(null);
              onSelectGroup?.("all");
            }}
          >
            Show all
          </button>
        </div>
      )}

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
            <span>{TEACHER_COPY.roster.activeCount(studentRows.length)}</span>
          </summary>
          <div className="teacher-roster-admin-content">
      <section className="teacher-dashboard-roster" aria-label={TEACHER_COPY.roster.panelLabel}>
        <div className="teacher-panel-header">
          <div>
            <p className="panel-label">{TEACHER_COPY.roster.panelLabel}</p>
            <h3>{TEACHER_COPY.roster.panelTitle(selectedClass?.name)}</h3>
            <p>
              {selectedClass
                ? TEACHER_COPY.roster.inClass(studentRows.length)
                : TEACHER_COPY.roster.chooseClass}
            </p>
            {selectedClass && (
              <small className="muted-text">{TEACHER_COPY.roster.privacy}</small>
            )}
          </div>
        </div>

        {selectedClass && (
          <div className="teacher-roster-actionbar">
            <div className="teacher-roster-add">
              <label className="teacher-dashboard-control">
                <span>{TEACHER_COPY.roster.displayName}</span>
                <input
                  ref={newStudentInputRef}
                  autoComplete="off"
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
              <button className="lp-button lp-button-primary" disabled={!newStudentName.trim()} onClick={handleCreateStudent} type="button">
                {TEACHER_COPY.roster.add}
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
        )}

        {selectedClass && showRosterImport && (
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
                    {rosterImportPreview.duplicates.length} duplicate
                    {rosterImportPreview.duplicates.length === 1 ? "" : "s"} skipped
                  </p>
                  {rosterImportPreview.duplicates.length > 0 && (
                    <ul aria-label="Duplicate students&apos;s names">
                      {rosterImportPreview.duplicates.map((row, index) => (
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

        {selectedClass && studentRows.length > 0 && (
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
                  onChange={event => setRosterSearch(event.target.value)}
                  placeholder="Search display names"
                />
              </label>
              <label>
                <span>Filter</span>
                <select value={rosterStatusFilter} onChange={event => setRosterStatusFilter(event.target.value)}>
                  <option value="all">{TEACHER_COPY.roster.activeFilter}</option>
                  <option value="login-missing">{TEACHER_COPY.roster.signInMissingFilter}</option>
                  <option value="not-started">Not started</option>
                  <option value="needs-attention">Needs attention</option>
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select value={rosterSort} onChange={event => setRosterSort(event.target.value)}>
                  <option value="name">Display name</option>
                  <option value="last-active">Last active</option>
                  <option value="focus">Current focus</option>
                  <option value="progress">Progress</option>
                </select>
              </label>
              <p role="status">
                {TEACHER_COPY.roster.showing(visibleStudentRows.length, studentRows.length)}
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

        {!selectedClass ? (
          <TeacherSurfaceState
            compact
            surface="classes"
            state="empty"
            onPrimaryAction={focusNewClassInput}
          />
        ) : loadingStudents ? (
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
        ) : (
          <TeacherDataTable
            className="dashboard-table teacher-roster-table"
            label={`${selectedClass.name} students`}
          >
              <thead>
                <tr>
                  <th scope="col" aria-label="Select students">
                    <input
                      aria-label="Select all visible students"
                      type="checkbox"
                      checked={visibleStudentRows.length > 0 && selectedVisibleCount === visibleStudentRows.length}
                      onChange={event => {
                        const visibleIds = visibleStudentRows.map(row => row.id);
                        setSelectedRosterIds(previous => event.target.checked
                          ? [...new Set([...previous, ...visibleIds])]
                          : previous.filter(id => !visibleIds.includes(id)));
                      }}
                    />
                  </th>
                  <th scope="col">Display name</th>
                  {enabledRosterColumns.has("focus") && <th scope="col">Focus</th>}
                  {enabledRosterColumns.has("progress") && <th scope="col">Progress</th>}
                  {enabledRosterColumns.has("sound-seekers") && <th scope="col">Sound Seekers</th>}
                  {enabledRosterColumns.has("login") && <th scope="col">Sign-in</th>}
                  {enabledRosterColumns.has("last-active") && <th scope="col">Last active</th>}
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudentRows.map(row => {
                  const progressPercent = getProgressPercent(row, skillTotal);
                  const loginReady = Boolean(row.symbol_password);
                  return (
                  <Fragment key={row.id}>
                  <tr className={loginReady ? "login-ready" : "login-missing"}>
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
                          <span>{row.answered ? `${row.answered} answer${row.answered === 1 ? "" : "s"}` : "No practice yet"}</span>
                        </div>
                      </div>
                    </td>
                    {enabledRosterColumns.has("focus") && <td data-label="Focus">
                      <span className="teacher-focus-pill">
                        <MetricFigure metricId="current-skill" updatedAt={row.lastActive}>
                          {row.currentSkill}
                        </MetricFigure>
                      </span>
                    </td>}
                    {enabledRosterColumns.has("progress") && <td data-label="Progress">
                      <div className="teacher-progress-cell">
                        <div className="teacher-progress-line">
                          <strong>
                            <MetricFigure
                              denominator={`${skillTotal} curriculum skills.`}
                              metricId="mastered"
                              updatedAt={row.lastActive}
                            >
                              {row.answered
                                ? `${progressPhrase(row.masteredCount, skillTotal)} mastered`
                                : "Not started"}
                            </MetricFigure>
                          </strong>
                          {row.answered ? (
                            <MetricFigure
                              denominator={`${countPhrase(row.answered, "scored answer")} for this student.`}
                              metricId="accuracy"
                              updatedAt={row.lastActive}
                            >
                              {accuracyConclusion(row)}
                            </MetricFigure>
                          ) : null}
                        </div>
                        <div className="teacher-progress-track" aria-hidden="true">
                          <span style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>
                    </td>}
                    {enabledRosterColumns.has("sound-seekers") && <td data-label="Sound Seekers">
                      {row.soundSeekers?.sessions || row.soundSeekers?.stopsCompleted > 0 ? (
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
                        <SymbolSequence sequence={row.symbol_password || ""} hidden={!visiblePasswords[row.id]} size={20} />
                        <div className="teacher-login-actions">
                          <button className="text-button" onClick={() => setVisiblePasswords(previous => ({ ...previous, [row.id]: !previous[row.id] }))} type="button">
                            {visiblePasswords[row.id] ? "Hide" : "Show"}
                          </button>
                          <button className="text-button" onClick={() => {
                            setEditingStudent(row);
                            setEditingSequence("");
                          }} type="button">
                            {loginReady ? "Change" : "Set pictures"}
                          </button>
                          {loginReady && (
                            <button className="text-button" onClick={() => resetStudentSymbolPassword?.(row.id, row.name)} type="button">
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </td>}
                    {enabledRosterColumns.has("last-active") && (
                      <td data-label="Last active">{formatLastActive(row.lastActive)}</td>
                    )}
                    <td data-label="Actions">
                      <div className="teacher-row-actions">
                        <button
                          className="lp-button lp-button-primary teacher-start-check"
                          onClick={() => onStartCheck?.(row)}
                          type="button"
                          aria-label={`Check ${row.name}`}
                        >
                          Check
                        </button>
                        <button className="lp-button lp-button-secondary teacher-open-student" onClick={() => onLoadStudent?.(row.id, row.name)} type="button">
                          Open student
                        </button>
                        <button
                          className="lp-button lp-button-secondary"
                          type="button"
                          aria-haspopup="dialog"
                          aria-label={`More options for ${row.name}`}
                          onClick={() => setActionsStudent(row)}
                        >
                          More
                        </button>
                      </div>
                    </td>
                  </tr>
                  {heatOpenId === row.id && row.soundSeekers && (
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
        )}
      </section>

      {selectedClass && archivedStudentList.length > 0 && (
        <section className="teacher-archived-roster" aria-label="Archived students">
          <details>
            <summary>Archived students ({archivedStudentList.length})</summary>
            <p>Archived students cannot sign in, but their saved results remain. Restore a student to return them to this class.</p>
            <ul>
              {archivedStudentList.map(row => (
                <li key={row.id}>
                  <span>
                    <strong>{row.name}</strong>
                    <small>Archived {formatLastActive(row.archived_at)}</small>
                  </span>
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    onClick={() => handleRestoreStudent(row)}
                  >
                    Restore {row.name}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
          </div>
        </details>

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
            <div className="teacher-student-action-list">
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => {
                  const student = actionsStudent;
                  setActionsStudent(null);
                  onOpenElFormalCheck?.(student);
                }}
              >
                EL formal check
              </button>
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
                  setEditingStudent(actionsStudent);
                  setEditingSequence("");
                  setActionsStudent(null);
                }}
              >
                {actionsStudent.symbol_password ? "Change sign-in pictures" : "Set sign-in pictures"}
              </button>
              {actionsStudent.symbol_password && (
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={async () => {
                    const student = actionsStudent;
                    setActionsStudent(null);
                    await resetStudentSymbolPassword?.(student.id, student.name);
                  }}
                >
                  Reset sign-in pictures
                </button>
              )}
              <button
                className="lp-button lp-button-secondary teacher-choice-mode-toggle"
                type="button"
                aria-pressed={actionsStudent.reducedChoiceMode}
                disabled={savingChoiceModeIds.includes(actionsStudent.id)}
                onClick={async () => {
                  const student = actionsStudent;
                  await handleReducedChoiceMode(student);
                  setActionsStudent(null);
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
              {classList.length > 1 && (
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
                Reset check data
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
                {operationHasSavedResults ? (
                  <>
                    <p>
                      This permanently deletes {operationSavedSummary} for {operationStudent.name},
                      together with their reports, progress and sign-in pictures. It cannot be undone.
                    </p>
                    <p>
                      Archive {operationStudent.name} instead to take them off the roster and keep
                      everything they have done.
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
                ) : (
                  <>
                    <p>
                      {operationStudent.name} has no saved results, so there is nothing to keep.
                    </p>
                    <p>
                      Deleting removes {operationStudent.name} from this class for good and cannot be
                      undone. Archive them instead if you might want them back.
                    </p>
                  </>
                )}
              </>
            )}
            {rosterOperation.kind === "transfer" && (
              <>
                <p>
                  The student and their saved results move together. Nothing is copied or deleted.
                </p>
                <label className="teacher-dashboard-control">
                  <span>Destination class</span>
                  <select
                    value={operationTargetClassId}
                    onChange={event => setOperationTargetClassId(event.target.value)}
                  >
                    <option value="">Choose another class</option>
                    {classList.filter(row => row.id !== selectedClassId).map(row => (
                      <option key={row.id} value={row.id}>{row.name}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {operationError && (
              <p className="teacher-inline-error" role="alert">{operationError}</p>
            )}
            <div className="teacher-roster-operation-actions">
              <button
                className={rosterOperation.kind === "delete"
                  ? "lp-button lp-button-danger"
                  : rosterOperation.kind === "archive"
                    ? "lp-button lp-button-danger-outline"
                    : "lp-button lp-button-primary"}
                type="button"
                disabled={operationBusy
                  || (rosterOperation.kind === "transfer" && !operationTargetClassId)
                  || (rosterOperation.kind === "delete" && !deleteConfirmReady)}
                onClick={confirmRosterOperation}
              >
                {operationBusy
                  ? (rosterOperation.kind === "delete" ? "Deleting…" : "Saving…")
                  : rosterOperation.kind === "archive"
                    ? `Yes, archive ${operationStudent.name}`
                    : rosterOperation.kind === "delete"
                      ? `Yes, delete ${operationStudent.name} permanently`
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
          label={`Change password for ${editingStudent.name}`}
          onClose={() => {
            setEditingStudent(null);
            setEditingSequence("");
          }}
        >
          <div className="symbol-password-modal-card">
            <h3>Change {editingStudent.name}'s pictures</h3>
            <p className="muted-text">This student gate is teacher-visible by design; real data protection remains in the signed-in teacher account.</p>
            <SymbolPasswordPad
              value={editingSequence}
              onChange={setEditingSequence}
              onComplete={async sequence => {
                await updateStudentSymbolPassword?.(editingStudent.id, sequence, editingStudent.name);
                setEditingStudent(null);
                setEditingSequence("");
              }}
            />
            <button className="report-button" onClick={() => setEditingStudent(null)} type="button">
              Cancel
            </button>
          </div>
        </TeacherModal>
      )}

      </>
      )}
    </TeacherPageShell>
  );
}
