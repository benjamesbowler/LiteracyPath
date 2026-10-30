import { guidedReadingBookModeLabel } from "../../policy/guidedReadingCatalogPolicy.js";
import { DecodableBookGuide } from "./DecodableBookGuide.jsx";
import { declaredNextStepsLessons } from "../../data/nextStepsPhonicsLessons.js";

// Authored teaching moves use the book's actual words. A leveled book's short
// phonics activity never changes the reading purpose of its whole manuscript.
export function BookReadingGuide({ book }) {
  const guide = book?.foundationsGuide;
  if (!guide) return <DecodableBookGuide book={book} />;
  const decodable = book.readingMode === "decodable";
  const lessons = decodable ? declaredNextStepsLessons(book) : [];
  const taughtWords = decodable
    ? (book.decodableScope?.exceptions || []).map(row => row.word)
    : guide.highFrequencyWords || [];
  const displayWords = taughtWords.map(word => word === "i" ? "I" : word);
  return <details className="guided-book-analysis-detail" data-foundations-guide={book.id}>
    <summary>Reading routine</summary>
    <p><strong>{guidedReadingBookModeLabel(book)}</strong></p>
    {lessons.length > 0 && <div data-blending-prerequisites={book.id}>
      <p>Teach these blending lessons first:</p>
      <ul>{lessons.map(lesson => <li key={lesson.id}><strong>{lesson.title}.</strong> {lesson.model}</li>)}</ul>
    </div>}
    <ol>
      <li><strong>Link the sound and letters.</strong> {guide.soundLetter.model}</li>
      <li><strong>Try the words: {guide.decoding.words.join(", ")}.</strong> {guide.decoding.model}</li>
      <li><strong>Read and reread.</strong> {guide.connectedReading} {guide.fluency}</li>
    </ol>
    {displayWords.length > 0 && <p>Teach these words first: <strong>{displayWords.join(", ")}</strong>.</p>}
    {guide.languagePrep?.length > 0 && <p>Useful meanings: {guide.languagePrep.map(item => `${item.word} — ${item.meaning}`).join("; ")}.</p>}
    <p>{decodable
      ? "Check the listed sounds, words and any blending lessons before independent reading. These prerequisites describe teaching, not this child's mastery."
      : "Use the book's support label and what the child can read today. The word practice above does not make the whole book decodable."}</p>
  </details>;
}
