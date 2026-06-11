import { useEffect, useMemo, useState } from "react";
import { GAME_LIST } from "../../../data/learnGamesData";
import { supabase } from "../../../supabaseClient.js";
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

function Leaderboard({ refreshSignal }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc("get_game_leaderboard", { p_limit: 5 })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !Array.isArray(data)) {
          setRows([]);
          return;
        }
        setRows(data.filter(row => (row.total_points || 0) > 0));
      });
    return () => {
      cancelled = true;
    };
  }, [refreshSignal]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="lg-leaderboard" aria-label="High scores">
      <div className="lg-leaderboard-head">
        <h2>Top Readers</h2>
        <span>Points from every game count.</span>
      </div>
      <ol className="lg-leaderboard-list">
        {rows.map((row, index) => (
          <li key={`${row.student_name}-${index}`} className={index === 0 ? "first" : ""}>
            <span className="lg-leaderboard-rank" aria-hidden="true">{index + 1}</span>
            <span className="lg-leaderboard-who">
              <strong>{row.student_name}</strong>
              {row.school_name && <em>{row.school_name}</em>}
            </span>
            <span className="lg-leaderboard-points">{row.total_points} pts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function GameArcadeHub({ progressScopeKey = "default" }) {
  const [progress, setProgress] = useState(() => loadLearnGamesProgress(progressScopeKey));
  const [activeGame, setActiveGame] = useState(null);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);

  const totals = useMemo(() => {
    const stars = GAME_LIST.reduce((sum, game) => sum + (getLearnGameProgress(progress, game.id).stars || 0), 0);
    const completed = GAME_LIST.filter(game => (getLearnGameProgress(progress, game.id).stars || 0) > 0).length;
    const points = GAME_LIST.reduce((sum, game) => sum + (getLearnGameProgress(progress, game.id).highScore || 0), 0);
    return { stars, completed, points };
  }, [progress]);
  const nextGame = useMemo(() => (
    GAME_LIST.find(game => (getLearnGameProgress(progress, game.id).stars || 0) < 3) || GAME_LIST[0]
  ), [progress]);
  const completedPercent = GAME_LIST.length ? Math.round((totals.completed / GAME_LIST.length) * 100) : 0;

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
            <h1 id="lg-arcade-title">Play a short quest game</h1>
            <span>Earn stars while reviewing letters, sounds, words, and rhymes.</span>
          </div>
        </div>
        <div className="lg-arcade-summary">
          <span className="lg-arcade-points-chip"><strong>{totals.points}</strong> points</span>
          <span><strong>{totals.stars}/{GAME_LIST.length * 3}</strong> stars</span>
          <span><strong>{totals.completed}/{GAME_LIST.length}</strong> played</span>
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

      {nextGame && (
        <div className="lg-arcade-next" aria-label="Recommended game">
          <div>
            <p>Recommended next</p>
            <strong>{nextGame.title}</strong>
            <span>{nextGame.skill}</span>
          </div>
          <div className="lg-arcade-progress-track" aria-label={`${totals.completed} of ${GAME_LIST.length} games played`}>
            <span style={{ width: `${completedPercent}%` }} />
          </div>
          <button
            className="lg-game-primary"
            onClick={() => setActiveGame(nextGame)}
            type="button"
          >
            Play Next
          </button>
        </div>
      )}

      <div className="lg-game-grid">
        {GAME_LIST.map((game, index) => {
          const gameProgress = getLearnGameProgress(progress, game.id);
          return (
            <button
              key={game.id}
              type="button"
              className="lg-game-card"
              style={{ "--game-accent": game.accent, "--game-accent-soft": game.accentSoft, "--card-index": index }}
              onClick={() => setActiveGame(game)}
            >
              <span className="lg-game-card-art" aria-hidden="true">
                <img
                  src={`/images/learn-games/art/${game.id}.webp`}
                  alt=""
                  className="lg-game-art-full"
                  onError={event => {
                    // No generated artwork yet for this game - fall back to its icon.
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = game.icon;
                    event.currentTarget.className = "lg-game-art-icon";
                  }}
                />
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

      <Leaderboard refreshSignal={leaderboardRefresh} />

      {activeGame && (
        <GamePlayer
          game={activeGame}
          difficulty={progress.difficulty}
          soundEnabled={progress.soundEnabled}
          progressScopeKey={progressScopeKey}
          onClose={() => {
            setActiveGame(null);
            setLeaderboardRefresh(value => value + 1);
          }}
          onSoundEnabledChange={setSoundEnabled}
          onProgressChange={setProgress}
        />
      )}
    </section>
  );
}
