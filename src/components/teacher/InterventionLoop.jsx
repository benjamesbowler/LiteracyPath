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
  "cancelled_at",
  "cancel_reason",
  "cancelled_from_status",
  "created_at",
  "updated_at"
].join(",");

const EVENT_SELECT_FIELDS = [
  "id",
  "intervention_id",
  "teacher_id",
  "class_id",
  "event_type",
  "from_status",
  "to_status",
  "actor_id",
  "actor_kind",
  "occurred_at",
  "detail"
].join(",");

const EVENT_LABELS = {
  baseline_imported: "Earlier support record added to history",
  plan_created: "Support plan created",
  plan_updated: "Support plan updated",
  plan_deleted: "Untaught draft deleted",
  delivered: "Support marked as taught",
  outcome_recorded: "Teaching observation saved",
  reviewed: "Support reviewed",
  follow_up_planned: "Follow-up plan created",
  cancelled: "Taught support cancelled",
  record_updated: "Record updated by a verified data process",
  record_removed: "Record removed by a verified data process"
};

function supportEventLabel(event) {
  return EVENT_LABELS[event?.event_type] || "Support record updated";
}

function supportEventActor(event) {
  if (event?.actor_kind === "teacher") return "Saved by you";
  if (event?.actor_kind === "administrator") return "Saved by an administrator";
  return "Saved by the school system";
}

function supportEventDetail(event) {
  const detail = event?.detail && typeof event.detail === "object" ? event.detail : {};
  if (["baseline_imported", "plan_created", "plan_deleted"].includes(event?.event_type)) {
    const parts = [];
    if (detail.plannedFor) parts.push(`For ${friendlyPlanDate(detail.plannedFor)}`);
    if (Number.isInteger(detail.studentCount)) {
      parts.push(`${detail.studentCount} ${detail.studentCount === 1 ? "student" : "students"}`);
    }
    return parts.length > 0 ? `${parts.join(" · ")}.` : "";
  }
  if (event?.event_type === "plan_updated") {
    const fields = Array.isArray(detail.changedFields) ? detail.changedFields : [];
    return fields.length > 0
      ? `Changed: ${fields.join(", ")}.`
      : "The planned support was corrected.";
  }
  if (event?.event_type === "outcome_recorded") {
    return friendlySupportResult(detail.outcome);
  }
  if (event?.event_type === "reviewed" && detail.nextReviewOn) {
    return `Next review: ${friendlyPlanDate(detail.nextReviewOn)}.`;
  }
  if (event?.event_type === "cancelled") {
    return "The reason is kept with the cancelled support record.";
  }
  return "";
}

async function loadSupportEventHistory(supabase, teacherId, classId) {
  const pageSize = 500;
  const allEvents = [];
  let offset = 0;
  let previousPageFirstId = null;

  while (true) {
    const result = await supabase
      .table("teacher_intervention_events")
      .select(EVENT_SELECT_FIELDS)
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (result.error) return result;
    const page = result.data || [];
    if (page.length > 0 && page[0].id === previousPageFirstId) {
      return {
        data: null,
        error: new Error("Support-history paging did not advance.")
      };
    }
    if (page.length > 0) previousPageFirstId = page[0].id;
    allEvents.push(...page);
    if (page.length < pageSize) return { data: allEvents, error: null };
    offset += pageSize;
  }
}

function emptyDraft(seed = null) {
  return {
    interventionId: seed?.interventionId || null,
    ownerLabel: seed?.ownerLabel || "Class teacher",
    groupLabel: seed?.groupLabel || (seed?.name ? `${seed.name} (individual)` : ""),
    studentIds: seed?.studentIds || (seed?.id ? [seed.id] : []),
    parentInterventionId: seed?.parentInterventionId || null,
    focus: seed?.focus || "",
    activity: seed?.activity || "",
    plannedFor: seed?.plannedFor || localDateKey()
  };
}

function tomorrowDateKey() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return localDateKey(value);
}

function friendlyPlanDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value || "Date not set";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function friendlySupportResult(value) {
  return {
    effective: "Worked as planned",
    partial: "Helped a little",
    ineffective: "Did not help yet"
  }[value] || value;
}

function InterventionPlanner({
  seed,
  rows,
  className,
  busy,
  onSave,
  onCancel
}) {
  const [draft, setDraft] = useState(() => {
    const initial = emptyDraft(seed);
    const availableStudentIds = new Set(rows.map(row => String(row.id)));
    return {
      ...initial,
      studentIds: initial.studentIds.filter(id => availableStudentIds.has(String(id)))
    };
  });
  const editing = Boolean(draft.interventionId);

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
          <span>Who will teach it?</span>
          <input
            required
            maxLength={80}
            value={draft.ownerLabel}
            onChange={event => setDraft(current => ({ ...current, ownerLabel: event.target.value }))}
          />
        </label>
        <label>
          <span>Teaching date</span>
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
          <span>Skill to work on</span>
          <input
            required
            maxLength={160}
            placeholder="The skill or results pattern"
            value={draft.focus}
            onChange={event => setDraft(current => ({ ...current, focus: event.target.value }))}
          />
        </label>
      </div>
      <fieldset>
        <legend>Students in this group</legend>
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
        {draft.studentIds.length === 0 && (
          <p className="teacher-intervention-field-error" role="alert">
            Choose at least one student before saving this support plan.
          </p>
        )}
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
            || draft.studentIds.length === 0
          }
        >
          {busy
            ? "Saving plan..."
            : editing
              ? "Save plan changes"
              : "Save support plan"}
        </button>
        <button className="lp-button lp-button-secondary" type="button" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <span>{className} · {draft.studentIds.length || "No"} selected {draft.studentIds.length === 1 ? "student" : "students"}</span>
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
  onRecommendationConsumed,
  onTodayQueueChange,
  headingRef
}) {
  const [interventions, setInterventions] = useState([]);
  const [events, setEvents] = useState([]);
  // Starts true: nothing has been read yet, and "you have planned nothing" is a
  // conclusion this panel is not entitled to until the request comes back.
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadFailed, setHistoryLoadFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [busyId, setBusyId] = useState("");
  const [plannerSeed, setPlannerSeed] = useState(null);
  const [outcomeDrafts, setOutcomeDrafts] = useState({});
  const [reviewDates, setReviewDates] = useState({});
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [status, setStatus] = useState("");
  const todayQueue = useMemo(
    () => buildInterventionTodayQueue(interventions),
    [interventions]
  );
  const activeInterventions = useMemo(
    () => interventions.filter(intervention => intervention.status !== "cancelled"),
    [interventions]
  );
  const cancelledInterventions = useMemo(
    () => interventions.filter(intervention => intervention.status === "cancelled"),
    [interventions]
  );

  useEffect(() => {
    onTodayQueueChange?.({
      count: loading || loadFailed ? 0 : todayQueue.length,
      loading,
      unavailable: loadFailed
    });
  }, [loadFailed, loading, onTodayQueueChange, todayQueue.length]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !teacherId || !classId) {
        setLoading(false);
        setLoadFailed(false);
        setHistoryLoading(false);
        setHistoryLoadFailed(false);
        setEvents([]);
        return;
      }
      setLoading(true);
      setLoadFailed(false);
      setHistoryLoading(true);
      setHistoryLoadFailed(false);
      try {
        const [planResult, historyResult] = await Promise.all([
          supabase
            .table("teacher_interventions")
            .select(SELECT_FIELDS)
            .eq("teacher_id", teacherId)
            .eq("class_id", classId)
            .order("created_at", { ascending: false }),
          loadSupportEventHistory(supabase, teacherId, classId)
        ]);
        if (!active) return;
        if (planResult.error) {
          // A failed read is not an empty plan list. It gets its own panel below
          // instead of a note above the "nothing planned" card.
          console.error("Load interventions error:", planResult.error);
          setLoadFailed(true);
          setInterventions([]);
        } else {
          setInterventions(planResult.data || []);
        }
        if (historyResult.error) {
          console.error("Load intervention history error:", historyResult.error);
          setHistoryLoadFailed(true);
          setEvents([]);
        } else {
          setEvents(historyResult.data || []);
        }
      } catch (error) {
        if (!active) return;
        console.error("Load interventions error:", error);
        setLoadFailed(true);
        setHistoryLoadFailed(true);
        setInterventions([]);
        setEvents([]);
      } finally {
        if (active) {
          setLoading(false);
          setHistoryLoading(false);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [classId, reloadToken, supabase, teacherId]);

  const activePlannerSeed = recommendation || plannerSeed;

  function closePlanner() {
    setPlannerSeed(null);
    if (recommendation) onRecommendationConsumed?.();
  }

  async function savePlan(draft) {
    if (!teacherId || !classId || busyId) return;
    const availableStudentIds = new Set(rows.map(row => String(row.id)));
    const validStudentIds = draft.studentIds.filter(id => availableStudentIds.has(String(id)));
    if (validStudentIds.length === 0 || validStudentIds.length !== draft.studentIds.length) {
      setStatus("Choose at least one student from the current class before saving this support plan.");
      return false;
    }
    const operationId = draft.interventionId || "new";
    setBusyId(operationId);
    setStatus("");
    try {
      const commonRpcFields = {
        p_owner_label: draft.ownerLabel.trim(),
        p_group_label: draft.groupLabel.trim(),
        p_student_ids: validStudentIds,
        p_focus: draft.focus.trim(),
        p_activity: draft.activity.trim(),
        p_planned_for: draft.plannedFor
      };
      const request = draft.interventionId
        ? supabase.call("teacher_update_planned_intervention", {
          p_intervention_id: draft.interventionId,
          ...commonRpcFields
        }).single()
          : draft.parentInterventionId
          ? supabase.call("teacher_create_intervention_follow_up", {
            p_parent_intervention_id: draft.parentInterventionId,
            ...commonRpcFields
          }).single()
          : supabase.call("teacher_create_intervention_plan", {
            p_class_id: classId,
            ...commonRpcFields
          }).single();
      const { data, error } = await request;
      if (error || !data) {
        console.error("Save intervention plan error:", error);
        setStatus("The support plan was not saved. Review the fields and try again.");
        return false;
      }
      setInterventions(current => draft.interventionId
        ? current.map(row => row.id === data.id ? data : row)
        : [
            data,
            ...current.map(row => row.id === draft.parentInterventionId
              ? { ...row, follow_up_required: false }
              : row)
          ]);
      closePlanner();
      setStatus(draft.interventionId
        ? `Support plan updated for ${data.group_label}.`
        : `Support planned for ${data.group_label}.`);
      setReloadToken(value => value + 1);
      return true;
    } catch (error) {
      console.error("Save intervention plan error:", error);
      setStatus("The support plan was not saved. Review the fields and try again.");
      return false;
    } finally {
      setBusyId("");
    }
  }

  async function advanceIntervention(intervention, rpcName, args, successMessage) {
    if (!intervention?.id || busyId) return false;
    setBusyId(intervention.id);
    setStatus("");
    try {
      const { data, error } = await supabase
        .call(rpcName, {
          p_intervention_id: intervention.id,
          ...args
        })
        .single();
      if (error || !data) {
        console.error("Update intervention error:", error);
        setStatus("That support-plan update was not saved. Its previous state is unchanged.");
        return false;
      }
      setInterventions(current => current.map(row => row.id === data.id ? data : row));
      setStatus(successMessage);
      setReloadToken(value => value + 1);
      return true;
    } catch (error) {
      console.error("Update intervention error:", error);
      setStatus("That support-plan update was not saved. Its previous state is unchanged.");
      return false;
    } finally {
      setBusyId("");
    }
  }

  async function markDelivered(intervention) {
    await advanceIntervention(
      intervention,
      "teacher_mark_intervention_delivered",
      {},
      `${intervention.group_label} marked as taught. Add what happened next.`
    );
  }

  async function recordOutcome(intervention) {
    const draftOutcome = outcomeDrafts[intervention.id] || {};
    if (!draftOutcome.outcome || !String(draftOutcome.note || "").trim()) return;
    const saved = await advanceIntervention(
      intervention,
      "teacher_record_intervention_outcome",
      {
        p_outcome: draftOutcome.outcome,
        p_outcome_note: String(draftOutcome.note).trim()
      },
      `Observation saved for ${intervention.group_label}. Review the support next.`
    );
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
    const saved = await advanceIntervention(
      intervention,
      "teacher_review_intervention",
      { p_next_review_on: nextReviewOn },
      followUpRequired
        ? `Review complete for ${intervention.group_label}. Follow-up is now on Today.`
        : `Review complete for ${intervention.group_label}. The support worked as planned.`
    );
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

  function editPlan(intervention) {
    setPlannerSeed({
      key: `edit-${intervention.id}`,
      interventionId: intervention.id,
      ownerLabel: intervention.owner_label,
      groupLabel: intervention.group_label,
      studentIds: intervention.student_ids || [],
      focus: intervention.focus,
      activity: intervention.activity,
      plannedFor: intervention.planned_for
    });
    setCancelTarget(null);
    setDeleteTarget(null);
    setCancelReason("");
  }

  function focusIntervention(intervention) {
    const card = document.getElementById(`teacher-intervention-${intervention.id}`);
    card?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    card?.focus?.();
  }

  async function cancelPlan() {
    if (!cancelTarget?.id || busyId) return false;
    const reason = cancelReason.trim();
    if (!reason) {
      setStatus("Add a short reason before cancelling this support plan.");
      return false;
    }
    setBusyId(cancelTarget.id);
    setStatus("");
    try {
      const { data, error } = await supabase
        .call("teacher_cancel_intervention", {
          p_intervention_id: cancelTarget.id,
          p_reason: reason
        })
        .single();
      if (error || !data) {
        console.error("Cancel intervention error:", error);
        setStatus("The taught support was not cancelled. Its previous state is unchanged.");
        return false;
      }
      setInterventions(current => current.map(row => row.id === data.id ? data : row));
      setCancelTarget(null);
      setCancelReason("");
      if (plannerSeed?.interventionId === data.id) setPlannerSeed(null);
      setStatus(`${data.group_label} was cancelled. Its teaching record and reason are kept.`);
      setReloadToken(value => value + 1);
      return true;
    } catch (error) {
      console.error("Cancel intervention error:", error);
      setStatus("The taught support was not cancelled. Its previous state is unchanged.");
      return false;
    } finally {
      setBusyId("");
    }
  }

  async function deleteDraft() {
    if (!deleteTarget?.id || busyId) return false;
    setBusyId(deleteTarget.id);
    setStatus("");
    try {
      const { data, error } = await supabase
        .call("teacher_delete_planned_intervention", {
          p_intervention_id: deleteTarget.id
        })
        .single();
      if (error || !data) {
        console.error("Delete intervention draft error:", error);
        setStatus("The draft was not deleted. Its previous state is unchanged.");
        return false;
      }
      setInterventions(current => current.filter(row => row.id !== data.id));
      if (plannerSeed?.interventionId === data.id) setPlannerSeed(null);
      setDeleteTarget(null);
      setStatus(`${data.group_label} draft was deleted.`);
      setReloadToken(value => value + 1);
      return true;
    } catch (error) {
      console.error("Delete intervention draft error:", error);
      setStatus("The draft was not deleted. Its previous state is unchanged.");
      return false;
    } finally {
      setBusyId("");
    }
  }

  return (
    <section
      className="teacher-intervention-loop"
      aria-label="Support plans"
      data-intervention-count={interventions.length}
      data-teacher-priority="today-actions"
    >
      <header className="teacher-intervention-head">
        <div>
          <p className="panel-label">Plan · teach · note · review</p>
          <h3 ref={headingRef} tabIndex="-1">Support plans</h3>
          <p>Turn results into dated teaching actions and bring planned follow-ups back to Today.</p>
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
          {activePlannerSeed ? "Close planner" : "Plan support"}
        </button>
      </header>

      <p className="teacher-intervention-status" role="status" aria-live="polite">{status}</p>

      {todayQueue.length > 0 && (
        <section className="teacher-intervention-today" aria-label="Support follow-ups on Today">
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
                  onClick={() => {
                    if (intervention.queueReason === "follow-up") {
                      planFollowUp(intervention);
                    } else if (intervention.status === "planned") {
                      void markDelivered(intervention);
                    } else {
                      focusIntervention(intervention);
                    }
                  }}
                >
                  {intervention.queueReason === "follow-up"
                    ? "Plan follow-up"
                    : intervention.status === "planned"
                      ? "Mark as taught"
                      : intervention.status === "delivered"
                        ? "Add what happened"
                        : "Review support"}
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
          busy={busyId === (activePlannerSeed.interventionId || "new")}
          onSave={savePlan}
          onCancel={closePlanner}
        />
      )}

      {loading ? (
        <p className="muted-text" role="status" aria-live="polite" aria-busy="true">
          Loading your teaching plans…
        </p>
      ) : loadFailed ? (
        <div className="report-empty-state teacher-intervention-empty" role="alert">
          <strong>We couldn&apos;t load your teaching plans.</strong>
          <p>
            Nothing is lost. Any plan you have saved is still there, and students&apos;
            results are unchanged. Make sure you&apos;re online and try again.
          </p>
          <button
            className="lp-button lp-button-primary"
            type="button"
            onClick={() => setReloadToken(value => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : activeInterventions.length === 0 ? (
        <div className="report-empty-state teacher-intervention-empty">
          <strong>No active support planned for this class.</strong>
          <p>Start from a results suggestion or plan a teaching action directly.</p>
        </div>
      ) : (
        <div className="teacher-intervention-list">
          {activeInterventions.map(intervention => {
            const outcomeDraft = outcomeDrafts[intervention.id] || {};
            return (
              <article
                className={`teacher-intervention-card is-${intervention.status}`}
                aria-label={`Support plan for ${intervention.group_label}`}
                id={`teacher-intervention-${intervention.id}`}
                key={intervention.id}
                tabIndex="-1"
              >
                <header>
                  <div>
                    <span>{interventionStatusLabel(intervention)}</span>
                    <h4>{intervention.group_label}</h4>
                    <p>{intervention.focus}</p>
                  </div>
                  <time dateTime={intervention.planned_for}>
                    {friendlyPlanDate(intervention.planned_for)}
                  </time>
                </header>
                <dl>
                  <div><dt>Teacher</dt><dd>{intervention.owner_label}</dd></div>
                  <div><dt>Group</dt><dd>{(intervention.student_ids || []).length} {intervention.student_ids?.length === 1 ? "student" : "students"}</dd></div>
                  <div><dt>Activity</dt><dd>{intervention.activity}</dd></div>
                  {intervention.outcome && (
                    <div><dt>Result</dt><dd>{friendlySupportResult(intervention.outcome)}</dd></div>
                  )}
                  {intervention.outcome_note && <div><dt>What you noticed</dt><dd>{intervention.outcome_note}</dd></div>}
                  {intervention.next_review_on && (
                    <div><dt>Next review</dt><dd>{friendlyPlanDate(intervention.next_review_on)}</dd></div>
                  )}
                </dl>

                {intervention.status === "planned" && (
                  <>
                    <div className="teacher-intervention-card-actions">
                      <button
                        className="lp-button lp-button-primary"
                        type="button"
                        disabled={busyId === intervention.id}
                        onClick={() => markDelivered(intervention)}
                      >
                        {busyId === intervention.id ? "Saving…" : "Mark as taught"}
                      </button>
                      <button
                        className="lp-button lp-button-secondary"
                        type="button"
                        disabled={busyId === intervention.id}
                        onClick={() => editPlan(intervention)}
                      >
                        Edit or reschedule
                      </button>
                      <button
                        className="lp-button lp-button-secondary"
                        type="button"
                        disabled={busyId === intervention.id}
                        onClick={() => {
                          setDeleteTarget(intervention);
                          setCancelTarget(null);
                        }}
                      >
                        Delete draft
                      </button>
                    </div>
                    {deleteTarget?.id === intervention.id && (
                      <div
                        className="teacher-intervention-cancel-confirmation"
                        role="group"
                        aria-label={`Delete support draft for ${intervention.group_label}`}
                      >
                        <strong>Delete this draft?</strong>
                        <p>
                          It has not been taught, so it can be removed. This will not change
                          student results.
                        </p>
                        <div className="teacher-intervention-form-actions">
                          <button
                            className="lp-button lp-button-secondary"
                            disabled={busyId === intervention.id}
                            onClick={() => {
                              setDeleteTarget(null);
                            }}
                            type="button"
                          >
                            Keep draft
                          </button>
                          <button
                            className="lp-button lp-button-danger"
                            disabled={busyId === intervention.id}
                            onClick={() => void deleteDraft()}
                            type="button"
                          >
                            {busyId === intervention.id ? "Deleting…" : "Delete draft"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {intervention.status === "delivered" && (
                  <div className="teacher-intervention-next-step">
                    <label>
                      <span>What happened?</span>
                      <select
                        value={outcomeDraft.outcome || ""}
                        onChange={event => setOutcomeDrafts(current => ({
                          ...current,
                          [intervention.id]: { ...outcomeDraft, outcome: event.target.value }
                        }))}
                      >
                        <option value="">Choose a result</option>
                        <option value="effective">Worked as planned</option>
                        <option value="partial">Helped a little</option>
                        <option value="ineffective">Did not help yet</option>
                      </select>
                    </label>
                    <label>
                      <span>What did you notice?</span>
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
                      {busyId === intervention.id ? "Saving…" : "Save observation"}
                    </button>
                    <button
                      className="lp-button lp-button-secondary"
                      type="button"
                      disabled={busyId === intervention.id}
                      onClick={() => {
                        setCancelTarget(intervention);
                        setDeleteTarget(null);
                        setCancelReason("");
                      }}
                    >
                      Cancel taught support
                    </button>
                    {cancelTarget?.id === intervention.id && (
                      <div
                        className="teacher-intervention-cancel-confirmation"
                        role="group"
                        aria-label={`Cancel taught support for ${intervention.group_label}`}
                      >
                        <strong>Cancel this taught support?</strong>
                        <p>
                          The teaching record will stay in the history. Add the reason this
                          cycle cannot continue.
                        </p>
                        <label>
                          <span>Reason for cancelling</span>
                          <textarea
                            autoFocus
                            maxLength={500}
                            rows={2}
                            value={cancelReason}
                            onChange={event => setCancelReason(event.target.value)}
                          />
                        </label>
                        <div className="teacher-intervention-form-actions">
                          <button
                            className="lp-button lp-button-secondary"
                            disabled={busyId === intervention.id}
                            onClick={() => {
                              setCancelTarget(null);
                              setCancelReason("");
                            }}
                            type="button"
                          >
                            Keep support
                          </button>
                          <button
                            className="lp-button lp-button-danger"
                            disabled={busyId === intervention.id || !cancelReason.trim()}
                            onClick={() => void cancelPlan()}
                            type="button"
                          >
                            {busyId === intervention.id ? "Cancelling…" : "Cancel taught support"}
                          </button>
                        </div>
                      </div>
                    )}
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
                      {busyId === intervention.id ? "Saving review..." : "Review support"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {!loading && !loadFailed && cancelledInterventions.length > 0 && (
        <details className="teacher-intervention-cancelled-history">
          <summary>Cancelled plans ({cancelledInterventions.length})</summary>
          <p className="muted-text">
            Cancelled plans are removed from active work and Today. Their reason stays here for the record.
          </p>
          <div className="teacher-intervention-list">
            {cancelledInterventions.map(intervention => (
              <article
                className="teacher-intervention-card is-cancelled"
                aria-label={`Cancelled support plan for ${intervention.group_label}`}
                key={intervention.id}
              >
                <header>
                  <div>
                    <span>{interventionStatusLabel(intervention)}</span>
                    <h4>{intervention.group_label}</h4>
                    <p>{intervention.focus}</p>
                  </div>
                  <time dateTime={intervention.cancelled_at || intervention.planned_for}>
                    {intervention.cancelled_at
                      ? new Date(intervention.cancelled_at).toLocaleDateString()
                      : friendlyPlanDate(intervention.planned_for)}
                  </time>
                </header>
                <dl>
                  <div><dt>Planned activity</dt><dd>{intervention.activity}</dd></div>
                  <div><dt>Students</dt><dd>{(intervention.student_ids || []).length}</dd></div>
                  <div><dt>Why it was cancelled</dt><dd>{intervention.cancel_reason}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </details>
      )}

      <details className="teacher-intervention-history">
        <summary>
          Support history{!historyLoading && !historyLoadFailed ? ` (${events.length})` : ""}
        </summary>
        <p className="muted-text">
          A plain, time-stamped record of planning, teaching, observations, reviews, and
          cancellations. Times are saved by the school system.
        </p>
        {historyLoading ? (
          <p role="status" aria-live="polite" aria-busy="true">
            Loading support history…
          </p>
        ) : historyLoadFailed ? (
          <div className="report-empty-state" role="alert">
            <strong>We couldn&apos;t load the support history.</strong>
            <p>The support records are unchanged. Try loading this section again.</p>
            <button
              className="lp-button lp-button-primary"
              type="button"
              onClick={() => setReloadToken(value => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <p className="muted-text">No support changes have been recorded for this class yet.</p>
        ) : (
          <ol className="teacher-intervention-history-list">
            {events.map(event => {
              const current = interventions.find(item => item.id === event.intervention_id);
              const detail = supportEventDetail(event);
              return (
                <li key={event.id}>
                  <div>
                    <strong>{supportEventLabel(event)}</strong>
                    <span>{current?.group_label || "Deleted or earlier support record"}</span>
                    {detail && <small>{detail}</small>}
                  </div>
                  <div className="teacher-intervention-history-meta">
                    <time dateTime={event.occurred_at}>
                      {new Date(event.occurred_at).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </time>
                    <small>{supportEventActor(event)}</small>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </details>
    </section>
  );
}
