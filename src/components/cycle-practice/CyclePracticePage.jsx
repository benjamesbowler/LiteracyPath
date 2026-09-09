import { useEffect, useMemo, useRef, useState } from "react";

import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { saveStudentFocusCyclePracticeAttempt } from "../../data/studentFocusSessionCore.js";
import { resolveCyclePracticeAudio, getCyclePracticeFeedbackAudio, getCyclePracticeWordAudio } from "./cyclePracticeAudio.js";
import { CycleActivityRenderer, CycleIcon } from "./CycleActivityRenderer.jsx";
import { SpeakerIcon } from "../elQuest/AdventureRoundFrame.jsx";
import { playCueAudio, playCueSequence, preloadCueAudio, stopCueAudio, retainCueAudioSources } from "../../utils/audio/cuePlayer.js";
import { triggerTactileFeedback } from "../../utils/tactileFeedback.js";

import "../../styles/cycle-practice.css";

import { CYCLE_ACTIVITY_REVISION, CYCLE_PRACTICE_MINIMUM_SECONDS, CYCLE_PRACTICE_VERSION, CYCLE_PRACTICE_POLICY_VERSION, cycleQuestionRecord, summarizeCycleRecords, requiresCycleAudio } from "../../policy/cyclePracticePolicy.js";
import { cyclePracticeReadiness } from "./cyclePracticeContent.js";
import { restoreCyclePracticeSession } from "./cyclePracticeRecovery.js";
import { buildCyclePlan, createCycleClock, cycleStorageKey, readCycleState, writeCycleState } from "./cyclePracticeState.js";

function createAttemptId() {
  return globalThis.crypto?.randomUUID?.() || `cycle-practice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cycleFromId(cycleId) {
  return elSkillsBlockCycles.find(cycle => cycle.id === cycleId && Number.isInteger(cycle.cycleNumber)) || null;
}

function buildCyclePracticePlan(cycle, seed) { return buildCyclePlan(cycle, seed).rounds; }

function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function roundAudio(round) { return resolveCyclePracticeAudio(round); }
function roundAudioSources(round, includeObjectAudio = true) {
  const resolved = roundAudio(round);
  return [...new Set([...(resolved.sequence || []), ...(includeObjectAudio ? resolved.choiceAudio || [] : [])].filter(Boolean))];
}
function playbackAudioSequence(round) { return roundAudio(round).sequence || []; }

// eslint-disable-next-line react-refresh/only-export-components
export function preloadCyclePracticeAudio({ cycleId = "cycle-1", progressScopeKey = "default" } = {}) {
  const cycle = cycleFromId(cycleId);
  const plan = buildCyclePracticePlan(cycle, `${progressScopeKey}:preview`);
  const currentRound = plan[0];
  if (!currentRound) return Promise.resolve(false);

  const windowRounds = plan.slice(0, 3);
  const currentSources = [...new Set(
    roundAudioSources(currentRound, false)
  )];
  const deferredSources = [...new Set(
    windowRounds
      .flatMap(round => roundAudioSources(round))
      .filter(src => !currentSources.includes(src))
  )];

  return Promise.allSettled(currentSources.map(src => preloadCueAudio(src))).then(() => {
    deferredSources.forEach(src => { void preloadCueAudio(src); });
    return true;
  });
}

function CyclePracticeSession({
  studentName = "Reader",
  progressScopeKey = "default",
  assignedCycleId = "cycle-1",
  focusSession = null,
  focusToken = "",
  client = null,
  reducedMotion = false,
  onContentAvailabilityChange = null,
  onExit = null,
  headerActions = null
}) {
  const cycleId = focusSession?.resolved_config?.cycle_id || assignedCycleId;
  const cycle = useMemo(() => cycleFromId(cycleId), [cycleId]);
  const seed = `${progressScopeKey}:${focusSession?.id || "preview"}`;
  const storageKey = cycleStorageKey(progressScopeKey, focusSession?.id, cycleId);
  const [state, setState] = useState(() => {
    const initial = restoreCyclePracticeSession(readCycleState(storageKey), {
    mode: "practice", practiceIndex: 0, pass: 0, assessmentIndex: 0,
    assessmentRecords: [], practiceRecords: [], attempts: 0, pendingAttempt: null,
    result: null, paused: false, earnedCount: 0, startedAt: new Date().toISOString()
    });
    initial.attemptId ||= initial.pendingAttempt?.attemptId || createAttemptId();
    initial.storageUnavailable = !writeCycleState(storageKey, initial);
    return initial;
  });
  const stateRef = useRef(state);
  const clockRef = useRef(null);
  if (!clockRef.current) {
    clockRef.current = createCycleClock();
    clockRef.current.restore(state.clock);
  }
  const [clockDisplay, setClockDisplay] = useState({ ...clockRef.current.values });
  const elapsedSeconds = clockDisplay.activePracticeSeconds;
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("ready");
  const [feedbackRound, setFeedbackRound] = useState(null);
  const [feedbackKey, setFeedbackKey] = useState("");
  const [entered, setEntered] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [subtarget, setSubtarget] = useState(null);
  const [answerPending, setAnswerPending] = useState(false);
  const [audioStatus, setAudioStatus] = useState("ready");
  const [message, setMessage] = useState(state.pendingAttempt ? "Your check is ready to save. Choose Retry save." : "");
  const [storageFailed, setStorageFailed] = useState(Boolean(state.storageUnavailable));
  const commitGuard = useRef(false);
  const saveGuard = useRef(false);
  const advanceTimer = useRef(null);
  const audioEpoch = useRef(0);
  const audioDelivery = useRef("pending");
  const audioDeliveryOwner = useRef("");
  const feedbackResume = useRef(null);
  const { mode, practiceIndex, assessmentIndex, attempts, result, paused } = state;
  const practice = useMemo(() => buildCyclePlan(cycle, seed, state.pass), [cycle, seed, state.pass]);
  const check = useMemo(() => buildCyclePlan(cycle, `${seed}:assessment`, 0, true), [cycle, seed]);
  const practicePlan = practice.rounds;
  const assessmentPlan = check.rounds;
  const locked = Boolean(focusSession?.id);
  const currentRound = mode === "assessment" ? assessmentPlan[assessmentIndex] : practicePlan[practiceIndex];
  const totalRounds = mode === "assessment" ? assessmentPlan.length : practicePlan.length;
  const currentRoundNumber = (mode === "assessment" ? assessmentIndex : practiceIndex) + 1;
  const roundKey = `${mode}:${state.pass}:${currentRound?.id}:${attempts}`;
  const roundRunKey = `${mode}:${state.pass}:${currentRound?.id}`;
  const currentObject = currentRound?.objects?.length
    ? (subtarget?.roundRunKey === roundRunKey ? subtarget.object : currentRound.objects[0])
    : null;
  const teachingRound = currentObject
    ? { ...currentRound, ...currentObject, targetWord: currentObject.word }
    : currentRound;
  const teachingOwner = `${roundKey}:target:${teachingRound?.targetWord || ""}:audio:${teachingRound?.audio || ""}`;
  const teachingReady = audioStatus === "ready" && audioDelivery.current === "delivered"
    && audioDeliveryOwner.current === teachingOwner;

  function invalidateTeaching() {
    audioEpoch.current += 1;
    audioDeliveryOwner.current = "";
    audioDelivery.current = "pending";
  }

  function persist(next) {
    const snapshot = { ...next, clock: { ...clockRef.current.values } };
    const saved = writeCycleState(storageKey, snapshot);
    setStorageFailed(!saved);
    return snapshot;
  }
  function update(patch) {
    if (["mode", "practiceIndex", "assessmentIndex", "pass", "attempts"].some(key =>
      Object.hasOwn(patch, key) && patch[key] !== stateRef.current[key])) invalidateTeaching();
    const next = persist({ ...stateRef.current, ...patch });
    stateRef.current = next;
    setState(next);
  }
  function activity() {
    clockRef.current.tick(performance.now(), stateRef.current.mode, document.visibilityState !== "hidden", stateRef.current.paused);
    clockRef.current.input(performance.now(), stateRef.current.mode, document.visibilityState !== "hidden", stateRef.current.paused);
    setClockDisplay({ ...clockRef.current.values });
  }
  useEffect(() => {
    const tick = () => {
      const current = stateRef.current;
      clockRef.current.tick(performance.now(), current.pendingAttempt || current.result ? "finished" : current.mode, document.visibilityState !== "hidden", current.paused);
      setClockDisplay({ ...clockRef.current.values });
    };
    const visibility = () => {
      tick(); clockRef.current.resetInput();
      if (document.visibilityState === "hidden") {
        clearTimeout(advanceTimer.current); invalidateTeaching(); stopCueAudio();
        // A final answer is frozen before its feedback finishes. Its save still
        // needs the retained continuation when the child returns to this tab.
        if (!stateRef.current.result && (!stateRef.current.pendingAttempt || feedbackResume.current)) update({ paused: true });
      }
    };
    const timer = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", visibility);
    const save = () => writeCycleState(storageKey, { ...stateRef.current, clock: { ...clockRef.current.values } });
    window.addEventListener("pagehide", save);
    return () => {
      tick(); save(); clearInterval(timer); clearTimeout(advanceTimer.current);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", save);
      audioEpoch.current += 1; stopCueAudio();
    };
    // These long-lived listeners read mutable session values through stateRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  useEffect(() => {
    if (!storageFailed) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [storageFailed]);
  useEffect(() => {
    onContentAvailabilityChange?.(Boolean(cycle && practicePlan.length && assessmentPlan.length && !practice.unavailable.length && !check.unavailable.length));
  }, [cycle, practicePlan.length, assessmentPlan.length, practice.unavailable.length, check.unavailable.length, onContentAvailabilityChange]);

  function playRoundAudio(includeContent = false, callbacks = {}, targetsOnly = false) {
    if (!currentRound || paused || !entered || document.visibilityState === "hidden") return;
    const epoch = ++audioEpoch.current;
    const owner = teachingOwner;
    audioDeliveryOwner.current = owner;
    audioDelivery.current = "pending";
    stopCueAudio();
    const resolved = roundAudio(teachingRound);
    const sequence = targetsOnly ? (resolved.targetAudio.length ? resolved.targetAudio : [resolved.contentAudio].filter(Boolean)) : playbackAudioSequence(teachingRound, includeContent);
    if (mode === "assessment" && assessmentIndex === 0 && !targetsOnly) sequence.unshift(getCyclePracticeFeedbackAudio("readyForCheck"));
    if (mode === "practice" && attempts >= 2 && currentRound.mechanicId === "pictureSound" && currentRound.audio) sequence.push(currentRound.audio);
    let terminal = false;
    const fail = () => {
      if (epoch !== audioEpoch.current || owner !== audioDeliveryOwner.current || terminal) return;
      terminal = true; audioDelivery.current = "unavailable"; setAudioStatus("unavailable"); callbacks.onUnavailable?.();
    };
    // A missing authored target cannot be substituted by a delivered instruction.
    if (!resolved.instructionAudio || (currentRound.contextText && !resolved.contentAudio) || !sequence.length || (requiresCycleAudio(currentRound) && !resolved.targetAudio.length && !resolved.contentAudio && currentRound.variant !== "wordParts")) { fail(); return; }
    audioDelivery.current = "pending";
    setAudioStatus("playing");
    playCueSequence(sequence, {
      gapMs: 40, playImmediately: callbacks.playImmediately,
      onStarted: event => { if (epoch === audioEpoch.current && owner === audioDeliveryOwner.current) callbacks.onStarted?.(event); },
      onDelivery: event => {
        if (epoch !== audioEpoch.current || owner !== audioDeliveryOwner.current || terminal) return;
        callbacks.onDelivery?.(event);
        if (event.type === "completed") {
          terminal = true; audioDelivery.current = "delivered"; setAudioStatus("ready"); callbacks.onEnded?.(event);
        } else if (event.type === "interrupted") {
          terminal = true; audioDelivery.current = "interrupted"; setAudioStatus("unavailable"); callbacks.onInterrupted?.(event);
        } else if (["failed", "unavailable"].includes(event.type)) fail();
      }, onUnavailable: fail
    });
  }
  useEffect(() => {
    if (!currentRound || result || state.pendingAttempt || paused || answerPending || !entered) return undefined;
    const plan = mode === "assessment" ? assessmentPlan : practicePlan;
    const index = mode === "assessment" ? assessmentIndex : practiceIndex;
    const sources = [...new Set(plan.slice(index, index + 3).flatMap(r => roundAudioSources(r)))];
    const release = retainCueAudioSources(sources);
    const essentials = [...new Set(roundAudioSources(currentRound, false))];
    let cancelled = false;
    Promise.allSettled(essentials.map(src => preloadCueAudio(src))).then(() => {
      if (!cancelled) sources.filter(src => !essentials.includes(src)).forEach(src => { void preloadCueAudio(src); });
    });
    audioDelivery.current = "pending";
    audioDeliveryOwner.current = "";
    const startTimer = setTimeout(() => playRoundAudio(mode === "practice"), 0);
    return () => { cancelled = true; clearTimeout(startTimer); invalidateTeaching(); stopCueAudio(); release(); };
    // roundKey includes retries so every callback belongs to one mounted mechanic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachingOwner, paused, answerPending, entered, Boolean(result), Boolean(state.pendingAttempt)]);

  useEffect(() => {
    if (!result) return undefined;
    const timer = setTimeout(() => playCueAudio(getCyclePracticeFeedbackAudio(result.savedToTeacher ? "saved" : "complete")), 0);
    return () => { clearTimeout(timer); stopCueAudio(); };
  }, [result]);

  function replayInstruction(includeContent = false, callbacks = {}) {
    playRoundAudio(includeContent, { ...callbacks, playImmediately: true });
  }
  function playObjectAudio(word) {
    const path = getCyclePracticeWordAudio(word);
    if (path) playCueAudio(path, { playImmediately: true });
  }
  function resetFeedback() {
    setFeedback(""); setFeedbackTone("ready"); setFeedbackRound(null); setFeedbackKey("");
  }
  function playFeedbackThen(key, round, done, selectedAudio = "") {
    const sequence = [getCyclePracticeFeedbackAudio(key), selectedAudio, key === "correct" ? round.audio : ""].filter(Boolean);
    feedbackResume.current = done;
    let finished = false;
    let epoch;
    const complete = () => {
      if (finished || epoch !== audioEpoch.current) return;
      finished = true;
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => { feedbackResume.current = null; done(); }, 300);
    };
    // Wait for React's instruction cleanup before starting the feedback voice.
    advanceTimer.current = setTimeout(() => {
      epoch = ++audioEpoch.current;
      if (!sequence.length) { advanceTimer.current = setTimeout(() => { feedbackResume.current = null; done(); }, 900); return; }
      advanceTimer.current = setTimeout(complete, 7000);
      playCueSequence(sequence, {
        gapMs: 100,
        onDelivery: event => { if (["completed", "failed", "unavailable"].includes(event.type)) complete(); },
        onUnavailable: complete,
      });
    }, 0);
  }
  function handleOutcome(outcome = {}) {
    if (commitGuard.current || answerPending || !currentRound || result || paused || !entered
      || stateRef.current.pendingAttempt || mediaFailed || document.visibilityState === "hidden"
      || audioStatus !== "ready" || audioDelivery.current !== "delivered"
      || audioDeliveryOwner.current !== teachingOwner) return false;
    if (currentObject && (outcome.object?.word !== currentObject.word || outcome.object?.audio !== currentObject.audio)) return false;
    commitGuard.current = true;
    activity();
    const current = stateRef.current;
    const responseRound = currentObject ? { ...currentRound, ...currentObject, id: `${currentRound.id}:object:${currentObject.word}`, targetWord: currentObject.word, itemKey: currentObject.word } : currentRound;
    const record = cycleQuestionRecord(responseRound, { ...outcome, evidence: {
      ...outcome.evidence, practicePass: current.pass, activityRevision: CYCLE_ACTIVITY_REVISION,
      activityCompleted: Boolean(outcome.correct && !outcome.partial)
    } }, { mode, attempts: current.attempts, audioDelivery: audioDelivery.current });
    invalidateTeaching();
    stopCueAudio();
    setAnswerPending(true);
    setFeedbackRound(currentRound); setFeedbackKey(roundKey);
    setFeedbackTone(outcome.correct ? "correct" : "incorrect");
    setFeedback(outcome.correct ? "That's right!" : mode === "assessment" ? "Not quite" : "Try again");
    const selectedChoice = currentRound.choices?.find(choice => String(choice.value) === String(outcome.selected));
    const release = () => { resetFeedback(); setAnswerPending(false); commitGuard.current = false; };
    if (outcome.partial) {
      if (mode === "assessment") update({ assessmentRecords: [...current.assessmentRecords, record] });
      else update({ practiceRecords: [...current.practiceRecords, record], attempts: outcome.correct ? current.attempts : current.attempts + 1 });
      playFeedbackThen(outcome.correct ? "correct" : mode === "assessment" ? "notQuite" : "retry", { ...currentRound, audio: outcome.object?.audio || currentRound.audio }, release);
      return;
    }
    if (mode === "assessment") {
      const records = [...current.assessmentRecords, record];
      if (assessmentIndex + 1 >= assessmentPlan.length) {
        const attempt = freezeAttempt(records);
        update({ assessmentRecords: records, pendingAttempt: attempt });
        playFeedbackThen(outcome.correct ? "correct" : "notQuite", currentRound, () => { resetFeedback(); void saveAttempt(attempt); });
        return;
      }
      update({ assessmentRecords: records, assessmentIndex: assessmentIndex + 1 });
      playFeedbackThen(outcome.correct ? "correct" : "notQuite", currentRound, release);
      return;
    }
    const practiceRecords = [...current.practiceRecords, record];
    if (!outcome.correct) {
      update({ attempts: current.attempts + 1, practiceRecords });
      playFeedbackThen("retry", currentRound, release, selectedChoice?.audio);
      return;
    }
    const last = practiceIndex + 1 >= practicePlan.length;
    update({ practiceRecords, attempts: 0, earnedCount: (current.earnedCount || 0) + 1,
      practiceIndex: last ? 0 : practiceIndex + 1, pass: last ? current.pass + 1 : current.pass });
    playFeedbackThen((current.earnedCount || 0) % 6 === 5 ? "complete" : "correct", currentRound, () => {
      release();
      if (cyclePracticeReadiness(cycle, stateRef.current.practiceRecords, clockRef.current.values.activePracticeSeconds).ready && !practice.unavailable.length && !check.unavailable.length) startAssessment();
    });
  }
  function startAssessment() {
    if (!cyclePracticeReadiness(cycle, stateRef.current.practiceRecords, clockRef.current.values.activePracticeSeconds).ready || practice.unavailable.length || check.unavailable.length) return;
    clockRef.current.tick(performance.now(), "assessment", document.visibilityState !== "hidden", false);
    clockRef.current.resetInput();
    resetFeedback(); setMessage("");
    update({ mode: "assessment", assessmentIndex: 0, assessmentRecords: [], attempts: 0, frozenPracticeSeconds: clockRef.current.values.activePracticeSeconds });
  }
  function freezeAttempt(records) {
    clockRef.current.tick(performance.now(), "finished", document.visibilityState !== "hidden", paused);
    const clock = clockRef.current.values;
    const practiceAreas = new Map();
    for (const record of stateRef.current.practiceRecords) practiceAreas.set(record.construct, (practiceAreas.get(record.construct) || 0) + 1);
    return {
      attemptId: stateRef.current.attemptId, assessmentType: "cycle_practice_check", cycleId: cycle.id, cycleNumber: cycle.cycleNumber,
      practiceSeconds: Math.floor(stateRef.current.frozenPracticeSeconds ?? clock.activePracticeSeconds),
      sessionElapsedSeconds: Math.floor(clock.sessionElapsedSeconds), checkSeconds: Math.floor(clock.checkSeconds),
      ...summarizeCycleRecords(records), questionRecords: records,
      practiceManifest: [...practiceAreas].map(([construct, responses]) => ({ construct, responses })),
      checkManifest: records.map(({ questionId, construct, responseStatus }) => ({ questionId, construct, responseStatus })),
      assessmentVersion: CYCLE_PRACTICE_VERSION, contentVersion: CYCLE_PRACTICE_VERSION, policyVersion: CYCLE_PRACTICE_POLICY_VERSION,
      startedAt: stateRef.current.startedAt, completedAt: new Date().toISOString()
    };
  }
  async function saveAttempt(attempt = stateRef.current.pendingAttempt) {
    if (!attempt || saveGuard.current) return;
    saveGuard.current = true; setAnswerPending(true); setMessage("");
    try {
      let savedToTeacher = false;
      if (focusSession?.id) {
        if (!focusToken || !client) throw new Error("session_unavailable");
        const saved = await saveStudentFocusCyclePracticeAttempt({ client, token: focusToken, sessionId: focusSession.id, attempt });
        if (saved?.ok !== true) throw new Error(saved?.error || "save_failed");
        savedToTeacher = true;
      }
      update({ result: { ...attempt, savedToTeacher }, pendingAttempt: null });
    } catch {
      setMessage("Your answers are kept here. Retry save when your connection or sign-in is ready.");
    } finally { saveGuard.current = false; commitGuard.current = false; setAnswerPending(false); }
  }
  function togglePause() {
    clockRef.current.tick(performance.now(), stateRef.current.mode, document.visibilityState !== "hidden", stateRef.current.paused);
    clockRef.current.resetInput(); clearTimeout(advanceTimer.current); invalidateTeaching(); stopCueAudio();
    const resuming = stateRef.current.paused;
    if (!resuming) {
      // Keep both the displayed answer and its continuation while paused.
      // In particular, a final assessment answer must still save on resume.
      update({ paused: true });
      return;
    }
    const continueFeedback = feedbackResume.current;
    feedbackResume.current = null;
    resetFeedback(); setAnswerPending(false); commitGuard.current = false; update({ paused: false });
    continueFeedback?.();
  }

  if (!cycle || !practicePlan.length || !assessmentPlan.length) {
    return (
      <main className="cycle-practice-page cycle-practice-page--error" role="alert">
        <h1>Cycle Practice needs an update</h1>
        <p>Stay on this screen and ask your teacher for help.</p>
      </main>
    );
  }

  if (result) {
    return (
      <main className="cycle-practice-page cycle-practice-page--complete">
        {headerActions}
        <section className="cycle-practice-complete-card" aria-labelledby="cycle-practice-complete-title">
          <img className="cycle-complete-guide" src="/images/companions/pip.webp" alt="Pip celebrates your work" />
          <div className="cycle-complete-stars" aria-hidden="true">{[0, 1, 2].map(i => <CycleIcon name="star" key={i} />)}</div>
          <h1 id="cycle-practice-complete-title">All done!</h1>
          <p>{result.savedToTeacher ? "Your work is saved." : "Great practice!"}</p>
          {locked ? <p>Time for your teacher.</p> : <button className="cycle-play-button" aria-label="Back to learning" onClick={onExit} type="button"><CycleIcon name="home" /></button>}
          {storageFailed && <p role="alert">Keep this page open.</p>}
        </section>
      </main>
    );
  }

  if (state.pendingAttempt && !feedbackRound) return (
    <main className="cycle-practice-page cycle-practice-page--complete">
      {headerActions}<section className="cycle-practice-complete-card">
        <img className="cycle-complete-guide" src="/images/companions/pip.webp" alt="Pip waits with your work" />
        <h1>{answerPending ? "Saving…" : "Let's save your work"}</h1>
        <p role="status">{answerPending ? "One moment." : "Your answers are kept here."}</p>
        <button type="button" className="cycle-play-button" aria-label="Retry save" disabled={answerPending} onClick={() => saveAttempt()}><CycleIcon name="retry" /></button>
        {storageFailed && <p role="alert">Keep this page open.</p>}
      </section>
    </main>
  );

  if (!currentRound) return (
    <main className="cycle-practice-page cycle-practice-page--error" role="alert">
      <h1>This saved activity is unavailable</h1>
      <p>Your recorded answers are retained. Ask your teacher to start another session.</p>
    </main>
  );

  const shownRound = feedbackRound || currentRound;
  const priorResponses = (mode === "assessment" ? state.assessmentRecords : state.practiceRecords).filter(record =>
    record.questionId?.startsWith(`${shownRound.id}:object:`)
    && (mode === "assessment" || record.evidence?.practicePass === state.pass));
  const currentAudio = roundAudio(shownRound);
  const earned = state.earnedCount || 0;
  const starsInSet = earned > 0 && earned % 6 === 0 && answerPending ? 6 : earned % 6;
  const frozen = answerPending || paused || !entered;
  const soundBlocked = audioStatus === "unavailable";
  const play = () => {
    setEntered(true);
    if (stateRef.current.paused) update({ paused: false });
    activity();
    // The first tap unlocks the same retained teaching-audio player on Safari.
    const sources = playbackAudioSequence(currentRound);
    if (sources.length) playCueAudio(sources[0], { playImmediately: true });
  };
  const hearChoice = (path, word) => {
    activity();
    const owner = audioDeliveryOwner.current;
    if (path) playCueAudio(path, { playImmediately: true, onUnavailable: () => {
      if (owner !== audioDeliveryOwner.current) return;
      setAudioStatus("unavailable"); audioDelivery.current = "unavailable";
    } });
    else if (word) playObjectAudio(word);
  };
  const traceRetry = () => {
    const path = getCyclePracticeFeedbackAudio("traceRetry");
    if (path) playCueAudio(path);
  };
  const selectSubtarget = object => {
    const authored = currentRound.objects?.find(item => item.word === object?.word && item.audio === object?.audio);
    if (!authored || (currentObject?.word === authored.word && currentObject?.audio === authored.audio)) return;
    if (answerPending) {
      // The next object may be selected while its predecessor's feedback is
      // still speaking. Clear teaching proof without cancelling that feedback.
      audioDeliveryOwner.current = "";
      audioDelivery.current = "pending";
    } else {
      invalidateTeaching();
      stopCueAudio();
    }
    setSubtarget({ roundRunKey, object: authored });
  };

  return (
    <main className="cycle-practice-page" data-cycle-id={cycle.id} data-motion={reducedMotion ? "reduced" : "full"}
      onKeyDownCapture={activity} onPointerDownCapture={activity}>
      <header className="cycle-practice-topbar">
        <div className="cycle-practice-topbar__identity">
          <span className="cycle-brand-mark" aria-hidden="true"><CycleIcon name="star" /></span>
          <div><h1 data-child-title="">Cycle Practice</h1><span>Cycle {cycle.cycleNumber} · {studentName}</span></div>
        </div>
        <div className="cycle-practice-topbar__round" data-child-progress="" aria-label={`${mode === "assessment" ? "Cycle Check" : "Practice"}, activity ${currentRoundNumber} of ${totalRounds}`}>
          <div className="cycle-star-trail" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <CycleIcon key={i} name="star" className={i < starsInSet ? "is-earned" : ""} />)}</div>
          <strong>{mode === "assessment" ? `Cycle Check · ${currentRoundNumber} / ${totalRounds}` : `${earned} activities · ${Math.floor(earned / 6)} star trails`}</strong>
        </div>
        <div className="cycle-practice-topbar__actions">
          {headerActions}
          <button type="button" className="cycle-icon-button" aria-label={paused ? "Resume practice" : "Pause practice"} disabled={!entered} onClick={togglePause}><CycleIcon name={paused ? "play" : "pause"} /></button>
          {!locked && <button type="button" className="cycle-icon-button" aria-label="Back to learning" onClick={onExit}><CycleIcon name="home" /></button>}
        </div>
      </header>
      <section className={`cycle-playground cycle-playground--${shownRound.mechanicId}`} data-mechanic-stage={shownRound.mechanicId} data-child-choices="" aria-label={shownRound.stationTitle} data-feedback={feedbackTone}>
        <div className="cycle-scenery" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="cycle-instruction-row">
          <div><span className="cycle-activity-name">{shownRound.stationTitle}</span><p data-child-instruction="">{currentAudio.instructionText}</p></div>
          <button type="button" className="cycle-listen-button" data-child-primary="" data-audio-action="replay" data-audio-state={audioStatus === "ready" && !teachingReady ? "pending" : audioStatus} aria-label="Hear what to do" disabled={frozen} onClick={() => { triggerTactileFeedback(16); replayInstruction(true); }}><SpeakerIcon /><span>Listen</span></button>
        </div>
        <div className="cycle-activity-space" inert={frozen || mediaFailed || !teachingReady ? true : undefined}>
          <CycleActivityRenderer key={shownRound.mechanicId === "soundSort" && shownRound.objects?.length ? `${mode}:${state.pass}:${shownRound.id}` : feedbackKey || roundKey} round={shownRound} disabled={frozen || mediaFailed || !teachingReady}
            supportLevel={mode === "assessment" ? 0 : attempts} reducedMotion={reducedMotion}
            onCommit={handleOutcome} onHear={hearChoice} onStep={() => triggerTactileFeedback(10)}
            assessment={mode === "assessment"} feedbackPending={frozen} onSubtarget={selectSubtarget} priorResponses={priorResponses}
            onMediaFailure={() => setMediaFailed(true)} onInteraction={activity} onRetry={traceRetry} onSupport={activity} />
        </div>
        <div className={`cycle-feedback${feedback ? " is-visible" : ""}`} role="status" aria-live="polite">
          {feedback && <><CycleIcon name={feedbackTone === "correct" ? "tick" : "retry"} /><span>{feedback}</span>{feedbackTone === "correct" && <CycleIcon name="star" />}</>}
        </div>
        {entered && !paused && !answerPending && audioStatus === "playing" && <div className="cycle-audio-pulse" aria-hidden="true"><i /><i /><i /></div>}
        {(!entered || paused || soundBlocked || mediaFailed) && <div className="cycle-play-overlay">
          <div className="cycle-launch-card">
            <img src="/images/companions/pip.webp" alt="Pip, your Little Literacy Guide" />
            <h2>{!entered ? "Let's play!" : paused ? "Take a little break" : mediaFailed ? "Let's load the pictures" : "Tap to listen"}</h2>
            {!entered && <p>Listen. Look. Play.</p>}
            {paused && <p>{formatClock(elapsedSeconds)} of {formatClock(CYCLE_PRACTICE_MINIMUM_SECONDS)} active practice</p>}
            <button type="button" className="cycle-play-button" aria-label={!entered ? "Start playing" : paused ? "Resume practice" : mediaFailed ? "Reload pictures" : "Play instructions"}
              onClick={!entered ? play : paused ? togglePause : mediaFailed ? () => { setMediaFailed(false); update({ attempts: attempts + 1 }); } : () => replayInstruction(true)}><CycleIcon name={mediaFailed ? "retry" : "play"} /></button>
          </div>
        </div>}
      </section>
      {storageFailed && <p className="cycle-system-message" role="alert">Keep this page open. Recovery storage is unavailable.</p>}
      {(practice.unavailable.length > 0 || check.unavailable.length > 0) && <p className="cycle-system-message" role="alert">Some cycle activities could not load. Ask your teacher for help.</p>}
      {message && <p className="cycle-system-message" role="status">{message}</p>}
    </main>
  );
}

export function CyclePracticePage(props) {
  const cycleId = props.focusSession?.resolved_config?.cycle_id || props.assignedCycleId || "cycle-1";
  return <CyclePracticeSession key={cycleStorageKey(props.progressScopeKey || "default", props.focusSession?.id, cycleId)} {...props} />;
}
