import { displayBenchmarkScopeLabel } from "../../data/elBenchmarkReportScope.js";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";

function finiteNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function percentage(value) {
  const number = finiteNumber(value);
  return number === null ? "Not recorded" : `${Math.round(number)}%`;
}

function decimal(value, suffix = "") {
  const number = finiteNumber(value);
  return number === null ? "Not recorded" : `${number}${suffix}`;
}

function readingStageLabel(placement = {}) {
  const value = placement?.label
    || placement?.candidateMicrophase
    || placement?.microphase
    || "";
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d+(?:\.\d+)?$/u.test(text)) return text;
  const words = text.replace(/[_-]+/gu, " ").replace(/\s+/gu, " ").trim();
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : "";
}

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
}

function elDomainMetricRows(summary = {}) {
  const metrics = summary.metrics || {};
  if (summary.domainKey === "phonologicalAwareness") {
    return [
      ["Average accuracy", percentage(metrics.averageAccuracyRate)],
      ["Students with scored results", String(summary.studentsWithScoredEvidence ?? 0)]
    ];
  }
  if (summary.domainKey === "encoding") {
    return [
      ["Average exact spelling", percentage(metrics.averageExactSpellingRate)],
      ["Average phonologically represented", percentage(metrics.averagePhonologicallyRepresentedRate)]
    ];
  }
  if (summary.domainKey === "decoding") {
    return [
      ["Average accuracy", percentage(metrics.averageAccuracyRate)],
      ["Average automaticity", percentage(metrics.averageAutomaticityRate)]
    ];
  }
  return [
    ["Average correct words per minute", decimal(metrics.averageWcpm)],
    ["Average word accuracy", percentage(metrics.averageAccuracyRate)],
    ["Average prosody", decimal(metrics.averageProsody, " / 4")]
  ];
}

function elStudentDomainSummary(profile = {}) {
  if (!profile.hasSavedEvidence) return "Not checked";
  const parts = [profile.administrationStatusLabel || "Result recorded"];
  const metrics = profile.metrics || {};
  if (profile.domainKey === "phonologicalAwareness") {
    parts.push(`accuracy ${percentage(metrics.accuracyRate)}`);
  } else if (profile.domainKey === "encoding") {
    parts.push(`exact spelling ${percentage(metrics.exactSpellingRate)}`);
  } else if (profile.domainKey === "decoding") {
    parts.push(`accuracy ${percentage(metrics.accuracyRate)}`);
    parts.push(`automaticity ${percentage(metrics.automaticityRate)}`);
  } else {
    parts.push(`${decimal(metrics.wcpm)} correct words/min`);
    parts.push(`accuracy ${percentage(metrics.accuracyRate)}`);
  }
  const confirmedStage = readingStageLabel(profile.confirmedPlacement);
  const suggestedStage = readingStageLabel(profile.candidatePlacement);
  if (confirmedStage) {
    parts.push(TEACHER_COPY.formalEl.confirmedReadingStage(confirmedStage));
  } else if (suggestedStage) {
    parts.push(TEACHER_COPY.formalEl.suggestedReadingStage(suggestedStage));
  }
  return parts.join(" · ");
}

function RunningHeader({ className, pageNumber, scopeLabel }) {
  return (
    <header className="formal-class-report-running-header">
      <strong>EL assessment report · {className}</strong>
      <span>{scopeLabel} · Page {pageNumber}</span>
    </header>
  );
}

function RunningFooter({ generatedAt }) {
  return (
    <footer className="formal-class-report-running-footer">
      <span>Literacy Guide · Formal assessment record · For teacher use only</span>
      <span>Generated {formatDate(generatedAt)}</span>
    </footer>
  );
}

export function ElClassReportDocument({ report }) {
  if (!report) return null;
  const formal = report.formalAssessments || {};
  const domainSummaries = formal.classBenchmarkDomainSummaries || report.benchmarkDomainSummaries || [];
  const studentMatrix = formal.classBenchmarkMatrix || report.benchmarkMatrix || [];
  const scopeLabel = displayBenchmarkScopeLabel(
    report.benchmarkScope,
    "No grade and time of year selected"
  );
  const selectedPeriod = report.selectedDatePeriod?.label || "All matching saved EL results";
  const totalElAssessments = finiteNumber(
    report.benchmarkScope?.matchingAttemptCount
      ?? report.benchmarkScope?.attemptCount
  );

  return (
    <article
      className="el-class-report-document"
      data-print-document="el-class"
      aria-label={`EL class report for ${report.className}`}
    >
      <section className="formal-class-report-page el-class-report-page">
        <RunningHeader className={report.className} pageNumber={1} scopeLabel={scopeLabel} />
        <header className="formal-class-report-hero">
          <span>Formal EL assessment record</span>
          <h1>{report.className}</h1>
          <p>{scopeLabel} · {selectedPeriod}</p>
        </header>
        <section className="formal-class-report-section">
          <div className="formal-class-report-section-heading">
            <div>
              <h2>{TEACHER_COPY.formalEl.resultsIncludedTitle}</h2>
              <p>{TEACHER_COPY.formalEl.resultsIncludedBody}</p>
            </div>
          </div>
          <dl className="el-class-report-facts">
            <div><dt>Class</dt><dd>{report.className}</dd></div>
            <div><dt>{TEACHER_COPY.formalEl.gradeAndTimeLabel}</dt><dd>{scopeLabel}</dd></div>
            <div><dt>Students on class list</dt><dd>{report.summary?.totalStudents ?? studentMatrix.length}</dd></div>
            <div>
              <dt>{TEACHER_COPY.formalEl.savedAssessmentsIncludedLabel}</dt>
              <dd>{totalElAssessments ?? "Not recorded"}</dd>
            </div>
            <div><dt>Result period</dt><dd>{selectedPeriod}</dd></div>
            <div><dt>Generated</dt><dd>{formatDate(report.generatedAt)}</dd></div>
          </dl>
        </section>
        <section className="formal-class-report-section">
          <div className="formal-class-report-section-heading">
            <div>
              <h2>Domain summary</h2>
              <p>EL results are descriptive. No overall pass mark is applied.</p>
            </div>
          </div>
          <table className="el-class-print-table">
            <thead>
              <tr>
                <th scope="col">Assessment</th>
                <th scope="col">Saved results</th>
                <th scope="col">Scored results</th>
                <th scope="col">Key measures</th>
              </tr>
            </thead>
            <tbody>
              {domainSummaries.map(summary => (
                <tr key={summary.domainKey}>
                  <th scope="row">{summary.domainLabel}</th>
                  <td>{summary.studentsWithSavedEvidence} of {summary.totalStudents}</td>
                  <td>{summary.studentsWithScoredEvidence} of {summary.totalStudents}</td>
                  <td>
                    {elDomainMetricRows(summary)
                      .map(([label, value]) => `${label}: ${value}`)
                      .join("; ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <RunningFooter generatedAt={report.generatedAt} />
      </section>

      <section className="formal-class-report-page el-class-report-page">
        <RunningHeader className={report.className} pageNumber={2} scopeLabel={scopeLabel} />
        <section className="formal-class-report-section">
          <div className="formal-class-report-section-heading">
            <div>
              <h2>Student results</h2>
              <p>{TEACHER_COPY.formalEl.latestResultBody}</p>
            </div>
          </div>
          <table className="el-class-print-table el-class-student-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                {domainSummaries.map(summary => (
                  <th key={summary.domainKey} scope="col">{summary.domainLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentMatrix.map(row => (
                <tr key={row.studentId}>
                  <th scope="row">{row.studentName}</th>
                  {domainSummaries.map(summary => (
                    <td key={summary.domainKey}>
                      {elStudentDomainSummary(row.cells?.[summary.domainKey])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!studentMatrix.length && (
            <p className="formal-class-report-empty">
              {TEACHER_COPY.formalEl.noStudentsForPeriod}
            </p>
          )}
        </section>
        <RunningFooter generatedAt={report.generatedAt} />
      </section>

      <section className="formal-class-report-page el-class-report-page">
        <RunningHeader className={report.className} pageNumber={3} scopeLabel={scopeLabel} />
        <section className="formal-class-report-section">
          <div className="formal-class-report-section-heading">
            <div>
              <h2>How to read this report</h2>
              <p>Use the individual EL record when you need each saved answer and its administration details.</p>
            </div>
          </div>
          <ul className="el-class-report-notes">
            <li>Every result belongs to {scopeLabel}; results from other grades or times of year are excluded.</li>
            <li>Completed, partial, discontinued and not-scorable administrations remain distinct.</li>
            <li>Percentages use scored items only. A missing measure is shown as “Not recorded,” never as zero.</li>
            <li>{TEACHER_COPY.formalEl.suggestedStageNote}</li>
            <li>This class document is a summary. The saved assessment record retains the detailed responses and administration notes.</li>
          </ul>
        </section>
        <section className="formal-class-report-section">
          <div className="formal-class-report-section-heading">
            <div>
              <h2>Saved records included</h2>
              <p>{TEACHER_COPY.formalEl.includedEvidenceBody(scopeLabel, selectedPeriod)}</p>
            </div>
          </div>
          <dl className="el-class-report-facts">
            <div><dt>First result</dt><dd>{formatDate(report.dateRange?.start)}</dd></div>
            <div><dt>Last result</dt><dd>{formatDate(report.dateRange?.end)}</dd></div>
            <div><dt>Report version</dt><dd>{report.schemaVersion || "Current"}</dd></div>
            <div><dt>{TEACHER_COPY.formalEl.gradeAndTimeLabel}</dt><dd>{scopeLabel}</dd></div>
          </dl>
        </section>
        <RunningFooter generatedAt={report.generatedAt} />
      </section>
    </article>
  );
}
