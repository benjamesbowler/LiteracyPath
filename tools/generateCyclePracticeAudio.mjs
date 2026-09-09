#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CYCLE_PRACTICE_AUDIO_TEXTS } from "../src/components/cycle-practice/cyclePracticeAudioScripts.js";
import * as cycleContent from "../src/components/cycle-practice/cyclePracticeContent.js";
import { getLedaInstructionAudioPath, getLedaWordAudioPath, normalizeLedaAudioText } from "../src/data/ledaProductionAudio.js";
import { LEDA_PRODUCTION_VOICE } from "../src/data/ledaProductionVoice.js";
import { CYCLE_PRACTICE_AUDIO_METADATA as previousMetadata } from "../src/data/generated/cyclePracticeInstructionAudio.generated.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const voice = LEDA_PRODUCTION_VOICE;
const languageCode = "en-US";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const projectId = process.env.GOOGLE_CLOUD_PROJECT || "project-3c66c1c8-cc9e-4d6d-bdf";
const dryRun = process.argv.includes("--dry-run");
const verifyOnly = process.argv.includes("--verify");
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const hash = value => createHash("sha256").update(value).digest("hex");
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 74);

function outputFor(text, role) {
  const fileName = `${slug(text)}-${hash(`${voice}|${role}|${text}|cycle-practice-v1`).slice(0, 10)}.mp3`;
  const publicPath = `/audio/production/en-US/${role}/${fileName}`;
  return { publicPath, absolutePath: path.join(root, "public", publicPath) };
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
        audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000, speakingRate: 0.94, pitch: 0 }
      })
    });
    if (response.ok) {
      const result = await response.json();
      if (!result.audioContent) throw new Error("Cycle instruction synthesis returned no audio");
      return Buffer.from(result.audioContent, "base64");
    }
    // Never print a request, token or service-account object on failure.
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 6) {
      throw new Error(`Cycle instruction synthesis failed (HTTP ${response.status})`);
    }
    await wait(Math.min(30000, 1200 * (2 ** (attempt - 1))));
  }
  throw new Error("Cycle instruction synthesis retry limit reached");
}

function inspectAudio(absolutePath) {
  const info = JSON.parse(execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels:format=duration", "-of", "json", absolutePath
  ], { encoding: "utf8" }));
  const durationSeconds = Number(info.format?.duration);
  const decoded = spawnSync("ffmpeg", [
    "-hide_banner", "-nostats", "-i", absolutePath, "-af", "volumedetect", "-f", "null", "-"
  ], { encoding: "utf8" });
  const peakMatch = decoded.stderr.match(/max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf)) dB/i);
  const peakDb = Number(peakMatch?.[1]);
  // Use the existing assessment-audio audibility floor, not a quality claim.
  if (decoded.status !== 0 || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isFinite(peakDb) || peakDb <= -40) {
    throw new Error(`Missing, undecodable or inaudible Cycle recording: ${path.basename(absolutePath)}`);
  }
  return { durationSeconds, peakDb, ...info.streams[0] };
}

function normalizeMp3(wavPath, mp3Path) {
  const duration = Number(execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wavPath
  ], { encoding: "utf8" }).trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Generated Cycle recording has no duration");
  // Fade the measured END of the clip. A fade-out at zero silences the speech.
  const result = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", wavPath,
    "-af", `highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,afade=t=out:st=${Math.max(0, duration - 0.025)}:d=0.025`,
    "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", mp3Path
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Cycle audio normalization failed");
}

const contextTexts = Object.values(cycleContent.CYCLE_HFW_CONTEXTS).map(item => item.contextText);
const compoundTexts = cycleContent.CYCLE_WORD_PARTS.flatMap(item => item.parts.map(removed =>
  `Listen. ${item.word}. Take away ${removed}. Tap what is left.`
));
const words = [...new Set([
  ...Object.keys(cycleContent.CYCLE_HFW_CONTEXTS),
  ...cycleContent.CYCLE_WORD_PARTS.flatMap(item => [item.word, ...item.parts]),
  ...(cycleContent.CYCLE_PRACTICE_EXTRA_WORDS || [])
])];
const authoredRows = [
  ...[...new Set([...CYCLE_PRACTICE_AUDIO_TEXTS, ...contextTexts, ...compoundTexts])].map(text => ({ text, role: "instruction" })),
  ...words.map(text => ({ text, role: "isolated_word" }))
];
const rows = authoredRows.map(({ text, role }) => {
  const reusedPath = role === "isolated_word" ? getLedaWordAudioPath(text) : getLedaInstructionAudioPath(text);
  return {
    text, role,
    normalized: normalizeLedaAudioText(text),
    reused: Boolean(reusedPath),
    output: reusedPath ? { publicPath: reusedPath, absolutePath: path.join(root, "public", reusedPath) } : outputFor(text, role)
  };
}).sort((left, right) => left.normalized.localeCompare(right.normalized));

console.log(`Cycle Practice audio: ${rows.length} unique scripts (${rows.filter(row => !row.reused).length} owned recordings)`);
if (dryRun) {
  rows.forEach(row => console.log(`${row.reused ? "reuse" : "make"}: ${row.text}`));
  process.exit(0);
}

const missing = [];
for (const row of rows) {
  if (!(await fs.stat(row.output.absolutePath).catch(() => null))) missing.push(row);
}
if (verifyOnly && missing.length) throw new Error(`${missing.length} Cycle recordings are missing`);
if (missing.some(row => row.reused)) throw new Error("A shared Leda recording is missing; restore the referenced production asset before generation");
const token = missing.length ? execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8" }).trim() : "";
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cycle-practice-audio-"));
const metadata = {};
let decodedCount = 0;
let unchangedCount = 0;
try {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (missing.includes(row)) {
      const wavPath = path.join(tempDir, `${index}.wav`);
      const mp3Path = path.join(tempDir, `${index}.mp3`);
      await fs.writeFile(wavPath, await synthesize(token, row.text));
      normalizeMp3(wavPath, mp3Path);
      inspectAudio(mp3Path);
      await fs.mkdir(path.dirname(row.output.absolutePath), { recursive: true });
      await fs.copyFile(mp3Path, row.output.absolutePath);
      await wait(220);
    }
    const bytes = await fs.readFile(row.output.absolutePath);
    const sha256 = hash(bytes);
    const previous = previousMetadata[row.normalized];
    // Unchanged, previously decoded bytes do not need a fresh media process
    // after every script addition. --verify deliberately bypasses this cache.
    const unchanged = !verifyOnly && previous?.sha256 === sha256
      && previous.audio === row.output.publicPath && previous.voice === voice
      && previous.role === row.role && previous.text === row.text
      && Number.isFinite(previous.durationSeconds) && previous.durationSeconds > 0;
    const decoded = unchanged ? previous : inspectAudio(row.output.absolutePath);
    if (unchanged) unchangedCount += 1;
    else decodedCount += 1;
    metadata[row.normalized] = {
      text: row.text, role: row.role, audio: row.output.publicPath, voice,
      provider: "Google Cloud Text-to-Speech", aiGenerated: true,
      reused: row.reused, sha256,
      durationSeconds: decoded.durationSeconds, humanListening: "unknown"
    };
    if (missing.includes(row)) console.log(`[${index + 1}/${rows.length}] ${decoded.durationSeconds.toFixed(2)}s ${row.text}`);
  }
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
console.log(`Audio integrity: ${decodedCount} decoded; ${unchangedCount} unchanged recordings matched their verified hashes.`);

const audioByText = Object.fromEntries(rows.filter(row => row.role === "instruction").map(row => [row.normalized, row.output.publicPath]));
const wordAudioByText = Object.fromEntries(rows.filter(row => row.role === "isolated_word").map(row => [row.normalized, row.output.publicPath]));
const generatedPath = path.join(root, "src/data/generated/cyclePracticeInstructionAudio.generated.js");
const source = [
  "// AUTO-GENERATED by tools/generateCyclePracticeAudio.mjs. Do not edit.",
  `export const CYCLE_PRACTICE_INSTRUCTION_VOICE = ${JSON.stringify(voice)};`,
  `export const CYCLE_PRACTICE_INSTRUCTION_AUDIO = Object.freeze(${JSON.stringify(audioByText, null, 2)});`,
  `export const CYCLE_PRACTICE_WORD_AUDIO = Object.freeze(${JSON.stringify(wordAudioByText, null, 2)});`,
  `export const CYCLE_PRACTICE_AUDIO_METADATA = Object.freeze(${JSON.stringify(metadata, null, 2)});`,
  ""
].join("\n");
if (verifyOnly) {
  if (await fs.readFile(generatedPath, "utf8") !== source) throw new Error("Cycle audio manifest is stale; run the generator");
  console.log("Cycle Practice recordings and manifest verified. Human-listening quality remains unknown.");
} else {
  await fs.writeFile(generatedPath, source);
  console.log(`Generated ${path.relative(root, generatedPath)}. Human-listening quality remains unknown.`);
}
