import { usePhonicsCompletion } from "./usePhonicsCompletion.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLessonByLetter } from "../../../data/phonicsLessons";
import PhonicsProgressBar from "./components/PhonicsProgressBar";
import Celebration from "./components/learning/Celebration";
import StepListen from "./components/learning/StepListen";
import StepMatch from "./components/learning/StepMatch";
import StepTracer from "./components/learning/StepTracer";

export function PhonicsLearningFlow({ letter, initialStep = 1, onBack, onComplete, onExit = onBack }) {
  const lesson = useMemo(() => getLessonByLetter(letter), [letter]);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const { complete, saveFailed, retrySave, resetCompletion } = usePhonicsCompletion(onComplete);
  const stepEvidence = useRef([]);
  const committed = useRef(false);
  const handleStep = useCallback((evidence, next) => {
    if (committed.current) return;
    stepEvidence.current = [...stepEvidence.current.filter(row => row.step !== evidence.step), evidence];
    if (next === "celebration") {
      committed.current = true;
      complete(stepEvidence.current);
    }
    setCurrentStep(next);
  }, [complete]);

  useEffect(() => {
    if (!lesson) onBack();
  }, [lesson, onBack]);

  const progressSteps = useMemo(() => [
    currentStep === 1 ? "active" : "complete",
    currentStep === 2 ? "active" : currentStep === 3 || currentStep === "celebration" ? "complete" : "upcoming",
    currentStep === 3 ? "active" : currentStep === "celebration" ? "complete" : "upcoming"
  ], [currentStep]);

  const handleStep1Complete = useCallback(evidence => handleStep(evidence, 2), [handleStep]);
  const handleStep2Complete = useCallback(evidence => handleStep(evidence, 3), [handleStep]);
  const handleStep3Complete = useCallback(evidence => handleStep(evidence, "celebration"), [handleStep]);
  const handlePlayAgain = useCallback(() => {
    if (saveFailed) return;
    resetCompletion(); committed.current = false; stepEvidence.current = []; setCurrentStep(1);
  }, [resetCompletion, saveFailed]);

  if (!lesson) return null;

  return (
    <div className="phonics-learning-flow kg-child-flow">
      <div className="phonics-flow-header kg-child-flow__header">
        <button className="phonics-back-button" onClick={() => { if (!saveFailed) onBack(); }} type="button">
          Back to letters
        </button>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <PhonicsProgressBar steps={progressSteps} />
        </motion.div>
      </div>

      {saveFailed && <div role="alert"><p>Your practice is kept on this page. Keep it open and retry saving before leaving.</p><button type="button" onClick={retrySave}>Retry save</button></div>}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="step1" className="phonics-flow-step kg-child-flow__step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepTracer lesson={lesson} onComplete={handleStep1Complete} />
          </motion.div>
        )}

        {currentStep === 2 && (
          <div key="step2" className="phonics-flow-step kg-child-flow__step">
            <StepListen lesson={lesson} onComplete={handleStep2Complete} />
          </div>
        )}

        {currentStep === 3 && (
          <div key="step3" className="phonics-flow-step kg-child-flow__step">
            <StepMatch lesson={lesson} onComplete={handleStep3Complete} />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentStep === "celebration" && !saveFailed && (
          <Celebration
            letter={lesson.letter}
            onLearnAnother={() => { if (!saveFailed) onExit(); }}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
