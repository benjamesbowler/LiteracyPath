import fs from "node:fs";
import path from "node:path";
import {
  commandExists,
  copyFilePreservingDir,
  emptyDir,
  ensureDir,
  expectedInstallHelp,
  findFirstFile,
  getBookPagesDir,
  getBookRawDir,
  parseArgs,
  publicPathFromAbsolute,
  repoRoot,
  runCommand
} from "./shared.js";
import { normalizeText, splitTextIntoPages } from "./normalizeText.js";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function convertImageToWebp(source, target) {
  ensureDir(path.dirname(target));
  if (path.extname(source).toLowerCase() === ".webp") {
    copyFilePreservingDir(source, target);
    return;
  }
  if (!commandExists("magick")) {
    throw new Error(expectedInstallHelp());
  }
  runCommand("magick", [
    source,
    "-auto-orient",
    "-resize",
    "1600x2200>",
    "-background",
    "white",
    "-alpha",
    "remove",
    "-quality",
    "82",
    target
  ]);
}

function extractPdfPages(pdfPath, outputDir) {
  if (!commandExists("pdftoppm") || !commandExists("magick")) {
    throw new Error(expectedInstallHelp());
  }

  const tempDir = path.join(outputDir, "_tmp_png");
  emptyDir(tempDir);
  runCommand("pdftoppm", ["-r", "160", "-png", pdfPath, path.join(tempDir, "page")]);

  const pngFiles = fs.readdirSync(tempDir)
    .filter(file => file.endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  pngFiles.forEach((file, index) => {
    const target = path.join(outputDir, `page-${String(index + 1).padStart(3, "0")}.webp`);
    convertImageToWebp(path.join(tempDir, file), target);
  });

  fs.rmSync(tempDir, { recursive: true, force: true });
  return pngFiles.length;
}

function extractImagePages(rawDir, outputDir) {
  const imageFiles = fs.readdirSync(rawDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase()))
    .map(entry => path.join(rawDir, entry.name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  imageFiles.forEach((file, index) => {
    const target = path.join(outputDir, `page-${String(index + 1).padStart(3, "0")}.webp`);
    convertImageToWebp(file, target);
  });

  return imageFiles.length;
}

function findTextFile(rawDir, resolvedSource = "") {
  if (resolvedSource && [".txt", ".text"].includes(path.extname(resolvedSource).toLowerCase())) {
    return resolvedSource;
  }
  return findFirstFile(rawDir, [".txt", ".text"]);
}

function estimateTextPageCount(text) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 95));
}

function extractTextPages(textFile, outputDir) {
  if (!commandExists("magick")) {
    throw new Error(expectedInstallHelp());
  }

  const cleanText = normalizeText(fs.readFileSync(textFile, "utf8"));
  const pageCount = estimateTextPageCount(cleanText);
  const pages = splitTextIntoPages(cleanText, pageCount);
  const tempDir = path.join(outputDir, "_tmp_text");
  emptyDir(tempDir);

  pages.forEach((pageText, index) => {
    const textPath = path.join(tempDir, `page-${String(index + 1).padStart(3, "0")}.txt`);
    const target = path.join(outputDir, `page-${String(index + 1).padStart(3, "0")}.webp`);
    fs.writeFileSync(textPath, pageText || " ", "utf8");
    runCommand("magick", [
      "-background",
      "white",
      "-fill",
      "#111827",
      "-pointsize",
      "46",
      "-interline-spacing",
      "10",
      "-size",
      "1008x1408",
      `caption:@${textPath}`,
      "-gravity",
      "center",
      "-extent",
      "1200x1600",
      "-quality",
      "82",
      target
    ]);
  });

  fs.rmSync(tempDir, { recursive: true, force: true });
  return pages.length;
}

export function extractPages({ bookId, sourceFile = "" }) {
  if (!bookId) throw new Error("extractPages requires bookId.");
  const rawDir = getBookRawDir(bookId);
  const outputDir = getBookPagesDir(bookId);
  const resolvedSource = sourceFile ? path.resolve(repoRoot, sourceFile) : "";
  const pdfPath = resolvedSource || findFirstFile(rawDir, [".pdf"]);
  const textPath = findTextFile(rawDir, resolvedSource);

  emptyDir(outputDir);

  let pageCount = 0;
  if (pdfPath && path.extname(pdfPath).toLowerCase() === ".pdf") {
    pageCount = extractPdfPages(pdfPath, outputDir);
  } else {
    pageCount = extractImagePages(rawDir, outputDir);
    if (!pageCount && textPath) {
      pageCount = extractTextPages(textPath, outputDir);
    }
  }

  if (!pageCount) {
    throw new Error(`No PDF, page image, or text files found for ${bookId} in ${rawDir}.`);
  }

  return {
    bookId,
    pageCount,
    pages: Array.from({ length: pageCount }, (_, index) => {
      const filePath = path.join(outputDir, `page-${String(index + 1).padStart(3, "0")}.webp`);
      return {
        pageNumber: index + 1,
        image: publicPathFromAbsolute(filePath)
      };
    })
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();
  try {
    const result = extractPages({ bookId: args.book, sourceFile: args.source || "" });
    console.log(`Extracted ${result.pageCount} page image(s) for ${result.bookId}.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
