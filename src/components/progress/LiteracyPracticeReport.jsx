import { literacyEvidenceConditions } from "../../utils/literacyEvidence.js";
import { useId } from "react";
import { mapPracticeAnswerLabel } from '../../utils/mapPracticeResponse.js';

function answerText(value) {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (Array.isArray(value)) return value.map(answerText).join(", ");
  if (typeof value === "object") return answerText(value.label || value.text || value.word || value.id || "Recorded response");
  return String(value);
}

function dateText(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date not recorded";
}

const CLASSIFICATION_LABELS = {
  independent_first_probe: "First independent response", supported: "Help used", supported_transfer: "Transfer after teaching",
  repeat: "Repeated question", known_familiar: "Previously practiced question", skipped: "Skipped", no_response: "No response",
  media_failed: "Media unavailable", audio_not_delivered: "Required audio not completed", invalid: "Unscored response",
  incomplete: "Incomplete evidence", unknown_recency: "Date needs review", conflict: "Conflicting evidence — excluded"
};

function passageAccessLabel(response) {
  const item = response.itemSnapshot;
  if (item?.passageAudioUsed) return 'Passage read aloud · supported';
  if (item?.passageAccess === 'text_and_audio') return 'Passage text and audio available';
  if (item?.passageAccess === 'text_with_optional_audio') return 'Passage text available · narration unused';
  if (item?.passageAccess === 'text_only') return 'Passage text available';
  return '';
}

/** Teacher diagnostic surface. Keep out of the child's practice completion view. */
export function LiteracyPracticeReport({ report, onPractise, studentName = "" }) {
  const titleId = useId();
  if (!report) return null;
  const { totals, domains, skills, strengths, nextSteps, responses } = report;
  const displayedSteps = nextSteps.slice(0, 4);
  return <section className="literacy-practice-report" aria-labelledby={titleId}>
    <header className="literacy-practice-report__header">
      <p className="literacy-practice-report__eyebrow">Teacher practice report</p>
      <h2 id={titleId}>{studentName ? `${studentName}’s literacy practice` : "Literacy practice"}</h2>
      <p>See observed responses, choose a useful fresh check, and find areas still to explore.</p>
    </header>
    <dl className="literacy-practice-report__metrics">
      <div><dt>Skills with recent independent samples</dt><dd>{totals.skillsWithRecentSamples} of {totals.totalSkills}</dd></div>
      <div><dt>Recent independent first responses</dt><dd>{totals.recentIndependentCount}</dd></div>
      <div><dt>Help and supported transfer</dt><dd>{totals.supported + totals.supportedTransfers}</dd></div>
      <div><dt>Skills not yet offered</dt><dd>{totals.notYetSampled}</dd></div>
      <div><dt>Offered without an independent response</dt><dd>{totals.offeredWithoutIndependentResponse}</dd></div>
      <div><dt>Skills with historical samples only</dt><dd>{totals.historicalOnlySkills}</dd></div>
    </dl>
    <p className="literacy-practice-report__note">{report.note}</p>
    {(totals.conflicts > 0 || totals.invalidRecords > 0) && <p className="literacy-practice-report__notice" role="status">Some evidence needs review: {totals.conflicts} conflicting {totals.conflicts === 1 ? "presentation" : "presentations"} and {totals.invalidRecords} incomplete {totals.invalidRecords === 1 ? "record" : "records"} were excluded from independent results.</p>}
    {report.legacyEvidenceUnknown && <p className="literacy-practice-report__notice">Earlier completion history has no item-level evidence. It cannot establish a strength or weakness.</p>}
    <div className="literacy-practice-report__insights">
      <section><h3>Observed successes</h3>
        {strengths.length ? <ul>{strengths.slice(0, 4).map(strength => <li key={strength.skillId}><strong>{strength.label}</strong><p>{strength.description}</p></li>)}</ul>
          : <p>Correct independent first responses will appear here. Missing results do not mean a child cannot do a skill.</p>}
      </section>
      <section><h3>Suggested next checks</h3><p>These suggestions do not verify that a fresh item is available. Opening practice uses its usual entry routing; it does not launch the suggested level directly.</p>
        {displayedSteps.length ? <ol>{displayedSteps.map(step => <li key={step.skillId}><strong>{step.label}</strong><p>{step.reason} {step.suggestion}</p>
          {onPractise && <button type="button" onClick={() => onPractise(step.skillId)}>Open {step.label} practice</button>}
        </li>)}</ol> : <p>Start a practice session to collect a useful sample.</p>}
      </section>
    </div>
    <h3>Coverage across literacy</h3>
    <p>Current evidence window: {dateText(report.evidenceWindow.from)}–{dateText(report.evidenceWindow.to)}. Counts below describe coverage; they are not scores.</p>
    <div className="literacy-practice-report__table-wrap"><table>
      <caption>Literacy domains and practice coverage</caption>
      <thead><tr><th scope="col">Literacy area</th><th scope="col">Skills sampled recently</th><th scope="col">Independent first responses</th><th scope="col">Help / transfer</th></tr></thead>
      <tbody>{domains.map(domain => <tr key={domain.id}><th scope="row">{domain.label}</th><td>{domain.skillsWithRecentSamples} of {domain.totalSkills}</td><td>{domain.recentIndependentCount} recent · {domain.historicalIndependentCount} historical</td><td>{domain.supported} / {domain.supportedTransfers}</td></tr>)}</tbody>
    </table></div>
    <details className="literacy-practice-report__skills"><summary>Explore every skill ({skills.length})</summary>
      <div className="literacy-practice-report__table-wrap"><table>
        <caption>Skill observations, separated by practice level</caption>
        <thead><tr><th scope="col">Skill</th><th scope="col">Coverage</th><th scope="col">Recent first responses by level</th><th scope="col">Next move</th></tr></thead>
        <tbody>{skills.map(skill => <tr key={skill.skillId}><th scope="row">{skill.label}<small>{skill.domainLabel}</small></th><td>{skill.coverageLabel}<p>{skill.evidenceNote}</p>{skill.lastPracticedAt && <small>Last practiced {dateText(skill.lastPracticedAt)}</small>}</td>
          <td>{skill.levels.some(level => level.recentIndependentCount) ? <ul>{skill.levels.filter(level => level.recentIndependentCount).map(level => <li key={level.level}>Practice level {level.level}: {level.recentCorrect} correct · {level.recentIncorrect} to revisit ({level.recentIndependentCount} independent first responses). {level.evidenceSufficiency.ready ? "Descriptive practice sample." : "Not enough results for a skill judgment."}</li>)}</ul> : "No recent independent sample"}
            {(skill.supported > 0 || skill.supportedTransfers > 0) && <p>{skill.supported} with help · {skill.supportedTransfers} supported transfer</p>}
          </td><td>{nextSteps.find(step => step.skillId === skill.skillId)?.suggestion || "Review the incomplete record before collecting new evidence."}{onPractise && skill.skillId !== "unidentified" && <p><button type="button" onClick={() => onPractise(skill.skillId)}>Open {skill.label} practice</button></p>}</td></tr>)}</tbody>
      </table></div>
    </details>
    <details className="literacy-practice-report__evidence"><summary>View question evidence ({responses.length})</summary>
      <p>{totals.repeats} repeated presentations · {totals.knownFamiliar} known familiar presentations · {totals.skipped} skipped · {totals.noResponse} unanswered · {totals.mediaFailed + totals.audioNotDelivered} media unavailable or incomplete. These do not count as independent first responses. A question may appear in more than one of these counts.</p>
      <div className="literacy-practice-report__table-wrap"><table>
        <caption>Recorded questions, answers, support and provenance</caption>
        <thead><tr><th scope="col">Question</th><th scope="col">Practice level / date</th><th scope="col">Recorded answer</th><th scope="col">Evidence use</th></tr></thead>
        <tbody>{responses.map(response => <tr key={`${response.responseId}:${response.stepIndex}`}><td><strong>{skills.find(skill => skill.skillId === response.skillId)?.label || response.skillName || "Unidentified skill"}</strong><p>{response.itemSnapshot?.prompt || "Prompt not recorded"}</p>
          {(response.itemSnapshot?.passage || response.itemSnapshot?.sentence) && <p>{answerText(response.itemSnapshot.passage || response.itemSnapshot.sentence)}</p>}
          {response.itemSnapshot?.targetWord && <p>Target: {answerText(response.itemSnapshot.targetWord)}</p>}<small>Question {response.questionId || "not recorded"}</small></td>
          <td>{response.level ? `Practice level ${response.level}` : "Level not recorded"}<br/>{dateText(response.occurredAt)}<br/>{response.recency === "historical" ? "Historical" : response.recency === "recent" ? "Recent" : "Date needs review"}</td>
          <td>{answerText(mapPracticeAnswerLabel(response.selected, response.itemSnapshot))}{response.countedIndependent && <p>{response.isCorrect ? "Correct first response" : "First response to revisit"}</p>}<small>Expected: {answerText(mapPracticeAnswerLabel(response.expected ?? response.itemSnapshot?.expected, response.itemSnapshot))}</small></td>
          <td>{CLASSIFICATION_LABELS[response.classification] || "Unscored response"}<p>Construct: {literacyEvidenceConditions(response).construct} · {literacyEvidenceConditions(response).modality} · {literacyEvidenceConditions(response).support} · {literacyEvidenceConditions(response).administration}</p>{passageAccessLabel(response) && <p>{passageAccessLabel(response)}</p>}<p>{response.familiarityStatus === "unknown" ? "Earlier familiarity unknown" : response.knownFamiliar ? "Known prior practice" : "No known prior practice"}</p></td>
        </tr>)}</tbody>
      </table></div>
    </details>
  </section>;
}

export default LiteracyPracticeReport;
