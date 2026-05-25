import fs from "node:fs";
import path from "node:path";
import { buildManifest } from "./buildManifest.js";
import { extractPages } from "./extractPages.js";
import { extractText } from "./extractText.js";
import {
  copyFilePreservingDir,
  ensureDir,
  getBookRawDir,
  parseArgs,
  repoRoot,
  slugify
} from "./shared.js";
import { validateBooks } from "./validateBook.js";

function prepareRawInput({ bookId, source = "", title = "" }) {
  const rawDir = getBookRawDir(bookId);
  ensureDir(rawDir);
  if (source) {
    const sourcePath = path.resolve(repoRoot, source);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }
    copyFilePreservingDir(sourcePath, path.join(rawDir, path.basename(sourcePath)));
  }
  const metadataPath = path.join(rawDir, "metadata.json");
  if (!fs.existsSync(metadataPath)) {
    fs.writeFileSync(
      metadataPath,
      `${JSON.stringify({
        id: bookId,
        title: title || bookId.split("-").map(part => part[0]?.toUpperCase() + part.slice(1)).join(" "),
        author: "",
        source: "",
        publicDomain: true,
        readingLevel: "early",
        guidedReadingLevel: "A",
        tags: [],
        active: false,
        qaStatus: "needs_review"
      }, null, 2)}\n`,
      "utf8"
    );
  }
}

export function ingestBook({ book = "", title = "", source = "" }) {
  const bookId = book || slugify(title);
  if (!bookId) throw new Error("Provide --book book-id or --title \"Book Title\".");

  prepareRawInput({ bookId, source, title });
  const sourceFile = source || "";
  const pageResult = extractPages({ bookId, sourceFile });
  const textResult = extractText({ bookId, pageCount: pageResult.pageCount, sourceFile });
  const manifestResult = buildManifest({
    bookId,
    pageTexts: textResult.pages,
    sourceFile
  });
  const validation = validateBooks({ bookId });

  return {
    bookId,
    pageCount: pageResult.pageCount,
    manifestPath: manifestResult.manifestPath,
    valid: validation.rows[0]?.valid || false,
    errors: validation.rows[0]?.errors || []
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();
  try {
    const result = ingestBook({
      book: args.book || "",
      title: args.title || "",
      source: args.source || ""
    });
    console.log(`Ingested ${result.bookId}: ${result.pageCount} page(s).`);
    console.log(`Manifest: ${result.manifestPath}`);
    if (!result.valid) {
      console.warn(`Book is not active-ready: ${result.errors.join("; ")}`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

