import { usePhonicsCompletion } from "../usePhonicsCompletion.js";
import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhonicsProgressBar from "../components/PhonicsProgressBar";
import Celebration from "../components/learning/Celebration";
import StepBuildWord from "./StepBuildWord";
import StepHearWord from "./StepHearWord";
import StepWordMagic from "./StepWordMagic";

export function CvcLearningFlow({ family, initialStep = 1, onBack, onComplete, onExit = onBack }) {
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

  const progressSteps = useMemo(() => [
    currentStep === 1 ? "active" : "complete",
    currentStep === 2 ? "active" : currentStep === 3 || currentStep === "celebration" ? "complete" : "upcoming",
    currentStep === 3 ? "active" : currentStep === "celebration" ? "complete" : "upcoming"
  ], [currentStep]);

  const handlePlayAgain = useCallback(() => { if (saveFailed) return;
    resetCompletion(); committed.current = false; stepEvidence.current = []; setCurrentStep(1); }, [resetCompletion, saveFailed]);

  return (
    <div className="phonics-learning-flow cvc-learning-flow kg-child-flow">
      <div className="phonics-flow-header kg-child-flow__header">
        <button className="phonics-back-button" onClick={() => { if (!saveFailed) onBack(); }} type="button">
          Back to words
        </button>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <PhonicsProgressBar steps={progressSteps} />
        </motion.div>
      </div>

      {saveFailed && <div role="alert"><p>Your practice is kept on this page. Keep it open and retry saving before leaving.</p><button type="button" onClick={retrySave}>Retry save</button></div>}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="hear" className="phonics-flow-step kg-child-flow__step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepHearWord family={family} onComplete={evidence => handleStep(evidence, 2)} />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div key="build" className="phonics-flow-step kg-child-flow__step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepBuildWord family={family} onComplete={evidence => handleStep(evidence, 3)} />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div key="magic" className="phonics-flow-step kg-child-flow__step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepWordMagic family={family} onComplete={evidence => handleStep(evidence, "celebration")} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentStep === "celebration" && !saveFailed && (
          <Celebration
            letter={`-${family.rime}`}
            title="Nest Built!"
            subtitle={`You built the -${family.rime} words!`}
            learnAnotherLabel="New Words"
            playAgainLabel="Play Again"
            onLearnAnother={() => { if (!saveFailed) onExit(); }}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
