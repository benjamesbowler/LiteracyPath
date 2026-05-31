import { useMemo, useState } from "react";
import { LearnAudioButton, LearnCardImage } from "./LearnCardMedia.jsx";

export function SortCardsGame({ slide }) {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [placements, setPlacements] = useState({});
  const [feedback, setFeedback] = useState("");
  const cards = slide.cards || [];
  const zones = slide.zones || [];
  const placedIds = useMemo(() => new Set(Object.keys(placements)), [placements]);
  const isComplete = useMemo(() =>
    cards.length > 0 && cards.every(card => placements[card.id] === card.zone),
  [cards, placements]);

  function placeSelectedCard(zoneId) {
    if (!selectedCardId) {
      setFeedback("Choose a card first.");
      return;
    }
    const card = cards.find(item => item.id === selectedCardId);
    const correct = card?.zone === zoneId;
    setPlacements(current => ({ ...current, [selectedCardId]: zoneId }));
    setFeedback(correct ? "Yes. That card belongs there." : "Try again after the reveal.");
    setSelectedCardId("");
  }

  function reset() {
    setSelectedCardId("");
    setPlacements({});
    setFeedback("");
  }

  return (
    <section className="learn-overlay-panel sort-cards-game" aria-label="Sort cards game">
      <div className="learn-overlay-header">
        <strong>{slide.prompt || "Sort the cards."}</strong>
        <div>
          <button className="lp-button lp-button-secondary" onClick={reset} type="button">Reset</button>
          <details className="learn-answer-reveal">
            <summary>Reveal Answers</summary>
            {cards.map(card => <p key={`answer-${card.id}`}>{card.label}: {zones.find(zone => zone.id === card.zone)?.label || card.zone}</p>)}
          </details>
        </div>
      </div>
      <div className="sort-zone-grid">
        {zones.map(zone => (
          <button className="sort-zone" key={zone.id} onClick={() => placeSelectedCard(zone.id)} type="button">
            <strong>{zone.label}</strong>
            <span>{cards.filter(card => placements[card.id] === zone.id).map(card => card.label).join(", ") || "Drop zone"}</span>
          </button>
        ))}
      </div>
      <div className="sort-card-bank">
        {cards.map(card => (
          <button
            aria-pressed={selectedCardId === card.id}
            className={[
              "sort-card",
              selectedCardId === card.id ? "selected" : "",
              placedIds.has(card.id) ? (placements[card.id] === card.zone ? "correct" : "needs-review") : ""
            ].filter(Boolean).join(" ")}
            key={card.id}
            onClick={() => {
              if (placedIds.has(card.id)) return;
              setSelectedCardId(card.id);
            }}
            type="button"
          >
            <LearnCardImage image={card.image} label={card.label} />
            <strong>{card.label}</strong>
            <LearnAudioButton audio={card.audio} />
          </button>
        ))}
      </div>
      {feedback && <p className="learn-game-feedback">{feedback}</p>}
      {isComplete && (
        <p className="learn-game-success" role="status">
          All sorted. Nice listening and matching.
        </p>
      )}
    </section>
  );
}
