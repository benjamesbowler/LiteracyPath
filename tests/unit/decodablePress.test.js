import test from "node:test";
import assert from "node:assert/strict";
import { PRESS_ASSETS } from "../../src/content/decodablePress/pressAssetRegistry.js";
import { PRESS_CONTENT_REVIEW } from "../../src/content/decodablePress/pressContentReviews.js";
import { PRESS_PROJECT_TEMPLATES } from "../../src/content/decodablePress/pressProjectTemplates.js";
import { PRESS_WORD_BANKS } from "../../src/content/decodablePress/pressWordBanks.js";
import { analyzeSentenceDecodability, classifyPressWord } from "../../src/utils/decodablePress/analyzeSentenceDecodability.js";
import { canPublishBookRevision, validatePressBook } from "../../src/utils/decodablePress/pressPublicationPolicy.js";
import { buildPressBookletDocument } from "../../src/utils/decodablePress/printPressBook.js";

test("press packs are reviewed, meaningful, and cover the curriculum ranges", () => {
  assert.deepEqual(PRESS_WORD_BANKS.map(pack => [pack.cycleMin, pack.cycleMax]), [[1, 12], [13, 24], [25, 36]]);
  assert.ok(PRESS_PROJECT_TEMPLATES.every(template => template.pagePrompts.length === 4 && template.review.status === "approved"));
  assert.ok(PRESS_PROJECT_TEMPLATES.every(template => template.review.narrativeChecks.some(check => /ending|solution/.test(check))));
});

test("classification preserves intended words and remains writing support", () => {
  assert.equal(classifyPressWord({ word: "Cat!", decodableWords: ["cat"] }).state, "decodable");
  assert.equal(classifyPressWord({ word: "THE", knownHighFrequencyWords: ["the"] }).state, "known_hfw");
  assert.equal(classifyPressWord({ word: "dragon", approvedChallenges: ["dragon"] }).state, "approved_challenge");
  const result = analyzeSentenceDecodability({ sentence: "The cat met a dragon.", decodableWords: ["cat", "met", "a"], knownHighFrequencyWords: ["the"] });
  assert.deepEqual(result.needsReview, ["dragon"]);
  assert.equal(result.purpose, "writing_support_not_assessment");
});

test("only the exact approved revision can publish", () => {
  const review = { revisionId: "revision-2", decision: "approved", allowClassLibrary: true };
  assert.equal(canPublishBookRevision({ revisionId: "revision-2", review, requestedVisibility: "class" }).allowed, true);
  assert.equal(canPublishBookRevision({ revisionId: "revision-1", review, requestedVisibility: "private" }).allowed, false);
  assert.equal(canPublishBookRevision({ revisionId: "revision-2", review: { ...review, decision: "changes_requested" }, requestedVisibility: "private" }).allowed, false);
});

test("book revisions accept only reviewed local assets", () => {
  assert.ok(PRESS_ASSETS.every(asset => asset.reviewStatus === "approved" && asset.alt && asset.src.startsWith("/images/")));
  const book = validatePressBook({ title: "The wet path", pages: PRESS_PROJECT_TEMPLATES[0].pagePrompts.map((prompt, index) => ({ promptId: prompt.id, text: `Page ${index + 1}.`, assetId: PRESS_ASSETS[index].id })) }, { assetIds: PRESS_ASSETS.map(asset => asset.id) });
  assert.equal(book.pages.length, 4);
  assert.equal(PRESS_CONTENT_REVIEW.checks.noChildCapture, true);
});

test("the printable booklet freezes one revision and keeps useful image alternatives", () => {
  const pages=PRESS_PROJECT_TEMPLATES[0].pagePrompts.map((prompt,index)=>({promptId:prompt.id,text:`Story page ${index+1}.`,assetId:PRESS_ASSETS[index].id}));
  const {html}=buildPressBookletDocument({book:{title:"A small plan",pages},authorName:"Mina",revisionId:"revision-exact-12345678"});
  assert.equal((html.match(/data-revision-id="revision-exact-12345678"/g)||[]).length,4);
  assert.equal((html.match(/<img /g)||[]).length,4);
  assert.equal((html.match(/ alt="[^"]+"/g)||[]).length,4);
  assert.match(html,/Teacher-approved revision revision/);
});
