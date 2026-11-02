import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "source-art/app-clean-cartoon/resumed-backgrounds/manifest.json");
const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && !["--check", "--write"].includes(args[0]))) {
  throw new Error("Usage: node tools/buildCleanCartoonBackgrounds.mjs [--check|--write]");
}
const write = args[0] === "--write";
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const seen = new Set();
for (const asset of manifest.assets) {
  if (seen.has(asset.path)) throw new Error("Duplicate background: " + asset.path);
  seen.add(asset.path);
  const source = await fs.readFile(path.join(root, asset.nativeSaved));
  if (digest(source) !== asset.nativeSha256) throw new Error("Changed native: " + asset.jobId);
  const prompt = await fs.readFile(path.join(root, asset.promptFile));
  if (digest(prompt) !== asset.promptSha256) throw new Error("Changed prompt: " + asset.jobId);
  let image = sharp(source);
  if (asset.crop) image = image.extract(asset.crop);
  const output = await image.resize(asset.resize.width, asset.resize.height, { fit: asset.resize.fit })
    .webp({ quality: asset.encoding.quality, effort: asset.encoding.effort }).toBuffer();
  if (digest(output) !== asset.outputSha256) throw new Error("Non-reproducible delivery: " + asset.jobId);
  const target = path.join(root, "public", asset.path.replace(/^\//, ""));
  if (write) await fs.writeFile(target, output);
  if (digest(await fs.readFile(target)) !== asset.outputSha256) throw new Error("Changed delivery: " + asset.jobId);
}
console.log(`${write ? "Rebuilt" : "Verified"} ${seen.size} clean cartoon backgrounds from exact native sources.`);
