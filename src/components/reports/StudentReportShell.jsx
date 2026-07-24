import { useCallback, useEffect, useRef } from "react";
import {
  normalizeStudentReportView,
  readStudentReportHash,
  STUDENT_REPORT_VIEWS,
  studentReportHash
} from "./studentReportUiUtils.js";
import { ActionFeedback } from "../ActionFeedback.jsx";

export function StudentReportShell({
  activeView,
  children,
  className = "",
  exportDisabled = false,
  exportLabel = "Download spreadsheet data",
  feedback = null,
  generatedLabel = "",
  headingDescription = "",
  headingLabel = "",
  onBack,
  onExport,
  onPrint,
  onStartAssessment,
  provenanceRows = [],
  startAssessmentLabel = "Start assessment",
  onViewChange,
  statusMessage = "",
  studentName
}) {
  const headingRef = useRef(null);
  const previousViewRef = useRef(activeView);
  const current = STUDENT_REPORT_VIEWS.find(view => view.id === activeView) || STUDENT_REPORT_VIEWS[0];

  useEffect(() => {
    if (previousViewRef.current === activeView) return;
    previousViewRef.current = activeView;
    headingRef.current?.focus({ preventScroll: true });
  }, [activeView]);

  const selectView = useCallback((viewId, { updateHistory = true } = {}) => {
    const next = normalizeStudentReportView(viewId);
    if (updateHistory && typeof window !== "undefined" && window.location.hash !== studentReportHash(next)) {
      window.history.pushState(null, "", studentReportHash(next));
    }
    onViewChange(next);
  }, [onViewChange]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleHistory = () => {
      const hashView = readStudentReportHash();
      if (hashView) selectView(hashView, { updateHistory: false });
    };
    window.addEventListener("hashchange", handleHistory);
    window.addEventListener("popstate", handleHistory);
    return () => {
      window.removeEventListener("hashchange", handleHistory);
      window.removeEventListener("popstate", handleHistory);
    };
  }, [selectView]);

  return (
    <div className="lg-report-shell">
      <header className="lg-report-topbar screen-only">
        <div className="lg-report-topbar-copy">
          <span className="lg-report-product-label">Student reports</span>
          <strong>{studentName || "Selected student"}</strong>
          {className && <span>{className}</span>}
        </div>
        <div className="lg-report-actions" aria-label="Report actions">
          {onBack && (
            <button className="lg-report-button secondary" onClick={onBack} type="button">
              Teacher dashboard
            </button>
          )}
          {onStartAssessment && (
            <button className="lg-report-button secondary" onClick={() => onStartAssessment()} type="button">
              {startAssessmentLabel}
            </button>
          )}
          <button className="lg-report-button secondary" onClick={onPrint || (() => window.print())} type="button">
            Print or save PDF
          </button>
          {onExport && (
            <button className="lg-report-button primary" disabled={exportDisabled} onClick={onExport} type="button">
              {exportLabel}
            </button>
          )}
        </div>
      </header>

      <div className="lg-report-workspace">
        <nav className="lg-report-nav" aria-label="Student reports">
          <div className="lg-report-nav-intro">
            <strong>Report view</strong>
            <span>Choose the evidence you need.</span>
          </div>
          <div className="lg-report-nav-links">
            {STUDENT_REPORT_VIEWS.map(view => (
              <a
                aria-current={view.id === activeView ? "page" : undefined}
                href={studentReportHash(view.id)}
                key={view.id}
                onClick={event => {
                  event.preventDefault();
                  selectView(view.id);
                }}
              >
                <strong>{view.shortLabel}</strong>
                <span>{view.description}</span>
              </a>
            ))}
          </div>
          <label className="lg-report-mobile-select">
            <span>Report view</span>
            <select value={activeView} onChange={event => selectView(event.target.value)}>
              {STUDENT_REPORT_VIEWS.map(view => (
                <option key={view.id} value={view.id}>{view.label}</option>
              ))}
            </select>
          </label>
        </nav>

        <main className="lg-report-main" id={`student-report-${current.id}`}>
          <div className="lg-report-view-heading">
            <div>
              <p>{studentName || "Selected student"}</p>
              <h1 ref={headingRef} tabIndex="-1">{headingLabel || current.label}</h1>
              <span>{headingDescription || current.description}</span>
            </div>
            {generatedLabel && <small>{generatedLabel}</small>}
          </div>
          <ActionFeedback
            className="lg-report-live-message"
            feedback={feedback || statusMessage}
          />
          {children}
          {provenanceRows.length > 0 && (
            <section className="lg-report-provenance" aria-label="Report provenance">
              <h2>Report provenance</h2>
              <p>Use this block to identify the exact scope, evidence, versions, and privacy handling of this report.</p>
              <dl>
                {provenanceRows.map(row => (
                  <div key={row.field}>
                    <dt>{row.field}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export function ReportState({ actionLabel = "Retry", children, kind = "empty", onAction, title }) {
  const role = kind === "error" ? "alert" : undefined;
  return (
    <section className={`lg-report-state ${kind}`} role={role}>
      <strong>{title}</strong>
      {children && <div>{children}</div>}
      {onAction && (
        <button className="lg-report-button secondary" onClick={onAction} type="button">{actionLabel}</button>
      )}
    </section>
  );
}

export function ReportSkeleton({ rows = 4 }) {
  return (
    <div className="lg-report-skeleton" aria-busy="true" aria-label="Loading report">
      <span className="lg-report-skeleton-heading"></span>
      {Array.from({ length: rows }, (_, index) => (
        <span className="lg-report-skeleton-row" key={index}></span>
      ))}
    </div>
  );
}
