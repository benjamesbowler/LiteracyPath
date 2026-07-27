import { useMemo, useRef, useState } from "react";
import {
  presentationCycleOptions,
  getPresentationCycle,
  buildCyclePresentation,
  openCyclePresentation,
  presentationCycleSummary,
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

export function PresentPage() {
  const cycleOptions = useMemo(() => presentationCycleOptions(), []);
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

  function handlePresent() {
    setNote("");
    replaceFallbackUrl("");
    const result = openCyclePresentation(cycleId, { day: effectiveDay });
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
    <div className="ws-page">
      <header className="ws-page-head">
        <h1>Present a cycle</h1>
        <p>A full-screen slideshow for the projector — letter sounds, writing, blending, sight words, sound games, the poem and this cycle's books. Pick a cycle (and a day, if you want just that day's teaching) and press Present. Use the arrow keys (or the on-screen arrows) to move through it; press <b>F</b> for full screen and <b>Esc</b> to leave.</p>
      </header>

      <section className="ws-builder" aria-label="Presentation options">
        <label className="ws-field" style={{ gridColumn: "1 / -1" }}>
          <span>Cycle</span>
          <select value={cycleId} onChange={e => setCycleId(e.target.value)}>
            {cycleOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </label>

        {!isAssessment && (
          <label className="ws-field" style={{ gridColumn: "1 / -1" }}>
            <span>Day</span>
            <select value={day} onChange={e => setDay(e.target.value)}>
              {PRESENTATION_DAYS.map(opt => (
                <option key={opt.value || "whole"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        )}

        {summary && (
          <p className="ws-blurb">
            {summary}
            {slideCount ? ` · ${slideCount} slides` : ""}
          </p>
        )}

        <p className="ws-blurb">
          {isAssessment
            ? "This is a check week. The slides show this week's short check routines."
            : isFluency
              ? "This is a fluency cycle (25–27): the deck covers sight words, pattern power, word chains and the poem — no new letters."
              : "The deck covers each focus letter's sound + writing, blending, the cycle's sight words, sound games (change / take away / join words), the poem and this cycle's guided-reading books."}
        </p>

        <div className="ws-actions">
          <button type="button" className="ws-primary" onClick={handlePresent}>
            Present full screen
          </button>
        </div>
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
    </div>
  );
}
