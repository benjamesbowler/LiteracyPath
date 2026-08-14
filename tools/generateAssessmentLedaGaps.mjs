#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getLedaProductionAudioPath,
  normalizeLedaAudioText
} from "../src/data/ledaProductionAudio.js";
import {
  importV3Bank,
  listV3PublishedSkillIds
} from "../src/data/v3/v3Registry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const voice = "en-US-Chirp3-HD-Leda";
const languageCode = "en-US";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const projectId = process.env.GOOGLE_CLOUD_PROJECT || "project-3c66c1c8-cc9e-4d6d-bdf";
const dryRun = process.argv.includes("--dry-run");
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const hash = value => createHash("sha256").update(value).digest("hex").slice(0, 10);
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 74) || "assessment-audio";

function spokenCloze(text) {
  return String(text || "")
    .replace(/\s*(?:_{2,}|\bhmm\b|\bblank\b)\s*/gi, " … ")
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,;:])/g, "$1")
    .trim();
}

const rolePriority = Object.freeze({ assessment_passage: 1, assessment_prompt: 2, isolated_word: 3 });
const requested = new Map();
function request(role, text) {
  const exactText = String(text || "").trim();
  const normalized = normalizeLedaAudioText(exactText);
  if (!normalized || getLedaProductionAudioPath(exactText)) return;
  const current = requested.get(normalized);
  if (!current || rolePriority[role] > rolePriority[current.role]) requested.set(normalized, { role, exactText, normalized });
}

const banks = await Promise.all(listV3PublishedSkillIds().map(importV3Bank));
for (const item of banks.flat()) {
  request("assessment_prompt", spokenCloze(item.spokenPrompt || item.prompt));
  if (item.sentence) request("assessment_prompt", spokenCloze(item.sentence));
  if (item.passage) request("assessment_passage", item.passage);
  for (const card of item.imageCards || []) request("isolated_word", card.word);
  for (const choice of item.choices || []) request("isolated_word", choice);
  if (item.targetWord && !/[/_]/.test(item.targetWord)) request("isolated_word", item.targetWord);
}

function outputFor(record) {
  const fingerprint = hash(`${voice}|${record.role}|${record.exactText}`);
  const fileName = `${slug(record.exactText)}-${fingerprint}.mp3`;
  const publicDir = `/audio/production/en-US/${record.role}`;
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
        audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000, speakingRate: 0.94, pitch: 0 }
      })
    });
    if (response.ok) return Buffer.from((await response.json()).audioContent, "base64");
    const detail = await response.text();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 6) {
      throw new Error(`Leda synthesis failed (${response.status}): ${detail.slice(0, 500)}`);
    }
    await wait(Math.min(30000, 1200 * (2 ** (attempt - 1))));
  }
  throw new Error("Unreachable Leda synthesis state");
}

function normalizeMp3(wavPath, mp3Path) {
  const result = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", wavPath,
    "-af", "highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,afade=t=out:st=0:d=0.025",
    "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", mp3Path
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg normalization failed");
}

const rows = [...requested.values()].sort((left, right) => left.normalized.localeCompare(right.normalized));
console.log(`Assessment Leda gaps: ${rows.length}`);
if (dryRun) {
  rows.forEach((row, index) => console.log(`[${index + 1}/${rows.length}] ${row.role}: ${row.exactText}`));
  process.exit(0);
}

const token = execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8" }).trim();
const generated = [];
for (let index = 0; index < rows.length; index += 1) {
  const record = rows[index];
  const output = outputFor(record);
  await fs.mkdir(output.absoluteDir, { recursive: true });
  if (!(await fs.stat(output.absolutePath).catch(() => null))) {
    const wavPath = output.absolutePath.replace(/\.mp3$/, ".wav");
    await fs.writeFile(wavPath, await synthesize(token, record.exactText));
    normalizeMp3(wavPath, output.absolutePath);
    await fs.unlink(wavPath);
    await wait(220);
  }
  generated.push({ ...record, publicPath: output.publicPath });
  console.log(`[${index + 1}/${rows.length}] ${record.role} -> ${output.publicPath}`);
}

const byRole = {};
for (const record of generated) {
  byRole[record.role] ||= {};
  byRole[record.role][record.normalized] = record.publicPath;
}
const generatedPath = path.join(root, "src", "data", "generated", "assessmentLedaGaps.generated.js");
const generatedSource = [
  "// AUTO-GENERATED by tools/generateAssessmentLedaGaps.mjs. Do not edit.",
  `export const ASSESSMENT_LEDA_GAP_VOICE = ${JSON.stringify(voice)};`,
  `export const ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE = Object.freeze(${JSON.stringify(byRole, null, 2)});`,
  ""
].join("\n");
await fs.writeFile(generatedPath, generatedSource);
await fs.mkdir(path.join(root, ".artifacts", "assessment-rebuild"), { recursive: true });
await fs.writeFile(
  path.join(root, ".artifacts", "assessment-rebuild", "assessment-leda-gaps.json"),
  `${JSON.stringify({ voice, status: "generated-awaiting-listening-review", generated }, null, 2)}\n`
);
console.log(`Generated ${generated.length} assessment Leda clips and ${path.relative(root, generatedPath)}.`);
