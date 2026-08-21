#!/usr/bin/env node

import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guidedReadingSelBooksDraft } from "../src/data/guidedReadingSelBooks.draft.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "docs/content/sel-books/SEL_MEDIA_MANIFEST.json");
const voice = "en-US-Chirp3-HD-Leda";
const reviewedImageStatus = "generated-direct-visual-review-complete";
const markImagesReviewed = process.argv.includes("--mark-images-reviewed");
const slug = value => String(value).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hash = value => createHash("sha256").update(value).digest("hex").slice(0, 10);
const localPath = publicPath => path.join(root, "public", publicPath.replace(/^\/+/, ""));
const previous = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, "utf8")) : { pages: [], covers: [] };
const previousPages = new Map((previous.pages || []).map(record => [`${record.bookId}:${record.pageNumber}`, record]));
const previousCovers = new Map((previous.covers || []).map(record => [record.bookId, record]));

const imageStatus = (publicPath, priorStatus = "") => {
  if (!fs.existsSync(localPath(publicPath))) return "not-generated";
  if (markImagesReviewed) return reviewedImageStatus;
  if (priorStatus && priorStatus !== "not-generated") return priorStatus;
  return "generated-awaiting-visual-review";
};

const pages = guidedReadingSelBooksDraft.flatMap(book => book.pages.map((entry, index) => {
  const pageNumber = index + 1;
  const prior = previousPages.get(`${book.id}:${pageNumber}`) || {};
  const imagePath = `/images/guided-reading/sel-books/${book.id}/page-${String(pageNumber).padStart(2, "0")}-${slug(book.title)}.webp`;
  const audioFile = `sel-${book.id}-page-${String(pageNumber).padStart(2, "0")}-${hash(`${voice}|guided_page|${entry.text}`)}.mp3`;
  const audioPath = `/audio/production/en-US/guided_page/${audioFile}`;
  const audioExists = fs.existsSync(localPath(audioPath));
  return {
    bookId: book.id,
    label: book.label,
    title: book.title,
    level: book.level,
    pageNumber,
    exactText: entry.text,
    illustrationPrompt: `${book.title}: ${entry.scene}. Preserve the canon characters ${book.characters.join(", ")}, the declared reading-band scene, continuity and safe-area rules. No embedded text, captions, watermarks or extra characters.`,
    imagePath,
    audioPath,
    audioStatus: audioExists
      ? (prior.audioStatus && prior.audioStatus !== "not-generated" ? prior.audioStatus : "generated-awaiting-listening-review")
      : "not-generated",
    imageStatus: imageStatus(imagePath, prior.imageStatus),
    audioVoice: audioExists ? voice : undefined
  };
}));

const covers = guidedReadingSelBooksDraft.map(book => {
  const coverPath = `/images/guided-reading/sel-books/${book.id}/cover.webp`;
  return {
    bookId: book.id,
    label: book.label,
    title: book.title,
    level: book.level,
    coverPath,
    imageStatus: imageStatus(coverPath, previousCovers.get(book.id)?.imageStatus)
  };
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify({
  collection: "Little Literacy Guides SEL Books 1-10",
  generatedFrom: "src/data/guidedReadingSelBooks.draft.js",
  status: "draft-only",
  imageDimensions: "1376x768",
  pageCount: pages.length,
  coverCount: covers.length,
  audioVoice: voice,
  covers,
  pages
}, null, 2)}\n`);
console.log(`Wrote ${pages.length} page and ${covers.length} cover media records to ${path.relative(root, output)}`);
