import { useId, useState } from "react";
import { LiteracyMockImage } from "./LiteracyMockImage.jsx";
import { TeacherDataTable, TeacherFilterBar } from "../teacher/ui/TeacherPrimitives.jsx";
import { literacyMockAnswerText, literacyMockResponseText } from "../../utils/literacyMockReport.js";

const EVIDENCE_LABELS = { independent: "Independent first response", supported: "Help recorded — separate evidence", familiar: "Familiar or repeated question", media_failed: "Media unavailable — unscored", skipped: "Skipped — unscored", incomplete: "Incomplete evidence — excluded", unscored: "Unscored response" };

function QuestionEvidence({ response, compact = false }) {
  const snapshot = response.itemSnapshot || {};
  return <div className="literacy-mock-evidence">
    <p>{snapshot.prompt || snapshot.question || "Question wording not recorded"}</p>
    {!compact && snapshot.targetWord && <p>Target: {snapshot.targetWord}</p>}
    {!compact && (snapshot.passage || snapshot.sentence) && <blockquote>{literacyMockAnswerText(snapshot.passage || snapshot.sentence)}</blockquote>}
    {!compact && (snapshot.image || snapshot.choices?.some(choice => choice.image)) && <div className="literacy-mock-evidence-pictures">{snapshot.image && <LiteracyMockImage src={snapshot.image} alt={snapshot.imageAlt || "Question picture"} />}{snapshot.choices?.filter(choice => choice.image).map(choice => <figure key={choice.id}><LiteracyMockImage src={choice.image} alt={choice.imageAlt || choice.label} role="choice" /><figcaption>{choice.label}</figcaption></figure>)}</div>}
    <p><strong>Response:</strong> {literacyMockResponseText(response.selected, snapshot)} · <strong>Expected:</strong> {literacyMockResponseText(snapshot.expected ?? snapshot.answer ?? response.expected, snapshot)}</p>
    <small>Level {response.level || "not recorded"} · {EVIDENCE_LABELS[response.classification] || "Unscored"}{response.classification === "independent" ? response.isCorrect ? " · Correct" : " · To revisit" : ""}{response.recent === false ? " · Historical sample" : ""}</small>
    {!compact && <small>Question {response.questionId} · {response.knownFamiliar == null ? "Earlier familiarity unknown" : response.knownFamiliar ? "Known prior practice" : "No known prior practice"}{Number.isFinite(response.responseTimeMs) ? ` · ${Math.round(response.responseTimeMs / 1000)} seconds for this response` : ""}</small>}
  </div>;
}

export function LiteracyMockReport({ report, initialStudentId = "", studentId: controlledStudentId, onStudentChange }) {
  const titleId = useId();
  const [studentId, setStudentId] = useState(initialStudentId);
  const [omitted, setOmitted] = useState({});
  if (!report) return null;
  const pupil = report.pupils.find(row => row.studentId === (controlledStudentId ?? studentId)) || null;
  return <section className="literacy-mock-report" aria-labelledby={titleId}>
    <header><p className="panel-label">Teacher evidence</p><h3 id={titleId} tabIndex={-1}>What to teach next</h3><p>{report.note}</p></header>
    <TeacherFilterBar label="Mock assessment report view">
      <label>Report for<select value={pupil?.studentId || ""} onChange={event => { setStudentId(event.target.value); onStudentChange?.(event.target.value); }}>
        <option value="">Whole session and teaching groups</option>
        {report.pupils.map(row => <option key={row.studentId} value={row.studentId}>{row.name}</option>)}
      </select></label>
    </TeacherFilterBar>
    {pupil ? <>
      <h4>{pupil.name} — session evidence</h4>
      <dl className="literacy-mock-metrics">
        <div><dt>Questions answered</dt><dd>{pupil.answered}{pupil.planned !== null ? ` of ${pupil.planned}` : ""}</dd></div>
        <div><dt>Independent responses</dt><dd>{pupil.totals.independent}</dd></div>
        <div><dt>Questions not reached</dt><dd>{pupil.unsampledItems ?? "Not recorded"}</dd></div>
        <div><dt>Skills not yet sampled</dt><dd>{pupil.unsampledSkills} of {report.totalSkills}</dd></div>
      </dl>
      {pupil.mediaFailureCount > 0 && <p className="literacy-mock-notice">{pupil.mediaFailureCount} {pupil.mediaFailureCount === 1 ? "question presentation was" : "question presentations were"} affected by unavailable media. These events did not use an answer slot or create a skill result.</p>}
      <div className="literacy-mock-insights">
        <section><h4>Observed successes</h4>{pupil.strengths.length ? <ul>{pupil.strengths.map(skill => <li key={skill.id}><strong>{skill.label}</strong>: {skill.correct} correct independent {skill.correct === 1 ? "response" : "responses"}. {skill.incorrect > 0 && `${skill.incorrect} other responses to revisit.`}</li>)}</ul> : <p>No correct independent responses recorded yet. This does not establish a weakness.</p>}</section>
        <section><h4>Review and check again</h4>{pupil.revisit.length ? <ul>{pupil.revisit.map(skill => <li key={skill.id}><strong>{skill.label}</strong>: {skill.incorrect} independent {skill.incorrect === 1 ? "response" : "responses"} to revisit.<p>{skill.suggestion} Check a different example without help.</p></li>)}</ul> : <p>No independent errors recorded. Sample other skills before drawing a broader conclusion.</p>}</section>
      </div>
      <TeacherDataTable label={`${pupil.name}: four literacy areas`} className="literacy-mock-table">
        <caption>Coverage and observations across four literacy areas</caption>
        <thead><tr><th scope="col">Area</th><th scope="col">Skills sampled</th><th scope="col">Independent observations</th><th scope="col">Other evidence</th></tr></thead>
        <tbody>{pupil.areas.map(area => <tr key={area.id}><th scope="row">{area.label}</th><td>{area.sampledSkills} of {area.totalSkills}</td><td>{area.independent ? `${area.correct} correct · ${area.incorrect} to revisit` : "Not yet sampled independently"}</td><td>{area.supported} helped · {area.familiar} familiar · {area.unscored} unscored</td></tr>)}</tbody>
      </TeacherDataTable>
      <details><summary>All {report.totalSkills} skills and next steps</summary>
        <TeacherDataTable label={`${pupil.name}: detailed skill evidence`} className="literacy-mock-table">
          <thead><tr><th scope="col">Skill</th><th scope="col">Evidence by level</th><th scope="col">Next teaching move</th></tr></thead>
          <tbody>{pupil.skills.map(skill => <tr key={skill.id}><th scope="row">{skill.label}<small>{skill.domainLabel}</small></th><td>{skill.sampled ? <>{skill.levels.map(level => <p key={level.level}>Level {level.level}: {level.correct} correct · {level.incorrect} to revisit · {level.supported + level.familiar + level.unscored} separate/unscored</p>)}<small>{skill.evidenceSufficiency.ready ? "Descriptive sample only; no proficiency judgment." : skill.evidenceSufficiency.reason}</small></> : "Not yet sampled — not a weakness"}</td><td>{skill.suggestion} {skill.sampled ? "Check a fresh example independently." : "Collect a first sample."}</td></tr>)}</tbody>
        </TeacherDataTable>
      </details>
      <details><summary>Question-by-question evidence ({pupil.responses.length})</summary>
        {pupil.responses.length ? <ol className="literacy-mock-response-list">{pupil.responses.map(response => <li key={`${response.questionId}:${response.index}`}><strong>{pupil.skills.find(skill => skill.id === response.skillId)?.label || "Skill needs review"}</strong><QuestionEvidence response={response} /></li>)}</ol> : <p>No saved responses. Questions not reached do not count as errors.</p>}
      </details>
      {pupil.mediaFailureCount > 0 && <details><summary>Media availability log ({pupil.mediaFailureCount})</summary>
        <p>Pictures or recordings were unavailable. These are technical events, separate from answers and teaching groups.</p>
        <ol className="literacy-mock-response-list">{pupil.mediaFailures.map(failure => <li key={`${failure.questionId}:${failure.index}`}>
          <strong>{pupil.skills.find(skill => skill.id === failure.skillId)?.label || "Skill not recorded"}</strong>
          <p>{failure.itemSnapshot?.prompt || "Question wording not recorded"}</p>
          <small>Question {failure.questionId} · Level {failure.level || "not recorded"} · Media unavailable — no answer recorded</small>
        </li>)}</ol>
      </details>}
    </> : <>
      <h4>Flexible teaching groups — review before using</h4>
      <p>Each suggestion is tied to recent independent errors on the same skill. Check the examples, remove anyone who needs a different next step, and use your classroom knowledge. These suggestions do not create placements or saved ability groups.</p>
      {report.groups.length ? <div className="literacy-mock-groups">{report.groups.map(group => {
        const included = group.members.filter(member => !omitted[`${group.id}:${member.studentId}`]);
        return <details key={group.id}><summary>{group.label} · Level {group.level} <span>{included.length} selected for teacher review</span></summary><p>{group.suggestion}</p>
          {group.members.map(member => <section key={member.studentId} className="literacy-mock-group-member"><label><input type="checkbox" checked={!omitted[`${group.id}:${member.studentId}`]} onChange={event => setOmitted(previous => ({ ...previous, [`${group.id}:${member.studentId}`]: !event.target.checked }))} /><strong>{member.name}</strong></label><p>{member.incorrectCount} recent {member.incorrectCount === 1 ? "error" : "errors"} · {member.independentCount} independent {member.independentCount === 1 ? "response" : "responses"} on this skill at level {group.level}. A small sample is a starting point for a teacher check.</p>{member.examples.map(response => <QuestionEvidence key={`${response.questionId}:${response.index}`} response={response} compact />)}</section>)}
        </details>;
      })}</div> : <p className="literacy-mock-notice">No recent independent errors to group from yet. Collect more evidence; do not infer that every skill is secure.</p>}
      <section className="literacy-mock-neutral"><h4>Collect a sample first</h4><p>Missing or unscored work is separate from a teaching need.</p>{report.needsSample.length ? <ul>{report.needsSample.map(row => <li key={row.studentId}>{row.name}: no independent sample; {row.unsampledSkills} skills not yet sampled.</li>)}</ul> : <p>Every pupil in this session has some independent evidence.</p>}
        {report.partialSamples.length > 0 && <details><summary>Areas still to explore for {report.partialSamples.length} {report.partialSamples.length === 1 ? "pupil" : "pupils"}</summary><ul>{report.partialSamples.map(row => <li key={row.studentId}>{row.name}: {row.unsampledSkills} skills not yet sampled. Open the individual report to choose a new area.</li>)}</ul></details>}
      </section>
    </>}
  </section>;
}

export default LiteracyMockReport;
