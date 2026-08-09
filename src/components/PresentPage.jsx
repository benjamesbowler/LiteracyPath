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
import { buildLiveLessonContent } from "../content/liveLessons/liveLessonContent.js";
import {
  createLiveLessonEventId,
  endLiveLesson,
  getActiveLiveLesson,
  getLiveLessonSnapshot,
  setLiveLessonSlide,
  startLiveLesson
} from "../data/liveLessonCore.js";
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

export function PresentPage({
  className = "",
  classId = "",
  currentCycleId = "",
  students = [],
  client = null,
  onBack
}) {
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
  const [liveSetupOpen, setLiveSetupOpen] = useState(false);
  const [liveSelected, setLiveSelected] = useState([]);
  const [liveSession, setLiveSession] = useState(null);
  const [liveSnapshot, setLiveSnapshot] = useState([]);
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveError, setLiveError] = useState("");
  const recoveryCheckedRef = useRef(false);

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

  const liveContent = useMemo(() => {
    try {
      return buildLiveLessonContent(cycleId, { day: effectiveDay });
    } catch {
      return null;
    }
  }, [cycleId, effectiveDay]);
  const liveDeckKey = `${cycleId}:${effectiveDay}`;

  const availableStudents = useMemo(
    () => students.filter(student => !student.archived_at && !student.archivedAt),
    [students]
  );

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

  useEffect(() => {
    if (!client || recoveryCheckedRef.current) return;
    recoveryCheckedRef.current = true;
    let active = true;
    getActiveLiveLesson({ client }).then(data => {
      const recovered = data?.session;
      if (!active || !recovered?.id) return;
      setCycleId(recovered.cycle_id);
      setDay(recovered.day_key || "");
      setLiveSelected(recovered.student_ids || []);
      setLiveSession(recovered);
    }).catch(() => {
      if (active) setLiveError("We could not check for an earlier Class Quest session. Refresh this page before starting another one.");
    });
    return () => { active = false; };
  }, [client]);

  useEffect(() => {
    if (!liveSession?.id || !client) return undefined;
    function receiveSlide(data) {
      if (data?.type !== "lp-present-slide" || data.deckKey !== liveDeckKey) return;
      const slideIndex = Number(data.index);
      if (!Number.isInteger(slideIndex)) return;
      void setLiveLessonSlide({
        client,
        sessionId: liveSession.id,
        slideIndex,
        clientEventId: createLiveLessonEventId("slide")
      }).catch(() => setLiveError("The class devices did not receive the latest slide. Move back and forward once to retry."));
    }
    function handleProjectorMessage(event) {
      if (event.origin !== window.location.origin) return;
      receiveSlide(event.data);
    }
    let channel = null;
    try {
      if ("BroadcastChannel" in window) {
        channel = new BroadcastChannel("lp-present-live");
        channel.addEventListener("message", event => receiveSlide(event.data));
      }
    } catch {
      channel = null;
    }
    window.addEventListener("message", handleProjectorMessage);
    return () => {
      window.removeEventListener("message", handleProjectorMessage);
      channel?.close();
    };
  }, [client, liveDeckKey, liveSession?.id]);

  useEffect(() => {
    if (!liveSession?.id || !client) return undefined;
    let stopped = false;
    let timer;
    async function poll() {
      try {
        const data = await getLiveLessonSnapshot({ client, sessionId: liveSession.id });
        if (!stopped && data?.ok !== false) setLiveSnapshot(data?.students || []);
      } catch {
        // The deck must remain teachable if private diagnostics briefly fail.
      }
      if (!stopped) timer = window.setTimeout(poll, 3000);
    }
    void poll();
    return () => { stopped = true; window.clearTimeout(timer); };
  }, [client, liveSession?.id]);

  function openLiveSetup() {
    setLiveSelected(availableStudents.map(student => student.id));
    setLiveError("");
    setLiveSetupOpen(true);
  }

  async function handleStartLive() {
    if (!client || !classId || !liveContent || !liveSelected.length) return;
    setLiveBusy(true);
    setLiveError("");
    try {
      const data = await startLiveLesson({ client, classId, studentIds: liveSelected, content: liveContent });
      if (data?.ok === false) throw new Error(data.error || "live_lesson_not_started");
      setLiveSession(data.session);
      setLiveSetupOpen(false);
      setLiveSnapshot([]);
    } catch (error) {
      const code = String(error?.message || "");
      setLiveError(code.includes("student_busy")
        ? "One of these learners is already in another teacher-led session. End that session or remove the learner, then try again."
        : "Class Quest could not start. Your learner choices are still here; check the connection and try again.");
    } finally {
      setLiveBusy(false);
    }
  }

  async function handleEndLive() {
    if (!liveSession?.id || !client || liveBusy) return;
    setLiveBusy(true);
    try {
      const data = await endLiveLesson({ client, sessionId: liveSession.id });
      if (data?.ok === false) throw new Error(data.error || "live_lesson_not_ended");
      setLiveSession(null);
      setLiveSnapshot([]);
      setLiveError("");
    } catch {
      setLiveError("The session did not end yet. Keep this page open and try again.");
    } finally {
      setLiveBusy(false);
    }
  }

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
          {!liveSession && (
            <button
              type="button"
              className="ws-ghost pr-live-start"
              onClick={openLiveSetup}
              disabled={!client || !classId || !availableStudents.length || !liveContent?.prompts?.length}
              title={!client ? "Class Quest Live needs an internet connection" : undefined}
            >
              Start Class Quest Live
            </button>
          )}
          <button type="button" className="ws-primary pr-present" onClick={handlePresent}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v2H3V4Zm1 3h16v9H13v2l3 2v1H8v-1l3-2v-2H4V7Z" /></svg>
            Present full screen
          </button>
        </div>
      </header>

      {liveError && <p className="pr-live-error" role="alert">{liveError}</p>}

      {liveSetupOpen && (
        <section className="pr-live-setup" aria-labelledby="live-setup-title">
          <div>
            <p className="pr-live-kicker">Private learner devices</p>
            <h2 id="live-setup-title">Who is joining Class Quest?</h2>
            <p>Responses help you notice who may need support. They never change mastery automatically, and names or scores never appear on the projector.</p>
          </div>
          <div className="pr-live-roster" role="group" aria-label="Learners joining">
            {availableStudents.map(student => {
              const selected = liveSelected.includes(student.id);
              return (
                <label key={student.id} className={selected ? "selected" : ""}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => setLiveSelected(ids => selected ? ids.filter(id => id !== student.id) : [...ids, student.id])}
                  />
                  <span>{student.name || "Learner"}</span>
                </label>
              );
            })}
          </div>
          <div className="pr-live-setup-actions">
            <button type="button" className="ws-ghost" onClick={() => setLiveSetupOpen(false)} disabled={liveBusy}>Cancel</button>
            <button type="button" className="ws-primary" onClick={handleStartLive} disabled={liveBusy || !liveSelected.length}>
              {liveBusy ? "Starting…" : `Start with ${liveSelected.length} learner${liveSelected.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </section>
      )}

      {liveSession && (
        <section className="pr-live-panel" aria-labelledby="live-panel-title">
          <div className="pr-live-panel-head">
            <div>
              <p className="pr-live-kicker">Live now · private to you</p>
              <h2 id="live-panel-title">Class response check</h2>
            </div>
            <button type="button" className="ws-ghost" onClick={handleEndLive} disabled={liveBusy}>
              {liveBusy ? "Ending…" : "End Class Quest"}
            </button>
          </div>
          <div className="pr-live-status-list">
            {liveSelected.map(id => {
              const student = availableStudents.find(item => item.id === id);
              const status = liveSnapshot.find(item => item.student_id === id);
              return (
                <div key={id} className={`pr-live-status${status?.responded ? (status.is_correct ? " correct" : " check") : ""}`}>
                  <strong>{student?.name || "Learner"}</strong>
                  <span>{status?.responded ? (status.is_correct ? "Ready" : "Check in") : status?.connected ? "Thinking" : "Joining"}</span>
                </div>
              );
            })}
          </div>
          <p className="pr-live-note">“Check in” is a teaching cue, not a score. Ask the learner what they noticed before deciding the next step.</p>
        </section>
      )}

      <div className="pr-grid">
        <div className="pr-choices">
          <section className="pr-card" aria-label="Presentation options">
            <label className="ws-field">
              <span>Cycle</span>
              <select value={cycleId} onChange={e => chooseCycle(e.target.value)} disabled={Boolean(liveSession)}>
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
                      disabled={Boolean(liveSession)}
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
                    disabled={Boolean(liveSession)}
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
