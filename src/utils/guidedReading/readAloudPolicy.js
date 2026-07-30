import {
  getLedaProductionAudioPath,
  getLedaWordAudioPath,
  isLedaProductionAudioPath,
  normalizeLedaAudioText
} from "../../data/ledaProductionAudio.js";
import { GUIDED_READING_LEDA_GAPS } from "../../data/generated/guidedReadingLedaGaps.generated.js";
import { GUIDED_READING_NARRATION_PROVENANCE } from "../../data/generated/guidedReadingNarrationProvenance.generated.js";

export const guidedReadingReadAloudPolicy = {
  teacher_preview: true,
  teacher_assessment_only: true,
  guided_support: true,
  independent_reading_hidden: false,
  independent_reading_allowed: false
};

function readablePageText(page = {}) {
  return Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
}

function readableWordText(value = "") {
  return String(value || "")
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9%]+$/g, "")
    .trim();
}

export function getGuidedReadingPageAudioPath(page = {}) {
  const pageText = readablePageText(page);
  const normalizedPageText = normalizeLedaAudioText(pageText);
  const currentLedaAudio = GUIDED_READING_NARRATION_PROVENANCE.exactPageAudioByText?.[pageText]
    || GUIDED_READING_LEDA_GAPS.guided_page?.[normalizedPageText]
    || getLedaProductionAudioPath(pageText, ["supplemental", "guided_page"]);
  if (currentLedaAudio) return currentLedaAudio;
  if (page.narrationNeedsRebuild) return "";
  return page.pageAudioPath
    || page.pageAudio
    || page.audio
    || "";
}

export function getGuidedReadingBookAudioPath(book = {}) {
  if ((book.pages || []).some(page => page.narrationNeedsRebuild)) return "";
  const audioPath = book.bookAudioPath || book.fullBookAudio || book.audio?.fullBook || "";

  // Removed legacy whole-book narration must not hide the replacement
  // page-by-page Leda narration.
  return isLedaProductionAudioPath(audioPath) ? audioPath : "";
}

export function getGuidedReadingBookSyncPath(book = {}) {
  return book.bookSyncPath || book.fullBookSync || book.syncPath || book.audio?.sync || `/guided-reading/sync/${book.id}.json`;
}

export function getReadAloudMode(book = {}, page = {}) {
  if (getGuidedReadingBookAudioPath(book) || getGuidedReadingPageAudioPath(page)) return "human_audio";
  if ((page.words || []).some(word => getGuidedReadingWordProductionAudioPath(word))) {
    return "word_sequence";
  }
  return "none";
}

export function getGuidedReadingWordProductionAudioPath(word = {}) {
  const rawText = String(word?.text || word || "");
  const readableText = readableWordText(rawText);
  return GUIDED_READING_LEDA_GAPS.isolated_word?.[normalizeLedaAudioText(rawText)]
    || getLedaWordAudioPath(rawText)
    || GUIDED_READING_LEDA_GAPS.isolated_word?.[normalizeLedaAudioText(readableText)]
    || getLedaWordAudioPath(readableText);
}

export function getGuidedReadingReadAloudState(book = {}, page = {}, context = "guided_support") {
  const enabledByContext = Boolean(guidedReadingReadAloudPolicy[context]);
  const pageAudioPath = getGuidedReadingPageAudioPath(page);
  const bookAudioPath = getGuidedReadingBookAudioPath(book);
  const mode = getReadAloudMode(book, page);

  return {
    context,
    enabledByContext,
    pageAudioPath,
    bookAudioPath,
    readAloudAvailable: enabledByContext && mode !== "none",
    readAloudMode: enabledByContext ? mode : "none",
    message: enabledByContext
      ? mode === "none"
        ? "Read-aloud audio is not available for this book yet."
        : ""
      : "Read-aloud is hidden for this reading mode."
  };
}
