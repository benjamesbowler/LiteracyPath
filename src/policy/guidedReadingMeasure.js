export const GUIDED_READING_MEASURE_VERSION = "2026.09.02";

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
  C_STANDARD: Object.freeze({
    level: "C",
    templateId: "level-c-standard",
    maxRenderedCharactersPerLine: 52,
    maxLineMeasureCh: 32,
    maxFontSizePx: 28,
    minFontSizePx: 16,
    lineHeight: 1.32,
    imageFraction: 50,
    textFraction: 50,
    stackedImageViewportHeight: 46
  }),
  C_EXTENDED: Object.freeze({
    level: "C",
    templateId: "level-c-extended",
    maxRenderedCharactersPerLine: 52,
    maxLineMeasureCh: 38,
    maxFontSizePx: 26,
    minFontSizePx: 16,
    lineHeight: 1.42,
    imageFraction: 46,
    textFraction: 54,
    stackedImageViewportHeight: 42
  })
});

export const GUIDED_READING_LEVEL_MEASURES = LEVEL_MEASURES;

export function normalizeGuidedReadingLevel(level) {
  const normalized = String(level || "").trim().toUpperCase();
  return ["A", "B", "C"].includes(normalized) ? normalized : "A";
}

export function getGuidedReadingMeasure(level, readingBandProfile = "standard") {
  const normalizedLevel = normalizeGuidedReadingLevel(level);
  if (normalizedLevel === "C") {
    return readingBandProfile === "extended" ? LEVEL_MEASURES.C_EXTENDED : LEVEL_MEASURES.C_STANDARD;
  }
  return LEVEL_MEASURES[normalizedLevel];
}
