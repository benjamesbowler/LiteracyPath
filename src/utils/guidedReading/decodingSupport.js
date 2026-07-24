import { segmentWord } from "../graphemeSegments.js";
import { graphemeSrc } from "../questAudio.js";

export const DECODING_SUPPORT_STAGES = Object.freeze({
  WHOLE_WORD_AUDIO: "whole_word_audio",
  SEGMENTED_PHONEMES: "segmented_phonemes",
  REREAD_PROMPT: "reread_prompt"
});

export const DECODING_SUPPORT_STAGE_LABELS = Object.freeze({
  [DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO]: "Whole-word audio",
  [DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES]: "Sound-by-sound support",
  [DECODING_SUPPORT_STAGES.REREAD_PROMPT]: "Reread prompt"
});

const VALID_STAGES = new Set(Object.values(DECODING_SUPPORT_STAGES));
const MAX_SUPPORT_EVENTS = 300;

function cleanWord(value = "") {
  return String(value).trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
}

function displaySegment(segment = "") {
  return String(segment).replace("_", "…");
}

function stageSequenceFor(segments = []) {
  return segments.length > 1
    ? [
        DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO,
        DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES,
        DECODING_SUPPORT_STAGES.REREAD_PROMPT
      ]
    : [
        DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO,
        DECODING_SUPPORT_STAGES.REREAD_PROMPT
      ];
}

export function getDecodingSupportStageLabel(stage = "") {
  return DECODING_SUPPORT_STAGE_LABELS[stage] || "Decoding support";
}

export function getNextDecodingSupportStep({ previousStage = "", word = "" } = {}) {
  const normalizedWord = cleanWord(word);
  const segments = segmentWord(normalizedWord);
  const sequence = stageSequenceFor(segments);
  const previousIndex = sequence.indexOf(previousStage);
  const stage = sequence[(previousIndex + 1) % sequence.length];
  const phonemeAudioPaths = segments.map(graphemeSrc);
  const hasCompletePhonemeAudio = Boolean(segments.length) && phonemeAudioPaths.every(Boolean);
  const stageNumber = stage === DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO
    ? 1
    : stage === DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES
      ? 2
      : 3;

  return {
    word: normalizedWord,
    stage,
    stageLabel: getDecodingSupportStageLabel(stage),
    stageNumber,
    totalStages: 3,
    segments,
    displaySegments: segments.map(displaySegment),
    phonemeAudioPaths,
    hasCompletePhonemeAudio,
    message: stage === DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO
      ? `Listen to the whole word: ${normalizedWord}.`
      : stage === DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES
        ? `Use the letters and sounds: ${segments.map(displaySegment).join(" · ")}.`
        : "Now reread the whole sentence from the start."
  };
}

export function createDecodingSupportEvent({
  eventId = "",
  stage = "",
  word = "",
  wordIndex = 0,
  pageNumber = 1,
  occurredAt = "",
  segments = [],
  audioAvailable = false
} = {}) {
  return normalizeDecodingSupportEvent({
    eventId,
    stage,
    word,
    wordIndex,
    pageNumber,
    occurredAt,
    segments,
    audioAvailable
  });
}

export function normalizeDecodingSupportEvent(raw = {}) {
  const stage = VALID_STAGES.has(raw.stage) ? raw.stage : "";
  const word = cleanWord(raw.word);
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

export function appendDecodingSupportEvent(events = [], event) {
  const normalized = normalizeDecodingSupportEvent(event);
  const existing = Array.isArray(events)
    ? events.map(normalizeDecodingSupportEvent).filter(Boolean)
    : [];
  if (!normalized) return existing.slice(-MAX_SUPPORT_EVENTS);

  const withoutDuplicate = existing.filter(item => item.eventId !== normalized.eventId);
  return [...withoutDuplicate, normalized].slice(-MAX_SUPPORT_EVENTS);
}

