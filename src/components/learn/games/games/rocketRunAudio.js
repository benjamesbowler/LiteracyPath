import { getPreferredPhonemeAudioPath } from '../../../../data/phonemeAudioBank.js';
import { rocketRunWordAudioPath, rocketRunWordOnset } from './rocketRunFlight.js';

export const ROCKET_AUDIO_SCRIPTS = Object.freeze({
  instruction: 'Choose the word that starts with the sound. Tap its gate, then tap Fly through.',
  begins: 'begins with',
  find: 'Find',
  powered: 'Gate powered!'
});
export const rocketInstructionPath = id => `/audio/rocket-run/${id}-v3.mp3`;

export function rocketFeedbackClips(response) {
  const onset = rocketRunWordOnset(response.response);
  if (!onset) return [];
  const clips = [rocketRunWordAudioPath(response.response), rocketInstructionPath('begins'),
    getPreferredPhonemeAudioPath(onset)];
  return response.correct ? [...clips, rocketInstructionPath('powered')]
    : [...clips, rocketInstructionPath('find'), getPreferredPhonemeAudioPath(response.target)];
}
