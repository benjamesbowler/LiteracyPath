import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = "source-art/app-clean-cartoon/game-menu/manifest.json";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const manifestBytes = await fs.readFile(path.join(root, sourceFile));
const manifest = JSON.parse(manifestBytes);
const args = process.argv.slice(2);
const check = args.includes("--check");
const outputArg = args.find(arg => arg.startsWith("--output-root="));
if (args.some(arg => arg !== "--check" && !arg.startsWith("--output-root="))) throw new Error("Unknown argument");
const outputRoot = outputArg ? path.resolve(outputArg.slice("--output-root=".length)) : path.join(root, "public");
if (manifest.schemaVersion !== 1 || manifest.assets.length !== 27 || new Set(manifest.assets.map(row => row.id)).size !== 27) throw new Error("Invalid complete menu source manifest");
const assets = [];
for (const row of manifest.assets) {
  if (!/^[a-z0-9-]+$/.test(row.id) || row.path !== `/images/learn-games/menu/${row.id}.webp`) throw new Error("Invalid menu path");
  for (const input of [row.native, row.prompt, ...row.references]) {
    if (!input.file.startsWith("source-art/app-clean-cartoon/game-menu/") || input.file.includes("..")) throw new Error("Invalid source input path");
    if (sha256(await fs.readFile(path.join(root, input.file))) !== input.sha256) throw new Error(`Changed source: ${input.file}`);
  }
  const native = await sharp(path.join(root, row.native.file)).metadata();
  if (native.width !== row.native.width || native.height !== row.native.height || native.hasAlpha) throw new Error(`Invalid native dimensions: ${row.id}`);
  const bytes = await sharp(path.join(root, row.native.file))
    .resize(384, 384, { fit: "fill", kernel: "lanczos3" }).removeAlpha()
    .webp({ quality: 94, effort: 6 }).toBuffer();
  const hash = sha256(bytes);
  if (hash !== row.runtimeSha256) throw new Error(`Encoder drift: ${row.id}`);
  const destination = path.join(outputRoot, row.path.slice(1));
  if (check) {
    if (sha256(await fs.readFile(destination)) !== hash) throw new Error(`Runtime differs: ${row.id}`);
  } else {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, bytes);
  }
  assets.push({ id: row.id, file: `${row.id}.webp`, subject: row.subject,
    prompt: await fs.readFile(path.join(root, row.prompt.file), "utf8"),
    sourceFile: row.native.file, sourceSha256: row.native.sha256, sha256: hash, bytes: bytes.length });
}
const delivery = { version: 3, generator: "built-in imagegen", purpose: manifest.purpose,
  style: manifest.style, width: 384, height: 384, sourceManifest: sourceFile,
  sourceManifestSha256: sha256(manifestBytes), assets };
const deliveryBytes = Buffer.from(`${JSON.stringify(delivery, null, 2)}\n`);
const deliveryPath = path.join(outputRoot, "images/learn-games/menu/manifest.json");
if (check) {
  if (!(await fs.readFile(deliveryPath)).equals(deliveryBytes)) throw new Error("Delivery manifest differs");
} else await fs.writeFile(deliveryPath, deliveryBytes);
console.log(JSON.stringify({ mode: check ? "check" : "build", assets: assets.length, sourceManifestSha256: sha256(manifestBytes) }));
