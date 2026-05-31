import { useState } from "react";
import { LearnAudioButton, LearnCardImage } from "./LearnCardMedia.jsx";

export function WordWallGame({ slide }) {
  const [highlightedWordId, setHighlightedWordId] = useState("");
  const groups = slide.groups || [];

  return (
    <section className="learn-overlay-panel word-wall-game" aria-label="Word wall game">
      <div className="learn-overlay-header">
        <strong>{slide.prompt || "Read the word wall."}</strong>
        <button className="lp-button lp-button-secondary" onClick={() => setHighlightedWordId("")} type="button">Reset</button>
      </div>
      <div className="word-wall-group-grid">
        {groups.map(group => (
          <article className="word-wall-group" key={group.id}>
            <strong>{group.label}</strong>
            <div className="word-wall-word-grid">
              {(group.words || []).map(word => (
                <button
                  aria-pressed={highlightedWordId === word.id}
                  className={highlightedWordId === word.id ? "word-wall-word active" : "word-wall-word"}
                  key={word.id}
                  onClick={() => setHighlightedWordId(word.id)}
                  type="button"
                >
                  <LearnCardImage image={word.image} label={word.label} />
                  <span>{word.label}</span>
                  <LearnAudioButton audio={word.audio} />
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
