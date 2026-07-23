#!/usr/bin/env node
/**
 * generateImage.mjs — the ONE way we generate images for LiteracyPath.
 *
 * Uses OpenAI `gpt-image-1` and writes a .webp straight into public/ via sharp.
 * The API key is read from .env (OPENAI_API_KEY). Never hardcode it.
 *
 *   Single image:
 *     npm run gen:image -- --prompt "a glossy 3D app icon of a rocket" \
 *                          --out public/images/learn-games/art/rocket-run.webp
 *
 *   Batch (preferred — jobs live in tools/image-jobs/*.json):
 *     npm run gen:image -- --batch tools/image-jobs/arcade-icons.json
 *
 *   Options:
 *     --size     1024x1024 (default) | 1536x1024 | 1024x1536
 *     --quality  high (default) | medium | low
 *     --width    optional output width in pixels
 *     --height   optional output height (defaults to width for square assets)
 *     --force    overwrite an existing file (otherwise it is skipped)
 *
 * HOUSE STYLE (arcade game icons): glossy 3D-rendered app-icon tile, one hero
 * object, rounded-square frame, soft rim lighting + ambient glow, plasticky
 * claymation render, cinematic, subtle depth of field.
 * ALWAYS say "no text, no letters, no words" in the prompt — the model will
 * otherwise bake in garbled text (this is how star-gallery.webp ended up
 * reading "Fanter"). Art direction: realistic cartoon; fantasy / sci-fi /
 * nature themes; no rainbow motifs; no faces on inanimate objects; not babyish.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import OpenAI from "openai";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// ---- load OPENAI_API_KEY from the environment or .env -----------------------
function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const file of [".env", ".env.local"]) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$/.exec(line);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

// ---- args -------------------------------------------------------------------
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    if (key === "force") { out.force = true; continue; }
    out[key] = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const apiKey = loadKey();

if (!apiKey) {
  console.error("✗ No OPENAI_API_KEY found (checked process.env, .env, .env.local).");
  process.exit(1);
}

let jobs = [];
if (args.batch) {
  const p = path.isAbsolute(args.batch) ? args.batch : path.join(ROOT, args.batch);
  if (!fs.existsSync(p)) { console.error(`✗ Batch file not found: ${args.batch}`); process.exit(1); }
  jobs = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!Array.isArray(jobs)) { console.error("✗ Batch file must be a JSON array of { prompt, out }."); process.exit(1); }
} else if (args.prompt && args.out) {
  jobs = [{ prompt: args.prompt, out: args.out, size: args.size, quality: args.quality }];
} else {
  console.error("Usage:\n  npm run gen:image -- --prompt \"...\" --out public/images/.../name.webp\n  npm run gen:image -- --batch tools/image-jobs/arcade-icons.json");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

async function generate(job, index, total) {
  const out = path.isAbsolute(job.out) ? job.out : path.join(ROOT, job.out);
  const rel = path.relative(ROOT, out);
  const label = `[${index + 1}/${total}] ${rel}`;

  if (fs.existsSync(out) && !args.force && !job.force) {
    console.log(`↷ ${label} — already exists (use --force to overwrite)`);
    return { skipped: true };
  }

  const size = job.size || args.size || "1024x1024";
  const quality = job.quality || args.quality || "high";
  console.log(`… ${label} — generating (${size}, ${quality})`);

  // `background: "transparent"` is what makes a PROP a cutout rather than a
  // picture of a prop on a square of sky. Without it every bridge, beast and
  // signpost arrives glued to its own background and the world looks like a
  // collage of stickers.
  const background = job.background || args.background;

  const res = await client.images.generate({
    model: "gpt-image-1",
    prompt: job.prompt,
    size,
    quality,
    n: 1,
    ...(background ? { background } : {})
  });

  const b64 = res?.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image returned by the API");

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const png = Buffer.from(b64, "base64");

  // Optional output resize. Existing jobs provide width only and therefore
  // remain square; wide card art can provide an explicit height so its crop is
  // reproducible instead of silently changing on regeneration.
  const width = Number(job.width || args.width || 0);
  const height = Number(job.height || args.height || width || 0);
  const resize = pipe => (width > 0 ? pipe.resize(width, height, { fit: "cover" }) : pipe);

  if (out.endsWith(".webp")) {
    await resize(sharp(png)).webp({ quality: 90 }).toFile(out);
  } else if (out.endsWith(".png") && !width) {
    fs.writeFileSync(out, png);
  } else {
    await resize(sharp(png)).toFile(out);
  }

  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`✓ ${label} — written (${kb} KB)`);
  return { ok: true };
}

let ok = 0, skipped = 0, failed = 0;
for (let i = 0; i < jobs.length; i++) {
  try {
    const r = await generate(jobs[i], i, jobs.length);
    if (r.skipped) skipped++; else ok++;
  } catch (err) {
    failed++;
    console.error(`✗ [${i + 1}/${jobs.length}] ${jobs[i].out} — ${err?.message || err}`);
  }
}

console.log(`\nDone. ${ok} written, ${skipped} skipped, ${failed} failed.`);
process.exit(failed ? 1 : 0);
