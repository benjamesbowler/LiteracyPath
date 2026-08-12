import { useEffect, useState } from "react";
import StudentGlassShell from "../../components/StudentGlassShell.jsx";
import { SubjectSwitch } from "../../components/SubjectSwitch.jsx";
import { SUBJECT_IDS } from "../../subjects/subjectRegistry.js";
import "../../styles/maths-platform.css";

const ICONS = { lesson: "◫", skills_check: "✓", game: "◆", number_story: "◇" };

export function MathsHome({ studentName = "Mathematician", progressScopeKey = "default", client, token = "", onOpenLiteracy, onOpenLearn, onOpenAssessment, onOpenStories, onOpenArcade }) {
  const [assignments, setAssignments] = useState([]);
  const [assignmentState, setAssignmentState] = useState(token ? "loading" : "unavailable");
  const [completionState, setCompletionState] = useState("");
  const loadAssignments = () => {
    if (!client?.call || !token) return;
    setAssignmentState("loading");
    client.call("student_list_maths_assignments", { p_token: token }).then(({ data, error }) => {
      if (error || !data?.ok) throw error || new Error(data?.error || "assignment_read_failed");
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
      setAssignmentState("ready");
    }).catch(() => setAssignmentState("error"));
  };
  useEffect(() => {
    let current = true;
    if (!client?.call || !token) return undefined;
    Promise.resolve()
      .then(() => client.call("student_list_maths_assignments", { p_token: token }))
      .then(({ data, error }) => {
        if (!current) return;
        if (error || !data?.ok) throw error || new Error(data?.error || "assignment_read_failed");
        setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
        setAssignmentState("ready");
      })
      .catch(() => { if (current) setAssignmentState("error"); });
    return () => { current = false; };
  }, [client, token]);
  const openAssignment = assignment => ({ lesson: onOpenLearn, skills_check: onOpenAssessment, game: onOpenArcade, number_story: onOpenStories }[assignment.activityType]?.(assignment));
  const completeAssignment = async assignment => {
    setCompletionState("Saving…");
    try {
      const { data, error } = await client.call("student_complete_maths_assignment", { p_token: token, p_assignment_id: assignment.id });
      if (error || !data?.ok) throw error || new Error(data?.error || "assignment_completion_failed");
      setCompletionState("Marked finished.");
      loadAssignments();
    } catch {
      setCompletionState("That could not be marked finished yet. You can still keep practising.");
    }
  };
  const pending = assignments.filter(assignment => !assignment.completedAt);
  return <StudentGlassShell studentName={studentName} scopeKey={progressScopeKey} active="maths" tabs={[]} showWallet={false} showGrownUps={false} onHome={onOpenLiteracy} headerActions={<SubjectSwitch activeSubject={SUBJECT_IDS.MATHS} onSelectSubject={subjectId => { if (subjectId === SUBJECT_IDS.LITERACY) onOpenLiteracy?.(); }} variant="child" />}>
    <main className="maths-home-v1" data-child-surface="maths-home">
      <header><div><p>Your Maths place</p><h1 data-child-title>Let’s make sense of numbers, {studentName}.</h1><span data-child-instruction>Move, notice, explain and play. Nothing here records your voice or picture.</span><small className="maths-home-stage" data-child-progress>Foundation number sense</small></div><div className="maths-home-number-mark" aria-hidden="true"><span>5</span>{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div></header>
      {assignmentState === "loading" && <p className="maths-home-status" role="status">Checking today’s Maths…</p>}
      {assignmentState === "error" && <p className="maths-home-status is-error" role="status">Today’s assignments could not be loaded. You can still use every practice area below.</p>}
      {completionState && <p className="maths-home-status" role="status">{completionState}</p>}
      {assignmentState === "ready" && pending.length > 0 && <section className="maths-assignment-shelf"><div><p>From your teacher</p><h2>Today’s Maths</h2></div>{pending.map(assignment => <article key={assignment.id}><span aria-hidden="true">{ICONS[assignment.activityType]}</span><div><small>{assignment.activityType.replaceAll("_", " ")}</small><strong>{assignment.title}</strong>{assignment.dueAt && <em>Due {new Date(assignment.dueAt).toLocaleDateString()}</em>}</div><button onClick={() => openAssignment(assignment)} type="button">Open</button><button className="maths-done-button" onClick={() => completeAssignment(assignment)} type="button">I finished it</button></article>)}</section>}
      <section className="maths-home-grid" aria-label="Maths learning areas" data-child-choices>
        <button className="is-lesson" data-child-emphasis="primary" data-child-primary onClick={onOpenLearn} type="button"><span aria-hidden="true">◫</span><div><small>Build and explain</small><h2>Maths lessons</h2><p>Use frames, counters, number lines and part–whole models.</p></div><strong data-child-emphasis-cue>Continue Maths</strong></button>
        <button className="is-check" data-child-emphasis="choice" onClick={onOpenAssessment} type="button"><span aria-hidden="true">✓</span><div><small>Short and calm</small><h2>Skills check</h2><p>Show what you notice in six maths decisions.</p></div><strong>Start</strong></button>
        <button className="is-story" data-child-emphasis="choice" onClick={onOpenStories} type="button"><span aria-hidden="true">◇</span><div><small>Read and notice</small><h2>Number stories</h2><p>See quantities change while the story unfolds.</p></div><strong>Open shelf</strong></button>
        <button className="is-arcade" data-child-emphasis="choice" onClick={onOpenArcade} type="button"><span aria-hidden="true">◆</span><div><small>Practice through play</small><h2>Maths Arcade</h2><p>Untimed number trails, frames and matching games.</p></div><strong>Play</strong></button>
      </section>
      <footer><span>No child voice or image recording</span><span>Games never mark a skill Secure</span><button onClick={onOpenLiteracy} type="button">Go to Literacy</button></footer>
    </main>
  </StudentGlassShell>;
}
