import assert from "node:assert/strict";
import test from "node:test";

import {
  assessmentImageStyleBlocklist,
  assessmentImageStyleBlockedPaths
} from "../../src/data/assessmentImageStyleBlocklist.js";
import {
  INITIAL_SOUND_LETTERS,
  initialSoundWordBank
} from "../../src/content/initialSounds/initialSoundWordBank.js";
import { isInitialSoundRuntimeEligible } from "../../src/content/initialSounds/initialSoundMediaEligibility.js";
import { findAssessmentMediaCandidates } from "../../src/data/assessmentMediaRegistry.js";
import {
  buildMediaQaRecords,
  isMediaQaRuntimeAllowed
} from "../../src/data/mediaQaManifest.js";

const knownRegressions = [
  "/media/initial-sounds/images/c/cake.webp",
  "/media/initial-sounds/images/b/bus.webp",
  "/images/child-mode/initial-sounds/bag.png",
  "/images/child-mode/initial-sounds/wig.png"
];

test("known anthropomorphic and rainbow-styled assessment images stay quarantined", () => {
  assert.equal(assessmentImageStyleBlockedPaths.size, assessmentImageStyleBlocklist.length);
  knownRegressions.forEach(assetPath => {
    assert.equal(assessmentImageStyleBlockedPaths.has(assetPath), true, assetPath);
    assert.equal(isMediaQaRuntimeAllowed(assetPath, "image"), false, assetPath);
  });
});

test("the media QA review surface exposes the human rejection reason", () => {
  const records = buildMediaQaRecords();
  const cake = records.find(record => record.filePath === "/media/initial-sounds/images/c/cake.webp");
  assert.equal(cake?.status, "rejected");
  assert.equal(cake?.rejectionReason, "face_on_inanimate_object");
  assert.equal(cake?.reviewedAt, "2026-07-18");
});

test("clean Initial Sounds replacements remain runtime eligible", () => {
  const expected = {
    bus: "/images/child-mode/initial-sounds/bus.png",
    cake: "/images/child-mode/initial-sounds/cake.png",
    car: "/images/child-mode/initial-sounds/car.png",
    sock: "/images/child-mode/initial-sounds/sock.png",
    star: "/images/child-mode/initial-sounds/star.png"
  };

  Object.entries(expected).forEach(([targetWord, imageUrl]) => {
    const item = initialSoundWordBank.find(row => row.targetWord === targetWord);
    assert.ok(item, targetWord);
    assert.equal(item.imageUrl, imageUrl, targetWord);
    assert.equal(isInitialSoundRuntimeEligible(item), true, targetWord);
  });
});

test("runtime Initial Sounds selection retains every assessed letter without blocked art", () => {
  const eligible = initialSoundWordBank.filter(item => isInitialSoundRuntimeEligible(item));
  eligible.forEach(item => {
    assert.equal(assessmentImageStyleBlockedPaths.has(item.imageUrl), false, item.imageUrl);
  });

  [1, 2].forEach(level => {
    const letters = new Set(eligible.filter(item => item.level === level).map(item => item.letter));
    assert.deepEqual([...letters].sort(), [...INITIAL_SOUND_LETTERS].sort());
  });
});

test("assessment media candidates never include the reviewed style blocklist", () => {
  ["bag", "bus", "cake", "car", "sock", "star"].forEach(word => {
    const candidates = findAssessmentMediaCandidates({
      word,
      skillId: "initial_sounds",
      mediaType: "image"
    });
    assert.ok(candidates.length > 0, word);
    candidates.forEach(candidate => {
      assert.equal(assessmentImageStyleBlockedPaths.has(candidate.path), false, candidate.path);
    });
  });
});
