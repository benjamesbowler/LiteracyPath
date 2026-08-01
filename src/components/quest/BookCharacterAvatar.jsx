import {
  bookCharacterAsset,
  bookCharacterForCreature,
  bookCharacterMood
} from "./bookCharacterAvatar.js";

export default function BookCharacterAvatar({
  creature,
  size = 92,
  pose,
  showLabel = false,
  className = "",
  decorative = false
}) {
  const character = bookCharacterForCreature(creature);
  const mood = bookCharacterMood(creature);
  const selectedPose = pose || creature?.pose || "idle";
  const asset = bookCharacterAsset(creature, { pose });

  return (
    <span
      className={`q-book-avatar is-pose-${selectedPose}${className ? ` ${className}` : ""}`}
      data-mood={mood}
      style={{ "--q-book-avatar-size": `${size}px` }}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : `${character.name}, from ${character.series}`}
    >
      <img className="q-book-avatar-character" src={asset} alt="" />
      {showLabel && (
        <span className="q-book-avatar-label">
          <strong>{character.name}</strong>
          <small>{character.series}</small>
        </span>
      )}
    </span>
  );
}
