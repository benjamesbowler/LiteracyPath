import { useState } from "react";

const echoMissions = [
  {
    id: "crystal-hum",
    name: "The Crystal Hum",
    format: "Sound Finder",
    prompt: "Which word starts like cat?",
    spoken: "Which word starts like cat?",
    choices: ["cat", "dog", "sun", "pig"],
    answer: "cat",
    reward: "Crystal Fragment",
    shards: 1
  },
  {
    id: "lost-crystals",
    name: "Rumble's Lost Crystals",
    format: "Echo Drop",
    prompt: "Find the word Rumble says.",
    spoken: "Find the word cat.",
    choices: ["cat", "cot", "cut", "cit"],
    answer: "cat",
    reward: "Cave Moss Gem",
    shards: 2
  },
  {
    id: "four-tunnel-crystals",
    name: "The Four Tunnel Crystals",
    format: "Tap-the-Sound",
    prompt: "Three crystals sound alike. Find the different one.",
    spoken: "Listen for the one that sounds different.",
    choices: ["cat", "map", "hat", "mud"],
    answer: "mud",
    reward: "Ancient Cave Pearl",
    shards: 2
  },
  {
    id: "deep-crystal-mastery",
    name: "Deep Crystal Mastery",
    format: "Echo Drop",
    prompt: "Find the word Rumble says.",
    spoken: "Find the word cap.",
    choices: ["cap", "cup", "cop", "map"],
    answer: "cap",
    reward: "Heart Crystal",
    shards: 3
  }
];

function CrystalShards({ count = 3 }) {
  return (
    <div className="child-crystal-row" aria-label={`${count} crystal shards`}>
      {Array.from({ length: count }).map((_, index) => (
        <span className="child-crystal-shard" key={index}></span>
      ))}
    </div>
  );
}

function Rumble({ active }) {
  return (
    <div className={active ? "rumble rumble-active" : "rumble"} aria-label="Rumble">
      <div className="rumble-horn left"></div>
      <div className="rumble-horn right"></div>
      <div className="rumble-face">
        <span></span>
        <span></span>
      </div>
      <div className="rumble-smile"></div>
    </div>
  );
}

function EchoCavesMap({ startMission, returnToTeacher }) {
  return (
    <main className="child-mode echo-caves-screen">
      <button className="child-exit-button" onClick={returnToTeacher} type="button">
        Back to Teacher
      </button>

      <section className="echo-cave-hero" aria-label="Echo Caves Short-A Tunnel">
        <div className="cave-glow cave-glow-one"></div>
        <div className="cave-glow cave-glow-two"></div>
        <div className="cave-ceiling"></div>
        <div className="cave-lake"></div>

        <div className="child-world-heading">
          <p>Echo Caves</p>
          <h1>Short-A Tunnel</h1>
        </div>

        <div className="rumble-stage">
          <Rumble active />
          <div className="rumble-speech">Rumble found a glowing tunnel.</div>
        </div>

        <div className="short-a-path" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="mission-card-grid">
          {echoMissions.map((mission, index) => (
            <button
              className="child-mission-card"
              key={mission.id}
              onClick={() => startMission(index)}
              type="button"
            >
              <span className="mission-glow-dot"></span>
              <strong>{mission.name}</strong>
              <small>{mission.reward}</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function ChildActivityShell({ mission, onComplete, returnToMap }) {
  const [feedback, setFeedback] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState("");

  function choose(choice) {
    setSelectedChoice(choice);

    if (choice === mission.answer) {
      setFeedback("correct");
      window.setTimeout(() => onComplete(), 850);
      return;
    }

    setFeedback("incorrect");
    window.setTimeout(() => {
      setFeedback(null);
      setSelectedChoice("");
    }, 620);
  }

  return (
    <main className="child-mode child-activity-screen">
      <section className="child-world-zone">
        <button className="child-exit-button child-map-button" onClick={returnToMap} type="button">
          Path
        </button>

        <div className="ambient-crystals">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="child-world-copy">
          <p>Echo Caves</p>
          <h1>{mission.name}</h1>
        </div>

        <button className="rumble-replay-button" type="button" aria-label="Replay Rumble">
          <Rumble active={feedback === "correct"} />
          <span className="replay-ring"></span>
        </button>

        <div className="reward-jar" aria-label="Reward jar">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </section>

      <section className="child-interaction-zone">
        <div className="child-prompt-row">
          <button className="child-speaker-button" type="button" aria-label="Hear it again">
            Listen
          </button>
          <div>
            <p className="child-helper-text">Rumble says:</p>
            <h2>{mission.prompt}</h2>
          </div>
        </div>

        <div className="child-choice-grid">
          {mission.choices.map(choice => {
            const isSelected = choice === selectedChoice;
            const feedbackClass = isSelected && feedback ? `child-card-${feedback}` : "";

            return (
              <button
                className={`child-word-card ${feedbackClass}`}
                key={choice}
                onClick={() => choose(choice)}
                type="button"
              >
                <span className="word-card-crystal"></span>
                {choice}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function MissionCompleteScreen({ mission, returnToMap }) {
  return (
    <main className="child-mode child-complete-screen">
      <div className="complete-cave-scene">
        <div className="complete-light"></div>
        <Rumble active />

        <div className="complete-message">
          <p>The cave glows brighter.</p>
          <h1>{mission.reward}</h1>
          <CrystalShards count={mission.shards} />
        </div>

        <button className="child-continue-button" onClick={returnToMap} type="button">
          Keep Exploring
        </button>
      </div>
    </main>
  );
}

export function ChildModePage({ returnToTeacher }) {
  const [screen, setScreen] = useState("map");
  const [activeMissionIndex, setActiveMissionIndex] = useState(0);

  const activeMission = echoMissions[activeMissionIndex];

  function startMission(index) {
    setActiveMissionIndex(index);
    setScreen("activity");
  }

  if (screen === "activity") {
    return (
      <ChildActivityShell
        mission={activeMission}
        onComplete={() => setScreen("complete")}
        returnToMap={() => setScreen("map")}
      />
    );
  }

  if (screen === "complete") {
    return (
      <MissionCompleteScreen
        mission={activeMission}
        returnToMap={() => setScreen("map")}
      />
    );
  }

  return <EchoCavesMap startMission={startMission} returnToTeacher={returnToTeacher} />;
}
