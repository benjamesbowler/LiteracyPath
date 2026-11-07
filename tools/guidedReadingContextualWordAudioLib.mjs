import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { GUIDED_READING_CONTEXTUAL_WORD_AUDIO } from "../src/data/guidedReadingContextualWordAudio.js";

export function validateContextualWordAudioEntries(books, { entries = GUIDED_READING_CONTEXTUAL_WORD_AUDIO, root = process.cwd(), verifyFiles = true } = {}) {
  const failures = [], keys = new Set(), byId = new Map(books.map(book => [book.id, book]));
  for (const row of entries) {
    const page = byId.get(row.bookId)?.pages.find(page => page.pageNumber === row.pageNumber);
    const key = `${row.bookId}:${row.pageNumber}:${row.word}`;
    if (keys.has(key)) failures.push(`${key}: duplicate context`);
    keys.add(key);
    const tokens = String(page?.text || "").toLowerCase().replaceAll("’", "'").match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g) || [];
    if (!page || row.pageText !== page.text || !tokens.includes(row.word)) failures.push(`${key}: context does not match exact source page/word`);
    if (row.status !== "reviewed" || row.voiceName !== "en-US-Chirp3-HD-Leda" || !row.pronunciation?.trim()
      || row.pronunciationEncoding !== "PHONETIC_ENCODING_IPA" || !row.reviewNote?.trim()
      || !/^[a-f0-9]{64}$/.test(row.audioSha256 || "") || !/^\/audio\/production\/en-US\/isolated_word\/[a-z0-9-]+\.mp3$/.test(row.audioPath || "")
      || !row.audioPath?.endsWith(`-${row.audioSha256?.slice(0, 10)}.mp3`)) failures.push(`${key}: reviewed pronunciation evidence is incomplete`);
    if (verifyFiles) {
      try {
        const file = path.resolve(root, `public${row.audioPath}`);
        if (!file.startsWith(path.resolve(root, "public/audio/production/en-US/isolated_word") + path.sep)) throw Error("Invalid audio path");
        const digest = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
        if (digest !== row.audioSha256) failures.push(`${key}: contextual audio bytes are stale`);
      } catch { failures.push(`${key}: contextual audio file is missing or invalid`); }
    }
  }
  return failures;
}
