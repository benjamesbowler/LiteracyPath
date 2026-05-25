import fs from "node:fs";
import path from "node:path";
import {
  commandExists,
  ensureDir,
  expectedInstallHelp,
  findFirstFile,
  getBookRawDir,
  parseArgs,
  repoRoot,
  runCommand
} from "./shared.js";
import { normalizeText, splitTextIntoPages } from "./normalizeText.js";

export function extractRawText({ bookId, sourceFile = "" }) {
  if (!bookId) throw new Error("extractText requires bookId.");
  const rawDir = getBookRawDir(bookId);
  const resolvedSource = sourceFile ? path.resolve(repoRoot, sourceFile) : "";
  const textFile = resolvedSource && [".txt", ".text"].includes(path.extname(resolvedSource).toLowerCase())
    ? resolvedSource
    : findFirstFile(rawDir, [".txt", ".text"]);
  if (textFile) return fs.readFileSync(textFile, "utf8");

  const pdfPath = resolvedSource && path.extname(resolvedSource).toLowerCase() === ".pdf"
    ? resolvedSource
    : findFirstFile(rawDir, [".pdf"]);
  if (!pdfPath) return "";

  if (!commandExists("pdftotext")) {
    throw new Error(expectedInstallHelp());
  }

  const tempTextPath = path.join(rawDir, ".extracted-text.txt");
  runCommand("pdftotext", ["-layout", pdfPath, tempTextPath], { quiet: true });
  const text = fs.existsSync(tempTextPath) ? fs.readFileSync(tempTextPath, "utf8") : "";
  fs.rmSync(tempTextPath, { force: true });
  return text;
}

export function extractText({ bookId, pageCount = 0, sourceFile = "" }) {
  const rawText = extractRawText({ bookId, sourceFile });
  const normalized = normalizeText(rawText);
  const pages = splitTextIntoPages(normalized, pageCount);
  return {
    bookId,
    text: normalized,
    pages
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();
  try {
    const pageCount = Number(args.pages || 0);
    const result = extractText({ bookId: args.book, pageCount, sourceFile: args.source || "" });
    const output = args.output ? path.resolve(repoRoot, args.output) : path.join(getBookRawDir(args.book), "clean-text.txt");
    ensureDir(path.dirname(output));
    fs.writeFileSync(output, `${result.text}\n`, "utf8");
    console.log(`Wrote text for ${result.bookId}: ${output}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

