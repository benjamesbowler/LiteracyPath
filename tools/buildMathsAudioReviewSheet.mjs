#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mathsLedaAudioManifest, MATHS_LEDA_VOICE } from "../src/maths/media/generated/mathsLedaAudio.generated.js";
import { mathsSongs } from "../src/maths/music/mathsSongs.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, ".artifacts", "maths-release");
const outputPath = path.join(outputDir, "maths-audio-listening-review.html");
const escapeHtml = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const grouped = new Map();
for (const row of mathsLedaAudioManifest) {
  const item = grouped.get(row.publicPath) || { ...row, requestIds: [], ownerIds: [] };
  item.requestIds.push(row.id);
  item.ownerIds.push(row.ownerId);
  grouped.set(row.publicPath, item);
}
const clips = [...grouped.values()].sort((left, right) => (
  left.role.localeCompare(right.role) || left.exactText.localeCompare(right.exactText)
));

const audioUrl = publicPath => `../../public${publicPath}`;
const clipCard = (row, index) => `<article data-role="${escapeHtml(row.role)}">
  <label><input data-review-id="${escapeHtml(row.fingerprint)}" type="checkbox"> <span>Heard and approved</span></label>
  <div><strong>${index + 1}. ${escapeHtml(row.exactText)}</strong><small>${escapeHtml(row.role)} · ${escapeHtml(row.requestIds.join(" · "))}</small></div>
  <audio controls preload="none" src="${escapeHtml(audioUrl(row.publicPath))}"></audio>
</article>`;

const songCard = song => {
  const publicPath = `/audio/music/maths/songs/${song.id}-instrumental.mp3`;
  return `<article data-role="maths_song_instrumental">
    <label><input data-review-id="instrumental:${escapeHtml(song.id)}" type="checkbox"> <span>Instrumental approved</span></label>
    <div><strong>${escapeHtml(song.title)}</strong><small>${song.tempo} BPM · original instrumental bed · adult vocal not produced</small><pre>${escapeHtml(song.lyrics)}</pre></div>
    <audio controls preload="none" src="${escapeHtml(audioUrl(publicPath))}"></audio>
  </article>`;
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Maths audio listening review</title>
<style>body{margin:0;background:#f1f5f2;color:#142038;font:15px/1.45 Inter,system-ui,sans-serif}main{max-width:1050px;margin:auto;padding:40px 24px 90px}header{position:sticky;top:0;z-index:2;margin:0 -24px 28px;padding:20px 24px;background:#f1f5f2ee;border-bottom:1px solid #cbd7d2;backdrop-filter:blur(12px)}h1{margin:0;font-size:36px}header p{max-width:750px;color:#50625d}nav{display:flex;flex-wrap:wrap;gap:10px}button,select{min-height:42px;padding:8px 13px;border:1px solid #9fb2aa;border-radius:9px;background:#fff;font-weight:750}#progress{font-weight:850;color:#176b5c}section{margin:34px 0}article{display:grid;grid-template-columns:170px 1fr 300px;gap:18px;align-items:center;margin:10px 0;padding:16px;border:1px solid #cbd7d2;border-radius:12px;background:#fff}article:has(input:checked){border-color:#1f7969;background:#edf8f4}label{font-weight:800}small{display:block;margin-top:5px;color:#60716c;word-break:break-word}audio{width:100%}pre{white-space:pre-wrap;font:13px/1.45 inherit;color:#455651}@media(max-width:760px){article{grid-template-columns:1fr}audio{max-width:100%}}</style></head>
<body><main><header><p>Foundation Maths media release evidence</p><h1>Audio listening review</h1><p>Listen for exact wording, natural Leda pronunciation, clean starts and ends, no glitches, and classroom-appropriate pace. Technical validation cannot replace this listening pass.</p><nav><strong id="progress">0 / ${clips.length + mathsSongs.length} approved</strong><select id="role"><option value="">All roles</option>${[...new Set(clips.map(row => row.role))].map(role => `<option>${escapeHtml(role)}</option>`).join("")}<option>maths_song_instrumental</option></select><button id="export" type="button">Export review JSON</button><button id="clear" type="button">Clear checks</button></nav></header>
<section><h2>Leda voice · ${escapeHtml(MATHS_LEDA_VOICE)}</h2>${clips.map(clipCard).join("\n")}</section>
<section><h2>Original song instrumentals</h2><p>These are backing tracks plus Leda spoken guides. A natural adult sung vocal remains a separate production gate.</p>${mathsSongs.map(songCard).join("\n")}</section>
</main><script>
const key='lp-maths-audio-review:v1';const boxes=[...document.querySelectorAll('[data-review-id]')];const saved=JSON.parse(localStorage.getItem(key)||'{}');
for(const box of boxes)box.checked=Boolean(saved[box.dataset.reviewId]);
const update=()=>{const state=Object.fromEntries(boxes.map(box=>[box.dataset.reviewId,box.checked]));localStorage.setItem(key,JSON.stringify(state));document.querySelector('#progress').textContent=boxes.filter(box=>box.checked).length+' / '+boxes.length+' approved';};
for(const box of boxes)box.addEventListener('change',update);update();
document.querySelector('#role').addEventListener('change',event=>{for(const row of document.querySelectorAll('article'))row.hidden=Boolean(event.target.value)&&row.dataset.role!==event.target.value;});
document.querySelector('#clear').addEventListener('click',()=>{for(const box of boxes)box.checked=false;update();});
document.querySelector('#export').addEventListener('click',()=>{const approved=boxes.filter(box=>box.checked).map(box=>box.dataset.reviewId);const blob=new Blob([JSON.stringify({schemaVersion:1,voice:'${escapeHtml(MATHS_LEDA_VOICE)}',reviewedAt:new Date().toISOString(),approved,total:boxes.length},null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='maths-audio-listening-review.json';link.click();URL.revokeObjectURL(link.href);});
</script></body></html>`);

console.log(`Maths listening sheet written: ${outputPath} (${clips.length} unique Leda files + ${mathsSongs.length} instrumentals).`);
