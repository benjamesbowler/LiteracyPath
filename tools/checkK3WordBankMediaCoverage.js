import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import JSZip from "jszip";

import { audioManifest } from "../src/data/audioManifest.js";
import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";
import { getChildAudioPath, getChildWordAsset } from "../src/data/childAssets.js";
import { getImportedVocabularyMedia } from "../src/data/importedVocabularyMediaManifest.js";
import { getLexiconEntry } from "../src/content/lexicon/masterWordLexicon.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_WORKBOOK = path.join(repoRoot, "docs/imports/K3_Usable_Word_Bank_Metadata.xlsx");
const REPORT_PATH = path.join(repoRoot, "docs/validation/k3_word_bank_media_coverage_audit.md");
const REQUEST_MD_PATH = path.join(repoRoot, "docs/assets/kimi_missing_k3_word_bank_media_request.md");
const REQUEST_CSV_PATH = path.join(repoRoot, "docs/assets/kimi_missing_k3_word_bank_media_request.csv");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);

function xmlDecode(value = "") {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

function publicPathExists(assetPath = "") {
  return Boolean(
    assetPath &&
    String(assetPath).startsWith("/") &&
    fs.existsSync(path.join(repoRoot, "public", assetPath.replace(/^\//, "")))
  );
}

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slug(value = "") {
  return normalizeText(value).replace(/\s+/g, "-");
}

function compactKey(value = "") {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "");
}

function keysFor(value = "") {
  return [...new Set([slug(value), compactKey(value)].filter(Boolean))];
}

function display(value = "") {
  return String(value ?? "").trim();
}

function publicUrl(filePath) {
  return `/${path.relative(path.join(repoRoot, "public"), filePath).replace(/\\/g, "/")}`;
}

function listPublicMedia() {
  const publicRoot = path.join(repoRoot, "public");
  const media = {
    image: new Map(),
    audio: new Map()
  };

  const add = (kind, key, url) => {
    if (!key) return;
    const list = media[kind].get(key) || [];
    list.push(url);
    media[kind].set(key, list);
  };

  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      const kind = IMAGE_EXTENSIONS.has(ext) ? "image" : AUDIO_EXTENSIONS.has(ext) ? "audio" : "";
      if (!kind) continue;
      const basename = path.basename(entry.name, ext).replace(/-kimi\d(?:-\d)?$/i, "");
      keysFor(basename).forEach(key => add(kind, key, publicUrl(full)));
    }
  };

  if (fs.existsSync(publicRoot)) walk(publicRoot);
  return media;
}

function addExistingPath(out, source, assetPath) {
  if (!assetPath || !publicPathExists(assetPath)) return;
  out.push({ source, path: assetPath });
}

function buildAudioManifestIndex() {
  const index = new Map();
  Object.values(audioManifest).forEach(entry => {
    if (!entry?.normalizedText || !entry?.path || !publicPathExists(entry.path)) return;
    keysFor(entry.normalizedText).forEach(key => {
      const list = index.get(key) || [];
      list.push(entry.path);
      index.set(key, list);
    });
  });
  return index;
}

function resolveImage(word, mediaIndex) {
  const hits = [];
  const childAsset = getChildWordAsset(word);
  const imported = getImportedVocabularyMedia(word);
  const lexicon = getLexiconEntry(word);

  addExistingPath(hits, "childWordAssets.image", childAsset?.image);
  addExistingPath(hits, "childWordAssets.fallbackImage", childAsset?.fallbackImage);
  addExistingPath(hits, "importedVocabularyMedia.image", imported?.image || imported?.imageUrl || imported?.imagePath);
  addExistingPath(hits, "masterWordLexicon.image", lexicon?.imageUrl || lexicon?.image || lexicon?.imagePath);

  keysFor(word).forEach(key => {
    (mediaIndex.image.get(key) || []).forEach(assetPath => addExistingPath(hits, "public filename match", assetPath));
  });

  const deduped = [];
  const seen = new Set();
  hits.forEach(hit => {
    const key = `${hit.source}:${hit.path}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(hit);
  });
  return deduped;
}

function resolveAudio(word, mediaIndex, audioManifestIndex) {
  const hits = [];
  const childAsset = getChildWordAsset(word);
  const childAudio = getChildAudioPath(word);
  const imported = getImportedVocabularyMedia(word);
  const lexicon = getLexiconEntry(word);
  const candidatePaths = [
    childAsset?.audio,
    childAudio,
    imported?.audio || imported?.audioUrl || imported?.audioPath,
    lexicon?.audioUrl || lexicon?.audio || lexicon?.audioPath,
    `/audio/child-mode/clean-human/words/${slug(word)}.mp3`,
    `/audio/child-mode/clean-human/hfw/${slug(word)}.mp3`,
    `/audio/child-mode/words/${slug(word)}.mp3`,
    `/audio/child-mode/hfw/${slug(word)}.mp3`,
    `/guided-reading/audio/words/${slug(word)}.mp3`,
    `/media/vocabulary/audio/${slug(word)}.mp3`
  ];

  candidatePaths.forEach(assetPath => addExistingPath(hits, "asset candidate", assetPath));

  const approved = getApprovedAudioPath(word, "");
  addExistingPath(hits, "approved audio preference", approved);

  keysFor(word).forEach(key => {
    (audioManifestIndex.get(key) || []).forEach(assetPath => addExistingPath(hits, "audioManifest exact text", assetPath));
    (mediaIndex.audio.get(key) || []).forEach(assetPath => addExistingPath(hits, "public filename match", assetPath));
  });

  const deduped = [];
  const seen = new Set();
  hits.forEach(hit => {
    const key = `${hit.source}:${hit.path}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(hit);
  });
  return deduped;
}

function csvValue(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function columnIndexFromCellRef(cellRef = "") {
  const letters = String(cellRef).match(/^[A-Z]+/i)?.[0] || "";
  return letters
    .toUpperCase()
    .split("")
    .reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
}

function parseXmlAttributes(tag = "") {
  const attributes = {};
  for (const match of tag.matchAll(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g)) {
    attributes[match[1]] = xmlDecode(match[2]);
  }
  return attributes;
}

function parseSharedStrings(xml = "") {
  return [...xml.matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(match => {
    const itemXml = match[1];
    return [...itemXml.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)]
      .map(textMatch => xmlDecode(textMatch[1]))
      .join("");
  });
}

function parseSheetRows(xml = "", sharedStrings = []) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
    const cells = [];
    const rowXml = rowMatch[1];
    for (const cellMatch of rowXml.matchAll(/<(?:\w+:)?c\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/g)) {
      const attributes = parseXmlAttributes(cellMatch[1]);
      const cellXml = cellMatch[2];
      const colNumber = columnIndexFromCellRef(attributes.r);
      if (!colNumber) continue;

      let value = "";
      if (attributes.t === "s") {
        const sharedIndex = Number(cellXml.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1] || 0);
        value = sharedStrings[sharedIndex] || "";
      } else if (attributes.t === "inlineStr") {
        value = [...cellXml.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)]
          .map(textMatch => xmlDecode(textMatch[1]))
          .join("");
      } else {
        value = xmlDecode(cellXml.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1] || "");
      }
      cells[colNumber] = value;
    }
    rows.push(cells);
  }
  return rows;
}

async function readFirstWorksheetRows(workbookPath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(workbookPath));
  const sharedStringsXml = zip.file("xl/sharedStrings.xml")
    ? await zip.file("xl/sharedStrings.xml").async("string")
    : "";
  const sharedStrings = parseSharedStrings(sharedStringsXml);

  const workbookXml = await zip.file("xl/workbook.xml").async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels").async("string");
  const sheet = [...workbookXml.matchAll(/<(?:\w+:)?sheet\b([^>]*)\/?>/g)]
    .map(match => parseXmlAttributes(match[1]))
    .find(item => item.name === "Word Bank Metadata") ||
    [...workbookXml.matchAll(/<(?:\w+:)?sheet\b([^>]*)\/?>/g)].map(match => parseXmlAttributes(match[1]))[0];
  if (!sheet) throw new Error("No worksheet metadata found in workbook.");

  const rels = new Map(
    [...relsXml.matchAll(/<(?:\w+:)?Relationship\b([^>]*)\/?>/g)].map(match => {
      const attributes = parseXmlAttributes(match[1]);
      return [attributes.Id, attributes.Target];
    })
  );
  const target = rels.get(sheet["r:id"]) || "worksheets/sheet1.xml";
  const sheetPath = target.startsWith("/") ? target.replace(/^\//, "") : `xl/${target.replace(/^xl\//, "")}`;
  const sheetXmlFile = zip.file(sheetPath);
  if (!sheetXmlFile) throw new Error(`Could not find worksheet XML: ${sheetPath}`);
  const sheetXml = await sheetXmlFile.async("string");
  return parseSheetRows(sheetXml, sharedStrings);
}

function imagePrompt(row) {
  const word = row.word;
  const clue = row.meaning_clue ? ` Classroom meaning clue: ${row.meaning_clue}.` : "";
  const lowImageability = String(row.imageability || "").toLowerCase() === "low";
  const guidance = lowImageability
    ? " Because this is abstract or function-word-like, use a simple situational context that suggests meaning without written words."
    : " Make the word visually clear as a simple object, action, attribute, or scene.";
  return `Child-friendly early-reader illustration for "${word}".${clue}${guidance} No text, letters, labels, watermark, or unsafe content.`;
}

function audioPrompt(row) {
  return `Record clean child-friendly audio saying only the word "${row.word}" once, natural pronunciation, no extra phrase, no music, no sound effects.`;
}

function summarize(records) {
  const total = records.length;
  const withImage = records.filter(record => record.imageHits.length).length;
  const withAudio = records.filter(record => record.audioHits.length).length;
  const both = records.filter(record => record.imageHits.length && record.audioHits.length).length;
  const imageOnly = records.filter(record => record.imageHits.length && !record.audioHits.length).length;
  const audioOnly = records.filter(record => !record.imageHits.length && record.audioHits.length).length;
  const neither = records.filter(record => !record.imageHits.length && !record.audioHits.length).length;
  return {
    total,
    withImage,
    missingImage: total - withImage,
    withAudio,
    missingAudio: total - withAudio,
    both,
    imageOnly,
    audioOnly,
    neither,
    requestRows: records.filter(record => !record.imageHits.length || !record.audioHits.length).length
  };
}

function summarizeBy(records, field) {
  const groups = new Map();
  records.forEach(record => {
    const key = display(record[field]) || "Unspecified";
    const list = groups.get(key) || [];
    list.push(record);
    groups.set(key, list);
  });
  return [...groups.entries()]
    .map(([key, list]) => ({ key, ...summarize(list) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function buildReport(records) {
  const summary = summarize(records);
  const missing = records.filter(record => !record.imageHits.length || !record.audioHits.length);
  const lines = [
    "# K-3 Word Bank Media Coverage Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Source workbook: \`docs/imports/${path.basename(SOURCE_WORKBOOK)}\``,
    "",
    "Scope: every unique word in the `Word Bank Metadata` sheet. A word counts as covered when the app has a real file-backed image/audio path through a resolver, the audio manifest, or an exact public filename match.",
    "",
    "## Summary",
    "",
    `Total words audited: ${summary.total}`,
    `Words with image available: ${summary.withImage}`,
    `Words missing image: ${summary.missingImage}`,
    `Words with audio available: ${summary.withAudio}`,
    `Words missing audio: ${summary.missingAudio}`,
    `Words with both image and audio: ${summary.both}`,
    `Words with image only: ${summary.imageOnly}`,
    `Words with audio only: ${summary.audioOnly}`,
    `Words with neither image nor audio: ${summary.neither}`,
    `Kimi request rows: ${summary.requestRows}`,
    "",
    "## By Imageability",
    "",
    "| Imageability | Total | With image | Missing image | With audio | Missing audio | Both | Neither |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...summarizeBy(records, "imageability").map(row =>
      `| ${row.key} | ${row.total} | ${row.withImage} | ${row.missingImage} | ${row.withAudio} | ${row.missingAudio} | ${row.both} | ${row.neither} |`
    ),
    "",
    "## By Decodability Band",
    "",
    "| Decodability band | Total | With image | Missing image | With audio | Missing audio | Both | Neither |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...summarizeBy(records, "decodability_band").map(row =>
      `| ${row.key} | ${row.total} | ${row.withImage} | ${row.missingImage} | ${row.withAudio} | ${row.missingAudio} | ${row.both} | ${row.neither} |`
    ),
    "",
    "## Missing Media",
    "",
    "| Word | Missing image | Missing audio | Imageability | Decodability band | Primary section | Existing image example | Existing audio example |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...missing.map(record =>
      `| ${record.word} | ${record.imageHits.length ? "No" : "Yes"} | ${record.audioHits.length ? "No" : "Yes"} | ${display(record.imageability)} | ${display(record.decodability_band)} | ${display(record.primary_section)} | ${record.imageHits[0]?.path || ""} | ${record.audioHits[0]?.path || ""} |`
    )
  ];

  return `${lines.join("\n")}\n`;
}

function buildRequestMarkdown(records) {
  const missing = records.filter(record => !record.imageHits.length || !record.audioHits.length);
  const lines = [
    "# Kimi Request: K-3 Word Bank Missing Media",
    "",
    "Please create only the assets flagged as missing for each row. If `missing_image` is `FALSE`, no image is needed for that word. If `missing_audio` is `FALSE`, no audio is needed for that word.",
    "",
    "Use the CSV version for production tracking/import; this Markdown version is for quick review.",
    "",
    `Total request rows: ${missing.length}`,
    "",
    "| Word | Missing image | Missing audio | Suggested image path | Suggested audio path | Image prompt | Audio prompt |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...missing.map(record => {
      const wordSlug = slug(record.word);
      const missingImage = record.imageHits.length ? "FALSE" : "TRUE";
      const missingAudio = record.audioHits.length ? "FALSE" : "TRUE";
      return `| ${record.word} | ${missingImage} | ${missingAudio} | ${missingImage === "TRUE" ? `/media/vocabulary/images/${wordSlug}.webp` : ""} | ${missingAudio === "TRUE" ? `/media/vocabulary/audio/${wordSlug}.mp3` : ""} | ${missingImage === "TRUE" ? imagePrompt(record) : ""} | ${missingAudio === "TRUE" ? audioPrompt(record) : ""} |`;
    })
  ];

  return `${lines.join("\n")}\n`;
}

function buildRequestCsv(records) {
  const missing = records.filter(record => !record.imageHits.length || !record.audioHits.length);
  const headers = [
    "word",
    "missing_image",
    "missing_audio",
    "imageability",
    "decodability_band",
    "primary_section",
    "meaning_clue",
    "suggested_image_path",
    "suggested_audio_path",
    "image_prompt",
    "audio_prompt",
    "notes"
  ];
  const rows = missing.map(record => {
    const wordSlug = slug(record.word);
    const missingImage = !record.imageHits.length;
    const missingAudio = !record.audioHits.length;
    return [
      record.word,
      missingImage ? "TRUE" : "FALSE",
      missingAudio ? "TRUE" : "FALSE",
      record.imageability,
      record.decodability_band,
      record.primary_section,
      record.meaning_clue,
      missingImage ? `/media/vocabulary/images/${wordSlug}.webp` : "",
      missingAudio ? `/media/vocabulary/audio/${wordSlug}.mp3` : "",
      missingImage ? imagePrompt(record) : "",
      missingAudio ? audioPrompt(record) : "",
      record.notes
    ].map(csvValue).join(",");
  });

  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

async function loadWordBankRows() {
  if (!fs.existsSync(SOURCE_WORKBOOK)) {
    throw new Error(`Missing source workbook: ${SOURCE_WORKBOOK}`);
  }

  const worksheetRows = await readFirstWorksheetRows(SOURCE_WORKBOOK);
  const headers = [];
  (worksheetRows[0] || []).forEach((cellValue, colNumber) => {
    headers[colNumber] = normalizeText(cellValue).replace(/\s+/g, "_");
  });

  const rows = [];
  const seen = new Set();
  worksheetRows.slice(1).forEach(row => {
    const item = {};
    headers.forEach((header, colNumber) => {
      if (!header) return;
      item[header] = display(row[colNumber]);
    });
    const word = display(item.word);
    const key = slug(word);
    if (!word || seen.has(key)) return;
    seen.add(key);
    rows.push({
      word,
      primary_section: item.primary_section || "",
      all_sections: item.all_sections || "",
      meaning_clue: item.meaning_clue || "",
      imageability: item.imageability || "",
      decodability_band: item.decodability_band || "",
      suggested_literacypath_use: item.suggested_literacypath_use || "",
      notes: item.notes || ""
    });
  });

  return rows;
}

const wordRows = await loadWordBankRows();
const mediaIndex = listPublicMedia();
const audioManifestIndex = buildAudioManifestIndex();

const records = wordRows.map(row => ({
  ...row,
  imageHits: resolveImage(row.word, mediaIndex),
  audioHits: resolveAudio(row.word, mediaIndex, audioManifestIndex)
}));

writeFile(REPORT_PATH, buildReport(records));
writeFile(REQUEST_MD_PATH, buildRequestMarkdown(records));
writeFile(REQUEST_CSV_PATH, buildRequestCsv(records));

const summary = summarize(records);
console.log("K-3 word bank media coverage audit complete.");
console.log(`Words audited: ${summary.total}`);
console.log(`Images: ${summary.withImage} available, ${summary.missingImage} missing`);
console.log(`Audio: ${summary.withAudio} available, ${summary.missingAudio} missing`);
console.log(`Both image and audio: ${summary.both}`);
console.log(`Neither image nor audio: ${summary.neither}`);
console.log(`Kimi request rows: ${summary.requestRows}`);
console.log(`Report: ${path.relative(repoRoot, REPORT_PATH)}`);
console.log(`Kimi request MD: ${path.relative(repoRoot, REQUEST_MD_PATH)}`);
console.log(`Kimi request CSV: ${path.relative(repoRoot, REQUEST_CSV_PATH)}`);
