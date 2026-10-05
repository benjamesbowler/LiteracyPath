import { createPausableTasks } from '../../../../utils/learningPace.js';
import { duckGameMusic, restoreGameMusic } from '../../../../utils/audio/gameMusic.js';

// A pausable sequential readback owner. A fulfilled speech promise settles
// pacing, while only the current matching Howler end records delivered audio.
export function createSentenceExpressReadback({ speakWord, getSound = () => true, now = () => Date.now(), onWord = () => {}, taskOptions = {},
  duckMusic = duckGameMusic, restoreMusic = restoreGameMusic }) {
  let generation = 0, active = null, paused = false, disposed = false, waiting = null;
  let round = null, index = 0, receipts = [], running = false;
  const mixOwner = {}; let mixDucked = false;
  const releaseMix = () => { if (mixDucked) { mixDucked = false; restoreMusic(mixOwner); } };
  const quietTasks = createPausableTasks(taskOptions);
  let finishQuietWord = null;
  const releaseQuietWord = () => { quietTasks.cancel(); finishQuietWord?.(false); finishQuietWord = null; };
  const quietWord = () => new Promise(resolve => {
    finishQuietWord = resolve;
    // Preserve the existing yard's 560ms per-word silent highlighting. This
    // clock freezes with the same owner, rather than racing through a muted
    // sentence or consuming the interval while the child has paused.
    quietTasks.schedule(() => { finishQuietWord = null; resolve(true); }, 560);
  });
  const releaseWait = () => { waiting?.(); waiting = null; };
  const stopClip = () => { active?.abort(); active = null; releaseMix(); };
  async function waitForResume(token) {
    while (paused && !disposed && token === generation) await new Promise(resolve => { waiting = resolve; });
    return !disposed && token === generation;
  }
  return {
    async play(nextRound, { readback: prefix = [] } = {}) {
      if (disposed || !Array.isArray(nextRound?.readback)) return null;
      // A live scoped-session adapter may supply its already validated actual
      // settled prefix. Continue from the first uncompleted word, retaining
      // these receipts byte-for-byte rather than replaying or inventing ends.
      if (!Array.isArray(prefix) || prefix.length > nextRound.readback.length
        || prefix.some((receipt, slot) => {
          const expected = nextRound.readback[slot];
          return receipt.slot !== slot || receipt.word !== expected.word || receipt.source !== expected.source
            || !['delivered', 'unavailable', 'sound-off', 'aborted', 'timeout'].includes(receipt.status)
            || (receipt.status === 'delivered' ? !expected.source || !Number.isFinite(receipt.endedAt) || receipt.endedAt < 0 || receipt.endedAt > now()
              : receipt.endedAt !== null);
        })) return null;
      generation++; stopClip(); releaseWait(); releaseQuietWord();
      const token = generation;
      round = nextRound; index = prefix.length; receipts = structuredClone(prefix); running = true;
      while (!disposed && token === generation && index < round.readback.length) {
        if (!await waitForResume(token)) break;
        const expected = round.readback[index], controller = new AbortController();
        active = controller;
        const startedWithSound = getSound();
        let receipt = { slot: index, word: expected.word, source: expected.source,
          status: startedWithSound ? 'unavailable' : 'sound-off', endedAt: null };
        onWord({ index, word: expected.word, active: true });
        if (!startedWithSound) {
          if (!await quietWord()) return null;
        } else if (expected.source) {
          try {
            await speakWord(expected.word, { signal: controller.signal, onStart: () => {
              if (disposed || paused || token !== generation || controller.signal.aborted || !getSound()) return;
              mixDucked = true; duckMusic(mixOwner);
            }, onEnd: source => {
              if (disposed || paused || token !== generation || controller.signal.aborted || source !== expected.source) return;
              receipt = { ...receipt, status: 'delivered', endedAt: now() };
            } });
          } catch { /* Missing, stopped and failed clips are not audio ends. */ }
        }
        if (disposed || token !== generation) return null;
        releaseMix();
        if (paused) continue; // Replay this same word on resume; no invented end.
        if (!getSound() && receipt.status !== 'delivered') receipt.status = 'sound-off';
        active = null; receipts.push(receipt); index++;
        onWord({ index: index - 1, word: expected.word, active: false, status: receipt.status });
      }
      if (disposed || token !== generation) return null;
      running = false;
      return { completed: index === round.readback.length, readback: structuredClone(receipts) };
    },
    pause() { paused = true; stopClip(); quietTasks.pause(); },
    resume() { paused = false; quietTasks.resume(); releaseWait(); },
    soundChanged() { if (!getSound()) stopClip(); },
    inspect: () => ({ index, paused, running, disposed, readback: structuredClone(receipts) }),
    stop() { generation++; running = false; stopClip(); releaseWait(); releaseQuietWord(); },
    dispose() { disposed = true; generation++; running = false; stopClip(); releaseWait(); releaseQuietWord(); }
  };
}
