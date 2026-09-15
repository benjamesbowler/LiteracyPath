import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { childWordAssets, getChildWordAsset } from "../../src/data/childAssets.js";
import { CYCLE_WORD_BUILD_INVENTORY } from "../../src/data/cycleWordBuildInventory.js";

test("shared child word pictures use existing compressed files within the image budget", () => {
  const pictures = Object.keys(childWordAssets)
    .map(word => ({ word, image: getChildWordAsset(word)?.image }))
    .filter(asset => asset.image?.startsWith("/images/child-mode/"));
  assert.ok(pictures.length > 50);
  for (const { word, image } of pictures) {
    assert.match(image, /\.webp$/, word);
    const bytes = fs.statSync(new URL(`../../public${image}`, import.meta.url)).size;
    assert.ok(bytes <= 200 * 1024, `${word} downloads ${bytes} bytes`);
  }
});

test("word-building rounds cannot request the large original PNGs", () => {
  for (const { word, image } of CYCLE_WORD_BUILD_INVENTORY) {
    assert.match(image, /\.webp$/, word);
    assert.ok(fs.existsSync(new URL(`../../public${image}`, import.meta.url)), `${word}: ${image}`);
  }
});
