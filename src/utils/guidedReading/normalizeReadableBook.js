const fallbackAuthors = [
  "Nora Bell",
  "Milo Reed",
  "Ava Stone",
  "Theo Finch",
  "Lina Moss",
  "Caleb Hart",
  "Ruby Vale",
  "Owen Brooks",
  "Mia Rivers",
  "Leo Wren"
];

const fallbackIllustrators = [
  "Ella Bright",
  "Sam Rowan",
  "Ivy Lane",
  "Max Clover",
  "Nina Fox",
  "Toby Green",
  "Clara Moon",
  "Benji Oak",
  "Zara Field",
  "Finn Blue"
];

function getStableNameIndex(bookId = "", offset = 0) {
  const source = String(bookId || "guided-reading-book");
  const total = [...source].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1 + offset), 0);
  return Math.abs(total);
}

export function getGuidedReadingCredits(book = {}) {
  const author = String(book.author || book.authorName || "").trim();
  const illustrator = String(book.illustrator || book.illustratorName || "").trim();
  const id = book.id || book.title || "guided-reading-book";

  return {
    author: author || fallbackAuthors[getStableNameIndex(id) % fallbackAuthors.length],
    illustrator: illustrator || fallbackIllustrators[getStableNameIndex(id, 7) % fallbackIllustrators.length]
  };
}

function normalizePage(page = {}, index = 0, pageNumberOffset = 0) {
  const originalPageNumber = Number(page.pageNumber || index + 1);

  return {
    ...page,
    pageNumber: originalPageNumber + pageNumberOffset,
    storyPageNumber: page.storyPageNumber || originalPageNumber,
    type: page.type || "story",
    image: page.image || page.imageUrl || page.pageImage || "",
    text: page.text || page.pageText || "",
    audio: page.audio || page.audioUrl || null
  };
}

function buildTitlePage(book = {}, pages = []) {
  if (!pages.length) return null;

  const title = String(book.title || "Untitled Book").trim();
  const { author, illustrator } = getGuidedReadingCredits(book);
  const coverImage = book.coverImage || book.cover || pages[0]?.image || pages[0]?.imageUrl || pages[0]?.pageImage || "";

  return {
    pageNumber: 1,
    storyPageNumber: 0,
    type: "title",
    image: coverImage,
    text: `${title}\nby ${author}\nillustrated by ${illustrator}`,
    audio: null,
    title,
    author,
    illustrator
  };
}

export function normalizeReadableBook(book = {}) {
  const sourcePages = Array.isArray(book.pages) ? book.pages : [];
  const storyPageOffset = sourcePages.length ? 1 : 0;
  const storyPages = sourcePages
    .map((page, index) => normalizePage(page, index, storyPageOffset))
    .filter(page => page.pageNumber && (page.image || page.text));
  const titlePage = buildTitlePage(book, sourcePages);
  const pages = titlePage
    ? [titlePage, ...storyPages]
    : storyPages;
  const credits = getGuidedReadingCredits(book);

  return {
    id: book.id || "",
    title: book.title || "Untitled Book",
    author: credits.author,
    illustrator: credits.illustrator,
    sourceType: book.sourceType || "guided-reading",
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
