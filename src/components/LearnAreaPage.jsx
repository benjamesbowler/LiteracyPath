import { useEffect, useLayoutEffect, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import { loadStoryQuestProgress, saveStoryQuestProgress } from "../utils/storyQuestProgress.js";
import { StoryQuestPlayer } from "./StoryQuestPlayer.jsx";

export function LearnAreaPage({ progressScopeKey = "default" }) {
  const [activeQuestId, setActiveQuestId] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [expandedWordsQuestId, setExpandedWordsQuestId] = useState("");
  const [questProgress, setQuestProgress] = useState(() => loadStoryQuestProgress(progressScopeKey));
  const [questProgressScope, setQuestProgressScope] = useState(progressScopeKey);
  const activeQuest = storyQuests.find(quest => quest.id === activeQuestId) || null;
  const selectedQuest = storyQuests.find(quest => quest.id === selectedQuestId) || null;
  const expandedWordsQuest = storyQuests.find(quest => quest.id === expandedWordsQuestId) || null;
  const expandedWordCards = expandedWordsQuest?.wordCards || [];
  const expandedTargetWords = expandedWordsQuest?.targetWords || [];
  const wordPreviewPanelId = "story-quest-word-preview-panel";
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

  function toggleQuestWords(questId) {
    setSelectedQuestId(questId);
    setExpandedWordsQuestId(previousQuestId => (previousQuestId === questId ? "" : questId));
  }

  if (activeQuest) {
    return (
      <main className="learn-area-page story-quest-learn-page" aria-label="Story Quest Adventures">
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
    <main className="learn-area-page story-quest-learn-page page-stack" aria-label="Story Quest Adventures">
      <section className="learn-story-quest-library card">
        <div className="learn-story-quest-copy">
          <span className="story-quest-kicker">Read</span>
          <h2>Story Quest Adventures</h2>
          <p>Read bright guided stories, hear each page, and choose what happens next.</p>
        </div>
        <div className="learn-story-quest-list">
          {storyQuests.map(quest => {
            const progress = questProgress[quest.id] || {};
            const isCompleted = Boolean(progress.completed);
            const hasOpened = Boolean(progress.opened);
            const actionLabel = isCompleted ? "Read Again" : hasOpened ? "Continue" : "Start Reading";
            const levelLabel = quest.level && /^[A-Z]$/.test(quest.level)
              ? `Level ${quest.level}`
              : quest.level || quest.skillFocus;
            const questDetails = [quest.series, (quest.characters || []).join(", ")]
              .filter(Boolean)
              .join(" - ");
            const wordsVisible = expandedWordsQuestId === quest.id;

            return (
              <article
                className={
                  selectedQuestId === quest.id || wordsVisible
                    ? "learn-story-quest-card selected"
                    : "learn-story-quest-card"
                }
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
                  <div className="learn-story-word-preview" aria-label="Target words">
                    {(quest.targetWords || []).slice(0, 9).map(word => (
                      <span key={word}>{word}</span>
                    ))}
                  </div>
                </div>
                <div className="learn-story-quest-actions">
                  <button
                    aria-controls={wordPreviewPanelId}
                    aria-expanded={wordsVisible}
                    className="lp-button lp-button-secondary"
                    onClick={() => toggleQuestWords(quest.id)}
                    type="button"
                  >
                    {wordsVisible ? "Hide Words" : "Show Words"}
                  </button>
                  <button className="lp-button lp-button-primary" onClick={() => startQuest(quest.id)} type="button">
                    {actionLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="learn-story-quest-library card">
        <div className="learn-story-quest-copy">
          <span className="story-quest-kicker">Practice</span>
          <h2>Words in the Story</h2>
          <p>
            {expandedWordsQuest
              ? `Picture words for ${expandedWordsQuest.title}.`
              : selectedQuest
                ? `Use Show Words to preview ${selectedQuest.title}.`
                : "Use Show Words on a Story Quest to preview its picture words."}
          </p>
        </div>
        <div id={wordPreviewPanelId}>
          {expandedWordCards.length > 0 && (
            <div className="learn-story-word-card-grid">
              {expandedWordCards.map(card => (
                <article className="learn-story-word-card" key={card.word}>
                  <img alt={card.word} decoding="async" loading="lazy" src={card.imageUrl} />
                  <strong>{card.word}</strong>
                </article>
              ))}
            </div>
          )}
          {expandedWordsQuest && !expandedWordCards.length && expandedTargetWords.length > 0 && (
            <div className="learn-story-word-preview" aria-label={`${expandedWordsQuest.title} target words`}>
              {expandedTargetWords.map(word => (
                <span key={word}>{word}</span>
              ))}
            </div>
          )}
          {expandedWordsQuest && !expandedWordCards.length && !expandedTargetWords.length && (
            <p className="learn-story-empty-words">No word preview available.</p>
          )}
        </div>
        {!expandedWordsQuest && (
          <p className="learn-story-empty-words">No word preview selected.</p>
        )}
      </section>
    </main>
  );
}
