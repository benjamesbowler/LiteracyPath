/**
 * Normalise the PS1-arcade background art to the repo standard: every .png in
 * the folder is converted to .webp (if a .webp isn't already there) and then all
 * .png sources are removed, so we never ship multi-MB pngs and the
 * media-overwrite-risk guard passes. RUN:  node tools/convert-ps1-arcade-webp.mjs
 */
import { readdir, unlink, access } from "node:fs/promises";
import { constants } from "node:fs";
import sharp from "sharp";

const DIR = "public/images/learn-games/ps1-arcade";

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

const pngs = (await readdir(DIR)).filter(name => name.toLowerCase().endsWith(".png"));
for (const png of pngs) {
  const webp = png.replace(/\.png$/i, ".webp");
  if (!(await exists(`${DIR}/${webp}`))) {
    await sharp(`${DIR}/${png}`).webp({ quality: 88 }).toFile(`${DIR}/${webp}`);
    console.log("converted", `${DIR}/${webp}`);
  }
  await unlink(`${DIR}/${png}`);
  console.log("removed", `${DIR}/${png}`);
}
console.log(`Done. Removed ${pngs.length} png(s); the folder is now webp-only.`);
