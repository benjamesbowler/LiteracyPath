import assert from "node:assert/strict";
import test from "node:test";

import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import { hfwApprovedWordsBySkill } from "../../src/data/hfwApprovedCoverageWords.js";
import {
  expandBank,
  lintBank
} from "../../tools/assessmentRebuild/lib.mjs";

const skillOrder = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];
const allowedBySkill = Object.fromEntries(skillOrder.map((skillId, index) => [
  skillId,
  new Set(skillOrder.slice(0, index + 1)
    .flatMap(id => hfwApprovedWordsBySkill[id])
    .map(word => word.toLowerCase()))
]));

async function expandedSource(skillId) {
  const source = (await import(`../../tools/assessmentRebuild/authoring/${skillId}.mjs`)).default;
  return {
    source,
    items: expandBank(source, skillBlueprints[skillId], source.imageResolver)
  };
}

test("every HFW cloze option belongs to its current or an earlier approved band", async () => {
  const failures = [];

  for (const skillId of skillOrder) {
    const { items } = await expandedSource(skillId);
    for (const item of items.filter(candidate => candidate.formatType === "HFW_SENTENCE_CLOZE")) {
      const invalid = item.choices.filter(choice => !allowedBySkill[skillId].has(String(choice).toLowerCase()));
      if (invalid.length) failures.push(`${item.id}: ${invalid.join(", ")}`);
    }
  }

  assert.equal(
    failures.length,
    0,
    `${failures.length} HFW clozes use out-of-band choices:\n${failures.slice(0, 20).join("\n")}`
  );
});

test("the shared authoring lint fails closed on an out-of-band HFW cloze filler", async () => {
  const { items } = await expandedSource("hfw_1_25");
  const control = items.find(item => item.formatType === "HFW_SENTENCE_CLOZE");
  assert.ok(control);

  const replaced = control.choices.find(choice => String(choice).toLowerCase() !== String(control.answer).toLowerCase());
  const mutated = {
    ...control,
    choices: control.choices.map(choice => choice === replaced ? "zookeeper" : choice),
    distractorRationales: {
      ...control.distractorRationales,
      zookeeper: "D-FUNCTION-SWAP"
    }
  };
  delete mutated.distractorRationales[replaced];

  const issues = lintBank([mutated], skillBlueprints.hfw_1_25);
  assert.equal(issues.some(issue => issue.code === "L-HFW-BAND"), true);
});
