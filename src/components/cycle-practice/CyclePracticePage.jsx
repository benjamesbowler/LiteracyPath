import { useEffect, useMemo, useRef, useState } from "react";

import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { getLedaWordAudioPath } from "../../data/ledaProductionAudio.js";
import { saveStudentFocusCyclePracticeAttempt } from "../../data/studentFocusSessionCore.js";
import { buildStationRounds, stationsForCycle } from "../elQuest/elQuestEngine.js";
import { resolveAdventureRoundAudio } from "../elQuest/adventureRoundAudio.js";
import { AdventureMechanicRenderer } from "../elQuest/mechanics/AdventureMechanicRenderer.jsx";
import { AdventureRoundFrame, SpeakerIcon } from "../elQuest/AdventureRoundFrame.jsx";
import {
  correctionModelForOutcome,
  feedbackForCommittedOutcome
} from "../elQuest/adventureRunState.js";
import { playCueAudio, playCueSequence, preloadCueAudio, stopCueAudio } from "../../utils/audio/cuePlayer.js";
import { queueProgressSave } from "../../utils/progressSync.js";

import "../../styles/skills-block-quest.css";
import "../../styles/cycle-practice.css";

const CYCLE_PRACTICE_MINUTES = 30;
const CYCLE_PRACTICE_MINIMUM_SECONDS = CYCLE_PRACTICE_MINUTES * 60;
const CYCLE_PRACTICE_CONTENT_VERSION = "cycle-practice-v1";

const PRACTICE_STATION_LIMIT = 3;
const ASSESSMENT_LIMIT = 10;

function createAttemptId() {
  return globalThis.crypto?.randomUUID?.() || `cycle-practice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cycleFromId(cycleId) {
  return elSkillsBlockCycles.find(cycle => cycle.id === cycleId && Number.isInteger(cycle.cycleNumber)) || null;
}

function buildCyclePracticePlan(cycle, seed = "cycle-practice") {
  if (!cycle) return [];
  return stationsForCycle(cycle)
    .filter(station => station.id !== "check")
    .flatMap(station => {
      let rounds;
      try {
        rounds = buildStationRounds(cycle, station.id, { seed: `${seed}:${station.id}` });
      } catch {
        rounds = [];
      }
      return rounds.slice(0, PRACTICE_STATION_LIMIT).map(round => ({
        ...round,
        stationId: station.id,
        stationTitle: station.title
      }));
    });
}

function buildCyclePracticeAssessment(cycle, seed = "cycle-check") {
  if (!cycle) return [];
  try {
    return buildStationRounds(cycle, "check", { seed }).slice(0, ASSESSMENT_LIMIT).map(round => ({
      ...round,
      stationId: "check",
      stationTitle: "Cycle Check"
    }));
  } catch {
    return [];
  }
}

function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function roundAudio(round) {
  return resolveAdventureRoundAudio(round);
}

function roundAudioSources(round, includeContent = true) {
  const resolved = roundAudio(round);
  return [
    resolved.instructionAudio,
    ...resolved.targetAudio,
    ...(includeContent && resolved.contentAudio ? [resolved.contentAudio] : [])
  ].filter(Boolean);
}

function instructionAudio(round, includeContent = false, callbacks = {}) {
  const resolved = roundAudio(round);
  const sequence = [
    resolved.instructionAudio,
    ...resolved.targetAudio,
    ...(includeContent && resolved.contentAudio ? [resolved.contentAudio] : [])
  ].filter(Boolean);
  if (!sequence.length) {
    callbacks.onUnavailable?.();
    return;
  }
  playCueSequence(sequence, {
    gapMs: 40,
    onStarted: callbacks.onStarted,
    onDelivery: callbacks.onDelivery,
    onUnavailable: callbacks.onUnavailable
  });
}

function questionRecord(round, outcome, index, mode) {
  return {
    questionId: round.id || `${round.mechanicId}-${index}`,
    construct: round.construct || round.mechanicId || "cycle_practice",
    mechanicId: round.mechanicId || "unknown",
    stationId: round.stationId || "",
    itemKey: round.itemKey || round.answer || round.targetWord || "",
    isCorrect: Boolean(outcome?.correct),
    responseStatus: outcome?.correct ? "correct" : "incorrect",
    mode,
    recordedAt: new Date().toISOString()
  };
}

export function CyclePracticePage({
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
  const practicePlan = useMemo(() => buildCyclePracticePlan(cycle, seed), [cycle, seed]);
  const assessmentPlan = useMemo(() => buildCyclePracticeAssessment(cycle, `${seed}:assessment`), [cycle, seed]);
  const [startedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mode, setMode] = useState("practice");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [assessmentRecords, setAssessmentRecords] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("ready");
  const [correctionModel, setCorrectionModel] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [answerPending, setAnswerPending] = useState(false);
  const [audioStatus, setAudioStatus] = useState("ready");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const audioRoundRef = useRef("");
  const practiceStarted = elapsedSeconds >= CYCLE_PRACTICE_MINIMUM_SECONDS;
  const locked = Boolean(focusSession?.id);
  const currentRound = mode === "assessment"
    ? assessmentPlan[assessmentIndex]
    : practicePlan[practiceIndex];
  const totalRounds = mode === "assessment" ? assessmentPlan.length : practicePlan.length;
  const currentRoundNumber = (mode === "assessment" ? assessmentIndex : practiceIndex) + 1;

  useEffect(() => {
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    onContentAvailabilityChange?.(Boolean(cycle && practicePlan.length && assessmentPlan.length));
  }, [assessmentPlan.length, cycle, onContentAvailabilityChange, practicePlan.length]);

  useEffect(() => {
    if (!currentRound || answerPending || result) return undefined;
    const key = `${mode}:${currentRound.id || (mode === "assessment" ? assessmentIndex : practiceIndex)}`;
    if (audioRoundRef.current === key) return undefined;
    audioRoundRef.current = key;
    setAudioStatus("ready");
    roundAudioSources(currentRound, mode === "practice").forEach(preloadCueAudio);
    instructionAudio(currentRound, mode === "practice", {
      onStarted: () => setAudioStatus("playing"),
      onDelivery: () => setAudioStatus("ready"),
      onUnavailable: () => setAudioStatus("unavailable")
    });
    return () => stopCueAudio();
  }, [answerPending, assessmentIndex, currentRound, mode, practiceIndex, result]);

  function replayInstruction(includeContent = false) {
    if (!currentRound) return;
    setAudioStatus("ready");
    instructionAudio(currentRound, includeContent, {
      onStarted: () => setAudioStatus("playing"),
      onDelivery: () => setAudioStatus("ready"),
      onUnavailable: () => setAudioStatus("unavailable")
    });
  }

  function replayTarget() {
    const target = roundAudio(currentRound);
    const sequence = target.targetAudio?.length ? target.targetAudio : target.contentAudio ? [target.contentAudio] : [];
    if (!sequence.length) return replayInstruction();
    setAudioStatus("playing");
    playCueSequence(sequence, { gapMs: 40, onDelivery: () => setAudioStatus("ready"), onUnavailable: () => setAudioStatus("unavailable") });
  }

  function playObjectAudio(word) {
    const path = getLedaWordAudioPath(word);
    if (!path) return;
    setAudioStatus("playing");
    playCueAudio(path, { onDelivery: () => setAudioStatus("ready"), onUnavailable: () => setAudioStatus("unavailable") });
  }

  function advanceAfterAnswer(outcome) {
    const isAssessment = mode === "assessment";
    const index = isAssessment ? assessmentIndex : practiceIndex;
    const record = questionRecord(currentRound, outcome, index, mode);
    if (isAssessment) {
      setAssessmentRecords(records => [...records, record]);
    }
    window.setTimeout(() => {
      setAnswerPending(false);
      setFeedback("");
      setFeedbackTone("ready");
      setCorrectionModel(null);
      setAttempts(0);
      if (isAssessment) {
        if (assessmentIndex + 1 >= assessmentPlan.length) {
          finishAssessment([...assessmentRecords, record]);
        } else {
          setAssessmentIndex(value => value + 1);
        }
      } else if (practiceIndex + 1 >= practicePlan.length) {
        setPracticeIndex(0);
        setMessage(practiceStarted
          ? "You have completed this practice set. Keep practising or start your Cycle Check."
          : "Nice work. Keep practising until the 30-minute timer is complete.");
      } else {
        setPracticeIndex(value => value + 1);
      }
    }, outcome?.correct ? 650 : 1050);
  }

  function handleOutcome(outcome = {}) {
    if (answerPending || !currentRound || result) return;
    const nextAttempt = attempts + 1;
    setAttempts(nextAttempt);
    setAnswerPending(true);
    setFeedbackTone(outcome.correct ? "correct" : "incorrect");
    setFeedback(feedbackForCommittedOutcome(currentRound, outcome, nextAttempt));
    setCorrectionModel(!outcome.correct && nextAttempt >= 3 ? correctionModelForOutcome(currentRound, outcome) : null);
    advanceAfterAnswer(outcome);
  }

  function startAssessment() {
    if (!practiceStarted || practicePlan.length === 0 || assessmentPlan.length === 0) return;
    setMessage("");
    setMode("assessment");
    setAssessmentIndex(0);
    setAssessmentRecords([]);
    setFeedback("");
    setCorrectionModel(null);
    setAttempts(0);
    audioRoundRef.current = "";
  }

  async function finishAssessment(records) {
    const correctCount = records.filter(record => record.isCorrect).length;
    const attempt = {
      attemptId: createAttemptId(),
      assessmentType: "cycle_practice_check",
      cycleId: cycle.id,
      cycleNumber: cycle.cycleNumber,
      practiceSeconds: Math.max(CYCLE_PRACTICE_MINIMUM_SECONDS, elapsedSeconds),
      totalQuestions: records.length,
      correctCount,
      questionRecords: records,
      assessmentVersion: CYCLE_PRACTICE_CONTENT_VERSION,
      contentVersion: CYCLE_PRACTICE_CONTENT_VERSION,
      policyVersion: "cycle-practice-policy-v1",
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date().toISOString(),
      status: "completed"
    };
    setAnswerPending(true);
    setMessage("");
    if (focusSession?.id && focusToken && client) {
      try {
        const saved = await saveStudentFocusCyclePracticeAttempt({
          client,
          token: focusToken,
          sessionId: focusSession.id,
          attempt
        });
        if (saved?.ok === false) throw new Error(saved.error || "cycle_practice_save_failed");
      } catch {
        setAnswerPending(false);
        setMessage("Your Cycle Check could not be saved. Stay here and ask your teacher for help.");
        return;
      }
    } else {
      queueProgressSave("cycle_practice", cycle.id, attempt, { scopeKey: progressScopeKey });
    }
    setResult({ ...attempt, scorePercent: records.length ? Math.round((correctCount / records.length) * 100) : 0 });
    setAnswerPending(false);
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
            <strong>{result.scorePercent}%</strong>
            <span>{result.correctCount} of {result.totalQuestions} correct</span>
          </div>
          <p>{locked ? "Your teacher has your results. Stay here until your teacher ends the session." : "Your practice result has been saved."}</p>
          {!locked && <button className="lp-button lp-button-primary" onClick={onExit} type="button">Back to learning</button>}
        </section>
      </main>
    );
  }

  const progress = mode === "assessment"
    ? Math.round((assessmentIndex / Math.max(1, assessmentPlan.length)) * 100)
    : Math.round((elapsedSeconds / CYCLE_PRACTICE_MINIMUM_SECONDS) * 100);
  const currentAudio = roundAudio(currentRound);
  const progressValue = Math.min(100, Math.max(0, progress));
  const activityLabel = mode === "assessment" ? "Cycle Check" : "Practice";
  const readyForCheck = practiceStarted && practiceIndex >= 0;

  const compactAudioButton = (label, ariaLabel, onClick, available = true) => available ? (
    <button
      type="button"
      className="cycle-practice-topbar__audio-button"
      aria-label={ariaLabel}
      data-audio-state={audioStatus}
      disabled={answerPending}
      onClick={onClick}
    >
      <SpeakerIcon />
      <span>{label}</span>
    </button>
  ) : null;

  return (
    <main className="cycle-practice-page" data-cycle-id={cycle.id}>
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
        <div className="cycle-practice-topbar__timer" aria-label={`Practice time ${formatClock(elapsedSeconds)} of ${formatClock(CYCLE_PRACTICE_MINIMUM_SECONDS)}`}>
          <span>{mode === "assessment" ? "Check" : "Time"}</span>
          <strong>{formatClock(elapsedSeconds)} <small>/ {formatClock(CYCLE_PRACTICE_MINIMUM_SECONDS)}</small></strong>
        </div>
        <div className="cycle-practice-topbar__actions">
          {headerActions}
          {mode === "practice" ? (
            <button className="lp-button lp-button-primary" data-child-primary="" disabled={!readyForCheck || answerPending} onClick={startAssessment} type="button">
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

      <AdventureRoundFrame
        announceFeedback
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
        <AdventureMechanicRenderer
          disabled={answerPending}
          onCommit={handleOutcome}
          onRequestObjectAudio={playObjectAudio}
          onRequestReplay={() => replayInstruction(true)}
          reducedMotion={reducedMotion}
          round={currentRound}
          simplifySoundChoice
          supportLevel={0}
        />
      </AdventureRoundFrame>
    </main>
  );
}
