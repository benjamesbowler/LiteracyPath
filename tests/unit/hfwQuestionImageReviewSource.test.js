import assert from "node:assert/strict";
import test from "node:test";

import {
  hfwQuestionImageReviewRows
} from "../../src/data/generated/hfwQuestionImageReview.generated.js";
import {
  compactHfwQuestionImageReviewRow,
  inflateHfwQuestionImageReviewRow
} from "../../tools/hfwQuestionImageReviewSource.mjs";

test("compact HFW image-review source recreates every public row exactly", async () => {
  assert.deepEqual(
    hfwQuestionImageReviewRows
      .map(compactHfwQuestionImageReviewRow)
      .map(inflateHfwQuestionImageReviewRow),
    hfwQuestionImageReviewRows
  );
});
