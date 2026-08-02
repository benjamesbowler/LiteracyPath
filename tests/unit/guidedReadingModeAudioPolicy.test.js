import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  canUseGuidedReadingReadAloud,
  getActiveGuidedReadingSessionHost
} from "../../src/components/guided-reading/readingSessionUi.js";

const staleGroupHost = {
  session: {
    id: "old-group-session",
    book_id: "old-group-book",
    page_numbers: [2],
    page_index: 0,
    status: "ended"
  },
  onTurn() {}
};

test("stale group state cannot disable normal child full-book audio", () => {
  assert.equal(getActiveGuidedReadingSessionHost("student", staleGroupHost), null);
  assert.equal(canUseGuidedReadingReadAloud("student", staleGroupHost), true);
});

test("stale group state cannot alter a normal teacher reader either", () => {
  assert.equal(getActiveGuidedReadingSessionHost("teacher", staleGroupHost), null);
  assert.equal(canUseGuidedReadingReadAloud("teacher", staleGroupHost), true);
});

test("an ended class-mode session cannot suppress local narration controls", () => {
  assert.equal(getActiveGuidedReadingSessionHost("class", staleGroupHost), null);
  assert.equal(canUseGuidedReadingReadAloud("class", staleGroupHost), true);
});

test("only a live class-mode host owns group reading and suppresses local narration controls", () => {
  const activeGroupHost = {
    ...staleGroupHost,
    session: { ...staleGroupHost.session, status: "active" }
  };
  assert.equal(getActiveGuidedReadingSessionHost("class", activeGroupHost), activeGroupHost);
  assert.equal(canUseGuidedReadingReadAloud("class", activeGroupHost), false);
});

test("the reader renders audio controls from the scoped read-aloud policy", () => {
  const source = readFileSync(
    new URL("../../src/components/guided-reading/GuidedReadingPage.jsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /readAloudControlsEnabled && <div className="guided-read-aloud-controls"/);
  assert.doesNotMatch(source, /!sessionHost\?\.session && <div className="guided-read-aloud-controls"/);
});
