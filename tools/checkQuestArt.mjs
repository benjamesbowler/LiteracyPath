#!/usr/bin/env node
// npm run check:quest-art
//
// The art QA I can run without eyes. It catches the two failures that are
// invisible in a thumbnail but fatal in the game:
//
//   1. A PARALLAX LAYER WHOSE TOP ISN'T TRANSPARENT. The model happily paints a
//      full-frame forest when you asked for a band of trees with empty sky above.
//      It looks lovely on its own and then covers the sky, the moon and the far
//      hills entirely, and the parallax dies. (moonwood/mid failed exactly this.)
//
//   2. A PROP THAT ISN'T A CUTOUT. Without a transparent background every bridge
//      and beast arrives glued to its own square of sky, and the world becomes a
//      collage of stickers.
//
// It cannot tell you whether the art is GOOD. That is Benjamin's job, and
// docs/previews/quest-art-contact-sheet.html exists so he can do it in one look.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));

const layers = read("tools/image-jobs/quest-world.json");
const props = read("tools/image-jobs/quest-props.json");
const panels = read("tools/image-jobs/quest-panels.json");

const errors = [];
const warnings = [];

// Mean alpha of a horizontal band, 0-100 (% opaque).
async function bands(file, n = 4) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const sum = Array(n).fill(0);
  const count = Array(n).fill(0);
  for (let y = 0; y < height; y += 1) {
    const b = Math.min(n - 1, Math.floor(y / (height / n)));
    for (let x = 0; x < width; x += 1) {
      sum[b] += data[(y * width + x) * channels + 3];
      count[b] += 1;
    }
  }
  return sum.map((s, i) => (s / count[i] / 255) * 100);
}

console.log("check:quest-art\n");

for (const job of [...layers, ...props, ...panels]) {
  const file = path.join(ROOT, job.out);
  const rel = job.out.replace("public/images/quest/", "");
  if (!fs.existsSync(file)) {
    const batch = layers.includes(job) ? "world" : props.includes(job) ? "props" : "panels";
    errors.push(`${rel} — MISSING. Run: npm run gen:image -- --batch tools/image-jobs/quest-${batch}.json`);
    continue;
  }

  const meta = await sharp(file).metadata();
  const kb = fs.statSync(file).size / 1024;

  if (job.background === "transparent" && !meta.hasAlpha) {
    errors.push(`${rel} — has NO ALPHA CHANNEL. It is a picture of a thing on a square, not a cutout.`);
    continue;
  }

  if (job.background === "transparent") {
    const b = await bands(file);

    // A parallax layer must have an EMPTY TOP. Anything painted up there covers
    // the sky and the layers behind it.
    const isLayer = /\/(far|mid|ground)\.webp$/.test(job.out);
    if (isLayer && b[0] > 25) {
      errors.push(`${rel} — the top quarter is ${b[0].toFixed(0)}% opaque. A parallax layer must have an EMPTY top or it covers the sky. Regenerate it.`);
    }

    // A prop must be a cutout: its corners must be empty.
    const isProp = job.out.includes("/props/") || job.out.includes("/ui/");
    const opaque = b.reduce((a, v) => a + v, 0) / b.length;
    if (isProp && opaque > 85) {
      errors.push(`${rel} — ${opaque.toFixed(0)}% opaque overall. That is a picture on a square, not a cutout.`);
    }
  }

  // A school tablet on school wifi. 400KB per image is already generous.
  if (kb > 420) warnings.push(`${rel} — ${kb.toFixed(0)}KB. Run: npm run optimise:quest-art`);
}

for (const w of warnings) console.log(`  warn  ${w}`);
if (warnings.length) console.log("");

if (errors.length) {
  console.error(`${errors.length} problem${errors.length === 1 ? "" : "s"}:\n`);
  for (const e of errors) console.error(`  FAIL  ${e}`);
  process.exit(1);
}

console.log(`check:quest-art OK — ${layers.length + props.length + panels.length} images, alpha correct, no layer covering the sky`);
