import fs from "node:fs";
import path from "node:path";
import {
  copyFilePreservingDir,
  ensureDir,
  getBookManifestPath,
  getBookPagesDir,
  getMetadataForBook,
  manifestsDir,
  parseArgs,
  publicPathFromAbsolute,
  repoRoot
} from "./shared.js";
import { scoreTextQuality } from "./scoreTextQuality.js";

function estimatePhonicsComplexity(text = "") {
  const words = String(text).toLowerCase().match(/[a-z']+/g) || [];
  if (!words.length) return "unknown";
  const complex = words.filter(word =>
    word.length > 7 ||
    /(sh|ch|th|wh|ph|ck|ng|ai|ay|ee|ea|oa|oi|oy|ou|ow|ar|er|ir|or|ur)/.test(word)
  ).length;
  const ratio = complex / words.length;
  if (ratio < 0.12) return "low";
  if (ratio < 0.25) return "moderate";
  return "high";
}

function estimateVocabularyRepetition(text = "") {
  const words = String(text).toLowerCase().match(/[a-z']+/g) || [];
  if (!words.length) return 0;
  return Number((new Set(words).size / words.length).toFixed(3));
}

function getPageImages(bookId) {
  const pagesDir = getBookPagesDir(bookId);
  if (!fs.existsSync(pagesDir)) return [];
  return fs.readdirSync(pagesDir)
    .filter(file => /^page-\d{3}\.webp$/u.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(file => path.join(pagesDir, file));
}

function buildCover(bookId, pageImages, metadata) {
  const explicitCover = metadata.coverSource ? path.resolve(repoRoot, metadata.coverSource) : "";
  const source = explicitCover && fs.existsSync(explicitCover) ? explicitCover : pageImages[0];
  if (!source) return "";
  const extension = path.extname(source).toLowerCase() === ".webp" ? ".webp" : path.extname(source);
  const coverPath = path.join(repoRoot, "public/guided-reading/covers", `${bookId}-cover${extension || ".webp"}`);
  copyFilePreservingDir(source, coverPath);
  return publicPathFromAbsolute(coverPath);
}

export function buildManifest({ bookId, pageTexts = [], sourceFile = "" }) {
  if (!bookId) throw new Error("buildManifest requires bookId.");
  ensureDir(manifestsDir);
  const metadata = getMetadataForBook(bookId);
  const pageImages = getPageImages(bookId);
  const coverImage = buildCover(bookId, pageImages, metadata);

  const pages = pageImages.map((filePath, index) => ({
    pageNumber: index + 1,
    image: publicPathFromAbsolute(filePath),
    text: pageTexts[index] || ""
  }));
  const fullText = pageTexts.join("\n\n");
  const textQuality = scoreTextQuality(fullText);

  const manifest = {
    id: metadata.id || bookId,
    title: metadata.title,
    author: metadata.author || "",
    source: metadata.source || metadata.sourceUrl || sourceFile || "",
    publicDomain: metadata.publicDomain !== false,
    readingLevel: metadata.readingLevel || "early",
    guidedReadingLevel: metadata.guidedReadingLevel || metadata.level || "A",
    level: metadata.guidedReadingLevel || metadata.level || "A",
    type: metadata.type || "fiction",
    pages,
    coverImage,
    tags: metadata.tags || [],
    active: Boolean(metadata.active) && pages.length > 0 && pages.every(page => page.image && page.text),
    qaStatus: metadata.qaStatus || "needs_review",
    readingHeuristics: {
      estimatedDifficulty: textQuality.readabilityBand,
      averageSentenceLength: textQuality.averageSentenceLength,
      phonicsComplexity: estimatePhonicsComplexity(fullText),
      vocabularyDiversity: estimateVocabularyRepetition(fullText),
      decodability: estimatePhonicsComplexity(fullText) === "low" ? "higher" : "mixed",
      textQualityRiskScore: textQuality.riskScore,
      needsOcrCleanup: textQuality.needsManualCleanup
    },
    sourceFormat: metadata.sourceFormat || "",
    sourceFile: sourceFile || "",
    audio: null,
    comprehension: [],
    vocabulary: []
  };

  const manifestPath = getBookManifestPath(bookId);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { manifest, manifestPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();
  try {
    const textPagesPath = args.textPages ? path.resolve(repoRoot, args.textPages) : "";
    const pageTexts = textPagesPath && fs.existsSync(textPagesPath)
      ? JSON.parse(fs.readFileSync(textPagesPath, "utf8"))
      : [];
    const result = buildManifest({ bookId: args.book, pageTexts, sourceFile: args.source || "" });
    console.log(`Wrote manifest: ${result.manifestPath}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
