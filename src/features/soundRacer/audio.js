import { getLetterSoundCue } from '../../components/learn/phonics/cvc/cvcHelpers.js';
import { getChildAudioPath } from '../../data/childAssets.js';
import { playCueAudio, stopCueAudio, preloadCueAudio, retainCueAudioSources } from '../../utils/audio/cuePlayer.js';

function targetSource(target) {
  const normalized = String(target || '').trim().toLowerCase();
  return getLetterSoundCue(normalized, { vowel: normalized }).src || '';
}

// The controller supplies a fresh identity and a live mission/round/revision
// predicate. Shared cuePlayer owns the only spoken voice and warmed element.
function playOwnedSource(src, purpose, { cueId, isCurrent, onDelivery = () => {} } = {}) {
  let active = false;
  let terminal = false;
  let cancelled = false;
  const live = () => !cancelled && typeof isCurrent === 'function' && isCurrent();
  const deliver = event => {
    if (terminal || event.id !== cueId) return;
    const audioDelivery = event.type === 'completed' ? 'delivered'
      : ['failed', 'unavailable'].includes(event.type) ? 'unavailable'
        : event.type === 'interrupted' ? 'interrupted' : 'pending';
    // Update ownership even when the old round no longer accepts evidence.
    terminal = audioDelivery !== 'pending';
    active = !terminal;
    if (live()) onDelivery({ cueId, purpose, audioDelivery, eventType: event.type });
  };
  const cancel = () => {
    if (cancelled) return;
    // stopCueAudio synchronously reports interruption; allow its truthful event
    // only while the controller still owns this same round/revision.
    if (active && !terminal) stopCueAudio();
    cancelled = true;
    terminal = true;
    active = false;
  };
  if (typeof cueId !== 'string' || !cueId || !live()) return cancel;
  if (!src) {
    deliver({ id: cueId, type: 'unavailable' });
    return cancel;
  }
  playCueAudio(src, { cueId, onDelivery: deliver });
  return cancel;
}

export function playRacerTarget(target, options) {
  return playOwnedSource(targetSource(target), 'target', options);
}

export function prewarmRacerTarget(target) {
  const src = targetSource(target);
  const release = retainCueAudioSources(src ? [src] : []);
  if (src) void preloadCueAudio(src);
  return release;
}

// An example is separately labelled support, never delivery of the target cue.
// Missing recorded words remain unavailable; no browser speech substitution.
export function playRacerExample(word, options) {
  const src = getChildAudioPath(String(word || '').trim().toLowerCase()) || '';
  return playOwnedSource(src, 'example', options);
}

// Exact game-owned instruction generated with the established production voice.
export const SOUND_RACER_INSTRUCTION = {
  "text": "Choose a word on a road sign. Then press Drive through to open the road.",
  "src": "/game-assets/sound-racer/audio/choose-road.mp3",
  "provider": "Google Cloud Text-to-Speech",
  "voice": "en-US-Chirp3-HD-Leda",
  "sourceHash": "2c75c58836b40d11af49ce19b3e8aa12c94cc5eab3a6467122bcb827b4b5d3b9",
  "requestHash": "d61c7f1dd72d6526ee71cef9ce0cfe74ab9785ee8a0111c13cb1cdd17ed534b0",
  "sha256": "136946273ca74773a3671f7ffa4a97331801204fa918ff2179dc74c2951c0484",
  "bytes": 76461,
  "settings": {
    "audioEncoding": "LINEAR16",
    "sampleRateHertz": 24000,
    "speakingRate": 0.94,
    "pitch": 0
  },
  "normalization": {
    "filter": "highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7",
    "sampleRateHertz": 24000,
    "channels": 1,
    "codec": "libmp3lame",
    "bitRate": "128k"
  },
  "durationSeconds": 4.691333,
  "generatedAt": "2026-09-08T14:24:09.679266+00:00",
  "humanListening": "UNKNOWN"
};

export function playRacerInstruction(options) {
  return playOwnedSource(SOUND_RACER_INSTRUCTION.src, 'instruction', options);
}
