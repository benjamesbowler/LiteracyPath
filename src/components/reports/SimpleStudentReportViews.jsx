import { useMemo } from "react";

import {
  buildSimpleHfwRows,
  buildSimpleOverview,
  buildSimpleSkillsRows
} from "../../data/simpleStudentReports.js";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";

const BAND_MARKS = Object.freeze({
  unseen: "—",
  red: "!",
  orange: "~",
  green: "✓"
});

function AccuracyLegend() {
  return (
    <div className="simple-report-legend" aria-label="Accuracy colour key">
      <span className="unseen">Grey · not seen</span>
      <span className="red">Red · below 20%</span>
      <span className="orange">Orange · 20–49%</span>
      <span className="green">Green · 50% or more</span>
    </div>
  );
}

function AccuracyTile({ row }) {
  const scoreLabel = row.attempts > 0 && row.accuracy !== null
    ? `${Math.round(row.accuracy)}% accuracy`
    : "Not seen yet";
  return (
    <article
      className={`simple-report-tile ${row.band}`}
      aria-label={`${row.displayLabel}: ${scoreLabel}`}
    >
      <div className="simple-report-tile-heading">
        <strong>{row.displayLabel}</strong>
        <span aria-hidden="true">{BAND_MARKS[row.band]}</span>
      </div>
      <p>{row.sentence}</p>
      <footer>
        <span>{scoreLabel}</span>
        <small>Learning status: {row.statusLabel}</small>
      </footer>
    </article>
  );
}

function EmptySimpleReport({ children }) {
  return (
    <section className="simple-report-empty">
      <h2>No results yet</h2>
      <p>{children}</p>
    </section>
  );
}

function SimpleResultCollection({ rows, seenLabel, unseenLabel }) {
  const seenRows = rows.filter(row => row.attempts > 0);
  const unseenRows = rows.filter(row => row.attempts === 0);
  return (
    <>
      {seenRows.length ? (
        <section className="simple-report-grid" aria-label={seenLabel}>
          {seenRows.map(row => <AccuracyTile key={row.id} row={row} />)}
        </section>
      ) : (
        <section className="simple-report-empty compact">
          <h2>{TEACHER_COPY.reports.noSavedResults}</h2>
          <p>{TEACHER_COPY.reports.unseenHelp}</p>
        </section>
      )}
      {unseenRows.length > 0 && (
        <details className="simple-report-unseen">
          <summary>{unseenLabel} ({unseenRows.length})</summary>
          <section className="simple-report-grid" aria-label={unseenLabel}>
            {unseenRows.map(row => <AccuracyTile key={row.id} row={row} />)}
          </section>
        </details>
      )}
    </>
  );
}

export function SimpleOverviewReportView({ workspace = {}, studentName = "This child" }) {
  const overview = useMemo(
    () => buildSimpleOverview(workspace, studentName),
    [studentName, workspace]
  );
  const groups = [
    {
      id: "mastered",
      title: "Mastered",
      description: TEACHER_COPY.reports.masteredDescription,
      rows: overview.mastered
    },
    {
      id: "developing",
      title: "Developing",
      description: TEACHER_COPY.reports.developingDescription,
      rows: overview.developing
    },
    {
      id: "yet-to-learn",
      title: "Yet to learn",
      description: TEACHER_COPY.reports.yetToLearnDescription,
      rows: overview.yetToLearn
    }
  ];
  const totalSeen = overview.mastered.length + overview.developing.length;
  const descriptiveAssessments = workspace.wholeChild?.descriptiveAssessments || [];
  if (!totalSeen && !overview.yetToLearn.length) {
    return <EmptySimpleReport>Complete a check to begin this report.</EmptySimpleReport>;
  }
  return (
    <div className="simple-report-stack">
      <section className="simple-report-summary" aria-label="Learning overview">
        {groups.map(group => (
          <article className={group.id} key={group.id}>
            <span>{group.rows.length}</span>
            <h2>{group.title}</h2>
            <p>{group.description}</p>
          </article>
        ))}
      </section>
      <section className="simple-report-groups">
        {groups.map(group => (
          <details key={group.id} open={group.id !== "yet-to-learn"}>
            <summary>{group.title} ({group.rows.length})</summary>
            {group.rows.length ? (
              <ul>
                {group.rows.map(row => <li key={row.id}>{row.displayLabel}</li>)}
              </ul>
            ) : (
              <p>Nothing is in this group yet.</p>
            )}
          </details>
        ))}
      </section>
      {descriptiveAssessments.length > 0 && (
        <section className="simple-report-descriptive-el" aria-label="Descriptive EL check results">
          <header>
            <h2>Descriptive EL check results</h2>
            <p>{TEACHER_COPY.reports.descriptiveElHelp}</p>
          </header>
          <ul>
            {descriptiveAssessments.map(assessment => (
              <li key={assessment.assessmentId || assessment.id || assessment.title}>
                <strong>{assessment.title || assessment.label}</strong>
                <span>{assessment.resultLabel || "Result recorded"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function SimpleSkillsReportView({ workspace = {}, studentName = "This child" }) {
  const rows = useMemo(
    () => buildSimpleSkillsRows(workspace, studentName),
    [studentName, workspace]
  );
  const seenRows = rows.filter(row => row.attempts > 0);
  if (!rows.length) {
    return <EmptySimpleReport>Complete a Skills check to add skill results.</EmptySimpleReport>;
  }
  return (
    <div className="simple-report-stack">
      <AccuracyLegend />
      <p className="simple-report-intro">
        {TEACHER_COPY.reports.skillsIntro(seenRows.length, rows.length)}
      </p>
      <SimpleResultCollection
        rows={rows}
        seenLabel={TEACHER_COPY.reports.skillsWithResults}
        unseenLabel={TEACHER_COPY.reports.skillsNotSeen}
      />
    </div>
  );
}

export function SimpleHfwReportView({ workspace = {}, studentName = "This child" }) {
  const rows = useMemo(
    () => buildSimpleHfwRows(workspace, studentName),
    [studentName, workspace]
  );
  const seenRows = rows.filter(row => row.attempts > 0);
  return (
    <div className="simple-report-stack">
      <AccuracyLegend />
      <p className="simple-report-intro">
        {TEACHER_COPY.reports.hfwIntro(seenRows.length)}
      </p>
      <SimpleResultCollection
        rows={rows}
        seenLabel={TEACHER_COPY.reports.hfwWithResults}
        unseenLabel={TEACHER_COPY.reports.hfwNotSeen}
      />
    </div>
  );
}
