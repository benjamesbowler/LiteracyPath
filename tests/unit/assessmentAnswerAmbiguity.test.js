import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  AUTHORING_DIR,
  expandBank,
  lintBank,
  makeImageResolver
} from "../../tools/assessmentRebuild/lib.mjs";
import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";

const ANSWER_INTEGRITY_CODES = new Set([
  "L-DIST",
  "L-REALWORD",
  "L-LEX",
  "L-GRAM",
  "L-READ",
  "L-KEY-BALANCE",
  "L-AMBIG"
]);

test("all 30 authored assessment banks pass answer-integrity and ambiguity rules", async () => {
  const sourceFiles = fs.readdirSync(AUTHORING_DIR)
    .filter(file => file.endsWith(".mjs"))
    .sort();
  const findings = [];

  for (const file of sourceFiles) {
    const skillId = file.replace(/\.mjs$/, "");
    const blueprint = skillBlueprints[skillId];
    if (!blueprint) continue;
    const moduleUrl = `${pathToFileURL(path.join(AUTHORING_DIR, file)).href}?ambiguity-test=${Date.now()}`;
    const source = (await import(moduleUrl)).default;
    const items = expandBank(
      source,
      blueprint,
      source.imageResolver || makeImageResolver()
    );
    findings.push(
      ...lintBank(items, blueprint)
        .filter(issue => ANSWER_INTEGRITY_CODES.has(issue.code))
        .map(issue => `${issue.code} ${issue.itemId}: ${issue.message}`)
    );
  }

  assert.equal(sourceFiles.length, 30);
  assert.deepEqual(findings, []);
});
