/**
 * Generate the 15 sentence-scene images for the "Sentence Picture Matching"
 * checkpoint skill via Seedream (BytePlus ModelArk).
 *
 * WHY SCENES, NOT OBJECTS: these questions ask "Which sentence matches the
 * picture?" with distractors like "The cat is on the bus" — a lone object
 * card can't disambiguate. Each prompt below paints the CORRECT sentence and
 * deliberately contradicts that item's distractors (exact counts, colours,
 * places). One scene serves both the level-1 and level-2 variants.
 *
 *   - ARK_API_KEY auto-loads from .env.local (same as the other generate-*.mjs).
 *   - watermark: false; sharp -> webp; skips existing (FORCE=1 to replace).
 *   - Output: public/images/child-mode/sentence-scenes/<key>.webp (1024x1024).
 *
 * RUN:            node tools/generate-sentence-scene-images.mjs
 * REGENERATE ALL: FORCE=1 node tools/generate-sentence-scene-images.mjs
 *
 * After the images land, the 30-item managed bank gets authored to point at
 * them (code task — ask Claude), then `node tools/auditSkillBanks.js` should
 * show Sentence Picture Matching at 30 media-complete.
 */
import { mkdir, readFile, access } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import sharp from "sharp";

async function loadEnv() {
  if (process.env.ARK_API_KEY) return;
  for (const f of [".env.local", ".env"]) {
    try {
      for (const line of (await readFile(f, "utf8")).split("\n")) {
        const m = line.match(/^\s*(ARK_API_KEY|ARK_MODEL)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch { /* keep looking */ }
  }
}
await loadEnv();

const API_KEY = process.env.ARK_API_KEY;
const MODEL = process.env.ARK_MODEL || "seedream-4-0-250828";
const ENDPOINT = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";
if (!API_KEY) { console.error("Missing ARK_API_KEY — add  ARK_API_KEY=your-key  to .env.local, then re-run."); process.exit(1); }

// House style (matches the child-mode media rules): clean and readable, no
// text, natural colours, no faces on objects.
const STYLE = "Clean, bright, child-safe cartoon illustration for a kindergarten reading app, simple uncluttered composition on a soft plain background, natural realistic colors, gentle outlines, high readability at small sizes.";
const RULES = "No text, no letters, no numbers, no watermark, no logo. Non-living objects must NOT have faces, eyes, smiles or expressions. No rainbow colouring of ordinary objects, no sparkles, no confetti. The scene must match the description EXACTLY, including counts and colours.";

const scene = desc => `${STYLE} ${desc} ${RULES}`;
const DIR = "public/images/child-mode/sentence-scenes";

// key = itemKey in ixlStyleSeedQuestions sentencePictureItems. Each scene
// affirms the correct sentence and contradicts that item's distractors.
const tasks = [
  { file: "cats", prompt: scene("A happy young boy standing with EXACTLY TWO cats sitting beside him — two cats, no dogs, no hats anywhere.") },
  { file: "dogs", prompt: scene("A happy young boy pointing at EXACTLY TWO dogs in a park — two dogs, no boxes, no logs anywhere.") },
  { file: "cups", prompt: scene("EXACTLY TWO plain drinking cups standing on a woven floor mat — no cats, no map anywhere.") },
  { file: "hats", prompt: scene("EXACTLY TWO bright red sun hats on a wooden table — clearly red hats, no bags, no rats anywhere.") },
  { file: "books", prompt: scene("EXACTLY TWO closed books with plain blank covers stacked on a desk — no ducks, no people anywhere.") },
  { file: "boxes", prompt: scene("EXACTLY TWO very large plain brown cardboard boxes on the floor — clearly big, no dogs, no foxes anywhere.") },
  { file: "fish", prompt: scene("One orange fish swimming underwater in a clear blue pond, bubbles rising — clearly swimming, no dogs, no dishes anywhere.") },
  { file: "ship", prompt: scene("One very large cargo ship sailing on the open sea — clearly BIG, no shop, no sheep anywhere.") },
  { file: "duck", prompt: scene("One yellow duck floating in the middle of a small pond — in the water, no cats, no trucks anywhere.") },
  { file: "bed", prompt: scene("A cat curled up asleep ON TOP of a neatly made bed in a bedroom — clearly on the bed, no bus, no rat anywhere.") },
  { file: "map", prompt: scene("A friendly dad holding an open paper road map with both hands — clearly a map, not a mop, not a mat.") },
  { file: "bag", prompt: scene("A school bag sitting ON TOP of a neatly made bed — clearly a bag on the bed, no bug, no bat anywhere.") },
  { file: "cup", prompt: scene("One plain BLUE drinking cup on a wooden table — the cup is clearly blue, no cap, no bear cub anywhere.") },
  { file: "sock", prompt: scene("One soggy WET sock dripping water while hanging on a clothesline — clearly wet, no rock, no lock anywhere.") },
  { file: "ring", prompt: scene("One small gold ring resting on a little cushion — clearly small, no rug, no king anywhere.") }
];

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

await mkdir(DIR, { recursive: true });
let done = 0, skipped = 0; const failed = [];
console.log(`Seedream (${MODEL}) — ${tasks.length} sentence scenes → ${DIR}. FORCE=${FORCE ? "on (overwrites)" : "off (skips existing)"}`);
for (const t of tasks) {
  const outPath = `${DIR}/${t.file}.webp`;
  if (!FORCE && await exists(outPath)) { skipped++; console.log(`• skip ${t.file}.webp (exists — FORCE=1 to replace)`); continue; }
  try {
    const body = { model: MODEL, prompt: t.prompt, size: "1024x1024", response_format: "url", watermark: false };
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 180)}`);
    const item = (await res.json())?.data?.[0] || {};
    let raw;
    if (item.b64_json) raw = Buffer.from(item.b64_json, "base64");
    else if (item.url) raw = Buffer.from(await (await fetch(item.url)).arrayBuffer());
    else throw new Error("no image in response");
    const webp = await sharp(raw).resize(1024, 1024, { fit: "cover" }).webp({ quality: 90 }).toBuffer();
    await writeFile(outPath, webp);
    done++; console.log(`✓ ${t.file}.webp`);
    await sleep(400);
  } catch (err) {
    failed.push(t.file); console.error(`✗ ${t.file}: ${err.message}`);
  }
}
console.log(`\nDone. ${done} generated, ${skipped} skipped, ${failed.length} failed${failed.length ? ` (${failed.join(", ")}) — re-run to retry just those` : ""}.`);
process.exit(failed.length ? 1 : 0);
