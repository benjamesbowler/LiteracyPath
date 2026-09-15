const imagePreloadCache = new Map();
const audioMetadataPreloadCache = new Map();
// Keep a short decoded picture window, not every activity from a long session.
const MAX_WARMED_IMAGES = 48;

function trimImages() {
  for (const [src, entry] of imagePreloadCache) {
    if (imagePreloadCache.size <= MAX_WARMED_IMAGES) break;
    if (!entry.settled) continue;
    imagePreloadCache.delete(src);
    entry.image.src = "";
  }
}

export function normalizeMediaUrl(src = "") {
  if (typeof src !== "string") return "";
  const normalized = src.trim();
  if (!normalized || normalized === "null" || normalized === "undefined") return "";
  return normalized;
}

export function preloadImage(src, { timeoutMs = 8000, priority = "auto" } = {}) {
  const normalized = normalizeMediaUrl(src);
  if (!normalized || typeof Image === "undefined") {
    return Promise.resolve(false);
  }

  if (imagePreloadCache.has(normalized)) {
    const entry = imagePreloadCache.get(normalized);
    imagePreloadCache.delete(normalized);
    imagePreloadCache.set(normalized, entry);
    if (priority === "high") entry.image.fetchPriority = "high";
    return entry.promise;
  }

  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = priority;
  const entry = { image, settled: false, promise: null };
  imagePreloadCache.set(normalized, entry);
  entry.promise = new Promise(resolve => {
    let timer;
    const finish = ok => {
      if (entry.settled) return;
      entry.settled = true;
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      if (!ok) {
        if (imagePreloadCache.get(normalized) === entry) imagePreloadCache.delete(normalized);
        image.src = "";
      }
      resolve(ok);
      trimImages();
    };
    image.onload = () => {
      // Decode ahead of the next tap; keep the loaded image usable on browsers
      // that reject decode() after a successful onload.
      if (typeof image.decode === "function") {
        Promise.resolve().then(() => image.decode()).then(() => finish(true), () => finish(true));
      } else finish(true);
    };
    image.onerror = () => finish(false);
    timer = setTimeout(() => finish(false), timeoutMs);
    try { image.src = normalized; } catch { finish(false); }
  });
  trimImages();
  return entry.promise;
}

export function preloadAudioMetadata(src) {
  const normalized = normalizeMediaUrl(src);
  if (!normalized || typeof Audio === "undefined") {
    return Promise.resolve(false);
  }

  if (audioMetadataPreloadCache.has(normalized)) {
    return audioMetadataPreloadCache.get(normalized);
  }

  const promise = new Promise(resolve => {
    const audio = new Audio();
    let settled = false;
    let timeoutId = null;

    const finish = result => {
      if (settled) return;
      settled = true;
      if (timeoutId && typeof window !== "undefined") window.clearTimeout(timeoutId);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.src = "";
      resolve(result);
    };

    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(true);
    audio.onerror = () => finish(false);
    if (typeof window !== "undefined") {
      timeoutId = window.setTimeout(() => finish(false), 8000);
    }
    audio.src = normalized;

    try {
      audio.load();
    } catch {
      finish(false);
    }
  });

  audioMetadataPreloadCache.set(normalized, promise);
  return promise;
}

export function preloadMediaSet({ images = [], audio = [] } = {}) {
  const imageUrls = Array.from(new Set(images.map(normalizeMediaUrl).filter(Boolean)));
  const audioUrls = Array.from(new Set(audio.map(normalizeMediaUrl).filter(Boolean)));

  const tasks = [
    ...imageUrls.map(preloadImage),
    ...audioUrls.map(preloadAudioMetadata)
  ];

  if (!tasks.length) return Promise.resolve([]);
  return Promise.allSettled(tasks);
}
