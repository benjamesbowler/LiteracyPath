import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { CYCLE_PRACTICE_AUDIO_METADATA, CYCLE_PRACTICE_WORD_AUDIO } from "../../src/data/generated/cyclePracticeInstructionAudio.generated.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import { LEDA_WORD_AUDIO } from "../../src/data/generated/ledaWordAudio.generated.js";
import { getChildAudioPath } from "../../src/data/childAssets.js";

test("retained cupcake and itch recordings keep exact current Leda provenance in shared lookup", () => {
  for (const word of ["cupcake", "itch"]) {
    const source = CYCLE_PRACTICE_AUDIO_METADATA[word];
    assert.equal(source.text, word);
    assert.equal(source.role, "isolated_word");
    assert.equal(source.voice, "en-US-Chirp3-HD-Leda");
    assert.equal(CYCLE_PRACTICE_WORD_AUDIO[word], source.audio);
    assert.equal(createHash("sha256").update(fs.readFileSync(new URL(`../../public${source.audio}`, import.meta.url))).digest("hex"), source.sha256);
    for (const resolve of [getLedaWordAudioPath, getChildAudioPath]) assert.equal(resolve(word), source.audio);
    assert.equal(LEDA_WORD_AUDIO[word], source.audio);
  }
});
