import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { SymbolPasswordPad, SymbolSequence } from "./SymbolPasswordPad.jsx";
import { SchoolNameInput } from "./SchoolNameInput.jsx";
import { symbolIconByDigit } from "../data/symbolPasswordIcons.js";
import { printPracticePack, packStopIndex, packTargetLabel } from "../utils/worksheets/practicePack.js";
import { classHeatSummary } from "../utils/questReport.js";
import { QUESTION_TYPE_GUIDE } from "../data/questionTypeGuide.js";
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
  classList = [],
  selectedClassId,
  setSelectedClassId,
  setStudentList,
  studentList = [],
  loadingStudents = false,
  loadStudents,
  assignQuestPractice,
  clearQuestPractice,
  onLoadStudent,
  createClass,
  regenerateClassCode,
  newClassName,
  setNewClassName,
  createStudent,
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
  const newStudentInputRef = useRef(null);
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
        lastActive: dashboardRow.lastActive || student.lastActive || student.updated_at || student.created_at || null
      };
    }),
    [dashboardById, studentList]
  );
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

  const visibleStudentRows = rosterFilterIds
    ? studentRows.filter(row => rosterFilterIds.includes(row.id))
    : studentRows;

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

  function printLoginCards() {
    const printableRows = studentRows
      .map(row => {
        const password = formatLoginCardPassword(row.symbol_password);
        return `${selectedClass?.name || "Class"} | ${row.name} | ${password}`;
      })
      .join("\n");
    const win = window.open("", "student-login-cards", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>Login Cards</title><style>
        body{font-family:Arial,sans-serif;padding:24px}
        pre{white-space:pre-wrap;font-size:18px;line-height:1.7}
      </style></head><body>
      <h1>${selectedClass?.name || "Class"} Login Cards</h1>
      <pre>${printableRows}</pre>
      </body></html>
    `);
    win.document.close();
    win.print();
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
            <p className="panel-label">Dashboard</p>
          </div>
          <h2>{selectedClass ? selectedClass.name : "Class roster"}</h2>
          <p>{selectedClass ? "Manage students, logins, progress, and next actions from one place." : "Select or create a class to begin."}</p>
        </div>
        <div className="teacher-dashboard-context" aria-label="Current school and class">
          <span>School</span>
          <strong>{hasSchool ? schoolName : "Not set"}</strong>
          <small>{selectedClass ? `${studentRows.length} student${studentRows.length === 1 ? "" : "s"}` : className}</small>
        </div>
        {selectedClass?.access_code && (
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
        {selectedClass && (
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

      {selectedClass && (
        <section className="teacher-roster-metrics" aria-label="Class summary">
          <RosterMetric label="Students" value={studentRows.length} />
          <RosterMetric label="Logins ready" value={`${loginReadyCount}/${studentRows.length || 0}`} tone={loginReadyCount === studentRows.length && studentRows.length ? "good" : ""} />
          <RosterMetric label="Started" value={`${startedCount}/${studentRows.length || 0}`} />
          <RosterMetric label="Avg accuracy" value={averageAccuracy === null ? "-" : `${averageAccuracy}%`} />
          <RosterMetric label="Active today" value={activeTodayCount} />
        </section>
      )}

      <section className="teacher-dashboard-controls" aria-label="Class controls">
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
        </div>

        {saveSchool && (
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

      {selectedClass && actionCards.length > 0 && (
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

      {rosterFilterIds && (
        <div className="teacher-roster-filter-chip">
          <span>Showing {visibleStudentRows.length} of {studentRows.length} students</span>
          <button className="text-button" type="button" onClick={() => setRosterFilterIds(null)}>
            Show all
          </button>
        </div>
      )}

      <section className="teacher-dashboard-roster" aria-label="Students">
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
              <button className="lp-button lp-button-secondary" disabled={!studentRows.length} onClick={printLoginCards} type="button">
                Print Cards
              </button>
              <button className="lp-button lp-button-primary" onClick={startStudentLogin} type="button">
                Student Login
              </button>
            </div>
          </div>
        )}

        {selectedClass && !loadingStudents && studentRows.length > 0 && (
          <ClassHeatPanel rows={studentRows} />
        )}

        {!selectedClass ? (
          <div className="report-empty-state teacher-onboard-empty">
            <div className="teacher-onboard-steps" aria-hidden="true">
              <span className="active">1. Create a class</span>
              <span>2. Add students</span>
              <span>3. Start a check</span>
            </div>
            <strong>Welcome! Let&rsquo;s set up your class.</strong>
            <p>Create a class above to get started — then you can add your students and begin.</p>
          </div>
        ) : loadingStudents ? (
          <p className="muted-text">Loading students...</p>
        ) : studentRows.length === 0 ? (
          <div className="report-empty-state teacher-onboard-empty">
            <div className="teacher-onboard-steps" aria-hidden="true">
              <span className="done">1. Create a class</span>
              <span className="active">2. Add students</span>
              <span>3. Start a check</span>
            </div>
            <strong>Add your first student to {selectedClass.name}.</strong>
            <p>Add an English name or classroom nickname, then set their three login pictures.</p>
            <button className="lp-button lp-button-primary" type="button" onClick={focusNewStudentInput}>
              Add your first student
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="dashboard-table teacher-roster-table">
              <thead>
                <tr>
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
                      <button className="lp-button lp-button-secondary teacher-open-student" onClick={() => onLoadStudent?.(row.id, row.name)} type="button">
                        Open
                      </button>
                    </td>
                  </tr>
                  {heatOpenId === row.id && row.soundSeekers && (
                    <tr className="teacher-heat-row">
                      <td colSpan={7}>
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
      </section>

      <section className="card page-stack question-type-guide" aria-label="Question type guide">
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
      </section>

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
