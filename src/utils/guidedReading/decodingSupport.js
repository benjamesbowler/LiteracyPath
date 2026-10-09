import { graphemeSrc } from "../questAudio.js";
import { segmentWord } from "../questSegments.js";
import {
  DECODING_SUPPORT_STAGES,
  cleanDecodingSupportWord as cleanWord,
  getDecodingSupportStageLabel,
  normalizeDecodingSupportEvent
} from "./decodingSupportEvidence.js";
export {
  DECODING_SUPPORT_STAGES,
  DECODING_SUPPORT_STAGE_LABELS,
  getDecodingSupportStageLabel,
  normalizeDecodingSupportEvent
} from "./decodingSupportEvidence.js";

const MAX_SUPPORT_EVENTS = 300;

function displaySegment(segment = "") {
  return String(segment).replace("_", "…");
}

const SIMPLE_SHORT_VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SIMPLE_ONSETS = new Set(["", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "z", "sh"]);
const SIMPLE_CODAS = new Set(["", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "z", "ck", "ng", "sh"]);
const SHORT_VOWEL_EXCEPTIONS = new Set([
  "all", "as", "ball", "be", "bess", "both", "bush", "bull", "call", "cold",
  "do", "fall", "few", "find", "full", "give", "go", "hall", "has", "he",
  "his", "is", "kind", "less", "long", "me", "mess", "mind", "miss", "moss",
  "most", "new", "no", "of", "off", "oh", "old", "pass", "paw", "pull",
  "push", "put", "re", "roll", "saw", "she", "so", "song", "tall", "to",
  "told", "ve", "wall", "want", "was", "wash", "we", "what", "wild"
]);

const VOICELESS_FINAL_S_BASES = new Set(["p", "t", "k", "f", "th"]);

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

// A regular final -s is pronounced /s/ after an unvoiced sound and /z/ after
// a voiced sound. The old spelling step always played the letter name "ess",
// which is not decoding help. Only extend a word when its base already passes
// the deliberately narrow short-vowel safety check; irregular or ambiguous
// spellings remain visual rather than receiving a guessed pronunciation.
function regularFinalSSoundSequence(word = "") {
  const clean = cleanWord(word).toLowerCase();
  if (clean.length < 4 || !clean.endsWith("s") || clean.endsWith("ss")) return null;

  const baseWord = clean.slice(0, -1);
  const baseSegments = segmentWord(baseWord);
  const baseAudioPaths = baseSegments.map(graphemeSrc);
  if (!hasSafeRecordedSoundSequence(baseWord, baseSegments, baseAudioPaths)) return null;

  const finalBaseSegment = baseSegments.at(-1) || "";
  const suffixSound = VOICELESS_FINAL_S_BASES.has(finalBaseSegment) ? "s" : "z";
  const audioPaths = [...baseAudioPaths, graphemeSrc(suffixSound)];
  if (!audioPaths.every(Boolean)) return null;

  return {
    segments: [...baseSegments, "s"],
    audioPaths
  };
}

export function getRecordedSoundSequence(word = "") {
  const normalizedWord = cleanWord(word);
  const regularFinalS = regularFinalSSoundSequence(normalizedWord);
  if (regularFinalS) {
    return {
      segments: regularFinalS.segments,
      audioPaths: regularFinalS.audioPaths,
      hasCompleteAudio: true
    };
  }

  const segments = segmentWord(normalizedWord);
  const audioPaths = segments.map(graphemeSrc);
  return {
    segments,
    audioPaths,
    hasCompleteAudio: hasSafeRecordedSoundSequence(normalizedWord, segments, audioPaths)
  };
}

function stageSequenceFor(hasSafePhonemeAudio = false) {
  return [
    DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO,
    hasSafePhonemeAudio
      ? DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES
      : DECODING_SUPPORT_STAGES.LETTER_SPELLING,
    DECODING_SUPPORT_STAGES.REREAD_PROMPT
  ];
}

export function getNextDecodingSupportStep({ previousStage = "", word = "" } = {}) {
  const normalizedWord = cleanWord(word);
  const soundSequence = getRecordedSoundSequence(normalizedWord);
  const { segments, audioPaths: phonemeAudioPaths, hasCompleteAudio: hasCompletePhonemeAudio } = soundSequence;
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
    // Retained in the result shape for saved-report compatibility. Guided
    // Reading no longer plays letter names as though they were word sounds.
    letterAudioPaths: [],
    hasCompleteSpellingAudio: false,
    message: stage === DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO
      ? `Listen to the whole word: ${normalizedWord}.`
      : stage === DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES
        ? `Use the letters and sounds: ${segments.map(displaySegment).join(" · ")}.`
        : stage === DECODING_SUPPORT_STAGES.LETTER_SPELLING
          ? `Look at ${normalizedWord}: ${normalizedWord.toLowerCase().replace(/[^a-z]/g, "").split("").join(" · ")}.`
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

export function appendDecodingSupportEvent(events = [], event) {
  const normalized = normalizeDecodingSupportEvent(event);
  const existing = Array.isArray(events)
    ? events.map(normalizeDecodingSupportEvent).filter(Boolean)
    : [];
  if (!normalized) return existing.slice(-MAX_SUPPORT_EVENTS);

  const withoutDuplicate = existing.filter(item => item.eventId !== normalized.eventId);
  return [...withoutDuplicate, normalized].slice(-MAX_SUPPORT_EVENTS);
}
