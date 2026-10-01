import { useCallback, useEffect, useRef } from 'react';
import { createLearningDwell, LEARNING_PACE } from '../utils/learningPace.js';
import { stopCueAudio } from '../utils/audio/cuePlayer.js';

// React game scenes retain the solved target while their parent pauses motor
// input. Audio replay after resume belongs to this same result, never a new item.
export function useLearningResult(paused = false) {
  const current = useRef(null), wasPaused = useRef(paused), pauseRef = useRef(paused);
  useEffect(() => {
    pauseRef.current = paused;
    const result = current.current;
    if (paused) result?.owner.pause();
    else if (wasPaused.current && result?.owner.active) {
      result.owner.waitFor(result.replay?.()); result.owner.resume();
    }
    wasPaused.current = paused;
  }, [paused]);
  useEffect(() => () => current.current?.owner.cancel(), []);
  const begin = useCallback((onAdvance, minimumMs = LEARNING_PACE.word, replay) => {
    current.current?.owner.cancel();
    stopCueAudio();
    const owner = createLearningDwell({ minimumMs, onAdvance });
    current.current = { owner, replay };
    if (replay) owner.waitFor(replay());
    if (pauseRef.current || document.hidden) owner.pause();
    return owner;
  }, []);
  const waitFor = useCallback(voice => {
    if (current.current?.owner.active) current.current.owner.waitFor(voice);
    return voice;
  }, []);
  return { begin, waitFor };
}
