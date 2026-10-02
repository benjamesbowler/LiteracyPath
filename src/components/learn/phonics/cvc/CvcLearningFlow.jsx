import { loadCvcPracticeSession, saveCvcPracticeSession } from "../../../../utils/letterPracticeProgress.js";
import { usePhonicsCompletion } from "../usePhonicsCompletion.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhonicsProgressBar from "../components/PhonicsProgressBar";
import Celebration from "../components/learning/Celebration";
import StepBuildWord from "./StepBuildWord";
import StepHearWord from "./StepHearWord";
import StepWordMagic from "./StepWordMagic";

export function CvcLearningFlow({ family, initialStep = 1, onBack, onComplete, onExit = onBack, progressScopeKey = "default" }) {
  const [session, setSession] = useState(() => { const saved = loadCvcPracticeSession(progressScopeKey, family.id); return saved?.recoveryIssue ? { ...saved, step: 1, evidence: [] } : saved || { id: globalThis.crypto.randomUUID(), step: initialStep, evidence: [], checkpoint: null }; });
  const currentStep = session.step;
  const [checkpointFailed, setCheckpointFailed] = useState(false);
  const saveSession = useCallback(next => { const ok = saveCvcPracticeSession(progressScopeKey, family.id, next); setSession(next); setCheckpointFailed(!ok); return ok; }, [progressScopeKey, family.id]);
  const { complete, saveFailed, retrySave, resetCompletion, retainedCompletion } = usePhonicsCompletion(onComplete, session.completion || null);
  useEffect(() => { if (currentStep === "celebration" && !saveFailed) saveCvcPracticeSession(progressScopeKey, family.id, null); }, [currentStep, saveFailed, progressScopeKey, family.id]);
  const stepEvidence = useRef(session.evidence);
  const committed = useRef(false);
  const handleStep = useCallback((evidence, next) => {
    if (committed.current) return;
    stepEvidence.current = [...stepEvidence.current.filter(row => row.step !== evidence.step), evidence];
    if (next === "celebration") {
      committed.current = true;
      complete(stepEvidence.current);
    }
    saveSession({ ...session, step: next, evidence: stepEvidence.current, ...(next === "celebration" ? { completion: retainedCompletion.current } : { checkpoint: null }) });
  }, [complete, saveSession, session, retainedCompletion]);

  const progressSteps = useMemo(() => [
    currentStep === 1 ? "active" : "complete",
    currentStep === 2 ? "active" : currentStep === 3 || currentStep === "celebration" ? "complete" : "upcoming",
    currentStep === 3 ? "active" : currentStep === "celebration" ? "complete" : "upcoming"
  ], [currentStep]);

  const handlePlayAgain = useCallback(() => { if (saveFailed) return;
    resetCompletion(); committed.current = false; stepEvidence.current = []; saveSession({ id: globalThis.crypto.randomUUID(), step: 1, evidence: [], checkpoint: null }); }, [resetCompletion, saveFailed, saveSession]);

  if (session.recoveryIssue) return <div role="alert"><h2>Your saved practice is kept safe.</h2><p>This version cannot open it. Ask a grown-up to update the app, then carry on.</p><button type="button" onClick={onBack}>Back to words</button></div>;
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

      {checkpointFailed && <p role="status">Keep this page open. Your device could not save this practice place.</p>}
      {saveFailed && <div role="alert"><p>Your practice is kept on this page. Keep it open and retry saving before leaving.</p><button type="button" onClick={retrySave}>Retry save</button></div>}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="hear" className="phonics-flow-step kg-child-flow__step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepHearWord family={family} onComplete={evidence => handleStep(evidence, 2)} />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div key="build" className="phonics-flow-step kg-child-flow__step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepBuildWord sessionId={session.id} family={family} checkpoint={session.checkpoint} onCheckpoint={checkpoint => saveSession({ ...session, checkpoint })} onComplete={evidence => handleStep(evidence, 3)} />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div key="magic" className="phonics-flow-step kg-child-flow__step" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <StepWordMagic sessionId={session.id} family={family} checkpoint={session.checkpoint} onCheckpoint={checkpoint => saveSession({ ...session, checkpoint })} onComplete={evidence => handleStep(evidence, "celebration")} />
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
