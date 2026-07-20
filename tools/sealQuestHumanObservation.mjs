import fs from "node:fs";
import path from "node:path";
import {
  sealQuestHumanObservation,
  validateQuestHumanObservation
} from "../src/utils/questHumanAcceptance.js";

const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!inputPath || !fs.existsSync(inputPath)) {
  console.error("Usage: npm run seal:quest-human-observation -- path/to/observation-draft.json");
  process.exit(1);
}

let draft;
try {
  draft = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (error) {
  console.error(`Observation draft is not valid JSON: ${error.message}`);
  process.exit(1);
}

delete draft.evidenceHash;
const validation = validateQuestHumanObservation(draft);
if (validation.status !== "valid") {
  console.error(`Observation draft is incomplete or unsafe: ${validation.failures.join(", ")}`);
  process.exit(1);
}

const sealed = await sealQuestHumanObservation(draft);
// Participant is part of the evidence identity, matching the console and
// aggregate duplicate contract. Paired observations may share one session;
// omitting the participant here made the second valid record look like a file
// collision in the terminal workflow.
const safeName = `${draft.profileId}-${draft.sessionId}-${draft.participant?.anonymousId || "participant"}`
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, "-");
const outputPath = path.resolve("docs/validation/quest-human-acceptance", `${safeName}.json`);
if (fs.existsSync(outputPath)) {
  console.error(`Observation already exists: ${outputPath}`);
  process.exit(1);
}
fs.writeFileSync(outputPath, `${JSON.stringify(sealed, null, 2)}\n`);
console.log(`Sealed anonymised Sound Seekers observation: ${outputPath}`);
