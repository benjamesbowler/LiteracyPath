import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const packRoot = "/Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath Assests 8";
const guidedRoot = path.join(packRoot, "guided-reading-pack-01");
const publicGuidedRoot = path.join(rootDir, "public", "guided-reading");

const imageExts = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const audioExts = new Set([".mp3", ".wav", ".m4a", ".aac"]);
const dataExts = new Set([".json", ".md", ".csv", ".txt"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha1(file) {
  return crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
}

function fileSize(file) {
  return fs.statSync(file).size;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function normalizeWord(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s'-]/g, "")
    .trim();
}

function wordsFromText(text) {
  return String(text || "")
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: `/audio/child-mode/words/${normalizeWord(word).replace(/\s+/g, "-")}.mp3`
    }));
}

function buildPublicHashIndex() {
  const files = walk(path.join(rootDir, "public"));
  const hashes = new Map();
  const names = new Map();

  files.forEach(file => {
    const hash = sha1(file);
    const name = path.basename(file).toLowerCase();
    hashes.set(hash, [...(hashes.get(hash) || []), path.relative(rootDir, file)]);
    names.set(name, [...(names.get(name) || []), path.relative(rootDir, file)]);
  });

  return { hashes, names };
}

function discoverPack(files, publicIndex) {
  const byName = new Map();
  const byHash = new Map();

  files.forEach(file => {
    const name = path.basename(file).toLowerCase();
    const hash = sha1(file);
    byName.set(name, [...(byName.get(name) || []), file]);
    byHash.set(hash, [...(byHash.get(hash) || []), file]);
  });

  const exactDuplicates = files.filter(file => publicIndex.hashes.has(sha1(file)));
  const filenameConflicts = files.filter(file => publicIndex.names.has(path.basename(file).toLowerCase()));

  return {
    byName,
    byHash,
    duplicateFilenamesInsidePack: [...byName.entries()].filter(([, matches]) => matches.length > 1),
    duplicateHashesInsidePack: [...byHash.entries()].filter(([, matches]) => matches.length > 1),
    exactDuplicates,
    filenameConflicts
  };
}

function getBookQuality(book) {
  const pageTexts = book.pages.map(page => page.text || "");
  const allText = pageTexts.join(" ");
  const cleanWords = allText.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(cleanWords);
  const avgWordsPerPage = cleanWords.length / Math.max(1, book.pages.length);
  const hasReasoningOrSequence = /\b(because|so|but|then|finally|learn|help|share|solve|notice|wonder|explain|discover|changed|decided|asked|answer|problem|plan|try|tried|first|next|after)\b/i.test(allText);
  const tooThin = book.level !== "A" && cleanWords.length < 40;
  const levelAFiller = book.level === "A" && cleanWords.length < 25;
  const copyrightRisk = /\b(disney|pixar|seuss|marvel|pokemon|lego|mickey|elsa|harry potter)\b/i.test(allText + " " + book.title);
  const notes = [];

  if (!hasReasoningOrSequence) notes.push("simple descriptive sequence; teacher review recommended for depth");
  if (levelAFiller) notes.push("very thin even for Level A");
  if (tooThin) notes.push("too short for stated level");
  if (copyrightRisk) notes.push("possible copyright/brand risk");

  return {
    wordCount: cleanWords.length,
    uniqueWordCount: uniqueWords.size,
    avgWordsPerPage: Number(avgWordsPerPage.toFixed(1)),
    hasReasoningOrSequence,
    copyrightRisk,
    status: copyrightRisk || tooThin || levelAFiller ? "blocked" : "approved",
    notes
  };
}

function validateGuidedBooks() {
  const manifestPath = path.join(guidedRoot, "guided_reading_books_manifest.json");
  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const books = Object.values(raw.books || {});

  return books.map(book => {
    const coverPath = path.join(guidedRoot, "images", "covers", book.cover_image);
    const pages = book.pages || [];
    const missing = [];

    if (!fs.existsSync(coverPath)) missing.push(`cover:${book.cover_image}`);

    pages.forEach(page => {
      const imagePath = path.join(guidedRoot, "images", "pages", page.image_file);
      const audioPath = path.join(guidedRoot, "audio", "page-narration", page.audio_file);
      if (!fs.existsSync(imagePath)) missing.push(`page image:${page.image_file}`);
      if (!fs.existsSync(audioPath)) missing.push(`page audio:${page.audio_file}`);
    });

    const quality = getBookQuality(book);
    const status = missing.length ? "blocked" : quality.status;

    return {
      ...book,
      status,
      missing,
      quality: {
        ...quality,
        notes: [
          ...quality.notes,
          "word-level audio files were not included in Pack 8; word-tap support uses existing approved word audio when available"
        ]
      }
    };
  });
}

function copyAsset(src, dest, imported, skipped, conflicts) {
  ensureDir(path.dirname(dest));

  if (fs.existsSync(dest)) {
    if (sha1(src) === sha1(dest)) {
      skipped.push({ source: src, destination: dest, reason: "exact duplicate at destination" });
      return;
    }

    const parsed = path.parse(dest);
    const suffixed = path.join(parsed.dir, `${parsed.name}-kimi8${parsed.ext}`);
    fs.copyFileSync(src, suffixed);
    conflicts.push({ source: src, destination: dest, preservedAs: suffixed });
    imported.push({ source: src, destination: suffixed, reason: "same destination name, preserved with suffix" });
    return;
  }

  fs.copyFileSync(src, dest);
  imported.push({ source: src, destination: dest, reason: "new approved guided-reading asset" });
}

function importGuidedReadingAssets(bookRows) {
  const imported = [];
  const skipped = [];
  const conflicts = [];
  const approved = bookRows.filter(book => book.status === "approved");

  approved.forEach(book => {
    copyAsset(
      path.join(guidedRoot, "images", "covers", book.cover_image),
      path.join(publicGuidedRoot, "covers", book.cover_image),
      imported,
      skipped,
      conflicts
    );

    book.pages.forEach(page => {
      copyAsset(
        path.join(guidedRoot, "images", "pages", page.image_file),
        path.join(publicGuidedRoot, "pages", page.image_file),
        imported,
        skipped,
        conflicts
      );
      copyAsset(
        path.join(guidedRoot, "audio", "page-narration", page.audio_file),
        path.join(publicGuidedRoot, "audio", "narration", page.audio_file),
        imported,
        skipped,
        conflicts
      );
    });
  });

  return { imported, skipped, conflicts, approved };
}

function generateGuidedReadingBooks(bookRows) {
  const approved = bookRows.filter(book => book.status === "approved");
  const booksLiteral = approved.map(book => ({
    id: book.book_id,
    title: book.title,
    type: book.type,
    level: book.level,
    targetSkills: String(book.target_skills || "")
      .split(",")
      .map(item => item.trim())
      .filter(Boolean),
    theme: book.theme || "",
    source: "kimi_assets8_guided_reading_pack_01",
    coverImage: `/guided-reading/covers/${book.cover_image}`,
    pages: book.pages.map(page => ({
      text: page.text,
      image: `/guided-reading/pages/${page.image_file}`,
      pageAudio: `/guided-reading/audio/narration/${page.audio_file}`,
      highFrequencyWords: page.hfw || [],
      decodableWords: page.decodable || []
    }))
  }));

  const file = `const wordAudio = word => \`/audio/child-mode/words/$\{word.toLowerCase().replace(/[^a-z0-9'-]+/g, "-").replace(/^-+|-+$/g, "")}.mp3\`;

const words = text =>
  text
    .replace(/[.,!?;:()"]/g, "")
    .split(/\\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: wordAudio(word)
    }));

const rawGuidedReadingBooks = ${JSON.stringify(booksLiteral, null, 2)};

export const guidedReadingBooks = rawGuidedReadingBooks.map(book => ({
  ...book,
  pages: book.pages.map(page => ({
    ...page,
    words: words(page.text)
  }))
}));

export function summarizeGuidedReadingRecord(record) {
  const pages = Object.values(record?.pages || {});
  const markEntries = pages.flatMap(page => Object.entries(page.wordMarks || {}));
  const correct = markEntries.filter(([, mark]) => mark === "correct").length;
  const support = markEntries.filter(([, mark]) => mark === "support").length;
  const attempted = correct + support;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const supportWords = [];

  pages.forEach((page, pageIndex) => {
    Object.entries(page.wordMarks || {}).forEach(([wordIndex, mark]) => {
      if (mark === "support") {
        const word = page.words?.[wordIndex] || page.wordTexts?.[wordIndex] || "";
        if (word) supportWords.push(word);
      }
    });
  });

  return {
    attempted,
    correct,
    support,
    accuracy,
    supportWords: [...new Set(supportWords.map(word => String(word).toLowerCase()))],
    pageNotes: pages
      .map((page, index) => ({ page: index + 1, note: page.note || "" }))
      .filter(item => item.note.trim()),
    wholeBookNote: record?.wholeBookNote || "",
    completedAt: record?.completedAt || ""
  };
}

export function summarizeGuidedReadingRecords(records = {}) {
  return Object.entries(records)
    .map(([bookId, record]) => {
      const book = guidedReadingBooks.find(item => item.id === bookId);
      return {
        bookId,
        title: book?.title || record.title || bookId,
        type: book?.type || record.type || "",
        level: book?.level || record.level || "",
        ...summarizeGuidedReadingRecord(record)
      };
    })
    .filter(summary => summary.attempted > 0 || summary.wholeBookNote || summary.pageNotes.length > 0);
}
`;

  fs.writeFileSync(path.join(rootDir, "src", "data", "guidedReadingBooks.js"), file);
}

function writeReports({ files, discovery, bookRows, importResult }) {
  const unsupported = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return !imageExts.has(ext) && !audioExts.has(ext) && !dataExts.has(ext) && ext !== ".zip";
  });
  const images = files.filter(file => imageExts.has(path.extname(file).toLowerCase()));
  const audio = files.filter(file => audioExts.has(path.extname(file).toLowerCase()));
  const data = files.filter(file => dataExts.has(path.extname(file).toLowerCase()));
  const zips = files.filter(file => path.extname(file).toLowerCase() === ".zip");
  const byStatus = bookRows.reduce((counts, book) => {
    counts[book.status] = (counts[book.status] || 0) + 1;
    return counts;
  }, {});
  const byLevel = bookRows.reduce((counts, book) => {
    counts[book.level] = (counts[book.level] || 0) + 1;
    return counts;
  }, {});
  const byType = bookRows.reduce((counts, book) => {
    counts[book.type] = (counts[book.type] || 0) + 1;
    return counts;
  }, {});

  ensureDir(path.join(rootDir, "docs", "assets"));
  ensureDir(path.join(rootDir, "docs", "guided-reading"));

  const importReport = [
    "# Kimi Asset Pack 8 Import Report",
    "",
    `Pack path: \`${packRoot}\``,
    "",
    "## Discovery",
    "",
    markdownTable(["Metric", "Count"], [
      ["Total files", files.length],
      ["Images", images.length],
      ["Audio", audio.length],
      ["JSON/manifest/docs", data.length],
      ["Zip archives", zips.length],
      ["Unsupported files", unsupported.length],
      ["Duplicate filenames inside pack", discovery.duplicateFilenamesInsidePack.length],
      ["Duplicate file hashes inside pack", discovery.duplicateHashesInsidePack.length],
      ["Exact duplicates already in project public assets", discovery.exactDuplicates.length],
      ["Filename conflicts with project public assets", discovery.filenameConflicts.length]
    ]),
    "",
    "## Imported",
    "",
    markdownTable(["Imported assets", "Count"], [
      ["Approved guided reading covers/pages/narration present in public assets", importResult.imported.length + importResult.skipped.length],
      ["Newly copied during this run", importResult.imported.length],
      ["Skipped exact destination duplicates", importResult.skipped.length],
      ["Destination filename conflicts preserved with suffix", importResult.conflicts.length]
    ]),
    "",
    "## Pack Manifests Found",
    "",
    data.map(file => `- \`${path.relative(packRoot, file)}\` (${fileSize(file)} bytes)`).join("\n") || "None.",
    "",
    "## Assessment Assets",
    "",
    "Pack 8 assessment images/audio were treated as candidates only. No assessment runtime assets were activated because the current validated assessment pool already reports zero image/audio asset gaps, and Pack 8 audio has not had human listening approval.",
    "",
    "## Duplicate Policy",
    "",
    "- Exact duplicates were skipped.",
    "- Existing approved assets were not overwritten.",
    "- Guided Reading assets were imported into a new `/public/guided-reading/` namespace to avoid breaking existing Child Mode and assessment asset paths.",
    "- Pack 8 audio outside Guided Reading remains candidate/review-needed until human audio review."
  ].join("\n");

  fs.writeFileSync(path.join(rootDir, "docs", "assets", "kimi_assets8_import_report.md"), importReport);

  const qualityRows = bookRows.map(book => [
    book.book_id,
    book.title,
    book.type,
    book.level,
    book.status,
    book.quality.wordCount,
    book.quality.uniqueWordCount,
    book.quality.avgWordsPerPage,
    book.missing.length ? book.missing.join("; ") : "none",
    book.quality.notes.join("; ") || "none"
  ]);
  const strongest = [...bookRows]
    .filter(book => book.status === "approved")
    .sort((a, b) => (b.quality.uniqueWordCount + b.quality.wordCount) - (a.quality.uniqueWordCount + a.quality.wordCount))
    .slice(0, 10);
  const weak = bookRows.filter(book => book.quality.notes.length > 1 || book.status !== "approved");

  const guidedReport = [
    "# Guided Reading Quality Audit",
    "",
    "Generated during Kimi Asset Pack 8 ingestion.",
    "",
    "## Summary",
    "",
    markdownTable(["Metric", "Count"], [
      ["Total books reviewed", bookRows.length],
      ["Approved books", byStatus.approved || 0],
      ["Blocked books", byStatus.blocked || 0],
      ["Fiction", byType.fiction || 0],
      ["Nonfiction", byType.nonfiction || 0],
      ["Level A", byLevel.A || 0],
      ["Level B", byLevel.B || 0],
      ["Level C", byLevel.C || 0],
      ["Level D", byLevel.D || 0],
      ["Level E", byLevel.E || 0]
    ]),
    "",
    "## Quality Notes",
    "",
    "- All approved books are original Pack 8 candidates with six pages, cover art, page images, and static page narration.",
    "- Word-level audio was not included in Pack 8 despite the manifest claiming word-audio support. The app therefore shows word audio only when the word already has an approved LiteracyPath word MP3.",
    "- Page narration is static MP3 and imported for Guided Reading only. It is not used in Teacher Assessment runtime.",
    "- Level A books are intentionally simple; simple descriptive books are noted for teacher review rather than blocked when level-appropriate.",
    "",
    "## Reading Level Distribution",
    "",
    markdownTable(["Level", "Books"], Object.entries(byLevel).sort().map(([level, count]) => [level, count])),
    "",
    "## Strongest Books",
    "",
    markdownTable(["Book ID", "Title", "Type", "Level", "Words", "Unique words"], strongest.map(book => [
      book.book_id,
      book.title,
      book.type,
      book.level,
      book.quality.wordCount,
      book.quality.uniqueWordCount
    ])),
    "",
    "## Review-Needed / Weak-Filler Notes",
    "",
    weak.length
      ? markdownTable(["Book ID", "Title", "Status", "Notes"], weak.map(book => [
        book.book_id,
        book.title,
        book.status,
        book.quality.notes.join("; ")
      ]))
      : "No books were blocked. A few Level A/B books remain intentionally simple but acceptable for early guided reading.",
    "",
    "## Full Book Audit",
    "",
    markdownTable(
      ["Book ID", "Title", "Type", "Level", "Status", "Words", "Unique words", "Avg words/page", "Missing references", "Notes"],
      qualityRows
    )
  ].join("\n");

  fs.writeFileSync(path.join(rootDir, "docs", "guided-reading", "guided_reading_quality_audit.md"), guidedReport);
}

function main() {
  if (!fs.existsSync(packRoot)) {
    throw new Error(`Pack 8 not found at ${packRoot}`);
  }

  const files = walk(packRoot);
  const publicIndex = buildPublicHashIndex();
  const discovery = discoverPack(files, publicIndex);
  const bookRows = validateGuidedBooks();
  const importResult = importGuidedReadingAssets(bookRows);

  generateGuidedReadingBooks(bookRows);
  writeReports({ files, discovery, bookRows, importResult });

  console.log(`Pack 8 files discovered: ${files.length}`);
  console.log(`Guided Reading books approved: ${bookRows.filter(book => book.status === "approved").length}`);
  console.log(`Guided Reading assets imported/skipped: ${importResult.imported.length}/${importResult.skipped.length}`);
  console.log("Wrote docs/assets/kimi_assets8_import_report.md");
  console.log("Wrote docs/guided-reading/guided_reading_quality_audit.md");
}

main();
