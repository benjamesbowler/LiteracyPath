#!/usr/bin/env node
// npm run sheet:quest-art
//
// A double-click-to-open contact sheet of all 33 quest images.
//
// The automated check catches missing alpha and layers that cover the sky. It
// CANNOT tell you whether the art is any good, or whether the model has quietly
// baked a garbled word into a signpost — and it will, given half a chance (this
// is how star-gallery.webp ended up reading "Fanter").
//
// So: every image, big, on both a light and a dark backing so transparency
// problems are obvious, with the stacked parallax layers shown as they will
// actually appear in the game.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/previews/quest-art-contact-sheet.html");
const props = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/image-jobs/quest-props.json"), "utf8"));

const WORLDS = ["meadow", "dino", "moonwood"];
const PAIRS = ["flower-patch", "broken-bridge", "hungry-beast", "echo-cave", "sheep-pens", "word-beast", "signpost", "story-rock"];
const SINGLES = ["guide-meadow", "guide-dino", "guide-moonwood", "sun-drop", "goal-flag"];

// The sheet lives in docs/previews/, so a path has to climb TWO levels to get
// back to the repo root and then down into public/. I got this one level short
// the first time and every image in the sheet was an empty rectangle.
const url = p => path.relative(path.dirname(OUT), path.join(ROOT, p)).replace(/\\/g, "/");
const exists = p => fs.existsSync(path.join(ROOT, p));

// The layers, stacked exactly as the game stacks them.
const stacks = WORLDS.map(w => {
  const layer = n => `public/images/quest/${w}/${n}.webp`;
  const missing = ["sky", "far", "mid", "ground"].filter(n => !exists(layer(n)));
  return `
  <section>
    <h2>${w} — the four layers, stacked as the game stacks them</h2>
    ${missing.length ? `<p class="warn">missing: ${missing.join(", ")}</p>` : ""}
    <div class="stack">
      ${["sky", "far", "mid", "ground"].map(n => exists(layer(n)) ? `<img src="${url(layer(n))}" alt="">` : "").join("")}
    </div>
    <div class="row">
      ${["sky", "far", "mid", "ground"].map(n => exists(layer(n)) ? `
        <figure class="cell check">
          <img src="${url(layer(n))}" alt="">
          <figcaption>${n}</figcaption>
        </figure>` : "").join("")}
    </div>
  </section>`;
});

// Props: before and after, side by side, because the CHANGE is the reward.
const pairs = PAIRS.map(kind => {
  const a = `public/images/quest/props/${kind}.webp`;
  const b = `public/images/quest/props/${kind}-done.webp`;
  if (!exists(a) || !exists(b)) return `<p class="warn">${kind} — missing art</p>`;
  return `
    <figure class="pair">
      <div class="pairimgs">
        <span class="check"><img src="${url(a)}" alt=""><em>waiting</em></span>
        <span class="arrow">&rarr;</span>
        <span class="check"><img src="${url(b)}" alt=""><em>repaired</em></span>
      </div>
      <figcaption>${kind}</figcaption>
    </figure>`;
});

const singles = SINGLES.map(name => {
  const p = `public/images/quest/props/${name}.webp`;
  if (!exists(p)) return `<p class="warn">${name} — missing</p>`;
  return `<figure class="cell check"><img src="${url(p)}" alt=""><figcaption>${name}</figcaption></figure>`;
});

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Sound Seekers — art contact sheet</title>
<style>
body { margin:0; padding:28px; background:#14112a; color:#f2eefb; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
h1 { margin:0 0 6px; }
h2 { margin:34px 0 10px; font-size:13px; letter-spacing:.09em; text-transform:uppercase; opacity:.6; }
.lede { max-width:76ch; margin:0 0 4px; line-height:1.6; opacity:.8; }
.ask { max-width:76ch; margin:16px 0 0; padding:14px 16px; border-left:3px solid #ffd166; border-radius:0 10px 10px 0; background:rgba(255,209,102,.09); line-height:1.6; }
.warn { color:#ffb3b3; }
/* Stacked, as the game draws it. */
.stack { position:relative; height:300px; border-radius:14px; overflow:hidden; background:#0b0918; }
.stack img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:bottom; }
.row { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
/* A chequerboard makes a transparency failure impossible to miss. */
.check { background-image:linear-gradient(45deg,#3a3550 25%,transparent 25%),linear-gradient(-45deg,#3a3550 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a3550 75%),linear-gradient(-45deg,transparent 75%,#3a3550 75%); background-size:18px 18px; background-position:0 0,0 9px,9px -9px,-9px 0; border-radius:12px; }
.cell { display:grid; justify-items:center; gap:6px; margin:0; padding:8px; }
.cell img { width:230px; height:150px; object-fit:contain; }
figcaption { font-size:11px; opacity:.6; }
.pairs { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:16px; }
.pair { margin:0; display:grid; justify-items:center; gap:8px; padding:12px; border:1px solid rgba(255,255,255,.09); border-radius:16px; background:rgba(255,255,255,.04); }
.pairimgs { display:flex; align-items:center; gap:8px; }
.pairimgs span.check { display:grid; justify-items:center; padding:6px; }
.pairimgs img { width:140px; height:140px; object-fit:contain; }
.pairimgs em { font-size:10px; font-style:normal; opacity:.5; }
.arrow { font-size:22px; opacity:.5; }
.grid { display:flex; flex-wrap:wrap; gap:12px; }
</style></head><body>
<h1>Sound Seekers &mdash; the art</h1>
<p class="lede">All 33 generated images. Everything sits on a chequerboard, so anything
that isn&rsquo;t a clean cutout will be glaringly obvious.</p>

<div class="ask"><strong>What I need your eyes for &mdash; I cannot check any of this:</strong><br>
1. <strong>Baked-in text.</strong> The model sneaks garbled letters onto signs and stones. Look hard at the signpost and the story rock.<br>
2. <strong>Duds.</strong> Anything ugly, off-style, or that doesn&rsquo;t read at a glance.<br>
3. <strong>The pairs.</strong> Does the &ldquo;repaired&rdquo; version look like the SAME object, fixed? If the bridge changes shape it will pop rather than mend.<br>
Tell me the filenames and I&rsquo;ll rewrite those prompts and hand you a one-line regenerate.</div>

${stacks.join("\n")}

<h2>The props &mdash; waiting &rarr; repaired. The change IS the reward.</h2>
<div class="pairs">
${pairs.join("\n")}
</div>

<h2>Guides, collectible, goal</h2>
<div class="grid">
${singles.join("\n")}
</div>
</body></html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, "utf8");
console.log(`quest art contact sheet -> ${path.relative(ROOT, OUT)}`);
