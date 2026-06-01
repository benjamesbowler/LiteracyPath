const imagePreloadCache = new Map();
const audioPreloadCache = new Map();

const IMAGE_FIELDS = [
  "imageUrl",
  "imagePath",
  "image",
  "targetImage",
  "targetImageUrl",
  "targetImagePath",
  "promptImage",
  "promptImageUrl",
  "promptImagePath",
  "cardImage",
  "cardImageUrl"
];

const AUDIO_FIELDS = [
  "audioUrl",
  "audioPath",
  "audio",
  "targetAudio",
  "targetAudioUrl",
  "targetAudioPath",
  "promptAudio",
  "promptAudioUrl",
  "promptAudioPath",
  "wordAudio",
  "wordAudioUrl",
  "wordAudioPath"
];

const NESTED_COLLECTION_FIELDS = [
  "choices",
  "answerOptions",
  "cards",
  "imageCards",
  "promptImageCards",
  "promptCards",
  "soundTiles",
  "letterTiles",
  "tiles",
  "options"
];

function normalizeSrc(src) {
  if (typeof src !== "string") return "";
  const trimmed = src.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";
  return trimmed;
}

function addSrc(target, src) {
  const normalized = normalizeSrc(src);
  if (normalized) target.add(normalized);
}

function collectMediaFromValue(value, media, depth = 0) {
  if (!value || depth > 4) return;

  if (typeof value === "string") return;

  if (Array.isArray(value)) {
    value.forEach(item => collectMediaFromValue(item, media, depth + 1));
    return;
  }

  if (typeof value !== "object") return;

  IMAGE_FIELDS.forEach(field => addSrc(media.images, value[field]));
  AUDIO_FIELDS.forEach(field => addSrc(media.audio, value[field]));

  if (value.choiceImages && typeof value.choiceImages === "object") {
    Object.values(value.choiceImages).forEach(src => {
      addSrc(media.images, src);
      collectMediaFromValue(src, media, depth + 1);
    });
  }

  if (value.choiceAudio && typeof value.choiceAudio === "object") {
    Object.values(value.choiceAudio).forEach(src => {
      addSrc(media.audio, src);
      collectMediaFromValue(src, media, depth + 1);
    });
  }

  NESTED_COLLECTION_FIELDS.forEach(field => {
    collectMediaFromValue(value[field], media, depth + 1);
  });
}

export function preloadImage(src) {
  const normalized = normalizeSrc(src);
  if (!normalized || typeof Image === "undefined") {
    return Promise.resolve(false);
  }

  if (imagePreloadCache.has(normalized)) {
    return imagePreloadCache.get(normalized);
  }

  const promise = new Promise(resolve => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = normalized;
  });

  imagePreloadCache.set(normalized, promise);
  return promise;
}

export function preloadAudio(src) {
  const normalized = normalizeSrc(src);
  if (!normalized || typeof Audio === "undefined") {
    return Promise.resolve(false);
  }

  if (audioPreloadCache.has(normalized)) {
    return audioPreloadCache.get(normalized);
  }

  const promise = new Promise(resolve => {
    const audio = new Audio();
    let settled = false;
    let timeoutId = null;

    const finish = result => {
      if (settled) return;
      settled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      audio.onloadedmetadata = null;
      audio.oncanplaythrough = null;
      audio.onerror = null;
      resolve(result);
    };

    audio.preload = "auto";
    audio.onloadedmetadata = () => finish(true);
    audio.oncanplaythrough = () => finish(true);
    audio.onerror = () => finish(false);

    if (typeof window !== "undefined") {
      timeoutId = window.setTimeout(() => finish(false), 8000);
    }

    audio.src = normalized;
    try {
      audio.load();
      if (typeof fetch === "function") {
        fetch(normalized, { cache: "force-cache" })
          .then(response => {
            if (response.ok) finish(true);
          })
          .catch(() => {});
      }
    } catch {
      finish(false);
    }
  });

  audioPreloadCache.set(normalized, promise);
  return promise;
}

export function preloadQuestionMedia(question) {
  if (!question) return Promise.resolve([]);

  const media = {
    images: new Set(),
    audio: new Set()
  };

  collectMediaFromValue(question, media);

  const preloadTasks = [
    ...Array.from(media.images).map(preloadImage),
    ...Array.from(media.audio).map(preloadAudio)
  ];

  return Promise.allSettled(preloadTasks);
}

export function preloadQuestionMediaBatch(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return Promise.resolve([]);
  }

  return Promise.allSettled(
    questions
      .filter(Boolean)
      .map(question => preloadQuestionMedia(question))
  );
}
