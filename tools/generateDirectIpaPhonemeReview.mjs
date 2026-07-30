import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const sourceManifestPath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v10/phonetic-cue-trial-manifest.json"
);
const decisionsPath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v11/v10-trial-decisions.json"
);
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v12-direct-ipa"
);
const audioDirectory = path.join(outputDirectory, "audio");
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function patternFromDisplayText(displayText) {
  return String(displayText).split(/\s+—\s+/u)[0].trim();
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function probeAudio(filePath) {
  const result = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size",
      "-of",
      "json",
      filePath
    ],
    { encoding: "utf8" }
  );
  const parsed = JSON.parse(result);
  return {
    durationSeconds: Number(parsed.format.duration),
    bytes: Number(parsed.format.size)
  };
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function buildReviewHtml(records) {
  const embeddedRecords = JSON.stringify(records).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Direct IPA Missing Phonemes — Human Review</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #182334;
      --muted: #657184;
      --paper: #f5f2eb;
      --card: #ffffff;
      --line: #d9dee6;
      --navy: #173354;
      --blue: #2f6f9f;
      --yes: #2f7d57;
      --yes-bg: #e6f4ec;
      --maybe: #a8671a;
      --maybe-bg: #fff1d8;
      --no: #a33f47;
      --no-bg: #fbe8ea;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 20;
      padding: 18px clamp(18px, 4vw, 56px);
      background: rgba(23, 51, 84, 0.98);
      color: #fff;
      box-shadow: 0 8px 24px rgba(20, 34, 52, 0.18);
    }
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      max-width: 1260px;
      margin: 0 auto;
    }
    h1 {
      margin: 0 0 4px;
      font-size: clamp(20px, 2.6vw, 32px);
      line-height: 1.12;
      letter-spacing: -0.025em;
    }
    .subtitle {
      margin: 0;
      color: #d9e6f3;
      font-size: 14px;
    }
    .progress-box {
      min-width: 170px;
      text-align: right;
    }
    #progress-count {
      display: block;
      margin-bottom: 7px;
      font-weight: 750;
      font-variant-numeric: tabular-nums;
    }
    .progress-track {
      width: 170px;
      height: 8px;
      margin-left: auto;
      overflow: hidden;
      border-radius: 99px;
      background: rgba(255,255,255,0.18);
    }
    #progress-fill {
      height: 100%;
      width: 0;
      background: #7fd3a7;
      transition: width 180ms ease;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      max-width: 1260px;
      margin: 18px auto 0;
    }
    .toolbar button, .toolbar select {
      min-height: 38px;
      border: 1px solid rgba(255,255,255,0.32);
      border-radius: 9px;
      background: rgba(255,255,255,0.10);
      color: #fff;
      padding: 8px 12px;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
    }
    .toolbar select option { color: var(--ink); }
    .toolbar button.primary {
      border-color: #7fd3a7;
      background: #7fd3a7;
      color: #102d20;
    }
    .toolbar button.danger {
      margin-left: auto;
      color: #ffd9dc;
    }
    main {
      max-width: 1260px;
      margin: 0 auto;
      padding: 28px clamp(18px, 4vw, 56px) 80px;
    }
    .instructions {
      margin: 0 0 20px;
      padding: 16px 18px;
      border: 1px solid #cbd8e5;
      border-left: 5px solid var(--blue);
      border-radius: 10px;
      background: #eef5fa;
      line-height: 1.5;
    }
    .instructions strong { color: var(--navy); }
    #cards {
      display: grid;
      gap: 14px;
    }
    .card {
      display: grid;
      grid-template-columns: minmax(190px, 0.8fr) minmax(260px, 1.2fr) minmax(290px, 1fr);
      gap: 24px;
      align-items: center;
      padding: 20px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--card);
      box-shadow: 0 4px 14px rgba(24, 35, 52, 0.055);
      scroll-margin-top: 180px;
    }
    .card[data-rating="Yes"] { border-left: 6px solid var(--yes); }
    .card[data-rating="Maybe"] { border-left: 6px solid var(--maybe); }
    .card[data-rating="No"] { border-left: 6px solid var(--no); }
    .index {
      margin-bottom: 5px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .pattern {
      margin: 0;
      font-size: 22px;
      letter-spacing: -0.015em;
    }
    .target {
      margin: 7px 0 0;
      color: var(--muted);
      font-size: 14px;
    }
    .ipa {
      display: inline-block;
      margin-left: 4px;
      color: var(--navy);
      font-family: "Noto Sans", "Arial Unicode MS", sans-serif;
      font-size: 17px;
      font-weight: 750;
    }
    audio {
      display: block;
      width: 100%;
      min-width: 240px;
    }
    .audio-meta {
      margin-top: 7px;
      color: var(--muted);
      font-size: 12px;
    }
    .rating-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .rating {
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: #fff;
      color: var(--ink);
      font: inherit;
      font-weight: 760;
      cursor: pointer;
      transition: transform 100ms ease, border-color 100ms ease, background 100ms ease;
    }
    .rating:hover { transform: translateY(-1px); }
    .rating.yes[aria-pressed="true"] {
      border-color: var(--yes);
      background: var(--yes-bg);
      color: var(--yes);
    }
    .rating.maybe[aria-pressed="true"] {
      border-color: var(--maybe);
      background: var(--maybe-bg);
      color: var(--maybe);
    }
    .rating.no[aria-pressed="true"] {
      border-color: var(--no);
      background: var(--no-bg);
      color: var(--no);
    }
    .notes {
      width: 100%;
      min-height: 38px;
      margin-top: 9px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px 10px;
      font: inherit;
    }
    .empty {
      padding: 44px;
      border: 1px dashed #b6bfca;
      border-radius: 14px;
      background: rgba(255,255,255,0.55);
      color: var(--muted);
      text-align: center;
    }
    @media (max-width: 900px) {
      .header-row { align-items: flex-start; }
      .card { grid-template-columns: 1fr; gap: 15px; }
      .progress-box { min-width: 130px; }
      .progress-track { width: 130px; }
      .toolbar button.danger { margin-left: 0; }
    }
    @media (max-width: 560px) {
      .header-row { display: block; }
      .progress-box { margin-top: 12px; text-align: left; }
      .progress-track { margin-left: 0; }
      .rating-group { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-row">
      <div>
        <h1>Missing phonemes — direct IPA review</h1>
        <p class="subtitle">33 Google Chirp 3 HD Leda candidates · generated from exact IPA</p>
      </div>
      <div class="progress-box">
        <span id="progress-count">0 of 33 rated</span>
        <div class="progress-track"><div id="progress-fill"></div></div>
      </div>
    </div>
    <div class="toolbar">
      <select id="filter" aria-label="Filter ratings">
        <option value="All">Show all</option>
        <option value="Unrated">Unrated only</option>
        <option value="Yes">Yes only</option>
        <option value="Maybe">Maybe only</option>
        <option value="No">No only</option>
      </select>
      <button id="play-next" type="button">Play first unrated</button>
      <button id="export" class="primary" type="button">Download review CSV</button>
      <button id="reset" class="danger" type="button">Reset ratings</button>
    </div>
  </header>
  <main>
    <div class="instructions">
      <strong>Human-ear rule:</strong> approve only if the clip says the isolated sound shown in IPA,
      clearly and without a letter name, extra word, or added “uh” sound. The anchor word is a reference
      only; it should not be spoken. Blank ratings remain unreviewed.
    </div>
    <div id="cards"></div>
  </main>
  <script>
    const records = ${embeddedRecords};
    const storageKey = "literacypath-direct-ipa-v12-review";
    const state = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const cardsElement = document.getElementById("cards");
    const filterElement = document.getElementById("filter");

    function save() {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }

    function updateProgress() {
      const rated = records.filter(record => state[record.clipId]?.rating).length;
      document.getElementById("progress-count").textContent =
        rated + " of " + records.length + " rated";
      document.getElementById("progress-fill").style.width =
        ((rated / records.length) * 100).toFixed(1) + "%";
    }

    function setRating(clipId, rating) {
      state[clipId] = { ...(state[clipId] || {}), rating };
      save();
      render();
    }

    function setNotes(clipId, notes) {
      state[clipId] = { ...(state[clipId] || {}), notes };
      save();
    }

    function matchesFilter(record) {
      const selected = filterElement.value;
      const rating = state[record.clipId]?.rating || "";
      if (selected === "All") return true;
      if (selected === "Unrated") return !rating;
      return rating === selected;
    }

    function render() {
      cardsElement.replaceChildren();
      const visible = records.filter(matchesFilter);
      if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No recordings match this filter.";
        cardsElement.append(empty);
      }
      visible.forEach(record => {
        const saved = state[record.clipId] || {};
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.clipId = record.clipId;
        card.dataset.rating = saved.rating || "";

        const identity = document.createElement("div");
        identity.innerHTML =
          '<div class="index">' + String(record.number).padStart(2, "0") + ' · missing phoneme</div>' +
          '<h2 class="pattern">' + record.displayText + '</h2>' +
          '<p class="target">Target <span class="ipa">/' + record.ipa + '/</span> · anchor “' +
          record.anchor + '”</p>';

        const listening = document.createElement("div");
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.preload = "metadata";
        audio.src = record.audioUrl;
        audio.setAttribute("aria-label", "Play " + record.displayText);
        const meta = document.createElement("div");
        meta.className = "audio-meta";
        meta.textContent =
          record.voice + " · " + record.durationSeconds.toFixed(2) + " seconds · direct IPA";
        listening.append(audio, meta);

        const review = document.createElement("div");
        const group = document.createElement("div");
        group.className = "rating-group";
        ["Yes", "Maybe", "No"].forEach(rating => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "rating " + rating.toLowerCase();
          button.textContent = rating;
          button.setAttribute("aria-pressed", String(saved.rating === rating));
          button.addEventListener("click", () => setRating(record.clipId, rating));
          group.append(button);
        });
        const notes = document.createElement("input");
        notes.className = "notes";
        notes.type = "text";
        notes.value = saved.notes || "";
        notes.placeholder = "Optional note: what sounded wrong?";
        notes.setAttribute("aria-label", "Notes for " + record.displayText);
        notes.addEventListener("input", event => setNotes(record.clipId, event.target.value));
        review.append(group, notes);

        card.append(identity, listening, review);
        cardsElement.append(card);
      });
      updateProgress();
    }

    function playFirstUnrated() {
      filterElement.value = "Unrated";
      render();
      const first = cardsElement.querySelector(".card");
      if (!first) return;
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      first.querySelector("audio")?.play();
    }

    function exportCsv() {
      const headers = [
        "clip_id",
        "display_text",
        "ipa",
        "anchor",
        "rating",
        "notes",
        "voice",
        "audio_file"
      ];
      const rows = records.map(record => {
        const saved = state[record.clipId] || {};
        return [
          record.clipId,
          record.displayText,
          "/" + record.ipa + "/",
          record.anchor,
          saved.rating || "",
          saved.notes || "",
          record.voice,
          record.audioUrl
        ];
      });
      const csv = [headers, ...rows]
        .map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(","))
        .join("\\r\\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "direct-ipa-missing-phonemes-v12-review.csv";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    filterElement.addEventListener("change", render);
    document.getElementById("play-next").addEventListener("click", playFirstUnrated);
    document.getElementById("export").addEventListener("click", exportCsv);
    document.getElementById("reset").addEventListener("click", () => {
      if (!confirm("Clear all ratings and notes from this review form?")) return;
      Object.keys(state).forEach(key => delete state[key]);
      save();
      filterElement.value = "All";
      render();
    });
    render();
  </script>
</body>
</html>`;
}

const [sourceManifest, decisions] = await Promise.all([
  readFile(sourceManifestPath, "utf8").then(JSON.parse),
  readFile(decisionsPath, "utf8").then(JSON.parse)
]);

const rejectedIds = new Set(
  decisions.remaining
    .filter(decision => decision.rating === "No")
    .map(decision => decision.clip_id)
);
const missingRecords = sourceManifest.records
  .filter(record => rejectedIds.has(record.clipId))
  .sort((left, right) => left.displayText.localeCompare(right.displayText));

if (missingRecords.length !== 33 || rejectedIds.size !== 33) {
  throw new Error(
    `Expected exactly 33 rejected targets; found ${missingRecords.length} manifest rows and ${rejectedIds.size} decision IDs.`
  );
}

await mkdir(audioDirectory, { recursive: true });
const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();

if (!accessToken) {
  throw new Error("Google Application Default Credentials did not return an access token.");
}

const generatedRecords = [];
for (const [index, record] of missingRecords.entries()) {
  const pattern = patternFromDisplayText(record.displayText);
  const ipa = String(record.pronunciation || "").trim();
  if (!pattern || !ipa || !record.anchorExample) {
    throw new Error(`Incomplete phoneme metadata for ${record.clipId}.`);
  }

  const ssml =
    `<speak><phoneme alphabet="ipa" ph="${escapeXml(ipa)}">` +
    `${escapeXml(pattern)}</phoneme></speak>`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { ssml },
      voice: {
        languageCode: "en-US",
        name: voiceName
      },
      audioConfig: {
        audioEncoding: "MP3"
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `${record.clipId} failed with ${response.status}: ${errorBody.slice(0, 1200)}`
    );
  }

  const result = await response.json();
  if (!result.audioContent) {
    throw new Error(`${record.clipId} returned no audioContent.`);
  }

  const audioBuffer = Buffer.from(result.audioContent, "base64");
  const audioFileName = `${record.clipId}.mp3`;
  const audioPath = path.join(audioDirectory, audioFileName);
  await writeFile(audioPath, audioBuffer);
  const probe = probeAudio(audioPath);

  if (
    !Number.isFinite(probe.durationSeconds) ||
    probe.durationSeconds <= 0 ||
    probe.bytes <= 0
  ) {
    throw new Error(`${record.clipId} produced an invalid MP3.`);
  }

  generatedRecords.push({
    number: index + 1,
    clipId: record.clipId,
    displayText: record.displayText,
    pattern,
    ipa,
    anchor: record.anchorExample,
    audioUrl: `audio/${audioFileName}`,
    audioPath,
    voice: voiceName,
    languageCode: "en-US",
    engine: "Google Cloud Text-to-Speech Chirp 3 HD",
    generationMethod: "SSML phoneme alphabet=ipa",
    ssml,
    durationSeconds: probe.durationSeconds,
    bytes: probe.bytes,
    sha256: sha256(audioBuffer),
    sourceReviewRating: "No",
    productionOutputPath: record.proposedOutputPath
  });
  console.log(
    `${String(index + 1).padStart(2, "0")}/33 ${record.displayText} /${ipa}/ ` +
    `${probe.durationSeconds.toFixed(2)}s`
  );
}

const manifestOutputPath = path.join(
  outputDirectory,
  "direct-ipa-missing-phonemes-v12-manifest.json"
);
const reviewHtmlPath = path.join(
  outputDirectory,
  "DIRECT_IPA_MISSING_PHONEMES_REVIEW.html"
);
const blankCsvPath = path.join(
  outputDirectory,
  "direct-ipa-missing-phonemes-v12-review-blank.csv"
);

await writeFile(
  manifestOutputPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId,
    voice: voiceName,
    sourceManifestPath,
    decisionsPath,
    count: generatedRecords.length,
    records: generatedRecords
  }, null, 2)}\n`,
  "utf8"
);
await writeFile(reviewHtmlPath, buildReviewHtml(generatedRecords), "utf8");

const blankCsvHeaders = [
  "clip_id",
  "display_text",
  "ipa",
  "anchor",
  "rating",
  "notes",
  "voice",
  "audio_file"
];
const blankCsvRows = generatedRecords.map(record => [
  record.clipId,
  record.displayText,
  `/${record.ipa}/`,
  record.anchor,
  "",
  "",
  record.voice,
  record.audioUrl
]);
await writeFile(
  blankCsvPath,
  [blankCsvHeaders, ...blankCsvRows]
    .map(row => row.map(csvEscape).join(","))
    .join("\r\n") + "\r\n",
  "utf8"
);

console.log(JSON.stringify({
  outputDirectory,
  reviewHtmlPath,
  manifestOutputPath,
  blankCsvPath,
  generated: generatedRecords.length
}));
