import { useEffect, useMemo, useRef, useState } from "react";

import {
  readTeacherFunnelParams,
  shouldWriteTeacherReportFunnelParams,
  writeTeacherFunnelParams
} from "../appState/appViewHelpers.js";
import { STUDENT_REPORT_VIEWS } from "./reports/studentReportUiUtils.js";
import { TeacherFunnelStep } from "./TeacherFunnelStep.jsx";
import { TeacherFunnelStudentPicker } from "./teacher/TeacherFunnelStudentPicker.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import { getClassListReadView } from "../appState/classListReadState.js";
import { getStudentRosterReadView } from "../appState/studentRosterReadState.js";
import { getClassDashboardReadView } from "../appState/classDashboardReadState.js";

// ── THE SAME SHAPE AS CHECKS ────────────────────────────────────────────────
//
// Class, who, style, report. Deliberately the same page, the same numbered
// steps and the same "Change" control as starting a check, so a teacher learns
// the pattern once.
//
// "Whole class" is the first thing offered at step 2. The class report used to
// be a separate destination reached by a button beside the student list, which
// meant two ways into Reports and a teacher having to know which one they
// wanted before they got there.

const WHOLE_CLASS = "class";

// What each style answers, in one line. The labels come from the one list of
// report styles so the funnel and the report page can never disagree.
const STYLE_QUESTIONS = Object.freeze({
  "whole-child": "A short summary of what is secure, developing, and not assessed yet.",
  "skills-check": "How accurate has this student been in each skill assessment?",
  "guided-reading": "Which books has this student read, and what needed support?",
  hfw: "Which of the hundred most common words does this student know?",
  "other-learning": "What has this student done in the games and story worlds?",
  "el-assessments": "A standalone record of completed EL assessments for the school file."
});

const PRIMARY_REPORT_VIEW_IDS = Object.freeze([
  "whole-child",
  "skills-check",
  "hfw",
  "el-assessments"
]);
const REPORT_VIEW_IDS = new Set(STUDENT_REPORT_VIEWS.map(view => view.id));

function studentDisplayRows(rows = [], fallback = []) {
  const source = rows.length ? rows : fallback;
  return [...source]
    .filter(row => row?.id)
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export function TeacherReportsHubPage({
  classList = [],
  classListReadState = null,
  teacherId,
  selectedClassId = "",
  className = "",
  onSelectClass,
  onOpenClasses,
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
  // The hash this funnel was opened with. Left undefined the page reads the
  // live URL; tests and previews pass one in so a mid-funnel state can be set
  // up the same way a reload would produce it.
  routeHash = undefined
}) {
  const params = readTeacherFunnelParams(routeHash);
  const [who, setWho] = useState(() => {
    if (params.get("who") === WHOLE_CLASS) return WHOLE_CLASS;
    return params.get("learner") ? "student" : "";
  });
  const [showing, setShowing] = useState(() => params.get("show") === "1");
  const [editingStep, setEditingStep] = useState(0);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);

  const classHeadingRef = useRef(null);
  const whoHeadingRef = useRef(null);
  const styleHeadingRef = useRef(null);
  const showButtonRef = useRef(null);
  const reportHeadingRef = useRef(null);
  const unlockedStepRef = useRef(null);

  const classRead = getClassListReadView({
    readState: classListReadState,
    teacherId,
    legacyLoading: loadingClasses
  });
  const visibleClassList = classRead.rowsVerified ? classList : [];
  const rosterRead = getStudentRosterReadView({
    readState: studentListReadState,
    classId: selectedClassId,
    legacyLoading: loadingStudents
  });
  const dashboardRead = getClassDashboardReadView({
    readState: classDashboardReadState,
    classId: selectedClassId
  });
  const rows = useMemo(
    () => {
      const verifiedRosterRows = rosterRead.rowsBelongToClass ? studentList : [];
      const verifiedDashboardRows = dashboardRead.rowsBelongToClass
        ? studentRows.filter(row => (
          !classDashboardReadState?.status
          || String(row?.classId || "") === String(selectedClassId || "")
        ))
        : [];
      return studentDisplayRows(
        dashboardRead.complete ? verifiedDashboardRows : [],
        verifiedRosterRows
      );
    },
    [
      classDashboardReadState?.status,
      dashboardRead.complete,
      dashboardRead.rowsBelongToClass,
      rosterRead.rowsBelongToClass,
      selectedClassId,
      studentList,
      studentRows
    ]
  );
  const primaryReportViews = STUDENT_REPORT_VIEWS.filter(view => (
    PRIMARY_REPORT_VIEW_IDS.includes(view.id)
  ));
  const additionalReportViews = STUDENT_REPORT_VIEWS.filter(view => (
    !PRIMARY_REPORT_VIEW_IDS.includes(view.id)
  ));
  // Route hydration can briefly leave IDs from an earlier page in memory.
  // Never treat an ID alone as a valid choice: the class and student must be in
  // the lists the teacher currently owns before a report is allowed to render.
  const hasClass = Boolean(
    classRead.complete
    &&
    selectedClassId
    && visibleClassList.some(row => row.id === selectedClassId)
  );
  const hasStudent = Boolean(
    rosterRead.complete
    &&
    selectedStudentId
    && rows.some(row => row.id === selectedStudentId)
  );
  const verifiedClassName = hasClass ? className : "";
  const wholeClass = who === WHOLE_CLASS;
  const whoChosen = (wholeClass && hasClass && rosterRead.complete)
    || (hasClass && hasStudent);
  const styleChosen = wholeClass || Boolean(reportView);
  const reportEvidenceReady = wholeClass
    ? classReportEvidenceReady && dashboardRead.complete
    : studentEvidenceReady;
  const reportEvidenceLoading = wholeClass
    ? classReportEvidenceLoading || dashboardRead.loading
    : studentEvidenceStatus === "loading";
  const readyToShow = hasClass
    && whoChosen
    && styleChosen
    && reportEvidenceReady;
  const reportChoiceComplete = hasClass && whoChosen && styleChosen;
  const retryReportEvidence = wholeClass
    ? onRetryClassReportEvidence || onRetryClassDashboard
    : onRetryStudentEvidence;
  const currentStyle = STUDENT_REPORT_VIEWS.find(view => view.id === reportView) || null;

  // Back, Forward, bookmarks and reloads are navigation inputs, not just URL
  // decoration. Keep this mounted funnel's local "who/show" state and the
  // parent report selection aligned with the address whenever history moves.
  useEffect(() => {
    function restoreFromRoute(nextHash) {
      const nextParams = readTeacherFunnelParams(nextHash);
      const nextWho = nextParams.get("who") === WHOLE_CLASS
        ? WHOLE_CLASS
        : nextParams.get("learner") ? "student" : "";
      const nextReport = nextParams.get("report") || "";
      setWho(nextWho);
      setShowing(nextParams.get("show") === "1");
      setEditingStep(0);
      setStudentSearch("");
      setStudentPage(1);
      onSelectReportView?.(REPORT_VIEW_IDS.has(nextReport) ? nextReport : "");
    }

    // `routeHash` is a deterministic initial-state input for SSR previews and
    // unit tests. A live page reads the address directly and listens for real
    // history events after mounting.
    if (typeof routeHash === "string") return undefined;
    const handleHistory = () => restoreFromRoute(window.location.hash);
    window.addEventListener("hashchange", handleHistory);
    window.addEventListener("popstate", handleHistory);
    return () => {
      window.removeEventListener("hashchange", handleHistory);
      window.removeEventListener("popstate", handleHistory);
    };
  }, [onSelectReportView, routeHash]);

  useEffect(() => {
    if (!shouldWriteTeacherReportFunnelParams({
      classReadComplete: classRead.complete,
      rosterReadComplete: rosterRead.complete,
      who
    })) return;
    writeTeacherFunnelParams({
      who: wholeClass ? WHOLE_CLASS : "",
      report: wholeClass || !whoChosen ? "" : reportView,
      show: showing ? "1" : ""
    });
  }, [
    classRead.complete,
    reportView,
    rosterRead.complete,
    showing,
    wholeClass,
    who,
    whoChosen
  ]);

  const openStep = editingStep
    || (!hasClass ? 1 : !whoChosen ? 2 : !styleChosen ? 3 : showing ? 0 : 4);

  useEffect(() => {
    if (unlockedStepRef.current === openStep) return;
    const previous = unlockedStepRef.current;
    unlockedStepRef.current = openStep;
    // A normal first visit keeps the page heading as the entry point. A saved
    // or reloaded open report is different: its chooser is hidden, so the
    // visible report context heading must receive the initial route focus.
    if (previous === null && openStep !== 0) return;
    const target = [
      reportHeadingRef,
      classHeadingRef,
      whoHeadingRef,
      styleHeadingRef,
      showButtonRef
    ][openStep]
      || reportHeadingRef;
    target?.current?.focus({ preventScroll: true });
  }, [openStep]);

  function chooseClass(nextClassId) {
    setWho("");
    setShowing(false);
    setEditingStep(0);
    setStudentSearch("");
    setStudentPage(1);
    onSelectReportView?.("");
    onSelectClass?.(nextClassId || null);
  }

  function chooseWholeClass() {
    setWho(WHOLE_CLASS);
    setShowing(false);
    setEditingStep(0);
    onSelectReportView?.("");
    onClearStudent?.();
  }

  function chooseStudent(row) {
    setWho("student");
    setShowing(false);
    setEditingStep(0);
    setStudentPage(1);
    onSelectReportView?.("");
    onSelectStudent?.(row.id, row.name);
  }

  const classAnswer = hasClass ? (verifiedClassName || "Class chosen") : "";
  const whoAnswer = wholeClass && hasClass
    ? "Whole class"
    : hasStudent ? selectedStudentName : "";
  const styleAnswer = wholeClass
    ? "Class summary"
    : currentStyle ? currentStyle.label : "";
  // StudentReportShell owns the main landmark once an individual report is
  // open. The funnel owns it in every other state, including class reports.
  // This keeps exactly one, non-nested main landmark throughout the route.
  const PageElement = showing && !wholeClass ? "div" : "main";

  return (
    <PageElement
      className={`teacher-product-page teacher-funnel-page${showing ? " report-open" : ""}`}
      data-teacher-funnel="reports"
    >
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Reports</p>
          <h2>Open a report</h2>
          <p>
            Choose a class and who the report is for. Start with the short summary;
            detailed reading and practice reports stay one tap away.
          </p>
        </div>
      </section>

      <div className="teacher-funnel">
          <TeacherFunnelStep
            answer={classAnswer}
            help="Reports are always about one class at a time."
            number={1}
            onChange={() => setEditingStep(1)}
            open={openStep === 1}
            ref={classHeadingRef}
            title="Choose a class"
          >
            <label className="teacher-funnel-field">
              <span>Class</span>
              <select
                disabled={!classRead.complete}
                onChange={event => chooseClass(event.target.value)}
                value={selectedClassId || ""}
              >
                <option value="">Choose a class</option>
                {visibleClassList.map(row => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </label>
            {classRead.loading ? (
              <p className="teacher-funnel-step-help" role="status">Getting your classes…</p>
            ) : classRead.failed ? (
              <TeacherSurfaceState
                compact
                surface="progress"
                state="partial"
                detail={classRead.truncated
                  ? "The full class list reached its safety limit. No missing class is being treated as absent."
                  : "The class list could not be confirmed. Previously verified names are not being used as a complete list."}
                onPrimaryAction={onRetryClasses}
              />
            ) : visibleClassList.length === 0 ? (
              <div className="teacher-funnel-empty">
                <p className="teacher-funnel-step-help">
                  No classes are available yet. Create a class and add students first.
                </p>
                <button className="lp-button lp-button-secondary" onClick={onOpenClasses} type="button">
                  Go to Students
                </button>
              </div>
            ) : null}
          </TeacherFunnelStep>

          <TeacherFunnelStep
            answer={whoAnswer}
            help="The whole class, or one student."
            lockedReason={hasClass ? "" : "Choose a class first."}
            number={2}
            onChange={() => {
              setEditingStep(2);
              setShowing(false);
            }}
            open={openStep === 2}
            ref={whoHeadingRef}
            title="Whole class, or one student?"
          >
            <ul className="teacher-funnel-options" aria-label="Whole class or one student">
              <li>
                <button
                  aria-pressed={wholeClass}
                  className="teacher-funnel-option teacher-funnel-option-wide"
                  disabled={!rosterRead.complete}
                  onClick={chooseWholeClass}
                  type="button"
                >
                  <strong>Whole class</strong>
                  <span>Skill coverage across {verifiedClassName || "this class"}, who needs support, and a printable copy.</span>
                </button>
              </li>
              {rosterRead.loading ? (
                <li><p className="teacher-funnel-step-help">Getting the class list…</p></li>
              ) : rosterRead.incomplete ? (
                <li>
                  <div className="teacher-funnel-empty" role="alert">
                    <p className="teacher-funnel-step-help">
                      {rosterRead.truncated
                        ? "The full student list reached its safety limit. No student is being treated as absent."
                        : "The student list could not be confirmed. No empty-class report is being offered."}
                    </p>
                    {onRetryStudents && (
                      <button
                        className="lp-button lp-button-secondary"
                        onClick={() => onRetryStudents(selectedClassId)}
                        type="button"
                      >
                        Try loading students again
                      </button>
                    )}
                  </div>
                </li>
              ) : rows.length === 0 ? (
                <li>
                  <p className="teacher-funnel-step-help">
                    No students in this class yet. Add them under Students, then come back.
                  </p>
                </li>
              ) : (
                <li className="teacher-funnel-student-picker">
                  <TeacherFunnelStudentPicker
                    onChoose={chooseStudent}
                    onPageChange={setStudentPage}
                    onSearchChange={value => {
                      setStudentSearch(value);
                      setStudentPage(1);
                    }}
                    page={studentPage}
                    rows={rows}
                    search={studentSearch}
                    selectedStudentId={wholeClass ? "" : selectedStudentId}
                  />
                </li>
              )}
            </ul>
            {rosterRead.complete && dashboardRead.failed && (
              <div className="teacher-funnel-empty" role="alert">
                <p className="teacher-funnel-step-help">
                  Class progress summaries could not be confirmed. No previous class figure
                  is being reused.
                </p>
                {onRetryClassDashboard && (
                  <button
                    className="lp-button lp-button-secondary"
                    onClick={() => onRetryClassDashboard(selectedClassId)}
                    type="button"
                  >
                    Try loading class progress again
                  </button>
                )}
              </div>
            )}
          </TeacherFunnelStep>

          <TeacherFunnelStep
            /* 2026-07-27: was `answer={styleAnswer}` unconditionally. `reportView`
               carries a persisted default ("whole-child"), so step 3 rendered as
               ANSWERED — "Overview", with a Change link — while still locked and
               greyed out, before step 2 had been touched. Observed live. A locked
               step shows no answer. */
            answer={whoChosen ? styleAnswer : ""}
            help="Each one answers a different question."
            lockedReason={whoChosen ? "" : "Choose the whole class or one student first."}
            number={3}
            onChange={() => {
              setEditingStep(3);
              setShowing(false);
            }}
            open={openStep === 3}
            ref={styleHeadingRef}
            title="Choose a report"
          >
            {wholeClass ? (
              <p className="teacher-funnel-step-help">
                The class report has one form. Open it below.
              </p>
            ) : (
              <div className="teacher-report-choice-groups">
              <ul className="teacher-funnel-options teacher-funnel-cards" aria-label="Main reports">
                {primaryReportViews.map(view => (
                  <li key={view.id}>
                    <button
                      aria-pressed={view.id === reportView}
                      className="teacher-funnel-option"
                      onClick={() => {
                        setShowing(false);
                        setEditingStep(0);
                        onSelectReportView?.(view.id);
                      }}
                      type="button"
                    >
                      <strong>{view.label}</strong>
                      <span>{STYLE_QUESTIONS[view.id] || view.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {additionalReportViews.length > 0 && (
                <details
                  className="teacher-report-more-views"
                  open={additionalReportViews.some(view => view.id === reportView) || undefined}
                >
                  <summary>Reading and practice detail</summary>
                  <ul className="teacher-funnel-options teacher-funnel-cards" aria-label="Detailed reports">
                    {additionalReportViews.map(view => (
                      <li key={view.id}>
                        <button
                          aria-pressed={view.id === reportView}
                          className="teacher-funnel-option"
                          onClick={() => {
                            setShowing(false);
                            setEditingStep(0);
                            onSelectReportView?.(view.id);
                          }}
                          type="button"
                        >
                          <strong>{view.label}</strong>
                          <span>{STYLE_QUESTIONS[view.id] || view.description}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              </div>
            )}
          </TeacherFunnelStep>

          {/* readyToShow, not styleChosen. `styleChosen` is true from the persisted
              default report view alone, so "Show the report" was live — and clickable —
              with no student and no whole-class choice. It rendered a student report
              shell with an empty name, titled "· Overview". */}
          {readyToShow && !showing && (
            <div className="teacher-funnel-begin">
              <button
                className="lp-button lp-button-primary"
                onClick={() => setShowing(true)}
                ref={showButtonRef}
                type="button"
              >
                Show the report
              </button>
            </div>
          )}

          {reportChoiceComplete && !reportEvidenceReady && (
            <TeacherSurfaceState
              compact
              surface="progress"
              state={reportEvidenceLoading ? "loading" : "partial"}
              detail={wholeClass
                ? "The class report will open when the roster and every saved class result have been confirmed."
                : `${selectedStudentName || "This student"}'s report will open when every saved result has been confirmed.`}
              onPrimaryAction={reportEvidenceLoading ? undefined : retryReportEvidence}
            />
          )}

          {readyToShow && showing && (
            <section
              aria-labelledby="teacher-funnel-report-title"
              className="teacher-funnel-report"
            >
              <h3 id="teacher-funnel-report-title" ref={reportHeadingRef} tabIndex="-1">
                {wholeClass ? `${verifiedClassName || "This class"} · class report` : `${selectedStudentName} · ${styleAnswer}`}
              </h3>
              {wholeClass
                ? renderClassReport?.(() => {
                    setShowing(false);
                    setEditingStep(2);
                  })
                : renderStudentReport?.(reportView, () => {
                    // The report is embedded in this funnel. "Back to reports"
                    // must reopen the report choice in this section, not send
                    // the teacher to a different navigation section.
                    setShowing(false);
                    setEditingStep(3);
                  })}
            </section>
          )}
      </div>
    </PageElement>
  );
}
