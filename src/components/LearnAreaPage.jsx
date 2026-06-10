import { useEffect, useLayoutEffect, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import { loadStoryQuestProgress, saveStoryQuestProgress } from "../utils/storyQuestProgress.js";
import "../styles/phonics.css";
import { PhonicsLearnTab } from "./learn/phonics/PhonicsLearnTab";
import { StoryQuestPlayer } from "./StoryQuestPlayer.jsx";

const STORY_QUEST_LEVELS = [
  {
    key: "A",
    heading: "Level A Adventures",
    subheading: "Simple first reading adventures"
  },
  {
    key: "B",
    heading: "Level B Adventures",
    subheading: "Longer choice stories"
  },
  {
    key: "C",
    heading: "Level C Adventures",
    subheading: "Richer story adventures"
  }
];

function resolveStoryQuestLevel(quest = {}) {
  const candidates = [
    quest.level,
    quest.readingLevel,
    ...(Array.isArray(quest.tags) ? quest.tags : [])
  ]
    .filter(Boolean)
    .map(value => String(value).trim().toLowerCase());

  if (candidates.some(value => value === "c" || value.includes("level c"))) return "C";
  if (candidates.some(value => value === "b" || value.includes("level b"))) return "B";
  if (candidates.some(value => value === "a" || value === "early" || value.includes("level a"))) return "A";

  return "A";
}

export function LearnAreaPage({ progressScopeKey = "default" }) {
  const [learnTab, setLearnTab] = useState("phonics");
  const [activeQuestId, setActiveQuestId] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [selectedLevelKey, setSelectedLevelKey] = useState("A");
  const [questProgress, setQuestProgress] = useState(() => loadStoryQuestProgress(progressScopeKey));
  const [questProgressScope, setQuestProgressScope] = useState(progressScopeKey);
  const activeQuest = storyQuests.find(quest => quest.id === activeQuestId) || null;
  const questGroups = STORY_QUEST_LEVELS.map(level => ({
    ...level,
    quests: storyQuests.filter(quest => resolveStoryQuestLevel(quest) === level.key)
  }));
  const activeQuestProgress = activeQuest ? questProgress[activeQuest.id] || {} : {};
  const activeQuestInitialPageId =
    activeQuest && !activeQuestProgress.completed && activeQuestProgress.lastPageId
      ? activeQuestProgress.lastPageId
      : "";

  useLayoutEffect(() => {
    if (!activeQuestId || typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeQuestId]);

  useEffect(() => {
    setQuestProgressScope(progressScopeKey);
    setQuestProgress(loadStoryQuestProgress(progressScopeKey));
  }, [progressScopeKey]);

  useEffect(() => {
    if (questProgressScope !== progressScopeKey) return;
    saveStoryQuestProgress(progressScopeKey, questProgress);
  }, [progressScopeKey, questProgress, questProgressScope]);

  function updateQuestProgress(questId, patch) {
    setQuestProgress(previous => ({
      ...previous,
      [questId]: {
        ...(previous[questId] || {}),
        ...patch,
        opened: true,
        updatedAt: new Date().toISOString()
      }
    }));
  }

  function startQuest(questId) {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    setSelectedQuestId(questId);
    updateQuestProgress(questId, {});
    setActiveQuestId(questId);
  }

  function jumpToLevel(levelKey) {
    setSelectedLevelKey(levelKey);
    if (typeof document === "undefined") return;
    document.getElementById(`story-quest-level-${levelKey}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (activeQuest) {
    return (
      <main className="learn-area-page story-quest-learn-page" aria-label="Story Quests">
        <StoryQuestPlayer
          initialPageId={activeQuestInitialPageId}
          onComplete={(progressPatch = {}) => updateQuestProgress(activeQuest.id, {
            ...progressPatch,
            completed: true,
            completedAt: progressPatch.completedAt || new Date().toISOString()
          })}
          onExit={() => setActiveQuestId("")}
          onProgress={(pageId, progressPatch = {}) => updateQuestProgress(activeQuest.id, {
            ...progressPatch,
            lastPageId: pageId
          })}
          quest={activeQuest}
        />
      </main>
    );
  }

  return (
    <main className="learn-area-page story-quest-learn-page page-stack" aria-label="Story Quests">
      <div className="learn-tab-bar" role="tablist" aria-label="Learn area sections">
        <button
          role="tab"
          aria-selected={learnTab === "phonics"}
          className={learnTab === "phonics" ? "learn-tab active" : "learn-tab"}
          onClick={() => setLearnTab("phonics")}
          type="button"
        >
          Phonics
        </button>
        <button
          role="tab"
          aria-selected={learnTab === "stories"}
          className={learnTab === "stories" ? "learn-tab active" : "learn-tab"}
          onClick={() => setLearnTab("stories")}
          type="button"
        >
          Story Quests
        </button>
      </div>

      {learnTab === "phonics" && (
        <section className="phonics-tab-shell" aria-label="Phonics">
          <PhonicsLearnTab key={progressScopeKey} progressScopeKey={progressScopeKey} />
        </section>
      )}

      {learnTab === "stories" && (
      <section className="learn-story-quest-library card">
        <div className="learn-story-quest-copy">
          <span className="story-quest-kicker">Read</span>
          <h2>Story Quests</h2>
          <p>Read bright guided stories, hear each page, and choose what happens next.</p>
        </div>

        <div className="learn-story-level-selector" aria-label="Story Quest level menu">
          {questGroups.map(level => (
            <button
              aria-pressed={selectedLevelKey === level.key}
              className={selectedLevelKey === level.key ? "learn-story-level-button active" : "learn-story-level-button"}
              key={level.key}
              onClick={() => jumpToLevel(level.key)}
              type="button"
            >
              <strong>Level {level.key}</strong>
              <span>{level.quests.length} quest{level.quests.length === 1 ? "" : "s"}</span>
            </button>
          ))}
        </div>

        <div className="learn-story-level-list">
          {questGroups.map(level => (
            <section className="learn-story-level-section" id={`story-quest-level-${level.key}`} key={level.key}>
              <div className="learn-story-level-header">
                <div>
                  <span className="story-quest-kicker">Level {level.key}</span>
                  <h3>{level.heading}</h3>
                  <p>{level.subheading}</p>
                </div>
                <span>{level.quests.length} quest{level.quests.length === 1 ? "" : "s"}</span>
              </div>

              <div className="learn-story-level-grid">
                {level.quests.map(quest => {
                  const progress = questProgress[quest.id] || {};
                  const isCompleted = Boolean(progress.completed);
                  const hasOpened = Boolean(progress.opened);
                  const actionLabel = isCompleted ? "Read Again" : hasOpened ? "Continue" : "Start Reading";
                  const levelLabel = quest.level && /^[A-Z]$/.test(quest.level)
                    ? `Level ${quest.level}`
                    : resolveStoryQuestLevel(quest) === "A"
                      ? "Level A"
                      : quest.level || quest.skillFocus;
                  const questDetails = [quest.series, (quest.characters || []).join(", ")]
                    .filter(Boolean)
                    .join(" - ");
                  const questTargetWords = quest.targetWords || [];

                  return (
                    <article
                      className={selectedQuestId === quest.id ? "learn-story-quest-card selected" : "learn-story-quest-card"}
                      key={quest.id}
                      onFocus={() => setSelectedQuestId(quest.id)}
                      onMouseEnter={() => setSelectedQuestId(quest.id)}
                    >
                      <img
                        alt={`${quest.title} cover`}
                        className="learn-story-quest-cover"
                        decoding="async"
                        loading="lazy"
                        src={quest.coverImageUrl || quest.pages?.[0]?.imageUrl}
                      />
                      <div className="learn-story-quest-card-copy">
                        <span className="story-quest-kicker">{quest.adventureType || "Story Reader"}</span>
                        <h3>{quest.title}</h3>
                        <p>{levelLabel}</p>
                        <span>{questDetails || quest.skillFocus}</span>
                        {hasOpened && (
                          <span className={isCompleted ? "story-quest-status completed" : "story-quest-status"}>
                            {isCompleted ? "Completed ✓" : "In progress"}
                          </span>
                        )}
                        <div className="learn-story-word-preview" aria-label={`${quest.title} target words`}>
                          {questTargetWords.slice(0, 9).map(word => (
                            <span key={word}>{word}</span>
                          ))}
                        </div>
                      </div>
                      <div className="learn-story-quest-actions">
                        <button className="lp-button lp-button-primary" onClick={() => startQuest(quest.id)} type="button">
                          {actionLabel}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
      )}
    </main>
  );
}
