import { useEffect, useMemo, useRef, useState } from "react";
import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { getChildWordAsset } from "../../data/childAssets";
import { speakWithBrowser } from "../../utils/audio/speakWithBrowser.js";
import { playCueAudio, stopCueAudio } from "../../utils/audio/cuePlayer.js";
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare, playStarChime } from "../../utils/audio/gameSfx.js";
import { queueProgressSave } from "../../utils/progressSync.js";
import { markMissionDone } from "../../utils/dailyMission.js";
import { awardCollectible } from "../../utils/studentProfile.js";
import { printCertificate } from "../../utils/printCertificate.js";
import { Gem } from "../Gem.jsx";
import { gemForIndex } from "../../data/gemSet.js";
import { worldForCycle, worldStyle } from "../../utils/palWorlds.js";
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

function BuildRound({ round, onResult }) {
  const [placed, setPlaced] = useState([]);
  const letters = useMemo(() => {
    const target = round.word.split("");
    const extras = shuffleItems("aeioustmnp".split("").filter(l => !target.includes(l))).slice(0, 2);
    return shuffleItems([...target, ...extras]);
  }, [round.word]);

  function tapLetter(letter) {
    const expected = round.word[placed.length];
    if (letter !== expected) {
      onResult(false);
      return;
    }
    const next = [...placed, letter];
    setPlaced(next);
    const cue = graphemeAudioPath(letter);
    if (cue) playCueAudio(cue, { volume: 0.9 });
    if (next.join("") === round.word) {
      window.setTimeout(() => onResult(true), 420);
    }
  }

  return (
    <>
      <div className="sbq-build-slots" aria-label="Word letters">
        {round.word.split("").map((letter, index) => (
          <span key={`${letter}-${index}`} className={placed[index] ? "filled" : ""}>{placed[index] || ""}</span>
        ))}
      </div>
      <div className="sbq-answer-grid letters" aria-label="Letter choices">
        {letters.map((letter, index) => (
          <button key={`${letter}-${index}`} type="button" onClick={() => tapLetter(letter)}>
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
    markMissionDone(progressScopeKey, "quest");
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
        <div className="sbq-map" aria-label="Cycle path">
          {playableCycles.map(cycle => {
            const cycleProgress = progress.cycles?.[cycle.id];
            const isRecommended = cycle.id === recommendedCycle?.id;
            return (
              <button
                key={cycle.id}
                type="button"
                className={`sbq-map-stop${cycleProgress?.stars ? " done" : ""}${isRecommended ? " next" : ""}`}
                data-stop-world={worldForCycle(cycle.cycleNumber).id}
                style={worldStyle(worldForCycle(cycle.cycleNumber))}
                onClick={() => openCycle(cycle)}
              >
                <strong>{cycle.cycleNumber}</strong>
                <span>{(cycle.focusLetters || []).map(item => item.grapheme).join(" ") || "Review"}</span>
                {cycleProgress?.stars ? <ProgressStars stars={cycleProgress.stars} /> : isRecommended ? <em>Start here</em> : null}
              </button>
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
            const done = Boolean(sessionStations[station.id]);
            const isCheck = station.id === "check";
            return (
              <button
                key={station.id}
                type="button"
                className={`sbq-station${done ? " done" : ""}${isCheck ? " check" : ""}`}
                onClick={() => startStation(activeCycle, station.id)}
              >
                <span className="sbq-station-step" aria-hidden="true">{done ? "✓" : index + 1}</span>
                <span className="sbq-station-copy">
                  <strong>{station.title}</strong>
                  <em>{station.subtitle}</em>
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
  return (
    <main className="skills-block-quest">
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
          <button className="sbq-listen-button" type="button" onClick={() => playCue(round)}>
            <SpeakerIcon />
            Listen
          </button>

          {round.type === "build" ? (
            <BuildRound key={`${round.word}-${roundIndex}`} round={round} onResult={handleAnswer} />
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
