import { useRef } from "react";
import SentenceExpressGame from "./SentenceExpressGame.jsx";
import { LEVELS_PER_LINE } from "../../../../utils/sentenceExpressLevels.js";

/* GamePlayer-contract adapter for Sentence Express.
   The game reports {level, stars, mistakes, express} after EVERY level and
   calls onQuit once when the 10-level line is finished; the arcade expects
   one onComplete(stars, score, words) for the whole run. This wrapper
   accumulates the run and translates. The internal quit button is hidden
   (showQuit=false) so GamePlayer's own close is the only early exit -
   matching every other arcade game (early exit = no completion recorded,
   but per-level checkpoints still allow resuming). */
export default function SentenceExpressArcade({
  difficulty,
  startLevel,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  isSoundEnabled
}) {
  const runRef = useRef({ score: 0, starSum: 0, levelsDone: 0 });
  return (
    <SentenceExpressGame
      difficulty={difficulty}
      startLevel={startLevel || 0}
      isSoundEnabled={isSoundEnabled}
      showQuit={false}
      onComplete={result => {
        const run = runRef.current;
        run.levelsDone += 1;
        run.starSum += Math.max(0, Number(result?.stars) || 0);
        run.score += (Math.max(0, Number(result?.stars) || 0) * 10) + (Math.max(0, Number(result?.express) || 0) * 5);
        onScoreUpdate?.(run.score);
        onProgressUpdate?.(Math.min(run.levelsDone, LEVELS_PER_LINE), LEVELS_PER_LINE);
        onCheckpoint?.(Math.min((Number(result?.level) || 0) + 1, LEVELS_PER_LINE - 1), LEVELS_PER_LINE);
      }}
      onQuit={() => {
        const run = runRef.current;
        if (run.levelsDone >= LEVELS_PER_LINE) {
          // Shared rubric: finishing the whole line is worth at least 1 star.
          const stars = Math.max(1, Math.round(run.starSum / run.levelsDone));
          onComplete?.(stars, run.score, run.levelsDone);
        }
      }}
    />
  );
}
