import { useMemo, useState } from "react";
import {
  createTeacherInsightIntervention,
  recordTeacherInsightObservation
} from "../../data/teacherInsightActions.js";
import {
  buildInsightActionSnapshot,
  buildInsightPracticeTargets,
  defaultInsightPracticeTargetIds,
  insightPracticeStopIndex,
  insightResourceName,
  normalizeTeacherInsight
} from "../../utils/teacherInsightActions.js";
import { localDateKey } from "../../utils/teacherInterventions.js";
import {
  packTargetLabel,
  printPracticePack
} from "../../utils/worksheets/practicePack.js";
import { TeacherModal } from "./ui/TeacherDialog.jsx";

function defaultActivity(action, insight, targets) {
  if (action === "assign_practice") {
    const labels = targets.map(target => target.label).join(", ");
    return `Complete targeted Sound Seekers practice for ${labels}, then review new independent evidence.`;
  }
  if (action === "plan_small_group") {
    return `Model ${insight.focus}, rehearse together, then check one unseen transfer item.`;
  }
  return "Respond to the recorded observation with explicit teaching, then review new evidence.";
}

function actionTitle(action) {
  if (action === "assign_practice") return "Assign practice";
  if (action === "plan_small_group") return "Plan small group";
  return "Record observation";
}

export function TeacherInsightActions({
  supabase,
  classId,
  className,
  insight,
  rows = []
}) {
  const normalized = useMemo(() => normalizeTeacherInsight(insight), [insight]);
  const practiceTargets = useMemo(
    () => buildInsightPracticeTargets(normalized, rows),
    [normalized, rows]
  );
  const defaultTargetIds = useMemo(
    () => defaultInsightPracticeTargetIds(normalized, rows),
    [normalized, rows]
  );
  const [activeAction, setActiveAction] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState([]);
  const [ownerLabel, setOwnerLabel] = useState("Class teacher");
  const [activity, setActivity] = useState("");
  const [observation, setObservation] = useState("");
  const [plannedFor, setPlannedFor] = useState(localDateKey());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  if (!normalized) return null;

  function openAction(action) {
    const selectedTargets = practiceTargets.filter(target => defaultTargetIds.includes(target.id));
    setActiveAction(action);
    setSelectedStudentIds(normalized.learners.map(learner => learner.id));
    setSelectedTargetIds(defaultTargetIds);
    setOwnerLabel("Class teacher");
    setActivity(defaultActivity(action, normalized, selectedTargets));
    setObservation("");
    setPlannedFor(localDateKey());
    setStatus("");
  }

  function closeAction() {
    if (busy) return;
    setActiveAction("");
  }

  function toggleStudent(studentId) {
    setSelectedStudentIds(current => (
      current.includes(studentId)
        ? current.filter(id => id !== studentId)
        : [...current, studentId]
    ));
  }

  function toggleTarget(targetId) {
    setSelectedTargetIds(current => {
      if (current.includes(targetId)) return current.filter(id => id !== targetId);
      return current.length >= 6 ? current : [...current, targetId];
    });
  }

  async function submitAction(event) {
    event.preventDefault();
    const snapshot = buildInsightActionSnapshot(normalized);
    if (
      !snapshot
      || !selectedStudentIds.length
      || !ownerLabel.trim()
      || !activity.trim()
      || !plannedFor
      || busy
    ) return;
    if (activeAction === "assign_practice" && !selectedTargetIds.length) return;
    if (activeAction === "record_observation" && !observation.trim()) return;

    setBusy(true);
    setStatus("");
    try {
      if (activeAction === "record_observation") {
        await recordTeacherInsightObservation({
          supabase,
          classId,
          insight: snapshot,
          studentIds: selectedStudentIds,
          note: observation.trim(),
          ownerLabel: ownerLabel.trim(),
          followUpActivity: activity.trim(),
          followUpOn: plannedFor
        });
        setStatus(`Observation recorded for ${normalized.label}; its follow-up is tracked on Today.`);
      } else {
        await createTeacherInsightIntervention({
          supabase,
          actionType: activeAction,
          classId,
          insight: snapshot,
          studentIds: selectedStudentIds,
          targets: activeAction === "assign_practice" ? selectedTargetIds : [],
          ownerLabel: ownerLabel.trim(),
          activity: activity.trim(),
          plannedFor
        });
        setStatus(activeAction === "assign_practice"
          ? `Practice assigned for ${normalized.label}; its response is tracked on Today.`
          : `Small-group plan saved for ${normalized.label}; its response is tracked on Today.`);
      }
      setActiveAction("");
    } catch (error) {
      console.error("Insight action error:", error);
      setStatus("That action was not saved. Existing evidence and plans are unchanged.");
    } finally {
      setBusy(false);
    }
  }

  function printResource() {
    const targets = defaultTargetIds;
    const stopIndex = insightPracticeStopIndex(normalized, rows);
    if (!targets.length || !stopIndex) {
      setStatus(
        "No exact decodable Sound Seekers target is available for this insight yet. Review the evidence before printing."
      );
      return;
    }
    try {
      const result = printPracticePack({
        name: insightResourceName(normalized),
        targets,
        stopIndex
      });
      if (!result) {
        setStatus("The print window was blocked. Allow pop-ups and use Print resource again.");
        return;
      }
      setStatus(result.skipped.length
        ? `Resource opened. Targets without enough decodable words were omitted: ${result.skipped.map(packTargetLabel).join(", ")}.`
        : `Printable decodable resource opened for ${normalized.label}.`);
    } catch (error) {
      console.error("Print insight resource error:", error);
      setStatus(error.message || "The resource could not be built.");
    }
  }

  return (
    <section
      className="teacher-insight-actions"
      aria-label={`Actions for ${normalized.label}`}
      data-actionable-insight="true"
      data-insight-key={normalized.key}
      data-insight-label={normalized.label}
    >
      <div className="teacher-insight-action-buttons">
        <button
          className="lp-button lp-button-secondary"
          type="button"
          disabled={!practiceTargets.length}
          onClick={() => openAction("assign_practice")}
        >
          Assign practice
        </button>
        <button
          className="lp-button lp-button-secondary"
          type="button"
          onClick={() => openAction("plan_small_group")}
        >
          Plan small group
        </button>
        <button
          className="lp-button lp-button-secondary"
          type="button"
          disabled={!defaultTargetIds.length}
          onClick={printResource}
        >
          Print resource
        </button>
        <button
          className="lp-button lp-button-secondary"
          type="button"
          onClick={() => openAction("record_observation")}
        >
          Record observation
        </button>
      </div>
      <p className="teacher-insight-action-status" role="status" aria-live="polite">{status}</p>

      <TeacherModal
        className="teacher-insight-action-modal"
        label={`${actionTitle(activeAction)} for ${normalized.label}`}
        onClose={closeAction}
        open={Boolean(activeAction)}
      >
        <form className="symbol-password-modal-card teacher-insight-action-dialog" onSubmit={submitAction}>
          <header>
            <div>
              <p className="panel-label">Evidence to action</p>
              <h3>{actionTitle(activeAction)}</h3>
              <p>{normalized.label} · {normalized.focus}</p>
            </div>
            <button className="text-button" type="button" disabled={busy} onClick={closeAction}>
              Close
            </button>
          </header>

          <fieldset>
            <legend>Learners</legend>
            <div className="teacher-insight-action-options">
              {rows.map(row => (
                <label key={row.id}>
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(row.id)}
                    onChange={() => toggleStudent(row.id)}
                  />
                  <span>{row.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {activeAction === "assign_practice" && (
            <fieldset>
              <legend>Exact practice targets · choose up to six</legend>
              <div className="teacher-insight-action-options">
                {practiceTargets.map(target => (
                  <label key={target.id}>
                    <input
                      type="checkbox"
                      checked={selectedTargetIds.includes(target.id)}
                      onChange={() => toggleTarget(target.id)}
                    />
                    <span>
                      {target.label} · {target.memberCount} current learner
                      {target.memberCount === 1 ? "" : "s"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {activeAction === "record_observation" && (
            <label>
              <span>Observed evidence</span>
              <textarea
                data-autofocus
                required
                maxLength={500}
                rows={4}
                placeholder="Record only what was directly seen or heard"
                value={observation}
                onChange={event => setObservation(event.target.value)}
              />
            </label>
          )}

          <div className="teacher-insight-action-form-grid">
            <label>
              <span>Owner</span>
              <input
                data-autofocus={activeAction !== "record_observation" ? "" : undefined}
                required
                maxLength={80}
                value={ownerLabel}
                onChange={event => setOwnerLabel(event.target.value)}
              />
            </label>
            <label>
              <span>{activeAction === "record_observation" ? "Follow-up date" : "Delivery date"}</span>
              <input
                required
                type="date"
                value={plannedFor}
                onChange={event => setPlannedFor(event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>
              {activeAction === "record_observation"
                ? "Next teaching response"
                : "Teaching activity"}
            </span>
            <textarea
              required
              maxLength={240}
              rows={3}
              value={activity}
              onChange={event => setActivity(event.target.value)}
            />
          </label>

          <div className="teacher-insight-action-form-actions">
            <button
              className="lp-button lp-button-primary"
              type="submit"
              disabled={
                busy
                || !selectedStudentIds.length
                || !ownerLabel.trim()
                || !activity.trim()
                || !plannedFor
                || (activeAction === "assign_practice" && !selectedTargetIds.length)
                || (activeAction === "record_observation" && !observation.trim())
              }
            >
              {busy ? "Saving action…" : `${actionTitle(activeAction)} and track response`}
            </button>
            <button
              className="lp-button lp-button-secondary"
              type="button"
              disabled={busy}
              onClick={closeAction}
            >
              Cancel
            </button>
            <span>{className || "Selected class"} · {selectedStudentIds.length} learner{selectedStudentIds.length === 1 ? "" : "s"}</span>
          </div>
        </form>
      </TeacherModal>
    </section>
  );
}
