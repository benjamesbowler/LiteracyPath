import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  getLedaProductionAudioPath,
  isLedaProductionAudioPath
} from "../../src/data/ledaProductionAudio.js";

const repositoryRoot = process.cwd();

test("every assessment prompt, passage, word, and answer choice has committed Leda audio", async () => {
  const request = JSON.parse(await readFile(
    path.join(repositoryRoot, "docs/skills-assessment-rebuild/MEDIA_REQUEST.json"),
    "utf8"
  ));
  const records = [
    ...(request.prompts || []).map(row => row.text),
    ...(request.sentences || []).map(row => row.text),
    ...(request.passages || []).map(row => row.text),
    ...(request.words || []).map(row => row.word),
    ...(request.phrases || []).map(row => row.text)
  ].filter(Boolean);
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
