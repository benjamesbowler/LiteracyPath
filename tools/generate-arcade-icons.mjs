/**
 * Generate the six arcade game icons with BytePlus ModelArk (Seedream), locally.
 *
 * WHY LOCAL: your API key never leaves your Mac and never gets committed. This
 * script only writes image files; you commit just the media.
 *
 * SETUP (once):
 *   npm i sharp                      # image resize/convert (dev-only, not shipped)
 *   export ARK_API_KEY="your-key"    # from the BytePlus ModelArk console
 *
 *   IMPORTANT — the model ID must match YOUR account/region. In the ModelArk
 *   console open the Seedream image model, click Activate/Enable if shown, and
 *   copy the exact Model ID (or create an inference endpoint and copy its ep-... id).
 *   Then set it here:
 *     export ARK_MODEL="paste-the-id"        # e.g. an "ep-2026..." endpoint id
 *   # optional:
 *   # export ARK_SIZE="2K"    (Seedream 4.x accepts 1K / 2K / 4K or WxH)
 *
 * RUN:
 *   node tools/generate-arcade-icons.mjs
 *   # then review public/images/learn-games/icon-*.webp and:
 *   #   git add public/images/learn-games/icon-*.webp && git commit -m "Arcade game icons"
 */
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const API_KEY = process.env.ARK_API_KEY;
const MODEL = process.env.ARK_MODEL || "seedream-4-0-250828";
const SIZE = process.env.ARK_SIZE || "2K";
const ENDPOINT = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";

if (!API_KEY) {
  console.error('Missing ARK_API_KEY. Run:  export ARK_API_KEY="your-key"  then re-run.');
  process.exit(1);
}

const STYLE = "bold clean 3D cartoon game icon, premium mobile-game art, single centered subject, vibrant colours, soft rim light, smooth dark navy background, high contrast, NO text, no words, no letters, no faces on objects";

const ICONS = [
  { file: "public/images/learn-games/icon-rocket-run.webp", subject: "a sleek rocket ship flying upward, gold body with coral fins and a glowing cyan thruster flame, dynamic motion, outer space" },
  { file: "public/images/learn-games/icon-word-climb.webp", subject: "a curling green magic beanstalk with leafy step-ledges winding upward and a small glowing climber token near the top, whimsical nature" },
  { file: "public/images/learn-games/icon-sound-muncher.webp", subject: "a friendly round glowing muncher creature mid-chomp inside a neon maze corner, teal and cyan reef colours" },
  { file: "public/images/learn-games/icon-word-leap.webp", subject: "a dynamic athletic silhouette leaping over a gap between two stone blocks with motion lines, jungle green and warm amber" },
  { file: "public/images/learn-games/icon-bubble-blaster.webp", subject: "a small launcher cannon aimed upward firing one glowing bubble, deep-sea blue" },
  { file: "public/images/learn-games/icon-star-catcher.webp", subject: "a woven basket catching a falling glowing star with a couple of streaking stars, night indigo sky" }
];

async function generate({ file, subject }) {
  const prompt = `${subject}. ${STYLE}.`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, prompt, size: SIZE, response_format: "url", watermark: false })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} for ${file}: ${body}`);
  }
  const json = await res.json();
  const item = json?.data?.[0] || {};
  let buf;
  if (item.b64_json) {
    buf = Buffer.from(item.b64_json, "base64");
  } else if (item.url) {
    const img = await fetch(item.url);
    buf = Buffer.from(await img.arrayBuffer());
  } else {
    throw new Error(`No image in response for ${file}: ${JSON.stringify(json).slice(0, 300)}`);
  }
  await mkdir(dirname(file), { recursive: true });
  await sharp(buf).resize(512, 512, { fit: "cover" }).webp({ quality: 90 }).toFile(file);
  console.log("✓", file);
}

for (const icon of ICONS) {
  try {
    await generate(icon);
  } catch (err) {
    console.error("✗", icon.file, "-", err.message);
  }
}
console.log("\nDone. Review the icons, then commit just the media:\n  git add public/images/learn-games/icon-*.webp && git commit -m \"Arcade game icons\"");
