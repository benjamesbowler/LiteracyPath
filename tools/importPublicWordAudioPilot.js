import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { audioManifest } from "../src/data/audioManifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "public/audio/choices");
const attributionPath = path.join(outputDir, "public-word-audio-pilot.json");
const legacyAttributionPath = path.join(outputDir, "commons-audio-pilot.json");
const pilotLimit = 20;
const maxAttempts = 80;

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .trim();
}

function loadExistingPilotFiles() {
  const paths = [attributionPath, legacyAttributionPath];

  for (const filePath of paths) {
    if (!fs.existsSync(filePath)) continue;

    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (Array.isArray(parsed.files)) {
      return parsed.files.map(file => ({
        sourceName: "Wikimedia Commons",
        licensingConfidence: "medium: review each file, attribution/share-alike often required",
        ...file
      }));
    }
  }

  return [];
}

function getTopMissingSingleWordChoices(existingPilotFiles) {
  const existingPilotKeys = new Set(existingPilotFiles.map(file => file.key));

  return Object.entries(audioManifest)
    .filter(([, entry]) => entry.kinds?.includes("choice"))
    .filter(([, entry]) => /^[a-zA-Z]+$/.test(entry.text))
    .sort(([, a], [, b]) => {
      if (b.useCount !== a.useCount) return b.useCount - a.useCount;
      return a.text.localeCompare(b.text);
    })
    .filter(([key]) => !existingPilotKeys.has(key))
    .filter(([key]) => !fs.existsSync(path.join(outputDir, `${key}.mp3`)));
}

function commonsTitle(word) {
  return `File:En-us-${word.toLowerCase()}.ogg`;
}

function transcodeUrl(originalUrl) {
  const marker = "/wikipedia/commons/";
  const index = originalUrl.indexOf(marker);
  if (index === -1) return null;

  const relativePath = originalUrl.slice(index + marker.length);
  const fileName = relativePath.split("/").at(-1);

  return `https://upload.wikimedia.org/wikipedia/commons/transcoded/${relativePath}/${fileName}.mp3`;
}

async function getCommonsMetadata(word) {
  const params = new URLSearchParams({
    action: "query",
    titles: commonsTitle(word),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    format: "json",
    origin: "*"
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!response.ok) return null;

  const data = await response.json();
  const page = Object.values(data.query?.pages || {})[0];
  const imageInfo = page?.imageinfo?.[0];

  if (!imageInfo?.url) return null;

  const sourceAudioUrl = transcodeUrl(imageInfo.url);
  if (!sourceAudioUrl) return null;

  const ext = imageInfo.extmetadata || {};

  return {
    sourceName: "Wikimedia Commons",
    sourceTitle: page.title,
    sourcePage: imageInfo.descriptionurl,
    sourceAudioUrl,
    artist: stripHtml(ext.Artist?.value),
    credit: stripHtml(ext.Credit?.value),
    licenseShortName: stripHtml(ext.LicenseShortName?.value),
    usageTerms: stripHtml(ext.UsageTerms?.value),
    licenseUrl: ext.LicenseUrl?.value || "",
    attributionRequired: ext.AttributionRequired?.value === "true",
    licensingConfidence: "medium: review each file, attribution/share-alike often required"
  };
}

async function getDictionaryMetadata(word) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
  const response = await fetch(apiUrl);
  if (!response.ok) return null;

  const entries = await response.json();
  const audioUrl = entries
    .flatMap(entry => entry.phonetics || [])
    .map(phonetic => phonetic.audio)
    .find(Boolean);

  if (!audioUrl) return null;

  return {
    sourceName: "DictionaryAPI.dev phonetics",
    sourceTitle: word.toLowerCase(),
    sourcePage: apiUrl,
    sourceAudioUrl: audioUrl.startsWith("//") ? `https:${audioUrl}` : audioUrl,
    artist: "",
    credit: "DictionaryAPI.dev response; upstream audio host varies.",
    licenseShortName: "Unknown",
    usageTerms: "Unclear for redistributed MP3 files",
    licenseUrl: "",
    attributionRequired: true,
    licensingConfidence: "low: API is free, but MP3 redistribution rights are not clear"
  };
}

async function downloadAudio(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("audio") && !contentType.includes("mpeg")) {
    throw new Error(`Unexpected content type: ${contentType}`);
  }

  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function tryImportSource(label, getMetadata, entry, outputPath) {
  const metadata = await getMetadata(entry.text);
  if (!metadata) {
    console.log(`  ${label}: no pronunciation file found`);
    return null;
  }

  try {
    await downloadAudio(metadata.sourceAudioUrl, outputPath);
    return metadata;
  } catch (error) {
    console.log(`  ${label}: ${error.message}`);
    return null;
  }
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const existingFiles = loadExistingPilotFiles()
    .filter(file => fs.existsSync(path.join(rootDir, file.outputPath)));
  const candidates = getTopMissingSingleWordChoices(existingFiles);
  const imported = [...existingFiles];
  let attempts = 0;

  console.log(`Public word audio pilot target: ${pilotLimit} files`);
  console.log(`Existing pilot files: ${existingFiles.length}`);
  console.log(`Candidate choice texts: ${candidates.length}`);
  console.log(`Output folder: ${path.relative(rootDir, outputDir)}`);

  for (const [key, entry] of candidates) {
    if (imported.length >= pilotLimit) break;
    if (attempts >= maxAttempts) break;

    attempts += 1;

    const outputPath = path.join(outputDir, `${key}.mp3`);
    const relativeOutputPath = path.relative(rootDir, outputPath);

    console.log(`[${imported.length + 1}/${pilotLimit}] Look up "${entry.text}"`);

    const metadata =
      await tryImportSource("Commons", getCommonsMetadata, entry, outputPath) ||
      await tryImportSource("DictionaryAPI.dev", getDictionaryMetadata, entry, outputPath);

    if (!metadata) continue;

    console.log(`  Saved ${relativeOutputPath} from ${metadata.sourceName}`);
    imported.push({
      key,
      text: entry.text,
      useCount: entry.useCount,
      outputPath: relativeOutputPath,
      ...metadata
    });
  }

  fs.writeFileSync(attributionPath, `${JSON.stringify({
    source: "Public word-pronunciation audio pilot",
    generatedAt: new Date().toISOString(),
    note: "Prototype metadata. Review source page and license before production or commercial distribution.",
    files: imported.slice(0, pilotLimit)
  }, null, 2)}\n`);

  console.log("");
  console.log(`Pilot files available: ${Math.min(imported.length, pilotLimit)}`);
  console.log(`New files imported this run: ${Math.max(0, imported.length - existingFiles.length)}`);
  console.log(`Attribution metadata: ${path.relative(rootDir, attributionPath)}`);

  if (imported.length < pilotLimit) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error("Public word audio pilot failed.");
  console.error(error);
  process.exitCode = 1;
});
