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
  presentationDayPlan,
  buildPresentationManifest,
  buildPresentationCoverageDashboard,
  buildPresentationPrintHtml
} from "../utils/present/presentationBuilder.js";
import {
  currentTeachingDay,
  readPresentWorkspaceState,
  rememberPresentWorkspaceState
} from "../utils/present/presentWorkspaceState.js";
import { createPresentSessionId, isPresentSessionMessage, presentTargetText, manifestMedia, checkPresentMedia, PRESENT_OBSERVATION_STATES, observationRecommendation } from "../utils/present/presentWorkspace.js";
import "../styles/worksheets.css";
import "../styles/present.css";

const EMPTY_SLIDES = [];
const SLIDE_LABELS = COPY.slideLabels;

function slideLabel(entry) {
  const key = String(entry?.cls || "").split(/\s+/).find(name => SLIDE_LABELS[name]);
  return SLIDE_LABELS[key] || entry?.section || COPY.slideFallback;
}

const DAY_TILES = PRESENTATION_DAYS.filter(option => option.value);

function postPreviewToFrame(frame, index, sessionId, deckKey) {
  if (!frame?.contentWindow) return;
  try {
    frame.contentWindow.postMessage({ type: "lp-present-show", index, sessionId, deckKey }, window.location.origin);
  } catch {
    // The frame's load event retries after a lesson change.
  }
}

function PrintLessonPlan({ html }) {
  if (typeof document === "undefined" || !html) return null;
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] || '';
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join('\n');
  return createPortal(
    <article className="pr-print-plan" aria-label={COPY.printRegion}>
      <style>{`@media print { ${styles} }`}</style>
      <div dangerouslySetInnerHTML={{ __html: body }} />
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
  const [sessionId] = useState(createPresentSessionId);
  const [retrievalMode, setRetrievalMode] = useState("retrieval");
  const [quiet, setQuiet] = useState(() => { try { return localStorage.getItem('lp-present-quiet-device') !== 'false'; } catch { return true; } });
  const [speech, setSpeech] = useState(true);
  const [reviewMode, setReviewMode] = useState('full-cumulative');
  const [sortMode, setSortMode] = useState('auto');
  const [focusedGraphemes, setFocusedGraphemes] = useState('');
  const [focusedWords, setFocusedWords] = useState('');
  const [runtimeStatus, setRuntimeStatus] = useState({});
  const [projectorConnected, setProjectorConnected] = useState(false);
  const [readiness, setReadiness] = useState([]);
  const [checkingMedia, setCheckingMedia] = useState(false);
  const [observations, setObservations] = useState({});
  const [bridge, setBridge] = useState('');
  const [coverageDashboard, setCoverageDashboard] = useState(null);
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState('');
  const [studentTree, setStudentTree] = useState('Inspect the live preview to read its visible headings and accessible control names.');
  const [elapsed, setElapsed] = useState(0);
  const [clockRunning, setClockRunning] = useState(false);
  const [responseSeconds, setResponseSeconds] = useState(12);
  const [transitionSeconds, setTransitionSeconds] = useState(20);
  const [teacherBudget, setTeacherBudget] = useState(() => PRESENTATION_FORMATS.find(option => option.value === initialWorkspace.format)?.minutes || 15);
  const popupRef = useRef(null);
  const initialMediaOptions = useRef({ retrievalMode, quiet, speech });
  const popupSyncedRef = useRef(false);
  const currentMediaOptionsRef = useRef({ retrievalMode, quiet, speech });
  currentMediaOptionsRef.current = { retrievalMode, quiet, speech };
  const channelRef = useRef(null);
  const readinessAbortRef = useRef(null);
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
  const reviewPolicy = useMemo(() => ({ mode: reviewMode, graphemes: focusedGraphemes.split(/[ ,]+/).filter(Boolean), words: focusedWords.split(/[ ,]+/).filter(Boolean) }), [reviewMode, focusedGraphemes, focusedWords]);
  const buildOptions = useMemo(() => ({ day: effectiveDay, format, sessionId, ...initialMediaOptions.current, reviewPolicy, sortMode }), [effectiveDay, format, sessionId, reviewPolicy, sortMode]);
  const manifest = useMemo(() => cycle ? buildPresentationManifest(cycleId, buildOptions) : null, [cycle, cycleId, buildOptions]);
  const deckKey = manifest?.deckKey || `${cycleId}:${effectiveDay}:${format}`;
  const deck = useMemo(() => {
    try {
      return buildCyclePresentation(cycleId, buildOptions);
    } catch {
      return null;
    }
  }, [cycleId, buildOptions]);
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
  const currentManifest = manifest?.slides?.[selectedIndex];
  const nextManifest = manifest?.slides?.[selectedIndex + 1];
  const planningBudgetMinutes = Math.min(180, Math.max(1, Number(teacherBudget) || manifest?.timing?.budgetMinutes || 15));
  const paceResponseSeconds = Math.min(120, Math.max(1, Number(responseSeconds) || 12));
  const paceTransitionSeconds = Math.min(120, Math.max(0, Number(transitionSeconds) || 0));
  const teacherEstimatedMinutes = Math.ceil(((manifest?.timing?.responseTurns || 0) * paceResponseSeconds + (manifest?.slides?.length || 0) * paceTransitionSeconds) / 60);
  const teacherEstimateBasis = `${paceResponseSeconds} seconds per response turn + ${paceTransitionSeconds} seconds per slide transition; estimate rounded up to whole minutes. These are teacher planning allowances, not observed classroom duration.`;
  const budgetWarning = teacherEstimatedMinutes > planningBudgetMinutes
    ? 'The selected lesson estimate exceeds your planning budget. Increase the budget, choose explicit focused review, or stop at a saved slide boundary.'
    : 'This is a planning allowance; observe actual classroom duration.';
  const printHtml = useMemo(() => lessonPlan ? buildPresentationPrintHtml(cycleId, { ...buildOptions, planningBudgetMinutes, timingAllowances: { responseSeconds: paceResponseSeconds, transitionSeconds: paceTransitionSeconds } }) : '', [lessonPlan, cycleId, buildOptions, planningBudgetMinutes, paceResponseSeconds, paceTransitionSeconds]);
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
    postPreviewToFrame(frameRef.current, selectedIndex, sessionId, deckKey);
  }, [selectedIndex, sessionId, deckKey]);

  useEffect(() => {
    rememberPresentWorkspaceState(classId, { cycleId, day, format, preview: selectedIndex });
  }, [classId, cycleId, day, format, selectedIndex]);

  useEffect(() => {
    function receivePreview(event) {
      if (event.origin !== window.location.origin) return;
      const fromProjector = event.source === popupRef.current;
      if (!fromProjector && event.source !== frameRef.current?.contentWindow) return;
      if (!["lp-present-preview", "lp-present-slide"].includes(event.data?.type) || event.data.sessionId !== sessionId || event.data.deckKey !== deckKey) return;
      if (fromProjector && event.data.disconnected) {
        setProjectorConnected(false); popupSyncedRef.current = false; setRuntimeStatus({}); return;
      }
      if (fromProjector) {
        setProjectorConnected(true); setRuntimeStatus(event.data);
        if (!popupSyncedRef.current) {
          popupSyncedRef.current = true;
          popupRef.current.postMessage({ type: 'lp-present-command', sessionId, deckKey, commandId: createPresentSessionId(), command: 'retrieval', value: currentMediaOptionsRef.current.retrievalMode }, window.location.origin);
        }
      } else if (!popupSyncedRef.current) setRuntimeStatus(event.data);
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
  }, [totalSlides, sessionId, deckKey]);

  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel(`lp-present-live:${sessionId}`);
      channelRef.current = channel;
      channel.onmessage = event => {
        const message = event.data;
        if (!isPresentSessionMessage(message, sessionId, deckKey) || message.embedded === true || message.surface === 'preview') return;
        if (message.disconnected) { setProjectorConnected(false); popupSyncedRef.current = false; setRuntimeStatus({}); return; }
        setProjectorConnected(true);
        setRuntimeStatus(message);
        if (!popupSyncedRef.current) {
          popupSyncedRef.current = true;
          const preferences = currentMediaOptionsRef.current;
          channel.postMessage({ type: 'lp-present-command', sessionId, deckKey, commandId: createPresentSessionId(), command: 'retrieval', value: preferences.retrievalMode });
        }
        if (Number.isInteger(message.index) && message.index >= 0 && message.index < totalSlides) setPreview(message.index);
      };
    } catch {
      // Preview and printed notes remain available without cross-window updates.
    }
    return () => { channel?.close(); channelRef.current = null; };
  }, [sessionId, deckKey, totalSlides]);

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

  function chooseCycle(value) { setCycleId(value); setSortMode('auto'); resetSelection(); }
  function chooseDay(value) { setDay(value); setSortMode('auto'); resetSelection(); }
  function chooseFormat(value) { setFormat(value); resetSelection(); }

  useEffect(() => {
    setResponseSeconds(12); setTransitionSeconds(20); setTeacherBudget(manifest?.timing?.budgetMinutes || 15); popupSyncedRef.current = false; setProjectorConnected(false); setReadiness([]); setCheckingMedia(false); setObservations({}); setBridge(''); setElapsed(0); setClockRunning(false); setRuntimeStatus({});
    readinessAbortRef.current?.abort();
    return () => readinessAbortRef.current?.abort();
  }, [deckKey, reviewPolicy, manifest?.timing?.budgetMinutes]);
  useEffect(() => { try { localStorage.setItem('lp-present-quiet-device', String(quiet)); } catch { /* Device preference is optional. */ } }, [quiet]);
  useEffect(() => { if (!clockRunning) return; const timer = setInterval(() => setElapsed(value => value + 1), 1000); return () => clearInterval(timer); }, [clockRunning]);
  useEffect(() => {
    const links = manifestMedia({ slides: [currentManifest, nextManifest].filter(Boolean) }).filter(media => media.src).map(media => {
      const link = document.createElement('link'); link.rel = 'prefetch'; link.href = media.src; document.head.append(link); return link;
    });
    return () => links.forEach(link => link.remove());
  }, [currentManifest, nextManifest]);
  useEffect(() => {
    if (!projectorConnected) return;
    const timer = setInterval(() => {
      if (popupRef.current?.closed) { setProjectorConnected(false); popupSyncedRef.current = false; setRuntimeStatus({}); }
    }, 1000);
    return () => clearInterval(timer);
  }, [projectorConnected]);
  function command(command, value) {
    if (command === 'next' || command === 'prev' || command === 'show') {
      const index = command === 'show' ? value : Math.max(0, Math.min(totalSlides - 1, selectedIndex + (command === 'next' ? 1 : -1)));
      setPreview(index); command = 'show'; value = index;
    }
    const message = { type: 'lp-present-command', sessionId, deckKey, commandId: createPresentSessionId(), command, value };
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
    if (!channelRef.current) popupRef.current?.postMessage?.(message, window.location.origin);
    channelRef.current?.postMessage(message);
  }
  async function checkReadiness() {
    readinessAbortRef.current?.abort(); const controller = new AbortController(); readinessAbortRef.current = controller;
    setCheckingMedia(true);
    const results = await checkPresentMedia(manifestMedia(manifest), { signal: controller.signal });
    if (!controller.signal.aborted) { setReadiness(results); setCheckingMedia(false); }
  }
  function generateCoverage() {
    setCheckingCoverage(true); setCoverageError('');
    setTimeout(() => {
      try { setCoverageDashboard(buildPresentationCoverageDashboard()); }
      catch (error) { setCoverageError(`Coverage could not be generated: ${error.message}`); }
      finally { setCheckingCoverage(false); }
    }, 0);
  }
  function downloadCoverage() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(coverageDashboard, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'present-curriculum-coverage.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  function inspectStudentTree() {
    const document = frameRef.current?.contentDocument;
    if (!document) { setStudentTree('Open Preview first, then inspect its current slide.'); return; }
    const slide = document.querySelector('.slide.active, .slide.is-active, .slide:not([hidden])');
    const root = slide || document.body;
    const nodes = [...root.querySelectorAll('h1,h2,h3,button,input,select,[role],[aria-label]')].filter(node => {
      const style = document.defaultView.getComputedStyle(node);
      return !node.closest('[hidden],[aria-hidden="true"]') && style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length;
    });
    setStudentTree(nodes.map(node => `${node.getAttribute('role') || node.tagName.toLowerCase()}: ${node.getAttribute('aria-label') || node.textContent.trim()}`).join('\n') || 'No visible named controls or headings found in the current preview.');
  }
  function printMaterials() {
    const html = printHtml;
    const popup = window.open('', '_blank');
    if (popup) {
      popup.addEventListener('load', async () => {
        await popup.document.fonts?.ready;
        await Promise.allSettled([...popup.document.images].map(image => image.decode()));
        popup.focus(); popup.print();
      }, { once: true });
      popup.document.open(); popup.document.write(html); popup.document.close();
    }
    else setNote('Allow a new tab to open the exact lesson materials.');
  }
  function handlePresent(startIndex = 0) {
    setNote("");
    replaceFallbackUrl("");
    let result;
    try {
      result = openCyclePresentation(cycleId, { ...buildOptions, quiet, speech, startIndex });
    } catch {
      setNote(COPY.openFailed);
      return;
    }
    popupSyncedRef.current = false;
    popupRef.current = result.window || result.popup || null;
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
      <TeacherPageHeader className="pr-head" eyebrow={COPY.eyebrow(className)} title="Today’s lesson" description={cycle ? [cycleTitle, dayLabel, lessonPlan?.title, lessonPlan ? `${lessonPlan.minutes} min planning budget` : COPY.slides(totalSlides)].filter(Boolean).join(" · ") : "Choose a teaching cycle for this class to prepare a lesson."}>
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
        {lessonPlan && <button type="button" className="pr-text-button" onClick={printMaterials}>{COPY.print}</button>}
        {!isAssessment && onStartStudentSession && <button type="button" className="pr-text-button" onClick={() => onStartStudentSession([], { target: "cycle_practice", cycleId })}>Student practice</button>}
      </div>}
      {cycle && <p className="pr-resume-note">{selectedIndex > 0 ? `Present resumes from slide ${selectedIndex + 1} of ${totalSlides}. Choose a slide in Preview to change the starting point.` : `Present starts at slide 1 of ${totalSlides}.`} {classId ? COPY.savedForClass : COPY.chooseClassToRemember}</p>}

      {cycle && <section className="pr-console" aria-label="Private presenter console">
        <div className="pr-section-heading"><h3>Presenter console · private</h3><span>{projectorConnected ? 'Projector connected' : activeWorkspaceMode === 'preview' ? 'Preview active; projector status pending' : 'Choose Preview or Present for live reveal and media controls'}</span></div>
        <div className="pr-console-grid">
          <div><strong>Current target</strong><p>{presentTargetText(currentManifest?.target) || current?.title}</p><p>{currentManifest?.construct} · {currentManifest?.responseCue || 'Everyone responds before a volunteer.'}</p></div>
          <div><strong>Next</strong><p>{nextManifest?.title || 'End of lesson'}</p><p>Reveal: {runtimeStatus.reveal ? 'shown' : 'hidden'} · Media: {runtimeStatus.mediaStatus || 'not reported'}</p></div>
          <div><strong>Pacing</strong><label>Teacher planning budget (minutes)<input type="number" aria-label="Teacher planning budget in minutes" min="1" max="180" value={teacherBudget} onChange={event => setTeacherBudget(event.target.value)} onBlur={() => setTeacherBudget(planningBudgetMinutes)} /></label><label>Seconds per response turn<input type="number" aria-label="Seconds per response turn" min="1" max="120" value={responseSeconds} onChange={event => setResponseSeconds(event.target.value)} onBlur={() => setResponseSeconds(paceResponseSeconds)} /></label><label>Seconds per slide transition<input type="number" aria-label="Seconds per slide transition" min="0" max="120" value={transitionSeconds} onChange={event => setTransitionSeconds(event.target.value)} onBlur={() => setTransitionSeconds(paceTransitionSeconds)} /></label><p>{teacherEstimateBasis}</p><p>Your budget {planningBudgetMinutes} min · estimated {teacherEstimatedMinutes} min (rounded up)</p><p>Remaining budget {Math.max(0, planningBudgetMinutes - Math.floor(elapsed / 60))} min · {manifest?.timing?.responseTurns ?? 0} planned response turns · elapsed {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</p><button type="button" onClick={() => setClockRunning(value => !value)}>{clockRunning ? 'Pause lesson clock' : 'Start lesson clock'}</button><p>{budgetWarning} The lesson clock is elapsed time recorded here, separate from the estimate.</p></div>
        </div>
        <div className="pr-console-actions">
          <button type="button" disabled={selectedIndex === 0} onClick={() => command('prev')}>Previous</button><button type="button" disabled={selectedIndex === totalSlides - 1} onClick={() => command('next')}>Next</button>
          <button type="button" disabled={activeWorkspaceMode !== 'preview' && !projectorConnected} onClick={() => command('reveal')}>Reveal answer</button><button type="button" disabled={activeWorkspaceMode !== 'preview' && !projectorConnected} onClick={() => command('blank')}>Blank / resume screen</button><button type="button" disabled={activeWorkspaceMode !== 'preview' && !projectorConnected} onClick={() => command('stop-audio')}>Stop audio</button>
          <label>Teaching stage <select aria-label="Teaching stage" disabled={activeWorkspaceMode !== 'preview' && !projectorConnected} value={runtimeStatus.teachingStage || runtimeStatus.stage || 'model'} onChange={event => command('stage', event.target.value)}>{['model', 'practise', 'try', 'explain', 'apply'].map(stage => <option key={stage}>{stage}</option>)}</select></label>
          <label>Teaching mode <select aria-label="Teaching mode" value={retrievalMode} onChange={event => { setRetrievalMode(event.target.value); command('retrieval', event.target.value); }}><option value="retrieval">Silent retrieval first</option><option value="model">Explicit teacher model</option></select></label>
          <label><input type="checkbox" checked={quiet} onChange={event => { setQuiet(event.target.checked); command('quiet', event.target.checked); }} /> Quiet room (this device)</label>
          <label><input type="checkbox" checked={speech} onChange={event => { setSpeech(event.target.checked); command('speech', event.target.checked); }} /> Teaching speech</label>
        </div>
        <details><summary>Review coverage and lesson readiness</summary>
          <label>Review policy <select aria-label="Review policy" value={reviewMode} onChange={event => { setReviewMode(event.target.value); resetSelection(); }}><option value="full-cumulative">Full cumulative review (default)</option><option value="focused-review">Explicit focused review</option></select></label>
          <label>Sort objective <select aria-label="Sort objective" value={sortMode} onChange={event => { setSortMode(event.target.value); resetSelection(); }}><option value="auto">Use lesson’s eligible objective</option>{(manifest?.sortChoices || []).filter(choice => choice.value !== 'auto').map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>
          <p>Changing the sort objective rebuilds this lesson and its exact print materials, starting at slide 1. Only objectives supported by this day’s taught code appear.</p>
          {reviewMode === 'focused-review' && <div className="pr-console-grid"><label>Selected graphemes (comma separated)<input value={focusedGraphemes} onChange={event => setFocusedGraphemes(event.target.value)} /></label><label>Selected words (comma separated)<input value={focusedWords} onChange={event => setFocusedWords(event.target.value)} /></label></div>}
          <p>Included graphemes: {manifest?.reviewCoverage?.included?.graphemes?.join(' · ') || 'none'}<br />Included words: {manifest?.reviewCoverage?.included?.words?.join(' · ') || 'none'}</p>
          <p>Omitted graphemes: {manifest?.reviewCoverage?.omitted?.graphemes?.join(' · ') || 'none'}<br />Omitted words: {manifest?.reviewCoverage?.omitted?.words?.join(' · ') || 'none'}</p>
          <p>{manifest?.slides?.length || 0} actual slides · {manifest?.coverage?.length || 0} target records · {manifestMedia(manifest).length} unique media assets. Full review may take longer when children need correction or reteaching.</p>
          <button type="button" disabled={checkingMedia} onClick={checkReadiness}>{checkingMedia ? 'Decoding lesson media…' : 'Check and decode lesson media'}</button>
          <p role="status">{readiness.length ? `${readiness.filter(item => item.status === 'decoded').length} decoded; ${readiness.filter(item => item.status !== 'decoded').length} unavailable. Decode does not certify pronunciation or classroom audibility.` : 'Media has not been checked for this lesson.'}</p>
          {manifestMedia(manifest).find(item => item.type === 'audio' && item.src) && <label>Speaker test (play deliberately)<audio controls preload="none" src={manifestMedia(manifest).find(item => item.type === 'audio' && item.src).src} /></label>}
          {readiness.filter(item => item.status !== 'decoded').map(item => <p key={item.key || item.src}>{item.role || item.src}: {item.error} · model live or restore the asset before sampling.</p>)}
        </details>
        <details><summary>Author view · student prompt, answer and media</summary>
          <p><strong>Student prompt:</strong> {currentManifest?.studentPrompt || 'Not recorded'}</p><p><strong>Hidden answer:</strong> {presentTargetText(currentManifest?.answer) || JSON.stringify(currentManifest?.answer || '')}</p>
          <p><strong>Code status:</strong> {typeof currentManifest?.codeStatus === 'string' ? currentManifest.codeStatus : JSON.stringify(currentManifest?.codeStatus || {})}</p>
          <p><strong>Teacher script:</strong> {typeof currentManifest?.teacher === 'string' ? currentManifest.teacher : Object.values(currentManifest?.teacher || {}).filter(value => typeof value === 'string').join(' ')}</p>
          <p><strong>Support:</strong> {currentManifest?.teacher?.support || lessonPlan?.support || 'Model one step within the same target.'}</p><p><strong>Stretch:</strong> {currentManifest?.teacher?.stretch || lessonPlan?.stretch || 'Ask for an explanation or a fresh example.'}</p>
          <div className="pr-author-media">{manifestMedia({ slides: currentManifest ? [currentManifest] : [] }).filter(item => item.type === 'image' && item.src).map(item => <figure key={item.key}><img src={item.src} alt={`Private teacher stimulus: ${item.role || 'supporting image'}`} loading="lazy" /><figcaption>{item.role || 'Supporting image'} · {item.transcript || presentTargetText(currentManifest?.target)}</figcaption></figure>)}</div>
          <p><strong>Audio roles / transcripts:</strong> {JSON.stringify(currentManifest?.audioRoles || [])}</p>
          <ul>{manifestMedia({ slides: currentManifest ? [currentManifest] : [] }).map(item => <li key={item.key || item.src}>{item.role || item.type} · {item.transcript || 'Transcript not recorded'} · {item.src ? <a href={item.src} target="_blank" rel="noreferrer">Inspect media</a> : <strong>Required media unavailable · teacher model needed</strong>}</li>)}</ul>
          <button type="button" disabled={checkingCoverage} onClick={generateCoverage}>{checkingCoverage ? 'Generating all curriculum choices…' : 'Generate curriculum coverage'}</button>
          {coverageError && <p role="status">{coverageError}</p>}
          {coverageDashboard && <div><p role="status">{coverageDashboard.rows.length} actual curriculum choices generated. This reports content coverage, not classroom completion or learning.</p><button type="button" onClick={downloadCoverage}>Download local coverage JSON</button>
            {coverageDashboard.warnings?.length > 0 && <details><summary>{coverageDashboard.warnings.length} coverage warnings · explicit unavailable roles and missing variants</summary><div className="pr-coverage-warnings">{coverageDashboard.warnings.map((warning, index) => <p key={index}>{typeof warning === 'string' ? warning : JSON.stringify(warning)}</p>)}</div></details>}
            <div className="pr-coverage-table" tabIndex="0" role="region" aria-label="All Present curriculum choices"><table><caption>Actual lesson manifests · all cycles, days and formats</caption><thead><tr><th>Lesson</th><th>Oral skill allocation</th><th>Review</th><th>Language objectives</th><th>Constructs</th><th>Media unavailable</th><th>th variants</th></tr></thead><tbody>{coverageDashboard.rows.map(row => <tr key={`${row.cycleId}:${row.day}:${row.format}`}><th scope="row">{row.cycleId} · {row.day} · {row.format}</th><td>{(row.oral || []).map(item => `${item.skill || item.skillIndex}: ${item.count}`).join(' · ') || 'none'}</td><td>{Array.isArray(row.review?.graphemes) ? row.review.graphemes.length : row.review?.graphemes || 0} graphemes; {Array.isArray(row.review?.words) ? row.review.words.length : row.review?.words || 0} words<details><summary>Named teaching occurrences</summary><p>Graphemes: {(row.teachingOccurrences?.graphemes || []).map(item => `${item.target}: ${item.count}`).join(' · ')}</p><p>Words: {(row.teachingOccurrences?.highFrequencyWords || []).map(item => `${item.target}: ${item.count}`).join(' · ')}</p></details></td><td>{(row.languageObjectives || []).map(item => `${item.target} (${item.construct}): ${item.count}`).join(' · ')}</td><td>{Object.entries(row.constructs || {}).map(([construct, count]) => `${construct}: ${count}`).join(' · ')}</td><td>{row.audioUnavailable}</td><td>{Array.isArray(row.thVariants) ? row.thVariants.join(' · ') : JSON.stringify(row.thVariants || [])}</td></tr>)}</tbody></table></div>
          </div>}
<button type="button" onClick={inspectStudentTree}>Inspect live student accessibility names</button><pre className="pr-student-tree">{studentTree}</pre><p>This inspection shows visible headings and control names in the current preview; it is not a complete assistive-technology audit.</p>
        </details>
        <details><summary>Lesson observations and teaching handoff · local only</summary>
          <p>Record a sampled response to a named target. Chorus, supported games and board completion do not establish individual mastery. These notes stay in this workspace and are cleared on lesson change.</p>
          {[...new Set((manifest?.slides || []).map(slide => presentTargetText(slide.target)).filter(Boolean))].map(target => <label className="pr-observation" key={target}><strong>{target}</strong><select value={observations[target] || 'not sampled'} onChange={event => setObservations(value => ({ ...value, [target]: event.target.value }))}>{PRESENT_OBSERVATION_STATES.map(status => <option key={status}>{status}</option>)}</select><span>{observationRecommendation(observations[target] || 'not sampled')}</span></label>)}
          <label>Optional home-language meaning bridge (private, local)<textarea value={bridge} onChange={event => setBridge(event.target.value)} placeholder="Connect a familiar meaning, then return to the English word and target." /></label>
        </details>
      </section>}

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
                postPreviewToFrame(frameRef.current, selectedIndex, sessionId, deckKey);
                for (const [key, value] of Object.entries(currentMediaOptionsRef.current)) command(key === 'retrievalMode' ? 'retrieval' : key, value);
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
            <p className="pr-current-guidance">{typeof current.teacher === "string" ? current.teacher : currentBlock?.guidance || COPY.defaultGuidance}</p>
            {currentBlock && <p className="pr-block-context"><strong>{COPY.blockTiming(currentBlock.label, currentBlock.minutes)}</strong><span>{currentBlock.guidance}</span></p>}
            {(lessonPlan?.support || lessonPlan?.stretch) && <div className="pr-adaptations">
              {lessonPlan.support && <div><h4>{COPY.support}</h4><p>{lessonPlan.support}</p></div>}
              {lessonPlan.stretch && <div><h4>{COPY.stretch}</h4><p>{lessonPlan.stretch}</p></div>}
            </div>}
          </details>}

          {lessonPlan && <section className="pr-plan" aria-label={COPY.planRegion} hidden={activeWorkspaceMode !== "plan"}>
            <div className="pr-section-heading"><h3>{COPY.planTitle}</h3><span>{planningBudgetMinutes} min teacher budget · {teacherEstimatedMinutes} min estimated · {lessonPlan.minutes} min original format budget</span></div>
            <p className="pr-preparation"><strong>{COPY.prepare}</strong> {lessonPlan.preparation}</p>
            <ol className="pr-lesson-plan">
              {lessonPlan.blocks.map(block => {
                const blockSlides = slideIndex.filter(entry => entry.block === block.id);
                const firstSlide = blockSlides[0];
                const activityTitles = block.activityTitles || blockSlides.map(entry => entry.title);
                const blockResponseTurns = blockSlides.reduce((sum, entry) => sum + (manifest?.slides?.[entry.index]?.responseTurns || 0), 0);
                const blockEstimatedMinutes = (blockResponseTurns * paceResponseSeconds + blockSlides.length * paceTransitionSeconds) / 60;
                const blockMediaMissing = blockSlides.flatMap(entry => manifest?.slides?.[entry.index]?.media || []).filter(media => media.required && !media.src);
                return <li key={block.id} className={current?.block === block.id ? "active" : ""}>
                  <span className="pr-block-minutes">{block.planningBudgetMinutes ?? block.minutes}<small>min budget</small></span>
                  <div><h4>{block.label}</h4><p>{block.guidance}</p><p>{`${blockEstimatedMinutes.toFixed(1)} min estimated from your allowances · `}{activityTitles.length} actual activities</p><ul className="pr-plan-activities">{activityTitles.map((title, index) => <li key={`${index}:${title}`}>{title}</li>)}</ul>{blockMediaMissing.length > 0 && <p>{blockMediaMissing.length} required media roles unavailable: {blockMediaMissing.map(media => `${media.role}${media.transcript ? ` (${media.transcript})` : ''}`).join(' · ')}. Prepare a live teacher model; no delivered recording is claimed.</p>}{firstSlide && <button type="button" className="pr-text-button" onClick={() => { setQuery(""); setPreview(firstSlide.index); setWorkspaceMode("preview"); }}>{COPY.previewActivity} <span aria-hidden="true">→</span></button>}</div>
                </li>;
              })}
            </ol>
            <p className="pr-plan-footnote">{budgetWarning} {teacherEstimateBasis} {manifest?.timing?.responseTurns} planned response turns. Full cumulative review remains selected unless you explicitly choose focused review. These are planning allowances; actual classroom duration has not been observed.</p>
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
                <button type="button" className={`pr-slide-item${entry.index === selectedIndex ? " active" : ""}`} aria-current={entry.index === selectedIndex ? "step" : undefined} onClick={() => { setPreview(entry.index); command("show", entry.index); }}>
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
      {lessonPlan && <PrintLessonPlan html={printHtml} />}
    </TeacherPageShell>
  );
}
