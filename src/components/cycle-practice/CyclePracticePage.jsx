import { useEffect, useMemo, useRef, useState } from "react";

import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { getLedaWordAudioPath } from "../../data/ledaProductionAudio.js";
import { saveStudentFocusCyclePracticeAttempt } from "../../data/studentFocusSessionCore.js";
import { resolveAdventureRoundAudio } from "../elQuest/adventureRoundAudio.js";
import { AdventureMechanicRenderer } from "../elQuest/mechanics/AdventureMechanicRenderer.jsx";
import { AdventureRoundFrame, SpeakerIcon } from "../elQuest/AdventureRoundFrame.jsx";
import {
  correctionModelForOutcome,
  feedbackForCommittedOutcome
} from "../elQuest/adventureRunState.js";
import { playCueAudio, playCueSequence, preloadCueAudio, stopCueAudio, retainCueAudioSources } from "../../utils/audio/cuePlayer.js";
import { triggerTactileFeedback } from "../../utils/tactileFeedback.js";

import "../../styles/skills-block-quest.css";
import "../../styles/cycle-practice.css";

import { CYCLE_PRACTICE_MINIMUM_SECONDS, CYCLE_PRACTICE_VERSION, CYCLE_PRACTICE_POLICY_VERSION, cycleQuestionRecord, summarizeCycleRecords, requiresCycleAudio } from "../../policy/cyclePracticePolicy.js";
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

function roundAudio(round) {
  return resolveAdventureRoundAudio(round);
}

function roundAudioSources(round, includeContent = true, includeObjectAudio = true) {
  const resolved = roundAudio(round);
  const objectAudio = includeObjectAudio && round?.mechanicId === "sceneHunt"
    ? (round.objects || []).map(object => getLedaWordAudioPath(object.word))
    : [];
  return [
    resolved.instructionAudio,
    ...resolved.targetAudio,
    ...(includeContent && resolved.contentAudio ? [resolved.contentAudio] : []),
    ...objectAudio
  ].filter(Boolean);
}

const TARGET_FIRST_MECHANICS = new Set(["soundGate", "sceneHunt"]);

function playbackAudioSequence(round, includeContent = false) {
  const resolved = roundAudio(round);
  const target = resolved.targetAudio || [];
  const instruction = resolved.instructionAudio ? [resolved.instructionAudio] : [];
  const content = includeContent && resolved.contentAudio ? [resolved.contentAudio] : [];
  return [
    ...(TARGET_FIRST_MECHANICS.has(round?.mechanicId) ? target : []),
    ...instruction,
    ...(TARGET_FIRST_MECHANICS.has(round?.mechanicId) ? [] : target),
    ...content
  ].filter(Boolean);
}

// eslint-disable-next-line react-refresh/only-export-components
export function preloadCyclePracticeAudio({ cycleId = "cycle-1", progressScopeKey = "default" } = {}) {
  const cycle = cycleFromId(cycleId);
  const plan = buildCyclePracticePlan(cycle, `${progressScopeKey}:preview`);
  const currentRound = plan[0];
  if (!currentRound) return Promise.resolve(false);

  const windowRounds = plan.slice(0, 3);
  const currentSources = [...new Set(
    roundAudioSources(currentRound, true, false)
  )];
  const deferredSources = [...new Set(
    windowRounds
      .flatMap(round => roundAudioSources(round, true))
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
    const initial = readCycleState(storageKey) || {
    mode: "practice", practiceIndex: 0, pass: 0, assessmentIndex: 0,
    assessmentRecords: [], practiceRecords: [], attempts: 0, pendingAttempt: null,
    result: null, paused: false, startedAt: new Date().toISOString()
    };
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
  const [correctionModel, setCorrectionModel] = useState(null);
  const [answerPending, setAnswerPending] = useState(false);
  const [audioStatus, setAudioStatus] = useState("ready");
  const [message, setMessage] = useState(state.pendingAttempt ? "Your check is ready to save. Choose Retry save." : "");
  const [storageFailed, setStorageFailed] = useState(Boolean(state.storageUnavailable));
  const commitGuard = useRef(false);
  const saveGuard = useRef(false);
  const advanceTimer = useRef(null);
  const audioEpoch = useRef(0);
  const audioDelivery = useRef("pending");
  const { mode, practiceIndex, assessmentIndex, attempts, result, paused } = state;
  const practice = useMemo(() => buildCyclePlan(cycle, seed, state.pass), [cycle, seed, state.pass]);
  const check = useMemo(() => buildCyclePlan(cycle, `${seed}:assessment`, 0, true), [cycle, seed]);
  const practicePlan = practice.rounds;
  const assessmentPlan = check.rounds;
  const practiceStarted = elapsedSeconds >= CYCLE_PRACTICE_MINIMUM_SECONDS;
  const locked = Boolean(focusSession?.id);
  const currentRound = mode === "assessment" ? assessmentPlan[assessmentIndex] : practicePlan[practiceIndex];
  const totalRounds = mode === "assessment" ? assessmentPlan.length : practicePlan.length;
  const currentRoundNumber = (mode === "assessment" ? assessmentIndex : practiceIndex) + 1;
  const roundKey = `${mode}:${state.pass}:${currentRound?.id}:${attempts}`;

  function persist(next) {
    const snapshot = { ...next, clock: { ...clockRef.current.values } };
    const saved = writeCycleState(storageKey, snapshot);
    setStorageFailed(!saved);
    return snapshot;
  }
  function update(patch) {
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
    const visibility = () => { tick(); clockRef.current.resetInput(); stopCueAudio(); };
    const timer = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", visibility);
    const save = () => writeCycleState(storageKey, { ...stateRef.current, clock: { ...clockRef.current.values } });
    window.addEventListener("pagehide", save);
    return () => {
      tick(); save(); clearInterval(timer); clearTimeout(advanceTimer.current);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", save);
      audioEpoch.current += 1; stopCueAudio();
    };
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
    if (!currentRound || paused) return;
    stopCueAudio();
    const epoch = ++audioEpoch.current;
    const resolved = roundAudio(currentRound);
    const sequence = targetsOnly ? (resolved.targetAudio.length ? resolved.targetAudio : [resolved.contentAudio].filter(Boolean)) : playbackAudioSequence(currentRound, includeContent);
    let terminal = false;
    const fail = () => {
      if (epoch !== audioEpoch.current || terminal) return;
      terminal = true; audioDelivery.current = "unavailable"; setAudioStatus("unavailable"); callbacks.onUnavailable?.();
    };
    // A missing authored target cannot be substituted by a delivered instruction.
    if ((currentRound.mechanicId === "phraseFlow" && !includeContent && !targetsOnly) || !sequence.length || (requiresCycleAudio(currentRound) && !resolved.targetAudio.length && !resolved.contentAudio)) { fail(); return; }
    audioDelivery.current = "pending";
    setAudioStatus("playing");
    playCueSequence(sequence, {
      gapMs: 40, playImmediately: callbacks.playImmediately,
      onStarted: event => { if (epoch === audioEpoch.current) callbacks.onStarted?.(event); },
      onDelivery: event => {
        if (epoch !== audioEpoch.current || terminal) return;
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
    if (!currentRound || result || state.pendingAttempt || paused || answerPending) return undefined;
    const plan = mode === "assessment" ? assessmentPlan : practicePlan;
    const index = mode === "assessment" ? assessmentIndex : practiceIndex;
    const sources = [...new Set(plan.slice(index, index + 3).flatMap(r => roundAudioSources(r, mode === "practice")))];
    const release = retainCueAudioSources(sources);
    const essentials = [...new Set(roundAudioSources(currentRound, mode === "practice", false))];
    let cancelled = false;
    Promise.allSettled(essentials.map(src => preloadCueAudio(src))).then(() => {
      if (!cancelled) sources.filter(src => !essentials.includes(src)).forEach(src => { void preloadCueAudio(src); });
    });
    audioDelivery.current = "pending";
    const startTimer = setTimeout(() => playRoundAudio(mode === "practice"), 0);
    return () => { cancelled = true; clearTimeout(startTimer); stopCueAudio(); audioEpoch.current += 1; release(); };
    // roundKey includes retries so every callback belongs to one mounted mechanic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, paused, answerPending, Boolean(result), Boolean(state.pendingAttempt)]);

  function retryAutomaticAudioFromGesture() {
    if (audioStatus === "unavailable" && !answerPending) playRoundAudio(mode === "practice", { playImmediately: true });
  }
  function replayInstruction(includeContent = false, callbacks = {}) {
    playRoundAudio(includeContent, { ...callbacks, playImmediately: true });
  }
  function replayTarget() { playRoundAudio(false, { playImmediately: true }, true); }
  function playObjectAudio(word) {
    const path = getLedaWordAudioPath(word);
    if (path) playCueAudio(path, { playImmediately: true });
  }
  function resetFeedback() {
    setFeedback(""); setFeedbackTone("ready"); setCorrectionModel(null);
  }
  function handleOutcome(outcome = {}) {
    if (commitGuard.current || answerPending || !currentRound || result || paused || stateRef.current.pendingAttempt) return;
    commitGuard.current = true;
    activity();
    const current = stateRef.current;
    const record = cycleQuestionRecord(currentRound, outcome, { mode, attempts: current.attempts, audioDelivery: audioDelivery.current });
    stopCueAudio();
    if (mode === "assessment") {
      const records = [...current.assessmentRecords, record];
      // Unmount the mechanic in this event, before its correctness UI can paint.
      setAnswerPending(true); setFeedback("Response recorded."); setFeedbackTone("ready");
      if (assessmentIndex + 1 >= assessmentPlan.length) {
        const attempt = freezeAttempt(records);
        update({ assessmentRecords: records, pendingAttempt: attempt });
        void saveAttempt(attempt);
      } else {
        update({ assessmentRecords: records, assessmentIndex: assessmentIndex + 1 });
        advanceTimer.current = setTimeout(() => { resetFeedback(); setAnswerPending(false); commitGuard.current = false; }, 500);
      }
      return;
    }
    const nextAttempt = current.attempts + 1;
    const practiceRecords = [...current.practiceRecords, record];
    setFeedbackTone(outcome.correct ? "correct" : "incorrect");
    setFeedback(feedbackForCommittedOutcome(currentRound, outcome, nextAttempt));
    setCorrectionModel(!outcome.correct && nextAttempt >= 3 ? correctionModelForOutcome(currentRound, outcome) : null);
    if (!outcome.correct) {
      update({ attempts: nextAttempt, practiceRecords });
      commitGuard.current = false;
      return;
    }
    setAnswerPending(true);
    // Persist the next item immediately; refresh during feedback cannot repeat a commit.
    const last = practiceIndex + 1 >= practicePlan.length;
    update({ practiceRecords, attempts: 0, practiceIndex: last ? 0 : practiceIndex + 1, pass: last ? current.pass + 1 : current.pass });
    advanceTimer.current = setTimeout(() => { resetFeedback(); setAnswerPending(false); commitGuard.current = false; }, 650);
  }
  function startAssessment() {
    if (!practiceStarted || answerPending || practice.unavailable.length || check.unavailable.length) return;
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
    clockRef.current.tick(performance.now(), stateRef.current.mode, document.visibilityState !== "hidden", !stateRef.current.paused);
    clockRef.current.resetInput(); stopCueAudio(); update({ paused: !stateRef.current.paused });
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
          <p className="cycle-practice-kicker">Cycle Check complete</p>
          <h1 id="cycle-practice-complete-title">You showed what you know!</h1>
          <div className="cycle-practice-score" aria-label={`Score ${result.scorePercent} percent`}>
            <strong>{result.scorePercent === null ? "—" : `${result.scorePercent}%`}</strong>
            <span>{result.correctCount} of {result.scoredQuestions} independent responses correct</span>
          </div>
          <p>{result.supportedCount} supported · {result.mediaFailedCount} unavailable. {result.status === "incomplete" ? "This check has incomplete independent evidence." : ""}</p>
          {storageFailed && <p role="alert">Keep this page open. This device could not store a recovery copy.</p>}
          <p>{result.savedToTeacher ? "Your teacher has your results. Stay here until your teacher ends the session." : storageFailed ? "Your preview result is only available while this page stays open." : "Your preview result is kept on this device."}</p>
          {!locked && <button className="lp-button lp-button-primary" onClick={onExit} type="button">Back to learning</button>}
        </section>
      </main>
    );
  }

  if (state.pendingAttempt) return (
    <main className="cycle-practice-page cycle-practice-page--complete">
      {headerActions}<section className="cycle-practice-complete-card">
        <h1>Your answers are kept</h1><p role="status">{message || "Saving your Cycle Check…"}</p>
        {storageFailed && <p role="alert">Keep this page open. This device could not store the recovery copy.</p>}
        <button type="button" className="lp-button lp-button-primary" disabled={answerPending} onClick={() => saveAttempt()}>Retry save</button>
      </section>
    </main>
  );

  if (!currentRound) return (
    <main className="cycle-practice-page cycle-practice-page--error" role="alert">
      <h1>This saved activity is unavailable</h1>
      <p>Your recorded answers are retained. Ask your teacher to start another session.</p>
    </main>
  );

  const progress = mode === "assessment"
    ? Math.round((assessmentIndex / Math.max(1, assessmentPlan.length)) * 100)
    : Math.round((elapsedSeconds / CYCLE_PRACTICE_MINIMUM_SECONDS) * 100);
  const currentAudio = roundAudio(currentRound);
  const progressValue = Math.min(100, Math.max(0, progress));
  const activityLabel = mode === "assessment" ? "Cycle Check" : "Practice";
  const readyForCheck = practiceStarted && !paused && !practice.unavailable.length && !check.unavailable.length;

  const compactAudioButton = (label, ariaLabel, onClick, available = true) => available ? (
    <button
      type="button"
      className="cycle-practice-topbar__audio-button"
      aria-label={ariaLabel}
      data-audio-action="replay"
      data-audio-state={audioStatus}
      disabled={answerPending}
      onClick={() => { triggerTactileFeedback(16); onClick(); }}
    >
      <SpeakerIcon />
      <span>{label}</span>
    </button>
  ) : null;

  return (
    <main
      className="cycle-practice-page"
      data-cycle-id={cycle.id}
      onKeyDownCapture={activity}
      onPointerDownCapture={event => {
        activity();
        if (!event.target.closest?.("[data-audio-action='replay']")) {
          retryAutomaticAudioFromGesture();
        }
      }}
    >
      <header className="cycle-practice-topbar">
        <div className="cycle-practice-topbar__identity">
          <span className="cycle-practice-topbar__eyebrow">Cycle {cycle.cycleNumber}</span>
          <h1 data-child-title="">{activityLabel}</h1>
          <small>{studentName}</small>
        </div>
        <div className="cycle-practice-topbar__round" aria-label={`${currentRound.stationTitle}, activity ${currentRoundNumber} of ${totalRounds}`}>
          <span>{currentRound.stationTitle}</span>
          <strong>{currentRoundNumber} / {totalRounds}</strong>
        </div>
        <div className="cycle-practice-topbar__instruction">
          <span data-child-instruction="">{currentAudio.instructionText || "Listen, look, and try the activity."}</span>
          <div className="cycle-practice-topbar__audio-actions">
            {compactAudioButton("Hear", "Hear what to do", () => replayInstruction())}
            {compactAudioButton("Target", "Hear the target", replayTarget, Boolean(currentAudio.targetAudio?.length))}
            {compactAudioButton("Poem", "Hear the poem", () => replayInstruction(true), Boolean(currentAudio.contentAudio))}
          </div>
        </div>
        <div className="cycle-practice-topbar__progress" data-child-progress="" role="progressbar" aria-label="Activity progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressValue}>
          <span style={{ width: `${progressValue}%` }} />
        </div>
        <div className="cycle-practice-topbar__timer" aria-label={mode === "assessment" ? `Check time ${formatClock(clockDisplay.checkSeconds)}` : `Active practice time ${formatClock(elapsedSeconds)} of ${formatClock(CYCLE_PRACTICE_MINIMUM_SECONDS)}`}>
          <span>{mode === "assessment" ? "Check" : "Active"}</span>
          <strong>{formatClock(mode === "assessment" ? clockDisplay.checkSeconds : elapsedSeconds)} {mode !== "assessment" && <small>/ {formatClock(CYCLE_PRACTICE_MINIMUM_SECONDS)}</small>}</strong>
        </div>
        <div className="cycle-practice-topbar__actions">
          {headerActions}
          <button type="button" className="lp-button" onClick={togglePause}>{paused ? "Resume" : "Pause"}</button>
          {mode === "practice" ? (
            <button className="lp-button lp-button-primary cycle-practice-check-button" data-child-primary="" disabled={!readyForCheck || answerPending} onClick={startAssessment} type="button">
              Start Cycle Check
            </button>
          ) : (
            <span className="cycle-practice-topbar__assessment-note">One try each</span>
          )}
        </div>
        {(message || feedback) && (
          <p className="cycle-practice-topbar__status" role="status" aria-live="polite">
            {message || feedback}
          </p>
        )}
      </header>

      {storageFailed && <p role="alert">Keep this page open. Recovery storage is unavailable.</p>}
      {audioStatus === "unavailable" && !paused && <div role="status">
        <span>Sound did not play. Try Hear again.</span>
        {mode === "assessment" && requiresCycleAudio(currentRound) && <button type="button" className="lp-button" disabled={answerPending} onClick={() => handleOutcome({ correct: false, evidence: { deliveryUnavailable: true } })}>Keep item unscored</button>}
      </div>}
      {(practice.unavailable.length > 0 || check.unavailable.length > 0) && <p role="alert">Unavailable activities: {[...practice.unavailable, ...check.unavailable].join(", ")}. Your check stays unavailable until these are restored.</p>}
      {paused ? <p role="status">Practice paused. Choose Resume when you are ready.</p> : <AdventureRoundFrame
        announceFeedback={mode !== "assessment"}
        audioStatus={audioStatus}
        correctionModel={correctionModel}
        disabled={answerPending}
        feedback={feedback}
        feedbackTone={feedbackTone}
        compact
        hasContentAudio={Boolean(currentAudio.contentAudio)}
        hasTargetAudio={Boolean(currentAudio.targetAudio?.length)}
        instructionAudio={currentAudio.instructionAudio}
        instructionText={currentAudio.instructionText || "Listen, look, and try the activity."}
        mechanicId={currentRound.mechanicId}
        onReplayContent={() => replayInstruction(true)}
        onReplayInstruction={() => replayInstruction()}
        onReplayTarget={replayTarget}
        onStop={() => locked ? setMessage("Your teacher controls this session. Keep practising here.") : onExit?.()}
        roundNumber={currentRoundNumber}
        roundTotal={totalRounds}
        stationTitle={currentRound.stationTitle}
      >
        {mode === "assessment" && answerPending ? <p role="status">Response recorded.</p> : <AdventureMechanicRenderer
          key={roundKey}
          disabled={answerPending}
          onCommit={handleOutcome}
          onRequestObjectAudio={playObjectAudio}
          onRequestReplay={options => replayInstruction(true, options)}
          reducedMotion={reducedMotion}
          round={currentRound}
          simplifySoundChoice
          supportLevel={mode === "assessment" ? 0 : attempts}
        />}
      </AdventureRoundFrame>}
    </main>
  );
}

export function CyclePracticePage(props) {
  const cycleId = props.focusSession?.resolved_config?.cycle_id || props.assignedCycleId || "cycle-1";
  return <CyclePracticeSession key={cycleStorageKey(props.progressScopeKey || "default", props.focusSession?.id, cycleId)} {...props} />;
}
