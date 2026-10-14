import { useId, useState } from "react";
import { hasLiteracySupport, literacyEvidenceConditions } from "../../utils/literacyEvidence.js";
import { LiteracyMockFreshAction } from "./LiteracyMockFreshAction.jsx";
import { LiteracyMockImage } from "./LiteracyMockImage.jsx";
import { TeacherDataTable, TeacherFilterBar } from "../teacher/ui/TeacherPrimitives.jsx";
import { literacyMockWorkingSummary, literacyMockAccuracyText } from "../../utils/literacyMockWorkingSummary.js";
import { literacyMockAnswerText, literacyMockResponseText, literacyMockReportConditions } from "../../utils/literacyMockReport.js";

const dateText = value => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date not recorded";
const EVIDENCE_LABELS = { independent: "Independent first response", supported: "Help recorded — separate evidence", familiar: "Familiar or repeated question", content_invalid: "Question withdrawn — unscored", media_failed: "Media unavailable — unscored", skipped: "Skipped — unscored", incomplete: "Incomplete evidence — excluded", unscored: "Unscored response" };

function QuestionEvidence({ response, compact = false }) {
  const snapshot = response.itemSnapshot || {};
  const conditions = literacyMockReportConditions(response);
  const selected = Array.isArray(response.selected) ? response.selected : [response.selected];
  const rationales = [...new Set(selected.map(value => {
    const choice = snapshot.choices?.find(option => option.id === value || option.value === value || option.label === value);
    return snapshot.distractorRationales?.[value] || snapshot.distractorRationales?.[choice?.value] || snapshot.distractorRationales?.[choice?.label];
  }).filter(Boolean))];
  return <div className="literacy-mock-evidence">
    <p>{snapshot.prompt || snapshot.question || "Question wording not recorded"}</p>
    {!compact && snapshot.targetWord && <p>Target: {snapshot.targetWord}</p>}
    {!compact && (snapshot.passage || snapshot.sentence) && <blockquote>{literacyMockAnswerText(snapshot.passage || snapshot.sentence)}</blockquote>}
    {!compact && (snapshot.image || snapshot.choices?.some(choice => choice.image)) && <div className="literacy-mock-evidence-pictures">{snapshot.image && <LiteracyMockImage src={snapshot.image} alt={snapshot.imageAlt || "Question picture"} />}{snapshot.choices?.filter(choice => choice.image).map(choice => <figure key={choice.id}><LiteracyMockImage src={choice.image} alt={choice.imageAlt || choice.label} role="choice" /><figcaption>{choice.label}</figcaption></figure>)}</div>}
    <p><strong>Response:</strong> {literacyMockResponseText(response.selected, snapshot)} · <strong>{response.contentIssue ? 'Original key:' : 'Expected:'}</strong> {literacyMockResponseText(snapshot.expected ?? snapshot.answer ?? response.expected, snapshot)}</p>
    {response.contentIssue && <p><strong>Question withdrawn:</strong> {response.contentIssue.reason} The original record is preserved. This question does not count as a success or an error.</p>}
    {snapshot.demandCeiling && <p><strong>Task demand:</strong> {snapshot.ceilingReason || 'This task checks a fixed operation. Further evidence uses fresh examples at the same demand.'} This describes the task, not a limit on the learner. {snapshot.ceilingNextTask}</p>}
    {!response.contentIssue && snapshot.explanation && <p><strong>Why this answer:</strong> {snapshot.explanation}</p>}
    {!response.contentIssue && rationales.length > 0 && <div><strong>What the selected alternative may indicate:</strong>{rationales.map(value => <p key={value}>{value}</p>)}<small>This is an item-level possibility. Confirm it with a fresh example before drawing a conclusion.</small></div>}
    <small>Construct: {conditions.construct} · {conditions.modality} · {conditions.support} · {conditions.administration}</small>
    <small>{dateText(response.serverReceivedAt)}{response.sourceSessionId && ` · Session ${response.sourceSessionId}`} </small>
    <small>Level {response.level || "not recorded"} · {EVIDENCE_LABELS[response.classification] || "Unscored"}{response.classification === "independent" ? response.isCorrect ? " · Correct" : " · To revisit" : ""}{response.recent === false ? " · Historical sample" : ""}</small>
    {!compact && <small>Question {response.questionId} · {response.knownFamiliar == null ? "Earlier familiarity unknown" : response.knownFamiliar ? "Known prior practice" : "No known prior practice"}{Number.isFinite(response.responseTimeMs) ? ` · ${Math.round(response.responseTimeMs / 1000)} seconds for this response` : ""}</small>}
  </div>;
}

function EvidenceActions({ response, studentId, onFreshCheck, loadFreshCapacity, onRecordAssistance, disabled }) {
  const assisted = hasLiteracySupport(response);
  return <div className="literacy-mock-evidence-actions">
    {onFreshCheck && <LiteracyMockFreshAction key={`${studentId}:${response.sourceSessionId}:${response.questionId}`} studentId={studentId} sourceSessionId={response.sourceSessionId} questionId={response.questionId} loadCapacity={loadFreshCapacity} disabled={disabled} onPrepare={() => onFreshCheck(studentId, response.questionId, response.sourceSessionId)}>Prepare a fresh check</LiteracyMockFreshAction>}
    {onRecordAssistance && <details><summary>Record or review assistance</summary>
      <p>{literacyEvidenceConditions(response).support}. Record what happened, including help given without a child request. Reading a protected reading item or suggesting an answer counts as answer assistance.</p>
      {assisted && <p>Answer assistance stays recorded for this first response. A later access-only entry cannot make it independent.</p>}
      <div className="literacy-mock-controls">{[['none', 'No assistance needed'], ['access', 'Controls or access only'], ['answer', 'Help with the answer']].map(([value, label]) =>
        <button key={value} type="button" disabled={disabled || (assisted && value !== 'answer')} onClick={() => onRecordAssistance(studentId, response.questionId, value, response.sourceSessionId)}>{label}</button>)}</div>
    </details>}
  </div>;
}

export function LiteracyMockReport({ report, initialStudentId = "", studentId: controlledStudentId, onStudentChange, onFreshCheck, onEntryCheck, loadFreshCapacity, onRecordAssistance, actionDisabled = false }) {
  const titleId = useId();
  const [studentId, setStudentId] = useState(initialStudentId);
  const [selected, setSelected] = useState({});
  if (!report) return null;
  const selectPupil = id => { setStudentId(id); onStudentChange?.(id); };
  const pupil = report.pupils.find(row => row.studentId === (controlledStudentId ?? studentId)) || null;
  const summary = pupil ? literacyMockWorkingSummary(pupil) : null;
  const shownSkills = pupil ? report.totalSkills - pupil.notOfferedSkills : 0;
  return <section className="literacy-mock-report" aria-labelledby={titleId}>
    <header><p className="panel-label">Adaptive Literacy Test</p><h3 id={titleId} tabIndex={-1}>Test results</h3><p>See each child’s working profile, independent accuracy and next teaching step.</p><details><summary>How to read these results</summary><p>{report.note}</p></details></header>
    <TeacherFilterBar label="Adaptive Literacy Test report view">
      <label>Report for<select value={pupil?.studentId || ""} onChange={event => selectPupil(event.target.value)}>
        <option value="">Whole class</option>
        {report.pupils.map(row => <option key={row.studentId} value={row.studentId}>{row.name}</option>)}
      </select></label>
    </TeacherFilterBar>
    {pupil ? <>
      <h4>{pupil.name} — test results</h4>
      {pupil.run?.status !== "completed" && <p role="status">Results received so far. The working profile can change as more answers arrive.</p>}
      {pupil.planned > 0 && <p><strong>{pupil.answered===pupil.planned ? `All ${pupil.planned} questions answered.` : `${pupil.answered} of ${pupil.planned} questions answered.${pupil.run?.status==='completed' ? ' Partial sitting.' : ''}`}</strong></p>}
      <dl className="literacy-mock-metrics literacy-mock-result-summary">
        <div><dt>Current working level</dt><dd>{summary.stage.label}</dd></div>
        <div><dt>Correct independently</dt><dd>{summary.accuracy.percent === null ? "Not measured" : `${summary.accuracy.percent}%`}</dd><small>{summary.accuracy.correct} of {summary.accuracy.answered} independent answers correct</small>{summary.helped.answered+summary.familiar.answered+summary.unscored>0 && <small>{[[summary.helped.answered,'helped'],[summary.familiar.answered,'familiar/repeated'],[summary.unscored,'unscored']].filter(([count])=>count>0).map(([count,label])=>`${count} ${label}`).join(' · ')} kept separate</small>}</div>
        <div><dt>Next teaching step</dt><dd>{summary.nextStep}</dd></div>
      </dl>
      <p>{summary.stage.detail} </p>
      <details><summary>How the percentage and level work</summary><p>The percentage uses fresh, independent scored answers. Helped answers, repeated questions, skipped work, withdrawn questions and technical failures stay separate. An adaptive test changes difficulty, so compare question demand and evidence alongside the percentage.</p><p>Working levels use the app’s shared evidence and accuracy rules, separately for Foundation and Challenge tasks. A small sample does not establish a level. Foundation and Challenge are local task demands, not grades, reading ages or official MAP scores. These observations cover sampled skills; they do not imply mastery of the full catalogue.</p><p>Helped answers: {literacyMockAccuracyText(summary.helped)}. Familiar or repeated answers: {literacyMockAccuracyText(summary.familiar)}.</p></details>
      {pupil.mediaFailureCount > 0 && <p className="literacy-mock-notice">{pupil.mediaFailureCount} {pupil.mediaFailureCount === 1 ? "question presentation was" : "question presentations were"} affected by unavailable media. These events did not use an answer slot or create a skill result.</p>}
      {pupil.withdrawnQuestionCount > 0 && <p className="literacy-mock-notice">{pupil.withdrawnQuestionCount} {pupil.withdrawnQuestionCount === 1 ? 'question was' : 'questions were'} withdrawn after a content check. Saved responses remain visible and are excluded from successes, errors and teaching suggestions.</p>}
      <TeacherDataTable label={`${pupil.name}: four literacy areas`} className="literacy-mock-table">
        <caption>Working level and independent accuracy across four literacy areas</caption>
        <thead><tr><th scope="col">Area</th><th scope="col">Working level</th><th scope="col">Correct independently</th><th scope="col">Next step / evidence</th></tr></thead>
        <tbody>{pupil.areas.map(area => { const view=literacyMockWorkingSummary(pupil,{domains:area.domains}); return <tr key={area.id}><th scope="row">{area.label}</th><td>{view.stage.label}<small>{view.levels.map(level=>`${level.label}: ${literacyMockAccuracyText(level)}`).join(' · ') || 'No independent sample'}</small></td><td>{literacyMockAccuracyText(view.accuracy)}<small>{area.supported} helped · {area.familiar} familiar · {area.unscored} unscored</small></td><td>{view.nextStep}<small>{area.offeredSkills} skills shown · {area.independentSkills} with independent answers</small></td></tr>; })}</tbody>
      </TeacherDataTable>
      <details><summary>Answer and coverage details</summary>      <dl className="literacy-mock-metrics">
        <div><dt>Questions answered</dt><dd>{pupil.answered}{pupil.planned !== null ? ` of ${pupil.planned}` : ""}</dd></div>
        <div><dt>Skills shown in this sitting</dt><dd>{shownSkills}</dd></div>
        <div><dt>Independent responses</dt><dd>{pupil.totals.independent}</dd></div>
        </dl>
      <p>More than one question can check the same skill. A sitting samples part of the full skill catalogue.</p>
<p>The {report.totalSkills} skills are the full catalogue, not a completion target for one sitting. Skills without a recorded question are not missing answers or weaknesses.</p><dl className="literacy-mock-metrics">
        <div><dt>Questions not reached</dt><dd>{pupil.notReachedItems ?? "Not recorded for this older session"}</dd></div>
        <div><dt>Seen without an answer</dt><dd>{pupil.presentedUnansweredItems ?? "Not recorded"}</dd></div>
        <div><dt>Skills without a recorded question in this sitting</dt><dd>{pupil.notOfferedSkills} of {report.totalSkills} catalogue skills</dd></div>
        <div><dt>Skills shown without an independent answer</dt><dd>{pupil.offeredWithoutIndependentResponse}</dd></div>
      </dl></details>
      <details><summary>Strengths and practice ideas</summary>
      <div className="literacy-mock-insights">
        <section><h4>What went well</h4>{pupil.strengths.length ? <ul>{pupil.strengths.slice(0, 3).map(skill => <li key={skill.id}><strong>{skill.label}</strong>: {skill.correct} correct independent {skill.correct === 1 ? "response" : "responses"}. {skill.incorrect > 0 && `${skill.incorrect} other responses to revisit.`}</li>)}</ul> : <p>No correct independent responses recorded yet. This does not establish a weakness.</p>}</section>
        <section><h4>Practise next</h4>{pupil.revisit.length ? <ul>{pupil.revisit.slice(0, 3).map(skill => <li key={skill.id}><strong>{skill.label}</strong>: {skill.incorrect} independent {skill.incorrect === 1 ? "response" : "responses"} to revisit.<p>Try a new example together to decide what to teach next.</p></li>)}</ul> : <p>No independent errors recorded. Sample other skills before drawing a broader conclusion.</p>}</section>
      </div>
      </details>
      <details className="literacy-mock-longitudinal"><summary>Comparable evidence across sessions</summary>
        <p>These patterns combine this session with earlier completed sessions of the same content version. Only recent independent responses with the same skill, construct, level, access conditions and recorded window behavior count together. Familiar, helped and unanswered work stays separate. Current suggestions use the latest comparable sample that meets the shared evidence minimum, keeping equally dated responses together. All dated observations remain visible. This is evidence for teacher review, not a proficiency or growth score.</p>
        {pupil.longitudinal?.available ? <p>Earlier history covers up to {pupil.longitudinal.historyCoverage?.limit ?? 20} completed sessions in the {pupil.longitudinal.windowDays}-day window before this session.{pupil.longitudinal.historyCoverage?.truncated && ' More earlier sessions exist than this view includes.'}</p> : <p>Earlier sessions were not supplied by this report service. Only this session is included.</p>}
        {pupil.longitudinal?.patterns.length ? pupil.longitudinal.patterns.map(pattern => <section key={pattern.id} className="literacy-mock-group-member">
          <h4>{pattern.label} · Level {pattern.level}</h4><p>{pattern.conditions.construct} · {pattern.conditions.modality} · {pattern.conditions.administration}</p>
          <p>All dated observations: {pattern.correct} correct · {pattern.incorrect} to revisit · {pattern.responses.length} independent responses across {pattern.sessionCount} {pattern.sessionCount === 1 ? 'session' : 'sessions'}, from {dateText(pattern.firstObservedAt)} to {dateText(pattern.lastObservedAt)}.</p>
          <p>Latest comparable sample: {pattern.currentSample.correct} correct · {pattern.currentSample.incorrect} to revisit · {pattern.currentSample.responses.length} responses, from {dateText(pattern.currentSample.firstObservedAt)} to {dateText(pattern.currentSample.lastObservedAt)}. {pattern.teachingReviewEligible ? 'Enough current comparable evidence to consider a teaching group after reviewing these responses.' : pattern.conclusion.ready ? 'This latest sample does not suggest a teaching group. No proficiency judgment is made.' : pattern.conclusion.confidence.detail + '. More independent evidence is needed. Use a fresh example if one remains, or collect comparable evidence outside this finite practice bank.'}</p>
          <details><summary>Inspect the dated evidence</summary>{pattern.responses.map(response => <div key={`${response.sourceSessionId}:${response.questionId}:${response.index}`}><QuestionEvidence response={response} /><EvidenceActions response={response} studentId={pupil.studentId} onFreshCheck={onFreshCheck} loadFreshCapacity={loadFreshCapacity} onRecordAssistance={onRecordAssistance} disabled={actionDisabled} /></div>)}</details>
        </section>) : <p>No recent independent observations are available for a comparable pattern.</p>}
        {pupil.longitudinal?.otherResponses?.length > 0 && <details><summary>Other earlier observations ({pupil.longitudinal.otherResponses.length})</summary><p>These saved responses are familiar, helped, unscored or outside the recent window. They do not count toward the independent patterns above.</p>{pupil.longitudinal.otherResponses.map(response => <div key={`${response.sourceSessionId}:${response.questionId}:${response.index}`}><QuestionEvidence response={response} /><EvidenceActions response={response} studentId={pupil.studentId} onFreshCheck={onFreshCheck} loadFreshCapacity={loadFreshCapacity} onRecordAssistance={onRecordAssistance} disabled={actionDisabled} /></div>)}</details>}
      </details>
      <details><summary>All {report.totalSkills} skills and next steps</summary>
        <p>This is the full skill catalogue. A skill without a recorded question in this sitting has no result here; it is not a weakness or an unfinished question.</p>
        <TeacherDataTable label={`${pupil.name}: detailed skill evidence`} className="literacy-mock-table literacy-mock-skill-table">
          <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Skill</th><th role="columnheader" scope="col">Evidence by level</th><th role="columnheader" scope="col">Next evidence check</th></tr></thead>
          <tbody role="rowgroup">{pupil.skills.map(skill => <tr key={skill.id} role="row">
            <th role="rowheader" scope="row">{skill.label}<small>{skill.domainLabel}</small></th>
            <td role="cell"><strong className="literacy-mock-mobile-cell-label" aria-hidden="true">Evidence by level</strong>{skill.offered ? <>{skill.offeredWithoutIndependentResponse && <p>Shown without an independent answer.</p>}{skill.mediaFailureCount > 0 && <p>{skill.mediaFailureCount} media-unavailable presentations; no answer recorded.</p>}{skill.levels.map(level => <p key={level.level}>Level {level.level}: {level.correct} correct · {level.incorrect} to revisit · {level.supported + level.familiar + level.unscored} separate/unscored</p>)}<small>{skill.evidenceSufficiency.ready ? "Descriptive sample only; no proficiency judgment." : skill.evidenceSufficiency.reason}</small></> : "No recorded question in this sitting — no result"}</td>
            <td role="cell"><strong className="literacy-mock-mobile-cell-label" aria-hidden="true">Next evidence check</strong>{skill.offered ? "Check a fresh example at the same level and access conditions if one remains. Otherwise collect comparable evidence outside this practice bank." : "Check access to an entry-level example, then collect a first sample."}{!skill.offered && onEntryCheck && <LiteracyMockFreshAction key={`${pupil.studentId}:${report.session?.id}:${skill.id}`} studentId={pupil.studentId} sourceSessionId={report.session?.id} skillId={skill.id} loadCapacity={loadFreshCapacity} disabled={actionDisabled} onPrepare={() => onEntryCheck(pupil.studentId, skill.id)}>Prepare first sample: {skill.label}</LiteracyMockFreshAction>}</td>
          </tr>)}</tbody>
        </TeacherDataTable>
      </details>
      <details><summary>Question-by-question evidence ({pupil.responses.length})</summary>
        {pupil.responses.length ? <ol className="literacy-mock-response-list">{pupil.responses.map(response => <li key={`${response.questionId}:${response.index}`}><strong>{pupil.skills.find(skill => skill.id === response.skillId)?.label || "Skill needs review"}</strong><QuestionEvidence response={response} /><EvidenceActions response={response} studentId={pupil.studentId} onFreshCheck={onFreshCheck} loadFreshCapacity={loadFreshCapacity} onRecordAssistance={onRecordAssistance} disabled={actionDisabled} /></li>)}</ol> : <p>No saved responses. Questions not reached do not count as errors.</p>}
      </details>
      {pupil.unansweredPresentations?.length > 0 && <details><summary>Seen without a saved answer ({pupil.unansweredPresentations.length})</summary><p>These questions were shown. No answer was saved, so they are not errors.</p><ul>{pupil.unansweredPresentations.map(value => <li key={value.questionId}><QuestionEvidence response={value} /><EvidenceActions response={{ ...value, sourceSessionId: report.session?.id }} studentId={pupil.studentId} onFreshCheck={onFreshCheck} loadFreshCapacity={loadFreshCapacity} onRecordAssistance={onRecordAssistance} disabled={actionDisabled} /></li>)}</ul></details>}
      {pupil.mediaFailureCount > 0 && <details><summary>Media availability log ({pupil.mediaFailureCount})</summary>
        <p>Pictures or recordings were unavailable. These are technical events, separate from answers and teaching groups.</p>
        <ol className="literacy-mock-response-list">{pupil.mediaFailures.map(failure => <li key={`${failure.questionId}:${failure.index}`}>
          <strong>{pupil.skills.find(skill => skill.id === failure.skillId)?.label || "Skill not recorded"}</strong>
          <p>{failure.itemSnapshot?.prompt || "Question wording not recorded"}</p>
          <small>Question {failure.questionId} · Level {failure.level || "not recorded"} · Media unavailable — no answer recorded</small>
        </li>)}</ol>
      </details>}
    </> : <>
      <h4>Class results at a glance</h4>
      <TeacherDataTable label="Class assessment summary" className="literacy-mock-table"><caption>Received answers, working level and next teaching step for every child</caption><thead><tr><th scope="col">Student</th><th scope="col">Received answers</th><th scope="col">Current working level</th><th scope="col">Correct independently</th><th scope="col">Next teaching step</th></tr></thead><tbody>{report.pupils.map(row=>{const view=literacyMockWorkingSummary(row);return <tr key={row.studentId}><th scope="row"><button type="button" onClick={()=>selectPupil(row.studentId)}>{row.name}</button></th><td>{row.answered}{row.planned!==null ? ` of ${row.planned}` : ''}<small>{!row.run ? 'No sitting received' : row.run.status==='completed' ? 'Finished / partial sitting received' : 'Still collecting / in progress'}</small></td><td>{view.stage.label}</td><td>{literacyMockAccuracyText(view.accuracy)}<small>{view.helped.answered} helped answers separate</small></td><td>{view.nextStep}</td></tr>;})}</tbody></TeacherDataTable>
      <h4>What to practise next</h4>
      <p>Open an area below to see children’s answers, then open a child’s report. Try a new example together before deciding what to teach.</p>
      <details><summary>How these suggestions are chosen</summary><p>This unselected review list uses recent independent errors from this session and the available earlier sessions, at the same skill, level and access conditions. A small sample calls for a fresh check, not a teaching group. Nothing creates a placement or saved group.</p></details>
      {report.reviewCandidates?.length ? <div className="literacy-mock-groups">{report.reviewCandidates.map(group => {
        const included = group.members.filter(member => selected[`${group.id}:${member.studentId}`]);
        return <details key={group.id}><summary>{group.label} · Level {group.level} <span>{included.length} selected for teacher review</span></summary><p>{group.suggestion}</p><p>{group.conditions.administration}</p>
          {group.members.map(member => <section key={member.studentId} className="literacy-mock-group-member"><label><input type="checkbox" checked={Boolean(selected[`${group.id}:${member.studentId}`])} onChange={event => setSelected(previous => ({ ...previous, [`${group.id}:${member.studentId}`]: event.target.checked }))} /><strong>{member.name}</strong></label><p>All dated observations: {member.incorrectCount} recent {member.incorrectCount === 1 ? "error" : "errors"} · {member.independentCount} independent {member.independentCount === 1 ? "response" : "responses"} on this skill at level {group.level}. Latest comparable sample: {member.currentSample.correct} correct · {member.currentSample.incorrect} to revisit. {member.conclusion.ready ? "Enough comparable responses for a teacher to review the current pattern." : "Not enough comparable evidence for a teaching-group suggestion."}</p>{member.examples.map(response => <QuestionEvidence key={`${response.sourceSessionId}:${response.questionId}:${response.index}`} response={response} compact />)}</section>)}
          {included.length > 0 && <div className="literacy-mock-review-actions"><h4>Selected next checks</h4>{included.map(member => {
            const source = member.examples.at(-1);
            return <div key={member.studentId}><strong>{member.name}</strong><button type="button" onClick={() => selectPupil(member.studentId)}>Open {member.name}’s evidence</button>{onFreshCheck && <LiteracyMockFreshAction key={`${member.studentId}:${source.sourceSessionId}:${source.questionId}`} studentId={member.studentId} sourceSessionId={source.sourceSessionId} questionId={source.questionId} loadCapacity={loadFreshCapacity} disabled={actionDisabled} onPrepare={() => onFreshCheck(member.studentId, source.questionId, source.sourceSessionId)}>Prepare fresh check for {member.name}</LiteracyMockFreshAction>}</div>;
          })}</div>}
        </details>;
      })}</div> : <p className="literacy-mock-notice">No recent independent errors to review yet. Collect more evidence; do not infer that every skill is secure.</p>}
      <section className="literacy-mock-neutral"><h4>Independent evidence and skill coverage</h4><p>Each sitting samples part of the full skill catalogue. Skills without a recorded question are not missing answers or weaknesses.</p>{report.needsSample.length ? <ul>{report.needsSample.map(row => <li key={row.studentId}>{row.name}: no independent sample yet; {row.offeredWithoutIndependentResponse} skills shown without an independent answer. Open the individual report to check what was answered and decide on a first sample.</li>)}</ul> : <p>Every pupil in this session has some independent evidence.</p>}
        {report.partialSamples.length > 0 && <details><summary>Skill coverage by pupil</summary><ul>{report.partialSamples.map(row => <li key={row.studentId}>{row.name}: {report.totalSkills - row.notOfferedSkills} skills shown in this sitting; {row.offeredWithoutIndependentResponse} shown without an independent answer. Open the individual report for the full catalogue and optional next checks.</li>)}</ul></details>}
      </section>
    </>}
  </section>;
}

export default LiteracyMockReport;
