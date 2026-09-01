import test from "node:test";
import assert from "node:assert/strict";

import { PRONUNCIATION_RECORDS } from "../../src/features/soundSeekers/content/pronunciationRecords.js";
import {
  CMU_PRONUNCIATION_REFERENCE,
  assertPronunciationsMatchReference
} from "../../tools/soundSeekersPronunciationAudit.mjs";

test("every shipping word has one pinned independent en-US pronunciation authority", () => {
  assert.equal(Object.keys(CMU_PRONUNCIATION_REFERENCE).length, Object.keys(PRONUNCIATION_RECORDS).length);
  assert.deepEqual(
    CMU_PRONUNCIATION_REFERENCE.bridge,
    { sourceKey: "bridge", arpabet: ["B", "R", "IH", "JH"] }
  );
  assert.deepEqual(
    CMU_PRONUNCIATION_REFERENCE.table,
    { sourceKey: "table", arpabet: ["T", "EY", "B", "AH", "L"] }
  );
});

test("all authored sound units match their independent ordered phoneme sequences", () => {
  assert.doesNotThrow(() => assertPronunciationsMatchReference(PRONUNCIATION_RECORDS));
});

test("the independent audit catches a structurally valid but phonically wrong record", () => {
  const wrongGo = {
    ...PRONUNCIATION_RECORDS.go,
    units: PRONUNCIATION_RECORDS.go.units.map(unit => unit.grapheme === "o"
      ? { ...unit, soundKey: "short_o" }
      : unit)
  };
  assert.throws(
    () => assertPronunciationsMatchReference({ ...PRONUNCIATION_RECORDS, go: wrongGo }),
    /go.*G OW.*G AA/i
  );
});
