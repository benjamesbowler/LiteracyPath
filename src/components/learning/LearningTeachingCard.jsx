import { useEffect, useState } from "react";
import "../../styles/learning-response.css";
import { learningModelPart } from "../../utils/learningResponseAdapters.js";

export function LearningTeachingCard({ episode, explanation, image, word, passage, onGuided, onGuidedStep, onReplay, onLeave, disabled = false }) {
  const values = Array.isArray(episode.expected) ? episode.expected : [episode.expected];
  const parts = values.map(value => learningModelPart(value, episode.question));
  const [matched, setMatched] = useState(() => {
    if (Number.isInteger(episode.guidedCursor)) return episode.guidedCursor;
    if (episode.question.mechanicId !== "wordBuild" || !Array.isArray(episode.responses.at(-1)?.selected)) return 0;
    const built = episode.responses.at(-1).selected;
    const firstDifference = values.findIndex((value, index) => String(value) !== String(built[index]));
    return firstDifference < 0 ? 0 : firstDifference;
  });
  useEffect(() => { onReplay?.();
    // The parent keys this card by presentation phase. Replay once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const place = index => {
    if (disabled || index !== matched) return;
    if (onGuidedStep?.(index) === false) return;
    setMatched(index + 1);
    if (index + 1 === parts.length) onGuided(episode.expected);
  };
  return <section className="learning-teaching-card" data-learning-phase={episode.phase} data-learning-episode={episode.id} aria-labelledby="learning-teaching-title">
    <p className="learning-teaching-kicker">{episode.phase === "finish_teaching" ? "Let's practise together" : "Learn together"}</p>
    <h2 id="learning-teaching-title">Look, listen, then match</h2>
    {image && <img className="learning-teaching-picture" src={image} alt={word || "The question picture"} />}
    {passage && <p className="learning-teaching-passage">{passage}</p>}
    <p className="learning-teaching-explanation">{explanation}</p>
    <div className="learning-teaching-example">
      <div className="learning-teaching-model" aria-label="Worked example">{parts.map((part, index) => <span key={index}>{part.image && <img src={part.image} alt="" />}{part.label}</span>)}</div>
      {onReplay && <button className="learning-teaching-replay" type="button" onClick={onReplay} disabled={disabled}>Hear it again</button>}
    </div>
    <p className="learning-teaching-instruction">Match this example.</p>
    <div className="learning-guided-parts">{parts.map((part, index) => <button key={index} className="learning-guided-action" type="button" data-guided-model="" disabled={disabled || index !== matched} onClick={() => place(index)}
      aria-label={`Match ${part.label}`} aria-pressed={index < matched}>{part.image && <img src={part.image} alt="" />}<span>{part.label}</span>{index < matched && <span aria-hidden="true">✓</span>}</button>)}</div>
    {onLeave && <button className="learning-teaching-leave" type="button" onClick={onLeave}>Try something else</button>}
  </section>;
}
