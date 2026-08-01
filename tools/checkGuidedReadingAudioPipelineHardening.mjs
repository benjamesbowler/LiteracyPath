#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  canonicalVisibleText,
  findNormalizedPageTextCollisions,
  sameSpokenWords,
  sha256,
  stableStringify
} from "./guidedReadingAudioPipelineLib.mjs";
import {
  buildGuidedReadingNarrationProvenanceModule,
  isGuidedReadingNarrationCleared
} from "./guidedReadingNarrationProvenanceLib.mjs";

const collisionRows = [
  {
    bookId: "book-a",
    pageNumber: 1,
    displayedText: "Go.",
    normalizedText: "go"
  },
  {
    bookId: "book-b",
    pageNumber: 2,
    displayedText: "Go!",
    normalizedText: "go"
  }
];

const unresolved = findNormalizedPageTextCollisions(collisionRows, {});
assert.equal(unresolved.length, 1);
assert.equal(unresolved[0].resolved, false);
assert.deepEqual(unresolved[0].unresolvedExactTexts, ["Go."]);

const resolved = findNormalizedPageTextCollisions(collisionRows, {
  "Go.": "/audio/production/en-US/guided_page/go-period.mp3"
});
assert.equal(resolved[0].resolved, true);

assert.equal(canonicalVisibleText("  “Go”  now. "), "\"Go\" now.");
assert.equal(sameSpokenWords("The sun is hot!", "the sun is hot"), true);
assert.equal(sameSpokenWords("The sun is hot!", "the sun was hot"), false);
assert.equal(stableStringify({ z: 1, a: { d: 2, b: 3 } }), '{"a":{"b":3,"d":2},"z":1}');

const auditFixture = {
  activeBookCount: 1,
  livePageCount: 1,
  productionManifestPageCount: 1,
  productionManifestSha256: "manifest",
  corpusSha256: "corpus",
  narrationRebuildClearanceSha256: "clearance",
  wordSequenceMismatchCount: 0,
  pageAudioTextMismatchCount: 0,
  normalizedCollisionCount: 0,
  pages: []
};
const moduleFixture = {
  audit: auditFixture,
  voice: "en-US-Chirp3-HD-Leda",
  exactOverrides: {}
};
const firstModule = buildGuidedReadingNarrationProvenanceModule(moduleFixture);
const secondModule = buildGuidedReadingNarrationProvenanceModule(moduleFixture);
assert.equal(firstModule, secondModule);
assert.match(firstModule, /schemaVersion/);
assert.match(firstModule, /Object\.freeze\(\{\}\)/);

const clearance = {
  "book-a::1": {
    displayedTextSha256: sha256("Go."),
    audioPath: "/audio/production/en-US/guided_page/go.mp3",
    audioSha256: "audio-hash",
    voice: "en-US-Chirp3-HD-Leda"
  }
};
assert.equal(isGuidedReadingNarrationCleared({
  clearance,
  bookId: "book-a",
  pageNumber: 1,
  displayedText: "Go.",
  audioPath: "/audio/production/en-US/guided_page/go.mp3",
  audioSha256: "audio-hash",
  voice: "en-US-Chirp3-HD-Leda"
}), true);
assert.equal(isGuidedReadingNarrationCleared({
  clearance,
  bookId: "book-a",
  pageNumber: 1,
  displayedText: "Stop.",
  audioPath: "/audio/production/en-US/guided_page/go.mp3",
  audioSha256: "audio-hash",
  voice: "en-US-Chirp3-HD-Leda"
}), false);

console.log(JSON.stringify({
  normalizedCollisionGuard: "passed",
  exactOverrideResolution: "passed",
  transcriptWordSequence: "passed",
  deterministicSerialization: "passed",
  deterministicProvenanceModule: "passed",
  exactHashClearanceGuard: "passed"
}, null, 2));
