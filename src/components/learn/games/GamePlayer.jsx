import { Component, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GAME_LIST } from "../../../data/learnGamesData";
import { cancelSpeech, hasRecordedSpeech, speak } from "../../../utils/learnGamesAudio";
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
import { announceMissionReturn, notifyMissionTaskDone } from "../../../utils/dailyMission.js";
import { SoundToggle } from "./shared/SoundToggle.jsx";
import { worldForDifficulty, worldStyle, sceneForKey } from "../../../utils/palWorlds.js";
import {
  closeFullscreenSurfaceName,
  gameFullscreenSurfaceName,
  quitFullscreenSurfaceName,
  resumeFullscreenSurfaceName
} from "../../../utils/fullscreenOverlayNames.js";
import { LEARN_GAMES } from "./games/index.js";
import {
  exitBrowserFullscreen,
  getBrowserFullscreenElement,
  requestBrowserFullscreen
} from "../../../utils/browserFullscreen.js";

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

// A render throw inside a game must never unmount the whole app. Swap in a
// calm recovery card instead; "Back to Arcade" closes the player cleanly.
class GameErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Learn game crashed:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="lg-game-stage" role="alert">
          <h2>That game tripped over!</h2>
          <p>No worries — your stars are safe. Pick another game to keep playing.</p>
          <button type="button" className="lg-game-primary" onClick={this.props.onExit}>Back to Arcade</button>
        </div>
      );
    }
    return this.props.children;
  }
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
  const [scoreAnnouncement, setScoreAnnouncement] = useState("");
  const wasFullscreenRef = useRef(false);
  const engineRef = useRef(null);
  const announcedMilestoneRef = useRef(0);
  const missionReturnPendingRef = useRef(false);
  const keepPlayingRef = useRef(null);
  const GameComponent = LEARN_GAMES[game.id];
  const world = worldForDifficulty(difficulty);
  const scene = sceneForKey(world, game.id);
  const activeGameSurfaceName = gameFullscreenSurfaceName(game);

  useEffect(() => {
    setActiveLearnGamesProgressScope(progressScopeKey);
    wasFullscreenRef.current = Boolean(getBrowserFullscreenElement(document));

    if (!getBrowserFullscreenElement(document)) {
      void requestBrowserFullscreen(document.documentElement);
    }

    return () => {
      clearActiveLearnGamesProgressScope();
      cancelSpeech();
      cancelGameSfx();
      if (!wasFullscreenRef.current && getBrowserFullscreenElement(document)) {
        void exitBrowserFullscreen(document);
      }
    };
  }, [progressScopeKey]);

  useEffect(() => {
    if (!soundEnabled) cancelSpeech();
  }, [soundEnabled]);

  useEffect(() => {
    // Sound Beat runs its own BPM-synced music engine; the fixed-tempo loop
    // would play on top of it, so the generic track is skipped for that game.
    if (soundEnabled && game.id !== "sound-beat") startGameMusic(game.id, { fallbackWorldId: world.id });
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

  // Closes the player, first firing any held mission return from this
  // session's win (see handleComplete) so the celebration is never cut off.
  const closePlayer = useCallback(() => {
    if (missionReturnPendingRef.current) {
      missionReturnPendingRef.current = false;
      announceMissionReturn("game");
    }
    onClose();
  }, [onClose]);

  // The score chip updates constantly; screen readers only get 50-point
  // milestones so the live region never chatters over the game.
  useEffect(() => {
    const milestone = Math.floor(score / 50) * 50;
    if (milestone >= 50 && milestone > announcedMilestoneRef.current) {
      announcedMilestoneRef.current = milestone;
      setScoreAnnouncement(`${milestone} points!`);
    }
  }, [score]);

  // Focus the quit dialog's safe primary button when it opens.
  useEffect(() => {
    if (showQuit) keepPlayingRef.current?.focus();
  }, [showQuit]);

  // Esc mirrors the close button: opens the quit prompt during play, closes
  // it when open, and leaves directly once the game is complete. The resume
  // prompt (startLevel === null) keeps Esc to itself.
  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== "Escape") return;
      if (startLevel === null) return;
      if (showQuit) setShowQuit(false);
      else if (completed) closePlayer();
      else setShowQuit(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showQuit, completed, startLevel, closePlayer]);

  function handleComplete(stars, finalScore, wordsCompleted) {
    setCompleted(true);
    // The game reports its score from a stale closure that can miss the
    // final round's points; our own score state is current by now, so
    // take whichever is higher.
    const settledScore = Math.max(Number(finalScore) || 0, Number(score) || 0);
    const nextProgress = saveLearnGameResult(progressScopeKey, game.id, stars, settledScore, wordsCompleted);
    clearGameCheckpoint(progressScopeKey, game.id, difficulty); // finished the ladder, nothing to resume
    // Credit the mission's game task now but hold the auto-return: the win
    // celebration is still on screen, and the 1.6s auto-navigate would cut
    // it off. closePlayer() announces the return when the child leaves.
    if (notifyMissionTaskDone(progressScopeKey, "game", { deferReturn: true })) {
      missionReturnPendingRef.current = true;
    }
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
      closePlayer();
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
      aria-label={activeGameSurfaceName}
      data-surface-name={activeGameSurfaceName}
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
          <span>{Math.min(progressStatus.current, progressStatus.total)} of {progressStatus.total}</span>
        </div>
        <div className="lg-game-player-actions">
          <span className="lg-game-score">{score} pts</span>
          <span className="lg-sr-only" role="status">{scoreAnnouncement}</span>
          {hasRecordedSpeech(`${game.title}. ${game.description}`) && (
            <button
              type="button"
              className="lg-phinny-help"
              onClick={() => soundEnabled && speak(`${game.title}. ${game.description}`)}
              aria-label="Hear game instructions"
              title="Hear game instructions"
            >
              <img src="/images/learn-games/phinny-waving.png" alt="" onError={event => { event.currentTarget.style.display = "none"; }} />
            </button>
          )}
          <SoundToggle enabled={soundEnabled} onToggle={() => onSoundEnabledChange(!soundEnabled)} />
          <button
            type="button"
            className="lg-game-close"
            onClick={requestClose}
            aria-label={closeFullscreenSurfaceName(activeGameSurfaceName)}
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <main className="lg-game-player-main">
        <GameErrorBoundary onExit={closePlayer}>
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
                onExit={closePlayer}
                isSoundEnabled={soundEnabled}
              />
            )}
          </Suspense>
        </GameErrorBoundary>
      </main>

      {resumePoint && startLevel === null && (
        <div
          className="lg-game-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-label={resumeFullscreenSurfaceName(activeGameSurfaceName)}
        >
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
        <div
          className="lg-game-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-label={quitFullscreenSurfaceName(activeGameSurfaceName)}
        >
          <div>
            <h2>Leave this game?</h2>
            <p>Your current round will not be saved.</p>
            <div>
              <button type="button" ref={keepPlayingRef} onClick={() => setShowQuit(false)}>Keep playing</button>
              <button type="button" className="danger" onClick={closePlayer}>Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export { GAME_LIST };
