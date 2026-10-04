import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { ARCADE_CUE_PICTURES } from "../../src/data/generated/arcadeCuePictures.generated.js";
import { getArcadeCuePicture } from "../../src/data/arcadeCuePictures.js";
import { getChildWordAsset } from "../../src/data/childAssets.js";
import { curatedChildWordImageOverrides } from "../../src/data/childWordImageOverrides.js";

test("scoped Arcade cues retain exact reviewed bytes and declared meaning context", () => {
  const entries = ["action", "safari"].flatMap(name => {
    const manifest = JSON.parse(fs.readFileSync(new URL(`../../source-art/arcade/cue-images/${name}/manifest.json`, import.meta.url)));
    return [...manifest.generated, ...manifest.curated];
  });
  assert.equal(Object.keys(ARCADE_CUE_PICTURES).length, entries.length);
  for (const entry of entries) {
    assert.deepEqual(getArcadeCuePicture(entry.word), { image: entry.delivery, kind: entry.kind });
    assert.equal(createHash("sha256").update(fs.readFileSync(new URL(`../../public${entry.delivery}`, import.meta.url))).digest("hex"), entry.deliverySha256 || entry.sha256);
  }
  for (const word of ["ton", "spun", "glow", "helpful", "reread", "dislike", "fragile"]) {
    assert.equal(getArcadeCuePicture(word).kind, "meaning-context", word);
    assert.equal(curatedChildWordImageOverrides[word], undefined, "Arcade scene cannot alter shared target-object policy");
  }
  assert.equal(getArcadeCuePicture("square").kind, "word");
  assert.notEqual(getArcadeCuePicture("square").image, "/images/assessment/blends/square.webp", "the pictured cube cannot remain the Arcade square cue");
});

test("Safari recorded-word context stays separate from assessment object cues", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../../source-art/arcade/cue-images/safari/manifest.json", import.meta.url)));
  assert.equal(manifest.curated.length, 23);
  for (const entry of manifest.curated) {
    assert.ok(getArcadeCuePicture(entry.word).image, entry.word);
    assert.equal(getChildWordAsset(entry.word)?.image || "", "", "scoped admission cannot change the shared assessment resolver");
    assert.equal(curatedChildWordImageOverrides[entry.word], undefined);
  }
  for (const word of ["track", "prize", "three", "shining", "silver", "dark", "thunder", "glowing", "sunlight", "meadow", "river", "glimmer", "sunshine"]) {
    assert.equal(getArcadeCuePicture(word).kind, "meaning-context", word);
  }
});

test("Arcade cue lookup preserves existing child pictures for other words", () => {
  assert.deepEqual(getArcadeCuePicture(" CAT "), { image: getChildWordAsset("cat").image, kind: "word" });
  assert.notEqual(getArcadeCuePicture("glow").image, getChildWordAsset("glow").image);
});
