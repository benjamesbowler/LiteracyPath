import { useMemo, useState } from "react";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";
import "../styles/skills-block-quest.css";

const PHASE_LABELS = {
  "early-letter-sound": "Sound Spark",
  "letter-sound-expansion": "Sound Spark",
  "microphase-wrap-up": "Power Check",
  "cvc-onset": "Word Forge",
  "cvc-rime": "Word Forge",
  "letter-sound-completion": "Sound Spark",
  digraphs: "Pattern Gate",
  patterns: "Pattern Gate",
  "pattern-power": "Fluency Run",
  "review-extension": "Review Loop",
  benchmark: "Checkpoint",
  baseline: "Checkpoint",
  celebration: "Victory Lap"
};

const PHASE_COLORS = {
  "Sound Spark": "#0C6B65",
  "Word Forge": "#C2410C",
  "Pattern Gate": "#6D5BD0",
  "Fluency Run": "#2F7D52",
  "Review Loop": "#B45309",
  "Power Check": "#2563A8",
  Checkpoint: "#64748B",
  "Victory Lap": "#B45309"
};

const SAMPLE_WORDS = {
  "Sound Spark": ["apple", "moon", "sun", "net"],
  "Word Forge": ["bat", "wig", "ship", "thin"],
  "Pattern Gate": ["shop", "chip", "thing", "ring"],
  "Fluency Run": ["by", "my", "try", "friend"],
  "Review Loop": ["sat", "map", "not", "that"],
  "Power Check": ["am", "the", "ship", "ring"],
  Checkpoint: ["a", "m", "the", "said"],
  "Victory Lap": ["read", "write", "share", "shine"]
};

const ROUND_MODES = [
  {
    id: "hear",
    label: "Hear",
    title: "Sound Catch",
    short: "listen first",
    meter: "2 new"
  },
  {
    id: "build",
    label: "Build",
    title: "Word Forge",
    short: "move tiles",
    meter: "3 review"
  },
  {
    id: "read",
    label: "Read",
    title: "Speed Read",
    short: "quick words",
    meter: "1 stretch"
  }
];

function cycleNumberValue(cycle) {
  return cycle.cycleNumber || 0;
}

function getPhaseLabel(cycle) {
  return PHASE_LABELS[cycle.phase] || "Skills Quest";
}

function getFocusCards(cycle) {
  const focus = cycle.focusLetters?.length ? cycle.focusLetters : cycle.reviewLetters || [];
  return focus.slice(0, 4);
}

function getCycleTitle(cycle) {
  if (cycle.cycleNumber) return `Cycle ${cycle.cycleNumber}`;
  if (cycle.type === "review") return "Review";
  return cycle.title.replace(/\s*Assessment\s*/i, "Check");
}

function getStudentGoal(cycle) {
  const focus = getFocusCards(cycle).map(card => card.grapheme || card.spelling).filter(Boolean);
  const hfw = cycle.highFrequencyWords || [];
  if (focus.length && hfw.length) return `I can use ${focus.join(", ")} and read ${hfw.slice(0, 3).join(", ")}.`;
  if (focus.length) return `I can hear and use ${focus.join(", ")}.`;
  if (hfw.length) return `I can read ${hfw.slice(0, 4).join(", ")}.`;
  return "I can show what I know and keep moving.";
}

function makePrompt(cycle, mode) {
  const phaseLabel = getPhaseLabel(cycle);
  const focus = getFocusCards(cycle);
  const hfw = cycle.highFrequencyWords || [];
  const words = SAMPLE_WORDS[phaseLabel] || SAMPLE_WORDS["Sound Spark"];
  const focusChoice = focus[0]?.spelling || focus[0]?.grapheme || hfw[0] || "a";
  const secondChoice = focus[1]?.spelling || focus[1]?.grapheme || hfw[1] || "m";
  const choices = [...new Set([focusChoice, secondChoice, ...(hfw.slice(0, 2)), "review"])].slice(0, 4);

  if (mode === "build") {
    const word = words[cycleNumberValue(cycle) % words.length] || "map";
    return {
      cue: word,
      prompt: `Build ${word}.`,
      choices: word.split("").slice(0, 5),
      answer: word[0],
      action: "Tap the first sound, then finish the word."
    };
  }

  if (mode === "read") {
    const word = hfw[0] || words[(cycleNumberValue(cycle) + 1) % words.length] || "am";
    return {
      cue: word,
      prompt: `Find ${word}.`,
      choices: [...new Set([word, hfw[1], words[0], words[1]].filter(Boolean))].slice(0, 4),
      answer: word,
      action: "Read it once slowly, then once fast."
    };
  }

  return {
    cue: focus[0]?.sound || words[0],
    prompt: `Which tile matches ${focus[0]?.sound || words[0]}?`,
    choices,
    answer: choices[0],
    action: "Listen, say it, choose it."
  };
}

function StatPill({ label, value }) {
  return (
    <span className="sbq-stat-pill">
      <strong>{value}</strong>
      <span>{label}</span>
    </span>
  );
}

export function SkillsBlockQuestMockup({ studentName = "Reader" }) {
  const playableCycles = useMemo(() => (
    elSkillsBlockCycles.filter(cycle => cycle.cycleNumber || cycle.type === "review")
  ), []);
  const highestCycle = useMemo(() => (
    playableCycles.reduce((max, cycle) => Math.max(max, cycle.cycleNumber || 0), 0)
  ), [playableCycles]);
  const [activeCycleId, setActiveCycleId] = useState("cycle-15");
  const [activeMode, setActiveMode] = useState("hear");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [streak, setStreak] = useState(7);
  const [energy, setEnergy] = useState(82);

  const activeCycle = playableCycles.find(cycle => cycle.id === activeCycleId) || playableCycles[0];
  const phaseLabel = getPhaseLabel(activeCycle);
  const phaseColor = PHASE_COLORS[phaseLabel] || "#0C6B65";
  const prompt = makePrompt(activeCycle, activeMode);
  const isCorrect = selectedAnswer && selectedAnswer === prompt.answer;
  const needsBridge = selectedAnswer && !isCorrect;
  const focusCards = getFocusCards(activeCycle);
  const currentIndex = playableCycles.findIndex(cycle => cycle.id === activeCycle.id);
  const pathProgress = Math.round(((currentIndex + 1) / playableCycles.length) * 100);

  function chooseAnswer(answer) {
    setSelectedAnswer(answer);
    if (answer === prompt.answer) {
      setStreak(value => Math.min(12, value + 1));
      setEnergy(value => Math.min(100, value + 4));
    } else {
      setStreak(0);
      setEnergy(value => Math.max(35, value - 8));
    }
  }

  function moveCycle(direction) {
    const nextIndex = Math.min(playableCycles.length - 1, Math.max(0, currentIndex + direction));
    setActiveCycleId(playableCycles[nextIndex].id);
    setSelectedAnswer("");
  }

  function setMode(modeId) {
    setActiveMode(modeId);
    setSelectedAnswer("");
  }

  return (
    <main className="skills-block-quest" style={{ "--sbq-phase": phaseColor }}>
      <section className="sbq-hero" aria-label="Skills Quest">
        <div className="sbq-hero-copy">
          <span className="sbq-kicker">Skills Quest</span>
          <h1>One path for every sound, word, and reading move.</h1>
          <p>Hi {studentName || "Reader"}. Your quest changes as you grow, but the rules stay familiar.</p>
          <div className="sbq-hero-actions" aria-label="Quest controls">
            <button type="button" className="sbq-primary-button" onClick={() => setMode("hear")}>
              Play Round
            </button>
            <button type="button" className="sbq-ghost-button" onClick={() => moveCycle(1)}>
              Next Cycle
            </button>
          </div>
        </div>
        <div className="sbq-hero-art" aria-hidden="true">
          <img src="/images/learn-games/art/cvc-train.webp" alt="" />
          <div className="sbq-orbit-card top">
            <strong>{highestCycle}</strong>
            <span>cycles</span>
          </div>
          <div className="sbq-orbit-card bottom">
            <strong>{pathProgress}%</strong>
            <span>path</span>
          </div>
        </div>
      </section>

      <section className="sbq-status-band" aria-label="My quest status">
        <StatPill label="streak" value={streak} />
        <StatPill label="energy" value={`${energy}%`} />
        <StatPill label="new" value="20%" />
        <StatPill label="review" value="60%" />
        <StatPill label="stretch" value="20%" />
      </section>

      <section className="sbq-game-shell" aria-label="Current game round">
        <aside className="sbq-cycle-panel" aria-label="Cycle path">
          <div className="sbq-panel-heading">
            <span>My Path</span>
            <strong>{currentIndex + 1}/{playableCycles.length} stops</strong>
          </div>
          <div className="sbq-path-track" aria-hidden="true">
            <span style={{ width: `${pathProgress}%` }} />
          </div>
          <div className="sbq-cycle-list">
            {playableCycles.map(cycle => {
              const active = cycle.id === activeCycle.id;
              return (
                <button
                  key={cycle.id}
                  className={`sbq-cycle-chip ${active ? "active" : ""}`}
                  type="button"
                  onClick={() => {
                    setActiveCycleId(cycle.id);
                    setSelectedAnswer("");
                  }}
                >
                  <span>{getCycleTitle(cycle)}</span>
                  <small>{getPhaseLabel(cycle)}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="sbq-play-area">
          <div className="sbq-round-top">
            <div>
              <span className="sbq-kicker">{phaseLabel}</span>
              <h2>{activeCycle.title}</h2>
              <p>{getStudentGoal(activeCycle)}</p>
            </div>
            <div className="sbq-cycle-nav" aria-label="Cycle navigation">
              <button type="button" onClick={() => moveCycle(-1)} disabled={currentIndex === 0}>Back</button>
              <button type="button" onClick={() => moveCycle(1)} disabled={currentIndex === playableCycles.length - 1}>Next</button>
            </div>
          </div>

          <div className="sbq-mode-tabs" aria-label="Round type">
            {ROUND_MODES.map(mode => (
              <button
                key={mode.id}
                type="button"
                className={activeMode === mode.id ? "active" : ""}
                onClick={() => setMode(mode.id)}
              >
                <strong>{mode.label}</strong>
                <span>{mode.meter}</span>
              </button>
            ))}
          </div>

          <div className="sbq-round-card">
            <div className="sbq-round-card-header">
              <div>
                <span>{ROUND_MODES.find(mode => mode.id === activeMode)?.title}</span>
                <strong>{prompt.prompt}</strong>
              </div>
              <button type="button" className="sbq-listen-button">
                Listen
              </button>
            </div>

            <div className="sbq-cue-board" aria-label="Round cue">
              <span>{prompt.cue}</span>
            </div>

            <div className="sbq-answer-grid" aria-label="Answer choices">
              {prompt.choices.map(choice => {
                const picked = selectedAnswer === choice;
                const correct = selectedAnswer && choice === prompt.answer;
                return (
                  <button
                    key={choice}
                    type="button"
                    className={`${picked ? "picked" : ""} ${correct ? "correct" : ""}`}
                    onClick={() => chooseAnswer(choice)}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            <div className={`sbq-feedback ${isCorrect ? "good" : needsBridge ? "bridge" : ""}`} role="status">
              {isCorrect
                ? "Nice. That goes into your fast pile."
                : needsBridge
                  ? "Bridge round unlocked. Try it with fewer choices."
                  : prompt.action}
            </div>
          </div>
        </div>

        <aside className="sbq-focus-panel" aria-label="Focus stack">
          <div className="sbq-panel-heading">
            <span>Today</span>
            <strong>just right</strong>
          </div>
          <div className="sbq-focus-list">
            {focusCards.map(card => (
              <div key={`${activeCycle.id}-${card.spelling || card.grapheme}`} className="sbq-focus-tile">
                <strong>{card.grapheme || card.spelling}</strong>
                <span>{card.sound || card.spelling}</span>
              </div>
            ))}
            {(activeCycle.highFrequencyWords || []).slice(0, 4).map(word => (
              <div key={`${activeCycle.id}-${word}`} className="sbq-focus-tile word">
                <strong>{word}</strong>
                <span>quick word</span>
              </div>
            ))}
          </div>
          <div className="sbq-rule-stack" aria-label="Game balance">
            <div>
              <strong>Too easy</strong>
              <span>faster round, one stretch word</span>
            </div>
            <div>
              <strong>Too hard</strong>
              <span>bridge round, fewer choices</span>
            </div>
            <div>
              <strong>Too samey</strong>
              <span>hear, build, read rotation</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
