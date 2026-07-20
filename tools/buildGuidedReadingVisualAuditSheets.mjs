#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repoRoot, "public");
const outputRoot = process.argv[2] || "/private/tmp/literacy-path-guided-reading-audit";
const bookSheetDir = path.join(outputRoot, "books");
const orphanSheetDir = path.join(outputRoot, "unreferenced");
const IMAGE_PATTERN = /\.(?:png|jpe?g|webp)$/i;
const CARD_WIDTH = 400;
const CARD_HEIGHT = 450;
const IMAGE_WIDTH = 380;
const IMAGE_HEIGHT = 300;
const COLUMNS = 3;

function escapeXml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  }[character]));
}

function wrapText(value = "", maxCharacters = 44, maxLines = 3) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const consumed = lines.join(" ").length;
  if (consumed < String(value || "").trim().length && lines.length) {
    lines[lines.length - 1] = `${lines.at(-1).replace(/[. ]+$/, "")}...`;
  }
  return lines;
}

function publicPathToFile(publicPath = "") {
  return path.join(publicRoot, String(publicPath).replace(/^\//, ""));
}

async function renderSvg(width, height, body, background = "#f7f4ec") {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${background}"/>
    ${body}
  </svg>`);
}

async function makeBookCard(page, index) {
  const filePath = publicPathToFile(page.image);
  const exists = fs.existsSync(filePath);
  const illustration = exists
    ? await sharp(filePath)
      .resize({ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, fit: "contain", background: "#f7f4ec" })
      .flatten({ background: "#f7f4ec" })
      .png()
      .toBuffer()
    : await renderSvg(IMAGE_WIDTH, IMAGE_HEIGHT, `<text x="190" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#a12b2b">MISSING IMAGE</text>`, "#f5dada");

  const textLines = wrapText(page.text, 47, 3);
  const fileLabel = path.basename(page.image || "(missing path)");
  const captionBody = [
    `<text x="8" y="25" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#202329">Page ${index + 1}</text>`,
    ...textLines.map((line, lineIndex) => `<text x="8" y="${52 + lineIndex * 22}" font-family="Arial, sans-serif" font-size="17" fill="#202329">${escapeXml(line)}</text>`),
    `<text x="8" y="132" font-family="Arial, sans-serif" font-size="12" fill="#666b73">${escapeXml(fileLabel)}</text>`
  ].join("\n");
  const caption = await renderSvg(IMAGE_WIDTH, 140, captionBody, "#ffffff");

  return sharp({
    create: { width: CARD_WIDTH, height: CARD_HEIGHT, channels: 3, background: "#ffffff" }
  }).composite([
    { input: illustration, left: 10, top: 10 },
    { input: caption, left: 10, top: 310 }
  ]).jpeg({ quality: 90 }).toBuffer();
}

async function makeBookSheet(book, bookIndex) {
  const pages = (book.pages || []).filter(page => page.image);
  const rows = Math.max(1, Math.ceil(pages.length / COLUMNS));
  const width = CARD_WIDTH * COLUMNS;
  const headerHeight = 105;
  const height = headerHeight + rows * CARD_HEIGHT;
  const titleLines = wrapText(`${bookIndex + 1}. ${book.title}`, 70, 2);
  const header = await renderSvg(width, headerHeight, [
    ...titleLines.map((line, index) => `<text x="24" y="${38 + index * 31}" font-family="Arial, sans-serif" font-size="27" font-weight="700" fill="#17202a">${escapeXml(line)}</text>`),
    `<text x="${width - 24}" y="38" text-anchor="end" font-family="Arial, sans-serif" font-size="17" fill="#4f5965">${escapeXml(book.id)} | Level ${escapeXml(book.level)} | ${escapeXml(book.type)}</text>`,
    `<text x="${width - 24}" y="69" text-anchor="end" font-family="Arial, sans-serif" font-size="13" fill="#707984">${escapeXml(book.source || "unknown source")}</text>`
  ].join("\n"), "#e8edf0");
  const cards = await Promise.all(pages.map((page, index) => makeBookCard(page, index)));
  const composites = [{ input: header, left: 0, top: 0 }];
  cards.forEach((card, index) => {
    composites.push({
      input: card,
      left: (index % COLUMNS) * CARD_WIDTH,
      top: headerHeight + Math.floor(index / COLUMNS) * CARD_HEIGHT
    });
  });
  const outputPath = path.join(bookSheetDir, `${String(bookIndex + 1).padStart(3, "0")}-${book.id}.jpg`);
  await sharp({ create: { width, height, channels: 3, background: "#f7f4ec" } })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(outputPath);
  return outputPath;
}

function walkImages(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkImages(fullPath);
    return IMAGE_PATTERN.test(entry.name) ? [fullPath] : [];
  });
}

async function makeAssetCard(filePath) {
  const illustration = await sharp(filePath)
    .resize({ width: 210, height: 180, fit: "contain", background: "#f7f4ec" })
    .flatten({ background: "#f7f4ec" })
    .png()
    .toBuffer();
  const relativePath = `/${path.relative(publicRoot, filePath)}`;
  const lines = wrapText(relativePath, 34, 3);
  const label = await renderSvg(210, 74, lines.map((line, index) => `<text x="5" y="${18 + index * 18}" font-family="Arial, sans-serif" font-size="12" fill="#262b30">${escapeXml(line)}</text>`).join("\n"), "#ffffff");
  return sharp({ create: { width: 230, height: 274, channels: 3, background: "#ffffff" } })
    .composite([{ input: illustration, left: 10, top: 10 }, { input: label, left: 10, top: 190 }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function makeUnreferencedSheets(files) {
  const pageSize = 24;
  const columns = 4;
  const cardWidth = 230;
  const cardHeight = 274;
  const outputs = [];
  for (let start = 0; start < files.length; start += pageSize) {
    const batch = files.slice(start, start + pageSize);
    const rows = Math.ceil(batch.length / columns);
    const cards = await Promise.all(batch.map(makeAssetCard));
    const outputPath = path.join(orphanSheetDir, `unreferenced-${String(start / pageSize + 1).padStart(3, "0")}.jpg`);
    await sharp({ create: { width: columns * cardWidth, height: rows * cardHeight, channels: 3, background: "#f7f4ec" } })
      .composite(cards.map((card, index) => ({
        input: card,
        left: (index % columns) * cardWidth,
        top: Math.floor(index / columns) * cardHeight
      })))
      .jpeg({ quality: 88 })
      .toFile(outputPath);
    outputs.push(outputPath);
  }
  return outputs;
}

fs.mkdirSync(bookSheetDir, { recursive: true });
fs.mkdirSync(orphanSheetDir, { recursive: true });

const references = guidedReadingBooks.flatMap(book => (book.pages || []).filter(page => page.image).map((page, index) => ({
  bookId: book.id,
  title: book.title,
  level: book.level,
  source: book.source || "",
  pageNumber: index + 1,
  text: page.text || "",
  imagePath: page.image
})));
const activeFiles = new Set(references.map(reference => publicPathToFile(reference.imagePath)));
const physicalFiles = walkImages(path.join(publicRoot, "guided-reading")).sort();
const unreferencedFiles = physicalFiles.filter(filePath => !activeFiles.has(filePath));

const bookSheets = [];
for (const [index, book] of guidedReadingBooks.entries()) {
  bookSheets.push(await makeBookSheet(book, index));
}
const unreferencedSheets = await makeUnreferencedSheets(unreferencedFiles);

const inventory = {
  generatedAt: new Date().toISOString(),
  outputRoot,
  totalBooks: guidedReadingBooks.length,
  activePageReferences: references.length,
  uniqueActiveImages: activeFiles.size,
  totalPhysicalImages: physicalFiles.length,
  unreferencedPhysicalImages: unreferencedFiles.length,
  bookSheets,
  unreferencedSheets,
  books: guidedReadingBooks.map((book, index) => ({
    index: index + 1,
    id: book.id,
    title: book.title,
    level: book.level,
    type: book.type,
    source: book.source || "",
    sheet: bookSheets[index],
    pages: references.filter(reference => reference.bookId === book.id)
  })),
  unreferencedImages: unreferencedFiles.map(filePath => `/${path.relative(publicRoot, filePath)}`)
};
fs.writeFileSync(path.join(outputRoot, "inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`);

console.log(JSON.stringify({
  outputRoot,
  totalBooks: inventory.totalBooks,
  activePageReferences: inventory.activePageReferences,
  uniqueActiveImages: inventory.uniqueActiveImages,
  totalPhysicalImages: inventory.totalPhysicalImages,
  unreferencedPhysicalImages: inventory.unreferencedPhysicalImages,
  bookSheetCount: bookSheets.length,
  unreferencedSheetCount: unreferencedSheets.length
}, null, 2));
