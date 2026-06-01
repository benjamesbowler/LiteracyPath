import { useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import { StoryQuestPlayer } from "./StoryQuestPlayer.jsx";

export function LearnAreaPage() {
  const [activeQuestId, setActiveQuestId] = useState("");
  const activeQuest = storyQuests.find(quest => quest.id === activeQuestId) || null;

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
          <span className="story-quest-kicker">Pilot Activity</span>
          <h2>Story Quests</h2>
          <p>Choose a decodable adventure and read each page by making simple choices.</p>
        </div>
        <div className="learn-story-quest-list">
          {storyQuests.map(quest => (
            <article className="learn-story-quest-card" key={quest.id}>
              <div>
                <h3>{quest.title}</h3>
                <p>{quest.skillFocus}</p>
                <span>{quest.cycleFocus}</span>
              </div>
              <button className="lp-button lp-button-primary" onClick={() => setActiveQuestId(quest.id)} type="button">
                Start Quest
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
