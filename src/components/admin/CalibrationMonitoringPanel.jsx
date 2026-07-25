import {
  CALIBRATION_MONITORING_POLICY,
  buildCalibrationMonitoringModel
} from "../../data/calibrationMonitoringModel.js";

function formatPercent(value, { signed = false } = {}) {
  if (value === null || value === undefined) return "Suppressed";
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatToken(value = "") {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

function CalibrationMetric({ label, value, detail }) {
  return (
    <article className="calibration-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function CalibrationTable({ caption, columns, rows, emptyText }) {
  return (
    <div
      className="admin-table-wrap teacher-scroll-panel"
      aria-label={`${caption} scroll area`}
      tabIndex={0}
    >
      <table className="dashboard-table admin-table admin-responsive-table calibration-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map(column => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, rowIndex) => (
            <tr key={row.itemId || row.label || `${caption}-${rowIndex}`}>
              {columns.map(column => (
                <td data-label={column.label} key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length}>{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function CalibrationMonitoringPanel({
  model = buildCalibrationMonitoringModel()
}) {
  if (!model || model.state === "invalid") {
    return (
      <section
        className="report-panel page-stack admin-section admin-section-panel calibration-monitoring"
        aria-label="Calibration monitoring"
        data-calibration-state="invalid"
      >
        <h3>Calibration monitoring</h3>
        <p role="alert">
          Calibration monitoring is unavailable because its source failed validation.
          No difficulty, subgroup, reteach, or differential conclusion has been produced.
        </p>
      </section>
    );
  }

  const sourceIsSeeded = model.state === "seeded_preview";
  const difficultyColumns = [
    { key: "label", label: "Item" },
    { key: "skillId", label: "Skill", render: row => formatToken(row.skillId) },
    { key: "responses", label: "Responses" },
    { key: "accuracy", label: "Observed accuracy", render: row => formatPercent(row.accuracy) },
    { key: "difficultyBand", label: "Preview band", render: row => formatToken(row.difficultyBand) },
    { key: "decisionStatus", label: "Decision", render: () => "Specialist review required" }
  ];
  const subgroupColumns = [
    { key: "dimension", label: "Declared dimension", render: row => formatToken(row.dimension) },
    { key: "group", label: "Group", render: row => formatToken(row.group) },
    { key: "participants", label: "Participants" },
    { key: "responses", label: "Administered items" },
    {
      key: "accuracy",
      label: "Descriptive accuracy",
      render: row => row.suppressed ? "Suppressed — cell below 5" : formatPercent(row.accuracy)
    },
    {
      key: "interpretation",
      label: "Interpretation",
      render: row => row.suppressed ? "No group result" : "Descriptive only; no causal claim"
    }
  ];
  const differentialColumns = [
    { key: "label", label: "Item" },
    { key: "skillId", label: "Skill", render: row => formatToken(row.skillId) },
    {
      key: "focalParticipants",
      label: "Focal n",
      render: row => row.suppressed ? "Suppressed" : row.focalParticipants
    },
    {
      key: "referenceParticipants",
      label: "Reference n",
      render: row => row.suppressed ? "Suppressed" : row.referenceParticipants
    },
    {
      key: "standardizedGap",
      label: "Matched gap",
      render: row => row.evidenceReady
        ? formatPercent(row.standardizedGap, { signed: true })
        : "Not enough evidence"
    },
    {
      key: "status",
      label: "Screening state",
      render: row => row.reviewCandidate ? "Specialist review" : formatToken(row.status)
    }
  ];

  return (
    <section
      className="report-panel page-stack admin-section admin-section-panel calibration-monitoring"
      aria-label="Calibration monitoring"
      data-calibration-state={model.state}
      data-calibration-source={model.source.sourceMode}
      data-human-validation={model.source.humanValidationStatus}
    >
      <div className="admin-section-heading calibration-heading">
        <div>
          <p className="calibration-eyebrow">Assessment governance</p>
          <h3>Calibration monitoring</h3>
          <p className="muted-text">
            Inspect item difficulty, possible reteach over-identification, declared subgroup
            summaries, and matched differential item behavior before any policy threshold changes.
          </p>
        </div>
        <span className={`calibration-source-badge ${sourceIsSeeded ? "seeded" : "observed"}`}>
          {sourceIsSeeded ? "Seeded preview" : "Observed · unvalidated"}
        </span>
      </div>

      <div className="calibration-disclaimer" role="status">
        <strong>{sourceIsSeeded ? "Synthetic demonstration data — not real child evidence." : "External observations awaiting specialist review."}</strong>
        <span>{model.source.disclaimer}</span>
        <small>
          Dataset {model.source.datasetVersion} · monitoring {model.source.monitoringVersion}
          {" · "}learning policy {model.source.learningPolicyVersion}
        </small>
      </div>

      <div className="calibration-metric-grid" aria-label="Calibration preview summary">
        <CalibrationMetric
          label="Preview participants"
          value={formatNumber(model.summary.participants)}
          detail={`${formatNumber(model.summary.itemEvents)} item events`}
        />
        <CalibrationMetric
          label="Difficulty rows"
          value={model.summary.items}
          detail={`Minimum ${CALIBRATION_MONITORING_POLICY.minimumItemResponses} responses`}
        />
        <CalibrationMetric
          label="Reteach review candidates"
          value={model.summary.reteachReviewCandidates}
          detail={`${model.summary.reteachFlags} policy flags; none adjudicated`}
        />
        <CalibrationMetric
          label="Differential review"
          value={model.summary.differentialReviewCandidates}
          detail="Screening flags, not bias findings"
        />
        <CalibrationMetric
          label="Suppressed cells"
          value={model.summary.suppressedSubgroupCells}
          detail={`Cells below ${CALIBRATION_MONITORING_POLICY.minimumSubgroupParticipants} stay hidden`}
        />
      </div>

      <div className="calibration-explanation-grid">
        <article>
          <span>False-positive reteach monitoring</span>
          <strong>{formatPercent(model.reteachMonitoring.candidateRate)} candidates</strong>
          <p>
            {model.reteachMonitoring.candidateCount} of {model.reteachMonitoring.flaggedCount}
            {" "}seeded reteach flags have a contradictory independent follow-up. They require
            record review and specialist adjudication; the dashboard never relabels them itself.
          </p>
        </article>
        <article>
          <span>Differential item behavior</span>
          <strong>Ability-band matched</strong>
          <p>
            The preview compares declared groups inside emerging, developing, and secure bands.
            A gap at or above {CALIBRATION_MONITORING_POLICY.differentialReviewGapPercentagePoints}
            {" "}points opens review but is not evidence of cause, unfairness, or item bias.
          </p>
        </article>
      </div>

      <CalibrationTable
        caption="Seeded item-difficulty monitoring"
        columns={difficultyColumns}
        rows={model.difficultyRows}
        emptyText="No item responses meet the monitoring contract."
      />

      <CalibrationTable
        caption="Declared subgroup performance with small-cell suppression"
        columns={subgroupColumns}
        rows={model.subgroupRows}
        emptyText="No declared subgroup summaries are available."
      />

      <CalibrationTable
        caption="Matched differential item behavior screening"
        columns={differentialColumns}
        rows={model.differentialRows}
        emptyText="No items meet the differential screening evidence minimum."
      />

      <div className="calibration-next-step">
        <strong>External decision still required</strong>
        <p>
          Literacy specialists must approve the administration design, inspect flagged records,
          validate or replace every provisional threshold, document exclusions, and sign the
          versioned calibration record. Until then, this area remains “10/10 pending external”
          and no seeded value may change child progression or teacher recommendations.
        </p>
      </div>
    </section>
  );
}
