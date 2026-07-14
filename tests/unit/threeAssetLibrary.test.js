import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  FIELD_OBJECT_MODELS,
  QUEST_STOP_ASSET_KITS,
  searchThreeAssetLibrary,
  THREE_ASSET_MANIFEST_URL
} from "../../src/data/threeAssetLibrary.js";

const manifest = {
  models: [
    {
      id: "characters:fish",
      name: "Animated Fish",
      packId: "characters",
      categories: ["animals", "objectives"],
      tags: ["fish", "water"],
      animated: true
    },
    {
      id: "restaurant:cupcake",
      name: "Cupcake",
      packId: "restaurant",
      categories: ["food", "objectives"],
      tags: ["cake", "dessert"],
      animated: false
    }
  ]
};

test("3D library search matches names, tags, categories, animation, and pack", () => {
  assert.deepEqual(searchThreeAssetLibrary(manifest, "water").map(model => model.id), ["characters:fish"]);
  assert.deepEqual(searchThreeAssetLibrary(manifest, "cake", { category: "food" }).map(model => model.id), ["restaurant:cupcake"]);
  assert.deepEqual(searchThreeAssetLibrary(manifest, "", { animated: true }).map(model => model.id), ["characters:fish"]);
  assert.deepEqual(searchThreeAssetLibrary(manifest, "", { pack: "restaurant" }).map(model => model.id), ["restaurant:cupcake"]);
});

test("Seedwake's authored task and landmark models are present locally", () => {
  const urls = [
    ...Object.values(FIELD_OBJECT_MODELS).map(model => model.url),
    ...Object.values(QUEST_STOP_ASSET_KITS).flat().map(model => model.url)
  ];
  urls.forEach(url => assert.ok(existsSync(join(process.cwd(), "public", url)), url));
  assert.equal(Object.keys(QUEST_STOP_ASSET_KITS).length, 5);
});

test("Sound Seekers field objects use models represented by the shared manifest", () => {
  assert.equal(THREE_ASSET_MANIFEST_URL, "/models/library/manifest.json");
  assert.match(FIELD_OBJECT_MODELS.cake.url, /Cupcake\.glb$/u);
  assert.match(FIELD_OBJECT_MODELS.fish.url, /Fish\.glb$/u);
  assert.ok(FIELD_OBJECT_MODELS.fish.animation);
});
