/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SchoolNameInput } from "./SchoolNameInput.jsx";
import { readErrorLog, clearErrorLog } from "../utils/errorLog.js";
import { MapStopEditor } from "./admin/MapStopEditor.jsx";
import { HollowSpotEditor } from "./admin/HollowSpotEditor.jsx";
import {
  buildMediaQaRecords,
  MEDIA_QA_STATUSES,
  readMediaQaOverrides,
  updateMediaQaRecords
} from "../data/mediaQaManifest";
import { guidedReadingBooks } from "../data/guidedReadingBooks";
import { addDeletedMediaRecords, isMediaDeleted } from "../data/deletedMediaManifest";
import { enrichGuidedReadingBook } from "../utils/guidedReading/phonicsPageAnalyzer";
import { recommendBooksForStudent } from "../utils/guidedReading/recommendBooksForStudent";
import {
  GUIDED_READING_MOVE_LEVELS,
  applyGuidedReadingLevelOverride,
  readGuidedReadingLevelOverrides,
  setGuidedReadingLevelOverride
} from "../utils/guidedReading/bookLevelOverrides";
import { exportAssessmentAttemptsCsv } from "../data/assessmentHistoryStore";
import { assessmentHistoryExportReadiness } from "../data/assessmentHistoryExportPolicy.js";
import { buildClassReportModel } from "../data/reportingSystem.js";
import { LEARNING_EVIDENCE_POLICY } from "../policy/learningPolicy.js";
import {
  buildClassElAssessmentReportData,
  deleteSavedElAssessmentReport,
  getSavedElAssessmentReports,
  hydrateElAssessmentReports
} from "../data/elAssessmentReportStore.js";
import { resolveElBenchmarkReportScope } from "../data/elFormalAssessmentReportBuilder.js";
import { displayBenchmarkScopeLabel } from "../data/elBenchmarkReportScope.js";
import {
  downloadElAssessmentReport,
  exportClassElAssessmentExcel
} from "../utils/exportElAssessmentExcel.js";
import { importWithRetry } from "../utils/lazyWithRetry.js";
import {
  printTeacherDocument,
  TEACHER_PRINT_TARGETS
} from "../utils/teacherPrintTarget.js";
import {
  buildExportProvenanceRows,
  exportProvenanceCsvPreamble
} from "../utils/exportProvenance.js";
import assessmentAudioCoverage from "../content/assessments/assessmentAudioCoverageSummary.generated.json";
import guidedReadingImageTextQa from "../content/guidedReading/imageTextArtifactSummary.generated.json";
import guidedReadingWordAudioCoverage from "../content/guidedReading/wordAudioCoverageSummary.generated.json";
import {
  HFW_QUESTION_IMAGE_QA_STATUSES,
  HFW_QUESTION_IMAGE_REJECTION_REASONS,
  mergeHfwQuestionImageReviewRows,
  readHfwQuestionImageReviewOverrides,
  updateHfwQuestionImageReviewOverride
} from "../data/hfwQuestionImageReview.js";
import { QuestionFlagReviewPage } from "./admin/QuestionFlagReviewPage.jsx";
import { SchoolRetentionPolicyPanel } from "./admin/SchoolRetentionPolicyPanel.jsx";
import { TeacherActivitySyncHealth } from "./teacher/TeacherActivitySyncHealth.jsx";
import { TeacherDialog } from "./teacher/ui/TeacherDialog.jsx";
import { LearnerDataRightsDialog } from "./teacher/LearnerDataRightsDialog.jsx";
import { clearLocalElAssessmentDataForStudent } from "../utils/elAssessmentReset.js";
import { clearAndVerifyLocalProgressForStudent } from "../utils/progressSync.js";
import { resetRetiredMediaQaReviewStorage } from "../data/questionFlagStore.js";
import {
  FLEET_ERROR_BUDGET_POLICY,
  evaluateFleetErrorBudget
} from "../policy/fleetErrorBudget.js";
import { CalibrationMonitoringPanel } from "./admin/CalibrationMonitoringPanel.jsx";
import { ElClassReportDocument } from "./reports/ElClassReportDocument.jsx";
import { buildQuestionBankCoverage } from "../appState/assessmentRuntime.js";
import { curriculumReleaseBoard } from "../content/assessments/curriculumReleaseBoard.generated.js";
import {
  ADMIN_SECTION_ROUTES,
  adminPathForSection,
  adminQaHistoryState,
  adminRouteForPath,
  shouldCloseAdminQaWithHistoryBack,
  withoutAdminQaHistoryState
} from "../appState/adminQaNavigation.js";
import {
  TEACHER_ACCOUNT_DECISION_STATUSES,
  resolveTeacherAccountSchool,
  validateTeacherAccountDecision
} from "../appState/adminAccountDecision.js";
import {
  loadTeacherAccountDecisionHistory
} from "../data/teacherAccountDecisionHistory.js";

const GUIDED_IMAGE_QA_STORAGE_KEY = "lpGuidedReadingImageQa";
const GUIDED_IMAGE_QA_RESET_KEY = "lpGuidedReadingImageQaResetVersion";
const GUIDED_IMAGE_QA_RESET_VERSION = "2026-05-27-book-level-controls";
const GUIDED_IMAGE_QA_STATUSES = [
  "unreviewed",
  "moved_level",
  "deleted"
];

function downloadTextFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function formatClassReportDate(value) {
  if (!value) return "No date yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "No date yet";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function shortClassReportSkillName(value = "") {
  return String(value || "")
    .replace("High-Frequency Words", "HFW")
    .replace("Long Vowels / Silent E", "Long Vowels")
    .replace("CVC / Short Vowels", "CVC");
}

function reportPercentage(value, unavailable = "Not enough results") {
  if (value === "" || value === null || value === undefined) return unavailable;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric)}%` : unavailable;
}

function reportStatusCount(model, statusId) {
  return model.snapshot.statusDistribution
    ?.find(row => row.statusId === statusId)?.count || 0;
}

function ClassReportPage({ children, className = "", model, pageNumber }) {
  const teacherLabel = model.teacherName || "Teacher";
  const generated = formatClassReportDate(model.generatedAt);
  return (
    <section className={`formal-class-report-page ${className}`}>
      <div className="formal-class-report-running-header">
        <span>Literacy Guide · Class Report</span>
        <span>{model.className} · {teacherLabel}</span>
      </div>
      <div className="formal-class-report-page-body">
        {children}
      </div>
      <div className="formal-class-report-running-footer">
        <span>{pageNumber ? `Page ${pageNumber}` : ""}</span>
        <span>Generated {generated}</span>
      </div>
    </section>
  );
}

function ClassReportSectionBand({ title, subtitle, accent = "#0b6e68", children }) {
  return (
    <section className="formal-class-report-section-band" style={{ "--class-section-accent": accent }}>
      <div className="formal-class-report-section-stripe" aria-hidden="true"></div>
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

function ClassReportMetric({ label, value, tone = "teal" }) {
  return (
    <article className={`formal-class-report-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ClassGrowthSummary({ rows = [] }) {
  if (!rows.length) {
    return <div className="formal-class-report-empty">No class growth data yet.</div>;
  }
  return (
    <div className="formal-class-growth-list">
      {rows.slice(0, 8).map((row, index) => {
        const accuracy = Number.isFinite(Number(row.accuracy)) ? Number(row.accuracy) : null;
        const delta = Number.isFinite(Number(row.delta)) ? Number(row.delta) : null;
        return (
          <div className={`formal-class-growth-row tone-${index % 6}`} key={row.canonicalSkillName || row.skillName}>
            <div>
              <strong>{row.skillName}</strong>
              <span>{row.mastered} secure · {row.developing} developing · {row.needsSupport} need support</span>
            </div>
            <div
              className="formal-class-growth-track"
              aria-label={accuracy === null
                ? `${row.skillName}: not enough comparable results`
                : `${row.skillName}: ${Math.round(accuracy)}%`}
            >
              {accuracy !== null && (
                <span style={{ width: `${Math.max(0, Math.min(100, accuracy))}%` }}></span>
              )}
            </div>
            <b>{reportPercentage(accuracy)}</b>
            <em>{delta === null ? "—" : delta > 0 ? `+${delta}` : delta}</em>
          </div>
        );
      })}
    </div>
  );
}

function ClassReportTable({ columns = [], rows = [], emptyText = "No report data yet.", tone = "teal" }) {
  return (
    <div className="formal-class-report-table-wrap">
      <table className={`formal-class-report-table ${tone}`}>
        <thead>
          <tr>
            {columns.map(column => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={row.id || row.skill || row.studentId || `${row.label}-${index}`}>
              {columns.map(column => (
                <td data-label={column.label} key={column.key}>
                  {column.render ? column.render(row, index) : row[column.key]}
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

function StudentProgressGrid({ model }) {
  const skillColumns = model.heatmap.slice(0, 8);
  const heatmapByStudent = new Map(model.studentRows.map(student => [student.studentId, new Map()]));
  model.heatmap.forEach(skill => {
    skill.cells.forEach(cell => {
      heatmapByStudent.get(cell.studentId)?.set(skill.skillName, cell);
    });
  });

  return (
    <div className="formal-class-progress-grid-wrap">
      <div className="formal-class-progress-legend">
        <span className="mastered">Secure</span>
        <span className="developing">Developing</span>
        <span className="needs-support">Needs support</span>
        <span className="not-enough-evidence">Not enough results</span>
        <span className="not-assessed">Not checked</span>
      </div>
      <table className="formal-class-progress-grid">
        <thead>
          <tr>
            <th>Student</th>
            {skillColumns.map(skill => (
              <th key={skill.skillName}>{shortClassReportSkillName(skill.displaySkillName)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.studentRows.length ? model.studentRows.map(student => {
            const bySkill = heatmapByStudent.get(student.studentId) || new Map();
            return (
              <tr key={student.studentId}>
                <td>
                  <strong>{student.studentName}</strong>
                  <span>{student.status?.label || "Not enough results"}</span>
                  {student.selectedPeriodTotalQuestions > 0 && (
                    <small>
                      Selected period: {student.selectedPeriodCorrectCount}/
                      {student.selectedPeriodTotalQuestions} correct (
                      {reportPercentage(student.selectedPeriodAccuracy)})
                    </small>
                  )}
                </td>
                {skillColumns.map(skill => {
                  const cell = bySkill.get(skill.skillName);
                  const statusId = cell?.statusId || "not_assessed";
                  const cellLabel = statusId === "not_assessed"
                    ? "Not checked"
                    : statusId === "not_enough_evidence"
                      ? "Not enough results"
                      : `${reportPercentage(cell?.accuracy, "No score")} · ${cell?.statusLabel}`;
                  const selectedPeriodLabel = cell?.selectedPeriodScoredResponses > 0
                    ? `Selected period: ${cell.selectedPeriodCorrectResponses}/${cell.selectedPeriodScoredResponses} correct (${reportPercentage(cell.selectedPeriodAccuracy)})`
                    : "";
                  return (
                    <td key={`${student.studentId}-${skill.skillName}`}>
                      <span
                        aria-label={`${student.studentName}, ${skill.displaySkillName}: ${cellLabel}${selectedPeriodLabel ? `. ${selectedPeriodLabel}` : ""}`}
                        className={`formal-class-progress-cell ${statusId}`}
                      >
                        {cellLabel}
                      </span>
                      {cell?.savedAnswers > 0 && selectedPeriodLabel ? (
                        <small>{selectedPeriodLabel}</small>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={skillColumns.length + 1}>No students are available for this class report yet.</td>
            </tr>
          )}
        </tbody>
      </table>
      {model.heatmap.length > skillColumns.length && (
        <p className="formal-class-report-note">Showing the first {skillColumns.length} assessed skill columns on screen. Excel export includes the full assessment matrix.</p>
      )}
    </div>
  );
}

function FocusGroups({ groups = [] }) {
  if (!groups.length) {
    return <div className="formal-class-report-empty">No shared focus groups are suggested yet.</div>;
  }
  return (
    <div className="formal-class-focus-groups">
      {groups.slice(0, 4).map((group, index) => (
        <article className={`formal-class-focus-card ${group.style || "teal"}`} key={`${group.focus}-${index}`}>
          <span>{group.groupName || `Group ${index + 1}`}</span>
          <h4>{group.focus}</h4>
          <strong>Students:</strong>
          <ul>
            {group.students.map(student => <li key={student}>{student}</li>)}
          </ul>
          <p>Suggested activity:</p>
          <b>{group.suggestedActivity}</b>
        </article>
      ))}
    </div>
  );
}

function ReportProvenanceBlock({ rows = [] }) {
  if (!rows.length) return null;
  return (
    <section className="formal-class-report-provenance" aria-label="Report details">
      <h3>Report details</h3>
      <dl>
        {rows.map(row => (
          <div key={row.field}>
            <dt>{row.field}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FormalClassReportDocument({
  model,
  provenanceOptions = {},
  provenanceRows = []
}) {
  const resolvedProvenanceRows = provenanceRows.length ? provenanceRows : buildExportProvenanceRows({
    reportTitle: "Class Progress Report",
    className: model.className,
    learnerCount: model.snapshot.totalStudents,
    generatedAt: model.generatedAt,
    filters: { Class: model.className },
    evidenceSource: model.provenanceEvidence || [],
    definitions: `Average accuracy = correct responses ÷ scored responses; Secure = at least ${LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum}%; Developing = ${LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum}–${LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum - 1}%; Needs support = below ${LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum}%; Not enough results = fewer than ${LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses} scored responses.`,
    ...provenanceOptions
  });
  const generated = formatClassReportDate(model.generatedAt);
  const hasClassPriorities = model.masteryRows.length > 0 || model.focusRows.length > 0;
  const hasProgressGrid = model.studentRows.length > 0 && model.heatmap.length > 0;
  const hasReadingRows = model.readingRows.length > 0;
  const hasGroups = model.groups.length > 0;
  let nextPageNumber = 1;
  const pageNumbers = {
    snapshot: nextPageNumber++,
    priorities: hasClassPriorities || hasGroups ? nextPageNumber++ : null,
    progress: hasProgressGrid ? nextPageNumber++ : null,
    reading: hasReadingRows ? nextPageNumber++ : null,
    details: nextPageNumber
  };
  const metricRows = [
    ["Students", model.snapshot.totalStudents, "teal"],
    ["Enough results", `${model.snapshot.policyReadyStudents} of ${model.snapshot.totalStudents}`, "blue"],
    ["Answer accuracy", reportPercentage(model.snapshot.averageAccuracy), "teal"],
    ["Skills assessed", model.snapshot.totalSkillsAssessed, "blue"],
    ["Secure class skills", model.snapshot.skillsAtClassMastery, "green"],
    ["Skills to teach next", model.focusRows.length, "red"],
    ["Not enough results", reportStatusCount(model, "not_enough_evidence"), "amber"],
    ["Not checked", reportStatusCount(model, "not_started"), "teal"]
  ];

  return (
    <article className="formal-class-report-document" aria-label={`Class report for ${model.className}`}>
      <ClassReportPage model={model} pageNumber={pageNumbers.snapshot}>
        <header className="formal-class-report-hero">
          <span>Class report</span>
          <h1>{model.className}</h1>
          <p>{model.teacherName || "Teacher"} · {model.snapshot.totalStudents} students · Generated {generated}</p>
        </header>
        <ClassReportSectionBand
          title="Class snapshot"
          subtitle="A quick view of saved results for the selected period. Status and accuracy are kept separate."
        >
          <div className="formal-class-report-metrics">
            {metricRows.map(([label, value, tone]) => (
              <ClassReportMetric key={label} label={label} value={value} tone={tone} />
            ))}
          </div>
        </ClassReportSectionBand>
        {model.growthAreas.length > 0 && (
          <ClassReportSectionBand
            title="Change over time"
            subtitle="Shown only when two fair, comparable result windows are available."
            accent="#2563eb"
          >
            <ClassGrowthSummary rows={model.growthAreas} />
          </ClassReportSectionBand>
        )}
        {!model.comparability?.comparable && (
          <div className="formal-class-report-empty">
            A class accuracy appears once enough students have enough recent results for a fair comparison.
          </div>
        )}
      </ClassReportPage>

      {(hasClassPriorities || hasGroups) && (
        <ClassReportPage model={model} pageNumber={pageNumbers.priorities}>
          {model.masteryRows.length > 0 && (
            <ClassReportSectionBand title="Secure class skills" subtitle="Skills with enough fair results to support a class-level judgement." accent="#15803d">
              <ClassReportTable
                tone="green"
                columns={[
                  { key: "skill", label: "Skill" },
                  { key: "classAccuracy", label: "Class accuracy", render: row => reportPercentage(row.classAccuracy) },
                  { key: "mastered", label: "Secure" },
                  { key: "developing", label: "Developing" },
                  { key: "needsSupport", label: "Needs support" },
                  { key: "note", label: "Note" }
                ]}
                rows={model.masteryRows}
              />
            </ClassReportSectionBand>
          )}
          {model.focusRows.length > 0 && (
            <ClassReportSectionBand title="Teach next" subtitle="Skills with enough fair results to show a shared support need." accent="#b91c1c">
              <ClassReportTable
                tone="red"
                columns={[
                  { key: "skill", label: "Skill" },
                  { key: "classAccuracy", label: "Class accuracy", render: row => reportPercentage(row.classAccuracy) },
                  { key: "students", label: "Students", render: row => row.students.join(", ") || "No group yet" },
                  { key: "suggestedAction", label: "Suggested activity" }
                ]}
                rows={model.focusRows}
              />
            </ClassReportSectionBand>
          )}
          {hasGroups && (
            <ClassReportSectionBand title="Suggested groups" subtitle="Students who share a current skill need." accent="#6d28d9">
              <FocusGroups groups={model.groups} />
            </ClassReportSectionBand>
          )}
        </ClassReportPage>
      )}

      {hasProgressGrid && (
        <ClassReportPage model={model} pageNumber={pageNumbers.progress}>
          <ClassReportSectionBand title="Student progress" subtitle="A quick scan of each student by assessed skill." accent="#1e293b">
            <StudentProgressGrid model={model} />
          </ClassReportSectionBand>
        </ClassReportPage>
      )}

      {hasReadingRows && (
        <ClassReportPage model={model} pageNumber={pageNumbers.reading}>
          <ClassReportSectionBand title="Reading summary" subtitle="Shown only when real Guided Reading records are included." accent="#15803d">
            <ClassReportTable
              tone="green"
              columns={[
                { key: "studentName", label: "Student" },
                { key: "level", label: "Level" },
                { key: "reads", label: "Reads" },
                { key: "accuracy", label: "Accuracy", render: row => reportPercentage(row.accuracy, "Not recorded") },
                { key: "trend", label: "Trend" },
                { key: "note", label: "Note" }
              ]}
              rows={model.readingRows}
            />
          </ClassReportSectionBand>
        </ClassReportPage>
      )}

      <ClassReportPage className="formal-class-report-print-details" model={model} pageNumber={pageNumbers.details}>
        <ClassReportSectionBand title="Report details" subtitle="Class, result dates, definitions and privacy handling." accent="#1e3a5f">
          <ReportProvenanceBlock rows={resolvedProvenanceRows} />
        </ClassReportSectionBand>
        <footer className="formal-class-report-final-footer">
          Generated by Literacy Guide · {model.className} · {model.teacherName || "Teacher"} · {generated} · For teacher use only
        </footer>
      </ClassReportPage>
    </article>
  );
}

function mediaQaToCsv(records) {
  const headers = [
    "mediaType",
    "targetWord",
    "skillId",
    "skillName",
    "level",
    "filePath",
    "status",
    "rejectionReason",
    "reviewerNotes",
    "replacementPath",
    "linkedQuestionCount",
    "heuristicFlags"
  ];
  return [
    headers.join(","),
    ...records.map(record => [
      record.mediaType,
      record.targetWord,
      record.skillId,
      record.skillName,
      record.level,
      record.filePath,
      record.status,
      record.rejectionReason,
      record.reviewerNotes,
      record.replacementPath,
      record.linkedQuestionIds?.length || 0,
      (record.heuristicFlags || []).join("; ")
    ].map(csvEscape).join(","))
  ].join("\n");
}

function mediaQaToKimiMarkdown(records, mediaType) {
  const title = mediaType === "image" ? "Kimi Image Replacement Request" : "Kimi Audio Replacement Request";
  const globalRules = mediaType === "image"
    ? "Create a clean educational flashcard-style cartoon illustration of a single target object. Plain pure white background. Centered object only. No shadow, glow, aura, sparkles, rainbow coloring, face, eyes, smile, arms, legs, text, or background scene. Use natural realistic colors and high readability at small size."
    : "Record a clear spoken word or phrase only. Use neutral adult female American English, correct pronunciation, normalized volume, no music, no sound effects, no clipping, no background noise, and short silence before/after.";

  const grouped = records.reduce((map, record) => {
    const key = record.skillName || record.skillId || "Uncategorized";
    map.set(key, [...(map.get(key) || []), record]);
    return map;
  }, new Map());

  return [
    `# ${title}`,
    "",
    "## Status Meanings",
    "",
    "- `needs_kimi`: no usable asset is available, so Kimi must create one.",
    "- `rejected`: an existing asset failed QA and must be replaced with a new asset that meets the rules.",
    "- `blocked`: do not serve this asset to students; regenerate only if this target should remain active.",
    "",
    "## Global Rules",
    "",
    globalRules,
    "",
    ...[...grouped.entries()].flatMap(([skill, rows]) => [
      `## ${skill}`,
      "",
      ...rows.map(record => [
        `### ${record.targetWord || record.filePath}`,
        "",
        `- Target word/text: ${record.targetWord || ""}`,
        `- QA status: ${record.status}`,
        `- Required path: ${record.replacementPath || record.filePath}`,
        `- Current path: ${record.filePath}`,
        `- Reason: ${getKimiRequestReason(record)}`,
        `- Prompt: ${mediaType === "image"
          ? `Create one clear, natural-colored, cute educational cartoon image of ${record.targetWord || "the target object"}. ${globalRules}`
          : `Record "${record.targetWord || "target audio"}". ${globalRules}`}`,
        ""
      ].join("\n"))
    ])
  ].join("\n");
}

function statusLabel(status) {
  if (status === "strong") return "On track";
  if (status === "watch") return "Developing";
  if (status === "support") return "Needs support";
  if (status === "empty") return "No data";
  return String(status || "").replaceAll("_", " ");
}

function getTeacherAccountApprovalStatus(account = {}) {
  return String(account.approval_status || account.status || "pending").toLowerCase();
}

function isPendingTeacherAccount(account = {}) {
  return getTeacherAccountApprovalStatus(account) === "pending";
}

function getClassId(row = {}) {
  return row.id || row.classId || row.class_id || "";
}

function getStudentClassId(row = {}) {
  return row.classId || row.class_id || "";
}

function getTeacherId(row = {}) {
  return row.id || row.teacherId || row.teacher_id || row.user_id || "";
}

function getClassTeacherId(row = {}) {
  return row.teacherId || row.teacher_id || row.user_id || "";
}

function getReadinessStatusClass(status = "") {
  if (status === "action") return "action";
  if (status === "review") return "review";
  return "ready";
}

function getBenchmarkScopeKey(scope = {}) {
  return `${scope.grade || ""}::${scope.benchmarkWindow || ""}`;
}

function ElBenchmarkScopeSelect({ activeScope = {}, onChange, options = [] }) {
  return (
    <label>
      Benchmark grade and window (Excel)
      <select
        aria-label="Benchmark grade and assessment window"
        disabled={options.length === 0}
        onChange={event => onChange(event.target.value)}
        value={options.length ? getBenchmarkScopeKey(activeScope) : ""}
      >
        {options.length === 0 && <option value="">No saved benchmark routes</option>}
        {options.map((scope, index) => (
          <option key={getBenchmarkScopeKey(scope)} value={getBenchmarkScopeKey(scope)}>
            {scope.label} ({scope.attemptCount} {scope.attemptCount === 1 ? "attempt" : "attempts"}){index === 0 ? " - most recent" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildReleaseReadinessModel({
  teachers = [],
  classes = [],
  students = [],
  pendingSignupAccounts = [],
  pendingAccountsWarning = "",
  questionBankCoverage = [],
  mediaQuestions = [],
  assessmentHistory = [],
  guidedReadingInsight = {},
  savedElReports = []
}) {
  const classIds = new Set(classes.map(getClassId).filter(Boolean));
  const teacherIds = new Set(teachers.map(getTeacherId).filter(Boolean));
  const studentsByClass = students.reduce((map, student) => {
    const classId = getStudentClassId(student);
    if (!classId) return map;
    map.set(classId, (map.get(classId) || 0) + 1);
    return map;
  }, new Map());
  const studentsWithoutClass = students.filter(student => {
    const classId = getStudentClassId(student);
    return !classId || !classIds.has(classId);
  });
  const emptyClasses = classes.filter(row => {
    const classId = getClassId(row);
    const explicitCount = Number(row.studentCount);
    if (Number.isFinite(explicitCount)) return explicitCount === 0;
    return !studentsByClass.get(classId);
  });
  const unassignedClasses = classes.filter(row => {
    const classTeacherId = getClassTeacherId(row);
    return !classTeacherId || (teacherIds.size > 0 && !teacherIds.has(classTeacherId));
  });
  const skillsBelowFloor = questionBankCoverage.filter(row =>
    Number(row.runtimeSelectable ?? row.active ?? row.total ?? 0) < 30
  );
  const mediaGapSkills = questionBankCoverage.filter(row =>
    Number(row.missingImage || 0) > 0 ||
    Number(row.missingAudio || 0) > 0 ||
    Number(row.badMedia || 0) > 0
  );
  const unapprovedAudioQuestions = questionBankCoverage.reduce(
    (total, row) => total + Number(row.unapprovedAudio || 0),
    0
  );
  const assessmentAudioIssues =
    Number(assessmentAudioCoverage.summary?.replacementNeededCount || 0) +
    Number(assessmentAudioCoverage.summary?.missingCount || 0) +
    Number(assessmentAudioCoverage.summary?.brokenReferenceCount || 0) +
    Number(assessmentAudioCoverage.summary?.needsHumanReviewCount || 0);
  const guidedMediaIssues =
    Number(guidedReadingInsight.draft || 0) +
    Number(guidedReadingInsight.missingImages || 0) +
    Number(guidedReadingInsight.missingText || 0) +
    Number(guidedReadingWordAudioCoverage.uniqueWordsMissingAudio || 0) +
    Number(guidedReadingImageTextQa.needsManualReviewCount || 0) +
    Number(guidedReadingImageTextQa.needsReplacementCount || 0);
  const actionCount = [
    pendingAccountsWarning,
    studentsWithoutClass.length,
    unassignedClasses.length,
    skillsBelowFloor.length,
    assessmentAudioIssues,
    guidedMediaIssues
  ].filter(Boolean).length;
  const reviewCount = [
    pendingSignupAccounts.length,
    emptyClasses.length,
    mediaGapSkills.length,
    assessmentHistory.length === 0 ? 1 : 0,
    savedElReports.length === 0 ? 1 : 0
  ].filter(Boolean).length;

  return {
    actionCount,
    reviewCount,
    summaryCards: [
      { label: "Must fix", value: actionCount, status: actionCount ? "action" : "ready" },
      { label: "Needs checking", value: reviewCount, status: reviewCount ? "review" : "ready" },
      { label: "Available questions", value: mediaQuestions.length, status: mediaQuestions.length ? "ready" : "review" },
      { label: "Saved results", value: assessmentHistory.length, status: assessmentHistory.length ? "ready" : "review" }
    ],
    checklist: [
      {
        label: "Roster cleanup",
        value: `${studentsWithoutClass.length} unlinked students`,
        detail: studentsWithoutClass.length ? "Open Students and link or remove the rows before release." : "All loaded students are tied to loaded classes.",
        status: studentsWithoutClass.length ? "action" : "ready",
        sectionId: "students"
      },
      {
        label: "Class ownership",
        value: `${unassignedClasses.length} class owner issues`,
        detail: unassignedClasses.length ? "Open Classes and confirm each class has a valid teacher owner." : "Every loaded class has an owner reference.",
        status: unassignedClasses.length ? "action" : "ready",
        sectionId: "classes"
      },
      {
        label: "Signup queue",
        value: pendingAccountsWarning ? "Unavailable" : `${pendingSignupAccounts.length} pending`,
        detail: pendingAccountsWarning || (pendingSignupAccounts.length ? "Approve or reject teacher requests before launch." : "No pending signup requests."),
        status: pendingAccountsWarning ? "action" : pendingSignupAccounts.length ? "review" : "ready",
        sectionId: "signups"
      },
      {
        label: "Report exports",
        value: savedElReports.length ? `${savedElReports.length} saved` : "Ready to generate",
        detail: assessmentHistory.length
          ? "Saved assessment results are ready to use in reports and downloads."
          : "Complete an assessment before creating a report or download.",
        status: assessmentHistory.length ? "ready" : "review",
        sectionId: "teacherReport"
      }
    ],
    cleanupRows: [
      { label: "Empty classes", value: emptyClasses.length, sectionId: "classes" },
      { label: "Students without loaded class", value: studentsWithoutClass.length, sectionId: "students" },
      { label: "Teacher signup requests", value: pendingAccountsWarning ? "Unavailable" : pendingSignupAccounts.length, sectionId: "signups" },
      { label: "Saved assessment attempts", value: assessmentHistory.length, sectionId: "archive" }
    ],
    qaRows: [
      {
        label: "Content coverage",
        value: `${skillsBelowFloor.length} below floor`,
        detail: `${mediaGapSkills.length} skills have media gaps or bad media flags; ${unapprovedAudioQuestions} authored questions have unapproved audio.`,
        status: skillsBelowFloor.length ? "action" : mediaGapSkills.length ? "review" : "ready",
        sectionId: "coverage"
      },
      {
        label: "Assessment audio",
        value: `${assessmentAudioIssues} issues`,
        detail: `${assessmentAudioCoverage.summary?.totalReferences || 0} audio references scanned.`,
        status: assessmentAudioIssues ? "action" : "ready",
        sectionId: "assessmentAudio"
      },
      {
        label: "Guided Reading media",
        value: `${guidedMediaIssues} issues`,
        detail: `${guidedReadingInsight.active || 0}/${guidedReadingInsight.total || 0} books visible.`,
        status: guidedMediaIssues ? "review" : "ready",
        sectionId: "guidedMediaQa"
      },
      {
        label: "Reported questions",
        value: "Check",
        detail: "Review reported question or image problems and record what needs checking.",
        status: "review",
        sectionId: "questionFlags"
      }
    ]
  };
}

function ReleaseStatusPill({ status }) {
  const statusClass = getReadinessStatusClass(status);
  const label = statusClass === "action" ? "Fix" : statusClass === "review" ? "Check" : "Ready";
  return <span className={`release-status-pill ${statusClass}`}>{label}</span>;
}

function ReleaseReadinessPanel({ model, onOpenSection, onOpenQuestionFlags }) {
  const openRow = row => {
    if (row.sectionId === "questionFlags") {
      onOpenQuestionFlags?.();
      return;
    }
    onOpenSection?.(row.sectionId);
  };

  return (
    <section className="report-panel release-readiness-panel page-stack admin-section admin-section-panel">
      <div className="admin-section-heading">
        <div>
          <h3>App readiness</h3>
          <p className="muted-text">See what needs fixing or checking before teachers and students use the app.</p>
        </div>
        <ReleaseStatusPill status={model.actionCount ? "action" : model.reviewCount ? "review" : "ready"} />
      </div>

      <div className="teacher-report-metrics release-readiness-metrics">
        {model.summaryCards.map(card => (
          <article className={`release-metric-card ${getReadinessStatusClass(card.status)}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="release-readiness-grid">
        <article className="teacher-report-card release-checklist-card">
          <h4>What to check</h4>
          {model.checklist.map(row => (
            <button className="release-readiness-row" key={row.label} onClick={() => openRow(row)} type="button">
              <span>
                <strong>{row.label}</strong>
                <small>{row.detail}</small>
              </span>
              <b>{row.value}</b>
              <ReleaseStatusPill status={row.status} />
            </button>
          ))}
        </article>

        <article className="teacher-report-card">
          <h4>School data checks</h4>
          <div className="release-tool-list">
            {model.cleanupRows.map(row => (
              <button key={row.label} onClick={() => openRow(row)} type="button">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="teacher-report-card release-qa-card">
          <h4>Content checks</h4>
          {model.qaRows.map(row => (
            <button className="release-readiness-row" key={row.label} onClick={() => openRow(row)} type="button">
              <span>
                <strong>{row.label}</strong>
                <small>{row.detail}</small>
              </span>
              <b>{row.value}</b>
              <ReleaseStatusPill status={row.status} />
            </button>
          ))}
        </article>
      </div>
    </section>
  );
}

function DeleteConfirmationModal({
  pendingDelete,
  confirmationText,
  setConfirmationText,
  onCancel,
  onConfirm
}) {
  if (!pendingDelete) return null;

  return (
    <div className="qa-delete-modal-backdrop" role="presentation">
      <section className="qa-delete-modal" role="dialog" aria-modal="true" aria-labelledby="qa-delete-title">
        <h3 id="qa-delete-title">Permanently delete this asset?</h3>
        <p>This cannot be undone from student runtime. This first pass marks it deleted; the local deletion tool moves the file into quarantine by default.</p>
        <p><strong>{pendingDelete.label}</strong></p>
        <small>{pendingDelete.path || pendingDelete.bookId}</small>
        <label>
          Type DELETE to confirm
          <input
            autoFocus
            onChange={event => setConfirmationText(event.target.value)}
            value={confirmationText}
          />
        </label>
        <div className="button-row">
          <button className="report-button" onClick={onCancel} type="button">Cancel</button>
          <button
            className="report-button danger"
            disabled={confirmationText !== "DELETE"}
            onClick={onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function getKimiRequestReason(record) {
  if (record.rejectionReason) return record.rejectionReason;
  if (record.reviewerNotes) return record.reviewerNotes;
  if ((record.heuristicFlags || []).length) return record.heuristicFlags.join(", ");
  if (record.status === "needs_kimi") return "No usable asset is available; create this asset from scratch.";
  if (record.status === "rejected") return "Existing asset was rejected in QA; replace it with an up-to-spec asset.";
  if (record.status === "blocked") return "Asset is blocked from student runtime; regenerate only if this target should remain active.";
  return "Needs QA replacement.";
}

function readGuidedImageQaOverrides() {
  if (typeof localStorage === "undefined") return {};
  const resetVersion = localStorage.getItem(GUIDED_IMAGE_QA_RESET_KEY);
  if (resetVersion !== GUIDED_IMAGE_QA_RESET_VERSION) {
    localStorage.removeItem(GUIDED_IMAGE_QA_STORAGE_KEY);
    localStorage.setItem(GUIDED_IMAGE_QA_RESET_KEY, GUIDED_IMAGE_QA_RESET_VERSION);
    return {};
  }
  try {
    return JSON.parse(localStorage.getItem(GUIDED_IMAGE_QA_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeGuidedImageQaOverrides(overrides = {}) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(GUIDED_IMAGE_QA_STORAGE_KEY, JSON.stringify(overrides));
}

function resetGuidedImageQaOverrides() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(GUIDED_IMAGE_QA_STORAGE_KEY);
  localStorage.setItem(GUIDED_IMAGE_QA_RESET_KEY, GUIDED_IMAGE_QA_RESET_VERSION);
}

function buildGuidedImageQaRecords(overrides = readGuidedImageQaOverrides(), levelOverrides = readGuidedReadingLevelOverrides()) {
  return guidedReadingBooks.map(rawBook => {
    const book = applyGuidedReadingLevelOverride(rawBook, levelOverrides);
    const id = `${book.id}:book`;
    return {
      id,
      bookId: book.id,
      title: book.title,
      seriesTitle: book.seriesTitle || "",
      originalLevel: rawBook.level,
      type: book.type,
      pageCount: book.pages?.length || 0,
      text: `${book.title || ""}${book.seriesTitle ? ` · ${book.seriesTitle}` : ""}`,
      image: book.coverImage || book.cover || "",
      pages: book.pages || [],
      assetType: "guided-reading-book",
      qaStatus: book.qaStatus || "",
      qaNotes: book.qaNotes || "",
      status: levelOverrides[book.id] ? "moved_level" : "unreviewed",
      reviewerNotes: "",
      reviewedAt: "",
      ...overrides[id],
      level: levelOverrides[book.id] || book.level,
      movedToLevel: levelOverrides[book.id] || ""
    };
  });
}

function guidedImageQaToCsv(records) {
  const headers = [
    "bookId",
    "title",
    "level",
    "type",
    "status",
    "image",
    "pageCount",
    "qaStatus",
    "reviewerNotes"
  ];
  return [
    headers.join(","),
    ...records.map(record => [
      record.bookId,
      record.title,
      record.level,
      record.type,
      record.status,
      record.image,
      record.pageCount,
      record.qaStatus,
      record.reviewerNotes
    ].map(csvEscape).join(","))
  ].join("\n");
}

function guidedImageQaToKimiMarkdown(records) {
  const remakeRecords = records.filter(record => record.status === "no_match_remake");
  const wholeBookRecords = records.filter(record => record.status === "whole_book_continuity_remake");
  const rejectedStoryRecords = records.filter(record => record.status === "whole_book_reject_story");
  const wholeBookGroups = wholeBookRecords.reduce((map, record) => {
    const key = record.bookId;
    map.set(key, [...(map.get(key) || []), record]);
    return map;
  }, new Map());
  const rejectedStoryGroups = rejectedStoryRecords.reduce((map, record) => {
    const key = record.bookId;
    map.set(key, [...(map.get(key) || []), record]);
    return map;
  }, new Map());

  return [
    "# Kimi Guided Reading Image Remake Request",
    "",
    "These pages/books were marked by admin QA for image remake.",
    "",
    "## Global Image Rules",
    "",
    "- Use the exact app text as the source of truth.",
    "- Create a new image that clearly shows the main idea/action of that exact page text.",
    "- Do not illustrate the previous page or the next page.",
    "- No embedded text, captions, labels, or speech bubbles.",
    "- Keep character appearance, clothing, setting, time of day, and art style consistent across the book.",
    "- For whole-book continuity remakes, generate a completely new matching image set for the full book. Every page must share complete continuity of characters, setting, scene logic, season, time, lighting, props, and style.",
    "- Do not reuse the previous mismatched image set for whole-book continuity remakes.",
    "- Whole-book story rejections are not image requests. Do not render images for rejected stories; add replacement books to the next Codex book-development round.",
    "- Use warm, natural colors. No rainbow/fantasy effects unless the text explicitly requires them.",
    "",
    "## Whole-Book Story Rejections",
    "",
    "These books were rejected because the writing/story was judged weak, lame, nonsensical, or not worth salvaging. Do not create images for these books. Add one replacement book to the next guided story development round for each rejected book.",
    "",
    ...[...rejectedStoryGroups.entries()].flatMap(([bookId, rows]) => {
      const sortedRows = [...rows].sort((a, b) => Number(a.pageNumber || 0) - Number(b.pageNumber || 0));
      const first = sortedRows[0] || {};
      return [
        `## ${first.title || bookId} - Reject Entire Book`,
        "",
        `- Book ID: ${bookId}`,
        `- Level: ${first.level || ""}`,
        `- Type: ${first.type || ""}`,
        "- Decision: Reject this whole book from the production queue.",
        "- Development action: Add `+1 replacement book` to the next guided story development round at the same level/type.",
        `- Admin notes: ${sortedRows.find(record => record.reviewerNotes)?.reviewerNotes || "Story/writing rejected by admin QA."}`,
        "",
        "### Existing Page Text For Reference",
        "",
        ...sortedRows.map(record => `- Page ${record.pageNumber}: ${record.text}`)
      ];
    }),
    rejectedStoryGroups.size ? "" : "_None._",
    "",
    "## Whole-Book Continuity Remakes",
    "",
    ...[...wholeBookGroups.entries()].flatMap(([bookId, rows]) => {
      const sortedRows = [...rows].sort((a, b) => Number(a.pageNumber || 0) - Number(b.pageNumber || 0));
      const first = sortedRows[0] || {};
      return [
        `## ${first.title || bookId} - Whole New Image Set`,
        "",
        `- Book ID: ${bookId}`,
        `- Level: ${first.level || ""}`,
        `- Type: ${first.type || ""}`,
        "- Reason: Admin requested a whole new image set because the current book lacks complete visual continuity.",
        "- Required continuity: all new images must have complete continuity of characters, setting, scene, season, time of day, lighting, recurring props, and illustration style across the whole book.",
        "- Kimi instruction: remake the full cover/page image set from the exact app text below. Do not improvise new story details.",
        "",
        "### Page Requirements",
        "",
        ...sortedRows.map(record => [
          `#### Page ${record.pageNumber}`,
          "",
          `- Current image path: ${record.image}`,
          `- Required replacement path: ${record.image}`,
          `- Exact app text: ${record.text}`,
          `- Admin notes: ${record.reviewerNotes || "Whole-book continuity remake requested."}`,
          `- Prompt: Create one warm student-friendly guided reading illustration for "${record.title}", page ${record.pageNumber}. The image must match this exact page text: "${record.text}". This page must be part of a completely continuous full-book image set with the same characters, same setting logic, same season/time/lighting continuity, same recurring props, and same art style as all other pages in the book. No embedded text, captions, labels, watermarks, or speech bubbles.`,
          ""
        ].join("\n"))
      ];
    }),
    wholeBookGroups.size ? "" : "_None._",
    "",
    "## Single-Page Text-Picture Remakes",
    "",
    "These pages were marked `no match remake image using text` by admin QA.",
    "",
    ...remakeRecords.map(record => [
      `## ${record.title} - Page ${record.pageNumber}`,
      "",
      `- Book ID: ${record.bookId}`,
      `- Level: ${record.level}`,
      `- Current image path: ${record.image}`,
      `- Original generated image path: ${record.originalImage || "same as current"}`,
      `- Image remapped from generated page: ${record.imageRemapSourcePage || "not remapped"}`,
      `- Required replacement path: ${record.image}`,
      `- Exact app text: ${record.text}`,
      `- Admin notes: ${record.reviewerNotes || "Image does not match the page text."}`,
      `- Prompt: Create one warm student-friendly guided reading illustration for "${record.title}", page ${record.pageNumber}. The image must match this exact page text: "${record.text}". Show the main character(s), setting, and action from this text only. Do not include embedded text, captions, labels, or speech bubbles. Preserve book continuity and natural colors.`,
      ""
    ].join("\n"))
  ].join("\n");
}

function MediaQaPage({ mediaType, questions = [], onBack }) {
  const [overrides, setOverrides] = useState(() => readMediaQaOverrides());
  const [mediaInventory, setMediaInventory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const audioPreviewRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    importWithRetry(() => import("../data/publicMediaInventory")).then(module => {
      if (!cancelled) setMediaInventory(module.publicMediaInventory || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allRecords = useMemo(
    () => buildMediaQaRecords(questions, overrides, mediaInventory || []).filter(record => record.mediaType === mediaType),
    [questions, overrides, mediaInventory, mediaType]
  );
  const skillOptions = useMemo(() => [...new Set(allRecords.map(record => record.skillName || record.skillId).filter(Boolean))].sort(), [allRecords]);
  const statusCounts = useMemo(() => allRecords.reduce((counts, record) => {
    counts.all += 1;
    counts[record.status] = (counts[record.status] || 0) + 1;
    if (!record.exists || !record.filePath) counts.missing += 1;
    if ((record.heuristicFlags || []).length > 0) counts.suspected += 1;
    return counts;
  }, {
    all: 0,
    missing: 0,
    suspected: 0
  }), [allRecords]);
  const visibleRecords = allRecords.filter(record => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || [record.targetWord, record.filePath, record.skillName, record.skillId].some(value => String(value || "").toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === "all" ||
      record.status === statusFilter ||
      (statusFilter === "missing" && (!record.exists || !record.filePath)) ||
      (statusFilter === "suspected" && (record.heuristicFlags || []).length > 0);
    const matchesSkill = skillFilter === "all" || record.skillName === skillFilter || record.skillId === skillFilter;
    return matchesSearch && matchesStatus && matchesSkill;
  });
  const selectedSet = new Set(selectedIds);
  const qaRules = mediaType === "image"
    ? [
      "white background only",
      "single centered object",
      "no faces/eyes/smiles",
      "no sparkles/glow/aura",
      "no rainbow/fantasy colors",
      "no dark backgrounds",
      "no shadows",
      "no text",
      "no cluttered scenes",
      "natural object colors",
      "kindergarten-readable"
    ]
    : [
      "clear pronunciation",
      "correct target word",
      "neutral adult female voice preferred",
      "no music",
      "no sound effects",
      "no clipping",
      "no background noise",
      "normalized volume",
      "no wrong accent/pronunciation",
      "short silence before/after only"
    ];

  if (!mediaInventory) {
    return (
      <main className="admin-dashboard page-stack media-qa-page">
        <section className="card page-stack">
          <div className="admin-header">
            <div>
              <h2>{mediaType === "image" ? "Image QA" : "Audio QA"}</h2>
              <p className="muted-text">Loading media inventory...</p>
            </div>
            <div className="button-row admin-controls">
              <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  function playPreviewAudio(filePath) {
    if (!filePath) return;
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }
    const audio = new Audio(filePath);
    audioPreviewRef.current = audio;
    audio.play().catch(error => {
      console.warn("Audio QA preview failed", error);
    });
  }

  function applyStatus(ids, status) {
    if (!ids.length) return;
    const next = updateMediaQaRecords(ids, { status });
    setOverrides(next);
    setSelectedIds([]);
  }

  function requestDeleteRecord(record) {
    setPendingDelete({
      kind: "assessment-media",
      record,
      label: `${record.targetWord || record.filePath} (${mediaType})`,
      path: record.filePath
    });
    setDeleteConfirmationText("");
  }

  function confirmDeleteRecord() {
    if (!pendingDelete?.record || deleteConfirmationText !== "DELETE") return;
    const record = pendingDelete.record;
    const next = updateMediaQaRecords([record.id], {
      status: "deleted",
      reviewerNotes: "Soft-deleted by admin QA. Use tools/deleteQaAsset.js to quarantine the file locally.",
      replacementNeeded: true
    });
    addDeletedMediaRecords([{
      assetType: mediaType,
      path: record.filePath,
      word: record.targetWord || "",
      skillId: record.skillId || "",
      reason: "Deleted from media QA admin page.",
      replacementNeeded: true
    }]);
    setOverrides(next);
    setSelectedIds(ids => ids.filter(id => id !== record.id));
    setPendingDelete(null);
    setDeleteConfirmationText("");
  }

  function exportRecords(format) {
    const base = `literacypath-${mediaType}-qa`;
    if (format === "csv") downloadTextFile(`${base}.csv`, mediaQaToCsv(visibleRecords), "text/csv");
    if (format === "json") downloadTextFile(`${base}.json`, JSON.stringify(visibleRecords, null, 2), "application/json");
    if (format === "kimi") {
      const rows = visibleRecords.filter(record => ["rejected", "needs_kimi", "blocked"].includes(record.status) || (record.heuristicFlags || []).length);
      downloadTextFile(`${base}-kimi-request.md`, mediaQaToKimiMarkdown(rows, mediaType), "text/markdown");
    }
  }

  return (
    <main className="admin-dashboard page-stack media-qa-page">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>{mediaType === "image" ? "Image QA" : "Audio QA"}</h2>
            <p className="muted-text">
              Moderate every public {mediaType} asset the app can serve. Showing {visibleRecords.length} of {allRecords.length} records.
            </p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" onClick={() => exportRecords("csv")} type="button">Export CSV</button>
            <button className="report-button" onClick={() => exportRecords("json")} type="button">Export JSON</button>
            <button className="report-button" onClick={() => exportRecords("kimi")} type="button">Export Kimi Markdown</button>
          </div>
        </div>

        <div className="media-qa-rules">
          {qaRules.map(rule => <span key={rule}>{rule}</span>)}
          <span>needs kimi = no usable asset exists</span>
          <span>rejected = remake to spec</span>
        </div>
      </section>

      <section className="report-panel page-stack">
        <div className="media-qa-status-tabs" role="tablist" aria-label={`${mediaType} QA status filters`}>
          {["all", ...MEDIA_QA_STATUSES, "suspected", "missing"].map(status => (
            <button
              className={statusFilter === status ? "active" : ""}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {statusLabel(status)} <span>{statusCounts[status] || 0}</span>
            </button>
          ))}
        </div>

        <div className="admin-content-filters">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search target word or filename" type="search" />
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {MEDIA_QA_STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
            <option value="suspected">Suspected bad media</option>
            <option value="missing">Missing file path</option>
          </select>
          <select value={skillFilter} onChange={event => setSkillFilter(event.target.value)}>
            <option value="all">All skills</option>
            {skillOptions.map(skill => <option key={skill} value={skill}>{skill}</option>)}
          </select>
        </div>

        <div className="button-row media-qa-bulk-actions">
          {MEDIA_QA_STATUSES.filter(status => status !== "unreviewed").map(status => (
            <button className="report-button" disabled={!selectedIds.length} key={status} onClick={() => applyStatus(selectedIds, status)} type="button">
              Mark selected {statusLabel(status)}
            </button>
          ))}
          <button className="report-button" disabled={!selectedIds.length} onClick={() => applyStatus(selectedIds, "unreviewed")} type="button">
            Undo selected
          </button>
        </div>
      </section>

      <DeleteConfirmationModal
        pendingDelete={pendingDelete}
        confirmationText={deleteConfirmationText}
        setConfirmationText={setDeleteConfirmationText}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteConfirmationText("");
        }}
        onConfirm={confirmDeleteRecord}
      />

      {mediaType === "image" ? (
        <section className="media-qa-grid">
          {visibleRecords.map(record => (
            <article className={`media-qa-card status-${record.status}`} key={record.id}>
              <label className="media-qa-select">
                <input
                  checked={selectedSet.has(record.id)}
                  onChange={event => setSelectedIds(ids => event.target.checked ? [...ids, record.id] : ids.filter(id => id !== record.id))}
                  type="checkbox"
                />
                Select
              </label>
              <img alt={record.targetWord || record.filePath} src={record.filePath} />
              <div>
                <h3>{record.targetWord || "Untitled"}</h3>
                <p>{record.skillName || "Unknown skill"} {record.level ? `· Level ${record.level}` : ""}</p>
                <span>{statusLabel(record.status)}</span>
                <small>{record.filePath}</small>
                <small>{record.linkedQuestionIds.length} linked questions</small>
                {record.source === "public_file_inventory" && <small>Public file inventory</small>}
                {isMediaDeleted(record.filePath) && <small>Deleted/quarantined</small>}
                {!record.exists && <small>Missing file</small>}
                {(record.heuristicFlags || []).length > 0 && <small>Flags: {record.heuristicFlags.join(", ")}</small>}
              </div>
              <div className="media-qa-card-actions">
                {MEDIA_QA_STATUSES.filter(status => status !== record.status).map(status => (
                  <button key={status} onClick={() => applyStatus([record.id], status)} type="button">{statusLabel(status)}</button>
                ))}
                <button className="report-button danger" onClick={() => requestDeleteRecord(record)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="admin-table-wrap">
          <table className="dashboard-table admin-table media-qa-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Play</th>
                <th>Target</th>
                <th>Skill</th>
                <th>Status</th>
                <th>Path</th>
                <th>Linked</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map(record => (
                <tr key={record.id}>
                  <td>
                    <input
                      checked={selectedSet.has(record.id)}
                      onChange={event => setSelectedIds(ids => event.target.checked ? [...ids, record.id] : ids.filter(id => id !== record.id))}
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <button
                      aria-label={`Play ${record.targetWord || record.filePath}`}
                      className="media-qa-play-button"
                      onClick={() => playPreviewAudio(record.filePath)}
                      type="button"
                    >
                      ▶
                    </button>
                  </td>
                  <td>{record.targetWord}</td>
                  <td>{record.skillName}{record.level ? ` · Level ${record.level}` : ""}</td>
                  <td>{statusLabel(record.status)}</td>
                  <td>{record.filePath}</td>
                  <td>{record.linkedQuestionIds.length}</td>
                  <td>{record.source || ""}</td>
                  <td>
                    <div className="button-row">
                      {MEDIA_QA_STATUSES.filter(status => status !== record.status).map(status => (
                        <button className="report-button" key={status} onClick={() => applyStatus([record.id], status)} type="button">{statusLabel(status)}</button>
                      ))}
                      <button className="report-button danger" onClick={() => requestDeleteRecord(record)} type="button">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function hfwQuestionImageQaToCsv(rows = []) {
  const headers = [
    "questionId",
    "skillId",
    "level",
    "phase",
    "targetWord",
    "qaStatus",
    "rejectionReason",
    "reviewerNotes",
    "currentImagePath",
    "sentenceWithBlank",
    "fullSentence",
    "correctAnswer",
    "answerChoices"
  ];
  return [
    headers.join(","),
    ...rows.map(row => [
      row.questionId,
      row.skillId,
      row.level,
      row.phase,
      row.targetWord,
      row.qaStatus,
      row.rejectionReason,
      row.reviewerNotes,
      row.currentImagePath,
      row.sentenceWithBlank,
      row.fullSentence,
      row.correctAnswer,
      (row.answerChoices || []).join(" | ")
    ].map(csvEscape).join(","))
  ].join("\n");
}

function HfwQuestionImageQaPage({ onBack }) {
  const [overrides, setOverrides] = useState(() => readHfwQuestionImageReviewOverrides());
  const [statusFilter, setStatusFilter] = useState("all");
  const [bandFilter, setBandFilter] = useState("all");
  const [search, setSearch] = useState("");
  const rows = useMemo(() => mergeHfwQuestionImageReviewRows(overrides), [overrides]);
  const counts = useMemo(() => rows.reduce((summary, row) => {
    summary.all += 1;
    summary[row.qaStatus] = (summary[row.qaStatus] || 0) + 1;
    if (row.currentImagePath) summary.with_image += 1;
    return summary;
  }, { all: 0, with_image: 0 }), [rows]);
  const bandOptions = useMemo(() => [...new Set(rows.map(row => row.skillId).filter(Boolean))].sort(), [rows]);
  const visibleRows = rows.filter(row => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || [
      row.questionId,
      row.skillId,
      row.targetWord,
      row.fullSentence,
      row.sentenceWithBlank,
      row.currentImagePath
    ].some(value => String(value || "").toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || row.qaStatus === statusFilter || (statusFilter === "with_image" && row.currentImagePath);
    const matchesBand = bandFilter === "all" || row.skillId === bandFilter;
    return matchesSearch && matchesStatus && matchesBand;
  });

  function applyReview(row, patch) {
    const next = updateHfwQuestionImageReviewOverride(row, patch);
    setOverrides(next);
  }

  function exportRows(format) {
    const base = "literacypath-hfw-question-image-qa";
    if (format === "csv") downloadTextFile(`${base}.csv`, hfwQuestionImageQaToCsv(visibleRows), "text/csv");
    if (format === "json") downloadTextFile(`${base}.json`, JSON.stringify(visibleRows, null, 2), "application/json");
  }

  return (
    <main className="admin-dashboard page-stack media-qa-page">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>HFW Question Image QA</h2>
            <p className="muted-text">
              Review exact HFW question/image pairings. No approval means the student runtime shows no image.
            </p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" onClick={() => exportRows("csv")} type="button">Export visible CSV</button>
            <button className="report-button" onClick={() => exportRows("json")} type="button">Export visible JSON</button>
          </div>
        </div>
        <div className="media-qa-rules">
          <span>exact questionId + imagePath approval only</span>
          <span>wrong image is worse than no image</span>
          <span>no random fallback images</span>
          <span>no photorealism</span>
          <span>no embedded text/watermarks/logos</span>
        </div>
      </section>

      <section className="report-panel page-stack">
        <div className="media-qa-status-tabs" role="tablist" aria-label="HFW image QA status filters">
          {["all", ...HFW_QUESTION_IMAGE_QA_STATUSES, "with_image"].map(status => (
            <button
              className={statusFilter === status ? "active" : ""}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {statusLabel(status)} <span>{counts[status] || 0}</span>
            </button>
          ))}
        </div>
        <div className="admin-content-filters">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search question, sentence, target, or image path" type="search" />
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {HFW_QUESTION_IMAGE_QA_STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
            <option value="with_image">With current image</option>
          </select>
          <select value={bandFilter} onChange={event => setBandFilter(event.target.value)}>
            <option value="all">All HFW bands</option>
            {bandOptions.map(band => <option key={band} value={band}>{band}</option>)}
          </select>
        </div>
      </section>

      <section className="media-qa-grid">
        {visibleRows.map(row => (
          <article className={`media-qa-card status-${row.qaStatus}`} key={`${row.questionId}-${row.currentImagePath || "no-image"}`}>
            {row.currentImagePath ? (
              <img alt={`${row.questionId} current HFW pairing`} src={row.currentImagePath} />
            ) : (
              <div className="teacher-chart-empty">No image assigned</div>
            )}
            <div>
              <h3>{row.targetWord} · {row.questionId}</h3>
              <p>{row.skillId} · Level {row.level} Phase {row.phase}</p>
              <span>{statusLabel(row.qaStatus)}</span>
              <small><strong>Sentence:</strong> {row.sentenceWithBlank}</small>
              <small><strong>Full:</strong> {row.fullSentence}</small>
              <small><strong>Choices:</strong> {(row.answerChoices || []).join(", ") || "letter tiles"}</small>
              <small><strong>Correct:</strong> {row.correctAnswer}</small>
              <small><strong>Image path:</strong> {row.currentImagePath || "none"}</small>
              <small><strong>Policy:</strong> {row.imagePolicy || "no_image"}</small>
            </div>
            <div className="media-qa-card-actions">
              <button disabled={!row.currentImagePath} onClick={() => applyReview(row, { qaStatus: "approved", rejectionReason: "", reviewerNotes: row.reviewerNotes || "" })} type="button">
                Approve image for this exact question
              </button>
              <button disabled={!row.currentImagePath} onClick={() => applyReview(row, { qaStatus: "rejected", rejectionReason: row.rejectionReason || "image_does_not_match_sentence" })} type="button">
                Reject image
              </button>
              <button onClick={() => applyReview(row, { qaStatus: "no_image_required", rejectionReason: "", reviewerNotes: row.reviewerNotes || "" })} type="button">
                No image needed
              </button>
              <button onClick={() => applyReview(row, { qaStatus: "needs_kimi", rejectionReason: row.rejectionReason || "image_does_not_match_sentence" })} type="button">
                Needs Kimi replacement
              </button>
              <label>
                Rejection reason
                <select value={row.rejectionReason || ""} onChange={event => applyReview(row, { rejectionReason: event.target.value })}>
                  <option value="">Choose reason</option>
                  {HFW_QUESTION_IMAGE_REJECTION_REASONS.map(reason => <option key={reason} value={reason}>{statusLabel(reason)}</option>)}
                </select>
              </label>
              <label>
                Reviewer notes
                <textarea
                  onChange={event => applyReview(row, { reviewerNotes: event.target.value })}
                  placeholder="Add teacher QA notes"
                  rows={3}
                  value={row.reviewerNotes || ""}
                />
              </label>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function GuidedReadingImageQaPage({ onBack }) {
  const [overrides, setOverrides] = useState(() => readGuidedImageQaOverrides());
  const [levelOverrides, setLevelOverrides] = useState(() => readGuidedReadingLevelOverrides());
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookFilter, setBookFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const records = useMemo(() => buildGuidedImageQaRecords(overrides, levelOverrides), [overrides, levelOverrides]);
  const bookOptions = useMemo(() => [...new Set(records.map(record => record.title))].sort(), [records]);
  const levelOptions = useMemo(() => [...new Set(records.map(record => record.level).filter(Boolean))].sort(), [records]);
  const visibleRecords = records.filter(record => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || [record.title, record.bookId, record.text, record.image].some(value =>
      String(value || "").toLowerCase().includes(query)
    );
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesBook = bookFilter === "all" || record.title === bookFilter;
    const matchesLevel = levelFilter === "all" || record.level === levelFilter;
    return matchesSearch && matchesStatus && matchesBook && matchesLevel;
  });

  useEffect(() => {
    setOverrides(readGuidedImageQaOverrides());
    setLevelOverrides(readGuidedReadingLevelOverrides());
  }, []);

  function markGuidedBookMoved(recordId, level) {
    const next = {
      ...overrides,
      [recordId]: {
        ...(overrides[recordId] || {}),
        status: "moved_level",
        reviewerNotes: `Moved to Level ${level}.`,
        reviewedAt: new Date().toISOString()
      }
    };
    writeGuidedImageQaOverrides(next);
    setOverrides(next);
  }

  function moveGuidedBook(record, level) {
    const nextLevelOverrides = setGuidedReadingLevelOverride(record.bookId, level);
    setLevelOverrides(nextLevelOverrides);
    markGuidedBookMoved(record.id, level);
  }

  function requestGuidedDelete(record) {
    setPendingDelete({
      kind: "guided-reading-book",
      record,
      bookId: record.bookId,
      path: record.image,
      label: `${record.title} (entire book asset set)`
    });
    setDeleteConfirmationText("");
  }

  function confirmGuidedDelete() {
    if (!pendingDelete?.record || deleteConfirmationText !== "DELETE") return;
    const { record } = pendingDelete;
    const next = { ...overrides };
    const affectedRecords = [record];

    affectedRecords.forEach(item => {
      next[item.id] = {
        ...(next[item.id] || {}),
        status: "deleted",
        reviewerNotes: "Whole book soft-deleted by admin QA. Use tools/deleteQaAsset.js to quarantine files locally.",
        reviewedAt: new Date().toISOString()
      };
    });
    writeGuidedImageQaOverrides(next);
    addDeletedMediaRecords([
      {
        assetType: "guided-reading-book",
        path: "",
        bookId: record.bookId,
        reason: "Whole guided-reading book soft-deleted from admin QA.",
        replacementNeeded: true
      },
      ...(record.pages || []).map(item => ({
        assetType: item.assetType || "guided-reading-page",
        path: item.image,
        bookId: record.bookId,
        pageNumber: item.pageNumber,
        reason: "Guided-reading asset deleted as part of whole-book QA delete.",
        replacementNeeded: true
      }))
    ]);
    setOverrides(next);
    setPendingDelete(null);
    setDeleteConfirmationText("");
  }

  function exportGuidedQa(format) {
    const base = "literacypath-guided-reading-image-qa";
    if (format === "csv") downloadTextFile(`${base}.csv`, guidedImageQaToCsv(visibleRecords), "text/csv");
    if (format === "json") downloadTextFile(`${base}.json`, JSON.stringify(visibleRecords, null, 2), "application/json");
  }

  const counts = records.reduce((map, record) => {
    map[record.status] = (map[record.status] || 0) + 1;
    return map;
  }, {});

  return (
    <main className="admin-dashboard page-stack media-qa-page guided-image-qa-page">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>Guided Reading Book Controls</h2>
            <p className="muted-text">Keep the library public, remove a whole book if needed, or move a book into Level A, B, or C.</p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" onClick={() => exportGuidedQa("csv")} type="button">Export CSV</button>
            <button className="report-button" onClick={() => exportGuidedQa("json")} type="button">Export JSON</button>
          </div>
        </div>
        <div className="media-qa-rules">
          <span>all guided reading books are public unless deleted</span>
          <span>Delete Whole Book soft-blocks the book from runtime</span>
          <span>Move to A/B/C changes its shelf level in this browser</span>
          <span>use source data for permanent level changes after review</span>
        </div>
        <p className="muted-text">
          {records.length} books · {counts.moved_level || 0} level moves · {counts.deleted || 0} deleted
        </p>
      </section>

      <DeleteConfirmationModal
        pendingDelete={pendingDelete}
        confirmationText={deleteConfirmationText}
        setConfirmationText={setDeleteConfirmationText}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteConfirmationText("");
        }}
        onConfirm={confirmGuidedDelete}
      />

      <section className="report-panel page-stack">
        <div className="admin-content-filters">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search book, page text, or image path" type="search" />
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {GUIDED_IMAGE_QA_STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <select value={bookFilter} onChange={event => setBookFilter(event.target.value)}>
            <option value="all">All books</option>
            {bookOptions.map(title => <option key={title} value={title}>{title}</option>)}
          </select>
          <select value={levelFilter} onChange={event => setLevelFilter(event.target.value)}>
            <option value="all">All levels</option>
            {levelOptions.map(level => <option key={level} value={level}>Level {level}</option>)}
          </select>
        </div>
      </section>

      <section className="guided-image-qa-grid">
        {visibleRecords.map(record => (
          <article className={`guided-image-qa-card status-${record.status}`} key={record.id}>
            <div className="guided-image-qa-preview">
              {record.image ? <img alt={`${record.title} cover`} src={record.image} /> : <span>Missing cover</span>}
            </div>
            <div className="guided-image-qa-body">
              <div>
                <p className="panel-label">{record.bookId} · {record.type} · Level {record.level} · {record.pageCount} pages</p>
                <h3>{record.title}</h3>
                <p className="guided-image-qa-text">{record.seriesTitle || "Guided Reading"}</p>
              </div>
              <small>{record.image}</small>
              <span>{statusLabel(record.status)}</span>
              <div className="guided-image-qa-actions">
                <button className="report-button danger" onClick={() => requestGuidedDelete(record)} type="button">
                  Delete Whole Book
                </button>
                {GUIDED_READING_MOVE_LEVELS.map(level => (
                  <button className="report-button" key={level} onClick={() => moveGuidedBook(record, level)} type="button">
                    Move to {level}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export function AdminDashboardPage({
  teachers = [],
  classes = [],
  students = [],
  schools = [],
  setTeacherSchool,
  pendingAccounts = [],
  pendingAccountsWarning = "",
  loading,
  refreshDashboard,
  deleteClass,
  deleteStudent,
  updateTeacherAccountStatus,
  mediaQuestions = [],
  assessmentHistory = [],
  assessmentHistoryReadState = {},
  retryAssessmentHistory,
  teacherId = "",
  supabase = null,
  message,
  onLoadStudent
}) {
  const [skillFilter, setSkillFilter] = useState("all");
  const [expandedTeacherId, setExpandedTeacherId] = useState("");
  const [retentionSchoolId, setRetentionSchoolId] = useState("");
  const [teacherSchoolDraft, setTeacherSchoolDraft] = useState("");
  const initialAdminRoute = typeof window === "undefined"
    ? null
    : adminRouteForPath(window.location.pathname);
  const [adminArea, setAdminArea] = useState(
    initialAdminRoute?.area || "school"
  );
  const [activeSection, setActiveSection] = useState(
    initialAdminRoute?.sectionId || "overview"
  );
  const [dataRightsStudent, setDataRightsStudent] = useState(null);
  const [templateFilter, setTemplateFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [patternFilter, setPatternFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [statusFilterLocal, setStatusFilterLocal] = useState("all");
  const [exportNotice, setExportNotice] = useState("");
  const [selectedElClassId, setSelectedElClassId] = useState("");
  const [selectedElBenchmarkScopeKey, setSelectedElBenchmarkScopeKey] = useState("");
  const [savedElReports, setSavedElReports] = useState([]);
  const [showReviewedSignupAccounts, setShowReviewedSignupAccounts] = useState(false);
  const [accountDecision, setAccountDecision] = useState(null);
  const [accountDecisionReason, setAccountDecisionReason] = useState("");
  const [accountDecisionBusy, setAccountDecisionBusy] = useState(false);
  const [accountDecisionError, setAccountDecisionError] = useState("");
  const [accountDecisionNotice, setAccountDecisionNotice] = useState("");
  const [accountDecisionHistoryState, setAccountDecisionHistoryState] = useState({
    error: null,
    rows: [],
    status: "idle"
  });
  const accountDecisionHistorySequenceRef = useRef(0);
  const refreshTeacherAccountDecisionHistory = useCallback(async () => {
    const sequence = accountDecisionHistorySequenceRef.current + 1;
    accountDecisionHistorySequenceRef.current = sequence;
    setAccountDecisionHistoryState(previous => ({
      ...previous,
      error: null,
      status: "loading"
    }));
    const result = await loadTeacherAccountDecisionHistory({
      client: supabase
    });
    if (accountDecisionHistorySequenceRef.current !== sequence) return result;
    setAccountDecisionHistoryState({
      error: result.error || null,
      rows: result.complete ? result.rows : [],
      status: result.status
    });
    return result;
  }, [supabase]);

  useEffect(() => {
    function syncAdminRouteFromHistory() {
      const route = adminRouteForPath(window.location.pathname);
      if (!route) return;
      setAdminArea(route.area);
      setActiveSection(route.sectionId);
    }
    window.addEventListener("popstate", syncAdminRouteFromHistory);
    return () => window.removeEventListener("popstate", syncAdminRouteFromHistory);
  }, []);

  useEffect(() => {
    if (activeSection !== "signups") return;
    void refreshTeacherAccountDecisionHistory();
  }, [activeSection, refreshTeacherAccountDecisionHistory]);
  const questionBankCoverage = useMemo(
    () => buildQuestionBankCoverage(mediaQuestions, curriculumReleaseBoard.rows),
    [mediaQuestions]
  );
  const teacherStorageId = teacherId || "local";
  const selectedClassId = selectedElClassId || classes[0]?.id || "";
  const selectedClassRow = classes.find(row => row.id === selectedClassId) || {};
  const selectedClassTeacherId = selectedClassRow.teacher_id || selectedClassRow.teacherId || teacherId || "";
  const classReportTeacher = teachers.find(row =>
    row.id === selectedClassTeacherId ||
    row.teacherId === selectedClassTeacherId ||
    row.user_id === selectedClassTeacherId
  ) || {};
  const classReportTeacherName =
    classReportTeacher.name ||
    classReportTeacher.full_name ||
    classReportTeacher.displayName ||
    classReportTeacher.email ||
    "Teacher";
  const elClassStudents = students.filter(student => !selectedClassId || student.classId === selectedClassId || student.class_id === selectedClassId);

  async function refreshSavedElReports() {
    setSavedElReports(getSavedElAssessmentReports({ teacherId: teacherStorageId }));
    const hydrated = await hydrateElAssessmentReports({ teacherId: teacherStorageId, supabase });
    setSavedElReports(hydrated);
    return hydrated;
  }

  useEffect(() => {
    resetRetiredMediaQaReviewStorage();
    let cancelled = false;
    setSavedElReports(getSavedElAssessmentReports({ teacherId: teacherStorageId }));
    void hydrateElAssessmentReports({ teacherId: teacherStorageId, supabase }).then(hydrated => {
      if (!cancelled) setSavedElReports(hydrated);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, teacherStorageId]);

  useEffect(() => {
    if (!selectedElClassId && classes[0]?.id) {
      setSelectedElClassId(classes[0].id);
    }
  }, [classes, selectedElClassId]);

  const templateOptions = useMemo(() => Array.from(new Set(
    questionBankCoverage.flatMap(row => Object.keys(row.templates || {}))
  )).sort(), [questionBankCoverage]);
  const difficultyOptions = useMemo(() => Array.from(new Set(
    questionBankCoverage.flatMap(row => Object.keys(row.difficulties || {}))
  )).sort(), [questionBankCoverage]);
  const filteredCoverage = questionBankCoverage.filter(row => {
    const matchesSkill = skillFilter === "all" || row.skill === skillFilter;
    const matchesTemplate = templateFilter === "all" || row.templates?.[templateFilter];
    const matchesDifficulty = difficultyFilter === "all" || row.difficulties?.[difficultyFilter];
    const matchesPattern = !patternFilter || Object.keys(row.patterns || {}).some(pattern =>
      pattern.toLowerCase().includes(patternFilter.toLowerCase())
    );
    const matchesMedia =
      mediaFilter === "all" ||
      (mediaFilter === "missing_image" && row.missingImage > 0) ||
      (mediaFilter === "missing_audio" && row.missingAudio > 0) ||
      (mediaFilter === "complete_media" && row.missingImage === 0 && row.missingAudio === 0) ||
      (mediaFilter === "bad_media" && row.badMedia > 0);
    const matchesStatus =
      statusFilterLocal === "all" ||
      (statusFilterLocal === "active" && row.active > 0) ||
      (statusFilterLocal === "inactive" && row.inactive > 0);

    return matchesSkill && matchesTemplate && matchesDifficulty && matchesPattern && matchesMedia && matchesStatus;
  });
  const guidedReadingInsight = useMemo(() => {
    const enriched = guidedReadingBooks.map(enrichGuidedReadingBook);
    const byStatus = enriched.reduce((map, book) => {
      const status = book.qaStatus || "unknown";
      map[status] = (map[status] || 0) + 1;
      return map;
    }, {});
    const byLevel = enriched.reduce((map, book) => {
      const level = book.level || "Unleveled";
      map[level] = (map[level] || 0) + 1;
      return map;
    }, {});
    const patternCounts = enriched.flatMap(book => book.dominantPhonicsPatterns || []).reduce((map, pattern) => {
      map[pattern] = (map[pattern] || 0) + 1;
      return map;
    }, {});
    const microphaseCounts = enriched.reduce((map, book) => {
      const key = book.recommendedMicrophase || "early-reading";
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
    const recommendations = recommendBooksForStudent({
      books: guidedReadingBooks,
      studentProgress: { needs: ["cvc", "short-a", "final-sounds", "digraphs"] },
      readingHistory: {}
    }).slice(0, 6);

    return {
      total: enriched.length,
      active: enriched.filter(book => book.active !== false).length,
      draft: enriched.filter(book => book.qaStatus !== "approved").length,
      missingImages: enriched.reduce((sum, book) => sum + (book.pages || []).filter(page => !page.image).length, 0),
      missingText: enriched.reduce((sum, book) => sum + (book.pages || []).filter(page => !page.text).length, 0),
      byStatus,
      byLevel,
      patternCounts,
      microphaseCounts,
      recommendations
    };
  }, []);
  const recentAttempts = [...assessmentHistory]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 40);
  const assessmentHistoryExportState = assessmentHistoryExportReadiness({
    readState: assessmentHistoryReadState,
    recordCount: assessmentHistory.length
  });
  const classReportingModel = useMemo(() =>
    buildClassReportModel({
      students,
      classes,
      assessmentHistory,
      classId: selectedClassId,
      teacherName: classReportTeacherName
    }),
  [students, classes, assessmentHistory, selectedClassId, classReportTeacherName]);
  const selectedClassAttempts = assessmentHistory.filter(record =>
    !selectedClassId ||
    record.classId === selectedClassId ||
    record.class_id === selectedClassId
  );
  const classBenchmarkScopeResolution = resolveElBenchmarkReportScope({
    records: selectedClassAttempts
  });
  const elBenchmarkScopeOptions = classBenchmarkScopeResolution.availableRoutes || [];
  const activeElBenchmarkScope = elBenchmarkScopeOptions.find(scope => (
    getBenchmarkScopeKey(scope) === selectedElBenchmarkScopeKey
  )) || elBenchmarkScopeOptions[0] || classBenchmarkScopeResolution;
  const elClassPrintReport = useMemo(() => (
    selectedClassId && activeElBenchmarkScope
      ? buildClassElAssessmentReportData({
          assessmentHistory,
          students,
          classes,
          classId: selectedClassId,
          teacherId: teacherStorageId,
          benchmarkScope: activeElBenchmarkScope
        })
      : null
  ), [
    activeElBenchmarkScope,
    assessmentHistory,
    classes,
    selectedClassId,
    students,
    teacherStorageId
  ]);
  const reportReadinessRows = [
    {
      label: "Roster scope",
      value: `${elClassStudents.length} students`,
      detail: selectedClassRow.name || "No class selected",
      status: elClassStudents.length ? "ready" : "review"
    },
    {
      label: "Assessment evidence",
      value: `${selectedClassAttempts.length} attempts`,
      detail: "Feeds class snapshot, growth, heatmap, and focus groups.",
      status: selectedClassAttempts.length ? "ready" : "review"
    },
    {
      label: "Mastery drill-downs",
      value: `${classReportingModel.growthAreas?.length || 0} skills`,
      detail: "Included in the on-screen report and exported class packet.",
      status: classReportingModel.growthAreas?.length ? "ready" : "review"
    },
    {
      label: "Export package",
      value: "PDF + Excel",
      detail: savedElReports.length ? `${savedElReports.length} saved EL export(s) in this browser.` : "Generate PDF or Excel from this report screen.",
      status: "ready"
    }
  ];
  function closeAdminQaPage() {
    if (typeof window === "undefined") {
      setAdminArea("technical");
      setActiveSection("release");
      return;
    }
    if (shouldCloseAdminQaWithHistoryBack(window.history.state)) {
      window.history.back();
      return;
    }
    const nextPath = adminPathForSection("release");
    const nextState = withoutAdminQaHistoryState(window.history.state);
    window.history.replaceState(
      nextState,
      "",
      nextPath
    );
    setAdminArea("technical");
    setActiveSection("release");
  }

  async function handleGuidedReadingCompletionExport() {
    setExportNotice("");
    try {
      const { exportGuidedReadingCompletionExcel } = await importWithRetry(() => import("../utils/exportGuidedReadingCompletionExcel.js"));
      const data = await exportGuidedReadingCompletionExcel({
        students,
        classes,
        teacherId: ""
      });
      setExportNotice(
        data.totals.totalGuidedReadingSessions
          ? `Guided Reading completion Excel exported with ${data.totals.totalCompletedBooks} completed book rows.`
          : "Guided Reading completion Excel exported with no records yet."
      );
    } catch (error) {
      console.error("Guided Reading completion Excel export failed.", error);
      setExportNotice("Could not export Guided Reading completion Excel.");
    }
  }

  function handleAssessmentHistoryCsvExport() {
    if (!assessmentHistoryExportState.canExport) {
      setExportNotice(assessmentHistoryExportState.message);
      return;
    }
    const generatedAt = new Date();
    const provenanceRows = buildExportProvenanceRows({
      reportTitle: "Assessment History Export",
      learnerCount: new Set(assessmentHistory.map(row => row.studentId || row.student_id).filter(Boolean)).size,
      generatedAt,
      filters: "All assessment-history rows available to this authorised administrator",
      evidenceSource: assessmentHistory,
      definitions: "Each data row is one persisted assessment attempt; score fields use the versions identified in this source-details block."
    });
    const csv = [
      exportProvenanceCsvPreamble(provenanceRows),
      "",
      exportAssessmentAttemptsCsv(assessmentHistory)
    ].join("\n");
    downloadTextFile("assessment-history.csv", csv, "text/csv");
  }

  function handleAssessmentHistoryJsonExport() {
    if (!assessmentHistoryExportState.canExport) {
      setExportNotice(assessmentHistoryExportState.message);
      return;
    }
    downloadTextFile(
      "assessment-history.json",
      JSON.stringify(assessmentHistory, null, 2),
      "application/json"
    );
  }

  async function handleClassElAssessmentExport() {
    setExportNotice("");
    if (!assessmentHistoryExportState.canExport) {
      setExportNotice(assessmentHistoryExportState.message);
      return;
    }
    try {
      const report = await exportClassElAssessmentExcel({
        assessmentHistory,
        students,
        classes,
        classId: selectedClassId,
        teacherId: teacherStorageId,
        benchmarkScope: activeElBenchmarkScope,
        supabase
      });
      await refreshSavedElReports();
      setExportNotice(report.persistence?.durable === false
        ? `Class EL assessment Excel exported for ${report.className}, but its saved-report history could not be stored. Keep the downloaded file and try again when storage is available.`
        : `Class EL assessment Excel exported for ${report.className}, ${displayBenchmarkScopeLabel(
            report.benchmarkScope,
            "selected assessment period"
          )}.`);
    } catch (error) {
      console.error("Class EL assessment Excel export failed.", error);
      setExportNotice("Could not export the class EL assessment Excel.");
    }
  }

  function handleClassReportPdfExport() {
    if (!assessmentHistoryExportState.canExport) {
      setExportNotice(assessmentHistoryExportState.message);
      return;
    }
    printTeacherDocument(
      TEACHER_PRINT_TARGETS.EL_CLASS,
      () => window.print()
    );
  }

  async function handleDownloadSavedElReport(report) {
    setExportNotice("");
    try {
      await downloadElAssessmentReport(report);
      setExportNotice(`Downloaded ${report.fileName || "saved EL report"}.`);
    } catch (error) {
      console.error("Saved EL assessment report download failed.", error);
      setExportNotice("Could not download the saved EL report.");
    }
  }

  async function handleDeleteSavedElReport(reportId) {
    try {
      await deleteSavedElAssessmentReport(reportId, { teacherId: teacherStorageId, supabase });
      await refreshSavedElReports();
      setExportNotice(supabase ? "Saved EL report deleted from this browser and cloud history." : "Saved EL report deleted from this browser.");
    } catch (error) {
      console.error("Saved EL assessment report delete failed.", error);
      setExportNotice("Could not delete the saved EL report from cloud history. It was kept locally to prevent it reappearing later.");
    }
  }

  async function handleAdminDataRightsDeletion(learner) {
    // LearnerDataRightsDialog only invokes this after both local cleanup
    // layers have been verified and the tracked request is complete.
    setDataRightsStudent(null);
    setExportNotice(
      `${learner.name}'s data was deleted. The privacy-safe request reference remains in the audit log.`
    );
    await refreshDashboard?.();
  }

  async function handleRetentionLearnersDeleted(studentIds = []) {
    for (const deletedStudentId of studentIds) {
      const learner = students.find(row => row.id === deletedStudentId);
      await clearAndVerifyLocalProgressForStudent(deletedStudentId);
      await clearLocalElAssessmentDataForStudent({
        teacherId: learner?.teacher_id || "",
        studentId: deletedStudentId,
        studentName: learner?.name || ""
      });
    }
  }

  function schoolForTeacherAccount(account = {}) {
    return resolveTeacherAccountSchool(account, schools);
  }

  function openTeacherAccountDecision(account, status) {
    if (!account?.id || !TEACHER_ACCOUNT_DECISION_STATUSES.includes(status)) {
      return;
    }
    setAccountDecision({ account, status });
    setAccountDecisionReason("");
    setAccountDecisionError("");
    setAccountDecisionNotice("");
  }

  function closeTeacherAccountDecision() {
    if (accountDecisionBusy) return;
    setAccountDecision(null);
    setAccountDecisionReason("");
    setAccountDecisionError("");
  }

  async function submitTeacherAccountDecision(event) {
    event.preventDefault();
    if (!accountDecision || accountDecisionBusy) return;

    const { account, status } = accountDecision;
    const validation = validateTeacherAccountDecision({
      account,
      schools,
      status,
      reason: accountDecisionReason
    });
    if (!validation.ok) {
      setAccountDecisionError(validation.errorMessage);
      return;
    }

    setAccountDecisionBusy(true);
    setAccountDecisionError("");
    try {
      const result = await updateTeacherAccountStatus?.(
        account.id,
        status,
        validation.reason
      );
      if (!result?.ok) {
        setAccountDecisionError(
          result?.errorMessage || "The decision was not saved. Try again."
        );
        return;
      }
      const teacherLabel =
        account.display_name || account.name || account.email || "Teacher account";
      setAccountDecisionNotice(
        `${teacherLabel} was ${status}.`
      );
      setAccountDecision(null);
      setAccountDecisionReason("");
      void refreshTeacherAccountDecisionHistory();
    } catch (error) {
      console.error("Teacher account decision failed.", error);
      setAccountDecisionError("The decision was not saved. Try again.");
    } finally {
      setAccountDecisionBusy(false);
    }
  }

  const pendingSignupAccounts = pendingAccounts.filter(isPendingTeacherAccount);
  const reviewedSignupAccounts = pendingAccounts.filter(account => !isPendingTeacherAccount(account));
  const visibleSignupCount = pendingSignupAccounts.length;
  const releaseReadinessModel = buildReleaseReadinessModel({
    teachers,
    classes,
    students,
    pendingSignupAccounts,
    pendingAccountsWarning,
    questionBankCoverage,
    mediaQuestions,
    assessmentHistory,
    guidedReadingInsight,
    savedElReports
  });

  const schoolAdminSections = [
    { id: "overview", label: "Overview", count: null },
    { id: "signups", label: "Teacher requests", count: pendingAccountsWarning ? null : visibleSignupCount },
    { id: "schools", label: "Schools", count: schools.length },
    { id: "teachers", label: "Teachers", count: teachers.length },
    { id: "classes", label: "Classes", count: classes.length },
    { id: "students", label: "Students", count: students.length },
    { id: "teacherReport", label: "School reports", count: assessmentHistory.length },
    { id: "archive", label: "Assessment records", count: assessmentHistory.length }
  ];
  const technicalAdminSections = [
    { id: "release", label: "App readiness", count: releaseReadinessModel.actionCount + releaseReadinessModel.reviewCount },
    { id: "guidedInsight", label: "Reading book checks", count: guidedReadingInsight.active },
    { id: "guidedMediaQa", label: "Book media checks", count: guidedReadingWordAudioCoverage.uniqueWordsMissingAudio || guidedReadingImageTextQa.needsManualReviewCount || 0 },
    { id: "coverage", label: "Lesson content checks", count: filteredCoverage.length },
    { id: "calibration", label: "Assessment consistency", count: null },
    { id: "assessmentAudio", label: "Assessment audio", count: assessmentAudioCoverage.summary?.replacementNeededCount || 0 },
    { id: "questionFlags", label: "Reported questions", count: null },
    { id: "mapStops", label: "Student map", count: null },
    { id: "hollowSpots", label: "Student rewards", count: null }
  ];
  const adminSections = adminArea === "technical"
    ? technicalAdminSections
    : schoolAdminSections;

  function openAdminSection(sectionId) {
    const route = ADMIN_SECTION_ROUTES[sectionId];
    if (!route) return;
    setAdminArea(route.area);
    setActiveSection(sectionId);
    if (
      typeof window !== "undefined"
      && window.location.pathname !== route.path
    ) {
      window.history.pushState(
        adminQaHistoryState(window.history.state, sectionId),
        "",
        route.path
      );
    }
  }

  if (activeSection === "questionFlags") {
    return <QuestionFlagReviewPage onBack={closeAdminQaPage} supabase={supabase} />;
  }

  return (
    <main className="admin-dashboard page-stack">
      <section className="card page-stack">
        <div className="admin-header">
          <div className="admin-page-heading">
            <h2>Admin Dashboard</h2>
            <p className="muted-text">Manage schools, teacher accounts, classes and student data.</p>
          </div>

          <div className="button-row admin-controls">
            {refreshDashboard && (
              <button className="report-button" onClick={refreshDashboard} disabled={loading} type="button">
                {loading ? "Loading..." : "Refresh"}
              </button>
            )}
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        <div className="admin-area-switch" aria-label="Admin areas">
          <button
            aria-pressed={adminArea === "school"}
            className={adminArea === "school" ? "active" : ""}
            onClick={() => {
              if (adminArea !== "school") openAdminSection("overview");
            }}
            type="button"
          >
            School administration
          </button>
          <button
            aria-pressed={adminArea === "technical"}
            className={adminArea === "technical" ? "active" : ""}
            onClick={() => {
              if (adminArea !== "technical") openAdminSection("release");
            }}
            type="button"
          >
            App checks
          </button>
        </div>

        <label className="teacher-section-select">
          Choose {adminArea === "technical" ? "an app check" : "a school admin page"}
          <select value={activeSection} onChange={event => openAdminSection(event.target.value)}>
            {adminSections.map(section => (
              <option key={section.id} value={section.id}>{section.label}</option>
            ))}
          </select>
        </label>

        <nav className="admin-section-tabs" aria-label={adminArea === "technical" ? "App checks" : "School administration pages"}>
          {adminSections.map(section => (
            <button
              className={activeSection === section.id ? "active" : ""}
              aria-current={activeSection === section.id ? "page" : undefined}
              key={section.id}
              onClick={() => openAdminSection(section.id)}
              type="button"
            >
              <span>{section.label}</span>
              {typeof section.count === "number" && <small>{section.count}</small>}
            </button>
          ))}
        </nav>
      </section>

      {activeSection === "overview" && (
        <section className="report-panel page-stack admin-section admin-section-panel">
          <div className="admin-section-heading">
            <div>
              <h3>Dashboard Summary</h3>
              <p className="muted-text">Jump into the admin area you need without scrolling through every tool.</p>
            </div>
          </div>
          <div className="admin-overview-grid">
            {schoolAdminSections.filter(section => section.id !== "overview").map(section => (
              <button
                className="admin-overview-card"
                key={section.id}
                onClick={() => openAdminSection(section.id)}
                type="button"
              >
                <span>{section.label}</span>
                <strong>{section.count}</strong>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeSection === "release" && (
        <>
          <ReleaseReadinessPanel
            model={releaseReadinessModel}
            onOpenQuestionFlags={() => openAdminSection("questionFlags")}
            onOpenSection={openAdminSection}
          />
          {selectedClassId && (
            <TeacherActivitySyncHealth
              supabase={supabase}
              classId={selectedClassId}
              className={selectedClassRow.name || "No class selected"}
            />
          )}
        </>
      )}

      {activeSection === "teacherReport" && (
        <section className="report-panel page-stack admin-section admin-section-panel">
          <div className="admin-section-heading">
            <div>
              <h3>Reports</h3>
              <p className="muted-text">Open whole-class reporting or a full individual student report.</p>
            </div>
          </div>
          {exportNotice && <p className="message">{exportNotice}</p>}

          <div className="report-readiness-panel">
            <div>
              <h4>Export Readiness</h4>
              <p className="muted-text">Check the selected class evidence before generating PDF, Excel, or individual report views.</p>
            </div>
            <div className="report-readiness-steps">
              {reportReadinessRows.map(row => (
                <article className={`report-readiness-step ${getReadinessStatusClass(row.status)}`} key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                  <small>{row.detail}</small>
                </article>
              ))}
            </div>
            <div className="teacher-action-list report-readiness-actions">
              <button
                className="lp-button lp-button-secondary"
                onClick={() => setActiveSection("archive")}
                type="button"
              >
                Open results
              </button>
            </div>
          </div>

          <div className="class-report-print-actions screen-only class-report-view-controls">
            <label>
              Class
              <select
                disabled={classes.length === 0}
                onChange={event => {
                  setSelectedElClassId(event.target.value);
                  setSelectedElBenchmarkScopeKey("");
                }}
                value={selectedClassId}
              >
                {classes.length === 0 ? (
                  <option value="">No classes yet</option>
                ) : classes.map(row => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </label>
            <ElBenchmarkScopeSelect
              activeScope={activeElBenchmarkScope}
              onChange={setSelectedElBenchmarkScopeKey}
              options={elBenchmarkScopeOptions}
            />
            <button
              className="lp-button lp-button-primary primary-export"
              disabled={!assessmentHistoryExportState.canExport}
              onClick={handleClassReportPdfExport}
              type="button"
            >
              Print or save EL PDF
            </button>
            <button
              className="lp-button lp-button-secondary"
              disabled={!assessmentHistoryExportState.canExport}
              onClick={handleClassElAssessmentExport}
              type="button"
            >
              Export Class Excel
            </button>
          </div>

          <div className="class-report-workspace">
            <ElClassReportDocument report={elClassPrintReport} />
          </div>

          {savedElReports.length > 0 && (
            <div className="teacher-report-card">
              <h4>Saved EL Reports</h4>
              {savedElReports.slice(0, 10).map(report => (
                <article className="el-saved-report-row" key={report.reportId}>
                  <div>
                    <strong>{report.reportType === "individual" ? "Student" : "Class"} EL report</strong>
                    <span>
                      {report.studentName || report.className || "Unknown"} · {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : ""}
                    </span>
                    <small>{displayBenchmarkScopeLabel(report.benchmarkScope)} · {report.summary?.totalAssessments || 0} assessments · {report.summary?.averageAccuracy || 0}% average</small>
                  </div>
                  <div className="button-row">
                    <button className="report-button" onClick={() => handleDownloadSavedElReport(report)} type="button">
                      Download
                    </button>
                    <button className="report-button danger" onClick={() => handleDeleteSavedElReport(report.reportId)} type="button">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeSection === "archive" && (
        <section className="report-panel page-stack admin-section admin-section-panel">
          <div className="admin-section-heading">
            <div>
              <h3>Assessment Archive</h3>
              <p className="muted-text">Saved checkpoint attempts for class and student reporting.</p>
            </div>
            <div className="teacher-action-list">
              <button
                className="lp-button lp-button-secondary"
                onClick={handleGuidedReadingCompletionExport}
                type="button"
              >
                Export Guided Reading Completion Excel
              </button>
              <button
                className="lp-button lp-button-secondary"
                disabled={!assessmentHistoryExportState.canExport}
                onClick={handleAssessmentHistoryCsvExport}
                type="button"
              >
                Export CSV
              </button>
              <button
                className="lp-button lp-button-secondary"
                disabled={!assessmentHistoryExportState.canExport}
                onClick={handleAssessmentHistoryJsonExport}
                type="button"
              >
                Export JSON
              </button>
            </div>
          </div>

          <div
            className={`message assessment-history-export-state ${assessmentHistoryExportState.state}`}
            role={assessmentHistoryExportState.state === "error" ? "alert" : "status"}
          >
            <span>{assessmentHistoryExportState.message}</span>
            {assessmentHistoryExportState.canRetry && (
              <button
                className="lp-button lp-button-secondary"
                onClick={retryAssessmentHistory}
                type="button"
              >
                Try again
              </button>
            )}
          </div>

          {recentAttempts.length === 0 ? (
            <p>No assessment attempts have been saved in this browser yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="dashboard-table admin-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Skill</th>
                    <th>Level</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Missed Items</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map(record => (
                    <tr key={record.attemptId}>
                      <td data-label="Date">{record.completedAt ? new Date(record.completedAt).toLocaleString() : ""}</td>
                      <td data-label="Student">{record.studentName}</td>
                      <td data-label="Skill">{record.skillName}</td>
                      <td data-label="Level">L{record.skillLevel} P{record.skillPhase}</td>
                      <td data-label="Score">{record.correctCount}/{record.totalQuestions} ({record.accuracy}%)</td>
                      <td data-label="Status">{record.status}</td>
                      <td data-label="Missed">{record.missedItems.slice(0, 6).join(", ") || "None"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeSection === "signups" && (
      <section className="card page-stack admin-section admin-section-panel">
        <div className="admin-section-heading">
          <div>
            <h3>Signup Requests</h3>
            <p className="muted-text">Approve or reject teacher account requests. Pending requests are blocked from the app until approved.</p>
          </div>
          <span className="admin-count-pill">{pendingAccountsWarning ? "Unavailable" : visibleSignupCount}</span>
        </div>
        {accountDecisionNotice && (
          <p className="message admin-account-decision-notice" role="status">
            {accountDecisionNotice}
          </p>
        )}
        {!pendingAccountsWarning && reviewedSignupAccounts.length > 0 && (
          <label className="admin-inline-toggle">
            <input
              checked={showReviewedSignupAccounts}
              onChange={event => setShowReviewedSignupAccounts(event.target.checked)}
              type="checkbox"
            />
            <span>Show reviewed accounts</span>
          </label>
        )}
        {pendingAccountsWarning ? (
          <div className="admin-section-warning" role="status">
            {pendingAccountsWarning}
          </div>
        ) : pendingSignupAccounts.length === 0 ? (
          <p>No pending signup requests.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table admin-responsive-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Name</th>
                  <th>School</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Reviewed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSignupAccounts.map(account => {
                  const accountStatus = getTeacherAccountApprovalStatus(account);
                  const isPending = accountStatus === "pending";
                  const accountSchool = schoolForTeacherAccount(account);

                  return (
                    <tr key={account.id || account.user_id || account.email}>
                      <td data-label="Email">{account.email || "Email unavailable"}</td>
                      <td data-label="Username">{account.username || "-"}</td>
                      <td data-label="Name">{account.display_name || account.name || "-"}</td>
                      <td data-label="School">
                        {accountSchool ? (
                          accountSchool.name
                        ) : (
                          <span className="admin-account-school-missing">
                            School not resolved — approval blocked
                          </span>
                        )}
                      </td>
                      <td data-label="Status">{accountStatus}</td>
                      <td data-label="Requested">{(account.requested_at || account.created_at) ? new Date(account.requested_at || account.created_at).toLocaleDateString() : ""}</td>
                      <td data-label="Reviewed">{account.reviewed_at ? new Date(account.reviewed_at).toLocaleDateString() : "Not reviewed"}</td>
                      <td data-label="Actions">
                        {isPending ? (
                          <div className="admin-row-actions">
                            <button
                              className="report-button"
                              disabled={!accountSchool}
                              onClick={() => openTeacherAccountDecision(account, "approved")}
                              title={!accountSchool ? "Resolve the teacher's school before approving access." : undefined}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              className="report-button danger"
                              onClick={() => openTeacherAccountDecision(account, "rejected")}
                              type="button"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="muted-text">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!pendingAccountsWarning && showReviewedSignupAccounts && reviewedSignupAccounts.length > 0 && (
          <div className="admin-reviewed-signups">
            <h4>Reviewed accounts</h4>
            <div className="admin-table-wrap">
              <table className="dashboard-table admin-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Name</th>
                    <th>School</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Reviewed</th>
                    <th>Decision note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedSignupAccounts.map(account => {
                    const accountStatus = getTeacherAccountApprovalStatus(account);
                    const accountSchool = schoolForTeacherAccount(account);
                    const canApprove = Boolean(accountSchool);

                    return (
                      <tr key={account.id || account.user_id || account.email}>
                        <td data-label="Email">{account.email || "Email unavailable"}</td>
                        <td data-label="Username">{account.username || "-"}</td>
                        <td data-label="Name">{account.display_name || account.name || "-"}</td>
                        <td data-label="School">
                          {accountSchool ? (
                            accountSchool.name
                          ) : (
                            <span className="admin-account-school-missing">
                              School not resolved
                            </span>
                          )}
                        </td>
                        <td data-label="Status">{accountStatus}</td>
                        <td data-label="Requested">{(account.requested_at || account.created_at) ? new Date(account.requested_at || account.created_at).toLocaleDateString() : ""}</td>
                        <td data-label="Reviewed">{account.reviewed_at ? new Date(account.reviewed_at).toLocaleDateString() : "Not reviewed"}</td>
                        <td data-label="Decision note">
                          {account.rejection_reason || (
                            accountStatus === "approved"
                              ? "Approved"
                              : "No reason recorded"
                          )}
                        </td>
                        <td data-label="Actions">
                          {accountStatus === "approved" ? (
                            <button
                              className="report-button danger"
                              onClick={() => openTeacherAccountDecision(account, "disabled")}
                              type="button"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              className="report-button"
                              disabled={!canApprove}
                              onClick={() => openTeacherAccountDecision(account, "approved")}
                              title={!canApprove ? "Resolve the teacher's school before approving access." : undefined}
                              type="button"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <section
          aria-labelledby="admin-account-decision-history-title"
          className="admin-account-decision-history page-stack"
        >
          <div className="admin-section-heading">
            <div>
              <h4 id="admin-account-decision-history-title">
                Account decision history
              </h4>
              <p className="muted-text">
                An append-only record of approvals, rejections and disabled access.
              </p>
            </div>
            <button
              className="report-button"
              disabled={accountDecisionHistoryState.status === "loading"}
              onClick={refreshTeacherAccountDecisionHistory}
              type="button"
            >
              {accountDecisionHistoryState.status === "loading"
                ? "Loading history…"
                : "Refresh history"}
            </button>
          </div>
          {accountDecisionHistoryState.status === "loading" ? (
            <p className="admin-decision-history-state" role="status">
              Loading account decision history…
            </p>
          ) : accountDecisionHistoryState.status === "error" ? (
            <div className="admin-section-warning" role="alert">
              <strong>Decision history could not be loaded.</strong>
              <span>
                The latest account status above is still available, but the history has not been treated as empty. Try again.
              </span>
            </div>
          ) : accountDecisionHistoryState.status === "unavailable" ? (
            <div className="admin-section-warning" role="status">
              <strong>Decision history is unavailable.</strong>
              <span>
                No empty-history conclusion has been made. Reconnect the Admin data service and refresh.
              </span>
            </div>
          ) : accountDecisionHistoryState.status === "complete"
            && accountDecisionHistoryState.rows.length === 0 ? (
              <p className="admin-decision-history-state">
                No account decisions have been recorded yet.
              </p>
            ) : accountDecisionHistoryState.status === "complete" ? (
              <div className="admin-table-wrap">
                <table className="dashboard-table admin-table admin-responsive-table admin-decision-history-table">
                  <thead>
                    <tr>
                      <th>Teacher account</th>
                      <th>Decision</th>
                      <th>Reason</th>
                      <th>School at decision</th>
                      <th>Reviewed</th>
                      <th>Reviewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountDecisionHistoryState.rows.map(event => {
                      const currentAccount = pendingAccounts.find(account => (
                        account.id === event.account_id
                        || account.user_id === event.teacher_user_id
                      ));
                      const accountLabel = currentAccount?.display_name
                        || currentAccount?.name
                        || currentAccount?.email
                        || `Account ending ${String(event.teacher_user_id || "").slice(-8)}`;
                      const decidedAt = event.decided_at
                        ? new Date(event.decided_at).toLocaleString()
                        : "Time unavailable";
                      const reviewerId = String(event.decided_by || "");
                      const reviewerLabel = reviewerId
                        ? `Admin ID ending ${reviewerId.slice(-8)}`
                        : "Reviewer unavailable";
                      return (
                        <tr key={event.id}>
                          <td data-label="Teacher account">{accountLabel}</td>
                          <td data-label="Decision">
                            <strong>{event.decision_status}</strong>
                            <small>Previously {event.previous_status}</small>
                          </td>
                          <td data-label="Reason">
                            {event.reason || (
                              event.decision_status === "approved"
                                ? "Not required for approval"
                                : "No reason was recorded"
                            )}
                          </td>
                          <td data-label="School at decision">
                            {event.school_name || "No school snapshot recorded"}
                          </td>
                          <td data-label="Reviewed">{decidedAt}</td>
                          <td data-label="Reviewer">
                            <span title={reviewerId || undefined}>
                              {reviewerLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-decision-history-state" role="status">
                Decision history has not been loaded yet.
              </p>
            )}
        </section>
        {accountDecision && (
          <div
            className="admin-account-decision-overlay"
            onMouseDown={event => {
              if (event.target === event.currentTarget) closeTeacherAccountDecision();
            }}
          >
            <TeacherDialog
              busy={accountDecisionBusy}
              className="admin-account-decision-dialog"
              closeOnEscape={!accountDecisionBusy}
              describedBy="admin-account-decision-summary"
              labelledBy="admin-account-decision-title"
              onClose={closeTeacherAccountDecision}
            >
              <form className="page-stack" onSubmit={submitTeacherAccountDecision}>
                <div>
                  <p className="panel-label">Teacher account decision</p>
                  <h4 id="admin-account-decision-title">
                    Confirm {accountDecision.status === "approved"
                      ? "approval"
                      : accountDecision.status === "rejected"
                        ? "rejection"
                        : "account disable"}
                  </h4>
                </div>
                <p id="admin-account-decision-summary">
                  <strong>
                    {accountDecision.account.display_name
                      || accountDecision.account.name
                      || accountDecision.account.email
                      || "Teacher account"}
                  </strong>
                  {" · "}
                  {accountDecision.account.email || "Email unavailable"}
                  {" · "}
                  {schoolForTeacherAccount(accountDecision.account)?.name
                    || "School not resolved"}
                </p>
                {accountDecision.status === "approved" ? (
                  <p className="muted-text">
                    Approval opens this school&apos;s teacher tools and student data to this account.
                  </p>
                ) : (
                  <label className="auth-field" htmlFor="admin-account-decision-reason">
                    <strong>
                      Reason for {accountDecision.status === "rejected"
                        ? "rejection"
                        : "disabling the account"}
                    </strong>
                    <textarea
                      id="admin-account-decision-reason"
                      maxLength={500}
                      minLength={5}
                      onChange={event => {
                        setAccountDecisionReason(event.target.value);
                        setAccountDecisionError("");
                      }}
                      required
                      rows={4}
                      value={accountDecisionReason}
                    />
                    <span className="muted-text auth-field-hint">
                      Use plain, factual wording. This note is kept with the review record.
                    </span>
                  </label>
                )}
                {accountDecisionError && (
                  <p className="admin-account-decision-error" role="alert">
                    {accountDecisionError}
                  </p>
                )}
                <div className="button-row admin-account-decision-actions">
                  <button
                    className="report-button"
                    data-autofocus
                    disabled={accountDecisionBusy}
                    onClick={closeTeacherAccountDecision}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className={accountDecision.status === "approved"
                      ? "main-button"
                      : "report-button danger"}
                    disabled={accountDecisionBusy || (
                      accountDecision.status !== "approved"
                      && accountDecisionReason.trim().length < 5
                    )}
                    type="submit"
                  >
                    {accountDecisionBusy
                      ? "Saving decision…"
                      : `Confirm ${accountDecision.status === "approved"
                        ? "approval"
                        : accountDecision.status === "rejected"
                          ? "rejection"
                          : "disable"}`}
                  </button>
                </div>
              </form>
            </TeacherDialog>
          </div>
        )}
      </section>
      )}

      {activeSection === "guidedInsight" && (
      <section className="report-panel page-stack admin-section admin-section-panel guided-insight-panel">
        <div className="admin-header">
          <div>
            <h3>Guided Reading Insight</h3>
            <p className="muted-text">Book availability, phonics patterns, microphase recommendations, and QA warnings for assignment planning.</p>
          </div>
          <span className="guided-insight-status">{guidedReadingInsight.active}/{guidedReadingInsight.total} visible</span>
        </div>
        <div className="guided-insight-grid">
          <article>
            <strong>QA Status</strong>
            {Object.entries(guidedReadingInsight.byStatus).map(([status, count]) => (
              <span key={status}>{status}: {count}</span>
            ))}
            {guidedReadingInsight.draft > 0 && <small>{guidedReadingInsight.draft} draft/review books should not be assigned by default.</small>}
          </article>
          <article>
            <strong>Levels</strong>
            {Object.entries(guidedReadingInsight.byLevel).map(([level, count]) => (
              <span key={level}>Level {level}: {count}</span>
            ))}
          </article>
          <article>
            <strong>Microphases</strong>
            {Object.entries(guidedReadingInsight.microphaseCounts).slice(0, 6).map(([phase, count]) => (
              <span key={phase}>{phase.replace(/-/g, " ")}: {count}</span>
            ))}
          </article>
          <article>
            <strong>Top Patterns</strong>
            {Object.entries(guidedReadingInsight.patternCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([pattern, count]) => (
              <span key={pattern}>{pattern.replace(/-/g, " ")}: {count}</span>
            ))}
          </article>
        </div>
        <div className="guided-insight-recommendations">
          <strong>Sample targeted recommendations</strong>
          {guidedReadingInsight.recommendations.map(item => (
            <span key={item.book.id}>{item.book.title} · Level {item.book.level} · {item.reasons.slice(0, 2).join(" · ")}</span>
          ))}
        </div>
        {(guidedReadingInsight.missingImages > 0 || guidedReadingInsight.missingText > 0) && (
          <p className="message warning">Guided Reading warning: {guidedReadingInsight.missingImages} missing page images and {guidedReadingInsight.missingText} missing text fields.</p>
        )}
      </section>
      )}

      {activeSection === "guidedMediaQa" && (
      <section className="report-panel page-stack admin-section admin-section-panel guided-media-qa-panel">
        <div className="admin-section-heading">
          <div>
            <h3>Guided Reading Media QA</h3>
            <p className="muted-text">Admin-only audit for Guided Reading image text artifacts and missing clickable word audio.</p>
          </div>
          <span className="admin-count-pill">Admin only</span>
        </div>

        <div className="summary-grid compact-summary-grid">
          <article>
            <span>Active books scanned</span>
            <strong>{guidedReadingWordAudioCoverage.activeBooksScanned || guidedReadingImageTextQa.activeBooksScanned || 0}</strong>
          </article>
          <article>
            <span>Images manual review</span>
            <strong>{guidedReadingImageTextQa.needsManualReviewCount || 0}</strong>
          </article>
          <article>
            <span>Images replacement</span>
            <strong>{guidedReadingImageTextQa.needsReplacementCount || 0}</strong>
          </article>
          <article>
            <span>Missing word audio</span>
            <strong>{guidedReadingWordAudioCoverage.uniqueWordsMissingAudio || 0}</strong>
          </article>
          <article>
            <span>Books affected</span>
            <strong>{guidedReadingWordAudioCoverage.booksWithMissingWordAudio || 0}</strong>
          </article>
        </div>

        <div className="teacher-report-grid">
          <article className="teacher-report-card">
            <h4>Audit Outputs</h4>
            <ul className="admin-qa-file-list">
              <li><code>docs/guided-reading/guided_reading_image_text_artifact_audit.md</code></li>
              <li><code>docs/guided-reading/manual_image_text_artifact_review.md</code></li>
              <li><code>docs/guided-reading/guided_reading_word_audio_inventory.md</code></li>
              <li><code>docs/assets/kimi_guided_reading_image_replacement_request.md</code></li>
              <li><code>docs/assets/kimi_guided_reading_missing_word_audio_request.md</code></li>
            </ul>
          </article>
          <article className="teacher-report-card">
            <h4>Image QA Issue Books</h4>
            {(guidedReadingImageTextQa.booksWithImageQaIssues || []).length ? (
              (guidedReadingImageTextQa.booksWithImageQaIssues || []).slice(0, 8).map(row => (
                <p key={row.bookId}><strong>{row.title}</strong> · {row.manualReview || 0} review · {row.replacement || 0} replacement · {row.broken || 0} broken</p>
              ))
            ) : (
              <p>No replacement/manual-review image issues are currently summarized.</p>
            )}
          </article>
        </div>

        <div className="admin-table-wrap teacher-scroll-panel">
          <table className="dashboard-table admin-table admin-responsive-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Missing Unique Words</th>
                <th>Missing Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {(guidedReadingWordAudioCoverage.worstAffectedBooks || []).length ? (
                guidedReadingWordAudioCoverage.worstAffectedBooks.map(row => (
                  <tr key={row.bookId}>
                    <td data-label="Book">{row.title}</td>
                    <td data-label="Missing Unique Words">{row.missingWordCount}</td>
                    <td data-label="Missing Occurrences">{row.missingOccurrences}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No missing clickable word audio is currently summarized.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === "coverage" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Content Coverage</h3>
        <p className="muted-text">
          One canonical rubric decides each skill. Authored is the deduplicated source bank,
          approved passes the strict content review, and student exposure today comes from the
          exact release-gated bank the student loader can return.
        </p>

        <div className="admin-content-filters">
          <select value={skillFilter} onChange={event => setSkillFilter(event.target.value)}>
            <option value="all">All skills</option>
            {questionBankCoverage.map(row => (
              <option key={row.skill} value={row.skill}>{row.skill}</option>
            ))}
          </select>

          <select value={templateFilter} onChange={event => setTemplateFilter(event.target.value)}>
            <option value="all">All templates</option>
            {templateOptions.map(template => (
              <option key={template} value={template}>{template}</option>
            ))}
          </select>

          <select value={difficultyFilter} onChange={event => setDifficultyFilter(event.target.value)}>
            <option value="all">All difficulties</option>
            {difficultyOptions.map(difficulty => (
              <option key={difficulty} value={difficulty}>{difficulty}</option>
            ))}
          </select>

          <input
            value={patternFilter}
            onChange={event => setPatternFilter(event.target.value)}
            placeholder="Pattern"
            type="search"
          />

          <select value={mediaFilter} onChange={event => setMediaFilter(event.target.value)}>
            <option value="all">All media</option>
            <option value="missing_image">Missing image</option>
            <option value="missing_audio">Missing audio</option>
            <option value="complete_media">Complete media</option>
            <option value="bad_media">Bad media flagged</option>
          </select>

          <select value={statusFilterLocal} onChange={event => setStatusFilterLocal(event.target.value)}>
            <option value="all">Active + inactive</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Authored</th>
                <th>Approved</th>
                <th>Student exposure today</th>
                <th>Exact exposure set</th>
                <th>Gate reason</th>
                <th>Release exclusions / waivers</th>
                <th>Media gaps</th>
                <th>Audio approval blocks</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoverage.map(row => (
                <tr key={row.skill}>
                  <td data-label="Skill"><strong>{row.skill}</strong></td>
                  <td data-label="Status">{row.releaseReady ? "READY" : "BLOCKED"}</td>
                  <td data-label="Owner">{row.releaseOwner}</td>
                  <td data-label="Authored">{row.authored ?? row.total}</td>
                  <td data-label="Approved">{row.approved ?? row.active}</td>
                  <td data-label="Student exposure today">
                    {row.runtimeSelectable || 0} questions
                    {row.runtimeSelectable
                      ? ` (L1 ${row.exposureLevel1}; L2 ${row.exposureLevel2})`
                      : " — blocked from students"}
                  </td>
                  <td data-label="Exact exposure set">
                    {row.exposureFingerprint
                      ? `sha256:${row.exposureFingerprint.slice(0, 12)}`
                      : "Fingerprint missing"}
                  </td>
                  <td data-label="Gate reason">
                    {row.releaseReasons.length
                      ? row.releaseReasons.join(" ")
                      : "All canonical release dimensions pass."}
                  </td>
                  <td data-label="Release exclusions / waivers">
                    {row.releaseWaiver?.excludedQuestionCount
                      ? `${row.releaseWaiver.excludedQuestionCount} excluded; review ${
                          row.releaseWaiver.reviewBy.join(", ") || "date missing"
                        }`
                      : "None"}
                  </td>
                  <td data-label="Media gaps">{row.missingImage} image / {row.missingAudio} audio</td>
                  <td data-label="Audio approval blocks">{row.unapprovedAudio || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === "assessmentAudio" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Assessment Audio Coverage</h3>
        <p className="muted-text">
          Tracks whether assessment audio uses the current neutral soft American female generated-voice standard.
          Replacement rows are generated in <code>docs/assets/replacement_assessment_audio_request.md</code>.
        </p>

        <div className="summary-grid compact-summary-grid">
          <article>
            <span>Total references</span>
            <strong>{assessmentAudioCoverage.summary?.totalReferences || 0}</strong>
          </article>
          <article>
            <span>Standard voice</span>
            <strong>{assessmentAudioCoverage.summary?.standardVoiceCount || 0}</strong>
          </article>
          <article>
            <span>Replacement needed</span>
            <strong>{assessmentAudioCoverage.summary?.replacementNeededCount || 0}</strong>
          </article>
          <article>
            <span>Missing/broken</span>
            <strong>{assessmentAudioCoverage.summary?.missingCount || 0} / {assessmentAudioCoverage.summary?.brokenReferenceCount || 0}</strong>
          </article>
          <article>
            <span>Human review</span>
            <strong>{assessmentAudioCoverage.summary?.needsHumanReviewCount || 0}</strong>
          </article>
        </div>

        <div className="admin-table-wrap teacher-scroll-panel">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>References</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(assessmentAudioCoverage.statusCounts || {}).sort().map(([status, count]) => (
                <tr key={status}>
                  <td data-label="Status">{status.replace(/_/g, " ")}</td>
                  <td data-label="References">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-table-wrap teacher-scroll-panel">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>References</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(assessmentAudioCoverage.issueCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([issue, count]) => (
                <tr key={issue}>
                  <td data-label="Issue">{issue.replace(/_/g, " ")}</td>
                  <td data-label="References">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === "calibration" && <CalibrationMonitoringPanel />}

      {activeSection === "schools" && (
      <section className="card page-stack admin-section admin-section-panel">
        <h3>Schools</h3>
        <p className="muted-text">Every school registered in the system, with its teachers and classes.</p>
        {schools.length === 0 ? (
          <p>No schools registered yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Teachers</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Created</th>
                  <th>Retention</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(school => {
                  const schoolTeachers = pendingAccounts.filter(account => account.school_id === school.id);
                  const schoolClasses = classes.filter(row => row.school_id === school.id);
                  const schoolStudents = schoolClasses.reduce((sum, row) => sum + (row.studentCount || 0), 0);
                  const retentionOpen = retentionSchoolId === school.id;
                  return (
                    <Fragment key={school.id}>
                      <tr>
                        <td data-label="School"><strong>{school.name}</strong></td>
                        <td data-label="Teachers">
                          {schoolTeachers.length === 0
                            ? "0"
                            : schoolTeachers.map(account => account.display_name || account.username || account.email).join(", ")}
                        </td>
                        <td data-label="Classes">{schoolClasses.length}</td>
                        <td data-label="Students">{schoolStudents}</td>
                        <td data-label="Created">{school.created_at ? new Date(school.created_at).toLocaleDateString() : "-"}</td>
                        <td data-label="Retention">
                          <button
                            className="text-button"
                            type="button"
                            disabled={!supabase}
                            onClick={() => setRetentionSchoolId(retentionOpen ? "" : school.id)}
                          >
                            {retentionOpen ? "Close policy" : "Open policy"}
                          </button>
                        </td>
                      </tr>
                      {retentionOpen && supabase && (
                        <tr className="admin-retention-detail-row">
                          <td colSpan={6}>
                            <SchoolRetentionPolicyPanel
                              client={supabase}
                              school={school}
                              onChanged={refreshDashboard}
                              onLearnersDeleted={handleRetentionLearnersDeleted}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {activeSection === "teachers" && (
      <section className="card page-stack admin-section admin-section-panel">
        <h3>Teachers</h3>
        <p className="muted-text">Tap a teacher to see their classes and move them to another school.</p>
        {teachers.length === 0 ? (
          <p>No teacher data loaded.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>School</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => {
                  const account = pendingAccounts.find(row => row.user_id === teacher.id);
                  const school = schools.find(row => row.id === account?.school_id);
                  const teacherClasses = classes.filter(row => row.teacher_id === teacher.id);
                  const isExpanded = expandedTeacherId === teacher.id;
                  return (
                    <Fragment key={teacher.id}>
                      <tr>
                        <td data-label="Name">{account?.display_name || account?.username || "-"}</td>
                        <td data-label="Email">{teacher.email}</td>
                        <td data-label="School">{school?.name || <em className="muted-text">No school</em>}</td>
                        <td data-label="Classes">{teacher.classes}</td>
                        <td data-label="Students">{teacher.students}</td>
                        <td data-label="Details">
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => {
                              setExpandedTeacherId(isExpanded ? "" : teacher.id);
                              setTeacherSchoolDraft(school?.name || "");
                            }}
                          >
                            {isExpanded ? "Hide" : "Open"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="admin-teacher-detail-row">
                          <td colSpan={6}>
                            <div className="admin-teacher-detail">
                              <div>
                                <h4>Classes</h4>
                                {teacherClasses.length === 0 ? (
                                  <p className="muted-text">No classes yet.</p>
                                ) : (
                                  <ul className="admin-teacher-class-list">
                                    {teacherClasses.map(row => (
                                      <li key={row.id}>
                                        <strong>{row.name}</strong>
                                        <span>{row.studentCount || 0} student{(row.studentCount || 0) === 1 ? "" : "s"}</span>
                                        <button className="text-button danger" type="button" onClick={() => deleteClass?.(row.id, row.name)}>
                                          Delete
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div>
                                <h4>School</h4>
                                <div className="admin-teacher-school-edit">
                                  <SchoolNameInput
                                    value={teacherSchoolDraft}
                                    placeholder="Choose or type a school"
                                    onChange={setTeacherSchoolDraft}
                                  />
                                  <button
                                    className="lp-button lp-button-primary"
                                    type="button"
                                    disabled={!teacherSchoolDraft.trim()}
                                    onClick={() => setTeacherSchool?.(teacher.id, teacherSchoolDraft)}
                                  >
                                    Save School
                                  </button>
                                </div>
                                <p className="muted-text">Moving a teacher also moves all of their classes to the new school.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {activeSection === "classes" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Classes</h3>
        <div className="admin-table-wrap teacher-scroll-panel">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Teacher</th>
                <th>Students</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(row => (
                <tr key={row.id}>
                  <td data-label="Name">{row.name}</td>
                  <td data-label="Teacher">{row.teacher_id}</td>
                  <td data-label="Students">{row.studentCount}</td>
                  <td data-label="Created">{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td data-label="Delete">
                    <button className="reset-button" onClick={() => deleteClass(row.id, row.name)} type="button">
                      Delete Class
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === "students" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Students</h3>
        <div className="admin-table-wrap teacher-scroll-panel">
          <table className="dashboard-table admin-table admin-responsive-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Created</th>
                {onLoadStudent && <th>Load</th>}
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {students.map(row => (
                <tr key={row.id}>
                  <td data-label="Name">
                    {onLoadStudent ? (
                      <button
                        className="lp-button lp-button-secondary compact-table-action"
                        onClick={() => onLoadStudent(row.id, row.name)}
                        type="button"
                      >
                        {row.name}
                      </button>
                    ) : row.name}
                  </td>
                  <td data-label="Class">{row.className}</td>
                  <td data-label="Teacher">{row.teacher_id}</td>
                  <td data-label="Created">{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  {onLoadStudent && (
                    <td data-label="Load">
                      <button
                        className="lp-button lp-button-primary compact-table-action"
                        onClick={() => onLoadStudent(row.id, row.name)}
                        type="button"
                      >
                        Load -&gt;
                      </button>
                    </td>
                  )}
                  <td data-label="Delete">
                    <button className="reset-button" onClick={() => setDataRightsStudent(row)} type="button">
                      Export or delete data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === "mapStops" && <MapStopEditor />}
      {activeSection === "hollowSpots" && <HollowSpotEditor />}
      <LearnerDataRightsDialog
        key={dataRightsStudent?.id || "closed-data-rights"}
        client={supabase}
        learner={dataRightsStudent}
        open={Boolean(dataRightsStudent)}
        onClose={() => setDataRightsStudent(null)}
        onDeleted={handleAdminDataRightsDeletion}
      />
      <RemoteErrorMonitorPanel client={supabase} />
      <CrashLogPanel />
    </main>
  );
}

function RemoteErrorMonitorPanel({ client }) {
  const [summary, setSummary] = useState([]);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(client ? "loading" : "unavailable");

  async function loadMonitor() {
    if (!client?.call) {
      setStatus("unavailable");
      return;
    }
    setStatus("loading");
    const [summaryResult, eventResult] = await Promise.all([
      client.call("admin_error_monitor_summary"),
      client.call("admin_recent_error_events", { p_limit: 25 })
    ]);
    if (summaryResult.error || eventResult.error) {
      setStatus("error");
      return;
    }
    setSummary(Array.isArray(summaryResult.data) ? summaryResult.data : []);
    setEvents(Array.isArray(eventResult.data) ? eventResult.data : []);
    setStatus("ready");
  }

  useEffect(() => {
    void loadMonitor();
    // The client identity is stable for the mounted admin session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const alertCount = summary.reduce(
    (total, row) => total + Math.max(0, Number(row.alerts_24h) || 0),
    0
  );
  const budgetRows = summary.map(row => ({
    ...row,
    budget: evaluateFleetErrorBudget(row)
  }));

  return (
    <section
      className="card page-stack remote-error-monitor-panel"
      aria-label="Fleet error monitor"
      data-monitor-state={status}
    >
      <div className="admin-monitor-heading">
        <div>
          <p className="panel-label">Operations</p>
          <h2>Fleet error monitor</h2>
          <p className="muted-text">
            Redacted diagnostics only. No student names, answers, class codes, account IDs,
            URLs, or arbitrary message text are collected. Events expire after 30 days.
          </p>
        </div>
        <button className="report-button" type="button" onClick={loadMonitor}>
          Refresh monitor
        </button>
      </div>

      {status === "loading" && <p role="status">Loading remote error health...</p>}
      {status === "unavailable" && (
        <p role="alert">Remote monitoring is unavailable because the backend is not configured.</p>
      )}
      {status === "error" && (
        <p role="alert">Remote monitoring could not be loaded. The on-device fallback remains active.</p>
      )}
      {status === "ready" && (
        <>
          {alertCount > 0 ? (
            <p className="admin-monitor-alert" role="alert">
              {alertCount} fleet alert{alertCount === 1 ? "" : "s"} require review.
            </p>
          ) : (
            <p role="status">No fleet alerts in the last 24 hours.</p>
          )}
          <p className="muted-text">
            Operational error budget: zero fatal or repeat-fingerprint alerts per release
            in a rolling {FLEET_ERROR_BUDGET_POLICY.windowHours}-hour window. This is a
            diagnostic incident budget, not a claim about measured user availability.
          </p>
          {summary.length === 0 ? (
            <p>
              No remote errors recorded in the last 24 hours. Health remains unverified
              until a seeded release event confirms the monitor path.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <caption>Errors by release in the last 24 hours</caption>
                <thead>
                  <tr>
                    <th scope="col">Release</th>
                    <th scope="col">Events</th>
                    <th scope="col">Fingerprints</th>
                    <th scope="col">Fatal</th>
                    <th scope="col">Alerts</th>
                    <th scope="col">Budget</th>
                    <th scope="col">Latest</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRows.map(row => (
                    <tr key={row.release_id}>
                      <th scope="row">{row.release_id}</th>
                      <td>{row.events_24h}</td>
                      <td>{row.affected_fingerprints}</td>
                      <td>{row.fatal_events_24h}</td>
                      <td>{row.alerts_24h}</td>
                      <td>
                        <strong data-budget-status={row.budget.status}>
                          {row.budget.label}
                        </strong>
                      </td>
                      <td>{row.latest_at ? new Date(row.latest_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <details>
            <summary>Recent redacted events ({events.length})</summary>
            {events.length === 0 ? (
              <p>No retained events.</p>
            ) : (
              <ol className="remote-error-event-list">
                {events.map((event, index) => (
                  <li key={`${event.fingerprint}-${event.occurred_at}-${index}`}>
                    <strong>{event.error_type}</strong>
                    <span>
                      {event.surface} · {event.source} · release {event.release_id}
                    </span>
                    <small>
                      Fingerprint {event.fingerprint} · {new Date(event.occurred_at).toLocaleString()}
                    </small>
                    {Array.isArray(event.stack_frames) && event.stack_frames.length > 0 && (
                      <code>{event.stack_frames[0]}</code>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </details>
        </>
      )}
    </section>
  );
}

// The on-device flight recorder stays as a fallback when remote delivery is
// unavailable. It stores the same redacted fields as the remote monitor.
function CrashLogPanel() {
  const [rows, setRows] = useState(() => readErrorLog());
  if (!rows.length) return null;
  return (
    <section className="card page-stack crash-log-panel">
      <details>
        <summary>
          Recent app errors on this device ({rows.length})
        </summary>
        <p className="muted-text">
          Caught by the in-app safety net. Students saw a friendly &ldquo;try again&rdquo; screen;
          these redacted details remain on this device as a delivery fallback.
        </p>
        <ul className="crash-log-list">
          {rows.map((row, index) => (
            <li key={`${row.at}-${index}`}>
              <strong>{row.label}</strong> · {new Date(row.at).toLocaleString()}
              <div className="crash-log-message">
                {row.message} · release {row.releaseId || "legacy-local"}
              </div>
            </li>
          ))}
        </ul>
        <button
          className="report-button"
          type="button"
          onClick={() => { clearErrorLog(); setRows([]); }}
        >
          Clear log
        </button>
      </details>
    </section>
  );
}
