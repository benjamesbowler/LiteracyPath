import { useCallback, useEffect, useRef } from "react";
import {
  normalizeStudentReportView,
  readStudentReportHash,
  STUDENT_REPORT_VIEWS,
  studentReportHash
} from "./studentReportUiUtils.js";
import { ActionFeedback } from "../ActionFeedback.jsx";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { teacherReportText } from "./teacherReportCopy.jsx";

const SHELL_COPY = TEACHER_COPY.reportShell;
const PRIMARY_REPORT_IDS = new Set(["whole-child"]);

export function StudentReportShell({
  activeView,
  backLabel = "Back",
  buildViewHref = studentReportHash,
  children,
  className = "",
  exportDisabled = false,
  exportLabel = "Download spreadsheet data",
  exportScope = "",
  feedback = null,
  focusHeadingOnMount = false,
  generatedLabel = "",
  headingDescription = "",
  headingLabel = "",
  onBack,
  onExport,
  onPrint,
  onStartAssessment,
  printDisabled = false,
  provenanceRows = [],
  readHistoryView = readStudentReportHash,
  startAssessmentLabel = "Start an assessment",
  onViewChange,
  statusMessage = "",
  studentName
}) {
  const headingRef = useRef(null);
  const exportMenuRef = useRef(null);
  const reportNavRef = useRef(null);
  const previousViewRef = useRef(activeView);
  const current = STUDENT_REPORT_VIEWS.find(view => view.id === activeView) || STUDENT_REPORT_VIEWS[0];
  const primaryViews = STUDENT_REPORT_VIEWS.filter(view => PRIMARY_REPORT_IDS.has(view.id));
  const additionalViews = STUDENT_REPORT_VIEWS.filter(view => !PRIMARY_REPORT_IDS.has(view.id));

  const updateStickyOffset = useCallback(() => {
    const nav = reportNavRef.current;
    if (!nav) return 0;
    const teacherBar = nav.ownerDocument.querySelector(".teacher-context-bar");
    const style = teacherBar && getComputedStyle(teacherBar);
    const offset = style && ["sticky", "fixed"].includes(style.position)
      ? teacherBar.getBoundingClientRect().height + Math.max(0, parseFloat(style.top) || 0) : 0;
    nav.style.setProperty("--lg-report-sticky-offset", `${offset}px`);
    return offset;
  }, []);

  const focusReportHeading = useCallback(() => {
    const heading = headingRef.current;
    if (!heading) return;
    const nav = reportNavRef.current;
    const navHeight = nav && ["sticky", "fixed"].includes(getComputedStyle(nav).position)
      ? nav.getBoundingClientRect().height : 0;
    const clearance = updateStickyOffset() + navHeight + 16;
    heading.style.scrollMarginTop = `${clearance}px`;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", inline: "nearest", behavior: "instant" });
  }, [updateStickyOffset]);

  useEffect(() => {
    const nav = reportNavRef.current;
    if (!nav) return undefined;
    const view = nav.ownerDocument.defaultView;
    const teacherBar = nav.ownerDocument.querySelector(".teacher-context-bar");
    const update = () => {
      updateStickyOffset();
      // Resizing must not steal focus from report controls or the parent hub.
      if (nav.ownerDocument.activeElement === headingRef.current) focusReportHeading();
    };
    update();
    const observer = view.ResizeObserver ? new view.ResizeObserver(update) : null;
    if (teacherBar) observer?.observe(teacherBar);
    view.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      view.removeEventListener("resize", update);
    };
  }, [focusReportHeading, updateStickyOffset]);

  function closeExportMenu() {
    const menu = exportMenuRef.current;
    if (!menu) return;
    menu.open = false;
    menu.querySelector(":scope > summary")?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!focusHeadingOnMount) return;
    focusReportHeading();
  }, [focusHeadingOnMount, focusReportHeading]);

  useEffect(() => {
    if (previousViewRef.current === activeView) return;
    previousViewRef.current = activeView;
    focusReportHeading();
  }, [activeView, focusReportHeading]);

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
          <span className="lg-report-product-label">{teacherReportText(SHELL_COPY.productLabel)}</span>
          <strong>{studentName || SHELL_COPY.fallbackStudent}</strong>
          {className && <span>{className}</span>}
        </div>
        <div className="lg-report-actions" aria-label="Report actions">
          {onBack && (
            <button className="lg-report-button secondary" onClick={onBack} type="button">
              {backLabel}
            </button>
          )}
          {onStartAssessment && (
            <button className="lg-report-button secondary" onClick={() => onStartAssessment()} type="button">
              {startAssessmentLabel}
            </button>
          )}
          <details className="lg-report-export-menu" ref={exportMenuRef}>
            <summary className="lg-report-button primary">Export</summary>
            <div className="lg-report-export-options">
              <p><strong>{studentName || SHELL_COPY.fallbackStudent} · {teacherReportText(current.label)}</strong></p>
              <p>{exportScope || generatedLabel}</p>
              <button
                className="lg-report-button secondary"
                disabled={printDisabled}
                onClick={() => {
                  closeExportMenu();
                  if (onPrint) onPrint();
                  else window.print();
                }}
                type="button"
              >Print current {teacherReportText(current.shortLabel).toLowerCase()} / Save as PDF</button>
              {onExport && <button className="lg-report-button secondary" disabled={exportDisabled} onClick={() => {
                closeExportMenu();
                onExport();
              }} type="button">{exportLabel}</button>}
            </div>
          </details>
        </div>
      </header>

      <div className="lg-report-workspace">
        <nav className="lg-report-nav lg-report-nav-simple" aria-label={SHELL_COPY.navLabel} ref={reportNavRef}>
          <div className="lg-report-nav-intro">
            <strong>{SHELL_COPY.viewLabel}</strong>
            <span>{SHELL_COPY.viewHelp}</span>
          </div>
          <div className="lg-report-nav-links">
            {primaryViews.map(view => (
              <a
                aria-current={view.id === activeView ? "page" : undefined}
                href={buildViewHref(view.id) || studentReportHash(view.id)}
                key={view.id}
                onClick={event => {
                  event.preventDefault();
                  selectView(view.id);
                }}
              >
                <strong>{teacherReportText(view.shortLabel)}</strong>
                <span>{teacherReportText(view.description)}</span>
              </a>
            ))}
          </div>
          <details
            className="lg-report-nav-more"
            open={additionalViews.some(view => view.id === activeView) || undefined}
          >
            <summary>Detailed reports</summary>
            <div>
              {additionalViews.map(view => (
                <a
                  aria-current={view.id === activeView ? "page" : undefined}
                  href={buildViewHref(view.id) || studentReportHash(view.id)}
                  key={view.id}
                  onClick={event => {
                    event.preventDefault();
                    selectView(view.id);
                  }}
                >
                  <strong>{teacherReportText(view.shortLabel)}</strong>
                  <span>{teacherReportText(view.description)}</span>
                </a>
              ))}
            </div>
          </details>
          <label className="lg-report-mobile-select">
            <span>{SHELL_COPY.viewLabel}</span>
            <select value={activeView} onChange={event => selectView(event.target.value)}>
              {STUDENT_REPORT_VIEWS.map(view => (
                <option key={view.id} value={view.id}>{teacherReportText(view.label)}</option>
              ))}
            </select>
          </label>
        </nav>

        <main className="lg-report-main" id={`student-report-${current.id}`}>
          <div className="lg-report-view-heading">
            <div>
              <p>{studentName || SHELL_COPY.fallbackStudent}</p>
              <h1 ref={headingRef} tabIndex="-1">{teacherReportText(headingLabel || current.label)}</h1>
              <span>{teacherReportText(headingDescription || current.description)}</span>
            </div>
            {generatedLabel && <small>{generatedLabel}</small>}
          </div>
          <ActionFeedback
            className="lg-report-live-message"
            feedback={feedback || statusMessage}
          />
          {children}
          {provenanceRows.length > 0 && (
            <details
              className="lg-report-provenance"
              role="region"
              aria-label="About this report"
            >
              <summary>{SHELL_COPY.aboutTitle}</summary>
              <div>
                <p>{teacherReportText(SHELL_COPY.aboutBody)}</p>
                <dl>
                  {provenanceRows.map(row => (
                    <div key={row.field}>
                      <dt>{row.field}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
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
