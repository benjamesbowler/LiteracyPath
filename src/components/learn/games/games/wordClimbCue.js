import { phonemeAudioCandidates } from '../../../../data/phonemeAudioBank.js';
import { AUDIO_QUEST_PATHS } from '../../../../data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../../../../data/knownBadWordAudio.js';
import { getLedaWordAudioPath } from '../../../../data/ledaProductionAudio.js';
import { duckGameMusic, restoreGameMusic } from '../../../../utils/audio/gameMusic.js';

// Target and corrective/readback words share one owned voice channel. Only a
// matching actual Howler end creates a delivery receipt; feedback cannot stand
// in for the target phoneme heard before a landing.
export function createWordClimbCue({ speak, speakFeedback, getSound = () => true, now = () => Date.now(),
  duckMusic = duckGameMusic, restoreMusic = restoreGameMusic }) {
  let active = null, generation = 0, disposed = false, enabled = true;
  const target = { value: '', delivery: 'pending', receipt: null };
  const feedback = { value: '', delivery: 'unavailable', receipt: null };
  const soundOn = () => enabled && getSound();
  const validSources = sources => sources.filter(source => source && AUDIO_QUEST_PATHS.has(source) && !isKnownBadAudioPath(source));
  const releaseMix = voice => {
    if (voice?.ducked) { voice.ducked = false; restoreMusic(voice.mixOwner); }
  };
  function stop() {
    generation++;
    const previous = active; active = null;
    previous?.controller.abort(); releaseMix(previous);
    for (const state of [target, feedback]) if (state.delivery === 'pending') state.delivery = 'unavailable';
  }
  async function playVoice(kind, value, speaker, allowed) {
    stop();
    const state = kind === 'target' ? target : feedback;
    state.value = value; state.receipt = null; state.delivery = 'unavailable';
    if (disposed || !soundOn() || !value || !speaker || !allowed.length) return;
    const voice = { kind, value, controller: new AbortController(), token: generation,
      mixOwner: {}, ducked: false, terminal: false, startedAt: null };
    active = voice; state.delivery = 'pending';
    const owns = () => !disposed && active === voice && generation === voice.token && !voice.controller.signal.aborted;
    try {
      await speaker(value, { signal: voice.controller.signal, onStart: () => {
        if (!owns() || voice.terminal || !soundOn()) return;
        voice.startedAt ??= now();
        if (!voice.ducked) { voice.ducked = true; duckMusic(voice.mixOwner); }
      }, onEnd: source => {
        if (!owns() || voice.terminal) return;
        voice.terminal = true;
        if (soundOn() && allowed.includes(source)) {
          state.receipt = { source, endedAt: now() }; state.delivery = 'delivered';
        }
        releaseMix(voice);
      } });
    } catch { /* Missing/error speech remains supported, playable practice. */ }
    finally {
      // An old rejected/resolved promise must never release a replacement's mix.
      releaseMix(voice);
      if (owns()) { if (state.delivery === 'pending') state.delivery = 'unavailable'; active = null; }
    }
  }
  return {
    play: (value = target.value) => playVoice('target', value, speak, validSources(phonemeAudioCandidates(value))),
    playFeedback: value => playVoice('feedback', value, speakFeedback, validSources([getLedaWordAudioPath(value)])),
    stop,
    setEnabled(value) { enabled = Boolean(value); if (!enabled) stop(); },
    snapshot: () => ({ target: target.value, delivery: target.delivery, deliveryReceipt: target.receipt ? { ...target.receipt } : null }),
    feedbackSnapshot: () => ({ word: feedback.value, delivery: feedback.delivery, deliveryReceipt: feedback.receipt ? { ...feedback.receipt } : null }),
    mixSnapshot: () => ({ kind: active?.kind || null, value: active?.value || null, startedAt: active?.startedAt ?? null, ducked: Boolean(active?.ducked) }),
    dispose() { disposed = true; stop(); }
  };
}
