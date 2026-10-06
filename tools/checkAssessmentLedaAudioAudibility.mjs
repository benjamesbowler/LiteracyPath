#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { normalizeSpokenCloze as spokenCloze } from "../src/utils/assessmentSpokenText.js";

import { getLedaProductionAudioPath } from "../src/data/ledaProductionAudio.js";
import { PROGRESS_BANK } from "../src/content/assessments/v3/progressBank.generated.js";
import { PROGRESS_CHECK_INSTRUCTIONS } from "../src/data/progressCheckInstructions.js";
import { progressAudioCues, progressCheckAudioPath } from "../src/utils/progressCheckAudio.js";
import { loadLiteracyPracticeExtensions } from "../src/data/literacyPracticeExtensions.js";
import { loadLiteracyMockItems } from "../src/data/literacyMockItems.js";
import { literacyPracticeRequiredAudioCues } from "./lib/literacyPracticeContracts.mjs";
import {
  importV3Bank,
  listV3PublishedSkillIds
} from "../src/data/v3/v3Registry.js";

const root = path.resolve(import.meta.dirname, "..");
const peakFloorDb = -40;
const concurrency = 12;

function inspectAudio(publicPath) {
  return new Promise(resolve => {
    const absolutePath = path.join(root, "public", publicPath.replace(/^\//, ""));
    if (!fs.existsSync(absolutePath)) {
      resolve({ publicPath, status: "missing", peakDb: Number.NEGATIVE_INFINITY });
      return;
    }
    const child = spawn("ffmpeg", [
      "-hide_banner", "-nostats", "-i", absolutePath,
      "-af", "volumedetect", "-f", "null", "-"
    ]);
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", error => resolve({
      publicPath,
      status: `ffmpeg-error:${error.message}`,
      peakDb: Number.NEGATIVE_INFINITY
    }));
    child.on("close", code => {
      const match = stderr.match(/max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf)) dB/i);
      const peakDb = match && match[1].toLowerCase() !== "-inf"
        ? Number(match[1])
        : Number.NEGATIVE_INFINITY;
      resolve({ publicPath, status: code === 0 ? "decoded" : `decode-exit-${code}`, peakDb });
    });
  });
}

const progressOnly = process.argv.includes("--progress-check-only");
const literacyOnly = process.argv.includes("--literacy-practice-only");
const mockOnly = process.argv.includes("--literacy-mock-only");
if ([progressOnly, literacyOnly, mockOnly].filter(Boolean).length > 1) throw new Error("Choose one targeted audibility surface, or omit all flags for the full gate.");
const banks = progressOnly || literacyOnly || mockOnly ? [] : await Promise.all(listV3PublishedSkillIds().map(importV3Bank));
const texts = [...new Set(banks.flatMap(items => items.flatMap(item => [
  spokenCloze(item.spokenPrompt || item.prompt),
  item.sentence ? spokenCloze(item.sentence) : "",
  item.passage || "",
  ...(item.imageCards || []).map(card => card.word),
  ...(item.choices || []),
  !item.suppressStimulusAudio && item.targetWord && !/[/_]/.test(item.targetWord) ? item.targetWord : ""
])).map(text => String(text || "").trim()).filter(Boolean))];
const progressCues = literacyOnly || mockOnly ? [] : [...PROGRESS_BANK.items.flatMap(progressAudioCues), ...Object.values(PROGRESS_CHECK_INSTRUCTIONS).map(text => ({ text, path: progressCheckAudioPath(text) }))];
const literacyCues = progressOnly || mockOnly ? [] : literacyPracticeRequiredAudioCues(await loadLiteracyPracticeExtensions());
const mockCues = progressOnly || literacyOnly ? [] : (await loadLiteracyMockItems()).flatMap(item => item.requiredAudioCues);
const exactCues = [...progressCues, ...literacyCues, ...mockCues];
const uniqueTextCount = new Set([...texts, ...exactCues.map(cue => cue.text)]).size;
const unresolvedTexts = [...new Set([...texts.filter(text => !getLedaProductionAudioPath(text)), ...exactCues.filter(cue => !cue.path).map(cue => cue.text)])];
const publicPaths = [...new Set([...texts
  .map(text => getLedaProductionAudioPath(text))
  .filter(Boolean), ...exactCues.map(cue => cue.path).filter(Boolean)])].sort();

let cursor = 0;
let checked = 0;
const failures = [];

async function worker() {
  while (cursor < publicPaths.length) {
    const index = cursor;
    cursor += 1;
    const result = await inspectAudio(publicPaths[index]);
    checked += 1;
    if (result.status !== "decoded" || !Number.isFinite(result.peakDb) || result.peakDb <= peakFloorDb) {
      failures.push(result);
    }
    if (checked % 500 === 0) {
      console.log(`Checked ${checked}/${publicPaths.length}; failures=${failures.length}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));

if (unresolvedTexts.length || failures.length) {
  console.error([
    `Assessment Leda audio audibility failed: ${uniqueTextCount} unique texts,`,
    `${unresolvedTexts.length} unresolved texts, ${failures.length}/${publicPaths.length} mapped files missing, undecodable, or at/below ${peakFloorDb} dB peak.`
  ].join(" "));
  unresolvedTexts.slice(0, 30).forEach(text => console.error(`UNRESOLVED\t${text}`));
  failures.slice(0, 100).forEach(({ publicPath, status, peakDb }) => {
    console.error(`INAUDIBLE\t${peakDb}\t${status}\t${publicPath}`);
  });
  process.exit(1);
}

console.log(
  `Assessment Leda audio audibility passed: ${uniqueTextCount} unique texts resolve to ${publicPaths.length} decodable files above ${peakFloorDb} dB peak.`
);
