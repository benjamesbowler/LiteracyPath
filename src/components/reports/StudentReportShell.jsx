import { useCallback, useEffect, useRef } from "react";
import {
  normalizeStudentReportView,
  readStudentReportHash,
  STUDENT_REPORT_VIEWS,
  studentReportHash
} from "./studentReportUiUtils.js";
import { ActionFeedback } from "../ActionFeedback.jsx";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";

const SHELL_COPY = TEACHER_COPY.reportShell;

export function StudentReportShell({
  activeView,
  buildViewHref = studentReportHash,
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
  readHistoryView = readStudentReportHash,
  startAssessmentLabel = "Start check",
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
    const nextHref = buildViewHref(next);
    if (updateHistory && nextHref && typeof window !== "undefined" && window.location.hash !== nextHref) {
      window.history.pushState(null, "", nextHref);
    }
    onViewChange(next);
  }, [buildViewHref, onViewChange]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleHistory = () => {
      const hashView = readHistoryView();
      if (hashView) selectView(hashView, { updateHistory: false });
    };
    window.addEventListener("hashchange", handleHistory);
    window.addEventListener("popstate", handleHistory);
    return () => {
      window.removeEventListener("hashchange", handleHistory);
      window.removeEventListener("popstate", handleHistory);
    };
  }, [readHistoryView, selectView]);

  return (
    <div className="lg-report-shell">
      <header className="lg-report-topbar screen-only">
        <div className="lg-report-topbar-copy">
          <span className="lg-report-product-label">{SHELL_COPY.productLabel}</span>
          <strong>{studentName || SHELL_COPY.fallbackStudent}</strong>
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
        <nav className="lg-report-nav" aria-label={SHELL_COPY.navLabel}>
          <div className="lg-report-nav-intro">
            <strong>{SHELL_COPY.viewLabel}</strong>
            <span>{SHELL_COPY.viewHelp}</span>
          </div>
          <div className="lg-report-nav-links">
            {STUDENT_REPORT_VIEWS.map(view => (
              <a
                aria-current={view.id === activeView ? "page" : undefined}
                href={buildViewHref(view.id) || studentReportHash(view.id)}
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
            <span>{SHELL_COPY.viewLabel}</span>
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
              <p>{studentName || SHELL_COPY.fallbackStudent}</p>
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
            <section className="lg-report-provenance" aria-label="About this report">
              <h2>{SHELL_COPY.aboutTitle}</h2>
              <p>{SHELL_COPY.aboutBody}</p>
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
