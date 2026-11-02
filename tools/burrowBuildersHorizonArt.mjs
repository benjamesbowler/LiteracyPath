import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

const manifest = JSON.parse(await fs.readFile("source-art/arcade/physical-worlds/burrow-builders/clean-cartoon-manifest.json", "utf8"));
const write = process.argv.includes("--write");
if (process.argv.slice(2).some(arg => !["--check", "--write"].includes(arg))) {
  throw new Error("Usage: node tools/burrowBuildersHorizonArt.mjs [--check|--write]");
}
const hash = data => createHash("sha256").update(data).digest("hex");
for (const asset of manifest.assets) {
  const native = await fs.readFile(asset.sourcePath);
  if (hash(native) !== asset.sourceSha256) throw new Error("Changed source: " + asset.id);
  if (hash(await fs.readFile(asset.promptFile)) !== asset.promptSha256) throw new Error("Changed prompt: " + asset.id);
  const meta = await sharp(native).metadata();
  if (!meta.hasAlpha || meta.width !== asset.size[0] || meta.height !== asset.size[1]) throw new Error("Invalid horizon frame: " + asset.id);
  const alpha = await sharp(native).extractChannel("alpha").raw().toBuffer();
  if (!alpha.includes(0) || !alpha.some(value => value >= 250)) throw new Error("Missing clear sky or solid landscape: " + asset.id);
  const output = await sharp(native).webp(asset.encoding).toBuffer();
  if (hash(output) !== asset.sha256) throw new Error("Rebuild differs: " + asset.id);
  const target = "public" + asset.runtimePath;
  if (write) await fs.writeFile(target, output);
  if (hash(await fs.readFile(target)) !== asset.sha256) throw new Error("Changed runtime: " + asset.id);
}
for (const material of manifest.preservedMaterialInputs) {
  if (hash(await fs.readFile("public" + material.runtimePath)) !== material.sha256
    || hash(await fs.readFile(material.sourcePath)) !== material.sourceSha256) {
    throw new Error("Unrelated model material changed: " + material.runtimePath);
  }
}
console.log(`${write ? "Rebuilt" : "Verified"} all 3 clean cartoon alpha horizons; all 5 model material sources and deliveries unchanged.`);
