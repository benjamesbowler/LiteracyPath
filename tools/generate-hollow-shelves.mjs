/**
 * Generate the "Hollow trinket shelves" batch + tired-media backdrops via
 * Seedream (BytePlus ModelArk), from docs/SEEDREAM_IMAGE_REQUESTS_hollow_shelves_2026-07-09.md.
 * Every prompt is assembled from the shared style block + the no-characters
 * non-negotiables + the shelf composition spec, exactly as the doc requires.
 *
 *   - ARK_API_KEY auto-loads from .env.local (same as the other generate-*.mjs).
 *   - watermark: false on every request.
 *   - Batch A overwrites the seven room files in public/images/hollow/ (drop-in).
 *   - Batch B backdrops go to public/images/backdrops/ (wire-up is Benjamin's).
 *   - By default EXISTING files are skipped (safe re-runs after a partial fail).
 *     To replace the current art, run with FORCE=1 (see below).
 *
 * RUN (first replacement pass — overwrites existing Batch A art):
 *     FORCE=1 node tools/generate-hollow-shelves.mjs
 * RUN (top up only what's missing, never touch good art):
 *     node tools/generate-hollow-shelves.mjs
 * The originals are safe in git — `git checkout -- public/images/hollow` reverts.
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

// ── Shared prompt blocks (put in EVERY prompt, per the doc) ─────────────────
const STYLE = "Warm storybook interior illustration, painterly with soft volumetric light, rich texture and depth, realistic cartoon style (detailed, not babyish, not flat vector), inviting and magical, high detail, 16:9 wide composition.";
const NOCHAR = "ABSOLUTELY NO characters, no animals, no creatures, no people, no faces on objects. No text, no letters, no numbers, no watermark, no logo. The scene must be EMPTY of inhabitants — it is a home waiting for the child to fill it.";
const COMP6 = "Two clearly readable EMPTY display ledges running across the scene — an upper shelf level roughly at the top-middle of the frame and a lower shelf level below it — with six distinct empty niches/spots spaced evenly from far left to far right. Each niche is a flat, open surface large enough to display a single treasured object. Nothing sits on the shelves; they wait to be filled. Keep the niches uncluttered and softly spotlit so objects placed there will pop.";
const COMP4 = "Two clearly readable EMPTY display ledges — an upper shelf level near the top-middle and a lower shelf level below it — with FOUR distinct empty niches/spots alternating upper/lower and spaced evenly across the full width. Each niche is a flat, open surface for a single object; nothing sits on the shelves; they wait to be filled, softly spotlit so placed objects pop.";
const BACKDROP = "Designed as a BACKDROP that UI sits on top of: keep the CENTRE of the frame soft-focus, low-detail and gently blurred so cards and letters stay legible; keep the interesting detail around the edges. No niches or shelves needed.";

const room6 = desc => `${STYLE} ${NOCHAR} ${COMP6} ${desc}`;
const room4 = desc => `${STYLE} ${NOCHAR} ${COMP4} ${desc}`;
const backdrop = desc => `${STYLE} ${NOCHAR} ${BACKDROP} ${desc}`;

const HOLLOW = "public/images/hollow";
const BACKDROPS = "public/images/backdrops";

const tasks = [
  // ── Batch A — the rooms (drop-in over existing filenames) ────────────────
  { dir: HOLLOW, file: "scene-meadow", prompt: room6("Interior of a cozy sunlit barn: honey-coloured weathered wooden plank walls, two rustic timber shelves built from reclaimed barn boards with visible grain and hand-forged iron brackets. Golden afternoon light pours through a hay-loft window on the left, dust motes floating in the beams. Details BETWEEN (never on) the niches: coiled rope on a nail, a small stack of hay in a corner, dried wildflower bunches hanging from a beam, a red-painted door frame edge at far right, a horseshoe above the shelf. Palette: warm honey wood, cream, soft red accents, golden light.") },
  { dir: HOLLOW, file: "scene-dino", prompt: room6("Interior of a prehistoric cave dwelling: smooth sandstone walls in ochre and terracotta, two natural rock ledges carved into the stone forming the display shelves, edges worn smooth. An ammonite fossil and fern imprints embedded in the wall BETWEEN niches, small clusters of glowing orange crystals lighting the alcoves from below, a warm firelight glow from an unseen source at the left edge, primitive ochre swirl markings (abstract patterns only, no letters) high on the wall. A glimpse of jungle ferns and volcanic dusk sky through a cave opening at far right. Palette: ochre, terracotta, warm amber light, deep brown shadows.") },
  { dir: HOLLOW, file: "scene-moonwood", prompt: room6("Interior of a giant hollowed-out ancient tree: living wood walls with swirling grain, two shelf levels formed from natural knotholes, burls and polished root ledges growing out of the trunk itself. Bioluminescent blue and teal moss veins the bark and softly lights each empty knothole niche; tiny motes of silver light drift in the air; a round window opening in the trunk at upper right reveals a starry night sky and crescent moon. Hanging glow-lanterns on twisted twigs BETWEEN niches, never on them. Palette: deep walnut wood, midnight blue, glowing teal and silver.") },
  { dir: HOLLOW, file: "band-garden", prompt: room4("The Garden Conservatory: a glass-and-timber lean-to greenhouse attached to the hollow; two mossy potting-bench shelves with four empty spots, terracotta pots and hanging vines BETWEEN them, fireflies, dusk light through glass panes.") },
  { dir: HOLLOW, file: "band-pond", prompt: room4("The Pond Grotto: a sheltered waterside nook; flat smooth stepping-stone pedestals and a driftwood shelf at the water's edge forming four empty spots, lily pads and cattails around (not on) them, moonlight reflecting off gentle ripples.") },
  { dir: HOLLOW, file: "band-cave", prompt: room4("The Crystal Nook: a small crystal-lined chamber; four empty ledges among clusters of violet and teal crystals that light each spot from beneath, stalactites above, a shallow glowing pool below.") },
  { dir: HOLLOW, file: "band-treetop", prompt: room4("The Treetop Perch: an open platform high in the canopy; four empty spots on railed branch-shelves and a flat stump table, rope bridge fading into leaves behind, paper lanterns strung above, warm sunset sky and distant clouds (no birds).") },

  // ── Batch B.1 — quest/phonics activity backdrops (wire-up pending) ───────
  { dir: BACKDROPS, file: "activity-bg-meadow", prompt: backdrop("Soft-focus rolling green meadow with a winding path and a big open sky, gentle depth blur.") },
  { dir: BACKDROPS, file: "activity-bg-dino", prompt: backdrop("Soft-focus fern valley with a distant volcano and hazy dusk sky.") },
  { dir: BACKDROPS, file: "activity-bg-moonwood", prompt: backdrop("Soft-focus moonlit forest clearing with fireflies at the edges.") },

  // ── Batch B.3 — Reading Library backdrop ─────────────────────────────────
  { dir: BACKDROPS, file: "library-nook", prompt: backdrop("A cozy window-seat reading nook at golden hour, plump cushions and shelves of colourful books with blank title-less spines, warm and inviting.") }
];

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

for (const dir of new Set(tasks.map(t => t.dir))) await mkdir(dir, { recursive: true });

let done = 0, skipped = 0; const failed = [];
console.log(`Seedream (${MODEL}) — ${tasks.length} images. FORCE=${FORCE ? "on (overwrites)" : "off (skips existing)"}`);
for (const t of tasks) {
  const outPath = `${t.dir}/${t.file}.webp`;
  if (!FORCE && await exists(outPath)) { skipped++; console.log(`• skip ${t.file}.webp (exists — FORCE=1 to replace)`); continue; }
  try {
    const body = { model: MODEL, prompt: t.prompt, size: "1920x1080", response_format: "url", watermark: false };
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 180)}`);
    const item = (await res.json())?.data?.[0] || {};
    let raw;
    if (item.b64_json) raw = Buffer.from(item.b64_json, "base64");
    else if (item.url) raw = Buffer.from(await (await fetch(item.url)).arrayBuffer());
    else throw new Error("no image in response");
    const webp = await sharp(raw).resize(1920, 1080, { fit: "cover" }).webp({ quality: 90 }).toBuffer();
    await writeFile(outPath, webp);
    done++;
    console.log(`✓ ${done + skipped}/${tasks.length}  ${outPath}`);
    await sleep(300);
  } catch (e) {
    failed.push({ file: t.file, error: String(e.message || e) });
    console.error(`✗ ${t.file}: ${e.message || e}`);
  }
}
console.log(`\nDone. ${done} generated, ${skipped} skipped, ${failed.length} failed.`);
if (failed.length) {
  console.log("Failed (re-run to retry just these):");
  failed.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
  process.exit(1);
}
