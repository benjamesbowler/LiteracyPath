import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { renameSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const v21Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v21-targeted-atomic-redos"
);
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v22-manually-tightened-atomic"
);
const rawDirectory = path.join(outputDirectory, "raw");
const audioDirectory = path.join(outputDirectory, "audio");
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const targetMeanDb = -27.0;

const targets = Object.freeze([
  { key: "a", displayText: "a — pure “ah”", ipa: "æ", cue: "ah", anchor: "Africa", sourceKey: "a", cut: { mode: "prefix", seconds: 0.145 }, method: "Africa cut tightened before the F begins" },
  { key: "e", displayText: "e — pure “eh”", ipa: "ɛ", cue: "eh", anchor: "elephant", sourceKey: "e", cut: { mode: "prefix", seconds: 0.125 }, method: "Elephant cut tightened before the L begins" },
  { key: "ng", displayText: "ng — long ending sound", ipa: "ŋ", cue: "ng", anchor: "long", text: "long", cut: { mode: "suffix", seconds: 0.20 }, method: "New Leda source “long”; only the sustained final /ŋ/" },
  { key: "nk", displayText: "nk — pure ending blend", ipa: "ŋk", cue: "nk", anchor: "sink", sourceKey: "nk", cut: { mode: "suffix", seconds: 0.13 }, method: "Sink cut tightened past the vowel into /ŋk/" },
  { key: "th", displayText: "th — pure wind sound", ipa: "θ", cue: "th", anchor: "thin", sourceKey: "th", cut: { mode: "prefix", seconds: 0.08 }, method: "Thin cut tightened before the vowel begins" },
  { key: "zz", displayText: "zz — pure bumblebee sound", ipa: "z", cue: "zzz", anchor: "buzz", sourceKey: "zz", cut: { mode: "suffix", seconds: 0.09 }, method: "Buzz cut tightened beyond the vowel into final /z/" },
  { key: "b", displayText: "b — compact “buh”", ipa: "bʌ", cue: "buh", anchor: "bat", sourceKey: "b", cut: { mode: "prefix", seconds: 0.18 }, method: "Existing Leda cue shortened before the support vowel stretches" },
  { key: "j", displayText: "j — compact “juh”", ipa: "dʒʌ", cue: "juh", anchor: "jam", sourceKey: "j", cut: { mode: "prefix", seconds: 0.22 }, method: "Existing Leda cue shortened before the support vowel stretches" },
  { key: "r", displayText: "r — compact “ruh”", ipa: "ɹʌ", cue: "ruh", anchor: "run", sourceKey: "r", cut: { mode: "prefix", seconds: 0.18 }, method: "Existing Leda cue shortened to the clear opening syllable" },
  { key: "t", displayText: "t — compact “tuh”", ipa: "tʌ", cue: "tuh", anchor: "tap", sourceKey: "t", cut: { mode: "prefix", seconds: 0.18 }, method: "Existing Leda cue shortened before the repeated tail" },
  { key: "y", displayText: "y — compact “yuh”", ipa: "jʌ", cue: "yuh", anchor: "yak", sourceKey: "y", cut: { mode: "prefix", seconds: 0.13 }, method: "Existing Leda cue tightened to its clean opening" },
  { key: "ch", displayText: "ch — compact “chuh”", ipa: "tʃʌ", cue: "chuh", anchor: "chip", sourceKey: "ch", cut: { mode: "prefix", seconds: 0.18 }, method: "Existing Leda cue shortened before the support vowel stretches" },
  { key: "sh", displayText: "sh — compact “shuh”", ipa: "ʃʌ", cue: "shuh", anchor: "ship", sourceKey: "sh", cut: { mode: "prefix", seconds: 0.22 }, method: "Existing Leda cue shortened before the support vowel stretches" }
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
    `Volume analysis for ${filePath}`
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

async function synthesizeLong(accessToken, outputPath) {
  try {
    if ((await stat(outputPath)).size > 0) return;
  } catch {
    // Generate the missing source.
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text: "long" },
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
    })
  });
  if (!response.ok) throw new Error(`long failed with ${response.status}: ${(await response.text()).slice(0, 1000)}`);
  const result = await response.json();
  await writeFile(outputPath, Buffer.from(result.audioContent, "base64"));
}

function sourceRawPath(target, v21Manifest) {
  if (target.text) {
    return path.join(rawDirectory, "lp_atomic_v22-ng-from-long-raw.wav");
  }
  const record = v21Manifest.records.find(candidate => candidate.key === target.sourceKey);
  if (!record) throw new Error(`Missing V21 source for ${target.key}.`);
  return path.join(v21Directory, "raw", `${record.clipId}-${target.sourceKey}-raw.wav`);
}

function cutAndNormalize(sourcePath, outputPath, cut) {
  const contentPath = outputPath.replace(/\.mp3$/u, ".content.wav");
  const cutPath = outputPath.replace(/\.mp3$/u, ".cut.wav");
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", sourcePath,
      "-af", [
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
  const filter = cut.mode === "prefix"
    ? `atrim=start=0:end=${Math.min(cut.seconds, contentDuration).toFixed(4)},asetpts=PTS-STARTPTS`
    : `atrim=start=${Math.max(0, contentDuration - cut.seconds).toFixed(4)}:end=${contentDuration.toFixed(4)},asetpts=PTS-STARTPTS`;
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", contentPath,
      "-af", [
        filter,
        "afade=t=in:st=0:d=0.003",
        `afade=t=out:st=${Math.max(0.015, cut.seconds - 0.008).toFixed(4)}:d=0.008`,
        "adelay=55",
        "apad=whole_dur=0.66",
        "aresample=24000",
        "aformat=sample_fmts=fltp:channel_layouts=mono"
      ].join(","),
      "-ar", "24000", "-ac", "1", "-codec:a", "pcm_s16le", cutPath
    ],
    `Manual cut for ${sourcePath}`
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

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function reviewHtml(records) {
  const embedded = JSON.stringify(records).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manually tightened atomic sounds V22</title>
<style>:root{--navy:#17324d;--ink:#233142;--muted:#617184;--line:#d7e0e8;--bg:#f5f7fa;--yes:#16794a;--maybe:#9a6600;--edit:#6f4aa8;--no:#aa2d38;--blue:#266a9f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,sans-serif}header{position:sticky;top:0;z-index:3;padding:18px clamp(18px,4vw,56px);border-bottom:1px solid var(--line);background:rgba(255,255,255,.97)}.head{display:flex;justify-content:space-between;gap:20px;align-items:center;max-width:1260px;margin:auto}h1{margin:0;color:var(--navy)}.subtitle{margin:5px 0 0;color:var(--muted)}.progress{font-weight:750;text-align:right}.track{height:8px;margin-top:7px;border-radius:10px;background:#e7edf2;overflow:hidden}.fill{height:100%;width:0;background:var(--blue)}.toolbar{display:flex;flex-wrap:wrap;gap:9px;max-width:1260px;margin:14px auto 0}.toolbar button,.toolbar select{min-height:40px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:#fff;font:inherit;font-weight:700}.primary{background:var(--navy)!important;color:#fff}main{max-width:1260px;margin:auto;padding:26px clamp(18px,4vw,56px) 80px}.instructions{margin-bottom:18px;padding:15px 17px;border:1px solid #cbd8e5;border-left:5px solid var(--blue);border-radius:10px;background:#eef5fa;line-height:1.5}.cards{display:grid;gap:13px}.card{display:grid;grid-template-columns:minmax(190px,.8fr) minmax(260px,1.2fr) minmax(310px,1fr);gap:22px;align-items:center;padding:19px;border:1px solid var(--line);border-radius:13px;background:#fff;box-shadow:0 4px 14px rgba(24,35,52,.05)}.card[data-rating=Yes]{border-left:6px solid var(--yes)}.card[data-rating=Maybe]{border-left:6px solid var(--maybe)}.card[data-rating="Needs edit"]{border-left:6px solid var(--edit)}.card[data-rating=No]{border-left:6px solid var(--no)}.index{color:var(--muted);font-size:12px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}.pattern{margin:5px 0 0;font-size:24px}.target,.meta{margin:6px 0 0;color:var(--muted);font-size:13px}.ipa{color:var(--navy);font-weight:750}audio{display:block;width:100%;min-width:240px}.ratings{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.rating{min-height:44px;border:1px solid var(--line);border-radius:8px;background:#fff;font:inherit;font-weight:760}.yes[aria-pressed=true]{background:#e5f6ed;color:var(--yes)}.maybe[aria-pressed=true]{background:#fff4d4;color:var(--maybe)}.needs-edit[aria-pressed=true]{background:#f0e9fb;color:var(--edit)}.no[aria-pressed=true]{background:#fbe8ea;color:var(--no)}.notes{width:100%;min-height:40px;margin-top:8px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:inherit}.empty{padding:42px;text-align:center;color:var(--muted)}@media(max-width:900px){.card{grid-template-columns:1fr}.ratings{grid-template-columns:repeat(2,1fr)}}</style></head>
<body><header><div class="head"><div><h1>Manually tightened atomic sounds V22</h1><p class="subtitle">13 unresolved sounds only · approved V21 sounds are already installed</p></div><div class="progress"><span id="count">0 of ${records.length} rated</span><div class="track"><div class="fill" id="fill"></div></div></div></div><div class="toolbar"><select id="filter"><option value="All">Show all</option><option value="Unrated">Unrated only</option><option value="Yes">Yes only</option><option value="Maybe">Maybe only</option><option value="Needs edit">Needs edit only</option><option value="No">No only</option></select><button id="next">Play first unrated</button><button id="export" class="primary">Download review CSV</button><button id="reset">Reset ratings</button></div></header>
<main><div class="instructions"><strong>These are physical edits, not another pronunciation guess.</strong> A/E/TH stop before the next consonant or vowel begins. NK/ZZ begin after the preceding vowel ends. The compact “uh” cues have their stretched tails removed. NG is a new cut from Leda saying “long”.</div><div id="cards" class="cards"></div></main>
<script>const records=${embedded},storageKey="literacypath-manually-tightened-atomic-v22",state=JSON.parse(localStorage.getItem(storageKey)||"{}"),cards=document.getElementById("cards"),filter=document.getElementById("filter");function save(){localStorage.setItem(storageKey,JSON.stringify(state))}function progress(){const n=records.filter(r=>state[r.clipId]?.rating).length;document.getElementById("count").textContent=n+" of "+records.length+" rated";document.getElementById("fill").style.width=(n/records.length*100).toFixed(1)+"%"}function render(){cards.replaceChildren();const shown=records.filter(r=>filter.value==="All"||(filter.value==="Unrated"?!state[r.clipId]?.rating:state[r.clipId]?.rating===filter.value));if(!shown.length)cards.innerHTML='<div class="empty">No recordings match this filter.</div>';for(const r of shown){const s=state[r.clipId]||{},card=document.createElement("article");card.className="card";card.dataset.rating=s.rating||"";card.innerHTML='<div><div class="index">'+String(r.number).padStart(2,"0")+' · manual boundary edit</div><h2 class="pattern">'+r.displayText+'</h2><p class="target">Target <span class="ipa">/'+r.ipa+'/</span> · source “'+r.anchor+'”</p></div><div><audio controls preload="metadata" src="'+r.audioUrl+'"></audio><div class="meta">'+r.method+' · '+r.durationSeconds.toFixed(2)+' seconds · level matched</div></div><div><div class="ratings"></div><input class="notes" placeholder="Optional note: what should change?" value="'+(s.notes||"").replaceAll('"',"&quot;")+'"></div>';for(const value of ["Yes","Maybe","Needs edit","No"]){const b=document.createElement("button");b.className="rating "+value.toLowerCase().replaceAll(" ","-");b.textContent=value;b.setAttribute("aria-pressed",String(s.rating===value));b.onclick=()=>{state[r.clipId]={...(state[r.clipId]||{}),rating:value};save();render()};card.querySelector(".ratings").append(b)}card.querySelector(".notes").oninput=e=>{state[r.clipId]={...(state[r.clipId]||{}),notes:e.target.value};save()};cards.append(card)}progress()}function csv(){const h=["clip_id","display_text","group","ipa","anchor","cue","method","rating","notes","voice","audio_file"],rows=records.map(r=>[r.clipId,r.displayText,"manual boundary edit","/"+r.ipa+"/",r.anchor,r.cue,r.method,state[r.clipId]?.rating||"",state[r.clipId]?.notes||"",r.voice,r.audioUrl]),data=[h,...rows].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\\r\\n"),u=URL.createObjectURL(new Blob([data],{type:"text/csv"})),a=document.createElement("a");a.href=u;a.download="manually-tightened-atomic-v22-review.csv";a.click();URL.revokeObjectURL(u)}filter.onchange=render;document.getElementById("next").onclick=()=>{filter.value="Unrated";render();const a=cards.querySelector("audio");a?.scrollIntoView({behavior:"smooth",block:"center"});a?.play()};document.getElementById("export").onclick=csv;document.getElementById("reset").onclick=()=>{if(confirm("Clear all ratings and notes?")){for(const k of Object.keys(state))delete state[k];save();filter.value="All";render()}};render();</script></body></html>`;
}

await Promise.all([mkdir(rawDirectory, { recursive: true }), mkdir(audioDirectory, { recursive: true })]);
const v21Manifest = JSON.parse(
  await readFile(path.join(v21Directory, "targeted-atomic-redos-v21-manifest.json"), "utf8")
);
const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();
await synthesizeLong(accessToken, path.join(rawDirectory, "lp_atomic_v22-ng-from-long-raw.wav"));

const records = [];
for (const [index, target] of targets.entries()) {
  const clipId = `lp_atomic_v22_${sha256(`${target.key}|${target.anchor}|${target.cut.mode}|${target.cut.seconds}|${voiceName}`).slice(0, 10)}`;
  const outputPath = path.join(audioDirectory, `${clipId}-${target.key}.mp3`);
  const sourcePath = sourceRawPath(target, v21Manifest);
  const measurement = cutAndNormalize(sourcePath, outputPath, target.cut);
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
    ipa: target.ipa,
    cue: target.cue,
    anchor: target.anchor,
    method: target.method,
    audioUrl: `audio/${clipId}-${target.key}.mp3`,
    audioPath: outputPath,
    voice: voiceName,
    sourceContentSeconds: measurement.contentDuration,
    selectedCutSeconds: target.cut.seconds,
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
  throw new Error("V22 output is incomplete or contains duplicate audio.");
}

const manifestPath = path.join(outputDirectory, "manually-tightened-atomic-v22-manifest.json");
const htmlPath = path.join(outputDirectory, "MANUALLY_TIGHTENED_ATOMIC_V22_REVIEW.html");
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
const headers = ["clip_id", "display_text", "group", "ipa", "anchor", "cue", "method", "rating", "notes", "voice", "audio_file"];
const rows = records.map(record => [
  record.clipId, record.displayText, "manual boundary edit", `/${record.ipa}/`,
  record.anchor, record.cue, record.method, "", "", record.voice, record.audioUrl
]);
await writeFile(
  path.join(outputDirectory, "manually-tightened-atomic-v22-review-blank.csv"),
  [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\r\n") + "\r\n",
  "utf8"
);
console.log(JSON.stringify({ outputDirectory, manifestPath, htmlPath, recordCount: records.length }, null, 2));
