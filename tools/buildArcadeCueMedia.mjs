import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";

// Runtime encoding only. Original art and its imagegen prompt remain the authority.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = async (file) => createHash("sha256").update(await fs.readFile(file)).digest("hex");
const manifestNames = ["source-art/arcade/cue-images/manifest.json",
  ...(process.argv.includes("--letter-leap") ? ["source-art/arcade/cue-images/letter-leap/manifest.json"] : [])];
let encoded = 0;
for (const manifestName of manifestNames) {
  const manifestPath = path.join(root, manifestName);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  for (const entry of manifest.generated) {
    const source = path.join(root, entry.source), output = path.join(root, "public", entry.delivery);
    const maxDimension = entry.maxDimension || 1024;
    await fs.mkdir(path.dirname(output), { recursive: true });
    await sharp(source).resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true }).webp({ quality: 92, effort: 4 }).toFile(output);
    const metadata = await sharp(output).metadata();
    Object.assign(entry, { sourceSha256: await digest(source), deliverySha256: await digest(output),
      bytes: (await fs.stat(output)).size, width: metadata.width, height: metadata.height,
      encoding: { format: "webp", quality: 92, effort: 4, maxDimension } });
    if (entry.input) entry.inputSha256 = await digest(path.join(root, entry.input));
    encoded++;
  }
  for (const entry of manifest.curated || []) {
    const file = path.join(root, "public", entry.delivery);
    entry.sha256 = await digest(file);
    entry.bytes = (await fs.stat(file)).size;
  }
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify({ encoded, manifests: manifestNames })}\n`);
