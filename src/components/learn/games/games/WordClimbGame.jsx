import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  playCelebrationFanfare,
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playTapSound
} from "../../../../utils/audio/gameSfx";
import { cancelSpeech, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { rocketRunStars } from "../../../../utils/rocketRunRounds.js";
import {
  createWordClimbSession,
  wordClimbChoicesForStep
} from "../../../../utils/wordClimbLevels.js";
import { onsetGrapheme } from "../../../elQuest/elQuestEngine.js";
import "./WordClimbGame.css";

const SCORE_PER_CLIMB = 10;

function safeSfx(enabled, effect) {
  if (!enabled) return;
  try {
    effect();
  } catch {
    // Spoken teaching cues remain optional when a device blocks audio.
  }
}

function BeanstalkScene() {
  return (
    <>
      <div className="wc-sky-glow" aria-hidden="true" />
      <div className="wc-cloud wc-cloud-one" aria-hidden="true" />
      <div className="wc-cloud wc-cloud-two" aria-hidden="true" />
      <svg className="wc-beanstalk" viewBox="0 0 760 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="wc-trunk" x1="0" x2="1">
            <stop offset="0" stopColor="#123f39" />
            <stop offset="0.23" stopColor="#35a86b" />
            <stop offset="0.52" stopColor="#84dc75" />
            <stop offset="0.75" stopColor="#2a8c58" />
            <stop offset="1" stopColor="#0b352f" />
          </linearGradient>
          <linearGradient id="wc-vine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c3f38c" />
            <stop offset="0.5" stopColor="#49b964" />
            <stop offset="1" stopColor="#17654c" />
          </linearGradient>
          <radialGradient id="wc-leaf" cx="35%" cy="28%" r="72%">
            <stop offset="0" stopColor="#b9f184" />
            <stop offset="0.55" stopColor="#47b762" />
            <stop offset="1" stopColor="#146047" />
          </radialGradient>
          <filter id="wc-shadow" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#061d24" floodOpacity=".5" />
          </filter>
        </defs>
        <g filter="url(#wc-shadow)">
          <path d="M392 960 C280 760 500 655 372 480 C272 340 460 210 356 -40 L476 -40 C560 230 378 352 506 512 C630 670 416 790 536 960 Z" fill="url(#wc-trunk)" />
          <path d="M420 930 C358 760 520 662 414 488 C338 364 488 230 412 10" fill="none" stroke="url(#wc-vine)" strokeWidth="25" strokeLinecap="round" opacity=".92" />
          <path d="M405 888 C430 812 480 748 537 709" fill="none" stroke="#163f32" strokeWidth="13" strokeLinecap="round" />
          <path d="M420 633 C346 590 288 535 264 468" fill="none" stroke="#173f32" strokeWidth="13" strokeLinecap="round" />
          <path d="M436 374 C488 330 545 305 610 298" fill="none" stroke="#173f32" strokeWidth="12" strokeLinecap="round" />
          <path d="M394 192 C334 150 282 100 250 44" fill="none" stroke="#173f32" strokeWidth="11" strokeLinecap="round" />
          <path d="M536 707 C598 645 677 650 710 705 C648 758 577 755 536 707 Z" fill="url(#wc-leaf)" />
          <path d="M267 465 C202 403 117 413 78 474 C144 533 220 526 267 465 Z" fill="url(#wc-leaf)" />
          <path d="M609 297 C670 234 738 251 760 310 C706 353 649 346 609 297 Z" fill="url(#wc-leaf)" />
          <path d="M251 45 C190 -7 115 4 81 66 C142 116 211 106 251 45 Z" fill="url(#wc-leaf)" />
        </g>
      </svg>
      <div className="wc-canopy wc-canopy-left" aria-hidden="true" />
      <div className="wc-canopy wc-canopy-right" aria-hidden="true" />
      <div className="wc-distance-hills" aria-hidden="true" />
      <div className="wc-ground" aria-hidden="true" />
      <div className="wc-mist" aria-hidden="true" />
      <div className="wc-fireflies" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
    </>
  );
}

export default function WordClimbGame({
  difficulty = "easy",
  startLevel = 0,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled = true
}) {
  const session = useMemo(() => createWordClimbSession(difficulty), [difficulty]);
  const initialStep = Math.max(0, Math.min(Number(startLevel) || 0, session.summit - 1));
  const [step, setStep] = useState(() => initialStep);
  const [choices, setChoices] = useState(() => wordClimbChoicesForStep(session.round, initialStep));
  const [feedback, setFeedback] = useState("Read all three leaves, then choose.");
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [selectedLane, setSelectedLane] = useState(1);
  const [choiceState, setChoiceState] = useState({ word: "", state: "" });
  const [isClimbing, setIsClimbing] = useState(false);
  const wrongHitsRef = useRef(0);
  const timersRef = useRef(new Set());
  const pausedRef = useRef(false);
  const soundEnabledRef = useRef(isSoundEnabled);

  const armTimer = useCallback(entry => {
    entry.startedAt = Date.now();
    entry.id = window.setTimeout(() => {
      entry.id = null;
      timersRef.current.delete(entry);
      entry.callback();
    }, entry.remaining);
  }, []);

  const later = useCallback((callback, delay) => {
    const entry = { id: null, callback, remaining: delay, startedAt: 0 };
    timersRef.current.add(entry);
    if (!pausedRef.current) armTimer(entry);

    return () => {
      if (entry.id !== null) window.clearTimeout(entry.id);
      timersRef.current.delete(entry);
    };
  }, [armTimer]);

  const pauseEngine = useCallback(() => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    cancelSpeech();
    const now = Date.now();
    timersRef.current.forEach(entry => {
      if (entry.id === null) return;
      window.clearTimeout(entry.id);
      entry.id = null;
      entry.remaining = Math.max(0, entry.remaining - (now - entry.startedAt));
    });
  }, []);

  const resumeEngine = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    timersRef.current.forEach(entry => {
      if (entry.id === null) armTimer(entry);
    });
  }, [armTimer]);

  useEffect(() => {
    onEngineReady?.({ pause: pauseEngine, resume: resumeEngine });
  }, [onEngineReady, pauseEngine, resumeEngine]);

  useEffect(() => () => {
    timersRef.current.forEach(entry => {
      if (entry.id !== null) window.clearTimeout(entry.id);
    });
    timersRef.current.clear();
    cancelSpeech();
  }, []);

  useEffect(() => {
    onProgressUpdate?.(step, session.summit);
    onScoreUpdate?.(step * SCORE_PER_CLIMB);
  }, [onProgressUpdate, onScoreUpdate, session.summit, step]);

  useEffect(() => {
    // GamePlayer stores the next unfinished 0-based step. While the final
    // celebration delay is pending, keep the resumable value on the last
    // playable choice instead of writing an impossible level 7 of 6.
    onCheckpoint?.(Math.min(step, session.summit - 1), session.summit);
  }, [onCheckpoint, session.summit, step]);

  useEffect(() => {
    if (!isSoundEnabled) return undefined;
    return later(() => {
      if (soundEnabledRef.current) void speakPhoneme(session.target);
    }, 280);
  }, [isSoundEnabled, later, session.target]);

  useLayoutEffect(() => {
    soundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  useEffect(() => {
    if (!isSoundEnabled) cancelSpeech();
  }, [isSoundEnabled]);

  const replayTarget = useCallback(() => {
    if (!isSoundEnabled) return;
    safeSfx(true, playTapSound);
    void speakPhoneme(session.target);
  }, [isSoundEnabled, session.target]);

  const chooseWord = useCallback((choice, lane) => {
    if (busy || finished) return;
    setBusy(true);
    setSelectedLane(lane);
    setChoiceState({ word: choice.word, state: choice.correct ? "correct" : "wrong" });

    if (!choice.correct) {
      wrongHitsRef.current += 1;
      const actualOnset = onsetGrapheme(choice.word) || choice.word.slice(0, 1);
      setFeedback(`${choice.word} starts with /${actualOnset}/. Try a /${session.target}/ word.`);
      safeSfx(isSoundEnabled, playSoftBuzz);
      if (isSoundEnabled) later(() => {
        if (soundEnabledRef.current) void speakWord(choice.word);
      }, 110);
      later(() => {
        setChoiceState({ word: "", state: "" });
        setBusy(false);
      }, 560);
      return;
    }

    const nextStep = step + 1;
    setStep(nextStep);
    setIsClimbing(true);
    setFeedback(`${choice.word} starts with /${session.target}/. Up we go!`);
    safeSfx(isSoundEnabled, playCorrectChime);
    safeSfx(isSoundEnabled, playPopSound);
    if (isSoundEnabled) later(() => {
      if (soundEnabledRef.current) void speakWord(choice.word);
    }, 170);

    if (nextStep >= session.summit) {
      later(() => {
        const stars = rocketRunStars(nextStep, session.summit, wrongHitsRef.current);
        setFinished(true);
        setBusy(false);
        safeSfx(soundEnabledRef.current, playStarChime);
        safeSfx(soundEnabledRef.current, playCelebrationFanfare);
        onComplete?.(stars, nextStep * SCORE_PER_CLIMB, nextStep);
      }, 720);
      return;
    }

    later(() => {
      setChoices(wordClimbChoicesForStep(session.round, nextStep));
      setChoiceState({ word: "", state: "" });
      setIsClimbing(false);
      setSelectedLane(1);
      setFeedback(`Choose another word that starts with /${session.target}/.`);
      setBusy(false);
    }, 720);
  }, [busy, finished, isSoundEnabled, later, onComplete, session, step]);

  const climbPercent = Math.round((step / session.summit) * 100);
  const lanePercent = 18 + selectedLane * 32;

  return (
    <section
      className="word-climb"
      aria-label={`Word Climb. Choose words that start with ${session.target}.`}
      data-wc-progress={step}
      style={{ "--wc-rise": `${climbPercent * 0.18}px`, "--wc-lane": `${lanePercent}%` }}
    >
      <BeanstalkScene />

      <div className="wc-mission-card">
        <div className="wc-target-token" aria-label={`Target sound ${session.target}`}>
          <span>STARTING SOUND</span>
          <strong data-wc="target">/{session.target}/</strong>
        </div>
        <div className="wc-prompt">
          <span className="wc-prompt-kicker">READ · CHOOSE · CLIMB</span>
          <h2>Choose the word starting with /{session.target}/.</h2>
          <p data-wc="feedback" role="status" aria-live="polite">{feedback}</p>
        </div>
        <button
          type="button"
          className="wc-replay"
          data-wc="replay"
          disabled={!isSoundEnabled}
          onClick={replayTarget}
          aria-label={isSoundEnabled ? `Hear the ${session.target} sound again` : `Target is ${session.target}; sound is off`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Zm11.5-.7v7.4a4.5 4.5 0 0 0 0-7.4Zm0-3.3v2.1a7 7 0 0 1 0 9.8V19a9 9 0 0 0 0-14Z" /></svg>
          <span>{isSoundEnabled ? "Hear sound" : "Sound off"}</span>
        </button>
      </div>

      <div className="wc-summit-meter" aria-label={`${step} of ${session.summit} climbs complete`}>
        <span>CANOPY</span>
        <div aria-hidden="true">
          {Array.from({ length: session.summit }, (_, index) => (
            <i className={index < step ? "filled" : ""} key={index} />
          ))}
        </div>
        <strong>{step}/{session.summit}</strong>
      </div>

      <div className="wc-choice-field" role="group" aria-label={`Choose a word that starts with ${session.target}`}>
        {choices.map((choice, lane) => {
          const state = choiceState.word === choice.word ? choiceState.state : "";
          return (
            <button
              type="button"
              className="wc-word-ledge"
              data-wc="choice"
              data-state={state || undefined}
              disabled={busy || finished}
              key={`${step}-${choice.word}`}
              onClick={() => chooseWord(choice, lane)}
              aria-label={`Choose ${choice.word}`}
            >
              <span aria-hidden="true" className="wc-leaf-vein" />
              <strong>{choice.word}</strong>
              <span aria-hidden="true" className="wc-choice-mark">↟</span>
            </button>
          );
        })}
      </div>

      <div
        className={`wc-climber${isClimbing ? " climbing" : ""}`}
        aria-hidden="true"
      >
        <span className="wc-climber-ring" />
        <img src="/images/pals/poses/meadow-wave.webp" alt="" />
      </div>

      <div className="wc-route-caption" aria-hidden="true">
        <span>{step === 0 ? "ROOT TRAIL" : `CLIMB ${step}`}</span>
        <i><b style={{ width: `${climbPercent}%` }} /></i>
        <strong>{climbPercent}%</strong>
      </div>

    </section>
  );
}
