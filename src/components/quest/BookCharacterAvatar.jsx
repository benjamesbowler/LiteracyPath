import { bookCharacterForCreature } from "./bookCharacterAvatar.js";

function expressionForCreature(creature = {}) {
  if (creature.eyes === "eyes-wide" || creature.mouth === "mouth-grin") return "excited";
  if (creature.eyes === "eyes-sleepy" || creature.mouth === "mouth-round") return "thinking";
  if (creature.eyes === "eyes-fierce") return "brave";
  return "happy";
}

export default function BookCharacterAvatar({
  creature,
  size = 92,
  pose,
  showLabel = false,
  className = "",
  decorative = false
}) {
  const character = bookCharacterForCreature(creature);
  const mood = expressionForCreature(creature);
  const selectedPose = pose || creature?.pose || "idle";
  const dye = creature?.dye === character.originalDye ? "original" : creature?.dye || "original";

  return (
    <span
      className={`q-book-avatar is-pose-${selectedPose}${className ? ` ${className}` : ""}`}
      data-dye={dye}
      data-mood={mood}
      style={{ "--q-book-avatar-size": `${size}px` }}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : `${character.name}, from ${character.series}`}
    >
      <img src={character.asset} alt="" />
      {showLabel && (
        <span className="q-book-avatar-label">
          <strong>{character.name}</strong>
          <small>{character.series}</small>
        </span>
      )}
    </span>
  );
}
