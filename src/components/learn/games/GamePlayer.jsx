import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GAME_LIST } from "../../../data/learnGamesData";
import { cancelSpeech, speak } from "../../../utils/learnGamesAudio";
import { cancelGameSfx } from "../../../utils/audio/gameSfx";
import { startGameMusic, stopGameMusic } from "../../../utils/audio/gameMusic.js";
import {
  clearActiveLearnGamesProgressScope,
  saveLearnGameResult,
  setActiveLearnGamesProgressScope,
  loadGameCheckpoint,
  saveGameCheckpoint,
  clearGameCheckpoint
} from "../../../utils/learnGamesProgress";
import { notifyMissionTaskDone } from "../../../utils/dailyMission.js";
import { SoundToggle } from "./shared/SoundToggle.jsx";
import { worldForDifficulty, worldStyle, sceneForKey } from "../../../utils/palWorlds.js";
import { LEARN_GAMES } from "./games/index.js";

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function GamePlayer({
  game,
  difficulty,
  soundEnabled,
  progressScopeKey,
  onClose,
  onSoundEnabledChange,
  onProgressChange
}) {
  const [score, setScore] = useState(0);
  const [showQuit, setShowQuit] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progressStatus, setProgressStatus] = useState({ current: 0, total: 1 });
  // Resume: check for a saved checkpoint once, on open. difficulty is fixed for a
  // GamePlayer's lifetime (chosen in the arcade before entry), so a lazy initial
  // read is correct and avoids a blank first frame. resumePoint set => show the
  // Continue / Start-over prompt and hold the game until the child chooses.
  const [resumePoint, setResumePoint] = useState(() => loadGameCheckpoint(progressScopeKey, game.id, difficulty));
  const [startLevel, setStartLevel] = useState(() => (loadGameCheckpoint(progressScopeKey, game.id, difficulty) ? null : 0));
  const wasFullscreenRef = useRef(false);
  const engineRef = useRef(null);
  const GameComponent = LEARN_GAMES[game.id];
  const world = worldForDifficulty(difficulty);
  const scene = sceneForKey(world, game.id);

  useEffect(() => {
    setActiveLearnGamesProgressScope(progressScopeKey);
    wasFullscreenRef.current = Boolean(document.fullscreenElement);

    if (document.documentElement?.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    return () => {
      clearActiveLearnGamesProgressScope();
      cancelSpeech();
      cancelGameSfx();
      if (!wasFullscreenRef.current && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [progressScopeKey]);

  useEffect(() => {
    if (!soundEnabled) cancelSpeech();
  }, [soundEnabled]);

  useEffect(() => {
    if (soundEnabled) startGameMusic(game.id, { fallbackWorldId: world.id });
    else stopGameMusic();
    return () => stopGameMusic();
  }, [soundEnabled, world.id, game.id]);

  // Freeze the running game while the quit dialog is open or the tab is
  // backgrounded, so a child never loses hearts/words they can't see.
  useEffect(() => {
    if (showQuit) engineRef.current?.pause?.();
    else engineRef.current?.resume?.();
    const onVis = () => {
      if (document.hidden) engineRef.current?.pause?.();
      else if (!showQuit) engineRef.current?.resume?.();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [showQuit]);

  function handleComplete(stars, finalScore, wordsCompleted) {
    setCompleted(true);
    // The game reports its score from a stale closure that can miss the
    // final round's points; our own score state is current by now, so
    // take whichever is higher.
    const settledScore = Math.max(Number(finalScore) || 0, Number(score) || 0);
    const nextProgress = saveLearnGameResult(progressScopeKey, game.id, stars, settledScore, wordsCompleted);
    clearGameCheckpoint(progressScopeKey, game.id, difficulty); // finished the ladder, nothing to resume
    notifyMissionTaskDone(progressScopeKey, "game");
    // Rewards are coins only (derived from stars in the Hollow economy) -
    // no separate gem/collectible awards.
    onProgressChange?.(nextProgress);
  }

  // Stable identity + no-op on identical values. A fresh callback every
  // render fed an effect inside the game engine, which re-rendered this
  // component, which made a fresh callback... an infinite render loop that
  // froze games and reshuffled answer options every frame.
  const handleCheckpoint = useCallback((level, total) => {
    saveGameCheckpoint(progressScopeKey, game.id, difficulty, level, total);
  }, [progressScopeKey, game.id, difficulty]);

  function continueGame() {
    setStartLevel(resumePoint ? resumePoint.level : 0);
    setResumePoint(null);
  }

  function restartGame() {
    clearGameCheckpoint(progressScopeKey, game.id, difficulty);
    setStartLevel(0);
    setResumePoint(null);
  }

  const handleProgressUpdate = useCallback((current, total) => {
    const next = {
      current: Math.max(0, Number(current) || 0),
      total: Math.max(1, Number(total) || 1)
    };
    setProgressStatus(previous =>
      previous.current === next.current && previous.total === next.total ? previous : next
    );
  }, []);

  function requestClose() {
    if (completed) {
      onClose();
      return;
    }
    setShowQuit(true);
  }

  if (!GameComponent) return null;

  // Portal to <body> so the fixed full-screen modal can't be trapped by an
  // ancestor containing block (the app wraps views in framer-motion elements,
  // whose transform would otherwise anchor position:fixed to the wrapper and
  // leave the game as a small band with the page showing around it).
  return createPortal(
    <div
      className="lg-game-player"
      role="dialog"
      aria-modal="true"
      aria-label={game.title}
      data-pal-world={world.id}
      data-fullbleed={game.fullBleed ? "" : undefined}
      style={{ "--game-accent": game.accent, "--game-accent-soft": game.accentSoft, ...worldStyle(world), "--pal-scene": `url(${scene})` }}
    >
      <div className="pal-scene-backdrop" aria-hidden="true" />
      <header className="lg-game-player-header">
        <div className="lg-game-title-chip">
          <strong>{game.title}</strong>
          <span>{difficulty}</span>
        </div>
        <div className="lg-game-header-meter" aria-label={`${Math.min(progressStatus.current, progressStatus.total)} of ${progressStatus.total}`}>
          <div><i style={{ width: `${Math.min(100, (progressStatus.current / progressStatus.total) * 100)}%` }} /></div>
          <span>{Math.min(progressStatus.current, progressStatus.total)}/{progressStatus.total}</span>
        </div>
        <div className="lg-game-player-actions">
          <span className="lg-game-score" aria-live="polite" aria-atomic="true">{score} pts</span>
          <button
            type="button"
            className="lg-phinny-help"
            onClick={() => soundEnabled && speak(`${game.title}. ${game.description}`)}
            aria-label="Hear game instructions"
            title="Hear game instructions"
          >
            <img src="/images/learn-games/phinny-waving.png" alt="" onError={event => { event.currentTarget.style.display = "none"; }} />
          </button>
          <SoundToggle enabled={soundEnabled} onToggle={() => onSoundEnabledChange(!soundEnabled)} />
          <button type="button" className="lg-game-close" onClick={requestClose} aria-label="Close game">
            <CloseIcon />
          </button>
        </div>
      </header>

      <main className="lg-game-player-main">
        <Suspense
          fallback={
            <div className="lg-game-loading">
              <img src="/images/learn-games/phinny-thinking.webp" alt="" width="110" height="110" onError={event => { event.currentTarget.style.display = "none"; }} />
              Loading game...
            </div>
          }
        >
          {startLevel !== null && (
            <GameComponent
              difficulty={difficulty}
              startLevel={startLevel}
              onScoreUpdate={setScore}
              onProgressUpdate={handleProgressUpdate}
              onComplete={handleComplete}
              onCheckpoint={handleCheckpoint}
              onEngineReady={api => { engineRef.current = api; }}
              isSoundEnabled={soundEnabled}
            />
          )}
        </Suspense>
      </main>

      {resumePoint && startLevel === null && (
        <div className="lg-game-confirm" role="alertdialog" aria-modal="true" aria-label="Resume game">
          <div>
            <h2>Welcome back</h2>
            <p>You reached level {resumePoint.level + 1}{resumePoint.totalLevels ? ` of ${resumePoint.totalLevels}` : ""}. Pick up where you left off?</p>
            <div>
              <button type="button" onClick={continueGame}>Continue</button>
              <button type="button" className="danger" onClick={restartGame}>Start over</button>
            </div>
          </div>
        </div>
      )}

      {showQuit && (
        <div className="lg-game-confirm" role="alertdialog" aria-modal="true" aria-label="Quit game">
          <div>
            <h2>Leave this game?</h2>
            <p>Your current round will not be saved.</p>
            <div>
              <button type="button" onClick={() => setShowQuit(false)}>Keep playing</button>
              <button type="button" className="danger" onClick={onClose}>Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export { GAME_LIST };
