export const guidedReadingReadAloudPolicy = {
  teacher_preview: true,
  teacher_assessment_only: true,
  guided_support: true,
  independent_reading_hidden: false,
  independent_reading_allowed: false
};

export function getGuidedReadingPageAudioPath(page = {}) {
  return page.pageAudioPath || page.pageAudio || page.audio || "";
}

export function getGuidedReadingBookAudioPath(book = {}) {
  return book.bookAudioPath || book.fullBookAudio || book.audio?.fullBook || "";
}

export function getGuidedReadingBookSyncPath(book = {}) {
  return book.bookSyncPath || book.fullBookSync || book.syncPath || book.audio?.sync || `/guided-reading/sync/${book.id}.json`;
}

export function getReadAloudMode(book = {}, page = {}) {
  if (getGuidedReadingBookAudioPath(book) || getGuidedReadingPageAudioPath(page)) return "human_audio";
  if ((page.words || []).some(word => word.audioPath)) return "word_sequence";
  return "none";
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
