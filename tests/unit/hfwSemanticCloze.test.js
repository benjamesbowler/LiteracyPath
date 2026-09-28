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
  "lp3.hfw_76_100.l1.B.than.v2": ["with"],
  "lp3.hfw_76_100.l1.A.water.v1": ["more"],
  "lp3.hfw_76_100.l1.B.water.v2": ["time", "more"]
};

// A semantic judgment cannot be reconstructed from token overlap alone. These
// hashes freeze the complete independently reviewed cloze fixtures (sentence,
// prompts, answer set, rationale codes, and retention role). Any future change
// therefore requires another direct semantic review.
const REVIEWED_FIXTURE_HASHES = {
  hfw_1_25: "30bed00c5718c487a98aed5cc4d72c5f2647998b0c9f7efb0b7d7aef7bf7bc57",
  hfw_26_50: "95b2a1f0b1bc5eb8ea8236d271d8c6b69fcca1c13cf732b4bca4b1ba77520bd6",
  hfw_51_75: "b4d0b98108fcdc7c4500f085b75d660d18275e04cd24039cbba8012804b7c099",
  hfw_76_100: "499e68b10f6f7affd6277c39d95cf9f17e2dc010c6cd178db007526cbe00fe37"
};

// Explicitly preserve the reviewed 54-item subset as the bank grows. The two
// refreshed digests follow direct review of three intervening source edits;
// see docs/skills-assessment-rebuild/HFW_DEPTH_REVIEW_2026-09-28.md.
const ORIGINAL_REVIEWED_RESERVES = {
  hfw_1_25: ["a.v7r", "for.v7r", "was.v7r", "they.v7r"],
  hfw_26_50: ["said.v7r", "their.v7r", "were.v7r", "one.v7r"],
  hfw_51_75: ["would.v7r", "write.v7r", "two.v8r", "many.v7r"],
  hfw_76_100: ["could.v7r", "been.v7r", "who.v7r", "than.v7r"]
};
const DEPTH_REVIEW_HASHES = {
  hfw_1_25: "9cb23ecee58a28a2a4a92b3d92ce2449f19e2dfc03df64cbefb6704c75584b53",
  hfw_26_50: "bbb9faf33391e975aadea999694d8d2f533c88b8adea9db23e72ba699b8203d6",
  hfw_51_75: "ab9cf99126262fe3eadba7d3e1dd3a717cf4b4ea15872ec5732a5ab55901bbef",
  hfw_76_100: "e45586038ca02c768a5946f70a2b09141e3e011aa4f4b6e3284013adc0e0f13c"
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
    const items = (await loadClozeItems(skillId)).filter(item => /\.v[12]$/.test(item.id)
      || ORIGINAL_REVIEWED_RESERVES[skillId].some(suffix => item.id === `lp3.${skillId}.l1.R.${suffix}`));
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

test("the 200 reviewed depth contexts retain complete cues, distinct contexts and spelling tiles", async () => {
  for (const skillId of SKILL_IDS) {
    const source = (await import(`../../tools/assessmentRebuild/authoring/${skillId}.mjs`)).default;
    const items = expandBank(source, skillBlueprints[skillId], source.imageResolver)
      .filter(item => Number(item.id.match(/\.v(\d+)$/)?.[1]) >= 101)
      .sort((left, right) => left.id.localeCompare(right.id));
    assert.equal(items.length, 50, skillId);
    assert.equal(new Set(items.map(item => item.itemKey)).size, 25, skillId);
    assert.equal(new Set(items.map(item => item.sentence)).size, 50, skillId);
    for (const level of [1, 2]) assert.equal(items.filter(item => item.level === level).length, 25, skillId);
    for (const item of items) {
      const complete = item.sentence.replace("___", item.answer).toLowerCase();
      assert.ok(item.spokenPrompt.toLowerCase().includes(complete), `${item.id}: the heard sentence must pin the exact word`);
      assert.equal(item.choices.filter(choice => choice === item.answer).length, 1, item.id);
      if (item.level === 2) {
        const remaining = [...item.letterTiles];
        for (const letter of item.answer) {
          const index = remaining.indexOf(letter);
          assert.ok(index >= 0, `${item.id}: missing repeated letter ${letter}`);
          remaining.splice(index, 1);
        }
        assert.ok(remaining.length >= 2, `${item.id}: preserve competing tiles`);
      }
    }
    const fixture = reviewedFixture(items).map((item, index) => ({ ...item,
      letterTiles: items[index].letterTiles, constructClaim: items[index].constructClaim }));
    assert.equal(createHash("sha256").update(JSON.stringify(fixture)).digest("hex"), DEPTH_REVIEW_HASHES[skillId],
      `${skillId}: repeat literal cue, answer and tile review before refreshing the depth fixture`);
  }
});


test("some is pinned by a stated partial quantity rather than an open-ended offer", async () => {
  const items = await loadClozeItems("hfw_51_75");
  const first = items.find(item => item.id === "lp3.hfw_51_75.l1.A.some.v1");
  const second = items.find(item => item.id === "lp3.hfw_51_75.l1.B.some.v2");
  assert.equal(first.sentence, "Of eight birds, three sing. ___ birds sing.");
  assert.equal(second.sentence, "I ate ___ of eight slices: exactly three.");
  for (const item of [first, second]) {
    assert.equal(item.answer, "some");
    assert.ok(item.choices.includes("all"), "the all/some contrast remains meaningful");
  }
});
