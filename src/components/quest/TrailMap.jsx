import { useEffect, useMemo, useRef, useState } from "react";
import BookCharacterAvatar from "./BookCharacterAvatar.jsx";
import { QUEST_CHAPTERS } from "../../data/questChapters.js";
import { getStop } from "../../data/questSequence.js";
import { currentStopIndex, unlockedChapterRewards } from "../../utils/questProgress.js";
import { playWhoosh } from "../../utils/audio/gameSfx.js";
import { freeRoamReviewPlan } from "../../utils/questReviewMode.js";

// These anchors sit on the roads painted into each 1680 x 941 world plate.
// The plate is the route artwork: do not draw a second generic road over it.
const MAP_POINTS_BY_WORLD = Object.freeze({
  meadow: Object.freeze([
    { x: 27, y: 87 },
    { x: 35, y: 69 },
    { x: 51, y: 61 },
    { x: 68, y: 47 },
    { x: 87, y: 55 }
  ]),
  dino: Object.freeze([
    { x: 18, y: 82 },
    { x: 34, y: 64 },
    { x: 52, y: 57 },
    { x: 67, y: 43 },
    { x: 86, y: 34 }
  ]),
  moonwood: Object.freeze([
    { x: 16, y: 79 },
    { x: 35, y: 68 },
    { x: 50, y: 53 },
    { x: 67, y: 67 },
    { x: 84, y: 78 }
  ])
});

const MAP_LANDMARKS = Object.freeze({
  "seedwake-meadow": ["hollow-tree", "trail-ruin", "blossom-tree", "round-tree", "seed-lantern"].map(asset => `/game-assets/quest-pixel/seedwake/scenery-premium/${asset}.png`),
  "river-gardens": ["willow-bank", "lily-ferry", "canal-map", "garden-arch", "waterwheel-weir"].map(asset => `/game-assets/quest-pixel/river-gardens/scenery-premium/${asset}.png`),
  "fossil-canyon": ["amber-outcrop", "survey-station", "dig-camp", "rope-bridge", "bone-signal"].map(asset => `/game-assets/quest-pixel/fossil-canyon/scenery-premium/${asset}.png`),
  "forge-settlement": ["gearworks-gate", "ore-hopper", "plate-foundry", "night-train", "word-forge"].map(asset => `/game-assets/quest-pixel/forge-settlement/scenery-premium/${asset}.png`),
  "glass-marsh": ["reedlight-landing", "ripple-pool", "mica-steps", "glint-causeway", "mirror-fen-beacon"].map(asset => `/game-assets/quest-pixel/glass-marsh/scenery-premium/${asset}.png`),
  "storm-coast": ["galecliff-path", "shellhaven", "signal-harbour", "stormglass-cove", "thunder-lighthouse"].map(asset => `/game-assets/quest-pixel/storm-coast/scenery-premium/${asset}.png`),
  "lantern-forest": ["mothlight-gate", "echo-roots", "wispwood-turn", "orbit-hollow", "sleeping-observatory"].map(asset => `/game-assets/quest-pixel/lantern-forest/scenery-premium/${asset}.png`),
  "star-reach": ["comet-stair", "aster-archive", "dawn-causeway", "reading-skybridge", "first-reading-star"].map(asset => `/game-assets/quest-pixel/star-reach/scenery-premium/${asset}.png`)
});

const WORLD_LABELS = Object.freeze({
  meadow: "Meadow Pals",
  dino: "Dino Land",
  moonwood: "Moonwood"
});

function mapPath(points) {
  if (!points.length) return "";
  return points.reduce((path, point, index) => {
    if (!index) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const centreX = (previous.x + point.x) / 2;
    return `${path} C ${centreX} ${previous.y}, ${centreX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export default function TrailMap({
  state,
  act = 1,
  onAct,
  onEnterStop,
  onFreeRoam,
  onShortcut,
  onBack,
  onEditCharacter,
  onTradingPost,
  isSoundEnabled = true
}) {
  const chapter = QUEST_CHAPTERS[Math.max(0, Math.min(QUEST_CHAPTERS.length - 1, act - 1))];
  const stops = useMemo(() => chapter.stopIds.map(getStop).filter(Boolean), [chapter]);
  const nextIndex = currentStopIndex(state);
  const done = new Set(state.trail?.stopsDone || []);
  const relicIds = new Set(unlockedChapterRewards(state).map(relic => relic.chapterId));
  const journeyComplete = QUEST_CHAPTERS.every(candidate => (
    candidate.stopIds.every(stopId => done.has(stopId))
  ));
  const reviewPlan = freeRoamReviewPlan(state);
  const [walkingStop, setWalkingStop] = useState(null);
  const walkTimer = useRef(0);
  const mapPoints = MAP_POINTS_BY_WORLD[chapter.worldKit] || MAP_POINTS_BY_WORLD.meadow;
  const positions = stops.map((stop, index) => ({ stop, ...mapPoints[index] }));
  const landmarks = MAP_LANDMARKS[chapter.id] || [];
  const worldChapters = QUEST_CHAPTERS.filter(candidate => candidate.worldKit === chapter.worldKit);
  const worldStops = worldChapters.flatMap(candidate => candidate.stopIds);
  const chapterWorldOffset = Math.max(0, worldStops.indexOf(chapter.stopIds[0]));
  const levelStart = chapterWorldOffset + 1;
  const levelEnd = levelStart + chapter.stopIds.length - 1;
  const worldLabel = WORLD_LABELS[chapter.worldKit] || chapter.title;
  const chapterComplete = chapter.stopIds.every(stopId => done.has(stopId));
  const shortcutUnlocked = chapterComplete && relicIds.has(chapter.id) && Boolean(chapter.shortcut);
  const shortcutRoad = shortcutUnlocked
    ? mapPath([positions[0], { x: 50, y: 28 }, positions.at(-1)])
    : "";
  const currentPosition = journeyComplete
    ? null
    : positions.find(({ stop }) => stop.index === nextIndex)
      || [...positions].reverse().find(({ stop }) => done.has(stop.id))
      || positions[0];

  useEffect(() => () => window.clearTimeout(walkTimer.current), []);

  const reachable = candidate => {
    const first = Number(candidate.stopRange?.[0]) || 1;
    return first <= nextIndex || candidate.stopIds.some(stopId => done.has(stopId));
  };
  const furthestReachableChapter = QUEST_CHAPTERS.reduce(
    (furthest, candidate) => reachable(candidate) ? Math.max(furthest, candidate.index) : furthest,
    1
  );
  const visibleChapters = QUEST_CHAPTERS.filter(candidate => (
    reachable(candidate)
    || candidate.index === Math.min(QUEST_CHAPTERS.length, furthestReachableChapter + 1)
  ));

  const enter = stop => {
    if (stop.index > nextIndex && !done.has(stop.id)) return;
    // Excited double-taps must not double-fire world entry.
    if (walkingStop) return;
    setWalkingStop(stop.id);
    if (isSoundEnabled) playWhoosh();
    window.clearTimeout(walkTimer.current);
    walkTimer.current = window.setTimeout(() => {
      setWalkingStop(null);
      onEnterStop?.(stop.id);
    }, 520);
  };

  return (
    <main
      className="q-screen q-map-v2"
      data-world={chapter.worldKit}
      data-chapter={chapter.id}
      data-reduced-motion={state.settings?.reducedMotion ? "true" : undefined}
    >
      <header className="q-map-v2-header">
        <button type="button" className="q-ghost" onClick={onBack}>Close</button>
        <div className="q-map-v2-copy">
          <span>
            {journeyComplete && chapter.id === "star-reach"
              ? "Whole trail restored"
              : `${worldLabel} · Levels ${levelStart}–${levelEnd} of ${worldStops.length}`}
          </span>
          <h1>{chapter.title}</h1>
          <p>{journeyComplete && chapter.id === "star-reach" ? "Every sound is home. The First Reading Star is shining." : chapter.objective}</p>
        </div>
        <div className="q-map-v2-actions">
          <button type="button" className="q-ghost" onClick={onEditCharacter}>Character</button>
          <button type="button" className="q-ghost" onClick={onTradingPost}>Shop</button>
          <button type="button" className="q-ghost q-map-review" onClick={onFreeRoam}>
            {reviewPlan.weakest.length ? "Practise" : "Explore"}
          </button>
        </div>
      </header>

      <nav className="q-chapter-tabs" aria-label="Story chapters">
        {visibleChapters.map(candidate => {
          const open = reachable(candidate);
          const candidateWorldStops = QUEST_CHAPTERS
            .filter(worldChapter => worldChapter.worldKit === candidate.worldKit)
            .flatMap(worldChapter => worldChapter.stopIds);
          const candidateStart = Math.max(0, candidateWorldStops.indexOf(candidate.stopIds[0])) + 1;
          const candidateEnd = candidateStart + candidate.stopIds.length - 1;
          return (
            <button
              key={candidate.id}
              type="button"
              className={candidate.id === chapter.id ? "is-current" : ""}
              disabled={!open}
              aria-current={candidate.id === chapter.id ? "page" : undefined}
              onClick={() => onAct?.(candidate.index)}
            >
              <span>{candidateStart}</span>
              <strong>{open ? candidate.title : `Levels ${candidateStart}–${candidateEnd}`}</strong>
              <small>
                {relicIds.has(candidate.id)
                  ? "Relic found"
                  : `${candidate.stopIds.filter(stopId => done.has(stopId)).length} of ${candidate.stopIds.length} finished`}
              </small>
            </button>
          );
        })}
      </nav>

      <label className="q-chapter-picker">
        <span>Story chapter</span>
        <select
          value={chapter.index}
          onChange={event => onAct?.(Number(event.target.value))}
          aria-label="Choose a story chapter"
        >
          {visibleChapters.map(candidate => {
            const open = reachable(candidate);
            return (
              <option key={candidate.id} value={candidate.index} disabled={!open}>
                {candidate.index}. {open ? candidate.title : "Unexplored"}
              </option>
            );
          })}
        </select>
      </label>

      <section className="q-map-v2-land" aria-label={`${chapter.title} trail map`}>
        <div className="q-map-v2-weather" aria-hidden="true" />
        <div className="q-map-v2-distant" aria-hidden="true" />
        <div className="q-map-v2-ambient" aria-hidden="true">
          <i className="q-map-ambient-ripple is-one" />
          <i className="q-map-ambient-ripple is-two" />
          <i className="q-map-ambient-flow" />
          <i className="q-map-ambient-spark is-one" />
          <i className="q-map-ambient-spark is-two" />
          <i className="q-map-ambient-spark is-three" />
        </div>
        {shortcutUnlocked && (
          <svg className="q-map-v2-road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={shortcutRoad} className="q-map-shortcut-edge" />
            <path d={shortcutRoad} className="q-map-shortcut-centre" />
          </svg>
        )}
        {shortcutUnlocked && (
          <button
            type="button"
            className="q-map-shortcut"
            onClick={() => onShortcut?.(chapter.id)}
            aria-label={`${chapter.shortcut.label}. ${chapter.shortcut.action}`}
          >
            <span aria-hidden="true">&#8599;</span>
            <strong>{chapter.shortcut.label}</strong>
            <small>{chapter.shortcut.effect}</small>
          </button>
        )}
        {positions.map(({ stop, x, y }, index) => {
          const isDone = done.has(stop.id);
          const isNext = !journeyComplete && !isDone && stop.index === nextIndex;
          const locked = stop.index > nextIndex && !isDone;
          const stars = Number(state.trail?.stars?.[stop.id]) || 0;
          return (
            <button
              key={stop.id}
              type="button"
              className={`q-map-stop${isDone ? " is-done" : ""}${isNext ? " is-next" : ""}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              disabled={locked}
              onClick={() => enter(stop)}
              aria-label={locked ? `${stop.name}, unexplored` : `${stop.name}, ${stars} stars`}
            >
              {landmarks[index] && <img className="q-map-stop-landmark" src={landmarks[index]} alt="" aria-hidden="true" />}
              <span className="q-map-stop-number">{levelStart + index}</span>
              <strong>{locked ? `Level ${levelStart + index}` : stop.name}</strong>
              <small>{locked ? "Locked" : isDone ? `${stars} of 3 stars` : isNext ? "Continue here" : "Revisit"}</small>
            </button>
          );
        })}

        {currentPosition && (
          <div
            className={`q-map-v2-walker${walkingStop ? " is-walking" : ""}`}
            style={{ left: `${currentPosition.x}%`, top: `${currentPosition.y}%` }}
            data-side={currentPosition.x >= 65 ? "left" : "right"}
            aria-hidden="true"
          >
            <BookCharacterAvatar
              creature={state.creature}
              size={104}
              pose={walkingStop ? "walk" : "idle"}
              decorative
            />
          </div>
        )}

        <aside className="q-map-destination">
          <span>{journeyComplete && chapter.id === "star-reach" ? "Journey complete" : "Chapter destination"}</span>
          <strong>{journeyComplete && chapter.id === "star-reach" ? "The First Reading Star is awake" : chapter.destination}</strong>
          <p>{journeyComplete && chapter.id === "star-reach" ? "Its light now reaches every restored land." : chapter.finale.action}</p>
        </aside>
      </section>
    </main>
  );
}
