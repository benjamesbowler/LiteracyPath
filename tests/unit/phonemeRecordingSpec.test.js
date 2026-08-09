import assert from "node:assert/strict";
import test from "node:test";

import { PHONEME_RECORDING_TARGETS } from "../../src/data/phonemeRecordingSpec.js";
import { NEEDS_AUDIO, QUEST_STOPS } from "../../src/data/questSequence.js";

test("every Sound Seekers sound-only curriculum cue has a recording specification", () => {
  const excludedKinds = new Set(["blend", "morph"]);
  const taughtKeys = new Set(
    QUEST_STOPS.flatMap(stop => stop.teach || [])
      .filter(item => !excludedKinds.has(item.kind))
      .map(item => item.id)
  );
  const specifiedKeys = new Set(PHONEME_RECORDING_TARGETS.map(item => item.key));
  assert.deepEqual([...specifiedKeys].sort(), [...taughtKeys].sort());
});

test("recording specifications are unique, complete and third-party neutral", () => {
  const keys = PHONEME_RECORDING_TARGETS.map(item => item.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const item of PHONEME_RECORDING_TARGETS) {
    assert.ok(item.ipa);
    assert.ok(item.anchor);
    assert.ok(item.direction);
    assert.ok(item.takeIds.length >= 1);
    assert.equal(new Set(item.takeIds).size, item.takeIds.length);
    assert.doesNotMatch(`${item.anchor} ${item.direction}`, /read naturally|third-party clip/i);
  }
});

test("known multi-pronunciation spellings require separate takes", () => {
  const targets = Object.fromEntries(PHONEME_RECORDING_TARGETS.map(item => [item.key, item]));
  assert.deepEqual(targets.th.takeIds, ["th-unvoiced", "th-voiced"]);
  assert.deepEqual(targets.u_e.takeIds, ["u-e-yoo", "u-e-oo"]);
  assert.deepEqual(targets.ew.takeIds, ["ew-yoo", "ew-oo"]);
});

test("every declared missing human Sound Seekers cue is a dedicated alternative take", () => {
  const targets = Object.fromEntries(PHONEME_RECORDING_TARGETS.map(item => [item.key, item]));
  assert.deepEqual(NEEDS_AUDIO, []);
  for (const key of NEEDS_AUDIO) {
    assert.equal(targets[key]?.kind, "alternative", `${key} needs an alternative recording specification`);
    assert.deepEqual(targets[key]?.takeIds, [key]);
  }
});
