export function isLiveDelayedSpeech({
  soundEnabled,
  scheduledRound,
  currentRound,
  scheduledTarget,
  currentTarget
} = {}) {
  return Boolean(soundEnabled)
    && scheduledRound === currentRound
    && scheduledTarget === currentTarget;
}
