#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseWorldDiscoverySourceArgs, readWorldDiscoverySource } from "./worldDiscoverySourceLib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function prepareWorldDiscoveryNarration({ outputDir, ...sourceOptions } = {}) {
  const source = readWorldDiscoverySource({ ...sourceOptions, requireReviews: true });
  const { books } = source;
  const originalOutput = path.join(root, ".artifacts/world-discovery/audio");
  const dir = path.resolve(root, outputDir || originalOutput);
  if (source.isolated && (!outputDir || dir === originalOutput)) throw Error("Isolated narration requires a separate explicit --output-dir; original production evidence is preserved");

  // The existing unpublished-manuscript producer records exact page text and its
  // missing word taps. Title-only production rows ensure titles receive the same
  // service without changing the runtime page sequence or publishing dummy books.
  const manuscript = books.flatMap(book => [
    {
      id: book.id.replace("world-discovery-", "world-discovery-unpublished-"),
      title: book.title, level: book.level, narrationProfile: "leda", active: true,
      sourceBookId: book.id,
      pages: book.pages.map(page => ({ pageNumber: page.pageNumber, text: page.text, pageAudioText: page.text, active: true, narrationNeedsRebuild: true }))
    },
    {
      id: book.id.replace("world-discovery-", "world-discovery-unpublished-title-"),
      title: book.title, level: book.level, narrationProfile: "leda", active: true,
      sourceBookId: book.id, productionRole: "title-only-not-a-runtime-book",
      pages: [{ pageNumber: 1, text: book.title, pageAudioText: book.title, active: true, narrationNeedsRebuild: true }]
    }
  ]);
  const bytes = JSON.stringify(manuscript, null, 2) + "\n";
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const filename = source.isolated ? `reviewed-manuscript-${sha256}.json` : "reviewed-manuscript.json";
  const file = path.join(dir, filename);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, bytes);
  fs.writeFileSync(file.replace(/\.json$/, ".sha256"), sha256 + "\n");
  return { books: books.length, pages: books.reduce((count, book) => count + book.pages.length, 0), titleClips: books.length, file: path.relative(root, file), sha256, voice: "en-US-Chirp3-HD-Leda", bookPrefix: "world-discovery-unpublished-", sourceDir: source.directory, firstNumber: source.firstNumber, lastNumber: source.lastNumber };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { options, remaining } = parseWorldDiscoverySourceArgs(process.argv.slice(2), { allowOutputDir: true });
  if (remaining.length) throw Error("Usage: prepareWorldDiscoveryNarration.mjs [--source-dir DIR --first-number 11 --last-number 20 --output-dir DIR]");
  console.log(JSON.stringify(prepareWorldDiscoveryNarration(options)));
}
