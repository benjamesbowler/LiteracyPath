import assert from "node:assert/strict";
import test from "node:test";

import { summarizeMediaQaWorkload } from "../../src/utils/mediaQaWorkload.js";

test("media QA workload separates pairings from distinct image work", () => {
  const workload = summarizeMediaQaWorkload([
    { status: "pending", imagePath: "/a.webp" },
    { status: "pending", imagePath: "/a.webp" },
    { status: "pending", imagePath: "/b.webp" },
    { status: "pending" },
    { status: "approved", imagePath: "/c.webp" }
  ]);

  assert.deepEqual(workload, {
    pairings: 5,
    imagePairings: 4,
    uniqueImages: 3,
    textOnlyPairings: 1,
    pendingPairings: 4,
    pendingImagePairings: 3,
    pendingUniqueImages: 2,
    pendingTextOnlyPairings: 1
  });
});
