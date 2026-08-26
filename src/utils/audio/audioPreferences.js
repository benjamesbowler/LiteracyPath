export const DEFAULT_SPOKEN_AUDIO_ENABLED = true;
export const DEFAULT_MUSIC_ENABLED = true;

export function normalizeAudioPreferences(raw = {}) {
  const hasExplicitMusicPreference = typeof raw?.musicEnabled === "boolean";
  return {
    soundEnabled: raw?.soundEnabled !== false,
    // Sound Seekers previously stored the inverse preference as
    // `quietSoundscape`, while Arcade's single sound switch muted everything.
    // Read either legacy mute as music-off so an already-quiet child never gets
    // surprise music, but emit only the current positive setting everywhere.
    musicEnabled: hasExplicitMusicPreference
      ? raw.musicEnabled
      : raw?.quietSoundscape || raw?.soundEnabled === false
        ? false
        : DEFAULT_MUSIC_ENABLED
  };
}
