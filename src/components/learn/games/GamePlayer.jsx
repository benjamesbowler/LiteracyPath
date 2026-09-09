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
import { MusicToggle } from "../../audio/MusicToggle.jsx";
import { ProgressStars } from "./shared/ProgressStars.jsx";
import { premiumProfileForGame } from "./shared/arcadePremiumProfiles.js";
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

function GuideIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M12 17v-5M12 8h.01" />
      <circle cx="12" cy="12" r="9" />
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
  musicEnabled = true,
  progressScopeKey,
  onClose,
  onSoundEnabledChange,
  onMusicEnabledChange,
  onProgressChange
}) {
  const [score, setScore] = useState(0);
  const [showQuit, setShowQuit] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
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
  const savedResultRef = useRef(null);
  const earlyResultRef = useRef(false);
  const playerRef = useRef(null);
  const blockingDialogRef = useRef(null);
  const resumeActionRef = useRef(null);
  const keepPlayingRef = useRef(null);
  const closeGuideRef = useRef(null);
  const completionActionRef = useRef(null);
  const GameComponent = LEARN_GAMES[game.id];
  const world = worldForDifficulty(difficulty);
  const scene = sceneForKey(world, game.id);
  const activeGameSurfaceName = gameFullscreenSurfaceName(game);
  const premiumProfile = premiumProfileForGame(game.id);
  const hasPremiumCompletionOverlay = Boolean(completionResult && premiumProfile && game.id !== "rocket-run");
  const hasBlockingOverlay = startLevel === null || showQuit || showGuide || hasPremiumCompletionOverlay;
  const hasEngineOwnedCompletion = Boolean(completionResult && !hasPremiumCompletionOverlay);

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
    if (musicEnabled && game.id !== "sound-beat") startGameMusic(game.id, { fallbackWorldId: world.id });
    else stopGameMusic();
    return () => stopGameMusic();
  }, [musicEnabled, world.id, game.id]);

  // Freeze the running game while the quit dialog is open or the tab is
  // backgrounded, so a child never loses hearts/words they can't see.
  useEffect(() => {
    if (showQuit || showGuide) engineRef.current?.pause?.();
    else engineRef.current?.resume?.();
    const onVis = () => {
      if (document.hidden) engineRef.current?.pause?.();
      else if (!showQuit && !showGuide) engineRef.current?.resume?.();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [showQuit, showGuide]);

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

  useEffect(() => {
    if (showGuide) closeGuideRef.current?.focus();
  }, [showGuide]);

  useEffect(() => {
    if (hasPremiumCompletionOverlay) completionActionRef.current?.focus();
  }, [hasPremiumCompletionOverlay]);

  useEffect(() => {
    if (!hasEngineOwnedCompletion || game.id === "rocket-run") return;
    const action = [...(playerRef.current?.querySelectorAll(".lg-game-player-main button:not([disabled])") || [])]
      .find(element => !element.closest("[inert]") && element.getClientRects().length > 0);
    action?.focus();
  }, [game.id, hasEngineOwnedCompletion]);

  useEffect(() => {
    if (startLevel === null) resumeActionRef.current?.focus();
  }, [startLevel]);

  // Keep keyboard focus inside the active modal. The game player is portalled
  // to <body>, so host-page controls remain DOM siblings and would otherwise
  // become reachable behind the full-screen surface. When a quit, guide,
  // resume or completion prompt is open, trap within that prompt; otherwise
  // trap within the complete game player.
  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== "Tab") return;
      const scope = blockingDialogRef.current || playerRef.current;
      if (!scope) return;
      const focusable = [...scope.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter(element => !element.closest("[inert]") && element.getClientRects().length > 0);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !scope.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !scope.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [completionResult, showGuide, showQuit, startLevel]);

  // Esc mirrors the close button: opens the quit prompt during play, closes
  // it when open, and leaves directly once the game is complete. The resume
  // prompt (startLevel === null) keeps Esc to itself.
  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== "Escape") return;
      if (startLevel === null) return;
      if (showGuide) setShowGuide(false);
      else if (showQuit) setShowQuit(false);
      else if (completed) closePlayer();
      else setShowQuit(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showGuide, showQuit, completed, startLevel, closePlayer]);

  function handleResultReady(stars, finalScore, wordsCompleted, evidence) {
    if (savedResultRef.current) return savedResultRef.current;
    setCompleted(true);
    // The game reports its score from a stale closure that can miss the
    // final round's points; our own score state is current by now, so
    // take whichever is higher.
    const settledScore = Math.max(Number(finalScore) || 0, Number(score) || 0);
    const receipt = {
      stars: Math.max(1, Math.min(3, Number(stars) || 1)),
      score: settledScore,
      words: Math.max(0, Number(wordsCompleted) || 0),
      evidence: evidence || null
    };
    savedResultRef.current = receipt;
    const nextProgress = saveLearnGameResult(progressScopeKey, game.id, stars, settledScore, wordsCompleted, evidence);
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
    return receipt;
  }

  function handleComplete(stars, finalScore, wordsCompleted, evidence) {
    // Engines adopting final-action saving identify the receipt before Finish.
    // Other engines still report once per run through onComplete; do not let a
    // previous run's receipt suppress their subsequent replay result.
    if (!earlyResultRef.current) savedResultRef.current = null;
    setCompletionResult(handleResultReady(stars, finalScore, wordsCompleted, evidence));
  }

  function handleEarlyResultReady(stars, finalScore, wordsCompleted, evidence) {
    earlyResultRef.current = true;
    return handleResultReady(stars, finalScore, wordsCompleted, evidence);
  }

  function handleSessionStart() {
    savedResultRef.current = null;
    earlyResultRef.current = false;
    setCompleted(false);
    setCompletionResult(null);
    setScore(0);
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
      ref={playerRef}
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
      <header className="lg-game-player-header" inert={hasBlockingOverlay || hasEngineOwnedCompletion ? true : undefined}>
        <div className="lg-game-title-chip">
          <strong>{game.title}</strong>
          <span>{difficulty}</span>
        </div>
        <div className="lg-game-player-center">
          {premiumProfile && <p className="lg-game-mission">{premiumProfile.mission}</p>}
          <div className="lg-game-header-meter" aria-label={`${Math.min(progressStatus.current, progressStatus.total)} of ${progressStatus.total}`}>
            <div><i style={{ width: `${Math.min(100, (progressStatus.current / progressStatus.total) * 100)}%` }} /></div>
            <span>{Math.min(progressStatus.current, progressStatus.total)} of {progressStatus.total}</span>
          </div>
        </div>
        <div className="lg-game-player-actions">
          <span className="lg-game-score">{score} pts</span>
          <span className="lg-sr-only" role="status">{scoreAnnouncement}</span>
          {premiumProfile && (
            <button
              type="button"
              className="lg-phinny-help"
              onClick={() => setShowGuide(true)}
              aria-label={`Open ${game.title} mission guide`}
              title="Mission guide"
            >
              <GuideIcon />
            </button>
          )}
          <SoundToggle enabled={soundEnabled} onToggle={() => onSoundEnabledChange(!soundEnabled)} />
          <MusicToggle
            className="lg-sound-toggle"
            enabled={musicEnabled}
            onToggle={() => onMusicEnabledChange?.(!musicEnabled)}
          />
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

      <main className="lg-game-player-main" inert={hasBlockingOverlay ? true : undefined}>
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
                progressScopeKey={progressScopeKey}
                onScoreUpdate={setScore}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleComplete}
                onResultReady={handleEarlyResultReady}
                onSessionStart={handleSessionStart}
                completionPresentedByPlayer={hasPremiumCompletionOverlay}
                onCheckpoint={handleCheckpoint}
                onEngineReady={api => { engineRef.current = api; }}
                onExit={closePlayer}
                isSoundEnabled={soundEnabled}
                isMusicEnabled={musicEnabled}
              />
            )}
          </Suspense>
        </GameErrorBoundary>
      </main>

      {resumePoint && startLevel === null && (
        <div
          ref={blockingDialogRef}
          className="lg-game-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-label={resumeFullscreenSurfaceName(activeGameSurfaceName)}
        >
          <div>
            <h2>Welcome back</h2>
            <p>You reached level {resumePoint.level + 1}{resumePoint.totalLevels ? ` of ${resumePoint.totalLevels}` : ""}. Pick up where you left off?</p>
            <div>
              <button type="button" ref={resumeActionRef} onClick={continueGame}>Continue</button>
              <button type="button" className="danger" onClick={restartGame}>Start over</button>
            </div>
          </div>
        </div>
      )}

      {showQuit && (
        <div
          ref={blockingDialogRef}
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

      {showGuide && premiumProfile && (
        <div
          ref={blockingDialogRef}
          className="lg-game-confirm lg-premium-guide"
          role="dialog"
          aria-modal="true"
          aria-label={`${game.title} mission guide`}
        >
          <div>
            <span className="lg-premium-guide-kicker">Mission · v{premiumProfile.version}</span>
            <h2>{premiumProfile.mission}</h2>
            <dl>
              <div><dt>What you are practising</dt><dd>{premiumProfile.objective}</dd></div>
              <div><dt>Game action</dt><dd>{premiumProfile.action}</dd></div>
              <div><dt>Try again</dt><dd>{premiumProfile.retry}</dd></div>
            </dl>
            <ul aria-label="Controls">
              {premiumProfile.controls.map(control => <li key={control}>{control}</li>)}
            </ul>
            <div className="lg-premium-guide-actions">
              {soundEnabled && hasRecordedSpeech(game.title) && (
                <button type="button" onClick={() => speak(game.title)}>Hear game name</button>
              )}
              <button type="button" className="primary" ref={closeGuideRef} onClick={() => setShowGuide(false)}>Keep playing</button>
            </div>
          </div>
        </div>
      )}

      {completionResult && premiumProfile && game.id !== "rocket-run" && (
        <div
          ref={blockingDialogRef}
          className="lg-game-confirm lg-premium-complete"
          role="alertdialog"
          aria-modal="true"
          aria-label={`${game.title} complete`}
        >
          <div>
            <span className="lg-premium-guide-kicker">Mission debrief</span>
            <h2>{premiumProfile.completionTitle}</h2>
            <ProgressStars stars={completionResult.stars} size="lg" />
            <p>You earned {completionResult.score} points.</p>
            <div className="lg-premium-complete-stat">
              <strong>{completionResult.words}</strong>
              <span>{premiumProfile.rewardLabel}</span>
            </div>
            <button type="button" className="primary" ref={completionActionRef} onClick={closePlayer}>Back to Arcade</button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export { GAME_LIST };
