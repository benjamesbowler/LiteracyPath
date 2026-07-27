export const GUIDED_READING_MEASURE_VERSION = "2026.07.24";

const LEVEL_MEASURES = Object.freeze({
  A: Object.freeze({
    level: "A",
    templateId: "level-a",
    maxRenderedCharactersPerLine: 28,
    maxLineMeasureCh: 18,
    maxFontSizePx: 32,
    minFontSizePx: 18,
    lineHeight: 1.42,
    imageFraction: 62,
    textFraction: 38,
    stackedImageViewportHeight: 58
  }),
  B: Object.freeze({
    level: "B",
    templateId: "level-b",
    maxRenderedCharactersPerLine: 38,
    maxLineMeasureCh: 24,
    maxFontSizePx: 30,
    minFontSizePx: 17,
    lineHeight: 1.36,
    imageFraction: 56,
    textFraction: 44,
    stackedImageViewportHeight: 52
  }),
  C: Object.freeze({
    level: "C",
    templateId: "level-c",
    maxRenderedCharactersPerLine: 52,
    maxLineMeasureCh: 32,
    maxFontSizePx: 28,
    minFontSizePx: 16,
    lineHeight: 1.32,
    imageFraction: 50,
    textFraction: 50,
    stackedImageViewportHeight: 46
  })
});

export const GUIDED_READING_LEVEL_MEASURES = LEVEL_MEASURES;

export function normalizeGuidedReadingLevel(level) {
  const normalized = String(level || "").trim().toUpperCase();
  return Object.hasOwn(LEVEL_MEASURES, normalized) ? normalized : "A";
}

export function getGuidedReadingMeasure(level) {
  return LEVEL_MEASURES[normalizeGuidedReadingLevel(level)];
}

