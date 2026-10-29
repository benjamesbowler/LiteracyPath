import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("visual review help and invalid arguments cannot approve or replace any review records", () => {
  const target = new URL("../../src/content/appVisualAssetReviews.generated.js", import.meta.url);
  const before = readFileSync(target);
  for (const args of [["--help"], ["-h"], ["--unknown"], ["--receipts"]]) {
    const run = spawnSync(process.execPath, ["tools/recordAppVisualReview.mjs", ...args], { encoding: "utf8" });
    assert.equal(run.status, ["--help", "-h"].includes(args[0]) ? 0 : 1);
    assert.deepEqual(readFileSync(target), before, args.join(" "));
  }
});
