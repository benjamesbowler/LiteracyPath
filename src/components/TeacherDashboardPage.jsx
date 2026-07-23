import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { SymbolPasswordPad, SymbolSequence } from "./SymbolPasswordPad.jsx";
import { SchoolNameInput } from "./SchoolNameInput.jsx";
import { symbolIconByDigit } from "../data/symbolPasswordIcons.js";
import { printPracticePack, packStopIndex, packTargetLabel } from "../utils/worksheets/practicePack.js";
import { classHeatSummary } from "../utils/questReport.js";
import { QUESTION_TYPE_GUIDE } from "../data/questionTypeGuide.js";
import { buildTeacherTodayBriefing } from "../utils/teacherTodayBriefing.js";
import {
  insertRosterStudents,
  setRosterStudentArchived,
  transferRosterStudent
} from "../data/teacherRosterOperations.js";
import { supabase } from "../supabaseClient.js";
import logoUrl from "../assets/logo.svg";

function formatLastActive(value) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function getProgressPercent(row, skillTotal) {
  if (!skillTotal) return 0;
  return Math.max(0, Math.min(100, Math.round((row.masteredCount / skillTotal) * 100)));
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

function RosterMetric({ label, value, tone = "" }) {
  return (
    <div className={["teacher-roster-metric", tone].filter(Boolean).join(" ")}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StudentInitial({ name }) {
  return (
    <span className="teacher-student-initial" aria-hidden="true">
      {String(name || "S").slice(0, 1).toUpperCase()}
    </span>
  );
}

function TeacherSetupChecklist({
  hasClass,
  hasLearners,
  loginsReady,
  firstCheckComplete,
  onContinue,
  onCreateDemo,
  creatingDemo = false
}) {
  const steps = [
    {
      id: "class",
      title: "Create a class",
      description: "Use the class name your learners already know.",
      complete: hasClass
    },
    {
      id: "learners",
      title: "Add or import learners",
      description: "Use English names or classroom nicknames, never surnames.",
      complete: hasLearners
    },
    {
      id: "logins",
      title: "Set login pictures",
      description: "Every learner needs three teacher-set pictures.",
      complete: loginsReady
    },
    {
      id: "check",
      title: "Run the first check",
      description: "One recorded response makes the evidence trail live.",
      complete: firstCheckComplete
    }
  ];
  const completedCount = steps.filter(step => step.complete).length;
  const nextStep = steps.find(step => !step.complete) || null;

  return (
    <section
      className={`teacher-setup-checklist${nextStep ? "" : " is-complete"}`}
      aria-label="Teacher setup checklist"
      data-setup-complete={nextStep ? "false" : "true"}
    >
      <header>
        <div>
          <p className="panel-label">{nextStep ? "First class setup" : "Setup complete"}</p>
          <h3>{nextStep ? "Four steps to your first useful result" : "Your class is ready to use"}</h3>
          <p>
            {nextStep
              ? "Progress comes from saved class data, so it stays accurate on every device."
              : "Class, learners, logins, and the first recorded check are all in place."}
          </p>
        </div>
        <div className="teacher-setup-progress" aria-label={`${completedCount} of ${steps.length} setup steps complete`}>
          <strong>{completedCount}/{steps.length}</strong>
          <span>complete</span>
        </div>
      </header>

      <ol>
        {steps.map((step, index) => {
          const current = nextStep?.id === step.id;
          return (
            <li
              className={step.complete ? "is-complete" : current ? "is-current" : ""}
              key={step.id}
              aria-current={current ? "step" : undefined}
            >
              <span className="teacher-setup-step-mark" aria-hidden="true">
                {step.complete ? "✓" : index + 1}
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
              <span className="teacher-setup-step-state">
                {step.complete ? "Done" : current ? "Next" : "Waiting"}
              </span>
            </li>
          );
        })}
      </ol>

      {nextStep && (
        <footer>
          <button className="lp-button lp-button-primary" type="button" onClick={() => onContinue?.(nextStep.id)}>
            Continue: {nextStep.title}
          </button>
          {!hasClass && onCreateDemo && (
            <button
              className="lp-button lp-button-secondary"
              type="button"
              disabled={creatingDemo}
              onClick={onCreateDemo}
            >
              {creatingDemo ? "Creating sample..." : "Explore with a sample class"}
            </button>
          )}
          {!hasClass && (
            <p>
              Sample data is clearly labelled, uses fictional nicknames, and contains no assessment evidence.
            </p>
          )}
        </footer>
      )}
    </section>
  );
}

function TodayBriefing({
  rows,
  onLoadStudent,
  onOpenClasses,
  onOpenAssess,
  onOpenProgress
}) {
  const briefing = useMemo(() => buildTeacherTodayBriefing(rows), [rows]);
  const policy = briefing.policy;

  return (
    <section className="teacher-today-briefing" aria-label="Today's class briefing">
      <header className="teacher-today-briefing-head">
        <div>
          <p className="panel-label">Evidence briefing</p>
          <h3>What needs your attention today</h3>
        </div>
        <p>
          Flags use recorded responses, not guesses. Review appears below
          {` ${policy.attentionAccuracyBelow}% after at least ${policy.minimumResponsesForAttention} responses.`}
        </p>
      </header>

      <div className="teacher-today-grid">
        <section className="teacher-today-zone attention" aria-label="Who needs attention">
          <div className="teacher-today-zone-head">
            <span>Who needs attention</span>
            <strong>{briefing.attention.length}</strong>
          </div>
          {briefing.attention.length ? (
            <ul>
              {briefing.attention.slice(0, 4).map(row => (
                <li key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.focus}</span>
                    <small>{row.evidence}</small>
                    <small>{row.policyBasis}</small>
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onLoadStudent?.(row.id, row.name)}
                  >
                    Review {row.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="teacher-today-empty">No learner meets the review threshold in the current evidence.</p>
          )}
          {briefing.insufficientEvidenceCount > 0 && (
            <p className="teacher-today-evidence-note">
              {briefing.insufficientEvidenceCount} low early result
              {briefing.insufficientEvidenceCount === 1 ? " is" : "s are"} held back until the minimum evidence is met.
            </p>
          )}
        </section>

        <section className="teacher-today-zone due" aria-label="What's due">
          <div className="teacher-today-zone-head">
            <span>What&rsquo;s due</span>
            <strong>{briefing.due.length}</strong>
          </div>
          {briefing.due.length ? (
            <ul>
              {briefing.due.slice(0, 4).map(row => (
                <li key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.title}</span>
                    <small>{row.evidence}</small>
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onLoadStudent?.(row.id, row.name)}
                  >
                    Open {row.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="teacher-today-empty">
              Nothing is overdue under the {policy.inactivityDueDays}-day activity policy.
            </p>
          )}
        </section>

        <section className="teacher-today-zone changed" aria-label="What changed">
          <div className="teacher-today-zone-head">
            <span>What changed</span>
            <strong>{briefing.changed.length}</strong>
          </div>
          {briefing.changed.length ? (
            <ul>
              {briefing.changed.slice(0, 4).map(row => (
                <li key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.summary}</span>
                    <small>{row.comparison}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="teacher-today-empty">
              No recorded responses or newly secured skills in the last {policy.changeWindowDays} days.
            </p>
          )}
        </section>

        <section className="teacher-today-zone actions" aria-label="Direct actions">
          <div className="teacher-today-zone-head">
            <span>Direct actions</span>
          </div>
          <div className="teacher-today-direct-actions">
            <button className="lp-button lp-button-primary" type="button" onClick={onOpenAssess}>
              Start an assessment
            </button>
            <button className="lp-button lp-button-secondary" type="button" onClick={onOpenProgress}>
              Review progress
            </button>
            <button className="lp-button lp-button-secondary" type="button" onClick={onOpenClasses}>
              Manage this class
            </button>
          </div>
          <p>Each action keeps the current class in context.</p>
        </section>
      </div>
    </section>
  );
}

// THE SOUND HEAT MAP + PRACTICE-ASSIGN.
//
// One tile per grapheme, in the order the trail teaches them, coloured by the
// honest buckets (got it / almost there / needs re-teaching / not met yet) —
// and tappable: pick up to six sounds, press Assign, and that child's Free
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

  // Print the home practice pack straight from this child's evidence: the
  // sounds the teacher tapped, or the weakest five when nothing is tapped,
  // with every word decodable at the furthest stop the child has reached.
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
            title={`${tile.label} · ${tile.stopName} · ${tile.bucket === "unseen" ? "not met yet" : `${tile.accuracy}% over ${tile.seen} response${tile.seen === 1 ? "" : "s"}`}`}
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
        ) : <span className="muted-text">Tap sounds, then assign them as this child&rsquo;s next practice.</span>}
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

// THE CLASS SOUND MAP (REVIEW.md, Educator #7). One row of tiles for the
// whole class — coloured by how many children still need each sound — plus
// concrete grouping hints: "sh — Sam, Maya, Leo need re-teaching" with a
// one-click group practice sheet printed at the LOWEST member's curriculum
// stop, so every word on it is decodable for every child in the group.
function ClassHeatPanel({ rows }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const summary = useMemo(
    () => classHeatSummary(rows
      .filter(row => row.soundSeekers)
      .map(row => ({ name: row.name, report: row.soundSeekers }))),
    [rows]
  );

  // One child is a heat map (their own panel below); a class view needs two.
  if (summary.studentsWithEvidence < 2) return null;

  function severityClass(tile) {
    if (!tile.met) return "is-unseen";
    if (tile.reteachShare >= 0.5) return "is-reteach";
    if (tile.reteachShare >= 0.25 || tile.almost > tile.gotIt) return "is-almost";
    return "is-got-it";
  }

  function printGroupPack(group) {
    try {
      const result = printPracticePack({
        name: `The ${group.label} group`,
        targets: [group.id],
        stopIndex: group.stopIndex
      });
      setNote(result ? "" : "Please allow pop-ups for this site so the pack can open.");
    } catch (error) {
      setNote(error.message || "Could not build that group pack.");
    }
  }

  const groupSummary = summary.groups.length
    ? `${summary.groups.length} sound${summary.groups.length === 1 ? "" : "s"} could use a small group`
    : "no sound needs a group right now";

  return (
    <div className="quest-heat-panel class-heat-panel">
      <div className="quest-heat-head">
        <strong>Class sound map</strong>
        <span className="muted-text">
          {summary.studentsWithEvidence} students with evidence · {groupSummary}
        </span>
        <button className="text-button" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <>
          <div
            className="quest-heat-grid"
            role="img"
            aria-label={`Class sound map. ${summary.groups.length
              ? summary.groups.map(group => `${group.label}: ${group.count} students need re-teaching`).join(". ")
              : "No sound currently needs a re-teaching group."}`}
          >
            {summary.tiles.map(tile => (
              <span
                key={tile.id}
                aria-hidden="true"
                className={`quest-heat-tile ${severityClass(tile)}`}
                title={`${tile.label} · ${tile.stopName} · ${tile.gotIt} got it · ${tile.almost} almost · ${tile.reteach} need re-teaching · ${tile.unseen} not met yet`}
              >
                {tile.label}
              </span>
            ))}
          </div>
          {summary.groups.length > 0 && (
            <ul className="class-heat-groups">
              {summary.groups.map(group => (
                <li key={group.id}>
                  <strong>{group.label}</strong> — {group.students.join(", ")}
                  <button className="text-button" type="button" onClick={() => printGroupPack(group)}>
                    Print group pack
                  </button>
                </li>
              ))}
            </ul>
          )}
          {note && <p className="muted-text quest-heat-note" role="status">{note}</p>}
        </>
      )}
    </div>
  );
}

export function TeacherDashboardPage({
  pageIntent = "today",
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
  onLoadStudent,
  selectedStudentId,
  onClearStudent,
  selectedGroupId = "all",
  onSelectGroup,
  onOpenClasses,
  onOpenAssess,
  onOpenProgress,
  createClass,
  createDemoClass,
  regenerateClassCode,
  newClassName,
  setNewClassName,
  createStudent,
  teacherId,
  classDashboard = [],
  loadClassDashboard,
  skillTree = [],
  updateStudentSymbolPassword,
  resetStudentSymbolPassword,
  startStudentLogin,
  schoolName = "",
  hasSchool = false,
  saveSchool,
  message
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
  const [selectedRosterIds, setSelectedRosterIds] = useState([]);
  const [loginCardRows, setLoginCardRows] = useState([]);
  const [rosterOperation, setRosterOperation] = useState(null);
  const [operationTargetClassId, setOperationTargetClassId] = useState("");
  const [operationBusy, setOperationBusy] = useState(false);
  const [rosterOperationStatus, setRosterOperationStatus] = useState("");
  const [rosterFilterIds, setRosterFilterIds] = useState(null);
  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolDraft, setSchoolDraft] = useState("");
  const [savingSchool, setSavingSchool] = useState(false);
  const [savingLeaderboardScope, setSavingLeaderboardScope] = useState(false);
  const [leaderboardStatus, setLeaderboardStatus] = useState("");
  const [leaderboardScopeOverrides, setLeaderboardScopeOverrides] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingSequence, setEditingSequence] = useState("");
  const [heatOpenId, setHeatOpenId] = useState(null);
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
  const selectedClass = classList.find(row => row.id === selectedClassId) || null;
  const dashboardById = useMemo(
    () => new Map(classDashboard.map(row => [row.id, row])),
    [classDashboard]
  );
  const studentRows = useMemo(
    () => studentList.map(student => {
      const dashboardRow = dashboardById.get(student.id) || {};
      return {
        ...student,
        answered: dashboardRow.answered ?? 0,
        accuracy: dashboardRow.accuracy ?? null,
        masteredCount: dashboardRow.masteredCount ?? 0,
        currentSkill: dashboardRow.currentSkill || "Not started",
        soundSeekers: dashboardRow.soundSeekers || null,
        lastActive: dashboardRow.lastActive || student.lastActive || student.updated_at || student.created_at || null,
        recentAnswers: dashboardRow.recentAnswers ?? 0,
        previousAnswers: dashboardRow.previousAnswers ?? 0,
        recentMastered: dashboardRow.recentMastered ?? 0,
        previousMastered: dashboardRow.previousMastered ?? 0
      };
    }),
    [dashboardById, studentList]
  );
  const rosterGroups = useMemo(() => [
    {
      id: "all",
      label: "Whole class",
      studentIds: studentRows.map(row => row.id)
    },
    {
      id: "attention",
      label: "Needs attention",
      studentIds: studentRows
        .filter(row => row.answered >= 8 && row.accuracy !== null && row.accuracy < 70)
        .map(row => row.id)
    },
    {
      id: "not-started",
      label: "Not started",
      studentIds: studentRows.filter(row => row.answered === 0).map(row => row.id)
    },
    {
      id: "active-today",
      label: "Active today",
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
      row.answered > 0 && row.accuracy !== null && row.accuracy < 70 && row.currentSkill && row.currentSkill !== "Not started"
    );
    const bySkill = new Map();
    struggling.forEach(row => {
      bySkill.set(row.currentSkill, [...(bySkill.get(row.currentSkill) || []), row]);
    });
    const reteach = [...bySkill.entries()].filter(([, rows]) => rows.length >= 2).sort((a, b) => b[1].length - a[1].length)[0];
    if (reteach) {
      cards.push({
        id: "reteach",
        tone: "warn",
        title: `Reteach ${reteach[0]}`,
        detail: `${reteach[1].map(row => row.name).slice(0, 4).join(", ")}${reteach[1].length > 4 ? ` +${reteach[1].length - 4}` : ""} are below 70% on this skill.`,
        action: "Show group",
        studentIds: reteach[1].map(row => row.id)
      });
    }

    // Nudge: students who haven't started or have gone quiet.
    const inactive = studentRows.filter(row => row.answered === 0 || !row.lastActive || formatLastActive(row.lastActive).includes("days ago"));
    if (inactive.length >= 1 && studentRows.length > 1) {
      cards.push({
        id: "nudge",
        tone: "info",
        title: inactive.some(row => row.answered === 0) ? "Get everyone started" : "Re-engage quiet readers",
        detail: `${inactive.map(row => row.name).slice(0, 4).join(", ")}${inactive.length > 4 ? ` +${inactive.length - 4}` : ""} ${inactive.length === 1 ? "has" : "have"} little or no recent practice.`,
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
        return row.answered >= 8 && row.accuracy !== null && row.accuracy < 70;
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

  const skillTotal = skillTree.length;
  const startedCount = studentRows.filter(row => row.answered > 0).length;
  const loginReadyCount = studentRows.filter(row => row.symbol_password).length;
  const activeTodayCount = studentRows.filter(row => formatLastActive(row.lastActive) === "Today").length;
  const rowsWithAccuracy = studentRows.filter(row =>
    row.accuracy !== null && row.accuracy !== undefined && Number.isFinite(Number(row.accuracy))
  );
  const averageAccuracy = rowsWithAccuracy.length
    ? Math.round(rowsWithAccuracy.reduce((sum, row) => sum + Number(row.accuracy), 0) / rowsWithAccuracy.length)
    : null;
  const className = selectedClass?.name || "No class selected";
  const leaderboardScope = leaderboardScopeOverrides[selectedClass?.id]
    || (selectedClass?.leaderboard_scope === "school" ? "school" : "class");
  const isClassesPage = pageIntent === "classes";
  const hasSetupClass = Boolean(selectedClass);
  const hasSetupLearners = studentRows.length > 0;
  const setupLoginsReady = hasSetupLearners && studentRows.every(row => Boolean(row.symbol_password));
  const firstCheckComplete = studentRows.some(row => row.answered > 0);

  useEffect(() => {
    loadStudentsRef.current = loadStudents;
    loadClassDashboardRef.current = loadClassDashboard;
  }, [loadStudents, loadClassDashboard]);

  useEffect(() => {
    if (!selectedClassId) return;
    loadStudentsRef.current?.(selectedClassId);
    loadClassDashboardRef.current?.(selectedClassId);
  }, [selectedClassId]);

  function handleClassChange(event) {
    const nextClassId = event.target.value || null;
    setSelectedClassId?.(nextClassId);
    setStudentList?.([]);
  }

  async function handleCreateStudent() {
    const clean = newStudentName.trim();
    if (!clean) return;
    await createStudent?.(clean);
    setNewStudentName("");
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
      setRosterOperationStatus("Import up to 40 learners into a selected class.");
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
        setRosterOperationStatus("Could not import that roster. No learners were added.");
        return;
      }
      await loadStudents?.(selectedClassId);
      await loadClassDashboard?.(selectedClassId);
      setRosterOperationStatus(`${names.length} learners imported. Set login pictures next.`);
      setRosterImportText("");
      setRosterImportPreview(null);
      setShowRosterImport(false);
    } finally {
      setImportingRoster(false);
    }
  }

  async function handleSetupContinue(stepId) {
    if (stepId === "class") {
      if (!isClassesPage) onOpenClasses?.();
      else focusNewClassInput();
      return;
    }
    if (stepId === "learners") {
      if (!isClassesPage) onOpenClasses?.();
      else focusNewStudentInput();
      return;
    }
    if (stepId === "logins") {
      const learner = studentRows.find(row => !row.symbol_password);
      if (!learner) return;
      setEditingStudent(learner);
      setEditingSequence("");
      if (!isClassesPage) onOpenClasses?.();
      return;
    }
    if (stepId === "check") {
      const learner = selectedStudentRow || studentRows[0];
      if (!learner) return;
      await onLoadStudent?.(learner.id, learner.name);
      onOpenAssess?.();
    }
  }

  async function handleCreateDemo() {
    if (creatingDemo) return;
    setCreatingDemo(true);
    try {
      const created = await createDemoClass?.();
      if (created && !isClassesPage) onOpenClasses?.();
    } finally {
      setCreatingDemo(false);
    }
  }

  async function handleSaveSchool() {
    const clean = schoolDraft.trim();
    if (!clean || savingSchool) return;
    setSavingSchool(true);
    try {
      await saveSchool?.(clean);
      setEditingSchool(false);
    } finally {
      setSavingSchool(false);
    }
  }

  async function handleLeaderboardScope(scope) {
    if (!selectedClass?.id) return;
    setSavingLeaderboardScope(true);
    setLeaderboardStatus("");
    try {
      const { data, error } = await supabase.rpc("teacher_set_class_leaderboard_scope", {
        p_class_id: selectedClass.id,
        p_scope: scope
      });
      if (error || data?.[0]?.leaderboard_scope !== scope) {
        console.error("Save leaderboard scope error:", error);
        setLeaderboardStatus("Could not change this privacy setting.");
        return;
      }
      setLeaderboardScopeOverrides(previous => ({ ...previous, [selectedClass.id]: scope }));
      setLeaderboardStatus(
        scope === "school"
          ? "Nickname-only scores now include this school."
          : "Nickname-only scores now stay in this class."
      );
    } finally {
      setSavingLeaderboardScope(false);
    }
  }

  function openLoginCardPreview(rows) {
    setLoginCardRows(rows.filter(row => row.symbol_password));
  }

  async function confirmRosterOperation() {
    if (!rosterOperation || operationBusy) return;
    setOperationBusy(true);
    try {
      let saved = false;
      if (rosterOperation.kind === "archive") {
        const { data, error } = await setRosterStudentArchived({
          supabase,
          studentId: rosterOperation.student.id,
          classId: selectedClassId,
          archived: true
        });
        saved = !error && Boolean(data?.length);
        if (saved) {
          setRosterOperationStatus(`${rosterOperation.student.name} archived. Their evidence is retained.`);
        }
      } else if (rosterOperation.kind === "transfer") {
        const targetClass = classList.find(row => row.id === operationTargetClassId);
        const { data, error } = await transferRosterStudent({
          supabase,
          studentId: rosterOperation.student.id,
          sourceClassId: selectedClassId,
          targetClassId: operationTargetClassId
        });
        saved = !error && Boolean(data?.length);
        if (saved) {
          setRosterOperationStatus(
            `${rosterOperation.student.name} transferred to ${targetClass?.name || "the selected class"}. Their evidence moved with them.`
          );
        }
      }
      if (saved) {
        if (selectedStudentId === rosterOperation.student.id) onClearStudent?.();
        await loadStudents?.(selectedClassId);
        await loadClassDashboard?.(selectedClassId);
        setSelectedRosterIds(previous => previous.filter(id => id !== rosterOperation.student.id));
        setRosterOperation(null);
        setOperationTargetClassId("");
      } else {
        setRosterOperationStatus(`Could not ${rosterOperation.kind} that learner.`);
      }
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleRestoreStudent(row) {
    const { data, error } = await setRosterStudentArchived({
      supabase,
      studentId: row.id,
      classId: selectedClassId,
      archived: false
    });
    if (error || !data?.length) {
      setRosterOperationStatus(`Could not restore ${row.name}.`);
      return;
    }
    await loadStudents?.(selectedClassId);
    await loadClassDashboard?.(selectedClassId);
    setRosterOperationStatus(`${row.name} restored to the active roster.`);
  }

  return (
    <div
      className="teacher-product-page teacher-dashboard-page"
      data-teacher-product="class-dashboard"
    >
      <section className="teacher-page-header teacher-dashboard-hero">
        <div>
          <div className="teacher-page-brand">
            <img src={logoUrl} alt="" />
            <p className="panel-label">{isClassesPage ? "Classes" : "Today"}</p>
          </div>
          <h2>{isClassesPage ? "Classes" : "Today"}</h2>
          <p>
            {isClassesPage
              ? (selectedClass
                ? `Manage ${selectedClass.name}'s roster, access, and class settings.`
                : "Select or create a class to begin.")
              : (selectedClass
                ? `Review ${selectedClass.name}'s current pulse and next actions.`
                : "Choose a class for today's briefing.")}
          </p>
        </div>
        <div className="teacher-dashboard-context" aria-label="Current school and class">
          <span>School</span>
          <strong>{hasSchool ? schoolName : "Not set"}</strong>
          <small>{selectedClass ? `${studentRows.length} student${studentRows.length === 1 ? "" : "s"}` : className}</small>
        </div>
        {isClassesPage && selectedClass?.access_code && (
          <div className="teacher-dashboard-context teacher-class-code" aria-label="Class sign-in code">
            <span>Class code</span>
            <strong className="teacher-class-code-value">{selectedClass.access_code}</strong>
            <small>Children enter this on their device to sign in. Keep it inside the classroom.</small>
            <div className="teacher-login-actions">
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText?.(selectedClass.access_code);
                  } catch {
                    // Clipboard is best-effort; the code is visible above regardless.
                  }
                }}
              >
                Copy
              </button>
              {regenerateClassCode && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    if (window.confirm("Make a new class code? The old code stops working, and shared devices will need the new one.")) {
                      regenerateClassCode(selectedClass.id);
                    }
                  }}
                >
                  New code
                </button>
              )}
            </div>
          </div>
        )}
        {isClassesPage && selectedClass && (
          <div className="teacher-dashboard-context teacher-leaderboard-privacy" aria-label="High-score privacy">
            <span>High-score board</span>
            <strong>{leaderboardScope === "school" ? "School nicknames" : "Class nicknames"}</strong>
            <small>
              Children only see generated Reader nicknames. Class-only is the privacy default.
            </small>
            <label>
              <input
                type="checkbox"
                checked={leaderboardScope === "school"}
                disabled={savingLeaderboardScope}
                onChange={async event => {
                  const nextScope = event.target.checked ? "school" : "class";
                  if (
                    nextScope === "school"
                    && !window.confirm(
                      "Include nickname-only scores from other classes at this school? No student names are shown."
                    )
                  ) {
                    return;
                  }
                  await handleLeaderboardScope(nextScope);
                }}
              />
              <span>Include this school</span>
            </label>
            {leaderboardStatus && <small role="status">{leaderboardStatus}</small>}
          </div>
        )}
      </section>

      {message && <p className="message teacher-dashboard-message">{message}</p>}
      {rosterOperationStatus && (
        <p className="message teacher-dashboard-message" role="status">{rosterOperationStatus}</p>
      )}

      <TeacherSetupChecklist
        hasClass={hasSetupClass}
        hasLearners={hasSetupLearners}
        loginsReady={setupLoginsReady}
        firstCheckComplete={firstCheckComplete}
        onContinue={handleSetupContinue}
        onCreateDemo={createDemoClass ? handleCreateDemo : null}
        creatingDemo={creatingDemo}
      />

      {selectedClass && (
        <section className="teacher-roster-metrics" aria-label="Class summary">
          <RosterMetric label="Students" value={studentRows.length} />
          <RosterMetric label="Logins ready" value={`${loginReadyCount}/${studentRows.length || 0}`} tone={loginReadyCount === studentRows.length && studentRows.length ? "good" : ""} />
          <RosterMetric label="Started" value={`${startedCount}/${studentRows.length || 0}`} />
          <RosterMetric label="Avg accuracy" value={averageAccuracy === null ? "-" : `${averageAccuracy}%`} />
          <RosterMetric label="Active today" value={activeTodayCount} />
        </section>
      )}

      <section
        className={`teacher-dashboard-controls${isClassesPage ? "" : " teacher-today-class-control"}`}
        aria-label={isClassesPage ? "Class controls" : "Today class"}
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

        {isClassesPage && <div className="teacher-dashboard-create teacher-dashboard-control-group">
          <label className="teacher-dashboard-control">
            <span>New class</span>
            <input
              ref={newClassInputRef}
              autoComplete="off"
              value={newClassName}
              placeholder="Enter class name"
              onChange={event => setNewClassName?.(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") createClass?.();
              }}
            />
          </label>
          <button className="lp-button lp-button-primary" onClick={createClass} type="button">
            Create Class
          </button>
        </div>}

        {isClassesPage && saveSchool && (
          <div className="teacher-dashboard-school teacher-dashboard-control-group">
            {!editingSchool ? (
              <p className={hasSchool ? "teacher-school-summary" : "teacher-school-summary teacher-school-missing"}>
                {hasSchool
                  ? <>School: <strong>{schoolName || "..."}</strong></>
                  : "No school set yet - students need a school to use child login."}
                <button
                  className="text-button"
                  onClick={() => {
                    setSchoolDraft(schoolName || "");
                    setEditingSchool(true);
                  }}
                  type="button"
                >
                  {hasSchool ? "Change" : "Set school"}
                </button>
              </p>
            ) : (
              <div className="teacher-dashboard-create teacher-school-edit">
                <label className="teacher-dashboard-control">
                  <span>School</span>
                  <SchoolNameInput
                    autoComplete="organization"
                    value={schoolDraft}
                    placeholder="Choose or type your school"
                    onChange={setSchoolDraft}
                    onKeyDown={event => {
                      if (event.key === "Enter" && schoolDraft.trim()) {
                        handleSaveSchool();
                      }
                    }}
                  />
                </label>
                <button
                  className="lp-button lp-button-primary"
                  disabled={!schoolDraft.trim() || savingSchool}
                  onClick={handleSaveSchool}
                  type="button"
                >
                  {savingSchool ? "Saving..." : "Save School"}
                </button>
                <button className="lp-button lp-button-secondary" disabled={savingSchool} onClick={() => setEditingSchool(false)} type="button">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {!isClassesPage && selectedClass && (
        <TodayBriefing
          rows={studentRows}
          onLoadStudent={onLoadStudent}
          onOpenClasses={onOpenClasses}
          onOpenAssess={onOpenAssess}
          onOpenProgress={onOpenProgress}
        />
      )}

      {isClassesPage && selectedClass && (
        <section className="teacher-roster-groups" aria-label="Roster groups">
          <div>
            <p className="panel-label">Class groups</p>
            <strong>Drill down without leaving {selectedClass.name}</strong>
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
        </section>
      )}

      {isClassesPage && selectedClass && selectedStudentRow && (
        <section
          className="teacher-learner-drawer"
          aria-label={`Learner detail: ${selectedStudentRow.name}`}
          data-teacher-learner-id={selectedStudentRow.id}
        >
          <header>
            <div>
              <p className="teacher-context-trail">
                Classes <span aria-hidden="true">/</span> {selectedClass.name}
                <span aria-hidden="true">/</span> {selectedRosterGroup.label}
                <span aria-hidden="true">/</span> {selectedStudentRow.name}
              </p>
              <h3>{selectedStudentRow.name}</h3>
              <p>{selectedStudentRow.currentSkill}</p>
            </div>
            <button className="text-button" type="button" onClick={onClearStudent}>
              Close learner
            </button>
          </header>
          <div className="teacher-learner-drawer-metrics" aria-label={`${selectedStudentRow.name} evidence summary`}>
            <RosterMetric label="Responses" value={selectedStudentRow.answered} />
            <RosterMetric
              label="Accuracy"
              value={selectedStudentRow.answered ? `${selectedStudentRow.accuracy}%` : "Not checked"}
            />
            <RosterMetric label="Skills secured" value={selectedStudentRow.masteredCount} />
            <RosterMetric label="Last active" value={formatLastActive(selectedStudentRow.lastActive)} />
          </div>
          <div className="teacher-learner-drawer-actions">
            <button className="lp-button lp-button-primary" type="button" onClick={onOpenAssess}>
              Assess {selectedStudentRow.name}
            </button>
            <button className="lp-button lp-button-secondary" type="button" onClick={onOpenProgress}>
              Review {selectedStudentRow.name}&rsquo;s progress
            </button>
          </div>
        </section>
      )}

      {isClassesPage && selectedClass && actionCards.length > 0 && (
        <section className="teacher-action-cards" aria-label="Suggested next steps">
          {actionCards.map(card => (
            <article key={card.id} className={`teacher-action-card ${card.tone}`}>
              <div>
                <strong>{card.title}</strong>
                <p>{card.detail}</p>
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

      {isClassesPage && effectiveRosterFilterIds && (
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

      {isClassesPage && <section className="teacher-dashboard-roster" aria-label="Students">
        <div className="teacher-panel-header">
          <div>
            <p className="panel-label">Roster</p>
            <h3>Students{selectedClass ? ` - ${selectedClass.name}` : ""}</h3>
            <p>
              {selectedClass
                ? `${studentRows.length} student${studentRows.length === 1 ? "" : "s"} in this class.`
                : "Choose a class to load students."}
            </p>
            {selectedClass && (
              <small className="muted-text">Use a familiar English name or classroom nickname. Do not enter a surname or other personal details.</small>
            )}
          </div>
        </div>

        {selectedClass && (
          <div className="teacher-roster-actionbar">
            <label className="teacher-dashboard-control">
              <span>Class display name</span>
              <input
                ref={newStudentInputRef}
                autoComplete="off"
                value={newStudentName}
                placeholder="English name or classroom nickname"
                onChange={event => setNewStudentName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") handleCreateStudent();
                }}
              />
            </label>
            <div className="teacher-roster-actions">
              <button className="lp-button lp-button-secondary" disabled={!newStudentName.trim()} onClick={handleCreateStudent} type="button">
                Add Student
              </button>
              <button
                className="lp-button lp-button-secondary"
                onClick={() => {
                  setShowRosterImport(current => !current);
                  setRosterImportPreview(null);
                }}
                type="button"
                aria-expanded={showRosterImport}
              >
                {showRosterImport ? "Close import" : "Import CSV"}
              </button>
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
              <button className="lp-button lp-button-primary" onClick={startStudentLogin} type="button">
                Student Login
              </button>
            </div>
          </div>
        )}

        {selectedClass && showRosterImport && (
          <section className="teacher-roster-import" aria-label="Import learner names">
            <div>
              <strong>Import a CSV roster</strong>
              <p>Use a first column named “name”, or paste one display name per line. Up to 40 new learners; surnames and other personal details should be removed first.</p>
              <label className="lp-button lp-button-secondary teacher-csv-file-button">
                <span>Choose CSV file</span>
                <input accept=".csv,text/csv" onChange={handleCsvFile} type="file" />
              </label>
            </div>
            <label>
              <span>Learner names</span>
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
                    <ul aria-label="Duplicate learner names">
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
                      : `Import ${rosterImportPreview.accepted.length} unique learners`}
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {selectedClass && studentRows.length > 0 && (
          <section className="teacher-roster-tools" aria-label="Roster search, sort, and filters">
            <label>
              <span>Search roster</span>
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
                <option value="all">All active learners</option>
                <option value="login-missing">Login pictures missing</option>
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
              Showing <strong>{visibleStudentRows.length}</strong> of {studentRows.length} active learners
            </p>
          </section>
        )}

        {selectedClass && !loadingStudents && studentRows.length > 0 && (
          <ClassHeatPanel rows={studentRows} />
        )}

        {!selectedClass ? (
          <div className="report-empty-state teacher-onboard-empty">
            <strong>Your roster will appear here.</strong>
            <p>Create a class above or continue from the setup checklist.</p>
            <button className="lp-button lp-button-primary" type="button" onClick={focusNewClassInput}>
              Create your first class
            </button>
          </div>
        ) : loadingStudents ? (
          <p className="muted-text">Loading students...</p>
        ) : studentRows.length === 0 ? (
          <div className="report-empty-state teacher-onboard-empty">
            <strong>Add your first student to {selectedClass.name}.</strong>
            <p>Add one learner above, or use Import names for a whole roster.</p>
            <button className="lp-button lp-button-primary" type="button" onClick={focusNewStudentInput}>
              Add your first student
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="dashboard-table teacher-roster-table">
              <thead>
                <tr>
                  <th>
                    <input
                      aria-label="Select all visible learners"
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
                  <th>Display name</th>
                  <th>Focus</th>
                  <th>Progress</th>
                  <th>Sound Seekers</th>
                  <th>Login</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudentRows.map(row => {
                  const progressPercent = getProgressPercent(row, skillTotal);
                  const loginReady = Boolean(row.symbol_password);
                  return (
                  <Fragment key={row.id}>
                  <tr className={loginReady ? "login-ready" : "login-missing"}>
                    <td>
                      <input
                        aria-label={`Select ${row.name}`}
                        type="checkbox"
                        checked={selectedRosterIds.includes(row.id)}
                        onChange={event => setSelectedRosterIds(previous => event.target.checked
                          ? [...new Set([...previous, row.id])]
                          : previous.filter(id => id !== row.id))}
                      />
                    </td>
                    <td>
                      <div className="teacher-student-cell">
                        <StudentInitial name={row.name} />
                        <div>
                          <strong>{row.name}</strong>
                          <span>{row.answered ? `${row.answered} answer${row.answered === 1 ? "" : "s"}` : "No practice yet"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="teacher-focus-pill">{row.currentSkill}</span>
                    </td>
                    <td>
                      <div className="teacher-progress-cell">
                        <div className="teacher-progress-line">
                          <strong>
                            {row.answered
                              ? `${row.masteredCount}/${skillTotal} mastered`
                              : "Not started"}
                          </strong>
                          {row.answered ? <span>{row.accuracy}%</span> : null}
                        </div>
                        <div className="teacher-progress-track" aria-hidden="true">
                          <span style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      {row.soundSeekers?.sessions ? (
                        <div className="teacher-quest-cell">
                          <strong>{row.soundSeekers.stopsCompleted}/40 trails</strong>
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
                    </td>
                    <td>
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
                    </td>
                    <td>{formatLastActive(row.lastActive)}</td>
                    <td>
                      <div className="teacher-row-actions">
                        <button className="lp-button lp-button-secondary teacher-open-student" onClick={() => onLoadStudent?.(row.id, row.name)} type="button">
                          Open learner
                        </button>
                        {classList.length > 1 && (
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => {
                              setRosterOperation({ kind: "transfer", student: row });
                              setOperationTargetClassId("");
                            }}
                          >
                            Transfer
                          </button>
                        )}
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => setRosterOperation({ kind: "archive", student: row })}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                  {heatOpenId === row.id && row.soundSeekers && (
                    <tr className="teacher-heat-row">
                      <td colSpan={8}>
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
            </table>
          </div>
        )}
      </section>}

      {isClassesPage && selectedClass && archivedStudentList.length > 0 && (
        <section className="teacher-archived-roster" aria-label="Archived learners">
          <details>
            <summary>Archived learners ({archivedStudentList.length})</summary>
            <p>Archived learners cannot sign in, but their evidence is retained. Restore one to return them to this class.</p>
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

      {isClassesPage && <section className="card page-stack question-type-guide" aria-label="Question type guide">
        <details>
          <summary>What each check actually tests</summary>
          <p className="muted-text">
            Every question format, in plain teacher language: what the child does, the literacy skill a
            correct answer proves, and what a miss usually means.
          </p>
          <div className="table-scroll">
            <table className="dashboard-table question-guide-table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>The child&hellip;</th>
                  <th>Skill it proves</th>
                  <th>If they miss it</th>
                </tr>
              </thead>
              <tbody>
                {QUESTION_TYPE_GUIDE.map(row => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.what}</td>
                    <td>{row.skill}</td>
                    <td>{row.onMiss}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>}

      {loginCardRows.length > 0 && (
        <div className="symbol-password-modal teacher-login-card-modal" role="dialog" aria-modal="true" aria-label="Login card preview">
          <div className="symbol-password-modal-card">
            <header>
              <div>
                <p className="panel-label">Print preview</p>
                <h3>{loginCardRows.length} login card{loginCardRows.length === 1 ? "" : "s"}</h3>
                <p>{schoolName || "School"} · {selectedClass?.name || "Class"}</p>
              </div>
              <button className="text-button" type="button" onClick={() => setLoginCardRows([])}>
                Close preview
              </button>
            </header>
            <div className="teacher-login-card-sheet">
              {loginCardRows.map(row => (
                <article className="teacher-print-login-card" key={row.id}>
                  <img src={logoUrl} alt="" />
                  <p>{schoolName || "School"}</p>
                  <h4>{row.name}</h4>
                  <span>{selectedClass?.name || "Class"} · Code {selectedClass?.access_code || "—"}</span>
                  <SymbolSequence sequence={row.symbol_password || ""} size={34} />
                  <small>{formatLoginCardPassword(row.symbol_password)}</small>
                </article>
              ))}
            </div>
            <button className="lp-button lp-button-primary" type="button" onClick={() => window.print()}>
              Print these cards
            </button>
          </div>
        </div>
      )}

      {rosterOperation && (
        <div
          className="symbol-password-modal teacher-roster-operation-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${rosterOperation.kind === "archive" ? "Archive" : "Transfer"} ${rosterOperation.student.name}`}
        >
          <div className="symbol-password-modal-card">
            <h3>
              {rosterOperation.kind === "archive"
                ? `Archive ${rosterOperation.student.name}?`
                : `Transfer ${rosterOperation.student.name}?`}
            </h3>
            {rosterOperation.kind === "archive" ? (
              <p>
                This removes the learner from active sign-in and class groups. Their complete evidence stays attached and can be restored.
              </p>
            ) : (
              <>
                <p>
                  The learner and their complete evidence history move together. Nothing is copied or deleted.
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
            <div className="teacher-roster-operation-actions">
              <button
                className={rosterOperation.kind === "archive" ? "lp-button lp-button-danger-outline" : "lp-button lp-button-primary"}
                type="button"
                disabled={operationBusy || (rosterOperation.kind === "transfer" && !operationTargetClassId)}
                onClick={confirmRosterOperation}
              >
                {operationBusy
                  ? "Saving..."
                  : rosterOperation.kind === "archive"
                    ? "Archive learner"
                    : "Transfer learner"}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={operationBusy}
                onClick={() => {
                  setRosterOperation(null);
                  setOperationTargetClassId("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="symbol-password-modal" role="dialog" aria-modal="true" aria-label={`Change password for ${editingStudent.name}`}>
          <div className="symbol-password-modal-card">
            <h3>Change {editingStudent.name}'s pictures</h3>
            <p className="muted-text">This child gate is teacher-visible by design; real data protection remains in the signed-in teacher account.</p>
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
        </div>
      )}
    </div>
  );
}
