import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { expandBank } from "../../tools/assessmentRebuild/lib.mjs";
import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";

const SKILL_IDS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];

// These choices were rejected during independent item-by-item semantic review.
// Keeping the concrete rivals here makes a future option shuffle fail closed,
// without pretending that a word is always wrong regardless of its sentence.
const REJECTED_RIVALS = {
  "lp3.hfw_1_25.l1.A.a.v1": ["the", "this", "his"],
  "lp3.hfw_1_25.l1.B.a.v2": ["the", "that", "his"],
  "lp3.hfw_1_25.l1.A.at.v1": ["in", "from", "for"],
  "lp3.hfw_1_25.l1.B.at.v2": ["from", "for"],
  "lp3.hfw_1_25.l1.A.be.v1": ["have"],
  "lp3.hfw_1_25.l1.A.for.v1": ["from"],
  "lp3.hfw_1_25.l1.B.for.v2": ["from", "with"],
  "lp3.hfw_1_25.l1.A.in.v1": ["on"],
  "lp3.hfw_1_25.l1.B.in.v2": ["on"],
  "lp3.hfw_1_25.l1.A.is.v1": ["was"],
  "lp3.hfw_1_25.l1.A.of.v1": ["from", "with"],
  "lp3.hfw_1_25.l1.B.of.v2": ["from", "to", "with"],
  "lp3.hfw_1_25.l1.A.on.v1": ["in", "at"],
  "lp3.hfw_1_25.l1.B.on.v2": ["in", "at"],
  "lp3.hfw_1_25.l1.B.they.v2": ["his"],
  "lp3.hfw_1_25.l1.A.to.v1": ["in"],
  "lp3.hfw_1_25.l1.B.to.v2": ["for"],
  "lp3.hfw_1_25.l1.A.with.v1": ["in"],
  "lp3.hfw_1_25.l1.B.you.v2": ["he", "I"],
  "lp3.hfw_1_25.l1.R.a.v7r": ["the", "this"],
  "lp3.hfw_1_25.l1.R.for.v7r": ["from", "with", "on"],

  "lp3.hfw_26_50.l1.B.all.v2": ["the"],
  "lp3.hfw_26_50.l1.B.what.v2": ["that"],
  "lp3.hfw_26_50.l1.A.use.v1": ["can"],
  "lp3.hfw_26_50.l1.A.when.v1": ["how"],

  "lp3.hfw_51_75.l1.A.about.v1": ["to", "with"],
  "lp3.hfw_51_75.l1.B.about.v2": ["from", "for"],
  "lp3.hfw_51_75.l1.A.like.v1": ["use", "have"],
  "lp3.hfw_51_75.l1.A.these.v1": ["your", "his", "their"],
  "lp3.hfw_51_75.l1.B.these.v2": ["her", "your", "their"],
  "lp3.hfw_51_75.l1.A.will.v1": ["can"],
  "lp3.hfw_51_75.l1.B.will.v2": ["can"],
  "lp3.hfw_51_75.l1.B.would.v2": ["can", "have", "had"],
  "lp3.hfw_51_75.l1.R.would.v7r": ["can"],
  "lp3.hfw_51_75.l1.A.write.v1": ["use"],
  "lp3.hfw_51_75.l1.B.look.v2": ["have", "be"],
  "lp3.hfw_51_75.l1.B.so.v2": ["this"],

  "lp3.hfw_76_100.l1.A.come.v1": ["go"],
  "lp3.hfw_76_100.l1.A.could.v1": ["can"],
  "lp3.hfw_76_100.l1.B.could.v2": ["can", "would"],
  "lp3.hfw_76_100.l1.R.could.v7r": ["can", "will"],
  "lp3.hfw_76_100.l1.A.day.v1": ["time"],
  "lp3.hfw_76_100.l1.A.down.v1": ["up"],
  "lp3.hfw_76_100.l1.A.made.v1": ["did"],
  "lp3.hfw_76_100.l1.B.made.v2": ["did"],
  "lp3.hfw_76_100.l1.A.may.v1": ["will"],
  "lp3.hfw_76_100.l1.B.may.v2": ["will"],
  "lp3.hfw_76_100.l1.B.now.v2": ["then"],
  "lp3.hfw_76_100.l1.B.number.v2": ["time"],
  "lp3.hfw_76_100.l1.A.oil.v1": ["water"],
  "lp3.hfw_76_100.l1.B.oil.v2": ["water", "time"],
  "lp3.hfw_76_100.l1.B.than.v2": ["with"]
};

// A semantic judgment cannot be reconstructed from token overlap alone. These
// hashes freeze the complete independently reviewed cloze fixtures (sentence,
// prompts, answer set, rationale codes, and retention role). Any future change
// therefore requires another direct semantic review.
const REVIEWED_FIXTURE_HASHES = {
  hfw_1_25: "e97152b0b222c6e9fdebda9aadaced1ec23e01bf33f6099f5fe446bc52bb375a",
  hfw_26_50: "d9e9be1fc356ac6901a717c1bbc81557555dd618c97676b02f6ba6427347af67",
  hfw_51_75: "ec8ea5c00c19dadf6ab1a6e8fd05afdef32e7141813bf2287d6dc24708e63ef4",
  hfw_76_100: "1754ba2029b0dd7b4c585e74b42a8a8f3cb440888f4c9ee85aaa049c95756f4f"
};

async function loadClozeItems(skillId) {
  const source = (await import(`../../tools/assessmentRebuild/authoring/${skillId}.mjs`)).default;
  return expandBank(source, skillBlueprints[skillId], source.imageResolver)
    .filter(item => item.formatType === "HFW_SENTENCE_CLOZE")
    .sort((left, right) => left.id.localeCompare(right.id));
}

function reviewedFixture(items) {
  return items.map(item => ({
    id: item.id,
    sentence: item.sentence,
    prompt: item.prompt,
    spokenPrompt: item.spokenPrompt,
    answer: item.answer,
    choices: [...item.choices].sort(),
    distractorRationales: Object.fromEntries(
      Object.entries(item.distractorRationales || {}).sort(([left], [right]) => left.localeCompare(right))
    ),
    retentionOnly: item.retentionOnly
  }));
}

test("independently rejected HFW rival completions stay out of their reviewed items", async () => {
  const items = (await Promise.all(SKILL_IDS.map(loadClozeItems))).flat();
  const byId = new Map(items.map(item => [item.id, item]));
  const failures = [];

  for (const [itemId, rejectedRivals] of Object.entries(REJECTED_RIVALS)) {
    const item = byId.get(itemId);
    assert.ok(item, `missing independently reviewed HFW cloze ${itemId}`);
    const offered = rejectedRivals.filter(rival => item.choices.includes(rival));
    if (offered.length) failures.push(`${itemId}: ${offered.join(", ")}`);
  }

  assert.deepEqual(failures, []);
});

test("independently reviewed HFW semantic fixtures remain unchanged", async () => {
  for (const skillId of SKILL_IDS) {
    const items = await loadClozeItems(skillId);
    assert.equal(items.length, 54, skillId);
    assert.equal(items.filter(item => item.retentionOnly).length, 4, skillId);
    const digest = createHash("sha256")
      .update(JSON.stringify(reviewedFixture(items)))
      .digest("hex");
    assert.equal(
      digest,
      REVIEWED_FIXTURE_HASHES[skillId],
      `${skillId} semantic fixture changed; repeat direct item-by-item review before updating the hash`
    );
  }
});
