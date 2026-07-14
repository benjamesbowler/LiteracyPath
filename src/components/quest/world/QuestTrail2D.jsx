import { useMemo, useRef, useState } from "react";
import CreatureFigure from "../CreatureFigure.jsx";
import { ENCOUNTER_VIEWS } from "./encounterViews.js";
import { buildTrailSection } from "../../../utils/questHub.js";
import { targetsForStop } from "../../../utils/questReviewScheduler.js";
import { getStop, targetsAtStop } from "../../../data/questSequence.js";
import { starRubric } from "../../../utils/starRubric.js";
import { displayGrapheme } from "../shells/shellContract.js";

export default function QuestTrail2D({
  stopId,
  state,
  isSoundEnabled = true,
  mode = "journey",
  targetsOverride = null,
  onAnswer,
  onCheckpoint,
  onFinish,
  onQuit
}) {
  const stop = getStop(stopId);
  const section = useMemo(() => {
    const targets = Array.isArray(targetsOverride) && targetsOverride.length
      ? [...new Set(targetsOverride)]
      : targetsForStop(targetsAtStop(stopId), state.mastery, stop?.index || 1);
    return buildTrailSection(stopId, {
      mastery: state.mastery,
      targets,
      seed: (stop?.index || 1) * 1000 + (mode === "review" ? 509 : 0),
      completedStopIds: state.trail?.stopsDone || []
    });
  }, [mode, state.mastery, state.trail?.stopsDone, stop?.index, stopId, targetsOverride]);
  const [phase, setPhase] = useState(section?.teach?.length ? "teach" : "trail");
  const [teachIndex, setTeachIndex] = useState(0);
  const [encounterIndex, setEncounterIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [collected, setCollected] = useState(() => new Set());
  const tallyRef = useRef({ correct: 0, total: 0, mistakes: 0 });

  if (!section) return null;
  const encounter = section.encounters[encounterIndex] || null;
  const View = encounter ? ENCOUNTER_VIEWS[encounter.kind] : null;
  const beat = encounter?.beats?.[beatIndex] || null;
  const teach = section.teach[teachIndex] || null;

  const checkpoint = overrides => onCheckpoint?.({
    stopId,
    fallback2d: true,
    phase,
    meetIndex: teachIndex,
    activeId: encounter?.id || null,
    beatIndex,
    drops: [...collected],
    tally: tallyRef.current,
    ...overrides
  });

  const answer = (correct, target) => {
    tallyRef.current.total += 1;
    tallyRef.current.correct += correct ? 1 : 0;
    tallyRef.current.mistakes += correct ? 0 : 1;
    if (target) onAnswer?.(target, correct, encounter?.kind || "2d-trail");
  };

  const nextBeat = () => {
    if (beatIndex + 1 < (encounter?.beats?.length || 0)) {
      const next = beatIndex + 1;
      setBeatIndex(next);
      checkpoint({ beatIndex: next });
      return;
    }
    const dropId = section.drops[encounterIndex]?.id;
    if (dropId) setCollected(previous => new Set([...previous, dropId]));
    if (encounterIndex + 1 < section.encounters.length) {
      const next = encounterIndex + 1;
      setEncounterIndex(next);
      setBeatIndex(0);
      checkpoint({ activeId: section.encounters[next].id, beatIndex: 0 });
      return;
    }
    setPhase("gate");
    checkpoint({ phase: "gate", activeId: null, beatIndex: 0 });
  };

  const finish = () => {
    const score = tallyRef.current;
    const stars = starRubric({ correct: score.correct, total: score.total, mistakes: score.mistakes, deaths: 0 });
    onFinish?.(stars, { ...score, drops: collected.size });
  };

  return (
    <main className="q-screen q2d-root" data-world={section.world} data-play-mode={mode}>
      <header className="q2d-header">
        <button type="button" className="q-ghost" onClick={() => { checkpoint(); onQuit?.(); }}>Back to the Den</button>
        <div>
          <span>{mode === "review" ? "Free-roam review" : section.chapter?.title}</span>
          <strong>{stop?.name}</strong>
        </div>
        <span className="q2d-progress">{Math.min(section.encounters.length, encounterIndex + (phase === "gate" ? 1 : 0))} / {section.encounters.length}</span>
      </header>

      <section className="q2d-world" aria-label={`${section.chapter?.title || "Sound Seekers"} two-dimensional trail`}>
        <div className="q2d-scenery" aria-hidden="true">
          <span className="q2d-sun" />
          <span className="q2d-hills is-far" />
          <span className="q2d-hills is-near" />
          <span className="q2d-path" />
        </div>
        <ol className="q2d-route" aria-label="Trail progress">
          {section.encounters.map((item, index) => (
            <li key={item.id} className={index < encounterIndex || phase === "gate" ? "is-done" : index === encounterIndex ? "is-current" : ""}>
              <span>{index + 1}</span><small>{item.friend}</small>
            </li>
          ))}
        </ol>
        <div className="q2d-creature" aria-hidden="true">
          <CreatureFigure creature={state.creature} size={126} mood={phase === "gate" ? "cheer" : "idle"} />
        </div>
      </section>

      <section className="q2d-task" aria-live="polite">
        {phase === "teach" && teach && (
          <div className="q2d-teach">
            <span className="q2d-kicker">Meet {section.guide.friend}</span>
            <h1>{displayGrapheme(teach.id)}</h1>
            <p>{teach.prompt || teach.line || `This sound is ${displayGrapheme(teach.id)}.`}</p>
            <button type="button" className="q-primary" onClick={() => {
              if (teachIndex + 1 < section.teach.length) {
                setTeachIndex(index => index + 1);
              } else {
                setPhase("trail");
                checkpoint({ phase: "trail", guideDone: true, activeId: section.encounters[0]?.id || null });
              }
            }}>Continue</button>
          </div>
        )}

        {phase === "trail" && View && beat && (
          <View
            key={`${encounter.id}-${beatIndex}`}
            beat={beat}
            index={beatIndex}
            total={encounter.beats.length}
            isSoundEnabled={isSoundEnabled}
            onBeat={answer}
            onDone={nextBeat}
          />
        )}

        {phase === "gate" && (
          <div className="q2d-gate" role="status">
            <span className="q2d-kicker">Trail restored</span>
            <h1>{section.isChapterFinale ? section.finale?.title : "The gate is open"}</h1>
            <p>You found {collected.size} sun drops. Your progress and sound evidence are ready to bank.</p>
            <button type="button" className="q-primary" onClick={finish}>Continue through the gate</button>
          </div>
        )}
      </section>
    </main>
  );
}
