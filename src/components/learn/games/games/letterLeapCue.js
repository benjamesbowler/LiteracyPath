/** One word owns its real image decode and Howler end receipt. Rendering,
 * pause and later media success cannot rewrite an earlier response. */
export function createLetterLeapCue({ picture, speak, getSound, onChange = () => {}, now = () => Date.now(),
  schedule = (fn, ms) => setTimeout(fn, ms), clear = id => clearTimeout(id) }) {
  let round = null, generation = 0, voiceGeneration = 0, controller = null, timer = null, disposed = false;
  let delivery = 'pending', pictureDelivery = 'pending', deliveryReceipt = null, pictureReceipt = null;
  const notify = () => { if (!disposed) onChange(); };
  const stop = () => { voiceGeneration++; controller?.abort(); controller = null; };
  function loadPicture(index, ticket) {
    clear(timer);
    const source = round.pictures[index];
    if (!source) { pictureDelivery = 'unavailable'; picture.style.display = 'none'; picture.removeAttribute('src'); notify(); return; }
    picture.style.display = 'block';
    picture.alt = round.pictureKind === 'sentence-context' ? 'Scene clue for this sentence' : 'Picture clue for the word to spell';
    if (picture.dataset) picture.dataset.cueKind = round.pictureKind || 'word';
    const failed = () => {
      if (disposed || ticket !== generation) return;
      clear(timer); picture.onload = picture.onerror = null;
      loadPicture(index + 1, ticket);
    };
    picture.onerror = failed;
    picture.onload = async () => {
      try { await picture.decode(); } catch { failed(); return; }
      if (disposed || ticket !== generation || picture.getAttribute('src') !== source) return;
      if (!picture.naturalWidth || !picture.naturalHeight) { failed(); return; }
      clear(timer); pictureDelivery = 'delivered'; pictureReceipt = { source, decodedAt: now() }; notify();
    };
    timer = schedule(failed, 5000);
    picture.src = source;
  }
  const api = {
    reset(next) {
      if (disposed) return;
      stop(); clear(timer); generation++; round = next;
      delivery = getSound() && next?.audio ? 'pending' : 'unavailable';
      pictureDelivery = 'pending'; deliveryReceipt = pictureReceipt = null;
      picture.onload = picture.onerror = null;
      if (!next) { pictureDelivery = 'unavailable'; picture.style.display = 'none'; return; }
      loadPicture(0, generation); notify();
    },
    async play() {
      if (disposed || !round || !getSound() || !round.audio) return;
      stop(); const ticket = ++voiceGeneration, owner = generation;
      controller = new AbortController(); const signal = controller.signal;
      delivery = 'pending'; deliveryReceipt = null; notify();
      try {
        await speak(round.word.toLowerCase(), { signal, onEnd(source) {
          if (disposed || signal.aborted || ticket !== voiceGeneration || owner !== generation || source !== round.audio) return;
          delivery = 'delivered'; deliveryReceipt = { source, endedAt: now() }; notify();
        } });
      } catch { /* The shared audio promise fails closed. */ }
      if (!disposed && !signal.aborted && ticket === voiceGeneration && owner === generation && delivery !== 'delivered') {
        delivery = 'unavailable'; notify();
      }
    },
    stop,
    soundChanged() {
      if (!getSound()) { stop(); delivery = 'unavailable'; deliveryReceipt = null; notify(); }
    },
    snapshot() { return { delivery, pictureDelivery, pictureKind: round?.pictureKind || 'word', deliveryReceipt: deliveryReceipt ? { ...deliveryReceipt } : null,
      pictureReceipt: pictureReceipt ? { ...pictureReceipt } : null }; },
    dispose() { disposed = true; generation++; stop(); clear(timer); picture.onload = picture.onerror = null; }
  };
  return api;
}
