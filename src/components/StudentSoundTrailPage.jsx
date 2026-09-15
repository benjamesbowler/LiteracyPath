// The woodland chapter owns its map, mini games and saves. This boundary
// returns the child to their existing home when they leave the adventure.

export function StudentSoundTrailPage({ renderQuest, onHome, onNavigate }) {
  if (!renderQuest) return null;

  return renderQuest({
    onExit: () => {
      if (onHome) onHome();
      else onNavigate?.("home");
    }
  });
}
