import { useEffect, useMemo, useState } from "react";
import {
  assignTeacherInstructionalGroupFollowUp,
  loadTeacherInstructionalGroups,
  reviewTeacherInstructionalGroup,
  saveTeacherInstructionalGroup
} from "../../data/teacherInstructionalGroups.js";
import {
  buildInstructionalGroupComparison,
  buildInstructionalGroupMovement,
  buildInstructionalGroupSnapshot,
  criterionFromSuggestion
} from "../../utils/teacherInstructionalGroups.js";
import { localDateKey } from "../../utils/teacherInterventions.js";

function formatReviewDate(value) {
  if (!value) return "No review date";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "No review date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function ComparisonMetric({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function MovementList({ label, learners, emptyLabel }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {learners.length
          ? learners.map(learner => learner.name).join(", ")
          : emptyLabel}
      </dd>
    </div>
  );
}

export function TeacherInstructionalGroups({
  supabase,
  teacherId,
  classId,
  className,
  suggestions = [],
  rows = [],
  onChooseLearner,
  renderEvidence
}) {
  const requestKey = [teacherId, classId].filter(Boolean).join(":");
  const [loadResult, setLoadResult] = useState({
    key: "",
    state: "idle",
    groups: []
  });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [draftSuggestion, setDraftSuggestion] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [compareIds, setCompareIds] = useState([]);
  const [assignmentGroupId, setAssignmentGroupId] = useState("");
  const [assignmentDraft, setAssignmentDraft] = useState({
    ownerLabel: "Class teacher",
    activity: "",
    plannedFor: localDateKey()
  });
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    if (!supabase || !teacherId || !classId) {
      return () => {
        active = false;
      };
    }
    void loadTeacherInstructionalGroups({
      supabase,
      teacherId,
      classId
    }).then(groups => {
      if (!active) return;
      setLoadResult({
        key: requestKey,
        state: "ready",
        groups
      });
    }).catch(error => {
      if (!active) return;
      console.error("Load instructional groups error:", error);
      setLoadResult({
        key: requestKey,
        state: "error",
        groups: []
      });
    });
    return () => {
      active = false;
    };
  }, [classId, refreshVersion, requestKey, supabase, teacherId]);

  const state = !requestKey || !supabase
    ? "idle"
    : loadResult.key === requestKey
      ? loadResult.state
      : "loading";
  const groups = useMemo(
    () => loadResult.key === requestKey ? loadResult.groups : [],
    [loadResult.groups, loadResult.key, requestKey]
  );
  const groupModels = useMemo(
    () => groups.map(group => ({
      group,
      movement: buildInstructionalGroupMovement(group, suggestions, rows)
    })),
    [groups, rows, suggestions]
  );
  const comparison = useMemo(
    () => buildInstructionalGroupComparison(
      compareIds.map(id => groups.find(group => group.id === id)).filter(Boolean)
    ),
    [compareIds, groups]
  );
  const assignmentGroup = groups.find(group => group.id === assignmentGroupId) || null;

  function refreshGroups() {
    setRefreshVersion(value => value + 1);
  }

  function openSave(suggestion) {
    setDraftSuggestion(suggestion);
    setDraftName(suggestion.label);
    setStatus("");
  }

  async function saveGroup(event) {
    event.preventDefault();
    const criterion = criterionFromSuggestion(draftSuggestion);
    const studentIds = (draftSuggestion?.learners || []).map(learner => learner.id);
    if (!criterion || !draftName.trim() || !studentIds.length || busy) return;
    setBusy("save");
    setStatus("");
    try {
      await saveTeacherInstructionalGroup({
        supabase,
        classId,
        name: draftName.trim(),
        criteria: criterion,
        studentIds,
        evidenceSnapshot: buildInstructionalGroupSnapshot(
          rows,
          studentIds,
          new Date().toISOString()
        )
      });
      setDraftSuggestion(null);
      setDraftName("");
      setStatus(`Saved instructional group ${draftName.trim()}.`);
      refreshGroups();
    } catch (error) {
      console.error("Save instructional group error:", error);
      setStatus("The instructional group was not saved. Use a unique name and try again.");
    } finally {
      setBusy("");
    }
  }

  function toggleComparison(groupId) {
    setCompareIds(current => {
      if (current.includes(groupId)) return current.filter(id => id !== groupId);
      if (current.length >= 2) {
        setStatus("Compare two groups at a time. Remove one selection before adding another.");
        return current;
      }
      return [...current, groupId];
    });
  }

  async function recordMovement(group, movement) {
    if (!movement.criterionAvailable || !movement.currentIds.length || busy) return;
    setBusy(`review:${group.id}`);
    setStatus("");
    try {
      await reviewTeacherInstructionalGroup({
        supabase,
        groupId: group.id,
        studentIds: movement.currentIds,
        evidenceSnapshot: buildInstructionalGroupSnapshot(
          rows,
          movement.currentIds,
          new Date().toISOString()
        )
      });
      setStatus(`Movement review recorded for ${group.name}.`);
      refreshGroups();
    } catch (error) {
      console.error("Review instructional group error:", error);
      setStatus("The movement review was not saved. The previous membership remains unchanged.");
    } finally {
      setBusy("");
    }
  }

  function openAssignment(groupId) {
    setAssignmentGroupId(groupId);
    setAssignmentDraft({
      ownerLabel: "Class teacher",
      activity: "",
      plannedFor: localDateKey()
    });
    setStatus("");
  }

  async function assignFollowUp(event) {
    event.preventDefault();
    if (
      !assignmentGroup
      || !assignmentDraft.ownerLabel.trim()
      || !assignmentDraft.activity.trim()
      || !assignmentDraft.plannedFor
      || busy
    ) return;
    setBusy(`assign:${assignmentGroup.id}`);
    setStatus("");
    try {
      await assignTeacherInstructionalGroupFollowUp({
        supabase,
        groupId: assignmentGroup.id,
        ownerLabel: assignmentDraft.ownerLabel.trim(),
        activity: assignmentDraft.activity.trim(),
        plannedFor: assignmentDraft.plannedFor
      });
      setStatus(`Follow-up assigned for ${assignmentGroup.name}. It is now tracked on Today.`);
      setAssignmentGroupId("");
    } catch (error) {
      console.error("Assign instructional group follow-up error:", error);
      setStatus("The follow-up was not assigned. No intervention plan was created.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <article className="teacher-progress-panel teacher-progress-groups">
        <div className="teacher-progress-panel-heading">
          <div>
            <p className="panel-label">Groups</p>
            <h3>Shared teaching focus</h3>
          </div>
          <strong>{suggestions.length} suggested</strong>
        </div>
        {suggestions.length ? (
          <ul className="teacher-progress-insight-list">
            {suggestions.map(group => (
              <li key={group.id}>
                <div>
                  <strong>{group.label}</strong>
                  <span>{group.learners.map(learner => learner.name).join(", ")}</span>
                  <small>{group.basis} · {group.learners.length} learners</small>
                  {renderEvidence?.(group)}
                </div>
                <div className="teacher-progress-group-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onChooseLearner?.(group.learners[0].id)}
                  >
                    Review first learner
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => openSave(group)}
                  >
                    Save group
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">No shared focus currently has two or more learners.</p>
        )}
        <p className="teacher-progress-basis">
          Suggestions group a shared current focus or the same re-teaching signal; teachers decide placement.
        </p>
      </article>

      <section
        className="teacher-saved-groups"
        aria-label="Saved instructional groups"
        data-public-ranking="false"
        data-saved-group-count={groups.length}
        data-saved-group-state={state}
      >
        <header className="teacher-saved-groups-heading">
          <div>
            <p className="panel-label">Saved cohorts · private teacher view</p>
            <h3>Instructional groups</h3>
            <p>
              Save a transparent criterion, compare group-level evidence, review movement, and assign
              the next teaching action. Learners are never ranked.
            </p>
          </div>
          <strong>{groups.length} saved</strong>
        </header>

        <p className="teacher-saved-groups-status" role="status" aria-live="polite">{status}</p>

        {draftSuggestion && (
          <form className="teacher-group-save-form" onSubmit={saveGroup}>
            <div>
              <label>
                <span>Group name</span>
                <input
                  autoFocus
                  maxLength={120}
                  required
                  value={draftName}
                  onChange={event => setDraftName(event.target.value)}
                />
              </label>
              <dl>
                <div>
                  <dt>Criterion</dt>
                  <dd>{draftSuggestion.basis}</dd>
                </div>
                <div>
                  <dt>Policy</dt>
                  <dd>{criterionFromSuggestion(draftSuggestion)?.policy}</dd>
                </div>
                <div>
                  <dt>Current membership</dt>
                  <dd>{draftSuggestion.learners.map(learner => learner.name).join(", ")}</dd>
                </div>
              </dl>
            </div>
            <div className="teacher-group-form-actions">
              <button
                className="lp-button lp-button-primary"
                type="submit"
                disabled={busy === "save" || !draftName.trim()}
              >
                {busy === "save" ? "Saving group…" : "Save instructional group"}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={busy === "save"}
                onClick={() => setDraftSuggestion(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {state === "loading" ? (
          <div className="teacher-group-state" role="status">Loading saved instructional groups…</div>
        ) : state === "error" ? (
          <div className="teacher-group-state is-error" role="alert">
            Saved groups could not be loaded. Suggested evidence above is unchanged.
          </div>
        ) : state === "ready" && groups.length === 0 ? (
          <div className="teacher-group-state">
            <strong>No instructional groups saved for {className || "this class"}.</strong>
            <p>Use Save group beside a transparent suggestion above.</p>
          </div>
        ) : state === "ready" ? (
          <>
            <div className="teacher-saved-group-list">
              {groupModels.map(({ group, movement }) => {
                const review = group.reviews[0];
                const selectedForComparison = compareIds.includes(group.id);
                return (
                  <article
                    className="teacher-saved-group-card"
                    aria-label={`Saved instructional group: ${group.name}`}
                    key={group.id}
                  >
                    <header>
                      <div>
                        <span>{group.criteria.basis}</span>
                        <h4>{group.name}</h4>
                        <p>{group.criteria.label}</p>
                      </div>
                      <strong>{review?.student_ids?.length || 0} learners</strong>
                    </header>
                    <p className="teacher-saved-group-policy">{group.criteria.policy}</p>
                    <div className="teacher-saved-group-summary">
                      <span>Last reviewed {formatReviewDate(review?.reviewed_at)}</span>
                      <span>
                        {movement.criterionAvailable
                          ? `${movement.stayed.length} stayed · ${movement.joined.length} joined · ${movement.left.length} left`
                          : "The original criterion is not available in current evidence"}
                      </span>
                    </div>
                    <div className="teacher-saved-group-actions">
                      <button
                        aria-pressed={selectedForComparison}
                        className="lp-button lp-button-secondary"
                        type="button"
                        onClick={() => toggleComparison(group.id)}
                      >
                        {selectedForComparison ? "Remove comparison" : "Compare group"}
                      </button>
                      <button
                        className="lp-button lp-button-primary"
                        type="button"
                        onClick={() => openAssignment(group.id)}
                      >
                        Assign follow-up
                      </button>
                    </div>
                    <details className="teacher-group-movement">
                      <summary>Review movement</summary>
                      <dl>
                        <MovementList
                          label="Stayed"
                          learners={movement.stayed}
                          emptyLabel="No learners stayed under this criterion"
                        />
                        <MovementList
                          label="Joined"
                          learners={movement.joined}
                          emptyLabel="No learners joined"
                        />
                        <MovementList
                          label="Left"
                          learners={movement.left}
                          emptyLabel="No learners left"
                        />
                      </dl>
                      <button
                        className="text-button"
                        type="button"
                        disabled={
                          !movement.criterionAvailable
                          || !movement.currentIds.length
                          || busy === `review:${group.id}`
                        }
                        onClick={() => recordMovement(group, movement)}
                      >
                        {busy === `review:${group.id}`
                          ? "Recording review…"
                          : "Record current movement review"}
                      </button>
                    </details>
                  </article>
                );
              })}
            </div>

            <section className="teacher-group-comparison" aria-label="Instructional group comparison">
              <header>
                <div>
                  <p className="panel-label">Group-level comparison</p>
                  <h4>Compare teaching evidence, not children</h4>
                </div>
                <strong>{comparison.length} of 2 selected</strong>
              </header>
              {comparison.length === 2 ? (
                <div className="teacher-group-comparison-grid">
                  {comparison.map(group => (
                    <article key={group.id}>
                      <h5>{group.name}</h5>
                      <p>
                        {group.criterion.basis} · Captured {formatReviewDate(group.reviewedAt)}
                      </p>
                      {group.snapshot ? (
                        <dl>
                          <ComparisonMetric label="Learners" value={group.snapshot.memberCount} />
                          <ComparisonMetric label="Scored responses" value={group.snapshot.attempts} />
                          <ComparisonMetric label="Skill diversity" value={group.snapshot.skillDiversity} />
                          <ComparisonMetric
                            label="Policy-ready learners"
                            value={`${group.snapshot.policyReadyMembers}/${group.snapshot.memberCount}`}
                          />
                          <ComparisonMetric
                            label="Mean accuracy"
                            value={group.snapshot.averageAccuracy === null
                              ? "Insufficient evidence"
                              : `${group.snapshot.averageAccuracy}%`}
                          />
                          <ComparisonMetric
                            label="Captured support use"
                            value={group.snapshot.supportRecorded
                              ? `${group.snapshot.supportUsed}/${group.snapshot.supportRecorded}`
                              : "Not captured"}
                          />
                        </dl>
                      ) : (
                        <p>Captured evidence is unavailable for this review.</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p>Select exactly two saved groups to compare their evidence basis side by side.</p>
              )}
            </section>
          </>
        ) : null}

        {assignmentGroup && (
          <form className="teacher-group-assignment" onSubmit={assignFollowUp}>
            <header>
              <div>
                <p className="panel-label">Tracked teaching action</p>
                <h4>Assign follow-up · {assignmentGroup.name}</h4>
              </div>
              <button
                className="text-button"
                type="button"
                disabled={busy === `assign:${assignmentGroup.id}`}
                onClick={() => setAssignmentGroupId("")}
              >
                Close
              </button>
            </header>
            <div className="teacher-group-assignment-grid">
              <label>
                <span>Owner</span>
                <input
                  required
                  maxLength={80}
                  value={assignmentDraft.ownerLabel}
                  onChange={event => setAssignmentDraft(current => ({
                    ...current,
                    ownerLabel: event.target.value
                  }))}
                />
              </label>
              <label>
                <span>Delivery date</span>
                <input
                  required
                  type="date"
                  value={assignmentDraft.plannedFor}
                  onChange={event => setAssignmentDraft(current => ({
                    ...current,
                    plannedFor: event.target.value
                  }))}
                />
              </label>
            </div>
            <label>
              <span>Teaching activity</span>
              <textarea
                required
                maxLength={240}
                rows={3}
                placeholder="Describe what will be taught and how"
                value={assignmentDraft.activity}
                onChange={event => setAssignmentDraft(current => ({
                  ...current,
                  activity: event.target.value
                }))}
              />
            </label>
            <button
              className="lp-button lp-button-primary"
              type="submit"
              disabled={
                busy === `assign:${assignmentGroup.id}`
                || !assignmentDraft.ownerLabel.trim()
                || !assignmentDraft.activity.trim()
                || !assignmentDraft.plannedFor
              }
            >
              {busy === `assign:${assignmentGroup.id}`
                ? "Assigning follow-up…"
                : "Assign tracked follow-up"}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
