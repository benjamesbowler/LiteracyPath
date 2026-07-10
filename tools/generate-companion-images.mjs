/**
 * Generate the 6 companion (avatar) portraits via Seedream (BytePlus ModelArk).
 *
 * The companions are the stars of our own reader series - one per series -
 * so every avatar is a character the child meets in real books. Each prompt
 * uses that character's CANON look, copied from the series' character
 * reference in the book data, so the avatar matches the book art.
 *
 *   - ARK_API_KEY auto-loads from .env.local (same as the other generate-*.mjs).
 *   - watermark: false; sharp -> webp; skips existing (FORCE=1 to replace).
 *   - Output: public/images/companions/<id>.webp (1024x1024).
 *
 * RUN:            node tools/generate-companion-images.mjs
 * REGENERATE ALL: FORCE=1 node tools/generate-companion-images.mjs
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

// Avatar house style: friendly character PORTRAIT that reads at small sizes
// (the picker tile and the tiny top-bar face). Same realistic-cartoon look
// as the guided reading art. Soft round-vignette background so it sits well
// in a circular frame.
const STYLE = "Friendly realistic-cartoon character portrait for a children's reading app avatar, head and upper body centered, facing slightly toward the viewer with a warm happy expression, soft plain circular-vignette background in a single gentle pastel color, clean gentle outlines, storybook illustration style, high readability at very small sizes.";
const RULES = "No text, no letters, no numbers, no watermark, no logo, no border, no frame. Exactly ONE character, nothing else in the scene.";

const portrait = desc => `${STYLE} ${desc} ${RULES}`;
const DIR = "public/images/companions";

// id = COMPANIONS id in src/utils/studentProfile.js. Descriptions are the
// characters' canon looks from the series' characterReference data.
const tasks = [
  { file: "fluff", prompt: portrait("Fluff from the Bob and Nan books: a small, very fluffy brown puppy with bright eyes and a happy open-mouth smile, soft green pastel background.") },
  { file: "chips", prompt: portrait("Chips from the James and Anna books: a small white goat with big brown patches, yellow eyes, short horns, floppy ears, and a blue collar with a little blue bell, soft blue pastel background.") },
  { file: "socks", prompt: portrait("Socks from the Aiden and Betty books: a small cheeky monkey with cream-white fur on the face and chest, darker brown fur on the back, black hands, wearing a tiny red waistcoat, soft yellow pastel background.") },
  { file: "chompy", prompt: portrait("Chompy from the Dino Pals books: an orange baby T-Rex with tiny arms, a big round tummy, a white bib around his neck, and a sweet hungry smile, soft orange pastel background.") },
  { file: "muddy", prompt: portrait("Muddy from the Meadow Pals books: a cheerful pink piglet with a few playful splashes of brown mud on his cheeks and tummy, soft pink pastel background.") },
  { file: "pip", prompt: portrait("Pip from the Moonwood Tales books: a young elf child with pointed ears, brown hair, green eyes, wearing a dark green tunic with a brown belt, soft violet pastel background with a hint of starlight.") }
];

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

await mkdir(DIR, { recursive: true });
let done = 0, skipped = 0; const failed = [];
console.log(`Seedream (${MODEL}) — ${tasks.length} companion portraits → ${DIR}. FORCE=${FORCE ? "on (overwrites)" : "off (skips existing)"}`);
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
