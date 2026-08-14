import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { storyQuests } from "../src/data/storyQuests.js";
import { GUIDED_READING_LEDA_GAPS } from "../src/data/generated/guidedReadingLedaGaps.generated.js";
import {
  getLedaWordAudioPath,
  normalizeLedaAudioText
} from "../src/data/ledaProductionAudio.js";
import {
  buildGuidedReadingAudioInventory,
  readablePageText,
  stableStringify
} from "./guidedReadingAudioPipelineLib.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedModulePath = path.join(
  repositoryRoot,
  "src/data/generated/guidedReadingLedaGaps.generated.js"
);
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const dryRun = process.argv.includes("--dry-run");
const includeInventory = dryRun || process.argv.includes("--inventory");
const levelArgumentIndex = process.argv.findIndex(argument => argument === "--level");
const requestedLevel = process.argv
  .find(argument => argument.startsWith("--level="))
  ?.split("=")[1]
  || (levelArgumentIndex >= 0 ? process.argv[levelArgumentIndex + 1] : "")
  || null;
if (requestedLevel && !["A", "B", "C"].includes(requestedLevel)) {
  throw new Error(`Unsupported Guided Reading level: ${requestedLevel}`);
}
const selectedBooks = requestedLevel
  ? guidedReadingBooks.filter(book => book.level === requestedLevel)
  : guidedReadingBooks;

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
  "200": "two hundred",
  "650": "six hundred and fifty",
  "1969": "nineteen sixty-nine"
});

// Two independent speech-recognition passes agreed that these legacy
// isolated-word clips were unclear enough to risk teaching the wrong word.
// Rebuild them as deliberately paced, punctuated Leda takes and keep the
// replacement mapping stable on future corpus rebuilds.
const auditoryReplacementWords = new Set([
  "am", "an", "ant", "banks", "bat", "bears", "blaze", "call", "chalk",
  "chime", "clothes", "corks", "cub", "cup", "cupped", "date", "fan",
  "few", "fin", "fit", "flicks", "foam", "germs", "glove", "grade",
  "grip", "hens", "her", "hooted", "hum", "licked", "lid", "lifts",
  "mirrored", "misses", "mist", "mover", "mrs", "nap", "neck", "patted",
  "peeked", "picked", "pollination", "potting", "rub", "scales", "scowls",
  "screen", "script", "scrubs", "seam", "sighs", "species", "spinnerets",
  "spirals", "spills", "spreading", "steel", "sticky", "stood", "stored",
  "sturdy", "swallowed", "tapped", "tart", "thanked", "thing", "think",
  "tooth", "tugged", "vet", "wake", "whale", "wood", "wool", "worn",
  "wrist", "you've"
].map(normalizeLedaAudioText));

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

async function fileExists(filePath) {
  try {
    return (await stat(filePath)).size > 0;
  } catch {
    return false;
  }
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function synthesize(accessToken, record) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=utf-8",
          "x-goog-user-project": projectId
        },
        body: JSON.stringify({
          input: { text: record.spokenText },
          voice: { languageCode: "en-US", name: voiceName },
          audioConfig: {
            audioEncoding: "LINEAR16",
            sampleRateHertz: 24000,
            ...(record.auditoryReplacement ? { speakingRate: 0.85 } : {})
          }
        })
      });
    } catch (error) {
      if (attempt === 8) {
        throw new Error(
          `${record.lookupText} failed after ${attempt} network attempts: ${error.message}`,
          { cause: error }
        );
      }
      const retryDelay = Math.min(45000, 2500 * (2 ** (attempt - 1)));
      console.error(
        `Google Leda network retry ${attempt}/8 for ${record.lookupText} in ${retryDelay}ms.`
      );
      await wait(retryDelay);
      continue;
    }
    if (response.ok) {
      const result = await response.json();
      await writeFile(record.wavPath, Buffer.from(result.audioContent, "base64"));
      return;
    }

    const responseText = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 8) {
      throw new Error(
        `${record.lookupText} failed with ${response.status}: ${responseText.slice(0, 1000)}`
      );
    }
    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const retryDelay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : Math.min(45000, 2500 * (2 ** (attempt - 1)));
    await wait(retryDelay);
  }
}

const inventory = buildGuidedReadingAudioInventory(selectedBooks, repositoryRoot);
const brokenExactOverrides = inventory.pages.filter(
  row => row.origin === "exact_text_override" && !row.exactLedaAudioResolves
);
const preflightFailed = Boolean(
  inventory.pageAudioTextMismatchCount
  || inventory.unresolvedNormalizedCollisionCount
  || brokenExactOverrides.length
);
if (preflightFailed && !dryRun) {
  console.error(stableStringify({
    error: "Guided Reading audio preflight failed before synthesis.",
    pageAudioTextMismatchCount: inventory.pageAudioTextMismatchCount,
    pageAudioTextMismatches: inventory.pageAudioTextMismatches.map(row => ({
      bookId: row.bookId,
      pageNumber: row.pageNumber,
      displayedText: row.displayedText,
      pageAudioText: row.declaredPageAudioText
    })),
    unresolvedNormalizedCollisionCount: inventory.unresolvedNormalizedCollisionCount,
    collisions: inventory.collisions.filter(row => !row.resolved),
    brokenExactOverrides: brokenExactOverrides.map(row => ({
      bookId: row.bookId,
      pageNumber: row.pageNumber,
      displayedText: row.displayedText,
      audioPath: row.audioPath,
      audioExists: row.audioExists,
      transcriptMatches: row.transcriptMatches
    }))
  }, 2));
  process.exit(1);
}

const pageTexts = new Set(
  inventory.pages
    // Existing generated gaps must remain in the rebuilt module. Excluding a
    // resolved gap here would erase its lookup entry on the next run.
    .filter(row => row.origin === "gap_generator" || !row.exactLedaAudioResolves)
    .filter(row => row.origin !== "exact_text_override")
    .map(row => row.displayedText)
);
const wordTexts = new Map();
function collectVisibleWordAudio(text, tokenPattern) {
  // Preserve em/en dashes here: the reader renders them as punctuation, not
  // as a hyphen joining the words on either side.
  for (const token of String(text || "").normalize("NFKC").match(tokenPattern) || []) {
    const wordText = readableWordText(token);
    const normalizedWordText = normalizeLedaAudioText(wordText);
    if (
      !wordText
      || (getLedaWordAudioPath(wordText) && !auditoryReplacementWords.has(normalizedWordText))
    ) continue;
    if (!wordTexts.has(normalizedWordText)) {
      wordTexts.set(normalizedWordText, wordText);
    }
  }
}

for (const book of selectedBooks) {
  for (const page of book.pages || []) {
    if (page.active === false) continue;
    // Match the Guided Reader surface: hyphenated compounds are one tappable
    // word and straight or curly apostrophes stay inside contractions/names.
    collectVisibleWordAudio(
      readablePageText(page),
      /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*(?:-[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*)*/g
    );
  }
}

// Story Quest words use the same whole-word and letter-spelling support as
// Guided Reading. Include their complete visible vocabulary in an all-level
// generation run so a tappable story word can never end in a silent state.
if (!requestedLevel) {
  for (const quest of storyQuests) {
    for (const page of quest.pages || []) {
      collectVisibleWordAudio(
        Array.isArray(page.text) ? page.text.join(" ") : String(page.text || ""),
        /[A-Za-z]+(?:['’][A-Za-z]+)*/g
      );
    }
  }
}

const records = [
  ...[...pageTexts].map(lookupText => ({ role: "guided_page", lookupText })),
  ...[...wordTexts.values()].map(lookupText => ({
    role: "isolated_word",
    lookupText,
    auditoryReplacement: auditoryReplacementWords.has(normalizeLedaAudioText(lookupText)),
    spokenText: spokenWordOverrides[lookupText]
      || (auditoryReplacementWords.has(normalizeLedaAudioText(lookupText))
        ? `${lookupText.charAt(0).toUpperCase()}${lookupText.slice(1)}.`
        : lookupText)
  }))
].map(record => {
  const spokenText = record.spokenText || record.lookupText;
  const normalizedLookupText = normalizeLedaAudioText(record.lookupText);
  const id = `${slug(record.lookupText) || "spoken"}-${hash(
    `${voiceName}|${record.role}|${record.lookupText}|${spokenText}|${record.auditoryReplacement ? "auditory-replacement-v1" : "standard"}`
  )}`;
  const outputDirectory = path.join(
    repositoryRoot,
    "public/audio/production/en-US",
    record.role
  );
  const generatedPublicPath = `/audio/production/en-US/${record.role}/${id}.mp3`;
  const publicPath = record.auditoryReplacement
    ? generatedPublicPath
    : GUIDED_READING_LEDA_GAPS[record.role]?.[normalizedLookupText] || generatedPublicPath;
  const mp3Path = path.join(repositoryRoot, "public", publicPath.replace(/^\/+/, ""));
  const wavPath = mp3Path.replace(/\.mp3$/i, ".wav");
  return {
    ...record,
    spokenText,
    normalizedLookupText,
    outputDirectory,
    wavPath,
    mp3Path,
    publicPath
  };
});

for (const record of records) {
  if (dryRun) {
    record.generated = false;
    record.missing = !(await fileExists(record.mp3Path));
    continue;
  }
  await mkdir(record.outputDirectory, { recursive: true });
  record.generated = false;
  record.missing = !(await fileExists(record.mp3Path));
}

const missingRecords = records.filter(record => record.missing);
if (!dryRun && missingRecords.length) {
  const accessToken = execFileSync(
    "gcloud",
    ["auth", "application-default", "print-access-token"],
    { encoding: "utf8" }
  ).trim();

  for (let offset = 0; offset < missingRecords.length; offset += 2) {
    await Promise.all(
      missingRecords.slice(offset, offset + 2).map(async record => {
        await synthesize(accessToken, record);
        record.generated = true;
      })
    );
    if (offset % 40 === 0 || offset + 2 >= missingRecords.length) {
      console.error(`Google Leda progress: ${Math.min(offset + 2, missingRecords.length)}/${missingRecords.length}`);
    }
    await wait(1200);
  }
}

for (const record of dryRun ? [] : records) {
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
    Object.fromEntries([
      ...(requestedLevel ? Object.entries(GUIDED_READING_LEDA_GAPS[role] || {}) : []),
      ...records
        .filter(record => record.role === role)
        .sort((left, right) =>
          left.normalizedLookupText.localeCompare(right.normalizedLookupText)
        )
        .map(record => [record.normalizedLookupText, record.publicPath])
    ])
  ])
);
if (!dryRun) {
  const moduleText =
    "// AUTO-GENERATED by tools/generateGuidedReadingLedaGaps.mjs - do not edit.\n" +
    `export const GUIDED_READING_LEDA_GAPS = Object.freeze(${stableStringify(maps, 2)});\n`;
  await writeFile(generatedModulePath, moduleText);
}

const result = {
  mode: dryRun ? "dry-run" : "generate",
  level: requestedLevel || "all",
  voice: voiceName,
  activeBooks: inventory.activeBookCount,
  activePages: inventory.livePageCount,
  exactResolvedPages: inventory.exactResolvedPageCount,
  missingExactPageAudio: inventory.missingExactPageAudioCount,
  narrationNeedsRebuild: inventory.narrationNeedsRebuildCount,
  clearableNarrationNeedsRebuild: inventory.clearableNarrationNeedsRebuildCount,
  pageAudioTextMismatches: inventory.pageAudioTextMismatchCount,
  normalizedCollisions: inventory.normalizedCollisionCount,
  unresolvedNormalizedCollisions: inventory.unresolvedNormalizedCollisionCount,
  brokenExactOverrides: brokenExactOverrides.length,
  preflightPassed: !preflightFailed,
  ...(preflightFailed ? {
    pageAudioTextMismatchInventory: inventory.pageAudioTextMismatches.map(row => ({
      bookId: row.bookId,
      pageNumber: row.pageNumber,
      displayedText: row.displayedText,
      pageAudioText: row.declaredPageAudioText
    })),
    normalizedCollisionInventory: inventory.collisions.filter(row => !row.resolved),
    brokenExactOverrideInventory: brokenExactOverrides.map(row => ({
      bookId: row.bookId,
      pageNumber: row.pageNumber,
      displayedText: row.displayedText,
      audioPath: row.audioPath,
      audioExists: row.audioExists,
      transcriptMatches: row.transcriptMatches
    }))
  } : {}),
  generated: records.filter(record => record.generated).length,
  reused: records.filter(record => !record.generated).length,
  pageClips: pageTexts.size,
  wordClips: wordTexts.size,
  missingFiles: missingRecords.length,
  generatedModule: dryRun ? null : path.relative(repositoryRoot, generatedModulePath),
  ...(includeInventory ? {
    pageGenerationInventory: records
      .filter(record => record.role === "guided_page")
      .map(record => ({
        lookupText: record.lookupText,
        normalizedLookupText: record.normalizedLookupText,
        spokenText: record.spokenText,
        publicPath: record.publicPath,
        fileExists: !record.missing
      })),
    wordGenerationInventory: records
      .filter(record => record.role === "isolated_word")
      .map(record => ({
        lookupText: record.lookupText,
        normalizedLookupText: record.normalizedLookupText,
        spokenText: record.spokenText,
        publicPath: record.publicPath,
        fileExists: !record.missing
      }))
  } : {})
};
console.log(stableStringify(result, 2));
if (dryRun && preflightFailed) process.exitCode = 1;
