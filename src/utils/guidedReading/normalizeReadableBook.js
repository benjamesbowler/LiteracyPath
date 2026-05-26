function normalizePage(page = {}, index = 0) {
  return {
    pageNumber: Number(page.pageNumber || index + 1),
    image: page.image || page.imageUrl || page.pageImage || "",
    text: page.text || page.pageText || "",
    audio: page.audio || page.audioUrl || null
  };
}

export function normalizeReadableBook(book = {}) {
  const pages = Array.isArray(book.pages)
    ? book.pages.map(normalizePage).filter(page => page.pageNumber && (page.image || page.text))
    : [];

  return {
    id: book.id || "",
    title: book.title || "Untitled Book",
    author: book.author || "",
    sourceType: book.sourceType || (book.publicDomain ? "public-domain" : "guided-reading"),
    level: book.level || book.guidedReadingLevel || book.gradeBand || "",
    category: book.category || book.type || book.readingType || "",
    gradeBand: book.gradeBand || "",
    difficulty: book.difficulty || book.readingLevel || "",
    sourceUrl: book.sourceUrl || book.source || book.downloadPageUrl || "",
    coverImage: book.coverImage || book.cover || "",
    pages,
    validForReader: pages.length > 0,
    missingFields: [
      !book.id && "id",
      !book.title && "title",
      pages.length === 0 && "pages"
    ].filter(Boolean)
  };
}

export function getReadableBookStatus(book = {}) {
  const normalized = normalizeReadableBook(book);
  if (!normalized.id) return "missing_id";
  if (!normalized.pages.length) return "missing_pages";
  if (normalized.pages.some(page => !page.image)) return "missing_page_image";
  return "readable";
}
