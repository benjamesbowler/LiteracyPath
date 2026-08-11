// Child Home music is a small playlist, not a one-off audio path hidden in a
// component. Add future songs here and the Home player will move through the
// list, returning to the first track after the last one.

export const CHILD_HOME_MUSIC_DEFAULT_ENABLED = true;

export const CHILD_HOME_MUSIC_TRACKS = Object.freeze([
  Object.freeze({
    id: "a-to-z-animal-song",
    title: "A to Z Animal Song",
    artist: "Little Literacy Guides",
    source: "/audio/music/child-home/a-to-z-animal-song.mp3",
    mediaType: "audio/mpeg",
    volume: 0.14,
    sourceSha256: "42fb39aff0c35092d3c0f95764702c1252a856af1c541ae76d50b979e5f7904f",
    assetSha256: "ba8f95ab4c67cca8fddb27915c2ac156ab2d491ebde62df026579a33d3e0cf34",
    integratedLoudnessLufs: -18.4,
    reviewStatus: "user-supplied-technical-check-complete"
  })
]);

export function childHomeMusicPreferenceKey(scopeKey = "default") {
  return `lp-child-home-music-enabled-v1:${encodeURIComponent(scopeKey || "default")}`;
}

export function nextChildHomeMusicTrackIndex(currentIndex, trackCount = CHILD_HOME_MUSIC_TRACKS.length) {
  const count = Math.max(0, Number(trackCount) || 0);
  if (count <= 1) return 0;
  const current = Math.max(0, Number(currentIndex) || 0) % count;
  return (current + 1) % count;
}
