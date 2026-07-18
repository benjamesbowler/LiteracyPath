import { useRef } from "react";
import SentenceExpressGame from "./SentenceExpressGame.jsx";
import { LEVELS_PER_LINE, buildLevel } from "../../../../utils/sentenceExpressLevels.js";

/* GamePlayer-contract adapter for Sentence Express.
   The game reports {level, stars, mistakes, express} after EVERY level and
   calls onQuit once when the 10-level line is finished; the arcade expects
   one onComplete(stars, score, words) for the whole run. This wrapper
   accumulates the run and translates. The internal quit button is hidden
   (showQuit=false) so GamePlayer's own close is the only early exit -
   matching every other arcade game (early exit = no completion recorded,
   but per-level checkpoints still allow resuming).
   Resume: GamePlayer restarts a checkpointed run at startLevel, so only the
   remaining levels (LEVELS_PER_LINE - startLevel) are played this session;
   completion - and the word tally - are measured against those, not the
   full line, or a resumed run could never finish nor clear its checkpoint. */
export default function SentenceExpressArcade({
  difficulty,
  startLevel,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled
}) {
  const start = Math.max(0, Math.min(LEVELS_PER_LINE - 1, Number(startLevel) || 0));
  const runRef = useRef({ score: 0, starSum: 0, levelsDone: 0, words: 0 });
  return (
    <SentenceExpressGame
      difficulty={difficulty}
      startLevel={start}
      isSoundEnabled={isSoundEnabled}
      showQuit={false}
      onEngineReady={onEngineReady}
      onComplete={result => {
        const run = runRef.current;
        run.levelsDone += 1;
        run.starSum += Math.max(0, Number(result?.stars) || 0);
        run.score += (Math.max(0, Number(result?.stars) || 0) * 10) + (Math.max(0, Number(result?.express) || 0) * 5);
        // Levels are deterministic: rebuild the one just finished to count
        // the train words the child actually coupled.
        run.words += buildLevel(difficulty, Number(result?.level) || 0)
          .trains.reduce((sum, t) => sum + t.words.length, 0);
        onScoreUpdate?.(run.score);
        onProgressUpdate?.(Math.min(start + run.levelsDone, LEVELS_PER_LINE), LEVELS_PER_LINE);
        onCheckpoint?.(Math.min((Number(result?.level) || 0) + 1, LEVELS_PER_LINE - 1), LEVELS_PER_LINE);
      }}
      onQuit={() => {
        const run = runRef.current;
        if (run.levelsDone >= LEVELS_PER_LINE - start) {
          // Shared rubric: finishing the whole line is worth at least 1 star.
          const stars = Math.max(1, Math.round(run.starSum / run.levelsDone));
          onComplete?.(stars, run.score, run.words);
        }
      }}
    />
  );
}
