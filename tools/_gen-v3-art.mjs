#!/usr/bin/env node
// Sound Seekers v3 "Story Trail" art generation — runs on Ben's Mac (needs OPENAI_API_KEY in LiteracyPath/.env).
// Usage: node gen-v3-art.mjs [--only name,name] [--force]
// Writes PNGs to /Users/benjaminbowler/Projects/tmp/ss-v3-art/<name>.png and a log next to them.
import fs from "node:fs";
import path from "node:path";
import OpenAI, { toFile } from "openai";

const ROOT = "/Users/benjaminbowler/Projects/LiteracyPath";
const OUT = "/Users/benjaminbowler/Projects/tmp/ss-v3-art";
const CAST_BANK = "/Users/benjaminbowler/Projects/Little-Literacy-Animation-Studio-in-use/reference-library/Legacy-Meadow-Pals-Cartoon-Engine/bible/meadow-pals-full-cast-production-bank-v0.1.0.png";
const COVERS = `${ROOT}/public/guided-reading/series`;
fs.mkdirSync(OUT, { recursive: true });

function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = /^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$/m.exec(env);
  if (!m) throw new Error("OPENAI_API_KEY not found");
  return m[1].replace(/^["']|["']$/g, "");
}
const client = new OpenAI({ apiKey: loadKey() });
const args = process.argv.slice(2);
const only = (args.includes("--only") ? args[args.indexOf("--only") + 1] : "").split(",").filter(Boolean);
const force = args.includes("--force");
const log = msg => { const line = `[${new Date().toISOString()}] ${msg}`; console.log(line); fs.appendFileSync(path.join(OUT, "gen.log"), line + "\n"); };

const STYLE = "Art style: clean children's storybook cartoon exactly like a modern picture book for 5-year-olds — bold dark-brown ink outlines, flat bright friendly colours with simple soft cel shading, rounded chunky shapes, warm sunlight. Absolutely no text, no letters, no words, no numbers, no logos, no watermark, no frame or border.";
const MAP_RULES = "Top-down slightly tilted (three-quarter) storybook map view like a board-game world map. ONE single winding dirt path, wide and clearly visible, entering at the exact middle of the LEFT edge and leaving at the exact middle of the RIGHT edge, wandering up and down through the whole scene. No characters, no people, no animals. No map pins, no circles, no icons, no signs with writing. Landmarks are drawn as real places in the scenery. Fill the whole canvas edge to edge.";
const BACKDROP_RULES = "Side-view scene for a 2D platform game background. Horizon in the lower third. The bottom 22% of the image is a plain, uncluttered flat ground band (simple grass or earth, no objects) so platforms can be drawn over it. Nothing important in the lower third. Soft depth: far hills paler, near bushes stronger. No characters, no animals, no people. No text.";

const JOBS = {
  // ---- world map panels (stitched left→right into one long corridor world) ----
  "map-meadow": { size: "1536x1024", prompt: `${MAP_RULES} Sunny Meadow Farm in high summer: bright green meadows, a red wooden barn with a silo, white fences, haystacks, sunflowers, a blue stream. Along the path in this order from left to right: a huge hollow oak tree with a dark doorway; mossy stone steps climbing through ferns; a ring of grey standing stones; a shallow river ford with stepping stones and an otter slide; a thorny bramble hedge with a wooden gate; a beehive on a grassy bluff; a pond with lily pads and a little raft ferry; a round fish pool with a wooden jetty; a wooden water-mill wheelhouse at a bend in the stream; and finally a small waterfall weir with musical ripples. ${STYLE}` },
  "map-dino": { size: "1536x1024", prompt: `${MAP_RULES} Sunny Hollow, a friendly prehistoric dinosaur valley: warm orange sandstone, a gentle smoking volcano far away, palm ferns, glowing amber. Along the path in this order from left to right: an amber-coloured rocky ridge; a valley of big white dinosaur bones forming arches; flat grey ash flats with fossil footprints; a deep green fern canyon; a narrow mountain pass shaped like a claw; a big gate made of brass cogs and gears; a wooden ore hopper cart on rails; a stone foundry with a chimney; a little railway yard with lanterns; and finally a great glowing forge under a rock arch. ${STYLE}` },
  "map-moonwood-a": { size: "1536x1024", prompt: `${MAP_RULES} Moonwood, an enchanted twilight forest at dusk: deep blue-green trees, glowing mushrooms, lanterns hanging in branches, a shining river. Along the path in this order from left to right: a reed-lined landing stage with glowing reeds; a perfectly round ripple pool; sparkling mica stone steps; a glinting causeway of glass stones across water; a misty mirror-flat fen; a windy cliff path over the sea; a sheltered cove full of shells; a wooden signal tower with a lamp; a stormy glass-green cove with dark clouds; and finally a tall lighthouse on a headland with a warm beam. ${STYLE}` },
  "map-moonwood-b": { size: "1536x1024", prompt: `${MAP_RULES} Deep Moonwood at night under stars: giant lantern-trees, root bridges, purple sky, comets and constellations, warm golden lights. Along the path in this order from left to right: a gate made of glowing moths; a hollow of huge echoing tree roots; a wispy woodland turn with floating lights; a round hollow with rings like a planet's orbit; a sleeping domed observatory on a hill; a stair of stone steps rising towards a comet; a library-like archive built into an old tree; a causeway at dawn with pink light; a floating sky-bridge of light; and finally a great shining star resting on a hilltop at the far right. ${STYLE}` },

  // ---- platform-area backdrops ----
  "bg-meadow-farm": { size: "1536x1024", prompt: `${BACKDROP_RULES} Sunny Meadow Farm: rolling green hills, a red barn with a silo in the middle distance, white fence, haystacks, a big oak, fluffy clouds, morning sun. ${STYLE}` },
  "bg-meadow-pond": { size: "1536x1024", prompt: `${BACKDROP_RULES} Sunny Meadow pond side: reeds, lily pads on blue water in the middle distance, a wooden water-mill wheelhouse, willow trees, dragonflies, afternoon sun. ${STYLE}` },
  "bg-dino-valley": { size: "1536x1024", prompt: `${BACKDROP_RULES} Sunny Hollow dinosaur valley: warm orange sandstone cliffs, white bone arches, palm ferns, a distant smoking volcano, amber glow. ${STYLE}` },
  "bg-dino-forge": { size: "1536x1024", prompt: `${BACKDROP_RULES} Dino Land forge and railway: brass cogs and gears built into rock, a stone foundry chimney with gentle orange glow, lanterns, rails on a wooden trestle in the distance, dusk sky. ${STYLE}` },
  "bg-moonwood-dusk": { size: "1536x1024", prompt: `${BACKDROP_RULES} Moonwood at dusk: tall blue-green trees, glowing mushrooms, hanging lanterns, a shining river in the middle distance, fireflies, purple-pink sky. ${STYLE}` },
  "bg-moonwood-night": { size: "1536x1024", prompt: `${BACKDROP_RULES} Deep Moonwood at night: giant lantern-trees with warm golden windows, root bridges, a starry indigo sky with a comet, soft moonlight. ${STYLE}` },

  // ---- casts (image edit with the Meadow Pals bank as style reference) ----
  "cast-dino-a": { size: "1536x1024", refs: [CAST_BANK, `${COVERS}/dino-pals/book-01/cover.webp`, `${COVERS}/dino-pals/book-02/cover.webp`], prompt: `Draw a character line-up in EXACTLY the same art style, line weight, proportions, flat cream background and layout as reference image 1 (the animal line-up): eight friendly young dinosaur characters standing in a row, front-facing, feet on one ground line, evenly spaced, each fully visible with clear gaps between them, no overlapping. From left to right: Chompy, an orange young T-rex with a white neckerchief; Sunny, a yellow-orange triceratops wearing a leaf cape; Dozy, a lavender-purple stegosaur holding a small blue pillow; Grumpy, a low grey ankylosaur with tan plates and a club tail; Bossy, a teal pterodactyl with pink wing membranes; Wiggly, a pale-blue diplodocus with darker blue oval spots; Zippy, a red-and-yellow velociraptor wearing a rainbow scarf; Honky, a coral parasaurolophus with a big rainbow crest. Plain flat cream background, no shadows on the ground, no text, no labels, no names.` },
  "cast-dino-b": { size: "1536x1024", refs: [CAST_BANK, `${COVERS}/dino-pals/book-01/cover.webp`], prompt: `Draw a character line-up in EXACTLY the same art style, line weight, proportions, flat cream background and layout as reference image 1 (the animal line-up): seven friendly young dinosaur characters standing in a row, front-facing, feet on one ground line, evenly spaced, each fully visible with clear gaps, no overlapping. From left to right: Cheeky, a purple oviraptor with orange spots; Shy, a mint-green long-necked dinosaur with teal spots; Fancy, a lavender stegosaur with leaf-shaped back plates and a flower; Clumsy, a tall sky-blue long-necked dinosaur; Flappy, a small feathered orange-brown dinosaur with tan and blue wing tips; Sneezy, a yellow-green parasaurolophus with one backward-curving green crest; Bouncy, a lime-green dome-headed dinosaur whose two feet each stand on a silver coil spring. Plain flat cream background, no shadows, no text, no labels, no names.` },
  "cast-moonwood": { size: "1536x1024", refs: [CAST_BANK, `${COVERS}/moonwood-tales/book-03/cover.webp`, `${COVERS}/moonwood-tales/book-04/cover.webp`], prompt: `Draw a character line-up in EXACTLY the same art style, line weight, proportions, flat cream background and layout as reference image 1 (the animal line-up): nine friendly enchanted-forest characters standing in a row, front-facing, feet on one ground line, evenly spaced, each fully visible with clear gaps, no overlapping. From left to right: Pip, a small woodland boy with short brown hair, pointed ears and green tunic; Wren, a small dark-haired girl witch in a blue-purple pointed hat; Flint, a red-haired boy in brown explorer clothes holding a lantern; Spark, a junior wizard with red hair and freckles in a red-and-gold robe holding an oversized wand; Burrow, a brown mole with round glasses; Luna, a small owl with a cream face and brown-grey feathers; Fern, a tall green fern plant sprite with a leafy head; Glimmer, a young dragon with purple-blue scales, gold highlights and teal eyes; Stone, a very large gentle grey stone giant, much taller than everyone. Plain flat cream background, no shadows, no text, no labels, no names.` },

  // ---- heroes: side-view walking pose, transparent background ----
  "hero-speedy": { size: "1024x1024", refs: [CAST_BANK], background: "transparent", prompt: `In EXACTLY the same art style and line weight as the reference line-up, draw Speedy the black-and-white border collie puppy (the dog in the reference) as a game hero: full body, SIDE VIEW facing RIGHT, mid-stride happy walking pose, wearing a small red explorer satchel across the body, tail up, big friendly eyes. Centered, large, feet near the bottom. Transparent background, no ground, no shadow, no text.` },
  "hero-chompy": { size: "1024x1024", refs: [CAST_BANK, `${COVERS}/dino-pals/book-01/cover.webp`], background: "transparent", prompt: `In EXACTLY the same art style and line weight as reference image 1 (the animal line-up), draw Chompy, an orange young T-rex with a white neckerchief (see reference image 2), as a game hero: full body, SIDE VIEW facing RIGHT, mid-stride happy walking pose, wearing a small green explorer satchel, big friendly eyes. Centered, large, feet near the bottom. Transparent background, no ground, no shadow, no text.` },
  "hero-pip": { size: "1024x1024", refs: [CAST_BANK, `${COVERS}/moonwood-tales/book-03/cover.webp`], background: "transparent", prompt: `In EXACTLY the same art style and line weight as reference image 1 (the animal line-up), draw Pip, a small woodland boy with short brown hair, pointed ears and a green tunic, as a game hero: full body, SIDE VIEW facing RIGHT, mid-stride happy walking pose, carrying a small lantern on a stick over his shoulder, big friendly eyes. Centered, large, feet near the bottom. Transparent background, no ground, no shadow, no text.` }
};

async function run(name, job) {
  const outPath = path.join(OUT, `${name}.png`);
  if (fs.existsSync(outPath) && !force) { log(`↷ ${name} exists, skipping`); return; }
  log(`… ${name} generating (${job.size}${job.refs ? `, ${job.refs.length} refs` : ""})`);
  const t0 = Date.now();
  try {
    let b64;
    if (job.refs) {
      const images = await Promise.all(job.refs.map(async p => toFile(fs.createReadStream(p), path.basename(p).replace(/\.webp$/, ".webp"), { type: p.endsWith(".png") ? "image/png" : "image/webp" })));
      const res = await client.images.edit({ model: "gpt-image-1", image: images, prompt: job.prompt, size: job.size, quality: "high", ...(job.background ? { background: job.background } : {}) });
      b64 = res.data[0].b64_json;
    } else {
      const res = await client.images.generate({ model: "gpt-image-1", prompt: job.prompt, size: job.size, quality: "high", n: 1 });
      b64 = res.data[0].b64_json;
    }
    fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
    log(`✓ ${name} ${(fs.statSync(outPath).size / 1024).toFixed(0)} KB in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  } catch (err) {
    log(`✗ ${name} FAILED: ${String(err?.message || err).slice(0, 400)}`);
  }
}

for (const [name, job] of Object.entries(JOBS)) {
  if (only.length && !only.includes(name)) continue;
  await run(name, job);
}
log("done");
