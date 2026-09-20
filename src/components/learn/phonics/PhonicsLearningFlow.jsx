import { usePhonicsCompletion } from "./usePhonicsCompletion.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLessonByLetter } from "../../../data/phonicsLessons";
import { buildLetterPracticeQuestions, getLetterPracticeTraceLesson } from "../../../data/letterPractice.js";
import { LETTER_PRACTICE_VERSION, LETTER_PRACTICE_ROUNDS, LETTER_PRACTICE_ROUND_COUNT } from "../../../policy/letterPractice.js";
import { getLetterPracticeProgress, loadLetterPracticeSession, saveLetterPracticeSession } from "../../../utils/letterPracticeProgress.js";
import PhonicsProgressBar from "./components/PhonicsProgressBar";
import Celebration from "./components/learning/Celebration";
import StepListen from "./components/learning/StepListen";
import StepMatch from "./components/learning/StepMatch";
import StepTracer from "./components/learning/StepTracer";
import StepPractice from "./components/learning/StepPractice.jsx";

import "../../activities/woodland-activity.css";
import "./woodland-letters.css";

const newSeed = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export function PhonicsLearningFlow({ letter, initialStep = 1, onBack, onComplete, onExit = onBack, progressScopeKey = "default", progressRecord, reviewLetters = [] }) {
  const lesson = useMemo(() => getLessonByLetter(letter), [letter]);
  const [session, setSession] = useState(() => {
    const progress = getLetterPracticeProgress(progressRecord);
    const saved = loadLetterPracticeSession(progressScopeKey, letter);
    if (saved && (saved.round === progress.nextRound || progress.complete)
      && saved.evidence.length === saved.step - 1) return saved;
    return { round: progress.nextRound, step: initialStep, evidence: [], seed: newSeed(), reviewLetters };
  });
  const { round, step: currentStep } = session;
  const committed = useRef(false);
  const [checkpointFailed, setCheckpointFailed] = useState(false);
  const saveRound = useCallback(completion => onComplete({ ...completion, contentVersion: LETTER_PRACTICE_VERSION }), [onComplete]);
  const { complete, saveFailed, retrySave, resetCompletion } = usePhonicsCompletion(saveRound);
  const roundPlan = LETTER_PRACTICE_ROUNDS[round - 1];
  const traceLesson = useMemo(() => lesson && getLetterPracticeTraceLesson(lesson, round), [lesson, round]);
  const questions = useMemo(() => buildLetterPracticeQuestions({ letter, round, step: currentStep, seed: session.seed, reviewLetters: session.reviewLetters }), [letter, round, currentStep, session.seed, session.reviewLetters]);

  useEffect(() => { if (!lesson) onBack(); }, [lesson, onBack]);
  useEffect(() => {
    if (currentStep === "celebration") {
      if (!saveFailed) saveLetterPracticeSession(progressScopeKey, letter, null);
    } else saveLetterPracticeSession(progressScopeKey, letter, session);
  }, [session, currentStep, progressScopeKey, letter, saveFailed]);
  const updateSession = useCallback(next => {
    setSession(next);
    if (next.step !== "celebration") setCheckpointFailed(!saveLetterPracticeSession(progressScopeKey, letter, next));
  }, [progressScopeKey, letter]);

  const handleStep = useCallback(evidence => {
    if (committed.current) return;
    const steps = [...session.evidence, { ...evidence, practiceRound: round, practiceStep: currentStep }];
    if (currentStep === 3) {
      committed.current = true;
      complete(steps);
      updateSession({ ...session, step: "celebration", evidence: steps, checkpoint: null });
    } else updateSession({ ...session, step: currentStep + 1, evidence: steps, checkpoint: null });
  }, [session, round, currentStep, complete, updateSession]);

  const startRound = useCallback(nextRound => {
    if (saveFailed) return;
    resetCompletion();
    committed.current = false;
    updateSession({ round: nextRound, step: 1, evidence: [], seed: newSeed(), reviewLetters });
  }, [resetCompletion, saveFailed, reviewLetters, updateSession]);

  if (!lesson) return null;
  const progressSteps = [1, 2, 3].map(step => currentStep === "celebration" || currentStep > step ? "complete" : currentStep === step ? "active" : "upcoming");
  const activity = roundPlan.activities[currentStep - 2];
  const finalRound = round === LETTER_PRACTICE_ROUND_COUNT;

  return (
    <div className="phonics-learning-flow kg-child-flow woodland-activity woodland-letters" data-letter-round={round}>
      <div className="phonics-flow-header kg-child-flow__header">
        <button className="phonics-back-button wa-audio" onClick={() => { if (!saveFailed) onBack(); }} type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6" /></svg><span>Back to letters</span></button>
        <div className="phonics-round-progress">
          <span className="phonics-round-label">{letter} · Round {round} of {LETTER_PRACTICE_ROUND_COUNT} · {roundPlan.name}</span>
          <PhonicsProgressBar steps={progressSteps} />
        </div>
      </div>
      {saveFailed && <div role="alert"><p>Your practice is kept on this page. Keep it open and retry saving before leaving.</p><button type="button" onClick={retrySave}>Retry save</button></div>}
      {checkpointFailed && !saveFailed && <p role="status">Keep this page open to finish this round. This device could not save your place.</p>}
      <AnimatePresence mode="wait">
        {currentStep !== "celebration" && (
          <motion.div key={`${round}-${currentStep}-${session.seed}`} className="phonics-flow-step kg-child-flow__step" initial={currentStep === 1 ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={currentStep === 1 ? { opacity: 0 } : undefined}>
            {currentStep === 1 ? <StepTracer lesson={traceLesson} onComplete={handleStep} />
              : activity === "listen" ? <StepListen lesson={lesson} onComplete={handleStep} />
                : activity === "match" ? <StepMatch lesson={lesson} onComplete={handleStep} />
                  : <StepPractice questions={questions} step={currentStep} checkpoint={session.checkpoint}
                    onCheckpoint={checkpoint => updateSession({ ...session, checkpoint })} onComplete={handleStep} />}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {currentStep === "celebration" && !saveFailed && (
          <Celebration letter={lesson.letter}
            title={finalRound ? "Five rounds complete!" : "Round complete!"}
            subtitle={finalRound ? `You finished all five rounds for ${letter}!` : `${letter} · ${round} of ${LETTER_PRACTICE_ROUND_COUNT} rounds finished.`}
            learnAnotherLabel={finalRound ? "Learn Another Letter" : "Next round"}
            playAgainLabel={finalRound ? "Play Again" : "Back to letters"}
            onLearnAnother={() => finalRound ? onExit() : startRound(round + 1)}
            onPlayAgain={() => finalRound ? startRound(1) : onExit()} />
        )}
      </AnimatePresence>
    </div>
  );
}
