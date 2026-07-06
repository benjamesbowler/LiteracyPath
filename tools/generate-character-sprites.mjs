/**
 * Generate PLAYABLE CHARACTERS (per world) + RACER back-view characters + a
 * premium SNES-tier SPACE BACKDROP for Rocket Run, with BytePlus ModelArk
 * (Seedream). Your key stays on your Mac.
 *
 * Characters/racers render on SOLID MAGENTA (#FF00FF) and are chroma-keyed to
 * clean transparency (via sharp). The space backdrop is a full scene (no key).
 *
 * ART DIRECTION (house rules): realistic-leaning cartoon, fantasy / nature,
 * appealing to 5–8 year olds, NOT babyish, NO rainbow motifs, thick clean
 * outline, flat cel-shading, premium game art, no text, no watermark.
 *
 * Roster (Letter Leap reads these by filename; different pals appear on
 * different levels, and Rocket Run's back-view racers are for the racing game):
 *   meadow  -> char-meadow-a/b/c   (lamb, rabbit, hedgehog)
 *   dino    -> char-dino-a/b/c     (triceratops, T-rex, stegosaurus)
 *   moonwood-> char-moonwood-a/b   (owl, mouse)   [char-hero stays as a 3rd]
 *   racers  -> racer-<world>-back  (chase-cam, seen from behind, in kart/broom)
 *   space   -> bg-space            (Rocket Run backdrop)
 *
 * SETUP (once):  npm i sharp   &&   export ARK_API_KEY="your-key"
 * RUN:           node tools/generate-character-sprites.mjs
 * COMMIT MEDIA:  git add public/images/games/*.webp && git commit -m "Playable characters + racer + space backdrop"
 */
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const API_KEY = process.env.ARK_API_KEY;
const MODEL = process.env.ARK_MODEL || "seedream-4-0-250828";
const ENDPOINT = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
if (!API_KEY) { console.error('Missing ARK_API_KEY. Run:  export ARK_API_KEY="your-key"'); process.exit(1); }

const SIDE = "centered, full body, side profile facing RIGHT, on a SOLID FLAT PURE MAGENTA #FF00FF background, absolutely no shadow, no gradient, no ground line, crisp clean edges, thick dark outline, flat cel-shaded cartoon, premium 2D platformer sprite, not babyish, no rainbow, no text, no watermark";
const BACK = "centered, full body, seen FROM BEHIND (back view, chase-camera), on a SOLID FLAT PURE MAGENTA #FF00FF background, no shadow, no gradient, crisp clean edges, thick dark outline, flat cel-shaded cartoon, premium racing-game sprite, not babyish, no rainbow, no text, no watermark";

const ITEMS = [
  // ── Meadow Pals (playable) ──
  { file: "public/images/games/char-meadow-a.webp", size: "1024x1024", chroma: true, prompt: `A cheerful cartoon lamb with soft cream wool and little hooves, friendly face, ${SIDE}` },
  { file: "public/images/games/char-meadow-b.webp", size: "1024x1024", chroma: true, prompt: `A cheerful cartoon rabbit with tall ears and a small backpack, mid-hop pose, ${SIDE}` },
  { file: "public/images/games/char-meadow-c.webp", size: "1024x1024", chroma: true, prompt: `A friendly cartoon hedgehog with soft spines and a little green scarf, ${SIDE}` },
  // ── Dino Pals (playable) ──
  { file: "public/images/games/char-dino-a.webp", size: "1024x1024", chroma: true, prompt: `A cute baby green triceratops dinosaur, chunky and friendly, three small horns, ${SIDE}` },
  { file: "public/images/games/char-dino-b.webp", size: "1024x1024", chroma: true, prompt: `A cute small orange baby T-rex dinosaur, stubby arms, cheerful, ${SIDE}` },
  { file: "public/images/games/char-dino-c.webp", size: "1024x1024", chroma: true, prompt: `A cute little blue baby stegosaurus with soft back plates, ${SIDE}` },
  // ── Moonwood (playable; char-hero stays as a third) ──
  { file: "public/images/games/char-moonwood-a.webp", size: "1024x1024", chroma: true, prompt: `A cute cartoon purple owl with big gentle eyes and faint golden star markings on its feathers, magical forest creature, ${SIDE}` },
  { file: "public/images/games/char-moonwood-b.webp", size: "1024x1024", chroma: true, prompt: `A small cartoon woodland mouse holding a tiny warm lantern, cozy explorer, ${SIDE}` },
  // ── Racer back-view characters (Sound Racer) ──
  { file: "public/images/games/racer-meadow-back.webp", size: "1024x1024", chroma: true, prompt: `A cartoon lamb sitting inside a small go-kart, ${BACK}` },
  { file: "public/images/games/racer-dino-back.webp", size: "1024x1024", chroma: true, prompt: `A baby dinosaur sitting inside a small rugged go-kart, ${BACK}` },
  { file: "public/images/games/racer-moonwood-back.webp", size: "1024x1024", chroma: true, prompt: `A friendly young witch flying away on a broom, cape trailing, ${BACK}` },
  // ── SNES-tier space backdrop for Rocket Run (full scene, no key) ──
  { file: "public/images/games/bg-space.webp", size: "2048x1152", chroma: false, prompt: "A gorgeous 16-bit SNES-style outer-space scene: deep indigo-to-violet nebula, dense sparkling starfield, two distant colourful planets and a pale moon, soft glowing gas clouds, painterly retro game background, rich and vibrant but not garish, no rainbow, no text, no watermark" }
];

async function fetchImage(prompt, size) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, prompt, size, response_format: "url", watermark: false })
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const item = json?.data?.[0] || {};
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer());
  throw new Error(`No image: ${JSON.stringify(json).slice(0, 200)}`);
}

// Flood-fill the magenta backdrop to transparency; keep interior detail.
async function keyBg(buf, outFile) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const key = [data[0], data[1], data[2]];
  const tol2 = 80 * 80;
  const match = p => { const dr = data[p] - key[0], dg = data[p + 1] - key[1], db = data[p + 2] - key[2]; return dr * dr + dg * dg + db * db < tol2; };
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, 0, x, H - 1);
  for (let y = 0; y < H; y++) stack.push(0, y, W - 1, y);
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const c = y * W + x; if (seen[c]) continue; seen[c] = 1;
    const p = c * 4; if (!match(p)) continue;
    data[p + 3] = 0;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 6 }).resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 }).toFile(outFile);
}

for (const it of ITEMS) {
  try {
    const buf = await fetchImage(it.prompt, it.size);
    await mkdir(dirname(it.file), { recursive: true });
    if (it.chroma) await keyBg(buf, it.file);
    else await sharp(buf).resize(1536, 864, { fit: "cover" }).webp({ quality: 86 }).toFile(it.file);
    console.log("✓", it.file);
  } catch (err) { console.error("✗", it.file, "-", err.message); }
}
console.log("\nDone. Review the art, then commit:\n  git add public/images/games/*.webp && git commit -m \"Playable characters + racer + space backdrop\"");
