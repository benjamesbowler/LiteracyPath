#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingSelBooksDraft } from "../src/data/guidedReadingSelBooks.draft.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const voice = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const requestedBook = process.argv.find(argument => argument.startsWith("--book="))?.split("=")[1] || "";
const selectedBooks = requestedBook
  ? guidedReadingSelBooksDraft.filter(book => book.id === requestedBook)
  : guidedReadingSelBooksDraft;
if (requestedBook && !selectedBooks.length) throw new Error(`Unknown SEL book: ${requestedBook}`);

const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hash = value => createHash("sha256").update(value).digest("hex").slice(0, 10);
const outputDir = path.join(root, "public/audio/production/en-US/guided_page");
const manifestPath = path.join(root, "docs/content/sel-books/SEL_MEDIA_MANIFEST.json");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function synthesize(token, text) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
        "x-goog-user-project": projectId
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "en-US", name: voice },
        audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
      })
    });
    if (response.ok) return Buffer.from((await response.json()).audioContent, "base64");
    const detail = await response.text();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 6) {
      throw new Error(`Google Leda failed (${response.status}): ${detail.slice(0, 500)}`);
    }
    await wait(Math.min(30000, 1500 * (2 ** (attempt - 1))));
  }
  throw new Error("Unreachable synthesis state");
}

function normalizeMp3(wavPath, mp3Path) {
  const result = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", wavPath,
    "-af", "loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015",
    "-codec:a", "libmp3lame", "-b:a", "128k", mp3Path
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg normalization failed");
}

const token = execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8" }).trim();
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const pages = manifest.pages.filter(page => selectedBooks.some(book => book.id === page.bookId));
await fs.mkdir(outputDir, { recursive: true });

for (let index = 0; index < pages.length; index += 1) {
  const record = pages[index];
  const fileName = `sel-${record.bookId}-page-${String(record.pageNumber).padStart(2, "0")}-${hash(`${voice}|guided_page|${record.exactText}`)}.mp3`;
  const mp3Path = path.join(outputDir, fileName);
  const publicPath = `/audio/production/en-US/guided_page/${fileName}`;
  if (!(await fs.stat(mp3Path).catch(() => null))) {
    const wavPath = mp3Path.replace(/\.mp3$/, ".wav");
    await fs.writeFile(wavPath, await synthesize(token, record.exactText));
    normalizeMp3(wavPath, mp3Path);
    await fs.unlink(wavPath);
    await wait(700);
  }
  record.audioPath = publicPath;
  record.audioVoice = voice;
  record.audioStatus = "generated-awaiting-listening-review";
  console.log(`[${index + 1}/${pages.length}] ${record.bookId} page ${record.pageNumber}`);
}

await fs.writeFile(manifestPath, `${JSON.stringify({ ...manifest, audioVoice: voice }, null, 2)}\n`);
console.log(`Generated/verified ${pages.length} Leda narration files.`);
