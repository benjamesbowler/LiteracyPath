import { memo } from "react";
import ActivityButton from "../../../ActivityButton.jsx";
import { WordImage } from "./WordImage";

const WordTile = memo(function WordTile({
  word,
  image,
  onClick,
  state = "default",
  disabled = false
}) {
  const isRevealed = state === "correct" || state === "incorrect";

  function handleClick() {
    if (disabled || state !== "default") return;
    onClick?.();
  }

  return (
    <ActivityButton
      onClick={handleClick}
      disabled={disabled}
      className={`phonics-word-tile wa-choice ${state}`}
      aria-label={`Word tile: ${word}`}
      type="button"
    >
      <span className="phonics-word-tile-inner">
        <span className="phonics-word-tile-face phonics-word-tile-front">
          <span className="phonics-word-image-wrap">
            <WordImage src={image} word={word} priority />
          </span>
          <span className="phonics-word-label">{word}</span>
        </span>
        {isRevealed && <span className={`phonics-tile-result ${state}`} aria-hidden="true">{state === "correct" ? "✓" : "↻"}</span>}
      </span>
    </ActivityButton>
  );
});

export default WordTile;
