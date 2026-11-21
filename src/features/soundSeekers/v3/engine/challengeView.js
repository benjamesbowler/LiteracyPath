// Saved campaign checkpoints use this contract without building new challenges.
export const MECHANICS = Object.freeze({
  SIGNPOST: "sound_signpost",
  ECHO_HUNT: "echo_hunt",
  SOUND_SORT: "sound_sort",
  WORD_FORGE: "word_forge",
  BLEND_BRIDGE: "blend_bridge",
  HEART_LANTERN: "heart_lantern",
  GATE_RIDDLE: "gate_riddle",
  STORY_BRIDGE: "story_bridge"
});

const FORBIDDEN = /answer|correct|expected|evidence|score/i;

export function publicBeat(beat) {
  if (!beat) return null;
  const rest = { ...beat };
  delete rest.key;
  const json = JSON.stringify(rest.view);
  if (FORBIDDEN.test(Object.keys(rest.view).join(" ")) || /"(expected|correct|answerId)":/.test(json)) {
    throw new Error(`Beat ${beat.id} leaks answer information into its view`);
  }
  return rest;
}
