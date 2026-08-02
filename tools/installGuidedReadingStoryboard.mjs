#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { guidedReadingWorldExpansionBooks } from "../src/data/guidedReadingWorldExpansionBooks.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [sourcePath, bookId, requestedLayout] = process.argv.slice(2);
const book = guidedReadingWorldExpansionBooks.find(candidate => candidate.id === bookId);

if (!sourcePath || !book) {
  console.error("Usage: node tools/installGuidedReadingStoryboard.mjs <storyboard.png> <expansion-book-id> [<columns>x<rows>]");
  process.exit(1);
}
if (!fs.existsSync(sourcePath) || fs.statSync(sourcePath).size === 0) {
  throw new Error(`Storyboard is missing or empty: ${sourcePath}`);
}
if (book.pages.length % 2 !== 0) throw new Error(`${book.id}: storyboard page count must be even`);

function run(args, label) {
  const result = spawnSync("magick", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${label}: ${String(result.stderr || result.stdout).trim()}`);
}

function dimensions(imagePath) {
  const result = spawnSync("magick", ["identify", "-format", "%w %h", imagePath], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Read storyboard dimensions: ${String(result.stderr || result.stdout).trim()}`);
  const [width, height] = String(result.stdout).trim().split(/\s+/).map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error(`Invalid storyboard dimensions: ${result.stdout}`);
  return { width, height };
}

const { width, height } = dimensions(sourcePath);
const requestedMatch = requestedLayout?.match(/^(\d+)x(\d+)$/);
if (requestedLayout && !requestedMatch) throw new Error(`Invalid layout ${requestedLayout}; expected <columns>x<rows>`);
const columns = requestedMatch ? Number(requestedMatch[1]) : width > height ? book.pages.length / 2 : 2;
const rows = requestedMatch ? Number(requestedMatch[2]) : book.pages.length / columns;
if (columns * rows !== book.pages.length) {
  throw new Error(`${book.id}: layout ${columns}x${rows} does not match ${book.pages.length} pages`);
}
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), `${book.id}-`));
const temporaryPattern = path.join(temporaryDirectory, "panel-%d.png");
run([sourcePath, "-crop", `${columns}x${rows}@`, "+repage", temporaryPattern], "Split storyboard");

const outputDirectory = path.join(
  repositoryRoot,
  "public",
  "guided-reading",
  "series",
  book.seriesId,
  `book-${String(book.bookNumber).padStart(2, "0")}`
);
fs.mkdirSync(outputDirectory, { recursive: true });

for (let index = 0; index < book.pages.length; index += 1) {
  const panelPath = path.join(temporaryDirectory, `panel-${index}.png`);
  if (!fs.existsSync(panelPath)) throw new Error(`${book.id}: missing cropped panel ${index + 1}`);
  const outputPath = path.join(outputDirectory, `page-${String(index + 1).padStart(3, "0")}.webp`);
  run([
    panelPath,
    "-fuzz", "8%",
    "-trim", "+repage",
    "-resize", "1536x1024^",
    "-gravity", "center",
    "-extent", "1536x1024",
    "-quality", "88",
    outputPath
  ], `Render page ${index + 1}`);
  if (fs.statSync(outputPath).size === 0) throw new Error(`${book.id}: empty page ${index + 1}`);
}

fs.copyFileSync(
  path.join(outputDirectory, "page-001.webp"),
  path.join(outputDirectory, "cover.webp")
);
fs.rmSync(temporaryDirectory, { recursive: true, force: true });

console.log(`Installed ${book.pages.length} page images and cover for ${book.id}.`);
