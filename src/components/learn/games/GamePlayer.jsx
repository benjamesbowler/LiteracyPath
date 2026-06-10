import { Suspense, useEffect, useRef, useState } from "react";
import { GAME_LIST } from "../../../data/learnGamesData";
import { cancelSpeech } from "../../../utils/learnGamesAudio";
import { cancelGameSfx } from "../../../utils/audio/gameSfx";
import {
  clearActiveLearnGamesProgressScope,
  saveLearnGameResult,
  setActiveLearnGamesProgressScope
} from "../../../utils/learnGamesProgress";
import { SoundToggle } from "./shared/SoundToggle.jsx";
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
  const wasFullscreenRef = useRef(false);
  const resultSavedRef = useRef(false);
  const GameComponent = LEARN_GAMES[game.id];

  useEffect(() => {
    setActiveLearnGamesProgressScope(progressScopeKey);
    wasFullscreenRef.current = Boolean(document.fullscreenElement);

    const player = document.querySelector(".lg-game-player");
    if (player?.requestFullscreen && !document.fullscreenElement) {
      player.requestFullscreen().catch(() => {});
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

  function handleComplete(stars, finalScore, wordsCompleted) {
    if (resultSavedRef.current) return;
    resultSavedRef.current = true;
    setCompleted(true);
    const nextProgress = saveLearnGameResult(progressScopeKey, game.id, stars, finalScore || score, wordsCompleted);
    onProgressChange?.(nextProgress);
  }

  function requestClose() {
    if (completed) {
      onClose();
      return;
    }
    setShowQuit(true);
  }

  if (!GameComponent) return null;

  return (
    <div className="lg-game-player" role="dialog" aria-modal="true" aria-label={game.title}>
      <header className="lg-game-player-header">
        <div>
          <strong>{game.title}</strong>
          <span>{difficulty}</span>
        </div>
        <div className="lg-game-player-actions">
          <span className="lg-game-score">{score} pts</span>
          <SoundToggle enabled={soundEnabled} onToggle={() => onSoundEnabledChange(!soundEnabled)} />
          <button type="button" className="lg-game-close" onClick={requestClose} aria-label="Close game">
            <CloseIcon />
          </button>
        </div>
      </header>

      <main className="lg-game-player-main">
        <Suspense fallback={<div className="lg-game-loading">Loading game...</div>}>
          <GameComponent
            difficulty={difficulty}
            onScoreUpdate={setScore}
            onComplete={handleComplete}
            isSoundEnabled={soundEnabled}
          />
        </Suspense>
      </main>

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
    </div>
  );
}

export { GAME_LIST };
