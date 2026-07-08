/**
 * Generate the 67 "My Hollow" (Rewards V2) images via Seedream (BytePlus ModelArk),
 * knock out the plain white background (edge flood-fill — keeps interior white like
 * feathers / flowers / silver highlights), and save webp to public/images/hollow/.
 *
 *   - ARK_API_KEY auto-loads from .env.local (same as the other generate-*.mjs).
 *   - watermark: false on every request.
 *   - Idempotent: any file that already exists is skipped, so a failed/partial run
 *     just needs re-running (it resumes and only retries what's missing).
 *   - Beastie stages (s1/s2/s3) share a per-species seed to nudge a consistent design.
 *
 * RUN:  node tools/generate-hollow-images.mjs
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
const OUT = "public/images/hollow";
if (!API_KEY) { console.error("Missing ARK_API_KEY — add  ARK_API_KEY=your-key  to .env.local, then re-run."); process.exit(1); }

const PREFIX = "Bold pop-art comic book illustration, thick black outlines, halftone dot shading, vibrant saturated colors, dynamic lighting, realistic cartoon style (not babyish, not cutesy), fantasy storybook subject.";
const OBJ_TAIL = "Single object centered, isolated on a plain solid pure-white background. No text, no letters, no watermark, no human faces, no faces on objects.";
const CRE_TAIL = "A single friendly cartoon creature centered with expressive eyes, isolated on a plain solid pure-white background. No text, no letters, no watermark, no human faces.";
const SCENE_TAIL = "A wide cozy, detailed scene. No text, no letters, no watermark, no human faces.";
const obj = s => `${s}. ${PREFIX} ${OBJ_TAIL}`;
const cre = s => `${s}. ${PREFIX} ${CRE_TAIL}`;

const GEAR = [
  ["gear-meadow-crown", "golden crown woven from wheat stalks and tiny wildflowers"],
  ["gear-explorer-pack", "small brown leather adventurer backpack with brass buckles and a rolled map"],
  ["gear-acorn-shield", "round wooden shield with an acorn emblem carved in the center"],
  ["gear-willow-wand", "slender willow-branch magic wand with a soft teal glow at the tip"],
  ["gear-trail-boots", "pair of sturdy little leather hiking boots with green laces"],
  ["gear-wizard-hat", "midnight-blue pointed wizard hat with silver star embroidery"],
  ["gear-starweave-scarf", "flowing deep-purple scarf woven with glowing constellation threads"],
  ["gear-moth-wings", "majestic pale-green luna moth wings with moonlit patterns"],
  ["gear-dino-helm", "tribal helmet carved from bone shaped like a triceratops skull crest"],
  ["gear-bone-charm", "necklace of a small fossil bone on a leather cord"],
  ["gear-raptor-wings", "fierce feathered raptor wings, amber and rust colored"],
  ["gear-petal-hood", "hooded cape made of layered pink and coral flower petals"],
  ["gear-leaf-cloak", "cloak of overlapping green forest leaves with dew drops"],
  ["gear-falcon-wings", "powerful falcon wings, slate grey with white flight feathers"]
];
const DECOR = [
  ["hollow-glow-jar", "glass jar full of glowing golden fireflies"],
  ["hollow-mushroom-stool", "plump red-capped toadstool used as a stool"],
  ["hollow-moon-lantern", "paper lantern shaped like a crescent moon, warm glow"],
  ["hollow-moss-rug", "round rug of thick soft green moss with tiny white flowers"],
  ["hollow-star-banner", "hanging fabric banner with embroidered gold stars"],
  ["hollow-root-table", "low table grown from twisted tree roots"],
  ["hollow-owl-perch", "wooden branch perch with moss, built for an owl"],
  ["hollow-story-shelf", "crooked bookshelf carved into a tree trunk, full of tiny books"],
  ["hollow-ember-pit", "cozy stone fire pit with glowing orange embers"],
  ["hollow-crystal-cluster", "cluster of glowing violet crystals growing from rock"],
  ["hollow-dino-skull", "ancient weathered dinosaur skull, museum-fossil style"],
  ["hollow-fern-fountain", "small stone fountain overgrown with ferns, water trickling"],
  ["hollow-moonwell", "small stone well glowing with silver moonlight inside"],
  ["hollow-waterfall", "miniature enchanted waterfall over mossy rocks with mist"]
];
const EXP_EGG = [
  ["exp-garden", "lush magical garden gate opening onto glowing moss beds"],
  ["exp-pond", "small forest pond with lily pads and glowing dragonflies"],
  ["exp-cave", "crystal cave entrance glowing violet and teal"],
  ["exp-treetop", "treetop platform with rope bridge among giant branches"],
  ["egg-bronze", "speckled bronze-brown fantasy egg in a small grass nest"],
  ["egg-silver", "shimmering silver fantasy egg with faint runes, in a nest"],
  ["egg-gold", "radiant gold fantasy egg with glowing star markings, in a nest"]
];
const BEASTIES = [
  ["beastie-moss-sprite", "small forest spirit creature made of moss and leaves"],
  ["beastie-ember-fox", "fox with ember-orange fur and a faintly glowing warm tail"],
  ["beastie-pebble-toad", "round toad with a back of smooth grey river pebbles"],
  ["beastie-sun-moth", "moth with golden sun-patterned wings"],
  ["beastie-fern-snail", "snail with a spiral shell overgrown with tiny ferns"],
  ["beastie-star-owl", "owl with midnight-blue feathers speckled like a starfield"],
  ["beastie-thorn-stag", "stag with antlers of blackthorn branches and berries"],
  ["beastie-glow-lynx", "lynx with pale fur and teal bioluminescent markings"],
  ["beastie-river-dragon", "serpentine water dragon with blue-green scales and river spray"],
  ["beastie-moon-wyrm", "slender silver dragon with crescent-moon markings and a soft night glow"]
];
const STAGES = [
  ["s1", "as a tiny baby: big eyes, small, round and cute"],
  ["s2", "as a young juvenile: half grown, more detail"],
  ["s3", "as a grand fully grown adult: impressive, with small magical glow effects"]
];

const tasks = [];
for (const [file, s] of [...GEAR, ...DECOR, ...EXP_EGG]) tasks.push({ file, prompt: obj(s), knockout: true, w: 1024, h: 1024 });
let seed = 100001;
for (const [id, s] of BEASTIES) {
  const speciesSeed = seed++;
  for (const [st, desc] of STAGES) {
    tasks.push({
      file: `${id}-${st}`,
      prompt: cre(`${s}, ${desc}. Keep the exact same colors and markings for this creature across every growth stage`),
      knockout: true, w: 1024, h: 1024, seed: speciesSeed
    });
  }
}
tasks.push({ file: "market-merchant", prompt: cre("friendly badger merchant character in a travelling cloak beside a wooden caravan cart"), knockout: true, w: 1024, h: 1024 });
tasks.push({ file: "hollow-interior", prompt: `Wide cozy interior of a giant hollow tree home at night, warm lantern light, empty shelves and open floor space. ${PREFIX} ${SCENE_TAIL}`, knockout: false, w: 1920, h: 1080 });

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Edge flood-fill: only white pixels connected to the border become transparent,
// so interior white (feathers, flowers, silver) is preserved.
async function knockoutWhite(buf, w, h) {
  const { data, info } = await sharp(buf).resize(w, h, { fit: "cover" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, ch = info.channels;
  const white = i => data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238;
  const seen = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const p = y * W + x; if (seen[p]) return; seen[p] = 1; stack.push(p); };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const p = stack.pop(), i = p * ch;
    if (!white(i)) continue;
    data[i + 3] = 0;
    const x = p % W, y = (p / W) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return sharp(data, { raw: { width: W, height: H, channels: ch } }).webp({ quality: 90 }).toBuffer();
}

await mkdir(OUT, { recursive: true });
let done = 0, skipped = 0; const failed = [];
console.log(`Generating ${tasks.length} images → ${OUT}/ (skipping any that already exist)`);
for (const t of tasks) {
  const outPath = `${OUT}/${t.file}.webp`;
  if (await exists(outPath)) { skipped++; continue; }
  try {
    const body = { model: MODEL, prompt: t.prompt, size: `${t.w}x${t.h}`, response_format: "url", watermark: false };
    if (t.seed) body.seed = t.seed;
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 180)}`);
    const item = (await res.json())?.data?.[0] || {};
    let raw;
    if (item.b64_json) raw = Buffer.from(item.b64_json, "base64");
    else if (item.url) raw = Buffer.from(await (await fetch(item.url)).arrayBuffer());
    else throw new Error("no image in response");
    const webp = t.knockout ? await knockoutWhite(raw, t.w, t.h) : await sharp(raw).resize(t.w, t.h, { fit: "cover" }).webp({ quality: 90 }).toBuffer();
    await writeFile(outPath, webp);
    done++;
    console.log(`✓ ${done + skipped}/${tasks.length}  ${t.file}.webp`);
    await sleep(300);
  } catch (e) {
    failed.push({ file: t.file, error: String(e.message || e) });
    console.error(`✗ ${t.file}: ${e.message || e}`);
  }
}
console.log(`\nDone. ${done} generated, ${skipped} already existed, ${failed.length} failed.`);
if (failed.length) {
  console.log("Failed (just re-run the script — existing files are skipped, so it retries only these):");
  failed.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
  process.exit(1);
}
