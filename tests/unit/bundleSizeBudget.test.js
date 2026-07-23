import assert from "node:assert/strict";
import test from "node:test";

import {
  activeRatchet,
  buildTrendMarkdown,
  evaluateBundleBudget,
  gzipBytesForBudget,
  normalizeChunkId
} from "../../tools/checkBundleSize.js";

const config = {
  newLargeChunkThresholdBytes: 250000,
  ratchetSchedule: [
    {
      effectiveDate: "2026-07-23",
      milestone: "baseline",
      mainEntryRawBytes: 1000,
      mainEntryGzipBytes: 500,
      routeChunkRawBytes: 900
    },
    {
      effectiveDate: "2026-08-01",
      milestone: "ratchet",
      mainEntryRawBytes: 800,
      mainEntryGzipBytes: 400,
      routeChunkRawBytes: 700
    }
  ],
  largeChunkBaselines: {
    index: { rawBytes: 1000, gzipBytes: 500 },
    ExistingRoute: { rawBytes: 900, gzipBytes: 300 }
  },
  approvedNewLargeChunks: {}
};

test("hashed bundle filenames resolve to stable budget IDs", () => {
  assert.equal(normalizeChunkId("index-Ab12_cdE.js"), "index");
  assert.equal(normalizeChunkId("languageSkillQuestions.generated-Z9xY8wV7.js"), "languageSkillQuestions.generated");
});

test("gzip budgets ignore content-hash churn in imported chunk filenames", () => {
  const first = Buffer.from('import("./TeacherDashboard-Ab12_cdE.js");');
  const second = Buffer.from('import("./TeacherDashboard-Z9xY8wV7.js");');
  assert.equal(first.length, second.length);
  assert.equal(gzipBytesForBudget(first), gzipBytesForBudget(second));
});

test("ratchet selects the latest step effective on the run date", () => {
  assert.equal(activeRatchet(config.ratchetSchedule, "2026-07-31").milestone, "baseline");
  assert.equal(activeRatchet(config.ratchetSchedule, "2026-08-01").milestone, "ratchet");
});

test("baseline freezes current main and route chunks without hiding future targets", () => {
  const result = evaluateBundleBudget({
    config,
    now: "2026-07-23",
    rows: [
      {
        id: "index",
        file: "index-Ab12_cdE.js",
        rawBytes: 1000,
        gzipBytes: 500,
        isEntry: true,
        isDynamicEntry: false
      },
      {
        id: "ExistingRoute",
        file: "ExistingRoute-Ab12_cdE.js",
        rawBytes: 900,
        gzipBytes: 300,
        isEntry: false,
        isDynamicEntry: true
      }
    ]
  });
  assert.deepEqual(result.failures, []);
  assert.match(buildTrendMarkdown(result), /all active bundle budgets are enforced/);

  const future = evaluateBundleBudget({
    config,
    now: "2026-08-01",
    rows: result.rows
  });
  assert.equal(future.failures.length, 3);
  assert.match(future.failures.join("\n"), /index raw size/);
  assert.match(future.failures.join("\n"), /index gzip size/);
  assert.match(future.failures.join("\n"), /ExistingRoute raw size/);
});

test("new chunks over 250 kB require a complete CHECK-CHANGE approval", () => {
  const row = {
    id: "NewRoute",
    file: "NewRoute-Ab12_cdE.js",
    rawBytes: 300000,
    gzipBytes: 75000,
    isEntry: false,
    isDynamicEntry: false
  };
  const rejected = evaluateBundleBudget({
    config,
    now: "2026-07-23",
    rows: [row]
  });
  assert.match(rejected.failures.join("\n"), /without a registered CHECK-CHANGE approval/);

  const approved = evaluateBundleBudget({
    config: {
      ...config,
      approvedNewLargeChunks: {
        NewRoute: {
          rawBytes: 300000,
          gzipBytes: 75000,
          commit: "abc123",
          checkChange: "CHECK-CHANGE: justified route payload"
        }
      }
    },
    now: "2026-07-23",
    rows: [row]
  });
  assert.deepEqual(approved.failures, []);
});
