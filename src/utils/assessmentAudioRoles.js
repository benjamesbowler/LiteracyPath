import { getLedaWordAudioPath } from "../data/ledaProductionAudio.js";
import {
  isGenericInstructionAudioPath,
  normalizeAssessmentAudioRoles as normalizeAssessmentAudioPolicy
} from "./assessmentAudioPolicy.js";
export {
  SHORT_VOWEL_LISTEN_PROMPT,
  inferShortVowelFromWord,
  isGenericInstructionAudioPath,
  isListenChooseVowelQuestion,
  normalizeVowelAnswer
} from "./assessmentAudioPolicy.js";

export function getTargetWordAudioPath(targetWord = "", fallbackPath = "") {
  const cleanTarget = String(targetWord || "").trim();
  if (!cleanTarget) return "";
  const ledaPath = getLedaWordAudioPath(cleanTarget);
  if (ledaPath) return ledaPath;

  if (!isGenericInstructionAudioPath(fallbackPath)) {
    return fallbackPath || "";
  }

  return "";
}

/** Route-level enrichment; unlike the shell-safe policy this may load LEDA. */
export function normalizeAssessmentAudioRoles(question = {}) {
  const normalized = normalizeAssessmentAudioPolicy(question);
  if (!normalized) return normalized;
  const targetWord = normalized.targetWord || normalized.audioText || "";
  if (!targetWord || normalized.audioRole !== "target_word") return normalized;
  const audioPath = getTargetWordAudioPath(
    targetWord,
    normalized.audioPath || normalized.audioUrl || ""
  );
  return audioPath
    ? { ...normalized, audioPath, audioUrl: audioPath }
    : normalized;
}
