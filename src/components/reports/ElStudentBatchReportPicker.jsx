import { useMemo, useState } from "react";

import {
  displayBenchmarkScopeLabel,
  isElBenchmarkAssessmentRecord,
  resolveElBenchmarkReportScope
} from "../../data/elBenchmarkReportScope.js";
import {
  EL_EXPORT_GRADE_OPTIONS,
  EL_EXPORT_WINDOW_OPTIONS,
  normalizeElExportScope
} from "../../utils/elAssessmentExportPolicy.js";
import { importWithRetry } from "../../utils/lazyWithRetry.js";
import { ActionFeedback } from "../ActionFeedback.jsx";

const EL_OBSERVATION_ASSESSMENT_IDS = new Set([
  "el_letter_assessment",
  "advanced_phonics_patterns"
]);

function normalizedAssessmentId(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isSavedElAssessmentRecord(record = {}) {
  if (isElBenchmarkAssessmentRecord(record)) return true;
  return [record.assessmentType, record.assessmentId, record.skillId]
    .map(normalizedAssessmentId)
    .some(value => EL_OBSERVATION_ASSESSMENT_IDS.has(value));
}

function scopeKey(scope = {}) {
  return `${scope.grade || ""}::${scope.benchmarkWindow || scope.window || ""}`;
}

function studentName(student = {}) {
  return String(student.name || student.studentName || "Unnamed student");
}

export function ElStudentBatchReportPicker({
  assessmentHistory = [],
  classId = "",
  classes = [],
  evidenceLoading = false,
  evidenceReady = true,
  students = [],
  supabase = null,
  teacherId = "local"
}) {
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedScopeKey, setSelectedScopeKey] = useState("");
  const [manualScope, setManualScope] = useState({ grade: "", benchmarkWindow: "" });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const classRecords = useMemo(() => assessmentHistory.filter(record => (
    String(record.classId || record.class_id || "") === String(classId || "")
  )), [assessmentHistory, classId]);
  const eligibleStudents = useMemo(() => {
    const eligibleIds = new Set(classRecords
      .filter(isSavedElAssessmentRecord)
      .map(record => String(record.studentId || record.student_id || ""))
      .filter(Boolean));
    return students
      .filter(student => eligibleIds.has(String(student.id || "")))
      .slice()
      .sort((left, right) => studentName(left).localeCompare(studentName(right)));
  }, [classRecords, students]);
  const eligibleIds = useMemo(
    () => new Set(eligibleStudents.map(student => String(student.id))),
    [eligibleStudents]
  );
  const selectedIds = selectedStudentIds
    .map(String)
    .filter(studentId => eligibleIds.has(studentId));
  const scopeOptions = useMemo(() => (
    resolveElBenchmarkReportScope({ records: classRecords }).availableRoutes || []
  ), [classRecords]);
  const selectedRoute = scopeOptions.find(scope => scopeKey(scope) === selectedScopeKey)
    || scopeOptions[0]
    || null;
  const activeScope = selectedRoute || normalizeElExportScope(manualScope);
  const scopeReady = Boolean(activeScope?.grade && activeScope?.benchmarkWindow);
  const allSelected = eligibleStudents.length > 0 && selectedIds.length === eligibleStudents.length;

  function toggleStudent(studentId, checked) {
    setSelectedStudentIds(current => (
      checked
        ? [...new Set([...current.map(String), studentId])]
        : current.map(String).filter(value => value !== studentId)
    ));
  }

  async function downloadSelectedReports() {
    if (!evidenceReady || !scopeReady || !selectedIds.length || busy) return;
    setBusy(true);
    setFeedback({ kind: "pending", message: "Creating the selected student reports..." });
    try {
      const { exportStudentElAssessmentBatch } = await importWithRetry(
        () => import("../../utils/exportElAssessmentExcel.js")
      );
      const result = await exportStudentElAssessmentBatch({
        assessmentHistory,
        students,
        classes,
        classId,
        studentIds: selectedIds,
        teacherId: teacherId || "local",
        benchmarkScope: {
          grade: activeScope.grade,
          benchmarkWindow: activeScope.benchmarkWindow,
          label: displayBenchmarkScopeLabel(activeScope)
        },
        supabase
      });
      const durable = result.persistence.every(entry => entry?.durable !== false);
      setFeedback({
        kind: durable ? "success" : "error",
        message: durable
          ? `${result.reports.length} student reports downloaded together in one ZIP.`
          : `${result.reports.length} student reports downloaded, but one or more report-history copies could not be retained. Keep the ZIP.`
      });
    } catch (error) {
      console.error("Batch EL student report export failed:", error);
      setFeedback({
        kind: "error",
        message: "The selected student reports could not be created. No saved report was deleted."
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="teacher-batch-el-report-title"
      className="teacher-batch-el-report"
    >
      <header>
        <div>
          <p className="panel-label">Multiple students</p>
          <h4 id="teacher-batch-el-report-title">Download student EL reports</h4>
          <p>Select students once. The download contains one individual Excel report per student in a single ZIP.</p>
        </div>
        <span aria-live="polite">{selectedIds.length} selected</span>
      </header>

      {!evidenceReady ? (
        <p className="teacher-batch-el-report-note" role={evidenceLoading ? "status" : "alert"}>
          {evidenceLoading
            ? "Loading the complete student list and saved EL results..."
            : "Some student or EL results could not be confirmed, so batch downloads are paused."}
        </p>
      ) : eligibleStudents.length === 0 ? (
        <p className="teacher-batch-el-report-note">
          No students in this class have saved EL assessment results yet.
        </p>
      ) : (
        <>
          <div className="teacher-batch-el-report-scope">
            <div className="teacher-batch-el-report-scope-field">
              <span>Results to include</span>
              {scopeOptions.length ? (
                <select
                  aria-label="Grade and time of year for selected student reports"
                  onChange={event => setSelectedScopeKey(event.target.value)}
                  value={scopeKey(selectedRoute)}
                >
                  {scopeOptions.map((scope, index) => (
                    <option key={scopeKey(scope)} value={scopeKey(scope)}>
                      {displayBenchmarkScopeLabel(scope)} ({scope.attemptCount} {scope.attemptCount === 1 ? "attempt" : "attempts"}){index === 0 ? " (most recent)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="teacher-batch-el-report-manual-scope">
                  <select
                    aria-label="Grade for selected student reports"
                    onChange={event => setManualScope(current => ({ ...current, grade: event.target.value }))}
                    value={manualScope.grade}
                  >
                    <option value="">Choose grade</option>
                    {EL_EXPORT_GRADE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Time of year for selected student reports"
                    onChange={event => setManualScope(current => ({
                      ...current,
                      benchmarkWindow: event.target.value
                    }))}
                    value={manualScope.benchmarkWindow}
                  >
                    <option value="">Choose time of year</option>
                    {EL_EXPORT_WINDOW_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </span>
              )}
            </div>
            <button
              className="lp-button lp-button-secondary"
              onClick={() => setSelectedStudentIds(
                allSelected ? [] : eligibleStudents.map(student => String(student.id))
              )}
              type="button"
            >
              {allSelected ? "Clear selection" : "Select all with saved results"}
            </button>
          </div>

          <div className="teacher-batch-el-report-students" role="group" aria-label="Select student EL reports">
            {eligibleStudents.map(student => {
              const studentId = String(student.id);
              return (
                <label key={studentId}>
                  <input
                    checked={selectedIds.includes(studentId)}
                    onChange={event => toggleStudent(studentId, event.target.checked)}
                    type="checkbox"
                  />
                  <span>{studentName(student)}</span>
                </label>
              );
            })}
          </div>

          <div className="teacher-batch-el-report-actions">
            <button
              className="lp-button lp-button-primary"
              disabled={!scopeReady || !selectedIds.length || busy}
              onClick={downloadSelectedReports}
              type="button"
            >
              {busy ? "Creating student reports..." : `Download selected reports (${selectedIds.length})`}
            </button>
            {!scopeReady && (
              <small>Choose the grade and time of year before downloading.</small>
            )}
          </div>
        </>
      )}

      <ActionFeedback feedback={feedback} />
    </section>
  );
}
