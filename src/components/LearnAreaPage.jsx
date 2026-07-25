import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import { loadStoryQuestProgress, saveStoryQuestProgress } from "../utils/storyQuestProgress.js";
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
  const [activeQuestId, setActiveQuestId] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [selectedLevelKey, setSelectedLevelKey] = useState("A");
  const [questProgress, setQuestProgress] = useState(() => loadStoryQuestProgress(progressScopeKey));
  const activeQuest = storyQuests.find(quest => quest.id === activeQuestId) || null;
  const questGroups = STORY_QUEST_LEVELS.map(level => ({
    ...level,
    quests: storyQuests.filter(quest => resolveStoryQuestLevel(quest) === level.key)
  }));
  const questSummary = useMemo(() => {
    const completed = storyQuests.filter(quest => questProgress[quest.id]?.completed).length;
    const inProgress = storyQuests.filter(quest => {
      const progress = questProgress[quest.id] || {};
      return progress.opened && !progress.completed;
    }).length;
    const foundWords = new Set(
      storyQuests.flatMap(quest => questProgress[quest.id]?.wordsFound || [])
        .map(word => String(word).toLowerCase())
    );
    const targetWords = new Set(
      storyQuests.flatMap(quest => quest.targetWords || [])
        .map(word => String(word).toLowerCase())
    );

    return {
      completed,
      inProgress,
      foundWords: foundWords.size,
      targetWords: targetWords.size
    };
  }, [questProgress]);
  const continueQuests = useMemo(() => storyQuests
    .filter(quest => {
      const progress = questProgress[quest.id] || {};
      return progress.opened && !progress.completed;
    })
    .slice(0, 3), [questProgress]);
  const selectedLevelQuests = questGroups.find(level => level.key === selectedLevelKey)?.quests || [];
  const primaryQuest = continueQuests[0]
    || selectedLevelQuests.find(quest => !questProgress[quest.id]?.completed)
    || selectedLevelQuests[0]
    || storyQuests[0];
  const primaryQuestStarted = Boolean(primaryQuest && questProgress[primaryQuest.id]?.opened);
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
    saveStoryQuestProgress(progressScopeKey, questProgress);
  }, [progressScopeKey, questProgress]);

  const updateQuestProgress = useCallback((questId, patch) => {
    setQuestProgress(previous => ({
      ...previous,
      [questId]: {
        ...(previous[questId] || {}),
        ...patch,
        opened: true,
        updatedAt: new Date().toISOString()
      }
    }));
  }, []);

  const handleQuestComplete = useCallback((progressPatch = {}) => {
    if (!activeQuestId) return;
    updateQuestProgress(activeQuestId, {
      ...progressPatch,
      completed: true,
      completedAt: progressPatch.completedAt || new Date().toISOString()
    });
  }, [activeQuestId, updateQuestProgress]);

  const handleQuestExit = useCallback(() => setActiveQuestId(""), []);

  const handleQuestProgress = useCallback((pageId, progressPatch = {}) => {
    if (!activeQuestId) return;
    updateQuestProgress(activeQuestId, {
      ...progressPatch,
      lastPageId: pageId
    });
  }, [activeQuestId, updateQuestProgress]);

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
      <main className="learn-area-page story-quest-learn-page story-quest-active-page" aria-label="Story Quests">
        <StoryQuestPlayer
          initialPageId={activeQuestInitialPageId}
          onComplete={handleQuestComplete}
          onExit={handleQuestExit}
          onProgress={handleQuestProgress}
          quest={activeQuest}
        />
      </main>
    );
  }

  return (
    <main
      className="learn-area-page story-quest-learn-page page-stack"
      aria-label="Story Quests"
      data-child-surface="story-quests"
    >
      <section className="learn-story-quest-library card">
        <div className="story-quest-header-row">
          <div className="learn-story-quest-copy">
            <span className="story-quest-kicker">Read · Discover · Adventure</span>
            <h1 className="story-quest-title-logo" data-child-title="">
              <span className="child-surface-title-text">Story Quests</span>
              <img src="/images/comic/story-quests-logo.webp" alt="" />
            </h1>
            <p data-child-instruction="">Read a story. Choose what happens next.</p>
            <div className="story-quest-library-stats" aria-label="Story Quest progress" data-child-progress="">
              <span><strong>{questSummary.completed}</strong> complete</span>
              <span><strong>{questSummary.inProgress}</strong> in progress</span>
              <span><strong>{questSummary.foundWords} of {questSummary.targetWords}</strong> words found</span>
            </div>
            {primaryQuest && (
              <button
                className="story-quest-primary-action"
                type="button"
                onClick={() => startQuest(primaryQuest.id)}
                data-child-primary=""
                data-child-emphasis="primary"
                data-child-emphasis-cue=""
              >
                {primaryQuestStarted ? "Continue" : "Start"} {primaryQuest.title}
              </button>
            )}
          </div>

          <div className="learn-story-level-selector" aria-label="Story Quest level menu">
            {questGroups.map(level => {
              const completedCount = level.quests.filter(quest => questProgress[quest.id]?.completed).length;

              return (
                <button
                  aria-pressed={selectedLevelKey === level.key}
                  className={selectedLevelKey === level.key ? "learn-story-level-button active" : "learn-story-level-button"}
                  key={level.key}
                  onClick={() => jumpToLevel(level.key)}
                  type="button"
                >
                  <strong>Level {level.key}</strong>
                  <span>{completedCount} of {level.quests.length} complete</span>
                </button>
              );
            })}
          </div>
        </div>

        {continueQuests.length > 0 && (
          <div className="story-quest-continue-strip" aria-label="Continue Story Quests">
            <div>
              <span className="story-quest-kicker">Continue</span>
              <strong>Pick up your open quests</strong>
            </div>
            <div>
              {continueQuests.map(quest => (
                <button key={quest.id} onClick={() => startQuest(quest.id)} type="button">
                  {quest.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="story-quest-body" data-child-choices="">
        <div className="learn-story-level-list">
          {questGroups.map(level => (
            <section className="learn-story-level-section" id={`story-quest-level-${level.key}`} key={level.key}>
              <div className="learn-story-level-header">
                <div>
                  <h3>{level.heading}</h3>
                  <p>{level.subheading}</p>
                </div>
                <span>{level.quests.length} quest{level.quests.length === 1 ? "" : "s"}</span>
              </div>

              <div className="learn-story-level-grid">
                {level.quests.map(quest => {
                  return (
                    <article
                      className={selectedQuestId === quest.id ? "learn-story-quest-card selected" : "learn-story-quest-card"}
                      key={quest.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => startQuest(quest.id)}
                      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); startQuest(quest.id); } }}
                      onFocus={() => setSelectedQuestId(quest.id)}
                      onMouseEnter={() => setSelectedQuestId(quest.id)}
                    >
                      <img
                        alt={`${quest.title} cover`}
                        className="learn-story-quest-cover"
                        decoding="async"
                        loading="eager"
                        src={quest.coverImageUrl || quest.pages?.[0]?.imageUrl}
                      />
                      <div className="learn-story-quest-card-copy">
                        <h3>{quest.title}</h3>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        </div>
      </section>
    </main>
  );
}
