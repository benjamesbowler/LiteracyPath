import { localProgressStorageKey } from "../utils/progressKeys.js";

export const READING_PASSPORT_REFLECTIONS = Object.freeze([
  { id: "laugh", label: "It made me laugh" },
  { id: "learn", label: "I learned something" },
  { id: "again", label: "I want to read it again" },
  { id: "wonder", label: "It made me wonder" }
]);

export function buildReadingPassport({ books = [], records = {} } = {}) {
  const bookById = new Map(books.map(book => [book.id, book]));
  const stamps = Object.entries(records).flatMap(([bookId, record]) => {
    const book = bookById.get(bookId);
    if (!book || !(record?.completed || record?.completedAt)) return [];
    return [{
      bookId,
      title: book.title,
      level: book.level || "",
      type: book.type || "Book",
      completedAt: record.completedAt || record.lastReadAt || record.updatedAt || null,
      buddyTurns: Array.isArray(record.buddyReader?.turns) ? record.buddyReader.turns.length : 0
    }];
  }).sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)));
  const types = new Set(stamps.map(stamp => String(stamp.type).toLowerCase()));
  return {
    schemaVersion: 1,
    stamps,
    discoveries: [
      stamps.length > 0 ? { id: "first-book", label: "First finished book" } : null,
      stamps.length >= 5 ? { id: "five-books", label: "Five finished books" } : null,
      types.size >= 2 ? { id: "two-kinds", label: "Two kinds of book" } : null,
      stamps.some(stamp => stamp.buddyTurns > 0) ? { id: "buddy-reader", label: "Read with Leda" } : null
    ].filter(Boolean),
    competitive: false
  };
}

export function readReadingPassportProgress(scopeKey) {
  if (typeof window === "undefined") return { schemaVersion: 1, reflections: {} };
  try {
    const value = JSON.parse(window.localStorage.getItem(localProgressStorageKey("reading_passport", scopeKey)) || "{}");
    return { schemaVersion: 1, reflections: value.reflections && typeof value.reflections === "object" ? value.reflections : {} };
  } catch {
    return { schemaVersion: 1, reflections: {} };
  }
}

export function savePassportReflection(progress, { bookId, bookTitle = "", reflectionId, at = new Date().toISOString() }) {
  if (!READING_PASSPORT_REFLECTIONS.some(reflection => reflection.id === reflectionId)) {
    throw new Error("Unknown reading reflection.");
  }
  return {
    schemaVersion: 1,
    reflections: {
      ...(progress?.reflections || {}),
      [bookId]: { reflectionId, bookTitle, updatedAt: at, childMediaCollected: false }
    }
  };
}
