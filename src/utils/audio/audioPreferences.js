export const DEFAULT_SPOKEN_AUDIO_ENABLED = true;
export const DEFAULT_MUSIC_ENABLED = false;
export const MUSIC_PREFERENCE_VERSION = 1;

export function normalizeAudioPreferences(raw = {}) {
  // Older saves contain music-on values written by the former default, not
  // necessarily a child choosing music. Reset those once; subsequent choices
  // travel with this version through local storage and progress sync.
  const currentPreference = raw?.musicPreferenceVersion === MUSIC_PREFERENCE_VERSION;
  return {
    soundEnabled: raw?.soundEnabled !== false,
    musicEnabled: currentPreference && typeof raw?.musicEnabled === "boolean"
      ? raw.musicEnabled
      : DEFAULT_MUSIC_ENABLED,
    musicPreferenceVersion: MUSIC_PREFERENCE_VERSION
  };
}
