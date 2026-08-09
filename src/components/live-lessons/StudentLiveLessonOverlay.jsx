import { useMemo, useState } from "react";
import "../../styles/live-lessons.css";

function ChoicePrompt({ prompt, disabled, onSubmit }) {
  return (
    <div className="ll-choice-grid" data-child-choices>
      {prompt.choices.map(choice => (
        <button key={choice} type="button" disabled={disabled} onClick={() => onSubmit(choice)}>
          {choice}
        </button>
      ))}
    </div>
  );
}

function TilePrompt({ prompt, disabled, onSubmit }) {
  const [remaining, setRemaining] = useState(() => prompt.tiles.map((value, index) => ({ value, index })));
  const [answer, setAnswer] = useState([]);
  function choose(tile) {
    setRemaining(items => items.filter(item => item.index !== tile.index));
    setAnswer(items => [...items, tile]);
  }
  function undo(tile) {
    setAnswer(items => items.filter(item => item.index !== tile.index));
    setRemaining(items => [...items, tile].sort((a, b) => a.index - b.index));
  }
  return (
    <div className="ll-tile-task" data-child-choices>
      <div className="ll-answer-line" aria-label="Your word">
        {answer.length ? answer.map(tile => (
          <button key={tile.index} type="button" disabled={disabled} onClick={() => undo(tile)}>{tile.value}</button>
        )) : <span>Build the word here</span>}
      </div>
      <div className="ll-tile-bank" aria-label="Letter tiles">
        {remaining.map(tile => (
          <button key={tile.index} type="button" disabled={disabled} onClick={() => choose(tile)}>{tile.value}</button>
        ))}
      </div>
      <button
        className="ll-send-button"
        type="button"
        disabled={disabled || remaining.length > 0}
        onClick={() => onSubmit(answer.map(tile => tile.value))}
      >
        Send my word
      </button>
    </div>
  );
}

export function StudentLiveLessonOverlay({ follower }) {
  const prompt = follower.session?.prompt || null;
  const submitted = Boolean(prompt && follower.submittedPromptId === prompt.id);
  const title = useMemo(() => submitted ? "Answer sent" : prompt ? "Your turn" : "Look at the class screen", [prompt, submitted]);
  return (
    <main className="ll-student-surface" aria-live="polite">
      <header data-child-title>
        <span className="ll-live-pill">Class Quest Live</span>
        <h1>{title}</h1>
      </header>
      <section className="ll-instruction" data-child-instruction>
        <p>{submitted ? "Great — keep your answer private and look back at your teacher." : prompt?.instruction || "Your teacher will send a question when it is time."}</p>
      </section>
      <section className="ll-response-region" data-child-primary>
        {follower.error ? (
          <button className="ll-retry" type="button" onClick={follower.retry}>{follower.error}</button>
        ) : prompt && !submitted && prompt.choices ? (
          <ChoicePrompt prompt={prompt} disabled={follower.submitting} onSubmit={follower.submit} />
        ) : prompt && !submitted && prompt.tiles ? (
          <TilePrompt key={prompt.id} prompt={prompt} disabled={follower.submitting} onSubmit={follower.submit} />
        ) : (
          <div className="ll-empty-choices" data-child-choices>
            <div className="ll-wait-mark" aria-hidden="true" />
          </div>
        )}
      </section>
      <div className="ll-progress" data-child-progress>
        <span>{follower.connection === "reconnecting" ? "Reconnecting…" : `Slide ${(follower.session?.current_slide_index ?? 0) + 1} of ${follower.session?.slide_count || 1}`}</span>
      </div>
    </main>
  );
}
