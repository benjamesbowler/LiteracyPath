import { getGuidedReadingPageAudioPath } from "../utils/guidedReading/readAloudPolicy.js";
export {
  READING_SESSION_CONTENT_VERSION,
  endReadingSession,
  getReadingSessionPresence,
  getStudentReadingSession,
  saveReadingMarks,
  setReadingSessionPage,
  startReadingSession
} from "./readingSessionCore.js";

export function readingSessionMediaUrls(book, pageNumbers = []) {
  if (!book) return [];
  const wanted = new Set(pageNumbers);
  return (book.pages || [])
    .filter(page => wanted.has(page.pageNumber))
    .flatMap(page => [
      page.image,
      getGuidedReadingPageAudioPath(page),
      ...(page.words || []).map(word => word.audioPath)
    ])
    .map(value => String(value || ""))
    .filter(Boolean);
}
