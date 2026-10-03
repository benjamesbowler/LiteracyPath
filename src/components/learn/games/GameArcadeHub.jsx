import "../../../styles/child-browse.css";
import { ARCADE_JOURNEYS, completedArcadeChapters } from "../../../utils/arcadeJourneys.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { GAME_LIST } from "../../../data/learnGamesData";
import { filterSample } from "../../../policy/freeTierContent.js";
import { worldForDifficulty, worldStyle } from "../../../utils/palWorlds.js";
import {
  getLearnGameProgress,
  loadLearnGamesProgress,
  saveLearnGamesSettings
} from "../../../utils/learnGamesProgress";
import { SoundToggle } from "./shared/SoundToggle.jsx";
import { GamePlayer } from "./GamePlayer.jsx";
import { LEARN_GAMES } from "./games/index.js";
import { arcadeRecommendation, arcadeRecommendationAudioPath } from "./arcadeRecommendation.js";
import { playCueAudio, stopCueAudio } from "../../../utils/audio/cuePlayer.js";
import { ChildRecommendationExplanation } from "../../recommendations/RecommendationExplanation.jsx";
import { confirmedArcadeTaughtCycle } from "./arcadeLearningContext.js";
import "../../../styles/learn-games.css";
import "../../../styles/arcade-dark.css";

const DIFFICULTIES = ["easy", "medium", "hard"];

// All available games share one gallery. Sample scope is set at session start,
// so eligibility must be resolved on render rather than module evaluation.
const availableGames = () => filterSample("games", GAME_LIST)
  .filter(game => !game.hidden && Boolean(LEARN_GAMES[game.id]))
  .sort((a, b) => Number((b.surfaces || []).includes("arcade")) - Number((a.surfaces || []).includes("arcade")));

function GameArcadeContent({
  progressScopeKey = "default",
  currentCycleId = "",
  confirmedPlacement = null,
  recommendedSkill = "",
  lockedGameId = null,
  onLockedGameAvailabilityChange = null
}) {
  const exactGameLock = lockedGameId !== null;
  const normalizedLockedGameId = exactGameLock ? String(lockedGameId || "").trim() : "";
  const lockedGame = exactGameLock
    ? filterSample("games", GAME_LIST).find(game => (
      !game.hidden
      && Boolean(LEARN_GAMES[game.id])
      && game.id === normalizedLockedGameId
    )) || null
    : null;
  const [progress, setProgress] = useState(() => loadLearnGamesProgress(progressScopeKey));
  const [activeGame, setActiveGame] = useState(() => {
    if (exactGameLock) return lockedGame;
    // One-shot deep link from Today's Mission.
    try {
      const wanted = window.localStorage.getItem("lp-open-game");
      if (wanted) {
        window.localStorage.removeItem("lp-open-game");
        return filterSample("games", GAME_LIST).find(game => !game.hidden && LEARN_GAMES[game.id] && game.id === wanted) || null;
      }
    } catch { /* ignore */ }
    return null;
  });
  useEffect(() => () => stopCueAudio(), [activeGame]);
  const [showProgress, setShowProgress] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsCloseRef = useRef(null);
  const settingsTriggerRef = useRef(null);
  const settingsPanelRef = useRef(null);
  const progressCloseRef = useRef(null);
  const progressTriggerRef = useRef(null);
  const progressPanelRef = useRef(null);
  function closeProgress() {
    setShowProgress(false);
    window.requestAnimationFrame(() => progressTriggerRef.current?.focus());
  }
  function closeSettings() {
    setShowSettings(false);
    window.requestAnimationFrame(() => settingsTriggerRef.current?.focus());
  }
  useEffect(() => {
    if (!showProgress) return undefined;
    const frame = window.requestAnimationFrame(() => progressCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [showProgress]);
  useEffect(() => {
    if (!showSettings) return undefined;
    const frame = window.requestAnimationFrame(() => settingsCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [showSettings]);

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      setProgress(loadLearnGamesProgress(progressScopeKey));
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [progressScopeKey]);

  const totals = useMemo(() => {
    const games = availableGames();
    const tried = games.filter(game => { const record = getLearnGameProgress(progress, game.id); return record.plays > 0 || record.stars > 0 || Object.keys(record.checkpoints || {}).length > 0; }).length;
    return { tried };
  }, [progress]);

  useEffect(() => {
    if (!exactGameLock) return;
    onLockedGameAvailabilityChange?.(Boolean(lockedGame));
  }, [exactGameLock, lockedGame, onLockedGameAvailabilityChange]);

  function setDifficulty(difficulty) {
    setProgress(saveLearnGamesSettings(progressScopeKey, { difficulty }));
  }

  function setSoundEnabled(soundEnabled) {
    setProgress(saveLearnGamesSettings(progressScopeKey, { soundEnabled }));
  }


  const world = worldForDifficulty(progress.difficulty);
  // Recomputed each render so a try session's sample takes effect; the scope is
  // set at session start, after this module was evaluated.
  const allGames = exactGameLock ? (lockedGame ? [lockedGame] : []) : availableGames();
  const recommendation = arcadeRecommendation({ games: allGames, progress, currentCycleId, recommendedSkill, assignedGameId: normalizedLockedGameId });
  const recommendedGame = recommendation.game;
  const displayedActiveGame = exactGameLock
    ? activeGame?.id === lockedGame?.id ? lockedGame : null
    : activeGame;
  const personalRecords = allGames.map(game => ({ game, record: getLearnGameProgress(progress, game.id) }))
    .filter(({ record }) => record.plays > 0 || record.stars > 0 || record.highScore > 0 || record.checkpoints?.[progress.difficulty])
    .sort((a, b) => String(b.record.lastPlayedAt || "").localeCompare(String(a.record.lastPlayedAt || "")));

  function gameTile(game) {
    return <button key={game.id} type="button" className={`lg-game-tile${game.id === recommendedGame?.id ? " is-recommended" : ""}`} data-game-id={game.id} data-game-section={(game.surfaces || []).includes("arcade") ? "arcade" : "phonics"}
      data-child-primary={game.id === recommendedGame?.id ? "" : undefined}
      data-child-emphasis={game.id === recommendedGame?.id ? "primary" : "choice"}
      style={{ "--game-accent": game.accent, "--game-accent-soft": game.accentSoft }}
      onClick={() => setActiveGame(game)}>
      <span className="lg-game-tile-art" aria-hidden="true"><img src={game.menuArt} alt=""
        onError={event => { event.currentTarget.onerror = null; event.currentTarget.hidden = true; }} /></span>
      <span className="lg-game-tile-name">{game.title}</span>
      {game.id === recommendedGame?.id && <span className="lg-game-recommended" data-child-emphasis-cue="">{getLearnGameProgress(progress, game.id).checkpoints?.[progress.difficulty] ? "Carry on" : "Play next"}</span>}
    </button>;
  }

  if (exactGameLock && !lockedGame) {
    return (
      <section
        className="lg-arcade lg-simple-arcade"
        aria-labelledby="lg-arcade-title"
        data-assigned-content-unavailable="game"
        data-pal-world={world.id}
        role="alert"
        style={worldStyle(world)}
      >
        <div className="lg-arcade-topband">
          <div>
            <h1 id="lg-arcade-title" className="lg-arcade-8bit" data-child-title="">Game unavailable</h1>
            <p className="lg-arcade-instruction" data-child-instruction="">
              Stay here and ask your teacher for help.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lg-arcade lg-simple-arcade" aria-labelledby="lg-arcade-title" data-pal-world={world.id} style={worldStyle(world)}>
      <div className="lg-arcade-scrollbody">
        <div className="lg-arcade-topband">
          <div><h1 id="lg-arcade-title" className="lg-arcade-8bit" data-child-title="">{exactGameLock ? "Your game" : "Games"}</h1>
            <p className="lg-arcade-instruction" data-child-instruction="">{exactGameLock ? "Play the game your teacher chose." : "Choose any game to play."}</p></div>
          <div className="lg-arcade-utilities">
            {!exactGameLock && <button ref={progressTriggerRef} type="button" className="lg-menu-secondary lg-arcade-personal-progress" aria-expanded={showProgress} aria-controls="lg-personal-progress" onClick={() => { setShowSettings(false); showProgress ? closeProgress() : setShowProgress(true); }}>My progress</button>}
          <button ref={settingsTriggerRef} type="button" className="lg-menu-secondary" aria-expanded={showSettings} aria-controls="lg-game-settings" onClick={() => { setShowProgress(false); showSettings ? closeSettings() : setShowSettings(true); }}>Game settings</button></div>
        </div>
        {showSettings && <section ref={settingsPanelRef} id="lg-game-settings" className="lg-simple-settings" role="dialog" aria-modal="true" aria-label="Game settings" onKeyDown={event => {
          if (event.key === "Escape") { event.stopPropagation(); closeSettings(); }
          if (event.key === "Tab") {
            const controls = [...settingsPanelRef.current.querySelectorAll('button, summary, [href], select, input, [tabindex="0"]')].filter(control => control.getClientRects().length);
            const first = controls[0]; const last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}>
          <button ref={settingsCloseRef} type="button" className="lg-menu-secondary lg-close-settings" onClick={closeSettings}>Close settings</button>
          <div className="lg-segmented-control" role="group" aria-label="Difficulty">{DIFFICULTIES.map(difficulty => <button key={difficulty} type="button"
            className={progress.difficulty === difficulty ? "active" : ""} aria-pressed={progress.difficulty === difficulty} onClick={() => setDifficulty(difficulty)}>{difficulty}</button>)}</div>
          <SoundToggle enabled={progress.soundEnabled} onToggle={() => setSoundEnabled(!progress.soundEnabled)} showLabel />
          {recommendedGame && <details className="lg-game-reason"><summary>Why this game?</summary><ChildRecommendationExplanation surface="arcade" reason={recommendation.reason} />
            {arcadeRecommendationAudioPath(recommendation.reason) && <button type="button" className="lg-menu-secondary" onClick={() => { stopCueAudio(); playCueAudio(arcadeRecommendationAudioPath(recommendation.reason)); }}>Hear why</button>}</details>}
        </section>}
        <section className="lg-game-choice-area" aria-label="Choose a game">
          <div className="lg-game-tilegrid" id="lg-arcade-catalogue" role="group" aria-label="All available games" data-child-choices="">
            {[
              { id: "arcade", title: "Arcade", description: "Run, race and explore while you practise.", games: allGames.filter(game => (game.surfaces || []).includes("arcade")) },
              { id: "phonics", title: "Phonics games", description: "Quick games for letters, sounds and words.", games: allGames.filter(game => !(game.surfaces || []).includes("arcade")) }
            ].filter(group => group.games.length).map(group => <section key={group.id} className="lg-game-section" aria-labelledby={exactGameLock ? undefined : `lg-section-${group.id}`} aria-label={exactGameLock ? group.title : undefined}>
              {!exactGameLock && <header className="lg-game-section-heading"><h2 id={`lg-section-${group.id}`}>{group.title}</h2><p>{group.description}</p></header>}
              <div className="lg-game-section-grid" role="group" aria-label={group.title}>{group.games.map(gameTile)}</div>
            </section>)}
          </div>
          {allGames.length === 0 && <p role="status">No games are available here. Ask your teacher for help.</p>}
        </section>
        <p className="lg-arcade-played" data-child-progress="">{exactGameLock ? "Your teacher’s game" : `${totals.tried} games tried · ${allGames.length} games to choose from`}</p>
      </div>
      {showProgress && !exactGameLock && <section ref={progressPanelRef} id="lg-personal-progress" className="lg-personal-progress" role="dialog" aria-modal="true" aria-labelledby="lg-personal-progress-title"
        onKeyDown={event => {
          if (event.key === "Escape") { event.stopPropagation(); closeProgress(); }
          if (event.key === "Tab") {
            const controls = [...progressPanelRef.current.querySelectorAll('button, [href], select, input, [tabindex="0"]')];
            const first = controls[0]; const last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}>
        <button ref={progressCloseRef} type="button" className="lg-menu-secondary" onClick={closeProgress}>Close my progress</button>
        <h2 id="lg-personal-progress-title">My game progress</h2><p>These are your own game records. {totals.tried} games tried.</p>
        {personalRecords.length === 0 ? <p role="status">Play a game to start your journey.</p> : <ul aria-label="Your recent games">{personalRecords.map(({ game, record }) => <li key={game.id}>
          <strong>{game.title}</strong><span>Personal best: {record.highScore || 0} game points</span><span>{record.plays || 0} times played</span>
          <span>{Math.max(0, Math.min(3, record.stars || 0))} of 3 game stars</span>
          {ARCADE_JOURNEYS[game.id] && <span>{completedArcadeChapters(record, progress.difficulty).length} of {ARCADE_JOURNEYS[game.id].chapterCount} outings finished</span>}
          {record.checkpoints?.[progress.difficulty] && <span>Your place is saved.</span>}
        </li>)}</ul>}
      </section>}
      {displayedActiveGame && (
        <GamePlayer
          game={displayedActiveGame}
          difficulty={progress.difficulty}
          soundEnabled={progress.soundEnabled}
          taughtCycle={confirmedArcadeTaughtCycle(confirmedPlacement)}
          progressScopeKey={progressScopeKey}
          onClose={() => {
            setActiveGame(null);
          }}
          onSoundEnabledChange={setSoundEnabled}
          onProgressChange={setProgress}
        />
      )}
    </section>
  );
}

export function GameArcadeHub(props) {
  return <GameArcadeContent key={props.progressScopeKey || "default"} {...props} />;
}
