import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { storyQuests } from "../src/data/storyQuests.js";
import { normalizeLedaAudioText } from "../src/data/ledaProductionAudio.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, "public/audio/production/en-US/story_page");
const generatedModulePath = path.join(
  repositoryRoot,
  "src/data/generated/storyQuestLedaAudio.generated.js"
);
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const batchSize = 6;
const questIdFlagIndex = process.argv.indexOf("--quest-id");
const selectedQuestId = questIdFlagIndex >= 0 ? process.argv[questIdFlagIndex + 1] : "";

if (questIdFlagIndex >= 0 && !selectedQuestId) {
  throw new Error("--quest-id requires an active Story Quest ID");
}

if (selectedQuestId && !storyQuests.some(quest => quest.id === selectedQuestId)) {
  throw new Error(`Unknown Story Quest ID: ${selectedQuestId}`);
}

function readablePageText(page = {}) {
  return Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function hasNonEmptyFile(filePath) {
  try {
    return (await stat(filePath)).size > 0;
  } catch {
    return false;
  }
}

function run(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let errorText = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", chunk => {
      errorText = `${errorText}${chunk}`.slice(-1600);
    });
    child.once("error", reject);
    child.once("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed: ${errorText}`));
    });
  });
}

async function normalizeWave(record) {
  await run(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      record.wavPath,
      "-af",
      "loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "128k",
      record.mp3Path
    ],
    `Normalize ${record.questId}/${record.pageId}`
  );
  await unlink(record.wavPath);
}

async function synthesize(accessToken, record, attempt = 0) {
  if (await hasNonEmptyFile(record.mp3Path)) return false;
  if (await hasNonEmptyFile(record.wavPath)) {
    await normalizeWave(record);
    return true;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text: record.text },
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
    })
  });

  if (!response.ok) {
    const responseText = await response.text();
    if (response.status === 429 && attempt < 10) {
      const retryAfterSeconds = Number(response.headers.get("retry-after") || 0);
      const delay = Math.min(
        45_000,
        Math.max(retryAfterSeconds * 1000, 5_000 * (2 ** attempt))
      );
      await wait(delay);
      return synthesize(accessToken, record, attempt + 1);
    }
    throw new Error(
      `${record.questId}/${record.pageId} failed with ${response.status}: ${responseText.slice(0, 1000)}`
    );
  }

  const result = await response.json();
  await writeFile(record.wavPath, Buffer.from(result.audioContent, "base64"));
  await normalizeWave(record);
  return true;
}

await mkdir(outputDirectory, { recursive: true });

const records = storyQuests.flatMap(quest =>
  (quest.pages || []).map(page => {
    const text = readablePageText(page).trim();
    const key = normalizeLedaAudioText(text);
    const id = `${slug(key) || "story-page"}-${hash(`${voiceName}|story_page|${key}`)}`;
    return {
      questId: quest.id,
      pageId: page.id,
      key,
      text,
      wavPath: path.join(outputDirectory, `${id}.wav`),
      mp3Path: path.join(outputDirectory, `${id}.mp3`),
      publicPath: `/audio/production/en-US/story_page/${id}.mp3`
    };
  })
);

const selectedRecords = selectedQuestId
  ? records.filter(record => record.questId === selectedQuestId)
  : records;

const duplicateKeys = records.filter(
  (record, index) => records.findIndex(candidate => candidate.key === record.key) !== index
);
if (duplicateKeys.length) {
  const conflicting = duplicateKeys.filter(record =>
    records.find(candidate => candidate.key === record.key)?.text !== record.text
  );
  if (conflicting.length) {
    throw new Error(`Story page normalization collision: ${conflicting[0].key}`);
  }
}

const uniqueRecords = records.filter(
  (record, index) => records.findIndex(candidate => candidate.key === record.key) === index
);
const missingRecords = [];
for (const record of selectedRecords.filter(
  (candidate, index, candidates) =>
    candidates.findIndex(other => other.key === candidate.key) === index
)) {
  if (!(await hasNonEmptyFile(record.mp3Path))) missingRecords.push(record);
}

let accessToken = "";
if (missingRecords.length) {
  accessToken = execFileSync(
    "gcloud",
    ["auth", "application-default", "print-access-token"],
    { encoding: "utf8" }
  ).trim();
}

for (let offset = 0; offset < missingRecords.length; offset += batchSize) {
  const batch = missingRecords.slice(offset, offset + batchSize);
  await Promise.all(batch.map(record => synthesize(accessToken, record)));
  if (offset + batchSize < missingRecords.length) await wait(1_000);
}

const map = Object.fromEntries(
  (await Promise.all(
    uniqueRecords.map(async record => ({
      record,
      available: await hasNonEmptyFile(record.mp3Path)
    }))
  ))
    .filter(item => item.available)
    .map(item => item.record)
    .sort((left, right) => left.key.localeCompare(right.key))
    .map(record => [record.key, record.publicPath])
);
const moduleText =
  "// AUTO-GENERATED by tools/generateStoryQuestLedaAudio.mjs - do not edit.\n" +
  `export const STORY_QUEST_LEDA_AUDIO = Object.freeze(${JSON.stringify(map, null, 2)});\n`;
await writeFile(generatedModulePath, moduleText);

console.log(JSON.stringify({
  quests: selectedQuestId ? 1 : storyQuests.length,
  questId: selectedQuestId || "all",
  pages: selectedRecords.length,
  availableClips: Object.keys(map).length,
  generated: missingRecords.length,
  reused: selectedRecords.length - missingRecords.length,
  outputDirectory: path.relative(repositoryRoot, outputDirectory),
  generatedModule: path.relative(repositoryRoot, generatedModulePath)
}, null, 2));
