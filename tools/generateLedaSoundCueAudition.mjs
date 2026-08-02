import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repositoryRoot, ".artifacts/phoneme-leda-cues");
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const processingRevision = "approved-bank-v9";

const existing = value => ({ existing: value });
const spoken = value => ({ spokenText: value });
const spokenIpa = (spokenText, ipa) => ({
  spokenText,
  ipa,
  ssml: `<speak><phoneme alphabet="ipa" ph="${ipa}">${spokenText}</phoneme></speak>`
});
const spokenIpaAtRate = (spokenText, ipa, rate) => ({
  spokenText,
  ipa,
  rate,
  ssml: `<speak><prosody rate="${rate}"><phoneme alphabet="ipa" ph="${ipa}">${spokenText}</phoneme></prosody></speak>`
});
const extracted = (source, start, duration, tempo = 1) => ({
  extracted: { source, start, duration, tempo }
});

// Child-facing Sound Seekers cues. These deliberately use familiar spoken
// approximations and letter names, rather than asking TTS to render bare IPA.
const cueGroups = Object.freeze([
  { label: "b", sound: "buh", ...spokenIpa("buh", "bʌ") },
  { label: "short e", sound: "eh", ...spoken("eh") },
  { label: "j / soft g", sound: "juh", ...spoken("juh") },
  { label: "zz", sound: "temporary fallback", ...extracted("/audio/production/en-US/isolated_word/zoo-ca272f5ac9.mp3", 0, 0.17, 0.72) },
  { label: "sh", sound: "shh", ...existing("/audio/production/en-US/isolated_word/shh-4250bf0fc7.mp3") },
  { label: "ch", sound: "chuh", ...spokenIpa("chuh", "tʃʌ") },
  { label: "th as in thin", sound: "unvoiced th", ...spokenIpa("thuh", "θʌ") },
  { label: "th as in this", sound: "voiced th", ...spokenIpa("thuh", "ðʌ") },
  { label: "nk", sound: "unk", ...spoken("unk") },
  { label: "long A — a-e, ai, ay", sound: "A", ...existing("/audio/production/en-US/letter_name/a-letter-name-383d581f63.mp3") },
  { label: "long E — final y, e-e, ee, ea", sound: "E", ...existing("/audio/production/en-US/letter_name/e-letter-name-772c8c22cd.mp3") },
  { label: "long I — final y, i-e, igh, ie", sound: "eye / I", ...existing("/audio/production/en-US/isolated_word/eye-33a9b9a6f0.mp3") },
  { label: "long O — o-e, oa, ow, oe", sound: "O", ...existing("/audio/production/en-US/letter_name/o-letter-name-9653d9833d.mp3") },
  { label: "long U — u-e", sound: "U", ...existing("/audio/production/en-US/letter_name/u-letter-name-a5c579d369.mp3") },
  { label: "oo / ue / ew as in grew", sound: "ooh", ...spoken("ooh") },
  { label: "ew as in few", sound: "you", ...existing("/audio/production/en-US/isolated_word/you-a7930e4854.mp3") },
  { label: "short oo as in book — B · held slightly", sound: "short oo", ...spokenIpaAtRate("oo", "ʊː", "85%") },
  { label: "ow as in cow", sound: "ow", ...existing("/audio/production/en-US/isolated_word/ow-3707647eab.mp3") },
  { label: "oi / oy", sound: "oy", ...existing("/audio/production/en-US/isolated_word/oy-f5158ce8d0.mp3") },
  { label: "or / ore", sound: "or", ...existing("/audio/production/en-US/isolated_word/or-e2c1a926c4.mp3") },
  { label: "aw", sound: "awe", ...spoken("awe") },
  { label: "er / ir / ur", sound: "er", ...existing("/audio/production/en-US/isolated_word/er-8333303e8d.mp3") },
  { label: "air / are", sound: "air", ...existing("/audio/production/en-US/isolated_word/air-28bbabaa35.mp3") },
  { label: "ear", sound: "ear", ...existing("/audio/production/en-US/isolated_word/ear-01e4f2a510.mp3") },
  { label: "ure", sound: "your", ...existing("/audio/production/en-US/isolated_word/your-1e8aa4b51f.mp3") },
  { label: "soft c", sound: "same as basic s", ...existing("/audio/phonemes/s.mp3") },
  { label: "ch saying k", sound: "kuh", ...spokenIpa("kuh", "kʌ") },
  { label: "le as in little — B · child-friendly ull", sound: "ul", ...spokenIpaAtRate("ul", "ʌl", "80%") },
  { label: "tion as in action", sound: "shun", ...spoken("shun") }
]);

const approvedLabels = new Set([
  "b",
  "zz",
  "ch",
  "th as in thin",
  "th as in this",
  "ch saying k",
  "short oo as in book — B · held slightly",
  "le as in little — B · child-friendly ull",
  "soft c",
  "j / soft g",
  "short e",
  "sh",
  "nk",
  "long A — a-e, ai, ay",
  "long E — final y, e-e, ee, ea",
  "long I — final y, i-e, igh, ie",
  "long O — o-e, oa, ow, oe",
  "long U — u-e",
  "oo / ue / ew as in grew",
  "ew as in few",
  "ow as in cow",
  "oi / oy",
  "or / ore",
  "aw",
  "er / ir / ur",
  "air / are",
  "ear",
  "ure",
  "tion as in action"
]);

const roundTwoApprovedGeneratedLabels = new Set([
  "short e",
  "nk",
  "oo / ue / ew as in grew",
  "aw",
  "tion as in action"
]);

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

async function exists(filePath) {
  try {
    return (await stat(filePath)).size > 0;
  } catch {
    return false;
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(String(result.stderr || result.stdout));
}

async function synthesize(accessToken, cue, wavPath) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: cue.ssml ? { ssml: cue.ssml } : { text: cue.spokenText },
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
    })
  });
  if (!response.ok) throw new Error(`${cue.label}: ${response.status} ${await response.text()}`);
  const result = await response.json();
  await writeFile(wavPath, Buffer.from(result.audioContent, "base64"));
}

await mkdir(outputRoot, { recursive: true });
const generated = cueGroups.filter(cue => cue.spokenText);
const accessToken = generated.length
  ? execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8" }).trim()
  : "";

const rows = [];
for (const cue of cueGroups) {
  const audioRevision = approvedLabels.has(cue.label)
    ? "approved-round-1"
    : cue.spokenText
      ? processingRevision
      : "approved-existing";
  const legacyApprovedId = cue.label === "j / soft g"
    ? `${slug(cue.label)}-${hash(`${voiceName}|${cue.sound}`)}`
    : roundTwoApprovedGeneratedLabels.has(cue.label)
      ? `${slug(cue.label)}-${hash(`${voiceName}|${cue.sound}|edge-safe-v2`)}`
    : "";
  const audioSource = cue.ssml || cue.spokenText || cue.existing || JSON.stringify(cue.extracted);
  const id = legacyApprovedId || `${slug(cue.label)}-${hash(`${voiceName}|${cue.sound}|${audioSource}|${audioRevision}`)}`;
  const fileName = `${id}.mp3`;
  const outputPath = path.join(outputRoot, fileName);
  if (cue.existing) {
    const sourcePath = path.join(repositoryRoot, "public", cue.existing.replace(/^\/+/, ""));
    if (!(await exists(sourcePath))) throw new Error(`Missing approved Leda source: ${cue.existing}`);
    await copyFile(sourcePath, outputPath);
  } else if (cue.extracted && !(await exists(outputPath))) {
    const sourcePath = path.join(repositoryRoot, "public", cue.extracted.source.replace(/^\/+/, ""));
    if (!(await exists(sourcePath))) throw new Error(`Missing carrier-word source: ${cue.extracted.source}`);
    const outputDuration = cue.extracted.duration / cue.extracted.tempo;
    const fadeOutStart = Math.max(0.02, outputDuration - 0.018).toFixed(3);
    run("ffmpeg", [
      "-y", "-hide_banner", "-loglevel", "error",
      "-ss", String(cue.extracted.start), "-t", String(cue.extracted.duration), "-i", sourcePath,
      "-af", `atempo=${cue.extracted.tempo},loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.01,afade=t=out:st=${fadeOutStart}:d=0.018`,
      "-codec:a", "libmp3lame", "-b:a", "128k", outputPath
    ]);
  } else if (!(await exists(outputPath))) {
    const wavPath = outputPath.replace(/\.mp3$/i, ".wav");
    await synthesize(accessToken, cue, wavPath);
    const finalFilter = cue.finalTrim
      ? [
          "silenceremove=start_periods=1:start_duration=0.015:start_threshold=-42dB",
          "areverse",
          "silenceremove=start_periods=1:start_duration=0.015:start_threshold=-42dB",
          `atrim=start=${cue.finalTrim.shortenEnd}`,
          `afade=t=in:st=0:d=${cue.finalTrim.fadeOut}`,
          "areverse",
          "asetpts=PTS-STARTPTS",
          "loudnorm=I=-24:TP=-2:LRA=7",
          "afade=t=in:st=0:d=0.008"
        ].join(",")
      : "loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.012";
    run("ffmpeg", [
      "-y", "-hide_banner", "-loglevel", "error", "-i", wavPath,
      // Stop consonants contain quiet closures. Trimming on the first quiet
      // region cut the original cues off inside the sound.
      "-af", finalFilter,
      "-codec:a", "libmp3lame", "-b:a", "128k", outputPath
    ]);
    await unlink(wavPath);
  }
  rows.push({ ...cue, fileName });
}

const reviewRows = rows.filter(row => !approvedLabels.has(row.label));
const cards = reviewRows.map((row, index) => `
  <article class="cue" data-cue="${index}">
    <div><h2>${row.label}</h2><p>Leda says <strong>${row.sound}</strong></p></div>
    <audio controls preload="metadata" src="${row.fileName}"></audio>
    <div class="verdicts">
      <button type="button" data-verdict="yay">Yay</button>
      <button type="button" data-verdict="nay">Nay</button>
    </div>
  </article>`).join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Leda sound-cue audition — approved bank</title>
<style>
:root{font-family:Inter,ui-rounded,system-ui,sans-serif;color:#17362b;background:#f5efe3}*{box-sizing:border-box}
body{max-width:1040px;margin:auto;padding:32px}header{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:22px}
h1{margin:0;font-size:38px}header p{max-width:62ch;color:#53665e;line-height:1.45}.cue{display:grid;grid-template-columns:minmax(210px,1fr) minmax(280px,1.25fr) auto;gap:18px;align-items:center;padding:16px 18px;margin:10px 0;background:#fff;border:2px solid #dfd6c7;border-radius:16px}.cue h2{margin:0 0 3px;font-size:19px}.cue p{margin:0;color:#68786f}.cue audio{width:100%}.verdicts{display:flex;gap:7px}.verdicts button{border:1px solid #aab8b0;background:#f8faf8;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}.cue[data-selected="yay"]{border-color:#3a936a;background:#f3fff7}.cue[data-selected="nay"]{border-color:#cc605c;background:#fff5f3}.cue[data-selected="yay"] [data-verdict="yay"]{background:#267a55;color:#fff}.cue[data-selected="nay"] [data-verdict="nay"]{background:#b84542;color:#fff}#summary{position:sticky;bottom:14px;width:100%;margin-top:24px;padding:15px;border:0;border-radius:14px;background:#17362b;color:white;font-weight:900;font-size:16px;cursor:pointer}@media(max-width:760px){body{padding:18px}.cue{grid-template-columns:1fr}.verdicts button{flex:1}header{display:block}}
</style></head><body><header><div><h1>Approved phoneme bank</h1><p>All 29 reviewed cues are locked. zz uses the temporary lengthened-zoo fallback and soft c reuses the basic s recording until a future human recording session.</p></div></header>${cards}<button id="summary">Copy my verdicts</button>
<script>
const key='literacypath-leda-cue-verdicts-v9';const saved=JSON.parse(localStorage.getItem(key)||'{}');
document.querySelectorAll('.cue').forEach((card,i)=>{if(saved[i])card.dataset.selected=saved[i];card.querySelectorAll('button').forEach(button=>button.onclick=()=>{card.dataset.selected=button.dataset.verdict;saved[i]=button.dataset.verdict;localStorage.setItem(key,JSON.stringify(saved));});});
document.querySelector('#summary').onclick=async()=>{const lines=[...document.querySelectorAll('.cue')].map((card,i)=>card.dataset.selected?card.querySelector('h2').textContent+': '+card.dataset.selected.toUpperCase():null).filter(Boolean);await navigator.clipboard.writeText(lines.join(String.fromCharCode(10)));document.querySelector('#summary').textContent='Copied — paste it back to Codex';};
</script></body></html>`;
await writeFile(path.join(outputRoot, "index.html"), html);
await writeFile(path.join(outputRoot, "audition.json"), JSON.stringify({ voice: voiceName, approvedLabels: [...approvedLabels], rows }, null, 2));
console.log(`Leda audition ready: ${reviewRows.length} revised cues; ${approvedLabels.size} approved cues retained at ${path.join(outputRoot, "index.html")}`);
