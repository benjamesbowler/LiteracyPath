#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const inputDirectory = path.resolve(process.argv[2] || "");
const outputDirectory = path.resolve(process.argv[3] || "");
const perSheet = 4;
const columns = 2;
const cellWidth = 800;
const cellHeight = 1120;
const IMAGE_PATTERN = /\.(?:png|jpe?g|webp)$/i;

if (!fs.existsSync(inputDirectory) || !process.argv[3]) {
  console.error("Usage: node tools/buildImageAuditMetaSheets.mjs INPUT_DIRECTORY OUTPUT_DIRECTORY");
  process.exit(1);
}

const files = fs.readdirSync(inputDirectory)
  .filter(file => IMAGE_PATTERN.test(file))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

fs.mkdirSync(outputDirectory, { recursive: true });
const sheets = [];

for (let start = 0; start < files.length; start += perSheet) {
  const batch = files.slice(start, start + perSheet);
  const cells = await Promise.all(batch.map(async file => {
    const input = path.join(inputDirectory, file);
    return sharp(input)
      .resize(cellWidth - 20, cellHeight - 20, {
        fit: "contain",
        position: "top",
        background: "#eceff1",
        withoutEnlargement: true
      })
      .flatten({ background: "#eceff1" })
      .jpeg({ quality: 91 })
      .toBuffer();
  }));
  const rowCount = Math.ceil(batch.length / columns);
  const output = path.join(outputDirectory, `meta-${String(sheets.length + 1).padStart(3, "0")}.jpg`);
  await sharp({
    create: {
      width: columns * cellWidth,
      height: rowCount * cellHeight,
      channels: 3,
      background: "#d9dee2"
    }
  }).composite(cells.map((input, index) => ({
    input,
    left: (index % columns) * cellWidth + 10,
    top: Math.floor(index / columns) * cellHeight + 10
  }))).jpeg({ quality: 91 }).toFile(output);
  sheets.push({ output, files: batch });
}

fs.writeFileSync(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ inputDirectory, imageCount: files.length, sheetCount: sheets.length, sheets }, null, 2)}\n`
);
console.log(JSON.stringify({ imageCount: files.length, sheetCount: sheets.length, outputDirectory }, null, 2));
