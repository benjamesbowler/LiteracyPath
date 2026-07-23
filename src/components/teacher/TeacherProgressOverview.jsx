import { useMemo, useState } from "react";
import { buildTeacherProgressOverview } from "../../utils/teacherProgressOverview.js";
import { TeacherGrowthChart } from "./TeacherGrowthChart.jsx";
import { TeacherInstructionalGroups } from "./TeacherInstructionalGroups.jsx";
import { TeacherChart } from "./ui/TeacherPrimitives.jsx";

function bucketLabel(bucket) {
  if (bucket === "got-it") return "Got it";
  if (bucket === "reteach") return "Needs re-teaching";
  if (bucket === "unseen") return "Not met yet";
  return "Almost there";
}

function percentLabel(value) {
  return Number.isFinite(Number(value)) ? `${Number(value)}%` : "Not scored";
}

function EvidenceBasis({ basis, label }) {
  if (!basis) return null;
  return (
    <dl className="teacher-evidence-basis" aria-label={`${label} evidence basis`}>
      <div>
        <dt>Attempts</dt>
        <dd>{basis.attemptsLabel}</dd>
      </div>
      <div>
        <dt>Diversity</dt>
        <dd>{basis.diversityLabel}</dd>
      </div>
      <div>
        <dt>Recency</dt>
        <dd>{basis.recencyLabel}</dd>
      </div>
      <div>
        <dt>Confidence</dt>
        <dd>{basis.confidenceLabel}</dd>
      </div>
      <div>
        <dt>Support use</dt>
        <dd>{basis.supportUseLabel}</dd>
      </div>
    </dl>
  );
}

function EvidenceDisclosure({ basis, label }) {
  if (!basis) return null;
  return (
    <details className="teacher-evidence-disclosure">
      <summary>Evidence basis · {basis.confidence.label}</summary>
      <EvidenceBasis basis={basis} label={label} />
    </details>
  );
}

export function TeacherProgressOverview({
  supabase,
  teacherId = "",
  className = "",
  classList = [],
  selectedClassId = "",
  onSelectClass,
  rows = [],
  selectedLearnerId = "",
  onSelectLearner,
  onClearLearner,
  onOpenReports
}) {
  const summary = useMemo(() => buildTeacherProgressOverview(rows), [rows]);
  const [itemSelection, setItemSelection] = useState({
    learnerId: "",
    itemId: ""
  });
  const selectedLearner = summary.rows.find(row => row.id === selectedLearnerId) || null;
  const selectedItemId = itemSelection.learnerId === selectedLearner?.id
    ? itemSelection.itemId
    : "";
  const selectedItem = selectedLearner?.itemEvidence.find(item => item.id === selectedItemId) || null;
  const insufficientLearners = summary.distribution.find(band => band.id === "insufficient")?.learners || [];

  function chooseLearner(learnerId) {
    const learner = summary.rows.find(row => row.id === learnerId);
    if (!learner) return;
    onSelectLearner?.(learner.id, learner.name);
  }

  function clearLearner() {
    setItemSelection({ learnerId: "", itemId: "" });
    onClearLearner?.();
  }

  return (
    <div className="teacher-progress-overview">
      <section className="teacher-progress-scope" aria-label="Progress class scope">
        <label>
          <span>Current class</span>
          <select
            value={selectedClassId || ""}
            onChange={event => onSelectClass?.(event.target.value || null)}
          >
            <option value="">Choose class</option>
            {classList.map(row => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </select>
        </label>
        <p role="status">
          {selectedClassId
            ? `${className || "Selected class"} · ${summary.coverage.totalLearners} active learners`
            : "Choose a class to review its evidence."}
        </p>
      </section>

      {!selectedClassId ? (
        <section className="report-empty-state" aria-label="No progress class selected">
          <strong>Choose a class first.</strong>
          <p>Distribution, coverage, groups, and outliers stay scoped to one class.</p>
        </section>
      ) : summary.rows.length === 0 ? (
        <section className="report-empty-state" aria-label="No class progress evidence">
          <strong>No learner evidence is available yet.</strong>
          <p>Run the first check or collect practice evidence, then return to Progress.</p>
        </section>
      ) : (
        <>
          <section className="teacher-progress-grid" aria-label="Class progress overview">
            <article className="teacher-progress-panel teacher-progress-distribution">
              <div className="teacher-progress-panel-heading">
                <div>
                  <p className="panel-label">Distribution</p>
                  <h3>Where current evidence sits</h3>
                </div>
                <strong>{summary.classMedian === null ? "No median" : `${summary.classMedian}% median`}</strong>
              </div>
              <TeacherChart
                className="teacher-progress-distribution-chart"
                label={summary.distribution
                  .map(band => `${band.label}: ${band.count} learners`)
                  .join(". ")}
              >
                {summary.distribution.map(band => (
                  <span
                    key={band.id}
                    className={`is-${band.id}`}
                    style={{ "--progress-share": Math.max(1, band.count) }}
                    title={`${band.label}: ${band.count}`}
                  />
                ))}
              </TeacherChart>
              <ul className="teacher-progress-distribution-list">
                {summary.distribution.map(band => (
                  <li key={band.id}>
                    <span className={`teacher-progress-key is-${band.id}`} aria-hidden="true" />
                    <div>
                      <strong>{band.label}</strong>
                      <small>{band.description}</small>
                    </div>
                    <b>{band.count}</b>
                  </li>
                ))}
              </ul>
              <p className="teacher-progress-basis">
                Accuracy bands require at least {summary.policy.minimumResponses} scored responses.
              </p>
              {insufficientLearners.length > 0 && (
                <ul className="teacher-progress-insufficient-list" aria-label="Learners with insufficient evidence">
                  {insufficientLearners.map(learner => (
                    <li key={learner.id}>
                      <span>{learner.name}</span>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => chooseLearner(learner.id)}
                      >
                        Review {learner.name} evidence
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <EvidenceBasis basis={summary.classEvidence} label="Class distribution conclusion" />
            </article>

            <article className="teacher-progress-panel">
              <div className="teacher-progress-panel-heading">
                <div>
                  <p className="panel-label">Coverage</p>
                  <h3>How much evidence exists</h3>
                </div>
                <strong>{summary.coverage.learnerPercent}% reached</strong>
              </div>
              <dl className="teacher-progress-facts">
                <div>
                  <dt>Learners with evidence</dt>
                  <dd>{summary.coverage.learnersWithAnyEvidence} of {summary.coverage.totalLearners}</dd>
                </div>
                <div>
                  <dt>Policy-ready learners</dt>
                  <dd>{summary.coverage.learnersPolicyReady} · {summary.coverage.policyReadyPercent}%</dd>
                </div>
                <div>
                  <dt>Scored responses</dt>
                  <dd>{summary.coverage.responseCount}</dd>
                </div>
                <div>
                  <dt>Sound targets seen</dt>
                  <dd>{summary.coverage.itemTargetsSeen} of {summary.coverage.itemTargetCount}</dd>
                </div>
              </dl>
              <p className="teacher-progress-basis">
                Coverage reports presence of evidence, not learner mastery.
              </p>
              <EvidenceBasis basis={summary.coverage.evidence} label="Class coverage conclusion" />
            </article>

            <TeacherInstructionalGroups
              key={selectedClassId}
              supabase={supabase}
              teacherId={teacherId}
              classId={selectedClassId}
              className={className}
              suggestions={summary.groups}
              rows={summary.rows}
              onChooseLearner={chooseLearner}
              renderEvidence={group => (
                <EvidenceDisclosure
                  basis={group.evidence}
                  label={`${group.label} group conclusion`}
                />
              )}
            />

            <article className="teacher-progress-panel">
              <div className="teacher-progress-panel-heading">
                <div>
                  <p className="panel-label">Outliers</p>
                  <h3>Evidence far from the class median</h3>
                </div>
                <strong>{summary.outliers.length} flagged</strong>
              </div>
              {summary.outliers.length ? (
                <ul className="teacher-progress-insight-list">
                  {summary.outliers.map(learner => (
                    <li key={learner.id}>
                      <div>
                        <strong>{learner.name}</strong>
                        <span>
                          {learner.accuracy}% · {Math.abs(learner.difference)} points {learner.direction} median
                        </span>
                        <small>{learner.answered} scored responses</small>
                        <EvidenceDisclosure
                          basis={learner.evidence}
                          label={`${learner.name} outlier conclusion`}
                        />
                      </div>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => chooseLearner(learner.id)}
                      >
                        Review {learner.name} evidence
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-text">No policy-ready learner is 15 or more points from the median.</p>
              )}
              <p className="teacher-progress-basis">
                Outliers require policy-ready evidence and a difference of at least {summary.policy.outlierDistance} points.
              </p>
            </article>
          </section>

          {selectedLearner && (
            <section
              className="teacher-progress-learner"
              aria-label={`Learner progress evidence: ${selectedLearner.name}`}
            >
              <div className="teacher-progress-learner-heading">
                <div>
                  <p className="panel-label">Learner drill-down</p>
                  <h3>{selectedLearner.name} evidence</h3>
                  <p>
                    {selectedLearner.answered} scored responses ·
                    {" "}{selectedLearner.evidence.ready
                      ? `${percentLabel(selectedLearner.accuracy)} accuracy`
                      : "Insufficient evidence for an accuracy conclusion"} ·
                    {" "}{selectedLearner.masteredCount} mastered skills
                  </p>
                </div>
                <button className="text-button" type="button" onClick={clearLearner}>
                  Close learner evidence
                </button>
              </div>
              <EvidenceBasis
                basis={selectedLearner.evidence}
                label={`${selectedLearner.name} learner conclusion`}
              />
              <TeacherGrowthChart
                supabase={supabase}
                teacherId={teacherId}
                classId={selectedClassId}
                learnerId={selectedLearner.id}
                learnerName={selectedLearner.name}
              />

              {selectedLearner.itemEvidence.length ? (
                <div>
                  <h4>Sound item evidence</h4>
                  <ul className="teacher-progress-item-list">
                    {selectedLearner.itemEvidence.map(item => (
                      <li key={item.id}>
                        <button
                          type="button"
                          aria-expanded={selectedItemId === item.id}
                          onClick={() => setItemSelection(current => ({
                            learnerId: selectedLearner.id,
                            itemId: current.learnerId === selectedLearner.id && current.itemId === item.id
                              ? ""
                              : item.id
                          }))}
                        >
                          <strong>{item.label}</strong>
                          <span>{bucketLabel(item.bucket)} · {item.seen} recorded encounters</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted-text">No Sound Seekers item evidence is available for this learner.</p>
              )}

              {selectedItem && (
                <article
                  className="teacher-progress-item-evidence"
                  aria-label={`Item evidence: ${selectedItem.label}`}
                >
                  <div>
                    <p className="panel-label">Exact item</p>
                    <h4>{selectedItem.label}</h4>
                    <p>{selectedItem.stopName}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Current signal</dt>
                      <dd>{selectedItem.policyReady ? bucketLabel(selectedItem.bucket) : "Insufficient evidence"}</dd>
                    </div>
                    <div>
                      <dt>Recorded encounters</dt>
                      <dd>{selectedItem.seen}</dd>
                    </div>
                    <div>
                      <dt>Independent attempts</dt>
                      <dd>{selectedItem.independentSeen}</dd>
                    </div>
                    <div>
                      <dt>Independent accuracy</dt>
                      <dd>
                        {selectedItem.policyReady
                          ? percentLabel(selectedItem.accuracy)
                          : "Insufficient evidence"}
                      </dd>
                    </div>
                  </dl>
                  <EvidenceBasis
                    basis={selectedItem.evidence}
                    label={`${selectedItem.label} item conclusion`}
                  />
                  <p className="teacher-progress-basis">
                    Evidence source: saved Sound Seekers item history
                    {selectedItem.updatedAt ? ` · updated ${new Date(selectedItem.updatedAt).toLocaleString()}` : ""}.
                  </p>
                </article>
              )}

              <button className="lp-button lp-button-secondary" type="button" onClick={onOpenReports}>
                Open full learner report
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
