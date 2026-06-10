import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhonicsProgressBar from "../components/PhonicsProgressBar";
import Celebration from "../components/learning/Celebration";
import StepBuildWord from "./StepBuildWord";
import StepHearWord from "./StepHearWord";
import StepWordMagic from "./StepWordMagic";

export function CvcLearningFlow({ family, onBack, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);

  const progressSteps = useMemo(() => [
    currentStep === 1 ? "active" : "complete",
    currentStep === 2 ? "active" : currentStep === 3 || currentStep === "celebration" ? "complete" : "upcoming",
    currentStep === 3 ? "active" : currentStep === "celebration" ? "complete" : "upcoming"
  ], [currentStep]);

  const handlePlayAgain = useCallback(() => setCurrentStep(1), []);

  return (
    <div className="phonics-learning-flow cvc-learning-flow">
      <div className="phonics-flow-header">
        <button className="phonics-back-button" onClick={onBack} type="button">
          Back
        </button>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <PhonicsProgressBar steps={progressSteps} />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="hear" className="phonics-flow-step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepHearWord family={family} onComplete={() => setCurrentStep(2)} />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div key="build" className="phonics-flow-step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepBuildWord family={family} onComplete={() => setCurrentStep(3)} />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div key="magic" className="phonics-flow-step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepWordMagic family={family} onComplete={() => setCurrentStep("celebration")} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentStep === "celebration" && (
          <Celebration
            letter={`-${family.rime}`}
            title="Nest Built!"
            subtitle={`You built the -${family.rime} words!`}
            learnAnotherLabel="New Words"
            playAgainLabel="Play Again"
            onLearnAnother={onComplete}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
