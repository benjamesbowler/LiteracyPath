import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import {
  getLedaProductionAudioPath,
  getLedaWordAudioPath,
  normalizeLedaAudioText
} from "../src/data/ledaProductionAudio.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedModulePath = path.join(
  repositoryRoot,
  "src/data/generated/guidedReadingLedaGaps.generated.js"
);
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";

const spokenWordOverrides = Object.freeze({
  "000": "thousand",
  "1": "one",
  "2": "two",
  "11": "eleven",
  "14": "fourteen",
  "18": "eighteen",
  "40": "forty",
  "60": "sixty",
  "80": "eighty",
  "80%": "eighty percent",
  "200": "two hundred",
  "650": "six hundred and fifty",
  "1000": "one thousand",
  "1969": "nineteen sixty-nine",
  "60000": "sixty thousand"
});

function readablePageText(page = {}) {
  return Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
}

function readableWordText(value = "") {
  return String(value || "")
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9%]+$/g, "")
    .trim();
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${String(result.stderr || result.stdout).slice(-1600)}`);
  }
}

async function synthesize(accessToken, record) {
  try {
    if ((await stat(record.mp3Path)).size > 0) return false;
  } catch {
    // Generate the missing clip.
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text: record.spokenText },
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
    })
  });
  if (!response.ok) {
    throw new Error(
      `${record.lookupText} failed with ${response.status}: ${(await response.text()).slice(0, 1000)}`
    );
  }
  const result = await response.json();
  await writeFile(record.wavPath, Buffer.from(result.audioContent, "base64"));
  return true;
}

const pageTexts = new Set();
const wordTexts = new Map();
for (const book of guidedReadingBooks) {
  for (const page of book.pages || []) {
    if (page.active === false) continue;
    const pageText = readablePageText(page);
    if (
      pageText
      && !getLedaProductionAudioPath(pageText, ["supplemental", "guided_page"])
    ) {
      pageTexts.add(pageText);
    }

    const visibleWordTokens = (pageText.match(/[A-Za-z0-9'-]+/g) || [])
      .filter(token => /[A-Za-z0-9]/.test(token));
    for (const token of visibleWordTokens) {
      const wordText = readableWordText(token);
      if (!wordText || getLedaWordAudioPath(wordText)) continue;
      const normalizedWordText = normalizeLedaAudioText(wordText);
      if (!wordTexts.has(normalizedWordText)) {
        wordTexts.set(normalizedWordText, wordText);
      }
    }
  }
}

const records = [
  ...[...pageTexts].map(lookupText => ({ role: "guided_page", lookupText })),
  ...[...wordTexts.values()].map(lookupText => ({
    role: "isolated_word",
    lookupText,
    spokenText: spokenWordOverrides[lookupText] || lookupText
  }))
].map(record => {
  const spokenText = record.spokenText || record.lookupText;
  const id = `${slug(record.lookupText) || "spoken"}-${hash(
    `${voiceName}|${record.role}|${record.lookupText}|${spokenText}`
  )}`;
  const outputDirectory = path.join(
    repositoryRoot,
    "public/audio/production/en-US",
    record.role
  );
  return {
    ...record,
    spokenText,
    normalizedLookupText: normalizeLedaAudioText(record.lookupText),
    outputDirectory,
    wavPath: path.join(outputDirectory, `${id}.wav`),
    mp3Path: path.join(outputDirectory, `${id}.mp3`),
    publicPath: `/audio/production/en-US/${record.role}/${id}.mp3`
  };
});

const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();

for (const record of records) await mkdir(record.outputDirectory, { recursive: true });
for (let offset = 0; offset < records.length; offset += 6) {
  await Promise.all(
    records.slice(offset, offset + 6).map(record =>
      synthesize(accessToken, record).then(generated => {
        record.generated = generated;
      })
    )
  );
}

for (const record of records) {
  if (!record.generated) continue;
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-loglevel", "error", "-i", record.wavPath,
      "-af", "loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015",
      "-codec:a", "libmp3lame", "-b:a", "128k", record.mp3Path
    ],
    `Normalize ${record.lookupText}`
  );
  await unlink(record.wavPath);
}

const maps = Object.fromEntries(
  ["guided_page", "isolated_word"].map(role => [
    role,
    Object.fromEntries(
      records
        .filter(record => record.role === role)
        .sort((left, right) =>
          left.normalizedLookupText.localeCompare(right.normalizedLookupText)
        )
        .map(record => [record.normalizedLookupText, record.publicPath])
    )
  ])
);
const moduleText =
  "// AUTO-GENERATED by tools/generateGuidedReadingLedaGaps.mjs - do not edit.\n" +
  `export const GUIDED_READING_LEDA_GAPS = Object.freeze(${JSON.stringify(maps, null, 2)});\n`;
await writeFile(generatedModulePath, moduleText);

console.log(JSON.stringify({
  generated: records.filter(record => record.generated).length,
  pageClips: pageTexts.size,
  wordClips: wordTexts.size,
  generatedModule: path.relative(repositoryRoot, generatedModulePath)
}, null, 2));
