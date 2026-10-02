import { useState } from "react";
import { isProgressTest } from "../../policy/progressTestPolicy.js";
import { exportProgressCheckWorkbook, progressSampleScope, progressTeachNext } from "../../utils/exportProgressCheck.js";
export function ProgressCheckReportsPanel({ records = [], selectedStudentId = "" }) {
  const [error, setError] = useState("");
  const rows = records.filter(record => isProgressTest(record) && (!selectedStudentId || record.studentId === selectedStudentId));
  if (!rows.length) return null;
  return <section className="progress-report-panel"><h2>Progress check evidence</h2><p>These are descriptive observations of selected questions. Adaptive accuracy and tier changes are not mastery or calibrated growth scores.</p>
    {rows.map(record => <details key={record.attemptId}><summary>{record.studentName} · {new Date(record.completedAt || record.startedAt).toLocaleDateString()} · {record.administrationStatus === "completed" ? "Complete" : "Partial"}</summary>
      <p>Stimulus familiarity may be unknown. Known prior question families and story recordings were excluded. Familiar isolated-word recordings may appear in fresh comparisons.</p>
      <table><thead><tr><th>Sampled strand</th><th>Independent answers</th><th>Other presentations</th><th>Evidence</th></tr></thead><tbody>{(record.metadata?.result?.strands || []).map(row => <tr key={row.trackId}><th>{row.label}</th><td>{row.correctCount} correct · {row.incorrectCount} incorrect</td><td>{Object.entries(row.responseStates || {}).filter(([, count]) => count).map(([state, count]) => `${count} ${state.replaceAll("_", " ")}`).join(" · ") || "None"}</td><td>{row.independentCount < 10 ? "Insufficient for a proficiency conclusion" : row.independentCount < 20 ? "Provisional descriptive sample" : "Descriptive sample"}. {row.stopReason.replaceAll("_", " ")}</td></tr>)}</tbody></table>
      <p>Sampled tasks: {(record.metadata?.result?.strands || []).map(row => progressSampleScope[row.trackId]).join("; ")}. These samples do not establish whole-strand proficiency, oral reading fluency, inference or grammar knowledge.</p>
      <h3>Teach next and check again</h3><ul>{progressTeachNext(record).map(row => <li key={row.trackId}>{row.label}: {row.independentCount ? row.suggestion : "Collect fresh independent responses before drawing a conclusion."}</li>)}</ul>
      <details><summary>View item evidence and routing</summary><table><thead><tr><th>Question</th><th>Tier</th><th>Response</th><th>Next tier</th></tr></thead><tbody>{record.questionRecords?.map(row => <tr key={row.responseId}><td>{row.itemSnapshot?.prompt}<br/>{row.itemSnapshot?.passage || row.itemSnapshot?.targetWord || row.questionId}</td><td>{row.difficultyTier + 1}</td><td>{row.responseStatus.replaceAll("_", " ")} · {row.selected || "No selection"}</td><td>{row.routeAfter == null ? "Unchanged" : row.routeAfter + 1}</td></tr>)}</tbody></table></details>
      <button type="button" onClick={() => exportProgressCheckWorkbook([record]).catch(failure => setError(failure.message))}>Export progress evidence</button>
    </details>)}{error && <p role="alert">{error}</p>}
  </section>;
}
