import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v16-alternate-engine"
);
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();

if (!accessToken) {
  throw new Error("Google Application Default Credentials did not return an access token.");
}

const response = await fetch(
  "https://texttospeech.googleapis.com/v1/voices?languageCode=en-US",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-goog-user-project": projectId
    }
  }
);
if (!response.ok) {
  throw new Error(`Voice listing failed with ${response.status}: ${(await response.text()).slice(0, 1200)}`);
}

const result = await response.json();
const voices = (result.voices || [])
  .map(voice => ({
    name: voice.name,
    gender: voice.ssmlGender,
    naturalSampleRateHertz: voice.naturalSampleRateHertz,
    languageCodes: voice.languageCodes
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, "google-en-us-voices-2026-07-29.json");
await writeFile(
  outputPath,
  `${JSON.stringify({ queriedAt: new Date().toISOString(), voices }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify({
  outputPath,
  count: voices.length,
  alternateModelFamilies: {
    Studio: voices.filter(voice => voice.name.includes("-Studio-")),
    Neural2: voices.filter(voice => voice.name.includes("-Neural2-")),
    Wavenet: voices.filter(voice => voice.name.includes("-Wavenet-"))
  }
}, null, 2));
