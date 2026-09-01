#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SOUND_SEEKERS_INSTRUCTIONS } from "../src/features/soundSeekers/content/instructionContracts.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, "public/audio/quest-v2/instructions");
const sourcePath = path.join(outputDirectory, "SOURCE.md");
const voice = "en-US-Chirp3-HD-Leda";
const model = "Google Cloud Text-to-Speech Chirp3 HD";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const projectId = process.env.GOOGLE_CLOUD_PROJECT || "project-3c66c1c8-cc9e-4d6d-bdf";
const dryRun = process.argv.includes("--dry-run");
const keepSource = process.argv.includes("--keep-source");

function publicPath(instructionId) {
  return `/audio/quest-v2/instructions/${instructionId}.mp3`;
}

function sha256(file) {
  return createHash("sha256").update(file).digest("hex");
}

function command(commandName, args, label) {
  const result = spawnSync(commandName, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${label}: ${result.stderr || result.stdout || "command failed"}`);
  return result.stdout.trim();
}

function durationSeconds(filePath) {
  const duration = Number(command("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath
  ], "ffprobe failed"));
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Instruction audio is silent or invalid: ${filePath}`);
  return Number(duration.toFixed(3));
}

function meanVolumeDb(filePath) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-i", filePath, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
  const output = `${result.stdout}\n${result.stderr}`;
  const match = /mean_volume:\s*(-?[\d.]+) dB/u.exec(output);
  const mean = Number(match?.[1]);
  if (result.status !== 0 || !Number.isFinite(mean) || mean <= -70) {
    throw new Error(`Instruction audio has no measurable signal: ${filePath}`);
  }
  return Number(mean.toFixed(2));
}

function normalizeWave(wavPath, mp3Path) {
  command("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", wavPath,
    "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", mp3Path
  ], "ffmpeg normalization failed");
}

async function accessToken() {
  return execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8" }).trim();
}

async function synthesize(token, text) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "en-US", name: voice },
      audioConfig: { audioEncoding: "MP3", speakingRate: 0.94, pitch: 0 }
    })
  });
  if (!response.ok) throw new Error(`Google Text-to-Speech ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const audioContent = (await response.json()).audioContent;
  if (!audioContent) throw new Error("Google Text-to-Speech returned no audio content");
  return Buffer.from(audioContent, "base64");
}

function renderSourceManifest(assets) {
  const manifest = {
    schemaVersion: 1,
    source: "Google Cloud Text-to-Speech",
    voice,
    model,
    generatedAt: new Date().toISOString(),
    assets
  };
  return `# Sound Seekers instruction audio provenance\n\nThese are production-path candidates. Automated checks verify file identity and audibility; direct listening remains open.\n\n\`\`\`json\n${JSON.stringify(manifest, null, 2)}\n\`\`\`\n`;
}

async function priorAssets() {
  const source = await readFile(sourcePath, "utf8").catch(() => "");
  const match = /```json\n([\s\S]*?)\n```/u.exec(source);
  if (!match) return new Map();
  const assets = JSON.parse(match[1])?.assets;
  return new Map((Array.isArray(assets) ? assets : []).map(asset => [asset.instructionId, asset]));
}

const contracts = Object.values(SOUND_SEEKERS_INSTRUCTIONS)
  .filter(contract => !contract.silenceIsIntentional)
  .sort((left, right) => left.instructionId.localeCompare(right.instructionId));

await mkdir(outputDirectory, { recursive: true });
const previousAssets = await priorAssets();
const force = process.argv.includes("--force");
const missing = [];
for (const contract of contracts) {
  const mp3Path = path.join(outputDirectory, `${contract.instructionId}.mp3`);
  const existing = await stat(mp3Path).catch(() => null);
  const previous = previousAssets.get(contract.instructionId);
  const existingHash = existing ? sha256(await readFile(mp3Path)) : "";
  const provenanceMatches = previous
    && previous.childText === contract.childText
    && previous.voice === voice
    && previous.model === model
    && previous.path === publicPath(contract.instructionId)
    && previous.sha256 === existingHash;
  if (!existing || force || !provenanceMatches || (() => { try { return meanVolumeDb(mp3Path) <= -70; } catch { return true; } })()) {
    missing.push({ contract, mp3Path });
  }
}

if (dryRun) {
  console.log(`Sound Seekers instruction inventory: ${contracts.length} contracts, ${missing.length} missing.`);
  process.exit(0);
}

const token = missing.length ? await accessToken() : "";
for (const [index, item] of missing.entries()) {
  const wavPath = `${item.mp3Path}.tmp.source.mp3`;
  const tempMp3Path = `${item.mp3Path}.tmp.mp3`;
  try {
    await writeFile(wavPath, await synthesize(token, item.contract.childText));
    if (keepSource) {
      const debugDirectory = path.join(repositoryRoot, ".artifacts/sound-seekers-instruction-audio-source");
      await mkdir(debugDirectory, { recursive: true });
      await writeFile(path.join(debugDirectory, `${item.contract.instructionId}.source.mp3`), await readFile(wavPath));
    }
    normalizeWave(wavPath, tempMp3Path);
    durationSeconds(tempMp3Path);
    await rename(tempMp3Path, item.mp3Path);
  } finally {
    await unlink(wavPath).catch(() => {});
    await unlink(tempMp3Path).catch(() => {});
  }
  console.log(`[${index + 1}/${missing.length}] ${publicPath(item.contract.instructionId)}`);
}

const assets = [];
for (const contract of contracts) {
  const mp3Path = path.join(outputDirectory, `${contract.instructionId}.mp3`);
  const file = await readFile(mp3Path);
  const fileStat = await stat(mp3Path);
  const previous = previousAssets.get(contract.instructionId);
  assets.push({
    instructionId: contract.instructionId,
    childText: contract.childText,
    path: publicPath(contract.instructionId),
    voice,
    model,
    generatedAt: previous?.childText === contract.childText
      && previous.voice === voice
      && previous.model === model
      && previous.path === publicPath(contract.instructionId)
      && previous.sha256 === sha256(file)
      ? previous.generatedAt
      : fileStat.mtime.toISOString(),
    durationSeconds: durationSeconds(mp3Path),
    sha256: sha256(file),
    meanVolumeDb: meanVolumeDb(mp3Path),
    automatedSignalChecks: ["ffprobe-duration", "ffmpeg-volumedetect", "sha256"],
    humanListeningApproved: false
  });
}
await writeFile(sourcePath, renderSourceManifest(assets));
console.log(`Sound Seekers instruction audio complete: ${assets.length} clips.`);
