const imagePreloadCache = new Map();
const audioMetadataPreloadCache = new Map();

export function normalizeMediaUrl(src = "") {
  if (typeof src !== "string") return "";
  const normalized = src.trim();
  if (!normalized || normalized === "null" || normalized === "undefined") return "";
  return normalized;
}

export function preloadImage(src) {
  const normalized = normalizeMediaUrl(src);
  if (!normalized || typeof Image === "undefined") {
    return Promise.resolve(false);
  }

  if (imagePreloadCache.has(normalized)) {
    return imagePreloadCache.get(normalized);
  }

  const promise = new Promise(resolve => {
    const image = new Image();
    if ("decoding" in image) image.decoding = "async";
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = normalized;
  });

  imagePreloadCache.set(normalized, promise);
  return promise;
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
