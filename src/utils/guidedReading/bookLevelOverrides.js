const GUIDED_READING_LEVEL_OVERRIDE_KEY = "lpGuidedReadingLevelOverrides";

export const GUIDED_READING_MOVE_LEVELS = ["A", "B", "C"];

export function readGuidedReadingLevelOverrides() {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(GUIDED_READING_LEVEL_OVERRIDE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function writeGuidedReadingLevelOverrides(overrides = {}) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(GUIDED_READING_LEVEL_OVERRIDE_KEY, JSON.stringify(overrides));
}

export function setGuidedReadingLevelOverride(bookId, level) {
  if (!bookId || !GUIDED_READING_MOVE_LEVELS.includes(level)) return readGuidedReadingLevelOverrides();
  const next = {
    ...readGuidedReadingLevelOverrides(),
    [bookId]: level
  };
  writeGuidedReadingLevelOverrides(next);
  return next;
}

export function applyGuidedReadingLevelOverride(book, overrides = readGuidedReadingLevelOverrides()) {
  const overrideLevel = overrides?.[book?.id];
  if (!GUIDED_READING_MOVE_LEVELS.includes(overrideLevel)) return book;
  return {
    ...book,
    level: overrideLevel,
    guidedReadingLevel: overrideLevel,
    levelOverride: overrideLevel
  };
}
