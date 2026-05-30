#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");
const inventoryPath = path.join(repoRoot, "docs/guided-reading/guided_reading_word_audio_inventory.md");
const inventoryJsonPath = path.join(repoRoot, "docs/guided-reading/guided_reading_word_audio_inventory.json");
const kimiRequestPath = path.join(repoRoot, "docs/assets/kimi_guided_reading_missing_word_audio_request.md");
const summaryJsonPath = path.join(repoRoot, "src/content/guidedReading/wordAudioCoverageSummary.generated.json");

const AUDIO_ROOTS = [
  "/audio/child-mode/clean-human/words",
  "/audio/child-mode/clean-human/hfw",
  "/audio/child-mode/words",
  "/audio/child-mode/hfw",
  "/guided-reading/audio/words"
];

function ensureDir(filePath) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeWord(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[“”"]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}

function audioSlug(value = "") {
  return normalizeWord(value)
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tokenize(text = "") {
  return String(text).match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)?/g) || [];
}

function publicPathExists(publicPath = "") {
  if (!publicPath || /^https?:\/\//i.test(publicPath)) return false;
  const clean = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  return existsSync(path.join(publicRoot, clean));
}

function candidateAudioPaths(word) {
  const slug = audioSlug(word);
  if (!slug) return [];
  return AUDIO_ROOTS.map(root => `${root}/${slug}.mp3`);
}

function resolveAudio(word, explicitPath = "") {
  const candidates = [
    explicitPath,
    ...candidateAudioPaths(word)
  ].filter(Boolean);
  const singleWordCandidates = candidates.filter(candidate =>
    candidate.includes("/words/") ||
    candidate.includes("/hfw/")
  );
  const found = singleWordCandidates.find(publicPathExists) || "";
  return {
    found,
    expected: candidateAudioPaths(word)[0] || "",
    candidates: [...new Set(singleWordCandidates)]
  };
}

function collectActiveBooks() {
  return guidedReadingBooks.filter(book => book.active !== false);
}

function markdownTable(rows, columns) {
  if (!rows.length) return "_None._";
  const header = `| ${columns.map(column => column.label).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map(row => `| ${columns.map(column => String(column.value(row) ?? "").replace(/\n/g, " ").replace(/\|/g, "\\|")).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function buildInventory() {
  const activeBooks = collectActiveBooks();
  const wordMap = new Map();
  const invalidWordAudioPaths = [];
  let pageCount = 0;

  activeBooks.forEach(book => {
    (book.pages || []).filter(page => page.active !== false).forEach((page, pageIndex) => {
      pageCount += 1;
      const pageWords = Array.isArray(page.words) && page.words.length
        ? page.words.map(item => item?.text).filter(Boolean)
        : tokenize(page.text);
      pageWords.forEach((displayWord, wordIndex) => {
        const normalized = normalizeWord(displayWord);
        if (!normalized) return;
        const existing = wordMap.get(normalized) || {
          normalizedWord: normalized,
          displayVariants: new Set(),
          occurrenceCount: 0,
          uses: [],
          explicitAudioPaths: new Set()
        };
        const explicitAudioPath = page.words?.[wordIndex]?.audioPath || "";
        if (explicitAudioPath && !explicitAudioPath.includes("/words/") && !explicitAudioPath.includes("/hfw/")) {
          invalidWordAudioPaths.push({
            bookId: book.id,
            title: book.title,
            pageNumber: page.pageNumber || pageIndex + 1,
            word: normalized,
            audioPath: explicitAudioPath
          });
        }
        existing.displayVariants.add(displayWord);
        existing.occurrenceCount += 1;
        if (explicitAudioPath) existing.explicitAudioPaths.add(explicitAudioPath);
        existing.uses.push({
          bookId: book.id,
          title: book.title,
          level: book.level,
          type: book.type,
          pageNumber: page.pageNumber || pageIndex + 1,
          pageText: page.text || "",
          displayWord
        });
        wordMap.set(normalized, existing);
      });
    });
  });

  const words = [...wordMap.values()].map(row => {
    const resolved = resolveAudio(row.normalizedWord, [...row.explicitAudioPaths][0] || "");
    return {
      normalizedWord: row.normalizedWord,
      displayVariants: [...row.displayVariants].sort(),
      occurrenceCount: row.occurrenceCount,
      booksAffected: [...new Set(row.uses.map(use => use.bookId))].length,
      uses: row.uses,
      explicitAudioPaths: [...row.explicitAudioPaths].sort(),
      expectedAudioPath: resolved.expected,
      resolvedAudioPath: resolved.found,
      candidateAudioPaths: resolved.candidates,
      status: resolved.found ? "HAS_AUDIO" : "MISSING_AUDIO"
    };
  }).sort((a, b) => {
    if (a.status !== b.status) return a.status === "MISSING_AUDIO" ? -1 : 1;
    return b.occurrenceCount - a.occurrenceCount || a.normalizedWord.localeCompare(b.normalizedWord);
  });

  const missing = words.filter(row => row.status === "MISSING_AUDIO");
  const booksWithMissing = new Map();
  missing.forEach(row => {
    row.uses.forEach(use => {
      const previous = booksWithMissing.get(use.bookId) || {
        bookId: use.bookId,
        title: use.title,
        level: use.level,
        type: use.type,
        missingWords: new Set(),
        missingOccurrences: 0
      };
      previous.missingWords.add(row.normalizedWord);
      previous.missingOccurrences += 1;
      booksWithMissing.set(use.bookId, previous);
    });
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    activeBooksScanned: activeBooks.length,
    totalPagesScanned: pageCount,
    totalUniqueWords: words.length,
    uniqueWordsWithAudio: words.length - missing.length,
    uniqueWordsMissingAudio: missing.length,
    totalMissingWordOccurrences: missing.reduce((sum, row) => sum + row.occurrenceCount, 0),
    booksWithMissingWordAudio: booksWithMissing.size,
    invalidWordAudioPathCount: invalidWordAudioPaths.length,
    audioRoots: AUDIO_ROOTS
  };

  return {
    summary,
    words,
    missing,
    invalidWordAudioPaths,
    worstAffectedBooks: [...booksWithMissing.values()]
      .map(row => ({
        ...row,
        missingWordCount: row.missingWords.size,
        missingWords: [...row.missingWords].sort()
      }))
      .sort((a, b) => b.missingOccurrences - a.missingOccurrences || b.missingWordCount - a.missingWordCount)
  };
}

function writeInventory({ summary, words, missing, invalidWordAudioPaths, worstAffectedBooks }) {
  ensureDir(inventoryPath);
  const lines = [
    "# Guided Reading Word Audio Inventory",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "This inventory scans active Guided Reading page text and checks single-word clickable audio only. Page narration and whole-book narration do not count as word audio.",
    "",
    "## Summary",
    "",
    markdownTable([summary], [
      { label: "Active books", value: row => row.activeBooksScanned },
      { label: "Pages", value: row => row.totalPagesScanned },
      { label: "Unique words", value: row => row.totalUniqueWords },
      { label: "Unique with audio", value: row => row.uniqueWordsWithAudio },
      { label: "Unique missing audio", value: row => row.uniqueWordsMissingAudio },
      { label: "Missing occurrences", value: row => row.totalMissingWordOccurrences },
      { label: "Books affected", value: row => row.booksWithMissingWordAudio },
      { label: "Invalid explicit word audio paths", value: row => row.invalidWordAudioPathCount }
    ]),
    "",
    "## Audio Roots Checked",
    "",
    ...summary.audioRoots.map(root => `- ${root}/{word}.mp3`),
    "",
    "## Worst Affected Books",
    "",
    markdownTable(worstAffectedBooks.slice(0, 60), [
      { label: "Book ID", value: row => row.bookId },
      { label: "Title", value: row => row.title },
      { label: "Level", value: row => row.level },
      { label: "Missing unique", value: row => row.missingWordCount },
      { label: "Missing occurrences", value: row => row.missingOccurrences },
      { label: "Missing words", value: row => row.missingWords.slice(0, 18).join(", ") }
    ]),
    "",
    "## Missing Word Audio",
    "",
    markdownTable(missing, [
      { label: "Word", value: row => row.normalizedWord },
      { label: "Variants", value: row => row.displayVariants.join(", ") },
      { label: "Occurrences", value: row => row.occurrenceCount },
      { label: "Books", value: row => row.booksAffected },
      { label: "Expected path", value: row => row.expectedAudioPath },
      { label: "Used in", value: row => row.uses.slice(0, 8).map(use => `${use.bookId} p${use.pageNumber}`).join(", ") }
    ]),
    "",
    "## Invalid Explicit Word Audio Paths",
    "",
    "These are clickable word entries that point outside approved single-word audio roots. Page narration, whole-book narration, and phrase audio are not valid word-click audio.",
    "",
    markdownTable(invalidWordAudioPaths, [
      { label: "Book ID", value: row => row.bookId },
      { label: "Title", value: row => row.title },
      { label: "Page", value: row => row.pageNumber },
      { label: "Word", value: row => row.word },
      { label: "Audio path", value: row => row.audioPath }
    ]),
    "",
    "## Complete Word Inventory",
    "",
    markdownTable(words, [
      { label: "Word", value: row => row.normalizedWord },
      { label: "Status", value: row => row.status },
      { label: "Resolved audio", value: row => row.resolvedAudioPath || "" },
      { label: "Occurrences", value: row => row.occurrenceCount },
      { label: "Books/pages", value: row => row.uses.slice(0, 6).map(use => `${use.bookId} p${use.pageNumber}`).join(", ") }
    ])
  ];
  writeFileSync(inventoryPath, `${lines.join("\n")}\n`);

  ensureDir(inventoryJsonPath);
  writeFileSync(inventoryJsonPath, `${JSON.stringify({ summary, words, missing, invalidWordAudioPaths, worstAffectedBooks }, null, 2)}\n`);
  ensureDir(summaryJsonPath);
  writeFileSync(summaryJsonPath, `${JSON.stringify({
    generatedAt: summary.generatedAt,
    activeBooksScanned: summary.activeBooksScanned,
    totalPagesScanned: summary.totalPagesScanned,
    totalUniqueWords: summary.totalUniqueWords,
    uniqueWordsWithAudio: summary.uniqueWordsWithAudio,
    uniqueWordsMissingAudio: summary.uniqueWordsMissingAudio,
    totalMissingWordOccurrences: summary.totalMissingWordOccurrences,
    booksWithMissingWordAudio: summary.booksWithMissingWordAudio,
    invalidWordAudioPathCount: summary.invalidWordAudioPathCount,
    worstAffectedBooks: worstAffectedBooks.slice(0, 10).map(row => ({
      bookId: row.bookId,
      title: row.title,
      missingWordCount: row.missingWordCount,
      missingOccurrences: row.missingOccurrences
    }))
  }, null, 2)}\n`);
}

function writeKimiRequest(missing) {
  ensureDir(kimiRequestPath);
  const lines = [
    "# Kimi Guided Reading Missing Word Audio Request",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Generate only the exact single word for each item. These files support click-to-hear word audio in Guided Reading.",
    "",
    "## Voice Requirements",
    "",
    "- MP3 format matching the existing clean-human standard if possible.",
    "- Neutral soft American female voice.",
    "- American English.",
    "- Clear teacher-like pronunciation.",
    "- Child-friendly.",
    "- Exact word only.",
    "- No extra words, intro, sentence, music, sound effects, or character voice.",
    "- Consistent volume.",
    "- Tiny silence at beginning and end.",
    "",
    "## Missing Word Audio Items",
    "",
    missing.length
      ? missing.flatMap(row => [
        `### ${row.normalizedWord}`,
        "",
        `- normalized word: ${row.normalizedWord}`,
        `- display variants: ${row.displayVariants.join(", ")}`,
        `- occurrence count: ${row.occurrenceCount}`,
        `- target audio path: public${row.expectedAudioPath}`,
        `- exact spoken script: ${row.normalizedWord}`,
        `- pronunciation notes: Say the word naturally as a standalone Guided Reading word.`,
        `- used in: ${row.uses.slice(0, 20).map(use => `${use.bookId} page ${use.pageNumber}`).join("; ")}`,
        ""
      ]).join("\n")
      : "No missing Guided Reading word audio was detected."
  ];
  writeFileSync(kimiRequestPath, `${lines.join("\n")}\n`);
}

const inventory = buildInventory();
writeInventory(inventory);
writeKimiRequest(inventory.missing);

console.log("Guided Reading word audio coverage checked.");
console.log(`Active books: ${inventory.summary.activeBooksScanned}`);
console.log(`Unique words: ${inventory.summary.totalUniqueWords}`);
console.log(`Missing unique word audio: ${inventory.summary.uniqueWordsMissingAudio}`);
console.log(`Missing word occurrences: ${inventory.summary.totalMissingWordOccurrences}`);
if (inventory.invalidWordAudioPaths.length) {
  console.error(`Invalid explicit Guided Reading word audio paths: ${inventory.invalidWordAudioPaths.length}`);
  process.exit(1);
}
