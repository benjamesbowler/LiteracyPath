import { useCallback, useEffect, useRef, useState } from 'react';
import { STOP_CHILD_AUDIO_EVENT } from '../utils/audio/childAudioLifecycle.js';

/** Exact prerecorded cues; only an ended event is a delivery receipt. */
export function useMockAudio(cues, active = true) {
  const [delivery, setDelivery] = useState({});
  const [speaking, setSpeaking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [activePath, setActivePath] = useState('');
  const player = useRef({ generation: 0, cancel: null });

  const stop = useCallback(() => {
    player.current.generation++;
    player.current.cancel?.();
  }, []);
  const play = useCallback(async (sequence = cues) => {
    stop(); setBlocked(false);
    const generation = player.current.generation;
    for (const cue of sequence) {
      if (generation !== player.current.generation || document.hidden) return;
      const complete = await new Promise(resolve => {
        const audio = new Audio(); let timer; let finished = false;
        const finish = (status) => {
          if (finished) return; finished = true; clearTimeout(timer);
          audio.onended = audio.onerror = audio.onwaiting = audio.onplaying = null; audio.pause();
          if (generation === player.current.generation) {
            setSpeaking(false);
            setActivePath('');
            if (status === 'completed' || status === 'failed') setDelivery(value => ({ ...value, [cue.path]: status }));
            if (status === 'blocked') setBlocked(true);
          }
          resolve(status === 'completed');
        };
        player.current.cancel = () => { setSpeaking(false); setActivePath(''); finish('cancelled'); };
        const stalled = () => { clearTimeout(timer); timer = setTimeout(() => finish('failed'), 15000); };
        audio.onended = () => finish('completed'); audio.onerror = () => finish('failed');
        audio.onwaiting = stalled; audio.onplaying = () => clearTimeout(timer);
        if (!cue.path) { finish('failed'); return; }
        setSpeaking(true); setActivePath(cue.path); audio.src = cue.path; stalled();
        audio.play().catch(error => finish(error?.name === 'NotAllowedError' ? 'blocked' : 'failed'));
      });
      if (!complete) break;
    }
  }, [cues, stop]);
  useEffect(() => {
    const pause = () => stop();
    const visibility = () => { if (document.hidden) pause(); };
    window.addEventListener(STOP_CHILD_AUDIO_EVENT, pause);
    document.addEventListener('visibilitychange', visibility);
    return () => { stop(); window.removeEventListener(STOP_CHILD_AUDIO_EVENT, pause); document.removeEventListener('visibilitychange', visibility); };
  }, [stop]);
  useEffect(() => { if (!active) stop(); }, [active, stop]);
  return { delivery, speaking, blocked, activePath, play, stop };
}
