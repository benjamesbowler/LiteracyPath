import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import {
  AUTHORING_DIR,
  BANKS_DIR,
  ROOT,
  expandBank,
  generatedBankSource,
  makeImageResolver
} from "../../tools/assessmentRebuild/lib.mjs";

test("every published v3 bank exactly matches its authoritative authoring source", async () => {
  const authoringFiles = fs.readdirSync(AUTHORING_DIR)
    .filter(file => file.endsWith(".mjs"))
    .sort();

  for (const file of authoringFiles) {
    const skillId = file.replace(/\.mjs$/, "");
    const blueprint = skillBlueprints[skillId];
    assert.ok(blueprint, `missing blueprint for ${skillId}`);
    const source = (await import(path.join(AUTHORING_DIR, file))).default;
    const questions = expandBank(source, blueprint, source.imageResolver || makeImageResolver());
    const generatedPath = path.join(BANKS_DIR, `${skillId}.v3.generated.js`);
    assert.equal(
      fs.readFileSync(generatedPath, "utf8"),
      generatedBankSource(skillId, questions),
      `${skillId} generated bank is stale; run node tools/assessmentRebuild/gate.mjs --write`
    );
  }
});

test("new child-practice pictures cannot silently replace reviewed independent assessment media", () => {
  const resolver = makeImageResolver();
  for (const word of ["monkey", "moon", "mountain", "drum", "tiger"]) {
    assert.ok(fs.existsSync(path.join(
      ROOT, "public/images/child-mode/initial-sounds/reviewed", `${word}.webp`
    )), `${word} child-practice replacement must exist for this regression`);
    assert.match(resolver(word), /^\/images\/assessment\//, `${word} keeps its explicitly reviewed assessment source`);
  }
});
