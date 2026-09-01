import { memo } from "react";
import { motion } from "framer-motion";
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
    <motion.button
      whileHover={!disabled && !isRevealed ? { scale: 1.05 } : {}}
      whileTap={!disabled && !isRevealed ? { scale: 0.95 } : {}}
      onClick={handleClick}
      disabled={disabled}
      className="phonics-word-tile"
      aria-label={`Word tile: ${word}`}
      type="button"
    >
      <motion.span
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="phonics-word-tile-inner"
      >
        <span className="phonics-word-tile-face phonics-word-tile-front">
          <span className="phonics-word-image-wrap">
            <WordImage src={image} word={word} priority />
          </span>
          <span className="phonics-word-label">{word}</span>
        </span>

        <span className={`phonics-word-tile-face phonics-word-tile-back ${state}`}>
          <span className="phonics-tile-result" aria-hidden="true">
            {state === "correct" ? "✓" : "×"}
          </span>
        </span>
      </motion.span>
    </motion.button>
  );
});

export default WordTile;
