/**
 * Generate the Letter Leap SPRITES (character, enemy) and TILES (ground,
 * platform) with BytePlus ModelArk (Seedream), locally. Your key stays on your Mac.
 *
 * Sprites are generated on a solid MAGENTA (#FF00FF) chroma background and this
 * script keys that colour out to real transparency (in Node, via sharp) so the
 * committed .webp already has a clean alpha channel — the game just draws it.
 *
 * SETUP (once):  npm i sharp   &&   export ARK_API_KEY="your-key"
 * RUN:           node tools/generate-game-sprites.mjs
 * COMMIT MEDIA:  git add public/images/games/*.webp && git commit -m "Letter Leap sprites + tiles"
 */
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const API_KEY = process.env.ARK_API_KEY;
const MODEL = process.env.ARK_MODEL || "seedream-4-0-250828";
const ENDPOINT = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
if (!API_KEY) { console.error('Missing ARK_API_KEY. Run:  export ARK_API_KEY="your-key"'); process.exit(1); }

const CHROMA = "centered, full body, facing right, on a SOLID FLAT PURE MAGENTA #FF00FF background, absolutely no shadow, no gradient, no ground line, crisp clean edges, thick dark outline, flat cel-shaded cartoon, premium 2D platformer sprite, no text, no watermark";

const ITEMS = [
  { file: "public/images/games/char-hero.webp", size: "1024x1024", chroma: true,
    prompt: `A cute friendly cartoon sprout creature, chubby round mint-green body, big soft belly, two large friendly eyes, a little curled green leaf growing from the top of its head, small stubby legs, cheerful, ${CHROMA}` },
  { file: "public/images/games/enemy-grumper.webp", size: "1024x1024", chroma: true,
    prompt: `A small grumpy cartoon critter enemy, round red-orange body with short spikes across the top, cross angry eyebrows, tiny feet, ${CHROMA}` },
  { file: "public/images/games/tile-ground.webp", size: "1024x1024", chroma: false,
    prompt: "A seamless repeating cartoon platformer GROUND texture: bright green grassy top edge over rich brown soil with small pebbles, painterly cel-shaded, tileable horizontally, top-down-front game terrain, no text, no watermark" },
  { file: "public/images/games/tile-platform.webp", size: "1024x1024", chroma: false,
    prompt: "A seamless repeating cartoon platformer FLOATING PLATFORM texture: mossy stone block with a grassy green top, painterly cel-shaded, tileable horizontally, no text, no watermark" }
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

// Remove the background whatever colour it is (magenta OR white). Flood-fill from
// the borders through pixels close to the corner colour, so the actual backdrop is
// erased but interior details (eye highlights, light belly) are preserved.
async function keyBg(buf, outFile) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const key = [data[0], data[1], data[2]]; // sample the top-left corner as the backdrop colour
  const tol2 = 80 * 80;
  const match = p => {
    const dr = data[p] - key[0], dg = data[p + 1] - key[1], db = data[p + 2] - key[2];
    return dr * dr + dg * dg + db * db < tol2;
  };
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
    else await sharp(buf).resize(512, 512, { fit: "cover" }).webp({ quality: 85 }).toFile(it.file);
    console.log("✓", it.file);
  } catch (err) { console.error("✗", it.file, "-", err.message); }
}
console.log("\nDone. Commit the media:\n  git add public/images/games/*.webp && git commit -m \"Letter Leap sprites + tiles\"");
