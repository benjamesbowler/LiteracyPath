import { guidedReadingBookModeLabel } from "../../policy/guidedReadingCatalogPolicy.js";

export function DecodableBookGuide({ book }) {
  if (book?.readingMode !== "decodable" || !book.decodableScope) return null;
  const scope = book.decodableScope;
  const focus = Array.isArray(scope.focus) ? scope.focus.join(", ") : scope.focus;
  const words = (scope.exceptions || []).map(row => row.word === "i" ? "I" : row.word);
  return <details className="guided-book-analysis-detail" data-decodable-guide={book.id}>
    <summary>Before reading</summary>
    <p><strong>{guidedReadingBookModeLabel(book)}</strong></p>
    <p>Practice: {focus}.</p>
    {words.length > 0 && <p>Teach these words first: <strong>{words.join(", ")}</strong>.</p>}
    <p>Check the sounds and these words, then let the child try the print. Tap a word for help and reread the sentence. Pictures help with meaning.</p>
    <p>The cycle describes what to teach first. It does not measure this child's independent reading.</p>
  </details>;
}
