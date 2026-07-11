/**
 * Regenerates the banned assessment images (rainbow / faces-on-objects /
 * glow-sticker style) IN PLACE - same path, clean art, so every question
 * that references them keeps working with zero data changes.
 * Audit record: docs/SEEDREAM_IMAGE_REQUESTS_assessment_cleanup_2026-07-10.md
 *
 * RUN:  node tools/regenerate-banned-assessment-images.mjs
 *       (ARK_MODEL=seedream-4-5-251128 to use 4.5 - sizes handled)
 * Re-run to retry failures; ONLY=<word> to redo one.
 */
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

async function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    try {
      for (const line of (await readFile(f, "utf8")).split("\n")) {
        const m = line.match(/^\s*(ARK_API_KEY|ARK_MODEL|OPENAI_API_KEY)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch { /* keep looking */ }
  }
}
await loadEnv();
// Two interchangeable backends (Seedream quota ran out mid-project):
//   default            -> BytePlus Seedream (ARK_API_KEY)
//   BACKEND=openai     -> OpenAI images (OPENAI_API_KEY), model gpt-image-1
//                         (IMAGE_MODEL=dall-e-3 if your org can't use gpt-image-1)
const BACKEND = process.env.BACKEND || "ark";
const ONLY = process.env.ONLY || "";
const ARK_KEY = process.env.ARK_API_KEY;
const ARK_MODEL = process.env.ARK_MODEL || "seedream-4-0-250828";
const ARK_SIZE = /4-5/.test(ARK_MODEL) ? "2048x2048" : "1024x1024";
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
if (BACKEND === "ark" && !ARK_KEY) { console.error("Missing ARK_API_KEY (or run with BACKEND=openai)"); process.exit(1); }
if (BACKEND === "openai" && !OPENAI_KEY) { console.error("Missing OPENAI_API_KEY in .env"); process.exit(1); }

async function generate(prompt) {
  if (BACKEND === "openai") {
    const body = { model: OPENAI_MODEL, prompt, size: "1024x1024", n: 1 };
    if (OPENAI_MODEL === "gpt-image-1") body.quality = "medium";
    else body.response_format = "b64_json"; // dall-e-3
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const item = (await res.json())?.data?.[0] || {};
    if (item.b64_json) return Buffer.from(item.b64_json, "base64");
    if (item.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer());
    throw new Error("no image in OpenAI response");
  }
  const res = await fetch("https://ark.ap-southeast.bytepluses.com/api/v3/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ARK_KEY}` },
    body: JSON.stringify({ model: ARK_MODEL, prompt, size: ARK_SIZE, response_format: "url", watermark: false })
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const item = (await res.json())?.data?.[0] || {};
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");
  return Buffer.from(await (await fetch(item.url)).arrayBuffer());
}

const STYLE = "Realistic-cartoon storybook illustration for a children's reading app, soft warm watercolor style, clean gentle outlines, plain very light warm cream background.";
const RULES = "STRICT: no face, eyes, or smile on any object; no rainbow colours; no sparkles; no glow or aura; not babyish. Exactly one clear subject. No text, no letters, no watermark, no border.";

const TASKS = [
  { path: "/images/child-mode/initial-sounds/moon.png", word: "moon", subject: "a crescent moon in a calm starry night sky above rolling hills" },
  { path: "/images/assessment/long-vowels/moon.webp", word: "moon-vocab", subject: "a crescent moon in a calm starry night sky above rolling hills" },
  { path: "/images/assessment/language/variants/homophones-homonyms/hi-high-01.webp", word: "hi-high", subject: "a split scene: on the left a child waves hello to a friend; on the right a kite flies high above a hill" },
  { path: "/images/child-mode/blends/star.png", word: "star", subject: "a star" },
  { path: "/images/child-mode/cvc/bad.png", word: "bad", subject: "a muddy puppy sitting beside a knocked-over flowerpot, looking guilty" },
  { path: "/images/child-mode/cvc/cap.png", word: "cap", subject: "a cap" },
  { path: "/images/child-mode/cvc/dot.png", word: "dot", subject: "a dot" },
  { path: "/images/child-mode/initial-sounds/bear.png", word: "bear", subject: "a bear" },
  { path: "/images/child-mode/initial-sounds/box.png", word: "box", subject: "a box" },
  { path: "/images/child-mode/initial-sounds/bus.png", word: "bus", subject: "a bus" },
  { path: "/images/child-mode/initial-sounds/coat.png", word: "coat", subject: "a coat" },
  { path: "/images/child-mode/initial-sounds/fox.png", word: "fox", subject: "a fox" },
  { path: "/images/child-mode/initial-sounds/ham.png", word: "ham", subject: "a ham" },
  { path: "/images/child-mode/initial-sounds/hot.png", word: "hot", subject: "a steaming mug of cocoa on a wooden table, wisps of steam rising" },
  { path: "/images/child-mode/initial-sounds/jam.png", word: "jam", subject: "a jam" },
  { path: "/images/child-mode/initial-sounds/key.png", word: "key", subject: "a key" },
  { path: "/images/child-mode/initial-sounds/leg.png", word: "leg", subject: "a child's leg wearing a sock and shoe, mid-step on a path" },
  { path: "/images/child-mode/initial-sounds/pen.png", word: "pen", subject: "a pen" },
  { path: "/images/child-mode/initial-sounds/pig.png", word: "pig", subject: "a pig" },
  { path: "/images/child-mode/initial-sounds/red.png", word: "red", subject: "a red" },
  { path: "/images/child-mode/initial-sounds/sit.png", word: "sit", subject: "a sit" },
  { path: "/images/child-mode/initial-sounds/star.png", word: "star", subject: "a star" },
  { path: "/images/child-mode/initial-sounds/thin.png", word: "thin", subject: "a thin" },
  { path: "/images/child-mode/initial-sounds/umbrella.png", word: "umbrella", subject: "a umbrella" },
  { path: "/images/child-mode/minimal-pairs/cut.png", word: "cut", subject: "a cut" },
  { path: "/images/child-mode/plurals/brushes.png", word: "brushes", subject: "a brushes" },
  { path: "/images/child-mode/plurals/dishes.png", word: "dishes", subject: "a dishes" },
  { path: "/images/child-mode/r-controlled/bird.png", word: "bird", subject: "a bird" },
  { path: "/images/child-mode/r-controlled/corn.png", word: "corn", subject: "a corn" },
  { path: "/images/child-mode/short-a/ham.png", word: "ham", subject: "a ham" },
  { path: "/images/child-mode/short-e/net.png", word: "net", subject: "a net" },
  { path: "/images/child-mode/short-e/pen.png", word: "pen", subject: "a pen" },
  { path: "/images/child-mode/short-e/red.png", word: "red", subject: "a red" },
  { path: "/images/child-mode/short-i/zip.png", word: "zip", subject: "a zip" },
  { path: "/images/child-mode/short-o/mop.png", word: "mop", subject: "a mop" },
  { path: "/images/child-mode/short-u/bus.png", word: "bus", subject: "a bus" },
  { path: "/images/child-mode/short-u/mud.png", word: "mud", subject: "a puddle of brown mud on a garden path after rain" },
  { path: "/images/child-mode/vowel-teams/bee.png", word: "bee", subject: "a bee" },
  { path: "/images/vocabulary/umbrella.png", word: "umbrella", subject: "a umbrella" },
  { path: "/media/initial-sounds/images/a/astronaut.webp", word: "astronaut", subject: "a astronaut" },
  { path: "/media/initial-sounds/images/b/butterfly.webp", word: "butterfly", subject: "a butterfly" },
  { path: "/media/initial-sounds/images/c/cow.webp", word: "cow", subject: "a cow" },
  { path: "/media/initial-sounds/images/d/doll.webp", word: "doll", subject: "a doll" },
  { path: "/media/initial-sounds/images/g/goalpost.webp", word: "goalpost", subject: "a goalpost" },
  { path: "/media/initial-sounds/images/j/jar.webp", word: "jar", subject: "a jar" },
  { path: "/media/initial-sounds/images/k/kitten.webp", word: "kitten", subject: "a kitten" },
  { path: "/media/initial-sounds/images/n/nail.webp", word: "nail", subject: "a nail" },
  { path: "/media/initial-sounds/images/p/paintbrush.webp", word: "paintbrush", subject: "a paintbrush" },
  { path: "/media/initial-sounds/images/p/pencil.webp", word: "pencil", subject: "a pencil" },
  { path: "/media/initial-sounds/images/r/raccoon.webp", word: "raccoon", subject: "a raccoon" },
  { path: "/media/initial-sounds/images/r/rainbow.webp", word: "rainbow", subject: "a rainbow" },
  { path: "/media/initial-sounds/images/v/vine.webp", word: "vine", subject: "a vine" },
  { path: "/media/initial-sounds/images/y/yellow.webp", word: "yellow", subject: "a yellow" },
  { path: "/media/learn/images/cycle-23/bang.png", word: "bang", subject: "a bang" },
  { path: "/media/learn/images/cycle-23/gong.png", word: "gong", subject: "a gong" },
  { path: "/media/learn/images/cycle-23/hang.png", word: "hang", subject: "a hang" },
  { path: "/media/learn/images/cycle-23/rang.png", word: "rang", subject: "a rang" },
  { path: "/media/learn/images/cycle-23/song.png", word: "song", subject: "a song" },
  { path: "/media/rhyming/images/sad.webp", word: "sad", subject: "a child sitting on a step with slumped shoulders on a rainy day, seen from the side" },
  { path: "/media/vocabulary/images/adjective-purple.webp", word: "adjective-purple", subject: "a adjective-purple" },
  { path: "/media/vocabulary/images/adjective-rough.webp", word: "adjective-rough", subject: "a adjective-rough" },
  { path: "/media/vocabulary/images/adjective-shiny.webp", word: "adjective-shiny", subject: "a adjective-shiny" },
  { path: "/media/vocabulary/images/adjective-smooth.webp", word: "adjective-smooth", subject: "a adjective-smooth" },
  { path: "/media/vocabulary/images/adjective-warm.webp", word: "adjective-warm", subject: "a adjective-warm" },
  { path: "/media/vocabulary/images/bead.webp", word: "bead", subject: "a bead" },
  { path: "/media/vocabulary/images/bright.webp", word: "bright", subject: "a bright" },
  { path: "/media/vocabulary/images/verb-melt.webp", word: "verb-melt", subject: "a verb-melt" }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
let done = 0; const failed = [];
const tasks = ONLY ? TASKS.filter(t => t.word === ONLY) : TASKS;
console.log(`${BACKEND === "openai" ? `OpenAI (${OPENAI_MODEL})` : `Seedream (${ARK_MODEL})`} - regenerating ${tasks.length} banned assessment images IN PLACE.`);
for (const t of tasks) {
  try {
    const prompt = `${STYLE} Subject: ${t.subject}. ${RULES}`;
    const raw = await generate(prompt);
    const out = "public" + t.path;
    const img = sharp(raw).resize(1024, 1024, { fit: "cover" });
    await writeFile(out, t.path.endsWith(".png") ? await img.png().toBuffer() : await img.webp({ quality: 90 }).toBuffer());
    done += 1; console.log(`+ ${t.word}  ${t.path}`);
    await sleep(400);
  } catch (err) {
    failed.push(t.word); console.error(`x ${t.word}: ${err.message}`);
  }
}
console.log(`\nDone. ${done} regenerated, ${failed.length} failed${failed.length ? ` (${failed.join(", ")}) - re-run to retry` : ""}.`);
process.exit(failed.length ? 1 : 0);
