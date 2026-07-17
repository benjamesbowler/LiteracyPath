/**
 * Generate the three world backdrops for the Letter Leap platformer with
 * BytePlus ModelArk (Seedream), locally. Your API key never leaves your Mac.
 *
 * SETUP (once):
 *   npm i sharp
 *   export ARK_API_KEY="your-key"
 *   # model that works on your account (same as the icons):
 *   export ARK_MODEL="seedream-4-0-250828"
 *   # widescreen; adjust if the model wants a named size (e.g. 2K):
 *   export ARK_SIZE="1920x1088"
 *
 * RUN:
 *   node tools/generate-game-backgrounds.mjs
 *   git add public/images/games/bg-*.webp && git commit -m "Letter Leap world backgrounds"
 */
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const API_KEY = process.env.ARK_API_KEY;
const MODEL = process.env.ARK_MODEL || "seedream-4-0-250828";
const SIZE = process.env.ARK_SIZE || "1920x1088";
const ENDPOINT = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";

if (!API_KEY) {
  console.error('Missing ARK_API_KEY. Run:  export ARK_API_KEY="your-key"  then re-run.');
  process.exit(1);
}

const STYLE = "wide side-scrolling 2D platformer game background, layered parallax depth, seamless horizontal, soft atmospheric haze, premium hand-painted game art, rich colour, NO text, no words, no characters, no UI, no foreground platforms";

const BGS = [
  { file: "public/images/games/bg-meadow.webp", scene: "a lush sunny cartoon meadow, rolling green hills, scattered leafy trees, wildflowers, soft fluffy clouds in a bright blue sky, warm cheerful daylight" },
  { file: "public/images/games/bg-dino.webp", scene: "a prehistoric jungle valley at golden hour, giant ferns and cycad plants, distant misty volcano, warm amber sky, lush greenery" },
  { file: "public/images/games/bg-moonwood.webp", scene: "a magical moonlit forest at night, tall dark trees, glowing blue mushrooms and drifting fireflies, deep indigo starry sky, gentle mist" }
];

async function generate({ file, scene }) {
  const prompt = `${scene}. ${STYLE}.`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, prompt, size: SIZE, response_format: "url", watermark: false })
  });
  if (!res.ok) throw new Error(`API ${res.status} for ${file}: ${await res.text()}`);
  const json = await res.json();
  const item = json?.data?.[0] || {};
  let buf;
  if (item.b64_json) buf = Buffer.from(item.b64_json, "base64");
  else if (item.url) buf = Buffer.from(await (await fetch(item.url)).arrayBuffer());
  else throw new Error(`No image for ${file}: ${JSON.stringify(json).slice(0, 300)}`);
  await mkdir(dirname(file), { recursive: true });
  await sharp(buf).resize(1600, 900, { fit: "cover" }).webp({ quality: 82 }).toFile(file);
  console.log("✓", file);
}

for (const bg of BGS) {
  try { await generate(bg); } catch (err) { console.error("✗", bg.file, "-", err.message); }
}
console.log("\nDone. Commit just the media:\n  git add public/images/games/bg-*.webp && git commit -m \"Letter Leap world backgrounds\"");
