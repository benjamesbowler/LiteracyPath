import { getLedaWordAudioPath, getLedaInstructionAudioPath, normalizeLedaAudioText } from '../../../../data/ledaProductionAudio.js';
import { hasKnownBadWordAudio, isKnownBadAudioPath } from '../../../../data/knownBadWordAudio.js';
import { GUIDED_READING_LEDA_GAPS } from '../../../../data/generated/guidedReadingLedaGaps.generated.js';

export const RHYME_AUDIO_SCRIPTS = Object.freeze({
  instruction: 'Pop every word that rhymes with the target. Each rhyme adds a balloon to the basket.',
  rhymes: 'rhymes with',
  mismatch: 'does not rhyme with',
  ready: 'Balloon basket ready!'
});

export const rhymeInstructionPath = id => `/audio/rhyme-pop/${id}-v3.mp3`;

// Exact authored-bank gaps assigned to this lane. This allowlist is also the
// generator's source, so unlisted words cannot acquire invented recording URLs.
export const RHYME_WORD_AUDIO = Object.freeze({
  knit: '/audio/rhyme-pop/word-knit-v3.mp3',
  nun: '/audio/rhyme-pop/word-nun-v3.mp3',
  rack: '/audio/rhyme-pop/word-rack-v3.mp3',
  rook: '/audio/rhyme-pop/word-rook-v3.mp3',
  shun: '/audio/rhyme-pop/word-shun-v3.mp3'
});

// As in rocketRunWordAudioPath, the instruction catalogue also contains exact
// isolated-word keys. Never infer a filename, substitute a word or use speech.
// The current Guided Reading Leda bank supplies an existing exact "knot" clip.
export function rhymeWordAudioPath(word) {
  const normalized = normalizeLedaAudioText(word);
  if (hasKnownBadWordAudio(normalized)) return '';
  const scopedPath = Object.hasOwn(RHYME_WORD_AUDIO, normalized) ? RHYME_WORD_AUDIO[normalized] : '';
  return [scopedPath, getLedaWordAudioPath(normalized), getLedaInstructionAudioPath(normalized),
    GUIDED_READING_LEDA_GAPS.isolated_word?.[normalized]]
    .find(path => typeof path === 'string' && path && !isKnownBadAudioPath(path)) || '';
}

// Preserve missing clips as empty entries so the parent's delivery lifecycle
// can report failure/recovery instead of claiming an incomplete cue was heard.
export function rhymeQuestionClips(target, choices) {
  return [rhymeInstructionPath('rhymes'), rhymeWordAudioPath(target),
    ...choices.map(choice => rhymeWordAudioPath(choice.word))];
}

export function rhymeFeedbackClips(response) {
  if (!response || typeof response.correct !== 'boolean') return [];
  // Reviewed rules own correctness, including cross-spelling rhymes. Audio
  // only voices that response; it never re-derives the relationship from text.
  return [rhymeWordAudioPath(response.response),
    rhymeInstructionPath(response.correct ? 'rhymes' : 'mismatch'),
    rhymeWordAudioPath(response.target)];
}
