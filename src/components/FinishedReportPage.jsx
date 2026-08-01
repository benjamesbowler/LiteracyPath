import { useCallback, useEffect, useMemo, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import { buildStudentReportingWorkspaceModel } from "../data/studentReportingWorkspaceModel.js";
import {
  buildSimpleHfwRows
} from "../data/simpleStudentReports.js";
import {
  buildIndividualElFormalAssessmentReport,
  isReportableElBenchmarkCandidatePlacement,
  resolveElBenchmarkReportScope
} from "../data/elFormalAssessmentReportBuilder.js";
import { loadStoryQuestProgress } from "../utils/storyQuestProgress.js";
import { buildGuidedReadingReportRows } from "../utils/reportSections.js";
import {
  buildEngagementRow,
  buildStoryQuestRows,
  collectStudentEngagementAreas
} from "../utils/exportReportSections.js";
import { buildStudentWorkspaceCsvRows } from "../utils/exportStudentWorkspaceCsv.js";
import { buildExportProvenanceRows, resolveExportTimeZone } from "../utils/exportProvenance.js";
import {
  EL_EXPORT_GRADE_OPTIONS,
  EL_EXPORT_WINDOW_OPTIONS,
  getStudentElExportEntryDecision,
  normalizeElExportScope
} from "../utils/elAssessmentExportPolicy.js";
import { importWithRetry } from "../utils/lazyWithRetry.js";
import { readTeacherReportRouteView } from "../appState/routes.js";
import { buildQuestMasteryReport } from "../utils/questReport.js";
import { MetricFigure } from "./MetricDefinition.jsx";
import { countPhrase, progressPhrase, TEACHER_COPY } from "../copy/teacherCopy.js";
import { FAMILY_COPY } from "../copy/familyCopy.js";
import { TeacherDialog } from "./teacher/ui/TeacherDialog.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import { StudentReportShell } from "./reports/StudentReportShell.jsx";
import { teacherReportText } from "./reports/teacherReportCopy.jsx";
import {
  GuidedReadingReportView,
  OtherLearningReportView,
  ReportMetricStrip,
  ReportSection
} from "./reports/StudentReportViews.jsx";
import {
  buildGuidedReadingViewModel,
  buildOtherLearningViewModel,
  normalizeStudentReportView,
  STUDENT_REPORT_VIEWS
} from "./reports/studentReportUiUtils.js";
import {
  SimpleHfwReportView,
  SimpleOverviewReportView,
  SimpleSkillsReportView
} from "./reports/SimpleStudentReportViews.jsx";

const EMPTY_REPORT_ROWS = [];

function formatClassLabel(value = "") {
  return value || "Class not linked";
}

function latestSavedResultDate(rows = []) {
  let latest = null;
  for (const row of rows) {
    const candidates = [
      row?.completedAt,
      row?.completed_at,
      row?.updatedAt,
      row?.updated_at,
      row?.createdAt,
      row?.created_at,
      row?.occurredAt,
      row?.observedAt,
      row?.savedAt,
      row?.recordedAt,
      row?.lastActive,
      row?.lastPlayedAt,
      row?.date,
      row?.timestamp
    ];
    for (const value of candidates) {
      const time = new Date(value || "").getTime();
      if (Number.isFinite(time) && (latest === null || time > latest)) latest = time;
    }
  }
  return latest === null
    ? ""
    : new Date(latest).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
}

const CHECK_WINDOW_LABELS = Object.freeze({
  BOY: "Beginning of year",
  MOY: "Middle of year",
  EOY: "End of year"
});

function teacherResultText(value = "") {
  return teacherReportText(String(value || ""))
    .replace(/\bevidence supports\b/gi, "results support")
    .replace(/\bBOY\b/g, CHECK_WINDOW_LABELS.BOY)
    .replace(/\bMOY\b/g, CHECK_WINDOW_LABELS.MOY)
    .replace(/\bEOY\b/g, CHECK_WINDOW_LABELS.EOY)
    .replace(/\bevidence\b/gi, "results")
    .replace(/\blearners?\b/gi, match => /^[A-Z]/.test(match)
      ? match.toLowerCase().endsWith("s") ? "Students" : "Student"
      : (
        match.toLowerCase().endsWith("s") ? "students" : "student"
      ))
    .replace(/\bstudents?\b/gi, match => /^[A-Z]/.test(match)
      ? match.toLowerCase().endsWith("s") ? "Students" : "Student"
      : (
        match.toLowerCase().endsWith("s") ? "students" : "student"
      ))
    .replace(/\bincorrect\b/gi, "needs another look");
}

function reportViewLabel(viewId = "") {
  return STUDENT_REPORT_VIEWS.find(view => view.id === viewId)?.label || "Student results";
}

function visibleReportDetails(rows = []) {
  return rows
    .filter(row => !/\bversion/i.test(row.field))
    .map(row => ({
      ...row,
      value: teacherResultText(row.value)
    }));
}

function addSoundSeekersInteractionEvidence(report = {}) {
  const interactionEvidence = [
    ["Exploration", report.interaction?.optionalRouteVisits || report.interaction?.optionalDiscoveries || report.interaction?.restoredFriendsMet
      ? `${report.interaction.optionalRouteVisits || 0} side routes, ${report.interaction.optionalDiscoveries || 0} discoveries, ${report.interaction.restoredFriendsMet || 0} returning friends`
      : "No optional visits recorded"],
    ["Accessible play", report.interaction?.accessibleSessions
      ? `${report.interaction.accessibleSessions} sessions, ${report.interaction.accessibleTimingSupports || 0} timing barriers removed`
      : "No accessible sessions recorded"]
  ].map(([label, value]) => ({ label, value }));
  return { ...report, interactionEvidence };
}

function ElItemChip({ label, known, partial = false }) {
  const cls = known ? "el-chip-known" : partial ? "el-chip-partial" : "el-chip-unknown";
  const status = known ? FAMILY_COPY.results.secure : partial ? FAMILY_COPY.results.developing : FAMILY_COPY.results.support;
  const marker = known ? "✓" : partial ? "~" : "×";
  return <span aria-label={`${label}: ${status}`} className={`el-item-chip ${cls}`} title={status}>{marker} {label}</span>;
}

function ElCompletedAssessmentItems({ assessments = [] }) {
  const rows = assessments.map(assessment => ({
    assessment,
    items: Array.isArray(assessment.items) ? assessment.items : []
  }));
  const hasAny = rows.some(row => row.items.length);
  if (!hasAny) {
    return (
      <div className="student-report-muted-card">
        No answer details were saved with the latest completed assessment.
      </div>
    );
  }

  return (
    <div className="student-report-el-grid lg-el-grid">
      {rows.map(({ assessment, items }) => {
        if (!items.length) return null;
        const correct = items.filter(item => item.statusCandidate === "secure").length;
        const total = items.length;
        return (
          <article className="el-card lg-el-card" key={assessment.assessmentId}>
            <h3 className="lg-el-label">{assessment.title}</h3>
            <strong className="lg-el-score">{progressPhrase(correct, total)}</strong>
            <p>{teacherResultText(assessment.resultLabel) || "Assessment complete"}</p>
            {items.length > 0 && (
              <div className="el-chip-grid">
                {items.map((item, index) => (
                  <ElItemChip
                    key={`${assessment.assessmentId}-${item.concept?.conceptId || item.evidenceId || index}`}
                    label={item.concept?.label || item.label || "Recorded item"}
                    known={item.statusCandidate === "secure"}
                    partial={item.statusCandidate === "developing"}
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

function formatEvidencePercent(value) {
  if (value === undefined || value === null || value === "") return "Not scored";
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "Not scored";
}

function formatEvidenceNumber(value, fallback = "Not scored") {
  if (value === undefined || value === null || value === "") return fallback;
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function benchmarkScopeKey(scope = {}) {
  return `${scope.grade || ""}::${scope.benchmarkWindow || ""}`;
}

function BenchmarkScopeControl({
  activeScope = {},
  evidenceReady = true,
  exporting = false,
  exportStudentExcel,
  manualScope = {},
  onChange,
  onManualChange,
  options = []
}) {
  const hasRoutes = options.length > 0;
  const scopeReady = Boolean(activeScope.grade && activeScope.benchmarkWindow);
  return (
    <>
      <p className="student-report-benchmark-scope-line">
        Assessment period: <strong>{teacherResultText(activeScope.label) || "Choose a grade and time of year"}</strong>
      </p>
      <div className="student-report-benchmark-scope-control screen-only">
        <div>
          <label htmlFor="student-report-benchmark-scope">Grade and time of year</label>
          <small>
            {hasRoutes
              ? "The latest saved assessment is selected first. Choose an earlier one to review or download."
              : "Choose both fields before downloading this report."}
          </small>
        </div>
        {hasRoutes ? (
          <select
            aria-label="Grade and time of year"
            id="student-report-benchmark-scope"
            onChange={event => onChange(event.target.value)}
            value={benchmarkScopeKey(activeScope)}
          >
            {options.map((scope, index) => (
              <option key={benchmarkScopeKey(scope)} value={benchmarkScopeKey(scope)}>
                {teacherResultText(scope.label)} ({scope.attemptCount} {scope.attemptCount === 1 ? "attempt" : "attempts"}){index === 0 ? " - most recent" : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="student-report-manual-scope">
            <label>
              <span>Grade</span>
              <select
                aria-label="EL report grade"
                onChange={event => onManualChange({ ...manualScope, grade: event.target.value })}
                value={manualScope.grade || ""}
              >
                <option value="">Choose grade</option>
                {EL_EXPORT_GRADE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Time of year</span>
              <select
                aria-label="EL report time of year"
                onChange={event => onManualChange({ ...manualScope, benchmarkWindow: event.target.value })}
                value={manualScope.benchmarkWindow || ""}
              >
                <option value="">Choose window</option>
                {EL_EXPORT_WINDOW_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        {exportStudentExcel && (
          <button
            className="report-button"
            disabled={!evidenceReady || !scopeReady || exporting}
            onClick={() => exportStudentExcel({
              grade: activeScope.grade,
              benchmarkWindow: activeScope.benchmarkWindow
            })}
            type="button"
          >
            {exporting ? "Preparing…" : "Download this report"}
          </button>
        )}
      </div>
    </>
  );
}

function benchmarkMetricRows(profile = {}) {
  const metrics = profile.metrics || {};
  if (profile.domainKey === "phonologicalAwareness") {
    return [
      ["Oral-task accuracy", formatEvidencePercent(metrics.accuracyRate), "accuracy"],
      ["Strands observed", metrics.strandsObserved ?? "Not available"]
    ];
  }
  if (profile.domainKey === "encoding") {
    return [
      ["Exact spelling", formatEvidencePercent(metrics.exactSpellingRate)],
      ["Sounds represented", formatEvidencePercent(metrics.phonologicallyRepresentedRate)],
      ["No responses", metrics.noResponseCount ?? "Not available"]
    ];
  }
  if (profile.domainKey === "decoding") {
    return [
      ["Word accuracy", formatEvidencePercent(metrics.accuracyRate), "accuracy"],
      ["Automatic reading", formatEvidencePercent(metrics.automaticityRate)]
    ];
  }
  return [
    ["Correct words/min", formatEvidenceNumber(metrics.wcpm)],
    ["Word accuracy", formatEvidencePercent(metrics.accuracyRate), "accuracy"],
    ["Prosody (optional)", formatEvidenceNumber(metrics.prosodyAverage, null) === null
      ? "Not scored"
      : progressPhrase(Number(metrics.prosodyAverage).toFixed(1), 4)]
  ];
}

function benchmarkEvidenceArray(value) {
  if (Array.isArray(value)) return value.filter(item => item !== undefined && item !== null && String(item).trim());
  if (value === undefined || value === null || String(value).trim() === "") return [];
  return [value];
}

function formatBenchmarkEvidenceCode(value, fallback = "Not recorded") {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return teacherResultText(String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase()));
}

function formatExactBenchmarkResponse(value, item = {}) {
  const detailMissing = value === undefined || value === null || (
    !Array.isArray(value) && typeof value !== "object" && String(value).trim() === ""
  );
  if (detailMissing && item.responseCaptureMode === "quick_teacher_judgment") {
    return "Not transcribed (quick score)";
  }
  if (value === undefined || value === null) return "No response recorded";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "No response recorded";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim() ? String(value) : "No response recorded";
}

function formatBenchmarkResponseCapture(item = {}) {
  const mode = String(item.responseCaptureMode || "legacy_unspecified");
  if (mode === "quick_teacher_judgment") {
    return item.responseDetailCaptured
      ? "Quick score with optional transcription"
      : "Quick score — not transcribed";
  }
  if (mode === "direct_choice") return "Direct response choice";
  if (mode === "exact_transcription") return "Exact response transcribed";
  if (mode === "timed_reading_observation") return "Timed reading observation";
  return "Legacy capture — detail unspecified";
}

function benchmarkItemLabel(item = {}, domainKey = "") {
  const primary = domainKey === "oralReadingFluency"
    ? item.passageTitle || item.prompt || item.passageId
    : item.targetWord || item.prompt || item.targetPattern || item.itemKey || item.questionId;
  const secondary = item.prompt && item.prompt !== primary ? item.prompt : "";
  return {
    primary: primary || "Question",
    secondary,
    itemId: ""
  };
}

function benchmarkItemStatus(item = {}) {
  const rawStatus = item.responseStatus || (
    item.isCorrect === true ? "correct" : item.isCorrect === false ? "incorrect" : "not_recorded"
  );
  const classKey = String(rawStatus).toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return {
    className: `status-${classKey}`,
    label: rawStatus === "correct"
      ? "Correct"
      : rawStatus === "incorrect"
        ? "Needs another look"
        : rawStatus === "not_recorded"
          ? "Not recorded"
          : formatBenchmarkEvidenceCode(rawStatus)
  };
}

function BenchmarkEvidenceLines({ lines = [] }) {
  const visibleLines = lines.filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!visibleLines.length) return <span>Not recorded</span>;
  return (
    <ul className="student-report-benchmark-cell-list">
      {visibleLines.map(([label, value]) => (
        <li key={label}><strong>{label}:</strong> {value}</li>
      ))}
    </ul>
  );
}

function benchmarkReadingStageValue(record = {}) {
  const value = record.microphaseLabel
    || record.bandLabel
    || record.label
    || record.microphase
    || record.bandId
    || "";
  return formatBenchmarkEvidenceCode(value, "Not recorded");
}

function benchmarkItemEvidenceLines(domainKey = "", item = {}, performanceSuppressed = false) {
  if (performanceSuppressed) {
    const auditLines = [
      ["Performance figures", "Not scored for this assessment"]
    ];
    if (domainKey === "phonologicalAwareness") {
      return [
        ...auditLines,
        ["Strand", formatBenchmarkEvidenceCode(item.strand, "")],
        ["Task", formatBenchmarkEvidenceCode(item.task, "")]
      ];
    }
    if (domainKey === "decoding") {
      return [
        ...auditLines,
        [TEACHER_COPY.formalEl.readingStageLabel, benchmarkReadingStageValue(item)]
      ];
    }
    if (domainKey === "oralReadingFluency") {
      return [
        ...auditLines,
        ["Elapsed seconds", item.elapsedSeconds ?? "Not recorded"],
        ["Timer status", formatBenchmarkEvidenceCode(item.timerStatus, "")],
        ["Timer interrupted", item.timerInterrupted === true ? "Yes" : item.timerInterrupted === false ? "No" : ""],
        ["Interruption reason", formatBenchmarkEvidenceCode(item.interruptionReason, "")],
        [TEACHER_COPY.formalEl.nextStepDecisionLabel, formatBenchmarkNarrative(item.routeDecision)],
        ["Informational notes", benchmarkEvidenceArray(item.informationalNotes).map(formatBenchmarkNarrative).filter(Boolean).join("; ")]
      ];
    }
    return auditLines;
  }
  if (domainKey === "phonologicalAwareness") {
    return [
      ["Judgment", item.isCorrect === true ? "Correct" : item.isCorrect === false ? "Needs another look" : "Not scored"],
      ["Strand", formatBenchmarkEvidenceCode(item.strand, "")],
      ["Task", formatBenchmarkEvidenceCode(item.task, "")]
    ];
  }
  if (domainKey === "encoding") {
    const judgment = item.exact === true
      ? "Exact spelling"
      : item.plausible === true
        ? "Phonologically plausible"
        : item.notYet === true
          ? "Not yet represented"
          : "Not scored";
    return [
      ["Spelling judgment", judgment],
      ["Scoring code", formatBenchmarkEvidenceCode(item.scoringCode, "")]
    ];
  }
  if (domainKey === "decoding") {
    return [
      ["Accuracy", item.accurate === true ? "Accurate" : item.accurate === false ? "Not accurate" : "Not recorded"],
      ["Automaticity", item.automatic === true ? "Automatic" : item.automatic === false ? "Not automatic" : "Not recorded"],
      ["Self-correction", item.selfCorrected === true ? "Yes" : item.selfCorrected === false ? "No" : "Not recorded"],
      [TEACHER_COPY.formalEl.readingStageLabel, benchmarkReadingStageValue(item)]
    ];
  }
  const wordCount = item.wordsCorrect !== null && item.wordsCorrect !== undefined
    ? `${item.wordsCorrect} of ${item.wordsAttempted ?? "not recorded"}`
    : "Not recorded";
  return [
    ["Words correct", wordCount],
    ["Errors", item.errors ?? "Not recorded"],
    ["Self-corrections", item.selfCorrections ?? "Not recorded"],
    ["Elapsed seconds", item.elapsedSeconds ?? "Not recorded"],
    ["Timer status", formatBenchmarkEvidenceCode(item.timerStatus, "")],
    ["Timer interrupted", item.timerInterrupted === true ? "Yes" : item.timerInterrupted === false ? "No" : ""],
    ["Interruption reason", formatBenchmarkEvidenceCode(item.interruptionReason, "")],
    ["Zero words reached", item.zeroWordsReached === true ? "Yes" : item.zeroWordsReached === false ? "No" : ""],
    ["WCPM", item.wcpm ?? "Not recorded"],
    ["Accuracy", item.accuracyRate === undefined || item.accuracyRate === null || item.accuracyRate === ""
      ? "Not recorded"
      : Number.isFinite(Number(item.accuracyRate))
        ? `${Math.round(Number(item.accuracyRate))}%`
        : "Not recorded"],
    ["Teacher judgment", item.passageAccurate === true ? "Accurate" : item.passageAccurate === false ? "Not accurate" : "Not recorded"],
    [TEACHER_COPY.formalEl.nextStepDecisionAvailableLabel, item.routeJudgmentUsable === true ? "Yes" : item.routeJudgmentUsable === false ? "No" : ""],
    [TEACHER_COPY.formalEl.nextStepDecisionLabel, formatBenchmarkNarrative(item.routeDecision)],
    ["Accuracy judgment source", formatBenchmarkEvidenceCode(item.accuracyJudgmentSource, "")],
    ["Accuracy judged at", item.accuracyJudgedAt || ""],
    ["Informational notes", benchmarkEvidenceArray(item.informationalNotes).map(formatBenchmarkNarrative).filter(Boolean).join("; ")]
  ];
}

function BenchmarkPrerequisiteReview({ detail = {} }) {
  const evidence = detail && typeof detail === "object" ? detail : {};
  const review = evidence.prerequisiteReview || evidence.metadata?.prerequisiteReview;
  if (!review || typeof review !== "object") return null;
  const state = String(review.state || "").trim().toLowerCase();
  const source = review.source || review.evidenceSource || review.reviewSource || "";
  const ruleCode = review.code || review.ruleCode || review.rule || "";
  const rationale = review.rationale || review.overrideReason || review.reason || review.note || "";
  const lines = [
    ["Review state", formatBenchmarkEvidenceCode(review.state, "")],
    ["Review source", formatBenchmarkEvidenceCode(source, "")],
    ["Rule or code", formatBenchmarkEvidenceCode(ruleCode, "")],
    ["Teacher confirmed", typeof review.teacherConfirmed === "boolean" ? (review.teacherConfirmed ? "Yes" : "No") : ""]
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim());
  if (state === "override") {
    lines.push(["Override applied", "Yes"]);
    if (rationale) lines.push(["Override rationale", teacherResultText(rationale)]);
  }
  if (!lines.length) return null;
  return (
    <section className="student-report-benchmark-prerequisite" aria-label="Prerequisite review">
      <h4>Prerequisite review</h4>
      <dl>
        {lines.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    </section>
  );
}

function formatBenchmarkNarrative(value) {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) return value.map(formatBenchmarkNarrative).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => {
        const text = formatBenchmarkNarrative(nestedValue);
        return text ? `${formatBenchmarkEvidenceCode(key)}: ${text}` : "";
      })
      .filter(Boolean)
      .join("; ");
  }
  return teacherResultText(value);
}

function BenchmarkTeacherGuidance({ detail = {} }) {
  const evidence = detail && typeof detail === "object" ? detail : {};
  const recommendations = benchmarkEvidenceArray(evidence.recommendations).map(formatBenchmarkNarrative).filter(Boolean);
  const observations = benchmarkEvidenceArray(evidence.observations).map(formatBenchmarkNarrative).filter(Boolean);
  const validationIssues = benchmarkEvidenceArray(evidence.validationIssues)
    .map(value => typeof value === "string" ? formatBenchmarkEvidenceCode(value) : formatBenchmarkNarrative(value))
    .filter(Boolean);
  if (!recommendations.length && !observations.length && !validationIssues.length) return null;
  return (
    <section className="student-report-benchmark-guidance" aria-label="Assessment guidance and observations">
      {recommendations.length > 0 && (
        <div>
          <h4>Recommended follow-up</h4>
          <ul>{recommendations.map((note, index) => <li key={`recommendation-${index + 1}`}>{note}</li>)}</ul>
        </div>
      )}
      {observations.length > 0 && (
        <div>
          <h4>Recorded observations</h4>
          <ul>{observations.map((note, index) => <li key={`observation-${index + 1}`}>{note}</li>)}</ul>
        </div>
      )}
      {validationIssues.length > 0 && (
        <div>
          <h4>Assessment notes</h4>
          <ul>{validationIssues.map((note, index) => <li key={`validation-${index + 1}`}>{note}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

function BenchmarkItemEvidenceTable({ detail = {} }) {
  const evidence = detail && typeof detail === "object" ? detail : {};
  const items = Array.isArray(evidence.itemDetails) ? evidence.itemDetails : [];
  if (!items.length) {
    return <p className="student-report-benchmark-empty-items">No answer details were saved for this assessment.</p>;
  }
  const domainLabel = teacherResultText(evidence.domainLabel) || "Assessment area";
  return (
    <div
      aria-label={`${domainLabel} answer details`}
      className="student-report-benchmark-evidence-table-wrap"
      role="region"
      tabIndex="0"
    >
      <table className="student-report-benchmark-evidence-table">
        <caption>{domainLabel} answer details ({countPhrase(items.length, "question")})</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Exact response or transcription</th>
            <th scope="col">Response capture</th>
            <th scope="col">Status</th>
            <th scope="col">Results</th>
            <th scope="col">What to review</th>
            <th scope="col">Assessment notes</th>
            <th scope="col">Why it was not scored</th>
            <th scope="col">Teacher note</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const label = benchmarkItemLabel(item, evidence.domainKey);
            const status = benchmarkItemStatus(item);
            const errorTags = benchmarkEvidenceArray(item.errorTags)
              .map(tag => formatBenchmarkEvidenceCode(tag));
            const validationIssues = benchmarkEvidenceArray(item.validationIssues)
              .map(issue => formatBenchmarkEvidenceCode(issue));
            return (
              <tr key={item.questionId || item.itemKey || item.passageId || `${evidence.domainKey}-item-${index + 1}`}>
                <th data-label="Item" scope="row">
                  <strong>{label.primary}</strong>
                  {label.secondary && <span>{label.secondary}</span>}
                </th>
                <td className="student-report-benchmark-exact-response" data-label="Exact response or transcription">
                  {formatExactBenchmarkResponse(item.exactResponse, item)}
                </td>
                <td data-label="Response capture">{formatBenchmarkResponseCapture(item)}</td>
                <td data-label="Status">
                  <span className={`student-report-benchmark-item-status ${status.className}`}>{status.label}</span>
                </td>
                <td data-label="Results">
                  <BenchmarkEvidenceLines lines={benchmarkItemEvidenceLines(
                    evidence.domainKey,
                    item,
                    evidence.performanceSuppressed === true
                  )} />
                </td>
                <td data-label="What to review">{errorTags.length ? errorTags.join(", ") : "None recorded"}</td>
                <td data-label="Assessment notes">
                  {validationIssues.length ? validationIssues.join(", ") : "None recorded"}
                </td>
                <td data-label="Why it was not scored">
                  {item.notScorableReason ? formatBenchmarkEvidenceCode(item.notScorableReason) : "Not applicable"}
                </td>
                <td className="student-report-benchmark-exact-note" data-label="Teacher note">
                  {item.notScorableNote ? teacherResultText(item.notScorableNote) : "None recorded"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function benchmarkPlacementLabel(placement = null, confirmed = false) {
  if (!placement || typeof placement !== "object") return "";
  const stage = benchmarkReadingStageValue(placement);
  if (!stage || stage === "Not recorded") return "";
  return confirmed
    ? TEACHER_COPY.formalEl.confirmedReadingStage(stage)
    : TEACHER_COPY.formalEl.suggestedReadingStage(stage);
}

function BenchmarkDetail({ detail }) {
  if (!detail) return null;
  if (detail.performanceSuppressed) {
    return (
      <p className="student-report-benchmark-unscored-note">
        Figures are not shown because this assessment was not completed. Saved answers and teacher notes remain below.
      </p>
    );
  }
  if (detail.domainKey === "phonologicalAwareness") {
    return (
      <ul>
        {(detail.strandRows || []).map(row => (
          <li key={row.strand}>
            <strong>{String(row.strandLabel || row.strand).replace(/\b\w/g, letter => letter.toUpperCase())}</strong>
            {` · ${progressPhrase(row.correctCount, row.administeredCount)} correct · ${formatEvidencePercent(row.accuracyRate)}`}
          </li>
        ))}
      </ul>
    );
  }
  if (detail.domainKey === "encoding") {
    return (
      <p>
        {detail.exactSpellingCount} exact · {detail.plausibleSpellingCount} phonologically plausible · {detail.notYetCount} not yet represented · {detail.noResponseCount || 0} no response
      </p>
    );
  }
  if (detail.domainKey === "decoding") {
    return (
      <>
        <ul>
        {(detail.bandRows || []).map(row => (
          <li key={row.bandId}>
              <strong>{benchmarkReadingStageValue(row)}</strong>
              {` · ${progressPhrase(row.accurateCount, row.administeredCount)} accurate · ${progressPhrase(row.automaticCount, row.administeredCount)} automatic`}
            </li>
          ))}
        </ul>
        {detail.stopEvidence?.reason && <p>Why the assessment stopped: {formatBenchmarkEvidenceCode(detail.stopEvidence.reason)}.</p>}
      </>
    );
  }
  return (
    <>
      <ul>
        {(detail.passageRows?.length ? detail.passageRows : [detail]).map((row, index) => (
          <li key={row.passageId || `fluency-passage-${index + 1}`}>
            <strong>{row.passageTitle || benchmarkReadingStageValue({
              ...row,
              label: row.microphase || `Passage ${index + 1}`
            })}</strong>
            {` · ${progressPhrase(row.wordsCorrect ?? "Not recorded", row.wordsAttempted ?? "Not recorded")} correct`}
            {row.wcpm !== null && row.wcpm !== undefined ? ` · ${row.wcpm} WCPM` : " · WCPM not reported"}
            {row.passageAccurate === true ? " · teacher judged accurate" : row.passageAccurate === false ? " · teacher judged not accurate" : " · judgment not recorded"}
          </li>
        ))}
      </ul>
      {detail.stopEvidence?.reason && <p>Why the assessment stopped: {formatBenchmarkEvidenceCode(detail.stopEvidence.reason)}.</p>}
    </>
  );
}

function ElBenchmarkEvidenceSection({ report }) {
  const profile = report?.individualBenchmarkProfile || [];
  const details = report?.individualBenchmarkDetails || [];
  return (
    <div className="student-report-benchmark-grid">
      {profile.map(domain => {
        const detail = details.find(row => row.attemptId === domain.latestAttemptId) || null;
        const candidatePlacement = isReportableElBenchmarkCandidatePlacement(domain.candidatePlacement)
          ? domain.candidatePlacement
          : null;
        const confirmedPlacement = domain.confirmedPlacement || null;
        const placement = confirmedPlacement || candidatePlacement;
        const placementLabel = benchmarkPlacementLabel(placement, Boolean(confirmedPlacement));
        const descriptiveInterpretation = !candidatePlacement && domain.candidatePlacement
          ? domain.candidatePlacement.reason || domain.candidatePlacement.interpretation || ""
          : "";
        return (
          <article className={`student-report-benchmark-card ${domain.hasSavedEvidence ? "has-evidence" : "no-evidence"}`} key={domain.assessmentId}>
            <div className="student-report-benchmark-heading">
              <h3>{domain.domainLabel}</h3>
              <span>{teacherResultText(domain.administrationStatusLabel)}</span>
            </div>
            {domain.hasSavedEvidence ? (
              <>
                <small>
                  {domain.grade === "K" ? "Kindergarten" : domain.grade ? `Grade ${domain.grade}` : "Grade not recorded"}
                  {domain.benchmarkWindow ? ` · ${teacherResultText(domain.benchmarkWindow)}` : ""}
                  {domain.latestDate ? ` · ${new Date(domain.latestDate).toLocaleDateString()}` : ""}
                </small>
                <dl>
                  {benchmarkMetricRows(domain).map(([label, value, definitionId]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>
                        {definitionId
                          ? (
                            <MetricFigure
                              dateRange={`The saved ${domain.grade || "ungraded"} ${teacherResultText(domain.benchmarkWindow) || "assessment"} period shown on this card.`}
                              denominator="Scored questions in this assessment area."
                              metricId={definitionId}
                              minimumEvidence="At least one scored question; unscored assessments display Not scored."
                              updatedAt={domain.latestAt || domain.latestDate || detail?.updatedAt || detail?.completedAt}
                            >
                              {value}
                            </MetricFigure>
                          )
                          : value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {placementLabel && <p className="student-report-provisional-placement">{placementLabel}</p>}
                {descriptiveInterpretation && (
                  <p className="student-report-benchmark-interpretation">{teacherResultText(descriptiveInterpretation)}</p>
                )}
                <BenchmarkTeacherGuidance detail={detail} />
                <details className="student-report-benchmark-details">
                  <summary>
                    View answer details ({countPhrase(detail?.itemDetails?.length || 0, "question")})
                  </summary>
                  <div className="student-report-benchmark-detail-body">
                    <BenchmarkPrerequisiteReview detail={detail} />
                    <BenchmarkDetail detail={detail} />
                    <BenchmarkItemEvidenceTable detail={detail} />
                  </div>
                </details>
              </>
            ) : (
              <p>No saved results for this area.</p>
            )}
          </article>
        );
      })}
      <p className="student-report-benchmark-disclaimer">
        These EL-aligned results describe what was seen in this assessment. They do not use an official EL Education or nationally normed pass mark.
      </p>
    </div>
  );
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadReportRows(rows = [], filename = "student-report.csv") {
  if (typeof document === "undefined" || !rows.length) return false;
  const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row || {}))));
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map(row => headers.map(header => csvCell(row?.[header])).join(","))
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

function safeReportFilename(value = "student") {
  return String(value || "student")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "student";
}

export function FinishedReportPage({
  backLabel = "Back to dashboard",
  buildReportHref,
  startAssessment,
  openChecks,
  initialReportView = "whole-child",
  studentName,
  className = "",
  skillMasterySummary = [],
  itemMastery = {},
  assessmentHistory = [],
  answerHistory = [],
  evidenceReadState = {},
  evidenceReady = true,
  focusHeadingOnMount = false,
  exportStudentExcel,
  exportReadingReport,
  letterAssessment = [],
  patternAssessment = [],
  guidedReadingRecords = {},
  storyQuestProgressScopeKey = "default",
  // Optional; wired in App.jsx (pass progressScopeKey={studentId || studentName}).
  progressScopeKey = "",
  reportStatusMessage = "",
  // Called whenever the report navigation changes which report is showing. The Reports
  // funnel embeds this page under its own step 3, and without this the step
  // would keep saying "Overview" after the teacher moved to Skills.
  onReportViewChange,
  onRetryEvidence,
  readReportRouteView = readTeacherReportRouteView,
  returnToTeacherDashboard
}) {
  const initialView = normalizeStudentReportView(initialReportView);
  const reportContextKey = `${progressScopeKey}::${initialView}`;
  const [reportSelection, setReportSelection] = useState(() => ({
    contextKey: reportContextKey,
    view: readReportRouteView() || initialView
  }));
  const activeReportView = reportSelection.contextKey === reportContextKey
    ? reportSelection.view
    : readReportRouteView() || initialView;
  const [guidedReadingLoad, setGuidedReadingLoad] = useState({
    records: null,
    retry: -1,
    rows: [],
    wordRows: [],
    status: "idle",
    error: ""
  });
  const [guidedReadingRetry, setGuidedReadingRetry] = useState(0);
  const [benchmarkScopeSelection, setBenchmarkScopeSelection] = useState({ owner: "", key: "" });
  const [manualBenchmarkScope, setManualBenchmarkScope] = useState({
    owner: "",
    grade: "",
    benchmarkWindow: ""
  });
  const [benchmarkExporting, setBenchmarkExporting] = useState(false);
  const [emptyElExportScope, setEmptyElExportScope] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const hasGuidedReadingRecords = Object.keys(guidedReadingRecords || {}).length > 0;
  const hasCurrentGuidedReadingLoad = guidedReadingLoad.records === guidedReadingRecords
    && guidedReadingLoad.retry === guidedReadingRetry;
  const activeGuidedReadingReportRows = hasGuidedReadingRecords && hasCurrentGuidedReadingLoad
    ? guidedReadingLoad.rows
    : EMPTY_REPORT_ROWS;
  const activeGuidedReadingWordRows = hasGuidedReadingRecords && hasCurrentGuidedReadingLoad
    ? guidedReadingLoad.wordRows
    : EMPTY_REPORT_ROWS;
  const activeGuidedReadingLoad = hasGuidedReadingRecords
    ? hasCurrentGuidedReadingLoad
      ? guidedReadingLoad
      : { status: "loading", error: "" }
    : { status: "ready", error: "" };
  const storyQuestRawProgress = useMemo(
    () => loadStoryQuestProgress(storyQuestProgressScopeKey),
    [storyQuestProgressScopeKey]
  );
  const storyQuestRows = useMemo(() => buildStoryQuestRows({
    studentId: progressScopeKey,
    studentName,
    progress: storyQuestRawProgress,
    quests: storyQuests
  }), [progressScopeKey, storyQuestRawProgress, studentName]);
  const progressAreas = useMemo(() => (
    progressScopeKey ? collectStudentEngagementAreas({ id: progressScopeKey }) : {}
  ), [progressScopeKey]);
  const engagementRow = useMemo(() => {
    if (!progressScopeKey) return null;
    return buildEngagementRow({ studentName, studentId: progressScopeKey, className, areas: progressAreas });
  }, [progressScopeKey, studentName, className, progressAreas]);
  const soundSeekersReport = useMemo(() => {
    if (!progressScopeKey) return null;
    return addSoundSeekersInteractionEvidence(buildQuestMasteryReport(progressAreas.soundSeekers || {}));
  }, [progressAreas, progressScopeKey]);

  useEffect(() => {
    if (!hasGuidedReadingRecords) return undefined;

    let cancelled = false;
    importWithRetry(() => import("../data/guidedReadingBooks")).then(module => {
      if (!cancelled) {
        setGuidedReadingLoad({
          records: guidedReadingRecords,
          retry: guidedReadingRetry,
          rows: buildGuidedReadingReportRows(guidedReadingRecords, module),
          wordRows: module.getGuidedReadingWordStatusRows?.(guidedReadingRecords) || [],
          status: "ready",
          error: ""
        });
      }
    }).catch(error => {
      if (cancelled) return;
      console.error("Guided Reading report load failed:", error);
      setGuidedReadingLoad({
        records: guidedReadingRecords,
        retry: guidedReadingRetry,
        rows: [],
        wordRows: [],
        status: "error",
        error: "The saved reading records are safe, but this report could not load them. Try again."
      });
    });

    return () => {
      cancelled = true;
    };
  }, [guidedReadingRecords, guidedReadingRetry, hasGuidedReadingRecords]);

  const benchmarkScopeResolution = useMemo(() => resolveElBenchmarkReportScope({
    records: assessmentHistory
  }), [assessmentHistory]);
  const benchmarkScopeOptions = benchmarkScopeResolution.availableRoutes || [];
  const activeManualBenchmarkScope = manualBenchmarkScope.owner === progressScopeKey
    ? manualBenchmarkScope
    : { grade: "", benchmarkWindow: "" };
  const normalizedManualBenchmarkScope = normalizeElExportScope(activeManualBenchmarkScope);
  const activeBenchmarkScope = benchmarkScopeOptions.find(scope => (
    benchmarkScopeSelection.owner === progressScopeKey &&
    benchmarkScopeKey(scope) === benchmarkScopeSelection.key
  )) || benchmarkScopeOptions[0] || normalizedManualBenchmarkScope;
  const elBenchmarkReport = useMemo(() => buildIndividualElFormalAssessmentReport({
    student: {
      id: progressScopeKey || assessmentHistory[0]?.studentId || "",
      name: studentName,
      className
    },
    assessmentHistory,
    benchmarkScope: activeBenchmarkScope
  }), [activeBenchmarkScope, assessmentHistory, className, progressScopeKey, studentName]);

  const reportingWorkspace = useMemo(() => buildStudentReportingWorkspaceModel({
    student: {
      id: progressScopeKey || assessmentHistory[0]?.studentId || "",
      name: studentName,
      className
    },
    assessmentHistory,
    answerHistory,
    letterAssessment,
    patternAssessment,
    benchmarkScope: activeBenchmarkScope,
    guidedReadingRecords,
    guidedReadingRows: activeGuidedReadingReportRows,
    guidedReadingWordRows: activeGuidedReadingWordRows,
    itemMastery,
    skillMasterySummary,
    evidenceReadState,
    storyQuestSummary: storyQuestRows,
    soundSeekersReport,
    arcade: progressAreas.games || {},
    engagement: engagementRow || {}
  }), [
    activeBenchmarkScope,
    activeGuidedReadingReportRows,
    activeGuidedReadingWordRows,
    answerHistory,
    assessmentHistory,
    className,
    engagementRow,
    evidenceReadState,
    guidedReadingRecords,
    itemMastery,
    letterAssessment,
    patternAssessment,
    progressAreas.games,
    progressScopeKey,
    skillMasterySummary,
    soundSeekersReport,
    storyQuestRows,
    studentName
  ]);

  async function exportSelectedBenchmarkScope(scope, { emptyConfirmed = false } = {}) {
    if (!evidenceReady) {
      setActionFeedback({
        kind: "error",
        message: "All saved results must finish loading before this report can be downloaded."
      });
      return false;
    }
    if (!exportStudentExcel || benchmarkExporting) return;
    const decision = getStudentElExportEntryDecision({
      scope,
      savedElAssessmentCount: reportingWorkspace.elAssessments?.summary?.assessmentsChecked || 0,
      reconciledEvidenceCount: reportingWorkspace.skillsCheck?.knowledgeEvidence?.filter(row => (
        row?.concept?.domain === "alphabet_knowledge" &&
        ["letter_name", "letter_sound"].includes(row?.concept?.construct)
      )).length || 0,
      studentName
    });
    if (decision.action === "block") {
      setActionFeedback({ kind: "error", message: decision.message });
      return false;
    }
    if (decision.action === "warn" && !emptyConfirmed) {
      setEmptyElExportScope(decision);
      setActionFeedback(null);
      return false;
    }
    setBenchmarkExporting(true);
    try {
      await exportStudentExcel(decision.scope);
      return true;
    } finally {
      setBenchmarkExporting(false);
    }
  }

  const guidedReadingViewModel = useMemo(() => {
    const report = reportingWorkspace.guidedReading;
    if (report?.books?.length || report?.wordRows?.length || report?.notes?.length) return report;
    return buildGuidedReadingViewModel(activeGuidedReadingReportRows, activeGuidedReadingWordRows);
  }, [activeGuidedReadingReportRows, activeGuidedReadingWordRows, reportingWorkspace.guidedReading]);
  const otherLearningViewModel = useMemo(() => {
    const report = reportingWorkspace.otherLearning;
    if (report?.evidence?.length) {
      return {
        ...report,
        soundSeekers: {
          ...report.soundSeekers,
          interactionEvidence: soundSeekersReport?.interactionEvidence || []
        }
      };
    }
    return buildOtherLearningViewModel({
      arcadeAreas: progressAreas,
      soundSeekersReport,
      storyQuestRows
    });
  }, [progressAreas, reportingWorkspace.otherLearning, soundSeekersReport, storyQuestRows]);
  const reportGeneratedAt = reportingWorkspace.generatedAt;
  const reportTimeZone = resolveExportTimeZone();
  const reportEvidenceSource = useMemo(() => [
    ...assessmentHistory,
    ...answerHistory,
    ...activeGuidedReadingReportRows,
    ...storyQuestRows,
    ...skillMasterySummary,
    ...Object.values(itemMastery || {}),
    ...letterAssessment,
    ...patternAssessment
  ], [
    activeGuidedReadingReportRows,
    answerHistory,
    assessmentHistory,
    itemMastery,
    letterAssessment,
    patternAssessment,
    skillMasterySummary,
    storyQuestRows
  ]);
  const latestResultDate = useMemo(
    () => latestSavedResultDate(reportEvidenceSource),
    [reportEvidenceSource]
  );
  const reportProvenanceRows = useMemo(() => buildExportProvenanceRows({
    reportTitle: `${reportViewLabel(activeReportView)} report`,
    className,
    learnerName: studentName,
    learnerId: progressScopeKey || assessmentHistory[0]?.studentId || "",
    learnerCount: 1,
    generatedAt: reportGeneratedAt,
    timeZone: reportTimeZone,
    filters: {
      "Report view": reportViewLabel(activeReportView),
      ...(activeReportView === "el-assessments"
        ? { "EL assessment period": teacherResultText(activeBenchmarkScope?.label) || "No assessment period selected" }
        : {})
    },
    evidenceSource: reportEvidenceSource,
    definitions: "Figures and result labels are explained in the report sections where they appear."
  }), [
    activeBenchmarkScope?.label,
    activeReportView,
    assessmentHistory,
    className,
    progressScopeKey,
    reportEvidenceSource,
    reportGeneratedAt,
    reportTimeZone,
    studentName
  ]);

  const changeReportView = useCallback(viewId => {
    const nextView = normalizeStudentReportView(viewId);
    setReportSelection({ contextKey: reportContextKey, view: nextView });
    setActionFeedback(null);
    onReportViewChange?.(nextView);
  }, [onReportViewChange, reportContextKey]);

  async function exportActiveReport() {
    if (benchmarkExporting) return;
    if (!evidenceReady) {
      setActionFeedback({
        kind: "error",
        message: "All saved results must finish loading before this report can be downloaded."
      });
      return;
    }
    setActionFeedback({ kind: "pending", message: "Preparing report data..." });
    try {
      if (activeReportView === "el-assessments") {
        const downloaded = await exportSelectedBenchmarkScope(activeBenchmarkScope);
        if (!downloaded) return;
      } else if (activeReportView === "guided-reading") {
        await exportReadingReport?.();
      } else if (activeReportView === "hfw") {
        const rows = buildSimpleHfwRows(reportingWorkspace, studentName).map(row => ({
          student: studentName,
          word: row.key,
          exposures: row.attempts,
          correctAnswers: row.correct ?? "",
          accuracyPercent: row.accuracy ?? "",
          accuracyBand: row.band,
          learningStatus: row.statusLabel
        }));
        const date = new Date().toISOString().slice(0, 10);
        const downloaded = downloadReportRows(
          rows,
          `${safeReportFilename(studentName)}-high-frequency-words-${date}.csv`
        );
        if (!downloaded) throw new Error("No high-frequency-word rows are available for export.");
      } else {
        const rows = buildStudentWorkspaceCsvRows(activeReportView, reportingWorkspace, {
          className,
          learnerName: studentName,
          learnerId: progressScopeKey || assessmentHistory[0]?.studentId || "",
          generatedAt: reportGeneratedAt,
          timeZone: reportTimeZone,
          filters: { "Report view": activeReportView },
          evidenceSource: reportEvidenceSource
        });
        const date = new Date().toISOString().slice(0, 10);
        const downloaded = downloadReportRows(
          rows,
          `${safeReportFilename(studentName)}-${activeReportView}-${date}.csv`
        );
        if (!downloaded) throw new Error("No report rows are available for export.");
      }
      setActionFeedback({ kind: "success", message: "Report data downloaded." });
    } catch (error) {
      console.error("Student report export failed:", error);
      setActionFeedback({
        kind: "error",
        message: "The report could not be downloaded. Try again."
      });
    }
  }

  function printActiveReport() {
    if (!evidenceReady) {
      setActionFeedback({
        kind: "error",
        message: "All saved results must finish loading before this report can be printed."
      });
      return;
    }
    setActionFeedback({ kind: "pending", message: "Opening the print dialog..." });
    window.requestAnimationFrame(() => {
      try {
        window.print();
        setActionFeedback({
          kind: "success",
          message: "Print dialog opened. Choose a printer or save as PDF."
        });
      } catch {
        setActionFeedback({
          kind: "error",
          message: "The print dialog could not be opened. Try again."
        });
      }
    });
  }

  const hasResolvedBenchmarkExportScope = normalizeElExportScope(activeBenchmarkScope).isRouteScoped;
  const exportConfig = activeReportView === "el-assessments"
    ? {
        label: benchmarkExporting
          ? "Preparing EL data…"
          : hasResolvedBenchmarkExportScope
            ? "Download EL data"
            : "Choose an assessment period",
        enabled: Boolean(exportStudentExcel && hasResolvedBenchmarkExportScope)
      }
    : activeReportView === "guided-reading"
      ? { label: "Download reading data", enabled: Boolean(exportReadingReport) }
      : activeReportView === "whole-child"
        ? { label: "Download knowledge data", enabled: Boolean(
            reportingWorkspace.wholeChild?.concepts?.length ||
            reportingWorkspace.wholeChild?.descriptiveAssessments?.length
          ) }
        : activeReportView === "skills-check"
          ? { label: "Download skills assessment data", enabled: Boolean(
              reportingWorkspace.skillsCheck?.items?.length ||
              reportingWorkspace.skillsCheck?.skills?.length ||
              reportingWorkspace.skillsCheck?.attempts?.length
            ) }
          : activeReportView === "hfw"
            ? { label: "Download HFW data", enabled: true }
          : activeReportView === "other-learning"
            ? { label: "Download practice data", enabled: Boolean(reportingWorkspace.otherLearning?.evidence?.length) }
            : { label: "", enabled: false };

  const elReport = reportingWorkspace.elAssessments;
  const elAssessments = elReport?.assessments || [];
  const assessmentAction = activeReportView === "skills-check"
    ? { label: "Start an assessment", handler: startAssessment }
    : ["whole-child", "el-assessments"].includes(activeReportView) && openChecks
      ? { label: "Open assessments", handler: openChecks }
      : null;
  const evidenceStatus = evidenceReadState?.syncStatus || "";
  const incompleteReportFeedback = evidenceReady
    ? null
    : evidenceStatus === "loading"
      ? {
          kind: "pending",
          message: "Loading all saved results. The report may change until this finishes, so printing and downloads are paused."
        }
      : {
          kind: "error",
          message: "Some saved results could not be confirmed. This report may be incomplete, so printing and downloads are paused.",
          actionLabel: onRetryEvidence ? "Try again" : "",
          onAction: onRetryEvidence
        };

  return (
    <>
    <StudentReportShell
      activeView={activeReportView}
      backLabel={backLabel}
      buildViewHref={buildReportHref}
      className={formatClassLabel(className)}
      exportDisabled={!evidenceReady || benchmarkExporting || actionFeedback?.kind === "pending"}
      exportLabel={exportConfig.label}
      focusHeadingOnMount={focusHeadingOnMount}
      generatedLabel={evidenceReady
        ? latestResultDate
          ? `Results updated ${latestResultDate}`
          : "No dated results saved"
        : evidenceStatus === "loading"
          ? "Checking saved results"
          : "Saved results unavailable"}
      onBack={returnToTeacherDashboard}
      onExport={exportConfig.enabled || !evidenceReady ? exportActiveReport : null}
      onPrint={printActiveReport}
      printDisabled={!evidenceReady}
      onStartAssessment={assessmentAction?.handler}
      onViewChange={changeReportView}
      provenanceRows={visibleReportDetails(reportProvenanceRows)}
      readHistoryView={readReportRouteView}
      startAssessmentLabel={assessmentAction?.label}
      feedback={actionFeedback || incompleteReportFeedback}
      statusMessage={reportStatusMessage}
      studentName={studentName}
    >
      {!evidenceReady && (
        <TeacherSurfaceState
          compact
          detail={evidenceStatus === "loading"
            ? "The report will open after every saved result has been checked."
            : "The report is paused because every saved result could not be confirmed. Missing results are not shown as zero or as not yet assessed."}
          onPrimaryAction={evidenceStatus === "loading" ? undefined : onRetryEvidence}
          state={evidenceStatus === "loading" ? "loading" : "partial"}
          surface="progress"
        />
      )}

      {evidenceReady && (
        <>
          {activeReportView === "whole-child" && (
            <SimpleOverviewReportView
              workspace={reportingWorkspace}
              studentName={studentName}
              onStartAssessment={openChecks}
            />
          )}

          {activeReportView === "el-assessments" && (
            <div className="lg-report-view-stack">
              <ReportMetricStrip metrics={[
                { label: "Assessments completed", value: progressPhrase(elReport?.summary?.assessmentsChecked || 0, 6) },
                { label: "Saved assessments", value: elReport?.summary?.completedHistoryAttempts || 0 },
                { label: "Latest results", value: elReport?.summary?.latestAt ? new Date(elReport.summary.latestAt).toLocaleDateString() : "Not checked" }
              ]} />

              <ReportSection
                description="Letter and advanced-sound assessments keep their original scoring."
                title="Letter and sound assessments"
              >
                <div className="lg-report-assessment-grid two-up">
                  {elAssessments.slice(0, 2).map(assessment => (
                    <article className="lg-report-assessment-card" key={assessment.assessmentId}>
                      <div>
                        <span>Assessment {assessment.number}</span>
                        <h3>{assessment.title}</h3>
                      </div>
                      <strong>{teacherResultText(assessment.resultLabel) || "Not checked"}</strong>
                      <p>{assessment.checked
                        ? `${countPhrase(assessment.attemptCount || 1, "saved assessment")}.`
                        : "No completed result has been recorded."}</p>
                      {assessment.latestAt && <small>Latest: {new Date(assessment.latestAt).toLocaleDateString()}</small>}
                    </article>
                  ))}
                </div>
                <details className="lg-report-technical-details">
                  <summary>View answers from the latest assessments</summary>
                  <ElCompletedAssessmentItems assessments={elAssessments.slice(0, 2)} />
                </details>
              </ReportSection>

              <ReportSection
                description="These records show what the student did in each completed assessment."
                title="Reading assessments"
              >
                <BenchmarkScopeControl
                  activeScope={activeBenchmarkScope}
                  evidenceReady={evidenceReady}
                  exporting={benchmarkExporting}
                  exportStudentExcel={exportStudentExcel ? exportSelectedBenchmarkScope : null}
                  manualScope={activeManualBenchmarkScope}
                  onChange={key => setBenchmarkScopeSelection({ owner: progressScopeKey, key })}
                  onManualChange={scope => setManualBenchmarkScope({
                    owner: progressScopeKey,
                    grade: scope.grade || "",
                    benchmarkWindow: scope.benchmarkWindow || ""
                  })}
                  options={benchmarkScopeOptions}
                />
                <div className="lg-report-assessment-grid">
                  {elAssessments.slice(2).map(assessment => (
                    <article className="lg-report-assessment-card" key={assessment.assessmentId}>
                      <div>
                        <span>Assessment {assessment.number}</span>
                        <h3>{assessment.title}</h3>
                      </div>
                      <strong>{teacherResultText(assessment.resultLabel) || "Not checked"}</strong>
                      <p>{teacherResultText(assessment.interpretation) || "No results have been recorded."}</p>
                      {assessment.latestAt && <small>Latest: {new Date(assessment.latestAt).toLocaleDateString()}</small>}
                    </article>
                  ))}
                </div>
                <details className="lg-report-technical-details">
                  <summary>View questions, answers and notes</summary>
                  <ElBenchmarkEvidenceSection report={elBenchmarkReport} />
                </details>
              </ReportSection>
            </div>
          )}

          {activeReportView === "guided-reading" && (
            <GuidedReadingReportView
              error={activeGuidedReadingLoad.status === "error" ? activeGuidedReadingLoad.error : ""}
              loading={activeGuidedReadingLoad.status === "loading"}
              onRetry={() => setGuidedReadingRetry(value => value + 1)}
              report={guidedReadingViewModel}
            />
          )}

          {activeReportView === "skills-check" && (
            <SimpleSkillsReportView
              workspace={reportingWorkspace}
              studentName={studentName}
              onStartAssessment={startAssessment}
            />
          )}

          {activeReportView === "hfw" && (
            <SimpleHfwReportView
              workspace={reportingWorkspace}
              studentName={studentName}
              onStartAssessment={openChecks}
            />
          )}

          {activeReportView === "other-learning" && (
            <OtherLearningReportView report={otherLearningViewModel} />
          )}

          <footer className="lg-report-footer">
            {activeReportView === "el-assessments"
              ? "Literacy Guide. EL assessment results are reported separately from everyday practice and mastery."
              : `Literacy Guide. ${TEACHER_COPY.reports.accuracyFooter}`}
          </footer>
        </>
      )}
    </StudentReportShell>
    <TeacherDialog
      className="modal-backdrop"
      labelledBy="empty-el-export-title"
      onClose={() => setEmptyElExportScope(null)}
      open={Boolean(emptyElExportScope)}
    >
      <section className="modal-card empty-el-export-dialog">
        <h2 id="empty-el-export-title">
          {emptyElExportScope?.emptyReport
            ? `Nothing to report for ${studentName || "this student"}`
            : `No saved EL assessments for ${studentName || "this student"}`}
        </h2>
        <p>No saved EL results are available. Complete or save an assessment first.</p>
        <p>
          {emptyElExportScope?.emptyReport
            ? "If you download it anyway, the workbook will clearly say that no results were found. It will keep the chosen grade and time of year, without adding empty rows."
            : "If you download it anyway, the workbook will include any matching letter-assessment results and will not add empty EL rows."}
        </p>
        <div className="button-row">
          <button
            className="report-button"
            disabled={benchmarkExporting}
            onClick={() => setEmptyElExportScope(null)}
            type="button"
          >
            Go back
          </button>
          <button
            className="lp-button lp-button-primary"
            data-autofocus
            disabled={benchmarkExporting}
            onClick={async () => {
              const pendingDecision = emptyElExportScope;
              setEmptyElExportScope(null);
              try {
                const downloaded = await exportSelectedBenchmarkScope(
                  pendingDecision?.scope,
                  { emptyConfirmed: true }
                );
                if (downloaded) {
                  setActionFeedback({
                    kind: "success",
                    message: pendingDecision?.emptyReport
                      ? "The empty report was downloaded with a clear notice."
                      : "The report was downloaded with matching letter-assessment results."
                  });
                }
              } catch (error) {
                console.error("Empty EL report export failed:", error);
                setActionFeedback({ kind: "error", message: "The empty report could not be downloaded. Try again." });
              }
            }}
            type="button"
          >
            Download anyway
          </button>
        </div>
      </section>
    </TeacherDialog>
    </>
  );
}
