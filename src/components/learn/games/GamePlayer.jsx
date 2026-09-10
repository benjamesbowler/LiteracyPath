import { useActivityMusic } from "../../../utils/audio/useActivityMusic.js";
import { Component, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GAME_LIST } from "../../../data/learnGamesData";
import { cancelSpeech, hasRecordedSpeech, speak } from "../../../utils/learnGamesAudio";
import { cancelGameSfx } from "../../../utils/audio/gameSfx";
import { startGameMusic, stopGameMusic } from "../../../utils/audio/gameMusic.js";
import {
  clearActiveLearnGamesProgressScope,
  saveLearnGameResult,
  queueLearnGamesProgress,
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
  difficulty: initialDifficulty,
  soundEnabled,
  progressScopeKey,
  onClose,
  onSoundEnabledChange,
  onProgressChange
}) {
  const [musicEnabled, onMusicEnabledChange] = useActivityMusic(`${progressScopeKey}:${game.id}`);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [runIndex, setRunIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showQuit, setShowQuit] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [saveRecovery, setSaveRecovery] = useState(false);
  const [progressStatus, setProgressStatus] = useState({ current: 0, total: 1 });
  // Resume the initially selected course. Continuing after completion can move
  // to another difficulty without leaving the game. resumePoint set => show the
  // Continue / Start-over prompt and hold the game until the child chooses.
  const [resumePoint, setResumePoint] = useState(() => loadGameCheckpoint(progressScopeKey, game.id, difficulty));
  const [startLevel, setStartLevel] = useState(() => (loadGameCheckpoint(progressScopeKey, game.id, difficulty) ? null : 0));
  const [scoreAnnouncement, setScoreAnnouncement] = useState("");
  const wasFullscreenRef = useRef(false);
  const engineRef = useRef(null);
  const announcedMilestoneRef = useRef(0);
  const missionReturnPendingRef = useRef(false);
  const savedResultRef = useRef(null);
  // At most one pending receipt belongs to this mounted run. Only explicit
  // retry may resubmit its fixed arguments (or enqueue its already saved row).
  const pendingResultRef = useRef(null);
  const earlyResultRef = useRef(false);
  const playerRef = useRef(null);
  const blockingDialogRef = useRef(null);
  const resumeActionRef = useRef(null);
  const keepPlayingRef = useRef(null);
  const closeGuideRef = useRef(null);
  const completionActionRef = useRef(null);
  const retrySaveRef = useRef(null);
  const GameComponent = LEARN_GAMES[game.id];
  const world = worldForDifficulty(difficulty);
  const scene = sceneForKey(world, game.id);
  const activeGameSurfaceName = gameFullscreenSurfaceName(game);
  const premiumProfile = premiumProfileForGame(game.id);
  const hasPremiumCompletionOverlay = Boolean(completionResult && premiumProfile && premiumProfile.completionPresentation !== "engine");
  const hasBlockingOverlay = startLevel === null || showQuit || showGuide || hasPremiumCompletionOverlay || saveRecovery;
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
    if (showQuit || showGuide || saveRecovery || document.hidden) engineRef.current?.pause?.();
    else engineRef.current?.resume?.();
    const onVis = () => {
      if (document.hidden) engineRef.current?.pause?.();
      else if (!showQuit && !showGuide && !pendingResultRef.current) engineRef.current?.resume?.();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [showQuit, showGuide, saveRecovery]);

  // Closes the player, first firing any held mission return from this
  // session's win (see handleComplete) so the celebration is never cut off.
  const closePlayer = useCallback(() => {
    if (pendingResultRef.current) {
      setSaveRecovery(pendingResultRef.current.savedProgress ? "sync" : true);
      retrySaveRef.current?.focus();
      return false;
    }
    if (missionReturnPendingRef.current) {
      missionReturnPendingRef.current = false;
      announceMissionReturn("game");
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (saveRecovery) retrySaveRef.current?.focus();
  }, [saveRecovery]);

  useEffect(() => {
    const onBeforeUnload = event => {
      if (!pendingResultRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

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
    if (!hasEngineOwnedCompletion || premiumProfile?.completionPresentation === "engine") return;
    const action = [...(playerRef.current?.querySelectorAll(".lg-game-player-main button:not([disabled])") || [])]
      .find(element => !element.closest("[inert]") && element.getClientRects().length > 0);
    action?.focus();
  }, [game.id, hasEngineOwnedCompletion, premiumProfile]);

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
      if (pendingResultRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        retrySaveRef.current?.focus();
        return;
      }
      if (startLevel === null) return;
      if (showGuide) setShowGuide(false);
      else if (showQuit) setShowQuit(false);
      else if (completed) closePlayer();
      else setShowQuit(true);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [showGuide, showQuit, completed, startLevel, closePlayer]);

  function retryResultSave() {
    const pending = pendingResultRef.current;
    if (!pending) return savedResultRef.current || false;
    let nextProgress = pending.savedProgress;
    let syncFailed = false;
    try {
      if (nextProgress) queueLearnGamesProgress(pending.args[0], nextProgress);
      else nextProgress = saveLearnGameResult(...pending.args);
    } catch (error) {
      nextProgress = pending.savedProgress || error?.savedProgress;
      if (nextProgress) pending.savedProgress = nextProgress;
      setShowQuit(false);
      setShowGuide(false);
      setSaveRecovery(nextProgress ? "sync" : true);
      engineRef.current?.pause?.();
      if (!nextProgress) return false;
      syncFailed = true;
    }
    // Mark saved only after the atomic local commit. Cache before invoking
    // observers so even a re-entrant callback cannot duplicate this run.
    const firstCommit = !savedResultRef.current;
    savedResultRef.current = pending.receipt;
    setCompleted(true);
    if (!syncFailed) {
      pendingResultRef.current = null;
      setSaveRecovery(false);
      if (pending.presentCompletion) setCompletionResult(pending.receipt);
    }
    // Keep the existing deferred mission return, independently of presentation.
    // Observer errors must not turn a committed result back into a failed save.
    if (firstCommit) {
      try {
        if (notifyMissionTaskDone(pending.args[0], "game", { deferReturn: true })) {
          missionReturnPendingRef.current = true;
        }
      } catch (error) {
        console.error("Game saved; mission notification failed:", error);
      }
      try {
        onProgressChange?.(nextProgress);
      } catch (error) {
        console.error("Game saved; progress notification failed:", error);
      }
    }
    return pending.receipt;
  }

  function handleResultReady(stars, finalScore, wordsCompleted, evidence, presentCompletion = false) {
    if (pendingResultRef.current) {
      if (presentCompletion) pendingResultRef.current.presentCompletion = true;
      return savedResultRef.current || false;
    }
    if (savedResultRef.current) {
      if (presentCompletion) setCompletionResult(savedResultRef.current);
      return savedResultRef.current;
    }
    // The game reports its score from a stale closure that can miss the
    // final round's points; our own score state is current by now, so
    // take whichever is higher.
    const settledScore = Math.max(Number(finalScore) || 0, Number(score) || 0);
    const receipt = {
      stars: Math.max(1, Math.min(3, Number(stars) || 1)),
      score: settledScore,
      words: Math.max(0, Number(wordsCompleted) || 0),
      evidence: evidence ? structuredClone(evidence) : null
    };
    pendingResultRef.current = {
      receipt,
      args: [progressScopeKey, game.id, stars, settledScore, wordsCompleted, receipt.evidence, difficulty],
      presentCompletion
    };
    return retryResultSave();
  }

  function handleComplete(stars, finalScore, wordsCompleted, evidence) {
    return handleResultReady(stars, finalScore, wordsCompleted, evidence, true);
  }

  function handleEarlyResultReady(stars, finalScore, wordsCompleted, evidence) {
    earlyResultRef.current = true;
    return handleResultReady(stars, finalScore, wordsCompleted, evidence);
  }

  function handleSessionStart() {
    if (pendingResultRef.current) return false;
    savedResultRef.current = null;
    earlyResultRef.current = false;
    setCompleted(false);
    setCompletionResult(null);
    setScore(0);
    setProgressStatus({ current: 0, total: 1 });
    announcedMilestoneRef.current = 0;
    setScoreAnnouncement("");
    return true;
  }

  function startAnotherRun(advance) {
    // A failed/pending receipt must be recovered before replacing its engine.
    if (pendingResultRef.current || !savedResultRef.current) return false;
    const nextDifficulty = advance
      ? ({ easy: "medium", medium: "hard", hard: "hard" }[difficulty] || difficulty)
      : difficulty;
    cancelSpeech();
    cancelGameSfx();
    engineRef.current?.pause?.();
    engineRef.current = null;
    handleSessionStart();
    setDifficulty(nextDifficulty);
    const checkpoint = advance && nextDifficulty !== difficulty
      ? loadGameCheckpoint(progressScopeKey, game.id, nextDifficulty) : null;
    setResumePoint(checkpoint);
    setStartLevel(checkpoint ? null : 0);
    setRunIndex(index => index + 1);
    return true;
  }

  // Stable identity + no-op on identical values. A fresh callback every
  // render fed an effect inside the game engine, which re-rendered this
  // component, which made a fresh callback... an infinite render loop that
  // froze games and reshuffled answer options every frame.
  const handleCheckpoint = useCallback((level, total) => {
    if (pendingResultRef.current || savedResultRef.current) return;
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
    if (pendingResultRef.current) return;
    const next = {
      current: Math.max(0, Number(current) || 0),
      total: Math.max(1, Number(total) || 1)
    };
    // Older engines have no onSessionStart. New active play, rather than a
    // repeated onComplete or rerender, establishes their next run.
    if (savedResultRef.current && !earlyResultRef.current && next.current < next.total) {
      savedResultRef.current = null;
      setCompleted(false);
      setCompletionResult(null);
      setScore(0);
    }
    setProgressStatus(previous =>
      previous.current === next.current && previous.total === next.total ? previous : next
    );
  }, []);

  function requestClose() {
    if (pendingResultRef.current) {
      closePlayer();
      return;
    }
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
                key={`${game.id}:${difficulty}:${runIndex}`}
                difficulty={difficulty}
                sessionSeed={runIndex}
                startLevel={startLevel}
                progressScopeKey={progressScopeKey}
                onScoreUpdate={setScore}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleComplete}
                onResultReady={handleEarlyResultReady}
                onSessionStart={handleSessionStart}
                onRequestNextLevel={() => startAnotherRun(true)}
                onRequestReplay={() => startAnotherRun(false)}
                completionPresentedByPlayer={hasPremiumCompletionOverlay}
                onCheckpoint={handleCheckpoint}
                onEngineReady={api => {
                  engineRef.current = api;
                  if (pendingResultRef.current) api?.pause?.();
                }}
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
            <p>You reached checkpoint {resumePoint.level + 1}{resumePoint.totalLevels ? ` of ${resumePoint.totalLevels}` : ""}. Pick up where you left off?</p>
            <div>
              <button type="button" ref={resumeActionRef} onClick={continueGame}>Continue</button>
              <button type="button" className="danger" onClick={restartGame}>Start over</button>
            </div>
          </div>
        </div>
      )}

      {saveRecovery && (
        <div
          ref={blockingDialogRef}
          className="lg-game-confirm"
          role="dialog"
          aria-modal="true"
          aria-label="Save game progress"
          aria-describedby="game-save-recovery-message"
        >
          <div>
            <h2>Let’s save your game</h2>
            <p id="game-save-recovery-message" role="status">{saveRecovery === "sync"
              ? "Your result is saved on this device. Try again to sync your progress."
              : "Your result has not been saved. Try again before you leave."}</p>
            <div>
              <button type="button" className="primary" ref={retrySaveRef} onClick={retryResultSave}>Try saving again</button>
              <button type="button" className="danger" onClick={() => {
                pendingResultRef.current = null;
                setSaveRecovery(false);
                closePlayer();
              }}>{saveRecovery === "sync" ? "Leave game" : "Leave without saving"}</button>
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
            <p>Your saved progress will be kept.</p>
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

      {hasPremiumCompletionOverlay && (
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
            <div className="lg-completion-actions">
              <button type="button" className="primary" ref={completionActionRef} onClick={() => startAnotherRun(true)}>Next level</button>
              <button type="button" onClick={() => startAnotherRun(false)}>Replay level</button>
              <button type="button" onClick={closePlayer}>Back to Arcade</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export { GAME_LIST };
