const imagePreloadCache = new Map();
const audioPreloadCache = new Map();

export const PRELOAD_IMAGE_FIELDS = [
  "imageUrl",
  "imagePath",
  "image",
  "imageSrc",
  "picture",
  "pictureUrl",
  "picturePath",
  "targetImage",
  "targetImageUrl",
  "targetImagePath",
  "promptImage",
  "promptImageUrl",
  "promptImagePath",
  "choiceImage",
  "choiceImageUrl",
  "choiceImagePath",
  "answerImage",
  "answerImageUrl",
  "answerImagePath",
  "optionImage",
  "optionImageUrl",
  "optionImagePath",
  "cardImage",
  "cardImageUrl",
  "cardImagePath"
];

export const PRELOAD_AUDIO_FIELDS = [
  "audioUrl",
  "audioPath",
  "audio",
  "audioSrc",
  "targetAudio",
  "targetAudioUrl",
  "targetAudioPath",
  "promptAudio",
  "promptAudioUrl",
  "promptAudioPath",
  "choiceAudioUrl",
  "choiceAudioPath",
  "answerAudio",
  "answerAudioUrl",
  "answerAudioPath",
  "optionAudio",
  "optionAudioUrl",
  "optionAudioPath",
  "cardAudio",
  "cardAudioUrl",
  "cardAudioPath",
  "wordAudio",
  "wordAudioUrl",
  "wordAudioPath"
];

export const PRELOAD_NESTED_COLLECTION_FIELDS = [
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

function isPreloadDebugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem("lpDebugPreload") === "1";
  } catch {
    return false;
  }
}

function debugPreload(label, payload = {}) {
  if (!isPreloadDebugEnabled()) return;
  console.debug(`[lp-preload] ${label}`, payload);
}

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

  PRELOAD_IMAGE_FIELDS.forEach(field => addSrc(media.images, value[field]));
  PRELOAD_AUDIO_FIELDS.forEach(field => addSrc(media.audio, value[field]));

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

  PRELOAD_NESTED_COLLECTION_FIELDS.forEach(field => {
    collectMediaFromValue(value[field], media, depth + 1);
  });
}

export function collectQuestionMedia(question) {
  const media = {
    images: new Set(),
    audio: new Set()
  };

  collectMediaFromValue(question, media);

  return {
    images: Array.from(media.images),
    audio: Array.from(media.audio)
  };
}

export function preloadImage(src) {
  const normalized = normalizeSrc(src);
  if (!normalized || typeof Image === "undefined") {
    debugPreload("image skipped", { src: normalized || src, reason: "Image API unavailable or empty src" });
    return Promise.resolve(false);
  }

  if (imagePreloadCache.has(normalized)) {
    debugPreload("image cache hit", { src: normalized });
    return imagePreloadCache.get(normalized);
  }

  const promise = new Promise(resolve => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      debugPreload("image loaded", {
        src: normalized,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      });
      resolve(true);
    };
    image.onerror = () => {
      debugPreload("image failed", { src: normalized });
      resolve(false);
    };
    image.src = normalized;
  });

  imagePreloadCache.set(normalized, promise);
  return promise;
}

export function preloadAudio(src) {
  const normalized = normalizeSrc(src);
  if (!normalized || typeof Audio === "undefined") {
    debugPreload("audio skipped", { src: normalized || src, reason: "Audio API unavailable or empty src" });
    return Promise.resolve(false);
  }

  if (audioPreloadCache.has(normalized)) {
    debugPreload("audio cache hit", { src: normalized });
    return audioPreloadCache.get(normalized);
  }

  const promise = new Promise(resolve => {
    let settled = false;
    let timeoutId = null;

    const finish = result => {
      if (settled) return;
      settled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      debugPreload("audio settled", { src: normalized, result });
      resolve(result);
    };

    if (typeof window !== "undefined") {
      timeoutId = window.setTimeout(() => finish(false), 8000);
    }

    // Prefer a single fetch to warm the HTTP cache: the <audio> element created
    // at playback then reads from cache. Using BOTH a detached audio.load() and
    // fetch double-downloaded every clip on iOS Safari (the media stack's range
    // requests don't share the fetch download), which — with the media tree's
    // caching — meant paying twice on a cold cache.
    if (typeof fetch === "function") {
      debugPreload("audio fetch hint", { src: normalized, cache: "force-cache" });
      fetch(normalized, { cache: "force-cache" })
        .then(response => {
          debugPreload("audio fetch result", { src: normalized, ok: response.ok, status: response.status });
          finish(response.ok);
        })
        .catch(error => {
          debugPreload("audio fetch failed", { src: normalized, message: error?.message || String(error) });
          finish(false);
        });
      return;
    }

    // Fallback for environments without fetch: the media element preload.
    const audio = new Audio();
    const clearHandlers = () => {
      audio.onloadedmetadata = null;
      audio.oncanplaythrough = null;
      audio.onerror = null;
    };
    audio.preload = "auto";
    audio.onloadedmetadata = () => { clearHandlers(); finish(true); };
    audio.oncanplaythrough = () => { clearHandlers(); finish(true); };
    audio.onerror = () => { clearHandlers(); finish(false); };
    audio.src = normalized;
    try {
      audio.load();
    } catch {
      debugPreload("audio load failed", { src: normalized });
      clearHandlers();
      finish(false);
    }
  });

  audioPreloadCache.set(normalized, promise);
  return promise;
}

export function preloadQuestionMedia(question, options = {}) {
  if (!question) return Promise.resolve([]);

  const media = collectQuestionMedia(question);
  const questionId = question.id || question.questionId || "(unknown)";

  debugPreload("question media requested", {
    role: options.role || "question",
    source: options.source || "",
    windowIndex: options.windowIndex ?? null,
    questionId,
    skillId: question.skillId || question.assessmentSkillId || "",
    images: media.images,
    audio: media.audio
  });

  const preloadTasks = [
    ...media.images.map(src => ({ type: "image", src, task: preloadImage(src) })),
    ...media.audio.map(src => ({ type: "audio", src, task: preloadAudio(src) }))
  ];

  return Promise.allSettled(preloadTasks.map(item => item.task)).then(results => {
    debugPreload("question media settled", {
      role: options.role || "question",
      source: options.source || "",
      windowIndex: options.windowIndex ?? null,
      questionId,
      results: results.map((result, index) => ({
        type: preloadTasks[index]?.type,
        src: preloadTasks[index]?.src,
        status: result.status,
        value: result.status === "fulfilled" ? result.value : undefined,
        reason: result.status === "rejected" ? String(result.reason) : undefined
      }))
    });
    return results;
  });
}

export function preloadQuestionMediaBatch(questions, options = {}) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return Promise.resolve([]);
  }

  const windowQuestions = questions.filter(Boolean);
  debugPreload("question window requested", {
    role: options.role || "question-window",
    source: options.source || "",
    questions: windowQuestions.map((question, index) => ({
      windowIndex: index,
      questionId: question.id || question.questionId || "(unknown)",
      skillId: question.skillId || question.assessmentSkillId || ""
    }))
  });

  return Promise.allSettled(
    windowQuestions
      .map((question, index) => preloadQuestionMedia(question, {
        ...options,
        role: index === 0 ? "current" : `next-${index}`,
        windowIndex: index
      }))
  );
}
