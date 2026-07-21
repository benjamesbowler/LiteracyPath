#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { storyQuests } from "../src/data/storyQuests.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.resolve(process.argv[2] || path.join(os.tmpdir(), "literacy-path-story-quest-audit"));
const columns = 4;
const tileWidth = 400;
const imageWidth = 376;
const imageHeight = 212;
const labelHeight = 104;
const tileHeight = imageHeight + labelHeight + 24;

function cleanAssetPath(value = "") {
  return String(value).split("?")[0].split("#")[0];
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrap(value, max = 54, maxLines = 3) {
  const words = String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= max || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[. ]+$/, "")}…`;
  }
  return lines;
}

function slug(value = "quest") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pageText(page) {
  const text = Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
  const choices = (page.choices || []).map(choice => choice.label).filter(Boolean);
  return choices.length ? `${text} Choices: ${choices.join(" / ")}` : text;
}

async function makeTile(row, index) {
  const absoluteImage = path.join(root, "public", cleanAssetPath(row.imageUrl));
  const image = await sharp(absoluteImage)
    .resize(imageWidth, imageHeight, { fit: "contain", background: "#f3f4f6" })
    .flatten({ background: "#f3f4f6" })
    .png()
    .toBuffer();

  const lines = wrap(pageText(row), 54, 3);
  const filename = path.basename(cleanAssetPath(row.imageUrl));
  const svg = `
    <svg width="${tileWidth}" height="${tileHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="12" fill="#ffffff"/>
      <rect x="12" y="12" width="${imageWidth}" height="${imageHeight}" rx="8" fill="#f3f4f6"/>
      <text x="16" y="248" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#111827">${escapeXml(`${index + 1}. ${row.id || filename}`)}</text>
      <text x="16" y="270" font-family="Arial, sans-serif" font-size="12" fill="#4b5563">${escapeXml(filename)}</text>
      ${lines.map((line, lineIndex) => `<text x="16" y="${292 + lineIndex * 15}" font-family="Arial, sans-serif" font-size="11" fill="#374151">${escapeXml(line)}</text>`).join("\n")}
    </svg>`;

  return sharp(Buffer.from(svg))
    .composite([{ input: image, left: 12, top: 12 }])
    .png()
    .toBuffer();
}

async function buildQuestSheet(quest) {
  const rows = (quest.pages || []).filter(page => page.imageUrl || page.imagePath);
  const tileBuffers = await Promise.all(rows.map((row, index) => makeTile({ ...row, imageUrl: row.imageUrl || row.imagePath }, index)));
  const rowCount = Math.ceil(tileBuffers.length / columns);
  const sheetWidth = columns * tileWidth + 24;
  const headerHeight = 84;
  const sheetHeight = headerHeight + rowCount * tileHeight + 24;
  const header = Buffer.from(`
    <svg width="${sheetWidth}" height="${sheetHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="24" y="36" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#111827">${escapeXml(quest.title)}</text>
      <text x="24" y="61" font-family="Arial, sans-serif" font-size="14" fill="#4b5563">${escapeXml(`${quest.level || ""} · ${rows.length} active scene images · ${quest.id}`)}</text>
    </svg>`);
  const composites = tileBuffers.map((input, index) => ({
    input,
    left: 12 + (index % columns) * tileWidth,
    top: headerHeight + Math.floor(index / columns) * tileHeight
  }));
  const outputPath = path.join(outputRoot, `${slug(quest.title)}.png`);
  await sharp(header).composite(composites).png().toFile(outputPath);
  return outputPath;
}

fs.mkdirSync(outputRoot, { recursive: true });
const outputs = [];
for (const quest of storyQuests) outputs.push(await buildQuestSheet(quest));

const manifest = storyQuests.map((quest, questIndex) => ({
  id: quest.id,
  title: quest.title,
  level: quest.level,
  characters: quest.characters || [],
  sheet: outputs[questIndex],
  pages: (quest.pages || []).map((page, pageIndex) => ({
    pageIndex: pageIndex + 1,
    id: page.id,
    text: Array.isArray(page.text) ? page.text : [page.text].filter(Boolean),
    choices: (page.choices || []).map(choice => ({ label: choice.label, nextPageId: choice.nextPageId })),
    imageUrl: page.imageUrl || page.imagePath || ""
  }))
}));
fs.writeFileSync(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Story Quest visual audit sheets: ${outputs.length}`);
console.log(`Output: ${outputRoot}`);
outputs.forEach(output => console.log(path.relative(root, output)));
