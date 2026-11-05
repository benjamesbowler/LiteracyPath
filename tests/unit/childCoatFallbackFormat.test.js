import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import sharp from "sharp";
import { childWordAssets, getChildWordAsset } from "../../src/data/childAssets.js";

test("coat retains its primary image and uses the reviewed WebP fallback in both source registries", () => {
  const primary = "/images/child-mode/vowels/coat.webp";
  const fallback = "/images/vowels/coat.webp";
  assert.equal(childWordAssets.coat.image, primary);
  assert.equal(childWordAssets.coat.fallbackImage, fallback);
  assert.equal(getChildWordAsset("coat").image, primary);
  const manifest = JSON.parse(fs.readFileSync(new URL("../../public/images/child-image-manifest.json", import.meta.url)));
  assert.equal(manifest.assets.coat, fallback);
  assert.equal(fs.existsSync(new URL("../../public/images/vowels/coat.svg", import.meta.url)), false);
});

test("the coat fallback remains a 240px still WebP with real transparent corners", async () => {
  const file = new URL("../../public/images/vowels/coat.webp", import.meta.url);
  const bytes = fs.readFileSync(file);
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 240);
  assert.equal(metadata.height, 240);
  assert.equal(metadata.hasAlpha, true);
  assert.ok(!metadata.pages || metadata.pages === 1);
  const rgba = await sharp(bytes).ensureAlpha().raw().toBuffer();
  const alphaAt = (x, y) => rgba[(y * 240 + x) * 4 + 3];
  for (const [x, y] of [[0, 0], [239, 0], [0, 239], [239, 239]]) assert.equal(alphaAt(x, y), 0);
  assert.equal(alphaAt(120, 120), 255);
});
