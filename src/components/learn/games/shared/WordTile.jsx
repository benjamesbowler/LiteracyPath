export function WordTile({
  word,
  onClick,
  selected = false,
  matched = false,
  disabled = false,
  className = ""
}) {
  return (
    <button
      type="button"
      className={`lg-word-tile ${selected ? "selected" : ""} ${matched ? "matched" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled || matched}
    >
      {word}
    </button>
  );
}

export default WordTile;
