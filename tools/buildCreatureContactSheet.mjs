#!/usr/bin/env node
// npm run build:creature-sheet
//
// Renders the creature to a single self-contained HTML file that Benjamin can
// DOUBLE-CLICK OPEN — no terminal, no dev server, no npm.
//
// This exists because the one question Slice 1 is meant to answer — "does a
// layered-vector creature look good enough for a child to love?" — is a question
// only a human eye can answer, and I refuse to answer it myself. The dev-server
// preview (quest-creature-preview.html) is the interactive version; this is the
// zero-setup one.
//
// It shares src/utils/creatureLayout.js with the live renderer, so what you see
// here is exactly what the app will draw. If it drifted, the preview would be
// worthless — you'd be approving art you weren't going to get.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const { layoutCreature, fillFor } = await import(path.join(ROOT, "src/utils/creatureLayout.js"));
const {
  CREATURE_BODIES,
  CREATURE_DYES,
  CREATURE_SLOTS,
  CREATURE_VIEWBOX,
  piecesForSlot,
  defaultCreature
} = await import(path.join(ROOT, "src/data/creatureParts.js"));

// Written to TWO places, on purpose:
//
//   docs/previews/ — where this repo already keeps reviewable HTML (redesign-
//     direction.html, the deck previews). For looking at on the Mac. A generated
//     artifact at the repo ROOT gets flagged by check:repo-hygiene as a stray
//     "root preview HTML file", which is exactly what it would be.
//
//   public/preview/ — so it DEPLOYS with the site and can be opened on an iPad
//     at https://literacy.guide/preview/creature.html . The creature question is
//     "does a child want this on a tablet?", and that cannot be answered on a
//     laptop. It is a static file behind an unlinked URL: nothing in the app
//     links to it, and no child will ever find it.
const OUTPUTS = [
  path.join(ROOT, "docs/previews/creature-contact-sheet.html"),
  path.join(ROOT, "public/preview/creature.html")
];

// Deterministic PRNG: the same sheet every time, so "it looked fine last time"
// is a falsifiable claim.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function randomCreature(rand) {
  const creature = { ...defaultCreature() };
  creature.body = pick(rand, CREATURE_BODIES).id;
  creature.dye = pick(rand, CREATURE_DYES).id;
  for (const slot of CREATURE_SLOTS) {
    if (slot.kind !== "part" || slot.id === "body") continue;
    const options = piecesForSlot(slot.id);
    if (options.length) creature[slot.id] = pick(rand, options).id;
  }
  return creature;
}

function pathTag(p) {
  const isStroke = p.fill === "none" && p.stroke;
  const attrs = [`d="${p.d}"`];
  attrs.push(isStroke ? 'fill="none"' : `fill="${fillFor(p.fill)}"`);
  if (p.stroke) attrs.push(`stroke="${fillFor(p.stroke)}"`, `stroke-width="${p.width || 1}"`, 'stroke-linecap="round"', 'stroke-linejoin="round"');
  if (p.opacity != null) attrs.push(`opacity="${p.opacity}"`);
  return `<path ${attrs.join(" ")}/>`;
}

let uid = 0;
function renderCreature(creature, size, mood = "idle") {
  const layout = layoutCreature(creature);
  const clipId = `clip${uid++}`;
  const style = Object.entries(layout.vars).map(([k, v]) => `${k}:${v}`).join(";");

  const layers = layout.layers.map(layer => {
    const inner = layer.placements.map(pl => {
      const shapes = layer.paths.map(pathTag).join("");
      return pl.transform ? `<g transform="${pl.transform}">${shapes}</g>` : shapes;
    }).join("");
    const clip = layer.clipped ? ` clip-path="url(#${clipId})"` : "";
    return `<g class="cr-${layer.slotId}"${clip}>${inner}</g>`;
  }).join("");

  return `<svg class="cr-figure cr-mood-${mood}" viewBox="0 0 ${CREATURE_VIEWBOX.w} ${CREATURE_VIEWBOX.h}" style="${style};width:${size}px;height:${size}px" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="${clipId}"><path d="${layout.silhouette}"/></clipPath></defs>
    <g class="cr-root">${layers}</g>
  </svg>`;
}

const rand = mulberry32(11);
const wall = Array.from({ length: 36 }, () => randomCreature(rand));

const wallCells = wall.map(c => `<figure class="cell">${renderCreature(c, 132)}<figcaption>${c.body} &middot; ${c.dye}</figcaption></figure>`).join("\n");

// Every body, same parts, so you can check the anchors hold across all six.
const anchorRow = CREATURE_BODIES.map(body => {
  const c = { ...defaultCreature(), body: body.id, dye: "teal", crest: "crest-crown", equipped: { head: "leaf-cap", back: "moth-wings", neck: "vine-scarf", held: "stone-staff" } };
  return `<figure class="cell"><div class="big">${renderCreature(c, 168)}</div><figcaption>${body.label} &mdash; all gear on</figcaption></figure>`;
}).join("\n");

// Every dye on one body, so you can judge the palette as a set.
const dyeRow = CREATURE_DYES.map(dye => {
  const c = { ...defaultCreature(), dye: dye.id, crest: "crest-fin", tail: "tail-fan" };
  return `<figure class="cell"><div class="big">${renderCreature(c, 120)}</div><figcaption>${dye.label}</figcaption></figure>`;
}).join("\n");

const moodRow = ["idle", "walk", "cheer", "think", "sad", "hatch"].map(mood => {
  const c = { ...defaultCreature(), body: "moth", dye: "plum", crest: "crest-antenna", tail: "tail-fern", eyes: "eyes-big" };
  return `<figure class="cell"><div class="big">${renderCreature(c, 150, mood)}</div><figcaption>${mood}</figcaption></figure>`;
}).join("\n");

const css = fs.readFileSync(path.join(ROOT, "src/styles/quest.css"), "utf8");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sound Seekers — creature contact sheet</title>
<style>
${css}

body {
  margin: 0;
  padding: 32px;
  color: #f2eefb;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  background: radial-gradient(120% 90% at 50% 0%, #2b2450 0%, #14102a 55%, #0b0918 100%);
}
h1 { margin: 0 0 6px; font-size: 26px; }
h2 { margin: 34px 0 12px; font-size: 14px; letter-spacing: .1em; text-transform: uppercase; opacity: .55; }
.lede { max-width: 72ch; margin: 0 0 8px; line-height: 1.55; opacity: .8; }
.ask { max-width: 72ch; margin: 14px 0 0; padding: 14px 16px; border-left: 3px solid #ffd166; border-radius: 0 10px 10px 0; background: rgba(255,209,102,.09); line-height: 1.55; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.row { display: flex; flex-wrap: wrap; gap: 12px; }
.cell { display: grid; justify-items: center; gap: 6px; margin: 0; padding: 12px 8px 10px; border: 1px solid rgba(255,255,255,.09); border-radius: 16px; background: rgba(255,255,255,.045); }
.cell .big { display: grid; place-items: center; min-height: 176px; }
figcaption { font-size: 11px; text-align: center; opacity: .6; }
</style>
</head>
<body>
<h1>Sound Seekers &mdash; the creature</h1>
<p class="lede">Every creature below is drawn by the same code the app will run
(<code>src/utils/creatureLayout.js</code>), from ${Object.keys(CREATURE_BODIES).length ? "" : ""}6 body shapes, 12 dyes and ~55 vector parts. Nothing here is a mock-up.</p>

<div class="ask"><strong>The one question this page exists to answer:</strong> does a
layered-vector creature look good enough for a child to love and want to dress up?<br>
If yes, I build the Den, the map and stop 1 on top of it.<br>
If no, we fall back to a pal base with layered accessories &mdash; one slice lost, not the project.</div>

<h2>36 random creatures &mdash; the honest test</h2>
<p class="lede">A child won&rsquo;t build the one I&rsquo;d have hand-picked. This is the real distribution.</p>
<div class="grid">
${wallCells}
</div>

<h2>All six bodies, all four gear slots &mdash; do the anchors hold?</h2>
<p class="lede">Same hat, wings, scarf and staff on every body. If an anchor is wrong, you&rsquo;ll see a hat floating off a head here.</p>
<div class="row">
${anchorRow}
</div>

<h2>All twelve dyes &mdash; judge the palette as a set</h2>
<div class="row">
${dyeRow}
</div>

<h2>Moods (animated &mdash; cheer and hatch play once on load)</h2>
<div class="row">
${moodRow}
</div>
</body>
</html>
`;

for (const out of OUTPUTS) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, "utf8");
  console.log(`creature contact sheet -> ${path.relative(ROOT, out)}`);
}
console.log(`  ${wall.length} random + ${CREATURE_BODIES.length} bodies + ${CREATURE_DYES.length} dyes + 6 moods`);
console.log("  on the iPad after a deploy: https://literacy.guide/preview/creature.html");
