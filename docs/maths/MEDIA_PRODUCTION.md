# Maths audio, image and media production specification

## 1. Media principles

- No child voice, face, camera input or image upload.
- Narration and spoken instructions use the existing production voice
  `en-US-Chirp3-HD-Leda`.
- Number Story page audio is word-for-word exact text.
- Mathematical symbols receive authored spoken forms: `7 + 3 = 10` is spoken as
  “Seven plus three equals ten.”
- Essential instructions exist as visible text and can be replayed.
- Correctness cannot depend on music, pitch, colour or animation.
- Every countable illustration has a machine-readable quantity specification.
- Songs use original LiteracyPath lyrics and prefer a complete adult or
  synthetic-adult vocal performance exported from the authorised Suno account.
  Until a performed take passes the local audio, caption and provenance gate,
  the player labels and uses the owned backing track plus adult Leda lyric guide
  as a fallback. Leda speech is never labelled as singing.

## 2. Directory contract

```text
public/
├── audio/production/en-US/
│   ├── maths_instruction/
│   ├── maths_feedback/
│   ├── maths_story_page/
│   ├── maths_story_word/
│   ├── maths_song_guide/
│   └── maths_vocabulary/
├── audio/music/maths/
│   ├── songs/
│   └── arcade/
├── audio/sfx/maths/
└── images/maths/
    ├── stories/<story-id>/
    ├── objects/
    ├── manipulatives/
    └── arcade/<game-id>/
```

## 3. Audio source manifest

Create `src/maths/media/mathsAudioSourceManifest.js` as the only authored source:

```js
import { mathsStories } from "../stories/mathsStoryCatalog.js";
import { mathsAssessmentBank } from "../assessment/mathsAssessmentBank.js";
import { mathsActivityRecipes } from "../learn/mathsActivityRecipes.js";

const normalize = value => String(value || "").replace(/\s+/g, " ").trim();

export const mathsAudioRequests = Object.freeze([
  ...mathsStories.flatMap(story => story.pages.map(page => ({
    id: `story:${story.id}:page:${page.pageNumber}`,
    role: "maths_story_page",
    exactText: normalize(page.exactText),
    ownerId: story.id
  }))),
  ...mathsAssessmentBank.map(item => ({
    id: `assessment:${item.id}:prompt`,
    role: "maths_instruction",
    exactText: normalize(item.promptText),
    ownerId: item.id
  })),
  ...mathsActivityRecipes.map(recipe => ({
    id: `activity:${recipe.id}:instruction`,
    role: "maths_instruction",
    exactText: normalize(recipe.instructionText),
    ownerId: recipe.id
  }))
]);
```

Deduplicate only by `(voice, role, exactText)`. Do not deduplicate across roles
because pacing for a story page may differ from an assessment instruction.

## 4. LEDA generation script

Create `tools/generateMathsLedaAudio.mjs`:

```js
#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mathsAudioRequests } from "../src/maths/media/mathsAudioSourceManifest.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const voice = "en-US-Chirp3-HD-Leda";
const languageCode = "en-US";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const projectId = process.env.GOOGLE_CLOUD_PROJECT || "project-3c66c1c8-cc9e-4d6d-bdf";
const roleFilter = process.argv.find(arg => arg.startsWith("--role="))?.split("=")[1] || "";
const ownerFilter = process.argv.find(arg => arg.startsWith("--owner="))?.split("=")[1] || "";
const dryRun = process.argv.includes("--dry-run");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const hash = value => createHash("sha256").update(value).digest("hex").slice(0, 12);
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);

const requests = mathsAudioRequests.filter(request =>
  (!roleFilter || request.role === roleFilter) &&
  (!ownerFilter || request.ownerId === ownerFilter)
);

function outputFor(request) {
  const fingerprint = hash(`${voice}|${request.role}|${request.exactText}`);
  const fileName = `${slug(request.exactText)}-${fingerprint}.mp3`;
  const publicDir = `/audio/production/en-US/${request.role}`;
  return {
    absoluteDir: path.join(root, "public", publicDir),
    absolutePath: path.join(root, "public", publicDir, fileName),
    publicPath: `${publicDir}/${fileName}`,
    fingerprint
  };
}

async function synthesize(token, text) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
        "x-goog-user-project": projectId
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voice },
        audioConfig: {
          audioEncoding: "LINEAR16",
          sampleRateHertz: 24000,
          speakingRate: 0.94,
          pitch: 0
        }
      })
    });
    if (response.ok) {
      const payload = await response.json();
      return Buffer.from(payload.audioContent, "base64");
    }
    const detail = await response.text();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 6) {
      throw new Error(`LEDA synthesis failed (${response.status}): ${detail.slice(0, 500)}`);
    }
    await wait(Math.min(30000, 1500 * (2 ** (attempt - 1))));
  }
  throw new Error("Unreachable synthesis state");
}

function normalizeMp3(wavPath, mp3Path) {
  const result = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", wavPath,
    "-af", "highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,afade=t=out:st=0:d=0.025",
    "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", mp3Path
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg normalization failed");
}

const manifest = [];
const token = dryRun ? "" : execFileSync(
  "gcloud", ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();

for (let index = 0; index < requests.length; index += 1) {
  const request = requests[index];
  const output = outputFor(request);
  await fs.mkdir(output.absoluteDir, { recursive: true });
  const exists = await fs.stat(output.absolutePath).catch(() => null);
  if (!exists && !dryRun) {
    const wavPath = output.absolutePath.replace(/\.mp3$/, ".wav");
    await fs.writeFile(wavPath, await synthesize(token, request.exactText));
    normalizeMp3(wavPath, output.absolutePath);
    await fs.unlink(wavPath);
    await wait(700);
  }
  manifest.push({
    ...request,
    voice,
    publicPath: output.publicPath,
    fingerprint: output.fingerprint,
    status: dryRun ? "planned" : "accepted-until-flagged"
  });
  console.log(`[${index + 1}/${requests.length}] ${request.id} -> ${output.publicPath}`);
}

if (!dryRun) {
  const generated = [
    "// AUTO-GENERATED by tools/generateMathsLedaAudio.mjs. Do not edit.",
    `export const MATHS_LEDA_VOICE = ${JSON.stringify(voice)};`,
    `export const mathsLedaAudioManifest = Object.freeze(${JSON.stringify(manifest, null, 2)});`,
    "export const mathsLedaAudioById = new Map(mathsLedaAudioManifest.map(row => [row.id, row.publicPath]));",
    ""
  ].join("\n");
  await fs.mkdir(path.join(root, "src/maths/media/generated"), { recursive: true });
  await fs.writeFile(
    path.join(root, "src/maths/media/generated/mathsLedaAudio.generated.js"),
    generated
  );
}
```

Add scripts:

```json
{
  "generate:maths-leda-audio": "node tools/generateMathsLedaAudio.mjs",
  "check:maths-audio": "node tools/checkMathsAudio.mjs",
  "sheet:maths-audio-review": "node tools/buildMathsAudioReviewSheet.mjs"
}
```

## 5. Audio quality gate

`tools/checkMathsAudio.mjs` must verify:

- every authored request has exactly one manifest row;
- the manifest fingerprint matches current exact text;
- file exists, is non-empty MP3, mono 44.1 kHz, at or below 128 kbps;
- integrated loudness target is -24 LUFS ±2 and true peak no higher than -2 dB;
- no clip is shorter than 250 ms or contains excessive leading/trailing silence;
- no browser speech synthesis is used when an approved file exists;
- story reader and assessment prompt resolve the same exact text recorded in the
  manifest;
- technically valid clips receive `accepted-until-flagged` and enter runtime;
- every player can flag its exact request ID; flagged clips leave the runtime map
  on the next manifest release and remain in the private review queue until repaired.

## 6. Vocabulary audio list

Generate isolated pronunciation for:

```text
zero through one hundred; hundred; thousand; more; fewer; less; equal; same;
altogether; part; whole; add; plus; subtract; minus; difference; share; group;
each; row; array; double; half; quarter; eighth; pattern; repeat; length; mass;
capacity; duration; longer; shorter; heavier; lighter; full; empty; before;
after; hour; half past; quarter past; quarter to; side; corner; edge; face;
curved; straight; turn; slide; flip; tally; graph; category; possible;
impossible; certain; likely; unlikely
```

Number pronunciation must be locale-tested, especially teens, tens and hundreds.

## 7. Feedback audio

Feedback is structural, not praise-only. Required reusable lines include:

```text
Count each object once.
Move each object as you count it.
The last number tells how many altogether.
Line up the starting points.
There is a gap. Move the units together.
You made six. Add one more to make seven.
You made eight. Remove one to make seven.
The groups are not equal yet. Deal one to each group.
Start at eight. The first jump lands on nine.
The 4 is in the tens place. It means four tens.
Turn the shape and count its sides again.
Try another representation.
Show the same number a different way.
```

Item-specific feedback is authored in activity/assessment manifests and generated
through the same pipeline.

## 8. Song production

For each song create:

```text
<song-id>-performed.mp3
<song-id>-instrumental.mp3
<song-id>-lyrics.vtt
<song-id>-credits.json
```

Workflow:

1. Lock lyrics and mathematical language.
2. Compose an original melody and arrangement; store BPM, key and chord chart.
3. Generate candidate full-song performances in the authorised Suno account;
   use only an adult or synthetic-adult vocal treatment.
4. Select and export one take as the song's canonical performed MP3. Record the
   Suno track ID, model version, generation and selection dates, rights basis and
   exported-file SHA-256 in the authoritative song record and matching credits.
5. Author exact-line WebVTT captions from the locked lyrics. Timings must follow
   the selected take; never invent proportional or estimated lyric timing.
6. Keep the existing deterministic instrumental and LEDA spoken guide as the
   clearly labelled offline-safe fallback.
7. Complete the technical media check. The player may prefer the performed song
   only when its status is `accepted-until-flagged` or `approved` and the local
   MP3, WebVTT, credits and SHA-256 all agree.
8. A flag against the exact performed song immediately moves that player to the
   backing-track fallback while the performed take is reviewed.

Never use a child vocalist. Never describe LEDA speech as singing. Songs play only
after a user gesture; lyrics remain available as text even when audio cannot play.

## 9. Arcade music and SFX

Create eight 35–55 second seamless stereo loops, one per game, at 44.1 kHz and at
or below 160 kbps. Music ducks 8–10 dB under speech. Reduced-sensory mode disables
music while preserving essential feedback.

SFX semantic set:

- place object;
- remove object;
- snap to group;
- complete equal group;
- number-line hop;
- exchange ten ones for one ten;
- reveal hidden part;
- neutral retry;
- correct structure confirmed;
- story page turn.

No harsh buzzers, alarms, casino sounds or variable-ratio reward fanfares.

## 10. Story illustration manifest

Create `src/maths/stories/mathsStoryIllustrationManifest.js` from the page beats in
the content pack:

```ts
type MathsIllustrationRequest = {
  storyId: string;
  pageNumber: number;
  exactText: string;
  countableSets: Array<{
    object: string;
    count: number;
    groupId: string;
    arrangement: string;
  }>;
  forbiddenCountables: string[];
  continuityState: Record<string, unknown>;
  prompt: string;
};
```

Prompt template:

```text
Warm premium children's picture-book illustration in the established Meadow Pals
style. Show exactly: {illustrationBeat}. Mathematical inventory: {countableSets}.
Every countable object must be fully visible, separate and match the exact count.
Do not add decorative objects from these categories: {forbiddenCountables}. Keep
character identity, relative scale, carried objects and prior page state stable.
No embedded text, numerals, equations, page numbers, signatures or watermarks.
Keep key objects within an 8 percent safe area. Clear natural light, restrained
background detail, readable action, no child photographs or photoreal children.
```

## 11. Image QA

Each story image passes:

- exact count checked programmatically where shapes are rendered from data and by
  two independent human counts where generative art contains objects;
- no hidden, cropped, merged or ambiguous countable object;
- equation and visual state agree;
- character continuity and object state agree with prior page;
- image does not disclose assessment answer through decoration;
- no text baked into image;
- alt text names the mathematical state without giving an answer before required;
- 1× and 2× WebP/AVIF variants exist within asset budget;
- tablet and projector contrast passes.

Prefer programmatic SVG/Canvas for assessment quantities, frames, blocks, graphs,
clocks and shapes. Use generated illustration only for narrative scenes.

## 12. Media release statuses

```text
planned
generated-awaiting-technical-check
accepted-until-flagged
generated-awaiting-visual-review
approved
quarantined
replaced
```

`accepted-until-flagged` and `approved` media enter the runtime manifest. A
server-side exact-clip flag is the production removal signal; local browser state
cannot approve or quarantine media.
