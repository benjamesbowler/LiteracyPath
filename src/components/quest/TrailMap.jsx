import { useEffect, useMemo, useRef, useState } from "react";
import CreatureFigure from "./CreatureFigure.jsx";
import { QUEST_CHAPTERS } from "../../data/questChapters.js";
import { getStop } from "../../data/questSequence.js";
import { currentStopIndex, unlockedChapterRewards } from "../../utils/questProgress.js";
import { playWhoosh } from "../../utils/audio/gameSfx.js";

const MAP_POINTS = Object.freeze([
  { x: 9, y: 70 },
  { x: 27, y: 52 },
  { x: 47, y: 64 },
  { x: 68, y: 43 },
  { x: 89, y: 56 }
]);

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
  onBack,
  isSoundEnabled = true
}) {
  const chapter = QUEST_CHAPTERS[Math.max(0, Math.min(QUEST_CHAPTERS.length - 1, act - 1))];
  const stops = useMemo(() => chapter.stopIds.map(getStop).filter(Boolean), [chapter]);
  const nextIndex = currentStopIndex(state);
  const done = new Set(state.trail?.stopsDone || []);
  const relicIds = new Set(unlockedChapterRewards(state).map(relic => relic.chapterId));
  const [walkingStop, setWalkingStop] = useState(null);
  const walkTimer = useRef(0);
  const positions = stops.map((stop, index) => ({ stop, ...MAP_POINTS[index] }));
  const road = mapPath(positions);
  const currentPosition = positions.find(({ stop }) => stop.index === nextIndex)
    || [...positions].reverse().find(({ stop }) => done.has(stop.id))
    || positions[0];

  useEffect(() => () => window.clearTimeout(walkTimer.current), []);

  const reachable = candidate => {
    const first = Number(candidate.stopRange?.[0]) || 1;
    return first <= nextIndex || candidate.stopIds.some(stopId => done.has(stopId));
  };

  const enter = stop => {
    if (stop.index > nextIndex && !done.has(stop.id)) return;
    setWalkingStop(stop.id);
    if (isSoundEnabled) playWhoosh();
    walkTimer.current = window.setTimeout(() => {
      setWalkingStop(null);
      onEnterStop?.(stop.id);
    }, 520);
  };

  return (
    <main className="q-screen q-map-v2" data-world={chapter.worldKit} data-chapter={chapter.id}>
      <header className="q-map-v2-header">
        <button type="button" className="q-ghost" onClick={onBack}>Back to the Den</button>
        <div>
          <span>World trail</span>
          <h1>{chapter.title}</h1>
          <p>{chapter.objective}</p>
        </div>
        <button type="button" className="q-primary q-map-review" onClick={onFreeRoam}>Free Roam</button>
      </header>

      <nav className="q-chapter-tabs" aria-label="Story chapters">
        {QUEST_CHAPTERS.map(candidate => {
          const open = reachable(candidate);
          return (
            <button
              key={candidate.id}
              type="button"
              className={candidate.id === chapter.id ? "is-current" : ""}
              disabled={!open}
              aria-current={candidate.id === chapter.id ? "page" : undefined}
              onClick={() => onAct?.(candidate.index)}
            >
              <span>{candidate.index}</span>
              <strong>{open ? candidate.title : "Unexplored"}</strong>
              <small>{relicIds.has(candidate.id) ? "Relic found" : `${candidate.stopIds.filter(stopId => done.has(stopId)).length} of 5`}</small>
            </button>
          );
        })}
      </nav>

      <section className="q-map-v2-land" aria-label={`${chapter.title} trail map`}>
        <div className="q-map-v2-weather" aria-hidden="true" />
        <div className="q-map-v2-distant" aria-hidden="true" />
        <svg className="q-map-v2-road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={road} className="q-map-road-edge" />
          <path d={road} className="q-map-road-centre" />
        </svg>
        {positions.map(({ stop, x, y }, index) => {
          const isDone = done.has(stop.id);
          const isNext = stop.index === nextIndex;
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
              <span className="q-map-stop-number">{locked ? "" : index + 1}</span>
              <strong>{locked ? "Unexplored" : stop.name}</strong>
              <small>{locked ? "Not reached" : isDone ? `${stars} of 3 stars` : isNext ? "Continue here" : "Revisit"}</small>
            </button>
          );
        })}

        {currentPosition && (
          <div
            className={`q-map-v2-walker${walkingStop ? " is-walking" : ""}`}
            style={{ left: `${currentPosition.x}%`, top: `${currentPosition.y}%` }}
            aria-hidden="true"
          >
            <CreatureFigure creature={state.creature} size={92} mood={walkingStop ? "walk" : "idle"} />
          </div>
        )}

        <aside className="q-map-destination">
          <span>Chapter destination</span>
          <strong>{chapter.destination}</strong>
          <p>{chapter.finale.action}</p>
        </aside>
      </section>
    </main>
  );
}
