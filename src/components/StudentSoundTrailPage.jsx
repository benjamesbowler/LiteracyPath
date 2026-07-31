// SOUND SEEKERS opens on its real playable chapter map.
//
// This route used to add a second, decorative "Sound Trail" map in front of
// Sound Seekers. Children then had to pass through that map and a dense Den
// before reaching the map that actually controls the game. The duplicate
// journey made the route look inconsistent and made "back" mean three
// different things. QuestRoot now owns the one true map and this component is
// deliberately only the lazy-loading boundary supplied by AppSurface.

export function StudentSoundTrailPage({ renderQuest, onHome, onNavigate }) {
  if (!renderQuest) return null;

  return renderQuest({
    onExit: () => {
      if (onHome) onHome();
      else onNavigate?.("home");
    }
  });
}
