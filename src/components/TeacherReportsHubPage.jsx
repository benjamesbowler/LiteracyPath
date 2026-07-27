import { useEffect, useMemo, useRef, useState } from "react";

import {
  readTeacherFunnelParams,
  writeTeacherFunnelParams
} from "../appState/appViewHelpers.js";
import { STUDENT_REPORT_VIEWS } from "./reports/studentReportUiUtils.js";
import { TeacherFunnelStep } from "./TeacherFunnelStep.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";

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
  "whole-child": "What has this student secured, what is coming, what is not started?",
  "skills-check": "How accurate has this student been, skill by skill?",
  "guided-reading": "Which books has this student read, and what needed support?",
  hfw: "Which of the hundred most common words does this student know?",
  "other-learning": "What has this student done in the games and story worlds?",
  "el-assessments": "What goes in the school file for the four formal checks?"
});

function studentDisplayRows(rows = [], fallback = []) {
  const source = rows.length ? rows : fallback;
  return [...source]
    .filter(row => row?.id)
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export function TeacherReportsHubPage({
  classList = [],
  selectedClassId = "",
  className = "",
  onSelectClass,
  studentRows = [],
  studentList = [],
  loadingStudents = false,
  selectedStudentId = "",
  selectedStudentName = "",
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

  const classHeadingRef = useRef(null);
  const whoHeadingRef = useRef(null);
  const styleHeadingRef = useRef(null);
  const reportHeadingRef = useRef(null);
  const unlockedStepRef = useRef(0);

  const rows = useMemo(
    () => studentDisplayRows(studentRows, studentList),
    [studentRows, studentList]
  );
  const hasClass = Boolean(selectedClassId);
  const wholeClass = who === WHOLE_CLASS;
  const whoChosen = wholeClass || Boolean(selectedStudentId);
  const styleChosen = wholeClass || Boolean(reportView);
  const currentStyle = STUDENT_REPORT_VIEWS.find(view => view.id === reportView) || null;

  useEffect(() => {
    writeTeacherFunnelParams({
      who: wholeClass ? WHOLE_CLASS : "",
      report: wholeClass ? "" : reportView,
      show: showing ? "1" : ""
    });
  }, [reportView, showing, wholeClass]);

  const openStep = editingStep
    || (!hasClass ? 1 : !whoChosen ? 2 : !styleChosen ? 3 : showing ? 0 : 4);

  useEffect(() => {
    if (unlockedStepRef.current === openStep) return;
    const previous = unlockedStepRef.current;
    unlockedStepRef.current = openStep;
    if (!previous) return;
    const target = [reportHeadingRef, classHeadingRef, whoHeadingRef, styleHeadingRef, null][openStep]
      || reportHeadingRef;
    target?.current?.focus({ preventScroll: true });
  }, [openStep]);

  function chooseClass(nextClassId) {
    setWho("");
    setShowing(false);
    setEditingStep(0);
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
    onSelectReportView?.("");
    onSelectStudent?.(row.id, row.name);
  }

  const classAnswer = hasClass ? (className || "Class chosen") : "";
  const whoAnswer = wholeClass ? "Whole class" : selectedStudentName;
  const styleAnswer = wholeClass
    ? "Class summary"
    : currentStyle ? currentStyle.label : "";

  return (
    <div className="teacher-product-page teacher-funnel-page" data-teacher-funnel="reports">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Reports</p>
          <h2>Open a report</h2>
          <p>
            Three questions, top to bottom. Every answer stays on screen and can be changed;
            changing one clears the answers below it.
          </p>
        </div>
      </section>

      {classList.length === 0 ? (
        <TeacherSurfaceState surface="progress" state="empty" />
      ) : (
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
                onChange={event => chooseClass(event.target.value)}
                value={selectedClassId || ""}
              >
                <option value="">Choose a class</option>
                {classList.map(row => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </label>
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
                  onClick={chooseWholeClass}
                  type="button"
                >
                  <strong>Whole class</strong>
                  <span>Skill coverage across {className || "this class"}, who needs support, and a printable copy.</span>
                </button>
              </li>
              {loadingStudents ? (
                <li><p className="teacher-funnel-step-help">Getting the class list…</p></li>
              ) : rows.length === 0 ? (
                <li>
                  <p className="teacher-funnel-step-help">
                    No students in this class yet. Add them under Students, then come back.
                  </p>
                </li>
              ) : rows.map(row => (
                <li key={row.id}>
                  <button
                    aria-pressed={!wholeClass && row.id === selectedStudentId}
                    className="teacher-funnel-option"
                    onClick={() => chooseStudent(row)}
                    type="button"
                  >
                    <strong>{row.name}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </TeacherFunnelStep>

          <TeacherFunnelStep
            answer={styleAnswer}
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
              <ul className="teacher-funnel-options teacher-funnel-cards" aria-label="Kinds of report">
                {STUDENT_REPORT_VIEWS.map(view => (
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
            )}
          </TeacherFunnelStep>

          {styleChosen && !showing && (
            <div className="teacher-funnel-begin">
              <button
                className="lp-button lp-button-primary"
                onClick={() => setShowing(true)}
                type="button"
              >
                Show the report
              </button>
            </div>
          )}

          {styleChosen && showing && (
            <section
              aria-labelledby="teacher-funnel-report-title"
              className="teacher-funnel-report"
            >
              <h3 id="teacher-funnel-report-title" ref={reportHeadingRef} tabIndex="-1">
                {wholeClass ? `${className || "This class"} · class report` : `${selectedStudentName} · ${styleAnswer}`}
              </h3>
              {wholeClass ? renderClassReport?.() : renderStudentReport?.(reportView)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
