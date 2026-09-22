import {
  getLedaProductionAudioPath,
  getLedaInstructionAudioPath,
  getLedaWordAudioPath
} from "../data/ledaProductionAudio.js";
import { getPreferredPhonemeAudioPath } from "../data/phonemeAudioBank.js";

export function resolveAssessmentLedaAudioPath(text, audioRole = "") {
  if (audioRole === "phoneme") return getPreferredPhonemeAudioPath(text);
  if (audioRole === "target_word") return getLedaWordAudioPath(text);
  if (audioRole === "passage") return getLedaProductionAudioPath(text, ["assessment_passage"])
    || getLedaInstructionAudioPath(text);
  if (audioRole === "instruction") return getLedaInstructionAudioPath(text);
  // Untyped replays include answer cards. A target alias in an instruction
  // index must not replace the requested word with another question's prompt.
  return getLedaWordAudioPath(text) || getLedaInstructionAudioPath(text);
}
