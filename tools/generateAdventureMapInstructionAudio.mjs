#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getLedaInstructionAudioPath,
  normalizeLedaAudioText
} from "../src/data/ledaProductionAudio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const voice = "en-US-Chirp3-HD-Leda";
const languageCode = "en-US";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const projectId = process.env.GOOGLE_CLOUD_PROJECT || "project-3c66c1c8-cc9e-4d6d-bdf";
const dryRun = process.argv.includes("--dry-run");
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const hash = value => createHash("sha256").update(value).digest("hex").slice(0, 10);
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 74);

const instructionTexts = Object.freeze([
  "Listen to the letter. Tap its matching big or small letter.",
  "Listen. Find the letter that matches the sound.",
  "Listen to the sound. Tap the picture that starts with it.",
  "Listen then tap the matching word.",
  "Build the word. Fill each box in order.",
  "Listen to the word. Build it with the letter cards.",
  "Listen to the word. Change its first sound. Tap the new word.",
  "Take away the first sound. Tap what is left.",
  "Join the two small words. Tap the big word they make.",
  "Find the target word in the poem.",
  "Look at the book cover. Tap the character whose story it is.",
  "Watch the letter. Then trace it with your finger.",
  "Tap all the words that end with the letter Y.",
  "Tap all the words that end with A Y.",
  "Tap all the words that end with L L.",
  "Tap all the words that have N G.",
  "Tap all the words that start with S H.",
  "Tap all the words that end with C K.",
  "Listen to the new word. Tap the missing letter.",
  "Read the word. Tap it when you know it."
]);

function outputFor(text) {
  const fileName = `${slug(text)}-${hash(`${voice}|instruction|${text}`)}.mp3`;
  const publicDir = "/audio/production/en-US/instruction";
  return {
    absoluteDir: path.join(root, "public", publicDir),
    absolutePath: path.join(root, "public", publicDir, fileName),
    publicPath: `${publicDir}/${fileName}`
  };
}

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
        voice: { languageCode, name: voice },
        audioConfig: {
          audioEncoding: "LINEAR16",
          sampleRateHertz: 24000,
          speakingRate: 0.94,
          pitch: 0
        }
      })
    });
    if (response.ok) return Buffer.from((await response.json()).audioContent, "base64");
    const detail = await response.text();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 6) {
      throw new Error(`Adventure instruction synthesis failed (${response.status}): ${detail.slice(0, 500)}`);
    }
    await wait(Math.min(30000, 1200 * (2 ** (attempt - 1))));
  }
  throw new Error("Unreachable Adventure instruction synthesis state");
}

function normalizeMp3(wavPath, mp3Path) {
  const result = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", wavPath,
    "-af", "highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,afade=t=out:st=0:d=0.025",
    "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", mp3Path
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg normalization failed");
}

const rows = instructionTexts.map(text => {
  const existing = getLedaInstructionAudioPath(text);
  return {
    text,
    normalized: normalizeLedaAudioText(text),
    output: existing ? { publicPath: existing } : outputFor(text),
    existing: Boolean(existing)
  };
});

console.log(`Adventure Map instructions: ${rows.length} (${rows.filter(row => !row.existing).length} new)`);
if (dryRun) {
  rows.forEach(row => console.log(`${row.existing ? "reuse" : "make"}: ${row.text}`));
  process.exit(0);
}

const generatedRows = rows.filter(row => !row.existing);
const rowsToSynthesize = [];
for (const row of generatedRows) {
  if (!(await fs.stat(row.output.absolutePath).catch(() => null))) rowsToSynthesize.push(row);
}
const token = rowsToSynthesize.length
  ? execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8" }).trim()
  : "";
for (let index = 0; index < generatedRows.length; index += 1) {
  const row = generatedRows[index];
  await fs.mkdir(row.output.absoluteDir, { recursive: true });
  if (rowsToSynthesize.includes(row)) {
    const wavPath = row.output.absolutePath.replace(/\.mp3$/, ".wav");
    await fs.writeFile(wavPath, await synthesize(token, row.text));
    normalizeMp3(wavPath, row.output.absolutePath);
    await fs.unlink(wavPath);
    await wait(220);
  }
  console.log(`[${index + 1}/${generatedRows.length}] ${row.output.publicPath}`);
}

const audioByText = Object.fromEntries(rows
  .sort((left, right) => left.normalized.localeCompare(right.normalized))
  .map(row => [row.normalized, row.output.publicPath]));
const generatedPath = path.join(root, "src/data/generated/adventureMapInstructionAudio.generated.js");
const source = [
  "// AUTO-GENERATED by tools/generateAdventureMapInstructionAudio.mjs. Do not edit.",
  `export const ADVENTURE_MAP_INSTRUCTION_VOICE = ${JSON.stringify(voice)};`,
  `export const ADVENTURE_MAP_INSTRUCTION_AUDIO = Object.freeze(${JSON.stringify(audioByText, null, 2)});`,
  ""
].join("\n");
await fs.writeFile(generatedPath, source);
console.log(`Generated ${path.relative(root, generatedPath)}.`);
