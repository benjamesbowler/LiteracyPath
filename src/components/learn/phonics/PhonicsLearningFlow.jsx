import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLessonByLetter } from "../../../data/phonicsLessons";
import PhonicsProgressBar from "./components/PhonicsProgressBar";
import Celebration from "./components/learning/Celebration";
import StepListen from "./components/learning/StepListen";
import StepMatch from "./components/learning/StepMatch";
import StepTracer from "./components/learning/StepTracer";

export function PhonicsLearningFlow({ letter, onBack, onComplete }) {
  const lesson = useMemo(() => getLessonByLetter(letter), [letter]);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!lesson) onBack();
  }, [lesson, onBack]);

  const progressSteps = useMemo(() => [
    currentStep === 1 ? "active" : "complete",
    currentStep === 2 ? "active" : currentStep === 3 || currentStep === "celebration" ? "complete" : "upcoming",
    currentStep === 3 ? "active" : currentStep === "celebration" ? "complete" : "upcoming"
  ], [currentStep]);

  const handleStep1Complete = useCallback(() => setCurrentStep(2), []);
  const handleStep2Complete = useCallback(() => setCurrentStep(3), []);
  const handleStep3Complete = useCallback(() => setCurrentStep("celebration"), []);
  const handlePlayAgain = useCallback(() => setCurrentStep(3), []);

  if (!lesson) return null;

  return (
    <div className="phonics-learning-flow">
      <div className="phonics-flow-header">
        <button className="phonics-back-button" onClick={onBack} type="button">
          Back to letters
        </button>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <PhonicsProgressBar steps={progressSteps} />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="step1" className="phonics-flow-step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepTracer lesson={lesson} onComplete={handleStep1Complete} />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div key="step2" className="phonics-flow-step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepListen lesson={lesson} onComplete={handleStep2Complete} />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div key="step3" className="phonics-flow-step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepMatch lesson={lesson} onComplete={handleStep3Complete} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentStep === "celebration" && (
          <Celebration
            letter={lesson.letter}
            onLearnAnother={onComplete}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
