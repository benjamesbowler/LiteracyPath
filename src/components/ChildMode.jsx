import { useEffect, useState } from "react";

import { audioManifest, audioTextIndex } from "../data/audioManifest";
import { getChildAudioPath, rumbleAssets } from "../data/childAssets";
import { shortAEchoCavesQuestions } from "../data/childActivityModels";
import { guidedReadingBooks } from "../data/guidedReadingBooks";

const echoMissions = [
  {
    id: "crystal-hum",
    name: "The Crystal Hum",
    format: "Picture Bridge",
    questionIndexes: [0, 1, 2, 3, 4, 5, 6, 7],
    reward: "Crystal Fragment",
    shards: 1,
    starReward: 8
  },
  {
    id: "lost-crystals",
    name: "Rumble's Lost Crystals",
    format: "Picture Bridge",
    questionIndexes: [8, 9, 10, 11, 12, 13, 14, 15],
    reward: "Cave Moss Gem",
    shards: 2,
    starReward: 10
  },
  {
    id: "four-tunnel-crystals",
    name: "The Four Tunnel Crystals",
    format: "Picture Bridge",
    questionIndexes: [16, 17, 18, 19, 20, 21, 22, 23],
    reward: "Ancient Cave Pearl",
    shards: 2,
    starReward: 10
  },
  {
    id: "deep-crystal-mastery",
    name: "Deep Crystal Mastery",
    format: "Picture Bridge",
    questionIndexes: [24, 25, 26, 27, 28, 29, 30, 31],
    reward: "Heart Crystal",
    shards: 3,
    starReward: 12
  }
];

const SPACE_HUB_STORAGE_KEY = "literacyPath:spaceHub:v1";

const fictionBooks = guidedReadingBooks.filter(book => book.type === "fiction");
const nonfictionBooks = guidedReadingBooks.filter(book => book.type === "nonfiction");

const spaceZones = [
  {
    id: "fiction-galaxy",
    name: "Fiction Galaxy",
    shortName: "Fiction",
    category: "Books",
    accent: "violet",
    total: Math.max(fictionBooks.length, 1),
    actionLabel: "Read a story",
    recommendation: "Read one story, then answer a quick check.",
    description: "Original story books, fluency practice, and gentle reading checks."
  },
  {
    id: "discovery-zone",
    name: "Discovery Zone",
    shortName: "Discovery",
    category: "Nonfiction",
    accent: "teal",
    total: Math.max(nonfictionBooks.length, 1),
    actionLabel: "Explore nonfiction",
    recommendation: "Try one science book and name two facts.",
    description: "Nonfiction books, science facts, and picture-supported quizzes."
  },
  {
    id: "phonics-lab",
    name: "Phonics Lab",
    shortName: "Phonics",
    category: "Skills",
    accent: "amber",
    total: echoMissions.length,
    actionLabel: "Practice sounds",
    recommendation: "Start with Short-A Tunnel, then build stars.",
    description: "Fast practice missions connected to the skill path."
  },
  {
    id: "word-city",
    name: "Word City",
    shortName: "Words",
    category: "Sight Words",
    accent: "blue",
    total: 4,
    actionLabel: "Practice words",
    recommendation: "Practice five sight words before reading.",
    description: "Sight word routes, vocabulary checks, and future spelling games."
  },
  {
    id: "math-moon",
    name: "Math Moon",
    shortName: "Math",
    category: "Future",
    accent: "slate",
    total: 0,
    actionLabel: "Coming later",
    recommendation: "Future placeholder for math practice.",
    description: "A placeholder zone for later numeracy work.",
    locked: true
  }
];

const cosmeticItems = [
  {
    id: "planet-rings",
    name: "Planet Rings",
    cost: 12,
    description: "Add a soft ring to your reading planet."
  },
  {
    id: "star-window",
    name: "Star Window",
    cost: 16,
    description: "Light up the hub with a cozy window."
  },
  {
    id: "comet-trail",
    name: "Comet Trail",
    cost: 20,
    description: "A calm comet trail for completed missions."
  },
  {
    id: "book-beacon",
    name: "Book Beacon",
    cost: 24,
    description: "A warm beacon for reading goals."
  }
];

function createDefaultSpaceHubProgress() {
  return {
    stars: 18,
    planetName: "Reader Planet",
    planetLevel: 1,
    unlockedCosmetics: ["star-window"],
    equippedCosmetics: ["star-window"],
    completedMissions: {},
    zones: spaceZones.reduce((zones, zone) => {
      zones[zone.id] = {
        completed: zone.id === "fiction-galaxy" ? Math.min(1, fictionBooks.length) : 0,
        total: zone.total,
        stars: zone.id === "fiction-galaxy" ? 6 : 0
      };
      return zones;
    }, {})
  };
}

function loadSpaceHubProgress() {
  const defaults = createDefaultSpaceHubProgress();
  if (typeof window === "undefined") return defaults;

  try {
    const stored = window.localStorage.getItem(SPACE_HUB_STORAGE_KEY);
    if (!stored) return defaults;

    const parsed = JSON.parse(stored);
    return {
      ...defaults,
      ...parsed,
      zones: {
        ...defaults.zones,
        ...(parsed.zones || {})
      },
      completedMissions: parsed.completedMissions || {},
      unlockedCosmetics: parsed.unlockedCosmetics || defaults.unlockedCosmetics,
      equippedCosmetics: parsed.equippedCosmetics || defaults.equippedCosmetics
    };
  } catch (error) {
    console.warn("Space Hub progress could not be loaded.", error);
    return defaults;
  }
}

function saveSpaceHubProgress(progress) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SPACE_HUB_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("Space Hub progress could not be saved.", error);
  }
}

function getZoneProgress(zone, progress) {
  const record = progress?.zones?.[zone.id] || { completed: 0, total: zone.total, stars: 0 };
  const total = Math.max(record.total || zone.total || 0, 0);
  const completed = Math.min(record.completed || 0, total || record.completed || 0);
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { ...record, total, completed, percent };
}

function normalizeAudioText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Dev-only fallback for Space Hub prototypes; Teacher Assessment Mode never uses browser TTS.
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

function hashSeed(value) {
  return String(value || "").split("").reduce((hash, char) => {
    const nextHash = (hash << 5) - hash + char.charCodeAt(0);
    return nextHash | 0;
  }, 0);
}

export function shuffleChoices(questionId, sessionSeed, choices = [], preferredCorrectIndex = 0, answer = "") {
  const correctChoice = choices.find(choice => (choice.word || choice) === answer);
  const distractors = choices.filter(choice => (choice.word || choice) !== answer);
  let seed = Math.abs(hashSeed(`${sessionSeed}:${questionId}`)) || 1;
  const shuffledDistractors = [...distractors];

  for (let index = shuffledDistractors.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const swapIndex = seed % (index + 1);
    [shuffledDistractors[index], shuffledDistractors[swapIndex]] = [shuffledDistractors[swapIndex], shuffledDistractors[index]];
  }

  if (!correctChoice) return shuffledDistractors;

  const correctIndex = Math.min(preferredCorrectIndex, choices.length - 1);
  shuffledDistractors.splice(correctIndex, 0, correctChoice);
  return shuffledDistractors;
}

function getQuestionImageSource(question) {
  if (!question?.targetAsset) return "";
  return question.targetAsset.image || question.targetAsset.fallbackImage || "";
}

function preloadImage(src) {
  if (!src || typeof window === "undefined") return;

  const image = new Image();
  image.src = src;
}

function preloadMissionImages(questions = []) {
  questions.forEach(question => {
    preloadImage(getQuestionImageSource(question));
    if (question?.targetAsset?.fallbackImage) preloadImage(question.targetAsset.fallbackImage);
  });
}

async function speakChildText(text) {
  if (!text) return;

  const childAudioPath = getChildAudioPath(text);
  if (childAudioPath) {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      const audio = new Audio(childAudioPath);
      await audio.play();
      return;
    } catch (error) {
      console.warn("Kimi Child Mode audio unavailable, checking existing audio.", error);
    }
  }

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
  const rumbleImage = active ? rumbleAssets.excited : rumbleAssets.listening;

  return (
    <div
      className={active ? "rumble rumble-active rumble-asset-ready" : "rumble rumble-asset-ready"}
      aria-label="Rumble"
    >
      <img className="rumble-asset-image" src={rumbleImage} alt="" aria-hidden="true" />
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

function SpaceProgressBar({ percent, label }) {
  return (
    <div className="space-progress" aria-label={label || `${percent}% complete`}>
      <span style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}></span>
    </div>
  );
}

function SpaceTopBar({ progress, returnToTeacher, openShop, goHome }) {
  return (
    <header className="space-topbar">
      <button className="space-pill-button" onClick={goHome} type="button">
        Space Hub
      </button>
      <div className="space-topbar-status" aria-label={`${progress.stars} stars`}>
        <span className="space-star-dot" aria-hidden="true"></span>
        <strong>{progress.stars}</strong>
        <span>stars</span>
      </div>
      <button className="space-pill-button" onClick={openShop} type="button">
        Planet Upgrades
      </button>
      <button className="space-pill-button space-exit-pill" onClick={returnToTeacher} type="button">
        Back to Teacher
      </button>
    </header>
  );
}

function SpacePlanetProfile({ progress }) {
  const equipped = cosmeticItems.filter(item => progress.equippedCosmetics?.includes(item.id));
  const unlockedCount = progress.unlockedCosmetics?.length || 0;

  return (
    <section className="space-profile-card" aria-label="Reader profile">
      <div className="space-planet">
        {progress.equippedCosmetics?.includes("planet-rings") && <span className="space-planet-ring"></span>}
        <span className="space-planet-core"></span>
        {progress.equippedCosmetics?.includes("star-window") && <span className="space-planet-window"></span>}
        {progress.equippedCosmetics?.includes("comet-trail") && <span className="space-comet-trail"></span>}
        {progress.equippedCosmetics?.includes("book-beacon") && <span className="space-book-beacon"></span>}
      </div>
      <div>
        <p>Reader profile</p>
        <h2>{progress.planetName}</h2>
        <span>Level {progress.planetLevel} planet</span>
      </div>
      <div className="space-profile-meta">
        <strong>{unlockedCount}/{cosmeticItems.length}</strong>
        <span>upgrades</span>
      </div>
      {equipped.length > 0 && (
        <div className="space-equipped-list" aria-label="Equipped upgrades">
          {equipped.map(item => <span key={item.id}>{item.name}</span>)}
        </div>
      )}
    </section>
  );
}

function SpaceZoneCard({ zone, progress, openZone }) {
  const zoneProgress = getZoneProgress(zone, progress);

  return (
    <button
      className={`space-zone-card space-zone-${zone.accent}`}
      disabled={zone.locked}
      onClick={() => openZone(zone.id)}
      type="button"
    >
      <div className="space-zone-card-top">
        <span>{zone.category}</span>
        <strong>{zone.locked ? "Future" : `${zoneProgress.percent}%`}</strong>
      </div>
      <h3>{zone.name}</h3>
      <p>{zone.description}</p>
      <SpaceProgressBar percent={zoneProgress.percent} label={`${zone.name} progress`} />
      <div className="space-zone-card-footer">
        <span>{zoneProgress.completed}/{zoneProgress.total || "?"} complete</span>
        <strong>{zone.actionLabel}</strong>
      </div>
    </button>
  );
}

function SpaceHubHome({ progress, openZone, openShop, returnToTeacher }) {
  const totalCompleted = spaceZones.reduce((sum, zone) => sum + getZoneProgress(zone, progress).completed, 0);
  const totalPossible = spaceZones.reduce((sum, zone) => sum + (zone.total || 0), 0);
  const totalPercent = totalPossible ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return (
    <main className="child-mode space-hub-screen">
      <SpaceTopBar
        progress={progress}
        returnToTeacher={returnToTeacher}
        openShop={openShop}
        goHome={() => {}}
      />

      <section className="space-hub-hero" aria-label="Space Hub home">
        <div className="space-hub-copy">
          <p>Read. Practice. Quiz. Earn stars.</p>
          <h1>Space Hub</h1>
          <span>A calm literacy hub for books, skill practice, quizzes, and planet upgrades.</span>
        </div>
        <SpacePlanetProfile progress={progress} />
      </section>

      <section className="space-hub-summary" aria-label="Space Hub progress summary">
        <div>
          <span>Hub completion</span>
          <strong>{totalPercent}%</strong>
          <SpaceProgressBar percent={totalPercent} label="Hub completion" />
        </div>
        <div>
          <span>Recommended next</span>
          <strong>Phonics Lab</strong>
          <p>Practice a short mission, then spend stars on a planet upgrade.</p>
        </div>
      </section>

      <section className="space-zone-grid" aria-label="Learning zones">
        {spaceZones.map(zone => (
          <SpaceZoneCard
            key={zone.id}
            zone={zone}
            progress={progress}
            openZone={openZone}
          />
        ))}
      </section>
    </main>
  );
}

function BookMissionList({ books, emptyLabel }) {
  if (!books.length) {
    return <p className="space-muted-note">{emptyLabel}</p>;
  }

  return (
    <div className="space-book-list">
      {books.map(book => (
        <article className="space-book-card" key={book.id}>
          <img src={book.coverImage} alt="" aria-hidden="true" />
          <div>
            <span>Level {book.level}</span>
            <h4>{book.title}</h4>
            <p>{book.targetSkills?.slice(0, 3).join(" / ")}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function SpaceZonePage({ zoneId, progress, startMission, openShop, returnToTeacher, returnHome }) {
  const zone = spaceZones.find(item => item.id === zoneId) || spaceZones[0];
  const zoneProgress = getZoneProgress(zone, progress);

  return (
    <main className={`child-mode space-zone-screen space-zone-${zone.accent}`}>
      <SpaceTopBar
        progress={progress}
        returnToTeacher={returnToTeacher}
        openShop={openShop}
        goHome={returnHome}
      />

      <section className="space-zone-layout">
        <aside className="space-zone-panel">
          <span>{zone.category}</span>
          <h1>{zone.name}</h1>
          <p>{zone.description}</p>
          <SpaceProgressBar percent={zoneProgress.percent} label={`${zone.name} progress`} />
          <strong>{zoneProgress.completed}/{zoneProgress.total || "?"} complete</strong>
          <div className="space-recommendation">
            <span>Recommended</span>
            <p>{zone.recommendation}</p>
          </div>
        </aside>

        <section className="space-zone-content" aria-label={`${zone.name} activities`}>
          {zone.id === "fiction-galaxy" && (
            <>
              <div className="space-section-heading">
                <h2>Story missions</h2>
                <p>Books connect to teacher-guided reading now. Independent quizzes can plug in later.</p>
              </div>
              <BookMissionList books={fictionBooks} emptyLabel="No fiction books are available yet." />
            </>
          )}

          {zone.id === "discovery-zone" && (
            <>
              <div className="space-section-heading">
                <h2>Discovery missions</h2>
                <p>Nonfiction reading plus short fact checks.</p>
              </div>
              <BookMissionList books={nonfictionBooks} emptyLabel="No nonfiction books are available yet." />
            </>
          )}

          {zone.id === "phonics-lab" && (
            <>
              <div className="space-section-heading">
                <h2>Skill missions</h2>
                <p>Short practice loops stay separate from Teacher Assessment mastery.</p>
              </div>
              <div className="space-mission-list">
                {echoMissions.map((mission, index) => {
                  const complete = progress.completedMissions?.[mission.id];

                  return (
                    <button
                      className="space-mission-row"
                      key={mission.id}
                      onClick={() => startMission(index)}
                      type="button"
                    >
                      <span>{complete ? "Complete" : "Ready"}</span>
                      <strong>{mission.name}</strong>
                      <small>{mission.format} / {mission.starReward} stars</small>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {zone.id === "word-city" && (
            <>
              <div className="space-section-heading">
                <h2>Word routes</h2>
                <p>Prototype routes for sight words, vocabulary, and quick quizzes.</p>
              </div>
              <div className="space-placeholder-grid">
                {["Sight word sprint", "Vocabulary match", "Sentence check", "Quiz review"].map((name, index) => (
                  <article className="space-placeholder-card" key={name}>
                    <span>Route {index + 1}</span>
                    <h4>{name}</h4>
                    <p>Ready for content hooks after the book pack lands.</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {zone.id === "math-moon" && (
            <div className="space-locked-panel">
              <h2>Math Moon is a future landing zone.</h2>
              <p>This prototype keeps literacy first while leaving room for later numeracy work.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function SpaceShop({ progress, updateProgress, returnHome, returnToTeacher }) {
  function unlockItem(item) {
    updateProgress(current => {
      const unlocked = current.unlockedCosmetics || [];
      const equipped = current.equippedCosmetics || [];

      if (unlocked.includes(item.id)) {
        return {
          ...current,
          equippedCosmetics: equipped.includes(item.id)
            ? equipped.filter(id => id !== item.id)
            : [...equipped, item.id]
        };
      }

      if (current.stars < item.cost) return current;

      return {
        ...current,
        stars: current.stars - item.cost,
        planetLevel: Math.max(current.planetLevel, Math.min(5, Math.floor((unlocked.length + 2) / 2) + 1)),
        unlockedCosmetics: [...unlocked, item.id],
        equippedCosmetics: [...equipped, item.id]
      };
    });
  }

  return (
    <main className="child-mode space-hub-screen space-shop-screen">
      <SpaceTopBar
        progress={progress}
        returnToTeacher={returnToTeacher}
        openShop={() => {}}
        goHome={returnHome}
      />

      <section className="space-shop-layout">
        <SpacePlanetProfile progress={progress} />
        <div className="space-section-heading">
          <p>Spend stars</p>
          <h1>Planet Upgrades</h1>
          <span>Small cosmetic rewards keep the loop motivating without touching assessment mastery.</span>
        </div>

        <div className="space-shop-grid">
          {cosmeticItems.map(item => {
            const unlocked = progress.unlockedCosmetics?.includes(item.id);
            const equipped = progress.equippedCosmetics?.includes(item.id);
            const canAfford = progress.stars >= item.cost;

            return (
              <button
                className={equipped ? "space-cosmetic-card equipped" : "space-cosmetic-card"}
                disabled={!unlocked && !canAfford}
                key={item.id}
                onClick={() => unlockItem(item)}
                type="button"
              >
                <span>{unlocked ? (equipped ? "Equipped" : "Unlocked") : `${item.cost} stars`}</span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function ChildActivityShell({ mission, onComplete, onAnswer, returnToMap, returnToTeacher }) {
  const [feedback, setFeedback] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [questionStep, setQuestionStep] = useState(0);
  const [sessionSeed, setSessionSeed] = useState("");
  const [shuffledChoices, setShuffledChoices] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const questions = (mission?.questionIndexes || [])
    .map(index => shortAEchoCavesQuestions[index])
    .filter(Boolean);
  const question = questions[questionStep];
  const isHeardWordMastery = question?.formatType === "HEARD_WORD_TO_PRINT_MINIMAL_PAIR";
  const questionImageSource = getQuestionImageSource(question);

  useEffect(() => {
    setFeedback(null);
    setSelectedChoice("");
    setQuestionStep(0);
    setSessionSeed(`${mission?.id || "mission"}-${Date.now()}-${Math.random()}`);
    preloadMissionImages(questions);
  }, [mission?.id]);

  useEffect(() => {
    if (!question?.choices?.length) return;

    setShuffledChoices(
      shuffleChoices(question.id, sessionSeed, question.choices, questionStep % question.choices.length, question.answer)
    );
  }, [question?.id, sessionSeed, questionStep]);

  useEffect(() => {
    setImageLoaded(!questionImageSource);
    preloadImage(getQuestionImageSource(questions[questionStep + 1]));
  }, [question?.id, questionImageSource, questionStep]);

  if (!mission || !question || (!isHeardWordMastery && !question.targetAsset) || !question.choices?.length) {
    return (
      <main className="child-mode child-mode-inline-fallback">
        <button className="child-exit-button" onClick={returnToTeacher} type="button">
          Back to Teacher
        </button>
        <section className="learning-world-fallback-card">
          <h1>Space Hub could not load</h1>
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
    const isCorrect = selectedWord === question.answer;

    onAnswer?.({
      source: "child_mode",
      questionId: question.id,
      targetWord: question.targetWord,
      itemKey: question.targetWord,
      itemType: "cvc_word",
      formatType: question.formatType,
      isCorrect,
      selectedAnswer: selectedWord,
      correctAnswer: question.answer,
      prompt: question.prompt,
      audioText: question.audioText,
      spokenPrompt: question.spokenPrompt,
      timestamp: new Date().toISOString()
    });

    if (isCorrect) {
      setFeedback("correct");
      window.setTimeout(() => {
        if (questionStep >= questions.length - 1) {
          onComplete({
            missionId: mission.id,
            zoneId: "phonics-lab",
            starsEarned: mission.starReward || mission.shards * 5
          });
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
          Back to Phonics Lab
        </button>

        <div className="ambient-crystals">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="child-world-copy">
          <p>Phonics Lab</p>
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

      <section className={isHeardWordMastery ? "child-interaction-zone child-heard-word-zone" : "child-interaction-zone child-format-two-zone"}>
        {!isHeardWordMastery && (
          <figure className="child-target-picture">
            <button
              className="child-target-picture-button"
              onClick={replayTargetAudio}
              type="button"
              aria-label={`Hear ${question.targetWord}`}
            >
              <img
                className={imageLoaded ? "child-target-image loaded" : "child-target-image"}
                src={questionImageSource}
                alt={question.targetAsset.alt}
                loading={questionStep === 0 ? "eager" : "lazy"}
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                onError={event => {
                  if (question.targetAsset.fallbackImage && !event.currentTarget.dataset.fallbackApplied) {
                    event.currentTarget.dataset.fallbackApplied = "true";
                    event.currentTarget.src = question.targetAsset.fallbackImage;
                  }
                }}
              />
              {!imageLoaded && <span className="child-image-skeleton" aria-hidden="true"></span>}
              <span className="picture-audio-badge" aria-hidden="true">▶</span>
            </button>
          </figure>
        )}

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
            <p className="child-helper-text">{isHeardWordMastery ? "Listen to Rumble" : "Picture clue"}</p>
            <h2>{question.prompt}</h2>
          </div>
        </div>

        <div className="child-choice-grid">
          {shuffledChoices.map(choice => {
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

function MissionCompleteScreen({ mission, completion, returnToZone, returnHome }) {
  const starsEarned = completion?.starsEarned || mission.starReward || mission.shards * 5;

  return (
    <main className="child-mode child-screen child-complete-screen space-complete-screen">
      <div className="complete-cave-scene space-complete-card">
        <div className="complete-light"></div>

        <div className="complete-message">
          <p>Mission complete</p>
          <h1>{mission.reward}</h1>
          <span className="space-earned-stars">+{starsEarned} stars</span>
          <CrystalShards count={mission.shards} />
        </div>

        <div className="space-action-row">
          <button className="child-continue-button" onClick={returnToZone} type="button">
            Back to Phonics Lab
          </button>
          <button className="child-continue-button child-continue-secondary" onClick={returnHome} type="button">
            Space Hub
          </button>
        </div>
      </div>
    </main>
  );
}

export function ChildModePage({ returnToTeacher, onAnswer }) {
  const [screen, setScreen] = useState("hub");
  const [activeZoneId, setActiveZoneId] = useState("phonics-lab");
  const [activeMissionIndex, setActiveMissionIndex] = useState(0);
  const [completion, setCompletion] = useState(null);
  const [progress, setProgress] = useState(() => loadSpaceHubProgress());

  const activeMission = echoMissions[activeMissionIndex];

  useEffect(() => {
    saveSpaceHubProgress(progress);
  }, [progress]);

  function updateProgress(updater) {
    setProgress(current => {
      const nextProgress = typeof updater === "function" ? updater(current) : updater;
      return {
        ...current,
        ...nextProgress,
        zones: {
          ...current.zones,
          ...(nextProgress.zones || {})
        }
      };
    });
  }

  function openZone(zoneId) {
    const zone = spaceZones.find(item => item.id === zoneId);
    if (!zone || zone.locked) return;
    setActiveZoneId(zoneId);
    setScreen("zone");
  }

  function startMission(index) {
    setActiveMissionIndex(index);
    setScreen("activity");
  }

  function completeMission(result = {}) {
    const starsEarned = result.starsEarned || activeMission.starReward || activeMission.shards * 5;
    const missionId = result.missionId || activeMission.id;

    setCompletion({ ...result, starsEarned, missionId });
    setProgress(current => {
      const alreadyComplete = current.completedMissions?.[missionId];
      const currentZone = current.zones?.["phonics-lab"] || { completed: 0, total: echoMissions.length, stars: 0 };
      const nextCompleted = alreadyComplete
        ? currentZone.completed
        : Math.min(echoMissions.length, (currentZone.completed || 0) + 1);

      return {
        ...current,
        stars: current.stars + starsEarned,
        completedMissions: {
          ...(current.completedMissions || {}),
          [missionId]: true
        },
        zones: {
          ...current.zones,
          "phonics-lab": {
            ...currentZone,
            total: echoMissions.length,
            completed: nextCompleted,
            stars: (currentZone.stars || 0) + starsEarned
          }
        }
      };
    });
    setScreen("complete");
  }

  if (screen === "activity") {
    return (
      <ChildActivityShell
        mission={activeMission}
        onComplete={completeMission}
        onAnswer={onAnswer}
        returnToMap={() => {
          setActiveZoneId("phonics-lab");
          setScreen("zone");
        }}
        returnToTeacher={returnToTeacher}
      />
    );
  }

  if (screen === "complete") {
    return (
      <MissionCompleteScreen
        mission={activeMission}
        completion={completion}
        returnToZone={() => {
          setActiveZoneId("phonics-lab");
          setScreen("zone");
        }}
        returnHome={() => setScreen("hub")}
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
          <h1>Space Hub could not load</h1>
          <button className="child-continue-button" onClick={returnToTeacher} type="button">
            Back to Teacher
          </button>
        </section>
      </main>
    );
  }

  if (screen === "shop") {
    return (
      <SpaceShop
        progress={progress}
        updateProgress={updateProgress}
        returnHome={() => setScreen("hub")}
        returnToTeacher={returnToTeacher}
      />
    );
  }

  if (screen === "zone") {
    return (
      <SpaceZonePage
        zoneId={activeZoneId}
        progress={progress}
        startMission={startMission}
        openShop={() => setScreen("shop")}
        returnToTeacher={returnToTeacher}
        returnHome={() => setScreen("hub")}
      />
    );
  }

  return (
    <SpaceHubHome
      progress={progress}
      openZone={openZone}
      openShop={() => setScreen("shop")}
      returnToTeacher={returnToTeacher}
    />
  );
}
