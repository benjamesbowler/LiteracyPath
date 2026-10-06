import { AUDIO_QUEST_PATHS } from '../../../../data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../../../../data/knownBadWordAudio.js';
import { duckGameMusic, restoreGameMusic } from '../../../../utils/audio/gameMusic.js';

// One owned target voice covers both retained word targets and exact available
// whole-sentence instructions. Word clips never stand in for a missing sentence.
export function createWordBridgeCue({ speakWord, speakSentence, getSound = () => true, now = () => Date.now(),
  duckMusic = duckGameMusic, restoreMusic = restoreGameMusic }) {
  let generation = 0, active = null, disposed = false;
  const state = { target: '', delivery: 'unavailable', receipt: null };
  const recorded = round => Boolean(round?.audio && AUDIO_QUEST_PATHS.has(round.audio) && !isKnownBadAudioPath(round.audio));
  const release = voice => { if (voice?.ducked) { voice.ducked = false; restoreMusic(voice.owner); } };
  function stop() {
    generation++;
    const voice = active; active = null;
    voice?.controller.abort(); release(voice);
    if (state.delivery === 'pending') state.delivery = 'unavailable';
  }
  function prepare(round) {
    stop(); state.target = round?.target || ''; state.receipt = null;
    state.delivery = !disposed && getSound() && recorded(round) ? 'pending' : 'unavailable';
  }
  async function play(round) {
    prepare(round);
    const speaker = round?.isSentence ? speakSentence : speakWord;
    if (disposed || !getSound() || !recorded(round) || !speaker) return;
    const voice = { token: generation, owner: {}, controller: new AbortController(), ducked: false, terminal: false, startedAt: null };
    active = voice;
    const owns = () => !disposed && active === voice && generation === voice.token && !voice.controller.signal.aborted;
    try {
      await speaker(round.target, { signal: voice.controller.signal,
        onStart() {
          if (!owns() || voice.terminal || !getSound()) return;
          voice.startedAt ??= now();
          if (!voice.ducked) { voice.ducked = true; duckMusic(voice.owner); }
        },
        onEnd(source) {
          if (!owns() || voice.terminal) return;
          voice.terminal = true;
          if (getSound() && source === round.audio) { state.delivery = 'delivered'; state.receipt = { source, endedAt: now() }; }
          release(voice);
        }
      });
    } catch { /* Unavailable speech remains honest supported matching. */ }
    finally { release(voice); if (owns()) { if (state.delivery === 'pending') state.delivery = 'unavailable'; active = null; } }
  }
  return { play, prepare, stop,
    snapshot: () => ({ delivery: state.delivery, deliveryReceipt: state.receipt ? { ...state.receipt } : null }),
    mixSnapshot: () => ({ target: state.target, startedAt: active?.startedAt ?? null, ducked: Boolean(active?.ducked) }),
    dispose() { disposed = true; stop(); }
  };
}
