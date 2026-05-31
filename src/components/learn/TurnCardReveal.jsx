import { useState } from "react";
import { LearnAudioButton, LearnCardImage } from "./LearnCardMedia.jsx";

export function TurnCardReveal({ slide }) {
  const [revealed, setRevealed] = useState(() => new Set());
  const cards = slide.cards || [];

  function toggleCard(cardId) {
    setRevealed(current => {
      const next = new Set(current);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  return (
    <section className="learn-overlay-panel turn-card-reveal" aria-label="Turn card reveal">
      <div className="learn-overlay-header">
        <strong>{slide.prompt || "Click a card to reveal it."}</strong>
        <button className="lp-button lp-button-secondary" onClick={() => setRevealed(new Set())} type="button">Reset</button>
      </div>
      <div className="turn-card-grid">
        {cards.map(card => {
          const isRevealed = revealed.has(card.id);
          return (
            <button
              aria-pressed={isRevealed}
              className={isRevealed ? "turn-card revealed" : "turn-card"}
              key={card.id}
              onClick={() => toggleCard(card.id)}
              type="button"
            >
              <span>{isRevealed ? card.back : card.front}</span>
              {isRevealed && <LearnCardImage image={card.image} label={card.back} />}
              {isRevealed && <LearnAudioButton audio={card.audio} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
