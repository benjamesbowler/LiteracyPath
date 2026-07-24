export const LEARNER_ACCESSIBILITY_FIELDS = Object.freeze([
  Object.freeze({
    id: "reducedEffects",
    label: "Reduced effects",
    description: "Calms decorative movement, celebrations, and page transitions."
  }),
  Object.freeze({
    id: "extendedResponse",
    label: "Untimed or extended response",
    description: "Removes response countdowns, including timed trail choices."
  }),
  Object.freeze({
    id: "lowerAudioIntensity",
    label: "Lower audio intensity",
    description: "Keeps spoken teaching clear while reducing music and sound-effect volume."
  }),
  Object.freeze({
    id: "narration",
    label: "Narration",
    description: "Reads supported book pages aloud when the learner opens them."
  }),
  Object.freeze({
    id: "simplifiedBackgrounds",
    label: "Simplified backgrounds",
    description: "Removes non-instructional scenery behind learner activities."
  })
]);

export const DEFAULT_LEARNER_ACCESSIBILITY = Object.freeze(
  Object.fromEntries(LEARNER_ACCESSIBILITY_FIELDS.map(field => [field.id, false]))
);

export const LOWER_AUDIO_INTENSITY_SCALE = 0.55;

export function normalizeLearnerAccessibilitySettings(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(
    LEARNER_ACCESSIBILITY_FIELDS.map(field => [field.id, source[field.id] === true])
  );
}

export function learnerAccessibilityFromProfile(profile = {}) {
  return normalizeLearnerAccessibilitySettings(profile?.accessibilitySettings);
}

export function buildLearnerAccessibilityProfilePatch(
  settings,
  { teacherId = "", now = () => new Date().toISOString() } = {}
) {
  return {
    accessibilitySettings: normalizeLearnerAccessibilitySettings(settings),
    accessibilitySettingsAt: now(),
    accessibilitySettingsBy: teacherId || "teacher"
  };
}

export function learnerAccessibilityDataAttributes(settings) {
  const normalized = normalizeLearnerAccessibilitySettings(settings);
  return {
    "data-lp-reduced-effects": normalized.reducedEffects ? "true" : "false",
    "data-lp-extended-response": normalized.extendedResponse ? "true" : "false",
    "data-lp-lower-audio-intensity": normalized.lowerAudioIntensity ? "true" : "false",
    "data-lp-narration": normalized.narration ? "true" : "false",
    "data-lp-simplified-backgrounds": normalized.simplifiedBackgrounds ? "true" : "false"
  };
}

export function applyLearnerAccessibilityToDocument(settings, documentRef = globalThis.document) {
  const root = documentRef?.documentElement;
  if (!root) return () => {};
  const attributes = learnerAccessibilityDataAttributes(settings);
  const previous = Object.fromEntries(
    Object.keys(attributes).map(name => [name, root.getAttribute(name)])
  );
  Object.entries(attributes).forEach(([name, value]) => root.setAttribute(name, value));
  return () => {
    Object.entries(previous).forEach(([name, value]) => {
      if (value === null) root.removeAttribute(name);
      else root.setAttribute(name, value);
    });
  };
}

export function isLowerAudioIntensityActive(documentRef = globalThis.document) {
  return documentRef?.documentElement?.getAttribute("data-lp-lower-audio-intensity") === "true"
    || Boolean(documentRef?.querySelector?.('[data-lp-lower-audio-intensity="true"]'));
}

export function applyLearnerAudioIntensity(volume, documentRef = globalThis.document) {
  const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0));
  return isLowerAudioIntensityActive(documentRef)
    ? safeVolume * LOWER_AUDIO_INTENSITY_SCALE
    : safeVolume;
}
