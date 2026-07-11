#!/usr/bin/env node
// npm run optimise:quest-art
//
// The art comes out of the generator at 8MB across 33 files. That is fine on a
// laptop and miserable on a school tablet on school wifi — and this whole mode is
// for a five-year-old on a tablet.
//
// PROPS are the worst offenders: generated at 1024x1024 and displayed at ~150px.
// Even at 2x retina that is four times more pixels than anyone will ever see.
//
// Lossless in the ways that matter (nothing is cropped, alpha is preserved), and
// it is idempotent — run it twice and the second run does nothing.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));

const layers = read("tools/image-jobs/quest-world.json");
const props = read("tools/image-jobs/quest-props.json");
const panels = read("tools/image-jobs/quest-panels.json");

// Layers span the full screen, so they keep their width but drop quality — a
// painterly backdrop hides compression far better than a hard-edged prop.
// Props are shown small, so they get resized as well.
const PLAN = [
  ...layers.map(j => ({ out: j.out, width: 1280, quality: 72 })),
  ...props.map(j => ({ out: j.out, width: 512, quality: 84 })),
  // Panel pieces are shown at ~70-130px. 384 is already generous at 2x retina.
  ...panels.map(j => ({ out: j.out, width: 384, quality: 86 }))
];

let before = 0;
let after = 0;
let done = 0;

for (const job of PLAN) {
  const file = path.join(ROOT, job.out);
  if (!fs.existsSync(file)) {
    console.log(`↷ ${job.out} — not generated yet`);
    continue;
  }

  const startKb = fs.statSync(file).size / 1024;
  const meta = await sharp(file).metadata();

  if (meta.width <= job.width && startKb < 260) {
    console.log(`↷ ${job.out.replace("public/images/quest/", "")} — already lean (${startKb.toFixed(0)}KB)`);
    before += startKb;
    after += startKb;
    continue;
  }

  const buf = await sharp(file)
    .resize({ width: Math.min(job.width, meta.width), withoutEnlargement: true })
    .webp({ quality: job.quality, alphaQuality: 90, effort: 6 })
    .toBuffer();

  fs.writeFileSync(file, buf);
  const endKb = buf.length / 1024;
  before += startKb;
  after += endKb;
  done += 1;

  console.log(`✓ ${job.out.replace("public/images/quest/", "").padEnd(30)} ${startKb.toFixed(0).padStart(4)}KB -> ${endKb.toFixed(0).padStart(4)}KB`);
}

console.log("");
console.log(`optimise:quest-art — ${done} rewritten`);
console.log(`  ${(before / 1024).toFixed(1)}MB -> ${(after / 1024).toFixed(1)}MB  (${(100 - (after / before) * 100).toFixed(0)}% smaller)`);
