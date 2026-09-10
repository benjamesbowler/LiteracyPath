import { useEffect, useRef, useState } from "react";
import { loadLearnGamesProgress } from "../../../../utils/learnGamesProgress.js";
import { expressSessionKey, loadExpressSnapshot, saveExpressSnapshot } from "./sentenceExpressSession.js";
import SentenceExpressGame from "./SentenceExpressGame.jsx";
import { LEVELS_PER_LINE, buildLevel } from "../../../../utils/sentenceExpressLevels.js";

// Static card (no animated intro) so prefers-reduced-motion is respected.
// Ticket-stub styling echoes the game's sx palette (parchment/ink/brass).

/* GamePlayer-contract adapter for Sentence Express.
   The game reports {level, stars, mistakes, express} after EVERY level and
   calls onQuit once when the 10-level line is finished; the arcade expects
   one onComplete(stars, score, words) for the whole run. This wrapper
   accumulates the run and translates. The internal quit button is hidden
   (showQuit=false) so GamePlayer's own close is the only early exit -
   matching every other arcade game (early exit = no completion recorded,
   but per-level checkpoints still allow resuming).
   Resume: GamePlayer restarts at its level checkpoint. A scoped sidecar
   retains the earlier totals from this same run; without it the remaining
   levels form a valid resumed run. The game separately keeps its partly
   built train, so an interrupted journey never awards its departure twice. */
export default function SentenceExpressArcade({
  difficulty,
  startLevel,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled,
  progressScopeKey = "default",
  onSessionStart,
  onRequestNextLevel,
  onRequestReplay
}) {
  const start = Math.max(0, Math.min(LEVELS_PER_LINE - 1, Number(startLevel) || 0));
  const key = expressSessionKey(progressScopeKey, difficulty);
  const [resumeEligible] = useState(() => loadLearnGamesProgress(progressScopeKey).games?.["sentence-express"]?.checkpoints?.[difficulty] !== undefined);
  const [initialRun] = useState(() => (resumeEligible && loadExpressSnapshot(`${key}:run`, start)?.run) || { score: 0, starSum: 0, levelsDone: 0, words: 0, baseStart: start });
  const runRef = useRef(initialRun);
  useEffect(() => { onSessionStart?.(); onScoreUpdate?.(initialRun.score); onProgressUpdate?.(start, LEVELS_PER_LINE); onCheckpoint?.(start, LEVELS_PER_LINE); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- one explicit session boundary per mount


  return (
    <SentenceExpressGame
      difficulty={difficulty}
      startLevel={start}
      sessionKey={key}
      resumeEligible={resumeEligible}
      isSoundEnabled={isSoundEnabled}
      showQuit={false}
      onEngineReady={onEngineReady}
      onRequestNextLevel={onRequestNextLevel}
      onRequestReplay={onRequestReplay}
      onReplay={() => {
        runRef.current = { score: 0, starSum: 0, levelsDone: 0, words: 0, baseStart: 0 };
        saveExpressSnapshot(`${key}:run`, null);
        onSessionStart?.();
        onScoreUpdate?.(0);
        onProgressUpdate?.(0, LEVELS_PER_LINE);
        onCheckpoint?.(0, LEVELS_PER_LINE);
      }}
      onComplete={result => {
        const run = runRef.current;
        run.levelsDone += 1;
        run.starSum += Math.max(0, Number(result?.stars) || 0);
        run.score += (Math.max(0, Number(result?.stars) || 0) * 10) + (Math.max(0, Number(result?.express) || 0) * 5);
        // Levels are deterministic: rebuild the one just finished to count
        // the train words the child actually coupled.
        run.words += buildLevel(difficulty, Number(result?.level) || 0)
          .trains.reduce((sum, t) => sum + t.words.length, 0);
        saveExpressSnapshot(`${key}:run`, { levelIndex: Math.min((Number(result?.level) || 0) + 1, LEVELS_PER_LINE - 1), run });
        onScoreUpdate?.(run.score);
        onProgressUpdate?.(Math.min(run.baseStart + run.levelsDone, LEVELS_PER_LINE), LEVELS_PER_LINE);
        onCheckpoint?.(Math.min((Number(result?.level) || 0) + 1, LEVELS_PER_LINE - 1), LEVELS_PER_LINE);
      }}
      onQuit={() => {
        const run = runRef.current;
        if (run.levelsDone >= LEVELS_PER_LINE - run.baseStart) {
          // Shared rubric: finishing the whole line is worth at least 1 star.
          const stars = Math.max(1, Math.round(run.starSum / run.levelsDone));
          saveExpressSnapshot(`${key}:run`, null);
          onComplete?.(stars, run.score, run.words);
        }
      }}
    />
  );
}
