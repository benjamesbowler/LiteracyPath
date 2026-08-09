import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath
} from "../data/ledaProductionAudio.js";

export function resolveAssessmentLedaAudioPath(text, audioRole = "") {
  return audioRole === "target_word"
    ? getLedaWordAudioPath(text)
    : getLedaInstructionAudioPath(text) || getLedaWordAudioPath(text);
}
