import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  apiSizeFor,
  buildPlannedPrompt,
  createBatch,
  deriveSeriesKey,
  lintScenePlan,
  openFactoryDatabase,
  orientationMatchesTarget,
  selectWholeBookGroups,
  statusSummary,
  syncFactory,
} from "../../tools/guidedReadingImageFactoryLib.mjs";

test("derives stable style groups from guided-reading paths", () => {
  assert.equal(
    deriveSeriesKey("/guided-reading/series/aiden-and-betty/book-05/page-001.webp", "fiction"),
    "series/aiden-and-betty"
  );
  assert.equal(deriveSeriesKey("/guided-reading/regen/pages/example.png", "nonfiction"), "nonfiction");
});

test("chooses API dimensions that preserve the page aspect ratio", () => {
  assert.equal(apiSizeFor(2752, 1536), "1536x864");
  assert.equal(apiSizeFor(1200, 896), "1536x1152");
});

test("accepts generated images that match either landscape or portrait targets", () => {
  assert.equal(orientationMatchesTarget(1536, 864, 1376, 768), true);
  assert.equal(orientationMatchesTarget(1152, 1536, 896, 1200), true);
  assert.equal(orientationMatchesTarget(1536, 864, 896, 1200), false);
});

test("fills a batch without splitting a book when complete groups fit", () => {
  const groups = [
    { jobs: Array.from({ length: 14 }, (_, id) => ({ id: id + 1 })) },
    { jobs: Array.from({ length: 13 }, (_, id) => ({ id: id + 15 })) },
    { jobs: Array.from({ length: 12 }, (_, id) => ({ id: id + 28 })) },
    { jobs: Array.from({ length: 11 }, (_, id) => ({ id: id + 40 })) },
  ];
  assert.equal(selectWholeBookGroups(groups, 50).length, 50);
  assert.deepEqual(selectWholeBookGroups(groups, 30).map(job => job.id), [...groups[0].jobs, ...groups[1].jobs].map(job => job.id));
});

test("places an authoritative shot plan ahead of the broad image prompt", () => {
  const prompt = buildPlannedPrompt({
    prompt: "Broad page prompt",
    scene_plan_json: JSON.stringify({
      visualMoment: "A visibly empty hook beside the closed back door.",
      subjects: ["No people", "No dog"],
      requiredVisible: ["one empty red-harness hook"],
      composition: "Close view centered on the empty hook",
      continuityDetails: ["match the family kitchen"],
      forbidden: ["red harness", "dog"],
    }),
  });
  assert.ok(prompt.startsWith("AUTHORITATIVE PRODUCTION SHOT PLAN:"));
  assert.ok(prompt.indexOf("empty hook") < prompt.indexOf("Broad page prompt"));
  assert.ok(prompt.includes("Do not depict: red harness; dog"));
});

test("rejects blank writing surfaces and unsafe domestic-pet shot directions while allowing exact typography", () => {
  const base = {
    pageNumber: 1,
    subjects: [],
    requiredVisible: [],
    composition: "Simple scene",
    continuityDetails: [],
    forbidden: [],
  };
  assert.ok(lintScenePlan({ ...base, visualMoment: "An empty hook beside a blank page" }).some(issue => issue.includes("writing surface")));
  assert.deepEqual(lintScenePlan({ ...base, visualMoment: "A jar labelled exactly 'ALUM' in clean legible lettering" }), []);
  assert.ok(lintScenePlan({ ...base, visualMoment: "A map angled away so its surface stays hidden" }).some(issue => issue.includes("writing surface")));
  assert.deepEqual(lintScenePlan({ ...base, visualMoment: "A decorative non-readable title made only from non-letter shapes" }), []);
  assert.ok(lintScenePlan({ ...base, visualMoment: "Socks sits on a high shelf" }).some(issue => issue.includes("domestic-pet")));
  assert.deepEqual(lintScenePlan({ ...base, visualMoment: "Socks must not be on the table" }), []);
  assert.ok(lintScenePlan({ ...base, visualMoment: "A child steps onto a fallen tree over the river" }).some(issue => issue.includes("water crossing")));
  assert.deepEqual(lintScenePlan({ ...base, visualMoment: "An unused fallen tree spans the river while the family uses a railed bridge" }), []);
});

test("allows a subject to be identified by posture without treating it as printed labelling", () => {
  const issues = lintScenePlan({
    visualMoment: "A parent is identified clearly by posture.",
    subjects: ["One penguin labelled father by posture and position"],
    requiredVisible: ["The father protects one egg on his feet"],
    composition: "Natural wildlife view",
    continuityDetails: [],
  });
  assert.deepEqual(issues, []);
});

test("syncs the audit into a resumable SQLite queue and only batches pending work", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "literacy-path-image-factory-"));
  const db = openFactoryDatabase(path.join(tempDirectory, "factory.sqlite"));
  try {
    const synced = syncFactory(db);
    assert.ok((synced.states.installed || 0) > 0);
    const batch = createBatch(db, { limit: 50, quality: "low" });
    if (synced.pending > 0) {
      assert.ok(batch);
      assert.ok(batch.jobs.length > 0 && batch.jobs.length <= 50);
      assert.equal(batch.quality, "low");
      assert.equal(statusSummary(db).states.queued, batch.jobs.length);
    } else {
      assert.equal(batch, null);
      assert.equal(statusSummary(db).pending, 0);
    }
    const aidenProfile = db.prepare("SELECT * FROM series_profiles WHERE series_key = 'series/aiden-and-betty'").get();
    assert.ok(aidenProfile.style_prompt.includes("Socks"));
    const portraitJob = db.prepare("SELECT prompt FROM jobs WHERE book_number = 162 ORDER BY page_number LIMIT 1").get();
    assert.match(portraitJob.prompt, /AUTHORITATIVE TARGET FORMAT: portrait canvas, 896 x 1200/);
    const excludedLegacyPropsJob = db.prepare("SELECT prompt FROM jobs WHERE book_number = 165 ORDER BY page_number LIMIT 1").get();
    assert.match(excludedLegacyPropsJob.prompt, /FINAL AUTHORITATIVE GENERATION EXCLUSIONS:/);
    assert.ok(
      excludedLegacyPropsJob.prompt.lastIndexOf("Never show a compass")
        > excludedLegacyPropsJob.prompt.indexOf("Add daylight, route markers")
    );
    const landscapeOverrideJob = db.prepare("SELECT target_width, target_height, api_size, prompt FROM jobs WHERE book_number = 167 ORDER BY page_number LIMIT 1").get();
    assert.equal(landscapeOverrideJob.target_width, 1536);
    assert.equal(landscapeOverrideJob.target_height, 864);
    assert.equal(landscapeOverrideJob.api_size, "1536x864");
    assert.match(landscapeOverrideJob.prompt, /AUTHORITATIVE TARGET FORMAT: landscape canvas, 1536 x 864/);
  } finally {
    db.close();
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});
