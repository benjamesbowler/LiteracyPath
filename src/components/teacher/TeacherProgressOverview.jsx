import { useMemo, useState } from "react";
import { buildTeacherProgressOverview } from "../../utils/teacherProgressOverview.js";
import { LEARNING_STATUS_IDS } from "../../policy/learningPolicy.js";
import { TeacherGrowthChart } from "./TeacherGrowthChart.jsx";
import { TeacherInsightActions } from "./TeacherInsightActions.jsx";
import { TeacherInstructionalGroups } from "./TeacherInstructionalGroups.jsx";
import { TeacherChart } from "./ui/TeacherPrimitives.jsx";
import { TeacherRecommendationExplanation } from "../recommendations/RecommendationExplanation.jsx";
import { countPhrase, progressPhrase } from "../../copy/teacherCopy.js";

function bucketLabel(bucket) {
  if (bucket === "got-it") return "Got it";
  if (bucket === "reteach") return "Needs re-teaching";
  if (bucket === "unseen") return "Not met yet";
  return "Almost there";
}

function percentLabel(value) {
  return Number.isFinite(Number(value)) ? `${Number(value)}%` : "Not scored";
}

function snapshotEvidenceBasis(basis) {
  if (!basis) return null;
  return {
    attempts: basis.attempts,
    diversity: basis.diversity,
    recency: basis.recency || null,
    confidence: basis.confidence,
    support: basis.support
  };
}

function EvidenceBasis({ basis, label }) {
  if (!basis) return null;
  return (
    <dl className="teacher-evidence-basis" aria-label={`${label} results used`}>
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
      <summary>Results used · {basis.confidence.label}</summary>
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
  policyNow,
  onSelectLearner,
  onClearLearner,
  onOpenReports
}) {
  const summary = useMemo(
    () => buildTeacherProgressOverview(rows, { now: policyNow || new Date() }),
    [policyNow, rows]
  );
  const [itemSelection, setItemSelection] = useState({
    learnerId: "",
    itemId: ""
  });
  const selectedLearner = summary.rows.find(row => row.id === selectedLearnerId) || null;
  const selectedItemId = itemSelection.learnerId === selectedLearner?.id
    ? itemSelection.itemId
    : "";
  const selectedItem = selectedLearner?.itemEvidence.find(item => item.id === selectedItemId) || null;
  const insufficientLearners = summary.distribution.find(
    band => band.id === LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
  )?.learners || [];

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
    <div
      className="teacher-progress-overview"
      data-learning-policy-version={summary.policyVersion}
    >
      <section className="teacher-progress-scope" aria-label="Choose progress class">
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
            ? `${className || "Selected class"} · ${countPhrase(summary.coverage.totalLearners, "child", "children")}`
            : "Choose a class to review its results."}
        </p>
      </section>

      {!selectedClassId ? (
        <section className="report-empty-state" aria-label="No progress class selected">
          <strong>Choose a class first.</strong>
          <p>Distribution, coverage, groups, and outliers stay scoped to one class.</p>
        </section>
      ) : summary.rows.length === 0 ? (
        <section className="report-empty-state" aria-label="No class progress results">
          <strong>No child results are available yet.</strong>
          <p>Run the first check or collect practice results, then return to Progress.</p>
        </section>
      ) : (
        <>
          <section className="teacher-progress-grid" aria-label="Class progress overview">
            <article
              className="teacher-progress-panel teacher-progress-class-accuracy"
              aria-label="Class accuracy comparison"
              data-class-comparable={summary.classAccuracy.comparability.comparable}
            >
              <div className="teacher-progress-panel-heading">
                <div>
                  <p className="panel-label">Class accuracy</p>
                  <h3>Class accuracy</h3>
                </div>
                <strong>
                  {summary.classAccuracy.headlineAccuracy === null
                    ? "No single class average"
                    : percentLabel(summary.classAccuracy.headlineAccuracy)}
                </strong>
              </div>
              <details>
                <summary>See both averages</summary>
                <dl className="teacher-progress-facts teacher-progress-accuracy-facts">
                  <div>
                    <dt>Averaging children equally</dt>
                    <dd>
                      {percentLabel(summary.classAccuracy.learnerWeightedAccuracy)}
                      <small>{progressPhrase(summary.classAccuracy.policyReadyLearnerCount, summary.classAccuracy.totalLearnerCount)} children with enough results</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Averaging every answer equally</dt>
                    <dd>
                      {percentLabel(summary.classAccuracy.responseWeightedAccuracy)}
                      <small>{countPhrase(summary.classAccuracy.responseCount, "scored answer")}</small>
                    </dd>
                  </div>
                </dl>
              </details>
              <p
                className="teacher-progress-basis"
                role="status"
                data-class-average-suppressed={!summary.classAccuracy.comparability.comparable}
              >
                {summary.classAccuracy.comparability.comparable
                  ? "Both averages use enough saved results to be compared fairly."
                  : `No single class average is shown because comparability is weak: ${summary.classAccuracy.comparability.reason}.`}
              </p>
              <EvidenceBasis basis={summary.classEvidence} label="Class accuracy conclusion" />
            </article>

            <article className="teacher-progress-panel teacher-progress-distribution">
              <div className="teacher-progress-panel-heading">
                <div>
                  <p className="panel-label">Distribution</p>
                  <h3>Where current results sit</h3>
                </div>
                <strong>{summary.classMedian === null ? "No median" : `${summary.classMedian}% median`}</strong>
              </div>
              <TeacherChart
                className="teacher-progress-distribution-chart"
                label={summary.distribution
                  .map(band => `${band.label}: ${countPhrase(band.count, "child", "children")}`)
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
                Accuracy bands appear after at least {summary.policy.minimumResponses} scored answers.
              </p>
              {insufficientLearners.length > 0 && (
                <ul className="teacher-progress-insufficient-list" aria-label="Children with too few results">
                  {insufficientLearners.map(learner => (
                    <li key={learner.id}>
                      <span>{learner.name}</span>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => chooseLearner(learner.id)}
                      >
                        Review {learner.name}&apos;s results
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
                  <h3>How many results are saved</h3>
                </div>
                <strong>{summary.coverage.learnerPercent}% have results</strong>
              </div>
              <dl className="teacher-progress-facts">
                <div>
                  <dt>Children with results</dt>
                  <dd>{progressPhrase(summary.coverage.learnersWithAnyEvidence, summary.coverage.totalLearners)}</dd>
                </div>
                <div>
                  <dt>Children with enough results</dt>
                  <dd>{summary.coverage.learnersPolicyReady} · {summary.coverage.policyReadyPercent}%</dd>
                </div>
                <div>
                  <dt>Scored answers</dt>
                  <dd>{summary.coverage.responseCount}</dd>
                </div>
                <div>
                  <dt>Sound targets seen</dt>
                  <dd>{progressPhrase(summary.coverage.itemTargetsSeen, summary.coverage.itemTargetCount)}</dd>
                </div>
              </dl>
              <p className="teacher-progress-basis">
                Coverage shows where results exist. It does not prove mastery.
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
                <>
                  <TeacherRecommendationExplanation
                    surface="teacher-progress"
                    explanation={{
                      evidence: `${countPhrase(group.learners.length, "child", "children")} share this result: ${group.basis}.`,
                      dependency: `${group.basis} is the common recorded focus to address before dependent practice advances.`,
                      confidence: `${group.evidence.confidence.label}: ${group.evidence.confidence.detail}.`,
                      unlock: "A focused group session creates one teachable target and a shared point for the next check."
                    }}
                  />
                  <EvidenceDisclosure
                    basis={group.evidence}
                    label={`${group.label} group conclusion`}
                  />
                </>
              )}
              renderActions={group => (
                <TeacherInsightActions
                  supabase={supabase}
                  classId={selectedClassId}
                  className={className}
                  insight={{
                    key: group.id,
                    kind: "instructional-group",
                    label: group.label,
                    focus: group.basis,
                    reason: group.evidence.confidence.detail,
                    criterion: {
                      id: group.id,
                      basis: group.basis,
                      policy: group.evidence.confidence.detail
                    },
                    evidence: snapshotEvidenceBasis(group.evidence),
                    learners: group.learners
                  }}
                  rows={summary.rows}
                />
              )}
            />

            <article className="teacher-progress-panel">
              <div className="teacher-progress-panel-heading">
                <div>
                  <p className="panel-label">Outliers</p>
                  <h3>Results far from the class middle</h3>
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
                        <small>{countPhrase(learner.answered, "scored answer")}</small>
                        <EvidenceDisclosure
                          basis={learner.evidence}
                          label={`${learner.name} outlier conclusion`}
                        />
                        <TeacherRecommendationExplanation
                          surface="teacher-progress"
                          explanation={{
                            evidence: `${countPhrase(learner.answered, "scored answer")} place ${learner.name} ${Math.abs(learner.difference)} points ${learner.direction} the class middle.`,
                            dependency: "Review the child's results before changing teaching or the suggested starting point.",
                            confidence: `${learner.evidence.confidence.label}: ${learner.evidence.confidence.detail}.`,
                            unlock: "Review can distinguish a teaching need from a healthy strength or a difference in how the result was collected."
                          }}
                        />
                      </div>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => chooseLearner(learner.id)}
                      >
                        Review {learner.name}&apos;s results
                      </button>
                      <TeacherInsightActions
                        supabase={supabase}
                        classId={selectedClassId}
                        className={className}
                        insight={{
                          key: `outlier:${learner.id}`,
                          kind: "learner-outlier",
                          label: `${learner.name} result difference`,
                          focus: `${learner.accuracy}% accuracy · ${Math.abs(learner.difference)} points ${learner.direction} class median`,
                          reason: `The child's results are ${Math.abs(learner.difference)} points ${learner.direction} the ${summary.classMedian}% class median.`,
                          criterion: {
                            type: "class-median-distance",
                            minimumResponses: summary.policy.minimumResponses,
                            minimumDistancePoints: summary.policy.outlierDistance
                          },
                          evidence: {
                            accuracy: learner.accuracy,
                            classMedian: summary.classMedian,
                            difference: learner.difference,
                            direction: learner.direction,
                            basis: snapshotEvidenceBasis(learner.evidence)
                          },
                          learners: [{ id: learner.id, name: learner.name }]
                        }}
                        rows={summary.rows}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-text">No child with enough results is 15 or more points from the class middle.</p>
              )}
              <p className="teacher-progress-basis">
                This list needs enough saved results and a difference of at least {summary.policy.outlierDistance} points.
              </p>
            </article>
          </section>

          {selectedLearner && (
            <section
              className="teacher-progress-learner"
              aria-label={`Child progress results: ${selectedLearner.name}`}
            >
              <div className="teacher-progress-learner-heading">
                <div>
                  <p className="panel-label">Child details</p>
                  <h3>{selectedLearner.name}&apos;s results</h3>
                  <p>
                    {countPhrase(selectedLearner.answered, "scored answer")} ·
                    {" "}{selectedLearner.evidence.ready
                      ? `${percentLabel(selectedLearner.accuracy)} accuracy`
                      : "Too few results for an accuracy figure"} ·
                    {" "}{selectedLearner.masteredCount} mastered skills
                  </p>
                </div>
                <button className="text-button" type="button" onClick={clearLearner}>
                  Close child results
                </button>
              </div>
              <EvidenceBasis
                basis={selectedLearner.evidence}
                label={`${selectedLearner.name} result conclusion`}
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
                  <h4>Sound results</h4>
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
                          <span>
                            {item.policyReady ? bucketLabel(item.bucket) : "Too few results"}
                            {" "}· {item.seen} recorded encounters
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted-text">No Sound Seekers item results are available for this child.</p>
              )}

              {selectedItem && (
                <article
                  className="teacher-progress-item-evidence"
                  aria-label={`Item results: ${selectedItem.label}`}
                >
                  <div>
                    <p className="panel-label">Exact item</p>
                    <h4>{selectedItem.label}</h4>
                    <p>{selectedItem.stopName}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Current signal</dt>
                      <dd>{selectedItem.policyReady ? bucketLabel(selectedItem.bucket) : "Too few results"}</dd>
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
                          : "Too few results"}
                      </dd>
                    </div>
                  </dl>
                  <EvidenceBasis
                    basis={selectedItem.evidence}
                    label={`${selectedItem.label} item conclusion`}
                  />
                  <p className="teacher-progress-basis">
                    Results source: saved Sound Seekers item history
                    {selectedItem.updatedAt ? ` · updated ${new Date(selectedItem.updatedAt).toLocaleString()}` : ""}.
                  </p>
                  <TeacherInsightActions
                    supabase={supabase}
                    classId={selectedClassId}
                    className={className}
                    insight={{
                      key: `sound:${selectedItem.id}`,
                      kind: "exact-item-evidence",
                      label: `${selectedLearner.name} · ${selectedItem.label}`,
                      focus: `${selectedItem.policyReady
                        ? bucketLabel(selectedItem.bucket)
                        : "Too few results"} for ${selectedItem.label}`,
                      reason: selectedItem.policyReady
                        ? `${selectedItem.independentSeen} independent attempts currently classify this item as ${bucketLabel(selectedItem.bucket)}.`
                        : `${selectedItem.independentSeen} independent attempts are too few for this item.`,
                      criterion: {
                        type: "exact-sound-item",
                        itemId: selectedItem.id,
                        minimumIndependentAttempts: 3
                      },
                      evidence: {
                        bucket: selectedItem.bucket,
                        policyReady: selectedItem.policyReady,
                        independentAttempts: selectedItem.independentSeen,
                        accuracy: selectedItem.accuracy,
                        stopName: selectedItem.stopName,
                        updatedAt: selectedItem.updatedAt || null,
                        basis: snapshotEvidenceBasis(selectedItem.evidence)
                      },
                      learners: [{
                        id: selectedLearner.id,
                        name: selectedLearner.name
                      }]
                    }}
                    rows={summary.rows}
                  />
                </article>
              )}

              <button className="lp-button lp-button-secondary" type="button" onClick={onOpenReports}>
                Open full child report
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
