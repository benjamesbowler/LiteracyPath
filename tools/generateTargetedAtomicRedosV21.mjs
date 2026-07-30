import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { renameSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v21-targeted-atomic-redos"
);
const rawDirectory = path.join(outputDirectory, "raw");
const audioDirectory = path.join(outputDirectory, "audio");
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const targetMeanDb = -27.0;

const targets = Object.freeze([
  {
    key: "it", displayText: "it — full word", ipa: "ɪt", cue: "it",
    anchor: "it", text: "it", edit: { mode: "full" },
    method: "Full natural Leda word; final T deliberately retained"
  },
  {
    key: "a", displayText: "a — “ah”", ipa: "æ", cue: "ah",
    anchor: "Africa", text: "Africa", edit: { mode: "prefix", seconds: 0.19 },
    method: "Initial vowel cut from Leda saying “Africa”"
  },
  {
    key: "e", displayText: "e — “eh”", ipa: "ɛ", cue: "eh",
    anchor: "elephant", text: "elephant", edit: { mode: "prefix", seconds: 0.17 },
    method: "Initial vowel cut from Leda saying “elephant”"
  },
  {
    key: "o", displayText: "o — short “oh”", ipa: "ɑ", cue: "oh",
    anchor: "octopus", text: "octopus", edit: { mode: "prefix", seconds: 0.18 },
    method: "Initial vowel cut from Leda saying “octopus”"
  },
  {
    key: "s", displayText: "s — pure snake sound", ipa: "s", cue: "sss",
    anchor: "snake", text: "snake", edit: { mode: "prefix", seconds: 0.16 },
    method: "Initial hiss cut from Leda saying “snake”; no support vowel"
  },
  {
    key: "ll", displayText: "ll — pure ending L", ipa: "l", cue: "lll",
    anchor: "dull", text: "dull", edit: { mode: "suffix", seconds: 0.16 },
    method: "Final L cut from Leda saying “dull”; preceding vowel removed"
  },
  {
    key: "ng", displayText: "ng — pure ending sound", ipa: "ŋ", cue: "ng",
    anchor: "sing", text: "sing", edit: { mode: "suffix", seconds: 0.20 },
    method: "Final /ŋ/ cut from Leda saying “sing”"
  },
  {
    key: "nk", displayText: "nk — pure ending blend", ipa: "ŋk", cue: "nk",
    anchor: "sink", text: "sink", edit: { mode: "suffix", seconds: 0.25 },
    method: "Final /ŋk/ cut from Leda saying “sink”"
  },
  {
    key: "ss", displayText: "ss — pure snake sound", ipa: "s", cue: "sss",
    anchor: "hiss", text: "hiss", edit: { mode: "suffix", seconds: 0.20 },
    method: "Final hiss cut from Leda saying “hiss”; no support vowel"
  },
  {
    key: "th", displayText: "th — unvoiced wind sound", ipa: "θ", cue: "th",
    anchor: "thin", text: "thin", edit: { mode: "prefix", seconds: 0.16 },
    method: "Initial unvoiced /θ/ cut from Leda saying “thin”"
  },
  {
    key: "zz", displayText: "zz — pure bumblebee sound", ipa: "z", cue: "zzz",
    anchor: "buzz", text: "buzz", edit: { mode: "suffix", seconds: 0.22 },
    method: "Final buzz cut from Leda saying “buzz”; no support vowel"
  },
  {
    key: "b", displayText: "b — “buh”", ipa: "bʌ", cue: "buh",
    anchor: "bat", text: "buh", edit: { mode: "full" },
    method: "Plain-text Leda cue instead of direct IPA"
  },
  {
    key: "j", displayText: "j — “juh”", ipa: "dʒʌ", cue: "juh",
    anchor: "jam", text: "juh", edit: { mode: "full" },
    method: "Plain-text Leda cue instead of direct IPA"
  },
  {
    key: "r", displayText: "r — “ruh”", ipa: "ɹʌ", cue: "ruh",
    anchor: "run", text: "ruh", edit: { mode: "full" },
    method: "Plain-text Leda cue instead of direct IPA"
  },
  {
    key: "t", displayText: "t — “tuh”", ipa: "tʌ", cue: "tuh",
    anchor: "tap", text: "tuh", edit: { mode: "full" },
    method: "Plain-text Leda cue instead of direct IPA"
  },
  {
    key: "y", displayText: "y — “yuh”", ipa: "jʌ", cue: "yuh",
    anchor: "yak", text: "yuh", edit: { mode: "full" },
    method: "Plain-text Leda cue instead of direct IPA"
  },
  {
    key: "z", displayText: "z — clear buzzing sound", ipa: "z", cue: "zzz",
    anchor: "zebra", text: "zebra", edit: { mode: "prefix", seconds: 0.18 },
    method: "Initial buzz cut from Leda saying “zebra”; no letter name"
  },
  {
    key: "ch", displayText: "ch — “chuh”", ipa: "tʃʌ", cue: "chuh",
    anchor: "chip", text: "chuh", edit: { mode: "full" },
    method: "Plain-text Leda cue instead of direct IPA"
  },
  {
    key: "ong", displayText: "ong — as in song", ipa: "ɑŋ", cue: "ong",
    anchor: "song", text: "song", edit: { mode: "suffix", seconds: 0.45 },
    method: "Natural ending cut from Leda saying “song”"
  },
  {
    key: "sh", displayText: "sh — “shuh”", ipa: "ʃʌ", cue: "shuh",
    anchor: "ship", text: "shuh", edit: { mode: "full" },
    method: "Plain-text Leda cue instead of direct IPA"
  }
]);

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${String(result.stderr || result.stdout).slice(-1600)}`);
  }
  return { stdout: String(result.stdout || ""), stderr: String(result.stderr || "") };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function analyzeVolume(filePath) {
  const { stderr } = run(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", filePath, "-af", "volumedetect", "-f", "null", "-"],
    `Average-level analysis for ${filePath}`
  );
  const mean = stderr.match(/mean_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/u);
  const max = stderr.match(/max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/u);
  if (!mean || !max) throw new Error(`Could not read volume for ${filePath}.`);
  return { meanVolumeDb: Number(mean[1]), maxVolumeDb: Number(max[1]) };
}

function probe(filePath) {
  const { stdout } = run(
    "ffprobe",
    [
      "-v", "error", "-select_streams", "a:0",
      "-show_entries", "stream=sample_rate,channels:format=duration,size",
      "-of", "json", filePath
    ],
    `Audio probe for ${filePath}`
  );
  const parsed = JSON.parse(stdout);
  return {
    sampleRate: Number(parsed.streams?.[0]?.sample_rate),
    channels: Number(parsed.streams?.[0]?.channels),
    durationSeconds: Number(parsed.format?.duration),
    bytes: Number(parsed.format?.size)
  };
}

async function synthesize(accessToken, target, rawPath) {
  try {
    if ((await stat(rawPath)).size > 0) return;
  } catch {
    // Generate the missing raw take.
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text: target.text },
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
    })
  });
  if (!response.ok) {
    throw new Error(`${target.key} failed with ${response.status}: ${(await response.text()).slice(0, 1000)}`);
  }
  const result = await response.json();
  await writeFile(rawPath, Buffer.from(result.audioContent, "base64"));
}

function editAndNormalize(sourcePath, outputPath, edit) {
  const contentPath = outputPath.replace(/\.mp3$/u, ".content.wav");
  const cutPath = outputPath.replace(/\.mp3$/u, ".cut.wav");
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", sourcePath,
      "-af",
      [
        "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB",
        "areverse",
        "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB",
        "areverse",
        "aresample=24000",
        "aformat=sample_fmts=fltp:channel_layouts=mono"
      ].join(","),
      "-ar", "24000", "-ac", "1", "-codec:a", "pcm_s16le", contentPath
    ],
    `Silence trim for ${sourcePath}`
  );
  const contentDuration = probe(contentPath).durationSeconds;
  let cutFilter = "anull";
  if (edit.mode === "prefix") {
    cutFilter = `atrim=start=0:end=${Math.min(edit.seconds, contentDuration).toFixed(4)},asetpts=PTS-STARTPTS`;
  } else if (edit.mode === "suffix") {
    cutFilter = `atrim=start=${Math.max(0, contentDuration - edit.seconds).toFixed(4)}:end=${contentDuration.toFixed(4)},asetpts=PTS-STARTPTS`;
  }
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", contentPath,
      "-af",
      [
        cutFilter,
        "afade=t=in:st=0:d=0.004",
        "adelay=55",
        "apad=whole_dur=0.72",
        "aresample=24000",
        "aformat=sample_fmts=fltp:channel_layouts=mono"
      ].join(","),
      "-ar", "24000", "-ac", "1", "-codec:a", "pcm_s16le", cutPath
    ],
    `Target cut for ${sourcePath}`
  );
  const initial = analyzeVolume(cutPath);
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", cutPath,
      "-af", `volume=${(targetMeanDb - initial.meanVolumeDb).toFixed(3)}dB`,
      "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k",
      outputPath
    ],
    `Level match for ${sourcePath}`
  );
  let final = analyzeVolume(outputPath);
  for (let attempt = 0; attempt < 3 && Math.abs(final.meanVolumeDb - targetMeanDb) > 0.1; attempt += 1) {
    const corrected = outputPath.replace(/\.mp3$/u, ".corrected.mp3");
    run(
      "ffmpeg",
      [
        "-y", "-hide_banner", "-nostats", "-i", outputPath,
        "-af", `volume=${(targetMeanDb - final.meanVolumeDb).toFixed(3)}dB`,
        "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k",
        corrected
      ],
      `Level correction for ${sourcePath}`
    );
    renameSync(corrected, outputPath);
    final = analyzeVolume(outputPath);
  }
  return { contentDuration, ...final };
}

function reviewHtml(records) {
  const embedded = JSON.stringify(records).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Targeted atomic redos V21</title>
<style>
:root{--navy:#17324d;--ink:#233142;--muted:#617184;--line:#d7e0e8;--bg:#f5f7fa;--yes:#16794a;--maybe:#9a6600;--edit:#6f4aa8;--no:#aa2d38;--blue:#266a9f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,sans-serif}header{position:sticky;top:0;z-index:3;padding:18px clamp(18px,4vw,56px);border-bottom:1px solid var(--line);background:rgba(255,255,255,.97)}.head{display:flex;justify-content:space-between;gap:20px;align-items:center;max-width:1260px;margin:auto}h1{margin:0;color:var(--navy)}.subtitle{margin:5px 0 0;color:var(--muted)}.progress{font-weight:750;text-align:right}.track{height:8px;margin-top:7px;border-radius:10px;background:#e7edf2;overflow:hidden}.fill{height:100%;width:0;background:var(--blue)}.toolbar{display:flex;flex-wrap:wrap;gap:9px;max-width:1260px;margin:14px auto 0}.toolbar button,.toolbar select{min-height:40px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:#fff;font:inherit;font-weight:700}.toolbar .primary{background:var(--navy);color:#fff}main{max-width:1260px;margin:auto;padding:26px clamp(18px,4vw,56px) 80px}.instructions{margin-bottom:18px;padding:15px 17px;border:1px solid #cbd8e5;border-left:5px solid var(--blue);border-radius:10px;background:#eef5fa;line-height:1.5}.cards{display:grid;gap:13px}.card{display:grid;grid-template-columns:minmax(190px,.8fr) minmax(260px,1.2fr) minmax(310px,1fr);gap:22px;align-items:center;padding:19px;border:1px solid var(--line);border-radius:13px;background:#fff;box-shadow:0 4px 14px rgba(24,35,52,.05)}.card[data-rating=Yes]{border-left:6px solid var(--yes)}.card[data-rating=Maybe]{border-left:6px solid var(--maybe)}.card[data-rating="Needs edit"]{border-left:6px solid var(--edit)}.card[data-rating=No]{border-left:6px solid var(--no)}.index{color:var(--muted);font-size:12px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}.pattern{margin:5px 0 0;font-size:24px}.target,.meta{margin:6px 0 0;color:var(--muted);font-size:13px}.ipa{color:var(--navy);font-weight:750}audio{display:block;width:100%;min-width:240px}.ratings{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.rating{min-height:44px;border:1px solid var(--line);border-radius:8px;background:#fff;font:inherit;font-weight:760}.yes[aria-pressed=true]{background:#e5f6ed;color:var(--yes)}.maybe[aria-pressed=true]{background:#fff4d4;color:var(--maybe)}.needs-edit[aria-pressed=true]{background:#f0e9fb;color:var(--edit)}.no[aria-pressed=true]{background:#fbe8ea;color:var(--no)}.notes{width:100%;min-height:40px;margin-top:8px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:inherit}.empty{padding:42px;text-align:center;color:var(--muted)}@media(max-width:900px){.card{grid-template-columns:1fr}.ratings{grid-template-columns:repeat(2,1fr)}}
</style></head><body><header><div class="head"><div><h1>Targeted atomic redos V21</h1><p class="subtitle">20 unresolved sounds only · approved V20 sounds are already installed</p></div><div class="progress"><span id="count">0 of ${records.length} rated</span><div class="track"><div class="fill" id="fill"></div></div></div></div><div class="toolbar"><select id="filter"><option value="All">Show all</option><option value="Unrated">Unrated only</option><option value="Yes">Yes only</option><option value="Maybe">Maybe only</option><option value="Needs edit">Needs edit only</option><option value="No">No only</option></select><button id="next">Play first unrated</button><button id="export" class="primary">Download review CSV</button><button id="reset">Reset ratings</button></div></header>
<main><div class="instructions"><strong>What changed:</strong> the rejected pure sounds now come from real words such as <em>Africa, snake, sing, sink, thin</em> and <em>buzz</em>, with the unwanted word sounds physically removed. “it” keeps the complete final T. The purple-button items use plain cue spellings instead of IPA.</div><div id="cards" class="cards"></div></main>
<script>
const records=${embedded},storageKey="literacypath-targeted-atomic-redos-v21",state=JSON.parse(localStorage.getItem(storageKey)||"{}"),cards=document.getElementById("cards"),filter=document.getElementById("filter");function save(){localStorage.setItem(storageKey,JSON.stringify(state))}function progress(){const n=records.filter(r=>state[r.clipId]?.rating).length;document.getElementById("count").textContent=n+" of "+records.length+" rated";document.getElementById("fill").style.width=(n/records.length*100).toFixed(1)+"%"}function render(){cards.replaceChildren();const shown=records.filter(r=>filter.value==="All"||(filter.value==="Unrated"?!state[r.clipId]?.rating:state[r.clipId]?.rating===filter.value));if(!shown.length)cards.innerHTML='<div class="empty">No recordings match this filter.</div>';for(const r of shown){const s=state[r.clipId]||{},card=document.createElement("article");card.className="card";card.dataset.rating=s.rating||"";card.innerHTML='<div><div class="index">'+String(r.number).padStart(2,"0")+' · '+r.group+'</div><h2 class="pattern">'+r.displayText+'</h2><p class="target">Target <span class="ipa">/'+r.ipa+'/</span> · source “'+r.anchor+'”</p></div><div><audio controls preload="metadata" src="'+r.audioUrl+'"></audio><div class="meta">'+r.method+' · '+r.durationSeconds.toFixed(2)+' seconds · level matched</div></div><div><div class="ratings"></div><input class="notes" placeholder="Optional note: what should change?" value="'+(s.notes||"").replaceAll('"',"&quot;")+'"></div>';for(const value of ["Yes","Maybe","Needs edit","No"]){const b=document.createElement("button");b.className="rating "+value.toLowerCase().replaceAll(" ","-");b.textContent=value;b.setAttribute("aria-pressed",String(s.rating===value));b.onclick=()=>{state[r.clipId]={...(state[r.clipId]||{}),rating:value};save();render()};card.querySelector(".ratings").append(b)}card.querySelector(".notes").oninput=e=>{state[r.clipId]={...(state[r.clipId]||{}),notes:e.target.value};save()};cards.append(card)}progress()}function csv(){const h=["clip_id","display_text","group","ipa","anchor","cue","method","rating","notes","voice","audio_file"],rows=records.map(r=>[r.clipId,r.displayText,r.group,"/"+r.ipa+"/",r.anchor,r.cue,r.method,state[r.clipId]?.rating||"",state[r.clipId]?.notes||"",r.voice,r.audioUrl]),data=[h,...rows].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\\r\\n"),u=URL.createObjectURL(new Blob([data],{type:"text/csv"})),a=document.createElement("a");a.href=u;a.download="targeted-atomic-redos-v21-review.csv";a.click();URL.revokeObjectURL(u)}filter.onchange=render;document.getElementById("next").onclick=()=>{filter.value="Unrated";render();const a=cards.querySelector("audio");a?.scrollIntoView({behavior:"smooth",block:"center"});a?.play()};document.getElementById("export").onclick=csv;document.getElementById("reset").onclick=()=>{if(confirm("Clear all ratings and notes?")){for(const k of Object.keys(state))delete state[k];save();filter.value="All";render()}};render();
</script></body></html>`;
}

await Promise.all([mkdir(rawDirectory, { recursive: true }), mkdir(audioDirectory, { recursive: true })]);
const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();
if (!accessToken) throw new Error("Google authentication returned no access token.");

const records = [];
for (const [index, target] of targets.entries()) {
  const clipId = `lp_atomic_v21_${sha256(`${target.key}|${target.text}|${target.method}|${voiceName}`).slice(0, 10)}`;
  const rawPath = path.join(rawDirectory, `${clipId}-${target.key}-raw.wav`);
  const outputPath = path.join(audioDirectory, `${clipId}-${target.key}.mp3`);
  await synthesize(accessToken, target, rawPath);
  const measurement = editAndNormalize(rawPath, outputPath, target.edit);
  const audio = await readFile(outputPath);
  const audioProbe = probe(outputPath);
  if (
    audioProbe.sampleRate !== 24000 ||
    audioProbe.channels !== 1 ||
    audioProbe.durationSeconds <= 0 ||
    Math.abs(measurement.meanVolumeDb - targetMeanDb) > 1.1 ||
    measurement.maxVolumeDb > -1.5
  ) {
    throw new Error(`${target.key} failed the technical audio gate.`);
  }
  records.push({
    number: index + 1,
    clipId,
    key: target.key,
    displayText: target.displayText,
    group: index < 11 ? "rejected sound redo" : "needs-edit alternate",
    ipa: target.ipa,
    anchor: target.anchor,
    cue: target.cue,
    method: target.method,
    audioUrl: `audio/${clipId}-${target.key}.mp3`,
    audioPath: outputPath,
    voice: voiceName,
    sourceContentSeconds: measurement.contentDuration,
    durationSeconds: audioProbe.durationSeconds,
    bytes: audioProbe.bytes,
    meanVolumeDb: measurement.meanVolumeDb,
    maxVolumeDb: measurement.maxVolumeDb,
    sha256: sha256(audio)
  });
  console.log(`${index + 1}/${targets.length} ${target.key}: ${audioProbe.durationSeconds.toFixed(2)}s, ${measurement.meanVolumeDb.toFixed(1)} dB mean`);
}

if (
  records.length !== targets.length ||
  new Set(records.map(record => record.clipId)).size !== targets.length ||
  new Set(records.map(record => record.sha256)).size !== targets.length
) {
  throw new Error("V21 output is incomplete or contains duplicate audio.");
}

const manifestPath = path.join(outputDirectory, "targeted-atomic-redos-v21-manifest.json");
const htmlPath = path.join(outputDirectory, "TARGETED_ATOMIC_REDOS_V21_REVIEW.html");
await writeFile(
  manifestPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId,
    voice: voiceName,
    targetMeanDb,
    recordCount: records.length,
    records
  }, null, 2)}\n`,
  "utf8"
);
await writeFile(htmlPath, reviewHtml(records), "utf8");

console.log(JSON.stringify({ outputDirectory, manifestPath, htmlPath, recordCount: records.length }, null, 2));
