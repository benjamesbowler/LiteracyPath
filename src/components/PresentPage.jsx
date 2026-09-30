import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TeacherPageShell, TeacherPageHeader, TeacherFilterBar } from "./teacher/ui/TeacherPrimitives.jsx";
import { PRESENT_COPY as COPY } from "../copy/teacherCopy.js";
import {
  presentationCycleOptions,
  getPresentationCycle,
  buildCyclePresentation,
  openCyclePresentation,
  presentationCycleDisplayTitle,
  PRESENTATION_DAYS,
  PRESENTATION_FORMATS,
  presentationDayPlan
} from "../utils/present/presentationBuilder.js";
import {
  currentTeachingDay,
  readPresentWorkspaceState,
  rememberPresentWorkspaceState
} from "../utils/present/presentWorkspaceState.js";
import "../styles/worksheets.css";
import "../styles/present.css";

const EMPTY_SLIDES = [];
const SLIDE_LABELS = COPY.slideLabels;

function slideLabel(entry) {
  const key = String(entry?.cls || "").split(/\s+/).find(name => SLIDE_LABELS[name]);
  return SLIDE_LABELS[key] || entry?.section || COPY.slideFallback;
}

const DAY_TILES = PRESENTATION_DAYS.filter(option => option.value);

function postPreviewToFrame(frame, index) {
  if (!frame?.contentWindow) return;
  try {
    frame.contentWindow.postMessage({ type: "lp-present-show", index }, window.location.origin);
  } catch {
    // The frame's load event retries after a lesson change.
  }
}

function PrintLessonPlan({ cycleTitle, dayLabel, formatLabel, lessonPlan, slideIndex }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <article className="pr-print-plan" aria-label={COPY.printRegion}>
      <header>
        <p>{COPY.printBrand}</p>
        <h1>{cycleTitle}</h1>
        <h2>{COPY.dayTitle(dayLabel, lessonPlan.title)}</h2>
        <p>{COPY.printSummary(formatLabel, lessonPlan.minutes, slideIndex.length)}</p>
      </header>
      {lessonPlan.focus && <p><strong>{COPY.printFocus}</strong> {lessonPlan.focus}</p>}
      <p><strong>{COPY.prepare}</strong> {lessonPlan.preparation}</p>
      <ol className="pr-print-blocks">
        {lessonPlan.blocks.map(block => (
          <li key={block.id}>
            <h3>{COPY.printBlock(block.label, block.minutes)}</h3>
            <p>{block.guidance}</p>
          </li>
        ))}
      </ol>
      {lessonPlan.support && <p><strong>{COPY.printSupport}</strong> {lessonPlan.support}</p>}
      {lessonPlan.stretch && <p><strong>{COPY.printStretch}</strong> {lessonPlan.stretch}</p>}
      <h2>{COPY.printNotes}</h2>
      <ol className="pr-print-slides">
        {slideIndex.map(entry => (
          <li key={entry.index}>
            <strong>{entry.title || slideLabel(entry)}</strong>
            <span>{entry.blockLabel || entry.section || slideLabel(entry)}</span>
            {entry.teacher && <p>{entry.teacher}</p>}
          </li>
        ))}
      </ol>
      <footer>{COPY.printFootnote}</footer>
    </article>,
    document.body
  );
}

export function PresentPage({ classId = "", currentCycleId = "", ...props }) {
  return <PresentWorkspacePage key={`${classId || "unscoped"}:${currentCycleId}`} classId={classId} currentCycleId={currentCycleId} {...props} />;
}

function PresentWorkspacePage({ classId, className = "", currentCycleId = "", onBack, onStartStudentSession }) {
  const cycleOptions = useMemo(() => presentationCycleOptions(), []);
  const teachingCycles = useMemo(() => cycleOptions.filter(option => option.type !== "assessment"), [cycleOptions]);
  const assessmentWeeks = useMemo(() => cycleOptions.filter(option => option.type === "assessment"), [cycleOptions]);
  const [initialWorkspace] = useState(() => readPresentWorkspaceState({
    classId,
    currentCycleId,
    cycleOptions
  }));
  const [cycleId, setCycleId] = useState(initialWorkspace.cycleId);
  const [day, setDay] = useState(initialWorkspace.day);
  const [format, setFormat] = useState(initialWorkspace.format);
  const [preview, setPreview] = useState(initialWorkspace.preview);
  const [query, setQuery] = useState("");
  const [workspaceMode, setWorkspaceMode] = useState("plan");
  const [note, setNote] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const fallbackRef = useRef("");
  const frameRef = useRef(null);
  const previewSyncIndexRef = useRef(initialWorkspace.preview);
  const outlineRef = useRef(null);
  const cycle = useMemo(() => getPresentationCycle(cycleId), [cycleId]);
  const isAssessment = cycle?.type === "assessment";
  const effectiveDay = isAssessment ? "" : day;
  const deck = useMemo(() => {
    try {
      return buildCyclePresentation(cycleId, { day: effectiveDay, format });
    } catch {
      return null;
    }
  }, [cycleId, effectiveDay, format]);
  const lessonPlan = useMemo(() => {
    if (!deck) return null;
    return deck.lessonPlan || presentationDayPlan(cycleId, effectiveDay, { format });
  }, [deck, cycleId, effectiveDay, format]);
  // The teacher preview has one reachable navigation row. Projector controls
  // remain in the unmodified standalone deck opened by Present.
  const previewHtml = useMemo(() => deck?.html.replace("</style>", ".embedded #nav { display: none; }</style>"), [deck]);
  const activeWorkspaceMode = lessonPlan ? workspaceMode : "preview";
  const slideIndex = deck?.slideIndex || EMPTY_SLIDES;
  const totalSlides = slideIndex.length;
  const selectedIndex = Math.min(preview, Math.max(0, totalSlides - 1));
  const current = slideIndex[selectedIndex];
  const currentBlock = lessonPlan?.blocks.find(block => block.id === current?.block);
  const selectedFormat = PRESENTATION_FORMATS.find(option => option.value === format) || PRESENTATION_FORMATS[0];
  const cycleTitle = cycle ? presentationCycleDisplayTitle(cycle) : "Teaching cycle not set";
  const dayLabel = DAY_TILES.find(option => option.value === effectiveDay)?.label || "";
  const today = currentTeachingDay();
  const filteredSlides = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return slideIndex;
    return slideIndex.filter(entry => [entry.index + 1, entry.title, entry.teacher, entry.blockLabel, entry.section, slideLabel(entry)]
      .join(" ").toLowerCase().includes(term));
  }, [slideIndex, query]);
  const contents = useMemo(() => {
    if (!cycle) return [];
    const rows = [];
    const letters = cycle.focusLetters?.length ? cycle.focusLetters : cycle.reviewLetters || [];
    const graphemes = letters.map(card => `${card.grapheme}${card.sound ? ` ${card.sound}` : ""}`).filter(Boolean);
    if (graphemes.length) rows.push([COPY.resourceLabels.sounds, graphemes.join(" · ")]);
    if (cycle.highFrequencyWords?.length) rows.push([COPY.resourceLabels.words, cycle.highFrequencyWords.join(" · ")]);
    if (cycle.phonemicAwareness?.length) rows.push([COPY.resourceLabels.warmups, cycle.phonemicAwareness.join(" · ")]);
    const books = [cycle.guidedReadingRecommendations?.fiction, cycle.guidedReadingRecommendations?.nonfiction]
      .filter(Boolean).map(book => book.title);
    if (books.length) rows.push([COPY.resourceLabels.books, books.join(" · ")]);
    if (cycle.friday) rows.push([COPY.resourceLabels.friday, cycle.friday]);
    return rows;
  }, [cycle]);

  useEffect(() => {
    previewSyncIndexRef.current = selectedIndex;
    postPreviewToFrame(frameRef.current, selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    rememberPresentWorkspaceState(classId, { cycleId, day, format, preview: selectedIndex });
  }, [classId, cycleId, day, format, selectedIndex]);

  useEffect(() => {
    function receivePreview(event) {
      if (event.source !== frameRef.current?.contentWindow || event.origin !== window.location.origin) return;
      if (event.data?.type !== "lp-present-preview") return;
      const index = event.data.index;
      // The newly loaded iframe announces slide zero before it receives the
      // saved preview position. Wait for that position's acknowledgement so
      // its startup message cannot erase a resumed lesson.
      if (previewSyncIndexRef.current > 0 && index === 0) return;
      previewSyncIndexRef.current = null;
      if (Number.isInteger(index) && index >= 0 && index < totalSlides) setPreview(index);
    }
    window.addEventListener("message", receivePreview);
    return () => window.removeEventListener("message", receivePreview);
  }, [totalSlides]);

  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel("lp-present-live");
      channel.onmessage = event => {
        const message = event.data;
        if (message?.type !== "lp-present-slide" || message.deckKey !== `${cycleId}:${effectiveDay}:${format}`) return;
        if (Number.isInteger(message.index) && message.index >= 0 && message.index < totalSlides) setPreview(message.index);
      };
    } catch {
      // Preview and printed notes remain available without cross-window updates.
    }
    return () => channel?.close();
  }, [cycleId, effectiveDay, format, totalSlides]);

  useEffect(() => {
    const outline = outlineRef.current;
    const selected = outline?.querySelector('[aria-current="step"]');
    if (!selected) return;
    const itemBounds = selected.getBoundingClientRect();
    const listBounds = outline.getBoundingClientRect();
    if (itemBounds.top < listBounds.top || itemBounds.bottom > listBounds.bottom) {
      outline.scrollTop += itemBounds.top - listBounds.top - outline.clientHeight / 2 + selected.clientHeight / 2;
    }
    if (itemBounds.left < listBounds.left || itemBounds.right > listBounds.right) {
      outline.scrollLeft += itemBounds.left - listBounds.left - outline.clientWidth / 2 + selected.clientWidth / 2;
    }
  }, [selectedIndex, query]);

  useEffect(() => {
    function preparePrint() {
      if (lessonPlan) document.body.classList.add("pr-printing");
    }
    function finishPrint() { document.body.classList.remove("pr-printing"); }
    window.addEventListener("beforeprint", preparePrint);
    window.addEventListener("afterprint", finishPrint);
    return () => {
      window.removeEventListener("beforeprint", preparePrint);
      window.removeEventListener("afterprint", finishPrint);
      finishPrint();
    };
  }, [lessonPlan]);

  function replaceFallbackUrl(url) {
    if (fallbackRef.current) URL.revokeObjectURL(fallbackRef.current);
    fallbackRef.current = url;
    setFallbackUrl(url);
  }

  useEffect(() => () => {
    if (fallbackRef.current) URL.revokeObjectURL(fallbackRef.current);
  }, []);

  function resetSelection() {
    setPreview(0);
    setQuery("");
    setNote("");
    replaceFallbackUrl("");
  }

  function chooseCycle(value) { setCycleId(value); resetSelection(); }
  function chooseDay(value) { setDay(value); resetSelection(); }
  function chooseFormat(value) { setFormat(value); resetSelection(); }

  function handlePresent(startIndex = 0) {
    setNote("");
    replaceFallbackUrl("");
    let result;
    try {
      result = openCyclePresentation(cycleId, { day: effectiveDay, format, startIndex });
    } catch {
      setNote(COPY.openFailed);
      return;
    }
    if (!result.ok) {
      setNote(COPY.popupBlocked);
      replaceFallbackUrl(result.url || "");
    }
  }

  return (
    <TeacherPageShell className="ws-page pr-page" product="present" intent="resources" data-teacher-route="present">
      <nav className="ws-route-nav" aria-label={COPY.navigation}>
        <button type="button" className="ws-back-link" onClick={onBack}>{COPY.back}</button>
      </nav>
      <TeacherPageHeader className="pr-head" eyebrow={COPY.eyebrow(className)} title="Today’s lesson" description={cycle ? [cycleTitle, dayLabel, lessonPlan?.title, lessonPlan ? COPY.approximateMinutes(lessonPlan.minutes) : COPY.slides(totalSlides)].filter(Boolean).join(" · ") : "Choose a teaching cycle for this class to prepare a lesson."}>
        <div className="pr-head-actions">
          <button type="button" className="ws-primary pr-present" onClick={() => handlePresent(selectedIndex)} disabled={!totalSlides} aria-label={`Present full screen from slide ${selectedIndex + 1}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v2H3V4Zm1 3h16v9H13v2l3 2v1H8v-1l3-2v-2H4V7Z" /></svg>
            Present
          </button>
        </div>
      </TeacherPageHeader>

      {note && <p className="ws-note pr-note" role="status">{note}{fallbackUrl && <> <a href={fallbackUrl} target="_blank" rel="noreferrer">{COPY.openTab}</a></>}</p>}
      {cycle && classId && !getPresentationCycle(currentCycleId) && <p className="pr-resume-note">The class teaching cycle is not set. This workspace is using the lesson previously selected for this class.</p>}

      <details className="pr-change-lesson" open={!cycle || undefined}>
        <summary>{cycle ? `Change lesson · ${cycleTitle}${dayLabel ? ` · ${dayLabel}` : ""} · ${selectedFormat.label}` : "Choose teaching cycle"}</summary>
      <TeacherFilterBar className="pr-setup" label={COPY.options}>
        <div className="pr-selection-row">
          <label className="ws-field pr-cycle-field">
            <span>{COPY.cycle}</span>
            <select value={cycleId} onChange={event => chooseCycle(event.target.value)}>
              <option value="" disabled>Choose teaching cycle</option>
              <optgroup label={COPY.teachingCycles}>{teachingCycles.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</optgroup>
              {assessmentWeeks.length > 0 && <optgroup label={COPY.assessmentWeeks}>{assessmentWeeks.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</optgroup>}
            </select>
          </label>
          {!isAssessment && <div className="pr-days">
            <span className="pr-control-label">{COPY.day}</span>
            <div className="pr-day-grid" role="group" aria-label={COPY.day}>
              {DAY_TILES.map(tile => <button key={tile.value} type="button" className={`pr-day${day === tile.value ? " active" : ""}`} aria-pressed={day === tile.value} aria-label={tile.label} onClick={() => chooseDay(tile.value)}>{tile.label.slice(0, 3)}</button>)}
              <button type="button" className={`pr-day pr-day-resources${day === "" ? " active" : ""}`} aria-pressed={day === ""} onClick={() => chooseDay("")}>{COPY.allResources}</button>
            </div>
            {today && <button className="pr-text-button" type="button" onClick={() => chooseDay(today)}>{COPY.todayLesson}</button>}
            <small>{classId ? COPY.savedForClass : COPY.chooseClassToRemember}</small>
          </div>}
        </div>
        {lessonPlan ? <div className="pr-formats" role="group" aria-label={COPY.lessonLength}>
          {PRESENTATION_FORMATS.map(option => <button key={option.value} type="button" className={`pr-format${format === option.value ? " active" : ""}`} aria-pressed={format === option.value} onClick={() => chooseFormat(option.value)}>
            <span className="pr-format-heading"><strong>{option.label}</strong><span>{COPY.shortMinutes(option.minutes)}</span></span>
            <span className="pr-format-description">{option.description}</span>
          </button>)}
        </div> : cycle && <p className="pr-resource-context">{isAssessment ? COPY.assessmentContext : COPY.resourceContext}</p>}
      </TeacherFilterBar>
      </details>

      {cycle && <div className="pr-preparation-switch" role="group" aria-label="Lesson preparation view">
        {lessonPlan && <button type="button" aria-pressed={activeWorkspaceMode === "plan"} onClick={() => setWorkspaceMode("plan")}>Plan</button>}
        <button type="button" aria-pressed={activeWorkspaceMode === "preview"} onClick={() => setWorkspaceMode("preview")}>Preview</button>
        {lessonPlan && <button type="button" className="pr-text-button" onClick={() => window.print()}>{COPY.print}</button>}
        {!isAssessment && onStartStudentSession && <button type="button" className="pr-text-button" onClick={() => onStartStudentSession([], { target: "cycle_practice", cycleId })}>Student practice</button>}
      </div>}
      {cycle && <p className="pr-resume-note">{selectedIndex > 0 ? `Present resumes from slide ${selectedIndex + 1} of ${totalSlides}. Choose a slide in Preview to change the starting point.` : `Present starts at slide 1 of ${totalSlides}.`} {classId ? COPY.savedForClass : COPY.chooseClassToRemember}</p>}

      {cycle && <div className={`pr-workspace is-${activeWorkspaceMode}`}>
        <div className="pr-main-column">
          {activeWorkspaceMode === "preview" && <section className="pr-preview" aria-label={COPY.previewRegion}>
            <div className="pr-preview-head">
              <div><strong>{COPY.preview}</strong><span className="pr-slide-counter" aria-live="polite">{COPY.slidePosition(totalSlides ? selectedIndex + 1 : 0, totalSlides)}</span></div>
              <div className="pr-preview-nav">
                <button type="button" onClick={() => setPreview(index => Math.max(0, index - 1))} aria-label="Previous preview slide" disabled={!totalSlides || selectedIndex === 0}>‹</button>
                <button type="button" onClick={() => setPreview(index => Math.min(totalSlides - 1, index + 1))} aria-label="Next preview slide" disabled={!totalSlides || selectedIndex === totalSlides - 1}>›</button>
              </div>
            </div>
            <div className="pr-stage">
              {deck ? <iframe ref={frameRef} className="pr-frame" title={COPY.previewRegion} srcDoc={previewHtml} onLoad={() => {
                previewSyncIndexRef.current = selectedIndex;
                postPreviewToFrame(frameRef.current, selectedIndex);
              }} /> : <div className="pr-preview-error" role="alert"><strong>{COPY.previewFailed}</strong><p>{COPY.previewRecovery}</p></div>}
            </div>
            <div className="pr-preview-footer">
              <p>{COPY.previewHint}</p>

            </div>
          </section>}

          {current && <details className="pr-teacher-notes" aria-label={COPY.notesRegion} hidden={activeWorkspaceMode !== "preview"}>
            <summary>Teacher notes · slide {selectedIndex + 1} · private</summary>
            <div className="pr-notes-heading"><p className="pr-eyebrow">{COPY.notesHeading(selectedIndex + 1)}</p><span>{COPY.notesPrivate}</span></div>
            <h3>{current.title || slideLabel(current)}</h3>
            <p className="pr-current-guidance">{current.teacher || currentBlock?.guidance || COPY.defaultGuidance}</p>
            {currentBlock && <p className="pr-block-context"><strong>{COPY.blockTiming(currentBlock.label, currentBlock.minutes)}</strong><span>{currentBlock.guidance}</span></p>}
            {(lessonPlan?.support || lessonPlan?.stretch) && <div className="pr-adaptations">
              {lessonPlan.support && <div><h4>{COPY.support}</h4><p>{lessonPlan.support}</p></div>}
              {lessonPlan.stretch && <div><h4>{COPY.stretch}</h4><p>{lessonPlan.stretch}</p></div>}
            </div>}
          </details>}

          {lessonPlan && <section className="pr-plan" aria-label={COPY.planRegion} hidden={activeWorkspaceMode !== "plan"}>
            <div className="pr-section-heading"><h3>{COPY.planTitle}</h3><span>{COPY.approximateMinutes(lessonPlan.minutes)}</span></div>
            <p className="pr-preparation"><strong>{COPY.prepare}</strong> {lessonPlan.preparation}</p>
            <ol className="pr-lesson-plan">
              {lessonPlan.blocks.map(block => {
                const firstSlide = slideIndex.find(entry => entry.block === block.id);
                return <li key={block.id} className={current?.block === block.id ? "active" : ""}>
                  <span className="pr-block-minutes">{block.minutes}<small>{COPY.minuteUnit}</small></span>
                  <div><h4>{block.label}</h4><p>{block.guidance}</p>{firstSlide && <button type="button" className="pr-text-button" onClick={() => { setQuery(""); setPreview(firstSlide.index); setWorkspaceMode("preview"); }}>{COPY.previewActivity} <span aria-hidden="true">→</span></button>}</div>
                </li>;
              })}
            </ol>
            <p className="pr-plan-footnote">{COPY.planFootnote}</p>
          </section>}
        </div>

        <aside className="pr-outline" aria-label={COPY.outlineRegion} hidden={activeWorkspaceMode !== "preview"}>
          <div className="pr-outline-head"><h3>{COPY.outlineTitle}</h3><span>{COPY.slides(totalSlides)}</span></div>
          <label className="pr-search"><span>{COPY.findSlide}</span><input type="search" aria-label={COPY.findSlide} value={query} onChange={event => setQuery(event.target.value)} placeholder={COPY.searchPlaceholder} /></label>
          <div className="pr-outline-results" aria-live="polite">{query ? COPY.filteredSlides(filteredSlides.length, totalSlides) : COPY.outlineHint}</div>
          <ol className="pr-slide-list" ref={outlineRef}>
            {filteredSlides.map((entry, index) => {
              const group = entry.blockLabel || entry.section;
              const previous = filteredSlides[index - 1];
              const previousGroup = previous?.blockLabel || previous?.section;
              return <li key={entry.index}>
                {group && group !== previousGroup && <p className="pr-outline-group">{group}</p>}
                <button type="button" className={`pr-slide-item${entry.index === selectedIndex ? " active" : ""}`} aria-current={entry.index === selectedIndex ? "step" : undefined} onClick={() => setPreview(entry.index)}>
                  <span className="pr-slide-number">{entry.index + 1}</span>
                  <span className="pr-slide-text"><strong>{entry.title || slideLabel(entry)}</strong><span>{slideLabel(entry)}</span></span>
                  {entry.index === selectedIndex && <span className="pr-slide-marker" aria-hidden="true">▶</span>}
                </button>
              </li>;
            })}
          </ol>
          {!filteredSlides.length && <div className="pr-empty"><p>{COPY.noMatches(query)}</p><button type="button" className="pr-text-button" onClick={() => setQuery("")}>{COPY.showAll}</button></div>}
          <details className="pr-cycle-resources"><summary>{COPY.weekResources}</summary><dl>{contents.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></details>
        </aside>
      </div>}

      <details className="pr-help"><summary>{COPY.helpTitle}</summary><p>{COPY.help}</p></details>
      {lessonPlan && <PrintLessonPlan cycleTitle={cycleTitle} dayLabel={dayLabel} formatLabel={selectedFormat.label} lessonPlan={lessonPlan} slideIndex={slideIndex} />}
    </TeacherPageShell>
  );
}
