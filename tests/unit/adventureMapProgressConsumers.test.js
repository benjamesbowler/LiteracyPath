import assert from "node:assert/strict";
import test from "node:test";

import { buildStudentHomeCardState } from "../../src/policy/learningPolicy.js";
import {
  clearElQuestLocalProgress,
  loadElQuestProgress,
  readElQuestLocalProgress
} from "../../src/utils/adventureMapLocalProgress.js";
import { buildDailyMission } from "../../src/utils/dailyMission.js";
import { worldForScope } from "../../src/utils/palWorlds.js";

function withLocalProgress(scope, payload, callback) {
  const previousWindow = globalThis.window;
  const values = new Map([[`lp-el-quest:${scope}`, payload]]);
  globalThis.window = {
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key)
    }
  };
  try {
    return callback(values);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}

function legacyCompletedCycles() {
  return JSON.stringify({
    v: 1,
    cycles: Object.fromEntries(Array.from({ length: 27 }, (_, index) => [
      `cycle-${index + 1}`,
      { stars: 3 }
    ]))
  });
}

test("legacy local Adventure Map progress cannot advance map, home, mission, or world before hydration", () => {
  withLocalProgress("child-1", legacyCompletedCycles(), () => {
    const mapRead = readElQuestLocalProgress("child-1");
    assert.deepEqual(mapRead, {
      ok: true,
      value: { v: 1, schemaVersion: 2, progressEpoch: 2, cycles: {} }
    });
    assert.deepEqual(buildStudentHomeCardState("adventure-map", {
      adventureMap: mapRead.value
    }), {
      label: "New",
      tone: "new",
      progressText: ""
    });
    assert.equal(buildDailyMission("child-1").quest.detail, "Aa Mm");
    assert.equal(worldForScope("child-1").id, "meadow");
  });
});

test("v2 Adventure Map progress still drives pre-hydration local readers", () => {
  const current = JSON.stringify({
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: { "cycle-1": { stars: 3 }, "cycle-2": { stars: 3 } }
  });
  withLocalProgress("child-1", current, () => {
    assert.deepEqual(readElQuestLocalProgress("child-1").value.cycles, {
      "cycle-1": { stars: 3 },
      "cycle-2": { stars: 3 }
    });
    assert.equal(buildDailyMission("child-1").quest.detail, "Nn Ii");
  });
});

test("corrupt Adventure Map progress stays explicit until its exact local record is reset", () => {
  withLocalProgress("child-1", "{not json", values => {
    values.set("lp-quest:child-1", JSON.stringify({ untouched: true }));
    assert.deepEqual(readElQuestLocalProgress("child-1"), { ok: false, value: {} });
    assert.throws(() => loadElQuestProgress("child-1"), SyntaxError);
    assert.equal(clearElQuestLocalProgress("child-1"), true);
    assert.deepEqual(readElQuestLocalProgress("child-1"), {
      ok: true,
      value: { schemaVersion: 2, progressEpoch: 2, cycles: {} }
    });
    assert.equal(values.get("lp-quest:child-1"), JSON.stringify({ untouched: true }));
  });
});

test("an existing empty Adventure Map record is corrupt, not a missing save", () => {
  withLocalProgress("child-empty", "", values => {
    assert.deepEqual(readElQuestLocalProgress("child-empty"), { ok: false, value: {} });
    assert.throws(() => loadElQuestProgress("child-empty"), SyntaxError);
    assert.equal(values.get("lp-el-quest:child-empty"), "");
  });
});

test("current Adventure Map progress with null or array cycles stays unreadable and byte-exact", () => {
  const raws = [
    '{ "schemaVersion" : 2, "progressEpoch" : 2, "cycles" : null }',
    '{ "schemaVersion" : 2, "progressEpoch" : 2, "cycles" : [] }'
  ];
  raws.forEach((raw, index) => {
    const scope = `malformed-current-${index}`;
    withLocalProgress(scope, raw, values => {
      assert.deepEqual(readElQuestLocalProgress(scope), { ok: false, value: {} });
      assert.throws(() => loadElQuestProgress(scope), SyntaxError);
      assert.equal(values.get(`lp-el-quest:${scope}`), raw);
    });
  });
});

test("future Adventure Map progress is blocked as unsupported and kept byte-for-byte intact", () => {
  const raw = JSON.stringify({
    schemaVersion: 3,
    progressEpoch: 2,
    cycles: { "cycle-1": { stars: 3 } },
    futureOnly: { checkpoint: "keep-exactly" }
  });
  withLocalProgress("child-1", raw, values => {
    assert.deepEqual(readElQuestLocalProgress("child-1"), {
      ok: false,
      reason: "unsupported_version",
      value: {}
    });
    assert.throws(
      () => loadElQuestProgress("child-1"),
      error => error?.code === "el_quest_progress_unsupported_version"
    );
    assert.equal(values.get("lp-el-quest:child-1"), raw);
  });
});
