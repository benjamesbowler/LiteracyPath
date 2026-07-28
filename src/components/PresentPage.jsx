import { useEffect, useMemo, useRef, useState } from "react";
import {
  presentationCycleOptions,
  getPresentationCycle,
  buildCyclePresentation,
  openCyclePresentation,
  presentationCycleSummary,
  presentationCycleDisplayTitle,
  PRESENTATION_DAYS
} from "../utils/present/presentationBuilder.js";
import "../styles/worksheets.css";

const LAST_PRESENTED_KEY = "lp-present-last";

function lastPresentedCycle(options) {
  try {
    const last = window.localStorage.getItem(LAST_PRESENTED_KEY);
    if (last && options.some(opt => opt.id === last)) return last;
  } catch {
    // localStorage unavailable (private mode) - fall through to the default.
  }
  return "";
}

export function PresentPage({ className = "", onBack }) {
  const cycleOptions = useMemo(() => presentationCycleOptions(), []);
  const teachingCycles = useMemo(
    () => cycleOptions.filter(option => option.type !== "assessment"),
    [cycleOptions]
  );
  const assessmentWeeks = useMemo(
    () => cycleOptions.filter(option => option.type === "assessment"),
    [cycleOptions]
  );
  const [cycleId, setCycleId] = useState(() =>
    lastPresentedCycle(cycleOptions) ||
    cycleOptions.find(opt => opt.cycleNumber)?.id ||
    cycleOptions[0]?.id || ""
  );
  const [day, setDay] = useState("");
  const [note, setNote] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const fallbackRef = useRef("");

  const cycle = useMemo(() => getPresentationCycle(cycleId), [cycleId]);
  const isFluency = (cycle?.cycleNumber || 0) >= 25;
  const isAssessment = cycle?.type === "assessment";
  // Assessment weeks are one short deck - the day choice does not apply.
  const effectiveDay = isAssessment ? "" : day;

  const summary = useMemo(() => presentationCycleSummary(cycleId), [cycleId]);
  const slideCount = useMemo(() => {
    try {
      return buildCyclePresentation(cycleId, { day: effectiveDay }).slideCount;
    } catch {
      return 0;
    }
  }, [cycleId, effectiveDay]);

  function replaceFallbackUrl(url) {
    if (fallbackRef.current) {
      try {
        URL.revokeObjectURL(fallbackRef.current);
      } catch {
        // Already revoked - nothing to clean up.
      }
    }
    fallbackRef.current = url;
    setFallbackUrl(url);
  }

  useEffect(() => () => {
    if (!fallbackRef.current) return;
    try {
      URL.revokeObjectURL(fallbackRef.current);
    } catch {
      // The browser already released it.
    }
  }, []);

  function chooseCycle(nextCycleId) {
    setCycleId(nextCycleId);
    setNote("");
    replaceFallbackUrl("");
  }

  function chooseDay(nextDay) {
    setDay(nextDay);
    setNote("");
    replaceFallbackUrl("");
  }

  function handlePresent() {
    setNote("");
    replaceFallbackUrl("");
    let result;
    try {
      result = openCyclePresentation(cycleId, { day: effectiveDay });
    } catch {
      setNote("We couldn't open that presentation. Your choice is still here. Try again.");
      return;
    }
    try {
      window.localStorage.setItem(LAST_PRESENTED_KEY, cycleId);
    } catch {
      // localStorage unavailable - last-used memory is a nice-to-have only.
    }
    if (!result.ok) {
      setNote("Your browser blocked the pop-up window. Click the link below to open the presentation in a new tab, or allow pop-ups for this site and press Present again.");
      replaceFallbackUrl(result.url || "");
    }
  }

  return (
    <main className="ws-page" data-teacher-route="present">
      <nav className="ws-route-nav" aria-label="Presentation navigation">
        <button type="button" className="ws-back-link" onClick={onBack}>
          ← Back to Resources
        </button>
      </nav>
      <header className="ws-page-head">
        <h1>Present a cycle</h1>
        <p>Choose a teaching cycle and open its projector-ready slides.</p>
        {className && <span className="ws-context">Class: {className}</span>}
      </header>

      <section className="ws-builder" aria-label="Presentation options">
        <label className="ws-field ws-field-wide">
          <span>Cycle</span>
          <select value={cycleId} onChange={e => chooseCycle(e.target.value)}>
            <optgroup label="Teaching cycles">
              {teachingCycles.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </optgroup>
            {assessmentWeeks.length > 0 && (
              <optgroup label="Assessment weeks">
                {assessmentWeeks.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </optgroup>
            )}
          </select>
        </label>

        {!isAssessment && (
          <label className="ws-field ws-field-wide">
            <span>Day</span>
            <select value={day} onChange={e => chooseDay(e.target.value)}>
              {PRESENTATION_DAYS.map(opt => (
                <option key={opt.value || "whole"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        )}

        {summary && (
          <div className="ws-selection-summary" aria-live="polite">
            <strong>{presentationCycleDisplayTitle(cycle)}</strong>
            <span>{effectiveDay
              ? PRESENTATION_DAYS.find(option => option.value === effectiveDay)?.label
              : "Whole cycle"}</span>
            {slideCount ? <span>{slideCount} slides</span> : null}
            <p>{summary}</p>
          </div>
        )}

        <p className="ws-blurb">
          {isAssessment
            ? "This is an assessment week. The slides show this week's short assessment routines."
            : isFluency
              ? "This is a fluency cycle (25–27): the deck covers sight words, pattern power, word chains and the poem — no new letters."
              : "The deck covers each focus letter's sound + writing, blending, the cycle's sight words, sound games (change / take away / join words), the poem and this cycle's guided-reading books."}
        </p>

        <div className="ws-actions">
          <button type="button" className="ws-primary" onClick={handlePresent}>
            Present full screen
          </button>
        </div>
        <details className="ws-present-help">
          <summary>Projector and keyboard help</summary>
          <p>Use the arrow keys or on-screen arrows to move. Press F for full screen and Esc to leave.</p>
        </details>
        {note && (
          <p className="ws-note" role="status">
            {note}
            {fallbackUrl && (
              <>
                {" "}
                <a href={fallbackUrl} target="_blank" rel="noreferrer">
                  Open the presentation in a new tab
                </a>
              </>
            )}
          </p>
        )}
      </section>
    </main>
  );
}
