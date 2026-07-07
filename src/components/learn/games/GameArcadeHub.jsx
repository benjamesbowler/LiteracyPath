import { useEffect, useMemo, useState } from "react";
import { GAME_LIST } from "../../../data/learnGamesData";
import { worldForDifficulty, worldStyle } from "../../../utils/palWorlds.js";
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

  if (!rows || rows.length === 0) {
    return (
      <div className="lg-leaderboard" aria-label="High scores">
        <div className="lg-leaderboard-head"><h2>Top Readers</h2></div>
        <p className="lg-leaderboard-empty">No high scores yet — play a game to get on the board!</p>
      </div>
    );
  }

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const totals = useMemo(() => {
    const completed = ARCADE_GAMES.filter(game => (getLearnGameProgress(progress, game.id).stars || 0) > 0).length;
    const points = ARCADE_GAMES.reduce((sum, game) => sum + (getLearnGameProgress(progress, game.id).highScore || 0), 0);
    return { completed, points };
  }, [progress]);

  function setDifficulty(difficulty) {
    setProgress(saveLearnGamesSettings(progressScopeKey, { difficulty }));
  }

  function setSoundEnabled(soundEnabled) {
    setProgress(saveLearnGamesSettings(progressScopeKey, { soundEnabled }));
  }

  const world = worldForDifficulty(progress.difficulty);

  return (
    <section className="lg-arcade lg-arcade-comic" aria-labelledby="lg-arcade-title" data-pal-world={world.id} style={worldStyle(world)}>
      {/* Slim top band with the 8-bit title + difficulty + sound */}
      <div className="lg-arcade-topband">
        <h1 id="lg-arcade-title" className="lg-arcade-8bit">Arcade Area</h1>
        <div className="lg-arcade-topband-controls">
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
      </div>

      {/* 4-wide tile grid: large game image + name */}
      <div className="lg-game-tilegrid">
        {ARCADE_GAMES.map(game => {
          const gameProgress = getLearnGameProgress(progress, game.id);
          return (
            <button
              key={game.id}
              type="button"
              className="lg-game-tile"
              style={{ "--game-accent": game.accent, "--game-accent-soft": game.accentSoft }}
              onClick={() => setActiveGame(game)}
            >
              <span className="lg-game-tile-art" aria-hidden="true">
                <img
                  src={`/images/learn-games/art/${game.id}.webp`}
                  alt=""
                  onError={event => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = game.icon;
                    event.currentTarget.classList.add("is-icon");
                  }}
                />
              </span>
              <span className="lg-game-tile-name">{game.title}</span>
              <span className="lg-game-tile-foot">
                <ProgressStars stars={gameProgress.stars || 0} />
                {gameProgress.highScore ? <em className="lg-game-tile-score">{gameProgress.highScore}</em> : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slim bottom banner: points + high-score board */}
      <div className="lg-arcade-bottomband">
        <span className="lg-arcade-points"><strong>{totals.points}</strong> points</span>
        <span className="lg-arcade-played">{totals.completed}/{ARCADE_GAMES.length} games played</span>
        <button
          type="button"
          className="lg-arcade-highscores"
          aria-expanded={showLeaderboard}
          onClick={() => setShowLeaderboard(value => !value)}
        >
          {showLeaderboard ? "Hide High Scores" : "High Scores"}
        </button>
      </div>

      {showLeaderboard && <Leaderboard refreshSignal={leaderboardRefresh} />}

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
