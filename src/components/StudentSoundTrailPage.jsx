// Sound Seekers opens directly on the v2 campaign. This component remains the
// small navigation boundary supplied by AppSurface; the game owns its map,
// expedition, journal, creator, rewards, settings, and safe-save lifecycle.

export function StudentSoundTrailPage({ renderQuest, onHome, onNavigate }) {
  if (!renderQuest) return null;

  return renderQuest({
    onExit: () => {
      if (onHome) onHome();
      else onNavigate?.("home");
    }
  });
}
