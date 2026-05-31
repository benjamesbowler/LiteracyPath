import { useEffect, useMemo, useRef, useState } from "react";
import { LearnAudioButton, LearnCardImage } from "./LearnCardMedia.jsx";

export function SoundSafariGame({ slide }) {
  const [foundIds, setFoundIds] = useState(() => new Set());
  const [missedIds, setMissedIds] = useState(() => new Set());
  const missedTimersRef = useRef(new Map());
  const cards = slide.cards || [];
  const isComplete = useMemo(() => {
    const correctCards = cards.filter(card => card.correct);
    return correctCards.length > 0 && correctCards.every(card => foundIds.has(card.id));
  }, [cards, foundIds]);

  useEffect(() => () => {
    missedTimersRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    missedTimersRef.current.clear();
  }, []);

  function chooseCard(card) {
    if (card.correct) {
      setFoundIds(current => new Set(current).add(card.id));
      setMissedIds(current => {
        const next = new Set(current);
        next.delete(card.id);
        return next;
      });
      return;
    }
    setMissedIds(current => new Set(current).add(card.id));
    if (missedTimersRef.current.has(card.id)) {
      window.clearTimeout(missedTimersRef.current.get(card.id));
    }
    const timeoutId = window.setTimeout(() => {
      setMissedIds(current => {
        const next = new Set(current);
        next.delete(card.id);
        return next;
      });
      missedTimersRef.current.delete(card.id);
    }, 700);
    missedTimersRef.current.set(card.id, timeoutId);
  }

  function reset() {
    missedTimersRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    missedTimersRef.current.clear();
    setFoundIds(new Set());
    setMissedIds(new Set());
  }

  return (
    <section className="learn-overlay-panel sound-safari-game" aria-label="Sound Safari game">
      <div className="learn-overlay-header">
        <div>
          <strong>{slide.prompt || "Find the target sound."}</strong>
          {slide.targetSound && <span>Target: {slide.targetSound}</span>}
        </div>
        <button className="lp-button lp-button-secondary" onClick={reset} type="button">Reset</button>
      </div>
      <div className="sound-safari-grid">
        {cards.map(card => (
          <button
            aria-pressed={foundIds.has(card.id)}
            className={[
              "sound-safari-card",
              foundIds.has(card.id) ? "found" : "",
              missedIds.has(card.id) ? "gentle-shake" : ""
            ].filter(Boolean).join(" ")}
            key={card.id}
            onClick={() => chooseCard(card)}
            type="button"
          >
            <LearnCardImage image={card.image} label={card.label} />
            <strong>{card.label}</strong>
            <LearnAudioButton audio={card.audio} />
          </button>
        ))}
      </div>
      {isComplete && (
        <p className="learn-game-success" role="status">
          You found every target sound.
        </p>
      )}
    </section>
  );
}
