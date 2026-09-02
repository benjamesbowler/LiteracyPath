import assert from "node:assert/strict";
import test from "node:test";

import { buildStudentHomeCardState } from "../../src/policy/learningPolicy.js";
import {
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
      setItem: (key, value) => values.set(key, String(value))
    }
  };
  try {
    return callback();
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

test("Adventure Map loaders keep their established corrupt-data behavior", () => {
  withLocalProgress("child-1", "{not json", () => {
    assert.deepEqual(readElQuestLocalProgress("child-1"), { ok: false, value: {} });
    assert.throws(() => loadElQuestProgress("child-1"), SyntaxError);
  });
});
