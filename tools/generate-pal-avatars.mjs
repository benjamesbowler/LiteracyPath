/**
 * Dress-up avatar pipeline: full-body companion art + every gear item
 * ACTUALLY WORN, via Seedream image editing (BytePlus ModelArk).
 *
 * Per companion (6):
 *   1. BASE   public/images/companions/full/<pal>.webp
 *      Full-body standing pose, feet visible, soft plain backdrop -
 *      the SAME canonical pose spec for every pal so gear aligns.
 *   2. Per gear item (14): image-to-image edit of the base ("same character,
 *      now wearing X, change nothing else") ->
 *      DRESSED public/images/companions/full/<pal>--<gear>.webp
 *      (used directly when the child wears exactly one item)
 *      OVERLAY public/images/companions/overlays/<pal>--<gear>.png
 *      (alpha layer = pixels that CHANGED vs the base; stacked when the
 *      child wears several items at once)
 *
 *   - ARK_API_KEY auto-loads from .env.local.
 *   - Skips existing (FORCE=1 re-does). ONLY=<palId> limits to one pal.
 *   - ~90 generations total; expect a few minutes.
 *
 * RUN:            node tools/generate-pal-avatars.mjs
 * ONE PAL:        ONLY=socks node tools/generate-pal-avatars.mjs
 * REGENERATE:     FORCE=1 node tools/generate-pal-avatars.mjs
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
    } catch { /* keep looking */ }
  }
}
await loadEnv();

const API_KEY = process.env.ARK_API_KEY;
const MODEL = process.env.ARK_MODEL || "seedream-4-0-250828";
const ENDPOINT = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";
const ONLY = process.env.ONLY || "";
if (!API_KEY) { console.error("Missing ARK_API_KEY - add  ARK_API_KEY=your-key  to .env.local, then re-run."); process.exit(1); }

const FULL_DIR = "public/images/companions/full";
const OVERLAY_DIR = "public/images/companions/overlays";

// The one canonical pose. Every base uses it so gear edits stay aligned.
const POSE = "standing upright facing the viewer, full body visible from head to feet, arms relaxed at the sides, feet planted on the ground, centered in frame with clear space above the head and below the feet";
const STYLE = "Friendly realistic-cartoon storybook character for a children's reading app, clean gentle outlines, soft even studio lighting, plain very light warm cream background with a soft ground shadow under the feet, no other objects.";
const RULES = "No text, no letters, no numbers, no watermark, no logo, no border. Exactly ONE character.";

// Canon looks from the reader series' character references.
const PALS = [
  { id: "fluff", desc: "Fluff from the Bob and Nan books: a small very fluffy brown puppy with bright eyes and a happy open-mouth smile" },
  { id: "chips", desc: "Chips from the James and Anna books: a small white goat with big brown patches, yellow eyes, short horns, floppy ears, and a blue collar with a little blue bell" },
  { id: "socks", desc: "Socks from the Aiden and Betty books: a small cheeky monkey with cream-white fur on the face and chest, darker brown fur on the back, black hands and feet, wearing his tiny red waistcoat" },
  { id: "chompy", desc: "Chompy from the Dino Pals books: an orange baby T-Rex with tiny arms, a big round tummy, a white bib around his neck, and a sweet hungry smile" },
  { id: "muddy", desc: "Muddy from the Meadow Pals books: a cheerful pink piglet with a few playful splashes of brown mud on his cheeks and tummy" },
  { id: "pip", desc: "Pip from the Moonwood Tales books: a young elf child with pointed ears, brown hair, green eyes, wearing a dark green tunic with a brown belt and small brown boots" }
];

// What each Market gear item looks like ON the character. Ids must match
// GEAR in src/utils/hollowEconomy.js.
const GEAR_LOOKS = {
  "gear-meadow-crown": "a small woven crown of meadow flowers and grass sitting on top of the head",
  "gear-explorer-pack": "a little tan canvas explorer backpack with a bedroll, worn on the back with straps over the shoulders",
  "gear-acorn-shield": "a small round wooden shield with an acorn emblem, held in one hand at the side",
  "gear-willow-wand": "a slender willow-branch wand with a soft glowing tip, held up in one hand",
  "gear-trail-boots": "sturdy little brown leather hiking boots with green laces, worn on the feet",
  "gear-wizard-hat": "a floppy midnight-blue wizard hat with tiny embroidered stars, sitting on the head",
  "gear-starweave-scarf": "a flowing indigo scarf woven with tiny glowing stars, wrapped once around the neck with the ends hanging down",
  "gear-moth-wings": "a pair of large soft moth wings, pale green with moon-dust patterns, attached to the back and gently spread",
  "gear-dino-helm": "a rounded dino-skull-shaped helmet with two small horns, worn on the head",
  "gear-bone-charm": "a simple cord necklace with a small carved white bone charm, worn around the neck",
  "gear-raptor-wings": "a pair of feathered orange-and-teal raptor wings attached to the back, gently folded",
  "gear-petal-hood": "a soft hood made of layered pink flower petals, worn up over the head",
  "gear-leaf-cloak": "a short cloak of layered green leaves fastened at the neck, draped over the shoulders",
  "gear-falcon-wings": "a pair of sleek grey-and-white falcon wings attached to the back, slightly lifted"
};

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callSeedream(body) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 220)}`);
  const item = (await res.json())?.data?.[0] || {};
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer());
  throw new Error("no image in response");
}

async function generateBase(pal) {
  const prompt = `${STYLE} ${pal.desc}, ${POSE}. ${RULES}`;
  const raw = await callSeedream({ model: MODEL, prompt, size: "1024x1024", response_format: "url", watermark: false });
  return sharp(raw).resize(1024, 1024, { fit: "cover" }).webp({ quality: 92 }).toBuffer();
}

async function generateDressed(baseWebp, pal, gearId) {
  const look = GEAR_LOOKS[gearId];
  const prompt = `Edit this image: the character is now ALSO wearing ${look}. Keep the character, pose, proportions, colors, lighting, background and framing EXACTLY the same as the input image - the ONLY change is the added item. ${RULES}`;
  const dataUrl = `data:image/webp;base64,${baseWebp.toString("base64")}`;
  const raw = await callSeedream({ model: MODEL, prompt, image: dataUrl, size: "1024x1024", response_format: "url", watermark: false });
  return sharp(raw).resize(1024, 1024, { fit: "cover" }).webp({ quality: 92 }).toBuffer();
}

/* The overlay = the dressed image, transparent everywhere it matches the
   base. Because the edit keeps everything else identical, the changed pixels
   ARE the worn item (plus its cast shadow). Full-canvas PNG so stacked
   overlays align by construction. */
async function extractOverlay(baseWebp, dressedWebp) {
  const W = 1024, H = 1024;
  const a = await sharp(baseWebp).ensureAlpha().raw().toBuffer();
  const b = await sharp(dressedWebp).ensureAlpha().raw().toBuffer();
  const mask = Buffer.alloc(W * H);
  for (let i = 0, p = 0; i < a.length; i += 4, p += 1) {
    const d = Math.max(
      Math.abs(a[i] - b[i]),
      Math.abs(a[i + 1] - b[i + 1]),
      Math.abs(a[i + 2] - b[i + 2])
    );
    mask[p] = d > 26 ? 255 : 0;
  }
  // Clean the mask: blur away speckles, re-threshold, then feather the edge.
  const cleaned = await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
    .blur(3)
    .threshold(96)
    .blur(1.2)
    .toBuffer();
  return sharp(dressedWebp)
    .ensureAlpha()
    .joinChannel(cleaned, { raw: { width: W, height: H, channels: 1 } })
    .removeAlpha()
    .joinChannel(cleaned, { raw: { width: W, height: H, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await mkdir(FULL_DIR, { recursive: true });
await mkdir(OVERLAY_DIR, { recursive: true });

const pals = ONLY ? PALS.filter(p => p.id === ONLY) : PALS;
if (ONLY && !pals.length) { console.error(`No pal named "${ONLY}". Options: ${PALS.map(p => p.id).join(", ")}`); process.exit(1); }

let done = 0, skipped = 0; const failed = [];
console.log(`Seedream (${MODEL}) - dress-up avatars for ${pals.length} pal(s) x ${Object.keys(GEAR_LOOKS).length} gear items. FORCE=${FORCE ? "on" : "off"}`);

for (const pal of pals) {
  const basePath = `${FULL_DIR}/${pal.id}.webp`;
  let baseWebp = null;
  try {
    if (!FORCE && await exists(basePath)) {
      baseWebp = await readFile(basePath);
      skipped++; console.log(`- base ${pal.id} (exists)`);
    } else {
      baseWebp = await generateBase(pal);
      await writeFile(basePath, baseWebp);
      done++; console.log(`+ base ${pal.id}`);
      await sleep(400);
    }
  } catch (err) {
    failed.push(`${pal.id}(base)`); console.error(`x base ${pal.id}: ${err.message}`);
    continue; // no base -> can't dress this pal
  }

  for (const gearId of Object.keys(GEAR_LOOKS)) {
    const dressedPath = `${FULL_DIR}/${pal.id}--${gearId}.webp`;
    const overlayPath = `${OVERLAY_DIR}/${pal.id}--${gearId}.png`;
    if (!FORCE && await exists(dressedPath) && await exists(overlayPath)) {
      skipped++; continue;
    }
    try {
      const dressed = await generateDressed(baseWebp, pal, gearId);
      await writeFile(dressedPath, dressed);
      await writeFile(overlayPath, await extractOverlay(baseWebp, dressed));
      done++; console.log(`+ ${pal.id} wearing ${gearId.replace("gear-", "")}`);
      await sleep(400);
    } catch (err) {
      failed.push(`${pal.id}--${gearId}`); console.error(`x ${pal.id}--${gearId}: ${err.message}`);
    }
  }
}

console.log(`\nDone. ${done} generated, ${skipped} skipped, ${failed.length} failed${failed.length ? ` (${failed.join(", ")}) - re-run to retry just those` : ""}.`);
process.exit(failed.length ? 1 : 0);
