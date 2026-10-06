import { getLedaInstructionAudioPath } from '../../../../data/ledaProductionAudio.js';
import { AUDIO_QUEST_PATHS } from '../../../../data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../../../../data/knownBadWordAudio.js';
import { duckGameMusic, restoreGameMusic } from '../../../../utils/audio/gameMusic.js';

// Printed repair remains the necessary stimulus. Optional broken-stimulus and
// repaired-sentence speech keep separate actual-end receipts and one owned mix.
// An isolated-word clip can never stand in for either whole sentence.
export function createSentenceGroveCue({ speak, getSound = () => true, now = () => Date.now(),
  duckMusic = duckGameMusic, restoreMusic = restoreGameMusic }) {
  let generation = 0, disposed = false, current = null, active = null;
  const stimulus = { delivery: 'unavailable', receipt: null };
  const readback = { value: '', delivery: 'unavailable', receipt: null };
  const readbackSource = value => {
    const candidate = getLedaInstructionAudioPath(value);
    return candidate && AUDIO_QUEST_PATHS.has(candidate) && !isKnownBadAudioPath(candidate) ? candidate : '';
  };
  const release = voice => { if (voice?.ducked) { voice.ducked = false; restoreMusic(voice.mixOwner); } };
  function stop() {
    generation++; const previous = active; active = null;
    previous?.controller.abort(); release(previous);
    for (const state of [stimulus, readback]) if (state.delivery === 'pending') state.delivery = 'unavailable';
  }
  async function playVoice(kind, value, source) {
    stop(); const state = kind === 'stimulus' ? stimulus : readback;
    state.receipt = null; state.delivery = 'unavailable';
    if (disposed || !source || !value || !getSound()) return;
    const voice = { kind, value, token: generation, controller: new AbortController(), mixOwner: {},
      ducked: false, startedAt: null, terminal: false };
    active = voice; state.delivery = 'pending';
    const owns = () => !disposed && active === voice && generation === voice.token && !voice.controller.signal.aborted;
    try {
      await speak(value, { signal: voice.controller.signal, onStart() {
        if (!owns() || voice.terminal || !getSound()) return;
        voice.startedAt ??= now();
        if (!voice.ducked) { voice.ducked = true; duckMusic(voice.mixOwner); }
      }, onEnd(endedSource) {
        if (!owns() || voice.terminal || endedSource !== source || !getSound()) return;
        voice.terminal = true; state.receipt = { source, endedAt: now() }; state.delivery = 'delivered';
        release(voice);
      } });
    } catch { /* Unavailable speech leaves the printed repair and driving live. */ }
    finally {
      release(voice);
      if (owns()) { if (state.delivery === 'pending') state.delivery = 'unavailable'; active = null; }
    }
  }
  return {
    play(round) {
      current = round;
      return playVoice('stimulus', round ? `${round.prompt}. ${round.display}` : '', round?.optionalStimulusAudio);
    },
    playReadback(value) {
      readback.value = value;
      return playVoice('readback', value, readbackSource(value));
    },
    hasReadback: value => !disposed && Boolean(readbackSource(value)),
    stop,
    snapshot: () => ({ roundId: current?.roundId || null, delivery: stimulus.delivery,
      deliveryReceipt: stimulus.receipt ? { ...stimulus.receipt } : null }),
    readbackSnapshot: () => ({ sentence: readback.value, delivery: readback.delivery,
      deliveryReceipt: readback.receipt ? { ...readback.receipt } : null }),
    mixSnapshot: () => ({ kind: active?.kind || null, value: active?.value || null,
      startedAt: active?.startedAt ?? null, ducked: Boolean(active?.ducked) }),
    dispose() { disposed = true; stop(); current = null; stimulus.receipt = null; readback.receipt = null; }
  };
}
