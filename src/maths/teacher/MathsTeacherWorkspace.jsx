import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowsClockwise,
  Books,
  CalendarCheck,
  ChartBar,
  ChartLine,
  CheckSquareOffset,
  ClipboardText,
  Printer,
  ProjectorScreen,
  ShieldCheck,
  Sparkle,
  UsersThree,
  WarningCircle
} from "@phosphor-icons/react";
import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";
import { mathsActivityRecipesBySkill, MATHS_CONTENT_VERSION } from "../learn/mathsActivityRecipes.js";
import { MathsManipulative } from "../manipulatives/MathsManipulative.jsx";
import { createManipulativeState } from "../manipulatives/mathsManipulatives.js";
import { mathsStories } from "../stories/mathsStoryCatalog.js";
import { mathsSongs } from "../music/mathsSongs.js";
import { mathsGames } from "../games/mathsGames.js";
import { readTeacherMathsEvidence, readTeacherMathsSyncHealth, recordTeacherMathsEvidence } from "../data/mathsEvidenceStore.js";
import {
  buildMathsActionGroups,
  buildMathsClassGroups,
  buildMathsClassReport,
  buildMathsLearnerReport,
  buildMathsTeachingPriorities,
  MATHS_EVIDENCE_SOURCE_LABELS,
  MATHS_EVIDENCE_STATUSES
} from "../reporting/mathsReporting.js";
import { MathsAudioButton, MathsSongPlayer } from "../media/MathsAudioButton.jsx";
import { buildMathsWorksheetTasks, MATHS_WORKSHEET_LEVELS, worksheetTemplatesForSkill } from "./mathsWorksheetTasks.js";
import { buildMathsSmallGroupPlan, MATHS_PRESENTATION_MODE_LABELS, MATHS_PRESENTATION_PROFILES } from "./mathsTeachingPlans.js";
import "../../styles/maths-platform.css";
import "../../styles/maths-platform-v2.css";
import "../../styles/maths-teacher-action-workspace.css";

const MODE_COPY = {
  overview: ["Maths teaching", "Plan, teach, check and respond from one evidence-safe workspace."],
  assessments: ["Maths skills checks", "Short formative checks across the eight approved Foundation number skills."],
  reports: ["Maths reports", "Evidence basis, representations, freshness, possible patterns and next teaching actions."],
  resources: ["Maths resources", "Lessons, number stories, classroom chants, games and family activities."],
  present: ["Maths presentation", "Whole-class number talks with controlled reveal and representation switching."],
  worksheets: ["Maths worksheet studio", "Print-ready, grayscale-safe practice with an answer page."],
  groups: ["Small-group composer", "Create a teachable routine from real class evidence or teacher choice."]
};

const MATHS_SOURCE_OPTIONS = Object.freeze([
  "maths_skills_check",
  "small_group_exit",
  "maths_arcade",
  "lesson_player",
  "maths_number_story"
]);

function storeMathsIntent(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation still works */ }
}

function activityName(activityType, skillId, alignedStory, alignedGame) {
  if (activityType === "skills_check") return `Skills check: ${mathsSkillById[skillId].childLabel}`;
  if (activityType === "number_story") return alignedStory?.title || "Number story";
  if (activityType === "game") return alignedGame?.title || "Practice game";
  return `Guided lesson: ${mathsSkillById[skillId].childLabel}`;
}

function Header({ mode, className, studentCount }) {
  const [title, description] = MODE_COPY[mode];
  return <header className="maths-workspace-header maths-workspace-header-v2"><div><p><Sparkle aria-hidden="true" size={16} weight="fill" /> Foundation number sense</p><h1>{title}</h1><span>{description}</span></div><div className="maths-class-chip maths-class-chip-v2"><UsersThree aria-hidden="true" size={28} weight="duotone" /><span><strong>{className || "Choose a class"}</strong>{Number.isInteger(studentCount) && <small>{studentCount} learners</small>}</span></div></header>;
}

export function MathsWorkspaceNav({ onNavigate }) {
  const cards = [
    ["present", "Present", "Lead a number talk", ProjectorScreen], ["groups", "Small groups", "Compose a targeted lesson", UsersThree],
    ["assessments", "Skills checks", "Choose a formative check", ClipboardText], ["reports", "Reports", "See evidence and next actions", ChartBar],
    ["worksheets", "Worksheets", "Build and print practice", Printer], ["resources", "Resource library", "Stories, songs and games", Books]
  ];
  return <div className="maths-tool-grid maths-tool-grid-v2">{cards.map(([mode, title, description, Icon], index) => <button key={mode} onClick={() => onNavigate(mode)} type="button"><span><Icon aria-hidden="true" size={28} weight="duotone" /></span><strong>{title}</strong><small>{description}</small><em>{index === 0 ? "Open next" : "Open"} <ArrowRight aria-hidden="true" size={16} /></em></button>)}</div>;
}

function Overview({ classId, client, onNavigate, students = [] }) {
  const [state, setState] = useState(classId ? "loading" : "no-class");
  const [priorities, setPriorities] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const load = async () => {
    if (!classId || !client?.call) { setState(classId ? "error" : "no-class"); return; }
    setState("loading");
    try {
      const [evidenceResult, assignmentResult] = await Promise.all([
        readTeacherMathsEvidence({ client, classId, limit: 20_000, returnMetadata: true }),
        client.call("teacher_list_maths_assignments", { p_class_id: classId, p_include_archived: false })
      ]);
      if (!evidenceResult.complete) { setState("incomplete"); return; }
      if (assignmentResult.error || !assignmentResult.data?.ok) throw assignmentResult.error || new Error("assignment_read_failed");
      setPriorities(buildMathsTeachingPriorities(evidenceResult.events, students));
      setAssignments(Array.isArray(assignmentResult.data.assignments) ? assignmentResult.data.assignments : []);
      setState("ready");
    } catch { setState("error"); }
  };
  useEffect(() => {
    let current = true;
    if (!classId || !client?.call) return undefined;
    Promise.all([
      readTeacherMathsEvidence({ client, classId, limit: 20_000, returnMetadata: true }),
      client.call("teacher_list_maths_assignments", { p_class_id: classId, p_include_archived: false })
    ]).then(([evidenceResult, assignmentResult]) => {
      if (!current) return;
      if (!evidenceResult.complete) { setState("incomplete"); return; }
      if (assignmentResult.error || !assignmentResult.data?.ok) throw assignmentResult.error || new Error("assignment_read_failed");
      setPriorities(buildMathsTeachingPriorities(evidenceResult.events, students));
      setAssignments(Array.isArray(assignmentResult.data.assignments) ? assignmentResult.data.assignments : []);
      setState("ready");
    }).catch(() => { if (current) setState("error"); });
    return () => { current = false; };
  }, [classId, client, students]);
  const overviewState = !classId ? "no-class" : !client?.call ? "error" : state;
  const openPriority = priority => {
    if (priority.kind === "teach") {
      storeMathsIntent("lp-maths-group-intent", { skillId: priority.skillId, studentIds: priority.studentIds });
      onNavigate("groups");
      return;
    }
    if (priority.kind === "check") {
      storeMathsIntent("lp-maths-resource-intent", { skillId: priority.skillId, activityType: "skills_check", studentIds: priority.studentIds });
      onNavigate("resources");
      return;
    }
    onNavigate("reports");
  };
  const incompleteAssignments = assignments.filter(assignment => Number(assignment.completedCount || 0) < Number(assignment.assignedCount || 0));
  return <div className="maths-overview-v2 maths-action-overview">
    <section className="maths-action-board" aria-labelledby="maths-action-heading">
      <header><div><p className="maths-stage-label">Teaching priorities</p><h2 id="maths-action-heading">What needs attention next?</h2><span>Suggestions use the evidence currently visible for this class. You choose the teaching response.</span></div><button onClick={load} type="button"><ArrowsClockwise aria-hidden="true" size={18} /> Refresh</button></header>
      {overviewState === "no-class" && <div className="maths-action-state"><UsersThree aria-hidden="true" size={28} /><div><strong>Choose a class to see teaching priorities</strong><span>Evidence is never combined across classes.</span></div></div>}
      {overviewState === "loading" && <div aria-label="Loading teaching priorities" className="maths-action-skeleton" role="status"><i /><i /><i /></div>}
      {overviewState === "incomplete" && <div className="maths-action-state is-warning" role="alert"><WarningCircle aria-hidden="true" size={28} /><div><strong>Narrow the evidence before using suggestions</strong><span>This class has more evidence than can be safely grouped in one view. Open Reports and apply a date or source filter.</span></div><button onClick={() => onNavigate("reports")} type="button">Open reports</button></div>}
      {overviewState === "error" && <div className="maths-action-state is-warning" role="alert"><WarningCircle aria-hidden="true" size={28} /><div><strong>Priorities could not be loaded</strong><span>No learner has been treated as missing or needing support.</span></div><button onClick={load} type="button">Try again</button></div>}
      {overviewState === "ready" && <div className="maths-priority-list">{priorities.map((priority, index) => <article key={priority.id}><span aria-hidden="true">{index + 1}</span><div><small>{priority.kind === "teach" ? "Shared next action" : priority.kind === "check" ? "Neutral evidence gap" : "Teacher review"}</small><h3>{priority.title}</h3><p>{priority.summary}</p>{priority.checkQuestion && <em>{priority.checkQuestion}</em>}</div><button onClick={() => openPriority(priority)} type="button">{priority.kind === "teach" ? "Plan group" : priority.kind === "check" ? "Prepare check" : "Review evidence"}<ArrowRight aria-hidden="true" size={16} /></button></article>)}</div>}
    </section>
    {overviewState === "ready" && <section className="maths-assignment-attention" aria-label="Assignment attention"><div><CalendarCheck aria-hidden="true" size={25} weight="duotone" /><span><strong>{incompleteAssignments.length} active assignment{incompleteAssignments.length === 1 ? "" : "s"} still in progress</strong><small>{incompleteAssignments.length ? "Review recipients, completion and due dates." : "There are no unfinished assignments."}</small></span></div><button onClick={() => onNavigate("resources")} type="button">Manage assignments</button></section>}
    <section className="maths-overview-shortcuts"><h2>Teaching tools</h2><div><button onClick={() => onNavigate("present")} type="button"><ProjectorScreen aria-hidden="true" size={23} /><span><strong>Present</strong><small>Lead a number talk</small></span></button><button onClick={() => onNavigate("reports")} type="button"><ChartBar aria-hidden="true" size={23} /><span><strong>Reports</strong><small>Inspect the evidence</small></span></button><button onClick={() => onNavigate("resources")} type="button"><Books aria-hidden="true" size={23} /><span><strong>Resources</strong><small>Assign or print practice</small></span></button></div></section>
    <section className="maths-evidence-boundary"><ShieldCheck aria-hidden="true" size={25} weight="duotone" /><p><strong>Evidence boundary:</strong> Practice and short checks suggest what to teach next. They do not diagnose a learner or create a mastery score. Maths does not record a child’s voice or image.</p></section>
  </div>;
}

function AssignmentBuilder({ client, classId, students }) {
  const intent = (() => { try { return JSON.parse(sessionStorage.getItem("lp-maths-resource-intent") || "null"); } catch { return null; } })();
  const [skillId, setSkillId] = useState(() => APPROVED_FOUNDATION_SKILL_IDS.includes(intent?.skillId) ? intent.skillId : "F-N-PART-10");
  const [activityType, setActivityType] = useState(() => ["lesson", "skills_check", "number_story", "game"].includes(intent?.activityType) ? intent.activityType : "lesson");
  const [selected, setSelected] = useState(() => {
    const allowed = new Set(students.map(student => student.id));
    return Array.isArray(intent?.studentIds) ? intent.studentIds.filter(id => allowed.has(id)) : [];
  });
  const [dueAt, setDueAt] = useState("");
  const [state, setState] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [listState, setListState] = useState(classId ? "loading" : "no-class");
  const alignedStory = mathsStories.find(item => (
    item.skillIds.includes(skillId) && item.releaseStatus === "approved"
  ));
  const alignedGame = mathsGames.find(game => game.skillIds.includes(skillId));
  useEffect(() => {
    try { sessionStorage.removeItem("lp-maths-resource-intent"); } catch { /* storage is optional */ }
  }, []);
  const changeSkill = nextSkillId => {
    const nextStory = mathsStories.find(item => item.skillIds.includes(nextSkillId) && item.releaseStatus === "approved");
    const nextGame = mathsGames.find(game => game.skillIds.includes(nextSkillId));
    setSkillId(nextSkillId);
    setConfirming(false);
    if (activityType === "number_story" && !nextStory) setActivityType("lesson");
    if (activityType === "game" && !nextGame) setActivityType("lesson");
  };
  const refreshAssignments = async ({ showLoading = true } = {}) => {
    if (!classId) { setListState("no-class"); return; }
    if (!client?.call) { setListState("error"); return; }
    if (showLoading) setListState("loading");
    try {
      const { data, error } = await client.call("teacher_list_maths_assignments", { p_class_id: classId, p_include_archived: false });
      if (error || !data?.ok) throw error || new Error(data?.error || "assignment_read_failed");
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
      setListState("ready");
    } catch {
      setListState("error");
    }
  };
  useEffect(() => {
    let current = true;
    if (!classId || !client?.call) return undefined;
    client.call("teacher_list_maths_assignments", { p_class_id: classId, p_include_archived: false })
      .then(({ data, error }) => {
        if (!current) return;
        if (error || !data?.ok) throw error || new Error(data?.error || "assignment_read_failed");
        setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
        setListState("ready");
      })
      .catch(() => { if (current) setListState("error"); });
    return () => { current = false; };
  }, [classId, client]);
  const create = async () => {
    if (!classId || !selected.length) { setState("Choose a class and at least one learner."); return; }
    if (activityType === "number_story" && !alignedStory) {
      setState("No released number story matches this learning goal yet. Choose another goal or activity.");
      return;
    }
    if (activityType === "game" && !alignedGame) {
      setState("No released practice game matches this learning goal yet. Choose another goal or activity.");
      return;
    }
    setState("Assigning…");
    const activityId = activityType === "lesson"
      ? mathsActivityRecipesBySkill[skillId][0].id
      : activityType === "skills_check"
        ? `check:${skillId}`
        : activityType === "game"
          ? alignedGame.id
          : alignedStory.id;
    const title = `${mathsSkillById[skillId].childLabel} · ${activityType.replaceAll("_", " ")}`;
    try {
      const { data, error } = await client.call("teacher_create_maths_assignment", {
        p_class_id: classId, p_skill_id: skillId, p_activity_type: activityType,
        p_activity_id: activityId, p_title: title, p_student_ids: selected,
        p_due_at: dueAt ? new Date(`${dueAt}T23:59:00`).toISOString() : null
      });
      if (error || !data?.ok) setState("The assignment could not be created. Your choices are still here.");
      else {
        setState(`Assigned to ${data.assignedCount || selected.length} learners.`);
        setSelected([]);
        setConfirming(false);
        await refreshAssignments();
      }
    } catch {
      setState("The assignment could not be created. Your choices are still here.");
    }
  };
  const archive = async id => {
    setState("Archiving…");
    try {
      const { data, error } = await client.call("teacher_archive_maths_assignment", { p_class_id: classId, p_assignment_id: id });
      if (error || !data?.ok) throw error || new Error(data?.error || "archive_failed");
      setState("Assignment archived.");
      await refreshAssignments();
    } catch { setState("The assignment could not be archived."); }
  };
  const updateDueAt = async (assignment, nextDate) => {
    setState("Updating due date…");
    try {
      const { data, error } = await client.call("teacher_update_maths_assignment_due_at", { p_class_id: classId, p_assignment_id: assignment.id, p_due_at: nextDate ? new Date(`${nextDate}T23:59:00`).toISOString() : null });
      if (error || !data?.ok) throw error || new Error(data?.error || "due_update_failed");
      setState("Due date updated.");
      await refreshAssignments({ showLoading: false });
    } catch { setState("The due date could not be updated."); }
  };
  const duplicate = async assignment => {
    setState("Duplicating assignment…");
    try {
      const { data, error } = await client.call("teacher_duplicate_maths_assignment", { p_class_id: classId, p_assignment_id: assignment.id, p_due_at: null });
      if (error || !data?.ok) throw error || new Error(data?.error || "duplicate_failed");
      setState(`Duplicated for ${data.assignedCount || assignment.assignedCount} learners. Add a due date if needed.`);
      await refreshAssignments();
    } catch { setState("The assignment could not be duplicated."); }
  };
  const selectedStudents = students.filter(student => selected.includes(student.id));
  const effectiveListState = !classId ? "no-class" : !client?.call ? "error" : listState;
  const activity = activityName(activityType, skillId, alignedStory, alignedGame);
  const changeSelection = (studentId, checked) => {
    setSelected(ids => checked ? [...new Set([...ids, studentId])] : ids.filter(id => id !== studentId));
    setConfirming(false);
  };
  const review = () => {
    if (!classId) { setState("Choose a class before assigning work."); return; }
    if (!selected.length) { setState("Choose at least one learner before reviewing the assignment."); return; }
    setState("");
    setConfirming(true);
  };
  return <section className="maths-assignment-builder maths-assignment-builder-action"><div className="maths-section-title"><div><p>Cloud-saved student worklist</p><h2>Assign Maths practice</h2><span>Start with no learners selected, then review the exact activity and recipients before saving.</span></div></div>
    {!classId && <div className="maths-builder-state" role="status"><UsersThree aria-hidden="true" size={25} /><div><strong>Choose a class first</strong><span>An assignment cannot be created without a class.</span></div></div>}
    <div className="maths-assignment-form"><label>Learning goal<select disabled={!classId} value={skillId} onChange={event => changeSkill(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><label>Activity<select disabled={!classId} value={activityType} onChange={event => { setActivityType(event.target.value); setConfirming(false); }}><option value="lesson">Maths lesson</option><option value="skills_check">Skills check</option><option disabled={!alignedGame} value="game">Practice game{alignedGame ? "" : " (not released for this goal)"}</option><option disabled={!alignedStory} value="number_story">Number story{alignedStory ? "" : " (not released for this goal)"}</option></select></label><label>Due date (optional)<input disabled={!classId} type="date" value={dueAt} onChange={event => { setDueAt(event.target.value); setConfirming(false); }} /></label></div>
    <fieldset className="maths-assignment-learners" disabled={!classId || !students.length}><legend>Learners ({selected.length} selected)</legend>{students.length > 0 ? <><button onClick={() => { setSelected(students.map(student => student.id)); setConfirming(false); }} type="button">Select all</button><button disabled={!selected.length} onClick={() => { setSelected([]); setConfirming(false); }} type="button">Clear</button><div>{students.map(student => <label key={student.id}><input checked={selected.includes(student.id)} onChange={event => changeSelection(student.id, event.target.checked)} type="checkbox" />{student.name}</label>)}</div></> : <div className="maths-assignment-empty-roster"><strong>No learners in this class</strong><span>Add learners before creating an assignment.</span></div>}</fieldset>
    {!confirming && <button className="maths-primary" disabled={!classId || !selected.length} onClick={review} type="button">Review assignment</button>}
    {confirming && <section aria-labelledby="maths-assignment-confirm-heading" className="maths-assignment-confirm"><header><CheckSquareOffset aria-hidden="true" size={28} weight="duotone" /><div><p>Confirm before assigning</p><h3 id="maths-assignment-confirm-heading">{activity}</h3></div></header><dl><div><dt>Recipients</dt><dd>{selectedStudents.map(student => student.name).join(", ")}</dd></div><div><dt>Due</dt><dd>{dueAt ? new Date(`${dueAt}T12:00:00`).toLocaleDateString() : "No due date"}</dd></div><div><dt>Evidence use</dt><dd>{activityType === "skills_check" ? "Checked-item evidence for teacher review" : "Practice evidence only"}</dd></div></dl><div><button className="maths-primary" onClick={create} type="button">Confirm assignment</button><button onClick={() => setConfirming(false)} type="button">Go back</button></div></section>}
    <p aria-live="polite" role="status">{state}</p>
    <section className="maths-assignment-manager"><div><h3>Active assignments</h3><button disabled={effectiveListState === "loading" || !classId} onClick={() => refreshAssignments()} type="button"><ArrowsClockwise aria-hidden="true" size={17} /> Refresh</button></div>
      {effectiveListState === "no-class" && <div className="maths-manager-state"><strong>No class selected</strong><span>Choose a class to load its active assignments.</span></div>}
      {effectiveListState === "loading" && <div aria-label="Loading active assignments" className="maths-manager-skeleton" role="status"><i /><i /></div>}
      {effectiveListState === "error" && <div className="maths-manager-state is-error" role="alert"><strong>Assignments could not be loaded</strong><span>Nothing was changed.</span><button onClick={() => refreshAssignments()} type="button">Try again</button></div>}
      {effectiveListState === "ready" && !assignments.length && <div className="maths-manager-state"><strong>No active Maths assignments</strong><span>Prepared work will appear here after it is assigned.</span></div>}
      {effectiveListState === "ready" && assignments.map(assignment => {
        const assignedCount = Number(assignment.assignedCount || 0);
        const completedCount = Math.min(Number(assignment.completedCount || 0), assignedCount);
        const learnerNames = Array.isArray(assignment.learners) ? assignment.learners.map(learner => learner.name).filter(Boolean) : [];
        const recipientCopy = learnerNames.length ? learnerNames.join(", ") : `${assignedCount} learner${assignedCount === 1 ? "" : "s"} assigned`;
        return <article key={assignment.id}><div><strong>{assignment.title}</strong><small>{recipientCopy}</small><span>{completedCount} of {assignedCount} complete</span></div><progress aria-label={`${completedCount} of ${assignedCount} complete`} max={assignedCount || 1} value={completedCount} /><div className="maths-assignment-operations"><label>Due date<input aria-label={`Due date for ${assignment.title}`} defaultValue={assignment.dueAt ? String(assignment.dueAt).slice(0, 10) : ""} min={new Date().toISOString().slice(0, 10)} onChange={event => updateDueAt(assignment, event.target.value)} type="date" /></label><button onClick={() => duplicate(assignment)} type="button">Duplicate</button><button onClick={() => archive(assignment.id)} type="button">Archive</button></div></article>;
      })}
    </section>
  </section>;
}

function CheckLauncher({ onNavigate }) {
  const assignCheck = skillId => {
    try { sessionStorage.setItem("lp-maths-resource-intent", JSON.stringify({ skillId, activityType: "skills_check" })); } catch { /* navigation still works */ }
    onNavigate("resources");
  };
  return <section className="maths-resource-list"><div className="maths-section-title"><div><p>Short, untimed and formative</p><h2>Choose the learning goal</h2></div></div>{APPROVED_FOUNDATION_SKILL_IDS.map(skillId => <article key={skillId}><div><small>Six decisions · varied pictures · “Not sure yet” is neutral</small><h3>{mathsSkillById[skillId].childLabel}</h3><p>{mathsSkillById[skillId].teacherIntent}</p></div><button onClick={() => assignCheck(skillId)} type="button">Assign check</button></article>)}</section>;
}

function AudioIssueQueue({ client, classId }) {
  const [issues, setIssues] = useState([]);
  const [state, setState] = useState("loading");
  const load = async () => {
    if (!client?.call) { setState("error"); return; }
    setState("loading");
    try {
      const { data, error } = await client.call("teacher_list_maths_media_issues", { p_class_id: classId || null, p_include_reviewed: false });
      if (error || !data?.ok) throw error || new Error(data?.error || "issue_read_failed");
      setIssues(Array.isArray(data.issues) ? data.issues : []);
      setState("ready");
    } catch { setState("error"); }
  };
  useEffect(() => {
    let current = true;
    if (!client?.call) return undefined;
    client.call("teacher_list_maths_media_issues", { p_class_id: classId || null, p_include_reviewed: false })
      .then(({ data, error }) => {
        if (!current) return;
        if (error || !data?.ok) throw error || new Error(data?.error || "issue_read_failed");
        setIssues(Array.isArray(data.issues) ? data.issues : []);
        setState("ready");
      })
      .catch(() => { if (current) setState("error"); });
    return () => { current = false; };
  }, [classId, client]);
  const resolve = async (issue, resolution) => {
    setState("saving");
    try {
      const { data, error } = await client.call("teacher_resolve_maths_media_issue", { p_issue_id: issue.id, p_resolution: resolution });
      if (error || !data?.ok) throw error || new Error(data?.error || "issue_update_failed");
      await load();
    } catch { setState("error"); }
  };
  return <section className="maths-audio-issue-queue"><div className="maths-section-title"><div><p>Teacher review workflow</p><h2>Flagged Maths audio</h2></div><button onClick={load} type="button">Refresh</button></div>{state === "loading" && <p role="status">Loading flagged clips…</p>}{state === "saving" && <p role="status">Saving review…</p>}{state === "error" && <p role="alert">The audio issue queue could not be loaded. Nothing was marked as reviewed.</p>}{state === "ready" && !issues.length && <div className="maths-empty-state"><h3>No clips need review</h3><p>Learner and teacher reports will appear here with the exact clip and reason.</p></div>}{issues.map(issue => <article key={issue.id}><div><strong>{issue.audioId}</strong><small>{issue.studentName ? `${issue.studentName} · ` : ""}{new Date(issue.createdAt).toLocaleString()}</small><p>{issue.reason}</p><MathsAudioButton client={client} compact label="Play reported clip" requestId={issue.audioId} /></div><div><button onClick={() => resolve(issue, "playback_verified")} type="button">Playback is clear</button><button onClick={() => resolve(issue, "replacement_requested")} type="button">Request replacement</button><button onClick={() => resolve(issue, "not_reproducible")} type="button">Could not reproduce</button></div></article>)}</section>;
}

function ResourceLibrary({ client, classId, students }) {
  const rosterKey = `${classId}:${students.map(student => student.id).join(",")}`;
  const [section, setSection] = useState("assign");
  return <div className="maths-library-sections"><nav aria-label="Maths resource sections" className="maths-library-nav">{[["assign", "Assign"], ["lessons", "Lessons"], ["stories", "Stories"], ["play", "Chants and games"], ["family", "Family"], ["audio", "Audio review"]].map(([id, label]) => <button aria-pressed={section === id} key={id} onClick={() => setSection(id)} type="button">{label}</button>)}</nav>{section === "assign" && <AssignmentBuilder key={rosterKey} classId={classId} client={client} students={students} />}{section === "lessons" && <section><div className="maths-section-title"><div><p>40 structured activities</p><h2>Lesson recipes</h2></div></div><div className="maths-compact-grid">{APPROVED_FOUNDATION_SKILL_IDS.map(skillId => <article key={skillId}><strong>{mathsSkillById[skillId].childLabel}</strong><span>{mathsActivityRecipesBySkill[skillId].length} activities</span><small>Retrieve · model · make · apply · transfer</small><MathsAudioButton client={client} compact requestId={mathsActivityRecipesBySkill[skillId][0].instructionAudioId} /></article>)}</div></section>}{section === "stories" && <section><div className="maths-section-title"><div><p>Original number narratives</p><h2>Number stories</h2></div></div><div className="maths-compact-grid">{mathsStories.map(story => <article key={story.id}><span className={`maths-release-pill is-${story.releaseStatus}`}>{story.releaseStatus === "approved" ? "Released" : "Curriculum pending"}</span><strong>{story.title}</strong><small>{story.mathsPromise}</small>{story.releaseStatus === "approved" && <MathsAudioButton client={client} compact label="Hear page one" requestId={`story:${story.id}:page:1`} />}</article>)}</div></section>}{section === "play" && <section><div className="maths-section-title"><div><p>Movement and retrieval</p><h2>Classroom chants and games</h2></div></div><div className="maths-compact-grid">{mathsSongs.map(item => <article key={item.id}><strong>{item.title}</strong><small>{item.tempo} BPM original classroom chant</small><MathsSongPlayer client={client} compact song={item} /></article>)}{mathsGames.map(item => <article key={item.id}><strong>{item.title}</strong><small>{item.rounds} untimed decisions · {item.skillIds.map(id => mathsSkillById[id]?.childLabel).join(" · ")}</small></article>)}</div></section>}{section === "family" && <FamilyBridge />}{section === "audio" && <AudioIssueQueue classId={classId} client={client} />}</div>;
}

function FamilyBridge() {
  const [skillId, setSkillId] = useState("F-N-PART-10");
  const activity = {
    "F-N-SEQ-20": "Write 0 to 10 on scraps of paper. Mix them, rebuild the line, then hide one number and ask what is missing.",
    "F-N-COUNT-10": "Find up to ten safe household objects. Move each object once while counting. Ask: ‘How many altogether?’",
    "F-N-COUNT-20": "Find a larger collection. Make a group of ten first, then count on for the extras.",
    "F-N-SUBITISE-5": "Show up to five fingers for two seconds. Hide them and ask: ‘How many did you see? How did you see it?’",
    "F-N-MATCH": "Choose a numeral from 1 to 10 and make a matching collection with safe objects.",
    "F-N-COMPARE": "Make two small collections. Match objects one-to-one and ask which has more, fewer or the same.",
    "F-N-PART-5": "Put five safe objects on two plates. Move one object and say both parts and the whole.",
    "F-N-PART-10": "Find ten safe objects. Put six on one plate and the rest on another. Ask: ‘How many are on each plate? How many altogether?’"
  }[skillId];
  const [copyState, setCopyState] = useState("");
  const print = () => window.print();
  const copy = async () => {
    const text = `Literacy Guide Maths · ${mathsSkillById[skillId].childLabel}\n\n${activity}\n\nNotice the strategy, not speed. No account, app login, child photo or recording is needed.`;
    try { await navigator.clipboard.writeText(text); setCopyState("Family activity copied."); } catch { setCopyState("Copy was blocked. Print the family card instead."); }
  };
  return <section className="maths-family-bridge" id="maths-family-bridge"><div><p>No family account · no child media</p><h2>Five-minute Family Bridge</h2></div><p className="maths-family-access"><strong>How families access it:</strong> send the printed card or paste the copied activity into your usual family message. It contains the complete activity, so there is no book link or sign-in to find.</p><label>Learning goal<select onChange={event => setSkillId(event.target.value)} value={skillId}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><article><strong>Try this together</strong><p>{activity}</p><small>Notice the strategy, not speed. Stop while it still feels warm and successful.</small></article><div className="maths-family-actions"><button onClick={print} type="button">Print complete family card</button><button onClick={copy} type="button">Copy complete activity</button></div><p role="status">{copyState}</p></section>;
}

function seededManipulativeState(id, quantity) {
  const state = createManipulativeState(id, { maximum: Math.max(5, quantity) });
  if (id === "counter_tray") return { ...state, counters: Array.from({ length: quantity }, (_, index) => ({ id: `counter-${index + 1}`, groupId: "a", slot: index })) };
  if (["five_frame", "ten_frame"].includes(id)) return { ...state, cells: state.cells.map((_, index) => index < quantity ? "part_a" : "empty") };
  if (id === "number_line") return { ...state, current: quantity, jumps: quantity ? [{ from: 0, to: quantity, direction: "forward", magnitude: quantity }] : [] };
  if (id === "part_whole") return { ...state, whole: quantity, parts: [Math.floor(quantity / 2), Math.ceil(quantity / 2)] };
  return state;
}

function PresentationModels({ profile, quantity, mode }) {
  const primaryId = profile.model === "number_line" ? "number_line"
    : profile.model === "part_whole" ? "part_whole"
      : profile.model === "compare" ? "ten_frame"
        : profile.model === "double_ten_frame" ? "ten_frame"
          : profile.model === "numeral_match" ? "ten_frame"
            : profile.model === "two_colour_frame" ? "ten_frame"
              : profile.model;
  const representedWhole = profile.fixedWhole || quantity;
  const maximum = profile.model === "double_ten_frame" ? 20 : profile.fixedWhole || profile.maximum;
  const primaryState = seededManipulativeState(primaryId, representedWhole);
  if (profile.model === "part_whole") primaryState.parts = [quantity, representedWhole - quantity];
  if (profile.model === "two_colour_frame") {
    primaryState.cells = primaryState.cells.map((_, index) => index < quantity ? "part_a" : index < representedWhole ? "part_b" : "empty");
  }
  if (profile.model === "compare") {
    const other = Math.max(profile.minimum, quantity - 2);
    return <div className="maths-presentation-model-pair" aria-label={`Compare ${quantity} and ${other}`}><MathsManipulative id="ten_frame" initialState={seededManipulativeState("ten_frame", quantity)} key={`left-${quantity}`} maximum={10} mode="presentation" /><MathsManipulative id="ten_frame" initialState={seededManipulativeState("ten_frame", other)} key={`right-${other}`} maximum={10} mode="presentation" /></div>;
  }
  if (mode === "same") {
    if (profile.fixedWhole) {
      const partWholeState = seededManipulativeState("part_whole", representedWhole);
      partWholeState.parts = [quantity, representedWhole - quantity];
      return <div className="maths-presentation-model-pair" aria-label={`Two models of the whole ${representedWhole}, split into ${quantity} and ${representedWhole - quantity}`}><MathsManipulative id={primaryId} initialState={primaryState} key={`primary-${primaryId}-${quantity}`} maximum={maximum} mode="presentation" /><MathsManipulative id="part_whole" initialState={partWholeState} key={`parts-${quantity}`} maximum={maximum} mode="presentation" /></div>;
    }
    return <div className="maths-presentation-model-pair" aria-label={`Two ways to show ${quantity}`}><MathsManipulative id={primaryId} initialState={primaryState} key={`primary-${primaryId}-${quantity}`} maximum={maximum} mode="presentation" /><MathsManipulative id="counter_tray" initialState={seededManipulativeState("counter_tray", quantity)} key={`tray-${quantity}`} maximum={maximum} mode="presentation" /></div>;
  }
  return <div className="maths-presentation-single">{profile.model === "numeral_match" && <div className="maths-presentation-numeral" aria-label={`Numeral ${quantity}`}>{quantity}</div>}<MathsManipulative id={primaryId} initialState={primaryState} key={`${primaryId}-${quantity}-${mode}`} maximum={maximum} mode="presentation" /></div>;
}

function Presentation() {
  const [skillId, setSkillId] = useState("F-N-SUBITISE-5");
  const [mode, setMode] = useState("flash");
  const [revealed, setRevealed] = useState(false);
  const [quantity, setQuantity] = useState(5);
  const [flashing, setFlashing] = useState(false);
  const [flashDuration, setFlashDuration] = useState(1500);
  const [isProjecting, setIsProjecting] = useState(false);
  const profile = MATHS_PRESENTATION_PROFILES[skillId];
  const trueFalse = profile.trueFalse(quantity);
  const changeSkill = nextSkillId => {
    const nextProfile = MATHS_PRESENTATION_PROFILES[nextSkillId];
    setSkillId(nextSkillId);
    setQuantity(nextProfile.defaultQuantity);
    setMode(nextProfile.modes[0]);
    setRevealed(false);
    setFlashing(false);
  };
  const flash = () => { setFlashing(true); window.setTimeout(() => setFlashing(false), flashDuration); };
  useEffect(() => {
    if (!isProjecting) return undefined;
    const onKey = event => {
      if (event.key === "Escape") setIsProjecting(false);
      if (event.key === "ArrowRight") setQuantity(value => Math.min(profile.maximum, value + 1));
      if (event.key === "ArrowLeft") setQuantity(value => Math.max(profile.minimum, value - 1));
      if (event.key === " ") { event.preventDefault(); setRevealed(value => !value); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isProjecting, profile.maximum, profile.minimum]);
  const representedWhole = profile.fixedWhole || quantity;
  const prompt = mode === "flash" ? flashing ? "Look now" : "How many did you see?"
    : mode === "same" ? `How do both models show the whole ${representedWhole}?`
      : mode === "truefalse" ? `${trueFalse.statement} True or false?`
        : mode === "compare" ? "Which collection has more? How do you know?"
          : mode === "build" ? profile.fixedWhole ? `Build the whole ${representedWhole}. Make one part ${quantity}.` : `Build ${quantity}. What changes each time?`
            : "What do you notice? What do you wonder?";
  return <section className={`maths-presentation${isProjecting ? " is-projecting" : ""}`}><aside><label>Learning goal<select value={skillId} onChange={event => changeSkill(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><label>Number talk<select value={mode} onChange={event => { setMode(event.target.value); setRevealed(false); }}>{profile.modes.map(id => <option key={id} value={id}>{MATHS_PRESENTATION_MODE_LABELS[id]}</option>)}</select></label><label>{profile.quantityLabel || "Quantity"} <output aria-live="polite">{quantity}</output><input aria-label={profile.quantityLabel || "Presentation quantity"} type="range" min={profile.minimum} max={profile.maximum} value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label>{profile.fixedWhole && <p className="maths-presentation-fixed-whole">Whole fixed at <strong>{profile.fixedWhole}</strong></p>}{mode === "flash" && <><label>Flash time<select value={flashDuration} onChange={event => setFlashDuration(Number(event.target.value))}><option value="1000">1 second</option><option value="1500">1.5 seconds</option><option value="2500">2.5 seconds</option></select></label><button onClick={flash} type="button">Flash picture</button></>}<button onClick={() => setRevealed(value => !value)} type="button">{revealed ? "Hide teacher reveal" : "Reveal teacher prompt"}</button><button className="maths-projector-toggle" onClick={() => setIsProjecting(value => !value)} type="button">{isProjecting ? "Exit projector mode" : "Open projector mode"}</button>{isProjecting && <small>Arrow keys change the quantity · Space reveals · Escape exits</small>}</aside><div className="maths-presentation-stage"><p>{prompt}</p><div className={mode === "flash" && !flashing ? "maths-flash-cover" : ""}><PresentationModels mode={mode} profile={profile} quantity={quantity} /></div>{revealed && <aside className="maths-teacher-reveal"><strong>{mode === "truefalse" ? "Answer and reasoning" : "Listen for"}</strong><span>{mode === "truefalse" ? `${trueFalse.answer ? "True" : "False"}. ${trueFalse.proofPrompt}` : mathsSkillById[skillId].vocabulary.join(", ")}</span></aside>}</div></section>;
}

function WorksheetVisual({ task }) {
  if (task.kind === "part_whole") return <div className="maths-print-part-whole"><strong>{task.whole}</strong><span>{task.known}</span><span>?</span></div>;
  if (task.kind === "number_path") return <div className="maths-print-number-line" aria-label={`Number path from ${task.start} to ${task.end} with one missing number`}><div>{Array.from({ length: task.end - task.start + 1 }, (_, index) => task.start + index).map(number => <span className={number === task.hidden ? "is-hidden" : ""} key={number}>{number === task.hidden ? "?" : number}</span>)}</div><small>Read the path both ways.</small></div>;
  if (task.kind === "number_line") return <div className="maths-print-number-line" aria-label={`Number line from zero to ${task.maximum}`}><div>{Array.from({ length: task.maximum + 1 }, (_, number) => <span className={number === task.start ? "is-start" : number === task.end ? "is-end" : ""} key={number}>{number}</span>)}</div><small>Draw hops above the line.</small></div>;
  if (task.kind === "dot_match") return <div className="maths-print-dot-match"><div>{Array.from({ length: task.value }, (_, index) => <i key={index} />)}</div><p>{task.options.map(option => <span key={option}>{option}</span>)}</p></div>;
  if (task.kind === "compare") return <div className="maths-print-compare" aria-label={`${task.left} objects on the left and ${task.right} on the right`}><div>{Array.from({ length: task.left }, (_, index) => <i key={index} />)}</div><strong>more · fewer · same</strong><div>{Array.from({ length: task.right }, (_, index) => <i key={index} />)}</div></div>;
  if (task.kind === "cut_build") return <div className="maths-print-cut-build">{task.showQuantity && <i aria-label={`${task.value} dots`}>{Array.from({ length: task.value }, (_, index) => <b key={index} />)}</i>}{task.cards.map((card, index) => <span key={`${card}-${index}`}>{card}</span>)}</div>;
  if (task.kind === "split_frame") return <div className={`maths-print-frame maths-print-split-frame cells-${task.capacity}`}>{Array.from({ length: task.capacity }, (_, index) => <span className={index < task.partA ? "is-part-a" : index < task.value ? "is-part-b" : ""} key={index} />)}<p>{task.partA} and {task.partB} make <u>______</u></p></div>;
  return <div className={`maths-print-frame cells-${task.capacity}`}>{Array.from({ length: task.capacity }, (_, index) => <span key={index} />)}</div>;
}

function WorksheetStudio() {
  const [skillId, setSkillId] = useState("F-N-PART-10");
  const [template, setTemplate] = useState("frame");
  const [version, setVersion] = useState("A");
  const [level, setLevel] = useState("core");
  const templates = worksheetTemplatesForSkill(skillId);
  const tasks = buildMathsWorksheetTasks({ skillId, template, version, level });
  const changeSkill = nextSkillId => {
    setSkillId(nextSkillId);
    const nextTemplates = worksheetTemplatesForSkill(nextSkillId);
    setTemplate(nextTemplates[0].id);
  };
  return <section className="maths-worksheet-studio"><aside><label>Learning goal<select value={skillId} onChange={event => changeSkill(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><label>Template<select value={template} onChange={event => setTemplate(event.target.value)}>{templates.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Level<select value={level} onChange={event => setLevel(event.target.value)}>{Object.entries(MATHS_WORKSHEET_LEVELS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label><p className="maths-worksheet-level-note">{MATHS_WORKSHEET_LEVELS[level].note}</p><label>Balanced version<select value={version} onChange={event => setVersion(event.target.value)}><option value="A">Version A</option><option value="B">Version B</option></select></label><button onClick={() => window.print()} type="button">Print worksheet + answers</button></aside><div className="maths-print-sheet"><header><div><small>{MATHS_WORKSHEET_LEVELS[level].label} · Version {version}</small><h2>{mathsSkillById[skillId].childLabel}</h2></div><span>Name ____________________</span></header><ol>{tasks.map(task => <li key={task.id}><p>{task.prompt}</p>{task.workedCue && <p className="maths-print-worked-cue"><strong>Try this:</strong> {task.workedCue}</p>}<WorksheetVisual task={task} />{task.explain && <p className="maths-print-explain">{task.explain}</p>}</li>)}</ol><footer>Maths practice · no speed score · each picture is part of the task</footer><section className="maths-answer-page"><h2>Teacher answer guide · {MATHS_WORKSHEET_LEVELS[level].label} · Version {version}</h2><ol>{tasks.map(task => <li key={task.id}>{task.answer}</li>)}</ol></section></div></section>;
}

function statusClass(status) {
  return `maths-status is-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function EvidenceSignals({ row }) {
  return <div className="maths-evidence-signals">
    <section aria-label={`Recent checked items for ${row.label}`} className="maths-trend-signal"><div><ChartLine aria-hidden="true" size={20} /><span><strong>Recent checked items</strong><small>{row.trend.label}</small></span></div>{row.trend.points.length > 0 ? <div aria-label={row.trend.points.map(point => point.label).join("; ")} className="maths-trend-points" role="img">{row.trend.points.map(point => <i className={point.outcome === "checked_correct" ? "is-checked" : "is-follow-up"} key={point.id} title={point.label} />)}</div> : <small>No direct checks</small>}</section>
    <section aria-label={`Representation coverage for ${row.label}`}><strong>Representations</strong><div className="maths-signal-chips">{row.representationSignals.length ? row.representationSignals.map(signal => <span className={signal.current ? "is-current" : ""} key={signal.id}>{signal.label}<small>{signal.count}</small></span>) : <span>Not recorded</span>}</div></section>
    <section aria-label={`Assessment response directions for ${row.label}`}><strong>Response direction</strong><div className="maths-signal-chips">{row.responseDirectionSignals.length ? row.responseDirectionSignals.map(signal => <span className={signal.current ? "is-current" : ""} key={signal.id}>{signal.label}<small>{signal.count}</small></span>) : <span>Not recorded</span>}</div></section>
    <section aria-label={`Assessment evidence purposes for ${row.label}`}><strong>Evidence purpose</strong><div className="maths-signal-chips">{row.assessmentPurposeSignals.length ? row.assessmentPurposeSignals.map(signal => <span className={signal.current ? "is-current" : ""} key={signal.id}>{signal.label}<small>{signal.count}</small></span>) : <span>Not recorded</span>}</div></section>
    <section aria-label={`Evidence sources for ${row.label}`}><strong>Sources</strong><div className="maths-signal-chips">{row.sourceSignals.length ? row.sourceSignals.map(signal => <span className={signal.current ? "is-current" : ""} key={signal.id}>{signal.label}<small>{signal.count}</small></span>) : <span>Not recorded</span>}</div></section>
  </div>;
}

function Reports({ client, classId, students, onNavigate }) {
  const [events, setEvents] = useState([]);
  const [evidenceMeta, setEvidenceMeta] = useState({ complete: true, loadedCount: 0 });
  const [syncHealth, setSyncHealth] = useState([]);
  const [state, setState] = useState(classId ? "loading" : "no-class");
  const [studentId, setStudentId] = useState("");
  const [skillId, setSkillId] = useState("F-N-PART-10");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateWindow, setDateWindow] = useState("90");
  useEffect(() => {
    let current = true;
    if (!classId) return undefined;
    const since = dateWindow === "all" ? null : new Date(Date.now() - Number(dateWindow) * 86_400_000).toISOString();
    Promise.resolve()
      .then(() => { if (current) setState("loading"); return Promise.all([readTeacherMathsEvidence({ client, classId, studentId: studentId || null, since, source: sourceFilter === "all" ? null : sourceFilter, limit: 20_000, returnMetadata: true }), readTeacherMathsSyncHealth({ client, classId })]); })
      .then(([result, health]) => { if (current) { setEvents(result.events); setEvidenceMeta(result); setSyncHealth(health); setState("ready"); } })
      .catch(() => { if (current) setState("error"); });
    return () => { current = false; };
  }, [classId, client, dateWindow, sourceFilter, studentId]);
  const report = buildMathsLearnerReport(events, studentId);
  const classReport = buildMathsClassReport(events, students);
  const classSkill = classReport.find(row => row.skillId === skillId) || classReport[0];
  const actionGroups = classSkill ? buildMathsActionGroups(events, students, classSkill.skillId) : [];
  const selectedSync = studentId ? syncHealth.find(row => row.studentId === studentId) : null;
  const pendingCount = syncHealth.reduce((sum, row) => sum + Number(row.pending || 0), 0);
  const rejectedCount = syncHealth.reduce((sum, row) => sum + Number(row.rejected || 0), 0);
  const syncMessage = studentId
    ? selectedSync ? `${selectedSync.pending} pending, ${selectedSync.rejected} rejected, last report ${new Date(selectedSync.reportedAt).toLocaleString()}` : "No device sync report yet for this learner."
    : syncHealth.length ? `${syncHealth.length} learner device${syncHealth.length === 1 ? "" : "s"} reported, ${pendingCount} pending, ${rejectedCount} rejected` : "No device sync reports yet. This is expected until a learner opens Maths and a save attempt is reported.";
  const exportCsv = () => {
    if (!evidenceMeta.complete) return;
    const header = ["learner", "skill", "status", "freshness", "basis", "next_action"];
    const rows = students.flatMap(student => buildMathsLearnerReport(events, student.id).map(row => [student.name, row.label, row.status, row.freshness, row.evidenceNote, row.nextAction]));
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `maths-formative-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const planGroup = (targetSkillId, studentIds) => {
    storeMathsIntent("lp-maths-group-intent", { skillId: targetSkillId, studentIds });
    onNavigate?.("groups");
  };
  const prepareRecheck = (targetSkillId, studentIds) => {
    storeMathsIntent("lp-maths-resource-intent", { skillId: targetSkillId, activityType: "skills_check", studentIds });
    onNavigate?.("resources");
  };
  return <section className="maths-reports maths-action-reports">
    <div className="maths-report-controls"><label>View<select value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">Whole class distribution</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>{!studentId && <label>Learning goal<select value={skillId} onChange={event => setSkillId(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label>}<label>Evidence source<select value={sourceFilter} onChange={event => setSourceFilter(event.target.value)}><option value="all">All sources</option>{MATHS_SOURCE_OPTIONS.map(source => <option key={source} value={source}>{MATHS_EVIDENCE_SOURCE_LABELS[source]}</option>)}</select></label><label>Date range<select value={dateWindow} onChange={event => setDateWindow(event.target.value)}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="180">Last 180 days</option><option value="all">All recorded evidence</option></select></label><div className="maths-report-actions"><button disabled={!evidenceMeta.complete || state !== "ready" || !events.length} onClick={exportCsv} type="button">Export CSV</button><button disabled={!evidenceMeta.complete || state !== "ready"} onClick={() => window.print()} type="button">Print view</button></div><p><strong>Formative only.</strong> Statuses describe the checked items in this view. They are not calibrated mastery levels.</p>{!evidenceMeta.complete && <p className="maths-inline-warning" role="alert">This filter has more than {evidenceMeta.loadedCount.toLocaleString()} events. Narrow the date, source or learner before exporting or drawing a class-wide conclusion.</p>}<p className={rejectedCount ? "maths-sync-health is-alert" : "maths-sync-health"}><strong>Evidence sync:</strong> {syncMessage}</p></div>
    {state === "no-class" && <div className="maths-empty-state"><h2>Choose a class first</h2><p>Reports never combine evidence across classes.</p></div>}
    {state === "loading" && <div aria-label="Loading filtered Maths evidence" className="maths-report-skeleton" role="status"><i /><i /><i /></div>}
    {state === "error" && <div className="maths-empty-state"><h2>Evidence could not be loaded</h2><p>Nothing has been treated as missing. Refresh and try again.</p></div>}
    {state === "ready" && !events.length && <div className="maths-first-evidence"><div><p className="maths-stage-label">Start with one useful observation</p><h2>No Maths evidence yet</h2><p>Choose one learning goal, run a short whole-class check, then record only what you directly observe. Learners remain neutral until checked.</p><div><button className="maths-primary" onClick={() => onNavigate?.("assessments")} type="button">Run the first class check</button><button onClick={() => onNavigate?.("present")} type="button">Open a number talk</button><button onClick={() => window.print()} type="button">Print observation grid</button></div></div><aside aria-label="First evidence steps"><span><strong>1</strong>Select one goal</span><span><strong>2</strong>Show a new model</span><span><strong>3</strong>Record what was observed</span></aside></div>}
    {state === "ready" && events.length > 0 && !studentId && classSkill && <div className="maths-class-report-action"><section className="maths-class-distribution"><header><div><p>Selected learning goal</p><h2>{classSkill.label}</h2></div><strong>{classSkill.checkedCount} of {classSkill.learnerCount} learners with evidence</strong></header><div className="maths-status-distribution">{MATHS_EVIDENCE_STATUSES.map(status => <article key={status}><span className={statusClass(status)}>{status}</span><strong>{classSkill.statusCounts[status] || 0}</strong></article>)}</div><p className="maths-report-boundary"><ShieldCheck aria-hidden="true" size={18} /> Not checked is neutral. Practice participation is not a proficiency judgement.</p></section>
      <section className="maths-teach-recheck" aria-labelledby="maths-teach-recheck-heading"><header><div><p>Evidence to action</p><h2 id="maths-teach-recheck-heading">Teach, then recheck</h2></div><span>These are editable suggestions, not diagnoses or placements.</span></header>{actionGroups.length ? <div>{actionGroups.map(group => <article key={group.id}><div><small>{group.students.length} learner{group.students.length === 1 ? "" : "s"}</small><h3>{group.possiblePattern ? "Pattern to check" : "Next check needed"}</h3><p>{group.checkQuestion}</p><strong>{group.nextAction}</strong><span>{group.students.map(student => student.name).join(", ")}</span></div><ol aria-label="Teaching workflow"><li><button onClick={() => planGroup(group.skillId, group.students.map(student => student.id))} type="button"><UsersThree aria-hidden="true" size={18} /> Plan group</button></li><li><button onClick={() => prepareRecheck(group.skillId, group.students.map(student => student.id))} type="button"><CalendarCheck aria-hidden="true" size={18} /> Prepare recheck</button></li></ol></article>)}</div> : <div className="maths-manager-state"><strong>No shared follow-up pattern in this view</strong><span>Review individual evidence or gather a fresh check in another representation.</span></div>}</section>
      <section className="maths-class-learner-scan"><header><h2>Class evidence scan</h2><span>Roster order is preserved. Learners are not ranked.</span></header>{classSkill.learnerRows.map(({ student, report: row }) => <article key={student.id}><div><strong>{student.name}</strong><button onClick={() => setStudentId(student.id)} type="button">Open learner</button></div><span className={statusClass(row.status)}>{row.status}</span><small>{row.freshness}</small><small>{row.trend.label}</small><div className="maths-mini-signals"><span>{row.representationSignals.length ? `${row.representationSignals.length} representation${row.representationSignals.length === 1 ? "" : "s"}` : "Representation not recorded"}</span><span>{row.sourceSignals.length ? `${row.sourceSignals.length} source${row.sourceSignals.length === 1 ? "" : "s"}` : "Source not recorded"}</span></div></article>)}</section>
    </div>}
    {state === "ready" && events.length > 0 && studentId && <div className="maths-learner-evidence-cards">{report.map(row => <article key={row.skillId}><header><div><small>{row.skillId}</small><h2>{row.label}</h2></div><span className={statusClass(row.status)}>{row.status}</span></header><p className="maths-evidence-basis">{row.evidenceNote}</p><EvidenceSignals row={row} />{row.possiblePatterns.length > 0 && <section className="maths-pattern-check"><WarningCircle aria-hidden="true" size={22} /><div><strong>Pattern to check across separate items</strong><p>{row.checkQuestion}</p></div></section>}<section className="maths-next-action"><div><small>Next teaching action</small><strong>{row.nextAction}</strong></div><button onClick={() => planGroup(row.skillId, [studentId])} type="button">Plan teaching</button><button onClick={() => prepareRecheck(row.skillId, [studentId])} type="button">Prepare recheck</button></section><details><summary>View evidence items</summary><ul>{events.filter(event => event.studentId === studentId && event.skillId === row.skillId).slice(-20).reverse().map(event => <li key={event.id || `${event.occurredAt}-${event.evidence?.itemKey}`}><time>{new Date(event.occurredAt).toLocaleString()}</time><span>{MATHS_EVIDENCE_SOURCE_LABELS[event.evidence?.source] || String(event.evidence?.source || event.eventType).replaceAll("_", " ")}</span><span>{String(event.evidence?.representation || "Representation not recorded").replaceAll("_", " ")}</span>{event.evidence?.responseDirection && <span>Response direction: {String(event.evidence.responseDirection).replaceAll("_", " ")}</span>}{event.evidence?.evidencePurpose && <span>Evidence purpose: {String(event.evidence.evidencePurpose).replaceAll("_", " ")}</span>}<span>Prompt: {String(event.evidence?.promptText ?? event.evidence?.prompt ?? "not recorded")}</span><span>Response: {String(event.evidence?.response ?? "not checked")}</span><span>Recorded result: {String(event.evidence?.classification || event.evidence?.outcome || "not recorded").replaceAll("_", " ")}</span>{event.evidence?.constructChanged && <span>Practice construct changed</span>}</li>)}</ul></details></article>)}</div>}
  </section>;
}

function SmallGroups({ client, teacherId, classId, students }) {
  const intent = (() => { try { return JSON.parse(sessionStorage.getItem("lp-maths-group-intent") || "null"); } catch { return null; } })();
  const [events, setEvents] = useState([]);
  const [evidenceState, setEvidenceState] = useState(classId ? "loading" : "no-class");
  const [skillId, setSkillId] = useState(() => APPROVED_FOUNDATION_SKILL_IDS.includes(intent?.skillId) ? intent.skillId : "F-N-PART-10");
  const [selected, setSelected] = useState(() => {
    const allowed = new Set(students.map(student => student.id));
    return Array.isArray(intent?.studentIds) ? intent.studentIds.filter(id => allowed.has(id)) : [];
  });
  const [duration, setDuration] = useState(12);
  const [saveState, setSaveState] = useState("");
  useEffect(() => {
    try { sessionStorage.removeItem("lp-maths-group-intent"); } catch { /* storage is optional */ }
  }, []);
  useEffect(() => {
    let current = true;
    if (!classId) return undefined;
    Promise.resolve()
      .then(() => { if (current) setEvidenceState("loading"); return readTeacherMathsEvidence({ client, classId, limit: 20_000, returnMetadata: true }); })
      .then(result => { if (current) { setEvents(result.complete ? result.events : []); setEvidenceState(result.complete ? "ready" : "incomplete"); } })
      .catch(() => { if (current) setEvidenceState("error"); });
    return () => { current = false; };
  }, [classId, client]);
  const groups = buildMathsClassGroups(events, students, skillId);
  const recipes = mathsActivityRecipesBySkill[skillId];
  const plan = useMemo(() => buildMathsSmallGroupPlan({ skillId, duration, recipes }), [duration, recipes, skillId]);
  const recordObservation = async (student, outcome) => {
    setSaveState("Saving observation…");
    try {
      const result = await recordTeacherMathsEvidence({ client, teacherId, classId, studentId: student.id, skillId, eventType: "lesson_exit_observation", contentVersion: MATHS_CONTENT_VERSION, evidence: { schemaVersion: 1, source: "small_group_exit", sessionId: `teacher-${classId}-${skillId}-${new Date().toISOString().slice(0, 10)}`, lessonDurationMinutes: duration, outcome, representation: plan.at(-1).manipulativeId, recipeIds: plan.map(recipe => recipe.id) } });
      setSaveState(result.cloudSaved ? `Saved for ${student.name}.` : result.queued ? "Saved on this device; it will sync automatically." : "The observation could not be saved.");
    } catch {
      setSaveState("The observation could not be saved. Nothing was marked as missing or incorrect.");
    }
  };
  const groupLabels = { notChecked: "Not checked: gather neutral evidence", practiceOnly: "Practice only: run a direct check", reconnect: "Reconnect", build: "Build", extend: "Extend" };
  return <section className="maths-small-groups"><aside><label>Target skill<select value={skillId} onChange={event => setSkillId(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><fieldset><legend>Lesson length</legend>{[8, 12, 20].map(value => <button className={duration === value ? "is-selected" : ""} key={value} onClick={() => setDuration(value)} type="button">{value} min</button>)}</fieldset><div className="maths-suggested-groups"><strong>Evidence-informed suggestions for this goal</strong>{evidenceState === "loading" && <p role="status">Loading class evidence…</p>}{["error", "incomplete"].includes(evidenceState) && <p className="maths-inline-error" role="alert">{evidenceState === "incomplete" ? "This class has more evidence than can be safely grouped in one view." : "Class evidence could not be loaded."} Suggestions are paused so incomplete data is never treated as a learner result.</p>}{evidenceState === "ready" && Object.entries(groups).map(([key, rows]) => <button key={key} onClick={() => setSelected(rows.map(row => row.student.id))} type="button"><span>{groupLabels[key] || key}</span><small>{rows.length} learners</small></button>)}</div><fieldset className="maths-learner-list"><legend>Learners ({selected.length} selected)</legend>{students.map(student => <label key={student.id}><input checked={selected.includes(student.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, student.id] : ids.filter(id => id !== student.id))} type="checkbox" />{student.name}</label>)}</fieldset></aside><div className="maths-group-plan"><header><p>{duration}-minute lesson · {selected.length} learners</p><h2>{mathsSkillById[skillId].childLabel}</h2></header>{!selected.length ? <div className="maths-empty-state"><h3>Choose at least one learner</h3><p>Select an evidence-informed suggestion or choose learners manually. The lesson plan and observation controls will appear here.</p></div> : <><button className="maths-print-group-plan" onClick={() => window.print()} type="button">Print this lesson plan</button><ol>{plan.map((recipe, index) => <li key={recipe.id}><span>{index + 1}</span><div><small>{recipe.minutes} min · {recipe.phase}</small><h3>{recipe.instructionText}</h3><MathsAudioButton client={client} compact requestId={recipe.instructionAudioId} /><p><strong>Look and listen for:</strong> {recipe.likelyResponse}</p><p><strong>Diagnostic check:</strong> {recipe.teacherCheck}</p><p><strong>If the model does not yet match:</strong> {recipe.repair}</p></div></li>)}</ol><section className="maths-exit-observation"><h3>Exit observation</h3><p>Record only what you directly observed. “Not checked” is valid and creates no negative result.</p>{students.filter(student => selected.includes(student.id)).map(student => <div key={student.id}><strong>{student.name}</strong><button onClick={() => recordObservation(student, "demonstrated")} type="button">Correct on today’s check</button><button onClick={() => recordObservation(student, "not_yet")} type="button">Needs another example</button><button onClick={() => recordObservation(student, "not_checked")} type="button">Not checked</button></div>)}<p role="status">{saveState}</p></section></>}</div></section>;
}

export function MathsTeacherWorkspace({ mode = "overview", className = "", studentCount = null, classId = "", students = [], client, teacherId, onNavigate }) {
  return <main className="maths-teacher-workspace maths-teacher-workspace-v2" data-maths-teacher-mode={mode}><Header className={className} mode={mode} studentCount={studentCount} />{mode === "overview" && <Overview classId={classId} client={client} onNavigate={onNavigate} students={students} />}{mode === "assessments" && <CheckLauncher onNavigate={onNavigate} />}{mode === "resources" && <ResourceLibrary classId={classId} client={client} students={students} />}{mode === "present" && <Presentation />}{mode === "worksheets" && <WorksheetStudio />}{mode === "reports" && <Reports classId={classId} client={client} onNavigate={onNavigate} students={students} />}{mode === "groups" && <SmallGroups classId={classId} client={client} students={students} teacherId={teacherId} />}</main>;
}
