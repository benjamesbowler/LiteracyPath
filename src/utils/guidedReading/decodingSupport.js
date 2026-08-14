import { segmentWord } from "../graphemeSegments.js";
import { graphemeSrc, spellingAudioPaths } from "../questAudio.js";

export const DECODING_SUPPORT_STAGES = Object.freeze({
  WHOLE_WORD_AUDIO: "whole_word_audio",
  SEGMENTED_PHONEMES: "segmented_phonemes",
  LETTER_SPELLING: "letter_spelling",
  REREAD_PROMPT: "reread_prompt"
});

export const DECODING_SUPPORT_STAGE_LABELS = Object.freeze({
  [DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO]: "Whole-word audio",
  [DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES]: "Sound-by-sound support",
  [DECODING_SUPPORT_STAGES.LETTER_SPELLING]: "Spell the word",
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

const SIMPLE_SHORT_VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SIMPLE_ONSETS = new Set(["", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "z", "sh"]);
const SIMPLE_CODAS = new Set(["", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "z", "ck", "ng", "sh"]);
const SHORT_VOWEL_EXCEPTIONS = new Set([
  "both", "bush", "bull", "cold", "find", "full", "give", "kind", "mind",
  "most", "old", "pull", "push", "put", "told", "want", "was", "wash", "what", "wild"
]);

// The old ladder treated a greedy letter split as a pronunciation and could
// teach ch=/ch/ in school, oo=/oo/ in book, or unvoiced th in the. Only a
// tightly bounded short-vowel pattern receives sound-by-sound playback. Every
// other word still receives exact whole-word audio and exact letter spelling.
export function hasSafeRecordedSoundSequence(word = "", segments = [], audioPaths = []) {
  const clean = cleanWord(word).toLowerCase();
  if (!clean || segments.length < 2 || SHORT_VOWEL_EXCEPTIONS.has(clean) || !audioPaths.length || !audioPaths.every(Boolean)) return false;
  if (/c(?=[eiy])|g(?=[eiy])/.test(clean)) return false;

  const vowelIndexes = segments
    .map((segment, index) => SIMPLE_SHORT_VOWELS.has(segment) ? index : -1)
    .filter(index => index >= 0);
  if (vowelIndexes.length !== 1) return false;

  const vowelIndex = vowelIndexes[0];
  const onset = segments.slice(0, vowelIndex).join("");
  const coda = segments.slice(vowelIndex + 1).join("");
  return SIMPLE_ONSETS.has(onset) && SIMPLE_CODAS.has(coda);
}

function stageSequenceFor(hasSafePhonemeAudio = false) {
  return [
    DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO,
    ...(hasSafePhonemeAudio ? [DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES] : []),
    DECODING_SUPPORT_STAGES.LETTER_SPELLING,
    DECODING_SUPPORT_STAGES.REREAD_PROMPT
  ];
}

export function getDecodingSupportStageLabel(stage = "") {
  return DECODING_SUPPORT_STAGE_LABELS[stage] || "Decoding support";
}

export function getNextDecodingSupportStep({ previousStage = "", word = "" } = {}) {
  const normalizedWord = cleanWord(word);
  const segments = segmentWord(normalizedWord);
  const phonemeAudioPaths = segments.map(graphemeSrc);
  const hasCompletePhonemeAudio = hasSafeRecordedSoundSequence(normalizedWord, segments, phonemeAudioPaths);
  const letterAudioPaths = spellingAudioPaths(normalizedWord);
  const sequence = stageSequenceFor(hasCompletePhonemeAudio);
  const previousIndex = sequence.indexOf(previousStage);
  const stage = sequence[(previousIndex + 1) % sequence.length];
  const stageNumber = sequence.indexOf(stage) + 1;

  return {
    word: normalizedWord,
    stage,
    stageLabel: getDecodingSupportStageLabel(stage),
    stageNumber,
    totalStages: sequence.length,
    segments,
    displaySegments: segments.map(displaySegment),
    phonemeAudioPaths,
    hasCompletePhonemeAudio,
    letters: normalizedWord.toLowerCase().replace(/[^a-z]/g, "").split(""),
    letterAudioPaths,
    hasCompleteSpellingAudio: letterAudioPaths.length > 0,
    message: stage === DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO
      ? `Listen to the whole word: ${normalizedWord}.`
      : stage === DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES
        ? `Use the letters and sounds: ${segments.map(displaySegment).join(" · ")}.`
        : stage === DECODING_SUPPORT_STAGES.LETTER_SPELLING
          ? `Spell ${normalizedWord}: ${normalizedWord.toLowerCase().replace(/[^a-z]/g, "").split("").join(" · ")}.`
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
