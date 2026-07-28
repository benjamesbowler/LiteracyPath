import { useEffect, useMemo, useRef, useState } from "react";
import {
  presentationCycleOptions,
  getPresentationCycle,
  buildCyclePresentation,
  openCyclePresentation,
  presentationCycleDisplayTitle,
  presentationSlideIndex,
  PRESENTATION_DAYS
} from "../utils/present/presentationBuilder.js";
import { EL_CYCLE_POEMS } from "../data/elCyclePoems.js";
import "../styles/worksheets.css";
import "../styles/present.css";

const LAST_PRESENTED_KEY = "lp-present-last";

// Slide class -> the word a teacher would use for it. Kept here rather than in
// the builder so the deck stays free of picker vocabulary.
const SLIDE_LABELS = {
  "p-cover": "Cover",
  "p-goal-slide": "Goal",
  "p-letter-slide": "Sound",
  "p-writing": "Write it",
  "p-sound-review": "Sound check",
  "p-blend": "Blend",
  "p-sight-slide": "Tricky word",
  "p-phoneme": "Warm-up",
  "p-together": "Together",
  "p-poem-slide": "Poem",
  "p-books-slide": "Books",
  "p-routines-slide": "This week",
  "p-close": "Close"
};

function slideLabel(entry) {
  const key = String(entry.cls || "").split(/\s+/).find(c => SLIDE_LABELS[c]);
  return SLIDE_LABELS[key] || entry.section || "Slide";
}

function lastPresentedCycle(options) {
  try {
    const last = window.localStorage.getItem(LAST_PRESENTED_KEY);
    if (last && options.some(opt => opt.id === last)) return last;
  } catch {
    // localStorage unavailable (private mode) - fall through to the default.
  }
  return "";
}

// The five teaching days plus the whole-cycle deck, as a grid the teacher can
// hit with one tap. The old <select> hid the fact that a day deck is a
// different, shorter lesson - the slide counts make that visible.
const DAY_TILES = PRESENTATION_DAYS
  .filter(option => option.value)
  .map(option => ({ value: option.value, short: option.label.slice(0, 3) }));

// The preview iframe is the real deck (same-origin srcdoc); deck.js follows
// the thumbnail rail via postMessage when it detects it is framed. Posted on
// every preview change AND on iframe load, so a rebuilt deck still lands on
// the selected slide.
function postPreviewToFrame(frame, index) {
  if (!frame || !frame.contentWindow) return;
  try {
    frame.contentWindow.postMessage({ type: "lp-present-show", index }, window.location.origin);
  } catch {
    // The frame is mid-navigation - the onLoad re-post covers it.
  }
}

export function PresentPage({ className = "", currentCycleId = "", onBack }) {
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
    // The class's own current cycle wins: the teacher almost always wants the
    // cycle their class is actually on, not the one they opened last month.
    (currentCycleId && cycleOptions.some(o => o.id === currentCycleId) ? currentCycleId : "") ||
    lastPresentedCycle(cycleOptions) ||
    cycleOptions.find(opt => opt.cycleNumber)?.id ||
    cycleOptions[0]?.id || ""
  );
  const [day, setDay] = useState("");
  const [preview, setPreview] = useState(0);
  const [note, setNote] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const fallbackRef = useRef("");
  const frameRef = useRef(null);

  const cycle = useMemo(() => getPresentationCycle(cycleId), [cycleId]);
  const isFluency = (cycle?.cycleNumber || 0) >= 25;
  const isAssessment = cycle?.type === "assessment";
  const effectiveDay = isAssessment ? "" : day;

  const slideIndex = useMemo(() => {
    try {
      return presentationSlideIndex(cycleId, { day: effectiveDay });
    } catch {
      return [];
    }
  }, [cycleId, effectiveDay]);

  const deckHtml = useMemo(() => {
    try {
      return buildCyclePresentation(cycleId, { day: effectiveDay }).html;
    } catch {
      return "";
    }
  }, [cycleId, effectiveDay]);

  const dayCounts = useMemo(() => {
    const out = { "": 0 };
    for (const option of PRESENTATION_DAYS) {
      try {
        out[option.value] = buildCyclePresentation(cycleId, { day: option.value }).slideCount;
      } catch {
        out[option.value] = 0;
      }
    }
    return out;
  }, [cycleId]);

  // The contents list is built from the SAME cycle record the deck reads, so it
  // cannot drift from what actually projects.
  const contents = useMemo(() => {
    if (!cycle) return [];
    const rows = [];
    const letters = (cycle.focusLetters || []).length ? cycle.focusLetters : cycle.reviewLetters || [];
    const graphemes = letters.map(c => `${c.grapheme}${c.sound ? ` ${c.sound}` : ""}`).filter(Boolean);
    if (graphemes.length) rows.push(["Sounds", graphemes.join(" · ")]);
    if ((cycle.highFrequencyWords || []).length) rows.push(["Tricky words", cycle.highFrequencyWords.join(" · ")]);
    if ((cycle.phonemicAwareness || []).length) rows.push(["Warm-ups", cycle.phonemicAwareness.join(" · ")]);
    const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
    if (poem) rows.push(["Poem", poem.title]);
    const rec = cycle.guidedReadingRecommendations || {};
    const books = [rec.fiction, rec.nonfiction].filter(Boolean).map(b => b.title);
    if (books.length) rows.push(["Books", books.join(" · ")]);
    if (cycle.friday) rows.push(["Friday", cycle.friday]);
    return rows;
  }, [cycle]);

  useEffect(() => {
    postPreviewToFrame(frameRef.current, preview);
  }, [preview]);

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
    setPreview(0);
    setNote("");
    replaceFallbackUrl("");
  }

  function chooseDay(nextDay) {
    setDay(nextDay);
    setPreview(0);
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

  const totalSlides = slideIndex.length;
  const current = slideIndex[Math.min(preview, Math.max(0, totalSlides - 1))];

  return (
    <main className="ws-page pr-page" data-teacher-route="present">
      <nav className="ws-route-nav" aria-label="Presentation navigation">
        <button type="button" className="ws-back-link" onClick={onBack}>
          ← Back to Resources
        </button>
      </nav>

      <header className="pr-head">
        <div>
          <h1>Present a cycle</h1>
          <p>
            {className ? `${className} is on ` : "Your class is on "}
            <strong>{presentationCycleDisplayTitle(cycle)}</strong>. Pick a day and preview the deck before you project it.
          </p>
        </div>
        <div className="pr-head-actions">
          <button type="button" className="ws-primary pr-present" onClick={handlePresent}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v2H3V4Zm1 3h16v9H13v2l3 2v1H8v-1l3-2v-2H4V7Z" /></svg>
            Present full screen
          </button>
        </div>
      </header>

      <div className="pr-grid">
        <div className="pr-choices">
          <section className="pr-card" aria-label="Presentation options">
            <label className="ws-field">
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
              <div className="pr-days">
                <span className="pr-days-label">Day</span>
                <div className="pr-day-grid" role="group" aria-label="Teaching day">
                  {DAY_TILES.map(tile => (
                    <button
                      key={tile.value}
                      type="button"
                      className={`pr-day${day === tile.value ? " active" : ""}`}
                      aria-pressed={day === tile.value}
                      onClick={() => chooseDay(tile.value)}
                    >
                      <span className="pr-day-name">{tile.short}</span>
                      <span className="pr-day-count">{dayCounts[tile.value] || 0} slides</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`pr-day${day === "" ? " active" : ""}`}
                    aria-pressed={day === ""}
                    onClick={() => chooseDay("")}
                  >
                    <span className="pr-day-name">Whole</span>
                    <span className="pr-day-count">{dayCounts[""] || 0} slides</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="pr-card pr-contents" aria-label="Deck contents">
            <span className="pr-card-title">What&rsquo;s in this deck</span>
            <dl className="pr-list">
              {contents.map(([term, value]) => (
                <div className="pr-list-row" key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="pr-foot">
              {isAssessment
                ? "This is an assessment week. The slides show this week's short assessment routines."
                : isFluency
                  ? "A fluency cycle: sight words, pattern power, word chains and the poem — no new letters."
                  : `About ${Math.max(6, Math.round(totalSlides * 0.9))} minutes at a steady pace.`}
            </p>
          </section>
        </div>

        <section className="pr-card pr-preview" aria-label="Deck preview">
          <div className="pr-preview-head">
            <span className="pr-card-title">
              Preview{current ? ` · ${slideLabel(current)}` : ""} · slide {Math.min(preview + 1, totalSlides)} of {totalSlides}
            </span>
            <div className="pr-preview-nav">
              <button type="button" onClick={() => setPreview(p => Math.max(0, p - 1))} aria-label="Previous slide">‹</button>
              <button type="button" onClick={() => setPreview(p => Math.min(totalSlides - 1, p + 1))} aria-label="Next slide">›</button>
            </div>
          </div>

          {/* The real deck, in an iframe, scaled down. It is the same HTML that
              projects — a picture of the deck can go stale, the deck cannot. */}
          <div className="pr-stage">
            <iframe
              ref={frameRef}
              className="pr-frame"
              title="Deck preview"
              srcDoc={deckHtml}
              onLoad={() => postPreviewToFrame(frameRef.current, preview)}
            />
          </div>

          <div className="pr-thumbs">
            {slideIndex.map(entry => (
              <button
                key={entry.index}
                type="button"
                className={`pr-thumb${entry.index === preview ? " active" : ""}`}
                onClick={() => setPreview(entry.index)}
              >
                <span className="pr-thumb-n">{entry.index + 1}</span>
                <span className="pr-thumb-label">{slideLabel(entry)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <details className="ws-present-help">
        <summary>Projector and keyboard help</summary>
        <p>Use the arrow keys or on-screen arrows to move. Enter shows the answer on a warm-up slide. Press F for full screen and Esc to leave.</p>
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
    </main>
  );
}
