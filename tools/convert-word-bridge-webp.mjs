/**
 * Convert the Word Bridge art from raw .png to .webp (repo media standard) and
 * remove the .png sources, so the media-overwrite-risk guard passes.
 * RUN:  node tools/convert-word-bridge-webp.mjs
 */
import { readdir, unlink } from "node:fs/promises";
import sharp from "sharp";

const DIR = "public/images/learn-games/word-bridge";

const files = (await readdir(DIR)).filter(name => name.toLowerCase().endsWith(".png"));
if (files.length === 0) {
  console.log("No .png files to convert in", DIR);
  process.exit(0);
}

for (const file of files) {
  const out = file.replace(/\.png$/i, ".webp");
  await sharp(`${DIR}/${file}`).webp({ quality: 90 }).toFile(`${DIR}/${out}`);
  await unlink(`${DIR}/${file}`);
  console.log("✓", `${DIR}/${out}`, "(removed", `${file})`);
}
console.log(`Converted ${files.length} file(s) to webp.`);
