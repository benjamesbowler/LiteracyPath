import { useEffect, useMemo, useRef, useState } from "react";
import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { getChildWordAsset } from "../../data/childAssets";
import { speakWithBrowser } from "../../utils/audio/speakWithBrowser.js";
import { playCueAudio, stopCueAudio } from "../../utils/audio/cuePlayer.js";
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare, playStarChime } from "../../utils/audio/gameSfx.js";
import { queueProgressSave } from "../../utils/progressSync.js";
import { notifyMissionTaskDone } from "../../utils/dailyMission.js";
import { awardCollectible, getCompanion } from "../../utils/studentProfile.js";
import { printCertificate } from "../../utils/printCertificate.js";
import { Gem } from "../Gem.jsx";
import { gemForIndex } from "../../data/gemSet.js";
import { worldForCycle, worldStyle, sceneForKey } from "../../utils/palWorlds.js";
import { ConfettiCelebration } from "../learn/games/shared/ConfettiCelebration.jsx";
import { ProgressStars } from "../learn/games/shared/ProgressStars.jsx";
import {
  STATIONS,
  buildStationRounds,
  graphemeAudioPath,
  starsForAccuracy,
  shuffleItems
} from "./elQuestEngine.js";
import "../../styles/skills-block-quest.css";

const STORAGE_PREFIX = "lp-el-quest";

// The journey map: three lands, nine cycles each.
const WORLD_REGIONS = [
  { id: "meadow", name: "Meadow Farm", test: n => n <= 9 },
  { id: "dino", name: "Dinosaur Valley", test: n => n >= 10 && n <= 18 },
  { id: "moonwood", name: "Moonwood Forest", test: n => n >= 19 }
];

function loadQuestProgress(scopeKey) {
  if (typeof window === "undefined") return { cycles: {} };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}:${scopeKey}`) || "null");
    return parsed && typeof parsed === "object" ? { cycles: {}, ...parsed } : { cycles: {} };
  } catch {
    return { cycles: {} };
  }
}

function saveQuestProgress(scopeKey, progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}:${scopeKey}`, JSON.stringify(progress));
  } catch {
    // Local persistence is best-effort; cloud sync still queues below.
  }
  queueProgressSave("el_quest", "__all__", { v: 1, ...progress }, { scopeKey });
}

function playCue(round) {
  if (!round) return;
  playCueAudio(round.audio, {
    onUnavailable: () => speakWithBrowser(round.speechFallback, { rate: 0.84 })
  });
}

function SpeakerIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function PictureChoice({ word }) {
  const [failed, setFailed] = useState(false);
  const asset = getChildWordAsset(word, { allowBlockedAssessmentImage: true });
  const src = asset?.image || asset?.fallbackImage || "";
  if (!src || failed) return <span className="sbq-choice-word">{word}</span>;
  return (
    <>
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      <span className="sbq-choice-caption">{word}</span>
    </>
  );
}

// Letter tracing: a big faint letter with a finger-paint canvas on top.
// Generous by design - any decent amount of tracing counts.
function TraceRound({ round, onResult }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [ink, setInk] = useState(0);

  function pointFrom(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * canvas.width) / rect.width,
      ((event.clientY - rect.top) * canvas.height) / rect.height
    ];
  }

  function paint(event) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const [x, y] = pointFrom(event);
    ctx.fillStyle = "#2F9E62";
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    setInk(value => value + 1);
  }

  function clearInk() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setInk(0);
  }

  return (
    <div className="sbq-trace">
      <div className="sbq-trace-stage">
        <span className="sbq-trace-letter" aria-hidden="true">{round.letter}</span>
        <canvas
          ref={canvasRef}
          width={460}
          height={300}
          aria-label={`Trace the letter ${round.letter}`}
          onPointerDown={event => { drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); paint(event); }}
          onPointerMove={paint}
          onPointerUp={() => { drawing.current = false; }}
          onPointerCancel={() => { drawing.current = false; }}
        />
      </div>
      <div className="sbq-trace-actions">
        <button className="sbq-ghost-button" type="button" onClick={clearInk}>
          Start again
        </button>
        <button
          className="sbq-primary-button"
          type="button"
          disabled={ink < 25}
          onClick={() => onResult(true)}
        >
          Done!
        </button>
      </div>
    </div>
  );
}

function BuildRound({ round, onResult }) {
  // placed = [{ letter, tileIndex }] so duplicate letters keep their own tile.
  const [placed, setPlaced] = useState([]);
  const [checking, setChecking] = useState(false);
  const letters = useMemo(() => {
    const target = round.word.split("");
    const extras = shuffleItems("aeioustmnp".split("").filter(l => !target.includes(l))).slice(0, 2);
    return shuffleItems([...target, ...extras]);
  }, [round.word]);

  const usedTiles = new Set(placed.map(item => item.tileIndex));

  function tapLetter(letter, tileIndex) {
    if (checking || usedTiles.has(tileIndex) || placed.length >= round.word.length) return;
    const cue = graphemeAudioPath(letter);
    if (cue) playCueAudio(cue, { volume: 0.9 });
    const next = [...placed, { letter, tileIndex }];
    setPlaced(next);

    if (next.length !== round.word.length) return;

    if (next.map(item => item.letter).join("") === round.word) {
      setChecking(true);
      window.setTimeout(() => onResult(true), 420);
    } else {
      // Wrong word: count the miss, tip the letters out, try again.
      onResult(false);
      setChecking(true);
      window.setTimeout(() => {
        setPlaced([]);
        setChecking(false);
      }, 750);
    }
  }

  function removeAt(slotIndex) {
    if (checking || slotIndex >= placed.length) return;
    setPlaced(current => current.filter((_, index) => index !== slotIndex));
  }

  return (
    <>
      <div className="sbq-build-slots" aria-label="Word letters. Tap a filled box to take the letter out.">
        {round.word.split("").map((letter, index) => (
          placed[index] ? (
            <button
              key={`slot-${index}`}
              type="button"
              className="filled"
              aria-label={`Remove letter ${placed[index].letter}`}
              onClick={() => removeAt(index)}
            >
              {placed[index].letter}
            </button>
          ) : (
            <span key={`slot-${index}`} />
          )
        ))}
      </div>
      <div className="sbq-answer-grid letters" aria-label="Letter choices">
        {letters.map((letter, index) => (
          <button
            key={`${letter}-${index}`}
            type="button"
            disabled={usedTiles.has(index)}
            className={usedTiles.has(index) ? "used" : ""}
            onClick={() => tapLetter(letter, index)}
          >
            {letter}
          </button>
        ))}
      </div>
    </>
  );
}

export function ElSkillsQuest({ studentName = "Reader", progressScopeKey = "default", onExit }) {
  const playableCycles = useMemo(
    () => elSkillsBlockCycles.filter(cycle => cycle.cycleNumber),
    []
  );
  const [progress, setProgress] = useState(() => loadQuestProgress(progressScopeKey));
  const recommendedCycle = useMemo(() => (
    playableCycles.find(cycle => !(progress.cycles?.[cycle.id]?.stars > 0)) || playableCycles[0]
  ), [playableCycles, progress]);

  const [activeCycleId, setActiveCycleId] = useState(null);
  const [stationId, setStationId] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [sessionStations, setSessionStations] = useState({});
  const cueTimerRef = useRef(null);

  const activeCycle = playableCycles.find(cycle => cycle.id === activeCycleId) || null;
  const round = rounds[roundIndex] || null;

  useEffect(() => {
    if (!round || round.type === "build") return undefined;
    cueTimerRef.current = window.setTimeout(() => playCue(round), 120);
    // Warm the next round's audio so it starts instantly.
    const next = rounds[roundIndex + 1];
    if (next?.audio) {
      try { new Audio(next.audio).preload = "auto"; } catch { /* ignore */ }
    }
    return () => window.clearTimeout(cueTimerRef.current);
  }, [round, rounds, roundIndex]);

  function openCycle(cycle) {
    setActiveCycleId(cycle.id);
    setStationId(null);
    setCelebration(null);
    setSessionStations({});
  }

  function startStation(cycle, id) {
    setStationId(id);
    setRounds(buildStationRounds(cycle, id));
    setRoundIndex(0);
    setCorrect(0);
    setWrongs(0);
    setCelebration(null);
  }

  function finishStation(finalCorrect, finalWrongs) {
    stopCueAudio();
    const total = rounds.length;
    notifyMissionTaskDone(progressScopeKey, "quest");
    if (stationId === "check") {
      const stars = starsForAccuracy(finalCorrect, total, finalWrongs);
      const previous = progress.cycles?.[activeCycle.id] || {};
      const nextProgress = {
        ...progress,
        cycles: {
          ...progress.cycles,
          [activeCycle.id]: {
            stars: Math.max(previous.stars || 0, stars),
            bestScore: Math.max(previous.bestScore || 0, finalCorrect * 10),
            plays: (previous.plays || 0) + 1,
            lastPlayedAt: new Date().toISOString()
          }
        }
      };
      setProgress(nextProgress);
      saveQuestProgress(progressScopeKey, nextProgress);
      playCelebrationFanfare();
      const gem = stars > 0
        ? awardCollectible(progressScopeKey, {
            key: `cycle-${activeCycle.id}`,
            ...gemForIndex(activeCycle.cycleNumber || 0),
            label: `Cycle ${activeCycle.cycleNumber}`
          })
        : null;
      setCelebration({ kind: "cycle", stars, correct: finalCorrect, total, gem });
    } else {
      playStarChime();
      setSessionStations(previous => ({ ...previous, [stationId]: true }));
      // Persist which stations are done so progress survives sign-out.
      const withStations = {
        ...progress,
        cycles: {
          ...progress.cycles,
          [activeCycle.id]: {
            ...(progress.cycles?.[activeCycle.id] || {}),
            stations: {
              ...(progress.cycles?.[activeCycle.id]?.stations || {}),
              [stationId]: true
            }
          }
        }
      };
      setProgress(withStations);
      saveQuestProgress(progressScopeKey, withStations);
      setCelebration({ kind: "station", correct: finalCorrect, total });
    }
    setStationId(null);
  }

  function handleAnswer(success) {
    if (success) {
      playCorrectChime();
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      if (roundIndex + 1 >= rounds.length) {
        window.setTimeout(() => finishStation(nextCorrect, wrongs), 500);
      } else {
        window.setTimeout(() => setRoundIndex(index => index + 1), 500);
      }
    } else {
      playSoftBuzz();
      setWrongs(value => value + 1);
      setShaking(true);
    }
  }

  function chooseTile(choice) {
    handleAnswer(choice === round.answer);
  }

  // ── Cycle map ──────────────────────────────────────────────────────────────
  const travelerImage = getCompanion(progressScopeKey)?.image
    || `/images/pals/poses/${worldForCycle(recommendedCycle?.cycleNumber || 1).id}-wave.webp`;

  // Walk the avatar from its last stop to the new one when a cycle is won.
  const stopRefs = useRef({});
  const avatarRef = useRef(null);
  useEffect(() => {
    if (activeCycle || celebration || !recommendedCycle?.id) return;
    const key = `${STORAGE_PREFIX}-laststop:${progressScopeKey}`;
    let previousId = null;
    try {
      previousId = window.localStorage.getItem(key);
      window.localStorage.setItem(key, recommendedCycle.id);
    } catch { /* best effort */ }
    if (!previousId || previousId === recommendedCycle.id) return;
    const previousStop = stopRefs.current[previousId];
    const avatar = avatarRef.current;
    if (!previousStop || !avatar || typeof avatar.animate !== "function") return;
    const from = previousStop.getBoundingClientRect();
    const to = avatar.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top - to.top;
    avatar.animate([
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: `translate(${dx * 0.66}px, ${dy * 0.66 - 30}px)` },
      { transform: `translate(${dx * 0.33}px, ${dy * 0.33}px)` },
      { transform: "translate(0px, -30px)" },
      { transform: "translate(0px, 0px)" }
    ], { duration: 1400, easing: "ease-in-out" });
  }, [activeCycle, celebration, progressScopeKey, recommendedCycle?.id]);

  if (!activeCycle) {
    return (
      <main className="skills-block-quest" data-pal-world={worldForCycle(recommendedCycle?.cycleNumber || 1).id}>
        <header className="sbq-top">
          <div>
            <p className="sbq-kicker">Skills Quest</p>
            <h1>Your sound and word path</h1>
            <p className="sbq-sub">Hi {studentName}. Pick your stop - each one teaches two new sounds and your quick words.</p>
          </div>
          {onExit && (
            <button className="sbq-ghost-button" type="button" onClick={onExit}>Back</button>
          )}
        </header>
        <div className="sbq-worldmap" aria-label="Quest journey map">
          {WORLD_REGIONS.map(region => {
            const stops = playableCycles.filter(cycle => region.test(cycle.cycleNumber));
            if (!stops.length) return null;
            return (
              <section key={region.id} className="sbq-region" data-pal-world={region.id}>
                <h2 className="sbq-region-name">{region.name}</h2>
                <div className="sbq-region-path">
                  {stops.map((cycle, index) => {
                    const cycleProgress = progress.cycles?.[cycle.id];
                    const isRecommended = cycle.id === recommendedCycle?.id;
                    const isLastOverall = cycle.id === playableCycles[playableCycles.length - 1]?.id;
                    return (
                      <div
                        key={cycle.id}
                        className={`sbq-stop-row o${index % 4}${index === stops.length - 1 ? " row-last" : ""}${isLastOverall ? " map-last" : ""}`}
                      >
                        <button
                          type="button"
                          ref={el => { stopRefs.current[cycle.id] = el; }}
                          className={`sbq-stop${cycleProgress?.stars ? " done" : ""}${isRecommended ? " next" : ""}`}
                          onClick={() => openCycle(cycle)}
                          aria-label={`Cycle ${cycle.cycleNumber}${isRecommended ? " - you are here" : ""}`}
                        >
                          {isRecommended && (
                            <img
                              ref={avatarRef}
                              className="sbq-journey-avatar"
                              src={travelerImage}
                              alt=""
                              aria-hidden="true"
                            />
                          )}
                          <strong>{cycleProgress?.stars ? "★" : cycle.cycleNumber}</strong>
                          <span className="sbq-stop-label">
                            {(cycle.focusLetters || []).map(item => item.grapheme).join(" ") || "Review"}
                          </span>
                          {cycleProgress?.stars ? <ProgressStars stars={cycleProgress.stars} /> : isRecommended ? <em>You are here</em> : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    );
  }

  // ── Celebration ────────────────────────────────────────────────────────────
  if (celebration) {
    const isCycle = celebration.kind === "cycle";
    return (
      <main className="skills-block-quest">
        <div className="sbq-celebrate">
          {isCycle && <ConfettiCelebration show={celebration.stars > 0} />}
          <img src={isCycle ? worldForCycle(activeCycle.cycleNumber).cheer : worldForCycle(activeCycle.cycleNumber).point} alt="" />
          <h2>{isCycle ? `Cycle ${activeCycle.cycleNumber} complete!` : "Station done!"}</h2>
          <p>{celebration.correct}/{celebration.total} right</p>
          {isCycle && <ProgressStars stars={celebration.stars} size="lg" />}
          {isCycle && celebration.gem && (
            <div className="sbq-gem-award">
              <Gem color={celebration.gem.color} size={56} />
              <span>You earned the <strong>{celebration.gem.name}</strong>!</span>
            </div>
          )}
          <div className="sbq-celebrate-actions">
            <button className="sbq-primary-button" type="button" onClick={() => setCelebration(null)}>
              {isCycle ? "Back to the map" : "Keep going"}
            </button>
            {isCycle && celebration.stars === 3 && (
              <button
                className="sbq-ghost-button"
                type="button"
                onClick={() => printCertificate({
                  studentName,
                  achievement: `Completed Cycle ${activeCycle.cycleNumber} with three stars`,
                  detail: activeCycle.childFriendlyGoal || ""
                })}
              >
                Print certificate
              </button>
            )}
            {isCycle && (
              <button
                className="sbq-ghost-button"
                type="button"
                onClick={() => {
                  setCelebration(null);
                  setActiveCycleId(null);
                  setSessionStations({});
                }}
              >
                Choose a cycle
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Station picker for the open cycle ─────────────────────────────────────
  if (!stationId) {
    return (
      <main className="skills-block-quest" data-pal-world={worldForCycle(activeCycle.cycleNumber).id} style={worldStyle(worldForCycle(activeCycle.cycleNumber))}>
        <header className="sbq-top">
          <div>
            <p className="sbq-kicker">Cycle {activeCycle.cycleNumber}</p>
            <h1>{(activeCycle.focusLetters || []).map(item => item.grapheme).join(" and ") || "Review time"}</h1>
            <p className="sbq-sub">{activeCycle.childFriendlyGoal}</p>
          </div>
          <button className="sbq-ghost-button" type="button" onClick={() => setActiveCycleId(null)}>
            Map
          </button>
        </header>
        <div className="sbq-stations" aria-label="Stations">
          {STATIONS.map((station, index) => {
            const savedStations = progress.cycles?.[activeCycle.id]?.stations || {};
            const done = Boolean(sessionStations[station.id] || savedStations[station.id]);
            const isCheck = station.id === "check";
            // The Cycle Check is the show-what-you-know finale: it opens
            // after at least four practice stations are done.
            const practiceDone = STATIONS.filter(item => item.id !== "check"
              && (sessionStations[item.id] || savedStations[item.id])).length;
            const checkLocked = isCheck && practiceDone < 4 && !progress.cycles?.[activeCycle.id]?.stars;
            return (
              <button
                key={station.id}
                type="button"
                className={`sbq-station${done ? " done" : ""}${isCheck ? " check" : ""}${checkLocked ? " locked" : ""}`}
                disabled={checkLocked}
                onClick={() => startStation(activeCycle, station.id)}
              >
                <span className="sbq-station-step" aria-hidden="true">{done ? "✓" : checkLocked ? "🔒" : index + 1}</span>
                <span className="sbq-station-copy">
                  <strong>{station.title}</strong>
                  <em>{checkLocked ? `Play ${4 - practiceDone} more station${4 - practiceDone === 1 ? "" : "s"} to open` : station.subtitle}</em>
                </span>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  // ── A live round ───────────────────────────────────────────────────────────
  const station = STATIONS.find(item => item.id === stationId);
  const roundWorld = worldForCycle(activeCycle.cycleNumber);
  return (
    <main
      className="skills-block-quest"
      data-pal-world={roundWorld.id}
      style={{ ...worldStyle(roundWorld), "--pal-scene": `url(${sceneForKey(roundWorld, `${activeCycle.id}-${stationId}`)})` }}
    >
      <div className="pal-scene-backdrop" aria-hidden="true" />
      <header className="sbq-top compact">
        <div>
          <p className="sbq-kicker">{station?.title}</p>
          <h1 className="sbq-round-count">{roundIndex + 1} of {rounds.length}</h1>
        </div>
        <button
          className="sbq-ghost-button"
          type="button"
          onClick={() => setStationId(null)}
        >
          Stop
        </button>
      </header>
      <div className="sbq-progress-track" aria-hidden="true">
        <span style={{ width: `${Math.round(((roundIndex) / Math.max(1, rounds.length)) * 100)}%` }} />
      </div>

      {round && (
        <div
          className={`sbq-round-card${shaking ? " sbq-shake" : ""}`}
          onAnimationEnd={() => setShaking(false)}
        >
          <p className="sbq-round-prompt">{round.prompt}</p>
          {(round.audio || round.speechFallback) && (
            <button className="sbq-listen-button" type="button" onClick={() => playCue(round)}>
              <SpeakerIcon />
              Listen
            </button>
          )}

          {round.poem && round.poemTitle && <p className="sbq-poem-title">{round.poemTitle}</p>}
          {round.display && (
            <div className={`sbq-round-display${round.poem ? " sbq-poem" : ""}`}>{round.display}</div>
          )}

          {round.type === "build" ? (
            <BuildRound key={`${round.word}-${roundIndex}`} round={round} onResult={handleAnswer} />
          ) : round.type === "trace" ? (
            <TraceRound key={`${round.letter}-${roundIndex}`} round={round} onResult={handleAnswer} />
          ) : (
            <div className={`sbq-answer-grid ${round.choiceStyle === "picture" ? "pictures" : round.choiceStyle === "letter" ? "letters" : "words"}`}>
              {round.choices.map(choice => (
                <button key={choice} type="button" onClick={() => chooseTile(choice)}>
                  {round.choiceStyle === "picture" ? <PictureChoice word={choice} /> : choice}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
