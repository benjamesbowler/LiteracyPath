import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("release QA exercises pixel while the legacy camera diagnostic stays preview-only", () => {
  const root = fs.readFileSync("src/components/quest/QuestRoot.jsx", "utf8");
  const preview = fs.readFileSync("preview/quest.jsx", "utf8");
  const settings = fs.readFileSync("src/components/quest/QuestSettingsDialog.jsx", "utf8");
  const gate = fs.readFileSync("tools/shootQuest.mjs", "utf8");
  const route = fs.readFileSync("tools/checkQuestRouteVisual.mjs", "utf8");
  const slice = fs.readFileSync("tools/checkQuestSliceCamera.mjs", "utf8");

  assert.match(gate, /display=pixel/, "the release gate check does not exercise the supported renderer");
  assert.doesNotMatch(gate, /\.qh-root/, "the release gate check still waits on retired QuestHub markup");
  assert.match(route, /display=pixel/, "the route check does not exercise the supported renderer");
  assert.doesNotMatch(route, /\.qh-root/, "the route check still waits on retired QuestHub markup");

  assert.match(preview, /params\.get\("renderer"\) === "legacy3d"/);
  assert.match(preview, /previewForceLegacy3d=\{previewLegacyRenderer\}/);
  assert.match(root, /previewForceLegacy3d \? QUEST_QUALITY_TIERS\.low : runtimeQuality/);
  assert.match(slice, /renderer=legacy3d/);
  assert.doesNotMatch(slice, /display=low/, "the legacy diagnostic still relies on a retired saved setting");
  assert.match(slice, /Word complete:/, "the legacy diagnostic does not observe the current semantic success announcement");
  assert.doesNotMatch(slice, /qh-success-marker|qh-phoneme-build/, "the legacy diagnostic still waits on retired success markup");

  for (const [name, source] of [["shots", gate], ["route", route], ["slice", slice]]) {
    assert.match(source, /VITE_SUPABASE_URL:\s*process\.env\.VITE_SUPABASE_URL\s*\|\|\s*BASE/,
      `${name} QA does not inject its isolated preview environment`);
    assert.match(source, /VITE_SUPABASE_ANON_KEY:/,
      `${name} QA does not inject a non-secret preview key`);
  }

  assert.doesNotMatch(settings, /previewForceLegacy3d|renderer=legacy3d/,
    "the preview-only legacy renderer escaped into child settings");
});
