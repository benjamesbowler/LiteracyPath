import { getApprovedAudioPath } from "../data/audioPreferenceManifest.js";

const LOCAL_MEDIA_ROOTS = [
  "/audio/",
  "/books/",
  "/guided-reading/",
  "/images/",
  "/learn-decks/",
  "/media/"
];

const EXTERNAL_URL_PATTERN = /^(?:https?:)?\/\//i;
const UNSAFE_URL_PATTERN = /^(?:javascript|data):/i;

function pickFirstPath(...values) {
  return values.flat().find(value => typeof value === "string" && value.trim()) || "";
}

export function createMediaFallbackLabel(value = "", fallback = "media") {
  const label = String(value || fallback || "media").trim();
  return label || "media";
}

export function normalizeMediaPath(value = "", { allowExternal = false } = {}) {
  const rawPath = String(value || "").trim();
  if (!rawPath || UNSAFE_URL_PATTERN.test(rawPath)) return "";

  if (EXTERNAL_URL_PATTERN.test(rawPath)) {
    return allowExternal ? rawPath : "";
  }

  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  if (!LOCAL_MEDIA_ROOTS.some(root => path.startsWith(root))) return "";

  return path.replace(/\/{2,}/g, "/");
}

export function hasMediaPath(value = "", options = {}) {
  return Boolean(normalizeMediaPath(value, options));
}

function createResolution({
  src = "",
  label = "",
  fallbackType = "media-unavailable",
  allowExternal = false
} = {}) {
  const normalizedSrc = normalizeMediaPath(src, { allowExternal });
  const safeLabel = createMediaFallbackLabel(label, "media");

  return {
    src: normalizedSrc || null,
    available: Boolean(normalizedSrc),
    label: safeLabel,
    fallbackType: normalizedSrc ? null : fallbackType
  };
}

export function resolveLearnImage(input = "", options = {}) {
  const src = typeof input === "string"
    ? input
    : pickFirstPath(input.image, input.imagePath, input.src);
  const label = options.label || input?.label || input?.word || input?.alt || src;

  return createResolution({
    src,
    label,
    fallbackType: options.fallbackType || "word-tile",
    allowExternal: options.allowExternal
  });
}

export function resolveLearnAudio(input = "", options = {}) {
  const src = typeof input === "string"
    ? input
    : pickFirstPath(input.audio, input.audioPath, input.src);
  const label = options.label || input?.label || input?.word || input?.alt || "audio";

  return createResolution({
    src,
    label,
    fallbackType: options.fallbackType || "audio-unavailable",
    allowExternal: options.allowExternal
  });
}

export function resolveDeckSlideImage(slide = {}, options = {}) {
  return createResolution({
    src: pickFirstPath(slide.image, slide.imagePath, slide.src),
    label: options.label || slide.alt || slide.prompt || slide.id || "deck slide",
    fallbackType: options.fallbackType || "slide-placeholder",
    allowExternal: options.allowExternal
  });
}

export function resolveGuidedReadingImage(input = {}, options = {}) {
  const src = typeof input === "string"
    ? input
    : pickFirstPath(input.image, input.coverImage, input.cover, input.coverUrl, input.src);

  return createResolution({
    src,
    label: options.label || input.alt || input.title || input.text || "guided reading image",
    fallbackType: options.fallbackType || "guided-reading-placeholder",
    allowExternal: options.allowExternal
  });
}

export function resolveGuidedReadingAudio(input = {}, options = {}) {
  const src = typeof input === "string"
    ? input
    : pickFirstPath(input.pageAudio, input.audioPath, input.audio, input.src);

  return createResolution({
    src,
    label: options.label || input.title || input.text || "guided reading audio",
    fallbackType: options.fallbackType || "audio-unavailable",
    allowExternal: options.allowExternal
  });
}

export function resolveAssessmentAudio(input = {}, options = {}) {
  const fallbackPath = typeof input === "string"
    ? input
    : pickFirstPath(input.audioPath, input.audio, input.src);
  const keyOrText = options.keyOrText || input.audioText || input.targetWord || input.answer || input.prompt || "";
  const approvedPath = getApprovedAudioPath(keyOrText, fallbackPath);

  return createResolution({
    src: approvedPath,
    label: options.label || keyOrText || "assessment audio",
    fallbackType: options.fallbackType || "audio-unavailable",
    allowExternal: options.allowExternal
  });
}
