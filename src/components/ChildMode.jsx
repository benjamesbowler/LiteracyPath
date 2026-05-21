import { useEffect, useState } from "react";

import { audioManifest, audioTextIndex } from "../data/audioManifest";
import { shortAEchoCavesQuestions } from "../data/childActivityModels";

const echoMissions = [
  {
    id: "crystal-hum",
    name: "The Crystal Hum",
    format: "Picture Bridge",
    questionIndexes: [0, 1],
    reward: "Crystal Fragment",
    shards: 1
  },
  {
    id: "lost-crystals",
    name: "Rumble's Lost Crystals",
    format: "Picture Bridge",
    questionIndexes: [2, 3],
    reward: "Cave Moss Gem",
    shards: 2
  },
  {
    id: "four-tunnel-crystals",
    name: "The Four Tunnel Crystals",
    format: "Picture Bridge",
    questionIndexes: [4, 5],
    reward: "Ancient Cave Pearl",
    shards: 2
  },
  {
    id: "deep-crystal-mastery",
    name: "Deep Crystal Mastery",
    format: "Picture Bridge",
    questionIndexes: [6, 7],
    reward: "Heart Crystal",
    shards: 3
  }
];

function normalizeAudioText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function speakWithBrowser(text) {
  if (!text || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.lang = "en-US";

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn("Child Mode speech synthesis failed.", error);
  }
}

async function speakChildText(text) {
  if (!text) return;

  const normalizedText = normalizeAudioText(text);
  const audioKey = audioTextIndex[normalizedText];
  const audioEntry = audioKey ? audioManifest[audioKey] : null;

  if (audioEntry?.path) {
    const audioPaths = audioEntry.kinds?.includes("choice")
      ? [`/audio/choices/${audioKey}.mp3`, audioEntry.path]
      : [audioEntry.path];

    try {
      for (const audioPath of audioPaths) {
        const response = await fetch(audioPath, { method: "HEAD" });

        if (response.ok) {
          if (window.speechSynthesis) window.speechSynthesis.cancel();

          const audio = new Audio(audioPath);
          await audio.play();
          return;
        }
      }
    } catch (error) {
      console.warn("Child Mode local audio unavailable, using browser speech.", error);
    }
  }

  speakWithBrowser(text);
}

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
    <main className="child-mode child-screen child-map-screen child-subworld-screen child-mission-screen echo-caves-screen">
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

function ChildActivityShell({ mission, onComplete, returnToMap, returnToTeacher }) {
  const [feedback, setFeedback] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [questionStep, setQuestionStep] = useState(0);
  const questions = (mission?.questionIndexes || [])
    .map(index => shortAEchoCavesQuestions[index])
    .filter(Boolean);
  const question = questions[questionStep];

  useEffect(() => {
    setFeedback(null);
    setSelectedChoice("");
    setQuestionStep(0);
  }, [mission?.id]);

  if (!mission || !question?.targetAsset || !question.choices?.length) {
    return (
      <main className="child-mode child-mode-inline-fallback">
        <button className="child-exit-button" onClick={returnToTeacher} type="button">
          Back to Teacher
        </button>
        <section className="learning-world-fallback-card">
          <h1>Learning World could not load</h1>
          <button className="child-continue-button" onClick={returnToTeacher} type="button">
            Back to Teacher
          </button>
        </section>
      </main>
    );
  }

  function replayTargetAudio() {
    speakChildText(question.audioText || question.spokenPrompt || question.prompt);
  }

  function choose(choice) {
    const selectedWord = choice.word || choice;
    setSelectedChoice(selectedWord);

    if (selectedWord === question.answer) {
      setFeedback("correct");
      window.setTimeout(() => {
        if (questionStep >= questions.length - 1) {
          onComplete();
          return;
        }

        setQuestionStep(step => step + 1);
        setFeedback(null);
        setSelectedChoice("");
      }, 850);
      return;
    }

    setFeedback("incorrect");
    speakChildText(question.audioText || question.targetWord);
    window.setTimeout(() => {
      setFeedback(null);
      setSelectedChoice("");
    }, 620);
  }

  return (
    <main className="child-mode child-mode-page child-activity-screen child-activity-shell">
      <section className="child-world-zone">
        <button className="child-exit-button child-map-button" onClick={returnToMap} type="button">
          Back to Echo Caves
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

        <button
          className="rumble-replay-button"
          onClick={replayTargetAudio}
          type="button"
          aria-label={`Hear ${question.targetWord} again`}
        >
          <Rumble active={feedback === "correct"} />
          <span className="replay-ring"></span>
        </button>

        <div className="reward-jar" aria-label="Reward jar">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </section>

      <section className="child-interaction-zone child-format-two-zone">
        <figure className="child-target-picture">
          <button
            className="child-target-picture-button"
            onClick={replayTargetAudio}
            type="button"
            aria-label={`Hear ${question.targetWord}`}
          >
            <img src={question.targetAsset.image} alt={question.targetAsset.alt} />
            <span className="picture-audio-badge" aria-hidden="true">▶</span>
          </button>
        </figure>

        <div className="child-prompt-row">
          <button
            className="child-speaker-button"
            onClick={replayTargetAudio}
            type="button"
            aria-label={`Hear ${question.targetWord} again`}
          >
            <span aria-hidden="true">▶</span>
          </button>
          <div>
            <p className="child-helper-text">Picture clue</p>
            <h2>{question.prompt}</h2>
          </div>
        </div>

        <div className="child-choice-grid">
          {question.choices.map(choice => {
            const isSelected = choice.word === selectedChoice;
            const feedbackClass = isSelected && feedback ? `child-card-${feedback}` : "";

            return (
              <button
                className={`child-word-card ${feedbackClass}`}
                key={choice.id}
                onClick={() => choose(choice)}
                type="button"
                aria-label={choice.label}
              >
                <span className="word-card-crystal"></span>
                <span className="child-card-label">{choice.label}</span>
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
    <main className="child-mode child-screen child-complete-screen">
      <div className="complete-cave-scene">
        <div className="complete-light"></div>
        <Rumble active />

        <div className="complete-message">
          <p>The cave glows brighter.</p>
          <h1>{mission.reward}</h1>
          <CrystalShards count={mission.shards} />
        </div>

        <button className="child-continue-button" onClick={returnToMap} type="button">
          Back to Echo Caves
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
        returnToTeacher={returnToTeacher}
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

  if (!activeMission || echoMissions.length === 0) {
    return (
      <main className="child-mode child-mode-inline-fallback">
        <button className="child-exit-button" onClick={returnToTeacher} type="button">
          Back to Teacher
        </button>
        <section className="learning-world-fallback-card">
          <h1>Learning World could not load</h1>
          <button className="child-continue-button" onClick={returnToTeacher} type="button">
            Back to Teacher
          </button>
        </section>
      </main>
    );
  }

  return <EchoCavesMap startMission={startMission} returnToTeacher={returnToTeacher} />;
}
