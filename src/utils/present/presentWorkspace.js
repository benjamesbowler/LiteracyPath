export function createPresentSessionId() {
  return globalThis.crypto?.randomUUID?.() || `present-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function isPresentSessionMessage(message, sessionId, deckKey) {
  return message?.type === 'lp-present-slide' && message.sessionId === sessionId && message.deckKey === deckKey;
}
export function presentTargetText(target) {
  return typeof target === 'string' ? target : target?.text || target?.label || '';
}
export const PRESENT_OBSERVATION_STATES = ['not sampled', 'independent', 'with support', 'not yet', 'media interrupted'];
export function observationRecommendation(status) {
  return ({ independent: 'Revisit with a fresh example later.', 'with support': 'Model, then sample a fresh response without that support.', 'not yet': 'Reteach the target in a small group and retry.', 'media interrupted': 'Restore the media, then sample again.', 'not sampled': 'Sample a response before drawing a teaching conclusion.' })[status];
}
export function manifestMedia(manifest) {
  const unique = new Map();
  for (const slide of manifest?.slides || []) for (const media of slide.media || []) {
    const entry = typeof media === 'string' ? { src: media, type: /\.(mp3|wav|m4a|ogg)(\?|$)/i.test(media) ? 'audio' : 'image' } : media;
    const src = entry.src || entry.url || entry.path || '';
    const key = src || (entry.required ? `missing:${entry.role || entry.type}:${entry.transcript || slide.id || slide.index}` : '');
    if (key) unique.set(key, { ...entry, src, key });
  }
  return [...unique.values()];
}
export async function checkPresentMedia(entries, { signal, concurrency = 4, timeoutMs = 15000, check } = {}) {
  const results = new Array(entries.length);
  let cursor = 0;
  const inspect = check || (async (entry, entrySignal) => {
    const response = await fetch(entry.src, { signal: entrySignal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (entry.type === 'audio' || /\.(mp3|wav|m4a|ogg)(\?|$)/i.test(entry.src)) {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) throw new Error('Audio decode unavailable');
      const context = new Context();
      try { await context.decodeAudioData(await blob.arrayBuffer()); } finally { await context.close(); }
    } else {
      const url = URL.createObjectURL(blob);
      try { const image = new Image(); image.src = url; await image.decode(); } finally { URL.revokeObjectURL(url); }
    }
  });
  await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, async () => {
    while (cursor < entries.length && !signal?.aborted) {
      const index = cursor++;
      const controller = new AbortController();
      const cancel = () => controller.abort(); signal?.addEventListener('abort', cancel, { once: true });
      let timeout;
      try {
        if (!entries[index].src) throw new Error('Required media has no source; cannot decode. Model live or restore the asset.');
        await Promise.race([inspect(entries[index], controller.signal), new Promise((_, reject) => {
          timeout = setTimeout(() => { controller.abort(); reject(new Error('Media check timed out; retry or model live')); }, timeoutMs);
        })]);
        results[index] = { ...entries[index], status: 'decoded' };
      } catch (error) { results[index] = { ...entries[index], status: 'unavailable', error: error.message }; }
      finally { clearTimeout(timeout); signal?.removeEventListener('abort', cancel); }
    }
  }));
  return results.filter(Boolean);
}
