import { useEffect, useMemo, useState } from "react";
import { GAME_LIST } from "../../../data/learnGamesData";
import { worldForDifficulty, worldStyle } from "../../../utils/palWorlds.js";
import { supabase } from "../../../supabaseClient.js";
import {
  getLearnGameProgress,
  loadLearnGamesProgress,
  saveLearnGamesSettings
} from "../../../utils/learnGamesProgress";
import { readCheckpoint } from "../../../utils/gameCheckpoints.js";
import { ProgressStars } from "./shared/ProgressStars.jsx";
import { SoundToggle } from "./shared/SoundToggle.jsx";
import { GamePlayer } from "./GamePlayer.jsx";
import "../../../styles/learn-games.css";
import "../../../styles/arcade-dark.css";

const DIFFICULTIES = ["easy", "medium", "hard"];

// The arcade shows only the arcade-tier games (the new playable games). The
// worksheet-style games live in the Daily Challenge + EL maps instead.
const ARCADE_GAMES = GAME_LIST.filter(game => (game.surfaces || []).includes("arcade"));

function Leaderboard({ refreshSignal }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Privacy: the board is scoped to the child's own school. Without a school
    // id we never query — showing nothing is correct, never a global list.
    let schoolId = null;
    try {
      schoolId = JSON.parse(window.localStorage.getItem("lp-student-session-v1") || "null")?.schoolId || null;
    } catch { /* no session / not parseable - leave schoolId null */ }
    if (!schoolId) {
      // No school in session: never query. rows stays empty, board renders nothing.
      return () => { cancelled = true; };
    }
    supabase
      .rpc("get_game_leaderboard", { p_limit: 5, p_school_id: schoolId })
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
  const [activeGame, setActiveGame] = useState(() => {
    // One-shot deep link from Today's Mission.
    try {
      const wanted = window.localStorage.getItem("lp-open-game");
      if (wanted) {
        window.localStorage.removeItem("lp-open-game");
        return GAME_LIST.find(game => game.id === wanted) || null;
      }
    } catch { /* ignore */ }
    return null;
  });
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);

  const totals = useMemo(() => {
    const stars = ARCADE_GAMES.reduce((sum, game) => sum + (getLearnGameProgress(progress, game.id).stars || 0), 0);
    const completed = ARCADE_GAMES.filter(game => (getLearnGameProgress(progress, game.id).stars || 0) > 0).length;
    const points = ARCADE_GAMES.reduce((sum, game) => sum + (getLearnGameProgress(progress, game.id).highScore || 0), 0);
    return { stars, completed, points };
  }, [progress]);
  const nextGame = useMemo(() => (
    ARCADE_GAMES.find(game => (getLearnGameProgress(progress, game.id).stars || 0) < 3) || ARCADE_GAMES[0]
  ), [progress]);
  const completedPercent = ARCADE_GAMES.length ? Math.round((totals.completed / ARCADE_GAMES.length) * 100) : 0;

  function setDifficulty(difficulty) {
    setProgress(saveLearnGamesSettings(progressScopeKey, { difficulty }));
  }

  function setSoundEnabled(soundEnabled) {
    setProgress(saveLearnGamesSettings(progressScopeKey, { soundEnabled }));
  }

  const world = worldForDifficulty(progress.difficulty);

  return (
    <section className="lg-arcade" aria-labelledby="lg-arcade-title" data-pal-world={world.id} style={worldStyle(world)}>
      <div className="lg-arcade-header pal-world-banner">
        <div className="lg-arcade-title-block">
          <span className="lg-section-rule" aria-hidden="true"></span>
          <div>
            <span className="pal-world-chip">{world.name} world</span>
            <p>Game Arcade</p>
            <h1 id="lg-arcade-title">Play a short quest game</h1>
            <span>Earn stars while reviewing letters, sounds, words, and rhymes.</span>
          </div>
        </div>
        <div className="lg-arcade-summary">
          <span className="lg-arcade-points-chip"><strong>{totals.points}</strong> points</span>
          <span><strong>{totals.stars}/{ARCADE_GAMES.length * 3}</strong> stars</span>
          <span><strong>{totals.completed}/{ARCADE_GAMES.length}</strong> played</span>
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
          <div className="lg-arcade-progress-track" aria-label={`${totals.completed} of ${ARCADE_GAMES.length} games played`}>
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
        {ARCADE_GAMES.map((game, index) => {
          const gameProgress = getLearnGameProgress(progress, game.id);
          const resume = readCheckpoint(progress.games, game.id, progress.difficulty);
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
                {resume && (
                  <span className="lg-game-skill" style={{ background: "rgba(4,10,32,0.72)", color: "#fff" }}>
                    Resume · Lvl {resume.level + 1}{resume.totalLevels ? `/${resume.totalLevels}` : ""}
                  </span>
                )}
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
