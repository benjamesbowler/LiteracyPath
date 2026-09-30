import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { mergeMediaQaReviewItems } from "../../src/data/mediaQaReviewStatus.js";
import { syncStoryQuestMediaQaItems } from "../../tools/syncStoryQuestMediaQa.mjs";

const hash = value => createHash("sha256").update(value).digest("hex");
function fixture() {
  const image = Buffer.from("current image bytes");
  const audio = Buffer.from("current narration bytes");
  return {
    existingItems: [
      { area: "assessment", reviewId: "outside-a", status: "quarantined", notes: "Keep this exact defect", custom: { score: 3 } },
      { area: "story_quests", bookId: "book", pageId: "book:old", reviewId: "retired", status: "accepted", imagePath: "/retired.webp" },
      { area: "guided_reading", reviewId: "outside-b", status: "approved", reviewedAt: "2025-01-01", notes: "Original review" },
      { area: "story_quests", bookId: "book", pageId: "book:current", reviewId: "stable-current", status: "accepted", imagePath: "/scene.webp?v=old", text: "Old sentence.", reviewedAt: "2026-08-09", notes: "Completed visual and listening review." }
    ],
    quests: [{ id: "book", title: "Current book", level: "A", pages: [{
      id: "current", text: ["The cat sits."], imageUrl: "/scene.webp?v=new", imageAlt: "A sitting cat.", skillTags: ["cat"], choices: [{ label: "Next", nextPageId: "end" }]
    }] }],
    narrationManifest: { generator: "tools/generateStoryQuestLedaAudio.mjs", clips: [{
      key: "the cat sits", text: "The cat sits.", audioPath: "/current.mp3", audioSha256: hash(audio), voice: "en-US-Chirp3-HD-Leda", source: "Google Cloud Text-to-Speech", references: [{ questId: "book", pageId: "current", text: "The cat sits." }]
    }] },
    getNarrationPath: () => "/current.mp3",
    readAsset: asset => ({ "/scene.webp": image, "/current.mp3": audio })[asset]
  };
}

test("sync removes retired rows, refreshes exact media, and leaves every unrelated row and status untouched", () => {
  const input = fixture();
  const before = structuredClone(input.existingItems);
  const result = syncStoryQuestMediaQaItems(input);
  assert.deepEqual(input.existingItems, before);
  assert.deepEqual(result.items.filter(item => item.area !== "story_quests"), before.filter(item => item.area !== "story_quests"));
  assert.equal(result.summary.unrelatedRowsUnchanged, true);
  assert.equal(result.summary.removedStoryQuestRows, 1);
  const [row] = result.items.filter(item => item.area === "story_quests");
  assert.equal(row.reviewId, "stable-current");
  assert.equal(row.status, "accepted");
  assert.equal(row.imagePath, "/scene.webp?v=new");
  assert.equal(row.imageSha256, hash(input.readAsset("/scene.webp")));
  assert.equal(row.audioSha256, hash(input.readAsset("/current.mp3")));
  assert.equal(row.text, "The cat sits.");
  assert.deepEqual(row.answerChoices, ["Next"]);
  assert.equal(row.reviewedAt, "");
  assert.doesNotMatch(row.notes, /Completed visual and listening review/);
  assert.equal(result.priorRows[1].notes, "Completed visual and listening review.");
});

test("sync preserves quarantine across changed media and retains reviews only for identical fingerprints", () => {
  const input = fixture();
  input.existingItems[3].status = "quarantined";
  input.existingItems[3].notes = "Cat has an extra leg.";
  const first = syncStoryQuestMediaQaItems(input);
  const row = first.items.find(item => item.area === "story_quests");
  assert.equal(row.status, "quarantined");
  assert.match(row.notes, /Prior review notes: Cat has an extra leg/);
  row.reviewedAt = "2026-09-30";
  row.notes = "Current image inspected; reported defect remains.";
  const second = syncStoryQuestMediaQaItems({ ...input, existingItems: first.items });
  assert.deepEqual(second.items, first.items);
  input.readAsset = asset => asset === "/scene.webp" ? Buffer.from("replaced image") : Buffer.from("current narration bytes");
  const changed = syncStoryQuestMediaQaItems({ ...input, existingItems: second.items }).items.find(item => item.area === "story_quests");
  assert.equal(changed.status, "quarantined");
  assert.equal(changed.reviewedAt, "");
});

test("sync adds a newly authored scene without inventing review observation", () => {
  const input = fixture();
  input.existingItems = input.existingItems.filter(item => item.area !== "story_quests");
  const result = syncStoryQuestMediaQaItems(input);
  const row = result.items.at(-1);
  assert.equal(result.summary.addedStoryQuestRows, 1);
  assert.equal(row.status, "accepted");
  assert.equal(row.reviewedAt, "");
  assert.match(row.notes, /no new visual or human-listening observation/);
  assert.ok(row.reviewId.endsWith("::/scene.webp"));
});

test("sync rejects stale narration, mismatched bytes, and missing scene art before producing rows", () => {
  const stale = fixture();
  stale.narrationManifest.clips[0].references[0].text = "The cat slept.";
  assert.throws(() => syncStoryQuestMediaQaItems(stale), /Missing exact narration/);
  const mismatched = fixture();
  mismatched.narrationManifest.clips[0].audioSha256 = "old-hash";
  assert.throws(() => syncStoryQuestMediaQaItems(mismatched), /Narration bytes differ/);
  const missing = fixture();
  missing.readAsset = () => undefined;
  assert.throws(() => syncStoryQuestMediaQaItems(missing), /Missing or empty current media/);
});

test("sync refuses duplicated current page identities", () => {
  const input = fixture();
  input.quests[0].pages.push(input.quests[0].pages[0]);
  assert.throws(() => syncStoryQuestMediaQaItems(input), /Duplicate current Story Quest page/);
});

test("saved Story Quest decisions retain quarantine while labeling a changed snapshot's notes as historical", () => {
  const current = syncStoryQuestMediaQaItems(fixture()).items.find(item => item.area === "story_quests");
  const decision = {
    ...current, imagePath: "/old.webp", imageSha256: "old-image", audioPath: "/old.mp3",
    audioSha256: "old-audio", text: "Old story.", answerChoices: ["Old choice"],
    mediaFingerprint: "earlier-fingerprint",
    status: "quarantined", reviewedAt: "2026-09-30", notes: "Narration clips the last word."
  };
  const [merged] = mergeMediaQaReviewItems([current], { [current.reviewId]: decision });
  assert.deepEqual(merged, {
    ...current, status: decision.status, reviewedAt: "",
    notes: "Historical review (2026-09-30) for earlier or unverified content: Narration clips the last word."
  });
  assert.equal(current.status, "accepted");
});

test("matching nonempty Story Quest fingerprints retain current review notes and date", () => {
  const current = syncStoryQuestMediaQaItems(fixture()).items.find(item => item.area === "story_quests");
  const decision = {
    mediaFingerprint: current.mediaFingerprint, status: "quarantined",
    reviewedAt: "2026-09-30", notes: "Current narration has a clipped ending."
  };
  assert.deepEqual(mergeMediaQaReviewItems([current], { [current.reviewId]: decision }), [{
    ...current, status: decision.status, reviewedAt: decision.reviewedAt, notes: decision.notes
  }]);
});

test("legacy Story Quest review claims remain historical and never become current listening evidence", () => {
  const current = syncStoryQuestMediaQaItems(fixture()).items.find(item => item.area === "story_quests");
  const legacy = { status: "accepted", reviewedAt: "2026-08-09", notes: "Complete human listening approved." };
  for (const row of [current, { ...current, mediaFingerprint: "" }]) {
    const [merged] = mergeMediaQaReviewItems([row], { [row.reviewId]: legacy });
    assert.equal(merged.status, "accepted");
    assert.equal(merged.reviewedAt, "");
    assert.equal(merged.notes, "Historical review (2026-08-09) for earlier or unverified content: Complete human listening approved.");
    assert.equal(merged.observation, current.observation);
  }
  const [undated] = mergeMediaQaReviewItems([current], { [current.reviewId]: { status: "quarantined", notes: "Wrong animal." } });
  assert.equal(undated.status, "quarantined");
  assert.equal(undated.reviewedAt, "");
  assert.equal(undated.notes, "Historical review for earlier or unverified content: Wrong animal.");
});

test("the Story Quest decision fix preserves existing merge behavior for unrelated areas", () => {
  const assessment = { area: "assessment", reviewId: "unchanged-area", text: "Current question.", status: "accepted" };
  const decision = { text: "Saved question.", status: "quarantined", notes: "Reported defect." };
  assert.deepEqual(mergeMediaQaReviewItems([assessment], { [assessment.reviewId]: decision }), [
    { ...assessment, ...decision }
  ]);
});
