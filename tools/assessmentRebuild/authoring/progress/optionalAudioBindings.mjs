import { getLedaWordAudioPath } from '../../../../src/data/ledaProductionAudio.js';

// Optional access is resolved at playback by progressCheckAudio.js. Preserve
// the published 2026-10-02 snapshot when the shared recording bank grows.
export const UNBOUND_PROGRESS_OPTIONAL_WORDS = Object.freeze([
  'coins', 'beans', 'carrots', 'roses', 'barking', 'luggage', 'furniture',
  'sandals', 'stripes', 'Amir', 'buttons', 'triangles', 'squares', 'lettuce',
  'seventy', 'mint', 'thyme', 'floss', 'Felix', 'Lena', 'Noor', 'Alex',
  'swallows', 'sparrows', 'bluebirds',
]);
const unboundWords = new Set(UNBOUND_PROGRESS_OPTIONAL_WORDS);
const instructionBindings = Object.freeze({
  'Where did the goalkeeper send the ball?': '/audio/production/en-US/assessment_prompt/where-did-the-goalkeeper-send-the-ball-c0e8ae7f27.mp3',
});

export function optionalProgressWordAudioPath(text, resolve = getLedaWordAudioPath) {
  return unboundWords.has(text) || !/^[a-z'-]+$/i.test(text) ? '' : resolve(text);
}

export function optionalProgressInstructionAudioPath(text) {
  return instructionBindings[text] || '';
}
