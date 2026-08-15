import { useMemo, useState } from "react";

import {
  buildSimpleHfwRows,
  buildSimpleOverview,
  buildSimpleSkillsRows,
  countSimpleRowsWithSavedResults
} from "../../data/simpleStudentReports.js";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { teacherReportText } from "./teacherReportCopy.jsx";

const BAND_MARKS = Object.freeze({
  unseen: "—",
  red: "!",
  orange: "~",
  green: "✓"
});

function displayLearningStatus(value = "") {
  if (["Yet to learn", "Not checked", "Not assessed"].includes(value)) {
    return "Not checked";
  }
  if (value === "Not enough yet") return "Not enough results";
  if (value === "Practising") return "Developing";
  return teacherReportText(value);
}

function ReportKey() {
  return (
    <div className="simple-report-legend" aria-label="Learning status key">
      <strong>Learning status</strong>
      <span className="green">Secure</span>
      <span className="orange">Developing</span>
      <span className="red">Needs support</span>
      <span className="unseen">Not enough results or not checked</span>
      <small>Answer accuracy is shown separately when enough scored answers are available.</small>
    </div>
  );
}

function AccuracyTile({ row }) {
  const scoreLabel = row.attempts > 0
    ? row.accuracy !== null
      ? `${Math.round(row.accuracy)}% accuracy`
      : "Not enough results"
    : row.hasAnyResults
      ? "No current results"
      : "Not checked";
  return (
    <article
      className={`simple-report-tile ${row.band}`}
      aria-label={`${row.displayLabel}: ${scoreLabel}`}
    >
      <div className="simple-report-tile-heading">
        <strong>{row.displayLabel}</strong>
        <span aria-hidden="true">{BAND_MARKS[row.band]}</span>
      </div>
      <p>{teacherReportText(row.sentence)}</p>
      {row.historySentence ? (
        <p className="simple-report-history">{teacherReportText(row.historySentence)}</p>
      ) : null}
      <footer>
        <span><strong>Answer accuracy:</strong> {scoreLabel}</span>
        <small><strong>Learning status:</strong> {displayLearningStatus(row.statusLabel)}</small>
        {row.whyNotSecure ? (
          <small className="simple-report-tile-why">{teacherReportText(row.whyNotSecure)}</small>
        ) : null}
      </footer>
    </article>
  );
}

function EmptySimpleReport({ actionLabel = "", children, onAction }) {
  return (
    <section className="simple-report-empty">
      <h2>No results yet</h2>
      <p>{children}</p>
      {onAction && actionLabel && (
        <button className="lp-button lp-button-primary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}

function SimpleResultCollection({
  rows,
  seenLabel,
  unseenLabel,
  previewSize = 24
}) {
  const [showAllSeen, setShowAllSeen] = useState(false);
  const [showAllUnseen, setShowAllUnseen] = useState(false);
  const seenRows = rows.filter(row => row.hasAnyResults);
  const unseenRows = rows.filter(row => !row.hasAnyResults);
  const visibleSeenRows = showAllSeen ? seenRows : seenRows.slice(0, previewSize);
  const visibleUnseenRows = showAllUnseen ? unseenRows : unseenRows.slice(0, previewSize);
  return (
    <>
      {seenRows.length ? (
        <>
          <section className="simple-report-grid" aria-label={seenLabel}>
            {visibleSeenRows.map(row => <AccuracyTile key={row.id} row={row} />)}
          </section>
          {seenRows.length > previewSize && (
            <button
              className="text-button simple-report-show-all"
              type="button"
              aria-expanded={showAllSeen}
              onClick={() => setShowAllSeen(value => !value)}
            >
              {showAllSeen
                ? TEACHER_COPY.common.showFewer
                : TEACHER_COPY.common.showAll(seenRows.length)}
            </button>
          )}
        </>
      ) : (
        <section className="simple-report-empty compact">
          <h2>{TEACHER_COPY.reports.noSavedResults}</h2>
          <p>{teacherReportText(TEACHER_COPY.reports.unseenHelp)}</p>
        </section>
      )}
      {unseenRows.length > 0 && (
        <details className="simple-report-unseen">
          <summary>{unseenLabel} ({unseenRows.length})</summary>
          <section className="simple-report-grid" aria-label={unseenLabel}>
            {visibleUnseenRows.map(row => <AccuracyTile key={row.id} row={row} />)}
          </section>
          {unseenRows.length > previewSize && (
            <button
              className="text-button simple-report-show-all"
              type="button"
              aria-expanded={showAllUnseen}
              onClick={() => setShowAllUnseen(value => !value)}
            >
              {showAllUnseen
                ? TEACHER_COPY.common.showFewer
                : TEACHER_COPY.common.showAll(unseenRows.length)}
            </button>
          )}
        </details>
      )}
    </>
  );
}

const OVERVIEW_PREVIEW_SIZE = 5;

function EvidenceHealthReview({ health = {} }) {
  const signals = Array.isArray(health.signals) ? health.signals : [];
  const state = ["review", "collect", "clear"].includes(health.state)
    ? health.state
    : "clear";
  return (
    <section
      className={`simple-report-evidence-health is-${state}`}
      aria-label="Results quality review"
    >
      <header>
        <div>
          <span>Results quality review</span>
          <h2>{health.label || "Results review clear"}</h2>
        </div>
        <p>{health.summary || "No result-quality warning was found in the results shown."}</p>
      </header>
      {signals.length > 0 && (
        <details>
          <summary>
            Why this needs attention ({signals.length} {signals.length === 1 ? "reason" : "reasons"})
          </summary>
          <ul>
            {signals.map(signal => (
              <li key={signal.id}>
                <strong>{signal.title}</strong>
                <p>{signal.detail}</p>
                <small><strong>Next:</strong> {signal.action}</small>
                {signal.labels?.length > 0 && (
                  <span>{signal.labels.join(" · ")}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
      <small className="simple-report-evidence-health-rule">
        This review never changes a learning status. Missing results are not a low result.
      </small>
    </section>
  );
}

// Every group shows the same coloured tile the Skills view uses, so a teacher
// sees the score, the status and the "why not secure" line without leaving the
// overview. Only the first few are drawn until asked, which is what kept the
// old flat list of 107 unreadable.
function OverviewGroup({ group }) {
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(Boolean(group.defaultOpen));
  const visibleRows = expanded ? group.rows : group.rows.slice(0, OVERVIEW_PREVIEW_SIZE);
  const hiddenCount = group.rows.length - visibleRows.length;
  return (
    <details
      className={`simple-report-group ${group.id}`}
      open={isOpen}
      onToggle={event => setIsOpen(event.currentTarget.open)}
    >
      <summary>{group.title} ({group.rows.length})</summary>
      <p className="simple-report-group-description">{group.description}</p>
      {group.rows.length ? (
        <>
          <section className="simple-report-grid" aria-label={group.title}>
            {visibleRows.map(row => <AccuracyTile key={row.id} row={row} />)}
          </section>
          {(hiddenCount > 0 || expanded) && (
            <button
              className="text-button simple-report-show-all"
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded(value => !value)}
            >
              {expanded
                ? TEACHER_COPY.common.showFewer
                : TEACHER_COPY.common.showAll(group.rows.length)}
            </button>
          )}
        </>
      ) : (
        <p>Nothing is in this group yet.</p>
      )}
    </details>
  );
}

export function SimpleOverviewReportView({
  workspace = {},
  studentName = "This student",
  onStartAssessment
}) {
  const overview = useMemo(
    () => buildSimpleOverview(workspace, studentName),
    [studentName, workspace]
  );
  const groups = [
    {
      id: "needs-teaching",
      title: teacherReportText(TEACHER_COPY.reports.needsTeachingTitle),
      description: teacherReportText(TEACHER_COPY.reports.needsTeachingDescription),
      rows: overview.needsTeaching,
      defaultOpen: true
    },
    {
      id: "practising",
      title: teacherReportText(TEACHER_COPY.reports.practisingTitle),
      description: teacherReportText(TEACHER_COPY.reports.practisingDescription),
      rows: overview.practising,
      defaultOpen: false
    },
    {
      id: "mastered",
      title: teacherReportText(TEACHER_COPY.reports.masteredTitle),
      description: teacherReportText(TEACHER_COPY.reports.masteredDescription),
      rows: overview.mastered,
      defaultOpen: false
    },
    {
      id: "not-enough-yet",
      title: teacherReportText(TEACHER_COPY.reports.notEnoughYetTitle),
      description: teacherReportText(TEACHER_COPY.reports.notEnoughYetDescription),
      rows: overview.notEnoughYet,
      defaultOpen: false
    },
    {
      id: "yet-to-learn",
      title: teacherReportText(TEACHER_COPY.reports.yetToLearnTitle),
      description: teacherReportText(TEACHER_COPY.reports.yetToLearnDescription),
      rows: overview.yetToLearn,
      defaultOpen: false
    }
  ];
  const descriptiveAssessments = workspace.wholeChild?.descriptiveAssessments || [];
  if (!overview.totalCount) {
    return (
      <EmptySimpleReport
        actionLabel="Start an assessment"
        onAction={onStartAssessment}
      >
        Complete an assessment to begin this report.
      </EmptySimpleReport>
    );
  }
  return (
    <div className="simple-report-stack">
      {workspace.wholeChild?.evidenceHealth && (
        <EvidenceHealthReview health={workspace.wholeChild.evidenceHealth} />
      )}
      <section className="simple-report-summary" aria-label="Learning overview">
        {groups.map(group => (
          <article className={group.id} key={group.id}>
            <span>{group.rows.length}</span>
            <h2>{group.title}</h2>
            <p>{group.description}</p>
          </article>
        ))}
      </section>
      <p className="simple-report-intro">
        {teacherReportText(TEACHER_COPY.reports.overviewReconcile(overview.checkedCount, overview.totalCount))}
      </p>
      <ReportKey />
      <section className="simple-report-groups">
        {groups.map(group => <OverviewGroup group={group} key={group.id} />)}
      </section>
      {descriptiveAssessments.length > 0 && (
        <section className="simple-report-descriptive-el" aria-label="Descriptive EL assessment results">
          <header>
            <h2>Descriptive EL assessment results</h2>
            <p>{teacherReportText(TEACHER_COPY.reports.descriptiveElHelp)}</p>
          </header>
          <ul>
            {descriptiveAssessments.map(assessment => (
              <li key={assessment.assessmentId || assessment.id || assessment.title}>
                <strong>{assessment.title || assessment.label}</strong>
                <span>{teacherReportText(assessment.resultLabel || "Result recorded")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function SimpleSkillsReportView({
  workspace = {},
  studentName = "This student",
  onStartAssessment
}) {
  const rows = useMemo(
    () => buildSimpleSkillsRows(workspace, studentName),
    [studentName, workspace]
  );
  const savedResultCount = countSimpleRowsWithSavedResults(rows);
  if (!rows.length) {
    return (
      <EmptySimpleReport
        actionLabel="Start a skills assessment"
        onAction={onStartAssessment}
      >
        Complete a skills assessment to add skill results.
      </EmptySimpleReport>
    );
  }
  return (
    <div className="simple-report-stack">
      <ReportKey />
      <p className="simple-report-intro">
        {teacherReportText(TEACHER_COPY.reports.skillsIntro(savedResultCount, rows.length))}
      </p>
      <SimpleResultCollection
        rows={rows}
        seenLabel={TEACHER_COPY.reports.skillsWithResults}
        unseenLabel={TEACHER_COPY.reports.skillsNotSeen}
      />
    </div>
  );
}

export function SimpleHfwReportView({
  workspace = {},
  studentName = "This student",
  onStartAssessment
}) {
  const rows = useMemo(
    () => buildSimpleHfwRows(workspace, studentName),
    [studentName, workspace]
  );
  const savedResultCount = countSimpleRowsWithSavedResults(rows);
  const constructLabels = {
    isolated_word_reading: "Reading words on their own",
    word_in_context: "Choosing words in a sentence",
    word_spelling: "Spelling words in a sentence"
  };
  const constructOrder = [
    "isolated_word_reading",
    "word_in_context",
    "word_spelling"
  ];
  const groups = constructOrder
    .map(construct => ({
      construct,
      title: constructLabels[construct],
      rows: rows.filter(row => row.construct === construct)
    }))
    .filter(group => group.rows.length > 0);
  return (
    <div className="simple-report-stack">
      <ReportKey />
      <p className="simple-report-intro">
        {teacherReportText(TEACHER_COPY.reports.hfwIntro(savedResultCount, rows.length))}
      </p>
      <section className="simple-report-hfw-groups" aria-label="High-frequency word results by task">
        {groups.map(group => (
          <details
            className="simple-report-hfw-group"
            key={group.construct}
            open={group.rows.some(row => row.hasAnyResults)}
          >
            <summary>
              {group.title}
              {" · "}
              {group.rows.filter(row => row.hasAnyResults).length} of {group.rows.length} checked
            </summary>
            <SimpleResultCollection
              rows={group.rows}
              seenLabel={`${group.title}: ${TEACHER_COPY.reports.hfwWithResults}`}
              unseenLabel={`${group.title}: ${TEACHER_COPY.reports.hfwNotSeen}`}
              previewSize={12}
            />
          </details>
        ))}
      </section>
      {savedResultCount === 0 && onStartAssessment && (
        <button
          className="lp-button lp-button-primary simple-report-start-action"
          type="button"
          onClick={onStartAssessment}
        >
          Start an assessment
        </button>
      )}
    </div>
  );
}
