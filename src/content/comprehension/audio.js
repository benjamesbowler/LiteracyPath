import { COMPREHENSION_LEDA_AUDIO } from './audio.generated.js';
import { LEDA_PRODUCTION_VOICE } from '../../data/ledaProductionVoice.js';

export const COMPREHENSION_AUDIO_PAUSE_MS = 450;
export const COMPREHENSION_AUDIO_RECIPE = 'leda-exact-segments-pause450-tail150-v2';

// Keep the exact authored text: case, punctuation and option order all matter.
export function comprehensionPassageAudioSegments(passage) {
  return passage?.title && passage?.text ? [passage.title, passage.text] : [];
}

export function comprehensionQuestionAudioSegments(question) {
  if (!question?.prompt || question.options?.length !== 4) return [];
  return [question.prompt, ...question.options.flatMap((option, index) => [`Option ${'ABCD'[index]}.`, option])];
}

export function comprehensionAudioText(segments) {
  return segments.join('\n\n');
}

function resolve(segments) {
  const text = comprehensionAudioText(segments);
  const path = segments.length ? COMPREHENSION_LEDA_AUDIO[text] || '' : '';
  return { status: path ? 'ready' : 'missing', path, text, voice: LEDA_PRODUCTION_VOICE };
}

export function resolveComprehensionPassageAudio(passage) {
  return resolve(comprehensionPassageAudioSegments(passage));
}

export function resolveComprehensionQuestionAudio(question) {
  const segments = comprehensionQuestionAudioSegments(question);
  const parts = segments.map((text, index) => ({
    path: COMPREHENSION_LEDA_AUDIO[text] || '',
    gapBeforeMs: index > 0 ? COMPREHENSION_AUDIO_PAUSE_MS : 0
  }));
  return { status: parts.length && parts.every(part => part.path) ? 'ready' : 'missing',
    path: '', parts, text: comprehensionAudioText(segments), voice: LEDA_PRODUCTION_VOICE };
}
