import { useEffect, useMemo, useState } from "react";
import {
  buildInterventionTodayQueue,
  interventionStatusLabel,
  localDateKey
} from "../../utils/teacherInterventions.js";

const SELECT_FIELDS = [
  "id",
  "teacher_id",
  "class_id",
  "parent_intervention_id",
  "owner_label",
  "group_label",
  "student_ids",
  "focus",
  "activity",
  "planned_for",
  "status",
  "delivered_at",
  "outcome",
  "outcome_note",
  "recorded_at",
  "reviewed_at",
  "next_review_on",
  "follow_up_required",
  "created_at",
  "updated_at"
].join(",");

function emptyDraft(seed = null) {
  return {
    ownerLabel: seed?.ownerLabel || "Class teacher",
    groupLabel: seed?.groupLabel || (seed?.name ? `${seed.name} (individual)` : ""),
    studentIds: seed?.studentIds || (seed?.id ? [seed.id] : []),
    parentInterventionId: seed?.parentInterventionId || null,
    focus: seed?.focus || "",
    activity: "",
    plannedFor: localDateKey()
  };
}

function tomorrowDateKey() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return localDateKey(value);
}

function InterventionPlanner({
  seed,
  rows,
  className,
  busy,
  onSave,
  onCancel
}) {
  const [draft, setDraft] = useState(() => emptyDraft(seed));

  function toggleStudent(studentId) {
    setDraft(current => ({
      ...current,
      studentIds: current.studentIds.includes(studentId)
        ? current.studentIds.filter(id => id !== studentId)
        : [...current.studentIds, studentId]
    }));
  }

  return (
    <form
      className="teacher-intervention-planner"
      onSubmit={event => {
        event.preventDefault();
        void onSave(draft);
      }}
    >
      <div className="teacher-intervention-form-grid">
        <label>
          <span>Owner</span>
          <input
            required
            maxLength={80}
            value={draft.ownerLabel}
            onChange={event => setDraft(current => ({ ...current, ownerLabel: event.target.value }))}
          />
        </label>
        <label>
          <span>Delivery date</span>
          <input
            required
            type="date"
            value={draft.plannedFor}
            onChange={event => setDraft(current => ({ ...current, plannedFor: event.target.value }))}
          />
        </label>
        <label>
          <span>Group name</span>
          <input
            required
            maxLength={120}
            placeholder="e.g. Short-vowel group"
            value={draft.groupLabel}
            onChange={event => setDraft(current => ({ ...current, groupLabel: event.target.value }))}
          />
        </label>
        <label>
          <span>Evidence focus</span>
          <input
            required
            maxLength={160}
            placeholder="The skill or evidence pattern"
            value={draft.focus}
            onChange={event => setDraft(current => ({ ...current, focus: event.target.value }))}
          />
        </label>
      </div>
      <fieldset>
        <legend>Learners in this group</legend>
        <div className="teacher-intervention-learners">
          {rows.map(row => (
            <label key={row.id}>
              <input
                type="checkbox"
                checked={draft.studentIds.includes(row.id)}
                onChange={() => toggleStudent(row.id)}
              />
              <span>{row.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        <span>Teaching activity</span>
        <textarea
          required
          maxLength={240}
          rows={3}
          placeholder="Describe what will be taught and how"
          value={draft.activity}
          onChange={event => setDraft(current => ({ ...current, activity: event.target.value }))}
        />
      </label>
      <div className="teacher-intervention-form-actions">
        <button
          className="lp-button lp-button-primary"
          type="submit"
          disabled={
            busy
            || !draft.ownerLabel.trim()
            || !draft.groupLabel.trim()
            || !draft.focus.trim()
            || !draft.activity.trim()
            || !draft.plannedFor
          }
        >
          {busy ? "Saving plan..." : "Save intervention plan"}
        </button>
        <button className="lp-button lp-button-secondary" type="button" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <span>{className} · {draft.studentIds.length || "No"} selected learner{draft.studentIds.length === 1 ? "" : "s"}</span>
      </div>
    </form>
  );
}

export function InterventionLoop({
  supabase,
  teacherId,
  classId,
  className,
  rows = [],
  recommendation,
  onRecommendationConsumed
}) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [plannerSeed, setPlannerSeed] = useState(null);
  const [outcomeDrafts, setOutcomeDrafts] = useState({});
  const [reviewDates, setReviewDates] = useState({});
  const [status, setStatus] = useState("");
  const todayQueue = useMemo(
    () => buildInterventionTodayQueue(interventions),
    [interventions]
  );

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !teacherId || !classId) return;
      const { data, error } = await supabase
        .from("teacher_interventions")
        .select(SELECT_FIELDS)
        .eq("teacher_id", teacherId)
        .eq("class_id", classId)
        .order("created_at", { ascending: false });
      if (!active) return;
      setLoading(false);
      if (error) {
        console.error("Load interventions error:", error);
        setStatus("Interventions could not be loaded. Existing learner evidence is unaffected.");
        return;
      }
      setInterventions(data || []);
    }
    void load();
    return () => {
      active = false;
    };
  }, [classId, supabase, teacherId]);

  const activePlannerSeed = recommendation || plannerSeed;

  function closePlanner() {
    setPlannerSeed(null);
    if (recommendation) onRecommendationConsumed?.();
  }

  async function savePlan(draft) {
    if (!teacherId || !classId || busyId) return;
    setBusyId("new");
    setStatus("");
    const request = draft.parentInterventionId
      ? supabase.rpc("teacher_create_intervention_follow_up", {
        p_parent_intervention_id: draft.parentInterventionId,
        p_owner_label: draft.ownerLabel.trim(),
        p_group_label: draft.groupLabel.trim(),
        p_student_ids: draft.studentIds,
        p_focus: draft.focus.trim(),
        p_activity: draft.activity.trim(),
        p_planned_for: draft.plannedFor
      }).single()
      : supabase
        .from("teacher_interventions")
        .insert({
          teacher_id: teacherId,
          class_id: classId,
          owner_label: draft.ownerLabel.trim(),
          group_label: draft.groupLabel.trim(),
          student_ids: draft.studentIds,
          focus: draft.focus.trim(),
          activity: draft.activity.trim(),
          planned_for: draft.plannedFor,
          status: "planned"
        })
        .select(SELECT_FIELDS)
        .single();
    const { data, error } = await request;
    setBusyId("");
    if (error || !data) {
      console.error("Save intervention plan error:", error);
      setStatus("The intervention plan was not saved. Review the fields and try again.");
      return;
    }
    setInterventions(current => [
      data,
      ...current.map(row => row.id === draft.parentInterventionId
        ? { ...row, follow_up_required: false }
        : row)
    ]);
    closePlanner();
    setStatus(`Intervention planned for ${data.group_label}.`);
  }

  async function updateIntervention(intervention, changes, successMessage) {
    if (!intervention?.id || busyId) return false;
    setBusyId(intervention.id);
    setStatus("");
    const { data, error } = await supabase
      .from("teacher_interventions")
      .update(changes)
      .eq("id", intervention.id)
      .eq("teacher_id", teacherId)
      .select(SELECT_FIELDS)
      .single();
    setBusyId("");
    if (error || !data) {
      console.error("Update intervention error:", error);
      setStatus("That intervention update was not saved. Its previous state is unchanged.");
      return false;
    }
    setInterventions(current => current.map(row => row.id === data.id ? data : row));
    setStatus(successMessage);
    return true;
  }

  async function markDelivered(intervention) {
    await updateIntervention(intervention, {
      status: "delivered",
      delivered_at: new Date().toISOString()
    }, `Delivery recorded for ${intervention.group_label}. Add the observed outcome next.`);
  }

  async function recordOutcome(intervention) {
    const draftOutcome = outcomeDrafts[intervention.id] || {};
    if (!draftOutcome.outcome || !String(draftOutcome.note || "").trim()) return;
    const saved = await updateIntervention(intervention, {
      status: "recorded",
      outcome: draftOutcome.outcome,
      outcome_note: String(draftOutcome.note).trim(),
      recorded_at: new Date().toISOString()
    }, `Outcome recorded for ${intervention.group_label}. Review the response next.`);
    if (saved) {
      setOutcomeDrafts(current => {
        const next = { ...current };
        delete next[intervention.id];
        return next;
      });
    }
  }

  async function reviewIntervention(intervention) {
    const nextReviewOn = reviewDates[intervention.id] || tomorrowDateKey();
    const followUpRequired = ["partial", "ineffective"].includes(intervention.outcome);
    const saved = await updateIntervention(intervention, {
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      next_review_on: nextReviewOn,
      follow_up_required: followUpRequired
    }, followUpRequired
      ? `Review complete for ${intervention.group_label}. Follow-up is now on Today.`
      : `Review complete for ${intervention.group_label}. The intervention was effective.`);
    if (saved) {
      setReviewDates(current => {
        const next = { ...current };
        delete next[intervention.id];
        return next;
      });
    }
  }

  function planFollowUp(intervention) {
    setPlannerSeed({
      key: `follow-up-${intervention.id}`,
      groupLabel: `${intervention.group_label} follow-up`,
      focus: intervention.focus,
      ownerLabel: intervention.owner_label,
      studentIds: intervention.student_ids || [],
      parentInterventionId: intervention.id
    });
  }

  return (
    <section
      className="teacher-intervention-loop"
      aria-label="Intervention lifecycle"
      data-intervention-count={interventions.length}
      data-teacher-priority="today-actions"
    >
      <header className="teacher-intervention-head">
        <div>
          <p className="panel-label">Plan · deliver · record · review</p>
          <h3>Interventions</h3>
          <p>Turn evidence into owned, dated teaching actions and bring weak responses back to Today.</p>
        </div>
        <button
          className="lp-button lp-button-primary"
          type="button"
          aria-expanded={Boolean(activePlannerSeed)}
          onClick={() => {
            if (activePlannerSeed) closePlanner();
            else setPlannerSeed({ key: `manual-${Date.now()}` });
          }}
        >
          {activePlannerSeed ? "Close planner" : "Plan intervention"}
        </button>
      </header>

      <p className="teacher-intervention-status" role="status" aria-live="polite">{status}</p>

      {todayQueue.length > 0 && (
        <section className="teacher-intervention-today" aria-label="Interventions resurfaced on Today">
          <div>
            <span>Back on Today</span>
            <strong>{todayQueue.length}</strong>
          </div>
          <ul>
            {todayQueue.map(intervention => (
              <li key={intervention.id}>
                <div>
                  <strong>{intervention.queueLabel}</strong>
                  <span>{intervention.group_label} · {intervention.focus}</span>
                  <small>{intervention.activity}</small>
                </div>
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => planFollowUp(intervention)}
                >
                  Plan follow-up
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activePlannerSeed && (
        <InterventionPlanner
          key={activePlannerSeed.key || activePlannerSeed.id || "manual"}
          seed={activePlannerSeed}
          rows={rows}
          className={className}
          busy={busyId === "new"}
          onSave={savePlan}
          onCancel={closePlanner}
        />
      )}

      {loading ? (
        <p className="muted-text">Loading interventions…</p>
      ) : interventions.length === 0 ? (
        <div className="report-empty-state teacher-intervention-empty">
          <strong>No interventions planned for this class.</strong>
          <p>Start from an evidence suggestion or plan a teaching action directly.</p>
        </div>
      ) : (
        <div className="teacher-intervention-list">
          {interventions.map(intervention => {
            const outcomeDraft = outcomeDrafts[intervention.id] || {};
            return (
              <article
                className={`teacher-intervention-card is-${intervention.status}`}
                aria-label={`Intervention for ${intervention.group_label}`}
                key={intervention.id}
              >
                <header>
                  <div>
                    <span>{interventionStatusLabel(intervention)}</span>
                    <h4>{intervention.group_label}</h4>
                    <p>{intervention.focus}</p>
                  </div>
                  <time dateTime={intervention.planned_for}>{intervention.planned_for}</time>
                </header>
                <dl>
                  <div><dt>Owner</dt><dd>{intervention.owner_label}</dd></div>
                  <div><dt>Group</dt><dd>{(intervention.student_ids || []).length} learner{intervention.student_ids?.length === 1 ? "" : "s"}</dd></div>
                  <div><dt>Activity</dt><dd>{intervention.activity}</dd></div>
                  {intervention.outcome && <div><dt>Outcome</dt><dd>{intervention.outcome}</dd></div>}
                  {intervention.outcome_note && <div><dt>Observation</dt><dd>{intervention.outcome_note}</dd></div>}
                  {intervention.next_review_on && <div><dt>Next review</dt><dd>{intervention.next_review_on}</dd></div>}
                </dl>

                {intervention.status === "planned" && (
                  <button
                    className="lp-button lp-button-primary"
                    type="button"
                    disabled={busyId === intervention.id}
                    onClick={() => markDelivered(intervention)}
                  >
                    {busyId === intervention.id ? "Saving delivery..." : "Mark delivered"}
                  </button>
                )}

                {intervention.status === "delivered" && (
                  <div className="teacher-intervention-next-step">
                    <label>
                      <span>Observed outcome</span>
                      <select
                        value={outcomeDraft.outcome || ""}
                        onChange={event => setOutcomeDrafts(current => ({
                          ...current,
                          [intervention.id]: { ...outcomeDraft, outcome: event.target.value }
                        }))}
                      >
                        <option value="">Choose outcome</option>
                        <option value="effective">Effective</option>
                        <option value="partial">Partial response</option>
                        <option value="ineffective">Ineffective</option>
                      </select>
                    </label>
                    <label>
                      <span>Observation</span>
                      <textarea
                        rows={2}
                        maxLength={500}
                        value={outcomeDraft.note || ""}
                        onChange={event => setOutcomeDrafts(current => ({
                          ...current,
                          [intervention.id]: { ...outcomeDraft, note: event.target.value }
                        }))}
                      />
                    </label>
                    <button
                      className="lp-button lp-button-primary"
                      type="button"
                      disabled={
                        busyId === intervention.id
                        || !outcomeDraft.outcome
                        || !String(outcomeDraft.note || "").trim()
                      }
                      onClick={() => recordOutcome(intervention)}
                    >
                      {busyId === intervention.id ? "Saving outcome..." : "Record outcome"}
                    </button>
                  </div>
                )}

                {intervention.status === "recorded" && (
                  <div className="teacher-intervention-next-step">
                    <label>
                      <span>Next review date</span>
                      <input
                        type="date"
                        value={reviewDates[intervention.id] || tomorrowDateKey()}
                        onChange={event => setReviewDates(current => ({
                          ...current,
                          [intervention.id]: event.target.value
                        }))}
                      />
                    </label>
                    <p>
                      {intervention.outcome === "effective"
                        ? "Review and close this cycle."
                        : "Reviewing a partial or ineffective response will place a follow-up back on Today."}
                    </p>
                    <button
                      className="lp-button lp-button-primary"
                      type="button"
                      disabled={busyId === intervention.id}
                      onClick={() => reviewIntervention(intervention)}
                    >
                      {busyId === intervention.id ? "Saving review..." : "Review intervention"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
