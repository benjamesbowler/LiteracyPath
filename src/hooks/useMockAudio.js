import { useCallback, useEffect, useRef, useState } from 'react';
import { STOP_CHILD_AUDIO_EVENT } from '../utils/audio/childAudioLifecycle.js';
import { getMockAudioElement } from '../utils/mockAudioElement.js';

/** Exact prerecorded cues; only an ended event is a delivery receipt. */
export function useMockAudio(cues, active = true, resolveMedia) {
  const [delivery, setDelivery] = useState({});
  const [speaking, setSpeaking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [activePath, setActivePath] = useState('');
  const player = useRef({ generation: 0, cancel: null });
  const completed = useRef(new Set());

  const stop = useCallback(() => {
    player.current.generation++;
    player.current.cancel?.();
  }, []);
  const play = useCallback(async (sequence = cues) => {
    stop(); setBlocked(false);
    const generation = player.current.generation;
    const audio = getMockAudioElement(stop);
    // A child may tap an answer speaker during the initial narration. Play
    // that request, then finish any unheard required material automatically.
    const requested=new Set(sequence.map(cue=>cue.path));
    const queue=[...sequence,...cues.filter(cue=>!requested.has(cue.path) && !completed.current.has(cue.path))];
    for (const cue of queue) {
      if (generation !== player.current.generation || document.hidden) return;
      const complete = await new Promise(resolve => {
        let timer; let finished = false; let previousTime = 0;
        const finish = (status) => {
          if (finished) return; finished = true; clearTimeout(timer);
          audio.onended = audio.onerror = audio.onwaiting = audio.onplaying = audio.ontimeupdate = audio.onstalled = null; audio.pause();
          if (generation === player.current.generation) {
            setSpeaking(false);
            setActivePath('');
            if (status === 'completed') completed.current.add(cue.path);
            if (status === 'failed') completed.current.delete(cue.path);
            if (status === 'completed' || status === 'failed') setDelivery(value => ({ ...value, [cue.path]: status }));
            if (status === 'blocked') setBlocked(true);
          }
          resolve(status === 'completed');
        };
        player.current.cancel = () => { setSpeaking(false); setActivePath(''); finish('cancelled'); };
        const progressed = () => {
          if (!(audio.currentTime > previousTime)) return false;
          previousTime = audio.currentTime;
          clearTimeout(timer); timer = null;
          return true;
        };
        const stalled = () => { if (!timer) timer = setTimeout(() => {
          // The media clock runs outside the page's event loop. WebKit can
          // deliver timeupdate late; recheck real progress before pausing a
          // valid recording. This never substitutes for its ended receipt.
          if (progressed()) stalled();
          else finish('failed');
        }, 15000); };
        audio.onended = () => finish('completed'); audio.onerror = () => finish('failed');
        audio.onwaiting = audio.onplaying = audio.onstalled = stalled;
        audio.ontimeupdate = () => { if (progressed()) stalled(); };
        if (!cue.path) { finish('failed'); return; }
        setSpeaking(true); setActivePath(cue.path); audio.src = resolveMedia ? resolveMedia(cue.path) : cue.path; stalled();
        audio.play().catch(error => finish(error?.name === 'NotAllowedError' ? 'blocked' : 'failed'));
      });
      if (!complete) break;
    }
  }, [cues, stop, resolveMedia]);
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
