import { duckGameMusic, restoreGameMusic } from '../../../../utils/audio/gameMusic.js';
import { phonemeAudioCandidates } from '../../../../data/phonemeAudioBank.js';
import { AUDIO_QUEST_PATHS } from '../../../../data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../../../../data/knownBadWordAudio.js';

// One active spoken target and one decoded literal/context picture per engine.
// Availability is observational: promises, loading flags and cancelled events
// never stand in for an actual matching end or image decode.
export function createSoundSafariCue({ speakWord, speakPhoneme, getSound, makeImage = () => new Image(), now = Date.now,
  duckMusic = duckGameMusic, restoreMusic = restoreGameMusic }) {
  let round = null, audioGeneration = 0, pictureGeneration = 0, controller = null, picture = null, cancelPicture = null, disposed = false;
  let delivery = 'unavailable', deliveryReceipt = null, pictureDelivery = 'unavailable', pictureReceipt = null;
  let activeVoice = null;
  const feedback = { value: '', delivery: 'unavailable', receipt: null };
  const mixOwner = {}; let mixDucked = false;
  const releaseMix = () => { if (mixDucked) { mixDucked = false; restoreMusic(mixOwner); } };
  const releasePicture = () => {
    pictureGeneration++;
    cancelPicture?.(); cancelPicture = null;
    if (picture) { picture.onload = picture.onerror = null; picture.removeAttribute?.('src'); }
    picture = null;
  };
  function stop() {
    audioGeneration++; controller?.abort(); controller = null;
    activeVoice = null;
    releaseMix();
    if (delivery === 'pending') delivery = 'unavailable';
    if (feedback.delivery === 'pending') feedback.delivery = 'unavailable';
  }
  async function loadPicture(selected) {
    releasePicture(); pictureReceipt = null;
    if (disposed || !selected?.pictures?.length) { pictureDelivery = 'unavailable'; return; }
    const token = pictureGeneration;
    pictureDelivery = 'pending';
    for (const source of selected.pictures) {
      if (disposed || token !== pictureGeneration) return;
      const image = makeImage(); picture = image;
      const decoded = await new Promise(resolve => {
        let settled = false;
        const finish = success => {
          if (settled) return;
          settled = true; clearTimeout(timer); image.onload = image.onerror = null;
          if (cancelPicture === cancel) cancelPicture = null;
          resolve(success);
        };
        const cancel = () => finish(false), timer = setTimeout(cancel, 10000);
        cancelPicture = cancel;
        image.onload = async () => {
          try {
            if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) { finish(false); return; }
            if (image.decode) await image.decode();
            finish(true);
          } catch { finish(false); }
        };
        image.onerror = cancel;
        image.src = source;
      });
      image.onload = image.onerror = null;
      if (disposed || token !== pictureGeneration) { image.removeAttribute?.('src'); return; }
      if (decoded) { pictureDelivery = 'delivered'; pictureReceipt = { source, decodedAt: now() }; return; }
      image.removeAttribute?.('src'); picture = null;
    }
    if (!disposed && token === pictureGeneration) pictureDelivery = 'unavailable';
  }
  const api = {
    setRound(selected) {
      stop(); round = selected; deliveryReceipt = null; delivery = 'unavailable';
      void loadPicture(selected);
    },
    async play() {
      stop(); deliveryReceipt = null;
      if (disposed || !round?.audio || !getSound()) { delivery = 'unavailable'; return; }
      const selected = round, token = audioGeneration;
      controller = new AbortController(); const active = controller;
      const voice = { kind: 'word', value: selected.word, startedAt: null, terminal: false };
      activeVoice = voice;
      delivery = 'pending';
      try {
        await speakWord(selected.word, { signal: active.signal, onStart: () => {
          if (disposed || token !== audioGeneration || active.signal.aborted || voice.terminal || !getSound()) return;
          voice.startedAt ??= now();
          if (!mixDucked) { mixDucked = true; duckMusic(mixOwner); }
        }, onEnd: source => {
          if (disposed || token !== audioGeneration || active.signal.aborted || voice.terminal || source !== selected.audio || !getSound()) return;
          voice.terminal = true;
          delivery = 'delivered'; deliveryReceipt = { source, endedAt: now() };
          releaseMix();
        } });
      } catch { /* Input remains playable when retained audio is unavailable. */ }
      if (!disposed && token === audioGeneration) {
        releaseMix();
        if (delivery === 'pending') delivery = 'unavailable';
        activeVoice = null;
      }
    },
    async playPhoneme(value) {
      stop(); feedback.value = value; feedback.receipt = null; feedback.delivery = 'unavailable';
      const token = audioGeneration;
      const allowed = phonemeAudioCandidates(value).filter(source => AUDIO_QUEST_PATHS.has(source) && !isKnownBadAudioPath(source));
      if (disposed || !getSound()) return false;
      if (!value || !speakPhoneme || !allowed.length) return true;
      const active = new AbortController(); controller = active;
      const voice = { kind: 'phoneme-feedback', value, startedAt: null, terminal: false };
      activeVoice = voice; feedback.delivery = 'pending';
      try {
        await speakPhoneme(value, { signal: active.signal, onStart() {
          if (disposed || token !== audioGeneration || active.signal.aborted || voice.terminal || !getSound()) return;
          voice.startedAt ??= now();
          if (!mixDucked) { mixDucked = true; duckMusic(mixOwner); }
        }, onEnd(source) {
          if (disposed || token !== audioGeneration || active.signal.aborted || voice.terminal || !allowed.includes(source) || !getSound()) return;
          voice.terminal = true;
          feedback.delivery = 'delivered'; feedback.receipt = { source, endedAt: now() };
          releaseMix();
        } });
      } catch { /* Failed sound feedback does not create target-word delivery. */ }
      if (!disposed && token === audioGeneration) {
        releaseMix(); if (feedback.delivery === 'pending') feedback.delivery = 'unavailable';
        activeVoice = null;
      }
      // This is request ownership, never audio delivery. A consumer may queue
      // readback only if another Hear, catch, pause or task has not replaced it.
      return !disposed && token === audioGeneration && getSound();
    },
    stop,
    get picture() { return pictureDelivery === 'delivered' ? picture : null; },
    snapshot: () => ({ roundId: round?.roundId || null, delivery, pictureDelivery,
      deliveryReceipt: deliveryReceipt ? { ...deliveryReceipt } : null,
      pictureReceipt: pictureReceipt ? { ...pictureReceipt } : null, pictureKind: round?.pictureKind || 'word' }),
    feedbackSnapshot: () => ({ sound: feedback.value, delivery: feedback.delivery,
      deliveryReceipt: feedback.receipt ? { ...feedback.receipt } : null }),
    mixSnapshot: () => ({ kind: activeVoice?.kind || null, value: activeVoice?.value || null,
      startedAt: activeVoice?.startedAt ?? null, ducked: mixDucked }),
    dispose() { disposed = true; stop(); releasePicture(); pictureDelivery = 'unavailable'; pictureReceipt = null; }
  };
  return api;
}
