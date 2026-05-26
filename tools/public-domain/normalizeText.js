import fs from "node:fs";
import path from "node:path";
import { ensureDir, parseArgs, repoRoot } from "./shared.js";

function stripGutenbergBoilerplate(text = "") {
  return String(text)
    .replace(/^[\s\S]*?\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i, "")
    .replace(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*$/i, "");
}

export function normalizeText(rawText = "") {
  return stripGutenbergBoilerplate(rawText)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+([.,!?;:])/g, "$1")
    .replace(/\bPage\s+\d+\b/gi, "")
    .replace(/\[Illustration[^\]]*\]/gi, "")
    .replace(/\[[^\]]*(ocr|digitized|google|archive)[^\]]*\]/gi, "")
    .replace(/^\[Transcriber's Notes?:[\s\S]*?\]\s*/i, "")
    .replace(/^E-text prepared by[\s\S]*?(?=\n\n[A-Z][A-Z '\-]+\n)/i, "")
    .replace(/^Produced by[^\n]*(?:\n[^\n]*){0,3}\n+/i, "")
    .replace(/^Note: Project Gutenberg[\s\S]*?(?=\n\n[A-Z][A-Z '\-]+\n)/i, "")
    .split("\n")
    .map(line => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitTextIntoPages(text = "", pageCount = 0) {
  const clean = normalizeText(text);
  if (!clean || !pageCount) return Array.from({ length: pageCount }, () => "");

  const explicitPages = clean
    .split(/\n\s*(?:-{3,}|={3,}|Page\s+\d+)\s*\n/gi)
    .map(page => normalizeText(page))
    .filter(Boolean);
  if (explicitPages.length >= Math.max(2, Math.floor(pageCount * 0.6))) {
    return Array.from({ length: pageCount }, (_, index) => explicitPages[index] || "");
  }

  const paragraphs = clean.split(/\n{2,}/).map(paragraph => normalizeText(paragraph)).filter(Boolean);
  if (!paragraphs.length) return Array.from({ length: pageCount }, () => "");

  const pages = Array.from({ length: pageCount }, () => []);
  paragraphs.forEach((paragraph, index) => {
    const pageIndex = Math.min(pageCount - 1, Math.floor((index / paragraphs.length) * pageCount));
    pages[pageIndex].push(paragraph);
  });
  return pages.map(page => page.join("\n\n"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();
  const input = args.input ? path.resolve(repoRoot, args.input) : "";
  const output = args.output ? path.resolve(repoRoot, args.output) : "";
  if (!input || !output) {
    console.error("Usage: node tools/public-domain/normalizeText.js --input raw.txt --output clean.txt");
    process.exit(1);
  }
  const clean = normalizeText(fs.readFileSync(input, "utf8"));
  ensureDir(path.dirname(output));
  fs.writeFileSync(output, `${clean}\n`, "utf8");
  console.log(`Wrote normalized text: ${output}`);
}
