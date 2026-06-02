import { useLayoutEffect, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import { StoryQuestPlayer } from "./StoryQuestPlayer.jsx";

export function LearnAreaPage() {
  const [activeQuestId, setActiveQuestId] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const activeQuest = storyQuests.find(quest => quest.id === activeQuestId) || null;
  const selectedQuest = storyQuests.find(quest => quest.id === selectedQuestId) || null;
  const selectedWordCards = selectedQuest?.wordCards || [];

  useLayoutEffect(() => {
    if (!activeQuestId || typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeQuestId]);

  function startQuest(questId) {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    setSelectedQuestId(questId);
    setActiveQuestId(questId);
  }

  if (activeQuest) {
    return (
      <main className="learn-area-page story-quest-learn-page" aria-label="Story Quest Adventures">
        <StoryQuestPlayer quest={activeQuest} onExit={() => setActiveQuestId("")} />
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
            const levelLabel = quest.level && /^[A-Z]$/.test(quest.level)
              ? `Level ${quest.level}`
              : quest.level || quest.skillFocus;
            const questDetails = [quest.series, (quest.characters || []).join(", ")]
              .filter(Boolean)
              .join(" - ");

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
                  <div className="learn-story-word-preview" aria-label="Target words">
                    {(quest.targetWords || []).slice(0, 9).map(word => (
                      <span key={word}>{word}</span>
                    ))}
                  </div>
                </div>
                <div className="learn-story-quest-actions">
                  <button className="lp-button lp-button-secondary" onClick={() => setSelectedQuestId(quest.id)} type="button">
                    Show Words
                  </button>
                  <button className="lp-button lp-button-primary" onClick={() => startQuest(quest.id)} type="button">
                    Start Reading
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
          <p>{selectedQuest ? `Picture words for ${selectedQuest.title}.` : "Choose a Story Quest to preview its picture words."}</p>
        </div>
        <div className="learn-story-word-card-grid">
          {selectedWordCards.map(card => (
            <article className="learn-story-word-card" key={card.word}>
              <img alt={card.word} decoding="async" loading="lazy" src={card.imageUrl} />
              <strong>{card.word}</strong>
            </article>
          ))}
        </div>
        {!selectedWordCards.length && (
          <p className="learn-story-empty-words">No story words selected yet.</p>
        )}
      </section>
    </main>
  );
}
