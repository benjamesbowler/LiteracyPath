export function LetterTile({
  letter,
  onClick,
  selected = false,
  disabled = false,
  draggable = false,
  onDragStart,
  className = ""
}) {
  return (
    <button
      type="button"
      className={`lg-letter-tile ${selected ? "selected" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      draggable={draggable && !disabled}
      onDragStart={onDragStart}
    >
      {letter}
    </button>
  );
}

export default LetterTile;
