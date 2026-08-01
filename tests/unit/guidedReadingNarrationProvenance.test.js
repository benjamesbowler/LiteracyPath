import assert from "node:assert/strict";
import test from "node:test";

import { auditGuidedReadingNarrationProvenance } from "../../tools/checkGuidedReadingNarrationProvenance.mjs";

test("every Guided Reading page keeps word-for-word narration provenance", () => {
  const audit = auditGuidedReadingNarrationProvenance();
  assert.equal(audit.livePageCount, 1617);
  assert.equal(audit.wordSequenceMismatchCount, 0);
  assert.equal(audit.missingAudioCount, 0);
  assert.equal(audit.unknownProvenanceCount, 0);
  assert.equal(audit.snapshotMatches, true);
  assert.deepEqual(audit.failures, []);
});
