#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { collectAppVisualReviewInventory } from "./appVisualReviewInventory.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.resolve(
  process.argv.slice(2).find(argument => !argument.startsWith("--"))
    || path.join(os.tmpdir(), "literacy-path-runtime-image-audit")
);
const includeSourceLiterals = process.argv.includes("--include-source-literals");
const runtimeAdditionsOnly = process.argv.includes("--runtime-additions-only");
const columns = 5;
const rows = 8;
const perSheet = columns * rows;
const tileWidth = 300;
const tileHeight = 250;
const imageWidth = 280;
const imageHeight = 188;

function escapeXml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  }[character]));
}

function wrap(value = "", maxCharacters = 43, maxLines = 3) {
  const words = String(value).split(/(?=[/_-])|\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = `${current}${word}`;
    if (candidate.length <= maxCharacters || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

async function makeTile(row, index) {
  let illustration;
  try {
    illustration = await sharp(row.absolutePath, { animated: false, page: 0 })
      .resize(imageWidth, imageHeight, { fit: "contain", background: "#f5f3ed" })
      .flatten({ background: "#f5f3ed" })
      .png()
      .toBuffer();
  } catch {
    illustration = await sharp({
      create: { width: imageWidth, height: imageHeight, channels: 3, background: "#f6d4d4" }
    }).png().toBuffer();
  }
  const lines = wrap(row.path);
  const areas = row.areas.join(", ");
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${tileHeight}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="10" y="208" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#17202a">${index + 1}</text>
    ${lines.map((line, lineIndex) => `<text x="38" y="${208 + lineIndex * 14}" font-family="Arial, sans-serif" font-size="10.5" fill="#26313b">${escapeXml(line)}</text>`).join("\n")}
    ${areas ? `<text x="10" y="244" font-family="Arial, sans-serif" font-size="9.5" fill="#6b7280">${escapeXml(areas)}</text>` : ""}
  </svg>`);
  return sharp(label).composite([{ input: illustration, left: 10, top: 10 }]).png().toBuffer();
}

let rowsToRender = collectAppVisualReviewInventory(root, { includeSourceLiterals });
if (runtimeAdditionsOnly) {
  const baselinePaths = new Set(
    collectAppVisualReviewInventory(root, { includeSourceLiterals, includeRuntimeObjects: false })
      .map(row => row.path)
  );
  rowsToRender = rowsToRender.filter(row => !baselinePaths.has(row.path));
}
fs.mkdirSync(outputRoot, { recursive: true });
const sheets = [];

for (let start = 0; start < rowsToRender.length; start += perSheet) {
  const batch = rowsToRender.slice(start, start + perSheet);
  const tiles = await Promise.all(batch.map((row, index) => makeTile(row, start + index)));
  const rowCount = Math.ceil(batch.length / columns);
  const outputPath = path.join(outputRoot, `sheet-${String(sheets.length + 1).padStart(3, "0")}.jpg`);
  await sharp({
    create: {
      width: columns * tileWidth,
      height: rowCount * tileHeight,
      channels: 3,
      background: "#e5e7eb"
    }
  }).composite(tiles.map((input, index) => ({
    input,
    left: (index % columns) * tileWidth,
    top: Math.floor(index / columns) * tileHeight
  }))).jpeg({ quality: 90 }).toFile(outputPath);
  sheets.push({
    sheet: outputPath,
    firstIndex: start + 1,
    lastIndex: start + batch.length,
    images: batch.map(row => row.path)
  });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  mode: runtimeAdditionsOnly
    ? "runtime-object-additions"
    : includeSourceLiterals
      ? "runtime-registry-plus-source-literals"
      : "runtime-registry",
  imageCount: rowsToRender.length,
  sheetCount: sheets.length,
  images: rowsToRender.map(row => ({
    path: row.path,
    areas: row.areas,
    sources: row.sources
  })),
  sheets
};
fs.writeFileSync(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({
  outputRoot,
  mode: manifest.mode,
  imageCount: manifest.imageCount,
  sheetCount: manifest.sheetCount
}, null, 2));
