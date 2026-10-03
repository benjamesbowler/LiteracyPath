import { getLedaProductionAudioPath, normalizeLedaAudioText } from "../data/ledaProductionAudio.js";
import { PROGRESS_CHECK_LEDA_AUDIO } from "../data/generated/progressCheckAudio.generated.js";

export function progressCheckAudioPath(text) {
  return getLedaProductionAudioPath(text) || PROGRESS_CHECK_LEDA_AUDIO[normalizeLedaAudioText(text)] || "";
}
export function progressAudioCues(item) {
  const cues = Object.entries(item?.audio || {}).flatMap(([role, cue]) => Array.isArray(cue)
    ? cue.map((entry, index) => ({ ...entry, role: `${role}:${index}` })) : [{ ...cue, role }]);
  const order = { target: 0, passage: 1, instruction: 2 };
  return cues.map(cue => ({ ...cue, path: cue.path || progressCheckAudioPath(cue.text) }))
    .sort((a, b) => (order[a.role] ?? 3) - (order[b.role] ?? 3));
}
