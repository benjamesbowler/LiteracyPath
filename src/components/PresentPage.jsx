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
import "../styles/worksheets.css";
import "../styles/present.css";

const LAST_PRESENTED_KEY = "lp-present-last";
const EMPTY_SLIDES = [];
const SLIDE_LABELS = COPY.slideLabels;

function slideLabel(entry) {
  const key = String(entry?.cls || "").split(/\s+/).find(name => SLIDE_LABELS[name]);
  return SLIDE_LABELS[key] || entry?.section || COPY.slideFallback;
}

function lastPresentedCycle(options) {
  try {
    const last = window.localStorage.getItem(LAST_PRESENTED_KEY);
    if (last && options.some(option => option.id === last)) return last;
  } catch {
    // The current class still works when browser storage is unavailable.
  }
  return "";
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

export function PresentPage({ className = "", currentCycleId = "", onBack }) {
  const cycleOptions = useMemo(() => presentationCycleOptions(), []);
  const teachingCycles = useMemo(() => cycleOptions.filter(option => option.type !== "assessment"), [cycleOptions]);
  const assessmentWeeks = useMemo(() => cycleOptions.filter(option => option.type === "assessment"), [cycleOptions]);
  const [cycleId, setCycleId] = useState(() =>
    (currentCycleId && cycleOptions.some(option => option.id === currentCycleId) ? currentCycleId : "") ||
    lastPresentedCycle(cycleOptions) || cycleOptions.find(option => option.cycleNumber)?.id || cycleOptions[0]?.id || ""
  );
  const [day, setDay] = useState("monday");
  const [format, setFormat] = useState("core");
  const [preview, setPreview] = useState(0);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const fallbackRef = useRef("");
  const frameRef = useRef(null);
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
  const slideIndex = deck?.slideIndex || EMPTY_SLIDES;
  const totalSlides = slideIndex.length;
  const selectedIndex = Math.min(preview, Math.max(0, totalSlides - 1));
  const current = slideIndex[selectedIndex];
  const currentBlock = lessonPlan?.blocks.find(block => block.id === current?.block);
  const selectedFormat = PRESENTATION_FORMATS.find(option => option.value === format) || PRESENTATION_FORMATS[0];
  const cycleTitle = presentationCycleDisplayTitle(cycle);
  const dayLabel = DAY_TILES.find(option => option.value === effectiveDay)?.label || "";
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

  useEffect(() => { postPreviewToFrame(frameRef.current, selectedIndex); }, [selectedIndex]);

  useEffect(() => {
    function receivePreview(event) {
      if (event.source !== frameRef.current?.contentWindow || event.origin !== window.location.origin) return;
      if (event.data?.type !== "lp-present-preview") return;
      const index = event.data.index;
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
    try { window.localStorage.setItem(LAST_PRESENTED_KEY, cycleId); } catch { /* Optional browser memory. */ }
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
      <TeacherPageHeader className="pr-head" eyebrow={COPY.eyebrow(className)} title={COPY.title} description={COPY.description}>
        <div className="pr-head-actions">
          {lessonPlan && <button type="button" className="pr-text-button" onClick={() => window.print()}>{COPY.print}</button>}
          <button type="button" className="ws-primary pr-present" onClick={() => handlePresent()} disabled={!totalSlides}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v2H3V4Zm1 3h16v9H13v2l3 2v1H8v-1l3-2v-2H4V7Z" /></svg>
            {COPY.present}
          </button>
        </div>
      </TeacherPageHeader>

      {note && <p className="ws-note pr-note" role="status">{note}{fallbackUrl && <> <a href={fallbackUrl} target="_blank" rel="noreferrer">{COPY.openTab}</a></>}</p>}

      <TeacherFilterBar className="pr-setup" label={COPY.options}>
        <div className="pr-selection-row">
          <label className="ws-field pr-cycle-field">
            <span>{COPY.cycle}</span>
            <select value={cycleId} onChange={event => chooseCycle(event.target.value)}>
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
          </div>}
        </div>
        {lessonPlan ? <div className="pr-formats" role="group" aria-label={COPY.lessonLength}>
          {PRESENTATION_FORMATS.map(option => <button key={option.value} type="button" className={`pr-format${format === option.value ? " active" : ""}`} aria-pressed={format === option.value} onClick={() => chooseFormat(option.value)}>
            <span className="pr-format-heading"><strong>{option.label}</strong><span>{COPY.shortMinutes(option.minutes)}</span></span>
            <span className="pr-format-description">{option.description}</span>
          </button>)}
        </div> : <p className="pr-resource-context">{isAssessment ? COPY.assessmentContext : COPY.resourceContext}</p>}
      </TeacherFilterBar>

      <div className="pr-workspace-heading">
        <div>
          <p className="pr-eyebrow">{cycleTitle}</p>
          <h2>{lessonPlan ? COPY.dayTitle(dayLabel, lessonPlan.title) : isAssessment ? COPY.assessmentTitle : COPY.resourceTitle}</h2>
        </div>
        <p className="pr-lesson-meta">{lessonPlan && <span>{COPY.approximateMinutes(lessonPlan.minutes)}</span>}<span>{COPY.slides(totalSlides)}</span>{lessonPlan?.focus && <span>{COPY.focus(lessonPlan.focus)}</span>}</p>
      </div>

      <div className="pr-workspace">
        <div className="pr-main-column">
          <section className="pr-preview" aria-label={COPY.previewRegion}>
            <div className="pr-preview-head">
              <div><strong>{COPY.preview}</strong><span className="pr-slide-counter" aria-live="polite">{COPY.slidePosition(totalSlides ? selectedIndex + 1 : 0, totalSlides)}</span></div>
              <div className="pr-preview-nav">
                <button type="button" onClick={() => setPreview(index => Math.max(0, index - 1))} aria-label={COPY.previous} disabled={!totalSlides || selectedIndex === 0}>‹</button>
                <button type="button" onClick={() => setPreview(index => Math.min(totalSlides - 1, index + 1))} aria-label={COPY.next} disabled={!totalSlides || selectedIndex === totalSlides - 1}>›</button>
              </div>
            </div>
            <div className="pr-stage">
              {deck ? <iframe ref={frameRef} className="pr-frame" title={COPY.previewRegion} srcDoc={deck.html} onLoad={() => postPreviewToFrame(frameRef.current, selectedIndex)} /> : <div className="pr-preview-error" role="alert"><strong>{COPY.previewFailed}</strong><p>{COPY.previewRecovery}</p></div>}
            </div>
            <div className="pr-preview-footer">
              <p>{COPY.previewHint}</p>
              <button type="button" className="pr-text-button" onClick={() => handlePresent(selectedIndex)} disabled={!totalSlides}>{COPY.presentFrom(selectedIndex + 1)} <span aria-hidden="true">↗</span></button>
            </div>
          </section>

          {current && <section className="pr-teacher-notes" aria-label={COPY.notesRegion}>
            <div className="pr-notes-heading"><p className="pr-eyebrow">{COPY.notesHeading(selectedIndex + 1)}</p><span>{COPY.notesPrivate}</span></div>
            <h3>{current.title || slideLabel(current)}</h3>
            <p className="pr-current-guidance">{current.teacher || currentBlock?.guidance || COPY.defaultGuidance}</p>
            {currentBlock && <p className="pr-block-context"><strong>{COPY.blockTiming(currentBlock.label, currentBlock.minutes)}</strong><span>{currentBlock.guidance}</span></p>}
            {(lessonPlan?.support || lessonPlan?.stretch) && <div className="pr-adaptations">
              {lessonPlan.support && <div><h4>{COPY.support}</h4><p>{lessonPlan.support}</p></div>}
              {lessonPlan.stretch && <div><h4>{COPY.stretch}</h4><p>{lessonPlan.stretch}</p></div>}
            </div>}
          </section>}

          {lessonPlan && <section className="pr-plan" aria-label={COPY.planRegion}>
            <div className="pr-section-heading"><h3>{COPY.planTitle}</h3><span>{COPY.approximateMinutes(lessonPlan.minutes)}</span></div>
            <p className="pr-preparation"><strong>{COPY.prepare}</strong> {lessonPlan.preparation}</p>
            <ol className="pr-lesson-plan">
              {lessonPlan.blocks.map(block => {
                const firstSlide = slideIndex.find(entry => entry.block === block.id);
                return <li key={block.id} className={current?.block === block.id ? "active" : ""}>
                  <span className="pr-block-minutes">{block.minutes}<small>{COPY.minuteUnit}</small></span>
                  <div><h4>{block.label}</h4><p>{block.guidance}</p>{firstSlide && <button type="button" className="pr-text-button" onClick={() => { setQuery(""); setPreview(firstSlide.index); }}>{COPY.previewActivity} <span aria-hidden="true">→</span></button>}</div>
                </li>;
              })}
            </ol>
            <p className="pr-plan-footnote">{COPY.planFootnote}</p>
          </section>}
        </div>

        <aside className="pr-outline" aria-label={COPY.outlineRegion}>
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
      </div>

      <details className="pr-help"><summary>{COPY.helpTitle}</summary><p>{COPY.help}</p></details>
      {lessonPlan && <PrintLessonPlan cycleTitle={cycleTitle} dayLabel={dayLabel} formatLabel={selectedFormat.label} lessonPlan={lessonPlan} slideIndex={slideIndex} />}
    </TeacherPageShell>
  );
}
