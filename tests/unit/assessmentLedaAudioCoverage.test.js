import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  getLedaProductionAudioPath,
  isLedaProductionAudioPath
} from "../../src/data/ledaProductionAudio.js";
import {
  importV3Bank,
  listV3PublishedSkillIds
} from "../../src/data/v3/v3Registry.js";

const repositoryRoot = process.cwd();

test("every assessment prompt, passage, word, and answer choice has committed Leda audio", async () => {
  const spokenCloze = text => String(text || "")
    .replace(/\s*(?:_{2,}|\bhmm\b|\bblank\b)\s*/gi, " … ")
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,;:])/g, "$1")
    .trim();
  const banks = await Promise.all(listV3PublishedSkillIds().map(importV3Bank));
  const records = banks.flatMap(items => items.flatMap(item => [
    spokenCloze(item.spokenPrompt || item.prompt),
    item.sentence ? spokenCloze(item.sentence) : "",
    item.passage || "",
    ...(item.imageCards || []).map(card => card.word),
    ...(item.choices || []),
    ...(item.targetWord && !/[/_]/.test(item.targetWord) ? [item.targetWord] : [])
  ])).map(text => String(text || "").trim()).filter(Boolean);
  const uniqueTexts = [...new Set(records)];
  const missing = [];

  for (const text of uniqueTexts) {
    const audioPath = getLedaProductionAudioPath(text);
    if (!isLedaProductionAudioPath(audioPath)) {
      missing.push(text);
      continue;
    }
    await access(path.join(repositoryRoot, "public", audioPath.replace(/^\//, "")));
  }

  assert.deepEqual(missing, []);
  assert.ok(uniqueTexts.length > 5_000, `expected the complete assessment audio corpus, got ${uniqueTexts.length}`);
});
