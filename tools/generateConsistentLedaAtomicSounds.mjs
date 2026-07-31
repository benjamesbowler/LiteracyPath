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
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v20-consistent-leda-atomic"
);
const rawDirectory = path.join(outputDirectory, "raw");
const audioDirectory = path.join(outputDirectory, "audio");
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const targetLufs = -25.6;
const targetMeanDb = -27.0;
const rawOnly = process.argv.includes("--raw-only");

// The five short vowels and /ks/ are taken from naturally spoken anchor words.
// Their edit boundaries are deliberately explicit: changing one sound never
// silently changes the rest of the bank.
const atomicTargets = Object.freeze([
  { key: "a", cue: "ah", ipa: "æ", anchor: "apple", input: { text: "apple" }, edit: { start: 0.69, end: 0.86 } },
  { key: "b", cue: "buh", ipa: "bʌ", anchor: "bat", input: { ipa: "bʌ", fallback: "buh" } },
  { key: "c", cue: "kuh", ipa: "kʌ", anchor: "cat", input: { ipa: "kʌ", fallback: "kuh" } },
  { key: "d", cue: "duh", ipa: "dʌ", anchor: "dog", input: { ipa: "dʌ", fallback: "duh" } },
  { key: "e", cue: "eh", ipa: "ɛ", anchor: "egg", input: { text: "egg" }, edit: { start: 0.42, end: 0.59 } },
  { key: "f", cue: "fuh", ipa: "fʌ", anchor: "fish", input: { ipa: "fʌ", fallback: "fuh" } },
  { key: "g", cue: "guh", ipa: "ɡʌ", anchor: "goat", input: { ipa: "ɡʌ", fallback: "guh" } },
  { key: "h", cue: "huh", ipa: "hʌ", anchor: "hat", input: { ipa: "hʌ", fallback: "huh" } },
  { key: "i", cue: "ih", ipa: "ɪ", anchor: "igloo", input: { text: "igloo" }, edit: { start: 0.07, end: 0.18 } },
  { key: "j", cue: "juh", ipa: "dʒʌ", anchor: "jam", input: { ipa: "dʒʌ", fallback: "juh" } },
  { key: "k", cue: "kuh", ipa: "kʌ", anchor: "kid", input: { ipa: "kʌ", fallback: "kuh" } },
  { key: "l", cue: "luh", ipa: "lʌ", anchor: "leg", input: { ipa: "lʌ", fallback: "luh" } },
  { key: "m", cue: "muh", ipa: "mʌ", anchor: "man", input: { ipa: "mʌ", fallback: "muh" } },
  { key: "n", cue: "nuh", ipa: "nʌ", anchor: "net", input: { ipa: "nʌ", fallback: "nuh" } },
  { key: "o", cue: "oh", ipa: "ɑ", anchor: "orange", rawVersion: "on-1", input: { text: "on" }, edit: { start: 0.16, end: 0.41 } },
  { key: "p", cue: "puh", ipa: "pʌ", anchor: "pig", input: { ipa: "pʌ", fallback: "puh" } },
  { key: "q", cue: "kwuh", ipa: "kwʌ", anchor: "queen", input: { ipa: "kwʌ", fallback: "kwuh" } },
  { key: "r", cue: "ruh", ipa: "ɹʌ", anchor: "run", input: { ipa: "ɹʌ", fallback: "ruh" } },
  { key: "s", cue: "suh", ipa: "sʌ", anchor: "sun", input: { ipa: "sʌ", fallback: "suh" } },
  { key: "t", cue: "tuh", ipa: "tʌ", anchor: "tap", input: { ipa: "tʌ", fallback: "tuh" } },
  { key: "u", cue: "uh", ipa: "ʌ", anchor: "up", input: { text: "up" }, edit: { start: 0.18, end: 0.33 } },
  { key: "v", cue: "vuh", ipa: "vʌ", anchor: "van", input: { ipa: "vʌ", fallback: "vuh" } },
  { key: "w", cue: "wuh", ipa: "wʌ", anchor: "web", input: { ipa: "wʌ", fallback: "wuh" } },
  { key: "x", cue: "ks", ipa: "ks", anchor: "box", input: { text: "box" }, edit: { start: 0.29, end: 0.59 } },
  { key: "y", cue: "yuh", ipa: "jʌ", anchor: "yak", input: { ipa: "jʌ", fallback: "yuh" } },
  { key: "z", cue: "zuh", ipa: "zʌ", anchor: "zip", input: { ipa: "zʌ", fallback: "zuh" } }
]);

const repairTargets = Object.freeze([
  {
    key: "it",
    cue: "it",
    ipa: "ɪt",
    anchor: "sit",
    description: "it — as in sit",
    input: { text: "it" },
    edit: { start: 0.48, end: 0.71 }
  },
  {
    key: "ou",
    cue: "ou",
    ipa: "aʊ",
    anchor: "out",
    description: "ou — as in out",
    input: { text: "how" },
    edit: { start: 0.205, end: 0.70 }
  }
]);

const legacyHumanTargets = Object.freeze([
  { key: "all", cue: "all", ipa: "ɔl", anchor: "ball", input: { ipa: "ɔl", fallback: "all" } },
  { key: "ang", cue: "ang", ipa: "æŋ", anchor: "rang", input: { ipa: "æŋ", fallback: "ang" } },
  { key: "ch", cue: "chuh", ipa: "tʃʌ", anchor: "chip", input: { ipa: "tʃʌ", fallback: "chuh" } },
  { key: "ck", cue: "kuh", ipa: "kʌ", anchor: "duck", input: { ipa: "kʌ", fallback: "kuh" } },
  { key: "ff", cue: "fuh", ipa: "fʌ", anchor: "off", input: { ipa: "fʌ", fallback: "fuh" } },
  { key: "ing", cue: "ing", ipa: "ɪŋ", anchor: "ring", input: { ipa: "ɪŋ", fallback: "ing" } },
  { key: "ll", cue: "luh", ipa: "lʌ", anchor: "bell", input: { ipa: "lʌ", fallback: "luh" } },
  { key: "ng", cue: "ng", ipa: "ŋ", anchor: "sing", input: { ipa: "ŋ", fallback: "ng" } },
  { key: "nk", cue: "nk", ipa: "ŋk", anchor: "sink", input: { ipa: "ŋk", fallback: "nk" } },
  { key: "ong", cue: "ong", ipa: "ɑŋ", anchor: "song", input: { ipa: "ɑŋ", fallback: "ong" } },
  { key: "qu", cue: "kwuh", ipa: "kwʌ", anchor: "queen", input: { ipa: "kwʌ", fallback: "kwuh" } },
  { key: "sh", cue: "shuh", ipa: "ʃʌ", anchor: "ship", input: { ipa: "ʃʌ", fallback: "shuh" } },
  { key: "ss", cue: "suh", ipa: "sʌ", anchor: "hiss", input: { ipa: "sʌ", fallback: "suh" } },
  { key: "th", cue: "thuh", ipa: "θʌ", anchor: "thin", input: { ipa: "θʌ", fallback: "thuh" } },
  { key: "ung", cue: "ung", ipa: "ʌŋ", anchor: "sung", input: { ipa: "ʌŋ", fallback: "ung" } },
  { key: "wh", cue: "wuh", ipa: "wʌ", anchor: "whale", input: { ipa: "wʌ", fallback: "wuh" } },
  { key: "zz", cue: "zuh", ipa: "zʌ", anchor: "buzz", input: { ipa: "zʌ", fallback: "zuh" } }
]);

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${String(result.stderr || result.stdout).slice(-1800)}`);
  }
  return { stdout: String(result.stdout || ""), stderr: String(result.stderr || "") };
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableId(prefix, value) {
  return `${prefix}_${sha256(value).slice(0, 10)}`;
}

function analyzeLoudness(filePath) {
  const { stderr } = run(
    "ffmpeg",
    [
      "-hide_banner", "-nostats", "-i", filePath,
      "-af", `loudnorm=I=${targetLufs}:TP=-2:LRA=7:print_format=json`,
      "-f", "null", "-"
    ],
    `Loudness analysis for ${filePath}`
  );
  const match = stderr.match(/\{\s*"input_i"[\s\S]*?\}/u);
  if (!match) throw new Error(`Could not parse loudness data for ${filePath}.`);
  return JSON.parse(match[0]);
}

function analyzeVolume(filePath) {
  const { stderr } = run(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", filePath, "-af", "volumedetect", "-f", "null", "-"],
    `Average-level analysis for ${filePath}`
  );
  const meanMatch = stderr.match(/mean_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/u);
  const maxMatch = stderr.match(/max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/u);
  if (!meanMatch || !maxMatch) {
    throw new Error(`Could not parse average level for ${filePath}.`);
  }
  return {
    meanVolumeDb: Number(meanMatch[1]),
    maxVolumeDb: Number(maxMatch[1])
  };
}

function probeAudio(filePath) {
  const { stdout } = run(
    "ffprobe",
    [
      "-v", "error", "-select_streams", "a:0",
      "-show_entries", "stream=codec_name,sample_rate,channels:format=duration,size",
      "-of", "json", filePath
    ],
    `Audio probe for ${filePath}`
  );
  const parsed = JSON.parse(stdout);
  return {
    codecName: parsed.streams?.[0]?.codec_name,
    sampleRate: Number(parsed.streams?.[0]?.sample_rate),
    channels: Number(parsed.streams?.[0]?.channels),
    durationSeconds: Number(parsed.format?.duration),
    bytes: Number(parsed.format?.size)
  };
}

function editAndNormalize(sourcePath, outputPath, edit) {
  const intermediatePath = outputPath.replace(/\.mp3$/u, ".wav");
  const filters = [];
  if (edit) {
    filters.push(`atrim=start=${edit.start}:end=${edit.end}`, "asetpts=PTS-STARTPTS");
  } else {
    filters.push(
      "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-48dB",
      "areverse",
      "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-48dB",
      "areverse"
    );
  }
  filters.push(
    "afade=t=in:st=0:d=0.004",
    "adelay=55",
    "apad=whole_dur=0.62",
    "aresample=24000",
    "aformat=sample_fmts=fltp:channel_layouts=mono"
  );
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", sourcePath,
      "-af", filters.join(","),
      "-ar", "24000", "-ac", "1", "-codec:a", "pcm_s16le", intermediatePath
    ],
    `Boundary edit for ${sourcePath}`
  );
  const measured = analyzeVolume(intermediatePath);
  const initialGainDb = targetMeanDb - measured.meanVolumeDb;
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", intermediatePath,
      "-af", `volume=${initialGainDb.toFixed(3)}dB`,
      "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k",
      outputPath
    ],
    `Average-level normalization for ${sourcePath}`
  );
  let finalVolume = analyzeVolume(outputPath);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const correctionDb = targetMeanDb - finalVolume.meanVolumeDb;
    if (Math.abs(correctionDb) <= 0.1) break;
    const correctedPath = outputPath.replace(/\.mp3$/u, ".corrected.mp3");
    run(
      "ffmpeg",
      [
        "-y", "-hide_banner", "-nostats", "-i", outputPath,
        "-af", `volume=${correctionDb.toFixed(3)}dB`,
        "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k",
        correctedPath
      ],
      `Loudness correction for ${sourcePath}`
    );
    renameSync(correctedPath, outputPath);
    finalVolume = analyzeVolume(outputPath);
  }
  const finalLoudness = analyzeLoudness(outputPath);
  return { ...finalLoudness, ...finalVolume };
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function reviewHtml({ title, subtitle, instructions, storageKey, csvName, records }) {
  const embedded = JSON.stringify(records).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    :root{--navy:#17324d;--ink:#233142;--muted:#617184;--line:#d7e0e8;--bg:#f5f7fa;--card:#fff;--yes:#16794a;--yes-bg:#e5f6ed;--maybe:#9a6600;--maybe-bg:#fff4d4;--edit:#6f4aa8;--edit-bg:#f0e9fb;--no:#aa2d38;--no-bg:#fbe8ea;--blue:#266a9f}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{position:sticky;top:0;z-index:4;padding:18px clamp(18px,4vw,56px);border-bottom:1px solid var(--line);background:rgba(255,255,255,.96);backdrop-filter:blur(12px)}
    .header-row{display:flex;justify-content:space-between;gap:20px;align-items:center;max-width:1260px;margin:auto}.header-row h1{margin:0;color:var(--navy);font-size:clamp(24px,3vw,36px)}.subtitle{margin:5px 0 0;color:var(--muted)}
    .progress{min-width:160px;text-align:right;font-weight:750}.track{height:8px;margin-top:7px;border-radius:10px;background:#e7edf2;overflow:hidden}.fill{height:100%;width:0;background:var(--blue)}
    .toolbar{display:flex;flex-wrap:wrap;gap:9px;max-width:1260px;margin:15px auto 0}.toolbar button,.toolbar select{min-height:40px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink);font:inherit;font-weight:700}.toolbar .primary{background:var(--navy);color:#fff}
    main{max-width:1260px;margin:auto;padding:26px clamp(18px,4vw,56px) 80px}.instructions{margin-bottom:18px;padding:15px 17px;border:1px solid #cbd8e5;border-left:5px solid var(--blue);border-radius:10px;background:#eef5fa;line-height:1.5}
    #cards{display:grid;gap:13px}.card{display:grid;grid-template-columns:minmax(190px,.8fr) minmax(260px,1.2fr) minmax(310px,1fr);gap:22px;align-items:center;padding:19px;border:1px solid var(--line);border-radius:13px;background:var(--card);box-shadow:0 4px 14px rgba(24,35,52,.05)}
    .card[data-rating="Yes"]{border-left:6px solid var(--yes)}.card[data-rating="Maybe"]{border-left:6px solid var(--maybe)}.card[data-rating="Needs edit"]{border-left:6px solid var(--edit)}.card[data-rating="No"]{border-left:6px solid var(--no)}
    .index{color:var(--muted);font-size:12px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}.pattern{margin:5px 0 0;font-size:24px}.target{margin:6px 0 0;color:var(--muted);font-size:14px}.ipa{color:var(--navy);font-size:17px;font-weight:750}audio{display:block;width:100%;min-width:240px}.meta{margin-top:6px;color:var(--muted);font-size:12px}
    .rating-group{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.rating{min-height:44px;border:1px solid var(--line);border-radius:8px;background:#fff;font:inherit;font-weight:760;cursor:pointer}.rating.yes[aria-pressed="true"]{border-color:var(--yes);background:var(--yes-bg);color:var(--yes)}.rating.maybe[aria-pressed="true"]{border-color:var(--maybe);background:var(--maybe-bg);color:var(--maybe)}.rating.needs-edit[aria-pressed="true"]{border-color:var(--edit);background:var(--edit-bg);color:var(--edit)}.rating.no[aria-pressed="true"]{border-color:var(--no);background:var(--no-bg);color:var(--no)}
    .notes{width:100%;min-height:40px;margin-top:8px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:inherit}.empty{padding:42px;border:1px dashed #b6bfca;border-radius:13px;text-align:center;color:var(--muted)}
    @media(max-width:900px){.card{grid-template-columns:1fr}.progress{min-width:130px}.rating-group{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.header-row{display:block}.progress{margin-top:12px;text-align:left}}
  </style>
</head>
<body>
  <header>
    <div class="header-row"><div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><div class="progress"><span id="count">0 of ${records.length} rated</span><div class="track"><div class="fill" id="fill"></div></div></div></div>
    <div class="toolbar">
      <select id="filter" aria-label="Filter ratings"><option value="All">Show all</option><option value="Unrated">Unrated only</option><option value="Yes">Yes only</option><option value="Maybe">Maybe only</option><option value="Needs edit">Needs edit only</option><option value="No">No only</option></select>
      <button id="next" type="button">Play first unrated</button><button id="export" class="primary" type="button">Download review CSV</button><button id="reset" type="button">Reset ratings</button>
    </div>
  </header>
  <main><div class="instructions">${instructions}</div><div id="cards"></div></main>
  <script>
    const records=${embedded};const storageKey=${JSON.stringify(storageKey)};const state=JSON.parse(localStorage.getItem(storageKey)||"{}");const cards=document.getElementById("cards");const filter=document.getElementById("filter");
    function save(){localStorage.setItem(storageKey,JSON.stringify(state))}
    function progress(){const rated=records.filter(r=>state[r.clipId]?.rating).length;document.getElementById("count").textContent=rated+" of "+records.length+" rated";document.getElementById("fill").style.width=((rated/records.length)*100).toFixed(1)+"%"}
    function rating(id,value){state[id]={...(state[id]||{}),rating:value};save();render()}
    function note(id,value){state[id]={...(state[id]||{}),notes:value};save()}
    function visible(r){const selected=filter.value;const value=state[r.clipId]?.rating||"";return selected==="All"||(selected==="Unrated"?!value:value===selected)}
    function render(){cards.replaceChildren();const shown=records.filter(visible);if(!shown.length){const e=document.createElement("div");e.className="empty";e.textContent="No recordings match this filter.";cards.append(e)}shown.forEach(r=>{const saved=state[r.clipId]||{};const card=document.createElement("article");card.className="card";card.dataset.rating=saved.rating||"";const identity=document.createElement("div");identity.innerHTML='<div class="index">'+String(r.number).padStart(2,"0")+' · '+r.group+'</div><h2 class="pattern">'+r.displayText+'</h2><p class="target">Target <span class="ipa">/'+r.ipa+'/</span> · anchor “'+r.anchor+'” · cue “'+r.cue+'”</p>';const listening=document.createElement("div");const audio=document.createElement("audio");audio.controls=true;audio.preload="metadata";audio.src=r.audioUrl;audio.setAttribute("aria-label","Play "+r.displayText);const meta=document.createElement("div");meta.className="meta";meta.textContent=r.method+" · "+r.durationSeconds.toFixed(2)+" seconds · level matched";listening.append(audio,meta);const review=document.createElement("div");const group=document.createElement("div");group.className="rating-group";["Yes","Maybe","Needs edit","No"].forEach(value=>{const button=document.createElement("button");button.type="button";button.className="rating "+value.toLowerCase().replaceAll(" ","-");button.textContent=value;button.setAttribute("aria-pressed",String(saved.rating===value));button.addEventListener("click",()=>rating(r.clipId,value));group.append(button)});const notes=document.createElement("input");notes.className="notes";notes.type="text";notes.value=saved.notes||"";notes.placeholder="Optional note: what should change?";notes.setAttribute("aria-label","Notes for "+r.displayText);notes.addEventListener("input",event=>note(r.clipId,event.target.value));review.append(group,notes);card.append(identity,listening,review);cards.append(card)});progress()}
    function exportCsv(){const headers=["clip_id","display_text","group","ipa","anchor","cue","method","rating","notes","voice","audio_file"];const rows=records.map(r=>{const saved=state[r.clipId]||{};return[r.clipId,r.displayText,r.group,"/"+r.ipa+"/",r.anchor,r.cue,r.method,saved.rating||"",saved.notes||"",r.voice,r.audioUrl]});const csv=[headers,...rows].map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(",")).join("\\r\\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=${JSON.stringify(csvName)};document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url)}
    filter.addEventListener("change",render);document.getElementById("next").addEventListener("click",()=>{filter.value="Unrated";render();const first=cards.querySelector(".card");first?.scrollIntoView({behavior:"smooth",block:"center"});first?.querySelector("audio")?.play()});document.getElementById("export").addEventListener("click",exportCsv);document.getElementById("reset").addEventListener("click",()=>{if(!confirm("Clear all ratings and notes?"))return;Object.keys(state).forEach(key=>delete state[key]);save();filter.value="All";render()});render();
  </script>
</body>
</html>`;
}

async function synthesize(accessToken, target, rawPath) {
  try {
    const existing = await stat(rawPath);
    if (existing.size > 0) return "reused";
  } catch {
    // Missing raw take: generate it once, then keep that exact take for editing.
  }
  const input = target.input.ipa
    ? {
        ssml:
          `<speak><phoneme alphabet="ipa" ph="${escapeXml(target.input.ipa)}">` +
          `${escapeXml(target.input.fallback)}</phoneme></speak>`
      }
    : { text: target.input.text };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input,
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
    })
  });
  if (!response.ok) {
    throw new Error(`${target.key} failed with ${response.status}: ${(await response.text()).slice(0, 1200)}`);
  }
  const result = await response.json();
  if (!result.audioContent) throw new Error(`${target.key} returned no audioContent.`);
  await writeFile(rawPath, Buffer.from(result.audioContent, "base64"));
  return "generated";
}

async function generateGroup(accessToken, targets, prefix, group) {
  const records = [];
  for (const [index, target] of targets.entries()) {
    const clipId = stableId(prefix, `${target.key}|${target.ipa}|${target.anchor}|${voiceName}`);
    const rawPath = path.join(
      rawDirectory,
      `${clipId}-${target.rawVersion || target.key}-raw.wav`
    );
    const rawStatus = await synthesize(accessToken, target, rawPath);
    if (rawOnly) {
      console.log(`${index + 1}/${targets.length} raw ${target.key} (${rawStatus}): ${rawPath}`);
      continue;
    }
    const fileName = `${clipId}-${target.key}.mp3`;
    const outputPath = path.join(audioDirectory, fileName);
    const loudness = editAndNormalize(rawPath, outputPath, target.edit);
    const probe = probeAudio(outputPath);
    const buffer = await readFile(outputPath);
    records.push({
      number: index + 1,
      clipId,
      displayText: target.description || `${target.key} — “${target.cue}”`,
      key: target.key,
      group,
      ipa: target.ipa,
      anchor: target.anchor,
      cue: target.cue,
      method: target.edit ? `Leda anchor “${target.input.text}” + manual boundary cut` : "Leda direct IPA with compact support vowel",
      audioUrl: `audio/${fileName}`,
      audioPath: outputPath,
      voice: voiceName,
      integratedLufs: Number(loudness.input_i),
      truePeakDbtp: Number(loudness.input_tp),
      meanVolumeDb: loudness.meanVolumeDb,
      maxVolumeDb: loudness.maxVolumeDb,
      durationSeconds: probe.durationSeconds,
      bytes: probe.bytes,
      sha256: sha256(buffer)
    });
    console.log(`${index + 1}/${targets.length} ${target.key} ${probe.durationSeconds.toFixed(2)}s ${loudness.meanVolumeDb.toFixed(2)} dB average`);
  }
  return records;
}

await Promise.all([
  mkdir(rawDirectory, { recursive: true }),
  mkdir(audioDirectory, { recursive: true })
]);
const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();
if (!accessToken) throw new Error("Google Application Default Credentials returned no access token.");

const atomicRecords = await generateGroup(accessToken, atomicTargets, "lp_atomic", "consistent Leda letter sound");
const legacyRecords = await generateGroup(
  accessToken,
  legacyHumanTargets,
  "lp_legacy_phoneme",
  "legacy human sound replacement"
);
const repairRecords = await generateGroup(accessToken, repairTargets, "lp_repair", "V18 full remake");
if (rawOnly) process.exit(0);

for (const [records, expected, label] of [
  [atomicRecords, 26, "atomic"],
  [legacyRecords, 17, "legacy human"],
  [repairRecords, 2, "repair"]
]) {
  if (
    records.length !== expected ||
    new Set(records.map(record => record.clipId)).size !== expected ||
    new Set(records.map(record => record.sha256)).size !== expected
  ) {
    throw new Error(`${label} output is incomplete or contains duplicate audio.`);
  }
  for (const record of records) {
    if (
      record.durationSeconds <= 0 ||
      record.bytes <= 0 ||
      record.maxVolumeDb > -1.8
    ) {
      throw new Error(`${record.clipId} failed audio validation.`);
    }
  }
}
const allRecords = [...atomicRecords, ...legacyRecords, ...repairRecords];
const sortedMeanLevels = allRecords.map(record => record.meanVolumeDb).sort((a, b) => a - b);
const achievedMedianMeanDb = sortedMeanLevels[Math.floor(sortedMeanLevels.length / 2)];
if (
  allRecords.some(record => Math.abs(record.meanVolumeDb - achievedMedianMeanDb) > 0.25)
) {
  throw new Error("The atomic bank missed its within-bank average-level consistency gate.");
}

const manifestPath = path.join(outputDirectory, "consistent-leda-atomic-v20-manifest.json");
await writeFile(
  manifestPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId,
    voice: voiceName,
    targetLufs,
    targetMeanDb,
    achievedMedianMeanDb,
    atomicCount: atomicRecords.length,
    legacyHumanCount: legacyRecords.length,
    repairCount: repairRecords.length,
    atomicRecords,
    legacyRecords,
    repairRecords
  }, null, 2)}\n`,
  "utf8"
);

const atomicHtmlPath = path.join(outputDirectory, "CONSISTENT_LEDA_ATOMIC_V20_REVIEW.html");
const repairHtmlPath = path.join(outputDirectory, "V18_TWO_REMAKES_REVIEW.html");
await writeFile(
  atomicHtmlPath,
  reviewHtml({
    title: "Same-voice basic letter sounds",
    subtitle: "43 Leda candidates · the complete A–Z set plus every additional legacy human phoneme file",
    instructions:
      "<strong>Human-ear rule:</strong> approve only when the sound is clear, compact and easy for a child to copy. The five short vowels and X were cut from a naturally spoken Leda anchor word; the consonants use exact IPA with the same small “uh” support throughout.",
    storageKey: "literacypath-consistent-leda-atomic-v20-review",
    csvName: "consistent-leda-atomic-v20-review.csv",
    records: [...atomicRecords, ...legacyRecords].map((record, index) => ({
      ...record,
      number: index + 1
    }))
  }),
  "utf8"
);
await writeFile(
  repairHtmlPath,
  reviewHtml({
    title: "The two V18 remakes",
    subtitle: "“it” is the natural word · “ou” is Leda saying “how” with the H physically removed",
    instructions:
      "<strong>Focused check:</strong> “it” should simply sound like the word <em>it</em>. “ou” should be only /aʊ/, with no H at the start and no extra vowel.",
    storageKey: "literacypath-v18-two-remakes-review",
    csvName: "v18-two-remakes-review.csv",
    records: repairRecords
  }),
  "utf8"
);

for (const [fileName, records] of [
  [
    "consistent-leda-atomic-v20-review-blank.csv",
    [...atomicRecords, ...legacyRecords].map((record, index) => ({
      ...record,
      number: index + 1
    }))
  ],
  ["v18-two-remakes-review-blank.csv", repairRecords]
]) {
  const headers = ["clip_id", "display_text", "group", "ipa", "anchor", "cue", "method", "rating", "notes", "voice", "audio_file"];
  const rows = records.map(record => [
    record.clipId, record.displayText, record.group, `/${record.ipa}/`, record.anchor,
    record.cue, record.method, "", "", record.voice, record.audioUrl
  ]);
  await writeFile(
    path.join(outputDirectory, fileName),
    [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\r\n") + "\r\n",
    "utf8"
  );
}

console.log(JSON.stringify({
  outputDirectory,
  manifestPath,
  atomicHtmlPath,
  repairHtmlPath,
  atomicCount: atomicRecords.length,
  legacyHumanCount: legacyRecords.length,
  repairCount: repairRecords.length
}, null, 2));
