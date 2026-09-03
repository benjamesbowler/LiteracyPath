import { getGuidedReadingBookMetadata } from "../data/guidedReadingBookMetadata.js";

const BAND_LABELS = Object.freeze({
  standard: "C Standard",
  extended: "C Extended / Read Together"
});

const MODE_LABELS = Object.freeze({
  decodable: "Decodable",
  "predictable-levelled": "Predictable / Levelled",
  "supported-read-together": "Supported Read-Together"
});

const CHILD_MODE_COPY = Object.freeze({
  decodable: "Sound out",
  "predictable-levelled": "Pattern",
  "supported-read-together": "Together"
});

export function guidedReadingBandLabel(profile, level = "") {
  const normalizedLevel = String(level).trim().toUpperCase();
  if (profile === "extended") {
    return normalizedLevel === "C"
      ? BAND_LABELS.extended
      : `Level ${normalizedLevel || "?"} · Extended / Read Together`;
  }
  if (normalizedLevel === "C") return BAND_LABELS.standard;
  return `Level ${normalizedLevel || "?"}`;
}

export function guidedReadingModeLabel(mode) {
  return MODE_LABELS[mode] || "";
}

export function childGuidedReadingModeLabel(bookOrMetadata = {}) {
  const metadata = bookOrMetadata?.readingMode
    ? bookOrMetadata
    : getGuidedReadingBookMetadata(bookOrMetadata);
  return CHILD_MODE_COPY[metadata?.readingMode] || "";
}

export function splitLevelCBooks(books = []) {
  const levelC = books.filter(book => book.level === "C");
  return {
    standard: levelC.filter(book => book.readingBandProfile === "standard"),
    extended: levelC.filter(book => book.readingBandProfile === "extended")
  };
}

export function isStandardBandBook(book = {}) {
  return book.readingBandProfile === "standard";
}
