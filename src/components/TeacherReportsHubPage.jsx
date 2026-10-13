import { useEffect, useMemo, useRef, useState } from "react";

import {
  readTeacherFunnelParams,
  shouldWriteTeacherReportFunnelParams,
  writeTeacherFunnelParams
} from "../appState/appViewHelpers.js";
import { STUDENT_REPORT_VIEWS } from "./reports/studentReportUiUtils.js";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import { ElStudentBatchReportPicker } from "./reports/ElStudentBatchReportPicker.jsx";
import { getClassListReadView } from "../appState/classListReadState.js";
import { getStudentRosterReadView } from "../appState/studentRosterReadState.js";
import { getClassDashboardReadView } from "../appState/classDashboardReadState.js";
import { isProgressTest } from "../policy/progressTestPolicy.js";
import { ProgressCheckReportsPanel } from "./progress/ProgressCheckReportsPanel.jsx";

const WHOLE_CLASS = "class";
const REPORT_VIEW_IDS = new Set(STUDENT_REPORT_VIEWS.map(view => view.id));

export function TeacherReportsHubPage({
  assessmentHistory = [],
  batchReportEvidenceLoading = false,
  batchReportEvidenceReady = true,
  classList = [],
  classListReadState = null,
  teacherId,
  selectedClassId = "",
  className = "",
  onSelectClass,
  onOpenClasses,
  onOpenMockResults,
  studentRows = [],
  classDashboardReadState = null,
  studentList = [],
  studentListReadState = null,
  loadingClasses = false,
  loadingStudents = false,
  onRetryClasses,
  onRetryStudents,
  onRetryClassDashboard,
  classReportEvidenceReady = true,
  classReportEvidenceLoading = false,
  onRetryClassReportEvidence,
  selectedStudentId = "",
  selectedStudentName = "",
  studentEvidenceReady = true,
  studentEvidenceStatus = "complete",
  onRetryStudentEvidence,
  onSelectStudent,
  onClearStudent,
  reportView = "",
  onSelectReportView,
  renderStudentReport,
  renderClassReport,
  supabase = null,
  soundMapSkillFilter = "",
  routeHash = undefined
}) {
  const params = readTeacherFunnelParams(routeHash);
  const [who, setWho] = useState(() => (
    !soundMapSkillFilter && params.get("who") !== WHOLE_CLASS && params.get("learner")
      ? "student" : WHOLE_CLASS
  ));
  const [batchMode, setBatchMode] = useState(false);
  const reportHeadingRef = useRef(null);
  const previousReportRef = useRef("");
  const classRead = getClassListReadView({
    readState: classListReadState, teacherId, legacyLoading: loadingClasses
  });
  const visibleClassList = classRead.rowsVerified ? classList : [];
  const rosterRead = getStudentRosterReadView({
    readState: studentListReadState, classId: selectedClassId, legacyLoading: loadingStudents
  });
  const dashboardRead = getClassDashboardReadView({
    readState: classDashboardReadState, classId: selectedClassId
  });
  const rows = useMemo(() => {
    const roster = rosterRead.rowsBelongToClass ? studentList : [];
    const dashboard = dashboardRead.complete ? studentRows.filter(row => (
      !classDashboardReadState?.status || String(row?.classId || "") === String(selectedClassId || "")
    )) : [];
    return [...(dashboard.length ? dashboard : roster)]
      .filter(row => row?.id)
      .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
  }, [classDashboardReadState?.status, dashboardRead.complete, rosterRead.rowsBelongToClass,
    selectedClassId, studentList, studentRows]);
  // An ID from route hydration is not proof of ownership or a complete read.
  const hasClass = Boolean(classRead.complete && selectedClassId
    && visibleClassList.some(row => row.id === selectedClassId));
  const hasStudent = Boolean(rosterRead.complete && selectedStudentId
    && rows.some(row => row.id === selectedStudentId));
  const wholeClass = who === WHOLE_CLASS;
  const whoChosen = hasClass && rosterRead.complete && (wholeClass || hasStudent);
  const currentView = REPORT_VIEW_IDS.has(reportView) ? reportView : "whole-child";
  const reportEvidenceReady = wholeClass
    ? classReportEvidenceReady && dashboardRead.complete : studentEvidenceReady;
  const reportEvidenceLoading = wholeClass
    ? classReportEvidenceLoading || dashboardRead.loading : studentEvidenceStatus === "loading";
  const readyToShow = whoChosen && reportEvidenceReady && !batchMode;
  const retryReportEvidence = wholeClass
    ? onRetryClassReportEvidence || onRetryClassDashboard : onRetryStudentEvidence;
  const currentStyle = STUDENT_REPORT_VIEWS.find(view => view.id === currentView);
  const progressRecords = assessmentHistory.filter(record => (
    record.classId === selectedClassId && isProgressTest(record)
    && (wholeClass || record.studentId === selectedStudentId)
  ));

  useEffect(() => {
    function restoreFromRoute(nextHash) {
      const nextParams = readTeacherFunnelParams(nextHash);
      setWho(nextParams.get("learner") && nextParams.get("who") !== WHOLE_CLASS
        ? "student" : WHOLE_CLASS);
      setBatchMode(false);
      const nextReport = nextParams.get("report");
      onSelectReportView?.(REPORT_VIEW_IDS.has(nextReport) ? nextReport : "whole-child");
    }
    if (routeHash !== undefined) {
      restoreFromRoute(routeHash);
      return undefined;
    }
    const handleHistory = () => restoreFromRoute(window.location.hash);
    window.addEventListener("hashchange", handleHistory);
    window.addEventListener("popstate", handleHistory);
    return () => {
      window.removeEventListener("hashchange", handleHistory);
      window.removeEventListener("popstate", handleHistory);
    };
  }, [onSelectReportView, routeHash]);

  useEffect(() => {
    if (!hasClass || batchMode || !shouldWriteTeacherReportFunnelParams({
      classReadComplete: classRead.complete, rosterReadComplete: rosterRead.complete, who
    })) return;
    writeTeacherFunnelParams({
      who: wholeClass ? WHOLE_CLASS : "",
      report: !wholeClass && hasStudent ? currentView : "",
      show: whoChosen ? "1" : ""
    });
  }, [batchMode, classRead.complete, currentView, hasClass, hasStudent,
    rosterRead.complete, who, whoChosen, wholeClass]);

  const reportKey = readyToShow ? `${selectedClassId}:${wholeClass ? WHOLE_CLASS : selectedStudentId}` : "";
  useEffect(() => {
    if (!reportKey || previousReportRef.current === reportKey) return;
    previousReportRef.current = reportKey;
    reportHeadingRef.current?.focus({ preventScroll: true });
  }, [reportKey]);

  function chooseWholeClass() {
    setBatchMode(false);
    setWho(WHOLE_CLASS);
    onSelectReportView?.("whole-child");
    onClearStudent?.();
  }
  function chooseClass(nextClassId) {
    chooseWholeClass();
    onSelectClass?.(nextClassId || null);
  }
  function chooseReport(value) {
    if (value === WHOLE_CLASS) {
      chooseWholeClass();
      return;
    }
    const row = rows.find(student => student.id === value);
    if (!row) return;
    setBatchMode(false);
    setWho("student");
    onSelectReportView?.("whole-child");
    onSelectStudent?.(row.id, row.name);
  }
  const PageElement = readyToShow && !wholeClass ? "div" : "main";
  return (
    <PageElement className="teacher-product-page teacher-reports-simple" data-teacher-funnel="reports">
      <header className="teacher-page-header">
        <div>
          <p className="panel-label">Reports</p>
          <h2>How is your class doing?</h2>
          <p>See what is going well and what to teach next. Choose a student for their summary.</p>
        </div>
      </header>
      <section className="teacher-reports-controls screen-only" aria-label="Choose a report">
        <label className="teacher-funnel-field">
          <span>Class</span>
          <select disabled={!classRead.complete} value={hasClass ? selectedClassId : ""}
            onChange={event => chooseClass(event.target.value)}>
            <option value="">Choose a class</option>
            {visibleClassList.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        {hasClass && (
          <>
            <label className="teacher-funnel-field">
              <span>Report for</span>
              <select disabled={!rosterRead.complete} value={wholeClass ? WHOLE_CLASS : hasStudent ? selectedStudentId : ""}
                onChange={event => chooseReport(event.target.value)}>
                <option value="">Choose a student</option>
                <option value={WHOLE_CLASS}>Whole class</option>
                {rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
              </select>
            </label>
            {onOpenMockResults && <button className="lp-button lp-button-secondary" disabled={!rosterRead.complete}
              onClick={onOpenMockResults} type="button">Mock MAP results</button>}
            <button className="lp-button lp-button-secondary" disabled={!rosterRead.complete}
              aria-expanded={batchMode} onClick={() => setBatchMode(value => !value)} type="button">
              {batchMode ? "Back to summary" : "Multiple student EL reports"}
            </button>
          </>
        )}
      </section>
      {classRead.loading ? <p role="status">Getting your classes…</p>
        : classRead.failed ? <TeacherSurfaceState compact surface="progress" state="partial"
          detail={classRead.truncated
            ? "The full class list reached its safety limit. No missing class is being treated as absent."
            : "The class list could not be confirmed. Try loading it again."} onPrimaryAction={onRetryClasses} />
        : !visibleClassList.length ? <div className="teacher-funnel-empty">
          <p>No classes are available yet. Create a class and add students first.</p>
          <button className="lp-button lp-button-secondary" onClick={onOpenClasses} type="button">Go to Students</button>
        </div> : !hasClass ? <p>Choose a class to see its reports.</p> : null}
      {hasClass && (rosterRead.loading ? <p role="status">Getting the class list…</p>
        : rosterRead.incomplete ? <div className="teacher-funnel-empty" role="alert">
          <p>{rosterRead.truncated
            ? "The full student list reached its safety limit. No student is being treated as absent."
            : "The student list could not be confirmed. No empty-class report is being offered."}</p>
          {onRetryStudents && <button className="lp-button lp-button-secondary" type="button"
            onClick={() => onRetryStudents(selectedClassId)}>Try loading students again</button>}
        </div> : !wholeClass && !hasStudent ? <p>Choose a student from this class to open their summary.</p> : null)}
      {batchMode && hasClass && rosterRead.complete && (
        <section className="teacher-reports-batch">
          <h3>Download several student reports</h3>
          <p>Select students with saved EL results and download their reports together in one ZIP.</p>
          <ElStudentBatchReportPicker assessmentHistory={assessmentHistory} classId={selectedClassId}
            classes={visibleClassList} evidenceLoading={batchReportEvidenceLoading}
            evidenceReady={batchReportEvidenceReady && rosterRead.complete} key={selectedClassId}
            students={rows} supabase={supabase} teacherId={teacherId} />
        </section>
      )}
      {!batchMode && whoChosen && !reportEvidenceReady && <TeacherSurfaceState compact surface="progress"
        state={reportEvidenceLoading ? "loading" : "partial"}
        detail={wholeClass
          ? "The class report will open when the roster and every saved class result have been confirmed."
          : `${selectedStudentName || "This student"}'s report will open when every saved result has been confirmed.`}
        primaryLabel={wholeClass && dashboardRead.failed ? "Try loading class progress again" : "Try loading again"}
        onPrimaryAction={reportEvidenceLoading ? undefined : retryReportEvidence} />}
      {readyToShow && (
        <section className="teacher-reports-result" aria-labelledby="teacher-funnel-report-title">
          <h3 id="teacher-funnel-report-title" ref={reportHeadingRef} tabIndex="-1">
            {wholeClass ? `${className || "Class"} · Class summary` : `${selectedStudentName} · ${currentStyle.label}`}
          </h3>
          {wholeClass
            ? renderClassReport?.(undefined, { skillFilter: soundMapSkillFilter })
            : renderStudentReport?.(currentView, chooseWholeClass)}
        </section>
      )}
      {!batchMode && hasClass && batchReportEvidenceReady && progressRecords.length > 0 && (
        <details className="teacher-report-detail">
          <summary>Progress check results</summary>
          <ProgressCheckReportsPanel records={progressRecords} />
        </details>
      )}
    </PageElement>
  );
}
