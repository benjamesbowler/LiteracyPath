import { useMemo, useState } from "react";
import { GAME_LIST } from "../../../data/learnGamesData";
import {
  getLearnGameProgress,
  loadLearnGamesProgress,
  saveLearnGamesSettings
} from "../../../utils/learnGamesProgress";
import { ProgressStars } from "./shared/ProgressStars.jsx";
import { SoundToggle } from "./shared/SoundToggle.jsx";
import { GamePlayer } from "./GamePlayer.jsx";
import "../../../styles/learn-games.css";

const DIFFICULTIES = ["easy", "medium", "hard"];

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
      <div className="lg-arcade-header">
        <div className="lg-arcade-title-block">
          <span className="lg-section-rule" aria-hidden="true"></span>
          <div>
            <p>Game Arcade</p>
            <h1 id="lg-arcade-title">Practice through play</h1>
            <span>Focused phonics games with classroom-friendly progress tracking.</span>
          </div>
        </div>
        <div className="lg-arcade-summary">
          <span><strong>{totals.stars}/30</strong> stars</span>
          <span><strong>{totals.completed}/10</strong> played</span>
        </div>
      </div>

      <div className="lg-arcade-controls" aria-label="Game options">
        <div className="lg-segmented-control" aria-label="Difficulty">
          {DIFFICULTIES.map(difficulty => (
            <button
              key={difficulty}
              type="button"
              className={progress.difficulty === difficulty ? "active" : ""}
              aria-pressed={progress.difficulty === difficulty}
              onClick={() => setDifficulty(difficulty)}
            >
              {difficulty}
            </button>
          ))}
        </div>
        <SoundToggle enabled={progress.soundEnabled} onToggle={() => setSoundEnabled(!progress.soundEnabled)} />
      </div>

      <div className="lg-game-grid">
        {GAME_LIST.map(game => {
          const gameProgress = getLearnGameProgress(progress, game.id);
          return (
            <button
              key={game.id}
              type="button"
              className="lg-game-card"
              style={{ "--game-accent": game.accent, "--game-accent-soft": game.accentSoft }}
              onClick={() => setActiveGame(game)}
            >
              <span className="lg-game-card-art" aria-hidden="true">
                <img src={game.icon} alt="" />
              </span>
              <span className="lg-game-card-copy">
                <strong>{game.title}</strong>
                <em>{game.description}</em>
              </span>
              <span className="lg-game-card-meta">
                <span className="lg-game-skill">{game.skill}</span>
                <ProgressStars stars={gameProgress.stars || 0} />
              </span>
              <span className="lg-game-play" aria-hidden="true">Play</span>
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
