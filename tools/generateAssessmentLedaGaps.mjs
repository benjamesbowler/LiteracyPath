#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSpokenCloze as spokenCloze } from "../src/utils/assessmentSpokenText.js";
import { buildAssessmentSpeechInput } from "./assessmentSpeechInput.mjs";

import {
  getLedaProductionAudioPath,
  getLedaWordAudioPath,
  normalizeLedaAudioText
} from "../src/data/ledaProductionAudio.js";
import { ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE } from "../src/data/generated/assessmentLedaGaps.generated.js";
import { CHILD_WORD_AUDIO_OVERRIDES } from "../src/data/childWordAudioOverrides.js";
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
const repairSilent = process.argv.includes("--repair-silent");
const repairMissing = process.argv.includes("--repair-missing");
const repairCloze = process.argv.includes("--repair-cloze");
// Repair changed SSML delivery without re-synthesizing already-current gaps.
const repairChangedSsml = process.argv.includes("--repair-changed-ssml");
const filesOnly = process.argv.includes("--files-only");
// Prepare exact recordings before publication. A new bank cannot pass its
// audio gate if the generator only sees the previously published questions.
const useAuthored = process.argv.includes("--authored");
// Freeze and record one reviewed bank at a time while other authors work.
// Unselected catalogue entries are preserved by the merge below.
const selectedSkills = process.argv.find(argument => argument.startsWith("--skills="))
  ?.slice("--skills=".length).split(",").filter(Boolean);
const selectSkillIds = ids => {
  if (!selectedSkills) return ids;
  for (const skill of selectedSkills) {
    if (!ids.includes(skill)) throw new Error(`Unknown assessment skill: ${skill}`);
  }
  return ids.filter(skill => selectedSkills.includes(skill));
};
const integerArgument = name => {
  const prefix = `--${name}=`;
  const raw = process.argv.find(argument => argument.startsWith(prefix))?.slice(prefix.length);
  if (raw == null) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
};
const fromIndex = integerArgument("from-index") ?? 0;
const toIndex = integerArgument("to-index");
const concurrency = integerArgument("concurrency") ?? 1;
if (concurrency < 1 || concurrency > 4) throw new Error("concurrency must be 1 through 4");
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const hash = value => createHash("sha256").update(value).digest("hex").slice(0, 10);
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 74) || "assessment-audio";

const rolePriority = Object.freeze({ assessment_passage: 1, assessment_prompt: 2, isolated_word: 3 });
const requested = new Map();
const audibilityByPath = new Map();
function request(role, text) {
  const exactText = String(text || "").trim();
  const normalized = normalizeLedaAudioText(exactText);
  if (!normalized) return;
  const existingPath = role === "isolated_word"
    ? getLedaWordAudioPath(exactText) : getLedaProductionAudioPath(exactText);
  if (existingPath) {
    const absolutePath = path.join(root, "public", existingPath.replace(/^\//, ""));
    const mappedRole = existingPath.match(/^\/audio\/production\/en-US\/([^/]+)\//)?.[1];
    const changedSsml = repairChangedSsml && buildAssessmentSpeechInput(exactText).ssml
      && outputFor({ role: mappedRole, exactText }).publicPath !== existingPath;
    const forceRegenerate = (repairCloze && exactText.includes("…")) ||
      changedSsml ||
      (repairMissing && !existsSync(absolutePath));
    if (!repairSilent && !forceRegenerate) return;
    if (!forceRegenerate && !audibilityByPath.has(existingPath)) {
      audibilityByPath.set(existingPath, isAudibleMp3(absolutePath));
    }
    if (!forceRegenerate && audibilityByPath.get(existingPath)) return;
    if (CHILD_WORD_AUDIO_OVERRIDES[normalized] === existingPath) {
      throw new Error(`Repair the reviewed child-word override explicitly; the assessment gap map cannot replace it: ${exactText}`);
    }
    if (!new Set(["supplemental", "isolated_word", "letter_name", "assessment_prompt", "assessment_passage", "instruction", "guided_page", "story_page", "report"]).has(mappedRole)) {
      throw new Error(`Cannot repair unsupported assessment audio role: ${existingPath}`);
    }
    requested.set(normalized, {
      role: mappedRole,
      exactText,
      normalized,
      // A changed URL can reuse its validated pilot/interrupted-run output.
      forceRegenerate: !changedSsml || (repairCloze && exactText.includes("…"))
    });
    return;
  }
  const current = requested.get(normalized);
  if (!current || rolePriority[role] > rolePriority[current.role]) requested.set(normalized, { role, exactText, normalized });
}

const banks = useAuthored ? await (async () => {
  const { expandBank, makeImageResolver, AUTHORING_DIR } = await import("./assessmentRebuild/lib.mjs");
  const { skillBlueprints } = await import("../src/content/blueprints/skillBlueprints.js");
  return Promise.all(selectSkillIds(Object.keys(skillBlueprints)).map(async skill => {
    const source = (await import(path.join(AUTHORING_DIR, `${skill}.mjs`))).default;
    return expandBank(source, skillBlueprints[skill], source.imageResolver || makeImageResolver());
  }));
})() : await Promise.all(selectSkillIds(listV3PublishedSkillIds()).map(importV3Bank));
for (const item of banks.flat()) {
  request("assessment_prompt", spokenCloze(item.spokenPrompt || item.prompt));
  if (item.sentence) request("assessment_prompt", spokenCloze(item.sentence));
  if (item.passage) request("assessment_passage", item.passage);
  for (const card of item.imageCards || []) request("isolated_word", card.word);
  for (const choice of item.choices || []) request("isolated_word", choice);
  if (!item.suppressStimulusAudio && item.targetWord && !/[/_]/.test(item.targetWord)) request("isolated_word", item.targetWord);
}

function outputFor(record) {
  const input = buildAssessmentSpeechInput(record.exactText);
  // Changed delivery instructions must get a new URL; cached text-synthesis
  // recordings must not survive an SSML repair on a returning child's device.
  const deliverySignature = input.ssml ? `|${JSON.stringify(input)}` : "";
  const fingerprint = hash(`${voice}|${record.role}|${record.exactText}${deliverySignature}`);
  const fileName = `${slug(record.exactText)}-${fingerprint}.mp3`;
  const publicDir = `/audio/production/en-US/${record.role}`;
  return {
    absoluteDir: path.join(root, "public", publicDir),
    absolutePath: path.join(root, "public", publicDir, fileName),
    publicPath: `${publicDir}/${fileName}`
  };
}

let accessToken = "";
function refreshAccessToken() {
  accessToken = execFileSync(
    "gcloud",
    ["auth", "application-default", "print-access-token"],
    { encoding: "utf8" }
  ).trim();
  if (!accessToken) throw new Error("gcloud returned an empty application-default access token");
  return accessToken;
}

async function synthesize(text) {
  let authRefreshes = 0;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken || refreshAccessToken()}`,
          "Content-Type": "application/json; charset=utf-8",
          "x-goog-user-project": projectId
        },
        body: JSON.stringify({
          input: buildAssessmentSpeechInput(text),
          voice: { languageCode, name: voice },
          audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000, speakingRate: 0.94, pitch: 0 }
        })
      });
    } catch (error) {
      if (attempt === 6) throw error;
      await wait(Math.min(30000, 1200 * (2 ** (attempt - 1))));
      continue;
    }
    if (response.ok) {
      try {
        const payload = await response.json();
        if (!payload.audioContent) throw new Error("Leda synthesis returned no audioContent");
        return Buffer.from(payload.audioContent, "base64");
      } catch (error) {
        if (attempt === 6) throw error;
        await wait(Math.min(30000, 1200 * (2 ** (attempt - 1))));
        continue;
      }
    }
    const detail = await response.text();
    if (response.status === 401 && authRefreshes < 2) {
      refreshAccessToken();
      authRefreshes += 1;
      attempt -= 1;
      continue;
    }
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
    "-af", "highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,areverse,afade=t=in:st=0:d=0.025,areverse",
    "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", mp3Path
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg normalization failed");
}

function isAudibleMp3(mp3Path) {
  const result = spawnSync("ffmpeg", [
    "-hide_banner", "-nostats", "-i", mp3Path,
    "-af", "volumedetect", "-f", "null", "-"
  ], { encoding: "utf8" });
  const match = result.stderr?.match(/max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf)) dB/i);
  const peakDb = match && match[1].toLowerCase() !== "-inf" ? Number(match[1]) : Number.NEGATIVE_INFINITY;
  return result.status === 0 && Number.isFinite(peakDb) && peakDb > -40;
}

const allRows = [...requested.values()].sort((left, right) => left.normalized.localeCompare(right.normalized));
const rows = allRows.slice(fromIndex, toIndex ?? allRows.length);
console.log(`Assessment Leda gaps: ${allRows.length}; processing ${rows.length} (${fromIndex}..${fromIndex + rows.length})`);
if (dryRun) {
  rows.forEach((row, index) => console.log(`[${index + 1}/${rows.length}] ${row.role}: ${row.exactText}`));
  process.exit(0);
}

const generated = [];
let nextIndex = 0;
async function generateRow(index) {
  const record = rows[index];
  const output = outputFor(record);
  await fs.mkdir(output.absoluteDir, { recursive: true });
  const existing = await fs.stat(output.absolutePath).catch(() => null);
  if (existing && !isAudibleMp3(output.absolutePath)) await fs.rm(output.absolutePath, { force: true });
  if (record.forceRegenerate || !(await fs.stat(output.absolutePath).catch(() => null))) {
    const wavPath = output.absolutePath.replace(/\.mp3$/, ".tmp.wav");
    const mp3Path = output.absolutePath.replace(/\.mp3$/, ".tmp.mp3");
    await fs.rm(wavPath, { force: true });
    await fs.rm(mp3Path, { force: true });
    try {
      await fs.writeFile(wavPath, await synthesize(record.exactText));
      normalizeMp3(wavPath, mp3Path);
      if (!isAudibleMp3(mp3Path)) {
        throw new Error(`Generated assessment audio is inaudible: ${output.publicPath}`);
      }
      await fs.rename(mp3Path, output.absolutePath);
    } finally {
      await fs.rm(wavPath, { force: true });
      await fs.rm(mp3Path, { force: true });
    }
    await wait(220);
  }
  generated.push({ ...record, publicPath: output.publicPath });
  console.log(`[${index + 1}/${rows.length}] ${record.role} -> ${output.publicPath}`);
}
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (nextIndex < rows.length) await generateRow(nextIndex++);
}));
generated.sort((left, right) => left.normalized.localeCompare(right.normalized));

const byRole = Object.fromEntries(
  Object.entries(ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE).map(([role, records]) => [
    role,
    // This map is also consumed by reading and games. Refreshing one content
    // family must preserve recordings still used by those other surfaces.
    { ...records }
  ])
);
if (filesOnly) {
  console.log(`Generated or validated ${generated.length} assessment Leda files without updating the shared map.`);
  process.exit(0);
}
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
const generatedTempPath = `${generatedPath}.${process.pid}.tmp`;
await fs.writeFile(generatedTempPath, generatedSource);
await fs.rename(generatedTempPath, generatedPath);
await fs.mkdir(path.join(root, ".artifacts", "assessment-rebuild"), { recursive: true });
await fs.writeFile(
  path.join(root, ".artifacts", "assessment-rebuild", "assessment-leda-gaps.json"),
  `${JSON.stringify({ voice, status: "accepted-continuous-review", generated }, null, 2)}\n`
);
console.log(`Generated ${generated.length} assessment Leda clips and ${path.relative(root, generatedPath)}.`);
