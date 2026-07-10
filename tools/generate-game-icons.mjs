/**
 * Generate a distinct, consistent app-icon for every ARCADE game via Seedream
 * (BytePlus ModelArk). Fixes the duplicate icons (Letter Leap == Word Bridge,
 * Sound Racer == Sound Beat) by giving each game its own file.
 *
 *   - ARK_API_KEY auto-loads from .env.local (same as the other generate-*.mjs).
 *   - watermark: false on every request.
 *   - Writes public/images/learn-games/art/<game-id>.webp (square icons).
 *   - learnGamesData.js already points each arcade game at art/<id>.webp.
 *   - By default EXISTING files are skipped; run with FORCE=1 to replace.
 *
 * RUN (generate all game icons, overwriting):
 *     FORCE=1 node tools/generate-game-icons.mjs
 * RUN (only fill missing):
 *     node tools/generate-game-icons.mjs
 * Originals are safe in git — `git checkout -- public/images/learn-games` reverts.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
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
    } catch { /* ignore */ }
  }
}
await loadEnv();

const API_KEY = process.env.ARK_API_KEY;
const MODEL = process.env.ARK_MODEL || "seedream-4-0-250828";
const ENDPOINT = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";
if (!API_KEY) { console.error("Missing ARK_API_KEY — add  ARK_API_KEY=your-key  to .env.local, then re-run."); process.exit(1); }

// ── Shared style block (put in EVERY prompt for a consistent icon set) ───────
const STYLE = "Premium 3D mobile-game app icon, one bold hero subject centred and filling the frame, glossy vibrant colours, soft studio lighting with a dramatic rim light, rounded friendly forms, high detail and depth, a simple deep gradient background with a soft radial glow behind the subject, playful but polished (NOT babyish, NOT flat vector). Square 1:1 composition. Consistent look across the whole set.";
const NO = "NO text, NO letters, NO numbers, no watermark, no logo, no UI, no border. No faces on inanimate objects.";

const icon = desc => `${STYLE} ${desc} ${NO}`;

const ART = "public/images/learn-games/art";

const tasks = [
  { id: "rocket-run", prompt: icon("A sleek glossy cartoon rocket ship blasting upward on a bright blue-white flame trail with sparks, tilted dynamically, a few small stars and speed swooshes, deep navy space-gradient background.") },
  { id: "letter-leap", prompt: icon("A cheerful nimble young explorer caught mid-leap between two floating glowing stone blocks over a soft-focus jungle gap, dynamic action pose with a motion swoosh, warm adventurous lighting, deep teal background glow. Friendly stylised character.") },
  { id: "sound-racer", prompt: icon("A glossy toy-style race car zooming toward the viewer on a curving neon race track, headlights glowing, speed lines and a little dust kick, dynamic low three-quarter angle, deep purple-blue background glow.") },
  { id: "word-bridge", prompt: icon("A glowing bridge built of stacked luminous cubes (blank, smooth, no markings) spanning a misty chasm between two green cliffs, warm magical light running along the bridge, a tiny friendly pal silhouette about to cross, deep green-teal background glow.") },
  { id: "sound-beat", prompt: icon("A shiny hand drum and a pair of glowing rhythm pads emitting concentric sound-wave rings and a few simple floating musical-note shapes, energetic neon-violet lighting, deep indigo background glow.") },
  { id: "rhyme-pop", prompt: icon("A joyful cluster of glossy colourful balloons with one bursting in a bright confetti pop and a sparkle, bouncy playful composition, deep coral-pink background glow. Plain balloons, no faces.") },
  { id: "sound-safari", prompt: icon("A safari explorer's butterfly net scooping up a few glowing sound orbs among lush jungle leaves and vines, a pith helmet resting nearby, warm golden adventure light, deep amber-green background glow.") },
  { id: "star-gallery", prompt: icon("A magical violet-twilight grove of stylized trees, one tree glowing warmly with a golden word-leaf canopy and a friendly woodcutter's axe resting at its base, fireflies drifting between the trunks, deep violet-green background glow.") }
];

// Optional: regenerate a single icon with  ONLY=star-gallery FORCE=1 node tools/generate-game-icons.mjs
const ONLY = process.env.ONLY || "";
const selectedTasks = ONLY ? tasks.filter(t => t.id === ONLY) : tasks;
if (ONLY && !selectedTasks.length) { console.error(`No icon task named "${ONLY}".`); process.exit(1); }

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

await mkdir(ART, { recursive: true });

let done = 0, skipped = 0; const failed = [];
console.log(`Seedream (${MODEL}) — ${tasks.length} game icons. FORCE=${FORCE ? "on (overwrites)" : "off (skips existing)"}`);
for (const t of selectedTasks) {
  const outPath = `${ART}/${t.id}.webp`;
  if (!FORCE && await exists(outPath)) { skipped++; console.log(`• skip ${t.id}.webp (exists — FORCE=1 to replace)`); continue; }
  try {
    const body = { model: MODEL, prompt: t.prompt, size: "1024x1024", response_format: "url", watermark: false };
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 180)}`);
    const item = (await res.json())?.data?.[0] || {};
    let raw;
    if (item.b64_json) raw = Buffer.from(item.b64_json, "base64");
    else if (item.url) raw = Buffer.from(await (await fetch(item.url)).arrayBuffer());
    else throw new Error("no image in response");
    const webp = await sharp(raw).resize(640, 640, { fit: "cover" }).webp({ quality: 90 }).toBuffer();
    await writeFile(outPath, webp);
    done++;
    console.log(`✓ ${done + skipped}/${tasks.length}  ${outPath}`);
    await sleep(300);
  } catch (e) {
    failed.push({ id: t.id, error: String(e.message || e) });
    console.error(`✗ ${t.id}: ${e.message || e}`);
  }
}
console.log(`\nDone. ${done} generated, ${skipped} skipped, ${failed.length} failed.`);
if (failed.length) {
  console.log("Failed (re-run to retry just these):");
  failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
  process.exit(1);
}
