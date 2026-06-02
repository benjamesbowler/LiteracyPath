import { useEffect, useLayoutEffect, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import { StoryQuestPlayer } from "./StoryQuestPlayer.jsx";
import { preloadQuestionMedia, preloadQuestionMediaBatch } from "../utils/preloadQuestionMedia.js";

export function LearnAreaPage() {
  const [activeQuestId, setActiveQuestId] = useState("");
  const activeQuest = storyQuests.find(quest => quest.id === activeQuestId) || null;

  useEffect(() => {
    storyQuests.forEach(quest => {
      void preloadQuestionMedia({
        imageUrl: quest.coverImageUrl || quest.pages?.[0]?.imageUrl,
        audioUrl: quest.pages?.[0]?.audioUrl,
      });
      void preloadQuestionMediaBatch((quest.pages || []).slice(0, 2));
    });
  }, []);

  useLayoutEffect(() => {
    if (!activeQuestId || typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeQuestId]);

  function startQuest(questId) {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    setActiveQuestId(questId);
  }

  if (activeQuest) {
    return (
      <main className="learn-area-page story-quest-learn-page" aria-label="Learn area">
        <StoryQuestPlayer quest={activeQuest} onExit={() => setActiveQuestId("")} />
      </main>
    );
  }

  return (
    <main className="learn-area-page story-quest-learn-page page-stack" aria-label="Learn area">
      <section className="learn-story-quest-library card">
        <div className="learn-story-quest-copy">
          <span className="story-quest-kicker">Read</span>
          <h2>Story Quest Adventures</h2>
          <p>Read bright guided stories, hear each page, and choose what happens next.</p>
        </div>
        <div className="learn-story-quest-list">
          {storyQuests.map(quest => (
            <article className="learn-story-quest-card" key={quest.id}>
              <img
                alt={`${quest.title} cover`}
                className="learn-story-quest-cover"
                src={quest.coverImageUrl || quest.pages?.[0]?.imageUrl}
              />
              <div className="learn-story-quest-card-copy">
                <span className="story-quest-kicker">{quest.adventureType || "Story Reader"}</span>
                <h3>{quest.title}</h3>
                <p>{quest.level === "A" ? "Level A" : quest.level || quest.skillFocus}</p>
                <span>{(quest.characters || []).join(", ") || quest.skillFocus}</span>
                <div className="learn-story-word-preview" aria-label="Target words">
                  {(quest.targetWords || []).slice(0, 9).map(word => (
                    <span key={word}>{word}</span>
                  ))}
                </div>
              </div>
              <button className="lp-button lp-button-primary" onClick={() => startQuest(quest.id)} type="button">
                Start Reading
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="learn-story-quest-library card">
        <div className="learn-story-quest-copy">
          <span className="story-quest-kicker">Practice</span>
          <h2>Words in the Story</h2>
          <p>Tap into the story first, then come back to use these picture words for quick practice.</p>
        </div>
        <div className="learn-story-word-card-grid">
          {storyQuests[0]?.wordCards?.map(card => (
            <article className="learn-story-word-card" key={card.word}>
              <img alt={card.word} src={card.imageUrl} />
              <strong>{card.word}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
