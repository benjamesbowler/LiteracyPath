import { useEffect, useMemo, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import {
  buildStudentReportModel,
  formatItemLabel,
  getAccuracyStatus,
  getSkillArea
} from "../data/reportingSystem.js";
import { normalizeAssessmentAttempt } from "../data/assessmentHistoryStore.js";
import { itemUniverseCounts } from "../data/generated/itemUniverse.generated.js";
import {
  loadStoryQuestProgress,
  summarizeStoryQuestProgress
} from "../utils/storyQuestProgress.js";
import {
  buildAttemptReviewRows,
  buildElChecksSummary,
  buildGuidedReadingReportRows,
  buildGuidedReadingSummary,
  buildQuestionRollup,
  buildSoundsProgress,
  getPassRule,
  getStoryQuestStarInfo,
  hasEngagementSignal,
  REPORT_STATUS_LEGEND,
  RETAKE_HINT_TEXT,
  shouldShowRollup,
  summarizeStoryQuestStars,
  wasRetestedToday
} from "../utils/reportSections.js";
import {
  buildEngagementRow,
  collectStudentEngagementAreas
} from "../utils/exportReportSections.js";
import { importWithRetry } from "../utils/lazyWithRetry.js";
import { buildQuestMasteryReport } from "../utils/questReport.js";

const STATUS_TEXT = {
  on_track: "On Track",
  developing: "Developing",
  needs_support: "Needs Support",
  not_started: "Not Assessed"
};

const STATUS_RULES = {
  mastered: { label: "Mastered", className: "mastered" },
  // "Mastered" is reserved for a real checkpoint pass; accuracy-only strength
  // reads as "On Track" (same styling) so the two are never conflated.
  on_track: { label: "On Track", className: "mastered" },
  developing: { label: "Developing", className: "developing" },
  needs_support: { label: "Needs Support", className: "needs-support" },
  not_assessed: { label: "Not assessed", className: "not-assessed" }
};

const AREA_ORDER = [
  "Phonological Awareness",
  "Phonics",
  "High-Frequency Words",
  "Grammar / Language",
  "Guided Reading"
];
const EMPTY_REPORT_ROWS = [];

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function statusFromAccuracy(accuracy, hasData = true) {
  const status = getAccuracyStatus(accuracy, hasData);
  if (status.id === "on_track") return STATUS_RULES.on_track;
  if (status.id === "developing") return STATUS_RULES.developing;
  if (status.id === "needs_support") return STATUS_RULES.needs_support;
  return STATUS_RULES.not_assessed;
}

function getSnapshotBadgeClass(statusId = "") {
  switch (statusId) {
    case "on_track":
      return "lg-badge-on-track";
    case "developing":
      return "lg-badge-developing";
    case "needs_support":
      return "lg-badge-needs-support";
    default:
      return "lg-badge-not-started";
  }
}

function getMetricClass(role = "") {
  switch (role) {
    case "accuracy":
      return "lg-metric-teal";
    case "skill":
      return "lg-metric-blue";
    case "skills":
      return "lg-metric-green";
    case "answered":
      return "lg-metric-purple";
    default:
      return "lg-metric-neutral";
  }
}

function getSkillTileDomainClass(row = {}) {
  const value = `${row.skillArea || ""} ${row.skillName || ""}`.toLowerCase();
  if (value.includes("phonological")) return "lg-tile-phonological";
  if (value.includes("high-frequency")) return "lg-tile-hfw";
  if (value.includes("grammar") || value.includes("language")) return "lg-tile-grammar";
  if (value.includes("guided reading") || value.includes("reading")) return "lg-tile-reading";
  return "lg-tile-phonics";
}

function getSkillTileStatusClass(statusClassName = "") {
  switch (statusClassName) {
    case "mastered":
      return "lg-tile-mastered";
    case "developing":
      return "lg-tile-developing";
    case "needs-support":
      return "lg-tile-support";
    default:
      return "";
  }
}

function normaliseList(values = []) {
  return Array.from(new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean)));
}

function formatClassLabel(value = "") {
  return value || "Class not linked";
}

function SectionBand({ accent = "#0D7A73", children, subtitle, title }) {
  return (
    <div className="student-report-section-band" style={{ "--section-accent": accent }}>
      <div className="student-report-section-stripe" aria-hidden="true"></div>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ReportActions({ exportCSVData, returnToTeacherDashboard, startAssessment }) {
  return (
    <div className="student-report-actions screen-only">
      <button className="main-button" onClick={startAssessment} type="button">Start Assessment</button>
      <button className="report-button primary-export" onClick={() => window.print()} type="button">Export Report</button>
      {exportCSVData && (
        <button className="report-button csv-link" onClick={exportCSVData} type="button">Download Data (CSV)</button>
      )}
      {returnToTeacherDashboard && (
        <button className="report-button" onClick={returnToTeacherDashboard} type="button">Teacher Dashboard</button>
      )}
    </div>
  );
}

function StatusCallout({ snapshot }) {
  return (
    <section className={`student-report-status-callout ${snapshot.status.id}`}>
      <div>
        <strong className={`lg-badge ${getSnapshotBadgeClass(snapshot.status.id)}`}>
          <span className="lg-badge-icon" aria-hidden="true">{snapshot.status.id === "needs_support" ? "!" : "✓"}</span>
          {STATUS_TEXT[snapshot.status.id] || snapshot.status.label}
        </strong>
        <span>{snapshot.status.description}</span>
      </div>
      <p>Last active: <strong>{snapshot.lastActive || "No saved activity"}</strong></p>
    </section>
  );
}

function SnapshotGrid({ model, skillTotal }) {
  const metrics = [
    ["Overall Accuracy", `${model.snapshot.accuracy}%`, "accuracy"],
    ["Current Skill", model.snapshot.currentSkill, "skill"],
    ["Skills Passed", `${model.snapshot.skillsPassed} / ${skillTotal}`, "skills"],
    ["Questions Answered", model.snapshot.totalAnswered, "answered"]
  ];
  return (
    <section className="student-report-snapshot-grid lg-metric-grid">
      {metrics.map(([label, value, role]) => (
        <article className={`snapshot-metric ${role} lg-metric-card ${getMetricClass(role)}`} key={label}>
          <span className="lg-metric-label">{label}</span>
          <strong className="lg-metric-value">{value}</strong>
        </article>
      ))}
    </section>
  );
}

function buildElAssessmentCards({ letterAssessment = [], patternAssessment = [] }) {
  const nameItems = letterAssessment.map(item => ({
    label: item.letter,
    known: Boolean(item.knowsName)
  }));
  const soundItems = letterAssessment.map(item => ({
    label: `/${String(item.letter || "").toLowerCase()}/`,
    known: Boolean(item.knowsSound)
  }));
  const namesKnown = nameItems.filter(item => item.known).length;
  const soundsKnown = soundItems.filter(item => item.known).length;
  // Real denominators only: with no assessed items the total is 0 and the
  // card shows its "Not assessed" state instead of a made-up "/ 52".
  const nameTotal = nameItems.length;
  const soundTotal = soundItems.length;
  const patternItems = patternAssessment.map(item => ({
    label: item.pattern,
    known: Boolean(item.soundCorrect && item.wordCorrect),
    partial: Boolean(item.soundCorrect || item.wordCorrect) && !(item.soundCorrect && item.wordCorrect)
  }));
  // Checks-based convention throughout the EL sections: each pattern carries
  // two checks (sound + word), so numerator and denominator count the same
  // unit even when only one field is filled in.
  const patternChecks = buildElChecksSummary(patternAssessment, item => [item.soundCorrect, item.wordCorrect]);
  const patternTotal = patternChecks.checksTotal;
  const patternCorrect = patternChecks.checksCorrect;

  return [
    {
      title: "Letter Names",
      correct: namesKnown,
      total: nameTotal,
      accuracy: nameTotal ? clampPercent((namesKnown / nameTotal) * 100) : 0,
      hasData: letterAssessment.length > 0,
      items: nameItems
    },
    {
      title: "Letter Sounds",
      correct: soundsKnown,
      total: soundTotal,
      accuracy: soundTotal ? clampPercent((soundsKnown / soundTotal) * 100) : 0,
      hasData: letterAssessment.length > 0,
      items: soundItems
    },
    {
      title: "Phonics Patterns",
      correct: patternCorrect,
      total: patternTotal,
      accuracy: patternTotal ? clampPercent((patternCorrect / patternTotal) * 100) : 0,
      hasData: patternAssessment.length > 0,
      items: patternItems
    }
  ];
}

function ElItemChip({ label, known, partial = false }) {
  const cls = known ? "el-chip-known" : partial ? "el-chip-partial" : "el-chip-unknown";
  return <span className={`el-item-chip ${cls}`}>{label}</span>;
}

function ElAssessmentSection({ cards }) {
  const hasAny = cards.some(card => card.hasData);
  if (!hasAny) {
    return (
      <div className="student-report-muted-card">
        No EL assessment recorded yet. Run an EL assessment to populate this section.
      </div>
    );
  }

  return (
    <div className="student-report-el-grid lg-el-grid">
      {cards.map(card => {
        const status = statusFromAccuracy(card.accuracy, card.hasData);
        return (
          <article className={`el-card ${status.className} lg-el-card`} key={card.title}>
            <h3 className="lg-el-label">{card.title}</h3>
            <strong className="lg-el-score">{card.total ? `${card.correct} / ${card.total}` : "Not assessed"}</strong>
            <p>{card.hasData ? `${card.accuracy}% · ${status.label.toUpperCase()}` : "Not assessed"}</p>
            {card.hasData && card.items?.length > 0 && (
              <div className="el-chip-grid">
                {card.items.map((item, index) => (
                  <ElItemChip
                    key={`${card.title}-${item.label}-${index}`}
                    label={item.label}
                    known={item.known}
                    partial={item.partial}
                  />
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function groupSkillRows(rows = []) {
  const grouped = new Map();
  rows.forEach(row => {
    const key = row.skillArea || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });
  return Array.from(grouped.entries())
    .sort(([a], [b]) => {
      const ai = AREA_ORDER.indexOf(a);
      const bi = AREA_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b);
    });
}

function SkillTile({ masteryRow = null, row }) {
  const hasData =
    row.attempts > 0 ||
    row.status === "passed" ||
    (row.coverage?.mastered > 0 && row.coverage?.total > 0);
  const scoreText = row.checkpointHistory.at(-1)?.score || row.checkpointScore;
  const unit = row.coverage?.unit || "items";
  const total = row.coverage?.total || scoreText?.split("/")?.[1] || 0;
  const mastered = row.coverage?.mastered || scoreText?.split("/")?.[0] || 0;
  const coveragePercent = clampPercent(row.coveragePercent || 0);
  // "Mastered" only for a real checkpoint pass; strong accuracy without a
  // pass reads as "On Track" (see the legend above the tiles).
  const status = row.status === "passed"
    ? STATUS_RULES.mastered
    : statusFromAccuracy(coveragePercent, hasData);
  const passRule = getPassRule(row.label);
  const retestedToday = wasRetestedToday(masteryRow);

  return (
    <article
      className={`student-report-skill-tile ${status.className} lg-skill-tile ${getSkillTileDomainClass(row)} ${getSkillTileStatusClass(status.className)}`}
      style={{ "--skill-accent": row.skillAreaColor || "#0D7A73" }}
    >
      <span className="lg-skill-tile-num">{row.index + 1}</span>
      <strong className="lg-skill-tile-name">{row.label}</strong>
      <b className="lg-skill-tile-score">{hasData ? `${coveragePercent}%` : "—"}</b>
      <small className="lg-skill-tile-sub">{total ? `${mastered}/${total} ${unit}` : "No item evidence"} · {status.label}</small>
      <small className="lg-skill-tile-pass">{passRule.text}</small>
      {retestedToday && <small className="skill-retake-hint">{RETAKE_HINT_TEXT}</small>}
    </article>
  );
}

function SkillSetSection({ mastery = {}, rows }) {
  return (
    <div className="student-report-skill-groups">
      <p className="student-report-legend">{REPORT_STATUS_LEGEND}</p>
      {groupSkillRows(rows).map(([area, areaRows]) => {
        const areaMeta = getSkillArea({ skillName: area });
        return (
          <section className="student-report-skill-group lg-domain-section" key={area}>
            <div className="lg-domain-header">
              <div className="student-report-skill-rule lg-domain-pip" style={{ "--area-color": areaMeta.color, background: areaMeta.color }}></div>
              <h3 className="lg-domain-label" style={{ color: areaMeta.color }}>{area}</h3>
            </div>
            <div className="student-report-skill-grid lg-skill-tiles">
              {areaRows.map(row => (
                <SkillTile key={row.skillId} masteryRow={mastery?.[row.skillId] || null} row={row} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GrowthSection({ assessmentHistory = [], model, letterAssessment = [], patternAssessment = [] }) {
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const skillRows = model.skillMapRows || [];
  const dropdownOptions = [
    { value: "", label: "All Skills (overview)" },
    ...skillRows.map(row => {
      const history = row.checkpointHistory || [];
      return {
        value: row.skillId,
        label: `${row.index + 1}. ${row.label}${
          history.length
            ? ` (${history.length} attempt${history.length === 1 ? "" : "s"})`
            : " — not yet attempted"
        }`
      };
    }),
    {
      value: "el_letter",
      label: `EL: Letter Name & Sound${letterAssessment.length ? ` (${letterAssessment.length} items)` : " — not yet assessed"}`
    },
    {
      value: "el_pattern",
      label: `EL: Advanced Phonics${patternAssessment.length ? ` (${patternAssessment.length} items)` : " — not yet assessed"}`
    }
  ];
  const selectedRow = selectedSkillId
    ? skillRows.find(row => row.skillId === selectedSkillId)
    : null;
  const selectedAttempts = useMemo(() => {
    if (!selectedRow) return [];
    return (assessmentHistory || [])
      .map(normalizeAssessmentAttempt)
      .filter(attempt => attempt.skillId === selectedRow.skillId || attempt.skillName === selectedRow.label)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  }, [assessmentHistory, selectedRow]);

  return (
    <div className="growth-section">
      <div className="growth-section-controls screen-only">
        <label className="growth-skill-selector">
          <span>Skill</span>
          <select value={selectedSkillId} onChange={event => setSelectedSkillId(event.target.value)}>
            {dropdownOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {!selectedSkillId && (
        <AllSkillsBarChart
          rows={skillRows}
          letterAssessment={letterAssessment}
          patternAssessment={patternAssessment}
        />
      )}
      {selectedSkillId === "el_letter" && (
        <ElSkillSummary
          title="EL: Letter Name & Sound"
          records={letterAssessment}
          getChecks={item => [item.knowsName, item.knowsSound]}
          getAccuracy={item => Math.round((((item.knowsName ? 1 : 0) + (item.knowsSound ? 1 : 0)) / 2) * 100)}
          getLabel={item => item.letter || ""}
        />
      )}
      {selectedSkillId === "el_pattern" && (
        <ElSkillSummary
          title="EL: Advanced Phonics"
          records={patternAssessment}
          getChecks={item => [item.soundCorrect, item.wordCorrect]}
          getAccuracy={item => Math.round((((item.soundCorrect ? 1 : 0) + (item.wordCorrect ? 1 : 0)) / 2) * 100)}
          getLabel={item => item.pattern || ""}
        />
      )}
      {selectedRow && <SkillLineChart row={selectedRow} />}
      {selectedRow && <CheckpointAttemptReview attempts={selectedAttempts} row={selectedRow} />}
    </div>
  );
}

function CheckpointAttemptReview({ attempts = [], row }) {
  if (!attempts.length) return null;
  const passRule = getPassRule(row.label);

  return (
    <div className="checkpoint-attempt-review">
      <h3>Checkpoint question review</h3>
      <p className="checkpoint-attempt-review-note">
        {passRule.text} questions correct to pass {row.label}. Open an attempt to see every question asked.
      </p>
      {attempts.map((attempt, index) => {
        const reviewRows = buildAttemptReviewRows(attempt);
        const rollupRows = buildQuestionRollup(attempt.questionRecords || []);
        const attemptDate = attempt.completedAt
          ? new Date(attempt.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
          : "Date not recorded";
        return (
          <details className="checkpoint-attempt-details" key={attempt.attemptId || `${attempt.completedAt}-${index}`}>
            <summary className="checkpoint-attempt-summary">
              <span>Attempt {index + 1} · {attemptDate}</span>
              <span className={attempt.passed ? "attempt-outcome passed" : "attempt-outcome not-passed"}>
                {attempt.correctCount}/{attempt.totalQuestions} correct · {attempt.passed ? "Passed" : "Not passed"}
              </span>
            </summary>
            <div className="checkpoint-attempt-body">
              {shouldShowRollup(rollupRows) && (
                <ul className="checkpoint-rollup">
                  {rollupRows.map(group => (
                    <li className={group.missed ? "rollup-missed" : "rollup-clear"} key={group.key}>
                      {group.summary}
                    </li>
                  ))}
                </ul>
              )}
              {reviewRows.length ? (
                <table className="checkpoint-attempt-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Question</th>
                      <th>Student answer</th>
                      <th>Correct answer</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewRows.map(question => (
                      <tr className={question.isCorrect ? "attempt-row-correct" : "attempt-row-missed"} key={question.order}>
                        <td>{question.order}</td>
                        <td>{question.prompt}</td>
                        <td>{question.selectedAnswer || "No answer recorded"}</td>
                        <td>{question.correctAnswer || "Not recorded"}</td>
                        <td>{question.isCorrect ? "Correct" : "Missed"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="checkpoint-attempt-empty">
                  Per-question detail was not recorded for this attempt (older attempts saved only the total score).
                </p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function AllSkillsBarChart({ rows = [], letterAssessment = [], patternAssessment = [] }) {
  const formatLevelCoverage = row => {
    const l1 = row.coverageLevel1 || row.coverage?.level1 || { mastered: 0, total: row.coverage?.total || 0 };
    const l2 = row.coverageLevel2 || row.coverage?.level2 || { mastered: 0, total: 0 };
    if (!l2.total) return `L1 ${l1.mastered || 0}/${l1.total || 0}`;
    return `L1 ${l1.mastered || 0}/${l1.total || 0} · L2 ${l2.mastered || 0}/${l2.total || 0}`;
  };

  return (
    <div className="growth-all-skills-chart">
      <div className="growth-all-skills-key">
        <span className="growth-key-item level-one">Level 1 mastery</span>
        <span className="growth-key-item level-two">Level 2 mastery</span>
      </div>
      <div className="growth-bar-list" role="list">
        {rows.map(row => {
          const hasData = (row.checkpointHistory || []).length > 0 || row.attempts > 0 || (row.coverage?.mastered || 0) > 0;
          const l1 = row.coverageLevel1 || row.coverage?.level1 || { mastered: 0, total: row.coverage?.total || 0 };
          const l2 = row.coverageLevel2 || row.coverage?.level2 || { mastered: 0, total: 0 };
          const hasLevel2 = (l2.total || 0) > 0;
          const level1Width = hasLevel2
            ? clampPercent(((l1.mastered || 0) / Math.max(1, l1.total || 0)) * 50)
            : clampPercent(((l1.mastered || 0) / Math.max(1, l1.total || 0)) * 100);
          const level2Width = hasLevel2
            ? clampPercent(((l2.mastered || 0) / Math.max(1, l2.total || 0)) * 50)
            : 0;
          const coverageLabel = formatLevelCoverage(row);
          return (
            <div
              className={`growth-bar-row${hasData ? "" : " not-started"}`}
              key={row.skillId}
              role="listitem"
              aria-label={`${row.label}: ${hasData ? coverageLabel : "not started"}`}
            >
              <span className="growth-bar-label" title={row.label}>
                {row.index + 1}. {row.label}
              </span>
              <div className="growth-bar-track">
                {hasLevel2 && <span className="growth-bar-midpoint" aria-hidden="true" />}
                <div
                  className="growth-bar-fill growth-bar-fill-l1"
                  style={{
                    width: hasData ? `${level1Width}%` : "0%"
                  }}
                />
                {hasLevel2 && (
                  <div
                    className="growth-bar-fill growth-bar-fill-l2"
                    style={{
                      left: "50%",
                      width: hasData ? `${level2Width}%` : "0%"
                    }}
                  />
                )}
                <span className="growth-bar-pct">{hasData ? coverageLabel : "Not started"}</span>
              </div>
            </div>
          );
        })}
        {(() => {
          const letterChecks = buildElChecksSummary(letterAssessment, item => [item.knowsName, item.knowsSound]);
          const pct = letterChecks.percent;
          const hasData = letterAssessment.length > 0;
          return (
            <div
              key="el-letter-growth-bar"
              className={`growth-bar-row${hasData ? "" : " not-started"}`}
              role="listitem"
              aria-label={`EL: Letter Name & Sound: ${hasData ? `${pct}%` : "not assessed"}`}
            >
              <span className="growth-bar-label">EL: Letter Name & Sound</span>
              <div className="growth-bar-track">
                <div
                  className="growth-bar-fill"
                  style={{
                    width: hasData ? `${pct}%` : "0%",
                    background: hasData ? "#2563EB" : "#e5e7eb"
                  }}
                />
                <span className="growth-bar-pct">{hasData ? `${pct}%` : "Not assessed"}</span>
              </div>
            </div>
          );
        })()}
        {(() => {
          const patternChecks = buildElChecksSummary(patternAssessment, item => [item.soundCorrect, item.wordCorrect]);
          const pct = patternChecks.percent;
          const hasData = patternAssessment.length > 0;
          return (
            <div
              key="el-pattern-growth-bar"
              className={`growth-bar-row${hasData ? "" : " not-started"}`}
              role="listitem"
              aria-label={`EL: Advanced Phonics: ${hasData ? `${pct}%` : "not assessed"}`}
            >
              <span className="growth-bar-label">EL: Advanced Phonics</span>
              <div className="growth-bar-track">
                <div
                  className="growth-bar-fill"
                  style={{
                    width: hasData ? `${pct}%` : "0%",
                    background: hasData ? "#7C3AED" : "#e5e7eb"
                  }}
                />
                <span className="growth-bar-pct">{hasData ? `${pct}%` : "Not assessed"}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function SkillLineChart({ row }) {
  const points = row.checkpointHistory || [];
  if (!points.length) {
    return <div className="student-report-muted-card">No checkpoint rounds recorded for {row.label} yet.</div>;
  }

  const width = 700;
  const height = 230;
  const left = 54;
  const right = 18;
  const top = 24;
  const bottom = 50;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxX = Math.max(1, points.length - 1);
  const color = row.skillAreaColor || "#0C6B65";
  const line = points.map((point, index) => {
    const x = left + (points.length === 1 ? plotWidth / 2 : (index / maxX) * plotWidth);
    const y = top + (1 - clampPercent(point.accuracy) / 100) * plotHeight;
    const attemptDate = point.date
      ? new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : null;
    return {
      ...point,
      x,
      y,
      label: `Attempt ${index + 1}`,
      sublabel: attemptDate || ""
    };
  });
  const path = line.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const first = line[0];
  const latest = line.at(-1);
  const delta = clampPercent(latest.accuracy) - clampPercent(first.accuracy);

  return (
    <div className="student-report-growth-card">
      <div className="growth-card-top">
        <p><strong>{row.label}</strong> - {points.length} checkpoint attempt{points.length === 1 ? "" : "s"}</p>
        <span className={`growth-delta ${delta >= 0 ? "positive" : "negative"}`}>
          {delta >= 0 ? "+" : ""}{delta}% since first round
        </span>
      </div>
      <svg className="student-report-growth-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${row.label} checkpoint accuracy`}>
        {[100, 80, 60, 40, 20].map(value => {
          const y = top + (1 - value / 100) * plotHeight;
          return (
            <g key={value}>
              <text x={left - 8} y={y + 5} textAnchor="end">{value}%</text>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#e2e8f0" />
            </g>
          );
        })}
        {line.map((point, index) => (
          <g key={`xlabel-${index}`}>
            <text x={point.x} y={height - 20} textAnchor="middle" className="growth-axis-label">{point.label}</text>
            {point.sublabel && (
              <text x={point.x} y={height - 6} textAnchor="middle" className="growth-axis-sublabel">{point.sublabel}</text>
            )}
          </g>
        ))}
        <path d={path} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: color }} />
        {line.map((point, index) => (
          <circle
            key={`${point.label}-dot-${index}`}
            cx={point.x}
            cy={point.y}
            r="6"
            style={{ fill: point.passed ? color : "#fff", stroke: color, strokeWidth: 2 }}
          >
            <title>{`${point.label}: ${point.accuracy}% (${point.score})${point.passed ? " passed" : ""}`}</title>
          </circle>
        ))}
      </svg>
      <p className="growth-summary">
        {row.label}: {first.accuracy}% on attempt 1
        {points.length > 1 ? ` → ${latest.accuracy}% on attempt ${points.length}` : " (1 attempt recorded so far)"}
        {latest.passed ? " — checkpoint passed" : ""}
      </p>
    </div>
  );
}

function ElSkillSummary({ title, records = [], getAccuracy, getChecks, getLabel }) {
  if (!records.length) {
    return <div className="student-report-muted-card">No {title} data recorded yet.</div>;
  }
  // One convention everywhere: the headline percent counts checks correct out
  // of checks asked (same numerator/denominator as the EL cards and bars).
  const checks = buildElChecksSummary(records, getChecks || (item => [getAccuracy(item) >= 100]));

  return (
    <div className="growth-el-summary-card">
      <div className="growth-card-top">
        <p><strong>{title}</strong> - {records.length} items assessed</p>
        <span className="growth-delta positive">{checks.percent}% ({checks.checksCorrect}/{checks.checksTotal} checks)</span>
      </div>
      <div className="growth-el-item-grid" role="list">
        {records.map((item, index) => {
          const accuracy = getAccuracy(item);
          const label = getLabel(item);
          return (
            <div
              key={`${label}-${index}`}
              className={`growth-el-item ${accuracy >= 100 ? "correct" : accuracy >= 50 ? "partial" : "incorrect"}`}
              role="listitem"
              title={`${label}: ${accuracy}%`}
            >
              {label}
            </div>
          );
        })}
      </div>
      <p className="growth-summary muted-text">{checks.fullyCorrectCount} of {records.length} items fully correct.</p>
    </div>
  );
}

function LearnedSection({ correctWordRows, model }) {
  const mastered = model.itemGroups.mastered || [];
  const hfwAssessmentWords = mastered
    .filter(row => row.itemType === "sight_word")
    .map(row => row.label || row.itemKey)
    .filter(Boolean);
  const guidedReadingCorrectWords = correctWordRows.map(row => row.word).filter(Boolean);
  const allSightWords = Array.from(new Set([...hfwAssessmentWords, ...guidedReadingCorrectWords]))
    .sort((a, b) => a.localeCompare(b));
  const sounds = mastered.filter(row =>
    row.itemType === "initial_sound" ||
    row.itemType === "final_sound" ||
    row.itemType === "rhyming_family" ||
    row.itemType === "short_vowel" ||
    row.itemType === "letter_sound" ||
    row.itemType === "phonics_pattern"
  );
  const letterNames = mastered.filter(row => row.itemType === "letter_name");
  const soundsAndLetterNames = [...sounds, ...letterNames];

  return (
    <div className="student-report-learned-grid">
      <article className="student-report-learned-card words">
        <h3>Sight Words Mastered ({allSightWords.length})</h3>
        <ChipTextList items={allSightWords} limit={Infinity} />
      </article>
      <article className="student-report-learned-card sounds">
        <h3>Sounds / Letter Names Mastered ({soundsAndLetterNames.length})</h3>
        <SoundsProgressChart sounds={sounds} letterNames={letterNames} />
        <ChipTextList items={soundsAndLetterNames.map(row => row.label || row.itemKey)} limit={Infinity} />
      </article>
      <article className="student-report-learned-card mastered">
        <h3>Guided Reading — Words Read Correctly (recent books)</h3>
        <ChipTextList
          items={correctWordRows.map(row => `${row.word} (${row.title}, p.${row.page})`)}
          limit={Infinity}
        />
      </article>
    </div>
  );
}

function SoundsProgressChart({ sounds = [], letterNames = [] }) {
  // Real denominators: distinct assessable items per type, generated from the
  // live question banks (tools/generateItemUniverse.js). The old hardcoded
  // 25 / max(n+5, 26) constants meant Level 2 could never reach 100%.
  const progress = buildSoundsProgress([...sounds, ...letterNames], itemUniverseCounts);

  return (
    <div className="sounds-progress-chart" aria-label="Sounds mastery by level">
      <div className="sounds-progress-row">
        <span className="sounds-progress-label">Level 1 Sounds</span>
        <div className="sounds-progress-track">
          <div
            className="sounds-progress-fill level1"
            style={{ width: `${progress.level1.percent}%` }}
            aria-label={`${progress.level1.mastered} of ${progress.level1.total} Level 1 sounds mastered`}
          />
        </div>
        <span className="sounds-progress-count">{progress.level1.mastered}/{progress.level1.total}</span>
      </div>
      <div className="sounds-progress-row">
        <span className="sounds-progress-label">Level 2 Sounds / Letter Names</span>
        <div className="sounds-progress-track">
          <div
            className="sounds-progress-fill level2"
            style={{ width: `${progress.level2.percent}%` }}
            aria-label={`${progress.level2.mastered} of ${progress.level2.total} Level 2 items mastered`}
          />
        </div>
        <span className="sounds-progress-count">{progress.level2.mastered}/{progress.level2.total}</span>
      </div>
    </div>
  );
}

function ChipTextList({ items = [], limit = Infinity }) {
  const list = normaliseList(items);
  const visible = list.slice(0, limit);
  return (
    <p className="student-report-chip-text">
      {visible.length ? visible.map(item => <span key={item}>{item}</span>) : <em>None recorded yet</em>}
      {list.length > visible.length && <strong>+{list.length - visible.length} more</strong>}
    </p>
  );
}

function getTeachingNote(row, recommendations = {}) {
  const match = (recommendations.focusItems || []).find(item =>
    item.itemType === row.itemType && item.itemKey === row.itemKey
  );
  if (match?.teachingNote) return match.teachingNote;
  const examples = normaliseList([...(row.missedExamples || []), ...(row.examples || [])]).slice(0, 4);
  return examples.length
    ? `Practise with ${examples.join(", ")}.`
    : `Practise ${row.label || formatItemLabel(row.itemType, row.itemKey)} in a short mixed review.`;
}

function SupportSection({ model }) {
  const rows = (model.itemGroups.needsSupport || [])
    .filter(row => row.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || a.label.localeCompare(b.label))
    .slice(0, 15);

  if (!rows.length) {
    return <div className="student-report-muted-card">No items below 60% accuracy are currently recorded.</div>;
  }

  return (
    <div className="student-report-support-table-wrap">
      <table className="student-report-support-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Skill Area</th>
            <th>Score</th>
            <th>Teaching Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const area = getSkillArea({ skillId: row.skillId, skillName: row.skillName });
            return (
              <tr key={`${row.itemType}-${row.itemKey}`}>
                <td>{row.label}</td>
                <td>{area.label} — {row.skillName}</td>
                <td><strong>{row.correct}/{row.attempts} · {row.accuracy}%</strong></td>
                <td>{getTeachingNote(row, model.recommendations)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GuidedReadingSummaryPanel({ rows = [] }) {
  if (!rows.length) return null;
  const summary = buildGuidedReadingSummary(rows);
  const mostRecentDate = summary.mostRecent?.lastReadAt
    ? new Date(summary.mostRecent.lastReadAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="guided-reading-summary" aria-label="Guided reading summary">
      <span className="guided-reading-summary-chip">Books completed: {summary.totalCompleted}</span>
      {summary.byLevel.map(item => (
        <span className="guided-reading-summary-chip" key={item.level}>Level {item.level}: {item.count}</span>
      ))}
      {summary.mostRecent && (
        <span className="guided-reading-summary-chip recent">
          Most recent: {summary.mostRecent.title}{mostRecentDate ? ` (${mostRecentDate})` : ""}
        </span>
      )}
    </div>
  );
}

function GuidedReadingSection({ guidedReadingReportRows, storyQuestRawProgress = {}, storyQuestSummary }) {
  const storyRows = storyQuestSummary.rows || [];
  const storyWords = normaliseList(storyRows.flatMap(row => row.words || [])).sort((a, b) => a.localeCompare(b));
  const starTotals = summarizeStoryQuestStars(storyRows, storyQuestRawProgress);

  return (
    <div className="student-report-reading-stack">
      <GuidedReadingSummaryPanel rows={guidedReadingReportRows} />
      {guidedReadingReportRows.length ? (
        <div className="student-report-reading-table-wrap">
          <table className="student-report-reading-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Level</th>
                <th>Reads</th>
                <th>Accuracy</th>
                <th>Quiz</th>
                <th>Support Words</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {guidedReadingReportRows.slice(0, 8).map(row => (
                <tr key={row.bookId}>
                  <td>{row.title}</td>
                  <td>{row.level || "—"}</td>
                  <td>{row.readCount}</td>
                  <td className={row.latestAccuracy >= 80 ? "score-good" : row.latestAccuracy >= 60 ? "score-mid" : "score-low"}>
                    {row.latestAccuracy || 0}%
                  </td>
                  <td>{row.quizTotal ? `${row.quizScore}/${row.quizTotal}` : "—"}</td>
                  <td>{row.supportWords.length ? row.supportWords.slice(0, 8).join(", ") : "none"}</td>
                  <td>{row.notes[0]?.note || "No notes recorded."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="student-report-muted-card">No guided reading record saved yet.</div>
      )}

      <article className="story-vocabulary-card">
        <h3>Story Quest — Vocabulary Collected</h3>
        {storyRows.length ? (
          <>
            <p className="story-star-totals">
              Stars recorded: {starTotals.recordedStars}
              {starTotals.completedWithoutStars > 0 && (
                <span className="story-star-note">
                  {" "}· {starTotals.completedWithoutStars} completed quest{starTotals.completedWithoutStars === 1 ? "" : "s"} without recorded stars (not counted)
                </span>
              )}
            </p>
            {storyRows.slice(0, 3).map(row => (
              <p key={row.questId}>
                <strong>{row.title}</strong> · {getStoryQuestStarInfo(row, storyQuestRawProgress?.[row.questId] || {}).display} · {row.status}
              </p>
            ))}
            <ChipTextList items={storyWords} limit={40} />
          </>
        ) : (
          <p>No Story Quest vocabulary collected yet.</p>
        )}
      </article>
    </div>
  );
}

function EngagementSection({ row }) {
  if (!row) return null;
  if (!hasEngagementSignal(row)) {
    return (
      <div className="student-report-muted-card">
        No engagement activity recorded on this device yet. Missions, games, coins, and reading
        activity will appear here once the student uses the learning areas.
      </div>
    );
  }
  const formatDay = value => {
    if (!value) return "No activity yet";
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : String(value);
  };
  const metrics = [
    ["Daily mission streak", `${row.missionStreak} day${row.missionStreak === 1 ? "" : "s"}`],
    ["Games played", row.gamesPlayed],
    ["Game stars", row.gameStars],
    ["Sound Seekers stars", row.soundSeekerStars],
    ["Story quests completed", row.storyQuestsCompleted],
    ["Books read", row.booksRead],
    ["Coins earned", row.coinsEarned],
    ["Coins spent", row.coinsSpent],
    ["Coins balance", row.coinsBalance],
    ["Last active", formatDay(row.lastActiveAt)]
  ];

  return (
    <div className="report-engagement-grid" aria-label="Engagement summary">
      {metrics.map(([label, value]) => (
        <article className="report-engagement-card" key={label}>
          <span className="report-engagement-label">{label}</span>
          <strong className="report-engagement-value">{value}</strong>
        </article>
      ))}
    </div>
  );
}

function SoundSeekersSection({ report }) {
  if (!report || (!report.stopsCompleted && !report.attempts && !report.sessions)) {
    return <div className="student-report-muted-card">No Sound Seekers journey has been recorded yet.</div>;
  }
  return (
    <div className="report-quest-summary">
      <div className="report-engagement-grid" aria-label="Sound Seekers summary">
        {[
          ["Trails completed", `${report.stopsCompleted} of ${report.stopsTotal}`],
          ["Got it", report.buckets?.gotIt ?? report.stonesLit],
          ["Almost there", report.buckets?.almostThere ?? "-"],
          ["Needs re-teaching", report.buckets?.needsReteaching ?? "-"],
          ["Time on task", report.timeOnTask],
          ["Accuracy", report.accuracy == null ? "Not enough evidence" : `${report.accuracy}% across ${report.attempts} responses`],
          ["Response pace", report.interaction?.responses
            ? `${(report.interaction.averageResponseMs / 1000).toFixed(1)} sec average`
            : "Not enough evidence"],
          ["Timing retries", report.interaction?.motorRetries ?? 0],
          ["Guided teach-backs", report.interaction?.teachBacks ?? 0],
          ["Pacing adjustments", report.interaction?.pacingAdaptations
            ? `${report.interaction.pacingAdaptations} (${report.interaction.deferredBeats} prompts saved for review)`
            : "None needed"],
          ["Practice journeys", report.reviewSessions
            ? `${report.reviewSessions} reviews · ${report.shortcutSessions || 0} earned shortcuts`
            : "No review journeys recorded"],
          ["Exploration", report.interaction?.optionalRouteVisits || report.interaction?.optionalDiscoveries || report.interaction?.restoredFriendsMet
            ? `${report.interaction.optionalRouteVisits} side routes · ${report.interaction.optionalDiscoveries} discoveries · ${report.interaction.restoredFriendsMet} returning friends`
            : "No optional visits recorded"],
          ["Accessible play", report.interaction?.accessibleSessions
            ? `${report.interaction.accessibleSessions} sessions · ${report.interaction.accessibleTimingSupports} timing barriers removed`
            : "No 2D sessions recorded"]
        ].map(([label, value]) => (
          <article className="report-engagement-card" key={label}>
            <span className="report-engagement-label">{label}</span>
            <strong className="report-engagement-value">{value}</strong>
          </article>
        ))}
      </div>
      <div className="report-quest-focus">
        <h3>Reading and control evidence</h3>
        <p><strong>{report.interaction?.evidenceStrength || "Early evidence"}.</strong> {report.interaction?.nextAction}</p>
        <p>{report.interaction?.interpretation || "More play is needed before separating sound knowledge from control difficulty."}</p>
        {report.interaction?.responses > 0 && (
          <p>
            {report.interaction.responses} physical choices · {report.interaction.correctionMisses} sound-choice corrections · {report.interaction.motorRetries} timing retries · {report.interaction.trailFinds} trail finds
          </p>
        )}
      </div>
      {(report.runtime?.sceneStarts > 0
        || report.runtime?.fallbackSessions > 0
        || report.runtime?.networkInterruptions > 0
        || report.runtime?.offlineShellReady) && (
        <div className="report-quest-focus">
          <h3>Device experience</h3>
          <p>
            {report.runtime.sceneStarts > 0
              ? `${(report.runtime.averageSceneLoadMs / 1000).toFixed(1)} sec average adventure start · ${report.runtime.slowSceneStarts} slow starts`
              : "No measured adventure starts"}
            {` · ${report.runtime.fallbackSessions} automatic 2D fallbacks · ${report.runtime.contextLosses} graphics interruptions`}
          </p>
          {report.runtime.networkInterruptions > 0 && (
            <p>
              {report.runtime.networkInterruptions} connection {report.runtime.networkInterruptions === 1 ? "interruption" : "interruptions"}
              {` · ${report.runtime.syncRecoveries} recovered cloud ${report.runtime.syncRecoveries === 1 ? "save" : "saves"}`}
              {report.runtime.syncPending ? " · Latest progress is safe on this device and waiting to sync" : " · Latest progress is synced"}
            </p>
          )}
          {report.runtime.offlineShellReady && (
            <>
              <p>
                Offline play ready
                {` · ${report.runtime.offlineWarmups} chapter ${report.runtime.offlineWarmups === 1 ? "cache" : "caches"} prepared`}
                {` · ${report.runtime.offlineColdStarts} cold offline ${report.runtime.offlineColdStarts === 1 ? "start" : "starts"}`}
                {report.runtime.offlineWarmupFailures > 0
                  ? ` · ${report.runtime.offlineWarmupFailures} asset cache failures`
                  : " · No asset cache failures"}
              </p>
              {(report.runtime.offlineUpdates > 0 || report.runtime.offlineUpdatesApplied > 0) && (
                <p>
                  {`${report.runtime.offlineUpdates} app ${report.runtime.offlineUpdates === 1 ? "update" : "updates"} prepared after play`}
                  {` · ${report.runtime.offlineUpdatesApplied} applied safely`}
                </p>
              )}
            </>
          )}
          {report.runtime.offlineShellErrors > 0 && (
            <p>{report.runtime.offlineShellErrors} offline shell {report.runtime.offlineShellErrors === 1 ? "error" : "errors"} recorded</p>
          )}
        </div>
      )}
      <div className="report-quest-focus">
        <h3>Adaptive review focus</h3>
        {report.weakest.length ? (
          <ul>
            {report.weakest.map(row => (
              <li key={row.target}>
                <strong>{row.target}</strong>
                <span>{Math.round(row.accuracy * 100)}% across {row.seen} responses · {String(row.state || "learning").replace("-", " ")}</span>
              </li>
            ))}
          </ul>
        ) : <p>More responses are needed before an adaptive review focus can be identified.</p>}
      </div>

      {/* Every sound on the trail, in teaching order — the same honest heat
          map the teacher sees, so home and school read one picture. */}
      {report.heat?.length > 0 && (
        <div className="report-quest-focus report-quest-heat">
          <h3>Every sound, one tile each</h3>
          <p className="report-heat-key" aria-hidden="true">
            <em className="is-got-it">Got it</em>
            <em className="is-almost">Almost there</em>
            <em className="is-reteach">Needs re-teaching</em>
            <em className="is-unseen">Not met yet</em>
          </p>
          <div className="quest-heat-grid is-compact" role="img" aria-label={
            `Sound map: ${report.buckets?.gotIt ?? 0} got it, ${report.buckets?.almostThere ?? 0} almost there, ${report.buckets?.needsReteaching ?? 0} need re-teaching.`
          }>
            {report.heat.map(tile => (
              <span
                key={tile.id}
                className={`quest-heat-tile is-${tile.bucket}`}
                title={`${tile.label} · ${tile.bucket === "unseen" ? "not met yet" : `${tile.accuracy}% over ${tile.seen} response${tile.seen === 1 ? "" : "s"}`}`}
              >
                {tile.label}
              </span>
            ))}
          </div>
          {report.assignment && (
            <p className="report-heat-assignment">
              Practice set by the teacher: <strong>{report.assignment.targets.join(", ")}</strong>
              {report.assignment.note ? ` — ${report.assignment.note}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NextSessionPlan({ model }) {
  return (
    <div className="student-report-next-grid lg-next-plan">
      <article className="student-report-next-card recommended lg-plan-card lg-plan-card-focus">
        <h3>Recommended Focus</h3>
        <h4>{model.recommendations.recommendedSkill}</h4>
        <p>{model.recommendations.reason}</p>
        <strong>Focus items:</strong>
        {(model.recommendations.focusItems || []).slice(0, 3).map(item => (
          <p key={`${item.itemType}-${item.itemKey}`}><b>{item.label}</b> — {item.teachingNote}</p>
        ))}
        {!model.recommendations.focusItems?.length && <p>Start with a short checkpoint to gather fresh evidence.</p>}
      </article>
      <article className="student-report-next-card quick lg-plan-card lg-plan-card-wins">
        <h3>Quick Wins ✓</h3>
        {(model.recommendations.quickWins || []).length ? (
          <ul>{model.recommendations.quickWins.map(item => <li key={item}>{item}</li>)}</ul>
        ) : (
          <p>No quick wins recorded yet.</p>
        )}
      </article>
      <article className="student-report-next-card caution lg-plan-card lg-plan-card-flags">
        <h3>Caution Flags !</h3>
        {(model.recommendations.cautionFlags || []).length ? (
          <ul>{model.recommendations.cautionFlags.map(item => <li key={item}>{item}</li>)}</ul>
        ) : (
          <p>No caution flags at this time.</p>
        )}
      </article>
    </div>
  );
}

export function FinishedReportPage({
  startAssessment,
  studentName,
  className = "",
  totalAnswered,
  accuracy,
  currentStage,
  currentSkillIndex,
  skillTree,
  currentStageQuestions,
  mastery,
  coverageSnapshot,
  skillMasterySummary = [],
  itemMastery = {},
  assessmentHistory = [],
  exportCSVData,
  letterAssessment = [],
  patternAssessment = [],
  guidedReadingRecords = {},
  storyQuestProgressScopeKey = "default",
  // Optional; wired in App.jsx by Benjamin (pass progressScopeKey={studentId || studentName}).
  progressScopeKey = "",
  returnToTeacherDashboard
}) {
  const [guidedReadingReportRows, setGuidedReadingReportRows] = useState([]);
  const [guidedReadingWordRows, setGuidedReadingWordRows] = useState([]);
  const hasGuidedReadingRecords = Object.keys(guidedReadingRecords || {}).length > 0;
  const activeGuidedReadingReportRows = hasGuidedReadingRecords ? guidedReadingReportRows : EMPTY_REPORT_ROWS;
  const activeGuidedReadingWordRows = hasGuidedReadingRecords ? guidedReadingWordRows : EMPTY_REPORT_ROWS;
  const storyQuestRawProgress = useMemo(
    () => loadStoryQuestProgress(storyQuestProgressScopeKey),
    [storyQuestProgressScopeKey]
  );
  const storyQuestSummary = useMemo(
    () => summarizeStoryQuestProgress(storyQuestRawProgress, storyQuests),
    [storyQuestRawProgress]
  );
  const engagementRow = useMemo(() => {
    if (!progressScopeKey) return null;
    // Same per-student localStorage areas the Excel exports read.
    const areas = collectStudentEngagementAreas({ id: progressScopeKey });
    return buildEngagementRow({ studentName, studentId: progressScopeKey, className, areas });
  }, [progressScopeKey, studentName, className]);
  const soundSeekersReport = useMemo(() => {
    if (!progressScopeKey) return null;
    const areas = collectStudentEngagementAreas({ id: progressScopeKey });
    return buildQuestMasteryReport(areas.soundSeekers || {});
  }, [progressScopeKey]);

  useEffect(() => {
    if (!hasGuidedReadingRecords) return undefined;

    let cancelled = false;
    importWithRetry(() => import("../data/guidedReadingBooks")).then(module => {
      if (!cancelled) {
        setGuidedReadingReportRows(buildGuidedReadingReportRows(guidedReadingRecords, module));
        setGuidedReadingWordRows(module.getGuidedReadingWordStatusRows?.(guidedReadingRecords) || []);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [guidedReadingRecords, hasGuidedReadingRecords]);

  const model = useMemo(() => buildStudentReportModel({
    studentName,
    className,
    totalAnswered,
    accuracy,
    currentStage,
    currentSkillIndex,
    skillTree,
    currentStageQuestions,
    mastery,
    coverageSnapshot,
    skillMasterySummary,
    itemMastery,
    assessmentHistory,
    guidedReadingReportRows: activeGuidedReadingReportRows,
    storyQuestSummary
  }), [
    studentName,
    className,
    totalAnswered,
    accuracy,
    currentStage,
    currentSkillIndex,
    skillTree,
    currentStageQuestions,
    mastery,
    coverageSnapshot,
    skillMasterySummary,
    itemMastery,
    assessmentHistory,
    activeGuidedReadingReportRows,
    storyQuestSummary
  ]);

  const elCards = useMemo(() => buildElAssessmentCards({
    letterAssessment,
    patternAssessment
  }), [letterAssessment, patternAssessment]);
  const correctWordRows = activeGuidedReadingWordRows.filter(row => row.status === "Read Correctly");
  const generatedDate = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="student-report-shell">
      <ReportActions
        exportCSVData={exportCSVData}
        returnToTeacherDashboard={returnToTeacherDashboard}
        startAssessment={startAssessment}
      />

      <article className="student-report-document" aria-label={`Individual student report for ${model.snapshot.studentName}`}>
        <div className="student-report-page-top">
          <span>Literacy Guide · Individual Student Report</span>
          <span>{model.snapshot.studentName} · {formatClassLabel(model.snapshot.className)}</span>
        </div>

        <header className="student-report-hero lg-student-header">
          <div>
            <span>Individual Student Report</span>
            <h1 className="lg-student-header-name">{model.snapshot.studentName}</h1>
            <p className="lg-student-header-sub">{formatClassLabel(model.snapshot.className)} · Generated {generatedDate}</p>
          </div>
        </header>

        <StatusCallout snapshot={model.snapshot} />

        <SectionBand title="Student Snapshot" subtitle="Key metrics at a glance" />
        <SnapshotGrid model={model} skillTotal={skillTree.length} />

        <SectionBand title="EL Assessments" subtitle="Formal early literacy assessment results" accent="#2563EB" />
        <ElAssessmentSection cards={elCards} />

        <SectionBand title="Skill-Set Assessments" subtitle="Checkpoint results across all assessed skill areas" />
        <SkillSetSection mastery={mastery} rows={model.skillMapRows} />

        <SectionBand title="Growth Over Time" subtitle="Default view shows all skills. Use the dropdown to view checkpoint progress and the per-question review for a specific skill." />
        <GrowthSection
          assessmentHistory={assessmentHistory}
          model={model}
          letterAssessment={letterAssessment}
          patternAssessment={patternAssessment}
        />

        <SectionBand title="Words, Sounds & Skills Learned" subtitle="Items at Mastered level only" accent="#16A34A" />
        <LearnedSection correctWordRows={correctWordRows} model={model} />

        <SectionBand title="Areas Needing Support" subtitle="Items below 60% accuracy — prioritised by widest gap" accent="#DC2626" />
        <SupportSection model={model} />

        <SectionBand title="Guided Reading & Story Quest" subtitle="Book completion by level, quiz scores, conference notes, and vocabulary" accent="#16A34A" />
        <GuidedReadingSection
          guidedReadingReportRows={activeGuidedReadingReportRows}
          storyQuestRawProgress={storyQuestRawProgress}
          storyQuestSummary={storyQuestSummary}
        />

        {progressScopeKey && (
          <>
            <SectionBand title="Sound Seekers" subtitle="Journey progress, phonics mastery, adaptive review focus, and time on task" accent="#0F766E" />
            <SoundSeekersSection report={soundSeekersReport} />
          </>
        )}

        {progressScopeKey && (
          <>
            <SectionBand title="Engagement" subtitle="Daily missions, games, coins, and reading activity saved on this device" accent="#7C3AED" />
            <EngagementSection row={engagementRow} />
          </>
        )}

        <SectionBand title="Next Session Plan" subtitle={`Recommended focus for ${model.snapshot.studentName}'s next teaching session`} />
        <NextSessionPlan model={model} />

        <footer className="student-report-footer">
          Generated by Literacy Guide · Report covers saved assessment sessions to {generatedDate} · For teacher use only
        </footer>
      </article>
    </div>
  );
}
