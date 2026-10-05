import { useRef, useState } from "react";
import { loadLearnGamesProgress } from "../../../../utils/learnGamesProgress.js";
import { expressSessionKey } from "./sentenceExpressSession.js";
import SentenceExpressGame from "./SentenceExpressGame.jsx";
import { LEVELS_PER_LINE } from "../../../../utils/sentenceExpressLevels.js";
import { SENTENCE_EXPRESS_ATLASES, SENTENCE_EXPRESS_YARDS } from "./sentenceExpressArt.generated.js";

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
   Resume: the existing scoped practice session owns actual partial assembly,
   Send/readback and canonical stage awards. Earlier valid sidecar totals are
   migrated as explicitly legacy aggregates, never fabricated v2 responses.
   The original train interaction and meaningful Send remain authoritative. */
export default function SentenceExpressArcade({
  difficulty,
  sessionSeed = 0,
  journey = null,
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
  const runRef = useRef({ score: 0, starSum: 0, levelsDone: 0, words: 0, baseStart: start });


  return (
    <SentenceExpressGame
      difficulty={difficulty}
      sessionSeed={sessionSeed}
      journey={journey}
      progressScopeKey={progressScopeKey}
      startLevel={start}
      sessionKey={key}
      resumeEligible={resumeEligible}
      isSoundEnabled={isSoundEnabled}
      showQuit={false}
      authoredAtlases={SENTENCE_EXPRESS_ATLASES}
      authoredYards={SENTENCE_EXPRESS_YARDS}
      onEngineReady={onEngineReady}
      onRequestNextLevel={onRequestNextLevel}
      onRequestReplay={onRequestReplay}
      onSessionStart={onSessionStart}
      onCheckpoint={onCheckpoint}
      onPracticeReady={({ runTotals }) => {
        runRef.current = runTotals;
        onScoreUpdate?.(runTotals.score);
        onProgressUpdate?.(Math.min(runTotals.baseStart + runTotals.levelsDone, LEVELS_PER_LINE), LEVELS_PER_LINE);
      }}
      onReplay={() => {
        runRef.current = { score: 0, starSum: 0, levelsDone: 0, words: 0, baseStart: 0 };
        onScoreUpdate?.(0);
        onProgressUpdate?.(0, LEVELS_PER_LINE);
      }}
      onComplete={result => {
        const run = result.runTotals;
        runRef.current = run;
        onScoreUpdate?.(run.score);
        onProgressUpdate?.(Math.min(run.baseStart + run.levelsDone, LEVELS_PER_LINE), LEVELS_PER_LINE);
      }}
      onQuit={evidence => {
        const run = runRef.current;
        if (run.levelsDone >= LEVELS_PER_LINE - run.baseStart) {
          // Shared rubric: finishing the whole line is worth at least 1 star.
          const stars = Math.max(1, Math.round(run.starSum / run.levelsDone));
          onComplete?.(stars, run.score, run.words, evidence);
        }
      }}
    />
  );
}
