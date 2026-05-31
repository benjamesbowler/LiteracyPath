import { SortCardsGame } from "./learn/SortCardsGame.jsx";
import { SoundSafariGame } from "./learn/SoundSafariGame.jsx";
import { TurnCardReveal } from "./learn/TurnCardReveal.jsx";
import { WordWallGame } from "./learn/WordWallGame.jsx";

export function LearnDeckInteractionLayer({ slide }) {
  if (!slide || slide.type === "image") return null;

  if (slide.type === "turn-card-reveal") {
    return <TurnCardReveal slide={slide} />;
  }

  if (slide.type === "sort-cards") {
    return <SortCardsGame slide={slide} />;
  }

  if (slide.type === "word-wall") {
    return <WordWallGame slide={slide} />;
  }

  if (slide.type === "sound-safari") {
    return <SoundSafariGame slide={slide} />;
  }

  return (
    <section className="learn-overlay-panel">
      <strong>Unsupported interaction</strong>
      <p>This slide type is not wired yet.</p>
    </section>
  );
}
