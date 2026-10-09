// Pure evidence normalisation: reporting must not download playback catalogues.
import { segmentWord } from "../questSegments.js";

export const DECODING_SUPPORT_STAGES = Object.freeze({
  WHOLE_WORD_AUDIO: "whole_word_audio",
  SEGMENTED_PHONEMES: "segmented_phonemes",
  LETTER_SPELLING: "letter_spelling",
  REREAD_PROMPT: "reread_prompt"
});

export const DECODING_SUPPORT_STAGE_LABELS = Object.freeze({
  [DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO]: "Whole-word audio",
  [DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES]: "Sound-by-sound support",
  [DECODING_SUPPORT_STAGES.LETTER_SPELLING]: "Look at the spelling",
  [DECODING_SUPPORT_STAGES.REREAD_PROMPT]: "Reread prompt"
});

const VALID_STAGES = new Set(Object.values(DECODING_SUPPORT_STAGES));
export function cleanDecodingSupportWord(value = "") {
  return String(value).trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
}

export function getDecodingSupportStageLabel(stage = "") {
  return DECODING_SUPPORT_STAGE_LABELS[stage] || "Decoding support";
}

export function normalizeDecodingSupportEvent(raw = {}) {
  const stage = VALID_STAGES.has(raw.stage) ? raw.stage : "";
  const word = cleanDecodingSupportWord(raw.word);
  if (!stage || !word) return null;

  const occurredAt = String(raw.occurredAt || raw.createdAt || raw.updatedAt || "");
  const wordIndex = Math.max(0, Number.parseInt(raw.wordIndex, 10) || 0);
  const pageNumber = Math.max(1, Number.parseInt(raw.pageNumber ?? raw.page, 10) || 1);
  const segments = Array.isArray(raw.segments)
    ? raw.segments.map(segment => String(segment).trim()).filter(Boolean)
    : segmentWord(word);

  return {
    eventId: String(raw.eventId || `${pageNumber}:${wordIndex}:${stage}:${occurredAt || "undated"}`),
    stage,
    stageLabel: getDecodingSupportStageLabel(stage),
    word,
    wordIndex,
    pageNumber,
    occurredAt,
    segments,
    audioAvailable: Boolean(raw.audioAvailable)
  };
}
