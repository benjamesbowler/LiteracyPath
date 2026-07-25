import { useEffect, useMemo, useState } from "react";
import { resolveElBenchmarkReportScope } from "../../data/elBenchmarkReportScope.js";
import { importWithRetry } from "../../utils/lazyWithRetry.js";
import { ActionFeedback } from "../ActionFeedback.jsx";

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
  selectedClassId = "",
  students = [],
  teacherId = "local",
  supabase = null,
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

  async function refreshSavedReports() {
    const store = await importWithRetry(() => import("../../data/elAssessmentReportStore.js"));
    const localReports = store.getSavedElAssessmentReports({ teacherId: teacherStorageId });
    setSavedReports(localReports);
    try {
      const hydrated = await store.hydrateElAssessmentReports({
        teacherId: teacherStorageId,
        supabase,
        throwOnCloudError: Boolean(supabase)
      });
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
        const localReports = store.getSavedElAssessmentReports({ teacherId: teacherStorageId });
        setSavedReports(localReports);
        try {
          const hydrated = await store.hydrateElAssessmentReports({
            teacherId: teacherStorageId,
            supabase,
            throwOnCloudError: Boolean(supabase)
          });
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
  }, [supabase, teacherStorageId]);

  async function exportClassExcel() {
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
        supabase
      });
      await refreshSavedReports();
      setActionNotice({
        kind: report.persistence?.durable === false ? "error" : "success",
        message: report.persistence?.durable === false
          ? "Excel downloaded, but the saved-report copy could not be retained. Keep the downloaded file."
          : `Excel downloaded and saved for ${report.benchmarkScope?.label || activeScope.label}.`
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
    setActionNotice({ kind: "pending", message: "Opening the EL report print dialog..." });
    window.requestAnimationFrame(() => {
      try {
        onPrint?.();
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
          <p className="panel-label">Saved check results</p>
          <h3 id="el-formal-assessments-title">EL checks</h3>
          <p>Choose one grade and time-of-year route before creating a class PDF or spreadsheet.</p>
        </div>
        <span className="report-scope-count">
          {activeScope ? `${activeScope.attemptCount} included attempt${activeScope.attemptCount === 1 ? "" : "s"}` : "No check route"}
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
            {scopeOptions.length === 0 && <option value="">No completed check routes</option>}
            {scopeOptions.map((scope, index) => (
              <option key={getScopeKey(scope)} value={getScopeKey(scope)}>
                {scope.label} ({scope.attemptCount} {scope.attemptCount === 1 ? "attempt" : "attempts"}){index === 0 ? " — most recent" : ""}
              </option>
            ))}
          </select>
        </label>
        <button className="lp-button lp-button-primary" disabled={!activeScope} onClick={printClassReport} type="button">
          Print or save EL PDF
        </button>
        <button
          className="lp-button lp-button-secondary"
          disabled={!activeScope || busyAction === "export"}
          onClick={exportClassExcel}
          type="button"
        >
          {busyAction === "export" ? "Creating EL Excel…" : "Export EL Excel"}
        </button>
      </div>

      <div className="el-report-retention-note">
        <strong>Saved-report retention</strong>
        <p>
          {supabase
            ? "Signed-in report history stays in cloud storage until you delete it, reset an included child's check data, or remove the teacher account. This browser also keeps only the latest 12 reports for offline access."
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
          <span>{historyStatus === "loading" ? "Loading…" : `${savedReports.length} saved`}</span>
        </div>
        {historyStatus !== "loading" && savedReports.length === 0 && (
          <p className="muted-text">No saved EL exports yet. Creating an Excel report adds it here.</p>
        )}
        {savedReports.map(report => {
          const deleting = deleteTarget?.reportId === report.reportId;
          const busy = busyAction.endsWith(`:${report.reportId}`);
          return (
            <article className="el-saved-report-row" key={report.reportId}>
              <div>
                <strong>{getSavedReportLabel(report, students, classes)}</strong>
                <span>{report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "Date unavailable"}</span>
                <small>
                  {report.benchmarkScope?.label || "Check route not recorded"} · {report.summary?.totalAssessments ?? report.summary?.studentCount ?? 0} result records
                </small>
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
    </section>
  );
}
