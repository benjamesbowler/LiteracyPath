import { useEffect, useMemo, useState } from "react";
import {
  displayBenchmarkScopeLabel,
  resolveElBenchmarkReportScope
} from "../../data/elBenchmarkReportScope.js";
import { filterSavedElAssessmentReportsForClassRoster } from "../../data/elAssessmentReportStore.js";
import { buildClassElAssessmentReportData } from "../../data/elAssessmentReportStore.js";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { importWithRetry } from "../../utils/lazyWithRetry.js";
import {
  printTeacherDocument,
  TEACHER_PRINT_TARGETS
} from "../../utils/teacherPrintTarget.js";
import { ActionFeedback } from "../ActionFeedback.jsx";
import { ElClassReportDocument } from "./ElClassReportDocument.jsx";

function getScopeKey(scope = {}) {
  return `${scope.grade || ""}::${scope.benchmarkWindow || scope.window || ""}`;
}

function getSavedReportLabel(report = {}, students = [], classes = []) {
  const student = students.find(row => String(row.id) === String(report.studentId || ""));
  const classRow = classes.find(row => String(row.id) === String(report.classId || ""));
  const subject = report.studentName || student?.name || report.className || classRow?.name || "Unassigned";
  return `${report.reportType === "individual" ? "Student" : "Class"} EL report · ${subject}`;
}

export function ElFormalAssessmentsPanel({
  assessmentHistory = [],
  classes = [],
  evidenceReady = true,
  evidenceStatusMessage = "",
  onRetryEvidence,
  selectedClassId = "",
  students = [],
  teacherId = "local",
  supabase = null,
  reportPeriod = null,
  onPrint
}) {
  const [selectedScopeKey, setSelectedScopeKey] = useState("");
  const [savedReports, setSavedReports] = useState([]);
  const [historyStatus, setHistoryStatus] = useState("loading");
  const [historyNotice, setHistoryNotice] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const teacherStorageId = teacherId || "local";

  const classAttempts = useMemo(() => assessmentHistory.filter(record => (
    !selectedClassId ||
    String(record.classId || record.class_id || "") === String(selectedClassId)
  )), [assessmentHistory, selectedClassId]);
  const scopeOptions = useMemo(() => (
    resolveElBenchmarkReportScope({ records: classAttempts }).availableRoutes || []
  ), [classAttempts]);
  const activeScope = scopeOptions.find(scope => getScopeKey(scope) === selectedScopeKey)
    || scopeOptions[0]
    || null;
  const classPrintReport = useMemo(() => (
    evidenceReady && selectedClassId && activeScope
      ? buildClassElAssessmentReportData({
          assessmentHistory,
          students,
          classes,
          classId: selectedClassId,
          teacherId: teacherStorageId,
          benchmarkScope: activeScope,
          reportPeriod
        })
      : null
  ), [
    activeScope,
    assessmentHistory,
    classes,
    evidenceReady,
    reportPeriod,
    selectedClassId,
    students,
    teacherStorageId
  ]);
  const visibleSavedReports = useMemo(() => (
    filterSavedElAssessmentReportsForClassRoster(savedReports, {
      classId: selectedClassId,
      students
    })
  ), [savedReports, selectedClassId, students]);
  const visibleSavedReportIds = useMemo(
    () => new Set(visibleSavedReports.map(report => String(report.reportId || ""))),
    [visibleSavedReports]
  );

  async function refreshSavedReports() {
    const store = await importWithRetry(() => import("../../data/elAssessmentReportStore.js"));
    const localReports = store.filterSavedElAssessmentReportsForClassRoster(
      store.getSavedElAssessmentReports({
        teacherId: teacherStorageId,
        classId: selectedClassId
      }),
      { classId: selectedClassId, students }
    );
    setSavedReports(localReports);
    try {
      const hydrated = store.filterSavedElAssessmentReportsForClassRoster(
        await store.hydrateElAssessmentReports({
          teacherId: teacherStorageId,
          supabase,
          classId: selectedClassId,
          throwOnCloudError: Boolean(supabase)
        }),
        { classId: selectedClassId, students }
      );
      setSavedReports(hydrated);
      setHistoryStatus("ready");
      setHistoryNotice(null);
      return hydrated;
    } catch (error) {
      console.error("Cloud EL assessment report history could not be loaded:", error);
      setHistoryStatus("local-only");
      setHistoryNotice({
        kind: "error",
        message: "Cloud report history is unavailable. Showing this browser's offline cache."
      });
      return localReports;
    }
  }

  useEffect(() => {
    let cancelled = false;
    importWithRetry(() => import("../../data/elAssessmentReportStore.js"))
      .then(async store => {
        if (cancelled) return;
        setHistoryStatus("loading");
        setHistoryNotice(null);
        setDeleteTarget(null);
        const localReports = store.filterSavedElAssessmentReportsForClassRoster(
          store.getSavedElAssessmentReports({
            teacherId: teacherStorageId,
            classId: selectedClassId
          }),
          { classId: selectedClassId, students }
        );
        setSavedReports(localReports);
        try {
          const hydrated = store.filterSavedElAssessmentReportsForClassRoster(
            await store.hydrateElAssessmentReports({
              teacherId: teacherStorageId,
              supabase,
              classId: selectedClassId,
              throwOnCloudError: Boolean(supabase)
            }),
            { classId: selectedClassId, students }
          );
          if (cancelled) return;
          setSavedReports(hydrated);
          setHistoryStatus("ready");
        } catch (error) {
          if (cancelled) return;
          console.error("Cloud EL assessment report history could not be loaded:", error);
          setHistoryStatus("local-only");
          setHistoryNotice({
            kind: "error",
            message: "Cloud report history is unavailable. Showing this browser's offline cache."
          });
        }
      })
      .catch(error => {
        if (cancelled) return;
        console.error("EL assessment report history could not be opened:", error);
        setHistoryStatus("error");
        setHistoryNotice({
          kind: "error",
          message: "Saved report history could not be opened. Refresh the page to try again."
        });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, students, supabase, teacherStorageId]);

  async function exportClassExcel() {
    if (!evidenceReady) {
      setActionNotice({
        kind: "error",
        message: evidenceStatusMessage || "All saved assessment results must finish loading before creating a new report."
      });
      return;
    }
    if (!selectedClassId || !activeScope) return;
    setBusyAction("export");
    setActionNotice({ kind: "pending", message: "Creating the EL Excel report..." });
    try {
      const { exportClassElAssessmentExcel } = await importWithRetry(() => import("../../utils/exportElAssessmentExcel.js"));
      const report = await exportClassElAssessmentExcel({
        assessmentHistory,
        students,
        classes,
        classId: selectedClassId,
        teacherId: teacherStorageId,
        benchmarkScope: activeScope,
        reportPeriod,
        supabase
      });
      await refreshSavedReports();
      setActionNotice({
        kind: report.persistence?.durable === false ? "error" : "success",
        message: report.persistence?.durable === false
          ? "Excel downloaded, but the saved-report copy could not be retained. Keep the downloaded file."
          : `Excel downloaded and saved for ${displayBenchmarkScopeLabel(
              report.benchmarkScope || activeScope
            )}.`
      });
    } catch (error) {
      console.error("Class EL assessment Excel export failed:", error);
      setActionNotice({
        kind: "error",
        message: "The EL Excel report could not be created. No report was deleted."
      });
    } finally {
      setBusyAction("");
    }
  }

  function printClassReport() {
    if (!evidenceReady) {
      setActionNotice({
        kind: "error",
        message: evidenceStatusMessage || "All saved assessment results must finish loading before printing a new report."
      });
      return;
    }
    setActionNotice({ kind: "pending", message: "Opening the EL report print dialog..." });
    window.requestAnimationFrame(() => {
      try {
        printTeacherDocument(
          TEACHER_PRINT_TARGETS.EL_CLASS,
          onPrint || (() => window.print())
        );
        setActionNotice({
          kind: "success",
          message: "Print dialog opened. Choose a printer or save as PDF."
        });
      } catch {
        setActionNotice({
          kind: "error",
          message: "The EL report print dialog could not be opened. Try again."
        });
      }
    });
  }

  async function downloadSavedReport(report) {
    if (!visibleSavedReportIds.has(String(report?.reportId || ""))) {
      setActionNotice({
        kind: "error",
        message: "That saved report does not belong to the selected class, so it was not opened."
      });
      return;
    }
    setBusyAction(`download:${report.reportId}`);
    setActionNotice({ kind: "pending", message: "Preparing the saved EL report download..." });
    try {
      const { downloadElAssessmentReport } = await importWithRetry(() => import("../../utils/exportElAssessmentExcel.js"));
      await downloadElAssessmentReport(report);
      setActionNotice({
        kind: "success",
        message: `Downloaded ${report.fileName || "the saved EL report"}.`
      });
    } catch (error) {
      console.error("Saved EL assessment report download failed:", error);
      setActionNotice({
        kind: "error",
        message: "The saved EL report could not be downloaded. It remains in report history."
      });
    } finally {
      setBusyAction("");
    }
  }

  async function confirmDeleteSavedReport() {
    if (!deleteTarget) return;
    if (!visibleSavedReportIds.has(String(deleteTarget.reportId || ""))) {
      setDeleteTarget(null);
      setActionNotice({
        kind: "error",
        message: "That saved report does not belong to the selected class, so it was not deleted."
      });
      return;
    }
    const reportId = deleteTarget.reportId;
    setBusyAction(`delete:${reportId}`);
    setActionNotice({ kind: "pending", message: "Deleting the saved report..." });
    try {
      const { deleteSavedElAssessmentReport } = await importWithRetry(() => import("../../data/elAssessmentReportStore.js"));
      await deleteSavedElAssessmentReport(reportId, { teacherId: teacherStorageId, supabase });
      setDeleteTarget(null);
      await refreshSavedReports();
      setActionNotice({
        kind: "success",
        message: supabase
          ? "Saved report deleted from cloud history and this browser."
          : "Saved report deleted from this browser."
      });
    } catch (error) {
      console.error("Saved EL assessment report delete failed:", error);
      setActionNotice({
        kind: "error",
        message: "The saved report could not be deleted from cloud history, so the browser copy was kept."
      });
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section className="teacher-report-card el-formal-assessments-panel" aria-labelledby="el-formal-assessments-title">
      <header className="el-formal-assessments-heading">
        <div>
          <p className="panel-label">Saved assessment results</p>
          <h3 id="el-formal-assessments-title">EL assessments</h3>
          <p>
            {TEACHER_COPY.formalEl.choosePeriodIntro}
            {reportPeriod?.label ? ` Showing ${reportPeriod.label.toLowerCase()}.` : ""}
          </p>
        </div>
        <span className="report-scope-count">
          {!evidenceReady
            ? "Current results unavailable"
            : activeScope
              ? TEACHER_COPY.formalEl.savedAssessmentCount(activeScope.attemptCount)
              : TEACHER_COPY.formalEl.noMatchingAssessments}
        </span>
      </header>

      <div className="class-report-print-actions el-formal-export-controls screen-only">
        <label>
          Results to include
          <select
            aria-label="Choose EL results to include"
            disabled={scopeOptions.length === 0}
            onChange={event => setSelectedScopeKey(event.target.value)}
            value={activeScope ? getScopeKey(activeScope) : ""}
          >
            {scopeOptions.length === 0 && (
              <option value="">
                {evidenceReady
                  ? TEACHER_COPY.formalEl.noCompletedAssessments
                  : "Current results unavailable — try again above"}
              </option>
            )}
            {scopeOptions.map((scope, index) => (
              <option key={getScopeKey(scope)} value={getScopeKey(scope)}>
                {scope.label} ({TEACHER_COPY.formalEl.periodOptionCount(scope.attemptCount)}){index === 0 ? " — most recent" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          className="lp-button lp-button-primary"
          disabled={!evidenceReady || !activeScope}
          onClick={printClassReport}
          type="button"
        >
          Print or save EL PDF
        </button>
        <button
          className="lp-button lp-button-secondary"
          disabled={!evidenceReady || !activeScope || busyAction === "export"}
          onClick={exportClassExcel}
          type="button"
        >
          {busyAction === "export" ? "Creating EL Excel…" : "Export EL Excel"}
        </button>
      </div>

      {!evidenceReady && (
        <ActionFeedback
          feedback={{
            kind: "error",
            message: evidenceStatusMessage || "Some saved assessment results are not available, so new reports are paused.",
            actionLabel: onRetryEvidence ? "Try again" : "",
            onAction: onRetryEvidence
          }}
        />
      )}

      <div className="el-report-retention-note">
        <strong>Saved-report retention</strong>
        <p>
          {supabase
            ? "Signed-in report history stays in cloud storage until you delete it, reset an included student's assessment data, or remove the teacher account. This browser also keeps only the latest 12 reports for offline access."
            : "This browser keeps only the latest 12 reports for offline access. Older local reports are removed automatically as new reports are saved."}
        </p>
      </div>

      <ActionFeedback
        feedback={actionNotice || historyNotice || (
          historyStatus === "loading"
            ? { kind: "pending", message: "Loading saved EL report history..." }
            : null
        )}
      />

      <div className="el-saved-reports" aria-busy={historyStatus === "loading"}>
        <div className="el-saved-reports-heading">
          <h4>Saved EL reports</h4>
          <span>{historyStatus === "loading" ? "Loading…" : `${visibleSavedReports.length} saved`}</span>
        </div>
        {historyStatus !== "loading" && visibleSavedReports.length === 0 && (
          <p className="muted-text">No saved EL exports yet. Creating an Excel report adds it here.</p>
        )}
        {visibleSavedReports.map(report => {
          const deleting = deleteTarget?.reportId === report.reportId;
          const busy = busyAction.endsWith(`:${report.reportId}`);
          return (
            <article className="el-saved-report-row" key={report.reportId}>
              <div>
                <strong>{getSavedReportLabel(report, students, classes)}</strong>
                <span>{report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "Date unavailable"}</span>
                <small>
                  {displayBenchmarkScopeLabel(report.benchmarkScope)} · {report.summary?.totalAssessments ?? report.summary?.studentCount ?? 0} result records
                </small>
                {report.selectedDatePeriod?.label && (
                  <small>Class report period: {report.selectedDatePeriod.label}</small>
                )}
              </div>
              {deleting ? (
                <div className="el-report-delete-confirmation" role="group" aria-label="Confirm saved report deletion">
                  <strong>Delete this saved report?</strong>
                  <span>{supabase ? "This removes both cloud and browser copies." : "This removes the browser copy."}</span>
                  <div className="button-row">
                    <button className="report-button" disabled={busy} onClick={() => setDeleteTarget(null)} type="button">
                      Cancel
                    </button>
                    <button className="report-button danger" disabled={busy} onClick={confirmDeleteSavedReport} type="button">
                      {busy ? "Deleting…" : "Delete permanently"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="button-row">
                  <button className="report-button" disabled={busy} onClick={() => downloadSavedReport(report)} type="button">
                    Download Excel
                  </button>
                  <button className="report-button danger" disabled={busy} onClick={() => setDeleteTarget(report)} type="button">
                    Delete
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <ElClassReportDocument report={classPrintReport} />
    </section>
  );
}
