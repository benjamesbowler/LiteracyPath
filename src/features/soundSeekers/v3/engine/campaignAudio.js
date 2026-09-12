/** One owned playback at a time. Cancellation settles callers and removes all
 * handlers; a replay cannot finish an obsolete instruction or stop a new one. */
export function createCampaignAudio({ AudioClass = globalThis.Audio, onFailure = () => {}, onSpeakingChange = () => {} } = {}) {
  let generation = 0, current = null, settle = null, disposed = false;
  function stop() {
    generation++;
    const finish = settle;
    if (current) { current.pause(); current.removeAttribute?.('src'); current.load?.(); }
    finish?.(false);
    current = null; settle = null;
    onSpeakingChange(false);
  }
  async function play(sources) {
    stop();
    const ticket = generation;
    if (disposed || !AudioClass || !sources?.filter(Boolean).length) return false;
    onSpeakingChange(true);
    for (const src of sources.filter(Boolean)) {
      if (ticket !== generation || disposed) return false;
      const audio = new AudioClass(src); current = audio;
      const ok = await new Promise(resolve => {
        let finished = false;
        const finish = value => {
          if (finished) return; finished = true;
          audio.removeEventListener('ended', ended); audio.removeEventListener('error', failed);
          if (current === audio) { current = null; settle = null; }
          resolve(value);
        };
        const ended = () => finish(true);
        const failed = error => { if (ticket === generation && !disposed) onFailure(src,{needsGesture:error?.name==='NotAllowedError'}); finish(false); };
        settle = finish; audio.addEventListener('ended', ended); audio.addEventListener('error', failed);
        try { Promise.resolve(audio.play()).catch(failed); } catch (error) { failed(error); }
      });
      if (!ok) { if(ticket===generation)onSpeakingChange(false);return false; }
    }
    if(ticket===generation)onSpeakingChange(false);
    return ticket === generation && !disposed;
  }
  return { play, stop, dispose() { disposed = true; stop(); } };
}
