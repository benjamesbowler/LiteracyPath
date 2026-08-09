import { READING_PASSPORT_REFLECTIONS } from "../../policy/readingPassportPolicy.js";

export function ReadingPassportEvidencePanel({ reflections = {} }) {
  const rows = Object.entries(reflections).map(([bookId, reflection]) => ({
    bookId,
    ...reflection,
    label: READING_PASSPORT_REFLECTIONS.find(option => option.id === reflection.reflectionId)?.label || "Reflection unavailable"
  })).sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  return <section className="reading-passport-evidence"><h3>Reading Passport reflections</h3><p>Student-selected responses after finishing a book. No voice or image was collected.</p>{rows.length === 0 ? <p>No passport reflection yet.</p> : <ul>{rows.slice(0, 5).map(row => <li key={row.bookId}><strong>{row.bookTitle || "Finished book"}</strong><span>{row.label}</span><small>{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "Date unavailable"}</small></li>)}</ul>}</section>;
}
