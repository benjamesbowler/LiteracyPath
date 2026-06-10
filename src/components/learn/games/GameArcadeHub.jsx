import { useMemo, useState } from "react";
import { GAME_LIST } from "../../../data/learnGamesData";
import {
  getLearnGameProgress,
  loadLearnGamesProgress,
  saveLearnGamesSettings
} from "../../../utils/learnGamesProgress";
import { ProgressStars } from "./shared/ProgressStars.jsx";
import { GamePlayer } from "./GamePlayer.jsx";
import "../../../styles/learn-games.css";

const DIFFICULTIES = ["easy", "medium", "hard"];

function ArcadeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" focusable="false">
      <rect x="10" y="22" width="44" height="28" rx="10" />
      <path d="M23 36h10M28 31v10" />
      <circle cx="42" cy="34" r="2.8" />
      <circle cx="48" cy="40" r="2.8" />
      <path d="M24 22c0-8 16-8 16 0" />
    </svg>
  );
}

export function GameArcadeHub({ progressScopeKey = "default" }) {
  const [progress, setProgress] = useState(() => loadLearnGamesProgress(progressScopeKey));
  const [activeGame, setActiveGame] = useState(null);

  const totals = useMemo(() => {
    const stars = GAME_LIST.reduce((sum, game) => sum + (getLearnGameProgress(progress, game.id).stars || 0), 0);
    const completed = GAME_LIST.filter(game => (getLearnGameProgress(progress, game.id).stars || 0) > 0).length;
    return { stars, completed };
  }, [progress]);

  function setDifficulty(difficulty) {
    setProgress(saveLearnGamesSettings(progressScopeKey, { difficulty }));
  }

  function setSoundEnabled(soundEnabled) {
    setProgress(saveLearnGamesSettings(progressScopeKey, { soundEnabled }));
  }

  return (
    <section className="lg-arcade" aria-labelledby="lg-arcade-title">
      <div className="lg-arcade-hero">
        <div>
          <ArcadeIcon />
          <div>
            <p>Game Arcade</p>
            <h1 id="lg-arcade-title">Choose a phonics game</h1>
          </div>
        </div>
        <div className="lg-arcade-summary">
          <strong>{totals.completed}/10</strong>
          <span>games started</span>
          <strong>{totals.stars}/30</strong>
          <span>stars</span>
        </div>
      </div>

      <div className="lg-arcade-controls" aria-label="Game options">
        <div className="lg-segmented-control" aria-label="Difficulty">
          {DIFFICULTIES.map(difficulty => (
            <button
              key={difficulty}
              type="button"
              className={progress.difficulty === difficulty ? "active" : ""}
              onClick={() => setDifficulty(difficulty)}
            >
              {difficulty}
            </button>
          ))}
        </div>
        <button type="button" className={`lg-audio-mode ${progress.soundEnabled ? "active" : ""}`} onClick={() => setSoundEnabled(!progress.soundEnabled)}>
          <span aria-hidden="true">{progress.soundEnabled ? "🔊" : "🔇"}</span>
          Sound
        </button>
      </div>

      <div className="lg-game-grid">
        {GAME_LIST.map(game => {
          const gameProgress = getLearnGameProgress(progress, game.id);
          return (
            <button
              key={game.id}
              type="button"
              className="lg-game-card"
              style={{ "--game-color": game.color }}
              onClick={() => setActiveGame(game)}
            >
              <span className="lg-game-card-icon"><img src={game.icon} alt="" /></span>
              <span className="lg-game-card-copy">
                <strong>{game.title}</strong>
                <small>{game.skill}</small>
                <em>{game.description}</em>
              </span>
              <span className="lg-game-card-meta">
                <span>{game.category}</span>
                <ProgressStars stars={gameProgress.stars || 0} />
              </span>
            </button>
          );
        })}
      </div>

      {activeGame && (
        <GamePlayer
          game={activeGame}
          difficulty={progress.difficulty}
          soundEnabled={progress.soundEnabled}
          progressScopeKey={progressScopeKey}
          onClose={() => setActiveGame(null)}
          onSoundEnabledChange={setSoundEnabled}
          onProgressChange={setProgress}
        />
      )}
    </section>
  );
}
