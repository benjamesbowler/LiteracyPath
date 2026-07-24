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
// The quieter skill-practice games. Before this shelf existed they were only
// reachable through one random Daily Mission deep-link - unplayable on demand.
const PRACTICE_GAMES = GAME_LIST.filter(game =>
  !(game.surfaces || []).includes("arcade") && !game.hidden && game.id !== "word-climb");

// Two tabs: the arcade line-up, and the quieter phonics practice games. Before
// the tabs the practice games sat in a shelf below the arcade grid, which
// pushed the arcade off-screen once the line-up grew past eight.
const TABS = [
  { id: "arcade", label: "Arcade", games: ARCADE_GAMES },
  { id: "practice", label: "Phonics Practice", games: PRACTICE_GAMES }
];

function readStudentToken() {
  try {
    return JSON.parse(window.localStorage.getItem("lp-student-session-v1") || "null")?.token || "";
  } catch {
    return "";
  }
}

function Leaderboard({ refreshSignal }) {
  // The token is only a credential. The database derives class/school scope
  // from the live session and returns irreversible pseudonyms, never names.
  const token = readStudentToken();
  const [rows, setRows] = useState(() => (token ? null : [])); // null = still loading
  const [scope, setScope] = useState("class");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) return undefined;
    supabase
      .rpc("get_game_leaderboard", { p_limit: 5, p_student_token: token })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !Array.isArray(data?.rows)) {
          setFailed(true);
          return;
        }
        setFailed(false);
        setScope(data.scope === "school" ? "school" : "class");
        setRows(data.rows.filter(row => (row.total_points || 0) > 0));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshSignal, token]);

  const privacyText = `Nickname-only scores stay in your ${scope}.`;

  if (failed) {
    return (
      <div className="lg-leaderboard" aria-label="High scores">
        <div className="lg-leaderboard-head"><h2>Top Readers</h2><span>{privacyText}</span></div>
        <p className="lg-leaderboard-empty">High scores are taking a break — try again in a little while.</p>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="lg-leaderboard" aria-label="High scores">
        <div className="lg-leaderboard-head"><h2>Top Readers</h2><span>{privacyText}</span></div>
        <p className="lg-leaderboard-empty">Loading high scores…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="lg-leaderboard" aria-label="High scores">
        <div className="lg-leaderboard-head"><h2>Top Readers</h2><span>{privacyText}</span></div>
        <p className="lg-leaderboard-empty">No high scores yet — play a game to get on the board!</p>
      </div>
    );
  }

  return (
    <div className="lg-leaderboard" aria-label="High scores">
      <div className="lg-leaderboard-head">
        <h2>Top Readers</h2>
        <span>Points from every game count. {privacyText}</span>
      </div>
      <ol className="lg-leaderboard-list">
        {rows.map((row, index) => (
          <li key={`${row.student_name}-${index}`} className={index === 0 ? "first" : ""}>
            <span className="lg-leaderboard-rank" aria-hidden="true">{index + 1}</span>
            <span className="lg-leaderboard-who">
              <strong>{row.student_name}</strong>
              <em>{scope === "school" ? "Your school" : "Your class"}</em>
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
  // A Today's-Mission deep link opens straight into a game; land on the tab
  // that game lives in, so closing the player returns to the right shelf.
  const [tab, setTab] = useState(() => {
    const homeTab = TABS.find(entry => entry.games.some(game => game.id === activeGame?.id));
    return homeTab ? homeTab.id : "arcade";
  });

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
  const visibleGames = (TABS.find(entry => entry.id === tab) || TABS[0]).games;
  const recommendedGame = visibleGames.find(game => (
    (getLearnGameProgress(progress, game.id).stars || 0) === 0
  )) || visibleGames[0];

  return (
    <section className="lg-arcade lg-arcade-comic" aria-labelledby="lg-arcade-title" data-pal-world={world.id} style={worldStyle(world)}>
      {/* Slim top band with the 8-bit title + difficulty + sound */}
      <div className="lg-arcade-topband">
        <div>
          <h1 id="lg-arcade-title" className="lg-arcade-8bit" data-child-title="">Arcade Area</h1>
          <p className="lg-arcade-instruction" data-child-instruction="">Pick one game. Your next unplayed game is marked first.</p>
        </div>
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

      {/* Tabs: the arcade line-up, and the phonics practice games */}
      <div className="lg-arcade-tabs" role="tablist" aria-label="Game sets">
        {TABS.map(entry => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`lg-arcade-tab-${entry.id}`}
            aria-selected={tab === entry.id}
            aria-controls="lg-arcade-tabpanel"
            className={tab === entry.id ? "lg-arcade-tab active" : "lg-arcade-tab"}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
            <span className="lg-arcade-tab-count">{entry.games.length}</span>
          </button>
        ))}
      </div>

      {/* 6-wide tile grid: large game image + name (11 arcade games = 6 + 5) */}
      <div
        className="lg-game-tilegrid"
        id="lg-arcade-tabpanel"
        role="tabpanel"
        aria-labelledby={`lg-arcade-tab-${tab}`}
        data-child-choices=""
      >
        {visibleGames.map(game => {
          const gameProgress = getLearnGameProgress(progress, game.id);
          const isRecommended = game.id === recommendedGame?.id;
          return (
            <button
              key={game.id}
              type="button"
              className={`lg-game-tile${isRecommended ? " is-recommended" : ""}`}
              style={{ "--game-accent": game.accent, "--game-accent-soft": game.accentSoft }}
              onClick={() => setActiveGame(game)}
              data-child-primary={isRecommended ? "" : undefined}
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
              {isRecommended && <span className="lg-game-tile-next">Play next</span>}
              <span className="lg-game-tile-foot">
                <ProgressStars stars={gameProgress.stars || 0} />
                {gameProgress.highScore ? <em className="lg-game-tile-score">{gameProgress.highScore}</em> : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slim bottom banner: points + high-score board */}
      <div className="lg-arcade-bottomband" data-child-progress="">
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

      {showLeaderboard && (
        <Leaderboard refreshSignal={leaderboardRefresh} />
      )}

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
