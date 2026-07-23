import { useEffect, useMemo, useState } from "react";
import { resolveElBenchmarkReportScope } from "../../data/elBenchmarkReportScope.js";
import { importWithRetry } from "../../utils/lazyWithRetry.js";

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
  const [historyNotice, setHistoryNotice] = useState("");
  const [actionNotice, setActionNotice] = useState("");
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
      setHistoryNotice("");
      return hydrated;
    } catch (error) {
      console.error("Cloud EL assessment report history could not be loaded:", error);
      setHistoryStatus("local-only");
      setHistoryNotice("Cloud report history is unavailable. Showing this browser's offline cache.");
      return localReports;
    }
  }

  useEffect(() => {
    let cancelled = false;
    importWithRetry(() => import("../../data/elAssessmentReportStore.js"))
      .then(async store => {
        if (cancelled) return;
        setHistoryStatus("loading");
        setHistoryNotice("");
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
          setHistoryNotice("Cloud report history is unavailable. Showing this browser's offline cache.");
        }
      })
      .catch(error => {
        if (cancelled) return;
        console.error("EL assessment report history could not be opened:", error);
        setHistoryStatus("error");
        setHistoryNotice("Saved report history could not be opened. Refresh the page to try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, teacherStorageId]);

  async function exportClassExcel() {
    if (!selectedClassId || !activeScope) return;
    setBusyAction("export");
    setActionNotice("");
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
      setActionNotice(report.persistence?.durable === false
        ? "Excel downloaded, but the saved-report copy could not be retained. Keep the downloaded file."
        : `Excel downloaded and saved for ${report.benchmarkScope?.label || activeScope.label}.`);
    } catch (error) {
      console.error("Class EL assessment Excel export failed:", error);
      setActionNotice("The EL Excel report could not be created. No report was deleted.");
    } finally {
      setBusyAction("");
    }
  }

  async function downloadSavedReport(report) {
    setBusyAction(`download:${report.reportId}`);
    setActionNotice("");
    try {
      const { downloadElAssessmentReport } = await importWithRetry(() => import("../../utils/exportElAssessmentExcel.js"));
      await downloadElAssessmentReport(report);
      setActionNotice(`Downloaded ${report.fileName || "the saved EL report"}.`);
    } catch (error) {
      console.error("Saved EL assessment report download failed:", error);
      setActionNotice("The saved EL report could not be downloaded. It remains in report history.");
    } finally {
      setBusyAction("");
    }
  }

  async function confirmDeleteSavedReport() {
    if (!deleteTarget) return;
    const reportId = deleteTarget.reportId;
    setBusyAction(`delete:${reportId}`);
    setActionNotice("");
    try {
      const { deleteSavedElAssessmentReport } = await importWithRetry(() => import("../../data/elAssessmentReportStore.js"));
      await deleteSavedElAssessmentReport(reportId, { teacherId: teacherStorageId, supabase });
      setDeleteTarget(null);
      await refreshSavedReports();
      setActionNotice(supabase
        ? "Saved report deleted from cloud history and this browser."
        : "Saved report deleted from this browser.");
    } catch (error) {
      console.error("Saved EL assessment report delete failed:", error);
      setActionNotice("The saved report could not be deleted from cloud history, so the browser copy was kept.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section className="teacher-report-card el-formal-assessments-panel" aria-labelledby="el-formal-assessments-title">
      <header className="el-formal-assessments-heading">
        <div>
          <p className="panel-label">Formal evidence</p>
          <h3 id="el-formal-assessments-title">EL Formal Assessments</h3>
          <p>Choose one benchmark route before creating a class PDF or Excel workbook.</p>
        </div>
        <span className="report-scope-count">
          {activeScope ? `${activeScope.attemptCount} scoped attempt${activeScope.attemptCount === 1 ? "" : "s"}` : "No benchmark route"}
        </span>
      </header>

      <div className="class-report-print-actions el-formal-export-controls screen-only">
        <label>
          Evidence scope
          <select
            aria-label="EL evidence scope"
            disabled={scopeOptions.length === 0}
            onChange={event => setSelectedScopeKey(event.target.value)}
            value={activeScope ? getScopeKey(activeScope) : ""}
          >
            {scopeOptions.length === 0 && <option value="">No completed benchmark routes</option>}
            {scopeOptions.map((scope, index) => (
              <option key={getScopeKey(scope)} value={getScopeKey(scope)}>
                {scope.label} ({scope.attemptCount} {scope.attemptCount === 1 ? "attempt" : "attempts"}){index === 0 ? " — most recent" : ""}
              </option>
            ))}
          </select>
        </label>
        <button className="lp-button lp-button-primary" disabled={!activeScope} onClick={onPrint} type="button">
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
            ? "Signed-in report history is retained in cloud storage until you delete it, reset an included learner's assessment data, or remove the teacher account. This browser also keeps only the latest 12 reports for offline access."
            : "This browser keeps only the latest 12 reports for offline access. Older local reports are removed automatically as new reports are saved."}
        </p>
      </div>

      {(historyNotice || actionNotice) && <p className="message" role="status">{actionNotice || historyNotice}</p>}

      <div className="el-saved-reports" aria-busy={historyStatus === "loading"}>
        <div className="el-saved-reports-heading">
          <h4>Saved EL Reports</h4>
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
                  {report.benchmarkScope?.label || "Benchmark scope not recorded"} · {report.summary?.totalAssessments ?? report.summary?.studentCount ?? 0} evidence records
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
