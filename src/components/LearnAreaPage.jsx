import { useCallback, useEffect, useMemo, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import {
  isStoryQuestTeacherPreviewScope,
  loadStoryQuestProgress,
  mergeStoryQuestProgressRow,
  saveStoryQuestProgress
} from "../utils/storyQuestProgress.js";
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

/**
 * @param launchQuestId  phase D (2026-07-29): the child's Story Quests screen
 *   is the front door now, so this page can be mounted with the story already
 *   chosen. Read at mount — never through an effect — and the quest is marked
 *   opened exactly as startQuest() marks it.
 * @param onExitLibrary  where leaving the player goes. Absent (teacher preview,
 *   the standalone harness) it falls back to this page's own shelf.
 */
export function LearnAreaPage({
  progressScopeKey = "default",
  launchQuestId = "",
  onExitLibrary = null
}) {
  const teacherPreview = isStoryQuestTeacherPreviewScope(progressScopeKey);
  const [activeQuestId, setActiveQuestId] = useState(launchQuestId);
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [selectedLevelKey, setSelectedLevelKey] = useState("A");
  const [storyPage, setStoryPage] = useState(0);
  const [questProgress, setQuestProgress] = useState(() => {
    const saved = teacherPreview ? {} : loadStoryQuestProgress(progressScopeKey);
    if (!launchQuestId) return saved;
    return {
      ...saved,
      [launchQuestId]: mergeStoryQuestProgressRow(saved[launchQuestId], {})
    };
  });
  const activeQuest = storyQuests.find(quest => quest.id === activeQuestId) || null;
  const questGroups = STORY_QUEST_LEVELS.map(level => ({
    ...level,
    quests: storyQuests.filter(quest => resolveStoryQuestLevel(quest) === level.key)
  }));
  const continueQuests = useMemo(() => storyQuests
    .filter(quest => {
      const progress = questProgress[quest.id] || {};
      return progress.opened && !progress.completed;
    })
    .slice(0, 3), [questProgress]);
  const selectedLevelQuests = questGroups.find(level => level.key === selectedLevelKey)?.quests || [];
  const selectedLevel = questGroups.find(level => level.key === selectedLevelKey) || questGroups[0];
  const storyPageSize = 6;
  const storyPageCount = Math.max(1, Math.ceil(selectedLevelQuests.length / storyPageSize));
  const safeStoryPage = Math.min(storyPage, storyPageCount - 1);
  const visibleLevelQuests = selectedLevelQuests.slice(
    safeStoryPage * storyPageSize,
    (safeStoryPage + 1) * storyPageSize
  );
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
  const activeQuestInitialProgress =
    activeQuest && !activeQuestProgress.completed
      ? activeQuestProgress
      : {};

  useEffect(() => {
    if (teacherPreview) return;
    saveStoryQuestProgress(progressScopeKey, questProgress);
  }, [progressScopeKey, questProgress, teacherPreview]);

  const updateQuestProgress = useCallback((questId, patch) => {
    setQuestProgress(previous => ({
      ...previous,
      [questId]: mergeStoryQuestProgressRow(previous[questId], patch)
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

  const handleQuestExit = useCallback(() => {
    setActiveQuestId("");
    onExitLibrary?.();
  }, [onExitLibrary]);

  const handleQuestProgress = useCallback((pageId, progressPatch = {}) => {
    if (!activeQuestId) return;
    updateQuestProgress(activeQuestId, {
      ...progressPatch,
      lastPageId: pageId
    });
  }, [activeQuestId, updateQuestProgress]);

  function startQuest(questId) {
    setSelectedQuestId(questId);
    updateQuestProgress(questId, {});
    setActiveQuestId(questId);
  }

  function jumpToLevel(levelKey) {
    setSelectedLevelKey(levelKey);
    setStoryPage(0);
  }

  if (activeQuest) {
    return (
      <main className="learn-area-page story-quest-learn-page story-quest-active-page" aria-label="Story Quests">
        <StoryQuestPlayer
          key={activeQuest.id}
          initialPageId={activeQuestInitialPageId}
          initialProgress={activeQuestInitialProgress}
          onComplete={handleQuestComplete}
          onExit={handleQuestExit}
          onProgress={handleQuestProgress}
          previewMode={teacherPreview}
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
        {teacherPreview && (
          <aside className="story-quest-preview-notice" role="note">
            <strong>Teacher preview</strong>
            <span>
              This is a clean practice preview. Your choices reset when you return to teacher
              tools and never change the student's saved progress.
            </span>
          </aside>
        )}
        <div className="story-quest-header-row">
          <div className="learn-story-quest-copy">
            <span className="story-quest-kicker">Read · Discover · Adventure</span>
            <h1 className="story-quest-title-logo" data-child-title="">
              <span className="child-surface-title-text">Story Quests</span>
              <img src="/images/comic/story-quests-logo.webp" alt="" />
            </h1>
            <p data-child-instruction="">Read a story. Choose what happens next.</p>
            {/* THE THREE COUNTERS ARE GONE (phase D, 2026-07-29). This header
                used to lead with a completed tally, an in-progress tally and a
                running total of the target words a child had met. The child UI
                caps its numeric systems at two — stars and coins — and those
                were three more. The child's real shelf is
                src/components/StudentStoryQuestsPage.jsx, where the same state
                is a per-story badge (Carry on / New / Done / Next world)
                instead of a score. */}
            {primaryQuest && (
              <button
                className="story-quest-primary-action"
                type="button"
                onClick={() => startQuest(primaryQuest.id)}
                data-child-primary=""
                data-child-emphasis="primary"
                data-child-emphasis-cue=""
              >
                {teacherPreview && !primaryQuestStarted
                  ? `Preview ${primaryQuest.title}`
                  : `${primaryQuestStarted ? "Continue" : "Start"} ${primaryQuest.title}`}
              </button>
            )}
          </div>

          {/* The per-level "N of M complete" line went the same way as the
              three header counters: it is a fourth numeric system, and the
              level buttons work as jump links without one. */}
          <div
            className="learn-story-level-selector"
            aria-label="Story Quest level menu"
            data-child-progress=""
          >
            {questGroups.map(level => (
              <button
                aria-pressed={selectedLevelKey === level.key}
                className={selectedLevelKey === level.key ? "learn-story-level-button active" : "learn-story-level-button"}
                key={level.key}
                onClick={() => jumpToLevel(level.key)}
                type="button"
              >
                <strong>Level {level.key}</strong>
                <span>{level.subheading}</span>
              </button>
            ))}
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
            <section className="learn-story-level-section" id={`story-quest-level-${selectedLevel.key}`} key={selectedLevel.key}>
              <div className="learn-story-level-header">
                <div>
                  <h2>{selectedLevel.heading}</h2>
                  <p>{selectedLevel.subheading}</p>
                </div>
                <span>{selectedLevel.quests.length} quest{selectedLevel.quests.length === 1 ? "" : "s"}</span>
              </div>

              <div className="learn-story-level-grid">
                {visibleLevelQuests.map(quest => {
                  const progress = questProgress[quest.id] || {};
                  const status = progress.completed
                    ? "Completed"
                    : progress.opened
                      ? "In progress"
                      : "Not started";
                  const statusClass = progress.completed
                    ? "completed"
                    : progress.opened
                      ? "in-progress"
                      : "not-started";
                  return (
                    <button
                      aria-label={`${teacherPreview ? "Preview" : status} ${quest.title}`}
                      className={selectedQuestId === quest.id ? "learn-story-quest-card selected" : "learn-story-quest-card"}
                      key={quest.id}
                      onClick={() => startQuest(quest.id)}
                      onFocus={() => setSelectedQuestId(quest.id)}
                      onMouseEnter={() => setSelectedQuestId(quest.id)}
                      type="button"
                    >
                      <img
                        alt={`${quest.title} cover`}
                        className="learn-story-quest-cover"
                        decoding="async"
                        loading="lazy"
                        src={quest.coverImageUrl || quest.pages?.[0]?.imageUrl}
                      />
                      <div className="learn-story-quest-card-copy">
                        <h3>{quest.title}</h3>
                        <span className={`story-quest-status ${statusClass}`}>
                          {teacherPreview && status === "Not started" ? "Ready to preview" : status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {storyPageCount > 1 && (
                <nav className="story-quest-pages" aria-label={`Level ${selectedLevel.key} pages`}>
                  <button type="button" disabled={safeStoryPage === 0} onClick={() => setStoryPage(page => Math.max(0, page - 1))}>← Previous</button>
                  <span>{safeStoryPage + 1} of {storyPageCount}</span>
                  <button type="button" disabled={safeStoryPage === storyPageCount - 1} onClick={() => setStoryPage(page => Math.min(storyPageCount - 1, page + 1))}>Next →</button>
                </nav>
              )}
            </section>
        </div>
        </div>
      </section>
    </main>
  );
}
