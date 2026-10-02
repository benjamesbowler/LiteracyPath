import { useCallback, useEffect, useRef, useState } from "react";
import { PROGRESS_TEST_TRACKS } from "../../policy/progressTestPolicy.js";
import { beginProgressTest, commitProgressResponse, createProgressTestRun, finishProgressTest, nextProgressItem, progressAttemptFromRun } from "../../utils/progressTestRouter.js";
import { clearProgressRunLocal, loadProgressRun, persistProgressRun } from "../../data/progressTestStore.js";
import { ProgressCheckReportsPanel } from "./ProgressCheckReportsPanel.jsx";
import "../../styles/progress-check.css";

function audioCues(item) {
  return Object.entries(item?.audio || {}).flatMap(([role, cue]) => Array.isArray(cue) ? cue.map((entry, index) => ({ ...entry, role: `${role}:${index}` })) : [{ ...cue, role }]).filter(cue => cue.path || cue.fallback === "speech_access");
}
export function ProgressCheckPage({ studentId, studentName = "", teacherId = "local", classId = "", client = null, token = "", focusSession = null, history = [], onExit, onSaved, onContentAvailabilityChange }) {
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
  const [speaking, setSpeaking] = useState(false);
  const playbackGeneration = useRef(0), sequenceAttempt = useRef("");
  const warmupAttempt = useRef(""), warmupAccess = useRef("not_delivered"), warmupTimer = useRef(null);
  const [receiptReadyId, setReceiptReadyId] = useState("");
  const ref = useRef(null), historyRef = useRef(history), exposureRef = useRef([]), audioRef = useRef(null), queue = useRef(Promise.resolve()), mounted = useRef(true), itemForeground = useRef(0), foreground = useRef(0);
  const assignmentId = focusSession?.id || "";
  const ownerKey = `${teacherId}:${studentId}:${assignmentId}`;
  const focusConfig = JSON.stringify(focusSession?.resolved_config || {});
  const setCurrent = useCallback(next => {
    if (ref.current?.currentItem?.id !== next?.currentItem?.id) {
      playbackGeneration.current++; globalThis.speechSynthesis?.cancel(); audioRef.current?.pause(); setDelivery(next?.currentAudioDelivery || {}); setMediaError(next?.currentMediaError || ""); setSupportUsed(Boolean(next?.currentSupportUsed)); setSpeaking(false); setImageReady(!next?.currentItem?.image); itemForeground.current = next?.currentItemForegroundMs || 0;
    }
    ref.current = next; setRun(next);
  }, []);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => {
    mounted.current = true; foreground.current = 0;
    let active = true;
    Promise.all([import("../../content/assessments/v3/progressBank.generated.js"), loadProgressRun({ client, token, studentId, teacherId, assignmentId })]).then(([module, saved]) => {
      if (!active) return;
      const loadedBank = module.PROGRESS_BANK; setBank(loadedBank);
      historyRef.current = [...historyRef.current, ...(saved.history || [])];
      exposureRef.current = saved.exposures || [];
      const draft = saved.run;
      if (draft && (draft.studentId !== studentId || draft.teacherId !== teacherId || draft.assignmentId !== assignmentId)) throw new Error("This saved check belongs to another learner.");
      setCurrent(draft); onContentAvailabilityChange?.(true);
      if (saved.conflict) setError(saved.conflict);
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
    return () => { active = false; mounted.current = false; playbackGeneration.current++; globalThis.speechSynthesis?.cancel(); audioRef.current?.pause(); };
  }, [ownerKey, client, token, studentId, studentName, teacherId, classId, assignmentId, focusConfig, onContentAvailabilityChange, setCurrent]);

  async function save(next) {
    const withTime = { ...next, foregroundMs: (next.foregroundMs || 0) + foreground.current, currentItemForegroundMs: next.currentItem?.id === ref.current?.currentItem?.id ? itemForeground.current : next.currentItemForegroundMs || 0 }; foreground.current = 0;
    setCurrent(withTime); setBusy(true); setError("");
    const task = queue.current.catch(() => {}).then(() => persistProgressRun(withTime, { client, token })); queue.current = task;
    try { const result = await task; if (mounted.current) { setBusy(false); if (result.attempt) onSaved?.(result.attempt); } }
    catch (failure) { if (mounted.current) { setBusy(false); setError(`Saving needs attention. Keep this page open and retry: ${failure.message}`); } return null; }
    return withTime;
  }
  useEffect(() => {
    const timer = setInterval(() => { if (ref.current && ref.current.status === "running" && !ref.current.pause && document.visibilityState === "visible") { foreground.current += 1000; if (ref.current.currentItem) itemForeground.current += 1000; } }, 1000);
    const pauseHidden = () => { if (document.visibilityState === "hidden" && ref.current?.status === "running" && !ref.current.pause) {
      playbackGeneration.current++; globalThis.speechSynthesis?.cancel(); audioRef.current?.pause(); const next = { ...ref.current, pause: true, pauseEvents: [...(ref.current.pauseEvents || []), { kind: "background", at: new Date().toISOString() }] };
      void save(next);
    } };
    document.addEventListener("visibilitychange", pauseHidden);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", pauseHidden); };
  // The current learner/store is captured by the owner scope; state is read from ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerKey, client, token]);
  const receiptId = run?.receipt?.responseId || "";
  const receiptReady = Boolean(receiptId && receiptReadyId === receiptId);
  useEffect(() => { if (!receiptId) return; const timer = setTimeout(() => setReceiptReadyId(receiptId), 900); return () => clearTimeout(timer); }, [receiptId]);
  useEffect(() => {
    if (!run?.receipt || !receiptReady || busy || run.pause || error) return;
    void save(nextProgressItem(ref.current));
  // save reads the frozen current run and serialized owner queue.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.receipt?.responseId, receiptReady, busy, run?.pause, error]);
  async function play(cue) {
    if (!cue || busy || ref.current?.pause) return false;
    audioRef.current?.pause(); setSpeaking(true); setMediaError("");
    const generation = playbackGeneration.current;
    const itemId = ref.current?.currentItem?.id;
    const stillCurrent = () => mounted.current && generation === playbackGeneration.current && ref.current?.currentItem?.id === itemId && !ref.current.pause;
    if (!cue.path && cue.fallback === "speech_access" && !cue.required) {
      if (!globalThis.speechSynthesis) { setSpeaking(false); return true; }
      return new Promise(resolve => {
        const utterance = new SpeechSynthesisUtterance(cue.text); utterance.lang = "en-US"; utterance.rate = .85;
        let settled = false, finishing = false;
        const finish = value => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } };
        const unavailable = async () => {
          if (settled || finishing) return;
          finishing = true; clearTimeout(timer);
          if (stillCurrent()) { const next = { ...(ref.current.currentAudioDelivery || {}), [cue.role]: "access_unavailable" }; setDelivery(next); setSpeaking(false); await save({ ...ref.current, currentAudioDelivery: next }); }
          finish(stillCurrent());
        };
        const timer = setTimeout(() => { if (stillCurrent()) globalThis.speechSynthesis.cancel(); void unavailable(); }, 15000);
        utterance.onend = async () => {
          if (settled || finishing) return;
          finishing = true; clearTimeout(timer);
          if (!stillCurrent()) { finish(false); return; }
          const next = { ...(ref.current.currentAudioDelivery || {}), [cue.role]: "browser_access" }; setDelivery(next); setSpeaking(false);
          finish(Boolean(await save({ ...ref.current, currentAudioDelivery: next })));
        };
        utterance.onerror = unavailable;
        globalThis.speechSynthesis.cancel(); globalThis.speechSynthesis.speak(utterance);
      });
    }
    return new Promise(resolve => {
      const audio = new Audio(cue.path); audioRef.current = audio;
      let timer, settled = false, finishing = false;
      const finish = value => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } };
      audio.onpause = () => { if (!audio.ended) finish(false); };
      audio.onended = async () => {
        if (settled || finishing) return;
        finishing = true; clearTimeout(timer);
        if (!stillCurrent()) { finish(false); return; }
        const next = { ...(ref.current.currentAudioDelivery || {}), [cue.role]: "completed" }; setDelivery(next); setSpeaking(false);
        finish(Boolean(await save({ ...ref.current, currentAudioDelivery: next, currentMediaError: "" })));
      };
      const fail = async failure => {
        if (settled || finishing) return;
        finishing = true;
        if (!stillCurrent()) { finish(false); return; }
        clearTimeout(timer);
        const blocked = failure?.name === "NotAllowedError";
        if (!cue.required && !blocked) {
          const next = { ...(ref.current.currentAudioDelivery || {}), [cue.role]: "access_unavailable" };
          setDelivery(next); setSpeaking(false); audio.onerror = null; audio.onpause = null; audio.pause();
          await save({ ...ref.current, currentAudioDelivery: next });
          finish(cue.fallback === "speech_access" ? await play({ ...cue, path: undefined }) : true); return;
        }
        const next = { ...(ref.current.currentAudioDelivery || {}), [cue.role]: blocked ? "autoplay_blocked" : "failed" };
        setDelivery(next); setSpeaking(false); if (!blocked) setMediaError(cue.path);
        audio.onerror = null; audio.onpause = null; audio.pause();
        await save({ ...ref.current, currentAudioDelivery: next, currentMediaError: blocked ? "" : cue.path }); finish(false);
      };
      const waitForData = () => { clearTimeout(timer); timer = setTimeout(() => void fail(new Error("Recording delivery stalled")), 12000); };
      audio.onplaying = () => clearTimeout(timer);
      audio.onwaiting = waitForData;
      waitForData();
      audio.onerror = fail; audio.play().catch(fail);
    });
  }
  async function playSequence() {
    const itemId = ref.current?.currentItem?.id;
    for (const cue of audioCues(ref.current?.currentItem)) {
      if (ref.current?.pause || ref.current?.currentItem?.id !== itemId || !await play(cue)) break;
    }
  }
  function speakWarmup() {
    if (ref.current?.status !== "warmup") return;
    clearTimeout(warmupTimer.current); globalThis.speechSynthesis?.cancel();
    const generation = ++playbackGeneration.current, index = ref.current.warmupIndex;
    const current = () => mounted.current && playbackGeneration.current === generation && ref.current?.status === "warmup" && ref.current.warmupIndex === index;
    warmupAccess.current = "access_unavailable";
    if (!globalThis.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(index === 0 ? "Let's practise the buttons. Tap the circle." : "Tap the square. Then your check begins."); utterance.lang = "en-US"; utterance.rate = .85;
    setSpeaking(true);
    utterance.onend = () => { clearTimeout(timer); if (current()) { warmupAccess.current = "browser_access"; setSpeaking(false); } };
    utterance.onerror = () => { clearTimeout(timer); if (current()) setSpeaking(false); };
    const timer = setTimeout(() => { if (current()) { globalThis.speechSynthesis.cancel(); setSpeaking(false); } }, 15000);
    warmupTimer.current = timer;
    globalThis.speechSynthesis.speak(utterance);
  }
  useEffect(() => {
    if (run?.status !== "warmup" || busy || error) return;
    const key = `${run.attemptId}:${run.warmupIndex}:${run.warmupRecords.length}`;
    if (warmupAttempt.current !== key) { warmupAttempt.current = key; speakWarmup(); }
  // Warmup access is an unscored interface cue, recorded with the button response.
  }, [run?.status, run?.warmupIndex, run?.warmupRecords?.length, run?.attemptId, busy, error]);
  useEffect(() => () => { clearTimeout(warmupTimer.current); }, [ownerKey]);
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
  async function start() {
    try {
      const next = createProgressTestRun({ bank, studentId, studentName, teacherId, classId, assignmentId, planKind, trackId, previousAttempts: historyRef.current, knownExposures: exposureRef.current, startingTier: startingTier === "automatic" ? undefined : Number(startingTier), startingReason });
      await save(next);
    } catch (failure) { setError(failure.message); }
  }
  const item = run?.currentItem;
  const cues = audioCues(item);
  const requiredReady = cues.filter(cue => cue.required).every(cue => delivery[cue.role] === "completed") && imageReady && !mediaError;
  async function respond(selected, responseStatus = "answered") {
    if (busy || !item) return;
    playbackGeneration.current++; globalThis.speechSynthesis?.cancel(); audioRef.current?.pause(); setSpeaking(false);
    await save(commitProgressResponse(ref.current, { itemId: item.id, selected, responseStatus, mediaReady: requiredReady, supportUsed, audioDelivery: delivery, responseTimeMs: itemForeground.current, failedSource: mediaError }));
  }
  async function pause(value) { playbackGeneration.current++; globalThis.speechSynthesis?.cancel(); audioRef.current?.pause(); setSpeaking(false); await save({ ...ref.current, pause: value, pauseEvents: [...(ref.current.pauseEvents || []), { kind: value ? "pause" : "resume", at: new Date().toISOString() }] }); }
  if (loading) return <main className="progress-check"><h1>Getting your check ready…</h1></main>;
  if (!run) return <main className="progress-check"><h1>Progress check</h1><p>Choose a broad profile or look closely at one strand. The questions adapt after each independent answer.</p><div className="progress-plan">
    <label>Check plan<select value={planKind} onChange={event => setPlanKind(event.target.value)}><option value="broad_profile">Broad profile · six strands</option><option value="focused">Focused check · one strand</option></select></label>
    {planKind === "focused" && <label>Strand<select value={trackId} onChange={event => setTrackId(event.target.value)}>{PROGRESS_TEST_TRACKS.map(track => <option key={track.id} value={track.id}>{track.label}</option>)}</select></label>}
    <label>Starting questions<select value={startingTier} onChange={event => setStartingTier(event.target.value)}><option value="automatic">Recent comparable check, otherwise middle tier</option><option value="0">First tier</option><option value="1">Middle tier</option><option value="2">Third tier</option></select></label>
    {startingTier !== "automatic" && <label>Reason for this starting point<input value={startingReason} onChange={event => setStartingReason(event.target.value)} /></label>}
    <p>Approved recordings may have been heard before. Known exposure is excluded; unknown familiarity limits interpretation. Results describe this sample and do not change placement or skill mastery.</p><p>{planKind === "focused" ? "10–16 independent answers, up to 24 presentations." : "At least four answers per strand, up to 36 independent answers and 48 presentations."} Children can take breaks.</p>
    <button type="button" onClick={start} disabled={!bank || busy || (startingTier !== "automatic" && !startingReason.trim())}>Prepare check</button><button type="button" onClick={onExit}>Back to checks</button></div>{error && <p role="alert">{error}</p>}</main>;
  if (["completed", "partial"].includes(run.status)) return <main className="progress-check"><h1>{run.status === "completed" ? "All done" : "Check saved"}</h1><p>Thank you for thinking carefully. Your teacher can see what you tried.</p>{error && <p role="alert">{error}</p>}<button type="button" disabled={busy} onClick={() => save(ref.current)}>Save again</button>{!token && <><ProgressCheckReportsPanel records={[progressAttemptFromRun(run)]}/><button type="button" onClick={() => { historyRef.current.push(progressAttemptFromRun(run)); clearProgressRunLocal(run); setCurrent(null); }}>Prepare another check</button><button type="button" onClick={onExit}>Back to checks</button></>}</main>;
  if (run.status === "warmup") return <main className="progress-check"><h1>Let’s practise the buttons</h1><p>{run.warmupIndex === 0 ? "Tap the circle." : "Tap the square. Then your check begins."}</p><button type="button" disabled={busy || speaking} onClick={speakWarmup}>🔊 Hear what to do</button><div className="progress-answers">{["circle", "square"].map(shape => <button type="button" key={shape} aria-label={shape} disabled={busy} onClick={async () => {
    const correct = shape === (run.warmupIndex === 0 ? "circle" : "square");
    const next = { ...ref.current, warmupRecords: [...ref.current.warmupRecords, { item: run.warmupIndex, selected: shape, correct, at: new Date().toISOString(), scored: false, instructionDelivery: warmupAccess.current }], warmupIndex: run.warmupIndex + (correct ? 1 : 0) };
    await save(next.warmupIndex === 2 ? beginProgressTest(next) : next);
  }}>{shape === "circle" ? "●" : "■"}</button>)}</div><p>Choose once. We save your answer, then show the next question. You can listen again, say “I’m not sure,” or take a break.</p>{error && <p role="alert">{error}</p>}</main>;
  return <main className="progress-check"><header><div><p>Progress check</p><h1>{PROGRESS_TEST_TRACKS.find(track => track.id === (item || run.receipt?.item)?.trackId)?.label || "Progress check"}</h1><span>{run.responses.length} questions tried</span></div><button type="button" disabled={busy} onClick={() => pause(!run.pause)}>{run.pause ? "Resume" : "Take a break"}</button></header>
    {error && <div role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={() => save(ref.current)}>Retry saving</button></div>}
    {run.pause ? <section className="progress-card"><h2>Take your time</h2><p>Your place is saved.</p><button type="button" disabled={busy} onClick={() => pause(false)}>Carry on</button>{!token && <button type="button" disabled={busy} onClick={() => save(finishProgressTest(ref.current))}>Save partial check</button>}</section> : run.receipt ? <section className="progress-card progress-receipt" role="status"><span aria-hidden="true">✓</span><h2>Answer saved</h2><p>The next question is coming.</p></section> : item ? <section className="progress-card"><h2>{item.prompt}</h2>
      {cues.length > 0 && <button type="button" className="progress-listen" disabled={busy || speaking} onClick={playSequence}>🔊 Listen again</button>}
      {cues.filter(cue => !cue.role.startsWith("choices")).map(cue => <button type="button" className="progress-listen" key={cue.role} disabled={busy || speaking} onClick={() => play(cue)}>🔊 {cue.role === "passage" ? "Hear the story" : cue.role === "target" ? "Hear the word" : cue.role.startsWith("choices") ? `Hear choice ${Number(cue.role.split(":")[1]) + 1}` : "Hear the question"}{delivery[cue.role] === "completed" ? " ✓" : ""}</button>)}
      {item.image && <img src={item.image} alt={item.imageAlt || ""} onLoad={() => setImageReady(true)} onError={() => { setImageReady(false); setMediaError(item.image); }} />}
      {item.passage && item.modality === "print" && <p className="progress-passage">{item.passage}</p>}
      {item.targetWord && item.modality === "print" && <p className="progress-target">{item.targetWord}</p>}
      {mediaError && <div role="alert"><p>This recording or picture could not load. It will not count as a wrong answer.</p><button type="button" disabled={busy} onClick={() => respond(null, "media_failed")}>Try a different question</button></div>}
      {!requiredReady && !mediaError && <p>Listen to the word, story and spoken choices before choosing.</p>}
      <div className="progress-answers">{item.choices.map((choice, index) => <div className="progress-answer" key={choice.id}>{cues.find(cue => cue.role === `choices:${index}`) && <button className="progress-choice-listen" type="button" disabled={busy || speaking} onClick={() => play(cues.find(cue => cue.role === `choices:${index}`))}>🔊 Hear answer {index + 1}</button>}<button className="progress-choose" type="button" disabled={busy || speaking || !requiredReady || Boolean(error)} onClick={() => respond(choice.id)}>{item.hideWrittenLabels ? <><span aria-hidden="true">{index + 1}</span><span className="sr-only">Choose answer {index + 1}</span></> : choice.label}</button></div>)}</div>
      <div className="progress-secondary"><button type="button" disabled={busy} onClick={() => respond(null, "skipped")}>I’m not sure</button><button type="button" disabled={busy || supportUsed} onClick={() => { setSupportUsed(true); void save({ ...ref.current, currentSupportUsed: true }); }}>I need help</button>{supportUsed && <p>Ask your teacher. This question will be recorded as supported.</p>}</div>
    </section> : null}
  </main>;
}
