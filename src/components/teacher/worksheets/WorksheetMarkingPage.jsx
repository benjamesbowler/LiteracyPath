import { useEffect, useMemo, useState } from "react";
import { WORKSHEET_MARK_STATES } from "../../../content/worksheets/worksheetEvidenceDescriptors.js";
import { createBlankWorksheetMarks, validateWorksheetMarks } from "../../../utils/worksheets/worksheetMarks.js";
import { readWorksheetHistory, saveWorksheetObservations } from "../../../data/worksheets/worksheetEvidence.js";
import { TeacherDialog } from "../ui/TeacherDialog.jsx";

const LABELS = { independent: "Independent", supported: "With support", incorrect: "Not yet correct", not_checked: "Not checked", not_completed: "Not completed" };

export function WorksheetMarkingPage({ client, instance, students, onClose, onPlanLesson }) {
  const learners = useMemo(() => instance.learner_ids.map(id => students.find(student => student.id === id)).filter(Boolean), [instance.learner_ids, students]);
  const targets = instance.recipe.targets;
  const [marks, setMarks] = useState(() => createBlankWorksheetMarks(learners.map(row => row.id), targets.map(row => row.targetKey)));
  const [note, setNote] = useState("");
  const [latestBatch, setLatestBatch] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);
  const [pendingNotCompleted, setPendingNotCompleted] = useState(null);
  const closed = instance.status !== "open";
  const coverage = marks.filter(mark => mark.state !== "not_checked").length;

  useEffect(() => {
    let active = true;
    readWorksheetHistory(client, instance.id).then(history => {
      if (!active || !history.length) return;
      const latest = history.at(-1);
      setLatestBatch(latest); setNote(latest.note || "");
      setMarks(latest.marks.map(mark => ({ learnerId: mark.student_id, targetKey: mark.target_key, itemId: mark.item_id || null, state: mark.state, note: mark.note || "" })));
      setStatus(`Revision ${latest.revision} reopened. Saving will create a traceable correction revision.`);
    }).catch(() => { if (active) setStatus("Worksheet history could not be read. No previous marks are being assumed."); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [client, instance.id]);

  function setMark(learnerId, targetKey, state) { setMarks(current => current.map(mark => mark.learnerId === learnerId && mark.targetKey === targetKey ? { ...mark, state } : mark)); }
  function setLearnerState(learnerId, state) { setMarks(current => current.map(mark => mark.learnerId === learnerId ? { ...mark, state } : mark)); setPendingNotCompleted(null); }
  async function save() {
    setBusy(true); setStatus("");
    try {
      const validated = validateWorksheetMarks({ marks, allowedLearnerIds: learners.map(row => row.id), allowedTargetKeys: targets.map(row => row.targetKey) });
      const result = await saveWorksheetObservations(client, { instanceId: instance.id, marks: validated, note, supersedesBatchId: latestBatch?.id || null });
      const history = await readWorksheetHistory(client, instance.id);
      setLatestBatch(history.at(-1) || { id: result.batch_id, revision: result.revision });
      setStatus(`Revision ${result.revision} saved as teacher-recorded practice observation. Mastery was not changed.`);
    } catch { setStatus("The worksheet observations could not be saved. Your marks are still here; try again."); }
    finally { setBusy(false); }
  }

  return <main className="worksheet-marking" aria-labelledby="worksheet-marking-title">
    <header><div><p>Paper-to-Progress</p><h1 id="worksheet-marking-title">{instance.title}</h1><span>{learners.length} learners · {targets.length} observation targets · {instance.status}</span></div><button type="button" onClick={onClose}>Back to worksheets</button></header>
    <section className="worksheet-marking-limit" role="note"><strong>Teacher-recorded practice observation.</strong> {closed ? "This worksheet is closed and its history is read-only." : "Every new cell begins as Not checked. Mark only what you directly observed; this cannot update mastery."}</section>
    {pendingNotCompleted && <TeacherDialog className="worksheet-marking-confirm" labelledBy="worksheet-confirm-title" onClose={() => setPendingNotCompleted(null)}><h2 id="worksheet-confirm-title">Set every target to Not completed?</h2><p>This applies only to {learners.find(row => row.id === pendingNotCompleted)?.name}. You can still change individual cells before saving.</p><div><button type="button" onClick={() => setLearnerState(pendingNotCompleted, "not_completed")}>Yes, set not completed</button><button type="button" onClick={() => setPendingNotCompleted(null)}>Cancel</button></div></TeacherDialog>}
    <div className="worksheet-marking-scroll" role="region" aria-label="Worksheet observation grid" tabIndex="0"><table><thead><tr><th>Learner</th>{targets.map(target => <th key={target.targetKey}><span>{target.taskKind.replaceAll("-", " ")}</span><small>{target.purpose}</small></th>)}</tr></thead><tbody>{learners.map(learner => <tr key={learner.id}><th><strong>{learner.name}</strong><button type="button" disabled={busy || closed} onClick={() => setPendingNotCompleted(learner.id)}>Set not completed</button></th>{targets.map(target => { const mark = marks.find(row => row.learnerId === learner.id && row.targetKey === target.targetKey); return <td key={target.targetKey}><label><span className="sr-only">{learner.name}, {target.taskKind}</span><select disabled={busy || closed} value={mark?.state || "not_checked"} onChange={event => setMark(learner.id, target.targetKey, event.target.value)}>{WORKSHEET_MARK_STATES.map(state => <option key={state} value={state}>{LABELS[state]}</option>)}</select></label></td>; })}</tr>)}</tbody></table></div>
    <section className="worksheet-marking-summary"><div><span>Observed cells</span><strong>{coverage} of {marks.length}</strong></div><div><span>Not checked</span><strong>{marks.length - coverage}</strong></div><div><span>Revision</span><strong>{latestBatch?.revision || "Not saved"}</strong></div></section>
    <label className="worksheet-batch-note">Optional batch note<textarea disabled={busy || closed} maxLength="2000" value={note} onChange={event => setNote(event.target.value)} placeholder="Record an observable pattern or support used." /></label>
    <div className="worksheet-marking-actions">{!closed && <button type="button" disabled={busy} onClick={save}>{busy ? "Loading…" : latestBatch ? "Save correction revision" : "Save observations"}</button>}{onPlanLesson && <button type="button" disabled={busy} onClick={() => onPlanLesson({ learnerIds: learners.map(row => row.id), targetKeys: targets.map(row => row.targetKey) })}>Plan a follow-up lesson</button>}</div>
    {status && <p role="status" className="worksheet-marking-status">{status}</p>}
  </main>;
}
