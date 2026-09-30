import "../../../styles/child-browse.css";
import { ARCADE_JOURNEYS, completedArcadeChapters } from "../../../utils/arcadeJourneys.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChildBrowseMedia, useCompactChildBrowse } from "../../../hooks/useCompactChildBrowse.js";
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
import { arcadeRecommendation } from "./arcadeRecommendation.js";
import { getLedaInstructionAudioPath } from "../../../data/ledaProductionAudio.js";
import { playCueAudio, stopCueAudio } from "../../../utils/audio/cuePlayer.js";
import { ChildRecommendationExplanation } from "../../recommendations/RecommendationExplanation.jsx";
import "../../../styles/learn-games.css";
import "../../../styles/arcade-dark.css";

const DIFFICULTIES = ["easy", "medium", "hard"];

// The arcade shows only the arcade-tier games (the new playable games). The
// worksheet-style games live in the Daily Challenge + EL maps instead.
// Computed per render rather than at module load: the sample scope is set when
// a try session starts, which happens long after this module is evaluated.
const arcadeGames = () => filterSample("games", GAME_LIST).filter(game => !game.hidden && (game.surfaces || []).includes("arcade"));
// The quieter skill-practice games. Before this shelf existed they were only
// reachable through one random Daily Mission deep-link - unplayable on demand.
const practiceGames = () => filterSample("games", GAME_LIST).filter(game =>
  !(game.surfaces || []).includes("arcade") && !game.hidden && game.id !== "word-climb");

// Two tabs: the arcade line-up, and the quieter phonics practice games. Before
// the tabs the practice games sat in a shelf below the arcade grid, which
// pushed the arcade off-screen once the line-up grew past eight.
const tabsFor = () => [
  { id: "arcade", label: "Arcade", games: arcadeGames() },
  { id: "practice", label: "Phonics Practice", games: practiceGames() }
];

function GameArcadeContent({
  progressScopeKey = "default",
  currentCycleId = "",
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
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cataloguePage, setCataloguePage] = useState(0);
  const compactBrowse = useCompactChildBrowse();
  const phoneBrowse = useChildBrowseMedia("(max-width: 500px)");
  const catalogueSlots = compactBrowse || phoneBrowse ? 3 : 6;
  const progressCloseRef = useRef(null);
  const progressTriggerRef = useRef(null);
  const progressPanelRef = useRef(null);
  function closeProgress() {
    setShowProgress(false);
    window.requestAnimationFrame(() => progressTriggerRef.current?.focus());
  }
  useEffect(() => {
    if (!showProgress) return undefined;
    const frame = window.requestAnimationFrame(() => progressCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [showProgress]);

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      setProgress(loadLearnGamesProgress(progressScopeKey));
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [progressScopeKey]);
  // A Today's-Mission deep link opens straight into a game; land on the tab
  // that game lives in, so closing the player returns to the right shelf.
  const [tab, setTab] = useState(() => {
    if (exactGameLock) return "assigned";
    const homeTab = tabsFor().find(entry => entry.games.some(game => game.id === activeGame?.id));
    return homeTab ? homeTab.id : "arcade";
  });

  const totals = useMemo(() => {
    const games = tabsFor().flatMap(entry => entry.games);
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
  const tabs = exactGameLock
    ? [{ id: "assigned", label: "Your game", games: lockedGame ? [lockedGame] : [] }]
    : tabsFor();
  const allGames = tabs.flatMap(entry => entry.games);
  const catalogueGames = (tabs.find(entry => entry.id === tab) || tabs[0])?.games || [];
  const recommendation = arcadeRecommendation({ games: allGames, progress, currentCycleId, recommendedSkill, assignedGameId: normalizedLockedGameId });
  const recommendedGame = recommendation.game;
  const displayedActiveGame = exactGameLock
    ? activeGame?.id === lockedGame?.id ? lockedGame : null
    : activeGame;
  const narrowPhoneBrowse = useChildBrowseMedia("(max-width: 350px) and (orientation: portrait)");
  const alternatives = allGames.filter(game => game.id !== recommendedGame?.id)
    .sort((a, b) => Number(getLearnGameProgress(progress, b.id).plays > 0) - Number(getLearnGameProgress(progress, a.id).plays > 0)).slice(0, narrowPhoneBrowse ? 2 : 3);
  const visibleCataloguePage = Math.min(cataloguePage, Math.max(0, Math.ceil(catalogueGames.length / catalogueSlots) - 1));
  const visibleGames = showCatalogue ? catalogueGames.slice(visibleCataloguePage * catalogueSlots, (visibleCataloguePage + 1) * catalogueSlots) : alternatives;
  const personalRecords = allGames.map(game => ({ game, record: getLearnGameProgress(progress, game.id) }))
    .filter(({ record }) => record.plays > 0 || record.stars > 0 || record.highScore > 0 || record.checkpoints?.[progress.difficulty])
    .sort((a, b) => String(b.record.lastPlayedAt || "").localeCompare(String(a.record.lastPlayedAt || "")));

  function gameTile(game) {
    return <button key={game.id} type="button" className="lg-game-tile" data-game-id={game.id}
      style={{ "--game-accent": game.accent, "--game-accent-soft": game.accentSoft }}
      onClick={() => setActiveGame(game)} data-child-emphasis="choice">
      <span className="lg-game-tile-art" aria-hidden="true"><img src={game.cardArt || `/images/learn-games/art/${game.id}.webp`} alt="" className={game.cardArt === game.icon ? "is-icon" : undefined}
        onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = game.icon; event.currentTarget.classList.add("is-icon"); }} /></span>
      <span className="lg-game-tile-name">{game.title}</span>
    </button>;
  }

  if (exactGameLock && !lockedGame) {
    return (
      <section
        className="lg-arcade lg-arcade-comic"
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
    <section className="lg-arcade lg-arcade-comic lg-simple-arcade" aria-labelledby="lg-arcade-title" data-pal-world={world.id} style={worldStyle(world)}>
      <div className="lg-arcade-scrollbody">
        <div className="lg-arcade-topband">
          <div><h1 id="lg-arcade-title" className="lg-arcade-8bit" data-child-title="">{exactGameLock ? "Your game" : "Arcade"}</h1>
            <p className="lg-arcade-instruction" data-child-instruction="">{exactGameLock ? "Play the game your teacher chose." : "Play next, or choose another game."}</p></div>
          <button type="button" className="lg-menu-secondary" aria-expanded={showSettings} aria-controls="lg-game-settings" onClick={() => setShowSettings(open => !open)}>Game settings</button>
        </div>
        {showSettings && <section id="lg-game-settings" className="lg-simple-settings" aria-label="Game settings" onKeyDown={event => { if (event.key === "Escape") setShowSettings(false); }}>
          <button type="button" className="lg-menu-secondary lg-close-settings" onClick={() => setShowSettings(false)}>Close settings</button>
          <div className="lg-segmented-control" role="group" aria-label="Difficulty">{DIFFICULTIES.map(difficulty => <button key={difficulty} type="button"
            className={progress.difficulty === difficulty ? "active" : ""} aria-pressed={progress.difficulty === difficulty} onClick={() => setDifficulty(difficulty)}>{difficulty}</button>)}</div>
          <SoundToggle enabled={progress.soundEnabled} onToggle={() => setSoundEnabled(!progress.soundEnabled)} showLabel />
          {recommendedGame && <details className="lg-game-reason"><summary>Why this game?</summary><ChildRecommendationExplanation surface="arcade" reason={recommendation.reason} />
            <button type="button" className="lg-menu-secondary" onClick={() => { stopCueAudio(); playCueAudio(getLedaInstructionAudioPath(recommendation.reason)); }}>Hear why</button></details>}
        </section>}
        {recommendedGame && <section className="lg-game-feature" aria-label="Play next" data-child-progress="">
          <span className="lg-game-feature-art" aria-hidden="true"><img src={recommendedGame.cardArt || recommendedGame.icon} alt="" className={recommendedGame.cardArt === recommendedGame.icon ? "is-icon" : undefined}
            onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = recommendedGame.icon; event.currentTarget.classList.add("is-icon"); }} /></span>
          <div><span className="lg-feature-eyebrow">Your next game</span><h2>{recommendedGame.title}</h2>
            <p>{getLearnGameProgress(progress, recommendedGame.id).checkpoints?.[progress.difficulty] ? "Your saved place is ready." : "Play a round of practice."}</p>
            <button type="button" className="lg-game-feature-play" onClick={() => setActiveGame(recommendedGame)} data-game-id={recommendedGame.id} data-child-primary="" data-child-emphasis="primary"><span data-child-emphasis-cue="">Play next</span></button>
          </div>
        </section>}
        {!exactGameLock && <section className="lg-game-choice-area" data-catalogue-open={showCatalogue ? "true" : "false"} aria-label="Choose a game">
        <div className="lg-game-browse-head"><h2>{showCatalogue ? "Choose a game" : "Try another game"}</h2><button type="button" className="lg-menu-secondary"
          aria-expanded={showCatalogue} aria-controls="lg-arcade-catalogue" onClick={() => { setShowCatalogue(open => !open); setCataloguePage(0); }}>{showCatalogue ? "Close games" : "More games"}</button></div>
        {!exactGameLock && showCatalogue && <div className="lg-arcade-tabs" role="tablist" aria-label="Game sets">{tabs.map(entry => <button key={entry.id} type="button" role="tab" id={`lg-arcade-tab-${entry.id}`}
          aria-selected={tab === entry.id} aria-controls="lg-arcade-catalogue" className={tab === entry.id ? "lg-arcade-tab active" : "lg-arcade-tab"}
          onClick={() => { setTab(entry.id); setCataloguePage(0); }}>{entry.label}</button>)}</div>}
        {!exactGameLock && <div className="lg-game-tilegrid" id="lg-arcade-catalogue" role={showCatalogue ? "tabpanel" : "group"}
          aria-labelledby={showCatalogue ? `lg-arcade-tab-${tab}` : undefined} aria-label={showCatalogue ? undefined : "Other games"} data-child-choices="">
          {visibleGames.map(gameTile)}
        </div>}
        {showCatalogue && <div className="lg-game-pages"><button type="button" className="lg-menu-secondary" disabled={visibleCataloguePage === 0} onClick={() => setCataloguePage(visibleCataloguePage - 1)}>Previous games</button>
          <span role="status">{visibleCataloguePage * catalogueSlots + 1} to {Math.min((visibleCataloguePage + 1) * catalogueSlots, catalogueGames.length)} of {catalogueGames.length} games</span>
          <button type="button" className="lg-menu-secondary" disabled={(visibleCataloguePage + 1) * catalogueSlots >= catalogueGames.length} onClick={() => setCataloguePage(visibleCataloguePage + 1)}>Next games</button></div>}
        </section>}
      </div>
      {!exactGameLock && <div className="lg-arcade-bottomband" data-child-progress=""><span className="lg-arcade-played">{totals.tried} games tried</span>
        <button ref={progressTriggerRef} type="button" className="lg-menu-secondary lg-arcade-personal-progress" aria-expanded={showProgress} aria-controls="lg-personal-progress" onClick={() => showProgress ? closeProgress() : setShowProgress(true)}>My progress</button>
      </div>}
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
