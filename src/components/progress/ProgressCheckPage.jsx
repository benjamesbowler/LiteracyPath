import { useCallback, useEffect, useRef, useState } from "react";
import { PROGRESS_TEST_TRACKS } from "../../policy/progressTestPolicy.js";
import { beginProgressTest, commitProgressResponse, createProgressTestRun, finishProgressTest, nextProgressItem, progressAttemptFromRun } from "../../utils/progressTestRouter.js";
import { clearProgressRunLocal, loadProgressRun } from "../../data/progressTestStore.js";
import { createProgressRunSync } from "../../data/progressRunSync.js";
import { progressAudioCues, progressCheckAudioPath } from "../../utils/progressCheckAudio.js";
import { PROGRESS_CHECK_INSTRUCTIONS } from "../../data/progressCheckInstructions.js";
import { ProgressCheckReportsPanel } from "./ProgressCheckReportsPanel.jsx";
import "../../styles/progress-check.css";
import { LiteracyPracticePage } from "./LiteracyPracticePage.jsx";
import { loadProgressRunLocal } from "../../data/progressTestStore.js";
const STORAGE_SAVE_ERROR = "This device could not keep your answer. Ask your teacher to retry saving before continuing.";

export function IndependentProgressCheckPage({ studentId, studentName = "", teacherId = "local", classId = "", client = null, token = "", focusSession = null, history = [], onExit, onSaved, onContentAvailabilityChange }) {
  const [bank, setBank] = useState(null);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [planKind, setPlanKind] = useState("broad_profile");
  const [trackId, setTrackId] = useState("hear_sounds");
  const [startingTier, setStartingTier] = useState("automatic");
  const [startingReason, setStartingReason] = useState("");
  const [delivery, setDelivery] = useState({});
  const [mediaError, setMediaError] = useState("");
  const [imageReady, setImageReady] = useState(true);
  const [supportUsed, setSupportUsed] = useState(false);
  const [activeCue, setActiveCue] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [saveState, setSaveState] = useState({ status: "saved", localSaved: true });
  const syncRef = useRef(null);
  const settlePlayback = useRef(null);
  const playbackGeneration = useRef(0), sequenceAttempt = useRef("");
  const warmupAttempt = useRef(""), warmupAccess = useRef("not_delivered");
  const [receiptReadyId, setReceiptReadyId] = useState("");
  const savedCallback = useRef(onSaved);
  useEffect(() => { savedCallback.current = onSaved; }, [onSaved]);
  const ref = useRef(null), historyRef = useRef(history), exposureRef = useRef([]), audioRef = useRef(null), mounted = useRef(true), itemForeground = useRef(0), foreground = useRef(0);
  const assignmentId = focusSession?.id || "";
  const ownerKey = `${teacherId}:${studentId}:${assignmentId}`;
  const focusConfig = JSON.stringify(focusSession?.resolved_config || {});
  const setCurrent = useCallback(next => {
    if (ref.current?.currentItem?.id !== next?.currentItem?.id) {
      playbackGeneration.current++; audioRef.current?.pause(); setDelivery(next?.currentAudioDelivery || {}); setMediaError(next?.currentMediaError || ""); setSupportUsed(Boolean(next?.currentSupportUsed)); setSpeaking(false); setActiveCue(""); setNeedsTap(false); setImageReady(!next?.currentItem?.image); itemForeground.current = next?.currentItemForegroundMs || 0;
    }
    ref.current = next; setRun(next);
  }, []);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => {
    mounted.current = true; foreground.current = 0; sequenceAttempt.current = ""; warmupAttempt.current = "";
    const sync = createProgressRunSync({ client, token, onState: state => {
      setSaveState(state);
      if (state.status === "saved" || (state.status === "device" && state.localSaved)) setError(previous => previous === STORAGE_SAVE_ERROR ? "" : previous);
    }, onSaved: attempt => savedCallback.current?.(attempt) });
    syncRef.current = sync;
    const retry = () => { void sync.retry(); };
    window.addEventListener("online", retry);
    let active = true;
    Promise.all([import("../../content/assessments/v3/progressBank.generated.js"), loadProgressRun({ client, token, studentId, teacherId, assignmentId })]).then(([module, saved]) => {
      if (!active) return;
      const loadedBank = module.PROGRESS_BANK; setBank(loadedBank);
      historyRef.current = [...historyRef.current, ...(saved.history || [])];
      exposureRef.current = saved.exposures || [];
      const draft = saved.run;
      if (draft && (draft.studentId !== studentId || draft.teacherId !== teacherId || draft.assignmentId !== assignmentId)) throw new Error("This saved check belongs to another learner.");
      setCurrent(draft); if (draft) sync.checkpoint(draft); onContentAvailabilityChange?.(true);
      setError(saved.conflict || "");
      if (!draft && token) {
        const config = JSON.parse(focusConfig);
        if (config.bank_version !== loadedBank.version) throw new Error("The assigned questions are unavailable. Ask your teacher to start a new check.");
        const next = createProgressTestRun({ bank: loadedBank, studentId, studentName, teacherId, classId, assignmentId, planKind: config.plan_kind, trackId: config.track_id, previousAttempts: historyRef.current, knownExposures: saved.exposures || [] });
        setCurrent(next);
      }
      setLoading(false);
    }).catch(failure => { if (active) { setError(failure.message); setLoading(false); onContentAvailabilityChange?.(false); } });
    // This generation counter intentionally invalidates work that began before
    // owner cleanup; it does not refer to a captured DOM node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { active = false; mounted.current = false; sync.dispose(); window.removeEventListener("online", retry); playbackGeneration.current++; audioRef.current?.pause(); };
  }, [ownerKey, client, token, studentId, studentName, teacherId, classId, assignmentId, focusConfig, onContentAvailabilityChange, setCurrent]);

  async function save(next, upload = true) {
    const sync = syncRef.current;
    const stillOwner = () => mounted.current && syncRef.current === sync;
    const terminalRetry = next === ref.current && ["completed", "partial"].includes(next.status);
    const withTime = terminalRetry ? next : { ...next, checkpointRevision: (ref.current?.checkpointRevision || 0) + 1, foregroundMs: (next.foregroundMs || 0) + foreground.current, currentItemForegroundMs: next.currentItem?.id === ref.current?.currentItem?.id ? itemForeground.current : next.currentItemForegroundMs || 0 }; foreground.current = 0;
    setCurrent(withTime);
    try {
      const checkpoint = sync.checkpoint(withTime, { upload });
      if (!checkpoint.localSaved) {
        setBusy(true);
        await checkpoint.promise;
        if (stillOwner()) setBusy(false);
      }
      if (stillOwner()) setError("");
      return withTime;
    } catch {
      // A device-storage failure needs a positive server receipt before another
      // response can be accepted. Network errors with durable local evidence
      // are handled by the background sync queue instead.
      if (!stillOwner()) return null;
      setBusy(true);
      try { await sync.retry(); if (stillOwner()) { setBusy(false); setError(""); } return stillOwner() ? withTime : null; }
      catch { if (stillOwner()) { setBusy(false); setError(STORAGE_SAVE_ERROR); } return null; }
    }
  }
  useEffect(() => {
    const timer = setInterval(() => { if (ref.current && ref.current.status === "running" && !ref.current.pause && document.visibilityState === "visible") { foreground.current += 1000; if (ref.current.currentItem) itemForeground.current += 1000; } }, 1000);
    const pauseHidden = () => { if (document.visibilityState === "hidden" && ref.current?.status === "running" && !ref.current.pause) {
      playbackGeneration.current++; audioRef.current?.pause(); const next = { ...ref.current, pause: true, pauseEvents: [...(ref.current.pauseEvents || []), { kind: "background", at: new Date().toISOString() }] };
      void save(next);
    } };
    document.addEventListener("visibilitychange", pauseHidden);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", pauseHidden); };
  // The current learner/store is captured by the owner scope; state is read from ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerKey, client, token]);
  const receiptId = run?.receipt?.responseId || "";
  const receiptReady = Boolean(receiptId && receiptReadyId === receiptId);
  useEffect(() => {
    if (!run?.receipt || !receiptReady || busy || run.pause || error) return;
    const next = nextProgressItem(ref.current);
    void save(next, ["completed", "partial"].includes(next.status));
  // save reads the frozen current run and serialized owner queue.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.receipt?.responseId, receiptReady, busy, run?.pause, error]);
  function stopAudio() {
    setActiveCue("");
    playbackGeneration.current++;
    settlePlayback.current?.(false);
    audioRef.current?.pause();
    setSpeaking(false);
  }
  async function play(cue, { interfaceCue = false } = {}) {
    if (!cue || busy || (!interfaceCue && ref.current?.pause)) return false;
    settlePlayback.current?.(false);
    if (audioRef.current) audioRef.current.onpause = null;
    audioRef.current?.pause();
    const generation = playbackGeneration.current, itemId = ref.current?.currentItem?.id;
    const stillCurrent = () => mounted.current && generation === playbackGeneration.current && ref.current?.currentItem?.id === itemId;
    setSpeaking(true); setActiveCue(cue.role || ""); setNeedsTap(false);
    return new Promise(resolve => {
      const audio = audioRef.current || new Audio(); audioRef.current = audio;
      let timer, settled = false;
      const finish = (value, status) => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (stillCurrent()) {
          setSpeaking(false); setActiveCue("");
          if (status && !interfaceCue) {
            const next = { ...(ref.current.currentAudioDelivery || {}), [cue.role]: status };
            setDelivery(next);
            void save({ ...ref.current, currentAudioDelivery: next, currentMediaError: status === "failed" && cue.required ? cue.path : "" }, false);
          }
        }
        resolve(value && stillCurrent());
      };
      settlePlayback.current = finish;
      const fail = failure => {
        // A previous play() can reject with AbortError after the same audio
        // element has already started the next cue. It must not pause that cue.
        if (!stillCurrent() || settled) { finish(false); return; }
        const blocked = failure?.name === "NotAllowedError";
        if (stillCurrent()) { setNeedsTap(true); if (!blocked && cue.required) setMediaError(cue.path || cue.text); }
        finish(false, blocked ? "autoplay_blocked" : "failed");
        audio.onerror = null; audio.onpause = null; audio.pause();
      };
      audio.onpause = () => { if (audio.paused && !audio.ended) finish(false); };
      audio.onended = () => { if (audio.ended) finish(true, "completed"); };
      const stalled = () => { clearTimeout(timer); timer = setTimeout(() => fail(new Error("Recording stalled")), 12000); };
      audio.onplaying = () => clearTimeout(timer); audio.onwaiting = stalled; audio.onerror = fail;
      if (!cue.path) { fail(new Error("Leda recording unavailable")); return; }
      audio.src = cue.path; audio.preload = "auto"; stalled(); audio.play().catch(fail);
    });
  }
  async function playSequence() {
    stopAudio(); setMediaError("");
    const generation = playbackGeneration.current, itemId = ref.current?.currentItem?.id;
    for (const cue of progressAudioCues(ref.current?.currentItem)) {
      if (generation !== playbackGeneration.current || ref.current?.pause || ref.current?.currentItem?.id !== itemId || !await play(cue)) break;
    }
  }
  function speakWarmup() {
    if (ref.current?.status !== "warmup") return;
    stopAudio();
    const index = ref.current.warmupIndex;
    warmupAccess.current = "not_delivered";
    void play({ path: progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS[index === 0 ? "circle" : "square"]) }, { interfaceCue: true }).then(ok => { if (ref.current?.status === "warmup" && ref.current.warmupIndex === index) warmupAccess.current = ok ? "completed" : "access_unavailable"; });
  }
  useEffect(() => {
    if (run?.status !== "warmup" || busy || error) return;
    const key = `${run.attemptId}:${run.warmupIndex}:${run.warmupRecords.length}`;
    if (warmupAttempt.current !== key) { warmupAttempt.current = key; speakWarmup(); }
  // Warmup access is an unscored interface cue, recorded with the button response.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.status, run?.warmupIndex, run?.warmupRecords?.length, run?.attemptId, busy, error]);
  useEffect(() => {
    if (!run?.currentItem || run.pause || busy || error) return;
    const sequenceKey = `${run.currentItem.id}:${run.pauseEvents?.length || 0}`;
    if (sequenceAttempt.current === sequenceKey) return;
    sequenceAttempt.current = sequenceKey;
    void playSequence();
  // Each frozen presentation/resume owns one automatic sequence. Cue completion
  // saves re-render the page but must not restart that sequence.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.currentItem?.id, run?.pause, run?.pauseEvents?.length, busy, error]);
  useEffect(() => {
    const text = run?.pause ? PROGRESS_CHECK_INSTRUCTIONS.pause : run?.receipt ? PROGRESS_CHECK_INSTRUCTIONS.receipt : run?.status === "completed" ? PROGRESS_CHECK_INSTRUCTIONS.complete : run?.status === "partial" ? PROGRESS_CHECK_INSTRUCTIONS.partial : "";
    if (text) queueMicrotask(() => {
      if (mounted.current) {
        stopAudio();
        void play({ path: progressCheckAudioPath(text) }, { interfaceCue: true }).then(() => {
          if (mounted.current && !ref.current?.pause && receiptId && ref.current?.receipt?.responseId === receiptId) setReceiptReadyId(receiptId);
        });
      }
    });
  // Interface speech is outside the scored item and never changes its delivery.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.pause, run?.receipt?.responseId, run?.status]);
  async function start() {
    try {
      const next = createProgressTestRun({ bank, studentId, studentName, teacherId, classId, assignmentId, planKind, trackId, previousAttempts: historyRef.current, knownExposures: exposureRef.current, startingTier: startingTier === "automatic" ? undefined : Number(startingTier), startingReason });
      await save(next);
    } catch (failure) { setError(failure.message); }
  }
  const item = run?.currentItem;
  const cues = progressAudioCues(item);
  const requiredReady = cues.filter(cue => cue.required).every(cue => delivery[cue.role] === "completed") && imageReady && !mediaError;
  async function respond(selected, responseStatus = "answered") {
    if (busy || error || !item || ref.current?.currentItem?.id !== item.id) return;
    playbackGeneration.current++; audioRef.current?.pause(); setSpeaking(false);
    await save(commitProgressResponse(ref.current, { itemId: item.id, selected, responseStatus, mediaReady: requiredReady, supportUsed, audioDelivery: delivery, responseTimeMs: itemForeground.current, failedSource: mediaError }));
  }
  async function pause(value) { playbackGeneration.current++; audioRef.current?.pause(); setSpeaking(false); await save({ ...ref.current, pause: value, pauseEvents: [...(ref.current.pauseEvents || []), { kind: value ? "pause" : "resume", at: new Date().toISOString() }] }); }
  if (loading) return <main className="progress-check"><h1>Getting your check ready…</h1></main>;
  if (!run) return <main className="progress-check"><h1>Progress check</h1><p>Choose the areas to check, then start. Questions adapt as the child answers.</p><div className="progress-plan">
    <label>Check plan<select value={planKind} onChange={event => setPlanKind(event.target.value)}><option value="broad_profile">All six areas</option><option value="focused">One area</option></select></label>
    {planKind === "focused" && <label>Strand<select value={trackId} onChange={event => setTrackId(event.target.value)}>{PROGRESS_TEST_TRACKS.map(track => <option key={track.id} value={track.id}>{track.label}</option>)}</select></label>}
    <details className="progress-settings"><summary>Starting point and check details</summary><label>Starting questions<select value={startingTier} onChange={event => setStartingTier(event.target.value)}><option value="automatic">Automatic</option><option value="0">First tier</option><option value="1">Middle tier</option><option value="2">Third tier</option></select></label>
    {startingTier !== "automatic" && <label>Reason for this starting point<input value={startingReason} onChange={event => setStartingReason(event.target.value)} /></label>}
    <p>This check describes the answers tried. It does not change placement or skill mastery. Previously heard stories may be familiar.</p><p>{planKind === "focused" ? "10–16 independent answers, up to 24 presentations." : "At least four answers per strand, up to 36 independent answers and 48 presentations."} Children can take breaks.</p></details>
    <button type="button" onClick={start} disabled={!bank || busy || (startingTier !== "automatic" && !startingReason.trim())}>Prepare check</button><button type="button" onClick={onExit}>Back to checks</button></div>{error && <p role="alert">{error}</p>}</main>;
  const savingNotice = <div className="progress-save-status" role="status"><span>{saveState.status === "saved" ? "Saved" : saveState.status === "device" ? "Saved on this device" : saveState.status === "error" ? saveState.localSaved ? "Saved on this device · upload needs attention" : "Upload needs attention" : "Saving…"}</span>{saveState.status === "error" && !error && <button type="button" onClick={() => { void syncRef.current.retry(); }}>Retry upload</button>}</div>;
  if (["completed", "partial"].includes(run.status)) return <main className="progress-check"><h1>{run.status === "completed" ? "All done" : "Check saved"}</h1><p>Thank you for thinking carefully. Your answers are kept.</p>{savingNotice}{error && <><p role="alert">{error}</p><button type="button" disabled={busy} onClick={() => save(ref.current)}>Retry saving</button></>}{!token && <><ProgressCheckReportsPanel records={[progressAttemptFromRun(run)]}/><button type="button" disabled={busy || !["saved", "device"].includes(saveState.status)} onClick={() => { historyRef.current.push(progressAttemptFromRun(run)); clearProgressRunLocal(run); setCurrent(null); }}>Prepare another check</button><button type="button" onClick={onExit}>Back to checks</button></>}</main>;

  if (run.status === "warmup") return <main className="progress-check"><h1>Let’s practise the buttons</h1><p>{run.warmupIndex === 0 ? "Tap the circle." : "Tap the square. Then your check begins."}</p><button type="button" disabled={busy} onClick={speakWarmup}>🔊 Hear what to do</button><div className="progress-answers">{["circle", "square"].map(shape => <button type="button" key={shape} aria-label={shape} disabled={busy || Boolean(error)} onClick={async () => {
    const correct = shape === (run.warmupIndex === 0 ? "circle" : "square");
    const next = { ...ref.current, warmupRecords: [...ref.current.warmupRecords, { item: run.warmupIndex, selected: shape, correct, at: new Date().toISOString(), scored: false, instructionDelivery: warmupAccess.current }], warmupIndex: run.warmupIndex + (correct ? 1 : 0) };
    await save(next.warmupIndex === 2 ? beginProgressTest(next) : next);
  }}>{shape === "circle" ? "●" : "■"}</button>)}</div><p>Tap one answer. You can listen again or take a break.</p>{savingNotice}{error && <><p role="alert">{error}</p><button type="button" disabled={busy} onClick={() => save(ref.current)}>Retry saving</button></>}</main>;
  return <main className="progress-check" data-child-surface="progress-check"><header><div><p>Progress check</p><h1 data-child-title>{PROGRESS_TEST_TRACKS.find(track => track.id === (item || run.receipt?.item)?.trackId)?.label || "Progress check"}</h1><span data-child-progress>{run.responses.length} questions tried</span></div>{!run.pause && <button type="button" disabled={busy} onClick={() => pause(true)}>Take a break</button>}</header>
    {savingNotice}
    {error && <div role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={() => save(ref.current)}>Retry saving</button></div>}
    {run.pause ? <section className="progress-card"><h2>Take your time</h2><p>Carry on when you’re ready.</p><button type="button" disabled={busy} onClick={() => pause(false)}>Carry on</button>{!token && <button type="button" disabled={busy} onClick={() => save(finishProgressTest(ref.current))}>Save partial check</button>}</section> : run.receipt ? <section className="progress-card progress-receipt" role="status"><span aria-hidden="true">✓</span><h2>Answer recorded</h2><p>Next question…</p></section> : item ? <section className="progress-card"><h2>{item.prompt}</h2>
      <p className="progress-instruction" data-child-instruction>{item.modality === "print" && item.passage ? "Read the story. Tap your answer." : requiredReady ? "Tap your answer." : needsTap ? "Tap Listen to hear this question." : "Listen, then tap your answer."}</p>
      {cues.length > 0 && <button type="button" className="progress-listen" disabled={busy} onClick={playSequence}><span aria-hidden="true">🔊</span> {speaking ? "Start again" : needsTap ? "Listen" : "Listen again"}</button>}
      {item.image && <img src={item.image} alt={item.imageAlt || ""} onLoad={() => setImageReady(true)} onError={() => { setImageReady(false); setMediaError(item.image); }} />}
      {item.passage && item.modality === "print" && <p className="progress-passage">{item.passage}</p>}
      {item.targetWord && item.modality === "print" && <p className="progress-target">{item.targetWord}</p>}
      {mediaError && <div role="alert"><p>This recording or picture could not load. It will not count as a wrong answer.</p><button type="button" disabled={busy} onClick={() => respond(null, "media_failed")}>Try a different question</button></div>}
      <div className="progress-answers" role="group" aria-label="Answer choices" data-child-choices>{item.choices.map((choice, index) => <div className={`progress-answer${activeCue === `choices:${index}` ? " progress-speaking" : ""}`} key={choice.id}><button className="progress-choose" type="button" disabled={busy || !requiredReady || Boolean(error)} onClick={() => respond(choice.id)}>{item.hideWrittenLabels ? <><span aria-hidden="true">{index + 1}</span><span className="sr-only">Choose answer {index + 1}</span></> : choice.label}</button>{cues.find(cue => cue.role === `choices:${index}`) && <button className="progress-choice-listen" type="button" disabled={busy} aria-label={`Hear answer ${index + 1}`} onClick={() => { stopAudio(); void play(cues.find(cue => cue.role === `choices:${index}`)); }}><span aria-hidden="true">🔊</span> Hear again</button>}</div>)}</div>
      <div className="progress-secondary"><button type="button" disabled={busy} onClick={() => respond(null, "skipped")}>I’m not sure</button><button type="button" disabled={busy || supportUsed} onClick={() => { setSupportUsed(true); void save({ ...ref.current, currentSupportUsed: true }, false); stopAudio(); void play({ path: progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.help) }, { interfaceCue: true }); }}>I need help</button>{supportUsed && <p>Ask your teacher. This answer will be marked as helped.</p>}</div>
    </section> : null}
  </main>;
}

// Older assigned checks and their frozen drafts keep their original evidence contract.
// New preparation uses the broad teaching-and-practice programme.
function ProgressCheckRoute(props) {
  const [independent, setIndependent] = useState(() => ["warmup", "running"].includes(loadProgressRunLocal({ teacherId: props.teacherId || "local", studentId: props.studentId, assignmentId: props.focusSession?.id || "" })?.status));
  const legacyAssignment = props.token && props.focusSession?.resolved_config?.plan_kind !== "practice";
  if (legacyAssignment || (independent && !props.token)) return <IndependentProgressCheckPage {...props} onExit={() => { setIndependent(false); if (legacyAssignment) props.onExit?.(); }}/>;
  return <LiteracyPracticePage {...props} onIndependentCheck={props.token ? undefined : () => setIndependent(true)}/>;
}

export function ProgressCheckPage(props) {
  return <ProgressCheckRoute key={`${props.studentId}:${props.focusSession?.id || "free"}:${props.focusSession?.resolved_config?.plan_kind || "free"}`} {...props}/>;
}
