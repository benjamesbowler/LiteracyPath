import assert from "node:assert/strict";
import test from "node:test";

import { summarizeMediaQaWorkload } from "../../src/utils/mediaQaWorkload.js";

test("media QA workload separates pairings from distinct image work", () => {
  const workload = summarizeMediaQaWorkload([
    { status: "accepted", imagePath: "/a.webp" },
    { status: "accepted", imagePath: "/a.webp" },
    { status: "accepted", imagePath: "/b.webp" },
    { status: "accepted" },
    { status: "quarantined", imagePath: "/c.webp" }
  ]);

  assert.deepEqual(workload, {
    pairings: 5,
    imagePairings: 4,
    uniqueImages: 3,
    textOnlyPairings: 1,
    acceptedPairings: 4,
    acceptedImagePairings: 3,
    acceptedUniqueImages: 2,
    acceptedTextOnlyPairings: 1,
    quarantinedPairings: 1
  });
});
