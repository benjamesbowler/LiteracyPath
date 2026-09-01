#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { getLedaProductionAudioPath } from "../src/data/ledaProductionAudio.js";
import {
  importV3Bank,
  listV3PublishedSkillIds
} from "../src/data/v3/v3Registry.js";

const root = path.resolve(import.meta.dirname, "..");
const peakFloorDb = -40;
const concurrency = 12;

function spokenCloze(text) {
  return String(text || "")
    .replace(/\s*(?:_{2,}|\bhmm\b|\bblank\b)\s*/gi, " … ")
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,;:])/g, "$1")
    .trim();
}

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

const banks = await Promise.all(listV3PublishedSkillIds().map(importV3Bank));
const texts = [...new Set(banks.flatMap(items => items.flatMap(item => [
  spokenCloze(item.spokenPrompt || item.prompt),
  item.sentence ? spokenCloze(item.sentence) : "",
  item.passage || "",
  ...(item.imageCards || []).map(card => card.word),
  ...(item.choices || []),
  item.targetWord && !/[/_]/.test(item.targetWord) ? item.targetWord : ""
])).map(text => String(text || "").trim()).filter(Boolean))];
const unresolvedTexts = texts.filter(text => !getLedaProductionAudioPath(text));
const publicPaths = [...new Set(texts
  .map(text => getLedaProductionAudioPath(text))
  .filter(Boolean))].sort();

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
    `Assessment Leda audio audibility failed: ${texts.length} unique texts,`,
    `${unresolvedTexts.length} unresolved texts, ${failures.length}/${publicPaths.length} mapped files missing, undecodable, or at/below ${peakFloorDb} dB peak.`
  ].join(" "));
  unresolvedTexts.slice(0, 30).forEach(text => console.error(`UNRESOLVED\t${text}`));
  failures.slice(0, 100).forEach(({ publicPath, status, peakDb }) => {
    console.error(`INAUDIBLE\t${peakDb}\t${status}\t${publicPath}`);
  });
  process.exit(1);
}

console.log(
  `Assessment Leda audio audibility passed: ${texts.length} unique texts resolve to ${publicPaths.length} decodable files above ${peakFloorDb} dB peak.`
);
