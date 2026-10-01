// Literal text statistics, not a reading ability assessment or Lexile model.
export const BOOK_TEXT_METRIC_VERSION = "1";

export function getAnalysisPages(book = {}) {
  return (book.pages || []).filter(page => page.active !== false && (!page.qaStatus || page.qaStatus === "approved"));
}

export function serializeBookReadingText(book = {}) {
  return JSON.stringify({
    id: book.id || "",
    title: book.title || "",
    pages: getAnalysisPages(book).map((page, index) => ({
      pageNumber: page.pageNumber || index + 1,
      text: String(page.text || "")
    }))
  });
}

// Synchronous browser-compatible change detector. It is not used for security.
// The generator also records a SHA-256 hash for external measurement receipts.
export function fingerprintBookReadingText(book) {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(serializeBookReadingText(book))) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

export function tokenizeReadingText(text = "") {
  return String(text).match(/\p{L}+(?:['’]\p{L}+)*(?:-\p{L}+(?:['’]\p{L}+)*)*|\d+(?:[.,]\d+)*/gu) || [];
}

export function getSentenceUnits(text = "") {
  // Protect familiar honorifics and decimal points before splitting. A final
  // unpunctuated fragment and a punctuated sound effect each count as one unit.
  const protectedText = String(text)
    .replace(/\b(Mr|Mrs|Ms|Dr|St|Jr|Sr)\./g, "$1\uE000")
    .replace(/(\d)\.(?=\d)/g, "$1\uE000");
  return (protectedText.match(/[^.!?]+(?:[.!?]+["”’']*|$)/g) || [])
    .map(unit => unit.replace(/\uE000/g, ".").trim())
    .filter(unit => tokenizeReadingText(unit).length > 0);
}

const round = number => Math.round(number * 100) / 100;
const mean = values => values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

export function computeBookTextMetrics(book = {}) {
  const pages = getAnalysisPages(book);
  const wordsByPage = pages.map(page => tokenizeReadingText(page.text));
  const words = wordsByPage.flat();
  const normalizedWords = words.map(word => word.toLowerCase().replace(/’/g, "'"));
  const uniqueWords = [...new Set(normalizedWords)].sort();
  const sentences = pages.flatMap(page => getSentenceUnits(page.text));
  const sentenceLengths = sentences.map(sentence => tokenizeReadingText(sentence).length);
  const wordCounts = wordsByPage.map(pageWords => pageWords.length);
  const normalizedSentences = sentences.map(sentence => tokenizeReadingText(sentence).join(" ").toLowerCase());
  const pageOpenings = wordsByPage.filter(pageWords => pageWords.length).map(pageWords => pageWords.slice(0, 2).join(" ").toLowerCase());
  const openingCounts = pageOpenings.reduce((counts, opening) => ({ ...counts, [opening]: (counts[opening] || 0) + 1 }), {});
  return {
    metricVersion: BOOK_TEXT_METRIC_VERSION,
    pageCount: pages.length,
    wordCount: words.length,
    uniqueWordCount: uniqueWords.length,
    uniqueWordRatio: words.length ? round(uniqueWords.length / words.length) : 0,
    averageWordLength: mean(words.map(word => [...word.replace(/['’-]/g, "")].length)),
    averageWordsPerPage: mean(wordCounts),
    minWordsPerPage: wordCounts.length ? Math.min(...wordCounts) : 0,
    maxWordsPerPage: wordCounts.length ? Math.max(...wordCounts) : 0,
    sentenceUnitCount: sentences.length,
    averageWordsPerSentence: mean(sentenceLengths),
    maxWordsPerSentence: sentenceLengths.length ? Math.max(...sentenceLengths) : 0,
    repeatedSentenceUnitCount: normalizedSentences.length - new Set(normalizedSentences).size,
    dominantTwoWordPageOpeningRatio: pageOpenings.length ? round(Math.max(...Object.values(openingCounts)) / pageOpenings.length) : 0,
    dialoguePageCount: pages.filter(page => /[“”"]/.test(page.text)).length,
    questionPageCount: pages.filter(page => /\?/.test(page.text)).length,
    illustratedPageCount: pages.filter(page => page.image || page.imageUrl || page.pageImage).length,
    independentlyDescribedPageCount: pages.filter(page => !page.metadataGeneratedFromReadingText && (page.imageAlt || page.pageDescription || page.illustrationPrompt)).length
  };
}
